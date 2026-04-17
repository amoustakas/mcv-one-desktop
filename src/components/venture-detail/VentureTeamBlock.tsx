import type { ScopedPersona } from '../../hooks/use-venture-detail';

export function VentureTeamBlock({ personas }: { personas: ScopedPersona[] }) {
  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <div style={{ fontSize: 10, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          Venture team · {personas.length}
        </div>
      </div>
      {personas.length === 0 ? (
        <div style={{ padding: 12, color: 'var(--text-muted)', fontSize: 11, fontStyle: 'italic', border: '1px dashed var(--border-subtle)', borderRadius: 8, textAlign: 'center' }}>
          No venture-scoped personas yet. Operators fall back to global Hit Squad.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {personas.map((p) => {
            const accent = p.accent_color ?? 'var(--color-brand-electric)';
            return (
              <div key={p.id} style={{
                display: 'grid', gridTemplateColumns: '36px 1fr 80px', gap: 10, alignItems: 'center',
                padding: 10, borderRadius: 8,
                border: `1px solid ${accent}30`, background: `color-mix(in srgb, ${accent} 6%, transparent)`,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: accent, color: 'var(--surface-base)',
                  display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700,
                }}>
                  {(p.full_name ?? p.handle).charAt(p.handle?.startsWith('@') ? 1 : 0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontFamily: 'monospace', fontSize: 10, color: accent, fontWeight: 600 }}>{p.handle}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{p.full_name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{p.title} · {p.department.replace(/_/g, ' ')}</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 11, color: accent, fontWeight: 700 }}>
                  {p.xp.toLocaleString()} xp
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
