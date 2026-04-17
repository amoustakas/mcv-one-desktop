import type { VentureRound } from '../../hooks/use-venture-detail';

interface Props { rounds: VentureRound[]; raising: VentureRound[] }

export function VentureRoundsPanel({ rounds, raising }: Props) {
  if (rounds.length === 0) {
    return <EmptyBlock label="No rounds yet" />;
  }

  return (
    <section>
      <SectionHeader label="Rounds" count={rounds.length} right={raising.length > 0 ? `${raising.length} open` : undefined} />
      <div style={{ display: 'grid', gap: 8 }}>
        {rounds.map((r) => <RoundRow key={r.id} round={r} />)}
      </div>
    </section>
  );
}

function RoundRow({ round }: { round: VentureRound }) {
  const open = ['open', 'reserved'].includes(round.status);
  const progress = round.target_raise > 0 ? Math.min(100, Math.round((Number(round.total_committed) / Number(round.target_raise)) * 100)) : 0;

  return (
    <div style={{
      padding: 12, borderRadius: 10,
      border: `1px solid ${open ? 'var(--color-brand-electric)40' : 'var(--border-subtle)'}`,
      background: open ? 'color-mix(in srgb, var(--color-brand-electric) 6%, transparent)' : 'var(--surface-base)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: open ? 'var(--color-brand-electric)' : 'var(--text-muted)', fontWeight: 700 }}>
            {round.round_type} · {round.status}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{round.name}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            ${Number(round.total_committed).toLocaleString()}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            of ${Number(round.target_raise).toLocaleString()} · {round.total_investors} investors
          </div>
        </div>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: 'var(--surface-base)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
        <div style={{ width: `${progress}%`, height: '100%', background: 'var(--color-brand-electric)' }} />
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
        Min ${Number(round.minimum_check).toLocaleString()}
        {round.maximum_check && ` · Max $${Number(round.maximum_check).toLocaleString()}`}
        {round.accredited_only && ' · Accredited only'}
        {round.close_date && ` · Closes ${new Date(round.close_date).toLocaleDateString()}`}
      </div>
    </div>
  );
}

function SectionHeader({ label, count, right }: { label: string; count?: number; right?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
      <div style={{ fontSize: 10, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
        {label}{count !== undefined ? ` · ${count}` : ''}
      </div>
      {right && <span style={{ fontSize: 10, color: 'var(--color-brand-electric)', fontWeight: 700 }}>{right}</span>}
    </div>
  );
}

function EmptyBlock({ label }: { label: string }) {
  return <div style={{ padding: 12, color: 'var(--text-muted)', fontSize: 11, fontStyle: 'italic', border: '1px dashed var(--border-subtle)', borderRadius: 8, textAlign: 'center' }}>{label}</div>;
}
