-- Publication authorization model (LAUNCH-01, Track 1).
--
-- Why: the previous gate proved PIPELINE PROVENANCE (completed ai_runs rows)
-- and CLAIM ATTRIBUTION (http(s) fact citations). Neither establishes the
-- absence of private user context — briefs, priorities, uploads, notes — in
-- the published question, summaries, facts or verdict. RegEx/field-stripping
-- of user text proves nothing, so eligibility is re-derived from a fact the
-- server wrote at generation time instead:
--
--   input_scope = 'public'  -> the comparison was generated as a dedicated
--     public snapshot whose input was constructed by the server itself from
--     the source record's frozen entity names only ("A vs B", no user brief,
--     no context, no notes, no uploads). No private user text ever entered
--     the pipeline for this record.
--
--   input_scope = 'unknown' -> everything else, including: records created
--     before this model, reuse-materialized records, refreshed records that
--     did not originate as snapshots, and any path the later audit cannot
--     attribute. Fail closed: such records are denied publication and stop
--     being served to anonymous readers. No grandfathering into public.
--
-- Editing an existing migration is forbidden (checksummed ledger); the
-- default below is what keeps pre-migration rows unpublishable.
ALTER TABLE comparisons
  ADD COLUMN IF NOT EXISTS input_scope text NOT NULL DEFAULT 'unknown';

ALTER TABLE comparisons
  ADD COLUMN IF NOT EXISTS public_snapshot_source_id uuid;

CREATE INDEX IF NOT EXISTS comparisons_public_scope_idx
  ON comparisons (input_scope, visibility)
  WHERE input_scope = 'public';
