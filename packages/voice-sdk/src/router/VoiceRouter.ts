// @mcv/voice-sdk — VoiceRouter
//
// High-level orchestrator that turns a venture + use-case + agent into a
// live provider session. Key design:
//
//   * Composes FallbackChain around provider.connect() so failover is
//     declarative per-venture.
//   * Resolves agent_persona.voice_profile via persona-bridge → provider
//     params.
//   * Enforces per-venture quota (stub — host app wires up actual spend
//     tracking via `onUsage` callback).
//
// No provider name is hardcoded. The chain is a list of ProviderName
// strings resolved at attempt time from the registry.

import type {
  ProviderConnection,
  ProviderConfig,
  VoiceSessionParams,
  ProviderName,
} from '../providers/ProviderContract';
import { getProvider } from '../providers/registry';
import {
  FallbackChain,
  type FallbackCandidate,
  type FallbackOptions,
  type FallbackFailure,
} from './FallbackChain';
import { personaProfileToParams, type AgentVoiceProfile } from '../integrations/agent-persona-bridge';

export interface VentureVoiceConfig {
  /** Venture id — matches ventures-sdk Venture.id. */
  ventureId: string;
  /** Primary provider for this venture. */
  primary: ProviderName;
  /** Ordered fallbacks. Empty array = no fallback. */
  fallback: ProviderName[];
  /** Optional per-provider param overrides (voiceId, model, etc.). */
  overrides?: Partial<Record<ProviderName, Partial<VoiceSessionParams>>>;
  /** Optional monthly spend cap in USD (router alerts at 80%). */
  monthlySpendCapUsd?: number;
}

export interface RouteRequest {
  venture: VentureVoiceConfig;
  /** Agent persona voice_profile JSONB from Supabase. */
  agentPersona?: AgentVoiceProfile;
  /** Caller-supplied session params (merged after persona → overrides). */
  params?: VoiceSessionParams;
  /** Configs keyed by provider name. */
  providerConfigs: Partial<Record<ProviderName, ProviderConfig>>;
  /** Fallback options (timeout per attempt, etc.). */
  fallback?: FallbackOptions;
}

export interface RouteResult {
  connection: ProviderConnection;
  /** Which provider won. */
  provider: ProviderName;
  /** True if any fallback fired. */
  degraded: boolean;
  /** All attempts with timings. */
  attempts: Array<{ provider: ProviderName; ok: boolean; elapsedMs: number; error?: string }>;
}

export interface UsageEvent {
  ventureId: string;
  provider: ProviderName;
  /** Minutes of audio streamed (estimate). */
  minutes: number;
  /** Cost in USD (estimate — provider-specific rates live in host app). */
  costUsd?: number;
  timestamp: number;
}

export interface QuotaTracker {
  record(event: UsageEvent): void;
  /** Return consumed USD for ventureId in current billing month. */
  monthlySpend(ventureId: string): number;
  /** Called by router when >=80% of cap consumed. */
  onAlert?: (ventureId: string, consumed: number, cap: number) => void;
}

/**
 * Default quota tracker keeps totals in-memory. Host apps wire a
 * Supabase-backed one (see @mcv/kits-sdk telemetry) by assigning
 * `router.quota = customTracker`.
 */
export class InMemoryQuotaTracker implements QuotaTracker {
  private spend = new Map<string, number>();
  onAlert?: (ventureId: string, consumed: number, cap: number) => void;

  record(event: UsageEvent): void {
    const cur = this.spend.get(event.ventureId) ?? 0;
    this.spend.set(event.ventureId, cur + (event.costUsd ?? 0));
  }

  monthlySpend(ventureId: string): number {
    return this.spend.get(ventureId) ?? 0;
  }
}

export class VoiceRouter {
  public quota: QuotaTracker = new InMemoryQuotaTracker();

