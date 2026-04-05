import { useState, useCallback } from 'react';
import { X, Columns2, Rows2, Maximize2, ChevronDown } from 'lucide-react';
import { useWorkspaceStore, type LayoutNode, type PanelNode, type SplitNode, getViewIds } from '../stores/workspace';
import { type ViewId } from '../stores/navigation';
import { cn } from '../lib/utils';

// Forward-declare ViewPanel — imported from App
interface ViewPanelProps { viewId?: ViewId }
let ViewPanelComponent: React.ComponentType<ViewPanelProps> | null = null;
export function setViewPanelComponent(c: React.ComponentType<ViewPanelProps>) { ViewPanelComponent = c; }

const VIEW_LABELS: Record<string, string> = {
  'command-center': 'Command Center', portfolio: 'Portfolio', chat: 'Chat',
  intelligence: 'Intelligence', treasury: 'Treasury', signals: 'Signals',
  engineering: 'Engineering', ops: 'Operations', forge: 'Forge',
  sessions: 'Sessions', 'war-room': 'War Room', crm: 'CRM',
  growth: 'Growth', tasks: 'Tasks', docs: 'Documents',
  'ai-studio': 'AI Studio', 'prompt-composer': 'Prompt Composer',
  team: 'Team', settings: 'Settings', 'kit-store': 'Kit Store',
  memory: 'Memory Hub', pipeline: 'Pipeline',
};

// ── Quick view picker for panels ──
const QUICK_VIEWS: ViewId[] = [
  'command-center', 'chat', 'tasks', 'docs', 'crm', 'engineering',
  'war-room', 'signals', 'portfolio', 'growth', 'treasury', 'ai-studio',
  'team', 'pipeline', 'memory', 'settings',
];

