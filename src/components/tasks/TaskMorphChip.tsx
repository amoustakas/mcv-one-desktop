import { useState } from 'react';
import { useUpdateTaskMode, type TaskMode } from '../../hooks/use-task-mode';

interface Props {
  taskId: string;
  mode: TaskMode;
  disabled?: boolean;
  onChanged?: (newMode: TaskMode) => void;
}

const MODE_META: Record<TaskMode, { label: string; glyph: string; color: string }> = {
  human:  { label: 'human',  glyph: '👤', color: 'var(--text-muted)' },
  agent:  { label: 'agent',  glyph: '🧠', color: 'var(--color-brand-purple)' },
  hybrid: { label: 'hybrid', glyph: '⚡', color: 'var(--color-brand-electric)' },
};

const MODES: TaskMode[] = ['human', 'agent', 'hybrid'];

export function TaskMorphChip({ taskId, mode, disabled, onChanged }: Props) {
  const [open, setOpen] = useState(false);
  const update = useUpdateTaskMode();
  const current = MODE_META[mode];

  const pick = async (next: TaskMode) => {
    if (next === mode) { setOpen(false); return; }
    try {
      await update.mutateAsync({ taskId, mode: next });
      onChanged?.(next);
    } finally {
      setOpen(false);
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled || update.isPending}
        title={`Mode: ${current.label}`}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600,
          background: `color-mix(in srgb, ${current.color} 15%, transparent)`,
          color: current.color,
          border: `1px solid color-mix(in srgb, ${current.color} 40%, transparent)`,
          cursor: (disabled || update.isPending) ? 'default' : 'pointer',
          opacity: (disabled || update.isPending) ? 0.6 : 1,
        }}
      >
        <span>{current.glyph}</span>
        <span>{current.label}</span>
        <span style={{ fontSize: 8, opacity: 0.7 }}>{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 50,
          background: 'var(--surface-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 6, padding: 4,
          minWidth: 110, display: 'grid', gap: 2,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}>
          {MODES.map((m) => {
            const meta = MODE_META[m];
            const active = m === mode;
            return (
              <button
                key={m}
                type="button"
                onClick={() => pick(m)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '4px 8px', borderRadius: 4, fontSize: 11,
                  background: active ? `color-mix(in srgb, ${meta.color} 18%, transparent)` : 'transparent',
                  color: meta.color,
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                }}
              >
                <span>{meta.glyph}</span>
                <span style={{ flex: 1 }}>{meta.label}</span>
                {active && <span style={{ fontSize: 9 }}>✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
