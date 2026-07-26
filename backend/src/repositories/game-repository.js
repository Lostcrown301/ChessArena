import { desc, eq, or } from 'drizzle-orm';
import { db } from '../db/client.js';
import { games } from '../db/schema.js';

export async function createGame(
  { id, whitePlayerId, blackPlayerId, result, winnerId, opening, pgn, startedAt, endedAt },
  database = db,
) {
  const values = {
    whitePlayerId,
    blackPlayerId,
    result,
    winnerId,
    opening,
    pgn,
    startedAt,
    endedAt,
  };

  if (id) {
    values.id = id;
  }

  const [game] = await database.insert(games).values(values).returning();

  return game;
}

export async function findGameById(id, database = db) {
  const [game] = await database.select().from(games).where(eq(games.id, id)).limit(1);
  return game ?? null;
}

export async function listGamesForPlayer(playerId, { limit = 50, offset = 0 } = {}, database = db) {
  return database
    .select()
    .from(games)
    .where(or(eq(games.whitePlayerId, playerId), eq(games.blackPlayerId, playerId)))
    .orderBy(desc(games.startedAt))
    .limit(limit)
    .offset(offset);
}

export async function updateGameRecord(id, values, database = db) {
  const [game] = await database.update(games).set(values).where(eq(games.id, id)).returning();
  return game ?? null;
}
