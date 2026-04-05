-- ============================================================================
-- NAOS Agent System: Agent Definitions & Session Tracking
-- Supports custom agent definitions and runtime session telemetry.
-- Builtin agents (Aegis, Forge, Ledger, etc.) are code-defined;
-- this table stores user-customized or third-party agents.
-- ============================================================================

CREATE TABLE IF NOT EXISTS naos_agents (
  id            TEXT PRIMARY KEY,
  definition    JSONB NOT NULL,
  is_builtin    BOOLEAN NOT NULL DEFAULT FALSE,
  created_by    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_naos_agents_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_naos_agents_timestamp ON naos_agents;
CREATE TRIGGER tr_naos_agents_timestamp
  BEFORE UPDATE ON naos_agents
  FOR EACH ROW EXECUTE FUNCTION update_naos_agents_timestamp();

-- ============================================================================
-- NAOS Sessions: Runtime tracking for every agent invocation
-- Records which agent handled what, how many tools were called, token usage.
-- ============================================================================

CREATE TABLE IF NOT EXISTS naos_sessions (
  id              TEXT PRIMARY KEY,
  agent_id        TEXT NOT NULL,
  venture_id      TEXT NOT NULL,
  conversation_id TEXT,
  user_id         TEXT,
  status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'waiting', 'complete', 'error')),
  tool_call_count INTEGER NOT NULL DEFAULT 0,
  input_tokens    INTEGER NOT NULL DEFAULT 0,
  output_tokens   INTEGER NOT NULL DEFAULT 0,
  model_used      TEXT,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_naos_sessions_agent ON naos_sessions (agent_id);
CREATE INDEX IF NOT EXISTS idx_naos_sessions_venture ON naos_sessions (venture_id);
CREATE INDEX IF NOT EXISTS idx_naos_sessions_user ON naos_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_naos_sessions_started ON naos_sessions (started_at DESC);

-- RLS
ALTER TABLE naos_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE naos_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read agents" ON naos_agents FOR SELECT USING (true);
CREATE POLICY "Users manage own agents" ON naos_agents FOR ALL
  USING (auth.uid()::text = created_by)
  WITH CHECK (auth.uid()::text = created_by);

CREATE POLICY "Users read own sessions" ON naos_sessions FOR SELECT
  USING (auth.uid()::text = user_id);
CREATE POLICY "Users manage own sessions" ON naos_sessions FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);
