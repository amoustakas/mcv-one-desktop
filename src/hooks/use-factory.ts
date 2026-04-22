// React hooks for the Local AI Factory runtime.
// Polling-based for Phase 0 — the Factory will stream via SSE in Phase 1.

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  factoryHeartbeat, factoryFlows, factoryInvoke, factoryEvents, factoryClearEvents,
  factoryBus, openFactoryStream, factoryCapabilities,
  type FactoryHeartbeat, type FactoryEvent, type FactoryBusEvent, type FactoryCapabilities,
  type FlowInvokeResult, type FlowName,
} from '../lib/factory-client';

export type FactoryStatus = 'online' | 'degraded' | 'offline' | 'loading';

export interface UseFactoryHeartbeatResult {
  heartbeat: FactoryHeartbeat | null;
  status: FactoryStatus;
  error: string | null;
  lastFetched: number | null;
  refetch: () => Promise<void>;
}

/**
 * Poll the Factory heartbeat. Derives a coarse `status`:
 *   - online: Factory responding, local models reachable
 *   - degraded: Factory responding but local models or Triangle offline
 *   - offline: Factory proxy returned error / unreachable
 */
export function useFactoryHeartbeat(options: {
  /** Polling interval in ms. Default 15s. Set to 0 to disable polling. */
  intervalMs?: number;
  /** Don't emit Fabric heartbeat on each poll (cuts event noise). Default true. */
  skipEmit?: boolean;
} = {}): UseFactoryHeartbeatResult {
  const { intervalMs = 15_000, skipEmit = true } = options;
  const [heartbeat, setHeartbeat] = useState<FactoryHeartbeat | null>(null);
  const [status, setStatus] = useState<FactoryStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);
  const aliveRef = useRef(true);

  const refetch = useCallback(async () => {
    try {
      const res = await factoryHeartbeat({ emit: !skipEmit });
      if (!aliveRef.current) return;
      setHeartbeat(res.heartbeat);
      setError(null);
      setLastFetched(Date.now());
      const hb = res.heartbeat;
      const localOk = hb?.localModels?.reachable ?? false;
      const triangleOk = hb?.triangle?.internalSecret ?? false;
      setStatus(localOk && triangleOk ? 'online' : 'degraded');
    } catch (err) {
      if (!aliveRef.current) return;
      setError(err instanceof Error ? err.message : 'Factory unreachable');
      setStatus('offline');
      setLastFetched(Date.now());
    }
  }, [skipEmit]);

  useEffect(() => {
    aliveRef.current = true;
    refetch();
    if (intervalMs > 0) {
      const id = setInterval(refetch, intervalMs);
      return () => {
        aliveRef.current = false;
        clearInterval(id);
      };
    }
    return () => { aliveRef.current = false; };
  }, [intervalMs, refetch]);

  return { heartbeat, status, error, lastFetched, refetch };
}

