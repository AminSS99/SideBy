CREATE EXTENSION IF NOT EXISTS "vector";--> statement-breakpoint
ALTER TABLE "comparison_facts"
  ADD COLUMN IF NOT EXISTS "embedding" vector(1536);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "comparison_facts_embedding_hnsw_idx"
  ON "comparison_facts" USING hnsw ("embedding" vector_cosine_ops);
