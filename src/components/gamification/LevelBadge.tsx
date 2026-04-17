// src/components/gamification/LevelBadge.tsx
// Marathon #3 T9.5 — level + xp tier badge with color-by-level.

interface Props { level: number; xp: number }

export function LevelBadge({ level, xp }: Props) {
  const tierColor =
    level >= 10 ? '#FBBF24'
    : level >= 5 ? 'var(--color-brand-electric)'
    : level >= 3 ? 'var(--color-brand-purple)'
    : '#94A3B8';
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '4px 8px', borderRadius: 6,
      background: `color-mix(in srgb, ${tierColor} 15%, transparent)`,
      border: `1px solid color-mix(in srgb, ${tierColor} 40%, transparent)`,
      color: tierColor, fontWeight: 700, fontSize: 11,
    }}>
      <span>LVL {level}</span>
      <span style={{ opacity: 0.7, fontSize: 10 }}>· {xp.toLocaleString()} xp</span>
    </div>
  );
}

export default LevelBadge;
