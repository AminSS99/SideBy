ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "paddle_customer_id" text;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_settings" (
  "user_id" text PRIMARY KEY NOT NULL,
  "preferences" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "notification_prefs" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "default_ai_model" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workspace_settings" (
  "workspace_id" uuid PRIMARY KEY NOT NULL,
  "branding" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "default_dimensions" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "notification_prefs" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "default_visibility" "visibility" DEFAULT 'private' NOT NULL,
  "shared_knowledge_base" boolean DEFAULT true NOT NULL,
  "updated_by" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "api_keys" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text,
  "organization_id" text,
  "workspace_id" uuid,
  "name" text NOT NULL,
  "key_prefix" text NOT NULL,
  "key_hash" text NOT NULL UNIQUE,
  "scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "last_used_at" timestamp with time zone,
  "revoked_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "prompt_templates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workspace_id" uuid,
  "organization_id" text,
  "created_by" text NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "system_prompt" text NOT NULL,
  "user_prompt_template" text,
  "variables_schema" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "is_default" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "team_invitations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" text,
  "workspace_id" uuid,
  "email" text NOT NULL,
  "role" "role" DEFAULT 'member' NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "clerk_invitation_id" text,
  "invited_by" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "workspace_settings" ADD CONSTRAINT "workspace_settings_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "prompt_templates" ADD CONSTRAINT "prompt_templates_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "prompt_templates" ADD CONSTRAINT "prompt_templates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "team_invitations" ADD CONSTRAINT "team_invitations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "team_invitations" ADD CONSTRAINT "team_invitations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_keys_user_idx" ON "api_keys" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_keys_org_idx" ON "api_keys" ("organization_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_keys_workspace_idx" ON "api_keys" ("workspace_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_keys_prefix_idx" ON "api_keys" ("key_prefix");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "prompt_templates_workspace_idx" ON "prompt_templates" ("workspace_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "prompt_templates_org_idx" ON "prompt_templates" ("organization_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "prompt_templates_created_by_idx" ON "prompt_templates" ("created_by");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "team_invitations_org_idx" ON "team_invitations" ("organization_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "team_invitations_workspace_idx" ON "team_invitations" ("workspace_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "team_invitations_email_idx" ON "team_invitations" ("email");
