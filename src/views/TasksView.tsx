import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Plus, Trash2, Clock, AlertTriangle, Circle, CheckCircle2, Ban, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { useNavigation } from '../stores/navigation';
import { useToast } from '../components/Toasts';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '../hooks/use-tasks';
import { PageHeader, PageShell, Button, GlassCard, Badge, BulkActionBar } from '../components/ui';
import type { BulkAction } from '../components/ui';
import { staggerContainer, fadeInUp } from '../lib/animations';
import type { Task } from '../lib/schemas/tasks';

const STATUS_COLS = ['todo', 'in_progress', 'review', 'done'];
const STATUS_LABELS: Record<string, string> = { todo: 'To Do', in_progress: 'In Progress', review: 'Review', done: 'Done', blocked: 'Blocked' };
const STATUS_ICONS: Record<string, React.ReactNode> = { todo: <Circle size={12} />, in_progress: <Clock size={12} />, review: <AlertTriangle size={12} />, done: <CheckCircle2 size={12} />, blocked: <Ban size={12} /> };
const STATUS_COLORS: Record<string, string> = { todo: '#6B7280', in_progress: 'var(--cyan)', review: 'var(--warning)', done: 'var(--success)', blocked: 'var(--error)' };
const PRIO_ICONS: Record<string, React.ReactNode> = { critical: <ArrowUp size={11} style={{ color: 'var(--error)' }} />, high: <ArrowUp size={11} style={{ color: 'var(--warning)' }} />, medium: <Minus size={11} style={{ color: 'var(--text-muted)' }} />, low: <ArrowDown size={11} style={{ color: 'var(--core-blue)' }} /> };
const PRIO_COLORS: Record<string, string> = { critical: 'var(--error)', high: 'var(--warning)', medium: 'var(--text-muted)', low: 'var(--core-blue)' };

