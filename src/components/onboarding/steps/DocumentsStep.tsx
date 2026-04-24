// src/components/onboarding/steps/DocumentsStep.tsx
//
// Step 3 of the Onboarding wizard — document review and signing. Shows the
// materialized requirements list for the accepted invite, lets the user
// click into each to start the MCV Sign envelope flow, and polls
// check-completion after each round-trip so the status updates.
//
// UX flow:
//   1. "Review & sign" kicks `/api/onboarding { action: 'start-signing' }` —
//      the first call materializes an envelope via the template-envelope
//      bridge; subsequent calls return the same URL (idempotent).
//   2. The signingUrl opens in a new tab (MCV Sign signer page is full-bleed).
//   3. When the user returns, they click "I have signed — check status",
//      which runs check-completion to reconcile envelope state → requirement
//      status → (potentially) access grants.
//
// Once documentsComplete, the "Continue to launchpad" CTA lights up.

import { useCallback, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import type { OnboardingGate, Requirement } from '../../../hooks/use-onboarding-gate';

interface DocumentsStepProps {
  gate: OnboardingGate;
  onAdvance: () => void;
}

export default function DocumentsStep({ gate, onAdvance }: DocumentsStepProps) {
  const { invite, requirements, requiredCount, satisfiedCount, documentsComplete, refresh } = gate;
  const { getToken } = useAuth();
  const [signing, setSigning] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);

  const startSigning = useCallback(
    async (requirement: Requirement) => {
      setStepError(null);
      setSigning(requirement.id);
      try {
        const bearer = await getToken();
        const res = await fetch('/api/onboarding', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
          },
          body: JSON.stringify({ action: 'start-signing', requirement_id: requirement.id }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? `start-signing failed (${res.status})`);
        }
        const body = await res.json() as { signingUrl: string | null; envelopePublicId: string };
        if (body.signingUrl) {
          window.open(body.signingUrl, '_blank', 'noopener,noreferrer');
        }
        // Refresh requirements so the status flips from 'pending' → 'envelope_issued'
        await refresh();
      } catch (err) {
        setStepError(err instanceof Error ? err.message : String(err));
      } finally {
        setSigning(null);
      }
    },
    [getToken, refresh],
  );

  const checkCompletion = useCallback(async () => {
    if (!invite) return;
    setStepError(null);
    setPolling(true);
    try {
      const bearer = await getToken();
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
        },
        body: JSON.stringify({ action: 'check-completion', invite_id: invite.id }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `check-completion failed (${res.status})`);
      }
      // Refresh the gate — requirement statuses + grants are rehydrated from get-status.
      await refresh();
    } catch (err) {
      setStepError(err instanceof Error ? err.message : String(err));
    } finally {
      setPolling(false);
    }
  }, [getToken, invite, refresh]);

  const progressPct = requiredCount > 0 ? Math.round((satisfiedCount / requiredCount) * 100) : 0;

  if (!invite) {
    return (
      <div className="mcv-onb-card">
        <h2 className="mcv-onb-card-title">No active invite</h2>
        <p className="mcv-onb-card-sub" style={{ marginTop: 8 }}>
          Complete the welcome step first so we can materialize your signing checklist.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mcv-onb-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
          <div>
            <h2 className="mcv-onb-card-title">Your signing checklist</h2>
            <p className="mcv-onb-card-sub" style={{ marginTop: 4 }}>
              {requirements.length === 0
                ? 'Loading your checklist…'
                : `${satisfiedCount} of ${requiredCount} required documents satisfied.`}
            </p>
          </div>
          <button
            type="button"
            className="mcv-onb-cta mcv-onb-cta-ghost"
            disabled={polling}
            onClick={() => { void checkCompletion(); }}
          >
            {polling ? 'Checking…' : 'Check status'}
          </button>
        </div>

        <div
          className="mcv-onb-progress"
          role="progressbar"
          aria-label="Signing progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPct}
          aria-valuetext={`${satisfiedCount} of ${requiredCount} required documents signed`}
        >
          <div className="mcv-onb-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>

        {stepError && (
          <div style={{ marginTop: 12, padding: '8px 12px', fontSize: 12, color: 'var(--error)', borderLeft: '2px solid var(--error)', background: 'rgba(239,68,68,0.05)' }}>
            {stepError}
          </div>
        )}
      </div>

      <ul className="mcv-onb-req-list">
        {[...requirements]
          .sort((a, b) => a.display_order - b.display_order)
          .map((r) => (
            <RequirementRow
              key={r.id}
              requirement={r}
              signing={signing === r.id}
              onStart={() => startSigning(r)}
            />
          ))}
      </ul>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button
          type="button"
          className="mcv-onb-cta"
          disabled={!documentsComplete}
          onClick={onAdvance}
          title={documentsComplete ? 'Continue to launchpad' : 'Sign all required documents to continue'}
        >
          Continue to launchpad
          <span aria-hidden>→</span>
        </button>
      </div>

      <DocumentsStepStyles />
    </>
  );
}

