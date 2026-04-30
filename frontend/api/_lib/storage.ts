import { neon } from "@neondatabase/serverless";
import type { ComparisonResult } from "./sideby.js";

type WriteContext = {
  sql: ReturnType<typeof neon>;
  comparisonId: string;
  entityIds: Record<string, string>;
  sourceIds: Record<string, string>;
  categoryIds: Record<string, string>;
};

const getDb = () => {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || "";
  return url ? neon(url) : null;
};

const ensureNormalizedSchema = async (sql: ReturnType<typeof neon>) => {
  await sql`
    create table if not exists comparison_entities (
      id uuid primary key default gen_random_uuid(),
      comparison_id uuid not null,
      position smallint not null check (position between 1 and 8),
      name text not null,
      normalized_name text not null,
      description text,
      official_url text,
      logo_url text,
      logo_source text,
      metadata jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      unique (comparison_id, position)
    )`;

  await sql`
    create table if not exists comparison_categories (
      id uuid primary key default gen_random_uuid(),
      comparison_id uuid not null,
      name text not null,
      description text,
      display_order integer not null default 0,
      winner_entity_id uuid,
      winner_label text,
      confidence numeric(4,3),
      created_at timestamptz not null default now()
    )`;

  await sql`
    create table if not exists comparison_sources (
      id uuid primary key default gen_random_uuid(),
      comparison_id uuid not null,
      entity_id uuid,
      url text not null,
      canonical_url text,
      title text,
      source_type text not null default 'web',
      reliability text not null default 'unknown',
      extraction_method text not null default 'firecrawl',
      fetched_at timestamptz not null default now(),
      snapshot_path text,
      content_hash text,
      metadata jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    )`;

  await sql`
    create table if not exists comparison_facts (
      id uuid primary key default gen_random_uuid(),
      comparison_id uuid not null,
      entity_id uuid not null,
      category_id uuid,
      source_id uuid,
      entity text not null,
      category text not null,
      label text,
      value text not null,
      normalized_value jsonb,
      source_url text not null,
      source_title text,
      confidence numeric(4,3) not null check (confidence between 0 and 1),
      freshness_class text not null default 'standard',
      extracted_at timestamptz not null default now(),
      expires_at timestamptz,
      previous_value text,
      changed_at timestamptz,
      metadata jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    )`;

  await sql`
    create table if not exists comparison_verdicts (
      id uuid primary key default gen_random_uuid(),
      comparison_id uuid not null,
      verdict_type text not null,
      winner_entity_id uuid,
      title text not null,
      body text not null,
      confidence numeric(4,3),
      created_at timestamptz not null default now()
    )`;

  await sql`
    create table if not exists comparison_refresh_jobs (
      id uuid primary key default gen_random_uuid(),
      comparison_id uuid not null,
      status text not null default 'queued',
      reason text not null default 'manual',
      started_at timestamptz,
      completed_at timestamptz,
      changed_fact_count integer not null default 0,
      error_message text,
      metadata jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    )`;
};

export const writeNormalizedComparison = async (
  comparisonId: string,
  result: ComparisonResult,
) => {
  const sql = getDb();
  if (!sql) return;

  await ensureNormalizedSchema(sql);
  const ctx: WriteContext = {
    sql,
    comparisonId,
    entityIds: {},
    sourceIds: {},
    categoryIds: {},
  };

  await writeEntities(ctx, result);
  await writeSources(ctx, result);
  await writeCategories(ctx, result);
  await writeFacts(ctx, result);
  await writeVerdicts(ctx, result);
};

const writeEntities = async (ctx: WriteContext, result: ComparisonResult) => {
  const entries: [string, number, string, string | undefined][] = [
    ["a", 1, result.entities.a.name, result.entities.a.logoUrl],
    ["b", 2, result.entities.b.name, result.entities.b.logoUrl],
  ];

  for (const [key, pos, name, logoUrl] of entries) {
    const rows = await ctx.sql`
      insert into comparison_entities (comparison_id, position, name, normalized_name, logo_url, logo_source)
      values (${ctx.comparisonId}, ${pos}, ${name}, ${name.toLowerCase().trim()}, ${logoUrl || null}, ${logoUrl ? "simple-icons" : null})
      on conflict (comparison_id, position) do update
      set name = excluded.name, normalized_name = excluded.normalized_name, logo_url = excluded.logo_url
      returning id`;
    ctx.entityIds[key] = rows[0].id;
  }
};

