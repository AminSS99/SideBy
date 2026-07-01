alter table workspaces
  add column if not exists snapsolve_workspace_id uuid,
  add column if not exists snapsolve_workspace_slug text,
  add column if not exists snapsolve_workspace_status text,
  add column if not exists snapsolve_sync_error text;

create index if not exists workspaces_snapsolve_workspace_idx
  on workspaces(snapsolve_workspace_id);
