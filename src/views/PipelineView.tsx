import { useState, useMemo } from 'react';
import {
  GitBranch, Activity, Cloud, Workflow, Database,
  Pause, Play, ExternalLink,
  Globe, Server, Container, Zap,
} from 'lucide-react';
import { usePipeline, useLocalPipeline } from '../hooks/use-pipeline';
import { PageHeader, PageShell, GlassCard, Badge, Skeleton } from '../components/ui';
import { cn, timeAgo, formatDuration } from '../lib/utils';
import type { PipelineEntry, PipelineSource } from '../lib/types/pipeline';

const SOURCE_META: Record<PipelineSource, { label: string; icon: React.ReactNode; color: string }> = {
  'claude-session': { label: 'Claude Sessions', icon: <Zap size={14} />, color: 'var(--cyan)' },
  terminal: { label: 'Terminals', icon: <Server size={14} />, color: 'var(--text-secondary)' },
  docker: { label: 'Docker', icon: <Container size={14} />, color: 'var(--core-blue)' },
  github: { label: 'GitHub', icon: <Globe size={14} />, color: 'var(--text-primary)' },
  vercel: { label: 'Vercel', icon: <Cloud size={14} />, color: 'var(--purple)' },
  n8n: { label: 'n8n Workflows', icon: <Workflow size={14} />, color: 'var(--warning)' },
  supabase: { label: 'Supabase', icon: <Database size={14} />, color: 'var(--success)' },
};

const STATUS_DOT: Record<string, string> = {
  active: 'mcv-pipeline-dot-active',
  idle: 'mcv-pipeline-dot-idle',
  error: 'mcv-pipeline-dot-error',
  completed: 'mcv-pipeline-dot-completed',
};

function PipelineCard({ entry }: { entry: PipelineEntry }) {
  const elapsed = Date.now() - new Date(entry.startedAt).getTime();
  const url = (entry.metadata?.url as string) || null;

  return (
    <div className="mcv-pipeline-card">
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
    </div>
  );
}

function SourceColumn({ source, entries }: { source: PipelineSource; entries: PipelineEntry[] }) {
  const meta = SOURCE_META[source];
  const activeCount = entries.filter((e) => e.status === 'active').length;

  return (
    <div className="mcv-pipeline-col">
      <div className="mcv-pipeline-col-header">
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
        entries.map((entry) => <PipelineCard key={entry.id} entry={entry} />)
      )}
    </div>
  );
}

function KpiStrip({ entries, isPolling }: { entries: PipelineEntry[]; isPolling: boolean }) {
  const active = entries.filter((e) => e.status === 'active').length;
  const errors = entries.filter((e) => e.status === 'error').length;
  const bySource = entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.source] = (acc[e.source] || 0) + 1;
    return acc;
  }, {});

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

export default function PipelineView() {
  const [paused, setPaused] = useState(false);
  const { data, isLoading, refetch, isFetching } = usePipeline();
  const { data: localData, isLoading: localLoading } = useLocalPipeline();

  const entries = data?.entries || [];

  const columns = useMemo(() => {
    const sourceOrder: PipelineSource[] = ['github', 'vercel', 'n8n', 'claude-session', 'docker', 'terminal', 'supabase'];
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

  const recentActivity = useMemo(() =>
    [...entries]
      .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
      .slice(0, 20),
    [entries]
  );

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
        <KpiStrip entries={entries} isPolling={!paused && !isLoading} />

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

        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <div className="mcv-pipeline-grid" style={{ gridTemplateColumns: `repeat(${Math.min(columns.length, 4)}, 1fr)` }}>
            {columns.map(({ source, entries: colEntries }) => (
              <SourceColumn key={source} source={source} entries={colEntries} />
            ))}
          </div>
        )}

        {recentActivity.length > 0 && (
          <GlassCard className="pipeline-activity">
            <h3 className="pipeline-activity-title">
              <Activity size={13} /> Recent Activity
            </h3>
            <div className="pipeline-activity-list">
              {recentActivity.map((entry) => {
                const meta = SOURCE_META[entry.source as PipelineSource];
                return (
                  <div key={entry.id} className="mcv-feed-item" style={{ borderLeftColor: entry.status === 'error' ? 'var(--error)' : entry.status === 'active' ? 'var(--cyan)' : 'transparent' }}>
                    <div className="mcv-feed-item-icon" style={{ color: meta?.color }}>
                      {meta?.icon || <Activity size={12} />}
                    </div>
                    <div className="mcv-feed-item-body">
                      <div className="mcv-feed-item-title">{entry.name}</div>
                      <div className="mcv-feed-item-desc">{entry.description}</div>
                    </div>
                    <span className="mcv-feed-item-time">{timeAgo(entry.lastActivity)}</span>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        )}
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
        .pipeline-kpi-strip {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 10px 16px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          flex-shrink: 0;
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
        .pipeline-activity {
          flex-shrink: 0;
          max-height: 280px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
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
          padding: 10px 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }
        .pipeline-activity-list {
          overflow-y: auto;
          flex: 1;
        }
        .pipeline-activity-list .mcv-feed-item {
          padding: 6px 14px;
        }

        /* Local Machine Section */
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
      `}</style>
    </PageShell>
  );
}