const writeSources = async (ctx: WriteContext, result: ComparisonResult) => {
  const srcsByEntity: Record<string, typeof result.sources> = { a: [], b: [] };

  for (const src of result.sources) {
    const isA = result.categories.some((cat) =>
      cat.facts.some((f) => f.entity === "a" && f.sourceTitle === src.title),
    );
    const key = isA ? "a" : "b";
    srcsByEntity[key].push(src);
  }

  for (const [key, sources] of Object.entries(srcsByEntity)) {
    for (let i = 0; i < sources.length; i++) {
      const src = sources[i];
      const entityId = ctx.entityIds[key];
      const rows = await ctx.sql`
        insert into comparison_sources (comparison_id, entity_id, url, title, source_type, reliability, extraction_method, content_hash, fetched_at)
        values (${ctx.comparisonId}, ${entityId || null}, ${src.url}, ${src.title}, ${src.sourceType || "web"}, ${src.reliability}, ${src.extractionMethod || "manual"}, ${src.contentHash || null}, now())
        returning id`;
      const idKey = `${key}-${i}`;
      ctx.sourceIds[idKey] = rows[0].id;
    }
  }
};

const writeCategories = async (ctx: WriteContext, result: ComparisonResult) => {
  for (let i = 0; i < result.categories.length; i++) {
    const cat = result.categories[i];
    const winnerEntityId =
      cat.winner === "a" ? ctx.entityIds.a :
      cat.winner === "b" ? ctx.entityIds.b :
      null;

    const rows = await ctx.sql`
      insert into comparison_categories (comparison_id, name, description, display_order, winner_entity_id, winner_label, confidence)
      values (${ctx.comparisonId}, ${cat.name}, ${cat.verdict}, ${i}, ${winnerEntityId}, ${cat.winner}, ${0.85})
      returning id`;
    ctx.categoryIds[cat.name] = rows[0].id;
  }
};

const freshnessToClass = (f: string): string => {
  if (f === "Monitor") return "pricing";
  if (f === "Fresh") return "product";
  return "static";
};

const writeFacts = async (ctx: WriteContext, result: ComparisonResult) => {
  for (const cat of result.categories) {
    for (const fact of cat.facts) {
      const entityId = ctx.entityIds[fact.entity];
      const categoryId = ctx.categoryIds[cat.name];
      const sourceKey = `${fact.entity}-0`;

      await ctx.sql`
        insert into comparison_facts (
          comparison_id, entity_id, category_id, source_id,
          entity, category, label, value, source_url, source_title,
          confidence, freshness_class, previous_value,
          changed_at, extracted_at
        )
        values (
          ${ctx.comparisonId}, ${entityId}, ${categoryId}, ${ctx.sourceIds[sourceKey] || null},
          ${fact.entity}, ${cat.name}, ${fact.label}, ${fact.value},
          ${fact.sourceUrl || ""}, ${fact.sourceTitle || fact.source},
          ${fact.confidence}, ${freshnessToClass(fact.freshness)},
          ${fact.previousValue || null},
          ${fact.changed ? new Date().toISOString() : null},
          now()
        )`;
    }
  }
};

const verdictTypes: Record<string, string> = {
  bestOverall: "best_overall",
  bestValue: "best_value",
  developers: "developers",
  teams: "teams",
  students: "students",
  powerUsers: "power_users",
  ecosystem: "ecosystem",
  summary: "summary",
};

const writeVerdicts = async (ctx: WriteContext, result: ComparisonResult) => {
  for (const [key, value] of Object.entries(result.verdict)) {
    if (!value) continue;
    const verdictType = verdictTypes[key] || "custom";
    const winnerName = value;

    const winnerEntityId =
      winnerName === result.entities.a.name ? ctx.entityIds.a :
      winnerName === result.entities.b.name ? ctx.entityIds.b :
      null;

    const title =
      key === "summary" ? "Overall Summary" :
      `Best ${key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}`;

    await ctx.sql`
      insert into comparison_verdicts (comparison_id, verdict_type, winner_entity_id, title, body, confidence)
      values (${ctx.comparisonId}, ${verdictType}, ${winnerEntityId}, ${title}, ${value}, ${0.85})`;
  }
};
