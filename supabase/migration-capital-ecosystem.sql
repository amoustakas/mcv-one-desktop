-- supabase/migration-capital-ecosystem.sql
-- Capital × Ecosystem integration — distributions primitive + FK integrity.
-- See docs/capital/ECOSYSTEM.md.

-- 1. capital_distributions — dividend/yield/interest payout primitive
CREATE TABLE IF NOT EXISTS capital_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id TEXT NOT NULL,
  round_id UUID REFERENCES capital_rounds(id) ON DELETE SET NULL,

  distribution_type TEXT NOT NULL CHECK (distribution_type IN (
    'dividend', 'interest', 'yield', 'token_airdrop', 'buyback',
    'return_of_capital', 'fee_rebate', 'other'
  )),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN (
    'scheduled', 'processing', 'partial', 'completed', 'failed', 'cancelled'
  )),
  scheduled_for TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  total_amount NUMERIC(20, 2) NOT NULL CHECK (total_amount >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  total_recipients INTEGER NOT NULL DEFAULT 0,
  total_paid NUMERIC(20, 2) NOT NULL DEFAULT 0,

  -- Optional: overall record_date / ex_date for dividend calcs
  record_date TIMESTAMPTZ,
  ex_date TIMESTAMPTZ,

  -- Ledger anchor (when LedgerAdapter is wired)
  journal_entry_id UUID,

  -- Content backing (press release, distribution notice)
  content_id UUID REFERENCES content(id) ON DELETE SET NULL,

  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',

  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_capital_dist_venture ON capital_distributions (venture_id, status);
CREATE INDEX IF NOT EXISTS idx_capital_dist_round ON capital_distributions (round_id) WHERE round_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_capital_dist_scheduled ON capital_distributions (scheduled_for) WHERE status = 'scheduled';

-- 2. capital_distribution_recipients — per-investor line items for a distribution
CREATE TABLE IF NOT EXISTS capital_distribution_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  distribution_id UUID NOT NULL REFERENCES capital_distributions(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL,
  commitment_id UUID REFERENCES capital_commitments(id) ON DELETE SET NULL,

  amount NUMERIC(20, 2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  amount_usd NUMERIC(20, 2) NOT NULL CHECK (amount_usd >= 0),

  payment_method TEXT,
  payment_reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'paid', 'failed', 'cancelled', 'reversed'
  )),
  paid_at TIMESTAMPTZ,

  tax_withheld NUMERIC(20, 2) NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_capital_dist_recip_dist ON capital_distribution_recipients (distribution_id, status);
CREATE INDEX IF NOT EXISTS idx_capital_dist_recip_contact ON capital_distribution_recipients (contact_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_capital_dist_recip_unique ON capital_distribution_recipients (distribution_id, contact_id, commitment_id);

-- 3. Recompute totals when recipients change
CREATE OR REPLACE FUNCTION recompute_distribution_totals()
RETURNS TRIGGER AS $$
DECLARE target_dist UUID;
BEGIN
  target_dist := COALESCE(NEW.distribution_id, OLD.distribution_id);
  IF target_dist IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;
  UPDATE capital_distributions SET
    total_recipients = COALESCE((
      SELECT COUNT(*) FROM capital_distribution_recipients
       WHERE distribution_id = target_dist
    ), 0),
    total_paid = COALESCE((
      SELECT SUM(amount_usd) FROM capital_distribution_recipients
       WHERE distribution_id = target_dist AND status = 'paid'
    ), 0),
    updated_at = now()
  WHERE id = target_dist;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_capital_dist_recompute ON capital_distribution_recipients;
CREATE TRIGGER trg_capital_dist_recompute
  AFTER INSERT OR UPDATE OR DELETE ON capital_distribution_recipients
  FOR EACH ROW EXECUTE FUNCTION recompute_distribution_totals();

-- 4. updated_at trigger for distributions
DROP TRIGGER IF EXISTS trg_capital_dist_updated_at ON capital_distributions;
CREATE TRIGGER trg_capital_dist_updated_at BEFORE UPDATE ON capital_distributions
  FOR EACH ROW EXECUTE FUNCTION update_capital_updated_at();

DROP TRIGGER IF EXISTS trg_capital_dist_recip_updated_at ON capital_distribution_recipients;
CREATE TRIGGER trg_capital_dist_recip_updated_at BEFORE UPDATE ON capital_distribution_recipients
  FOR EACH ROW EXECUTE FUNCTION update_capital_updated_at();

-- 5. RLS — open select, auth write
ALTER TABLE capital_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_distribution_recipients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS capital_dist_select ON capital_distributions;
CREATE POLICY capital_dist_select ON capital_distributions FOR SELECT USING (true);
DROP POLICY IF EXISTS capital_dist_write ON capital_distributions;
CREATE POLICY capital_dist_write ON capital_distributions FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS capital_dist_recip_select ON capital_distribution_recipients;
CREATE POLICY capital_dist_recip_select ON capital_distribution_recipients FOR SELECT USING (true);
DROP POLICY IF EXISTS capital_dist_recip_write ON capital_distribution_recipients;
CREATE POLICY capital_dist_recip_write ON capital_distribution_recipients FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- 6. Realtime
DO $pub$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE capital_distributions;
    ALTER PUBLICATION supabase_realtime ADD TABLE capital_distribution_recipients;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $pub$;

-- 7. FK integrity: capital_rounds.venture_id → ventures.id
-- Skipped if ventures table doesn't exist (graceful for fresh envs)
DO $fk$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='ventures') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'capital_rounds_venture_fk'
    ) THEN
      ALTER TABLE capital_rounds
        ADD CONSTRAINT capital_rounds_venture_fk
        FOREIGN KEY (venture_id) REFERENCES ventures(id) ON DELETE RESTRICT
        NOT VALID; -- NOT VALID so existing rows aren't re-checked; new writes enforce
    END IF;
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Skipping capital_rounds venture FK: %', SQLERRM;
END $fk$;
