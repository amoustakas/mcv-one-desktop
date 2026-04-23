// src/stores/foundation — Foundation Suite data store.
//
// Zustand store that mirrors the 9 foundation tables into in-memory state for
// the 6 cockpit panels. Data is server-authoritative (Supabase via /api/foundation);
// the store is cache + mutation coordinator, not source of truth.
//
// Crown-immutability guard: updateEntity() throws when a protected field is
// patched on a Crown entity (mcv-inc-crown, mcv-ltd-crown). Mirrors the
// isCrownEntity() check from @mcv/foundation-sdk/corpus/entity-stack-ids.

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { apiPost } from '../lib/api/client';

// ─── Types (lightweight, keyed off /api/foundation responses) ───────────────

export interface IPMark {
  id: string;
  markText: string;
  markKind: 'trademark' | 'patent' | 'copyright' | 'trade_secret';
  priorityTier: string;
  classes: number[];
  jurisdictions: string[];
  ownerEntityId: string | null;
  status: string;
  holdingChainStage: string;
  isCompound: boolean;
  claimSummary: string | null;
  noveltyHook: string | null;
  supportingArtifacts: string[] | null;
  notes: string | null;
  sourceDoc: string | null;
  sourceSection: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CounselEngagement {
  id: string;
  firmName: string;
  workstream: 'corp_tax' | 'ip' | 'securities';
  contactName: string | null;
  contactEmail: string | null;
  status: string;
  conflictsCheckStatus: string;
  ndaTemplateUsed: string | null;
  ndaExecutedAt: string | null;
  budgetAllocatedUsd: number;
  budgetConsumedUsd: number;
  notes: string | null;
}

export interface CounselTask {
  id: string;
  taskCode: string;
  workstream: 'corp_tax' | 'ip' | 'securities';
  title: string;
  description: string | null;
  deliverable: string | null;
  dependsOn: string[];
  criticalPath: boolean;
  assignedEngagementId: string | null;
  status: string;
  priority: number;
  epicId: string | null;
  sourceDoc: string | null;
  sourceSection: string | null;
}

export interface AcquisitionOrder {
  id: string;
  assetKind: 'domain' | 'trademark_purchase' | 'patent_purchase';
  assetIdentifier: string;
  urgencyTier: 'red_7day' | 'orange_30day' | 'yellow_90day' | 'green_defensive';
  targetRegistrar: string | null;
  priceCad: number | null;
  priceUsd: number | null;
  status: string;
  blocksDisclosure: boolean;
  blocksVentureName: string | null;
  notes: string | null;
  acquiredAt: string | null;
  acquiredRegistrar: string | null;
}

export interface NamingRatification {
  id: string;
  deprecatedName: string;
  ratifiedName: string;
  context: 'prose' | 'identifier' | 'any';
  rationale: string | null;
}

export interface EntityStackNode {
  id: string;
  label: string;
  jurisdiction: string;
  entityType: string;
  parentEntityId: string | null;
  isCrown: boolean;
  active: boolean;
}

export interface IPBudgetRollup {
  p0Total: number;
  p1Total: number;
  p2Total: number;
  madridTotal: number;
  utilityTotal: number;
  allTotal: number;
  yearOneEnvelopeLow: number;
  yearOneEnvelopeHigh: number;
}

export interface BlueMarlinGateStatus {
  p0Total: number;
  p0Green: number;
  ready: boolean;
  blockers: string[];
  checkedAt: string;
}

// ─── Crown-immutability guard ───────────────────────────────────────────────

const CROWN_ENTITY_IDS = ['mcv-inc-crown', 'mcv-ltd-crown'] as const;
const CROWN_PROTECTED_FIELDS = new Set([
  'label', 'entityType', 'parentEntityId', 'jurisdiction', 'active', 'isCrown',
]);

function isCrownEntity(id: string): boolean {
  return (CROWN_ENTITY_IDS as readonly string[]).includes(id);
}

// ─── Store shape ────────────────────────────────────────────────────────────

export type SectionKey =
  | 'ipMarks'
  | 'counselEngagements'
  | 'counselTasks'
  | 'acquisitionOrders'
  | 'namingRatifications'
  | 'entityStack'
  | 'budgetRollup'
  | 'blueMarlinGate';

interface FoundationState {
  ipMarks: IPMark[];
  counselEngagements: CounselEngagement[];
  counselTasks: CounselTask[];
  acquisitionOrders: AcquisitionOrder[];
  namingRatifications: NamingRatification[];
  entityStack: EntityStackNode[];
  budgetRollup: IPBudgetRollup | null;
  blueMarlinGate: BlueMarlinGateStatus | null;

