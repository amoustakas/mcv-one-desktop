/**
 * useLiveAudio — React hook wrapping Gemini Live API + audio pipeline.
 * Provides a complete voice conversation interface: connect, record, transcript.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { GenAILiveClient, DEFAULT_VOICE } from '../lib/google/live-api-client';
import { AudioRecorder, AudioStreamer, getAudioContext, VOL_METER_WORKLET_SRC } from '../lib/google/audio-pipeline';
import { Modality } from '@google/genai';
import type { LiveConnectConfig, LiveServerToolCall } from '@google/genai';

export interface UseLiveAudioConfig {
  apiKey: string;
  voiceName?: string;
  model?: string;
  systemPrompt?: string;
  tools?: any[];
  onTranscript?: (text: string, isInput: boolean) => void;
  onToolCall?: (call: LiveServerToolCall) => void;
  onLog?: (type: string, message: string | object) => void;
}

export interface UseLiveAudioReturn {
  isConnected: boolean;
  isRecording: boolean;
  status: 'disconnected' | 'connecting' | 'connected';
  inputVolume: number;
  outputVolume: number;
  transcript: Array<{ text: string; isInput: boolean; timestamp: Date }>;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  sendText: (text: string) => void;
  sendToolResponse: (id: string, name: string, response: any) => void;
}

export function useLiveAudio(config: UseLiveAudioConfig): UseLiveAudioReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [inputVolume, setInputVolume] = useState(0);
  const [outputVolume, setOutputVolume] = useState(0);
  const [transcript, setTranscript] = useState<Array<{ text: string; isInput: boolean; timestamp: Date }>>([]);

  const clientRef = useRef<GenAILiveClient | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const streamerRef = useRef<AudioStreamer | null>(null);

  // Cleanup on unmount
  useEffect(() => () => {
    recorderRef.current?.stop();
    streamerRef.current?.stop();
    clientRef.current?.disconnect();
  }, []);

  const connect = useCallback(async (): Promise<boolean> => {
    if (clientRef.current?.status === 'connected') return true;
    setStatus('connecting');

    const client = new GenAILiveClient(config.apiKey, config.model);
    clientRef.current = client;

    // Set up audio output
    const outputCtx = await getAudioContext({ sampleRate: 24000, id: 'live-output' });
    const streamer = new AudioStreamer(outputCtx, 24000);
    streamerRef.current = streamer;

    // Output volume meter
    await streamer.addWorklet('output-vu', VOL_METER_WORKLET_SRC, (ev: MessageEvent) => {
      setOutputVolume(ev.data.volume ?? 0);
    });

    // Wire events
    client.on('audio', (data: ArrayBuffer) => {
      streamer.addPCM16(new Uint8Array(data));
    });

    client.on('interrupted', () => {
      streamer.stop();
      streamer.resume();
    });

    client.on('inputTranscription', (text) => {
      const entry = { text, isInput: true, timestamp: new Date() };
      setTranscript(prev => [...prev, entry]);
      config.onTranscript?.(text, true);
    });

    client.on('outputTranscription', (text) => {
      const entry = { text, isInput: false, timestamp: new Date() };
      setTranscript(prev => [...prev, entry]);
      config.onTranscript?.(text, false);
    });

    client.on('toolcall', (call) => config.onToolCall?.(call));
    client.on('log', (log) => config.onLog?.(log.type, log.message));
    client.on('close', () => { setIsConnected(false); setStatus('disconnected'); });
    client.on('error', () => { setIsConnected(false); setStatus('disconnected'); });

    const liveConfig: LiveConnectConfig = {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: config.voiceName || DEFAULT_VOICE } } },
      inputAudioTranscription: {},
      outputAudioTranscription: {},
    };
    if (config.systemPrompt) (liveConfig as any).systemInstruction = { parts: [{ text: config.systemPrompt }] };
    if (config.tools?.length) (liveConfig as any).tools = config.tools;

    const ok = await client.connect(liveConfig);
    if (ok) {
      setIsConnected(true);
      setStatus('connected');
      await streamer.resume();
    } else {
      setStatus('disconnected');
    }
    return ok;
  }, [config.apiKey, config.model, config.voiceName, config.systemPrompt, config.tools]);

  const disconnect = useCallback(() => {
    recorderRef.current?.stop();
    streamerRef.current?.stop();
    clientRef.current?.disconnect();
    setIsConnected(false);
    setIsRecording(false);
    setStatus('disconnected');
  }, []);

  const startRecording = useCallback(async () => {
    if (!clientRef.current || clientRef.current.status !== 'connected') return;
    const recorder = new AudioRecorder(16000);
    recorderRef.current = recorder;

    recorder.on('data', (b64: string) => {
      clientRef.current?.sendRealtimeInput([{ mimeType: 'audio/pcm;rate=16000', data: b64 }]);
    });
    recorder.on('volume', (v: number) => setInputVolume(v));

    await recorder.start();
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setIsRecording(false);
    setInputVolume(0);
  }, []);

  const sendText = useCallback((text: string) => {
    clientRef.current?.send([{ text }]);
  }, []);

  const sendToolResponse = useCallback((id: string, name: string, response: any) => {
    clientRef.current?.sendToolResponse({
      functionResponses: [{ id, name, response }],
    });
  }, []);

  return {
    isConnected, isRecording, status, inputVolume, outputVolume, transcript,
    connect, disconnect, startRecording, stopRecording, sendText, sendToolResponse,
  };
}
