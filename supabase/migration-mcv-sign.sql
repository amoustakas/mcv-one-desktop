-- MCV Sign v0 — protocol-native signing primitive (Epic 9).
--
-- Adds a unified signing-rail substrate alongside the rail-specific
-- docusign_envelopes table (migration-docusign-envelopes.sql). The
-- split is intentional v0:
--
--   docusign_envelopes  — DocuSign-only audit/idempotency rows. Shipped
--                         in PR #30 + already populating.
--   signing_envelopes   — Unified substrate for MCV Sign AND future
--                         migrations of DocuSign rows. New writes from
--                         the rail-router go here.
--   signing_envelope_signers — Per-signer row with Ed25519 signature
--                         payload + capture metadata (IP, UA, ts). One
--                         row per signer per envelope.
--   signing_envelope_audit   — Append-only event log. Every state
--                         transition (created, token_issued, applied,
--                         completed, voided) emits one row. Never
--                         updated, never deleted — locked by trigger.
--   signing_rail_config      — Per-venture picker. Caller reads
--                         (venture_id, rail) to decide DocuSign vs
--                         MCV Sign at send-time. Defaults to DocuSign
--                         so existing flows keep working.
--
-- All tables RLS-enabled; service-role-only via the Capital API
-- handler (Clerk-authed) and MCV Sign webhook (token-authed).

-- 1. Envelopes -----------------------------------------------------
CREATE TABLE IF NOT EXISTS signing_envelopes (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- External-facing envelope id — stable URL slug for MCV Sign links.
  -- For DocuSign-sourced rows, mirrors the DocuSign envelope id.
  public_id          TEXT NOT NULL UNIQUE,
  adapter            TEXT NOT NULL
                       CHECK (adapter IN ('mcv-sign', 'docusign', 'eu-sign')),
  -- commitment link is the primary correlation today; other use cases
  -- (non-commitment envelopes for e.g. NDAs) leave it null.
  commitment_id      UUID REFERENCES capital_commitments(id) ON DELETE SET NULL,
  venture_id         UUID REFERENCES ventures(id) ON DELETE SET NULL,
  -- Hash-binds the signed document to a Content OS row. If the content
  -- body changes after envelope creation, signatures become unverifiable
  -- (advanced-electronic-signature property — eIDAS AdES-level).
  content_id         UUID REFERENCES content(id) ON DELETE SET NULL,
  content_hash       TEXT NOT NULL,       -- sha256 hex
  -- Canonicalized envelope payload that each signer commits to by
  -- signing. Includes content_hash + ordered signer list. Stored for
  -- verification + audit re-derivation.
  envelope_payload   JSONB NOT NULL,
  status             TEXT NOT NULL DEFAULT 'draft'
                       CHECK (status IN ('draft', 'sent', 'in_progress', 'signed', 'declined', 'voided', 'expired')),
  subject            TEXT,
  message            TEXT,
  expires_at         TIMESTAMPTZ,
  -- Issuer-side attestation Ed25519 signature over the final completed
  -- envelope — binds every signer's individual signatures into one
  -- verifiable receipt. Populated when status flips to 'signed'.
  completion_signature TEXT,
  completion_signing_key TEXT,            -- kid from vc-issuer keypair
  completed_at       TIMESTAMPTZ,
  created_by         TEXT,                 -- clerk user id of sender
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_signing_envelopes_commitment
  ON signing_envelopes (commitment_id) WHERE commitment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_signing_envelopes_venture
  ON signing_envelopes (venture_id);
CREATE INDEX IF NOT EXISTS idx_signing_envelopes_adapter_status
  ON signing_envelopes (adapter, status);

-- 2. Signers -------------------------------------------------------
CREATE TABLE IF NOT EXISTS signing_envelope_signers (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  envelope_id        UUID NOT NULL REFERENCES signing_envelopes(id) ON DELETE CASCADE,
  ordinal            INTEGER NOT NULL,    -- 0-indexed signing order
  email              TEXT NOT NULL,
  name               TEXT,
  role               TEXT,                 -- 'Investor' | 'Issuer' | 'Witness' | …
  -- Signer-side contact linkage for CRM hookup. Optional.
  -- NOTE: points to real `contacts` table (Desktop schema). Session 10+
  -- capital code has lingering `.from('crm_contacts')` references that
  -- silently 404 — tracked as Wave-5D cleanup sweep for the marathon.
  contact_id         UUID REFERENCES contacts(id) ON DELETE SET NULL,
  -- Short-lived JWT-like token the signer clicks to apply their
  -- signature. Issued at envelope creation; verified at apply time.
  token_hash         TEXT NOT NULL,        -- sha256 of the raw token (never store raw)
  token_expires_at   TIMESTAMPTZ NOT NULL,
  -- Captured when the signer applies their signature.
  status             TEXT NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'viewed', 'signed', 'declined')),
  signed_at          TIMESTAMPTZ,
  signature          TEXT,                 -- Ed25519 sig over canonicalized envelope_payload
  signature_algo     TEXT DEFAULT 'Ed25519',
  -- Capture metadata for audit + ESIGN compliance ("intent to sign"
  -- evidence).
  ip_address         TEXT,
  user_agent         TEXT,
  declined_reason    TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (envelope_id, ordinal)
);

