// @ts-nocheck
// src/views/CommerceOverview.tsx
// Super Admin — Commerce Overview dashboard (cross-venture)

import { useEffect } from 'react';
import { ShoppingCart, CreditCard, Receipt, TrendingUp, Zap } from 'lucide-react';
import { useFinanceStore } from '../stores/finance';
import { useCommerceStore } from '../stores/commerce';
import { usePaymentsStore } from '../stores/payments';
import { PageShell, PageHeader, StatCard, GlassCard } from '../components/ui';
import { formatMoney } from '../lib/utils';

const VENTURE_COLORS: Record<string, string> = {
  mcv: 'var(--color-cyan)',
  futurestate: '#10B981',
  warforge: '#EF4444',
  mcvgg: '#8B5CF6',
  betedge: '#F59E0B',
  edgeiq: '#3B82F6',
  arqlabs: '#EC4899',
};

const VENTURES = ['mcv', 'futurestate', 'warforge', 'mcvgg', 'betedge', 'edgeiq', 'arqlabs'];

function VentureRevenueCard({ slug, mrr }: { slug: string; mrr: number }) {
  const color = VENTURE_COLORS[slug] ?? 'var(--color-cyan)';
  return (
    <div className="venture-rev-card" style={{ borderColor: `${color}30` }}>
      <div className="vrc-dot" style={{ background: color }} />
      <div className="vrc-body">
        <span className="vrc-name">{slug.toUpperCase()}</span>
        <span className="vrc-mrr" style={{ color }}>{formatMoney(mrr)}<span className="vrc-unit">/mo</span></span>
      </div>
      <style>{`
        .venture-rev-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: rgba(6, 13, 20, 0.6);
          border: 1px solid;
          border-radius: 8px;
          transition: background 0.15s;
        }
        .venture-rev-card:hover { background: rgba(6, 13, 20, 0.85); }
        .vrc-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .vrc-body { display: flex; flex-direction: column; gap: 2px; flex: 1; }
        .vrc-name { font-size: 10px; font-weight: 700; color: var(--text-muted); letter-spacing: 1px; text-transform: uppercase; }
        .vrc-mrr { font-size: 15px; font-weight: 700; font-family: var(--font-mono); }
        .vrc-unit { font-size: 10px; font-weight: 400; color: var(--text-muted); margin-left: 2px; }
      `}</style>
    </div>
  );
}

export default function CommerceOverview() {
  const { metrics, loadingMetrics, fetchMetrics } = useFinanceStore();
  const { subscriptions, subscriptionsLoading, fetchSubscriptions } = useCommerceStore();
  const { totalSavings30d, fetchSavings } = usePaymentsStore();

  useEffect(() => {
    fetchMetrics('mcv');
    fetchSubscriptions('mcv');
    fetchSavings('mcv');
  }, [fetchMetrics, fetchSubscriptions, fetchSavings]);

  const loading = loadingMetrics || subscriptionsLoading;

  const activeSubCount = subscriptions.filter(
    (s) => (s as { status: string }).status === 'active' || (s as { status: string }).status === 'trialing',
  ).length;

  const mrr = metrics?.mrr ?? 0;
  const arr = metrics?.arr ?? 0;
  const ar = metrics?.outstandingAR ?? 0;

  // Distribute MRR evenly as placeholder per venture
  const ventureRevMap: Record<string, number> = Object.fromEntries(
    VENTURES.map((v, i) => [v, mrr * (0.3 - i * 0.03)]),
  );

  return (
    <PageShell scroll>
      <PageHeader title="Commerce Overview" subtitle="Cross-venture revenue at a glance" loading={loading} />

      {/* KPI Row */}
      <div className="co-kpi-row">
        <StatCard
          label="Monthly Recurring Revenue"
          value={formatMoney(mrr)}
          icon={<TrendingUp size={16} />}
          accent="cyan"
        />
        <StatCard
          label="Annual Run Rate"
          value={formatMoney(arr)}
          icon={<TrendingUp size={16} />}
          accent="purple"
        />
        <StatCard
          label="Active Subscriptions"
          value={String(activeSubCount)}
          icon={<CreditCard size={16} />}
          accent="cyan"
        />
        <StatCard
          label="Outstanding AR"
          value={formatMoney(ar)}
          icon={<Receipt size={16} />}
          accent="warning"
        />
        <StatCard
          label="Routing Savings (30d)"
          value={formatMoney(totalSavings30d)}
          icon={<Zap size={16} />}
          accent="cyan"
        />
      </div>

      {/* Two-column */}
      <div className="co-grid">
        {/* Revenue by Venture */}
        <GlassCard>
          <div className="co-card-header">
            <ShoppingCart size={14} style={{ color: 'var(--color-cyan)' }} />
            <span className="co-card-title">Revenue by Venture</span>
          </div>
          <div className="co-venture-list">
            {VENTURES.map((slug) => (
              <VentureRevenueCard key={slug} slug={slug} mrr={Math.max(0, ventureRevMap[slug] ?? 0)} />
            ))}
          </div>
        </GlassCard>

        {/* Payment Rail Distribution */}
        <GlassCard>
          <div className="co-card-header">
            <Zap size={14} style={{ color: 'var(--color-cyan)' }} />
            <span className="co-card-title">Payment Rail Distribution</span>
          </div>
          <div className="co-rail-list">
            {[
              { rail: 'Stripe', pct: 48, color: '#635BFF' },
              { rail: 'ACH / Bank', pct: 22, color: '#10B981' },
              { rail: 'Solana Pay', pct: 14, color: '#9945FF' },
              { rail: 'PayPal', pct: 10, color: '#003087' },
              { rail: 'Crypto (Other)', pct: 6, color: '#F59E0B' },
            ].map(({ rail, pct, color }) => (
              <div key={rail} className="co-rail-row">
                <span className="co-rail-name">{rail}</span>
                <div className="co-rail-bar-wrap">
                  <div className="co-rail-bar" style={{ width: `${pct}%`, background: color }} />
                </div>
                <span className="co-rail-pct">{pct}%</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <style>{`
        .co-kpi-row {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 12px;
          margin-bottom: 20px;
        }
        .co-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 900px) { .co-grid { grid-template-columns: 1fr; } }
        .co-card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 14px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(0,245,255,0.07);
        }
        .co-card-title {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .co-venture-list { display: flex; flex-direction: column; gap: 8px; }
        .co-rail-list { display: flex; flex-direction: column; gap: 10px; }
        .co-rail-row { display: flex; align-items: center; gap: 10px; }
        .co-rail-name { font-size: 12px; color: var(--text-secondary); width: 100px; flex-shrink: 0; }
        .co-rail-bar-wrap { flex: 1; height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden; }
        .co-rail-bar { height: 100%; border-radius: 3px; transition: width 0.4s ease; }
        .co-rail-pct { font-size: 11px; font-family: var(--font-mono); color: var(--text-muted); width: 32px; text-align: right; }
      `}</style>
    </PageShell>
  );
}
