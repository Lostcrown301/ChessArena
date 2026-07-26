# Database

Chess Arena uses Drizzle ORM with Neon PostgreSQL. The database model intentionally does not include authentication tables. Games are attributed to generated player records that contain only a UUID and display name.

## Commands

```bash
npm run db:migrate --workspace backend
npm run db:seed --workspace backend
npm run db:studio --workspace backend
```

`DATABASE_URL` is loaded from `backend/.env` through `dotenv`. In production, set it to the Neon PostgreSQL connection string in Render.

The seed script inserts local sample data with fixed UUIDs and refuses to run when `NODE_ENV=production`.

## Connection Layer

- [backend/src/db/connection.js](</E:/TBD/Chess Arena/backend/src/db/connection.js>) creates the Neon HTTP SQL client and Drizzle database instance.
- [backend/src/db/client.js](</E:/TBD/Chess Arena/backend/src/db/client.js>) re-exports the default database connection for app code.
- [backend/src/db/schema.js](</E:/TBD/Chess Arena/backend/src/db/schema.js>) owns tables, constraints, indexes, and Drizzle relations.

## Tables

`players`

- Purpose: generated player identities without authentication.
- Primary key: `id`.
- Constraints: non-blank `display_name`.
- Indexes: `display_name`.

`games`

- Purpose: match aggregate root linking white and black players to result metadata.
- Foreign keys: `white_player_id`, `black_player_id`, `winner_id`.
- Constraints: white and black players must differ, result must be allowed, winner must match the result, `ended_at` must not be earlier than `started_at`.
- Indexes: player references, winner reference, `started_at`.

`moves`

- Purpose: append-only move history for each game.
- Foreign keys: `game_id`.
- Constraints: positive `move_number`, non-blank `san`, non-blank `fen`.
- Indexes: `game_id`, unique `(game_id, move_number)`.

`analysis`

- Purpose: optional one-to-one post-game review data.
- Foreign keys: `game_id`.
- Constraints: one analysis per game, accuracy values between 0 and 100, non-negative mistakes and blunders, positive Stockfish depth when present, non-blank best move when present, allowed AI style when present.
- Stockfish fields: `final_evaluation`, `centipawn_score`, `mate_score`, `best_move`, `depth`, `analyzed_at`.
- Gemini fields: `ai_summary`, `ai_tips`, `ai_explanation`, `ai_difficulty`, `ai_style`, `ai_generated_at`.
- Indexes: unique `game_id`.

## Repository Layer

Repository modules live in [backend/src/repositories](</E:/TBD/Chess Arena/backend/src/repositories>).

- `player-repository.js`
- `game-repository.js`
- `move-repository.js`
- `analysis-repository.js`

Repositories keep query code out of route handlers and Socket.IO handlers. They do not implement chess rules or authentication.

## Migrations

The initial migration is [backend/drizzle/0000_initial_database_layer.sql](</E:/TBD/Chess Arena/backend/drizzle/0000_initial_database_layer.sql>). It creates the required tables, constraints, foreign keys, indexes, and PostgreSQL table comments.

[backend/drizzle/0001_stockfish_analysis.sql](</E:/TBD/Chess Arena/backend/drizzle/0001_stockfish_analysis.sql>) adds nullable Stockfish final-position analysis fields to the existing one-to-one analysis record.

[backend/drizzle/0002_gemini_coaching.sql](</E:/TBD/Chess Arena/backend/drizzle/0002_gemini_coaching.sql>) adds nullable Gemini coaching cache fields to the same analysis record.

The migration runner is [backend/scripts/migrate.js](</E:/TBD/Chess Arena/backend/scripts/migrate.js>) and uses Drizzle ORM's Neon HTTP migrator.
