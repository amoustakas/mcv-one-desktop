import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MemoryEntry, SessionEvent } from '../lib/types/memory';

interface MemoryState {
  /** Cached project memory entries */
  memories: MemoryEntry[];
  /** Cached session events */
  sessionEvents: SessionEvent[];
  /** Currently active session ID for event tracking */
  activeSessionId: string | null;
  /** Loading state */
  isLoading: boolean;

  // Actions
  setMemories: (memories: MemoryEntry[]) => void;
  setSessionEvents: (events: SessionEvent[]) => void;
  setActiveSessionId: (id: string | null) => void;
  addMemory: (entry: MemoryEntry) => void;
  removeMemory: (id: string) => void;
  addEvent: (event: SessionEvent) => void;
  setLoading: (loading: boolean) => void;
}

export const useMemoryStore = create<MemoryState>()(
  persist(
    (set) => ({
      memories: [],
      sessionEvents: [],
      activeSessionId: null,
      isLoading: false,

      setMemories: (memories) => set({ memories }),

      setSessionEvents: (sessionEvents) => set({ sessionEvents }),

      setActiveSessionId: (activeSessionId) => set({ activeSessionId }),

      addMemory: (entry) =>
        set((s) => {
          // Replace if same key exists, otherwise append
          const exists = s.memories.findIndex((m) => m.key === entry.key);
          if (exists >= 0) {
            const updated = [...s.memories];
            updated[exists] = entry;
            return { memories: updated };
          }
          return { memories: [entry, ...s.memories] };
        }),

      removeMemory: (id) =>
        set((s) => ({ memories: s.memories.filter((m) => m.id !== id) })),

      addEvent: (event) =>
        set((s) => ({ sessionEvents: [event, ...s.sessionEvents] })),

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'mcv-memory',
      partialize: (state) => ({
        activeSessionId: state.activeSessionId,
      }),
    },
  ),
);
