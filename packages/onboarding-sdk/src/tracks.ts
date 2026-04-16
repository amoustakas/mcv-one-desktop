// The 7 prospect tracks. Each track is a composition of step names
// from steps.ts. Adding a new track = adding one entry here.
//
// Rule: steps execute in array order. current_step_index in the DB
// points into the steps array materialized on journey creation.

import type { TrackDefinition, TrackName, StepName } from './types';

export const TRACKS: Record<TrackName, TrackDefinition> = {
  investor_retail: {
    name: 'investor_retail',
    label: 'Retail Investor',
    description: 'Non-accredited retail investor — RE or token exposure under the relevant exemption.',
    role_hint: 'investor',
    steps: [
      'intro',
      'venture_selection',
      'identity_capture',
      'kyc_basic',
      'agent_assignment',
      'credentials_issued',
      'venture_demo',
      'welcome_message',
      'feedback_capture',
    ],
  },
  investor_accredited: {
    name: 'investor_accredited',
    label: 'Accredited Investor',
    description: 'Reg D 506(c) — full accreditation VC + full-access portal.',
    role_hint: 'investor',
    steps: [
      'intro',
      'venture_selection',
      'identity_capture',
      'kyc_basic',
      'kyc_full',
      'accreditation_verification',
      'agent_assignment',
      'credentials_issued',
      'venture_demo',
      'meeting_scheduling',
      'welcome_message',
    ],
  },
  partner: {
    name: 'partner',
    label: 'Partner',
    description: 'Service provider or integration partner — ends with partner dashboard + API keys.',
    role_hint: 'partner',
    steps: [
      'intro',
      'identity_capture',
      'agent_assignment',
      'credentials_issued',
      'welcome_message',
    ],
  },
  creator: {
    name: 'creator',
    label: 'Creator',
    description: 'BetEdge / WarForge content creator — ends with creator portal + first-payout setup.',
    role_hint: 'creator',
    steps: [
      'intro',
      'identity_capture',
      'venture_selection',
      'agent_assignment',
      'credentials_issued',
      'welcome_message',
    ],
  },
  team_member: {
    name: 'team_member',
    label: 'Team Member',
    description: 'Internal hire — ends with kit access + workspace + agent assignment.',
    role_hint: 'team',
    steps: [
      'intro',
      'identity_capture',
      'agent_assignment',
      'credentials_issued',
      'welcome_message',
    ],
  },
  ally: {
    name: 'ally',
    label: 'Ally',
    description: 'Board member, advisor, or high-trust contact. Immediate full access + direct line to Tony.',
    role_hint: 'ally',
    steps: [
      'intro',
      'identity_capture',
      'credentials_issued',
      'welcome_message',
    ],
  },
  waitlist: {
    name: 'waitlist',
    label: 'Waitlist',
    description: 'Not ready to commit. Warm-lead record + venture-scoped update cadence.',
    role_hint: null,
    steps: [
      'intro',
      'identity_capture',
      'venture_selection',
      'feedback_capture',
      'welcome_message',
    ],
  },
};

export const ALL_TRACK_NAMES: TrackName[] = Object.keys(TRACKS) as TrackName[];

export function getTrack(name: TrackName): TrackDefinition {
  const t = TRACKS[name];
  if (!t) throw new Error(`Unknown track: ${name}`);
  return t;
}

export function getTrackSteps(name: TrackName): StepName[] {
  return [...getTrack(name).steps];
}
