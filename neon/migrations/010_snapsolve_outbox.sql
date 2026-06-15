CREATE TABLE IF NOT EXISTS "snapsolve_outbox" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "event_id" text NOT NULL UNIQUE,
  "event_type" text NOT NULL,
  "product" text DEFAULT 'sideby' NOT NULL,
  "clerk_user_id" text,
  "product_user_id" text,
  "workspace_id" uuid,
  "email" text,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "status" text DEFAULT 'queued' NOT NULL,
  "attempt_count" integer DEFAULT 0 NOT NULL,
  "last_error" text,
  "next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
  "delivered_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "snapsolve_outbox" ADD CONSTRAINT "snapsolve_outbox_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "snapsolve_outbox_status_next_attempt_idx" ON "snapsolve_outbox" ("status", "next_attempt_at");
CREATE INDEX IF NOT EXISTS "snapsolve_outbox_user_idx" ON "snapsolve_outbox" ("clerk_user_id");
