// React Query hooks for EdgeIQ Capital. Backs /api/capital handler.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '../lib/api/client';
import type {
  Round, Commitment, InvestorProfile, Activity, Organization, CapitalDocument,
  GlobalSummary, VentureSummary, ContactStage, RoundStatus, CommitmentStatus,
  CreateRoundInput, CreateCommitmentInput, UpsertInvestorProfileInput,
  RoundContentEntry, RoundContentRole, CapitalContentRow, ContentVisibility,
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
