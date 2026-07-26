import { historyService } from '../services/history/HistoryService.js';
import { sendFailure, sendSuccess } from '../utils/api-response.js';

function handleControllerError(error, res, next) {
  if (error.code) {
    return sendFailure(res, error.statusCode ?? 500, error.code, error.message);
  }

  return next(error);
}

function controllerAction(action) {
  return async (req, res, next) => {
    try {
      return sendSuccess(res, 200, await action(req));
    } catch (error) {
      return handleControllerError(error, res, next);
    }
  };
}

export const listHistory = controllerAction((req) =>
  historyService.listHistory({
    page: req.query.page,
    limit: req.query.limit,
    result: req.query.result,
    search: req.query.search,
    sort: req.query.sort,
  }),
);

export const getHistoryGame = controllerAction((req) =>
  historyService.getGame(req.params.gameId),
);

export const getHistoryPgn = controllerAction((req) =>
  historyService.getPgn(req.params.gameId),
);

export const getHistoryAnalysis = controllerAction((req) =>
  historyService.getAnalysis(req.params.gameId),
);

export const getHistoryReview = controllerAction((req) =>
  historyService.getReviewData(req.params.gameId),
);
