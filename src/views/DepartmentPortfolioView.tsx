import { useEffect, useMemo, useState } from 'react';
import { Scale, ShieldCheck, Beaker, DollarSign, Wrench, Rocket, FileText, Grid, List } from 'lucide-react';
import { PageShell, PageHeader, GlassCard, Badge, EmptyState, Tabs, Toggle } from '../components/ui';
import { apiPost } from '../lib/api/client';
import type { Venture } from '../lib/ventures';
import type { SnapshotSummary } from '../lib/ventures/snapshot';

interface PortfolioSnapshotRow { id: string; name: string; tier: number | null; status: string; summary: SnapshotSummary }

type Department = 'legal' | 'compliance' | 'research' | 'finance' | 'ops' | 'product';

const DEPT_CONFIG: Record<Department, { label: string; icon: typeof Scale; color: string }> = {
  legal:      { label: 'Legal',      icon: Scale,       color: '#8B5CF6' },
  compliance: { label: 'Compliance', icon: ShieldCheck, color: '#10B981' },
  research:   { label: 'Research',   icon: Beaker,      color: '#00F0FF' },
  finance:    { label: 'Finance',    icon: DollarSign,  color: '#F59E0B' },
  ops:        { label: 'Ops',        icon: Wrench,      color: '#EF4444' },
  product:    { label: 'Product',    icon: Rocket,      color: '#E8F0FE' },
};

const STATUS_COLOR: Record<string, string> = {
  draft: '#6B7280',
  'in-review': '#F59E0B',
  approved: '#00F0FF',
  executed: '#10B981',
  archived: '#4B5563',
};

interface PortfolioDoc {
  id: string;
  venture_id: string;
  department: Department;
  title: string;
  status: string;
}

interface DeptSummary {
  venture_id: string;
  venture_name: string;
  total: number;
  approved: number;
  executed: number;
  draft: number;
  inReview: number;
}

/**
 * Cross-department portfolio view — "show all venture legal status" across
 * every venture in the portfolio. Answers the question "where is every venture
 * on compliance / legal / research maturity?" at a glance.
 */
const DEPT_ORDER: Department[] = ['legal', 'compliance', 'research', 'finance', 'ops', 'product'];

