import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema.js";

const databaseUrl =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  "";

export function createDbClient() {
  if (!databaseUrl) {
    throw new Error(
      "Database URL is not configured. Set DATABASE_URL or POSTGRES_URL.",
    );
  }

  const sql = neon(databaseUrl);
  return drizzle(sql, { schema });
}

export type DbClient = ReturnType<typeof createDbClient>;
