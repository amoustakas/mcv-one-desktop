import { useEffect, useMemo, useState } from 'react';
import { Scale, ShieldCheck, Beaker, DollarSign, Wrench, Rocket, FileText } from 'lucide-react';
import { PageShell, PageHeader, GlassCard, Badge, EmptyState, Tabs } from '../components/ui';
import { apiPost } from '../lib/api/client';
import type { Venture } from '../lib/ventures';

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
export default function DepartmentPortfolioView() {
  const [department, setDepartment] = useState<Department>('legal');
  const [ventures, setVentures] = useState<Venture[]>([]);
  const [docs, setDocs] = useState<PortfolioDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, [department]);

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
        subtitle={`Cross-venture ${DEPT_CONFIG[department].label.toLowerCase()} status — ${portfolioTotals.approved} of ${portfolioTotals.total} docs approved/executed (${portfolioTotals.coverage_pct}% coverage)`}
        icon={<Icon size={16} style={{ color: DEPT_CONFIG[department].color }} />}
      />

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
      `}</style>
    </PageShell>
  );
}
