-- DocuSign envelopes audit table (Epic 13 S3).
-- Stores one row per envelope created via the DocuSign adapter.
-- Used for:
--   1. Idempotent webhook handling (DocuSign retries; we upsert)
--   2. Commitment back-correlation when the webhook event lacks the
--      capital_commitment_id custom field (older templates)
--   3. Audit trail for compliance reviews — every signed contract has
--      a row here with signers + completion timestamp + signed PDF
--      (preserved in raw_event JSON until Content OS upload lands)
--
-- Future MCV Sign + eIDAS adapters will share this table — the
-- `adapter` column distinguishes the rail. Renaming to
-- `signing_envelopes` is a follow-up once we have ≥2 signing rails
-- live.

CREATE TABLE IF NOT EXISTS docusign_envelopes (
  envelope_id        TEXT PRIMARY KEY,
  commitment_id      UUID REFERENCES capital_commitments(id) ON DELETE SET NULL,
  adapter            TEXT NOT NULL DEFAULT 'docusign'
                       CHECK (adapter IN ('docusign', 'mcv-sign', 'eu-sign')),
  outcome            TEXT
                       CHECK (outcome IS NULL OR outcome IN ('signed', 'declined', 'voided', 'expired')),
  template_id        TEXT,
  signers_json       JSONB NOT NULL DEFAULT '[]'::jsonb,
  receipt_content_id UUID REFERENCES content(id) ON DELETE SET NULL,
  raw_event          JSONB,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at       TIMESTAMPTZ,
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_docusign_envelopes_commitment
  ON docusign_envelopes (commitment_id) WHERE commitment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_docusign_envelopes_adapter_outcome
  ON docusign_envelopes (adapter, outcome);

-- Service-role-only via RLS. Reads + writes are gated through the
-- Capital API handler (which authenticates via Clerk) and the webhook
-- (which authenticates via HMAC).
ALTER TABLE docusign_envelopes ENABLE ROW LEVEL SECURITY;

-- Realtime so the UI can show envelope status changes live without
-- polling. Capital realtime invalidator (PR #14) already subscribes
-- to capital_* tables; this table joins via commitment_id.
DO $pub$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE docusign_envelopes;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $pub$;
