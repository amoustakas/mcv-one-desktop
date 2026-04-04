import { useState, useEffect } from 'react';
import { Users, Plus, RefreshCw, Trash2, Mail, Building, DollarSign, TrendingUp, ArrowRight } from 'lucide-react';
import { useNavigation } from '../stores/navigation';

interface Contact { id: string; name: string; email: string; phone: string; company: string; role: string; type: string; status: string; venture_id: string; notes: string; last_contacted: string; created_at: string; }
interface Deal { id: string; title: string; value: number; stage: string; venture_id: string; contact_id: string; contacts: { name: string; company: string } | null; probability: number; created_at: string; }

const TYPE_COLORS: Record<string, string> = { lead: '#F59E0B', prospect: '#00F0FF', client: '#10B981', partner: '#8B5CF6', investor: '#3B82F6', vendor: '#6B7280' };
const STAGE_COLORS: Record<string, string> = { discovery: '#6B7280', qualification: '#00F0FF', proposal: '#F59E0B', negotiation: '#8B5CF6', closed_won: '#10B981', closed_lost: '#EF4444' };

async function api(body: Record<string, unknown>) {
  const r = await fetch('/api/crm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return r.json();
}

function timeAgo(d: string) { if (!d) return '—'; const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000); if (mins < 60) return `${mins}m`; const h = Math.floor(mins / 60); if (h < 24) return `${h}h`; return `${Math.floor(h / 24)}d`; }
function formatMoney(n: number) { if (n >= 1e6) return `$${(n/1e6).toFixed(1)}M`; if (n >= 1e3) return `$${(n/1e3).toFixed(0)}K`; return `$${n}`; }

