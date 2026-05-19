ALTER TABLE "watchlists" ADD COLUMN "comparison_id" uuid;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "watchlists" ADD CONSTRAINT "watchlists_comparison_id_comparisons_id_fk" FOREIGN KEY ("comparison_id") REFERENCES "public"."comparisons"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "watchlists_comparison_idx" ON "watchlists" ("comparison_id");
