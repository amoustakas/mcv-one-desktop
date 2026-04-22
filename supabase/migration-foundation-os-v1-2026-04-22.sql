-- supabase/migration-foundation-os-v1-2026-04-22.sql
--
-- Foundation OS v1 — operationalizes Tony's .docs/counsel corpus (IP Inventory v1.1,
-- Counsel Onboarding Pack v2.0, 6 T0-T6 CSVs) as first-class rows the cockpit can
-- surface and NAOS can query / mutate through foundation-kit.
--
-- Nine new tables:
--   ip_marks            — trademarks, patents, copyrights, trade secrets (unified kind discriminator)
--   counsel_engagements — law firms on the 3 workstreams (Corp/Tax, IP, Securities)
--   counsel_tasks       — CT-1..CT-9, IP-1..IP-7, SEC-1..SEC-6 task tables
--   filing_records      — every filing action; each emits a journal_entries row via LedgerAdapter
--   acquisition_orders  — domain / mark / asset buy queue (🔴 FutureState triplet, 🟠 naos.ai/coretriangle.com)
--   naming_ratifications — 6 deprecated→ratified mappings (Citizen/Root/Weave/Chorus/Unsworn/MCV Atlas)
--   naming_occurrences  — per-file per-line scan results, classified, approvable in batches
--   naming_batches      — audit-friendly approval/apply batches with pre/post commit SHAs for rollback
--   docs_ingestion_runs — audit of corpus ingestion passes
--
-- Convention choices (matches existing MCV migrations):
--   • Enum vocabularies live as TEXT columns with CHECK (col IN (...)) constraints,
--     NOT as Postgres CREATE TYPE enums. Consistent with every other migration in this
--     repo and trivially extensible (CHECK update vs ALTER TYPE ceremony).
--   • capital_legal_entity.id is TEXT PRIMARY KEY — FKs from this migration use
--     `text references capital_legal_entity(id)`.
--   • domain_registry.id is UUID — ip_marks.domain_fk uses uuid.
--   • epics.id is UUID — counsel_tasks.epic_id uses uuid.
--   • filing_records.journal_entry_id references journal_entries(id) directly; the
--     CapitalFlow kind ('ip_filing_expense') rides on journal_entries.source_type.
--
-- RLS: authenticated SELECT requires auth.jwt()->>'role' = 'mcv_admin'. Service role
-- bypasses (writes run backend-only through @mcv/foundation-sdk). Foundation data is
-- org-level, not venture-scoped — no venture_scope predicate.

-- ============================================================================
-- 1. ip_marks — unified registry of every IP asset
-- ============================================================================

CREATE TABLE IF NOT EXISTS ip_marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mark_text text NOT NULL,
  mark_kind text NOT NULL CHECK (mark_kind IN ('trademark','patent','copyright','trade_secret')),
  priority_tier text NOT NULL CHECK (priority_tier IN ('P0','P1','P2','P3','DNF','PP0','PP1','PP2')),
  classes int[] NOT NULL DEFAULT '{}',                 -- Nice classes for TMs
  jurisdictions text[] NOT NULL DEFAULT '{}',          -- 'US','CA','EU','UK','SG','UAE'
  owner_entity_id text REFERENCES capital_legal_entity(id),
  holding_chain_stage text NOT NULL DEFAULT 'interim_mcv_inc'
    CHECK (holding_chain_stage IN ('interim_mcv_inc','final_root','transferred')),
  domain_fk uuid REFERENCES domain_registry(id),
  status text NOT NULL DEFAULT 'identified'
    CHECK (status IN ('identified','clearance_in_progress','filed','published','registered','refused','abandoned')),
  filing_number text,
  registration_number text,
  filed_at timestamptz,
  registered_at timestamptz,
  renewal_due timestamptz,
  is_compound boolean NOT NULL DEFAULT false,
  compound_parent_mark_id uuid REFERENCES ip_marks(id),
  -- Patent-specific extension columns (null unless mark_kind='patent')
  claim_summary text,
  novelty_hook text,
  supporting_artifacts text[] DEFAULT '{}',
  provisional_draft_status text CHECK (provisional_draft_status IS NULL
    OR provisional_draft_status IN ('unscoped','outline','draft','reviewed','filed')),
  filing_vehicle text CHECK (filing_vehicle IS NULL
    OR filing_vehicle IN ('counsel_drafted','patent_nlp','hybrid')),
  notes text,
  source_doc text,           -- which counsel doc this was seeded from
  source_section text,       -- e.g. '§1.4', '§2.2'
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ip_marks_patent_cols CHECK (
    mark_kind = 'patent'
    OR (claim_summary IS NULL AND novelty_hook IS NULL
        AND provisional_draft_status IS NULL AND filing_vehicle IS NULL)
  ),
  CONSTRAINT ip_marks_mark_tier_kind_unique UNIQUE (mark_text, mark_kind, priority_tier)
);

