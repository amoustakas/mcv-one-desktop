import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { fadeInUp, hoverLift, tapScale } from '../../lib/animations';
import { GlassCard, Badge } from '../ui';
import EmotionalIndicator from './EmotionalIndicator';
import AchievementBadges from './AchievementBadges';
import type { AgentIdentity, PersonalityMatrix, EmotionalState } from '../../lib/naos/types';

/* ─── Types ────────────────────────────────────────────────── */

interface AgentCardProps {
  agent: AgentIdentity;
  personality?: PersonalityMatrix;
  emotional?: EmotionalState;
  onClick?: () => void;
  selected?: boolean;
}

/* ─── Domain Color Map ────────────────────────────────────── */

const DOMAIN_COLORS: Record<string, string> = {
  engineering:     '#00F5FF',
  infrastructure:  '#3B82F6',
  security:        '#EF4444',
  growth:          '#10B981',
  marketing:       '#F59E0B',
  content:         '#EC4899',
  operations:      '#8B5CF6',
  finance:         '#6366F1',
  analytics:       '#14B8A6',
  data:            '#06B6D4',
  design:          '#F472B6',
  partnerships:    '#A78BFA',
  video:           '#FB923C',
  copy:            '#FBBF24',
};

function domainGradient(domains: string[]): string {
  if (domains.length === 0) return 'var(--cyan, #00F5FF)';
  const c1 = DOMAIN_COLORS[domains[0]] ?? '#00F5FF';
  const c2 = domains.length > 1 ? (DOMAIN_COLORS[domains[1]] ?? '#8B5CF6') : c1;
  return `linear-gradient(135deg, ${c1}, ${c2})`;
}

/** Map tier number to readable badge */
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

/* ─── Component ───────────────────────────────────────────── */

export default function AgentCard({ agent, personality: _personality, emotional, onClick, selected = false }: AgentCardProps) {
  const gradient = useMemo(() => domainGradient(agent.domain), [agent.domain]);
  const topAchievements = useMemo(() => agent.achievements.slice(0, 3), [agent.achievements]);
  const ventureLabels = useMemo(
    () => (agent.ventureScope === '*' ? ['All Ventures'] : agent.ventureScope.slice(0, 3)),
    [agent.ventureScope],
  );

  return (
    <>
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="show"
        {...hoverLift}
        {...tapScale}
      >
        <GlassCard
          className={`naos-agent-card ${selected ? 'naos-agent-card--selected' : ''}`}
          onClick={onClick}
          style={{ '--agent-gradient': gradient } as React.CSSProperties}
        >
          {/* Gradient top border */}
          <div className="naos-agent-card-accent" />

          {/* Identity */}
          <div className="naos-agent-card-identity">
            <div className="naos-agent-card-names">
              <span className="naos-agent-card-codename">{agent.codename}</span>
              {agent.fullName && (
                <span className="naos-agent-card-fullname">{agent.fullName}</span>
              )}
            </div>
            {emotional && <EmotionalIndicator emotional={emotional} compact />}
          </div>

          {/* Title + Tier */}
          <div className="naos-agent-card-title-row">
            <span className="naos-agent-card-title">{agent.title}</span>
            <Badge color={tierColor(agent.tier)} size="sm">
              {tierLabel(agent.tier)}
            </Badge>
          </div>

          {/* Achievements */}
          {topAchievements.length > 0 && (
            <div className="naos-agent-card-achievements">
              <AchievementBadges achievements={topAchievements} compact />
            </div>
          )}

          {/* Venture pills */}
          <div className="naos-agent-card-ventures">
            {ventureLabels.map((v) => (
              <span className="naos-agent-card-venture-pill" key={v}>{v}</span>
            ))}
          </div>
        </GlassCard>
      </motion.div>

      <style>{`
        .naos-agent-card {
          position: relative;
          padding: 14px 16px 12px;
          overflow: hidden;
          cursor: pointer;
          transition: box-shadow 0.25s, border-color 0.25s;
        }
        .naos-agent-card--selected {
          border-color: var(--cyan, #00F5FF)50 !important;
          box-shadow: 0 0 20px rgba(0, 245, 255, 0.08);
        }
        .naos-agent-card-accent {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--agent-gradient);
          border-radius: 12px 12px 0 0;
        }

        .naos-agent-card-identity {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 6px;
        }
        .naos-agent-card-names {
          display: flex;
          flex-direction: column;
        }
        .naos-agent-card-codename {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-primary, #E2E8F0);
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .naos-agent-card-fullname {
          font-size: 0.72rem;
          color: var(--text-secondary, #94A3B8);
          margin-top: 1px;
        }

        .naos-agent-card-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        .naos-agent-card-title {
          font-size: 0.75rem;
          color: var(--text-secondary, #94A3B8);
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .naos-agent-card-achievements {
          margin-bottom: 8px;
        }

        .naos-agent-card-ventures {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
        .naos-agent-card-venture-pill {
          font-size: 0.62rem;
          padding: 2px 7px;
          border-radius: 999px;
          background: rgba(139, 92, 246, 0.12);
          color: var(--purple, #8B5CF6);
          border: 1px solid rgba(139, 92, 246, 0.2);
          white-space: nowrap;
          text-transform: capitalize;
        }
      `}</style>
    </>
  );
}
