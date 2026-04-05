import { useQuery } from '@tanstack/react-query';
import { usePipelineStore } from '../stores/pipeline';
import type { PipelineEntry, PipelineSource, PipelineSummary } from '../lib/types/pipeline';

interface PipelineResponse {
  entries: PipelineEntry[];
  summary: PipelineSummary;
}

async function fetchPipeline(): Promise<PipelineResponse> {
  const res = await fetch('/api/pipeline');
  if (!res.ok) throw new Error(`Pipeline fetch failed: ${res.status}`);
  return res.json();
}

/** Polls the pipeline aggregation endpoint every 15s */
export function usePipeline() {
  const { setEntries, setSummary, setError } = usePipelineStore();

  return useQuery({
    queryKey: ['pipeline'],
    queryFn: async () => {
      const data = await fetchPipeline();
      setEntries(data.entries);
      setSummary(data.summary);
      return data;
    },
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
    staleTime: 10_000,
    retry: 2,
    meta: {
      onError: (err: Error) => setError(err.message),
    },
  });
}

/** Filter pipeline entries by source */
export function usePipelineBySource(source: PipelineSource) {
  const { data, ...rest } = usePipeline();
  return {
    ...rest,
    data: data ? {
      ...data,
      entries: data.entries.filter((e) => e.source === source),
    } : undefined,
  };
}

/** Filter pipeline entries by venture */
export function usePipelineByVenture(ventureId: string) {
  const { data, ...rest } = usePipeline();
  return {
    ...rest,
    data: data ? {
      ...data,
      entries: data.entries.filter((e) => e.ventureId === ventureId),
    } : undefined,
  };
}

// ═══════════════════════════════════════════
// Local Pipeline — reads from local server (port 3100)
// ═══════════════════════════════════════════

import { localPipeline, type PipelineData, type PipelineCommit } from '../lib/local';
import { useLocalStore } from '../lib/local';

/** Full local pipeline scan — all Claude sessions, git repos, memories, plans */
export function useLocalPipeline() {
  const connected = useLocalStore((s) => s.connected);
  return useQuery<PipelineData>({
    queryKey: ['local-pipeline'],
    queryFn: () => localPipeline.scan(),
    enabled: connected,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

/** Git log for a specific local repo */
export function useLocalGitLog(repo: string, limit = 20) {
  const connected = useLocalStore((s) => s.connected);
  return useQuery<{ repo: string; commits: PipelineCommit[] }>({
    queryKey: ['local-pipeline', 'git-log', repo, limit],
    queryFn: () => localPipeline.gitLog(repo, limit),
    enabled: connected && !!repo,
    staleTime: 30_000,
  });
}

/** Read a local memory/plan file */
export function useLocalFile(filePath: string) {
  const connected = useLocalStore((s) => s.connected);
  return useQuery({
    queryKey: ['local-pipeline', 'file', filePath],
    queryFn: () => localPipeline.readFile(filePath),
    enabled: connected && !!filePath,
    staleTime: 60_000,
  });
}
