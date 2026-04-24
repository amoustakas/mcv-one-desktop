// Public barrel for the onboarding wizard surface. OnboardingHubView (the
// composed view) lives in src/views/ and imports each piece directly, but
// callers who need to embed a single step (e.g. a re-acceptance flow inside
// the main app) can import it from here without reaching into internals.

export { default as WizardShell } from './WizardShell';
export { default as StepperRail } from './StepperRail';
export { WIZARD_STEPS } from './stepper-constants';
export type { StepDefinition } from './stepper-constants';
export { default as WelcomeStep } from './steps/WelcomeStep';
export { default as IdentityStep } from './steps/IdentityStep';
export { default as DocumentsStep } from './steps/DocumentsStep';
export { default as LaunchpadStep } from './steps/LaunchpadStep';
