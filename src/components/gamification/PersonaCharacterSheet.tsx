// src/components/gamification/PersonaCharacterSheet.tsx
// Marathon #3 T9.6 — per-persona detail view.
// Header + XP sparkline + achievements + chain-of-command + recent events.

import { usePersonaXp, usePersonaAchievements } from '../../hooks/use-persona-xp';
import { useAgentOrgChart, type AgentOrgNode } from '../../hooks/use-agents';
import { Modal } from '../ui';
import { XpHistoryChart } from './XpHistoryChart';
import { AchievementBadge } from './AchievementBadge';

interface Props {
  agentId: string | null;
  open: boolean;
  onClose: () => void;
}

const DIMENSION_COLOR: Record<string, string> = {
  '6D': '#FBBF24',
  '5D': 'var(--color-brand-electric)',
  '4D': 'var(--color-brand-purple)',
  '3D': '#6EE7B7',
  '2D': '#94A3B8',
  '1D': '#64748B',
};

// Local persona-registry shim — spec references a usePersonaRegistry from M2
// which has not yet landed in this worktree. useAgentOrgChart surfaces the
// same {id, handle, full_name, title, reports_to_agent_id} fields the
// chain-of-command section needs, so we adapt it here and keep the sheet
// self-contained until the registry hook ships.
function usePersonaRegistry(): { personas: AgentOrgNode[] } {
  const q = useAgentOrgChart();
  return { personas: q.data ?? [] };
}

