/**
 * DockerStatsWidget — Live Docker container stats display
 *
 * WidgetContainer-wrapped panel showing KPI strip + container list
 * with CPU/memory bars, status dots, venture badges, and quick actions.
 */

import { useMemo } from 'react';
import {
  Container,
  Cpu,
  HardDrive,
  Network,
  RefreshCw,
  Square,
  RotateCw,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useDockerContainers, useDockerStats, useContainerAction } from '../../hooks/use-docker';
import type { DockerContainer, DockerStats } from '../../lib/docker';
import WidgetContainer from '../ui/WidgetContainer';
import KpiCard from '../ui/KpiCard';
import Badge from '../ui/Badge';
import Skeleton from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';

interface DockerStatsWidgetProps {
  ventureFilter?: string;
  compact?: boolean;
  className?: string;
}

/** Parse CPU percent string like "2.45%" to number */
function parseCpu(s: string): number {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

/** Get color class for CPU threshold */
function cpuColor(pct: number): string {
  if (pct > 80) return 'var(--error)';
  if (pct > 50) return 'var(--warning)';
  return 'var(--success)';
}

/** Map container state to status dot color */
function stateColor(state: DockerContainer['state']): string {
  switch (state) {
    case 'running':
      return 'var(--cyan)';
    case 'exited':
    case 'dead':
      return 'var(--text-muted)';
    case 'paused':
      return 'var(--warning)';
    case 'restarting':
      return 'var(--warning)';
    default:
      return 'var(--text-muted)';
  }
}

/** Find stats entry for a given container */
function findStats(stats: DockerStats[] | undefined, containerId: string): DockerStats | undefined {
  return stats?.find((s) => s.containerId === containerId);
}

export default function DockerStatsWidget({ ventureFilter, compact = false, className }: DockerStatsWidgetProps) {
  const { data: containersData, isLoading: containersLoading, refetch: refetchContainers } = useDockerContainers();
  const { data: statsData, isLoading: statsLoading } = useDockerStats();
  const actionMutation = useContainerAction();

  const isLoading = containersLoading || statsLoading;

  const containers = useMemo(() => {
    if (!containersData?.containers) return [];
    if (!ventureFilter) return containersData.containers;
    return containersData.containers.filter((c) => c.venture === ventureFilter);
  }, [containersData, ventureFilter]);

  const stats = statsData?.stats;

  // Aggregate KPIs
  const kpis = useMemo(() => {
    const running = containers.filter((c) => c.state === 'running').length;
    let totalCpu = 0;
    let totalMem = '';
    const networks = new Set<string>();

    containers.forEach((c) => {
      const s = findStats(stats, c.id);
      if (s) {
        totalCpu += parseCpu(s.cpuPercent);
        // Accumulate unique networks
      }
      if (c.networks) {
        c.networks.split(',').forEach((n) => networks.add(n.trim()));
      }
    });

    // Sum memory from stats
    let memBytes = 0;
    containers.forEach((c) => {
      const s = findStats(stats, c.id);
      if (s?.memUsage) {
        const match = s.memUsage.match(/([\d.]+)\s*(GiB|MiB|KiB|GB|MB|KB)/i);
        if (match) {
          const val = parseFloat(match[1]);
          const unit = match[2].toLowerCase();
          if (unit.startsWith('g')) memBytes += val * 1024;
          else if (unit.startsWith('m')) memBytes += val;
          else if (unit.startsWith('k')) memBytes += val / 1024;
        }
      }
    });

    if (memBytes >= 1024) totalMem = `${(memBytes / 1024).toFixed(1)} GB`;
    else totalMem = `${memBytes.toFixed(0)} MB`;

    return { running, totalCpu: totalCpu.toFixed(1), totalMem, networks: networks.size };
  }, [containers, stats]);

  // Docker not available
  if (containersData && !containersData.available) {
    return (
      <WidgetContainer
        title="Docker Stats"
        icon={<Container size={14} />}
        className={className}
      >
        <EmptyState
          icon={<Container size={32} />}
          title="Docker Desktop is not running"
          description="Start Docker Desktop to monitor containers and infrastructure health."
        />
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer
      title={ventureFilter ? `Docker: ${ventureFilter}` : 'Docker Stats'}
      icon={<Container size={14} />}
      onRefresh={() => refetchContainers()}
      isLoading={isLoading}
      className={className}
    >
      {/* KPI Strip */}
      {!compact && (
        <div className="docker-stats-kpi-strip">
          <KpiCard
            title="Running"
            value={isLoading ? '--' : kpis.running}
            icon={<Container size={13} />}
            size="sm"
            isLoading={isLoading}
          />
          <KpiCard
            title="Total CPU"
            value={isLoading ? '--' : kpis.totalCpu}
            suffix="%"
            icon={<Cpu size={13} />}
            size="sm"
            isLoading={isLoading}
          />
          <KpiCard
            title="Memory"
            value={isLoading ? '--' : kpis.totalMem}
            icon={<HardDrive size={13} />}
            size="sm"
            isLoading={isLoading}
          />
          <KpiCard
            title="Networks"
            value={isLoading ? '--' : kpis.networks}
            icon={<Network size={13} />}
            size="sm"
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Container list */}
      <div className={cn('docker-stats-list', compact && 'docker-stats-list-compact')}>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div className="docker-stats-row" key={i}>
              <Skeleton width={6} height={6} variant="circle" />
              <Skeleton width={120} height={12} />
              <Skeleton width={80} height={12} />
              {!compact && <Skeleton width={60} height={8} />}
              <Skeleton width={50} height={12} />
            </div>
          ))
        ) : containers.length === 0 ? (
          <div className="docker-stats-empty">
            <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
              {ventureFilter ? `No containers for ${ventureFilter}` : 'No containers found'}
            </span>
          </div>
        ) : (
          containers.map((c) => {
            const s = findStats(stats, c.id);
            const cpu = s ? parseCpu(s.cpuPercent) : 0;
            const isRunning = c.state === 'running';
            const isMutating = actionMutation.isPending;

            return (
              <div className="docker-stats-row" key={c.id}>
                {/* Status dot */}
                <span
                  className={cn('docker-stats-dot', isRunning && 'docker-stats-dot-active')}
                  style={{ background: stateColor(c.state) }}
                />

                {/* Container name */}
                <span className="docker-stats-name">{c.name}</span>

                {/* Image (truncated) */}
                <span className="docker-stats-image" title={c.image}>
                  {c.image.length > 28 ? `${c.image.slice(0, 28)}...` : c.image}
                </span>

                {/* CPU bar — hidden in compact mode */}
                {!compact && isRunning && (
                  <span className="docker-stats-cpu-bar-wrap">
                    <span
                      className="docker-stats-cpu-bar"
                      style={{
                        width: `${Math.min(cpu, 100)}%`,
                        background: cpuColor(cpu),
                      }}
                    />
                    <span className="docker-stats-cpu-label">{s?.cpuPercent ?? '0%'}</span>
                  </span>
                )}
                {!compact && !isRunning && (
                  <span className="docker-stats-cpu-bar-wrap">
                    <span className="docker-stats-cpu-label" style={{ color: 'var(--text-muted)' }}>--</span>
                  </span>
                )}

                {/* Memory usage */}
                <span className="docker-stats-mem">
                  {s?.memUsage ?? (isRunning ? '--' : 'stopped')}
                </span>

                {/* Venture badge */}
                {c.venture && (
                  <Badge variant="outline" size="sm">
                    {c.venture}
                  </Badge>
                )}

                {/* Action buttons */}
                <span className="docker-stats-actions">
                  {isRunning ? (
                    <>
                      <button
                        className="docker-stats-action-btn"
                        title="Restart"
                        disabled={isMutating}
                        onClick={() => actionMutation.mutate({ containerId: c.id, action: 'restart' })}
                        type="button"
                      >
                        <RotateCw size={11} />
                      </button>
                      <button
                        className="docker-stats-action-btn docker-stats-action-btn-danger"
                        title="Stop"
                        disabled={isMutating}
                        onClick={() => actionMutation.mutate({ containerId: c.id, action: 'stop' })}
                        type="button"
                      >
                        <Square size={11} />
                      </button>
                    </>
                  ) : (
                    <button
                      className="docker-stats-action-btn docker-stats-action-btn-start"
                      title="Start"
                      disabled={isMutating}
                      onClick={() => actionMutation.mutate({ containerId: c.id, action: 'start' })}
                      type="button"
                    >
                      <RefreshCw size={11} />
                    </button>
                  )}
                </span>
              </div>
            );
          })
        )}
      </div>

      <style>{`
        .docker-stats-kpi-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
          margin-bottom: 12px;
        }
        @media (max-width: 1024px) {
          .docker-stats-kpi-strip { grid-template-columns: repeat(2, 1fr); }
        }

        .docker-stats-list {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .docker-stats-list-compact { gap: 0; }

        .docker-stats-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 8px;
          border-radius: var(--radius-sm);
          transition: background var(--transition-fast);
          min-height: 32px;
        }
        .docker-stats-row:hover { background: var(--bg-hover); }

        .docker-stats-list-compact .docker-stats-row {
          gap: 8px;
          padding: 4px 6px;
          min-height: 26px;
        }

        .docker-stats-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .docker-stats-dot-active {
          box-shadow: 0 0 6px currentColor;
          position: relative;
        }

        .docker-stats-name {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          min-width: 100px;
          max-width: 180px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .docker-stats-image {
          font-size: 11px;
          color: var(--text-muted);
          font-family: var(--font-mono);
          white-space: nowrap;
          min-width: 100px;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .docker-stats-cpu-bar-wrap {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 100px;
          flex-shrink: 0;
        }
        .docker-stats-cpu-bar-wrap {
          height: 4px;
          background: var(--bg-elevated);
          border-radius: 2px;
          position: relative;
          flex: 1;
          max-width: 80px;
        }
        .docker-stats-cpu-bar {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          border-radius: 2px;
          transition: width var(--transition-base);
        }
        .docker-stats-cpu-label {
          font-size: 10px;
          font-family: var(--font-mono);
          color: var(--text-secondary);
          white-space: nowrap;
          position: absolute;
          right: -40px;
          top: -4px;
        }

        .docker-stats-mem {
          font-size: 11px;
          font-family: var(--font-mono);
          color: var(--text-secondary);
          white-space: nowrap;
          min-width: 60px;
          margin-left: auto;
        }

        .docker-stats-actions {
          display: flex;
          gap: 2px;
          flex-shrink: 0;
        }

        .docker-stats-action-btn {
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-sm);
          color: var(--text-muted);
          transition: all var(--transition-fast);
        }
        .docker-stats-action-btn:hover:not(:disabled) {
          background: var(--bg-elevated);
          color: var(--text-primary);
        }
        .docker-stats-action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .docker-stats-action-btn-danger:hover:not(:disabled) { color: var(--error); }
        .docker-stats-action-btn-start:hover:not(:disabled) { color: var(--success); }

        .docker-stats-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
      `}</style>
    </WidgetContainer>
  );
}
