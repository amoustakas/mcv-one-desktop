# Marathon #1 — Pinned Strip + Ventures Stack + Operator Prospects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the three foundational tranches (T1 + T2 + T3) for MCV Desktop's dimensional architecture so every subsequent tranche snaps into a working shell.

**Architecture:** Three independent worktrees execute in parallel:
- **T1** — `<PinnedKpiStrip>` + `<SuiteShell>` primitives + 9 default suite loadouts + `command-center` store extension for per-suite tile personalization
- **T2** — ventures registry expansion (+ MCV.Tech / MCV.DEV shared-cap / MCV.CX / MCV.INC) + dual-parent crown (MCV Inc. + MCV LTD) + Corporate Stack primitive (Corps/Jurisdictions/Accounts/Team/Brand) + `capital_round_ventures` junction + `domain_registry` schema
- **T3** — operator-seeded prospect intake wizard + `prospect_profiles` extension + Hunter Milborne + Kirill Soloviev seeded + Quinn assigned as default Futurestate investor persona

Each tranche ships a working, testable slice. No cross-tranche blocking. Merge order on completion: T2 → T1 → T3 (T2 migrations first because they're authoritative for schema).

**Tech Stack:** React 19 · TypeScript strict · Zustand + persist · Supabase + PostgreSQL 17 · Vitest · React Query v5 · Tailwind (via CSS variables in `design-system.css`).

**Brand voice** (per memory `feedback_brand_tone_philosophy.md`): Aggressive ambition · historic mission · founder-family legacy · elite hardcore · hive-mind intelligence · production-grade. Copy in UI + commit messages matches Tony's voice — no corporate hedging.

---

## Orchestration — parallel worktree setup

Each tranche runs in its own git worktree on a uniquely-named branch (per `CLAUDE.md` parallel-session discipline). Do this ONCE before dispatching subagents.

**Before running worktree setup:** verify clean master state.

```bash
cd c:/Users/moust/mcv-one-desktop
git branch --show-current   # must print: master
git status --short           # must be empty of modifications to tracked files
git fetch origin
git pull --ff-only origin master
```

**Create three worktrees from master:**

```bash
# T1 worktree
git worktree add -b marathon-1-t1-pinned-strip-2026-04-17 \
  ../mcv-one-desktop-t1-pinned-strip origin/master

# T2 worktree
git worktree add -b marathon-1-t2-ventures-stack-2026-04-17 \
  ../mcv-one-desktop-t2-ventures-stack origin/master

# T3 worktree
git worktree add -b marathon-1-t3-operator-prospects-2026-04-17 \
  ../mcv-one-desktop-t3-operator-prospects origin/master

git worktree list
```

**Expected output** of `git worktree list`: four entries (master + T1 + T2 + T3). Each subagent operates exclusively in ONE worktree for its entire tranche.

**Subagent dispatch rule:** when you call an executing-agent for a task, set the working directory to the correct worktree. Never execute tasks across worktree boundaries.

---

## Tranche T1 — PinnedKpiStrip + SuiteShell + loadouts + store

**Worktree:** `../mcv-one-desktop-t1-pinned-strip`
**Branch:** `marathon-1-t1-pinned-strip-2026-04-17`
**Size:** ~600 LOC. 8 tasks.

### File structure

**Create:**
- `src/lib/pinned-kpi/types.ts` — `KpiId`, `SuiteId`, `TileDefinition`, `TileData` type exports
- `src/lib/pinned-kpi/definitions.ts` — registry of 40+ tile definitions (one per KPI across suites)
- `src/lib/pinned-kpi/loadouts.ts` — default loadouts per SuiteId (9 entries)
- `src/lib/pinned-kpi/index.ts` — barrel export
- `src/components/pinned-kpi/KpiTile.tsx` — single tile renderer (number + delta + secondary)
- `src/components/pinned-kpi/PinnedKpiStrip.tsx` — strip composer (reads store + loadouts + definitions)
- `src/components/pinned-kpi/TilePicker.tsx` — gear-icon modal for add/remove/reorder
- `src/components/pinned-kpi/index.ts` — barrel export
- `src/components/suite/SuiteShell.tsx` — shell wrapper (header + PinnedKpiStrip + children)
- `src/components/suite/index.ts` — barrel export
- Test files alongside each component

**Modify:**
- `src/stores/command-center.ts` — add `pinnedKpis: Record<SuiteId, KpiId[]>` + `setSuiteTiles` / `reorderSuiteTile` / `addSuiteTile` / `removeSuiteTile`
- `src/views/CommandCenter.tsx` — swap its existing stat-card row for `<PinnedKpiStrip suite="command-center">`
- `src/views/CapitalFoundationView.tsx` — wrap in `<SuiteShell suite="capital">`
- `src/views/CRMView.tsx` — wrap in `<SuiteShell suite="crm">`

### Task 1: Define pinned-kpi types + tile schema

**Files:**
- Create: `src/lib/pinned-kpi/types.ts`
- Test: `src/lib/pinned-kpi/__tests__/types.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/pinned-kpi/__tests__/types.test.ts
import { describe, it, expect } from 'vitest';
import type { SuiteId, TileDefinition } from '../types';
import { SUITE_IDS } from '../types';

describe('pinned-kpi types', () => {
  it('exports the canonical 10 SuiteId values', () => {
    expect(SUITE_IDS).toEqual([
      'command-center',
      'capital', 'growth', 'payments', 'crm',
      'creative', 'engineering', 'operations', 'knowledge', 'comms',
    ]);
  });

  it('TileDefinition shape requires id, label, suite, accent, formatter', () => {
    const def: TileDefinition = {
      id: 'test_tile',
      suite: 'capital',
      label: 'Test',
      accent: '#00F5FF',
      source: async () => ({ value: 42 }),
      formatter: (v) => String(v),
    };
    expect(def.id).toBe('test_tile');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/pinned-kpi/__tests__/types.test.ts`
Expected: FAIL with "Cannot find module '../types'"

- [ ] **Step 3: Implement types module**

```typescript
// src/lib/pinned-kpi/types.ts
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

export type KpiId = string; // opaque; validated against definitions registry

export interface TileData {
  value: number | string;
  delta?: {
    direction: 'up' | 'down' | 'flat';
    magnitude: number; // percent or absolute
    period?: string;  // '24h', '7d', 'MoM'
  };
  secondary?: string; // "2 priority", "$840k awaiting"
}

export interface TileDefinition {
  id: KpiId;
  suite: SuiteId;
  label: string;
  accent: string; // CSS color
  source: (ctx: TileQueryContext) => Promise<TileData>;
  formatter: (value: TileData['value']) => string;
  description?: string; // tooltip
}

export interface TileQueryContext {
  lens: string[];            // venture ids, empty = all
  ventureId: string | null;  // 4D context
  now: Date;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/pinned-kpi/__tests__/types.test.ts`
Expected: PASS — 2 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/pinned-kpi/types.ts src/lib/pinned-kpi/__tests__/types.test.ts
git commit -m "feat(pinned-kpi): types + SuiteId canon (T1.1)"
```

### Task 2: Tile definitions registry + 6 command-center tiles

**Files:**
- Create: `src/lib/pinned-kpi/definitions.ts`
- Test: `src/lib/pinned-kpi/__tests__/definitions.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/pinned-kpi/__tests__/definitions.test.ts
import { describe, it, expect } from 'vitest';
import { TILE_DEFINITIONS, getTileDefinition, getTilesForSuite } from '../definitions';

describe('pinned-kpi definitions', () => {
  it('exports at least 6 command-center tiles', () => {
    const tiles = getTilesForSuite('command-center');
    expect(tiles.length).toBeGreaterThanOrEqual(6);
    expect(tiles.map((t) => t.id)).toEqual(
      expect.arrayContaining([
        'cc_total_users', 'cc_revenue_mtd', 'cc_mrr',
        'cc_cash_runway', 'cc_active_ventures', 'cc_attention',
      ]),
    );
  });

  it('every definition has suite, label, accent, formatter, source', () => {
    for (const def of Object.values(TILE_DEFINITIONS)) {
      expect(def.suite).toBeDefined();
      expect(def.label).toBeTruthy();
      expect(def.accent).toMatch(/^#|^var\(/);
      expect(typeof def.formatter).toBe('function');
      expect(typeof def.source).toBe('function');
    }
  });

  it('getTileDefinition returns undefined for unknown id', () => {
    expect(getTileDefinition('nonexistent')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/pinned-kpi/__tests__/definitions.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement definitions module**

```typescript
// src/lib/pinned-kpi/definitions.ts
import type { KpiId, SuiteId, TileDefinition, TileData, TileQueryContext } from './types';

const mock = (v: TileData['value'], secondary?: string, direction?: 'up' | 'down' | 'flat', magnitude = 0, period = '24h'): TileData =>
  ({ value: v, secondary, delta: direction ? { direction, magnitude, period } : undefined });

const money = (n: number): string => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
};
const count = (n: number): string => n.toLocaleString();
const pct = (n: number): string => `${n.toFixed(1)}%`;

// Command Center (5D) — cross-cutting conglomerate KPIs
const commandCenterTiles: TileDefinition[] = [
  {
    id: 'cc_total_users', suite: 'command-center', label: 'Total users',
    accent: 'var(--color-brand-electric)',
    source: async () => mock(12847, '+ 312 · 7d', 'up', 2.5, '7d'),
    formatter: (v) => count(Number(v)),
  },
  {
    id: 'cc_revenue_mtd', suite: 'command-center', label: 'Revenue · MTD',
    accent: 'var(--color-brand-purple)',
    source: async () => mock(184000, undefined, 'up', 24, 'MoM'),
    formatter: (v) => money(Number(v)),
  },
  {
    id: 'cc_mrr', suite: 'command-center', label: 'MRR run-rate',
    accent: '#6EE7B7',
    source: async () => mock(41200, '618 paying'),
    formatter: (v) => money(Number(v)),
  },
  {
    id: 'cc_cash_runway', suite: 'command-center', label: 'Cash runway',
    accent: '#FBBF24',
    source: async () => mock('11 mo', '$1.27M treasury'),
    formatter: (v) => String(v),
  },
  {
    id: 'cc_active_ventures', suite: 'command-center', label: 'Active ventures',
    accent: 'var(--color-brand-electric)',
    source: async () => mock(12, '7 shipping · 5 prep'),
    formatter: (v) => count(Number(v)),
  },
  {
    id: 'cc_attention', suite: 'command-center', label: 'Attention',
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/pinned-kpi/__tests__/definitions.test.ts`
Expected: PASS — 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/pinned-kpi/definitions.ts src/lib/pinned-kpi/__tests__/definitions.test.ts
git commit -m "feat(pinned-kpi): tile registry + 6 command-center definitions (T1.2)"
```

### Task 3: Add tile definitions for remaining 9 suites

**Files:**
- Modify: `src/lib/pinned-kpi/definitions.ts`

- [ ] **Step 1: Extend definitions with capital + growth + payments + crm tiles**

Append to `src/lib/pinned-kpi/definitions.ts` BEFORE the `TILE_DEFINITIONS` export:

```typescript
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
```

- [ ] **Step 2: Update TILE_DEFINITIONS export to include new tile arrays**

Replace the existing `TILE_DEFINITIONS` assignment with:

```typescript
export const TILE_DEFINITIONS: Record<KpiId, TileDefinition> = Object.fromEntries(
  [
    ...commandCenterTiles,
    ...capitalTiles,
    ...growthTiles,
    ...paymentsTiles,
    ...crmTiles,
  ].map((t) => [t.id, t]),
);
```

- [ ] **Step 3: Add tile definitions for Creative + Engineering + Operations + Knowledge + Comms**

Append before the updated `TILE_DEFINITIONS`:

```typescript
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
```

- [ ] **Step 4: Update TILE_DEFINITIONS to include all 10 suites**

Replace:

```typescript
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
```

- [ ] **Step 5: Add coverage test**

Add to `src/lib/pinned-kpi/__tests__/definitions.test.ts`:

```typescript
  it('every SuiteId has at least 6 tiles defined', () => {
    const bySuite = Object.values(TILE_DEFINITIONS).reduce<Record<string, number>>((acc, t) => {
      acc[t.suite] = (acc[t.suite] ?? 0) + 1;
      return acc;
    }, {});
    for (const suite of ['command-center','capital','growth','payments','crm','creative','engineering','operations','knowledge','comms']) {
      expect(bySuite[suite], `${suite} must have ≥6 tiles`).toBeGreaterThanOrEqual(6);
    }
  });
```

- [ ] **Step 6: Run tests**

Run: `pnpm vitest run src/lib/pinned-kpi/`
Expected: 4 tests PASS. Every suite has ≥6 tiles.

- [ ] **Step 7: Commit**

```bash
git add src/lib/pinned-kpi/definitions.ts src/lib/pinned-kpi/__tests__/definitions.test.ts
git commit -m "feat(pinned-kpi): 54 tile definitions across 10 suites (T1.3)"
```

### Task 4: Default loadouts per suite

**Files:**
- Create: `src/lib/pinned-kpi/loadouts.ts`
- Test: `src/lib/pinned-kpi/__tests__/loadouts.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/pinned-kpi/__tests__/loadouts.test.ts
import { describe, it, expect } from 'vitest';
import { DEFAULT_LOADOUTS } from '../loadouts';
import { TILE_DEFINITIONS } from '../definitions';
import { SUITE_IDS } from '../types';

describe('default loadouts', () => {
  it('provides a loadout for every SuiteId', () => {
    for (const suite of SUITE_IDS) {
      expect(DEFAULT_LOADOUTS[suite], `missing loadout for ${suite}`).toBeDefined();
      expect(DEFAULT_LOADOUTS[suite].length).toBe(6);
    }
  });

  it('every KpiId in a loadout resolves to a TileDefinition with matching suite', () => {
    for (const [suite, tileIds] of Object.entries(DEFAULT_LOADOUTS)) {
      for (const id of tileIds) {
        const def = TILE_DEFINITIONS[id];
        expect(def, `${id} in ${suite} loadout has no definition`).toBeDefined();
        expect(def.suite).toBe(suite);
      }
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/pinned-kpi/__tests__/loadouts.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement loadouts**

```typescript
// src/lib/pinned-kpi/loadouts.ts
import type { KpiId, SuiteId } from './types';

export const DEFAULT_LOADOUTS: Record<SuiteId, KpiId[]> = {
  'command-center': ['cc_total_users','cc_revenue_mtd','cc_mrr','cc_cash_runway','cc_active_ventures','cc_attention'],
  capital:          ['cap_portfolio_nav','cap_open_rounds','cap_commits_inflight','cap_distributions_due','cap_verified_investors','cap_compliance_alerts'],
  growth:           ['grw_revenue_mtd','grw_users','grw_mrr','grw_cac','grw_ltv','grw_retention'],
  payments:         ['pay_settled_today','pay_inflight','pay_failed','pay_fx_exposure','pay_fees_ytd','pay_tax_forms_due'],
  crm:              ['crm_active_prospects','crm_pipeline_value','crm_conversion_rate','crm_activities_today','crm_new_captures','crm_stale_deals'],
  creative:         ['crt_assets_published','crt_render_queue','crt_awaiting_review','crt_voice_clones','crt_projects_shipping','crt_drafts'],
  engineering:      ['eng_deploys_today','eng_open_prs','eng_test_failures','eng_incidents','eng_uptime_30d','eng_cron_health'],
  operations:       ['ops_open_tasks','ops_blocked','ops_agent_running','ops_epics_inflight','ops_stale_14d','ops_governance'],
  knowledge:        ['knw_docs','knw_research_dossiers','knw_memory_entries','knw_files','knw_rag_queries_today','knw_stale_90d'],
  comms:            ['cm_unread','cm_dms_pending_reply','cm_calendar_today','cm_missed_calls','cm_mentions','cm_scheduled_sends'],
};
```

- [ ] **Step 4: Create barrel export**

```typescript
// src/lib/pinned-kpi/index.ts
export * from './types';
export * from './definitions';
export * from './loadouts';
```

- [ ] **Step 5: Run tests**

Run: `pnpm vitest run src/lib/pinned-kpi/`
Expected: all tests PASS. 10 suites × 6 tiles validated.

- [ ] **Step 6: Commit**

```bash
git add src/lib/pinned-kpi/loadouts.ts src/lib/pinned-kpi/index.ts src/lib/pinned-kpi/__tests__/loadouts.test.ts
git commit -m "feat(pinned-kpi): default loadouts per suite (6 tiles each) (T1.4)"
```

### Task 5: Extend command-center store with pinnedKpis map

**Files:**
- Modify: `src/stores/command-center.ts`
- Test: `src/stores/__tests__/command-center.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/stores/__tests__/command-center.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useCommandCenter } from '../command-center';

describe('command-center store · pinnedKpis', () => {
  beforeEach(() => {
    localStorage.clear();
    useCommandCenter.setState({ pinnedKpis: {} });
  });

  it('setSuiteTiles replaces the loadout for a suite', () => {
    useCommandCenter.getState().setSuiteTiles('capital', ['cap_portfolio_nav','cap_open_rounds']);
    expect(useCommandCenter.getState().pinnedKpis.capital).toEqual(['cap_portfolio_nav','cap_open_rounds']);
  });

  it('addSuiteTile appends if not present', () => {
    useCommandCenter.getState().setSuiteTiles('capital', ['cap_portfolio_nav']);
    useCommandCenter.getState().addSuiteTile('capital', 'cap_open_rounds');
    expect(useCommandCenter.getState().pinnedKpis.capital).toEqual(['cap_portfolio_nav','cap_open_rounds']);
  });

  it('addSuiteTile is idempotent', () => {
    useCommandCenter.getState().setSuiteTiles('capital', ['cap_portfolio_nav']);
    useCommandCenter.getState().addSuiteTile('capital', 'cap_portfolio_nav');
    expect(useCommandCenter.getState().pinnedKpis.capital).toEqual(['cap_portfolio_nav']);
  });

  it('removeSuiteTile drops the id', () => {
    useCommandCenter.getState().setSuiteTiles('capital', ['cap_portfolio_nav','cap_open_rounds']);
    useCommandCenter.getState().removeSuiteTile('capital', 'cap_portfolio_nav');
    expect(useCommandCenter.getState().pinnedKpis.capital).toEqual(['cap_open_rounds']);
  });

  it('reorderSuiteTile moves within the array', () => {
    useCommandCenter.getState().setSuiteTiles('capital', ['a','b','c']);
    useCommandCenter.getState().reorderSuiteTile('capital', 0, 2);
    expect(useCommandCenter.getState().pinnedKpis.capital).toEqual(['b','c','a']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/stores/__tests__/command-center.test.ts`
Expected: FAIL — methods don't exist.

- [ ] **Step 3: Extend command-center store**

In `src/stores/command-center.ts`, add imports at top:

```typescript
import type { SuiteId, KpiId } from '../lib/pinned-kpi/types';
```

Extend the `CommandCenterState` interface:

```typescript
interface CommandCenterState {
  snoozedAlerts: Record<string, number>;
  resolvedAlerts: string[];
  quickActions: QuickActionId[];
  widgetVisibility: Record<string, boolean>;
  pinnedKpis: Record<string, KpiId[]>; // keyed by SuiteId

  // ... existing methods

  setSuiteTiles: (suite: SuiteId, ids: KpiId[]) => void;
  addSuiteTile: (suite: SuiteId, id: KpiId) => void;
  removeSuiteTile: (suite: SuiteId, id: KpiId) => void;
  reorderSuiteTile: (suite: SuiteId, from: number, to: number) => void;
}
```

Inside the `create` factory, add `pinnedKpis: {}` to the initial state and add methods:

```typescript
      pinnedKpis: {},

      setSuiteTiles: (suite, ids) =>
        set((s) => ({ pinnedKpis: { ...s.pinnedKpis, [suite]: ids } })),

      addSuiteTile: (suite, id) =>
        set((s) => {
          const current = s.pinnedKpis[suite] ?? [];
          if (current.includes(id)) return s;
          return { pinnedKpis: { ...s.pinnedKpis, [suite]: [...current, id] } };
        }),

      removeSuiteTile: (suite, id) =>
        set((s) => ({
          pinnedKpis: { ...s.pinnedKpis, [suite]: (s.pinnedKpis[suite] ?? []).filter((x) => x !== id) },
        })),

      reorderSuiteTile: (suite, from, to) =>
        set((s) => {
          const current = [...(s.pinnedKpis[suite] ?? [])];
          const [moved] = current.splice(from, 1);
          current.splice(to, 0, moved);
          return { pinnedKpis: { ...s.pinnedKpis, [suite]: current } };
        }),
```

- [ ] **Step 4: Run tests**

Run: `pnpm vitest run src/stores/__tests__/command-center.test.ts`
Expected: 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/stores/command-center.ts src/stores/__tests__/command-center.test.ts
git commit -m "feat(store): command-center.pinnedKpis per-suite personalization (T1.5)"
```

### Task 6: `<KpiTile>` + `<PinnedKpiStrip>` components

**Files:**
- Create: `src/components/pinned-kpi/KpiTile.tsx`
- Create: `src/components/pinned-kpi/PinnedKpiStrip.tsx`
- Create: `src/components/pinned-kpi/index.ts`
- Test: `src/components/pinned-kpi/__tests__/PinnedKpiStrip.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// src/components/pinned-kpi/__tests__/PinnedKpiStrip.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PinnedKpiStrip } from '../PinnedKpiStrip';
import { useCommandCenter } from '../../../stores/command-center';

function renderWithQuery(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe('<PinnedKpiStrip>', () => {
  it('renders 6 tiles for capital suite using default loadout when store is empty', async () => {
    useCommandCenter.setState({ pinnedKpis: {} });
    renderWithQuery(<PinnedKpiStrip suite="capital" />);
    await waitFor(() => expect(screen.getByText('Portfolio NAV')).toBeInTheDocument());
    expect(screen.getAllByRole('article').length).toBe(6);
  });

  it('respects user customization from the store over the default', async () => {
    useCommandCenter.setState({ pinnedKpis: { capital: ['cap_portfolio_nav'] } });
    renderWithQuery(<PinnedKpiStrip suite="capital" />);
    await waitFor(() => expect(screen.getByText('Portfolio NAV')).toBeInTheDocument());
    expect(screen.getAllByRole('article').length).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/components/pinned-kpi/`
Expected: FAIL — components don't exist.

- [ ] **Step 3: Implement `<KpiTile>`**

```tsx
// src/components/pinned-kpi/KpiTile.tsx
import { useQuery } from '@tanstack/react-query';
import type { TileDefinition, TileQueryContext } from '../../lib/pinned-kpi/types';

interface KpiTileProps {
  def: TileDefinition;
  ctx: TileQueryContext;
}

export function KpiTile({ def, ctx }: KpiTileProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['pinned-kpi', def.id, ctx.ventureId, ...ctx.lens],
    queryFn: () => def.source(ctx),
    staleTime: 30_000,
  });

  const value = data ? def.formatter(data.value) : '—';
  const delta = data?.delta;
  const secondary = data?.secondary;

  const deltaColor = delta?.direction === 'up' ? '#6EE7B7'
                   : delta?.direction === 'down' ? '#FB7185'
                   : 'var(--text-muted)';
  const deltaGlyph = delta?.direction === 'up' ? '▲' : delta?.direction === 'down' ? '▼' : '·';

  return (
    <article style={{
      padding: 12,
      border: `1px solid ${def.accent}40`,
      borderRadius: 10,
      background: `linear-gradient(180deg, ${def.accent}10, transparent)`,
    }}>
      <div style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
        {def.label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: def.accent, marginTop: 4 }}>
        {isLoading ? '…' : value}
      </div>
      {(delta || secondary) && (
        <div style={{ fontSize: 11, marginTop: 2, color: deltaColor }}>
          {delta && `${deltaGlyph} ${delta.magnitude}${typeof delta.magnitude === 'number' && Math.abs(delta.magnitude) < 100 ? '%' : ''}${delta.period ? ` · ${delta.period}` : ''}`}
          {!delta && secondary && <span style={{ color: 'var(--text-muted)' }}>{secondary}</span>}
        </div>
      )}
    </article>
  );
}
```

- [ ] **Step 4: Implement `<PinnedKpiStrip>`**

```tsx
// src/components/pinned-kpi/PinnedKpiStrip.tsx
import { useCommandCenter } from '../../stores/command-center';
import { TILE_DEFINITIONS, DEFAULT_LOADOUTS } from '../../lib/pinned-kpi';
import type { SuiteId, TileQueryContext } from '../../lib/pinned-kpi/types';
import { KpiTile } from './KpiTile';

interface PinnedKpiStripProps {
  suite: SuiteId;
  ventureId?: string | null;
  lens?: string[];
}

export function PinnedKpiStrip({ suite, ventureId = null, lens = [] }: PinnedKpiStripProps) {
  const custom = useCommandCenter((s) => s.pinnedKpis[suite]);
  const tileIds = custom && custom.length > 0 ? custom : DEFAULT_LOADOUTS[suite];
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
```

- [ ] **Step 5: Barrel export**

```typescript
// src/components/pinned-kpi/index.ts
export { KpiTile } from './KpiTile';
export { PinnedKpiStrip } from './PinnedKpiStrip';
```

- [ ] **Step 6: Run tests**

Run: `pnpm vitest run src/components/pinned-kpi/`
Expected: 2 tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/pinned-kpi/
git commit -m "feat(pinned-kpi): KpiTile + PinnedKpiStrip components (T1.6)"
```

### Task 7: `<SuiteShell>` wrapper + wire into 3 views

**Files:**
- Create: `src/components/suite/SuiteShell.tsx`
- Create: `src/components/suite/index.ts`
- Modify: `src/views/CommandCenter.tsx`
- Modify: `src/views/CapitalFoundationView.tsx`
- Modify: `src/views/CRMView.tsx`
- Test: `src/components/suite/__tests__/SuiteShell.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// src/components/suite/__tests__/SuiteShell.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SuiteShell } from '../SuiteShell';

function renderWithQuery(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe('<SuiteShell>', () => {
  it('renders children + the pinned-kpi strip for the suite', () => {
    renderWithQuery(
      <SuiteShell suite="capital" title="Capital">
        <div data-testid="inner">body</div>
      </SuiteShell>,
    );
    expect(screen.getByText('Capital')).toBeInTheDocument();
    expect(screen.getByTestId('inner')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/components/suite/`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `<SuiteShell>`**

```tsx
// src/components/suite/SuiteShell.tsx
import type { ReactNode } from 'react';
import type { SuiteId } from '../../lib/pinned-kpi/types';
import { PinnedKpiStrip } from '../pinned-kpi';
import { PageShell, PageHeader } from '../ui';

interface SuiteShellProps {
  suite: SuiteId;
  title: string;
  subtitle?: string;
  ventureId?: string | null;
  lens?: string[];
  headerActions?: ReactNode;
  children: ReactNode;
}

export function SuiteShell({ suite, title, subtitle, ventureId, lens, headerActions, children }: SuiteShellProps) {
  return (
    <PageShell>
      <PageHeader title={title} subtitle={subtitle}>{headerActions}</PageHeader>
      <PinnedKpiStrip suite={suite} ventureId={ventureId} lens={lens} />
      {children}
    </PageShell>
  );
}
```

```typescript
// src/components/suite/index.ts
export { SuiteShell } from './SuiteShell';
```

- [ ] **Step 4: Wire `<PinnedKpiStrip>` into CommandCenter**

In `src/views/CommandCenter.tsx`, add import:

```tsx
import { PinnedKpiStrip } from '../components/pinned-kpi';
```

Find the existing top stat-card row (`<StatCard>` or similar block immediately under the greeting) and REPLACE it with:

```tsx
<PinnedKpiStrip suite="command-center" />
```

- [ ] **Step 5: Wrap CapitalFoundationView in `<SuiteShell>`**

In `src/views/CapitalFoundationView.tsx`, replace the existing `<PageShell>` + `<PageHeader>` block with:

```tsx
<SuiteShell suite="capital" title="Capital Foundation"
  subtitle="The five-tuple primitive powering every venture's monetization — live data from capital_treasury, capital_royalty_graph, capital_distribution_config, capital_compliance_rule_set, and capital_legal_entity.">
  {/* existing tab bar + tab content */}
</SuiteShell>
```

Add import: `import { SuiteShell } from '../components/suite';`

- [ ] **Step 6: Wrap CRMView in `<SuiteShell>`**

In `src/views/CRMView.tsx` apply the equivalent change with `suite="crm"`, `title="CRM"`, appropriate subtitle.

- [ ] **Step 7: Run tests**

Run: `pnpm vitest run src/components/suite/ && pnpm build`
Expected: SuiteShell test PASS + production build succeeds.

- [ ] **Step 8: Commit**

```bash
git add src/components/suite/ src/views/CommandCenter.tsx src/views/CapitalFoundationView.tsx src/views/CRMView.tsx
git commit -m "feat(suite): SuiteShell wrapper + wire into CommandCenter/Capital/CRM (T1.7)"
```

### Task 8: Tile picker UI

**Files:**
- Create: `src/components/pinned-kpi/TilePicker.tsx`
- Modify: `src/components/pinned-kpi/PinnedKpiStrip.tsx` (add gear icon)
- Modify: `src/components/pinned-kpi/index.ts`
- Test: `src/components/pinned-kpi/__tests__/TilePicker.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// src/components/pinned-kpi/__tests__/TilePicker.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TilePicker } from '../TilePicker';
import { useCommandCenter } from '../../../stores/command-center';

describe('<TilePicker>', () => {
  it('lists every definition for the suite + toggles selection on click', () => {
    useCommandCenter.setState({ pinnedKpis: { capital: ['cap_portfolio_nav'] } });
    render(<TilePicker suite="capital" open={true} onClose={() => {}} />);
    expect(screen.getByText('Portfolio NAV')).toBeInTheDocument();
    expect(screen.getByText('Open rounds')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Open rounds'));
    expect(useCommandCenter.getState().pinnedKpis.capital).toContain('cap_open_rounds');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/components/pinned-kpi/__tests__/TilePicker.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `<TilePicker>`**

```tsx
// src/components/pinned-kpi/TilePicker.tsx
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
    <Modal open={open} onClose={onClose} title={`Customize ${suite} tiles`}>
      <div style={{ display: 'grid', gap: 8, padding: 12 }}>
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
    </Modal>
  );
}
```

- [ ] **Step 4: Add gear icon to `<PinnedKpiStrip>`**

In `src/components/pinned-kpi/PinnedKpiStrip.tsx`, add at top of file:

```tsx
import { useState } from 'react';
import { Settings } from 'lucide-react';
import { TilePicker } from './TilePicker';
```

Wrap the existing strip grid in a container with a gear icon:

```tsx
export function PinnedKpiStrip({ suite, ventureId = null, lens = [] }: PinnedKpiStripProps) {
  const custom = useCommandCenter((s) => s.pinnedKpis[suite]);
  const tileIds = custom && custom.length > 0 ? custom : DEFAULT_LOADOUTS[suite];
  const ctx: TileQueryContext = { lens, ventureId, now: new Date() };
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <>
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <button
          onClick={() => setPickerOpen(true)}
          title="Customize tiles"
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
```

- [ ] **Step 5: Barrel export update**

```typescript
// src/components/pinned-kpi/index.ts
export { KpiTile } from './KpiTile';
export { PinnedKpiStrip } from './PinnedKpiStrip';
export { TilePicker } from './TilePicker';
```

- [ ] **Step 6: Run tests + build**

Run: `pnpm vitest run src/components/pinned-kpi/ && pnpm build`
Expected: all tests PASS + build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/components/pinned-kpi/
git commit -m "feat(pinned-kpi): TilePicker gear-modal + strip gear icon (T1.8)"
```

### T1 checkpoint review

- [ ] Run the full tranche test suite: `pnpm vitest run src/lib/pinned-kpi/ src/components/pinned-kpi/ src/components/suite/ src/stores/__tests__/command-center.test.ts`
- [ ] Verify production build: `pnpm build`
- [ ] Manually verify in dev: `pnpm dev` — open `/command-center`, `/capital`, `/crm` and confirm the pinned strip renders + gear icon opens picker + toggling persists across refresh
- [ ] Push branch: `git push -u origin marathon-1-t1-pinned-strip-2026-04-17`
- [ ] Open PR titled `feat(pinned-kpi+suite): marathon-1 tranche T1 — pinned strip + suite shell`

---

## Tranche T2 — Ventures registry + Crown + Corporate Stack + Domain Registry

**Worktree:** `../mcv-one-desktop-t2-ventures-stack`
**Branch:** `marathon-1-t2-ventures-stack-2026-04-17`
**Size:** ~800 LOC + 5 migrations + 1 seed script. 10 tasks.

### File structure

**Create:**
- `supabase/migration-crown-entities-2026-04-17.sql` — `capital_legal_entity` dual-crown columns + MCV Inc + MCV LTD inserts
- `supabase/migration-ventures-expansion-2026-04-17.sql` — ventures columns + is_raising + INSERT new raising ventures
- `supabase/migration-capital-round-ventures-2026-04-17.sql` — round↔venture junction
- `supabase/migration-venture-corporate-stack-2026-04-17.sql` — jurisdictions + accounts + brand_kits
- `supabase/migration-domain-registry-2026-04-17.sql` — domain_registry table
- `scripts/seed-ventures-corporate-stack.ts` — jurisdictions + accounts + brand for every venture
- `src/components/venture/VentureCorporateStack.tsx` — 5-block composition
- `src/components/venture/CorpsBlock.tsx`
- `src/components/venture/JurisdictionsBlock.tsx`
- `src/components/venture/AccountsBlock.tsx`
- `src/components/venture/TeamBlock.tsx`
- `src/components/venture/BrandBlock.tsx`
- `src/components/venture/index.ts`
- `src/components/venture/__tests__/VentureCorporateStack.test.tsx`
- `src/hooks/use-venture-corporate-stack.ts`
- `api/_handlers/venture-stack.ts` — new handler for ventures + corporate-stack reads

### Task 1: Migration — dual-parent crown entities

**Files:**
- Create: `supabase/migration-crown-entities-2026-04-17.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migration-crown-entities-2026-04-17.sql
-- Elevates capital_legal_entity with dual-parent crown support.
-- Seeds MCV Inc. (mcv.inc) and MCV LTD (mcv.ltd) as sovereign 6D crowns.
-- Wires existing EdgeIQ Holdings as a child of MCV Inc.

ALTER TABLE capital_legal_entity
  ADD COLUMN IF NOT EXISTS is_crown boolean NOT NULL DEFAULT false;

ALTER TABLE capital_legal_entity
  ADD COLUMN IF NOT EXISTS parent_crown_id uuid REFERENCES capital_legal_entity(id);

-- Seed MCV Inc. (primary crown — US-DE C-Corp)
INSERT INTO capital_legal_entity (id, name, entity_type, jurisdiction, is_crown)
VALUES (gen_random_uuid(), 'MCV Inc.', 'C-Corp', 'US-DE', true)
ON CONFLICT DO NOTHING;

-- Seed MCV LTD (secondary crown — UK/international)
INSERT INTO capital_legal_entity (id, name, entity_type, jurisdiction, is_crown)
VALUES (gen_random_uuid(), 'MCV LTD', 'Limited Co.', 'UK', true)
ON CONFLICT DO NOTHING;

-- Wire EdgeIQ Holdings under MCV Inc. as the operating conglomerate
UPDATE capital_legal_entity
SET parent_crown_id = (SELECT id FROM capital_legal_entity WHERE name = 'MCV Inc.' AND is_crown = true LIMIT 1)
WHERE name = 'EdgeIQ Holdings';

COMMENT ON COLUMN capital_legal_entity.is_crown IS 'Sovereign 6D entities (MCV Inc. / MCV LTD). Never for sale.';
COMMENT ON COLUMN capital_legal_entity.parent_crown_id IS 'Links operating entities up to their crown parent.';
```

- [ ] **Step 2: Apply via Supabase MCP**

Run the Supabase MCP `apply_migration` tool with name `crown_entities_2026_04_17` and the SQL above.
Expected: migration recorded in `supabase_migrations.schema_migrations`; `SELECT count(*) FROM capital_legal_entity WHERE is_crown` returns 2.

- [ ] **Step 3: Verify**

Run:

```sql
SELECT name, entity_type, jurisdiction, is_crown, parent_crown_id FROM capital_legal_entity ORDER BY is_crown DESC, name;
```

Expected: MCV Inc + MCV LTD rows have `is_crown = true`; EdgeIQ Holdings has `parent_crown_id` set to the MCV Inc uuid.

- [ ] **Step 4: Commit**

```bash
git add supabase/migration-crown-entities-2026-04-17.sql
git commit -m "feat(capital): dual-parent crown — MCV Inc + MCV LTD at 6D (T2.1)"
```

### Task 2: Migration — ventures expansion + new raising ventures

**Files:**
- Create: `supabase/migration-ventures-expansion-2026-04-17.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migration-ventures-expansion-2026-04-17.sql
-- Extends ventures with is_raising, stage, parent_entity_id.
-- Seeds MCV.Tech, MCV.DEV (shared cap with MCV.Tech), MCV.CX, MCV.INC.
-- Flags existing raising ventures.

ALTER TABLE ventures ADD COLUMN IF NOT EXISTS is_raising boolean NOT NULL DEFAULT false;
ALTER TABLE ventures ADD COLUMN IF NOT EXISTS stage text;
ALTER TABLE ventures ADD COLUMN IF NOT EXISTS parent_entity_id uuid REFERENCES capital_legal_entity(id);

-- Flag already-seeded raising ventures
UPDATE ventures SET is_raising = true
WHERE id IN ('futurestate','betedge','mcvgg','warforge');

-- Default-stage assignment for known ventures
UPDATE ventures SET stage = 'seed'      WHERE id IN ('futurestate','betedge');
UPDATE ventures SET stage = 'pre-seed'  WHERE id = 'warforge';
UPDATE ventures SET stage = 'pre-seed'  WHERE id = 'mcvgg';

-- Seed the new raising ventures under EdgeIQ Holdings as their operating parent
WITH eiq AS (SELECT id FROM capital_legal_entity WHERE name = 'EdgeIQ Holdings' LIMIT 1)
INSERT INTO ventures (id, name, is_raising, stage, parent_entity_id) VALUES
  ('mcv-tech', 'MCV.Tech', true, 'pre-seed', (SELECT id FROM eiq)),
  ('mcv-dev',  'MCV.DEV',  true, 'pre-seed', (SELECT id FROM eiq)),
  ('mcv-cx',   'MCV.CX',   true, 'pre-seed', (SELECT id FROM eiq)),
  ('mcv-inc',  'MCV.INC',  false, 'mature',   (SELECT id FROM eiq))
ON CONFLICT (id) DO UPDATE SET
  is_raising = EXCLUDED.is_raising,
  stage = EXCLUDED.stage,
  parent_entity_id = EXCLUDED.parent_entity_id;

COMMENT ON COLUMN ventures.is_raising IS 'TRUE when the venture has an active capital-raise posture.';
COMMENT ON COLUMN ventures.stage IS 'Lifecycle stage: idea | pre-seed | seed | series-a | growth | mature';
```

- [ ] **Step 2: Apply via Supabase MCP**

Apply with name `ventures_expansion_2026_04_17`.
Expected: migration applied; `SELECT count(*) FROM ventures WHERE is_raising = true` returns 7 (futurestate, betedge, mcvgg, warforge, mcv-tech, mcv-dev, mcv-cx).

- [ ] **Step 3: Commit**

```bash
git add supabase/migration-ventures-expansion-2026-04-17.sql
git commit -m "feat(ventures): expansion + MCV.Tech/DEV/CX/INC seeded + is_raising flag (T2.2)"
```

### Task 3: Migration — capital_round_ventures junction

**Files:**
- Create: `supabase/migration-capital-round-ventures-2026-04-17.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migration-capital-round-ventures-2026-04-17.sql
-- Supports rounds that span multiple ventures (e.g., MCV.Tech + MCV.DEV shared cap).
-- The legacy capital_rounds.venture_id stays as the primary/denormalized pointer.

CREATE TABLE IF NOT EXISTS capital_round_ventures (
  round_id uuid NOT NULL REFERENCES capital_rounds(id) ON DELETE CASCADE,
  venture_id text NOT NULL REFERENCES ventures(id) ON DELETE RESTRICT,
  allocation_pct numeric NOT NULL CHECK (allocation_pct >= 0 AND allocation_pct <= 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (round_id, venture_id)
);

CREATE INDEX IF NOT EXISTS idx_crv_venture ON capital_round_ventures(venture_id);

COMMENT ON TABLE capital_round_ventures IS 'Multi-venture round mapping with split percentage. Primary venture remains on capital_rounds.venture_id for fast lookups.';

-- Back-fill: every existing capital_rounds row gets a single-venture entry at 100%
INSERT INTO capital_round_ventures (round_id, venture_id, allocation_pct)
SELECT id, venture_id, 100 FROM capital_rounds
WHERE venture_id IS NOT NULL
ON CONFLICT DO NOTHING;
```

- [ ] **Step 2: Apply via Supabase MCP**

Apply with name `capital_round_ventures_2026_04_17`.
Expected: table created; back-fill matches `SELECT count(*) FROM capital_rounds WHERE venture_id IS NOT NULL`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migration-capital-round-ventures-2026-04-17.sql
git commit -m "feat(capital): capital_round_ventures junction for shared-cap rounds (T2.3)"
```

### Task 4: Migration — Corporate Stack tables

**Files:**
- Create: `supabase/migration-venture-corporate-stack-2026-04-17.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migration-venture-corporate-stack-2026-04-17.sql
-- Ships the Corporate Stack primitive: jurisdictions + accounts + brand kits per venture.

CREATE TABLE IF NOT EXISTS venture_jurisdictions (
  venture_id text NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  jurisdiction_code text NOT NULL,
  regulatory_frameworks text[] NOT NULL DEFAULT '{}',
  tax_structure text,
  compliance_rule_set_id uuid REFERENCES capital_compliance_rule_set(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (venture_id, jurisdiction_code)
);

CREATE TABLE IF NOT EXISTS venture_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id text NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  account_type text NOT NULL CHECK (account_type IN ('bank','treasury','merchant','tax','crypto')),
  provider text NOT NULL,
  account_ref text,
  currency text NOT NULL,
  balance_cached numeric,
  balance_synced_at timestamptz,
  treasury_id uuid REFERENCES capital_treasury(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_venture_accounts_venture ON venture_accounts(venture_id);

CREATE TABLE IF NOT EXISTS venture_brand_kits (
  venture_id text PRIMARY KEY REFERENCES ventures(id) ON DELETE CASCADE,
  primary_domain text,                        -- FK added in domain-registry migration (deferred)
  logo_asset_id uuid,
  color_primary text,
  color_accent text,
  voice_persona_id uuid,                      -- FK added in T5 personas migration
  brand_kit_version text,
  style_guide_content_id uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE venture_jurisdictions IS 'Where a venture legally operates + its regulatory framework + tax structure.';
COMMENT ON TABLE venture_accounts IS 'Bank + treasury + merchant + tax + crypto accounts attached to a venture.';
COMMENT ON TABLE venture_brand_kits IS 'Brand identity per venture: domain, voice, colors, style guide.';
```

- [ ] **Step 2: Apply via Supabase MCP**

Apply with name `venture_corporate_stack_2026_04_17`.
Expected: three tables created.

- [ ] **Step 3: Commit**

```bash
git add supabase/migration-venture-corporate-stack-2026-04-17.sql
git commit -m "feat(venture): Corporate Stack tables — jurisdictions + accounts + brand kits (T2.4)"
```

### Task 5: Migration — domain_registry

**Files:**
- Create: `supabase/migration-domain-registry-2026-04-17.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migration-domain-registry-2026-04-17.sql
-- Authoritative registry of every domain the conglomerate owns.
-- First-run sync pulls from Namecheap API + Cloudflare Zones API (integration lands post-T2).

CREATE TABLE IF NOT EXISTS domain_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fqdn text UNIQUE NOT NULL,
  registrar text,
  registrar_ref text,
  cloudflare_zone_id text,
  parent_entity_id uuid REFERENCES capital_legal_entity(id),
  venture_id text REFERENCES ventures(id),
  nameservers text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','expiring','expired','transfer','parked')),
  registered_at date,
  expires_at date,
  auto_renew boolean,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_domain_registry_venture ON domain_registry(venture_id);
CREATE INDEX IF NOT EXISTS idx_domain_registry_parent ON domain_registry(parent_entity_id);

-- Minimal known-domain seed so UI has something to render pre-sync
WITH mcv_inc AS (SELECT id FROM capital_legal_entity WHERE name = 'MCV Inc.' LIMIT 1),
     mcv_ltd AS (SELECT id FROM capital_legal_entity WHERE name = 'MCV LTD' LIMIT 1)
INSERT INTO domain_registry (fqdn, registrar, parent_entity_id, venture_id, status) VALUES
  ('mcv.inc',        'Namecheap', (SELECT id FROM mcv_inc), 'mcv-inc',  'active'),
  ('mcv.ltd',        'Namecheap', (SELECT id FROM mcv_ltd), NULL,       'active'),
  ('mcv.one',        'Namecheap', (SELECT id FROM mcv_inc), NULL,       'active'),
  ('mcv.cx',         'Namecheap', (SELECT id FROM mcv_inc), 'mcv-cx',   'active'),
  ('mcv.gg',         'Namecheap', (SELECT id FROM mcv_inc), 'mcvgg',    'active'),
  ('mcv.dev',        'Namecheap', (SELECT id FROM mcv_inc), 'mcv-dev',  'active'),
  ('mcv.tech',       'Namecheap', (SELECT id FROM mcv_inc), 'mcv-tech', 'active'),
  ('futurestate.ai', 'Namecheap', (SELECT id FROM mcv_inc), 'futurestate','active'),
  ('betedge.ai',     'Namecheap', (SELECT id FROM mcv_inc), 'betedge',  'active')
ON CONFLICT (fqdn) DO NOTHING;

-- Now that domain_registry exists, add deferrable FK from venture_brand_kits
ALTER TABLE venture_brand_kits
  ADD CONSTRAINT fk_venture_brand_kits_domain
  FOREIGN KEY (primary_domain) REFERENCES domain_registry(fqdn)
  DEFERRABLE INITIALLY DEFERRED;

COMMENT ON TABLE domain_registry IS 'Sovereign registry of every owned domain. Synced from Namecheap + Cloudflare.';
```

- [ ] **Step 2: Apply via Supabase MCP**

Apply with name `domain_registry_2026_04_17`.
Expected: table created + 9 seeded rows + deferred FK from `venture_brand_kits`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migration-domain-registry-2026-04-17.sql
git commit -m "feat(domain): domain_registry + initial 9-domain seed (T2.5)"
```

### Task 6: Seed script — Corporate Stack for every venture

**Files:**
- Create: `scripts/seed-ventures-corporate-stack.ts`

- [ ] **Step 1: Write the seed script**

```typescript
// scripts/seed-ventures-corporate-stack.ts
// Idempotent seed for jurisdictions + accounts + brand_kits across every venture.
// Run: pnpm tsx scripts/seed-ventures-corporate-stack.ts
// Requires: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in env.

import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !key) throw new Error('SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY required');

const supabase = createClient(url, key, { auth: { persistSession: false } });

interface JurisdictionSeed {
  venture_id: string;
  jurisdiction_code: string;
  regulatory_frameworks: string[];
  tax_structure: string;
}
interface AccountSeed {
  venture_id: string;
  account_type: 'bank' | 'treasury' | 'merchant' | 'tax' | 'crypto';
  provider: string;
  currency: string;
  account_ref?: string;
}
interface BrandKitSeed {
  venture_id: string;
  primary_domain: string;
  color_primary: string;
  color_accent: string;
  brand_kit_version: string;
}

const jurisdictions: JurisdictionSeed[] = [
  { venture_id: 'futurestate', jurisdiction_code: 'US-DE', regulatory_frameworks: ['Reg D 506(c)'], tax_structure: 'C-Corp' },
  { venture_id: 'futurestate', jurisdiction_code: 'CA-ON', regulatory_frameworks: ['NI 45-106'],   tax_structure: 'CCPC' },
  { venture_id: 'betedge',     jurisdiction_code: 'CA-ON', regulatory_frameworks: ['AGCO Ontario iGaming'], tax_structure: 'CCPC' },
  { venture_id: 'mcvgg',       jurisdiction_code: 'Global', regulatory_frameworks: ['Token Sale'], tax_structure: 'TBD' },
  { venture_id: 'warforge',    jurisdiction_code: 'US-DE', regulatory_frameworks: [], tax_structure: 'C-Corp' },
  { venture_id: 'mcv-tech',    jurisdiction_code: 'US-DE', regulatory_frameworks: [], tax_structure: 'C-Corp' },
  { venture_id: 'mcv-dev',     jurisdiction_code: 'US-DE', regulatory_frameworks: [], tax_structure: 'C-Corp' },
  { venture_id: 'mcv-cx',      jurisdiction_code: 'US-DE', regulatory_frameworks: [], tax_structure: 'C-Corp' },
  { venture_id: 'mcv-inc',     jurisdiction_code: 'US-DE', regulatory_frameworks: [], tax_structure: 'C-Corp' },
];

const accounts: AccountSeed[] = [
  { venture_id: 'futurestate', account_type: 'bank',     provider: 'Mercury', currency: 'USD' },
  { venture_id: 'futurestate', account_type: 'bank',     provider: 'Wise',    currency: 'CAD' },
  { venture_id: 'futurestate', account_type: 'treasury', provider: 'USDC',    currency: 'USDC' },
  { venture_id: 'futurestate', account_type: 'merchant', provider: 'Stripe',  currency: 'USD' },
  { venture_id: 'betedge',     account_type: 'bank',     provider: 'Mercury', currency: 'CAD' },
  { venture_id: 'mcvgg',       account_type: 'treasury', provider: 'USDC',    currency: 'USDC' },
];

const brandKits: BrandKitSeed[] = [
  { venture_id: 'futurestate', primary_domain: 'futurestate.ai', color_primary: '#00F5FF', color_accent: '#8B5CF6', brand_kit_version: 'v2.1' },
  { venture_id: 'betedge',     primary_domain: 'betedge.ai',     color_primary: '#8B5CF6', color_accent: '#00F5FF', brand_kit_version: 'v1.0' },
  { venture_id: 'mcvgg',       primary_domain: 'mcv.gg',         color_primary: '#F472B6', color_accent: '#00F5FF', brand_kit_version: 'v1.0' },
  { venture_id: 'mcv-tech',    primary_domain: 'mcv.tech',       color_primary: '#6EE7B7', color_accent: '#00F5FF', brand_kit_version: 'v0.1' },
  { venture_id: 'mcv-dev',     primary_domain: 'mcv.dev',        color_primary: '#6EE7B7', color_accent: '#00F5FF', brand_kit_version: 'v0.1' },
  { venture_id: 'mcv-cx',      primary_domain: 'mcv.cx',         color_primary: '#F472B6', color_accent: '#00F5FF', brand_kit_version: 'v0.1' },
  { venture_id: 'mcv-inc',     primary_domain: 'mcv.inc',        color_primary: '#00F5FF', color_accent: '#8B5CF6', brand_kit_version: 'sovereign' },
];

async function main() {
  const { error: je } = await supabase.from('venture_jurisdictions').upsert(jurisdictions, { onConflict: 'venture_id,jurisdiction_code' });
  if (je) throw je;

  // Accounts don't have a natural composite key — use insert on conflict do nothing pattern
  for (const a of accounts) {
    const existing = await supabase.from('venture_accounts')
      .select('id').eq('venture_id', a.venture_id).eq('account_type', a.account_type).eq('provider', a.provider).maybeSingle();
    if (!existing.data) {
      const { error } = await supabase.from('venture_accounts').insert(a);
      if (error) throw error;
    }
  }

  const { error: be } = await supabase.from('venture_brand_kits').upsert(brandKits, { onConflict: 'venture_id' });
  if (be) throw be;

  console.log('✅ Corporate Stack seed complete');
  console.log(`   ${jurisdictions.length} jurisdictions`);
  console.log(`   ${accounts.length} accounts (if new)`);
  console.log(`   ${brandKits.length} brand kits`);
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Run the seed script**

Run: `pnpm tsx scripts/seed-ventures-corporate-stack.ts`
Expected: `✅ Corporate Stack seed complete` with counts.

- [ ] **Step 3: Commit**

```bash
git add scripts/seed-ventures-corporate-stack.ts
git commit -m "feat(ventures): Corporate Stack seed — jurisdictions + accounts + brand (T2.6)"
```

### Task 7: API handler for ventures + corporate-stack reads

**Files:**
- Create: `api/_handlers/venture-stack.ts`

- [ ] **Step 1: Write the handler**

```typescript
// api/_handlers/venture-stack.ts
// Read-only API for venture + corporate-stack consumption.
// Actions: list-ventures, get-venture, list-jurisdictions, list-accounts, get-brand-kit.

import type { SupabaseClient } from '@supabase/supabase-js';

export interface VentureStackRequest {
  action:
    | 'list-ventures'
    | 'get-venture'
    | 'list-jurisdictions'
    | 'list-accounts'
    | 'get-brand-kit';
  ventureId?: string;
}

export async function handleVentureStack(supabase: SupabaseClient, req: VentureStackRequest) {
  switch (req.action) {
    case 'list-ventures': {
      const { data, error } = await supabase
        .from('ventures')
        .select('id, name, is_raising, stage, parent_entity_id')
        .order('name');
      if (error) throw error;
      return { ventures: data };
    }
    case 'get-venture': {
      if (!req.ventureId) throw new Error('ventureId required');
      const { data, error } = await supabase
        .from('ventures')
        .select('id, name, is_raising, stage, parent_entity_id')
        .eq('id', req.ventureId)
        .maybeSingle();
      if (error) throw error;
      return { venture: data };
    }
    case 'list-jurisdictions': {
      if (!req.ventureId) throw new Error('ventureId required');
      const { data, error } = await supabase
        .from('venture_jurisdictions')
        .select('*')
        .eq('venture_id', req.ventureId);
      if (error) throw error;
      return { jurisdictions: data };
    }
    case 'list-accounts': {
      if (!req.ventureId) throw new Error('ventureId required');
      const { data, error } = await supabase
        .from('venture_accounts')
        .select('*')
        .eq('venture_id', req.ventureId);
      if (error) throw error;
      return { accounts: data };
    }
    case 'get-brand-kit': {
      if (!req.ventureId) throw new Error('ventureId required');
      const { data, error } = await supabase
        .from('venture_brand_kits')
        .select('*')
        .eq('venture_id', req.ventureId)
        .maybeSingle();
      if (error) throw error;
      return { brandKit: data };
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add api/_handlers/venture-stack.ts
git commit -m "feat(api): venture-stack handler — ventures + corporate stack reads (T2.7)"
```

### Task 8: Hook — useVentureCorporateStack

**Files:**
- Create: `src/hooks/use-venture-corporate-stack.ts`

- [ ] **Step 1: Write the hook**

```typescript
// src/hooks/use-venture-corporate-stack.ts
import { useQuery } from '@tanstack/react-query';

interface Jurisdiction { venture_id: string; jurisdiction_code: string; regulatory_frameworks: string[]; tax_structure: string | null }
interface VAccount { id: string; venture_id: string; account_type: string; provider: string; currency: string; balance_cached: number | null }
interface BrandKit { venture_id: string; primary_domain: string | null; color_primary: string | null; color_accent: string | null; brand_kit_version: string | null }

async function callVentureStack<T>(action: string, ventureId?: string): Promise<T> {
  const res = await fetch('/api/venture-stack', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action, ventureId }),
  });
  if (!res.ok) throw new Error(`venture-stack ${action} failed: ${res.status}`);
  return res.json();
}

export function useVentureCorporateStack(ventureId: string | null) {
  const jurisdictions = useQuery({
    queryKey: ['venture-stack', 'jurisdictions', ventureId],
    queryFn: () => callVentureStack<{ jurisdictions: Jurisdiction[] }>('list-jurisdictions', ventureId!),
    enabled: !!ventureId,
  });
  const accounts = useQuery({
    queryKey: ['venture-stack', 'accounts', ventureId],
    queryFn: () => callVentureStack<{ accounts: VAccount[] }>('list-accounts', ventureId!),
    enabled: !!ventureId,
  });
  const brandKit = useQuery({
    queryKey: ['venture-stack', 'brand-kit', ventureId],
    queryFn: () => callVentureStack<{ brandKit: BrandKit | null }>('get-brand-kit', ventureId!),
    enabled: !!ventureId,
  });

  return {
    jurisdictions: jurisdictions.data?.jurisdictions ?? [],
    accounts: accounts.data?.accounts ?? [],
    brandKit: brandKit.data?.brandKit ?? null,
    isLoading: jurisdictions.isLoading || accounts.isLoading || brandKit.isLoading,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/use-venture-corporate-stack.ts
git commit -m "feat(hooks): useVentureCorporateStack — fetch 3 blocks concurrently (T2.8)"
```

### Task 9: `<VentureCorporateStack>` + 5 block components

**Files:**
- Create: `src/components/venture/CorpsBlock.tsx`
- Create: `src/components/venture/JurisdictionsBlock.tsx`
- Create: `src/components/venture/AccountsBlock.tsx`
- Create: `src/components/venture/TeamBlock.tsx`
- Create: `src/components/venture/BrandBlock.tsx`
- Create: `src/components/venture/VentureCorporateStack.tsx`
- Create: `src/components/venture/index.ts`
- Test: `src/components/venture/__tests__/VentureCorporateStack.test.tsx`

- [ ] **Step 1: Write block components (minimal, consistent shape)**

```tsx
// src/components/venture/CorpsBlock.tsx
export function CorpsBlock({ corps }: { corps: Array<{ name: string; jurisdiction: string }> }) {
  return (
    <StackBlock label="🏢 Corps">
      {corps.length === 0 ? <Empty /> : corps.map((c, i) => (
        <div key={i} style={lineStyle}>{c.name} <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>({c.jurisdiction})</span></div>
      ))}
    </StackBlock>
  );
}

// src/components/venture/JurisdictionsBlock.tsx
export function JurisdictionsBlock({ jurisdictions }: { jurisdictions: Array<{ jurisdiction_code: string; regulatory_frameworks: string[]; tax_structure: string | null }> }) {
  return (
    <StackBlock label="🌐 Jurisdictions">
      {jurisdictions.length === 0 ? <Empty /> : jurisdictions.map((j, i) => (
        <div key={i} style={lineStyle}>
          {j.jurisdiction_code}
          {j.regulatory_frameworks.length > 0 && <span style={{ color: 'var(--text-muted)', fontSize: 10 }}> · {j.regulatory_frameworks.join(' · ')}</span>}
        </div>
      ))}
    </StackBlock>
  );
}

// src/components/venture/AccountsBlock.tsx
export function AccountsBlock({ accounts }: { accounts: Array<{ account_type: string; provider: string; currency: string; balance_cached: number | null }> }) {
  return (
    <StackBlock label="🏦 Accounts">
      {accounts.length === 0 ? <Empty /> : accounts.map((a, i) => (
        <div key={i} style={lineStyle}>
          {a.provider} <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>({a.account_type} · {a.currency})</span>
        </div>
      ))}
    </StackBlock>
  );
}

// src/components/venture/TeamBlock.tsx
export function TeamBlock({ team }: { team: Array<{ name: string; role?: string }> }) {
  return (
    <StackBlock label="👥 Team">
      {team.length === 0 ? <Empty /> : team.map((m, i) => (
        <div key={i} style={lineStyle}>{m.name} {m.role && <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>· {m.role}</span>}</div>
      ))}
    </StackBlock>
  );
}

// src/components/venture/BrandBlock.tsx
export function BrandBlock({ brand }: { brand: { primary_domain: string | null; color_primary: string | null; brand_kit_version: string | null } | null }) {
  return (
    <StackBlock label="🎨 Brand">
      {!brand ? <Empty /> : (
        <>
          <div style={lineStyle}>{brand.primary_domain ?? '—'}</div>
          {brand.color_primary && <div style={{ ...lineStyle, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: brand.color_primary }} />
            {brand.color_primary}
          </div>}
          {brand.brand_kit_version && <div style={lineStyle}>kit {brand.brand_kit_version}</div>}
        </>
      )}
    </StackBlock>
  );
}

// shared block shell + helpers — export from a primitives file
const StackBlock = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ padding: 10, border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.1em' }}>{label}</div>
    <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-primary)', lineHeight: 1.5 }}>{children}</div>
  </div>
);
const Empty = () => <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 11 }}>—</span>;
const lineStyle = { marginTop: 2 };
```

(Each block goes in its own file; `StackBlock`/`Empty`/`lineStyle` are duplicated into each file or exported from a shared `_shell.tsx`. For DRY, create `src/components/venture/_shell.tsx` with those helpers and import.)

- [ ] **Step 2: Create shared shell helpers**

```tsx
// src/components/venture/_shell.tsx
import type { ReactNode } from 'react';

export const StackBlock = ({ label, children }: { label: string; children: ReactNode }) => (
  <div style={{ padding: 10, border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.1em' }}>{label}</div>
    <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-primary)', lineHeight: 1.5 }}>{children}</div>
  </div>
);

export const Empty = () => <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 11 }}>—</span>;
export const lineStyle = { marginTop: 2 } as const;
```

Each block file then imports `{ StackBlock, Empty, lineStyle }` from `'./_shell'`.

- [ ] **Step 3: Implement `<VentureCorporateStack>`**

```tsx
// src/components/venture/VentureCorporateStack.tsx
import { useVentureCorporateStack } from '../../hooks/use-venture-corporate-stack';
import { CorpsBlock } from './CorpsBlock';
import { JurisdictionsBlock } from './JurisdictionsBlock';
import { AccountsBlock } from './AccountsBlock';
import { TeamBlock } from './TeamBlock';
import { BrandBlock } from './BrandBlock';

interface Props { ventureId: string | null }

export function VentureCorporateStack({ ventureId }: Props) {
  const { jurisdictions, accounts, brandKit, isLoading } = useVentureCorporateStack(ventureId);

  if (!ventureId) return null;
  if (isLoading) return <div style={{ padding: 12, color: 'var(--text-muted)' }}>Loading corporate stack…</div>;

  // Corps derived from jurisdictions tax_structure for v1 — a richer corps fetch lands in T2.follow-up
  const corps = jurisdictions.map((j) => ({ name: `${ventureId} · ${j.tax_structure ?? 'entity'}`, jurisdiction: j.jurisdiction_code }));
  const team: Array<{ name: string; role?: string }> = []; // Team fetch wires in T5 (personas)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 12 }}>
      <CorpsBlock corps={corps} />
      <JurisdictionsBlock jurisdictions={jurisdictions} />
      <AccountsBlock accounts={accounts} />
      <TeamBlock team={team} />
      <BrandBlock brand={brandKit} />
    </div>
  );
}
```

- [ ] **Step 4: Barrel export**

```typescript
// src/components/venture/index.ts
export { VentureCorporateStack } from './VentureCorporateStack';
export { CorpsBlock } from './CorpsBlock';
export { JurisdictionsBlock } from './JurisdictionsBlock';
export { AccountsBlock } from './AccountsBlock';
export { TeamBlock } from './TeamBlock';
export { BrandBlock } from './BrandBlock';
```

- [ ] **Step 5: Write component test**

```tsx
// src/components/venture/__tests__/VentureCorporateStack.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { VentureCorporateStack } from '../VentureCorporateStack';

global.fetch = vi.fn(async (_url, init) => {
  const body = JSON.parse((init as RequestInit).body as string);
  const responses: Record<string, unknown> = {
    'list-jurisdictions': { jurisdictions: [{ venture_id: 'futurestate', jurisdiction_code: 'US-DE', regulatory_frameworks: ['Reg D 506(c)'], tax_structure: 'C-Corp' }] },
    'list-accounts':      { accounts: [{ id: '1', venture_id: 'futurestate', account_type: 'bank', provider: 'Mercury', currency: 'USD', balance_cached: null }] },
    'get-brand-kit':      { brandKit: { venture_id: 'futurestate', primary_domain: 'futurestate.ai', color_primary: '#00F5FF', color_accent: '#8B5CF6', brand_kit_version: 'v2.1' } },
  };
  return { ok: true, json: async () => responses[body.action] } as Response;
}) as typeof fetch;

describe('<VentureCorporateStack>', () => {
  it('renders all 5 blocks for a venture', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={qc}><VentureCorporateStack ventureId="futurestate" /></QueryClientProvider>);
    await waitFor(() => expect(screen.getByText(/futurestate.ai/)).toBeInTheDocument());
    expect(screen.getByText(/🏢 Corps/)).toBeInTheDocument();
    expect(screen.getByText(/🌐 Jurisdictions/)).toBeInTheDocument();
    expect(screen.getByText(/🏦 Accounts/)).toBeInTheDocument();
    expect(screen.getByText(/👥 Team/)).toBeInTheDocument();
    expect(screen.getByText(/🎨 Brand/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Run tests**

Run: `pnpm vitest run src/components/venture/`
Expected: 1 test PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/venture/ src/hooks/use-venture-corporate-stack.ts
git commit -m "feat(venture): VentureCorporateStack + 5 block components (T2.9)"
```

### Task 10: Route `/api/venture-stack` + test end-to-end

**Files:**
- Create: `api/venture-stack.ts` (route file — Vercel serverless or app router wrapper depending on current convention)

- [ ] **Step 1: Inspect existing handler wiring**

Check `api/` directory for the current convention — e.g., `api/capital.ts` wires `handleCapital`. Match that pattern for `venture-stack`.

- [ ] **Step 2: Create the route file following the project's pattern**

Example (Vercel-style):

```typescript
// api/venture-stack.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServiceClient } from '../src/lib/supabase';
import { handleVentureStack, type VentureStackRequest } from './_handlers/venture-stack';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  try {
    const result = await handleVentureStack(getServiceClient(), req.body as VentureStackRequest);
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
}
```

- [ ] **Step 3: Run dev + curl a smoke check**

```bash
pnpm dev &
sleep 4
curl -X POST http://localhost:5173/api/venture-stack \
  -H 'content-type: application/json' \
  -d '{"action":"list-ventures"}'
```

Expected: JSON response with `ventures` array containing 11+ rows (original 7 + MCV.Tech/DEV/CX/INC).

- [ ] **Step 4: Commit**

```bash
git add api/venture-stack.ts
git commit -m "feat(api): wire /api/venture-stack route (T2.10)"
```

### T2 checkpoint review

- [ ] Run migrations check: `SELECT * FROM supabase_migrations.schema_migrations WHERE name LIKE '%2026_04_17%' ORDER BY version;` → 5 rows
- [ ] Verify data: `SELECT count(*) FROM venture_brand_kits` → 7+; `SELECT count(*) FROM venture_jurisdictions` → 9+; `SELECT count(*) FROM domain_registry` → 9+
- [ ] Build: `pnpm build` — must succeed
- [ ] Push: `git push -u origin marathon-1-t2-ventures-stack-2026-04-17`
- [ ] Open PR titled `feat(ventures+corporate-stack): marathon-1 tranche T2 — ventures expansion + dual crown + corp stack + domain registry`

---

## Tranche T3 — Operator-Seeded Prospect Intake

**Worktree:** `../mcv-one-desktop-t3-operator-prospects`
**Branch:** `marathon-1-t3-operator-prospects-2026-04-17`
**Size:** ~900 LOC + 1 migration + 1 seed script. 8 tasks.

### File structure

**Create:**
- `supabase/migration-prospect-profiles-operator-2026-04-17.sql` — extension columns
- `src/components/prospects/OperatorProspectIntakeWizard.tsx` — multi-step shell
- `src/components/prospects/operator-intake-steps/IdentityStep.tsx`
- `src/components/prospects/operator-intake-steps/IntelStep.tsx`
- `src/components/prospects/operator-intake-steps/RelationshipStep.tsx`
- `src/components/prospects/operator-intake-steps/AssignAgentStep.tsx`
- `src/components/prospects/operator-intake-steps/ReviewStep.tsx`
- `src/components/prospects/__tests__/OperatorProspectIntakeWizard.test.tsx`
- `scripts/seed-operator-prospects-hunter-kirill.ts`

**Modify:**
- `src/views/ProspectsView.tsx` — add "New Prospect (Operator)" CTA + intake_source badge
- `src/hooks/use-prospects.ts` — add `useCreateOperatorProspect`
- `api/_handlers/prospects.ts` — add `create-operator-prospect` action

### Task 1: Migration — prospect_profiles operator extension

**Files:**
- Create: `supabase/migration-prospect-profiles-operator-2026-04-17.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migration-prospect-profiles-operator-2026-04-17.sql
-- Extends prospect_profiles with operator-authored intel fields.
-- Adds intake_source discriminator so wizard-captured vs operator-seeded rows are distinguishable.

ALTER TABLE prospect_profiles
  ADD COLUMN IF NOT EXISTS intake_source text NOT NULL DEFAULT 'wizard' CHECK (intake_source IN ('wizard','operator','referral','import')),
  ADD COLUMN IF NOT EXISTS operator_notes text,
  ADD COLUMN IF NOT EXISTS relationship_history text,
  ADD COLUMN IF NOT EXISTS prior_deals jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS aum_estimate numeric,
  ADD COLUMN IF NOT EXISTS check_size_range text,
  ADD COLUMN IF NOT EXISTS investor_thesis text,
  ADD COLUMN IF NOT EXISTS social_profiles jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('hot','warm','medium','cold')),
  ADD COLUMN IF NOT EXISTS archetype text;  -- gamification class per §12 of spec

CREATE INDEX IF NOT EXISTS idx_prospect_profiles_intake_source ON prospect_profiles(intake_source);
CREATE INDEX IF NOT EXISTS idx_prospect_profiles_priority ON prospect_profiles(priority);

COMMENT ON COLUMN prospect_profiles.intake_source IS 'wizard = public funnel | operator = Tony-seeded | referral | import';
COMMENT ON COLUMN prospect_profiles.archetype IS 'Character class per gamification model — investor/operator/creator/advisor/partner/contributor/customer/founder/vendor';
```

- [ ] **Step 2: Apply via Supabase MCP**

Apply with name `prospect_profiles_operator_2026_04_17`.
Expected: migration applied; `SELECT intake_source, count(*) FROM prospect_profiles GROUP BY 1` shows all existing rows default to `wizard`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migration-prospect-profiles-operator-2026-04-17.sql
git commit -m "feat(prospects): operator intake columns + archetype + priority (T3.1)"
```

### Task 2: API handler — create-operator-prospect action

**Files:**
- Modify: `api/_handlers/prospects.ts` (or create if absent — match existing handler pattern)

- [ ] **Step 1: Add the handler action**

In the existing prospects handler `switch(action)`, add:

```typescript
case 'create-operator-prospect': {
  const body = req as {
    action: 'create-operator-prospect';
    email: string;
    fullName?: string;
    country?: string;
    roleHint?: string;
    sourceVentureId?: string;
    track: string;
    operatorNotes?: string;
    relationshipHistory?: string;
    priorDeals?: unknown[];
    aumEstimate?: number;
    checkSizeRange?: string;
    investorThesis?: string;
    socialProfiles?: Record<string, string>;
    priority?: 'hot' | 'warm' | 'medium' | 'cold';
    archetype?: string;
    assignedPersonaId?: string;
  };

  // 1. Upsert prospect_profile
  const { data: profile, error: pe } = await supabase
    .from('prospect_profiles')
    .upsert({
      email: body.email,
      full_name: body.fullName,
      country: body.country,
      role_hint: body.roleHint,
      source_venture_id: body.sourceVentureId ?? 'futurestate',
      intake_source: 'operator',
      operator_notes: body.operatorNotes,
      relationship_history: body.relationshipHistory,
      prior_deals: body.priorDeals ?? [],
      aum_estimate: body.aumEstimate,
      check_size_range: body.checkSizeRange,
      investor_thesis: body.investorThesis,
      social_profiles: body.socialProfiles ?? {},
      priority: body.priority ?? 'medium',
      archetype: body.archetype,
    }, { onConflict: 'email' })
    .select('*')
    .single();
  if (pe) throw pe;

  // 2. Create a journey row tied to the track + assigned persona
  const { data: journey, error: je } = await supabase
    .from('prospect_journeys')
    .insert({
      prospect_profile_id: profile.id,
      track: body.track,
      status: 'active',
      current_step_index: 0,
      agent_id: body.assignedPersonaId,
    })
    .select('*')
    .single();
  if (je) throw je;

  return { profile, journey };
}
```

- [ ] **Step 2: Commit**

```bash
git add api/_handlers/prospects.ts
git commit -m "feat(api): create-operator-prospect action with journey auto-create (T3.2)"
```

### Task 3: Hook — useCreateOperatorProspect

**Files:**
- Modify: `src/hooks/use-prospects.ts`

- [ ] **Step 1: Add the mutation hook**

Append to `src/hooks/use-prospects.ts`:

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

export interface OperatorProspectInput {
  email: string;
  fullName?: string;
  country?: string;
  roleHint?: string;
  sourceVentureId?: string;
  track: string;
  operatorNotes?: string;
  relationshipHistory?: string;
  priorDeals?: unknown[];
  aumEstimate?: number;
  checkSizeRange?: string;
  investorThesis?: string;
  socialProfiles?: Record<string, string>;
  priority?: 'hot' | 'warm' | 'medium' | 'cold';
  archetype?: string;
  assignedPersonaId?: string;
}

export function useCreateOperatorProspect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: OperatorProspectInput) => {
      const res = await fetch('/api/prospects', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'create-operator-prospect', ...input }),
      });
      if (!res.ok) throw new Error(`create-operator-prospect failed: ${res.status}`);
      return res.json() as Promise<{ profile: any; journey: any }>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prospects'] });
      qc.invalidateQueries({ queryKey: ['captures'] });
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/use-prospects.ts
git commit -m "feat(hooks): useCreateOperatorProspect mutation (T3.3)"
```

### Task 4: Wizard shell — OperatorProspectIntakeWizard

**Files:**
- Create: `src/components/prospects/OperatorProspectIntakeWizard.tsx`

- [ ] **Step 1: Implement the multi-step wizard shell**

```tsx
// src/components/prospects/OperatorProspectIntakeWizard.tsx
import { useState } from 'react';
import { Modal } from '../ui';
import { useCreateOperatorProspect, type OperatorProspectInput } from '../../hooks/use-prospects';
import { IdentityStep } from './operator-intake-steps/IdentityStep';
import { IntelStep } from './operator-intake-steps/IntelStep';
import { RelationshipStep } from './operator-intake-steps/RelationshipStep';
import { AssignAgentStep } from './operator-intake-steps/AssignAgentStep';
import { ReviewStep } from './operator-intake-steps/ReviewStep';

const STEPS = ['identity', 'intel', 'relationship', 'assign', 'review'] as const;
type StepId = typeof STEPS[number];

interface Props { open: boolean; onClose: () => void }

export function OperatorProspectIntakeWizard({ open, onClose }: Props) {
  const [step, setStep] = useState<StepId>('identity');
  const [input, setInput] = useState<OperatorProspectInput>({
    email: '',
    track: 'investor_accredited',
    sourceVentureId: 'futurestate',
    priority: 'warm',
    archetype: 'investor',
  });

  const createProspect = useCreateOperatorProspect();

  const idx = STEPS.indexOf(step);
  const next = () => setStep(STEPS[Math.min(idx + 1, STEPS.length - 1)]);
  const back = () => setStep(STEPS[Math.max(idx - 1, 0)]);

  const submit = async () => {
    await createProspect.mutateAsync(input);
    onClose();
    setStep('identity');
    setInput({ email: '', track: 'investor_accredited', sourceVentureId: 'futurestate', priority: 'warm', archetype: 'investor' });
  };

  const canAdvance = step === 'identity' ? !!input.email : true;

  return (
    <Modal open={open} onClose={onClose} title="Seed a prospect — operator intake">
      <div style={{ padding: 16, minWidth: 520 }}>
        {/* step indicator */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: i <= idx ? 'var(--color-brand-electric)' : 'var(--border-subtle)',
            }} />
          ))}
        </div>

        {step === 'identity'     && <IdentityStep     input={input} onChange={setInput} />}
        {step === 'intel'        && <IntelStep        input={input} onChange={setInput} />}
        {step === 'relationship' && <RelationshipStep input={input} onChange={setInput} />}
        {step === 'assign'       && <AssignAgentStep  input={input} onChange={setInput} />}
        {step === 'review'       && <ReviewStep       input={input} />}

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={back} disabled={idx === 0} style={secondaryBtn}>← back</button>
          {step !== 'review' ? (
            <button onClick={next} disabled={!canAdvance} style={primaryBtn}>continue →</button>
          ) : (
            <button onClick={submit} disabled={createProspect.isPending} style={primaryBtn}>
              {createProspect.isPending ? 'seeding…' : '⚡ seed prospect'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

const primaryBtn: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
  background: 'var(--color-brand-electric)', color: 'var(--surface-base)', fontWeight: 600,
};
const secondaryBtn: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
  background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)',
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/prospects/OperatorProspectIntakeWizard.tsx
git commit -m "feat(prospects): OperatorProspectIntakeWizard multi-step shell (T3.4)"
```

### Task 5: Wizard step components

**Files:**
- Create: `src/components/prospects/operator-intake-steps/IdentityStep.tsx`
- Create: `src/components/prospects/operator-intake-steps/IntelStep.tsx`
- Create: `src/components/prospects/operator-intake-steps/RelationshipStep.tsx`
- Create: `src/components/prospects/operator-intake-steps/AssignAgentStep.tsx`
- Create: `src/components/prospects/operator-intake-steps/ReviewStep.tsx`

- [ ] **Step 1: Identity step**

```tsx
// src/components/prospects/operator-intake-steps/IdentityStep.tsx
import type { OperatorProspectInput } from '../../../hooks/use-prospects';

interface Props { input: OperatorProspectInput; onChange: (i: OperatorProspectInput) => void }

export function IdentityStep({ input, onChange }: Props) {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <Field label="Full name">
        <input value={input.fullName ?? ''} onChange={(e) => onChange({ ...input, fullName: e.target.value })} style={inputStyle} placeholder="e.g., Hunter Milborne" />
      </Field>
      <Field label="Email *">
        <input value={input.email} onChange={(e) => onChange({ ...input, email: e.target.value })} style={inputStyle} placeholder="hunter@example.com" />
      </Field>
      <Field label="Country">
        <input value={input.country ?? ''} onChange={(e) => onChange({ ...input, country: e.target.value })} style={inputStyle} placeholder="Canada" />
      </Field>
      <Field label="Role hint">
        <input value={input.roleHint ?? ''} onChange={(e) => onChange({ ...input, roleHint: e.target.value })} style={inputStyle} placeholder="Real-estate developer · Milborne Group founder" />
      </Field>
      <Field label="Archetype">
        <select value={input.archetype ?? 'investor'} onChange={(e) => onChange({ ...input, archetype: e.target.value })} style={inputStyle}>
          {['investor','operator','creator','advisor','partner','contributor','customer','founder','vendor'].map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </Field>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: 8, borderRadius: 6, background: 'var(--surface-base)',
  border: '1px solid var(--border-subtle)', color: 'var(--text-primary)',
};
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label style={{ display: 'grid', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>{label}{children}</label>
);
```

- [ ] **Step 2: Intel step**

```tsx
// src/components/prospects/operator-intake-steps/IntelStep.tsx
import type { OperatorProspectInput } from '../../../hooks/use-prospects';

interface Props { input: OperatorProspectInput; onChange: (i: OperatorProspectInput) => void }

export function IntelStep({ input, onChange }: Props) {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <Field label="AUM estimate (USD)">
        <input type="number" value={input.aumEstimate ?? ''} onChange={(e) => onChange({ ...input, aumEstimate: e.target.value ? Number(e.target.value) : undefined })} style={inputStyle} placeholder="50000000" />
      </Field>
      <Field label="Check size range">
        <input value={input.checkSizeRange ?? ''} onChange={(e) => onChange({ ...input, checkSizeRange: e.target.value })} style={inputStyle} placeholder="$25k–$250k" />
      </Field>
      <Field label="Investor thesis">
        <textarea value={input.investorThesis ?? ''} onChange={(e) => onChange({ ...input, investorThesis: e.target.value })} style={{ ...inputStyle, minHeight: 60 }} placeholder="What they care about · sectors · stage · geography" />
      </Field>
      <Field label="LinkedIn">
        <input value={input.socialProfiles?.linkedin ?? ''} onChange={(e) => onChange({ ...input, socialProfiles: { ...(input.socialProfiles ?? {}), linkedin: e.target.value } })} style={inputStyle} placeholder="https://linkedin.com/in/…" />
      </Field>
      <Field label="Twitter / X">
        <input value={input.socialProfiles?.twitter ?? ''} onChange={(e) => onChange({ ...input, socialProfiles: { ...(input.socialProfiles ?? {}), twitter: e.target.value } })} style={inputStyle} />
      </Field>
      <Field label="Priority">
        <select value={input.priority ?? 'warm'} onChange={(e) => onChange({ ...input, priority: e.target.value as OperatorProspectInput['priority'] })} style={inputStyle}>
          <option value="hot">🔥 hot</option>
          <option value="warm">warm</option>
          <option value="medium">medium</option>
          <option value="cold">cold</option>
        </select>
      </Field>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: 8, borderRadius: 6, background: 'var(--surface-base)',
  border: '1px solid var(--border-subtle)', color: 'var(--text-primary)',
};
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label style={{ display: 'grid', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>{label}{children}</label>
);
```

- [ ] **Step 3: Relationship step**

```tsx
// src/components/prospects/operator-intake-steps/RelationshipStep.tsx
import type { OperatorProspectInput } from '../../../hooks/use-prospects';

interface Props { input: OperatorProspectInput; onChange: (i: OperatorProspectInput) => void }

export function RelationshipStep({ input, onChange }: Props) {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <Field label="Relationship history">
        <textarea value={input.relationshipHistory ?? ''} onChange={(e) => onChange({ ...input, relationshipHistory: e.target.value })} style={{ ...inputStyle, minHeight: 80 }} placeholder="When/how you met · prior touchpoints · mutual connections" />
      </Field>
      <Field label="Operator notes (private — you + NAOS only)">
        <textarea value={input.operatorNotes ?? ''} onChange={(e) => onChange({ ...input, operatorNotes: e.target.value })} style={{ ...inputStyle, minHeight: 80 }} placeholder="Candid read · what they want · what they fear · what closes them" />
      </Field>
      <Field label="Prior deals / interactions (one per line)">
        <textarea
          value={Array.isArray(input.priorDeals) ? (input.priorDeals as string[]).join('\n') : ''}
          onChange={(e) => onChange({ ...input, priorDeals: e.target.value.split('\n').filter(Boolean) })}
          style={{ ...inputStyle, minHeight: 60 }}
          placeholder="2024 Q3 · invested $50k in previous RE syndicate" />
      </Field>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: 8, borderRadius: 6, background: 'var(--surface-base)',
  border: '1px solid var(--border-subtle)', color: 'var(--text-primary)',
};
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label style={{ display: 'grid', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>{label}{children}</label>
);
```

- [ ] **Step 4: Assign-agent step**

```tsx
// src/components/prospects/operator-intake-steps/AssignAgentStep.tsx
import type { OperatorProspectInput } from '../../../hooks/use-prospects';

interface Props { input: OperatorProspectInput; onChange: (i: OperatorProspectInput) => void }

// Minimal static persona list for T3 — full persona registry arrives in T5.
const PERSONAS = [
  { id: 'quinn', handle: 'Quinn', role: 'IR Lead · Futurestate',  accent: '#00F5FF' },
  { id: 'aegis', handle: 'Aegis', role: 'Compliance Officer',      accent: '#C4B5FD' },
  { id: 'atlas', handle: 'Atlas', role: 'Chief of Staff',          accent: '#FBBF24' },
  { id: 'forge', handle: 'Forge', role: 'Engineering Lead',        accent: '#6EE7B7' },
];

export function AssignAgentStep({ input, onChange }: Props) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>Assign a persona · they lead the journey</div>
      <div style={{ display: 'grid', gap: 6 }}>
        {PERSONAS.map((p) => {
          const active = input.assignedPersonaId === p.id;
          return (
            <button key={p.id} onClick={() => onChange({ ...input, assignedPersonaId: p.id })} style={{
              display: 'flex', justifyContent: 'space-between', padding: 10,
              borderRadius: 8, border: `1px solid ${active ? p.accent : 'var(--border-subtle)'}`,
              background: active ? `${p.accent}14` : 'var(--surface-base)',
              color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left',
            }}>
              <span style={{ color: p.accent, fontWeight: 600 }}>{p.handle}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{p.role}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Review step**

```tsx
// src/components/prospects/operator-intake-steps/ReviewStep.tsx
import type { OperatorProspectInput } from '../../../hooks/use-prospects';

interface Props { input: OperatorProspectInput }

export function ReviewStep({ input }: Props) {
  const rows: Array<[string, React.ReactNode]> = [
    ['Name',           input.fullName ?? '—'],
    ['Email',          input.email],
    ['Country',        input.country ?? '—'],
    ['Role',           input.roleHint ?? '—'],
    ['Archetype',      input.archetype ?? '—'],
    ['AUM',            input.aumEstimate ? `$${input.aumEstimate.toLocaleString()}` : '—'],
    ['Check size',     input.checkSizeRange ?? '—'],
    ['Priority',       input.priority ?? 'medium'],
    ['Track',          input.track],
    ['Source venture', input.sourceVentureId ?? '—'],
    ['Assigned persona', input.assignedPersonaId ?? '— (none)'],
  ];
  return (
    <div style={{ display: 'grid', gap: 4 }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Confirm and seed</div>
      {rows.map(([k, v], i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 6px', borderRadius: 4, background: i % 2 === 0 ? 'transparent' : 'var(--surface-elevated)' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{k}</span>
          <span style={{ color: 'var(--text-primary)', fontSize: 12 }}>{v}</span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/prospects/operator-intake-steps/
git commit -m "feat(prospects): 5 operator-intake step components (T3.5)"
```

### Task 6: Wire wizard into ProspectsView + filter badge

**Files:**
- Modify: `src/views/ProspectsView.tsx`

- [ ] **Step 1: Add the CTA + wire the wizard**

At top of `ProspectsView.tsx`, add import:

```tsx
import { OperatorProspectIntakeWizard } from '../components/prospects/OperatorProspectIntakeWizard';
```

Add state near the existing `inviteOpen`:

```tsx
const [operatorOpen, setOperatorOpen] = useState(false);
```

In the PageHeader actions region (next to the existing Invite button), add:

```tsx
<button
  onClick={() => setOperatorOpen(true)}
  style={{
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
    background: 'var(--color-brand-purple)', color: 'var(--surface-base)',
    border: 'none', cursor: 'pointer',
  }}
>
  ⚡ New prospect (operator)
</button>
```

At the bottom of the component, before the final closing tag, render:

```tsx
<OperatorProspectIntakeWizard open={operatorOpen} onClose={() => setOperatorOpen(false)} />
```

Wherever a prospect journey row is rendered, add a badge if `j.prospect_profile.intake_source === 'operator'`:

```tsx
{j.prospect_profile?.intake_source === 'operator' && <Badge>⚡ operator</Badge>}
```

- [ ] **Step 2: Build + smoke**

Run: `pnpm build`
Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/views/ProspectsView.tsx
git commit -m "feat(prospects): wire operator-intake wizard into ProspectsView (T3.6)"
```

### Task 7: Seed Hunter Milborne + Kirill Soloviev

**Files:**
- Create: `scripts/seed-operator-prospects-hunter-kirill.ts`

- [ ] **Step 1: Write the seed script**

```typescript
// scripts/seed-operator-prospects-hunter-kirill.ts
// Seeds Tony's first two operator-authored prospects.
// Hunter Milborne — Canadian RE developer, Milborne Group.
// Kirill Soloviev — strategic partner / fund operator.
// Both assigned Quinn as default Futurestate investor persona.
// Run: pnpm tsx scripts/seed-operator-prospects-hunter-kirill.ts

import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !key) throw new Error('SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY required');

const supabase = createClient(url, key, { auth: { persistSession: false } });

const seeds = [
  {
    email: 'hunter@milbornegroup.example', // replace with real email when known
    full_name: 'Hunter Milborne',
    country: 'Canada',
    role_hint: 'Founder · Milborne Group · Canadian RE developer',
    source_venture_id: 'futurestate',
    intake_source: 'operator' as const,
    operator_notes: 'Long relationship. Understands pre-construction deeply. Natural fit for Futurestate RWA thesis — sees the IP primitive.',
    relationship_history: 'Known Tony several years via Toronto RE circles. Multiple prior conversations about structured RE vehicles.',
    prior_deals: ['Toronto pre-con syndicate participation (prior firms)', 'Advisory discussions on RWA tokenization'],
    aum_estimate: 250_000_000,
    check_size_range: '$100k–$1M',
    investor_thesis: 'Real estate + tokenization. Canadian jurisdictional expertise. Values structured sponsor + transparency.',
    social_profiles: { linkedin: 'https://www.linkedin.com/in/hunter-milborne/' },
    priority: 'hot' as const,
    archetype: 'investor',
  },
  {
    email: 'kirill@solovievfund.example', // replace with real email when known
    full_name: 'Kirill Soloviev',
    country: 'Global',
    role_hint: 'Fund operator · strategic partner',
    source_venture_id: 'futurestate',
    intake_source: 'operator' as const,
    operator_notes: 'Strategic introduction. Potential for larger ticket + multi-venture exposure. Evaluate for BetEdge + MCV.GG crossover.',
    relationship_history: 'Introduced 2026. Initial call pending; warm via mutual.',
    prior_deals: [],
    aum_estimate: 50_000_000,
    check_size_range: '$50k–$500k',
    investor_thesis: 'Global-flexible. Interested in protocol-level plays + tokenized RWAs.',
    social_profiles: {},
    priority: 'warm' as const,
    archetype: 'investor',
  },
];

async function main() {
  for (const s of seeds) {
    // Upsert profile
    const { data: profile, error: pe } = await supabase
      .from('prospect_profiles')
      .upsert(s, { onConflict: 'email' })
      .select('*')
      .single();
    if (pe) throw pe;

    // Ensure an active journey exists with Quinn assigned
    const { data: existing } = await supabase
      .from('prospect_journeys')
      .select('id')
      .eq('prospect_profile_id', profile.id)
      .maybeSingle();

    if (!existing) {
      const { error: je } = await supabase.from('prospect_journeys').insert({
        prospect_profile_id: profile.id,
        track: 'investor_accredited',
        status: 'active',
        current_step_index: 0,
        agent_id: 'quinn',
      });
      if (je) throw je;
      console.log(`✅ seeded + journey: ${s.full_name}`);
    } else {
      console.log(`↺ upserted (journey existed): ${s.full_name}`);
    }
  }
  console.log('done.');
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Run the script**

Run: `pnpm tsx scripts/seed-operator-prospects-hunter-kirill.ts`
Expected: `✅ seeded + journey: Hunter Milborne` + `✅ seeded + journey: Kirill Soloviev`.

- [ ] **Step 3: Verify in DB**

```sql
SELECT full_name, email, intake_source, priority, archetype, aum_estimate
FROM prospect_profiles
WHERE intake_source = 'operator';
```

Expected: 2 rows (Hunter + Kirill) with `intake_source='operator'`.

- [ ] **Step 4: Commit**

```bash
git add scripts/seed-operator-prospects-hunter-kirill.ts
git commit -m "feat(prospects): seed Hunter Milborne + Kirill Soloviev (T3.7)"
```

### Task 8: Wizard test

**Files:**
- Create: `src/components/prospects/__tests__/OperatorProspectIntakeWizard.test.tsx`

- [ ] **Step 1: Write the test**

```tsx
// src/components/prospects/__tests__/OperatorProspectIntakeWizard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OperatorProspectIntakeWizard } from '../OperatorProspectIntakeWizard';

const mockFetch = vi.fn(async () => ({ ok: true, json: async () => ({ profile: { id: 'p1' }, journey: { id: 'j1' } }) }) as Response);
global.fetch = mockFetch as typeof fetch;

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe('<OperatorProspectIntakeWizard>', () => {
  it('walks through identity → intel → relationship → assign → review and submits', async () => {
    const onClose = vi.fn();
    wrap(<OperatorProspectIntakeWizard open={true} onClose={onClose} />);

    // Identity
    fireEvent.change(screen.getByPlaceholderText(/Hunter Milborne/i), { target: { value: 'Hunter Milborne' } });
    fireEvent.change(screen.getByPlaceholderText(/hunter@example.com/i), { target: { value: 'hunter@test.com' } });
    fireEvent.click(screen.getByText(/continue/i));

    // Intel
    await waitFor(() => expect(screen.getByPlaceholderText(/50000000/)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/continue/i));

    // Relationship
    await waitFor(() => expect(screen.getByPlaceholderText(/Candid read/)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/continue/i));

    // Assign
    await waitFor(() => expect(screen.getByText(/Quinn/)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Quinn/).closest('button')!);
    fireEvent.click(screen.getByText(/continue/i));

    // Review + submit
    await waitFor(() => expect(screen.getByText(/Confirm and seed/)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/seed prospect/i));

    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
    expect(body.action).toBe('create-operator-prospect');
    expect(body.email).toBe('hunter@test.com');
    expect(body.fullName).toBe('Hunter Milborne');
    expect(body.assignedPersonaId).toBe('quinn');
  });
});
```

- [ ] **Step 2: Run test**

Run: `pnpm vitest run src/components/prospects/__tests__/OperatorProspectIntakeWizard.test.tsx`
Expected: 1 test PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/prospects/__tests__/OperatorProspectIntakeWizard.test.tsx
git commit -m "test(prospects): end-to-end wizard flow (T3.8)"
```

### T3 checkpoint review

- [ ] Run full tranche test suite: `pnpm vitest run src/components/prospects/ src/hooks/use-prospects.ts`
- [ ] Verify DB state: Hunter + Kirill present with `intake_source='operator'` + journeys with `agent_id='quinn'`
- [ ] Build: `pnpm build`
- [ ] Dev smoke: `pnpm dev`, open `/prospects`, click "⚡ New prospect (operator)", complete wizard, confirm row appears with ⚡ badge
- [ ] Push: `git push -u origin marathon-1-t3-operator-prospects-2026-04-17`
- [ ] Open PR titled `feat(prospects): marathon-1 tranche T3 — operator-seeded intake + Hunter + Kirill`

---

## Integration & merge

After all 3 tranches land PRs:

- [ ] Merge PRs in dependency-safe order: T2 → T1 → T3
- [ ] On master, run: `pnpm install && pnpm build && pnpm vitest run`
- [ ] Verify: Command Center + Capital + CRM render `<PinnedKpiStrip>`; Prospects surface Hunter + Kirill with operator badge + Quinn persona
- [ ] Delete worktrees: `git worktree remove ../mcv-one-desktop-t1-pinned-strip && git worktree remove ../mcv-one-desktop-t2-ventures-stack && git worktree remove ../mcv-one-desktop-t3-operator-prospects`

## Marathon #1 success criteria (locked from spec §9)

- [ ] `<PinnedKpiStrip>` renders on Command Center + Capital + CRM with default loadouts
- [ ] Tile personalization persists across reload (gear → toggle → refresh → verify)
- [ ] New raising ventures (MCV.Tech, MCV.DEV, MCV.CX, MCV.INC) live in ventures table with correct `is_raising` flag
- [ ] `capital_round_ventures` junction exists + back-fill complete for existing rounds
- [ ] `<VentureCorporateStack>` renders all 5 blocks for Futurestate using real DB rows
- [ ] Operator-seeded Hunter Milborne + Kirill Soloviev rows exist with real intel + `intake_source='operator'`
- [ ] Both prospects show in ProspectsView with ⚡ operator badge
- [ ] Quinn assigned as default agent on both journeys
- [ ] Dual crown (MCV Inc. + MCV LTD) seeded as sovereign 6D entities
- [ ] `domain_registry` table exists with ≥9 seeded domains
