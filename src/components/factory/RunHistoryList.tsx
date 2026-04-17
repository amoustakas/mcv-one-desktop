// src/components/factory/RunHistoryList.tsx
// Paginated list of past Factory runs with filter by pillar + status.

import { useState } from 'react';
import { useFactoryRuns } from '../../hooks/use-factory-run';
import type { FactoryPillar, FactoryRunStatus, FactoryRun } from '../../lib/factory-client';
import { RunStatusBadge } from './RunStatusBadge';

const PILLARS: Array<FactoryPillar | 'all'> = ['all', 'oracle', 'forge', 'bloodstream', 'architect', 'crucible', 'heartbeat', 'scheduler'];
const STATUSES: Array<FactoryRunStatus | 'all'> = ['all', 'queued', 'running', 'succeeded', 'failed', 'cancelled'];

interface Props { onSelect?: (run: FactoryRun) => void }

export function RunHistoryList({ onSelect }: Props) {
  const [pillar, setPillar] = useState<FactoryPillar | 'all'>('all');
  const [status, setStatus] = useState<FactoryRunStatus | 'all'>('all');
  const [limit, setLimit] = useState(50);

  const runsQ = useFactoryRuns({
    limit,
    pillar: pillar === 'all' ? undefined : pillar,
    status: status === 'all' ? undefined : status,
  });

  const runs = runsQ.data ?? [];

  return (
    <section>
      <header style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          run history · {runs.length}
        </span>
        <select value={pillar} onChange={(e) => setPillar(e.target.value as FactoryPillar | 'all')} style={filterStyle}>
          {PILLARS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as FactoryRunStatus | 'all')} style={filterStyle}>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} style={filterStyle}>
          {[20, 50, 100, 200].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </header>

      {runsQ.isLoading && <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Loading…</div>}
      {runsQ.isError && <div style={{ color: '#FB7185', fontSize: 11 }}>Failed to load runs.</div>}

      {runs.length === 0 && !runsQ.isLoading && (
        <div style={{ padding: 14, color: 'var(--text-muted)', fontSize: 11, fontStyle: 'italic', border: '1px dashed var(--border-subtle)', borderRadius: 8, textAlign: 'center' }}>
          No runs match these filters.
        </div>
      )}

      <div style={{ display: 'grid', gap: 4 }}>
        {runs.map((r) => (
          <button
            key={r.run_id}
            onClick={() => onSelect?.(r)}
            style={{
              display: 'grid', gridTemplateColumns: '80px 1fr 110px 70px 100px', gap: 10, alignItems: 'center',
              padding: '8px 10px', borderRadius: 6,
              background: 'var(--surface-base)', border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)', cursor: onSelect ? 'pointer' : 'default',
              textAlign: 'left', fontSize: 11,
            }}
          >
            <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{r.run_id.slice(0, 8)}</span>
            <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{r.flow_name}</span>
            <RunStatusBadge status={r.status} />
            <span style={{ color: 'var(--text-muted)', fontSize: 10, textAlign: 'right' }}>
              {r.duration_ms !== null ? `${r.duration_ms}ms` : '—'}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: 10, textAlign: 'right' }}>
              {new Date(r.started_at).toLocaleTimeString()}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

const filterStyle: React.CSSProperties = {
  padding: '4px 8px', fontSize: 11, borderRadius: 4,
  background: 'var(--surface-base)', border: '1px solid var(--border-subtle)',
  color: 'var(--text-primary)',
};