CREATE INDEX IF NOT EXISTS idx_ip_marks_kind ON ip_marks(mark_kind);
CREATE INDEX IF NOT EXISTS idx_ip_marks_tier ON ip_marks(priority_tier);
CREATE INDEX IF NOT EXISTS idx_ip_marks_status ON ip_marks(status);
CREATE INDEX IF NOT EXISTS idx_ip_marks_owner ON ip_marks(owner_entity_id);
CREATE INDEX IF NOT EXISTS idx_ip_marks_domain ON ip_marks(domain_fk);
CREATE INDEX IF NOT EXISTS idx_ip_marks_compound_parent ON ip_marks(compound_parent_mark_id);
CREATE INDEX IF NOT EXISTS idx_ip_marks_holding_stage ON ip_marks(holding_chain_stage);

COMMENT ON TABLE ip_marks IS 'Unified IP registry: trademarks / patents / copyrights / trade secrets. Patent extension columns gated by CHECK constraint. Seeded from MCV-IP-Inventory-v1.1.md.';

-- ============================================================================
-- 2. counsel_engagements — law firms on 3 workstreams
-- ============================================================================

CREATE TABLE IF NOT EXISTS counsel_engagements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_name text NOT NULL,
  workstream text NOT NULL CHECK (workstream IN ('corp_tax','ip','securities')),
  contact_name text,
  contact_email text,
  status text NOT NULL DEFAULT 'prospecting'
    CHECK (status IN ('prospecting','nda_sent','nda_executed','engagement_letter_sent','engaged','active','paused','closed')),
  conflicts_check_status text NOT NULL DEFAULT 'not_run'
    CHECK (conflicts_check_status IN ('not_run','clean','conflict_flagged')),
  scoping_call_at timestamptz,
  engagement_letter_url text,
  nda_template_used text CHECK (nda_template_used IS NULL OR nda_template_used IN ('capital','partner')),
  nda_executed_at timestamptz,
  budget_allocated_usd numeric(14,2) NOT NULL DEFAULT 0,
  budget_consumed_usd numeric(14,2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_counsel_engagements_workstream ON counsel_engagements(workstream);
CREATE INDEX IF NOT EXISTS idx_counsel_engagements_status ON counsel_engagements(status);

COMMENT ON TABLE counsel_engagements IS 'Law firm engagements — one per (firm, workstream). Workstream is corp_tax | ip | securities.';

-- ============================================================================
-- 3. counsel_tasks — CT-1..CT-9, IP-1..IP-7, SEC-1..SEC-6
-- ============================================================================

CREATE TABLE IF NOT EXISTS counsel_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_code text UNIQUE NOT NULL,                       -- 'CT-1','IP-3','SEC-2'
  workstream text NOT NULL CHECK (workstream IN ('corp_tax','ip','securities')),
  title text NOT NULL,
  description text,
  deliverable text,
  depends_on text[] NOT NULL DEFAULT '{}',              -- other task_codes
  critical_path boolean NOT NULL DEFAULT false,
  assigned_engagement_id uuid REFERENCES counsel_engagements(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'backlog'
    CHECK (status IN ('backlog','proposed','approved','in_progress','review','done','blocked')),
  priority int NOT NULL DEFAULT 100,
  due_at timestamptz,
  completed_at timestamptz,
  epic_id uuid REFERENCES epics(id) ON DELETE SET NULL,
  source_doc text,
  source_section text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_counsel_tasks_workstream ON counsel_tasks(workstream);
CREATE INDEX IF NOT EXISTS idx_counsel_tasks_status ON counsel_tasks(status);
CREATE INDEX IF NOT EXISTS idx_counsel_tasks_engagement ON counsel_tasks(assigned_engagement_id);
CREATE INDEX IF NOT EXISTS idx_counsel_tasks_epic ON counsel_tasks(epic_id);
CREATE INDEX IF NOT EXISTS idx_counsel_tasks_critical ON counsel_tasks(critical_path) WHERE critical_path;

COMMENT ON TABLE counsel_tasks IS 'Counsel Pack v2.0 task tables — 9 corp/tax + 7 IP + 6 securities = 22 task codes.';

-- ============================================================================
-- 4. filing_records — every filing action emits a journal_entries row via LedgerAdapter
-- ============================================================================

CREATE TABLE IF NOT EXISTS filing_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_mark_id uuid NOT NULL REFERENCES ip_marks(id) ON DELETE CASCADE,
  filing_type text NOT NULL
    CHECK (filing_type IN ('clearance_search','trademark_filing','provisional_patent','utility_patent','copyright_registration','madrid_extension','renewal')),
  jurisdiction text NOT NULL,
  filed_at timestamptz,
  filing_number text,
  counsel_engagement_id uuid REFERENCES counsel_engagements(id) ON DELETE SET NULL,
  fee_filing_usd numeric(14,2) NOT NULL DEFAULT 0,
  fee_counsel_usd numeric(14,2) NOT NULL DEFAULT 0,
  fee_total_usd numeric(14,2) GENERATED ALWAYS AS (fee_filing_usd + fee_counsel_usd) STORED,
  status text NOT NULL DEFAULT 'filed'
    CHECK (status IN ('identified','clearance_in_progress','filed','published','registered','refused','abandoned')),
  notes text,
  journal_entry_id uuid REFERENCES journal_entries(id) ON DELETE SET NULL,  -- nullable until LedgerAdapter posts
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_filing_records_mark ON filing_records(ip_mark_id);
CREATE INDEX IF NOT EXISTS idx_filing_records_engagement ON filing_records(counsel_engagement_id);
CREATE INDEX IF NOT EXISTS idx_filing_records_type ON filing_records(filing_type);
CREATE INDEX IF NOT EXISTS idx_filing_records_journal_entry ON filing_records(journal_entry_id);

COMMENT ON TABLE filing_records IS 'Each row = one filing action (clearance / TM filing / provisional / utility / Madrid / renewal). FilingsService emits a double-entry journal via LedgerAdapter on insert; the resulting journal_entries row carries source_type=''ip_filing_expense'' (CapitalFlow kind) and source_id=filing_record.id. journal_entry_id is backfilled after post.';

-- ============================================================================
-- 5. acquisition_orders — domain / mark / asset buy queue
-- ============================================================================

CREATE TABLE IF NOT EXISTS acquisition_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_kind text NOT NULL CHECK (asset_kind IN ('domain','trademark_purchase','patent_purchase')),
  asset_identifier text NOT NULL,                       -- e.g. 'futurestate.app'
  urgency_tier text NOT NULL
    CHECK (urgency_tier IN ('red_7day','orange_30day','yellow_90day','green_defensive')),
  target_registrar text,
  price_cad numeric(14,2),
  price_usd numeric(14,2),
  broker_contact text,
  status text NOT NULL DEFAULT 'scoped'
    CHECK (status IN ('scoped','cart','acquired','deferred','killed')),
  blocks_disclosure boolean NOT NULL DEFAULT false,
  blocks_venture_name text,
  notes text,
  acquired_at timestamptz,
  acquired_registrar text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT acquisition_orders_asset_unique UNIQUE (asset_kind, asset_identifier)
);

CREATE INDEX IF NOT EXISTS idx_acq_orders_urgency ON acquisition_orders(urgency_tier);
CREATE INDEX IF NOT EXISTS idx_acq_orders_status ON acquisition_orders(status);
CREATE INDEX IF NOT EXISTS idx_acq_orders_blocks_disclosure ON acquisition_orders(blocks_disclosure) WHERE blocks_disclosure;

COMMENT ON TABLE acquisition_orders IS 'Acquisition queue for domains / TM purchases / patent purchases. red_7day tier surfaces 🔴 in DomainPortfolioView.';

-- ============================================================================
-- 6. naming_ratifications — 6 deprecated→ratified mappings
-- ============================================================================

CREATE TABLE IF NOT EXISTS naming_ratifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deprecated_name text NOT NULL,
  ratified_name text NOT NULL,
  context text NOT NULL DEFAULT 'any' CHECK (context IN ('prose','identifier','any')),
  effective_at timestamptz NOT NULL DEFAULT now(),
  rationale text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT naming_ratifications_deprecated_context_unique UNIQUE (deprecated_name, context)
);

