import { findAnalysisById, updateAnalysisByGameId } from '../repositories/analysis-repository.js';
import { findGameById } from '../repositories/game-repository.js';
import { listMovesForGame } from '../repositories/move-repository.js';
import { GeminiServiceError, explanationMapper } from '../services/ai/ExplanationMapper.js';
import { geminiService } from '../services/ai/GeminiService.js';
import { promptBuilder } from '../services/ai/PromptBuilder.js';
import { sendFailure, sendSuccess } from '../utils/api-response.js';

const DEFAULT_STYLE = 'beginner';

export async function explainAnalysis(req, res, next) {
  try {
    const style = promptBuilder.validateStyle(req.body?.style ?? DEFAULT_STYLE);
    const analysisId = req.body?.analysisId;

    if (analysisId) {
      return explainPersistedAnalysis({
        analysisId,
        res,
        style,
        playerColor: req.body?.playerColor,
      });
    }

    if (!req.body?.context) {
      return sendFailure(
        res,
        400,
        'INVALID_ANALYSIS',
        'Provide an analysisId or analysis context to explain.',
      );
    }

    const explanation = await geminiService.explain(req.body.context, { style });
    return sendSuccess(res, 200, explanation);
  } catch (error) {
    if (error instanceof GeminiServiceError || error.code) {
      return sendFailure(
        res,
        error.statusCode ?? 500,
        error.code ?? 'AI_EXPLANATION_FAILED',
        error.message ?? 'AI explanation failed.',
      );
    }

    return next(error);
  }
}

async function explainPersistedAnalysis({ analysisId, playerColor, res, style }) {
  const parsedAnalysisId = Number(analysisId);

  if (!Number.isInteger(parsedAnalysisId) || parsedAnalysisId < 1) {
    return sendFailure(
      res,
      400,
      'INVALID_ANALYSIS',
      'analysisId must reference an analysis record.',
    );
  }

  const analysisRecord = await findAnalysisById(parsedAnalysisId);

  if (!analysisRecord) {
    return sendFailure(res, 404, 'INVALID_ANALYSIS', 'No analysis record was found.');
  }

  const cachedExplanation =
    analysisRecord.aiStyle === style ? explanationMapper.mapCached(analysisRecord) : null;

  if (cachedExplanation) {
    return sendSuccess(res, 200, cachedExplanation);
  }

  const context = await buildContextFromAnalysis(analysisRecord, { playerColor });
  const explanation = await geminiService.explain(context, { style });

  await updateAnalysisByGameId(
    analysisRecord.gameId,
    explanationMapper.toDatabaseValues(explanation),
  );

  return sendSuccess(res, 200, explanation);
}

async function buildContextFromAnalysis(analysisRecord, { playerColor }) {
  const [game, moveHistory] = await Promise.all([
    findGameById(analysisRecord.gameId),
    listMovesForGame(analysisRecord.gameId),
  ]);
  const finalMove = moveHistory.at(-1);

  return {
    currentFen: finalMove?.fen ?? null,
    pgn: game?.pgn ?? null,
    stockfish: {
      evaluation: analysisRecord.finalEvaluation,
      centipawns: analysisRecord.centipawnScore,
      mate: analysisRecord.mateScore,
      bestMove: analysisRecord.bestMove,
      depth: analysisRecord.depth,
      pv: analysisRecord.bestMove ? [analysisRecord.bestMove] : [],
    },
    gameResult: game?.result ?? null,
    playerColor: playerColor ?? null,
  };
}
