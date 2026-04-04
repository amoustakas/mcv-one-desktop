import { useState, useEffect } from 'react';
import { Activity, Server, Cpu, Database, GitBranch, Globe, Shield, Wifi, Zap, RefreshCw, ExternalLink } from 'lucide-react';

interface RepoInfo { name: string; updated: string | null; open_issues: number }
interface CommitInfo { sha: string; message: string; date: string }
interface DeployInfo { name: string; state: string; url: string; target: string; created: number }

function timeAgo(d: string | number) { const mins = Math.floor((Date.now() - (typeof d === 'number' ? d : new Date(d).getTime())) / 60000); if (mins < 60) return `${mins}m`; const h = Math.floor(mins / 60); if (h < 24) return `${h}h`; return `${Math.floor(h / 24)}d`; }

const systems = [
  { label: 'Claude API', icon: <Cpu size={13} />, ok: true },
  { label: 'Supabase', icon: <Database size={13} />, ok: true },
  { label: 'Vercel', icon: <Globe size={13} />, ok: true },
  { label: 'GitHub', icon: <GitBranch size={13} />, ok: true },
  { label: 'Gemini', icon: <Zap size={13} />, ok: false },
  { label: 'Clerk', icon: <Shield size={13} />, ok: true },
  { label: 'Deepgram', icon: <Server size={13} />, ok: true },
  { label: 'Redpanda', icon: <Wifi size={13} />, ok: false },
];

