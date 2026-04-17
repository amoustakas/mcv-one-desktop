// src/hooks/use-factory-run.ts
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { factory_client, type FactoryRun, type FactoryStreamEvent, type FactoryRunStatus } from '../lib/factory-client';

export interface StartRunInput {
  flowName: string;
  input: Record<string, unknown>;
}

export function useStartFactoryRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ flowName, input }: StartRunInput) => {
      return factory_client.invoke(flowName, input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['factory', 'runs'] });
    },
  });
}

export function useFactoryRun(runId: string | null, opts?: { poll_ms?: number }) {
  return useQuery({
    queryKey: ['factory', 'run', runId],
    queryFn: () => factory_client.get_run(runId!),
    enabled: !!runId,
    refetchInterval: (q) => {
      const status = (q.state.data as FactoryRun | undefined)?.status;
      if (status === 'succeeded' || status === 'failed' || status === 'cancelled') return false;
      return opts?.poll_ms ?? 2_000;
    },
    staleTime: 1_500,
  });
}

export interface ListRunsInput {
  limit?: number;
  flow?: string;
  pillar?: 'oracle' | 'forge' | 'bloodstream' | 'architect' | 'crucible' | 'heartbeat' | 'scheduler';
  status?: FactoryRunStatus;
}

export function useFactoryRuns(input: ListRunsInput = {}) {
  return useQuery({
    queryKey: ['factory', 'runs', input.limit ?? 50, input.flow ?? null, input.pillar ?? null, input.status ?? null],
    queryFn: () => factory_client.list_runs(input),
    staleTime: 10_000,
  });
}

// SSE stream hook — returns the accumulated events and a connection-status flag.
// Caller passes runId; hook auto-connects + cleans up.
export function useFactoryRunStream(runId: string | null) {
  const [events, setEvents] = useState<FactoryStreamEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setEvents([]);
    setError(null);
    setConnected(false);
    if (!runId) return;

    setConnected(true);
    const cleanup = factory_client.subscribe_run(
      runId,
      (ev) => setEvents((prev) => [...prev, ev]),
      (err) => { setError(err); setConnected(false); },
    );
    cleanupRef.current = cleanup;
    return () => {
      cleanup();
      cleanupRef.current = null;
      setConnected(false);
    };
  }, [runId]);

  const latest_token = useMemo(() => {
    for (let i = events.length - 1; i >= 0; i--) {
      if (events[i].type === 'token') return (events[i] as { type: 'token'; text: string }).text;
    }
    return null;
  }, [events]);

  return { events, connected, error, latest_token };
}
