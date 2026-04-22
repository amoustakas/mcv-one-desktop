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
  | 'comms-hub'
  // Operations
  | 'tasks'
  | 'docs'
  | 'blog'
  | 'venture-site'
  | 'announcements'
  | 'taxonomy'
  // Tools & AI
  | 'ai-studio'
  | 'prompt-composer'
  | 'factory-console'
  // System
  | 'team'
  | 'settings'
  // Venture views
  | 'ventures-index'
  | 'venture-detail'
  | 'venture-wizard'
  | 'department-portfolio'
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
  // Device views
  | 'device-hub'
  | 'stream-deck'
  | 'audio-router'
  | 'connected-sessions'
  // Kit views
  | 'kit-store'
  | 'kit-studio'
  // System views
  | 'memory'
  | 'pipeline'
  // Operator views
  | 'control-room'
  // Files & Storage
  | 'files'
  | 'venture-workspace'
  // AI Media Studios
  | 'voice-studio'
  | 'video-studio'
  | 'creative-canvas'
  | 'ad-studio'
  // Commerce views (global)
  | 'commerce-overview'
  | 'commerce-products'
  | 'commerce-subscriptions'
  | 'commerce-invoices'
  | 'commerce-orders'
  | 'commerce-credits'
  | 'commerce-loans'
  | 'commerce-tax'
  | 'commerce-customers'
  | 'commerce-inventory'
  | 'commerce-fulfillment'
  | 'commerce-discounts'
  | 'commerce-reviews'
  | 'commerce-gift-cards'
  | 'commerce-analytics'
  | 'commerce-shop-settings'
  // Commerce views (venture)
  | 'venture-commerce'
  | 'venture-products'
  | 'venture-subscriptions'
  // Financials views (global)
  | 'financials-dashboard'
  | 'financials-statements'
  | 'financials-cost-intelligence'
  | 'financials-ledger'
  | 'financials-reporting'
  // Financials views (venture)
  | 'venture-financials'
  // Creator views
  | 'creator-hub'
  | 'creator-royalties'
  | 'creator-escrow'
  // Checkout view
  | 'checkout'
  // NAOS Command
  | 'naos-command'
  // Browser & YouTube
  | 'browser'
  | 'youtube-player'
  // Google Workspace
  | 'gmail'
  | 'calendar'
  | 'drive'
  | 'sheets'
  | 'google-docs'
  | 'google-tasks'
  // Contact Center + Compliance
  | 'contact-center'
  | 'compliance-hub'
  // Knowledge Hub
  | 'knowledge-hub'
  | 'audit-log'
  // Epic pipeline (NAOS-driven build flywheel)
  | 'epics'
  | 'venture-epics'
  // Per-venture integrations panel (Stripe Connect, Plaid, R2, Comms, etc.)
  | 'venture-integrations'
  // EdgeIQ Capital — cap table, rounds, investor portal admin, launchpad
  | 'capital'
  | 'capital-venture'
  | 'capital-round-detail'
  | 'capital-contact-detail'
  | 'capital-launchpad-admin'
  | 'capital-foundation'
  | 'distributions'
  // Consumer-facing investor money-in flow (T6.6)
  | 'invest-rounds'
  | 'agents'
  | 'agent-profile'
  | 'agent-chat'
  | 'ladder'
  | 'hit-squad'
  | 'platform-api-keys'
  // Phase 2 — Prospect funnel + onboarding admin
  | 'prospects'
  | 'prospect-profile'
  // People — active human tracking (net-new, distinct from onboarding funnel
  // and distinct from the DevOps 'pipeline' view)
  | 'people'
  // Departmental Command Suites (global toolbox + dedicated per-department surfaces)
  | 'suite-command-bridge'
  | 'suite-creative-studio'
  | 'suite-developer-ops'
  | 'suite-marketing-growth'
  | 'suite-commerce-finance'
  | 'suite-comms-hub'
  | 'suite-knowledge-research'
  | 'suite-voice-studio'
  | 'suite-strategy-intelligence'
  | 'suite-ops-infra'
  | 'suite-ventures-workspace'
  | 'suite-arcade-lab';

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
  splitDirection: 'horizontal' | 'vertical'; // horizontal = side-by-side, vertical = top-bottom
  // History stack for back/forward
  history: ViewId[];
  historyIndex: number;
  // One-shot detail-tab request — consumed by VentureDetailView then cleared.
  // Lets a caller say "navigate to venture-detail and open the Docs tab".
  pendingDetailTab: string | null;
  // Phase 2 — selected prospect journey for ProspectProfileView. Set by
  // ProspectsView row click, consumed by ProspectProfileView.
  selectedProspectJourneyId: string | null;
  // Active agent handle for agent-profile view (and future chat routing).
  activeAgentHandle: string | null;
  // Deep-link pointers: set by ProspectProfileView "Open in X" CTAs,
  // consumed by the destination view on mount, then cleared.
  selectedCrmContactId: string | null;
  selectedCapitalContactId: string | null;

  setView: (view: ViewId) => void;
  selectProspectJourney: (id: string) => void;
  openAgentProfile: (handle: string) => void;
  openCrmContact: (contactId: string) => void;
  openCapitalContact: (contactId: string) => void;
  /** Consume + clear the CRM deep-link pointer. Returns the stashed id. */
  consumeCrmContactId: () => string | null;
  /** Consume + clear the Capital deep-link pointer. Returns the stashed id. */
  consumeCapitalContactId: () => string | null;
  openVentureDetailTab: (tab: string) => void;
  consumePendingDetailTab: () => string | null;
  switchToGlobal: () => void;
  switchToVenture: (slug: string) => void;
  toggleChatDock: () => void;
  setChatVenture: (slug: string) => void;
  // Split actions
  openSplit: (view: ViewId, direction?: 'horizontal' | 'vertical') => void;
  closeSplit: () => void;
  setSplitRatio: (ratio: number) => void;
  setSplitDirection: (dir: 'horizontal' | 'vertical') => void;
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
  growth: 'Growth', 'comms-hub': 'Communications Hub', tasks: 'Tasks', docs: 'Documents',
  'ai-studio': 'AI Studio', 'prompt-composer': 'Prompt Composer', 'factory-console': 'Factory Console',
  team: 'Team', settings: 'Settings', 'kit-store': 'Kit Store', 'kit-studio': 'Kit Studio',
  memory: 'Memory Hub', pipeline: 'Pipeline', 'control-room': 'Control Room',
  'device-hub': 'Device Hub', 'stream-deck': 'Stream Deck',
  'audio-router': 'Audio Router', 'connected-sessions': 'Connected Sessions',
  'venture-dashboard': 'Dashboard', 'venture-profile': 'Profile',
  'venture-engineering': 'Engineering', 'venture-growth': 'Growth',
  'venture-operations': 'Operations', 'venture-docs': 'Documents',
  'venture-forge': 'Forge', 'venture-tasks': 'Tasks',
  'venture-settings': 'Settings', 'venture-onboarding': 'Onboarding',
  files: 'Files', 'venture-workspace': 'Workspace', 'ad-studio': 'Ad Studio',
  'voice-studio': 'Voice Studio', 'video-studio': 'Video Studio', 'creative-canvas': 'Creative Canvas',
  'commerce-overview': 'Commerce Overview', 'commerce-products': 'Products',
  'commerce-subscriptions': 'Subscriptions', 'commerce-invoices': 'Invoices',
  'commerce-orders': 'Orders', 'commerce-credits': 'Credits & Wallets',
  'commerce-loans': 'Loans', 'commerce-tax': 'Tax',
  'commerce-customers': 'Customers', 'commerce-inventory': 'Inventory',
  'commerce-fulfillment': 'Fulfillment', 'commerce-discounts': 'Discounts',
  'commerce-reviews': 'Reviews', 'commerce-gift-cards': 'Gift Cards',
  'commerce-analytics': 'Commerce Analytics', 'commerce-shop-settings': 'Shop Settings',
  'venture-commerce': 'Commerce', 'venture-products': 'Products', 'venture-subscriptions': 'Subscriptions',
  'financials-dashboard': 'Financials', 'financials-statements': 'Statements',
  'financials-cost-intelligence': 'Cost Intelligence', 'financials-ledger': 'Ledger',
  'financials-reporting': 'Reporting',
  'venture-financials': 'Financials',
  'creator-hub': 'Creator Hub', 'creator-royalties': 'Royalties', 'creator-escrow': 'Escrow',
  'naos-command': 'NAOS Command',
  browser: 'Browser',
  'youtube-player': 'YouTube',
  gmail: 'Gmail', calendar: 'Calendar', drive: 'Drive',
  sheets: 'Sheets', 'google-docs': 'Docs', 'google-tasks': 'Tasks',
  'contact-center': 'Contact Center', 'compliance-hub': 'Compliance',
  'knowledge-hub': 'Knowledge Hub',
  'audit-log': 'Audit Log',
  capital: 'Capital',
  'capital-venture': 'Capital',
  'capital-round-detail': 'Round',
  'capital-contact-detail': 'Investor',
  'capital-launchpad-admin': 'Launchpad',
  'capital-foundation': 'Foundation',
  distributions: 'Distributions',
  'invest-rounds': 'Invest',
  agents: 'The Team',
  'agent-profile': 'Agent',
  'agent-chat': 'Agent Chat',
  ladder: 'Ladder',
  'platform-api-keys': 'API Keys',
  prospects: 'Onboarding Funnel',
  'prospect-profile': 'Prospect',
  people: 'People',
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
      splitDirection: 'horizontal',
      history: ['command-center'],
      historyIndex: 0,
      pendingDetailTab: null,
      selectedProspectJourneyId: null,
      activeAgentHandle: null,
      selectedCrmContactId: null,
      selectedCapitalContactId: null,

      openCrmContact: (contactId) =>
        set((s) => {
          const newHistory = [...s.history.slice(0, s.historyIndex + 1), 'crm' as ViewId].slice(-50);
          return {
            activeView: 'crm' as ViewId,
            previousView: s.activeView,
            selectedCrmContactId: contactId,
            history: newHistory,
            historyIndex: newHistory.length - 1,
          };
        }),

      openCapitalContact: (contactId) =>
        set((s) => {
          const newHistory = [...s.history.slice(0, s.historyIndex + 1), 'capital-foundation' as ViewId].slice(-50);
          return {
            activeView: 'capital-foundation' as ViewId,
            previousView: s.activeView,
            selectedCapitalContactId: contactId,
            history: newHistory,
            historyIndex: newHistory.length - 1,
          };
        }),

      consumeCrmContactId: () => {
        const id = get().selectedCrmContactId;
        if (id) set({ selectedCrmContactId: null });
        return id;
      },

      consumeCapitalContactId: () => {
        const id = get().selectedCapitalContactId;
        if (id) set({ selectedCapitalContactId: null });
        return id;
      },

      selectProspectJourney: (id) =>
        set((s) => {
          const newHistory = [...s.history.slice(0, s.historyIndex + 1), 'prospect-profile' as ViewId].slice(-50);
          return {
            activeView: 'prospect-profile' as ViewId,
            previousView: s.activeView,
            selectedProspectJourneyId: id,
            history: newHistory,
            historyIndex: newHistory.length - 1,
          };
        }),

      openAgentProfile: (handle: string) =>
        set((s) => {
          const newHistory = [...s.history.slice(0, s.historyIndex + 1), 'agent-profile' as ViewId].slice(-50);
          return {
            activeView: 'agent-profile' as ViewId,
            previousView: s.activeView,
            activeAgentHandle: handle,
            history: newHistory,
            historyIndex: newHistory.length - 1,
          };
        }),

      openVentureDetailTab: (tab) =>
        set((s) => {
          const newHistory = [...s.history.slice(0, s.historyIndex + 1), 'venture-detail' as ViewId].slice(-50);
          return {
            activeView: 'venture-detail',
            previousView: s.activeView,
            pendingDetailTab: tab,
            history: newHistory,
            historyIndex: newHistory.length - 1,
          };
        }),

      consumePendingDetailTab: () => {
        const pending = get().pendingDetailTab;
        if (pending) set({ pendingDetailTab: null });
        return pending;
      },

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

      openSplit: (view, direction) =>
        set((s) => ({ splitView: view, splitDirection: direction || s.splitDirection })),

      closeSplit: () =>
        set({ splitView: null }),

      setSplitRatio: (ratio) =>
        set({ splitRatio: Math.max(0.15, Math.min(0.85, ratio)) }),

      setSplitDirection: (dir) =>
        set({ splitDirection: dir }),

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
        splitDirection: s.splitDirection,
      }),
    },
  ),
);
