import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function msApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext) {
  const q = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])) }).toString();
  const r = await ctx.fetch(`/api/microsoft-graph?${q}`);
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Entra error'); }
  return r.json();
}

const listUsers: KitToolHandler = async (input, ctx) => {
  const d = await msApi('list-users', { top: input.limit ?? 25, search: input.search, filter: input.filter }, ctx);
  const users = d.value ?? [];
  const lines = users.map((u: { displayName: string; mail: string; jobTitle: string; department: string }) =>
    `- **${u.displayName}** — ${u.mail || 'no email'} (${u.jobTitle || ''} / ${u.department || ''})`);
  return { success: true, data: users, displayMarkdown: `## Users (${users.length})\n\n${lines.join('\n')}` };
};

const getUser: KitToolHandler = async (input, ctx) => {
  const d = await msApi('get-user', { id: input.id }, ctx);
  return { success: true, data: d, displayMarkdown: `## ${d.displayName}\n\n- **Email:** ${d.mail}\n- **Title:** ${d.jobTitle}\n- **Dept:** ${d.department}\n- **Office:** ${d.officeLocation}` };
};

const listGroups: KitToolHandler = async (input, ctx) => {
  const d = await msApi('list-groups', { top: input.limit ?? 25 }, ctx);
  const groups = d.value ?? [];
  const lines = groups.map((g: { displayName: string; description: string; groupTypes: string[]; mailEnabled: boolean }) =>
    `- **${g.displayName}** — ${g.description?.slice(0, 60) || ''} (${g.groupTypes?.join(', ') || 'security'})`);
  return { success: true, data: groups, displayMarkdown: `## Groups (${groups.length})\n\n${lines.join('\n')}` };
};

const groupMembers: KitToolHandler = async (input, ctx) => {
  const d = await msApi('group-members', { groupId: input.groupId, top: input.limit ?? 50 }, ctx);
  const members = d.value ?? [];
  const lines = members.map((m: { displayName: string; mail: string; jobTitle: string }) =>
    `- **${m.displayName}** — ${m.mail || ''} (${m.jobTitle || ''})`);
  return { success: true, data: members, displayMarkdown: `## Members (${members.length})\n\n${lines.join('\n')}` };
};

const listApps: KitToolHandler = async (_i, ctx) => {
  const d = await msApi('list-apps', {}, ctx);
  const apps = d.value ?? [];
  const lines = apps.map((a: { displayName: string; appId: string; createdDateTime: string }) =>
    `- **${a.displayName}** (\`${a.appId?.slice(0, 8)}...\`) — ${new Date(a.createdDateTime).toLocaleDateString()}`);
  return { success: true, data: apps, displayMarkdown: `## App Registrations (${apps.length})\n\n${lines.join('\n')}` };
};

const orgInfo: KitToolHandler = async (_i, ctx) => {
  const d = await msApi('org-info', {}, ctx);
  const org = d.value?.[0] || d;
  const domains = org.verifiedDomains?.map((d: { name: string; isDefault: boolean }) => `${d.name}${d.isDefault ? ' (default)' : ''}`).join(', ') || 'N/A';
  return { success: true, data: org, displayMarkdown: `## Organization\n\n- **Name:** ${org.displayName}\n- **Domains:** ${domains}\n- **Location:** ${org.city || ''}, ${org.state || ''}, ${org.country || ''}` };
};

const myProfile: KitToolHandler = async (_i, ctx) => {
  const d = await msApi('me', {}, ctx);
  return { success: true, data: d, displayMarkdown: `## My Profile\n\n- **Name:** ${d.displayName}\n- **Email:** ${d.mail}\n- **Title:** ${d.jobTitle}\n- **Dept:** ${d.department}\n- **Office:** ${d.officeLocation}\n- **Phone:** ${d.mobilePhone || d.businessPhones?.[0] || 'N/A'}` };
};

const plannerTasks: KitToolHandler = async (_i, ctx) => {
  const d = await msApi('my-planner-tasks', {}, ctx);
  const tasks = d.value ?? [];
  const lines = tasks.map((t: { title: string; percentComplete: number; dueDateTime: string; priority: number }) =>
    `- **${t.title}** — ${t.percentComplete}% complete${t.dueDateTime ? ` — due ${new Date(t.dueDateTime).toLocaleDateString()}` : ''} (P${t.priority})`);
  return { success: true, data: tasks, displayMarkdown: `## My Planner Tasks (${tasks.length})\n\n${lines.join('\n')}` };
};

const todoLists: KitToolHandler = async (_i, ctx) => {
  const d = await msApi('todo-lists', {}, ctx);
  const lists = d.value ?? [];
  const lines = lists.map((l: { displayName: string; id: string }) => `- **${l.displayName}** (\`${l.id.slice(0, 8)}...\`)`);
  return { success: true, data: lists, displayMarkdown: `## To Do Lists (${lists.length})\n\n${lines.join('\n')}` };
};

const msOverview: KitToolHandler = async (_i, ctx) => {
  const d = await msApi('overview', {}, ctx);
  return { success: true, data: d, displayMarkdown: `## Microsoft 365\n\n- **User:** ${d.user} (${d.email})\n- **Title:** ${d.title}\n- **Teams:** ${d.teams}\n- **Inbox Unread:** ${d.inbox_unread}\n- **Inbox Total:** ${d.inbox_total}` };
};

export const manifest: KitManifest = {
  id: 'microsoft-entra', name: 'Microsoft 365 / Entra', version: '1.0.0',
  description: 'Microsoft Entra ID — users, groups, apps, organization info, Planner tasks, To Do lists, and M365 overview.',
  author: 'MCV', capabilities: ['network', 'credentials'], runtime: 'inline', ventureScope: '*',
  instructions: 'Use entra tools for Microsoft 365 directory: users, groups, org info, app registrations, Planner tasks, and To Do lists.',
  tools: [
    { name: 'ms365_users', description: 'List or search Azure AD / Entra users.', input_schema: { type: 'object', properties: { search: { type: 'string' }, filter: { type: 'string' }, limit: { type: 'number' } } } },
    { name: 'ms365_user', description: 'Get user details by ID.', input_schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
    { name: 'ms365_groups', description: 'List Azure AD groups.', input_schema: { type: 'object', properties: { limit: { type: 'number' } } } },
    { name: 'ms365_group_members', description: 'List members of a group.', input_schema: { type: 'object', properties: { groupId: { type: 'string' }, limit: { type: 'number' } }, required: ['groupId'] } },
    { name: 'ms365_apps', description: 'List app registrations.', input_schema: { type: 'object', properties: {} } },
    { name: 'ms365_org', description: 'Get organization info (name, domains, location).', input_schema: { type: 'object', properties: {} } },
    { name: 'ms365_profile', description: 'Get my Microsoft 365 profile.', input_schema: { type: 'object', properties: {} } },
    { name: 'ms365_planner_tasks', description: 'List my Planner tasks.', input_schema: { type: 'object', properties: {} } },
    { name: 'ms365_todo_lists', description: 'List my To Do lists.', input_schema: { type: 'object', properties: {} } },
    { name: 'ms365_overview', description: 'Microsoft 365 overview: profile, teams, inbox.', input_schema: { type: 'object', properties: {} } },
  ],
};
export const handlers: Record<string, KitToolHandler> = {
  ms365_users: listUsers, ms365_user: getUser, ms365_groups: listGroups, ms365_group_members: groupMembers,
  ms365_apps: listApps, ms365_org: orgInfo, ms365_profile: myProfile, ms365_planner_tasks: plannerTasks,
  ms365_todo_lists: todoLists, ms365_overview: msOverview,
};
