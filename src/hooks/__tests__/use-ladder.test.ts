// Contract tests for useLadder (Marathon #3 T9.4).
//
// Strategy: mock apiPost + @tanstack/react-query to isolate the wire-format
// contract — no React, no QueryClientProvider. Follows the T3.8 / T6.5 pattern.

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/api/client', () => ({
  apiPost: vi.fn(async () => ({})),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: (opts: {
    queryFn: () => Promise<unknown>;
    enabled?: boolean;
    queryKey: unknown[];
    staleTime?: number;
  }) => {
    const enabled = opts.enabled !== false;
    return {
      queryKey: opts.queryKey,
      enabled,
      staleTime: opts.staleTime,
      invoke: enabled ? opts.queryFn : undefined,
    };
  },
}));

import { apiPost } from '../../lib/api/client';
import { useLadder } from '../use-ladder';

const mockedApiPost = apiPost as unknown as ReturnType<typeof vi.fn>;

describe('useLadder — contract', () => {
  beforeEach(() => {
    mockedApiPost.mockClear();
    mockedApiPost.mockResolvedValue({ ladder: [] });
  });

  it('calls /api/gamification with action=get_ladder and default query key', async () => {
    const q = useLadder() as unknown as {
      invoke: () => Promise<unknown>;
      queryKey: unknown[];
      staleTime: number;
    };
    await q.invoke();

    expect(mockedApiPost).toHaveBeenCalledTimes(1);
    const [path, body] = mockedApiPost.mock.calls[0] as [string, Record<string, unknown>];
    expect(path).toBe('/api/gamification');
    expect(body.action).toBe('get_ladder');
    // No camelCase leakage and no extra wire fields
    expect(body).not.toHaveProperty('agent_id');
    expect(body).not.toHaveProperty('agentId');
    expect(q.queryKey).toEqual(['gamification', 'ladder', 50]);
    expect(q.staleTime).toBe(30_000);
  });

  it('forwards an explicit limit to the wire body and query key', async () => {
    const q = useLadder({ limit: 10 }) as unknown as {
      invoke: () => Promise<unknown>;
      queryKey: unknown[];
    };
    await q.invoke();

    const [, body] = mockedApiPost.mock.calls[0] as [string, Record<string, unknown>];
    expect(body.action).toBe('get_ladder');
    expect(body.limit).toBe(10);
    expect(q.queryKey).toEqual(['gamification', 'ladder', 10]);
  });
});
