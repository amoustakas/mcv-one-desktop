// @mcv/voice-sdk — OpenAI Realtime provider adapter.
//
// Uses the WebSocket transport exposed by `openai/realtime/ws` (Node) /
// `openai/realtime/websocket` (browser). We pick whichever is available at
// import time so the same adapter works in both environments.
//
// Events of interest:
//   * 'response.audio.delta'   → audio-chunk
//   * 'response.audio_transcript.delta' → transcript-partial
//   * 'response.audio_transcript.done'  → transcript-final
//   * 'response.function_call_arguments.done' → tool-call
//   * 'response.done'          → turn-complete

/* eslint-disable @typescript-eslint/no-explicit-any */

import type {
  ProviderConnection,
  ProviderContract,
  ProviderConfig,
  VoiceSessionParams,
  ProviderAudioChunk,
  ProviderTranscript,
} from './ProviderContract';
import { TinyEmitter } from './ProviderContract';

async function loadRealtime(): Promise<{ impl: any; kind: 'ws' | 'browser' } | null> {
  // Prefer browser WebSocket when `window` is present.
  const isBrowser = typeof window !== 'undefined' && typeof (window as any).WebSocket !== 'undefined';
  try {
    if (isBrowser) {
      // @ts-expect-error — optional peer; installed by host app only if OpenAI Realtime is used
      const mod = await import('openai/realtime/websocket');
      return { impl: mod.OpenAIRealtimeWebSocket, kind: 'browser' };
    }
    // @ts-expect-error — optional peer; installed by host app only if OpenAI Realtime is used
    const mod = await import('openai/realtime/ws');
    return { impl: mod.OpenAIRealtimeWS, kind: 'ws' };
  } catch {
    return null;
  }
}

function base64ToBuffer(b64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') return Uint8Array.from(Buffer.from(b64, 'base64'));
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

class OpenAIRealtimeConnection extends TinyEmitter implements ProviderConnection {
  readonly provider = 'openai-realtime' as const;
  sessionId?: string;
  state: ProviderConnection['state'] = 'connecting';
  private rt: any = null;
  private start = Date.now();
  private firstAudio = true;

  async open(params: VoiceSessionParams, config: ProviderConfig) {
    const loaded = await loadRealtime();
    if (!loaded) {
      this.state = 'error';
      const err = new Error('openai/realtime/ws not installed; OpenAI Realtime unavailable');
      this.emit('error', err);
      throw err;
    }
    const Ctor = loaded.impl;
    this.rt = new Ctor({
      model: params.model ?? 'gpt-realtime',
      apiKey: config.apiKey,
    });

    const onOpen = () => {
      this.state = 'open';
      this.emit('open');
      this.rt.send({
        type: 'session.update',
        session: {
          modalities: ['text', 'audio'],
          voice: params.voiceId ?? 'alloy',
          input_audio_format: 'pcm16',
          output_audio_format: 'pcm16',
          instructions: params.systemPrompt ?? '',
          tools: params.tools ?? [],
          turn_detection: params.interruptible === false ? null : { type: 'server_vad' },
        },
      });
    };

    if (loaded.kind === 'ws') {
      this.rt.socket.on('open', onOpen);
      this.rt.socket.on('close', () => { this.state = 'closed'; this.emit('close'); });
    } else {
      this.rt.socket.addEventListener('open', onOpen);
      this.rt.socket.addEventListener('close', () => { this.state = 'closed'; this.emit('close'); });
    }

    this.rt.on('error', (err: any) => {
      this.state = 'error';
      this.emit('error', err instanceof Error ? err : new Error(String(err)));
    });

    this.rt.on('response.audio.delta', (event: any) => {
      if (!event?.delta) return;
      const bytes = base64ToBuffer(event.delta);
      const chunk: ProviderAudioChunk = {
        data: bytes,
        timestamp: Date.now() - this.start,
        first: this.firstAudio,
      };
      this.firstAudio = false;
      this.emit('audio-chunk', chunk);
    });

    this.rt.on('response.audio_transcript.delta', (event: any) => {
      if (!event?.delta) return;
      const t: ProviderTranscript = { text: event.delta, isFinal: false };
      this.emit('transcript-partial', t);
    });

    this.rt.on('response.audio_transcript.done', (event: any) => {
      const t: ProviderTranscript = { text: event?.transcript ?? '', isFinal: true };
      this.emit('transcript-final', t);
    });

    this.rt.on('response.function_call_arguments.done', (event: any) => {
      try {
        const args = typeof event.arguments === 'string' ? JSON.parse(event.arguments) : (event.arguments ?? {});
        this.emit('tool-call', {
          id: event.call_id ?? event.id ?? `call_${Date.now()}`,
          name: event.name ?? '',
          arguments: args,
        });
      } catch {
        this.emit('tool-call', { id: String(event.id ?? Date.now()), name: event.name ?? '', arguments: {} });
      }
    });

    this.rt.on('response.done', () => this.emit('turn-complete'));
    this.rt.on('session.created', (event: any) => { this.sessionId = event?.session?.id; });
  }

  sendAudio(data: ArrayBuffer | Uint8Array): void {
    if (this.state !== 'open' || !this.rt) return;
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    this.rt.send({ type: 'input_audio_buffer.append', audio: bufferToBase64(bytes) });
  }

  sendText(text: string): void {
    if (!this.rt) return;
    this.rt.send({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text }],
      },
    });
    this.rt.send({ type: 'response.create' });
  }

  sendToolResponse(id: string, result: unknown): void {
    if (!this.rt) return;
    this.rt.send({
      type: 'conversation.item.create',
      item: {
        type: 'function_call_output',
        call_id: id,
        output: typeof result === 'string' ? result : JSON.stringify(result),
      },
    });
    this.rt.send({ type: 'response.create' });
  }

  finish(): void {
    try { this.rt?.send?.({ type: 'input_audio_buffer.commit' }); } catch { /* ignore */ }
  }

  close(): void {
    try { this.rt?.close?.(); } catch { /* ignore */ }
    this.state = 'closed';
    this.emit('close');
    this.removeAll();
  }
}

export const OpenAIRealtimeProvider: ProviderContract = {
  name: 'openai-realtime',
  capabilities: ['stt', 'tts', 'realtime'],

  async connect(params, config) {
    const conn = new OpenAIRealtimeConnection();
    await conn.open(params, config);
    return conn;
  },

  async health(config) {
    const t0 = Date.now();
    try {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { authorization: `Bearer ${config.apiKey ?? ''}` },
      });
      return { ok: res.ok, latencyMs: Date.now() - t0 };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  },
};
