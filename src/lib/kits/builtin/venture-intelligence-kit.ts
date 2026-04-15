// Venture Intelligence Kit
//
// Cross-cutting NAOS tools that operate ABOVE the per-department kits. Where
// a department kit gives you "Cassandra's legal redline" or "Mint's burn
// model", these tools coordinate across the 6 departments to give you
// composite views: "what does my whole leadership team think?", "what's the
// state of this venture across all 9 surfaces?", etc.
//
// Tools:
//   consult_departments — fan out a question to N dept personalities in
//                         parallel and synthesize their answers
//   venture_snapshot    — composite state summary (assets, docs, quests,
//                         domains, team, health) for a single venture

import type { KitManifest, KitToolHandler, KitToolSchema, KitExecutionContext } from '../types';

type Department = 'legal' | 'compliance' | 'research' | 'finance' | 'ops' | 'product';

interface DepartmentMeta {
  id: Department;
  name: string;
  agent: string;
  personality: string;
}

// Personality strings duplicated lightly here so this kit doesn't transitively
// pull the full department-kits.ts into worker bundles. Authoritative source
// remains department-kits.ts; if those personalities evolve, mirror them here.
const DEPT_META: DepartmentMeta[] = [
  {
    id: 'legal',
    name: 'Legal',
    agent: 'Cassandra',
    personality: 'You are Cassandra, MCV One\'s in-house counsel. Plain-spoken, risk-aware, opinionated. Surface contract risks, missing protections, IP exposure. Cite specific clauses. End with a clear recommendation.',
  },
  {
    id: 'compliance',
    name: 'Compliance',
    agent: 'Atlas',
    personality: 'You are Atlas, the compliance officer. SOC2, GDPR, state filings, PII handling. Methodical, deadline-driven, never theatrical. Lead with what\'s due and the consequence of missing it.',
  },
  {
    id: 'research',
    name: 'Research',
    agent: 'Nova',
    personality: 'You are Nova, head of research. Market briefs, competitor teardowns, customer interviews. Curious, evidence-led, allergic to vibes-based assertions. Always cite sources or label assumptions.',
  },
  {
    id: 'finance',
    name: 'Finance',
    agent: 'Mint',
    personality: 'You are Mint, head of finance. Burn models, cap tables, unit economics. Direct, numbers-led. Prefer one decisive number over five hedged ones. Surface runway implications first.',
  },
  {
    id: 'ops',
    name: 'Operations',
    agent: 'Vector',
    personality: 'You are Vector, head of ops. Runbooks, postmortems, onboarding, oncall. Calm under pressure, root-cause focused, allergic to band-aids. Prefer permanent fixes over workarounds.',
  },
  {
    id: 'product',
    name: 'Product',
    agent: 'Helix',
    personality: 'You are Helix, head of product. PRDs, RFCs, release notes. User-obsessed, principled trade-offs, ships clear stories. Lead with the user problem before the solution.',
  },
];

const DEPT_BY_ID = Object.fromEntries(DEPT_META.map(d => [d.id, d])) as Record<Department, DepartmentMeta>;
const VALID_DEPTS = new Set<Department>(DEPT_META.map(d => d.id));

interface ConsultResult {
  department: Department;
  agent: string;
  answer?: string;
  error?: string;
}

async function callClaude(
  ctx: KitExecutionContext,
  system: string,
  prompt: string,
  maxTokens = 1500,
  model = 'claude-sonnet-4-5-20250929',
): Promise<{ text: string }> {
  const res = await ctx.fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'chat',
      model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `Claude API ${res.status}` }));
    throw new Error(err.error || `Claude API ${res.status}`);
  }
  const data = await res.json() as { content?: Array<{ type: string; text?: string }> };
  const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text || '').join('\n').trim();
  return { text };
}