export default function OpsPanel() {
  const [repos, setRepos] = useState<RepoInfo[]>([]);
  const [commits, setCommits] = useState<CommitInfo[]>([]);
  const [deploys, setDeploys] = useState<DeployInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<Record<string, boolean>>({});

  async function load() {
    setLoading(true);
    const [gh, vc, hp] = await Promise.all([
      fetch('/api/github?action=overview').then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/vercel-status?action=deployments').then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/health').then(r => r.ok ? r.json() : null).catch(() => null),
    ]);
    if (gh) { setRepos(gh.repos || []); setCommits(gh.recent_commits || []); }
    if (vc) setDeploys(vc.deployments?.slice(0, 12) || []);
    if (hp) setHealth(hp.configured || {});
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="ops">
      <div className="ops-header">
        <Activity size={20} />
        <h1 className="ops-title">Ops Center</h1>
        <button className="ops-refresh" onClick={load} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
        </button>
      </div>

      <div className="ops-grid">
        {/* Systems + Repos column */}
        <div className="ops-col">
          <div className="ops-section">
            <h2 className="ops-section-title">System Health</h2>
            <div className="ops-systems">
              {systems.map(s => (
                <div key={s.label} className="ops-sys">
                  {s.icon}
                  <span className="ops-sys-name">{s.label}</span>
                  <span className={`ops-sys-dot ${(health[s.label.toUpperCase().replace(/ /g, '_') + '_API_KEY'] || health[s.label.toUpperCase().replace(/ /g, '_') + '_TOKEN'] || s.ok) ? 'ok' : 'off'}`} />
                </div>
              ))}
            </div>
          </div>
          <div className="ops-section">
            <h2 className="ops-section-title">Repositories</h2>
            <div className="ops-repos">
              {repos.map(r => (
                <div key={r.name} className="ops-repo">
                  <span className="ops-repo-name">{r.name}</span>
                  <span className="ops-repo-time">{r.updated ? timeAgo(r.updated) : '—'}</span>
                  {r.open_issues > 0 && <span className="ops-repo-issues">{r.open_issues}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Commits column */}
        <div className="ops-col">
          <h2 className="ops-section-title">Recent Commits</h2>
          <div className="ops-commits">
            {commits.map(c => (
              <div key={c.sha} className="ops-commit">
                <code className="ops-sha">{c.sha}</code>
                <span className="ops-commit-msg">{c.message}</span>
                <span className="ops-time">{timeAgo(c.date)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Deployments column */}
        <div className="ops-col">
          <h2 className="ops-section-title">Vercel Deployments</h2>
          <div className="ops-deploys">
            {deploys.map((d, i) => (
              <a key={i} href={d.url} target="_blank" rel="noreferrer" className="ops-deploy">
                <span className={`ops-deploy-badge ${d.state === 'READY' ? 'live' : 'other'}`}>
                  {d.state === 'READY' ? 'LIVE' : d.state}
                </span>
                <span className="ops-deploy-name">{d.name}</span>
                <span className="ops-deploy-target">{d.target || 'preview'}</span>
                <ExternalLink size={9} className="ops-deploy-link" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .ops { height: 100%; display: flex; flex-direction: column; overflow: hidden; }
        .ops-header { display: flex; align-items: center; gap: 8px; padding: 16px 20px 12px; flex-shrink: 0; }
        .ops-title { font-family: var(--font-display); font-size: 1.25rem; font-weight: 700; flex: 1; }
        .ops-refresh { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-sm); color: var(--text-muted); transition: all 0.15s; }
        .ops-refresh:hover { background: var(--bg-card); color: var(--cyan); }

        .ops-grid { flex: 1; display: grid; grid-template-columns: 280px 1fr 1fr; gap: 1px; background: var(--border); overflow: hidden; }
        .ops-col { background: var(--bg-deep); display: flex; flex-direction: column; overflow-y: auto; }

        .ops-section { border-bottom: 1px solid var(--border); }
        .ops-section-title { font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 14px; border-bottom: 1px solid var(--border); flex-shrink: 0; }

        .ops-systems { display: flex; flex-direction: column; }
        .ops-sys { display: flex; align-items: center; gap: 8px; padding: 6px 14px; font-size: 11px; color: var(--text-secondary); border-bottom: 1px solid var(--border); }
        .ops-sys-name { flex: 1; }
        .ops-sys-dot { width: 6px; height: 6px; border-radius: 50%; }
        .ops-sys-dot.ok { background: var(--success); box-shadow: 0 0 4px rgba(16,185,129,0.4); }
        .ops-sys-dot.off { background: var(--text-muted); opacity: 0.4; }

        .ops-repos { display: flex; flex-direction: column; }
        .ops-repo { display: flex; align-items: center; gap: 8px; padding: 6px 14px; font-size: 11px; border-bottom: 1px solid var(--border); }
        .ops-repo-name { flex: 1; font-weight: 500; color: var(--text-primary); }
        .ops-repo-time { font-size: 10px; color: var(--text-muted); font-family: var(--font-mono); }
        .ops-repo-issues { font-size: 9px; font-weight: 600; color: var(--warning); background: rgba(245,158,11,0.1); padding: 1px 5px; border-radius: 3px; }

        .ops-commits { display: flex; flex-direction: column; }
        .ops-commit { display: flex; align-items: baseline; gap: 8px; padding: 6px 14px; border-bottom: 1px solid var(--border); }
        .ops-sha { font-family: var(--font-mono); font-size: 10px; color: var(--cyan); background: var(--bg-surface); padding: 1px 5px; border-radius: 3px; flex-shrink: 0; }
        .ops-commit-msg { flex: 1; font-size: 11px; color: var(--text-secondary); overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
        .ops-time { font-size: 9px; color: var(--text-muted); font-family: var(--font-mono); flex-shrink: 0; }

        .ops-deploys { display: flex; flex-direction: column; }
        .ops-deploy { display: flex; align-items: center; gap: 8px; padding: 6px 14px; border-bottom: 1px solid var(--border); text-decoration: none; transition: background 0.1s; }
        .ops-deploy:hover { background: var(--bg-card); }
        .ops-deploy-badge { font-size: 8px; font-weight: 700; padding: 1px 6px; border-radius: 3px; text-transform: uppercase; letter-spacing: 0.5px; flex-shrink: 0; }
        .ops-deploy-badge.live { background: rgba(16,185,129,0.15); color: var(--success); }
        .ops-deploy-badge.other { background: rgba(245,158,11,0.15); color: var(--warning); }
        .ops-deploy-name { flex: 1; font-size: 11px; color: var(--text-secondary); overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
        .ops-deploy-target { font-size: 9px; color: var(--text-muted); }
        .ops-deploy-link { color: var(--text-muted); }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
