import { create } from 'zustand';

export type AgentStatus = 'idle' | 'thinking' | 'executing' | 'done' | 'error';

export interface AgentTask {
  id: string;
  agentType: 'queen' | 'ralph' | 'scout';
  name: string;
  description: string;
  status: AgentStatus;
  progress: number; // 0-100
  result?: string;
  error?: string;
  ventureId?: string;
  startedAt: string;
  completedAt?: string;
}

interface AgentsState {
  tasks: AgentTask[];
  activeTaskCount: number;

  addTask: (task: Omit<AgentTask, 'id' | 'startedAt' | 'progress'>) => string;
  updateTask: (id: string, updates: Partial<AgentTask>) => void;
  completeTask: (id: string, result: string) => void;
  failTask: (id: string, error: string) => void;
  removeTask: (id: string) => void;
  clearCompleted: () => void;
}

export const useAgentsStore = create<AgentsState>()((set) => ({
  tasks: [],
  activeTaskCount: 0,

  addTask: (task) => {
    const id = crypto.randomUUID();
    set((s) => {
      const newTask: AgentTask = {
        ...task,
        id,
        progress: 0,
        startedAt: new Date().toISOString(),
      };
      const updated = [newTask, ...s.tasks];
      return { tasks: updated, activeTaskCount: updated.filter(t => t.status !== 'done' && t.status !== 'error').length };
    });
    return id;
  },

  updateTask: (id, updates) =>
    set((s) => {
      const updated = s.tasks.map(t => t.id === id ? { ...t, ...updates } : t);
      return { tasks: updated, activeTaskCount: updated.filter(t => t.status !== 'done' && t.status !== 'error').length };
    }),

  completeTask: (id, result) =>
    set((s) => {
      const updated = s.tasks.map(t => t.id === id ? { ...t, status: 'done' as const, result, progress: 100, completedAt: new Date().toISOString() } : t);
      return { tasks: updated, activeTaskCount: updated.filter(t => t.status !== 'done' && t.status !== 'error').length };
    }),

  failTask: (id, error) =>
    set((s) => {
      const updated = s.tasks.map(t => t.id === id ? { ...t, status: 'error' as const, error, completedAt: new Date().toISOString() } : t);
      return { tasks: updated, activeTaskCount: updated.filter(t => t.status !== 'done' && t.status !== 'error').length };
    }),

  removeTask: (id) =>
    set((s) => {
      const updated = s.tasks.filter(t => t.id !== id);
      return { tasks: updated, activeTaskCount: updated.filter(t => t.status !== 'done' && t.status !== 'error').length };
    }),

  clearCompleted: () =>
    set((s) => {
      const kept = s.tasks.filter(t => t.status !== 'done' && t.status !== 'error');
      return { tasks: kept, activeTaskCount: kept.length };
    }),
}));
