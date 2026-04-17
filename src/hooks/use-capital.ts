// React Query hooks for EdgeIQ Capital. Backs /api/capital handler.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '../lib/api/client';
import type {
  Round, Commitment, InvestorProfile, Activity, Organization, CapitalDocument,
  GlobalSummary, VentureSummary, ContactStage, RoundStatus, CommitmentStatus,
  CreateRoundInput, CreateCommitmentInput, UpsertInvestorProfileInput,
  RoundContentEntry, RoundContentRole, CapitalContentRow, ContentVisibility,
  Distribution, DistributionRecipient, CreateDistributionInput,
  DistributionType, DistributionStatus,
} from '@mcv/capital-sdk';

// ─── Rounds ─────────────────────────────────────────────────────────────

export function useRounds(ventureId?: string, status?: RoundStatus) {
  return useQuery({
    queryKey: ['capital', 'rounds', ventureId ?? 'all', status ?? 'any'],
    queryFn: async () => {
      const data = await apiPost<{ rounds: Round[] }>('/api/capital', {
        action: 'list-rounds',
        venture_id: ventureId,
        status,
      });
      return data.rounds;
    },
  });
}

export function useRound(id: string | null | undefined) {
  return useQuery({
    queryKey: ['capital', 'round', id],
    queryFn: async () => {
      if (!id) return null;
      const data = await apiPost<{ round: Round | null }>('/api/capital', {
        action: 'get-round',
        id,
      });
      return data.round;
    },
    enabled: Boolean(id),
  });
}

export function useCreateRound() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (round: CreateRoundInput) => {
      const data = await apiPost<{ round: Round }>('/api/capital', { action: 'create-round', round });
      return data.round;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['capital', 'rounds'] });
      qc.invalidateQueries({ queryKey: ['capital', 'global-summary'] });
    },
  });
}

export function useUpdateRoundStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id: string; status: RoundStatus }) => {
      const data = await apiPost<{ round: Round }>('/api/capital', {
        action: 'update-round-status',
        id: args.id,
        status: args.status,
      });
      return data.round;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['capital', 'rounds'] });
      qc.invalidateQueries({ queryKey: ['capital', 'round'] });
    },
  });
}

// ─── Commitments ────────────────────────────────────────────────────────

export function useCommitments(ventureId: string | undefined, filters?: { roundId?: string; contactId?: string; status?: CommitmentStatus }) {
  return useQuery({
    queryKey: ['capital', 'commitments', ventureId, filters],
    queryFn: async () => {
      const data = await apiPost<{ commitments: Commitment[] }>('/api/capital', {
        action: 'list-commitments',
        venture_id: ventureId,
        round_id: filters?.roundId,
        contact_id: filters?.contactId,
        status: filters?.status,
      });
      return data.commitments;
    },
    enabled: Boolean(ventureId),
  });
}

export function useCommitmentsByRound(roundId: string | null | undefined) {
  return useQuery({
    queryKey: ['capital', 'commitments-by-round', roundId],
    queryFn: async () => {
      if (!roundId) return [];
      const data = await apiPost<{ commitments: Commitment[] }>('/api/capital', {
        action: 'list-commitments-by-round',
        round_id: roundId,
      });
      return data.commitments;
    },
    enabled: Boolean(roundId),
  });
}

export function useCreateCommitment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (commitment: CreateCommitmentInput) => {
      const data = await apiPost<{ commitment: Commitment }>('/api/capital', {
        action: 'create-commitment',
        commitment,
      });
      return data.commitment;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['capital'] }),
  });
}

export function useUpdateCommitmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id: string; status: CommitmentStatus }) => {
      const data = await apiPost<{ commitment: Commitment }>('/api/capital', {
        action: 'update-commitment-status',
        id: args.id,
        status: args.status,
      });
      return data.commitment;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['capital'] }),
  });
}

export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { commitmentId: string; paymentMethod: string; paymentReference: string }) => {
      const data = await apiPost<{ commitment: Commitment }>('/api/capital', {
        action: 'record-payment',
        commitment_id: args.commitmentId,
        payment_method: args.paymentMethod,
        payment_reference: args.paymentReference,
      });
      return data.commitment;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['capital'] }),
  });
}

