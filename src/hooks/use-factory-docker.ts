// Docker cockpit hook — wraps the Factory's docker flows so the cockpit
// can list containers, act on them, and tail logs without shelling out.
// Docker daemon events show up in the live bus feed (factory.docker.*)
// already via useFactoryStream, so this hook is action-oriented only.
//
// Distinct from `use-docker.ts` which talks to the local dev server's
// /api/docker surface. This hook routes every call through the Factory's
// /invoke/:flow, giving the same shape regardless of where the cockpit is.

import { useCallback, useEffect, useRef, useState } from 'react';
import { factoryInvoke } from '../lib/factory-client';

export interface FactoryDockerContainer {
  id: string;
  names: string[];
  image: string;
  state: string;
  status: string;
  createdAt: string;
  ports: Array<{ privatePort: number; publicPort?: number; type: string }>;
  labels: Record<string, string>;
}

export interface FactoryDockerListResult {
  reachable: boolean;
  version?: string;
  containers: FactoryDockerContainer[];
  images?: unknown[];
  networks?: unknown[];
  volumes?: unknown[];
  error?: string;
}

export interface UseFactoryDockerResult {
  data: FactoryDockerListResult | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  start: (id: string) => Promise<{ ok: boolean; error?: string }>;
  stop: (id: string, timeoutSec?: number) => Promise<{ ok: boolean; error?: string }>;
  restart: (id: string, timeoutSec?: number) => Promise<{ ok: boolean; error?: string }>;
  logs: (id: string, tail?: number) => Promise<{ ok: boolean; logs?: string; error?: string }>;
  inspect: (id: string) => Promise<{ ok: boolean; result?: unknown; error?: string }>;
  busy: boolean;
}

async function containerAction(id: string, action: 'start' | 'stop' | 'restart' | 'logs' | 'inspect', opts: Record<string, unknown> = {}) {
  const r = await factoryInvoke<{ ok: boolean; result?: unknown; error?: string }>('dockerContainer', {
    id, action, ...opts,
  });
  if (r.status === 'failed' || !r.output) {
    return { ok: false, error: r.error ?? 'dockerContainer failed' };
  }
  return r.output;
}

export function useFactoryDocker(options: { intervalMs?: number; includeStopped?: boolean } = {}): UseFactoryDockerResult {
  const { intervalMs = 10_000, includeStopped = true } = options;
  const [data, setData] = useState<FactoryDockerListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const aliveRef = useRef(true);

  const refetch = useCallback(async () => {
    try {
      const r = await factoryInvoke<FactoryDockerListResult>('dockerList', { all: includeStopped });
      if (!aliveRef.current) return;
      if (r.status === 'completed' && r.output) {
        setData(r.output);
        setError(r.output.reachable ? null : (r.output.error ?? 'Docker not reachable'));
      } else {
        setError(r.error ?? 'dockerList failed');
      }
    } catch (err) {
      if (!aliveRef.current) return;
      setError(err instanceof Error ? err.message : 'dockerList failed');
    } finally {
      if (aliveRef.current) setLoading(false);
    }
  }, [includeStopped]);

  const start = useCallback(async (id: string) => {
    setBusy(true);
    try { const r = await containerAction(id, 'start'); await refetch(); return r; }
    finally { setBusy(false); }
  }, [refetch]);

  const stop = useCallback(async (id: string, timeoutSec = 10) => {
    setBusy(true);
    try { const r = await containerAction(id, 'stop', { stopTimeoutSec: timeoutSec }); await refetch(); return r; }
    finally { setBusy(false); }
  }, [refetch]);

  const restart = useCallback(async (id: string, timeoutSec = 10) => {
    setBusy(true);
    try { const r = await containerAction(id, 'restart', { stopTimeoutSec: timeoutSec }); await refetch(); return r; }
    finally { setBusy(false); }
  }, [refetch]);

  const logs = useCallback(async (id: string, tail = 200) => {
    const r = await containerAction(id, 'logs', { tail });
    return {
      ok: r.ok,
      logs: (r.result as { logs?: string } | undefined)?.logs,
      error: r.error,
    };
  }, []);

  const inspect = useCallback(async (id: string) => {
    return containerAction(id, 'inspect');
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    refetch();
    if (intervalMs > 0) {
      const id = setInterval(refetch, intervalMs);
      return () => { aliveRef.current = false; clearInterval(id); };
    }
    return () => { aliveRef.current = false; };
  }, [intervalMs, refetch]);

  return { data, loading, error, refetch, start, stop, restart, logs, inspect, busy };
}
