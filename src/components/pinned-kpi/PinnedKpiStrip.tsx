import { useCommandCenter } from '../../stores/command-center';
import { TILE_DEFINITIONS } from '../../lib/pinned-kpi';
import { selectSuiteTiles } from '../../lib/pinned-kpi/selection';
import type { SuiteId, TileQueryContext } from '../../lib/pinned-kpi/types';
import { KpiTile } from './KpiTile';

interface PinnedKpiStripProps {
  suite: SuiteId;
  ventureId?: string | null;
  lens?: string[];
}

export function PinnedKpiStrip({ suite, ventureId = null, lens = [] }: PinnedKpiStripProps) {
  const custom = useCommandCenter((s) => s.pinnedKpis[suite]);
  const tileIds = selectSuiteTiles(suite, custom);
  const ctx: TileQueryContext = { lens, ventureId, now: new Date() };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${Math.min(tileIds.length, 6)}, 1fr)`,
      gap: 10,
      marginBottom: 16,
    }}>
      {tileIds.map((id) => {
        const def = TILE_DEFINITIONS[id];
        if (!def) return null;
        return <KpiTile key={id} def={def} ctx={ctx} />;
      })}
    </div>
  );
}
