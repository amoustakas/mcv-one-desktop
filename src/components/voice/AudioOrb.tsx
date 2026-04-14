import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Volume2, Loader2, Square } from 'lucide-react';
import { apiPost } from '../../lib/api/client';
import { streamMessage, type ChatMessage } from '../../lib/claude';
import { pickStack, resolvePersonaVoice, type VoiceUseCase } from '../../lib/voice/router';
import { GlassCard } from '../ui';
import { useToast } from '../Toasts';

// ---------------------------------------------------------------------------
// AudioOrb — mic capture → Deepgram STT → Claude → ElevenLabs TTS → playback
//
// Canonical path for Claude-primary voice conversation. The voice router
// reports the stack choice; actual Gemini Live wiring lives in a future
// companion component that uses the same orb UI.
//
// UX:
//   Idle state       → glowing static circle
//   Listening        → pulsing cyan while recording
//   Thinking         → slow orbital animation
//   Speaking         → pulsing purple during playback
//
// Hold-to-talk: press the mic button to start, release to stop + transcribe.
// Click-to-toggle is also supported (short tap toggles).
// ---------------------------------------------------------------------------

type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';

interface TurnRecord {
  role: 'user' | 'assistant';
  text: string;
}

interface AudioOrbProps {
  /** Agent codename — drives voice persona. Defaults to aegis. */
  agent?: string;
  /** Venture for persona lookup + system prompt scoping */
  ventureId?: string;
  /** Custom system prompt; otherwise builds a minimal one per agent. */
  systemPrompt?: string;
  /** Use case override for router (defaults to claude-chat-voice) */
  useCase?: VoiceUseCase;
}

