// Deployment Portfolio — Foundation panel for Vercel deployments.
// Hydrated by scripts/seed-vercel-deployments.ts.
//
// Layout:
//   Top row: Projects grid (card per project, last deploy + state badge).
//   Main table: Recent deployments timeline — project, url, state, target,
//     created, git branch + commit.
//   Filter chips: all | production | preview | error-only.

import { useEffect, useMemo, useState } from 'react';
import { Zap, ExternalLink } from 'lucide-react';
import { PageShell, PageHeader, GlassCard } from '../../components/ui';
import { Chip, type ChipTone } from './_chip';
import { useFoundationStore, type VercelDeployment } from '../../stores/foundation';

type Filter = 'all' | 'production' | 'preview' | 'error-only';

export default function DeploymentPortfolioView() {
  const {
    vercelProjects, vercelDeployments, loading, errors,
    fetchVercelProjects, fetchVercelDeployments,
  } = useFoundationStore();
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    fetchVercelProjects();
    fetchVercelDeployments();
  }, [fetchVercelProjects, fetchVercelDeployments]);

  const filtered = useMemo(() => {
    switch (filter) {
      case 'production': return vercelDeployments.filter((d) => d.target === 'production');
      case 'preview': return vercelDeployments.filter((d) => d.target === 'preview');
      case 'error-only': return vercelDeployments.filter((d) => d.state === 'ERROR');
      default: return vercelDeployments;
    }
  }, [vercelDeployments, filter]);

  const lastSync = vercelDeployments.find((d) => d.last_synced_at)?.last_synced_at ?? null;

  // Map Vercel state → chip tone.
  const stateTone = (s: VercelDeployment['state']): ChipTone => {
    switch (s) {
      case 'READY': return 'success';
      case 'ERROR': return 'error';
      case 'BUILDING':
      case 'QUEUED':
      case 'INITIALIZING':
      case 'DEPLOYING':
        return 'warning';
      case 'CANCELED': return 'muted';
      default: return 'muted';
    }
  };

  const now = new Date();
  const relTime = (iso: string): string => {
    const secs = Math.floor((now.getTime() - new Date(iso).getTime()) / 1000);
    if (secs < 60) return `${secs}s ago`;
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
    return `${Math.floor(secs / 86400)}d ago`;
  };

  const counts = useMemo(() => ({
    all: vercelDeployments.length,
    production: vercelDeployments.filter((d) => d.target === 'production').length,
    preview: vercelDeployments.filter((d) => d.target === 'preview').length,
    error: vercelDeployments.filter((d) => d.state === 'ERROR').length,
  }), [vercelDeployments]);

  return (
    <PageShell>
      <PageHeader
        title="Deployment Portfolio"
        subtitle={`${vercelProjects.length} projects · ${counts.all} recent deployments — synced from Vercel`}
        icon={<Zap size={20} />}
      />

      {errors.vercelDeployments && (
        <GlassCard style={{ padding: 12, marginBottom: 16, borderColor: 'var(--error)' }}>
          <span style={{ color: 'var(--error)' }}>{errors.vercelDeployments}</span>
        </GlassCard>
      )}

      {/* Projects grid */}
      {vercelProjects.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{
            margin: '0 0 8px 0', fontSize: 12, textTransform: 'uppercase',
            letterSpacing: 1.2, color: 'var(--text)',
          }}>
            Projects · {vercelProjects.length}
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 12,
          }}>
            {vercelProjects.map((p) => {
              const lastDeploy = p.last_deployment_at;
              const d = lastDeploy ? Math.floor((now.getTime() - new Date(lastDeploy).getTime()) / 86_400_000) : null;
              const tone: ChipTone = d == null ? 'muted' : d <= 1 ? 'success' : d <= 7 ? 'info' : d <= 30 ? 'warning' : 'error';
              return (
                <GlassCard key={p.id} style={{ padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.name}
                      </div>
                      {p.framework && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {p.framework}
                        </div>
                      )}
                    </div>
                    {lastDeploy && <Chip tone={tone}>{d === 0 ? 'today' : d === 1 ? '1d' : `${d}d`}</Chip>}
                  </div>
                  {p.production_url && (
                    <a
                      href={`https://${p.production_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        marginTop: 8,
                        fontSize: 11,
                        color: 'var(--cyan, #00F5FF)',
                        textDecoration: 'none',
                      }}
                    >
                      {p.production_url} <ExternalLink size={11} />
                    </a>
                  )}
                </GlassCard>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{
          margin: 0, fontSize: 12, textTransform: 'uppercase',
          letterSpacing: 1.2, color: 'var(--text)',
        }}>
          Recent Deployments · {filtered.length}
        </h3>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {(['all', 'production', 'preview', 'error-only'] as Filter[]).map((f) => {
            const label =
              f === 'all' ? `All · ${counts.all}` :
              f === 'production' ? `Prod · ${counts.production}` :
              f === 'preview' ? `Preview · ${counts.preview}` :
              `Errors · ${counts.error}`;
            const isActive = filter === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                style={{
                  background: isActive ? 'rgba(0,245,255,0.15)' : 'transparent',
                  color: isActive ? 'var(--cyan, #00F5FF)' : 'var(--text-muted)',
                  border: `1px solid ${isActive ? 'rgba(0,245,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  padding: '4px 10px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.6,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {vercelDeployments.length === 0 && !loading.vercelDeployments ? (
        <GlassCard style={{ padding: 16, color: 'var(--text-muted)', fontSize: 13 }}>
          No deployments synced yet. Run{' '}
          <code style={{ color: 'var(--text)' }}>npx tsx scripts/seed-vercel-deployments.ts</code>{' '}
          to hydrate from Vercel.
        </GlassCard>
      ) : (
        <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                <th style={thStyle}>Project</th>
                <th style={thStyle}>State</th>
                <th style={thStyle}>Target</th>
                <th style={thStyle}>URL</th>
                <th style={thStyle}>Branch / Commit</th>
                <th style={thStyle}>When</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map((d) => (
                <tr key={d.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 600 }}>{d.project_name}</div>
                    {d.creator_username && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        by {d.creator_username}
                      </div>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <Chip tone={stateTone(d.state)}>{d.state}</Chip>
                  </td>
                  <td style={tdStyle}>
                    <Chip tone={d.target === 'production' ? 'info' : 'muted'}>
                      {d.target ?? 'preview'}
                    </Chip>
                  </td>
                  <td style={tdStyle}>
                    <a
                      href={`https://${d.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: 'var(--cyan, #00F5FF)',
                        textDecoration: 'none',
                        fontSize: 12,
                      }}
                    >
                      {d.url.length > 36 ? `${d.url.slice(0, 36)}…` : d.url}
                    </a>
                  </td>
                  <td style={tdStyle}>
                    {d.git_branch && (
                      <div style={{ fontSize: 12 }}>
                        <span style={{ color: 'var(--text-muted)' }}>{d.git_branch}</span>
                        {d.commit_sha && (
                          <span style={{ marginLeft: 6, fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>
                            {d.commit_sha.slice(0, 7)}
                          </span>
                        )}
                      </div>
                    )}
                    {d.commit_message && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {d.commit_message}
                      </div>
                    )}
                  </td>
                  <td style={tdStyle}>
                    <div>{relTime(d.created_at_vercel)}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {new Date(d.created_at_vercel).toISOString().slice(0, 16).replace('T', ' ')}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      )}

      {loading.vercelDeployments && vercelDeployments.length === 0 && (
        <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading deployments…
        </div>
      )}

      {lastSync && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12, textAlign: 'right' }}>
          Last Vercel sync: {new Date(lastSync).toLocaleString()}
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
