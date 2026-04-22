// Docker control panel. Lists containers live, per-row start/stop/restart
// buttons, logs drawer on click. Daemon events stream through the shared
// SSE bus feed — this panel focuses on structured state + direct actions.

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Container, Play, Square, RotateCw, Loader2, RefreshCw, FileText, ChevronDown, ChevronRight, Network, Radio,
} from 'lucide-react';
import { GlassCard, Badge, EmptyState } from '../ui';
import { useFactoryDocker, type FactoryDockerContainer as DockerContainer } from '../../hooks/use-factory-docker';
import { useFactoryStream } from '../../hooks/use-factory';
import { factoryInvoke } from '../../lib/factory-client';

function stateColor(state: string): string {
  if (state === 'running') return '#10B981';
  if (state === 'paused') return '#F59E0B';
  if (state === 'exited' || state === 'dead') return '#64748B';
  return '#94A3B8';
}

function ContainerRow({
  c,
  busy,
  onStart, onStop, onRestart, onLogs,
}: {
  c: DockerContainer;
  busy: boolean;
  onStart: (id: string) => Promise<void>;
  onStop: (id: string) => Promise<void>;
  onRestart: (id: string) => Promise<void>;
  onLogs: (id: string) => Promise<string>;
}) {
  const [open, setOpen] = useState(false);
  const [self, setSelf] = useState(false);
  const [logs, setLogs] = useState<string | null>(null);
  const [follow, setFollow] = useState(false);
  const [followerId, setFollowerId] = useState<string | null>(null);
  const [liveLines, setLiveLines] = useState<string[]>([]);
  const name = c.names[0]?.replace(/^\//, '') ?? c.id.slice(0, 12);
  const running = c.state === 'running';
  const followerIdRef = useRef<string | null>(null);
  followerIdRef.current = followerId;

  // Subscribe to ALL docker log-line events; filter by followerId client-side.
  // Quiet when we're not following so we don't accumulate noise.
  const { events: logEvents } = useFactoryStream({
    typePrefix: 'factory.docker.log_',
    maxEvents: 2000,
  });

  const relevantLines = useMemo(() => {
    if (!followerId) return [];
    // Oldest-first so we append chronologically.
    return logEvents
      .filter((e) => e.correlationId === followerId && e.type === 'factory.docker.log_line')
      .map((e) => (e.data as { line?: string })?.line ?? '')
      .filter(Boolean)
      .reverse();
  }, [logEvents, followerId]);

  useEffect(() => {
    if (!follow || !followerId) return;
    setLiveLines(relevantLines);
  }, [relevantLines, follow, followerId]);

  const wrap = (fn: () => Promise<void>) => async () => {
    setSelf(true);
    try { await fn(); } finally { setSelf(false); }
  };

  const loadLogs = async () => {
    setLogs('Loading…');
    const text = await onLogs(c.id);
    setLogs(text);
  };

  const startFollow = async () => {
    const r = await factoryInvoke<{ ok: boolean; id?: string; error?: string }>('dockerLogFollow', {
      action: 'start',
      containerId: c.id,
      tail: 30,
    });
    const id = r.output?.id;
    if (id) {
      setFollowerId(id);
      setFollow(true);
      setLiveLines([]);
    }
  };

  const stopFollow = async () => {
    const id = followerIdRef.current;
    if (id) {
      await factoryInvoke('dockerLogFollow', { action: 'stop', id });
    }
    setFollow(false);
    setFollowerId(null);
  };

  // Clean up follower when the row closes.
  useEffect(() => {
    if (!open && followerIdRef.current) {
      stopFollow();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => () => {
    if (followerIdRef.current) {
      factoryInvoke('dockerLogFollow', { action: 'stop', id: followerIdRef.current }).catch(() => {});
    }
  }, []);

  return (
    <div style={{ borderBottom: '1px solid var(--border-subtle)', padding: '8px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button type="button" onClick={() => setOpen(v => !v)}
          style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--text-muted)' }}>
          {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        </button>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: stateColor(c.state), flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {name}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {c.image} · {c.status}
          </div>
        </div>
        {c.ports.length > 0 && (
          <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            <Network size={10} color="var(--text-muted)" />
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {c.ports.filter((p: { publicPort?: number }) => p.publicPort).map((p: { privatePort: number; publicPort?: number }) => `${p.publicPort}→${p.privatePort}`).slice(0, 2).join(', ')}
            </span>
          </div>
        )}
        <div style={{ display: 'flex', gap: 4 }}>
          {running ? (
            <>
              <button type="button" disabled={busy || self}
                onClick={wrap(async () => { await onRestart(c.id); })}
                title="Restart"
                style={actionBtn(false)}>
                {self ? <Loader2 size={10} /> : <RotateCw size={10} />}
              </button>
              <button type="button" disabled={busy || self}
                onClick={wrap(async () => { await onStop(c.id); })}
                title="Stop"
                style={actionBtn(false)}>
                <Square size={10} />
              </button>
            </>
          ) : (
            <button type="button" disabled={busy || self}
              onClick={wrap(async () => { await onStart(c.id); })}
              title="Start"
              style={actionBtn(true)}>
              {self ? <Loader2 size={10} /> : <Play size={10} />}
            </button>
          )}
          <button type="button" onClick={() => { setOpen(true); loadLogs(); }}
            title="Logs"
            style={actionBtn(false)}>
            <FileText size={10} />
          </button>
        </div>
      </div>
      {open && (
        <div style={{ marginTop: 6, paddingLeft: 22, fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          <div>id: {c.id.slice(0, 16)}… · created {new Date(c.createdAt).toLocaleString()}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            {!follow ? (
              <button type="button" onClick={startFollow}
                title="Live-follow logs via SSE"
                style={{ background: 'transparent', border: '1px solid var(--color-brand-electric)', color: 'var(--color-brand-electric)', borderRadius: 3, padding: '2px 8px', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Radio size={10} /> follow
              </button>
            ) : (
              <button type="button" onClick={stopFollow}
                title="Stop live follow"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #EF4444', color: '#EF4444', borderRadius: 3, padding: '2px 8px', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Square size={10} /> stop follow
              </button>
            )}
          </div>
          {follow && (
            <pre style={{
              background: 'var(--surface-sunken)', padding: 8, borderRadius: 4, marginTop: 4,
              maxHeight: 320, overflowY: 'auto', fontSize: 10, whiteSpace: 'pre-wrap',
              border: '1px solid rgba(0,240,255,0.3)',
            }}>{liveLines.join('\n') || '(waiting for output…)'}</pre>
          )}
          {!follow && logs !== null && (
            <details open style={{ marginTop: 6 }}>
              <summary style={{ cursor: 'pointer' }}>logs (tail 200)</summary>
              <pre style={{
                background: 'var(--surface-sunken)', padding: 8, borderRadius: 4, marginTop: 4,
                maxHeight: 280, overflowY: 'auto', fontSize: 10, whiteSpace: 'pre-wrap',
              }}>{logs}</pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

function actionBtn(primary: boolean): React.CSSProperties {
  return {
    background: primary ? 'rgba(0,240,255,0.1)' : 'transparent',
    border: '1px solid ' + (primary ? 'var(--color-brand-electric)' : 'var(--border-default)'),
    borderRadius: 3, padding: '3px 6px',
    cursor: 'pointer',
    color: primary ? 'var(--color-brand-electric)' : 'var(--text-muted)',
    display: 'flex', alignItems: 'center',
  };
}

export default function DockerPanel() {
  const { data, loading, error, refetch, start, stop, restart, logs, busy } = useFactoryDocker({ intervalMs: 10_000 });

  return (
    <GlassCard>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Container size={14} /> Docker
          <Badge variant="outline" color={data?.reachable ? '#10B981' : '#EF4444'}>
            {data?.reachable ? `v${data.version ?? '?'}` : 'offline'}
          </Badge>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>
            {data?.containers?.filter(c => c.state === 'running').length ?? 0} running ·
            {' '}{data?.containers?.length ?? 0} total
          </span>
        </h3>
        <button type="button" onClick={refetch}
          style={{
            background: 'transparent', border: '1px solid var(--border-default)',
            borderRadius: 4, padding: '3px 8px', color: 'var(--text-muted)',
            cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4,
          }}>
          <RefreshCw size={11} /> refresh
        </button>
      </div>

      {error && !data?.reachable && <div style={{ fontSize: 11, color: '#FCA5A5', marginBottom: 8 }}>{error}</div>}

      {!data?.containers?.length ? (
        <EmptyState
          title={loading ? 'Probing Docker…' : data?.reachable ? 'No containers' : 'Docker Desktop not reachable'}
          description={data?.reachable ? 'Start one: `docker compose up -d` in any venture repo.' : 'Start Docker Desktop, then click refresh.'}
        />
      ) : (
        <div style={{ borderTop: '1px solid var(--border-subtle)', maxHeight: 500, overflowY: 'auto' }}>
          {data.containers.map((c: DockerContainer) => (
            <ContainerRow
              key={c.id}
              c={c}
              busy={busy}
              onStart={async (id) => { await start(id); }}
              onStop={async (id) => { await stop(id); }}
              onRestart={async (id) => { await restart(id); }}
              onLogs={async (id) => {
                const r = await logs(id, 200);
                return r.logs ?? r.error ?? '(no logs)';
              }}
            />
          ))}
        </div>
      )}
    </GlassCard>
  );
}
