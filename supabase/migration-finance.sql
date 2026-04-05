-- supabase/migration-finance.sql
-- Financials Engine — MCV Commerce & Financial OS
-- Tables: revenue_schedules, revenue_entries, cost_snapshots, financial_report_cache

-- ═══════════════════════════════════════════════════════════
-- REVENUE SCHEDULES (ASC 606 deferred revenue tracking)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS revenue_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venture_id TEXT NOT NULL,
  -- Source reference (subscription, invoice, order, etc.)
  source_type TEXT NOT NULL CHECK (char_length(source_type) BETWEEN 1 AND 100),
  source_id TEXT NOT NULL CHECK (char_length(source_id) BETWEEN 1 AND 200),
  -- Amounts
  total_amount NUMERIC(20, 4) NOT NULL CHECK (total_amount >= 0),
  recognized_amount NUMERIC(20, 4) NOT NULL DEFAULT 0 CHECK (recognized_amount >= 0),
  deferred_amount NUMERIC(20, 4) NOT NULL DEFAULT 0 CHECK (deferred_amount >= 0),
  -- Period
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  -- ASC 606 recognition method
  recognition_method TEXT NOT NULL CHECK (recognition_method IN (
    'straight_line', 'usage_based', 'milestone', 'point_in_time'
  )),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'voided')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Validation
  CHECK (end_date >= start_date),
  CHECK (recognized_amount <= total_amount)
);

CREATE INDEX idx_revenue_schedules_venture ON revenue_schedules (venture_id);
CREATE INDEX idx_revenue_schedules_period ON revenue_schedules (venture_id, start_date, end_date);
CREATE INDEX idx_revenue_schedules_source ON revenue_schedules (source_type, source_id);
CREATE INDEX idx_revenue_schedules_status ON revenue_schedules (venture_id, status);

-- ═══════════════════════════════════════════════════════════
-- REVENUE ENTRIES (individual recognition/deferral events)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS revenue_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID NOT NULL REFERENCES revenue_schedules(id) ON DELETE CASCADE,
  period_date DATE NOT NULL,
  amount NUMERIC(20, 4) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('recognition', 'deferral', 'adjustment')),
  -- Optional link to the double-entry journal entry that recorded this recognition
  journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE SET NULL,
  recognized_at TIMESTAMPTZ
);

CREATE INDEX idx_revenue_entries_schedule ON revenue_entries (schedule_id);
CREATE INDEX idx_revenue_entries_period ON revenue_entries (period_date);
CREATE INDEX idx_revenue_entries_journal ON revenue_entries (journal_entry_id) WHERE journal_entry_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════
-- COST SNAPSHOTS (periodic cost/fee intelligence captures)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cost_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venture_id TEXT NOT NULL,
  period_date DATE NOT NULL,
  -- Aggregated processing fees
  total_processing_fees NUMERIC(20, 4) NOT NULL DEFAULT 0 CHECK (total_processing_fees >= 0),
  -- JSONB breakdowns — shape: { "stripe": 123.45, "solana": 1.23 }
  fees_by_processor JSONB NOT NULL DEFAULT '{}',
  fees_by_rail JSONB NOT NULL DEFAULT '{}',
  -- Savings from smart routing and crypto rails vs baseline (Stripe card)
  savings_from_routing NUMERIC(20, 4) NOT NULL DEFAULT 0,
  savings_from_crypto NUMERIC(20, 4) NOT NULL DEFAULT 0,
  total_savings NUMERIC(20, 4) NOT NULL DEFAULT 0,
  transaction_count INTEGER NOT NULL DEFAULT 0 CHECK (transaction_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cost_snapshots_venture ON cost_snapshots (venture_id);
CREATE INDEX idx_cost_snapshots_period ON cost_snapshots (venture_id, period_date);

-- ═══════════════════════════════════════════════════════════
-- FINANCIAL REPORT CACHE (pre-computed statement cache)
-- Avoids re-running expensive aggregations on every request.
-- TTL strategy: regenerate when generated_at < period_end or > configurable TTL.
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS financial_report_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venture_id TEXT,                        -- NULL = global report
  report_type TEXT NOT NULL CHECK (report_type IN (
    'income_statement', 'balance_sheet', 'cash_flow', 'real_time_metrics', 'cost_intelligence'
  )),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (char_length(currency) BETWEEN 2 AND 10),
  -- Full report serialized as JSONB
  data JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_financial_report_cache_lookup ON financial_report_cache
  (venture_id, report_type, period_start, period_end, currency);
CREATE INDEX idx_financial_report_cache_generated ON financial_report_cache (generated_at);

-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════

ALTER TABLE revenue_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_report_cache ENABLE ROW LEVEL SECURITY;

-- Permissive policies (tighten in production per venture membership)
CREATE POLICY "Allow all for authenticated users" ON revenue_schedules FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON revenue_entries FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON cost_snapshots FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON financial_report_cache FOR ALL USING (true);
