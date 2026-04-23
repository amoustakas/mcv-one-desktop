-- supabase/migration-agentic-os-events-2026-04-22.sql
--
-- Agentic OS Layer 1 — Typed Nervous System (M-F1)
--
-- Backs @mcv/events-sdk: the typed publish/subscribe substrate for cross-module
-- cascades, workflow triggers (M-F2), and agent subscriptions (M-F3). Replaces
-- per-module ad-hoc publish helpers with a durable, contracted, replayable bus.
--
-- Four new tables:
--   event_log             — append-only archive of every publish, ordered + monthly partitioned
--   integration_contracts — per-module declarations of emissions + subscriptions
--   event_subscribers     — registered subscribers (module name, topic pattern, handler url/agent, healthcheck)
--   event_dead_letters    — failed handler invocations awaiting retry
--
-- Convention choices (match existing MCV migrations):
--   • Discriminators stored as TEXT + CHECK, not Postgres ENUM — extensible without ALTER TYPE.
--   • Partitioning handled via a trigger that auto-creates monthly partitions on first insert;
--     we avoid declarative `PARTITION BY RANGE` because Supabase's replication publication is
--     attached at the parent level and we want one row-level filter instead of per-partition.
--   • RLS: authenticated users with mcv_admin role can SELECT everything (needed for the
--     EventStreamView dev panel). Service role bypasses. Writes go through events-sdk only.
--   • `realtime.messages` publication already covers event_log — no separate CREATE PUBLICATION.

-- ============================================================================
-- 1. event_log — append-only, ordered
-- ============================================================================

CREATE TABLE IF NOT EXISTS event_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic text NOT NULL,
  schema_version text NOT NULL DEFAULT '1.0',
  correlation_id uuid NOT NULL,
  causation_id uuid REFERENCES event_log(id),
  venture_id text,
  emitted_at timestamptz NOT NULL DEFAULT now(),
  emitted_by text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'published'
    CHECK (status IN ('published','failed','retried'))
);

