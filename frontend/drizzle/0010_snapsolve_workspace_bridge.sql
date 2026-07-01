ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "snapsolve_workspace_id" uuid;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "snapsolve_workspace_slug" text;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "snapsolve_workspace_status" text;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN IF NOT EXISTS "snapsolve_sync_error" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workspaces_snapsolve_workspace_idx" ON "workspaces" ("snapsolve_workspace_id");
