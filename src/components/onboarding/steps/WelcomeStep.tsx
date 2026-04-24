// src/components/onboarding/steps/WelcomeStep.tsx
//
// Step 1 of the Onboarding wizard — invitation verification and acceptance.
//
// Three sub-states this component renders:
//   · No invite code on URL      → "Check your email for a link" copy + help
//   · Invite loaded, not auth'd  → Preview + Clerk sign-in CTA with redirect
//   · Invite loaded, auth'd      → Preview + "Accept & continue" CTA
//   · Invite accepted            → Green confirmation + "Continue to identity"
//
// After acceptance, gate.refresh() will flip activeStep to 'identity'; the
// wizard shell re-renders the next step. We intentionally don't force-nav
// here — the hook derives `activeStep` so the shell stays the authority.

import { SignInButton } from '@clerk/clerk-react';
import type { OnboardingGate } from '../../../hooks/use-onboarding-gate';

interface WelcomeStepProps {
  gate: OnboardingGate;
  onAdvance: () => void;
}

export default function WelcomeStep({ gate, onAdvance }: WelcomeStepProps) {
  const { invite, inviteCode, isSignedIn, inviteAccepted, accepting, acceptError, acceptInvite } = gate;

  // ─── No invite code provided (user hit /onboard directly) ─────────────
  if (!inviteCode && !invite) {
    return (
      <div className="mcv-onb-card">
        <h2 className="mcv-onb-card-title">You need an invitation link</h2>
        <p className="mcv-onb-card-sub" style={{ marginTop: 10, lineHeight: 1.5 }}>
          MCV access is invite-only. If you have received an onboarding email, open
          the link from that message — it carries the invite code that gates this
          flow. If you believe you should have received one, reach out to
          <a href="mailto:onboarding@mcv.one" style={{ color: 'var(--cyan)', marginLeft: 4 }}>onboarding@mcv.one</a>.
        </p>
      </div>
    );
  }

  // ─── Invite loaded but could not be found / expired / revoked ─────────
  if (inviteCode && !invite) {
    return (
      <div className="mcv-onb-card" style={{ borderColor: 'rgba(239,68,68,0.4)' }}>
        <h2 className="mcv-onb-card-title">We could not find that invite</h2>
        <p className="mcv-onb-card-sub" style={{ marginTop: 10, lineHeight: 1.5 }}>
          The invite code <code style={codeStyle}>{inviteCode}</code> does not match
          an active invitation. It may have been revoked, expired, or already
          claimed by someone else. If this surprises you, please email
          <a href="mailto:onboarding@mcv.one" style={{ color: 'var(--cyan)', marginLeft: 4 }}>onboarding@mcv.one</a>.
        </p>
      </div>
    );
  }

  if (!invite) return null;

  const accessLevels = invite.access_levels.length > 0 ? invite.access_levels : null;
  const expiry = formatExpiry(invite.expires_at);

  return (
    <>
      <div className="mcv-onb-card">
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 340px', minWidth: 0 }}>
            <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
              You have been invited to
            </div>
            <h2 className="mcv-onb-card-title" style={{ fontSize: 22, marginBottom: 8 }}>
              {invite.bundle.name || 'MCV Ecosystem Access'}
            </h2>
            {invite.bundle.description && (
              <p className="mcv-onb-card-sub" style={{ marginTop: 0, marginBottom: 12, lineHeight: 1.5 }}>
                {invite.bundle.description}
              </p>
            )}
            {invite.instructions_md && (
              <blockquote style={quoteStyle}>
                {invite.instructions_md}
              </blockquote>
            )}
          </div>

          <dl className="mcv-onb-invite-meta">
            <MetaRow label="Invited" value={invite.invited_name || invite.invited_email} />
            <MetaRow label="Tier" value={invite.access_tier} highlight />
            {invite.target_venture_id && (
              <MetaRow label="Venture" value={invite.target_venture_id} />
            )}
            <MetaRow label="Expires" value={expiry} />
          </dl>
        </div>
        <WelcomeStepStyles />

        {accessLevels && (
          <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, color: 'var(--text-muted)', marginBottom: 10 }}>
              What you will unlock
            </div>
            <ul style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: 0, padding: 0, listStyle: 'none' }}>
              {accessLevels.map((level) => (
                <li key={level} style={pillStyle}>{level}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mcv-onb-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 320px' }}>
          <div className="mcv-onb-card-title" style={{ fontSize: 15 }}>
            {inviteAccepted ? 'Invite accepted' : isSignedIn ? 'Ready to begin' : 'One more step before we begin'}
          </div>
          <p className="mcv-onb-card-sub" style={{ marginTop: 4 }}>
            {inviteAccepted
              ? 'We have materialized your signing checklist and identity scaffolding. Continue to the next step to enroll your MCV ID.'
              : isSignedIn
                ? 'Accepting this invite will materialize your signing checklist and link your account to the invitation. This cannot be undone from the user surface.'
                : 'To accept this invitation we need to attach it to your MCV account. Sign in with the email address the invitation was sent to.'}
          </p>
          {acceptError && (
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--error)' }}>
              {acceptError}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {inviteAccepted ? (
            <button type="button" className="mcv-onb-cta" onClick={onAdvance}>
              Continue to MCV ID
              <span aria-hidden>→</span>
            </button>
          ) : isSignedIn ? (
            <button
              type="button"
              className="mcv-onb-cta"
              disabled={accepting}
              onClick={() => { void acceptInvite(); }}
            >
              {accepting ? 'Accepting…' : 'Accept & begin'}
              {!accepting && <span aria-hidden>→</span>}
            </button>
          ) : (
            <SignInButton
              mode="modal"
              forceRedirectUrl={currentUrlForRedirect()}
              signUpForceRedirectUrl={currentUrlForRedirect()}
            >
              <button type="button" className="mcv-onb-cta">
                Sign in with {invite.invited_email}
                <span aria-hidden>→</span>
              </button>
            </SignInButton>
          )}
        </div>
      </div>
    </>
  );
}

function MetaRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  // <dt>/<dd> must be direct children of <dl>, so we emit a fragment with
  // inline grid alignment applied to each cell rather than wrapping them in
  // a <div>. The outer <dl className="mcv-onb-invite-meta"> provides the
  // grid container via CSS (see MetaListStyles below).
  return (
    <>
      <dt className="mcv-onb-meta-dt">{label}</dt>
      <dd className={highlight ? 'mcv-onb-meta-dd is-highlight' : 'mcv-onb-meta-dd'}>{value}</dd>
    </>
  );
}

function currentUrlForRedirect(): string {
  if (typeof window === 'undefined') return '/onboard';
  return window.location.pathname + window.location.search;
}

function formatExpiry(iso: string): string {
  if (!iso) return 'No expiry';
  try {
    const then = new Date(iso).getTime();
    const diff = then - Date.now();
    if (diff < 0) return 'Expired';
    const days = Math.round(diff / 86_400_000);
    if (days === 0) return 'Expires today';
    if (days === 1) return 'Expires tomorrow';
    if (days < 14) return `Expires in ${days} days`;
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

const codeStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono, ui-monospace, monospace)',
  background: 'rgba(255,255,255,0.04)',
  padding: '1px 6px',
  borderRadius: 4,
  fontSize: 12,
};

const quoteStyle: React.CSSProperties = {
  margin: '12px 0 0',
  padding: '10px 14px',
  borderLeft: '2px solid var(--cyan, #00f5ff)',
  background: 'rgba(0, 245, 255, 0.04)',
  fontSize: 13,
  lineHeight: 1.6,
  color: 'var(--text-secondary, #a6b2c1)',
  whiteSpace: 'pre-wrap',
};

const pillStyle: React.CSSProperties = {
  padding: '4px 10px',
  borderRadius: 999,
  border: '1px solid rgba(0, 245, 255, 0.35)',
  background: 'rgba(0, 245, 255, 0.06)',
  color: 'var(--cyan, #00f5ff)',
  fontSize: 11,
  fontFamily: 'var(--font-mono, ui-monospace, monospace)',
  letterSpacing: 0.5,
};

function WelcomeStepStyles() {
  return (
    <style>{`
      .mcv-onb-invite-meta {
        display: grid;
        grid-template-columns: 80px 1fr;
        gap: 8px 12px;
        margin: 0;
        padding: 0;
        min-width: 200px;
      }
      .mcv-onb-meta-dt {
        font-size: 11px;
        color: var(--text-muted, #6b7a8c);
        text-transform: uppercase;
        letter-spacing: 1.5px;
        align-self: center;
      }
      .mcv-onb-meta-dd {
        margin: 0;
        font-size: 13px;
        color: var(--text-primary, #e6edf3);
        font-weight: 500;
        align-self: center;
      }
      .mcv-onb-meta-dd.is-highlight {
        color: var(--cyan, #00f5ff);
        font-weight: 600;
        letter-spacing: 0.5px;
        text-transform: uppercase;
      }
    `}</style>
  );
}
