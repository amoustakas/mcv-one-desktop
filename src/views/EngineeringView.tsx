import { useState, useMemo, useCallback } from 'react';
import { lazyRetry } from '../lib/lazy-retry';
import { motion } from 'framer-motion';
import {
  Wrench, GitBranch, GitPullRequest, GitCommit, ExternalLink,
  Rocket, Globe, AlertCircle, Clock, Box, Terminal,
} from 'lucide-react';
import { staggerContainer } from '../lib/animations';
import { useDeviceStore } from '../stores/devices';
import { useNavigation } from '../stores/navigation';
import { useGithubRepos, useGithubCommits, useGithubPRs } from '../hooks/use-github';
import { useDeployments } from '../hooks/use-deployments';
import {
  PageHeader, PageShell, KpiCard, WidgetContainer, Badge,
  DataTable, Pagination, Tabs,
} from '../components/ui';
import { lazy, Suspense } from 'react';
const RepoExplorer = lazyRetry(() => import('../components/github/RepoExplorer'));
const PRReviewPanel = lazyRetry(() => import('../components/github/PRReviewPanel'));
import type { ColumnDef, SortState } from '../components/ui/DataTable';
import { SparkLine, McvAreaChart } from '../components/charts';
import { cn, timeAgo } from '../lib/utils';
import type { GithubCommit, GithubPR } from '../lib/api/github';
import type { Deployment } from '../lib/api/vercel';

/* ─── constants ─────────────────────────────────────────────── */

const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178C6', JavaScript: '#F7DF1E', Python: '#3572A5',
  Rust: '#DEA584', Go: '#00ADD8', Solidity: '#AA6746', CSS: '#563D7C',
  HTML: '#E34C26', Shell: '#89E051', Dart: '#00B4AB',
};

const PAGE_SIZE = 25;

/* ─── helpers ───────────────────────────────────────────────── */

/** Generate mock sparkline data from a repo's updated_at timestamp */
function repoSparkData(updatedAt: string): number[] {
  const seed = updatedAt ? new Date(updatedAt).getTime() : Date.now();
  const pts: number[] = [];
  let v = ((seed % 100) + 20);
  for (let i = 0; i < 14; i++) {
    v += Math.sin(seed * (i + 1) * 0.001) * 8 + (Math.cos(seed * i * 0.003) * 4);
    pts.push(Math.max(0, Math.round(v)));
  }
  return pts;
}

/** Format epoch ms timestamp to relative time */
function epochTimeAgo(ts: number): string {
  if (!ts) return '--';
  return timeAgo(new Date(ts).toISOString());
}

/** Deploy state to human-friendly label */
function deployStateLabel(state: string): string {
  switch (state) {
    case 'READY': return 'Success';
    case 'ERROR': return 'Error';
    case 'BUILDING': return 'Building';
    case 'QUEUED': return 'Queued';
    case 'CANCELED': return 'Canceled';
    default: return state;
  }
}

/** Deploy state to color */
function deployStateColor(state: string): string {
  switch (state) {
    case 'READY': return 'var(--success)';
    case 'ERROR': return 'var(--error)';
    case 'BUILDING': case 'QUEUED': return 'var(--cyan)';
    case 'CANCELED': return 'var(--warning)';
    default: return 'var(--text-muted)';
  }
}

/* ─── commit table columns ──────────────────────────────────── */

