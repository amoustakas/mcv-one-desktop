-- supabase/migration-venture-corporate-stack-2026-04-17.sql
-- Ships the Corporate Stack primitive: jurisdictions + accounts + brand kits per venture.

CREATE TABLE IF NOT EXISTS venture_jurisdictions (
  venture_id text NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  jurisdiction_code text NOT NULL,
  regulatory_frameworks text[] NOT NULL DEFAULT '{}',
  tax_structure text,
  compliance_rule_set_id uuid REFERENCES capital_compliance_rule_set(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (venture_id, jurisdiction_code)
);

CREATE TABLE IF NOT EXISTS venture_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id text NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  account_type text NOT NULL CHECK (account_type IN ('bank','treasury','merchant','tax','crypto')),
  provider text NOT NULL,
  account_ref text,
  currency text NOT NULL,
  balance_cached numeric,
  balance_synced_at timestamptz,
  treasury_id uuid REFERENCES capital_treasury(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_venture_accounts_venture ON venture_accounts(venture_id);

CREATE TABLE IF NOT EXISTS venture_brand_kits (
  venture_id text PRIMARY KEY REFERENCES ventures(id) ON DELETE CASCADE,
  primary_domain text,                        -- FK added in T2.5 domain_registry migration
  logo_asset_id uuid,
  color_primary text,
  color_accent text,
  voice_persona_id uuid,                      -- FK added in later personas migration
  brand_kit_version text,
  style_guide_content_id uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE venture_jurisdictions IS 'Where a venture legally operates + its regulatory framework + tax structure.';
COMMENT ON TABLE venture_accounts IS 'Bank + treasury + merchant + tax + crypto accounts attached to a venture.';
COMMENT ON TABLE venture_brand_kits IS 'Brand identity per venture: domain, voice, colors, style guide.';
