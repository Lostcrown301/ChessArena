import { Router } from 'express';
import {
  createGame,
  getFen,
  getGame,
  getHistory,
  getPgn,
  joinGame,
  requestMove,
} from '../controllers/game-controller.js';

export const gameRouter = Router();

gameRouter.post('/', createGame);
gameRouter.post('/:gameId/join', joinGame);
gameRouter.post('/:gameId/move', requestMove);
gameRouter.get('/:gameId/history', getHistory);
gameRouter.get('/:gameId/pgn', getPgn);
gameRouter.get('/:gameId/fen', getFen);
gameRouter.get('/:gameId', getGame);
