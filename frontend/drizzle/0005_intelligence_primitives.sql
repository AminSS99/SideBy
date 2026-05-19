CREATE EXTENSION IF NOT EXISTS "vector";
--> statement-breakpoint
ALTER TABLE "comparisons"
  ADD COLUMN IF NOT EXISTS "query_embedding" vector(1536);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comparisons_query_embedding_hnsw_idx"
  ON "comparisons" USING hnsw ("query_embedding" vector_cosine_ops);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "comparison_versions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "comparison_id" uuid NOT NULL,
  "version_number" integer NOT NULL,
  "result" jsonb,
  "source_count" integer DEFAULT 0 NOT NULL,
  "overall_confidence" numeric(4, 3),
  "change_summary" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_by" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "comparison_versions" ADD CONSTRAINT "comparison_versions_comparison_id_comparisons_id_fk" FOREIGN KEY ("comparison_id") REFERENCES "public"."comparisons"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comparison_versions_comparison_idx" ON "comparison_versions" ("comparison_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "comparison_versions_number_idx" ON "comparison_versions" ("comparison_id","version_number");
