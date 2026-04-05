-- ============================================================================
-- Device Hub: Active Instances & Screen Registry
-- Tracks all running MCV Desktop instances across all devices and screens.
-- Complements Supabase Realtime Presence (which tracks ephemeral state)
-- with persistent device registration for analytics and orchestration.
-- ============================================================================

-- Active app instances (desktop, mobile, PWA, Capacitor)
CREATE TABLE IF NOT EXISTS active_instances (
  id            TEXT PRIMARY KEY,                    -- instance-{deviceId}
  user_id       TEXT NOT NULL,
  device_id     TEXT NOT NULL,                       -- stable device fingerprint
  device_name   TEXT NOT NULL,                       -- "Tony's Desktop", "iPhone"
  device_type   TEXT NOT NULL CHECK (device_type IN ('desktop', 'tablet', 'phone')),
  platform      TEXT NOT NULL,                       -- win32, macos, ios, android, linux
  screen_class  TEXT NOT NULL,                       -- ultrawide, cinema, desktop, phone, etc.
  screen_resolution TEXT NOT NULL,                   -- "3840x2160"
  screen_index  INTEGER,                             -- multi-monitor index (0, 1, 2...)
  screen_label  TEXT,                                -- "DELL U2720Q" from getScreenDetails()
  is_pwa        BOOLEAN NOT NULL DEFAULT FALSE,
  is_capacitor  BOOLEAN NOT NULL DEFAULT FALSE,
  pixel_ratio   REAL NOT NULL DEFAULT 1.0,
  active_view   TEXT,
  active_venture TEXT,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'away', 'focus', 'sleeping', 'offline')),
  timezone      TEXT,
  city          TEXT,
  network_type  TEXT,
  battery_level INTEGER,
  battery_charging BOOLEAN,
  hostname      TEXT,
  last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_active_instances_user ON active_instances (user_id);

-- Index for heartbeat expiry
CREATE INDEX IF NOT EXISTS idx_active_instances_heartbeat ON active_instances (last_heartbeat);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_active_instances_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_active_instances_timestamp ON active_instances;
CREATE TRIGGER tr_active_instances_timestamp
  BEFORE UPDATE ON active_instances
  FOR EACH ROW EXECUTE FUNCTION update_active_instances_timestamp();

-- RLS: users can only see/modify their own instances
ALTER TABLE active_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own instances"
  ON active_instances FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users manage own instances"
  ON active_instances FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Cleanup function: remove instances with heartbeat > 5 minutes old
-- Run via pg_cron or Supabase cron
CREATE OR REPLACE FUNCTION cleanup_stale_instances()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM active_instances
  WHERE last_heartbeat < NOW() - INTERVAL '5 minutes';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Screen registry: persistent record of all screens ever connected
-- Used for analytics, layout memory, and multi-screen orchestration
-- ============================================================================

CREATE TABLE IF NOT EXISTS screen_registry (
  id            TEXT PRIMARY KEY,                    -- "{userId}-{screenLabel}-{resolution}"
  user_id       TEXT NOT NULL,
  screen_label  TEXT NOT NULL,                       -- "DELL U2720Q" or "Built-in Display"
  resolution    TEXT NOT NULL,                       -- "3840x2160"
  screen_class  TEXT NOT NULL,
  pixel_ratio   REAL NOT NULL DEFAULT 1.0,
  is_primary    BOOLEAN NOT NULL DEFAULT FALSE,
  is_internal   BOOLEAN NOT NULL DEFAULT FALSE,      -- built-in laptop/phone screen
  position_x    INTEGER,                             -- multi-monitor layout position
  position_y    INTEGER,
  preferred_view TEXT,                               -- default view for this screen
  preferred_venture TEXT,                            -- default venture for this screen
  last_seen     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_screen_registry_user ON screen_registry (user_id);

ALTER TABLE screen_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own screens"
  ON screen_registry FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users manage own screens"
  ON screen_registry FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);
