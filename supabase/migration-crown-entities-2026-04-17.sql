-- supabase/migration-crown-entities-2026-04-17.sql
-- Elevates capital_legal_entity with dual-parent crown support.
-- Seeds MCV Inc. (mcv.inc) and MCV LTD (mcv.ltd) as sovereign 6D crowns.
-- Wires existing EdgeIQ Holdings as a child of MCV Inc.

ALTER TABLE capital_legal_entity
  ADD COLUMN IF NOT EXISTS is_crown boolean NOT NULL DEFAULT false;

ALTER TABLE capital_legal_entity
  ADD COLUMN IF NOT EXISTS parent_crown_id uuid REFERENCES capital_legal_entity(id);

-- Seed MCV Inc. (primary crown — US-DE C-Corp)
INSERT INTO capital_legal_entity (id, name, entity_type, jurisdiction, is_crown)
VALUES (gen_random_uuid(), 'MCV Inc.', 'C-Corp', 'US-DE', true)
ON CONFLICT DO NOTHING;

-- Seed MCV LTD (secondary crown — UK/international)
INSERT INTO capital_legal_entity (id, name, entity_type, jurisdiction, is_crown)
VALUES (gen_random_uuid(), 'MCV LTD', 'Limited Co.', 'UK', true)
ON CONFLICT DO NOTHING;

-- Wire EdgeIQ Holdings under MCV Inc. as the operating conglomerate
UPDATE capital_legal_entity
SET parent_crown_id = (SELECT id FROM capital_legal_entity WHERE name = 'MCV Inc.' AND is_crown = true LIMIT 1)
WHERE name = 'EdgeIQ Holdings';

COMMENT ON COLUMN capital_legal_entity.is_crown IS 'Sovereign 6D entities (MCV Inc. / MCV LTD). Never for sale.';
COMMENT ON COLUMN capital_legal_entity.parent_crown_id IS 'Links operating entities up to their crown parent.';
