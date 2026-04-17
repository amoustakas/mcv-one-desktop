// @mcv/voice-sdk — Deepgram provider adapter.
//
// Deepgram handles STT only (Nova-3). We expose:
//   * connect() → live WebSocket transcription (listen.live)
//   * transcribe() → one-shot for recorded clips
//
// For composite stacks (D+E), the router creates a Deepgram connection for
// STT and an ElevenLabs connection for TTS; cross-wiring happens in
// VoiceSession.

/* eslint-disable @typescript-eslint/no-explicit-any */

import type {
  ProviderConnection,
  ProviderContract,
  ProviderConfig,
  VoiceSessionParams,
  ProviderTranscript,
} from './ProviderContract';
import { TinyEmitter } from './ProviderContract';

async function loadSdk(): Promise<any | null> {
  try {
    // @ts-expect-error — optional peer; installed by host app only if Deepgram is used
    return await import('@deepgram/sdk');
  } catch {
    return null;
  }
}

class DeepgramConnection extends TinyEmitter implements ProviderConnection {
  readonly provider = 'deepgram' as const;
  sessionId?: string;
  state: ProviderConnection['state'] = 'connecting';
  private conn: any = null;
  private keepAliveTimer?: ReturnType<typeof setInterval>;

  async open(params: VoiceSessionParams, config: ProviderConfig) {
    const sdk = await loadSdk();
    if (!sdk) {
      this.state = 'error';
      const err = new Error('@deepgram/sdk not installed; Deepgram unavailable');
      this.emit('error', err);
      throw err;
    }
    const client = sdk.createClient(config.apiKey);
    this.conn = client.listen.live({
      model: params.model ?? 'nova-3',
      language: params.language ?? 'en',
      smart_format: true,
      interim_results: true,
      utterance_end_ms: 1000,
      vad_events: true,
      endpointing: 300,
    });

    const { LiveTranscriptionEvents } = sdk;

    this.conn.on(LiveTranscriptionEvents.Open, () => {
      this.state = 'open';
      this.emit('open');
      // Keep-alive ping every 8s (Deepgram closes idle sockets at 10s).
      this.keepAliveTimer = setInterval(() => {
        try { this.conn?.keepAlive?.(); } catch { /* ignore */ }
      }, 8000);
    });

    this.conn.on(LiveTranscriptionEvents.Transcript, (data: any) => {
      const alt = data?.channel?.alternatives?.[0];
      if (!alt) return;
      const transcript: ProviderTranscript = {
        text: alt.transcript,
        isFinal: !!data.is_final,
        confidence: alt.confidence,
        words: alt.words,
      };
      if (transcript.isFinal) {
        this.emit('transcript-final', transcript);
      } else {
        this.emit('transcript-partial', transcript);
      }
    });

    this.conn.on(LiveTranscriptionEvents.UtteranceEnd, () => {
      this.emit('turn-complete');
    });

    this.conn.on(LiveTranscriptionEvents.Error, (err: any) => {
      this.state = 'error';
      this.emit('error', err instanceof Error ? err : new Error(String(err)));
    });

    this.conn.on(LiveTranscriptionEvents.Close, () => {
      this.state = 'closed';
      if (this.keepAliveTimer) clearInterval(this.keepAliveTimer);
      this.emit('close');
    });
  }

  sendAudio(data: ArrayBuffer | Uint8Array): void {
    if (this.state !== 'open') return;
    try { this.conn?.send?.(data); } catch { /* ignore */ }
  }

  sendText(): void {
    // Deepgram STT takes no text input.
  }

  sendToolResponse(): void { /* not applicable */ }

  finish(): void {
    try { this.conn?.requestClose?.(); } catch { /* ignore */ }
  }

  close(): void {
    if (this.keepAliveTimer) clearInterval(this.keepAliveTimer);
    try { this.conn?.requestClose?.(); } catch { /* ignore */ }
    this.state = 'closed';
    this.emit('close');
    this.removeAll();
  }
}

export const DeepgramProvider: ProviderContract = {
  name: 'deepgram',
  capabilities: ['stt'],

  async connect(params, config) {
    const conn = new DeepgramConnection();
    await conn.open(params, config);
    return conn;
  },

  async transcribe(audio, params, config): Promise<ProviderTranscript> {
    const sdk = await loadSdk();
    if (sdk) {
      const client = sdk.createClient(config.apiKey);
      const bytes = audio instanceof Uint8Array ? audio : new Uint8Array(audio);
      const { result } = await client.listen.prerecorded.transcribeFile(bytes, {
        model: params.model ?? 'nova-3',
        smart_format: true,
        language: params.language ?? 'en',
      });
      const alt = result?.results?.channels?.[0]?.alternatives?.[0];
      return {
        text: alt?.transcript ?? '',
        isFinal: true,
        confidence: alt?.confidence,
        words: alt?.words,
      };
    }
    // REST fallback.
    const res = await fetch(`${config.baseUrl ?? 'https://api.deepgram.com'}/v1/listen?model=${params.model ?? 'nova-3'}&smart_format=true`, {
      method: 'POST',
      headers: {
        authorization: `Token ${config.apiKey ?? ''}`,
        'content-type': 'audio/wav',
      },
      body: audio as ArrayBuffer,
    });
    if (!res.ok) throw new Error(`Deepgram transcribe failed: ${res.status}`);
    const json = await res.json();
    const alt = json?.results?.channels?.[0]?.alternatives?.[0];
    return {
      text: alt?.transcript ?? '',
      isFinal: true,
      confidence: alt?.confidence,
    };
  },

  async health(config) {
    const t0 = Date.now();
    try {
      const res = await fetch(`${config.baseUrl ?? 'https://api.deepgram.com'}/v1/projects`, {
        headers: { authorization: `Token ${config.apiKey ?? ''}` },
      });
      return { ok: res.ok, latencyMs: Date.now() - t0 };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  },
};
