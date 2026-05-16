ALTER TABLE "comparisons"
  ADD COLUMN IF NOT EXISTS "taxonomy_category" text DEFAULT 'general_research' NOT NULL,
  ADD COLUMN IF NOT EXISTS "taxonomy_status" text DEFAULT 'ready' NOT NULL,
  ADD COLUMN IF NOT EXISTS "taxonomy_confidence" numeric(4, 3),
  ADD COLUMN IF NOT EXISTS "safety_level" text DEFAULT 'standard' NOT NULL,
  ADD COLUMN IF NOT EXISTS "policy_note" text;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comparisons_taxonomy_category_idx" ON "comparisons" ("taxonomy_category");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comparisons_safety_level_idx" ON "comparisons" ("safety_level");
--> statement-breakpoint
ALTER TABLE "query_analytics"
  ADD COLUMN IF NOT EXISTS "taxonomy_status" text,
  ADD COLUMN IF NOT EXISTS "safety_level" text,
  ADD COLUMN IF NOT EXISTS "taxonomy_confidence" numeric(4, 3),
  ADD COLUMN IF NOT EXISTS "policy_note" text,
  ADD COLUMN IF NOT EXISTS "policy_signals" jsonb,
  ADD COLUMN IF NOT EXISTS "source_strategy" jsonb;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "qa_taxonomy_status_idx" ON "query_analytics" ("taxonomy_status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "qa_safety_level_idx" ON "query_analytics" ("safety_level");
