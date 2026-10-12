-- In-flight comparison deduplication: at most one queued/running job per
-- (user, workspace, project, canonical intent).
--
-- The INSERT becomes the atomic arbiter when a distributed lock expires
-- between verification and the write: a concurrent insert with the same
-- intent_key fails with a unique violation (23505) instead of creating a
-- duplicate job, and the loser adopts the winner's row.
--
-- Pre-migration rows keep NULL intent_key. Postgres unique indexes never
-- treat NULLs as equal, so no backfill is required for correctness.
ALTER TABLE comparisons ADD COLUMN IF NOT EXISTS intent_key text;

CREATE UNIQUE INDEX IF NOT EXISTS comparisons_intent_inflight_uniq
  ON comparisons (intent_key)
  WHERE status IN ('queued', 'running');
