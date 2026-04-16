// React Query hooks for the Prospect admin surfaces.
// Pattern matches src/hooks/use-agents.ts.

import { useQuery } from '@tanstack/react-query';
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
  };
  agent: EmbeddedAgent | null;
}

export interface StepWithAgent extends ProspectJourneyStep {
  agent: EmbeddedAgent | null;
}

export interface JourneyDetail {
  journey: JourneyWithProfile;
  steps: StepWithAgent[];
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
