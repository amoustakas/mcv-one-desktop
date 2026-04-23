-- supabase/migration-github-repos-2026-04-23.sql
-- Authoritative registry of every GitHub repository in the conglomerate's orbit.
-- First-run sync pulls from GitHub API via scripts/seed-github-repos.ts; subsequent
-- runs refresh pushed_at / open_issues_count / archived status.
--
-- SCHEMA: parent_entity_id is TEXT FK to capital_legal_entity.id (text).
-- Crown ids are literal text: 'mcv-inc-crown' (MCV Inc., US-DE) and 'mcv-ltd-crown' (MCV LTD, UK).
--
-- Mirrors domain_registry shape so the Foundation Repository Portfolio panel
-- can share component primitives (expiry-tier coloring → staleness-tier coloring).

CREATE TABLE IF NOT EXISTS github_repos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text UNIQUE NOT NULL,           -- "amoustakas/mcv-one-desktop"
  owner text NOT NULL,                      -- "amoustakas"
  name text NOT NULL,                       -- "mcv-one-desktop"
  description text,
  language text,
  default_branch text DEFAULT 'master',
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('public','private','internal')),
  archived boolean NOT NULL DEFAULT false,
  html_url text,
  stargazers_count int NOT NULL DEFAULT 0,
  open_issues_count int NOT NULL DEFAULT 0,
  parent_entity_id text REFERENCES capital_legal_entity(id),
  venture_id text REFERENCES ventures(id),
  pushed_at timestamptz,
  updated_at timestamptz,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_github_repos_venture ON github_repos(venture_id);
CREATE INDEX IF NOT EXISTS idx_github_repos_parent ON github_repos(parent_entity_id);
CREATE INDEX IF NOT EXISTS idx_github_repos_pushed ON github_repos(pushed_at DESC);
CREATE INDEX IF NOT EXISTS idx_github_repos_archived ON github_repos(archived) WHERE archived = true;

-- Seed the 5 well-known repos the legacy /api/github handler tracked, so the
-- UI renders something pre-sync. venture_id is best-effort — refine post-hydrate.
INSERT INTO github_repos (full_name, owner, name, venture_id, parent_entity_id) VALUES
  ('amoustakas/mcv-one-desktop',         'amoustakas', 'mcv-one-desktop',         NULL,         'mcv-inc-crown'),
  ('amoustakas/mcv-one',                 'amoustakas', 'mcv-one',                 NULL,         'mcv-inc-crown'),
  ('amoustakas/Futurestate',             'amoustakas', 'Futurestate',             'futurestate','mcv-inc-crown'),
  ('amoustakas/Bet-Edge',                'amoustakas', 'Bet-Edge',                'betedge',    'mcv-inc-crown'),
  ('amoustakas/mcv-one-admin-prototype', 'amoustakas', 'mcv-one-admin-prototype', NULL,         'mcv-inc-crown')
ON CONFLICT (full_name) DO NOTHING;

COMMENT ON TABLE github_repos IS
  'Sovereign registry of every GitHub repository owned or operated by the MCV conglomerate. ' ||
  'Synced from the GitHub REST API via scripts/seed-github-repos.ts. ' ||
  'Mirrors domain_registry shape — parent_entity_id gates Crown ownership, venture_id ties repo to venture.';