// ─── Investors ──────────────────────────────────────────────────────────

export function useInvestors(ventureId?: string, filters?: { stage?: ContactStage; contactType?: string }) {
  return useQuery({
    queryKey: ['capital', 'investors', ventureId, filters],
    queryFn: async () => {
      const data = await apiPost<{ investors: InvestorProfile[] }>('/api/capital', {
        action: 'list-investors',
        venture_id: ventureId,
        stage: filters?.stage,
        contact_type: filters?.contactType,
      });
      return data.investors;
    },
  });
}

/**
 * Rounds available to a specific investor — filtered by:
 *   - round.status === 'open'
 *   - round.accredited_only ? investor.accreditation in {verified_accredited, qualified_purchaser, institutional} : true
 *
 * Venture filter is optional; when omitted, returns rounds across every
 * venture the investor has an ecosystem link to. Callers can always filter
 * again client-side (e.g. by raise_lane) on the returned list.
 *
 * Empty list is fine: that's the "no live rounds right now" state.
 */
export function useRoundsForInvestor(contactId: string | null | undefined, ventureId?: string) {
  const positionQuery = useInvestorPosition(contactId);
  const roundsQuery = useRounds(ventureId, 'open');

  const investorProfile = positionQuery.data?.profile ?? null;
  const investorStatus = investorProfile?.accreditationStatus ?? 'unknown';
  const canSeeAccreditedOnly = investorStatus === 'verified_accredited'
    || investorStatus === 'qualified_purchaser'
    || investorStatus === 'institutional';

  const eligibleRounds = (roundsQuery.data ?? []).filter((r) => {
    if (r.status !== 'open') return false;
    if (r.accreditedOnly && !canSeeAccreditedOnly) return false;
    return true;
  });

  return {
    rounds: eligibleRounds,
    investorProfile,
    isLoading: positionQuery.isLoading || roundsQuery.isLoading,
    error: positionQuery.error ?? roundsQuery.error ?? null,
  };
}

export function useInvestorPosition(contactId: string | null | undefined) {
  return useQuery({
    queryKey: ['capital', 'investor-position', contactId],
    queryFn: async () => {
      if (!contactId) return null;
      const data = await apiPost<{ profile: InvestorProfile | null; commitments: Commitment[] }>('/api/capital', {
        action: 'get-investor-position',
        contact_id: contactId,
      });
      return data;
    },
    enabled: Boolean(contactId),
  });
}

export function useUpsertInvestorProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UpsertInvestorProfileInput) => {
      const data = await apiPost<{ profile: InvestorProfile }>('/api/capital', {
        action: 'upsert-investor-profile',
        profile,
      });
      return data.profile;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['capital', 'investors'] }),
  });
}

// ─── Activities ─────────────────────────────────────────────────────────

export function useRecentActivities(limit = 50) {
  return useQuery({
    queryKey: ['capital', 'recent-activities', limit],
    queryFn: async () => {
      const data = await apiPost<{ activities: Activity[] }>('/api/capital', {
        action: 'recent-activities',
        limit,
      });
      return data.activities;
    },
  });
}

export function useActivities(ventureId: string | undefined, filters?: { contactId?: string; roundId?: string; commitmentId?: string }) {
  return useQuery({
    queryKey: ['capital', 'activities', ventureId, filters],
    queryFn: async () => {
      const data = await apiPost<{ activities: Activity[] }>('/api/capital', {
        action: 'list-activities',
        venture_id: ventureId,
        contact_id: filters?.contactId,
        round_id: filters?.roundId,
        commitment_id: filters?.commitmentId,
      });
      return data.activities;
    },
    enabled: Boolean(ventureId),
  });
}

// ─── Organizations ──────────────────────────────────────────────────────

export function useOrganizations(ventureId: string) {
  return useQuery({
    queryKey: ['capital', 'organizations', ventureId],
    queryFn: async () => {
      const data = await apiPost<{ organizations: Organization[] }>('/api/capital', {
        action: 'list-organizations',
        venture_id: ventureId,
      });
      return data.organizations;
    },
    enabled: Boolean(ventureId),
  });
}

// ─── Documents ──────────────────────────────────────────────────────────

