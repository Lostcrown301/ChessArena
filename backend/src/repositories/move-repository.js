import { asc, eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { moves } from '../db/schema.js';

export async function createMove({ gameId, moveNumber, san, fen, playedAt }, database = db) {
  const [move] = await database
    .insert(moves)
    .values({ gameId, moveNumber, san, fen, playedAt })
    .returning();

  return move;
}

export async function listMovesForGame(gameId, database = db) {
  return database
    .select()
    .from(moves)
    .where(eq(moves.gameId, gameId))
    .orderBy(asc(moves.moveNumber));
}
