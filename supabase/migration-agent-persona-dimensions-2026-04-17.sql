-- supabase/migration-agent-persona-dimensions-2026-04-17.sql
-- Adds dimensional hierarchy + sovereign crown affiliation + gamification XP
-- to agent_persona. Existing 13 seeded rows get backfilled per seniority.
--
-- 6D = sovereign (MCV.INC/LTD crown holders) · never filled except by Tony + succession
-- 5D = executive (chief/chief_of_staff tier)
-- 4D = operator (senior tier)
-- 3D/2D/1D = reserved for future specialist/tactical/entry tiers

ALTER TABLE agent_persona
  ADD COLUMN IF NOT EXISTS dimension text CHECK (dimension IN ('6D','5D','4D','3D','2D','1D')),
  ADD COLUMN IF NOT EXISTS crown_affiliation text REFERENCES capital_legal_entity(id),
  ADD COLUMN IF NOT EXISTS xp integer NOT NULL DEFAULT 0;

-- Backfill dimensions from existing seniority values
UPDATE agent_persona SET dimension = '5D', crown_affiliation = 'mcv-inc-crown'
WHERE seniority IN ('chief','chief_of_staff') AND dimension IS NULL;

UPDATE agent_persona SET dimension = '4D', crown_affiliation = 'mcv-inc-crown'
WHERE seniority = 'senior' AND dimension IS NULL;

CREATE INDEX IF NOT EXISTS idx_agent_persona_dimension ON agent_persona(dimension);
CREATE INDEX IF NOT EXISTS idx_agent_persona_crown ON agent_persona(crown_affiliation);

COMMENT ON COLUMN agent_persona.dimension IS '6D sovereign / 5D executive / 4D operator / 3D tactical / 2D field / 1D entry per MCV.INC crown philosophy';
COMMENT ON COLUMN agent_persona.crown_affiliation IS 'FK to capital_legal_entity — which sovereign crown this agent reports to (mcv-inc-crown or mcv-ltd-crown)';
COMMENT ON COLUMN agent_persona.xp IS 'Gamification XP per Diablo 2 HC Ladder philosophy — accrues as personas ship work';
