import { Request, Response, NextFunction } from 'express';
import RateLimit from '../models/RateLimit.model';
import config from '../config/env.config';

/**
 * Rate Limiting Middleware
 * Limits requests per IP address to prevent brute force attacks
 */

/**
 * Parse time string to milliseconds
 * Examples: "15m" -> 900000, "1h" -> 3600000
 */
const parseTimeToMs = (timeStr: string): number => {
  const value = parseInt(timeStr);
  const unit = timeStr.slice(-1);

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return value; // Assume milliseconds if no unit
  }
};

/**
 * Get client IP address from request
 */
const getClientIp = (req: Request): string => {
  // Check for IP in various headers (for proxies/load balancers)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = (forwarded as string).split(',');
    return ips[0].trim();
  }

  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return realIp as string;
  }

  // Fallback to socket IP
  return req.ip || req.socket.remoteAddress || 'unknown';
};

/**
 * Rate limiting middleware
 * Limits requests to configured max per time window
 */
export const rateLimitMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const ip = getClientIp(req);
    const endpoint = req.path;

    // Get rate limit configuration
    const maxRequests = config.rateLimitMaxRequests;
    const windowMs = parseTimeToMs(config.rateLimitWindow);

    // Calculate window start time
    const now = new Date();
    const windowStart = new Date(now.getTime() - windowMs);

    // Find or create rate limit record
    let rateLimitRecord = await RateLimit.findOne({
      ip,
      endpoint,
      windowStart: { $gte: windowStart },
    });

    if (!rateLimitRecord) {
      // Create new rate limit record
      const expiresAt = new Date(now.getTime() + windowMs);

      rateLimitRecord = await RateLimit.create({
        ip,
        endpoint,
        requestCount: 1,
        windowStart: now,
        expiresAt,
      });

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', maxRequests - 1);
      res.setHeader('X-RateLimit-Reset', Math.floor(expiresAt.getTime() / 1000));

      return next();
    }

    // Check if limit exceeded
    if (rateLimitRecord.requestCount >= maxRequests) {
      const resetTime = new Date(rateLimitRecord.windowStart.getTime() + windowMs);
      const retryAfterSeconds = Math.ceil((resetTime.getTime() - now.getTime()) / 1000);

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', Math.floor(resetTime.getTime() / 1000));
      res.setHeader('Retry-After', retryAfterSeconds);

      console.warn(`⚠️  Rate limit exceeded for IP: ${ip} on ${endpoint}`);

      res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
          retryAfter: retryAfterSeconds,
        },
      });
      return;
    }

    // Increment request count
    rateLimitRecord.requestCount += 1;
    await rateLimitRecord.save();

    // Add rate limit headers
    const resetTime = new Date(rateLimitRecord.windowStart.getTime() + windowMs);
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', maxRequests - rateLimitRecord.requestCount);
    res.setHeader('X-RateLimit-Reset', Math.floor(resetTime.getTime() / 1000));

    next();
  } catch (error) {
    console.error('Error in rate limit middleware:', error);
    // On error, allow request to proceed (fail open for availability)
    next();
  }
};

/**
 * Create rate limit middleware with custom limits
 * @param maxRequests - Maximum requests allowed
 * @param windowMs - Time window in milliseconds
 */
export const createRateLimiter = (maxRequests: number, windowMs: number) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ip = getClientIp(req);
      const endpoint = req.path;

      const now = new Date();
      const windowStart = new Date(now.getTime() - windowMs);

      let rateLimitRecord = await RateLimit.findOne({
        ip,
        endpoint,
        windowStart: { $gte: windowStart },
      });

      if (!rateLimitRecord) {
        const expiresAt = new Date(now.getTime() + windowMs);

        rateLimitRecord = await RateLimit.create({
          ip,
          endpoint,
          requestCount: 1,
          windowStart: now,
          expiresAt,
        });

        res.setHeader('X-RateLimit-Limit', maxRequests);
        res.setHeader('X-RateLimit-Remaining', maxRequests - 1);
        res.setHeader('X-RateLimit-Reset', Math.floor(expiresAt.getTime() / 1000));

        return next();
      }

      if (rateLimitRecord.requestCount >= maxRequests) {
        const resetTime = new Date(rateLimitRecord.windowStart.getTime() + windowMs);
        const retryAfterSeconds = Math.ceil((resetTime.getTime() - now.getTime()) / 1000);

        res.setHeader('X-RateLimit-Limit', maxRequests);
        res.setHeader('X-RateLimit-Remaining', 0);
        res.setHeader('X-RateLimit-Reset', Math.floor(resetTime.getTime() / 1000));
        res.setHeader('Retry-After', retryAfterSeconds);

        console.warn(`⚠️  Rate limit exceeded for IP: ${ip} on ${endpoint}`);

        res.status(429).json({
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
            retryAfter: retryAfterSeconds,
          },
        });
        return;
      }

      rateLimitRecord.requestCount += 1;
      await rateLimitRecord.save();

      const resetTime = new Date(rateLimitRecord.windowStart.getTime() + windowMs);
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', maxRequests - rateLimitRecord.requestCount);
      res.setHeader('X-RateLimit-Reset', Math.floor(resetTime.getTime() / 1000));

      next();
    } catch (error) {
      console.error('Error in custom rate limiter:', error);
      next();
    }
  };
};

/**
 * Strict rate limiter for sensitive endpoints (e.g., OTP resend)
 * 10 requests per 15 minutes
 */
export const strictRateLimiter = createRateLimiter(10, 15 * 60 * 1000);

/**
 * Moderate rate limiter for auth endpoints
 * 50 requests per 15 minutes
 */
export const moderateRateLimiter = createRateLimiter(50, 15 * 60 * 1000);
