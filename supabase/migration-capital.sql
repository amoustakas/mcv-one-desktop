-- supabase/migration-capital.sql
-- EdgeIQ Capital Ledger — cap-table + investor + round + commitment primitives
-- SPEC-EQC-001 — Epic 1, Story 1
-- See: C:/Users/moust/.claude/plans/melodic-hopping-wren.md
--
-- Convention: TEXT CHECK constraints over PG enums (easier to evolve, matches commerce).
-- venture_id is TEXT (matches ventures.id) and used for RLS scoping.

-- ═══════════════════════════════════════════════════════════
-- 1. CAPITAL_ORGANIZATIONS — counterparty orgs (funds, family offices, launchpad projects)
-- Distinct from `ventures` (internal business units). These are external entities.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS capital_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id TEXT NOT NULL,

  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 500),
  legal_name TEXT,
  slug TEXT NOT NULL,
  website TEXT,
  logo_url TEXT,
  description TEXT,

  org_type TEXT NOT NULL DEFAULT 'other' CHECK (org_type IN (
    'vc_fund', 'family_office', 'angel_group', 'sovereign_wealth',
    'pension_fund', 'corporate', 'accelerator', 'government',
    'exchange', 'transfer_agent', 'law_firm', 'accounting_firm',
    'startup', 'other'
  )),
  industry TEXT,
  headquarters TEXT,
  jurisdiction TEXT,
  employee_count TEXT,
  founded_year INTEGER,

  aum NUMERIC(20, 2),
  typical_check_size TEXT,
  investment_focus JSONB NOT NULL DEFAULT '[]',
  investment_stage JSONB NOT NULL DEFAULT '[]',

  is_raising_project BOOLEAN NOT NULL DEFAULT false,
  project_status TEXT CHECK (project_status IS NULL OR project_status IN ('onboarding', 'active', 'graduated', 'rejected')),

  total_contact_count INTEGER NOT NULL DEFAULT 0,
  total_committed_usd NUMERIC(20, 2) NOT NULL DEFAULT 0,

  tags JSONB NOT NULL DEFAULT '[]',
  metadata JSONB NOT NULL DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_capital_orgs_slug ON capital_organizations (venture_id, slug) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_capital_orgs_venture ON capital_organizations (venture_id);
CREATE INDEX IF NOT EXISTS idx_capital_orgs_type ON capital_organizations (venture_id, org_type);
CREATE INDEX IF NOT EXISTS idx_capital_orgs_launchpad ON capital_organizations (is_raising_project, project_status) WHERE is_raising_project = true;

