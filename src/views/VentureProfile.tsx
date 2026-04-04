import { useState, useEffect } from 'react';
import {
  Globe, ExternalLink, Users, Code, Calendar, DollarSign, BarChart3,
  FileText, CheckSquare, MessageSquare, Shield, Layers,
  Target, Zap, RefreshCw,
} from 'lucide-react';
import { type Venture } from '../lib/ventures';
import { useNavigation } from '../stores/navigation';
import { supabase } from '../lib/supabase';

const statusColors: Record<string, string> = { active: '#10B981', development: '#00F0FF', planned: '#8B5CF6', concept: '#6B7280' };

interface VentureStats { docs: number; tasks: number; chats: number; contacts: number; deals: number; activities: number; }

async function loadVentureStats(ventureId: string): Promise<VentureStats> {
  const [docs, tasks, contacts, deals, activities, chats] = await Promise.all([
    fetch('/api/docs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'list', venture_id: ventureId }) }).then(r => r.ok ? r.json() : null).catch(() => null),
    fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'list', venture_id: ventureId }) }).then(r => r.ok ? r.json() : null).catch(() => null),
    fetch('/api/crm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'list-contacts', venture_id: ventureId }) }).then(r => r.ok ? r.json() : null).catch(() => null),
    fetch('/api/crm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'list-deals', venture_id: ventureId }) }).then(r => r.ok ? r.json() : null).catch(() => null),
    fetch('/api/crm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'list-activities', venture_id: ventureId }) }).then(r => r.ok ? r.json() : null).catch(() => null),
    supabase ? supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('venture_id', ventureId) : null,
  ]);
  return {
    docs: docs?.documents?.length || 0,
    tasks: (tasks?.tasks || []).filter((t: { status?: string }) => t.status !== 'done' && t.status !== 'completed').length,
    chats: chats?.count || 0,
    contacts: contacts?.contacts?.length || 0,
    deals: deals?.deals?.length || 0,
    activities: activities?.activities?.length || 0,
  };
}

