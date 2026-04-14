/**
 * Device Events SSE Hook
 *
 * Connects to the local server's SSE endpoint for real-time device events.
 * Pushes incoming events into the device store and updates device list.
 *
 * Tracks connection state (connecting / connected / disconnected) and
 * prevents duplicate EventSource instances via a ref guard.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useDeviceStore } from '../stores/devices';
import type { DeviceDescriptor, DeviceInputEvent } from '../lib/devices/types';

const SSE_URL = 'http://localhost:3100/devices/events';
const RECONNECT_DELAY = 5_000;

// Only attempt to connect in dev — the local device bridge server runs on
// localhost:3100. In production on Vercel, this connection will always fail
// and produces endless ERR_CONNECTION_REFUSED noise in the console, so we
// skip it entirely.
const DEVICE_EVENTS_ENABLED =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export type SSEConnectionState = 'disconnected' | 'connecting' | 'connected';

export function useDeviceEvents() {
  const pushEvent = useDeviceStore((s) => s.pushEvent);
  const registerDevice = useDeviceStore((s) => s.registerDevice);
  const unregisterDevice = useDeviceStore((s) => s.unregisterDevice);
  const updateDeviceStatus = useDeviceStore((s) => s.updateDeviceStatus);

  const [connectionState, setConnectionState] = useState<SSEConnectionState>('disconnected');
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Guard against double-mount in StrictMode
  const mountedRef = useRef(false);

  const cleanup = useCallback(() => {
    if (reconnectTimerRef.current !== null) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setConnectionState('disconnected');
  }, []);

  useEffect(() => {
    // Skip the local SSE connection in production — there's no device
    // bridge running at localhost:3100 on Vercel, and the retry loop
    // spams ERR_CONNECTION_REFUSED into the console.
    if (!DEVICE_EVENTS_ENABLED) return;

    // Prevent duplicate connections on StrictMode double-mount
    if (mountedRef.current) return;
    mountedRef.current = true;

    function connect() {
      // Don't open a new connection if one already exists
      if (eventSourceRef.current && eventSourceRef.current.readyState !== EventSource.CLOSED) {
        return;
      }

      setConnectionState('connecting');

      let es: EventSource;
      try {
        es = new EventSource(SSE_URL);
      } catch {
        // Constructor threw — local server not available
        setConnectionState('disconnected');
        scheduleReconnect();
        return;
      }

      eventSourceRef.current = es;

      es.addEventListener('open', () => {
        setConnectionState('connected');
      });

      // Bulk device-list update: replaces the full set of hardware devices
      es.addEventListener('device-list', (e) => {
        try {
          const data = JSON.parse((e as MessageEvent).data) as { devices?: DeviceDescriptor[] };
          const incoming = data.devices ?? [];
          const incomingIds = new Set(incoming.map((d) => d.id));

          // Register/update all devices from the list
          for (const device of incoming) {
            registerDevice(device);
          }

          // Mark hardware devices absent from this list as disconnected.
          // app-instance devices are managed by the presence system, not SSE.
          const currentDevices = useDeviceStore.getState().devices;
          for (const [id, device] of Object.entries(currentDevices)) {
            if (device.class === 'app-instance') continue;
            if (!incomingIds.has(id) && device.status === 'connected') {
              updateDeviceStatus(id, 'disconnected');
            }
          }
        } catch {
          // parse error — ignore malformed SSE data
        }
      });

      es.addEventListener('device-connected', (e) => {
        try {
          const device: DeviceDescriptor = JSON.parse((e as MessageEvent).data);
          registerDevice(device);
        } catch { /* ignore */ }
      });

      es.addEventListener('device-disconnected', (e) => {
        try {
          const data = JSON.parse((e as MessageEvent).data) as { deviceId?: string };
          if (data.deviceId) {
            updateDeviceStatus(data.deviceId, 'disconnected');
          }
        } catch { /* ignore */ }
      });

      es.addEventListener('device-removed', (e) => {
        try {
          const data = JSON.parse((e as MessageEvent).data) as { deviceId?: string };
          if (data.deviceId) {
            unregisterDevice(data.deviceId);
          }
        } catch { /* ignore */ }
      });

      es.addEventListener('device-event', (e) => {
        try {
          const event: DeviceInputEvent = JSON.parse((e as MessageEvent).data);
          pushEvent(event);
        } catch {
          // parse error — ignore
        }
      });

      es.addEventListener('heartbeat', () => {
        // Connection alive — no action needed
      });

      es.onerror = () => {
        // EventSource auto-reconnects when readyState is CONNECTING.
        // Only schedule manual reconnect when fully CLOSED.
        if (es.readyState === EventSource.CLOSED) {
          setConnectionState('disconnected');
          eventSourceRef.current = null;
          scheduleReconnect();
        } else {
          setConnectionState('connecting');
        }
      };
    }

    function scheduleReconnect() {
      if (reconnectTimerRef.current !== null) return; // already scheduled
      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null;
        connect();
      }, RECONNECT_DELAY);
    }

    connect();

    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [pushEvent, registerDevice, unregisterDevice, updateDeviceStatus, cleanup]);

  return { connectionState };
}
