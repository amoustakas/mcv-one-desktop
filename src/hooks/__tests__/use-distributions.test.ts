// src/hooks/__tests__/use-distributions.test.ts
//
// Contract tests for the 4 distributions hooks. We don't render React
// (node env + no @testing-library/react installed); instead we mock
// @tanstack/react-query so useQuery/useMutation capture their config
// objects, then invoke queryFn / mutationFn directly and assert that
// apiPost is called with the exact snake_case payload the T8.2 handler
// expects. This is a pure wire-format contract test — camelCase leakage
// is the bug we're guarding against.

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── MOCKS ────────────────────────────────────────────────────────────────────

const apiPostMock = vi.fn();
vi.mock('../../lib/api/client', () => ({
  apiPost: (...args: unknown[]) => apiPostMock(...args),
}));

// Capture useQuery / useMutation configs so we can pull the fns back out.
const invalidateQueriesMock = vi.fn();
vi.mock('@tanstack/react-query', () => ({
  useQuery: (config: unknown) => ({ __config: config }),
  useMutation: (config: unknown) => {
    const cfg = config as {
      mutationFn: (input: unknown) => Promise<unknown>;
      onSuccess?: (data: unknown, variables: unknown, ctx: unknown) => unknown;
    };
    return {
      __config: cfg,
      mutateAsync: async (input: unknown) => {
        const result = await cfg.mutationFn(input);
        if (cfg.onSuccess) cfg.onSuccess(result, input, undefined);
        return result;
      },
    };
  },
  useQueryClient: () => ({
    invalidateQueries: (...args: unknown[]) => invalidateQueriesMock(...args),
  }),
}));

// ── IMPORT UNDER TEST (after mocks) ──────────────────────────────────────────

import {
  useDistributions,
  useDistributionDetail,
  useCreateDistribution,
  useExecuteDistribution,
} from '../use-distributions';

// ── HELPERS ──────────────────────────────────────────────────────────────────

type QueryHookResult = { __config: { queryKey: unknown[]; queryFn: () => Promise<unknown>; enabled?: boolean; staleTime?: number } };
type MutationHookResult = {
  __config: { mutationFn: (input: unknown) => Promise<unknown>; onSuccess?: (...args: unknown[]) => unknown };
  mutateAsync: (input: unknown) => Promise<unknown>;
};

function asQuery(h: unknown): QueryHookResult {
  return h as QueryHookResult;
}
function asMutation(h: unknown): MutationHookResult {
  return h as MutationHookResult;
}

beforeEach(() => {
  apiPostMock.mockReset();
  invalidateQueriesMock.mockReset();
  apiPostMock.mockResolvedValue({});
});

// ── TESTS ────────────────────────────────────────────────────────────────────

describe('useDistributions (list_distributions)', () => {
  it('sends snake_case venture_id and action=list_distributions', async () => {
    const hook = asQuery(useDistributions({ ventureId: 'mcv-tech' }));
    await hook.__config.queryFn();

    expect(apiPostMock).toHaveBeenCalledTimes(1);
    const [endpoint, body] = apiPostMock.mock.calls[0] as [string, Record<string, unknown>];
    expect(endpoint).toBe('/api/distributions');
    expect(body.action).toBe('list_distributions');
    expect(body.venture_id).toBe('mcv-tech');
    // No camelCase leak
    expect(body).not.toHaveProperty('ventureId');
  });

  it('forwards status + limit as snake_case and default limit queryKey is 50', async () => {
    const hook = asQuery(useDistributions({ ventureId: 'v1', status: 'scheduled', limit: 25 }));
    expect(hook.__config.queryKey).toEqual(['distributions', 'list', 'v1', 'scheduled', 25]);

    await hook.__config.queryFn();
    const body = apiPostMock.mock.calls[0][1] as Record<string, unknown>;
    expect(body.status).toBe('scheduled');
    expect(body.limit).toBe(25);

    // And the default limit (when omitted) shows up in the queryKey as 50
    apiPostMock.mockReset();
    const hook2 = asQuery(useDistributions({}));
    expect(hook2.__config.queryKey).toEqual(['distributions', 'list', undefined, undefined, 50]);
  });
});

