import { analysisQueue } from '../services/analysis/AnalysisQueue.js';
import { AnalysisServiceError } from '../services/analysis/EvaluationMapper.js';
import { stockfishService } from '../services/analysis/StockfishService.js';
import { sendFailure, sendSuccess } from '../utils/api-response.js';

export async function analyzePosition(req, res, next) {
  try {
    const result = await analysisQueue.enqueue(() =>
      stockfishService.evaluatePosition({
        depth: req.body?.depth,
        fen: req.body?.fen,
        timeLimit: req.body?.timeLimit,
      }),
    );

    return sendSuccess(res, 200, result);
  } catch (error) {
    if (error instanceof AnalysisServiceError || error.code) {
      return sendFailure(
        res,
        error.statusCode ?? 500,
        error.code ?? 'ANALYSIS_FAILED',
        error.message ?? 'Analysis failed.',
      );
    }

    return next(error);
  }
}
