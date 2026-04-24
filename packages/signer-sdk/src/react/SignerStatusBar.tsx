// packages/signer-sdk/src/react/SignerStatusBar.tsx
//
// Envelope state machine visualization — shows where this envelope is
// in its lifecycle so the signer has confidence the action completed.
// Purely presentational; caller wires it to the useSigner hook's
// envelope.status field.

import type { EnvelopeStatus } from '../core/types';

interface SignerStatusBarProps {
  status: EnvelopeStatus;
  /** When true, shows a subtle pending indicator on the current stage. */
  isInFlight?: boolean;
}

const STAGES: Array<{ key: EnvelopeStatus | 'active'; label: string }> = [
  { key: 'issued', label: 'Issued' },
  { key: 'viewed', label: 'Viewed' },
  { key: 'partial', label: 'Signing' },
  { key: 'signed', label: 'Signed' },
];

const TERMINAL_VOIDED: EnvelopeStatus[] = ['voided', 'expired'];

export function SignerStatusBar({ status, isInFlight = false }: SignerStatusBarProps) {
  if (TERMINAL_VOIDED.includes(status)) {
    return (
      <div className="mcv-signer-statusbar is-terminal" data-status={status}>
        {status === 'voided' ? 'Envelope voided' : 'Envelope expired'}
      </div>
    );
  }

  const reachedIdx = STAGES.findIndex((s) => s.key === status);
  return (
    <div className="mcv-signer-statusbar" data-status={status} aria-label="Signing progress">
      {STAGES.map((stage, idx) => {
        const reached = reachedIdx >= idx;
        const active = reachedIdx === idx;
        return (
          <span
            key={stage.key}
            className={[
              'mcv-signer-statusbar-stage',
              reached ? 'is-reached' : '',
              active ? 'is-active' : '',
              active && isInFlight ? 'is-inflight' : '',
            ].filter(Boolean).join(' ')}
          >
            <span className="mcv-signer-statusbar-dot" aria-hidden />
            <span className="mcv-signer-statusbar-label">{stage.label}</span>
          </span>
        );
      })}
    </div>
  );
}
