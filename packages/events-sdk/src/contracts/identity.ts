// packages/events-sdk/src/contracts/identity.ts
//
// MCV ID — identity-capture + trust-refresh emissions. Every mutation of
// `identity_captures` or `user_trust_snapshots` fires a typed event through
// this contract so agents, gates, and audit systems can react without
// polling.
//
// Two thematic families:
//
//   capture.*       — attestation lifecycle: enrolled, verified, revoked
//                     (shared shape for passkey / selfie / iris / civic)
//   trust.refreshed — materialized trust snapshot updated; carries the full
//                     SignalContribution[] + band + civic clearance
//
// Emit-only contract (subscribes: []). Downstream listeners (session 3-5
// demo gates, session 4 admin verification queue, future agentic alerts)
// register their own module contracts to consume these topics.
//
// All payloads are strict-validated Zod schemas. Drift → publish() throws
// at handler call-time so compliance pipeline stays honest under refactor.

import { z } from 'zod';
import type { ContractDeclaration } from '../types.js';

// ─── Shared vocab ─────────────────────────────────────────────────────────
// The CaptureKind enum MUST stay in lockstep with the CHECK constraint on
// identity_captures.capture_kind. Adding a new kind requires:
//   1. CHECK constraint migration
//   2. This enum
//   3. The identity-sdk TelemetrySignalBatch type accommodates it
//      (all three signal families are already modeled in @mcv/identity-sdk)
const CaptureKind = z.enum([
  'passkey',
  'face-landmark',
  'iris',
  'interac-verified',
  'epassport-chip',
  'mobile-drv-lic',
  'provincial-oidc',
  'login-gov',
]);

const TrustBand = z.enum(['compromised', 'baseline', 'verified', 'elevated', 'sovereign']);
const CivicClearance = z.enum(['basic', 'verified', 'sovereign']);
const UserId = z.string().min(1);                    // Clerk user_id (text)

// Shape mirrors @mcv/identity-sdk's SignalContribution. Kept as a loose
// object here rather than importing the type to avoid a circular package
// dep (events-sdk → identity-sdk would couple the two).
const SignalContribution = z.object({
  signalKind: z.string(),
  delta: z.number(),
  reason: z.string(),
});

const IdentityFracture = z.object({
  kind: z.string(),
  description: z.string(),
  contributingSignals: z.array(z.string()),
});

// ─── Core capture shape (reused across capture.* topics) ──────────────────
const CaptureCore = z.object({
  captureId: z.string().uuid(),
  userId: UserId,
  captureKind: CaptureKind,
});


export const IdentityContract: ContractDeclaration<'identity'> = {
  module: 'identity',
  version: '1.0',

  emits: [
    // ── Capture lifecycle ───────────────────────────────────────────────
    {
      topic: 'identity.capture.enrolled',
      schemaVersion: '1.0',
      payload: CaptureCore.extend({
        enrolledAt: z.string(),                    // ISO timestamp
        // When an existing row is overwritten via re-enroll, flag so the
        // audit trail distinguishes first-time from replacement.
        replacedPriorCapture: z.boolean(),
        // For passkey: the base64url credential id (non-secret). For selfie:
        // the storage path under the identity-captures bucket. For civic:
        // the issuer identifier. Always non-PII-safe to include in events.
        attestationRef: z.string().nullable(),
      }),
      description:
        'User successfully completed an identity-capture action (passkey enroll, selfie frame, civic proof). Adds a new active row to identity_captures; may overwrite a prior capture of the same kind (replacedPriorCapture=true).',
    },
    {
      topic: 'identity.capture.verified',
      schemaVersion: '1.0',
      payload: CaptureCore.extend({
        verifiedAt: z.string(),
        // Distinct assertions (re-auth challenge, step-up mid-session) vs.
        // the original enrollment. Trust engine treats each assertion as
        // its own StepUpSignal instance in the telemetry batch.
        assertionId: z.string().nullable(),
      }),
      description:
        'Existing identity capture re-asserted (passkey assertion during sign-in, re-selfie on risk event, civic proof re-verified). Does not overwrite the enrolled row; adds an observation on the assertion timeline.',
    },
    {
      topic: 'identity.capture.failed',
      schemaVersion: '1.0',
      payload: CaptureCore.extend({
        failedAt: z.string(),
        // Free-form failure code from the client SDK (e.g. 'NotAllowedError'
        // from WebAuthn, 'NotReadableError' from getUserMedia, 'deepfake-
        // detected' from MediaPipe). Useful for UX diagnostics and abuse
        // detection at scale.
        failureCode: z.string(),
        failureMessage: z.string().nullable(),
      }),
      description:
        'A capture attempt completed but failed validation (user cancelled, device denied access, liveness too low, credential already registered elsewhere, etc.). Not a system error — a real user-facing failure worth recording for diagnostics.',
    },
    {
      topic: 'identity.capture.revoked',
      schemaVersion: '1.0',
      payload: CaptureCore.extend({
        revokedAt: z.string(),
        revokedBy: UserId,                         // user-initiated self-revoke OR super-admin
        reason: z.string().nullable(),
      }),
      description:
        'Identity capture removed from the active set for a user (self-deleted passkey, admin revoked a compromised credential, etc.). Trust snapshot recomputes without this signal on next refresh.',
    },

    // ── Trust snapshot ──────────────────────────────────────────────────
    {
      topic: 'identity.trust.refreshed',
      schemaVersion: '1.0',
      payload: z.object({
        userId: UserId,
        trustScore: z.number().int().min(0).max(100),
        trustBand: TrustBand,
        civicClearance: CivicClearance,
        contributions: z.array(SignalContribution),
        activeFractures: z.array(IdentityFracture),
        // Why was the snapshot refreshed? Lets listeners decide whether to
        // react (e.g. a score drop after revocation is materially different
        // from a score climb after enrollment).
        trigger: z.enum([
          'capture_enrolled',
          'capture_verified',
          'capture_revoked',
          'manual_refresh',
          'cron_recompute',
        ]),
        // Capture id that caused the refresh; null for manual/cron triggers.
        triggerCaptureId: z.string().uuid().nullable(),
        computedAtMs: z.number().int().nonnegative(),
      }),
      description:
        'user_trust_snapshots row was refreshed. Carries the full SignalContribution breakdown + active fractures so a subscriber can explain the score movement without re-querying the DB. Emitted on every capture mutation and on manual/cron recomputes.',
    },
  ],

  subscribes: [],   // emit-only; future listeners (demo gates, agents) register their own contracts
};
