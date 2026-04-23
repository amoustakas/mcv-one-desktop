// Tiny inline chip used by the Foundation panels. The shared <Badge/> only
// supports 'default' | 'outline' | 'dot' variants (no success/warning/error/info)
// and doesn't pass a `style` prop, so we render a local <span> with tone-scoped
// CSS-var coloring. This keeps panel code readable without forcing a Badge
// API expansion for Foundation-specific semantics.

import type { ReactNode } from 'react';

export type ChipTone = 'muted' | 'info' | 'success' | 'warning' | 'error';

const TONE_COLOR: Record<ChipTone, { bg: string; text: string; border: string }> = {
  muted:   { bg: 'rgba(255,255,255,0.04)',          text: 'var(--text-muted)',       border: 'rgba(255,255,255,0.08)' },
  info:    { bg: 'rgba(0,245,255,0.10)',            text: 'var(--cyan, #00F5FF)',    border: 'rgba(0,245,255,0.25)' },
  success: { bg: 'rgba(16,185,129,0.12)',           text: 'var(--success, #10B981)', border: 'rgba(16,185,129,0.25)' },
  warning: { bg: 'rgba(245,158,11,0.12)',           text: 'var(--warning, #F59E0B)', border: 'rgba(245,158,11,0.25)' },
  error:   { bg: 'rgba(239,68,68,0.12)',            text: 'var(--error, #EF4444)',   border: 'rgba(239,68,68,0.25)' },
};

export function Chip({ tone = 'muted', children }: { tone?: ChipTone; children: ReactNode }) {
  const c = TONE_COLOR[tone];
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      fontSize: 10,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      borderRadius: 4,
      background: c.bg,
      color: c.text,
      border: `1px solid ${c.border}`,
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
}
