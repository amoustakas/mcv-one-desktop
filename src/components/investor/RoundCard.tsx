// src/components/investor/RoundCard.tsx
import type { RoundSummary } from '../../hooks/use-investor-flow';

interface Props {
  round: RoundSummary;
  onInvest: (round: RoundSummary) => void;
}

export function RoundCard({ round, onInvest }: Props) {
  const accent = round.brand?.color_primary ?? 'var(--color-brand-electric)';
  const closesIn = round.close_date ? daysUntil(round.close_date) : null;

  return (
    <article style={{
      padding: 20,
      border: `1px solid ${accent}40`,
      borderRadius: 14,
      background: `linear-gradient(180deg, ${accent}10, transparent)`,
      display: 'grid', gap: 14,
    }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '.15em', textTransform: 'uppercase', color: accent, fontWeight: 700 }}>
            {round.venture?.name ?? round.venture_id} · {round.round_type}
          </div>
          <h3 style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{round.name}</h3>
        </div>
        {round.accredited_only && (
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase',
            padding: '3px 8px', borderRadius: 4, background: '#FBBF2420', color: '#FBBF24',
          }}>🔒 accredited</span>
        )}
      </header>

      {/* Raise progress */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: accent }}>${Number(round.total_committed).toLocaleString()}</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            of ${Number(round.target_raise).toLocaleString()} {round.currency}
          </span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: 'var(--surface-base)', overflow: 'hidden' }}>
          <div style={{
            width: `${Math.min(100, round.progress_pct)}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${accent}, ${round.brand?.color_accent ?? accent})`,
            transition: 'width 0.4s ease',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: 'var(--text-muted)' }}>
          <span>{round.progress_pct}% committed</span>
          <span>{round.total_investors} investor{round.total_investors === 1 ? '' : 's'}</span>
        </div>
      </div>

      {/* Terms strip */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11, color: 'var(--text-primary)' }}>
        <Term label="Min check" value={`$${Number(round.minimum_check).toLocaleString()}`} />
        {round.maximum_check && <Term label="Max check" value={`$${Number(round.maximum_check).toLocaleString()}`} />}
        {round.pre_money_valuation && <Term label="Pre-money" value={`$${(Number(round.pre_money_valuation) / 1_000_000).toFixed(1)}M`} />}
        {closesIn !== null && <Term label="Closes in" value={closesIn > 0 ? `${closesIn}d` : 'closed'} accent={closesIn < 14 ? '#FB7185' : undefined} />}
      </div>

      {/* CTA */}
      <button
        onClick={() => onInvest(round)}
        style={{
          padding: '10px 16px', borderRadius: 8,
          background: accent, color: 'var(--surface-base)',
          border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13,
        }}
      >
        ⚡ Reserve allocation
      </button>
    </article>
  );
}

const Term = ({ label, value, accent }: { label: string; value: string; accent?: string }) => (
  <div>
    <div style={{ fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{label}</div>
    <div style={{ color: accent ?? 'var(--text-primary)', fontWeight: 600 }}>{value}</div>
  </div>
);

function daysUntil(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}
