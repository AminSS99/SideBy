ALTER TABLE "comparisons"
  ADD COLUMN IF NOT EXISTS "facts_count" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "dimensions_count" integer NOT NULL DEFAULT 0;
