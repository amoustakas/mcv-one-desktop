-- migration-venture-docs-embed.sql
--
-- Wires venture_docs.body_markdown into the RAG pipeline. Adds the plumbing
-- storage_chunks needed to carry non-file sources (venture_docs today,
-- possibly task notes, comms threads later) while keeping the existing
-- storage_files → chunks relationship intact.
--
-- storage_chunks.file_id remains the canonical pointer for uploaded files
-- (with ON DELETE CASCADE to storage_files). For venture_docs we add a
-- generic (source_type, source_id) pair so chunks can reference any row
-- without requiring a new FK per source table.
--
-- Run AFTER migration-pgvector.sql + migration-venture-docs.sql.

-- =========================================================================
-- 1. storage_chunks — generic source pointer
-- =========================================================================

alter table storage_chunks
  add column if not exists source_type text,
  add column if not exists source_id   uuid;

comment on column storage_chunks.source_type is
  'Generic origin pointer: ''file'' (legacy, also tracked by file_id), ''venture_doc'', ''note'', etc. Used for non-storage_files sources where file_id would be null.';
comment on column storage_chunks.source_id is
  'UUID of the originating row (venture_docs.id when source_type=venture_doc). Paired with source_type to identify the owner for re-index and cascade-delete.';

-- Partial index so lookups by source are fast and we only pay the index
-- cost on rows that actually use the new pointer.
create index if not exists storage_chunks_source_idx
  on storage_chunks (source_type, source_id)
  where source_id is not null;

-- =========================================================================
-- 2. venture_docs — embedding state
-- =========================================================================

alter table venture_docs
  add column if not exists last_embedded_at     timestamptz,
  add column if not exists embed_content_hash   text,
  add column if not exists embed_chunk_count    integer not null default 0;

comment on column venture_docs.last_embedded_at is
  'Timestamp of the most recent successful RAG embedding. Null = never embedded.';
comment on column venture_docs.embed_content_hash is
  'sha256 hex of body_markdown at last embedding. Cron skips docs whose hash matches — avoids redundant work when only meta/status changed.';
comment on column venture_docs.embed_chunk_count is
  'How many storage_chunks the last embedding produced. Useful for monitoring + debug.';

-- Index: cron's "find stale docs" query filters on these two columns.
create index if not exists idx_venture_docs_embed_state
  on venture_docs (last_embedded_at, updated_at)
  where body_markdown is not null;

-- =========================================================================
-- 3. Cascade-delete chunks when a venture_doc is deleted
-- =========================================================================

-- We can't add a real FK because storage_chunks.source_id is generic across
-- source_types. A trigger keeps the cleanup contract instead.

create or replace function venture_docs_cascade_chunks()
returns trigger as $$
begin
  delete from storage_chunks
   where source_type = 'venture_doc'
     and source_id = old.id;
  return old;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_venture_docs_cascade_chunks on venture_docs;
create trigger trg_venture_docs_cascade_chunks
  before delete on venture_docs
  for each row execute function venture_docs_cascade_chunks();

comment on function venture_docs_cascade_chunks is
  'Deletes RAG chunks for a venture_doc when the doc itself is deleted. Replaces the FK cascade we''d otherwise get — storage_chunks.source_id is generic, so it can''t carry a type-specific FK.';

-- =========================================================================
-- 4. RLS — venture_doc chunks need their own SELECT policy
-- =========================================================================
--
-- The existing storage_chunks_read policy requires a live storage_files FK
-- — venture_doc chunks don't have one, so they'd be unreadable to anyone
-- except service role. Mirror the venture_docs org_id check so chunks are
-- visible to the same users who can see the parent doc.

drop policy if exists storage_chunks_read_venture_doc on storage_chunks;
create policy storage_chunks_read_venture_doc on storage_chunks
  for select
  using (
    source_type = 'venture_doc'
    and exists (
      select 1
        from venture_docs vd
        join ventures v on v.id = vd.venture_id
       where vd.id = storage_chunks.source_id
         and (v.clerk_org_id is null or (auth.jwt() ->> 'org_id') = v.clerk_org_id)
    )
  );