describe('useDistributionDetail (get_distribution)', () => {
  it('is disabled and does not invoke queryFn when id is null', () => {
    const hook = asQuery(useDistributionDetail(null));
    expect(hook.__config.enabled).toBe(false);
    // Note: react-query wouldn't call queryFn when disabled. We assert via the
    // `enabled` flag rather than triggering the fn — invoking a disabled
    // queryFn manually isn't the real-world behavior. apiPost must not have
    // been called as a side-effect of hook construction.
    expect(apiPostMock).not.toHaveBeenCalled();
  });

  it('sends snake_case distribution_id when id is provided', async () => {
    const hook = asQuery(useDistributionDetail('dist-abc'));
    expect(hook.__config.enabled).toBe(true);

    await hook.__config.queryFn();
    const [endpoint, body] = apiPostMock.mock.calls[0] as [string, Record<string, unknown>];
    expect(endpoint).toBe('/api/distributions');
    expect(body.action).toBe('get_distribution');
    expect(body.distribution_id).toBe('dist-abc');
    expect(body).not.toHaveProperty('distributionId');
  });
});

describe('useCreateDistribution (create_scheduled_distribution)', () => {
  it('translates ALL camelCase fields to snake_case with zero leakage', async () => {
    const mutation = asMutation(useCreateDistribution());
    await mutation.mutateAsync({
      ventureId: 'mcv-tech',
      distributionType: 'dividend',
      totalAmount: 100_000,
      currency: 'USD',
      roundId: 'round-7',
      scheduledFor: '2026-05-01T00:00:00Z',
      recordDate: '2026-04-20',
      exDate: '2026-04-19',
      notes: 'Q2 div',
      flowKind: 'dividend_cash',
      createdBy: 'user_abc',
    });

    expect(apiPostMock).toHaveBeenCalledTimes(1);
    const [endpoint, body] = apiPostMock.mock.calls[0] as [string, Record<string, unknown>];
    expect(endpoint).toBe('/api/distributions');
    expect(body).toEqual({
      action: 'create_scheduled_distribution',
      venture_id: 'mcv-tech',
      distribution_type: 'dividend',
      total_amount: 100_000,
      currency: 'USD',
      round_id: 'round-7',
      scheduled_for: '2026-05-01T00:00:00Z',
      record_date: '2026-04-20',
      ex_date: '2026-04-19',
      notes: 'Q2 div',
      flow_kind: 'dividend_cash',
      created_by: 'user_abc',
    });

    // Explicit anti-leak assertions for every camelCase name in the input type
    const leaks = [
      'ventureId',
      'distributionType',
      'totalAmount',
      'roundId',
      'scheduledFor',
      'recordDate',
      'exDate',
      'flowKind',
      'createdBy',
    ];
    for (const key of leaks) {
      expect(body).not.toHaveProperty(key);
    }
  });

  it('invalidates the distributions query tree on success', async () => {
    const mutation = asMutation(useCreateDistribution());
    await mutation.mutateAsync({
      ventureId: 'v1',
      distributionType: 'dividend',
      totalAmount: 1,
    });
    expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ['distributions'] });
  });
});

describe('useExecuteDistribution (execute_distribution)', () => {
  it('translates distributionId → distribution_id and actorId → actor_id', async () => {
    const mutation = asMutation(useExecuteDistribution());
    await mutation.mutateAsync({
      distributionId: 'dist-xyz',
      actorId: 'user_exec',
    });

    expect(apiPostMock).toHaveBeenCalledTimes(1);
    const [endpoint, body] = apiPostMock.mock.calls[0] as [string, Record<string, unknown>];
    expect(endpoint).toBe('/api/distributions');
    expect(body).toEqual({
      action: 'execute_distribution',
      distribution_id: 'dist-xyz',
      actor_id: 'user_exec',
    });
    expect(body).not.toHaveProperty('distributionId');
    expect(body).not.toHaveProperty('actorId');
  });

  it('invalidates the distributions query tree on success', async () => {
    const mutation = asMutation(useExecuteDistribution());
    await mutation.mutateAsync({ distributionId: 'd1' });
    expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ['distributions'] });
  });
});

describe('No camelCase leakage — comprehensive sweep', () => {
  it('no mutation payload ever carries a camelCase key from any hook', async () => {
    const create = asMutation(useCreateDistribution());
    await create.mutateAsync({
      ventureId: 'v',
      distributionType: 'dividend',
      totalAmount: 1,
      currency: 'USD',
      roundId: 'r',
      scheduledFor: 's',
      recordDate: 'rd',
      exDate: 'ed',
      notes: 'n',
      flowKind: 'fk',
      createdBy: 'cb',
    });
    const exec = asMutation(useExecuteDistribution());
    await exec.mutateAsync({ distributionId: 'd', actorId: 'a' });

    const allBodies = apiPostMock.mock.calls.map((c: unknown[]) => c[1] as Record<string, unknown>);
    const camelKeyRe = /[a-z][A-Z]/; // any lower→upper transition = camelCase
    for (const body of allBodies) {
      for (const key of Object.keys(body)) {
        expect(camelKeyRe.test(key), `key "${key}" is camelCase`).toBe(false);
      }
    }
  });
});
