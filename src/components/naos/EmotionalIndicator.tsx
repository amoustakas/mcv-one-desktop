import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { fadeInUp } from '../../lib/animations';
import type { EmotionalState } from '../../lib/naos/types';

/* ─── Types ────────────────────────────────────────────────── */

interface EmotionalIndicatorProps {
  emotional: EmotionalState;
  compact?: boolean;
}

/* ─── Helpers ─────────────────────────────────────────────── */

interface MoodConfig {
  emoji: string;
  label: string;
  color: string;
}

function deriveMood(e: EmotionalState): MoodConfig {
  // Determine dominant emotion by finding the highest value
  const scores: [string, number][] = [
    ['momentum', e.momentum],
    ['excitement', e.excitement],
    ['caution', e.caution],
    ['frustration', e.frustration],
    ['confidence', e.confidence],
  ];
  scores.sort((a, b) => b[1] - a[1]);
  const dominant = scores[0][0];

  switch (dominant) {
    case 'momentum':
      return { emoji: '\u26A1', label: 'On Fire', color: 'var(--cyan, #00F5FF)' };
    case 'excitement':
      return { emoji: '\uD83D\uDD25', label: 'Excited', color: 'var(--success, #10B981)' };
    case 'caution':
      return { emoji: '\uD83D\uDD0D', label: 'Cautious', color: 'var(--warning, #F59E0B)' };
    case 'frustration':
      return { emoji: '\uD83D\uDE24', label: 'Frustrated', color: 'var(--error, #EF4444)' };
    case 'confidence':
      return { emoji: '\uD83D\uDCAA', label: 'Confident', color: 'var(--purple, #8B5CF6)' };
    default:
      return { emoji: '\u26A1', label: 'Steady', color: 'var(--cyan, #00F5FF)' };
  }
}

/** Overall sentiment: positive / neutral / negative */
function sentimentColor(e: EmotionalState): string {
  const positive = (e.confidence + e.engagement + e.excitement + e.momentum) / 4;
  const negative = (e.frustration + e.caution) / 2;
  if (positive - negative > 20) return 'var(--success, #10B981)';
  if (negative - positive > 20) return 'var(--error, #EF4444)';
  return 'var(--warning, #F59E0B)';
}

/* ─── Component ───────────────────────────────────────────── */

export default function EmotionalIndicator({ emotional, compact = false }: EmotionalIndicatorProps) {
  const mood = useMemo(() => deriveMood(emotional), [emotional]);
  const tint = useMemo(() => sentimentColor(emotional), [emotional]);

  if (compact) {
    return (
      <>
        <motion.div
          className="naos-emotion-compact"
          variants={fadeInUp}
          initial="hidden"
          animate="show"
          style={{ borderColor: `${tint}30` }}
        >
          <span className="naos-emotion-emoji">{mood.emoji}</span>
          <div className="naos-emotion-momentum-mini">
            <div
              className="naos-emotion-momentum-fill"
              style={{ width: `${emotional.momentum}%`, backgroundColor: mood.color }}
            />
          </div>
        </motion.div>
        <style>{emotionStyles}</style>
      </>
    );
  }

  return (
    <>
      <motion.div
        className="naos-emotion-full"
        variants={fadeInUp}
        initial="hidden"
        animate="show"
        style={{ borderColor: `${tint}30` }}
      >
        <div className="naos-emotion-header">
          <span className="naos-emotion-emoji-lg">{mood.emoji}</span>
          <div className="naos-emotion-meta">
            <span className="naos-emotion-label" style={{ color: mood.color }}>
              {mood.label}
            </span>
            <span className="naos-emotion-sublabel">
              Momentum {emotional.momentum}%
            </span>
          </div>
        </div>

        <div className="naos-emotion-momentum-bar">
          <motion.div
            className="naos-emotion-momentum-fill"
            style={{ backgroundColor: mood.color }}
            initial={{ width: 0 }}
            animate={{ width: `${emotional.momentum}%` }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>

        <div className="naos-emotion-metrics">
          {([
            ['Confidence', emotional.confidence],
            ['Engagement', emotional.engagement],
            ['Excitement', emotional.excitement],
            ['Caution', emotional.caution],
            ['Frustration', emotional.frustration],
          ] as const).map(([label, val]) => (
            <div className="naos-emotion-metric" key={label}>
              <span className="naos-emotion-metric-label">{label}</span>
              <span className="naos-emotion-metric-val">{val}</span>
            </div>
          ))}
        </div>
      </motion.div>
      <style>{emotionStyles}</style>
    </>
  );
}

/* ─── Styles ──────────────────────────────────────────────── */

const emotionStyles = `
  .naos-emotion-compact {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 8px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.06);
    background: var(--bg-card, rgba(255,255,255,0.04));
  }
  .naos-emotion-emoji {
    font-size: 0.85rem;
    line-height: 1;
  }
  .naos-emotion-momentum-mini {
    width: 40px;
    height: 4px;
    background: rgba(255,255,255,0.06);
    border-radius: 2px;
    overflow: hidden;
  }
  .naos-emotion-momentum-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.4s ease;
  }

  .naos-emotion-full {
    padding: 12px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.06);
    background: var(--bg-card, rgba(255,255,255,0.04));
  }
  .naos-emotion-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }
  .naos-emotion-emoji-lg {
    font-size: 1.5rem;
    line-height: 1;
  }
  .naos-emotion-meta {
    display: flex;
    flex-direction: column;
  }
  .naos-emotion-label {
    font-size: 0.85rem;
    font-weight: 600;
  }
  .naos-emotion-sublabel {
    font-size: 0.7rem;
    color: var(--text-secondary, #94A3B8);
  }
  .naos-emotion-momentum-bar {
    width: 100%;
    height: 6px;
    background: rgba(255,255,255,0.06);
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 10px;
  }
  .naos-emotion-metrics {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 14px;
  }
  .naos-emotion-metric {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .naos-emotion-metric-label {
    font-size: 0.6rem;
    color: var(--text-secondary, #94A3B8);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .naos-emotion-metric-val {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-primary, #E2E8F0);
    font-variant-numeric: tabular-nums;
  }
`;
