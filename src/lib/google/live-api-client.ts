/**
 * Gemini Live API Client — Bidirectional streaming for voice + function calling.
 * Extracted from Google AI Studio native-audio-function-call-sandbox.
 * Wraps @google/genai Live API with EventEmitter3 for reactive event handling.
 */
import {
  GoogleGenAI,
  LiveClientToolResponse,
  LiveServerMessage,
  Session,
} from '@google/genai';
import type {
  LiveCallbacks,
  LiveConnectConfig,
  LiveServerContent,
  LiveServerToolCall,
  LiveServerToolCallCancellation,
  Part,
} from '@google/genai';
import EventEmitter from 'eventemitter3';
import { difference } from 'lodash';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StreamingLog {
  count?: number;
  data?: unknown;
  date: Date;
  message: string | object;
  type: string;
}

export interface LiveClientEventTypes {
  audio: (data: ArrayBuffer) => void;
  close: (event: CloseEvent) => void;
  content: (data: LiveServerContent) => void;
  error: (e: ErrorEvent) => void;
  interrupted: () => void;
  log: (log: StreamingLog) => void;
  open: () => void;
  setupcomplete: () => void;
  toolcall: (toolCall: LiveServerToolCall) => void;
  toolcallcancellation: (cancellation: LiveServerToolCallCancellation) => void;
  turncomplete: () => void;
  inputTranscription: (text: string, isFinal: boolean) => void;
  outputTranscription: (text: string, isFinal: boolean) => void;
}

export type LiveClientStatus = 'connected' | 'disconnected' | 'connecting';

// Models
export const LIVE_API_MODELS = {
  NATIVE_AUDIO: 'gemini-2.5-flash-native-audio-preview-09-2025',
  FLASH: 'gemini-2.5-flash',
} as const;

export const DEFAULT_LIVE_API_MODEL = LIVE_API_MODELS.NATIVE_AUDIO;

export const AVAILABLE_VOICES = [
  'Zephyr', 'Puck', 'Charon', 'Luna', 'Nova', 'Kore', 'Fenrir', 'Leda',
  'Orus', 'Aoede', 'Callirrhoe', 'Autonoe', 'Enceladus', 'Iapetus',
  'Umbriel', 'Algieba', 'Despina', 'Erinome', 'Algenib', 'Rasalgethi',
  'Laomedeia', 'Achernar', 'Alnilam', 'Schedar', 'Gacrux', 'Pulcherrima',
  'Achird', 'Zubenelgenubi', 'Vindemiatrix', 'Sadachbia', 'Sadaltager', 'Sulafat',
] as const;

