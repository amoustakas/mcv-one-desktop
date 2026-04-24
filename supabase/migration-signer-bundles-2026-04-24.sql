-- migration-signer-bundles-2026-04-24.sql
--
-- @mcv/signer-sdk bundle registry tables. Layered on top of the v0.1 SDK
-- migration (signing_envelopes/signing_documents/signing_events_audit);
-- apply after migration-signer-sdk-v0-1-2026-04-24.sql.
--
-- Two tables mirroring the SignerBundleManifest + SignerTemplateRef shapes
-- from packages/signer-sdk/src/registry/manifest.ts:
--
--   signing_bundles           — one row per registered bundle (headers)
--   signing_bundle_templates  — per-template rows; N:1 with bundles
--
-- Load-bearing invariants:
--   • sdk_version pin per bundle so old manifests can be lazily migrated
--   • jurisdictions constrained to 'us' in v0.1; v0.2 widens
--   • parent_venture_id + optional child_venture_id scope tuple matches
--     the envelope tables so per-tenant RLS can share one predicate
--     once Phase-1 Intelligence Router lands set_tenant.
--
-- RLS mirrors the envelope migration (mcv_admin SELECT, service-role
-- writes). Bundle discovery is NOT tenant-scoped in v0.1 — all admins
-- see all bundles so a future "browse signing bundles" admin UI can
-- surface cross-tenant templates a venture can install.

-- ============================================================================
-- signing_bundles
-- ============================================================================

CREATE TABLE IF NOT EXISTS signing_bundles (
  id                  text        PRIMARY KEY,          -- matches SignerBundleManifest.id
  version             text        NOT NULL,             -- bundle-owner's version string
  parent_venture_id   text        NOT NULL,
  child_venture_id    text,
  name                text        NOT NULL,
  description         text        NOT NULL,
  roles               text[]      DEFAULT '{}',         -- empty = generic (matches any role filter)
  jurisdictions       text[]      NOT NULL
    CHECK (
      array_length(jurisdictions, 1) > 0
      AND jurisdictions <@ ARRAY['us']::text[]          -- v0.1 jurisdictions allow-list
    ),
  sdk_version         text        NOT NULL,

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  retired_at          timestamptz                       -- null = active; set when an older
                                                        -- bundle is superseded (registrations
                                                        -- remain discoverable for audit, but
                                                        -- the registry's default discover()
                                                        -- filters out retired).
);

COMMENT ON TABLE signing_bundles IS
  'Signer-SDK bundle registry headers. Mirrors SignerBundleManifest; one row per registered bundle. Templates live in signing_bundle_templates with N:1 FK.';

CREATE INDEX IF NOT EXISTS signing_bundles_parent_venture_idx ON signing_bundles (parent_venture_id);
CREATE INDEX IF NOT EXISTS signing_bundles_active_idx
  ON signing_bundles (parent_venture_id)
  WHERE retired_at IS NULL;

-- ============================================================================
-- signing_bundle_templates
-- ============================================================================

CREATE TABLE IF NOT EXISTS signing_bundle_templates (
  bundle_id           text        NOT NULL REFERENCES signing_bundles(id) ON DELETE CASCADE,
  template_id         text        NOT NULL,             -- stable within a bundle
  version             integer     NOT NULL CHECK (version >= 0),
  title               text        NOT NULL,
  description         text,
  tags                text[]      DEFAULT '{}',
  required            boolean     NOT NULL DEFAULT true,
  display_order       integer     NOT NULL DEFAULT 0,

  created_at          timestamptz NOT NULL DEFAULT now(),

  PRIMARY KEY (bundle_id, template_id)
);

COMMENT ON TABLE signing_bundle_templates IS
  'Per-template rows in a signing bundle. Matches SignerTemplateRef + adds display_order for deterministic render order.';

CREATE INDEX IF NOT EXISTS signing_bundle_templates_order_idx
  ON signing_bundle_templates (bundle_id, display_order, template_id);

-- ============================================================================
-- updated_at trigger (re-use the function from the envelope migration;
-- declare it conditionally here so this file can apply standalone).
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'signing_bundles_touch_updated_at') THEN
    CREATE OR REPLACE FUNCTION signing_bundles_touch_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $fn$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $fn$;
  END IF;
END $$;

DROP TRIGGER IF EXISTS signing_bundles_touch ON signing_bundles;
CREATE TRIGGER signing_bundles_touch
  BEFORE UPDATE ON signing_bundles
  FOR EACH ROW EXECUTE FUNCTION signing_bundles_touch_updated_at();

-- ============================================================================
-- RLS
-- ============================================================================

ALTER TABLE signing_bundles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE signing_bundle_templates  ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'signing_bundles' AND policyname = 'signing_bundles_admin_read') THEN
    CREATE POLICY signing_bundles_admin_read ON signing_bundles FOR SELECT TO authenticated
      USING (auth.jwt()->>'role' = 'mcv_admin');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'signing_bundle_templates' AND policyname = 'signing_bundle_templates_admin_read') THEN
    CREATE POLICY signing_bundle_templates_admin_read ON signing_bundle_templates FOR SELECT TO authenticated
      USING (auth.jwt()->>'role' = 'mcv_admin');
  END IF;
END $$;
