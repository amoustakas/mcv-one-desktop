-- supabase/migration-capital-foundation.sql
-- Capital Foundation primitives — the five-tuple that unifies every venture
-- monetization flow: Treasury + DistributionConfig + ComplianceRuleSet +
-- RoyaltyGraph + PaymentRouter (router is runtime, not schema).
--
-- See:
--   docs/capital/PROTOCOL.md (layer map)
--   docs/capital/VENTURE_ADAPTER.md (contract)
--   C:\Users\moust\.claude\plans\luminous-mapping-globe.md (the full plan)
--
-- All additive. No destructive operations. Zero-downtime.

-- ─── 1. capital_legal_entity ───────────────────────────────────────────
-- IP ownership layer. EdgeIQ Holdings → Venture Operating Entities.
-- Every venture has exactly one ops entity; ops entity may have a parent.

CREATE TABLE IF NOT EXISTS capital_legal_entity (
  id TEXT PRIMARY KEY,                              -- 'edgeiq-holdings', 'betedge-ops-inc', etc.
  label TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,                       -- 'CA-ON', 'US-DE', 'CAYMAN', 'SG', 'EU'
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'corporation', 'llc', 'gp', 'lp', 'trust', 'foundation', 'dao', 'other'
  )),
  parent_entity_id TEXT REFERENCES capital_legal_entity(id) ON DELETE SET NULL,
  registration_number TEXT,
  tax_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_legal_entity_jurisdiction ON capital_legal_entity (jurisdiction);
CREATE INDEX IF NOT EXISTS idx_legal_entity_parent ON capital_legal_entity (parent_entity_id) WHERE parent_entity_id IS NOT NULL;

-- ─── 2. capital_treasury ───────────────────────────────────────────────
-- Per-venture, per-currency, per-jurisdiction money source.
-- kind covers fiat rails (Stripe Connect, bank ACH, trust account, escrow)
-- and crypto (SPL, ERC20, self-custody, multi-sig).

CREATE TABLE IF NOT EXISTS capital_treasury (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id TEXT NOT NULL,                          -- matches ventures.id
  label TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN (
    'stripe_connect', 'wallet_custodial', 'wallet_self', 'bank_ach',
    'spl_token', 'erc20', 'multi_sig', 'trust_account', 'escrow', 'other'
  )),
  jurisdiction TEXT NOT NULL,                        -- governs ComplianceRuleSet scope
  currency TEXT NOT NULL,                            -- ISO 4217 ('CAD','USD','EUR') or crypto ('SOL','EDGE','USDC')
  stripe_account_id TEXT,
  wallet_address TEXT,
  chain TEXT,                                        -- 'solana', 'base', 'eth', 'arbitrum', etc.
  custodian TEXT,                                    -- 'stripe', 'coinbase-prime', 'fireblocks', 'self'
  owner_entity_id TEXT REFERENCES capital_legal_entity(id) ON DELETE SET NULL,
  owner_user_id TEXT,
  balance_cache JSONB NOT NULL DEFAULT '[]',         -- [{currency, amount, lastSyncedAt}]
  policy JSONB NOT NULL DEFAULT '{}',                -- {autoExecute, manualApprovalAboveBps, maxDailyPayoutUsd, signers:[]}
  metadata JSONB NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT capital_treasury_label_unique UNIQUE (venture_id, label)
);

CREATE INDEX IF NOT EXISTS idx_treasury_venture_kind ON capital_treasury (venture_id, kind);
CREATE INDEX IF NOT EXISTS idx_treasury_jurisdiction ON capital_treasury (jurisdiction);

-- ─── 3. capital_compliance_rule_set + capital_compliance_rule ──────────

CREATE TABLE IF NOT EXISTS capital_compliance_rule_set (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id TEXT NOT NULL,
  label TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT capital_compliance_ruleset_unique UNIQUE (venture_id, label)
);

CREATE INDEX IF NOT EXISTS idx_compliance_ruleset_venture ON capital_compliance_rule_set (venture_id, jurisdiction);

