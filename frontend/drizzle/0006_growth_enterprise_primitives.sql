CREATE TABLE IF NOT EXISTS "watchlists" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "workspace_id" uuid,
  "created_by" text NOT NULL,
  "name" text NOT NULL,
  "query" text NOT NULL,
  "cadence" text DEFAULT 'weekly' NOT NULL,
  "alert_threshold" numeric(4, 3) DEFAULT '0.100' NOT NULL,
  "channels" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "last_run_at" timestamp with time zone,
  "next_run_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "decision_matrices" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "comparison_id" uuid,
  "user_id" text NOT NULL,
  "name" text NOT NULL,
  "weights" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "result" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "source_feedback" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "comparison_id" uuid,
  "user_id" text,
  "source_url" text NOT NULL,
  "vote" integer NOT NULL,
  "reason" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "watchlists" ADD CONSTRAINT "watchlists_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "decision_matrices" ADD CONSTRAINT "decision_matrices_comparison_id_comparisons_id_fk" FOREIGN KEY ("comparison_id") REFERENCES "public"."comparisons"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "source_feedback" ADD CONSTRAINT "source_feedback_comparison_id_comparisons_id_fk" FOREIGN KEY ("comparison_id") REFERENCES "public"."comparisons"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "watchlists_workspace_idx" ON "watchlists" ("workspace_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "watchlists_created_by_idx" ON "watchlists" ("created_by");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "watchlists_next_run_idx" ON "watchlists" ("next_run_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "decision_matrices_comparison_idx" ON "decision_matrices" ("comparison_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "decision_matrices_user_idx" ON "decision_matrices" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "source_feedback_comparison_idx" ON "source_feedback" ("comparison_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "source_feedback_url_idx" ON "source_feedback" ("source_url");
