// src/views/internal/EventStreamView.tsx
//
// Dev-only cockpit panel — the live Event Stream for Agentic OS Layer 1.
//
// Shows:
//   · Header row: module contract summary ("Foundation emits 14 / subscribes 3")
//   · Filter row: topic-pattern input + module chips + clear-stream button
//   · Stream: newest-first list of EventEnvelope rows (live via Supabase realtime)
//   · Payload drawer: expand any row to see the typed payload
//   · DLQ tab: failed subscriber invocations (list + manual retry)
//   · Dev-only "publish test" button to emit a synthetic envelope
//
// Explicitly not audit-log — that's a historical query tool. This is a live
// observability panel for the bus itself.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { EventEnvelope, EventDeadLetterRow } from '@mcv/events-sdk';
import { topicMatches, ALL_CONTRACTS } from '@mcv/events-sdk';
import { subscribeToEvents } from '../../lib/events/subscribe-realtime';

type Tab = 'stream' | 'contracts' | 'dlq';

interface ApiContractsResponse {
  contracts: Array<{ module: string; version: string; emits: unknown; subscribes: unknown; registered_at: string }>;
  inMemory: {
    modules: Array<{
      module: string;
      version: string;
      emitCount: number;
      subscribeCount: number;
      emits: Array<{ topic: string; description: string }>;
      subscribes: Array<{ topicPattern: string; description: string }>;
    }>;
  };
}

