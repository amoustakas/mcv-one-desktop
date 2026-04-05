import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, fadeInUp } from '../../lib/animations';

/* ─── Types ────────────────────────────────────────────────── */

interface AchievementBadgesProps {
  achievements: string[];
  compact?: boolean;
}

/* ─── Achievement Definitions ─────────────────────────────── */

interface AchievementDef {
  emoji: string;
  name: string;
}

const ACHIEVEMENT_MAP: Record<string, AchievementDef> = {
  first_blood:    { emoji: '\uD83C\uDFC6', name: 'First Blood' },
  streak_master:  { emoji: '\u26A1',       name: 'Streak Master' },
  cross_venture:  { emoji: '\uD83C\uDF0D', name: 'Cross-Venture' },
  oracle:         { emoji: '\uD83D\uDD2E', name: 'Oracle' },
  mentor:         { emoji: '\uD83C\uDF93', name: 'Mentor' },
  architect:      { emoji: '\uD83C\uDFD7\uFE0F', name: 'Architect' },
  clutch:         { emoji: '\uD83D\uDD25', name: 'Clutch' },
  legendary:      { emoji: '\uD83D\uDC8E', name: 'Legendary' },
  visionary:      { emoji: '\uD83D\uDC41\uFE0F', name: 'Visionary' },
  diplomat:       { emoji: '\uD83E\uDD1D', name: 'Diplomat' },
};

/* ─── Component ───────────────────────────────────────────── */

export default function AchievementBadges({ achievements, compact = false }: AchievementBadgesProps) {
  const resolved = useMemo(
    () =>
      achievements
        .map((id) => ({ id, ...(ACHIEVEMENT_MAP[id] ?? { emoji: '\u2B50', name: id }) }))
        .slice(0, compact ? 4 : undefined),
    [achievements, compact],
  );

  if (resolved.length === 0) return null;

  return (
    <>
      <motion.div
        className="naos-achievements"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        {resolved.map((a) => (
          <motion.span
            key={a.id}
            className="naos-achievement-pill"
            variants={fadeInUp}
            title={a.name}
          >
            <span className="naos-achievement-emoji">{a.emoji}</span>
            {!compact && <span className="naos-achievement-name">{a.name}</span>}
          </motion.span>
        ))}
      </motion.div>

      <style>{`
        .naos-achievements {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .naos-achievement-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(8px);
          cursor: default;
          transition: border-color 0.2s, background 0.2s;
        }
        .naos-achievement-pill:hover {
          border-color: var(--cyan, #00F5FF)40;
          background: rgba(255, 255, 255, 0.08);
        }
        .naos-achievement-emoji {
          font-size: 0.8rem;
          line-height: 1;
        }
        .naos-achievement-name {
          font-size: 0.7rem;
          color: var(--text-secondary, #94A3B8);
          white-space: nowrap;
        }
      `}</style>
    </>
  );
}
