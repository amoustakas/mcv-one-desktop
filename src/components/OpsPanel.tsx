import { useState, useEffect } from 'react';
import { Server, Cpu, Wifi, Database, Shield, Zap, GitBranch, Globe, RefreshCw, ExternalLink } from 'lucide-react';

interface SystemMetric {
  label: string;
  value: string;
  status: 'ok' | 'warn' | 'error';
  icon: React.ReactNode;
}

interface RepoInfo {
  name: string;
  updated: string | null;
  open_issues: number;
  error?: string;
}

interface CommitInfo {
  sha: string;
  message: string;
  date: string;
}

interface DeployInfo {
  name: string;
  state: string;
  url: string;
  target: string;
  created: number;
}

function timeAgo(dateStr: string | number): string {
  const date = typeof dateStr === 'number' ? dateStr : new Date(dateStr).getTime();
  const diff = Date.now() - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const staticMetrics: SystemMetric[] = [
  { label: 'Claude API', value: 'Connected', status: 'ok', icon: <Cpu size={16} /> },
  { label: 'Gemini API', value: 'Standby', status: 'ok', icon: <Zap size={16} /> },
  { label: 'Supabase', value: 'Connected', status: 'ok', icon: <Database size={16} /> },
  { label: 'Vercel', value: 'Deployed', status: 'ok', icon: <Globe size={16} /> },
  { label: 'GitHub', value: 'Connected', status: 'ok', icon: <GitBranch size={16} /> },
  { label: 'Redpanda', value: 'Not configured', status: 'warn', icon: <Wifi size={16} /> },
  { label: 'Auth (Clerk)', value: 'Pending', status: 'warn', icon: <Shield size={16} /> },
  { label: 'Gateway', value: 'Operational', status: 'ok', icon: <Server size={16} /> },
];

export default function OpsPanel() {
  const [repos, setRepos] = useState<RepoInfo[]>([]);
  const [commits, setCommits] = useState<CommitInfo[]>([]);
  const [deploys, setDeploys] = useState<DeployInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<string>('');

  async function loadData() {
    setLoading(true);
    try {
      const [ghData, vcData] = await Promise.all([
        fetch('/api/github?action=overview').then((r) => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/vercel-status?action=deployments').then((r) => r.ok ? r.json() : null).catch(() => null),
      ]);

      if (ghData) {
        setRepos(ghData.repos || []);
        setCommits(ghData.recent_commits || []);
      }
      if (vcData) {
        setDeploys(vcData.deployments?.slice(0, 8) || []);
      }
      setLastRefresh(new Date().toLocaleTimeString());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  return (
    <div className="ops-panel">
      <div className="ops-header">
        <h2 className="ops-title">Operations Center</h2>
        <div className="ops-header-right">
          {lastRefresh && <span className="ops-refresh-time">Updated {lastRefresh}</span>}
          <button className="ops-refresh-btn" onClick={loadData} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* System Status Grid */}
      <div className="ops-section">
        <h3 className="ops-section-title">System Status</h3>
        <div className="ops-grid">
          {staticMetrics.map((m) => (
            <div key={m.label} className={`ops-card ${m.status}`}>
              <div className="ops-card-icon">{m.icon}</div>
              <div className="ops-card-info">
                <span className="ops-card-label">{m.label}</span>
                <span className="ops-card-value">{m.value}</span>
              </div>
              <div className={`ops-dot ${m.status}`} />
            </div>
          ))}
        </div>
      </div>

      {/* GitHub Repos */}
      <div className="ops-section">
        <h3 className="ops-section-title">GitHub Repositories</h3>
        <div className="ops-table">
          <div className="ops-table-header">
            <span>Repo</span>
            <span>Last Push</span>
            <span>Issues</span>
          </div>
          {repos.map((r) => (
            <div key={r.name} className="ops-table-row">
              <span className="ops-table-name">{r.name}</span>
              <span className="ops-table-val">{r.updated ? timeAgo(r.updated) : 'N/A'}</span>
              <span className="ops-table-val">{r.open_issues}</span>
            </div>
          ))}
          {repos.length === 0 && !loading && (
            <div className="ops-table-row"><span className="ops-table-empty">No data — check GITHUB_TOKEN</span></div>
          )}
        </div>
      </div>

      {/* Two column: Commits + Deploys */}
      <div className="ops-two-col">
        <div className="ops-section">
          <h3 className="ops-section-title">Recent Commits</h3>
          <div className="ops-list">
            {commits.map((c) => (
              <div key={c.sha} className="ops-list-item">
                <code className="ops-sha">{c.sha}</code>
                <span className="ops-list-text">{c.message}</span>
              </div>
            ))}
            {commits.length === 0 && !loading && <p className="ops-table-empty">No commits loaded</p>}
          </div>
        </div>

        <div className="ops-section">
          <h3 className="ops-section-title">Vercel Deployments</h3>
          <div className="ops-list">
            {deploys.map((d, i) => (
              <div key={i} className="ops-list-item">
                <span className={`ops-deploy-state ${d.state === 'READY' ? 'live' : d.state === 'ERROR' ? 'err' : 'building'}`}>
                  {d.state === 'READY' ? 'LIVE' : d.state}
                </span>
                <span className="ops-list-text">{d.name}</span>
                <span className="ops-deploy-target">{d.target || 'preview'}</span>
                <a href={d.url} target="_blank" rel="noreferrer" className="ops-link">
                  <ExternalLink size={11} />
                </a>
              </div>
            ))}
            {deploys.length === 0 && !loading && <p className="ops-table-empty">No deploys — check VERCEL_TOKEN</p>}
          </div>
        </div>
      </div>

      <style>{`
        .ops-panel {
          height: 100%;
          overflow-y: auto;
          padding: var(--space-lg);
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        .ops-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .ops-title { font-size: var(--text-xl); font-weight: 700; }

        .ops-header-right { display: flex; align-items: center; gap: var(--space-sm); }

        .ops-refresh-time { font-size: var(--text-xs); color: var(--text-muted); }

        .ops-refresh-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          transition: all var(--transition-fast);
        }
        .ops-refresh-btn:hover { background: var(--bg-card); color: var(--cyan); }

        .ops-section-title {
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: var(--space-sm);
        }

        .ops-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: var(--space-sm);
        }

        .ops-card {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: 10px 12px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
        }

        .ops-card-icon { color: var(--text-muted); flex-shrink: 0; }
        .ops-card-info { flex: 1; display: flex; flex-direction: column; min-width: 0; }
        .ops-card-label { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
        .ops-card-value { font-size: var(--text-sm); font-weight: 500; }

        .ops-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .ops-dot.ok { background: var(--success); box-shadow: 0 0 6px rgba(16,185,129,0.4); }
        .ops-dot.warn { background: var(--warning); box-shadow: 0 0 6px rgba(245,158,11,0.4); }
        .ops-dot.error { background: var(--error); box-shadow: 0 0 6px rgba(239,68,68,0.4); }

        .ops-table {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .ops-table-header {
          display: grid;
          grid-template-columns: 1fr 100px 60px;
          padding: 6px 12px;
          background: var(--bg-elevated);
          font-size: 10px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .ops-table-row {
          display: grid;
          grid-template-columns: 1fr 100px 60px;
          padding: 6px 12px;
          border-top: 1px solid var(--border);
          align-items: center;
        }

        .ops-table-name { font-size: var(--text-sm); font-weight: 500; }
        .ops-table-val { font-size: var(--text-xs); color: var(--text-secondary); font-family: var(--font-mono); }
        .ops-table-empty { font-size: var(--text-xs); color: var(--text-muted); grid-column: 1/-1; text-align: center; padding: var(--space-sm); }

        .ops-two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-md);
        }

        .ops-list {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .ops-list-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border-bottom: 1px solid var(--border);
          font-size: var(--text-xs);
        }

        .ops-list-item:last-child { border-bottom: none; }

        .ops-sha {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--cyan);
          background: var(--bg-surface);
          padding: 1px 5px;
          border-radius: 3px;
          flex-shrink: 0;
        }

        .ops-list-text {
          flex: 1;
          color: var(--text-secondary);
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .ops-deploy-state {
          font-size: 9px;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 3px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          flex-shrink: 0;
        }

        .ops-deploy-state.live { background: rgba(16,185,129,0.15); color: var(--success); }
        .ops-deploy-state.err { background: rgba(239,68,68,0.15); color: var(--error); }
        .ops-deploy-state.building { background: rgba(245,158,11,0.15); color: var(--warning); }

        .ops-deploy-target {
          font-size: 10px;
          color: var(--text-muted);
          flex-shrink: 0;
        }

        .ops-link {
          color: var(--text-muted);
          flex-shrink: 0;
          transition: color var(--transition-fast);
        }
        .ops-link:hover { color: var(--cyan); }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }

        @media (max-width: 768px) {
          .ops-two-col { grid-template-columns: 1fr; }
          .ops-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