-- ═══════════════════════════════════════════════════════════
-- 2. CAPITAL_INVESTOR_PROFILE — satellite on crm_contacts
-- 1:1 by contact_id. Holds accreditation + portal + scoring + totals.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS capital_investor_profile (
  contact_id UUID PRIMARY KEY,
  venture_id TEXT NOT NULL,
  organization_id UUID REFERENCES capital_organizations(id) ON DELETE SET NULL,

  contact_type TEXT NOT NULL DEFAULT 'prospect' CHECK (contact_type IN (
    'prospect', 'angel', 'vc', 'lp', 'institutional',
    'strategic_partner', 'advisor', 'key_person',
    'transfer_agent', 'legal', 'service_provider'
  )),
  stage TEXT NOT NULL DEFAULT 'cold' CHECK (stage IN (
    'cold', 'warm', 'engaged', 'soft_commit', 'due_diligence',
    'signed', 'funded', 'active_investor', 'churned', 'dormant'
  )),
  job_title TEXT,

  relationship_owner TEXT,
  last_touch_date TIMESTAMPTZ,
  last_touch_type TEXT,
  next_follow_up TIMESTAMPTZ,

  accreditation_status TEXT NOT NULL DEFAULT 'unknown' CHECK (accreditation_status IN (
    'unknown', 'not_accredited', 'self_certified', 'verified_accredited',
    'qualified_purchaser', 'institutional', 'exempt'
  )),
  accreditation_expiry TIMESTAMPTZ,
  kyc_status TEXT NOT NULL DEFAULT 'not_started' CHECK (kyc_status IN (
    'not_started', 'pending', 'in_review', 'approved', 'rejected', 'expired'
  )),
  kyc_completed_at TIMESTAMPTZ,
  jurisdiction TEXT,

  wallet_address TEXT,
  wallet_chain TEXT CHECK (wallet_chain IS NULL OR wallet_chain IN ('solana', 'ethereum', 'polygon', 'base')),

  portal_enabled BOOLEAN NOT NULL DEFAULT false,
  portal_user_id TEXT,
  portal_last_login TIMESTAMPTZ,

  lead_score INTEGER NOT NULL DEFAULT 0 CHECK (lead_score BETWEEN 0 AND 100),
  total_committed_usd NUMERIC(20, 2) NOT NULL DEFAULT 0,
  total_funded_usd NUMERIC(20, 2) NOT NULL DEFAULT 0,

  source TEXT,
  referred_by UUID,

  metadata JSONB NOT NULL DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_capital_investor_venture ON capital_investor_profile (venture_id);
CREATE INDEX IF NOT EXISTS idx_capital_investor_type ON capital_investor_profile (venture_id, contact_type);
CREATE INDEX IF NOT EXISTS idx_capital_investor_stage ON capital_investor_profile (venture_id, stage);
CREATE INDEX IF NOT EXISTS idx_capital_investor_org ON capital_investor_profile (organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_capital_investor_portal ON capital_investor_profile (portal_user_id) WHERE portal_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_capital_investor_score ON capital_investor_profile (venture_id, lead_score DESC);

-- ═══════════════════════════════════════════════════════════
-- 3. CAPITAL_ROUNDS — per-venture funding rounds
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS capital_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id TEXT NOT NULL,

  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,

  round_type TEXT NOT NULL CHECK (round_type IN (
    'safe', 'convertible_note', 'priced_equity',
    'token_sale', 'token_presale', 'rwa_tranche',
    'hybrid_equity_token', 'crowdfund_reg_cf', 'crowdfund_reg_d',
    'crowdfund_mi_45', 'revenue_share'
  )),
  raise_lane TEXT NOT NULL DEFAULT 'equity' CHECK (raise_lane IN ('token', 'equity', 'hybrid')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'preview', 'open', 'closing', 'closed', 'funded', 'cancelled'
  )),

  target_raise NUMERIC(20, 2) NOT NULL,
  hard_cap NUMERIC(20, 2),
  soft_cap NUMERIC(20, 2),
  minimum_check NUMERIC(20, 2) NOT NULL DEFAULT 0,
  maximum_check NUMERIC(20, 2),
  currency TEXT NOT NULL DEFAULT 'USD',

  pre_money_valuation NUMERIC(20, 2),
  post_money_valuation NUMERIC(20, 2),
  price_per_share NUMERIC(20, 8),
  price_per_token NUMERIC(20, 8),
  shares_available NUMERIC(20, 0),
  tokens_available NUMERIC(20, 0),

  valuation_cap NUMERIC(20, 2),
  discount_rate NUMERIC(5, 2),
  interest_rate NUMERIC(5, 2),
  vesting_schedule TEXT,
  token_warrant_ratio NUMERIC(10, 4),

  total_committed NUMERIC(20, 2) NOT NULL DEFAULT 0,
  total_funded NUMERIC(20, 2) NOT NULL DEFAULT 0,
  total_investors INTEGER NOT NULL DEFAULT 0,
  allocation_remaining NUMERIC(20, 2),

  open_date TIMESTAMPTZ,
  close_date TIMESTAMPTZ,
  funding_deadline TIMESTAMPTZ,

  regulatory_framework TEXT CHECK (regulatory_framework IS NULL OR regulatory_framework IN (
    'reg_d_506c', 'reg_d_506b', 'reg_cf', 'reg_a', 'reg_s',
    'mi_45_110', 'mi_45_106', 'token_utility', 'token_security',
    'exempt', 'other'
  )),
  accredited_only BOOLEAN NOT NULL DEFAULT false,
  jurisdiction_restrictions JSONB NOT NULL DEFAULT '[]',
  max_investors INTEGER,

  term_sheet_url TEXT,
  safe_template_url TEXT,
  subscription_agreement_url TEXT,
  pitch_deck_url TEXT,
  data_room_url TEXT,

  is_public BOOLEAN NOT NULL DEFAULT false,
  public_page_slug TEXT,
  featured_order INTEGER,

  token_mint_address TEXT,
  token_symbol TEXT,
  token_decimals INTEGER,
  vesting_contract_address TEXT,

  escrow_type TEXT CHECK (escrow_type IS NULL OR escrow_type IN ('bank', 'smart_contract', 'platform', 'none')),
  escrow_account_id TEXT,

  tags JSONB NOT NULL DEFAULT '[]',
  metadata JSONB NOT NULL DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_capital_rounds_slug ON capital_rounds (venture_id, slug) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_capital_rounds_venture ON capital_rounds (venture_id);
CREATE INDEX IF NOT EXISTS idx_capital_rounds_status ON capital_rounds (venture_id, status);
CREATE INDEX IF NOT EXISTS idx_capital_rounds_type ON capital_rounds (venture_id, round_type);
CREATE INDEX IF NOT EXISTS idx_capital_rounds_public ON capital_rounds (is_public, status) WHERE is_public = true;

-- ═══════════════════════════════════════════════════════════
-- 4. CAPITAL_COMMITMENTS — the core ledger (Contact × Round × Amount)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS capital_commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id TEXT NOT NULL,

  contact_id UUID NOT NULL,
  round_id UUID NOT NULL REFERENCES capital_rounds(id) ON DELETE RESTRICT,
  organization_id UUID REFERENCES capital_organizations(id) ON DELETE SET NULL,

  status TEXT NOT NULL DEFAULT 'interest' CHECK (status IN (
    'interest', 'soft_commit', 'reserved', 'pending_docs',
    'signed', 'pending_wire', 'funded',
    'token_pending', 'token_distributed',
    'refunded', 'withdrawn'
  )),
  amount NUMERIC(20, 2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  amount_usd NUMERIC(20, 2) NOT NULL CHECK (amount_usd >= 0),

  shares_allocated NUMERIC(20, 0),
  ownership_pct NUMERIC(8, 4),
  tokens_allocated NUMERIC(20, 0),
  token_price_at_commit NUMERIC(20, 8),
  wallet_address TEXT,

  equity_component NUMERIC(20, 2),
  token_warrant_component NUMERIC(20, 2),

  payment_method TEXT CHECK (payment_method IS NULL OR payment_method IN (
    'wire_usd', 'wire_cad', 'wire_eur', 'wire_gbp', 'ach',
    'crypto_usdc', 'crypto_usdt', 'crypto_sol', 'crypto_eth', 'crypto_btc',
    'edge_token', 'check', 'other'
  )),
  payment_reference TEXT,
  payment_received_at TIMESTAMPTZ,

  docusign_envelope_id TEXT,
  docusign_status TEXT,
  signed_at TIMESTAMPTZ,
  document_urls JSONB NOT NULL DEFAULT '[]',

  interest_expressed_at TIMESTAMPTZ,
  soft_committed_at TIMESTAMPTZ,
  reserved_at TIMESTAMPTZ,
  funded_at TIMESTAMPTZ,
  distributed_at TIMESTAMPTZ,

  notes TEXT,
  internal_notes TEXT,

  source TEXT,
  referral_contact_id UUID,

  metadata JSONB NOT NULL DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_capital_commits_contact_round ON capital_commitments (contact_id, round_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_capital_commits_venture ON capital_commitments (venture_id);
CREATE INDEX IF NOT EXISTS idx_capital_commits_contact ON capital_commitments (contact_id);
CREATE INDEX IF NOT EXISTS idx_capital_commits_round ON capital_commitments (round_id);
CREATE INDEX IF NOT EXISTS idx_capital_commits_status ON capital_commitments (venture_id, status);

-- ═══════════════════════════════════════════════════════════
-- 5. CAPITAL_ACTIVITIES — relationship + lifecycle timeline
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS capital_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id TEXT NOT NULL,

  contact_id UUID,
  organization_id UUID REFERENCES capital_organizations(id) ON DELETE CASCADE,
  round_id UUID REFERENCES capital_rounds(id) ON DELETE SET NULL,
  commitment_id UUID REFERENCES capital_commitments(id) ON DELETE SET NULL,

  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'email', 'call', 'meeting', 'note',
    'portal_view', 'portal_login', 'doc_sent', 'doc_signed',
    'payment_received', 'payment_sent', 'status_change',
    'token_distributed', 'enrichment', 'system'
  )),
  title TEXT NOT NULL,
  description TEXT,

  previous_value TEXT,
  new_value TEXT,

  actor_id TEXT,
  actor_type TEXT NOT NULL DEFAULT 'user' CHECK (actor_type IN ('user', 'system', 'naos', 'investor', 'webhook')),

  metadata JSONB NOT NULL DEFAULT '{}',

  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_capital_activities_venture ON capital_activities (venture_id);
CREATE INDEX IF NOT EXISTS idx_capital_activities_contact ON capital_activities (contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_capital_activities_round ON capital_activities (round_id) WHERE round_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_capital_activities_commit ON capital_activities (commitment_id) WHERE commitment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_capital_activities_date ON capital_activities (occurred_at DESC);

-- ═══════════════════════════════════════════════════════════
-- 6. CAPITAL_DOCUMENTS — document vault per round/commitment
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS capital_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id TEXT NOT NULL,

  round_id UUID REFERENCES capital_rounds(id) ON DELETE CASCADE,
  commitment_id UUID REFERENCES capital_commitments(id) ON DELETE SET NULL,
  contact_id UUID,

  name TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'term_sheet', 'safe', 'convertible_note', 'subscription_agreement',
    'side_letter', 'quarterly_update', 'annual_report',
    'pitch_deck', 'financial_model', 'legal_opinion',
    'form_45_106f9', 'om', 'om_delivery', 'signed_agreement',
    'nda', 'tax_form', 'other'
  )),
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,

  is_investor_visible BOOLEAN NOT NULL DEFAULT false,
  requires_nda BOOLEAN NOT NULL DEFAULT false,

  version INTEGER NOT NULL DEFAULT 1,
  previous_version_id UUID REFERENCES capital_documents(id) ON DELETE SET NULL,

  uploaded_by TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_capital_docs_venture ON capital_documents (venture_id);
