// MCV Continuous Ambient Trust — type surface.
//
// The Trust Engine consumes three stream categories:
//   - ambient  — passive telemetry (reCAPTCHA, Play Integrity, FLP, activity, mic-based diarization)
//   - stepUp   — active user attestations (face/iris, passkey, duress finger)
//   - civic    — federated government-identity proofs (Interac, ePassport, mDL, Login.gov)
//
// Each signal type declares its shape + the trust delta it can produce.
// Trust Score is 0-100 with named bands:
//   0-20    compromised — vault locked; only identity-reset flows allowed
//   20-50   baseline    — read-only public data
//   50-70   verified    — retail transactions
//   70-90   elevated    — accredited-tier transactions
//   90-100  sovereign   — layer-0 / trust-level overrides

// ───────────────────────────────────────────────────────────────────────────
// Civic clearance tiers
// ───────────────────────────────────────────────────────────────────────────

export type CivicClearance =
  | 'basic'      // Clerk session only; no government identity proof
  | 'verified'   // At least one federated civic proof attested (Interac / mDL / etc.)
  | 'sovereign'; // ePassport chip signature + biometric iris pass

// ───────────────────────────────────────────────────────────────────────────
// Ambient signals (passive)
// ───────────────────────────────────────────────────────────────────────────

export interface KinematicSignal {
  kind: 'kinematic';
  /** Gait match score 0-1 against registered baseline */
  gaitMatchScore: number;
  /** Typing cadence match 0-1 */
  typingCadenceMatch: number;
  observedAtMs: number;
}

export interface FusedLocationSignal {
  kind: 'fused-location';
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  /** Registered home / MCV hub flag */
  atRegisteredLocation: boolean;
  observedAtMs: number;
}

export interface ActivityRecognitionSignal {
  kind: 'activity-recognition';
  activity: 'still' | 'walking' | 'running' | 'biking' | 'driving' | 'unknown';
  confidence: number;
  observedAtMs: number;
}

export interface RecaptchaEnterpriseSignal {
  kind: 'recaptcha-enterprise';
  /** 0-1 bot/risk score from reCAPTCHA Enterprise; higher = more human */
  humanScore: number;
  observedAtMs: number;
}

export interface PlayIntegritySignal {
  kind: 'play-integrity';
  deviceVerdict: 'MEETS_STRONG_INTEGRITY' | 'MEETS_DEVICE_INTEGRITY' | 'MEETS_BASIC_INTEGRITY' | 'NO_INTEGRITY';
  appRecognized: boolean;
  observedAtMs: number;
}

export interface AcousticDiarizationSignal {
  kind: 'acoustic-diarization';
  /** Match score 0-1 against registered voice vector */
  speakerMatchScore: number;
  observedAtMs: number;
}

export type AmbientSignal =
  | KinematicSignal
  | FusedLocationSignal
  | ActivityRecognitionSignal
  | RecaptchaEnterpriseSignal
  | PlayIntegritySignal
  | AcousticDiarizationSignal;

// ───────────────────────────────────────────────────────────────────────────
// Step-up signals (active)
// ───────────────────────────────────────────────────────────────────────────

export interface FaceLandmarkSignal {
  kind: 'face-landmark';
  /** 0-1 3D liveness score from MediaPipe Face Landmarker */
  livenessScore: number;
  /** Micro-expression variance — low variance suggests deepfake */
  microExpressionVariance: number;
  observedAtMs: number;
}

export interface IrisSignal {
  kind: 'iris';
  /** 0-1 match against registered iris pattern */
  matchScore: number;
  observedAtMs: number;
}

export interface PasskeySignal {
  kind: 'passkey';
  /** WebAuthn authenticator id (base64url) */
  authenticatorId: string;
  observedAtMs: number;
}

export interface DuressSignal {
  kind: 'duress';
  /** Set to true when the duress finger was used; triggers silent alert */
  triggered: boolean;
  observedAtMs: number;
}

export type StepUpSignal = FaceLandmarkSignal | IrisSignal | PasskeySignal | DuressSignal;

// ───────────────────────────────────────────────────────────────────────────
// Civic signals (federated government identity)
// ───────────────────────────────────────────────────────────────────────────

export interface InteracVerifiedSignal {
  kind: 'interac-verified';
  /** Canadian bank provider returning attestation */
  bank: 'rbc' | 'td' | 'scotia' | 'bmo' | 'cibc' | 'national';
  verifiedAtMs: number;
}

export interface EPassportChipSignal {
  kind: 'epassport-chip';
  /** ICAO Doc 9303 compliant signature verification */
  signatureValid: boolean;
  /** Issuing country ISO 3166-1 alpha-2 */
  issuingCountry: string;
  verifiedAtMs: number;
}

export interface ProvincialOidcSignal {
  kind: 'provincial-oidc';
  province: 'on' | 'bc' | 'ab' | 'qc';
  verifiedAtMs: number;
}

export interface MobileDrvLicSignal {
  kind: 'mobile-drv-lic';
  /** ISO/IEC 18013-5 mDL reader signature verification */
  signatureValid: boolean;
  state: string;
  verifiedAtMs: number;
}

export interface LoginGovSignal {
  kind: 'login-gov';
  /** US Login.gov IAL/AAL level */
  ialLevel: 1 | 2;
  aalLevel: 1 | 2 | 3;
  verifiedAtMs: number;
}

export type CivicSignal =
  | InteracVerifiedSignal
  | EPassportChipSignal
  | ProvincialOidcSignal
  | MobileDrvLicSignal
  | LoginGovSignal;

// ───────────────────────────────────────────────────────────────────────────
// Batch + result
// ───────────────────────────────────────────────────────────────────────────

export interface TelemetrySignalBatch {
  ambient: AmbientSignal[];
  stepUp: StepUpSignal[];
  civic: CivicSignal[];
}

/** Fracture — detected contradiction across signals that should be impossible. */
export interface IdentityFracture {
  kind: 'typing-while-driving' | 'device-handoff' | 'speaker-mismatch' | 'duress';
  description: string;
  contributingSignals: string[];
}

export interface SignalContribution {
  signalKind: string;
  delta: number;
  reason: string;
}

export interface TrustScoreResult {
  /** 0-100 computed Omni-Trust Score */
  score: number;
  civicClearance: CivicClearance;
  /** Active identity fractures — each drops score toward 0 */
  fractures: IdentityFracture[];
  /** Per-signal contribution breakdown for audit trail */
  contributions: SignalContribution[];
  /** Score at start (pre-telemetry) */
  baseScore: number;
  computedAtMs: number;
}

/** JWT custom claims injected into Clerk session metadata. */
export interface McvIdClaims {
  mcv_trust_score: number;
  mcv_civic_clearance: CivicClearance;
  mcv_trust_computed_at: string;
  mcv_active_fractures: string[];
}
