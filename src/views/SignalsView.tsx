import { useState, useMemo, useCallback } from 'react';
import {
  Radio,
  Zap,
  GitBranch,
  GitCommit,
  GitPullRequest,
  Cloud,
  CheckSquare,
  Megaphone,
  Activity,
  Cpu,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useGithubCommits, useGithubPRs } from '../hooks/use-github';
import { useDeployments } from '../hooks/use-deployments';
import { useTasks } from '../hooks/use-tasks';
import { useCampaigns } from '../hooks/use-campaigns';
import {
  PageHeader,
  PageShell,
  Badge,
  KpiCard,
  GridLayout,
  GlassCard,
  Tabs,
  WidgetContainer,
} from '../components/ui';
import ActivityFeed from '../components/ActivityFeed';
import type { ActivityItem } from '../components/ActivityFeed';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../lib/motion/variants';
import SparkLine from '../components/charts/SparkLine';
import McvDonutChart from '../components/charts/DonutChart';
import McvBarChart from '../components/charts/BarChart';
import { ventures } from '../lib/ventures';
import { useDeviceStore } from '../stores/devices';

/* ─── Types ────────────────────────────────────────────────── */

type SignalTab = 'all' | 'code' | 'deploys' | 'tasks' | 'devices';

/* ─── Venture color map ─────────────────────────────────────── */

const ventureColorMap: Record<string, string> = {};
for (const v of ventures) {
  ventureColorMap[v.id] = v.color;
}

function resolveVentureName(id?: string): string | undefined {
  if (!id) return undefined;
  const v = ventures.find((x) => x.id === id);
  return v?.name;
}

/* ─── Helpers ──────────────────────────────────────────────── */

function mapDeployStatus(state: string): ActivityItem['status'] {
  switch (state.toUpperCase()) {
    case 'READY':
      return 'success';
    case 'ERROR':
    case 'CANCELED':
      return 'error';
    case 'BUILDING':
    case 'QUEUED':
    case 'INITIALIZING':
      return 'active';
    default:
      return 'warning';
  }
}

function mapTaskStatus(status: string): ActivityItem['status'] {
  switch (status.toLowerCase()) {
    case 'done':
    case 'completed':
      return 'success';
    case 'in_progress':
    case 'active':
      return 'active';
    case 'blocked':
    case 'overdue':
      return 'error';
    default:
      return 'warning';
  }
}

function mapPRStatus(state: string): ActivityItem['status'] {
  switch (state.toLowerCase()) {
    case 'open':
      return 'active';
    case 'closed':
      return 'success';
    default:
      return 'warning';
  }
}

/** Guess venture from repo name (best-effort heuristic). */
function ventureFromRepo(repoName: string): string | undefined {
  const lower = repoName.toLowerCase();
  for (const v of ventures) {
    if (lower.includes(v.id)) return v.id;
    if (lower.includes(v.name.toLowerCase().replace(/\s+/g, '-'))) return v.id;
  }
  return undefined;
}

/** Build 7-day commit histogram from commit dates. */
function buildCommitHistogram(
  commits: { commit: { author: { date: string } } }[],
): number[] {
  const now = Date.now();
  const bins = [0, 0, 0, 0, 0, 0, 0]; // index 0 = 7 days ago ... index 6 = today
  for (const c of commits) {
    const age = now - new Date(c.commit.author.date).getTime();
    const daysAgo = Math.floor(age / 86_400_000);
    if (daysAgo >= 0 && daysAgo < 7) {
      bins[6 - daysAgo]++;
    }
  }
  return bins;
}

/** Build venture-level activity counts from all signal items. */
function buildVentureActivity(items: ActivityItem[]): Record<string, unknown>[] {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const vId = item.ventureId || 'other';
    counts[vId] = (counts[vId] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 9)
    .map(([id, count]) => ({
      venture: resolveVentureName(id) || id,
      count,
    }));
}

/* ─── Component ────────────────────────────────────────────── */

