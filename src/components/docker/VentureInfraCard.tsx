/**
 * VentureInfraCard — Compact infrastructure card for a specific venture
 *
 * Shows Docker containers, health status, and quick compose actions
 * for a single venture. Designed for embedding in venture dashboards.
 */

import { useMemo } from 'react';
import { Server, Play, Square } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useDockerContainers, useDockerStats, useComposeAction } from '../../hooks/use-docker';
import type { DockerStats } from '../../lib/docker';
import GlassCard from '../ui/GlassCard';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Skeleton from '../ui/Skeleton';

interface VentureInfraCardProps {
  ventureId: string;
  ventureName: string;
  ventureColor: string;
  className?: string;
}

function parseCpu(s: string): number {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function stateColor(state: string): string {
  switch (state) {
    case 'running': return 'var(--cyan)';
    case 'exited': case 'dead': return 'var(--text-muted)';
    case 'paused': case 'restarting': return 'var(--warning)';
    default: return 'var(--text-muted)';
  }
}

function findStats(stats: DockerStats[] | undefined, containerId: string): DockerStats | undefined {
  return stats?.find((s) => s.containerId === containerId);
}

export default function VentureInfraCard({
  ventureId,
  ventureName,
  ventureColor,
  className,
}: VentureInfraCardProps) {
  const { data: containersData, isLoading: containersLoading } = useDockerContainers();
  const { data: statsData } = useDockerStats();
  const composeMutation = useComposeAction();

  const stats = statsData?.stats;
  const isLoading = containersLoading;

  const containers = useMemo(() => {
    if (!containersData?.containers) return [];
    return containersData.containers.filter((c) => c.venture === ventureId);
  }, [containersData, ventureId]);

  const runningCount = containers.filter((c) => c.state === 'running').length;
  const isHealthy = containers.length > 0 && runningCount === containers.length;
  const hasContainers = containers.length > 0;

  // Docker not available — show muted state
  const dockerUnavailable = containersData && !containersData.available;

  return (
    <GlassCard
      className={cn(
        'venture-infra-card',
        isHealthy && 'venture-infra-card-healthy',
        className,
      )}
      style={{
        '--vic-color': ventureColor,
        '--vic-glow': `${ventureColor}25`,
      } as React.CSSProperties}
    >
      {/* Color accent stripe */}
      <div className="venture-infra-stripe" style={{ background: ventureColor }} />

      {/* Header */}
      <div className="venture-infra-header">
        <Server size={14} style={{ color: ventureColor }} />
        <span className="venture-infra-name">{ventureName}</span>
        {!isLoading && hasContainers && (
          <Badge variant="dot" size="sm" color={isHealthy ? 'var(--success)' : 'var(--warning)'}>
            {runningCount} running
          </Badge>
        )}
      </div>

      {/* Container rows */}
      <div className="venture-infra-body">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div className="venture-infra-row" key={i}>
              <Skeleton width={6} height={6} variant="circle" />
              <Skeleton width={100} height={10} />
              <Skeleton width={40} height={10} />
            </div>
          ))
        ) : dockerUnavailable ? (
          <span className="venture-infra-muted">Docker unavailable</span>
        ) : !hasContainers ? (
          <span className="venture-infra-muted">No infrastructure</span>
        ) : (
          containers.map((c) => {
            const s = findStats(stats, c.id);
            const cpu = s ? parseCpu(s.cpuPercent) : 0;

            return (
              <div className="venture-infra-row" key={c.id}>
                <span
                  className="venture-infra-dot"
                  style={{ background: stateColor(c.state) }}
                />
                <span className="venture-infra-cname">{c.name}</span>
                {c.state === 'running' && (
                  <>
                    <span className="venture-infra-cpu">{cpu.toFixed(1)}%</span>
                    <span className="venture-infra-mem">{s?.memUsage ?? '--'}</span>
                  </>
                )}
                {c.state !== 'running' && (
                  <span className="venture-infra-state">{c.state}</span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer actions */}
      {!dockerUnavailable && (
        <div className="venture-infra-footer">
          <Button
            variant="ghost"
            size="sm"
            icon={<Play size={11} />}
            loading={composeMutation.isPending}
            onClick={() => composeMutation.mutate({ action: 'up' })}
          >
            Start
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<Square size={11} />}
            loading={composeMutation.isPending}
            onClick={() => composeMutation.mutate({ action: 'down' })}
          >
            Stop
          </Button>
        </div>
      )}

      <style>{`
        .venture-infra-card {
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
          transition: border-color var(--transition-base), box-shadow var(--transition-base);
        }
        .venture-infra-card-healthy {
          border-color: var(--vic-glow);
          box-shadow: 0 0 16px var(--vic-glow), 0 0 40px rgba(0, 0, 0, 0.2);
        }

        .venture-infra-stripe {
          height: 2px;
          width: 100%;
          opacity: 0.7;
          flex-shrink: 0;
        }

        .venture-infra-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px 6px;
        }
        .venture-infra-name {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary);
          flex: 1;
        }

        .venture-infra-body {
          padding: 4px 14px 8px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-height: 40px;
        }
        .venture-infra-muted {
          font-size: 11px;
          color: var(--text-muted);
          padding: 6px 0;
        }

        .venture-infra-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 3px 0;
        }

        .venture-infra-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .venture-infra-cname {
          font-size: 11px;
          font-weight: 500;
          color: var(--text-primary);
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .venture-infra-cpu {
          font-size: 10px;
          font-family: var(--font-mono);
          color: var(--text-secondary);
          min-width: 36px;
          text-align: right;
        }
        .venture-infra-mem {
          font-size: 10px;
          font-family: var(--font-mono);
          color: var(--text-muted);
          min-width: 55px;
          text-align: right;
        }
        .venture-infra-state {
          font-size: 10px;
          font-family: var(--font-mono);
          color: var(--text-muted);
          margin-left: auto;
        }

        .venture-infra-footer {
          display: flex;
          gap: 4px;
          padding: 6px 14px 10px;
          border-top: 1px solid var(--border);
        }
      `}</style>
    </GlassCard>
  );
}
