import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  GitBranch, Activity, Cloud, Workflow, Database,
  Pause, Play, ExternalLink,
  Globe, Server, Container, Zap,
  RotateCw, Square, Cpu, HardDrive, AlertTriangle,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import { usePipeline, useLocalPipeline } from '../hooks/use-pipeline';
import { useDeviceStore } from '../stores/devices';
import { useDockerContainers, useDockerStats, useContainerAction } from '../hooks/use-docker';
import { PageHeader, PageShell, GlassCard, Badge, Skeleton, Tabs } from '../components/ui';
import ActivityFeed from '../components/ActivityFeed';
import type { ActivityItem } from '../components/ActivityFeed';
import { cn, timeAgo, formatDuration } from '../lib/utils';
import { staggerContainer, fadeInUp } from '../lib/animations';
import { ventures } from '../lib/ventures';
import type { PipelineEntry, PipelineSource } from '../lib/types/pipeline';
import type { DockerContainer, DockerStats } from '../lib/docker';

/* ═══════════════════════════════════════════ */
/* Constants                                   */
/* ═══════════════════════════════════════════ */

const SOURCE_META: Record<PipelineSource, { label: string; icon: React.ReactNode; color: string }> = {
  'claude-session': { label: 'Claude Sessions', icon: <Zap size={14} />, color: 'var(--cyan)' },
  terminal: { label: 'Terminals', icon: <Server size={14} />, color: 'var(--text-secondary)' },
  docker: { label: 'Docker', icon: <Container size={14} />, color: 'var(--core-blue)' },
  github: { label: 'GitHub', icon: <Globe size={14} />, color: 'var(--text-primary)' },
  vercel: { label: 'Vercel', icon: <Cloud size={14} />, color: 'var(--purple)' },
  n8n: { label: 'n8n Workflows', icon: <Workflow size={14} />, color: 'var(--warning)' },
  supabase: { label: 'Supabase', icon: <Database size={14} />, color: 'var(--success)' },
  devices: { label: 'Devices', icon: <Cpu size={14} />, color: '#00F0FF' },
};

const STATUS_DOT: Record<string, string> = {
  active: 'mcv-pipeline-dot-active',
  idle: 'mcv-pipeline-dot-idle',
  error: 'mcv-pipeline-dot-error',
  completed: 'mcv-pipeline-dot-completed',
};

const VENTURE_ALL = '__all__';

/* ═══════════════════════════════════════════ */
/* Sub-components                              */
/* ═══════════════════════════════════════════ */

function PipelineCard({ entry }: { entry: PipelineEntry }) {
  const elapsed = Date.now() - new Date(entry.startedAt).getTime();
  const url = (entry.metadata?.url as string) || null;

  return (
    <motion.div className="mcv-pipeline-card" variants={fadeInUp}>
      <div className={cn('mcv-pipeline-dot', STATUS_DOT[entry.status] || 'mcv-pipeline-dot-idle')} />
      <div className="mcv-pipeline-card-body">
        <div className="mcv-pipeline-card-name" title={entry.name}>{entry.name}</div>
        <div className="mcv-pipeline-card-desc">{entry.description}</div>
        <div className="mcv-pipeline-card-meta">
          <span>{formatDuration(elapsed)}</span>
          <span>{timeAgo(entry.lastActivity)}</span>
          {entry.ventureId && (
            <Badge size="sm">{entry.ventureId}</Badge>
          )}
        </div>
      </div>
      <div className="mcv-pipeline-card-actions">
        {url && (
          <a href={url} target="_blank" rel="noreferrer" className="mcv-widget-action" title="Open">
            <ExternalLink size={12} />
          </a>
        )}
      </div>
    </motion.div>
  );
}