export default function CRMView() {
  const [tab, setTab] = useState<'contacts' | 'deals'>('contacts');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', company: '', role: '', type: 'lead', venture_id: '' });
  const [dealForm, setDealForm] = useState({ title: '', value: 0, stage: 'discovery', venture_id: '' });
  const { mode, activeVenture } = useNavigation();

  async function load() {
    setLoading(true);
    const v = mode === 'venture' ? activeVenture : undefined;
    const [c, d] = await Promise.all([
      api({ action: 'list-contacts', venture_id: v || undefined }),
      api({ action: 'list-deals', venture_id: v || undefined }),
    ]);
    setContacts(c.contacts || []);
    setDeals(d.deals || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [activeVenture, mode]);

  async function handleCreateContact() {
    if (!form.name.trim()) return;
    await api({ action: 'create-contact', contact: { ...form, venture_id: form.venture_id || (mode === 'venture' ? activeVenture : null) } });
    setForm({ name: '', email: '', company: '', role: '', type: 'lead', venture_id: '' }); setShowAdd(false); load();
  }

  async function handleCreateDeal() {
    if (!dealForm.title.trim()) return;
    await api({ action: 'create-deal', deal: { ...dealForm, venture_id: dealForm.venture_id || (mode === 'venture' ? activeVenture : null) } });
    setDealForm({ title: '', value: 0, stage: 'discovery', venture_id: '' }); setShowAdd(false); load();
  }

  async function handleDeleteContact(id: string) { await api({ action: 'delete-contact', id }); setContacts(c => c.filter(x => x.id !== id)); }

  const pipeline = deals.reduce((s, d) => s + (d.value || 0), 0);
  const wonDeals = deals.filter(d => d.stage === 'closed_won');
  const wonValue = wonDeals.reduce((s, d) => s + (d.value || 0), 0);

  return (
    <div className="crm">
      <div className="crm-header">
        <Users size={20} />
        <h1 className="crm-title">CRM</h1>
        <div className="crm-tabs">
          <button className={`crm-tab ${tab === 'contacts' ? 'active' : ''}`} onClick={() => { setTab('contacts'); setShowAdd(false); }}>Contacts ({contacts.length})</button>
          <button className={`crm-tab ${tab === 'deals' ? 'active' : ''}`} onClick={() => { setTab('deals'); setShowAdd(false); }}>Deals ({deals.length})</button>
        </div>
        <div className="crm-header-right">
          <button className="crm-add-btn" onClick={() => setShowAdd(!showAdd)}><Plus size={13} /> {tab === 'contacts' ? 'Contact' : 'Deal'}</button>
          <button className="crm-refresh" onClick={load}><RefreshCw size={14} className={loading ? 'spin' : ''} /></button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="crm-kpis">
        <div className="crm-kpi"><Users size={13} /><div><span className="crm-kpi-v">{contacts.length}</span><span className="crm-kpi-l">Contacts</span></div></div>
        <div className="crm-kpi"><DollarSign size={13} /><div><span className="crm-kpi-v">{formatMoney(pipeline)}</span><span className="crm-kpi-l">Pipeline</span></div></div>
        <div className="crm-kpi"><TrendingUp size={13} /><div><span className="crm-kpi-v">{formatMoney(wonValue)}</span><span className="crm-kpi-l">Won</span></div></div>
        <div className="crm-kpi"><ArrowRight size={13} /><div><span className="crm-kpi-v">{deals.filter(d => !d.stage.startsWith('closed')).length}</span><span className="crm-kpi-l">Active</span></div></div>
      </div>

      {/* Add Forms */}
      {showAdd && tab === 'contacts' && (
        <div className="crm-form glass">
          <input placeholder="Name *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="crm-input" onKeyDown={e => e.key === 'Enter' && handleCreateContact()} autoFocus />
          <input placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="crm-input" />
          <input placeholder="Company" value={form.company} onChange={e => setForm({...form, company: e.target.value})} className="crm-input" />
          <input placeholder="Role" value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="crm-input" />
          <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="crm-sel">
            {Object.keys(TYPE_COLORS).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button className="crm-save" onClick={handleCreateContact}>Add Contact</button>
        </div>
      )}
      {showAdd && tab === 'deals' && (
        <div className="crm-form glass">
          <input placeholder="Deal title *" value={dealForm.title} onChange={e => setDealForm({...dealForm, title: e.target.value})} className="crm-input" onKeyDown={e => e.key === 'Enter' && handleCreateDeal()} autoFocus />
          <input placeholder="Value" type="number" value={dealForm.value || ''} onChange={e => setDealForm({...dealForm, value: parseFloat(e.target.value) || 0})} className="crm-input" />
          <select value={dealForm.stage} onChange={e => setDealForm({...dealForm, stage: e.target.value})} className="crm-sel">
            {Object.keys(STAGE_COLORS).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <button className="crm-save" onClick={handleCreateDeal}>Add Deal</button>
        </div>
      )}

      {/* Content */}
      <div className="crm-body">
        {tab === 'contacts' && (
          <div className="crm-table">
            <div className="crm-table-header"><span>Name</span><span>Company</span><span>Type</span><span>Email</span><span>Added</span><span></span></div>
            {contacts.map(c => (
              <div key={c.id} className="crm-table-row">
                <span className="crm-name">{c.name}{c.role && <span className="crm-role">{c.role}</span>}</span>
                <span className="crm-company"><Building size={10} /> {c.company || '—'}</span>
                <span className="crm-type-badge" style={{ color: TYPE_COLORS[c.type], borderColor: `${TYPE_COLORS[c.type]}40` }}>{c.type}</span>
                <span className="crm-email">{c.email ? <><Mail size={10} /> {c.email}</> : '—'}</span>
                <span className="crm-time">{timeAgo(c.created_at)}</span>
                <button className="crm-del" onClick={() => handleDeleteContact(c.id)}><Trash2 size={11} /></button>
              </div>
            ))}
            {contacts.length === 0 && !loading && <div className="crm-empty">No contacts yet. Add your first contact above.</div>}
          </div>
        )}
        {tab === 'deals' && (
          <div className="crm-deals-board">
            {Object.entries(STAGE_COLORS).map(([stage, color]) => {
              const stageDeals = deals.filter(d => d.stage === stage);
              const stageVal = stageDeals.reduce((s, d) => s + (d.value || 0), 0);
              return (
                <div key={stage} className="crm-deal-col">
                  <div className="crm-deal-col-header" style={{ borderBottomColor: color }}>
                    <span>{stage.replace('_', ' ')}</span>
                    <span className="crm-deal-col-count">{stageDeals.length} &middot; {formatMoney(stageVal)}</span>
                  </div>
                  <div className="crm-deal-col-cards">
                    {stageDeals.map(d => (
                      <div key={d.id} className="crm-deal-card glass">
                        <span className="crm-deal-title">{d.title}</span>
                        <span className="crm-deal-val">{formatMoney(d.value)}</span>
                        {d.contacts && <span className="crm-deal-contact">{d.contacts.name}</span>}
                        {d.venture_id && <span className="crm-deal-venture">{d.venture_id}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .crm { height:100%; display:flex; flex-direction:column; overflow:hidden; }
        .crm-header { display:flex; align-items:center; gap:8px; padding:16px 20px 0; flex-shrink:0; }
        .crm-title { font-family:var(--font-display); font-size:1.25rem; font-weight:700; }
        .crm-tabs { display:flex; gap:2px; background:var(--bg-deep); border-radius:var(--radius-sm); padding:2px; margin-left:12px; }
        .crm-tab { padding:5px 14px; border-radius:var(--radius-sm); font-size:11px; font-weight:500; color:var(--text-muted); transition:all 0.15s; }
        .crm-tab.active { background:var(--bg-card); color:var(--cyan); }
        .crm-header-right { margin-left:auto; display:flex; gap:6px; }
        .crm-add-btn { display:flex; align-items:center; gap:4px; padding:5px 12px; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--cyan); font-size:11px; }
        .crm-refresh { width:30px; height:30px; display:flex; align-items:center; justify-content:center; border-radius:var(--radius-sm); color:var(--text-muted); }

        .crm-kpis { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; padding:10px 20px; }
        .crm-kpi { display:flex; align-items:center; gap:8px; padding:8px 12px; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-md); color:var(--text-muted); }
        .crm-kpi>div { display:flex; flex-direction:column; }
        .crm-kpi-v { font-family:var(--font-mono); font-size:1rem; font-weight:700; color:var(--text-primary); }
        .crm-kpi-l { font-size:9px; text-transform:uppercase; letter-spacing:0.5px; }

        .crm-form { display:flex; gap:6px; padding:10px; margin:0 20px; border-radius:var(--radius-md); align-items:center; flex-wrap:wrap; }
        .crm-input { padding:6px 10px; background:var(--bg-input); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text-primary); font-size:12px; flex:1; min-width:120px; }
        .crm-input:focus { border-color:var(--border-active); outline:none; }
        .crm-sel { padding:6px 8px; background:var(--bg-input); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text-secondary); font-size:11px; }
        .crm-save { padding:6px 16px; background:var(--cyan); color:var(--bg-deep); font-size:11px; font-weight:600; border-radius:var(--radius-sm); white-space:nowrap; }

        .crm-body { flex:1; overflow:hidden; padding:8px 20px 0; }

        /* Contact Table */
        .crm-table { overflow-y:auto; height:100%; }
        .crm-table-header { display:grid; grid-template-columns:1.5fr 1fr 80px 1.2fr 60px 30px; gap:8px; padding:6px 12px; font-size:10px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; border-bottom:1px solid var(--border); position:sticky; top:0; background:var(--bg-deep); z-index:1; }
        .crm-table-row { display:grid; grid-template-columns:1.5fr 1fr 80px 1.2fr 60px 30px; gap:8px; padding:8px 12px; border-bottom:1px solid var(--border); align-items:center; font-size:12px; transition:background 0.1s; }
        .crm-table-row:hover { background:var(--bg-card); }
        .crm-name { font-weight:500; }
        .crm-role { font-size:10px; color:var(--text-muted); margin-left:6px; }
        .crm-company { font-size:11px; color:var(--text-secondary); display:flex; align-items:center; gap:4px; }
        .crm-type-badge { font-size:9px; font-weight:600; text-transform:uppercase; letter-spacing:0.3px; padding:1px 6px; border:1px solid; border-radius:3px; width:fit-content; }
        .crm-email { font-size:11px; color:var(--text-muted); display:flex; align-items:center; gap:4px; }
        .crm-time { font-size:10px; color:var(--text-muted); font-family:var(--font-mono); }
        .crm-del { opacity:0; color:var(--text-muted); }
        .crm-table-row:hover .crm-del { opacity:1; }
        .crm-del:hover { color:var(--error); }
        .crm-empty { padding:32px; text-align:center; font-size:12px; color:var(--text-muted); }

        /* Deal Board */
        .crm-deals-board { display:grid; grid-template-columns:repeat(6,1fr); gap:1px; background:var(--border); height:100%; overflow:hidden; }
        .crm-deal-col { background:var(--bg-deep); display:flex; flex-direction:column; }
        .crm-deal-col-header { padding:6px 8px; font-size:10px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.3px; border-bottom:2px solid; display:flex; justify-content:space-between; flex-shrink:0; }
        .crm-deal-col-count { font-family:var(--font-mono); font-size:9px; }
        .crm-deal-col-cards { flex:1; overflow-y:auto; padding:4px; display:flex; flex-direction:column; gap:3px; }
        .crm-deal-card { padding:8px; border-radius:var(--radius-sm); display:flex; flex-direction:column; gap:2px; }
        .crm-deal-title { font-size:11px; font-weight:500; }
        .crm-deal-val { font-size:12px; font-weight:700; font-family:var(--font-mono); color:var(--success); }
        .crm-deal-contact { font-size:10px; color:var(--text-muted); }
        .crm-deal-venture { font-size:9px; color:var(--text-muted); background:var(--bg-surface); padding:1px 4px; border-radius:2px; width:fit-content; }

        .glass { background:rgba(11,17,33,0.8); backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,0.06); }
        @keyframes spin { to{transform:rotate(360deg)} }
        .spin { animation:spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
