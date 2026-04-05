import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CommandState {
  isOpen: boolean;
  query: string;
  recentCommands: string[];
  favoriteCommands: string[];

  open: () => void;
  close: () => void;
  toggle: () => void;
  setQuery: (query: string) => void;
  addRecent: (command: string) => void;
  toggleFavorite: (command: string) => void;
  clearRecents: () => void;
}

export const useCommandStore = create<CommandState>()(
  persist(
    (set) => ({
      isOpen: false,
      query: '',
      recentCommands: [],
      favoriteCommands: [],

      open: () => set({ isOpen: true, query: '' }),
      close: () => set({ isOpen: false, query: '' }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen, query: s.isOpen ? '' : s.query })),
      setQuery: (query) => set({ query }),

      addRecent: (command) =>
        set((s) => {
          const filtered = s.recentCommands.filter(c => c !== command);
          return { recentCommands: [command, ...filtered].slice(0, 20) };
        }),

      toggleFavorite: (command) =>
        set((s) => {
          const isFav = s.favoriteCommands.includes(command);
          return {
            favoriteCommands: isFav
              ? s.favoriteCommands.filter(c => c !== command)
              : [...s.favoriteCommands, command],
          };
        }),

      clearRecents: () => set({ recentCommands: [] }),
    }),
    {
      name: 'mcv-commands',
      partialize: (s) => ({ recentCommands: s.recentCommands, favoriteCommands: s.favoriteCommands }),
    },
  ),
);
