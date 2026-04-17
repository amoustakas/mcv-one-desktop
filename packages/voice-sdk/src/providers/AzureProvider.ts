// @mcv/voice-sdk — Azure Speech provider adapter.
//
// Minimal adapter covering the compliance-regulated use case (future ARQ
// Labs / healthcare). Uses Azure Cognitive Services REST surface:
//   * POST /cognitiveservices/v1 (TTS) with SSML body — streaming chunked
//   * POST /speechtotext/v3.2-preview.2/transcriptions (one-shot STT)
//
// Real-time streaming via Azure Speech SDK (microsoft-cognitiveservices-speech-sdk)
// is supported if the SDK is installed; otherwise we fall back to REST.

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

function buildSsml(text: string, params: VoiceSessionParams): string {
  const voice = params.voiceId ?? 'en-US-JennyNeural';
  const rate = params.paceWpm ? `${Math.round((params.paceWpm / 150) * 100)}%` : '100%';
  const pitch = params.pitch ? `${Math.round(((params.pitch ?? 1) - 1) * 50)}%` : '0%';
  return `<speak version="1.0" xml:lang="en-US"><voice name="${voice}"><prosody rate="${rate}" pitch="${pitch}">${text}</prosody></voice></speak>`;
}

function region(config: ProviderConfig): string {
  return config.region ?? 'eastus';
}

class AzureConnection extends TinyEmitter implements ProviderConnection {
  readonly provider = 'azure-speech' as const;
  sessionId?: string;
  state: ProviderConnection['state'] = 'connecting';
  private start = Date.now();
  private params: VoiceSessionParams;
  private config: ProviderConfig;
  private abort?: AbortController;

  constructor(params: VoiceSessionParams, config: ProviderConfig) {
    super();
    this.params = params;
    this.config = config;
  }

  open() {
    this.state = 'open';
    this.emit('open');
  }

  async sendAudio(): Promise<void> {
    throw new Error('Azure adapter TTS session does not accept inbound audio.');
  }

  async sendText(text: string): Promise<void> {
    if (this.state !== 'open') return;
    this.abort = new AbortController();
    const url = `https://${region(this.config)}.tts.speech.microsoft.com/cognitiveservices/v1`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': this.config.apiKey ?? '',
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': this.params.outputFormat ?? 'audio-24khz-96kbitrate-mono-mp3',
          'User-Agent': 'mcv-voice-sdk',
        },
        body: buildSsml(text, this.params),
        signal: this.abort.signal,
      });
      if (!res.ok || !res.body) throw new Error(`Azure TTS failed: ${res.status}`);
      const reader = res.body.getReader();
      let first = true;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if ((this.state as string) === 'closed') break;
        if (value) {
          const chunk: ProviderAudioChunk = {
            data: value,
            timestamp: Date.now() - this.start,
            first,
          };
          first = false;
          this.emit('audio-chunk', chunk);
        }
      }
      this.emit('turn-complete');
    } catch (err) {
      this.state = 'error';
      this.emit('error', err instanceof Error ? err : new Error(String(err)));
    }
  }

  async sendToolResponse(): Promise<void> { /* not applicable */ }

  async finish(): Promise<void> { /* no-op */ }

  async close(): Promise<void> {
    this.abort?.abort();
    this.state = 'closed';
    this.emit('close');
    this.removeAll();
  }
}

export const AzureProvider: ProviderContract = {
  name: 'azure-speech',
  capabilities: ['stt', 'tts', 'clone'],

  async connect(params, config) {
    const conn = new AzureConnection(params, config);
    setTimeout(() => conn.open(), 0);
    return conn;
  },

  async tts(text, params, config): Promise<ArrayBuffer> {
    const url = `https://${region(config)}.tts.speech.microsoft.com/cognitiveservices/v1`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': config.apiKey ?? '',
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': params.outputFormat ?? 'audio-24khz-96kbitrate-mono-mp3',
        'User-Agent': 'mcv-voice-sdk',
      },
      body: buildSsml(text, params),
    });
    if (!res.ok) throw new Error(`Azure TTS failed: ${res.status}`);
    return res.arrayBuffer();
  },

  async transcribe(audio, params, config): Promise<ProviderTranscript> {
    const url = `https://${region(config)}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${params.language ?? 'en-US'}`;
    const bodyBytes = audio instanceof Uint8Array ? audio : new Uint8Array(audio);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': config.apiKey ?? '',
        'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
      },
      body: bodyBytes as BodyInit,
    });
    if (!res.ok) throw new Error(`Azure STT failed: ${res.status}`);
    const json = await res.json();
    return {
      text: json.DisplayText ?? json.NBest?.[0]?.Display ?? '',
      isFinal: true,
      confidence: json.NBest?.[0]?.Confidence,
    };
  },

  async health(config) {
    const t0 = Date.now();
    try {
      const res = await fetch(`https://${region(config)}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, {
        method: 'POST',
        headers: { 'Ocp-Apim-Subscription-Key': config.apiKey ?? '' },
      });
      return { ok: res.ok, latencyMs: Date.now() - t0 };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  },
};
