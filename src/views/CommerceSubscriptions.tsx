// @ts-nocheck
// src/views/CommerceSubscriptions.tsx
// Super Admin — Subscription Management

import { useEffect } from 'react';
import { CreditCard, CheckCircle, Clock, AlertTriangle, XCircle } from 'lucide-react';
import { useCommerceStore } from '../stores/commerce';
import type { Subscription } from '../lib/commerce/types';
import { PageShell, PageHeader, GlassCard, StatCard, Badge } from '../components/ui';
import { formatMoney } from '../lib/utils';

type SubStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'paused' | string;

function statusAccent(status: SubStatus): 'green' | 'cyan' | 'warning' | 'danger' | 'muted' {
  if (status === 'active') return 'green';
  if (status === 'trialing') return 'cyan';
  if (status === 'past_due') return 'warning';
  if (status === 'canceled') return 'danger';
  return 'muted';
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function CommerceSubscriptions() {
  const { subscriptions, subscriptionsLoading, fetchSubscriptions } = useCommerceStore();

  useEffect(() => {
    fetchSubscriptions('mcv');
  }, [fetchSubscriptions]);

  const subs = subscriptions as Subscription[];

  const activeCount = subs.filter((s) => (s as { status: SubStatus }).status === 'active').length;
  const trialingCount = subs.filter((s) => (s as { status: SubStatus }).status === 'trialing').length;
  const pastDueCount = subs.filter((s) => (s as { status: SubStatus }).status === 'past_due').length;
  const canceledCount = subs.filter((s) => (s as { status: SubStatus }).status === 'canceled').length;

  const totalMrr = subs
    .filter((s) => ['active', 'trialing'].includes((s as { status: SubStatus }).status))
    .reduce((sum, s) => sum + ((s as { mrr?: number }).mrr ?? 0), 0);

  return (
    <PageShell scroll>
      <PageHeader title="Subscriptions" subtitle="All active billing relationships" loading={subscriptionsLoading} />

      {/* Summary Cards */}
      <div className="cs-kpi-row">
        <StatCard label="Active" value={String(activeCount)} icon={<CheckCircle size={16} />} accent="green" />
        <StatCard label="Trialing" value={String(trialingCount)} icon={<Clock size={16} />} accent="cyan" />
        <StatCard label="Past Due" value={String(pastDueCount)} icon={<AlertTriangle size={16} />} accent="warning" />
        <StatCard label="Canceled" value={String(canceledCount)} icon={<XCircle size={16} />} accent="muted" />
        <StatCard label="Total MRR" value={formatMoney(totalMrr)} icon={<CreditCard size={16} />} accent="cyan" />
      </div>

      {/* Subscription List */}
      {subscriptionsLoading ? (
        <div className="cs-loading">
          <div className="cs-spinner" />
          <span>Loading subscriptions...</span>
        </div>
      ) : subs.length === 0 ? (
        <div className="cs-empty">
          <CreditCard size={32} style={{ opacity: 0.3 }} />
          <p>No subscriptions found</p>
        </div>
      ) : (
        <GlassCard>
          <div className="cs-table-wrap">
            <table className="cs-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>MRR</th>
                  <th>Next Renewal</th>
                  <th>Trial End</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => {
                  const sub = s as Subscription & {
                    status: SubStatus;
                    customerId?: string;
                    planName?: string;
                    mrr?: number;
                    currentPeriodEnd?: string;
                    trialEnd?: string;
                  };
                  return (
                    <tr key={sub.id} className="cs-row">
                      <td className="cs-td cs-customer">{sub.customerId ?? '—'}</td>
                      <td className="cs-td cs-plan">{sub.planName ?? sub.id}</td>
                      <td className="cs-td">
                        <Badge variant={statusAccent(sub.status)}>{sub.status.replace('_', ' ')}</Badge>
                      </td>
                      <td className="cs-td cs-mrr">{sub.mrr != null ? formatMoney(sub.mrr) : '—'}</td>
                      <td className="cs-td cs-date">{formatDate(sub.currentPeriodEnd)}</td>
                      <td className="cs-td cs-date">{sub.trialEnd ? formatDate(sub.trialEnd) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      <style>{`
        .cs-kpi-row {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 12px;
          margin-bottom: 20px;
        }
        .cs-table-wrap { overflow-x: auto; }
        .cs-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        .cs-table th {
          text-align: left;
          padding: 8px 12px;
          color: var(--text-muted);
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          border-bottom: 1px solid var(--border);
        }
        .cs-row:hover td { background: rgba(0,245,255,0.02); }
        .cs-td {
          padding: 10px 12px;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          color: var(--text-secondary);
          vertical-align: middle;
        }
        .cs-customer { color: var(--text-primary); font-weight: 500; font-size: 12px; }
        .cs-plan { color: var(--text-secondary); }
        .cs-mrr { font-family: var(--font-mono); color: var(--color-cyan); font-weight: 600; }
        .cs-date { font-family: var(--font-mono); font-size: 11px; }
        .cs-loading, .cs-empty {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 12px; padding: 60px; color: var(--text-muted); font-size: 13px;
        }
        .cs-spinner {
          width: 22px; height: 22px;
          border: 2px solid var(--border);
          border-top-color: var(--color-cyan);
          border-radius: 50%;
          animation: csSpin 0.6s linear infinite;
        }
        @keyframes csSpin { to { transform: rotate(360deg); } }
      `}</style>
    </PageShell>
  );
}
