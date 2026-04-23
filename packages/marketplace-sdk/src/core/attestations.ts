// Biometric Core-Triangle attestation types + verifier contracts.
//
// The four-phase flow is the ZKP gate that every MCVClient instantiation
// must clear before it can submit orders, mint RWAs, or touch KMS-backed
// Solana signing. Each phase produces an attestation artifact that this
// SDK does NOT generate itself — the attestations come from platform
// partners (Sumsub, Fireblocks/WebAuthn, Apple App Attest, BioCatch) via
// a client-side verification flow. This file just types them.
//
// Why four discrete phases rather than one big object: each phase runs on
// a different attestation cadence. Liveness runs once per session. Commit
// runs per high-value action. Settle runs per device binding. Activate is
// a continuous signal (updated per interaction). Keeping them separate at
// the type level means each phase can expire + re-attest independently.

// ───────────────────────────────────────────────────────────────────────────
// Phase 1 — Liveness (Sumsub)
// ───────────────────────────────────────────────────────────────────────────

export interface SumsubLivenessAttestation {
  provider: 'sumsub';
  /** Stable end-user identifier (comes from Clerk → mcv.id chain) */
  userId: string;
  /**
   * Sumsub session id. Unique per user-session; re-attestation returns a
   * fresh id.
   */
  sessionId: string;
  /**
   * 0-1 confidence that the check-in is a live human. AuthRouter rejects
   * below `livenessThreshold` (default 0.75) regardless of `verify()` boolean.
   */
  livenessScore: number;
  /** ISO timestamp when Sumsub signed the attestation */
  verifiedAt: string;
}

// ───────────────────────────────────────────────────────────────────────────
// Phase 2 — Commit (WebAuthn / Fireblocks Passkey)
// ───────────────────────────────────────────────────────────────────────────

export interface WebAuthnCommitAttestation {
  /** Either 'webauthn' (native) or 'fireblocks' (delegated key) is accepted. */
  provider: 'webauthn' | 'fireblocks';
  userId: string;
  /** FIDO2 credential id (base64url) */
  credentialId: string;
  /** Hash of the challenge the user signed */
  challengeHash: string;
  /** base64url — the signature over the challenge */
  signature: string;
  verifiedAt: string;
}

// ───────────────────────────────────────────────────────────────────────────
// Phase 3 — Settle (Apple App Attest / Play Integrity equivalent)
// ───────────────────────────────────────────────────────────────────────────

export interface AppAttestSettleAttestation {
  provider: 'app-attest' | 'play-integrity';
  userId: string;
  /** Opaque token from Apple App Attest or Google Play Integrity */
  attestationToken: string;
  /** Stable per-device hash extracted during attestation */
  deviceHash: string;
  verifiedAt: string;
}

// ───────────────────────────────────────────────────────────────────────────
// Phase 4 — Activate (BioCatch behavioral biometrics)
// ───────────────────────────────────────────────────────────────────────────

export interface BioCatchActivateAttestation {
  provider: 'biocatch';
  userId: string;
  sessionId: string;
  /**
   * 0-1 behavioral-risk score. 0 = human, 1 = bot/compromised. AuthRouter
   * rejects above `riskThreshold` (default 0.5) regardless of verify() truth.
   */
  behavioralRiskScore: number;
  verifiedAt: string;
}

// ───────────────────────────────────────────────────────────────────────────
// Bundle
// ───────────────────────────────────────────────────────────────────────────

/**
 * All four attestations present and valid. This is the only shape AuthRouter
 * accepts as a success input. Partial bundles throw `CoreTriangleAuthError`.
 */
export interface CoreTriangleAttestations {
  liveness: SumsubLivenessAttestation;
  commit: WebAuthnCommitAttestation;
  settle: AppAttestSettleAttestation;
  activate: BioCatchActivateAttestation;
}

// ───────────────────────────────────────────────────────────────────────────
// Error types
// ───────────────────────────────────────────────────────────────────────────

export type AuthPhase = 'liveness' | 'commit' | 'settle' | 'activate';

export type AuthErrorCode =
  | 'liveness-missing'
  | 'liveness-failed'
  | 'liveness-below-threshold'
  | 'commit-missing'
  | 'commit-failed'
  | 'settle-missing'
  | 'settle-failed'
  | 'activate-missing'
  | 'activate-failed'
  | 'activate-above-risk-threshold';

export class CoreTriangleAuthError extends Error {
  readonly code: AuthErrorCode;
  readonly phase: AuthPhase;

  constructor(code: AuthErrorCode, phase: AuthPhase, message: string) {
    super(message);
    this.name = 'CoreTriangleAuthError';
    this.code = code;
    this.phase = phase;
  }
}

// ───────────────────────────────────────────────────────────────────────────
// Verifier contracts
// ───────────────────────────────────────────────────────────────────────────

export interface LivenessVerifier {
  verify(attestation: SumsubLivenessAttestation): Promise<boolean>;
}

export interface CommitVerifier {
  verify(attestation: WebAuthnCommitAttestation): Promise<boolean>;
}

export interface SettleVerifier {
  verify(attestation: AppAttestSettleAttestation): Promise<boolean>;
}

export interface ActivateVerifier {
  verify(attestation: BioCatchActivateAttestation): Promise<boolean>;
}

// ───────────────────────────────────────────────────────────────────────────
// Resolved identity
// ───────────────────────────────────────────────────────────────────────────

export interface AuthenticatedIdentity {
  userId: string;
  sessionId: string;
  /** SHA-256 of the canonical attestation bundle, used for audit trails */
  coreTriangleHash: string;
  /** ISO timestamp when AuthRouter produced this identity */
  verifiedAt: string;
  /** Full attestation bundle retained for Fabric audit events */
  attestations: CoreTriangleAttestations;
}
