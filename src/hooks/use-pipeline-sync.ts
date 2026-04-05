import { useEffect, useRef } from 'react';
import { useLocalPipeline, useLocalGitLog } from './use-pipeline';
import { apiPost } from '../lib/api/client';
import { useLocalStore } from '../lib/local';

/**
 * Auto-syncs local pipeline data to Supabase every 5 minutes.
 * This bridges local machine data → cloud DB for cross-device access.
 *
 * Runs silently in the background. Only syncs when local server is connected.
 */
export function usePipelineSync() {
  const connected = useLocalStore(s => s.connected);
  const { data: pipelineData } = useLocalPipeline();
  const lastSyncRef = useRef<number>(0);
  const syncingRef = useRef(false);

  // Fetch git logs for each repo
  const { data: mcvLog } = useLocalGitLog('mcv-one-desktop', 10);
  const { data: fsLog } = useLocalGitLog('Futurestate', 10);
  const { data: mcvMonoLog } = useLocalGitLog('mcv', 10);

  useEffect(() => {
    if (!connected || !pipelineData || syncingRef.current) return;

    // Only sync every 5 minutes
    const now = Date.now();
    if (now - lastSyncRef.current < 5 * 60_000) return;

    syncingRef.current = true;
    lastSyncRef.current = now;

    // Build commit batches from available git logs
    const commitBatches = [];
    if (mcvLog?.commits?.length) commitBatches.push({ repo: 'mcv-one-desktop', commits: mcvLog.commits });
    if (fsLog?.commits?.length) commitBatches.push({ repo: 'Futurestate', commits: fsLog.commits });
    if (mcvMonoLog?.commits?.length) commitBatches.push({ repo: 'mcv', commits: mcvMonoLog.commits });

    // Full sync
    apiPost('/api/pipeline-sync', {
      action: 'full-sync',
      commits: commitBatches,
      memories: pipelineData.memories,
      repos: pipelineData.repos,
    }).then((result) => {
      const total = (result as { total?: number }).total || 0;
      if (total > 0) {
        console.log(`[Pipeline Sync] Synced ${total} items to Supabase`);
      }
    }).catch((err) => {
      console.warn('[Pipeline Sync] Failed:', err.message);
    }).finally(() => {
      syncingRef.current = false;
    });
  }, [connected, pipelineData, mcvLog, fsLog, mcvMonoLog]);
}
