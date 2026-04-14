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

interface EpicRow { id?: string; title: string; status: string; priority?: string; venture_id?: string; suite?: string; progress_pct?: number; }
interface StoryRow { id?: string; title: string; status: string; epic_id: string; assigned_agent?: string | null; }

// ---------------------------------------------------------------------------
// Tool Handlers
// ---------------------------------------------------------------------------

const createEpic: KitToolHandler = async (input, ctx) => {
  const epic = {
    title: input.title as string,
    summary: input.summary as string | undefined,
    spec_md: input.spec_md as string | undefined,
    venture_id: (input.venture as string) || ctx.ventureId,
    suite: input.suite as string | undefined,
    owner_agent: input.owner_agent as string | undefined,
    status: (input.status as string) || 'draft',
    priority: (input.priority as string) || 'medium',
    tags: (input.tags as string[]) || [],
  };
  const data = await postJson('/api/epics', { action: 'create', epic }, ctx);
  const e = data.epic as EpicRow;
  return {
    success: true,
    data: e,
    displayMarkdown: `**Epic Filed:** ${e.title}\n- Status: \`${e.status}\` · Priority: \`${e.priority}\`${e.venture_id ? ' · Venture: `' + e.venture_id + '`' : ''}${e.suite ? ' · Suite: `' + e.suite + '`' : ''}${e.id ? '\n- ID: `' + e.id.slice(0, 8) + '`' : ''}`,
  };
};

const listEpics: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/epics', {
    action: 'list',
    venture_id: (input.venture as string) || undefined,
    suite: (input.suite as string) || undefined,
    status: (input.status as string) || undefined,
  }, ctx);
  const epics: EpicRow[] = data.epics || [];
  if (epics.length === 0) return { success: true, data: [], displayMarkdown: 'No epics found.' };

  const statusOrder = ['proposed', 'approved', 'in-progress', 'review', 'blocked', 'draft', 'done', 'cancelled'];
  const grouped: Record<string, EpicRow[]> = {};
  epics.forEach(e => { (grouped[e.status] ||= []).push(e); });
  const sorted = Object.entries(grouped).sort(([a], [b]) => statusOrder.indexOf(a) - statusOrder.indexOf(b));

  let md = '## Epics\n\n';
  for (const [status, items] of sorted) {
    md += `### ${status} (${items.length})\n\n`;
    for (const e of items) {
      const prog = typeof e.progress_pct === 'number' ? ` · ${e.progress_pct}%` : '';
      md += `- **${e.title}**${e.priority ? ' `' + e.priority + '`' : ''}${e.venture_id ? ' · ' + e.venture_id : ''}${prog}${e.id ? ' \`' + e.id.slice(0, 8) + '\`' : ''}\n`;
    }
    md += '\n';
  }
  return { success: true, data: epics, displayMarkdown: md };
};

const getEpic: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/epics', { action: 'get', id: input.id as string }, ctx);
  const { epic, stories = [], checkpoints = [] } = data;
  if (!epic) return { success: false, data: null, displayMarkdown: `Epic not found: \`${input.id}\`` };

  let md = `## ${epic.title}\n\n`;
  md += `- Status: \`${epic.status}\` · Priority: \`${epic.priority}\` · Progress: ${epic.progress_pct || 0}%\n`;
  if (epic.summary) md += `\n${epic.summary}\n`;
  if (stories.length) {
    md += `\n### Stories (${stories.length})\n\n`;
    stories.forEach((s: StoryRow) => {
      md += `- \`${s.status}\` ${s.title}${s.id ? ' \`' + s.id.slice(0, 8) + '\`' : ''}\n`;
    });
  }
  if (checkpoints.length) {
    md += `\n### Checkpoints (${checkpoints.length})\n\n`;
    checkpoints.forEach((c: any) => {
      md += `- \`${c.state}\` ${c.checkpoint_type}: ${c.title}\n`;
    });
  }
  return { success: true, data, displayMarkdown: md };
};

const updateEpic: KitToolHandler = async (input, ctx) => {
  const { id, ...updates } = input as Record<string, unknown>;
  const data = await postJson('/api/epics', { action: 'update', id, ...updates }, ctx);
  const e = data.epic as EpicRow;
  return { success: true, data: e, displayMarkdown: `**Epic Updated:** ${e.title} — \`${e.status}\`` };
};

