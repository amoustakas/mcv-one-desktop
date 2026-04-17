-- supabase/migration-capital-round-ventures-2026-04-17.sql
-- Supports rounds that span multiple ventures (e.g., MCV.Tech + MCV.DEV shared cap).
-- The legacy capital_rounds.venture_id stays as the primary/denormalized pointer.

CREATE TABLE IF NOT EXISTS capital_round_ventures (
  round_id uuid NOT NULL REFERENCES capital_rounds(id) ON DELETE CASCADE,
  venture_id text NOT NULL REFERENCES ventures(id) ON DELETE RESTRICT,
  allocation_pct numeric NOT NULL CHECK (allocation_pct >= 0 AND allocation_pct <= 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (round_id, venture_id)
);

CREATE INDEX IF NOT EXISTS idx_crv_venture ON capital_round_ventures(venture_id);

COMMENT ON TABLE capital_round_ventures IS 'Multi-venture round mapping with split percentage. Primary venture remains on capital_rounds.venture_id for fast lookups.';

-- Back-fill: every existing capital_rounds row gets a single-venture entry at 100%.
-- venture_id is NOT NULL on capital_rounds but the guard stays for safety.
INSERT INTO capital_round_ventures (round_id, venture_id, allocation_pct)
SELECT id, venture_id, 100 FROM capital_rounds
WHERE venture_id IS NOT NULL
ON CONFLICT DO NOTHING;
