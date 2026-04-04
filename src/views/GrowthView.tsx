import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Target, Megaphone, BarChart3, Plus, RefreshCw, Trash2, Calendar, DollarSign, Edit3, X, Users, Zap } from 'lucide-react';
import { useNavigation } from '../stores/navigation';
import { ventures } from '../lib/ventures';

interface Campaign {
  id: string; name: string; status: string; type: string; venture_id: string;
  channel: string; budget: number; reach: number; conversions: number;
  start_date: string; end_date: string; description: string;
  created_at: string; updated_at: string;
}

const STATUS_COLORS: Record<string, string> = { active: '#10B981', draft: '#00F0FF', planned: '#8B5CF6', completed: '#3B82F6', paused: '#F59E0B' };
const CHANNEL_COLORS: Record<string, string> = { social: '#3B82F6', email: '#10B981', seo: '#8B5CF6', paid: '#F59E0B', content: '#00F0FF', pr: '#EC4899', events: '#EF4444', referral: '#6366F1' };

function formatMoney(n: number) { if (n >= 1e6) return `$${(n/1e6).toFixed(1)}M`; if (n >= 1e3) return `$${(n/1e3).toFixed(0)}K`; return `$${n}`; }
function formatNum(n: number) { if (n >= 1e6) return `${(n/1e6).toFixed(1)}M`; if (n >= 1e3) return `${(n/1e3).toFixed(1)}K`; return `${n}`; }

