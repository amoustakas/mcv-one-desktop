import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PieChart, ExternalLink, GitBranch, Cloud, FileText, CheckSquare, MessageSquare } from 'lucide-react';
import { PageShell, PageHeader, StatCard, GridLayout } from '../components/ui';
import { useNavigation } from '../stores/navigation';
import { useTheme } from '../stores/theme';
import { useVentureContextStore } from '../stores/venture-context';
import type { VentureHealth } from '../stores/venture-context';
import { ventures } from '../lib/ventures';
import { supabase } from '../lib/supabase';
import { useGithubOverview } from '../hooks/use-github';
import { useDeployments } from '../hooks/use-deployments';
import { useDocuments } from '../hooks/use-docs';
import { useTasks } from '../hooks/use-tasks';

const statusOrder: Record<string, number> = { active: 0, development: 1, planned: 2, concept: 3 };
const statusLabels: Record<string, string> = { active: 'ACTIVE', development: 'DEV', planned: 'PLANNED', concept: 'CONCEPT' };
const statusColors: Record<string, string> = { active: '#10B981', development: '#00F0FF', planned: '#8B5CF6', concept: '#6B7280' };

const sorted = [...ventures].sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

interface VentureKPIs {
  repos: number; deploys: number; docs: number; tasks: number; chats: number;
}