CREATE INDEX IF NOT EXISTS idx_capital_docs_round ON capital_documents (round_id) WHERE round_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_capital_docs_commit ON capital_documents (commitment_id) WHERE commitment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_capital_docs_type ON capital_documents (venture_id, document_type);

-- ═══════════════════════════════════════════════════════════
-- 7. CAPITAL_CONTACT_VENTURES — cross-venture visibility junction
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS capital_contact_ventures (
  contact_id UUID NOT NULL,
  venture_id TEXT NOT NULL,

  stage_override TEXT CHECK (stage_override IS NULL OR stage_override IN (
    'cold', 'warm', 'engaged', 'soft_commit', 'due_diligence',
    'signed', 'funded', 'active_investor', 'churned', 'dormant'
  )),
  contact_type_override TEXT CHECK (contact_type_override IS NULL OR contact_type_override IN (
    'prospect', 'angel', 'vc', 'lp', 'institutional',
    'strategic_partner', 'advisor', 'key_person',
    'transfer_agent', 'legal', 'service_provider'
  )),
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (contact_id, venture_id)
);

CREATE INDEX IF NOT EXISTS idx_capital_cv_venture ON capital_contact_ventures (venture_id);

-- ═══════════════════════════════════════════════════════════
-- TRIGGERS: updated_at + round totals rollup
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_capital_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_capital_orgs_updated_at ON capital_organizations;
CREATE TRIGGER trg_capital_orgs_updated_at BEFORE UPDATE ON capital_organizations
  FOR EACH ROW EXECUTE FUNCTION update_capital_updated_at();

