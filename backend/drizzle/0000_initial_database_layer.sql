CREATE EXTENSION IF NOT EXISTS "pgcrypto";
--> statement-breakpoint
CREATE TABLE "players" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "display_name" varchar(80) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "players_display_name_not_blank" CHECK (char_length(trim("display_name")) > 0)
);
--> statement-breakpoint
CREATE TABLE "games" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "white_player_id" uuid NOT NULL,
  "black_player_id" uuid NOT NULL,
  "result" varchar(16) DEFAULT 'ongoing' NOT NULL,
  "winner_id" uuid,
  "opening" varchar(160),
  "pgn" text,
  "started_at" timestamp with time zone DEFAULT now() NOT NULL,
  "ended_at" timestamp with time zone,
  CONSTRAINT "games_distinct_players" CHECK ("white_player_id" <> "black_player_id"),
  CONSTRAINT "games_result_allowed" CHECK ("result" in ('ongoing', 'white_win', 'black_win', 'draw', 'abandoned')),
  CONSTRAINT "games_winner_matches_result" CHECK (
    ("result" = 'white_win' and "winner_id" is not null and "winner_id" = "white_player_id")
    or ("result" = 'black_win' and "winner_id" is not null and "winner_id" = "black_player_id")
    or ("result" in ('ongoing', 'draw', 'abandoned') and "winner_id" is null)
  ),
  CONSTRAINT "games_ended_at_after_started_at" CHECK ("ended_at" is null or "ended_at" >= "started_at")
);
--> statement-breakpoint
CREATE TABLE "moves" (
  "id" serial PRIMARY KEY NOT NULL,
  "game_id" uuid NOT NULL,
  "move_number" integer NOT NULL,
  "san" varchar(32) NOT NULL,
  "fen" text NOT NULL,
  "played_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "moves_move_number_positive" CHECK ("move_number" > 0),
  CONSTRAINT "moves_san_not_blank" CHECK (char_length(trim("san")) > 0),
  CONSTRAINT "moves_fen_not_blank" CHECK (char_length(trim("fen")) > 0)
);
--> statement-breakpoint
CREATE TABLE "analysis" (
  "id" serial PRIMARY KEY NOT NULL,
  "game_id" uuid NOT NULL,
  "white_accuracy" numeric(5, 2),
  "black_accuracy" numeric(5, 2),
  "mistakes" integer DEFAULT 0 NOT NULL,
  "blunders" integer DEFAULT 0 NOT NULL,
  "summary" text,
  "improvement_tips" text,
  CONSTRAINT "analysis_white_accuracy_range" CHECK ("white_accuracy" is null or ("white_accuracy" >= 0 and "white_accuracy" <= 100)),
  CONSTRAINT "analysis_black_accuracy_range" CHECK ("black_accuracy" is null or ("black_accuracy" >= 0 and "black_accuracy" <= 100)),
  CONSTRAINT "analysis_mistakes_non_negative" CHECK ("mistakes" >= 0),
  CONSTRAINT "analysis_blunders_non_negative" CHECK ("blunders" >= 0)
);
--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_white_player_id_players_id_fk" FOREIGN KEY ("white_player_id") REFERENCES "players"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_black_player_id_players_id_fk" FOREIGN KEY ("black_player_id") REFERENCES "players"("id") ON DELETE restrict ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_winner_id_players_id_fk" FOREIGN KEY ("winner_id") REFERENCES "players"("id") ON DELETE set null ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "moves" ADD CONSTRAINT "moves_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE cascade ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "analysis" ADD CONSTRAINT "analysis_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE cascade ON UPDATE cascade;
--> statement-breakpoint
CREATE INDEX "players_display_name_idx" ON "players" USING btree ("display_name");
--> statement-breakpoint
CREATE INDEX "games_white_player_id_idx" ON "games" USING btree ("white_player_id");
--> statement-breakpoint
CREATE INDEX "games_black_player_id_idx" ON "games" USING btree ("black_player_id");
--> statement-breakpoint
CREATE INDEX "games_winner_id_idx" ON "games" USING btree ("winner_id");
--> statement-breakpoint
CREATE INDEX "games_started_at_idx" ON "games" USING btree ("started_at");
--> statement-breakpoint
CREATE INDEX "moves_game_id_idx" ON "moves" USING btree ("game_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "moves_game_move_number_unique" ON "moves" USING btree ("game_id", "move_number");
--> statement-breakpoint
CREATE UNIQUE INDEX "analysis_game_id_unique" ON "analysis" USING btree ("game_id");
--> statement-breakpoint
COMMENT ON TABLE "players" IS 'Generated player identities used to attribute games without authentication.';
--> statement-breakpoint
COMMENT ON TABLE "games" IS 'Game aggregate root linking two players to result, opening, PGN, and lifecycle timestamps.';
--> statement-breakpoint
COMMENT ON TABLE "moves" IS 'Append-only move history for each game, storing SAN and FEN data for later replay and review.';
--> statement-breakpoint
COMMENT ON TABLE "analysis" IS 'Optional one-to-one post-game review data for accuracy, mistakes, blunders, and improvement notes.';
