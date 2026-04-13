import { useState, useCallback, useRef, useEffect } from 'react';
import {
  X, Columns2, Rows2, Maximize2, Plus, Lock, Pin,
  Unlock, ExternalLink, Trash2,
} from 'lucide-react';
import {
  useWorkspaceStore, type LayoutNode, type PanelNode, type SplitNode,
  type PanelTab, getViewIds, getPanelViewId,
} from '../stores/workspace';
import { type ViewId } from '../stores/navigation';
import { cn } from '../lib/utils';
import { getViewCategory, getViewLabel, getViewIcon } from '../lib/view-meta';

// Forward-declare ViewPanel — imported from App
interface ViewPanelProps { viewId?: ViewId }
let ViewPanelComponent: React.ComponentType<ViewPanelProps> | null = null;
export function setViewPanelComponent(c: React.ComponentType<ViewPanelProps>) { ViewPanelComponent = c; }

// ── Quick view picker (grouped) ──
const VIEW_GROUPS: { label: string; views: ViewId[] }[] = [
  { label: 'Command', views: ['command-center', 'chat', 'naos-command', 'portfolio'] },
  { label: 'Intelligence', views: ['intelligence', 'treasury', 'signals', 'memory'] },
  { label: 'Engineering', views: ['engineering', 'forge', 'sessions', 'war-room', 'ops'] },
  { label: 'Growth', views: ['crm', 'growth', 'comms-hub', 'ad-studio'] },
  { label: 'Operations', views: ['tasks', 'docs', 'files', 'team', 'pipeline'] },
  { label: 'AI Tools', views: ['ai-studio', 'prompt-composer', 'kit-store', 'control-room', 'browser', 'youtube-player'] },
  { label: 'Commerce', views: ['commerce-overview', 'commerce-products', 'commerce-orders', 'commerce-customers'] },
  { label: 'Other', views: ['settings', 'device-hub'] },
];

// ── Tab Context Menu ──
function TabContextMenu({ panel, tab, x, y, onClose }: {
  panel: PanelNode; tab: PanelTab; x: number; y: number; onClose: () => void;
}) {
  const { closeTab, pinTab, unpinTab, addTab } = useWorkspaceStore();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const otherTabs = panel.tabs.filter(t => t.id !== tab.id);

  return (
    <div ref={menuRef} className="ws-context-menu" style={{ left: x, top: y }}>
      {tab.pinned ? (
        <button className="ws-context-item" onClick={() => { unpinTab(panel.id, tab.id); onClose(); }}>
          <Pin size={12} className="ws-context-item-icon" /> Unpin Tab
        </button>
      ) : (
        <button className="ws-context-item" onClick={() => { pinTab(panel.id, tab.id); onClose(); }}>
          <Pin size={12} className="ws-context-item-icon" /> Pin Tab
        </button>
      )}
      <button className="ws-context-item" onClick={() => {
        addTab(panel.id, tab.viewId, { insertAfter: tab.id });
        onClose();
      }}>
        <Plus size={12} className="ws-context-item-icon" /> Duplicate Tab
      </button>
      <div className="ws-context-sep" />
      {!tab.pinned && (
        <button className="ws-context-item" onClick={() => { closeTab(panel.id, tab.id); onClose(); }}>
          <X size={12} className="ws-context-item-icon" /> Close Tab
        </button>
      )}
      {otherTabs.length > 0 && (
        <button className="ws-context-item" onClick={() => {
          otherTabs.forEach(t => { if (!t.pinned) closeTab(panel.id, t.id); });
          onClose();
        }}>
          <X size={12} className="ws-context-item-icon" /> Close Other Tabs
        </button>
      )}
    </div>
  );
}

