import { neon } from "@neondatabase/serverless";
import { config as loadEnv } from "dotenv";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

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

const sql = neon(databaseUrl);

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

const ensureLedger = async () => {
  await sql.query(`
    create table if not exists sideby_schema_migrations (
      id text primary key,
      filename text not null,
      checksum text not null,
      applied_at timestamptz not null default now()
    )
  `);
};

const loadAppliedMigrations = async () => {
  const rows = await sql.query("select id, checksum from sideby_schema_migrations order by id");
  return new Map((rows as AppliedMigration[]).map((row) => [row.id, row.checksum]));
};

const applyMigration = async (filename: string, content: string) => {
  const id = filename.replace(/\.sql$/i, "");
  const fileChecksum = checksum(content);
  const statements = splitSqlStatements(normalizeSql(content));

  if (statements.length === 0) {
    console.log(`- ${filename}: skipped empty migration`);
    return;
  }

  // Batch statements into a single string to prevent sequential O(N) network round-trips
  // while preserving the required sequential execution order of migrations
  await sql.query(statements.join(';\n'));

  await sql.query(
    `
      insert into sideby_schema_migrations (id, filename, checksum)
      values ($1, $2, $3)
      on conflict (id) do update
      set filename = excluded.filename,
          checksum = excluded.checksum,
          applied_at = now()
    `,
    [id, filename, fileChecksum],
  );

  console.log(`+ ${filename}: applied ${statements.length} statement${statements.length === 1 ? "" : "s"}`);
};

const main = async () => {
  await ensureLedger();

  const files = (await readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));

  if (files.length === 0) {
    console.log("No Neon migrations found.");
    return;
  }

  const applied = await loadAppliedMigrations();

  for (const filename of files) {
    const fullPath = path.join(migrationsDir, filename);
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

    await applyMigration(filename, content);
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
