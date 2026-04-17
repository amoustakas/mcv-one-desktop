import { useMemo } from 'react';
import { GitBranch, Cloud, ExternalLink, Activity, TrendingUp, Cpu, AlertTriangle, Brain } from 'lucide-react';
import { InfraOverviewBar } from '../components/docker';
import { ventures } from '../lib/ventures';
import { useGithubCommits } from '../hooks/use-github';
import { useDeployments } from '../hooks/use-deployments';
import { useActivities } from '../hooks/use-crm';
import { useDashboardStats, useAttentionItems, useMorningBrief } from '../hooks/use-dashboard';
import { useRoadmap } from '../hooks/use-orchestration';
import { useAllVentureMetrics, useAllVentureTimeseries } from '../hooks/use-commerce-metrics';
import { PageShell, PageHeader, GlassCard, Badge } from '../components/ui';
import { PinnedKpiStrip } from '../components/pinned-kpi';
import { timeAgo } from '../lib/utils';
import Markdown from '../components/Markdown';
import {
  SystemHealthCard,
  AlertManagementPanel,
  VentureRollupGrid,
  AgentActivityFeed,
  QuickActionsPalette,
  TopCustomersCard,
  CashflowMicroPanel,
  OrderStatusGrid,
  CohortGrid,
  type AttentionItem,
  type VentureRollup,
} from '../components/command-center';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Burning the midnight oil';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Late night session';
}

