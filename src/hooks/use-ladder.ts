// src/hooks/use-ladder.ts
// Marathon #3 T9.4 — global persona ladder (xp ranking) hook.

import { useQuery } from '@tanstack/react-query';
import { apiPost } from '../lib/api/client';

export interface LadderEntry {
  id: string;
  handle: string;
  full_name: string;
  title: string;
  department: string;
  seniority: string;
  scope_kind: 'global' | 'venture';
  scope_value: string | null;
  dimension: string | null;
  crown_affiliation: string | null;
  accent_color: string | null;
  avatar_url: string | null;
  xp: number;
  rank: number;
  level: number;
}

export interface UseLadderOptions {
  limit?: number;
}

export function useLadder(opts?: UseLadderOptions) {
  const limit = opts?.limit ?? 50;
  return useQuery({
    queryKey: ['gamification', 'ladder', limit],
    queryFn: () =>
      apiPost<{ ladder: LadderEntry[] }>('/api/gamification', {
        action: 'get_ladder',
        limit: opts?.limit,
      }),
    staleTime: 30_000,
  });
}