export default function AudioOrb({
  agent = 'aegis',
  ventureId,
  systemPrompt,
  useCase = 'claude-chat-voice',
}: AudioOrbProps) {
  const { toast } = useToast();
  const [state, setState] = useState<OrbState>('idle');
  const [turns, setTurns] = useState<TurnRecord[]>([]);
  const [stackReason, setStackReason] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Figure out which stack the router chose (for UI + reason tooltip).
  useEffect(() => {
    const pick = pickStack({
      useCase,
      provider: 'anthropic',
      latencyTolerance: 'near-real-time',
      requireToolCalling: false,
      agentCodename: agent,
      ventureId,
    });
    setStackReason(pick.reason);
  }, [useCase, agent, ventureId]);

  const startRecording = useCallback(async () => {
    if (state !== 'idle') return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // webm/opus is well-supported in browsers and accepted by Deepgram.
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: mime });
        await handleTurn(blob, mime);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setState('listening');
    } catch (e) {
      setState('error');
      toast('error', e instanceof Error ? e.message : 'Microphone access denied');
      setTimeout(() => setState('idle'), 1500);
    }
  }, [state, toast]);

  const stopRecording = useCallback(() => {
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== 'inactive') {
      rec.stop();
      setState('thinking');
    }
  }, []);

  async function handleTurn(blob: Blob, mime: string) {
    try {
      // 1. Encode + transcribe
      const audioBase64 = await blobToBase64(blob);
      const stt = await apiPost<{ results: { channels: Array<{ alternatives: Array<{ transcript: string }> }> } }>(
        '/api/deepgram',
        { action: 'transcribe-blob', audio_base64: audioBase64, mime_type: mime, model: 'nova-2', smart_format: true, punctuate: true },
      );
      const userText = stt.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim() || '';
      if (!userText) {
        toast('info', 'Nothing transcribed — try again');
        setState('idle');
        return;
      }
      const newTurns: TurnRecord[] = [...turns, { role: 'user', text: userText }];
      setTurns(newTurns);

      // 2. Send to Claude
      const messages: ChatMessage[] = newTurns.map(t => ({ role: t.role, content: t.text }));
      const sysPrompt = systemPrompt || defaultPrompt(agent, ventureId);
      let reply = '';
      reply = await streamMessage(messages, sysPrompt, (partial) => {
        // Stream updates don't change orb state; we show final text after.
        reply = partial;
      });
      setTurns(prev => [...prev, { role: 'assistant', text: reply }]);

      // 3. TTS → playback
      const persona = await resolvePersonaVoice(agent, ventureId);
      const voiceId = persona?.voiceId || 'rachel';
      setState('speaking');
      const tts = await apiPost<{ audio_base64: string; mime_type: string }>(
        '/api/elevenlabs',
        { action: 'tts', voiceId, text: reply, model_id: 'eleven_turbo_v2_5' },
      );
      await playAudio(`data:${tts.mime_type};base64,${tts.audio_base64}`);
      setState('idle');
    } catch (e) {
      setState('error');
      toast('error', e instanceof Error ? e.message : 'Turn failed');
      setTimeout(() => setState('idle'), 2000);
    }
  }

  async function playAudio(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error('Audio playback failed'));
      audio.play().catch(reject);
    });
  }

  const stopEverything = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setState('idle');
  };

  const handleMainClick = () => {
    if (state === 'idle') void startRecording();
    else if (state === 'listening') stopRecording();
    else stopEverything();
  };

  const orbColor =
    state === 'listening' ? 'var(--cyan)' :
    state === 'thinking' ? 'var(--purple, #8B5CF6)' :
    state === 'speaking' ? '#EC4899' :
    state === 'error' ? 'var(--error)' :
    'var(--text-muted)';

  return (
    <GlassCard className="ao-root">
      <div className="ao-header">
        <span className="ao-agent">{agent.toUpperCase()}</span>
        <span className="ao-stack" title={stackReason}>D+E</span>
      </div>

      <button
        className={`ao-orb ao-orb-${state}`}
        onClick={handleMainClick}
        aria-label={state === 'idle' ? 'Start speaking' : state === 'listening' ? 'Stop recording' : 'Cancel'}
        style={{ color: orbColor }}
      >
        <div className="ao-orb-ring" style={{ borderColor: orbColor }} />
        <div className="ao-orb-ring ao-orb-ring-2" style={{ borderColor: orbColor }} />
        <div className="ao-orb-icon">
          {state === 'idle' && <Mic size={32} />}
          {state === 'listening' && <MicOff size={32} />}
          {state === 'thinking' && <Loader2 size={32} className="ao-spin" />}
          {state === 'speaking' && <Volume2 size={32} />}
          {state === 'error' && <Square size={32} />}
        </div>
      </button>

      <div className="ao-status">
        {state === 'idle' && 'Tap to speak'}
        {state === 'listening' && 'Listening… tap to stop'}
        {state === 'thinking' && 'Thinking…'}
        {state === 'speaking' && 'Speaking… tap to stop'}
        {state === 'error' && 'Something went wrong — try again'}
      </div>

      <div className="ao-transcript">
        {turns.length === 0 && <div className="ao-empty">Your conversation will appear here.</div>}
        {turns.slice(-6).map((t, i) => (
          <div key={i} className={`ao-turn ao-turn-${t.role}`}>
            <span className="ao-turn-role">{t.role === 'user' ? 'You' : agent}</span>
            <span className="ao-turn-text">{t.text}</span>
          </div>
        ))}
      </div>

      <style>{`
        .ao-root { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 24px; max-width: 440px; margin: 0 auto; }
        .ao-header { display: flex; align-items: center; gap: 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); }
        .ao-agent { font-weight: 700; color: var(--cyan); }
        .ao-stack { padding: 2px 8px; border: 1px solid var(--border); border-radius: var(--radius-full); background: var(--bg-elevated); cursor: help; font-family: var(--font-mono); }

        .ao-orb { position: relative; width: 140px; height: 140px; border: none; background: none; cursor: pointer; display: flex; align-items: center; justify-content: center; outline: none; padding: 0; }
        .ao-orb-ring { position: absolute; inset: 0; border-radius: 50%; border: 2px solid; opacity: 0.4; transition: all 0.3s; }
        .ao-orb-ring-2 { inset: 12px; opacity: 0.2; }
        .ao-orb-icon { position: relative; z-index: 2; display: flex; align-items: center; justify-content: center; width: 72px; height: 72px; background: var(--bg-card); border-radius: 50%; border: 1px solid var(--border); transition: all 0.2s; }
        .ao-orb:hover .ao-orb-icon { transform: scale(1.05); }

        .ao-orb-listening .ao-orb-ring { animation: ao-pulse 1.4s ease-in-out infinite; }
        .ao-orb-listening .ao-orb-ring-2 { animation: ao-pulse 1.4s ease-in-out infinite 0.5s; }
        .ao-orb-thinking .ao-orb-ring { animation: ao-orbit 2s linear infinite; opacity: 0.7; }
        .ao-orb-speaking .ao-orb-ring { animation: ao-pulse 0.8s ease-in-out infinite; }
        .ao-orb-error .ao-orb-icon { background: rgba(239,68,68,0.1); }

        @keyframes ao-pulse { 0%, 100% { transform: scale(1); opacity: 0.4; } 50% { transform: scale(1.15); opacity: 0.7; } }
        @keyframes ao-orbit { 0% { transform: rotate(0deg) scale(1); } 100% { transform: rotate(360deg) scale(1.05); } }
        .ao-spin { animation: ao-spin 1s linear infinite; }
        @keyframes ao-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .ao-status { font-size: 11px; color: var(--text-muted); letter-spacing: 0.5px; text-transform: uppercase; }

        .ao-transcript { width: 100%; display: flex; flex-direction: column; gap: 6px; max-height: 240px; overflow-y: auto; padding: 8px 4px; }
        .ao-empty { font-size: 11px; color: var(--text-muted); font-style: italic; text-align: center; padding: 12px; }
        .ao-turn { display: flex; gap: 8px; font-size: 11px; padding: 6px 8px; border-radius: var(--radius-sm); background: var(--bg-card); border: 1px solid var(--border); }
        .ao-turn-user { border-left: 2px solid var(--cyan); }
        .ao-turn-assistant { border-left: 2px solid #EC4899; }
        .ao-turn-role { font-family: var(--font-mono); font-size: 9px; text-transform: uppercase; color: var(--text-muted); flex-shrink: 0; padding-top: 1px; letter-spacing: 0.5px; }
        .ao-turn-text { color: var(--text-primary); line-height: 1.4; }
      `}</style>
    </GlassCard>
  );
}

// ── helpers ──

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Strip the data:xxx;base64, prefix
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function defaultPrompt(agent: string, ventureId?: string): string {
  const context = ventureId ? ` You're currently scoped to the ${ventureId} venture.` : '';
  return `You are ${agent.toUpperCase()}, an agent in the MCV One ecosystem.${context} Respond in 1-3 sentences — this is a voice conversation, brevity matters.`;
}
