import { useState, useEffect, useCallback } from 'react';
import {
  ListTodo, Plus, Check, Trash2, RefreshCw, Calendar,
  ChevronDown, ChevronRight, AlertTriangle, Circle, CheckCircle2,
  Bot, Sparkles, ArrowUpDown, X,
} from 'lucide-react';
import {
  PageHeader, Button, GlassCard, Badge, Input, Skeleton, EmptyState,
} from '../components/ui';
import { useToast } from '../components/Toasts';

// ── Types ──

interface GoogleTask {
  id: string;
  title: string;
  notes?: string;
  due?: string;
  status: 'needsAction' | 'completed';
  updated: string;
}

interface TaskList {
  id: string;
  title: string;
}

// ── API ──

async function tasksApi(action: string, params: Record<string, unknown> = {}, method = 'GET') {
  const base = '/api/google-tasks';
  if (method === 'GET') {
    const qs = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])) }).toString();
    const res = await fetch(`${base}?${qs}`);
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `Tasks ${res.status}`); }
    return res.json();
  }
  const res = await fetch(base, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...params }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `Tasks ${res.status}`); }
  return res.json();
}

// ── Task Item ──

function TaskItem({ task, onComplete, onDelete }: {
  task: GoogleTask; onComplete: (id: string) => void; onDelete: (id: string) => void;
}) {
  const isCompleted = task.status === 'completed';
  const isOverdue = task.due && !isCompleted && new Date(task.due) < new Date();

  return (
    <div className={`gtask-item ${isCompleted ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`}>
      <button
        className="gtask-check"
        onClick={() => !isCompleted && onComplete(task.id)}
        title={isCompleted ? 'Completed' : 'Mark complete'}
      >
        {isCompleted ? <CheckCircle2 size={18} /> : <Circle size={18} />}
      </button>
      <div className="gtask-content">
        <div className="gtask-title">{task.title}</div>
        {task.notes && <div className="gtask-notes">{task.notes}</div>}
        {task.due && (
          <div className={`gtask-due ${isOverdue ? 'overdue-text' : ''}`}>
            <Calendar size={11} />
            {new Date(task.due).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        )}
      </div>
      <button className="gtask-delete" onClick={() => onDelete(task.id)} title="Delete">
        <Trash2 size={14} />
      </button>
    </div>
  );
}

// ── Main View ──

export default function GoogleTasksView() {
  const { addToast } = useToast();
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [activeList, setActiveList] = useState('@default');
  const [tasks, setTasks] = useState<GoogleTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [listsExpanded, setListsExpanded] = useState(true);
  const [aiPrioritizing, setAiPrioritizing] = useState(false);
  const [aiPriority, setAiPriority] = useState<string | null>(null);

  // AI: Prioritize tasks
  const handleAiPrioritize = async () => {
    if (tasks.length === 0) return;
    setAiPrioritizing(true);
    try {
      const taskList = tasks
        .filter(t => t.status === 'needsAction')
        .map(t => `- ${t.title}${t.due ? ` (due: ${new Date(t.due).toLocaleDateString()})` : ''}${t.notes ? ` — ${t.notes}` : ''}`)
        .join('\n');
      const res = await fetch('/api/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'gemini-generate',
          prompt: `You are a productivity expert. Prioritize these tasks by urgency and importance. Group them into: Critical (do today), Important (do this week), and Can Wait. Be concise.\n\nTasks:\n${taskList}`,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiPriority(data.content || null);
      }
    } catch { /* ignore */ }
    finally { setAiPrioritizing(false); }
  };

  // Load task lists
  useEffect(() => {
    tasksApi('list-tasklists').then(d => setTaskLists(d.items ?? [])).catch(() => {});
  }, []);

  // Load tasks
  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await tasksApi('list-tasks', { tasklistId: activeList, showCompleted: String(showCompleted) });
      setTasks(d.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [activeList, showCompleted]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  // Actions
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      await tasksApi('create-task', { tasklistId: activeList, title: newTaskTitle.trim() }, 'POST');
      setNewTaskTitle('');
      loadTasks();
      addToast({ type: 'success', message: 'Task created' });
    } catch (err) {
      addToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed' });
    }
  };

  const handleComplete = async (taskId: string) => {
    try {
      await tasksApi('complete-task', { tasklistId: activeList, taskId }, 'POST');
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed' } : t));
      addToast({ type: 'success', message: 'Task completed' });
    } catch (err) {
      addToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed' });
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      await tasksApi('delete-task', { tasklistId: activeList, taskId }, 'POST');
      setTasks(prev => prev.filter(t => t.id !== taskId));
      addToast({ type: 'success', message: 'Task deleted' });
    } catch (err) {
      addToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed' });
    }
  };

  const pendingTasks = tasks.filter(t => t.status === 'needsAction');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const overdueTasks = pendingTasks.filter(t => t.due && new Date(t.due) < new Date());

  return (
    <div className="gtasks-view">
      <PageHeader title="Google Tasks" subtitle={`${pendingTasks.length} pending${overdueTasks.length ? ` · ${overdueTasks.length} overdue` : ''}`}>
        <button className="gtask-ai-btn" onClick={handleAiPrioritize} disabled={aiPrioritizing || pendingTasks.length === 0}>
          <Sparkles size={14} /> {aiPrioritizing ? 'Analyzing...' : 'AI Prioritize'}
        </button>
        <button className="gtask-icon-btn" onClick={loadTasks} title="Refresh"><RefreshCw size={16} /></button>
      </PageHeader>

      <div className="gtasks-layout">
        {/* Sidebar */}
        <div className="gtasks-sidebar">
          <button className="gtasks-lists-toggle" onClick={() => setListsExpanded(!listsExpanded)}>
            {listsExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            <span>Task Lists</span>
          </button>
          {listsExpanded && taskLists.map(l => (
            <button
              key={l.id}
              className={`gtasks-list-item ${activeList === l.id ? 'active' : ''}`}
              onClick={() => setActiveList(l.id)}
            >
              <ListTodo size={14} />
              <span>{l.title}</span>
            </button>
          ))}

          <div className="gtasks-sidebar-stats">
            <div className="gtask-stat"><span className="gtask-stat-val">{pendingTasks.length}</span><span className="gtask-stat-lbl">Pending</span></div>
            <div className="gtask-stat"><span className="gtask-stat-val">{overdueTasks.length}</span><span className="gtask-stat-lbl">Overdue</span></div>
            <div className="gtask-stat"><span className="gtask-stat-val">{completedTasks.length}</span><span className="gtask-stat-lbl">Done</span></div>
          </div>

          <label className="gtasks-toggle">
            <input type="checkbox" checked={showCompleted} onChange={e => setShowCompleted(e.target.checked)} />
            <span>Show completed</span>
          </label>
        </div>

        {/* Main */}
        <div className="gtasks-main">
          <form className="gtasks-add" onSubmit={handleCreate}>
            <Plus size={14} />
            <input type="text" placeholder="Add a task..." value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} />
          </form>

          {aiPriority && (
            <div className="gtasks-ai-result">
              <div className="gtasks-ai-header">
                <Sparkles size={12} /> <span>NAOS Priority Analysis</span>
                <button className="gtask-icon-btn" onClick={() => setAiPriority(null)} style={{ width: 20, height: 20 }}><X size={12} /></button>
              </div>
              <div className="gtasks-ai-body">{aiPriority}</div>
            </div>
          )}

          {error && <div className="gtasks-error"><AlertTriangle size={14} />{error}</div>}

          {loading ? (
            <div className="gtasks-loading">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} style={{ height: 48, borderRadius: 8, marginBottom: 4 }} />)}
            </div>
          ) : tasks.length === 0 ? (
            <EmptyState icon={<ListTodo size={32} />} title="No tasks" description="Add a task to get started." />
          ) : (
            <div className="gtasks-list">
              {pendingTasks.map(t => <TaskItem key={t.id} task={t} onComplete={handleComplete} onDelete={handleDelete} />)}
              {showCompleted && completedTasks.length > 0 && (
                <>
                  <div className="gtasks-divider">Completed ({completedTasks.length})</div>
                  {completedTasks.map(t => <TaskItem key={t.id} task={t} onComplete={handleComplete} onDelete={handleDelete} />)}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .gtasks-view { height: 100%; display: flex; flex-direction: column; overflow: hidden; }
        .gtasks-layout { flex: 1; display: grid; grid-template-columns: 220px 1fr; gap: 1px; background: var(--border); overflow: hidden; }
        .gtasks-sidebar { background: var(--bg-surface); padding: var(--space-md); overflow-y: auto; display: flex; flex-direction: column; gap: var(--space-sm); }
        .gtasks-lists-toggle { display: flex; align-items: center; gap: 6px; padding: 6px 0; border: none; background: transparent; color: var(--text-muted); cursor: pointer; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
        .gtasks-list-item {
          display: flex; align-items: center; gap: var(--space-sm); padding: 8px 12px;
          border: none; background: transparent; color: var(--text-secondary); cursor: pointer;
          border-radius: var(--radius-sm); font-size: 13px; text-align: left; width: 100%;
        }
        .gtasks-list-item:hover { background: var(--bg-hover); color: var(--text-primary); }
        .gtasks-list-item.active { background: rgba(0, 240, 255, 0.08); color: var(--cyan); }
        .gtasks-sidebar-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-xs); margin-top: auto; padding-top: var(--space-md); border-top: 1px solid var(--border); }
        .gtask-stat { text-align: center; }
        .gtask-stat-val { display: block; font-size: 18px; font-weight: 700; color: var(--cyan); }
        .gtask-stat-lbl { font-size: 10px; color: var(--text-muted); }
        .gtasks-toggle { display: flex; align-items: center; gap: var(--space-sm); font-size: 12px; color: var(--text-muted); cursor: pointer; }
        .gtasks-toggle input { accent-color: var(--cyan); }
        .gtasks-main { background: var(--bg-card); overflow-y: auto; display: flex; flex-direction: column; }
        .gtasks-add {
          display: flex; align-items: center; gap: var(--space-sm); padding: var(--space-sm) var(--space-md);
          border-bottom: 1px solid var(--border); color: var(--text-muted);
        }
        .gtasks-add input { flex: 1; background: transparent; border: none; color: var(--text-primary); font-size: 14px; outline: none; }
        .gtasks-add input::placeholder { color: var(--text-muted); }
        .gtasks-error { display: flex; align-items: center; gap: var(--space-sm); padding: var(--space-md); color: var(--danger, #ef4444); font-size: 13px; }
        .gtasks-loading { padding: var(--space-md); display: flex; flex-direction: column; gap: 4px; }
        .gtasks-list { flex: 1; padding: var(--space-xs); }
        .gtasks-divider { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; padding: var(--space-md) var(--space-md) var(--space-xs); }
        .gtask-item {
          display: flex; align-items: flex-start; gap: var(--space-sm); padding: var(--space-sm) var(--space-md);
          border-radius: var(--radius-sm); transition: var(--transition-fast);
        }
        .gtask-item:hover { background: var(--bg-hover); }
        .gtask-item.completed { opacity: 0.5; }
        .gtask-item.overdue .gtask-title { color: var(--danger, #ef4444); }
        .gtask-check { border: none; background: transparent; cursor: pointer; color: var(--text-muted); padding: 2px; flex-shrink: 0; }
        .gtask-item:not(.completed) .gtask-check:hover { color: var(--cyan); }
        .gtask-item.completed .gtask-check { color: var(--cyan); }
        .gtask-content { flex: 1; min-width: 0; }
        .gtask-title { font-size: 14px; color: var(--text-primary); }
        .gtask-item.completed .gtask-title { text-decoration: line-through; color: var(--text-muted); }
        .gtask-notes { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
        .gtask-due { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--text-muted); margin-top: 4px; }
        .gtask-due.overdue-text { color: var(--danger, #ef4444); }
        .gtask-delete { border: none; background: transparent; cursor: pointer; color: var(--text-muted); padding: 4px; opacity: 0; transition: var(--transition-fast); }
        .gtask-item:hover .gtask-delete { opacity: 1; }
        .gtask-delete:hover { color: var(--danger, #ef4444); }
        .gtask-icon-btn { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border: none; background: transparent; color: var(--text-secondary); cursor: pointer; border-radius: var(--radius-sm); }
        .gtask-icon-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
        .gtask-ai-btn {
          display: flex; align-items: center; gap: 4px; padding: 5px 10px;
          border: 1px solid rgba(139, 92, 246, 0.3); background: rgba(139, 92, 246, 0.06);
          color: var(--purple, #8B5CF6); cursor: pointer; border-radius: var(--radius-sm);
          font-size: 12px; transition: var(--transition-fast);
        }
        .gtask-ai-btn:hover { background: rgba(139, 92, 246, 0.12); }
        .gtask-ai-btn:disabled { opacity: 0.5; cursor: default; }
        .gtasks-ai-result {
          margin: var(--space-sm); background: rgba(139, 92, 246, 0.04);
          border: 1px solid rgba(139, 92, 246, 0.15); border-radius: var(--radius-sm); padding: var(--space-sm);
        }
        .gtasks-ai-header {
          display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--purple, #8B5CF6);
          font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: var(--space-xs);
        }
        .gtasks-ai-body { font-size: 13px; color: var(--text-secondary); line-height: 1.6; white-space: pre-wrap; }
      `}</style>
    </div>
  );
}
