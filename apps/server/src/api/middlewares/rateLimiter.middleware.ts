import rateLimit from 'express-rate-limit';
import { redis } from '../../config/redis';
import { TooManyRequestsError } from '../../utils/errors';

// Generic rate limiter using in-memory store
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new TooManyRequestsError('Too many requests. Please try again later.'));
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new TooManyRequestsError('Too many login attempts. Please try again in 15 minutes.'));
  },
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  handler: (_req, _res, next) => {
    next(new TooManyRequestsError('Upload rate limit exceeded'));
  },
});
