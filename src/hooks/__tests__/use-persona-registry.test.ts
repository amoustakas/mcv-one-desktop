// Contract + derivation tests for usePersonaRegistry (Marathon #2 T5.3).
//
// Strategy: the heavy lifting lives in the pure `derivePersonaRegistry` helper
// which is tested directly (no React, no React Query timing). The hook itself
// is covered by a minimal mock-based test that asserts the apiPost contract
// (endpoint + snake_case action) — matching the T3.8 pattern.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Persona } from '../use-persona-registry';

const apiPostMock = vi.fn();

vi.mock('../../lib/api/client', () => ({
  apiPost: (path: string, body: unknown) => apiPostMock(path, body),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryFn }: { queryFn: () => Promise<unknown> }) => {
    // Fire the query function so the apiPost mock observes the call, but
    // return a synchronous "empty" shape — derivation correctness is verified
    // via the pure helper below, not through the query lifecycle.
    void queryFn();
    return { data: undefined, error: null, isLoading: true };
  },
}));

import { usePersonaRegistry, derivePersonaRegistry } from '../use-persona-registry';

function makePersona(overrides: Partial<Persona>): Persona {
  return {
    id: 'id',
    handle: '@handle',
    full_name: 'Name',
    title: 'Title',
    department: 'ops',
    seniority: 'senior',
    scope_kind: 'global',
    scope_value: null,
    reports_to_agent_id: null,
    persona_bio: '',
    voice_profile: {},
    system_prompt: '',
    avatar_url: null,
    accent_color: null,
    active: true,
    hired_at: '2026-04-16',
    ...overrides,
  };
}

describe('derivePersonaRegistry', () => {
  it('groups personas by department, dimension, and scope with totals', () => {
    const personas: Persona[] = [
      makePersona({
        id: '1',
        handle: '@atlas',
        full_name: 'Atlas',
        title: 'CoS',
        department: 'chief_of_staff',
        seniority: 'chief_of_staff',
        scope_kind: 'global',
        scope_value: null,
        dimension: '5D',
        crown_affiliation: 'mcv-inc-crown',
        xp: 0,
      }),
      makePersona({
        id: '2',
        handle: '@sterling',
        full_name: 'Hannah Sterling',
        title: 'IR',
        department: 'ir_comms',
        seniority: 'senior',
        scope_kind: 'venture',
        scope_value: 'futurestate',
        dimension: '4D',
        crown_affiliation: 'mcv-inc-crown',
        xp: 0,
      }),
      makePersona({
        id: '3',
        handle: '@nico',
        full_name: 'Nico',
        title: 'Growth',
        department: 'growth_marketing',
        seniority: 'senior',
        scope_kind: 'venture',
        scope_value: 'betedge',
        dimension: '4D',
        crown_affiliation: 'mcv-inc-crown',
        xp: 0,
      }),
    ];

    const r = derivePersonaRegistry(personas);

    expect(r.totals.all).toBe(3);
    expect(r.totals.chiefs).toBe(1); // @atlas (chief_of_staff counted as chief)
    expect(r.totals.seniors).toBe(2);
    expect(r.byDepartment.ir_comms).toHaveLength(1);
    expect(r.byDepartment.chief_of_staff).toHaveLength(1);
    expect(r.byDepartment.growth_marketing).toHaveLength(1);
    expect(r.byDimension['5D']).toHaveLength(1);
    expect(r.byDimension['4D']).toHaveLength(2);
    expect(r.byDimension['6D']).toHaveLength(0);
    expect(r.byScope.byVenture.futurestate).toHaveLength(1);
    expect(r.byScope.byVenture.betedge).toHaveLength(1);
    expect(r.byScope.global).toHaveLength(1);
    expect(r.totals.byDimension['4D']).toBe(2);
    expect(r.totals.byDimension['5D']).toBe(1);
  });

  it('buckets personas without dimension into "unknown"', () => {
    const personas: Persona[] = [
      makePersona({ id: '1', handle: '@legacy' }), // no dimension
      makePersona({ id: '2', handle: '@null-dim', dimension: null }),
      makePersona({ id: '3', handle: '@dim-6d', dimension: '6D' }),
    ];

    const r = derivePersonaRegistry(personas);

    expect(r.byDimension.unknown).toHaveLength(2);
    expect(r.byDimension['6D']).toHaveLength(1);
    expect(r.totals.byDimension.unknown).toBe(2);
  });

  it('returns empty buckets for an empty persona list', () => {
    const r = derivePersonaRegistry([]);
    expect(r.totals.all).toBe(0);
    expect(r.totals.chiefs).toBe(0);
    expect(r.totals.seniors).toBe(0);
    expect(Object.keys(r.byDepartment)).toHaveLength(0);
    expect(r.byDimension['6D']).toEqual([]);
    expect(r.byDimension.unknown).toEqual([]);
    expect(r.byScope.global).toEqual([]);
    expect(Object.keys(r.byScope.byVenture)).toHaveLength(0);
  });
});

describe('usePersonaRegistry hook contract', () => {
  beforeEach(() => apiPostMock.mockReset());

  it('calls apiPost with snake_case action against /api/personas', () => {
    apiPostMock.mockResolvedValue({ personas: [] });
    usePersonaRegistry();
    expect(apiPostMock).toHaveBeenCalledWith('/api/personas', {
      action: 'list_personas',
    });
  });

  it('returns an empty registry shape while loading', () => {
    apiPostMock.mockResolvedValue({ personas: [] });
    const r = usePersonaRegistry();
    expect(r.personas).toEqual([]);
    expect(r.isLoading).toBe(true);
    expect(r.totals.all).toBe(0);
    expect(r.byDimension).toBeDefined();
    expect(r.byScope.global).toEqual([]);
  });
});