export function useDocumentsByRound(roundId: string | null | undefined) {
  return useQuery({
    queryKey: ['capital', 'documents-by-round', roundId],
    queryFn: async () => {
      if (!roundId) return [];
      const data = await apiPost<{ documents: CapitalDocument[] }>('/api/capital', {
        action: 'list-documents-by-round',
        round_id: roundId,
      });
      return data.documents;
    },
    enabled: Boolean(roundId),
  });
}

// ─── Dashboard ──────────────────────────────────────────────────────────

export function useGlobalSummary() {
  return useQuery({
    queryKey: ['capital', 'global-summary'],
    queryFn: async () => {
      const data = await apiPost<{ summary: GlobalSummary }>('/api/capital', { action: 'global-summary' });
      return data.summary;
    },
  });
}

// Fetch the venture registry row for a given id — used by CapitalRoundDetailView
// to apply per-round brand tokens (mirrors apps/launchpad/p/[venture]/[round]).
export function useVenture(ventureId: string | null | undefined) {
  return useQuery({
    queryKey: ['capital', 'venture', ventureId],
    queryFn: async () => {
      if (!ventureId) return null;
      const data = await apiPost<{ venture: { id: string; name: string; color: string | null; icon: string | null; whiteLabel: Record<string, unknown> | null } | null }>(
        '/api/capital',
        { action: 'get-venture-for-round', venture_id: ventureId },
      );
      return data.venture;
    },
    enabled: Boolean(ventureId),
    staleTime: 5 * 60_000, // brand tokens change rarely
  });
}

export function useVentureSummary(ventureId: string | null | undefined) {
  return useQuery({
    queryKey: ['capital', 'venture-summary', ventureId],
    queryFn: async () => {
      if (!ventureId) return null;
      const data = await apiPost<{ summary: VentureSummary }>('/api/capital', {
        action: 'venture-summary',
        venture_id: ventureId,
      });
      return data.summary;
    },
    enabled: Boolean(ventureId),
  });
}

export function usePipelineFunnel(ventureId?: string) {
  return useQuery({
    queryKey: ['capital', 'pipeline-funnel', ventureId],
    queryFn: async () => {
      const data = await apiPost<{ funnel: Record<ContactStage, number> }>('/api/capital', {
        action: 'pipeline-funnel',
        venture_id: ventureId,
      });
      return data.funnel;
    },
  });
}

// ─── Content Integration ────────────────────────────────────────────────

export function useRoundContent(roundId: string | null | undefined, role?: RoundContentRole) {
  return useQuery({
    queryKey: ['capital', 'round-content', roundId, role],
    queryFn: async () => {
      if (!roundId) return [] as RoundContentEntry[];
      const data = await apiPost<{ entries: RoundContentEntry[] }>('/api/capital', {
        action: 'list-round-content',
        round_id: roundId,
        role,
      });
      return data.entries;
    },
    enabled: Boolean(roundId),
  });
}

export function useRoundDescription(roundId: string | null | undefined) {
  return useQuery({
    queryKey: ['capital', 'round-description', roundId],
    queryFn: async () => {
      if (!roundId) return null;
      const data = await apiPost<{ description: CapitalContentRow | null }>('/api/capital', {
        action: 'get-round-description',
        round_id: roundId,
      });
      return data.description;
    },
    enabled: Boolean(roundId),
  });
}

export function useRoundUpdates(roundId: string | null | undefined, opts?: { includeDrafts?: boolean; limit?: number }) {
  return useQuery({
    queryKey: ['capital', 'round-updates', roundId, opts],
    queryFn: async () => {
      if (!roundId) return [] as RoundContentEntry[];
      const data = await apiPost<{ updates: RoundContentEntry[] }>('/api/capital', {
        action: 'list-round-updates',
        round_id: roundId,
        include_drafts: opts?.includeDrafts,
        limit: opts?.limit,
      });
      return data.updates;
    },
    enabled: Boolean(roundId),
  });
}

export function useCreateRoundContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      ventureId: string; roundId: string; role: RoundContentRole;
      contentType: string; title: string; bodyMarkdown?: string; excerpt?: string;
      visibility?: ContentVisibility; isPrimary?: boolean; publishImmediately?: boolean;
      scheduledFor?: string; author?: string;
    }) => {
      const data = await apiPost<{ entry: RoundContentEntry }>('/api/capital', {
        action: 'create-round-content',
        input,
      });
      return data.entry;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['capital'] }),
  });
}

