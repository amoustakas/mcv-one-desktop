// Factory Console — cockpit view for the Local AI Factory runtime.
// Plan: C:\Users\moust\.claude\plans\check-out-the-spec-robust-eich.md
//
// Layout:
//   [Health banner — heartbeat summary + jump-to-Genkit-UI link]
//   [Flow Runner]      [Run History]
//   [Future: per-pillar tabs once Phase 1 flows land]

import { useMemo, useState } from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';
import {
  PageHeader, PageShell, GlassCard, GridLayout, Badge, Skeleton,
} from '../components/ui';
import FlowRunner from '../components/factory/FlowRunner';
import RunHistoryList from '../components/factory/RunHistoryList';
import FactoryEventFeed from '../components/factory/FactoryEventFeed';
import FactoryCapabilitiesPanel from '../components/factory/FactoryCapabilitiesPanel';
import FactoryJobsPanel from '../components/factory/FactoryJobsPanel';
import LMStudioPanel from '../components/factory/LMStudioPanel';
import DockerPanel from '../components/factory/DockerPanel';
import StreamDeckPanel from '../components/factory/StreamDeckPanel';
import HotkeysPanel from '../components/factory/HotkeysPanel';
import AudioWidget from '../components/factory/AudioWidget';
import { useFactoryHeartbeat, useFactoryRunner, type FactoryStatus } from '../hooks/use-factory';

const STATUS_LABEL: Record<FactoryStatus, string> = {
  online: 'Online',
  degraded: 'Degraded',
  offline: 'Offline',
  loading: 'Checking…',
};
const STATUS_COLOR: Record<FactoryStatus, string> = {
  online: '#10B981',
  degraded: '#F59E0B',
  offline: '#EF4444',
  loading: '#64748B',
};

export default function FactoryConsoleView() {
  // Faster polling inside the console since this is the primary observe surface.
  const { heartbeat, status, error, refetch, lastFetched } = useFactoryHeartbeat({
    intervalMs: 5_000,
    skipEmit: true,
  });
  const { runs, invoke: _invoke, clear } = useFactoryRunner();

  // The FlowRunner maintains its own runner internally, but we also expose a
  // separate instance here so the parent can render history consistently.
  // To keep history in sync with what's invoked from FlowRunner, we use a
  // parent-held list and let the runner push records via onRun.
  const [runRecords, setRunRecords] = useState(runs);
  const combined = useMemo(() => {
    // Prefer the parent-held list (driven by onRun callback); fall back to
    // the internal hook state if the page is reopened.
    return runRecords.length > 0 ? runRecords : runs;
  }, [runRecords, runs]);

  return (
    <PageShell scroll>
      <PageHeader
        title="Factory Console"
        subtitle="Local AI Factory — Genkit runtime on :7004, feeding the MCV ecosystem"
      >
        <button
          type="button"
          onClick={refetch}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 10px', borderRadius: 4,
            background: 'var(--surface-raised)', color: 'var(--text-primary)',
            border: '1px solid var(--border-default)', cursor: 'pointer', fontSize: 12,
          }}
        >
          <RefreshCw size={12} /> Refresh
        </button>
        <a
          href="http://localhost:4000"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 10px', borderRadius: 4,
            background: 'var(--surface-raised)', color: 'var(--text-primary)',
            border: '1px solid var(--border-default)', textDecoration: 'none', fontSize: 12,
          }}
        >
          <ExternalLink size={12} /> Genkit UI
        </a>
      </PageHeader>

      {/* Health banner */}
      <GlassCard style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              aria-hidden
              style={{
                width: 10, height: 10, borderRadius: '50%',
                background: STATUS_COLOR[status],
                boxShadow: `0 0 8px ${STATUS_COLOR[status]}`,
              }}
            />
            <span style={{ fontWeight: 600, fontSize: 14 }}>{STATUS_LABEL[status]}</span>
          </div>

          {heartbeat ? (
            <>
              <StatPair label="PID" value={String(heartbeat.pid)} />
              <StatPair label="Uptime" value={`${heartbeat.uptimeSec}s`} />
              <StatPair
                label="Local models"
                value={heartbeat.localModels.reachable
                  ? `${heartbeat.localModels.models.length} loaded`
                  : 'unreachable'}
                hint={heartbeat.localModels.reachable
                  ? heartbeat.localModels.models.slice(0, 3).join(', ')
                  : heartbeat.localModels.error}
              />
              <StatPair
                label="Triangle"
                value={heartbeat.triangle.internalSecret ? 'configured' : 'not configured'}
                hint={`Fabric ${heartbeat.triangle.fabric.url} · Intel ${heartbeat.triangle.intelligence.url}`}
              />
              <StatPair
                label="Last heartbeat"
                value={lastFetched ? new Date(lastFetched).toLocaleTimeString() : '—'}
              />
            </>
          ) : (
            <>
              <Skeleton style={{ width: 120, height: 14 }} />
              <Skeleton style={{ width: 120, height: 14 }} />
            </>
          )}

          {error && <Badge variant="outline" color="#EF4444">{error}</Badge>}
        </div>
      </GlassCard>

      {/* Host capabilities — CLIs, repos watched, models, jobs, webhooks, devices */}
      <div style={{ marginBottom: 16 }}>
        <FactoryCapabilitiesPanel />
      </div>

      {/* Top row: Flow Runner + Event Feed */}
      <GridLayout cols={2} gap="md">
        <FlowRunner onRun={r => setRunRecords(prev => [r, ...prev.filter(x => x.id !== r.id)].slice(0, 50))} />
        <FactoryEventFeed />
      </GridLayout>

      {/* LMStudio + Docker control — side by side */}
      <div style={{ marginTop: 16 }}>
        <GridLayout cols={2} gap="md">
          <LMStudioPanel />
          <DockerPanel />
        </GridLayout>
      </div>

      {/* Device I/O: Stream Deck · Hotkeys · Audio */}
      <div style={{ marginTop: 16 }}>
        <GridLayout cols={3} gap="md">
          <StreamDeckPanel />
          <HotkeysPanel />
          <AudioWidget />
        </GridLayout>
      </div>

      {/* Jobs: scheduled cron + one-shot queue */}
      <div style={{ marginTop: 16 }}>
        <FactoryJobsPanel />
      </div>

      {/* Run history below spans full width so dossier cards have room to breathe */}
      <div style={{ marginTop: 16 }}>
        <RunHistoryList runs={combined} />
      </div>

      {combined.length > 0 && (
        <div style={{ marginTop: 8, textAlign: 'right' }}>
          <button
            type="button"
            onClick={() => { clear(); setRunRecords([]); }}
            style={{
              background: 'transparent', border: 'none', color: 'var(--text-muted)',
              fontSize: 11, cursor: 'pointer', textDecoration: 'underline',
            }}
          >
            clear history
          </button>
        </div>
      )}
    </PageShell>
  );
}

function StatPair({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
      <span style={{ fontSize: 13, fontWeight: 600 }}>{value}</span>
      {hint && (
        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {hint}
        </span>
      )}
    </div>
  );
}
