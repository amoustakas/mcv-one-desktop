// @ts-nocheck
// src/views/CostIntelligence.tsx
// Super Admin — Cost Intelligence & Fee Optimization

import { useEffect } from 'react';
import { TrendingUp, Zap, DollarSign, ArrowRight, AlertCircle } from 'lucide-react';
import { useFinanceStore } from '../stores/finance';
import { PageShell, PageHeader, StatCard, GlassCard } from '../components/ui';
import { formatMoney } from '../lib/utils';

const EFFORT_COLORS = {
  low: '#10B981',
  medium: '#F59E0B',
  high: '#EF4444',
} as const;

export default function CostIntelligence() {
  const { costIntelligence, loadingCostIntelligence, fetchCostIntelligence } = useFinanceStore();

  useEffect(() => {
    fetchCostIntelligence('mcv', 30);
  }, [fetchCostIntelligence]);

  const ci = costIntelligence;

  const processorEntries = ci ? Object.entries(ci.feesByProcessor) : [];
  const railEntries = ci ? Object.entries(ci.feesByRail) : [];
  const maxProcessorFee = Math.max(...processorEntries.map(([, v]) => v), 1);
  const maxRailFee = Math.max(...railEntries.map(([, v]) => v), 1);

  return (
    <PageShell scroll>
      <PageHeader
        title="Cost Intelligence"
        subtitle="Fee analysis and routing optimization — last 30 days"
        loading={loadingCostIntelligence}
      />

      {/* KPI Row */}
      <div className="ci-kpi-row">
        <StatCard
          label="Total Processing Fees"
          value={ci ? formatMoney(ci.totalProcessingFees) : '—'}
          icon={<DollarSign size={16} />}
          accent="warning"
        />
        <StatCard
          label="Avg Fee Rate"
          value={ci ? `${(ci.avgFeePercentage * 100).toFixed(2)}%` : '—'}
          icon={<TrendingUp size={16} />}
          accent="muted"
        />
        <StatCard
          label="Smart Routing Savings"
          value={ci ? formatMoney(ci.savingsFromSmartRouting) : '—'}
          icon={<Zap size={16} />}
          accent="cyan"
        />
        <StatCard
          label="Crypto Rail Savings"
          value={ci ? formatMoney(ci.savingsFromCryptoRails) : '—'}
          icon={<Zap size={16} />}
          accent="purple"
        />
        <StatCard
          label="Total Savings"
          value={ci ? formatMoney(ci.totalSavings) : '—'}
          icon={<Zap size={16} />}
          accent="cyan"
        />
      </div>

      <div className="ci-grid">
        {/* Fees by Processor */}
        <GlassCard>
          <div className="ci-card-header">
            <DollarSign size={14} style={{ color: 'var(--color-cyan)' }} />
            <span className="ci-card-title">Fees by Processor</span>
          </div>
          {processorEntries.length === 0 ? (
            <p className="ci-empty">No data</p>
          ) : (
            <div className="ci-bar-list">
              {processorEntries.sort(([, a], [, b]) => b - a).map(([processor, fee]) => (
                <div key={processor} className="ci-bar-row">
                  <span className="ci-bar-label">{processor}</span>
                  <div className="ci-bar-wrap">
                    <div
                      className="ci-bar-fill"
                      style={{ width: `${(fee / maxProcessorFee) * 100}%`, background: 'var(--color-cyan)' }}
                    />
                  </div>
                  <span className="ci-bar-val">{formatMoney(fee)}</span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Fees by Rail */}
        <GlassCard>
          <div className="ci-card-header">
            <Zap size={14} style={{ color: 'var(--color-purple)' }} />
            <span className="ci-card-title">Fees by Rail</span>
          </div>
          {railEntries.length === 0 ? (
            <p className="ci-empty">No data</p>
          ) : (
            <div className="ci-bar-list">
              {railEntries.sort(([, a], [, b]) => b - a).map(([rail, fee]) => (
                <div key={rail} className="ci-bar-row">
                  <span className="ci-bar-label">{rail}</span>
                  <div className="ci-bar-wrap">
                    <div
                      className="ci-bar-fill"
                      style={{ width: `${(fee / maxRailFee) * 100}%`, background: 'var(--color-purple)' }}
                    />
                  </div>
                  <span className="ci-bar-val">{formatMoney(fee)}</span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {/* Recommendations */}
      {ci && ci.recommendations.length > 0 && (
        <GlassCard style={{ marginTop: 16 }}>
          <div className="ci-card-header">
            <AlertCircle size={14} style={{ color: 'var(--color-cyan)' }} />
            <span className="ci-card-title">Optimization Recommendations</span>
            <span className="ci-rec-count">{ci.recommendations.length}</span>
          </div>
          <div className="ci-rec-list">
            {ci.recommendations.sort((a, b) => a.priority - b.priority).map((rec, i) => (
              <div key={i} className="ci-rec-card">
                <div className="ci-rec-top">
                  <ArrowRight size={12} style={{ color: 'var(--color-cyan)', flexShrink: 0 }} />
                  <div className="ci-rec-info">
                    <span className="ci-rec-title">{rec.title}</span>
                    <span className="ci-rec-desc">{rec.description}</span>
                  </div>
                  <div className="ci-rec-right">
                    <span className="ci-rec-savings">{formatMoney(rec.estimatedMonthlySavings)}<span className="ci-rec-mo">/mo</span></span>
                    <span
                      className="ci-rec-effort"
                      style={{ color: EFFORT_COLORS[rec.effort], borderColor: `${EFFORT_COLORS[rec.effort]}40` }}
                    >
                      {rec.effort}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      <style>{`
        .ci-kpi-row {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
          gap: 12px;
          margin-bottom: 20px;
        }
        .ci-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 900px) { .ci-grid { grid-template-columns: 1fr; } }
        .ci-card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 14px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(0,245,255,0.07);
        }
        .ci-card-title {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          flex: 1;
        }
        .ci-rec-count {
          font-size: 10px;
          font-family: var(--font-mono);
          padding: 1px 6px;
          border-radius: 4px;
          background: rgba(0,245,255,0.08);
          color: var(--color-cyan);
          border: 1px solid rgba(0,245,255,0.15);
        }
        .ci-bar-list { display: flex; flex-direction: column; gap: 9px; }
        .ci-bar-row { display: flex; align-items: center; gap: 10px; }
        .ci-bar-label { font-size: 12px; color: var(--text-secondary); width: 90px; flex-shrink: 0; }
        .ci-bar-wrap { flex: 1; height: 5px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden; }
        .ci-bar-fill { height: 100%; border-radius: 3px; transition: width 0.4s ease; opacity: 0.8; }
        .ci-bar-val { font-size: 11px; font-family: var(--font-mono); color: var(--text-muted); width: 70px; text-align: right; }
        .ci-empty { font-size: 12px; color: var(--text-muted); text-align: center; padding: 24px; }

        .ci-rec-list { display: flex; flex-direction: column; gap: 8px; }
        .ci-rec-card {
          padding: 10px 12px;
          background: rgba(0,245,255,0.02);
          border: 1px solid rgba(0,245,255,0.06);
          border-radius: 8px;
          transition: background 0.15s;
        }
        .ci-rec-card:hover { background: rgba(0,245,255,0.05); }
        .ci-rec-top { display: flex; align-items: flex-start; gap: 10px; }
        .ci-rec-info { flex: 1; display: flex; flex-direction: column; gap: 3px; }
        .ci-rec-title { font-size: 12px; font-weight: 600; color: var(--text-primary); }
        .ci-rec-desc { font-size: 11px; color: var(--text-muted); }
        .ci-rec-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
        .ci-rec-savings { font-size: 14px; font-weight: 700; font-family: var(--font-mono); color: #10B981; }
        .ci-rec-mo { font-size: 9px; font-weight: 400; color: var(--text-muted); }
        .ci-rec-effort {
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          padding: 2px 6px;
          border: 1px solid;
          border-radius: 4px;
        }
      `}</style>
    </PageShell>
  );
}
