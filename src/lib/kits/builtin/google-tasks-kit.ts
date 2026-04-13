import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function tasksApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext, method = 'GET') {
  if (method === 'GET') {
    const q = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])) }).toString();
    const r = await ctx.fetch(`/api/google-tasks?${q}`);
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Tasks error'); }
    return r.json();
  }
  const r = await ctx.fetch('/api/google-tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...params }) });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Tasks error'); }
  return r.json();
}

const listTasks: KitToolHandler = async (input, ctx) => {
  const d = await tasksApi('list-tasks', { showCompleted: input.showCompleted ?? 'false' }, ctx);
  const tasks = d.items ?? [];
  const lines = tasks.map((t: { title: string; due: string; status: string }) =>
    `- ${t.status === 'completed' ? '~~' : ''}**${t.title}**${t.status === 'completed' ? '~~' : ''}${t.due ? ` (due: ${new Date(t.due).toLocaleDateString()})` : ''}`);
  return { success: true, data: tasks, displayMarkdown: `## Tasks (${tasks.length})\n\n${lines.join('\n') || 'No tasks.'}` };
};

const createTask: KitToolHandler = async (input, ctx) => {
  const d = await tasksApi('create-task', { title: input.title, notes: input.notes, due: input.due }, ctx, 'POST');
  return { success: true, data: d, displayMarkdown: `Task created: **${d.title}**${d.due ? ` (due: ${new Date(d.due).toLocaleDateString()})` : ''}` };
};

const completeTask: KitToolHandler = async (input, ctx) => {
  await tasksApi('complete-task', { taskId: input.taskId }, ctx, 'POST');
  return { success: true, data: null, displayMarkdown: `Task marked as completed.` };
};

const deleteTask: KitToolHandler = async (input, ctx) => {
  await tasksApi('delete-task', { taskId: input.taskId }, ctx, 'POST');
  return { success: true, data: null, displayMarkdown: `Task deleted.` };
};

const tasksOverview: KitToolHandler = async (_i, ctx) => {
  const d = await tasksApi('overview', {}, ctx);
  return { success: true, data: d, displayMarkdown: `## Tasks Overview\n\n- **Lists:** ${d.list_count}\n- **Pending:** ${d.pending_tasks}\n- **Overdue:** ${d.overdue_tasks}\n- **Next due:** ${d.next_due || 'None'}` };
};

const listTasklists: KitToolHandler = async (_i, ctx) => {
  const d = await tasksApi('list-tasklists', {}, ctx);
  const lists = d.items ?? [];
  const lines = lists.map((l: { title: string; id: string }) => `- **${l.title}** (\`${l.id}\`)`);
  return { success: true, data: lists, displayMarkdown: `## Task Lists (${lists.length})\n\n${lines.join('\n')}` };
};

export const manifest: KitManifest = {
  id: 'google-tasks', name: 'Google Tasks', version: '1.0.0',
  description: 'Google Tasks — list, create, complete, delete tasks and task lists.',
  author: 'MCV', capabilities: ['network', 'credentials'], runtime: 'inline', ventureScope: '*',
  instructions: 'Use tasks tools for managing Google Tasks. Create tasks, list pending items, mark complete, and check overview.',
  tools: [
    { name: 'gtasks_list', description: 'List all tasks.', input_schema: { type: 'object', properties: { showCompleted: { type: 'string', description: 'true/false' } } } },
    { name: 'gtasks_create', description: 'Create a new task.', input_schema: { type: 'object', properties: { title: { type: 'string' }, notes: { type: 'string' }, due: { type: 'string', description: 'ISO date' } }, required: ['title'] } },
    { name: 'gtasks_complete', description: 'Mark a task as completed.', input_schema: { type: 'object', properties: { taskId: { type: 'string' } }, required: ['taskId'] } },
    { name: 'gtasks_delete', description: 'Delete a task.', input_schema: { type: 'object', properties: { taskId: { type: 'string' } }, required: ['taskId'] } },
    { name: 'gtasks_lists', description: 'List all task lists.', input_schema: { type: 'object', properties: {} } },
    { name: 'gtasks_overview', description: 'Tasks summary — lists, pending, overdue counts.', input_schema: { type: 'object', properties: {} } },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  gtasks_list: listTasks,
  gtasks_create: createTask,
  gtasks_complete: completeTask,
  gtasks_delete: deleteTask,
  gtasks_lists: listTasklists,
  gtasks_overview: tasksOverview,
};
