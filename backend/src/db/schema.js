import { relations, sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

// The players table replaces authentication users for this app. A generated UUID and
// display name are enough to attribute games without introducing account logic.
export const players = pgTable(
  'players',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    displayName: varchar('display_name', { length: 80 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('players_display_name_idx').on(table.displayName),
    check('players_display_name_not_blank', sql`char_length(trim(${table.displayName})) > 0`),
  ],
);

// The games table is the aggregate root for a chess match. It links two player
// identities and stores lifecycle/result metadata without implementing game rules.
export const games = pgTable(
  'games',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    whitePlayerId: uuid('white_player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    blackPlayerId: uuid('black_player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    result: varchar('result', { length: 16 }).notNull().default('ongoing'),
    winnerId: uuid('winner_id').references(() => players.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),
    opening: varchar('opening', { length: 160 }),
    pgn: text('pgn'),
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    endedAt: timestamp('ended_at', { withTimezone: true }),
  },
  (table) => [
    index('games_white_player_id_idx').on(table.whitePlayerId),
    index('games_black_player_id_idx').on(table.blackPlayerId),
    index('games_winner_id_idx').on(table.winnerId),
    index('games_started_at_idx').on(table.startedAt),
    check('games_distinct_players', sql`${table.whitePlayerId} <> ${table.blackPlayerId}`),
    check(
      'games_result_allowed',
      sql`${table.result} in ('ongoing', 'white_win', 'black_win', 'draw', 'abandoned')`,
    ),
    check(
      'games_winner_matches_result',
      sql`(
        (${table.result} = 'white_win' and ${table.winnerId} is not null and ${table.winnerId} = ${table.whitePlayerId})
        or (${table.result} = 'black_win' and ${table.winnerId} is not null and ${table.winnerId} = ${table.blackPlayerId})
        or (${table.result} in ('ongoing', 'draw', 'abandoned') and ${table.winnerId} is null)
      )`,
    ),
    check(
      'games_ended_at_after_started_at',
      sql`${table.endedAt} is null or ${table.endedAt} >= ${table.startedAt}`,
    ),
  ],
);

// The moves table stores the append-only move history for a game. It captures
// notation and board state data while leaving move validation to a later milestone.
export const moves = pgTable(
  'moves',
  {
    id: serial('id').primaryKey(),
    gameId: uuid('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    moveNumber: integer('move_number').notNull(),
    san: varchar('san', { length: 32 }).notNull(),
    fen: text('fen').notNull(),
    playedAt: timestamp('played_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('moves_game_id_idx').on(table.gameId),
    uniqueIndex('moves_game_move_number_unique').on(table.gameId, table.moveNumber),
    check('moves_move_number_positive', sql`${table.moveNumber} > 0`),
    check('moves_san_not_blank', sql`char_length(trim(${table.san})) > 0`),
    check('moves_fen_not_blank', sql`char_length(trim(${table.fen})) > 0`),
  ],
);

// The analysis table stores post-game review output separately from moves. Keeping
// it one-to-one with games avoids recomputing summaries and keeps analysis optional.
export const analysis = pgTable(
  'analysis',
  {
    id: serial('id').primaryKey(),
    gameId: uuid('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    whiteAccuracy: numeric('white_accuracy', { precision: 5, scale: 2 }),
    blackAccuracy: numeric('black_accuracy', { precision: 5, scale: 2 }),
    mistakes: integer('mistakes').notNull().default(0),
    blunders: integer('blunders').notNull().default(0),
    finalEvaluation: numeric('final_evaluation', { precision: 7, scale: 2 }),
    centipawnScore: integer('centipawn_score'),
    mateScore: integer('mate_score'),
    bestMove: varchar('best_move', { length: 8 }),
    depth: integer('depth'),
    analyzedAt: timestamp('analyzed_at', { withTimezone: true }),
    aiSummary: text('ai_summary'),
    aiTips: text('ai_tips'),
    aiExplanation: text('ai_explanation'),
    aiDifficulty: varchar('ai_difficulty', { length: 40 }),
    aiStyle: varchar('ai_style', { length: 24 }),
    aiGeneratedAt: timestamp('ai_generated_at', { withTimezone: true }),
    summary: text('summary'),
    improvementTips: text('improvement_tips'),
  },
  (table) => [
    uniqueIndex('analysis_game_id_unique').on(table.gameId),
    check(
      'analysis_white_accuracy_range',
      sql`${table.whiteAccuracy} is null or (${table.whiteAccuracy} >= 0 and ${table.whiteAccuracy} <= 100)`,
    ),
    check(
      'analysis_black_accuracy_range',
      sql`${table.blackAccuracy} is null or (${table.blackAccuracy} >= 0 and ${table.blackAccuracy} <= 100)`,
    ),
    check('analysis_mistakes_non_negative', sql`${table.mistakes} >= 0`),
    check('analysis_blunders_non_negative', sql`${table.blunders} >= 0`),
    check('analysis_depth_positive', sql`${table.depth} is null or ${table.depth} > 0`),
    check(
      'analysis_best_move_not_blank',
      sql`${table.bestMove} is null or char_length(trim(${table.bestMove})) > 0`,
    ),
    check(
      'analysis_ai_style_allowed',
      sql`${table.aiStyle} is null or ${table.aiStyle} in ('beginner', 'intermediate', 'advanced')`,
    ),
  ],
);

export const playersRelations = relations(players, ({ many }) => ({
  gamesAsWhite: many(games, { relationName: 'whitePlayer' }),
  gamesAsBlack: many(games, { relationName: 'blackPlayer' }),
  wonGames: many(games, { relationName: 'winner' }),
}));

export const gamesRelations = relations(games, ({ one, many }) => ({
  whitePlayer: one(players, {
    fields: [games.whitePlayerId],
    references: [players.id],
    relationName: 'whitePlayer',
  }),
  blackPlayer: one(players, {
    fields: [games.blackPlayerId],
    references: [players.id],
    relationName: 'blackPlayer',
  }),
  winner: one(players, {
    fields: [games.winnerId],
    references: [players.id],
    relationName: 'winner',
  }),
  moves: many(moves),
  analysis: one(analysis, {
    fields: [games.id],
    references: [analysis.gameId],
  }),
}));

export const movesRelations = relations(moves, ({ one }) => ({
  game: one(games, {
    fields: [moves.gameId],
    references: [games.id],
  }),
}));

export const analysisRelations = relations(analysis, ({ one }) => ({
  game: one(games, {
    fields: [analysis.gameId],
    references: [games.id],
  }),
}));
