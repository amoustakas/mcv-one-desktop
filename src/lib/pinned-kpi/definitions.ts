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

// Capital (4D+3D capital suite)
const capitalTiles: TileDefinition[] = [
  { id: 'cap_portfolio_nav', suite: 'capital', label: 'Portfolio NAV', accent: 'var(--color-brand-electric)',
    source: async () => mock(18400000, undefined, 'up', 2.1, '24h'), formatter: (v) => money(Number(v)) },
  { id: 'cap_open_rounds', suite: 'capital', label: 'Open rounds', accent: 'var(--color-brand-purple)',
    source: async () => mock(4, '67% of $4.8M'), formatter: (v) => count(Number(v)) },
  { id: 'cap_commits_inflight', suite: 'capital', label: 'Commits in-flight', accent: '#FBBF24',
    source: async () => mock(12, '$840k awaiting'), formatter: (v) => count(Number(v)) },
  { id: 'cap_distributions_due', suite: 'capital', label: 'Distributions due', accent: '#6EE7B7',
    source: async () => mock(3, 'next: Fri'), formatter: (v) => count(Number(v)) },
  { id: 'cap_verified_investors', suite: 'capital', label: 'Verified investors', accent: 'var(--color-brand-electric)',
    source: async () => mock(18, undefined, 'up', 3, '7d'), formatter: (v) => count(Number(v)) },
  { id: 'cap_compliance_alerts', suite: 'capital', label: 'Compliance', accent: '#FB7185',
    source: async () => mock(2, '1 OFAC · 1 VC'), formatter: (v) => count(Number(v)) },
];

// Growth
const growthTiles: TileDefinition[] = [
  { id: 'grw_revenue_mtd', suite: 'growth', label: 'Revenue · MTD', accent: 'var(--color-brand-purple)',
    source: async () => mock(184000, undefined, 'up', 24, 'MoM'), formatter: (v) => money(Number(v)) },
  { id: 'grw_users', suite: 'growth', label: 'Users', accent: 'var(--color-brand-electric)',
    source: async () => mock(12847), formatter: (v) => count(Number(v)) },
  { id: 'grw_mrr', suite: 'growth', label: 'MRR', accent: '#6EE7B7',
    source: async () => mock(41200), formatter: (v) => money(Number(v)) },
  { id: 'grw_cac', suite: 'growth', label: 'CAC', accent: '#FBBF24',
    source: async () => mock(47), formatter: (v) => money(Number(v)) },
  { id: 'grw_ltv', suite: 'growth', label: 'LTV', accent: '#F472B6',
    source: async () => mock(312), formatter: (v) => money(Number(v)) },
  { id: 'grw_retention', suite: 'growth', label: 'Retention · 30d', accent: '#6EE7B7',
    source: async () => mock('82%'), formatter: (v) => String(v) },
];

// Payments
const paymentsTiles: TileDefinition[] = [
  { id: 'pay_settled_today', suite: 'payments', label: 'Settled today', accent: '#6EE7B7',
    source: async () => mock(42600), formatter: (v) => money(Number(v)) },
  { id: 'pay_inflight', suite: 'payments', label: 'In-flight (reconcile)', accent: '#FBBF24',
    source: async () => mock(8, '$14.2k'), formatter: (v) => count(Number(v)) },
  { id: 'pay_failed', suite: 'payments', label: 'Failed', accent: '#FB7185',
    source: async () => mock(1, 'retry queued'), formatter: (v) => count(Number(v)) },
  { id: 'pay_fx_exposure', suite: 'payments', label: 'FX exposure', accent: 'var(--color-brand-purple)',
    source: async () => mock(12400, 'CAD unhedged'), formatter: (v) => money(Number(v)) },
  { id: 'pay_fees_ytd', suite: 'payments', label: 'Fees · YTD', accent: 'var(--color-brand-electric)',
    source: async () => mock(3850), formatter: (v) => money(Number(v)) },
  { id: 'pay_tax_forms_due', suite: 'payments', label: 'Tax forms due', accent: '#FB923C',
    source: async () => mock(0, 'next: Jan 31'), formatter: (v) => count(Number(v)) },
];

