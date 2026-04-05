-- MCV One Desktop — Storage System Migration
-- Run this in Supabase SQL Editor AFTER the base schema.sql
-- Creates tables for: unified file index, compartments, versions, AI analysis,
-- interaction signals, generation tracking, audit log, RAG corpora

-- =========================================================================
-- 1. storage_files — Unified file metadata index across all providers
-- =========================================================================

create table if not exists storage_files (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('supabase', 'local', 'gdrive', 'vercel-blob', 'r2', 'gcp')),
  path text not null,
  name text not null,
  mime_type text,
  size_bytes bigint,
  venture_id text,
  tags text[] default '{}',
  ai_tags text[] default '{}',
  ai_summary text,
  thumbnail_url text,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  accessed_at timestamptz not null default now(),
  parent_id uuid references storage_files(id) on delete set null,
  is_folder boolean not null default false,
  metadata_json jsonb not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'active', 'review', 'approved', 'archived', 'trash', 'locked')),
  stage text not null default 'concept' check (stage in ('concept', 'in-progress', 'review', 'approved', 'published', 'superseded')),
  visibility text not null default 'private' check (visibility in ('private', 'venture', 'internal', 'shared', 'public')),
  certification_json jsonb,
  trash_expires_at timestamptz,
  locked_by text,
  locked_at timestamptz,
  version_count integer not null default 1,
  content_hash text
);

comment on table storage_files is 'Unified file metadata index across all storage providers (Supabase, local, GDrive, Vercel Blob, R2, GCP). Acts as the single source of truth for file discovery regardless of where the bytes live.';

create index if not exists idx_storage_files_provider_path on storage_files(provider, path);
create index if not exists idx_storage_files_venture_id on storage_files(venture_id);
create index if not exists idx_storage_files_status on storage_files(status);
create index if not exists idx_storage_files_created_by on storage_files(created_by);
create index if not exists idx_storage_files_parent_id on storage_files(parent_id);

alter table storage_files enable row level security;

create policy "storage_files_select_own"
  on storage_files for select
  using (created_by = auth.uid()::text or visibility in ('shared', 'public'));

create policy "storage_files_insert_own"
  on storage_files for insert
  with check (created_by = auth.uid()::text);

create policy "storage_files_update_own"
  on storage_files for update
  using (created_by = auth.uid()::text);

create policy "storage_files_delete_own"
  on storage_files for delete
  using (created_by = auth.uid()::text);

-- =========================================================================
-- 2. storage_compartments — Many-to-many venture/context scoping
-- =========================================================================

create table if not exists storage_compartments (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references storage_files(id) on delete cascade,
  venture_id text not null,
  compartment text not null,
  access_level text not null default 'read' check (access_level in ('read', 'write', 'admin')),
  tags text[] default '{}',
  pinned_position integer,
  created_at timestamptz not null default now()
);

comment on table storage_compartments is 'Many-to-many mapping between files and venture/context compartments. Allows a single file to appear in multiple ventures with different access levels and pin positions.';

create index if not exists idx_storage_compartments_file_id on storage_compartments(file_id);
create index if not exists idx_storage_compartments_venture_id on storage_compartments(venture_id);
create unique index if not exists idx_storage_compartments_unique on storage_compartments(file_id, venture_id, compartment);

alter table storage_compartments enable row level security;

create policy "storage_compartments_select"
  on storage_compartments for select
  using (
    exists (
      select 1 from storage_files sf
      where sf.id = storage_compartments.file_id
        and (sf.created_by = auth.uid()::text or sf.visibility in ('shared', 'public'))
    )
  );

create policy "storage_compartments_insert"
  on storage_compartments for insert
  with check (
    exists (
      select 1 from storage_files sf
      where sf.id = storage_compartments.file_id
        and sf.created_by = auth.uid()::text
    )
  );

create policy "storage_compartments_update"
  on storage_compartments for update
  using (
    exists (
      select 1 from storage_files sf
      where sf.id = storage_compartments.file_id
        and sf.created_by = auth.uid()::text
    )
  );

create policy "storage_compartments_delete"
  on storage_compartments for delete
  using (
    exists (
      select 1 from storage_files sf
      where sf.id = storage_compartments.file_id
        and sf.created_by = auth.uid()::text
    )
  );

-- =========================================================================
-- 3. storage_versions — File version history
-- =========================================================================

