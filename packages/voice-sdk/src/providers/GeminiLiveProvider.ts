// @mcv/voice-sdk — Gemini Live provider adapter.
//
// Uses @google/genai live.connect() for bidirectional audio.
// - Input: 16-bit PCM 16kHz (sendRealtimeInput)
// - Output: 16-bit PCM 24kHz (server-streamed base64)
// - Tool calls: native via functionDeclarations → tool-call event
//
// The SDK shape (per Context7 docs):
//   ai.live.connect({ model, callbacks: { onopen, onmessage, onerror, onclose }, config })
//   session.sendRealtimeInput({ audio: { data, mimeType } })
//   session.sendClientContent({ turns })
//   session.sendToolResponse({ functionResponses: [{ id, name, response }] })
//   session.close()
//
// We keep the dependency soft: if @google/genai is not installed, connect()
// throws with a clear message so the router's fallback chain takes over.

/* eslint-disable @typescript-eslint/no-explicit-any */

import type {
  ProviderConnection,
  ProviderContract,
  ProviderAudioChunk,
  ProviderConfig,
  VoiceSessionParams,
  ProviderToolCall,
  ProviderTranscript,
} from './ProviderContract';
import { TinyEmitter } from './ProviderContract';

async function loadGenAI(): Promise<any | null> {
  try {
    return await import('@google/genai');
  } catch {
    return null;
  }
}

function mapParamsToConfig(params: VoiceSessionParams, Modality: any) {
  const speechConfig: Record<string, unknown> = {};
  if (params.voiceId) {
    speechConfig.voiceConfig = {
      prebuiltVoiceConfig: { voiceName: params.voiceId },
    };
  }
  if (params.language) {
    speechConfig.languageCode = params.language;
  }

  const cfg: Record<string, unknown> = {
    responseModalities: [Modality.AUDIO],
  };
  if (Object.keys(speechConfig).length) cfg.speechConfig = speechConfig;
  if (params.systemPrompt) {
    cfg.systemInstruction = { parts: [{ text: params.systemPrompt }] };
  }
  if (params.tools && params.tools.length) {
    cfg.tools = [{ functionDeclarations: params.tools }];
  }
  return cfg;
}

class GeminiLiveConnection extends TinyEmitter implements ProviderConnection {
  readonly provider = 'gemini-live' as const;
  sessionId?: string;
  state: ProviderConnection['state'] = 'connecting';
  private start = Date.now();
  private session: any = null;
  private firstAudio = true;

  async open(params: VoiceSessionParams, config: ProviderConfig) {
    const genai = await loadGenAI();
    if (!genai) {
      this.state = 'error';
      const err = new Error('@google/genai not installed; Gemini Live unavailable');
      this.emit('error', err);
      throw err;
    }
    const { GoogleGenAI, Modality } = genai;
    const ai = new GoogleGenAI({ apiKey: config.apiKey });
    const model = params.model ?? 'gemini-2.0-flash-live-001';

    try {
      this.session = await ai.live.connect({
        model,
        callbacks: {
          onopen: () => {
            this.state = 'open';
            this.emit('open');
          },
          onmessage: (message: any) => this.handleMessage(message),
          onerror: (e: any) => {
            this.state = 'error';
            this.emit('error', new Error(e?.message ?? String(e)));
          },
          onclose: () => {
            this.state = 'closed';
            this.emit('close');
          },
        },
        config: mapParamsToConfig(params, Modality),
      });
    } catch (err) {
      this.state = 'error';
      this.emit('error', err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  }

  private handleMessage(message: any) {
    // Audio chunks arrive as serverContent.modelTurn.parts[].inlineData or as message.data.
    const ts = Date.now() - this.start;
    if (message?.data) {
      const buf = typeof message.data === 'string'
        ? base64ToBuffer(message.data)
        : message.data;
      const chunk: ProviderAudioChunk = { data: buf, timestamp: ts, first: this.firstAudio };
      this.firstAudio = false;
      this.emit('audio-chunk', chunk);
    }
    const parts = message?.serverContent?.modelTurn?.parts as any[] | undefined;
    if (parts) {
      for (const p of parts) {
        if (p.inlineData?.data) {
          const buf = base64ToBuffer(p.inlineData.data);
          const chunk: ProviderAudioChunk = { data: buf, timestamp: ts, first: this.firstAudio };
          this.firstAudio = false;
          this.emit('audio-chunk', chunk);
        }
        if (p.text) {
          const t: ProviderTranscript = { text: p.text, isFinal: false };
          this.emit('transcript-partial', t);
        }
      }
    }
    if (message?.serverContent?.inputTranscription?.text) {
      const t: ProviderTranscript = { text: message.serverContent.inputTranscription.text, isFinal: true };
      this.emit('transcript-final', t);
    }
    if (message?.serverContent?.turnComplete) {
      this.emit('turn-complete');
    }
    if (message?.toolCall?.functionCalls) {
      for (const fc of message.toolCall.functionCalls) {
        const tc: ProviderToolCall = {
          id: fc.id,
          name: fc.name,
          arguments: fc.args ?? {},
        };
        this.emit('tool-call', tc);
      }
    }
  }

  sendAudio(data: ArrayBuffer | Uint8Array): void {
    if (!this.session || this.state !== 'open') return;
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    const b64 = bufferToBase64(bytes);
    this.session.sendRealtimeInput({
      audio: { data: b64, mimeType: 'audio/pcm;rate=16000' },
    });
  }

  sendText(text: string): void {
    if (!this.session) return;
    this.session.sendClientContent({ turns: text });
  }

  sendToolResponse(id: string, result: unknown): void {
    if (!this.session) return;
    this.session.sendToolResponse({
      functionResponses: [{ id, name: '', response: { result } }],
    });
  }

  finish(): void {
    this.session?.sendRealtimeInput?.({ audioStreamEnd: true });
  }

  close(): void {
    try { this.session?.close?.(); } catch { /* ignore */ }
    this.state = 'closed';
    this.emit('close');
    this.removeAll();
  }
}

function base64ToBuffer(b64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') return Uint8Array.from(Buffer.from(b64, 'base64'));
  // Browser
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

function bufferToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') return Buffer.from(bytes).toString('base64');
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export const GeminiLiveProvider: ProviderContract = {
  name: 'gemini-live',
  capabilities: ['stt', 'tts', 'realtime'],

  async connect(params, config) {
    const conn = new GeminiLiveConnection();
    await conn.open(params, config);
    return conn;
  },

  async health(config) {
    const t0 = Date.now();
    try {
      // Cheap probe — list models endpoint on Generative Language REST surface.
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(config.apiKey ?? '')}`;
      const res = await fetch(url);
      return { ok: res.ok, latencyMs: Date.now() - t0 };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  },
};
