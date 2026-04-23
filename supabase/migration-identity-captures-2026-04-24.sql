-- supabase/migration-identity-captures-2026-04-24.sql
-- =============================================================================
--   MCV ID — IDENTITY CAPTURE + TRUST SNAPSHOTS (Session 2 of Onboarding Epic)
-- =============================================================================
--
-- Session 1 landed the invite-gated document pipeline. Session 2 wires the
-- MCV ID capture UI that produces the step-up signals the trust engine
-- consumes (see @mcv/identity-sdk trust-engine.ts).
--
-- Tables in this migration:
--
--   identity_captures
--       ↓ (many rows per user — passkey + selfie so far;
--          iris / ePassport / Interac Verified as future capture kinds)
--   user_trust_snapshots
--       ↓ (denormalized read-path: most-recent computed trust score +
--          civic clearance, refreshed on every capture mutation)
--
-- Plus a private storage bucket `identity-captures` for selfie frames.
--
-- Authoritative state split (mirrors the onboarding migration doctrine):
--   · identity_captures      = source of truth for each attestation
--   · user_trust_snapshots   = read-side materialized score (can always
--                              be rebuilt by re-walking identity_captures)
--   · event_log (via events-sdk) = audit trail of every capture mutation
--
-- Events flow through event_log via @mcv/events-sdk on every capture.
-- No RLS on these tables — same pattern as the Session 1 onboarding tables
-- (Foundation migration doctrine: service-role API handlers + Clerk auth
-- gate in _handlers/ is the defense layer; RLS is duplicative under that
-- model and forces the service-role key into client bundles).
-- =============================================================================


-- =============================================================================
-- 1. IDENTITY CAPTURES — one row per user × capture kind
-- =============================================================================
-- Each row represents a single identity-attestation action a user has
-- completed. The `signal_payload` column serializes to @mcv/identity-sdk's
-- StepUpSignal | AmbientSignal | CivicSignal shape so the handler can
-- reconstruct a TelemetrySignalBatch without re-modeling the data.
--
-- UNIQUE (user_id, capture_kind) enforces "one active capture per kind"
-- semantics — re-enrolling a passkey overwrites the prior credential. For
-- multi-credential passkey support (e.g. user wants to register both a
-- YubiKey and a phone), EXPAND below flags how to evolve.
--
-- EXPAND: multi-credential passkey — relax UNIQUE to
--   UNIQUE (user_id, capture_kind, external_credential_id) WHERE revoked_at IS NULL
-- so a user can register multiple authenticators of the same kind; the
-- trust engine already aggregates multiple passkey signals additively.
-- EXPAND: iris capture kind — add 'iris' to the CHECK constraint when
-- MediaPipe iris integration lands (stored selfie frame is already an iris
-- input source, but the signal_payload shape differs from face-landmark).
-- EXPAND: civic capture kinds — add 'interac-verified', 'epassport-chip',
-- 'mobile-drv-lic', 'provincial-oidc', 'login-gov' — each with its own
-- federated-identity exchange flow. The signal_payload already accepts the
-- CivicSignal shape so no schema change needed beyond the CHECK.

CREATE TABLE IF NOT EXISTS identity_captures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,                          -- clerk user_id
  capture_kind text NOT NULL CHECK (capture_kind IN (
    'passkey',         -- WebAuthn navigator.credentials.create() → StepUpSignal { kind: 'passkey' }
    'face-landmark',   -- selfie frame → StepUpSignal { kind: 'face-landmark' }
    'iris',            -- EXPAND: MediaPipe iris landmarker
    'interac-verified',
    'epassport-chip',
    'mobile-drv-lic',
    'provincial-oidc',
    'login-gov'
  )),
  status text NOT NULL DEFAULT 'enrolled' CHECK (status IN (
    'enrolled',        -- capture succeeded
    'verified',        -- re-asserted after enrollment (passkey assertion, re-selfie, etc.)
    'failed',          -- attempt completed but did not pass validation
    'revoked'          -- user or admin removed this attestation
  )),
  -- Passkey-specific: base64url credential id + COSE-encoded public key.
  -- For selfie captures both are null; for other kinds EXPAND appropriately.
  external_credential_id text,
  credential_public_key text,                     -- COSE pubkey (base64url); EXPAND: use for server-side WebAuthn verification
  -- Selfie-specific: Supabase Storage path under `identity-captures/` bucket.
  storage_path text,
  -- Serialized StepUpSignal | AmbientSignal | CivicSignal — exact JSON shape
  -- matches the identity-sdk types so handler can JSON.parse straight into
  -- a TelemetrySignalBatch without mapping layer.
  signal_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Free-form additional context (device ID, user-agent snapshot, RP info, etc.)
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  captured_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  revoked_by text,
  revoked_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, capture_kind)                  -- one active capture per kind; re-enroll overwrites
);

CREATE INDEX IF NOT EXISTS idx_identity_captures_user_status
  ON identity_captures(user_id, status) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_identity_captures_kind
  ON identity_captures(capture_kind, captured_at DESC) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_identity_captures_credential
  ON identity_captures(external_credential_id) WHERE external_credential_id IS NOT NULL;