const decomposeToStories: KitToolHandler = async (input, ctx) => {
  const stories = input.stories as Array<Record<string, unknown>>;
  const data = await postJson('/api/epics', { action: 'decompose', epic_id: input.epic_id as string, stories }, ctx);
  const rows = (data.stories || []) as StoryRow[];
  let md = `**Decomposed into ${rows.length} stories:**\n\n`;
  rows.forEach(s => { md += `- ${s.title}\n`; });
  return { success: true, data: rows, displayMarkdown: md };
};

const assignAgent: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/epics', {
    action: 'update_story',
    id: input.story_id as string,
    assigned_agent: input.agent_id as string,
  }, ctx);
  return { success: true, data: data.story, displayMarkdown: `Story assigned to agent \`${(input.agent_id as string).slice(0, 8)}\`.` };
};

const requestCheckpoint: KitToolHandler = async (input, ctx) => {
  const checkpoint = {
    epic_id: input.epic_id as string,
    checkpoint_type: input.checkpoint_type as string,
    title: input.title as string,
    description: input.description as string | undefined,
    required_approvers: (input.required_approvers as string[]) || ['tony'],
    payload: (input.payload as Record<string, unknown>) || {},
  };
  const data = await postJson('/api/epics', { action: 'request_checkpoint', checkpoint }, ctx);
  return {
    success: true,
    data: data.checkpoint,
    displayMarkdown: `**Checkpoint requested:** ${checkpoint.title}\n- Type: \`${checkpoint.checkpoint_type}\`\n- Awaiting: ${checkpoint.required_approvers.join(', ')}`,
  };
};

// ---------------------------------------------------------------------------
// Manifest & Export
// ---------------------------------------------------------------------------

export const manifest: KitManifest = {
  id: 'epic-pipeline',
  name: 'Epic Pipeline',
  version: '1.0.0',
  description: 'Author and manage epics, decompose them into stories, assign NAOS agents, and request human checkpoints. The NAOS-driven build flywheel.',
  author: 'MCV',
  capabilities: ['network'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: 'Use these tools when drafting work plans, breaking goals into executable stories, assigning agents, or requesting approval gates. Prefer `naos_propose_epic` semantics: draft a clear title + spec_md before creating. Always use request_checkpoint before shipping a material change.',
  tools: [
    {
      name: 'create_epic',
      description: 'File a new epic. Requires a title. Include a spec_md (markdown) describing intent, non-goals, acceptance criteria. Optionally scope to a venture and suite (department).',
      input_schema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Short, imperative title' },
          summary: { type: 'string', description: '1-3 sentence summary of the work' },
          spec_md: { type: 'string', description: 'Full markdown spec — context, goals, non-goals, acceptance criteria' },
          venture: { type: 'string', description: 'Venture slug (e.g. "futurestate", "betedge", "mcv")' },
          suite: { type: 'string', description: 'Department suite this belongs to (e.g. "creative-studio", "developer-ops", "commerce-finance")' },
          owner_agent: { type: 'string', description: 'UUID of the NAOS agent owning this epic' },
          priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'], description: 'Defaults to medium' },
          status: { type: 'string', enum: ['draft', 'proposed'], description: 'Defaults to draft — use "proposed" to request Tony\'s review' },
          tags: { type: 'array', items: { type: 'string' } },
        },
        required: ['title'],
      },
    },
    {
      name: 'list_epics',
      description: 'List epics. Filter by venture, suite, or status. Results grouped by status.',
      input_schema: {
        type: 'object',
        properties: {
          venture: { type: 'string' },
          suite: { type: 'string' },
          status: { type: 'string' },
        },
      },
    },
    {
      name: 'get_epic',
      description: 'Fetch full detail for one epic including its stories and checkpoints.',
      input_schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
    },
    {
      name: 'update_epic',
      description: 'Update an epic\'s status, priority, summary, spec_md, owner, or tags.',
      input_schema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          status: { type: 'string', enum: ['draft', 'proposed', 'approved', 'in-progress', 'blocked', 'review', 'done', 'cancelled'] },
          priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          summary: { type: 'string' },
          spec_md: { type: 'string' },
          owner_agent: { type: 'string' },
        },
        required: ['id'],
      },
    },
    {
      name: 'decompose_to_stories',
      description: 'Break an epic into stories atomically. Each story should be executable by a single agent with clear acceptance criteria.',
      input_schema: {
        type: 'object',
        properties: {
          epic_id: { type: 'string' },
          stories: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                acceptance_criteria: { type: 'array', items: { type: 'string' } },
                assigned_agent: { type: 'string', description: 'Optional agent UUID to auto-assign' },
                estimated_effort: { type: 'string', description: 'e.g. "4h", "2d"' },
              },
              required: ['title'],
            },
          },
        },
        required: ['epic_id', 'stories'],
      },
    },
    {
      name: 'assign_agent_to_story',
      description: 'Assign a NAOS agent to a story by its UUID.',
      input_schema: {
        type: 'object',
        properties: { story_id: { type: 'string' }, agent_id: { type: 'string' } },
        required: ['story_id', 'agent_id'],
      },
    },
    {
      name: 'claim_story',
      description: 'Reserve a story for the current Claude Code session. Moves status to in-progress and stamps the session id into kit_invocations so concurrent sessions do not collide on the same work.',
      input_schema: {
        type: 'object',
        properties: {
          story_id: { type: 'string', description: 'The story UUID to claim' },
          session_id: { type: 'string', description: 'Claude Code session identifier (e.g. from useSessionStore)' },
          note: { type: 'string', description: 'Optional free-text context on what this session will do' },
        },
        required: ['story_id', 'session_id'],
      },
    },
    {
      name: 'request_checkpoint',
      description: 'Create an approval gate. Use before any irreversible or high-impact action (pre-commit, pre-merge, pre-deploy, pre-payment). Pauses execution until resolved.',
      input_schema: {
        type: 'object',
        properties: {
          epic_id: { type: 'string' },
          checkpoint_type: { type: 'string', enum: ['spec-review', 'design-review', 'pre-commit', 'pre-merge', 'pre-deploy', 'post-deploy', 'custom'] },
          title: { type: 'string', description: 'Short label for Tony' },
          description: { type: 'string', description: 'What is being approved, and what happens next' },
          required_approvers: { type: 'array', items: { type: 'string' }, description: 'Default: ["tony"]' },
          payload: { type: 'object', description: 'Arbitrary context (diffs, URLs, costs) for the approver to review' },
        },
        required: ['epic_id', 'checkpoint_type', 'title'],
      },
    },
  ],
};

