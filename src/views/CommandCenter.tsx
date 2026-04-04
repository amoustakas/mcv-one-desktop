import { useState, useEffect } from 'react';
import { GitBranch, Cloud, Zap, RefreshCw, ExternalLink, CheckSquare, Users, BookOpen, MessageSquare, Activity, Shield, TrendingUp, Cpu } from 'lucide-react';
import { useNavigation } from '../stores/navigation';
import { useTheme } from '../stores/theme';
import { ventures } from '../lib/ventures';
import { supabase } from '../lib/supabase';

interface RepoInfo { name: string; updated: string | null; open_issues: number }
interface CommitInfo { sha: string; message: string; date: string }
interface DeployInfo { name: string; state: string; url: string; target: string; created: number }

function timeAgo(d: string | number) { const mins = Math.floor((Date.now() - (typeof d === 'number' ? d : new Date(d).getTime())) / 60000); if (mins < 1) return 'now'; if (mins < 60) return `${mins}m`; const h = Math.floor(mins / 60); if (h < 24) return `${h}h`; return `${Math.floor(h / 24)}d`; }

const statusColors: Record<string, string> = { active: '#10B981', development: '#00F0FF', planned: '#8B5CF6', concept: '#6B7280' };

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Burning the midnight oil';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Late night session';
}

