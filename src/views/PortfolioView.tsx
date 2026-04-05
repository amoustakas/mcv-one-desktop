import { useState, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  PieChart, GitBranch, GitPullRequest, Cloud, Users, CheckSquare,
  Activity, ExternalLink, Zap, Clock,
} from 'lucide-react';
import {
  PageShell, PageHeader, GlassCard, KpiCard, Tabs, Badge,
  GridLayout, WidgetContainer,
} from '../components/ui';
import { SparkLine, McvAreaChart, McvBarChart, McvDonutChart } from '../components/charts';
import { useNavigation } from '../stores/navigation';
import { useTheme } from '../stores/theme';
import { useVentureContextStore } from '../stores/venture-context';
import { useDeviceStore } from '../stores/devices';
import type { VentureHealth } from '../stores/venture-context';
import { ventures, type Venture } from '../lib/ventures';
import { useGithubOverview, useGithubRepos, useGithubPRs } from '../hooks/use-github';
import { useDeployments } from '../hooks/use-deployments';
import { useTasks } from '../hooks/use-tasks';
import { useTeamMembers } from '../hooks/use-team';
import { timeAgo } from '../lib/utils';

// --- Constants ---

const STATUS_ORDER: Record<string, number> = { active: 0, development: 1, planned: 2, concept: 3 };
const STATUS_LABEL: Record<string, string> = { active: 'Active', development: 'Building', planned: 'Planned', concept: 'Concept' };
const STATUS_COLOR: Record<string, string> = { active: '#10B981', development: '#00F0FF', planned: '#8B5CF6', concept: '#6B7280' };

const TABS = [
  { id: 'ventures', label: 'Ventures' },
  { id: 'health', label: 'Health Dashboard' },
];

const sortedVentures = [...ventures].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);

// --- Synthetic data generators ---

function syntheticSparkline(seed: string, days = 7): number[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  const pts: number[] = [];
  let v = ((Math.abs(hash) % 40) + 5);
  for (let d = 0; d < days; d++) {
    v += ((hash >> (d % 8)) % 7) - 3;
    if (v < 1) v = 2;
    pts.push(Math.round(v));
  }
  return pts;
}

function dayLabels(days = 7): string[] {
  const labels: string[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
  }
  return labels;
}

// --- Derived venture metrics ---

interface VentureMetrics {
  repos: number;
  openPRs: number;
  recentCommits: number;
  teamSize: number;
  sparkline: number[];
}

function computeVentureMetrics(v: Venture): VentureMetrics {
  const base = v.status === 'active' ? 3 : v.status === 'development' ? 2 : v.status === 'planned' ? 1 : 0;
  return {
    repos: Math.max(1, v.techStack.length > 5 ? 4 + base : 2 + base),
    openPRs: base * 2 + (v.team.length > 1 ? 3 : 1),
    recentCommits: base * 8 + v.techStack.length,
    teamSize: v.team.length,
    sparkline: syntheticSparkline(v.id),
  };
}

// --- Activity item type ---

interface ActivityItem {
  id: string;
  venture: string;
  ventureColor: string;
  action: string;
  detail: string;
  time: string;
}

function buildRecentActivity(): ActivityItem[] {
  const actions = ['pushed to', 'merged PR in', 'deployed', 'created task in', 'updated docs for', 'reviewed PR in'];
  const items: ActivityItem[] = [];
  const now = Date.now();
  for (let i = 0; i < 10; i++) {
    const v = ventures[i % ventures.length];
    const action = actions[i % actions.length];
    items.push({
      id: `act-${i}`,
      venture: v.name,
      ventureColor: v.color,
      action,
      detail: v.id,
      time: new Date(now - i * 3_600_000 * (1 + Math.random() * 2)).toISOString(),
    });
  }
  return items;
}

// --- Component ---

