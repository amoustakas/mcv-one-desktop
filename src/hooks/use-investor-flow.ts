// src/hooks/use-investor-flow.ts
// Investor-flow hooks: round browse, accreditation submit, soft commit, payment kickoff.
// camelCase in / snake_case out — wire contract matches api/_handlers/investor-flow.ts.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '../lib/api/client';

// ───────────────────────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────────────────────

export interface RoundSummary {
  id: string;
  venture_id: string;
  name: string;
  slug: string;
  round_type: string;
  raise_lane: string;
  status: string;
  target_raise: number;
  soft_cap: number | null;
  hard_cap: number | null;
  minimum_check: number;
  maximum_check: number | null;
  currency: string;
  pre_money_valuation: number | null;
  price_per_share: number | null;
  price_per_token: number | null;
  is_public: boolean;
  public_page_slug: string | null;
  featured_order: number | null;
  accredited_only: boolean;
  jurisdiction_restrictions: string[];
  total_committed: number;
  total_funded: number;
  total_investors: number;
  open_date: string | null;
  close_date: string | null;
  funding_deadline: string | null;
  pitch_deck_url: string | null;
  data_room_url: string | null;
  term_sheet_url: string | null;
  token_symbol: string | null;
  tags: string[];
  progress_pct: number;
  venture: {
    id: string;
    name: string;
    type: string | null;
    category: string | null;
    funding_stage: string | null;
  } | null;
  brand: {
    venture_id: string;
    primary_domain: string | null;
    color_primary: string | null;
    color_accent: string | null;
  } | null;
}

export interface RoundDetail extends RoundSummary {
  description: string | null;
  allocations: Array<{ venture_id: string; allocation_pct: number }>;
  // Additional fields the handler returns for detail view flow through via index signature below.
  [key: string]: unknown;
}

export type AccreditationMethod =
  | 'self_attestation'
  | 'cpa_letter'
  | 'income'
  | 'net_worth'
  | 'professional_cert';

export interface SubmitAccreditationInput {
  contactId: string;
  ventureId: string;
  accreditationMethod: AccreditationMethod;
  jurisdiction: string;
  documents?: Array<{ type: string; url: string; uploadedAt: string }>;
  organizationId?: string;
  walletAddress?: string;
  walletChain?: string;
  actorUserId?: string;
}

export interface SubmitAccreditationResult {
  profile: Record<string, unknown>;
  estimated_review_hours: number;
}

export interface CreateSoftCommitInput {
  contactId: string;
  roundId: string;
  amount: number;
  currency?: string;
  paymentMethod?: string;
  walletAddress?: string;
  walletChain?: string;
  notes?: string;
  source?: string;
  referralContactId?: string;
  actorUserId?: string;
}

export interface SoftCommitResult {
  commitment: Record<string, unknown> & {
    id: string;
    venture_id: string;
    contact_id: string;
    round_id: string;
    status: string;
    amount: number;
    amount_usd: number;
    currency: string;
  };
}

export interface KickoffPaymentInput {
  commitmentId: string;
  paymentMethod: string;
  actorUserId?: string;
}

export interface KickoffPaymentResult {
  payment_intent: Record<string, unknown> & {
    id: string;
    status: string;
    processor_id: string;
    amount: number;
  };
}

// ───────────────────────────────────────────────────────────────────────────
// Query hooks
// ───────────────────────────────────────────────────────────────────────────

/**
 * Browse all publicly-listed rounds. Cached for 60s.
 * Backs the Marketplace / Discovery surfaces.
 */
export function usePublicRounds() {
  return useQuery({
    queryKey: ['investor-flow', 'public-rounds'],
    queryFn: () =>
      apiPost<{ rounds: RoundSummary[] }>('/api/investor-flow', {
        action: 'list_public_rounds',
      }),
    staleTime: 60_000,
  });
}

/**
 * Fetch detail for a single round, either by UUID or public-page slug.
 * Query is disabled until one of the two identifiers is present.
 */
export function useRoundDetail(params: { roundId?: string; publicPageSlug?: string }) {
  const hasIdent = !!(params.roundId || params.publicPageSlug);
  return useQuery({
    queryKey: ['investor-flow', 'round', params.roundId ?? params.publicPageSlug ?? null],
    queryFn: () =>
      apiPost<{ round: RoundDetail | null }>('/api/investor-flow', {
        action: 'get_round_detail',
        round_id: params.roundId,
        public_page_slug: params.publicPageSlug,
      }),
    enabled: hasIdent,
    staleTime: 30_000,
  });
}

// ───────────────────────────────────────────────────────────────────────────
// Mutations
// ───────────────────────────────────────────────────────────────────────────

/**
 * Submit (or refresh) an accreditation profile for a contact + venture tuple.
 * Translates camelCase input fields to snake_case wire body.
 */
export function useSubmitAccreditation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SubmitAccreditationInput): Promise<SubmitAccreditationResult> => {
      return apiPost<SubmitAccreditationResult>('/api/investor-flow', {
        action: 'submit_accreditation',
        contact_id: input.contactId,
        venture_id: input.ventureId,
        accreditation_method: input.accreditationMethod,
        jurisdiction: input.jurisdiction,
        documents: input.documents?.map((d) => ({
          type: d.type,
          url: d.url,
          uploaded_at: d.uploadedAt,
        })),
        organization_id: input.organizationId,
        wallet_address: input.walletAddress,
        wallet_chain: input.walletChain,
        actor_user_id: input.actorUserId,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['investor-flow'] });
      qc.invalidateQueries({ queryKey: ['capital-investor-profile'] });
    },
  });
}

/**
 * Create a soft commitment on an open round. Server performs compliance gate
 * (accreditation + jurisdiction + round caps) and returns the commitment row.
 */
export function useCreateSoftCommit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateSoftCommitInput): Promise<SoftCommitResult> => {
      return apiPost<SoftCommitResult>('/api/investor-flow', {
        action: 'create_soft_commit',
        contact_id: input.contactId,
        round_id: input.roundId,
        amount: input.amount,
        currency: input.currency,
        payment_method: input.paymentMethod,
        wallet_address: input.walletAddress,
        wallet_chain: input.walletChain,
        notes: input.notes,
        source: input.source,
        referral_contact_id: input.referralContactId,
        actor_user_id: input.actorUserId,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['investor-flow'] });
      qc.invalidateQueries({ queryKey: ['capital-commitments'] });
    },
  });
}

/**
 * Kick off a payment intent against an existing soft commitment. Hands off to
 * the payments router (Stripe / Plaid / crypto / wire). T6.4 implements the
 * server handler; until then this returns 501.
 */
export function useKickoffPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: KickoffPaymentInput): Promise<KickoffPaymentResult> => {
      return apiPost<KickoffPaymentResult>('/api/investor-flow', {
        action: 'kickoff_payment',
        commitment_id: input.commitmentId,
        payment_method: input.paymentMethod,
        actor_user_id: input.actorUserId,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['investor-flow'] });
      qc.invalidateQueries({ queryKey: ['capital-commitments'] });
      qc.invalidateQueries({ queryKey: ['payment-intents'] });
    },
  });
}