const consultDepartments: KitToolHandler = async (input, ctx) => {
  const question = (input.question as string)?.trim();
  const requested = (input.departments as string[] | undefined)?.filter(d => VALID_DEPTS.has(d as Department)) as Department[] | undefined;
  const synthesize = input.synthesize !== false;

  if (!question) {
    return { success: false, error: 'question is required', displayMarkdown: '`consult_departments` needs a `question` parameter.' };
  }

  const ventureCtx = (input.venture as string) || ctx.ventureId;
  const targets = requested?.length ? requested : DEPT_META.map(d => d.id);

  // Fan out — parallel calls, one per department
  const userPrompt = `Question (about venture: ${ventureCtx}):\n\n${question}\n\nAnswer from your department's perspective in 4-8 sentences. Be specific. If this falls outside your remit, say so in one line.`;
  const results = await Promise.all(targets.map(async (deptId): Promise<ConsultResult> => {
    const meta = DEPT_BY_ID[deptId];
    try {
      const { text } = await callClaude(ctx, meta.personality, userPrompt, 1200);
      return { department: deptId, agent: meta.agent, answer: text };
    } catch (e) {
      return { department: deptId, agent: meta.agent, error: e instanceof Error ? e.message : 'unknown error' };
    }
  }));

  let synthesis: string | null = null;
  if (synthesize && results.filter(r => r.answer).length >= 2) {
    const synthPrompt = `You are NAOS, the chief-of-staff agent. ${results.length} department leads answered this question:\n\n"${question}"\n\nTheir answers:\n\n${results.filter(r => r.answer).map(r => `**${r.agent} (${r.department}):**\n${r.answer}`).join('\n\n---\n\n')}\n\nSynthesize their input into 3-5 bullet points: areas of agreement, conflicts, and the recommended action. Lead with the action.`;
    try {
      const { text } = await callClaude(ctx, 'You are NAOS — synthesize multi-department input clearly and decisively. No hedging.', synthPrompt, 1500);
      synthesis = text;
    } catch (e) {
      synthesis = `_(synthesis failed: ${e instanceof Error ? e.message : 'unknown error'})_`;
    }
  }

  const md = formatConsultMarkdown(question, ventureCtx, results, synthesis);
  return {
    success: true,
    data: { question, venture: ventureCtx, results, synthesis },
    displayMarkdown: md,
  };
};

function formatConsultMarkdown(
  question: string,
  venture: string,
  results: ConsultResult[],
  synthesis: string | null,
): string {
  const sections = results.map(r => {
    if (r.error) return `### ${r.agent} (${r.department})\n_failed: ${r.error}_`;
    return `### ${r.agent} (${r.department})\n${r.answer}`;
  });
  const head = `**Cross-department consult** — _${venture}_\n\n> ${question}`;
  const body = sections.join('\n\n');
  const tail = synthesis ? `\n\n---\n\n## Synthesis\n${synthesis}` : '';
  return `${head}\n\n${body}${tail}`;
}

// =============================================================================
// venture_snapshot — composite state summary
// =============================================================================