CREATE TABLE IF NOT EXISTS capital_compliance_rule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_set_id UUID NOT NULL REFERENCES capital_compliance_rule_set(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL CHECK (rule_type IN (
    'hold_period', 'accreditation_min', 'jurisdiction_allowlist', 'jurisdiction_blocklist',
    'ofac', 'aml_score_max', 'age_min', 'investment_cap_per_investor',
    'wager_limit_daily', 'responsible_gaming', 'cooling_off_period',
    'max_token_alloc_per_wallet', 'reg_cf_annual_cap', 'reg_d_verification',
    'vpn_block', 'time_window', 'other'
  )),
  scope TEXT NOT NULL CHECK (scope IN (
    'intake', 'distribution', 'withdrawal', 'admit', 'wager', 'transfer'
  )),
  config JSONB NOT NULL DEFAULT '{}',               -- rule-type-specific params
  priority INTEGER NOT NULL DEFAULT 100,
  active BOOLEAN NOT NULL DEFAULT true,
  effective_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_compliance_rule_set_scope ON capital_compliance_rule (rule_set_id, scope) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_compliance_rule_type ON capital_compliance_rule (rule_type) WHERE active = true;

-- ─── 4. capital_royalty_graph + capital_royalty_graph_layer ────────────
-- EdgeIQ Holdings is universal first layer on every venture's graph.

CREATE TABLE IF NOT EXISTS capital_royalty_graph (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id TEXT NOT NULL,
  label TEXT NOT NULL,                              -- 'Futurestate Platform Rake v1'
  version INTEGER NOT NULL DEFAULT 1,
  effective_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  superseded_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT capital_royalty_graph_unique UNIQUE (venture_id, label, version)
);

CREATE INDEX IF NOT EXISTS idx_royalty_graph_venture ON capital_royalty_graph (venture_id) WHERE superseded_at IS NULL;

CREATE TABLE IF NOT EXISTS capital_royalty_graph_layer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  graph_id UUID NOT NULL REFERENCES capital_royalty_graph(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL,                        -- 1 = first rake, 2 = second, ...
  label TEXT NOT NULL,                              -- 'edgeiq-holdings', 'venture-treasury', 'sponsor'
  recipient_type TEXT NOT NULL CHECK (recipient_type IN (
    'treasury', 'user', 'external_entity', 'pool'
  )),
  recipient_id TEXT NOT NULL,                       -- treasury_id (UUID text), user_id, entity id
  bps INTEGER NOT NULL CHECK (bps >= 0 AND bps <= 10000),
  kind TEXT NOT NULL CHECK (kind IN (
    'platform_rake', 'venture_rake', 'ip_royalty', 'affiliate',
    'creator_share', 'reserve', 'burn', 'fee_split', 'other'
  )),
  condition_expr TEXT,                              -- optional DSL: "flowKind==TOKEN_PRESALE && amount>=10000"
  jurisdiction TEXT,                                -- layer only applies in specific jurisdictions
  metadata JSONB NOT NULL DEFAULT '{}',
  CONSTRAINT royalty_layer_sequence_unique UNIQUE (graph_id, sequence)
);

CREATE INDEX IF NOT EXISTS idx_royalty_layer_graph ON capital_royalty_graph_layer (graph_id, sequence);

-- ─── 5. capital_distribution_config ────────────────────────────────────
-- The configuration that says: for a given (venture, flow_kind, scope),
-- HOW are bills generated and WHO gets paid.

CREATE TABLE IF NOT EXISTS capital_distribution_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id TEXT NOT NULL,
  flow_kind TEXT NOT NULL CHECK (flow_kind IN (
    're_precon_deposit', 're_construction_draw', 're_yield_distribution', 're_capital_call',
    'startup_equity_crowdfund', 'startup_safe_presale',
    'token_presale', 'token_tge_launch', 'token_liquidity_provision',
    'royalty_payout', 'referral_reward', 'quest_reward', 'engagement_payout',
    'vendor_bill', 'platform_fee_split'
  )),
  scope_type TEXT NOT NULL DEFAULT 'venture' CHECK (scope_type IN (
    'venture', 'property', 'round', 'collection', 'quest', 'creator', 'custom'
  )),
  scope_id TEXT,                                    -- NULL = applies to all scopes of type
  billing_mode TEXT NOT NULL CHECK (billing_mode IN (
    'immediate_on_committed', 'admin_batch', 'threshold', 'manual', 'milestone', 'scheduled'
  )),
  billing_threshold_bps INTEGER CHECK (billing_threshold_bps IS NULL OR (billing_threshold_bps >= 0 AND billing_threshold_bps <= 10000)),
  billing_schedule TEXT,                            -- cron for SCHEDULED / batch
  milestone_spec JSONB,                             -- construction draws: {milestones:[{pct,trigger}]}
  default_payee_strategy TEXT NOT NULL CHECK (default_payee_strategy IN (
    'property_spv', 'platform_treasury', 'sponsor_manager', 'custom_vendor', 'split', 'algorithmic'
  )),
  split_rules JSONB,                                -- [{role, bps}]; required when payee_strategy='split'
  algorithmic_rule_id UUID,                         -- FK resolved below when algo table exists
  default_currency TEXT NOT NULL DEFAULT 'CAD',
  allowed_currencies TEXT[] NOT NULL DEFAULT ARRAY['CAD','USD'],
  fx_policy JSONB NOT NULL DEFAULT '{}',            -- {provider, slippageBps, lockWindowSec}
  royalty_graph_id UUID REFERENCES capital_royalty_graph(id) ON DELETE SET NULL,
  compliance_rule_set_id UUID REFERENCES capital_compliance_rule_set(id) ON DELETE SET NULL,
  treasury_id UUID REFERENCES capital_treasury(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT dist_config_scope_unique UNIQUE (venture_id, flow_kind, scope_type, scope_id)
);

CREATE INDEX IF NOT EXISTS idx_dist_config_venture_flow ON capital_distribution_config (venture_id, flow_kind) WHERE active = true;

-- ─── 6. capital_algorithmic_rule ───────────────────────────────────────
-- BetEdge-style computed engines (referral tier ladder, token burn rate,
-- engagement boost multipliers, LP rebalancer, quest issuance cadence).

CREATE TABLE IF NOT EXISTS capital_algorithmic_rule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id TEXT NOT NULL,
  label TEXT NOT NULL,                              -- 'BetEdge Referral Tier Engine v1'
  kind TEXT NOT NULL CHECK (kind IN (
    'token_economy', 'engagement_pool', 'fx_rebalancer',
    'quest_issuance', 'social_boost', 'referral_tier', 'other'
  )),
  version INTEGER NOT NULL DEFAULT 1,
  spec JSONB NOT NULL,                              -- engine-specific config
  active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT capital_algo_rule_unique UNIQUE (venture_id, label, version)
);

