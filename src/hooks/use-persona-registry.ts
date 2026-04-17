// src/hooks/use-persona-registry.ts
// Marathon #2 T5.3 — typed persona registry with dimension/department/scope
// grouping. Derivation logic lives in the pure `derivePersonaRegistry` helper
// so it can be unit-tested without a React/React Query runtime (matches the
// T1.6 selectSuiteTiles pattern).

import { useQuery } from '@tanstack/react-query';
import { apiPost } from '../lib/api/client';

export type Dimension = '6D' | '5D' | '4D' | '3D' | '2D' | '1D';

export interface Persona {
  id: string;
  handle: string;
  full_name: string;
  title: string;
  department: string;
  seniority: string;
  scope_kind: 'global' | 'venture';
  scope_value: string | null;
  reports_to_agent_id: string | null;
  persona_bio: string;
  voice_profile: Record<string, unknown>;
  system_prompt: string;
  avatar_url: string | null;
  accent_color: string | null;
  active: boolean;
  hired_at: string;

  // M2 T5.1 additions — optional because the migration may not be applied yet
  // at read time. Consumers should tolerate `undefined` / `null`.
  dimension?: Dimension | null;
  crown_affiliation?: string | null;
  xp?: number;
}

export type DimensionBucket = Dimension | 'unknown';

export interface PersonaRegistry {
  personas: Persona[];
  byDepartment: Record<string, Persona[]>;
  byDimension: Record<DimensionBucket, Persona[]>;
  byScope: { global: Persona[]; byVenture: Record<string, Persona[]> };
  totals: {
    all: number;
    chiefs: number;
    seniors: number;
    byDimension: Record<string, number>;
  };
}

/**
 * Pure derivation — group personas by department, dimension, and scope, and
 * compute rollup totals. Extracted so it can be tested without React.
 */
export function derivePersonaRegistry(personas: Persona[]): PersonaRegistry {
  const byDepartment: Record<string, Persona[]> = {};
  const byDimension: Record<DimensionBucket, Persona[]> = {
    '6D': [],
    '5D': [],
    '4D': [],
    '3D': [],
    '2D': [],
    '1D': [],
    unknown: [],
  };
  const byVenture: Record<string, Persona[]> = {};
  const global: Persona[] = [];

  for (const p of personas) {
    (byDepartment[p.department] ??= []).push(p);
    const dim: DimensionBucket = (p.dimension ?? 'unknown') as DimensionBucket;
    (byDimension[dim] ??= []).push(p);
    if (p.scope_kind === 'venture' && p.scope_value) {
      (byVenture[p.scope_value] ??= []).push(p);
    } else {
      global.push(p);
    }
  }

  const totals = {
    all: personas.length,
    chiefs: personas.filter(
      (p) => p.seniority === 'chief' || p.seniority === 'chief_of_staff',
    ).length,
    seniors: personas.filter((p) => p.seniority === 'senior').length,
    byDimension: Object.fromEntries(
      Object.entries(byDimension).map(([k, v]) => [k, v.length]),
    ),
  };

  return {
    personas,
    byDepartment,
    byDimension,
    byScope: { global, byVenture },
    totals,
  };
}

/**
 * React Query hook — fetches the active persona roster and returns the
 * derived registry plus loading/error state.
 */
export function usePersonaRegistry() {
  const q = useQuery({
    queryKey: ['persona-registry', 'list'],
    queryFn: async () =>
      apiPost<{ personas: Persona[] }>('/api/personas', {
        action: 'list_personas',
      }),
    staleTime: 60_000,
  });

  const registry = derivePersonaRegistry(q.data?.personas ?? []);

  return { ...registry, isLoading: q.isLoading, error: q.error };
}
