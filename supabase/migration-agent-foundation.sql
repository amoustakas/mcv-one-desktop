-- supabase/migration-agent-foundation.sql
-- Agent Roster Foundation — the team that runs the ecosystem beside Tony.
-- Plan: C:\Users\moust\.claude\plans\agent-roster-foundation.md
-- Philosophy: feedback_feels_real.md + feedback_top_agent_partnership.md
-- Phase 1 of ecosystem build sequence (agents → onboarding → journeys).
--
-- All additive. Zero-downtime.

-- ─── 1. agent_persona — the roster itself ──────────────────────────────

CREATE TABLE IF NOT EXISTS agent_persona (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handle TEXT UNIQUE NOT NULL,                  -- '@atlas', '@warren'
  full_name TEXT NOT NULL,
  title TEXT NOT NULL,
  department TEXT NOT NULL CHECK (department IN (
    'principal', 'chief_of_staff',
    'finance_capital', 'legal_risk', 'legal',
    'ir_comms', 'growth_marketing', 'brand_content',
    'engineering_product', 'ops_infra', 'strategy_research'
  )),
  seniority TEXT NOT NULL CHECK (seniority IN (
    'principal', 'chief_of_staff', 'chief', 'senior', 'associate', 'contributor'
  )),
  scope_kind TEXT NOT NULL DEFAULT 'global' CHECK (scope_kind IN (
    'global', 'venture', 'project', 'user'
  )),
  scope_value TEXT,                             -- venture_id when scope_kind='venture', etc.
  reports_to_agent_id UUID REFERENCES agent_persona(id) ON DELETE SET NULL,
  interaction_mode TEXT NOT NULL DEFAULT 'on_demand' CHECK (interaction_mode IN (
    'always_on', 'on_demand', 'scheduled', 'event_driven'
  )),
  persona_bio TEXT NOT NULL,                    -- 2-3 sentence first-person intro
  voice_profile JSONB NOT NULL DEFAULT '{}',    -- {tone, pace, formality, hedges, humor, signature_phrases}
  system_prompt TEXT NOT NULL,                  -- full rendered system prompt for chat routing
  kit_allowlist TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  tool_allowlist TEXT[],                        -- NULL = all tools from allowed kits
  data_scopes JSONB NOT NULL DEFAULT '{}',      -- {ventures:[], content_types:[], permissions:[]}
  workflows JSONB NOT NULL DEFAULT '[]',        -- [{name, schedule, handler, inputs_schema}]
  avatar_url TEXT,                              -- Vercel Blob or Gemini-generated
  accent_color TEXT,                            -- chat-UI accent (hex)
  active BOOLEAN NOT NULL DEFAULT true,
  hired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_persona_department ON agent_persona (department) WHERE active;
CREATE INDEX IF NOT EXISTS idx_agent_persona_seniority ON agent_persona (seniority) WHERE active;
CREATE INDEX IF NOT EXISTS idx_agent_persona_scope ON agent_persona (scope_kind, scope_value);
CREATE INDEX IF NOT EXISTS idx_agent_persona_reports_to ON agent_persona (reports_to_agent_id) WHERE reports_to_agent_id IS NOT NULL;

-- ─── 2. agent_activity_log — every action an agent takes ──────────────

CREATE TABLE IF NOT EXISTS agent_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agent_persona(id) ON DELETE CASCADE,
  actor_user_id TEXT,                           -- NULL for scheduled/event-driven
  session_id UUID,                              -- chat session or workflow run
  action_kind TEXT NOT NULL CHECK (action_kind IN (
    'chat_turn', 'tool_call', 'workflow_run', 'handoff', 'system'
  )),
  tool_name TEXT,
  input JSONB NOT NULL DEFAULT '{}',
  output JSONB NOT NULL DEFAULT '{}',
  duration_ms INTEGER,
  cost_usd NUMERIC(20, 6),                      -- LLM token cost accounting
  venture_id TEXT,
  correlation_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_activity_agent ON agent_activity_log (agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_activity_user ON agent_activity_log (actor_user_id, created_at DESC) WHERE actor_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agent_activity_venture ON agent_activity_log (venture_id, created_at DESC) WHERE venture_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agent_activity_correlation ON agent_activity_log (correlation_id) WHERE correlation_id IS NOT NULL;

-- ─── 3. agent_conversation — chat threads scoped to an agent ──────────

CREATE TABLE IF NOT EXISTS agent_conversation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agent_persona(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  venture_id TEXT,
  title TEXT,
  last_message_at TIMESTAMPTZ,
  message_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_conv_user ON agent_conversation (user_id, last_message_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_agent_conv_agent ON agent_conversation (agent_id, last_message_at DESC NULLS LAST);

-- ─── 4. agent_workflow_run — scheduled + event-driven runs ────────────

CREATE TABLE IF NOT EXISTS agent_workflow_run (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agent_persona(id) ON DELETE CASCADE,
  workflow_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN (
    'scheduled', 'running', 'succeeded', 'failed', 'cancelled'
  )),
  scheduled_for TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  inputs JSONB NOT NULL DEFAULT '{}',
  outputs JSONB NOT NULL DEFAULT '{}',
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_workflow_agent ON agent_workflow_run (agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_workflow_status ON agent_workflow_run (status, scheduled_for) WHERE status IN ('scheduled','running');

-- ─── updated_at trigger for agent_persona + agent_conversation ────────

CREATE OR REPLACE FUNCTION agent_touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS agent_persona_touch_updated ON agent_persona;
CREATE TRIGGER agent_persona_touch_updated
  BEFORE UPDATE ON agent_persona
  FOR EACH ROW EXECUTE FUNCTION agent_touch_updated_at();

DROP TRIGGER IF EXISTS agent_conversation_touch_updated ON agent_conversation;
CREATE TRIGGER agent_conversation_touch_updated
  BEFORE UPDATE ON agent_conversation
  FOR EACH ROW EXECUTE FUNCTION agent_touch_updated_at();

-- ─── RLS ──────────────────────────────────────────────────────────────

ALTER TABLE agent_persona        ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_activity_log   ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_conversation   ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_workflow_run   ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['agent_persona','agent_activity_log','agent_conversation','agent_workflow_run'])
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I_service_all ON %I;
       CREATE POLICY %I_service_all ON %I FOR ALL TO service_role USING (true) WITH CHECK (true);',
      t, t, t, t
    );
  END LOOP;
END $$;
