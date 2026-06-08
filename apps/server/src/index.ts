import { httpServer } from './app';
import { env } from './config/env';
import { prisma } from './config/database';
import { redis } from './config/redis';
import { logger } from './utils/logger';

const PORT = parseInt(env.PORT, 10);

const start = async () => {
  try {
    // Verify database connection
    await prisma.$connect();
    logger.info('✅ Database connected');

    // Try Redis (non-fatal)
    try {
      if (redis) await redis.ping();
    } catch {
      logger.warn('⚠️  Redis unavailable — continuing without cache');
    }

    httpServer.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 Server running on port ${PORT} in ${env.NODE_ENV} mode`);
      logger.info(`📚 Swagger docs: http://localhost:${PORT}/api/docs`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  await prisma.$disconnect();
  redis.disconnect();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled rejection:', err);
  process.exit(1);
});

start();