export default function TasksView() {
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [newVenture, setNewVenture] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { mode, activeVenture } = useNavigation();
  const { toast } = useToast();

  const ventureFilter = mode === 'venture' ? activeVenture : undefined;
  const { data: tasks = [], isLoading, refetch } = useTasks(ventureFilter || undefined);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const bulkActions: BulkAction[] = [
    {
      id: 'done',
      label: 'Mark Done',
      icon: <CheckCircle2 size={12} />,
      onRun: async (ids) => {
        for (const id of ids) {
          try { await updateTask.mutateAsync({ id, status: 'done' }); } catch { /* skip */ }
        }
        toast('success', `Marked ${ids.length} task${ids.length === 1 ? '' : 's'} done`);
      },
    },
    {
      id: 'move-progress',
      label: 'To In Progress',
      icon: <Clock size={12} />,
      onRun: async (ids) => {
        for (const id of ids) {
          try { await updateTask.mutateAsync({ id, status: 'in_progress' }); } catch { /* skip */ }
        }
        toast('success', `Moved ${ids.length} to In Progress`);
      },
    },
    {
      id: 'block',
      label: 'Block',
      icon: <Ban size={12} />,
      onRun: async (ids) => {
        for (const id of ids) {
          try { await updateTask.mutateAsync({ id, status: 'blocked' }); } catch { /* skip */ }
        }
        toast('info', `Blocked ${ids.length}`);
      },
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 size={12} />,
      danger: true,
      confirm: true,
      onRun: async (ids) => {
        for (const id of ids) {
          try { await deleteTask.mutateAsync(id); } catch { /* skip */ }
        }
        toast('info', `Deleted ${ids.length}`);
      },
    },
  ];

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

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kanban Board */}
      <div className="tv-board">
        {STATUS_COLS.map(col => (
          <div key={col} className="tv-col">
            <div className="tv-col-header">
              <div className="tv-col-header-gradient" style={{ background: `linear-gradient(to right, transparent, ${STATUS_COLORS[col]}, transparent)` }} />
              <div className="tv-col-header-icon" style={{ color: STATUS_COLORS[col] }}>
                {STATUS_ICONS[col]}
              </div>
              <span>{STATUS_LABELS[col]}</span>
              <span className="tv-col-count" style={{ background: `${STATUS_COLORS[col]}15`, color: STATUS_COLORS[col] }}>
                {grouped[col]?.length || 0}
              </span>
            </div>
            <motion.div
              className="tv-col-cards"
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              {(grouped[col] || []).map(t => {
                const isSelected = selectedIds.includes(t.id);
                return (
                <motion.div key={t.id} variants={fadeInUp}>
                  <div className={`tv-card ${isSelected ? 'tv-card-selected' : ''}`}>
                    <div className="tv-card-prio-stripe" style={{ background: PRIO_COLORS[t.priority] || 'var(--text-muted)' }} />
                    <div className="tv-card-top">
                      <input
                        type="checkbox"
                        className="tv-card-checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(t.id)}
                        aria-label={`Select task ${t.title}`}
                      />
                      {PRIO_ICONS[t.priority]}
                      <span className="tv-card-title">{t.title}</span>
                      <button className="tv-card-del" onClick={() => deleteTask.mutate(t.id)}><Trash2 size={10} /></button>
                    </div>
                    <div className="tv-card-meta">
                      {t.venture_id && <Badge size="sm">{t.venture_id}</Badge>}
                      {t.due_date && <span className="tv-card-due">{t.due_date}</span>}
                    </div>
                    <div className="tv-card-actions">
                      {col !== 'todo' && (
                        <button className="tv-move tv-move-back" onClick={() => updateTask.mutate({ id: t.id, status: STATUS_COLS[STATUS_COLS.indexOf(col) - 1] })}>
                          ← Back
                        </button>
                      )}
                      {col !== 'done' && (
                        <button className="tv-move tv-move-next" onClick={() => updateTask.mutate({ id: t.id, status: STATUS_COLS[STATUS_COLS.indexOf(col) + 1] })}>
                          Next →
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
                );
              })}
            </motion.div>
          </div>
        ))}
      </div>

      <BulkActionBar
        selectedIds={selectedIds}
        onClear={() => setSelectedIds([])}
        actions={bulkActions}
        totalCount={tasks.length}
        onSelectAll={() => setSelectedIds(tasks.map((t: Task) => t.id))}
        placement="floating"
        label={(n) => `${n} task${n === 1 ? '' : 's'} selected`}
      />

      {blocked.length > 0 && (
        <div className="tv-blocked">
          <h3 className="tv-blocked-title"><Ban size={12} /> Blocked ({blocked.length})</h3>
          {blocked.map(t => (
            <div key={t.id} className="tv-card blocked">
              <span className="tv-card-title">{t.title}</span>
              <button className="tv-move tv-move-next" onClick={() => updateTask.mutate({ id: t.id, status: 'todo' })}>Unblock →</button>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .tv-add { display:flex; gap:8px; padding:10px 20px; margin:0 20px; align-items:center; }

        .tv-board { flex:1; display:grid; grid-template-columns:repeat(4,1fr); gap:1px; background:var(--border); overflow:hidden; margin-top:8px; }
        .tv-col { background:var(--bg-deep); display:flex; flex-direction:column; overflow:hidden; }

        .tv-col-header { position:relative; display:flex; align-items:center; gap:6px; padding:10px 14px; font-size:11px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; flex-shrink:0; background:var(--bg-surface); }
        .tv-col-header-gradient { position:absolute; top:0; left:10%; right:10%; height:1px; }
        .tv-col-header-icon { display:flex; align-items:center; }
        .tv-col-count { margin-left:auto; font-size:10px; font-family:var(--font-mono); padding:1px 7px; border-radius:var(--radius-full); font-weight:700; }

        .tv-col-cards { flex:1; overflow-y:auto; padding:8px; display:flex; flex-direction:column; gap:6px; }

        .tv-card { position:relative; padding:12px 12px 12px 16px; display:flex; flex-direction:column; gap:6px; background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-md); transition:all 0.2s; overflow:hidden; cursor:default; }
        .tv-card:hover { border-color:var(--border-active); transform:translateY(-1px); box-shadow:0 4px 12px rgba(0,0,0,0.25); }
        .tv-card.blocked { border-color:rgba(239,68,68,0.25); background:rgba(239,68,68,0.03); }

        .tv-card-prio-stripe { position:absolute; top:0; left:0; width:3px; height:100%; border-radius:3px 0 0 3px; }

        .tv-card-selected { border-color: var(--cyan) !important; background: rgba(0, 240, 255, 0.04); box-shadow: 0 0 0 1px var(--cyan) inset; }
        .tv-card-checkbox { accent-color: var(--cyan); cursor: pointer; flex-shrink: 0; }
        .tv-card-top { display:flex; align-items:center; gap:6px; }
        .tv-card-title { flex:1; font-size:12px; font-weight:500; color:var(--text-primary); }
        .tv-card-del { opacity:0; color:var(--text-muted); padding:4px; border-radius:var(--radius-sm); transition:all 0.15s; cursor:pointer; background:none; border:none; }
        .tv-card:hover .tv-card-del { opacity:1; }
        .tv-card-del:hover { color:var(--error); background:rgba(239,68,68,0.1); }

        .tv-card-meta { display:flex; gap:6px; font-size:10px; color:var(--text-muted); align-items:center; }
        .tv-card-due { font-family:var(--font-mono); font-size:9px; }

        .tv-card-actions { display:flex; gap:4px; }
        .tv-move { font-size:9px; color:var(--text-muted); padding:3px 8px; border-radius:var(--radius-sm); transition:all 0.15s; cursor:pointer; background:none; border:1px solid transparent; }
        .tv-move:hover { background:var(--bg-elevated); color:var(--text-secondary); border-color:var(--border); }
        .tv-move-next:hover { color:var(--cyan); border-color:rgba(0,240,255,0.2); }
        .tv-move-back:hover { color:var(--text-secondary); }

        .tv-blocked { padding:10px 20px 16px; }
        .tv-blocked-title { font-size:11px; font-weight:600; color:var(--error); display:flex; align-items:center; gap:4px; margin-bottom:8px; }
      `}</style>
    </PageShell>
  );
}