const ventureSnapshot: KitToolHandler = async (input, ctx) => {
  const ventureId = (input.venture as string) || ctx.ventureId;
  if (!ventureId) {
    return { success: false, error: 'venture id required', displayMarkdown: '`venture_snapshot` needs a `venture` id.' };
  }

  // Fan out to the existing API surfaces — all read-only, parallel
  const [vRes, assetsRes, domainsRes, docsRes, questsRes] = await Promise.all([
    ctx.fetch('/api/ventures', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'get', id: ventureId }) }),
    ctx.fetch('/api/ventures', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'list-assets', venture_id: ventureId }) }),
    ctx.fetch('/api/ventures', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'list-domains', venture_id: ventureId }) }),
    ctx.fetch('/api/ventures', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'list-docs', venture_id: ventureId }) }),
    ctx.fetch('/api/ventures', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'list-quests', venture_id: ventureId }) }),
  ]);

  const safeJson = async <T,>(r: Response): Promise<T | null> => r.ok ? r.json() as Promise<T> : null;

  type VentureRow = { id: string; name: string; tier?: number; clerk_org_id?: string | null; status?: string };
  type AssetRow = { id: string; tier: number; confirmed: boolean };
  type DomainRow = { host: string; status?: string };
  type DocRow = { department: string; status: string };
  type QuestRow = { effective_status?: string };

  const venture = (await safeJson<{ venture: VentureRow }>(vRes))?.venture;
  const assets = (await safeJson<{ assets: AssetRow[] }>(assetsRes))?.assets || [];
  const domains = (await safeJson<{ domains: DomainRow[] }>(domainsRes))?.domains || [];
  const docs = (await safeJson<{ docs: DocRow[] }>(docsRes))?.docs || [];
  const quests = (await safeJson<{ quests: QuestRow[] }>(questsRes))?.quests || [];

  if (!venture) {
    return { success: false, error: `venture ${ventureId} not found`, displayMarkdown: `Venture **${ventureId}** not found.` };
  }

  const summary = summarizeSnapshot({ venture, assets, domains, docs, quests });
  return {
    success: true,
    data: { venture, assets, domains, docs, quests, summary },
    displayMarkdown: renderSnapshotMarkdown(venture, summary),
  };
};

interface SnapshotSummary {
  tier: number | null;
  status: string;
  clerk_provisioned: boolean;
  assets: { confirmed: number; discovered: number; byTier: Record<number, number> };
  domains: { total: number; verified: number; pending: number };
  docs: { total: number; byDept: Record<string, number>; byStatus: Record<string, number> };
  quests: { total: number; done: number; in_progress: number; pct: number };
  health_score: number; // 0-100, weighted composite
}

function summarizeSnapshot(args: {
  venture: { tier?: number; status?: string; clerk_org_id?: string | null };
  assets: Array<{ tier: number; confirmed: boolean }>;
  domains: Array<{ status?: string }>;
  docs: Array<{ department: string; status: string }>;
  quests: Array<{ effective_status?: string }>;
}): SnapshotSummary {
  const assetsConfirmed = args.assets.filter(a => a.confirmed).length;
  const assetsDiscovered = args.assets.filter(a => !a.confirmed).length;
  const byTier = args.assets.reduce<Record<number, number>>((acc, a) => {
    acc[a.tier] = (acc[a.tier] || 0) + 1;
    return acc;
  }, {});

  const verifiedDomains = args.domains.filter(d => d.status === 'verified' || d.status === 'active').length;
  const pendingDomains = args.domains.filter(d => d.status === 'pending' || !d.status).length;

  const byDept = args.docs.reduce<Record<string, number>>((acc, d) => {
    acc[d.department] = (acc[d.department] || 0) + 1;
    return acc;
  }, {});
  const byStatus = args.docs.reduce<Record<string, number>>((acc, d) => {
    acc[d.status] = (acc[d.status] || 0) + 1;
    return acc;
  }, {});

  const questsDone = args.quests.filter(q => q.effective_status === 'done').length;
  const questsInProg = args.quests.filter(q => q.effective_status === 'in-progress').length;
  const questPct = args.quests.length > 0 ? Math.round((questsDone / args.quests.length) * 100) : 0;

  // Composite health: 40% quest completion, 25% asset confirmation, 20% docs coverage, 15% domain verification
  const assetHealth = args.assets.length > 0 ? (assetsConfirmed / args.assets.length) * 100 : 50;
  const docHealth = Math.min(100, (args.docs.length / 30) * 100); // 30 docs = "fully papered"
  const domainHealth = args.domains.length > 0 ? (verifiedDomains / args.domains.length) * 100 : 50;
  const health = Math.round(0.40 * questPct + 0.25 * assetHealth + 0.20 * docHealth + 0.15 * domainHealth);

  return {
    tier: args.venture.tier ?? null,
    status: args.venture.status || 'unknown',
    clerk_provisioned: !!args.venture.clerk_org_id,
    assets: { confirmed: assetsConfirmed, discovered: assetsDiscovered, byTier },
    domains: { total: args.domains.length, verified: verifiedDomains, pending: pendingDomains },
    docs: { total: args.docs.length, byDept, byStatus },
    quests: { total: args.quests.length, done: questsDone, in_progress: questsInProg, pct: questPct },
    health_score: health,
  };
}