  loading: Record<SectionKey, boolean>;
  errors: Record<SectionKey, string | null>;

  fetchIpMarks: () => Promise<void>;
  fetchCounselEngagements: () => Promise<void>;
  fetchCounselTasks: () => Promise<void>;
  fetchAcquisitionOrders: () => Promise<void>;
  fetchNamingRatifications: () => Promise<void>;
  fetchEntityStack: () => Promise<void>;
  fetchBudgetRollup: () => Promise<void>;
  fetchBlueMarlinGate: () => Promise<void>;
  fetchAll: () => Promise<void>;

  /** Idempotent: seeds the 5 🔴🟠 acquisition rows. Safe to re-run. */
  seedUrgentAcquisitions: () => Promise<{ inserted: number; already: number }>;

  /** Guarded entity patch. Throws on Crown-protected field mutation. */
  updateEntity: (id: string, patch: Partial<EntityStackNode>) => void;
}

// ─── Factory ────────────────────────────────────────────────────────────────

function emptyLoading(): Record<SectionKey, boolean> {
  return {
    ipMarks: false, counselEngagements: false, counselTasks: false,
    acquisitionOrders: false, namingRatifications: false, entityStack: false,
    budgetRollup: false, blueMarlinGate: false,
  };
}
function emptyErrors(): Record<SectionKey, string | null> {
  return {
    ipMarks: null, counselEngagements: null, counselTasks: null,
    acquisitionOrders: null, namingRatifications: null, entityStack: null,
    budgetRollup: null, blueMarlinGate: null,
  };
}

async function fetchSection<TResult>(
  key: SectionKey,
  action: string,
  body: Record<string, unknown>,
  extract: (data: Record<string, unknown>) => TResult,
  set: (patch: Partial<FoundationState>) => void,
  state: () => FoundationState,
  apply: (result: TResult) => Partial<FoundationState>,
): Promise<void> {
  set({
    loading: { ...state().loading, [key]: true },
    errors: { ...state().errors, [key]: null },
  });
  try {
    const data = await apiPost<Record<string, unknown>>('/api/foundation', { action, ...body });
    const result = extract(data);
    set({
      ...apply(result),
      loading: { ...state().loading, [key]: false },
    });
  } catch (err) {
    set({
      loading: { ...state().loading, [key]: false },
      errors: { ...state().errors, [key]: (err as Error).message },
    });
  }
}

export const useFoundationStore = create<FoundationState>()(
  devtools((set, get) => ({
    ipMarks: [],
    counselEngagements: [],
    counselTasks: [],
    acquisitionOrders: [],
    namingRatifications: [],
    entityStack: [],
    budgetRollup: null,
    blueMarlinGate: null,
    loading: emptyLoading(),
    errors: emptyErrors(),

    fetchIpMarks: () => fetchSection(
      'ipMarks', 'list-ip-marks', { limit: 500 },
      (d) => (d.marks as IPMark[]) ?? [],
      (p) => set(p), get,
      (marks) => ({ ipMarks: marks }),
    ),
    fetchCounselEngagements: () => fetchSection(
      'counselEngagements', 'list-counsel-engagements', {},
      (d) => (d.engagements as CounselEngagement[]) ?? [],
      (p) => set(p), get,
      (engs) => ({ counselEngagements: engs }),
    ),
    fetchCounselTasks: () => fetchSection(
      'counselTasks', 'list-counsel-tasks', {},
      (d) => (d.tasks as CounselTask[]) ?? [],
      (p) => set(p), get,
      (tasks) => ({ counselTasks: tasks }),
    ),
    fetchAcquisitionOrders: () => fetchSection(
      'acquisitionOrders', 'list-acquisition-orders', {},
      (d) => (d.orders as AcquisitionOrder[]) ?? [],
      (p) => set(p), get,
      (orders) => ({ acquisitionOrders: orders }),
    ),
    fetchNamingRatifications: () => fetchSection(
      'namingRatifications', 'list-naming-ratifications', {},
      (d) => (d.ratifications as NamingRatification[]) ?? [],
      (p) => set(p), get,
      (rats) => ({ namingRatifications: rats }),
    ),
    fetchEntityStack: () => fetchSection(
      'entityStack', 'get-entity-stack', {},
      (d) => {
        const stack = d.stack as { nodes?: Array<Record<string, unknown>> } | undefined;
        return (stack?.nodes ?? []).map((n): EntityStackNode => ({
          id: n.id as string,
          label: n.label as string,
          jurisdiction: n.jurisdiction as string,
          entityType: (n.entity_type ?? n.entityType) as string,
          parentEntityId: (n.parent_entity_id ?? n.parentEntityId ?? null) as string | null,
          isCrown: Boolean(n.is_crown ?? n.isCrown),
          active: Boolean(n.active ?? true),
        }));
      },
      (p) => set(p), get,
      (nodes) => ({ entityStack: nodes }),
    ),
    fetchBudgetRollup: () => fetchSection(
      'budgetRollup', 'read-ip-budget-rollup', {},
      (d) => (d.rollup as IPBudgetRollup) ?? null,
      (p) => set(p), get,
      (rollup) => ({ budgetRollup: rollup }),
    ),
    fetchBlueMarlinGate: () => fetchSection(
      'blueMarlinGate', 'check-blue-marlin-gate', {},
      (d) => (d.status as BlueMarlinGateStatus) ?? null,
      (p) => set(p), get,
      (status) => ({ blueMarlinGate: status }),
    ),

    fetchAll: async () => {
      const s = get();
      await Promise.all([
        s.fetchIpMarks(),
        s.fetchCounselEngagements(),
        s.fetchCounselTasks(),
        s.fetchAcquisitionOrders(),
        s.fetchNamingRatifications(),
        s.fetchEntityStack(),
        s.fetchBudgetRollup(),
        s.fetchBlueMarlinGate(),
      ]);
    },

    seedUrgentAcquisitions: async () => {
      const data = await apiPost<{ result: { inserted: number; already: number } }>(
        '/api/foundation',
        { action: 'seed-urgent-acquisitions' },
      );
      await get().fetchAcquisitionOrders();
      return data.result ?? { inserted: 0, already: 0 };
    },

    updateEntity: (id, patch) => {
      if (isCrownEntity(id)) {
        const protectedHits = Object.keys(patch).filter((k) => CROWN_PROTECTED_FIELDS.has(k));
        if (protectedHits.length > 0) {
          throw new Error(
            `Cannot patch Crown entity "${id}" — protected fields: ${protectedHits.join(', ')}. ` +
            `Crown entities (MCV Inc., MCV LTD) are succession-locked; changes require a governance event + schema migration.`,
          );
        }
      }
      set((s) => ({
        entityStack: s.entityStack.map((e) => e.id === id ? { ...e, ...patch } : e),
      }));
    },
  }), { name: 'foundation' }),
);

// ─── Selectors (thin, memoized-friendly) ────────────────────────────────────

export function criticalPathTasks(tasks: CounselTask[]): CounselTask[] {
  return tasks.filter((t) => t.criticalPath && t.status !== 'done');
}

export function urgencyBuckets(orders: AcquisitionOrder[]): Record<AcquisitionOrder['urgencyTier'], AcquisitionOrder[]> {
  const out: Record<AcquisitionOrder['urgencyTier'], AcquisitionOrder[]> = {
    red_7day: [], orange_30day: [], yellow_90day: [], green_defensive: [],
  };
  for (const o of orders) out[o.urgencyTier].push(o);
  return out;
}

export function tasksByWorkstream(tasks: CounselTask[]): Record<'corp_tax' | 'ip' | 'securities', CounselTask[]> {
  const out = { corp_tax: [] as CounselTask[], ip: [] as CounselTask[], securities: [] as CounselTask[] };
  for (const t of tasks) out[t.workstream].push(t);
  return out;
}

export const URGENCY_LABEL: Record<AcquisitionOrder['urgencyTier'], string> = {
  red_7day: '🔴 Red — 7-day window',
  orange_30day: '🟠 Orange — 30-day window',
  yellow_90day: '🟡 Yellow — 90-day window',
  green_defensive: '🟢 Green — defensive',
};

export const WORKSTREAM_LABEL: Record<'corp_tax' | 'ip' | 'securities', string> = {
  corp_tax: 'Corporate & Tax',
  ip: 'Intellectual Property',
  securities: 'Securities',
};