CREATE INDEX IF NOT EXISTS idx_algo_rule_venture ON capital_algorithmic_rule (venture_id, kind) WHERE active = true;

-- Now that capital_algorithmic_rule exists, add the FK reference from distribution_config.
-- Skip if already present (idempotent).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'capital_dist_config_algo_fk'
  ) THEN
    ALTER TABLE capital_distribution_config
      ADD CONSTRAINT capital_dist_config_algo_fk
      FOREIGN KEY (algorithmic_rule_id) REFERENCES capital_algorithmic_rule(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ─── 7. capital_distribution_leg ───────────────────────────────────────
-- Per-leg breakdown of a Distribution. Complements existing
-- capital_distribution_recipients (which is yield-flavored with holdings).
-- The leg table generalizes to ALL flow kinds and carries royalty layer ref.

CREATE TABLE IF NOT EXISTS capital_distribution_leg (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  distribution_id UUID NOT NULL REFERENCES capital_distributions(id) ON DELETE CASCADE,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN (
    'investor', 'vendor', 'platform', 'reserve', 'royalty_holder',
    'creator', 'referrer', 'referee', 'liquidity_pool', 'external'
  )),
  recipient_id TEXT NOT NULL,
  royalty_layer_id UUID REFERENCES capital_royalty_graph_layer(id) ON DELETE SET NULL,
  amount NUMERIC(20, 2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL,
  fx_converted_from JSONB,                          -- {amount, currency, rate}
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'sent', 'settled', 'failed', 'no_account', 'held_compliance', 'cancelled'
  )),
  stripe_transfer_id TEXT,
  tx_hash TEXT,                                     -- on-chain settlement hash
  idempotency_key TEXT UNIQUE,
  settled_at TIMESTAMPTZ,
  failure_reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dist_leg_distribution ON capital_distribution_leg (distribution_id);
