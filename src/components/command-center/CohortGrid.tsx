import { useMemo } from 'react';
import { Users, TrendingUp } from 'lucide-react';
import { SectionCard, Tooltip, Badge, Skeleton } from '../ui';
import { formatCurrency, formatCompact } from '../../lib/utils';
import { useCommerceCohorts } from '../../hooks/use-commerce-metrics';

/**
 * Customer cohort grid — signup-month buckets with count, revenue, avg
 * LTV, total orders. Renders a heatmap-style table where each row is a
 * cohort month and the per-cell color intensity reflects metric strength
 * relative to the strongest cohort across the window.
 */
export default function CohortGrid({ ventureId = 'all' }: { ventureId?: string | 'all' }) {
  const { data, isLoading } = useCommerceCohorts(ventureId);
  const cohorts = data?.cohorts || [];

  const max = useMemo(() => {
    return cohorts.reduce(
      (acc, c) => ({
        count: Math.max(acc.count, c.count),
        revenue: Math.max(acc.revenue, c.revenue),
        avg_ltv: Math.max(acc.avg_ltv, c.avg_ltv),
        total_orders: Math.max(acc.total_orders, c.total_orders),
      }),
      { count: 1, revenue: 1, avg_ltv: 1, total_orders: 1 },
    );
  }, [cohorts]);

  const totals = useMemo(() => {
    return cohorts.reduce(
      (acc, c) => ({
        count: acc.count + c.count,
        revenue: acc.revenue + c.revenue,
        orders: acc.orders + c.total_orders,
      }),
      { count: 0, revenue: 0, orders: 0 },
    );
  }, [cohorts]);

  if (isLoading) {
    return (
      <SectionCard title="Customer Cohorts" icon={<Users size={14} />} padding="md">
        <Skeleton />
      </SectionCard>
    );
  }

  if (cohorts.length === 0) return null;

  const heatColor = (val: number, maxVal: number) => {
    if (val <= 0) return 'transparent';
    const pct = Math.min(1, val / maxVal);
    // Cyan → purple gradient by intensity
    const alpha = 0.08 + pct * 0.32;
    return `rgba(0, 240, 255, ${alpha})`;
  };

  // Show most recent first
  const ordered = [...cohorts].reverse();

  return (
    <SectionCard
      title="Customer Cohorts"
      icon={<Users size={14} />}
      description={`${cohorts.length} signup months · ${totals.count.toLocaleString()} customers · ${formatCurrency(totals.revenue)} lifetime`}
      action={
        <Badge color="#8B5CF6" variant="outline" size="md">
          <TrendingUp size={11} /> Avg LTV {formatCurrency(totals.count > 0 ? totals.revenue / totals.count : 0)}
        </Badge>
      }
      padding="none"
    >
      <div className="cg-wrap">
        <table className="cg-table">
          <thead>
            <tr>
              <th>Cohort</th>
              <th style={{ textAlign: 'right' }}>Customers</th>
              <th style={{ textAlign: 'right' }}>Total Revenue</th>
              <th style={{ textAlign: 'right' }}>Avg LTV</th>
              <th style={{ textAlign: 'right' }}>Orders</th>
            </tr>
          </thead>
          <tbody>
            {ordered.map((c) => {
              const month = new Date(c.cohort + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
              return (
                <tr key={c.cohort}>
                  <td className="cg-month">{month}</td>
                  <td style={{ background: heatColor(c.count, max.count), textAlign: 'right' }}>
                    <Tooltip content={`${c.count} customers signed up`}>
                      <span className="cg-num">{c.count.toLocaleString()}</span>
                    </Tooltip>
                  </td>
                  <td style={{ background: heatColor(c.revenue, max.revenue), textAlign: 'right' }}>
                    <Tooltip content={formatCurrency(c.revenue)}>
                      <span className="cg-num">{formatCompact(c.revenue)}</span>
                    </Tooltip>
                  </td>
                  <td style={{ background: heatColor(c.avg_ltv, max.avg_ltv), textAlign: 'right' }}>
                    <Tooltip content={formatCurrency(c.avg_ltv)}>
                      <span className="cg-num">{formatCompact(c.avg_ltv)}</span>
                    </Tooltip>
                  </td>
                  <td style={{ background: heatColor(c.total_orders, max.total_orders), textAlign: 'right' }}>
                    <Tooltip content={`${c.total_orders} total orders`}>
                      <span className="cg-num">{c.total_orders.toLocaleString()}</span>
                    </Tooltip>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <style>{`
        .cg-wrap { max-height: 320px; overflow-y: auto; }
        .cg-table { width: 100%; border-collapse: collapse; font-size: 11px; }
        .cg-table thead { position: sticky; top: 0; background: var(--bg-card); z-index: 1; }
        .cg-table th { padding: 8px 12px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); font-weight: 600; border-bottom: 1px solid var(--border); }
        .cg-table td { padding: 8px 12px; border-bottom: 1px solid var(--border); transition: background var(--transition-fast); }
        .cg-table tbody tr:hover td { background: var(--bg-hover) !important; }
        .cg-month { color: var(--text-secondary); font-family: var(--font-mono); font-size: 11px; font-weight: 500; }
        .cg-num { font-family: var(--font-mono); font-weight: 600; color: var(--text-primary); }
      `}</style>
    </SectionCard>
  );
}
