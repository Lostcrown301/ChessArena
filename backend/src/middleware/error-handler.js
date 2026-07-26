import { logger } from '../config/logger.js';
import { sendFailure } from '../utils/api-response.js';

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const statusCode = error.statusCode ?? error.status ?? 500;
  const message = statusCode === 500 ? 'Internal Server Error' : error.message;

  logger.error(
    {
      err: error,
      path: req.path,
      method: req.method,
    },
    'Request failed',
  );

  const code = statusCode === 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR';

  return sendFailure(res, statusCode, code, message);
}
