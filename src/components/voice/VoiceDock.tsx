// src/components/voice/VoiceDock.tsx
//
// Push-to-talk dock — a compact, provider-agnostic voice control surface.
// Uses @mcv/voice-sdk's VoiceRouter directly, so it works with ANY provider
// registered in the sdk (Gemini Live default, ElevenLabs+Deepgram fallback,
// Vapi for phone, etc.). The dock never names a provider — it only shows
// the resolved provider in the status line.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Loader2, Radio, AlertTriangle } from 'lucide-react';
import {
  VoiceRouter,
  VoiceSession,
  registerBuiltinProviders,
  type ProviderName,
  type ProviderConnection,
  type VentureVoiceConfig,
  type AgentVoiceProfile,
  type SessionState,
} from '@mcv/voice-sdk';
import { cn } from '../../lib/utils';

interface VoiceDockProps {
  /** Per-venture config (loaded from Venture.voice). */
  venture: VentureVoiceConfig;
  /** Optional persona from agent_persona.voice_profile. */
  agentPersona?: AgentVoiceProfile;
  /** Provider configs keyed by canonical provider name. */
  providerConfigs: Partial<Record<ProviderName, { apiKey?: string; baseUrl?: string; region?: string }>>;
  /** Called when transcripts (final) arrive. */
  onTranscript?: (text: string) => void;
  /** Called when each audio chunk arrives — host typically pipes into AudioContext. */
  onAudioChunk?: (bytes: Uint8Array) => void;
  className?: string;
}

export default function VoiceDock({
  venture,
  agentPersona,
  providerConfigs,
  onTranscript,
  onAudioChunk,
  className,
}: VoiceDockProps) {
  const [state, setState] = useState<SessionState>('idle');
  const [resolvedProvider, setResolvedProvider] = useState<ProviderName | null>(null);
  const [degraded, setDegraded] = useState(false);
  const [firstAudioMs, setFirstAudioMs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const routerRef = useRef<VoiceRouter | null>(null);
  const sessionRef = useRef<VoiceSession | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    // Register built-in providers once on mount. Safe to call multiple times
    // — registry is idempotent by provider name.
    registerBuiltinProviders().catch((e: unknown) => setError(String(e)));
    routerRef.current = new VoiceRouter();
    return () => {
      sessionRef.current?.close().catch(() => {});
    };
  }, []);

  const startTalk = useCallback(async () => {
    if (!routerRef.current) return;
    setError(null);
    setState('connecting');
    setDegraded(false);
    setFirstAudioMs(null);
    setResolvedProvider(null);

    try {
      const result = await routerRef.current.connect({
        venture,
        agentPersona,
        providerConfigs,
        fallback: {
          timeoutMs: 2000,
          onFailure: (f: { candidate: { provider: ProviderName }; error: Error }) =>
            console.warn(`[VoiceDock] ${f.candidate.provider} failed:`, f.error.message),
        },
      });
      setResolvedProvider(result.provider);
      setDegraded(result.degraded);

      // Composite stack? We'd open a STT connection here too. For the Dock
      // we keep it single-connection (primary) — host wires composite via
      // VoiceSession constructor if needed.
      const session = new VoiceSession({
        primary: result.connection as ProviderConnection,
        resolvedProvider: result.provider,
        degraded: result.degraded,
      });
      sessionRef.current = session;

      session.on('state', (s: SessionState) => setState(s));
      session.on('audio-chunk', (chunk: { data: ArrayBuffer | Uint8Array; first?: boolean }) => {
        if (chunk.first && session.firstAudioLatencyMs != null) {
          setFirstAudioMs(session.firstAudioLatencyMs);
        }
        const bytes = chunk.data instanceof Uint8Array ? chunk.data : new Uint8Array(chunk.data);
        onAudioChunk?.(bytes);
      });
      session.on('transcript-final', (t: { text: string }) => onTranscript?.(t.text));
      session.on('error', (err: Error) => {
        setError(err.message);
        setState('error');
      });

      // Capture mic → session. In composite mode the session routes to
      // stt.sendAudio; in realtime mode to primary.sendAudio.
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = async (ev) => {
        if (ev.data.size === 0) return;
        const buffer = await ev.data.arrayBuffer();
        session.sendAudio(buffer);
      };
      recorder.start(250);
      recorderRef.current = recorder;
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [venture, agentPersona, providerConfigs, onTranscript, onAudioChunk]);

  const stopTalk = useCallback(async () => {
    recorderRef.current?.stop();
    recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    recorderRef.current = null;
    await sessionRef.current?.close();
    sessionRef.current = null;
    setState('idle');
  }, []);

  const activeColor = state === 'error' ? '#EF4444'
    : state === 'speaking' ? '#8B5CF6'
    : state === 'listening' || state === 'thinking' ? '#00F0FF'
    : 'rgba(255,255,255,0.3)';

  return (
    <div className={cn('rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur p-4 flex items-center gap-4', className)}>
      <button
        aria-label={state === 'idle' || state === 'closed' || state === 'error' ? 'Start voice' : 'Stop voice'}
        onClick={state === 'idle' || state === 'closed' || state === 'error' ? startTalk : stopTalk}
        className={cn(
          'w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all',
          state === 'listening' && 'animate-pulse',
        )}
        style={{
          borderColor: activeColor,
          background: `radial-gradient(circle at center, ${activeColor}22, transparent 70%)`,
        }}
      >
        {state === 'connecting' ? (
          <Loader2 size={22} className="animate-spin" style={{ color: activeColor }} />
        ) : state === 'idle' || state === 'closed' || state === 'error' ? (
          <MicOff size={22} style={{ color: activeColor }} />
        ) : (
          <Mic size={22} style={{ color: activeColor }} />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="text-xs uppercase tracking-wider text-white/50 font-mono flex items-center gap-2">
          <Radio size={10} />
          {state}
          {degraded && (
            <span className="text-amber-400 flex items-center gap-1">
              <AlertTriangle size={10} /> fallback
            </span>
          )}
        </div>
        <div className="text-sm text-white/80 truncate">
          {resolvedProvider ? `via ${resolvedProvider}` : 'ready'}
          {firstAudioMs != null && ` · first audio ${firstAudioMs}ms`}
        </div>
        {error && <div className="text-xs text-red-400 truncate">{error}</div>}
      </div>
    </div>
  );
}
