// Repository Portfolio — Foundation panel for the github_repos registry.
// Mirrors DomainPortfolioView shape. Hydrated by scripts/seed-github-repos.ts.
//
// Two-table layout:
//   1. Active repos — full_name, language, visibility, pushed_at freshness,
//      open issues. Freshness tone (green ≤30d / amber ≤180d / red stale).
//   2. Archived repos — historical shelf, collapsed by default.

import { useEffect, useState } from 'react';
// lucide-react dropped the `Github` icon (trademark). Use `GitBranch` as the
// semantic stand-in for the page header — the same substitution `suites/definitions.ts`
// expects at runtime when the icon-name lookup for 'Github' misses.
import { GitBranch, Archive, ExternalLink } from 'lucide-react';
import { PageShell, PageHeader, GlassCard } from '../../components/ui';
import TableSkeleton from '../../components/common/TableSkeleton';
import CopyButton from '../../components/common/CopyButton';
import { Chip, type ChipTone } from './_chip';
import { useFoundationStore, type GitHubRepo } from '../../stores/foundation';

export default function RepositoryPortfolioView() {
  const { githubRepos, loading, errors, fetchGitHubRepos } = useFoundationStore();
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    fetchGitHubRepos();
  }, [fetchGitHubRepos]);

  const active = githubRepos.filter((r) => !r.archived);
  const archived = githubRepos.filter((r) => r.archived);
  const lastSync = githubRepos.find((r) => r.last_synced_at)?.last_synced_at ?? null;

  // Freshness tone: how recently the repo was pushed to.
  const today = new Date();
  const daysSince = (iso: string | null): number | null => {
    if (!iso) return null;
    const diff = (today.getTime() - new Date(iso).getTime()) / 86_400_000;
    return Math.floor(diff);
  };
  const freshnessTone = (d: number | null): ChipTone => {
    if (d == null) return 'muted';
    if (d <= 30) return 'success';
    if (d <= 180) return 'warning';
    return 'error';
  };
  const freshnessLabel = (d: number | null): string => {
    if (d == null) return '—';
    if (d === 0) return 'today';
    if (d === 1) return '1d ago';
    return `${d}d ago`;
  };

  const visibilityTone = (v: GitHubRepo['visibility']): ChipTone => {
    if (v === 'public') return 'info';
    if (v === 'internal') return 'warning';
    return 'muted';
  };

  return (
    <PageShell>
      <PageHeader
        title="Repository Portfolio"
        subtitle={`${active.length} active · ${archived.length} archived — synced from GitHub`}
        icon={<GitBranch size={20} />}
      />

      {errors.githubRepos && (
        <GlassCard style={{ padding: 12, marginBottom: 16, borderColor: 'var(--error)' }}>
          <span style={{ color: 'var(--error)' }}>{errors.githubRepos}</span>
        </GlassCard>
      )}

      {/* Last sync timestamp + hydrate hint */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        margin: '0 0 8px 0',
      }}>
        <h3 style={{
          margin: 0, fontSize: 12, textTransform: 'uppercase',
          letterSpacing: 1.2, color: 'var(--text)',
        }}>
          Active Repositories · {active.length}
        </h3>
        {lastSync && (
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Last GitHub sync: {new Date(lastSync).toLocaleString()}
          </span>
        )}
      </div>

      {githubRepos.length === 0 && !loading.githubRepos ? (
        <GlassCard style={{ padding: 16, color: 'var(--text-muted)', fontSize: 13 }}>
          No repositories synced yet. Run{' '}
          <code style={{ color: 'var(--text)' }}>npx tsx scripts/seed-github-repos.ts</code>{' '}
          to hydrate from GitHub.
        </GlassCard>
      ) : (
        <GlassCard style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                <th style={thStyle}>Repository</th>
                <th style={thStyle}>Language</th>
                <th style={thStyle}>Visibility</th>
                <th style={thStyle}>Last push</th>
                <th style={thStyle}>Issues</th>
                <th style={thStyle}>Stars</th>
                <th style={thStyle}>&nbsp;</th>
              </tr>
            </thead>
            <tbody>
              {active.map((r) => {
                const d = daysSince(r.pushed_at);
                return (
                  <tr key={r.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 600 }}>
                        {r.full_name}
                        <CopyButton value={r.full_name} />
                      </div>
                      {r.description && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {r.description.length > 120 ? `${r.description.slice(0, 120)}…` : r.description}
                        </div>
                      )}
                      {r.venture_id && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          Venture: {r.venture_id}
                        </div>
                      )}
                    </td>
                    <td style={tdStyle}>{r.language ?? '—'}</td>
                    <td style={tdStyle}>
                      <Chip tone={visibilityTone(r.visibility)}>{r.visibility}</Chip>
                    </td>
                    <td style={tdStyle}>
                      <Chip tone={freshnessTone(d)}>{freshnessLabel(d)}</Chip>
                      {r.pushed_at && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {new Date(r.pushed_at).toISOString().slice(0, 10)}
                        </div>
                      )}
                    </td>
                    <td style={tdStyle}>
                      {r.open_issues_count > 0
                        ? <Chip tone={r.open_issues_count > 10 ? 'warning' : 'muted'}>{r.open_issues_count}</Chip>
                        : <span style={{ color: 'var(--text-muted)' }}>0</span>}
                    </td>
                    <td style={tdStyle}>
                      {r.stargazers_count > 0
                        ? <span style={{ color: 'var(--text)' }}>★ {r.stargazers_count}</span>
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={tdStyle}>
                      {r.html_url && (
                        <a
                          href={r.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: 'var(--cyan, #00F5FF)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            textDecoration: 'none',
                          }}
                          aria-label={`Open ${r.full_name} on GitHub`}
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </GlassCard>
      )}

      {loading.githubRepos && githubRepos.length === 0 && (
        <TableSkeleton rows={3} columns={7} />
      )}

      {/* Archived repos — collapsed by default */}
      {archived.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowArchived((v) => !v)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 0',
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: 1.2,
            }}
          >
            <Archive size={14} />
            {showArchived ? 'Hide' : 'Show'} archived · {archived.length}
          </button>
          {showArchived && (
            <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, opacity: 0.65 }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <th style={thStyle}>Repository</th>
                    <th style={thStyle}>Language</th>
                    <th style={thStyle}>Last push</th>
                  </tr>
                </thead>
                <tbody>
                  {archived.map((r) => (
                    <tr key={r.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={tdStyle}>{r.full_name}</td>
                      <td style={tdStyle}>{r.language ?? '—'}</td>
                      <td style={tdStyle}>{r.pushed_at?.slice(0, 10) ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>
          )}
        </div>
      )}
    </PageShell>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: 'left', padding: '10px 12px', fontSize: 11,
  textTransform: 'uppercase', letterSpacing: 1.2, color: 'var(--text-muted)', fontWeight: 600,
};
const tdStyle: React.CSSProperties = { padding: '10px 12px', verticalAlign: 'top' };
