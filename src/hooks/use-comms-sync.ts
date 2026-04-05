import { useEffect, useRef, useCallback, useState } from 'react';
import { apiPost } from '../lib/api/client';
import { useIntegrations } from '../stores/integrations';

// ---------------------------------------------------------------------------
// Comms Sync — auto-ingests communication data into Knowledge Base, CRM, Tasks
//
// Mirrors usePipelineSync pattern: 5-min interval, silent background sync.
// Only runs when at least one comms platform is connected.
// ---------------------------------------------------------------------------

interface SyncResult {
  synced: Record<string, number>;
  total: number;
}

const SYNC_INTERVAL = 5 * 60_000; // 5 minutes
const LS_KEY = 'comms-sync-last';

export function useCommsSync() {
  const connections = useIntegrations((s) => s.connections);
  const lastSyncRef = useRef<number>(Number(localStorage.getItem(LS_KEY)) || 0);
  const syncingRef = useRef(false);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Check if any comms platform is connected
  const hasComms = ['google', 'slack', 'discord'].some((p) => connections[p]?.connected);
  const hasTwilio = !!(import.meta.env.VITE_TWILIO_ACCOUNT_SID || true); // Twilio uses env vars

  const doSync = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setSyncing(true);

    try {
      const result = await apiPost<SyncResult>('/api/comms-sync', { action: 'full-sync' });
      setLastResult(result);
      lastSyncRef.current = Date.now();
      localStorage.setItem(LS_KEY, String(lastSyncRef.current));

      if (result.total > 0) {
        console.log(`[Comms Sync] Synced ${result.total} items`, result.synced);
      }
    } catch (err) {
      console.warn('[Comms Sync] Failed:', err instanceof Error ? err.message : err);
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    if (!hasComms && !hasTwilio) return;
    if (syncingRef.current) return;

    // Only sync every 5 minutes
    const now = Date.now();
    if (now - lastSyncRef.current < SYNC_INTERVAL) return;

    doSync();
  }, [hasComms, hasTwilio, doSync]);

  return {
    lastSync: lastSyncRef.current,
    lastResult,
    syncing,
    triggerSync: doSync,
  };
}
