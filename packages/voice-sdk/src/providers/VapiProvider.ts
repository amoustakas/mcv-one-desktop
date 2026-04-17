// @mcv/voice-sdk — Vapi provider adapter.
//
// Vapi is purpose-built for PSTN/SIP phone agents. It doesn't expose an
// in-browser streaming audio surface the way Gemini Live / OpenAI Realtime
// do, so our `connect()` returns a lightweight control handle backed by
// Vapi's REST API (@vapi-ai/server-sdk). Audio events on the phone call
// are observed via Vapi webhooks in the host app (out of scope for this
// adapter). The main use is:
//
//   * createAssistant() — seeded from VoiceSessionParams.
//   * placeCall() — triggers an outbound call, emits 'open' + 'close'.
//
// When a venture needs truly in-app voice we route to Gemini / ElevenLabs
// via the router; Vapi is reserved for phone use cases.

/* eslint-disable @typescript-eslint/no-explicit-any */

import type {
  ProviderConnection,
  ProviderContract,
  ProviderConfig,
  VoiceSessionParams,
} from './ProviderContract';
import { TinyEmitter } from './ProviderContract';

const VAPI_PKG = ['@vapi-ai', 'server-sdk'].join('/');

async function loadSdk(): Promise<any | null> {
  try {
    return await import(/* @vite-ignore */ VAPI_PKG);
  } catch {
    return null;
  }
}

class VapiConnection extends TinyEmitter implements ProviderConnection {
  readonly provider = 'vapi' as const;
  sessionId?: string;
  state: ProviderConnection['state'] = 'connecting';
  private client: any = null;

  async open(params: VoiceSessionParams, config: ProviderConfig) {
    const sdk = await loadSdk();
    if (!sdk) {
      this.state = 'error';
      const err = new Error('@vapi-ai/server-sdk not installed; Vapi unavailable');
      this.emit('error', err);
      throw err;
    }
    const { VapiClient } = sdk;
    this.client = new VapiClient({ token: config.apiKey });

    // Pre-register assistant config so that later sendText()/call attempts
    // resolve instantly.
    const raw = (params.raw ?? {}) as Record<string, any>;
    try {
      const assistant = await this.client.assistants.create({
        name: (raw.assistantName as string) ?? 'MCV Voice',
        model: {
          provider: (raw.llmProvider as string) ?? 'openai',
          model: params.model ?? 'gpt-4o',
          systemPrompt: params.systemPrompt ?? '',
        },
        voice: {
          provider: (raw.voiceProvider as string) ?? '11labs',
          voiceId: params.voiceId ?? 'rachel',
        },
      });
      this.sessionId = assistant?.id;
      this.state = 'open';
      this.emit('open');
    } catch (err) {
      this.state = 'error';
      this.emit('error', err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  }

  async sendAudio(): Promise<void> {
    // Vapi audio lives on the phone bridge; not exposed through server SDK.
  }

  async sendText(text: string): Promise<void> {
    if (!this.client || !this.sessionId) return;
    const raw = (this as any)._pendingCallParams ?? {};
    try {
      const call = await this.client.calls.create({
        assistantId: this.sessionId,
        phoneNumberId: raw.phoneNumberId,
        customer: raw.customer,
        assistantOverrides: { firstMessage: text },
      });
      this.emit('turn-complete');
      if (call?.id) this.sessionId = call.id;
    } catch (err) {
      this.emit('error', err instanceof Error ? err : new Error(String(err)));
    }
  }

  async sendToolResponse(): Promise<void> {
    // Vapi tool-call responses flow through server webhooks; not applicable here.
  }

  async finish(): Promise<void> { /* no-op */ }

  async close(): Promise<void> {
    this.state = 'closed';
    this.emit('close');
    this.removeAll();
  }
}

export const VapiProvider: ProviderContract = {
  name: 'vapi',
  capabilities: ['phone', 'realtime'],

  async connect(params, config) {
    const conn = new VapiConnection();
    await conn.open(params, config);
    return conn;
  },

  async health(config) {
    const t0 = Date.now();
    try {
      const res = await fetch('https://api.vapi.ai/assistant', {
        headers: { authorization: `Bearer ${config.apiKey ?? ''}` },
      });
      return { ok: res.ok, latencyMs: Date.now() - t0 };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  },
};
