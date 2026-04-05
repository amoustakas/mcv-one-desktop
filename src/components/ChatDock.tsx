import { useState, lazy, Suspense } from 'react';
import { MessageSquare, Minimize2, Maximize2 } from 'lucide-react';
import { useNavigation } from '../stores/navigation';
import { getVenture, ventures } from '../lib/ventures';
import { Badge } from './ui';
import { cn } from '../lib/utils';
const AegisChat = lazy(() => import('./AegisChat'));

export default function ChatDock() {
  const { chatVenture, toggleChatDock } = useNavigation();
  const venture = getVenture(chatVenture) ?? ventures[0];
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem('mcv-dock-width');
    return saved ? parseInt(saved) : Math.min(480, Math.floor(window.innerWidth * 0.25));
  });
  const [dragging, setDragging] = useState(false);
  const [minimized, setMinimized] = useState(false);

  function handleMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    setDragging(true);
    const startX = e.clientX;
    const startW = width;

    function onMove(ev: MouseEvent) {
      const delta = startX - ev.clientX;
      const newW = Math.max(320, Math.min(800, startW + delta));
      setWidth(newW);
    }

    function onUp() {
      setDragging(false);
      localStorage.setItem('mcv-dock-width', String(width));
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  return (
    <div className={cn('dock', minimized && 'dock-minimized')} style={{ width: minimized ? 48 : width }}>
      {/* Resize handle */}
      {!minimized && (
        <div
          className={cn('dock-resize', dragging && 'active')}
          onMouseDown={handleMouseDown}
        >
          <div className="dock-resize-line" />
        </div>
      )}

      <div className="dock-inner">
        <div className="dock-header">
          <div className="dock-header-glow" />
          <div className="dock-title">
            <div className="dock-icon-wrap">
              <MessageSquare size={12} />
              <div className="dock-icon-pulse" />
            </div>
            {!minimized && (
              <>
                <span className="dock-label">AEGIS</span>
                <Badge color={venture.color} variant="outline" size="sm">
                  {venture.name}
                </Badge>
              </>
            )}
          </div>
          {!minimized && (
            <div className="dock-controls">
              <button className="dock-ctrl-btn" onClick={() => setMinimized(true)} title="Minimize">
                <Minimize2 size={11} />
              </button>
              <button className="dock-ctrl-btn" onClick={toggleChatDock} title="Close (Ctrl+/)">
                ×
              </button>
            </div>
          )}
          {minimized && (
            <button className="dock-ctrl-btn dock-expand-btn" onClick={() => setMinimized(false)} title="Expand">
              <Maximize2 size={12} />
            </button>
          )}
        </div>
        {!minimized && (
          <div className="dock-body">
            <Suspense fallback={<div className="dock-loading">Initializing Aegis...</div>}>
              <AegisChat venture={venture} docked />
            </Suspense>
          </div>
        )}
      </div>

      <style>{`
        .dock {
          height: 100%;
          display: flex;
          flex-shrink: 0;
          position: relative;
          transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .dock-minimized {
          width: 48px !important;
        }

        .dock-resize {
          width: 6px;
          height: 100%;
          cursor: col-resize;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          position: relative;
          transition: all 0.15s;
        }
        .dock-resize-line {
          width: 2px;
          height: 40px;
          border-radius: 1px;
          background: var(--border);
          transition: all 0.2s;
        }
        .dock-resize:hover .dock-resize-line,
        .dock-resize.active .dock-resize-line {
          background: var(--cyan);
          height: 60px;
          box-shadow: 0 0 8px var(--cyan-glow);
        }
        .dock-resize:hover, .dock-resize.active {
          background: rgba(0,240,255,0.03);
        }

        .dock-inner {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: linear-gradient(180deg, rgba(6,12,24,0.98), rgba(4,8,18,0.99));
          overflow: hidden;
          min-width: 0;
          border-left: 1px solid rgba(0,240,255,0.06);
        }

        .dock-header {
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 14px;
          border-bottom: 1px solid rgba(0,240,255,0.06);
          background: linear-gradient(180deg, rgba(11,17,33,0.95), rgba(8,14,28,0.9));
          flex-shrink: 0;
          position: relative;
          backdrop-filter: blur(12px);
        }
        .dock-header-glow {
          position: absolute;
          bottom: 0;
          left: 10%;
          right: 10%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0,240,255,0.2), transparent);
        }

        .dock-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .dock-icon-wrap {
          position: relative;
          display: flex;
          align-items: center;
          color: var(--cyan);
        }
        .dock-icon-pulse {
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          background: var(--cyan);
          opacity: 0;
          animation: dock-pulse 3s ease-in-out infinite;
        }
        @keyframes dock-pulse {
          0%, 100% { opacity: 0; transform: scale(0.8); }
          50% { opacity: 0.15; transform: scale(1.4); }
        }

        .dock-label {
          font-family: var(--font-display);
          letter-spacing: 2px;
          font-size: 11px;
          font-weight: 700;
          color: var(--cyan);
          text-shadow: 0 0 8px rgba(0,240,255,0.3);
        }

        .dock-controls {
          display: flex;
          align-items: center;
          gap: 2px;
        }
        .dock-ctrl-btn {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-sm);
          color: var(--text-muted);
          cursor: pointer;
          background: none;
          border: none;
          transition: all 0.15s;
          font-size: 14px;
        }
        .dock-ctrl-btn:hover {
          color: var(--text-primary);
          background: rgba(0,240,255,0.06);
        }
        .dock-expand-btn {
          margin-top: 4px;
          color: var(--cyan);
        }

        .dock-body {
          flex: 1;
          overflow: hidden;
        }

        .dock-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--text-muted);
          font-size: 11px;
          font-family: var(--font-mono);
        }

        .dock-minimized .dock-inner {
          align-items: center;
        }
        .dock-minimized .dock-header {
          flex-direction: column;
          padding: 10px 0;
          height: auto;
          gap: 8px;
        }
      `}</style>
    </div>
  );
}
