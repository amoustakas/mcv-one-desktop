// src/components/gamification/LadderRow.tsx
// Marathon #3 T9.5 — single ladder entry with podium styling + dimension chip.

import type { LadderEntry } from '../../hooks/use-ladder';
import { LevelBadge } from './LevelBadge';

interface Props { entry: LadderEntry; onClick?: (e: LadderEntry) => void }

const DIMENSION_COLOR: Record<string, string> = {
  '6D': '#FBBF24',
  '5D': 'var(--color-brand-electric)',
  '4D': 'var(--color-brand-purple)',
  '3D': '#6EE7B7',
  '2D': '#94A3B8',
  '1D': '#64748B',
};

export function LadderRow({ entry, onClick }: Props) {
  const accent = entry.accent_color ?? DIMENSION_COLOR[entry.dimension ?? '5D'] ?? 'var(--color-brand-electric)';
  const topThree = entry.rank <= 3;
  const podium = entry.rank === 1 ? 'GOLD' : entry.rank === 2 ? 'SILVER' : entry.rank === 3 ? 'BRONZE' : null;

  return (
    <button
      onClick={() => onClick?.(entry)}
      style={{
        display: 'grid', gridTemplateColumns: '50px 44px 1fr 110px 110px', gap: 12, alignItems: 'center',
        width: '100%', padding: '12px 16px',
        border: topThree ? `1px solid ${accent}50` : '1px solid var(--border-subtle)',
        borderRadius: 10,
        background: topThree ? `linear-gradient(90deg, ${accent}10, transparent)` : 'var(--surface-base)',
        color: 'var(--text-primary)', cursor: onClick ? 'pointer' : 'default', textAlign: 'left',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 18, fontWeight: 800, color: topThree ? accent : 'var(--text-muted)' }}>#{entry.rank}</span>
        {podium && <span style={{ fontSize: 8, letterSpacing: '.15em', fontWeight: 700, color: accent }}>{podium}</span>}
      </div>

      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: accent, color: 'var(--surface-base)',
        display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 14,
      }}>
        {(entry.full_name ?? entry.handle).charAt(entry.handle?.startsWith('@') ? 1 : 0).toUpperCase()}
      </div>

      <div>
        <div style={{ fontFamily: 'monospace', fontSize: 10, color: accent, fontWeight: 600 }}>{entry.handle}</div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{entry.full_name}</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
          {entry.title} · {entry.department.replace(/_/g, ' ')}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {entry.dimension && (
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '.1em',
            padding: '2px 6px', borderRadius: 4,
            background: `${accent}20`, color: accent,
          }}>{entry.dimension}</span>
        )}
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
          {entry.scope_kind === 'venture' ? entry.scope_value : 'global'}
        </span>
      </div>

      <div style={{ textAlign: 'right' }}>
        <LevelBadge level={entry.level} xp={entry.xp} />
      </div>
    </button>
  );
}

export default LadderRow;
