import { Router } from 'express';
import { aiRouter } from './ai.routes.js';
import { analysisRouter } from './analysis.routes.js';
import { gameRouter } from './game.routes.js';
import { healthRouter } from './health.routes.js';
import { historyRouter } from './history.routes.js';
import {
  aiLimiter,
  analysisLimiter,
  gameLimiter,
  healthLimiter,
  historyLimiter,
} from '../middleware/rate-limiter.js';

export const apiRouter = Router();

apiRouter.use('/ai', aiLimiter, aiRouter);
apiRouter.use('/analysis', analysisLimiter, analysisRouter);
apiRouter.use('/games', gameLimiter, gameRouter);
apiRouter.use('/health', healthLimiter, healthRouter);
apiRouter.use('/history', historyLimiter, historyRouter);
