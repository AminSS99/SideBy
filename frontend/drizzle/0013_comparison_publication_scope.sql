-- Publication authorization model (LAUNCH-01, Track 1).
-- Mirrors neon/migrations/020_comparison_publication_scope.sql — see that
-- file for the full rationale. input_scope is server-written at generation
-- time: 'public' only for dedicated public snapshots built from
-- entity-pair-only input; 'unknown' fails closed (no silent grandfathering).
ALTER TABLE comparisons
  ADD COLUMN IF NOT EXISTS input_scope text NOT NULL DEFAULT 'unknown';

ALTER TABLE comparisons
  ADD COLUMN IF NOT EXISTS public_snapshot_source_id uuid;

CREATE INDEX IF NOT EXISTS comparisons_public_scope_idx
  ON comparisons (input_scope, visibility)
  WHERE input_scope = 'public';