export function PersonaCharacterSheet({ agentId, open, onClose }: Props) {
  const xpQ = usePersonaXp(agentId);
  const achievementsQ = usePersonaAchievements(agentId);
  const registry = usePersonaRegistry();

  if (!open || !agentId) return null;

  const summary = xpQ.data;
  const achievements = achievementsQ.data?.achievements ?? [];
  const personas = registry.personas;

  // Reports-to graph: who this persona reports to + who reports to them.
  const persona = personas.find((p) => p.id === agentId) ?? null;
  const reportsTo = persona?.reports_to_agent_id
    ? personas.find((p) => p.id === persona.reports_to_agent_id) ?? null
    : null;
  const directReports = personas.filter((p) => p.reports_to_agent_id === agentId);

  const accent = summary?.persona.dimension
    ? DIMENSION_COLOR[summary.persona.dimension] ?? 'var(--color-brand-electric)'
    : 'var(--color-brand-electric)';

  return (
    <Modal
      open={open}
      onClose={onClose}
      ariaLabel={`${summary?.persona.handle ?? 'Persona'} character sheet`}
      size="lg"
    >
      <div
        style={{
          padding: 24,
          minWidth: 640,
          maxWidth: 720,
          display: 'grid',
          gap: 20,
        }}
      >
        {/* Header */}
        {summary?.persona && (
          <header style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: accent,
                color: 'var(--surface-base)',
                display: 'grid',
                placeItems: 'center',
                fontSize: 22,
                fontWeight: 800,
              }}
            >
              {(summary.persona.full_name ?? summary.persona.handle)
                .charAt(summary.persona.handle?.startsWith('@') ? 1 : 0)
                .toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: 11,
                  color: accent,
                  fontWeight: 700,
                }}
              >
                {summary.persona.handle}
              </div>
              <h2
                style={{
                  margin: '4px 0 0',
                  fontSize: 20,
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                }}
              >
                {summary.persona.full_name}
              </h2>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {summary.persona.title}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: accent }}>
                {summary.persona.xp.toLocaleString()}
              </div>
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: '.1em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                }}
              >
                total XP
              </div>
              {summary.persona.dimension && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '.1em',
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: `${accent}20`,
                    color: accent,
                    marginTop: 4,
                    display: 'inline-block',
                  }}
                >
                  {summary.persona.dimension}
                </span>
              )}
            </div>
          </header>
        )}

        {/* XP history chart */}
        {summary && (
          <section>
            <div
              style={{
                fontSize: 10,
                letterSpacing: '.15em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                marginBottom: 8,
              }}
            >
              XP over time · {summary.events.length} events
            </div>
            <div
              style={{
                padding: 12,
                borderRadius: 10,
                background: 'var(--surface-base)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <XpHistoryChart events={summary.events} />
            </div>

            {/* XP by kind */}
            <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
              {Object.entries(summary.by_kind)
                .sort((a, b) => b[1].xp - a[1].xp)
                .map(([kind, stats]) => (
                  <span
                    key={kind}
                    style={{
                      fontSize: 10,
                      padding: '3px 8px',
                      borderRadius: 4,
                      background: 'var(--surface-base)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)' }}>{kind}</span> ·{' '}
                    {stats.count}×{' '}
                    <span style={{ color: accent, fontWeight: 600 }}>
                      {stats.xp} XP
                    </span>
                  </span>
                ))}
            </div>
          </section>
        )}

        {/* Achievements */}
        <section>
          <div
            style={{
              fontSize: 10,
              letterSpacing: '.15em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: 8,
            }}
          >
            Achievements · {achievements.length}
          </div>
          {achievements.length === 0 ? (
            <div
              style={{
                padding: 12,
                color: 'var(--text-muted)',
                fontSize: 11,
                fontStyle: 'italic',
                border: '1px dashed var(--border-subtle)',
                borderRadius: 8,
                textAlign: 'center',
              }}
            >
              No achievements unlocked yet.
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {achievements.map((a) => (
                <AchievementBadge key={a.id} achievement={a} />
              ))}
            </div>
          )}
        </section>

        {/* Reports-to graph */}
        <section>
          <div
            style={{
              fontSize: 10,
              letterSpacing: '.15em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: 8,
            }}
          >
            Chain of command
          </div>
          <div
            style={{
              display: 'grid',
              gap: 10,
              padding: 12,
              borderRadius: 10,
              background: 'var(--surface-base)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {reportsTo ? (
              <div style={{ fontSize: 12 }}>
                <span style={{ color: 'var(--text-muted)' }}>Reports to:</span>{' '}
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                  {reportsTo.full_name}
                </span>{' '}
                <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>
                  ({reportsTo.handle} · {reportsTo.title})
                </span>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                No direct report-up chain (top of scope or not yet wired).
              </div>
            )}
            {directReports.length > 0 && (
              <div style={{ fontSize: 12 }}>
                <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>
                  Direct reports · {directReports.length}:
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {directReports.map((r) => (
                    <span
                      key={r.id}
                      style={{
                        fontSize: 10,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: 'var(--surface-elevated)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {r.handle}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Recent events */}
        {summary && summary.events.length > 0 && (
          <section>
            <div
              style={{
                fontSize: 10,
                letterSpacing: '.15em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                marginBottom: 8,
              }}
            >
              Recent events · showing {Math.min(10, summary.events.length)} of{' '}
              {summary.events.length}
            </div>
            <div style={{ display: 'grid', gap: 4 }}>
              {summary.events.slice(0, 10).map((e) => (
                <div
                  key={e.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 10px',
                    borderRadius: 6,
                    background: 'var(--surface-base)',
                    fontSize: 11,
                  }}
                >
                  <div>
                    <span
                      style={{
                        color: 'var(--text-muted)',
                        fontSize: 10,
                        textTransform: 'uppercase',
                        letterSpacing: '.1em',
                      }}
                    >
                      {e.event_kind}
                    </span>{' '}
                    <span style={{ color: 'var(--text-primary)' }}>
                      {e.description ?? '—'}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      alignItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        color: e.xp >= 0 ? '#6EE7B7' : '#FB7185',
                        fontWeight: 600,
                      }}
                    >
                      {e.xp >= 0 ? '+' : ''}
                      {e.xp}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>
                      {new Date(e.occurred_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </Modal>
  );
}

export default PersonaCharacterSheet;
