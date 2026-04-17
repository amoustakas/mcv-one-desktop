export const SUITE_IDS = [
  'command-center',
  'capital',
  'growth',
  'payments',
  'crm',
  'creative',
  'engineering',
  'operations',
  'knowledge',
  'comms',
] as const;

export type SuiteId = typeof SUITE_IDS[number];
export type KpiId = string;

export interface TileData {
  value: number | string;
  delta?: { direction: 'up' | 'down' | 'flat'; magnitude: number; period?: string };
  secondary?: string;
}

export interface TileDefinition {
  id: KpiId;
  suite: SuiteId;
  label: string;
  accent: string;
  source: (ctx: TileQueryContext) => Promise<TileData>;
  formatter: (value: TileData['value']) => string;
  description?: string;
}

export interface TileQueryContext {
  lens: string[];
  ventureId: string | null;
  now: Date;
}
