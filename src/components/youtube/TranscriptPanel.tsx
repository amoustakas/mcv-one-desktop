/**
 * TranscriptPanel — Scrollable transcript with timestamps.
 *
 * Highlights the active segment based on current player time.
 * Clickable timestamps seek the player. Search/filter bar at top.
 */

import { useRef, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import type { TranscriptSegment } from '../../stores/youtube-player';

interface TranscriptPanelProps {
  segments: TranscriptSegment[];
  currentTime: number;
  searchQuery: string;
  onSeek: (seconds: number) => void;
  onSearchChange: (query: string) => void;
  loading?: boolean;
  onFetchTranscript?: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function TranscriptPanel({
  segments, currentTime, searchQuery,
  onSeek, onSearchChange, loading, onFetchTranscript,
}: TranscriptPanelProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  // Find the active segment index
  const activeIndex = segments.findIndex((seg, i) => {
    const nextStart = segments[i + 1]?.start ?? Infinity;
    return currentTime >= seg.start && currentTime < nextStart;
  });

  // Auto-scroll to active segment
  useEffect(() => {
    if (activeRef.current && !searchQuery) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeIndex, searchQuery]);

  const handleSeek = useCallback((seconds: number) => {
    onSeek(seconds);
  }, [onSeek]);

  if (loading) {
    return (
      <div className="youtube-transcript-panel">
        <div className="youtube-transcript-header">
          <h3>Transcript</h3>
        </div>
        <div className="youtube-transcript-loading">
          <div className="view-loader" style={{ marginRight: 8 }} /> Loading transcript...
        </div>
      </div>
    );
  }

  if (segments.length === 0) {
    return (
      <div className="youtube-transcript-panel">
        <div className="youtube-transcript-header">
          <h3>Transcript</h3>
        </div>
        <div className="youtube-transcript-empty">
          <p>No transcript loaded</p>
          {onFetchTranscript && (
            <button className="youtube-fetch-btn" onClick={onFetchTranscript}>
              Fetch Transcript
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="youtube-transcript-panel">
      <div className="youtube-transcript-header">
        <h3>Transcript ({segments.length})</h3>
      </div>

      <div style={{ padding: '8px 12px', position: 'relative' }}>
        <Search size={12} style={{ position: 'absolute', left: 22, top: 17, color: 'var(--text-muted)' }} />
        <input
          className="youtube-transcript-search"
          style={{ paddingLeft: 28, margin: 0, width: '100%' }}
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search transcript..."
        />
      </div>

      <div className="youtube-transcript-list" ref={listRef}>
        {segments.map((seg, i) => (
          <div
            key={i}
            ref={i === activeIndex ? activeRef : undefined}
            className={`youtube-transcript-segment ${i === activeIndex ? 'active' : ''}`}
            onClick={() => handleSeek(seg.start)}
          >
            <span className="youtube-transcript-time">{formatTime(seg.start)}</span>
            <span className="youtube-transcript-text">{seg.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
