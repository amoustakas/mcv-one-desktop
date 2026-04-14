-- ============================================================================
-- pgvector + storage_chunks + match_chunks RPC
-- Enables real semantic retrieval for MCV One knowledge hub / RAG pipeline.
-- Safe to run multiple times — all statements are IF NOT EXISTS / OR REPLACE.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- ----------------------------------------------------------------------------
-- storage_chunks: per-file text chunks + Gemini text-embedding-004 (768-dim)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS storage_chunks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id       uuid REFERENCES storage_files(id) ON DELETE CASCADE,
  venture_id    text,
  corpus_id     uuid REFERENCES storage_rag_corpora(id) ON DELETE SET NULL,
  chunk_index   int NOT NULL,
  content       text NOT NULL,
  embedding     vector(768),
  token_count   int,
  metadata      jsonb DEFAULT '{}'::jsonb,
  created_at    timestamptz DEFAULT now(),
  UNIQUE (file_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS storage_chunks_embedding_idx
  ON storage_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
CREATE INDEX IF NOT EXISTS storage_chunks_venture_file_idx
  ON storage_chunks (venture_id, file_id);
CREATE INDEX IF NOT EXISTS storage_chunks_corpus_idx
  ON storage_chunks (corpus_id);

-- ----------------------------------------------------------------------------
-- match_chunks: cosine-similarity retrieval with optional venture + corpus filter
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.70,
  match_count     int   DEFAULT 10,
  filter_venture  text  DEFAULT NULL,
  filter_corpus   uuid  DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  file_id uuid,
  venture_id text,
  corpus_id uuid,
  chunk_index int,
  content text,
  similarity float,
  metadata jsonb
)
LANGUAGE sql STABLE AS $$
  SELECT
    c.id, c.file_id, c.venture_id, c.corpus_id, c.chunk_index, c.content,
    1 - (c.embedding <=> query_embedding) AS similarity,
    c.metadata
  FROM storage_chunks c
  WHERE c.embedding IS NOT NULL
    AND (filter_venture IS NULL OR c.venture_id = filter_venture)
    AND (filter_corpus  IS NULL OR c.corpus_id  = filter_corpus)
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ----------------------------------------------------------------------------
-- RLS: mirror storage_files access. Service role bypasses.
-- ----------------------------------------------------------------------------
ALTER TABLE storage_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS storage_chunks_read ON storage_chunks;
CREATE POLICY storage_chunks_read ON storage_chunks
  FOR SELECT
  USING (
    -- Any authed user can read chunks for files they can read.
    EXISTS (
      SELECT 1 FROM storage_files f
      WHERE f.id = storage_chunks.file_id
    )
  );

DROP POLICY IF EXISTS storage_chunks_write ON storage_chunks;
CREATE POLICY storage_chunks_write ON storage_chunks
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ----------------------------------------------------------------------------
-- Helpful view: corpus stats
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_corpus_stats AS
SELECT
  c.id            AS corpus_id,
  c.name          AS corpus_name,
  c.venture_id,
  COUNT(DISTINCT ch.file_id)   AS file_count,
  COUNT(ch.id)                 AS chunk_count,
  MAX(ch.created_at)           AS last_indexed_at
FROM storage_rag_corpora c
LEFT JOIN storage_chunks ch ON ch.corpus_id = c.id
GROUP BY c.id, c.name, c.venture_id;

COMMENT ON TABLE  storage_chunks IS 'Embedded text chunks for semantic retrieval. embedding uses text-embedding-004 (768-dim).';
COMMENT ON FUNCTION match_chunks IS 'Cosine similarity retrieval. Returns rows where similarity > threshold.';
