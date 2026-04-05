/**
 * Audio Pipeline — Recording + Streaming for Gemini Live API.
 * Extracted from Google AI Studio native-audio-function-call-sandbox.
 *
 * AudioRecorder: Captures microphone at 16kHz, emits base64 PCM16 chunks.
 * AudioStreamer: Plays received PCM16 at 24kHz via scheduled AudioBufferSourceNodes.
 * AudioWorkletRegistry: Manages worklet registration to avoid duplicates.
 */
import EventEmitter from 'eventemitter3';

// ---------------------------------------------------------------------------
// Worklet Sources (inlined as strings for Blob URL creation)
// ---------------------------------------------------------------------------

const AUDIO_RECORDING_WORKLET_SRC = `
class AudioProcessingWorklet extends AudioWorkletProcessor {
  buffer = new Int16Array(2048);
  bufferWriteIndex = 0;

  constructor() {
    super();
    this.hasAudio = false;
  }

  process(inputs) {
    if (inputs[0].length) {
      const channel0 = inputs[0][0];
      this.processChunk(channel0);
    }
    return true;
  }

  sendAndClearBuffer() {
    this.port.postMessage({
      event: "chunk",
      data: { int16arrayBuffer: this.buffer.slice(0, this.bufferWriteIndex).buffer },
    });
    this.bufferWriteIndex = 0;
  }

  processChunk(float32Array) {
    const l = float32Array.length;
    for (let i = 0; i < l; i++) {
      const int16Value = float32Array[i] * 32768;
      this.buffer[this.bufferWriteIndex++] = int16Value;
      if (this.bufferWriteIndex >= this.buffer.length) {
        this.sendAndClearBuffer();
      }
    }
    if (this.bufferWriteIndex >= this.buffer.length) {
      this.sendAndClearBuffer();
    }
  }
}
`;

const VOL_METER_WORKLET_SRC = `
class VolMeter extends AudioWorkletProcessor {
  volume;
  updateIntervalInMS;
  nextUpdateFrame;

  constructor() {
    super();
    this.volume = 0;
    this.updateIntervalInMS = 25;
    this.nextUpdateFrame = this.updateIntervalInMS;
    this.port.onmessage = event => {
      if (event.data.updateIntervalInMS) {
        this.updateIntervalInMS = event.data.updateIntervalInMS;
      }
    };
  }

  get intervalInFrames() {
    return (this.updateIntervalInMS / 1000) * sampleRate;
  }

  process(inputs) {
    const input = inputs[0];
    if (input.length > 0) {
      const samples = input[0];
      let sum = 0;
      for (let i = 0; i < samples.length; ++i) {
        sum += samples[i] * samples[i];
      }
      const rms = Math.sqrt(sum / samples.length);
      this.volume = Math.max(rms, this.volume * 0.7);
      this.nextUpdateFrame -= samples.length;
      if (this.nextUpdateFrame < 0) {
        this.nextUpdateFrame += this.intervalInFrames;
        this.port.postMessage({ volume: this.volume });
      }
    }
    return true;
  }
}
`;

// ---------------------------------------------------------------------------
// Worklet Registry
// ---------------------------------------------------------------------------

export type WorkletGraph = {
  node?: AudioWorkletNode;
  handlers: Array<(this: MessagePort, ev: MessageEvent) => void>;
};

export const registeredWorklets: Map<AudioContext, Record<string, WorkletGraph>> = new Map();

export function createWorkletFromSrc(workletName: string, workletSrc: string): string {
  const script = new Blob(
    [`registerProcessor("${workletName}", ${workletSrc})`],
    { type: 'application/javascript' },
  );
  return URL.createObjectURL(script);
}

// ---------------------------------------------------------------------------
// Audio Context Factory (waits for user interaction if needed)
// ---------------------------------------------------------------------------

type GetAudioContextOptions = AudioContextOptions & { id?: string };

const contextMap: Map<string, AudioContext> = new Map();

export const getAudioContext = (() => {
  const didInteract = new Promise(res => {
    window.addEventListener('pointerdown', res, { once: true });
    window.addEventListener('keydown', res, { once: true });
  });

  return async (options?: GetAudioContextOptions): Promise<AudioContext> => {
    try {
      const a = new Audio();
      a.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
      await a.play();
    } catch {
      await didInteract;
    }
    if (options?.id && contextMap.has(options.id)) return contextMap.get(options.id)!;
    const ctx = new AudioContext(options);
    if (options?.id) contextMap.set(options.id, ctx);
    return ctx;
  };
})();

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return window.btoa(binary);
}

