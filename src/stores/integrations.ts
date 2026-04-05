import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  EnrichedConnection,
  ConnectionFlowState,
  IntegrationCategory,
} from '../lib/types/oauth';

// ---------------------------------------------------------------------------
// Integrations Store — enterprise state management for all connections
// ---------------------------------------------------------------------------

type FilterState = 'all' | 'connected' | 'disconnected' | 'error';
type SortField = 'name' | 'status' | 'lastUsed' | 'category';
type ViewMode = 'grid' | 'list' | 'grouped';

interface IntegrationsState {
  // Connection registry
  connections: Record<string, EnrichedConnection>;

  // UI state
  activeTab: IntegrationCategory | 'all' | 'favorites' | 'mcp';
  filterState: FilterState;
  searchQuery: string;
  sortBy: SortField;
  viewMode: ViewMode;
  expandedProvider: string | null;
  detailPanel: string | null; // provider ID for slide-out detail
  favorites: string[]; // provider IDs

  // Actions — connection management
  setConnection: (id: string, conn: EnrichedConnection) => void;
  updateFlowState: (id: string, state: ConnectionFlowState, error?: string) => void;
  setTestResult: (id: string, result: { success: boolean; latencyMs: number }) => void;
  removeConnection: (id: string) => void;
  setConnections: (conns: Record<string, EnrichedConnection>) => void;

  // Actions — UI
  setActiveTab: (tab: IntegrationCategory | 'all' | 'favorites') => void;
  setFilterState: (filter: FilterState) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: SortField) => void;
  setViewMode: (mode: ViewMode) => void;
  setExpandedProvider: (id: string | null) => void;
  openDetail: (id: string) => void;
  closeDetail: () => void;
  toggleFavorite: (id: string) => void;

  // Derived
  getFilteredConnections: () => EnrichedConnection[];
  getByCategory: (cat: IntegrationCategory) => EnrichedConnection[];
  getCategoryCounts: () => Record<string, number>;
  getHealthSummary: () => { total: number; active: number; degraded: number; error: number };
}

export const useIntegrations = create<IntegrationsState>()(
  persist(
    (set, get) => ({
      connections: {},
      activeTab: 'all',
      filterState: 'all',
      searchQuery: '',
      sortBy: 'category',
      viewMode: 'grouped',
      expandedProvider: null,
      detailPanel: null,
      favorites: [],

      // Connection management
      setConnection: (id, conn) =>
        set((s) => ({ connections: { ...s.connections, [id]: conn } })),

      updateFlowState: (id, state, error) =>
        set((s) => {
          const conn = s.connections[id];
          if (!conn) return s;
          return {
            connections: {
              ...s.connections,
              [id]: {
                ...conn,
                flowState: state,
                connected: state === 'active' || state === 'refreshing' || state === 'degraded',
                errorMessage: error || (state === 'active' ? undefined : conn.errorMessage),
                consecutiveFailures: state === 'active' ? 0 : conn.consecutiveFailures,
              },
            },
          };
        }),

      setTestResult: (id, result) =>
        set((s) => {
          const conn = s.connections[id];
          if (!conn) return s;
          return {
            connections: {
              ...s.connections,
              [id]: {
                ...conn,
                lastTestResult: { ...result, testedAt: new Date().toISOString() },
                consecutiveFailures: result.success ? 0 : conn.consecutiveFailures + 1,
                flowState: result.success
                  ? 'active'
                  : conn.consecutiveFailures >= 2 ? 'degraded' : conn.flowState,
              },
            },
          };
        }),

      removeConnection: (id) =>
        set((s) => {
          const { [id]: _, ...rest } = s.connections;
          return { connections: rest };
        }),

      setConnections: (conns) => set({ connections: conns }),

      // UI actions
      setActiveTab: (tab) => set({ activeTab: tab }),
      setFilterState: (filter) => set({ filterState: filter }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSortBy: (sort) => set({ sortBy: sort }),
      setViewMode: (mode) => set({ viewMode: mode }),
      setExpandedProvider: (id) => set({ expandedProvider: id }),
      openDetail: (id) => set({ detailPanel: id }),
      closeDetail: () => set({ detailPanel: null }),
      toggleFavorite: (id) =>
        set((s) => {
          const favs = s.favorites.includes(id)
            ? s.favorites.filter((f) => f !== id)
            : [...s.favorites, id];
          // Also update the connection object
          const conn = s.connections[id];
          const connections = conn
            ? { ...s.connections, [id]: { ...conn, favorite: !conn.favorite } }
            : s.connections;
          return { favorites: favs, connections };
        }),

      // Derived
      getFilteredConnections: () => {
        const s = get();
        let results = Object.values(s.connections);

        // Tab filter
        if (s.activeTab === 'favorites') {
          results = results.filter((c) => s.favorites.includes(c.provider));
        } else if (s.activeTab !== 'all') {
          results = results.filter((c) => c.category === s.activeTab);
        }

        // State filter
        if (s.filterState === 'connected') results = results.filter((c) => c.connected);
        if (s.filterState === 'disconnected') results = results.filter((c) => !c.connected);
        if (s.filterState === 'error') results = results.filter((c) => c.flowState === 'error' || c.flowState === 'expired' || c.flowState === 'degraded');

        // Search
        if (s.searchQuery) {
          const q = s.searchQuery.toLowerCase();
          results = results.filter((c) =>
            c.name.toLowerCase().includes(q) ||
            c.description.toLowerCase().includes(q) ||
            c.category.toLowerCase().includes(q) ||
            c.consumers.some((cn) => cn.toLowerCase().includes(q)),
          );
        }

        // Sort
        results.sort((a, b) => {
          switch (s.sortBy) {
            case 'name': return a.name.localeCompare(b.name);
            case 'status': return (a.connected ? 0 : 1) - (b.connected ? 0 : 1);
            case 'lastUsed': return (b.lastUsedAt ?? '').localeCompare(a.lastUsedAt ?? '');
            case 'category': return a.category.localeCompare(b.category);
            default: return 0;
          }
        });

        return results;
      },

      getByCategory: (cat) =>
        Object.values(get().connections).filter((c) => c.category === cat),

      getCategoryCounts: () => {
        const counts: Record<string, number> = { all: 0, favorites: 0 };
        const s = get();
        for (const conn of Object.values(s.connections)) {
          counts.all++;
          counts[conn.category] = (counts[conn.category] ?? 0) + 1;
          if (s.favorites.includes(conn.provider)) counts.favorites++;
        }
        return counts;
      },

      getHealthSummary: () => {
        const conns = Object.values(get().connections);
        return {
          total: conns.length,
          active: conns.filter((c) => c.flowState === 'active').length,
          degraded: conns.filter((c) => c.flowState === 'degraded' || c.flowState === 'refreshing').length,
          error: conns.filter((c) => c.flowState === 'error' || c.flowState === 'expired' || c.flowState === 'revoked').length,
        };
      },
    }),
    {
      name: 'mcv-integrations',
      partialize: (s) => ({
        activeTab: s.activeTab,
        filterState: s.filterState,
        sortBy: s.sortBy,
        viewMode: s.viewMode,
        favorites: s.favorites,
      }),
    },
  ),
);
