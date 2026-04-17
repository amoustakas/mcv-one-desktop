// src/components/voice/VoiceProviderComparator.tsx
//
// Side-by-side A/B comparator: play the same utterance through N providers
// and compare latency + audio output. Uses @mcv/voice-sdk's one-shot tts()
// path (no streaming required for the comparator — side-by-side playback
// happens via HTMLAudioElement after each provider returns).

import { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Pause, Loader2, CircleCheck, CircleX } from 'lucide-react';
import {
  VoiceRouter,
  registerBuiltinProviders,
  type ProviderName,
  type AgentVoiceProfile,
} from '@mcv/voice-sdk';
import { cn } from '../../lib/utils';

interface ComparatorProps {
  providers: ProviderName[];
  providerConfigs: Partial<Record<ProviderName, { apiKey?: string; baseUrl?: string; region?: string }>>;
  agentPersona?: AgentVoiceProfile;
  /** Optional starter utterance. */
  initialText?: string;
  className?: string;
}

interface ProviderResult {
  provider: ProviderName;
  status: 'idle' | 'loading' | 'ready' | 'playing' | 'error';
  audioUrl?: string;
  latencyMs?: number;
  error?: string;
}

export default function VoiceProviderComparator({
  providers,
  providerConfigs,
  agentPersona,
  initialText = 'The quick brown fox jumps over the lazy dog. MCV enterprise voice testing in progress.',
  className,
}: ComparatorProps) {
  const [text, setText] = useState(initialText);
  const [results, setResults] = useState<Record<string, ProviderResult>>(() =>
    Object.fromEntries(providers.map((p) => [p, { provider: p, status: 'idle' as const }])),
  );
  const routerRef = useRef<VoiceRouter | null>(null);
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});

  useEffect(() => {
    registerBuiltinProviders().catch(() => {});
    routerRef.current = new VoiceRouter();
    return () => {
      // Revoke blob URLs on unmount.
      Object.values(results).forEach((r) => {
        if (r.audioUrl) URL.revokeObjectURL(r.audioUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runAll = useCallback(async () => {
    if (!routerRef.current) return;
    const router = routerRef.current;
    setResults((prev) => {
      const next = { ...prev };
      for (const p of providers) next[p] = { provider: p, status: 'loading' };
      return next;
    });

    await Promise.all(providers.map(async (provider) => {
      const t0 = performance.now();
      try {
        // Use router.tts() with a single-candidate fallback chain = this
        // provider only. No fallback here — comparator needs to observe
        // each provider's native behavior.
        const { audio } = await router.tts({
          venture: { ventureId: 'comparator', primary: provider, fallback: [] },
          providerConfigs,
          agentPersona,
          text,
        });
        const blob = new Blob([audio], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        setResults((prev) => ({
          ...prev,
          [provider]: {
            provider,
            status: 'ready',
            audioUrl: url,
            latencyMs: Math.round(performance.now() - t0),
          },
        }));
      } catch (err) {
        setResults((prev) => ({
          ...prev,
          [provider]: {
            provider,
            status: 'error',
            error: err instanceof Error ? err.message : String(err),
          },
        }));
      }
    }));
  }, [providers, providerConfigs, agentPersona, text]);

  const playAll = useCallback(async () => {
    for (const p of providers) {
      const audio = audioRefs.current[p];
      if (!audio) continue;
      try {
        audio.currentTime = 0;
        await audio.play();
      } catch { /* autoplay blocked — user must click individual play */ }
    }
  }, [providers]);

  return (
    <div className={cn('rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur p-4 space-y-4', className)}>
      <div>
        <label className="text-xs uppercase tracking-wider text-white/50 font-mono block mb-2">
          Utterance
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full rounded-lg bg-white/[0.03] border border-white/10 p-3 text-sm text-white/90 focus:outline-none focus:border-cyan-400/50"
          rows={2}
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={runAll}
          className="px-3 py-1.5 rounded-md border border-cyan-400/40 bg-cyan-400/10 hover:bg-cyan-400/20 text-sm text-cyan-200 transition-all"
        >
          Generate all
        </button>
        <button
          onClick={playAll}
          className="px-3 py-1.5 rounded-md border border-white/10 hover:bg-white/5 text-sm text-white/70 transition-all flex items-center gap-2"
        >
          <Play size={14} /> Play all
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {providers.map((provider) => {
          const r = results[provider];
          return (
            <div
              key={provider}
              className="rounded-xl border border-white/10 bg-black/30 p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-white/70">
                  {provider}
                </span>
                {r.status === 'loading' && <Loader2 size={14} className="animate-spin text-cyan-400" />}
                {r.status === 'ready' && <CircleCheck size={14} className="text-emerald-400" />}
                {r.status === 'error' && <CircleX size={14} className="text-red-400" />}
              </div>
              {r.latencyMs != null && (
                <div className="text-[10px] text-white/40 font-mono">
                  {r.latencyMs}ms
                </div>
              )}
              {r.error && <div className="text-xs text-red-400">{r.error}</div>}
              {r.audioUrl && (
                <audio
                  ref={(el) => { audioRefs.current[provider] = el; }}
                  src={r.audioUrl}
                  controls
                  className="w-full h-8"
                />
              )}
              {r.status === 'idle' && (
                <div className="text-xs text-white/30">Click Generate all to synthesize.</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Prevent unused-import warning on Pause while keeping the icon available.
void Pause;
