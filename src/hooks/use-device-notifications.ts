/**
 * Device Notification Hook
 *
 * Watches the device store for connect/disconnect/error state changes
 * and fires toast notifications + adds to notification store.
 *
 * Skips the initial render cycle so we don't spam toasts when the app
 * first loads and all devices appear as "new". Rate-limits to at most
 * 5 device toasts within a 10-second sliding window.
 */

import { useEffect, useRef } from 'react';
import { useDeviceStore } from '../stores/devices';
import { useToast } from '../components/Toasts';
import type { DeviceDescriptor } from '../lib/devices/types';

const MAX_TOASTS = 5;
const RATE_WINDOW_MS = 10_000;

export function useDeviceNotifications() {
  const { toast } = useToast();
  const devices = useDeviceStore((s) => s.devices);
  const prevDevicesRef = useRef<Record<string, DeviceDescriptor> | null>(null);
  const toastTimestampsRef = useRef<number[]>([]);

  useEffect(() => {
    const prev = prevDevicesRef.current;
    const current = devices;

    // First render: seed the ref but don't fire any notifications.
    // This prevents a burst of "connected" toasts when the app boots
    // and the device store is populated for the first time.
    if (prev === null) {
      prevDevicesRef.current = { ...current };
      return;
    }

    // Rate-limit helper: returns true if we can emit another toast
    function canToast(): boolean {
      const now = Date.now();
      // Prune timestamps older than the window
      toastTimestampsRef.current = toastTimestampsRef.current.filter(
        (t) => now - t < RATE_WINDOW_MS,
      );
      if (toastTimestampsRef.current.length >= MAX_TOASTS) {
        return false;
      }
      toastTimestampsRef.current.push(now);
      return true;
    }

    // Detect new connections and status changes
    for (const [id, device] of Object.entries(current)) {
      const prevDevice = prev[id];

      if (!prevDevice && device.status === 'connected') {
        if (canToast()) {
          toast('success', `${device.name} connected`, `${device.class} via ${device.transport}`);
        }
      } else if (prevDevice?.status !== 'connected' && device.status === 'connected') {
        if (canToast()) {
          toast('success', `${device.name} reconnected`);
        }
      } else if (prevDevice?.status === 'connected' && device.status === 'disconnected') {
        if (canToast()) {
          toast('warning', `${device.name} disconnected`);
        }
      } else if (device.status === 'error' && prevDevice?.status !== 'error') {
        if (canToast()) {
          toast('error', `${device.name} error`, 'Check Device Hub for details');
        }
      }
    }

    // Detect removals
    for (const [id, prevDevice] of Object.entries(prev)) {
      if (!current[id] && prevDevice.status === 'connected') {
        if (canToast()) {
          toast('warning', `${prevDevice.name} removed`);
        }
      }
    }

    prevDevicesRef.current = { ...current };
  }, [devices, toast]);
}