async function api(body: Record<string, unknown>) {
  const r = await fetch('/api/campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return r.json();
}

export default function GrowthView() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', type: 'marketing', channel: 'social', status: 'draft', venture_id: '', budget: 0, description: '', start_date: '', end_date: '' });
  const { mode, activeVenture } = useNavigation();

  const load = useCallback(async () => {
    setLoading(true);
    const v = mode === 'venture' ? activeVenture : undefined;
    const res = await api({ action: 'list', venture_id: v || undefined });
    setCampaigns(res.campaigns || []);
    setLoading(false);
  }, [mode, activeVenture]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate() {
    if (!form.name.trim()) return;
    await api({ action: 'create', campaign: { ...form, venture_id: form.venture_id || (mode === 'venture' ? activeVenture : null) } });
    setForm({ name: '', type: 'marketing', channel: 'social', status: 'draft', venture_id: '', budget: 0, description: '', start_date: '', end_date: '' });
    setShowAdd(false); load();
  }

  async function handleUpdate(id: string, updates: Partial<Campaign>) {
    await api({ action: 'update', campaign: { id, ...updates } });
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    setEditId(null);
  }

  async function handleDelete(id: string) {
    await api({ action: 'delete', id });
    setCampaigns(prev => prev.filter(c => c.id !== id));
  }

  // KPIs
  const totalBudget = campaigns.reduce((s, c) => s + (c.budget || 0), 0);
  const totalReach = campaigns.reduce((s, c) => s + (c.reach || 0), 0);
  const totalConversions = campaigns.reduce((s, c) => s + (c.conversions || 0), 0);
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;

  // Group by status
  const byStatus: Record<string, Campaign[]> = {};
  campaigns.forEach(c => {
    if (!byStatus[c.status]) byStatus[c.status] = [];
    byStatus[c.status].push(c);
  });

  // Channel breakdown
  const channelMap: Record<string, { count: number; budget: number; reach: number }> = {};
  campaigns.forEach(c => {
    const ch = c.channel || 'other';
    if (!channelMap[ch]) channelMap[ch] = { count: 0, budget: 0, reach: 0 };
    channelMap[ch].count++;
    channelMap[ch].budget += c.budget || 0;
    channelMap[ch].reach += c.reach || 0;
  });
  const maxReach = Math.max(...Object.values(channelMap).map(v => v.reach), 1);

  return (
    <div className="growth">
      <div className="growth-header">
        <div>
          <h1 className="growth-title"><TrendingUp size={20} /> Growth Studio</h1>
          <p className="growth-sub">Campaign management, channel analytics, and growth tracking</p>
        </div>
        <div className="growth-header-right">
          <button className="growth-add-btn" onClick={() => setShowAdd(!showAdd)}><Plus size={13} /> Campaign</button>
          <button className="growth-refresh" onClick={load}><RefreshCw size={14} className={loading ? 'spin' : ''} /></button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="growth-metrics">
        <div className="growth-metric"><Megaphone size={14} /><div><span className="growth-metric-val">{campaigns.length}</span><span className="growth-metric-label">Campaigns</span></div></div>
        <div className="growth-metric"><Zap size={14} /><div><span className="growth-metric-val">{activeCampaigns}</span><span className="growth-metric-label">Active</span></div></div>
        <div className="growth-metric"><DollarSign size={14} /><div><span className="growth-metric-val">{formatMoney(totalBudget)}</span><span className="growth-metric-label">Total Budget</span></div></div>
        <div className="growth-metric"><Users size={14} /><div><span className="growth-metric-val">{formatNum(totalReach)}</span><span className="growth-metric-label">Total Reach</span></div></div>
        <div className="growth-metric"><Target size={14} /><div><span className="growth-metric-val">{formatNum(totalConversions)}</span><span className="growth-metric-label">Conversions</span></div></div>
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="growth-form glass">
          <input placeholder="Campaign name *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="growth-input" onKeyDown={e => e.key === 'Enter' && handleCreate()} autoFocus />
          <select value={form.channel} onChange={e => setForm({...form, channel: e.target.value})} className="growth-sel">
            {Object.keys(CHANNEL_COLORS).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="growth-sel">
            {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={form.venture_id} onChange={e => setForm({...form, venture_id: e.target.value})} className="growth-sel">
            <option value="">All ventures</option>
            {ventures.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <input type="number" placeholder="Budget" value={form.budget || ''} onChange={e => setForm({...form, budget: parseFloat(e.target.value) || 0})} className="growth-input" style={{ maxWidth: 100 }} />
          <input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} className="growth-input" style={{ maxWidth: 140 }} />
          <input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} className="growth-input" style={{ maxWidth: 140 }} />
          <button className="growth-save" onClick={handleCreate}>Create</button>
        </div>
      )}

      <div className="growth-grid">
        {/* Channel Breakdown */}
        <div className="growth-section">
          <h2 className="growth-section-title"><BarChart3 size={14} /> Channel Breakdown</h2>
          {Object.keys(channelMap).length === 0 && <p className="growth-empty-hint">No campaigns yet. Create your first campaign above.</p>}
          <div className="growth-channels">
            {Object.entries(channelMap).sort((a, b) => b[1].reach - a[1].reach).map(([ch, data]) => (
              <div key={ch} className="growth-channel">
                <span className="growth-ch-dot" style={{ background: CHANNEL_COLORS[ch] || '#6B7280' }} />
                <span className="growth-ch-name">{ch}</span>
                <div className="growth-ch-bar-track">
                  <div className="growth-ch-bar" style={{ width: `${(data.reach / maxReach) * 100}%`, background: CHANNEL_COLORS[ch] || '#6B7280' }} />
                </div>
                <span className="growth-ch-val">{data.count} camps</span>
                <span className="growth-ch-budget">{formatMoney(data.budget)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Campaign List */}
        <div className="growth-section growth-section-wide">
          <h2 className="growth-section-title"><Megaphone size={14} /> All Campaigns</h2>
          <div className="growth-campaigns">
            {campaigns.length === 0 && !loading && <p className="growth-empty-hint">No campaigns yet. Use the + Campaign button to create your first growth initiative.</p>}
            {campaigns.map(c => {
              const ventureObj = ventures.find(v => v.id === c.venture_id);
              const isEditing = editId === c.id;
              return (
                <div key={c.id} className="growth-campaign">
                  <span className="growth-camp-dot" style={{ background: CHANNEL_COLORS[c.channel] || '#6B7280' }} />
                  <div className="growth-camp-info">
                    <span className="growth-camp-name">{c.name}</span>
                    <span className="growth-camp-meta">
                      {c.channel && <span className="growth-camp-channel">{c.channel}</span>}
                      {ventureObj && <span style={{ color: ventureObj.color }}>{ventureObj.name}</span>}
                      {c.start_date && <span><Calendar size={9} /> {c.start_date}</span>}
                    </span>
                  </div>
                  <span className={`growth-camp-status`} style={{ background: `${STATUS_COLORS[c.status] || '#6B7280'}20`, color: STATUS_COLORS[c.status] || '#6B7280' }}>{c.status}</span>
                  <span className="growth-camp-budget">{formatMoney(c.budget)}</span>
                  <span className="growth-camp-reach">{formatNum(c.reach)} reach</span>
                  <span className="growth-camp-conv">{c.conversions} conv</span>
                  {/* Inline reach/conversions editor */}
                  {isEditing ? (
                    <div className="growth-camp-edit">
                      <input type="number" defaultValue={c.reach} className="growth-input-sm" placeholder="Reach" onBlur={e => handleUpdate(c.id, { reach: parseInt(e.target.value) || 0 })} />
                      <input type="number" defaultValue={c.conversions} className="growth-input-sm" placeholder="Conv" onBlur={e => handleUpdate(c.id, { conversions: parseInt(e.target.value) || 0 })} />
                      <select className="growth-sel-sm" defaultValue={c.status} onChange={e => handleUpdate(c.id, { status: e.target.value })}>
                        {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button className="growth-icon-btn" onClick={() => setEditId(null)}><X size={11} /></button>
                    </div>
                  ) : (
                    <div className="growth-camp-actions">
                      <button className="growth-icon-btn" onClick={() => setEditId(c.id)}><Edit3 size={11} /></button>
                      <button className="growth-icon-btn del" onClick={() => handleDelete(c.id)}><Trash2 size={11} /></button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Board */}
        <div className="growth-section">
          <h2 className="growth-section-title"><Target size={14} /> Campaign Pipeline</h2>
          <div className="growth-pipeline">
            {Object.entries(STATUS_COLORS).map(([status, color]) => {
              const items = byStatus[status] || [];
              return (
                <div key={status} className="growth-pipe-col">
                  <div className="growth-pipe-header" style={{ borderBottomColor: color }}>
                    <span>{status}</span>
                    <span className="growth-pipe-count">{items.length}</span>
                  </div>
                  <div className="growth-pipe-items">
                    {items.map(c => (
                      <div key={c.id} className="growth-pipe-card">
                        <span className="growth-pipe-name">{c.name}</span>
                        <span className="growth-pipe-channel" style={{ color: CHANNEL_COLORS[c.channel] }}>{c.channel}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        .growth { height:100%; overflow-y:auto; padding:20px 24px; display:flex; flex-direction:column; gap:16px; }
        .growth-header { display:flex; justify-content:space-between; align-items:flex-start; }
        .growth-title { font-family:var(--font-display); font-size:1.25rem; font-weight:700; display:flex; align-items:center; gap:8px; }
        .growth-sub { font-size:11px; color:var(--text-muted); margin-top:2px; }
        .growth-header-right { display:flex; gap:6px; }
        .growth-add-btn { display:flex; align-items:center; gap:4px; padding:5px 12px; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--cyan); font-size:11px; }
        .growth-refresh { width:30px; height:30px; display:flex; align-items:center; justify-content:center; border-radius:var(--radius-sm); color:var(--text-muted); }

        .growth-metrics { display:grid; grid-template-columns:repeat(5,1fr); gap:8px; }
        .growth-metric { display:flex; align-items:center; gap:10px; padding:12px 14px; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-md); color:var(--text-muted); }
        .growth-metric>div { flex:1; display:flex; flex-direction:column; }
        .growth-metric-val { font-family:var(--font-mono); font-size:1.1rem; font-weight:700; color:var(--text-primary); }
        .growth-metric-label { font-size:10px; text-transform:uppercase; letter-spacing:0.5px; }

        .growth-form { display:flex; gap:6px; padding:10px; border-radius:var(--radius-md); align-items:center; flex-wrap:wrap; }
        .growth-input { padding:6px 10px; background:var(--bg-input); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text-primary); font-size:12px; flex:1; min-width:100px; }
        .growth-input:focus { border-color:var(--border-active); outline:none; }
        .growth-sel { padding:6px 8px; background:var(--bg-input); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text-secondary); font-size:11px; }
        .growth-save { padding:6px 16px; background:var(--cyan); color:var(--bg-deep); font-size:11px; font-weight:600; border-radius:var(--radius-sm); }

        .growth-grid { display:grid; grid-template-columns:280px 1fr 1fr; gap:16px; }
        @media (max-width:1400px) { .growth-grid { grid-template-columns:1fr 1fr; } }

        .growth-section-title { font-size:11px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px; display:flex; align-items:center; gap:6px; }

        .growth-channels { display:flex; flex-direction:column; gap:6px; }
        .growth-channel { display:flex; align-items:center; gap:8px; padding:8px 12px; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-sm); }
        .growth-ch-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
        .growth-ch-name { font-size:11px; width:60px; flex-shrink:0; text-transform:capitalize; }
        .growth-ch-bar-track { flex:1; height:4px; background:var(--bg-elevated); border-radius:2px; overflow:hidden; }
        .growth-ch-bar { height:100%; border-radius:2px; }
        .growth-ch-val { font-size:9px; font-family:var(--font-mono); color:var(--text-muted); width:55px; text-align:right; }
        .growth-ch-budget { font-size:9px; font-family:var(--font-mono); color:var(--text-secondary); width:40px; text-align:right; }

        .growth-campaigns { display:flex; flex-direction:column; gap:4px; }
        .growth-campaign { display:flex; align-items:center; gap:8px; padding:8px 12px; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-sm); transition:background 0.1s; }
        .growth-campaign:hover { background:var(--bg-elevated); }
        .growth-camp-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
        .growth-camp-info { flex:1; min-width:0; }
        .growth-camp-name { display:block; font-size:12px; font-weight:500; }
        .growth-camp-meta { display:flex; gap:8px; font-size:10px; color:var(--text-muted); align-items:center; }
        .growth-camp-channel { text-transform:capitalize; }
        .growth-camp-status { font-size:9px; font-weight:600; padding:2px 8px; border-radius:var(--radius-full); text-transform:uppercase; flex-shrink:0; }
        .growth-camp-budget { font-size:11px; font-family:var(--font-mono); color:var(--text-secondary); flex-shrink:0; width:50px; text-align:right; }
        .growth-camp-reach { font-size:10px; font-family:var(--font-mono); color:var(--text-muted); flex-shrink:0; width:60px; text-align:right; }
        .growth-camp-conv { font-size:10px; font-family:var(--font-mono); color:var(--text-muted); flex-shrink:0; width:50px; text-align:right; }
        .growth-camp-actions { display:flex; gap:2px; opacity:0; transition:opacity 0.1s; }
        .growth-campaign:hover .growth-camp-actions { opacity:1; }
        .growth-camp-edit { display:flex; gap:4px; align-items:center; }
        .growth-icon-btn { width:24px; height:24px; display:flex; align-items:center; justify-content:center; border-radius:var(--radius-sm); color:var(--text-muted); }
        .growth-icon-btn:hover { background:var(--bg-card); color:var(--text-primary); }
        .growth-icon-btn.del:hover { color:var(--error); }
        .growth-input-sm { width:60px; padding:3px 6px; background:var(--bg-input); border:1px solid var(--border); border-radius:3px; color:var(--text-primary); font-size:10px; }
        .growth-sel-sm { padding:3px 4px; background:var(--bg-input); border:1px solid var(--border); border-radius:3px; color:var(--text-secondary); font-size:10px; }

        .growth-pipeline { display:grid; grid-template-columns:repeat(5,1fr); gap:1px; background:var(--border); border-radius:var(--radius-md); overflow:hidden; }
        .growth-pipe-col { background:var(--bg-deep); display:flex; flex-direction:column; }
        .growth-pipe-header { padding:6px 8px; font-size:9px; font-weight:600; color:var(--text-muted); text-transform:uppercase; border-bottom:2px solid; display:flex; justify-content:space-between; }
        .growth-pipe-count { font-family:var(--font-mono); }
        .growth-pipe-items { padding:4px; display:flex; flex-direction:column; gap:3px; }
        .growth-pipe-card { padding:6px 8px; background:var(--bg-card); border:1px solid var(--border); border-radius:3px; }
        .growth-pipe-name { font-size:10px; display:block; }
        .growth-pipe-channel { font-size:9px; text-transform:capitalize; }

        .growth-empty-hint { font-size:12px; color:var(--text-muted); padding:16px; text-align:center; }

        .glass { background:rgba(11,17,33,0.8); backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,0.06); }
        @keyframes spin { to{transform:rotate(360deg)} }
        .spin { animation:spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