export default function DepartmentPortfolioView() {
  const [viewMode, setViewMode] = useState<'detail' | 'matrix'>('matrix');
  const [department, setDepartment] = useState<Department>('legal');
  const [ventures, setVentures] = useState<Venture[]>([]);
  const [docs, setDocs] = useState<PortfolioDoc[]>([]);
  const [matrixSnaps, setMatrixSnaps] = useState<PortfolioSnapshotRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Matrix mode loads once via bulk list-snapshots — 1 request instead of N
  useEffect(() => {
    if (viewMode !== 'matrix') return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await apiPost<{ snapshots: PortfolioSnapshotRow[] }>('/api/ventures', { action: 'list-snapshots' });
        if (!cancelled) setMatrixSnaps(data.snapshots || []);
      } catch {
        if (!cancelled) setMatrixSnaps([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [viewMode]);

  useEffect(() => {
    if (viewMode !== 'detail') return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { ventures: vs } = await apiPost<{ ventures: Venture[] }>('/api/ventures', { action: 'list' });
        if (cancelled) return;
        setVentures(vs || []);
        // Fetch docs for every venture in parallel
        const results = await Promise.all(
          (vs || []).map(v =>
            apiPost<{ docs: PortfolioDoc[] }>('/api/ventures', { action: 'list-docs', venture_id: v.id, department })
              .then(r => r.docs || [])
              .catch(() => [] as PortfolioDoc[])
          )
        );
        if (cancelled) return;
        setDocs(results.flat());
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [department, viewMode]);

  const summaries: DeptSummary[] = useMemo(() => {
    const byVenture = new Map<string, DeptSummary>();
    for (const v of ventures) {
      byVenture.set(v.id, {
        venture_id: v.id,
        venture_name: v.name,
        total: 0, approved: 0, executed: 0, draft: 0, inReview: 0,
      });
    }
    for (const d of docs) {
      const s = byVenture.get(d.venture_id);
      if (!s) continue;
      s.total++;
      if (d.status === 'approved') s.approved++;
      else if (d.status === 'executed') s.executed++;
      else if (d.status === 'in-review') s.inReview++;
      else if (d.status === 'draft') s.draft++;
    }
    return Array.from(byVenture.values()).sort((a, b) => b.total - a.total);
  }, [ventures, docs]);

  const portfolioTotals = useMemo(() => summaries.reduce((acc, s) => ({
    total: acc.total + s.total,
    approved: acc.approved + s.approved + s.executed,
    coverage_pct: 0,
  }), { total: 0, approved: 0, coverage_pct: 0 }), [summaries]);
  portfolioTotals.coverage_pct = portfolioTotals.total > 0
    ? Math.round((portfolioTotals.approved / portfolioTotals.total) * 100)
    : 0;

  const Icon = DEPT_CONFIG[department].icon;

  return (
    <PageShell>
      <PageHeader
        title="Department Portfolio"
        subtitle={viewMode === 'matrix'
          ? 'Cross-venture × cross-department doc coverage at a glance'
          : `Cross-venture ${DEPT_CONFIG[department].label.toLowerCase()} status — ${portfolioTotals.approved} of ${portfolioTotals.total} docs approved/executed (${portfolioTotals.coverage_pct}% coverage)`}
        icon={<Icon size={16} style={{ color: DEPT_CONFIG[department].color }} />}
      >
        <div style={{ display: 'flex', gap: 6 }}>
          <Toggle pressed={viewMode === 'matrix'} onPressedChange={() => setViewMode('matrix')} size="sm">
            <Grid size={12} /> Matrix
          </Toggle>
          <Toggle pressed={viewMode === 'detail'} onPressedChange={() => setViewMode('detail')} size="sm">
            <List size={12} /> Detail
          </Toggle>
        </div>
      </PageHeader>

      {viewMode === 'matrix' ? (
        loading ? (
          <GlassCard className="dp-card"><div className="dp-loading">Loading matrix…</div></GlassCard>
        ) : (
          <MatrixGrid snapshots={matrixSnaps} onCellClick={(dept) => { setDepartment(dept); setViewMode('detail'); }} />
        )
      ) : (<>

      <Tabs
        tabs={(Object.entries(DEPT_CONFIG) as Array<[Department, typeof DEPT_CONFIG['legal']]>).map(([d, c]) => ({
          id: d,
          label: c.label,
        }))}
        active={department}
        onChange={(d) => setDepartment(d as Department)}
        className="dp-tabs"
      />

      {loading ? (
        <GlassCard className="dp-card"><div className="dp-loading">Loading portfolio…</div></GlassCard>
      ) : summaries.every(s => s.total === 0) ? (
        <EmptyState
          icon={<FileText size={18} />}
          title={`No ${DEPT_CONFIG[department].label.toLowerCase()} docs across the portfolio`}
          description="Apply department templates to any venture to populate this view."
        />
      ) : (
        <div className="dp-grid">
          {summaries.map(s => {
            const coverage = s.total > 0 ? Math.round(((s.approved + s.executed) / s.total) * 100) : 0;
            return (
              <GlassCard key={s.venture_id} className="dp-card dp-venture-card">
                <div className="dp-card-head">
                  <span className="dp-venture-name">{s.venture_name}</span>
                  <Badge color={coverage >= 80 ? '#10B981' : coverage >= 40 ? '#F59E0B' : '#EF4444'}>
                    {coverage}% coverage
                  </Badge>
                </div>
                <div className="dp-stats">
                  <div className="dp-stat"><span className="dp-stat-val">{s.total}</span><span className="dp-stat-lbl">Total</span></div>
                  <div className="dp-stat"><span className="dp-stat-val" style={{ color: STATUS_COLOR.executed }}>{s.executed}</span><span className="dp-stat-lbl">Executed</span></div>
                  <div className="dp-stat"><span className="dp-stat-val" style={{ color: STATUS_COLOR.approved }}>{s.approved}</span><span className="dp-stat-lbl">Approved</span></div>
                  <div className="dp-stat"><span className="dp-stat-val" style={{ color: STATUS_COLOR['in-review'] }}>{s.inReview}</span><span className="dp-stat-lbl">In Review</span></div>
                  <div className="dp-stat"><span className="dp-stat-val" style={{ color: STATUS_COLOR.draft }}>{s.draft}</span><span className="dp-stat-lbl">Draft</span></div>
                </div>
                <div className="dp-bar"><div className="dp-bar-fill" style={{ width: `${coverage}%`, background: DEPT_CONFIG[department].color }} /></div>
              </GlassCard>
            );
          })}
        </div>
      )}

      </>)}

      <style>{`
        .dp-tabs { padding: 0 24px 16px; border-bottom: 1px solid var(--border); margin-bottom: 16px; }
        .dp-card { padding: 16px; }
        .dp-loading { color: var(--text-muted); font-size: 13px; }
        .dp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; padding: 0 24px 24px; }
        .dp-venture-card { display: flex; flex-direction: column; gap: 12px; }
        .dp-card-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .dp-venture-name { font-size: 14px; font-weight: 600; color: var(--text-primary); font-family: var(--font-display); }
        .dp-stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
        .dp-stat { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 6px 4px; background: var(--bg-input); border-radius: var(--radius-sm); }
        .dp-stat-val { font-family: var(--font-mono); font-size: 14px; font-weight: 700; color: var(--text-primary); }
        .dp-stat-lbl { font-size: 9px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-muted); }
        .dp-bar { height: 4px; background: var(--bg-input); border-radius: var(--radius-full); overflow: hidden; }
        .dp-bar-fill { height: 100%; transition: width 0.4s ease; }

        .dp-matrix { padding: 0 24px 24px; overflow-x: auto; }
        .dp-matrix-table { border-collapse: separate; border-spacing: 4px; min-width: 720px; }
        .dp-matrix-th { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); font-family: var(--font-display); padding: 6px 10px; text-align: center; }
        .dp-matrix-th.dp-venture-col { text-align: left; }
        .dp-matrix-td { padding: 8px 10px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm); cursor: pointer; transition: all 0.12s; min-width: 70px; text-align: center; }
        .dp-matrix-td:hover { border-color: var(--border-active); transform: translateY(-1px); }
        .dp-matrix-td.empty { opacity: 0.35; }
        .dp-matrix-count { font-family: var(--font-mono); font-size: 14px; font-weight: 700; color: var(--text-primary); }
        .dp-matrix-venture { font-size: 13px; font-weight: 600; color: var(--text-primary); padding: 8px 12px; background: var(--bg-card); border-radius: var(--radius-sm); min-width: 180px; display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .dp-matrix-venture-badge { font-family: var(--font-mono); font-size: 11px; padding: 2px 8px; border-radius: var(--radius-full); border: 1px solid; }
      `}</style>
    </PageShell>
  );
}

function MatrixGrid({ snapshots, onCellClick }: { snapshots: PortfolioSnapshotRow[]; onCellClick: (dept: Department) => void }) {
  if (!snapshots.length) {
    return (
      <EmptyState
        icon={<Grid size={18} />}
        title="No portfolio data yet"
        description="Create or seed ventures to populate the matrix."
      />
    );
  }

  // Totals row across all ventures per department
  const deptTotals: Record<Department, number> = {
    legal: 0, compliance: 0, research: 0, finance: 0, ops: 0, product: 0,
  };
  for (const s of snapshots) {
    for (const d of DEPT_ORDER) {
      deptTotals[d] += s.summary.docs.byDept[d] || 0;
    }
  }

  const healthBadge = (score: number) => {
    const color = score >= 75 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444';
    return (
      <span className="dp-matrix-venture-badge" style={{ color, borderColor: color }}>{score}</span>
    );
  };

  return (
    <div className="dp-matrix">
      <table className="dp-matrix-table">
        <thead>
          <tr>
            <th className="dp-matrix-th dp-venture-col">Venture</th>
            {DEPT_ORDER.map(d => {
              const cfg = DEPT_CONFIG[d];
              const DeptIcon = cfg.icon;
              return (
                <th key={d} className="dp-matrix-th">
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <DeptIcon size={12} style={{ color: cfg.color }} />
                    <span>{cfg.label}</span>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {snapshots.map(s => (
            <tr key={s.id}>
              <td>
                <div className="dp-matrix-venture">
                  <span>{s.name}</span>
                  {healthBadge(s.summary.health_score)}
                </div>
              </td>
              {DEPT_ORDER.map(d => {
                const count = s.summary.docs.byDept[d] || 0;
                return (
                  <td
                    key={d}
                    className={`dp-matrix-td ${count === 0 ? 'empty' : ''}`}
                    onClick={() => onCellClick(d)}
                    title={`${s.name} · ${DEPT_CONFIG[d].label} · ${count} doc${count === 1 ? '' : 's'}`}
                  >
                    <span className="dp-matrix-count" style={{ color: count > 0 ? DEPT_CONFIG[d].color : 'var(--text-muted)' }}>
                      {count || '—'}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
          <tr>
            <td><div className="dp-matrix-venture" style={{ background: 'var(--bg-input)', fontWeight: 700 }}>Portfolio Total</div></td>
            {DEPT_ORDER.map(d => (
              <td key={d} className="dp-matrix-td" onClick={() => onCellClick(d)} style={{ background: 'var(--bg-input)' }}>
                <span className="dp-matrix-count" style={{ color: DEPT_CONFIG[d].color }}>{deptTotals[d] || '—'}</span>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
