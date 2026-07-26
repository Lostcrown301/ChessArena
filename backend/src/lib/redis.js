import Redis from 'ioredis';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

let redisClient;

export function getRedisClient() {
  if (!redisClient) {
    redisClient = new Redis(env.redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    });

    redisClient.on('connect', () => {
      logger.info('Redis connection established');
    });

    redisClient.on('close', () => {
      logger.warn('Redis connection closed');
    });

    redisClient.on('end', () => {
      logger.info('Redis connection ended');
    });

    redisClient.on('reconnecting', () => {
      logger.warn('Redis reconnecting');
    });

    redisClient.on('error', (error) => {
      logger.error({ error }, 'Redis connection error');
    });
  }

  return redisClient;
}

export async function closeRedisClient() {
  if (!redisClient) {
    return;
  }

  try {
    await redisClient.quit();
  } catch (error) {
    logger.error({ err: error }, 'Redis graceful shutdown failed');
    redisClient.disconnect();
  } finally {
    redisClient = undefined;
  }
}