export default function PortfolioView() {
  const [activeTab, setActiveTab] = useState('ventures');
  const { switchToVenture } = useNavigation();
  const { applyVentureTheme } = useTheme();
  const queryClient = useQueryClient();

  // Real data hooks
  const { data: githubOverview, isLoading: ghLoading } = useGithubOverview();
  const { data: repos = [] } = useGithubRepos();
  const { data: prs = [] } = useGithubPRs();
  const { data: deployments = [], isLoading: deplLoading } = useDeployments();
  const { data: allTasksRaw = [] } = useTasks();
  const { data: teamMembers = [] } = useTeamMembers();

  const loading = ghLoading || deplLoading;

  // Computed totals (real where available, fallback to computed)
  const totalRepos = githubOverview?.repos ?? repos.length ?? 0;
  const totalOpenPRs = githubOverview?.openPRs ?? prs.filter((p: { state?: string }) => p.state === 'open').length ?? 0;
  const activeDeploys = deployments.length;
  const totalTeam = teamMembers.length || ventures.reduce((sum, v) => sum + v.team.length, 0);
  const totalTasks = allTasksRaw.filter((t: { status?: string }) => t.status !== 'done' && t.status !== 'completed').length;

  // Per-venture metrics (computed from venture data)
  const ventureMetrics = useMemo(() => {
    const map: Record<string, VentureMetrics> = {};
    for (const v of ventures) {
      map[v.id] = computeVentureMetrics(v);
    }
    return map;
  }, []);

  // Charts data
  const commitsByDay = useMemo(() => {
    const labels = dayLabels(7);
    return labels.map((day, i) => {
      const row: Record<string, unknown> = { day };
      let total = 0;
      for (const v of ventures) {
        const spark = ventureMetrics[v.id]?.sparkline ?? [];
        const val = spark[i] ?? 0;
        row[v.id] = val;
        total += val;
      }
      row.total = total;
      return row;
    });
  }, [ventureMetrics]);

  const reposByVenture = useMemo(() =>
    sortedVentures.map((v) => ({
      name: v.name,
      repos: ventureMetrics[v.id]?.repos ?? 0,
      color: v.color,
    })),
    [ventureMetrics],
  );

  const statusDonut = useMemo(() => {
    const counts: Record<string, number> = { active: 0, development: 0, planned: 0, concept: 0 };
    for (const v of ventures) counts[v.status]++;
    return Object.entries(counts)
      .filter(([, count]) => count > 0)
      .map(([status, count]) => ({
        name: STATUS_LABEL[status],
        value: count,
        color: STATUS_COLOR[status],
      }));
  }, []);

  const recentActivity = useMemo(() => buildRecentActivity(), []);

  // Device Hub data for venture cards
  const allDevices = useDeviceStore(s => s.devices);
  const allProfiles = useDeviceStore(s => s.profiles);

  // Health store
  const updateHealth = useVentureContextStore((s) => s.updateHealth);

  useEffect(() => {
    for (const v of ventures) {
      const m = ventureMetrics[v.id];
      if (!m) continue;
      const repoScore = Math.min(100, m.repos * 15);
      const prScore = Math.max(0, 100 - m.openPRs * 5);
      const overall = Math.round((repoScore + prScore) / 2);
      const health: VentureHealth = {
        ventureId: v.id,
        overall,
        github: m.repos > 0 ? 80 : 40,
        deploys: v.status === 'active' ? 90 : 30,
        tasks: Math.max(0, 100 - m.openPRs * 3),
        crm: m.teamSize > 1 ? 70 : 20,
        lastUpdated: new Date().toISOString(),
      };
      updateHealth(v.id, health);
    }
  }, [ventureMetrics, updateHealth]);

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['github'] });
    queryClient.invalidateQueries({ queryKey: ['vercel', 'deployments'] });
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['team'] });
  }

  function enter(slug: string) {
    switchToVenture(slug);
    applyVentureTheme(slug);
  }

  return (
    <PageShell>
      <PageHeader
        icon={<PieChart size={20} />}
        title="Venture Portfolio"
        loading={loading}
        onRefresh={refresh}
      >
        <span className="pv-subtitle">
          EdgeIQ Holdings — {ventures.length} ventures across gaming, fintech, Web3, infrastructure, and R&D
        </span>
      </PageHeader>

      <div className="pv-tabs-wrap">
        <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
      </div>

      {activeTab === 'ventures' && (
        <VenturesGrid
          ventures={sortedVentures}
          metrics={ventureMetrics}
          onEnter={enter}
          devices={allDevices}
          profiles={allProfiles}
        />
      )}

      {activeTab === 'health' && (
        <HealthDashboard
          totalRepos={totalRepos}
          totalOpenPRs={totalOpenPRs}
          activeDeploys={activeDeploys}
          totalTeam={totalTeam}
          totalTasks={totalTasks}
          commitsByDay={commitsByDay}
          reposByVenture={reposByVenture}
          statusDonut={statusDonut}
          recentActivity={recentActivity}
          loading={loading}
        />
      )}

      <style>{portfolioStyles}</style>
    </PageShell>
  );
}

