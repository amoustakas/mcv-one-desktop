import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Save, Trash2, ChevronDown, Pin, PinOff,
  RotateCcw, Check, ToggleLeft, ToggleRight, Pencil,
} from 'lucide-react';
import {
  useWorkspaceStore, LAYOUT_TEMPLATES, countPanels, type LayoutNode,
} from '../stores/workspace';
import { cn } from '../lib/utils';

// ═══════════════════════════════════════════════
// SVG Thumbnails
// ═══════════════════════════════════════════════

function LayoutThumb({ templateId, isActive }: { templateId: string; isActive: boolean }) {
  const w = 36;
  const h = 24;
  const gap = 1.5;
  const r = 1.5;
  const fill = isActive ? 'rgba(0, 240, 255, 0.35)' : 'rgba(255, 255, 255, 0.08)';
  const stroke = isActive ? 'rgba(0, 240, 255, 0.6)' : 'rgba(255, 255, 255, 0.15)';

  const rects: JSX.Element[] = [];
  switch (templateId) {
    case 'single':
      rects.push(<rect key="a" x={0.5} y={0.5} width={w-1} height={h-1} rx={r} fill={fill} stroke={stroke} strokeWidth={0.8}/>);
      break;
    case '2-h':
      rects.push(<rect key="a" x={0.5} y={0.5} width={w/2-gap} height={h-1} rx={r} fill={fill} stroke={stroke} strokeWidth={0.8}/>);
      rects.push(<rect key="b" x={w/2+gap/2} y={0.5} width={w/2-gap} height={h-1} rx={r} fill={fill} stroke={stroke} strokeWidth={0.8}/>);
      break;
    case '2-v':
      rects.push(<rect key="a" x={0.5} y={0.5} width={w-1} height={h/2-gap} rx={r} fill={fill} stroke={stroke} strokeWidth={0.8}/>);
      rects.push(<rect key="b" x={0.5} y={h/2+gap/2} width={w-1} height={h/2-gap} rx={r} fill={fill} stroke={stroke} strokeWidth={0.8}/>);
      break;
    case '3-right': {
      const mw = w*0.6-gap, sw = w*0.4-gap;
      rects.push(<rect key="a" x={0.5} y={0.5} width={mw} height={h-1} rx={r} fill={fill} stroke={stroke} strokeWidth={0.8}/>);
      rects.push(<rect key="b" x={mw+gap+0.5} y={0.5} width={sw} height={h/2-gap} rx={r} fill={fill} stroke={stroke} strokeWidth={0.8}/>);
      rects.push(<rect key="c" x={mw+gap+0.5} y={h/2+gap/2} width={sw} height={h/2-gap} rx={r} fill={fill} stroke={stroke} strokeWidth={0.8}/>);
      break;
    }
    case '3-bottom': {
      const th = h*0.6-gap, bh = h*0.4-gap;
      rects.push(<rect key="a" x={0.5} y={0.5} width={w/2-gap} height={th} rx={r} fill={fill} stroke={stroke} strokeWidth={0.8}/>);
      rects.push(<rect key="b" x={w/2+gap/2} y={0.5} width={w/2-gap} height={th} rx={r} fill={fill} stroke={stroke} strokeWidth={0.8}/>);
      rects.push(<rect key="c" x={0.5} y={th+gap+0.5} width={w-1} height={bh} rx={r} fill={fill} stroke={stroke} strokeWidth={0.8}/>);
      break;
    }
    case '4-grid':
      rects.push(<rect key="a" x={0.5} y={0.5} width={w/2-gap} height={h/2-gap} rx={r} fill={fill} stroke={stroke} strokeWidth={0.8}/>);
      rects.push(<rect key="b" x={w/2+gap/2} y={0.5} width={w/2-gap} height={h/2-gap} rx={r} fill={fill} stroke={stroke} strokeWidth={0.8}/>);
      rects.push(<rect key="c" x={0.5} y={h/2+gap/2} width={w/2-gap} height={h/2-gap} rx={r} fill={fill} stroke={stroke} strokeWidth={0.8}/>);
      rects.push(<rect key="d" x={w/2+gap/2} y={h/2+gap/2} width={w/2-gap} height={h/2-gap} rx={r} fill={fill} stroke={stroke} strokeWidth={0.8}/>);
      break;
    case '4-focus': {
      const mw = w*0.55-gap, sw = w*0.45-gap;
      rects.push(<rect key="a" x={0.5} y={0.5} width={mw} height={h-1} rx={r} fill={fill} stroke={stroke} strokeWidth={0.8}/>);
      rects.push(<rect key="b" x={mw+gap+0.5} y={0.5} width={sw} height={h*0.33-gap} rx={r} fill={fill} stroke={stroke} strokeWidth={0.8}/>);
      rects.push(<rect key="c" x={mw+gap+0.5} y={h*0.33+0.5} width={sw} height={h*0.33-gap} rx={r} fill={fill} stroke={stroke} strokeWidth={0.8}/>);
      rects.push(<rect key="d" x={mw+gap+0.5} y={h*0.66+0.5} width={sw} height={h*0.34-gap} rx={r} fill={fill} stroke={stroke} strokeWidth={0.8}/>);
      break;
    }
    default:
      rects.push(<rect key="a" x={0.5} y={0.5} width={w-1} height={h-1} rx={r} fill={fill} stroke={stroke} strokeWidth={0.8}/>);
  }
  return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>{rects}</svg>;
}

