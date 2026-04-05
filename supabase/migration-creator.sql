-- supabase/migration-creator.sql
-- Creator Economy: Royalties, Escrow, Transaction Intelligence
-- MCV Commerce & Financial OS — Sections 7, 8, 9

-- ─────────────────────────────────────────────────────────
-- 1. ROYALTY AGREEMENTS
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS royalty_agreements (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id        TEXT NOT NULL,
  product_id        UUID NOT NULL,
  creator_id        TEXT NOT NULL,
  royalty_type      TEXT NOT NULL CHECK (royalty_type IN ('fixed_percentage', 'tiered', 'perpetual', 'time_limited')),
  resale_royalty_percent NUMERIC(6,4) NOT NULL DEFAULT 0 CHECK (resale_royalty_percent >= 0 AND resale_royalty_percent <= 100),
  minimum_payout    NUMERIC(18,6) NOT NULL DEFAULT 0,
  payout_frequency  TEXT NOT NULL DEFAULT 'monthly' CHECK (payout_frequency IN ('instant', 'daily', 'weekly', 'monthly', 'manual')),
  transparency_level TEXT NOT NULL DEFAULT 'participants_only' CHECK (transparency_level IN ('public', 'participants_only', 'private')),
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'terminated')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_royalty_agreements_venture ON royalty_agreements(venture_id);
CREATE INDEX IF NOT EXISTS idx_royalty_agreements_product ON royalty_agreements(product_id);
CREATE INDEX IF NOT EXISTS idx_royalty_agreements_creator ON royalty_agreements(creator_id);

-- ─────────────────────────────────────────────────────────
-- 2. ROYALTY SPLITS
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS royalty_splits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id    UUID NOT NULL REFERENCES royalty_agreements(id) ON DELETE CASCADE,
  recipient_id    TEXT NOT NULL,
  recipient_type  TEXT NOT NULL CHECK (recipient_type IN ('creator', 'collaborator', 'label', 'publisher', 'platform', 'charity')),
  percentage      NUMERIC(8,4) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  description     TEXT
);

CREATE INDEX IF NOT EXISTS idx_royalty_splits_agreement ON royalty_splits(agreement_id);
CREATE INDEX IF NOT EXISTS idx_royalty_splits_recipient ON royalty_splits(recipient_id);

-- ─────────────────────────────────────────────────────────
-- 3. ROYALTY DISTRIBUTIONS
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS royalty_distributions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id     UUID NOT NULL REFERENCES royalty_agreements(id),
  transaction_id   TEXT NOT NULL,
  total_amount     NUMERIC(18,6) NOT NULL CHECK (total_amount >= 0),
  splits           JSONB NOT NULL DEFAULT '[]',
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'distributed', 'failed')),
  journal_entry_id UUID,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_royalty_distributions_agreement ON royalty_distributions(agreement_id);
CREATE INDEX IF NOT EXISTS idx_royalty_distributions_transaction ON royalty_distributions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_royalty_distributions_status ON royalty_distributions(status);