function commitColumns(): ColumnDef<Record<string, unknown>>[] {
  return [
    {
      key: 'sha',
      header: 'SHA',
      width: 90,
      render: (_, row) => {
        const sha = row['sha'] as string;
        const url = row['html_url'] as string | undefined;
        return url ? (
          <a href={url} target="_blank" rel="noreferrer" className="eng2-sha-link">
            <code className="eng2-sha">{sha.slice(0, 7)}</code>
          </a>
        ) : (
          <code className="eng2-sha">{sha.slice(0, 7)}</code>
        );
      },
    },
    {
      key: 'message',
      header: 'Message',
      render: (_, row) => {
        const msg = (row['message'] as string) || '';
        const firstLine = msg.split('\n')[0];
        return (
          <span className="eng2-commit-msg" title={msg}>
            {firstLine}
          </span>
        );
      },
    },
    {
      key: 'author',
      header: 'Author',
      width: 130,
      render: (_, row) => (
        <span className="eng2-commit-author">{row['author'] as string}</span>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      width: 100,
      sortable: true,
      align: 'right',
      render: (_, row) => (
        <span className="eng2-commit-date">{timeAgo(row['date'] as string)}</span>
      ),
    },
  ];
}

/* ─── flatten commits for DataTable ─────────────────────────── */

function flattenCommits(commits: GithubCommit[]): Record<string, unknown>[] {
  return commits.map((c) => ({
    sha: c.sha,
    html_url: c.html_url,
    message: c.commit.message,
    author: c.commit.author.name,
    date: c.commit.author.date,
  }));
}

/* ─── deploy chart data ─────────────────────────────────────── */

function buildDeployChartData(deployments: Deployment[]): Record<string, unknown>[] {
  // Group by date, count success/error/other
  const map = new Map<string, { date: string; success: number; error: number; building: number }>();

  for (const d of deployments) {
    const dateStr = new Date(d.created).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!map.has(dateStr)) {
      map.set(dateStr, { date: dateStr, success: 0, error: 0, building: 0 });
    }
    const entry = map.get(dateStr)!;
    if (d.state === 'READY') entry.success++;
    else if (d.state === 'ERROR') entry.error++;
    else entry.building++;
  }

  return Array.from(map.values()).reverse();
}

/* ─── main component ────────────────────────────────────────── */

type EngTab = 'overview' | 'explorer' | 'pr-review';

