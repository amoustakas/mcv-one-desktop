import { describe, it, expect, vi } from 'vitest';

const { heartbeat_mock, use_query_configs } = vi.hoisted(() => ({
  heartbeat_mock: vi.fn(),
  use_query_configs: [] as unknown[],
}));

vi.mock('../../lib/factory-client', () => ({
  factory_client: { heartbeat: heartbeat_mock },
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: (config: { queryKey: unknown; queryFn: () => unknown; refetchInterval?: unknown; staleTime?: unknown; enabled?: unknown }) => {
    use_query_configs.push(config);
    return { data: undefined, isLoading: false, error: null };
  },
}));

import { useFactoryHeartbeat } from '../use-factory-heartbeat';

describe('useFactoryHeartbeat', () => {
  it('registers query with queryKey=[factory,heartbeat] and default 5s interval', () => {
    useFactoryHeartbeat();
    const c = use_query_configs[use_query_configs.length - 1] as { queryKey: unknown[]; refetchInterval: number };
    expect(c.queryKey).toEqual(['factory', 'heartbeat']);
    expect(c.refetchInterval).toBe(5000);
  });

  it('passes through custom poll_ms', () => {
    useFactoryHeartbeat({ poll_ms: 10_000 });
    const c = use_query_configs[use_query_configs.length - 1] as { refetchInterval: number };
    expect(c.refetchInterval).toBe(10_000);
  });

  it('honors enabled option', () => {
    useFactoryHeartbeat({ enabled: false });
    const c = use_query_configs[use_query_configs.length - 1] as { enabled: boolean };
    expect(c.enabled).toBe(false);
  });
});