-- ─────────────────────────────────────────────────────────
-- 4. ESCROW AGREEMENTS
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS escrow_agreements (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id          TEXT NOT NULL,
  buyer_id            TEXT NOT NULL,
  seller_id           TEXT NOT NULL,
  amount              NUMERIC(18,6) NOT NULL CHECK (amount > 0),
  currency            TEXT NOT NULL DEFAULT 'USD',
  status              TEXT NOT NULL DEFAULT 'pending_funding' CHECK (status IN (
                        'pending_funding', 'funded', 'in_progress', 'pending_release',
                        'released', 'disputed', 'refunded', 'canceled'
                      )),
  release_condition   TEXT NOT NULL DEFAULT 'buyer_confirms' CHECK (release_condition IN (
                        'buyer_confirms', 'milestone_complete', 'time_based', 'dual_approval'
                      )),
  escrow_account_id   TEXT,
  expires_at          TIMESTAMPTZ,
  metadata            JSONB NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_escrow_agreements_venture ON escrow_agreements(venture_id);
CREATE INDEX IF NOT EXISTS idx_escrow_agreements_buyer ON escrow_agreements(buyer_id);
CREATE INDEX IF NOT EXISTS idx_escrow_agreements_seller ON escrow_agreements(seller_id);
CREATE INDEX IF NOT EXISTS idx_escrow_agreements_status ON escrow_agreements(status);

-- ─────────────────────────────────────────────────────────
-- 5. ESCROW MILESTONES
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS escrow_milestones (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id   UUID NOT NULL REFERENCES escrow_agreements(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  description    TEXT,
  amount         NUMERIC(18,6) NOT NULL CHECK (amount > 0),
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'approved', 'rejected')),
  due_date       DATE,
  submitted_at   TIMESTAMPTZ,
  approved_at    TIMESTAMPTZ,
  evidence       TEXT[] NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_escrow_milestones_agreement ON escrow_milestones(agreement_id);
CREATE INDEX IF NOT EXISTS idx_escrow_milestones_status ON escrow_milestones(status);

-- ─────────────────────────────────────────────────────────
-- 6. TRANSACTION RECORDS
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS transaction_records (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id           TEXT NOT NULL,
  transaction_number   TEXT UNIQUE NOT NULL,
  type                 TEXT NOT NULL CHECK (type IN (
                         'purchase', 'subscription_renewal', 'refund', 'credit_grant',
                         'credit_consume', 'transfer', 'payout', 'royalty_distribution',
                         'yield_distribution', 'escrow_hold', 'escrow_release'
                       )),
  status               TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN (
                         'initiated', 'processing', 'succeeded', 'failed',
                         'refunded', 'disputed', 'settled'
                       )),
  timestamp            TIMESTAMPTZ NOT NULL,
  payer_id             TEXT NOT NULL,
  payer_type           TEXT NOT NULL,
  payee_id             TEXT NOT NULL,
  payee_type           TEXT NOT NULL,
  amount               NUMERIC(18,6) NOT NULL CHECK (amount >= 0),
  currency             TEXT NOT NULL DEFAULT 'USD',
  fee_total            NUMERIC(18,6) NOT NULL DEFAULT 0,
  net_amount           NUMERIC(18,6) NOT NULL,
  rail                 TEXT,
  routing_decision_id  UUID,
  cost_saved           NUMERIC(18,6),
  related_records      JSONB NOT NULL DEFAULT '[]',
  categories           TEXT[] NOT NULL DEFAULT '{}',
  events               JSONB NOT NULL DEFAULT '[]',
  access_url           TEXT,
  metadata             JSONB NOT NULL DEFAULT '{}',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transaction_records_venture ON transaction_records(venture_id);
CREATE INDEX IF NOT EXISTS idx_transaction_records_number ON transaction_records(transaction_number);
CREATE INDEX IF NOT EXISTS idx_transaction_records_type ON transaction_records(type);
CREATE INDEX IF NOT EXISTS idx_transaction_records_status ON transaction_records(status);
CREATE INDEX IF NOT EXISTS idx_transaction_records_timestamp ON transaction_records(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transaction_records_payer ON transaction_records(payer_id);
CREATE INDEX IF NOT EXISTS idx_transaction_records_payee ON transaction_records(payee_id);

-- Auto-number trigger: TXN-{YEAR}-{MM}-{SEQNUM 6-digit zero-padded}
CREATE SEQUENCE IF NOT EXISTS transaction_records_seq START 1;

CREATE OR REPLACE FUNCTION generate_transaction_number()
RETURNS TRIGGER AS $$
DECLARE
  seq_val  BIGINT;
  ts_part  TEXT;
BEGIN
  seq_val := nextval('transaction_records_seq');
  ts_part := to_char(COALESCE(NEW.timestamp, now()), 'YYYY-MM');
  NEW.transaction_number := 'TXN-' || ts_part || '-' || LPAD(seq_val::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_transaction_number
  BEFORE INSERT ON transaction_records
  FOR EACH ROW
  WHEN (NEW.transaction_number IS NULL OR NEW.transaction_number = '')
  EXECUTE FUNCTION generate_transaction_number();

-- ─────────────────────────────────────────────────────────
-- 7. REVENUE SHARING PROGRAMS
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS revenue_share_programs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id            TEXT NOT NULL,
  name                  TEXT NOT NULL,
  type                  TEXT NOT NULL CHECK (type IN ('affiliate', 'referral', 'reseller')),
  commission_structure  JSONB NOT NULL DEFAULT '{}',
  cookie_duration_days  INTEGER NOT NULL DEFAULT 30,
  minimum_payout        NUMERIC(18,6) NOT NULL DEFAULT 0,
  status                TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'terminated')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_revenue_share_programs_venture ON revenue_share_programs(venture_id);

-- ─────────────────────────────────────────────────────────
-- 8. AFFILIATE PARTNERS
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS affiliate_partners (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id          UUID NOT NULL REFERENCES revenue_share_programs(id),
  user_id             TEXT NOT NULL,
  referral_code       TEXT UNIQUE NOT NULL,
  total_referrals     INTEGER NOT NULL DEFAULT 0,
  total_revenue       NUMERIC(18,6) NOT NULL DEFAULT 0,
  total_commissions   NUMERIC(18,6) NOT NULL DEFAULT 0,
  pending_payout      NUMERIC(18,6) NOT NULL DEFAULT 0,
  status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'terminated')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_partners_program ON affiliate_partners(program_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_partners_user ON affiliate_partners(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_partners_code ON affiliate_partners(referral_code);

-- ─────────────────────────────────────────────────────────
-- RLS: Enable on all tables (deny by default — service key bypasses)
-- ─────────────────────────────────────────────────────────

ALTER TABLE royalty_agreements      ENABLE ROW LEVEL SECURITY;
ALTER TABLE royalty_splits          ENABLE ROW LEVEL SECURITY;
ALTER TABLE royalty_distributions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_agreements       ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_milestones       ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_records     ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_share_programs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_partners      ENABLE ROW LEVEL SECURITY;

-- Service role bypass (API uses service key; RLS blocks anon/user roles by default)
CREATE POLICY "service_role_all_royalty_agreements"    ON royalty_agreements    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_royalty_splits"        ON royalty_splits        FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_royalty_distributions" ON royalty_distributions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_escrow_agreements"     ON escrow_agreements     FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_escrow_milestones"     ON escrow_milestones     FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_transaction_records"   ON transaction_records   FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_revenue_share"         ON revenue_share_programs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_affiliate_partners"    ON affiliate_partners    FOR ALL TO service_role USING (true) WITH CHECK (true);
