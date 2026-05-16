create extension if not exists pgcrypto;
create extension if not exists vector;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'comparison_status') then
    create type comparison_status as enum ('queued', 'running', 'completed', 'failed');
  end if;
  if not exists (select 1 from pg_type where typname = 'visibility') then
    create type visibility as enum ('private', 'team', 'public');
  end if;
  if not exists (select 1 from pg_type where typname = 'plan') then
    create type plan as enum ('free', 'pro', 'team', 'business');
  end if;
  if not exists (select 1 from pg_type where typname = 'role') then
    create type role as enum ('owner', 'admin', 'member', 'viewer');
  end if;
  if not exists (select 1 from pg_type where typname = 'ai_run_status') then
    create type ai_run_status as enum ('queued', 'running', 'completed', 'failed');
  end if;
  if not exists (select 1 from pg_type where typname = 'subscription_status') then
    create type subscription_status as enum ('active', 'canceled', 'past_due', 'paused', 'trialing');
  end if;
end $$;

alter type comparison_status add value if not exists 'running';

create table if not exists users (
  id text primary key,
  email text,
  name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists users_email_idx on users(email);

create table if not exists organizations (
  id text primary key,
  slug text not null unique,
  name text,
  plan plan not null default 'free',
  paddle_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists organizations_slug_idx on organizations(slug);

create table if not exists memberships (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references users(id) on delete cascade,
  organization_id text not null references organizations(id) on delete cascade,
  role role not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists memberships_user_org_idx on memberships(user_id, organization_id);

create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null,
  owner_type varchar(16) not null default 'user',
  name text not null,
  slug text not null unique,
  plan plan not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workspaces_owner_idx on workspaces(owner_id);
create index if not exists workspaces_slug_idx on workspaces(slug);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  created_by text not null,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_workspace_idx on projects(workspace_id);

alter table comparisons
  add column if not exists mode text default 'default',
  add column if not exists workspace_id uuid references workspaces(id) on delete set null,
  add column if not exists project_id uuid references projects(id) on delete set null,
  add column if not exists retry_count integer not null default 0,
  add column if not exists total_cost numeric(10, 6),
  add column if not exists ai_tokens_in integer,
  add column if not exists ai_tokens_out integer,
  add column if not exists searches_used integer default 0,
  add column if not exists freshness_class text default 'medium',
  add column if not exists reuse_source_id uuid;

create index if not exists comparisons_clerk_org_id_idx on comparisons(clerk_org_id);
create index if not exists comparisons_workspace_idx on comparisons(workspace_id);
create index if not exists comparisons_project_idx on comparisons(project_id);
create index if not exists comparisons_status_idx on comparisons(status);

create table if not exists comparison_entities (
  id uuid primary key default gen_random_uuid(),
  comparison_id uuid not null references comparisons(id) on delete cascade,
  position integer not null,
  name text not null,
  normalized_name text not null,
  description text,
  official_url text,
  logo_url text,
  logo_source text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table comparison_entities
  add column if not exists name text,
  add column if not exists description text,
  add column if not exists official_url text,
  add column if not exists logo_url text,
  add column if not exists logo_source text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists comparison_entities_comparison_idx on comparison_entities(comparison_id);

create table if not exists comparison_dimensions (
  id uuid primary key default gen_random_uuid(),
  comparison_id uuid not null references comparisons(id) on delete cascade,
  name text not null,
  weight numeric(3, 2) default '1.00',
  description text,
  created_at timestamptz not null default now()
);

create index if not exists comparison_dimensions_comparison_idx on comparison_dimensions(comparison_id);

create table if not exists comparison_sources (
  id uuid primary key default gen_random_uuid(),
  comparison_id uuid not null references comparisons(id) on delete cascade,
  entity_id uuid references comparison_entities(id) on delete set null,
  url text not null,
  canonical_url text,
  title text,
  source_type text not null default 'web',
  reliability text not null default 'review',
  extraction_method text not null default 'tavily',
  fetched_at timestamptz not null default now(),
  snapshot_path text,
  content_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table comparison_sources
  add column if not exists entity_id uuid references comparison_entities(id) on delete set null,
  add column if not exists canonical_url text,
  add column if not exists extraction_method text not null default 'tavily',
  add column if not exists snapshot_path text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table comparison_sources
  alter column reliability type text using reliability::text,
  alter column source_type set default 'web',
  alter column reliability set default 'review';

create index if not exists comparison_sources_comparison_idx on comparison_sources(comparison_id);
create index if not exists comparison_sources_url_idx on comparison_sources(url);

create table if not exists comparison_facts (
  id uuid primary key default gen_random_uuid(),
  comparison_id uuid not null references comparisons(id) on delete cascade,
  entity_id uuid references comparison_entities(id) on delete cascade,
  category_id uuid references comparison_dimensions(id) on delete set null,
  source_id uuid references comparison_sources(id) on delete set null,
  entity text,
  category text,
  label text,
  value text not null,
  normalized_value jsonb,
  source_url text,
  source_title text,
  confidence numeric(3, 2) not null default '0.70',
  freshness_class text not null default 'product',
  extracted_at timestamptz not null default now(),
  expires_at timestamptz,
  previous_value text,
  changed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table comparison_facts
  add column if not exists category_id uuid references comparison_dimensions(id) on delete set null,
  add column if not exists source_id uuid references comparison_sources(id) on delete set null,
  add column if not exists entity text,
  add column if not exists category text,
  add column if not exists label text,
  add column if not exists normalized_value jsonb,
  add column if not exists source_url text,
  add column if not exists source_title text,
  add column if not exists freshness_class text not null default 'product',
  add column if not exists extracted_at timestamptz not null default now(),
  add column if not exists expires_at timestamptz,
  add column if not exists previous_value text,
  add column if not exists changed_at timestamptz,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists comparison_facts_comparison_idx on comparison_facts(comparison_id);

create table if not exists comparison_scores (
  id uuid primary key default gen_random_uuid(),
  comparison_id uuid not null references comparisons(id) on delete cascade,
  entity_id uuid not null references comparison_entities(id) on delete cascade,
  dimension_id uuid not null references comparison_dimensions(id) on delete cascade,
  score numeric(4, 2),
  rationale text,
  created_at timestamptz not null default now()
);

create index if not exists comparison_scores_comparison_idx on comparison_scores(comparison_id);

create table if not exists comparison_verdicts (
  id uuid primary key default gen_random_uuid(),
  comparison_id uuid not null references comparisons(id) on delete cascade,
  verdict_type text not null default 'overall',
  winner_entity_id uuid references comparison_entities(id) on delete set null,
  title text,
  body text,
  confidence numeric(4, 3),
  created_at timestamptz not null default now()
);

alter table comparison_verdicts
  add column if not exists verdict_type text not null default 'overall',
  add column if not exists winner_entity_id uuid references comparison_entities(id) on delete set null,
  add column if not exists title text,
  add column if not exists body text;

create index if not exists comparison_verdicts_comparison_idx on comparison_verdicts(comparison_id);

create table if not exists comparison_questions (
  id uuid primary key default gen_random_uuid(),
  comparison_id uuid not null references comparisons(id) on delete cascade,
  question text not null,
  answer text,
  grounded_in text,
  answered_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists comparison_questions_comparison_idx on comparison_questions(comparison_id);

create table if not exists ai_runs (
  id uuid primary key default gen_random_uuid(),
  comparison_id uuid references comparisons(id) on delete set null,
  provider text not null,
  model text not null,
  task text not null,
  input_tokens integer,
  output_tokens integer,
  estimated_cost numeric(10, 6),
  latency_ms integer,
  status ai_run_status not null default 'queued',
  input_payload jsonb,
  output_payload jsonb,
  error_message text,
  prompt_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table ai_runs add column if not exists prompt_hash text;
create index if not exists ai_runs_comparison_idx on ai_runs(comparison_id);
create index if not exists ai_runs_status_idx on ai_runs(status);

create table if not exists ai_run_steps (
  id uuid primary key default gen_random_uuid(),
  ai_run_id uuid not null references ai_runs(id) on delete cascade,
  step_name text not null,
  status text not null default 'pending',
  input_snapshot jsonb,
  output_snapshot jsonb,
  error_trace text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists ai_run_steps_ai_run_idx on ai_run_steps(ai_run_id);

create table if not exists usage_events (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text,
  clerk_org_id text,
  event_type text not null,
  quantity integer not null default 1,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists usage_events_user_idx on usage_events(clerk_user_id);
create index if not exists usage_events_org_idx on usage_events(clerk_org_id);
create index if not exists usage_events_type_idx on usage_events(event_type);
create index if not exists usage_events_created_at_idx on usage_events(created_at);

create table if not exists rate_limit_events (
  id uuid primary key default gen_random_uuid(),
  key_type text not null,
  key_value text not null,
  limit_name text not null,
  created_at timestamptz not null default now()
);

create index if not exists rate_limit_events_key_idx on rate_limit_events(key_type, key_value);
create index if not exists rate_limit_events_created_at_idx on rate_limit_events(created_at);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id text references organizations(id) on delete cascade,
  user_id text references users(id) on delete cascade,
  paddle_subscription_id text not null unique,
  paddle_plan_id text not null,
  status subscription_status not null default 'trialing',
  current_period_start timestamptz,
  current_period_end timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_org_idx on subscriptions(organization_id);
create index if not exists subscriptions_user_idx on subscriptions(user_id);
create index if not exists subscriptions_paddle_idx on subscriptions(paddle_subscription_id);

create table if not exists webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_type text not null,
  payload jsonb,
  signature_valid boolean default false,
  processed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists webhook_events_provider_idx on webhook_events(provider);
create index if not exists webhook_events_created_at_idx on webhook_events(created_at);

create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  comparison_id uuid references comparisons(id) on delete cascade,
  clerk_user_id text,
  rating integer,
  correction text,
  source_report text,
  created_at timestamptz not null default now()
);

create index if not exists feedback_comparison_idx on feedback(comparison_id);

create table if not exists query_analytics (
  id uuid primary key default gen_random_uuid(),
  comparison_id uuid references comparisons(id) on delete cascade,
  raw_query text not null,
  normalized_query text,
  canonical_slug text,
  detected_entities jsonb,
  query_category text,
  taxonomy_status text,
  safety_level text,
  taxonomy_confidence numeric(4, 3),
  policy_note text,
  policy_signals jsonb,
  source_strategy jsonb,
  is_vague boolean default false,
  reused_from_id uuid,
  total_cost numeric(10, 6),
  ai_tokens_in integer,
  ai_tokens_out integer,
  searches_used integer default 0,
  sources_found integer default 0,
  cache_hits integer default 0,
  created_at timestamptz not null default now()
);

alter table query_analytics
  add column if not exists taxonomy_status text,
  add column if not exists safety_level text,
  add column if not exists taxonomy_confidence numeric(4, 3),
  add column if not exists policy_note text,
  add column if not exists policy_signals jsonb,
  add column if not exists source_strategy jsonb;

create index if not exists qa_comparison_idx on query_analytics(comparison_id);
create index if not exists qa_canonical_slug_idx on query_analytics(canonical_slug);
create index if not exists qa_query_category_idx on query_analytics(query_category);
create index if not exists qa_taxonomy_status_idx on query_analytics(taxonomy_status);
create index if not exists qa_safety_level_idx on query_analytics(safety_level);
create index if not exists qa_is_vague_idx on query_analytics(is_vague);
create index if not exists qa_created_at_idx on query_analytics(created_at);

create table if not exists entity_knowledge (
  id uuid primary key default gen_random_uuid(),
  entity_slug text not null,
  entity_display_name text not null,
  dimension text not null,
  value text not null,
  source_url text,
  source_title text,
  confidence numeric(3, 2) not null,
  freshness_class text default 'medium',
  usage_count integer default 1,
  last_verified_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ek_entity_slug_idx on entity_knowledge(entity_slug);
create index if not exists ek_dimension_idx on entity_knowledge(dimension);
create index if not exists ek_usage_count_idx on entity_knowledge(usage_count);
create unique index if not exists ek_entity_dim_value_idx on entity_knowledge(entity_slug, dimension, value);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text,
  clerk_org_id text,
  action text not null,
  resource_type text not null,
  resource_id text,
  metadata jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_user_idx on audit_logs(clerk_user_id);
create index if not exists audit_logs_org_idx on audit_logs(clerk_org_id);
create index if not exists audit_logs_action_idx on audit_logs(action);
create index if not exists audit_logs_created_at_idx on audit_logs(created_at);
