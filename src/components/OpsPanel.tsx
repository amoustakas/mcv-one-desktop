import { useState, useEffect } from 'react';
import { Activity, Cpu, Database, GitBranch, Globe, Shield, Wifi, Zap, RefreshCw, ExternalLink, Cloud, Server, Radio, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface RepoInfo { name: string; updated: string | null; open_issues: number; language?: string }
interface CommitInfo { sha: string; message: string; date: string }
interface DeployInfo { name: string; state: string; url: string; target: string; created: number }

function timeAgo(d: string | number) { const mins = Math.floor((Date.now() - (typeof d === 'number' ? d : new Date(d).getTime())) / 60000); if (mins < 1) return 'now'; if (mins < 60) return `${mins}m`; const h = Math.floor(mins / 60); if (h < 24) return `${h}h`; return `${Math.floor(h / 24)}d`; }

interface ServiceStatus { name: string; icon: React.ReactNode; status: 'online' | 'offline' | 'degraded'; latency?: string; detail?: string }

export default function OpsPanel() {
  const [repos, setRepos] = useState<RepoInfo[]>([]);
  const [commits, setCommits] = useState<CommitInfo[]>([]);
  const [deploys, setDeploys] = useState<DeployInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [dbStats, setDbStats] = useState({ tables: 0, conversations: 0, documents: 0, tasks: 0, contacts: 0 });

  async function load() {
    setLoading(true);
    const t0 = Date.now();
    const [gh, vc, hp] = await Promise.all([
      fetch('/api/github?action=overview').then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/vercel-status?action=deployments').then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/health').then(r => r.ok ? r.json() : null).catch(() => null),
    ]);
    const apiLatency = `${Date.now() - t0}ms`;

    if (gh) { setRepos(gh.repos || []); setCommits(gh.recent_commits || []); }
    if (vc) setDeploys(vc.deployments?.slice(0, 12) || []);

    // Build real service status from health check
    const h = hp || {};
    const svc: ServiceStatus[] = [
      { name: 'Claude API', icon: <Cpu size={13} />, status: h.ANTHROPIC_API_KEY ? 'online' : 'offline', latency: apiLatency },
      { name: 'Supabase', icon: <Database size={13} />, status: h.SUPABASE_URL ? 'online' : 'offline' },
      { name: 'Vercel', icon: <Cloud size={13} />, status: vc ? 'online' : 'offline', detail: vc ? `${(vc.deployments || []).length} deploys` : undefined },
      { name: 'GitHub', icon: <GitBranch size={13} />, status: (h.GITHUB_TOKEN && gh) ? 'online' : h.GITHUB_TOKEN ? 'degraded' : 'offline', detail: gh ? `${(gh.repos || []).length} repos` : undefined },
      { name: 'Gemini', icon: <Zap size={13} />, status: h.GOOGLE_AI_KEY ? 'online' : 'offline' },
      { name: 'Clerk Auth', icon: <Shield size={13} />, status: h.CLERK_SECRET_KEY ? 'online' : 'offline' },
      { name: 'Deepgram', icon: <Radio size={13} />, status: h.DEEPGRAM_API_KEY ? 'online' : 'offline' },
      { name: 'ElevenLabs', icon: <Server size={13} />, status: h.ELEVENLABS_API_KEY ? 'online' : 'offline' },
      { name: 'Notion', icon: <Globe size={13} />, status: h.NOTION_TOKEN ? 'online' : 'offline' },
      { name: 'Google Drive', icon: <Wifi size={13} />, status: h.GOOGLE_SERVICE_KEY ? 'online' : 'offline' },
    ];
    setServices(svc);

    // DB stats
    if (supabase) {
      const [conv, doc, task, contact] = await Promise.all([
        supabase.from('conversations').select('*', { count: 'exact', head: true }),
        supabase.from('documents').select('*', { count: 'exact', head: true }),
        supabase.from('tasks').select('*', { count: 'exact', head: true }),
        supabase.from('contacts').select('*', { count: 'exact', head: true }),
      ]);
      setDbStats({ tables: 9, conversations: conv.count || 0, documents: doc.count || 0, tasks: task.count || 0, contacts: contact.count || 0 });
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const onlineCount = services.filter(s => s.status === 'online').length;
  const totalIssues = repos.reduce((s, r) => s + (r.open_issues || 0), 0);
  const liveCount = deploys.filter(d => d.state === 'READY').length;

  return (
    <div className="ops">
      <div className="ops-header">
        <Activity size={20} />
        <h1 className="ops-title">Ops Center</h1>
        <div className="ops-header-stats">
          <span className="ops-stat-pill online"><CheckCircle2 size={10} /> {onlineCount}/{services.length} Online</span>
          <span className="ops-stat-pill">{repos.length} Repos</span>
          <span className="ops-stat-pill">{liveCount} Live</span>
        </div>
        <button className="ops-refresh" onClick={load} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
        </button>
      </div>

      <div className="ops-grid">
        {/* Left: Systems + DB */}
        <div className="ops-col">
          <div className="ops-section">
            <h2 className="ops-section-title"><Shield size={11} /> Service Health</h2>
            <div className="ops-systems">
              {services.map(s => (
                <div key={s.name} className="ops-sys">
                  {s.icon}
                  <span className="ops-sys-name">{s.name}</span>
                  {s.detail && <span className="ops-sys-detail">{s.detail}</span>}
                  {s.latency && <span className="ops-sys-latency">{s.latency}</span>}
                  <span className={`ops-sys-dot pulse-dot ${s.status === 'online' ? 'active' : ''}`} style={{
                    background: s.status === 'online' ? '#10B981' : s.status === 'degraded' ? '#F59E0B' : '#556677',
                    color: s.status === 'online' ? '#10B981' : s.status === 'degraded' ? '#F59E0B' : '#556677',
                  }} />
                </div>
              ))}
            </div>
          </div>
          <div className="ops-section">
            <h2 className="ops-section-title"><Database size={11} /> Database</h2>
            <div className="ops-db-stats">
              <div className="ops-db-row"><span>Tables</span><span className="ops-db-val">{dbStats.tables}</span></div>
              <div className="ops-db-row"><span>Conversations</span><span className="ops-db-val">{dbStats.conversations}</span></div>
              <div className="ops-db-row"><span>Documents</span><span className="ops-db-val">{dbStats.documents}</span></div>
              <div className="ops-db-row"><span>Tasks</span><span className="ops-db-val">{dbStats.tasks}</span></div>
              <div className="ops-db-row"><span>Contacts</span><span className="ops-db-val">{dbStats.contacts}</span></div>
            </div>
          </div>
          <div className="ops-section">
            <h2 className="ops-section-title"><GitBranch size={11} /> Repositories ({repos.length})</h2>
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

        {/* Center: Commits */}
        <div className="ops-col">
          <h2 className="ops-section-title">Recent Commits ({commits.length})</h2>
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

        {/* Right: Deployments */}
        <div className="ops-col">
          <h2 className="ops-section-title"><Cloud size={11} /> Deployments ({deploys.length})</h2>
          <div className="ops-deploys">
            {deploys.map((d, i) => (
              <a key={i} href={d.url} target="_blank" rel="noreferrer" className="ops-deploy">
                <span className={`ops-deploy-badge ${d.state === 'READY' ? 'live' : d.state === 'ERROR' ? 'err' : 'other'}`}>
                  {d.state === 'READY' ? 'LIVE' : d.state}
                </span>
                <span className="ops-deploy-name">{d.name}</span>
                <span className="ops-deploy-target">{d.target || 'preview'}</span>
                {d.created && <span className="ops-deploy-time">{timeAgo(d.created)}</span>}
                <ExternalLink size={9} className="ops-deploy-link" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .ops { height:100%; display:flex; flex-direction:column; overflow:hidden; }
        .ops-header { display:flex; align-items:center; gap:8px; padding:16px 20px 12px; flex-shrink:0; }
        .ops-title { font-family:var(--font-display); font-size:1.25rem; font-weight:700; }
        .ops-header-stats { display:flex; gap:6px; margin-left:auto; }
        .ops-stat-pill { font-size:10px; padding:3px 10px; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-full); color:var(--text-muted); font-family:var(--font-mono); display:flex; align-items:center; gap:4px; }
        .ops-stat-pill.online { color:var(--success); border-color:rgba(16,185,129,0.2); }
        .ops-refresh { width:30px; height:30px; display:flex; align-items:center; justify-content:center; border-radius:var(--radius-sm); color:var(--text-muted); }
        .ops-refresh:hover { background:var(--bg-card); color:var(--cyan); }

        .ops-grid { flex:1; display:grid; grid-template-columns:300px 1fr 1fr; gap:1px; background:var(--border); overflow:hidden; }
        .ops-col { background:var(--bg-deep); display:flex; flex-direction:column; overflow-y:auto; }

        .ops-section { border-bottom:1px solid var(--border); }
        .ops-section-title { font-size:11px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; padding:10px 14px; border-bottom:1px solid var(--border); flex-shrink:0; display:flex; align-items:center; gap:6px; }

        .ops-systems { display:flex; flex-direction:column; }
        .ops-sys { display:flex; align-items:center; gap:8px; padding:7px 14px; font-size:11px; color:var(--text-secondary); border-bottom:1px solid var(--border); }
        .ops-sys-name { flex:1; font-weight:500; }
        .ops-sys-detail { font-size:9px; color:var(--text-muted); font-family:var(--font-mono); }
        .ops-sys-latency { font-size:9px; color:var(--cyan); font-family:var(--font-mono); }
        .ops-sys-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }

        .ops-db-stats { display:flex; flex-direction:column; }
        .ops-db-row { display:flex; justify-content:space-between; padding:5px 14px; font-size:11px; color:var(--text-secondary); border-bottom:1px solid var(--border); }
        .ops-db-val { font-family:var(--font-mono); font-weight:600; color:var(--text-primary); }

        .ops-repos { display:flex; flex-direction:column; }
        .ops-repo { display:flex; align-items:center; gap:8px; padding:6px 14px; font-size:11px; border-bottom:1px solid var(--border); }
        .ops-repo-name { flex:1; font-weight:500; color:var(--text-primary); }
        .ops-repo-time { font-size:10px; color:var(--text-muted); font-family:var(--font-mono); }
        .ops-repo-issues { font-size:9px; font-weight:600; color:var(--warning); background:rgba(245,158,11,0.1); padding:1px 5px; border-radius:3px; }

        .ops-commits { display:flex; flex-direction:column; }
        .ops-commit { display:flex; align-items:baseline; gap:8px; padding:6px 14px; border-bottom:1px solid var(--border); }
        .ops-sha { font-family:var(--font-mono); font-size:10px; color:var(--cyan); background:var(--bg-surface); padding:1px 5px; border-radius:3px; flex-shrink:0; }
        .ops-commit-msg { flex:1; font-size:11px; color:var(--text-secondary); overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
        .ops-time { font-size:9px; color:var(--text-muted); font-family:var(--font-mono); flex-shrink:0; }

        .ops-deploys { display:flex; flex-direction:column; }
        .ops-deploy { display:flex; align-items:center; gap:8px; padding:6px 14px; border-bottom:1px solid var(--border); text-decoration:none; transition:background 0.1s; }
        .ops-deploy:hover { background:var(--bg-card); }
        .ops-deploy-badge { font-size:8px; font-weight:700; padding:1px 6px; border-radius:3px; text-transform:uppercase; flex-shrink:0; }
        .ops-deploy-badge.live { background:rgba(16,185,129,0.15); color:var(--success); }
        .ops-deploy-badge.err { background:rgba(239,68,68,0.15); color:var(--error); }
        .ops-deploy-badge.other { background:rgba(245,158,11,0.15); color:var(--warning); }
        .ops-deploy-name { flex:1; font-size:11px; color:var(--text-secondary); overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
        .ops-deploy-target { font-size:9px; color:var(--text-muted); }
        .ops-deploy-time { font-size:9px; color:var(--text-muted); font-family:var(--font-mono); }
        .ops-deploy-link { color:var(--text-muted); }

        @keyframes spin { to{transform:rotate(360deg)} }
        .spin { animation:spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
