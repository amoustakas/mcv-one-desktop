// AuthRouter — Biometric Core-Triangle ZKP middleware.
//
// Runs the four-phase gate in strict order. Each phase can fail three ways:
//   1. Attestation absent entirely        → <phase>-missing
//   2. Verifier returns false             → <phase>-failed
//   3. Attestation passes but score gate  → <phase>-below-threshold OR -above-risk-threshold
//
// Strict order matters — if liveness fails we don't call any other verifier,
// preserving privacy budget with partner APIs and producing a clear audit
// trail of which phase broke.

import type {
  ActivateVerifier,
  AuthenticatedIdentity,
  AuthPhase,
  CommitVerifier,
  CoreTriangleAttestations,
  LivenessVerifier,
  SettleVerifier,
} from './attestations';
import { CoreTriangleAuthError } from './attestations';

export interface AuthRouterOptions {
  liveness: LivenessVerifier;
  commit: CommitVerifier;
  settle: SettleVerifier;
  activate: ActivateVerifier;
  /** Minimum acceptable Sumsub liveness score, 0-1. Default 0.75. */
  livenessThreshold?: number;
  /** Maximum acceptable BioCatch behavioral risk score, 0-1. Default 0.5. */
  riskThreshold?: number;
}

const DEFAULT_LIVENESS_THRESHOLD = 0.75;
const DEFAULT_RISK_THRESHOLD = 0.5;

export class AuthRouter {
  private readonly verifiers: {
    liveness: LivenessVerifier;
    commit: CommitVerifier;
    settle: SettleVerifier;
    activate: ActivateVerifier;
  };
  private readonly livenessThreshold: number;
  private readonly riskThreshold: number;

  constructor(options: AuthRouterOptions) {
    this.verifiers = {
      liveness: options.liveness,
      commit: options.commit,
      settle: options.settle,
      activate: options.activate,
    };
    this.livenessThreshold = options.livenessThreshold ?? DEFAULT_LIVENESS_THRESHOLD;
    this.riskThreshold = options.riskThreshold ?? DEFAULT_RISK_THRESHOLD;
  }

  async authenticate(
    attestations: Partial<CoreTriangleAttestations>,
  ): Promise<AuthenticatedIdentity> {
    await this.runLivenessPhase(attestations);
    await this.runCommitPhase(attestations);
    await this.runSettlePhase(attestations);
    await this.runActivatePhase(attestations);

    const full = attestations as CoreTriangleAttestations;
    const coreTriangleHash = await hashAttestations(full);

    return {
      userId: full.liveness.userId,
      sessionId: full.liveness.sessionId,
      coreTriangleHash,
      verifiedAt: new Date().toISOString(),
      attestations: full,
    };
  }

  private async runLivenessPhase(att: Partial<CoreTriangleAttestations>): Promise<void> {
    assertPresent(att.liveness, 'liveness', 'liveness-missing', 'Liveness attestation (Sumsub) is required.');
    if (att.liveness!.livenessScore < this.livenessThreshold) {
      throw new CoreTriangleAuthError(
        'liveness-below-threshold',
        'liveness',
        `Liveness score ${att.liveness!.livenessScore} below threshold ${this.livenessThreshold}`,
      );
    }
    const ok = await this.verifiers.liveness.verify(att.liveness!);
    if (!ok) {
      throw new CoreTriangleAuthError('liveness-failed', 'liveness', 'Sumsub liveness verification returned false.');
    }
  }

  private async runCommitPhase(att: Partial<CoreTriangleAttestations>): Promise<void> {
    assertPresent(att.commit, 'commit', 'commit-missing', 'WebAuthn/Fireblocks commit attestation is required.');
    const ok = await this.verifiers.commit.verify(att.commit!);
    if (!ok) {
      throw new CoreTriangleAuthError('commit-failed', 'commit', 'WebAuthn/Fireblocks commit verification failed.');
    }
  }

  private async runSettlePhase(att: Partial<CoreTriangleAttestations>): Promise<void> {
    assertPresent(att.settle, 'settle', 'settle-missing', 'Apple App Attest / Play Integrity settle attestation is required.');
    const ok = await this.verifiers.settle.verify(att.settle!);
    if (!ok) {
      throw new CoreTriangleAuthError('settle-failed', 'settle', 'App Attest / Play Integrity settle verification failed.');
    }
  }

  private async runActivatePhase(att: Partial<CoreTriangleAttestations>): Promise<void> {
    assertPresent(att.activate, 'activate', 'activate-missing', 'BioCatch behavioral activate attestation is required.');
    const ok = await this.verifiers.activate.verify(att.activate!);
    if (!ok) {
      throw new CoreTriangleAuthError('activate-failed', 'activate', 'BioCatch activate verification failed.');
    }
    if (att.activate!.behavioralRiskScore > this.riskThreshold) {
      throw new CoreTriangleAuthError(
        'activate-above-risk-threshold',
        'activate',
        `Behavioral risk ${att.activate!.behavioralRiskScore} above threshold ${this.riskThreshold}`,
      );
    }
  }
}

// ───────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────

function assertPresent<T>(
  value: T | undefined,
  phase: AuthPhase,
  code:
    | 'liveness-missing'
    | 'commit-missing'
    | 'settle-missing'
    | 'activate-missing',
  message: string,
): asserts value is T {
  if (value === undefined || value === null) {
    throw new CoreTriangleAuthError(code, phase, message);
  }
}

/**
 * Deterministic SHA-256 over the canonical attestation identifiers. Used as
 * the audit-trail primary key. Uses Web Crypto (available in Node 20+ and
 * all browsers) so no external dep needed.
 */
export async function hashAttestations(att: CoreTriangleAttestations): Promise<string> {
  const canonical = JSON.stringify({
    l: att.liveness.sessionId,
    c: att.commit.credentialId,
    s: att.settle.deviceHash,
    a: att.activate.sessionId,
  });
  const data = new TextEncoder().encode(canonical);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ───────────────────────────────────────────────────────────────────────────
// Always-allow + always-deny mock verifiers (for sim-mode / tests)
// ───────────────────────────────────────────────────────────────────────────

/**
 * Mock verifier that accepts any attestation. Intended for sim-mode runs
 * and contract tests. Do NOT use in production paths — there is no check
 * preventing it, so enforcement is a code-review gate.
 */
export class AlwaysAllowLivenessVerifier implements LivenessVerifier {
  async verify(): Promise<boolean> { return true; }
}
export class AlwaysAllowCommitVerifier implements CommitVerifier {
  async verify(): Promise<boolean> { return true; }
}
export class AlwaysAllowSettleVerifier implements SettleVerifier {
  async verify(): Promise<boolean> { return true; }
}
export class AlwaysAllowActivateVerifier implements ActivateVerifier {
  async verify(): Promise<boolean> { return true; }
}

/** Bundle helper — mock-allow AuthRouter suitable for sim-mode + tests. */
export function createMockAuthRouter(
  overrides: Partial<AuthRouterOptions> = {},
): AuthRouter {
  return new AuthRouter({
    liveness: overrides.liveness ?? new AlwaysAllowLivenessVerifier(),
    commit: overrides.commit ?? new AlwaysAllowCommitVerifier(),
    settle: overrides.settle ?? new AlwaysAllowSettleVerifier(),
    activate: overrides.activate ?? new AlwaysAllowActivateVerifier(),
    livenessThreshold: overrides.livenessThreshold,
    riskThreshold: overrides.riskThreshold,
  });
}
