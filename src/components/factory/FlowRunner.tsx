// src/components/factory/FlowRunner.tsx
import { useMemo, useState, useEffect, useRef } from 'react';
import { useStartFactoryRun, useFactoryRun } from '../../hooks/use-factory-run';
import { useFactoryRunStream } from '../../hooks/use-factory-run';
import type { FactoryFlow } from '../../lib/factory-client';
import { RunStatusBadge } from './RunStatusBadge';

interface Props {
  flow: FactoryFlow | null;
  /** Optional callback fired when a run reaches a terminal state (succeeded/failed/cancelled). */
  onRunComplete?: (flowName: string, status: string, durationMs: number) => void;
}

export function FlowRunner({ flow, onRunComplete }: Props) {
  const [inputText, setInputText] = useState('{\n  \n}');
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const start = useStartFactoryRun();
  const runQ = useFactoryRun(activeRunId);
  const stream = useFactoryRunStream(activeRunId);

  // Track run latency: capture performance.now() when run is kicked off,
  // fire onRunComplete when the polled status reaches a terminal state.
  const runStartRef = useRef<number | null>(null);
  const reportedRunIdRef = useRef<string | null>(null);

  useEffect(() => {
    const status = runQ.data?.status;
    const terminal = status === 'succeeded' || status === 'failed' || status === 'cancelled';
    if (
      terminal &&
      activeRunId &&
      activeRunId !== reportedRunIdRef.current &&
      runStartRef.current !== null &&
      onRunComplete &&
      flow
    ) {
      reportedRunIdRef.current = activeRunId;
      onRunComplete(flow.name, status, performance.now() - runStartRef.current);
    }
  }, [runQ.data?.status, activeRunId, flow, onRunComplete]);

  const schemaHint = useMemo(() => {
    if (!flow) return '';
    try {
      return JSON.stringify(flow.input_schema, null, 2);
    } catch {
      return '(schema unavailable)';
    }
  }, [flow]);

  const onRun = async () => {
    if (!flow) return;
    setParseError(null);
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(inputText);
    } catch (e) {
      setParseError(e instanceof Error ? e.message : String(e));
      return;
    }
    try {
      runStartRef.current = performance.now();
      const res = await start.mutateAsync({ flowName: flow.name, input: parsed });
      setActiveRunId(res.run_id);
    } catch (e) {
      setParseError(e instanceof Error ? e.message : String(e));
    }
  };

  if (!flow) {
    return (
      <div style={{ padding: 20, color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', border: '1px dashed var(--border-subtle)', borderRadius: 10 }}>
        Pick a flow to run.
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <header>
        <div style={{ fontSize: 10, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--color-brand-electric)', fontWeight: 700 }}>
          {flow.pillar} · flow
        </div>
        <h3 style={{ margin: '4px 0 0', fontSize: 16, fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)' }}>{flow.name}</h3>
        {flow.description && <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>{flow.description}</p>}
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <label style={{ display: 'grid', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
          input (JSON — matches the flow's Zod schema)
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={10}
            spellCheck={false}
            style={{ padding: 10, borderRadius: 6, background: 'var(--surface-base)', border: `1px solid ${parseError ? '#FB7185' : 'var(--border-subtle)'}`, color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: 11 }}
          />
          {parseError && <span style={{ color: '#FB7185', fontSize: 11 }}>{parseError}</span>}
        </label>

        <label style={{ display: 'grid', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
          expected shape
          <pre style={{ margin: 0, padding: 10, borderRadius: 6, background: 'var(--surface-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: 11, overflow: 'auto', maxHeight: 220 }}>
            {schemaHint}
          </pre>
        </label>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={onRun}
          disabled={start.isPending}
          style={{ padding: '10px 16px', borderRadius: 8, background: 'var(--color-brand-electric)', color: 'var(--surface-base)', border: 'none', cursor: 'pointer', fontWeight: 700 }}
        >
          {start.isPending ? 'Starting…' : 'Run flow'}
        </button>
        {activeRunId && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{activeRunId.slice(0, 8)}…</span>}
        {runQ.data && <RunStatusBadge status={runQ.data.status} />}
        {stream.connected && <span style={{ fontSize: 10, color: '#6EE7B7', letterSpacing: '.1em' }}>● live</span>}
      </div>

      {activeRunId && (
        <div style={{ padding: 12, borderRadius: 10, background: 'var(--surface-elevated)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 10, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
            stream · {stream.events.length} events
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto', display: 'grid', gap: 3, fontSize: 11, fontFamily: 'monospace' }}>
            {stream.events.slice(-30).map((ev, i) => (
              <div key={i} style={{ color: 'var(--text-primary)', opacity: 0.9 }}>
                <span style={{ color: 'var(--color-brand-purple)' }}>[{ev.type}]</span>{' '}
                {ev.type === 'token' ? (ev as { text: string }).text
                  : ev.type === 'tool_call' ? `${(ev as { tool_name: string }).tool_name}(…)`
                  : ev.type === 'error' ? `${(ev as { code: string; message: string }).code}: ${(ev as { message: string }).message}`
                  : ev.type === 'complete' ? '✓ complete'
                  : JSON.stringify((ev as Record<string, unknown>))
                }
              </div>
            ))}
          </div>
          {stream.error && <div style={{ marginTop: 8, padding: 8, borderRadius: 6, background: '#FB718520', color: '#FB7185', fontSize: 11 }}>{stream.error.message}</div>}
        </div>
      )}

      {runQ.data?.result && runQ.data.status === 'succeeded' && (
        <div style={{ padding: 14, borderRadius: 10, background: 'color-mix(in srgb, #6EE7B7 8%, transparent)', border: '1px solid #6EE7B740' }}>
          <div style={{ fontSize: 10, letterSpacing: '.15em', textTransform: 'uppercase', color: '#6EE7B7', fontWeight: 700, marginBottom: 8 }}>
            result
          </div>
          <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: 11, color: 'var(--text-primary)', overflow: 'auto', maxHeight: 300 }}>
            {JSON.stringify(runQ.data.result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
