// src/components/onboarding/stepper-constants.ts
//
// Wizard-step metadata lifted out of StepperRail.tsx so that file only
// exports a component (required by react-refresh/only-export-components).

import type { WizardStep } from '../../hooks/use-onboarding-gate';

export interface StepDefinition {
  id: WizardStep;
  label: string;
  description: string;
  index: number;
}

export const WIZARD_STEPS: StepDefinition[] = [
  { id: 'welcome', label: 'Welcome', description: 'Verify your invitation', index: 1 },
  { id: 'identity', label: 'MCV ID', description: 'Prove who you are', index: 2 },
  { id: 'documents', label: 'Documents', description: 'Review and sign', index: 3 },
  { id: 'launchpad', label: 'Launchpad', description: 'Open your venture access', index: 4 },
];
