// @mcv/voice-sdk — FallbackChain
//
// Declarative provider fallback: try primary, on failure/timeout advance to
// the next candidate. Ventures configure a chain via
// `venture.voice.fallback`; the router wraps every connect() with it.
//
// The chain is intentionally stateless — no hardcoded provider names, no
// provider-specific branches. Each candidate is `{ provider, reason? }`;
// the chain calls `attempt(candidate)` in order and returns the first
// successful result.

import type { ProviderName } from '../providers/ProviderContract';

export interface FallbackCandidate {
  /** Canonical provider name, looked up in the provider registry. */
  provider: ProviderName;
  /** Optional free-form reason surfaced in telemetry. */
  reason?: string;
  /** Per-candidate overrides merged into VoiceSessionParams. */
  overrides?: Record<string, unknown>;
}

export interface FallbackAttemptResult<T> {
  /** 'primary' was the first candidate. */
  candidate: FallbackCandidate;
  /** Zero-based index of the candidate that succeeded. */
  index: number;
  /** Milliseconds taken. */
  elapsedMs: number;
  /** The successful attempt's return value. */
  value: T;
}

export interface FallbackFailure {
  candidate: FallbackCandidate;
  index: number;
  elapsedMs: number;
  error: Error;
}

export interface FallbackOptions {
  /** Timeout per candidate attempt, ms. Default 2000 (2s for realtime). */
  timeoutMs?: number;
  /** Called each time a candidate fails (for telemetry/UI). */
  onFailure?: (failure: FallbackFailure) => void;
  /** Called once a candidate succeeds. */
  onSuccess?: (result: FallbackAttemptResult<unknown>) => void;
}

/**
 * Run an async attempt against each candidate until one succeeds or all fail.
 * Generic over T so it fits both `connect()` (returns ProviderConnection)
 * and `tts()` (returns ArrayBuffer).
 */
export class FallbackChain {
  constructor(
    public readonly candidates: ReadonlyArray<FallbackCandidate>,
    public readonly options: FallbackOptions = {},
  ) {
    if (candidates.length === 0) {
      throw new Error('FallbackChain: at least one candidate required');
    }
  }

  async run<T>(
    attempt: (candidate: FallbackCandidate) => Promise<T>,
  ): Promise<FallbackAttemptResult<T>> {
    const errors: FallbackFailure[] = [];
    const timeoutMs = this.options.timeoutMs ?? 2000;

    for (let i = 0; i < this.candidates.length; i++) {
      const candidate = this.candidates[i];
      const t0 = Date.now();
      try {
        const value = await withTimeout(attempt(candidate), timeoutMs);
        const result: FallbackAttemptResult<T> = {
          candidate,
          index: i,
          elapsedMs: Date.now() - t0,
          value,
        };
        this.options.onSuccess?.(result as FallbackAttemptResult<unknown>);
        return result;
      } catch (err) {
        const failure: FallbackFailure = {
          candidate,
          index: i,
          elapsedMs: Date.now() - t0,
          error: err instanceof Error ? err : new Error(String(err)),
        };
        errors.push(failure);
        this.options.onFailure?.(failure);
      }
    }

    const lastErr = errors[errors.length - 1];
    const combined = new Error(
      `FallbackChain exhausted (${errors.length} attempts). Last error: ${lastErr?.error.message ?? 'unknown'}`,
    );
    (combined as Error & { failures: FallbackFailure[] }).failures = errors;
    throw combined;
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  if (ms <= 0) return promise;
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms);
    promise
      .then((v) => { clearTimeout(timer); resolve(v); })
      .catch((err) => { clearTimeout(timer); reject(err); });
  });
}
