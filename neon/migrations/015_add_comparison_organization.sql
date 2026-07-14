-- Saved-comparison organization: favorites, folders, and lightweight tags.
ALTER TABLE comparisons
  ADD COLUMN IF NOT EXISTS is_favorited boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS folder text,
  ADD COLUMN IF NOT EXISTS tags jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS comparisons_clerk_user_favorited_idx
  ON comparisons (clerk_user_id, is_favorited);
