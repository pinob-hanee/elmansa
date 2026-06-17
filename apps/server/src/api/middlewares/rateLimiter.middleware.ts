import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redis } from '../../config/redis';
import { TooManyRequestsError } from '../../utils/errors';

// Generic rate limiter using Redis store for multi-instance scalability
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  handler: (_req, _res, next) => {
    next(new TooManyRequestsError('Too many requests. Please try again later.'));
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  handler: (_req, _res, next) => {
    next(new TooManyRequestsError('Too many login attempts. Please try again in 15 minutes.'));
  },
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  handler: (_req, _res, next) => {
    next(new TooManyRequestsError('Upload rate limit exceeded'));
  },
});