// CRM
const crmTiles: TileDefinition[] = [
  { id: 'crm_active_prospects', suite: 'crm', label: 'Active prospects', accent: 'var(--color-brand-electric)',
    source: async () => mock(24), formatter: (v) => count(Number(v)) },
  { id: 'crm_pipeline_value', suite: 'crm', label: 'Pipeline · $', accent: 'var(--color-brand-purple)',
    source: async () => mock(420000), formatter: (v) => money(Number(v)) },
  { id: 'crm_conversion_rate', suite: 'crm', label: 'Conversion · 30d', accent: '#6EE7B7',
    source: async () => mock('14.2%'), formatter: (v) => String(v) },
  { id: 'crm_activities_today', suite: 'crm', label: 'Activities today', accent: '#FBBF24',
    source: async () => mock(11), formatter: (v) => count(Number(v)) },
  { id: 'crm_new_captures', suite: 'crm', label: 'New captures', accent: '#F472B6',
    source: async () => mock(5, '7d'), formatter: (v) => count(Number(v)) },
  { id: 'crm_stale_deals', suite: 'crm', label: 'Stale deals', accent: '#FB7185',
    source: async () => mock(3, '>14d'), formatter: (v) => count(Number(v)) },
];

// Creative
const creativeTiles: TileDefinition[] = [
  { id: 'crt_assets_published', suite: 'creative', label: 'Assets published', accent: '#F472B6',
    source: async () => mock(84, undefined, 'up', 12, '7d'), formatter: (v) => count(Number(v)) },
  { id: 'crt_render_queue', suite: 'creative', label: 'Render queue', accent: 'var(--color-brand-purple)',
    source: async () => mock(7, '2 priority'), formatter: (v) => count(Number(v)) },
  { id: 'crt_awaiting_review', suite: 'creative', label: 'Awaiting review', accent: '#FBBF24',
    source: async () => mock(5, 'brand · 3 · copy · 2'), formatter: (v) => count(Number(v)) },
  { id: 'crt_voice_clones', suite: 'creative', label: 'Voice clones', accent: 'var(--color-brand-electric)',
    source: async () => mock(3, 'ElevenLabs'), formatter: (v) => count(Number(v)) },
  { id: 'crt_projects_shipping', suite: 'creative', label: 'Projects shipping', accent: '#6EE7B7',
    source: async () => mock(4, 'by EOW'), formatter: (v) => count(Number(v)) },
  { id: 'crt_drafts', suite: 'creative', label: 'Drafts', accent: '#A78BFA',
    source: async () => mock(22, '12 stale >7d'), formatter: (v) => count(Number(v)) },
];

// Engineering
const engineeringTiles: TileDefinition[] = [
  { id: 'eng_deploys_today', suite: 'engineering', label: 'Deploys · today', accent: '#6EE7B7',
    source: async () => mock(14, '12 prod · 2 preview'), formatter: (v) => count(Number(v)) },
  { id: 'eng_open_prs', suite: 'engineering', label: 'Open PRs', accent: 'var(--color-brand-electric)',
    source: async () => mock(9, '3 need review'), formatter: (v) => count(Number(v)) },
  { id: 'eng_test_failures', suite: 'engineering', label: 'Test failures', accent: '#FBBF24',
    source: async () => mock(2, 'last 24h'), formatter: (v) => count(Number(v)) },
  { id: 'eng_incidents', suite: 'engineering', label: 'Incidents', accent: '#FB7185',
    source: async () => mock(0, '6-day streak'), formatter: (v) => count(Number(v)) },
  { id: 'eng_uptime_30d', suite: 'engineering', label: 'Uptime · 30d', accent: '#6EE7B7',
    source: async () => mock('99.97%'), formatter: (v) => String(v) },
  { id: 'eng_cron_health', suite: 'engineering', label: 'Cron health', accent: 'var(--color-brand-electric)',
    source: async () => mock('7/7', 'all green'), formatter: (v) => String(v) },
];

