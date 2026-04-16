// @mcv/voice-sdk — ProviderContract
//
// Every voice provider (ElevenLabs, Gemini Live, Vapi, OpenAI Realtime,
// Deepgram, Azure Speech, xAI Grok, etc.) implements this SAME interface.
// The VoiceRouter composes providers declaratively; there are NO hardcoded
// provider names in the router. Adding a new provider = one new file
// implementing ProviderContract + a registry entry.
//
// Design principle: the router and the session machine never know which
// provider they're talking to. Whether a session uses Gemini Live for
// full-duplex or Deepgram STT + ElevenLabs TTS composite, both sides
// expose the same stream/connect/close/emit surface.

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Identifies the capability a provider implements. A single provider may
 * implement multiple (e.g. Gemini Live = 'stt' + 'tts' + 'realtime'; Deepgram
 * = 'stt' only; Vapi = 'phone' only).
 */
export type ProviderCapability =
  | 'stt'       // speech-to-text
  | 'tts'       // text-to-speech
  | 'realtime'  // full-duplex voice-to-voice (Gemini Live, OpenAI Realtime)
  | 'phone'     // PSTN/SIP (Vapi)
  | 'clone';    // voice cloning (ElevenLabs, Azure custom)

/** Canonical names used in configuration and telemetry. */
export type ProviderName =
  | 'elevenlabs'
  | 'gemini-live'
  | 'vapi'
  | 'openai-realtime'
  | 'deepgram'
  | 'azure-speech'
  | 'xai-grok';

export interface ProviderConfig {
  apiKey?: string;
  /** Provider-specific base URL override (self-hosted proxies, Azure region). */
  baseUrl?: string;
  /** Optional region hint (e.g. "us-west-2" for Azure). */
  region?: string;
  /** Extra options passed straight to the underlying SDK. */
  options?: Record<string, unknown>;
}

/**
 * Normalized parameters accepted by every provider. Concrete providers map
 * these onto their native knobs inside `connect()` / `stream()`. Anything
 * provider-specific lives on `raw`.
 */
export interface VoiceSessionParams {
  /** Prompt / system instruction for the LLM-driven providers. */
  systemPrompt?: string;
  /** Preferred voice id (ElevenLabs voice_id, Gemini voiceName, Vapi voice). */
  voiceId?: string;
  /** Model override (eleven_flash_v2_5, nova-3, gpt-realtime, etc.). */
  model?: string;
  /** Language BCP-47 code. */
  language?: string;
  /** 0..1 — low = more monotone, high = more expressive. */
  stability?: number;
  /** 0..1 — closer to voice clone vs. generic. */
  similarity?: number;
  /** Higher = more expressive (ElevenLabs style weight). */
  style?: number;
  /** Words per minute nudge; providers approximate. */
  paceWpm?: number;
  /** 0..2 — 1.0 = neutral, <1 deeper, >1 higher. */
  pitch?: number;
  /** Tool / function declarations (Gemini Live + OpenAI Realtime). */
  tools?: Array<Record<string, unknown>>;
  /** Output audio format ('mp3_44100_128', 'pcm16_24000', 'opus', etc.). */
  outputFormat?: string;
  /** Enable barge-in / VAD. */
  interruptible?: boolean;
  /** Provider-specific escape hatch. */
  raw?: Record<string, unknown>;
}

/** Event names emitted by any provider session. */
export type ProviderEvent =
  | 'open'
  | 'audio-chunk'          // binary audio back to caller
  | 'transcript-partial'   // interim STT
  | 'transcript-final'     // final STT segment
  | 'tool-call'            // model wants to call a tool
  | 'turn-complete'        // model finished a response turn
  | 'error'
  | 'close';

export interface ProviderAudioChunk {
  /** Raw audio bytes. Format = session.outputFormat. */
  data: ArrayBuffer | Uint8Array;
  /** Milliseconds since session open. */
  timestamp: number;
  /** True once the provider has emitted its first audio byte. */
  first?: boolean;
}

export interface ProviderTranscript {
  text: string;
  isFinal: boolean;
  confidence?: number;
  words?: Array<{ word: string; start: number; end: number }>;
}

export interface ProviderToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

/**
 * The connection handle returned by `connect()`. Minimal surface — every
 * provider agrees on this. Callers subscribe via `on()` and push audio/text
 * via `send*()`.
 */
export interface ProviderConnection {
  /** Provider that created this connection. */
  readonly provider: ProviderName;
  /** Session id assigned by the provider (if any). */
  readonly sessionId?: string;
  /** Open / closed / errored. */
  readonly state: 'connecting' | 'open' | 'closed' | 'error';

  /** Send a PCM / opus audio chunk (16-bit mono 16k unless overridden). */
  sendAudio(data: ArrayBuffer | Uint8Array): Promise<void> | void;
  /** Send a text message (triggers model turn on realtime providers). */
  sendText(text: string): Promise<void> | void;
  /** Send a tool-call response (realtime providers). */
  sendToolResponse(id: string, result: unknown): Promise<void> | void;
  /** Signal end-of-input / graceful flush. */
  finish?(): Promise<void> | void;
  /** Close the connection. */
  close(): Promise<void> | void;

  /** Subscribe to events. Returns an unsubscribe fn. */
  on(event: 'audio-chunk', cb: (chunk: ProviderAudioChunk) => void): () => void;
  on(event: 'transcript-partial' | 'transcript-final', cb: (t: ProviderTranscript) => void): () => void;
  on(event: 'tool-call', cb: (tc: ProviderToolCall) => void): () => void;
  on(event: 'open' | 'turn-complete' | 'close', cb: () => void): () => void;
  on(event: 'error', cb: (err: Error) => void): () => void;
}

/**
 * Every provider module exports an object implementing this contract. The
 * router never imports a provider directly — it resolves one from the
 * registry by ProviderName.
 */
export interface ProviderContract {
  readonly name: ProviderName;
  readonly capabilities: ReadonlyArray<ProviderCapability>;

  /** Open a streaming session. Returns immediately; listen via connection.on(). */
  connect(params: VoiceSessionParams, config: ProviderConfig): Promise<ProviderConnection>;

  /**
   * One-shot (non-streaming) TTS. Returns raw audio bytes. Optional — only
   * providers with a TTS capability need implement it.
   */
  tts?(text: string, params: VoiceSessionParams, config: ProviderConfig): Promise<ArrayBuffer>;

  /**
   * One-shot transcription of a recorded clip. Optional — only STT-capable
   * providers implement this.
   */
  transcribe?(audio: ArrayBuffer | Uint8Array, params: VoiceSessionParams, config: ProviderConfig): Promise<ProviderTranscript>;

  /** Cheap health probe the router uses before committing to a provider. */
  health?(config: ProviderConfig): Promise<{ ok: boolean; latencyMs?: number; error?: string }>;
}

/**
 * Minimal EventEmitter shim that works in Node and browser. Provider
 * adapters build on top of it to avoid pulling in eventemitter3 at the SDK
 * boundary (the SDK is `private: true` — we don't want external deps until
 * we publish).
 */
export class TinyEmitter {
  private listeners = new Map<string, Set<(...args: any[]) => void>>();

  on(event: string, cb: (...args: any[]) => void): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(cb);
    return () => this.listeners.get(event)?.delete(cb);
  }

  emit(event: string, ...args: any[]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const cb of set) {
      try { cb(...args); } catch { /* isolate listener errors */ }
    }
  }

  removeAll(): void { this.listeners.clear(); }
}
