// @ts-nocheck
// src/views/FinancialsDashboard.tsx
// Super Admin — Financials Dashboard

import { useEffect } from 'react';
import { BarChart3, TrendingDown, DollarSign, Clock, Shield, Wallet } from 'lucide-react';
import { useFinanceStore } from '../stores/finance';
import { useLedgerStore } from '../stores/ledger';
import { useCommerceStore } from '../stores/commerce';
import { PageShell, PageHeader, StatCard, GlassCard } from '../components/ui';
import { formatMoney } from '../lib/utils';
import type { RevenueBreakdown } from '../lib/finance/types';

function RunwayBar({ months }: { months: number }) {
  const capped = Math.min(months, 36);
  const pct = (capped / 36) * 100;
  const color = months < 6 ? '#EF4444' : months < 12 ? '#F59E0B' : '#10B981';
  return (
    <div className="runway-wrap">
      <div className="runway-bar-bg">
        <div className="runway-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="runway-label" style={{ color }}>
        {months >= 9999 ? '∞' : `${months}mo`}
      </span>
      <style>{`
        .runway-wrap { display: flex; align-items: center; gap: 10px; }
        .runway-bar-bg { flex: 1; height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden; }
        .runway-bar-fill { height: 100%; border-radius: 3px; transition: width 0.4s ease; }
        .runway-label { font-size: 13px; font-weight: 700; font-family: var(--font-mono); min-width: 36px; }
      `}</style>
    </div>
  );
}

