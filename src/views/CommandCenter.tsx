import { GitBranch, Cloud, Zap, ExternalLink, CheckSquare, Users, BookOpen, MessageSquare, Activity, Shield, TrendingUp, Cpu, AlertTriangle, Brain, DollarSign, Bell } from 'lucide-react';
import { useNavigation } from '../stores/navigation';
import { useTheme } from '../stores/theme';
import { ventures } from '../lib/ventures';
import { useGithubCommits } from '../hooks/use-github';
import { useDeployments } from '../hooks/use-deployments';
import { useActivities } from '../hooks/use-crm';
import { useDashboardStats, useAttentionItems, useMorningBrief } from '../hooks/use-dashboard';
import { PageShell, PageHeader, StatCard, GlassCard, GridLayout, Badge, Button } from '../components/ui';
import { timeAgo, formatMoney } from '../lib/utils';
import Markdown from '../components/Markdown';

const statusColors: Record<string, string> = { active: '#10B981', development: '#00F0FF', planned: '#8B5CF6', concept: '#6B7280' };
const severityColors: Record<string, string> = { critical: '#EF4444', warning: '#F59E0B', info: '#00F0FF' };

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

  // Dashboard data via aggregation API
  const { data: dashboard, isLoading: statsLoading, refetch: refetchStats } = useDashboardStats();
  const { data: attentionItems = [], refetch: refetchAttention } = useAttentionItems();
  const { data: morningBrief, isLoading: briefLoading } = useMorningBrief();

  // Live feeds
  const { data: commits = [], refetch: refetchCommits } = useGithubCommits();
  const { data: deploys = [], refetch: refetchDeploys } = useDeployments();
  const { data: activities = [], refetch: refetchActivities } = useActivities();

  const stats = dashboard?.stats;
  const recentActivities = activities.slice(0, 6);
  const recentDeploys = deploys.slice(0, 6);

  function refetchAll() {
    refetchStats();
    refetchAttention();
    refetchCommits();
    refetchDeploys();
    refetchActivities();
  }

  function enterVenture(slug: string) { switchToVenture(slug); applyVentureTheme(slug); }

  const activeVentures = ventures.filter(v => v.status === 'active' || v.status === 'development').length;
  const criticalAttention = attentionItems.filter(i => i.severity === 'critical').length;

  return (
    <PageShell scroll>
      {/* Hero Header */}
      <div className="cc-hero">
        <div className="cc-hero-content">
          <div>
            <p className="cc-greeting">{getGreeting()}, Tony</p>
            <PageHeader title="Command Center" loading={statsLoading} onRefresh={refetchAll} />
            <p className="cc-sub">EdgeIQ Holdings &middot; {ventures.length} ventures &middot; {activeVentures} active &middot; {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
          </div>
          {criticalAttention > 0 && (
            <Badge color="#EF4444" variant="outline" size="md">
              <AlertTriangle size={11} /> {criticalAttention} critical
            </Badge>
          )}
        </div>
      </div>

      {/* Morning Brief */}
      {morningBrief && (
        <GlassCard variant="neural" className="cc-brief">
          <div className="cc-brief-header">
            <Brain size={14} />
            <span className="cc-brief-title">Morning Brief</span>
            {morningBrief.generated && <Badge color="#8B5CF6" size="sm">AI</Badge>}
          </div>
          {briefLoading ? (
            <p className="cc-brief-loading">Generating brief...</p>
          ) : (
            <div className="cc-brief-content">
              <Markdown content={morningBrief.brief} />
            </div>
          )}
        </GlassCard>
      )}

      {/* KPI Grid — Single-query aggregated stats */}
      <GridLayout cols={4} gap="sm">
        <StatCard icon={<Zap size={14} />} label="Ventures" value={ventures.length} color="#00F0FF" onClick={() => setView('portfolio')} />
        <StatCard icon={<CheckSquare size={14} />} label="Active Tasks" value={stats?.tasks.open ?? '...'} color={stats?.tasks.overdue ? '#F59E0B' : undefined} onClick={() => setView('tasks')} />
        <StatCard icon={<DollarSign size={14} />} label="Pipeline" value={stats ? formatMoney(stats.deals.pipelineValue) : '...'} onClick={() => setView('crm')} />
        <StatCard icon={<Users size={14} />} label="Contacts" value={stats?.contacts.total ?? '...'} onClick={() => setView('crm')} />
        <StatCard icon={<BookOpen size={14} />} label="Knowledge Base" value={stats?.docs.total ?? '...'} onClick={() => setView('docs')} />
        <StatCard icon={<MessageSquare size={14} />} label="Conversations" value={stats?.conversations.total ?? '...'} onClick={() => setView('chat')} />
        <StatCard icon={<Shield size={14} />} label="Won Revenue" value={stats ? formatMoney(stats.deals.wonValue) : '...'} color="#10B981" />
        <StatCard icon={<Bell size={14} />} label="Unread" value={stats?.unreadNotifications ?? 0} color={stats?.unreadNotifications ? '#EF4444' : undefined} />
      </GridLayout>

      <div className="cc-main">
        {/* Left Column: Ventures + Attention */}
        <div className="cc-col">
          {/* Attention Required */}
          {attentionItems.length > 0 && (
            <div className="cc-section">
              <h2 className="cc-sec-title"><AlertTriangle size={12} /> Attention Required <span className="cc-sec-sub">{attentionItems.length} items</span></h2>
              <div className="cc-attention">
                {attentionItems.slice(0, 5).map(item => (
                  <div key={item.id} className="cc-attn-item" onClick={() => setView(item.actionView as Parameters<typeof setView>[0])}>
                    <span className="cc-attn-dot" style={{ background: severityColors[item.severity] }} />
                    <div className="cc-attn-body">
                      <span className="cc-attn-title">{item.title}</span>
                      <span className="cc-attn-desc">{item.description}</span>
                    </div>
                    <Button variant="ghost" size="sm">{item.actionLabel}</Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ventures */}
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

        {/* Center: Activity Feed + Quick Actions */}
        <div className="cc-col">
          <div className="cc-section">
            <h2 className="cc-sec-title"><Activity size={12} /> Recent Activity</h2>
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

          <div className="cc-section">
            <h2 className="cc-sec-title"><Cpu size={12} /> Quick Actions</h2>
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

        {/* Right: Live Feeds */}
        <div className="cc-col">
          <GlassCard className="cc-feed">
            <h2 className="cc-sec-title"><GitBranch size={12} /> Commits</h2>
            <div className="cc-feed-list">
              {commits.slice(0, 8).map(c => (
                <a key={c.sha} href={c.html_url} target="_blank" rel="noreferrer" className="cc-feed-item link">
                  <code className="cc-sha">{c.sha.slice(0, 7)}</code>
                  <span className="cc-feed-msg">{c.commit.message.split('\n')[0]}</span>
                  <span className="cc-feed-time">{timeAgo(c.commit.author.date)}</span>
                </a>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="cc-feed">
            <h2 className="cc-sec-title"><Cloud size={12} /> Deployments</h2>
            <div className="cc-feed-list">
              {recentDeploys.map(d => (
                <a key={d.uid} href={`https://${d.url}`} target="_blank" rel="noreferrer" className="cc-feed-item link">
                  <Badge color={d.state === 'READY' ? '#10B981' : '#F59E0B'} size="sm">{d.state === 'READY' ? 'LIVE' : d.state}</Badge>
                  <span className="cc-feed-msg">{d.name}</span>
                  <span className="cc-feed-time">{d.target || 'preview'}</span>
                  <ExternalLink size={9} />
                </a>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="cc-feed">
            <h2 className="cc-sec-title"><TrendingUp size={12} /> Pipeline Snapshot</h2>
            <div className="cc-pipeline-snap">
              <div className="cc-pipe-row">
                <span className="cc-pipe-label">Total Pipeline</span>
                <span className="cc-pipe-value">{stats ? formatMoney(stats.deals.pipelineValue) : '...'}</span>
              </div>
              <div className="cc-pipe-row">
                <span className="cc-pipe-label">Won Revenue</span>
                <span className="cc-pipe-value" style={{ color: 'var(--success)' }}>{stats ? formatMoney(stats.deals.wonValue) : '...'}</span>
              </div>
              <div className="cc-pipe-row">
                <span className="cc-pipe-label">Active Deals</span>
                <span className="cc-pipe-value">{stats?.deals.total ?? '...'}</span>
              </div>
              <div className="cc-pipe-row">
                <span className="cc-pipe-label">Overdue Tasks</span>
                <span className="cc-pipe-value" style={{ color: stats?.tasks.overdue ? 'var(--error)' : undefined }}>{stats?.tasks.overdue ?? 0}</span>
              </div>
            </div>
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

        /* Morning Brief */
        .cc-brief { margin:0 24px; padding:14px 18px; }
        .cc-brief-header { display:flex; align-items:center; gap:8px; margin-bottom:8px; color:var(--text-muted); }
        .cc-brief-title { font-family:var(--font-display); font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; }
        .cc-brief-loading { font-size:11px; color:var(--text-muted); font-style:italic; }
        .cc-brief-content { font-size:12px; line-height:1.6; color:var(--text-secondary); }
        .cc-brief-content p { margin:4px 0; }
        .cc-brief-content ul { padding-left:16px; margin:4px 0; }
        .cc-brief-content li { margin:2px 0; }
        .cc-brief-content strong { color:var(--text-primary); }

        /* Attention Items */
        .cc-attention { display:flex; flex-direction:column; gap:4px; }
        .cc-attn-item { display:flex; align-items:center; gap:10px; padding:8px 12px; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-sm); cursor:pointer; transition:all 0.15s; }
        .cc-attn-item:hover { border-color:var(--border-active); }
        .cc-attn-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
        .cc-attn-body { flex:1; min-width:0; }
        .cc-attn-title { display:block; font-size:12px; font-weight:500; color:var(--text-primary); }
        .cc-attn-desc { display:block; font-size:10px; color:var(--text-muted); overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }

        .cc-main { display:grid; grid-template-columns:1fr 1fr 380px; gap:16px; padding:0 24px 24px; flex:1; min-height:0; }
        @media (max-width:1600px) { .cc-main { grid-template-columns:1fr 1fr; } }
        .cc-col { display:flex; flex-direction:column; gap:12px; }
        .cc-section { }
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

        .cc-activity-feed { display:flex; flex-direction:column; gap:2px; }
        .cc-act-item { display:flex; align-items:center; gap:8px; padding:6px 10px; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-sm); font-size:11px; }
        .cc-act-type { font-size:8px; font-weight:700; text-transform:uppercase; width:45px; flex-shrink:0; }
        .cc-act-title { flex:1; color:var(--text-secondary); overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
        .cc-act-contact { font-size:10px; color:var(--text-muted); flex-shrink:0; }
        .cc-act-time { font-size:9px; color:var(--text-muted); font-family:var(--font-mono); flex-shrink:0; }
        .cc-empty-hint { font-size:11px; color:var(--text-muted); text-align:center; padding:16px; }

        .cc-feed { overflow:hidden; }
        .cc-feed .cc-sec-title { padding:8px 12px; margin:0; border-bottom:1px solid var(--border); }
        .cc-feed-list { max-height:180px; overflow-y:auto; }
        .cc-feed-item { display:flex; align-items:center; gap:8px; padding:5px 12px; border-bottom:1px solid var(--border); font-size:11px; }
        .cc-feed-item:last-child { border-bottom:none; }
        .cc-feed-item.link { text-decoration:none; transition:background 0.1s; }
        .cc-feed-item.link:hover { background:var(--bg-elevated); }
        .cc-sha { font-family:var(--font-mono); font-size:10px; color:var(--cyan); background:var(--bg-surface); padding:1px 5px; border-radius:3px; flex-shrink:0; }
        .cc-feed-msg { flex:1; color:var(--text-secondary); overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
        .cc-feed-time { font-size:9px; color:var(--text-muted); font-family:var(--font-mono); flex-shrink:0; }

        .cc-pipeline-snap { padding:8px 12px; display:flex; flex-direction:column; gap:6px; }
        .cc-pipe-row { display:flex; justify-content:space-between; align-items:center; font-size:12px; }
        .cc-pipe-label { color:var(--text-muted); }
        .cc-pipe-value { font-family:var(--font-mono); font-weight:600; color:var(--text-primary); }

        .cc-actions { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
        .cc-action { padding:10px 12px; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text-secondary); font-size:11px; font-weight:500; transition:all 0.15s; position:relative; overflow:hidden; }
        .cc-action:hover { color:var(--cyan); border-color:var(--border-active); box-shadow:0 0 12px rgba(0,240,255,0.06); }
      `}</style>
    </PageShell>
  );
}
