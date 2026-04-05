import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  DeviceDescriptor,
  DeviceClass,
  DeviceInputEvent,
  DeviceOutputCommand,
  DeviceMapping,
  DeviceProfile,
} from '../lib/devices/types';

const MAX_EVENT_LOG = 500;
const LOCAL_SERVER = 'http://localhost:3100';

export interface CommandResult {
  ok: boolean;
  error?: string;
}

interface DeviceState {
  devices: Record<string, DeviceDescriptor>;
  profiles: Record<string, DeviceProfile>;
  activeProfileId: string | null;
  mappings: DeviceMapping[];
  eventLog: DeviceInputEvent[];

  // Device lifecycle
  registerDevice: (device: DeviceDescriptor) => void;
  unregisterDevice: (deviceId: string) => void;
  updateDeviceStatus: (deviceId: string, status: DeviceDescriptor['status']) => void;

  // Events
  pushEvent: (event: DeviceInputEvent) => void;
  clearEventLog: () => void;

  // Commands
  sendCommand: (command: DeviceOutputCommand) => Promise<CommandResult>;

  // Profiles
  setActiveProfile: (profileId: string | null) => void;
  addProfile: (profile: DeviceProfile) => void;
  removeProfile: (profileId: string) => void;

  // Mappings
  addMapping: (mapping: DeviceMapping) => void;
  removeMapping: (mappingId: string) => void;

  // Scan
  scanDevices: () => Promise<void>;

  // Derived getters
  getDevicesByClass: (deviceClass: DeviceClass) => DeviceDescriptor[];
}

export const useDeviceStore = create<DeviceState>()(
  persist(
    (set, get) => ({
      devices: {},
      profiles: {},
      activeProfileId: null,
      mappings: [],
      eventLog: [],

      registerDevice: (device) =>
        set((s) => ({ devices: { ...s.devices, [device.id]: device } })),

      unregisterDevice: (deviceId) =>
        set((s) => {
          const { [deviceId]: _, ...rest } = s.devices;
          return { devices: rest };
        }),

      updateDeviceStatus: (deviceId, status) =>
        set((s) => {
          const device = s.devices[deviceId];
          if (!device) return s;
          return {
            devices: {
              ...s.devices,
              [deviceId]: { ...device, status, lastSeen: Date.now() },
            },
          };
        }),

      pushEvent: (event) =>
        set((s) => {
          const log = [event, ...s.eventLog].slice(0, MAX_EVENT_LOG);
          return { eventLog: log };
        }),

      clearEventLog: () => set({ eventLog: [] }),

      sendCommand: async (command): Promise<CommandResult> => {
        try {
          const res = await fetch(`${LOCAL_SERVER}/devices/command`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(command),
          });
          if (!res.ok) {
            const msg = `HTTP ${res.status}: ${res.statusText}`;
            console.error('[DeviceStore] Command failed:', msg);
            return { ok: false, error: msg };
          }
          return { ok: true };
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Network error';
          console.error('[DeviceStore] Failed to send command:', command.type, msg);
          return { ok: false, error: msg };
        }
      },

      setActiveProfile: (profileId) => set({ activeProfileId: profileId }),

      addProfile: (profile) =>
        set((s) => ({ profiles: { ...s.profiles, [profile.id]: profile } })),

      removeProfile: (profileId) =>
        set((s) => {
          const { [profileId]: _, ...rest } = s.profiles;
          return {
            profiles: rest,
            activeProfileId: s.activeProfileId === profileId ? null : s.activeProfileId,
          };
        }),

      addMapping: (mapping) =>
        set((s) => ({ mappings: [...s.mappings, mapping] })),

      removeMapping: (mappingId) =>
        set((s) => ({ mappings: s.mappings.filter((m) => m.id !== mappingId) })),

      scanDevices: async () => {
        try {
          const res = await fetch(`${LOCAL_SERVER}/devices/scan`);
          if (!res.ok) return;
          const data: { devices?: DeviceDescriptor[] } = await res.json();
          const scanned: Record<string, DeviceDescriptor> = {};
          for (const d of data.devices ?? []) {
            scanned[d.id] = d;
          }

          set((s) => {
            const merged = { ...s.devices };

            // Preserve app-instance devices (from presence system) — scan only
            // covers hardware devices, so we must not clobber presence entries.
            const appInstanceIds = new Set(
              Object.keys(merged).filter((id) => merged[id].class === 'app-instance'),
            );

            // Mark non-instance devices missing from scan as disconnected
            for (const id of Object.keys(merged)) {
              if (appInstanceIds.has(id)) continue; // skip app-instances
              if (!scanned[id]) {
                merged[id] = { ...merged[id], status: 'disconnected' };
              }
            }

            // Add/update scanned devices
            for (const [id, d] of Object.entries(scanned)) {
              merged[id] = d;
            }

            return { devices: merged };
          });
        } catch {
          console.warn('[DeviceStore] Local server not available for device scan');
        }
      },

      // Derived getter — filter devices by class
      getDevicesByClass: (deviceClass) => {
        const { devices } = get();
        return Object.values(devices).filter((d) => d.class === deviceClass);
      },
    }),
    {
      name: 'mcv-devices',
      partialize: (s) => ({
        profiles: s.profiles,
        activeProfileId: s.activeProfileId,
        mappings: s.mappings,
        // Don't persist: devices (re-scanned), eventLog (ephemeral)
      }),
    },
  ),
);
