// Pure-function orchestrator for prospect journeys.
// Returns intents (StartIntent / AdvanceIntent / CompleteIntent)
// that the API handler translates into Supabase writes.
//
// Keeping the orchestrator DB-agnostic lets us unit-test the state
// machine without a DB, and reuse the same rules in both the public
// wizard (apps/onboarding) and admin flows (Desktop ProspectsView).

import type {
  ProspectJourney,
  StepName,
  TrackName,
  JourneyStatus,
  StepStatus,
} from './types';
import { getTrackSteps } from './tracks';
import { getStep } from './steps';
import {
  resolveAgentHandle,
  resolveJourneyOwner,
  type VentureId,
  type AgentHandle,
} from './assignments';

// Intent shapes the API handler consumes.

export interface StartJourneyIntent {
  kind: 'start_journey';
  track: TrackName;
  prospect_id: string;
  venture_id: VentureId;
  steps: StepName[];
  initial_agent_handle: AgentHandle;   // Atlas — opens every journey
  first_step: StepName;
  first_step_agent_handle: AgentHandle | null;
}

export interface AdvanceStepIntent {
  kind: 'advance_step';
  journey_id: string;
  from_step: StepName;
  from_step_final_status: StepStatus;   // 'completed' or 'skipped'
  from_step_outputs: Record<string, unknown>;
  next_step: StepName | null;            // null → journey completes
  next_step_agent_handle: AgentHandle | null;
  new_current_step_index: number;
  new_journey_status: JourneyStatus;
  new_journey_agent_handle: AgentHandle | null;  // non-null after agent_assignment
}

export interface CompleteJourneyIntent {
  kind: 'complete_journey';
  journey_id: string;
}

// ---------------------------------------------------------------------------
// startJourney — given track + prospect, compute what to insert.
// ---------------------------------------------------------------------------
export function startJourney(params: {
  track: TrackName;
  prospect_id: string;
  venture_id: VentureId;
}): StartJourneyIntent {
  const steps = getTrackSteps(params.track);
  if (steps.length === 0) throw new Error(`Track ${params.track} has no steps`);

  const firstStep = steps[0];
  const firstStepDef = getStep(firstStep);
  const firstStepAgent = resolveAgentHandle(params.track, firstStepDef.agent_role, params.venture_id);
  const atlas = resolveAgentHandle(params.track, 'chief_of_staff', params.venture_id);

  return {
    kind: 'start_journey',
    track: params.track,
    prospect_id: params.prospect_id,
    venture_id: params.venture_id,
    steps,
    initial_agent_handle: (atlas ?? '@atlas') as AgentHandle,
    first_step: firstStep,
    first_step_agent_handle: firstStepAgent,
  };
}

// ---------------------------------------------------------------------------
// advanceStep — given current journey state, compute what to write next.
// ---------------------------------------------------------------------------
export function advanceStep(params: {
  journey: ProspectJourney;
  venture_id: VentureId;
  from_step_final_status: StepStatus;   // 'completed' | 'skipped' | 'failed'
  from_step_outputs?: Record<string, unknown>;
}): AdvanceStepIntent | CompleteJourneyIntent {
  const { journey } = params;
  const currentIdx = journey.current_step_index;
  const fromStep = journey.steps[currentIdx];
  if (!fromStep) {
    throw new Error(`Journey ${journey.id} has no step at index ${currentIdx}`);
  }

  const nextIdx = currentIdx + 1;
  const nextStep = journey.steps[nextIdx] ?? null;

  // Terminal — no next step.
  if (!nextStep) {
    return {
      kind: 'advance_step',
      journey_id: journey.id,
      from_step: fromStep,
      from_step_final_status: params.from_step_final_status,
      from_step_outputs: params.from_step_outputs ?? {},
      next_step: null,
      next_step_agent_handle: null,
      new_current_step_index: nextIdx,
      new_journey_status: 'completed',
      new_journey_agent_handle: null,
    };
  }

  const nextStepDef = getStep(nextStep);
  const nextStepAgent = resolveAgentHandle(journey.track, nextStepDef.agent_role, params.venture_id);

  // On agent_assignment advance, flip journey.agent_id to the specialist.
  // After this step the specialist "owns" the journey for all subsequent UI.
  let newJourneyAgentHandle: AgentHandle | null = null;
  if (fromStep === 'agent_assignment') {
    newJourneyAgentHandle = resolveJourneyOwner(journey.track, params.venture_id);
  }

  return {
    kind: 'advance_step',
    journey_id: journey.id,
    from_step: fromStep,
    from_step_final_status: params.from_step_final_status,
    from_step_outputs: params.from_step_outputs ?? {},
    next_step: nextStep,
    next_step_agent_handle: nextStepAgent,
    new_current_step_index: nextIdx,
    new_journey_status: 'active',
    new_journey_agent_handle: newJourneyAgentHandle,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
export function currentStepName(journey: ProspectJourney): StepName | null {
  return journey.steps[journey.current_step_index] ?? null;
}

export function progressPercent(journey: ProspectJourney): number {
  if (journey.steps.length === 0) return 0;
  if (journey.status === 'completed') return 100;
  return Math.round((journey.current_step_index / journey.steps.length) * 100);
}
