import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Monitor, MessageSquare, FileText, Cloud, GitBranch, Clock, Database, Terminal } from 'lucide-react';
import { PageShell, PageHeader, Badge, GridLayout, StatCard } from '../components/ui';
import { staggerContainer, fadeInUp, hoverLift, tapScale } from '../lib/animations';
import { timeAgo } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { apiGet } from '../lib/api/client';

interface ConvData { id: string; venture_id: string; title: string; updated_at: string; }
interface HealthData { configured: Record<string, boolean>; }

export default function SessionsView() {
  const [convs, setConvs] = useState<ConvData[]>([]);
  const [msgCount, setMsgCount] = useState(0);
  const [docCount, setDocCount] = useState(0);
  const [taskCount, setTaskCount] = useState(0);
  const [contactCount, setContactCount] = useState(0);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [deploys, setDeploys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const results = await Promise.all([
      supabase?.from('conversations').select('id, venture_id, title, updated_at').order('updated_at', { ascending: false }).limit(20),
      supabase?.from('messages').select('*', { count: 'exact', head: true }),
      supabase?.from('documents').select('*', { count: 'exact', head: true }),
      supabase?.from('tasks').select('*', { count: 'exact', head: true }),
      supabase?.from('contacts').select('*', { count: 'exact', head: true }),
      apiGet<HealthData>('/api/health').catch(() => null),
      apiGet<{ deployments?: unknown[] }>('/api/vercel-status', { action: 'deployments' }).catch(() => null),
    ]);

    setConvs(results[0]?.data || []);
    setMsgCount(results[1]?.count || 0);
    setDocCount(results[2]?.count || 0);
    setTaskCount(results[3]?.count || 0);
    setContactCount(results[4]?.count || 0);
    if (results[5]) setHealth(results[5]);
    if (results[6]) setDeploys(results[6].deployments?.slice(0, 8) || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const connectedCount = health ? Object.values(health.configured).filter(Boolean).length : 0;
  const totalApis = health ? Object.keys(health.configured).length : 0;

  return (
    <PageShell scroll={false}>
      <PageHeader icon={<Monitor size={20} />} title="Sessions & Activity" loading={loading} onRefresh={load}>
        <Badge color="var(--success)" variant="dot">Live Data</Badge>
      </PageHeader>

      <motion.div variants={staggerContainer} initial="hidden" animate="show">
        <GridLayout cols={6} gap="sm" className="sess-kpis">
          <motion.div variants={fadeInUp}><StatCard icon={<MessageSquare size={14} />} label="Conversations" value={convs.length} /></motion.div>
          <motion.div variants={fadeInUp}><StatCard icon={<Terminal size={14} />} label="Messages" value={msgCount} /></motion.div>
          <motion.div variants={fadeInUp}><StatCard icon={<FileText size={14} />} label="Documents" value={docCount} /></motion.div>
          <motion.div variants={fadeInUp}><StatCard icon={<Database size={14} />} label="Tasks" value={taskCount} /></motion.div>
          <motion.div variants={fadeInUp}><StatCard icon={<Cloud size={14} />} label="APIs Online" value={`${connectedCount}/${totalApis}`} /></motion.div>
          <motion.div variants={fadeInUp}><StatCard icon={<GitBranch size={14} />} label="Contacts" value={contactCount} /></motion.div>
        </GridLayout>
      </motion.div>

      <motion.div className="sess-grid" variants={staggerContainer} initial="hidden" animate="show">
        <motion.div className="sess-panel" variants={fadeInUp}>
          <div className="sess-gradient-border" />
          <h2 className="sess-panel-title"><MessageSquare size={13} /> Aegis Conversations</h2>
          <div className="sess-list">
            {convs.map(c => (
              <motion.div key={c.id} className="sess-item sess-item-hover" {...hoverLift} {...tapScale}>
                <span className="sess-item-venture">{c.venture_id}</span>
                <span className="sess-item-title">{c.title}</span>
                <span className="sess-item-time"><Clock size={10} /> {timeAgo(c.updated_at)}</span>
              </motion.div>
            ))}
            {convs.length === 0 && !loading && <div className="sess-empty">No conversations yet</div>}
          </div>
        </motion.div>

        <motion.div className="sess-panel" variants={fadeInUp}>
          <div className="sess-gradient-border" />
          <h2 className="sess-panel-title"><Database size={13} /> API Connections</h2>
          <div className="sess-list">
            {health && Object.entries(health.configured).map(([key, ok]) => (
              <motion.div key={key} className="sess-item sess-item-hover" {...hoverLift} {...tapScale}>
                <span className={`sess-dot ${ok ? 'ok' : 'off'}`} />
                <span className="sess-item-title">{key.replace(/_/g, ' ').replace(/API KEY|KEY|TOKEN/gi, '').trim()}</span>
                <span className={`sess-status ${ok ? 'on' : 'off'}`}>{ok ? 'Connected' : 'Not Set'}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div className="sess-panel" variants={fadeInUp}>
          <div className="sess-gradient-border" />
          <h2 className="sess-panel-title"><Cloud size={13} /> Deployments</h2>
          <div className="sess-list">
            {deploys.map((d: any, i: number) => (
              <motion.div key={i} className="sess-item sess-item-hover" {...hoverLift} {...tapScale}>
                <span className={`sess-badge-sm ${d.state === 'READY' ? 'live' : 'other'}`}>{d.state === 'READY' ? 'LIVE' : d.state}</span>
                <span className="sess-item-title">{d.name}</span>
                <span className="sess-item-time">{d.target || 'preview'}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      <style>{`
        .sess-kpis { padding:0 20px 12px; }

        .sess-grid { flex:1; display:grid; grid-template-columns:1fr 1fr 1fr; gap:1px; background:var(--border); overflow:hidden; }
        .sess-panel { background:var(--bg-deep); display:flex; flex-direction:column; position:relative; border-radius:var(--radius-lg); }
        .sess-gradient-border { position:absolute; top:0; left:20%; right:20%; height:1px; background:linear-gradient(to right, transparent, var(--cyan), transparent); z-index:1; pointer-events:none; }
        .sess-panel-title { font-size:11px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; padding:10px 14px; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:6px; flex-shrink:0; }
        .sess-list { flex:1; overflow-y:auto; }
        .sess-item { display:flex; align-items:center; gap:8px; padding:7px 14px; border-bottom:1px solid var(--border); font-size:11px; cursor:default; }
        .sess-item-hover { transition:all 0.2s ease; border-radius:var(--radius-sm); }
        .sess-item-hover:hover { background:var(--bg-card); }
        .sess-item-venture { font-size:9px; font-weight:600; color:var(--text-muted); text-transform:uppercase; background:var(--bg-card); padding:1px 5px; border-radius:3px; flex-shrink:0; width:70px; text-align:center; }
        .sess-item-title { flex:1; color:var(--text-secondary); overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
        .sess-item-time { font-size:10px; color:var(--text-muted); font-family:var(--font-mono); display:flex; align-items:center; gap:3px; flex-shrink:0; }
        .sess-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
        .sess-dot.ok { background:var(--success); box-shadow:0 0 4px rgba(16,185,129,0.4); }
        .sess-dot.off { background:var(--text-muted); opacity:0.4; }
        .sess-status { font-size:10px; font-family:var(--font-mono); flex-shrink:0; }
        .sess-status.on { color:var(--success); }
        .sess-status.off { color:var(--text-muted); }
        .sess-badge-sm { font-size:8px; font-weight:700; padding:1px 5px; border-radius:3px; text-transform:uppercase; flex-shrink:0; }
        .sess-badge-sm.live { background:rgba(16,185,129,0.15); color:var(--success); }
        .sess-badge-sm.other { background:rgba(245,158,11,0.15); color:var(--warning); }
        .sess-empty { padding:20px; text-align:center; font-size:11px; color:var(--text-muted); }
      `}</style>
    </PageShell>
  );
}
