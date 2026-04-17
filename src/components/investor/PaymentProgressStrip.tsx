// src/components/investor/PaymentProgressStrip.tsx
// T6.7 — 5-stage commitment lifecycle strip. Highlights current stage, shows per-stage
// timestamps when available. Stateless/pure: consumed by FundingStepsView.

import type { Commitment } from '../../hooks/use-commitment';

const STAGES = [
  { key: 'interest',       label: 'Interest',       glyph: '👀', tsField: 'interest_expressed_at' as const },
  { key: 'soft_committed', label: 'Soft commit',    glyph: '🤝', tsField: 'soft_committed_at'     as const },
  { key: 'reserved',       label: 'Payment kicked', glyph: '💳', tsField: 'reserved_at'           as const },
  { key: 'funded',         label: 'Funded',         glyph: '⚡', tsField: 'funded_at'             as const },
  { key: 'distributed',    label: 'Distributed',    glyph: '🌊', tsField: 'distributed_at'        as const },
] as const;

interface Props {
  commitment: Commitment | null;
}

export function PaymentProgressStrip({ commitment }: Props) {
  if (!commitment) return null;

  const idx = STAGES.findIndex((s) => s.key === commitment.status);
  const current = idx >= 0 ? idx : 0;

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 12,
        background: 'var(--surface-elevated)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 4,
        }}
      >
        {STAGES.map((s, i) => {
          const done = i <= current;
          const active = i === current;
          return (
            <div key={s.key} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: done ? 'var(--color-brand-electric)' : 'var(--surface-base)',
                  color: done ? 'var(--surface-base)' : 'var(--text-muted)',
                  display: 'grid',
                  placeItems: 'center',
                  border: active
                    ? '2px solid var(--color-brand-purple)'
                    : '1px solid var(--border-subtle)',
                  flexShrink: 0,
                  fontSize: 13,
                }}
                aria-label={s.label}
                aria-current={active ? 'step' : undefined}
              >
                {s.glyph}
              </div>
              {i < STAGES.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: 2,
                    background: done ? 'var(--color-brand-electric)' : 'var(--border-subtle)',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 6,
          fontSize: 10,
          color: 'var(--text-muted)',
        }}
      >
        {STAGES.map((s, i) => {
          const raw = commitment[s.tsField];
          const timestamp = typeof raw === 'string' ? raw : null;
          return (
            <div key={s.key} style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
              <div
                style={{
                  fontWeight: i === current ? 700 : 400,
                  color: i <= current ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
              >
                {s.label}
              </div>
              {timestamp && (
                <div style={{ fontSize: 9, opacity: 0.7 }}>
                  {new Date(timestamp).toLocaleDateString()}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
