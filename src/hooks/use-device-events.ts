/**
 * Device Events SSE Hook
 *
 * Connects to the local server's SSE endpoint for real-time device events.
 * Pushes incoming events into the device store and updates device list.
 */

import { useEffect, useRef } from 'react';
import { useDeviceStore } from '../stores/devices';
import type { DeviceDescriptor, DeviceInputEvent } from '../lib/devices/types';

const SSE_URL = 'http://localhost:3100/devices/events';

export function useDeviceEvents() {
  const pushEvent = useDeviceStore((s) => s.pushEvent);
  const registerDevice = useDeviceStore((s) => s.registerDevice);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    let es: EventSource;

    function connect() {
      try {
        es = new EventSource(SSE_URL);
        eventSourceRef.current = es;

        es.addEventListener('device-list', (e) => {
          try {
            const data = JSON.parse(e.data);
            const devices: DeviceDescriptor[] = data.devices ?? [];
            for (const device of devices) {
              registerDevice(device);
            }
          } catch { /* parse error */ }
        });

        es.addEventListener('device-event', (e) => {
          try {
            const event: DeviceInputEvent = JSON.parse(e.data);
            pushEvent(event);
          } catch { /* parse error */ }
        });

        es.addEventListener('heartbeat', () => {
          // Connection alive — no action needed
        });

        es.onerror = () => {
          // SSE connection lost — will auto-reconnect per spec
          // EventSource automatically reconnects, but if closed, we retry
          if (es.readyState === EventSource.CLOSED) {
            setTimeout(connect, 5000);
          }
        };
      } catch {
        // Local server not available — retry in 5s
        setTimeout(connect, 5000);
      }
    }

    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [pushEvent, registerDevice]);
}
