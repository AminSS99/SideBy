import { neon } from "@neondatabase/serverless";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env" });
loadEnv({ path: ".env.vercel.development.local" });

const databaseUrl = process.env.DATABASE_URL || "";

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set.");
}

async function run() {
  console.log("Connecting to database to create webhook_subscriptions table...");
  const sql = neon(databaseUrl);

  try {
    // 1. Create table
    await sql`
      CREATE TABLE IF NOT EXISTS "webhook_subscriptions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" text REFERENCES "users"("id") ON DELETE CASCADE,
        "organization_id" text REFERENCES "organizations"("id") ON DELETE CASCADE,
        "workspace_id" uuid REFERENCES "workspaces"("id") ON DELETE CASCADE,
        "url" text NOT NULL,
        "secret" text NOT NULL,
        "event_types" jsonb DEFAULT '[]'::jsonb NOT NULL,
        "active" boolean DEFAULT true NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
      );
    `;
    console.log("Table 'webhook_subscriptions' created or already exists.");

    // 2. Create indexes
    await sql`CREATE INDEX IF NOT EXISTS "webhook_subscriptions_user_idx" ON "webhook_subscriptions" ("user_id");`;
    await sql`CREATE INDEX IF NOT EXISTS "webhook_subscriptions_org_idx" ON "webhook_subscriptions" ("organization_id");`;
    await sql`CREATE INDEX IF NOT EXISTS "webhook_subscriptions_workspace_idx" ON "webhook_subscriptions" ("workspace_id");`;
    console.log("Indexes created successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

run();