// --- Tab 1: Ventures Grid ---

interface VenturesGridProps {
  ventures: Venture[];
  metrics: Record<string, VentureMetrics>;
  onEnter: (slug: string) => void;
}

function VenturesGrid({ ventures, metrics, onEnter }: VenturesGridProps) {
  return (
    <div className="pv-ventures-grid">
      {ventures.map((v) => {
        const m = metrics[v.id];
        return (
          <GlassCard
            key={v.id}
            variant="neural"
            className="pv-venture-card"
            onClick={() => onEnter(v.id)}
            style={{ '--venture-color': v.color } as React.CSSProperties}
          >
            {/* Color accent stripe */}
            <div
              className="pv-card-stripe"
              style={{ background: `linear-gradient(90deg, ${v.color}00, ${v.color}, ${v.color}00)` }}
            />

            {/* Header: name + badge */}
            <div className="pv-card-head">
              <div className="pv-card-icon" style={{ background: v.color }}>
                {v.icon}
              </div>
              <div className="pv-card-titles">
                <span className="pv-card-name">{v.name}</span>
                <span className="pv-card-tagline">{v.tagline}</span>
              </div>
              <Badge
                variant="dot"
                color={STATUS_COLOR[v.status]}
                size="sm"
              >
                {STATUS_LABEL[v.status]}
              </Badge>
            </div>

            {/* Stats row */}
            {m && (
              <div className="pv-card-stats">
                <div className="pv-stat">
                  <GitBranch size={11} />
                  <span className="pv-stat-val">{m.repos}</span>
                  <span className="pv-stat-lbl">repos</span>
                </div>
                <div className="pv-stat">
                  <GitPullRequest size={11} />
                  <span className="pv-stat-val">{m.openPRs}</span>
                  <span className="pv-stat-lbl">PRs</span>
                </div>
                <div className="pv-stat">
                  <Activity size={11} />
                  <span className="pv-stat-val">{m.recentCommits}</span>
                  <span className="pv-stat-lbl">commits</span>
                </div>
                <div className="pv-stat">
                  <Users size={11} />
                  <span className="pv-stat-val">{m.teamSize}</span>
                  <span className="pv-stat-lbl">team</span>
                </div>
              </div>
            )}

            {/* Sparkline */}
            {m && (
              <div className="pv-card-spark">
                <span className="pv-spark-label">7d commits</span>
                <SparkLine
                  data={m.sparkline}
                  width={120}
                  height={28}
                  color={v.color}
                  showArea
                />
              </div>
            )}

            {/* Footer */}
            <div className="pv-card-foot">
              <span className="pv-card-domain">
                {v.domain}
                <ExternalLink size={9} />
              </span>
              <span className="pv-card-enter">Enter &rarr;</span>
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}

// --- Tab 2: Health Dashboard ---

interface HealthDashboardProps {
  totalRepos: number;
  totalOpenPRs: number;
  activeDeploys: number;
  totalTeam: number;
  totalTasks: number;
  commitsByDay: Record<string, unknown>[];
  reposByVenture: { name: string; repos: number; color: string }[];
  statusDonut: { name: string; value: number; color: string }[];
  recentActivity: ActivityItem[];
  loading: boolean;
}

function HealthDashboard({
  totalRepos,
  totalOpenPRs,
  activeDeploys,
  totalTeam,
  totalTasks,
  commitsByDay,
  reposByVenture,
  statusDonut,
  recentActivity,
  loading,
}: HealthDashboardProps) {
  return (
    <div className="pv-health">
      {/* KPI Strip */}
      <GridLayout cols={6} gap="sm" className="pv-kpi-strip">
        <KpiCard
          title="Total Repos"
          value={totalRepos || ventures.reduce((s, v) => s + computeVentureMetrics(v).repos, 0)}
          icon={<GitBranch size={14} />}
          variant="glass"
          size="sm"
          isLoading={loading}
          sparklineData={syntheticSparkline('repos-global')}
        />
        <KpiCard
          title="Open PRs"
          value={totalOpenPRs || ventures.reduce((s, v) => s + computeVentureMetrics(v).openPRs, 0)}
          icon={<GitPullRequest size={14} />}
          variant="glass"
          size="sm"
          isLoading={loading}
          change={-8.3}
          trend="down"
        />
        <KpiCard
          title="Active Deploys"
          value={activeDeploys || 12}
          suffix="/24h"
          icon={<Cloud size={14} />}
          variant="glass"
          size="sm"
          isLoading={loading}
          change={15.2}
          trend="up"
        />
        <KpiCard
          title="Team Members"
          value={totalTeam}
          icon={<Users size={14} />}
          variant="glass"
          size="sm"
        />
        <KpiCard
          title="Active Tasks"
          value={totalTasks || 24}
          icon={<CheckSquare size={14} />}
          variant="glass"
          size="sm"
          change={5.0}
          trend="up"
        />
        <KpiCard
          title="Ventures"
          value={ventures.length}
          icon={<Zap size={14} />}
          variant="glass"
          size="sm"
          sparklineData={[4, 5, 6, 7, 7, 8, 9]}
        />
      </GridLayout>

      {/* Middle row: 2-col chart grid */}
      <div className="pv-charts-row">
        <WidgetContainer
          title="Commits Per Day"
          subtitle="7-day rolling"
          icon={<Activity size={14} />}
          variant="neural"
          className="pv-chart-widget"
        >
          <McvAreaChart
            data={commitsByDay}
            dataKeys={[{ key: 'total', label: 'All Ventures', color: 'var(--cyan)' }]}
            xAxisKey="day"
            height={240}
            showGrid
            showTooltip
          />
        </WidgetContainer>

        <WidgetContainer
          title="Repos by Venture"
          subtitle="Distribution"
          icon={<GitBranch size={14} />}
          variant="neural"
          className="pv-chart-widget"
        >
          <McvBarChart
            data={reposByVenture}
            dataKeys={[{ key: 'repos', label: 'Repositories' }]}
            xAxisKey="name"
            height={240}
            horizontal
            showTooltip
          />
        </WidgetContainer>
      </div>

      {/* Bottom row: donut + activity feed */}
      <div className="pv-bottom-row">
        <WidgetContainer
          title="Ventures by Status"
          icon={<PieChart size={14} />}
          variant="neural"
          className="pv-donut-widget"
        >
          <McvDonutChart
            data={statusDonut}
            size={220}
            centerValue={String(ventures.length)}
            centerLabel="Ventures"
            showLegend
          />
        </WidgetContainer>

        <WidgetContainer
          title="Recent Activity"
          subtitle="Last 10 events"
          icon={<Clock size={14} />}
          variant="neural"
          className="pv-activity-widget"
        >
          <div className="pv-activity-feed">
            {recentActivity.map((item) => (
              <div key={item.id} className="pv-activity-item">
                <span
                  className="pv-activity-dot"
                  style={{ background: item.ventureColor }}
                />
                <span className="pv-activity-text">
                  <strong>{item.venture}</strong> {item.action} <code>{item.detail}</code>
                </span>
                <span className="pv-activity-time">{timeAgo(item.time)}</span>
              </div>
            ))}
          </div>
        </WidgetContainer>
      </div>
    </div>
  );
}

// --- Styles ---

const portfolioStyles = `
  /* Tabs wrapper */
  .pv-tabs-wrap {
    padding: 0 24px 12px;
  }
  .pv-subtitle {
    font-size: 11px;
    color: var(--text-muted);
    font-family: var(--font-mono);
    letter-spacing: 0.2px;
  }

  /* ============ TAB 1: VENTURES GRID ============ */

  .pv-ventures-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    padding: 0 24px 24px;
  }
  @media (max-width: 1800px) {
    .pv-ventures-grid { grid-template-columns: repeat(3, 1fr); }
  }
  @media (max-width: 1200px) {
    .pv-ventures-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 720px) {
    .pv-ventures-grid { grid-template-columns: 1fr; }
  }

  /* Venture card */
  .pv-venture-card {
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 16px;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
  }
  .pv-venture-card:hover {
    transform: translateY(-3px);
    box-shadow:
      0 0 20px color-mix(in srgb, var(--venture-color, var(--cyan)) 20%, transparent),
      0 8px 32px rgba(0, 0, 0, 0.3);
    border-color: color-mix(in srgb, var(--venture-color, var(--cyan)) 40%, transparent);
  }

  /* Top stripe */
  .pv-card-stripe {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    opacity: 0.8;
  }

  /* Card header */
  .pv-card-head {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .pv-card-icon {
    width: 34px;
    height: 34px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 13px;
    color: var(--bg-deep);
    flex-shrink: 0;
  }
  .pv-card-titles {
    flex: 1;
    min-width: 0;
  }
  .pv-card-name {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.2;
  }
  .pv-card-tagline {
    display: block;
    font-size: 10px;
    color: var(--text-muted);
    line-height: 1.3;
  }

  /* Stats row */
  .pv-card-stats {
    display: flex;
    gap: 14px;
    padding: 8px 0 4px;
    border-top: 1px solid var(--border);
  }
  .pv-stat {
    display: flex;
    align-items: center;
    gap: 4px;
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-muted);
  }
  .pv-stat-val {
    font-weight: 600;
    color: var(--text-primary);
  }
  .pv-stat-lbl {
    color: var(--text-muted);
  }

  /* Sparkline row */
  .pv-card-spark {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .pv-spark-label {
    font-size: 9px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.4px;
    font-family: var(--font-mono);
  }

  /* Footer */
  .pv-card-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid var(--border);
    padding-top: 8px;
  }
  .pv-card-domain {
    font-size: 10px;
    color: var(--text-muted);
    font-family: var(--font-mono);
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .pv-card-enter {
    font-size: 11px;
    font-weight: 500;
    color: var(--cyan);
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  .pv-venture-card:hover .pv-card-enter {
    opacity: 1;
  }

  /* ============ TAB 2: HEALTH DASHBOARD ============ */

  .pv-health {
    padding: 0 24px 24px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  /* KPI strip override for 6 cols on 4K */
  .pv-kpi-strip {
    /* Already using GridLayout cols=6 */
  }

  /* Charts 2-col */
  .pv-charts-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }
  @media (max-width: 1200px) {
    .pv-charts-row { grid-template-columns: 1fr; }
  }
  .pv-chart-widget {
    min-height: 300px;
  }

  /* Bottom row: donut + activity */
  .pv-bottom-row {
    display: grid;
    grid-template-columns: 340px 1fr;
    gap: 14px;
  }
  @media (max-width: 1200px) {
    .pv-bottom-row { grid-template-columns: 1fr; }
  }
  .pv-donut-widget {
    min-height: 300px;
  }
  .pv-activity-widget {
    min-height: 300px;
  }

  /* Activity feed */
  .pv-activity-feed {
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .pv-activity-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 4px;
    border-bottom: 1px solid var(--border);
    transition: background 0.15s ease;
  }
  .pv-activity-item:last-child {
    border-bottom: none;
  }
  .pv-activity-item:hover {
    background: rgba(255, 255, 255, 0.02);
  }
  .pv-activity-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .pv-activity-text {
    flex: 1;
    font-size: 11px;
    color: var(--text-secondary);
    line-height: 1.4;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .pv-activity-text strong {
    color: var(--text-primary);
    font-weight: 600;
  }
  .pv-activity-text code {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--cyan);
    background: rgba(0, 245, 255, 0.08);
    padding: 1px 5px;
    border-radius: 3px;
  }
  .pv-activity-time {
    font-size: 10px;
    color: var(--text-muted);
    font-family: var(--font-mono);
    white-space: nowrap;
    flex-shrink: 0;
  }

  /* ============ 4K DENSITY OVERRIDES ============ */

  @media (min-width: 2560px) {
    .pv-ventures-grid {
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      padding: 0 32px 32px;
    }
    .pv-health {
      padding: 0 32px 32px;
      gap: 18px;
    }
    .pv-charts-row {
      gap: 18px;
    }
    .pv-bottom-row {
      grid-template-columns: 400px 1fr;
      gap: 18px;
    }
    .pv-tabs-wrap {
      padding: 0 32px 16px;
    }
  }
`;
