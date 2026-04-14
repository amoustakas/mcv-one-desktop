import { useEffect, useMemo, useState } from 'react';
import { Brain, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SectionCard, Badge } from '../ui';
import { timeAgo } from '../../lib/utils';
import { staggerContainer, staggerItem } from '../../lib/motion/variants';

export interface AgentEvent {
  id: string;
  type: 'agent_run' | 'tool_call' | 'agent_status' | 'kit_load';
  agent: string;
  summary: string;
  detail?: string;
  timestamp: string;
  status?: 'ok' | 'running' | 'error';
}

const EVENT_META: Record<AgentEvent['type'], { label: string; color: string }> = {
  agent_run:    { label: 'RUN',  color: '#00F0FF' },
  tool_call:    { label: 'TOOL', color: '#8B5CF6' },
  agent_status: { label: 'STAT', color: '#10B981' },
  kit_load:     { label: 'KIT',  color: '#F59E0B' },
};

const STATUS_COLOR: Record<string, string> = {
  ok: 'var(--success)',
  running: 'var(--cyan)',
  error: 'var(--error)',
};

/**
 * Reads agent events from a shared event bus stored in a custom window event
 * (`mcv:agent-event`). Any orchestrator/kit that wants to surface activity
 * can dispatch:
 *   window.dispatchEvent(new CustomEvent('mcv:agent-event', { detail: AgentEvent }))
 *
 * Events also persist to localStorage so a fresh page load shows recent history.
 */
const STORAGE_KEY = 'mcv-agent-events';
const MAX_EVENTS = 50;

function loadEvents(): AgentEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch { return []; }
}

function saveEvents(events: AgentEvent[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(0, MAX_EVENTS))); } catch { /* quota */ }
}

export default function AgentActivityFeed() {
  const [events, setEvents] = useState<AgentEvent[]>(loadEvents);

  useEffect(() => {
    const onEvent = (e: Event) => {
      const detail = (e as CustomEvent<AgentEvent>).detail;
      if (!detail) return;
      setEvents((prev) => {
        const next = [detail, ...prev].slice(0, MAX_EVENTS);
        saveEvents(next);
        return next;
      });
    };
    window.addEventListener('mcv:agent-event', onEvent);
    return () => window.removeEventListener('mcv:agent-event', onEvent);
  }, []);

  const liveCount = useMemo(
    () => events.filter((e) => e.status === 'running' || (Date.now() - new Date(e.timestamp).getTime()) < 30_000).length,
    [events],
  );

  return (
    <SectionCard
      title="Agent Activity"
      icon={<Brain size={14} />}
      description="NAOS agents and kit tool executions, live"
      action={liveCount > 0 ? <Badge color="#00F0FF" size="sm" variant="outline">{liveCount} recent</Badge> : undefined}
      padding="sm"
    >
      {events.length === 0 ? (
        <p className="aaf-empty">
          No agent activity yet. Run an agent from NAOS or a kit tool from chat — events will stream here.
        </p>
      ) : (
        <motion.ul className="aaf-list" variants={staggerContainer} initial="hidden" animate="show">
          <AnimatePresence initial={false}>
            {events.slice(0, 12).map((ev) => {
              const meta = EVENT_META[ev.type];
              return (
                <motion.li
                  key={ev.id}
                  variants={staggerItem}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0, x: -8 }}
                  className="aaf-row"
                  layout
                >
                  <span className="aaf-type-badge" style={{ color: meta.color, borderColor: meta.color + '55' }}>
                    {meta.label}
                  </span>
                  {ev.status && (
                    <span className="aaf-status-dot" style={{ background: STATUS_COLOR[ev.status] || 'var(--text-muted)' }} />
                  )}
                  <div className="aaf-body">
                    <div className="aaf-summary">
                      <Zap size={10} style={{ color: meta.color }} />
                      <span className="aaf-agent">{ev.agent}</span>
                      <span className="aaf-text">{ev.summary}</span>
                    </div>
                    {ev.detail && <span className="aaf-detail">{ev.detail}</span>}
                  </div>
                  <span className="aaf-time">{timeAgo(ev.timestamp)}</span>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </motion.ul>
      )}

      <style>{`
        .aaf-list { list-style: none; display: flex; flex-direction: column; gap: 2px; max-height: 340px; overflow-y: auto; }
        .aaf-row { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border-bottom: 1px solid var(--border); font-size: 11px; }
        .aaf-row:last-child { border-bottom: none; }
        .aaf-type-badge { flex-shrink: 0; font-family: var(--font-mono); font-size: 9px; font-weight: 700; letter-spacing: 0.5px; border: 1px solid; border-radius: 3px; padding: 2px 6px; background: transparent; }
        .aaf-status-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .aaf-body { flex: 1; min-width: 0; }
        .aaf-summary { display: flex; align-items: center; gap: 6px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
        .aaf-agent { font-weight: 600; color: var(--text-primary); }
        .aaf-text { color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; }
        .aaf-detail { display: block; font-size: 10px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .aaf-time { font-size: 9px; font-family: var(--font-mono); color: var(--text-muted); flex-shrink: 0; }
        .aaf-empty { font-size: 12px; color: var(--text-muted); padding: 12px 8px; line-height: 1.5; }
      `}</style>
    </SectionCard>
  );
}

/** Helper exported for orchestrators/kits to dispatch agent events easily */
export function emitAgentEvent(event: Omit<AgentEvent, 'id' | 'timestamp'> & { id?: string; timestamp?: string }) {
  const full: AgentEvent = {
    id: event.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: event.timestamp || new Date().toISOString(),
    ...event,
  };
  window.dispatchEvent(new CustomEvent('mcv:agent-event', { detail: full }));
}