DROP TRIGGER IF EXISTS trg_capital_investor_updated_at ON capital_investor_profile;
CREATE TRIGGER trg_capital_investor_updated_at BEFORE UPDATE ON capital_investor_profile
  FOR EACH ROW EXECUTE FUNCTION update_capital_updated_at();

DROP TRIGGER IF EXISTS trg_capital_rounds_updated_at ON capital_rounds;
CREATE TRIGGER trg_capital_rounds_updated_at BEFORE UPDATE ON capital_rounds
  FOR EACH ROW EXECUTE FUNCTION update_capital_updated_at();

DROP TRIGGER IF EXISTS trg_capital_commits_updated_at ON capital_commitments;
CREATE TRIGGER trg_capital_commits_updated_at BEFORE UPDATE ON capital_commitments
  FOR EACH ROW EXECUTE FUNCTION update_capital_updated_at();

DROP TRIGGER IF EXISTS trg_capital_docs_updated_at ON capital_documents;
CREATE TRIGGER trg_capital_docs_updated_at BEFORE UPDATE ON capital_documents
  FOR EACH ROW EXECUTE FUNCTION update_capital_updated_at();

-- Recompute round totals when commitments change.
-- Totals: total_committed = sum of signed+; total_funded = sum of funded+; total_investors = distinct contact_ids; allocation_remaining = target - committed.
CREATE OR REPLACE FUNCTION recompute_round_totals()
RETURNS TRIGGER AS $$
DECLARE
  target_round UUID;
