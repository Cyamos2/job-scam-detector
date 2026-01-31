import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  details?: unknown;
}

/**
 * Custom error class for operational errors
 */
export class OperationalError extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;
  details?: unknown;

  constructor(message: string, statusCode: number = 500, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error response formatter
 */
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId?: string;
}

function formatErrorResponse(error: AppError, requestId?: string): ErrorResponse {
  const code = getErrorCode(error);
  
  return {
    success: false,
    error: {
      code,
      message: error.message || 'An unexpected error occurred',
      ...(process.env.NODE_ENV === 'development' && error.stack ? { stack: error.stack } : {}),
      ...(error.details ? { details: error.details } : {}),
    },
    ...(requestId ? { requestId } : {}),
  };
}

function getErrorCode(error: AppError): string {
  if (error instanceof OperationalError) {
    return error.constructor.name.toUpperCase().replace(/ERROR$/, '');
  }
  
  // Map common errors to codes
  const errorMessage = error.message.toLowerCase();
  if (errorMessage.includes('validation')) return 'VALIDATION_ERROR';
  if (errorMessage.includes('not found')) return 'NOT_FOUND';
  if (errorMessage.includes('unauthorized')) return 'UNAUTHORIZED';
  if (errorMessage.includes('forbidden')) return 'FORBIDDEN';
  if (errorMessage.includes('duplicate')) return 'DUPLICATE';
  if (errorMessage.includes('rate limit')) return 'RATE_LIMIT';
  if (errorMessage.includes('timeout')) return 'TIMEOUT';
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) return 'NETWORK_ERROR';
  
  return 'INTERNAL_ERROR';
}

/**
 * Async handler wrapper to catch async errors
 */
export function asyncHandler<T extends Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: T, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = (req as any).requestId || 'unknown';
  
  // Log the error
  const logData: Record<string, unknown> = {
    requestId,
    method: req.method,
    url: req.originalUrl,
    statusCode: err.statusCode || 500,
    message: err.message,
  };

  if (err.statusCode && err.statusCode < 500) {
    // Client error - log as warning
    logger.warn('Client error', logData);
  } else {
    // Server error - log as error with stack trace
    logger.error('Server error', { ...logData, stack: err.stack });
  }

  // Determine status code
  const statusCode = err.statusCode || 500;

  // Don't leak error details in production for server errors
  const shouldHideDetails = statusCode >= 500 && process.env.NODE_ENV === 'production';
  
  const response = formatErrorResponse(
    shouldHideDetails ? new OperationalError('An unexpected error occurred', 500) : err,
    requestId
  );

  if (shouldHideDetails) {
    delete response.error.details;
  }

  res.status(statusCode).json({
    ...response,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new OperationalError(`Route ${req.method} ${req.originalUrl} not found`, 404));
}

/**
 * Handle unhandled promise rejections
 */
export function setupUnhandledRejectionHandler(): void {
  process.on('unhandledRejection', (reason: unknown) => {
    logger.error('Unhandled Promise Rejection', {
      reason: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
    });
    
    // Graceful shutdown
    process.exit(1);
  });
}

/**
 * Handle uncaught exceptions
 */
export function setupUncaughtExceptionHandler(): void {
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception', {
      message: error.message,
      stack: error.stack,
    });
    
    // Force exit on uncaught exception
    process.exit(1);
  });
}

