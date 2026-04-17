// src/views/FactoryConsoleView.tsx
// Operator console for the Local AI Factory. Pick a flow → fill input → run → watch the live stream.

import { useState, useEffect, useRef, useCallback } from 'react';
import { useFactoryFlows } from '../hooks/use-factory-flows';
import { useFactoryHeartbeat } from '../hooks/use-factory-heartbeat';
import { FlowPicker } from '../components/factory/FlowPicker';
import { FlowRunner } from '../components/factory/FlowRunner';
import { trackTiming } from '../lib/analytics';

export function FactoryConsoleView() {
  const flowsQ = useFactoryFlows();
  const heartbeatQ = useFactoryHeartbeat();
  const [selectedFlowName, setSelectedFlowName] = useState<string | null>(null);

  // Track total mount lifetime of the console (how long operator has it open per session)
  const mountedAt = useRef(performance.now());
  useEffect(() => {
    const mountStart = mountedAt.current;
    return () => {
      trackTiming('factory_console_mount', performance.now() - mountStart);
    };
  }, []);

  // Bubble up run-completion latency from FlowRunner → trackTiming
  const handleRunComplete = useCallback(
    (flowName: string, status: string, durationMs: number) => {
      trackTiming('factory_flow_run', durationMs, { flowName, status });
    },
    [],
  );

  const flows = flowsQ.data ?? [];
  const selectedFlow = selectedFlowName ? flows.find((f) => f.name === selectedFlowName) ?? null : null;

  const uptime_minutes = heartbeatQ.data ? Math.floor(heartbeatQ.data.uptime_ms / 60_000) : null;
  const online = !heartbeatQ.isError && !!heartbeatQ.data;

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1300, margin: '0 auto' }}>
      <header style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--color-brand-purple)', fontWeight: 700 }}>
            Local AI Factory
          </div>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '2px 8px', borderRadius: 4,
            fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase',
            background: online ? 'color-mix(in srgb, #6EE7B7 15%, transparent)' : 'color-mix(in srgb, #FB7185 15%, transparent)',
            color: online ? '#6EE7B7' : '#FB7185',
          }}>
            {online ? '● online' : '● offline'}
          </span>
        </div>
        <h1 style={{ margin: '4px 0 0', fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>
          Factory Console
        </h1>
        <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
          {online && heartbeatQ.data
            ? `${heartbeatQ.data.local_model ?? 'no local model'}${heartbeatQ.data.gemini_available ? ' + gemini escalation' : ''} · uptime ${uptime_minutes}m · ${heartbeatQ.data.active_runs} active run${heartbeatQ.data.active_runs === 1 ? '' : 's'}`
            : 'factory runtime unreachable — start with `pnpm --dir c:/Users/moust/mcv run genkit:start`'}
        </p>
      </header>

      {flowsQ.isLoading && <div style={{ color: 'var(--text-muted)' }}>Loading flows…</div>}
      {flowsQ.isError && (
        <div style={{ padding: 14, borderRadius: 10, background: 'color-mix(in srgb, #FB7185 12%, transparent)', color: '#FB7185' }}>
          Couldn't reach factory: {flowsQ.error instanceof Error ? flowsQ.error.message : String(flowsQ.error)}
        </div>
      )}

      {!flowsQ.isLoading && !flowsQ.isError && flows.length === 0 && (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-subtle)', borderRadius: 12 }}>
          Factory online but no flows registered yet. Scaffold the first one in <code>c:/Users/moust/mcv/src/flows/</code>.
        </div>
      )}

      {flows.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 300px) minmax(0, 1fr)', gap: 20 }}>
          <aside>
            <FlowPicker flows={flows} selected={selectedFlowName} onSelect={setSelectedFlowName} />
          </aside>
          <main>
            <FlowRunner flow={selectedFlow} onRunComplete={handleRunComplete} />
          </main>
        </div>
      )}
    </div>
  );
}

export default FactoryConsoleView;
