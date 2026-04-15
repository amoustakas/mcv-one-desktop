// Pure snapshot summarizer — single source of truth for the venture health
// score. Imported by:
//   - src/lib/kits/builtin/venture-intelligence-kit.ts (NAOS tool output)
//   - src/components/ventures/VentureSnapshotCard.tsx (UI health ring)
//   - api/_handlers/ventures.ts (list-snapshots bulk action)
//
// Keeping this as a zero-dependency pure function means the kit, UI, and API
// can never disagree on what "health" means.

export interface SnapshotSummary {
  tier: number | null;
  status: string;
  clerk_provisioned: boolean;
  assets: { confirmed: number; discovered: number; byTier: Record<number, number> };
  domains: { total: number; verified: number; pending: number };
  docs: { total: number; byDept: Record<string, number>; byStatus: Record<string, number> };
  quests: { total: number; done: number; in_progress: number; pct: number };
  health_score: number;
}

export interface SnapshotInput {
  venture: { tier?: number | null; status?: string | null; clerk_org_id?: string | null };
  assets: Array<{ tier: number; confirmed: boolean }>;
  domains: Array<{ status?: string }>;
  docs: Array<{ department: string; status: string }>;
  quests: Array<{ effective_status?: string }>;
}

// Composite health weighting:
//   40% quest completion — the gamified work-in-motion signal
//   25% asset confirmation — operator-confirmed inventory
//   20% docs coverage — 30 docs = "fully papered" baseline
//   15% domain verification — production-readiness
export function summarizeSnapshot(args: SnapshotInput): SnapshotSummary {
  const assetsConfirmed = args.assets.filter(a => a.confirmed).length;
  const assetsDiscovered = args.assets.filter(a => !a.confirmed).length;
  const byTier = args.assets.reduce<Record<number, number>>((acc, a) => {
    acc[a.tier] = (acc[a.tier] || 0) + 1;
    return acc;
  }, {});

  const verifiedDomains = args.domains.filter(d => d.status === 'verified' || d.status === 'active').length;
  const pendingDomains = args.domains.filter(d => d.status === 'pending' || !d.status).length;

  const byDept = args.docs.reduce<Record<string, number>>((acc, d) => {
    acc[d.department] = (acc[d.department] || 0) + 1;
    return acc;
  }, {});
  const byStatus = args.docs.reduce<Record<string, number>>((acc, d) => {
    acc[d.status] = (acc[d.status] || 0) + 1;
    return acc;
  }, {});

  const questsDone = args.quests.filter(q => q.effective_status === 'done').length;
  const questsInProg = args.quests.filter(q => q.effective_status === 'in-progress').length;
  const questPct = args.quests.length > 0 ? Math.round((questsDone / args.quests.length) * 100) : 0;

  const assetHealth = args.assets.length > 0 ? (assetsConfirmed / args.assets.length) * 100 : 50;
  const docHealth = Math.min(100, (args.docs.length / 30) * 100);
  const domainHealth = args.domains.length > 0 ? (verifiedDomains / args.domains.length) * 100 : 50;
  const health = Math.round(0.40 * questPct + 0.25 * assetHealth + 0.20 * docHealth + 0.15 * domainHealth);

  return {
    tier: args.venture.tier ?? null,
    status: args.venture.status || 'unknown',
    clerk_provisioned: !!args.venture.clerk_org_id,
    assets: { confirmed: assetsConfirmed, discovered: assetsDiscovered, byTier },
    domains: { total: args.domains.length, verified: verifiedDomains, pending: pendingDomains },
    docs: { total: args.docs.length, byDept, byStatus },
    quests: { total: args.quests.length, done: questsDone, in_progress: questsInProg, pct: questPct },
    health_score: health,
  };
}

// Consistent color bands — used by VentureSnapshotCard ring + VenturesIndexView badge.
export function healthColor(score: number): string {
  if (score >= 75) return '#10B981';
  if (score >= 50) return '#F59E0B';
  return '#EF4444';
}
