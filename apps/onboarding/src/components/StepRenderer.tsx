'use client';

// Step renderer — dispatches to the active-step component based on
// journey.current_step_index. Before a journey exists, renders StepIntro.

import type { ProspectJourney, ProspectJourneyStep, StepName, StepStatus, TrackName } from '@mcv/onboarding-sdk';
import { TRACKS } from '@mcv/onboarding-sdk';

import StepIntro                     from './steps/StepIntro';
import StepVentureSelection          from './steps/StepVentureSelection';
import StepIdentityCapture           from './steps/StepIdentityCapture';
import StepKycBasic                  from './steps/StepKycBasic';
import StepAgentAssignment           from './steps/StepAgentAssignment';
import StepWelcomeMessage            from './steps/StepWelcomeMessage';
import StepKycFull                   from './steps/StepKycFull';
import StepAccreditationVerification from './steps/StepAccreditationVerification';
import StepVentureDemo               from './steps/StepVentureDemo';
import StepMeetingScheduling         from './steps/StepMeetingScheduling';
import StepCredentialsIssued         from './steps/StepCredentialsIssued';
import StepFeedbackCapture           from './steps/StepFeedbackCapture';

export interface StepProps {
  journey: ProspectJourney | null;
  steps: ProspectJourneyStep[];
  track: TrackName;
  ventureId: string | null | undefined;
  prefillEmail?: string | null;
  loading: boolean;
  onStart: (payload: { email: string; full_name?: string; country?: string }) => Promise<void>;
  onAdvance: (opts?: { status?: StepStatus; outputs?: Record<string, unknown> }) => Promise<void>;
}

const STEP_COMPONENTS: Record<StepName, React.ComponentType<StepProps>> = {
  intro:                      StepIntro,
  venture_selection:          StepVentureSelection,
  identity_capture:           StepIdentityCapture,
  kyc_basic:                  StepKycBasic,
  kyc_full:                   StepKycFull,
  accreditation_verification: StepAccreditationVerification,
  agent_assignment:           StepAgentAssignment,
  venture_demo:               StepVentureDemo,
  meeting_scheduling:         StepMeetingScheduling,
  credentials_issued:         StepCredentialsIssued,
  welcome_message:            StepWelcomeMessage,
  feedback_capture:           StepFeedbackCapture,
};

export function StepRenderer(props: StepProps) {
  const { journey } = props;

  // Pre-journey: always show intro (it's step 0 of every track).
  if (!journey) {
    const firstStep = TRACKS[props.track].steps[0];
    const Component = STEP_COMPONENTS[firstStep];
    return <Component {...props} />;
  }

  const currentStepName = journey.steps[journey.current_step_index] as StepName | undefined;
  if (!currentStepName) {
    return (
      <div className="wiz-card">
        <p>Journey complete. Welcome to the team.</p>
      </div>
    );
  }

  const Component = STEP_COMPONENTS[currentStepName];
  if (!Component) return <div className="wiz-card">Unknown step: {currentStepName}</div>;

  return <Component {...props} />;
}
