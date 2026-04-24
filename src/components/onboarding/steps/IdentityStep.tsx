// src/components/onboarding/steps/IdentityStep.tsx
//
// Step 2 of the Onboarding wizard — MCV ID enrollment. Side-by-side
// PasskeyEnroll + SelfieCapture from Session 2, with the IdentityStatusCard
// pinned to a sidebar column so the user watches their trust score climb
// as each capture lands.
//
// After either component's onEnrolled/onCaptured callback fires, we bump
// the gate's refreshKey — this re-hydrates the status card (same key
// flows into its refreshKey prop) AND re-derives the wizard's step gate
// so the Continue button enables the moment identitySatisfied flips true.

import {
  PasskeyEnroll,
  SelfieCapture,
  IdentityStatusCard,
} from '../../identity';
import type { OnboardingGate } from '../../../hooks/use-onboarding-gate';

interface IdentityStepProps {
  gate: OnboardingGate;
  onAdvance: () => void;
}

export default function IdentityStep({ gate, onAdvance }: IdentityStepProps) {
  const { identity, identitySatisfied, refresh, refreshKey } = gate;

  const afterCapture = () => { void refresh(); };

  return (
    <div className="mcv-onb-identity-grid">
      <div className="mcv-onb-identity-main">
        <PasskeyEnroll onEnrolled={afterCapture} alreadyEnrolled={identity.hasPasskey} />
        <SelfieCapture onCaptured={afterCapture} alreadyCaptured={identity.hasSelfie} />
      </div>

      <div className="mcv-onb-identity-aside">
        <IdentityStatusCard refreshKey={refreshKey} />

        <div className="mcv-onb-card" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--text-muted)', marginBottom: 8 }}>
            Why both?
          </div>
          <p className="mcv-onb-card-sub" style={{ lineHeight: 1.6 }}>
            A passkey attests that <em>you have a device</em>. A selfie attests that
            <em> you are a real person</em>. The trust engine combines both with ambient
            signals to compute a score that gates access. You may complete one or both — the
            higher your band, the more surface unlocks.
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            type="button"
            className="mcv-onb-cta"
            disabled={!identitySatisfied}
            onClick={onAdvance}
            title={identitySatisfied ? 'Continue to documents' : 'Enroll at least one identity signal to continue'}
          >
            Continue to documents
            <span aria-hidden>→</span>
          </button>
        </div>
      </div>

      <IdentityStepStyles />
    </div>
  );
}

function IdentityStepStyles() {
  return (
    <style>{`
      .mcv-onb-identity-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 360px;
        gap: 20px;
        align-items: start;
      }
      .mcv-onb-identity-main {
        display: flex;
        flex-direction: column;
        gap: 20px;
        min-width: 0;
      }
      .mcv-onb-identity-aside {
        display: flex;
        flex-direction: column;
        gap: 16px;
        position: sticky;
        top: 0;
      }
      @media (max-width: 1100px) {
        .mcv-onb-identity-grid {
          grid-template-columns: 1fr;
        }
        .mcv-onb-identity-aside { position: static; }
      }
    `}</style>
  );
}
