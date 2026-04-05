import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function teamApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext) {
  const r = await ctx.fetch('/api/team', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...params }) });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Team error'); }
  return r.json();
}

const listMembers: KitToolHandler = async (_i, ctx) => {
  const d = await teamApi('list', {}, ctx);
  const members = d.members ?? d.data ?? [];
  const lines = members.map((m: { name: string; role: string; email: string; status: string; venture_assignments: string[] }) =>
    `- **${m.name}** — ${m.role} (${m.status}) — ${m.email}${m.venture_assignments?.length ? ` — ventures: ${m.venture_assignments.join(', ')}` : ''}`);
  return { success: true, data: members, displayMarkdown: `## Team (${members.length})\n\n${lines.join('\n')}` };
};

const getMember: KitToolHandler = async (input, ctx) => {
  const d = await teamApi('get', { id: input.id }, ctx);
  return { success: true, data: d, displayMarkdown: `## ${d.name}\n\n- **Role:** ${d.role}\n- **Email:** ${d.email}\n- **Status:** ${d.status}\n- **Ventures:** ${d.venture_assignments?.join(', ') || 'none'}` };
};

const createMember: KitToolHandler = async (input, ctx) => {
  const d = await teamApi('create', { name: input.name, email: input.email, role: input.role, status: input.status || 'active' }, ctx);
  return { success: true, data: d, displayMarkdown: `Team member added: **${input.name}** (${input.role})` };
};

const assignVentures: KitToolHandler = async (input, ctx) => {
  const d = await teamApi('assign-ventures', { id: input.id, venture_assignments: input.ventures }, ctx);
  return { success: true, data: d, displayMarkdown: `Venture assignments updated for member ${input.id}` };
};

export const manifest: KitManifest = {
  id: 'team-management', name: 'Team Management', version: '1.0.0',
  description: 'Team — list, add, update members, assign ventures, roles and permissions.',
  author: 'MCV', capabilities: ['network'], runtime: 'inline', ventureScope: '*',
  instructions: 'Use team tools for managing team members, roles, venture assignments, and org structure.',
  tools: [
    { name: 'team_list', description: 'List all team members with roles and venture assignments.', input_schema: { type: 'object', properties: {} } },
    { name: 'team_get', description: 'Get a team member by ID.', input_schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
    { name: 'team_add', description: 'Add a new team member.', input_schema: { type: 'object', properties: { name: { type: 'string' }, email: { type: 'string' }, role: { type: 'string' } }, required: ['name', 'email', 'role'] } },
    { name: 'team_assign_ventures', description: 'Assign ventures to a team member.', input_schema: { type: 'object', properties: { id: { type: 'string' }, ventures: { type: 'array', description: 'Array of venture slugs' } }, required: ['id', 'ventures'] } },
  ],
};
export const handlers: Record<string, KitToolHandler> = { team_list: listMembers, team_get: getMember, team_add: createMember, team_assign_ventures: assignVentures };
