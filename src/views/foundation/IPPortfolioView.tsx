// IP Portfolio — trademarks / patents / copyrights / trade secrets.
// 4 tabs + budget rollup vs IP Inventory §7.5 $266–351K envelope.
// P0 rows pulse cyan to signal the 30-day filing window.

import { useEffect, useMemo, useState } from 'react';
import { Shield, ShieldCheck, Copyright, Lock, AlertCircle } from 'lucide-react';
import { PageShell, PageHeader, GlassCard } from '../../components/ui';
import { Chip } from './_chip';
import { useFoundationStore, type IPMark } from '../../stores/foundation';

type TabKey = 'trademark' | 'patent' | 'copyright' | 'trade_secret';
const TAB_LABEL: Record<TabKey, string> = {
  trademark: 'Trademarks',
  patent: 'Patents',
  copyright: 'Copyrights',
  trade_secret: 'Trade Secrets',
};
const TAB_ICON: Record<TabKey, React.ReactNode> = {
  trademark: <ShieldCheck size={14} />,
  patent: <Shield size={14} />,
  copyright: <Copyright size={14} />,
  trade_secret: <Lock size={14} />,
};

const TIER_ACCENT: Record<string, string> = {
  P0: '#00F5FF', P1: '#8B5CF6', P2: '#06B6D4', P3: 'var(--text-muted)', DNF: '#6B7280',
  PP0: '#00F5FF', PP1: '#8B5CF6', PP2: '#06B6D4',
};

function usd(value: number): string {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export default function IPPortfolioView() {
  const { ipMarks, budgetRollup, loading, errors, fetchIpMarks, fetchBudgetRollup } = useFoundationStore();
  const [tab, setTab] = useState<TabKey>('trademark');

  useEffect(() => {
    fetchIpMarks();
    fetchBudgetRollup();
  }, [fetchIpMarks, fetchBudgetRollup]);

  const filtered = useMemo(() => ipMarks.filter((m) => m.markKind === tab), [ipMarks, tab]);

  const byTier = useMemo(() => {
    const out: Record<string, IPMark[]> = {};
    for (const m of filtered) (out[m.priorityTier] ??= []).push(m);
    return out;
  }, [filtered]);

  const counts = useMemo(() => ({
    trademark: ipMarks.filter((m) => m.markKind === 'trademark').length,
    patent: ipMarks.filter((m) => m.markKind === 'patent').length,
    copyright: ipMarks.filter((m) => m.markKind === 'copyright').length,
    trade_secret: ipMarks.filter((m) => m.markKind === 'trade_secret').length,
  }), [ipMarks]);

  const headerErr = errors.ipMarks || errors.budgetRollup;

  return (
    <PageShell>
      <PageHeader
        title="IP Portfolio"
        subtitle="Trademarks · patents · copyrights · trade secrets — seeded from MCV IP Inventory v1.1"
        icon={<Shield size={20} />}
      />

      {headerErr && (
        <GlassCard style={{ padding: 12, marginBottom: 12, borderColor: 'var(--error)' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--error)' }}>
            <AlertCircle size={16} /> <span>{headerErr}</span>
          </div>
        </GlassCard>
      )}

      {budgetRollup && <BudgetRollupStrip rollup={budgetRollup} />}

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {(Object.keys(TAB_LABEL) as TabKey[]).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{
              padding: '8px 14px',
              background: tab === k ? 'var(--cyan)' : 'var(--surface-2, rgba(255,255,255,0.04))',
              color: tab === k ? 'var(--bg, #060D14)' : 'var(--text, #E5E7EB)',
              border: `1px solid ${tab === k ? 'var(--cyan)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            {TAB_ICON[k]} {TAB_LABEL[k]} <span style={{ opacity: 0.7 }}>{counts[k]}</span>
          </button>
        ))}
      </div>

      {loading.ipMarks && ipMarks.length === 0 && (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Loading IP portfolio…</div>
      )}

      {!loading.ipMarks && filtered.length === 0 && (
        <GlassCard style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
          No {TAB_LABEL[tab].toLowerCase()} in the portfolio yet.
        </GlassCard>
      )}

      {Object.keys(byTier).sort().map((tier) => (
        <div key={tier} style={{ marginBottom: 20 }}>
          <h3 style={{
            margin: '0 0 8px 0',
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: 1.2,
            color: TIER_ACCENT[tier] ?? 'var(--text-muted)',
          }}>
            {tier} · {byTier[tier].length} {byTier[tier].length === 1 ? 'mark' : 'marks'}
          </h3>
          <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <th style={thStyle}>Mark</th>
                  <th style={thStyle}>Classes / Notes</th>
                  <th style={thStyle}>Jurisdictions</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Source §</th>
                </tr>
              </thead>
              <tbody>
                {byTier[tier].map((m) => (
                  <tr key={m.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {m.markText}
                        {m.isCompound && <Chip tone="info">compound</Chip>}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, color: 'var(--text-muted)', maxWidth: 280 }}>
                      {m.markKind === 'patent' && m.noveltyHook ? (
                        <div style={{ fontSize: 12 }}>{m.noveltyHook.slice(0, 160)}{m.noveltyHook.length > 160 ? '…' : ''}</div>
                      ) : (
                        <>
                          {m.classes.length > 0 && <span>{m.classes.join(', ')}</span>}
                          {m.notes && <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{m.notes}</div>}
                        </>
                      )}
                    </td>
                    <td style={tdStyle}>{m.jurisdictions.join(' / ') || '—'}</td>
                    <td style={tdStyle}>
                      <Chip tone={m.status === 'identified' ? 'muted' : 'success'}>{m.status}</Chip>
                    </td>
                    <td style={{ ...tdStyle, color: 'var(--text-muted)', fontSize: 11 }}>{m.sourceSection ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>
        </div>
      ))}
    </PageShell>
  );
}

function BudgetRollupStrip({ rollup }: { rollup: NonNullable<ReturnType<typeof useFoundationStore.getState>['budgetRollup']> }) {
  const spent = rollup.allTotal;
  const ceiling = rollup.yearOneEnvelopeHigh;
  const pct = ceiling > 0 ? Math.min(100, (spent / ceiling) * 100) : 0;
  return (
    <GlassCard style={{ padding: 16, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, color: 'var(--text-muted)' }}>
          Year-one IP filing budget
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          envelope {usd(rollup.yearOneEnvelopeLow)} – {usd(rollup.yearOneEnvelopeHigh)} · IP Inventory §7.5
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--cyan, #00F5FF)' }}>{usd(spent)}</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{pct.toFixed(1)}% of ceiling</div>
      </div>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--cyan, #00F5FF)', transition: 'width 0.3s' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginTop: 12, fontSize: 12 }}>
        <Tile label="P0" value={usd(rollup.p0Total)} />
        <Tile label="P1" value={usd(rollup.p1Total)} />
        <Tile label="P2" value={usd(rollup.p2Total)} />
        <Tile label="Madrid ext." value={usd(rollup.madridTotal)} />
        <Tile label="Utility patents" value={usd(rollup.utilityTotal)} />
      </div>
    </GlassCard>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      <div style={{ fontWeight: 600, marginTop: 2 }}>{value}</div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: 'left', padding: '10px 12px', fontSize: 11,
  textTransform: 'uppercase', letterSpacing: 1.2, color: 'var(--text-muted)', fontWeight: 600,
};
const tdStyle: React.CSSProperties = { padding: '10px 12px', verticalAlign: 'top' };
