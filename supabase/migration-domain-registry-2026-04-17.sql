-- supabase/migration-domain-registry-2026-04-17.sql
-- Authoritative registry of every domain the conglomerate owns.
-- First-run sync pulls from Namecheap API + Cloudflare Zones API (integration lands post-T2).
--
-- SCHEMA: parent_entity_id is TEXT FK to capital_legal_entity.id (text).
-- Crown ids are literal text: 'mcv-inc-crown' (MCV Inc., US-DE) and 'mcv-ltd-crown' (MCV LTD, UK).

CREATE TABLE IF NOT EXISTS domain_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fqdn text UNIQUE NOT NULL,
  registrar text,
  registrar_ref text,
  cloudflare_zone_id text,
  parent_entity_id text REFERENCES capital_legal_entity(id),
  venture_id text REFERENCES ventures(id),
  nameservers text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','expiring','expired','transfer','parked')),
  registered_at date,
  expires_at date,
  auto_renew boolean,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_domain_registry_venture ON domain_registry(venture_id);
CREATE INDEX IF NOT EXISTS idx_domain_registry_parent ON domain_registry(parent_entity_id);

-- Minimal known-domain seed so UI has something to render pre-sync.
-- MCV Inc. parents the .inc / .one / .cx / .gg / .dev / .tech / .ai domains.
-- MCV LTD parents the .ltd domain.
INSERT INTO domain_registry (fqdn, registrar, parent_entity_id, venture_id, status) VALUES
  ('mcv.inc',        'Namecheap', 'mcv-inc-crown', 'mcv-inc',    'active'),
  ('mcv.ltd',        'Namecheap', 'mcv-ltd-crown', NULL,         'active'),
  ('mcv.one',        'Namecheap', 'mcv-inc-crown', NULL,         'active'),
  ('mcv.cx',         'Namecheap', 'mcv-inc-crown', 'mcv-cx',     'active'),
  ('mcv.gg',         'Namecheap', 'mcv-inc-crown', 'mcvgg',      'active'),
  ('mcv.dev',        'Namecheap', 'mcv-inc-crown', 'mcv-dev',    'active'),
  ('mcv.tech',       'Namecheap', 'mcv-inc-crown', 'mcv-tech',   'active'),
  ('futurestate.ai', 'Namecheap', 'mcv-inc-crown', 'futurestate','active'),
  ('betedge.ai',     'Namecheap', 'mcv-inc-crown', 'betedge',    'active')
ON CONFLICT (fqdn) DO NOTHING;

-- Now that domain_registry exists, wire venture_brand_kits.primary_domain to it.
-- Deferrable so multi-statement transactions can update both sides before the check fires.
ALTER TABLE venture_brand_kits
  ADD CONSTRAINT fk_venture_brand_kits_domain
  FOREIGN KEY (primary_domain) REFERENCES domain_registry(fqdn)
  DEFERRABLE INITIALLY DEFERRED;

COMMENT ON TABLE domain_registry IS 'Sovereign registry of every owned domain. Synced from Namecheap + Cloudflare.';
