import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

let redisClient: Redis | null = null;
let redisAvailable = false;

try {
  redisClient = new Redis(env.REDIS_URL, {
    retryStrategy: (times) => {
      if (times > 3) {
        logger.warn('Redis unavailable — running without caching/session store');
        return null; // stop retrying
      }
      return Math.min(times * 50, 2000);
    },
    maxRetriesPerRequest: 1,
    lazyConnect: true,
    connectTimeout: 3000,
  });

  redisClient.on('connect', () => {
    redisAvailable = true;
    logger.info('✅ Redis connected');
  });
  redisClient.on('error', () => {
    if (redisAvailable) {
      redisAvailable = false;
      logger.warn('⚠️  Redis disconnected — caching disabled');
    }
  });

  // Try to connect; don't crash if it fails
  redisClient.connect().catch(() => {
    logger.warn('⚠️  Redis not available — running in degraded mode (no caching/rate-limit store)');
  });
} catch {
  logger.warn('⚠️  Redis initialization failed — running without Redis');
}

// Export a safe redis client (may be null)
export const redis = redisClient as Redis;

// Cache helpers — silently skip if Redis unavailable
export const cache = {
  get: async <T>(key: string): Promise<T | null> => {
    if (!redisAvailable || !redisClient) return null;
    try {
      const val = await redisClient.get(key);
      return val ? JSON.parse(val) : null;
    } catch { return null; }
  },

  set: async (key: string, value: unknown, ttlSeconds = 3600): Promise<void> => {
    if (!redisAvailable || !redisClient) return;
    try {
      await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch { /* silent */ }
  },

  del: async (key: string): Promise<void> => {
    if (!redisAvailable || !redisClient) return;
    try { await redisClient.del(key); } catch { /* silent */ }
  },

  delPattern: async (pattern: string): Promise<void> => {
    if (!redisAvailable || !redisClient) return;
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length) await redisClient.del(...keys);
    } catch { /* silent */ }
  },
};
