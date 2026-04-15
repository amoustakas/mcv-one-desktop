import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function linearApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext) {
  const isRead = ['list-teams', 'list-issues', 'get-issue', 'list-projects', 'list-cycles', 'list-labels', 'list-states', 'list-users', 'me', 'overview'].includes(action);
  if (isRead) {
    const query = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])) }).toString();
    const res = await ctx.fetch(`/api/linear?${query}`);
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `Linear ${res.status}`); }
    return res.json();
  }
  const res = await ctx.fetch('/api/linear', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...params }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `Linear ${res.status}`); }
  return res.json();
}

const listIssues: KitToolHandler = async (input, ctx) => {
  const data = await linearApi('list-issues', { teamId: input.teamId, limit: input.limit ?? 15, status: input.status }, ctx);
  const issues = data.issues?.nodes ?? [];
  const lines = issues.map((i: { identifier: string; title: string; state: { name: string }; assignee: { name: string } | null; priorityLabel: string }) =>
    `- **${i.identifier}** ${i.title} — ${i.state?.name} (${i.priorityLabel})${i.assignee ? ` → ${i.assignee.name}` : ''}`);
  return { success: true, data: issues, displayMarkdown: `## Issues (${issues.length})\n\n${lines.join('\n')}` };
};

const getIssue: KitToolHandler = async (input, ctx) => {
  const data = await linearApi('get-issue', { id: input.id }, ctx);
  const i = data.issue;
  if (!i) return { success: false, error: 'Issue not found' };
  let md = `## ${i.identifier}: ${i.title}\n\n**State:** ${i.state?.name} | **Priority:** ${i.priorityLabel} | **Assignee:** ${i.assignee?.name || 'Unassigned'}`;
  if (i.project) md += `\n**Project:** ${i.project.name}`;
  if (i.cycle) md += ` | **Cycle:** ${i.cycle.name}`;
  if (i.description) md += `\n\n${i.description.slice(0, 500)}`;
  const comments = i.comments?.nodes ?? [];
  if (comments.length > 0) {
    md += `\n\n### Comments (${comments.length})\n`;
    comments.slice(0, 5).forEach((c: { user: { name: string }; body: string }) => { md += `\n- **${c.user?.name}:** ${c.body.slice(0, 100)}`; });
  }
  return { success: true, data: i, displayMarkdown: md };
};

const createIssue: KitToolHandler = async (input, ctx) => {
  const data = await linearApi('create-issue', { title: input.title, description: input.description, teamId: input.teamId, priority: input.priority }, ctx);
  const issue = data.issueCreate?.issue;
  return { success: !!data.issueCreate?.success, data: issue, displayMarkdown: issue ? `Issue created: **${issue.identifier}** — ${issue.title}` : 'Failed to create issue' };
};

const updateIssue: KitToolHandler = async (input, ctx) => {
  const data = await linearApi('update-issue', { id: input.id, title: input.title, stateId: input.stateId, assigneeId: input.assigneeId, priority: input.priority }, ctx);
  const issue = data.issueUpdate?.issue;
  return { success: !!data.issueUpdate?.success, data: issue, displayMarkdown: issue ? `Issue updated: **${issue.identifier}** — ${issue.title} (${issue.state?.name})` : 'Failed to update issue' };
};

const listProjects: KitToolHandler = async (input, ctx) => {
  const data = await linearApi('list-projects', { limit: input.limit ?? 10 }, ctx);
  const projects = data.projects?.nodes ?? [];
  const lines = projects.map((p: { name: string; state: string; progress: number }) =>
    `- **${p.name}** — ${p.state} (${Math.round(p.progress * 100)}% complete)`);
  return { success: true, data: projects, displayMarkdown: `## Projects (${projects.length})\n\n${lines.join('\n')}` };
};

const listTeams: KitToolHandler = async (_input, ctx) => {
  const data = await linearApi('list-teams', {}, ctx);
  const teams = data.teams?.nodes ?? [];
  const lines = teams.map((t: { name: string; key: string }) => `- **${t.name}** (\`${t.key}\`)`);
  return { success: true, data: teams, displayMarkdown: `## Teams (${teams.length})\n\n${lines.join('\n')}` };
};

