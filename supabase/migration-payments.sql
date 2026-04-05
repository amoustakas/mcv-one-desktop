-- Payment Router tables
-- Follows same pattern as supabase/migration-ledger.sql

CREATE TABLE IF NOT EXISTS venture_payment_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venture_id TEXT NOT NULL UNIQUE,
  enabled_processors TEXT[] NOT NULL DEFAULT '{"stripe"}',
  preferred_rail TEXT,
  platform_fee_type TEXT NOT NULL DEFAULT 'percentage' CHECK (platform_fee_type IN ('percentage', 'flat', 'tiered')),
  platform_fee_value NUMERIC(10, 4) NOT NULL DEFAULT 2.5,
  platform_fee_tiers JSONB,
  auto_payout_schedule TEXT NOT NULL DEFAULT 'weekly' CHECK (auto_payout_schedule IN ('daily', 'weekly', 'monthly', 'manual')),
  auto_payout_minimum NUMERIC(20, 4) NOT NULL DEFAULT 100,
  crypto_enabled BOOLEAN NOT NULL DEFAULT false,
  credit_system_enabled BOOLEAN NOT NULL DEFAULT true,
  invoicing_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_intents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venture_id TEXT NOT NULL,
  processor_id TEXT NOT NULL,
  processor_payment_id TEXT,
  amount NUMERIC(20, 4) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded', 'partially_refunded', 'disputed', 'canceled')),
  payment_method TEXT,
  customer_id TEXT,
  customer_country TEXT DEFAULT 'US',
  description TEXT DEFAULT '',
  fee_fixed NUMERIC(20, 4) DEFAULT 0,
  fee_percentage NUMERIC(10, 6) DEFAULT 0,
  fee_total NUMERIC(20, 4) DEFAULT 0,
  journal_entry_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payment_intents_venture ON payment_intents (venture_id);
CREATE INDEX idx_payment_intents_status ON payment_intents (venture_id, status);
CREATE INDEX idx_payment_intents_processor ON payment_intents (processor_id, processor_payment_id);

CREATE TABLE IF NOT EXISTS routing_decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venture_id TEXT NOT NULL,
  payment_intent_id UUID REFERENCES payment_intents(id),
  amount NUMERIC(20, 4) NOT NULL,
  currency TEXT NOT NULL,
  customer_country TEXT,
  primary_rail TEXT NOT NULL,
  fallback_rails TEXT[],
  estimated_fee NUMERIC(20, 4),
  savings_vs_default NUMERIC(20, 4) DEFAULT 0,
  reasoning TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_routing_decisions_venture ON routing_decisions (venture_id);

CREATE TABLE IF NOT EXISTS split_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venture_id TEXT NOT NULL,
  total_amount NUMERIC(20, 4) NOT NULL CHECK (total_amount > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'partially_completed')),
  total_fees NUMERIC(20, 4) DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS split_payment_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  split_payment_id UUID NOT NULL REFERENCES split_payments(id) ON DELETE CASCADE,
  recipient_id TEXT NOT NULL,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('venture', 'user', 'platform', 'tax_authority', 'external')),
  amount NUMERIC(20, 4) NOT NULL CHECK (amount >= 0),
  rail TEXT,
  description TEXT DEFAULT '',
  ledger_account TEXT,
  timing TEXT NOT NULL DEFAULT 'immediate' CHECK (timing IN ('immediate', 'on_settlement', 'deferred')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  journal_entry_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_split_items_payment ON split_payment_items (split_payment_id);

-- RLS
ALTER TABLE venture_payment_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE routing_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE split_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE split_payment_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON venture_payment_configs FOR ALL USING (true);
CREATE POLICY "Allow all" ON payment_intents FOR ALL USING (true);
CREATE POLICY "Allow all" ON routing_decisions FOR ALL USING (true);
CREATE POLICY "Allow all" ON split_payments FOR ALL USING (true);
CREATE POLICY "Allow all" ON split_payment_items FOR ALL USING (true);
