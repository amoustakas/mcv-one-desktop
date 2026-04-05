/**
 * Instance Registration Hook
 *
 * Registers the current MCV Desktop window as a device in the Device Hub.
 * Also syncs other known presence entries as app-instance devices.
 *
 * Optimizations:
 * - Periodic refresh only updates fields that actually changed (screen size,
 *   battery, network) instead of rebuilding the full descriptor every 15s.
 * - BroadcastChannel enables same-machine multi-window discovery without
 *   hitting Supabase — windows on the same origin announce themselves.
 * - beforeunload handler ensures the device is unregistered when the tab
 *   is closed (complement to the React cleanup on unmount).
 *
 * Called once in App.tsx alongside usePresence().
 */

import { useEffect, useRef, useCallback } from 'react';
import { useDeviceStore } from '../stores/devices';
import { usePresenceStore } from '../stores/presence';
import { useNavigation } from '../stores/navigation';
import { buildSelfDescriptor, presenceToDevices } from '../lib/devices/instance-registry';
import { generateDeviceId } from '../lib/device';
import type { DeviceDescriptor } from '../lib/devices/types';

const SYNC_INTERVAL = 15_000; // 15 seconds
const BROADCAST_CHANNEL = 'mcv-device-hub';

/**
 * Shallow-compare two descriptors and return only fields that differ.
 * Returns null if nothing changed.
 */
function diffDescriptor(
  prev: DeviceDescriptor,
  next: DeviceDescriptor,
): Partial<DeviceDescriptor> | null {
  const keys = Object.keys(next) as (keyof DeviceDescriptor)[];
  let changed = false;
  const patch: Partial<DeviceDescriptor> = {};

  for (const key of keys) {
    const a = prev[key];
    const b = next[key];
    // For metadata / capabilities, do a JSON comparison
    if (key === 'metadata' || key === 'capabilities') {
      if (JSON.stringify(a) !== JSON.stringify(b)) {
        (patch as Record<string, unknown>)[key] = b;
        changed = true;
      }
    } else if (a !== b) {
      (patch as Record<string, unknown>)[key] = b;
      changed = true;
    }
  }

  return changed ? patch : null;
}

