// @mcv/voice-sdk — ElevenLabs provider adapter.
//
// ElevenLabs serves three capabilities for us:
//   1. Streaming TTS (textToSpeech.stream) — premium personas, investor voice.
//   2. One-shot TTS (textToSpeech.convert) — narration assets.
//   3. Voice cloning (out of scope for this router; surfaced via elevenlabs-kit).
//
// We do NOT lock the SDK to a specific @elevenlabs/elevenlabs-js version;
// instead we dynamic-import it so MCV Desktop and downstream ventures can
// upgrade independently. If the SDK is missing, connect() degrades to the
// raw REST endpoint so the router's fallback chain still works in envs
// that haven't installed the package.

/* eslint-disable @typescript-eslint/no-explicit-any */

import type {
  ProviderConnection,
  ProviderContract,
  ProviderAudioChunk,
  ProviderConfig,
  VoiceSessionParams,
  ProviderTranscript,
} from './ProviderContract';
import { TinyEmitter } from './ProviderContract';

const BASE_URL = 'https://api.elevenlabs.io';

async function loadSdk(): Promise<any | null> {
  try {
    // @ts-expect-error — optional peer; installed by host app only if ElevenLabs is used
    const mod = await import('@elevenlabs/elevenlabs-js');
    return mod.ElevenLabsClient ? mod : null;
  } catch {
    return null;
  }
}

function mapVoiceSettings(p: VoiceSessionParams) {
  return {
    stability: p.stability ?? 0.5,
    similarityBoost: p.similarity ?? 0.75,
    style: p.style ?? 0,
    useSpeakerBoost: true,
  };
}

class ElevenLabsConnection extends TinyEmitter implements ProviderConnection {
  readonly provider = 'elevenlabs' as const;
  sessionId?: string;
  state: ProviderConnection['state'] = 'connecting';
  private start = Date.now();
  private pendingText: string[] = [];
  private params: VoiceSessionParams;
  private config: ProviderConfig;
  private abort?: AbortController;

  constructor(params: VoiceSessionParams, config: ProviderConfig) {
    super();
    this.params = params;
    this.config = config;
  }

  async open() {
    this.state = 'open';
    this.emit('open');
    // If any text was enqueued before open, flush it.
    for (const t of this.pendingText.splice(0)) {
      await this.sendText(t);
    }
  }

  async sendAudio(): Promise<void> {
    // ElevenLabs TTS path is outbound-only. Deepgram handles STT; composite
    // stack wires them together via VoiceRouter.
    throw new Error('ElevenLabs adapter does not accept inbound audio (use Deepgram for STT).');
  }

  async sendText(text: string): Promise<void> {
    if (this.state !== 'open') { this.pendingText.push(text); return; }
    await this.streamTts(text);
  }

  async sendToolResponse(): Promise<void> {
    // ElevenLabs non-convai TTS has no tool concept.
  }

  async finish(): Promise<void> { /* no-op */ }

  async close(): Promise<void> {
    this.state = 'closed';
    this.abort?.abort();
    this.emit('close');
    this.removeAll();
  }

  private async streamTts(text: string): Promise<void> {
    const voiceId = this.params.voiceId ?? 'JBFqnCBsd6RMkjVDRZzb'; // default "Rachel"
    const model = this.params.model ?? 'eleven_flash_v2_5';
    const format = this.params.outputFormat ?? 'mp3_44100_128';

    this.abort = new AbortController();

    try {
      const sdk = await loadSdk();
      if (sdk) {
        const client = new sdk.ElevenLabsClient({ apiKey: this.config.apiKey });
        const stream = await client.textToSpeech.stream(voiceId, {
          text,
          modelId: model,
          outputFormat: format,
          voiceSettings: mapVoiceSettings(this.params),
        });
        let first = true;
        for await (const chunk of stream as AsyncIterable<Uint8Array>) {
          if (this.state === 'closed') break;
          const audioChunk: ProviderAudioChunk = {
            data: chunk,
            timestamp: Date.now() - this.start,
            first,
          };
          first = false;
          this.emit('audio-chunk', audioChunk);
        }
      } else {
        // REST fallback — stream body chunks.
        const res = await fetch(`${this.config.baseUrl ?? BASE_URL}/v1/text-to-speech/${voiceId}/stream?output_format=${format}`, {
          method: 'POST',
          headers: {
            'xi-api-key': this.config.apiKey ?? '',
            'content-type': 'application/json',
            accept: 'audio/mpeg',
          },
          body: JSON.stringify({
            text,
            model_id: model,
            voice_settings: {
              stability: mapVoiceSettings(this.params).stability,
              similarity_boost: mapVoiceSettings(this.params).similarityBoost,
              style: mapVoiceSettings(this.params).style,
              use_speaker_boost: true,
            },
          }),
          signal: this.abort.signal,
        });
        if (!res.ok || !res.body) throw new Error(`ElevenLabs TTS failed: ${res.status}`);
        const reader = res.body.getReader();
        let first = true;
        while (true) {
          const { done, value } = await reader.read();
          if (done || this.state === 'closed') break;
          if (value) {
            this.emit('audio-chunk', {
              data: value,
              timestamp: Date.now() - this.start,
              first,
            } satisfies ProviderAudioChunk);
            first = false;
          }
        }
      }
      this.emit('turn-complete');
    } catch (err) {
      this.state = 'error';
      this.emit('error', err instanceof Error ? err : new Error(String(err)));
    }
  }
}

export const ElevenLabsProvider: ProviderContract = {
  name: 'elevenlabs',
  capabilities: ['tts', 'clone'],

  async connect(params, config) {
    const conn = new ElevenLabsConnection(params, config);
    // Open on next tick so callers have a chance to subscribe.
    setTimeout(() => conn.open(), 0);
    return conn;
  },

  async tts(text, params, config): Promise<ArrayBuffer> {
    const voiceId = params.voiceId ?? 'JBFqnCBsd6RMkjVDRZzb';
    const model = params.model ?? 'eleven_flash_v2_5';
    const format = params.outputFormat ?? 'mp3_44100_128';
    const sdk = await loadSdk();
    if (sdk) {
      const client = new sdk.ElevenLabsClient({ apiKey: config.apiKey });
      const audio = await client.textToSpeech.convert(voiceId, {
        text, modelId: model, outputFormat: format,
        voiceSettings: mapVoiceSettings(params),
      });
      const chunks: Uint8Array[] = [];
      for await (const c of audio as AsyncIterable<Uint8Array>) chunks.push(c);
      const total = chunks.reduce((s, c) => s + c.byteLength, 0);
      const out = new Uint8Array(total);
      let off = 0;
      for (const c of chunks) { out.set(c, off); off += c.byteLength; }
      return out.buffer;
    }
    const res = await fetch(`${config.baseUrl ?? BASE_URL}/v1/text-to-speech/${voiceId}?output_format=${format}`, {
      method: 'POST',
      headers: {
        'xi-api-key': config.apiKey ?? '',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ text, model_id: model }),
    });
    if (!res.ok) throw new Error(`ElevenLabs TTS failed: ${res.status}`);
    return res.arrayBuffer();
  },

  async transcribe(): Promise<ProviderTranscript> {
    throw new Error('ElevenLabs adapter does not implement STT. Use Deepgram.');
  },

  async health(config) {
    const t0 = Date.now();
    try {
      const res = await fetch(`${config.baseUrl ?? BASE_URL}/v1/voices`, {
        headers: { 'xi-api-key': config.apiKey ?? '' },
      });
      return { ok: res.ok, latencyMs: Date.now() - t0 };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  },
};
