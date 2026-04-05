import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function postJson(url: string, body: Record<string, unknown>, ctx: KitExecutionContext) {
  const res = await ctx.fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `API error: ${res.status}`);
  }
  return res.json();
}


interface TaskRecord {
  title: string;
  id?: string;
  status: string;
  venture?: string;
  venture_id?: string;
  completed_at?: string;
}

// ---------------------------------------------------------------------------
// Tool Handlers
// ---------------------------------------------------------------------------

const createTask: KitToolHandler = async (input, ctx) => {
  const title = input.title as string;
  const status = (input.status as string) || 'todo';
  const venture = (input.venture as string) || ctx.ventureId;

  const data = await postJson('/api/tasks', {
    action: 'create',
    task: { title, status, venture_id: venture },
  }, ctx);

  const t = data.task;
  return {
    success: true,
    data: t,
    displayMarkdown: `**Task Created:** ${t?.title || title} — \`${t?.status || status}\`${t?.id ? ' `' + t.id.slice(0, 8) + '`' : ''}`,
  };
};

const listTasks: KitToolHandler = async (input, ctx) => {
  const status = input.status as string | undefined;
  const venture = (input.venture as string) || undefined;

  const data = await postJson('/api/tasks', {
    action: 'list',
    status,
    venture_id: venture,
  }, ctx);

  const tasks: TaskRecord[] = data.tasks || [];
  if (tasks.length === 0) {
    return { success: true, data: [], displayMarkdown: 'No tasks found.' };
  }

  // Group by status
  const grouped: Record<string, TaskRecord[]> = {};
  for (const t of tasks) {
    const key = t.status || 'Other';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(t);
  }

  const statusOrder = ['todo', 'in-progress', 'in_progress', 'review', 'blocked', 'done'];
  const labels: Record<string, string> = {
    'todo': 'To Do', 'in-progress': 'In Progress', 'in_progress': 'In Progress',
    'review': 'Review', 'blocked': 'Blocked', 'done': 'Done',
  };

  const sorted = Object.entries(grouped).sort(([a], [b]) => {
    const ai = statusOrder.indexOf(a);
    const bi = statusOrder.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  let md = '## Tasks\n\n';
  for (const [s, items] of sorted) {
    const label = labels[s] || s.charAt(0).toUpperCase() + s.slice(1);
    md += `### ${label} (${items.length})\n\n`;
    for (const t of items) {
      const done = s === 'done';
      const title = done ? `~~${t.title}~~` : `**${t.title}**`;
      md += `- ${title}${t.venture_id ? ' · ' + t.venture_id : ''}${t.id ? ' `' + t.id.slice(0, 8) + '`' : ''}\n`;
    }
    md += '\n';
  }

  return { success: true, data: tasks, displayMarkdown: md };
};

const updateTask: KitToolHandler = async (input, ctx) => {
  const id = input.id as string;
  const updates: Record<string, unknown> = {};
  if (input.status) updates.status = input.status;
  if (input.title) updates.title = input.title;

  const data = await postJson('/api/tasks', {
    action: 'update',
    id,
    ...updates,
  }, ctx);

  const t = data.task;
  return {
    success: true,
    data: t,
    displayMarkdown: `**Task Updated:** ${t?.title || id} — \`${t?.status}\``,
  };
};

// ---------------------------------------------------------------------------
// Manifest & Export
// ---------------------------------------------------------------------------

export const manifest: KitManifest = {
  id: 'task-manager',
  name: 'Task Manager',
  version: '1.0.0',
  description: 'Create, list, and update tasks. Tasks can be filtered by status or venture.',
  author: 'MCV',
  capabilities: ['network'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: 'Use these tools when the user asks to create tasks, view their task list, or update task statuses.',
  tools: [
    {
      name: 'create_task',
      description: 'Create a new task with a title, optional status (todo/in-progress/done), and optional venture scope.',
      input_schema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'The task title' },
          status: { type: 'string', description: 'Task status: todo, in-progress, review, blocked, or done. Defaults to todo.' },
          venture: { type: 'string', description: 'Venture slug to scope the task to (e.g. "betedge", "futurestate")' },
        },
        required: ['title'],
      },
    },
    {
      name: 'list_tasks',
      description: 'List tasks, optionally filtered by status or venture. Returns tasks grouped by status.',
      input_schema: {
        type: 'object',
        properties: {
          status: { type: 'string', description: 'Filter by status: todo, in-progress, review, blocked, or done' },
          venture: { type: 'string', description: 'Filter by venture slug' },
        },
      },
    },
    {
      name: 'update_task',
      description: 'Update a task\'s status or title by its ID.',
      input_schema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'The task UUID' },
          status: { type: 'string', description: 'New status: todo, in-progress, review, blocked, or done' },
          title: { type: 'string', description: 'New title for the task' },
        },
        required: ['id'],
      },
    },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  create_task: createTask,
  list_tasks: listTasks,
  update_task: updateTask,
};
