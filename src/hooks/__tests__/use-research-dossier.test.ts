import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock apiPost so we can capture call args without hitting the network.
vi.mock('../../lib/api/client', () => ({
  apiPost: vi.fn(async () => ({ dossiers: [], dossier: null })),
}));

// Mock @tanstack/react-query to a lightweight shim: useQuery just invokes
// queryFn when enabled so we can snapshot the body sent to apiPost.
vi.mock('@tanstack/react-query', () => ({
  useQuery: (opts: { queryFn: () => Promise<unknown>; enabled?: boolean; queryKey: unknown[] }) => {
    const enabled = opts.enabled !== false;
    return {
      queryKey: opts.queryKey,
      enabled,
      invoke: enabled ? opts.queryFn : undefined,
    };
  },
  useMutation: (opts: { mutationFn: (v: unknown) => Promise<unknown> }) => ({
    mutateAsync: opts.mutationFn,
  }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

import { apiPost } from '../../lib/api/client';
import { useResearchDossiers, useLatestDossier } from '../use-research-dossier';

const mockedApiPost = apiPost as unknown as ReturnType<typeof vi.fn>;

describe('use-research-dossier', () => {
  beforeEach(() => {
    mockedApiPost.mockClear();
  });

  it('useResearchDossiers sends action=list_dossiers with snake_case body', async () => {
    const q = useResearchDossiers({ entityType: 'prospect', entityId: 'prospect-123' }) as unknown as {
      invoke?: () => Promise<unknown>;
      enabled: boolean;
    };
    expect(q.enabled).toBe(true);
    await q.invoke!();

    expect(mockedApiPost).toHaveBeenCalledTimes(1);
    expect(mockedApiPost).toHaveBeenCalledWith('/api/research', {
      action: 'list_dossiers',
      entity_type: 'prospect',
      entity_id: 'prospect-123',
    });
    // No camelCase leakage on the wire.
    const body = mockedApiPost.mock.calls[0][1] as Record<string, unknown>;
    expect(body).not.toHaveProperty('entityType');
    expect(body).not.toHaveProperty('entityId');
  });

  it('useLatestDossier sends action=latest_dossier with snake_case body', async () => {
    const q = useLatestDossier({ entityType: 'venture', entityId: 'venture-abc' }) as unknown as {
      invoke?: () => Promise<unknown>;
      enabled: boolean;
    };
    await q.invoke!();

    expect(mockedApiPost).toHaveBeenCalledWith('/api/research', {
      action: 'latest_dossier',
      entity_type: 'venture',
      entity_id: 'venture-abc',
    });
  });

  it('is disabled when entityId is null (queryFn not invoked)', async () => {
    const q = useResearchDossiers({ entityType: 'prospect', entityId: null }) as unknown as {
      invoke?: () => Promise<unknown>;
      enabled: boolean;
    };
    expect(q.enabled).toBe(false);
    expect(q.invoke).toBeUndefined();
    expect(mockedApiPost).not.toHaveBeenCalled();
  });

  it('is disabled when entityId is undefined', () => {
    const q = useLatestDossier({ entityType: 'contact', entityId: undefined }) as unknown as { enabled: boolean };
    expect(q.enabled).toBe(false);
    expect(mockedApiPost).not.toHaveBeenCalled();
  });
});
