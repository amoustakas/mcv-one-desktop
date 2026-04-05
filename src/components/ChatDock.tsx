import { useState, lazy, Suspense } from 'react';
import { MessageSquare, GripVertical } from 'lucide-react';
import { useNavigation } from '../stores/navigation';
import { getVenture, ventures } from '../lib/ventures';
import { Badge } from './ui';
import { cn } from '../lib/utils';
const AegisChat = lazy(() => import('./AegisChat'));

export default function ChatDock() {
  const { chatVenture } = useNavigation();
  const venture = getVenture(chatVenture) ?? ventures[0];
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem('mcv-dock-width');
    return saved ? parseInt(saved) : Math.min(480, Math.floor(window.innerWidth * 0.25));
  });
  const [dragging, setDragging] = useState(false);

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
    <div className="dock" style={{ width }}>
      {/* Resize handle */}
      <div
        className={cn('dock-resize', dragging && 'active')}
        onMouseDown={handleMouseDown}
      >
        <GripVertical size={10} />
      </div>

      <div className="dock-inner">
        <div className="dock-header">
          <div className="dock-title">
            <MessageSquare size={12} />
            <span className="dock-label">Aegis</span>
            <Badge color={venture.color} variant="outline" size="sm">
              {venture.name}
            </Badge>
          </div>
        </div>
        <div className="dock-body">
          <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 11 }}>Loading Aegis...</div>}>
            <AegisChat venture={venture} docked />
          </Suspense>
        </div>
      </div>

      <style>{`
        .dock {
          height: 100%;
          display: flex;
          flex-shrink: 0;
          position: relative;
        }

        .dock-resize {
          width: 6px;
          height: 100%;
          cursor: col-resize;
          display: flex;
          align-items: center;
          justify-content: center;
          color: transparent;
          background: var(--border);
          transition: all 0.15s;
          flex-shrink: 0;
        }

        .dock-resize:hover, .dock-resize.active {
          background: var(--cyan);
          color: var(--bg-deep);
          width: 8px;
        }

        .dock-inner {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: var(--bg-deep);
          overflow: hidden;
          min-width: 0;
        }

        .dock-header {
          height: 40px;
          display: flex;
          align-items: center;
          padding: 0 14px;
          border-bottom: 1px solid var(--border);
          background: var(--bg-surface);
          flex-shrink: 0;
        }

        .dock-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .dock-label {
          font-family: var(--font-display);
          letter-spacing: 0.5px;
        }

        .dock-body {
          flex: 1;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
