// src/hooks/use-distributions.ts
//
// React Query hooks for the T8.2 distributions handler
// (`/api/distributions` — list/get/create_scheduled/execute).
//
// Naming contract: hooks accept camelCase inputs; apiPost payloads must
// be snake_case to match the handler's schema. Do not let camelCase leak
// into the request body — the handler will silently ignore unknown keys.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '../lib/api/client';

export type DistributionType =
  | 'dividend'
  | 'interest'
  | 'yield'
  | 'token_airdrop'
  | 'buyback'
  | 'return_of_capital'
  | 'fee_rebate'
  | 'other';

export type DistributionStatus =
  | 'scheduled'
  | 'processing'
  | 'partial'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface Distribution {
  id: string;
  venture_id: string;
  round_id: string | null;
  distribution_type: DistributionType;
  status: DistributionStatus;
  scheduled_for: string | null;
  processed_at: string | null;
  completed_at: string | null;
  total_amount: number;
  currency: string;
  total_recipients: number;
  total_paid: number;
  notes: string | null;
  flow_kind: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DistributionLeg {
  id: string;
  distribution_id: string;
  recipient_type: string;
  recipient_id: string;
  royalty_layer_id: string | null;
  amount: number;
  currency: string;
  status: string;
  stripe_transfer_id: string | null;
  tx_hash: string | null;
  settled_at: string | null;
  failure_reason: string | null;
  metadata: Record<string, unknown>;
}

export interface DistributionRecipient {
  id: string;
  distribution_id: string;
  contact_id: string;
  commitment_id: string | null;
  amount: number;
  currency: string;
  amount_usd: number;
  payment_method: string | null;
  status: string;
  paid_at: string | null;
}

export interface DistributionDetail {
  distribution: Distribution;
  legs: DistributionLeg[];
  recipients: DistributionRecipient[];
}

export interface ListDistributionsInput {
  ventureId?: string;
  status?: DistributionStatus;
  limit?: number;
}

export interface CreateDistributionInput {
  ventureId: string;
  distributionType: DistributionType;
  totalAmount: number;
  currency?: string;
  roundId?: string;
  scheduledFor?: string;
  recordDate?: string;
  exDate?: string;
  notes?: string;
  flowKind?: string;
  createdBy?: string;
}

export interface ExecuteDistributionInput {
  distributionId: string;
  actorId?: string;
}

/** List distributions, optionally filtered by venture/status. */
export function useDistributions(input: ListDistributionsInput = {}) {
  return useQuery({
    queryKey: ['distributions', 'list', input.ventureId, input.status, input.limit ?? 50],
    queryFn: () =>
      apiPost<{ distributions: Distribution[] }>('/api/distributions', {
        action: 'list_distributions',
        venture_id: input.ventureId,
        status: input.status,
        limit: input.limit,
      }),
    staleTime: 30_000,
  });
}

/** Fetch a single distribution + its legs + recipients. Disabled when id is null. */
export function useDistributionDetail(distributionId: string | null) {
  return useQuery({
    queryKey: ['distributions', 'detail', distributionId],
    queryFn: () =>
      apiPost<DistributionDetail>('/api/distributions', {
        action: 'get_distribution',
        distribution_id: distributionId!,
      }),
    enabled: !!distributionId,
    staleTime: 10_000,
  });
}

/** Create a scheduled distribution. Invalidates the list on success. */
export function useCreateDistribution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDistributionInput) =>
      apiPost<{ distribution: Distribution }>('/api/distributions', {
        action: 'create_scheduled_distribution',
        venture_id: input.ventureId,
        distribution_type: input.distributionType,
        total_amount: input.totalAmount,
        currency: input.currency,
        round_id: input.roundId,
        scheduled_for: input.scheduledFor,
        record_date: input.recordDate,
        ex_date: input.exDate,
        notes: input.notes,
        flow_kind: input.flowKind,
        created_by: input.createdBy,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['distributions'] }),
  });
}

/** Execute a scheduled distribution via the active royalty graph. */
export function useExecuteDistribution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ExecuteDistributionInput) =>
      apiPost<DistributionDetail>('/api/distributions', {
        action: 'execute_distribution',
        distribution_id: input.distributionId,
        actor_id: input.actorId,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['distributions'] });
    },
  });
}