create table if not exists storage_versions (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references storage_files(id) on delete cascade,
  version_number integer not null,
  provider text not null,
  path text not null,
  size_bytes bigint,
  content_hash text,
  created_by text not null,
  created_at timestamptz not null default now(),
  change_summary text
);

comment on table storage_versions is 'Immutable version history for files. Each new upload or edit creates a version record pointing to the provider-specific path of that snapshot.';

create index if not exists idx_storage_versions_file_id on storage_versions(file_id);
create unique index if not exists idx_storage_versions_unique on storage_versions(file_id, version_number);

alter table storage_versions enable row level security;

create policy "storage_versions_select"
  on storage_versions for select
  using (
    exists (
      select 1 from storage_files sf
      where sf.id = storage_versions.file_id
        and (sf.created_by = auth.uid()::text or sf.visibility in ('shared', 'public'))
    )
  );

create policy "storage_versions_insert"
  on storage_versions for insert
  with check (
    exists (
      select 1 from storage_files sf
      where sf.id = storage_versions.file_id
        and sf.created_by = auth.uid()::text
    )
  );

create policy "storage_versions_update"
  on storage_versions for update
  using (
    exists (
      select 1 from storage_files sf
      where sf.id = storage_versions.file_id
        and sf.created_by = auth.uid()::text
    )
  );

create policy "storage_versions_delete"
  on storage_versions for delete
  using (
    exists (
      select 1 from storage_files sf
      where sf.id = storage_versions.file_id
        and sf.created_by = auth.uid()::text
    )
  );

-- =========================================================================
-- 4. storage_ai_analysis — AI analysis cache per file
-- =========================================================================

