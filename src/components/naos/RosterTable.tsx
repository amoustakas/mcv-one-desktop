import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, fadeInUp } from '../../lib/animations';

/* ─── Types ────────────────────────────────────────────────── */

interface RosterTableProps {
  agents: any[];
  emotionalStates?: Record<string, any>;
  selectedId?: string | null;
  onSelect: (id: string) => void;
}

type SortKey = 'codename' | 'title' | 'tier' | 'domains' | 'milestone' | 'momentum' | 'status';
type SortDir = 'asc' | 'desc';

/* ─── Constants ──────────────────────────────────────────── */

const TIER_COLORS: Record<number, string> = {
  1: '#F59E0B',
  2: '#00F0FF',
  3: '#8B5CF6',
  4: '#0072F5',
  5: '#6B7280',
};

const MILESTONE_COLORS: Record<string, string> = {
  nascent: '#6B7280',
  settled: '#0072F5',
  established: '#00F0FF',
  veteran: '#8B5CF6',
  legendary: '#F59E0B',
};

const STATUS_COLORS: Record<string, string> = {
  active: '#10B981',
  probationary: '#F59E0B',
  suspended: '#EF4444',
  archived: '#6B7280',
  retired: '#6B7280',
};

const COLUMNS: { key: SortKey; label: string; width: string }[] = [
  { key: 'codename',  label: 'Codename',  width: '140px' },
  { key: 'title',     label: 'Title',     width: '1fr' },
  { key: 'tier',      label: 'Tier',      width: '60px' },
  { key: 'domains',   label: 'Domains',   width: '160px' },
  { key: 'milestone', label: 'Milestone', width: '90px' },
  { key: 'momentum',  label: 'Momentum',  width: '80px' },
  { key: 'status',    label: 'Status',    width: '70px' },
];

/* ─── Helpers ────────────────────────────────────────────── */

function safe(agent: any, key: string): any {
  // Support both camelCase and snake_case
  return agent[key] ?? agent[key.replace(/[A-Z]/g, (m: string) => '_' + m.toLowerCase())];
}

function getMoodEmoji(emotionalState: any): string {
  if (!emotionalState) return '';
  const momentum = emotionalState.momentum ?? emotionalState.overallMomentum ?? 0;
  const excitement = emotionalState.excitement ?? 0;
  const caution = emotionalState.caution ?? 0;
  const frustration = emotionalState.frustration ?? 0;
  const confidence = emotionalState.confidence ?? 0;

  if (momentum > 85) return '\u26A1';
  if (excitement > 70) return '\uD83D\uDD25';
  if (caution > 70) return '\uD83D\uDD0D';
  if (frustration > 60) return '\uD83D\uDE24';
  if (confidence > 70) return '\uD83D\uDCAA';
  return '';
}

function getMomentum(agent: any): number {
  return agent.momentum ?? agent.emotional_state?.momentum ?? agent.emotionalState?.momentum ?? 0;
}

function momentumColor(value: number): string {
  if (value < 30) return '#EF4444';
  if (value <= 70) return '#F59E0B';
  return '#10B981';
}

function compareFn(a: any, b: any, key: SortKey, dir: SortDir): number {
  let av: any;
  let bv: any;

  switch (key) {
    case 'codename':
      av = (a.codename ?? '').toLowerCase();
      bv = (b.codename ?? '').toLowerCase();
      break;
    case 'title':
      av = (a.title ?? '').toLowerCase();
      bv = (b.title ?? '').toLowerCase();
      break;
    case 'tier':
      av = a.tier ?? 99;
      bv = b.tier ?? 99;
      break;
    case 'domains':
      av = (a.domains ?? []).join(',').toLowerCase();
      bv = (b.domains ?? []).join(',').toLowerCase();
      break;
    case 'milestone':
      av = a.milestone ?? '';
      bv = b.milestone ?? '';
      break;
    case 'momentum':
      av = getMomentum(a);
      bv = getMomentum(b);
      break;
    case 'status':
      av = a.status ?? '';
      bv = b.status ?? '';
      break;
    default:
      av = '';
      bv = '';
  }

  if (av < bv) return dir === 'asc' ? -1 : 1;
  if (av > bv) return dir === 'asc' ? 1 : -1;
  return 0;
}

/* ─── Component ──────────────────────────────────────────── */

