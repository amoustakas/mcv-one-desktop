// src/components/distributions/DistributionLegsTable.tsx
import type { DistributionLeg } from '../../hooks/use-distributions';

const LEG_STATUS_COLOR: Record<string, string> = {
  pending: 'var(--color-brand-electric)',
  sent: '#FBBF24',
  settled: '#6EE7B7',
  failed: '#FB7185',
  no_account: '#FB923C',
  held_compliance: '#A78BFA',
  cancelled: 'var(--text-muted)',
};

export function DistributionLegsTable({ legs }: { legs: DistributionLeg[] }) {
  if (legs.length === 0) return <Empty label="No legs yet. Execute the distribution to generate legs from the active royalty graph." />;
  return (
    <div style={{ display: 'grid', gap: 4 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '100px 140px 1fr 100px 100px', gap: 10, padding: '0 10px', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
        <span>Status</span><span>Recipient type</span><span>Recipient</span><span>Amount</span><span>Currency</span>
      </div>
      {legs.map((l) => {
        const c = LEG_STATUS_COLOR[l.status] ?? 'var(--text-muted)';
        return (
          <div key={l.id} style={{
            display: 'grid', gridTemplateColumns: '100px 140px 1fr 100px 100px', gap: 10, alignItems: 'center',
            padding: '6px 10px', borderRadius: 6,
            background: 'var(--surface-base)', borderLeft: `3px solid ${c}`, fontSize: 11,
          }}>
            <span style={{ color: c, fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '.1em' }}>{l.status}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{l.recipient_type}</span>
            <span style={{ color: 'var(--text-primary)', fontSize: 10, fontFamily: 'monospace' }}>
              {l.recipient_id.length > 32 ? `${l.recipient_id.slice(0, 32)}…` : l.recipient_id}
            </span>
            <span style={{ textAlign: 'right', fontWeight: 600 }}>{Number(l.amount).toLocaleString()}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{l.currency}</span>
          </div>
        );
      })}
    </div>
  );
}

const Empty = ({ label }: { label: string }) => (
  <div style={{ padding: 14, color: 'var(--text-muted)', fontSize: 11, fontStyle: 'italic', border: '1px dashed var(--border-subtle)', borderRadius: 8, textAlign: 'center' }}>{label}</div>
);