export default function CommandCenter() {
  // Dashboard data
  const { data: dashboard, isLoading: statsLoading, refetch: refetchStats } = useDashboardStats();
  const { data: attentionItems = [], refetch: refetchAttention } = useAttentionItems();
  const { data: morningBrief, isLoading: briefLoading } = useMorningBrief();

  // Live feeds
  const { data: commits = [], refetch: refetchCommits } = useGithubCommits();
  const { data: deploys = [], refetch: refetchDeploys } = useDeployments();
  const { data: activities = [], refetch: refetchActivities } = useActivities();

  // Orchestration
  const { data: roadmapData } = useRoadmap();
  const epics = roadmapData?.epics || [];
  const activeSessions = roadmapData?.sessions || [];

  const stats = dashboard?.stats;
  const recentActivities = activities.slice(0, 5);
  const recentDeploys = deploys.slice(0, 5);

  // Per-venture rollups — real data from /api/commerce-metrics per venture,
  // with a synthesized fallback for ventures whose query hasn't resolved yet.
  const { byVenture: ventureMetrics } = useAllVentureMetrics('30d');
  const { byVenture: ventureTimeseries } = useAllVentureTimeseries('30d');
  const revenueTrends = useMemo<Record<string, number[]>>(() => {
    const out: Record<string, number[]> = {};
    Object.entries(ventureTimeseries).forEach(([vid, ts]) => {
      if (ts?.series) out[vid] = ts.series.map((p) => p.revenue);
    });
    return out;
  }, [ventureTimeseries]);
  const ventureRollups = useMemo<Record<string, VentureRollup>>(() => {
    const rollups: Record<string, VentureRollup> = {};
    const totalTasks = stats?.tasks.open ?? 0;
    const totalPipeline = stats?.deals.pipelineValue ?? 0;
    const ventureCount = ventures.length;

    ventures.forEach((v) => {
      const metrics = ventureMetrics[v.id];
      const alertsForVenture = attentionItems.filter((a: AttentionItem) =>
        a.title.toLowerCase().includes(v.id),
      ).length;

      if (metrics) {
        // Real data — prefer invoices.overdue + orders.revenue + outstanding AR
        rollups[v.id] = {
          id: v.id,
          openTasks: Math.round(totalTasks / ventureCount), // tasks are not in commerce-metrics yet
          mrr: metrics.subscriptions.mrr_estimate,
          activeAlerts: alertsForVenture + metrics.invoices.overdue_count,
          pipelineValue: metrics.invoices.outstanding_ar || metrics.orders.revenue,
        };
      } else {
        // Fallback — even distribution while the per-venture query is pending
        rollups[v.id] = {
          id: v.id,
          openTasks: Math.round(totalTasks / ventureCount),
          mrr: 0,
          activeAlerts: alertsForVenture,
          pipelineValue: Math.round(totalPipeline / ventureCount),
        };
      }
    });
    return rollups;
  }, [stats, attentionItems, ventureMetrics]);

  const refetchAll = () => {
    refetchStats();
    refetchAttention();
    refetchCommits();
    refetchDeploys();
    refetchActivities();
  };

  const activeVentures = ventures.filter(v => v.status === 'active' || v.status === 'development').length;
  const criticalAttention = attentionItems.filter((i: AttentionItem) => i.severity === 'critical').length;

  return (
    <PageShell scroll>
      {/* Hero Header */}
      <div className="cc-hero">
        <div className="cc-hero-content">
          <div>
            <p className="cc-greeting">{getGreeting()}, Tony</p>
            <PageHeader title="Command Center" loading={statsLoading} onRefresh={refetchAll} />
            <p className="cc-sub">EdgeIQ Holdings &middot; {ventures.length} ventures &middot; {activeVentures} active &middot; {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
          </div>
          {criticalAttention > 0 && (
            <Badge color="#EF4444" variant="outline" size="md">
              <AlertTriangle size={11} /> {criticalAttention} critical
            </Badge>
          )}
        </div>
      </div>

      {/* Infrastructure Status Bar */}
      <InfraOverviewBar />

      {/* Top row: System Health — always visible, quick glance */}
      <div className="cc-row">
        <SystemHealthCard />
      </div>

      {/* Morning Brief */}
      {morningBrief && (
        <GlassCard variant="neural" className="cc-brief">
          <div className="cc-brief-header">
            <Brain size={14} />
            <span className="cc-brief-title">Morning Brief</span>
            {morningBrief.generated && <Badge color="#8B5CF6" size="sm">AI</Badge>}
          </div>
          {briefLoading ? (
            <p className="cc-brief-loading">Generating brief...</p>
          ) : (
            <div className="cc-brief-content">
              <Markdown content={morningBrief.brief} />
            </div>
          )}
        </GlassCard>
      )}

      {/* Alert Management — promoted, full-featured */}
      {attentionItems.length > 0 && (
        <div className="cc-row">
          <AlertManagementPanel items={attentionItems as AttentionItem[]} />
        </div>
      )}

      {/* Pinned KPI Strip — user-customizable, replaces the legacy 9-tile StatCard grid */}
      <div className="cc-kpi-wrap">
        <PinnedKpiStrip suite="command-center" />
      </div>

      {/* Venture Rollups — replaces the old flat venture card list */}
      <div className="cc-row">
        <VentureRollupGrid rollups={ventureRollups} revenueTrends={revenueTrends} />
      </div>

      {/* Cashflow + Order Pipeline — fed by /api/commerce-metrics */}
      <div className="cc-row cc-row-split">
        <CashflowMicroPanel ventureMetrics={ventureMetrics} />
        <OrderStatusGrid ventureMetrics={ventureMetrics} />
      </div>

      {/* Customer Cohort Grid — heatmap by signup month */}
      <div className="cc-row">
        <CohortGrid />
      </div>

      {/* Main grid: Agent Activity + Quick Actions + Live Feeds */}
      <div className="cc-main">
        <div className="cc-col">
          <AgentActivityFeed />
          <QuickActionsPalette />
          <TopCustomersCard ventureMetrics={ventureMetrics} />

          {recentActivities.length > 0 && (
            <div className="cc-section">
              <h2 className="cc-sec-title"><Activity size={12} /> Recent Activity</h2>
              <div className="cc-activity-feed">
                {recentActivities.map((a, i) => (
                  <div key={i} className="cc-act-item">
                    <span className="cc-act-type" style={{ color: a.type === 'call' ? '#10B981' : a.type === 'email' ? '#3B82F6' : a.type === 'meeting' ? '#8B5CF6' : '#F59E0B' }}>{a.type}</span>
                    <span className="cc-act-title">{a.title}</span>
                    {a.contacts?.name && <span className="cc-act-contact">{a.contacts.name}</span>}
                    <span className="cc-act-time">{timeAgo(a.created_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Live Feeds */}
        <div className="cc-col">
          <GlassCard className="cc-feed">
            <h2 className="cc-sec-title"><GitBranch size={12} /> Commits</h2>
            <div className="cc-feed-list">
              {commits.slice(0, 8).map(c => {
                if (!c || !c.sha) return null;
                const firstLine = (c.commit?.message || '(no message)').split('\n')[0];
                const date = c.commit?.author?.date || '';
                return (
                  <a key={c.sha} href={c.html_url || '#'} target="_blank" rel="noreferrer" className="cc-feed-item link">
                    <code className="cc-sha">{c.sha.slice(0, 7)}</code>
                    <span className="cc-feed-msg">{firstLine}</span>
                    <span className="cc-feed-time">{date ? timeAgo(date) : ''}</span>
                  </a>
                );
              })}
            </div>
          </GlassCard>

          <GlassCard className="cc-feed">
            <h2 className="cc-sec-title"><Cloud size={12} /> Deployments</h2>
            <div className="cc-feed-list">
              {recentDeploys.map(d => (
                <a key={d.uid} href={`https://${d.url}`} target="_blank" rel="noreferrer" className="cc-feed-item link">
                  <Badge color={d.state === 'READY' ? '#10B981' : '#F59E0B'} size="sm">{d.state === 'READY' ? 'LIVE' : d.state}</Badge>
                  <span className="cc-feed-msg">{d.name}</span>
                  <span className="cc-feed-time">{d.target || 'preview'}</span>
                  <ExternalLink size={9} />
                </a>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="cc-feed">
            <h2 className="cc-sec-title"><TrendingUp size={12} /> Roadmap <span className="cc-sec-sub">{epics.filter(e => e.status === 'done').length}/{epics.length} epics</span></h2>
            <div className="cc-roadmap">
              {epics.map(e => (
                <div key={e.id} className="cc-epic-row">
                  <span className="cc-epic-status" style={{ color: e.status === 'done' ? 'var(--success)' : e.status === 'in_progress' ? 'var(--cyan)' : 'var(--text-muted)' }}>
                    {e.status === 'done' ? '●' : e.status === 'in_progress' ? '◐' : '○'}
                  </span>
                  <span className="cc-epic-title">{e.title.replace(/^Epic \d+: /, '')}</span>
                  <div className="cc-epic-bar"><div className="cc-epic-fill" style={{ width: `${e.completion || 0}%`, background: e.status === 'done' ? 'var(--success)' : 'var(--cyan)' }} /></div>
                </div>
              ))}
            </div>
          </GlassCard>

          {activeSessions.length > 0 && (
            <GlassCard className="cc-feed">
              <h2 className="cc-sec-title"><Cpu size={12} /> Active Sessions <span className="cc-sec-sub">{activeSessions.length} live</span></h2>
              <div className="cc-sessions">
                {activeSessions.map(s => (
                  <div key={s.id} className="cc-session-row">
                    <span className="cc-session-dot" />
                    <div className="cc-session-info">
                      <span className="cc-session-project">{s.project}</span>
                      <span className="cc-session-summary">{s.summary || 'Active session'}</span>
                    </div>
                    <span className="cc-session-time">{timeAgo(s.last_active)}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>
      </div>

      <style>{`
        .cc-hero { padding:20px 24px 16px; position:relative; }
        .cc-hero::after { content:""; position:absolute; bottom:0; left:24px; right:24px; height:1px; background:linear-gradient(90deg, transparent, rgba(0,240,255,0.12), transparent); }
        .cc-hero-content { display:flex; justify-content:space-between; align-items:flex-start; }
        .cc-greeting { font-size:13px; color:var(--cyan); font-weight:500; margin-bottom:2px; text-shadow:0 0 10px rgba(0,240,255,0.3); }
        .cc-sub { font-size:11px; color:var(--text-muted); margin-top:2px; }
        .cc-sec-sub { font-size:9px; color:var(--text-muted); font-family:var(--font-mono); margin-left:auto; font-weight:400; text-transform:none; letter-spacing:0; }

        .cc-row { padding: 0 24px; margin-bottom: 14px; }
        .cc-row-split { display: grid; grid-template-columns: minmax(360px, 1fr) minmax(420px, 1.2fr); gap: 16px; }
        @media (max-width: 1200px) { .cc-row-split { grid-template-columns: 1fr; } }
        .cc-kpi-wrap { padding: 0 24px; margin-bottom: 14px; }

        .cc-brief { margin:0 24px 14px; padding:14px 18px; }
        .cc-brief-header { display:flex; align-items:center; gap:8px; margin-bottom:8px; color:var(--text-muted); }
        .cc-brief-title { font-family:var(--font-display); font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; }
        .cc-brief-loading { font-size:11px; color:var(--text-muted); font-style:italic; }
        .cc-brief-content { font-size:12px; line-height:1.6; color:var(--text-secondary); }
        .cc-brief-content p { margin:4px 0; }
        .cc-brief-content ul { padding-left:16px; margin:4px 0; }
        .cc-brief-content li { margin:2px 0; }
        .cc-brief-content strong { color:var(--text-primary); }

        .cc-main { display:grid; grid-template-columns:1fr 400px; gap:16px; padding:0 24px 24px; flex:1; min-height:0; }
        @media (max-width:1400px) { .cc-main { grid-template-columns:1fr; } }
        .cc-col { display:flex; flex-direction:column; gap:14px; }
        .cc-section { }
        .cc-sec-title { font-family:var(--font-display); font-size:11px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; margin-bottom:8px; display:flex; align-items:center; gap:6px; }

        .cc-activity-feed { display:flex; flex-direction:column; gap:2px; }
        .cc-act-item { display:flex; align-items:center; gap:8px; padding:6px 10px; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-sm); font-size:11px; }
        .cc-act-type { font-size:8px; font-weight:700; text-transform:uppercase; width:45px; flex-shrink:0; }
        .cc-act-title { flex:1; color:var(--text-secondary); overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
        .cc-act-contact { font-size:10px; color:var(--text-muted); flex-shrink:0; }
        .cc-act-time { font-size:9px; color:var(--text-muted); font-family:var(--font-mono); flex-shrink:0; }

        .cc-feed { overflow:hidden; }
        .cc-feed .cc-sec-title { padding:8px 12px; margin:0; border-bottom:1px solid var(--border); }
        .cc-feed-list { max-height:180px; overflow-y:auto; }
        .cc-feed-item { display:flex; align-items:center; gap:8px; padding:5px 12px; border-bottom:1px solid var(--border); font-size:11px; }
        .cc-feed-item:last-child { border-bottom:none; }
        .cc-feed-item.link { text-decoration:none; transition:background 0.1s; }
        .cc-feed-item.link:hover { background:var(--bg-elevated); }
        .cc-sha { font-family:var(--font-mono); font-size:10px; color:var(--cyan); background:var(--bg-surface); padding:1px 5px; border-radius:3px; flex-shrink:0; }
        .cc-feed-msg { flex:1; color:var(--text-secondary); overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
        .cc-feed-time { font-size:9px; color:var(--text-muted); font-family:var(--font-mono); flex-shrink:0; }

        .cc-roadmap { padding:4px 12px; display:flex; flex-direction:column; gap:4px; }
        .cc-epic-row { display:flex; align-items:center; gap:8px; font-size:11px; padding:3px 0; }
        .cc-epic-status { font-size:10px; flex-shrink:0; width:14px; text-align:center; }
        .cc-epic-title { flex:1; color:var(--text-secondary); overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
        .cc-epic-bar { width:50px; height:4px; background:var(--bg-elevated); border-radius:2px; overflow:hidden; flex-shrink:0; }
        .cc-epic-fill { height:100%; border-radius:2px; transition:width 0.3s; }

        .cc-sessions { padding:4px 12px; display:flex; flex-direction:column; gap:6px; }
        .cc-session-row { display:flex; align-items:center; gap:8px; font-size:11px; }
        .cc-session-dot { width:6px; height:6px; border-radius:50%; background:var(--success); flex-shrink:0; box-shadow:0 0 6px rgba(16,185,129,0.5); animation:mcv-pulse 2s ease-in-out infinite; }
        .cc-session-info { flex:1; min-width:0; }
        .cc-session-project { display:block; font-weight:600; color:var(--text-primary); }
        .cc-session-summary { display:block; font-size:10px; color:var(--text-muted); overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
        .cc-session-time { font-size:9px; font-family:var(--font-mono); color:var(--text-muted); flex-shrink:0; }
        @keyframes mcv-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </PageShell>
  );
}
