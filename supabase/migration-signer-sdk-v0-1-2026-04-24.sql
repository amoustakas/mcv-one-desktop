-- migration-signer-sdk-v0-1-2026-04-24.sql
--
-- @mcv/signer-sdk v0.1 — forward-facing signing primitive for every MCV
-- venture + child venture. Three tables:
--
--   signing_envelopes        — one row per issued envelope (1:N with documents)
--   signing_documents        — per-document rows (supports multi-document envelopes)
--   signing_events_audit     — immutable audit log of envelope lifecycle transitions
--
-- Load-bearing invariants:
--   • (tenant_id, parent_venture_id, child_venture_id) scope tuple on every table
--     so a future set_tenant-style RLS predicate can flip on in one policy update
--     once Phase-1 Intelligence Router lands.
--   • templateVersion is pinned per document at issue time; drift detection
--     is a client-side read + `signing.envelope.mutation-detected` emission.
--   • `rendered_sha256` is the signer's commitment. Any mutation to
--     `rendered_bytes` after signing fires mutation-detected.
--   • `origin = 'agent'` documents must carry `generated_by_agent_handle` + workflow_id.
--
-- Parallel to the existing "mcv-sign" operator schema (from PR #35) — intentional.
-- A future convergence session can reconcile or keep them separate.
--
-- RLS posture (v0.1): mirrors migration-agentic-os-events-2026-04-22 — mcv_admin
-- can read everything; writes are service-role-only. Per-tenant scoped policies
-- land once the `set_tenant` RPC from Phase-1 is on master.

-- ============================================================================
-- signing_envelopes
-- ============================================================================

CREATE TABLE IF NOT EXISTS signing_envelopes (
  -- Identity
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id           text        NOT NULL UNIQUE,

  -- Scope
  tenant_id           text        NOT NULL,
  parent_venture_id   text        NOT NULL,
  child_venture_id    text,

  -- Signer identity (single signer per envelope in v0.1; multi-signer is v0.2)
  signer_email        text        NOT NULL,
  signer_name         text        NOT NULL,
  signer_role         text,
  signer_display_role text,

  -- State machine
  status              text        NOT NULL CHECK (status IN ('draft','issued','viewed','partial','signed','voided','expired')),
  envelope_version    integer     NOT NULL DEFAULT 1,

  -- Lifecycle timestamps
  issued_at           timestamptz NOT NULL,
  issued_by           text        NOT NULL,
  expires_at          timestamptz NOT NULL,
  viewed_at           timestamptz,
  first_signed_at     timestamptz,
  last_signed_at      timestamptz,
  voided_at           timestamptz,
  voided_by           text,
  void_reason         text,

  -- Optional sender-provided preamble shown in the UI
  message             text,

  -- Denormalised for audit queries
  document_count      integer     NOT NULL CHECK (document_count > 0),
  access_ip_hashes    text[]      DEFAULT '{}',

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE signing_envelopes IS
  'Envelope header for the @mcv/signer-sdk v0.1 signing primitive. One row per envelope; documents live in signing_documents with N:1 FK. Parallel to the mcv-sign operator schema — the namespaces will converge in a later session.';

CREATE INDEX IF NOT EXISTS signing_envelopes_scope_idx
  ON signing_envelopes (tenant_id, parent_venture_id, child_venture_id);
CREATE INDEX IF NOT EXISTS signing_envelopes_signer_email_idx
  ON signing_envelopes (lower(signer_email));
CREATE INDEX IF NOT EXISTS signing_envelopes_status_idx
  ON signing_envelopes (status)
  WHERE status IN ('issued', 'viewed', 'partial');  -- hot path: "envelopes awaiting action"
CREATE INDEX IF NOT EXISTS signing_envelopes_expires_at_idx
  ON signing_envelopes (expires_at)
  WHERE status IN ('issued', 'viewed', 'partial');

-- ============================================================================
-- signing_documents
-- ============================================================================

CREATE TABLE IF NOT EXISTS signing_documents (
  id                        text        PRIMARY KEY,      -- matches SignerDocument.id (format: "{publicId}:{idx}")
  envelope_id               uuid        NOT NULL REFERENCES signing_envelopes(id) ON DELETE CASCADE,
  ordinal                   integer     NOT NULL CHECK (ordinal >= 0),

  template_id               text        NOT NULL,
  template_version          integer     NOT NULL CHECK (template_version >= 0),

  origin                    text        NOT NULL CHECK (origin IN ('human', 'agent')),
  generated_by_agent_handle text,
  generated_by_workflow_id  text,
  generated_by_draft_event_id uuid,

  rendered_bytes            text        NOT NULL,
  rendered_at               timestamptz NOT NULL,
  rendered_sha256           text        NOT NULL CHECK (rendered_sha256 ~ '^[a-f0-9]{64}$'),
  subject                   text,

  -- Per-document signing state
  signed_at                 timestamptz,
  signature_hash            text CHECK (signature_hash IS NULL OR signature_hash ~ '^[a-f0-9]{64}$'),

  created_at                timestamptz NOT NULL DEFAULT now(),

  -- Enforce: agent-origin docs MUST carry attribution.
  CONSTRAINT signing_documents_agent_origin_attribution CHECK (
    origin <> 'agent'
    OR (generated_by_agent_handle IS NOT NULL AND generated_by_workflow_id IS NOT NULL)
  ),

  UNIQUE (envelope_id, ordinal)
);

COMMENT ON TABLE signing_documents IS
  'Per-document rows for the v0.1 signer-sdk. Each row pins a templateVersion + rendered_sha256 at issue time so mutation detection can fire `signing.envelope.mutation-detected` when the template moves underneath.';

CREATE INDEX IF NOT EXISTS signing_documents_envelope_idx ON signing_documents (envelope_id, ordinal);
CREATE INDEX IF NOT EXISTS signing_documents_template_idx ON signing_documents (template_id, template_version);

-- ============================================================================
-- signing_events_audit
-- ============================================================================

CREATE TABLE IF NOT EXISTS signing_events_audit (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  envelope_id         uuid        NOT NULL REFERENCES signing_envelopes(id) ON DELETE CASCADE,
  document_id         text        REFERENCES signing_documents(id) ON DELETE CASCADE,
  tenant_id           text        NOT NULL,
  parent_venture_id   text        NOT NULL,
  child_venture_id    text,

  -- Matches the @mcv/events-sdk `signing.envelope.*` topic suffix.
  kind                text        NOT NULL CHECK (kind IN ('created', 'viewed', 'signed', 'voided', 'mutation_detected')),
  occurred_at         timestamptz NOT NULL DEFAULT now(),

  -- Evidence fields — hashed IP (not raw), truncated UA, optional reason.
  ip_hash             text,
  user_agent          text,
  reason              text,

  -- For mutation_detected: the versions that disagreed.
  expected_version    integer,
  actual_version      integer,

  -- For signed: the signature hash written to signing_documents at the same tx.
  signature_hash      text CHECK (signature_hash IS NULL OR signature_hash ~ '^[a-f0-9]{64}$')
);

COMMENT ON TABLE signing_events_audit IS
  'Immutable audit log of envelope lifecycle transitions. Rows land alongside the corresponding @mcv/events-sdk publish so the same state can be reconstructed from either source. No UPDATE/DELETE policies — append-only.';

CREATE INDEX IF NOT EXISTS signing_events_audit_envelope_idx ON signing_events_audit (envelope_id, occurred_at);
CREATE INDEX IF NOT EXISTS signing_events_audit_scope_idx
  ON signing_events_audit (tenant_id, parent_venture_id, child_venture_id, occurred_at);

-- ============================================================================
-- updated_at trigger on signing_envelopes (signing_documents is append-only,
-- signing_events_audit is strictly append-only)
-- ============================================================================

CREATE OR REPLACE FUNCTION signing_envelopes_touch_updated_at() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS signing_envelopes_touch ON signing_envelopes;
CREATE TRIGGER signing_envelopes_touch
  BEFORE UPDATE ON signing_envelopes
  FOR EACH ROW EXECUTE FUNCTION signing_envelopes_touch_updated_at();

-- ============================================================================
-- RLS
-- ============================================================================

ALTER TABLE signing_envelopes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE signing_documents     ENABLE ROW LEVEL SECURITY;
ALTER TABLE signing_events_audit  ENABLE ROW LEVEL SECURITY;

-- mcv_admin read-everything (matches migration-agentic-os-events pattern).
-- Per-tenant scoped policies land in a follow-up session once Phase-1
-- Intelligence Router merges its `set_tenant` RPC to master.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'signing_envelopes' AND policyname = 'signing_envelopes_admin_read') THEN
    CREATE POLICY signing_envelopes_admin_read ON signing_envelopes FOR SELECT TO authenticated
      USING (auth.jwt()->>'role' = 'mcv_admin');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'signing_documents' AND policyname = 'signing_documents_admin_read') THEN
    CREATE POLICY signing_documents_admin_read ON signing_documents FOR SELECT TO authenticated
      USING (auth.jwt()->>'role' = 'mcv_admin');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'signing_events_audit' AND policyname = 'signing_events_audit_admin_read') THEN
    CREATE POLICY signing_events_audit_admin_read ON signing_events_audit FOR SELECT TO authenticated
      USING (auth.jwt()->>'role' = 'mcv_admin');
  END IF;
END $$;

-- All writes go through service role (envelope-builder + the backbone's
-- /api/sign handler + the signing-observer). No authenticated-role
-- INSERT/UPDATE/DELETE policies are defined, so RLS blocks them.

-- ============================================================================
-- Realtime publication
-- ============================================================================

-- Broadcast signing_envelopes INSERT/UPDATE so cockpit compliance panels get
-- live updates without polling. Audit rows are too chatty for default
-- realtime — subscribe via the @mcv/events-sdk signing.envelope.* topics
-- instead.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = 'signing_envelopes'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE signing_envelopes;
    END IF;
  END IF;
END $$;