export default function FinancialsDashboard() {
  const { metrics, loadingMetrics, fetchMetrics, incomeStatement, fetchIncomeStatement } = useFinanceStore();
  const { trialBalance, trialBalanceLoading, fetchTrialBalance } = useLedgerStore();
  const { loans, loansLoading, fetchLoans } = useCommerceStore();

  useEffect(() => {
    fetchMetrics('mcv');
    fetchTrialBalance('mcv');
    fetchLoans('mcv');
    const today = new Date().toISOString().slice(0, 10);
    const start = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    fetchIncomeStatement('mcv', start, today);
  }, [fetchMetrics, fetchTrialBalance, fetchLoans, fetchIncomeStatement]);

  const loading = loadingMetrics || trialBalanceLoading || loansLoading;

  const mrr = metrics?.mrr ?? 0;
  const arr = metrics?.arr ?? 0;
  const churnRate = metrics?.churnRate ?? 0;
  const burnRate = metrics?.burnRate ?? 0;
  const runway = metrics?.runway ?? 9999;
  const outstandingAR = metrics?.outstandingAR ?? 0;

  // Cash position from trial balance (asset accounts)
  const cashPosition = trialBalance
    .filter((r) => r.accountType === 'asset' && r.accountCode?.startsWith('1'))
    .reduce((sum, r) => sum + (r.debitBalance - r.creditBalance), 0);

  const activeLoans = loans.filter((l) => {
    const loan = l as { status: string };
    return loan.status === 'disbursed' || loan.status === 'repaying';
  });
  const totalLoanOutstanding = activeLoans.reduce(
    (sum, l) => sum + ((l as { balance?: number; principal?: number }).balance ?? (l as { balance?: number; principal?: number }).principal ?? 0),
    0,
  );

  const revenueBreakdown: Partial<RevenueBreakdown> = incomeStatement?.revenue ?? {};

  const revenueRows = [
    { label: 'Subscriptions', value: revenueBreakdown.subscriptions ?? 0 },
    { label: 'One-Time Sales', value: revenueBreakdown.oneTimeSales ?? 0 },
    { label: 'Digital Products', value: revenueBreakdown.digitalProducts ?? 0 },
    { label: 'Platform Fees', value: revenueBreakdown.platformFees ?? 0 },
    { label: 'Loan Interest', value: revenueBreakdown.loanInterest ?? 0 },
    { label: 'Metered Usage', value: revenueBreakdown.meteredUsage ?? 0 },
  ].filter((r) => r.value > 0);

  const totalRevenue = revenueRows.reduce((sum, r) => sum + r.value, 0) || 1;

  return (
    <PageShell scroll>
      <PageHeader title="Financials" subtitle="Global financial health dashboard" loading={loading} />

      {/* KPI Row */}
      <div className="fd-kpi-row">
        <StatCard label="Cash Position" value={formatMoney(cashPosition)} icon={<Wallet size={16} />} accent="cyan" />
        <StatCard label="MRR" value={formatMoney(mrr)} icon={<DollarSign size={16} />} accent="cyan" />
        <StatCard label="ARR" value={formatMoney(arr)} icon={<BarChart3 size={16} />} accent="purple" />
        <StatCard label="Churn Rate" value={`${(churnRate * 100).toFixed(1)}%`} icon={<TrendingDown size={16} />} accent="warning" />
        <StatCard label="Burn Rate / mo" value={formatMoney(burnRate)} icon={<TrendingDown size={16} />} accent="warning" />
        <StatCard label="Outstanding AR" value={formatMoney(outstandingAR)} icon={<Clock size={16} />} accent="warning" />
        <StatCard label="Loans Outstanding" value={formatMoney(totalLoanOutstanding)} icon={<Shield size={16} />} accent="muted" />
      </div>

      <div className="fd-grid">
        {/* Runway */}
        <GlassCard>
          <div className="fd-card-header">
            <Clock size={14} style={{ color: 'var(--color-cyan)' }} />
            <span className="fd-card-title">Cash Runway</span>
          </div>
          <div className="fd-runway-section">
            <p className="fd-runway-label">At current burn of {formatMoney(burnRate)}/mo</p>
            <RunwayBar months={runway} />
          </div>
        </GlassCard>

        {/* Revenue Breakdown */}
        <GlassCard>
          <div className="fd-card-header">
            <BarChart3 size={14} style={{ color: 'var(--color-cyan)' }} />
            <span className="fd-card-title">Revenue by Type (30d)</span>
          </div>
          {revenueRows.length === 0 ? (
            <p className="fd-empty-text">No revenue data available</p>
          ) : (
            <div className="fd-rev-list">
              {revenueRows.map((row) => {
                const pct = (row.value / totalRevenue) * 100;
                return (
                  <div key={row.label} className="fd-rev-row">
                    <span className="fd-rev-name">{row.label}</span>
                    <div className="fd-rev-bar-wrap">
                      <div className="fd-rev-bar" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="fd-rev-val">{formatMoney(row.value)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </div>

      <style>{`
        .fd-kpi-row {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
          gap: 12px;
          margin-bottom: 20px;
        }
        .fd-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 900px) { .fd-grid { grid-template-columns: 1fr; } }
        .fd-card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 14px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(0,245,255,0.07);
        }
        .fd-card-title {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .fd-runway-section { display: flex; flex-direction: column; gap: 10px; }
        .fd-runway-label { font-size: 11px; color: var(--text-muted); }
        .fd-rev-list { display: flex; flex-direction: column; gap: 9px; }
        .fd-rev-row { display: flex; align-items: center; gap: 10px; }
        .fd-rev-name { font-size: 12px; color: var(--text-secondary); width: 120px; flex-shrink: 0; }
        .fd-rev-bar-wrap { flex: 1; height: 5px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden; }
        .fd-rev-bar { height: 100%; background: linear-gradient(90deg, var(--color-cyan), var(--color-purple)); border-radius: 3px; transition: width 0.4s ease; }
        .fd-rev-val { font-size: 11px; font-family: var(--font-mono); color: var(--text-muted); width: 70px; text-align: right; }
        .fd-empty-text { font-size: 12px; color: var(--text-muted); text-align: center; padding: 20px; }
      `}</style>
    </PageShell>
  );
}
