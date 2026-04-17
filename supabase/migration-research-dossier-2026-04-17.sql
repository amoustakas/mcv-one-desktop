-- supabase/migration-research-dossier-2026-04-17.sql
-- Per-entity research dossier primitive — agentic or human-authored intel
-- attached to any entity type (prospect / venture / round / contact / deal / org).
-- entity_id is text to handle both uuid-keyed entities (stored as uuid.toString())
-- and text-keyed entities (ventures, capital_legal_entity).
--
-- findings = jsonb array of {claim, evidence, confidence}
-- sources = jsonb array of {url, accessed_at, author, type}
-- stale_at = when dossier should be refreshed (null = no auto-stale)

CREATE TABLE IF NOT EXISTS research_dossier (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('prospect','venture','round','contact','deal','organization')),
  entity_id text NOT NULL,
  title text NOT NULL,
  summary text,
  findings jsonb NOT NULL DEFAULT '[]'::jsonb,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  confidence text NOT NULL DEFAULT 'medium' CHECK (confidence IN ('high','medium','low','speculative')),
  authored_by_agent_id uuid REFERENCES agent_persona(id),
  authored_by_user_id text,
  stale_at timestamptz,
  version integer NOT NULL DEFAULT 1,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_research_dossier_entity ON research_dossier(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_research_dossier_authored_by_agent ON research_dossier(authored_by_agent_id);
CREATE INDEX IF NOT EXISTS idx_research_dossier_stale ON research_dossier(stale_at) WHERE stale_at IS NOT NULL;

COMMENT ON TABLE research_dossier IS 'Per-entity research + intel. Agentic or human-authored. stale_at triggers refresh prompts. Versioned per entity.';
COMMENT ON COLUMN research_dossier.findings IS 'jsonb array of {claim: text, evidence: text, confidence: text}';
COMMENT ON COLUMN research_dossier.sources IS 'jsonb array of {url: text, accessed_at: iso8601, author?: text, type?: text}';
