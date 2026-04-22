// Browser-side audio widget: MediaRecorder captures mic → posts base64 webm
// to Factory `sttTranscribe` → shows transcript. Also supports synth:
// type text, hit speak, Factory `ttsSynthesize` returns MP3 base64, we play
// it in the browser's Audio element. Avoids needing native sox/portaudio on
// the Factory host — the browser handles I/O, Factory handles cloud round-trips.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, Square, Volume2, Loader2, Copy } from 'lucide-react';
import { GlassCard, Badge, EmptyState } from '../ui';
import { factoryInvoke } from '../../lib/factory-client';

export default function AudioWidget() {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [recError, setRecError] = useState<string | null>(null);
  const [ttsText, setTtsText] = useState('');
  const [synthesizing, setSynthesizing] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const [ttsUrl, setTtsUrl] = useState<string | null>(null);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const aliveRef = useRef(true);

  useEffect(() => () => {
    aliveRef.current = false;
    try { mediaRef.current?.stop(); } catch { /* ignore */ }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (ttsUrl) URL.revokeObjectURL(ttsUrl);
  }, [ttsUrl]);

  const start = useCallback(async () => {
    setRecError(null);
    setTranscript(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      // Prefer webm/opus (Chromium); fall back to default.
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : undefined;
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      mediaRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mime ?? 'audio/webm' });
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        await transcribe(blob);
      };
      rec.start();
      setRecording(true);
    } catch (err) {
      setRecError(err instanceof Error ? err.message : 'getUserMedia failed');
    }
  }, []);

  const stop = useCallback(() => {
    try { mediaRef.current?.stop(); } catch { /* ignore */ }
    setRecording(false);
  }, []);

  const transcribe = async (blob: Blob) => {
    setTranscribing(true);
    setTranscript(null);
    try {
      const buf = await blob.arrayBuffer();
      const base64 = btoa(new Uint8Array(buf).reduce((s, b) => s + String.fromCharCode(b), ''));
      const r = await factoryInvoke<{ ok: boolean; transcript?: string; error?: string; confidence?: number }>('sttTranscribe', {
        base64,
        mimeType: blob.type || 'audio/webm',
      });
      const out = r.output;
      if (!out?.ok) {
        setRecError(out?.error ?? 'sttTranscribe failed (check DEEPGRAM_API_KEY)');
      } else {
        setTranscript(out.transcript ?? '(empty)');
      }
    } catch (err) {
      setRecError(err instanceof Error ? err.message : 'transcribe failed');
    } finally {
      setTranscribing(false);
    }
  };

  const synth = useCallback(async () => {
    if (!ttsText.trim()) return;
    setSynthesizing(true);
    setTtsError(null);
    if (ttsUrl) { URL.revokeObjectURL(ttsUrl); setTtsUrl(null); }
    try {
      const r = await factoryInvoke<{ ok: boolean; mp3Base64?: string; error?: string; voice?: string }>('ttsSynthesize', {
        text: ttsText, returnBase64: true,
      });
      const out = r.output;
      if (!out?.ok || !out.mp3Base64) {
        setTtsError(out?.error ?? 'ttsSynthesize failed (check ELEVENLABS_API_KEY)');
        return;
      }
      // Convert base64 → Blob → URL for playback.
      const bin = atob(out.mp3Base64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const blob = new Blob([bytes], { type: 'audio/mpeg' });
      setTtsUrl(URL.createObjectURL(blob));
    } catch (err) {
      setTtsError(err instanceof Error ? err.message : 'synth failed');
    } finally {
      setSynthesizing(false);
    }
  }, [ttsText, ttsUrl]);

  const copyTranscript = async () => {
    if (!transcript) return;
    try { await navigator.clipboard.writeText(transcript); } catch { /* ignore */ }
  };

  return (
    <GlassCard>
      <h3 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Volume2 size={14} /> Audio
        <Badge variant="outline" color="#00F0FF">Deepgram + ElevenLabs</Badge>
      </h3>

      {/* STT */}
      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
        Speech → text
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        {!recording ? (
          <button type="button" onClick={start} disabled={transcribing}
            style={{ padding: '6px 12px', borderRadius: 4, background: 'var(--color-brand-electric)', color: '#000', border: 'none', cursor: transcribing ? 'wait' : 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            {transcribing ? <Loader2 size={12} /> : <Mic size={12} />} {transcribing ? 'transcribing…' : 'record'}
          </button>
        ) : (
          <button type="button" onClick={stop}
            style={{ padding: '6px 12px', borderRadius: 4, background: '#EF4444', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Square size={12} /> stop
          </button>
        )}
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
          browser captures audio; Factory transcribes via Deepgram.
        </span>
      </div>
      {recError && <div style={{ fontSize: 11, color: '#FCA5A5', marginBottom: 8 }}>{recError}</div>}
      {transcript !== null && (
        <div style={{ padding: 8, borderRadius: 4, background: 'var(--surface-sunken)', fontSize: 12, position: 'relative', marginBottom: 16 }}>
          <button type="button" onClick={copyTranscript}
            title="Copy"
            style={{ position: 'absolute', top: 4, right: 4, background: 'transparent', border: '1px solid var(--border-default)', borderRadius: 3, padding: '2px 4px', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <Copy size={10} />
          </button>
          {transcript || <EmptyState title="(empty transcript)" />}
        </div>
      )}

      {/* TTS */}
      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
        Text → speech
      </div>
      <div style={{ display: 'grid', gap: 6 }}>
        <textarea value={ttsText} onChange={(e) => setTtsText(e.target.value)} rows={3}
          placeholder="Type something for the factory to speak…"
          style={{ padding: 8, fontSize: 12, borderRadius: 4, background: 'var(--surface-sunken)', color: 'var(--text-primary)', border: '1px solid var(--border-default)', resize: 'vertical' }} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button type="button" onClick={synth} disabled={synthesizing || !ttsText.trim()}
            style={{ padding: '6px 12px', borderRadius: 4, background: 'var(--color-brand-electric)', color: '#000', border: 'none', cursor: (synthesizing || !ttsText.trim()) ? 'wait' : 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            {synthesizing ? <Loader2 size={12} /> : <Volume2 size={12} />} {synthesizing ? 'synthesizing…' : 'speak'}
          </button>
          {ttsUrl && <audio src={ttsUrl} controls style={{ flex: 1, height: 32 }} />}
        </div>
        {ttsError && <div style={{ fontSize: 11, color: '#FCA5A5' }}>{ttsError}</div>}
      </div>
    </GlassCard>
  );
}
