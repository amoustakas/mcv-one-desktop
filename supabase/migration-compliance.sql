-- supabase/migration-compliance.sql
-- Compliance tables: Fraud Detection, Dunning, Tax Engine, Price Localization
-- MCV Commerce & Financial OS — Plan 6

-- ─────────────────────────────────────────────────────────
-- 1. FRAUD RULES
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS fraud_rules (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id   TEXT NOT NULL,
  name         TEXT NOT NULL,
  condition    TEXT NOT NULL,  -- string expression e.g. "amount > 500 AND account_age_hours < 24"
  action       TEXT NOT NULL CHECK (action IN ('block','review','require_3ds','flag','add_score')),
  score_impact INTEGER NOT NULL DEFAULT 0,
  enabled      BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fraud_rules_venture ON fraud_rules (venture_id);
CREATE INDEX IF NOT EXISTS idx_fraud_rules_enabled  ON fraud_rules (enabled);

ALTER TABLE fraud_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fraud_rules_venture_isolation"
  ON fraud_rules FOR ALL
  USING (venture_id = current_setting('app.venture_id', true));

-- ─────────────────────────────────────────────────────────
-- 2. FRAUD CHECKS (audit log of every scored transaction)
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS fraud_checks (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id     TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  risk_score     INTEGER NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  decision       TEXT NOT NULL CHECK (decision IN ('allow','review','block')),
  signals        JSONB NOT NULL DEFAULT '[]',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fraud_checks_venture    ON fraud_checks (venture_id);
CREATE INDEX IF NOT EXISTS idx_fraud_checks_txn        ON fraud_checks (transaction_id);
CREATE INDEX IF NOT EXISTS idx_fraud_checks_created_at ON fraud_checks (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fraud_checks_decision   ON fraud_checks (decision);

ALTER TABLE fraud_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fraud_checks_venture_isolation"
  ON fraud_checks FOR ALL
  USING (venture_id = current_setting('app.venture_id', true));

-- ─────────────────────────────────────────────────────────
-- 3. DUNNING CONFIGS (one per venture)
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dunning_configs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id            TEXT NOT NULL UNIQUE,
  retry_schedule        JSONB NOT NULL DEFAULT '[]',
  notification_schedule JSONB NOT NULL DEFAULT '[]',
  grace_period_days     INTEGER NOT NULL DEFAULT 7,
  final_action          TEXT NOT NULL DEFAULT 'cancel' CHECK (final_action IN ('cancel','pause','downgrade_to_free')),
  smart_retry_enabled   BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE dunning_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dunning_configs_venture_isolation"
  ON dunning_configs FOR ALL
  USING (venture_id = current_setting('app.venture_id', true));

-- ─────────────────────────────────────────────────────────
-- 4. DUNNING STATES (per subscription payment failure)
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dunning_states (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id    TEXT NOT NULL,
  payment_intent_id  TEXT NOT NULL,
  failed_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  retry_count        INTEGER NOT NULL DEFAULT 0,
  next_retry_at      TIMESTAMPTZ,
  status             TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','recovered','exhausted','canceled')),
  recovered_at       TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dunning_states_subscription ON dunning_states (subscription_id);
CREATE INDEX IF NOT EXISTS idx_dunning_states_status       ON dunning_states (status);
CREATE INDEX IF NOT EXISTS idx_dunning_states_next_retry   ON dunning_states (next_retry_at) WHERE status = 'active';

ALTER TABLE dunning_states ENABLE ROW LEVEL SECURITY;
-- Dunning states are internal ops; service role access only
CREATE POLICY "dunning_states_service_only"
  ON dunning_states FOR ALL
  USING (true);  -- enforce access at application layer

-- ─────────────────────────────────────────────────────────
-- 5. TAX JURISDICTIONS (global reference table)
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tax_jurisdictions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                 TEXT NOT NULL UNIQUE,  -- e.g. 'US-CA', 'CA-ON', 'EU-DE'
  country              TEXT NOT NULL,          -- ISO 3166-1 alpha-2
  state                TEXT,                   -- ISO 3166-2 subdivision
  name                 TEXT NOT NULL,
  tax_type             TEXT NOT NULL CHECK (tax_type IN ('sales','vat','gst','hst','pst','qst')),
  default_rate         NUMERIC(6,5) NOT NULL,  -- e.g. 0.07250
  filing_frequency     TEXT NOT NULL DEFAULT 'quarterly' CHECK (filing_frequency IN ('monthly','quarterly','annually')),
  filing_deadline_days INTEGER NOT NULL DEFAULT 30,
  categories           JSONB NOT NULL DEFAULT '{}',  -- category-specific rate overrides
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tax_jurisdictions_country ON tax_jurisdictions (country);
CREATE INDEX IF NOT EXISTS idx_tax_jurisdictions_state   ON tax_jurisdictions (country, state);

ALTER TABLE tax_jurisdictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tax_jurisdictions_public_read"
  ON tax_jurisdictions FOR SELECT
  USING (true);

-- ─────────────────────────────────────────────────────────
-- 6. TAX NEXUS TRACKING (per venture, per jurisdiction)
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tax_nexus_tracking (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id          TEXT NOT NULL,
  jurisdiction_id     UUID NOT NULL REFERENCES tax_jurisdictions(id) ON DELETE CASCADE,
  metric_type         TEXT NOT NULL CHECK (metric_type IN ('revenue','transactions')),
  current_value       NUMERIC(14,2) NOT NULL DEFAULT 0,
  threshold           NUMERIC(14,2) NOT NULL,
  threshold_reached   BOOLEAN NOT NULL DEFAULT false,
  period_start        DATE NOT NULL,
  period_end          DATE NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (venture_id, jurisdiction_id, metric_type, period_start)
);

CREATE INDEX IF NOT EXISTS idx_nexus_tracking_venture     ON tax_nexus_tracking (venture_id);
CREATE INDEX IF NOT EXISTS idx_nexus_tracking_threshold   ON tax_nexus_tracking (venture_id, threshold_reached);

ALTER TABLE tax_nexus_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nexus_tracking_venture_isolation"
  ON tax_nexus_tracking FOR ALL
  USING (venture_id = current_setting('app.venture_id', true));

-- ─────────────────────────────────────────────────────────
-- 7. PRICE LOCALIZATION CONFIGS (one per venture)
-- ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS price_localization_configs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id       TEXT NOT NULL UNIQUE,
  enabled          BOOLEAN NOT NULL DEFAULT false,
  base_currency    TEXT NOT NULL DEFAULT 'USD',
  strategy         TEXT NOT NULL DEFAULT 'purchasing_power_parity'
                     CHECK (strategy IN ('purchasing_power_parity','exchange_rate_only','manual_override')),
  rounding_rule    TEXT NOT NULL DEFAULT 'nearest_dollar'
                     CHECK (rounding_rule IN ('nearest_dollar','nearest_5','nearest_10','psychological','none')),
  country_overrides JSONB NOT NULL DEFAULT '[]',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE price_localization_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "price_localization_venture_isolation"
  ON price_localization_configs FOR ALL
  USING (venture_id = current_setting('app.venture_id', true));

-- ─────────────────────────────────────────────────────────
-- SEED: TAX JURISDICTIONS
-- ─────────────────────────────────────────────────────────

INSERT INTO tax_jurisdictions (code, country, state, name, tax_type, default_rate, filing_frequency, filing_deadline_days) VALUES
  -- Canada — Federal
  ('CA',    'CA', NULL, 'Canada GST',                'gst', 0.05000, 'quarterly', 30),
  -- Canada — Provinces
  ('CA-ON', 'CA', 'ON', 'Ontario HST',               'hst', 0.13000, 'quarterly', 30),
  ('CA-BC', 'CA', 'BC', 'British Columbia PST',       'pst', 0.07000, 'quarterly', 30),
  ('CA-QC', 'CA', 'QC', 'Quebec QST',                 'qst', 0.09975, 'quarterly', 30),
  -- United States
  ('US-CA', 'US', 'CA', 'California Sales Tax',       'sales', 0.07250, 'quarterly', 30),
  ('US-NY', 'US', 'NY', 'New York Sales Tax',         'sales', 0.08000, 'quarterly', 20),
  ('US-TX', 'US', 'TX', 'Texas Sales Tax',            'sales', 0.06250, 'quarterly', 20),
  ('US-FL', 'US', 'FL', 'Florida Sales Tax',          'sales', 0.06000, 'quarterly', 30),
  ('US-WA', 'US', 'WA', 'Washington Sales Tax',       'sales', 0.06500, 'monthly',   25),
  -- European Union
  ('EU-DE', 'DE', NULL, 'Germany VAT',                'vat', 0.19000, 'quarterly', 30),
  ('EU-FR', 'FR', NULL, 'France VAT',                 'vat', 0.20000, 'quarterly', 30),
  ('EU-NL', 'NL', NULL, 'Netherlands VAT',            'vat', 0.21000, 'quarterly', 30),
  -- United Kingdom
  ('GB',    'GB', NULL, 'UK VAT',                     'vat', 0.20000, 'quarterly', 30),
  -- Australia
  ('AU',    'AU', NULL, 'Australia GST',              'gst', 0.10000, 'quarterly', 28)
ON CONFLICT (code) DO NOTHING;
