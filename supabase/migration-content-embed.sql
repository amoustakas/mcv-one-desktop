-- supabase/migration-content-embed.sql
-- Extends storage_chunks to index the `content` table (if/when it exists)
-- alongside venture_docs. Mirrors the polymorphic source_type pattern
-- introduced in migration-venture-docs-embed.sql.
--
-- This migration is a no-op when `content` table already exists with the
-- fields below. Safe to run multiple times.

-- Ensure `content` table has fields the embed pipeline needs.
-- (Content model ships in src/lib/storage; these columns may already exist.)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='content') THEN
    -- Add embed-state columns if missing
    BEGIN
      ALTER TABLE content ADD COLUMN IF NOT EXISTS content_hash TEXT;
      ALTER TABLE content ADD COLUMN IF NOT EXISTS last_embedded_at TIMESTAMPTZ;
      ALTER TABLE content ADD COLUMN IF NOT EXISTS embed_chunk_count INTEGER DEFAULT 0;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'content table ALTER skipped: %', SQLERRM;
    END;

    -- Partial index for the "stale or never-embedded" query the cron runs
    CREATE INDEX IF NOT EXISTS idx_content_embed_stale
      ON content (venture_id, updated_at)
      WHERE last_embedded_at IS NULL OR last_embedded_at < updated_at;
  END IF;
END $$;

-- storage_chunks already has source_type/source_id from migration-venture-docs-embed.sql.
-- Just ensure source_type='content' is usable and there's an index on (source_type, source_id).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'storage_chunks_source_content_idx'
  ) THEN
    CREATE INDEX storage_chunks_source_content_idx
      ON storage_chunks (source_id)
      WHERE source_type = 'content';
  END IF;
END $$;