function RequirementRow({
  requirement,
  signing,
  onStart,
}: {
  requirement: Requirement;
  signing: boolean;
  onStart: () => void;
}) {
  const status = requirement.status;
  const isDone = status === 'signed' || status === 'waived';
  const isIssued = status === 'envelope_issued';
  const isDeclined = status === 'declined';

  return (
    <li className={['mcv-onb-req-row', isDone ? 'is-done' : '', isDeclined ? 'is-declined' : ''].filter(Boolean).join(' ')}>
      <span className="mcv-onb-req-marker" aria-hidden>
        {isDone ? '✓' : isIssued ? '◷' : requirement.display_order}
      </span>
      <div className="mcv-onb-req-body">
        <div className="mcv-onb-req-title">
          {requirement.template.title}
          <span className="mcv-onb-req-version">v{requirement.template.version}</span>
          {!requirement.required && <span className="mcv-onb-req-optional">optional</span>}
        </div>
        {requirement.template.summary && (
          <div className="mcv-onb-req-summary">{requirement.template.summary}</div>
        )}
        <div className="mcv-onb-req-status">
          {isDone ? (
            <span style={{ color: '#10b981' }}>Signed{requirement.signed_at ? ` · ${new Date(requirement.signed_at).toLocaleDateString()}` : ''}</span>
          ) : isDeclined ? (
            <span style={{ color: 'var(--error)' }}>Declined{requirement.declined_reason ? ` — ${requirement.declined_reason}` : ''}</span>
          ) : isIssued ? (
            <span style={{ color: 'var(--purple)' }}>Envelope issued — awaiting signature</span>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>Not yet started</span>
          )}
        </div>
      </div>
      <div className="mcv-onb-req-action">
        {isDone ? (
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Complete</span>
        ) : (
          <button
            type="button"
            className="mcv-onb-cta mcv-onb-cta-ghost"
            disabled={signing}
            onClick={onStart}
          >
            {signing ? 'Opening…' : isIssued ? 'Resume signing' : 'Review & sign'}
          </button>
        )}
      </div>
    </li>
  );
}

function DocumentsStepStyles() {
  return (
    <style>{`
      .mcv-onb-progress {
        position: relative;
        height: 4px;
        border-radius: 2px;
        background: rgba(255, 255, 255, 0.06);
        overflow: hidden;
      }
      .mcv-onb-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--cyan, #00f5ff), var(--purple, #8b5cf6));
        transition: width 300ms ease;
      }

      .mcv-onb-req-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .mcv-onb-req-row {
        display: grid;
        grid-template-columns: 36px 1fr auto;
        gap: 16px;
        align-items: center;
        padding: 14px 18px;
        border-radius: 12px;
        background: rgba(11, 18, 28, 0.5);
        border: 1px solid var(--border, rgba(255,255,255,0.08));
        transition: border-color 180ms ease;
      }
      .mcv-onb-req-row.is-done {
        border-color: rgba(16, 185, 129, 0.35);
        background: rgba(16, 185, 129, 0.05);
      }
      .mcv-onb-req-row.is-declined {
        border-color: rgba(239, 68, 68, 0.35);
        background: rgba(239, 68, 68, 0.04);
      }
      .mcv-onb-req-marker {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 13px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid var(--border, rgba(255,255,255,0.12));
        color: var(--text-muted, #6b7a8c);
      }
      .mcv-onb-req-row.is-done .mcv-onb-req-marker {
        color: #10b981;
        border-color: rgba(16, 185, 129, 0.5);
        background: rgba(16, 185, 129, 0.12);
      }
      .mcv-onb-req-body {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
      }
      .mcv-onb-req-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary, #e6edf3);
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .mcv-onb-req-version {
        font-size: 10px;
        font-family: var(--font-mono, ui-monospace, monospace);
        color: var(--text-muted, #6b7a8c);
        padding: 1px 6px;
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.04);
      }
      .mcv-onb-req-optional {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        color: var(--text-muted, #6b7a8c);
      }
      .mcv-onb-req-summary {
        font-size: 12px;
        color: var(--text-secondary, #a6b2c1);
        line-height: 1.5;
      }
      .mcv-onb-req-status {
        font-size: 11px;
      }
    `}</style>
  );
}
