// React Query hooks for the Prospect admin surfaces.
// Pattern matches src/hooks/use-agents.ts.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '../lib/api/client';
import type {
  ProspectProfile,
  ProspectJourney,
  ProspectJourneyStep,
  ProspectCapture,
  JourneyStatus,
  TrackName,
} from '@mcv/onboarding-sdk';

// Agent embed shape returned by Supabase foreign-table select.
export interface EmbeddedAgent {
  id: string;
  handle: string;
  full_name: string;
  title: string;
  accent_color: string | null;
}

// Admin view shape: journey + embedded profile + embedded assigned agent.
export interface JourneyWithProfile extends ProspectJourney {
  prospect_profile: {
    email: string;
    full_name: string | null;
    country: string | null;
    role_hint: string | null;
    source_venture_id: string | null;
    intake_source: 'wizard' | 'operator' | 'referral' | 'import' | null;
  };
  agent: EmbeddedAgent | null;
}

export interface StepWithAgent extends ProspectJourneyStep {
  agent: EmbeddedAgent | null;
}

// Ecosystem rows produced by journey completion (set by the
// runJourneyCompletionEffects executor in the API handler). Null when
// effects haven't been applied yet (active/abandoned journeys).
export interface EcosystemContact {
  id: string;
  name: string;
  email: string | null;
  type: string;
  status: string;
  lifecycle_stage: string | null;
  lead_score: number | null;
  source: string | null;
  venture_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface EcosystemInvestorProfile {
  contact_id: string;
  venture_id: string;
  contact_type: string;
  stage: string;
  accreditation_status: string;
  kyc_status: string;
  portal_enabled: boolean;
  lead_score: number;
  total_committed_usd: string;  // numeric → string in supabase-js
  total_funded_usd: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface EcosystemLinks {
  contact: EcosystemContact | null;
  investor_profile: EcosystemInvestorProfile | null;
}

export interface JourneyDetail {
  journey: JourneyWithProfile;
  steps: StepWithAgent[];
  ecosystem: EcosystemLinks | null;
}

export function useProspects(filters?: { status?: JourneyStatus; track?: TrackName }) {
  return useQuery({
    queryKey: ['prospects', 'list', filters?.status ?? 'all', filters?.track ?? 'all'],
    queryFn: async () => {
      const data = await apiPost<{ journeys: JourneyWithProfile[] }>('/api/prospects', {
        action: 'list_journeys',
        status: filters?.status,
        track: filters?.track,
      });
      return data.journeys;
    },
  });
}

export function useProspectJourney(journeyId: string | null | undefined) {
  return useQuery({
    queryKey: ['prospects', 'journey', journeyId ?? 'none'],
    queryFn: async () => {
      if (!journeyId) return null;
      const data = await apiPost<JourneyDetail>('/api/prospects', {
        action: 'get_journey',
        id: journeyId,
      });
      return data;
    },
    enabled: Boolean(journeyId),
  });
}

export function useProspect(idOrEmail: string | null | undefined) {
  return useQuery({
    queryKey: ['prospects', 'prospect', idOrEmail ?? 'none'],
    queryFn: async () => {
      if (!idOrEmail) return null;
      const payload: Record<string, string> = { action: 'get_prospect' };
      if (idOrEmail.includes('@')) payload.email = idOrEmail;
      else payload.id = idOrEmail;
      const data = await apiPost<{ prospect: ProspectProfile | null }>('/api/prospects', payload);
      return data.prospect;
    },
    enabled: Boolean(idOrEmail),
  });
}

export function useCaptures() {
  return useQuery({
    queryKey: ['prospects', 'captures'],
    queryFn: async () => {
      const data = await apiPost<{ captures: ProspectCapture[] }>('/api/prospects', {
        action: 'list_captures',
      });
      return data.captures;
    },
  });
}

// Operator-created prospect (T3.2 handler: `create_operator_prospect`).
// Interface is camelCase for React ergonomics; the fetch body is snake_case to
// match the server handler's exact param contract (see T3.2).
export interface OperatorProspectInput {
  email: string;
  fullName?: string;
  country?: string;
  roleHint?: string;
  sourceVentureId?: string;
  track: TrackName;
  operatorNotes?: string;
  relationshipHistory?: string;
  priorDeals?: unknown[];
  aumEstimate?: number;
  checkSizeRange?: string;
  investorThesis?: string;
  socialProfiles?: Record<string, string>;
  priority?: 'hot' | 'warm' | 'medium' | 'cold';
  archetype?: string;
  assignedPersonaId?: string;
  assignedPersonaHandle?: string;
}

export interface OperatorProspectResult {
  profile: ProspectProfile;
  journey: ProspectJourney;
}

export function useCreateOperatorProspect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: OperatorProspectInput): Promise<OperatorProspectResult> => {
      return apiPost<OperatorProspectResult>('/api/prospects', {
        action: 'create_operator_prospect',
        email: input.email,
        full_name: input.fullName,
        country: input.country,
        role_hint: input.roleHint,
        source_venture_id: input.sourceVentureId,
        track: input.track,
        operator_notes: input.operatorNotes,
        relationship_history: input.relationshipHistory,
        prior_deals: input.priorDeals,
        aum_estimate: input.aumEstimate,
        check_size_range: input.checkSizeRange,
        investor_thesis: input.investorThesis,
        social_profiles: input.socialProfiles,
        priority: input.priority,
        archetype: input.archetype,
        assigned_persona_id: input.assignedPersonaId,
        assigned_persona_handle: input.assignedPersonaHandle,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prospects'] });
      qc.invalidateQueries({ queryKey: ['captures'] });
    },
  });
}
