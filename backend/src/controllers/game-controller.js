import { chessService } from '../services/chess/ChessService.js';
import { ChessServiceError } from '../services/chess/ChessValidator.js';
import { sendFailure, sendSuccess } from '../utils/api-response.js';

function handleControllerError(error, res, next) {
  if (error instanceof ChessServiceError || error.code) {
    return sendFailure(res, error.statusCode ?? error.status ?? 500, error.code, error.message);
  }

  return next(error);
}

// Controllers own HTTP concerns only: request shape, status code, and response
// format. They intentionally delegate all chess decisions to ChessService.
function controllerAction(statusCode, action) {
  return async (req, res, next) => {
    try {
      return sendSuccess(res, statusCode, await action(req));
    } catch (error) {
      return handleControllerError(error, res, next);
    }
  };
}

export const createGame = controllerAction(201, (req) =>
  chessService.createGame({
    displayName: req.body?.displayName,
  }),
);

export const joinGame = controllerAction(200, (req) =>
  chessService.joinGame(req.params.gameId, {
    playerId: req.body?.playerId,
    displayName: req.body?.displayName,
  }),
);

export const requestMove = controllerAction(200, (req) =>
  chessService.requestMove(req.params.gameId, {
    playerId: req.body?.playerId,
    move: req.body?.move,
  }),
);

export const getGame = controllerAction(200, (req) => chessService.getGame(req.params.gameId));

export const getHistory = controllerAction(200, (req) =>
  chessService.getHistory(req.params.gameId),
);

export const getPgn = controllerAction(200, (req) => chessService.getPgn(req.params.gameId));

export const getFen = controllerAction(200, (req) => chessService.getFen(req.params.gameId));
