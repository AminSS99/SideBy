create extension if not exists vector;

alter table comparisons
  add column if not exists query_embedding vector(1536);

create index if not exists comparisons_query_embedding_hnsw_idx
  on comparisons using hnsw (query_embedding vector_cosine_ops);

create table if not exists comparison_versions (
  id uuid primary key default gen_random_uuid(),
  comparison_id uuid not null references comparisons(id) on delete cascade,
  version_number integer not null,
  result jsonb,
  source_count integer not null default 0,
  overall_confidence numeric(4, 3),
  change_summary jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz not null default now(),
  unique (comparison_id, version_number)
);

create index if not exists comparison_versions_comparison_idx
  on comparison_versions(comparison_id);
