import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { config as loadEnv } from "dotenv";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Minimal database surface the migrator needs. The real Neon HTTP client
 * satisfies this structurally; tests substitute a mock with identical
 * transactional discipline.
 */
export type MigrationDb = Pick<NeonQueryFunction<false, false>, "query" | "transaction">;

loadEnv({ path: ".env" });
loadEnv({ path: "../.env" });

const databaseUrl =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  "";

if (!databaseUrl) {
  throw new Error("Set DATABASE_URL or POSTGRES_URL before running Neon migrations.");
}

const repoRoot = path.resolve(process.cwd(), "..");
const migrationsDir = path.join(repoRoot, "neon", "migrations");

if (!existsSync(migrationsDir)) {
  throw new Error(`Migration directory not found: ${migrationsDir}`);
}

type AppliedMigration = {
  id: string;
  checksum: string;
};

const checksum = (content: string) =>
  createHash("sha256").update(content).digest("hex");

const normalizeSql = (content: string) =>
  content
    .replace(/\r\n/g, "\n")
    .replace(/-->\s*statement-breakpoint/g, "\n");

const splitSqlStatements = (content: string) => {
  const statements: string[] = [];
  let current = "";
  let dollarQuoteTag: string | null = null;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let lineComment = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    const next = content[i + 1];
    current += char;

    if (lineComment) {
      if (char === "\n") lineComment = false;
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote && !dollarQuoteTag && char === "-" && next === "-") {
      lineComment = true;
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote && char === "$") {
      const match = content.slice(i).match(/^\$[a-zA-Z_][a-zA-Z0-9_]*\$|^\$\$/);
      if (match) {
        const tag = match[0];
        if (dollarQuoteTag === tag) {
          current += content.slice(i + 1, i + tag.length);
          i += tag.length - 1;
          dollarQuoteTag = null;
        } else if (!dollarQuoteTag) {
          current += content.slice(i + 1, i + tag.length);
          i += tag.length - 1;
          dollarQuoteTag = tag;
        }
        continue;
      }
    }

    if (dollarQuoteTag) continue;

    if (!inDoubleQuote && char === "'" && content[i - 1] !== "\\") {
      inSingleQuote = !inSingleQuote;
      continue;
    }

    if (!inSingleQuote && char === '"' && content[i - 1] !== "\\") {
      inDoubleQuote = !inDoubleQuote;
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote && char === ";") {
      const statement = current.trim();
      if (statement) statements.push(statement);
      current = "";
    }
  }

  const tail = current.trim();
  if (tail) statements.push(tail);
  return statements;
};

const LEDGER_UPSERT_SQL = `
  insert into sideby_schema_migrations (id, filename, checksum)
  values ($1, $2, $3)
  on conflict (id) do update
  set filename = excluded.filename,
      checksum = excluded.checksum,
      applied_at = now()
`;

const ensureLedger = async (db: MigrationDb) => {
  await db.query(`
    create table if not exists sideby_schema_migrations (
      id text primary key,
      filename text not null,
      checksum text not null,
      applied_at timestamptz not null default now()
    )
  `);
};

const loadAppliedMigrations = async (db: MigrationDb) => {
  const rows = await db.query("select id, checksum from sideby_schema_migrations order by id");
  return new Map((rows as AppliedMigration[]).map((row) => [row.id, row.checksum]));
};

/**
 * Applies one migration file atomically: every statement plus the ledger
 * write runs inside a single driver-supported transaction, so a failing
 * later statement rolls back earlier ones and leaves no ledger entry.
 * Returns the number of applied statements (0 for empty files).
 */
export const applyMigration = async (
  db: MigrationDb,
  filename: string,
  content: string,
): Promise<number> => {
  const id = filename.replace(/\.sql$/i, "");
  const fileChecksum = checksum(content);
  const statements = splitSqlStatements(normalizeSql(content));

  if (statements.length === 0) {
    console.log(`- ${filename}: skipped empty migration`);
    return 0;
  }

  await db.transaction((txn) => [
    ...statements.map((statement) => txn.query(statement)),
    txn.query(LEDGER_UPSERT_SQL, [id, filename, fileChecksum]),
  ]);

  console.log(`+ ${filename}: applied ${statements.length} statement${statements.length === 1 ? "" : "s"}`);
  return statements.length;
};

export const migrateDirectory = async (db: MigrationDb, dir: string): Promise<void> => {
  const files = (await readdir(dir))
    .filter((file) => file.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));

  if (files.length === 0) {
    console.log("No Neon migrations found.");
    return;
  }

  const applied = await loadAppliedMigrations(db);

  for (const filename of files) {
    const fullPath = path.join(dir, filename);
    const content = await readFile(fullPath, "utf8");
    const id = filename.replace(/\.sql$/i, "");
    const fileChecksum = checksum(content);
    const appliedChecksum = applied.get(id);

    if (appliedChecksum === fileChecksum) {
      console.log(`= ${filename}: already applied`);
      continue;
    }

    if (appliedChecksum && appliedChecksum !== fileChecksum) {
      throw new Error(
        `${filename} was already applied with a different checksum. Create a new migration instead of editing it.`,
      );
    }

    await applyMigration(db, filename, content);
  }
};

const main = async () => {
  const db = neon(databaseUrl);
  await ensureLedger(db);
  await migrateDirectory(db, migrationsDir);
};

const invokedDirectly = process.argv[1]?.endsWith("neon-migrate.ts") ?? false;
if (invokedDirectly) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
