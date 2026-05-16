create extension if not exists vector;

create table if not exists knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  uploaded_by text not null,
  filename text not null,
  mime_type text not null,
  size_bytes integer not null,
  blob_url text not null,
  blob_key text not null,
  status text not null default 'indexing',
  error_message text,
  chunk_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references knowledge_documents(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  chunk_index integer not null,
  text text not null,
  token_estimate integer not null,
  embedding vector(1536) not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists knowledge_documents_workspace_idx
  on knowledge_documents(workspace_id);

create index if not exists knowledge_documents_project_idx
  on knowledge_documents(project_id);

create index if not exists knowledge_documents_workspace_project_status_idx
  on knowledge_documents(workspace_id, project_id, status);

create index if not exists knowledge_documents_uploaded_by_idx
  on knowledge_documents(uploaded_by);

create index if not exists knowledge_documents_blob_key_idx
  on knowledge_documents(blob_key);

create index if not exists knowledge_chunks_document_idx
  on knowledge_chunks(document_id);

create index if not exists knowledge_chunks_workspace_idx
  on knowledge_chunks(workspace_id);

create index if not exists knowledge_chunks_project_idx
  on knowledge_chunks(project_id);

create index if not exists knowledge_chunks_workspace_document_idx
  on knowledge_chunks(workspace_id, document_id);

create unique index if not exists knowledge_chunks_document_chunk_idx
  on knowledge_chunks(document_id, chunk_index);

create index if not exists knowledge_chunks_embedding_hnsw_idx
  on knowledge_chunks using hnsw (embedding vector_cosine_ops);
