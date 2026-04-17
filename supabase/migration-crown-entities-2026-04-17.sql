-- supabase/migration-crown-entities-2026-04-17.sql
-- Elevates capital_legal_entity with dual-parent crown support.
-- Seeds MCV Inc. (mcv.inc) and MCV LTD (mcv.ltd) as sovereign 6D crowns.
-- Wires existing EdgeIQ Holdings under MCV Inc.
--
-- SCHEMA NOTE: capital_legal_entity.id is text (not uuid). label column (not name).
-- parent_entity_id (text) already exists. We only ADD is_crown here.

ALTER TABLE capital_legal_entity
  ADD COLUMN IF NOT EXISTS is_crown boolean NOT NULL DEFAULT false;

-- Seed MCV Inc. (primary crown — US-DE C-Corp)
INSERT INTO capital_legal_entity (id, label, entity_type, jurisdiction, is_crown, active)
SELECT 'mcv-inc-crown', 'MCV Inc.', 'corporation', 'US-DE', true, true
WHERE NOT EXISTS (SELECT 1 FROM capital_legal_entity WHERE id = 'mcv-inc-crown');

-- Seed MCV LTD (secondary crown — UK/international)
INSERT INTO capital_legal_entity (id, label, entity_type, jurisdiction, is_crown, active)
SELECT 'mcv-ltd-crown', 'MCV LTD', 'corporation', 'UK', true, true
WHERE NOT EXISTS (SELECT 1 FROM capital_legal_entity WHERE id = 'mcv-ltd-crown');

-- Wire existing EdgeIQ Holdings under MCV Inc. via the existing parent_entity_id column.
UPDATE capital_legal_entity
SET parent_entity_id = 'mcv-inc-crown'
WHERE id = 'edgeiq-holdings';

COMMENT ON COLUMN capital_legal_entity.is_crown IS 'Sovereign 6D entities (MCV Inc. / MCV LTD). Never for sale. Succession-only.';