export function useInstanceRegistration() {
  const registerDevice = useDeviceStore((s) => s.registerDevice);
  const unregisterDevice = useDeviceStore((s) => s.unregisterDevice);
  const allPresences = usePresenceStore((s) => s.allPresences);
  const ownPresence = usePresenceStore((s) => s.ownPresence);
  const activeView = useNavigation((s) => s.activeView);
  const activeVenture = useNavigation((s) => s.activeVenture);
  const registeredRef = useRef(false);
  const selfIdRef = useRef<string>('');
  const lastDescriptorRef = useRef<DeviceDescriptor | null>(null);
  const broadcastRef = useRef<BroadcastChannel | null>(null);

  // Stable cleanup function for beforeunload
  const unregisterSelf = useCallback(() => {
    if (selfIdRef.current) {
      unregisterDevice(selfIdRef.current);

      // Announce departure to sibling windows
      try {
        broadcastRef.current?.postMessage({
          type: 'device-departed',
          deviceId: selfIdRef.current,
        });
      } catch {
        // Channel may already be closed
      }
    }
  }, [unregisterDevice]);

  // Register self on mount + set up BroadcastChannel
  useEffect(() => {
    if (registeredRef.current) return;
    registeredRef.current = true;

    // --- BroadcastChannel for same-machine multi-window discovery ---
    try {
      const bc = new BroadcastChannel(BROADCAST_CHANNEL);
      broadcastRef.current = bc;

      bc.onmessage = (event: MessageEvent) => {
        const data = event.data;
        if (!data || typeof data !== 'object') return;

        if (data.type === 'device-announce' && data.descriptor) {
          // Sibling window announced itself — register it locally
          registerDevice(data.descriptor as DeviceDescriptor);
        } else if (data.type === 'device-departed' && data.deviceId) {
          // Sibling window closed
          unregisterDevice(data.deviceId as string);
        } else if (data.type === 'device-ping') {
          // Another window is asking us to announce ourselves
          if (lastDescriptorRef.current) {
            bc.postMessage({
              type: 'device-announce',
              descriptor: lastDescriptorRef.current,
            });
          }
        }
      };

      // Ask existing windows to announce themselves
      bc.postMessage({ type: 'device-ping' });
    } catch {
      // BroadcastChannel not supported (e.g., some WebView environments)
    }

    // --- Self-registration ---
    buildSelfDescriptor().then((descriptor) => {
      selfIdRef.current = descriptor.id;
      lastDescriptorRef.current = descriptor;
      registerDevice(descriptor);

      // Announce to sibling windows
      try {
        broadcastRef.current?.postMessage({
          type: 'device-announce',
          descriptor,
        });
      } catch { /* ignore */ }
    });

    // --- beforeunload: unregister on tab/window close ---
    window.addEventListener('beforeunload', unregisterSelf);

    return () => {
      window.removeEventListener('beforeunload', unregisterSelf);
      unregisterSelf();

      // Close BroadcastChannel
      try {
        broadcastRef.current?.close();
        broadcastRef.current = null;
      } catch { /* ignore */ }

      registeredRef.current = false;
    };
  }, [registerDevice, unregisterDevice, unregisterSelf]);

  // Update self descriptor when view/venture changes
  useEffect(() => {
    if (!selfIdRef.current) return;

    const store = useDeviceStore.getState();
    const existing = store.devices[selfIdRef.current];
    if (!existing) return;

    const meta = existing.metadata as Record<string, unknown>;
    const updated: DeviceDescriptor = {
      ...existing,
      lastSeen: Date.now(),
      metadata: {
        ...meta,
        activeView,
        activeVenture: activeVenture ?? 'mcv',
        lastActivity: new Date().toISOString(),
        status: ownPresence?.status ?? 'active',
        statusText: ownPresence?.statusText ?? '',
      },
    };

    lastDescriptorRef.current = updated;
    registerDevice(updated);

    // Broadcast the update to sibling windows
    try {
      broadcastRef.current?.postMessage({
        type: 'device-announce',
        descriptor: updated,
      });
    } catch { /* ignore */ }
  }, [activeView, activeVenture, ownPresence?.status, ownPresence?.statusText, registerDevice]);

  // Sync other presence entries as devices
  useEffect(() => {
    const ownDeviceId = generateDeviceId();
    const remoteDevices = presenceToDevices(allPresences, ownDeviceId);
    for (const device of remoteDevices) {
      registerDevice(device);
    }
  }, [allPresences, registerDevice]);

  // Periodic self-update: only push changes (screen resize, battery, network)
  useEffect(() => {
    const interval = setInterval(async () => {
      const fresh = await buildSelfDescriptor();
      const prev = lastDescriptorRef.current;

      if (!prev) {
        // First time (shouldn't happen, but guard)
        selfIdRef.current = fresh.id;
        lastDescriptorRef.current = fresh;
        registerDevice(fresh);
        return;
      }

      const patch = diffDescriptor(prev, fresh);
      if (patch) {
        // Something changed — merge and register
        const merged: DeviceDescriptor = { ...prev, ...patch, lastSeen: Date.now() };
        lastDescriptorRef.current = merged;
        registerDevice(merged);

        try {
          broadcastRef.current?.postMessage({
            type: 'device-announce',
            descriptor: merged,
          });
        } catch { /* ignore */ }
      }
      // If nothing changed, skip the store update entirely
    }, SYNC_INTERVAL);

    return () => clearInterval(interval);
  }, [registerDevice]);

  // Listen for screen resize -> re-classify (debounced by nature of resize events)
  useEffect(() => {
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;

    function handleResize() {
      // Debounce: only rebuild after 300ms of no resize events
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!selfIdRef.current) return;
        buildSelfDescriptor().then((descriptor) => {
          const prev = lastDescriptorRef.current;
          if (prev) {
            const patch = diffDescriptor(prev, descriptor);
            if (!patch) return; // no meaningful change
          }
          lastDescriptorRef.current = descriptor;
          registerDevice(descriptor);
        });
      }, 300);
    }

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimer) clearTimeout(resizeTimer);
    };
  }, [registerDevice]);
}
