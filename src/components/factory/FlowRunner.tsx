// Flow runner — pick a registered flow, edit JSON input, invoke it.
// Phase 0 UI is deliberately plain: a select + JSON textarea + run button.
// Phase 1 will graduate to per-flow schema-aware forms driven by Zod.

import { useMemo, useState } from 'react';
import { Play, Loader2, ClipboardCopy } from 'lucide-react';
import { GlassCard, Badge } from '../ui';
import { useFactoryFlows, useFactoryRunner, type FlowRunRecord } from '../../hooks/use-factory';

const DEFAULT_INPUTS: Record<string, Record<string, unknown>> = {
  heartbeatPulse: { emit: false },
  researchDossierBuilder: {
    entityName: 'Hunter Milborne',
    domain: 'real-estate-operator',
    depth: 2,
    context: 'Operator prospect from Futurestate intake (M1-T3 seed).',
  },
  oracleSynthesizer: {
    objectiveTitle: 'Complete Risk Management L3',
    currentProgress: 78,
    bottleneckDetected: true,
    domainContext: 'trading',
  },
  repoCrawler: {
    targetDirectory: 'c:\\Users\\moust\\mcv-one-desktop',
    query: 'How is the capital-sdk wired into the investor flow?',
  },
};

export default function FlowRunner({ onRun }: { onRun: (run: FlowRunRecord) => void }) {
  const { flows, loading: flowsLoading, error: flowsError } = useFactoryFlows();
  const { invoke, running } = useFactoryRunner();

  const [selected, setSelected] = useState<string>('heartbeatPulse');
  const [inputText, setInputText] = useState<string>(() =>
    JSON.stringify(DEFAULT_INPUTS.heartbeatPulse ?? {}, null, 2),
  );
  const [parseError, setParseError] = useState<string | null>(null);

  const effectiveFlows = useMemo(() => {
    // Always include common defaults even if /flows hasn't responded yet so
    // the UI is useful before first heartbeat.
    const set = new Set<string>(flows);
    Object.keys(DEFAULT_INPUTS).forEach(k => set.add(k));
    return Array.from(set).sort();
  }, [flows]);

  const onSelect = (name: string) => {
    setSelected(name);
    const tmpl = DEFAULT_INPUTS[name];
    setInputText(JSON.stringify(tmpl ?? {}, null, 2));
    setParseError(null);
  };

  const onInvoke = async () => {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(inputText || '{}');
      if (typeof parsed !== 'object' || parsed === null) throw new Error('Input must be an object');
      setParseError(null);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Invalid JSON');
      return;
    }
    const record = await invoke(selected, parsed);
    onRun(record);
  };

  const copyCurl = async () => {
    const curl = `curl -X POST http://localhost:7004/invoke/${selected} \\
  -H 'Content-Type: application/json' \\
  -d '${inputText.replace(/\n\s*/g, ' ')}'`;
    try { await navigator.clipboard.writeText(curl); } catch { /* ignore */ }
  };

  return (
    <GlassCard>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Flow Runner</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {flowsLoading && <Badge variant="outline">loading flows…</Badge>}
          {flowsError && <Badge variant="outline" color="#EF4444">flows unavailable</Badge>}
          <button
            type="button"
            onClick={copyCurl}
            title="Copy equivalent curl command"
            style={{
              background: 'transparent', border: '1px solid var(--border-default)',
              borderRadius: 4, padding: '4px 8px', color: 'var(--text-muted)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11,
            }}
          >
            <ClipboardCopy size={12} /> curl
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Flow</span>
          <select
            value={selected}
            onChange={e => onSelect(e.target.value)}
            style={{
              padding: '6px 8px', fontSize: 13, borderRadius: 4,
              background: 'var(--surface-raised)', color: 'var(--text-primary)',
              border: '1px solid var(--border-default)',
            }}
          >
            {effectiveFlows.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Input (JSON)</span>
          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            spellCheck={false}
            rows={10}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 12,
              padding: 8, borderRadius: 4, resize: 'vertical',
              background: 'var(--surface-sunken)', color: 'var(--text-primary)',
              border: `1px solid ${parseError ? '#EF4444' : 'var(--border-default)'}`,
            }}
          />
          {parseError && <span style={{ fontSize: 11, color: '#EF4444' }}>{parseError}</span>}
        </label>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onInvoke}
            disabled={running}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 4,
              background: running ? 'var(--surface-raised)' : 'var(--color-brand-electric, #00F0FF)',
              color: running ? 'var(--text-muted)' : '#000',
              border: 'none', cursor: running ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 600,
            }}
          >
            {running ? <Loader2 size={14} className="spin" /> : <Play size={14} />}
            {running ? 'Running…' : 'Invoke'}
          </button>
        </div>
      </div>
    </GlassCard>
  );
}
