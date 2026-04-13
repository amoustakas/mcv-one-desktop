/**
 * YouTubePlayerView — Standalone YouTube widget with transcript intelligence.
 *
 * Embedded YouTube player + transcript panel + Claude Q&A.
 * Supports: video URL input, transcript fetching, timestamp navigation,
 * transcript search, and AI-powered video Q&A.
 */

import { useState, useCallback } from 'react';
import { useYouTubePlayerStore } from '../stores/youtube-player';
import YouTubePlayer, { seekYouTubePlayer } from '../components/youtube/YouTubePlayer';
import TranscriptPanel from '../components/youtube/TranscriptPanel';
import YouTubeQA from '../components/youtube/YouTubeQA';
import { PlayCircle, Clock } from 'lucide-react';
import '../styles/youtube-player.css';

function extractVideoId(input: string): string | null {
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
  const patterns = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = input.match(p);
    if (m) return m[1];
  }
  return null;
}

export default function YouTubePlayerView() {
  const {
    currentVideoId, currentVideoTitle, transcript, transcriptLoading,
    transcriptSearch, playerTime, watchHistory,
    setVideo, setTranscript, setTranscriptLoading, setTranscriptSearch, setPlayerTime,
  } = useYouTubePlayerStore();

  const [urlInput, setUrlInput] = useState('');

  const handleLoadVideo = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    const videoId = extractVideoId(urlInput.trim());
    if (videoId) {
      setVideo(videoId);
      setUrlInput('');
      // Fetch video info
      fetch('/local/youtube/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId }),
      })
        .then(r => r.json())
        .then(data => {
          if (data.title) setVideo(videoId, data.title);
        })
        .catch(() => {});
    }
  }, [urlInput, setVideo]);

  const handleFetchTranscript = useCallback(async () => {
    if (!currentVideoId) return;
    setTranscriptLoading(true);
    try {
      const res = await fetch('/local/youtube/transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: currentVideoId }),
      });
      const data = await res.json();
      if (data.segments) {
        setTranscript(data.segments);
      }
    } catch {
      setTranscriptLoading(false);
    }
  }, [currentVideoId, setTranscript, setTranscriptLoading]);

  const handleSeek = useCallback((seconds: number) => {
    // Find the YouTube iframe and seek
    const iframe = document.querySelector('.youtube-player-wrapper iframe') as HTMLIFrameElement;
    seekYouTubePlayer(iframe, seconds);
  }, []);

  const handleHistoryClick = useCallback((videoId: string) => {
    setVideo(videoId);
    // Fetch info
    fetch('/local/youtube/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId }),
    })
      .then(r => r.json())
      .then(data => { if (data.title) setVideo(videoId, data.title); })
      .catch(() => {});
  }, [setVideo]);

  const filteredSegments = useYouTubePlayerStore(s => s.getFilteredTranscript());

  return (
    <div className="youtube-view">
      <form className="youtube-url-bar" onSubmit={handleLoadVideo}>
        <input
          className="youtube-url-input"
          type="text"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="Paste YouTube URL or video ID..."
        />
      </form>

      {currentVideoId ? (
        <>
          <div className="youtube-content">
            <div className="youtube-player-area">
              <YouTubePlayer
                videoId={currentVideoId}
                onTimeUpdate={setPlayerTime}
              />
              {currentVideoTitle && (
                <div className="youtube-info">
                  <h2>{currentVideoTitle}</h2>
                </div>
              )}
              <YouTubeQA
                videoTitle={currentVideoTitle}
                transcript={transcript}
              />
            </div>

            <TranscriptPanel
              segments={filteredSegments}
              currentTime={playerTime}
              searchQuery={transcriptSearch}
              onSeek={handleSeek}
              onSearchChange={setTranscriptSearch}
              loading={transcriptLoading}
              onFetchTranscript={handleFetchTranscript}
            />
          </div>
        </>
      ) : (
        <div className="youtube-empty-state">
          <PlayCircle size={48} style={{ color: 'var(--cyan)', opacity: 0.4 }} />
          <h3>YouTube Player</h3>
          <p>Paste a YouTube URL above to start watching with Claude-powered transcript intelligence.</p>

          {watchHistory.length > 0 && (
            <div style={{ width: '100%', maxWidth: 400 }}>
              <h4 style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                <Clock size={12} style={{ marginRight: 4, verticalAlign: -1 }} />
                Recently Watched
              </h4>
              <div className="youtube-history">
                {watchHistory.slice(0, 8).map(h => (
                  <button
                    key={h.videoId}
                    className="youtube-history-item"
                    onClick={() => handleHistoryClick(h.videoId)}
                  >
                    <PlayCircle size={14} style={{ flexShrink: 0, color: 'var(--cyan)' }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {h.title || h.videoId}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
