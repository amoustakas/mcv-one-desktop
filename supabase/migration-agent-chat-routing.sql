-- supabase/migration-agent-chat-routing.sql
-- Session B — Chat Routing Through Agent Personas
-- Binds the existing chat primitives (conversations / messages) to the new
-- agent_persona + agent_conversation tables from Session A so every chat
-- turn knows which specialist is driving it and every message can be replayed
-- in an agent-scoped history view.
--
-- All additive. Safe on existing data (agent_id / agent_conversation_id start
-- NULL, so old chats keep working as "unscoped / venture-only" threads).

-- ─── 1. conversations: link a chat thread to an agent persona ─────────

ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES agent_persona(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS agent_conversation_id UUID REFERENCES agent_conversation(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Recent conversations with a specific agent for a given user.
CREATE INDEX IF NOT EXISTS idx_conversations_agent
  ON conversations (agent_id, updated_at DESC)
  WHERE agent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_conversations_user_agent
  ON conversations (user_id, agent_id, updated_at DESC)
  WHERE agent_id IS NOT NULL;

-- ─── 2. messages: carry the agent context on every turn ───────────────

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES agent_persona(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS agent_conversation_id UUID REFERENCES agent_conversation(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}';

-- Replay a specific agent's turns across all their conversations (audit / debug).
CREATE INDEX IF NOT EXISTS idx_messages_agent
  ON messages (agent_id, created_at DESC)
  WHERE agent_id IS NOT NULL;

-- Linear history render for an agent_conversation.
CREATE INDEX IF NOT EXISTS idx_messages_agent_conv
  ON messages (agent_conversation_id, created_at ASC)
  WHERE agent_conversation_id IS NOT NULL;

-- ─── 3. convenience: a trigger-safe view is out of scope — rely on FKs ─

-- Nothing to seed; agent-backed threads are created lazily via
-- /api/agents action=start-conversation the first time a user clicks
-- "Start conversation" on an agent profile.
