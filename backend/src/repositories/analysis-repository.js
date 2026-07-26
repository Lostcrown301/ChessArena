import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { analysis } from '../db/schema.js';

export async function createAnalysis(
  {
    analyzedAt,
    aiDifficulty,
    aiExplanation,
    aiGeneratedAt,
    aiStyle,
    aiSummary,
    aiTips,
    bestMove,
    blackAccuracy,
    blunders,
    centipawnScore,
    depth,
    finalEvaluation,
    gameId,
    improvementTips,
    mateScore,
    mistakes,
    summary,
    whiteAccuracy,
  },
  database = db,
) {
  const [record] = await database
    .insert(analysis)
    .values({
      analyzedAt,
      aiDifficulty,
      aiExplanation,
      aiGeneratedAt,
      aiStyle,
      aiSummary,
      aiTips,
      bestMove,
      blackAccuracy,
      blunders,
      centipawnScore,
      depth,
      finalEvaluation,
      gameId,
      improvementTips,
      mateScore,
      whiteAccuracy,
      mistakes,
      summary,
    })
    .returning();

  return record;
}

export async function updateAnalysisByGameId(gameId, values, database = db) {
  const [record] = await database
    .update(analysis)
    .set(values)
    .where(eq(analysis.gameId, gameId))
    .returning();

  return record ?? null;
}

export async function findAnalysisByGameId(gameId, database = db) {
  const [record] = await database
    .select()
    .from(analysis)
    .where(eq(analysis.gameId, gameId))
    .limit(1);
  return record ?? null;
}

export async function findAnalysisById(id, database = db) {
  const [record] = await database.select().from(analysis).where(eq(analysis.id, id)).limit(1);
  return record ?? null;
}
