// The 12 reusable journey steps. Tracks are compositions of these.
// Any new step must be added here AND in the component registry under
// apps/onboarding/src/components/steps/.

import type { StepDefinition, StepName } from './types';

export const STEPS: Record<StepName, StepDefinition> = {
  intro: {
    name: 'intro',
    label: 'Welcome',
    description: 'Atlas greets the prospect and frames the journey.',
    agent_role: 'chief_of_staff',
    required: true,
    can_skip: false,
  },
  venture_selection: {
    name: 'venture_selection',
    label: 'Pick Your Focus',
    description: 'Which ventures do you want to engage with?',
    agent_role: 'chief_of_staff',
    required: false,
    can_skip: true,
  },
  identity_capture: {
    name: 'identity_capture',
    label: 'Your Details',
    description: 'Name, email, country — the minimum needed to proceed.',
    agent_role: 'none',
    required: true,
    can_skip: false,
  },
  kyc_basic: {
    name: 'kyc_basic',
    label: 'Compliance Check',
    description: 'Date of birth + residence. Compliance gate runs OFAC sanction screening.',
    agent_role: 'compliance',
    required: true,
    can_skip: false,
  },
  kyc_full: {
    name: 'kyc_full',
    label: 'Document Verification',
    description: 'Full KYC via Plaid Identity or Jumio — government ID + proof of address.',
    agent_role: 'compliance',
    required: false,
    can_skip: true,
  },
  accreditation_verification: {
    name: 'accreditation_verification',
    label: 'Accreditation',
    description: 'Verify accredited-investor status via VerifyInvestor adapter → AccreditedInvestorCredential VC.',
    agent_role: 'compliance',
    required: false,
    can_skip: true,
  },
  agent_assignment: {
    name: 'agent_assignment',
    label: 'Meet Your Specialist',
    description: 'Hand-off from Atlas to the domain specialist who will run the rest of the journey.',
    agent_role: 'chief_of_staff',
    required: true,
    can_skip: false,
  },
  venture_demo: {
    name: 'venture_demo',
    label: 'Interactive Demo',
    description: 'Venture-scoped walkthrough delivered by the assigned specialist.',
    agent_role: 'ir_specialist',
    required: false,
    can_skip: true,
  },
  meeting_scheduling: {
    name: 'meeting_scheduling',
    label: 'Book Time',
    description: 'Schedule with Tony or a chief. Cal.com or internal calendar.',
    agent_role: 'ir_specialist',
    required: false,
    can_skip: true,
  },
  credentials_issued: {
    name: 'credentials_issued',
    label: 'Access Issued',
    description: 'Portal URL + wallet provisioning + VC issuance.',
    agent_role: 'compliance',
    required: false,
    can_skip: true,
  },
  welcome_message: {
    name: 'welcome_message',
    label: 'Welcome Home',
    description: 'First warm message from the assigned specialist. Sets tone for the relationship.',
    agent_role: 'ir_specialist',
    required: true,
    can_skip: false,
  },
  feedback_capture: {
    name: 'feedback_capture',
    label: 'Feedback',
    description: 'NPS + "what brought you here" — fuels onboarding optimization.',
    agent_role: 'none',
    required: false,
    can_skip: true,
  },
};

export const ALL_STEP_NAMES: StepName[] = Object.keys(STEPS) as StepName[];

export function getStep(name: StepName): StepDefinition {
  const s = STEPS[name];
  if (!s) throw new Error(`Unknown step: ${name}`);
  return s;
}
