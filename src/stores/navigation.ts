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
  // Split panel
  splitView: ViewId | null;
  splitRatio: number; // 0.3 to 0.7

  setView: (view: ViewId) => void;
  switchToGlobal: () => void;
  switchToVenture: (slug: string) => void;
  toggleChatDock: () => void;
  setChatVenture: (slug: string) => void;
  // Split actions
  openSplit: (view: ViewId) => void;
  closeSplit: () => void;
  setSplitRatio: (ratio: number) => void;
  toggleSplit: () => void;
  swapPanels: () => void;
}

export const useNavigation = create<NavigationState>()(
  persist(
    (set, get) => ({
      mode: 'global',
      activeVenture: null,
      activeView: 'command-center',
      previousView: null,
      chatDocked: true,
      chatVenture: 'mcv',
      splitView: null,
      splitRatio: 0.5,

      setView: (view) =>
        set((s) => ({ activeView: view, previousView: s.activeView })),

      switchToGlobal: () =>
        set({
          mode: 'global',
          activeVenture: null,
          activeView: 'command-center',
          splitView: null,
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

      openSplit: (view) =>
        set({ splitView: view }),

      closeSplit: () =>
        set({ splitView: null }),

      setSplitRatio: (ratio) =>
        set({ splitRatio: Math.max(0.25, Math.min(0.75, ratio)) }),

      toggleSplit: () => {
        const s = get();
        if (s.splitView) {
          set({ splitView: null });
        } else if (s.previousView && s.previousView !== s.activeView) {
          set({ splitView: s.previousView });
        } else {
          set({ splitView: 'chat' });
        }
      },

      swapPanels: () =>
        set((s) => s.splitView ? { activeView: s.splitView, splitView: s.activeView } : {}),
    }),
    { name: 'mcv-nav' },
  ),
);