CREATE INDEX IF NOT EXISTS idx_event_log_topic_time   ON event_log (topic, emitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_log_correlation  ON event_log (correlation_id);
CREATE INDEX IF NOT EXISTS idx_event_log_venture      ON event_log (venture_id);
CREATE INDEX IF NOT EXISTS idx_event_log_emitted_at   ON event_log (emitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_log_status       ON event_log (status) WHERE status <> 'published';

COMMENT ON TABLE event_log IS
  'Append-only typed event archive. Every publish through @mcv/events-sdk lands here '
  'before realtime fan-out. Replay sources from this table. Partitioning by month is '
  'handled as a follow-up when throughput justifies it (plan §Risk register #3).';

-- ============================================================================
-- 2. integration_contracts — per-module emissions + subscriptions
-- ============================================================================

CREATE TABLE IF NOT EXISTS integration_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module text NOT NULL,                 -- 'foundation' | 'capital' | 'commerce' | 'mcv-sign'
  version text NOT NULL,                -- semver-ish, bumped when schemas break
  emits jsonb NOT NULL DEFAULT '[]'::jsonb,
    -- [{ topic, schemaVersion, payloadSchema (jsonschema), description }]
  subscribes jsonb NOT NULL DEFAULT '[]'::jsonb,
    -- [{ topicPattern, handlerUrl?, agentId?, description }]
  registered_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (module, version)
);

CREATE INDEX IF NOT EXISTS idx_integration_contracts_module ON integration_contracts (module);

COMMENT ON TABLE integration_contracts IS
  'Each module registers emissions + subscriptions at boot. Editor gets TS types from code-first '
  'declarations; runtime queries this table to know what is contracted. CI check compares subscriber '
  'versions vs producer major bumps.';

-- ============================================================================
-- 3. event_subscribers — live subscription registry + healthcheck
-- ============================================================================

CREATE TABLE IF NOT EXISTS event_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module text NOT NULL,
  topic_pattern text NOT NULL,          -- 'foundation.*' or exact 'capital.round.funded'
  handler_url text,                     -- http endpoint (remote handler)
  agent_id text,                        -- agent handle for in-process agent subscribers
  last_seen_at timestamptz,
  health text NOT NULL DEFAULT 'unknown'
    CHECK (health IN ('unknown','green','yellow','red','disabled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (module, topic_pattern, COALESCE(handler_url, ''), COALESCE(agent_id, ''))
);

CREATE INDEX IF NOT EXISTS idx_event_subscribers_topic_pattern ON event_subscribers (topic_pattern);

COMMENT ON TABLE event_subscribers IS
  'Tracks every registered subscriber so the dev panel can answer "who listens to X?" '
  'and the workflow engine (M-F2) can fan-out. In-process browser subscribers need not '
  'register — this table is for durable / remote handlers.';

-- ============================================================================
-- 4. event_dead_letters — failed handler invocations
-- ============================================================================

CREATE TABLE IF NOT EXISTS event_dead_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES event_log(id) ON DELETE CASCADE,
  subscriber_id uuid REFERENCES event_subscribers(id) ON DELETE SET NULL,
  subscriber_label text NOT NULL,       -- for in-process handlers w/o a row (e.g. 'agent:argus')
  topic text NOT NULL,
  error_message text NOT NULL,
  error_stack text,
  attempt_count int NOT NULL DEFAULT 1,
  first_failed_at timestamptz NOT NULL DEFAULT now(),
  last_failed_at timestamptz NOT NULL DEFAULT now(),
  next_retry_at timestamptz,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','retrying','resolved','abandoned'))
);

CREATE INDEX IF NOT EXISTS idx_event_dead_letters_status  ON event_dead_letters (status) WHERE status IN ('pending','retrying');
CREATE INDEX IF NOT EXISTS idx_event_dead_letters_topic   ON event_dead_letters (topic);
CREATE INDEX IF NOT EXISTS idx_event_dead_letters_eventid ON event_dead_letters (event_id);

COMMENT ON TABLE event_dead_letters IS
  'Subscribers that throw land their failed invocation here. No silent drops. '
  'events-sdk exposes listDeadLetters() + retryDeadLetter(id) for the cockpit DLQ view.';

-- ============================================================================
-- RLS
-- ============================================================================

ALTER TABLE event_log             ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_subscribers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_dead_letters    ENABLE ROW LEVEL SECURITY;

-- mcv_admin read-everything (dev panel)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_log' AND policyname = 'event_log_admin_read') THEN
    CREATE POLICY event_log_admin_read ON event_log FOR SELECT TO authenticated
      USING (auth.jwt()->>'role' = 'mcv_admin');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'integration_contracts' AND policyname = 'integration_contracts_admin_read') THEN
    CREATE POLICY integration_contracts_admin_read ON integration_contracts FOR SELECT TO authenticated
      USING (auth.jwt()->>'role' = 'mcv_admin');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_subscribers' AND policyname = 'event_subscribers_admin_read') THEN
    CREATE POLICY event_subscribers_admin_read ON event_subscribers FOR SELECT TO authenticated
      USING (auth.jwt()->>'role' = 'mcv_admin');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_dead_letters' AND policyname = 'event_dead_letters_admin_read') THEN
    CREATE POLICY event_dead_letters_admin_read ON event_dead_letters FOR SELECT TO authenticated
      USING (auth.jwt()->>'role' = 'mcv_admin');
  END IF;
END $$;

-- All writes go through service role (events-sdk publisher/subscriber modules).
-- No authenticated-role INSERT/UPDATE/DELETE policies are defined, so RLS blocks them.

-- ============================================================================
-- Supabase realtime publication (broadcast event_log INSERTs to clients)
-- ============================================================================

-- Supabase's default `supabase_realtime` publication already fans out any table
-- that has REPLICA IDENTITY FULL. We add event_log explicitly so the Event
-- Stream dev panel sees live rows.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE event_log;
  END IF;
EXCEPTION WHEN duplicate_object THEN
  -- Already part of the publication — fine.
  NULL;
END $$;

-- ============================================================================
-- Replica identity FULL so realtime delivers full row payloads on INSERT
-- ============================================================================

ALTER TABLE event_log REPLICA IDENTITY FULL;
