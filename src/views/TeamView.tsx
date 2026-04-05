import { useState } from 'react';
import {
  Users, Trash2, Shield, Mail, Edit3, X,
  Crown, Wrench, BarChart3, Eye, UserPlus,
} from 'lucide-react';
import { ventures } from '../lib/ventures';
import { useToast } from '../components/Toasts';
import { useTeamMembers, useCreateTeamMember, useUpdateTeamMember, useDeleteTeamMember, useAssignVentures } from '../hooks/use-team';
import { PageHeader, PageShell, Button, GlassCard, StatCard, GridLayout } from '../components/ui';
import { timeAgo } from '../lib/utils';

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

export default function TeamView() {
  const { data: apiMembers = [], isLoading: loading, refetch } = useTeamMembers();
  const members = apiMembers as unknown as TeamMember[];
  const createMember = useCreateTeamMember();
  const updateMember = useUpdateTeamMember();
  const deleteMember = useDeleteTeamMember();
  const assignVentures = useAssignVentures();

  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', role: 'developer', title: '', department: 'Engineering' });
  const [ventureModal, setVentureModal] = useState<string | null>(null);
  const { toast } = useToast();

  function handleCreate() {
    if (!form.name.trim() || !form.email.trim()) return;
    createMember.mutate(form as Record<string, unknown>, {
      onSuccess: () => {
        toast('success', `${form.name} added to team`);
        setForm({ name: '', email: '', role: 'developer', title: '', department: 'Engineering' });
        setShowAdd(false);
      },
    });
  }

  function handleUpdate(id: string, updates: Partial<TeamMember>) {
    updateMember.mutate({ id, ...updates } as { id: string } & Record<string, unknown>, {
      onSuccess: () => {
        setEditId(null);
        toast('info', 'Member updated');
      },
    });
  }

  function handleDelete(id: string) {
    deleteMember.mutate(id, {
      onSuccess: () => {
        toast('info', 'Member removed');
      },
    });
  }

  function handleAssignVentures(id: string, ventureIds: string[]) {
    assignVentures.mutate({ id, venture_assignments: ventureIds }, {
      onSuccess: () => {
        setVentureModal(null);
        toast('success', 'Venture assignments updated');
      },
    });
  }

  const byRole: Record<string, TeamMember[]> = {};
  members.forEach(m => {
    if (!byRole[m.role]) byRole[m.role] = [];
    byRole[m.role].push(m);
  });

  return (
    <PageShell scroll>
      <PageHeader icon={<Users size={20} />} title="Team Management" count={members.length} loading={loading} onRefresh={() => refetch()}>
        <Button variant="secondary" size="sm" icon={<UserPlus size={13} />} onClick={() => setShowAdd(!showAdd)}>Add Member</Button>
      </PageHeader>

      {/* KPIs */}
      <GridLayout cols={6} gap="sm">
        {ROLES.map(r => {
          const count = (byRole[r.value] || []).length;
          return (
            <StatCard key={r.value} icon={<r.icon size={14} />} label={`${r.label}s`} value={count} color={r.color} />
          );
        })}
      </GridLayout>

      {/* Add Form */}
      {showAdd && (
        <GlassCard variant="neural" className="tm-form">
          <input placeholder="Full name *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="tm-input" autoFocus />
          <input placeholder="Email *" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="tm-input" type="email" />
          <input placeholder="Job title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="tm-input" />
          <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="tm-sel">
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <select value={form.department} onChange={e => setForm({...form, department: e.target.value})} className="tm-sel">
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <Button variant="primary" size="sm" onClick={handleCreate}>Add Member</Button>
        </GlassCard>
      )}

      {/* Team Grid */}
      <div className="tm-grid">
        {members.map(m => {
          const roleObj = ROLES.find(r => r.value === m.role);
          const RoleIcon = roleObj?.icon || Eye;
          const isEditing = editId === m.id;

          return (
            <GlassCard key={m.id} variant="neural" className="tm-card holo-hover">
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
                  <span className="tm-card-title">{m.title || m.department || '\u2014'}</span>
                </div>
                <div className="tm-card-actions">
                  {isEditing ? (
                    <Button variant="ghost" size="sm" onClick={() => setEditId(null)}><X size={12} /></Button>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => setEditId(m.id)}><Edit3 size={12} /></Button>
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
                <Button variant="danger" size="sm" onClick={() => handleDelete(m.id)} className="tm-del"><Trash2 size={11} /></Button>
              </div>
            </GlassCard>
          );
        })}
        {members.length === 0 && !loading && (
          <div className="tm-empty">No team members yet. Add your first team member above.</div>
        )}
      </div>

      {/* Venture Assignment Modal */}
      {ventureModal && (
        <div className="tm-modal-overlay" onClick={() => setVentureModal(null)}>
          <div className="tm-modal-inner" onClick={e => e.stopPropagation()}>
          <GlassCard variant="neural" className="tm-modal">
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
            <Button variant="primary" size="sm" onClick={() => setVentureModal(null)} className="tm-modal-close-btn">Done</Button>
          </GlassCard>
          </div>
        </div>
      )}

      <style>{`
        .tm-form { display:flex; gap:6px; padding:12px; align-items:center; flex-wrap:wrap; margin:0 20px; }
        .tm-input { padding:7px 10px; background:var(--bg-input); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text-primary); font-size:12px; flex:1; min-width:120px; }
        .tm-input:focus { border-color:var(--border-active); outline:none; }
        .tm-sel { padding:7px 8px; background:var(--bg-input); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text-secondary); font-size:11px; }

        .tm-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:10px; padding:0 20px 20px; }

        .tm-card { position:relative; overflow:hidden; padding:14px; display:flex; flex-direction:column; gap:10px; }
        .tm-card:hover { transform:translateY(-1px); box-shadow:0 4px 20px rgba(0,0,0,0.3); }
        .tm-card-accent { position:absolute; top:0; left:0; width:100%; height:2px; }

        .tm-card-header { display:flex; align-items:center; gap:10px; }
        .tm-avatar { width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; color:var(--bg-deep); flex-shrink:0; }
        .tm-card-info { flex:1; min-width:0; }
        .tm-card-name { display:block; font-size:14px; font-weight:600; }
        .tm-card-title { display:block; font-size:11px; color:var(--text-muted); }
        .tm-edit-name { background:var(--bg-input); border:1px solid var(--border-active); border-radius:3px; color:var(--text-primary); font-size:13px; font-weight:600; padding:2px 6px; width:100%; }
        .tm-card-actions { display:flex; gap:2px; }

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
        .tm-del { opacity:0; transition:opacity 0.15s; }
        .tm-card:hover .tm-del { opacity:1; }

        .tm-empty { grid-column:1/-1; text-align:center; padding:40px; color:var(--text-muted); font-size:13px; }

        /* Venture Assignment Modal */
        .tm-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:500; display:flex; align-items:center; justify-content:center; }
        .tm-modal { width:400px; max-width:90vw; padding:20px; }
        .tm-modal-title { font-family:var(--font-display); font-size:16px; font-weight:600; margin-bottom:4px; }
        .tm-modal-desc { font-size:12px; color:var(--text-muted); margin-bottom:12px; }
        .tm-modal-ventures { display:flex; flex-direction:column; gap:4px; max-height:300px; overflow-y:auto; }
        .tm-modal-v { display:flex; align-items:center; gap:8px; padding:8px 10px; border-radius:var(--radius-sm); cursor:pointer; transition:background 0.1s; font-size:12px; }
        .tm-modal-v:hover { background:var(--bg-elevated); }
        .tm-modal-v.active { background:rgba(0,240,255,0.05); }
        .tm-modal-v input { accent-color:var(--cyan); }
        .tm-modal-v-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
        .tm-modal-close-btn { margin-top:12px; width:100%; }
      `}</style>
    </PageShell>
  );
}
