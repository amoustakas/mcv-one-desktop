import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AgentSession, AgentDefinition } from '../lib/naos/types';

interface NAOSState {
  activeAgentId: string | null;  // null = auto-route via Aegis
  sessions: Record<string, AgentSession>;
  agentOverrides: Record<string, Partial<AgentDefinition>>;  // user customization

  setActiveAgent: (id: string | null) => void;
  startSession: (session: AgentSession) => void;
  endSession: (sessionId: string, status?: AgentSession['status']) => void;
  updateSession: (sessionId: string, updates: Partial<AgentSession>) => void;
  setAgentOverride: (agentId: string, override: Partial<AgentDefinition>) => void;
  clearOverride: (agentId: string) => void;
}

export const useNAOSStore = create<NAOSState>()(
  persist(
    (set) => ({
      activeAgentId: null,
      sessions: {},
      agentOverrides: {},

      setActiveAgent: (id) => set({ activeAgentId: id }),

      startSession: (session) =>
        set((s) => ({ sessions: { ...s.sessions, [session.id]: session } })),

      endSession: (sessionId, status = 'complete') =>
        set((s) => {
          const existing = s.sessions[sessionId];
          if (!existing) return s;
          return {
            sessions: {
              ...s.sessions,
              [sessionId]: { ...existing, status, endedAt: Date.now() },
            },
          };
        }),

      updateSession: (sessionId, updates) =>
        set((s) => {
          const existing = s.sessions[sessionId];
          if (!existing) return s;
          return {
            sessions: {
              ...s.sessions,
              [sessionId]: { ...existing, ...updates },
            },
          };
        }),

      setAgentOverride: (agentId, override) =>
        set((s) => ({
          agentOverrides: { ...s.agentOverrides, [agentId]: override },
        })),

      clearOverride: (agentId) =>
        set((s) => {
          const { [agentId]: _, ...rest } = s.agentOverrides;
          return { agentOverrides: rest };
        }),
    }),
    {
      name: 'mcv-naos',
      partialize: (s) => ({
        activeAgentId: s.activeAgentId,
        agentOverrides: s.agentOverrides,
        // Don't persist sessions (ephemeral)
      }),
    },
  ),
);
