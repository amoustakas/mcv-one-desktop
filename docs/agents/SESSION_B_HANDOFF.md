# Session B Handoff — Chat Routing Through Agent Personas

**Goal**: clicking "Start conversation" on an Agent Profile opens a chat scoped to that agent's persona, system prompt, voice, and tool belt. Atlas becomes Tony's actual always-on co-decision partner, not a roster entry.

**Depends on**: Session A (shipped PR #29 commit 44cbcac).

**Estimated scope**: 1 dedicated session.

---

## What ships in Session B

1. **Chat backend — agent-aware session creation.**
   - New endpoint or extension: `POST /api/agents action=start-conversation` with `{ handle }` → creates an `agent_conversation` row, returns conversation id + the resolved system prompt + kit allowlist.
   - Existing chat endpoint (likely `api/_handlers/naos-chat.ts` or similar — confirm file location first) accepts an `agent_id` context param and:
     - Loads `agent_persona` row
     - Uses `agent.system_prompt` as the base prompt (prepend to conversation history)
     - Filters the tool registry to intersection of `agent.kit_allowlist × (agent.tool_allowlist || all)`
     - Writes an `agent_activity_log` row on every tool call and every chat turn with `agent_id`, `session_id`, `action_kind`, `tool_name`, `input`, `output`, `duration_ms`, `cost_usd`

2. **Chat UI — agent badge on every message.**
   - Avatar + accent color + name badge on every agent message (not user messages)
   - Conversation header shows the active agent prominently
   - URL/state: conversation is bound to an agent; switching agents = new conversation

3. **Agent Profile — wire up "Start conversation" button.**
   - Currently disabled with "(Session B)" label — wire it to call `start-conversation`, set active conversation context, and navigate to the chat view

4. **Conversation list scoped by agent.**
   - New hook: `useAgentConversations(agentHandle)` returning recent conversations
   - Sidebar on Agent Profile shows "Recent conversations with [Agent]"

5. **Tool-belt enforcement (critical).**
   - The chat endpoint MUST filter tools by agent allowlist. If Justice is the active agent and they try to call `distribute_tokens` (which isn't in their allowlist), the tool call fails cleanly with "Justice doesn't have that tool — try routing to Warren."
   - This is what makes agents feel like real specialists vs. the current "all tools, all agents" behavior.

## What does NOT ship in Session B (defer to Session C+)

- @-mention autocomplete inside chat (Session C)
- Agent handoff mechanism (Session C)
- Org Chart visualization (Session C)
- Workflows + scheduled runs (Session D)
- Training Studio (Session E)
- Hiring Wizard (Session E)

## First files to check before starting Session B

```
api/_handlers/naos-chat.ts       # or similar — find the current chat endpoint
src/components/chat/              # find existing chat components
src/hooks/use-chat*.ts            # find existing chat hooks
src/stores/chat*.ts               # find existing chat store
```

Grep for: `messages`, `chat_messages`, `conversation`, `session_id` — whatever schema the existing chat uses. Add `agent_id` column to the messages table via migration.

## Migration needed for Session B

```sql
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES agent_persona(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS agent_conversation_id UUID REFERENCES agent_conversation(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_messages_agent ON messages (agent_id, created_at DESC) WHERE agent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_agent_conv ON messages (agent_conversation_id, created_at ASC) WHERE agent_conversation_id IS NOT NULL;
```

Assuming the existing chat uses a `messages` table. Adjust to actual schema.

## Activity log writes to add

Every chat turn:
```sql
INSERT INTO agent_activity_log (agent_id, actor_user_id, session_id, action_kind, input, output, duration_ms, cost_usd, venture_id)
VALUES ($agent_id, $user_id, $conversation_id, 'chat_turn', $user_message_json, $assistant_message_json, $ms, $cost, $venture);
```

Every tool call:
```sql
INSERT INTO agent_activity_log (agent_id, actor_user_id, session_id, action_kind, tool_name, input, output, duration_ms)
VALUES ($agent_id, $user_id, $conversation_id, 'tool_call', $tool_name, $tool_input, $tool_output, $ms);
```

## Success criteria for Session B

1. Click "Start conversation" on Atlas → chat opens with Atlas avatar + cyan accent + "Atlas" name in header
2. Send "what's our total AUM across ventures?" → Atlas responds in first person, doesn't mention being an AI, uses simulate_royalty_walk or list_treasuries if relevant
3. Switch to Warren Cho → new conversation, Warren avatar + emerald accent, different voice
4. Ask Warren "screen John Doe for OFAC" → he either routes to Justice or explains that's not his tool (tool-belt enforcement)
5. `SELECT count(*) FROM agent_activity_log WHERE action_kind='chat_turn'` returns > 0 after any conversation
6. Conversation history persists — closing and reopening a conversation shows the thread

## Long-horizon planted seeds from the main plan

- Eventually Atlas runs on a hybrid model (Claude + GPT + Gemini ensemble). System prompt rendering needs to stay model-agnostic.
- Multi-agent conversations: Atlas + Warren + Justice in one thread. Defer to after Session C handoffs ship.
- Voice interaction via ElevenLabs per agent (future).

## Critical invariant

**The persona is data. The model is runtime.** `agent_persona.system_prompt` is the source of truth. The model executing the prompt is swappable without changing the agent. This is Tony's multi-model vision — code in Session B must honor it: never hardcode `claude-sonnet` anywhere; read the model from a config per-agent or fall back to a sensible default.
