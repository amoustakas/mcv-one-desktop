/**
 * VoiceCarousel — Horizontal scrollable voice selector with filter bar.
 * Displays 31 Google AI Studio voices with gender/pitch/search filtering.
 */
import { useState, useRef, useCallback, useMemo } from 'react';
import { Search, Play, Pause, User } from 'lucide-react';
import { filterVoices } from '../../lib/google/voice-constants';
import type { VoiceDefinition } from '../../lib/google/voice-constants';

interface VoiceCarouselProps {
  selectedVoice: string;
  onSelectVoice: (name: string) => void;
}

const GENDER_OPTIONS = ['All', 'Male', 'Female'] as const;
const PITCH_OPTIONS = ['All', 'Higher', 'Middle', 'Lower'] as const;

export default function VoiceCarousel({ selectedVoice, onSelectVoice }: VoiceCarouselProps) {
  const [genderFilter, setGenderFilter] = useState<string>('All');
  const [pitchFilter, setPitchFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const filteredVoices = useMemo(() => {
    return filterVoices({
      gender: genderFilter === 'All' ? undefined : genderFilter,
      pitch: pitchFilter === 'All' ? undefined : pitchFilter,
      search: searchQuery || undefined,
    });
  }, [genderFilter, pitchFilter, searchQuery]);

  const handlePlaySample = useCallback((voice: VoiceDefinition, e: React.MouseEvent) => {
    e.stopPropagation();

    if (playingVoice === voice.name) {
      audioRef.current?.pause();
      setPlayingVoice(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(voice.audioSampleUrl);
    audioRef.current = audio;
    audio.play().catch(() => { /* Browser may block autoplay */ });
    setPlayingVoice(voice.name);
    audio.addEventListener('ended', () => setPlayingVoice(null), { once: true });
  }, [playingVoice]);

  return (
    <div className="vc-root">
      {/* Filter Bar */}
      <div className="vc-filters">
        <div className="vc-search">
          <Search size={13} className="vc-search-icon" />
          <input
            className="vc-search-input"
            type="text"
            placeholder="Search voices..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="vc-filter-group">
          {GENDER_OPTIONS.map(g => (
            <button
              key={g}
              className={`vc-chip ${genderFilter === g ? 'vc-chip--active' : ''}`}
              onClick={() => setGenderFilter(g)}
              type="button"
            >
              {g}
            </button>
          ))}
        </div>

        <div className="vc-filter-group">
          {PITCH_OPTIONS.map(p => (
            <button
              key={p}
              className={`vc-chip ${pitchFilter === p ? 'vc-chip--active' : ''}`}
              onClick={() => setPitchFilter(p)}
              type="button"
            >
              {p}
            </button>
          ))}
        </div>

        <span className="vc-count">{filteredVoices.length} voices</span>
      </div>

      {/* Carousel */}
      <div className="vc-carousel">
        <div className="vc-carousel-track">
          {filteredVoices.map(voice => {
            const isSelected = voice.name === selectedVoice;
            const isPlaying = voice.name === playingVoice;

            return (
              <button
                key={voice.name}
                className={`vc-card ${isSelected ? 'vc-card--selected' : ''}`}
                onClick={() => onSelectVoice(voice.name)}
                type="button"
              >
                <div className="vc-card-img-wrap">
                  <img
                    className="vc-card-img"
                    src={voice.imageUrl}
                    alt={voice.name}
                    loading="lazy"
                    onError={e => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      const fallback = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  <div className="vc-card-img-fallback">
                    <User size={24} />
                  </div>
                  <button
                    className={`vc-play-btn ${isPlaying ? 'vc-play-btn--playing' : ''}`}
                    onClick={e => handlePlaySample(voice, e)}
                    type="button"
                    aria-label={isPlaying ? `Pause ${voice.name} sample` : `Play ${voice.name} sample`}
                  >
                    {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                </div>

                <div className="vc-card-body">
                  <span className="vc-card-name">{voice.name}</span>
                  <div className="vc-card-meta">
                    <span className={`vc-gender-badge vc-gender-badge--${voice.analysis.gender.toLowerCase()}`}>
                      {voice.analysis.gender}
                    </span>
                    <span className="vc-pitch-label">{voice.pitch}</span>
                  </div>
                  <div className="vc-card-tags">
                    {voice.characteristics.map(c => (
                      <span key={c} className="vc-tag">{c}</span>
                    ))}
                  </div>
                </div>
              </button>
            );
          })}

          {filteredVoices.length === 0 && (
            <div className="vc-empty">No voices match your filters</div>
          )}
        </div>
      </div>

      <style>{`
        .vc-root {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
          height: 100%;
          overflow: hidden;
        }

        /* ── Filter Bar ── */
        .vc-filters {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-sm) var(--space-md);
          flex-wrap: wrap;
          flex-shrink: 0;
        }

        .vc-search {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          background: var(--bg-input);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 4px 10px;
          flex: 1;
          min-width: 140px;
          max-width: 220px;
        }

        .vc-search:focus-within {
          border-color: var(--border-active);
          box-shadow: 0 0 0 3px rgba(0, 240, 255, 0.06);
        }

        .vc-search-icon {
          color: var(--text-muted);
          flex-shrink: 0;
        }

        .vc-search-input {
          background: none;
          border: none;
          color: var(--text-primary);
          font-size: 12px;
          padding: 2px 0;
          width: 100%;
          outline: none;
        }

        .vc-filter-group {
          display: flex;
          gap: 2px;
          background: var(--bg-surface);
          border-radius: var(--radius-md);
          padding: 2px;
          border: 1px solid var(--border);
        }

        .vc-chip {
          padding: 3px 10px;
          border-radius: var(--radius-sm);
          font-size: 11px;
          font-weight: 500;
          color: var(--text-muted);
          transition: all var(--transition-fast);
          white-space: nowrap;
        }

        .vc-chip:hover {
          color: var(--text-secondary);
          background: var(--bg-card);
        }

        .vc-chip--active {
          background: rgba(0, 240, 255, 0.1);
          color: var(--cyan);
        }

        .vc-count {
          font-size: 11px;
          color: var(--text-muted);
          margin-left: auto;
          white-space: nowrap;
        }

        /* ── Carousel ── */
        .vc-carousel {
          flex: 1;
          overflow: hidden;
          position: relative;
        }

        .vc-carousel-track {
          display: flex;
          gap: var(--space-sm);
          overflow-x: auto;
          overflow-y: hidden;
          padding: var(--space-sm) var(--space-md);
          scroll-snap-type: x mandatory;
          height: 100%;
          align-items: flex-start;
        }

        .vc-carousel-track::-webkit-scrollbar {
          height: 4px;
        }

        .vc-carousel-track::-webkit-scrollbar-thumb {
          background: rgba(0, 240, 255, 0.12);
          border-radius: var(--radius-full);
        }

        /* ── Card ── */
        .vc-card {
          flex-shrink: 0;
          width: 160px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          overflow: hidden;
          text-align: left;
          scroll-snap-align: start;
          transition: all var(--transition-fast);
          cursor: pointer;
        }

        .vc-card:hover {
          border-color: var(--border-active);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        }

        .vc-card--selected {
          border-color: var(--cyan);
          box-shadow: 0 0 16px rgba(0, 240, 255, 0.15), 0 0 40px rgba(0, 240, 255, 0.05);
        }

        .vc-card-img-wrap {
          position: relative;
          width: 100%;
          height: 120px;
          background: var(--bg-surface);
          overflow: hidden;
        }

        .vc-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .vc-card-img-fallback {
          display: none;
          width: 100%;
          height: 100%;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          background: linear-gradient(135deg, var(--bg-surface), var(--bg-card));
        }

        .vc-play-btn {
          position: absolute;
          bottom: 6px;
          right: 6px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--text-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          opacity: 0;
          transition: all var(--transition-fast);
        }

        .vc-card:hover .vc-play-btn,
        .vc-play-btn--playing {
          opacity: 1;
        }

        .vc-play-btn:hover {
          background: rgba(0, 240, 255, 0.3);
          color: var(--cyan);
          border-color: var(--cyan);
        }

        .vc-play-btn--playing {
          background: rgba(0, 240, 255, 0.2);
          color: var(--cyan);
          border-color: var(--cyan);
        }

        .vc-card-body {
          padding: var(--space-sm);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .vc-card-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .vc-card-meta {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
        }

        .vc-gender-badge {
          font-size: 9px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          padding: 1px 6px;
          border-radius: var(--radius-full);
        }

        .vc-gender-badge--male {
          background: rgba(0, 114, 245, 0.15);
          color: var(--core-blue);
        }

        .vc-gender-badge--female {
          background: rgba(139, 92, 246, 0.15);
          color: var(--purple);
        }

        .vc-pitch-label {
          font-size: 10px;
          color: var(--text-muted);
        }

        .vc-card-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 3px;
        }

        .vc-tag {
          font-size: 9px;
          padding: 1px 5px;
          border-radius: var(--radius-sm);
          background: var(--bg-surface);
          color: var(--text-muted);
          border: 1px solid var(--border);
        }

        .vc-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          min-height: 120px;
          color: var(--text-muted);
          font-size: 13px;
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .vc-filters {
            padding: var(--space-xs) var(--space-sm);
          }

          .vc-card {
            width: 140px;
          }

          .vc-card-img-wrap {
            height: 100px;
          }
        }
      `}</style>
    </div>
  );
}
