// @mcv/voice-sdk — VoiceRouter integration tests.
//
// Uses hand-rolled mock providers. Verifies the 6-point acceptance tests:
//   1. Default routing to primary provider.
//   2. Fallback fires when primary times out.
//   3. agent_persona.voice_profile translates into provider params.
//   4. Quota caps enforced.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  VoiceRouter,
  type VentureVoiceConfig,
} from '../router/VoiceRouter';
import {
  registerProvider,
  clearProviders,
} from '../providers/registry';
import {
  TinyEmitter,
  type ProviderContract,
  type ProviderConnection,
} from '../providers/ProviderContract';

function makeMockProvider(name: any, opts: { latencyMs?: number; failWith?: string; capture?: (params: any) => void } = {}): ProviderContract {
  return {
    name,
    capabilities: ['realtime'],
    async connect(params) {
      opts.capture?.(params);
      if (opts.latencyMs) {
        await new Promise((r) => setTimeout(r, opts.latencyMs));
      }
      if (opts.failWith) throw new Error(opts.failWith);
      const conn: ProviderConnection & TinyEmitter = Object.assign(new TinyEmitter(), {
        provider: name,
        sessionId: `${name}-session`,
        state: 'open' as const,
        sendAudio: () => {},
        sendText: () => {},
        sendToolResponse: () => {},
        finish: async () => {},
        close: async () => {},
        on: function (this: any, event: string, cb: any) { return TinyEmitter.prototype.on.call(this, event, cb); },
      }) as any;
      return conn;
    },
    async tts() { return new ArrayBuffer(0); },
  };
}

const providerConfigs = {
  'gemini-live': { apiKey: 'fake-gemini' },
  'elevenlabs': { apiKey: 'fake-eleven' },
  'deepgram': { apiKey: 'fake-deepgram' },
  'azure-speech': { apiKey: 'fake-azure' },
} as const;

describe('VoiceRouter', () => {
  beforeEach(() => {
    clearProviders();
  });

  it('routes to primary when healthy', async () => {
    registerProvider(makeMockProvider('gemini-live'));
    registerProvider(makeMockProvider('elevenlabs'));

    const venture: VentureVoiceConfig = {
      ventureId: 'mcv',
      primary: 'gemini-live',
      fallback: ['elevenlabs'],
    };
    const router = new VoiceRouter();
    const result = await router.connect({ venture, providerConfigs });
    expect(result.provider).toBe('gemini-live');
    expect(result.degraded).toBe(false);
    expect(result.attempts.length).toBe(1);
  });

  it('falls back from Gemini (2s timeout) to ElevenLabs+Deepgram composite', async () => {
    registerProvider(makeMockProvider('gemini-live', { latencyMs: 500 }));
    registerProvider(makeMockProvider('elevenlabs'));
    registerProvider(makeMockProvider('deepgram'));

    const venture: VentureVoiceConfig = {
      ventureId: 'futurestate',
      primary: 'gemini-live',
      fallback: ['elevenlabs', 'deepgram'],
    };
    const router = new VoiceRouter();
    const onFailure = vi.fn();
    const result = await router.connect({
      venture,
      providerConfigs,
      fallback: { timeoutMs: 100, onFailure },
    });
    expect(result.provider).toBe('elevenlabs');
    expect(result.degraded).toBe(true);
    expect(onFailure).toHaveBeenCalledTimes(1);
  });

  it('throws when all providers fail', async () => {
    registerProvider(makeMockProvider('gemini-live', { failWith: 'down' }));
    registerProvider(makeMockProvider('elevenlabs', { failWith: 'down' }));

    const venture: VentureVoiceConfig = {
      ventureId: 'warforge',
      primary: 'gemini-live',
      fallback: ['elevenlabs'],
    };
    const router = new VoiceRouter();
    await expect(
      router.connect({ venture, providerConfigs, fallback: { timeoutMs: 200 } })
    ).rejects.toThrow(/exhausted/);
  });

  it('applies agent_persona.voice_profile to provider params', async () => {
    const captured: Record<string, any> = {};
    registerProvider(
      makeMockProvider('gemini-live', { capture: (p) => { captured['gemini'] = p; } }),
    );
    registerProvider(makeMockProvider('elevenlabs'));

    const venture: VentureVoiceConfig = {
      ventureId: 'mcv',
      primary: 'gemini-live',
      fallback: ['elevenlabs'],
    };
    const router = new VoiceRouter();
    await router.connect({
      venture,
      providerConfigs,
      agentPersona: {
        tone: 'authoritative',
        pace: 'measured',
        hedges: 0.2,
        humor: 0.1,
      },
    });
    expect(captured.gemini.voiceId).toBe('Charon');
    expect(captured.gemini.paceWpm).toBe(130);
    expect(captured.gemini.stability).toBeGreaterThanOrEqual(0.75);
  });

  it('rejects a venture that exceeded its monthly cap', async () => {
    registerProvider(makeMockProvider('gemini-live'));
    const router = new VoiceRouter();
    router.quota.record({ ventureId: 'betedge', provider: 'gemini-live', minutes: 1000, costUsd: 100, timestamp: Date.now() });

    const venture: VentureVoiceConfig = {
      ventureId: 'betedge',
      primary: 'gemini-live',
      fallback: [],
      monthlySpendCapUsd: 100,
    };
    await expect(router.connect({ venture, providerConfigs })).rejects.toThrow(/spend cap/);
  });

  it('does NOT hardcode provider names — router works with unknown provider', async () => {
    registerProvider(makeMockProvider('xai-grok' as any));
    const venture: VentureVoiceConfig = {
      ventureId: 'edgeiq',
      primary: 'xai-grok' as any,
      fallback: [],
    };
    const router = new VoiceRouter();
    const result = await router.connect({
      venture,
      providerConfigs: { 'xai-grok': { apiKey: 'fake' } } as any,
    });
    expect(result.provider).toBe('xai-grok');
  });
});