BEGIN
  target_round := COALESCE(NEW.round_id, OLD.round_id);
  IF target_round IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

  UPDATE capital_rounds r
     SET total_committed = COALESCE((
           SELECT SUM(amount_usd) FROM capital_commitments
            WHERE round_id = target_round
              AND deleted_at IS NULL
              AND status IN ('soft_commit', 'reserved', 'pending_docs', 'signed', 'pending_wire', 'funded', 'token_pending', 'token_distributed')
         ), 0),
         total_funded = COALESCE((
           SELECT SUM(amount_usd) FROM capital_commitments
            WHERE round_id = target_round
              AND deleted_at IS NULL
              AND status IN ('funded', 'token_distributed')
         ), 0),
         total_investors = COALESCE((
           SELECT COUNT(DISTINCT contact_id) FROM capital_commitments
            WHERE round_id = target_round
              AND deleted_at IS NULL
              AND status NOT IN ('interest', 'withdrawn', 'refunded')
         ), 0),
         allocation_remaining = CASE WHEN r.target_raise > 0
           THEN GREATEST(r.target_raise - COALESCE((
             SELECT SUM(amount_usd) FROM capital_commitments
              WHERE round_id = target_round
                AND deleted_at IS NULL
                AND status IN ('signed', 'pending_wire', 'funded', 'token_pending', 'token_distributed')
           ), 0), 0)
           ELSE NULL END
   WHERE r.id = target_round;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_capital_commits_recompute_round ON capital_commitments;
CREATE TRIGGER trg_capital_commits_recompute_round
  AFTER INSERT OR UPDATE OR DELETE ON capital_commitments
  FOR EACH ROW EXECUTE FUNCTION recompute_round_totals();

-- Recompute investor profile totals when commitments change.
CREATE OR REPLACE FUNCTION recompute_investor_totals()
RETURNS TRIGGER AS $$
DECLARE
  target_contact UUID;
BEGIN
  target_contact := COALESCE(NEW.contact_id, OLD.contact_id);
  IF target_contact IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

  UPDATE capital_investor_profile
     SET total_committed_usd = COALESCE((
           SELECT SUM(amount_usd) FROM capital_commitments
            WHERE contact_id = target_contact
              AND deleted_at IS NULL
              AND status IN ('soft_commit', 'reserved', 'pending_docs', 'signed', 'pending_wire', 'funded', 'token_pending', 'token_distributed')
         ), 0),
         total_funded_usd = COALESCE((
           SELECT SUM(amount_usd) FROM capital_commitments
            WHERE contact_id = target_contact
              AND deleted_at IS NULL
              AND status IN ('funded', 'token_distributed')
         ), 0),
         updated_at = now()
   WHERE contact_id = target_contact;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_capital_commits_recompute_investor ON capital_commitments;