COMMENT ON TABLE naming_ratifications IS 'Deprecated→ratified naming mappings. 6 rows seeded per IP Inventory v1.1 §0.1.';

-- Seed the 6 ratified names inline (Locked per Tony — no external source needed).
INSERT INTO naming_ratifications (deprecated_name, ratified_name, context, rationale) VALUES
  ('Sovereign Citizen', 'Citizen',   'any',  'Brand-risk kill — institutional LPs pattern-match "Sovereign Citizen" to the legal-extremist movement. See IP Inventory §9.3.'),
  ('Covenant',          'Root',      'any',  'Naming ratification per IP Inventory v1.1 §0.1. Root names the Layer 0 Purpose Trust.'),
  ('Confluence',        'Weave',     'any',  'Naming ratification per IP Inventory v1.1 §0.1.'),
  ('Whole',             'Chorus',    'any',  'Naming ratification per IP Inventory v1.1 §0.1.'),
  ('Unhoused',          'Unsworn',   'any',  'Naming ratification per IP Inventory v1.1 §0.1. Distinctive in civic/gaming context.'),
  ('ATLAS',             'MCV Atlas', 'prose','Compound filing strategy per IP Inventory §1.5 — standalone ATLAS faces massive prior art (CERN, MongoDB, etc.). Only rewrite prose occurrences; identifiers like agent id ''atlas'' stay.')
