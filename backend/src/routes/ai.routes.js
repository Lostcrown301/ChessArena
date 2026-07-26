import { Router } from 'express';
import { explainAnalysis } from '../controllers/ai-controller.js';

export const aiRouter = Router();

aiRouter.post('/explain', explainAnalysis);
