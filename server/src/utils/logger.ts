import winston from 'winston';

/**
 * Custom format for structured logging
 */
const structuredFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Console format for development with colors
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp, stack, ...metadata }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      log += ` ${JSON.stringify(metadata)}`;
    }
    if (stack) {
      log += `\n${stack}`;
    }
    return log;
  })
);

/**
 * Create the Winston logger instance
 */
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: structuredFormat,
  defaultMeta: {
    service: 'scamicide-api',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write all logs to combined.log
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// Helper methods for common log levels
export const loggers = {
  info: (message: string, metadata?: Record<string, unknown>) =>
    logger.info(message, metadata),
  
  warn: (message: string, metadata?: Record<string, unknown>) =>
    logger.warn(message, metadata),
  
  error: (message: string, metadata?: Record<string, unknown> & { stack?: string }) =>
    logger.error(message, metadata),
  
  debug: (message: string, metadata?: Record<string, unknown>) =>
    logger.debug(message, metadata),
  
  // HTTP request logging helper
  httpRequest: (method: string, url: string, statusCode: number, duration: number, requestId?: string) =>
    logger.info('HTTP Request', {
      method,
      url,
      statusCode,
      duration: `${duration}ms`,
      requestId,
    }),
  
  // Security event logging
  securityEvent: (event: string, metadata?: Record<string, unknown>) =>
    logger.warn('Security Event', { event, ...metadata }),
  
  // Database operation logging
  dbOperation: (operation: string, duration: number, success: boolean, metadata?: Record<string, unknown>) =>
    logger.debug('Database Operation', {
      operation,
      duration: `${duration}ms`,
      success,
      ...metadata,
    }),
};

/**
 * Create a child logger with additional context
 */
export function createChildLogger(context: Record<string, unknown>) {
  return logger.child(context);
}

export default logger;