export default function EventStreamView() {
  const [tab, setTab] = useState<Tab>('stream');
  const [pattern, setPattern] = useState('*');
  const [events, setEvents] = useState<EventEnvelope<unknown>[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [deadLetters, setDeadLetters] = useState<EventDeadLetterRow[]>([]);
  const [contractsInfo, setContractsInfo] = useState<ApiContractsResponse['inMemory'] | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [demoing, setDemoing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  // 1. Seed the stream from the recent-events API so the panel isn't empty on open.
  const fetchRecent = useCallback(async () => {
    try {
      const res = await fetch('/api/events?action=list-recent-events&limit=100');
      if (!res.ok) return;
      const json = await res.json();
      const rows = (json.events ?? []) as Array<{
        id: string; topic: string; schema_version: string; correlation_id: string;
        causation_id: string | null; venture_id: string | null; emitted_at: string;
        emitted_by: string; payload: unknown; status: EventEnvelope['status'];
      }>;
      setEvents(rows.map((r) => ({
        id: r.id,
        topic: r.topic,
        schemaVersion: r.schema_version,
        correlationId: r.correlation_id,
        causationId: r.causation_id,
        ventureId: r.venture_id,
        emittedAt: r.emitted_at,
        emittedBy: r.emitted_by,
        payload: r.payload,
        status: r.status,
      })));
    } catch (err) {
      setLastError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const fetchContracts = useCallback(async () => {
    try {
      const res = await fetch('/api/events?action=list-contracts');
      if (!res.ok) return;
      const json = (await res.json()) as ApiContractsResponse;
      setContractsInfo(json.inMemory);
    } catch (err) {
      setLastError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const fetchDeadLetters = useCallback(async () => {
    try {
      const res = await fetch('/api/events?action=list-dead-letters&limit=100');
      if (!res.ok) return;
      const json = await res.json();
      setDeadLetters((json.deadLetters ?? []) as EventDeadLetterRow[]);
    } catch (err) {
      setLastError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  // Initial load — kick off all three fetches in parallel once on mount.
  // setState from each runs in a network callback, outside the effect
  // body, so the set-state-in-effect lint rule passes. Deps intentionally
  // empty: the fetch* callbacks are stable (useCallback with []) and
  // re-running on identity-change would re-seed the stream every render.
  useEffect(() => {
    const load = async () => {
      await Promise.all([fetchRecent(), fetchContracts(), fetchDeadLetters()]);
    };
    void load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 2. Subscribe to live events via realtime. Unsubscribe on unmount.
  const pausedRef = useRef(paused);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => {
    const handle = subscribeToEvents('*', (envelope) => {
      if (pausedRef.current) return;
      setEvents((prev) => {
        // Realtime + seed may overlap; de-dup by id.
        if (prev.some((e) => e.id === envelope.id)) return prev;
        return [envelope, ...prev].slice(0, 500);
      });
    }, { label: 'EventStreamView' });
    return () => { void handle?.unsubscribe(); };
  }, []);

  // 3. Filter events by pattern (client-side).
  const filtered = useMemo(() => {
    if (!pattern || pattern === '*') return events;
    return events.filter((e) => topicMatches(e.topic, pattern));
  }, [events, pattern]);

  // 4. Publish-test action.
  const publishTest = useCallback(async () => {
    setPublishing(true);
    setLastError(null);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'publish-test' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      setLastError(err instanceof Error ? err.message : String(err));
    } finally {
      setPublishing(false);
    }
  }, []);

  // Cascading demo sequence — 3 real Foundation topics staggered ~700ms so
  // the stream visibly animates on a cold-boot demo open. Each payload satisfies
  // the Zod contract declared in packages/events-sdk/src/contracts/foundation.ts.
  const publishDemoSequence = useCallback(async () => {
    setDemoing(true);
    setLastError(null);
    const beats: Array<{ topic: string; payload: Record<string, unknown> }> = [
      {
        topic: 'foundation.domain.acquired',
        payload: {
          orderId: crypto.randomUUID(),
          assetIdentifier: 'futurestate.holdings',
          priceUsd: 4200,
        },
      },
      {
        topic: 'foundation.repo.synced',
        payload: { repoCount: 42, archivedCount: 3, source: 'github-api' },
      },
      {
        topic: 'foundation.deployment.live',
        payload: {
          projectName: 'mcv-investor',
          url: 'mcv-investor-xyz.vercel.app',
          target: 'production',
          commitSha: 'ed95301',
          commitMessage: 'merge(foundation): GitHub + Vercel portfolio panels',
        },
      },
    ];
    try {
      for (const beat of beats) {
        const res = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'publish-test', topic: beat.topic, payload: beat.payload }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status} on ${beat.topic}`);
        await new Promise((resolve) => setTimeout(resolve, 700));
      }
    } catch (err) {
      setLastError(err instanceof Error ? err.message : String(err));
    } finally {
      setDemoing(false);
    }
  }, []);

  const registerContracts = useCallback(async () => {
    setLastError(null);
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register-contracts' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fetchContracts();
    } catch (err) {
      setLastError(err instanceof Error ? err.message : String(err));
    }
  }, [fetchContracts]);

  const totalEmissions = ALL_CONTRACTS.reduce((n, c) => n + c.emits.length, 0);
  const totalSubscriptions = ALL_CONTRACTS.reduce((n, c) => n + c.subscribes.length, 0);

  return (
    <div className="esv-root">
      <header className="esv-header">
        <div className="esv-title">
          <span className="esv-logo">⚡</span>
          <span>Event Stream</span>
          <span className="esv-subtitle">Agentic OS · Layer 1 · Typed Nervous System</span>
        </div>
        <div className="esv-stats">
          <span>{ALL_CONTRACTS.length} modules</span>
          <span>·</span>
          <span>{totalEmissions} emissions</span>
          <span>·</span>
          <span>{totalSubscriptions} subscriptions</span>
        </div>
      </header>

      <nav className="esv-tabs">
        <button className={tab === 'stream' ? 'active' : ''} onClick={() => setTab('stream')}>Live stream ({filtered.length})</button>
        <button className={tab === 'contracts' ? 'active' : ''} onClick={() => setTab('contracts')}>Contracts ({ALL_CONTRACTS.length})</button>
        <button className={tab === 'dlq' ? 'active' : ''} onClick={() => setTab('dlq')}>Dead letters ({deadLetters.length})</button>
      </nav>

      {lastError && (
        <div className="esv-error">⚠ {lastError} <button onClick={() => setLastError(null)}>×</button></div>
      )}

      {tab === 'stream' && (
        <>
          <div className="esv-toolbar">
            <input
              className="esv-pattern"
              placeholder="Topic pattern: foundation.*, capital.round.funded, *"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
            />
            <button onClick={() => setPaused((p) => !p)} className={paused ? 'esv-paused' : ''}>
              {paused ? '▶ Resume' : '⏸ Pause'}
            </button>
            <button onClick={() => setEvents([])}>Clear</button>
            <button onClick={() => void fetchRecent()}>Refetch</button>
            <button onClick={() => void publishTest()} disabled={publishing} className="esv-publish">
              {publishing ? 'Publishing…' : '⚡ Publish test event'}
            </button>
            <button onClick={() => void publishDemoSequence()} disabled={demoing} className="esv-publish esv-demo">
              {demoing ? 'Animating…' : '🎬 Publish demo event'}
            </button>
          </div>

          <ul className="esv-stream">
            {filtered.length === 0 && (
              <li className="esv-empty">
                No events yet. {paused ? '(stream paused)' : 'Flip an NDA status in Foundation, or click “🎬 Publish demo event” above.'}
              </li>
            )}
            {filtered.map((ev) => (
              <li key={ev.id} className={`esv-row esv-status-${ev.status}`} onClick={() => setExpandedId(expandedId === ev.id ? null : ev.id)}>
                <div className="esv-row-top">
                  <span className="esv-topic">{ev.topic}</span>
                  <span className="esv-meta">
                    <span className="esv-emitter">{ev.emittedBy}</span>
                    {ev.ventureId && <span className="esv-venture">{ev.ventureId}</span>}
                    <span className="esv-time">{relativeTime(ev.emittedAt)}</span>
                  </span>
                </div>
                {expandedId === ev.id && (
                  <pre className="esv-payload">{JSON.stringify({
                    id: ev.id,
                    correlationId: ev.correlationId,
                    causationId: ev.causationId,
                    schemaVersion: ev.schemaVersion,
                    payload: ev.payload,
                  }, null, 2)}</pre>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {tab === 'contracts' && (
        <div className="esv-contracts">
          <div className="esv-toolbar">
            <button onClick={() => void registerContracts()} className="esv-publish">Re-register contracts → DB</button>
            <button onClick={() => void fetchContracts()}>Refetch</button>
          </div>
          {(contractsInfo?.modules ?? ALL_CONTRACTS.map((c) => ({
            module: c.module, version: c.version,
            emitCount: c.emits.length, subscribeCount: c.subscribes.length,
            emits: c.emits.map((e) => ({ topic: e.topic, description: e.description })),
            subscribes: c.subscribes.map((s) => ({ topicPattern: s.topicPattern, description: s.description })),
          }))).map((mod) => (
            <section key={mod.module} className="esv-module">
              <h3>{mod.module} <span className="esv-version">v{mod.version}</span></h3>
              <div className="esv-module-grid">
                <div>
                  <h4>Emits ({mod.emitCount})</h4>
                  <ul>
                    {mod.emits.map((e) => (
                      <li key={e.topic}>
                        <code>{e.topic}</code>
                        <p>{e.description}</p>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4>Subscribes ({mod.subscribeCount})</h4>
                  <ul>
                    {mod.subscribes.map((s) => (
                      <li key={s.topicPattern}>
                        <code>{s.topicPattern}</code>
                        <p>{s.description}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          ))}
        </div>
      )}

      {tab === 'dlq' && (
        <div className="esv-dlq">
          <div className="esv-toolbar">
            <button onClick={() => void fetchDeadLetters()}>Refetch</button>
          </div>
          {deadLetters.length === 0 && <p className="esv-empty">No dead letters. Every subscriber invocation succeeded.</p>}
          <ul>
            {deadLetters.map((dl) => (
              <li key={dl.id} className={`esv-dlq-row esv-dlq-${dl.status}`}>
                <div className="esv-dlq-top">
                  <code>{dl.topic}</code>
                  <span>× {dl.subscriber_label}</span>
                  <span className="esv-dlq-attempts">attempt {dl.attempt_count}</span>
                  <span className="esv-dlq-status">{dl.status}</span>
                </div>
                <div className="esv-dlq-err">{dl.error_message}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <style>{EVENT_STREAM_CSS}</style>
    </div>
  );
}

function relativeTime(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 5_000) return 'now';
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return d.toLocaleString();
}

const EVENT_STREAM_CSS = `
.esv-root { padding: var(--space-lg); height: 100%; display: flex; flex-direction: column; gap: var(--space-md); color: var(--text-primary); font-family: var(--font-sans); overflow: hidden; }
.esv-header { display: flex; align-items: baseline; justify-content: space-between; gap: var(--space-md); }
.esv-title { display: flex; align-items: baseline; gap: var(--space-xs); font-size: var(--text-xl); font-weight: 700; }
.esv-logo { color: var(--cyan); font-size: 1.1em; }
.esv-subtitle { font-size: var(--text-xs); font-weight: 400; color: var(--text-muted); margin-left: var(--space-sm); font-family: var(--font-mono); }
.esv-stats { font-size: var(--text-xs); color: var(--text-secondary); font-family: var(--font-mono); display: flex; gap: var(--space-xs); }
.esv-tabs { display: flex; gap: 2px; border-bottom: 1px solid var(--border-subtle); }
.esv-tabs button { padding: var(--space-xs) var(--space-md); background: transparent; border: none; color: var(--text-muted); cursor: pointer; font-size: var(--text-sm); border-bottom: 2px solid transparent; }
.esv-tabs button.active { color: var(--cyan); border-bottom-color: var(--cyan); }
.esv-tabs button:hover { color: var(--text-primary); }
.esv-error { background: rgba(255,80,80,.12); color: #ff7575; padding: var(--space-xs) var(--space-md); border-radius: 6px; font-size: var(--text-xs); display: flex; align-items: center; gap: var(--space-xs); }
.esv-error button { margin-left: auto; background: transparent; border: none; color: inherit; cursor: pointer; }
.esv-toolbar { display: flex; gap: var(--space-xs); align-items: center; flex-wrap: wrap; }
.esv-pattern { flex: 1; min-width: 220px; padding: 6px 10px; background: var(--surface-raised); border: 1px solid var(--border-subtle); border-radius: 6px; color: var(--text-primary); font-family: var(--font-mono); font-size: var(--text-sm); }
.esv-toolbar button { padding: 6px 10px; background: var(--surface-raised); border: 1px solid var(--border-subtle); border-radius: 6px; color: var(--text-secondary); cursor: pointer; font-size: var(--text-xs); }
.esv-toolbar button:hover { color: var(--text-primary); border-color: var(--border-default); }
.esv-toolbar button.esv-paused { color: var(--purple); border-color: var(--purple); }
.esv-toolbar button.esv-publish { background: color-mix(in srgb, var(--cyan) 14%, transparent); border-color: color-mix(in srgb, var(--cyan) 35%, transparent); color: var(--cyan); }
.esv-toolbar button.esv-demo { background: color-mix(in srgb, var(--purple) 14%, transparent); border-color: color-mix(in srgb, var(--purple) 35%, transparent); color: var(--purple); }
.esv-toolbar button:disabled { opacity: .5; cursor: not-allowed; }
.esv-stream { flex: 1; overflow: auto; list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 2px; }
.esv-row { padding: 8px 12px; background: var(--surface-raised); border-radius: 6px; border-left: 3px solid transparent; cursor: pointer; transition: background 120ms; }
.esv-row:hover { background: var(--surface-overlay); }
.esv-row.esv-status-published { border-left-color: var(--cyan); }
.esv-row.esv-status-failed { border-left-color: #ff7575; }
.esv-row.esv-status-retried { border-left-color: var(--purple); }
.esv-row-top { display: flex; justify-content: space-between; gap: var(--space-sm); align-items: baseline; font-size: var(--text-sm); }
.esv-topic { font-family: var(--font-mono); color: var(--text-primary); font-weight: 600; }
.esv-meta { display: flex; gap: var(--space-xs); color: var(--text-muted); font-size: var(--text-xs); font-family: var(--font-mono); }
.esv-emitter { color: var(--purple); }
.esv-venture { color: var(--cyan); }
.esv-payload { margin-top: 8px; padding: 8px 12px; background: var(--surface-base); border-radius: 4px; font-size: var(--text-xs); font-family: var(--font-mono); white-space: pre-wrap; overflow-x: auto; color: var(--text-secondary); border: 1px solid var(--border-subtle); }
.esv-empty { text-align: center; color: var(--text-muted); padding: var(--space-2xl); font-size: var(--text-sm); }
.esv-contracts { flex: 1; overflow: auto; display: flex; flex-direction: column; gap: var(--space-lg); }
.esv-module h3 { margin: 0 0 var(--space-sm) 0; font-size: var(--text-md); display: flex; gap: var(--space-xs); align-items: baseline; }
.esv-version { color: var(--text-muted); font-size: var(--text-xs); font-weight: 400; font-family: var(--font-mono); }
.esv-module-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md); }
.esv-module-grid h4 { font-size: var(--text-xs); color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 var(--space-xs) 0; }
.esv-module-grid ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: var(--space-xs); }
.esv-module-grid li { padding: 6px 8px; background: var(--surface-raised); border-radius: 4px; }
.esv-module-grid li code { font-size: var(--text-xs); color: var(--cyan); }
.esv-module-grid li p { margin: 2px 0 0 0; font-size: var(--text-xs); color: var(--text-secondary); }
.esv-dlq ul { list-style: none; padding: 0; margin: var(--space-md) 0 0 0; display: flex; flex-direction: column; gap: 2px; }
.esv-dlq-row { padding: 8px 12px; background: var(--surface-raised); border-radius: 6px; border-left: 3px solid #ff7575; }
.esv-dlq-top { display: flex; gap: var(--space-sm); align-items: baseline; font-size: var(--text-xs); font-family: var(--font-mono); }
.esv-dlq-top code { color: var(--text-primary); font-weight: 600; }
.esv-dlq-attempts { color: var(--text-muted); }
.esv-dlq-status { margin-left: auto; color: var(--purple); }
.esv-dlq-err { margin-top: 4px; font-size: var(--text-xs); color: #ff9999; font-family: var(--font-mono); }
`;