export interface UseFactoryFlowsResult {
  flows: string[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useFactoryFlows(): UseFactoryFlowsResult {
  const [flows, setFlows] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await factoryFlows();
      setFlows(res.flows ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to list flows');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  return { flows, loading, error, refetch };
}

export interface FlowRunRecord {
  id: string;
  flowName: string;
  input: Record<string, unknown>;
  startedAt: number;
  completedAt?: number;
  result?: FlowInvokeResult<unknown>;
  error?: string;
}

export interface UseFactoryRunnerResult {
  runs: FlowRunRecord[];
  invoke: (flowName: FlowName, input: Record<string, unknown>) => Promise<FlowRunRecord>;
  clear: () => void;
  running: boolean;
}

/**
 * In-memory runner with local history. Phase 1 will replace the history with
 * Fabric `audit` queries so runs persist across sessions — for now this gives
 * an immediate feedback loop.
 */
export function useFactoryRunner(): UseFactoryRunnerResult {
  const [runs, setRuns] = useState<FlowRunRecord[]>([]);
  const [running, setRunning] = useState(false);

  const invoke = useCallback(async (flowName: FlowName, input: Record<string, unknown>) => {
    const id = `${flowName}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const startedAt = Date.now();
    const pending: FlowRunRecord = { id, flowName, input, startedAt };
    setRuns(prev => [pending, ...prev].slice(0, 50));
    setRunning(true);
    try {
      const result = await factoryInvoke(flowName, input);
      const completed: FlowRunRecord = {
        ...pending,
        completedAt: Date.now(),
        result,
        error: result.status === 'failed' ? (result.error ?? 'flow reported failure') : undefined,
      };
      setRuns(prev => prev.map(r => (r.id === id ? completed : r)));
      return completed;
    } catch (err) {
      const errored: FlowRunRecord = {
        ...pending,
        completedAt: Date.now(),
        error: err instanceof Error ? err.message : 'invoke failed',
      };
      setRuns(prev => prev.map(r => (r.id === id ? errored : r)));
      return errored;
    } finally {
      setRunning(false);
    }
  }, []);

  const clear = useCallback(() => setRuns([]), []);

  return { runs, invoke, clear, running };
}

export interface UseFactoryEventsResult {
  events: FactoryEvent[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  clear: () => Promise<void>;
}

/**
 * Polls the Factory's in-memory event log. This is the ring buffer
 * (200 events max) that tracks every Fabric emission attempt — published,
 * skipped (Triangle not configured), or errored. Phase 1 will replace this
 * with Fabric audit queries for persistence across Factory restarts.
 */
export function useFactoryEvents(options: {
  limit?: number;
  /** Polling interval in ms. Default 10s. Set to 0 to disable polling. */
  intervalMs?: number;
} = {}): UseFactoryEventsResult {
  const { limit = 50, intervalMs = 10_000 } = options;
  const [events, setEvents] = useState<FactoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const aliveRef = useRef(true);

  const refetch = useCallback(async () => {
    try {
      const res = await factoryEvents(limit);
      if (!aliveRef.current) return;
      setEvents(res.events ?? []);
      setError(null);
    } catch (err) {
      if (!aliveRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      if (aliveRef.current) setLoading(false);
    }
  }, [limit]);

  const clear = useCallback(async () => {
    try {
      await factoryClearEvents();
      setEvents([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear events');
    }
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

  return { events, loading, error, refetch, clear };
}

// -----------------------------------------------------------------------
// Bus stream — live push over SSE. Replaces polling for real-time feeds.
// -----------------------------------------------------------------------

export interface UseFactoryStreamResult {
  events: FactoryBusEvent[];
  connected: boolean;
  error: string | null;
  reconnect: () => void;
  clear: () => void;
}

/**
 * Subscribe to the Factory's /stream SSE endpoint. Seeds `events` with a
 * `/bus` fetch on mount so late openers aren't empty, then accumulates live
 * events as they arrive. Auto-reconnects when the underlying EventSource
 * goes to `readyState === 2` (closed).
 */
export function useFactoryStream(options: {
  typePrefix?: string;
  source?: string;
  /** Max events to retain in memory (drops oldest). Default 500. */
  maxEvents?: number;
  /** Auto-reconnect after this many ms if stream closes. Default 3000. 0 disables. */
  reconnectMs?: number;
} = {}): UseFactoryStreamResult {
  const { typePrefix, source, maxEvents = 500, reconnectMs = 3000 } = options;
  const [events, setEvents] = useState<FactoryBusEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aliveRef = useRef(true);
  const bumpRef = useRef(0);

  const open = useCallback(() => {
    if (!aliveRef.current) return;
    try {
      esRef.current?.close();
    } catch { /* ignore */ }

    // Seed from /bus REST so late subscribers have context immediately.
    factoryBus({ limit: 100, typePrefix, source })
      .then((res) => {
        if (!aliveRef.current) return;
        setEvents(res.events ?? []);
      })
      .catch(() => { /* SSE open below will retry; not fatal */ });

    const es = openFactoryStream({
      typePrefix,
      source,
      onOpen: () => {
        if (!aliveRef.current) return;
        setConnected(true);
        setError(null);
      },
      onEvent: (evt) => {
        if (!aliveRef.current) return;
        setEvents((prev) => {
          const next = [evt, ...prev];
          return next.length > maxEvents ? next.slice(0, maxEvents) : next;
        });
      },
      onError: () => {
        if (!aliveRef.current) return;
        setConnected(false);
        setError('Factory stream disconnected');
        if (reconnectMs > 0) {
          if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = setTimeout(open, reconnectMs);
        }
      },
    });
    esRef.current = es;
  }, [typePrefix, source, maxEvents, reconnectMs]);

  const reconnect = useCallback(() => {
    bumpRef.current++;
    open();
  }, [open]);

  const clear = useCallback(() => setEvents([]), []);

  useEffect(() => {
    aliveRef.current = true;
    open();
    return () => {
      aliveRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      try { esRef.current?.close(); } catch { /* ignore */ }
    };
  // Intentionally only reopen on typePrefix/source changes; `open` is stable.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typePrefix, source]);

  return { events, connected, error, reconnect, clear };
}

// -----------------------------------------------------------------------
// Capabilities probe — one-shot for a Factory-status overview panel.
// -----------------------------------------------------------------------

export interface UseFactoryCapabilitiesResult {
  capabilities: FactoryCapabilities | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useFactoryCapabilities(options: { intervalMs?: number } = {}): UseFactoryCapabilitiesResult {
  const { intervalMs = 30_000 } = options;
  const [capabilities, setCaps] = useState<FactoryCapabilities | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const aliveRef = useRef(true);

  const refetch = useCallback(async () => {
    try {
      const res = await factoryCapabilities();
      if (!aliveRef.current) return;
      setCaps(res);
      setError(null);
    } catch (err) {
      if (!aliveRef.current) return;
      setError(err instanceof Error ? err.message : 'capabilities probe failed');
    } finally {
      if (aliveRef.current) setLoading(false);
    }
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

  return { capabilities, loading, error, refetch };
}
