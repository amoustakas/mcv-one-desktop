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
  | 'team'
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
  | 'venture-onboarding'
  // Kit views
  | 'kit-store'
  | 'kit-studio';

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
  // History stack for back/forward
  history: ViewId[];
  historyIndex: number;

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
  // History navigation
  goBack: () => void;
  goForward: () => void;
  canGoBack: () => boolean;
  canGoForward: () => boolean;
  // Breadcrumb
  getBreadcrumbs: () => { label: string; viewId?: ViewId }[];
}

// View labels for breadcrumbs
const VIEW_LABELS: Record<string, string> = {
  'command-center': 'Command Center', portfolio: 'Portfolio', chat: 'Chat',
  intelligence: 'Intelligence', treasury: 'Treasury', signals: 'Signals',
  engineering: 'Engineering', ops: 'Operations', forge: 'Forge',
  sessions: 'Sessions', 'war-room': 'War Room', crm: 'CRM',
  growth: 'Growth', tasks: 'Tasks', docs: 'Documents',
  'ai-studio': 'AI Studio', 'prompt-composer': 'Prompt Composer',
  team: 'Team', settings: 'Settings', 'kit-store': 'Kit Store', 'kit-studio': 'Kit Studio',
  'venture-dashboard': 'Dashboard', 'venture-profile': 'Profile',
  'venture-engineering': 'Engineering', 'venture-growth': 'Growth',
  'venture-operations': 'Operations', 'venture-docs': 'Documents',
  'venture-forge': 'Forge', 'venture-tasks': 'Tasks',
  'venture-settings': 'Settings', 'venture-onboarding': 'Onboarding',
};

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
      history: ['command-center'],
      historyIndex: 0,

      setView: (view) =>
        set((s) => {
          // Push to history (trim forward entries if navigating from middle)
          const newHistory = [...s.history.slice(0, s.historyIndex + 1), view].slice(-50);
          return {
            activeView: view,
            previousView: s.activeView,
            history: newHistory,
            historyIndex: newHistory.length - 1,
          };
        }),

      switchToGlobal: () =>
        set((s) => {
          const newHistory = [...s.history.slice(0, s.historyIndex + 1), 'command-center' as ViewId].slice(-50);
          return {
            mode: 'global',
            activeVenture: null,
            activeView: 'command-center',
            splitView: null,
            history: newHistory,
            historyIndex: newHistory.length - 1,
          };
        }),

      switchToVenture: (slug) =>
        set((s) => {
          const newHistory = [...s.history.slice(0, s.historyIndex + 1), 'venture-dashboard' as ViewId].slice(-50);
          return {
            mode: 'venture',
            activeVenture: slug,
            activeView: 'venture-dashboard',
            chatVenture: slug,
            history: newHistory,
            historyIndex: newHistory.length - 1,
          };
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

      // History navigation
      goBack: () => {
        const s = get();
        if (s.historyIndex > 0) {
          const newIndex = s.historyIndex - 1;
          set({ activeView: s.history[newIndex], historyIndex: newIndex });
        }
      },

      goForward: () => {
        const s = get();
        if (s.historyIndex < s.history.length - 1) {
          const newIndex = s.historyIndex + 1;
          set({ activeView: s.history[newIndex], historyIndex: newIndex });
        }
      },

      canGoBack: () => get().historyIndex > 0,
      canGoForward: () => {
        const s = get();
        return s.historyIndex < s.history.length - 1;
      },

      // Breadcrumbs
      getBreadcrumbs: () => {
        const s = get();
        const crumbs: { label: string; viewId?: ViewId }[] = [];

        if (s.mode === 'venture' && s.activeVenture) {
          crumbs.push({ label: 'MCV One', viewId: 'command-center' });
          crumbs.push({ label: s.activeVenture.toUpperCase(), viewId: 'venture-dashboard' });
        } else {
          crumbs.push({ label: 'MCV One' });
        }

        crumbs.push({ label: VIEW_LABELS[s.activeView] || s.activeView });
        return crumbs;
      },
    }),
    {
      name: 'mcv-nav',
      partialize: (s) => ({
        mode: s.mode,
        activeVenture: s.activeVenture,
        activeView: s.activeView,
        chatDocked: s.chatDocked,
        chatVenture: s.chatVenture,
        splitView: s.splitView,
        splitRatio: s.splitRatio,
      }),
    },
  ),
);
