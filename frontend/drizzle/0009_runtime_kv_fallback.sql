CREATE TABLE IF NOT EXISTS "sideby_runtime_kv" (
  "key" text PRIMARY KEY,
  "value" jsonb NOT NULL,
  "expires_at" timestamp with time zone,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "sideby_runtime_kv_expires_at_idx" ON "sideby_runtime_kv" ("expires_at");