COMMENT ON TABLE identity_captures IS
  'Source of truth for every identity attestation a user has completed (passkey, selfie, federated civic proofs, etc.). Each row carries a StepUpSignal/AmbientSignal/CivicSignal in signal_payload that the trust engine consumes. One active row per (user_id, capture_kind); re-enrolling overwrites.';

COMMENT ON COLUMN identity_captures.signal_payload IS
  'Serialized StepUpSignal | AmbientSignal | CivicSignal shape from @mcv/identity-sdk. Handler reconstructs a TelemetrySignalBatch by aggregating these across a user''s active captures.';


-- =============================================================================
-- 2. USER TRUST SNAPSHOTS — read-side cache of computed trust score
-- =============================================================================
-- Refreshed on every identity_captures mutation. The raw captures remain the
-- source of truth; this table is a materialized view so UI surfaces (status
-- card, middleware gates, Clerk JWT refresh) can read the score in one query
-- without re-running the trust engine.
--
-- One row per user. If a row is missing, the UI treats the user as baseline
-- (score 50, civic clearance 'basic') — the trust engine's own default.
--
-- EXPAND: historical tracking — a separate `user_trust_history` table with
-- an append-only log of every snapshot + the triggering capture id. Today
-- we overwrite; for regulatory audit beyond event_log's retention, history
-- will become load-bearing.
-- EXPAND: Clerk session JWT sync — a cron or post-refresh hook that pushes
-- the latest snapshot into Clerk's publicMetadata so middleware can read
-- score from the JWT without hitting Postgres on every request.

CREATE TABLE IF NOT EXISTS user_trust_snapshots (
  user_id text PRIMARY KEY,                       -- clerk user_id
  trust_score int NOT NULL CHECK (trust_score BETWEEN 0 AND 100),
  trust_band text NOT NULL CHECK (trust_band IN (
    'compromised', 'baseline', 'verified', 'elevated', 'sovereign'
  )),
  civic_clearance text NOT NULL CHECK (civic_clearance IN (
    'basic', 'verified', 'sovereign'
  )),
  contributions jsonb NOT NULL DEFAULT '[]'::jsonb,   -- full SignalContribution[] from compute result
  active_fractures jsonb NOT NULL DEFAULT '[]'::jsonb,  -- IdentityFracture[] currently firing
  computed_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_trust_snapshots_band
  ON user_trust_snapshots(trust_band);
CREATE INDEX IF NOT EXISTS idx_user_trust_snapshots_clearance
  ON user_trust_snapshots(civic_clearance);

COMMENT ON TABLE user_trust_snapshots IS
  'Materialized read cache of the most recent computeTrustScore() result for each user. Rebuilt on every identity_captures mutation. Source of truth is identity_captures; this table is derived and can always be regenerated.';


-- =============================================================================
-- 3. STORAGE BUCKET — private `identity-captures` for selfies + future frames
-- =============================================================================
-- Service-role-only write and read (no RLS policies, no public URL). The API
-- handler signs short-lived URLs via createSignedUrl() when a selfie needs
-- to be displayed back to the user (status card preview) or to an admin
-- (verification queue — Session 4).
--
-- EXPAND: dedicated bucket for iris frames if resolution / retention policy
-- needs to diverge from selfie storage. For now, shared bucket with
-- `${user_id}/face-landmark.jpg` and `${user_id}/iris.jpg` path convention.
-- EXPAND: TTL / lifecycle — Supabase Storage doesn't natively enforce TTL;
-- a cron should prune selfies older than the retention cap set in the
-- privacy policy (currently "as long as access is active + 7 years").

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'identity-captures',
  'identity-captures',
  false,                                          -- PRIVATE — always reach via signed URL
  5 * 1024 * 1024,                                -- 5 MB cap per file (selfies are ~150-400 KB)
  ARRAY['image/jpeg', 'image/png', 'image/webp']  -- restrict to still frames until iris video lands
)
ON CONFLICT (id) DO NOTHING;

COMMENT ON SCHEMA storage IS
  'Supabase Storage — MCV uses `identity-captures` bucket for selfie frames + future iris/liveness captures. Private bucket, service-role-only access, signed URLs for display.';


-- =============================================================================
-- 4. NOTES FOR EXPANSION (grep // EXPAND: across this file for inline flags)
-- =============================================================================
-- This migration is the last-mile MCV ID scaffolding for the demo-gate
-- pipeline. The full trust ecosystem (ambient signals from
-- Play Integrity / reCAPTCHA / FLP / activity recognition, duress biometric,
-- acoustic diarization, full civic federation) lives downstream. When that
-- expansion happens:
--   · The identity_captures CHECK constraint gains the new kinds
--     (the @mcv/identity-sdk type union is the authoritative source)
--   · Handler logic expands to refresh the trust snapshot on each new
--     signal family's capture flow
--   · user_trust_snapshots grows no new columns — contributions jsonb
--     already accommodates the full SignalContribution[] breakdown
--
-- The invariant this migration establishes:
--   identity_captures = all attestations; user_trust_snapshots = derived.
--   Never write to user_trust_snapshots without re-walking identity_captures
--   through the identity-sdk's computeTrustScore() so the snapshot is always
--   reproducible by re-running the engine.
-- =============================================================================
