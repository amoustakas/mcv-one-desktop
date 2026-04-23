import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '../components/Toasts';
import { getBuiltinKits, executeKitTool } from '../lib/kits/loader';
import type { KitExecutionContext, KitToolSchema } from '../lib/kits/types';
import { getToolsForVenture } from '../lib/kits/loader';
import { useVoiceSession } from '../stores/voice-session';

// ---------------------------------------------------------------------------
// Voice Agent Hook
// Connects the Gemini Live API (already built) with the kit tool system.
// Enables voice-controlled NAOS: "Hey NAOS, check my email" → Live API
// → function call → gmail_search → voice response.
// ---------------------------------------------------------------------------

type VoiceState = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error';

interface VoiceAgentConfig {
  voice?: string;
  ventureId?: string;
  onTranscription?: (text: string, isFinal: boolean) => void;
  onResponse?: (text: string) => void;
  onToolCall?: (toolName: string, args: Record<string, unknown>) => void;
  onStateChange?: (state: VoiceState) => void;
}

interface VoiceAgentReturn {
  state: VoiceState;
  isActive: boolean;
  transcript: string;
  lastResponse: string;
  start: () => Promise<void>;
  stop: () => void;
  sendText: (text: string) => void;
}

/**
 * Convert kit tool schemas to Gemini Live API function declarations.
 */
function toolsToLiveDeclarations(tools: KitToolSchema[]) {
  return tools.map(t => ({
    name: t.name,
    description: t.description,
    parameters: {
      type: 'OBJECT' as const,
      properties: Object.fromEntries(
        Object.entries(t.input_schema.properties).map(([key, val]) => [
          key,
          { type: ((val as Record<string, string>).type || 'STRING').toUpperCase(), description: (val as Record<string, string>).description || '' },
        ]),
      ),
      required: t.input_schema.required || [],
    },
  }));
}