// Operations
const operationsTiles: TileDefinition[] = [
  { id: 'ops_open_tasks', suite: 'operations', label: 'Open tasks', accent: 'var(--color-brand-electric)',
    source: async () => mock(38), formatter: (v) => count(Number(v)) },
  { id: 'ops_blocked', suite: 'operations', label: 'Blocked', accent: '#FB7185',
    source: async () => mock(4), formatter: (v) => count(Number(v)) },
  { id: 'ops_agent_running', suite: 'operations', label: 'Agent tasks running', accent: '#A78BFA',
    source: async () => mock(2, 'Forge + Aegis'), formatter: (v) => count(Number(v)) },
  { id: 'ops_epics_inflight', suite: 'operations', label: 'Epics in-flight', accent: 'var(--color-brand-purple)',
    source: async () => mock(6), formatter: (v) => count(Number(v)) },
  { id: 'ops_stale_14d', suite: 'operations', label: 'Stale · ≥14d', accent: '#FBBF24',
    source: async () => mock(7), formatter: (v) => count(Number(v)) },
  { id: 'ops_governance', suite: 'operations', label: 'Governance', accent: '#6EE7B7',
    source: async () => mock(2, 'need Tony'), formatter: (v) => count(Number(v)) },
];

// Knowledge
const knowledgeTiles: TileDefinition[] = [
  { id: 'knw_docs', suite: 'knowledge', label: 'Docs', accent: '#FB923C',
    source: async () => mock(247), formatter: (v) => count(Number(v)) },
  { id: 'knw_research_dossiers', suite: 'knowledge', label: 'Research dossiers', accent: 'var(--color-brand-electric)',
    source: async () => mock(18, '2 awaiting'), formatter: (v) => count(Number(v)) },
  { id: 'knw_memory_entries', suite: 'knowledge', label: 'Memory entries', accent: 'var(--color-brand-purple)',
    source: async () => mock(34), formatter: (v) => count(Number(v)) },
  { id: 'knw_files', suite: 'knowledge', label: 'Files', accent: '#FBBF24',
    source: async () => mock(1420), formatter: (v) => count(Number(v)) },
  { id: 'knw_rag_queries_today', suite: 'knowledge', label: 'RAG queries · today', accent: '#6EE7B7',
    source: async () => mock(87), formatter: (v) => count(Number(v)) },
  { id: 'knw_stale_90d', suite: 'knowledge', label: 'Stale · ≥90d', accent: '#FB7185',
    source: async () => mock(12), formatter: (v) => count(Number(v)) },
];

// Comms
const commsTiles: TileDefinition[] = [
  { id: 'cm_unread', suite: 'comms', label: 'Unread', accent: '#5EEAD4',
    source: async () => mock(14), formatter: (v) => count(Number(v)) },
  { id: 'cm_dms_pending_reply', suite: 'comms', label: 'Need reply', accent: '#FBBF24',
    source: async () => mock(4), formatter: (v) => count(Number(v)) },
  { id: 'cm_calendar_today', suite: 'comms', label: 'Calendar · today', accent: 'var(--color-brand-electric)',
    source: async () => mock(3, 'next: 2pm'), formatter: (v) => count(Number(v)) },
  { id: 'cm_missed_calls', suite: 'comms', label: 'Missed calls', accent: '#FB7185',
    source: async () => mock(1), formatter: (v) => count(Number(v)) },
  { id: 'cm_mentions', suite: 'comms', label: 'Mentions', accent: 'var(--color-brand-purple)',
    source: async () => mock(7), formatter: (v) => count(Number(v)) },
  { id: 'cm_scheduled_sends', suite: 'comms', label: 'Scheduled sends', accent: '#6EE7B7',
    source: async () => mock(2, 'next: Fri 9am'), formatter: (v) => count(Number(v)) },
];

export const TILE_DEFINITIONS: Record<KpiId, TileDefinition> = Object.fromEntries(
  [
    ...commandCenterTiles,
    ...capitalTiles,
    ...growthTiles,
    ...paymentsTiles,
    ...crmTiles,
    ...creativeTiles,
    ...engineeringTiles,
    ...operationsTiles,
    ...knowledgeTiles,
    ...commsTiles,
  ].map((t) => [t.id, t]),
);

export function getTileDefinition(id: KpiId): TileDefinition | undefined {
  return TILE_DEFINITIONS[id];
}

export function getTilesForSuite(suite: SuiteId): TileDefinition[] {
  return Object.values(TILE_DEFINITIONS).filter((t) => t.suite === suite);
}
