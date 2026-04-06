// @ts-nocheck
import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { slideInRight, fadeInUp, staggerContainer } from '../../lib/animations';
import { GlassCard, Badge } from '../ui';
import PersonalityBars from './PersonalityBars';
import EmotionalIndicator from './EmotionalIndicator';
import AchievementBadges from './AchievementBadges';

/* ─── Types ────────────────────────────────────────────────── */

interface Props {
  agent: any | null;
  personality?: any;
  emotional?: any;
  relationships?: Array<{ agentId: string; codename: string; trustScore: number; dynamic: string }>;
  predictionStats?: { count: number; accuracy: number };
  onClose: () => void;
}

/* ─── Helpers ─────────────────────────────────────────────── */

function tierLabel(tier: number): string {
  switch (tier) {
    case 1: return 'C-Suite';
    case 2: return 'Director';
    case 3: return 'Manager';
    case 4: return 'Team Lead';
    case 5: return 'IC';
    default: return `T${tier}`;
  }
}

function tierColor(tier: number): string {
  switch (tier) {
    case 1: return '#F59E0B';
    case 2: return '#8B5CF6';
    case 3: return '#00F5FF';
    case 4: return '#10B981';
    default: return '#94A3B8';
  }
}

function statusColor(status: string): string {
  switch (status) {
    case 'active': return '#10B981';
    case 'probationary': return '#F59E0B';
    case 'suspended': return '#EF4444';
    case 'archived': return '#6B7280';
    case 'retired': return '#94A3B8';
    default: return '#94A3B8';
  }
}

function accuracyColor(accuracy: number): string {
  if (accuracy >= 80) return 'var(--success, #10B981)';
  if (accuracy >= 60) return 'var(--cyan, #00F5FF)';
  if (accuracy >= 40) return 'var(--warning, #F59E0B)';
  return 'var(--error, #EF4444)';
}

function dynamicLabel(dynamic: string): string {
  const map: Record<string, string> = {
    mentor: 'Mentor',
    peer: 'Peer',
    rival: 'Rival',
    complementary: 'Synergy',
    dependent: 'Dependent',
    neutral: 'Neutral',
  };
  return map[dynamic] ?? dynamic;
}

function dynamicColor(dynamic: string): string {
  switch (dynamic) {
    case 'mentor': return '#8B5CF6';
    case 'peer': return '#00F5FF';
    case 'rival': return '#EF4444';
    case 'complementary': return '#10B981';
    case 'dependent': return '#F59E0B';
    default: return '#94A3B8';
  }
}

/* ─── Component ───────────────────────────────────────────── */