export default function SignalsView() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<SignalTab>('all');

  /* Data hooks */
  const { data: rawCommits = [], isLoading: commitsLoading } = useGithubCommits();
  const { data: rawPRs = [], isLoading: prsLoading } = useGithubPRs();
  const { data: rawDeploys = [], isLoading: deploysLoading } = useDeployments();
  const { data: rawTasks = [], isLoading: tasksLoading } = useTasks();
  const { data: rawCampaigns = [], isLoading: campaignsLoading } = useCampaigns();

  const loading =
    commitsLoading || prsLoading || deploysLoading || tasksLoading || campaignsLoading;

  /* ── Derived: activity items by type ───────────────────── */

  const commitItems = useMemo<ActivityItem[]>(
    () =>
      rawCommits.slice(0, 30).map((c) => {
        const repo = c.html_url?.split('/').slice(3, 5).join('/') ?? '';
        const vId = ventureFromRepo(repo);
        return {
          id: `commit-${c.sha}`,
          icon: <GitCommit size={14} />,
          title: c.commit.message.split('\n')[0],
          description: `${repo} · ${c.commit.author.name}`,
          timestamp: c.commit.author.date,
          source: 'GitHub',
          status: 'active' as const,
          ventureId: vId,
        };
      }),
    [rawCommits],
  );

  const prItems = useMemo<ActivityItem[]>(
    () =>
      rawPRs.slice(0, 20).map((pr) => {
        const repo = pr.html_url?.split('/').slice(3, 5).join('/') ?? '';
        const vId = ventureFromRepo(repo);
        return {
          id: `pr-${pr.number}`,
          icon: <GitPullRequest size={14} />,
          title: pr.title,
          description: `#${pr.number} · ${pr.user.login} · ${pr.state}`,
          timestamp: pr.updated_at,
          source: 'GitHub',
          status: mapPRStatus(pr.state),
          ventureId: vId,
        };
      }),
    [rawPRs],
  );

  const deployItems = useMemo<ActivityItem[]>(
    () =>
      rawDeploys.slice(0, 20).map((d) => ({
        id: `deploy-${d.uid}`,
        icon: <Cloud size={14} />,
        title: `${d.name} → ${d.target || 'preview'}`,
        description: `${d.state} · ${d.meta?.githubCommitMessage?.split('\n')[0] || d.url || ''}`,
        timestamp: new Date(d.created).toISOString(),
        source: 'Vercel',
        status: mapDeployStatus(d.state),
        ventureId: ventureFromRepo(d.name),
      })),
    [rawDeploys],
  );

  const taskItems = useMemo<ActivityItem[]>(
    () =>
      rawTasks.slice(0, 20).map((t) => ({
        id: `task-${t.id}`,
        icon: <CheckSquare size={14} />,
        title: t.title,
        description: `${t.status} · ${t.assignee || 'unassigned'} · ${t.priority}`,
        timestamp: t.created_at,
        source: 'Tasks',
        status: mapTaskStatus(t.status),
        ventureId: t.venture_id,
      })),
    [rawTasks],
  );

  /* ── Device events as signals ──────────────────────────── */

  const deviceEventLog = useDeviceStore((s) => s.eventLog);
  const deviceDevices = useDeviceStore((s) => s.devices);

  const deviceItems = useMemo<ActivityItem[]>(
    () =>
      deviceEventLog.slice(0, 30).map((evt) => {
        const device = deviceDevices[evt.deviceId];
        const deviceName = device?.name ?? evt.deviceId;
        const isConnect = evt.type === 'button-press' || device?.status === 'connected';
        const statusBadge: ActivityItem['status'] = isConnect ? 'success' : 'warning';
        let title = `${deviceName}: ${evt.type}`;
        let description = JSON.stringify(evt.payload).slice(0, 100);

        // Enrich description based on event type
        if (evt.type === 'agent-message') {
          title = `${deviceName}: agent session activity`;
          description = String(evt.payload?.message ?? evt.payload?.prompt ?? description);
        }

        return {
          id: `device-${evt.id}`,
          icon: <Cpu size={14} style={{ color: '#00F0FF' }} />,
          title,
          description,
          timestamp: new Date(evt.timestamp).toISOString(),
          source: 'Devices',
          status: statusBadge,
        };
      }),
    [deviceEventLog, deviceDevices],
  );

  /* ── Combined + sorted feed ────────────────────────────── */

  const codeItems = useMemo(
    () =>
      [...commitItems, ...prItems].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      ),
    [commitItems, prItems],
  );

  const allItems = useMemo(
    () =>
      [...commitItems, ...prItems, ...deployItems, ...taskItems, ...deviceItems].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      ),
    [commitItems, prItems, deployItems, taskItems, deviceItems],
  );

  const feedItems = useMemo(() => {
    switch (activeTab) {
      case 'code':
        return codeItems;
      case 'deploys':
        return deployItems;
      case 'tasks':
        return taskItems;
      case 'devices':
        return deviceItems;
      default:
        return allItems;
    }
  }, [activeTab, allItems, codeItems, deployItems, taskItems, deviceItems]);

  /* ── KPI numbers ───────────────────────────────────────── */

  const activePRs = rawPRs.filter((pr) => pr.state === 'open').length;
  const recentDeploys = rawDeploys.length;
  const openTasks = rawTasks.filter(
    (t) => t.status !== 'done' && t.status !== 'completed',
  ).length;
  const activeCampaigns = rawCampaigns.filter(
    (c) => c.status === 'active' || c.status === 'running',
  ).length;

  /* ── Chart data ────────────────────────────────────────── */

  const commitSpark = useMemo(() => buildCommitHistogram(rawCommits), [rawCommits]);

  const deployDonut = useMemo(() => {
    const success = rawDeploys.filter(
      (d) => d.state.toUpperCase() === 'READY',
    ).length;
    const error = rawDeploys.filter(
      (d) => d.state.toUpperCase() === 'ERROR' || d.state.toUpperCase() === 'CANCELED',
    ).length;
    const building = rawDeploys.filter(
      (d) =>
        d.state.toUpperCase() === 'BUILDING' ||
        d.state.toUpperCase() === 'QUEUED' ||
        d.state.toUpperCase() === 'INITIALIZING',
    ).length;
    return [
      { name: 'Success', value: success, color: 'var(--success)' },
      { name: 'Error', value: error, color: 'var(--error)' },
      { name: 'Building', value: building, color: 'var(--cyan)' },
    ].filter((d) => d.value > 0);
  }, [rawDeploys]);

  const ventureBarData = useMemo(
    () => buildVentureActivity(allItems),
    [allItems],
  );

  const deploySuccessRate = useMemo(() => {
    if (!rawDeploys.length) return '--';
    const success = rawDeploys.filter(
      (d) => d.state.toUpperCase() === 'READY',
    ).length;
    return `${Math.round((success / rawDeploys.length) * 100)}%`;
  }, [rawDeploys]);

  /* ── Tab config ────────────────────────────────────────── */

  const tabs = useMemo(
    () => [
      { id: 'all' as const, label: 'All', count: allItems.length },
      { id: 'code' as const, label: 'Code', count: codeItems.length },
      { id: 'deploys' as const, label: 'Deploys', count: deployItems.length },
      { id: 'tasks' as const, label: 'Tasks', count: taskItems.length },
      { id: 'devices' as const, label: 'Devices', count: deviceItems.length },
    ],
    [allItems.length, codeItems.length, deployItems.length, taskItems.length, deviceItems.length],
  );

  /* ── Refresh ───────────────────────────────────────────── */

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['github'] });
    queryClient.invalidateQueries({ queryKey: ['vercel'] });
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['campaigns'] });
  }, [queryClient]);

  /* ── Render ────────────────────────────────────────────── */

  return (
    <PageShell>
      <PageHeader
        icon={<Radio size={20} />}
        title="Signals"
        loading={loading}
        onRefresh={handleRefresh}
      >
        <Badge color="var(--success)" variant="outline" size="sm">
          <Zap size={10} /> LIVE
        </Badge>
      </PageHeader>

      {/* ── KPI Strip ─────────────────────────────────────── */}
      <motion.div className="sig-kpi-strip" variants={staggerContainer} initial="hidden" animate="show">
        <GridLayout cols={4} gap="sm">
          <motion.div variants={staggerItem}>
            <KpiCard
              title="Active PRs"
              value={activePRs}
              icon={<GitPullRequest size={14} />}
              size="sm"
              variant="glass"
              isLoading={prsLoading}
              sparklineData={commitSpark}
            />
          </motion.div>
          <motion.div variants={staggerItem}>
            <KpiCard
              title="Recent Deploys"
              value={recentDeploys}
              icon={<Cloud size={14} />}
              size="sm"
              variant="glass"
              isLoading={deploysLoading}
            />
          </motion.div>
          <motion.div variants={staggerItem}>
            <KpiCard
              title="Open Tasks"
              value={openTasks}
              icon={<CheckSquare size={14} />}
              size="sm"
              variant="glass"
              isLoading={tasksLoading}
            />
          </motion.div>
          <motion.div variants={staggerItem}>
            <KpiCard
              title="Active Campaigns"
              value={activeCampaigns}
              icon={<Megaphone size={14} />}
              size="sm"
              variant="glass"
              isLoading={campaignsLoading}
            />
          </motion.div>
        </GridLayout>
      </motion.div>

      {/* ── Main content: Feed + Charts ───────────────────── */}
      <div className="sig-content">
        {/* Left: Tabbed signal feeds */}
        <div className="sig-feed-panel">
          <GlassCard className="sig-feed-card">
            <div className="sig-feed-header">
              <Tabs
                tabs={tabs}
                active={activeTab}
                onChange={(id) => setActiveTab(id as SignalTab)}
              />
              <span className="sig-feed-total">
                {feedItems.length} signals
              </span>
            </div>

            <div className="sig-feed-scroll">
              <ActivityFeed
                items={feedItems}
                isLoading={loading}
                compact
                groupByDate
                maxItems={50}
              />
            </div>
          </GlassCard>
        </div>

        {/* Right: Charts panel */}
        <div className="sig-charts-panel">
          {/* Commit frequency sparkline */}
          <WidgetContainer
            title="Commit Frequency"
            subtitle="Last 7 days"
            icon={<GitBranch size={14} />}
            variant="glass"
            flush
          >
            <div className="sig-chart-sparkline-wrapper">
              <SparkLine
                data={commitSpark}
                width={280}
                height={48}
                color="var(--cyan)"
                showArea
              />
              <div className="sig-chart-sparkline-labels">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                  .slice(7 - commitSpark.length)
                  .map((d) => (
                    <span key={d} className="sig-chart-sparkline-label">
                      {d}
                    </span>
                  ))}
              </div>
            </div>
          </WidgetContainer>

          {/* Deploy success rate donut */}
          <WidgetContainer
            title="Deploy Health"
            subtitle={deploySuccessRate !== '--' ? `${deploySuccessRate} success` : undefined}
            icon={<Cloud size={14} />}
            variant="glass"
            flush
          >
            {deployDonut.length > 0 ? (
              <McvDonutChart
                data={deployDonut}
                size={160}
                centerValue={deploySuccessRate}
                centerLabel="success"
                showLegend
              />
            ) : (
              <div className="sig-chart-empty">
                <Activity size={18} />
                <span>No deploy data</span>
              </div>
            )}
          </WidgetContainer>

          {/* Activity by venture */}
          <WidgetContainer
            title="Activity by Venture"
            icon={<Activity size={14} />}
            variant="glass"
            flush
          >
            {ventureBarData.length > 0 ? (
              <McvBarChart
                data={ventureBarData}
                dataKeys={[
                  { key: 'count', color: 'var(--cyan)', label: 'Signals' },
                ]}
                xAxisKey="venture"
                height={180}
                horizontal
              />
            ) : (
              <div className="sig-chart-empty">
                <Activity size={18} />
                <span>No venture data</span>
              </div>
            )}
          </WidgetContainer>
        </div>
      </div>

      <style>{`
        /* ── KPI Strip ─────────────────────────────── */
        .sig-kpi-strip {
          padding: 0 var(--space-lg);
          margin-bottom: var(--space-md);
        }

        /* ── Content layout: Feed + Charts ─────────── */
        .sig-content {
          display: flex;
          gap: var(--space-md);
          padding: 0 var(--space-lg);
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }

        /* Feed panel — takes remaining space */
        .sig-feed-panel {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }
        .sig-feed-card {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }
        .sig-feed-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-sm) var(--space-md);
          border-bottom: 1px solid var(--border);
          gap: var(--space-md);
          flex-shrink: 0;
        }
        .sig-feed-total {
          font-size: var(--text-xs);
          color: var(--text-muted);
          font-family: var(--font-mono);
          white-space: nowrap;
          flex-shrink: 0;
        }
        .sig-feed-scroll {
          flex: 1;
          overflow-y: auto;
          min-height: 0;
        }

        /* ── Charts panel ──────────────────────────── */
        .sig-charts-panel {
          width: 320px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
          overflow-y: auto;
          min-height: 0;
        }

        /* Sparkline chart wrapper */
        .sig-chart-sparkline-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: var(--space-md);
          gap: var(--space-xs);
        }
        .sig-chart-sparkline-labels {
          display: flex;
          justify-content: space-between;
          width: 280px;
          padding: 0 2px;
        }
        .sig-chart-sparkline-label {
          font-size: 9px;
          color: var(--text-muted);
          font-family: var(--font-mono);
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        /* Chart empty state */
        .sig-chart-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--space-sm);
          padding: var(--space-xl);
          color: var(--text-muted);
          font-size: var(--text-xs);
          opacity: 0.5;
        }

        /* ── Responsive: stack on narrow screens ──── */
        @media (max-width: 900px) {
          .sig-content {
            flex-direction: column;
            overflow-y: auto;
          }
          .sig-charts-panel {
            width: 100%;
            flex-shrink: initial;
            flex-direction: row;
            flex-wrap: wrap;
            overflow-y: visible;
          }
          .sig-charts-panel > * {
            flex: 1 1 280px;
            min-width: 260px;
          }
          .sig-feed-panel {
            min-height: 400px;
          }
        }

        @media (max-width: 640px) {
          .sig-kpi-strip .mcv-grid-4 {
            grid-template-columns: repeat(2, 1fr);
          }
          .sig-content {
            padding: 0 var(--space-md);
          }
          .sig-kpi-strip {
            padding: 0 var(--space-md);
          }
        }
      `}</style>
    </PageShell>
  );
}
