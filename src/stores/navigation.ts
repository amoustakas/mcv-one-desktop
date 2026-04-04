import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ViewId =
  // Command
  | 'command-center'
  | 'portfolio'
  | 'chat'
  // Business Intelligence
  | 'intelligence'
  | 'treasury'
  | 'signals'
  // Engineering
  | 'engineering'
  | 'ops'
  | 'forge'
  | 'sessions'
  | 'war-room'
  // Growth & Marketing
  | 'crm'
  | 'growth'
  // Operations
  | 'tasks'
  | 'docs'
  // Tools & AI
  | 'ai-studio'
  | 'prompt-composer'
  // System
  | 'settings'
  // Venture views
  | 'venture-dashboard'
  | 'venture-profile'
  | 'venture-engineering'
  | 'venture-growth'
  | 'venture-operations'
  | 'venture-docs'
  | 'venture-forge'
  | 'venture-tasks'
  | 'venture-settings'
  | 'venture-onboarding';

export type ContextMode = 'global' | 'venture';

interface NavigationState {
  mode: ContextMode;
  activeVenture: string | null;
  activeView: ViewId;
  previousView: ViewId | null;
  chatDocked: boolean;
  chatVenture: string;

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
