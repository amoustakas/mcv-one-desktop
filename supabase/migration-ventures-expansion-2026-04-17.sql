-- supabase/migration-ventures-expansion-2026-04-17.sql
-- Extends ventures with is_raising flag + seeds new MCV.* raising ventures.
-- SCHEMA: funding_stage column exists (keep it). owner_entity_id is FK to capital_legal_entity.id (text).
-- We ADD is_raising only; stage/parent concepts already covered by funding_stage + owner_entity_id.

ALTER TABLE ventures ADD COLUMN IF NOT EXISTS is_raising boolean NOT NULL DEFAULT false;

-- Flag already-seeded raising ventures
UPDATE ventures SET is_raising = true
WHERE id IN ('futurestate','betedge','mcvgg','warforge');

-- Seed new raising ventures under EdgeIQ Holdings' operating umbrella.
-- MCV.INC rides under the sovereign crown (mcv-inc-crown) as the holding-company face.
INSERT INTO ventures (id, name, is_raising, funding_stage, owner_entity_id, status, type, category) VALUES
  ('mcv-tech', 'MCV.Tech', true,  'pre-seed', 'edgeiq-holdings', 'active', 'platform', 'mcv-brand'),
  ('mcv-dev',  'MCV.DEV',  true,  'pre-seed', 'edgeiq-holdings', 'active', 'platform', 'mcv-brand'),
  ('mcv-cx',   'MCV.CX',   true,  'pre-seed', 'edgeiq-holdings', 'active', 'platform', 'mcv-brand'),
  ('mcv-inc',  'MCV.INC',  false, 'mature',   'mcv-inc-crown',   'active', 'holding',  'mcv-brand')
ON CONFLICT (id) DO UPDATE SET
  is_raising = EXCLUDED.is_raising,
  funding_stage = EXCLUDED.funding_stage,
  owner_entity_id = EXCLUDED.owner_entity_id;

COMMENT ON COLUMN ventures.is_raising IS 'TRUE when the venture has an active capital-raise posture.';
