// Compact at-a-glance panel showing everything the Factory can do right now.
// Drives directly off `/api/factory?action=capabilities` via useFactoryCapabilities.
//
// Four columns: Host CLIs · Repos watched · Models / Devices · Jobs & webhooks.
// Click-through links take the operator to the full detail view (future) or
// open the external tool.

import { useMemo } from 'react';
import { GlassCard, Badge, Skeleton } from '../ui';
import { useFactoryCapabilities } from '../../hooks/use-factory';
import { CheckCircle2, XCircle } from 'lucide-react';

const SECTION: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 6,
  minWidth: 0,
};

const SECTION_TITLE: React.CSSProperties = {
  fontSize: 10, color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600,
};

const SECTION_COUNT: React.CSSProperties = {
  fontSize: 20, fontWeight: 700, lineHeight: 1,
};

export default function FactoryCapabilitiesPanel() {
  const { capabilities, loading, error, refetch } = useFactoryCapabilities({ intervalMs: 30_000 });

  const cliSummary = useMemo(() => {
    if (!capabilities) return null;
    const entries = Object.entries(capabilities.cli ?? {}) as Array<[string, boolean]>;
    const up = entries.filter(([, v]) => v).map(([k]) => k);
    const down = entries.filter(([, v]) => !v).map(([k]) => k);
    return { up, down, total: entries.length };
  }, [capabilities]);

  if (loading && !capabilities) {
    return (
      <GlassCard>
        <div style={{ display: 'grid', gap: 10 }}>
          <Skeleton style={{ width: '40%', height: 14 }} />
          <Skeleton style={{ width: '100%', height: 40 }} />
        </div>
      </GlassCard>
    );
  }

  if (!capabilities) {
    return (
      <GlassCard>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Capabilities unavailable — Factory not reachable.
          </span>
          <button
            type="button" onClick={refetch}
            style={{
              background: 'transparent', border: '1px solid var(--border-default)',
              borderRadius: 4, padding: '3px 8px', color: 'var(--text-muted)',
              cursor: 'pointer', fontSize: 11,
            }}
          >
            retry
          </button>
        </div>
        {error && <div style={{ fontSize: 10, color: '#FCA5A5', marginTop: 6 }}>{error}</div>}
      </GlassCard>
    );
  }

  const { flows, repos, jobs, webhooks, models, devices } = capabilities;
  const modelsLoadedCount = models.loaded?.length ?? 0;
  const modelsInstalledCount = models.installed?.length ?? 0;
  const devicesConnected = devices.filter((d) => d.status === 'connected').length;

  return (
    <GlassCard>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
          Host capabilities
          <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>
            refreshed {new Date(capabilities.ts).toLocaleTimeString()}
          </span>
        </h3>
        <button
          type="button" onClick={refetch}
          style={{
            background: 'transparent', border: '1px solid var(--border-default)',
            borderRadius: 4, padding: '3px 8px', color: 'var(--text-muted)',
            cursor: 'pointer', fontSize: 11,
          }}
        >
          refresh
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
      }}>
        {/* Flows + Runtime */}
        <div style={SECTION}>
          <span style={SECTION_TITLE}>Runtime</span>
          <span style={SECTION_COUNT}>{flows.length}</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>flows registered</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            pid {capabilities.factory.pid} · uptime {capabilities.factory.uptimeSec}s
          </span>
        </div>

        {/* CLIs */}
        <div style={SECTION}>
          <span style={SECTION_TITLE}>Host CLIs</span>
          <span style={SECTION_COUNT}>
            {cliSummary?.up.length ?? 0}
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>
              {' '}/ {cliSummary?.total ?? 0}
            </span>
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {(cliSummary?.up ?? []).map((n) => (
              <span key={n} title="available" style={cliChipStyle(true)}>
                <CheckCircle2 size={9} /> {n}
              </span>
            ))}
            {(cliSummary?.down ?? []).map((n) => (
              <span key={n} title="not installed" style={cliChipStyle(false)}>
                <XCircle size={9} /> {n}
              </span>
            ))}
          </div>
        </div>

        {/* Repos */}
        <div style={SECTION}>
          <span style={SECTION_TITLE}>Repos watched</span>
          <span style={SECTION_COUNT}>{repos.length}</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {repos.map((r) => (
              <Badge key={r.id} variant="outline">{r.id}</Badge>
            ))}
          </div>
        </div>

        {/* Models */}
        <div style={SECTION}>
          <span style={SECTION_TITLE}>Local models</span>
          <span style={SECTION_COUNT}>
            {modelsLoadedCount}
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>
              {' '}/ {modelsInstalledCount}
            </span>
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>loaded / installed</span>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <Badge variant="outline" color={models.serverReachable ? '#10B981' : '#EF4444'}>
              server {models.serverReachable ? 'up' : 'down'}
            </Badge>
            <Badge variant="outline" color={models.cliAvailable ? '#10B981' : '#64748B'}>
              lms {models.cliAvailable ? 'cli ok' : 'no cli'}
            </Badge>
          </div>
        </div>

        {/* Jobs */}
        <div style={SECTION}>
          <span style={SECTION_TITLE}>Scheduled jobs</span>
          <span style={SECTION_COUNT}>
            {jobs.enabled}
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>
              {' '}/ {jobs.count}
            </span>
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>enabled / total</span>
          {jobs.schedules.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {jobs.schedules.slice(0, 4).map((j) => (
                <Badge key={j.id} variant="outline" color={j.enabled ? '#F59E0B' : '#64748B'}>
                  {j.name}
                </Badge>
              ))}
              {jobs.schedules.length > 4 && (
                <Badge variant="outline">+{jobs.schedules.length - 4}</Badge>
              )}
            </div>
          )}
        </div>

        {/* Webhooks */}
        <div style={SECTION}>
          <span style={SECTION_TITLE}>Webhook handlers</span>
          <span style={SECTION_COUNT}>{webhooks.length}</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {webhooks.map((w) => <Badge key={w} variant="outline" color="#00F0FF">{w}</Badge>)}
            {webhooks.length === 0 && (
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>none registered yet</span>
            )}
          </div>
        </div>

        {/* Devices */}
        <div style={SECTION}>
          <span style={SECTION_TITLE}>Devices declared</span>
          <span style={SECTION_COUNT}>
            {devicesConnected}
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>
              {' '}/ {devices.length}
            </span>
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>connected / declared</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {devices.map((d) => (
              <Badge
                key={d.id}
                variant="outline"
                color={d.status === 'connected' ? '#10B981' : d.status === 'detected' ? '#F59E0B' : '#64748B'}
              >
                {d.id}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function cliChipStyle(up: boolean): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 3,
    padding: '2px 6px', borderRadius: 3, fontSize: 10,
    fontFamily: 'var(--font-mono)',
    background: up ? 'rgba(16,185,129,0.08)' : 'rgba(100,116,139,0.08)',
    color: up ? '#10B981' : 'var(--text-muted)',
    border: `1px solid ${up ? 'rgba(16,185,129,0.25)' : 'rgba(100,116,139,0.25)'}`,
  };
}
