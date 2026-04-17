import type { KpiId, SuiteId, TileDefinition, TileData } from './types';

const mock = (
  v: TileData['value'],
  secondary?: string,
  direction?: 'up' | 'down' | 'flat',
  magnitude = 0,
  period = '24h',
): TileData => ({
  value: v,
  secondary,
  delta: direction ? { direction, magnitude, period } : undefined,
});

const money = (n: number): string => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
};
const count = (n: number): string => n.toLocaleString();

// Command Center (5D) — cross-cutting conglomerate KPIs
const commandCenterTiles: TileDefinition[] = [
  {
    id: 'cc_total_users',
    suite: 'command-center',
    label: 'Total users',
    accent: 'var(--color-brand-electric)',
    source: async () => mock(12847, '+ 312 · 7d', 'up', 2.5, '7d'),
    formatter: (v) => count(Number(v)),
  },
  {
    id: 'cc_revenue_mtd',
    suite: 'command-center',
    label: 'Revenue · MTD',
    accent: 'var(--color-brand-purple)',
    source: async () => mock(184000, undefined, 'up', 24, 'MoM'),
    formatter: (v) => money(Number(v)),
  },
  {
    id: 'cc_mrr',
    suite: 'command-center',
    label: 'MRR run-rate',
    accent: '#6EE7B7',
    source: async () => mock(41200, '618 paying'),
    formatter: (v) => money(Number(v)),
  },
  {
    id: 'cc_cash_runway',
    suite: 'command-center',
    label: 'Cash runway',
    accent: '#FBBF24',
    source: async () => mock('11 mo', '$1.27M treasury'),
    formatter: (v) => String(v),
  },
  {
    id: 'cc_active_ventures',
    suite: 'command-center',
    label: 'Active ventures',
    accent: 'var(--color-brand-electric)',
    source: async () => mock(12, '7 shipping · 5 prep'),
    formatter: (v) => count(Number(v)),
  },
  {
    id: 'cc_attention',
    suite: 'command-center',
    label: 'Attention',
    accent: '#FB7185',
    source: async () => mock(7, '2 urgent · 5 today'),
    formatter: (v) => count(Number(v)),
  },
];

export const TILE_DEFINITIONS: Record<KpiId, TileDefinition> = Object.fromEntries(
  [...commandCenterTiles].map((t) => [t.id, t]),
);

export function getTileDefinition(id: KpiId): TileDefinition | undefined {
  return TILE_DEFINITIONS[id];
}

export function getTilesForSuite(suite: SuiteId): TileDefinition[] {
  return Object.values(TILE_DEFINITIONS).filter((t) => t.suite === suite);
}