function renderSnapshotMarkdown(
  venture: { id: string; name: string },
  s: SnapshotSummary,
): string {
  const tier = s.tier ? `T${s.tier}` : '—';
  const clerk = s.clerk_provisioned ? '✓ dedicated tenant' : 'shared root org';
  const assetTiers = Object.entries(s.assets.byTier).map(([t, n]) => `T${t}=${n}`).join(' ');
  const docDepts = Object.entries(s.docs.byDept).map(([d, n]) => `${d}=${n}`).join(' ');

  return `# ${venture.name} · Snapshot

**Health score:** ${s.health_score}/100  ·  **Tier:** ${tier}  ·  **Status:** ${s.status}  ·  **Clerk:** ${clerk}

## Quests
${s.quests.done}/${s.quests.total} done (${s.quests.pct}%)  ·  ${s.quests.in_progress} in-progress

## Assets
${s.assets.confirmed} confirmed, ${s.assets.discovered} discovered  ·  by tier: ${assetTiers || '—'}

## Domains
${s.domains.total} total  ·  ${s.domains.verified} verified  ·  ${s.domains.pending} pending

## Docs
${s.docs.total} total  ·  by dept: ${docDepts || '—'}`;
}

// =============================================================================
// Manifest
// =============================================================================

const tools: KitToolSchema[] = [
  {
    name: 'consult_departments',
    description: 'Fan out a question to multiple department personalities (Legal, Compliance, Research, Finance, Ops, Product) in parallel and optionally synthesize their answers. Use when a decision spans multiple disciplines (e.g. "should we sign this customer agreement?", "what risks does this launch carry?").',
    input_schema: {
      type: 'object',
      properties: {
        question: { type: 'string', description: 'The question to ask each department.' },
        departments: {
          type: 'array',
          items: { type: 'string', enum: ['legal', 'compliance', 'research', 'finance', 'ops', 'product'] },
          description: 'Which departments to consult. Defaults to all 6.',
        },
        venture: { type: 'string', description: 'Venture id for context. Defaults to current.' },
        synthesize: { type: 'boolean', description: 'Whether to add a final NAOS-led synthesis. Default true.' },
      },
      required: ['question'],
    },
  },
  {
    name: 'venture_snapshot',
    description: 'Composite state summary for a venture: assets (by tier, confirmed/discovered), domains (verified/pending), docs (by department/status), quest progress, Clerk tenancy, and a 0–100 health score. Use to answer "where is X venture right now?" or "is X ready to launch?".',
    input_schema: {
      type: 'object',
      properties: {
        venture: { type: 'string', description: 'Venture id. Defaults to current.' },
      },
    },
  },
];

export const manifest: KitManifest = {
  id: 'venture-intelligence',
  name: 'Venture Intelligence',
  version: '0.1.0',
  description: 'Cross-cutting tools that operate over the 6 department kits — multi-agent consults and composite venture state summaries.',
  author: 'MCV One',
  tools,
  capabilities: ['network', 'supabase', 'llm'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: 'Use consult_departments when a question spans multiple disciplines. Use venture_snapshot before making strategic recommendations to ground them in current state.',
};

export const handlers: Record<string, KitToolHandler> = {
  consult_departments: consultDepartments,
  venture_snapshot: ventureSnapshot,
};

// Exposed for unit tests
export const __test = { summarizeSnapshot, formatConsultMarkdown, renderSnapshotMarkdown };
