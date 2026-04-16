-- OFAC SDN cache table (Epic 13 S6 follow-up).
-- Stores the US Treasury OFAC Specially Designated Nationals list
-- as a Supabase-backed cache. Refreshed nightly (future cron) from
-- https://www.treasury.gov/ofac/downloads/sdn.csv + alt_names.csv.
--
-- Gate + screener path: the OFAC adapter queries this table when
-- present; falls back to the curated 5-entry seed when empty (dev,
-- CI, or cold start before the first cron).
--
-- pg_trgm isn't mandatory here — the JS-side Dice-bigram matcher
-- handles ~15k rows in a single query. When we need stronger
-- performance (or DB-side scoring), upgrade with pg_trgm similarity
-- operators.

CREATE TABLE IF NOT EXISTS ofac_sdn_entries (
  id TEXT PRIMARY KEY,                 -- ent_num from OFAC CSV
  primary_name TEXT NOT NULL,
  aliases TEXT[] NOT NULL DEFAULT '{}',
  dob DATE,                            -- NULL when OFAC doesn't list one
  country TEXT,
  list TEXT NOT NULL DEFAULT 'SDN' CHECK (list IN ('SDN', 'ConsolidatedSanctions')),
  programs TEXT[] NOT NULL DEFAULT '{}',
  sdn_type TEXT,                       -- 'Individual' | 'Entity' | 'Vessel' | 'Aircraft'
  raw_remarks TEXT,                    -- Full SDN "Remarks" column for audit
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ofac_sdn_entries_primary_name_idx
  ON ofac_sdn_entries (primary_name);

-- Track each refresh run so admins can see when the cache is stale.
CREATE TABLE IF NOT EXISTS ofac_sdn_refresh_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  rows_upserted INTEGER,
  rows_deleted INTEGER,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  error TEXT,
  source_url TEXT
);

-- Service-role-only. Reads are gated via the Capital API handler;
-- the general public never queries this directly.
ALTER TABLE ofac_sdn_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ofac_sdn_refresh_log ENABLE ROW LEVEL SECURITY;
