import { useState, useEffect, useCallback } from 'react';
import {
  Users, RefreshCw, Trash2, Shield, Mail, Edit3, X,
  Crown, Wrench, BarChart3, Eye, UserPlus,
} from 'lucide-react';
import { ventures } from '../lib/ventures';
import { useToast } from '../components/Toasts';

interface TeamMember {
  id: string; name: string; email: string; avatar_url: string;
  role: string; title: string; department: string; status: string;
  venture_assignments: string[]; last_active: string;
  created_at: string; updated_at: string;
}

const ROLES: { value: string; label: string; icon: typeof Crown; color: string }[] = [
  { value: 'ceo', label: 'CEO', icon: Crown, color: '#F59E0B' },
  { value: 'cto', label: 'CTO', icon: Wrench, color: '#00F0FF' },
  { value: 'developer', label: 'Developer', icon: Wrench, color: '#3B82F6' },
  { value: 'analyst', label: 'Analyst', icon: BarChart3, color: '#8B5CF6' },
  { value: 'admin', label: 'Admin', icon: Shield, color: '#10B981' },
  { value: 'viewer', label: 'Viewer', icon: Eye, color: '#6B7280' },
];

const ROLE_COLORS: Record<string, string> = Object.fromEntries(ROLES.map(r => [r.value, r.color]));
const DEPARTMENTS = ['Engineering', 'Operations', 'Growth', 'Finance', 'Research', 'Design', 'Executive'];

function timeAgo(d: string) { if (!d) return 'Never'; const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000); if (mins < 60) return `${mins}m ago`; const h = Math.floor(mins / 60); if (h < 24) return `${h}h ago`; return `${Math.floor(h / 24)}d ago`; }

