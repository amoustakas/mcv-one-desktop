// Contract test for useVentureDetail (Marathon #3 T7.2).
//
// Verifies:
//   - Calls apiPost at /api/venture-detail with action=get_venture_detail + venture_id.
//   - No camelCase leakage onto the wire (no `ventureId` in body).
//   - Hook is disabled (queryFn never invoked) when ventureId is null.
//   - Query key is ['venture-detail', <id>].
//   - Whatever apiPost resolves to is what useQuery returns (passthrough).
//
// Follows the T3.8 / T5.3 / T6.5 pattern: mock `apiPost` + `@tanstack/react-query`
// to isolate the serialization contract without React or a QueryClientProvider.

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock apiPost to capture call args without hitting the network.
vi.mock('../../lib/api/client', () => ({
  apiPost: vi.fn(async () => ({})),
}));

// Mock @tanstack/react-query: useQuery returns a shim that exposes the queryFn,
// queryKey, enabled flag, and staleTime for assertion. If `enabled !== false`,
// we surface `invoke` so the test can trigger queryFn() and observe the
// downstream apiPost call. If disabled, we leave invoke undefined and stash
// the raw queryFn separately so the test can assert it was NEVER invoked.
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
      _rawQueryFn: opts.queryFn,
    };
  },
}));

import { apiPost } from '../../lib/api/client';
import { useVentureDetail, type VentureDetail } from '../use-venture-detail';

const mockedApiPost = apiPost as unknown as ReturnType<typeof vi.fn>;

type QueryShim = {
  queryKey: unknown[];
  enabled: boolean;
  staleTime: number | undefined;
  invoke: (() => Promise<unknown>) | undefined;
  _rawQueryFn: () => Promise<unknown>;
};

describe('useVentureDetail — contract', () => {
  beforeEach(() => {
    mockedApiPost.mockClear();
    mockedApiPost.mockResolvedValue({});
  });

  it("calls apiPost with action='get_venture_detail' and venture_id='mcv-tech'", async () => {
    mockedApiPost.mockResolvedValueOnce({});
    const q = useVentureDetail('mcv-tech') as unknown as QueryShim;
    expect(q.enabled).toBe(true);
    await q.invoke!();

    expect(mockedApiPost).toHaveBeenCalledTimes(1);
    const [path, body] = mockedApiPost.mock.calls[0] as [string, Record<string, unknown>];
    expect(path).toBe('/api/venture-detail');
    expect(body.action).toBe('get_venture_detail');
    expect(body.venture_id).toBe('mcv-tech');
  });

  it('does not leak camelCase `ventureId` onto the wire', async () => {
    mockedApiPost.mockResolvedValueOnce({});
    const q = useVentureDetail('futurestate') as unknown as QueryShim;
    await q.invoke!();

    const [, body] = mockedApiPost.mock.calls[0] as [string, Record<string, unknown>];
    expect(body).not.toHaveProperty('ventureId');
    // Only the two documented wire keys should be present.
    expect(Object.keys(body).sort()).toEqual(['action', 'venture_id']);
  });

  it('is disabled when ventureId is null — queryFn is never invoked', async () => {
    const q = useVentureDetail(null) as unknown as QueryShim;
    expect(q.enabled).toBe(false);
    expect(q.invoke).toBeUndefined();
    expect(mockedApiPost).not.toHaveBeenCalled();
    // Belt-and-suspenders: even if something external invoked the raw queryFn,
    // we don't explicitly want to assert its behavior when disabled — the
    // React Query runtime is the one that gates invocation.
    expect(typeof q._rawQueryFn).toBe('function');
  });

  it('uses stable queryKey [\'venture-detail\', <id>]', () => {
    const q = useVentureDetail('mcv-tech') as unknown as QueryShim;
    expect(q.queryKey).toEqual(['venture-detail', 'mcv-tech']);

    const qNull = useVentureDetail(null) as unknown as QueryShim;
    expect(qNull.queryKey).toEqual(['venture-detail', null]);
  });

  it('passes through the apiPost resolved value verbatim', async () => {
    const fixture: VentureDetail = {
      venture: {
        id: 'mcv-tech',
        name: 'MCV Tech',
        type: 'holding',
        category: 'core',
        funding_stage: 'seed',
        owner_entity_id: 'ent-1',
        parent_venture_id: null,
        tier: 'S',
        launch_stage: 'live',
        status: 'active',
        is_raising: true,
      },
      brand: null,
      corporate_stack: { jurisdictions: [], accounts: [] },
      rounds: [],
      raising_rounds: [],
      recent_commitments: [],
      commitments_summary: {
        by_status: {},
        total_committed_usd: 0,
        total_funded_usd: 0,
        count: 0,
      },
      recent_activities: [],
      scoped_personas: [],
    };
    mockedApiPost.mockResolvedValueOnce(fixture);

    const q = useVentureDetail('mcv-tech') as unknown as QueryShim;
    const result = await q.invoke!();
    expect(result).toBe(fixture);
  });
});
