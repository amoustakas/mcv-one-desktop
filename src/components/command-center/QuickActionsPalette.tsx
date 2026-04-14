import { useRef, useState } from 'react';
import { Cpu, Plus, X, Check } from 'lucide-react';
import { SectionCard, Button, Popover, Tooltip } from '../ui';
import { useCommandCenter, QUICK_ACTION_META, type QuickActionId } from '../../stores/command-center';
import { useNavigation } from '../../stores/navigation';

/**
 * Drag-reorderable quick actions. Users can add/remove actions via the "+"
 * popover. Order persists to useCommandCenter zustand store.
 */
export default function QuickActionsPalette() {
  const quickActions = useCommandCenter((s) => s.quickActions);
  const addAction = useCommandCenter((s) => s.addQuickAction);
  const removeAction = useCommandCenter((s) => s.removeQuickAction);
  const reorder = useCommandCenter((s) => s.reorderQuickActions);
  const setView = useNavigation((s) => s.setView);

  const addBtnRef = useRef<HTMLButtonElement>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const availableToAdd = (Object.keys(QUICK_ACTION_META) as QuickActionId[]).filter((id) => !quickActions.includes(id));

  return (
    <SectionCard
      title="Quick Actions"
      icon={<Cpu size={14} />}
      description={editing ? 'Drag to reorder · click × to remove' : 'One-click venture shortcuts'}
      action={
        <div style={{ display: 'flex', gap: 4 }}>
          <Button size="sm" variant={editing ? 'primary' : 'ghost'} onClick={() => setEditing((e) => !e)}>
            {editing ? <><Check size={10} /> Done</> : 'Edit'}
          </Button>
          <Tooltip content="Add action">
            <button
              type="button"
              ref={addBtnRef}
              className="qap-add-btn"
              onClick={() => setAddOpen((o) => !o)}
              aria-label="Add quick action"
              disabled={availableToAdd.length === 0}
            >
              <Plus size={12} />
            </button>
          </Tooltip>
        </div>
      }
      padding="sm"
    >
      <div className="qap-grid">
        {quickActions.map((id, i) => {
          const meta = QUICK_ACTION_META[id];
          if (!meta) return null;
          return (
            <div
              key={id}
              draggable={editing}
              onDragStart={() => editing && setDragIdx(i)}
              onDragOver={(e) => { if (editing) e.preventDefault(); }}
              onDrop={() => {
                if (editing && dragIdx !== null && dragIdx !== i) {
                  reorder(dragIdx, i);
                }
                setDragIdx(null);
              }}
              className={`qap-action ${editing ? 'qap-action-editing' : ''} ${dragIdx === i ? 'qap-action-dragging' : ''}`}
            >
              <button
                type="button"
                className="qap-action-btn holo-hover"
                onClick={() => !editing && setView(meta.view as Parameters<typeof setView>[0])}
              >
                {meta.label}
              </button>
              {editing && (
                <button type="button" className="qap-action-remove" onClick={() => removeAction(id)} aria-label={`Remove ${meta.label}`}>
                  <X size={10} />
                </button>
              )}
            </div>
          );
        })}
        {quickActions.length === 0 && (
          <p className="qap-empty">No quick actions yet. Click + to add some.</p>
        )}
      </div>

      <Popover open={addOpen} onClose={() => setAddOpen(false)} anchorRef={addBtnRef} align="end">
        <div className="qap-add-menu">
          <span className="qap-add-label">Add action</span>
          {availableToAdd.length === 0 ? (
            <span className="qap-add-empty">All actions added</span>
          ) : (
            availableToAdd.map((id) => (
              <button
                key={id}
                type="button"
                className="qap-add-item"
                onClick={() => { addAction(id); setAddOpen(false); }}
              >
                {QUICK_ACTION_META[id].label}
              </button>
            ))
          )}
        </div>
      </Popover>

      <style>{`
        .qap-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 6px; }
        .qap-action { position: relative; }
        .qap-action-btn { width: 100%; padding: 10px 12px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-secondary); font-size: 11px; font-weight: 500; transition: all var(--transition-fast); }
        .qap-action-btn:hover { color: var(--cyan); border-color: var(--border-active); box-shadow: 0 0 12px rgba(0,240,255,0.06); }
        .qap-action-editing .qap-action-btn { cursor: grab; border-style: dashed; }
        .qap-action-dragging .qap-action-btn { opacity: 0.4; }
        .qap-action-remove { position: absolute; top: -6px; right: -6px; width: 18px; height: 18px; background: var(--error); color: white; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; box-shadow: var(--elev-2); }
        .qap-action-remove:hover { transform: scale(1.15); }
        .qap-empty { grid-column: 1 / -1; font-size: 11px; color: var(--text-muted); text-align: center; padding: 16px; }
        .qap-add-btn { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: var(--radius-sm); color: var(--cyan); background: rgba(0, 240, 255, 0.08); border: 1px solid var(--border-active); transition: all var(--transition-fast); }
        .qap-add-btn:hover:not(:disabled) { background: rgba(0, 240, 255, 0.16); }
        .qap-add-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .qap-add-menu { display: flex; flex-direction: column; padding: 4px; min-width: 180px; }
        .qap-add-label { font-size: 10px; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px; padding: 6px 10px 4px; font-weight: 600; }
        .qap-add-item { text-align: left; padding: 7px 10px; border-radius: var(--radius-sm); font-size: 12px; color: var(--text-primary); transition: background var(--transition-fast); }
        .qap-add-item:hover { background: var(--bg-hover); color: var(--cyan); }
        .qap-add-empty { padding: 12px; text-align: center; font-size: 11px; color: var(--text-muted); }
      `}</style>
    </SectionCard>
  );
}
