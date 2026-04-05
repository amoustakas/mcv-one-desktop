-- migration-platform.sql
-- Platform API & Partner SDK — API keys, webhook endpoints, webhook deliveries

-- ─────────────────────────────────────────────────────────────────────────────
-- api_keys
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS api_keys (
  id               TEXT PRIMARY KEY,
  venture_id       TEXT NOT NULL,
  name             TEXT NOT NULL,
  key_prefix       TEXT NOT NULL,               -- "mcv_live_" or "mcv_test_"
  key_hash         TEXT UNIQUE NOT NULL,         -- SHA-256 of full key (never store plaintext)
  last_used_at     TIMESTAMPTZ,
  expires_at       TIMESTAMPTZ,
  rate_limit_tier  TEXT NOT NULL DEFAULT 'free'
                     CHECK (rate_limit_tier IN ('free','growth','scale','enterprise')),
  permissions      TEXT[] NOT NULL DEFAULT ARRAY['*'],
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_venture     ON api_keys (venture_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash    ON api_keys (key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_created     ON api_keys (created_at DESC);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Partners call /api/v1/* which uses the service role key server-side;
-- these policies protect direct client-side access (disallow by default)
CREATE POLICY "api_keys_no_direct_access"
  ON api_keys
  FOR ALL
  USING (false);

-- ─────────────────────────────────────────────────────────────────────────────
-- webhook_endpoints
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id                TEXT PRIMARY KEY,
  venture_id        TEXT NOT NULL,
  url               TEXT NOT NULL,
  secret            TEXT NOT NULL,              -- HMAC signing secret
  events            TEXT[] NOT NULL DEFAULT ARRAY['*'],
  status            TEXT NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active','disabled')),
  failure_count     INTEGER NOT NULL DEFAULT 0,
  last_delivered_at TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_venture ON webhook_endpoints (venture_id);
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_status  ON webhook_endpoints (venture_id, status);

ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhook_endpoints_no_direct_access"
  ON webhook_endpoints
  FOR ALL
  USING (false);

-- ─────────────────────────────────────────────────────────────────────────────
-- webhook_deliveries
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id            TEXT PRIMARY KEY,
  endpoint_id   TEXT NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  event         TEXT NOT NULL,
  payload       JSONB NOT NULL DEFAULT '{}',
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','delivered','failed')),
  http_status   INTEGER,
  attempts      INTEGER NOT NULL DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_endpoint ON webhook_deliveries (endpoint_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status   ON webhook_deliveries (status);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_retry    ON webhook_deliveries (next_retry_at)
  WHERE status = 'pending' AND next_retry_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created  ON webhook_deliveries (created_at DESC);

ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhook_deliveries_no_direct_access"
  ON webhook_deliveries
  FOR ALL
  USING (false);