// ---------------------------------------------------------------------------
// AudioRecorder — 16kHz PCM16 mic capture
// ---------------------------------------------------------------------------

export class AudioRecorder {
  private emitter = new EventEmitter();
  public on = this.emitter.on.bind(this.emitter);
  public off = this.emitter.off.bind(this.emitter);

  stream: MediaStream | undefined;
  audioContext: AudioContext | undefined;
  source: MediaStreamAudioSourceNode | undefined;
  recording = false;
  recordingWorklet: AudioWorkletNode | undefined;
  vuWorklet: AudioWorkletNode | undefined;
  private starting: Promise<void> | null = null;

  sampleRate: number;
  constructor(sampleRate = 16000) {
    this.sampleRate = sampleRate;
  }

  async start() {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Could not request user media');

    this.starting = new Promise(async (resolve, _reject) => {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = await getAudioContext({ sampleRate: this.sampleRate });
      this.source = this.audioContext.createMediaStreamSource(this.stream);

      // Recording worklet
      const recName = 'audio-recorder-worklet';
      const recSrc = createWorkletFromSrc(recName, AUDIO_RECORDING_WORKLET_SRC);
      await this.audioContext.audioWorklet.addModule(recSrc);
      this.recordingWorklet = new AudioWorkletNode(this.audioContext, recName);
      this.recordingWorklet.port.onmessage = (ev: MessageEvent) => {
        const ab = ev.data.data?.int16arrayBuffer;
        if (ab) this.emitter.emit('data', arrayBufferToBase64(ab));
      };
      this.source.connect(this.recordingWorklet);

      // VU meter worklet
      const vuName = 'vu-meter';
      await this.audioContext.audioWorklet.addModule(createWorkletFromSrc(vuName, VOL_METER_WORKLET_SRC));
      this.vuWorklet = new AudioWorkletNode(this.audioContext, vuName);
      this.vuWorklet.port.onmessage = (ev: MessageEvent) => this.emitter.emit('volume', ev.data.volume);
      this.source.connect(this.vuWorklet);

      this.recording = true;
      resolve();
      this.starting = null;
    });
  }

  stop() {
    const doStop = () => {
      this.source?.disconnect();
      this.stream?.getTracks().forEach(track => track.stop());
      this.stream = undefined;
      this.recordingWorklet = undefined;
      this.vuWorklet = undefined;
      this.recording = false;
    };
    if (this.starting) { this.starting.then(doStop); return; }
    doStop();
  }
}

// ---------------------------------------------------------------------------
// AudioStreamer — 24kHz PCM16 playback via scheduled buffers
// ---------------------------------------------------------------------------

export class AudioStreamer {
  private bufferSize = 7680;
  private audioQueue: Float32Array[] = [];
  private isPlaying = false;
  private isStreamComplete = false;
  private checkInterval: number | null = null;
  private scheduledTime = 0;
  private initialBufferTime = 0.1;
  public gainNode: GainNode;
  public source: AudioBufferSourceNode;
  private endOfQueueAudioSource: AudioBufferSourceNode | null = null;
  public onComplete = () => {};
  private sampleRate: number;
  context: AudioContext;

  constructor(context: AudioContext, sampleRate = 24000) {
    this.context = context;
    this.sampleRate = sampleRate;
    this.gainNode = this.context.createGain();
    this.source = this.context.createBufferSource();
    this.gainNode.connect(this.context.destination);
    this.addPCM16 = this.addPCM16.bind(this);
  }

  async addWorklet<T extends (d: any) => void>(workletName: string, workletSrc: string, handler: T): Promise<this> {
    let record = registeredWorklets.get(this.context);
    if (record?.[workletName]) { record[workletName].handlers.push(handler); return this; }
    if (!record) { registeredWorklets.set(this.context, {}); record = registeredWorklets.get(this.context)!; }
    record[workletName] = { handlers: [handler] };
    const src = createWorkletFromSrc(workletName, workletSrc);
    await this.context.audioWorklet.addModule(src);
    const worklet = new AudioWorkletNode(this.context, workletName);
    record[workletName].node = worklet;
    return this;
  }

