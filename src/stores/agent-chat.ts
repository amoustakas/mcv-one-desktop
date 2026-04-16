// src/stores/agent-chat.ts
// Session B — tracks the currently-open agent-routed conversation.
// Persists only the active pointer (agent handle + conversation id) so a
// page refresh resumes the last thread. The message list itself is loaded
// fresh from Supabase on mount.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AgentChatHandle } from '../lib/agents/chat';

interface AgentChatState {
  /** The agent powering the currently-open chat (null = venture chat / Aegis). */
  activeAgent: AgentChatHandle | null;
  /** Conversation id in the `conversations` table. */
  activeConversationId: string | null;
  /** Mirror row id in `agent_conversation` (used for activity audit joins). */
  activeAgentConversationId: string | null;
  /** System prompt fetched at start-conversation time — cached here so the
   *  chat UI can render it or include it in the request payload without
   *  refetching the agent on every turn. */
  activeSystemPrompt: string | null;

  openAgentConversation: (opts: {
    agent: AgentChatHandle;
    conversationId: string;
    agentConversationId: string;
    systemPrompt: string;
  }) => void;
  clear: () => void;
}

export const useAgentChat = create<AgentChatState>()(
  persist(
    (set) => ({
      activeAgent: null,
      activeConversationId: null,
      activeAgentConversationId: null,
      activeSystemPrompt: null,

      openAgentConversation: ({ agent, conversationId, agentConversationId, systemPrompt }) =>
        set({
          activeAgent: agent,
          activeConversationId: conversationId,
          activeAgentConversationId: agentConversationId,
          activeSystemPrompt: systemPrompt,
        }),

      clear: () =>
        set({
          activeAgent: null,
          activeConversationId: null,
          activeAgentConversationId: null,
          activeSystemPrompt: null,
        }),
    }),
    {
      name: 'mcv-agent-chat',
      // Only persist the pointer — message content rehydrates from Supabase.
      partialize: (s) => ({
        activeAgent: s.activeAgent,
        activeConversationId: s.activeConversationId,
        activeAgentConversationId: s.activeAgentConversationId,
        activeSystemPrompt: s.activeSystemPrompt,
      }),
    },
  ),
);
