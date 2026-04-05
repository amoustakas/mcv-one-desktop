import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ScreenClass, DeviceType, PresenceStatus, SystemHealth } from '../lib/device';

// ---------------------------------------------------------------------------
// Presence Store — tracks own state + all connected devices in real-time
// Fed by Supabase Realtime Presence channel via usePresence() hook
// ---------------------------------------------------------------------------

export interface PresenceState {
  // Identity
  userId: string;
  userName: string;
  avatarUrl: string;
  role: 'ceo' | 'cofounder' | 'engineer' | 'designer' | 'analyst' | 'viewer';
  accessTier: 'super-admin' | 'admin' | 'member' | 'guest';

  // Status (AI-inferred)
  status: PresenceStatus;
  statusText: string;
  statusSince: string;

  // Device
  deviceId: string;
  deviceType: DeviceType;
  deviceName: string;
  platform: string;
  screenClass: ScreenClass;
  screenResolution: string;
  isPWA: boolean;

  // Location
  timezone: string;
  timezoneOffset: number;
  city: string;
  coordinates?: { lat: number; lng: number };

  // Device Health
  batteryLevel?: number;
  batteryCharging?: boolean;
  networkType: string;
  online: boolean;
  systemHealth?: SystemHealth;

  // App Context
  activeView: string;
  activeVenture: string;
  lastActivity: string;
}

interface PresenceStore {
  // Own state
  ownPresence: PresenceState | null;

  // All connected devices/sessions (keyed by `${userId}-${deviceId}`)
  allPresences: Record<string, PresenceState>;

  // Actions
  setOwnPresence: (state: PresenceState) => void;
  updateOwn: (updates: Partial<PresenceState>) => void;
  setAllPresences: (presences: Record<string, PresenceState>) => void;
  removePresence: (key: string) => void;

  // Derived
  getMyDevices: () => PresenceState[];
  getTeamPresences: () => PresenceState[];
  getDeviceCount: () => number;
  getPrimaryDevice: () => PresenceState | null;
}

export const usePresenceStore = create<PresenceStore>()(
  persist(
    (set, get) => ({
      ownPresence: null,
      allPresences: {},

      setOwnPresence: (state) => {
        set({ ownPresence: state });
        // Also update in allPresences
        const key = `${state.userId}-${state.deviceId}`;
        set((s) => ({ allPresences: { ...s.allPresences, [key]: state } }));
      },

      updateOwn: (updates) =>
        set((s) => {
          if (!s.ownPresence) return s;
          const updated = { ...s.ownPresence, ...updates };
          const key = `${updated.userId}-${updated.deviceId}`;
          return {
            ownPresence: updated,
            allPresences: { ...s.allPresences, [key]: updated },
          };
        }),

      setAllPresences: (presences) => set({ allPresences: presences }),

      removePresence: (key) =>
        set((s) => {
          const { [key]: _, ...rest } = s.allPresences;
          return { allPresences: rest };
        }),

      // Derived: all devices for current user
      getMyDevices: () => {
        const { ownPresence, allPresences } = get();
        if (!ownPresence) return [];
        return Object.values(allPresences).filter((p) => p.userId === ownPresence.userId);
      },

      // Derived: other users' presences (one per user, most recent device)
      getTeamPresences: () => {
        const { ownPresence, allPresences } = get();
        if (!ownPresence) return [];
        const byUser = new Map<string, PresenceState>();
        for (const p of Object.values(allPresences)) {
          if (p.userId === ownPresence.userId) continue;
          const existing = byUser.get(p.userId);
          if (!existing || new Date(p.lastActivity) > new Date(existing.lastActivity)) {
            byUser.set(p.userId, p);
          }
        }
        return Array.from(byUser.values());
      },

      getDeviceCount: () => {
        const { ownPresence, allPresences } = get();
        if (!ownPresence) return 0;
        return Object.values(allPresences).filter((p) => p.userId === ownPresence.userId).length;
      },

      getPrimaryDevice: () => {
        const devices = get().getMyDevices();
        if (devices.length === 0) return null;
        return devices.sort((a, b) =>
          new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime(),
        )[0];
      },
    }),
    {
      name: 'mcv-presence',
      partialize: (s) => ({
        // Only persist device name preference, not runtime state
        ownPresence: s.ownPresence ? { deviceName: s.ownPresence.deviceName } : null,
      }),
    },
  ),
);

// ── Status Colors (used by PresenceAvatar and StatusBar) ──

export const STATUS_COLORS: Record<PresenceStatus, string> = {
  active: '#10B981',
  'in-meeting': '#3B82F6',
  'on-call': '#EF4444',
  focus: '#8B5CF6',
  away: '#F59E0B',
  sleeping: '#6B7280',
  offline: '#6B7280',
};

export const STATUS_LABELS: Record<PresenceStatus, string> = {
  active: 'Active',
  'in-meeting': 'In Meeting',
  'on-call': 'On Call',
  focus: 'Focus',
  away: 'Away',
  sleeping: 'Sleeping',
  offline: 'Offline',
};
