import { Request, Response, NextFunction } from 'express';
import { ApiResponseCode } from '../models';
import { createErrorResponse } from '../models/responses';
import { logger } from '../utils/logger';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

/**
 * In-memory rate limiting middleware
 * Tracks requests per IP address or custom key
 */
export class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private options: Required<RateLimitOptions>;

  constructor(options: RateLimitOptions) {
    this.options = {
      windowMs: options.windowMs,
      maxRequests: options.maxRequests,
      message: options.message || 'Too many requests, please try again later',
      skipSuccessfulRequests: options.skipSuccessfulRequests || false,
      skipFailedRequests: options.skipFailedRequests || false,
      keyGenerator: options.keyGenerator || this.defaultKeyGenerator,
    };

    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  private defaultKeyGenerator(req: Request): string {
    return req.ip || req.connection.remoteAddress || 'unknown';
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  private shouldSkip(req: Request, res: Response): boolean {
    if (this.options.skipSuccessfulRequests && res.statusCode < 400) {
      return true;
    }
    if (this.options.skipFailedRequests && res.statusCode >= 400) {
      return true;
    }
    return false;
  }

  public middleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const key = this.options.keyGenerator(req);
        const now = Date.now();
        
        let entry = this.store.get(key);
        
        // Create new entry if doesn't exist or window expired
        if (!entry || now > entry.resetTime) {
          entry = {
            count: 0,
            resetTime: now + this.options.windowMs,
          };
          this.store.set(key, entry);
        }

        // Check if limit exceeded
        if (entry.count >= this.options.maxRequests) {
          logger.warn('Rate limit exceeded', {
            key,
            count: entry.count,
            maxRequests: this.options.maxRequests,
            resetTime: new Date(entry.resetTime).toISOString(),
            userAgent: req.get('User-Agent'),
            url: req.originalUrl,
          });

          const response = createErrorResponse(
            ApiResponseCode.TOO_MANY_REQUESTS,
            this.options.message
          );

          // Add rate limit headers
          res.set({
            'X-RateLimit-Limit': this.options.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': entry.resetTime.toString(),
            'Retry-After': Math.ceil((entry.resetTime - now) / 1000).toString(),
          });

          res.status(429).json(response);
          return;
        }

        // Increment counter
        entry.count++;

        // Set rate limit headers
        res.set({
          'X-RateLimit-Limit': this.options.maxRequests.toString(),
          'X-RateLimit-Remaining': (this.options.maxRequests - entry.count).toString(),
          'X-RateLimit-Reset': entry.resetTime.toString(),
        });

        // Handle skip conditions after response finishes
        res.on('finish', () => {
          if (this.shouldSkip(req, res)) {
            entry!.count--;
          }
        });

        next();
      } catch (error) {
        logger.error('Rate limiting middleware error', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        next(); // Continue on error
      }
    };
  }
}

/**
 * Create rate limiter for general API endpoints
 */
export const createGeneralRateLimit = () => new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
  message: 'Too many requests from this IP, please try again later',
});

/**
 * Create rate limiter for authentication endpoints
 */
export const createAuthRateLimit = () => new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 login attempts per 15 minutes
  message: 'Too many authentication attempts, please try again later',
  skipSuccessfulRequests: true,
});

/**
 * Create rate limiter for create/update operations
 */
export const createMutationRateLimit = () => new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 mutations per minute
  message: 'Too many create/update requests, please slow down',
});

/**
 * Create rate limiter per user
 */
export const createUserRateLimit = () => new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 20, // 20 requests per minute per user
  message: 'You are making requests too frequently, please slow down',
  keyGenerator: (req: Request) => req.user?.id || req.ip || 'anonymous',
});

// Pre-configured instances
export const generalRateLimit = createGeneralRateLimit().middleware();
export const authRateLimit = createAuthRateLimit().middleware();
export const mutationRateLimit = createMutationRateLimit().middleware();
export const userRateLimit = createUserRateLimit().middleware();

export default {
  RateLimiter,
  createGeneralRateLimit,
  createAuthRateLimit,
  createMutationRateLimit,
  createUserRateLimit,
  generalRateLimit,
  authRateLimit,
  mutationRateLimit,
  userRateLimit,
};
