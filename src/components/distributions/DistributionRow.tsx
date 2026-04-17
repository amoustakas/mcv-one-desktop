// src/components/distributions/DistributionRow.tsx
import type { Distribution } from '../../hooks/use-distributions';

const STATUS_COLOR: Record<string, string> = {
  scheduled: 'var(--color-brand-electric)',
  processing: '#FBBF24',
  partial: '#FB923C',
  completed: '#6EE7B7',
  failed: '#FB7185',
  cancelled: 'var(--text-muted)',
};

interface Props { distribution: Distribution; onClick?: (d: Distribution) => void }

export function DistributionRow({ distribution: d, onClick }: Props) {
  const c = STATUS_COLOR[d.status] ?? 'var(--text-muted)';
  return (
    <button onClick={() => onClick?.(d)}
      style={{
        display: 'grid', gridTemplateColumns: '90px 1fr 140px 130px 110px', gap: 12, alignItems: 'center',
        width: '100%', padding: '10px 14px', borderRadius: 10,
        border: `1px solid ${c}40`,
        background: `color-mix(in srgb, ${c} 8%, transparent)`,
        color: 'var(--text-primary)', cursor: onClick ? 'pointer' : 'default', textAlign: 'left',
      }}>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: c }}>{d.status}</span>
      <div>
        <div style={{ fontSize: 12, color: 'var(--text-primary)' }}>
          <b>{d.distribution_type}</b> · {d.venture_id}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
          {d.scheduled_for && `scheduled ${new Date(d.scheduled_for).toLocaleDateString()}`}
          {d.completed_at && ` · completed ${new Date(d.completed_at).toLocaleDateString()}`}
        </div>
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'right' }}>
        {d.currency} {Number(d.total_amount).toLocaleString()}
      </span>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>
        {d.total_recipients} recipient{d.total_recipients === 1 ? '' : 's'}
      </span>
      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
        {new Date(d.created_at).toLocaleDateString()}
      </span>
    </button>
  );
}
