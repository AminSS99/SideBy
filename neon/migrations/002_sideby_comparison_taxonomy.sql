alter table comparisons
  add column if not exists taxonomy_category text not null default 'general_research',
  add column if not exists taxonomy_status text not null default 'ready',
  add column if not exists taxonomy_confidence numeric(4, 3),
  add column if not exists safety_level text not null default 'standard',
  add column if not exists policy_note text;

create index if not exists comparisons_taxonomy_category_idx
  on comparisons(taxonomy_category);

create index if not exists comparisons_safety_level_idx
  on comparisons(safety_level);

do $$
begin
  if to_regclass('query_analytics') is not null then
    alter table query_analytics
      add column if not exists taxonomy_status text,
      add column if not exists safety_level text,
      add column if not exists taxonomy_confidence numeric(4, 3),
      add column if not exists policy_note text,
      add column if not exists policy_signals jsonb,
      add column if not exists source_strategy jsonb;

    create index if not exists qa_taxonomy_status_idx
      on query_analytics(taxonomy_status);

    create index if not exists qa_safety_level_idx
      on query_analytics(safety_level);
  end if;
end $$;
