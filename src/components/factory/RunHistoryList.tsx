// In-memory run history display. Phase 1 will replace this with Fabric audit
// queries so the list survives session reloads.

import { useState } from 'react';
import { CheckCircle2, XCircle, ChevronRight, ChevronDown } from 'lucide-react';
import { GlassCard, EmptyState, Badge } from '../ui';
import type { FlowRunRecord } from '../../hooks/use-factory';
import DossierCard, { isResearchDossierOutput } from './DossierCard';

function formatDuration(ms?: number): string {
  if (!ms) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatAgo(ts: number): string {
  const delta = Date.now() - ts;
  if (delta < 10_000) return 'just now';
  if (delta < 60_000) return `${Math.floor(delta / 1000)}s ago`;
  if (delta < 3_600_000) return `${Math.floor(delta / 60_000)}m ago`;
  return new Date(ts).toLocaleTimeString();
}

function RunRow({ run }: { run: FlowRunRecord }) {
  const [open, setOpen] = useState(false);
  const pending = !run.completedAt;
  const ok = !pending && !run.error;
  const icon = pending
    ? <Badge variant="outline" color="#64748B">running</Badge>
    : ok ? <CheckCircle2 size={14} color="#10B981" /> : <XCircle size={14} color="#EF4444" />;
  const duration = run.completedAt ? formatDuration(run.completedAt - run.startedAt) : '—';

  return (
    <div
      style={{
        borderBottom: '1px solid var(--border-subtle)',
        padding: '10px 12px',
        cursor: 'pointer',
      }}
      onClick={() => setOpen(v => !v)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {icon}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, flex: 1 }}>{run.flowName}</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{duration}</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 72, textAlign: 'right' }}>
          {formatAgo(run.startedAt)}
        </span>
      </div>
      {open && (
        <div style={{ marginTop: 8, paddingLeft: 22 }}>
          <details open style={{ fontSize: 11 }}>
            <summary style={{ cursor: 'pointer', color: 'var(--text-muted)' }}>input</summary>
            <pre style={{
              fontFamily: 'var(--font-mono)', fontSize: 11,
              background: 'var(--surface-sunken)', padding: 8, borderRadius: 4,
              marginTop: 4, overflowX: 'auto',
            }}>{JSON.stringify(run.input, null, 2)}</pre>
          </details>
          {run.error && (
            <div style={{ marginTop: 8, padding: 8, background: 'rgba(239,68,68,0.08)',
                          border: '1px solid rgba(239,68,68,0.25)', borderRadius: 4,
                          fontSize: 11, color: '#FCA5A5' }}>
              <strong>error:</strong> {run.error}
            </div>
          )}
          {run.result?.output !== undefined && (
            <>
              {isResearchDossierOutput(run.result.output) && (
                <div style={{ marginTop: 8 }}>
                  <DossierCard output={run.result.output} />
                </div>
              )}
              <details style={{ fontSize: 11, marginTop: 8 }} open={!isResearchDossierOutput(run.result.output)}>
                <summary style={{ cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {isResearchDossierOutput(run.result.output) ? 'raw output' : 'output'}
                </summary>
                <pre style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11,
                  background: 'var(--surface-sunken)', padding: 8, borderRadius: 4,
                  marginTop: 4, overflowX: 'auto', maxHeight: 360,
                }}>{JSON.stringify(run.result.output, null, 2)}</pre>
              </details>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function RunHistoryList({ runs }: { runs: FlowRunRecord[] }) {
  return (
    <GlassCard>
      <h3 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600 }}>
        Run history
        <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>
          (session only — persistent audit in Phase 1)
        </span>
      </h3>
      {runs.length === 0 ? (
        <EmptyState title="No runs yet" description="Invoke a flow above to see it land here." />
      ) : (
        <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
          {runs.map(r => <RunRow key={r.id} run={r} />)}
        </div>
      )}
    </GlassCard>
  );
}
