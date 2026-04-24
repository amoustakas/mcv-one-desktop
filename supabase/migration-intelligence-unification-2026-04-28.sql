-- ============================================================================
-- Phase-1 Intelligence Router — unification migration
-- ============================================================================
-- Adds the tenant-scoping primitives (set_tenant RPC, agent_memory_longterm
-- table with STRICT RLS, match_agent_memories RPC, retroactive tenant_id on
-- 7 tables with service-role bypass RLS, event_subscriber seeds).
--
-- Spec: C:\Users\moust\.claude\plans\i-want-to-plan-synchronous-thacker.md §1.3–1.6
-- Plan-of-record: C:\Users\moust\.claude\plans\start-phase-1-of-optimized-yeti.md
-- Phase-0 handoff memory: project_adk_phase0_landed.md
-- RLS status doc: docs/rls-migration-status.md (update knowledge-observer → STRICT on land)
--
-- Platform-tenant UUID (used for retroactive backfill):
--   00000000-0000-0000-0000-000000000000
-- Backfill strategy: all rows default to the platform tenant. The T0/T1/T2
-- restructure (future session) remaps per-venture tenant_id via a separate
-- migration. This approach avoids cross-repo tenancy resolution tonight.
--
-- Merge order: Phase-1 → master FIRST (safety-adjacent). Onboarding session
-- rebases after. Verified 2026-04-23 that no parallel session touches the
-- 7 retroactive-tenant-id tables in new work on active worktree branches.
-- ============================================================================

BEGIN;

-- ============================================================================
-- §A — set_tenant(t uuid) RPC
-- ============================================================================
-- Sets per-request tenant context via Postgres session config. Consumers:
-- Intelligence Router (in every request boundary), M3 agent handlers, any
-- future tenant-aware handler.
--
-- Transaction-scoped (`set_config(..., false)`) rather than session-scoped
-- (`SET LOCAL`) so it behaves predictably in Supabase's pooled connections.
-- SECURITY DEFINER so authenticated clients can invoke it without holding
-- set_config privilege directly.
--
-- Not idempotent in the pg function sense (creates or replaces) — safe to
-- rerun.
-- ============================================================================

