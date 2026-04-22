// React hook over the Factory's /jobs REST surface. Powers FactoryJobsPanel
// and the cockpit's scheduling affordances from any view.

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  factoryListJobs, factoryScheduleJob, factoryDeleteJob, factoryRunJob,
  type FactoryJob,
} from '../lib/factory-client';

export interface UseFactoryJobsResult {
  jobs: FactoryJob[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  schedule: (input: {
    id?: string;
    name: string;
    flow: string;
    input: Record<string, unknown>;
    cron?: string | null;
    nextRunAt?: string | null;
    enabled?: boolean;
    maxRetries?: number;
    timezone?: string | null;
    tags?: string[];
  }) => Promise<FactoryJob>;
  remove: (id: string) => Promise<boolean>;
  runNow: (id: string) => Promise<unknown>;
}

export function useFactoryJobs(options: { intervalMs?: number } = {}): UseFactoryJobsResult {
  const { intervalMs = 15_000 } = options;
  const [jobs, setJobs] = useState<FactoryJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const aliveRef = useRef(true);

  const refetch = useCallback(async () => {
    try {
      const res = await factoryListJobs();
      if (!aliveRef.current) return;
      setJobs(res.jobs ?? []);
      setError(null);
    } catch (err) {
      if (!aliveRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to list jobs');
    } finally {
      if (aliveRef.current) setLoading(false);
    }
  }, []);

  const schedule = useCallback(async (input: Parameters<UseFactoryJobsResult['schedule']>[0]) => {
    const r = await factoryScheduleJob(input);
    await refetch();
    return r.job;
  }, [refetch]);

  const remove = useCallback(async (id: string) => {
    const r = await factoryDeleteJob(id);
    await refetch();
    return r.deleted;
  }, [refetch]);

  const runNow = useCallback(async (id: string) => {
    const r = await factoryRunJob(id);
    // Run history refresh isn't the job list, but re-fetching jobs is cheap
    // and picks up updated_at — useful feedback.
    await refetch();
    return r.run;
  }, [refetch]);

  useEffect(() => {
    aliveRef.current = true;
    refetch();
    if (intervalMs > 0) {
      const id = setInterval(refetch, intervalMs);
      return () => { aliveRef.current = false; clearInterval(id); };
    }
    return () => { aliveRef.current = false; };
  }, [intervalMs, refetch]);

  return { jobs, loading, error, refetch, schedule, remove, runNow };
}
