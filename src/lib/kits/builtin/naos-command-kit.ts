import type { KitManifest, KitToolHandler } from '../types';

const API = '/api/naos-agents';

async function naosApi(action: string, body: Record<string, unknown>, ctx: { fetch: typeof globalThis.fetch }) {
  const res = await ctx.fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...body }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'NAOS API error');
  }
  return res.json();
}

const listAgents: KitToolHandler = async (input, ctx) => {
  const data = await naosApi('list', {
    tier: input.tier, venture: input.venture, status: input.status,
  }, ctx);
  const agents = data.agents || [];
  if (agents.length === 0) return { success: true, data: [], displayMarkdown: 'No agents found.' };
  const lines = agents.map((a: any) => {
    const mood = a.emotional_state?.momentum > 85 ? '⚡' : a.emotional_state?.frustration > 60 ? '😤' : a.emotional_state?.confidence > 70 ? '💪' : '';
    return `- **${a.codename}** ${mood} — ${a.title} (Tier ${a.tier}, ${a.milestone})`;
  });
  return { success: true, data: agents, displayMarkdown: `## NAOS Roster (${agents.length})\n\n${lines.join('\n')}` };
};

const getAgent: KitToolHandler = async (input, ctx) => {
  const data = await naosApi('get', { id: input.id }, ctx);
  const a = data.agent;
  if (!a) return { success: false, error: 'Agent not found' };
  const p = data.personality;
  let md = `## ${a.codename}${a.full_name ? ` (${a.full_name})` : ''}\n\n`;
  md += `**${a.title}** · Tier ${a.tier} · ${a.milestone}\n\n`;
  md += `${a.genesis_story}\n\n`;
  if (p) {
    md += `### Personality\n`;
    md += `- Risk: ${p.risk_tolerance} · Analytical: ${p.analytical_bias} · Creative: ${p.creativity_index}\n`;
    md += `- Assertive: ${p.assertiveness} · Collaborative: ${p.collaboration_style}\n`;
  }
  if (a.achievements?.length) md += `\n### Achievements\n${a.achievements.join(', ')}\n`;
  return { success: true, data, displayMarkdown: md };
};

const hireAgent: KitToolHandler = async (input, ctx) => {
  const data = await naosApi('create', {
    role: input.role,
    title: input.title,
    domains: input.domains,
    venture_scope: input.venture_scope,
    reports_to: input.reports_to,
  }, ctx);
  const a = data.agent;
  return {
    success: true,
    data: a,
    displayMarkdown: `## Agent Hired: ${a.codename}\n\n**${a.title}** · Tier ${a.tier}\n\n${a.genesis_story}`,
  };
};

const orgOverview: KitToolHandler = async (_input, ctx) => {
  const data = await naosApi('list', {}, ctx);
  const agents = data.agents || [];
  const tiers: Record<number, number> = {};
  for (const a of agents) tiers[a.tier] = (tiers[a.tier] || 0) + 1;
  const lines = [
    `**Total Agents:** ${agents.length}`,
    `**C-Suite:** ${tiers[1] || 0}`,
    `**Directors:** ${tiers[2] || 0}`,
    `**Managers:** ${tiers[3] || 0}`,
    `**Leads:** ${tiers[4] || 0}`,
    `**ICs:** ${tiers[5] || 0}`,
  ];
  return { success: true, data: { agents: agents.length, tiers }, displayMarkdown: `## NAOS Organization\n\n${lines.join('\n')}` };
};

const cultureCheck: KitToolHandler = async (_input, ctx) => {
  const data = await naosApi('culture', {}, ctx);
  const c = data.snapshot;
  if (!c) return { success: true, data: null, displayMarkdown: 'No culture data yet.' };
  return {
    success: true, data: c,
    displayMarkdown: `## Org Culture Pulse\n\n- Innovation: ${c.innovation_temperature}\n- Risk Appetite: ${c.risk_appetite}\n- Velocity: ${c.velocity_pressure}\n- Collaboration: ${c.collaboration_density}\n- Trust: ${c.trust_baseline}\n\n**${c.agent_count} agents** · ${c.snapshot_date}`,
  };
};

export const manifest: KitManifest = {
  id: 'naos-command',
  name: 'NAOS Command',
  version: '1.0.0',
  description: 'Manage the NAOS Living Agent Civilization — view roster, hire agents, check org culture, query individual agents.',
  author: 'MCV',
  capabilities: ['network'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: 'Use NAOS Command tools to interact with the AI agent organization — list agents, view profiles, hire new agents, check org culture.',
  tools: [
    { name: 'naos_roster', description: 'List all NAOS agents. Filter by tier, venture, or status.', input_schema: { type: 'object', properties: { tier: { type: 'number' }, venture: { type: 'string' }, status: { type: 'string' } } } },
    { name: 'naos_agent', description: 'Get detailed profile of a specific agent.', input_schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
    { name: 'naos_hire', description: 'Hire a new agent into the organization.', input_schema: { type: 'object', properties: { role: { type: 'string' }, title: { type: 'string' }, domains: { type: 'array' }, venture_scope: { type: 'array' }, reports_to: { type: 'string' } }, required: ['role', 'title'] } },
    { name: 'naos_org', description: 'Get organization overview — agent counts by tier.', input_schema: { type: 'object', properties: {} } },
    { name: 'naos_culture', description: 'Get current organizational culture pulse metrics.', input_schema: { type: 'object', properties: {} } },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  naos_roster: listAgents,
  naos_agent: getAgent,
  naos_hire: hireAgent,
  naos_org: orgOverview,
  naos_culture: cultureCheck,
};