  /**
   * Open a streaming voice session for an agent inside a venture.
   * Applies fallback chain automatically. Non-destructive on failure —
   * returns a rejected promise only after every candidate fails.
   */
  async connect(req: RouteRequest): Promise<RouteResult> {
    // 1. Enforce quota cap (throw if hard cap exceeded).
    if (req.venture.monthlySpendCapUsd != null) {
      const consumed = this.quota.monthlySpend(req.venture.ventureId);
      const cap = req.venture.monthlySpendCapUsd;
      if (consumed >= cap) {
        throw new Error(`Venture ${req.venture.ventureId} exceeded monthly voice spend cap $${cap}`);
      }
      if (consumed >= cap * 0.8 && typeof (this.quota as InMemoryQuotaTracker).onAlert === 'function') {
        (this.quota as InMemoryQuotaTracker).onAlert?.(req.venture.ventureId, consumed, cap);
      }
    }

    // 2. Build fallback candidates = primary + fallback[].
    const candidates: FallbackCandidate[] = [
      { provider: req.venture.primary, reason: 'primary' },
      ...req.venture.fallback.map((p) => ({ provider: p as ProviderName, reason: 'fallback' })),
    ];

    const attempts: RouteResult['attempts'] = [];
    const chain = new FallbackChain(candidates, {
      timeoutMs: req.fallback?.timeoutMs ?? 2000,
      onFailure: (f: FallbackFailure) => {
        attempts.push({
          provider: f.candidate.provider,
          ok: false,
          elapsedMs: f.elapsedMs,
          error: f.error.message,
        });
        req.fallback?.onFailure?.(f);
      },
      onSuccess: (r) => {
        attempts.push({
          provider: r.candidate.provider,
          ok: true,
          elapsedMs: r.elapsedMs,
        });
        req.fallback?.onSuccess?.(r);
      },
    });

    const result = await chain.run<ProviderConnection>(async (candidate) => {
      const provider = getProvider(candidate.provider);
      if (!provider) {
        throw new Error(`Provider '${candidate.provider}' not registered`);
      }
      const config = req.providerConfigs[candidate.provider];
      if (!config) {
        throw new Error(`Provider '${candidate.provider}' missing config`);
      }
      const ventureOverrides = req.venture.overrides?.[candidate.provider] ?? {};
      const personaParams = req.agentPersona
        ? personaProfileToParams(req.agentPersona, candidate.provider)
        : {};
      const merged: VoiceSessionParams = {
        ...personaParams,
        ...ventureOverrides,
        ...req.params,
      };
      return provider.connect(merged, config);
    });

    return {
      connection: result.value,
      provider: result.candidate.provider,
      degraded: result.index > 0,
      attempts,
    };
  }

  /**
   * One-shot TTS with fallback. Useful for narration assets that don't
   * need streaming but still want provider resilience.
   */
  async tts(req: RouteRequest & { text: string }): Promise<{ audio: ArrayBuffer; provider: ProviderName; degraded: boolean }> {
    const candidates: FallbackCandidate[] = [
      { provider: req.venture.primary, reason: 'primary' },
      ...req.venture.fallback.map((p) => ({ provider: p as ProviderName, reason: 'fallback' })),
    ];
    const chain = new FallbackChain(candidates, req.fallback);
    const result = await chain.run<ArrayBuffer>(async (candidate) => {
      const provider = getProvider(candidate.provider);
      if (!provider?.tts) throw new Error(`Provider '${candidate.provider}' has no tts()`);
      const config = req.providerConfigs[candidate.provider];
      if (!config) throw new Error(`Provider '${candidate.provider}' missing config`);
      const personaParams = req.agentPersona
        ? personaProfileToParams(req.agentPersona, candidate.provider)
        : {};
      const params: VoiceSessionParams = { ...personaParams, ...(req.venture.overrides?.[candidate.provider] ?? {}), ...req.params };
      return provider.tts(req.text, params, config);
    });
    return { audio: result.value, provider: result.candidate.provider, degraded: result.index > 0 };
  }
}
