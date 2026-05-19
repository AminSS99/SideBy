create table if not exists watchlists (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  created_by text not null,
  name text not null,
  query text not null,
  cadence text not null default 'weekly',
  alert_threshold numeric(4, 3) not null default '0.100',
  channels jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  last_run_at timestamptz,
  next_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists decision_matrices (
  id uuid primary key default gen_random_uuid(),
  comparison_id uuid references comparisons(id) on delete cascade,
  user_id text not null,
  name text not null,
  weights jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists source_feedback (
  id uuid primary key default gen_random_uuid(),
  comparison_id uuid references comparisons(id) on delete cascade,
  user_id text,
  source_url text not null,
  vote integer not null,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists watchlists_workspace_idx on watchlists(workspace_id);
create index if not exists watchlists_created_by_idx on watchlists(created_by);
create index if not exists watchlists_next_run_idx on watchlists(next_run_at);
create index if not exists decision_matrices_comparison_idx on decision_matrices(comparison_id);
create index if not exists decision_matrices_user_idx on decision_matrices(user_id);
create index if not exists source_feedback_comparison_idx on source_feedback(comparison_id);
create index if not exists source_feedback_url_idx on source_feedback(source_url);
