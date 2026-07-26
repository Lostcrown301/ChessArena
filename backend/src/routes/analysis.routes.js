import { Router } from 'express';
import { analyzePosition } from '../controllers/analysis-controller.js';

export const analysisRouter = Router();

analysisRouter.post('/', analyzePosition);