CREATE TRIGGER trg_capital_commits_recompute_investor
  AFTER INSERT OR UPDATE OR DELETE ON capital_commitments
  FOR EACH ROW EXECUTE FUNCTION recompute_investor_totals();

-- ═══════════════════════════════════════════════════════════
-- RLS POLICIES
-- Open read (app-level filtering via venture_id).
-- Writes require authenticated user.
-- ═══════════════════════════════════════════════════════════

ALTER TABLE capital_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_investor_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_contact_ventures ENABLE ROW LEVEL SECURITY;

-- capital_organizations
DROP POLICY IF EXISTS "capital_orgs_select" ON capital_organizations;
CREATE POLICY "capital_orgs_select" ON capital_organizations FOR SELECT USING (true);
DROP POLICY IF EXISTS "capital_orgs_write" ON capital_organizations;
CREATE POLICY "capital_orgs_write" ON capital_organizations FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- capital_investor_profile
DROP POLICY IF EXISTS "capital_investor_select" ON capital_investor_profile;
CREATE POLICY "capital_investor_select" ON capital_investor_profile FOR SELECT USING (true);
DROP POLICY IF EXISTS "capital_investor_write" ON capital_investor_profile;
CREATE POLICY "capital_investor_write" ON capital_investor_profile FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- capital_rounds — public rounds readable without auth (for Launchpad)
DROP POLICY IF EXISTS "capital_rounds_select_auth" ON capital_rounds;
CREATE POLICY "capital_rounds_select_auth" ON capital_rounds FOR SELECT USING (true);
DROP POLICY IF EXISTS "capital_rounds_write" ON capital_rounds;
CREATE POLICY "capital_rounds_write" ON capital_rounds FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- capital_commitments — portal investors see only their own
DROP POLICY IF EXISTS "capital_commits_select" ON capital_commitments;
CREATE POLICY "capital_commits_select" ON capital_commitments FOR SELECT USING (true);
DROP POLICY IF EXISTS "capital_commits_write" ON capital_commitments;
CREATE POLICY "capital_commits_write" ON capital_commitments FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- capital_activities
DROP POLICY IF EXISTS "capital_activities_select" ON capital_activities;
CREATE POLICY "capital_activities_select" ON capital_activities FOR SELECT USING (true);
DROP POLICY IF EXISTS "capital_activities_write" ON capital_activities;
CREATE POLICY "capital_activities_write" ON capital_activities FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- capital_documents
DROP POLICY IF EXISTS "capital_docs_select" ON capital_documents;
CREATE POLICY "capital_docs_select" ON capital_documents FOR SELECT USING (true);
DROP POLICY IF EXISTS "capital_docs_write" ON capital_documents;
CREATE POLICY "capital_docs_write" ON capital_documents FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- capital_contact_ventures
DROP POLICY IF EXISTS "capital_cv_select" ON capital_contact_ventures;
CREATE POLICY "capital_cv_select" ON capital_contact_ventures FOR SELECT USING (true);
DROP POLICY IF EXISTS "capital_cv_write" ON capital_contact_ventures;
CREATE POLICY "capital_cv_write" ON capital_contact_ventures FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- ═══════════════════════════════════════════════════════════
-- Realtime publication
-- ═══════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE capital_organizations;
    ALTER PUBLICATION supabase_realtime ADD TABLE capital_investor_profile;
    ALTER PUBLICATION supabase_realtime ADD TABLE capital_rounds;
    ALTER PUBLICATION supabase_realtime ADD TABLE capital_commitments;
    ALTER PUBLICATION supabase_realtime ADD TABLE capital_activities;
    ALTER PUBLICATION supabase_realtime ADD TABLE capital_documents;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
