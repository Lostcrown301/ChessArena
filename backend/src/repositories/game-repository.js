import { desc, eq, or } from 'drizzle-orm';
import { db } from '../db/client.js';
import { games } from '../db/schema.js';

/**
 * Inserts a completed game archive record into PostgreSQL.
 * @param {Object} params - Game properties.
 * @param {Object} [database=db] - Drizzle instance (can be a transaction).
 * @returns {Promise<Object>} The inserted game record.
 */

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

/**
 * Retrieves a single game record by its UUID.
 * @param {string} id - Game UUID.
 * @param {Object} [database=db] - Drizzle instance.
 * @returns {Promise<Object|null>}
 */
export async function findGameById(id, database = db) {
  const [game] = await database.select().from(games).where(eq(games.id, id)).limit(1);
  return game ?? null;
}

/**
 * Lists archived games for a specific player UUID.
 * @param {string} playerId - Player UUID.
 * @param {Object} options - Pagination options.
 * @param {Object} [database=db] - Drizzle instance.
 * @returns {Promise<Array>}
 */
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