CREATE INDEX IF NOT EXISTS idx_dist_leg_recipient ON capital_distribution_leg (recipient_type, recipient_id);
CREATE INDEX IF NOT EXISTS idx_dist_leg_status ON capital_distribution_leg (status) WHERE status IN ('pending','sent','failed');

-- ─── 8. Extend capital_distributions with flow_kind + fx_snapshot + correlation_id
-- Additive columns, all nullable for backwards-compat with existing rows.

ALTER TABLE capital_distributions
  ADD COLUMN IF NOT EXISTS flow_kind TEXT,
  ADD COLUMN IF NOT EXISTS fx_snapshot JSONB,
  ADD COLUMN IF NOT EXISTS correlation_id TEXT,
  ADD COLUMN IF NOT EXISTS treasury_id UUID REFERENCES capital_treasury(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS config_id UUID REFERENCES capital_distribution_config(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_capital_dist_idempotency'
  ) THEN
    CREATE UNIQUE INDEX idx_capital_dist_idempotency ON capital_distributions (idempotency_key) WHERE idempotency_key IS NOT NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_capital_dist_correlation'
  ) THEN
    CREATE INDEX idx_capital_dist_correlation ON capital_distributions (correlation_id) WHERE correlation_id IS NOT NULL;
  END IF;
END $$;

-- ─── 9. Extend ventures with IP registry + default foundation pointers ─

ALTER TABLE IF EXISTS ventures
  ADD COLUMN IF NOT EXISTS owner_entity_id TEXT REFERENCES capital_legal_entity(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS default_treasury_id UUID REFERENCES capital_treasury(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS default_royalty_graph_id UUID REFERENCES capital_royalty_graph(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS token_symbol TEXT,
  ADD COLUMN IF NOT EXISTS launch_stage TEXT CHECK (launch_stage IS NULL OR launch_stage IN (
    'concept', 'prototype', 'alpha', 'beta', 'ga', 'sunset'
  )),
  ADD COLUMN IF NOT EXISTS ip_registry JSONB;

-- ─── 10. updated_at triggers for the five foundation tables ─────────────

CREATE OR REPLACE FUNCTION capital_foundation_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'capital_legal_entity', 'capital_treasury',
    'capital_compliance_rule_set', 'capital_compliance_rule',
    'capital_distribution_config', 'capital_algorithmic_rule',
    'capital_distribution_leg'
  ])
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS %I_touch_updated ON %I;
       CREATE TRIGGER %I_touch_updated
         BEFORE UPDATE ON %I
         FOR EACH ROW EXECUTE FUNCTION capital_foundation_touch_updated_at();',
      t, t, t, t
    );
  END LOOP;
END $$;

-- ─── 11. RLS (same permissive posture as existing capital tables) ──────
-- Desktop uses service-role-only writes; app-layer tenancy filtering.
-- If/when RLS is locked down, policies here should mirror capital_rounds.

ALTER TABLE capital_legal_entity        ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_treasury            ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_compliance_rule_set ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_compliance_rule     ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_royalty_graph       ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_royalty_graph_layer ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_distribution_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_algorithmic_rule    ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_distribution_leg    ENABLE ROW LEVEL SECURITY;

-- Service role always has full access (matches pattern in earlier migrations).
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'capital_legal_entity','capital_treasury',
    'capital_compliance_rule_set','capital_compliance_rule',
    'capital_royalty_graph','capital_royalty_graph_layer',
    'capital_distribution_config','capital_algorithmic_rule',
    'capital_distribution_leg'
  ])
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I_service_all ON %I;
       CREATE POLICY %I_service_all ON %I FOR ALL TO service_role USING (true) WITH CHECK (true);',
      t, t, t, t
    );
  END LOOP;
END $$;

-- ─── Done. Seed data for the 7 ventures ships in a follow-up script:
--    scripts/seed-capital-foundation.ts
