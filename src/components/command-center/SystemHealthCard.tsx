import { useEffect, useState } from 'react';
import { Activity, Cpu, HardDrive, Wifi, Clock } from 'lucide-react';
import { SectionCard, Badge, Tooltip } from '../ui';
import { apiGet } from '../../lib/api/client';

interface HealthPing {
  endpoint: string;
  label: string;
  latency: number | null;
  ok: boolean | null;
}

const PING_TARGETS: { endpoint: string; label: string }[] = [
  { endpoint: '/api/health', label: 'Core API' },
  { endpoint: '/api/dashboard', label: 'Dashboard' },
  { endpoint: '/api/github', label: 'GitHub' },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(0)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

function formatUptime(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

export default function SystemHealthCard() {
  const [pings, setPings] = useState<HealthPing[]>(
    PING_TARGETS.map((t) => ({ endpoint: t.endpoint, label: t.label, latency: null, ok: null })),
  );
  const [uptime, setUptime] = useState(0);
  const [memory, setMemory] = useState<{ used: number; total: number } | null>(null);
  const [pageLoadTs] = useState(() => performance.timing?.navigationStart || Date.now());

  useEffect(() => {
    const measureLatency = async () => {
      const results = await Promise.all(
        PING_TARGETS.map(async (t) => {
          const start = performance.now();
          try {
            await apiGet(t.endpoint);
            return { endpoint: t.endpoint, label: t.label, latency: Math.round(performance.now() - start), ok: true };
          } catch {
            return { endpoint: t.endpoint, label: t.label, latency: Math.round(performance.now() - start), ok: false };
          }
        }),
      );
      setPings(results);
    };

    measureLatency();
    const pingInt = setInterval(measureLatency, 30_000);
    return () => clearInterval(pingInt);
  }, []);

  useEffect(() => {
    const tick = () => setUptime(Date.now() - pageLoadTs);
    tick();
    const int = setInterval(tick, 1000);
    return () => clearInterval(int);
  }, [pageLoadTs]);

  useEffect(() => {
    const perfMemory = (performance as unknown as { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
    if (!perfMemory) return;
    const tick = () => setMemory({ used: perfMemory.usedJSHeapSize, total: perfMemory.jsHeapSizeLimit });
    tick();
    const int = setInterval(tick, 5000);
    return () => clearInterval(int);
  }, []);

  const avgLatency = pings.filter((p) => p.latency !== null).length
    ? Math.round(pings.reduce((acc, p) => acc + (p.latency || 0), 0) / pings.filter((p) => p.latency !== null).length)
    : null;
  const allOk = pings.every((p) => p.ok);
  const anyDown = pings.some((p) => p.ok === false);

  const healthStatus: 'healthy' | 'degraded' | 'down' = anyDown ? 'down' : allOk ? 'healthy' : 'degraded';
  const healthColor = { healthy: '#10B981', degraded: '#F59E0B', down: '#EF4444' }[healthStatus];

  return (
    <SectionCard
      title="System Health"
      icon={<Activity size={14} />}
      action={<Badge color={healthColor} variant="outline" size="sm">{healthStatus.toUpperCase()}</Badge>}
      padding="md"
    >
      <div className="sys-health-grid">
        <div className="sys-health-metric">
          <div className="sys-health-metric-head"><Wifi size={12} /><span>API Latency</span></div>
          <div className="sys-health-metric-value">
            {avgLatency !== null ? (
              <>
                <span className="sys-health-number">{avgLatency}</span>
                <span className="sys-health-unit">ms</span>
              </>
            ) : (
              <span className="sys-health-loading">…</span>
            )}
          </div>
          <div className="sys-health-detail">
            {pings.map((p) => (
              <Tooltip key={p.endpoint} content={p.ok === false ? `${p.label}: unreachable` : `${p.label}: ${p.latency}ms`}>
                <span className={`sys-health-dot ${p.ok === false ? 'down' : p.ok ? 'up' : 'idle'}`} />
              </Tooltip>
            ))}
          </div>
        </div>

        <div className="sys-health-metric">
          <div className="sys-health-metric-head"><HardDrive size={12} /><span>JS Heap</span></div>
          <div className="sys-health-metric-value">
            {memory ? (
              <>
                <span className="sys-health-number">{formatBytes(memory.used)}</span>
                <span className="sys-health-unit">/ {formatBytes(memory.total)}</span>
              </>
            ) : (
              <span className="sys-health-loading">n/a</span>
            )}
          </div>
          {memory && (
            <div className="sys-health-bar">
              <div className="sys-health-bar-fill" style={{ width: `${(memory.used / memory.total) * 100}%` }} />
            </div>
          )}
        </div>

        <div className="sys-health-metric">
          <div className="sys-health-metric-head"><Cpu size={12} /><span>Endpoints</span></div>
          <div className="sys-health-metric-value">
            <span className="sys-health-number">{pings.filter((p) => p.ok).length}</span>
            <span className="sys-health-unit">/ {pings.length} up</span>
          </div>
        </div>

        <div className="sys-health-metric">
          <div className="sys-health-metric-head"><Clock size={12} /><span>Session Uptime</span></div>
          <div className="sys-health-metric-value">
            <span className="sys-health-number">{formatUptime(uptime)}</span>
          </div>
        </div>
      </div>

      <style>{`
        .sys-health-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; }
        .sys-health-metric { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 10px 12px; display: flex; flex-direction: column; gap: 6px; }
        .sys-health-metric-head { display: inline-flex; align-items: center; gap: 6px; font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
        .sys-health-metric-value { display: inline-flex; align-items: baseline; gap: 4px; }
        .sys-health-number { font-family: var(--font-display); font-size: 18px; font-weight: 700; color: var(--text-primary); }
        .sys-health-unit { font-size: 10px; color: var(--text-muted); }
        .sys-health-loading { font-size: 14px; color: var(--text-muted); }
        .sys-health-detail { display: inline-flex; gap: 4px; }
        .sys-health-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--text-muted); }
        .sys-health-dot.up { background: var(--success); box-shadow: 0 0 6px rgba(16,185,129,0.5); }
        .sys-health-dot.down { background: var(--error); box-shadow: 0 0 6px rgba(239,68,68,0.5); }
        .sys-health-bar { height: 3px; background: var(--bg-input); border-radius: var(--radius-full); overflow: hidden; }
        .sys-health-bar-fill { height: 100%; background: linear-gradient(90deg, var(--cyan), var(--purple)); transition: width var(--transition-slow); }
      `}</style>
    </SectionCard>
  );
}
