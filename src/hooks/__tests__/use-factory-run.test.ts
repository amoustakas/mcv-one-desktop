import { describe, it, expect, vi } from 'vitest';

const { invoke_mock, get_run_mock, list_runs_mock, use_mutation_configs, use_query_configs } = vi.hoisted(() => ({
  invoke_mock: vi.fn(),
  get_run_mock: vi.fn(),
  list_runs_mock: vi.fn(),
  use_mutation_configs: [] as unknown[],
  use_query_configs: [] as unknown[],
}));

vi.mock('../../lib/factory-client', () => ({
  factory_client: {
    invoke: invoke_mock,
    get_run: get_run_mock,
    list_runs: list_runs_mock,
  },
}));

vi.mock('@tanstack/react-query', () => ({
  useMutation: (config: { mutationFn: (i: unknown) => Promise<unknown>; onSuccess?: () => void }) => {
    use_mutation_configs.push(config);
    return { mutate: config.mutationFn, mutateAsync: config.mutationFn };
  },
  useQuery: (config: { queryKey: unknown; queryFn: () => unknown; enabled?: unknown }) => {
    use_query_configs.push(config);
    return { data: undefined, isLoading: false };
  },
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

import { useStartFactoryRun, useFactoryRun, useFactoryRuns } from '../use-factory-run';

describe('useStartFactoryRun', () => {
  it('calls factory_client.invoke with flowName + input', async () => {
    invoke_mock.mockResolvedValueOnce({ run_id: 'r-1' });
    const m = useStartFactoryRun();
    await m.mutateAsync({ flowName: 'research-dossier-builder', input: { entity: 'Hunter' } });
    expect(invoke_mock).toHaveBeenCalledWith('research-dossier-builder', { entity: 'Hunter' });
  });
});

describe('useFactoryRun', () => {
  it('disabled when runId null', () => {
    useFactoryRun(null);
    const c = use_query_configs[use_query_configs.length - 1] as { enabled: boolean };
    expect(c.enabled).toBe(false);
  });

  it('enabled + queryKey includes runId', () => {
    useFactoryRun('r-42');
    const c = use_query_configs[use_query_configs.length - 1] as { queryKey: unknown[]; enabled: boolean };
    expect(c.enabled).toBe(true);
    expect(c.queryKey).toEqual(['factory', 'run', 'r-42']);
  });
});

describe('useFactoryRuns', () => {
  it('queryKey includes all filter params with null defaults', () => {
    useFactoryRuns({ limit: 30, pillar: 'oracle' });
    const c = use_query_configs[use_query_configs.length - 1] as { queryKey: unknown[] };
    expect(c.queryKey).toEqual(['factory', 'runs', 30, null, 'oracle', null]);
  });

  it('uses default limit=50 when unspecified', () => {
    useFactoryRuns();
    const c = use_query_configs[use_query_configs.length - 1] as { queryKey: unknown[] };
    expect(c.queryKey).toEqual(['factory', 'runs', 50, null, null, null]);
  });
});