create table if not exists storage_ai_analysis (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references storage_files(id) on delete cascade,
  analysis_type text not null,
  result_json jsonb not null default '{}',
  model_used text not null,
  tokens_used integer,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

comment on table storage_ai_analysis is 'Cached AI analysis results (summaries, tags, embeddings, classifications) for files. Supports TTL via expires_at to allow automatic re-analysis.';

create index if not exists idx_storage_ai_analysis_file_id on storage_ai_analysis(file_id);
create index if not exists idx_storage_ai_analysis_type on storage_ai_analysis(file_id, analysis_type);

alter table storage_ai_analysis enable row level security;

create policy "storage_ai_analysis_select"
  on storage_ai_analysis for select
  using (
    exists (
      select 1 from storage_files sf
      where sf.id = storage_ai_analysis.file_id
        and (sf.created_by = auth.uid()::text or sf.visibility in ('shared', 'public'))
    )
  );

create policy "storage_ai_analysis_insert"
  on storage_ai_analysis for insert
  with check (
    exists (
      select 1 from storage_files sf
      where sf.id = storage_ai_analysis.file_id
        and sf.created_by = auth.uid()::text
    )
  );

create policy "storage_ai_analysis_update"
  on storage_ai_analysis for update
  using (
    exists (
      select 1 from storage_files sf
      where sf.id = storage_ai_analysis.file_id
        and sf.created_by = auth.uid()::text
    )
  );

create policy "storage_ai_analysis_delete"
  on storage_ai_analysis for delete
  using (
    exists (
      select 1 from storage_files sf
      where sf.id = storage_ai_analysis.file_id
        and sf.created_by = auth.uid()::text
    )
  );

-- =========================================================================
-- 5. storage_signals — User interaction signals for personalization
-- =========================================================================

create table if not exists storage_signals (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  file_id uuid not null references storage_files(id) on delete cascade,
  action text not null,
  venture_id text,
  duration_ms integer,
  context text,
  created_at timestamptz not null default now()
);

comment on table storage_signals is 'User interaction signals (views, downloads, shares, edits) for personalization and relevance scoring. Powers smart file suggestions and usage analytics.';

create index if not exists idx_storage_signals_file_id on storage_signals(file_id);
create index if not exists idx_storage_signals_user_id on storage_signals(user_id);
create index if not exists idx_storage_signals_venture_id on storage_signals(venture_id);

alter table storage_signals enable row level security;

create policy "storage_signals_select_own"
  on storage_signals for select
  using (user_id = auth.uid()::text);

create policy "storage_signals_insert_own"
  on storage_signals for insert
  with check (user_id = auth.uid()::text);

create policy "storage_signals_update_own"
  on storage_signals for update
  using (user_id = auth.uid()::text);

create policy "storage_signals_delete_own"
  on storage_signals for delete
  using (user_id = auth.uid()::text);

-- =========================================================================
-- 6. storage_generations — Generated media tracking
-- =========================================================================

create table if not exists storage_generations (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  venture_id text,
  prompt text not null,
  model_used text not null,
  generation_type text not null,
  result_file_id uuid references storage_files(id) on delete set null,
  style_preset text,
  tokens_used integer,
  created_at timestamptz not null default now()
);

comment on table storage_generations is 'Tracks AI-generated media (images, audio, video, documents). Links generated output back to the storage_files entry and records the prompt, model, and token usage for cost tracking.';

create index if not exists idx_storage_generations_user_id on storage_generations(user_id);
create index if not exists idx_storage_generations_venture_id on storage_generations(venture_id);
create index if not exists idx_storage_generations_result_file_id on storage_generations(result_file_id);

alter table storage_generations enable row level security;

create policy "storage_generations_select_own"
  on storage_generations for select
  using (user_id = auth.uid()::text);

create policy "storage_generations_insert_own"
  on storage_generations for insert
  with check (user_id = auth.uid()::text);

create policy "storage_generations_update_own"
  on storage_generations for update
  using (user_id = auth.uid()::text);

create policy "storage_generations_delete_own"
  on storage_generations for delete
  using (user_id = auth.uid()::text);

-- =========================================================================
-- 7. storage_audit_log — Full audit trail for all storage operations
-- =========================================================================

create table if not exists storage_audit_log (
  id uuid primary key default gen_random_uuid(),
  timestamp timestamptz not null default now(),
  user_id text not null,
  file_id uuid references storage_files(id) on delete set null,
  action text not null,
  details jsonb,
  provider text,
  venture_id text,
  ip_address inet,
  previous_state jsonb,
  created_at timestamptz not null default now()
);

comment on table storage_audit_log is 'Immutable audit trail for every storage operation (create, read, update, delete, share, lock, unlock). Captures previous state for rollback forensics and compliance.';

create index if not exists idx_storage_audit_log_file_timestamp on storage_audit_log(file_id, timestamp);
create index if not exists idx_storage_audit_log_user_timestamp on storage_audit_log(user_id, timestamp);
create index if not exists idx_storage_audit_log_venture_timestamp on storage_audit_log(venture_id, timestamp);
create index if not exists idx_storage_audit_log_action on storage_audit_log(action);

alter table storage_audit_log enable row level security;

create policy "storage_audit_log_select_own"
  on storage_audit_log for select
  using (user_id = auth.uid()::text);

create policy "storage_audit_log_insert_own"
  on storage_audit_log for insert
  with check (user_id = auth.uid()::text);

-- Audit logs should not be updatable or deletable by users
-- Only service_role or database admin can modify/delete audit entries

-- =========================================================================
-- 8. storage_rag_corpora — RAG corpus metadata
-- =========================================================================

create table if not exists storage_rag_corpora (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  venture_id text,
  google_corpus_id text,
  file_count integer not null default 0,
  last_indexed_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table storage_rag_corpora is 'RAG corpus metadata for venture-scoped document collections. Tracks Google AI corpus IDs, file counts, and indexing timestamps for retrieval-augmented generation workflows.';

create index if not exists idx_storage_rag_corpora_venture_id on storage_rag_corpora(venture_id);
create index if not exists idx_storage_rag_corpora_google_corpus_id on storage_rag_corpora(google_corpus_id);

alter table storage_rag_corpora enable row level security;

create policy "storage_rag_corpora_select"
  on storage_rag_corpora for select
  using (true);

create policy "storage_rag_corpora_insert"
  on storage_rag_corpora for insert
  with check (auth.uid() is not null);

create policy "storage_rag_corpora_update"
  on storage_rag_corpora for update
  using (auth.uid() is not null);

create policy "storage_rag_corpora_delete"
  on storage_rag_corpora for delete
  using (auth.uid() is not null);

-- =========================================================================
-- Trigger: auto-update updated_at on storage_files
-- =========================================================================

create or replace function update_storage_files_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_storage_files_updated_at
  before update on storage_files
  for each row
  execute function update_storage_files_updated_at();