export function useVoiceAgent(config: VoiceAgentConfig = {}): VoiceAgentReturn {
  const { addToast } = useToast();
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState('');
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const recorderRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const voiceStore = useVoiceSession();
  const voice = config.voice || voiceStore.selectedVoice || 'Kore';
  const ventureId = config.ventureId || 'mcv';

  const updateState = useCallback((s: VoiceState) => {
    setState(s);
    voiceStore.setConnected(s === 'listening' || s === 'thinking' || s === 'speaking');
    voiceStore.setRecording(s === 'listening');
    config.onStateChange?.(s);
  }, [config.onStateChange]);

  const start = useCallback(async () => {
    if (state !== 'idle') return;
    updateState('connecting');

    try {
      // Phase-0 safety (2026-04-23): the browser no longer reads
      // import.meta.env.VITE_GOOGLE_AI_KEY — that env shape gets bundled into
      // the public JS by Vite at build time. Instead we mint a short-lived
      // ephemeral token from `/api/live-ephemeral-token` which is bound to a
      // single session and expires quickly. The raw GOOGLE_AI_KEY never
      // leaves the server. If token mint fails, we surface a clear error and
      // stay in idle — no fallback to raw-key flow.
      const tokenRes = await fetch('/api/live-ephemeral-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ model: 'gemini-live-2.5-flash-preview', ttlSeconds: 600 }),
      });
      if (!tokenRes.ok) {
        const err = await tokenRes.json().catch(() => ({}));
        addToast({ type: 'error', message: `Live token mint failed: ${err.error ?? tokenRes.status}` });
        updateState('error');
        return;
      }
      const { token: ephemeralToken } = (await tokenRes.json()) as { token: string };
      if (!ephemeralToken) {
        addToast({ type: 'error', message: 'Live token response missing token' });
        updateState('error');
        return;
      }

      // Get available tools for function calling
      const kits = getBuiltinKits();
      const tools = getToolsForVenture(kits, ventureId);
      const declarations = toolsToLiveDeclarations(tools.slice(0, 50)); // Limit to 50 for Live API

      // Build system instruction
      const systemInstruction = `You are NAOS, a voice-controlled AI assistant for MCV One Desktop. You can execute tools to check email, manage calendar, search files, create tasks, and more. Be concise in voice responses — speak naturally, not in markdown. When you use a tool, briefly describe what you found.`;

      // Connect to Gemini Live API via WebSocket using the ephemeral token.
      const model = 'gemini-2.5-flash';
      const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?access_token=${encodeURIComponent(ephemeralToken)}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        // Send setup message
        ws.send(JSON.stringify({
          setup: {
            model: `models/${model}`,
            generationConfig: {
              responseModalities: ['AUDIO', 'TEXT'],
              speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
            },
            systemInstruction: { parts: [{ text: systemInstruction }] },
            tools: declarations.length > 0 ? [{ functionDeclarations: declarations }] : [],
          },
        }));
      };

      ws.onmessage = async (event) => {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : null;
        if (!data) return;

        // Setup complete
        if (data.setupComplete) {
          updateState('listening');
          // Pre-existing: startMicCapture is declared later in the hook body
          // but invoked here via WebSocket onmessage, which always fires after
          // the declaration completes. Tracked for Phase-1 cleanup.
          // eslint-disable-next-line react-hooks/immutability
          startMicCapture();
          addToast({ type: 'success', message: 'NAOS Voice active' });
          return;
        }

        // Server content (text/audio response)
        if (data.serverContent) {
          const parts = data.serverContent.modelTurn?.parts || [];
          for (const part of parts) {
            if (part.text) {
              setLastResponse(prev => prev + part.text);
              config.onResponse?.(part.text);
            }
            if (part.inlineData?.mimeType?.startsWith('audio/')) {
              updateState('speaking');
              // Audio playback would go through AudioStreamer
            }
          }
          if (data.serverContent.turnComplete) {
            updateState('listening');
          }
        }

        // Tool call from Gemini
        if (data.toolCall) {
          updateState('thinking');
          const calls = data.toolCall.functionCalls || [];

          const responses = [];
          for (const fc of calls) {
            config.onToolCall?.(fc.name, fc.args || {});
            addToast({ type: 'info', message: `Running: ${fc.name}` });
            voiceStore.addToolCall({ id: fc.id || fc.name, name: fc.name, args: fc.args || {}, status: 'executing', timestamp: new Date() });

            const kits = getBuiltinKits();
            const ctx: KitExecutionContext = {
              userId: 'voice-session',
              ventureId,
              conversationId: 'voice',
              fetch: globalThis.fetch.bind(globalThis),
            };

            const result = await executeKitTool(kits, fc.name, fc.args || {}, ctx);
            voiceStore.updateToolCall(fc.id || fc.name, { status: result.success ? 'done' : 'error', result: result.data });

            responses.push({
              id: fc.id,
              name: fc.name,
              response: {
                success: result.success,
                data: result.data,
                summary: (result.displayMarkdown || '').slice(0, 500),
                error: result.error,
              },
            });
          }

          // Send tool responses back
          ws.send(JSON.stringify({
            toolResponse: { functionResponses: responses },
          }));
        }

        // Input transcription
        if (data.serverContent?.inputTranscription) {
          const text = data.serverContent.inputTranscription.text || '';
          const isFinal = data.serverContent.inputTranscription.finished || false;
          setTranscript(text);
          if (isFinal && text) {
            voiceStore.addTranscript({ text, isInput: true, timestamp: new Date() });
          }
          config.onTranscription?.(text, isFinal);
        }

        // Output transcription
        if (data.serverContent?.outputTranscription) {
          const text = data.serverContent.outputTranscription.text || '';
          setLastResponse(prev => prev + text);
          if (text) {
            voiceStore.addTranscript({ text, isInput: false, timestamp: new Date() });
          }
        }
      };

      ws.onerror = () => {
        addToast({ type: 'error', message: 'Voice connection error' });
        updateState('error');
      };

      ws.onclose = () => {
        updateState('idle');
        // Pre-existing: stopMicCapture is declared after start() but only
        // invoked here via a callback that fires when the WebSocket closes —
        // by which point the declaration has completed. Lint can't prove the
        // temporal ordering, so disable the stale-check rule. Tracked for
        // Phase-1 use-voice-agent cleanup.
        // eslint-disable-next-line react-hooks/immutability
        stopMicCapture();
      };

    } catch (err) {
      addToast({ type: 'error', message: err instanceof Error ? err.message : 'Voice failed' });
      updateState('error');
    }
  }, [state, voice, ventureId]);

  const stop = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    stopMicCapture();
    updateState('idle');
    setTranscript('');
    voiceStore.reset();
  }, []);

  const sendText = useCallback((text: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        clientContent: {
          turns: [{ role: 'user', parts: [{ text }] }],
          turnComplete: true,
        },
      }));
      updateState('thinking');
    }
  }, []);

  // Microphone capture
  const startMicCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, channelCount: 1 } });
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      const source = audioContextRef.current.createMediaStreamSource(stream);
      recorderRef.current = source;

      // Create a ScriptProcessorNode to capture PCM data
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      processor.onaudioprocess = (event) => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) return;
        const pcm = event.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(pcm.length);
        for (let i = 0; i < pcm.length; i++) {
          pcm16[i] = Math.max(-32768, Math.min(32767, Math.round(pcm[i] * 32767)));
        }
        const b64 = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
        wsRef.current.send(JSON.stringify({
          realtimeInput: { mediaChunks: [{ mimeType: 'audio/pcm;rate=16000', data: b64 }] },
        }));
      };
      source.connect(processor);
      processor.connect(audioContextRef.current.destination);
    } catch {
      addToast({ type: 'warning', message: 'Microphone access denied' });
    }
  };

  const stopMicCapture = () => {
    audioContextRef.current?.close();
    audioContextRef.current = null;
    recorderRef.current = null;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      wsRef.current?.close();
      stopMicCapture();
    };
  }, []);

  return {
    state,
    isActive: state !== 'idle' && state !== 'error',
    transcript,
    lastResponse,
    start,
    stop,
    sendText,
  };
}
