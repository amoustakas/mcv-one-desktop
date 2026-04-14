import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Local-only API key overrides.
 *
 * SECURITY NOTE: Keys stored here live in localStorage and are readable by any
 * script running on this origin. This is a DEV CONVENIENCE for when a user wants
 * to try out a different key without editing Vercel env vars. Production secrets
 * should always go through server-side env vars (VITE_*).
 *
 * UI must surface this trade-off clearly next to the input.
 */

export interface LocalApiKeyState {
  keys: Record<string, string>;
  setKey: (name: string, value: string) => void;
  removeKey: (name: string) => void;
  hasKey: (name: string) => boolean;
  clearAll: () => void;
}

export const useLocalApiKeys = create<LocalApiKeyState>()(
  persist(
    (set, get) => ({
      keys: {},
      setKey: (name, value) =>
        set((s) => ({ keys: { ...s.keys, [name]: value } })),
      removeKey: (name) =>
        set((s) => {
          const next = { ...s.keys };
          delete next[name];
          return { keys: next };
        }),
      hasKey: (name) => !!get().keys[name],
      clearAll: () => set({ keys: {} }),
    }),
    { name: 'mcv-local-api-keys' },
  ),
);

export type KeyProvenance = 'env' | 'local' | 'oauth' | 'unset';

export interface ApiKeyStatus {
  name: string;
  label: string;
  envPresent: boolean;
  localPresent: boolean;
  provenance: KeyProvenance;
}

export function resolveProvenance(
  envPresent: boolean,
  localPresent: boolean,
  oauthConnected?: boolean,
): KeyProvenance {
  if (oauthConnected) return 'oauth';
  if (localPresent) return 'local';
  if (envPresent) return 'env';
  return 'unset';
}
