import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { logger } from '../utils/logger.js';

/**
 * Rate limiter configuration for API endpoints
 */
export const apiRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes default
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10), // 100 requests per window
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.',
    },
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      method: req.method,
      url: req.originalUrl,
    });
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later.',
      },
    });
  },
  skip: (req: Request) => {
    // Skip rate limiting for health check endpoints
    return req.originalUrl === '/health' || req.originalUrl === '/api/health';
  },
});

/**
 * Stricter rate limiter for authentication-sensitive endpoints
 */
export const strictRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many attempts, please try again after an hour.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for WHOIS lookup endpoints (to prevent abuse)
 */
export const whoisRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 WHOIS lookups per hour
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'WHOIS lookup rate limit exceeded. Please try again later.',
    },
  },
  keyGenerator: (req: Request) => {
    // Use API key if available, otherwise use IP
    return (req as any).apiKey || req.ip || 'unknown';
  },
});

/**
 * Create a custom rate limiter with custom options
 */
export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string | number;
  skip?: (req: Request) => boolean;
}) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: options.message || 'Too many requests, please try again later.',
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: options.keyGenerator,
    skip: options.skip,
  });
}

/**
 * In-memory store for rate limiting (uses Redis in production)
 * This is a simple in-memory implementation for development
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Check rate limit in-memory (for custom implementations)
 */
export function checkRateLimit(
  key: string,
  windowMs: number,
  max: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    // New or expired entry
    const resetTime = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetTime });
    return { allowed: true, remaining: max - 1, resetTime };
  }

  if (record.count >= max) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  return { allowed: true, remaining: max - record.count, resetTime: record.resetTime };
}

/**
 * Cleanup expired rate limit entries (run periodically)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupRateLimitStore, 5 * 60 * 1000);