export const DEFAULT_VOICE = 'Zephyr';

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export class GenAILiveClient extends EventEmitter<LiveClientEventTypes> {
  public readonly model: string;
  protected readonly client: GoogleGenAI;
  protected session?: Session;
  private _status: LiveClientStatus = 'disconnected';

  public get status(): LiveClientStatus {
    return this._status;
  }

  constructor(apiKey: string, model?: string) {
    super();
    this.model = model || DEFAULT_LIVE_API_MODEL;
    this.client = new GoogleGenAI({ apiKey });
  }

  async connect(config: LiveConnectConfig): Promise<boolean> {
    if (this._status === 'connected' || this._status === 'connecting') return false;
    this._status = 'connecting';

    const callbacks: LiveCallbacks = {
      onopen: this.onOpen.bind(this),
      onmessage: this.onMessage.bind(this),
      onerror: this.onError.bind(this),
      onclose: this.onClose.bind(this),
    };

    try {
      this.session = await this.client.live.connect({
        model: this.model,
        config: { ...config },
        callbacks,
      });
    } catch (e: any) {
      console.error('Error connecting to GenAI Live:', e);
      this._status = 'disconnected';
      this.session = undefined;
      this.onError(new ErrorEvent('error', { error: e, message: e?.message || 'Failed to connect.' }));
      return false;
    }

    this._status = 'connected';
    return true;
  }

  disconnect(): boolean {
    this.session?.close();
    this.session = undefined;
    this._status = 'disconnected';
    this.log('client.close', 'Disconnected');
    return true;
  }

  send(parts: Part | Part[], turnComplete = true) {
    if (this._status !== 'connected' || !this.session) {
      this.emit('error', new ErrorEvent('Client is not connected'));
      return;
    }
    this.session.sendClientContent({ turns: parts, turnComplete });
    this.log('client.send', parts);
  }

  sendRealtimeInput(chunks: Array<{ mimeType: string; data: string }>) {
    if (this._status !== 'connected' || !this.session) {
      this.emit('error', new ErrorEvent('Client is not connected'));
      return;
    }
    chunks.forEach(chunk => this.session!.sendRealtimeInput({ media: chunk }));

    let hasAudio = false, hasVideo = false;
    for (const ch of chunks) {
      if (ch.mimeType.includes('audio')) hasAudio = true;
      if (ch.mimeType.includes('image')) hasVideo = true;
      if (hasAudio && hasVideo) break;
    }
    const label = hasAudio && hasVideo ? 'audio + video' : hasAudio ? 'audio' : hasVideo ? 'video' : 'unknown';
    this.log('client.realtimeInput', label);
  }

  sendToolResponse(toolResponse: LiveClientToolResponse) {
    if (this._status !== 'connected' || !this.session) {
      this.emit('error', new ErrorEvent('Client is not connected'));
      return;
    }
    if (toolResponse.functionResponses?.length) {
      this.session.sendToolResponse({ functionResponses: toolResponse.functionResponses });
    }
    this.log('client.toolResponse', { toolResponse });
  }

  // ── Message dispatch ─────────────────────────────────────────────────

  protected onMessage(message: LiveServerMessage) {
    if (message.setupComplete) { this.emit('setupcomplete'); return; }
    if (message.toolCall) { this.log('server.toolCall', message); this.emit('toolcall', message.toolCall); return; }
    if (message.toolCallCancellation) { this.log('receive.toolCallCancellation', message); this.emit('toolcallcancellation', message.toolCallCancellation); return; }

    if (message.serverContent) {
      const { serverContent } = message;

      if (serverContent.interrupted) { this.log('receive.serverContent', 'interrupted'); this.emit('interrupted'); return; }

      if (serverContent.inputTranscription) {
        this.emit('inputTranscription', serverContent.inputTranscription.text ?? '', (serverContent.inputTranscription as any).isFinal ?? false);
        this.log('server.inputTranscription', serverContent.inputTranscription.text ?? '');
      }

      if (serverContent.outputTranscription) {
        this.emit('outputTranscription', serverContent.outputTranscription.text ?? '', (serverContent.outputTranscription as any).isFinal ?? false);
        this.log('server.outputTranscription', serverContent.outputTranscription.text ?? '');
      }

      if (serverContent.modelTurn) {
        const parts: Part[] = serverContent.modelTurn.parts || [];
        const audioParts = parts.filter(p => p.inlineData?.mimeType?.startsWith('audio/pcm'));
        const base64s = audioParts.map(p => p.inlineData?.data);
        const otherParts = difference(parts, audioParts);

        base64s.forEach(b64 => {
          if (b64) {
            const data = base64ToArrayBuffer(b64);
            this.emit('audio', data);
            this.log('server.audio', `buffer (${data.byteLength})`);
          }
        });

        if (otherParts.length > 0) {
          this.emit('content', { modelTurn: { parts: otherParts } });
          this.log('server.content', message);
        }
      }

      if (serverContent.turnComplete) {
        this.log('server.send', 'turnComplete');
        this.emit('turncomplete');
      }
    }
  }

  protected onError(e: ErrorEvent) {
    this._status = 'disconnected';
    console.error('error:', e);
    this.log(`server.${e.type}`, `Could not connect to GenAI Live: ${e.message}`);
    this.emit('error', e);
  }

  protected onOpen() {
    this._status = 'connected';
    this.emit('open');
  }

  protected onClose(e: CloseEvent) {
    this._status = 'disconnected';
    let reason = e.reason || '';
    if (reason.toLowerCase().includes('error')) {
      const idx = reason.indexOf('ERROR]');
      if (idx > 0) reason = reason.slice(idx + 7);
    }
    this.log(`server.${e.type}`, `disconnected ${reason ? `with reason: ${reason}` : ''}`);
    this.emit('close', e);
  }

  protected log(type: string, message: string | object) {
    this.emit('log', { type, message, date: new Date() });
  }
}
