import { useState, useEffect } from 'react';
import { CheckSquare, Plus, RefreshCw, Trash2, Clock, AlertTriangle, Circle, CheckCircle2, Ban, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { useNavigation } from '../stores/navigation';

interface Task { id: string; title: string; description: string; status: string; priority: string; venture_id: string; assignee: string; due_date: string; tags: string[]; created_at: string; }

const STATUS_COLS = ['todo', 'in_progress', 'review', 'done'];
const STATUS_LABELS: Record<string, string> = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done', blocked: 'Blocked' };
const STATUS_ICONS: Record<string, React.ReactNode> = { todo: <Circle size={12} />, in_progress: <Clock size={12} />, review: <AlertTriangle size={12} />, done: <CheckCircle2 size={12} />, blocked: <Ban size={12} /> };
const STATUS_COLORS: Record<string, string> = { todo: '#6B7280', in_progress: '#00F0FF', review: '#F59E0B', done: '#10B981', blocked: '#EF4444' };
const PRIO_ICONS: Record<string, React.ReactNode> = { critical: <ArrowUp size={11} className="prio-critical" />, high: <ArrowUp size={11} className="prio-high" />, medium: <Minus size={11} className="prio-med" />, low: <ArrowDown size={11} className="prio-low" /> };

async function api(body: Record<string, unknown>) {
  const r = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return r.json();
}

export default function TasksView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [newVenture, setNewVenture] = useState('');
  const { mode, activeVenture } = useNavigation();

  async function load() {
    setLoading(true);
    const v = mode === 'venture' ? activeVenture : undefined;
    const d = await api({ action: 'list', venture_id: v || undefined });
    setTasks(d.tasks || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [activeVenture, mode]);

  async function handleCreate() {
    if (!newTitle.trim()) return;
    await api({ action: 'create', task: { title: newTitle, priority: newPriority, venture_id: newVenture || (mode === 'venture' ? activeVenture : null), status: 'todo' } });
    setNewTitle(''); setShowAdd(false); load();
  }

  async function handleStatusChange(id: string, status: string) {
    await api({ action: 'update', id, status });
    setTasks(t => t.map(tk => tk.id === id ? { ...tk, status } : tk));
  }

  async function handleDelete(id: string) {
    await api({ action: 'delete', id });
    setTasks(t => t.filter(tk => tk.id !== id));
  }

  const grouped = STATUS_COLS.reduce((acc, s) => { acc[s] = tasks.filter(t => t.status === s); return acc; }, {} as Record<string, Task[]>);
  const blocked = tasks.filter(t => t.status === 'blocked');

  return (
    <div className="tv">
      <div className="tv-header">
        <CheckSquare size={20} />
        <h1 className="tv-title">Tasks</h1>
        <span className="tv-count">{tasks.length}</span>
        <div className="tv-header-right">
          <button className="tv-add-btn" onClick={() => setShowAdd(!showAdd)}><Plus size={13} /> New Task</button>
          <button className="tv-refresh" onClick={load}><RefreshCw size={14} className={loading ? 'spin' : ''} /></button>
        </div>
      </div>

      {showAdd && (
        <div className="tv-add glass">
          <input className="tv-add-input" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Task title..." onKeyDown={e => e.key === 'Enter' && handleCreate()} autoFocus />
          <select className="tv-add-sel" value={newPriority} onChange={e => setNewPriority(e.target.value)}>
            <option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
          </select>
          <select className="tv-add-sel" value={newVenture} onChange={e => setNewVenture(e.target.value)}>
            <option value="">Global</option><option value="mcv">MCV One</option><option value="betedge">BetEdge</option><option value="futurestate">FutureState</option>
            <option value="warforge">WarForge</option><option value="edgeiq">EdgeIQ</option><option value="arqlabs">ARQ Labs</option>
          </select>
          <button className="tv-save" onClick={handleCreate}>Add</button>
        </div>
      )}

      {/* Kanban Board */}
      <div className="tv-board">
        {STATUS_COLS.map(col => (
          <div key={col} className="tv-col">
            <div className="tv-col-header" style={{ borderBottomColor: STATUS_COLORS[col] }}>
              {STATUS_ICONS[col]}
              <span>{STATUS_LABELS[col]}</span>
              <span className="tv-col-count">{grouped[col]?.length || 0}</span>
            </div>
            <div className="tv-col-cards">
              {(grouped[col] || []).map(t => (
                <div key={t.id} className="tv-card glass">
                  <div className="tv-card-top">
                    {PRIO_ICONS[t.priority]}
                    <span className="tv-card-title">{t.title}</span>
                    <button className="tv-card-del" onClick={() => handleDelete(t.id)}><Trash2 size={10} /></button>
                  </div>
                  <div className="tv-card-meta">
                    {t.venture_id && <span className="tv-card-venture">{t.venture_id}</span>}
                    {t.due_date && <span className="tv-card-due">{t.due_date}</span>}
                  </div>
                  <div className="tv-card-actions">
                    {col !== 'todo' && <button className="tv-move" onClick={() => handleStatusChange(t.id, STATUS_COLS[STATUS_COLS.indexOf(col) - 1])}>← Back</button>}
                    {col !== 'done' && <button className="tv-move" onClick={() => handleStatusChange(t.id, STATUS_COLS[STATUS_COLS.indexOf(col) + 1])}>Next →</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {blocked.length > 0 && (
        <div className="tv-blocked">
          <h3 className="tv-blocked-title"><Ban size={12} /> Blocked ({blocked.length})</h3>
          {blocked.map(t => (
            <div key={t.id} className="tv-card glass blocked"><span className="tv-card-title">{t.title}</span>
              <button className="tv-move" onClick={() => handleStatusChange(t.id, 'todo')}>Unblock</button>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .tv { height:100%; display:flex; flex-direction:column; overflow:hidden; }
        .tv-header { display:flex; align-items:center; gap:8px; padding:16px 20px 12px; flex-shrink:0; }
        .tv-title { font-family:var(--font-display); font-size:1.25rem; font-weight:700; }
        .tv-count { font-size:10px; font-family:var(--font-mono); color:var(--text-muted); background:var(--bg-card); border:1px solid var(--border); padding:1px 8px; border-radius:var(--radius-full); }
        .tv-header-right { margin-left:auto; display:flex; gap:6px; }
        .tv-add-btn { display:flex; align-items:center; gap:4px; padding:6px 12px; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--cyan); font-size:11px; font-weight:500; transition:all 0.15s; }
        .tv-add-btn:hover { border-color:var(--border-active); }
        .tv-refresh { width:30px; height:30px; display:flex; align-items:center; justify-content:center; border-radius:var(--radius-sm); color:var(--text-muted); }

        .tv-add { display:flex; gap:8px; padding:10px 20px; margin:0 20px; border-radius:var(--radius-md); align-items:center; }
        .tv-add-input { flex:1; padding:6px 10px; background:var(--bg-input); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text-primary); font-size:12px; }
        .tv-add-input:focus { border-color:var(--border-active); outline:none; }
        .tv-add-sel { padding:6px 8px; background:var(--bg-input); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text-secondary); font-size:11px; }
        .tv-save { padding:6px 16px; background:var(--cyan); color:var(--bg-deep); font-size:11px; font-weight:600; border-radius:var(--radius-sm); }

        .tv-board { flex:1; display:grid; grid-template-columns:repeat(4,1fr); gap:1px; background:var(--border); overflow:hidden; margin-top:8px; }
        .tv-col { background:var(--bg-deep); display:flex; flex-direction:column; overflow:hidden; }
        .tv-col-header { display:flex; align-items:center; gap:6px; padding:8px 12px; font-size:11px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; border-bottom:2px solid; flex-shrink:0; }
        .tv-col-count { margin-left:auto; font-size:10px; font-family:var(--font-mono); }
        .tv-col-cards { flex:1; overflow-y:auto; padding:6px; display:flex; flex-direction:column; gap:4px; }

        .tv-card { padding:10px; border-radius:var(--radius-sm); display:flex; flex-direction:column; gap:6px; transition:all 0.15s; }
        .tv-card:hover { border-color:rgba(255,255,255,0.1); }
        .tv-card.blocked { border-color:rgba(239,68,68,0.2); }
        .tv-card-top { display:flex; align-items:center; gap:6px; }
        .tv-card-title { flex:1; font-size:12px; font-weight:500; color:var(--text-primary); }
        .tv-card-del { opacity:0; color:var(--text-muted); padding:2px; border-radius:2px; transition:all 0.1s; }
        .tv-card:hover .tv-card-del { opacity:1; }
        .tv-card-del:hover { color:var(--error); }
        .tv-card-meta { display:flex; gap:6px; font-size:10px; color:var(--text-muted); }
        .tv-card-venture { background:var(--bg-surface); padding:1px 5px; border-radius:3px; }
        .tv-card-actions { display:flex; gap:4px; }
        .tv-move { font-size:9px; color:var(--text-muted); padding:2px 6px; border-radius:3px; transition:all 0.1s; }
        .tv-move:hover { background:var(--bg-card); color:var(--cyan); }

        .prio-critical { color:#EF4444; }
        .prio-high { color:#F59E0B; }
        .prio-med { color:#6B7280; }
        .prio-low { color:#3B82F6; }

        .tv-blocked { padding:8px 20px; }
        .tv-blocked-title { font-size:11px; font-weight:600; color:var(--error); display:flex; align-items:center; gap:4px; margin-bottom:6px; }

        .glass { background:rgba(11,17,33,0.8); backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,0.06); }
        @keyframes spin { to{transform:rotate(360deg)} }
        .spin { animation:spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