async function api(body: Record<string, unknown>) {
  const r = await fetch('/api/team', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return r.json();
}

export default function TeamView() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', role: 'developer', title: '', department: 'Engineering' });
  const [ventureModal, setVentureModal] = useState<string | null>(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api({ action: 'list' });
    setMembers(res.members || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate() {
    if (!form.name.trim() || !form.email.trim()) return;
    await api({ action: 'create', member: form });
    toast('success', `${form.name} added to team`);
    setForm({ name: '', email: '', role: 'developer', title: '', department: 'Engineering' });
    setShowAdd(false); load();
  }

  async function handleUpdate(id: string, updates: Partial<TeamMember>) {
    await api({ action: 'update', member: { id, ...updates } });
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    setEditId(null);
    toast('info', 'Member updated');
  }

  async function handleDelete(id: string) {
    await api({ action: 'delete', id });
    setMembers(prev => prev.filter(m => m.id !== id));
    toast('info', 'Member removed');
  }

  async function handleAssignVentures(id: string, ventureIds: string[]) {
    await api({ action: 'assign-ventures', id, venture_assignments: ventureIds });
    setMembers(prev => prev.map(m => m.id === id ? { ...m, venture_assignments: ventureIds } : m));
    setVentureModal(null);
    toast('success', 'Venture assignments updated');
  }

  const byRole: Record<string, TeamMember[]> = {};
  members.forEach(m => {
    if (!byRole[m.role]) byRole[m.role] = [];
    byRole[m.role].push(m);
  });

  return (
    <div className="tm">
      <div className="tm-header">
        <div>
          <h1 className="tm-title"><Users size={20} /> Team Management</h1>
          <p className="tm-sub">EdgeIQ Holdings — {members.length} team members across {ventures.length} ventures</p>
        </div>
        <div className="tm-header-right">
          <button className="tm-add-btn" onClick={() => setShowAdd(!showAdd)}><UserPlus size={13} /> Add Member</button>
          <button className="tm-refresh" onClick={load}><RefreshCw size={14} className={loading ? 'spin' : ''} /></button>
        </div>
      </div>

      {/* KPIs */}
      <div className="tm-kpis">
        {ROLES.map(r => {
          const count = (byRole[r.value] || []).length;
          const Icon = r.icon;
          return (
            <div key={r.value} className="tm-kpi" style={{ borderLeftColor: r.color }}>
              <Icon size={14} style={{ color: r.color }} />
              <div><span className="tm-kpi-v">{count}</span><span className="tm-kpi-l">{r.label}s</span></div>
            </div>
          );
        })}
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="tm-form glass-neural">
          <input placeholder="Full name *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="tm-input" autoFocus />
          <input placeholder="Email *" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="tm-input" type="email" />
          <input placeholder="Job title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="tm-input" />
          <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="tm-sel">
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <select value={form.department} onChange={e => setForm({...form, department: e.target.value})} className="tm-sel">
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <button className="tm-save" onClick={handleCreate}>Add Member</button>
        </div>
      )}

      {/* Team Grid */}
      <div className="tm-grid">
        {members.map(m => {
          const roleObj = ROLES.find(r => r.value === m.role);
          const RoleIcon = roleObj?.icon || Eye;
          const isEditing = editId === m.id;

          return (
            <div key={m.id} className="tm-card glass-neural holo-hover">
              <div className="tm-card-accent" style={{ background: ROLE_COLORS[m.role] || '#6B7280' }} />
              <div className="tm-card-header">
                <span className="tm-avatar" style={{ background: ROLE_COLORS[m.role] || '#6B7280' }}>
                  {m.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </span>
                <div className="tm-card-info">
                  {isEditing ? (
                    <input className="tm-edit-name" defaultValue={m.name} onBlur={e => handleUpdate(m.id, { name: e.target.value })} autoFocus />
                  ) : (
                    <span className="tm-card-name">{m.name}</span>
                  )}
                  <span className="tm-card-title">{m.title || m.department || '—'}</span>
                </div>
                <div className="tm-card-actions">
                  {isEditing ? (
                    <button className="tm-icon-btn" onClick={() => setEditId(null)}><X size={12} /></button>
                  ) : (
                    <button className="tm-icon-btn" onClick={() => setEditId(m.id)}><Edit3 size={12} /></button>
                  )}
                </div>
              </div>

              <div className="tm-card-body">
                <div className="tm-card-row"><Mail size={10} /> <span>{m.email}</span></div>
                <div className="tm-card-row">
                  <RoleIcon size={10} />
                  <span className="tm-role-badge" style={{ color: ROLE_COLORS[m.role], borderColor: `${ROLE_COLORS[m.role]}30` }}>
                    {roleObj?.label || m.role}
                  </span>
                  {isEditing && (
                    <select className="tm-sel-sm" defaultValue={m.role} onChange={e => handleUpdate(m.id, { role: e.target.value })}>
                      {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  )}
                </div>
              </div>

              {/* Venture Assignments */}
              <div className="tm-ventures">
                <span className="tm-ventures-label">Ventures:</span>
                <div className="tm-venture-tags">
                  {(m.venture_assignments || []).length > 0 ? (
                    (m.venture_assignments || []).map(vid => {
                      const v = ventures.find(x => x.id === vid);
                      return v ? <span key={vid} className="tm-vtag" style={{ color: v.color, borderColor: `${v.color}30` }}>{v.name}</span> : null;
                    })
                  ) : (
                    <span className="tm-vtag none">No assignments</span>
                  )}
                  <button className="tm-vtag-add" onClick={() => setVentureModal(m.id)}>+</button>
                </div>
              </div>

              <div className="tm-card-footer">
                <span className="tm-card-meta">Last active: {timeAgo(m.last_active)}</span>
                <button className="tm-del" onClick={() => handleDelete(m.id)}><Trash2 size={11} /></button>
              </div>
            </div>
          );
        })}
        {members.length === 0 && !loading && (
          <div className="tm-empty">No team members yet. Add your first team member above.</div>
        )}
      </div>

      {/* Venture Assignment Modal */}
      {ventureModal && (
        <div className="tm-modal-overlay" onClick={() => setVentureModal(null)}>
          <div className="tm-modal glass-neural" onClick={e => e.stopPropagation()}>
            <h3 className="tm-modal-title">Assign Ventures</h3>
            <p className="tm-modal-desc">Select which ventures this team member can access:</p>
            <div className="tm-modal-ventures">
              {ventures.map(v => {
                const member = members.find(m => m.id === ventureModal);
                const assigned = (member?.venture_assignments || []).includes(v.id);
                return (
                  <label key={v.id} className={`tm-modal-v ${assigned ? 'active' : ''}`}>
                    <input
                      type="checkbox"
                      checked={assigned}
                      onChange={() => {
                        const current = member?.venture_assignments || [];
                        const next = assigned ? current.filter(x => x !== v.id) : [...current, v.id];
                        handleAssignVentures(ventureModal, next);
                      }}
                    />
                    <span className="tm-modal-v-dot" style={{ background: v.color }} />
                    <span>{v.name}</span>
                  </label>
                );
              })}
            </div>
            <button className="tm-modal-close" onClick={() => setVentureModal(null)}>Done</button>
          </div>
        </div>
      )}

      <style>{`
        .tm { height:100%; overflow-y:auto; padding:20px 24px; display:flex; flex-direction:column; gap:16px; }
        .tm-header { display:flex; justify-content:space-between; align-items:flex-start; }
        .tm-title { font-family:var(--font-display); font-size:1.5rem; font-weight:700; display:flex; align-items:center; gap:8px; }
        .tm-sub { font-size:11px; color:var(--text-muted); margin-top:2px; }
        .tm-header-right { display:flex; gap:6px; }
        .tm-add-btn { display:flex; align-items:center; gap:5px; padding:6px 14px; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--cyan); font-size:11px; font-weight:500; }
        .tm-refresh { width:30px; height:30px; display:flex; align-items:center; justify-content:center; border-radius:var(--radius-sm); color:var(--text-muted); }

        .tm-kpis { display:grid; grid-template-columns:repeat(6,1fr); gap:6px; }
        .tm-kpi { display:flex; align-items:center; gap:8px; padding:10px 12px; background:var(--bg-card); border:1px solid var(--border); border-left:3px solid; border-radius:var(--radius-md); }
        .tm-kpi>div { display:flex; flex-direction:column; }
        .tm-kpi-v { font-family:var(--font-mono); font-size:1rem; font-weight:700; color:var(--text-primary); }
        .tm-kpi-l { font-size:9px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; }

        .tm-form { display:flex; gap:6px; padding:12px; border-radius:var(--radius-md); align-items:center; flex-wrap:wrap; }
        .tm-input { padding:7px 10px; background:var(--bg-input); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text-primary); font-size:12px; flex:1; min-width:120px; }
        .tm-input:focus { border-color:var(--border-active); outline:none; }
        .tm-sel { padding:7px 8px; background:var(--bg-input); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text-secondary); font-size:11px; }
        .tm-save { padding:7px 18px; background:var(--cyan); color:var(--bg-deep); font-size:11px; font-weight:600; border-radius:var(--radius-sm); }

        .tm-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:10px; }

        .tm-card { position:relative; overflow:hidden; border-radius:var(--radius-md); padding:14px; display:flex; flex-direction:column; gap:10px; transition:all 0.2s; }
        .tm-card:hover { border-color:var(--border-active); transform:translateY(-1px); box-shadow:0 4px 20px rgba(0,0,0,0.3); }
        .tm-card-accent { position:absolute; top:0; left:0; width:100%; height:2px; }

        .tm-card-header { display:flex; align-items:center; gap:10px; }
        .tm-avatar { width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; color:var(--bg-deep); flex-shrink:0; }
        .tm-card-info { flex:1; min-width:0; }
        .tm-card-name { display:block; font-size:14px; font-weight:600; }
        .tm-card-title { display:block; font-size:11px; color:var(--text-muted); }
        .tm-edit-name { background:var(--bg-input); border:1px solid var(--border-active); border-radius:3px; color:var(--text-primary); font-size:13px; font-weight:600; padding:2px 6px; width:100%; }
        .tm-card-actions { display:flex; gap:2px; }
        .tm-icon-btn { width:26px; height:26px; display:flex; align-items:center; justify-content:center; border-radius:var(--radius-sm); color:var(--text-muted); transition:all 0.15s; }
        .tm-icon-btn:hover { background:var(--bg-elevated); color:var(--text-primary); }

        .tm-card-body { display:flex; flex-direction:column; gap:4px; }
        .tm-card-row { display:flex; align-items:center; gap:6px; font-size:11px; color:var(--text-secondary); }
        .tm-card-row svg { color:var(--text-muted); flex-shrink:0; }
        .tm-role-badge { font-size:9px; font-weight:600; text-transform:uppercase; padding:2px 8px; border:1px solid; border-radius:var(--radius-full); }
        .tm-sel-sm { padding:2px 4px; background:var(--bg-input); border:1px solid var(--border); border-radius:3px; color:var(--text-secondary); font-size:10px; margin-left:4px; }

        .tm-ventures { border-top:1px solid var(--border); padding-top:8px; }
        .tm-ventures-label { font-size:9px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:4px; }
        .tm-venture-tags { display:flex; flex-wrap:wrap; gap:4px; }
        .tm-vtag { font-size:9px; padding:2px 8px; border:1px solid; border-radius:var(--radius-full); font-weight:500; }
        .tm-vtag.none { color:var(--text-muted); border-color:var(--border); font-style:italic; }
        .tm-vtag-add { width:20px; height:20px; display:flex; align-items:center; justify-content:center; border:1px dashed var(--border); border-radius:50%; color:var(--text-muted); font-size:12px; cursor:pointer; }
        .tm-vtag-add:hover { border-color:var(--cyan); color:var(--cyan); }

        .tm-card-footer { display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border); padding-top:8px; }
        .tm-card-meta { font-size:10px; color:var(--text-muted); }
        .tm-del { color:var(--text-muted); opacity:0; transition:opacity 0.15s; }
        .tm-card:hover .tm-del { opacity:1; }
        .tm-del:hover { color:var(--error); }

        .tm-empty { grid-column:1/-1; text-align:center; padding:40px; color:var(--text-muted); font-size:13px; }

        /* Venture Assignment Modal */
        .tm-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:500; display:flex; align-items:center; justify-content:center; }
        .tm-modal { width:400px; max-width:90vw; padding:20px; border-radius:var(--radius-lg); }
        .tm-modal-title { font-family:var(--font-display); font-size:16px; font-weight:600; margin-bottom:4px; }
        .tm-modal-desc { font-size:12px; color:var(--text-muted); margin-bottom:12px; }
        .tm-modal-ventures { display:flex; flex-direction:column; gap:4px; max-height:300px; overflow-y:auto; }
        .tm-modal-v { display:flex; align-items:center; gap:8px; padding:8px 10px; border-radius:var(--radius-sm); cursor:pointer; transition:background 0.1s; font-size:12px; }
        .tm-modal-v:hover { background:var(--bg-elevated); }
        .tm-modal-v.active { background:rgba(0,240,255,0.05); }
        .tm-modal-v input { accent-color:var(--cyan); }
        .tm-modal-v-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
        .tm-modal-close { margin-top:12px; width:100%; padding:8px; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--cyan); font-size:12px; font-weight:500; }

        @keyframes spin { to{transform:rotate(360deg)} }
        .spin { animation:spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
