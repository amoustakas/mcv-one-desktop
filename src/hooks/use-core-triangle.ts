import { useMemo, useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { createCoreTriangle, type CoreTriangle } from '../lib/mcv-core';
import { useNavigation } from '../stores/navigation';

/**
 * React hook that returns a ready-to-use Core Triangle client bound to the
 * current Clerk session and active venture. Base URLs come from Vite env:
 *
 *   VITE_MCV_CORE_IDENTITY_URL
 *   VITE_MCV_CORE_FABRIC_URL
 *   VITE_MCV_CORE_INTELLIGENCE_URL
 *
 * If any URL is unset, its client will return CoreNotAvailableError on every
 * call, and callers should fall back to their existing code paths. MCV
 * Desktop can ship today without any of them being set — full backwards
 * compatibility.
 */
export function useCoreTriangle(): CoreTriangle {
  const { getToken } = useAuth();
  const { mode, activeVenture } = useNavigation();
  const ventureId = mode === 'venture' ? activeVenture || undefined : undefined;

  return useMemo(
    () =>
      createCoreTriangle({
        getAuthToken: async () => (await getToken()) ?? null,
        ventureId,
        baseUrls: {
          identity: import.meta.env.VITE_MCV_CORE_IDENTITY_URL || '',
          fabric: import.meta.env.VITE_MCV_CORE_FABRIC_URL || '',
          intelligence: import.meta.env.VITE_MCV_CORE_INTELLIGENCE_URL || '',
        },
        logger: import.meta.env.DEV
          ? (level, msg, meta) => {
              const log = console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'debug'];
              log(`[core-triangle] ${msg}`, meta || '');
            }
          : undefined,
      }),
    [getToken, ventureId],
  );
}

export interface CoreTriangleHealth {
  identity: 'online' | 'offline' | 'unknown';
  fabric: 'online' | 'offline' | 'unknown';
  intelligence: 'online' | 'offline' | 'unknown';
  checkedAt: Date | null;
}

/**
 * Polls Core Triangle service health. Use in ops dashboards or footer
 * indicators. Refresh interval defaults to 30s.
 */
export function useCoreTriangleHealth(intervalMs = 30_000): CoreTriangleHealth {
  const core = useCoreTriangle();
  const [health, setHealth] = useState<CoreTriangleHealth>({
    identity: 'unknown',
    fabric: 'unknown',
    intelligence: 'unknown',
    checkedAt: null,
  });

  useEffect(() => {
    let cancelled = false;
    async function tick() {
      const p = await core.ping();
      if (cancelled) return;
      setHealth({
        identity: p.identity ? 'online' : 'offline',
        fabric: p.fabric ? 'online' : 'offline',
        intelligence: p.intelligence ? 'online' : 'offline',
        checkedAt: new Date(),
      });
    }
    void tick();
    const id = setInterval(tick, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [core, intervalMs]);

  return health;
}
