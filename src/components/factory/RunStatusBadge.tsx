// src/components/factory/RunStatusBadge.tsx
import type { FactoryRunStatus } from '../../lib/factory-client';

const STATUS_COLOR: Record<FactoryRunStatus, string> = {
  queued: 'var(--text-muted)',
  running: 'var(--color-brand-electric)',
  succeeded: '#6EE7B7',
  failed: '#FB7185',
  cancelled: '#94A3B8',
};

export function RunStatusBadge({ status }: { status: FactoryRunStatus }) {
  const c = STATUS_COLOR[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 4,
      fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase',
      background: `color-mix(in srgb, ${c} 15%, transparent)`,
      color: c,
      border: `1px solid color-mix(in srgb, ${c} 40%, transparent)`,
    }}>
      {status === 'running' && <span style={{
        width: 6, height: 6, borderRadius: '50%', background: c,
        animation: 'factory-pulse 1.2s ease-in-out infinite',
      }} />}
      {status}
    </span>
  );
}