function LiveLayoutThumb({ layout, size = 32, accent }: { layout: LayoutNode; size?: number; accent?: boolean }) {
  const aspect = 1.5;
  const w = size * aspect;
  const h = size;
  const gap = 1;
  const fillBase = accent ? 'rgba(0, 240, 255, 0.25)' : 'rgba(255, 255, 255, 0.08)';
  const strokeBase = accent ? 'rgba(0, 240, 255, 0.5)' : 'rgba(255, 255, 255, 0.18)';

  function renderNode(node: LayoutNode, x: number, y: number, nw: number, nh: number): JSX.Element[] {
    if (node.type === 'view') {
      return [<rect key={node.id} x={x} y={y} width={Math.max(2, nw)} height={Math.max(2, nh)} rx={1} fill={fillBase} stroke={strokeBase} strokeWidth={0.5}/>];
    }
    const isH = node.direction === 'horizontal';
    const r = node.ratio;
    if (isH) {
      const w1 = nw * r - gap / 2, w2 = nw * (1 - r) - gap / 2;
      return [...renderNode(node.children[0], x, y, w1, nh), ...renderNode(node.children[1], x + w1 + gap, y, w2, nh)];
    } else {
      const h1 = nh * r - gap / 2, h2 = nh * (1 - r) - gap / 2;
      return [...renderNode(node.children[0], x, y, nw, h1), ...renderNode(node.children[1], x, y + h1 + gap, nw, h2)];
    }
  }

  return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>{renderNode(layout, 0.5, 0.5, w - 1, h - 1)}</svg>;
}

// ═══════════════════════════════════════════════
// Persisted saved layouts
// ═══════════════════════════════════════════════

interface SavedLayout {
  id: string;
  name: string;
  layout: LayoutNode;
  pinned?: boolean;
  createdAt: number;
}

interface LayoutPickerSettings {
  autosave: boolean;
}

const STORAGE_KEY = 'mcv-saved-layouts';
const SETTINGS_KEY = 'mcv-layout-picker-settings';

