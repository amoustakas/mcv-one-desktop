// Live Factory bus feed via SSE. Replaces the previous polling version —
// now every side-effect inside the Factory process (process spawn, repo
// file change, job lifecycle, webhook, fabric emission, heartbeat) streams
// to the cockpit in real time.
//
// The component colour-codes events by source domain and renders a chip with
// a collapsible detail drawer per row. Kept under ~200 LOC by reusing the
// shared GlassCard + Badge primitives.

import { useMemo, useState } from 'react';
import {
  CheckCircle2, AlertTriangle, Activity, GitBranch, Cpu, Radio, Webhook, Clock, Loader2,
  ChevronDown, ChevronRight, Trash2, WifiOff, Wifi,
} from 'lucide-react';
import { GlassCard, EmptyState, Badge } from '../ui';
import { useFactoryStream } from '../../hooks/use-factory';
import type { FactoryBusEvent } from '../../lib/factory-client';

const DOMAIN_COLOR: Record<string, string> = {
  process: '#A78BFA',
  repo: '#6EE7B7',
  job: '#F59E0B',
  webhook: '#00F0FF',
  fabric: '#F472B6',
  heartbeat: '#64748B',
  flow: '#FBBF24',
  runtime: '#94A3B8',
  lmstudio: '#8B5CF6',
  oracle: '#00F0FF',
};

function domainOf(type: string): string {
  const parts = type.split('.');
  return parts[1] ?? 'misc';
}

function DomainIcon({ domain }: { domain: string }) {
  const color = DOMAIN_COLOR[domain] ?? 'var(--text-muted)';
  const size = 12;
  switch (domain) {
    case 'process': return <Cpu size={size} color={color} />;
    case 'repo': return <GitBranch size={size} color={color} />;
    case 'job': return <Clock size={size} color={color} />;
    case 'webhook': return <Webhook size={size} color={color} />;
    case 'fabric': return <Radio size={size} color={color} />;
    case 'heartbeat': return <Activity size={size} color={color} />;
    case 'flow': return <CheckCircle2 size={size} color={color} />;
    default: return <AlertTriangle size={size} color={color} />;
  }
}

function formatAgo(iso: string): string {
  const delta = Date.now() - new Date(iso).getTime();
  if (delta < 10_000) return 'just now';
  if (delta < 60_000) return `${Math.floor(delta / 1000)}s ago`;
  if (delta < 3_600_000) return `${Math.floor(delta / 60_000)}m ago`;
  return new Date(iso).toLocaleTimeString();
}

function EventRow({ event }: { event: FactoryBusEvent }) {
  const [open, setOpen] = useState(false);
  const domain = domainOf(event.type);
  return (
    <div
      style={{ borderBottom: '1px solid var(--border-subtle)', padding: '8px 12px', cursor: 'pointer' }}
      onClick={() => setOpen(v => !v)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        <DomainIcon domain={domain} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {event.type}
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {event.source}
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', minWidth: 64, textAlign: 'right' }}>
          {formatAgo(event.ts)}
        </span>
      </div>
      {open && (
        <div style={{ marginTop: 6, paddingLeft: 20, fontSize: 11, color: 'var(--text-muted)' }}>
          {event.correlationId && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, marginBottom: 4 }}>
              <strong>correlationId:</strong> {event.correlationId}
            </div>
          )}
          <pre style={{
            fontFamily: 'var(--font-mono)', fontSize: 10,
            background: 'var(--surface-sunken)', padding: 6, borderRadius: 4,
            marginTop: 4, overflowX: 'auto', maxHeight: 240,
          }}>{JSON.stringify(event.data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default function FactoryEventFeed() {
  const { events, connected, error, reconnect, clear } = useFactoryStream({ maxEvents: 300 });

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const e of events) {
      const d = domainOf(e.type);
      c[d] = (c[d] ?? 0) + 1;
    }
    return c;
  }, [events]);

  return (
    <GlassCard>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          Factory bus
          {connected
            ? <Badge variant="outline" color="#10B981"><Wifi size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} />live</Badge>
            : <Badge variant="outline" color="#EF4444"><WifiOff size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} />disconnected</Badge>
          }
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>
            {events.length} in view
          </span>
        </h3>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {Object.entries(counts).slice(0, 6).map(([d, n]) => (
            <Badge key={d} variant="outline" color={DOMAIN_COLOR[d] ?? undefined}>{d} {n}</Badge>
          ))}
          {!connected && (
            <button
              type="button" onClick={reconnect} title="Reconnect SSE"
              style={{
                background: 'transparent', border: '1px solid var(--border-default)',
                borderRadius: 4, padding: '3px 6px', color: 'var(--text-muted)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 10,
              }}
            >
              <Loader2 size={11} /> reconnect
            </button>
          )}
          <button
            type="button" onClick={clear} title="Clear feed (local only)"
            style={{
              background: 'transparent', border: '1px solid var(--border-default)',
              borderRadius: 4, padding: '3px 6px', color: 'var(--text-muted)',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
            }}
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>
      {error && !connected && (
        <div style={{ fontSize: 11, color: '#FCA5A5', marginBottom: 8 }}>{error}</div>
      )}
      {events.length === 0 ? (
        <EmptyState
          title={connected ? 'Waiting for events…' : 'Not connected'}
          description={connected
            ? 'The Factory is idle. Invoke a flow or let the repo watcher fire.'
            : 'Start the Factory: cd c:/Users/moust/mcv && pnpm dev'}
        />
      ) : (
        <div style={{ borderTop: '1px solid var(--border-subtle)', maxHeight: 520, overflowY: 'auto' }}>
          {events.map((e) => <EventRow key={e.id} event={e} />)}
        </div>
      )}
    </GlassCard>
  );
}
