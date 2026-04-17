// src/hooks/use-commitment.ts
// T6.7 — single-commitment polling hook for FundingStepsView + PaymentProgressStrip.
// Polls until status reaches 'funded' or 'distributed', then stops.

import { useQuery } from '@tanstack/react-query';
import { apiPost } from '../lib/api/client';

export interface Commitment {
  id: string;
  venture_id: string;
  contact_id: string;
  round_id: string;
  status: 'interest' | 'soft_committed' | 'reserved' | 'funded' | 'distributed' | string;
  amount: number;
  amount_usd: number;
  currency: string;
  payment_method: string | null;
  payment_reference: string | null;
  notes: string | null;
  interest_expressed_at: string | null;
  soft_committed_at: string | null;
  reserved_at: string | null;
  funded_at: string | null;
  distributed_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface UseCommitmentOptions {
  /** Polling interval in ms while commitment is pre-funded. Default 4000. */
  pollMs?: number;
}

/**
 * Fetch a single capital_commitments row by id. While the commitment is
 * pre-funded (status ∈ {interest, soft_committed, reserved}), the query
 * auto-refetches every `pollMs` so the UI reflects webhook-driven state
 * transitions (e.g. processor callback marks commitment funded). Polling
 * stops once status is 'funded' or 'distributed'.
 */
export function useCommitment(commitmentId: string | null, opts?: UseCommitmentOptions) {
  return useQuery({
    queryKey: ['commitment', commitmentId],
    queryFn: () =>
      apiPost<{ commitment: Commitment | null }>('/api/investor-flow', {
        action: 'get_commitment',
        commitment_id: commitmentId!,
      }),
    enabled: !!commitmentId,
    refetchInterval: (q) => {
      const status = q.state.data?.commitment?.status;
      if (status === 'funded' || status === 'distributed') return false;
      return opts?.pollMs ?? 4_000;
    },
    staleTime: 2_000,
  });
}