const claimStory: KitToolHandler = async (input, ctx) => {
  const storyId = input.story_id as string;
  const sessionId = input.session_id as string;
  const note = input.note as string | undefined;

  // Fetch current to check if already claimed
  const current = await postJson('/api/epics', { action: 'get_story', id: storyId }, ctx).catch(() => null);
  const existing = current?.story;
  if (existing?.status === 'in-progress') {
    const priorClaims = (existing.kit_invocations as Array<Record<string, unknown>> | undefined) || [];
    const lastClaim = priorClaims.filter(k => k.type === 'session_claim').slice(-1)[0];
    if (lastClaim && lastClaim.session_id !== sessionId) {
      return {
        success: false,
        data: { conflict: true, claimed_by: lastClaim.session_id, claimed_at: lastClaim.at },
        displayMarkdown: `**Story already claimed** by session \`${String(lastClaim.session_id).slice(0, 8)}\` at ${lastClaim.at}. Pick a different story.`,
      };
    }
  }

  const newInvocation = {
    type: 'session_claim',
    session_id: sessionId,
    at: new Date().toISOString(),
    note: note || null,
  };
  const kit_invocations = [...((existing?.kit_invocations as unknown[]) || []), newInvocation];

  const data = await postJson('/api/epics', {
    action: 'update_story',
    id: storyId,
    status: 'in-progress',
    kit_invocations,
  }, ctx);
  const story = data.story as StoryRow;
  return {
    success: true,
    data: story,
    displayMarkdown: `**Claimed:** ${story.title}\n- Session: \`${sessionId.slice(0, 8)}\`\n- Status: \`in-progress\``,
  };
};

export const handlers: Record<string, KitToolHandler> = {
  create_epic: createEpic,
  list_epics: listEpics,
  get_epic: getEpic,
  update_epic: updateEpic,
  decompose_to_stories: decomposeToStories,
  assign_agent_to_story: assignAgent,
  claim_story: claimStory,
  request_checkpoint: requestCheckpoint,
};
