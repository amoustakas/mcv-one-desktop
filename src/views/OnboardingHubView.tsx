// src/views/OnboardingHubView.tsx
//
// Full-bleed public/invite-gated onboarding wizard. Mounted outside the
// authenticated MCV app shell via App.tsx's pathname bypass (/onboard*).
//
// Composition layers:
//   · useOnboardingGate — reads /api/onboarding + /api/identity, derives activeStep
//   · WizardShell       — rail + content chrome + ambient background
//   · WelcomeStep / IdentityStep / DocumentsStep / LaunchpadStep — step bodies
//
// The shell's step click handler is intentionally permissive for the
// user's own forward motion (Welcome → Identity → Documents → Launchpad),
// but never lets them skip a locked step. The hook's `stepStatus` is the
// source of truth; clicking a 'locked' step is a no-op.
//
// Error/loading branches render plain cards inside the shell so the
// layout stays stable (no flash of "signed out" between route and auth).

import { useState, useCallback } from 'react';
import { useOnboardingGate, type WizardStep } from '../hooks/use-onboarding-gate';
import {
  WizardShell,
  WelcomeStep,
  IdentityStep,
  DocumentsStep,
  LaunchpadStep,
} from '../components/onboarding';

export default function OnboardingHubView() {
  const gate = useOnboardingGate();
  // Manual-advance override — the gate always derives activeStep from state,
  // but once a step is complete, the CTA explicitly advances to the next step
  // so we don't "leap" past the natural flow while the user is reviewing.
  // `manualStep` is only used when non-null and greater than the gate's own
  // derived activeStep; otherwise the gate wins.
  const [manualStep, setManualStep] = useState<WizardStep | null>(null);

  const activeStep: WizardStep = (() => {
    if (!manualStep) return gate.activeStep;
    const order: WizardStep[] = ['welcome', 'identity', 'documents', 'launchpad'];
    const manualIdx = order.indexOf(manualStep);
    const derivedIdx = order.indexOf(gate.activeStep);
    // If the gate's state regressed below our manual step (e.g. user hasn't
    // completed identity yet), fall back to the gate.
    return manualIdx > derivedIdx ? manualStep : gate.activeStep;
  })();

  const effectiveGate = { ...gate, activeStep };

  const advance = useCallback(() => {
    const order: WizardStep[] = ['welcome', 'identity', 'documents', 'launchpad'];
    const idx = order.indexOf(activeStep);
    if (idx >= 0 && idx < order.length - 1) {
      setManualStep(order[idx + 1]);
    }
  }, [activeStep]);

  const jumpTo = useCallback((step: WizardStep) => {
    const status = gate.stepStatus[step];
    if (status === 'locked') return;
    setManualStep(step);
  }, [gate.stepStatus]);

  const returnToApp = useCallback(() => {
    if (typeof window !== 'undefined') window.location.href = '/';
  }, []);

  if (gate.loading && !gate.invite) {
    return (
      <WizardShell gate={effectiveGate} onStepClick={jumpTo}>
        <div className="mcv-onb-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="mcv-onb-loader" />
            <div>
              <div className="mcv-onb-card-title">Loading your onboarding workspace…</div>
              <div className="mcv-onb-card-sub" style={{ marginTop: 4 }}>
                Hydrating invite, identity, and documents in parallel.
              </div>
            </div>
          </div>
          <WizardViewStyles />
        </div>
      </WizardShell>
    );
  }

  if (gate.error && !gate.invite) {
    return (
      <WizardShell gate={effectiveGate} onStepClick={jumpTo}>
        <div className="mcv-onb-card" style={{ borderColor: 'rgba(239,68,68,0.4)' }}>
          <div className="mcv-onb-card-title">We could not load your onboarding state</div>
          <div className="mcv-onb-card-sub" style={{ marginTop: 8, fontFamily: 'var(--font-mono, ui-monospace, monospace)' }}>
            {gate.error}
          </div>
          <div style={{ marginTop: 16 }}>
            <button type="button" className="mcv-onb-cta mcv-onb-cta-ghost" onClick={() => { void gate.refresh(); }}>
              Retry
            </button>
          </div>
        </div>
      </WizardShell>
    );
  }

  return (
    <WizardShell gate={effectiveGate} onStepClick={jumpTo}>
      {activeStep === 'welcome' && <WelcomeStep gate={gate} onAdvance={advance} />}
      {activeStep === 'identity' && <IdentityStep gate={gate} onAdvance={advance} />}
      {activeStep === 'documents' && <DocumentsStep gate={gate} onAdvance={advance} />}
      {activeStep === 'launchpad' && <LaunchpadStep gate={gate} onReturnToApp={returnToApp} />}
      <WizardViewStyles />
    </WizardShell>
  );
}

function WizardViewStyles() {
  return (
    <style>{`
      .mcv-onb-loader {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid rgba(255,255,255,0.08);
        border-top-color: var(--cyan, #00f5ff);
        animation: mcv-onb-spin 0.8s linear infinite;
      }
      @keyframes mcv-onb-spin { to { transform: rotate(360deg); } }
    `}</style>
  );
}
