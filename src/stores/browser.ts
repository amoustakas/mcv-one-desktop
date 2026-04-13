import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BrowserTab {
  id: string;
  sessionId: string | null;
  url: string;
  title: string;
  loading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
}

export interface Bookmark {
  url: string;
  title: string;
  addedAt: number;
}

export interface HistoryEntry {
  url: string;
  title: string;
  visitedAt: number;
}

interface BrowserState {
  tabs: BrowserTab[];
  activeTabId: string | null;
  sidebarOpen: boolean;
  sidebarMode: 'chat' | 'reader' | 'extract';
  bookmarks: Bookmark[];
  history: HistoryEntry[];

  // Actions
  createTab: (url?: string) => string;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTab: (tabId: string, patch: Partial<BrowserTab>) => void;
  toggleSidebar: () => void;
  setSidebarMode: (mode: 'chat' | 'reader' | 'extract') => void;
  addBookmark: (url: string, title: string) => void;
  removeBookmark: (url: string) => void;
  isBookmarked: (url: string) => boolean;
  addHistoryEntry: (url: string, title: string) => void;
  getActiveTab: () => BrowserTab | undefined;
}

function makeTabId(): string {
  return 'tab_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

const DEFAULT_URL = 'about:blank';

export const useBrowserStore = create<BrowserState>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTabId: null,
      sidebarOpen: false,
      sidebarMode: 'chat',
      bookmarks: [],
      history: [],

      createTab: (url?: string) => {
        const id = makeTabId();
        const tab: BrowserTab = {
          id,
          sessionId: null,
          url: url || DEFAULT_URL,
          title: url ? '' : 'New Tab',
          loading: false,
          canGoBack: false,
          canGoForward: false,
        };
        set(s => ({ tabs: [...s.tabs, tab], activeTabId: id }));
        return id;
      },

      closeTab: (tabId: string) => {
        set(s => {
          const idx = s.tabs.findIndex(t => t.id === tabId);
          const newTabs = s.tabs.filter(t => t.id !== tabId);
          let newActiveId = s.activeTabId;
          if (s.activeTabId === tabId) {
            if (newTabs.length === 0) {
              newActiveId = null;
            } else {
              newActiveId = newTabs[Math.min(idx, newTabs.length - 1)].id;
            }
          }
          return { tabs: newTabs, activeTabId: newActiveId };
        });
      },

      setActiveTab: (tabId: string) => set({ activeTabId: tabId }),

      updateTab: (tabId: string, patch: Partial<BrowserTab>) => {
        set(s => ({
          tabs: s.tabs.map(t => t.id === tabId ? { ...t, ...patch } : t),
        }));
      },

      toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),

      setSidebarMode: (mode) => set({ sidebarMode: mode, sidebarOpen: true }),

      addBookmark: (url: string, title: string) => {
        set(s => {
          if (s.bookmarks.some(b => b.url === url)) return s;
          return { bookmarks: [...s.bookmarks, { url, title, addedAt: Date.now() }] };
        });
      },

      removeBookmark: (url: string) => {
        set(s => ({ bookmarks: s.bookmarks.filter(b => b.url !== url) }));
      },

      isBookmarked: (url: string) => get().bookmarks.some(b => b.url === url),

      addHistoryEntry: (url: string, title: string) => {
        if (!url || url === 'about:blank') return;
        set(s => ({
          history: [{ url, title, visitedAt: Date.now() }, ...s.history].slice(0, 200),
        }));
      },

      getActiveTab: () => {
        const s = get();
        return s.tabs.find(t => t.id === s.activeTabId);
      },
    }),
    {
      name: 'mcv-browser',
      partialize: (s) => ({
        bookmarks: s.bookmarks,
        history: s.history.slice(0, 50),
        sidebarOpen: s.sidebarOpen,
      }),
    }
  )
);
