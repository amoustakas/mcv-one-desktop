/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

// Helper for audio Blob creation (PCM 16-bit, 16kHz)
function createPcmBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  let binary = '';
  const len = int16.buffer.byteLength;
  const bytes = new Uint8Array(int16.buffer);
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return {
    data: btoa(binary),
    mimeType: 'audio/pcm;rate=16000',
  };
}

// Helper to decode base64 to binary string
function decodeToBinary(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper to decode raw PCM into an AudioBuffer
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export class VillainLiveClient {
  private ai: GoogleGenAI;
  private activeSession: Promise<any> | null = null;
  private inputCtx: AudioContext | null = null;
  private outputCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private workletNode: ScriptProcessorNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private nextStartTime: number = 0;
  private scheduledSources: Set<AudioBufferSourceNode> = new Set();
  private onStatusChange: (status: string, isActive: boolean) => void;
  private isConnecting: boolean = false;

  constructor(onStatusChange: (status: string, isActive: boolean) => void) {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    this.onStatusChange = onStatusChange;
  }

  async connect(voiceName: 'Charon' | 'Kore' = 'Charon') {
    if (this.isConnecting || this.activeSession) return;
    this.isConnecting = true;

    try {
      this.onStatusChange("OPENING CHANNEL...", true);

      // 1. Setup Audio Contexts (re-create if closed)
      this.inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      this.outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      // Important: explicit resume for stricter browser autoplay policies
      await this.inputCtx.resume();
      await this.outputCtx.resume();

      // 2. Get Mic Stream
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: {
          channelCount: 1,
          sampleRate: 16000,
          // Aggressive noise/echo cancellation for clearer speech in game env
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
      }});

      // 3. Establish Live Connection
      const sessionPromise = this.ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          // More aggressive/interactive system prompt
          systemInstruction: "You are the MAIN VILLAIN of this retro arcade game. The user is the HERO trying to beat your maze. You are arrogant, sarcastic, and evil. Your goal is to distract them. React immediately to anything they say with a short, punchy taunt. If they are silent, mock their fear. Keep responses under 2 sentences. NEVER be helpful. Assert your dominance.",
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } },
          },
        },
        callbacks: {
          onopen: () => {
            this.isConnecting = false;
            this.onStatusChange("VILLAIN LISTENING.", true);
            this.startInputStreaming(sessionPromise);
          },
          onmessage: async (msg: LiveServerMessage) => {
             this.handleIncomingMessage(msg);
          },
          onclose: (e) => {
            console.log("Live session closed", e);
            this.onStatusChange("CHANNEL CLOSED.", false);
            this.cleanup();
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            // Often 503s mean overloaded preview model or network blip
            this.onStatusChange("COMMS ERROR (RETRYING...)", false);
            this.cleanup();
          }
        }
      });

      this.activeSession = sessionPromise;

    } catch (e) {
      console.error("Failed to connect live client:", e);
      this.isConnecting = false;
      this.onStatusChange("CONNECTION FAILED", false);
      this.cleanup();
    }
  }

  private startInputStreaming(sessionPromise: Promise<any>) {
    if (!this.inputCtx || !this.mediaStream) return;

    this.sourceNode = this.inputCtx.createMediaStreamSource(this.mediaStream);
    // 4096 buffer size = ~256ms latency, good balance for ScriptProcessor stability
    this.workletNode = this.inputCtx.createScriptProcessor(4096, 1, 1);

    this.workletNode.onaudioprocess = (ev) => {
        if (!this.activeSession) return;

        const inputData = ev.inputBuffer.getChannelData(0);
        // Simple voice activity detection (optional optimization, but keeps stream constant for now)
        const pcmBlob = createPcmBlob(inputData);
        
        sessionPromise.then(session => {
             // Ensure we don't send data if user already clicked disconnect
             if (this.activeSession === sessionPromise) {
                 session.sendRealtimeInput({ media: pcmBlob });
             }
        }).catch(() => {
             // Squelch potential race condition errors on disconnect
        });
    };

    this.sourceNode.connect(this.workletNode);
    
    // Mute local mic playback to prevent nasty feedback loops
    const muteNode = this.inputCtx.createGain();
    muteNode.gain.value = 0;
    this.workletNode.connect(muteNode);
    muteNode.connect(this.inputCtx.destination);
  }

  private async handleIncomingMessage(message: LiveServerMessage) {
    if (!this.outputCtx) return;

    if (this.outputCtx.state === 'suspended') {
       await this.outputCtx.resume();
    }

    const part = message.serverContent?.modelTurn?.parts?.[0];
    if (part?.inlineData?.data) {
        try {
            const pcmData = decodeToBinary(part.inlineData.data);
            const audioBuffer = await decodeAudioData(pcmData, this.outputCtx);

            // Ensure smooth playback by scheduling next chunk at the end of previous
            this.nextStartTime = Math.max(this.nextStartTime, this.outputCtx.currentTime);

            const source = this.outputCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.outputCtx.destination);
            source.start(this.nextStartTime);
            
            this.nextStartTime += audioBuffer.duration;
            
            this.scheduledSources.add(source);
            source.onended = () => {
                this.scheduledSources.delete(source);
            };
        } catch (e) {
            console.error("Error decoding output audio:", e);
        }
    }

    // Handle interruption (user speaks over model)
    if (message.serverContent?.interrupted) {
        this.scheduledSources.forEach(s => {
            try { s.stop(); } catch (e) {}
        });
        this.scheduledSources.clear();
        this.nextStartTime = this.outputCtx.currentTime;
    }
  }

  disconnect() {
    // Trigger cleanup, which will also close standard WebSockets if SDK uses them internally
    // The SDK doesn't expose an explicit .close() on the session promise result easily,
    // but releasing all media/contexts usually forces a close from the browser side.
    this.cleanup();
    this.onStatusChange("", false);
  }

  private cleanup() {
    this.activeSession = null;
    this.isConnecting = false;

    this.scheduledSources.forEach(s => {
        try { s.stop(); } catch(e) {}
    });
    this.scheduledSources.clear();
    
    if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(t => t.stop());
        this.mediaStream = null;
    }
    if (this.sourceNode) {
        try { this.sourceNode.disconnect(); } catch(e) {}
        this.sourceNode = null;
    }
    if (this.workletNode) {
        try { this.workletNode.disconnect(); } catch(e) {}
        this.workletNode = null;
    }
    if (this.inputCtx) {
        try { this.inputCtx.close(); } catch(e) {}
        this.inputCtx = null;
    }
    if (this.outputCtx) {
        try { this.outputCtx.close(); } catch(e) {}
        this.outputCtx = null;
    }
  }
}
