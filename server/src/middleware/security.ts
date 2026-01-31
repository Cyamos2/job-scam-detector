import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import { loggers } from '../utils/logger.js';

/**
 * Security headers middleware using Helmet
 * Configures various HTTP security headers
 */
export const securityHeaders = (helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", 'https://api.sentry.io'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
    reportOnly: process.env.NODE_ENV === 'production', // Set to false in production after testing
  },
  
  // Prevent XSS attacks
  xssFilter: true,
  
  // Prevent MIME type sniffing
  noSniff: true,
  
  // Prevent clickjacking
  frameguard: {
    action: 'deny',
  },
  
  // Hide X-Powered-By header
  hidePoweredBy: true,
  
  // HSTS (HTTP Strict Transport Security)
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true,
  },
  
  // DNS prefetch control
  dnsPrefetchControl: {
    allow: false,
  },
  
  // Referrer policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
  
  // Permissions policy (limit browser features)
  permissionsPolicy: {
    permissions: [
      // Allow camera, microphone, geolocation only with user consent
      // Deny all others by default
      // Specific policies would be added based on app needs
    ],
  }
}) as any);


/**
 * CORS configuration
 */
export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map(o => o.trim());
    
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Log blocked CORS attempts in development
    if (process.env.NODE_ENV !== 'production') {
      loggers.debug('CORS blocked origin', { origin, allowedOrigins });
    }
    
    // Block by default
    return callback(new Error('Not allowed by CORS'), false);
  },
  
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID', 'RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
  credentials: true,
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

/**
 * Request ID middleware
 * Adds a unique ID to each request for tracing
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = (req.headers['x-request-id'] as string) || 
    generateRequestId();
  
  (req as any).requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  
  next();
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Trust proxy middleware
 * Should be set to true if behind a reverse proxy
 */
export function trustProxy(req: Request, _res: Response, next: NextFunction): void {
  // Enable if behind proxy (nginx, load balancer, etc.)
  const trustProxy = process.env.TRUST_PROXY === 'true';
  if (trustProxy) {
    (req as any).trustProxy = true;
  }
  next();
}

/**
 * Security logging middleware
 */
export function securityLogging(req: Request, _res: Response, next: NextFunction): void {
  // Log suspicious requests
  const suspiciousPatterns = [
    /\.\.\//,           // Path traversal
    /(\.js|\.env|\.git)/i, // Access to sensitive files
    /<script>/i,        // XSS attempts
    /union\s+select/i,  // SQL injection
    /alert\s*\(/i,      // XSS attempts
  ];
  
  const url = req.originalUrl;
  const method = req.method;
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(url)) {
      loggers.securityEvent('Suspicious request pattern detected', {
        method,
        url,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        pattern: pattern.source,
      });
      break;
    }
  }
  
  next();
}

/**
 * Validate content type for POST/PUT/PATCH requests
 */
export function validateContentType(req: Request, _res: Response, next: NextFunction): void {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      return next(new Error('Content-Type must be application/json'));
    }
  }
  next();
}

/**
 * Remove sensitive data from logs
 */
export function sanitizeForLogging(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'apiKey',
    'authorization',
    'accessToken',
    'refreshToken',
  ];
  
  const sanitized = { ...data };
  
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

