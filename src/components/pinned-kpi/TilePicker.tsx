import { useCommandCenter } from '../../stores/command-center';
import { getTilesForSuite, DEFAULT_LOADOUTS } from '../../lib/pinned-kpi';
import type { SuiteId } from '../../lib/pinned-kpi/types';
import { Modal } from '../ui';

interface TilePickerProps {
  suite: SuiteId;
  open: boolean;
  onClose: () => void;
}

export function TilePicker({ suite, open, onClose }: TilePickerProps) {
  const pinned = useCommandCenter((s) => s.pinnedKpis[suite] ?? DEFAULT_LOADOUTS[suite]);
  const addSuiteTile = useCommandCenter((s) => s.addSuiteTile);
  const removeSuiteTile = useCommandCenter((s) => s.removeSuiteTile);
  const setSuiteTiles = useCommandCenter((s) => s.setSuiteTiles);

  if (!open) return null;
  const all = getTilesForSuite(suite);

  return (
    <Modal open={open} onClose={onClose} ariaLabel={`Customize ${suite} tiles`}>
      <div style={{ padding: 16, minWidth: 420 }}>
        <h2 style={{ margin: 0, marginBottom: 12, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
          Customize {suite} tiles
        </h2>
        <div style={{ display: 'grid', gap: 8 }}>
          {all.map((def) => {
            const isActive = pinned.includes(def.id);
            return (
              <button
                key={def.id}
                onClick={() => isActive ? removeSuiteTile(suite, def.id) : addSuiteTile(suite, def.id)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: 10, borderRadius: 8,
                  border: `1px solid ${isActive ? def.accent : 'var(--border-subtle)'}`,
                  background: isActive ? `${def.accent}14` : 'var(--surface-base)',
                  color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left',
                }}
              >
                <span>{def.label}</span>
                <span style={{ fontSize: 11, color: isActive ? def.accent : 'var(--text-muted)' }}>
                  {isActive ? '✓ pinned' : '+ pin'}
                </span>
              </button>
            );
          })}
          <button
            onClick={() => setSuiteTiles(suite, DEFAULT_LOADOUTS[suite])}
            style={{
              marginTop: 8, padding: 8, borderRadius: 6,
              background: 'var(--surface-elevated)', color: 'var(--text-muted)',
              border: '1px solid var(--border-subtle)', cursor: 'pointer',
            }}
          >
            Reset to defaults
          </button>
        </div>
      </div>
    </Modal>
  );
}
