// src/components/onboarding/StepperRail.tsx
//
// Vertical step rail for the OnboardingHubView wizard. Renders the 4
// steps (Welcome → Identity → Documents → Launchpad) with per-step status
// badges (locked / ready / in_progress / complete) and allows the user to
// jump back to any step that is `ready` or `complete`.
//
// The rail is deliberately passive — it reflects state the hook derives
// and emits onStepClick for navigation. Gate logic doesn't live here.

import type { WizardStep, StepStatus } from '../../hooks/use-onboarding-gate';
import { WIZARD_STEPS } from './stepper-constants';

interface StepperRailProps {
  activeStep: WizardStep;
  stepStatus: Record<WizardStep, StepStatus>;
  onStepClick?: (step: WizardStep) => void;
}

export default function StepperRail({ activeStep, stepStatus, onStepClick }: StepperRailProps) {
  return (
    <aside className="mcv-onb-rail" aria-label="Onboarding progress">
      <div className="mcv-onb-rail-header">
        <div className="mcv-onb-rail-brand">
          <span className="mcv-onb-rail-logo">MCV</span>
          <span className="mcv-onb-rail-logo-sub">ONE</span>
        </div>
        <div className="mcv-onb-rail-tagline">Onboarding</div>
      </div>

      <ol className="mcv-onb-rail-steps">
        {WIZARD_STEPS.map((step, idx) => {
          const status = stepStatus[step.id];
          const isActive = step.id === activeStep;
          const isClickable = status === 'complete' || status === 'in_progress' || isActive;
          const connectorAfter = idx < WIZARD_STEPS.length - 1;

          return (
            <li
              key={step.id}
              className={[
                'mcv-onb-rail-step',
                isActive ? 'is-active' : '',
                `status-${status}`,
              ].filter(Boolean).join(' ')}
            >
              <button
                type="button"
                className="mcv-onb-rail-step-btn"
                disabled={!isClickable || !onStepClick}
                onClick={() => onStepClick?.(step.id)}
                aria-current={isActive ? 'step' : undefined}
              >
                <span className="mcv-onb-rail-step-marker" aria-hidden>
                  {status === 'complete' ? (
                    <CheckGlyph />
                  ) : status === 'locked' ? (
                    <LockGlyph />
                  ) : (
                    <span className="mcv-onb-rail-step-index">{step.index}</span>
                  )}
                </span>
                <span className="mcv-onb-rail-step-text">
                  <span className="mcv-onb-rail-step-label">{step.label}</span>
                  <span className="mcv-onb-rail-step-desc">{step.description}</span>
                </span>
              </button>
              {connectorAfter && (
                <span
                  className={[
                    'mcv-onb-rail-connector',
                    status === 'complete' ? 'is-done' : '',
                  ].filter(Boolean).join(' ')}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>

      <div className="mcv-onb-rail-footer">
        <div className="mcv-onb-rail-footer-kicker">Need help?</div>
        <a href="mailto:onboarding@mcv.one" className="mcv-onb-rail-footer-link">
          onboarding@mcv.one
        </a>
      </div>
    </aside>
  );
}

function CheckGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 8 6.5 11.5 13 4.5" />
    </svg>
  );
}

function LockGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="7" width="10" height="7" rx="1.5" />
      <path d="M5 7V5a3 3 0 0 1 6 0v2" />
    </svg>
  );
}
