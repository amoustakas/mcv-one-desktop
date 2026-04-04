import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ViewId =
  | 'command-center'
  | 'portfolio'
  | 'chat'
  | 'intelligence'
  | 'treasury'
  | 'ops'
  | 'engineering'
  | 'signals'
  | 'tasks'
  | 'crm'
  | 'forge'
  | 'docs'
  | 'ai-studio'
  | 'sessions'
  | 'settings'
  // Venture views
  | 'venture-dashboard'
  | 'venture-engineering'
  | 'venture-growth'
  | 'venture-operations'
  | 'venture-docs'
  | 'venture-forge'
  | 'venture-tasks'
  | 'venture-settings';

export type ContextMode = 'global' | 'venture';

interface NavigationState {
  mode: ContextMode;
  activeVenture: string | null;
  activeView: ViewId;
  previousView: ViewId | null;
  chatDocked: boolean;
  chatVenture: string;

  // Actions
  setView: (view: ViewId) => void;
  switchToGlobal: () => void;
  switchToVenture: (slug: string) => void;
  toggleChatDock: () => void;
  setChatVenture: (slug: string) => void;
}

export const useNavigation = create<NavigationState>()(
  persist(
    (set) => ({
      mode: 'global',
      activeVenture: null,
      activeView: 'command-center',
      previousView: null,
      chatDocked: true,
      chatVenture: 'mcv',

      setView: (view) =>
        set((s) => ({ activeView: view, previousView: s.activeView })),

      switchToGlobal: () =>
        set({
          mode: 'global',
          activeVenture: null,
          activeView: 'command-center',
        }),

      switchToVenture: (slug) =>
        set({
          mode: 'venture',
          activeVenture: slug,
          activeView: 'venture-dashboard',
          chatVenture: slug,
        }),

      toggleChatDock: () =>
        set((s) => ({ chatDocked: !s.chatDocked })),

      setChatVenture: (slug) =>
        set({ chatVenture: slug }),
    }),
    { name: 'mcv-nav' },
  ),
);
