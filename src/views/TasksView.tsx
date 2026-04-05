import { useState } from 'react';
import { CheckSquare, Plus, Trash2, Clock, AlertTriangle, Circle, CheckCircle2, Ban, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { useNavigation } from '../stores/navigation';
import { useToast } from '../components/Toasts';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '../hooks/use-tasks';
import { PageHeader, PageShell, Button, GlassCard, Badge } from '../components/ui';
import type { Task } from '../lib/schemas/tasks';

const STATUS_COLS = ['todo', 'in_progress', 'review', 'done'];
const STATUS_LABELS: Record<string, string> = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done', blocked: 'Blocked' };
const STATUS_ICONS: Record<string, React.ReactNode> = { todo: <Circle size={12} />, in_progress: <Clock size={12} />, review: <AlertTriangle size={12} />, done: <CheckCircle2 size={12} />, blocked: <Ban size={12} /> };
const STATUS_COLORS: Record<string, string> = { todo: '#6B7280', in_progress: '#00F0FF', review: '#F59E0B', done: '#10B981', blocked: '#EF4444' };
const PRIO_ICONS: Record<string, React.ReactNode> = { critical: <ArrowUp size={11} style={{ color: '#EF4444' }} />, high: <ArrowUp size={11} style={{ color: '#F59E0B' }} />, medium: <Minus size={11} style={{ color: '#6B7280' }} />, low: <ArrowDown size={11} style={{ color: '#3B82F6' }} /> };

export default function TasksView() {
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [newVenture, setNewVenture] = useState('');
  const { mode, activeVenture } = useNavigation();
  const { toast } = useToast();

  const ventureFilter = mode === 'venture' ? activeVenture : undefined;
  const { data: tasks = [], isLoading, refetch } = useTasks(ventureFilter || undefined);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  async function handleCreate() {
    if (!newTitle.trim()) return;
    await createTask.mutateAsync({
      title: newTitle, priority: newPriority,
      venture_id: newVenture || (mode === 'venture' ? activeVenture : null) || '',
      status: 'todo',
    });
    toast('success', `Task "${newTitle}" created`);
    setNewTitle(''); setShowAdd(false);
  }

  const grouped = STATUS_COLS.reduce((acc, s) => { acc[s] = tasks.filter((t: Task) => t.status === s); return acc; }, {} as Record<string, Task[]>);
  const blocked = tasks.filter((t: Task) => t.status === 'blocked');

  return (
    <PageShell scroll={false}>
      <PageHeader icon={<CheckSquare size={20} />} title="Tasks" count={tasks.length} loading={isLoading} onRefresh={() => refetch()}>
        <Button variant="secondary" size="sm" icon={<Plus size={13} />} onClick={() => setShowAdd(!showAdd)}>New Task</Button>
      </PageHeader>

      {showAdd && (
        <GlassCard className="tv-add">
          <input className="mcv-input" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Task title..." onKeyDown={e => e.key === 'Enter' && handleCreate()} autoFocus style={{ flex: 1 }} />
          <select className="mcv-input" value={newPriority} onChange={e => setNewPriority(e.target.value)} style={{ width: 'auto' }}>
            <option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
          </select>
          <select className="mcv-input" value={newVenture} onChange={e => setNewVenture(e.target.value)} style={{ width: 'auto' }}>
            <option value="">Global</option><option value="mcv">MCV One</option><option value="betedge">BetEdge</option><option value="futurestate">FutureState</option>
            <option value="warforge">WarForge</option><option value="edgeiq">EdgeIQ</option><option value="arqlabs">ARQ Labs</option>
          </select>
          <Button variant="primary" size="sm" onClick={handleCreate}>Add</Button>
        </GlassCard>
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
                <GlassCard key={t.id} className="tv-card">
                  <div className="tv-card-top">
                    {PRIO_ICONS[t.priority]}
                    <span className="tv-card-title">{t.title}</span>
                    <button className="tv-card-del" onClick={() => deleteTask.mutate(t.id)}><Trash2 size={10} /></button>
                  </div>
                  <div className="tv-card-meta">
                    {t.venture_id && <Badge size="sm">{t.venture_id}</Badge>}
                    {t.due_date && <span className="tv-card-due">{t.due_date}</span>}
                  </div>
                  <div className="tv-card-actions">
                    {col !== 'todo' && <button className="tv-move" onClick={() => updateTask.mutate({ id: t.id, status: STATUS_COLS[STATUS_COLS.indexOf(col) - 1] })}>← Back</button>}
                    {col !== 'done' && <button className="tv-move" onClick={() => updateTask.mutate({ id: t.id, status: STATUS_COLS[STATUS_COLS.indexOf(col) + 1] })}>Next →</button>}
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        ))}
      </div>

      {blocked.length > 0 && (
        <div className="tv-blocked">
          <h3 className="tv-blocked-title"><Ban size={12} /> Blocked ({blocked.length})</h3>
          {blocked.map(t => (
            <GlassCard key={t.id} className="tv-card blocked">
              <span className="tv-card-title">{t.title}</span>
              <button className="tv-move" onClick={() => updateTask.mutate({ id: t.id, status: 'todo' })}>Unblock</button>
            </GlassCard>
          ))}
        </div>
      )}

      <style>{`
        .tv-add { display:flex; gap:8px; padding:10px 20px; margin:0 20px; align-items:center; }
        .tv-board { flex:1; display:grid; grid-template-columns:repeat(4,1fr); gap:1px; background:var(--border); overflow:hidden; margin-top:8px; }
        .tv-col { background:var(--bg-deep); display:flex; flex-direction:column; overflow:hidden; }
        .tv-col-header { display:flex; align-items:center; gap:6px; padding:8px 12px; font-size:11px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; border-bottom:2px solid; flex-shrink:0; }
        .tv-col-count { margin-left:auto; font-size:10px; font-family:var(--font-mono); }
        .tv-col-cards { flex:1; overflow-y:auto; padding:6px; display:flex; flex-direction:column; gap:4px; }
        .tv-card { padding:10px; display:flex; flex-direction:column; gap:6px; }
        .tv-card:hover { border-color:rgba(255,255,255,0.1); }
        .tv-card.blocked { border-color:rgba(239,68,68,0.2); }
        .tv-card-top { display:flex; align-items:center; gap:6px; }
        .tv-card-title { flex:1; font-size:12px; font-weight:500; color:var(--text-primary); }
        .tv-card-del { opacity:0; color:var(--text-muted); padding:2px; border-radius:2px; transition:all 0.1s; }
        .tv-card:hover .tv-card-del { opacity:1; }
        .tv-card-del:hover { color:var(--error); }
        .tv-card-meta { display:flex; gap:6px; font-size:10px; color:var(--text-muted); }
        .tv-card-actions { display:flex; gap:4px; }
        .tv-move { font-size:9px; color:var(--text-muted); padding:2px 6px; border-radius:3px; transition:all 0.1s; }
        .tv-move:hover { background:var(--bg-card); color:var(--cyan); }
        .tv-blocked { padding:8px 20px; }
        .tv-blocked-title { font-size:11px; font-weight:600; color:var(--error); display:flex; align-items:center; gap:4px; margin-bottom:6px; }
      `}</style>
    </PageShell>
  );
}
