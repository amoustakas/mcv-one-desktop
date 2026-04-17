// src/components/persona/PersonaCard.tsx
// Marathon #2 T5.4 — single persona tile for the Hit Squad grid.
// Renders: accent border tint, avatar initial, handle (monospace), full name,
// title, dimension chip (6D/5D/4D/etc.), department, scope glyph, optional
// crown affiliation.
import type { Persona } from '../../hooks/use-persona-registry';

interface Props {
  persona: Persona;
}

const DIMENSION_COLORS: Record<string, string> = {
  '6D': '#FBBF24', // gold — sovereign
  '5D': 'var(--color-brand-electric)',
  '4D': 'var(--color-brand-purple)',
  '3D': '#6EE7B7',
  '2D': '#94A3B8',
  '1D': '#64748B',
};

export function PersonaCard({ persona: p }: Props) {
  const accent =
    p.accent_color ?? DIMENSION_COLORS[p.dimension ?? '5D'] ?? 'var(--color-brand-electric)';

  const handleStartsAt = p.handle?.startsWith('@') ? 1 : 0;
  const source = p.full_name ?? p.handle ?? '';
  const initial = source.slice(handleStartsAt, handleStartsAt + 1).toUpperCase() || '?';

  const crownLabel =
    p.crown_affiliation === 'mcv-inc-crown'
      ? 'INC'
      : p.crown_affiliation === 'mcv-ltd-crown'
        ? 'LTD'
        : p.crown_affiliation;

  return (
    <article
      style={{
        padding: 14,
        border: `1px solid ${accent}40`,
        borderRadius: 12,
        background: `linear-gradient(180deg, ${accent}10, transparent)`,
        display: 'grid',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: accent,
            color: 'var(--surface-base)',
            display: 'grid',
            placeItems: 'center',
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          {initial}
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: 11,
              color: accent,
              fontWeight: 600,
            }}
          >
            {p.handle}
          </div>
          <div
            style={{
              fontSize: 13,
              color: 'var(--text-primary)',
              fontWeight: 600,
            }}
          >
            {p.full_name}
          </div>
        </div>
        {p.dimension && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '.1em',
              padding: '2px 6px',
              borderRadius: 4,
              background: `${accent}20`,
              color: accent,
            }}
          >
            {p.dimension}
          </span>
        )}
      </div>

      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.title}</div>

      <div
        style={{
          display: 'flex',
          gap: 6,
          fontSize: 10,
          color: 'var(--text-muted)',
          flexWrap: 'wrap',
        }}
      >
        <span>{p.department.replace(/_/g, ' ')}</span>
        <span>·</span>
        <span
          title={
            p.scope_kind === 'venture'
              ? `Venture: ${p.scope_value}`
              : 'Global scope'
          }
        >
          {p.scope_kind === 'venture' ? `🏰 ${p.scope_value}` : '🌐 global'}
        </span>
        {p.crown_affiliation && (
          <>
            <span>·</span>
            <span>👑 {crownLabel}</span>
          </>
        )}
      </div>

      {p.persona_bio && (
        <div
          style={{
            fontSize: 11,
            color: 'var(--text-primary)',
            lineHeight: 1.5,
            opacity: 0.85,
          }}
        >
          {p.persona_bio.length > 120
            ? `${p.persona_bio.slice(0, 120)}…`
            : p.persona_bio}
        </div>
      )}
    </article>
  );
}

export default PersonaCard;