export default function EngineeringView() {
  const [engTab, setEngTab] = useState<EngTab>('overview');
  const [activeRepo, setActiveRepo] = useState('mcv-one-desktop');
  const [commitPage, setCommitPage] = useState(1);
  const [commitSort, setCommitSort] = useState<SortState>({ key: 'date', direction: 'desc' });

  const { data: repos = [], isLoading: reposLoading, refetch: refetchRepos } = useGithubRepos();
  const { data: commits = [], isLoading: commitsLoading, refetch: refetchCommits } = useGithubCommits(activeRepo);
  const { data: prs = [], isLoading: prsLoading, refetch: refetchPRs } = useGithubPRs(activeRepo);
  const { data: deployments = [], isLoading: deploysLoading, refetch: refetchDeploys } = useDeployments();

  const devices = useDeviceStore((s) => s.devices);
  const { setView } = useNavigation();
  const sessions = useMemo(
    () => Object.values(devices).filter((d) => d.class === 'agent-session' && d.status === 'connected'),
    [devices],
  );

  const loading = reposLoading || commitsLoading || prsLoading || deploysLoading;

  const refresh = useCallback(() => {
    refetchRepos();
    refetchCommits();
    refetchPRs();
    refetchDeploys();
  }, [refetchRepos, refetchCommits, refetchPRs, refetchDeploys]);

  /* ── KPI computations ─────────────────────────────────────── */

  const activeLanguages = useMemo(() => {
    const langs = new Set(repos.map((r) => r.language).filter(Boolean));
    return langs.size;
  }, [repos]);

  const deploySuccessRate = useMemo(() => {
    if (!deployments.length) return 0;
    const successes = deployments.filter((d) => d.state === 'READY').length;
    return Math.round((successes / deployments.length) * 100);
  }, [deployments]);

  const recentCommitCount = useMemo(() => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return commits.filter((c) => new Date(c.commit.author.date).getTime() > sevenDaysAgo).length;
  }, [commits]);

  /* ── Commit table data (sorted + paginated) ───────────────── */

  const flatCommits = useMemo(() => flattenCommits(commits), [commits]);

  const sortedCommits = useMemo(() => {
    const sorted = [...flatCommits];
    if (commitSort.key === 'date') {
      sorted.sort((a, b) => {
        const da = new Date(a['date'] as string).getTime();
        const db = new Date(b['date'] as string).getTime();
        return commitSort.direction === 'desc' ? db - da : da - db;
      });
    }
    return sorted;
  }, [flatCommits, commitSort]);

  const paginatedCommits = useMemo(() => {
    const start = (commitPage - 1) * PAGE_SIZE;
    return sortedCommits.slice(start, start + PAGE_SIZE);
  }, [sortedCommits, commitPage]);

  /* ── Deploy chart ─────────────────────────────────────────── */

  const deployChartData = useMemo(() => buildDeployChartData(deployments), [deployments]);

  /* ── Handle repo selection ────────────────────────────────── */

  const handleRepoClick = useCallback((name: string) => {
    setActiveRepo(name);
    setCommitPage(1);
  }, []);

  /* ── PR status helper ─────────────────────────────────────── */

  function prStatusBadge(pr: GithubPR) {
    const isDraft = pr.title.toLowerCase().includes('draft') || pr.title.startsWith('[WIP]');
    if (isDraft) return <Badge color="var(--text-muted)" variant="outline">Draft</Badge>;
    if (pr.state === 'open') return <Badge color="var(--success)" variant="dot">Open</Badge>;
    if (pr.state === 'closed') return <Badge color="var(--purple)" variant="dot">Merged</Badge>;
    return <Badge color="var(--error)" variant="outline">{pr.state}</Badge>;
  }

  return (
    <PageShell scroll>
      <PageHeader
        icon={<Wrench size={20} />}
        title="Engineering"
        loading={loading}
        onRefresh={refresh}
      />

      {/* ── TAB STRIP ──────────────────────────────────────────── */}
      <Tabs
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'explorer', label: 'Explorer' },
          { id: 'pr-review', label: 'PR Review' },
        ]}
        active={engTab}
        onChange={(id) => setEngTab(id as EngTab)}
        className="eng2-tabs"
      />

      {/* ── EXPLORER TAB ─────────────────────────────────────────── */}
      {engTab === 'explorer' && (
        <div className="eng2-explorer-wrap">
          <Suspense fallback={<div style={{ padding: 24, color: 'var(--text-muted)' }}>Loading explorer...</div>}>
            <RepoExplorer repo={activeRepo} />
          </Suspense>
        </div>
      )}

      {/* ── PR REVIEW TAB ────────────────────────────────────────── */}
      {engTab === 'pr-review' && (
        <div className="eng2-explorer-wrap">
          <Suspense fallback={<div style={{ padding: 24, color: 'var(--text-muted)' }}>Loading PR review...</div>}>
            <PRReviewPanel repo={activeRepo} />
          </Suspense>
        </div>
      )}

      {/* ── OVERVIEW TAB (existing content below) ────────────────── */}
      {engTab === 'overview' && (<>

      {/* ── KPI STRIP ─────────────────────────────────────────── */}
      <motion.div className="eng2-kpi-strip" variants={staggerContainer} initial="hidden" animate="show">
        <KpiCard
          title="Total Repos"
          value={repos.length}
          icon={<Box size={14} />}
          isLoading={reposLoading}
          size="sm"
        />
        <KpiCard
          title="Open PRs"
          value={prs.length}
          icon={<GitPullRequest size={14} />}
          isLoading={prsLoading}
          size="sm"
        />
        <KpiCard
          title="Commits (7d)"
          value={recentCommitCount}
          icon={<GitCommit size={14} />}
          isLoading={commitsLoading}
          size="sm"
        />
        <KpiCard
          title="Deploy Success"
          value={deploySuccessRate}
          suffix="%"
          icon={<Rocket size={14} />}
          isLoading={deploysLoading}
          size="sm"
        />
        <KpiCard
          title="Languages"
          value={activeLanguages}
          icon={<Globe size={14} />}
          isLoading={reposLoading}
          size="sm"
        />
        <KpiCard
          title="Sessions"
          value={sessions.length}
          icon={<Terminal size={14} />}
          size="sm"
        />
      </motion.div>

      {/* ── MAIN 3-COLUMN GRID ────────────────────────────────── */}
      <div className="eng2-main">

        {/* LEFT: Repository Explorer */}
        <WidgetContainer
          title="Repositories"
          subtitle={`${repos.length} repos`}
          icon={<GitBranch size={14} />}
          isLoading={reposLoading}
          onRefresh={() => refetchRepos()}
          flush
          className="eng2-col-repos"
        >
          <div className="eng2-repo-list">
            {repos.map((r) => (
              <button
                key={r.name}
                className={cn('eng2-repo-card', activeRepo === r.name && 'eng2-repo-card-active')}
                onClick={() => handleRepoClick(r.name)}
              >
                <div className="eng2-repo-top">
                  <span className="eng2-repo-name">{r.name}</span>
                  {r.language && (
                    <Badge
                      color={LANG_COLORS[r.language] || 'var(--text-muted)'}
                      variant="outline"
                      size="sm"
                    >
                      {r.language}
                    </Badge>
                  )}
                </div>
                <div className="eng2-repo-mid">
                  <SparkLine
                    data={repoSparkData(r.updated_at)}
                    width={100}
                    height={20}
                    color="var(--cyan)"
                    showArea
                  />
                </div>
                <div className="eng2-repo-meta">
                  <span className="eng2-repo-time">
                    <Clock size={9} />
                    {r.updated_at ? timeAgo(r.updated_at) : '--'}
                  </span>
                  {r.open_issues_count > 0 && (
                    <span className="eng2-repo-issues">
                      <AlertCircle size={9} />
                      {r.open_issues_count}
                    </span>
                  )}
                  {r.stargazers_count > 0 && (
                    <span className="eng2-repo-stars">{r.stargazers_count}</span>
                  )}
                </div>
              </button>
            ))}
            {repos.length === 0 && !reposLoading && (
              <div className="eng2-empty">No repositories found</div>
            )}
          </div>
        </WidgetContainer>

        {/* CENTER: Commit History */}
        <WidgetContainer
          title="Commits"
          subtitle={activeRepo}
          icon={<GitCommit size={14} />}
          isLoading={commitsLoading}
          onRefresh={() => refetchCommits()}
          flush
          className="eng2-col-commits"
        >
          <DataTable
            data={paginatedCommits}
            columns={commitColumns()}
            rowKey="sha"
            isLoading={commitsLoading}
            sortState={commitSort}
            onSortChange={setCommitSort}
            rowHeight={36}
            maxHeight={520}
            emptyMessage="No commits for this repository"
          />
          {sortedCommits.length > PAGE_SIZE && (
            <div className="eng2-pagination-wrap">
              <Pagination
                page={commitPage}
                pageSize={PAGE_SIZE}
                total={sortedCommits.length}
                onPageChange={setCommitPage}
              />
            </div>
          )}
        </WidgetContainer>

        {/* RIGHT: Pull Requests */}
        <WidgetContainer
          title="Pull Requests"
          subtitle={`${prs.length}`}
          icon={<GitPullRequest size={14} />}
          isLoading={prsLoading}
          onRefresh={() => refetchPRs()}
          flush
          className="eng2-col-prs"
        >
          <div className="eng2-pr-list">
            {prs.map((p) => (
              <a
                key={p.number}
                href={p.html_url}
                target="_blank"
                rel="noreferrer"
                className="eng2-pr-card"
              >
                <div className="eng2-pr-header">
                  <span className="eng2-pr-number">#{p.number}</span>
                  <span className="eng2-pr-title">{p.title}</span>
                  <ExternalLink size={10} className="eng2-pr-ext" />
                </div>
                <div className="eng2-pr-footer">
                  {prStatusBadge(p)}
                  <span className="eng2-pr-author">{p.user.login}</span>
                  <span className="eng2-pr-time">{timeAgo(p.updated_at)}</span>
                </div>
              </a>
            ))}
            {prs.length === 0 && !prsLoading && (
              <div className="eng2-empty">No pull requests</div>
            )}
          </div>
        </WidgetContainer>
      </div>

      {/* ── Connected Sessions ────────────────────────────────── */}
      {sessions.length > 0 && (
        <WidgetContainer
          title="Connected Sessions"
          subtitle={`${sessions.length} active`}
          icon={<Terminal size={14} />}
          className="eng2-sessions-section"
        >
          <div className="eng2-session-list">
            {sessions.slice(0, 5).map((s) => {
              const projectDir = (s.metadata?.projectDir as string) || '';
              const projectName = projectDir.split(/[/\\]/).filter(Boolean).pop() || s.name;
              const branch = (s.metadata?.branch as string) || 'main';
              return (
                <div key={s.id} className="eng2-session-item">
                  <span className="eng2-session-dot" />
                  <span className="eng2-session-project">{projectName}</span>
                  <span className="eng2-session-branch">
                    <GitBranch size={9} />
                    {branch}
                  </span>
                  <Badge color="var(--success)" variant="dot" size="sm">connected</Badge>
                </div>
              );
            })}
            {sessions.length > 5 && (
              <button className="eng2-session-viewall" onClick={() => setView('connected-sessions')}>
                View All ({sessions.length}) &rarr;
              </button>
            )}
          </div>
          <div className="eng2-session-footer">
            <button className="eng2-session-viewall" onClick={() => setView('connected-sessions')}>
              View All &rarr;
            </button>
          </div>
        </WidgetContainer>
      )}

      {/* ── BOTTOM: Deploy Timeline ───────────────────────────── */}
      <WidgetContainer
        title="Deployments"
        subtitle={`${deployments.length} recent`}
        icon={<Rocket size={14} />}
        isLoading={deploysLoading}
        onRefresh={() => refetchDeploys()}
        className="eng2-deploy-section"
      >
        <div className="eng2-deploy-content">
          {/* Chart */}
          {deployChartData.length > 1 && (
            <div className="eng2-deploy-chart">
              <McvAreaChart
                data={deployChartData}
                dataKeys={[
                  { key: 'success', color: 'var(--success)', label: 'Success' },
                  { key: 'error', color: 'var(--error)', label: 'Error' },
                  { key: 'building', color: 'var(--cyan)', label: 'Building' },
                ]}
                xAxisKey="date"
                height={140}
                showLegend
                showGrid
              />
            </div>
          )}

          {/* Activity Feed */}
          <div className="eng2-deploy-feed">
            {deployments.slice(0, 20).map((d) => (
              <div
                key={d.uid}
                className="eng2-deploy-item"
                style={{ '--deploy-color': deployStateColor(d.state) } as React.CSSProperties}
              >
                <span className="eng2-deploy-indicator" />
                <div className="eng2-deploy-info">
                  <span className="eng2-deploy-name">{d.name}</span>
                  {d.meta?.githubCommitMessage && (
                    <span className="eng2-deploy-msg" title={d.meta.githubCommitMessage}>
                      {d.meta.githubCommitMessage.split('\n')[0]}
                    </span>
                  )}
                </div>
                <Badge
                  color={deployStateColor(d.state)}
                  variant="outline"
                  size="sm"
                >
                  {deployStateLabel(d.state)}
                </Badge>
                <span className="eng2-deploy-target">
                  {d.target === 'production' ? (
                    <Badge color="var(--purple)" variant="dot" size="sm">prod</Badge>
                  ) : (
                    <Badge color="var(--text-muted)" variant="outline" size="sm">preview</Badge>
                  )}
                </span>
                <span className="eng2-deploy-time">{epochTimeAgo(d.created)}</span>
                {d.url && (
                  <a
                    href={`https://${d.url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="eng2-deploy-link"
                    title="Open deployment"
                  >
                    <ExternalLink size={10} />
                  </a>
                )}
              </div>
            ))}
            {deployments.length === 0 && !deploysLoading && (
              <div className="eng2-empty">No deployments found</div>
            )}
          </div>
        </div>
      </WidgetContainer>

      {/* ── STYLES ────────────────────────────────────────────── */}
      <style>{`
        /* ── KPI Strip ────────────────────────────────────────── */
        .eng2-kpi-strip {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 8px;
          padding: 0 0 8px 0;
          flex-shrink: 0;
          position: relative;
        }
        .eng2-kpi-strip::before {
          content: "";
          position: absolute;
          top: -1px;
          left: 15%;
          right: 15%;
          height: 1px;
          background: linear-gradient(to right, transparent, var(--cyan), transparent);
        }
        .eng2-kpi-strip .mcv-kpi {
          padding: 10px 14px;
        }

        /* ── Main 3-col grid ──────────────────────────────────── */
        .eng2-main {
          display: grid;
          grid-template-columns: 280px 1fr 340px;
          gap: 8px;
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }
        .eng2-main > .mcv-widget {
          min-height: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .eng2-main > .mcv-widget .mcv-widget-body {
          flex: 1;
          min-height: 0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        /* ── Repository Explorer ──────────────────────────────── */
        .eng2-repo-list {
          flex: 1;
          overflow-y: auto;
          padding: 4px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .eng2-repo-card {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 8px 10px;
          border-radius: var(--radius-sm);
          text-align: left;
          transition: all 0.12s ease;
          border-left: 2px solid transparent;
          background: transparent;
          cursor: pointer;
        }
        .eng2-repo-card:hover {
          background: var(--bg-card);
          border-left-color: var(--border);
          transform: translateX(2px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .eng2-repo-card-active {
          background: var(--bg-elevated, var(--bg-card));
          border-left-color: var(--cyan) !important;
          box-shadow: inset 0 0 20px -10px rgba(0, 245, 255, 0.08);
        }
        .eng2-repo-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 6px;
        }
        .eng2-repo-name {
          font-size: 11.5px;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
        }
        .eng2-repo-mid {
          display: flex;
          align-items: center;
        }
        .eng2-repo-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 9.5px;
          color: var(--text-muted);
        }
        .eng2-repo-time,
        .eng2-repo-issues,
        .eng2-repo-stars {
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }
        .eng2-repo-issues {
          color: var(--warning);
        }

        /* ── Commit Table ─────────────────────────────────────── */
        .eng2-col-commits .mcv-table-wrap {
          flex: 1;
          min-height: 0;
        }
        .eng2-sha-link {
          text-decoration: none;
        }
        .eng2-sha-link:hover .eng2-sha {
          background: var(--cyan);
          color: var(--bg-deep);
        }
        .eng2-sha {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--cyan);
          background: var(--bg-surface);
          padding: 2px 6px;
          border-radius: 3px;
          transition: all 0.1s;
        }
        .eng2-commit-msg {
          font-size: 11px;
          color: var(--text-secondary, var(--text-primary));
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: block;
        }
        .eng2-commit-author {
          font-size: 10px;
          color: var(--text-muted);
          white-space: nowrap;
        }
        .eng2-commit-date {
          font-size: 10px;
          color: var(--text-muted);
          white-space: nowrap;
        }
        .eng2-pagination-wrap {
          padding: 4px 8px;
          border-top: 1px solid var(--border);
          flex-shrink: 0;
        }

        /* ── Pull Requests ────────────────────────────────────── */
        .eng2-pr-list {
          flex: 1;
          overflow-y: auto;
        }
        .eng2-pr-card {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 8px 12px;
          border-bottom: 1px solid var(--border);
          text-decoration: none;
          transition: background 0.1s;
        }
        .eng2-pr-card:hover {
          background: var(--bg-card);
        }
        .eng2-pr-header {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
        }
        .eng2-pr-number {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--purple);
          flex-shrink: 0;
        }
        .eng2-pr-title {
          font-size: 11.5px;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
        }
        .eng2-pr-ext {
          color: var(--text-muted);
          flex-shrink: 0;
          opacity: 0;
          transition: opacity 0.1s;
        }
        .eng2-pr-card:hover .eng2-pr-ext {
          opacity: 1;
        }
        .eng2-pr-footer {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 10px;
          color: var(--text-muted);
        }
        .eng2-pr-author {
          flex: 1;
        }
        .eng2-pr-time {
          flex-shrink: 0;
        }

        /* ── Deploy Section ───────────────────────────────────── */
        .eng2-deploy-section {
          margin-top: 8px;
          flex-shrink: 0;
        }
        .eng2-deploy-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          min-height: 0;
        }
        .eng2-deploy-chart {
          min-height: 0;
        }
        .eng2-deploy-feed {
          max-height: 200px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }
        .eng2-deploy-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 5px 8px;
          border-bottom: 1px solid var(--border);
          font-size: 11px;
          transition: background 0.1s;
        }
        .eng2-deploy-item:hover {
          background: var(--bg-card);
        }
        .eng2-deploy-indicator {
          width: 3px;
          height: 20px;
          border-radius: 2px;
          background: var(--deploy-color);
          flex-shrink: 0;
        }
        .eng2-deploy-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .eng2-deploy-name {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .eng2-deploy-msg {
          font-size: 9.5px;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .eng2-deploy-target {
          flex-shrink: 0;
        }
        .eng2-deploy-time {
          font-size: 9.5px;
          color: var(--text-muted);
          flex-shrink: 0;
          min-width: 50px;
          text-align: right;
        }
        .eng2-deploy-link {
          color: var(--text-muted);
          flex-shrink: 0;
          opacity: 0.5;
          transition: opacity 0.15s, color 0.15s;
        }
        .eng2-deploy-link:hover {
          opacity: 1;
          color: var(--cyan);
        }

        /* ── Connected Sessions ───────────────────────────────── */
        .eng2-sessions-section {
          margin-top: 8px;
          flex-shrink: 0;
        }
        .eng2-session-list {
          display: flex;
          flex-direction: column;
        }
        .eng2-session-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          border-bottom: 1px solid var(--border);
          font-size: 11px;
          transition: background 0.1s;
        }
        .eng2-session-item:hover {
          background: var(--bg-card);
        }
        .eng2-session-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--success);
          box-shadow: 0 0 4px rgba(16,185,129,0.4);
          flex-shrink: 0;
        }
        .eng2-session-project {
          font-weight: 600;
          color: var(--text-primary);
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .eng2-session-branch {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-size: 10px;
          font-family: var(--font-mono);
          color: var(--text-muted);
          flex-shrink: 0;
        }
        .eng2-session-footer {
          padding: 6px 10px;
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: flex-end;
        }
        .eng2-session-viewall {
          font-size: 10px;
          font-weight: 600;
          color: var(--cyan);
          background: none;
          border: none;
          cursor: pointer;
          padding: 2px 6px;
          border-radius: 3px;
          transition: background 0.1s;
        }
        .eng2-session-viewall:hover {
          background: rgba(0,245,255,0.08);
        }

        /* ── Empty state ──────────────────────────────────────── */
        .eng2-empty {
          padding: 24px;
          text-align: center;
          font-size: 11px;
          color: var(--text-muted);
        }

        /* ── 4K dense layout ──────────────────────────────────── */
        @media (min-width: 2560px) {
          .eng2-kpi-strip {
            gap: 12px;
          }
          .eng2-main {
            grid-template-columns: 320px 1fr 400px;
            gap: 12px;
          }
          .eng2-deploy-content {
            grid-template-columns: 1fr 1.2fr;
          }
          .eng2-deploy-feed {
            max-height: 280px;
          }
        }

        /* ── 8K / ultrawide ───────────────────────────────────── */
        @media (min-width: 3840px) {
          .eng2-main {
            grid-template-columns: 380px 1fr 480px;
          }
        }

        /* ── Responsive collapse ──────────────────────────────── */
        @media (max-width: 1400px) {
          .eng2-main {
            grid-template-columns: 240px 1fr 280px;
          }
        }
        @media (max-width: 1100px) {
          .eng2-kpi-strip {
            grid-template-columns: repeat(3, 1fr);
          }
          .eng2-main {
            grid-template-columns: 1fr 1fr;
          }
          .eng2-col-repos {
            grid-column: 1 / -1;
          }
          .eng2-deploy-content {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 768px) {
          .eng2-kpi-strip {
            grid-template-columns: repeat(2, 1fr);
          }
          .eng2-main {
            grid-template-columns: 1fr;
          }
        }
        .eng2-tabs { margin: 0 var(--space-lg) var(--space-sm); flex-shrink: 0; }
        .eng2-explorer-wrap { flex: 1; overflow: hidden; margin: 0 var(--space-lg) var(--space-lg); border-radius: var(--radius-md); border: 1px solid var(--border); }
      `}</style>
      </>)}
    </PageShell>
  );
}
