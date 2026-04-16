-- ============================================================================
-- Phase 2 — Prospect Foundation
-- Plan: C:\Users\moust\.claude\plans\nifty-launching-turtle.md
-- Source spec: C:\Users\moust\.claude\plans\phase-2-onboarding-wizard.md
--
-- Introduces the external-entry layer on top of Phase 1 Agent Roster
-- (agent_persona table). Adds 4 tables that model a prospect's journey
-- from first touch through credentials issuance:
--
--   prospect_capture       — lightweight pre-journey lead capture
--   prospect_profile       — the central prospect record
--   prospect_journey       — a journey-in-flight bound to a track + agent
--   prospect_journey_step  — per-step completion log
--
-- Track definitions + step registry live in @mcv/onboarding-sdk (TS),
-- NOT in the DB. Tracks stay version-controlled + type-safe.
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1. prospect_capture — pre-journey lead
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prospect_capture (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL,
  name          TEXT,
  venture_id    TEXT,
  channel       TEXT NOT NULL DEFAULT 'direct',
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (email, venture_id)
);

CREATE INDEX IF NOT EXISTS idx_prospect_capture_email   ON prospect_capture (email);
CREATE INDEX IF NOT EXISTS idx_prospect_capture_venture ON prospect_capture (venture_id) WHERE venture_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prospect_capture_created ON prospect_capture (created_at DESC);

-- ────────────────────────────────────────────────────────────────────────────
-- 2. prospect_profile — the central record
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prospect_profile (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email             TEXT NOT NULL UNIQUE,
  full_name         TEXT,
  country           TEXT,
  role_hint         TEXT,            -- 'investor' | 'partner' | 'creator' | 'team' | 'ally'
  source_venture_id TEXT,
  source_channel    TEXT NOT NULL DEFAULT 'direct',
  referrer_user_id  TEXT,
  metadata          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prospect_profile_email    ON prospect_profile (email);
CREATE INDEX IF NOT EXISTS idx_prospect_profile_role     ON prospect_profile (role_hint) WHERE role_hint IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prospect_profile_venture  ON prospect_profile (source_venture_id) WHERE source_venture_id IS NOT NULL;

CREATE OR REPLACE FUNCTION update_prospect_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_prospect_profile_timestamp ON prospect_profile;
CREATE TRIGGER tr_prospect_profile_timestamp
  BEFORE UPDATE ON prospect_profile
  FOR EACH ROW EXECUTE FUNCTION update_prospect_profile_timestamp();

-- ────────────────────────────────────────────────────────────────────────────
-- 3. prospect_journey — journey-in-flight
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prospect_journey (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id         UUID NOT NULL REFERENCES prospect_profile(id) ON DELETE CASCADE,
  track               TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'paused', 'completed', 'abandoned')),
  current_step_index  INT NOT NULL DEFAULT 0,
  steps               JSONB NOT NULL DEFAULT '[]'::jsonb,  -- materialized step-name array
  agent_id            UUID REFERENCES agent_persona(id) ON DELETE SET NULL,
  started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at        TIMESTAMPTZ,
  metadata            JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_prospect_journey_prospect ON prospect_journey (prospect_id);
CREATE INDEX IF NOT EXISTS idx_prospect_journey_track    ON prospect_journey (track);
CREATE INDEX IF NOT EXISTS idx_prospect_journey_status   ON prospect_journey (status);
CREATE INDEX IF NOT EXISTS idx_prospect_journey_agent    ON prospect_journey (agent_id) WHERE agent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_prospect_journey_activity ON prospect_journey (last_activity_at DESC);

-- ────────────────────────────────────────────────────────────────────────────
-- 4. prospect_journey_step — per-step completion log
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prospect_journey_step (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id   UUID NOT NULL REFERENCES prospect_journey(id) ON DELETE CASCADE,
  step_name    TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped', 'failed')),
  started_at   TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  inputs       JSONB NOT NULL DEFAULT '{}'::jsonb,   -- what the user provided
  outputs      JSONB NOT NULL DEFAULT '{}'::jsonb,   -- what the step produced (VC id, portal url, etc.)
  agent_id     UUID REFERENCES agent_persona(id) ON DELETE SET NULL,
  metadata     JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_prospect_step_journey ON prospect_journey_step (journey_id);
CREATE INDEX IF NOT EXISTS idx_prospect_step_status  ON prospect_journey_step (status);
CREATE INDEX IF NOT EXISTS idx_prospect_step_name    ON prospect_journey_step (step_name);

-- ────────────────────────────────────────────────────────────────────────────
-- RLS
-- Service role (API handler) bypasses RLS and performs all writes.
-- Authenticated users can read their own profile + journey (by email match).
-- Public (anon) can insert into prospect_capture from the wizard app.
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE prospect_capture      ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_profile      ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_journey      ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_journey_step ENABLE ROW LEVEL SECURITY;

-- Anon insert into prospect_capture (wizard lead-capture endpoint)
DROP POLICY IF EXISTS "anon insert capture"  ON prospect_capture;
CREATE POLICY "anon insert capture" ON prospect_capture
  FOR INSERT TO anon
  WITH CHECK (true);

-- Prospects read their own profile (JWT email match)
DROP POLICY IF EXISTS "self read profile" ON prospect_profile;
CREATE POLICY "self read profile" ON prospect_profile
  FOR SELECT TO authenticated
  USING (email = (auth.jwt() ->> 'email'));

-- Prospects read their own journeys
DROP POLICY IF EXISTS "self read journey" ON prospect_journey;
CREATE POLICY "self read journey" ON prospect_journey
  FOR SELECT TO authenticated
  USING (prospect_id IN (
    SELECT id FROM prospect_profile WHERE email = (auth.jwt() ->> 'email')
  ));

-- Prospects read their own journey steps
DROP POLICY IF EXISTS "self read journey step" ON prospect_journey_step;
CREATE POLICY "self read journey step" ON prospect_journey_step
  FOR SELECT TO authenticated
  USING (journey_id IN (
    SELECT pj.id FROM prospect_journey pj
    JOIN prospect_profile pp ON pp.id = pj.prospect_id
    WHERE pp.email = (auth.jwt() ->> 'email')
  ));

-- ────────────────────────────────────────────────────────────────────────────
-- Grants (service role has implicit full access; explicit grants for clarity)
-- ────────────────────────────────────────────────────────────────────────────
GRANT INSERT ON prospect_capture TO anon;
GRANT SELECT ON prospect_profile, prospect_journey, prospect_journey_step TO authenticated;