function loadSavedLayouts(): SavedLayout[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function persistSavedLayouts(layouts: SavedLayout[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(layouts));
}
function loadSettings(): LayoutPickerSettings {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); } catch { return { autosave: true }; }
}
function persistSettings(s: LayoutPickerSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

// ═══════════════════════════════════════════════
// Main Component — Grouped Button
// ═══════════════════════════════════════════════

export default function LayoutPicker() {
  const { applyTemplate, activeTemplateId, layout, setLayout } = useWorkspaceStore();
  const panelCount = countPanels(layout);
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState<SavedLayout[]>([]);
  const [settings, setSettings] = useState<LayoutPickerSettings>({ autosave: true });
  const [saveName, setSaveName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  // Derive active layout label
  const activeTemplate = LAYOUT_TEMPLATES.find(t => t.id === activeTemplateId);
  const activeLabel = activeTemplate?.name || `${panelCount}P Custom`;

  useEffect(() => {
    setSaved(loadSavedLayouts());
    setSettings({ autosave: true, ...loadSettings() });
  }, []);

  // Autosave: persist layout snapshot when it changes (debounced)
  useEffect(() => {
    if (!settings.autosave) return;
    const timer = setTimeout(() => {
      localStorage.setItem('mcv-layout-autosave', JSON.stringify(layout));
    }, 500);
    return () => clearTimeout(timer);
  }, [layout, settings.autosave]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setShowSaveForm(false); setEditingId(null); }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // ── Handlers ──

  const toggleAutosave = useCallback(() => {
    const next = { ...settings, autosave: !settings.autosave };
    setSettings(next);
    persistSettings(next);
  }, [settings]);

  const handleSave = useCallback(() => {
    if (!saveName.trim()) return;
    const entry: SavedLayout = {
      id: `saved-${Date.now()}`,
      name: saveName.trim(),
      layout: JSON.parse(JSON.stringify(layout)),
      createdAt: Date.now(),
    };
    const next = [...saved, entry];
    setSaved(next);
    persistSavedLayouts(next);
    setSaveName('');
    setShowSaveForm(false);
  }, [saveName, layout, saved]);

  const handleDelete = useCallback((id: string) => {
    const next = saved.filter(l => l.id !== id);
    setSaved(next);
    persistSavedLayouts(next);
  }, [saved]);

  const handleRename = useCallback((id: string) => {
    if (!editName.trim()) { setEditingId(null); return; }
    const next = saved.map(l => l.id === id ? { ...l, name: editName.trim() } : l);
    setSaved(next);
    persistSavedLayouts(next);
    setEditingId(null);
  }, [editName, saved]);

  const handleTogglePin = useCallback((id: string) => {
    const next = saved.map(l => l.id === id ? { ...l, pinned: !l.pinned } : l);
    setSaved(next);
    persistSavedLayouts(next);
  }, [saved]);

  const handleApply = useCallback((s: SavedLayout) => {
    setLayout(JSON.parse(JSON.stringify(s.layout)));
    setOpen(false);
  }, [setLayout]);

  // Partition saved layouts
  const pinnedLayouts = saved.filter(l => l.pinned);
  const unpinnedLayouts = saved.filter(l => !l.pinned);
  const canSave = !settings.autosave;

  return (
    <div className="lp-root" ref={ref}>
      {/* ── Grouped Button ── */}
      <div className="lp-group">
        {/* Live thumbnail */}
        <button
          className={cn('lp-group-thumb', open && 'active')}
          onClick={() => setOpen(!open)}
          title="Layouts"
        >
          <LiveLayoutThumb layout={layout} size={16} accent={panelCount > 1} />
        </button>

        {/* Active layout name */}
        <button
          className={cn('lp-group-label', open && 'active')}
          onClick={() => setOpen(!open)}
        >
          <span className="lp-group-name">{activeLabel}</span>
          <ChevronDown size={9} className={cn('lp-chevron', open && 'open')} />
        </button>

        {/* Save button (only when autosave is OFF) */}
        {canSave && (
          <button
            className="lp-group-save"
            onClick={() => { setOpen(true); setShowSaveForm(true); }}
            title="Save current layout"
          >
            <Save size={11} />
          </button>
        )}
      </div>

      {/* ── Popover Panel ── */}
      {open && (
        <div className="lp-panel">
          {/* Pinned Layouts */}
          {pinnedLayouts.length > 0 && (
            <>
              <div className="lp-section-label">Pinned</div>
              <div className="lp-saved-list">
                {pinnedLayouts.map(s => (
                  <SavedLayoutRow
                    key={s.id} item={s}
                    isEditing={editingId === s.id} editName={editName}
                    onApply={() => handleApply(s)}
                    onDelete={() => handleDelete(s.id)}
                    onTogglePin={() => handleTogglePin(s.id)}
                    onStartEdit={() => { setEditingId(s.id); setEditName(s.name); }}
                    onEditChange={setEditName}
                    onEditCommit={() => handleRename(s.id)}
                    onEditCancel={() => setEditingId(null)}
                  />
                ))}
              </div>
              <div className="lp-divider" />
            </>
          )}

          {/* Active Layouts (Templates) */}
          <div className="lp-section-label">Layouts</div>
          <div className="lp-grid">
            {LAYOUT_TEMPLATES.map(t => (
              <button
                key={t.id}
                className={cn('lp-template', activeTemplateId === t.id && 'active')}
                onClick={() => { applyTemplate(t.id); setOpen(false); }}
                title={`${t.name} — ${t.description}`}
              >
                <LayoutThumb templateId={t.id} isActive={activeTemplateId === t.id} />
                <span className="lp-template-name">{t.name}</span>
              </button>
            ))}
          </div>

          {/* Saved Layouts */}
          {unpinnedLayouts.length > 0 && (
            <>
              <div className="lp-divider" />
              <div className="lp-section-label">Saved</div>
              <div className="lp-saved-list">
                {unpinnedLayouts.map(s => (
                  <SavedLayoutRow
                    key={s.id} item={s}
                    isEditing={editingId === s.id} editName={editName}
                    onApply={() => handleApply(s)}
                    onDelete={() => handleDelete(s.id)}
                    onTogglePin={() => handleTogglePin(s.id)}
                    onStartEdit={() => { setEditingId(s.id); setEditName(s.name); }}
                    onEditChange={setEditName}
                    onEditCommit={() => handleRename(s.id)}
                    onEditCancel={() => setEditingId(null)}
                  />
                ))}
              </div>
            </>
          )}

          {/* Save Form */}
          <div className="lp-divider" />
          {showSaveForm ? (
            <div className="lp-save-form">
              <input
                className="lp-save-input"
                placeholder="Layout name..."
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setShowSaveForm(false); }}
                autoFocus
              />
              <button className="lp-save-btn" onClick={handleSave} disabled={!saveName.trim()}>Save</button>
            </div>
          ) : (
            <button className="lp-action-btn lp-action-full" onClick={() => setShowSaveForm(true)}>
              <Save size={11} /> Save Current Layout
            </button>
          )}

          {/* Footer: autosave toggle + reset */}
          <div className="lp-footer">
            <button className="lp-footer-btn" onClick={toggleAutosave} title={settings.autosave ? 'Autosave is ON' : 'Autosave is OFF'}>
              {settings.autosave ? <ToggleRight size={14} className="lp-toggle-on" /> : <ToggleLeft size={14} />}
              <span>Autosave</span>
            </button>
            <button className="lp-footer-btn" onClick={() => { applyTemplate('single'); setOpen(false); }} title="Reset to single panel">
              <RotateCcw size={11} /> Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Saved Layout Row ──
function SavedLayoutRow({ item, isEditing, editName, onApply, onDelete, onTogglePin, onStartEdit, onEditChange, onEditCommit, onEditCancel }: {
  item: SavedLayout;
  isEditing: boolean;
  editName: string;
  onApply: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
  onStartEdit: () => void;
  onEditChange: (v: string) => void;
  onEditCommit: () => void;
  onEditCancel: () => void;
}) {
  return (
    <div className={cn('lp-saved-item', item.pinned && 'pinned')}>
      <button className="lp-saved-apply" onClick={onApply}>
        <LiveLayoutThumb layout={item.layout} size={14} />
        {isEditing ? (
          <input
            className="lp-edit-input"
            value={editName}
            onChange={e => onEditChange(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') onEditCommit(); if (e.key === 'Escape') onEditCancel(); }}
            onClick={e => e.stopPropagation()}
            autoFocus
          />
        ) : (
          <span className="lp-saved-name">{item.name}</span>
        )}
        <span className="lp-saved-meta">{countPanels(item.layout)}p</span>
      </button>
      <div className="lp-saved-actions">
        <button className="lp-saved-action" onClick={onTogglePin} title={item.pinned ? 'Unpin' : 'Pin'}>
          {item.pinned ? <PinOff size={10} /> : <Pin size={10} />}
        </button>
        <button className="lp-saved-action" onClick={onStartEdit} title="Rename">
          <Pencil size={10} />
        </button>
        <button className="lp-saved-action lp-saved-action-danger" onClick={onDelete} title="Delete">
          <Trash2 size={10} />
        </button>
      </div>
    </div>
  );
}
