-- supabase/migration-persona-achievement-2026-04-17.sql
-- Named achievements earned by personas. One row per (agent_id, achievement_key).
-- Paired with a persona_xp_event row (event_kind='achievement') for the XP grant.

CREATE TABLE IF NOT EXISTS persona_achievement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES agent_persona(id) ON DELETE CASCADE,
  achievement_key text NOT NULL,
  achievement_label text NOT NULL,
  tier text NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze','silver','gold','diamond','mythic')),
  xp_granted integer NOT NULL DEFAULT 0,
  earned_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agent_id, achievement_key)
);

CREATE INDEX IF NOT EXISTS idx_persona_achievement_agent ON persona_achievement(agent_id);
CREATE INDEX IF NOT EXISTS idx_persona_achievement_tier ON persona_achievement(tier);

COMMENT ON TABLE persona_achievement IS 'Named achievement unlocks per persona. UNIQUE(agent_id, achievement_key) — idempotent. Tier: bronze→silver→gold→diamond→mythic per Diablo 2 HC Ladder philosophy.';
