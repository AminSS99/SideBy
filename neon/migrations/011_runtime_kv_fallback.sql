create table if not exists sideby_runtime_kv (
  key text primary key,
  value jsonb not null,
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists sideby_runtime_kv_expires_at_idx
  on sideby_runtime_kv(expires_at);
