/**
 * YouTubePlayer — YouTube IFrame embed wrapper with playback control.
 *
 * Uses the YouTube IFrame API via postMessage for play/pause/seek.
 * Reports current time back to the parent via onTimeUpdate callback.
 */

import { useRef, useEffect, useCallback } from 'react';

interface YouTubePlayerProps {
  videoId: string;
  onTimeUpdate?: (seconds: number) => void;
  onReady?: () => void;
}

export default function YouTubePlayer({ videoId, onTimeUpdate, onReady }: YouTubePlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // Poll current time from iframe via postMessage
  useEffect(() => {
    if (!videoId) return;

    const handleMessage = (e: MessageEvent) => {
      if (e.origin !== 'https://www.youtube.com') return;
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data.event === 'onReady') {
          onReady?.();
        }
        if (data.info?.currentTime !== undefined && onTimeUpdate) {
          onTimeUpdate(data.info.currentTime);
        }
      } catch { /* ignore non-YT messages */ }
    };

    window.addEventListener('message', handleMessage);

    // Send a listening command to the iframe
    intervalRef.current = setInterval(() => {
      const iframe = iframeRef.current;
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage(JSON.stringify({
          event: 'listening',
          id: 1,
          channel: 'widget',
        }), 'https://www.youtube.com');
        // Request current time
        iframe.contentWindow.postMessage(JSON.stringify({
          event: 'command',
          func: 'getCurrentTime',
          args: [],
        }), 'https://www.youtube.com');
      }
    }, 1000);

    return () => {
      window.removeEventListener('message', handleMessage);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [videoId, onTimeUpdate, onReady]);

  const seekTo = useCallback((seconds: number) => {
    const iframe = iframeRef.current;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage(JSON.stringify({
        event: 'command',
        func: 'seekTo',
        args: [seconds, true],
      }), 'https://www.youtube.com');
    }
  }, []);

  // Expose seekTo via a data attribute for parent access
  useEffect(() => {
    const el = iframeRef.current;
    if (el) {
      (el as unknown as { seekTo: (s: number) => void }).seekTo = seekTo;
    }
  }, [seekTo]);

  if (!videoId) return null;

  return (
    <div className="youtube-player-wrapper">
      <iframe
        ref={iframeRef}
        src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}&autoplay=1&widget_referrer=${window.location.origin}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        title="YouTube Player"
      />
    </div>
  );
}

// Helper to seek from outside using the iframe ref
export function seekYouTubePlayer(iframeElement: HTMLIFrameElement | null, seconds: number) {
  if (iframeElement?.contentWindow) {
    iframeElement.contentWindow.postMessage(JSON.stringify({
      event: 'command',
      func: 'seekTo',
      args: [seconds, true],
    }), 'https://www.youtube.com');
  }
}
