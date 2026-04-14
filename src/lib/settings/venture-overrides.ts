import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Per-venture setting overrides. A venture setting is:
 *   - UNSET  → inherit from global
 *   - SET    → override global for that venture only
 *
 * Example: global TTS voice = "alloy", but BetEdge venture overrides to "sage".
 */

export interface VentureSettingOverrides {
  // Notifications
  notifications?: boolean;
  emailDigest?: boolean;
  slackWebhook?: boolean;
  incidentAlerts?: boolean;
  revenueMilestones?: boolean;

  // AI
  preferredModel?: string;
  maxTokens?: number;

  // Voice
  ttsVoice?: string;

  // Security
  twoFactor?: boolean;
  ipAllowlist?: boolean;
  soc2Mode?: boolean;

  // API keys (local-only override — NEVER use this for production secrets)
  apiKeysLocal?: Record<string, string>;
}

interface VentureOverrideState {
  overrides: Record<string, VentureSettingOverrides>;

  getOverride: (ventureId: string) => VentureSettingOverrides;
  setOverride: <K extends keyof VentureSettingOverrides>(
    ventureId: string,
    key: K,
    value: VentureSettingOverrides[K],
  ) => void;
  clearOverride: (ventureId: string, key: keyof VentureSettingOverrides) => void;
  clearAllForVenture: (ventureId: string) => void;
  hasOverride: (ventureId: string, key: keyof VentureSettingOverrides) => boolean;
}

export const useVentureOverrides = create<VentureOverrideState>()(
  persist(
    (set, get) => ({
      overrides: {},

      getOverride: (ventureId) => get().overrides[ventureId] || {},

      setOverride: (ventureId, key, value) =>
        set((s) => ({
          overrides: {
            ...s.overrides,
            [ventureId]: { ...(s.overrides[ventureId] || {}), [key]: value },
          },
        })),

      clearOverride: (ventureId, key) =>
        set((s) => {
          const current = { ...(s.overrides[ventureId] || {}) };
          delete current[key];
          return { overrides: { ...s.overrides, [ventureId]: current } };
        }),

      clearAllForVenture: (ventureId) =>
        set((s) => {
          const next = { ...s.overrides };
          delete next[ventureId];
          return { overrides: next };
        }),

      hasOverride: (ventureId, key) => {
        const ov = get().overrides[ventureId];
        return !!ov && ov[key] !== undefined;
      },
    }),
    { name: 'mcv-venture-overrides' },
  ),
);

/**
 * Resolve a setting's effective value for the current scope.
 * If scope is "venture" and an override exists, return it; otherwise fall back to global.
 */
export function resolveSetting<K extends keyof VentureSettingOverrides>(
  ventureId: string,
  key: K,
  globalValue: VentureSettingOverrides[K],
): { value: VentureSettingOverrides[K]; overridden: boolean } {
  const ov = useVentureOverrides.getState().getOverride(ventureId);
  if (ov[key] !== undefined) return { value: ov[key], overridden: true };
  return { value: globalValue, overridden: false };
}