const createComment: KitToolHandler = async (input, ctx) => {
  const data = await linearApi('create-comment', { issueId: input.issueId, body: input.body }, ctx);
  return { success: !!data.commentCreate?.success, data, displayMarkdown: `Comment added to issue.` };
};

const linearOverview: KitToolHandler = async (_input, ctx) => {
  const data = await linearApi('overview', {}, ctx);
  let md = `## Linear Overview\n\n**User:** ${data.viewer?.name} (${data.viewer?.organization?.name})`;
  const teams = data.teams?.nodes ?? [];
  md += `\n**Teams:** ${teams.map((t: { name: string }) => t.name).join(', ')}`;
  const issues = data.issues?.nodes ?? [];
  if (issues.length > 0) {
    md += '\n\n### Recent Issues\n';
    issues.forEach((i: { identifier: string; title: string; state: { name: string } }) => { md += `\n- **${i.identifier}** ${i.title} — ${i.state?.name}`; });
  }
  return { success: true, data, displayMarkdown: md };
};

const deleteIssue: KitToolHandler = async (input, ctx) => {
  const d = await linearApi('delete-issue', { id: input.id }, ctx);
  return { success: true, data: d, displayMarkdown: `Issue \`${input.id}\` deleted.` };
};

const archiveIssue: KitToolHandler = async (input, ctx) => {
  const d = await linearApi('archive-issue', { id: input.id }, ctx);
  return { success: true, data: d, displayMarkdown: `Issue \`${input.id}\` archived.` };
};

const createProject: KitToolHandler = async (input, ctx) => {
  const d = await linearApi('create-project', { name: input.name, teamIds: input.teamIds, description: input.description }, ctx);
  const project = d.projectCreate?.project;
  return { success: !!d.projectCreate?.success, data: project, displayMarkdown: project ? `Project created: **${project.name}**` : 'Failed to create project' };
};

const updateProject: KitToolHandler = async (input, ctx) => {
  const d = await linearApi('update-project', { id: input.id, name: input.name, state: input.state }, ctx);
  const project = d.projectUpdate?.project;
  return { success: !!d.projectUpdate?.success, data: project, displayMarkdown: project ? `Project updated: **${project.name}** (${project.state})` : 'Failed to update project' };
};

const createCycle: KitToolHandler = async (input, ctx) => {
  const d = await linearApi('create-cycle', { teamId: input.teamId, name: input.name, startsAt: input.startsAt, endsAt: input.endsAt }, ctx);
  const cycle = d.cycleCreate?.cycle;
  return { success: !!d.cycleCreate?.success, data: cycle, displayMarkdown: cycle ? `Cycle created: **${cycle.name}**` : 'Failed to create cycle' };
};

const createLabel: KitToolHandler = async (input, ctx) => {
  const d = await linearApi('create-label', { name: input.name, color: input.color, teamId: input.teamId }, ctx);
  const label = d.issueLabelCreate?.issueLabel;
  return { success: !!d.issueLabelCreate?.success, data: label, displayMarkdown: label ? `Label created: **${label.name}**` : 'Failed to create label' };
};

const createIssueRelation: KitToolHandler = async (input, ctx) => {
  const d = await linearApi('create-issue-relation', { issueId: input.issueId, relatedIssueId: input.relatedIssueId, type: input.type }, ctx);
  return { success: !!d.issueRelationCreate?.success, data: d, displayMarkdown: `Relation created: \`${input.issueId}\` ${input.type} \`${input.relatedIssueId}\`` };
};