export default function RosterTable({ agents, emotionalStates, selectedId, onSelect }: RosterTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('codename');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortDir('asc');
      return key;
    });
  }, []);

  const sorted = useMemo(
    () => [...agents].sort((a, b) => compareFn(a, b, sortKey, sortDir)),
    [agents, sortKey, sortDir],
  );

  const gridCols = COLUMNS.map((c) => c.width).join(' ');

  /* ── Empty state ── */
  if (!agents.length) {
    return (
      <div className="naos-empty-state">
        <h3>Empty Roster</h3>
        <p>No agents in the roster</p>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div
        className="naos-roster-header"
        style={{ gridTemplateColumns: gridCols }}
      >
        {COLUMNS.map((col) => (
          <button
            key={col.key}
            type="button"
            className="naos-roster-header__cell"
            onClick={() => handleSort(col.key)}
          >
            {col.label}
            {sortKey === col.key && (
              <span className="naos-roster-sort-arrow">
                {sortDir === 'asc' ? '\u25B2' : '\u25BC'}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Rows */}
      <motion.div
        className="naos-roster"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        {sorted.map((agent) => {
          const id = agent.id ?? agent.agentId ?? agent.agent_id ?? agent.codename;
          const isSelected = selectedId === id;
          const emo = emotionalStates?.[id];
          const emoji = getMoodEmoji(emo);
          const momentum = getMomentum(agent);
          const mColor = momentumColor(momentum);
          const tier: number = agent.tier ?? 5;
          const domains: string[] = agent.domains ?? [];
          const milestone: string = agent.milestone ?? 'nascent';
          const status: string = agent.status ?? 'active';

          return (
            <motion.div
              key={id}
              className={`naos-roster-row${isSelected ? ' selected' : ''}`}
              style={{ gridTemplateColumns: gridCols }}
              variants={fadeInUp}
              onClick={() => onSelect(id)}
            >
              {/* Codename */}
              <span className="naos-roster-codename">
                {emoji && <span className="naos-roster-emoji">{emoji}</span>}
                {agent.codename ?? 'UNKNOWN'}
              </span>

              {/* Title */}
              <span className="naos-roster-title">
                {agent.title ?? safe(agent, 'role') ?? '\u2014'}
              </span>

              {/* Tier */}
              <span>
                <span
                  className="naos-roster-tier-badge"
                  style={{
                    color: TIER_COLORS[tier] ?? '#6B7280',
                    borderColor: TIER_COLORS[tier] ?? '#6B7280',
                    backgroundColor: `${TIER_COLORS[tier] ?? '#6B7280'}15`,
                  }}
                >
                  T{tier}
                </span>
              </span>

              {/* Domains */}
              <span className="naos-roster-domains">
                {domains.slice(0, 2).map((d) => (
                  <span key={d} className="naos-roster-domain-pill">{d}</span>
                ))}
              </span>

              {/* Milestone */}
              <span
                className="naos-roster-milestone"
                style={{ color: MILESTONE_COLORS[milestone] ?? '#6B7280' }}
              >
                {milestone}
              </span>

              {/* Momentum */}
              <span className="naos-roster-momentum">
                <span className="naos-roster-momentum-track">
                  <span
                    className="naos-roster-momentum-fill"
                    style={{
                      width: `${Math.max(0, Math.min(100, momentum))}%`,
                      backgroundColor: mColor,
                    }}
                  />
                </span>
                <span className="naos-roster-momentum-val" style={{ color: mColor }}>
                  {momentum}
                </span>
              </span>

              {/* Status */}
              <span className="naos-roster-status">
                <span
                  className="naos-roster-status-dot"
                  style={{ backgroundColor: STATUS_COLORS[status] ?? '#6B7280' }}
                />
                {status}
              </span>
            </motion.div>
          );
        })}
      </motion.div>

      <style>{`
        /* ── Header ── */
        .naos-roster-header {
          display: grid;
          gap: var(--space-md, 16px);
          padding: 6px 14px;
          margin-bottom: 2px;
        }
        .naos-roster-header__cell {
          all: unset;
          cursor: pointer;
          font-size: 9px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: var(--text-muted, #64748B);
          display: flex;
          align-items: center;
          gap: 4px;
          user-select: none;
        }
        .naos-roster-header__cell:hover {
          color: var(--text-primary, #F1F5F9);
        }
        .naos-roster-sort-arrow {
          font-size: 8px;
          color: var(--cyan, #00F0FF);
        }

        /* ── Rows (override to grid) ── */
        .naos-roster .naos-roster-row {
          display: grid;
          gap: var(--space-md, 16px);
          align-items: center;
        }
        .naos-roster .naos-roster-row.selected {
          border-left: 2px solid var(--cyan, #00F0FF);
        }

        /* ── Cells ── */
        .naos-roster-emoji {
          margin-right: 4px;
        }
        .naos-roster-tier-badge {
          font-size: 9px;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: var(--radius-full, 999px);
          border: 1px solid;
          font-family: var(--font-mono, monospace);
        }
        .naos-roster-domains {
          display: flex;
          gap: 4px;
          flex-wrap: nowrap;
          overflow: hidden;
        }
        .naos-roster-domain-pill {
          font-size: 9px;
          padding: 1px 6px;
          border-radius: var(--radius-full, 999px);
          background: var(--bg-elevated, rgba(255, 255, 255, 0.06));
          color: var(--text-secondary, #94A3B8);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 72px;
        }
        .naos-roster-momentum {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .naos-roster-momentum-track {
          width: 40px;
          height: 4px;
          background: var(--bg-elevated, rgba(255, 255, 255, 0.06));
          border-radius: 2px;
          overflow: hidden;
        }
        .naos-roster-momentum-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.4s ease;
        }
        .naos-roster-momentum-val {
          font-size: 9px;
          font-family: var(--font-mono, monospace);
          font-weight: 600;
          width: 20px;
          text-align: right;
        }
        .naos-roster-status-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          margin-right: 4px;
          vertical-align: middle;
        }
      `}</style>
    </>
  );
}