export function usePublishRoundUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { contentId: string; visibility?: ContentVisibility }) => {
      const data = await apiPost<{ content: CapitalContentRow }>('/api/capital', {
        action: 'publish-round-update',
        content_id: args.contentId,
        visibility: args.visibility,
      });
      return data.content;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['capital', 'round-updates'] }),
  });
}

// ─── Distributions (Capital × Ledger × Payments) ──────────────────────────

export function useDistributionsByRound(
  ventureId: string | null | undefined,
  roundId: string | null | undefined,
  filters?: { status?: DistributionStatus; limit?: number },
) {
  return useQuery({
    queryKey: ['capital', 'distributions', ventureId ?? 'all', roundId ?? 'any', filters?.status ?? 'any', filters?.limit ?? 50],
    queryFn: async () => {
      if (!ventureId) return [] as Distribution[];
      const data = await apiPost<{ distributions: Distribution[] }>('/api/capital', {
        action: 'list-distributions',
        venture_id: ventureId,
        round_id: roundId ?? undefined,
        status: filters?.status,
        limit: filters?.limit ?? 50,
      });
      return data.distributions;
    },
    enabled: Boolean(ventureId),
  });
}

export function useDistribution(id: string | null | undefined) {
  return useQuery({
    queryKey: ['capital', 'distribution', id],
    queryFn: async () => {
      if (!id) return { distribution: null, recipients: [] as DistributionRecipient[] };
      return apiPost<{ distribution: Distribution | null; recipients: DistributionRecipient[] }>('/api/capital', {
        action: 'get-distribution',
        id,
      });
    },
    enabled: Boolean(id),
  });
}

export function useCreateDistribution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateDistributionInput) => {
      const data = await apiPost<{ distribution: Distribution }>('/api/capital', {
        action: 'create-distribution',
        input,
      });
      return data.distribution;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['capital', 'distributions'] }),
  });
}

export function useProcessDistribution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const data = await apiPost<{ distribution: Distribution }>('/api/capital', {
        action: 'process-distribution',
        id,
      });
      return data.distribution;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['capital', 'distributions'] });
      qc.invalidateQueries({ queryKey: ['capital', 'distribution'] });
    },
  });
}

export function useCancelDistribution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const data = await apiPost<{ distribution: Distribution }>('/api/capital', {
        action: 'cancel-distribution',
        id,
      });
      return data.distribution;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['capital', 'distributions'] }),
  });
}

export function useUpcomingFollowUps(daysAhead = 7) {
  return useQuery({
    queryKey: ['capital', 'followups', daysAhead],
    queryFn: async () => {
      const data = await apiPost<{ followups: Array<{ contactId: string; ventureId: string; nextFollowUp: string }> }>('/api/capital', {
        action: 'upcoming-followups',
        days_ahead: daysAhead,
      });
      return data.followups;
    },
  });
}

// ─── Foundation primitives (Phase 3: Treasury / Royalty / Distribution / Compliance / LegalEntity) ───

export function useTreasuries(ventureId?: string) {
  return useQuery({
    queryKey: ['capital', 'foundation', 'treasuries', ventureId ?? 'all'],
    queryFn: async () => {
      const data = await apiPost<{ treasuries: unknown[] }>('/api/capital', {
        action: 'foundation-list-treasuries',
        venture_id: ventureId,
      });
      return data.treasuries;
    },
  });
}

export function useRoyaltyGraphs(ventureId?: string) {
  return useQuery({
    queryKey: ['capital', 'foundation', 'royalty-graphs', ventureId ?? 'all'],
    queryFn: async () => {
      const data = await apiPost<{ graphs: unknown[]; layers: unknown[] }>('/api/capital', {
        action: 'foundation-list-royalty-graphs',
        venture_id: ventureId,
      });
      return data;
    },
  });
}

