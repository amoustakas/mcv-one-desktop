import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { KitInstance, KitToolSchema } from '../lib/kits/types';
import { getBuiltinKits, getToolsForVenture, buildKitInstructions } from '../lib/kits/loader';

// ---------------------------------------------------------------------------
// Kit Registry Store
// ---------------------------------------------------------------------------

interface KitState {
  /** All loaded kits keyed by kit ID */
  loadedKits: Record<string, KitInstance>;
  /** Whether builtin kits have been initialized */
  initialized: boolean;
  /** Whether preferences have been hydrated from Supabase */
  synced: boolean;

  /** Initialize with built-in kits (call once on app boot) */
  initBuiltins: () => void;
  /** Pull enable/disable preferences from Supabase for the signed-in user */
  syncFromSupabase: () => Promise<void>;
  /** Load a kit into the registry */
  loadKit: (kit: KitInstance) => void;
  /** Unload a kit by ID */
  unloadKit: (kitId: string) => void;
  /** Disable a kit (persists to Supabase) */
  disableKit: (kitId: string) => void;
  /** Enable a previously disabled kit (persists to Supabase) */
  enableKit: (kitId: string) => void;
  /** Get all tool schemas for a venture */
  getToolsForVenture: (ventureId: string) => KitToolSchema[];
  /** Get kit instructions string for system prompt */
  getKitInstructions: (ventureId: string) => string;
  /** Get all loaded kit instances as array */
  getLoadedKits: () => KitInstance[];
}

// Fire-and-forget persistence to Supabase via /api/user-kits.
// Uses the global fetch interceptor for Clerk token injection.
async function persistPref(kitId: string, enabled: boolean) {
  try {
    await fetch('/api/user-kits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set', kit_id: kitId, enabled }),
    });
  } catch {
    // Non-fatal — local state still reflects user intent.
  }
}

export const useKitStore = create<KitState>()(
  persist(
    (set, get) => ({
      loadedKits: {},
      initialized: false,
      synced: false,

      initBuiltins: () => {
        if (get().initialized) return;
        const kits: Record<string, KitInstance> = {};
        for (const kit of getBuiltinKits()) {
          kits[kit.manifest.id] = kit;
        }
        set({ loadedKits: { ...get().loadedKits, ...kits }, initialized: true });
      },

      syncFromSupabase: async () => {
        try {
          const res = await fetch('/api/user-kits');
          if (!res.ok) return;
          const data = await res.json();
          const prefs: Array<{ kit_id: string; enabled: boolean }> = data.kits || [];
          if (prefs.length === 0) {
            set({ synced: true });
            return;
          }
          set((s) => {
            const next = { ...s.loadedKits };
            for (const pref of prefs) {
              const kit = next[pref.kit_id];
              if (!kit) continue;
              next[pref.kit_id] = { ...kit, status: pref.enabled ? 'loaded' : 'disabled' };
            }
            return { loadedKits: next, synced: true };
          });
        } catch {
          // Network / auth failure — keep local state, retry next boot.
        }
      },

      loadKit: (kit) =>
        set((s) => ({
          loadedKits: { ...s.loadedKits, [kit.manifest.id]: kit },
        })),

      unloadKit: (kitId) =>
        set((s) => {
          const { [kitId]: _, ...rest } = s.loadedKits;
          return { loadedKits: rest };
        }),

      disableKit: (kitId) => {
        set((s) => {
          const kit = s.loadedKits[kitId];
          if (!kit) return s;
          return {
            loadedKits: {
              ...s.loadedKits,
              [kitId]: { ...kit, status: 'disabled' },
            },
          };
        });
        void persistPref(kitId, false);
      },

      enableKit: (kitId) => {
        set((s) => {
          const kit = s.loadedKits[kitId];
          if (!kit) return s;
          return {
            loadedKits: {
              ...s.loadedKits,
              [kitId]: { ...kit, status: 'loaded' },
            },
          };
        });
        void persistPref(kitId, true);
      },

      getToolsForVenture: (ventureId) => {
        const kits = Object.values(get().loadedKits);
        return getToolsForVenture(kits, ventureId);
      },

      getKitInstructions: (ventureId) => {
        const kits = Object.values(get().loadedKits);
        return buildKitInstructions(kits, ventureId);
      },

      getLoadedKits: () => Object.values(get().loadedKits),
    }),
    {
      name: 'mcv-kits',
      // Don't persist anything — handlers (functions) aren't serializable,
      // and builtins are re-registered on every boot via initBuiltins().
      partialize: () => ({}),
    },
  ),
);
