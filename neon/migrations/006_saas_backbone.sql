alter table users
  add column if not exists paddle_customer_id text;

create table if not exists user_settings (
  user_id text primary key references users(id) on delete cascade,
  preferences jsonb not null default '{}'::jsonb,
  notification_prefs jsonb not null default '{}'::jsonb,
  default_ai_model text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists workspace_settings (
  workspace_id uuid primary key references workspaces(id) on delete cascade,
  branding jsonb not null default '{}'::jsonb,
  default_dimensions jsonb not null default '[]'::jsonb,
  notification_prefs jsonb not null default '{}'::jsonb,
  default_visibility visibility not null default 'private',
  shared_knowledge_base boolean not null default true,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id text references users(id) on delete cascade,
  organization_id text references organizations(id) on delete cascade,
  workspace_id uuid references workspaces(id) on delete cascade,
  name text not null,
  key_prefix text not null,
  key_hash text not null unique,
  scopes jsonb not null default '[]'::jsonb,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists prompt_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  organization_id text references organizations(id) on delete cascade,
  created_by text not null,
  name text not null,
  description text,
  system_prompt text not null,
  user_prompt_template text,
  variables_schema jsonb not null default '{}'::jsonb,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists team_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id text references organizations(id) on delete cascade,
  workspace_id uuid references workspaces(id) on delete cascade,
  email text not null,
  role role not null default 'member',
  status text not null default 'pending',
  clerk_invitation_id text,
  invited_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists api_keys_user_idx on api_keys(user_id);
create index if not exists api_keys_org_idx on api_keys(organization_id);
create index if not exists api_keys_workspace_idx on api_keys(workspace_id);
create index if not exists api_keys_prefix_idx on api_keys(key_prefix);
create index if not exists prompt_templates_workspace_idx on prompt_templates(workspace_id);
create index if not exists prompt_templates_org_idx on prompt_templates(organization_id);
create index if not exists prompt_templates_created_by_idx on prompt_templates(created_by);
create index if not exists team_invitations_org_idx on team_invitations(organization_id);
create index if not exists team_invitations_workspace_idx on team_invitations(workspace_id);
create index if not exists team_invitations_email_idx on team_invitations(email);
