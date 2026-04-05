/**
 * InfraOverviewBar — Compact horizontal infrastructure health bar
 *
 * Single 28px-height row showing Docker status, container count,
 * total CPU/memory, and key service health dots (Postgres, Redis, n8n).
 * Designed to fit inside PageHeader or any compact strip area.
 */

import { useMemo } from 'react';
import { Container, Database, Zap, Workflow } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useDockerContainers, useDockerStats } from '../../hooks/use-docker';
import type { DockerStats } from '../../lib/docker';
import Skeleton from '../ui/Skeleton';

interface InfraOverviewBarProps {
  className?: string;
  onClick?: () => void;
}

/** Check if a known service is among running containers */
function findService(
  containers: { name: string; state: string }[],
  patterns: string[],
): 'running' | 'stopped' | 'missing' {
  const match = containers.find((c) =>
    patterns.some((p) => c.name.toLowerCase().includes(p)),
  );
  if (!match) return 'missing';
  return match.state === 'running' ? 'running' : 'stopped';
}

function serviceColor(status: 'running' | 'stopped' | 'missing'): string {
  switch (status) {
    case 'running': return 'var(--success)';
    case 'stopped': return 'var(--text-muted)';
    case 'missing': return 'var(--text-muted)';
  }
}

function parseCpu(s: string): number {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

export default function InfraOverviewBar({ className, onClick }: InfraOverviewBarProps) {
  const { data: containersData, isLoading: containersLoading } = useDockerContainers();
  const { data: statsData, isLoading: statsLoading } = useDockerStats();

  const isLoading = containersLoading || statsLoading;
  const containers = containersData?.containers ?? [];
  const stats = statsData?.stats ?? [];
  const available = containersData?.available ?? false;

  const metrics = useMemo(() => {
    const running = containers.filter((c) => c.state === 'running').length;

    let totalCpu = 0;
    let memMB = 0;
    stats.forEach((s: DockerStats) => {
      totalCpu += parseCpu(s.cpuPercent);
      const match = s.memUsage?.match(/([\d.]+)\s*(GiB|MiB|KiB|GB|MB|KB)/i);
      if (match) {
        const val = parseFloat(match[1]);
        const unit = match[2].toLowerCase();
        if (unit.startsWith('g')) memMB += val * 1024;
        else if (unit.startsWith('m')) memMB += val;
        else if (unit.startsWith('k')) memMB += val / 1024;
      }
    });

    const totalMem = memMB >= 1024
      ? `${(memMB / 1024).toFixed(1)} GB`
      : `${memMB.toFixed(0)} MB`;

    return { running, totalCpu: totalCpu.toFixed(1), totalMem };
  }, [containers, stats]);

  // Service detection
  const postgres = findService(containers, ['postgres', 'postgresql', 'pg', 'supabase-db']);
  const redis = findService(containers, ['redis', 'upstash', 'valkey']);
  const n8n = findService(containers, ['n8n']);

  if (isLoading) {
    return (
      <div className={cn('infra-bar', className)}>
        <Skeleton width={120} height={12} />
        <Skeleton width={80} height={12} />
        <Skeleton width={80} height={12} />
      </div>
    );
  }

  return (
    <div
      className={cn('infra-bar', onClick && 'infra-bar-clickable', className)}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Docker overall status */}
      <span className="infra-bar-item">
        <span
          className="infra-bar-dot"
          style={{ background: available ? 'var(--success)' : 'var(--error)' }}
        />
        <Container size={11} />
        <span className="infra-bar-label">Docker</span>
      </span>

      {available && (
        <>
          {/* Container count */}
          <span className="infra-bar-item">
            <span className="infra-bar-value">{metrics.running}</span>
            <span className="infra-bar-label">containers</span>
          </span>

          {/* Divider */}
          <span className="infra-bar-divider" />

          {/* CPU */}
          <span className="infra-bar-item">
            <span className="infra-bar-value">{metrics.totalCpu}%</span>
            <span className="infra-bar-label">CPU</span>
          </span>

          {/* Memory */}
          <span className="infra-bar-item">
            <span className="infra-bar-value">{metrics.totalMem}</span>
            <span className="infra-bar-label">RAM</span>
          </span>

          {/* Divider */}
          <span className="infra-bar-divider" />

          {/* Services */}
          <span className="infra-bar-item">
            <span className="infra-bar-dot" style={{ background: serviceColor(postgres) }} />
            <Database size={10} />
            <span className="infra-bar-label">Postgres</span>
          </span>

          <span className="infra-bar-item">
            <span className="infra-bar-dot" style={{ background: serviceColor(redis) }} />
            <Zap size={10} />
            <span className="infra-bar-label">Redis</span>
          </span>

          <span className="infra-bar-item">
            <span className="infra-bar-dot" style={{ background: serviceColor(n8n) }} />
            <Workflow size={10} />
            <span className="infra-bar-label">n8n</span>
          </span>
        </>
      )}

      {!available && (
        <span className="infra-bar-label" style={{ color: 'var(--error)' }}>
          Not running
        </span>
      )}

      <style>{`
        .infra-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          height: 28px;
          padding: 0 12px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          font-size: 11px;
          white-space: nowrap;
          overflow: hidden;
        }
        .infra-bar-clickable {
          cursor: pointer;
          transition: border-color var(--transition-fast);
        }
        .infra-bar-clickable:hover { border-color: var(--border-active); }

        .infra-bar-item {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
          color: var(--text-secondary);
        }

        .infra-bar-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .infra-bar-value {
          font-family: var(--font-mono);
          font-weight: 600;
          font-size: 11px;
          color: var(--text-primary);
        }

        .infra-bar-label {
          font-size: 10px;
          color: var(--text-muted);
          letter-spacing: 0.2px;
        }

        .infra-bar-divider {
          width: 1px;
          height: 14px;
          background: var(--border);
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}
