-- supabase/migration-capital-ux.sql
-- EdgeIQ Capital — UX-only tables (not part of the ledger)
-- SPEC-EQC-001 — Epic 1, Story 2
-- Apply AFTER migration-capital.sql.

-- ═══════════════════════════════════════════════════════════
-- CAPITAL_SAVED_VIEWS — user's saved filter state on commitment grid
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS capital_saved_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  venture_id TEXT,
  name TEXT NOT NULL,
  surface TEXT NOT NULL CHECK (surface IN ('commitments', 'investors', 'rounds', 'documents', 'activities')),
  filters JSONB NOT NULL DEFAULT '{}',
  sort JSONB NOT NULL DEFAULT '[]',
  columns JSONB NOT NULL DEFAULT '[]',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_capital_views_user ON capital_saved_views (user_id, surface);

-- ═══════════════════════════════════════════════════════════
-- CAPITAL_DASHBOARD_PREFS — per-user layout
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS capital_dashboard_prefs (
  user_id TEXT PRIMARY KEY,
  layout JSONB NOT NULL DEFAULT '{}',
  pinned_ventures JSONB NOT NULL DEFAULT '[]',
  pinned_rounds JSONB NOT NULL DEFAULT '[]',
  default_date_range TEXT NOT NULL DEFAULT '30d',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════
-- CAPITAL_IMPORT_JOBS — CSV import pipeline tracking
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS capital_import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  source_file_url TEXT NOT NULL,
  source_filename TEXT,
  target_surface TEXT NOT NULL CHECK (target_surface IN ('contacts', 'commitments', 'rounds', 'organizations')),
  field_mapping JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'partial')),
  rows_total INTEGER NOT NULL DEFAULT 0,
  rows_processed INTEGER NOT NULL DEFAULT 0,
  rows_succeeded INTEGER NOT NULL DEFAULT 0,
  rows_failed INTEGER NOT NULL DEFAULT 0,
  errors JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_capital_imports_venture ON capital_import_jobs (venture_id, status);
CREATE INDEX IF NOT EXISTS idx_capital_imports_user ON capital_import_jobs (user_id, created_at DESC);

-- ═══════════════════════════════════════════════════════════
-- CAPITAL_EPIC_LINKS — junction so rounds surface in EpicBoardView
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS capital_epic_links (
  epic_id UUID NOT NULL,
  round_id UUID NOT NULL,
  link_type TEXT NOT NULL DEFAULT 'tracks' CHECK (link_type IN ('tracks', 'delivers', 'blocks', 'related')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (epic_id, round_id)
);

CREATE INDEX IF NOT EXISTS idx_capital_epic_links_round ON capital_epic_links (round_id);

-- ═══════════════════════════════════════════════════════════
-- updated_at trigger
-- ═══════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS trg_capital_views_updated_at ON capital_saved_views;
CREATE TRIGGER trg_capital_views_updated_at BEFORE UPDATE ON capital_saved_views
  FOR EACH ROW EXECUTE FUNCTION update_capital_updated_at();

DROP TRIGGER IF EXISTS trg_capital_prefs_updated_at ON capital_dashboard_prefs;
CREATE TRIGGER trg_capital_prefs_updated_at BEFORE UPDATE ON capital_dashboard_prefs
  FOR EACH ROW EXECUTE FUNCTION update_capital_updated_at();

-- ═══════════════════════════════════════════════════════════
-- RLS
-- ═══════════════════════════════════════════════════════════

ALTER TABLE capital_saved_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_dashboard_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_epic_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "capital_views_self" ON capital_saved_views;
CREATE POLICY "capital_views_self" ON capital_saved_views FOR ALL USING (auth.uid()::text = user_id OR auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "capital_prefs_self" ON capital_dashboard_prefs;
CREATE POLICY "capital_prefs_self" ON capital_dashboard_prefs FOR ALL USING (auth.uid()::text = user_id OR auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "capital_imports_select" ON capital_import_jobs;
CREATE POLICY "capital_imports_select" ON capital_import_jobs FOR SELECT USING (true);
DROP POLICY IF EXISTS "capital_imports_write" ON capital_import_jobs;
CREATE POLICY "capital_imports_write" ON capital_import_jobs FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "capital_epic_links_select" ON capital_epic_links;
CREATE POLICY "capital_epic_links_select" ON capital_epic_links FOR SELECT USING (true);
DROP POLICY IF EXISTS "capital_epic_links_write" ON capital_epic_links;
CREATE POLICY "capital_epic_links_write" ON capital_epic_links FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE capital_import_jobs;
    ALTER PUBLICATION supabase_realtime ADD TABLE capital_epic_links;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