export default function CommandCenter() {
  const [repos, setRepos] = useState<RepoInfo[]>([]);
  const [commits, setCommits] = useState<CommitInfo[]>([]);
  const [deploys, setDeploys] = useState<DeployInfo[]>([]);
  const [docCount, setDocCount] = useState(0);
  const [taskCount, setTaskCount] = useState(0);
  const [contactCount, setContactCount] = useState(0);
  const [dealCount, setDealCount] = useState(0);
  const [convCount, setConvCount] = useState(0);
  const [msgCount, setMsgCount] = useState(0);
  const [teamCount, setTeamCount] = useState(0);
  const [campaignCount, setCampaignCount] = useState(0);
  const [activities, setActivities] = useState<{ type: string; title: string; created_at: string; contacts?: { name: string } | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const { switchToVenture, setView } = useNavigation();
  const { applyVentureTheme } = useTheme();

  async function load() {
    setLoading(true);
    const [gh, vc, docs, tasks, crm, team, campaigns, acts] = await Promise.all([
      fetch('/api/github?action=overview').then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/vercel-status?action=deployments').then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/docs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'list' }) }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'list' }) }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/crm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'stats' }) }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/team', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'list' }) }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'list' }) }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/crm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'list-activities' }) }).then(r => r.ok ? r.json() : null).catch(() => null),
    ]);
    if (gh) { setRepos(gh.repos || []); setCommits(gh.recent_commits || []); }
    if (vc) setDeploys(vc.deployments?.slice(0, 8) || []);
    if (docs) setDocCount(docs.documents?.length || 0);
    if (tasks) setTaskCount((tasks.tasks || []).filter((t: { status?: string }) => t.status !== 'done' && t.status !== 'completed').length);
    if (crm) { setContactCount(crm.totalContacts || 0); setDealCount(crm.totalDeals || 0); }
    if (team) setTeamCount((team.members || []).length);
    if (campaigns) setCampaignCount((campaigns.campaigns || []).length);
    if (acts) setActivities((acts.activities || []).slice(0, 8));

    if (supabase) {
      const [c, m] = await Promise.all([
        supabase.from('conversations').select('*', { count: 'exact', head: true }),
        supabase.from('messages').select('*', { count: 'exact', head: true }),
      ]);
      setConvCount(c.count || 0);
      setMsgCount(m.count || 0);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function enterVenture(slug: string) { switchToVenture(slug); applyVentureTheme(slug); }

  const activeVentures = ventures.filter(v => v.status === 'active' || v.status === 'development').length;

  return (
    <div className="cc">
      {/* Hero Header */}
      <div className="cc-hero">
        <div className="cc-hero-content">
          <div>
            <p className="cc-greeting">{getGreeting()}, Tony</p>
            <h1 className="cc-title">Command Center</h1>
            <p className="cc-sub">EdgeIQ Holdings &middot; {ventures.length} ventures &middot; {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
          </div>
          <button className="cc-refresh" onClick={load} disabled={loading}><RefreshCw size={14} className={loading ? 'spin' : ''} /></button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="cc-kpis">
        <div className="cc-kpi glow-border" onClick={() => setView('portfolio')}><Zap size={14} className="kpi-icon cyan"/><div><span className="cc-kpi-v">{ventures.length}</span><span className="cc-kpi-l">Ventures</span></div><span className="cc-kpi-sub">{activeVentures} active</span></div>
        <div className="cc-kpi" onClick={() => setView('engineering')}><GitBranch size={14} className="kpi-icon"/><div><span className="cc-kpi-v">{repos.length}</span><span className="cc-kpi-l">Repositories</span></div></div>
        <div className="cc-kpi" onClick={() => setView('ops')}><Cloud size={14} className="kpi-icon"/><div><span className="cc-kpi-v">{deploys.length}</span><span className="cc-kpi-l">Deployments</span></div></div>
        <div className="cc-kpi" onClick={() => setView('docs')}><BookOpen size={14} className="kpi-icon"/><div><span className="cc-kpi-v">{docCount || '...'}</span><span className="cc-kpi-l">Knowledge Base</span></div></div>
        <div className="cc-kpi" onClick={() => setView('tasks')}><CheckSquare size={14} className="kpi-icon"/><div><span className="cc-kpi-v">{taskCount || '...'}</span><span className="cc-kpi-l">Active Tasks</span></div></div>
        <div className="cc-kpi" onClick={() => setView('crm')}><Users size={14} className="kpi-icon"/><div><span className="cc-kpi-v">{contactCount}</span><span className="cc-kpi-l">Contacts</span></div><span className="cc-kpi-sub">{dealCount} deals</span></div>
        <div className="cc-kpi"><MessageSquare size={14} className="kpi-icon"/><div><span className="cc-kpi-v">{convCount}</span><span className="cc-kpi-l">Conversations</span></div><span className="cc-kpi-sub">{msgCount} msgs</span></div>
        <div className="cc-kpi" onClick={() => setView('team')}><Shield size={14} className="kpi-icon"/><div><span className="cc-kpi-v">{teamCount}</span><span className="cc-kpi-l">Team</span></div></div>
        <div className="cc-kpi" onClick={() => setView('growth')}><TrendingUp size={14} className="kpi-icon"/><div><span className="cc-kpi-v">{campaignCount}</span><span className="cc-kpi-l">Campaigns</span></div></div>
      </div>

      <div className="cc-main">
        {/* Left: Ventures */}
        <div className="cc-col">
          <div className="cc-section">
            <h2 className="cc-sec-title">Venture Health</h2>
            <div className="cc-ventures">
              {ventures.map(v => (
                <button key={v.id} className="cc-vc glass-neural holo-hover" onClick={() => enterVenture(v.id)}>
                  <div className="cc-vc-accent" style={{ background: `linear-gradient(90deg, transparent, ${v.color}40, transparent)` }} />
                  <div className="cc-vc-head">
                    <span className="cc-vc-icon" style={{ background: v.color }}>{v.icon}</span>
                    <span className="cc-vc-status" style={{ color: statusColors[v.status] }}>
                      <span className="cc-vc-dot pulse-dot active" style={{ background: statusColors[v.status], color: statusColors[v.status] }} />
                      {v.status}
                    </span>
                  </div>
                  <span className="cc-vc-name">{v.name}</span>
                  <span className="cc-vc-tag">{v.tagline}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Activity Feed */}
        <div className="cc-col">
          <div className="cc-section">
            <h2 className="cc-sec-title"><Activity size={12}/> Recent Activity</h2>
            <div className="cc-activity-feed">
              {activities.map((a, i) => (
                <div key={i} className="cc-act-item">
                  <span className="cc-act-type" style={{ color: a.type === 'call' ? '#10B981' : a.type === 'email' ? '#3B82F6' : a.type === 'meeting' ? '#8B5CF6' : '#F59E0B' }}>{a.type}</span>
                  <span className="cc-act-title">{a.title}</span>
                  {a.contacts?.name && <span className="cc-act-contact">{a.contacts.name}</span>}
                  <span className="cc-act-time">{timeAgo(a.created_at)}</span>
                </div>
              ))}
              {activities.length === 0 && <p className="cc-empty-hint">No recent activity. Log interactions in the CRM.</p>}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="cc-section">
            <h2 className="cc-sec-title"><Cpu size={12}/> Quick Actions</h2>
            <div className="cc-actions">
              <button className="cc-action holo-hover" onClick={() => setView('chat')}>New Chat</button>
              <button className="cc-action holo-hover" onClick={() => setView('docs')}>Docs Hub</button>
              <button className="cc-action holo-hover" onClick={() => setView('tasks')}>Task Board</button>
              <button className="cc-action holo-hover" onClick={() => setView('crm')}>CRM Pipeline</button>
              <button className="cc-action holo-hover" onClick={() => setView('engineering')}>Engineering</button>
              <button className="cc-action holo-hover" onClick={() => setView('war-room')}>War Room</button>
              <button className="cc-action holo-hover" onClick={() => setView('ai-studio')}>AI Studio</button>
              <button className="cc-action holo-hover" onClick={() => setView('treasury')}>Treasury</button>
            </div>
          </div>
        </div>

        {/* Right: Feeds */}
        <div className="cc-col">
          <div className="cc-feed">
            <h2 className="cc-sec-title"><GitBranch size={12}/> Commits</h2>
            <div className="cc-feed-list">
              {commits.map(c => (
                <div key={c.sha} className="cc-feed-item">
                  <code className="cc-sha">{c.sha}</code>
                  <span className="cc-feed-msg">{c.message}</span>
                  <span className="cc-feed-time">{timeAgo(c.date)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="cc-feed">
            <h2 className="cc-sec-title"><Cloud size={12}/> Deployments</h2>
            <div className="cc-feed-list">
              {deploys.map((d, i) => (
                <a key={i} href={d.url} target="_blank" rel="noreferrer" className="cc-feed-item link">
                  <span className={`cc-badge ${d.state === 'READY' ? 'live' : 'other'}`}>{d.state === 'READY' ? 'LIVE' : d.state}</span>
                  <span className="cc-feed-msg">{d.name}</span>
                  <span className="cc-feed-time">{d.target || 'preview'}</span>
                  <ExternalLink size={9} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .cc { height:100%; overflow-y:auto; padding:0; display:flex; flex-direction:column; gap:0; }

        .cc-hero { padding:20px 24px 16px; position:relative; }
        .cc-hero::after { content:""; position:absolute; bottom:0; left:24px; right:24px; height:1px; background:linear-gradient(90deg, transparent, rgba(0,240,255,0.12), transparent); }
        .cc-hero-content { display:flex; justify-content:space-between; align-items:flex-start; }
        .cc-greeting { font-size:13px; color:var(--cyan); font-weight:500; margin-bottom:2px; text-shadow:0 0 10px rgba(0,240,255,0.3); }
        .cc-title { font-family:var(--font-display); font-size:1.75rem; font-weight:700; letter-spacing:-0.5px; }
        .cc-sub { font-size:11px; color:var(--text-muted); margin-top:2px; }
        .cc-refresh { width:30px; height:30px; display:flex; align-items:center; justify-content:center; border-radius:var(--radius-sm); color:var(--text-muted); }
        .cc-refresh:hover { background:var(--bg-card); color:var(--cyan); }

        .cc-kpis { display:grid; grid-template-columns:repeat(auto-fit,minmax(130px,1fr)); gap:6px; padding:16px 24px; }
        .cc-kpi { display:flex; align-items:center; gap:10px; padding:12px 14px; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-md); cursor:pointer; transition:all 0.2s; position:relative; overflow:hidden; }
        .cc-kpi:hover { border-color:var(--border-active); transform:translateY(-1px); box-shadow:0 4px 16px rgba(0,240,255,0.05); }
        .cc-kpi>div { display:flex; flex-direction:column; }
        .cc-kpi-v { font-family:var(--font-mono); font-size:1rem; font-weight:700; color:var(--text-primary); }
        .cc-kpi-l { font-size:9px; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-muted); }
        .cc-kpi-sub { font-size:9px; color:var(--text-muted); font-family:var(--font-mono); margin-left:auto; }
        .kpi-icon { color:var(--text-muted); flex-shrink:0; }
        .kpi-icon.cyan { color:var(--cyan); }

        .cc-main { display:grid; grid-template-columns:1fr 1fr 380px; gap:16px; padding:0 24px 24px; flex:1; min-height:0; }
        @media (max-width:1600px) { .cc-main { grid-template-columns:1fr 1fr; } }

        .cc-col { display:flex; flex-direction:column; gap:12px; }

        .cc-sec-title { font-family:var(--font-display); font-size:11px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; margin-bottom:8px; display:flex; align-items:center; gap:6px; }

        .cc-ventures { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:6px; }
        .cc-vc { position:relative; overflow:hidden; padding:12px; border-radius:var(--radius-md); text-align:left; display:flex; flex-direction:column; gap:2px; transition:all 0.2s; cursor:pointer; }
        .cc-vc:hover { border-color:rgba(255,255,255,0.12); transform:translateY(-1px); box-shadow:0 4px 16px rgba(0,240,255,0.05); }
        .cc-vc-accent { position:absolute; bottom:0; left:0; right:0; height:2px; }
        .cc-vc-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:4px; }
        .cc-vc-icon { width:26px; height:26px; border-radius:var(--radius-sm); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:11px; color:var(--bg-deep); }
        .cc-vc-status { display:flex; align-items:center; gap:4px; font-size:9px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; }
        .cc-vc-dot { width:5px; height:5px; border-radius:50%; }
        .cc-vc-name { font-size:13px; font-weight:600; }
        .cc-vc-tag { font-size:10px; color:var(--text-muted); }

        /* Activity Feed */
        .cc-activity-feed { display:flex; flex-direction:column; gap:2px; }
        .cc-act-item { display:flex; align-items:center; gap:8px; padding:6px 10px; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-sm); font-size:11px; }
        .cc-act-type { font-size:8px; font-weight:700; text-transform:uppercase; width:45px; flex-shrink:0; }
        .cc-act-title { flex:1; color:var(--text-secondary); overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
        .cc-act-contact { font-size:10px; color:var(--text-muted); flex-shrink:0; }
        .cc-act-time { font-size:9px; color:var(--text-muted); font-family:var(--font-mono); flex-shrink:0; }
        .cc-empty-hint { font-size:11px; color:var(--text-muted); text-align:center; padding:16px; }

        /* Feeds */
        .cc-feed { background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-md); overflow:hidden; }
        .cc-feed .cc-sec-title { padding:8px 12px; margin:0; border-bottom:1px solid var(--border); }
        .cc-feed-list { max-height:200px; overflow-y:auto; }
        .cc-feed-item { display:flex; align-items:center; gap:8px; padding:5px 12px; border-bottom:1px solid var(--border); font-size:11px; }
        .cc-feed-item:last-child { border-bottom:none; }
        .cc-feed-item.link { text-decoration:none; transition:background 0.1s; }
        .cc-feed-item.link:hover { background:var(--bg-elevated); }
        .cc-sha { font-family:var(--font-mono); font-size:10px; color:var(--cyan); background:var(--bg-surface); padding:1px 5px; border-radius:3px; flex-shrink:0; }
        .cc-feed-msg { flex:1; color:var(--text-secondary); overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
        .cc-feed-time { font-size:9px; color:var(--text-muted); font-family:var(--font-mono); flex-shrink:0; }
        .cc-badge { font-size:8px; font-weight:700; padding:1px 5px; border-radius:3px; text-transform:uppercase; flex-shrink:0; }
        .cc-badge.live { background:rgba(16,185,129,0.15); color:var(--success); }
        .cc-badge.other { background:rgba(245,158,11,0.15); color:var(--warning); }

        .cc-actions { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
        .cc-action { padding:10px 12px; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text-secondary); font-size:11px; font-weight:500; transition:all 0.15s; position:relative; overflow:hidden; }
        .cc-action:hover { color:var(--cyan); border-color:var(--border-active); box-shadow:0 0 12px rgba(0,240,255,0.06); }

        @keyframes spin { to{transform:rotate(360deg)} }
        .spin { animation:spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