  private processPCM16Chunk(chunk: Uint8Array): Float32Array {
    const float32 = new Float32Array(chunk.length / 2);
    const view = new DataView(chunk.buffer);
    for (let i = 0; i < chunk.length / 2; i++) {
      try { float32[i] = view.getInt16(i * 2, true) / 32768; } catch { /* skip */ }
    }
    return float32;
  }

  addPCM16(chunk: Uint8Array) {
    this.isStreamComplete = false;
    let buf = this.processPCM16Chunk(chunk);
    while (buf.length >= this.bufferSize) {
      this.audioQueue.push(buf.slice(0, this.bufferSize));
      buf = buf.slice(this.bufferSize);
    }
    if (buf.length > 0) this.audioQueue.push(buf);
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.scheduledTime = this.context.currentTime + this.initialBufferTime;
      this.scheduleNextBuffer();
    }
  }

  private createAudioBuffer(data: Float32Array): AudioBuffer {
    const ab = this.context.createBuffer(1, data.length, this.sampleRate);
    ab.getChannelData(0).set(data);
    return ab;
  }

  private scheduleNextBuffer() {
    const AHEAD = 0.2;
    while (this.audioQueue.length > 0 && this.scheduledTime < this.context.currentTime + AHEAD) {
      const data = this.audioQueue.shift()!;
      const ab = this.createAudioBuffer(data);
      const src = this.context.createBufferSource();

      if (this.audioQueue.length === 0) {
        if (this.endOfQueueAudioSource) this.endOfQueueAudioSource.onended = null;
        this.endOfQueueAudioSource = src;
        src.onended = () => {
          if (!this.audioQueue.length && this.endOfQueueAudioSource === src) {
            this.endOfQueueAudioSource = null;
            this.onComplete();
          }
        };
      }

      src.buffer = ab;
      src.connect(this.gainNode);

      const worklets = registeredWorklets.get(this.context);
      if (worklets) {
        Object.entries(worklets).forEach(([_name, graph]) => {
          if (graph.node) {
            src.connect(graph.node);
            graph.node.port.onmessage = (ev: MessageEvent) => graph.handlers.forEach(h => h.call(graph.node!.port, ev));
            graph.node.connect(this.context.destination);
          }
        });
      }

      const startTime = Math.max(this.scheduledTime, this.context.currentTime);
      src.start(startTime);
      this.scheduledTime = startTime + ab.duration;
    }

    if (this.audioQueue.length === 0) {
      if (this.isStreamComplete) {
        this.isPlaying = false;
        if (this.checkInterval) { clearInterval(this.checkInterval); this.checkInterval = null; }
      } else if (!this.checkInterval) {
        this.checkInterval = window.setInterval(() => {
          if (this.audioQueue.length > 0) this.scheduleNextBuffer();
        }, 100) as unknown as number;
      }
    } else {
      const nextCheck = (this.scheduledTime - this.context.currentTime) * 1000;
      setTimeout(() => this.scheduleNextBuffer(), Math.max(0, nextCheck - 50));
    }
  }

  stop() {
    this.isPlaying = false;
    this.isStreamComplete = true;
    this.audioQueue = [];
    this.scheduledTime = this.context.currentTime;
    if (this.checkInterval) { clearInterval(this.checkInterval); this.checkInterval = null; }
    this.gainNode.gain.linearRampToValueAtTime(0, this.context.currentTime + 0.1);
    setTimeout(() => {
      this.gainNode.disconnect();
      this.gainNode = this.context.createGain();
      this.gainNode.connect(this.context.destination);
    }, 200);
  }

  async resume() {
    if (this.context.state === 'suspended') await this.context.resume();
    this.isStreamComplete = false;
    this.scheduledTime = this.context.currentTime + this.initialBufferTime;
    this.gainNode.gain.setValueAtTime(1, this.context.currentTime);
  }

  complete() {
    this.isStreamComplete = true;
    this.onComplete();
  }
}

// Re-export worklet sources for use in hooks
export { AUDIO_RECORDING_WORKLET_SRC, VOL_METER_WORKLET_SRC };
