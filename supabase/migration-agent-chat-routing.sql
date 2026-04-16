-- Chat routing — wires conversations + messages to agent_persona so every
-- chat thread knows which specialist is driving it and every message records
-- the agent that produced it. Originally drafted by parallel Session B; this
-- file is the version applied to the prod DB to unblock the wizard
-- AgentChatColumn integration (apps/onboarding).
--
-- All additive: existing rows keep working as agent-less ("venture-only")
-- threads. Skips ADD COLUMN for user_id (conversations) and metadata
-- (messages) because both already exist on the current production schema.

ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES agent_persona(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS agent_conversation_id UUID REFERENCES agent_conversation(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_conversations_agent
  ON conversations (agent_id, updated_at DESC)
  WHERE agent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_conversations_user_agent
  ON conversations (user_id, agent_id, updated_at DESC)
  WHERE agent_id IS NOT NULL;

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES agent_persona(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS agent_conversation_id UUID REFERENCES agent_conversation(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_messages_agent
  ON messages (agent_id, created_at DESC)
  WHERE agent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_messages_agent_conv
  ON messages (agent_conversation_id, created_at ASC)
  WHERE agent_conversation_id IS NOT NULL;
