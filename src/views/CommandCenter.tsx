import { useState, useEffect, useCallback } from 'react';
import { GitBranch, Cloud, Zap, ExternalLink, CheckSquare, Users, BookOpen, MessageSquare, Activity, Shield, TrendingUp, Cpu } from 'lucide-react';
import { useNavigation } from '../stores/navigation';
import { useTheme } from '../stores/theme';
import { ventures } from '../lib/ventures';
import { supabase } from '../lib/supabase';
import { useGithubRepos, useGithubCommits } from '../hooks/use-github';
import { useDeployments } from '../hooks/use-deployments';
import { useDocuments } from '../hooks/use-docs';
import { useTasks } from '../hooks/use-tasks';
import { useContacts, useDeals, useActivities } from '../hooks/use-crm';
import { useTeamMembers } from '../hooks/use-team';
import { useCampaigns } from '../hooks/use-campaigns';
import { PageShell, StatCard, GlassCard, GridLayout, PageHeader } from '../components/ui';
import { timeAgo } from '../lib/utils';

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
  const { switchToVenture, setView } = useNavigation();
  const { applyVentureTheme } = useTheme();

  // TanStack Query hooks
  const { data: repos = [], isLoading: reposLoading, refetch: refetchRepos } = useGithubRepos();
  const { data: commits = [], isLoading: commitsLoading, refetch: refetchCommits } = useGithubCommits();
  const { data: deploys = [], isLoading: deploysLoading, refetch: refetchDeploys } = useDeployments();
  const { data: documents = [], isLoading: docsLoading, refetch: refetchDocs } = useDocuments();
  const { data: tasks = [], isLoading: tasksLoading, refetch: refetchTasks } = useTasks();
  const { data: contacts = [], isLoading: contactsLoading, refetch: refetchContacts } = useContacts();
  const { data: deals = [], refetch: refetchDeals } = useDeals();
  const { data: activities = [], refetch: refetchActivities } = useActivities();
  const { data: teamMembers = [], refetch: refetchTeam } = useTeamMembers();
  const { data: campaigns = [], refetch: refetchCampaigns } = useCampaigns();

  // Supabase counts (no hook available)
  const [convCount, setConvCount] = useState(0);
  const [msgCount, setMsgCount] = useState(0);

  const loadSupabaseCounts = useCallback(async () => {
    if (supabase) {
      const [c, m] = await Promise.all([
        supabase.from('conversations').select('*', { count: 'exact', head: true }),
        supabase.from('messages').select('*', { count: 'exact', head: true }),
      ]);
      setConvCount(c.count || 0);
      setMsgCount(m.count || 0);
    }
  }, []);

  useEffect(() => { loadSupabaseCounts(); }, [loadSupabaseCounts]);

  const loading = reposLoading || commitsLoading || deploysLoading || docsLoading || tasksLoading || contactsLoading;

  function refetchAll() {
    refetchRepos();
    refetchCommits();
    refetchDeploys();
    refetchDocs();
    refetchTasks();
    refetchContacts();
    refetchDeals();
    refetchActivities();
    refetchTeam();
    refetchCampaigns();
    loadSupabaseCounts();
  }

  // Derived counts
  const docCount = documents.length;
  const taskCount = tasks.filter(t => t.status !== 'done' && t.status !== 'completed').length;
  const contactCount = contacts.length;
  const dealCount = deals.length;
  const teamCount = teamMembers.length;
  const campaignCount = campaigns.length;
  const recentActivities = activities.slice(0, 8);
  const recentDeploys = deploys.slice(0, 8);

  function enterVenture(slug: string) { switchToVenture(slug); applyVentureTheme(slug); }

  const activeVentures = ventures.filter(v => v.status === 'active' || v.status === 'development').length;

  return (
    <PageShell scroll>
      {/* Hero Header */}
      <div className="cc-hero">
        <div className="cc-hero-content">
          <div>
            <p className="cc-greeting">{getGreeting()}, Tony</p>
            <PageHeader title="Command Center" loading={loading} onRefresh={refetchAll} />
            <p className="cc-sub">EdgeIQ Holdings &middot; {ventures.length} ventures &middot; {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <GridLayout cols={3} gap="sm">
        <StatCard icon={<Zap size={14} />} label="Ventures" value={ventures.length} color="#00F0FF" className="cc-kpi-click" />
        <StatCard icon={<GitBranch size={14} />} label="Repositories" value={repos.length} className="cc-kpi-click" />
        <StatCard icon={<Cloud size={14} />} label="Deployments" value={deploys.length} className="cc-kpi-click" />
        <StatCard icon={<BookOpen size={14} />} label="Knowledge Base" value={docCount || '...'} className="cc-kpi-click" />
        <StatCard icon={<CheckSquare size={14} />} label="Active Tasks" value={taskCount || '...'} className="cc-kpi-click" />
        <StatCard icon={<Users size={14} />} label="Contacts" value={`${contactCount}`} className="cc-kpi-click" />
        <StatCard icon={<MessageSquare size={14} />} label="Conversations" value={`${convCount}`} className="cc-kpi-click" />
        <StatCard icon={<Shield size={14} />} label="Team" value={teamCount} className="cc-kpi-click" />
        <StatCard icon={<TrendingUp size={14} />} label="Campaigns" value={campaignCount} className="cc-kpi-click" />
      </GridLayout>

      <div className="cc-main">
        {/* Left: Ventures */}
        <div className="cc-col">
          <div className="cc-section">
            <h2 className="cc-sec-title">Venture Health <span className="cc-sec-sub">{activeVentures} active</span></h2>
            <div className="cc-ventures">
              {ventures.map(v => (
                <GlassCard key={v.id} variant="neural" className="cc-vc holo-hover" onClick={() => enterVenture(v.id)}>
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
                </GlassCard>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Activity Feed */}
        <div className="cc-col">
          <div className="cc-section">
            <h2 className="cc-sec-title"><Activity size={12}/> Recent Activity</h2>
            <div className="cc-activity-feed">
              {recentActivities.map((a, i) => (
                <div key={i} className="cc-act-item">
                  <span className="cc-act-type" style={{ color: a.type === 'call' ? '#10B981' : a.type === 'email' ? '#3B82F6' : a.type === 'meeting' ? '#8B5CF6' : '#F59E0B' }}>{a.type}</span>
                  <span className="cc-act-title">{a.title}</span>
                  {a.contacts?.name && <span className="cc-act-contact">{a.contacts.name}</span>}
                  <span className="cc-act-time">{timeAgo(a.created_at)}</span>
                </div>
              ))}
              {recentActivities.length === 0 && <p className="cc-empty-hint">No recent activity. Log interactions in the CRM.</p>}
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
          <GlassCard className="cc-feed">
            <h2 className="cc-sec-title"><GitBranch size={12}/> Commits</h2>
            <div className="cc-feed-list">
              {commits.map(c => (
                <div key={c.sha} className="cc-feed-item">
                  <code className="cc-sha">{c.sha.slice(0, 7)}</code>
                  <span className="cc-feed-msg">{c.commit.message}</span>
                  <span className="cc-feed-time">{timeAgo(c.commit.author.date)}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="cc-feed">
            <h2 className="cc-sec-title"><Cloud size={12}/> Deployments <span className="cc-sec-sub">{dealCount} deals</span></h2>
            <div className="cc-feed-list">
              {recentDeploys.map(d => (
                <a key={d.uid} href={d.url} target="_blank" rel="noreferrer" className="cc-feed-item link">
                  <span className={`cc-badge ${d.state === 'READY' ? 'live' : 'other'}`}>{d.state === 'READY' ? 'LIVE' : d.state}</span>
                  <span className="cc-feed-msg">{d.name}</span>
                  <span className="cc-feed-time">{'preview'}</span>
                  <ExternalLink size={9} />
                </a>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="cc-feed">
            <h2 className="cc-sec-title"><MessageSquare size={12}/> Messages <span className="cc-sec-sub">{msgCount} msgs</span></h2>
          </GlassCard>
        </div>
      </div>

      <style>{`
        .cc-hero { padding:20px 24px 16px; position:relative; }
        .cc-hero::after { content:""; position:absolute; bottom:0; left:24px; right:24px; height:1px; background:linear-gradient(90deg, transparent, rgba(0,240,255,0.12), transparent); }
        .cc-hero-content { display:flex; justify-content:space-between; align-items:flex-start; }
        .cc-greeting { font-size:13px; color:var(--cyan); font-weight:500; margin-bottom:2px; text-shadow:0 0 10px rgba(0,240,255,0.3); }
        .cc-sub { font-size:11px; color:var(--text-muted); margin-top:2px; }
        .cc-sec-sub { font-size:9px; color:var(--text-muted); font-family:var(--font-mono); margin-left:auto; font-weight:400; text-transform:none; letter-spacing:0; }

        .cc-kpi-click { cursor:pointer; }

        .cc-main { display:grid; grid-template-columns:1fr 1fr 380px; gap:16px; padding:0 24px 24px; flex:1; min-height:0; }
        @media (max-width:1600px) { .cc-main { grid-template-columns:1fr 1fr; } }

        .cc-col { display:flex; flex-direction:column; gap:12px; }

        .cc-sec-title { font-family:var(--font-display); font-size:11px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; margin-bottom:8px; display:flex; align-items:center; gap:6px; }

        .cc-ventures { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:6px; }
        .cc-vc { position:relative; overflow:hidden; padding:12px; text-align:left; display:flex; flex-direction:column; gap:2px; }
        .cc-vc:hover { transform:translateY(-1px); box-shadow:0 4px 16px rgba(0,240,255,0.05); }
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
        .cc-feed { overflow:hidden; }
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
      `}</style>
    </PageShell>
  );
}
