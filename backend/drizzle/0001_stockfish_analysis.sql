ALTER TABLE "analysis" ADD COLUMN "final_evaluation" numeric(7, 2);
--> statement-breakpoint
ALTER TABLE "analysis" ADD COLUMN "centipawn_score" integer;
--> statement-breakpoint
ALTER TABLE "analysis" ADD COLUMN "mate_score" integer;
--> statement-breakpoint
ALTER TABLE "analysis" ADD COLUMN "best_move" varchar(8);
--> statement-breakpoint
ALTER TABLE "analysis" ADD COLUMN "depth" integer;
--> statement-breakpoint
ALTER TABLE "analysis" ADD COLUMN "analyzed_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "analysis" ADD CONSTRAINT "analysis_depth_positive" CHECK ("depth" is null or "depth" > 0);
--> statement-breakpoint
ALTER TABLE "analysis" ADD CONSTRAINT "analysis_best_move_not_blank" CHECK ("best_move" is null or char_length(trim("best_move")) > 0);
