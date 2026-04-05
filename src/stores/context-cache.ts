import { create } from 'zustand';
import type { CacheEntry } from '../lib/kits/types';

// ---------------------------------------------------------------------------
// Context Cache Store — tracks Google AI cached content entries
// ---------------------------------------------------------------------------

interface ContextCacheState {
  activeCaches: CacheEntry[];
  isCaching: boolean;
  lastCacheTokenCount: number;
  estimatedSavings: number; // cumulative USD cents saved

  setActiveCache: (entry: CacheEntry) => void;
  invalidateCache: (cacheName: string) => void;
  clearAllCaches: () => void;
  updateSavings: (amount: number) => void;
  setCaching: (v: boolean) => void;
  getActiveCache: () => CacheEntry | undefined;
}

export const useContextCache = create<ContextCacheState>()((set, get) => ({
  activeCaches: [],
  isCaching: false,
  lastCacheTokenCount: 0,
  estimatedSavings: 0,

  setActiveCache: (entry) =>
    set((s) => {
      // Replace existing cache for same model, or add new
      const filtered = s.activeCaches.filter((c) => c.model !== entry.model);
      return {
        activeCaches: [...filtered, entry],
        lastCacheTokenCount: entry.tokenCount,
        isCaching: false,
      };
    }),

  invalidateCache: (cacheName) =>
    set((s) => ({
      activeCaches: s.activeCaches.filter((c) => c.cacheName !== cacheName),
    })),

  clearAllCaches: () =>
    set({ activeCaches: [], lastCacheTokenCount: 0 }),

  updateSavings: (amount) =>
    set((s) => ({ estimatedSavings: s.estimatedSavings + amount })),

  setCaching: (v) =>
    set({ isCaching: v }),

  getActiveCache: () => {
    const caches = get().activeCaches;
    // Return the most recently created cache that hasn't expired
    const now = new Date().toISOString();
    return caches.find((c) => c.expireTime > now);
  },
}));
