import rateLimit from 'express-rate-limit';
import { logger } from '../config/logger.js';

const createLimiter = (options) => {
  return rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
      logger.warn({ ip: req.ip, path: req.path, limit: options.max }, 'Rate limit exceeded');
      res.status(options.statusCode).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: options.message,
        },
      });
    },
    ...options,
  });
};

// Very generous for health checks
export const healthLimiter = createLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000,
  message: 'Too many health check requests, please try again later.',
});

// Generous for active gameplay (creating/joining/listing)
export const gameLimiter = createLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  message: 'Too many game requests, please try again later.',
});

// Moderate for history browsing
export const historyLimiter = createLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60,
  message: 'Too many history requests, please try again later.',
});

// Restrictive for CPU-intensive Stockfish analysis
export const analysisLimiter = createLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20,
  message: 'Too many analysis requests, please try again later.',
});

// Most restrictive for expensive Gemini AI requests
export const aiLimiter = createLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,
  message: 'Too many AI coaching requests, please try again later.',
});
