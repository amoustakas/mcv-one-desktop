/**
 * Device Notification Hook
 *
 * Watches the device store for connect/disconnect/error state changes
 * and fires toast notifications + adds to notification store.
 */

import { useEffect, useRef } from 'react';
import { useDeviceStore } from '../stores/devices';
import { useToast } from '../components/Toasts';
import type { DeviceDescriptor } from '../lib/devices/types';

export function useDeviceNotifications() {
  const { toast } = useToast();
  const devices = useDeviceStore((s) => s.devices);
  const prevDevicesRef = useRef<Record<string, DeviceDescriptor>>({});

  useEffect(() => {
    const prev = prevDevicesRef.current;
    const current = devices;

    // Detect new connections
    for (const [id, device] of Object.entries(current)) {
      const prevDevice = prev[id];
      if (!prevDevice && device.status === 'connected') {
        toast('success', `${device.name} connected`, `${device.class} via ${device.transport}`);
      } else if (prevDevice?.status !== 'connected' && device.status === 'connected') {
        toast('success', `${device.name} reconnected`);
      } else if (prevDevice?.status === 'connected' && device.status === 'disconnected') {
        toast('warning', `${device.name} disconnected`);
      } else if (device.status === 'error' && prevDevice?.status !== 'error') {
        toast('error', `${device.name} error`, 'Check Device Hub for details');
      }
    }

    // Detect removals
    for (const [id, prevDevice] of Object.entries(prev)) {
      if (!current[id] && prevDevice.status === 'connected') {
        toast('warning', `${prevDevice.name} removed`);
      }
    }

    prevDevicesRef.current = { ...current };
  }, [devices, toast]);
}
