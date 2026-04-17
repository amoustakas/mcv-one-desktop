// Wizard voice client helper — fetch `/api/tts` and play the resulting audio.
//
// We cache by message id so a message never double-plays across re-renders
// (React Strict Mode's double-invoke, scroll-triggered layout shifts, etc.).
// Playback is serialized — kicking off a new message cancels the previous
// one so agents never talk over each other on rapid back-to-back messages.

const played = new Set<string>();
let current: HTMLAudioElement | null = null;

export interface PlayAgentVoiceArgs {
  /** Stable message id used to dedupe playback. */
  messageId: string;
  /** Text the agent just said. */
  text: string;
  /** Agent handle ("@atlas", "@ada", ...). */
  agentHandle: string;
  /** Venture slug — triggers venture-scoped voice overrides when present. */
  ventureId?: string | null;
  /** Client-side mute gate — returns immediately if true. */
  muted?: boolean;
  /** Optional override for dev/testing. */
  apiBase?: string;
}

export async function playAgentVoice(args: PlayAgentVoiceArgs): Promise<void> {
  const { messageId, text, agentHandle, ventureId, muted, apiBase = '' } = args;

  if (muted) return;
  if (!text.trim() || !agentHandle) return;
  if (played.has(messageId)) return;
  played.add(messageId);

  // Cancel any in-flight playback so we don't double-speak on fast handoffs.
  if (current) {
    current.pause();
    current.src = '';
    current = null;
  }

  let blobUrl: string | null = null;
  try {
    const r = await fetch(`${apiBase}/api/tts`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text, agentHandle, ventureId }),
    });
    if (!r.ok) {
      // Silent fallback — text stays on screen; don't surface a noisy error.
      console.warn('[voice] tts non-200:', r.status, await r.text().catch(() => ''));
      return;
    }
    const blob = await r.blob();
    blobUrl = URL.createObjectURL(blob);

    const audio = new Audio(blobUrl);
    current = audio;
    audio.addEventListener('ended', () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      if (current === audio) current = null;
    });
    audio.addEventListener('error', () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      if (current === audio) current = null;
    });

    try {
      await audio.play();
    } catch (err) {
      // Autoplay policy — drop the dedupe mark so a subsequent user-gesture
      // attempt can retry the same message.
      played.delete(messageId);
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      if (current === audio) current = null;
      console.warn('[voice] autoplay blocked:', err instanceof Error ? err.message : String(err));
    }
  } catch (err) {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    console.warn('[voice] playback failed:', err instanceof Error ? err.message : String(err));
  }
}

/** Stop whatever's currently speaking (used by the mute toggle). */
export function stopAgentVoice(): void {
  if (current) {
    current.pause();
    current.src = '';
    current = null;
  }
}
