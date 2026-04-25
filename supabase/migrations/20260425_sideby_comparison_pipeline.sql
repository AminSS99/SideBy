create table if not exists public.comparisons (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  query text not null,
  slug text not null unique,
  inferred_context text,
  status text not null default 'queued' check (status in ('queued', 'researching', 'completed', 'failed', 'stale')),
  visibility text not null default 'private' check (visibility in ('private', 'workspace', 'public')),
  source_count integer not null default 0 check (source_count >= 0),
  progress integer not null default 0 check (progress between 0 and 100),
  active_step integer not null default 0 check (active_step >= 0),
  overall_confidence numeric(4, 3) check (overall_confidence is null or overall_confidence between 0 and 1),
  freshness_policy jsonb not null default '{}'::jsonb,
  result jsonb,
  error_message text,
  last_refreshed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.comparison_entities (
  id uuid primary key default gen_random_uuid(),
  comparison_id uuid not null references public.comparisons(id) on delete cascade,
  position smallint not null check (position between 1 and 8),
  name text not null,
  normalized_name text not null,
  description text,
  official_url text,
  logo_url text,
  logo_source text check (logo_source is null or logo_source in ('svgl', 'simple-icons', 'favicon', 'manual')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  unique (comparison_id, position)
);

create table if not exists public.comparison_categories (
  id uuid primary key default gen_random_uuid(),
  comparison_id uuid not null references public.comparisons(id) on delete cascade,
  name text not null,
  description text,
  display_order integer not null default 0,
  winner_entity_id uuid references public.comparison_entities(id) on delete set null,
  winner_label text,
  confidence numeric(4, 3) check (confidence is null or confidence between 0 and 1),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.comparison_sources (
  id uuid primary key default gen_random_uuid(),
  comparison_id uuid not null references public.comparisons(id) on delete cascade,
  entity_id uuid references public.comparison_entities(id) on delete set null,
  url text not null,
  canonical_url text,
  title text,
  source_type text not null default 'web' check (source_type in ('official', 'docs', 'pricing', 'changelog', 'status', 'community', 'web')),
  reliability text not null default 'unknown' check (reliability in ('official', 'high', 'medium', 'low', 'unknown')),
  extraction_method text not null default 'firecrawl' check (extraction_method in ('firecrawl', 'browser-use', 'browserbase', 'playwright', 'manual')),
  fetched_at timestamptz not null default timezone('utc', now()),
  snapshot_path text,
  content_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.comparison_facts (
  id uuid primary key default gen_random_uuid(),
  comparison_id uuid not null references public.comparisons(id) on delete cascade,
  entity_id uuid not null references public.comparison_entities(id) on delete cascade,
  category_id uuid references public.comparison_categories(id) on delete set null,
  source_id uuid references public.comparison_sources(id) on delete set null,
  entity text not null,
  category text not null,
  label text,
  value text not null,
  normalized_value jsonb,
  source_url text not null,
  source_title text,
  confidence numeric(4, 3) not null check (confidence between 0 and 1),
  freshness_class text not null default 'standard' check (freshness_class in ('pricing', 'ai_model', 'product', 'static', 'standard')),
  extracted_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz,
  previous_value text,
  changed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.comparison_verdicts (
  id uuid primary key default gen_random_uuid(),
  comparison_id uuid not null references public.comparisons(id) on delete cascade,
  verdict_type text not null check (verdict_type in ('summary', 'best_overall', 'best_value', 'developers', 'teams', 'students', 'ecosystem', 'power_users', 'custom')),
  winner_entity_id uuid references public.comparison_entities(id) on delete set null,
  title text not null,
  body text not null,
  confidence numeric(4, 3) check (confidence is null or confidence between 0 and 1),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.comparison_refresh_jobs (
  id uuid primary key default gen_random_uuid(),
  comparison_id uuid not null references public.comparisons(id) on delete cascade,
  requested_by uuid references auth.users(id) on delete set null,
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed')),
  reason text not null default 'manual',
  started_at timestamptz,
  completed_at timestamptz,
  changed_fact_count integer not null default 0 check (changed_fact_count >= 0),
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists comparisons_workspace_id_idx on public.comparisons(workspace_id);
create index if not exists comparisons_slug_idx on public.comparisons(slug);
create index if not exists comparisons_status_idx on public.comparisons(status);
create index if not exists comparison_entities_comparison_id_idx on public.comparison_entities(comparison_id);
create index if not exists comparison_categories_comparison_id_idx on public.comparison_categories(comparison_id);
create index if not exists comparison_sources_comparison_id_idx on public.comparison_sources(comparison_id);
create index if not exists comparison_sources_reliability_idx on public.comparison_sources(reliability);
create index if not exists comparison_facts_comparison_id_idx on public.comparison_facts(comparison_id);
create index if not exists comparison_facts_entity_category_idx on public.comparison_facts(entity_id, category_id);
create index if not exists comparison_facts_expires_at_idx on public.comparison_facts(expires_at);
create index if not exists comparison_verdicts_comparison_id_idx on public.comparison_verdicts(comparison_id);
create index if not exists comparison_refresh_jobs_comparison_id_idx on public.comparison_refresh_jobs(comparison_id);

alter table public.comparisons enable row level security;
alter table public.comparison_entities enable row level security;
alter table public.comparison_categories enable row level security;
alter table public.comparison_sources enable row level security;
alter table public.comparison_facts enable row level security;
alter table public.comparison_verdicts enable row level security;
alter table public.comparison_refresh_jobs enable row level security;

drop policy if exists "comparisons_select_visible" on public.comparisons;
create policy "comparisons_select_visible"
on public.comparisons for select
using (
  visibility = 'public'
  or (workspace_id is not null and public.is_workspace_member(workspace_id))
  or created_by = auth.uid()
);

drop policy if exists "comparisons_insert_members" on public.comparisons;
create policy "comparisons_insert_members"
on public.comparisons for insert
with check (
  created_by = auth.uid()
  and (
    workspace_id is null
    or public.is_workspace_member(workspace_id)
  )
);

drop policy if exists "comparisons_update_members" on public.comparisons;
create policy "comparisons_update_members"
on public.comparisons for update
using (
  created_by = auth.uid()
  or (workspace_id is not null and public.is_workspace_member(workspace_id))
);

drop policy if exists "comparison_entities_select_visible" on public.comparison_entities;
create policy "comparison_entities_select_visible"
on public.comparison_entities for select
using (
  exists (
    select 1 from public.comparisons comparison
    where comparison.id = comparison_id
      and (
        comparison.visibility = 'public'
        or comparison.created_by = auth.uid()
        or (comparison.workspace_id is not null and public.is_workspace_member(comparison.workspace_id))
      )
  )
);

drop policy if exists "comparison_categories_select_visible" on public.comparison_categories;
create policy "comparison_categories_select_visible"
on public.comparison_categories for select
using (
  exists (
    select 1 from public.comparisons comparison
    where comparison.id = comparison_id
      and (
        comparison.visibility = 'public'
        or comparison.created_by = auth.uid()
        or (comparison.workspace_id is not null and public.is_workspace_member(comparison.workspace_id))
      )
  )
);

drop policy if exists "comparison_sources_select_visible" on public.comparison_sources;
create policy "comparison_sources_select_visible"
on public.comparison_sources for select
using (
  exists (
    select 1 from public.comparisons comparison
    where comparison.id = comparison_id
      and (
        comparison.visibility = 'public'
        or comparison.created_by = auth.uid()
        or (comparison.workspace_id is not null and public.is_workspace_member(comparison.workspace_id))
      )
  )
);

drop policy if exists "comparison_facts_select_visible" on public.comparison_facts;
create policy "comparison_facts_select_visible"
on public.comparison_facts for select
using (
  exists (
    select 1 from public.comparisons comparison
    where comparison.id = comparison_id
      and (
        comparison.visibility = 'public'
        or comparison.created_by = auth.uid()
        or (comparison.workspace_id is not null and public.is_workspace_member(comparison.workspace_id))
      )
  )
);

drop policy if exists "comparison_verdicts_select_visible" on public.comparison_verdicts;
create policy "comparison_verdicts_select_visible"
on public.comparison_verdicts for select
using (
  exists (
    select 1 from public.comparisons comparison
    where comparison.id = comparison_id
      and (
        comparison.visibility = 'public'
        or comparison.created_by = auth.uid()
        or (comparison.workspace_id is not null and public.is_workspace_member(comparison.workspace_id))
      )
  )
);

drop policy if exists "comparison_refresh_jobs_select_visible" on public.comparison_refresh_jobs;
create policy "comparison_refresh_jobs_select_visible"
on public.comparison_refresh_jobs for select
using (
  exists (
    select 1 from public.comparisons comparison
    where comparison.id = comparison_id
      and (
        comparison.created_by = auth.uid()
        or (comparison.workspace_id is not null and public.is_workspace_member(comparison.workspace_id))
      )
  )
);

drop trigger if exists comparisons_set_updated_at on public.comparisons;
create trigger comparisons_set_updated_at
before update on public.comparisons
for each row execute function public.set_updated_at();
