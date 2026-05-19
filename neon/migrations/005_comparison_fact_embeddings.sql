create extension if not exists vector;

alter table comparison_facts
  add column if not exists embedding vector(1536);

create index if not exists comparison_facts_embedding_hnsw_idx
  on comparison_facts using hnsw (embedding vector_cosine_ops);
