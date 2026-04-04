import { useState, useEffect } from 'react';
import { Monitor, RefreshCw, MessageSquare, FileText, Cloud, GitBranch, Clock, Database, Terminal } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ConvData { id: string; venture_id: string; title: string; updated_at: string; }
interface HealthData { configured: Record<string, boolean>; }

function timeAgo(d: string) { const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000); if (mins < 1) return 'now'; if (mins < 60) return `${mins}m`; const h = Math.floor(mins / 60); if (h < 24) return `${h}h`; return `${Math.floor(h / 24)}d`; }

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
      fetch('/api/health').then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/vercel-status?action=deployments').then(r => r.ok ? r.json() : null).catch(() => null),
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
    <div className="sess">
      <div className="sess-header">
        <Monitor size={20} />
        <h1 className="sess-title">Sessions & Activity</h1>
        <span className="sess-badge">Live Data</span>
        <button className="sess-refresh" onClick={load}><RefreshCw size={14} className={loading ? 'spin' : ''} /></button>
      </div>

      <div className="sess-kpis">
        <div className="sess-kpi"><MessageSquare size={14} /><div><span className="sess-kpi-v">{convs.length}</span><span className="sess-kpi-l">Conversations</span></div></div>
        <div className="sess-kpi"><Terminal size={14} /><div><span className="sess-kpi-v">{msgCount}</span><span className="sess-kpi-l">Messages</span></div></div>
        <div className="sess-kpi"><FileText size={14} /><div><span className="sess-kpi-v">{docCount}</span><span className="sess-kpi-l">Documents</span></div></div>
        <div className="sess-kpi"><Database size={14} /><div><span className="sess-kpi-v">{taskCount}</span><span className="sess-kpi-l">Tasks</span></div></div>
        <div className="sess-kpi"><Cloud size={14} /><div><span className="sess-kpi-v">{connectedCount}/{totalApis}</span><span className="sess-kpi-l">APIs Online</span></div></div>
        <div className="sess-kpi"><GitBranch size={14} /><div><span className="sess-kpi-v">{contactCount}</span><span className="sess-kpi-l">Contacts</span></div></div>
      </div>

      <div className="sess-grid">
        <div className="sess-panel">
          <h2 className="sess-panel-title"><MessageSquare size={13} /> Aegis Conversations</h2>
          <div className="sess-list">
            {convs.map(c => (
              <div key={c.id} className="sess-item">
                <span className="sess-item-venture">{c.venture_id}</span>
                <span className="sess-item-title">{c.title}</span>
                <span className="sess-item-time"><Clock size={10} /> {timeAgo(c.updated_at)}</span>
              </div>
            ))}
            {convs.length === 0 && !loading && <div className="sess-empty">No conversations yet</div>}
          </div>
        </div>

        <div className="sess-panel">
          <h2 className="sess-panel-title"><Database size={13} /> API Connections</h2>
          <div className="sess-list">
            {health && Object.entries(health.configured).map(([key, ok]) => (
              <div key={key} className="sess-item">
                <span className={`sess-dot ${ok ? 'ok' : 'off'}`} />
                <span className="sess-item-title">{key.replace(/_/g, ' ').replace(/API KEY|KEY|TOKEN/gi, '').trim()}</span>
                <span className={`sess-status ${ok ? 'on' : 'off'}`}>{ok ? 'Connected' : 'Not Set'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="sess-panel">
          <h2 className="sess-panel-title"><Cloud size={13} /> Deployments</h2>
          <div className="sess-list">
            {deploys.map((d: any, i: number) => (
              <div key={i} className="sess-item">
                <span className={`sess-badge-sm ${d.state === 'READY' ? 'live' : 'other'}`}>{d.state === 'READY' ? 'LIVE' : d.state}</span>
                <span className="sess-item-title">{d.name}</span>
                <span className="sess-item-time">{d.target || 'preview'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .sess { height:100%; display:flex; flex-direction:column; overflow:hidden; }
        .sess-header { display:flex; align-items:center; gap:8px; padding:16px 20px 12px; flex-shrink:0; }
        .sess-title { font-family:var(--font-display); font-size:1.25rem; font-weight:700; flex:1; }
        .sess-badge { font-size:9px; font-weight:600; color:var(--success); background:rgba(16,185,129,0.1); padding:2px 8px; border-radius:var(--radius-full); }
        .sess-refresh { width:30px; height:30px; display:flex; align-items:center; justify-content:center; border-radius:var(--radius-sm); color:var(--text-muted); }

        .sess-kpis { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:6px; padding:0 20px 12px; }
        .sess-kpi { display:flex; align-items:center; gap:10px; padding:10px 12px; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-md); color:var(--text-muted); }
        .sess-kpi>div { display:flex; flex-direction:column; }
        .sess-kpi-v { font-family:var(--font-mono); font-size:1rem; font-weight:700; color:var(--text-primary); }
        .sess-kpi-l { font-size:9px; text-transform:uppercase; letter-spacing:0.5px; }

        .sess-grid { flex:1; display:grid; grid-template-columns:1fr 1fr 1fr; gap:1px; background:var(--border); overflow:hidden; }
        .sess-panel { background:var(--bg-deep); display:flex; flex-direction:column; }
        .sess-panel-title { font-size:11px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; padding:10px 14px; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:6px; flex-shrink:0; }
        .sess-list { flex:1; overflow-y:auto; }
        .sess-item { display:flex; align-items:center; gap:8px; padding:7px 14px; border-bottom:1px solid var(--border); font-size:11px; }
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
        @keyframes spin { to{transform:rotate(360deg)} }
        .spin { animation:spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
