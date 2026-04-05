import { useState, useCallback } from 'react';
import { Play, Trash2, RefreshCw, Film } from 'lucide-react';
import type { VeoGalleryItem } from '../../hooks/use-veo';
import VideoPlayer from './VideoPlayer';

interface VideoGalleryProps {
  items: VeoGalleryItem[];
  onRemix: (item: VeoGalleryItem) => void;
  onRemove: (id: string) => void;
  onExtend?: (item: VeoGalleryItem) => void;
}

function timeAgoShort(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function VideoGallery({ items, onRemix, onRemove, onExtend }: VideoGalleryProps) {
  const [playingItem, setPlayingItem] = useState<VeoGalleryItem | null>(null);

  const handleExtend = useCallback(() => {
    if (playingItem && onExtend) {
      onExtend(playingItem);
      setPlayingItem(null);
    }
  }, [playingItem, onExtend]);

  if (items.length === 0) {
    return (
      <div className="vgal-empty">
        <Film size={40} />
        <p className="vgal-empty-title">No videos yet</p>
        <p className="vgal-empty-desc">Generate your first video in the Generate tab.</p>
      </div>
    );
  }

  return (
    <>
      <div className="vgal-grid">
        {items.map(item => (
          <div key={item.id} className="vgal-card">
            <div className="vgal-thumb" onClick={() => setPlayingItem(item)}>
              <video
                src={item.objectUrl}
                className="vgal-video"
                muted
                preload="metadata"
              />
              <div className="vgal-play-icon">
                <Play size={28} />
              </div>
              <span className="vgal-mode-badge">{item.mode}</span>
            </div>
            <div className="vgal-info">
              <p className="vgal-prompt">{item.prompt}</p>
              <span className="vgal-time">{timeAgoShort(item.createdAt)}</span>
            </div>
            <div className="vgal-actions">
              <button
                className="vgal-action-btn"
                onClick={() => onRemix(item)}
                title="Remix prompt"
              >
                <RefreshCw size={14} />
                <span>Remix</span>
              </button>
              <button
                className="vgal-action-btn vgal-action-danger"
                onClick={() => onRemove(item.id)}
                title="Remove from gallery"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {playingItem && (
        <VideoPlayer
          src={playingItem.objectUrl}
          title={playingItem.prompt}
          onClose={() => setPlayingItem(null)}
          onExtend={onExtend ? handleExtend : undefined}
        />
      )}

      <style>{`
        .vgal-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-xl, 48px) var(--space-md, 16px);
          color: var(--text-secondary, #8b949e);
          gap: var(--space-sm, 8px);
        }
        .vgal-empty-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary, #e6edf3);
          margin: 0;
        }
        .vgal-empty-desc {
          font-size: 0.875rem;
          margin: 0;
        }
        .vgal-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: var(--space-md, 16px);
        }
        .vgal-card {
          background: var(--glass-bg, rgba(255,255,255,0.03));
          backdrop-filter: blur(var(--glass-blur, 12px));
          border: 1px solid var(--glass-border, rgba(255,255,255,0.08));
          border-radius: var(--radius-md, 12px);
          overflow: hidden;
          transition: border-color 0.2s;
        }
        .vgal-card:hover {
          border-color: var(--cyan, #00f5ff);
        }
        .vgal-thumb {
          position: relative;
          aspect-ratio: 16 / 9;
          background: #000;
          cursor: pointer;
          overflow: hidden;
        }
        .vgal-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .vgal-play-icon {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--cyan, #00f5ff);
          background: rgba(0, 0, 0, 0.3);
          opacity: 0;
          transition: opacity 0.15s;
        }
        .vgal-thumb:hover .vgal-play-icon {
          opacity: 1;
        }
        .vgal-mode-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 0.6875rem;
          font-weight: 600;
          background: rgba(0, 0, 0, 0.6);
          color: var(--cyan, #00f5ff);
          backdrop-filter: blur(4px);
        }
        .vgal-info {
          padding: var(--space-sm, 8px) var(--space-md, 16px);
        }
        .vgal-prompt {
          margin: 0;
          font-size: 0.8125rem;
          color: var(--text-primary, #e6edf3);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.4;
        }
        .vgal-time {
          font-size: 0.75rem;
          color: var(--text-secondary, #8b949e);
          margin-top: 4px;
          display: block;
        }
        .vgal-actions {
          display: flex;
          gap: 6px;
          padding: 0 var(--space-md, 16px) var(--space-sm, 8px);
        }
        .vgal-action-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: var(--radius-sm, 6px);
          border: 1px solid var(--border, rgba(255,255,255,0.08));
          background: transparent;
          color: var(--text-secondary, #8b949e);
          font-size: 0.75rem;
          cursor: pointer;
          transition: color 0.15s, border-color 0.15s;
        }
        .vgal-action-btn:hover {
          color: var(--text-primary, #e6edf3);
          border-color: var(--cyan, #00f5ff);
        }
        .vgal-action-danger:hover {
          color: #f85149;
          border-color: #f85149;
        }
        @media (max-width: 640px) {
          .vgal-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
