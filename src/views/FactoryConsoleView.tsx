// src/views/FactoryConsoleView.tsx
// Operator cockpit for the Local AI Factory runtime on :7004.
//
// Layout: Health banner + Capabilities + Flow Runner / Event Feed +
//         LMStudio / Docker + StreamDeck / Hotkeys / Audio + Jobs + Run history.
//
// Observability: trackTiming fires on mount (factory_console_mount) and
// per completed flow invocation (factory_flow_run), matching the M5/I2
// analytics surface established for the rest of the cockpit.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import {
  useFactoryHeartbeat,
  useFactoryRunner,
  type FactoryStatus,
  type FlowRunRecord,
} from '../hooks/use-factory';
import { trackTiming } from '../lib/analytics';

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
  // Faster heartbeat polling — this is the primary observe surface.
  const { heartbeat, status, error, refetch, lastFetched } = useFactoryHeartbeat({
    intervalMs: 5_000,
    skipEmit: true,
  });
  const { runs, clear } = useFactoryRunner();

  // Parent-held history: the internal hook keeps its own list too, but
  // mirroring here keeps the UI consistent when FlowRunner pushes a record
  // via onRun. Persistence will be swapped for a Fabric-audit query later.
  const [runRecords, setRunRecords] = useState<FlowRunRecord[]>(runs);
  const combined = useMemo(
    () => (runRecords.length > 0 ? runRecords : runs),
    [runRecords, runs],
  );

  // Track total mount lifetime — how long operators keep the console open per session.
  // Initialized inside useEffect (not at useRef init) to keep render pure per
  // react-hooks/purity lint rule — performance.now() is impure.
  const mountedAtRef = useRef<number | null>(null);
  useEffect(() => {
    mountedAtRef.current = performance.now();
    return () => {
      if (mountedAtRef.current !== null) {
        trackTiming('factory_console_mount', performance.now() - mountedAtRef.current);
      }
    };
  }, []);

  // Per-run latency + status, funneled up from FlowRunner.
  const handleRun = useCallback((record: FlowRunRecord) => {
    setRunRecords((prev) => [record, ...prev.filter((x) => x.id !== record.id)].slice(0, 50));

    if (record.completedAt) {
      const durationMs = record.completedAt - record.startedAt;
      const flowStatus = record.error ? 'failed' : 'succeeded';
      trackTiming('factory_flow_run', durationMs, {
        flowName: record.flowName,
        status: flowStatus,
      });
    }
  }, []);

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
                value={
                  heartbeat.localModels.reachable
                    ? `${heartbeat.localModels.models.length} loaded`
                    : 'unreachable'
                }
                hint={
                  heartbeat.localModels.reachable
                    ? heartbeat.localModels.models.slice(0, 3).join(', ')
                    : heartbeat.localModels.error
                }
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
        <FlowRunner onRun={handleRun} />
        <FactoryEventFeed />
      </GridLayout>

      {/* LMStudio + Docker control */}
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

      {/* Run history spans full width so dossier cards have room to breathe */}
      <div style={{ marginTop: 16 }}>
        <RunHistoryList runs={combined} />
      </div>

      {combined.length > 0 && (
        <div style={{ marginTop: 8, textAlign: 'right' }}>
          <button
            type="button"
            onClick={() => {
              clear();
              setRunRecords([]);
            }}
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

export { FactoryConsoleView };

function StatPair({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span
        style={{
          fontSize: 11, color: 'var(--text-muted)',
          textTransform: 'uppercase', letterSpacing: '0.05em',
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 13, fontWeight: 600 }}>{value}</span>
      {hint && (
        <span
          style={{
            fontSize: 10, color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {hint}
        </span>
      )}
    </div>
  );
}