function PanelHeader({ panel, totalPanels }: { panel: PanelNode; totalPanels: number }) {
  const { setPanelView, splitPanelWith, closePanel, setActivePanel } = useWorkspaceStore();
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="ws-panel-header" onClick={() => setActivePanel(panel.id)}>
      <button className="ws-panel-title" onClick={() => setShowPicker(!showPicker)}>
        <span>{VIEW_LABELS[panel.viewId] || panel.viewId}</span>
        <ChevronDown size={10} />
      </button>

      <div className="ws-panel-actions">
        <button className="ws-panel-btn" onClick={() => splitPanelWith(panel.id, 'horizontal', 'chat')} title="Split right">
          <Columns2 size={11} />
        </button>
        <button className="ws-panel-btn" onClick={() => splitPanelWith(panel.id, 'vertical', 'chat')} title="Split down">
          <Rows2 size={11} />
        </button>
        {totalPanels > 1 && (
          <>
            <button className="ws-panel-btn" onClick={() => {
              // Maximize — close all other panels
              const store = useWorkspaceStore.getState();
              store.setLayout({ id: panel.id, type: 'view', viewId: panel.viewId });
            }} title="Maximize">
              <Maximize2 size={11} />
            </button>
            <button className="ws-panel-btn ws-panel-close" onClick={() => closePanel(panel.id)} title="Close panel">
              <X size={11} />
            </button>
          </>
        )}
      </div>

      {showPicker && (
        <div className="ws-view-picker" onClick={e => e.stopPropagation()}>
          {QUICK_VIEWS.map(v => (
            <button
              key={v}
              className={cn('ws-view-option', v === panel.viewId && 'active')}
              onClick={() => { setPanelView(panel.id, v); setShowPicker(false); }}
            >
              {VIEW_LABELS[v] || v}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Panel({ panel, totalPanels }: { panel: PanelNode; totalPanels: number }) {
  const activePanelId = useWorkspaceStore(s => s.activePanelId);
  const isActive = activePanelId === panel.id;

  return (
    <div className={cn('ws-panel', isActive && 'ws-panel-active')} onClick={() => useWorkspaceStore.getState().setActivePanel(panel.id)}>
      <PanelHeader panel={panel} totalPanels={totalPanels} />
      <div className="ws-panel-content">
        {ViewPanelComponent ? <ViewPanelComponent viewId={panel.viewId} /> : <div>Loading...</div>}
      </div>
    </div>
  );
}

function SplitDivider({ split, isFirst }: { split: SplitNode; isFirst: boolean }) {
  const setSplitRatio = useWorkspaceStore(s => s.setSplitRatio);
  const [dragging, setDragging] = useState(false);

  const handleMouseDown = useCallback(() => {
    setDragging(true);
    function onMove(e: MouseEvent) {
      const container = document.getElementById(`split-${split.id}`);
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const ratio = split.direction === 'horizontal'
        ? (e.clientX - rect.left) / rect.width
        : (e.clientY - rect.top) / rect.height;
      setSplitRatio(split.id, ratio);
    }
    function onUp() {
      setDragging(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [split.id, split.direction, setSplitRatio]);

  if (!isFirst) return null;

  const isH = split.direction === 'horizontal';
  return (
    <div
      className={cn('ws-divider', isH ? 'ws-divider-h' : 'ws-divider-v', dragging && 'active')}
      onMouseDown={handleMouseDown}
    >
      <div className="ws-divider-handle" />
    </div>
  );
}

function LayoutRenderer({ node, totalPanels }: { node: LayoutNode; totalPanels: number }) {
  if (node.type === 'view') {
    return <Panel panel={node} totalPanels={totalPanels} />;
  }

  const isH = node.direction === 'horizontal';
  const firstStyle = isH
    ? { width: `calc(${node.ratio * 100}% - 3px)` }
    : { height: `calc(${node.ratio * 100}% - 3px)` };
  const secondStyle = isH
    ? { width: `calc(${(1 - node.ratio) * 100}% - 3px)` }
    : { height: `calc(${(1 - node.ratio) * 100}% - 3px)` };

  return (
    <div
      id={`split-${node.id}`}
      className={cn('ws-split', isH ? 'ws-split-h' : 'ws-split-v')}
    >
      <div className="ws-split-child" style={firstStyle}>
        <LayoutRenderer node={node.children[0]} totalPanels={totalPanels} />
      </div>
      <SplitDivider split={node} isFirst={true} />
      <div className="ws-split-child" style={secondStyle}>
        <LayoutRenderer node={node.children[1]} totalPanels={totalPanels} />
      </div>
    </div>
  );
}

export default function WorkspaceRenderer() {
  const layout = useWorkspaceStore(s => s.layout);
  const totalPanels = getViewIds(layout).length;

  return (
    <div className="ws-root">
      <LayoutRenderer node={layout} totalPanels={totalPanels} />

      <style>{`
        .ws-root { flex: 1; display: flex; overflow: hidden; }

        .ws-split { display: flex; flex: 1; overflow: hidden; }
        .ws-split-h { flex-direction: row; }
        .ws-split-v { flex-direction: column; }
        .ws-split-child { overflow: hidden; min-width: 0; min-height: 0; display: flex; }

        .ws-panel { display: flex; flex-direction: column; flex: 1; overflow: hidden; min-width: 0; min-height: 0; border: 1px solid transparent; transition: border-color 0.15s; }
        .ws-panel-active { border-color: rgba(0, 240, 255, 0.15); }

        .ws-panel-header {
          display: flex; align-items: center; justify-content: space-between;
          height: 28px; padding: 0 8px; flex-shrink: 0;
          background: var(--bg-surface); border-bottom: 1px solid var(--border);
          font-size: 10px; position: relative;
        }
        .ws-panel-title {
          display: flex; align-items: center; gap: 4px;
          font-size: 10px; font-weight: 600; color: var(--text-secondary);
          font-family: var(--font-display); text-transform: uppercase; letter-spacing: 0.3px;
        }
        .ws-panel-title:hover { color: var(--cyan); }

        .ws-panel-actions { display: flex; gap: 2px; }
        .ws-panel-btn {
          width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;
          border-radius: 3px; color: var(--text-muted); transition: all 0.1s;
        }
        .ws-panel-btn:hover { background: var(--bg-elevated); color: var(--text-primary); }
        .ws-panel-close:hover { color: var(--error); }

        .ws-panel-content { flex: 1; overflow: hidden; }

        .ws-view-picker {
          position: absolute; top: 100%; left: 0; z-index: 50;
          width: 180px; max-height: 300px; overflow-y: auto;
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: var(--radius-md); box-shadow: 0 8px 32px rgba(0,0,0,0.5);
          padding: 4px 0;
        }
        .ws-view-option {
          display: block; width: 100%; padding: 5px 12px; text-align: left;
          font-size: 11px; color: var(--text-secondary); transition: all 0.1s;
        }
        .ws-view-option:hover { background: var(--bg-elevated); color: var(--text-primary); }
        .ws-view-option.active { color: var(--cyan); background: rgba(0,240,255,0.05); }

        .ws-divider { flex-shrink: 0; background: var(--border); transition: background 0.15s; z-index: 2; }
        .ws-divider-h { width: 6px; cursor: col-resize; }
        .ws-divider-v { height: 6px; cursor: row-resize; }
        .ws-divider:hover, .ws-divider.active { background: var(--cyan); }
        .ws-divider-handle {
          position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
          background: var(--text-muted); border-radius: 1px; opacity: 0.3;
        }
        .ws-divider-h .ws-divider-handle { width: 2px; height: 24px; }
        .ws-divider-v .ws-divider-handle { height: 2px; width: 24px; }
        .ws-divider:hover .ws-divider-handle { opacity: 0; }
      `}</style>
    </div>
  );
}
