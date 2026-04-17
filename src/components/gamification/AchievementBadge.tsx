// src/components/gamification/AchievementBadge.tsx
// Marathon #3 T9.6 — tiered achievement chip (bronze / silver / gold / diamond / mythic).

import type { Achievement } from '../../hooks/use-persona-xp';

const TIER_COLOR: Record<string, string> = {
  bronze: '#B45309',
  silver: '#94A3B8',
  gold: '#FBBF24',
  diamond: 'var(--color-brand-electric)',
  mythic: '#F472B6',
};

const TIER_GLYPH: Record<string, string> = {
  bronze: '3',
  silver: '2',
  gold: '1',
  diamond: 'D',
  mythic: 'M',
};

export function AchievementBadge({ achievement }: { achievement: Achievement }) {
  const color = TIER_COLOR[achievement.tier] ?? 'var(--text-muted)';
  const glyph = TIER_GLYPH[achievement.tier] ?? '?';
  return (
    <div
      title={`${achievement.achievement_label} · ${achievement.tier} · ${achievement.xp_granted} XP · earned ${new Date(achievement.earned_at).toLocaleDateString()}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px',
        borderRadius: 8,
        border: `1px solid ${color}50`,
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
      }}
    >
      <span
        style={{
          display: 'grid',
          placeItems: 'center',
          width: 26,
          height: 26,
          borderRadius: 6,
          background: color,
          color: 'var(--surface-base)',
          fontWeight: 800,
          fontSize: 12,
        }}
      >
        {glyph}
      </span>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
          {achievement.achievement_label}
        </div>
        <div
          style={{
            fontSize: 10,
            color,
            textTransform: 'uppercase',
            letterSpacing: '.1em',
          }}
        >
          {achievement.tier} · +{achievement.xp_granted} XP
        </div>
      </div>
    </div>
  );
}

export default AchievementBadge;