// ── Panel Context Menu (right-click on tab bar background) ──
function PanelContextMenu({ panel, totalPanels, x, y, onClose }: {
  panel: PanelNode; totalPanels: number; x: number; y: number; onClose: () => void;
}) {
  const { splitPanelWith, closePanel, lockPanel, unlockPanel, pinPanel, unpinPanel, detachPanel } = useWorkspaceStore();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <div ref={menuRef} className="ws-context-menu" style={{ left: x, top: y }}>
      <button className="ws-context-item" onClick={() => { splitPanelWith(panel.id, 'horizontal', 'chat'); onClose(); }}>
        <Columns2 size={12} className="ws-context-item-icon" /> Split Right
      </button>
      <button className="ws-context-item" onClick={() => { splitPanelWith(panel.id, 'vertical', 'chat'); onClose(); }}>
        <Rows2 size={12} className="ws-context-item-icon" /> Split Down
      </button>
      <div className="ws-context-sep" />
      {totalPanels > 1 && (
        <button className="ws-context-item" onClick={() => {
          useWorkspaceStore.getState().setLayout({ ...panel });
          onClose();
        }}>
          <Maximize2 size={12} className="ws-context-item-icon" /> Maximize Panel
        </button>
      )}
      <button className="ws-context-item" onClick={() => { detachPanel(panel.id); onClose(); }}>
        <ExternalLink size={12} className="ws-context-item-icon" /> Detach to Float
      </button>
      <div className="ws-context-sep" />
      {panel.locked ? (
        <button className="ws-context-item" onClick={() => { unlockPanel(panel.id); onClose(); }}>
          <Unlock size={12} className="ws-context-item-icon" /> Unlock Panel
        </button>
      ) : (
        <button className="ws-context-item" onClick={() => { lockPanel(panel.id); onClose(); }}>
          <Lock size={12} className="ws-context-item-icon" /> Lock Panel
        </button>
      )}
      {panel.pinned ? (
        <button className="ws-context-item" onClick={() => { unpinPanel(panel.id); onClose(); }}>
          <Pin size={12} className="ws-context-item-icon" /> Unpin Panel
        </button>
      ) : (
        <button className="ws-context-item" onClick={() => { pinPanel(panel.id); onClose(); }}>
          <Pin size={12} className="ws-context-item-icon" /> Pin Panel
        </button>
      )}
      {totalPanels > 1 && !panel.locked && (
        <>
          <div className="ws-context-sep" />
          <button className="ws-context-item danger" onClick={() => { closePanel(panel.id); onClose(); }}>
            <Trash2 size={12} className="ws-context-item-icon" /> Close Panel
          </button>
        </>
      )}
    </div>
  );
}

