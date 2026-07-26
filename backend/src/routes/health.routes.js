import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (req, res) => {
  return res.status(200).json({
    status: 'ok',
    service: 'chess-arena-api',
    timestamp: new Date().toISOString(),
  });
});
