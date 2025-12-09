import app from './app.js';
import { env } from './config/env.js';
import logger from './utils/logger.js';
import { initMinIO } from './utils/minio.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const startServer = async () => {
  try {
    logger.info('Starting CorpVault API server...');

    await prisma.$connect();
    logger.info('Connected to PostgreSQL database');

    await initMinIO();
    logger.info('MinIO initialized');

    app.listen(env.PORT, () => {
      logger.info(`Server running on http://${env.API_URL.split('://')[1]}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