ON CONFLICT (deprecated_name, context) DO NOTHING;

-- ============================================================================
-- 7. naming_batches — audit-friendly approval/apply batches with rollback support
-- ============================================================================

CREATE TABLE IF NOT EXISTS naming_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  approved_by text,
  approved_at timestamptz,
  applied_at timestamptz,
  commit_sha text,                                      -- post-apply commit
  pre_commit_sha text,                                  -- recorded before apply for rollback
  occurrence_count int NOT NULL DEFAULT 0,
  rollback_of uuid REFERENCES naming_batches(id),       -- self-FK: if this batch reverts another
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_naming_batches_applied ON naming_batches(applied_at);
CREATE INDEX IF NOT EXISTS idx_naming_batches_rollback ON naming_batches(rollback_of);

COMMENT ON TABLE naming_batches IS 'Groups approved naming_occurrences into a single git commit. pre_commit_sha enables rollback.';

-- ============================================================================
-- 8. naming_occurrences — per-file per-line scan results, classified, approvable
-- ============================================================================

CREATE TABLE IF NOT EXISTS naming_occurrences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ratification_id uuid NOT NULL REFERENCES naming_ratifications(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  line_number int NOT NULL,
  column_number int NOT NULL,
  context_before text,
  match_text text NOT NULL,
  context_after text,
  occurrence_kind text NOT NULL
    CHECK (occurrence_kind IN ('markdown_prose','code_comment','string_literal','identifier','import_path','type_name','test_name','ui_copy')),
  classification text NOT NULL DEFAULT 'ambiguous'
    CHECK (classification IN ('safe','risky','unsafe','ambiguous')),
  proposed_replacement text,
  approval_status text NOT NULL DEFAULT 'pending'
    CHECK (approval_status IN ('pending','approved','rejected','applied')),
  approved_by text,
  approved_at timestamptz,
  applied_at timestamptz,
  commit_sha text,
  batch_id uuid REFERENCES naming_batches(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_naming_occ_ratification ON naming_occurrences(ratification_id);
CREATE INDEX IF NOT EXISTS idx_naming_occ_status ON naming_occurrences(approval_status);
CREATE INDEX IF NOT EXISTS idx_naming_occ_file ON naming_occurrences(file_path);
CREATE INDEX IF NOT EXISTS idx_naming_occ_batch ON naming_occurrences(batch_id);
CREATE INDEX IF NOT EXISTS idx_naming_occ_classification ON naming_occurrences(classification);

COMMENT ON TABLE naming_occurrences IS 'Per-file per-line scan output. Classification drives whether a row is auto-approvable (safe) or requires override (unsafe).';

-- ============================================================================
-- 9. docs_ingestion_runs — audit of corpus ingestion passes
-- ============================================================================

CREATE TABLE IF NOT EXISTS docs_ingestion_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_path text NOT NULL,
  source_kind text NOT NULL
    CHECK (source_kind IN ('counsel_markdown','csv_portfolio','csv_entities','csv_gaps','csv_carts')),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  rows_inserted int NOT NULL DEFAULT 0,
  chunks_embedded int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running','ok','failed')),
  error_log text
);

CREATE INDEX IF NOT EXISTS idx_ingestion_runs_path ON docs_ingestion_runs(source_path, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_ingestion_runs_status ON docs_ingestion_runs(status);

COMMENT ON TABLE docs_ingestion_runs IS 'Audit trail of counsel-corpus ingestion runs. Append-only — one row per run per source file.';

-- ============================================================================
-- 10. RLS — authenticated select requires mcv_admin role; service role bypasses
-- ============================================================================

ALTER TABLE ip_marks             ENABLE ROW LEVEL SECURITY;
ALTER TABLE counsel_engagements  ENABLE ROW LEVEL SECURITY;
ALTER TABLE counsel_tasks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE filing_records       ENABLE ROW LEVEL SECURITY;
ALTER TABLE acquisition_orders   ENABLE ROW LEVEL SECURITY;
ALTER TABLE naming_ratifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE naming_occurrences   ENABLE ROW LEVEL SECURITY;
ALTER TABLE naming_batches       ENABLE ROW LEVEL SECURITY;
ALTER TABLE docs_ingestion_runs  ENABLE ROW LEVEL SECURITY;

-- Drop-then-create so this migration is idempotent
DROP POLICY IF EXISTS "ip_marks_admin_select" ON ip_marks;
CREATE POLICY "ip_marks_admin_select" ON ip_marks
  FOR SELECT TO authenticated
  USING ((auth.jwt() ->> 'role') = 'mcv_admin');

DROP POLICY IF EXISTS "counsel_engagements_admin_select" ON counsel_engagements;
CREATE POLICY "counsel_engagements_admin_select" ON counsel_engagements
  FOR SELECT TO authenticated
  USING ((auth.jwt() ->> 'role') = 'mcv_admin');

DROP POLICY IF EXISTS "counsel_tasks_admin_select" ON counsel_tasks;
CREATE POLICY "counsel_tasks_admin_select" ON counsel_tasks
  FOR SELECT TO authenticated
  USING ((auth.jwt() ->> 'role') = 'mcv_admin');

DROP POLICY IF EXISTS "filing_records_admin_select" ON filing_records;
CREATE POLICY "filing_records_admin_select" ON filing_records
  FOR SELECT TO authenticated
  USING ((auth.jwt() ->> 'role') = 'mcv_admin');

DROP POLICY IF EXISTS "acquisition_orders_admin_select" ON acquisition_orders;
CREATE POLICY "acquisition_orders_admin_select" ON acquisition_orders
  FOR SELECT TO authenticated
  USING ((auth.jwt() ->> 'role') = 'mcv_admin');

-- naming_ratifications is effectively public-read for authenticated users
-- (the 6 mappings are already external-facing brand updates); scan results stay admin.
DROP POLICY IF EXISTS "naming_ratifications_authenticated_select" ON naming_ratifications;
CREATE POLICY "naming_ratifications_authenticated_select" ON naming_ratifications
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "naming_occurrences_admin_select" ON naming_occurrences;
CREATE POLICY "naming_occurrences_admin_select" ON naming_occurrences
  FOR SELECT TO authenticated
  USING ((auth.jwt() ->> 'role') = 'mcv_admin');

DROP POLICY IF EXISTS "naming_batches_admin_select" ON naming_batches;
CREATE POLICY "naming_batches_admin_select" ON naming_batches
  FOR SELECT TO authenticated
  USING ((auth.jwt() ->> 'role') = 'mcv_admin');

DROP POLICY IF EXISTS "docs_ingestion_runs_admin_select" ON docs_ingestion_runs;
CREATE POLICY "docs_ingestion_runs_admin_select" ON docs_ingestion_runs
  FOR SELECT TO authenticated
  USING ((auth.jwt() ->> 'role') = 'mcv_admin');

-- ============================================================================
-- 11. updated_at triggers — match the convention used by capital_legal_entity
-- ============================================================================

CREATE OR REPLACE FUNCTION foundation_touch_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $fn$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_ip_marks_updated ON ip_marks;
CREATE TRIGGER trg_ip_marks_updated BEFORE UPDATE ON ip_marks
  FOR EACH ROW EXECUTE FUNCTION foundation_touch_updated_at();

DROP TRIGGER IF EXISTS trg_counsel_engagements_updated ON counsel_engagements;
CREATE TRIGGER trg_counsel_engagements_updated BEFORE UPDATE ON counsel_engagements
  FOR EACH ROW EXECUTE FUNCTION foundation_touch_updated_at();

DROP TRIGGER IF EXISTS trg_counsel_tasks_updated ON counsel_tasks;
CREATE TRIGGER trg_counsel_tasks_updated BEFORE UPDATE ON counsel_tasks
  FOR EACH ROW EXECUTE FUNCTION foundation_touch_updated_at();

DROP TRIGGER IF EXISTS trg_acquisition_orders_updated ON acquisition_orders;
CREATE TRIGGER trg_acquisition_orders_updated BEFORE UPDATE ON acquisition_orders
  FOR EACH ROW EXECUTE FUNCTION foundation_touch_updated_at();

-- ============================================================================
-- End of migration-foundation-os-v1-2026-04-22.sql
-- Expected post-ingestion counts:
--   ip_marks: ~108 (75 TM + 13 patent + 20 copyright)
--   counsel_engagements: 3 (Corp/Tax, IP, Securities — status='prospecting')
--   counsel_tasks: 22 (9 CT + 7 IP + 6 SEC)
--   acquisition_orders: 5 🔴🟠 + deferred rows for 🟡🟢
--   naming_ratifications: 6 (seeded above, locked)
--   domain_registry: upsert to 111 total (28 owned + 83 pending)
--   epics: +23 (1 Foundation OS v1 parent + 22 counsel_tasks children)
-- ============================================================================
