/**
 * Instance Registration Hook
 *
 * Registers the current MCV Desktop window as a device in the Device Hub.
 * Also syncs other known presence entries as app-instance devices.
 *
 * Called once in App.tsx alongside usePresence().
 */

import { useEffect, useRef } from 'react';
import { useDeviceStore } from '../stores/devices';
import { usePresenceStore } from '../stores/presence';
import { useNavigation } from '../stores/navigation';
import { buildSelfDescriptor, presenceToDevices } from '../lib/devices/instance-registry';
import { generateDeviceId } from '../lib/device';

const SYNC_INTERVAL = 15_000; // 15 seconds

export function useInstanceRegistration() {
  const registerDevice = useDeviceStore((s) => s.registerDevice);
  const unregisterDevice = useDeviceStore((s) => s.unregisterDevice);
  const allPresences = usePresenceStore((s) => s.allPresences);
  const ownPresence = usePresenceStore((s) => s.ownPresence);
  const activeView = useNavigation((s) => s.activeView);
  const activeVenture = useNavigation((s) => s.activeVenture);
  const registeredRef = useRef(false);
  const selfIdRef = useRef<string>('');

  // Register self on mount
  useEffect(() => {
    if (registeredRef.current) return;
    registeredRef.current = true;

    buildSelfDescriptor().then((descriptor) => {
      selfIdRef.current = descriptor.id;
      registerDevice(descriptor);
    });

    return () => {
      // Unregister self on unmount
      if (selfIdRef.current) {
        unregisterDevice(selfIdRef.current);
      }
    };
  }, [registerDevice, unregisterDevice]);

  // Update self descriptor when view/venture changes
  useEffect(() => {
    if (!selfIdRef.current) return;

    const store = useDeviceStore.getState();
    const existing = store.devices[selfIdRef.current];
    if (!existing) return;

    const meta = existing.metadata as Record<string, unknown>;
    registerDevice({
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
    });
  }, [activeView, activeVenture, ownPresence?.status, ownPresence?.statusText, registerDevice]);

  // Sync other presence entries as devices
  useEffect(() => {
    const ownDeviceId = generateDeviceId();
    const remoteDevices = presenceToDevices(allPresences, ownDeviceId);
    for (const device of remoteDevices) {
      registerDevice(device);
    }
  }, [allPresences, registerDevice]);

  // Periodic self-update (screen resize, battery changes, etc.)
  useEffect(() => {
    const interval = setInterval(async () => {
      const descriptor = await buildSelfDescriptor();
      selfIdRef.current = descriptor.id;
      registerDevice(descriptor);
    }, SYNC_INTERVAL);

    return () => clearInterval(interval);
  }, [registerDevice]);

  // Listen for screen resize → re-classify
  useEffect(() => {
    function handleResize() {
      if (!selfIdRef.current) return;
      buildSelfDescriptor().then((descriptor) => {
        registerDevice(descriptor);
      });
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [registerDevice]);
}
