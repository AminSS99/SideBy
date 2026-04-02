create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null unique,
  plan text not null default 'free' check (plan in ('free', 'pro', 'team', 'business')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workspace_memberships (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default timezone('utc', now()),
  unique (workspace_id, user_id)
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ai_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  model text not null,
  task_type text not null,
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed')),
  latency_ms integer,
  input_tokens integer,
  output_tokens integer,
  estimated_cost numeric(12, 6),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references public.workspaces(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  status text not null default 'inactive',
  plan text not null default 'free',
  current_period_end timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  source text not null,
  metric text not null,
  quantity numeric(12, 4) not null default 1,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.workspace_memberships membership
    where membership.workspace_id = target_workspace_id
      and membership.user_id = auth.uid()
  );
$$;

create or replace function public.is_workspace_admin(target_workspace_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.workspace_memberships membership
    where membership.workspace_id = target_workspace_id
      and membership.user_id = auth.uid()
      and membership.role in ('owner', 'admin')
  );
$$;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_memberships enable row level security;
alter table public.projects enable row level security;
alter table public.ai_runs enable row level security;
alter table public.subscriptions enable row level security;
alter table public.usage_events enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
using (auth.uid() = id);

drop policy if exists "workspaces_select_members" on public.workspaces;
create policy "workspaces_select_members"
on public.workspaces for select
using (public.is_workspace_member(id) or owner_id = auth.uid());

drop policy if exists "workspaces_insert_owner" on public.workspaces;
create policy "workspaces_insert_owner"
on public.workspaces for insert
with check (owner_id = auth.uid());

drop policy if exists "workspaces_update_admins" on public.workspaces;
create policy "workspaces_update_admins"
on public.workspaces for update
using (public.is_workspace_admin(id) or owner_id = auth.uid());

drop policy if exists "workspace_memberships_select_members" on public.workspace_memberships;
create policy "workspace_memberships_select_members"
on public.workspace_memberships for select
using (public.is_workspace_member(workspace_id) or user_id = auth.uid());

drop policy if exists "workspace_memberships_insert_admins" on public.workspace_memberships;
create policy "workspace_memberships_insert_admins"
on public.workspace_memberships for insert
with check (
  public.is_workspace_admin(workspace_id)
  or (
    user_id = auth.uid()
    and role = 'owner'
    and exists (
      select 1
      from public.workspaces workspace
      where workspace.id = workspace_id
        and workspace.owner_id = auth.uid()
    )
  )
);

drop policy if exists "workspace_memberships_update_admins" on public.workspace_memberships;
create policy "workspace_memberships_update_admins"
on public.workspace_memberships for update
using (public.is_workspace_admin(workspace_id));

drop policy if exists "projects_select_members" on public.projects;
create policy "projects_select_members"
on public.projects for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "projects_insert_members" on public.projects;
create policy "projects_insert_members"
on public.projects for insert
with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());

drop policy if exists "projects_update_members" on public.projects;
create policy "projects_update_members"
on public.projects for update
using (public.is_workspace_member(workspace_id));

drop policy if exists "ai_runs_select_members" on public.ai_runs;
create policy "ai_runs_select_members"
on public.ai_runs for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "ai_runs_insert_members" on public.ai_runs;
create policy "ai_runs_insert_members"
on public.ai_runs for insert
with check (public.is_workspace_member(workspace_id) and user_id = auth.uid());

drop policy if exists "subscriptions_select_admins" on public.subscriptions;
create policy "subscriptions_select_admins"
on public.subscriptions for select
using (public.is_workspace_admin(workspace_id));

drop policy if exists "usage_events_select_members" on public.usage_events;
create policy "usage_events_select_members"
on public.usage_events for select
using (public.is_workspace_member(workspace_id));

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists workspaces_set_updated_at on public.workspaces;
create trigger workspaces_set_updated_at
before update on public.workspaces
for each row execute function public.set_updated_at();

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists ai_runs_set_updated_at on public.ai_runs;
create trigger ai_runs_set_updated_at
before update on public.ai_runs
for each row execute function public.set_updated_at();

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();