CREATE INDEX IF NOT EXISTS idx_signing_envelope_signers_envelope
  ON signing_envelope_signers (envelope_id);
CREATE INDEX IF NOT EXISTS idx_signing_envelope_signers_token_hash
  ON signing_envelope_signers (token_hash);

-- 3. Audit trail (append-only) -------------------------------------
CREATE TABLE IF NOT EXISTS signing_envelope_audit (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  envelope_id        UUID NOT NULL REFERENCES signing_envelopes(id) ON DELETE CASCADE,
  event_type         TEXT NOT NULL
                       CHECK (event_type IN (
                         'envelope_created', 'envelope_sent', 'token_issued',
                         'signer_viewed', 'signature_applied', 'envelope_completed',
                         'envelope_declined', 'envelope_voided', 'envelope_expired',
                         'content_mutation_detected'
                       )),
  actor              TEXT,                 -- clerk user id, 'system', or signer email
  actor_type         TEXT NOT NULL DEFAULT 'system'
                       CHECK (actor_type IN ('user', 'signer', 'system')),
  payload            JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_signing_envelope_audit_envelope
  ON signing_envelope_audit (envelope_id, created_at);

-- Enforce append-only: block UPDATE + DELETE via trigger. This is
-- stronger than RLS because it applies to service-role too. The only
-- way to "correct" an audit entry is to append a new one noting the
-- correction.
CREATE OR REPLACE FUNCTION signing_envelope_audit_block_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'signing_envelope_audit is append-only; use a new row to note corrections';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS signing_envelope_audit_no_update ON signing_envelope_audit;
CREATE TRIGGER signing_envelope_audit_no_update
  BEFORE UPDATE ON signing_envelope_audit
  FOR EACH ROW EXECUTE FUNCTION signing_envelope_audit_block_mutation();

DROP TRIGGER IF EXISTS signing_envelope_audit_no_delete ON signing_envelope_audit;
CREATE TRIGGER signing_envelope_audit_no_delete
  BEFORE DELETE ON signing_envelope_audit
  FOR EACH ROW EXECUTE FUNCTION signing_envelope_audit_block_mutation();

-- 4. Per-venture rail config ---------------------------------------
CREATE TABLE IF NOT EXISTS signing_rail_config (
  venture_id         UUID PRIMARY KEY REFERENCES ventures(id) ON DELETE CASCADE,
  rail               TEXT NOT NULL DEFAULT 'docusign'
                       CHECK (rail IN ('docusign', 'mcv-sign', 'eu-sign')),
  -- Overrides for the default template, subject, expiration days etc.
  -- per venture. Shape is rail-dependent; parser lives in the rail
  -- router so we don't bake schema here.
  config             JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by         TEXT
);

-- 5. RLS -----------------------------------------------------------
ALTER TABLE signing_envelopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE signing_envelope_signers ENABLE ROW LEVEL SECURITY;
ALTER TABLE signing_envelope_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE signing_rail_config ENABLE ROW LEVEL SECURITY;

-- 6. Realtime ------------------------------------------------------
DO $pub$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE signing_envelopes;
    ALTER PUBLICATION supabase_realtime ADD TABLE signing_envelope_signers;
    -- Audit intentionally NOT realtime — operators query it
    -- historically via audit views, not live dashboards.
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $pub$;
