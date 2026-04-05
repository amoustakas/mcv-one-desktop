import { useRef, useState, useCallback } from 'react';
import { X, Play, Pause, Download, Film, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface VideoPlayerProps {
  src: string;
  title?: string;
  onClose: () => void;
  onExtend?: () => void;
}

export default function VideoPlayer({ src, title, onClose, onExtend }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
  }, []);

  const handleDownload = useCallback(() => {
    const a = document.createElement('a');
    a.href = src;
    a.download = title ? `${title}.mp4` : 'video.mp4';
    a.click();
  }, [src, title]);

  const toggleFullscreen = useCallback(() => {
    setFullscreen(f => !f);
  }, []);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  return (
    <div className="vp-backdrop" onClick={handleBackdropClick}>
      <div className={cn('vp-modal', fullscreen && 'vp-modal-fullscreen')}>
        {/* Header */}
        <div className="vp-header">
          <span className="vp-title">{title || 'Video Preview'}</span>
          <div className="vp-header-actions">
            <button className="vp-icon-btn" onClick={toggleFullscreen} title="Toggle fullscreen">
              {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button className="vp-icon-btn" onClick={onClose} title="Close">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Video */}
        <div className="vp-video-wrap">
          <video
            ref={videoRef}
            src={src}
            className="vp-video"
            onClick={togglePlay}
            onEnded={() => setPlaying(false)}
            loop={false}
            playsInline
          />
          {!playing && (
            <button className="vp-play-overlay" onClick={togglePlay}>
              <Play size={48} />
            </button>
          )}
        </div>

        {/* Controls */}
        <div className="vp-controls">
          <button className="vp-ctrl-btn" onClick={togglePlay}>
            {playing ? <Pause size={18} /> : <Play size={18} />}
            <span>{playing ? 'Pause' : 'Play'}</span>
          </button>
          <button className="vp-ctrl-btn" onClick={handleDownload}>
            <Download size={18} />
            <span>Download</span>
          </button>
          {onExtend && (
            <button className="vp-ctrl-btn vp-ctrl-extend" onClick={onExtend}>
              <Film size={18} />
              <span>Extend</span>
            </button>
          )}
        </div>
      </div>

      <style>{`
        .vp-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
          animation: vp-fade-in 0.2s ease;
        }
        @keyframes vp-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .vp-modal {
          background: var(--bg-card, #0d1117);
          border: 1px solid var(--glass-border, rgba(255,255,255,0.08));
          border-radius: var(--radius-md, 12px);
          overflow: hidden;
          width: 90vw;
          max-width: 800px;
          display: flex;
          flex-direction: column;
          animation: vp-scale-in 0.2s ease;
        }
        @keyframes vp-scale-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .vp-modal-fullscreen {
          width: 100vw;
          height: 100vh;
          max-width: none;
          border-radius: 0;
        }
        .vp-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-sm, 8px) var(--space-md, 16px);
          border-bottom: 1px solid var(--border, rgba(255,255,255,0.06));
        }
        .vp-title {
          color: var(--text-primary, #e6edf3);
          font-size: 0.875rem;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 60%;
        }
        .vp-header-actions {
          display: flex;
          gap: 4px;
        }
        .vp-icon-btn {
          background: none;
          border: none;
          color: var(--text-secondary, #8b949e);
          cursor: pointer;
          padding: 6px;
          border-radius: var(--radius-sm, 6px);
          display: flex;
          align-items: center;
          transition: color 0.15s, background 0.15s;
        }
        .vp-icon-btn:hover {
          color: var(--text-primary, #e6edf3);
          background: rgba(255,255,255,0.06);
        }
        .vp-video-wrap {
          position: relative;
          background: #000;
          flex: 1;
          min-height: 0;
        }
        .vp-video {
          width: 100%;
          display: block;
          max-height: 70vh;
          object-fit: contain;
          cursor: pointer;
        }
        .vp-modal-fullscreen .vp-video {
          max-height: calc(100vh - 100px);
        }
        .vp-play-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.35);
          border: none;
          cursor: pointer;
          color: var(--cyan, #00f5ff);
          transition: background 0.15s;
        }
        .vp-play-overlay:hover {
          background: rgba(0, 0, 0, 0.5);
        }
        .vp-controls {
          display: flex;
          gap: var(--space-sm, 8px);
          padding: var(--space-sm, 8px) var(--space-md, 16px);
          border-top: 1px solid var(--border, rgba(255,255,255,0.06));
        }
        .vp-ctrl-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: var(--radius-sm, 6px);
          border: 1px solid var(--border, rgba(255,255,255,0.08));
          background: var(--bg-surface, #0d1117);
          color: var(--text-secondary, #8b949e);
          font-size: 0.8125rem;
          cursor: pointer;
          transition: color 0.15s, border-color 0.15s, background 0.15s;
        }
        .vp-ctrl-btn:hover {
          color: var(--text-primary, #e6edf3);
          border-color: var(--cyan, #00f5ff);
        }
        .vp-ctrl-extend {
          margin-left: auto;
          border-color: var(--purple, #8b5cf6);
          color: var(--purple, #8b5cf6);
        }
        .vp-ctrl-extend:hover {
          background: rgba(139, 92, 246, 0.1);
          color: var(--purple, #8b5cf6);
        }
      `}</style>
    </div>
  );
}
