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

  /** Initialize with built-in kits (call once on app boot) */
  initBuiltins: () => void;
  /** Load a kit into the registry */
  loadKit: (kit: KitInstance) => void;
  /** Unload a kit by ID */
  unloadKit: (kitId: string) => void;
  /** Disable a kit (keeps it loaded but inactive) */
  disableKit: (kitId: string) => void;
  /** Enable a previously disabled kit */
  enableKit: (kitId: string) => void;
  /** Get all tool schemas for a venture */
  getToolsForVenture: (ventureId: string) => KitToolSchema[];
  /** Get kit instructions string for system prompt */
  getKitInstructions: (ventureId: string) => string;
  /** Get all loaded kit instances as array */
  getLoadedKits: () => KitInstance[];
}

export const useKitStore = create<KitState>()(
  persist(
    (set, get) => ({
      loadedKits: {},
      initialized: false,

      initBuiltins: () => {
        if (get().initialized) return;
        const kits: Record<string, KitInstance> = {};
        for (const kit of getBuiltinKits()) {
          kits[kit.manifest.id] = kit;
        }
        set({ loadedKits: { ...get().loadedKits, ...kits }, initialized: true });
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

      disableKit: (kitId) =>
        set((s) => {
          const kit = s.loadedKits[kitId];
          if (!kit) return s;
          return {
            loadedKits: {
              ...s.loadedKits,
              [kitId]: { ...kit, status: 'disabled' },
            },
          };
        }),

      enableKit: (kitId) =>
        set((s) => {
          const kit = s.loadedKits[kitId];
          if (!kit) return s;
          return {
            loadedKits: {
              ...s.loadedKits,
              [kitId]: { ...kit, status: 'loaded' },
            },
          };
        }),

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
      // Only persist kit IDs and status, not handlers (functions aren't serializable)
      partialize: (state) => ({
        initialized: state.initialized,
        // We don't persist loadedKits because handlers (functions) can't be serialized.
        // Built-in kits are re-initialized on boot via initBuiltins().
      }),
    },
  ),
);
