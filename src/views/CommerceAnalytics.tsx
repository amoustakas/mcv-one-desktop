// @ts-nocheck
// src/views/CommerceAnalytics.tsx
// Commerce analytics dashboard — Shop Management

import { useEffect } from 'react';
import { BarChart3, TrendingUp, ShoppingCart, Users2, Zap } from 'lucide-react';
import { useCommerceSurfaceStore } from '../stores/commerce-surface';
import { useNavigation } from '../stores/navigation';
import type { CommerceAnalytics } from '../lib/commerce/surface-types';
import { PageShell, PageHeader, StatCard, GlassCard } from '../components/ui';
import { formatMoney } from '../lib/utils';

const FUNNEL_STAGES = [
  { key: 'visitors', label: 'Visitors' },
  { key: 'productViews', label: 'Product Views' },
  { key: 'addedToCart', label: 'Added to Cart' },
  { key: 'reachedCheckout', label: 'Reached Checkout' },
  { key: 'completed', label: 'Completed' },
];

const CHANNEL_COLORS: Record<string, string> = {
  Stripe: '#635BFF',
  'Solana Pay': '#9945FF',
  Credits: 'var(--color-cyan)',
};

export default function CommerceAnalyticsView() {
  const { analytics, analyticsLoading, fetchAnalytics } = useCommerceSurfaceStore();
  const { activeVenture } = useNavigation();
  const ventureId = activeVenture || 'mcv';

  useEffect(() => {
    fetchAnalytics(ventureId);
  }, [ventureId, fetchAnalytics]);

  const data: CommerceAnalytics | null = analytics;

  const conversionRate = data?.funnel?.conversionRate ?? 0;
  const abandonment = data?.cartAbandonment?.rate ?? 0;
  const repeatPurchase = data?.repeatPurchaseRate ?? 0;
  const aov = data?.averageOrderValue ?? 0;

  const funnelMax = data?.funnel ? Math.max(
    data.funnel.visitors,
    data.funnel.productViews,
    data.funnel.addedToCart,
    data.funnel.reachedCheckout,
    data.funnel.completed,
    1,
  ) : 1;

  const funnelValues: Record<string, number> = data?.funnel ? {
    visitors: data.funnel.visitors,
    productViews: data.funnel.productViews,
    addedToCart: data.funnel.addedToCart,
    reachedCheckout: data.funnel.reachedCheckout,
    completed: data.funnel.completed,
  } : {};

  // Placeholder channel breakdown
  const channels = [
    { name: 'Stripe', pct: 52, revenue: aov * 120 },
    { name: 'Solana Pay', pct: 30, revenue: aov * 70 },
    { name: 'Credits', pct: 18, revenue: aov * 42 },
  ];

  return (
    <PageShell scroll>
      <PageHeader title="Commerce Analytics" subtitle="Funnel, conversions, and revenue breakdown" loading={analyticsLoading} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <StatCard label="Conversion Rate" value={`${(conversionRate * 100).toFixed(1)}%`} icon={<TrendingUp size={16} />} accent="cyan" />
        <StatCard label="Cart Abandonment" value={`${(abandonment * 100).toFixed(1)}%`} icon={<ShoppingCart size={16} />} accent="warning" />
        <StatCard label="Repeat Purchase Rate" value={`${(repeatPurchase * 100).toFixed(1)}%`} icon={<Users2 size={16} />} accent="purple" />
        <StatCard label="Avg Order Value" value={formatMoney(aov)} icon={<BarChart3 size={16} />} accent="cyan" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Conversion Funnel */}
        <GlassCard>
          <div className="ca-card-header">
            <TrendingUp size={14} style={{ color: 'var(--color-cyan)' }} />
            <span className="ca-card-title">Conversion Funnel</span>
          </div>
          {!data ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              {analyticsLoading ? 'Loading...' : 'No analytics data yet'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {FUNNEL_STAGES.map(({ key, label }) => {
                const val = funnelValues[key] ?? 0;
                const pct = funnelMax > 0 ? (val / funnelMax) * 100 : 0;
                return (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{label}</span>
                      <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--color-cyan)' }}>
                        {val.toLocaleString()}
                      </span>
                    </div>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${pct}%`,
                        background: 'linear-gradient(90deg, var(--color-cyan), var(--color-purple))',
                        borderRadius: '4px', transition: 'width 0.5s ease',
                      }} />
                    </div>
                    {key !== 'completed' && val > 0 && funnelValues[FUNNEL_STAGES[FUNNEL_STAGES.findIndex(s => s.key === key) + 1]?.key] !== undefined && (
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', textAlign: 'right' }}>
                        {(((funnelValues[FUNNEL_STAGES[FUNNEL_STAGES.findIndex(s => s.key === key) + 1]?.key] ?? 0) / val) * 100).toFixed(1)}% advance
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>

        {/* Cart Abandonment */}
        <GlassCard>
          <div className="ca-card-header">
            <ShoppingCart size={14} style={{ color: '#F59E0B' }} />
            <span className="ca-card-title">Cart Abandonment</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="ca-metric-row">
              <span className="ca-metric-label">Abandonment Rate</span>
              <span className="ca-metric-val" style={{ color: '#F59E0B' }}>{(abandonment * 100).toFixed(1)}%</span>
            </div>
            <div className="ca-metric-row">
              <span className="ca-metric-label">Recovery Rate</span>
              <span className="ca-metric-val" style={{ color: '#10B981' }}>
                {data ? `${((data.cartAbandonment?.recoveryRate ?? 0) * 100).toFixed(1)}%` : '—'}
              </span>
            </div>
            <div className="ca-metric-row">
              <span className="ca-metric-label">Revenue Recovered</span>
              <span className="ca-metric-val" style={{ color: 'var(--color-cyan)' }}>
                {data ? formatMoney(data.cartAbandonment?.revenueRecovered ?? 0) : '—'}
              </span>
            </div>
            {data?.cartAbandonment?.topAbandonedProducts?.length > 0 && (
              <div>
                <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Most Abandoned Products
                </p>
                {data.cartAbandonment.topAbandonedProducts.slice(0, 3).map((p) => (
                  <div key={p.productId} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{p.productId.slice(-8)}</span>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{p.count}×</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </GlassCard>

        {/* Top Products */}
        <GlassCard>
          <div className="ca-card-header">
            <BarChart3 size={14} style={{ color: 'var(--color-cyan)' }} />
            <span className="ca-card-title">Top Products</span>
          </div>
          <div className="ca-top-header">
            <span style={{ flex: '0 0 28px' }}>#</span>
            <span style={{ flex: '1' }}>Product</span>
            <span style={{ flex: '0 0 90px', textAlign: 'right' }}>Revenue</span>
            <span style={{ flex: '0 0 70px', textAlign: 'right' }}>Units</span>
          </div>
          {(!data || data.topProducts.length === 0) ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
              {analyticsLoading ? 'Loading...' : 'No product data'}
            </div>
          ) : data.topProducts.slice(0, 10).map((p, idx) => (
            <div key={p.productId} className="ca-top-row">
              <span style={{ flex: '0 0 28px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                {idx + 1}
              </span>
              <span style={{ flex: '1', fontSize: '12px', color: 'var(--text-secondary)' }}>
                {p.productId.length > 20 ? `...${p.productId.slice(-12)}` : p.productId}
              </span>
              <span style={{ flex: '0 0 90px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-cyan)' }}>
                {formatMoney(p.revenue)}
              </span>
              <span style={{ flex: '0 0 70px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>
                {p.unitsSold}
              </span>
            </div>
          ))}
        </GlassCard>

        {/* Revenue by Channel */}
        <GlassCard>
          <div className="ca-card-header">
            <Zap size={14} style={{ color: 'var(--color-cyan)' }} />
            <span className="ca-card-title">Revenue by Channel</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {channels.map(({ name, pct, revenue }) => (
              <div key={name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{name}</span>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: CHANNEL_COLORS[name] ?? 'var(--text-muted)' }}>
                      {formatMoney(revenue)}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', width: '34px', textAlign: 'right' }}>{pct}%</span>
                  </div>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${pct}%`,
                    background: CHANNEL_COLORS[name] ?? '#6B7280',
                    borderRadius: '3px', transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="ca-metric-row">
              <span className="ca-metric-label">Customer Acq. Cost</span>
              <span className="ca-metric-val">{data ? formatMoney(data.customerAcquisitionCost) : '—'}</span>
            </div>
            <div className="ca-metric-row" style={{ marginTop: '8px' }}>
              <span className="ca-metric-label">Repeat Purchase Rate</span>
              <span className="ca-metric-val" style={{ color: '#10B981' }}>
                {(repeatPurchase * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </GlassCard>
      </div>

      <style>{`
        .ca-card-header {
          display: flex; align-items: center; gap: 8px;
          margin-bottom: 16px; padding-bottom: 10px;
          border-bottom: 1px solid rgba(0,245,255,0.07);
        }
        .ca-card-title {
          font-size: 12px; font-weight: 600; color: var(--text-primary);
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        .ca-metric-row { display: flex; justify-content: space-between; align-items: center; }
        .ca-metric-label { font-size: 12px; color: var(--text-muted); }
        .ca-metric-val { font-size: 14px; font-weight: 700; font-family: var(--font-mono); color: var(--text-primary); }
        .ca-top-header {
          display: flex; padding: 6px 0; margin-bottom: 4px;
          font-size: 9px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.8px; color: var(--text-muted); gap: 8px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .ca-top-row {
          display: flex; padding: 7px 0; gap: 8px;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          transition: background 0.12s;
        }
        .ca-top-row:last-child { border-bottom: none; }
      `}</style>
    </PageShell>
  );
}
