import { useMemo } from 'react';
import { ArrowDownCircle, ArrowUpCircle, Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { SectionCard, Tooltip, Badge } from '../ui';
import { formatCurrency } from '../../lib/utils';
import { ventures } from '../../lib/ventures';
import type { CommerceMetricsSnapshot } from '../../hooks/use-commerce-metrics';

interface VentureCashflow {
  ventureId: string;
  ventureName: string;
  ventureColor: string;
  inflow: number;
  outflow: number;
  net: number;
  transactions: number;
}

/**
 * Aggregates 30-day cashflow across every venture. Top half shows the
 * portfolio-wide inflow/outflow split + net; bottom half breaks down by
 * venture with a horizontal "river" bar (green inflow left of zero, red
 * outflow right of zero, scaled to the largest absolute value across
 * all ventures).
 */
export default function CashflowMicroPanel({
  ventureMetrics,
}: {
  ventureMetrics: Record<string, CommerceMetricsSnapshot | undefined>;
}) {
  const breakdown = useMemo<VentureCashflow[]>(() => {
    return ventures
      .map((v) => {
        const m = ventureMetrics[v.id];
        if (!m) return null;
        return {
          ventureId: v.id,
          ventureName: v.name,
          ventureColor: v.color,
          inflow: m.cashflow.inflow,
          outflow: m.cashflow.outflow,
          net: m.cashflow.net,
          transactions: m.cashflow.transaction_count,
        } satisfies VentureCashflow;
      })
      .filter((x): x is VentureCashflow => x !== null);
  }, [ventureMetrics]);

  const totals = useMemo(() => {
    return breakdown.reduce(
      (acc, b) => ({
        inflow: acc.inflow + b.inflow,
        outflow: acc.outflow + b.outflow,
        net: acc.net + b.net,
        transactions: acc.transactions + b.transactions,
      }),
      { inflow: 0, outflow: 0, net: 0, transactions: 0 },
    );
  }, [breakdown]);

  // Skip rendering if absolutely no cashflow signal across any venture
  if (totals.inflow === 0 && totals.outflow === 0) return null;

  const maxAbs = Math.max(
    ...breakdown.flatMap((b) => [Math.abs(b.inflow), Math.abs(b.outflow)]),
    1,
  );

  // Total bar split percentages (for header river bar)
  const totalGross = totals.inflow + totals.outflow;
  const inflowPct = totalGross > 0 ? (totals.inflow / totalGross) * 100 : 0;
  const outflowPct = totalGross > 0 ? (totals.outflow / totalGross) * 100 : 0;

  const trendDir = totals.net > 0 ? 'up' : totals.net < 0 ? 'down' : 'flat';
  const TrendIcon = trendDir === 'up' ? TrendingUp : trendDir === 'down' ? TrendingDown : Minus;
  const trendColor = trendDir === 'up' ? 'var(--success)' : trendDir === 'down' ? 'var(--error)' : 'var(--text-muted)';

  return (
    <SectionCard
      title="Cashflow"
      icon={<Activity size={14} />}
      description={`30-day rolling · ${totals.transactions.toLocaleString()} transactions across ${breakdown.length} ventures`}
      action={
        <Badge color={trendColor} variant="outline" size="md">
          <TrendIcon size={11} /> Net {formatCurrency(totals.net)}
        </Badge>
      }
      padding="md"
    >
      {/* Top — portfolio-wide split */}
      <div className="cf-summary">
        <div className="cf-summary-side">
          <ArrowDownCircle size={14} style={{ color: 'var(--success)' }} />
          <div className="cf-summary-meta">
            <span className="cf-label">Inflow</span>
            <strong className="cf-amt cf-amt-in">{formatCurrency(totals.inflow)}</strong>
          </div>
        </div>
        <div className="cf-river" aria-hidden>
          <div className="cf-river-in" style={{ width: `${inflowPct}%` }} />
          <div className="cf-river-out" style={{ width: `${outflowPct}%` }} />
        </div>
        <div className="cf-summary-side cf-summary-side-right">
          <div className="cf-summary-meta cf-summary-meta-right">
            <span className="cf-label">Outflow</span>
            <strong className="cf-amt cf-amt-out">{formatCurrency(totals.outflow)}</strong>
          </div>
          <ArrowUpCircle size={14} style={{ color: 'var(--error)' }} />
        </div>
      </div>

      {/* Bottom — per-venture rows */}
      <ul className="cf-list">
        {breakdown.map((b) => {
          const inWidth = (Math.abs(b.inflow) / maxAbs) * 100;
          const outWidth = (Math.abs(b.outflow) / maxAbs) * 100;
          const netPositive = b.net >= 0;
          return (
            <li key={b.ventureId} className="cf-row">
              <span className="cf-venture">
                <span className="cf-dot" style={{ background: b.ventureColor }} />
                {b.ventureName}
              </span>
              <div className="cf-bars">
                <div className="cf-bar-half cf-bar-half-in">
                  <Tooltip content={`Inflow: ${formatCurrency(b.inflow)}`}>
                    <span className="cf-bar cf-bar-in" style={{ width: `${inWidth}%` }} />
                  </Tooltip>
                </div>
                <div className="cf-bar-half cf-bar-half-out">
                  <Tooltip content={`Outflow: ${formatCurrency(b.outflow)}`}>
                    <span className="cf-bar cf-bar-out" style={{ width: `${outWidth}%` }} />
                  </Tooltip>
                </div>
              </div>
              <span className="cf-net" style={{ color: netPositive ? 'var(--success)' : 'var(--error)' }}>
                {netPositive ? '+' : ''}{formatCurrency(b.net)}
              </span>
            </li>
          );
        })}
      </ul>

      <style>{`
        .cf-summary { display: grid; grid-template-columns: 1fr auto 1fr; gap: 14px; align-items: center; padding: 6px 0 12px; border-bottom: 1px solid var(--border); margin-bottom: 12px; }
        .cf-summary-side { display: inline-flex; align-items: center; gap: 8px; }
        .cf-summary-side-right { justify-content: flex-end; }
        .cf-summary-meta { display: flex; flex-direction: column; gap: 1px; }
        .cf-summary-meta-right { align-items: flex-end; }
        .cf-label { font-size: 9px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
        .cf-amt { font-family: var(--font-mono); font-size: 14px; font-weight: 700; }
        .cf-amt-in { color: var(--success); }
        .cf-amt-out { color: var(--error); }
        .cf-river { display: inline-flex; min-width: 220px; height: 6px; border-radius: var(--radius-full); overflow: hidden; background: var(--bg-elevated); }
        .cf-river-in { background: linear-gradient(90deg, rgba(16, 185, 129, 0.4), var(--success)); transition: width var(--transition-slow); box-shadow: inset 0 0 6px rgba(16, 185, 129, 0.5); }
        .cf-river-out { background: linear-gradient(90deg, var(--error), rgba(239, 68, 68, 0.4)); transition: width var(--transition-slow); box-shadow: inset 0 0 6px rgba(239, 68, 68, 0.5); }

        .cf-list { list-style: none; display: flex; flex-direction: column; gap: 4px; padding: 0; }
        .cf-row { display: grid; grid-template-columns: 130px 1fr 96px; gap: 12px; align-items: center; padding: 6px 4px; font-size: 12px; transition: background var(--transition-fast); border-radius: var(--radius-sm); }
        .cf-row:hover { background: var(--bg-hover); }
        .cf-venture { display: inline-flex; align-items: center; gap: 6px; color: var(--text-secondary); font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .cf-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .cf-bars { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; align-items: center; height: 14px; }
        .cf-bar-half { display: flex; align-items: center; height: 100%; overflow: hidden; }
        .cf-bar-half-in { justify-content: flex-end; }
        .cf-bar-half-out { justify-content: flex-start; }
        .cf-bar { height: 6px; border-radius: 2px; transition: width var(--transition-base); }
        .cf-bar-in { background: linear-gradient(90deg, rgba(16, 185, 129, 0.3), var(--success)); }
        .cf-bar-out { background: linear-gradient(90deg, var(--error), rgba(239, 68, 68, 0.3)); }
        .cf-net { font-family: var(--font-mono); font-weight: 600; font-size: 11px; text-align: right; }
      `}</style>
    </SectionCard>
  );
}
