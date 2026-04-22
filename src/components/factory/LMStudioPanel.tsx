// LMStudio control panel. Shows which models are loaded + installed,
// lets the operator load/unload with one click, and surfaces the last
// completion test. Live token events flow through the SSE bus feed.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Cpu, Play, Square, Loader2, RefreshCw, Zap, HardDrive, Sparkles } from 'lucide-react';
import { GlassCard, Badge, EmptyState } from '../ui';
import { useLmStudio, type LmStudioModel } from '../../hooks/use-lmstudio';
import { useFactoryStream } from '../../hooks/use-factory';
import { factoryInvoke } from '../../lib/factory-client';

function formatBytes(b?: number): string {
  if (!b && b !== 0) return '—';
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  return `${(b / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function LoadedRow({ m, onUnload, busy }: {
  m: LmStudioModel;
  onUnload: (id: string) => Promise<void>;
  busy: boolean;
}) {
  const [self, setSelf] = useState(false);
  const unload = async () => {
    setSelf(true);
    try { await onUnload(m.identifier); } finally { setSelf(false); }
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderBottom: '1px solid var(--border-subtle)' }}>
      <Zap size={12} color="#10B981" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {m.modelKey || m.identifier}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {m.domain} {m.architecture ? `· ${m.architecture}` : ''} {m.contextLength ? `· ctx ${m.contextLength}` : ''}
        </div>
      </div>
      <button
        type="button"
        onClick={unload}
        disabled={busy || self}
        title="Unload"
        style={{
          background: 'transparent', border: '1px solid var(--border-default)',
          borderRadius: 4, padding: '3px 8px', cursor: (busy || self) ? 'wait' : 'pointer',
          display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)',
        }}
      >
        {self ? <Loader2 size={10} /> : <Square size={10} />} unload
      </button>
    </div>
  );
}

export default function LMStudioPanel() {
  const { snapshot, loading, error, refetch, loadModel, unloadModel, busy } = useLmStudio({ intervalMs: 15_000 });
  const [loadModelKey, setLoadModelKey] = useState('glm-4.7-flash');
  const [selfLoading, setSelfLoading] = useState(false);
  const [lastLoad, setLastLoad] = useState<string | null>(null);

  // Streaming completion test ————————————————————————————————————————
  const [testPrompt, setTestPrompt] = useState('Write a one-line haiku about operators.');
  const [testModel, setTestModel] = useState<string>('');
  const [testRunId, setTestRunId] = useState<string | null>(null);
  const [testOutput, setTestOutput] = useState('');
  const [testing, setTesting] = useState(false);
  const [testDone, setTestDone] = useState(false);
  const testIdRef = useRef<string | null>(null);

  const { events: tokenEvents } = useFactoryStream({
    typePrefix: 'factory.lmstudio.token',
    maxEvents: 2000,
  });

  // Apply new token chunks to the live buffer. We maintain our own accumulator
  // so we don't re-concatenate the full history on every render.
  const lastHandledIndex = useRef(0);
  useEffect(() => {
    if (!testRunId) return;
    const relevant = tokenEvents.filter((e) => e.correlationId === testRunId);
    if (relevant.length <= lastHandledIndex.current) return;
    let buf = testOutput;
    // Events arrive newest-first (useFactoryStream unshifts); iterate oldest-first
    // for the subset we haven't consumed yet.
    const fresh = relevant.slice(0, relevant.length - lastHandledIndex.current).reverse();
    for (const e of fresh) {
      const piece = (e.data as { piece?: string })?.piece ?? '';
      buf += piece;
    }
    lastHandledIndex.current = relevant.length;
    setTestOutput(buf);
  }, [tokenEvents, testRunId, testOutput]);

  const runTest = async () => {
    const model = testModel || snapshot?.loadedLlms[0]?.modelKey || loadModelKey;
    if (!model) return;
    setTesting(true);
    setTestDone(false);
    setTestOutput('');
    lastHandledIndex.current = 0;
    const rid = `lms-test-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    testIdRef.current = rid;
    setTestRunId(rid);
    try {
      await factoryInvoke('lmstudioComplete', { model, prompt: testPrompt, correlationId: rid });
    } finally {
      setTesting(false);
      setTestDone(true);
    }
  };

  const installedModels = useMemo(() => {
    const arr = snapshot?.installed ?? [];
    const loadedIds = new Set((snapshot?.loadedLlms ?? []).map((m) => m.modelKey || m.identifier));
    return arr.map((i: any) => ({
      key: i.modelKey ?? i.identifier ?? i.path ?? 'unknown',
      size: i.sizeBytes,
      loaded: loadedIds.has(i.modelKey ?? i.identifier),
      raw: i,
    }));
  }, [snapshot]);

  const onLoad = async () => {
    setSelfLoading(true);
    setLastLoad(null);
    try {
      const r = await loadModel(loadModelKey);
      setLastLoad(r.ok ? `✓ ${r.identifier ?? loadModelKey}` : `✗ ${r.error ?? 'failed'}`);
    } finally { setSelfLoading(false); }
  };

  const sdkReachable = !!snapshot?.sdkReachable;

  return (
    <GlassCard>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Cpu size={14} /> LMStudio
          <Badge variant="outline" color={sdkReachable ? '#10B981' : '#EF4444'}>
            {sdkReachable ? 'SDK online' : 'SDK offline'}
          </Badge>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>
            {snapshot?.loadedLlms.length ?? 0} loaded · {installedModels.length} installed
          </span>
        </h3>
        <button
          type="button"
          onClick={refetch}
          style={{
            background: 'transparent', border: '1px solid var(--border-default)',
            borderRadius: 4, padding: '3px 8px', color: 'var(--text-muted)',
            cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          <RefreshCw size={11} /> refresh
        </button>
      </div>

      {error && <div style={{ fontSize: 11, color: '#FCA5A5', marginBottom: 8 }}>{error}</div>}

      {/* Quick-load */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 12 }}>
        <input
          value={loadModelKey}
          onChange={(e) => setLoadModelKey(e.target.value)}
          placeholder="model key (e.g. qwen/qwen3-coder-next)"
          style={{
            flex: 1, padding: '6px 8px', fontFamily: 'var(--font-mono)', fontSize: 12,
            background: 'var(--surface-raised)', color: 'var(--text-primary)',
            border: '1px solid var(--border-default)', borderRadius: 4,
          }}
        />
        <button
          type="button"
          onClick={onLoad}
          disabled={selfLoading || !sdkReachable}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '6px 12px', borderRadius: 4,
            background: sdkReachable ? 'var(--color-brand-electric)' : 'var(--surface-raised)',
            color: sdkReachable ? '#000' : 'var(--text-muted)',
            border: 'none', cursor: (selfLoading || !sdkReachable) ? 'wait' : 'pointer',
            fontSize: 12, fontWeight: 600,
          }}
        >
          {selfLoading ? <Loader2 size={12} /> : <Play size={12} />} load
        </button>
      </div>
      {lastLoad && <div style={{ fontSize: 11, color: lastLoad.startsWith('✓') ? '#10B981' : '#FCA5A5', marginBottom: 8 }}>{lastLoad}</div>}

      {/* Loaded models */}
      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
        Loaded ({(snapshot?.loadedLlms.length ?? 0) + (snapshot?.loadedEmbeddings.length ?? 0)})
      </div>
      {(snapshot?.loadedLlms.length ?? 0) + (snapshot?.loadedEmbeddings.length ?? 0) === 0 ? (
        <EmptyState
          title={loading ? 'Probing LMStudio…' : sdkReachable ? 'No models loaded' : 'LMStudio server offline'}
          description={sdkReachable ? 'Enter a model key above and click load.' : 'Start LMStudio: `lms server start`.'}
        />
      ) : (
        <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
          {(snapshot?.loadedLlms ?? []).map((m) => (
            <LoadedRow key={m.identifier} m={m} onUnload={async (id) => { await unloadModel(id); }} busy={busy} />
          ))}
          {(snapshot?.loadedEmbeddings ?? []).map((m) => (
            <LoadedRow key={m.identifier} m={m} onUnload={async (id) => { await unloadModel(id); }} busy={busy} />
          ))}
        </div>
      )}

      {/* Streaming completion test */}
      {sdkReachable && (snapshot?.loadedLlms?.length ?? 0) > 0 && (
        <div style={{ marginTop: 14, borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={11} /> streaming completion test
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <select
              value={testModel || snapshot?.loadedLlms[0]?.modelKey || ''}
              onChange={(e) => setTestModel(e.target.value)}
              style={{ padding: '4px 6px', fontSize: 11, fontFamily: 'var(--font-mono)', background: 'var(--surface-raised)', color: 'var(--text-primary)', border: '1px solid var(--border-default)', borderRadius: 3, flex: '0 0 auto' }}
            >
              {(snapshot?.loadedLlms ?? []).map((m) => (
                <option key={m.identifier} value={m.modelKey}>{m.modelKey}</option>
              ))}
            </select>
            <input value={testPrompt} onChange={(e) => setTestPrompt(e.target.value)}
              placeholder="prompt"
              style={{ flex: 1, padding: '4px 8px', fontSize: 12, background: 'var(--surface-raised)', color: 'var(--text-primary)', border: '1px solid var(--border-default)', borderRadius: 3 }} />
            <button type="button" onClick={runTest} disabled={testing}
              style={{ padding: '4px 10px', fontSize: 11, borderRadius: 3, background: 'var(--color-brand-electric)', color: '#000', border: 'none', cursor: testing ? 'wait' : 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              {testing ? <Loader2 size={11} /> : <Play size={11} />} stream
            </button>
          </div>
          {(testOutput || testing) && (
            <div style={{ padding: 8, borderRadius: 4, background: 'var(--surface-sunken)', fontSize: 12, fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap', minHeight: 40, maxHeight: 240, overflowY: 'auto' }}>
              {testOutput}
              {testing && !testDone && <span style={{ opacity: 0.5 }}>▋</span>}
            </div>
          )}
        </div>
      )}

      {/* Installed (quick reference) */}
      {installedModels.length > 0 && (
        <>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '14px 0 4px' }}>
            Installed ({installedModels.length})
          </div>
          <div style={{ display: 'grid', gap: 3, maxHeight: 220, overflowY: 'auto' }}>
            {installedModels.map((m) => (
              <div
                key={m.key}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, fontSize: 11,
                  padding: '3px 8px', borderRadius: 3,
                  background: m.loaded ? 'rgba(16,185,129,0.07)' : 'transparent',
                  cursor: m.loaded ? 'default' : 'pointer',
                  opacity: m.loaded ? 0.9 : 1,
                }}
                onClick={() => { if (!m.loaded) setLoadModelKey(m.key); }}
                title={m.loaded ? 'already loaded' : 'click to use as load target'}
              >
                <HardDrive size={10} color={m.loaded ? '#10B981' : 'var(--text-muted)'} />
                <span style={{ flex: 1, fontFamily: 'var(--font-mono)' }}>{m.key}</span>
                <span style={{ color: 'var(--text-muted)' }}>{formatBytes(m.size)}</span>
                {m.loaded && <Badge variant="outline" color="#10B981">loaded</Badge>}
              </div>
            ))}
          </div>
        </>
      )}
    </GlassCard>
  );
}
