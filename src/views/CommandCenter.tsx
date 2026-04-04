import { useState, useEffect } from 'react';
import { GitBranch, Cloud, FileText, Zap, TrendingUp, RefreshCw } from 'lucide-react';
import { useNavigation } from '../stores/navigation';
import { useTheme } from '../stores/theme';
import { ventures } from '../lib/ventures';

interface RepoInfo { name: string; updated: string | null; open_issues: number }
interface CommitInfo { sha: string; message: string; date: string }
interface DeployInfo { name: string; state: string; target: string; created: number }

function timeAgo(dateStr: string | number): string {
  const d = typeof dateStr === 'number' ? dateStr : new Date(dateStr).getTime();
  const diff = Date.now() - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

const statusColors: Record<string, string> = {
  active: '#10B981', development: '#00F0FF', planned: '#8B5CF6', concept: '#6B7280',
};

export default function CommandCenter() {
  const [repos, setRepos] = useState<RepoInfo[]>([]);
  const [commits, setCommits] = useState<CommitInfo[]>([]);
  const [deploys, setDeploys] = useState<DeployInfo[]>([]);
  const [docCount, setDocCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { switchToVenture } = useNavigation();
  const { applyVentureTheme } = useTheme();

  async function load() {
    setLoading(true);
    const [gh, vc, docs] = await Promise.all([
      fetch('/api/github?action=overview').then((r) => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/vercel-status?action=deployments').then((r) => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/docs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'list' }) }).then((r) => r.ok ? r.json() : null).catch(() => null),
    ]);
    if (gh) { setRepos(gh.repos || []); setCommits(gh.recent_commits || []); }
    if (vc) setDeploys(vc.deployments?.slice(0, 6) || []);
    if (docs) setDocCount(docs.documents?.length || 0);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function handleVentureClick(slug: string) {
    switchToVenture(slug);
    applyVentureTheme(slug);
  }

  return (
    <div className="cc">
      {/* Header */}
      <div className="cc-header">
        <div>
          <h1 className="cc-title">Command Center</h1>
          <p className="cc-subtitle">EdgeIQ Holdings — Operational Overview</p>
        </div>
        <button className="cc-refresh" onClick={load} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
        </button>
      </div>

      {/* KPI Bar */}
      <div className="cc-kpi-bar">
        <div className="cc-kpi">
          <Zap size={14} />
          <div><span className="cc-kpi-val">9</span><span className="cc-kpi-label">Ventures</span></div>
        </div>
        <div className="cc-kpi">
          <GitBranch size={14} />
          <div><span className="cc-kpi-val">{repos.length}</span><span className="cc-kpi-label">Repos</span></div>
        </div>
        <div className="cc-kpi">
          <Cloud size={14} />
          <div><span className="cc-kpi-val">{deploys.length}</span><span className="cc-kpi-label">Deploys</span></div>
        </div>
        <div className="cc-kpi">
          <FileText size={14} />
          <div><span className="cc-kpi-val">{docCount}</span><span className="cc-kpi-label">Docs</span></div>
        </div>
        <div className="cc-kpi edge">
          <TrendingUp size={14} />
          <div><span className="cc-kpi-val">$0.025</span><span className="cc-kpi-label">EDGE</span></div>
        </div>
      </div>

      {/* Venture Health Grid */}
      <div className="cc-section">
        <h2 className="cc-section-title">Venture Health</h2>
        <div className="cc-venture-grid">
          {ventures.map((v) => (
            <button
              key={v.id}
              className="cc-venture-card"
              onClick={() => handleVentureClick(v.id)}
            >
              <div className="cc-vc-top">
                <span className="cc-vc-icon" style={{ background: v.color }}>{v.icon}</span>
                <span className="cc-vc-status" style={{ color: statusColors[v.status] }}>
                  <span className="cc-vc-dot" style={{ background: statusColors[v.status] }} />
                  {v.status}
                </span>
              </div>
              <span className="cc-vc-name">{v.name}</span>
              <span className="cc-vc-tagline">{v.tagline}</span>
              <div className="cc-vc-accent" style={{ background: `linear-gradient(90deg, transparent, ${v.color}40, transparent)` }} />
            </button>
          ))}
        </div>
      </div>

      {/* Two columns: Commits + Deployments */}
      <div className="cc-two-col">
        <div className="cc-section">
          <h2 className="cc-section-title">Recent Commits</h2>
          <div className="cc-list">
            {commits.map((c) => (
              <div key={c.sha} className="cc-list-item">
                <code className="cc-sha">{c.sha}</code>
                <span className="cc-list-text">{c.message}</span>
                <span className="cc-list-time">{timeAgo(c.date)}</span>
              </div>
            ))}
            {commits.length === 0 && !loading && <p className="cc-empty">No commits</p>}
          </div>
        </div>

        <div className="cc-section">
          <h2 className="cc-section-title">Deployments</h2>
          <div className="cc-list">
            {deploys.map((d, i) => (
              <div key={i} className="cc-list-item">
                <span className={`cc-deploy-badge ${d.state === 'READY' ? 'live' : 'other'}`}>
                  {d.state === 'READY' ? 'LIVE' : d.state}
                </span>
                <span className="cc-list-text">{d.name}</span>
                <span className="cc-list-time">{d.target || 'preview'}</span>
              </div>
            ))}
            {deploys.length === 0 && !loading && <p className="cc-empty">No deploys</p>}
          </div>
        </div>
      </div>

      <style>{`
        .cc { height: 100%; overflow-y: auto; padding: 20px 24px; display: flex; flex-direction: column; gap: 20px; }

        .cc-header { display: flex; justify-content: space-between; align-items: flex-start; }
        .cc-title { font-family: var(--font-display); font-size: 1.75rem; font-weight: 700; color: var(--text-primary); letter-spacing: -0.5px; }
        .cc-subtitle { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
        .cc-refresh { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-sm); color: var(--text-muted); transition: all var(--transition-fast); }
        .cc-refresh:hover { background: var(--bg-card); color: var(--cyan); }

        .cc-kpi-bar { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
        .cc-kpi {
          display: flex; align-items: center; gap: 10px; padding: 12px 14px;
          background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md);
          color: var(--text-muted);
        }
        .cc-kpi > div { display: flex; flex-direction: column; }
        .cc-kpi-val { font-family: var(--font-mono); font-size: 1.1rem; font-weight: 700; color: var(--text-primary); }
        .cc-kpi-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); }
        .cc-kpi.edge { border-color: rgba(139, 92, 246, 0.2); }
        .cc-kpi.edge .cc-kpi-val { color: var(--purple); }

        .cc-section-title {
          font-family: var(--font-display); font-size: 13px; font-weight: 600;
          color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px;
          margin-bottom: 8px;
        }

        .cc-venture-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; }

        .cc-venture-card {
          position: relative; overflow: hidden;
          display: flex; flex-direction: column; gap: 2px;
          padding: 14px; background: var(--bg-card); border: 1px solid var(--border);
          border-radius: var(--radius-md); text-align: left;
          transition: all 0.2s ease; cursor: pointer;
        }
        .cc-venture-card:hover {
          border-color: var(--border-active);
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(0, 240, 255, 0.06);
        }

        .cc-vc-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
        .cc-vc-icon {
          width: 28px; height: 28px; border-radius: var(--radius-sm);
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 11px; color: var(--bg-deep);
        }
        .cc-vc-status { display: flex; align-items: center; gap: 4px; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .cc-vc-dot { width: 6px; height: 6px; border-radius: 50%; }
        .cc-vc-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
        .cc-vc-tagline { font-size: 10px; color: var(--text-muted); }
        .cc-vc-accent { position: absolute; bottom: 0; left: 0; right: 0; height: 2px; }

        .cc-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

        .cc-list { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; }
        .cc-list-item {
          display: flex; align-items: center; gap: 8px;
          padding: 7px 12px; border-bottom: 1px solid var(--border); font-size: 11px;
        }
        .cc-list-item:last-child { border-bottom: none; }

        .cc-sha { font-family: var(--font-mono); font-size: 10px; color: var(--cyan); background: var(--bg-surface); padding: 1px 5px; border-radius: 3px; flex-shrink: 0; }
        .cc-list-text { flex: 1; color: var(--text-secondary); overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
        .cc-list-time { font-size: 10px; color: var(--text-muted); font-family: var(--font-mono); flex-shrink: 0; }

        .cc-deploy-badge { font-size: 8px; font-weight: 700; padding: 1px 6px; border-radius: 3px; text-transform: uppercase; letter-spacing: 0.5px; flex-shrink: 0; }
        .cc-deploy-badge.live { background: rgba(16, 185, 129, 0.15); color: var(--success); }
        .cc-deploy-badge.other { background: rgba(245, 158, 11, 0.15); color: var(--warning); }

        .cc-empty { padding: 16px; text-align: center; font-size: 11px; color: var(--text-muted); }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
