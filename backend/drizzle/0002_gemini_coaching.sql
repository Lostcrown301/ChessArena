ALTER TABLE "analysis" ADD COLUMN "ai_summary" text;
--> statement-breakpoint
ALTER TABLE "analysis" ADD COLUMN "ai_tips" text;
--> statement-breakpoint
ALTER TABLE "analysis" ADD COLUMN "ai_explanation" text;
--> statement-breakpoint
ALTER TABLE "analysis" ADD COLUMN "ai_difficulty" varchar(40);
--> statement-breakpoint
ALTER TABLE "analysis" ADD COLUMN "ai_style" varchar(24);
--> statement-breakpoint
ALTER TABLE "analysis" ADD COLUMN "ai_generated_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "analysis" ADD CONSTRAINT "analysis_ai_style_allowed" CHECK ("ai_style" is null or "ai_style" in ('beginner', 'intermediate', 'advanced'));
