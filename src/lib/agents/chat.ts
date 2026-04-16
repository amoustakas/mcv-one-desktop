// src/lib/agents/chat.ts
// Session B — client-side helpers for agent-routed chat.
// Wraps /api/agents?action=start-conversation and exposes the agent context
// the chat UI needs (system prompt, allowlist, accent color).

import { apiPost } from '../api/client';

export interface AgentChatHandle {
  id: string;
  handle: string;
  full_name: string;
  title: string;
  accent_color: string | null;
  avatar_url: string | null;
  kit_allowlist: string[];
  tool_allowlist: string[] | null;
  /** Per-agent model override (null falls back to server default). */
  model: string | null;
}

export interface StartConversationResult {
  conversation_id: string;
  agent_conversation_id: string;
  venture_id: string;
  agent: AgentChatHandle;
  system_prompt: string;
}

export interface AgentConversationSummary {
  id: string;
  title: string;
  venture_id: string;
  agent_id: string;
  agent_conversation_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Create a new chat thread scoped to an agent.
 * Idempotent per-click — each invocation yields a fresh conversation row;
 * callers resume prior threads via listAgentConversations instead.
 */
export function startAgentConversation(opts: {
  handle: string;
  venture_id?: string;
  title?: string;
}): Promise<StartConversationResult> {
  return apiPost<StartConversationResult>('/api/agents', {
    action: 'start-conversation',
    handle: opts.handle,
    venture_id: opts.venture_id,
    title: opts.title,
  });
}

/** Recent conversations the user has had with a specific agent. */
export function listAgentConversations(opts: {
  handle?: string;
  agent_id?: string;
  limit?: number;
}): Promise<{ conversations: AgentConversationSummary[] }> {
  return apiPost<{ conversations: AgentConversationSummary[] }>('/api/agents', {
    action: 'list-conversations',
    handle: opts.handle,
    agent_id: opts.agent_id,
    limit: opts.limit,
  });
}
