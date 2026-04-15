-- supabase/migration-capital-content-integration.sql
-- EdgeIQ Capital × Content OS integration — additive only.
-- See docs/capital/CONTENT_INTEGRATION.md.

-- 1. capital_documents.content_id — link to a live content row for rich rendering
ALTER TABLE capital_documents
  ADD COLUMN IF NOT EXISTS content_id UUID REFERENCES content(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_capital_docs_content ON capital_documents (content_id) WHERE content_id IS NOT NULL;

-- 2. capital_round_content — M:N between rounds and content rows, typed by role
CREATE TABLE IF NOT EXISTS capital_round_content (
  round_id      UUID NOT NULL REFERENCES capital_rounds(id) ON DELETE CASCADE,
  content_id    UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  role          TEXT NOT NULL CHECK (role IN (
    'description', 'announcement', 'update', 'term_sheet', 'om',
    'pitch_deck_notes', 'safe_template', 'subscription_template', 'other'
  )),
  is_primary    BOOLEAN NOT NULL DEFAULT false,
  ordinal       INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (round_id, content_id, role)
);
CREATE INDEX IF NOT EXISTS idx_capital_round_content_round ON capital_round_content (round_id, role);
CREATE INDEX IF NOT EXISTS idx_capital_round_content_content ON capital_round_content (content_id);

-- Enforce at most one primary per (round_id, role)
CREATE UNIQUE INDEX IF NOT EXISTS idx_capital_round_content_primary
  ON capital_round_content (round_id, role)
  WHERE is_primary = true;

-- 3. capital_commitments.receipt_content_id — link commitment to receipt content
ALTER TABLE capital_commitments
  ADD COLUMN IF NOT EXISTS receipt_content_id UUID REFERENCES content(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_capital_commits_receipt ON capital_commitments (receipt_content_id) WHERE receipt_content_id IS NOT NULL;

-- 4. RLS on new junction
ALTER TABLE capital_round_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS capital_round_content_select ON capital_round_content;
CREATE POLICY capital_round_content_select ON capital_round_content FOR SELECT USING (true);
DROP POLICY IF EXISTS capital_round_content_write ON capital_round_content;
CREATE POLICY capital_round_content_write ON capital_round_content FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- 5. Realtime
DO $pub$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE capital_round_content;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $pub$;
