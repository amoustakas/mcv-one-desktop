// @mcv/voice-sdk — VoiceSession
//
// Thin state machine over a ProviderConnection (or pair of connections in
// composite mode). Exposes a consistent set of events to UI layers so the
// same VoiceDock component works with ANY provider.
//
// States:
//   idle → connecting → listening → thinking → speaking → listening → ...
//   any state → closed (via close())
//   any state → error (terminal until re-open)

import type {
  ProviderConnection,
  ProviderAudioChunk,
  ProviderTranscript,
  ProviderToolCall,
  ProviderName,
} from '../providers/ProviderContract';
import { TinyEmitter } from '../providers/ProviderContract';

export type SessionState =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'closed'
  | 'error';

export interface VoiceSessionOptions {
  /** Primary connection (realtime provider or TTS side of composite). */
  primary: ProviderConnection;
  /** Optional STT connection — when set, session is composite. */
  stt?: ProviderConnection;
  /** Provider that won routing, for telemetry. */
  resolvedProvider: ProviderName;
  /** True if fallback fired. */
  degraded?: boolean;
}

export class VoiceSession extends TinyEmitter {
  state: SessionState = 'idle';
  readonly resolvedProvider: ProviderName;
  readonly degraded: boolean;
  private primary: ProviderConnection;
  private stt?: ProviderConnection;
  private firstAudioAt?: number;
  private openedAt?: number;
  private unsub: Array<() => void> = [];

  constructor(opts: VoiceSessionOptions) {
    super();
    this.primary = opts.primary;
    this.stt = opts.stt;
    this.resolvedProvider = opts.resolvedProvider;
    this.degraded = !!opts.degraded;
    this.wire();
    if (this.primary.state === 'open') {
      this.transition('listening');
    } else {
      this.transition('connecting');
    }
  }

  /** Metrics: how many ms from open to first audio byte. */
  get firstAudioLatencyMs(): number | undefined {
    if (this.openedAt == null || this.firstAudioAt == null) return undefined;
    return this.firstAudioAt - this.openedAt;
  }

  private transition(next: SessionState) {
    if (this.state === next) return;
    this.state = next;
    this.emit('state', next);
  }

  private wire() {
    this.unsub.push(
      this.primary.on('open', () => {
        this.openedAt = Date.now();
        this.transition('listening');
      }),
    );
    this.unsub.push(
      this.primary.on('audio-chunk', (chunk: ProviderAudioChunk) => {
        if (chunk.first && this.firstAudioAt == null) {
          this.firstAudioAt = Date.now();
        }
        this.transition('speaking');
        this.emit('audio-chunk', chunk);
      }),
    );
    this.unsub.push(
      this.primary.on('turn-complete', () => {
        this.emit('turn-complete');
        this.transition('listening');
      }),
    );
    this.unsub.push(
      this.primary.on('tool-call', (tc: ProviderToolCall) => {
        this.transition('thinking');
        this.emit('tool-call', tc);
      }),
    );
    this.unsub.push(
      this.primary.on('error', (err: Error) => {
        this.transition('error');
        this.emit('error', err);
      }),
    );
    this.unsub.push(
      this.primary.on('close', () => {
        this.transition('closed');
        this.emit('close');
      }),
    );

    // Composite: STT side feeds transcripts.
    if (this.stt) {
      this.unsub.push(
        this.stt.on('transcript-partial', (t: ProviderTranscript) => this.emit('transcript-partial', t)),
      );
      this.unsub.push(
        this.stt.on('transcript-final', (t: ProviderTranscript) => this.emit('transcript-final', t)),
      );
      this.unsub.push(
        this.stt.on('error', (err: Error) => {
          this.emit('error', err);
        }),
      );
    } else {
      // Single-provider (realtime) path — primary emits transcripts too.
      this.unsub.push(
        this.primary.on('transcript-partial', (t: ProviderTranscript) => this.emit('transcript-partial', t)),
      );
      this.unsub.push(
        this.primary.on('transcript-final', (t: ProviderTranscript) => this.emit('transcript-final', t)),
      );
    }
  }

  /** Push mic audio into STT (composite) or primary (realtime). */
  sendAudio(data: ArrayBuffer | Uint8Array): void {
    if (this.stt) {
      this.stt.sendAudio(data);
    } else {
      this.primary.sendAudio(data);
    }
  }

  /** Send a text turn (triggers TTS/realtime response). */
  sendText(text: string): void {
    this.transition('thinking');
    this.primary.sendText(text);
  }

  sendToolResponse(id: string, result: unknown): void {
    this.primary.sendToolResponse(id, result);
  }

  async close(): Promise<void> {
    for (const fn of this.unsub.splice(0)) fn();
    try { await this.primary.close(); } catch { /* ignore */ }
    if (this.stt) {
      try { await this.stt.close(); } catch { /* ignore */ }
    }
    this.transition('closed');
    this.removeAll();
  }
}
