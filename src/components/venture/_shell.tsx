import type { ReactNode } from 'react';

export const StackBlock = ({ label, children }: { label: string; children: ReactNode }) => (
  <div style={{ padding: 10, border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.1em' }}>{label}</div>
    <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-primary)', lineHeight: 1.5 }}>{children}</div>
  </div>
);

export const Empty = () => <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 11 }}>—</span>;
export const lineStyle = { marginTop: 2 } as const;