export default function AgentDetailPanel({
  agent,
  personality,
  emotional,
  relationships,
  predictionStats,
  onClose,
}: Props) {
  const topRelationships = useMemo(
    () => (relationships ?? []).slice(0, 3),
    [relationships],
  );

  const domainEntries = useMemo(
    () =>
      personality?.domainMastery
        ? Object.entries(personality.domainMastery as Record<string, number>)
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .slice(0, 6)
        : [],
    [personality],
  );

  return (
    <AnimatePresence>
      {agent && (
        <motion.div
          className="naos-detail-panel-root"
          variants={slideInRight}
          initial="hidden"
          animate="show"
          exit="hidden"
        >
          {/* Close button */}
          <button className="naos-dp-close" onClick={onClose} aria-label="Close detail panel">
            <X size={16} />
          </button>

          <div className="naos-dp-scroll">
            {/* ── Header ── */}
            <div className="naos-dp-header">
              <h2 className="naos-dp-codename">{agent.codename}</h2>
              {agent.fullName && (
                <span className="naos-dp-fullname">{agent.fullName}</span>
              )}
              <span className="naos-dp-title">{agent.title}</span>
              <div className="naos-dp-badges">
                <Badge color={tierColor(agent.tier)} size="sm">
                  {tierLabel(agent.tier)}
                </Badge>
                <Badge color={statusColor(agent.status)} size="sm">
                  {agent.status}
                </Badge>
              </div>
            </div>

            {/* ── Genesis Story ── */}
            {agent.genesisStory && (
              <motion.div className="naos-dp-genesis" variants={fadeInUp}>
                <span className="naos-dp-section-label">Genesis</span>
                <p className="naos-dp-genesis-text">{agent.genesisStory}</p>
              </motion.div>
            )}

            {/* ── Personality ── */}
            {personality && (
              <motion.div className="naos-dp-section" variants={fadeInUp}>
                <span className="naos-dp-section-label">Personality</span>
                <PersonalityBars personality={personality} />
              </motion.div>
            )}

            {/* ── Emotional State ── */}
            {emotional && (
              <motion.div className="naos-dp-section" variants={fadeInUp}>
                <span className="naos-dp-section-label">Emotional State</span>
                <EmotionalIndicator emotional={emotional} />
              </motion.div>
            )}

            {/* ── Achievements ── */}
            {agent.achievements?.length > 0 && (
              <motion.div className="naos-dp-section" variants={fadeInUp}>
                <span className="naos-dp-section-label">Achievements</span>
                <AchievementBadges achievements={agent.achievements} />
              </motion.div>
            )}

            {/* ── Domain Mastery ── */}
            {domainEntries.length > 0 && (
              <motion.div className="naos-dp-section" variants={fadeInUp}>
                <span className="naos-dp-section-label">Domain Mastery</span>
                <motion.div
                  className="naos-dp-domains"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                >
                  {domainEntries.map(([skill, level]) => {
                    const pct = level as number;
                    return (
                      <motion.div className="naos-dp-domain-row" key={skill} variants={fadeInUp}>
                        <span className="naos-dp-domain-label">{skill}</span>
                        <div className="naos-dp-domain-track">
                          <motion.div
                            className="naos-dp-domain-fill"
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                          />
                        </div>
                        <span className="naos-dp-domain-value">{pct}</span>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </motion.div>
            )}

            {/* ── Prediction Stats ── */}
            {predictionStats && (
              <motion.div className="naos-dp-section" variants={fadeInUp}>
                <span className="naos-dp-section-label">Predictions</span>
                <div className="naos-dp-predictions">
                  <div className="naos-dp-pred-stat">
                    <span className="naos-dp-pred-value">{predictionStats.count}</span>
                    <span className="naos-dp-pred-label">Total</span>
                  </div>
                  <div className="naos-dp-pred-divider" />
                  <div className="naos-dp-pred-stat">
                    <span
                      className="naos-dp-pred-value"
                      style={{ color: accuracyColor(predictionStats.accuracy) }}
                    >
                      {predictionStats.accuracy}%
                    </span>
                    <span className="naos-dp-pred-label">Accuracy</span>
                  </div>
                  <div className="naos-dp-pred-bar-track">
                    <motion.div
                      className="naos-dp-pred-bar-fill"
                      style={{ backgroundColor: accuracyColor(predictionStats.accuracy) }}
                      initial={{ width: 0 }}
                      animate={{ width: `${predictionStats.accuracy}%` }}
                      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Relationships ── */}
            {topRelationships.length > 0 && (
              <motion.div className="naos-dp-section" variants={fadeInUp}>
                <span className="naos-dp-section-label">Relationships</span>
                <div className="naos-dp-relationships">
                  {topRelationships.map((rel) => (
                    <div className="naos-dp-rel-row" key={rel.agentId}>
                      <div className="naos-dp-rel-info">
                        <span className="naos-dp-rel-codename">{rel.codename}</span>
                        <span
                          className="naos-dp-rel-dynamic"
                          style={{ color: dynamicColor(rel.dynamic) }}
                        >
                          {dynamicLabel(rel.dynamic)}
                        </span>
                      </div>
                      <div className="naos-dp-rel-trust-track">
                        <motion.div
                          className="naos-dp-rel-trust-fill"
                          initial={{ width: 0 }}
                          animate={{ width: `${rel.trustScore}%` }}
                          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                        />
                      </div>
                      <span className="naos-dp-rel-trust-val">{rel.trustScore}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Actions ── */}
            <motion.div className="naos-dp-actions" variants={fadeInUp}>
              <button className="naos-dp-action naos-dp-action--primary">Assign Task</button>
              <button className="naos-dp-action naos-dp-action--secondary">Adjust Autonomy</button>
              <button className="naos-dp-action naos-dp-action--ghost">View History</button>
            </motion.div>
          </div>

          <style>{detailPanelStyles}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Styles ──────────────────────────────────────────────── */

const detailPanelStyles = `
  .naos-detail-panel-root {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 380px;
    max-width: 100vw;
    z-index: 100;
    display: flex;
    flex-direction: column;
    background: rgba(6, 13, 20, 0.92);
    backdrop-filter: blur(24px) saturate(1.6);
    -webkit-backdrop-filter: blur(24px) saturate(1.6);
    border-left: 1px solid rgba(255, 255, 255, 0.06);
    box-shadow: -8px 0 40px rgba(0, 0, 0, 0.5);
    overflow: hidden;
  }

  .naos-dp-close {
    position: absolute;
    top: 14px;
    right: 14px;
    z-index: 2;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.04);
    color: var(--text-secondary, #94A3B8);
    cursor: pointer;
    transition: all 0.2s;
  }
  .naos-dp-close:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-primary, #E2E8F0);
    border-color: rgba(255, 255, 255, 0.15);
  }

  .naos-dp-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 24px 20px 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .naos-dp-scroll::-webkit-scrollbar { width: 4px; }
  .naos-dp-scroll::-webkit-scrollbar-track { background: transparent; }
  .naos-dp-scroll::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.08);
    border-radius: 2px;
  }

  /* ── Header ── */
  .naos-dp-header {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }
  .naos-dp-codename {
    font-size: 1.4rem;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    background: linear-gradient(135deg, var(--cyan, #00F5FF), var(--purple, #8B5CF6));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0;
    line-height: 1.2;
  }
  .naos-dp-fullname {
    font-size: 0.82rem;
    color: var(--text-secondary, #94A3B8);
  }
  .naos-dp-title {
    font-size: 0.75rem;
    color: var(--text-muted, #64748B);
    margin-top: 2px;
  }
  .naos-dp-badges {
    display: flex;
    gap: 6px;
    margin-top: 8px;
  }

  /* ── Genesis ── */
  .naos-dp-genesis {
    padding: 12px;
    border-radius: 10px;
    border: 1px solid rgba(139, 92, 246, 0.12);
    background: rgba(139, 92, 246, 0.04);
  }
  .naos-dp-genesis-text {
    font-size: 0.78rem;
    color: var(--text-secondary, #94A3B8);
    line-height: 1.6;
    font-style: italic;
    margin: 6px 0 0;
  }

  /* ── Section ── */
  .naos-dp-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .naos-dp-section-label {
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted, #64748B);
  }

  /* ── Domain Mastery ── */
  .naos-dp-domains {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .naos-dp-domain-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .naos-dp-domain-label {
    flex: 0 0 90px;
    font-size: 0.72rem;
    color: var(--text-secondary, #94A3B8);
    text-transform: capitalize;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .naos-dp-domain-track {
    flex: 1;
    height: 6px;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 3px;
    overflow: hidden;
  }
  .naos-dp-domain-fill {
    height: 100%;
    border-radius: 3px;
    background: linear-gradient(90deg, var(--cyan, #00F5FF), var(--purple, #8B5CF6));
  }
  .naos-dp-domain-value {
    flex: 0 0 28px;
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--text-primary, #E2E8F0);
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  /* ── Predictions ── */
  .naos-dp-predictions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
  }
  .naos-dp-pred-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .naos-dp-pred-value {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text-primary, #E2E8F0);
    font-variant-numeric: tabular-nums;
  }
  .naos-dp-pred-label {
    font-size: 0.6rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted, #64748B);
  }
  .naos-dp-pred-divider {
    width: 1px;
    height: 28px;
    background: rgba(255, 255, 255, 0.08);
  }
  .naos-dp-pred-bar-track {
    flex: 1;
    min-width: 80px;
    height: 6px;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 3px;
    overflow: hidden;
  }
  .naos-dp-pred-bar-fill {
    height: 100%;
    border-radius: 3px;
  }

  /* ── Relationships ── */
  .naos-dp-relationships {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .naos-dp-rel-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
  }
  .naos-dp-rel-info {
    display: flex;
    flex-direction: column;
    flex: 0 0 80px;
  }
  .naos-dp-rel-codename {
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--text-primary, #E2E8F0);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .naos-dp-rel-dynamic {
    font-size: 0.62rem;
    font-weight: 500;
    text-transform: capitalize;
  }
  .naos-dp-rel-trust-track {
    flex: 1;
    height: 5px;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 3px;
    overflow: hidden;
  }
  .naos-dp-rel-trust-fill {
    height: 100%;
    border-radius: 3px;
    background: linear-gradient(90deg, var(--cyan, #00F5FF), var(--purple, #8B5CF6));
  }
  .naos-dp-rel-trust-val {
    flex: 0 0 24px;
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--text-primary, #E2E8F0);
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  /* ── Actions ── */
  .naos-dp-actions {
    display: flex;
    gap: 8px;
    padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    margin-top: auto;
  }
  .naos-dp-action {
    flex: 1;
    padding: 8px 0;
    border-radius: 8px;
    font-size: 0.72rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid transparent;
    text-align: center;
  }
  .naos-dp-action--primary {
    background: linear-gradient(135deg, rgba(0, 245, 255, 0.15), rgba(139, 92, 246, 0.15));
    color: var(--cyan, #00F5FF);
    border-color: rgba(0, 245, 255, 0.2);
  }
  .naos-dp-action--primary:hover {
    background: linear-gradient(135deg, rgba(0, 245, 255, 0.25), rgba(139, 92, 246, 0.25));
    border-color: rgba(0, 245, 255, 0.4);
    box-shadow: 0 0 16px rgba(0, 245, 255, 0.1);
  }
  .naos-dp-action--secondary {
    background: rgba(139, 92, 246, 0.1);
    color: var(--purple, #8B5CF6);
    border-color: rgba(139, 92, 246, 0.15);
  }
  .naos-dp-action--secondary:hover {
    background: rgba(139, 92, 246, 0.2);
    border-color: rgba(139, 92, 246, 0.35);
  }
  .naos-dp-action--ghost {
    background: transparent;
    color: var(--text-secondary, #94A3B8);
    border-color: rgba(255, 255, 255, 0.06);
  }
  .naos-dp-action--ghost:hover {
    background: rgba(255, 255, 255, 0.04);
    color: var(--text-primary, #E2E8F0);
    border-color: rgba(255, 255, 255, 0.12);
  }

  /* ── Responsive ── */
  @media (max-width: 480px) {
    .naos-detail-panel-root {
      width: 100vw;
    }
  }
`;
