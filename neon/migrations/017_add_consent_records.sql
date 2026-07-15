-- Immutable, authenticated consent audit trail for privacy choices.
CREATE TABLE IF NOT EXISTS consent_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  analytics boolean NOT NULL,
  policy_version text NOT NULL,
  source text NOT NULL,
  global_privacy_control boolean NOT NULL DEFAULT false,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT consent_records_source_check CHECK (source IN ('banner', 'settings'))
);

CREATE INDEX IF NOT EXISTS consent_records_user_idx ON consent_records(clerk_user_id);
CREATE INDEX IF NOT EXISTS consent_records_created_at_idx ON consent_records(created_at DESC);
