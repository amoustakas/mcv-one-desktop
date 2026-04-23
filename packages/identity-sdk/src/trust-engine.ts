// Trust Engine — computes Omni-Trust Score from telemetry signal batch.
//
// Pure deterministic function; no I/O, no clock reads. Callers pass
// the current timestamp + base score. This lets the engine run inside
// Cloud Run handlers, service workers, or Confidential Space TEEs.
//
// Computation model:
//   score = clamp(baseScore + sum(signalDeltas) - fracturePenalties, 0, 100)
// Every contributing signal returns a delta and a reason; the result
// exposes the full contribution list so downstream audit (Iceberg tap)
// can explain why the score moved.

import type {
  AmbientSignal,
  CivicClearance,
  CivicSignal,
  IdentityFracture,
  SignalContribution,
  StepUpSignal,
  TelemetrySignalBatch,
  TrustScoreResult,
} from './types';

// ───────────────────────────────────────────────────────────────────────────
// Tuning constants (Phase 1 — will live-tune later via ACS Controller)
// ───────────────────────────────────────────────────────────────────────────

export const TRUST_BANDS = Object.freeze({
  COMPROMISED_MAX: 20,
  BASELINE_MAX: 50,
  VERIFIED_MAX: 70,
  ELEVATED_MAX: 90,
  SOVEREIGN_MIN: 90,
});

export interface ComputeOptions {
  /** Starting score before signals apply. Default 50. */
  baseScore?: number;
  /** Current wall-clock for deterministic fracture detection. */
  nowMs: number;
  /** Signal-staleness budget in ms; older signals ignored. Default 5 minutes. */
  staleSignalMs?: number;
}

const DEFAULT_BASE_SCORE = 50;
const DEFAULT_STALE_SIGNAL_MS = 5 * 60 * 1000;

// ───────────────────────────────────────────────────────────────────────────
// Main engine
// ───────────────────────────────────────────────────────────────────────────

