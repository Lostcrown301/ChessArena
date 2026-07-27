import { and, asc, desc, eq, ilike, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '../db/client.js';
import { games, players } from '../db/schema.js';

const whitePlayers = alias(players, 'whitePlayer');
const blackPlayers = alias(players, 'blackPlayer');

function buildWhereClause(result, search) {
  const conditions = [];

  if (result && result !== 'all') {
    conditions.push(eq(games.result, result));
  }

  if (search) {
    conditions.push(ilike(sql`${games.id}::text`, `%${search}%`));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

export async function listGamesWithPlayers(
  { limit = 10, offset = 0, result, search, sort = 'desc' } = {},
  database = db,
) {
  return database
    .select({
      id: games.id,
      result: games.result,
      startedAt: games.startedAt,
      endedAt: games.endedAt,
      pgn: games.pgn,
      whitePlayer: {
        id: whitePlayers.id,
        displayName: whitePlayers.displayName,
      },
      blackPlayer: {
        id: blackPlayers.id,
        displayName: blackPlayers.displayName,
      },
    })
    .from(games)
    .innerJoin(whitePlayers, eq(games.whitePlayerId, whitePlayers.id))
    .innerJoin(blackPlayers, eq(games.blackPlayerId, blackPlayers.id))
    .where(buildWhereClause(result, search))
    .orderBy(sort === 'asc' ? asc(games.startedAt) : desc(games.startedAt))
    .limit(limit)
    .offset(offset);
}

export async function countGames({ result, search } = {}, database = db) {
  const [record] = await database
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(games)
    .where(buildWhereClause(result, search));

  return record?.count ?? 0;
}

export async function findGameWithPlayers(gameId, database = db) {
  const [game] = await database
    .select({
      id: games.id,
      result: games.result,
      startedAt: games.startedAt,
      endedAt: games.endedAt,
      pgn: games.pgn,
      whitePlayer: {
        id: whitePlayers.id,
        displayName: whitePlayers.displayName,
      },
      blackPlayer: {
        id: blackPlayers.id,
        displayName: blackPlayers.displayName,
      },
    })
    .from(games)
    .innerJoin(whitePlayers, eq(games.whitePlayerId, whitePlayers.id))
    .innerJoin(blackPlayers, eq(games.blackPlayerId, blackPlayers.id))
    .where(eq(games.id, gameId))
    .limit(1);

  return game ?? null;
}
