-- supabase/migration-persona-xp-event-2026-04-17.sql
-- Immutable XP ledger for personas. Every XP accrual is one row here.
-- agent_persona.xp is a denormalized sum (updated by the accrual trigger in T9.3).
-- This table is APPEND-ONLY; adjustments are modeled as compensating rows.
--
-- event_kind taxonomy:
--   activity           — generic agent_activity_log entry accrued XP
--   tool_call          — tool use (heaviest per-event weight)
--   workflow_run       — full workflow execution
--   chat_turn          — conversational turn
--   handoff            — handoff to another persona
--   milestone          — ship/close event (soft_commit_created, payment_received, distribution_completed)
--   achievement        — one-time achievement unlocked (paired with persona_achievement row)
--   manual_grant       — controller-issued adjustment (audit trail via metadata.actor_id)

CREATE TABLE IF NOT EXISTS persona_xp_event (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES agent_persona(id) ON DELETE CASCADE,
  event_kind text NOT NULL CHECK (event_kind IN (
    'activity', 'tool_call', 'workflow_run', 'chat_turn', 'handoff',
    'milestone', 'achievement', 'manual_grant'
  )),
  xp integer NOT NULL,  -- can be negative for compensating adjustments
  source_type text,     -- e.g., 'agent_activity_log', 'capital_commitments', 'persona_achievement'
  source_id text,       -- id of the source row (text to handle uuid + text-keyed sources)
  description text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_persona_xp_event_agent_time
  ON persona_xp_event(agent_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_persona_xp_event_source
  ON persona_xp_event(source_type, source_id)
  WHERE source_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_persona_xp_event_kind
  ON persona_xp_event(event_kind);

COMMENT ON TABLE persona_xp_event IS 'Immutable XP ledger. agent_persona.xp is a denormalized sum maintained by the T9.3 accrual trigger. Adjustments via compensating rows — never UPDATE or DELETE.';
COMMENT ON COLUMN persona_xp_event.xp IS 'XP delta. Positive on accrual, negative on compensating adjustments. Sum across rows = agent_persona.xp.';
