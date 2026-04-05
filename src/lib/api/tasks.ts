import { apiPost } from './client';
import type { Task, TaskStats } from '../schemas/tasks';

const EP = '/api/tasks';

export async function listTasks(ventureId?: string, status?: string) {
  return apiPost<{ tasks: Task[] }>(EP, { action: 'list', venture_id: ventureId, status });
}

export async function createTask(task: Partial<Task>) {
  return apiPost<{ task: Task }>(EP, { action: 'create', task });
}

export async function updateTask(id: string, updates: Partial<Task>) {
  return apiPost<{ task: Task }>(EP, { action: 'update', id, ...updates });
}

export async function deleteTask(id: string) {
  return apiPost<{ success: boolean }>(EP, { action: 'delete', id });
}

export async function getTaskStats() {
  return apiPost<TaskStats>(EP, { action: 'stats' });
}
