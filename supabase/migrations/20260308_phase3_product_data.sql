alter table public.ai_runs
add column if not exists title text;

alter table public.ai_runs
add column if not exists source text not null default 'app';

alter table public.ai_runs
add column if not exists input_payload jsonb not null default '{}'::jsonb;

alter table public.ai_runs
add column if not exists output_summary text;

alter table public.ai_runs
add column if not exists error_message text;

alter table public.ai_runs
add column if not exists completed_at timestamptz;