// ── Panel Tab Bar ──
function PanelTabBar({ panel, totalPanels }: { panel: PanelNode; totalPanels: number }) {
  const {
    setActiveTab, closeTab, addTab, reorderTab, moveTab,
    splitPanelWith, closePanel, detachPanel, setActivePanel,
  } = useWorkspaceStore();
  const [showPicker, setShowPicker] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ tab: PanelTab; x: number; y: number } | null>(null);
  const [panelMenu, setPanelMenu] = useState<{ x: number; y: number } | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeViewId = getPanelViewId(panel);

  function handleTabDragStart(e: React.DragEvent, tab: PanelTab) {
    e.dataTransfer.setData('text/plain', JSON.stringify({ tabId: tab.id, panelId: panel.id }));
    e.dataTransfer.effectAllowed = 'move';
    (e.target as HTMLElement).classList.add('dragging');
  }

  function handleTabDragEnd(e: React.DragEvent) {
    (e.target as HTMLElement).classList.remove('dragging');
    setDragOverIdx(null);
  }

  function handleTabDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIdx(idx);
  }

  function handleTabDrop(e: React.DragEvent, dropIdx: number) {
    e.preventDefault();
    setDragOverIdx(null);
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (data.panelId === panel.id) {
        reorderTab(panel.id, data.tabId, dropIdx);
      } else {
        moveTab(data.panelId, data.tabId, panel.id, dropIdx);
      }
    } catch { /* ignore bad drag data */ }
  }

  return (
    <div
      className="ws-tab-bar"
      onClick={() => setActivePanel(panel.id)}
      onDoubleClick={(e) => {
        // Double-click on tab bar background → detach to floating
        if (!(e.target as HTMLElement).closest('.ws-tab, .ws-panel-btn, .ws-tab-add')) {
          detachPanel(panel.id);
        }
      }}
      onContextMenu={(e) => {
        // Right-click on tab bar background → panel context menu
        if (!(e.target as HTMLElement).closest('.ws-tab')) {
          e.preventDefault();
          setPanelMenu({ x: e.clientX, y: e.clientY });
        }
      }}
    >
      {/* Tabs scroll area */}
      <div
        className="ws-tab-scroll"
        ref={scrollRef}
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
        onDrop={(e) => handleTabDrop(e, panel.tabs.length)}
      >
        {panel.tabs.map((tab, idx) => {
          const Icon = getViewIcon(tab.viewId);
          const label = tab.label || getViewLabel(tab.viewId);
          const isActive = tab.id === panel.activeTabId;
          const category = getViewCategory(tab.viewId);

          return (
            <div key={tab.id} style={{ position: 'relative', display: 'flex' }}>
              {dragOverIdx === idx && <div className="ws-tab-drop-indicator" style={{ left: 0 }} />}
              <button
                className={cn('ws-tab', isActive && 'active', tab.pinned && 'pinned')}
                data-category={category}
                draggable={!panel.locked}
                onClick={() => setActiveTab(panel.id, tab.id)}
                onDragStart={(e) => handleTabDragStart(e, tab)}
                onDragEnd={handleTabDragEnd}
                onDragOver={(e) => handleTabDragOver(e, idx)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({ tab, x: e.clientX, y: e.clientY });
                }}
                title={label}
              >
                <Icon size={11} className="ws-tab-icon" />
                {!tab.pinned && <span className="ws-tab-label">{label}</span>}
                {!tab.pinned && !panel.locked && (
                  <span
                    className="ws-tab-close"
                    onClick={(e) => { e.stopPropagation(); closeTab(panel.id, tab.id); }}
                  >
                    <X size={9} />
                  </span>
                )}
              </button>
            </div>
          );
        })}
        {dragOverIdx === panel.tabs.length && (
          <div className="ws-tab-drop-indicator" style={{ position: 'relative' }} />
        )}
      </div>

      {/* New tab button */}
      {!panel.locked && (
        <button className="ws-tab-add" onClick={() => setShowPicker(!showPicker)} title="New tab">
          <Plus size={12} />
        </button>
      )}

      {/* Panel actions */}
      <div className="ws-tab-actions">
        {panel.locked && (
          <span className="ws-lock-badge" title="Locked">
            <Lock size={10} />
          </span>
        )}
        <button className="ws-panel-btn" onClick={() => splitPanelWith(panel.id, 'horizontal', 'chat')} title="Split right">
          <Columns2 size={11} />
        </button>
        <button className="ws-panel-btn" onClick={() => splitPanelWith(panel.id, 'vertical', 'chat')} title="Split down">
          <Rows2 size={11} />
        </button>
        {totalPanels > 1 && !panel.locked && (
          <>
            <button className="ws-panel-btn" onClick={() => {
              const store = useWorkspaceStore.getState();
              store.setLayout({ ...panel });
            }} title="Maximize">
              <Maximize2 size={11} />
            </button>
            <button className="ws-panel-btn ws-panel-close" onClick={() => closePanel(panel.id)} title="Close panel">
              <X size={11} />
            </button>
          </>
        )}
      </div>

      {/* View picker dropdown */}
      {showPicker && (
        <div className="ws-view-picker" onClick={e => e.stopPropagation()}>
          {VIEW_GROUPS.map(group => (
            <div key={group.label} className="ws-view-picker-group">
              <div className="ws-view-picker-label">{group.label}</div>
              {group.views.map(v => {
                const VIcon = getViewIcon(v);
                return (
                  <button
                    key={v}
                    className={cn('ws-view-option', v === activeViewId && 'active')}
                    onClick={() => { addTab(panel.id, v); setShowPicker(false); }}
                  >
                    <VIcon size={12} className="ws-view-option-icon" />
                    {getViewLabel(v)}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Tab context menu */}
      {contextMenu && (
        <TabContextMenu
          panel={panel}
          tab={contextMenu.tab}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Panel context menu (right-click on tab bar background) */}
      {panelMenu && (
        <PanelContextMenu
          panel={panel}
          totalPanels={totalPanels}
          x={panelMenu.x}
          y={panelMenu.y}
          onClose={() => setPanelMenu(null)}
        />
      )}
    </div>
  );
}

// ── Panel ──
function Panel({ panel, totalPanels }: { panel: PanelNode; totalPanels: number }) {
  const activePanelId = useWorkspaceStore(s => s.activePanelId);
  const isActive = activePanelId === panel.id;
  const viewId = getPanelViewId(panel);

  return (
    <div
      className={cn('ws-panel', isActive && 'ws-panel-active', panel.locked && 'locked')}
      onClick={() => useWorkspaceStore.getState().setActivePanel(panel.id)}
    >
      <PanelTabBar panel={panel} totalPanels={totalPanels} />
      <div className="ws-panel-content">
        {ViewPanelComponent ? <ViewPanelComponent viewId={viewId} /> : <div>Loading...</div>}
      </div>
    </div>
  );
}

// ── Split Divider ──
function SplitDivider({ split, isFirst }: { split: SplitNode; isFirst: boolean }) {
  const setSplitRatio = useWorkspaceStore(s => s.setSplitRatio);
  const [dragging, setDragging] = useState(false);

  const handleMouseDown = useCallback(() => {
    setDragging(true);
    // Set cursor on body to prevent flicker over iframes
    document.body.style.cursor = split.direction === 'horizontal' ? 'col-resize' : 'row-resize';

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
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [split.id, split.direction, setSplitRatio]);

  const handleDoubleClick = useCallback(() => {
    // Double-click to equalize split
    setSplitRatio(split.id, 0.5);
  }, [split.id, setSplitRatio]);

  if (!isFirst) return null;

  const isH = split.direction === 'horizontal';
  return (
    <div
      className={cn('ws-divider', isH ? 'ws-divider-h' : 'ws-divider-v', dragging && 'active')}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      <div className="ws-divider-dots">
        <span className="ws-divider-dot" />
        <span className="ws-divider-dot" />
        <span className="ws-divider-dot" />
      </div>
    </div>
  );
}

// ── Recursive Layout Renderer ──
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

// ── Floating Panels ──
function FloatingPanels() {
  const floatingPanels = useWorkspaceStore(s => s.floatingPanels);
  if (floatingPanels.length === 0) return null;

  return (
    <>
      {floatingPanels.map(fp => (
        <FloatingPanelComponent key={fp.id} panel={fp} />
      ))}
    </>
  );
}

function FloatingPanelComponent({ panel }: { panel: import('../stores/workspace').FloatingPanel }) {
  const { updateFloatingPanel, closeFloatingPanel, bringToFront } = useWorkspaceStore();
  const [dragging, setDragging] = useState(false);

  const handleTitleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.ws-tab, .ws-panel-btn, .ws-tab-add')) return;
    e.preventDefault();
    bringToFront(panel.id);
    setDragging(true);
    const startX = e.clientX - panel.x;
    const startY = e.clientY - panel.y;

    function onMove(ev: MouseEvent) {
      updateFloatingPanel(panel.id, {
        x: Math.max(0, Math.min(window.innerWidth - 100, ev.clientX - startX)),
        y: Math.max(0, Math.min(window.innerHeight - 50, ev.clientY - startY)),
      });
    }
    function onUp() {
      setDragging(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [panel.id, panel.x, panel.y, bringToFront, updateFloatingPanel]);

  // Resize handles
  const handleResize = useCallback((e: React.MouseEvent, edge: string) => {
    e.preventDefault();
    e.stopPropagation();
    bringToFront(panel.id);
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = panel.width;
    const startH = panel.height;
    const startPX = panel.x;
    const startPY = panel.y;

    function onMove(ev: MouseEvent) {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      const updates: Partial<typeof panel> = {};

      if (edge.includes('e')) updates.width = Math.max(300, Math.min(1200, startW + dx));
      if (edge.includes('w')) { updates.width = Math.max(300, Math.min(1200, startW - dx)); updates.x = startPX + dx; }
      if (edge.includes('s')) updates.height = Math.max(200, Math.min(900, startH + dy));
      if (edge.includes('n')) { updates.height = Math.max(200, Math.min(900, startH - dy)); updates.y = startPY + dy; }

      updateFloatingPanel(panel.id, updates);
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [panel, bringToFront, updateFloatingPanel]);

  const activeTab = panel.tabs.find(t => t.id === panel.activeTabId) ?? panel.tabs[0];
  const viewId = activeTab?.viewId ?? 'command-center';

  return (
    <div
      className={cn('ws-floating', panel.minimized && 'minimized')}
      style={{ left: panel.x, top: panel.y, width: panel.width, height: panel.minimized ? 'auto' : panel.height, zIndex: panel.zIndex }}
      onMouseDown={() => bringToFront(panel.id)}
    >
      {/* Resize handles */}
      {!panel.minimized && (
        <>
          <div className="ws-float-resize ws-float-resize-n" onMouseDown={(e) => handleResize(e, 'n')} />
          <div className="ws-float-resize ws-float-resize-s" onMouseDown={(e) => handleResize(e, 's')} />
          <div className="ws-float-resize ws-float-resize-e" onMouseDown={(e) => handleResize(e, 'e')} />
          <div className="ws-float-resize ws-float-resize-w" onMouseDown={(e) => handleResize(e, 'w')} />
          <div className="ws-float-resize ws-float-resize-ne" onMouseDown={(e) => handleResize(e, 'ne')} />
          <div className="ws-float-resize ws-float-resize-nw" onMouseDown={(e) => handleResize(e, 'nw')} />
          <div className="ws-float-resize ws-float-resize-se" onMouseDown={(e) => handleResize(e, 'se')} />
          <div className="ws-float-resize ws-float-resize-sw" onMouseDown={(e) => handleResize(e, 'sw')} />
        </>
      )}

      {/* Title bar */}
      <div className="ws-tab-bar" onMouseDown={handleTitleMouseDown} style={{ cursor: dragging ? 'grabbing' : 'grab' }}>
        <div className="ws-float-drag-texture">
          <span className="ws-float-drag-line" />
          <span className="ws-float-drag-line" />
          <span className="ws-float-drag-line" />
        </div>
        <div className="ws-tab-scroll">
          {panel.tabs.map(tab => {
            const TIcon = getViewIcon(tab.viewId);
            const isActive = tab.id === panel.activeTabId;
            return (
              <button
                key={tab.id}
                className={cn('ws-tab', isActive && 'active', tab.pinned && 'pinned')}
                data-category={getViewCategory(tab.viewId)}
                onClick={() => updateFloatingPanel(panel.id, { activeTabId: tab.id })}
              >
                <TIcon size={11} className="ws-tab-icon" />
                {!tab.pinned && <span className="ws-tab-label">{tab.label || getViewLabel(tab.viewId)}</span>}
              </button>
            );
          })}
        </div>
        <div className="ws-tab-actions">
          <button className="ws-panel-btn" onClick={() => updateFloatingPanel(panel.id, { minimized: !panel.minimized })} title={panel.minimized ? 'Restore' : 'Minimize'}>
            <Maximize2 size={11} />
          </button>
          <button className="ws-panel-btn ws-panel-close" onClick={() => closeFloatingPanel(panel.id)} title="Close">
            <X size={11} />
          </button>
        </div>
      </div>

      {/* Content */}
      {!panel.minimized && (
        <div className="ws-panel-content" style={{ flex: 1, overflow: 'hidden' }}>
          {ViewPanelComponent ? <ViewPanelComponent viewId={viewId} /> : <div>Loading...</div>}
        </div>
      )}
    </div>
  );
}

// ── Root ──
export default function WorkspaceRenderer() {
  const layout = useWorkspaceStore(s => s.layout);
  const totalPanels = getViewIds(layout).length;

  return (
    <div className="ws-root">
      <LayoutRenderer node={layout} totalPanels={totalPanels} />
      <FloatingPanels />
    </div>
  );
}
