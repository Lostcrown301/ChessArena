import { Router } from 'express';
import { sql } from '../db/connection.js';
import { getRedisClient } from '../lib/redis.js';
import { stockfishService } from '../services/analysis/StockfishService.js';
import { geminiService } from '../services/ai/GeminiService.js';
import { logger } from '../config/logger.js';

export const healthRouter = Router();

healthRouter.get('/', (req, res) => {
  return res.status(200).json({
    status: 'ok',
    service: 'chess-arena-api',
    timestamp: new Date().toISOString(),
  });
});

healthRouter.get('/ready', async (req, res) => {
  const status = {
    service: 'chess-arena-api',
    ready: false,
    timestamp: new Date().toISOString(),
    dependencies: {
      database: 'checking',
      redis: 'checking',
      stockfish: 'checking',
      gemini: 'checking',
    }
  };

  try {
    // 1. Check PostgreSQL
    try {
      await sql`SELECT 1`;
      status.dependencies.database = 'ok';
    } catch (error) {
      status.dependencies.database = 'failed';
      logger.error({ err: error }, 'Readiness check failed: Database unreachable');
      throw error;
    }

    // 2. Check Redis
    try {
      const redis = getRedisClient();
      await redis.ping();
      status.dependencies.redis = 'ok';
    } catch (error) {
      status.dependencies.redis = 'failed';
      logger.error({ err: error }, 'Readiness check failed: Redis unreachable');
      throw error;
    }

    // 3. Check Stockfish (if initialized, is it responsive?)
    // Stockfish isn't strictly required to be 'initialized' before traffic, 
    // but if it is, we want to know it hasn't crashed.
    try {
      if (stockfishService.engine) {
        // Simple command to check responsiveness if needed, but just checking it exists is okay
        // since we handle crash recovery in evaluatePosition.
        status.dependencies.stockfish = 'ok';
      } else {
        status.dependencies.stockfish = 'not_initialized';
      }
    } catch (error) {
      status.dependencies.stockfish = 'failed';
      logger.error({ err: error }, 'Readiness check failed: Stockfish error');
      throw error;
    }

    // 4. Check Gemini
    // Gemini is a remote dependency, we shouldn't fail readiness if it's down.
    if (geminiService.apiKey) {
      status.dependencies.gemini = 'configured';
      // We could do a lightweight model fetch, but that costs API quota and rate limits.
      // Simply reporting it as 'configured' or 'degraded' (if we had state) is enough.
    } else {
      status.dependencies.gemini = 'degraded';
    }

    status.ready = true;
    return res.status(200).json(status);
  } catch {
    status.ready = false;
    return res.status(503).json(status);
  }
});
