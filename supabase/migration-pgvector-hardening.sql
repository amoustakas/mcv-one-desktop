-- ============================================================================
-- Security hardening follow-up for migration-pgvector.sql.
-- Applied live on 2026-04-13 via Supabase MCP; this file mirrors it for git.
--   1. Recreate v_corpus_stats with security_invoker so the view respects
--      the querying user's RLS instead of the creator's.
--   2. Pin search_path on match_chunks + update_storage_files_updated_at to
--      prevent search-path injection.
-- ============================================================================

DROP VIEW IF EXISTS v_corpus_stats;
CREATE VIEW v_corpus_stats WITH (security_invoker = true) AS
SELECT c.id            AS corpus_id,
       c.name          AS corpus_name,
       c.venture_id,
       COUNT(DISTINCT ch.file_id) AS file_count,
       COUNT(ch.id)               AS chunk_count,
       MAX(ch.created_at)         AS last_indexed_at
FROM storage_rag_corpora c
LEFT JOIN storage_chunks ch ON ch.corpus_id = c.id
GROUP BY c.id, c.name, c.venture_id;

ALTER FUNCTION match_chunks(vector, float, int, text, uuid)
  SET search_path = public, pg_catalog;
ALTER FUNCTION update_storage_files_updated_at()
  SET search_path = public, pg_catalog;
