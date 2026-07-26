import { sendFailure } from '../utils/api-response.js';

export function notFound(req, res) {
  return sendFailure(
    res,
    404,
    'ROUTE_NOT_FOUND',
    `Route not found: ${req.method} ${req.originalUrl}`,
  );
}
