import { Router } from 'express';
import { aiRouter } from './ai.routes.js';
import { analysisRouter } from './analysis.routes.js';
import { gameRouter } from './game.routes.js';
import { healthRouter } from './health.routes.js';
import { historyRouter } from './history.routes.js';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/ai', aiRouter);
apiRouter.use('/analysis', analysisRouter);
apiRouter.use('/games', gameRouter);
apiRouter.use('/history', historyRouter);