function SourceColumn({ source, entries }: { source: PipelineSource; entries: PipelineEntry[] }) {
  const meta = SOURCE_META[source];
  const activeCount = entries.filter((e) => e.status === 'active').length;

  return (
    <div className="mcv-pipeline-col">
      <div className="mcv-pipeline-col-header">
        <div
          className="mcv-pipeline-col-gradient"
          style={{ background: `linear-gradient(90deg, ${meta.color}, transparent)` }}
        />
        <span style={{ color: meta.color, display: 'flex', alignItems: 'center', gap: 6 }}>
          {meta.icon} {meta.label}
        </span>
        <span className="mcv-pipeline-col-count">
          {activeCount > 0 ? `${activeCount} active` : `${entries.length}`}
        </span>
      </div>
      {entries.length === 0 ? (
        <div style={{ padding: '16px 12px', fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
          No activity
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="mcv-pipeline-col-list">
          {entries.map((entry) => <PipelineCard key={entry.id} entry={entry} />)}
        </motion.div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/* Venture Filter Bar                          */
/* ═══════════════════════════════════════════ */

interface VentureFilterBarProps {
  activeFilter: string;
  onFilterChange: (ventureId: string) => void;
  ventureCounts: Record<string, number>;
}

function VentureFilterBar({ activeFilter, onFilterChange, ventureCounts }: VentureFilterBarProps) {
  const totalCount = Object.values(ventureCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="pipeline-venture-bar">
      <button
        className={cn('pipeline-venture-pill', activeFilter === VENTURE_ALL && 'pipeline-venture-pill-active')}
        onClick={() => onFilterChange(VENTURE_ALL)}
        style={activeFilter === VENTURE_ALL ? { '--pill-color': 'var(--cyan)' } as React.CSSProperties : undefined}
      >
        <span className="pipeline-venture-pill-label">All</span>
        <span className="pipeline-venture-pill-count">{totalCount}</span>
      </button>
      {ventures.map((v) => {
        const count = ventureCounts[v.id] || 0;
        const isActive = activeFilter === v.id;
        return (
          <button
            key={v.id}
            className={cn('pipeline-venture-pill', isActive && 'pipeline-venture-pill-active')}
            onClick={() => onFilterChange(v.id)}
            style={{ '--pill-color': v.color } as React.CSSProperties}
          >
            <span className="pipeline-venture-pill-icon" style={{ background: v.color }}>{v.icon}</span>
            <span className="pipeline-venture-pill-label">{v.name}</span>
            {count > 0 && <span className="pipeline-venture-pill-count">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/* Docker Container Card                       */
/* ═══════════════════════════════════════════ */

function getContainerStatusClass(state: DockerContainer['state']): string {
  switch (state) {
    case 'running': return 'pipeline-docker-status-running';
    case 'exited': case 'dead': return 'pipeline-docker-status-stopped';
    case 'paused': return 'pipeline-docker-status-paused';
    case 'restarting': return 'pipeline-docker-status-restarting';
    default: return 'pipeline-docker-status-created';
  }
}

function DockerContainerCard({
  container,
  stats,
}: {
  container: DockerContainer;
  stats: DockerStats | undefined;
}) {
  const actionMutation = useContainerAction();
  const cpuPercent = stats ? parseFloat(stats.cpuPercent) : 0;
  const ventureMatch = container.venture ? ventures.find((v) => v.id === container.venture) : null;

  const handleAction = useCallback((action: 'restart' | 'stop' | 'start') => {
    actionMutation.mutate({ containerId: container.id, action });
  }, [actionMutation, container.id]);

  return (
    <div className="pipeline-docker-card">
      <div className="pipeline-docker-card-top">
        <span className={cn('pipeline-docker-dot', getContainerStatusClass(container.state))} />
        <span className="pipeline-docker-card-name" title={container.name}>{container.name}</span>
        {ventureMatch && (
          <Badge size="sm" color={ventureMatch.color}>{ventureMatch.name}</Badge>
        )}
      </div>
      <div className="pipeline-docker-card-image">{container.image}</div>
      <div className="pipeline-docker-card-metrics">
        <div className="pipeline-docker-metric">
          <Cpu size={10} />
          <div className="pipeline-docker-cpu-bar">
            <div
              className="pipeline-docker-cpu-fill"
              style={{ width: `${Math.min(cpuPercent, 100)}%` }}
            />
          </div>
          <span className="pipeline-docker-metric-val">{stats?.cpuPercent ?? '--'}</span>
        </div>
        <div className="pipeline-docker-metric">
          <HardDrive size={10} />
          <span className="pipeline-docker-metric-val">{stats?.memUsage ?? '--'}</span>
        </div>
      </div>
      <div className="pipeline-docker-card-actions">
        {container.state === 'running' ? (
          <>
            <button
              className="pipeline-docker-action"
              title="Restart"
              onClick={() => handleAction('restart')}
              disabled={actionMutation.isPending}
            >
              <RotateCw size={11} />
            </button>
            <button
              className="pipeline-docker-action pipeline-docker-action-danger"
              title="Stop"
              onClick={() => handleAction('stop')}
              disabled={actionMutation.isPending}
            >
              <Square size={11} />
            </button>
          </>
        ) : (
          <button
            className="pipeline-docker-action pipeline-docker-action-success"
            title="Start"
            onClick={() => handleAction('start')}
            disabled={actionMutation.isPending}
          >
            <Play size={11} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/* Docker Infrastructure Section               */
/* ═══════════════════════════════════════════ */

function DockerInfraSection({
  ventureFilter,
}: {
  ventureFilter: string;
}) {
  const { data: containersData, isLoading: containersLoading } = useDockerContainers();
  const { data: statsData } = useDockerStats();
  const [expanded, setExpanded] = useState(true);

  const containers = containersData?.containers ?? [];
  const available = containersData?.available ?? false;
  const statsMap = useMemo(() => {
    const map = new Map<string, DockerStats>();
    if (statsData?.stats) {
      for (const s of statsData.stats) {
        map.set(s.containerId, s);
      }
    }
    return map;
  }, [statsData]);

  // Filter by venture if active
  const filteredContainers = useMemo(() => {
    if (ventureFilter === VENTURE_ALL) return containers;
    return containers.filter((c) => c.venture === ventureFilter);
  }, [containers, ventureFilter]);

  const runningCount = filteredContainers.filter((c) => c.state === 'running').length;

  // Aggregate stats
  const totalCpu = useMemo(() => {
    let sum = 0;
    for (const c of filteredContainers) {
      const s = statsMap.get(c.id);
      if (s) sum += parseFloat(s.cpuPercent) || 0;
    }
    return sum;
  }, [filteredContainers, statsMap]);

  const totalMem = useMemo(() => {
    const parts: string[] = [];
    for (const c of filteredContainers) {
      const s = statsMap.get(c.id);
      if (s) parts.push(s.memUsage);
    }
    return parts.length > 0 ? parts.join(' + ') : '--';
  }, [filteredContainers, statsMap]);

  if (containersLoading) {
    return (
      <div className="pipeline-docker-section">
        <div className="pipeline-docker-header">
          <Container size={13} /> Infrastructure
          <Skeleton width={60} height={16} />
        </div>
        <div className="pipeline-docker-grid">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rect" width="100%" height={88} />
          ))}
        </div>
      </div>
    );
  }

  if (!available) {
    return (
      <div className="pipeline-docker-offline">
        <Container size={12} />
        <span>Docker offline</span>
      </div>
    );
  }

  return (
    <div className="pipeline-docker-section">
      <button
        className="pipeline-docker-header"
        onClick={() => setExpanded((p) => !p)}
      >
        <Container size={13} />
        <span>Infrastructure</span>
        <Badge size="sm" color="var(--success)">{runningCount} running</Badge>
        <div className="pipeline-docker-header-stats">
          <span className="pipeline-docker-header-stat">
            <Cpu size={10} /> {totalCpu.toFixed(1)}%
          </span>
          <span className="pipeline-docker-header-stat">
            <HardDrive size={10} /> {totalMem}
          </span>
          <span className="pipeline-docker-header-stat">
            <Container size={10} /> {filteredContainers.length} total
          </span>
        </div>
        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>
      {expanded && (
        <div className="pipeline-docker-grid">
          {filteredContainers.map((c) => (
            <DockerContainerCard
              key={c.id}
              container={c}
              stats={statsMap.get(c.id)}
            />
          ))}
          {filteredContainers.length === 0 && (
            <div style={{ padding: '16px', fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', gridColumn: '1 / -1' }}>
              No containers{ventureFilter !== VENTURE_ALL ? ' for this venture' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/* Enhanced KPI Strip                          */
/* ═══════════════════════════════════════════ */

function KpiStrip({
  entries,
  isPolling,
  dockerSummary,
  totalDockerCpu,
  infraHealth,
}: {
  entries: PipelineEntry[];
  isPolling: boolean;
  dockerSummary: { running: number; total: number; stopped: number } | null;
  totalDockerCpu: number;
  infraHealth: 'green' | 'yellow' | 'red' | null;
}) {
  const active = entries.filter((e) => e.status === 'active').length;
  const errors = entries.filter((e) => e.status === 'error').length;
  const bySource = entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.source] = (acc[e.source] || 0) + 1;
    return acc;
  }, {});

  const healthColor = infraHealth === 'green'
    ? 'var(--success)'
    : infraHealth === 'yellow'
      ? 'var(--warning)'
      : infraHealth === 'red'
        ? 'var(--error)'
        : 'var(--text-muted)';

  return (
    <div className="pipeline-kpi-strip">
      <div className="pipeline-kpi">
        <span className="pipeline-kpi-value" style={{ color: 'var(--cyan)' }}>{active}</span>
        <span className="pipeline-kpi-label">Active</span>
      </div>
      <div className="pipeline-kpi">
        <span className="pipeline-kpi-value">{entries.length}</span>
        <span className="pipeline-kpi-label">Total</span>
      </div>
      {errors > 0 && (
        <div className="pipeline-kpi">
          <span className="pipeline-kpi-value" style={{ color: 'var(--error)' }}>{errors}</span>
          <span className="pipeline-kpi-label">Errors</span>
        </div>
      )}

      {/* Docker KPIs */}
      {dockerSummary && (
        <>
          <div className="pipeline-kpi-separator" />
          <div className="pipeline-kpi">
            <span className="pipeline-kpi-value" style={{ color: 'var(--success)' }}>{dockerSummary.running}</span>
            <span className="pipeline-kpi-label">
              <Container size={10} /> Containers
            </span>
          </div>
          <div className="pipeline-kpi">
            <span className="pipeline-kpi-value">{totalDockerCpu.toFixed(1)}%</span>
            <span className="pipeline-kpi-label">
              <Cpu size={10} /> Total CPU
            </span>
          </div>
          <div className="pipeline-kpi">
            <span className="pipeline-kpi-value" style={{ color: healthColor }}>
              {infraHealth === 'green' ? 'OK' : infraHealth === 'yellow' ? 'WARN' : infraHealth === 'red' ? 'ERR' : '--'}
            </span>
            <span className="pipeline-kpi-label">
              {infraHealth === 'red' ? <AlertTriangle size={10} /> : <Server size={10} />} Infra
            </span>
          </div>
        </>
      )}

      <div className="pipeline-kpi-separator" />

      {Object.entries(bySource).map(([src, count]) => (
        <div key={src} className="pipeline-kpi">
          <span className="pipeline-kpi-value">{count}</span>
          <span className="pipeline-kpi-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {SOURCE_META[src as PipelineSource]?.icon} {SOURCE_META[src as PipelineSource]?.label || src}
          </span>
        </div>
      ))}
      <div className="pipeline-kpi" style={{ marginLeft: 'auto' }}>
        <span className={cn('pipeline-poll-dot', isPolling && 'active')} />
        <span className="pipeline-kpi-label">{isPolling ? 'Live' : 'Paused'}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/* Activity Feed Tabs                          */
/* ═══════════════════════════════════════════ */

type FeedTab = 'all' | 'by-venture' | 'docker';

function PipelineActivitySection({
  entries,
  ventureFilter: _ventureFilter,
}: {
  entries: PipelineEntry[];
  ventureFilter: string;
}) {
  const [feedTab, setFeedTab] = useState<FeedTab>('all');

  const recentEntries = useMemo(() =>
    [...entries]
      .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
      .slice(0, 30),
    [entries]
  );

  const allItems: ActivityItem[] = useMemo(() =>
    recentEntries.map((entry) => {
      const meta = SOURCE_META[entry.source as PipelineSource];
      return {
        id: entry.id,
        icon: meta?.icon ?? <Activity size={14} />,
        title: entry.name,
        description: entry.description,
        timestamp: entry.lastActivity,
        source: entry.source,
        status: entry.status === 'error' ? 'error' as const
          : entry.status === 'active' ? 'active' as const
          : undefined,
        ventureId: entry.ventureId ?? undefined,
      };
    }),
    [recentEntries]
  );

  const dockerItems = useMemo(() =>
    allItems.filter((item) => item.source === 'docker'),
    [allItems]
  );

  // Group by venture
  const ventureGroups = useMemo(() => {
    const groups = new Map<string, ActivityItem[]>();
    for (const item of allItems) {
      const vid = item.ventureId || 'unassigned';
      const list = groups.get(vid) || [];
      list.push(item);
      groups.set(vid, list);
    }
    return groups;
  }, [allItems]);

  const feedTabs = useMemo(() => [
    { id: 'all' as const, label: 'All Activity', count: allItems.length },
    { id: 'by-venture' as const, label: 'By Venture', count: ventureGroups.size },
    { id: 'docker' as const, label: 'Docker Events', count: dockerItems.length },
  ], [allItems.length, ventureGroups.size, dockerItems.length]);

  if (allItems.length === 0) return null;

  return (
    <GlassCard className="pipeline-activity">
      <div className="pipeline-activity-header">
        <h3 className="pipeline-activity-title">
          <Activity size={13} /> Activity Feed
        </h3>
        <Tabs
          tabs={feedTabs}
          active={feedTab}
          onChange={(id) => setFeedTab(id as FeedTab)}
          className="pipeline-activity-tabs"
        />
      </div>

      <div className="pipeline-activity-list">
        {feedTab === 'all' && (
          <ActivityFeed items={allItems} groupByDate compact maxItems={20} />
        )}

        {feedTab === 'by-venture' && (
          <div className="pipeline-venture-feed">
            {Array.from(ventureGroups.entries()).map(([vid, items]) => {
              const v = ventures.find((ven) => ven.id === vid);
              return (
                <div key={vid} className="pipeline-venture-feed-group">
                  <div
                    className="pipeline-venture-feed-header"
                    style={{ borderLeftColor: v?.color ?? 'var(--text-muted)' }}
                  >
                    {v ? (
                      <>
                        <span className="pipeline-venture-feed-icon" style={{ background: v.color }}>{v.icon}</span>
                        {v.name}
                      </>
                    ) : (
                      'Unassigned'
                    )}
                    <Badge size="sm">{items.length}</Badge>
                  </div>
                  <ActivityFeed items={items} compact maxItems={5} />
                </div>
              );
            })}
          </div>
        )}

        {feedTab === 'docker' && (
          <ActivityFeed
            items={dockerItems}
            groupByDate
            compact
            maxItems={20}
          />
        )}
      </div>
    </GlassCard>
  );
}

/* ═══════════════════════════════════════════ */
/* Loading Skeleton                            */
/* ═══════════════════════════════════════════ */

function LoadingSkeleton() {
  return (
    <div className="mcv-pipeline-grid">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="mcv-pipeline-col">
          <Skeleton width={120} height={14} />
          {[1, 2, 3].map((j) => (
            <Skeleton key={j} variant="rect" width="100%" height={72} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/* Main PipelineView                           */
/* ═══════════════════════════════════════════ */

export default function PipelineView() {
  const [paused, setPaused] = useState(false);
  const [ventureFilter, setVentureFilter] = useState(VENTURE_ALL);
  const { data, isLoading, refetch, isFetching } = usePipeline();
  const { data: localData, isLoading: localLoading } = useLocalPipeline();
  const { data: containersData } = useDockerContainers();
  const { data: statsData } = useDockerStats();
  const deviceEventLog = useDeviceStore((s) => s.eventLog);
  const deviceDevices = useDeviceStore((s) => s.devices);

  // Derive device pipeline entries from device event log
  const deviceEntries = useMemo<PipelineEntry[]>(() => {
    const seen = new Map<string, PipelineEntry>();
    for (const evt of deviceEventLog.slice(0, 50)) {
      const device = deviceDevices[evt.deviceId];
      const deviceName = device?.name ?? evt.deviceId;
      const key = `device-${evt.deviceId}`;
      if (!seen.has(key)) {
        seen.set(key, {
          id: key,
          source: 'devices' as PipelineSource,
          name: deviceName,
          description: `${evt.type} — ${JSON.stringify(evt.payload).slice(0, 80)}`,
          status: device?.status === 'connected' ? 'active' : 'completed',
          startedAt: new Date(evt.timestamp).toISOString(),
          lastActivity: new Date(evt.timestamp).toISOString(),
          ventureId: null,
          metadata: { deviceClass: device?.class, transport: device?.transport },
        });
      }
    }
    return Array.from(seen.values());
  }, [deviceEventLog, deviceDevices]);

  const allEntries = [...(data?.entries || []), ...deviceEntries];

  // Apply venture filter to entries
  const entries = useMemo(() => {
    if (ventureFilter === VENTURE_ALL) return allEntries;
    return allEntries.filter((e) => e.ventureId === ventureFilter);
  }, [allEntries, ventureFilter]);

  // Count entries per venture (from unfiltered entries)
  const ventureCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of allEntries) {
      if (e.ventureId) {
        counts[e.ventureId] = (counts[e.ventureId] || 0) + 1;
      }
    }
    // Also count Docker containers
    if (containersData?.containers) {
      for (const c of containersData.containers) {
        if (c.venture) {
          counts[c.venture] = (counts[c.venture] || 0) + 1;
        }
      }
    }
    return counts;
  }, [allEntries, containersData]);

  // Source columns (filtered)
  const columns = useMemo(() => {
    const sourceOrder: PipelineSource[] = ['github', 'vercel', 'n8n', 'claude-session', 'docker', 'terminal', 'supabase', 'devices'];
    const grouped = new Map<PipelineSource, PipelineEntry[]>();
    for (const e of entries) {
      const list = grouped.get(e.source as PipelineSource) || [];
      list.push(e);
      grouped.set(e.source as PipelineSource, list);
    }
    return sourceOrder.filter((s) => grouped.has(s) || s === 'github' || s === 'vercel').map((s) => ({
      source: s,
      entries: (grouped.get(s) || []).sort((a, b) => {
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (b.status === 'active' && a.status !== 'active') return 1;
        return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
      }),
    }));
  }, [entries]);

  // Docker aggregate stats for KPI
  const dockerSummary = useMemo(() => {
    if (!containersData?.available) return null;
    const containers = containersData.containers ?? [];
    const running = containers.filter((c) => c.state === 'running').length;
    const stopped = containers.filter((c) => c.state === 'exited' || c.state === 'dead').length;
    const errored = containers.filter((c) => c.state === 'dead').length;
    return { running, total: containers.length, stopped, errored };
  }, [containersData]);

  const totalDockerCpu = useMemo(() => {
    if (!statsData?.stats) return 0;
    return statsData.stats.reduce((sum, s) => sum + (parseFloat(s.cpuPercent) || 0), 0);
  }, [statsData]);

  const infraHealth = useMemo<'green' | 'yellow' | 'red' | null>(() => {
    if (!dockerSummary) return null;
    if (dockerSummary.errored > 0) return 'red';
    if (dockerSummary.stopped > 0) return 'yellow';
    return 'green';
  }, [dockerSummary]);

  return (
    <PageShell scroll={false}>
      <PageHeader
        icon={<GitBranch size={20} />}
        title="Pipeline"
        count={entries.length}
        loading={isFetching}
        onRefresh={() => refetch()}
      >
        <button
          className={cn('mcv-btn mcv-btn-sm', paused ? 'mcv-btn-primary' : 'mcv-btn-ghost')}
          onClick={() => setPaused(!paused)}
          title={paused ? 'Resume polling' : 'Pause polling'}
        >
          {paused ? <Play size={12} /> : <Pause size={12} />}
          {paused ? 'Resume' : 'Live'}
        </button>
      </PageHeader>

      <div className="pipeline-content">
        {/* KPI Strip */}
        <KpiStrip
          entries={entries}
          isPolling={!paused && !isLoading}
          dockerSummary={dockerSummary}
          totalDockerCpu={totalDockerCpu}
          infraHealth={infraHealth}
        />

        {/* Venture Filter Bar */}
        <VentureFilterBar
          activeFilter={ventureFilter}
          onFilterChange={setVentureFilter}
          ventureCounts={ventureCounts}
        />

        {/* Docker Infrastructure Section */}
        <DockerInfraSection ventureFilter={ventureFilter} />

        {/* Local Machine Data */}
        {localData && (
          <div className="pipeline-local">
            <div className="pipeline-local-header">
              <Server size={13} /> Local Machine
              <Badge color="var(--success)" size="sm">LIVE</Badge>
              <span className="pipeline-local-sub">{localData.stats.commits7d} commits/7d &middot; {localData.stats.worktreeSessions} sessions &middot; {localData.stats.memoryFiles} memories</span>
            </div>
            <div className="pipeline-local-grid">
              {localData.repos.map(r => (
                <GlassCard key={r.name} className="pipeline-repo-card">
                  <div className="pipeline-repo-top">
                    <GitBranch size={12} />
                    <span className="pipeline-repo-name">{r.name}</span>
                    <Badge size="sm" color={r.uncommittedChanges > 0 ? 'var(--warning)' : 'var(--success)'}>{r.branch}</Badge>
                  </div>
                  <div className="pipeline-repo-stats">
                    <span>{r.commitCount7d} commits/7d</span>
                    {r.uncommittedChanges > 0 && <span className="pipeline-repo-uc">{r.uncommittedChanges} uncommitted</span>}
                    {r.lastCommit && <span>{timeAgo(r.lastCommit)}</span>}
                  </div>
                </GlassCard>
              ))}
            </div>
            <div className="pipeline-local-row">
              <div className="pipeline-local-stat"><span className="pipeline-local-val">{localData.stats.projects}</span><span className="pipeline-local-label">Projects</span></div>
              <div className="pipeline-local-stat"><span className="pipeline-local-val">{localData.stats.memoryFiles}</span><span className="pipeline-local-label">Memory Files</span></div>
              <div className="pipeline-local-stat"><span className="pipeline-local-val">{localData.stats.plans}</span><span className="pipeline-local-label">Plans</span></div>
              <div className="pipeline-local-stat"><span className="pipeline-local-val">{localData.stats.worktreeSessions}</span><span className="pipeline-local-label">Worktrees</span></div>
              <div className="pipeline-local-stat"><span className="pipeline-local-val">{localData.stats.uncommittedChanges}</span><span className="pipeline-local-label">Uncommitted</span></div>
            </div>
          </div>
        )}
        {localLoading && <Skeleton variant="rect" height={120} />}

        {/* Source Columns Grid */}
        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <div className="mcv-pipeline-grid" style={{ gridTemplateColumns: `repeat(${Math.min(columns.length, 4)}, 1fr)` }}>
            {columns.map(({ source, entries: colEntries }) => (
              <SourceColumn key={source} source={source} entries={colEntries} />
            ))}
          </div>
        )}

        {/* Activity Feed with Tabs */}
        <PipelineActivitySection entries={entries} ventureFilter={ventureFilter} />
      </div>

      <style>{`
        .pipeline-content {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 0 16px 16px;
        }

        /* ── KPI Strip ── */
        .pipeline-kpi-strip {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 10px 16px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          flex-shrink: 0;
          flex-wrap: wrap;
        }
        .pipeline-kpi {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .pipeline-kpi-value {
          font-family: var(--font-mono);
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1;
        }
        .pipeline-kpi-label {
          font-size: 10px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.3px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 3px;
        }
        .pipeline-kpi-separator {
          width: 1px;
          height: 24px;
          background: var(--border);
          flex-shrink: 0;
        }
        .pipeline-poll-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--text-muted);
        }
        .pipeline-poll-dot.active {
          background: var(--success);
          box-shadow: 0 0 6px rgba(16, 185, 129, 0.5);
          animation: mcv-pulse 2s ease-in-out infinite;
        }

        /* ── Venture Filter Bar ── */
        .pipeline-venture-bar {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 0;
          overflow-x: auto;
          flex-shrink: 0;
          scrollbar-width: thin;
        }
        .pipeline-venture-bar::-webkit-scrollbar {
          height: 3px;
        }
        .pipeline-venture-bar::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 2px;
        }
        .pipeline-venture-pill {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 20px;
          border: 1px solid var(--border);
          background: var(--bg-card);
          color: var(--text-secondary);
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }
        .pipeline-venture-pill:hover {
          border-color: var(--pill-color, var(--cyan));
          color: var(--text-primary);
        }
        .pipeline-venture-pill-active {
          border-color: var(--pill-color, var(--cyan));
          color: var(--text-primary);
          background: color-mix(in srgb, var(--pill-color, var(--cyan)) 12%, var(--bg-card));
          box-shadow: 0 0 8px color-mix(in srgb, var(--pill-color, var(--cyan)) 30%, transparent);
        }
        .pipeline-venture-pill-icon {
          width: 16px;
          height: 16px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 700;
          color: var(--bg-primary);
          flex-shrink: 0;
        }
        .pipeline-venture-pill-label {
          line-height: 1;
        }
        .pipeline-venture-pill-count {
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--text-muted);
          background: rgba(255,255,255,0.06);
          padding: 1px 5px;
          border-radius: 8px;
          line-height: 1.2;
        }

        /* ── Docker Infrastructure Section ── */
        .pipeline-docker-section {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          overflow: hidden;
        }
        .pipeline-docker-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.3px;
          border-bottom: 1px solid var(--border);
          background: transparent;
          border-top: none;
          border-left: none;
          border-right: none;
          width: 100%;
          cursor: pointer;
          text-align: left;
        }
        .pipeline-docker-header:hover {
          background: rgba(255,255,255,0.02);
        }
        .pipeline-docker-header-stats {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-left: auto;
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 400;
          text-transform: none;
          letter-spacing: 0;
          color: var(--text-secondary);
        }
        .pipeline-docker-header-stat {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .pipeline-docker-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          padding: 10px 14px;
        }
        .pipeline-docker-offline {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          font-size: 11px;
          color: var(--text-muted);
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          opacity: 0.7;
        }

        /* Docker container card */
        .pipeline-docker-card {
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          position: relative;
          transition: border-color 0.15s ease;
        }
        .pipeline-docker-card:hover {
          border-color: rgba(255,255,255,0.1);
        }
        .pipeline-docker-card:hover .pipeline-docker-card-actions {
          opacity: 1;
        }
        .pipeline-docker-card-top {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .pipeline-docker-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .pipeline-docker-status-running {
          background: var(--success);
          box-shadow: 0 0 5px rgba(16, 185, 129, 0.4);
        }
        .pipeline-docker-status-stopped {
          background: var(--error);
        }
        .pipeline-docker-status-paused {
          background: var(--warning);
        }
        .pipeline-docker-status-restarting {
          background: var(--cyan);
          animation: mcv-pulse 1.5s ease-in-out infinite;
        }
        .pipeline-docker-status-created {
          background: var(--text-muted);
        }
        .pipeline-docker-card-name {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary);
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .pipeline-docker-card-image {
          font-size: 10px;
          color: var(--text-muted);
          font-family: var(--font-mono);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .pipeline-docker-card-metrics {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .pipeline-docker-metric {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--text-muted);
        }
        .pipeline-docker-metric-val {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--text-secondary);
          white-space: nowrap;
        }
        .pipeline-docker-cpu-bar {
          flex: 1;
          height: 4px;
          background: rgba(255,255,255,0.06);
          border-radius: 2px;
          overflow: hidden;
        }
        .pipeline-docker-cpu-fill {
          height: 100%;
          background: var(--cyan);
          border-radius: 2px;
          transition: width 0.4s ease;
        }
        .pipeline-docker-card-actions {
          display: flex;
          align-items: center;
          gap: 4px;
          position: absolute;
          top: 8px;
          right: 8px;
          opacity: 0;
          transition: opacity 0.15s ease;
        }
        .pipeline-docker-action {
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          border: 1px solid var(--border);
          background: var(--bg-card);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .pipeline-docker-action:hover {
          background: rgba(255,255,255,0.06);
          color: var(--text-primary);
        }
        .pipeline-docker-action:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .pipeline-docker-action-danger:hover {
          border-color: var(--error);
          color: var(--error);
        }
        .pipeline-docker-action-success:hover {
          border-color: var(--success);
          color: var(--success);
        }

        /* ── Activity Feed Section ── */
        .pipeline-activity {
          flex-shrink: 0;
          max-height: 360px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .pipeline-activity-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          gap: 12px;
          flex-wrap: wrap;
        }
        .pipeline-activity-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          color: var(--text-muted);
          margin: 0;
          white-space: nowrap;
        }
        .pipeline-activity-tabs .mcv-tabs {
          gap: 2px;
        }
        .pipeline-activity-tabs .mcv-tab {
          font-size: 10px;
          padding: 3px 8px;
        }
        .pipeline-activity-list {
          overflow-y: auto;
          flex: 1;
        }
        .pipeline-activity-list .mcv-feed-item {
          padding: 6px 14px;
        }

        /* Venture-grouped feed */
        .pipeline-venture-feed {
          display: flex;
          flex-direction: column;
        }
        .pipeline-venture-feed-group {
          border-bottom: 1px solid rgba(255,255,255,0.03);
        }
        .pipeline-venture-feed-group:last-child {
          border-bottom: none;
        }
        .pipeline-venture-feed-header {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary);
          border-left: 3px solid var(--text-muted);
          background: rgba(255,255,255,0.015);
        }
        .pipeline-venture-feed-icon {
          width: 16px;
          height: 16px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          font-weight: 700;
          color: var(--bg-primary);
          flex-shrink: 0;
        }

        /* ── Local Machine Section ── */
        .pipeline-local {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          overflow: hidden;
        }
        .pipeline-local-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.3px;
          border-bottom: 1px solid var(--border);
        }
        .pipeline-local-sub {
          margin-left: auto;
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 400;
          text-transform: none;
          letter-spacing: 0;
        }
        .pipeline-local-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 8px;
          padding: 10px 14px;
        }
        .pipeline-repo-card {
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .pipeline-repo-top {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--text-muted);
        }
        .pipeline-repo-name {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary);
          flex: 1;
        }
        .pipeline-repo-stats {
          display: flex;
          gap: 10px;
          font-size: 10px;
          color: var(--text-muted);
          font-family: var(--font-mono);
        }
        .pipeline-repo-uc {
          color: var(--warning);
        }
        .pipeline-local-row {
          display: flex;
          gap: 24px;
          padding: 10px 16px;
          border-top: 1px solid var(--border);
        }
        .pipeline-local-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }
        .pipeline-local-val {
          font-family: var(--font-mono);
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .pipeline-local-label {
          font-size: 9px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        /* ── Responsive: 4K (>2560px) ── */
        @media (min-width: 2561px) {
          .mcv-pipeline-grid {
            grid-template-columns: repeat(4, 1fr) !important;
          }
          .pipeline-docker-grid {
            grid-template-columns: repeat(4, 1fr);
          }
          .pipeline-content {
            /* Side-by-side layout hint for ultra-wide */
            gap: 14px;
          }
          .pipeline-kpi-strip {
            gap: 28px;
          }
        }

        /* ── 1440p ── */
        @media (max-width: 2560px) and (min-width: 1441px) {
          .pipeline-docker-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        /* ── 1440px ── */
        @media (max-width: 1440px) and (min-width: 1025px) {
          .pipeline-docker-grid {
            grid-template-columns: repeat(3, 1fr);
          }
          .mcv-pipeline-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }

        /* ── 1024px ── */
        @media (max-width: 1024px) {
          .mcv-pipeline-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .pipeline-docker-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .pipeline-kpi-strip {
            gap: 12px;
          }
          .pipeline-docker-header-stats {
            gap: 8px;
          }
        }

        /* ── Mobile (<768px) ── */
        @media (max-width: 768px) {
          .mcv-pipeline-grid {
            grid-template-columns: 1fr !important;
          }
          .pipeline-docker-grid {
            grid-template-columns: 1fr;
          }
          .pipeline-kpi-strip {
            gap: 10px;
            padding: 8px 12px;
            flex-wrap: wrap;
          }
          .pipeline-kpi-value {
            font-size: 14px;
          }
          .pipeline-venture-bar {
            gap: 4px;
          }
          .pipeline-venture-pill {
            padding: 3px 8px;
            font-size: 10px;
          }
          .pipeline-local-grid {
            grid-template-columns: 1fr;
          }
          .pipeline-local-row {
            gap: 12px;
            flex-wrap: wrap;
          }
          .pipeline-activity-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .pipeline-docker-header-stats {
            display: none;
          }
        }
      `}</style>
    </PageShell>
  );
}
