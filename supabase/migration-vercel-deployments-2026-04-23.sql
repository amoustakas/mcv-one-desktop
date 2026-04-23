-- supabase/migration-vercel-deployments-2026-04-23.sql
-- Authoritative registry of every Vercel project + its recent deployments.
-- Two-table design (unlike domain/repo single-tables) because Vercel has a
-- natural 1-to-many relationship between projects and deployments.
--
-- First-run sync pulls from Vercel API via scripts/seed-vercel-deployments.ts.
-- Refresh-run updates state / ready_at / meta for deployments and last_deployment_at
-- for projects.

CREATE TABLE IF NOT EXISTS vercel_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vercel_project_id text UNIQUE NOT NULL,     -- Vercel's project id (prj_...)
  name text NOT NULL,                          -- e.g. "mcv-one-desktop"
  framework text,                              -- nextjs, vite, astro, etc.
  venture_id text REFERENCES ventures(id),
  parent_entity_id text REFERENCES capital_legal_entity(id),
  production_url text,                         -- primary production domain
  last_deployment_at timestamptz,              -- cache of most recent deployment
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vercel_projects_venture ON vercel_projects(venture_id);
CREATE INDEX IF NOT EXISTS idx_vercel_projects_parent ON vercel_projects(parent_entity_id);

CREATE TABLE IF NOT EXISTS vercel_deployments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vercel_deployment_id text UNIQUE NOT NULL,   -- Vercel's deployment uid (dpl_...)
  vercel_project_id text NOT NULL REFERENCES vercel_projects(vercel_project_id) ON DELETE CASCADE,
  project_name text NOT NULL,                  -- denormalized for cheap UI render
  url text NOT NULL,                           -- preview URL (e.g. my-app-xyz.vercel.app)
  state text NOT NULL CHECK (state IN ('READY','ERROR','BUILDING','QUEUED','CANCELED','INITIALIZING','DEPLOYING')),
  target text CHECK (target IN ('production','staging','preview')),
  creator_username text,                       -- who triggered (Vercel user/team)
  commit_sha text,                             -- from meta.githubCommitSha
  commit_message text,                         -- from meta.githubCommitMessage
  git_branch text,                             -- from meta.githubCommitRef
  meta jsonb,                                  -- catch-all for remaining meta
  created_at_vercel timestamptz NOT NULL,      -- Vercel's `created` ms → timestamptz
  ready_at timestamptz,
  venture_id text REFERENCES ventures(id),
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vercel_deployments_project ON vercel_deployments(vercel_project_id);
CREATE INDEX IF NOT EXISTS idx_vercel_deployments_venture ON vercel_deployments(venture_id);
CREATE INDEX IF NOT EXISTS idx_vercel_deployments_created ON vercel_deployments(created_at_vercel DESC);
CREATE INDEX IF NOT EXISTS idx_vercel_deployments_state ON vercel_deployments(state) WHERE state IN ('ERROR','BUILDING');
CREATE INDEX IF NOT EXISTS idx_vercel_deployments_target ON vercel_deployments(target) WHERE target = 'production';

COMMENT ON TABLE vercel_projects IS
  'Vercel project registry — one row per project across all Vercel teams in the MCV org.';
COMMENT ON TABLE vercel_deployments IS
  'Vercel deployment log — recent deployments per project, state-tracked for ops dashboards. ' ||
  'Rolling window maintained by scripts/seed-vercel-deployments.ts (default: 50 per project).';
