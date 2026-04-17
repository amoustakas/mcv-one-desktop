// Contract tests for usePersonaXp + usePersonaAchievements (Marathon #3 T9.4).
//
// Strategy: mock apiPost + @tanstack/react-query. Verifies:
//   - camelCase `agentId` input → snake_case `agent_id` wire body
//   - hooks are disabled when agentId is null (no apiPost call)
//   - achievements hook uses the correct action string
//   - query keys are distinct across the three hooks (including useLadder)

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
import { usePersonaXp, usePersonaAchievements } from '../use-persona-xp';
import { useLadder } from '../use-ladder';

const mockedApiPost = apiPost as unknown as ReturnType<typeof vi.fn>;

describe('usePersonaXp — contract', () => {
  beforeEach(() => {
    mockedApiPost.mockClear();
    mockedApiPost.mockResolvedValue({});
  });

  it('snake-cases agentId input into agent_id on the wire with action=get_persona_xp', async () => {
    mockedApiPost.mockResolvedValueOnce({ persona: null, events: [], by_kind: {} });
    const q = usePersonaXp('agent-42') as unknown as {
      invoke: () => Promise<unknown>;
      enabled: boolean;
      queryKey: unknown[];
      staleTime: number;
    };
    expect(q.enabled).toBe(true);
    await q.invoke();

    expect(mockedApiPost).toHaveBeenCalledTimes(1);
    const [path, body] = mockedApiPost.mock.calls[0] as [string, Record<string, unknown>];
    expect(path).toBe('/api/gamification');
    expect(body.action).toBe('get_persona_xp');
    expect(body.agent_id).toBe('agent-42');
    expect(body).not.toHaveProperty('agentId');
    expect(q.queryKey).toEqual(['gamification', 'persona-xp', 'agent-42', 100]);
    expect(q.staleTime).toBe(15_000);
  });

  it('forwards explicit limit to body and query key', async () => {
    mockedApiPost.mockResolvedValueOnce({ persona: null, events: [], by_kind: {} });
    const q = usePersonaXp('agent-42', { limit: 25 }) as unknown as {
      invoke: () => Promise<unknown>;
      queryKey: unknown[];
    };
    await q.invoke();

    const [, body] = mockedApiPost.mock.calls[0] as [string, Record<string, unknown>];
    expect(body.agent_id).toBe('agent-42');
    expect(body.limit).toBe(25);
    expect(q.queryKey).toEqual(['gamification', 'persona-xp', 'agent-42', 25]);
  });

  it('is disabled when agentId is null — apiPost is NOT called', () => {
    const q = usePersonaXp(null) as unknown as {
      invoke?: () => Promise<unknown>;
      enabled: boolean;
    };
    expect(q.enabled).toBe(false);
    expect(q.invoke).toBeUndefined();
    expect(mockedApiPost).not.toHaveBeenCalled();
  });
});

describe('usePersonaAchievements — contract', () => {
  beforeEach(() => {
    mockedApiPost.mockClear();
    mockedApiPost.mockResolvedValue({ achievements: [] });
  });

  it('calls /api/gamification with action=get_persona_achievements + snake_case agent_id', async () => {
    const q = usePersonaAchievements('agent-42') as unknown as {
      invoke: () => Promise<unknown>;
      enabled: boolean;
      queryKey: unknown[];
      staleTime: number;
    };
    expect(q.enabled).toBe(true);
    await q.invoke();

    const [path, body] = mockedApiPost.mock.calls[0] as [string, Record<string, unknown>];
    expect(path).toBe('/api/gamification');
    expect(body.action).toBe('get_persona_achievements');
    expect(body.agent_id).toBe('agent-42');
    expect(body).not.toHaveProperty('agentId');
    expect(body).not.toHaveProperty('limit');
    expect(q.queryKey).toEqual(['gamification', 'achievements', 'agent-42']);
    expect(q.staleTime).toBe(60_000);
  });

  it('is disabled when agentId is null', () => {
    const q = usePersonaAchievements(null) as unknown as {
      invoke?: () => Promise<unknown>;
      enabled: boolean;
    };
    expect(q.enabled).toBe(false);
    expect(q.invoke).toBeUndefined();
    expect(mockedApiPost).not.toHaveBeenCalled();
  });
});

describe('gamification hooks — query-key distinctness', () => {
  it('useLadder, usePersonaXp, usePersonaAchievements produce distinct query keys', () => {
    const ladder = useLadder() as unknown as { queryKey: unknown[] };
    const xp = usePersonaXp('agent-42') as unknown as { queryKey: unknown[] };
    const ach = usePersonaAchievements('agent-42') as unknown as { queryKey: unknown[] };

    // All three keys share the top-level 'gamification' namespace...
    expect(ladder.queryKey[0]).toBe('gamification');
    expect(xp.queryKey[0]).toBe('gamification');
    expect(ach.queryKey[0]).toBe('gamification');

    // ...but diverge at the second segment so React Query caches them independently.
    const keys = [ladder.queryKey, xp.queryKey, ach.queryKey].map((k) => JSON.stringify(k));
    expect(new Set(keys).size).toBe(3);
    expect(ladder.queryKey[1]).toBe('ladder');
    expect(xp.queryKey[1]).toBe('persona-xp');
    expect(ach.queryKey[1]).toBe('achievements');
  });
});
