import { useState } from 'react';
import { Settings } from 'lucide-react';
import { useCommandCenter } from '../../stores/command-center';
import { TILE_DEFINITIONS } from '../../lib/pinned-kpi';
import { selectSuiteTiles } from '../../lib/pinned-kpi/selection';
import type { SuiteId, TileQueryContext } from '../../lib/pinned-kpi/types';
import { KpiTile } from './KpiTile';
import { TilePicker } from './TilePicker';

interface PinnedKpiStripProps {
  suite: SuiteId;
  ventureId?: string | null;
  lens?: string[];
}

export function PinnedKpiStrip({ suite, ventureId = null, lens = [] }: PinnedKpiStripProps) {
  const custom = useCommandCenter((s) => s.pinnedKpis[suite]);
  const tileIds = selectSuiteTiles(suite, custom);
  const ctx: TileQueryContext = { lens, ventureId, now: new Date() };
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <>
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <button
          onClick={() => setPickerOpen(true)}
          title="Customize tiles"
          aria-label={`Customize ${suite} tiles`}
          style={{
            position: 'absolute', top: -4, right: -4, zIndex: 2,
            padding: 4, borderRadius: 6, background: 'var(--surface-elevated)',
            border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', cursor: 'pointer',
          }}
        >
          <Settings size={12} />
        </button>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(tileIds.length, 6)}, 1fr)`,
          gap: 10,
        }}>
          {tileIds.map((id) => {
            const def = TILE_DEFINITIONS[id];
            if (!def) return null;
            return <KpiTile key={id} def={def} ctx={ctx} />;
          })}
        </div>
      </div>
      <TilePicker suite={suite} open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </>
  );
}