export function computeTrustScore(
  batch: TelemetrySignalBatch,
  options: ComputeOptions,
): TrustScoreResult {
  const baseScore = options.baseScore ?? DEFAULT_BASE_SCORE;
  const staleMs = options.staleSignalMs ?? DEFAULT_STALE_SIGNAL_MS;
  const contributions: SignalContribution[] = [];

  let score = baseScore;

  // Ambient signals
  for (const signal of batch.ambient) {
    if (isStale(signal.observedAtMs, options.nowMs, staleMs)) continue;
    const c = applyAmbient(signal);
    if (c) {
      contributions.push(c);
      score += c.delta;
    }
  }

  // Step-up signals
  for (const signal of batch.stepUp) {
    if (isStale(signal.observedAtMs, options.nowMs, staleMs)) continue;
    const c = applyStepUp(signal);
    if (c) {
      contributions.push(c);
      score += c.delta;
    }
  }

  // Civic signals (no staleness check — these are persistent proofs)
  for (const signal of batch.civic) {
    const c = applyCivic(signal);
    if (c) {
      contributions.push(c);
      score += c.delta;
    }
  }

  // Fracture detection — identity contradictions penalize score sharply
  const fractures = detectFractures(batch, options.nowMs, staleMs);
  for (const fracture of fractures) {
    const delta = -40;
    contributions.push({
      signalKind: `fracture:${fracture.kind}`,
      delta,
      reason: fracture.description,
    });
    score += delta;
  }

  // Clamp + civic clearance
  score = Math.max(0, Math.min(100, Math.round(score)));
  const civicClearance = resolveCivicClearance(batch.civic, fractures);

  return {
    score,
    civicClearance,
    fractures,
    contributions,
    baseScore,
    computedAtMs: options.nowMs,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// Per-category signal handlers
// ───────────────────────────────────────────────────────────────────────────

function applyAmbient(signal: AmbientSignal): SignalContribution | null {
  switch (signal.kind) {
    case 'kinematic':
      if (signal.gaitMatchScore < 0.4 || signal.typingCadenceMatch < 0.4) {
        return {
          signalKind: 'kinematic',
          delta: -30,
          reason: `Gait/typing match below threshold (gait=${signal.gaitMatchScore}, typing=${signal.typingCadenceMatch})`,
        };
      }
      if (signal.gaitMatchScore > 0.8 && signal.typingCadenceMatch > 0.8) {
        return { signalKind: 'kinematic', delta: 10, reason: 'Gait + typing cadence match high' };
      }
      return null;

    case 'fused-location':
      if (signal.atRegisteredLocation && signal.accuracyMeters <= 50) {
        return { signalKind: 'fused-location', delta: 8, reason: 'At registered location' };
      }
      return null;

    case 'activity-recognition':
      return null; // evaluated only in fracture detection

    case 'recaptcha-enterprise':
      if (signal.humanScore < 0.3) {
        return { signalKind: 'recaptcha-enterprise', delta: -25, reason: `Low human score ${signal.humanScore}` };
      }
      if (signal.humanScore > 0.8) {
        return { signalKind: 'recaptcha-enterprise', delta: 5, reason: 'High human score' };
      }
      return null;

    case 'play-integrity':
      switch (signal.deviceVerdict) {
        case 'NO_INTEGRITY':         return { signalKind: 'play-integrity', delta: -50, reason: 'Device failed integrity check' };
        case 'MEETS_BASIC_INTEGRITY': return { signalKind: 'play-integrity', delta: -10, reason: 'Only basic integrity — possibly rooted' };
        case 'MEETS_DEVICE_INTEGRITY':return { signalKind: 'play-integrity', delta: 3,  reason: 'Device integrity attested' };
        case 'MEETS_STRONG_INTEGRITY':return { signalKind: 'play-integrity', delta: 8,  reason: 'Strong integrity attested' };
      }
      return null;

    case 'acoustic-diarization':
      if (signal.speakerMatchScore < 0.3) {
        return { signalKind: 'acoustic-diarization', delta: -15, reason: `Speaker mismatch ${signal.speakerMatchScore}` };
      }
      if (signal.speakerMatchScore > 0.85) {
        return { signalKind: 'acoustic-diarization', delta: 5, reason: 'Speaker matches baseline' };
      }
      return null;
  }
}

function applyStepUp(signal: StepUpSignal): SignalContribution | null {
  switch (signal.kind) {
    case 'face-landmark':
      if (signal.livenessScore < 0.5 || signal.microExpressionVariance < 0.05) {
        return { signalKind: 'face-landmark', delta: -20, reason: 'Low liveness or suspected deepfake' };
      }
      if (signal.livenessScore > 0.85) {
        return { signalKind: 'face-landmark', delta: 15, reason: '3D liveness verified' };
      }
      return null;

    case 'iris':
      if (signal.matchScore > 0.9) {
        return { signalKind: 'iris', delta: 20, reason: 'Iris matches registered baseline' };
      }
      if (signal.matchScore < 0.5) {
        return { signalKind: 'iris', delta: -30, reason: 'Iris mismatch' };
      }
      return null;

    case 'passkey':
      return { signalKind: 'passkey', delta: 12, reason: 'WebAuthn passkey signed' };

    case 'duress':
      if (signal.triggered) {
        return { signalKind: 'duress', delta: -70, reason: 'Duress biometric triggered — silent alert' };
      }
      return null;
  }
}

function applyCivic(signal: CivicSignal): SignalContribution | null {
  switch (signal.kind) {
    case 'interac-verified':    return { signalKind: 'interac-verified',    delta: 20, reason: `Interac Verified via ${signal.bank}` };
    case 'epassport-chip':
      return signal.signatureValid
        ? { signalKind: 'epassport-chip', delta: 25, reason: `ePassport signature valid (${signal.issuingCountry})` }
        : { signalKind: 'epassport-chip', delta: -20, reason: 'ePassport signature INVALID' };
    case 'provincial-oidc':     return { signalKind: 'provincial-oidc',     delta: 15, reason: `Provincial OIDC attested (${signal.province})` };
    case 'mobile-drv-lic':
      return signal.signatureValid
        ? { signalKind: 'mobile-drv-lic', delta: 18, reason: `mDL signature valid (${signal.state})` }
        : { signalKind: 'mobile-drv-lic', delta: -15, reason: 'mDL signature INVALID' };
    case 'login-gov':           return { signalKind: 'login-gov',           delta: signal.aalLevel === 3 ? 22 : signal.aalLevel === 2 ? 15 : 8,
      reason: `Login.gov IAL${signal.ialLevel} AAL${signal.aalLevel}` };
  }
}

// ───────────────────────────────────────────────────────────────────────────
// Fracture detection
// ───────────────────────────────────────────────────────────────────────────

function detectFractures(
  batch: TelemetrySignalBatch,
  nowMs: number,
  staleMs: number,
): IdentityFracture[] {
  const fractures: IdentityFracture[] = [];

  // Duress
  for (const stepUp of batch.stepUp) {
    if (stepUp.kind === 'duress' && stepUp.triggered && !isStale(stepUp.observedAtMs, nowMs, staleMs)) {
      fractures.push({
        kind: 'duress',
        description: 'Duress biometric triggered',
        contributingSignals: ['duress'],
      });
    }
  }

  // Typing-while-driving: typing cadence match present + activity=driving
  const typingMatched = batch.ambient.some(
    (a) => a.kind === 'kinematic' && a.typingCadenceMatch > 0.6 && !isStale(a.observedAtMs, nowMs, staleMs),
  );
  const driving = batch.ambient.some(
    (a) => a.kind === 'activity-recognition' && a.activity === 'driving' && a.confidence > 0.7 && !isStale(a.observedAtMs, nowMs, staleMs),
  );
  if (typingMatched && driving) {
    fractures.push({
      kind: 'typing-while-driving',
      description: 'Device reports typing but body reports driving — identity fracture',
      contributingSignals: ['kinematic', 'activity-recognition'],
    });
  }

  // Speaker mismatch: diarization score below 0.3
  for (const a of batch.ambient) {
    if (a.kind === 'acoustic-diarization' && a.speakerMatchScore < 0.3 && !isStale(a.observedAtMs, nowMs, staleMs)) {
      fractures.push({
        kind: 'speaker-mismatch',
        description: `Acoustic speaker does not match baseline (score=${a.speakerMatchScore})`,
        contributingSignals: ['acoustic-diarization'],
      });
    }
  }

  // Device handoff: gait match low while typing cadence still matches (strong change in physical holder)
  for (const a of batch.ambient) {
    if (a.kind === 'kinematic' && a.gaitMatchScore < 0.3 && a.typingCadenceMatch > 0.7
      && !isStale(a.observedAtMs, nowMs, staleMs)) {
      fractures.push({
        kind: 'device-handoff',
        description: 'Gait does not match baseline while typing cadence does — likely handoff',
        contributingSignals: ['kinematic'],
      });
    }
  }

  return fractures;
}

// ───────────────────────────────────────────────────────────────────────────
// Civic clearance resolution
// ───────────────────────────────────────────────────────────────────────────

function resolveCivicClearance(
  civicSignals: CivicSignal[],
  fractures: IdentityFracture[],
): CivicClearance {
  if (fractures.some((f) => f.kind === 'duress')) {
    // Duress never promotes above basic — appear normal but stay locked.
    return 'basic';
  }

  const hasEpassport = civicSignals.some((s) => s.kind === 'epassport-chip' && s.signatureValid);
  const hasAnyCivic = civicSignals.some((s) => {
    switch (s.kind) {
      case 'interac-verified':  return true;
      case 'epassport-chip':    return s.signatureValid;
      case 'provincial-oidc':   return true;
      case 'mobile-drv-lic':    return s.signatureValid;
      case 'login-gov':         return true;
    }
  });

  if (hasEpassport) return 'sovereign';
  if (hasAnyCivic) return 'verified';
  return 'basic';
}

// ───────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────

function isStale(observedAtMs: number, nowMs: number, staleMs: number): boolean {
  return nowMs - observedAtMs > staleMs;
}
