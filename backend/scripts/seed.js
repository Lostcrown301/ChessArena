import { eq, sql } from 'drizzle-orm';
import { db } from '../src/db/client.js';
import { analysis, games, moves, players } from '../src/db/schema.js';
import { env } from '../src/config/env.js';
import { logger } from '../src/config/logger.js';

const seedIds = {
  whitePlayer: '00000000-0000-4000-8000-000000000001',
  blackPlayer: '00000000-0000-4000-8000-000000000002',
  game: '00000000-0000-4000-8000-000000000101',
};

async function seed() {
  if (env.nodeEnv === 'production') {
    throw new Error('Refusing to seed sample data when NODE_ENV=production');
  }

  logger.info('Seeding Chess Arena database');

  // Keep the seed idempotent by replacing only the known sample game and its cascaded rows.
  await db.delete(games).where(eq(games.id, seedIds.game));

  const [whitePlayer, blackPlayer] = await db
    .insert(players)
    .values([
      { id: seedIds.whitePlayer, displayName: 'Ada' },
      { id: seedIds.blackPlayer, displayName: 'Mikhail' },
    ])
    .onConflictDoUpdate({
      target: players.id,
      set: {
        displayName: sql`excluded.display_name`,
      },
    })
    .returning();

  const startedAt = new Date(Date.now() - 60_000);
  const endedAt = new Date();

  const [game] = await db
    .insert(games)
    .values({
      id: seedIds.game,
      whitePlayerId: whitePlayer.id,
      blackPlayerId: blackPlayer.id,
      result: 'draw',
      opening: 'Sample Opening',
      pgn: 'Sample PGN placeholder',
      startedAt,
      endedAt,
    })
    .onConflictDoUpdate({
      target: games.id,
      set: {
        result: 'draw',
        winnerId: null,
        opening: 'Sample Opening',
        pgn: 'Sample PGN placeholder',
        startedAt,
        endedAt,
      },
    })
    .returning();

  await db.insert(moves).values([
    {
      gameId: game.id,
      moveNumber: 1,
      san: 'e4',
      fen: 'sample-fen-after-move-1',
    },
    {
      gameId: game.id,
      moveNumber: 2,
      san: 'e5',
      fen: 'sample-fen-after-move-2',
    },
  ]);

  await db.insert(analysis).values({
    gameId: game.id,
    whiteAccuracy: '88.50',
    blackAccuracy: '87.25',
    mistakes: 1,
    blunders: 0,
    summary: 'Seed analysis placeholder.',
    improvementTips: 'Seed improvement tips placeholder.',
  });

  logger.info('Chess Arena database seed completed');
}

seed().catch((error) => {
  logger.error({ err: error }, 'Chess Arena database seed failed');
  process.exit(1);
});