export const manifest: KitManifest = {
  id: 'linear-pm',
  name: 'Linear Project Management',
  version: '2.0.0',
  description: 'Linear issue tracking — issues, projects, teams, cycles, labels, and comments.',
  author: 'MCV',
  capabilities: ['network', 'credentials'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: 'Use linear tools for issue tracking, project management, sprint planning, and team coordination.',
  tools: [
    { name: 'linear_list_issues', description: 'List issues. Optionally filter by team and status.', input_schema: { type: 'object', properties: { teamId: { type: 'string' }, status: { type: 'string', description: 'e.g. In Progress, Done, Todo' }, limit: { type: 'number' } } } },
    { name: 'linear_get_issue', description: 'Get full issue details including comments.', input_schema: { type: 'object', properties: { id: { type: 'string', description: 'Issue UUID or shorthand (PROJ-123)' } }, required: ['id'] } },
    { name: 'linear_create_issue', description: 'Create a new issue.', input_schema: { type: 'object', properties: { title: { type: 'string' }, description: { type: 'string' }, teamId: { type: 'string' }, priority: { type: 'number', description: '0=none, 1=urgent, 2=high, 3=medium, 4=low' } }, required: ['title', 'teamId'] } },
    { name: 'linear_update_issue', description: 'Update an issue (title, state, assignee, priority).', input_schema: { type: 'object', properties: { id: { type: 'string' }, title: { type: 'string' }, stateId: { type: 'string' }, assigneeId: { type: 'string' }, priority: { type: 'number' } }, required: ['id'] } },
    { name: 'linear_list_projects', description: 'List projects with progress.', input_schema: { type: 'object', properties: { limit: { type: 'number' } } } },
    { name: 'linear_list_teams', description: 'List all teams.', input_schema: { type: 'object', properties: {} } },
    { name: 'linear_add_comment', description: 'Add a comment to an issue.', input_schema: { type: 'object', properties: { issueId: { type: 'string' }, body: { type: 'string', description: 'Comment text (markdown)' } }, required: ['issueId', 'body'] } },
    { name: 'linear_overview', description: 'Get Linear workspace overview.', input_schema: { type: 'object', properties: {} } },
    { name: 'linear_delete_issue', description: 'Delete an issue.', input_schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
    { name: 'linear_archive_issue', description: 'Archive an issue.', input_schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
    { name: 'linear_create_project', description: 'Create a new project.', input_schema: { type: 'object', properties: { name: { type: 'string' }, teamIds: { type: 'array', items: { type: 'string' }, description: 'Team IDs to associate' }, description: { type: 'string' } }, required: ['name', 'teamIds'] } },
    { name: 'linear_update_project', description: 'Update a project.', input_schema: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, state: { type: 'string', description: 'e.g. planned, started, paused, completed, canceled' } }, required: ['id'] } },
    { name: 'linear_create_cycle', description: 'Create a sprint cycle.', input_schema: { type: 'object', properties: { teamId: { type: 'string' }, name: { type: 'string' }, startsAt: { type: 'string', description: 'ISO 8601 start date' }, endsAt: { type: 'string', description: 'ISO 8601 end date' } }, required: ['teamId', 'name', 'startsAt', 'endsAt'] } },
    { name: 'linear_create_label', description: 'Create an issue label.', input_schema: { type: 'object', properties: { name: { type: 'string' }, color: { type: 'string', description: 'Hex color (e.g. #FF0000)' }, teamId: { type: 'string' } }, required: ['name'] } },
    { name: 'linear_create_relation', description: 'Create a relation between two issues.', input_schema: { type: 'object', properties: { issueId: { type: 'string' }, relatedIssueId: { type: 'string' }, type: { type: 'string', description: 'blocks, duplicate, related' } }, required: ['issueId', 'relatedIssueId', 'type'] } },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  linear_list_issues: listIssues,
  linear_get_issue: getIssue,
  linear_create_issue: createIssue,
  linear_update_issue: updateIssue,
  linear_list_projects: listProjects,
  linear_list_teams: listTeams,
  linear_add_comment: createComment,
  linear_overview: linearOverview,
  linear_delete_issue: deleteIssue,
  linear_archive_issue: archiveIssue,
  linear_create_project: createProject,
  linear_update_project: updateProject,
  linear_create_cycle: createCycle,
  linear_create_label: createLabel,
  linear_create_relation: createIssueRelation,
};
