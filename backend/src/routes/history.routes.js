import { Router } from 'express';
import {
  getHistoryAnalysis,
  getHistoryGame,
  getHistoryPgn,
  getHistoryReview,
  listHistory,
} from '../controllers/history-controller.js';

export const historyRouter = Router();

historyRouter.get('/', listHistory);
historyRouter.get('/:gameId', getHistoryGame);
historyRouter.get('/:gameId/pgn', getHistoryPgn);
historyRouter.get('/:gameId/analysis', getHistoryAnalysis);
historyRouter.get('/:gameId/review', getHistoryReview);
