// src/components/identity/PasskeyEnroll.tsx
//
// WebAuthn passkey enrollment card — Session 2 of the Onboarding + Demo
// Gate epic. Drives the browser ceremony:
//
//   1. POST /api/identity { action: 'start-passkey' }
//      Server returns a challenge + RP id + user descriptor.
//   2. navigator.credentials.create({ publicKey })
//      Browser ceremony shows the platform authenticator picker (Windows
//      Hello / Touch ID / security key).
//   3. POST /api/identity { action: 'verify-passkey', credentialId, ... }
//      Server persists an identity_captures row + refreshes the trust
//      snapshot + emits identity.capture.enrolled.
//
// Consumed from the upcoming OnboardingHubView (Session 3). Emits the
// onEnrolled callback so the hub can advance the wizard step, and carries
// a zero-dep styling story — only uses the existing MCV design system
// classes from src/styles/components.css.
//
// EXPAND: when @simplewebauthn/browser lands as a dependency, swap the
// manual base64url transcoding for startRegistration() — the UX stays
// identical but the library handles edge cases (conditional UI, resident
// key hints, attestation parse) far better than the hand-rolled version.

import { useState } from 'react';

interface StartPasskeyResponse {
  challenge: string;           // base64url
  rpId: string;
  rpName: string;
  userId: string;
  userName: string;
  userDisplayName: string;
  authenticatorSelection: AuthenticatorSelectionCriteria;
  pubKeyCredParams: PublicKeyCredentialParameters[];
  timeoutMs: number;
  attestation: 'none' | 'indirect' | 'direct' | 'enterprise';
}

interface VerifyResponse {
  captureId: string;
  replacedPriorCapture: boolean;
  trust: {
    trustScore: number;
    trustBand: string;
    civicClearance: string;
  };
}

type Phase =
  | { kind: 'idle' }
  | { kind: 'enrolling' }
  | { kind: 'enrolled'; captureId: string; replaced: boolean }
  | { kind: 'error'; message: string };

interface PasskeyEnrollProps {
  /** Optional — fires with the new capture id after a successful enrollment. */
  onEnrolled?: (captureId: string) => void;
  /** Force the card into a pre-populated "already enrolled" visual state. */
  alreadyEnrolled?: boolean;
}

export default function PasskeyEnroll({ onEnrolled, alreadyEnrolled }: PasskeyEnrollProps) {
  const [phase, setPhase] = useState<Phase>(
    alreadyEnrolled ? { kind: 'enrolled', captureId: '', replaced: false } : { kind: 'idle' },
  );

  async function enroll() {
    if (typeof window === 'undefined' || !window.PublicKeyCredential) {
      setPhase({ kind: 'error', message: 'This browser does not support WebAuthn.' });
      return;
    }

    setPhase({ kind: 'enrolling' });

    try {
      const startRes = await fetch('/api/identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start-passkey' }),
      });
      if (!startRes.ok) {
        const err = await safeErrorBody(startRes);
        throw new Error(err ?? `start-passkey failed (${startRes.status})`);
      }
      const start = (await startRes.json()) as StartPasskeyResponse;

      const publicKey: PublicKeyCredentialCreationOptions = {
        challenge: b64UrlToBuffer(start.challenge),
        rp: { id: start.rpId, name: start.rpName },
        user: {
          id: new TextEncoder().encode(start.userId),
          name: start.userName,
          displayName: start.userDisplayName,
        },
        pubKeyCredParams: start.pubKeyCredParams,
        authenticatorSelection: start.authenticatorSelection,
        timeout: start.timeoutMs,
        attestation: start.attestation,
      };

      const credential = (await navigator.credentials.create({ publicKey })) as PublicKeyCredential | null;
      if (!credential) {
        throw new Error('No credential returned from authenticator.');
      }

      const response = credential.response as AuthenticatorAttestationResponse;
      const clientDataJSON = bufferToB64Url(response.clientDataJSON);
      const attestationObject = bufferToB64Url(response.attestationObject);
      const publicKeyBuf = response.getPublicKey?.();

      const verifyRes = await fetch('/api/identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify-passkey',
          credentialId: credential.id,          // already base64url
          publicKey: publicKeyBuf ? bufferToB64Url(publicKeyBuf) : null,
          clientDataJSON,
          attestationObject,
        }),
      });
      if (!verifyRes.ok) {
        const err = await safeErrorBody(verifyRes);
        throw new Error(err ?? `verify-passkey failed (${verifyRes.status})`);
      }
      const verified = (await verifyRes.json()) as VerifyResponse;

      setPhase({
        kind: 'enrolled',
        captureId: verified.captureId,
        replaced: verified.replacedPriorCapture,
      });
      onEnrolled?.(verified.captureId);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setPhase({ kind: 'error', message });
    }
  }

  return (
    <div className="mcv-glass-card mcv-glass-neural" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
              Passkey
            </h3>
            <StatusBadge phase={phase} />
          </div>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Bind a hardware-backed credential from this device. Used as the
            strong step-up factor in your MCV trust score.
          </p>
        </div>
        <button
          type="button"
          className={
            phase.kind === 'enrolling'
              ? 'mcv-btn mcv-btn-md mcv-btn-secondary mcv-btn-loading'
              : phase.kind === 'enrolled'
                ? 'mcv-btn mcv-btn-md mcv-btn-secondary'
                : 'mcv-btn mcv-btn-md mcv-btn-primary'
          }
          onClick={enroll}
          disabled={phase.kind === 'enrolling'}
        >
          {phase.kind === 'enrolling' && <span className="mcv-btn-spinner" aria-hidden />}
          {labelForPhase(phase)}
        </button>
      </div>
      {phase.kind === 'error' && (
        <div
          style={{
            marginTop: 12,
            padding: '8px 10px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.24)',
            color: 'var(--error)',
            fontSize: 11,
          }}
        >
          {phase.message}
        </div>
      )}
      {phase.kind === 'enrolled' && phase.replaced && (
        <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)' }}>
          Replaced the previously enrolled credential on this account.
        </div>
      )}
    </div>
  );
}

function StatusBadge({ phase }: { phase: Phase }) {
  const { label, color } = (() => {
    switch (phase.kind) {
      case 'idle':      return { label: 'Not enrolled', color: 'var(--text-muted)' };
      case 'enrolling': return { label: 'Enrolling', color: 'var(--cyan)' };
      case 'enrolled':  return { label: 'Enrolled', color: 'var(--success, #10b981)' };
      case 'error':     return { label: 'Error', color: 'var(--error)' };
    }
  })();
  return (
    <span
      className="mcv-badge mcv-badge-sm mcv-badge-outline"
      style={{ color, borderColor: color }}
    >
      {label}
    </span>
  );
}

function labelForPhase(phase: Phase): string {
  switch (phase.kind) {
    case 'idle':      return 'Enroll passkey';
    case 'enrolling': return 'Enrolling...';
    case 'enrolled':  return 'Re-enroll';
    case 'error':     return 'Try again';
  }
}

// ── base64url transcoding helpers (scoped local; 4-line utilities not worth a shared dep) ──
function b64UrlToBuffer(s: string): ArrayBuffer {
  const pad = '='.repeat((4 - (s.length % 4)) % 4);
  const b64 = (s + pad).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

function bufferToB64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function safeErrorBody(res: Response): Promise<string | null> {
  try {
    const body = await res.json();
    return typeof body?.error === 'string' ? body.error : null;
  } catch {
    return null;
  }
}