export function useDistributionConfigs(ventureId?: string, flowKind?: string) {
  return useQuery({
    queryKey: ['capital', 'foundation', 'dist-configs', ventureId ?? 'all', flowKind ?? 'any'],
    queryFn: async () => {
      const data = await apiPost<{ configs: unknown[] }>('/api/capital', {
        action: 'foundation-list-distribution-configs',
        venture_id: ventureId,
        flow_kind: flowKind,
      });
      return data.configs;
    },
  });
}

export function useComplianceRuleSets(ventureId?: string) {
  return useQuery({
    queryKey: ['capital', 'foundation', 'rule-sets', ventureId ?? 'all'],
    queryFn: async () => {
      const data = await apiPost<{ rule_sets: unknown[]; rules: unknown[] }>('/api/capital', {
        action: 'foundation-list-compliance-rule-sets',
        venture_id: ventureId,
      });
      return data;
    },
  });
}

export function useLegalEntities() {
  return useQuery({
    queryKey: ['capital', 'foundation', 'legal-entities'],
    queryFn: async () => {
      const data = await apiPost<{ entities: unknown[] }>('/api/capital', {
        action: 'foundation-list-legal-entities',
      });
      return data.entities;
    },
  });
}

export function useRoyaltyWalkSimulation(
  ventureId: string | null,
  flowKind: string | null,
  amount: number | null,
  currency: string = 'CAD',
  jurisdiction?: string,
) {
  return useQuery({
    queryKey: ['capital', 'foundation', 'simulate-walk', ventureId, flowKind, amount, currency, jurisdiction ?? 'any'],
    queryFn: async () => {
      const data = await apiPost<{ simulation: unknown }>('/api/capital', {
        action: 'foundation-simulate-royalty-walk',
        venture_id: ventureId,
        flow_kind: flowKind,
        amount,
        currency,
        jurisdiction,
      });
      return data.simulation;
    },
    enabled: Boolean(ventureId && flowKind && amount && amount > 0),
  });
}

// ─── Accreditation Flow (Phase 3) ─────────────────────────────────────────
// VerifyInvestor adapter (Epic 13 S9) outbound + simulated paths.

export interface AccreditationRequest {
  requestId: string;
  contactId: string;
  hostedUrl: string;
  status: 'pending';
  createdAt: string;
}

/**
 * Initiates a real verification request via the VerifyInvestor adapter.
 * Falls back to a mocked hostedUrl if VERIFY_INVESTOR_API_KEY is unset
 * (dev/preview behavior — see verify-investor-adapter.ts).
 * Side-effect: investor profile flips to kyc=in_review pending the webhook.
 */
export function useInitiateAccreditation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { contactId: string; returnUrl?: string }): Promise<AccreditationRequest> => {
      const data = await apiPost<{ request: AccreditationRequest }>('/api/capital', {
        action: 'initiate-accreditation-verification',
        contact_id: input.contactId,
        return_url: input.returnUrl,
      });
      return data.request;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['capital', 'investor-position', variables.contactId] });
      qc.invalidateQueries({ queryKey: ['capital', 'investors'] });
      qc.invalidateQueries({ queryKey: ['prospects'] });
    },
  });
}

/**
 * Admin/dev path: skip the vendor round-trip and stamp the verification
 * outcome directly on the investor profile. Used by:
 *   - the AccreditationFlow modal's "simulate" button (dev mode)
 *   - admin override when an investor was verified out-of-band
 *   - demo flows
 * Webhook stays the canonical source of truth in production; this is a
 * deliberate bypass that reuses the same DB columns.
 */
export function useSimulateAccreditation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      contactId: string;
      outcome?: 'verified_accredited' | 'self_certified' | 'not_accredited';
      basis?: 'income' | 'net_worth' | 'entity' | 'professional' | 'qualified_purchaser';
    }): Promise<{ profile: InvestorProfile; simulated: true }> => {
      const data = await apiPost<{ profile: InvestorProfile; simulated: true }>('/api/capital', {
        action: 'simulate-accreditation-verification',
        contact_id: input.contactId,
        outcome: input.outcome ?? 'verified_accredited',
        basis: input.basis,
      });
      return data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['capital', 'investor-position', variables.contactId] });
      qc.invalidateQueries({ queryKey: ['capital', 'investors'] });
      qc.invalidateQueries({ queryKey: ['prospects'] });
    },
  });
}
