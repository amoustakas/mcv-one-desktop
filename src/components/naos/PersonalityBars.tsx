import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, fadeInUp } from '../../lib/animations';
import type { PersonalityMatrix } from '../../lib/naos/types';

/* ─── Types ────────────────────────────────────────────────── */

interface PersonalityBarsProps {
  personality: PersonalityMatrix;
  compact?: boolean;
}

/* ─── Trait Config ─────────────────────────────────────────── */

interface TraitDef {
  key: keyof PersonalityMatrix;
  label: string;
  compact?: boolean;
}

const ALL_TRAITS: TraitDef[] = [
  { key: 'riskTolerance', label: 'Risk Tolerance', compact: true },
  { key: 'analyticalBias', label: 'Analytical Bias', compact: true },
  { key: 'creativityIndex', label: 'Creativity', compact: true },
  { key: 'urgencyBias', label: 'Urgency Bias' },
  { key: 'collaborationStyle', label: 'Collaboration', compact: true },
  { key: 'formalityLevel', label: 'Formality' },
  { key: 'verbosity', label: 'Verbosity' },
  { key: 'humorIndex', label: 'Humor' },
  { key: 'assertiveness', label: 'Assertiveness', compact: true },
  { key: 'empathyScore', label: 'Empathy' },
];

/** Returns a color based on value: low=blue, mid=cyan, high=amber/red */
function barColor(value: number): string {
  if (value <= 30) return 'var(--info, #3B82F6)';
  if (value <= 60) return 'var(--cyan, #00F5FF)';
  if (value <= 80) return 'var(--warning, #F59E0B)';
  return 'var(--error, #EF4444)';
}

/* ─── Component ───────────────────────────────────────────── */

export default function PersonalityBars({ personality, compact = false }: PersonalityBarsProps) {
  const traits = useMemo(
    () => (compact ? ALL_TRAITS.filter((t) => t.compact) : ALL_TRAITS),
    [compact],
  );

  return (
    <>
      <motion.div
        className="naos-personality-bars"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        {traits.map((trait) => {
          const value = personality[trait.key];
          if (typeof value !== 'number') return null;
          const color = barColor(value);
          return (
            <motion.div className="naos-pb-row" key={trait.key} variants={fadeInUp}>
              <span className="naos-pb-label">{trait.label}</span>
              <div className="naos-pb-track">
                <motion.div
                  className="naos-pb-fill"
                  style={{ backgroundColor: color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${value}%` }}
                  transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                />
              </div>
              <span className="naos-pb-value" style={{ color }}>{value}</span>
            </motion.div>
          );
        })}
      </motion.div>

      <style>{`
        .naos-personality-bars {
          display: flex;
          flex-direction: column;
          gap: 6px;
          width: 100%;
        }
        .naos-pb-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .naos-pb-label {
          flex: 0 0 110px;
          font-size: 0.75rem;
          color: var(--text-secondary, #94A3B8);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .naos-pb-track {
          flex: 1;
          height: 6px;
          background: var(--bg-card, rgba(255, 255, 255, 0.04));
          border-radius: 3px;
          overflow: hidden;
        }
        .naos-pb-fill {
          height: 100%;
          border-radius: 3px;
        }
        .naos-pb-value {
          flex: 0 0 28px;
          font-size: 0.7rem;
          font-weight: 600;
          text-align: right;
          font-variant-numeric: tabular-nums;
        }
      `}</style>
    </>
  );
}