export default function VentureProfile({ venture }: { venture: Venture }) {
  const [stats, setStats] = useState<VentureStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { setView } = useNavigation();

  useEffect(() => {
    setLoading(true);
    loadVentureStats(venture.id).then(s => { setStats(s); setLoading(false); });
  }, [venture.id]);

  const socialIcons: { key: string; label: string }[] = [
    { key: 'website', label: 'Website' }, { key: 'github', label: 'GitHub' },
    { key: 'twitter', label: 'X / Twitter' }, { key: 'discord', label: 'Discord' },
    { key: 'telegram', label: 'Telegram' }, { key: 'linkedin', label: 'LinkedIn' },
    { key: 'youtube', label: 'YouTube' },
  ];

  return (
    <div className="vp">
      {/* Hero Header */}
      <div className="vp-hero" style={{ borderBottomColor: `${venture.color}30` }}>
        <div className="vp-hero-accent" style={{ background: `linear-gradient(135deg, ${venture.color}15, transparent 60%)` }} />
        <div className="vp-hero-content">
          <div className="vp-hero-left">
            <span className="vp-hero-icon" style={{ background: venture.color }}>{venture.icon}</span>
            <div>
              <h1 className="vp-hero-name">{venture.name}</h1>
              <p className="vp-hero-tagline">{venture.tagline}</p>
              <div className="vp-hero-meta">
                <span className="vp-status" style={{ color: statusColors[venture.status], borderColor: `${statusColors[venture.status]}40` }}>
                  <span className="vp-dot" style={{ background: statusColors[venture.status] }} /> {venture.status.toUpperCase()}
                </span>
                <span className="vp-meta-item"><Layers size={10} /> {venture.type.replace(/_/g, ' ')}</span>
                <span className="vp-meta-item"><Calendar size={10} /> Founded {venture.founded}</span>
                <span className="vp-meta-item"><DollarSign size={10} /> {venture.fundingStage}</span>
                <a href={`https://${venture.domain}`} target="_blank" rel="noreferrer" className="vp-domain"><Globe size={10} /> {venture.domain} <ExternalLink size={8} /></a>
              </div>
            </div>
          </div>
          <button className="vp-refresh" onClick={() => { setLoading(true); loadVentureStats(venture.id).then(s => { setStats(s); setLoading(false); }); }}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      <div className="vp-body">
        {/* Stats Strip */}
        <div className="vp-stats">
          <div className="vp-stat" onClick={() => setView('venture-docs')} style={{ cursor: 'pointer' }}><FileText size={13} /><div><span className="vp-stat-v">{stats?.docs ?? '...'}</span><span className="vp-stat-l">Documents</span></div></div>
          <div className="vp-stat" onClick={() => setView('venture-tasks')} style={{ cursor: 'pointer' }}><CheckSquare size={13} /><div><span className="vp-stat-v">{stats?.tasks ?? '...'}</span><span className="vp-stat-l">Active Tasks</span></div></div>
          <div className="vp-stat"><MessageSquare size={13} /><div><span className="vp-stat-v">{stats?.chats ?? '...'}</span><span className="vp-stat-l">Conversations</span></div></div>
          <div className="vp-stat"><Users size={13} /><div><span className="vp-stat-v">{stats?.contacts ?? '...'}</span><span className="vp-stat-l">Contacts</span></div></div>
          <div className="vp-stat"><BarChart3 size={13} /><div><span className="vp-stat-v">{stats?.deals ?? '...'}</span><span className="vp-stat-l">Deals</span></div></div>
          <div className="vp-stat"><Zap size={13} /><div><span className="vp-stat-v">{stats?.activities ?? '...'}</span><span className="vp-stat-l">Activities</span></div></div>
        </div>

        <div className="vp-grid">
          {/* Left Column */}
          <div className="vp-col">
            {/* About */}
            <div className="vp-card">
              <h3 className="vp-card-title">About</h3>
              <p className="vp-card-text">{venture.description}</p>
            </div>

            {/* Key Metrics */}
            <div className="vp-card">
              <h3 className="vp-card-title"><BarChart3 size={13} /> Key Metrics</h3>
              <div className="vp-metrics-grid">
                {Object.entries(venture.keyMetrics).map(([k, v]) => (
                  <div key={k} className="vp-metric-item">
                    <span className="vp-metric-val">{v}</span>
                    <span className="vp-metric-label">{k}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Competitors */}
            {venture.competitors.length > 0 && (
              <div className="vp-card">
                <h3 className="vp-card-title"><Target size={13} /> Competitive Landscape</h3>
                <div className="vp-competitors">
                  {venture.competitors.map(c => (
                    <span key={c} className="vp-competitor">{c}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="vp-col">
            {/* Team */}
            <div className="vp-card">
              <h3 className="vp-card-title"><Users size={13} /> Team</h3>
              <div className="vp-team">
                {venture.team.map((m, i) => (
                  <div key={i} className="vp-team-member">
                    <span className="vp-team-avatar" style={{ background: venture.color }}>{m.name.charAt(0)}</span>
                    <div>
                      <span className="vp-team-name">{m.name}</span>
                      <span className="vp-team-role">{m.role}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tech Stack */}
            <div className="vp-card">
              <h3 className="vp-card-title"><Code size={13} /> Tech Stack</h3>
              <div className="vp-tags">
                {venture.techStack.map(t => (
                  <span key={t} className="vp-tag">{t}</span>
                ))}
              </div>
            </div>

            {/* Social Links */}
            <div className="vp-card">
              <h3 className="vp-card-title"><Globe size={13} /> Links & Socials</h3>
              <div className="vp-socials">
                {socialIcons.map(({ key, label }) => {
                  const url = venture.socials[key as keyof typeof venture.socials];
                  if (!url) return null;
                  return (
                    <a key={key} href={url} target="_blank" rel="noreferrer" className="vp-social-link">
                      <span className="vp-social-label">{label}</span>
                      <span className="vp-social-url">{url.replace(/^https?:\/\//, '')}</span>
                      <ExternalLink size={9} />
                    </a>
                  );
                })}
                {Object.values(venture.socials).filter(Boolean).length === 0 && (
                  <p className="vp-empty">No social links configured yet.</p>
                )}
              </div>
            </div>

            {/* Category & Classification */}
            <div className="vp-card">
              <h3 className="vp-card-title"><Shield size={13} /> Classification</h3>
              <div className="vp-class-grid">
                <div className="vp-class-item"><span className="vp-class-k">Category</span><span className="vp-class-v">{venture.category}</span></div>
                <div className="vp-class-item"><span className="vp-class-k">Type</span><span className="vp-class-v">{venture.type.replace(/_/g, ' ')}</span></div>
                <div className="vp-class-item"><span className="vp-class-k">Funding</span><span className="vp-class-v">{venture.fundingStage}</span></div>
                <div className="vp-class-item"><span className="vp-class-k">Founded</span><span className="vp-class-v">{venture.founded}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .vp { height:100%; overflow-y:auto; display:flex; flex-direction:column; }
        .vp-hero { position:relative; padding:20px 24px; border-bottom:1px solid var(--border); flex-shrink:0; overflow:hidden; }
        .vp-hero-accent { position:absolute; inset:0; pointer-events:none; }
        .vp-hero-content { position:relative; display:flex; justify-content:space-between; align-items:flex-start; }
        .vp-hero-left { display:flex; gap:16px; align-items:flex-start; }
        .vp-hero-icon { width:56px; height:56px; border-radius:var(--radius-md); display:flex; align-items:center; justify-content:center; font-size:22px; font-weight:800; color:var(--bg-deep); flex-shrink:0; }
        .vp-hero-name { font-family:var(--font-display); font-size:1.5rem; font-weight:700; letter-spacing:-0.5px; }
        .vp-hero-tagline { font-size:13px; color:var(--text-muted); margin-top:2px; }
        .vp-hero-meta { display:flex; flex-wrap:wrap; gap:10px; margin-top:8px; align-items:center; }
        .vp-status { font-size:9px; font-weight:700; padding:2px 10px; border:1px solid; border-radius:var(--radius-full); display:flex; align-items:center; gap:5px; }
        .vp-dot { width:5px; height:5px; border-radius:50%; }
        .vp-meta-item { font-size:11px; color:var(--text-muted); display:flex; align-items:center; gap:4px; }
        .vp-domain { font-size:11px; color:var(--cyan); display:flex; align-items:center; gap:4px; text-decoration:none; font-family:var(--font-mono); }
        .vp-domain:hover { text-decoration:underline; }
        .vp-refresh { width:30px; height:30px; display:flex; align-items:center; justify-content:center; border-radius:var(--radius-sm); color:var(--text-muted); }
        .vp-refresh:hover { background:var(--bg-card); color:var(--cyan); }

        .vp-body { flex:1; padding:16px 24px; display:flex; flex-direction:column; gap:16px; }

        .vp-stats { display:grid; grid-template-columns:repeat(6,1fr); gap:6px; }
        .vp-stat { display:flex; align-items:center; gap:8px; padding:10px 12px; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-md); color:var(--text-muted); transition:all 0.15s; }
        .vp-stat:hover { border-color:var(--border-active); }
        .vp-stat>div { display:flex; flex-direction:column; }
        .vp-stat-v { font-family:var(--font-mono); font-size:1rem; font-weight:700; color:var(--text-primary); }
        .vp-stat-l { font-size:9px; text-transform:uppercase; letter-spacing:0.5px; }

        .vp-grid { display:grid; grid-template-columns:1fr 380px; gap:16px; }

        .vp-card { background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-md); padding:16px; display:flex; flex-direction:column; gap:10px; }
        .vp-card-title { font-size:11px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; display:flex; align-items:center; gap:6px; }
        .vp-card-text { font-size:13px; color:var(--text-secondary); line-height:1.6; }
        .vp-col { display:flex; flex-direction:column; gap:12px; }

        .vp-metrics-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(120px,1fr)); gap:8px; }
        .vp-metric-item { background:var(--bg-elevated); border:1px solid var(--border); border-radius:var(--radius-sm); padding:10px 12px; display:flex; flex-direction:column; gap:2px; }
        .vp-metric-val { font-family:var(--font-mono); font-size:1.1rem; font-weight:700; color:var(--text-primary); }
        .vp-metric-label { font-size:9px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.3px; }

        .vp-competitors { display:flex; flex-wrap:wrap; gap:6px; }
        .vp-competitor { font-size:11px; padding:4px 12px; background:var(--bg-elevated); border:1px solid var(--border); border-radius:var(--radius-full); color:var(--text-secondary); }

        .vp-team { display:flex; flex-direction:column; gap:8px; }
        .vp-team-member { display:flex; align-items:center; gap:10px; padding:6px 0; }
        .vp-team-avatar { width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; color:var(--bg-deep); flex-shrink:0; }
        .vp-team-name { display:block; font-size:13px; font-weight:500; }
        .vp-team-role { display:block; font-size:11px; color:var(--text-muted); }

        .vp-tags { display:flex; flex-wrap:wrap; gap:5px; }
        .vp-tag { font-size:10px; padding:3px 10px; background:var(--bg-elevated); border:1px solid var(--border); border-radius:var(--radius-full); color:var(--text-secondary); font-family:var(--font-mono); }

        .vp-socials { display:flex; flex-direction:column; gap:4px; }
        .vp-social-link { display:flex; align-items:center; gap:8px; padding:6px 8px; border-radius:var(--radius-sm); text-decoration:none; transition:background 0.1s; }
        .vp-social-link:hover { background:var(--bg-elevated); }
        .vp-social-label { font-size:11px; font-weight:500; color:var(--text-primary); width:70px; flex-shrink:0; }
        .vp-social-url { font-size:10px; color:var(--text-muted); font-family:var(--font-mono); flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

        .vp-class-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
        .vp-class-item { padding:8px 10px; background:var(--bg-elevated); border-radius:var(--radius-sm); }
        .vp-class-k { display:block; font-size:9px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.3px; }
        .vp-class-v { display:block; font-size:12px; font-weight:500; margin-top:2px; }

        .vp-empty { font-size:11px; color:var(--text-muted); }

        @keyframes spin { to{transform:rotate(360deg)} }
        .spin { animation:spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
