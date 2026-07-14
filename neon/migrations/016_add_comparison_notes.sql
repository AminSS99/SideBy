-- Team comments and decision notes attached to a comparison.
CREATE TABLE IF NOT EXISTS comparison_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comparison_id uuid NOT NULL REFERENCES comparisons(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body text NOT NULL,
  kind text NOT NULL DEFAULT 'comment',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT comparison_notes_kind_check CHECK (kind IN ('comment', 'decision')),
  CONSTRAINT comparison_notes_body_length_check CHECK (char_length(body) BETWEEN 1 AND 2000)
);

CREATE INDEX IF NOT EXISTS comparison_notes_comparison_idx ON comparison_notes(comparison_id, created_at DESC);
CREATE INDEX IF NOT EXISTS comparison_notes_user_idx ON comparison_notes(user_id);
