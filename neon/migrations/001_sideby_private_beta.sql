create extension if not exists pgcrypto;

create table if not exists comparisons (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  slug text not null unique,
  inferred_context text,
  status text not null default 'completed'
    check (status in ('queued', 'running', 'completed', 'failed', 'stale')),
  visibility text not null default 'private'
    check (visibility in ('private', 'team', 'public')),
  clerk_user_id text,
  clerk_org_id text,
  source_count integer not null default 0 check (source_count >= 0),
  progress integer not null default 100 check (progress between 0 and 100),
  active_step integer not null default 5 check (active_step >= 0),
  overall_confidence numeric(4, 3)
    check (overall_confidence is null or overall_confidence between 0 and 1),
  result jsonb,
  error_message text,
  last_refreshed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists comparisons_slug_idx on comparisons(slug);
create index if not exists comparisons_clerk_user_id_idx on comparisons(clerk_user_id);
create index if not exists comparisons_created_at_idx on comparisons(created_at desc);

create table if not exists comparison_refresh_jobs (
  id uuid primary key default gen_random_uuid(),
  comparison_id uuid not null references comparisons(id) on delete cascade,
  clerk_user_id text,
  status text not null default 'completed'
    check (status in ('queued', 'running', 'completed', 'failed')),
  changed_fact_count integer not null default 0 check (changed_fact_count >= 0),
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists comparison_refresh_jobs_comparison_id_idx
  on comparison_refresh_jobs(comparison_id);