export default function PortfolioView() {
  const { switchToVenture } = useNavigation();
  const { applyVentureTheme } = useTheme();
  const queryClient = useQueryClient();

  const { data: githubOverview } = useGithubOverview();
  const { data: deployments } = useDeployments();
  const { data: allDocs = [] } = useDocuments();
  const { data: allTasksRaw = [] } = useTasks();
  const { data: allConvos = [], isLoading: loading } = useQuery({
    queryKey: ['conversations', 'all'],
    queryFn: async () => {
      if (!supabase) return [];
      const { data } = await supabase.from('conversations').select('venture_id');
      return data || [];
    },
  });

  const allTasks = allTasksRaw.filter((t: { status?: string }) => t.status !== 'done' && t.status !== 'completed');

  const repoCount = githubOverview?.repos || 0;
  const deployCount = deployments?.length || 0;

  const kpis: Record<string, VentureKPIs> = {};
  for (const v of ventures) {
    kpis[v.id] = {
      repos: 0,
      deploys: 0,
      docs: allDocs.filter((d: { venture_id?: string }) => d.venture_id === v.id).length,
      tasks: allTasks.filter((t: { venture_id?: string }) => t.venture_id === v.id).length,
      chats: allConvos.filter((c: { venture_id?: string }) => c.venture_id === v.id).length,
    };
  }

  const totals = { repos: repoCount, deploys: deployCount, docs: allDocs.length, tasks: allTasks.length, chats: allConvos.length };

  const updateHealth = useVentureContextStore((s) => s.updateHealth);

  useEffect(() => {
    for (const v of ventures) {
      const vk = kpis[v.id];
      if (!vk) continue;
      const docsScore = Math.min(100, vk.docs * 10);
      const tasksScore = Math.max(0, 100 - vk.tasks * 5);
      const overall = Math.round((docsScore + tasksScore) / 2);
      const health: VentureHealth = {
        ventureId: v.id,
        overall,
        github: vk.repos > 0 ? 80 : 40,
        deploys: vk.deploys > 0 ? 90 : 30,
        tasks: tasksScore,
        crm: vk.chats > 0 ? 70 : 20,
        lastUpdated: new Date().toISOString(),
      };
      updateHealth(v.id, health);
    }
  }, [kpis, updateHealth]);

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['github', 'overview'] });
    queryClient.invalidateQueries({ queryKey: ['vercel', 'deployments'] });
    queryClient.invalidateQueries({ queryKey: ['docs'] });
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['conversations', 'all'] });
  }

  function enter(slug: string) {
    switchToVenture(slug);
    applyVentureTheme(slug);
  }

  const activeCount = ventures.filter(v => v.status === 'active' || v.status === 'development').length;

  return (
    <PageShell>
      <PageHeader icon={<PieChart size={20} />} title="Venture Portfolio" loading={loading} onRefresh={refresh}>
        <span className="port-subtitle">EdgeIQ Holdings — {ventures.length} ventures across gaming, fintech, Web3, infrastructure, and R&D</span>
      </PageHeader>

      {/* Portfolio KPIs */}
      <GridLayout cols={4} gap="sm" className="port-kpis">
        <StatCard label="Ventures" value={ventures.length} />
        <StatCard label="Active" value={activeCount} />
        <StatCard icon={<GitBranch size={12} />} label="Repos" value={totals.repos} />
        <StatCard icon={<Cloud size={12} />} label="Deploys" value={totals.deploys} />
        <StatCard icon={<FileText size={12} />} label="Docs" value={totals.docs} />
        <StatCard icon={<CheckSquare size={12} />} label="Active Tasks" value={totals.tasks} />
        <StatCard icon={<MessageSquare size={12} />} label="Conversations" value={totals.chats} />
      </GridLayout>

      <div className="port-grid">
        {sorted.map((v) => {
          const vk = kpis[v.id];
          return (
            <button key={v.id} className="port-card" onClick={() => enter(v.id)}>
              <div className="port-card-accent" style={{ background: `linear-gradient(90deg, transparent, ${v.color}50, transparent)` }} />
              <div className="port-card-header">
                <span className="port-card-icon" style={{ background: v.color }}>{v.icon}</span>
                <div className="port-card-titles">
                  <span className="port-card-name">{v.name}</span>
                  <span className="port-card-tagline">{v.tagline}</span>
                </div>
                <span className="port-card-status" style={{ color: statusColors[v.status] }}>
                  <span className="port-status-dot" style={{ background: statusColors[v.status] }} />
                  {statusLabels[v.status]}
                </span>
              </div>
              <div className="port-card-meta">
                <span className="port-card-type">{v.type.replace(/_/g, ' ')}</span>
                <span className="port-card-domain">
                  {v.domain}
                  <ExternalLink size={9} />
                </span>
              </div>
              {vk && (
                <div className="port-card-kpis">
                  <span className="port-card-stat"><FileText size={10} /> {vk.docs} docs</span>
                  <span className="port-card-stat"><CheckSquare size={10} /> {vk.tasks} tasks</span>
                  <span className="port-card-stat"><MessageSquare size={10} /> {vk.chats} chats</span>
                </div>
              )}
              <div className="port-card-bottom">
                <span className="port-card-enter">Enter Venture &rarr;</span>
              </div>
            </button>
          );
        })}
      </div>

      <style>{`
        .port-subtitle { font-size:12px; color:var(--text-muted); }
        .port-kpis { padding:0 24px 16px; }

        .port-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:10px; padding:0 24px; }

        .port-card {
          position:relative; overflow:hidden;
          padding:16px; background:var(--bg-card); border:1px solid var(--border);
          border-radius:var(--radius-md); text-align:left;
          display:flex; flex-direction:column; gap:10px;
          transition:all 0.2s ease; cursor:pointer;
        }
        .port-card:hover { border-color:var(--border-active); transform:translateY(-2px); box-shadow:0 6px 24px rgba(0,240,255,0.05); }

        .port-card-accent { position:absolute; top:0; left:0; right:0; height:2px; }

        .port-card-header { display:flex; align-items:center; gap:10px; }
        .port-card-icon { width:36px; height:36px; border-radius:var(--radius-sm); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:13px; color:var(--bg-deep); flex-shrink:0; }
        .port-card-titles { flex:1; min-width:0; }
        .port-card-name { display:block; font-size:14px; font-weight:600; }
        .port-card-tagline { display:block; font-size:10px; color:var(--text-muted); }
        .port-card-status { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; flex-shrink:0; display:flex; align-items:center; gap:4px; }
        .port-status-dot { width:5px; height:5px; border-radius:50%; }

        .port-card-meta { display:flex; justify-content:space-between; align-items:center; }
        .port-card-type { font-size:10px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.3px; }
        .port-card-domain { font-size:10px; color:var(--text-secondary); font-family:var(--font-mono); display:flex; align-items:center; gap:3px; }

        .port-card-kpis { display:flex; gap:12px; padding:6px 0; border-top:1px solid var(--border); }
        .port-card-stat { font-size:10px; color:var(--text-muted); display:flex; align-items:center; gap:4px; font-family:var(--font-mono); }

        .port-card-bottom { border-top:1px solid var(--border); padding-top:8px; }
        .port-card-enter { font-size:11px; font-weight:500; color:var(--cyan); opacity:0; transition:opacity 0.15s; }
        .port-card:hover .port-card-enter { opacity:1; }
      `}</style>
    </PageShell>
  );
}
