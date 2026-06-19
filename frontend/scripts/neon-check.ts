import { neon } from "@neondatabase/serverless";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env" });
loadEnv({ path: "../.env" });

const databaseUrl =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  "";

if (!databaseUrl) {
  throw new Error(
    "Set DATABASE_URL or POSTGRES_URL before checking Neon schema.",
  );
}

const sql = neon(databaseUrl);

const requiredColumns = [
  ["comparisons", "taxonomy_category"],
  ["comparisons", "taxonomy_status"],
  ["comparisons", "taxonomy_confidence"],
  ["comparisons", "safety_level"],
  ["comparisons", "policy_note"],
  ["query_analytics", "taxonomy_status"],
  ["query_analytics", "safety_level"],
  ["query_analytics", "taxonomy_confidence"],
  ["query_analytics", "policy_note"],
  ["query_analytics", "policy_signals"],
  ["query_analytics", "source_strategy"],
  ["knowledge_documents", "workspace_id"],
  ["knowledge_documents", "project_id"],
  ["knowledge_documents", "blob_url"],
  ["knowledge_documents", "blob_key"],
  ["knowledge_documents", "status"],
  ["knowledge_documents", "chunk_count"],
  ["knowledge_documents", "deleted_at"],
  ["knowledge_chunks", "document_id"],
  ["knowledge_chunks", "chunk_index"],
  ["knowledge_chunks", "embedding"],
] as const;

const requiredTables = [
  "users",
  "organizations",
  "memberships",
  "workspaces",
  "projects",
  "comparisons",
  "comparison_entities",
  "comparison_dimensions",
  "comparison_sources",
  "comparison_facts",
  "comparison_scores",
  "comparison_verdicts",
  "comparison_questions",
  "ai_runs",
  "ai_run_steps",
  "usage_events",
  "rate_limit_events",
  "subscriptions",
  "webhook_events",
  "feedback",
  "query_analytics",
  "entity_knowledge",
  "knowledge_documents",
  "knowledge_chunks",
  "audit_logs",
  "snapsolve_outbox",
] as const;

const requiredIndexes = [
  "comparisons_taxonomy_category_idx",
  "comparisons_safety_level_idx",
  "qa_taxonomy_status_idx",
  "qa_safety_level_idx",
  "knowledge_documents_workspace_project_status_idx",
  "knowledge_chunks_workspace_document_idx",
  "knowledge_chunks_embedding_hnsw_idx",
] as const;

type ColumnRow = {
  table_name: string;
  column_name: string;
};

type TableRow = {
  table_name: string;
};

type IndexRow = {
  indexname: string;
};

const main = async () => {
  const tableRows = (await sql.query(
    `
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_name = any($1)
    `,
    [[...requiredTables]],
  )) as TableRow[];

  const tables = new Set(tableRows.map((row) => row.table_name));
  const missingTables = requiredTables.filter((table) => !tables.has(table));

  const columnRows = (await sql.query(
    `
      select table_name, column_name
      from information_schema.columns
      where table_schema = 'public'
        and table_name = any($1)
    `,
    [[...new Set(requiredColumns.map(([table]) => table))]],
  )) as ColumnRow[];

  const columns = new Set(
    columnRows.map((row) => `${row.table_name}.${row.column_name}`),
  );
  const missingColumns = requiredColumns
    .map(([table, column]) => `${table}.${column}`)
    .filter((column) => !columns.has(column));

  const indexRows = (await sql.query(
    `
      select indexname
      from pg_indexes
      where schemaname = 'public'
        and indexname = any($1)
    `,
    [[...requiredIndexes]],
  )) as IndexRow[];

  const indexes = new Set(indexRows.map((row) => row.indexname));
  const missingIndexes = requiredIndexes.filter((index) => !indexes.has(index));

  if (missingTables.length || missingColumns.length || missingIndexes.length) {
    console.error("Neon schema check failed.");
    if (missingTables.length)
      console.error(`Missing tables: ${missingTables.join(", ")}`);
    if (missingColumns.length)
      console.error(`Missing columns: ${missingColumns.join(", ")}`);
    if (missingIndexes.length)
      console.error(`Missing indexes: ${missingIndexes.join(", ")}`);
    process.exit(1);
  }

  console.log("Neon schema check passed.");
  console.log(
    `Verified ${requiredTables.length} tables, ${requiredColumns.length} columns, and ${requiredIndexes.length} indexes.`,
  );
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
