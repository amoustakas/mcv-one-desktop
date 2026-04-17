// useAgentVoice — plays a sample line in the agent's actual voice.
//
// Resolves the voice via persona_voices (with venture-scope override +
// SDK fallback) and calls `/api/voice-tts` with the chosen voiceId.
// Used by AgentProfileView's "Hear voice" button and anywhere else we
// want Tony to preview how a specific agent sounds.

import { useCallback, useRef, useState } from 'react';
import { resolvePersonaVoice } from '../lib/voice/router';

export interface UseAgentVoiceResult {
  /** Fetches + plays the sample. Rejects only on fatal errors; autoplay blocks surface as error state. */
  play: (args: { text: string; agentHandle: string; ventureId?: string | null }) => Promise<void>;
  /** Stop any in-flight playback without clearing `error`. */
  stop: () => void;
  playing: boolean;
  error: string | null;
}

export function useAgentVoice(): UseAgentVoiceResult {
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentUrlRef = useRef<string | null>(null);

  const stop = useCallback(() => {
    const a = currentAudioRef.current;
    if (a) {
      a.pause();
      a.src = '';
    }
    const url = currentUrlRef.current;
    if (url) URL.revokeObjectURL(url);
    currentAudioRef.current = null;
    currentUrlRef.current = null;
    setPlaying(false);
  }, []);

  const play = useCallback(async (args: { text: string; agentHandle: string; ventureId?: string | null }) => {
    const text = args.text.trim();
    if (!text || !args.agentHandle) return;

    // Previous sample cancels so rapid "hear voice" clicks never layer.
    stop();
    setError(null);
    setPlaying(true);

    let blobUrl: string | null = null;
    try {
      const codename = args.agentHandle.replace(/^@/, '').toLowerCase();
      const voice = await resolvePersonaVoice(codename, args.ventureId ?? undefined);
      if (!voice?.voiceId) {
        throw new Error(`No voice mapped for ${args.agentHandle}`);
      }

      const r = await fetch('/api/voice-tts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text, voiceId: voice.voiceId }),
      });
      if (!r.ok) {
        const msg = await r.text().catch(() => `${r.status} ${r.statusText}`);
        throw new Error(msg || `voice-tts ${r.status}`);
      }

      const blob = await r.blob();
      blobUrl = URL.createObjectURL(blob);
      currentUrlRef.current = blobUrl;

      const settledUrl: string = blobUrl;
      const audio = new Audio(settledUrl);
      currentAudioRef.current = audio;

      await new Promise<void>((resolve, reject) => {
        audio.addEventListener('ended', () => {
          if (currentUrlRef.current === settledUrl) {
            URL.revokeObjectURL(settledUrl);
            currentUrlRef.current = null;
          }
          if (currentAudioRef.current === audio) currentAudioRef.current = null;
          resolve();
        }, { once: true });
        audio.addEventListener('error', () => reject(new Error('audio decode failed')), { once: true });
        audio.play().catch((err) => reject(err instanceof Error ? err : new Error(String(err))));
      });
    } catch (err) {
      if (blobUrl && currentUrlRef.current === blobUrl) {
        URL.revokeObjectURL(blobUrl);
        currentUrlRef.current = null;
      }
      currentAudioRef.current = null;
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPlaying(false);
    }
  }, [stop]);

  return { play, stop, playing, error };
}