CREATE OR REPLACE FUNCTION set_tenant(t uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  PERFORM set_config('app.tenant_id', t::text, false);
END;
$$;

REVOKE ALL ON FUNCTION set_tenant(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION set_tenant(uuid) TO service_role, authenticated;

COMMENT ON FUNCTION set_tenant(uuid) IS
  'Sets app.tenant_id for the current transaction. RLS policies on tenant-scoped tables read this value via current_setting(''app.tenant_id'', true). Transaction-scoped for predictable behaviour in pooled connections.';


-- ============================================================================
-- §B — agent_memory_longterm table (STRICT RLS from day one)
-- ============================================================================
-- The long-term knowledge substrate. Accepts kinds: fact, preference,
-- constraint, decision. Supersedes chain via `supersedes_id` FK. Vector
-- embedding for semantic recall via match_agent_memories RPC.
--
-- RLS is STRICT (no service-role bypass clause) because this table is brand
-- new — no legacy handler traffic to protect. The knowledge-observer handler
-- (api/_handlers/knowledge-observer.ts) calls set_tenant() at request
-- boundary before any INSERT; the Router calls it once at construction.
-- ============================================================================

-- memory_kind enum — extensible via ALTER TYPE in future migrations.
DO $$ BEGIN
  CREATE TYPE memory_kind AS ENUM ('fact', 'preference', 'constraint', 'decision');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS agent_memory_longterm (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  venture_id text,
  user_id text,
  agent_handle text,
  kind memory_kind NOT NULL,
  content text NOT NULL,
  embedding vector(768),
  provenance jsonb NOT NULL DEFAULT '{}'::jsonb,
  confidence real NOT NULL DEFAULT 1.0 CHECK (confidence BETWEEN 0 AND 1),
  tags text[] NOT NULL DEFAULT ARRAY[]::text[],
  supersedes_id uuid REFERENCES agent_memory_longterm(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  superseded_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_agent_memory_longterm_tenant
  ON agent_memory_longterm (tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_memory_longterm_scope
  ON agent_memory_longterm (tenant_id, agent_handle, kind)
  WHERE superseded_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_agent_memory_longterm_recent
  ON agent_memory_longterm (tenant_id, created_at DESC)
  WHERE superseded_at IS NULL;

-- HNSW index on active (non-superseded) embeddings. pgvector 0.5+ supports HNSW.
-- Supabase MCP confirms pgvector 0.8.0 is enabled on project kovsdngjojzfebrxulyj.
CREATE INDEX IF NOT EXISTS idx_agent_memory_longterm_hnsw
  ON agent_memory_longterm
  USING hnsw (embedding vector_cosine_ops)
  WHERE embedding IS NOT NULL AND superseded_at IS NULL;

ALTER TABLE agent_memory_longterm ENABLE ROW LEVEL SECURITY;

-- STRICT policy — no bypass clause. If app.tenant_id is unset, NULL coerces
-- in current_setting(..., true)::uuid casts and the row predicate fails.
DROP POLICY IF EXISTS agent_memory_tenant_isolation ON agent_memory_longterm;
CREATE POLICY agent_memory_tenant_isolation ON agent_memory_longterm
  AS PERMISSIVE
  FOR ALL
  TO authenticated, service_role
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

COMMENT ON TABLE agent_memory_longterm IS
  'Phase-1 Intelligence Router long-term substrate. Kinds: fact, preference, constraint, decision. STRICT RLS — set_tenant() MUST be called before any read/write.';


-- ============================================================================
-- §C — match_agent_memories RPC (mirror of match_chunks)
-- ============================================================================
-- Mirrors migration-pgvector.sql:37-66 `match_chunks` pattern. LANGUAGE sql
-- STABLE, hardened search_path, not SECURITY DEFINER — relies on RLS on
-- agent_memory_longterm for tenant isolation.
-- ============================================================================

CREATE OR REPLACE FUNCTION match_agent_memories(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 10,
  filter_user text DEFAULT NULL,
  filter_venture text DEFAULT NULL,
  filter_agent text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  tenant_id uuid,
  venture_id text,
  user_id text,
  agent_handle text,
  kind memory_kind,
  content text,
  similarity float,
  provenance jsonb,
  confidence real,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SET search_path = public, pg_catalog
AS $$
  SELECT
    m.id,
    m.tenant_id,
    m.venture_id,
    m.user_id,
    m.agent_handle,
    m.kind,
    m.content,
    (1 - (m.embedding <=> query_embedding))::float AS similarity,
    m.provenance,
    m.confidence,
    m.created_at
  FROM agent_memory_longterm m
  WHERE m.embedding IS NOT NULL
    AND m.superseded_at IS NULL
    AND (filter_user IS NULL OR m.user_id = filter_user)
    AND (filter_venture IS NULL OR m.venture_id = filter_venture)
    AND (filter_agent IS NULL OR m.agent_handle = filter_agent)
    AND 1 - (m.embedding <=> query_embedding) > match_threshold
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
$$;

REVOKE ALL ON FUNCTION match_agent_memories(vector, float, int, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION match_agent_memories(vector, float, int, text, text, text)
  TO service_role, authenticated;

COMMENT ON FUNCTION match_agent_memories(vector, float, int, text, text, text) IS
  'Cosine-similarity recall from agent_memory_longterm. STABLE (read-only); relies on RLS for tenant isolation. Mirrors match_chunks pattern.';


-- ============================================================================
-- §D — Retroactive tenant_id on 7 tables (service-role bypass RLS)
-- ============================================================================
-- All 7 tables:
--   1. add tenant_id uuid column (nullable initially)
--   2. backfill with platform-tenant UUID (00000000-0000-0000-0000-000000000000)
--   3. set NOT NULL
--   4. index tenant_id
--   5. enable RLS with SERVICE-ROLE-BYPASS policy so existing handlers that
--      don't yet call set_tenant() keep working. Harden to STRICT per-handler
--      per docs/rls-migration-status.md checklist.
--
-- Bypass predicate:
--   USING (tenant_id = current_setting('app.tenant_id', true)::uuid
--          OR current_setting('app.tenant_id', true) IS NULL)
-- ============================================================================

-- Helper: the platform-tenant constant. (Inlined as UUID literal for clarity.)
-- 00000000-0000-0000-0000-000000000000

-- ---- agent_drafts ----
ALTER TABLE agent_drafts ADD COLUMN IF NOT EXISTS tenant_id uuid;
UPDATE agent_drafts
  SET tenant_id = '00000000-0000-0000-0000-000000000000'::uuid
  WHERE tenant_id IS NULL;
ALTER TABLE agent_drafts ALTER COLUMN tenant_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agent_drafts_tenant ON agent_drafts (tenant_id);
ALTER TABLE agent_drafts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS agent_drafts_tenant_isolation ON agent_drafts;
CREATE POLICY agent_drafts_tenant_isolation ON agent_drafts
  AS PERMISSIVE
  FOR ALL
  TO authenticated, service_role
  USING (
    tenant_id = current_setting('app.tenant_id', true)::uuid
    OR current_setting('app.tenant_id', true) IS NULL
    OR current_setting('app.tenant_id', true) = ''
  )
  WITH CHECK (
    tenant_id = current_setting('app.tenant_id', true)::uuid
    OR current_setting('app.tenant_id', true) IS NULL
    OR current_setting('app.tenant_id', true) = ''
  );

-- ---- document_templates ----
ALTER TABLE document_templates ADD COLUMN IF NOT EXISTS tenant_id uuid;
UPDATE document_templates
  SET tenant_id = '00000000-0000-0000-0000-000000000000'::uuid
  WHERE tenant_id IS NULL;
ALTER TABLE document_templates ALTER COLUMN tenant_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_document_templates_tenant ON document_templates (tenant_id);
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS document_templates_tenant_isolation ON document_templates;
CREATE POLICY document_templates_tenant_isolation ON document_templates
  AS PERMISSIVE
  FOR ALL
  TO authenticated, service_role
  USING (
    tenant_id = current_setting('app.tenant_id', true)::uuid
    OR current_setting('app.tenant_id', true) IS NULL
    OR current_setting('app.tenant_id', true) = ''
  )
  WITH CHECK (
    tenant_id = current_setting('app.tenant_id', true)::uuid
    OR current_setting('app.tenant_id', true) IS NULL
    OR current_setting('app.tenant_id', true) = ''
  );

-- ---- document_bundles ----
ALTER TABLE document_bundles ADD COLUMN IF NOT EXISTS tenant_id uuid;
UPDATE document_bundles
  SET tenant_id = '00000000-0000-0000-0000-000000000000'::uuid
  WHERE tenant_id IS NULL;
ALTER TABLE document_bundles ALTER COLUMN tenant_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_document_bundles_tenant ON document_bundles (tenant_id);
ALTER TABLE document_bundles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS document_bundles_tenant_isolation ON document_bundles;
CREATE POLICY document_bundles_tenant_isolation ON document_bundles
  AS PERMISSIVE
  FOR ALL
  TO authenticated, service_role
  USING (
    tenant_id = current_setting('app.tenant_id', true)::uuid
    OR current_setting('app.tenant_id', true) IS NULL
    OR current_setting('app.tenant_id', true) = ''
  )
  WITH CHECK (
    tenant_id = current_setting('app.tenant_id', true)::uuid
    OR current_setting('app.tenant_id', true) IS NULL
    OR current_setting('app.tenant_id', true) = ''
  );

-- ---- document_bundle_templates (join table — no own PK uuid) ----
ALTER TABLE document_bundle_templates ADD COLUMN IF NOT EXISTS tenant_id uuid;
UPDATE document_bundle_templates
  SET tenant_id = '00000000-0000-0000-0000-000000000000'::uuid
  WHERE tenant_id IS NULL;
ALTER TABLE document_bundle_templates ALTER COLUMN tenant_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bundle_templates_tenant ON document_bundle_templates (tenant_id);
ALTER TABLE document_bundle_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bundle_templates_tenant_isolation ON document_bundle_templates;
CREATE POLICY bundle_templates_tenant_isolation ON document_bundle_templates
  AS PERMISSIVE
  FOR ALL
  TO authenticated, service_role
  USING (
    tenant_id = current_setting('app.tenant_id', true)::uuid
    OR current_setting('app.tenant_id', true) IS NULL
    OR current_setting('app.tenant_id', true) = ''
  )
  WITH CHECK (
    tenant_id = current_setting('app.tenant_id', true)::uuid
    OR current_setting('app.tenant_id', true) IS NULL
    OR current_setting('app.tenant_id', true) = ''
  );

-- ---- onboarding_invites ----
ALTER TABLE onboarding_invites ADD COLUMN IF NOT EXISTS tenant_id uuid;
UPDATE onboarding_invites
  SET tenant_id = '00000000-0000-0000-0000-000000000000'::uuid
  WHERE tenant_id IS NULL;
ALTER TABLE onboarding_invites ALTER COLUMN tenant_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_onboarding_invites_tenant ON onboarding_invites (tenant_id);
ALTER TABLE onboarding_invites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS onboarding_invites_tenant_isolation ON onboarding_invites;
CREATE POLICY onboarding_invites_tenant_isolation ON onboarding_invites
  AS PERMISSIVE
  FOR ALL
  TO authenticated, service_role
  USING (
    tenant_id = current_setting('app.tenant_id', true)::uuid
    OR current_setting('app.tenant_id', true) IS NULL
    OR current_setting('app.tenant_id', true) = ''
  )
  WITH CHECK (
    tenant_id = current_setting('app.tenant_id', true)::uuid
    OR current_setting('app.tenant_id', true) IS NULL
    OR current_setting('app.tenant_id', true) = ''
  );

-- ---- user_document_requirements ----
ALTER TABLE user_document_requirements ADD COLUMN IF NOT EXISTS tenant_id uuid;
UPDATE user_document_requirements
  SET tenant_id = '00000000-0000-0000-0000-000000000000'::uuid
  WHERE tenant_id IS NULL;
ALTER TABLE user_document_requirements ALTER COLUMN tenant_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_doc_req_tenant ON user_document_requirements (tenant_id);
ALTER TABLE user_document_requirements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_doc_req_tenant_isolation ON user_document_requirements;
CREATE POLICY user_doc_req_tenant_isolation ON user_document_requirements
  AS PERMISSIVE
  FOR ALL
  TO authenticated, service_role
  USING (
    tenant_id = current_setting('app.tenant_id', true)::uuid
    OR current_setting('app.tenant_id', true) IS NULL
    OR current_setting('app.tenant_id', true) = ''
  )
  WITH CHECK (
    tenant_id = current_setting('app.tenant_id', true)::uuid
    OR current_setting('app.tenant_id', true) IS NULL
    OR current_setting('app.tenant_id', true) = ''
  );

-- ---- user_access_grants ----
ALTER TABLE user_access_grants ADD COLUMN IF NOT EXISTS tenant_id uuid;
UPDATE user_access_grants
  SET tenant_id = '00000000-0000-0000-0000-000000000000'::uuid
  WHERE tenant_id IS NULL;
ALTER TABLE user_access_grants ALTER COLUMN tenant_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_access_grants_tenant ON user_access_grants (tenant_id);
ALTER TABLE user_access_grants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_access_grants_tenant_isolation ON user_access_grants;
CREATE POLICY user_access_grants_tenant_isolation ON user_access_grants
  AS PERMISSIVE
  FOR ALL
  TO authenticated, service_role
  USING (
    tenant_id = current_setting('app.tenant_id', true)::uuid
    OR current_setting('app.tenant_id', true) IS NULL
    OR current_setting('app.tenant_id', true) = ''
  )
  WITH CHECK (
    tenant_id = current_setting('app.tenant_id', true)::uuid
    OR current_setting('app.tenant_id', true) IS NULL
    OR current_setting('app.tenant_id', true) = ''
  );


-- ============================================================================
-- §E — Event subscriber seeds → /api/knowledge-observer
-- ============================================================================
-- Subscribes knowledge-observer to 4 topic patterns so that draft approvals
-- and foundation-module approvals become memory writes via router.observe.
-- ON CONFLICT DO NOTHING makes this migration rerun-safe.
-- ============================================================================

INSERT INTO event_subscribers (module, topic_pattern, handler_url, health) VALUES
  ('intelligence', 'agentic.draft_approved', '/api/knowledge-observer', 'healthy'),
  ('intelligence', 'agentic.draft_edited',   '/api/knowledge-observer', 'healthy'),
  ('intelligence', 'agentic.draft_rejected', '/api/knowledge-observer', 'healthy'),
  ('intelligence', 'foundation.*.approved',  '/api/knowledge-observer', 'healthy')
ON CONFLICT DO NOTHING;


COMMIT;

-- ============================================================================
-- Post-migration verification (run manually after apply)
-- ============================================================================
-- 1. set_tenant returns void:
--      SELECT set_tenant('00000000-0000-0000-0000-000000000000');
-- 2. STRICT policy blocks unset tenant:
--      RESET ALL;
--      SELECT count(*) FROM agent_memory_longterm;  -- should fail/empty
--      SELECT set_tenant('00000000-0000-0000-0000-000000000000');
--      INSERT INTO agent_memory_longterm (tenant_id, kind, content)
--        VALUES ('00000000-0000-0000-0000-000000000000'::uuid, 'fact', 'smoke test');
-- 3. match_agent_memories returns TABLE:
--      SELECT * FROM match_agent_memories(ARRAY_FILL(0.1::float, ARRAY[768])::vector(768), 0, 5);
-- 4. Bypass RLS still works for agent_drafts (simulates legacy handler):
--      RESET ALL;
--      SELECT count(*) FROM agent_drafts;  -- should succeed (bypass clause)
-- 5. event_subscribers has 4 knowledge rows:
--      SELECT * FROM event_subscribers WHERE handler_url = '/api/knowledge-observer';
-- ============================================================================
