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
import { summarizeSnapshot, compareSnapshots, type SnapshotSummary, type ComparisonRow, type CategoryWinner } from '../../ventures/snapshot';

export { summarizeSnapshot, type SnapshotSummary };

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

// summarizeSnapshot + SnapshotSummary live in src/lib/ventures/snapshot.ts so
// the UI, API, and NAOS tools all consume the same pure function.

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
// find_docs — semantic search across venture_docs via pgvector
// =============================================================================

interface DocChunk {
  id: string;
  text: string;
  source: string;
  file_id: string | null;
  chunk_index: number;
  score: number;
  metadata?: { department?: string; doc_id?: string; title?: string; kind?: string };
}

/**
 * Filter retrieved chunks by department and deduplicate to the best chunk
 * per doc — callers typically want to see "which documents matched" rather
 * than multiple chunks from the same doc. Keeps the highest-scoring chunk
 * per doc_id as the representative.
 */
export function filterAndDedupeChunks(
  chunks: DocChunk[],
  opts: { departments?: string[]; maxResults?: number },
): DocChunk[] {
  const deptSet = opts.departments?.length ? new Set(opts.departments.map(d => d.toLowerCase())) : null;

  // Filter by department if specified
  const filtered = deptSet
    ? chunks.filter(c => {
        const dept = c.metadata?.department?.toLowerCase();
        return dept ? deptSet.has(dept) : false;
      })
    : chunks;

  // Dedupe by doc_id — keep highest score
  const bestByDoc = new Map<string, DocChunk>();
  for (const c of filtered) {
    const docKey = c.metadata?.doc_id || c.file_id || c.id;
    const existing = bestByDoc.get(docKey);
    if (!existing || c.score > existing.score) {
      bestByDoc.set(docKey, c);
    }
  }

  return [...bestByDoc.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, opts.maxResults ?? 10);
}

export function renderFindDocsMarkdown(query: string, chunks: DocChunk[]): string {
  if (!chunks.length) {
    return `**No matching docs found** for: _${query}_\n\nTry broader wording or run \`apply_${'{dept}'}_templates\` if this venture has no documentation yet.`;
  }

  const lines = [`**Doc search**: _${query}_\n`];
  for (const c of chunks) {
    const dept = c.metadata?.department ? ` · ${c.metadata.department}` : '';
    const score = c.score.toFixed(2);
    const snippet = c.text.slice(0, 200).replace(/\n+/g, ' ').trim();
    lines.push(`### ${c.source}${dept}  _(score ${score})_`);
    lines.push(`> ${snippet}${c.text.length > 200 ? '…' : ''}`);
    lines.push('');
  }
  return lines.join('\n').trim();
}

const findDocs: KitToolHandler = async (input, ctx) => {
  const query = (input.query as string)?.trim();
  if (!query) {
    return { success: false, error: 'query is required', displayMarkdown: '`find_docs` needs a `query` string.' };
  }

  const ventureId = (input.venture as string) || ctx.ventureId || null;
  const departments = input.departments as string[] | undefined;
  const maxResults = Math.min((input.max_results as number) || 8, 20);
  // Retrieve a wider pool so department filtering + dedupe still has headroom
  const topK = Math.min(maxResults * 6, 50);

  const res = await ctx.fetch('/api/google-rag', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'retrieve',
      query,
      venture_id: ventureId,
      top_k: topK,
      threshold: 0.6,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `RAG ${res.status}` }));
    return {
      success: false,
      error: err.error || `RAG retrieve ${res.status}`,
      displayMarkdown: `**find_docs** failed: ${err.error || res.statusText}`,
    };
  }

  const data = await res.json() as { chunks?: DocChunk[] };
  const all = data.chunks || [];
  const filtered = filterAndDedupeChunks(all, { departments, maxResults });

  return {
    success: true,
    data: { query, venture: ventureId, count: filtered.length, total_matched: all.length, chunks: filtered },
    displayMarkdown: renderFindDocsMarkdown(query, filtered),
  };
};

// =============================================================================
// compare_ventures — side-by-side snapshot comparison with per-category winners
// =============================================================================

interface PortfolioSnapshotRow { id: string; name: string; tier: number | null; status: string; summary: SnapshotSummary }

export function renderCompareMarkdown(
  rows: ComparisonRow[],
  winners: CategoryWinner[],
): string {
  if (rows.length < 2) {
    return '**compare_ventures** needs at least 2 ventures to compare.';
  }

  const header = `| Metric | ${rows.map(r => r.ventureName).join(' | ')} |`;
  const sep = `| --- | ${rows.map(() => '---').join(' | ')} |`;
  const winnerNameById = new Map(rows.map(r => [r.ventureId, r.ventureName]));

  const lines: string[] = [
    `**Comparison:** ${rows.map(r => r.ventureName).join(' vs ')}`,
    '',
    header,
    sep,
  ];

  for (const w of winners) {
    const cells = rows.map(r => {
      const val = w.values.find(v => v.ventureId === r.ventureId)?.value ?? 0;
      const isWinner = w.winnerId === r.ventureId;
      return isWinner ? `**${val}** 🏆` : `${val}`;
    });
    lines.push(`| ${w.label} | ${cells.join(' | ')} |`);
  }

  lines.push('');
  lines.push('### Winners');
  const winnerCounts = new Map<string, number>();
  for (const w of winners) {
    if (w.winnerId) winnerCounts.set(w.winnerId, (winnerCounts.get(w.winnerId) || 0) + 1);
  }
  if (winnerCounts.size === 0) {
    lines.push('_All categories tied — no clear frontrunner._');
  } else {
    const ranked = [...winnerCounts.entries()].sort((a, b) => b[1] - a[1]);
    for (const [id, count] of ranked) {
      lines.push(`- **${winnerNameById.get(id) || id}**: ${count}/${winners.length} categories`);
    }
  }
  return lines.join('\n');
}

const compareVentures: KitToolHandler = async (input, ctx) => {
  const ids = (input.venture_ids as string[] | undefined)?.filter(Boolean) || [];
  if (ids.length < 2) {
    return { success: false, error: 'venture_ids needs at least 2 ids', displayMarkdown: '`compare_ventures` needs at least 2 venture ids in `venture_ids`.' };
  }
  if (ids.length > 6) {
    return { success: false, error: 'at most 6 ventures at a time', displayMarkdown: '`compare_ventures` caps at 6 ventures — narrow the list.' };
  }

  const res = await ctx.fetch('/api/ventures', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'list-snapshots' }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `snapshots ${res.status}` }));
    return { success: false, error: err.error || `list-snapshots ${res.status}`, displayMarkdown: `**compare_ventures** failed: ${err.error || res.statusText}` };
  }

  const data = await res.json() as { snapshots: PortfolioSnapshotRow[] };
  const idSet = new Set(ids);
  const matching = (data.snapshots || []).filter(s => idSet.has(s.id));
  const missing = ids.filter(id => !matching.some(s => s.id === id));

  if (matching.length < 2) {
    return { success: false, error: `only found ${matching.length} of ${ids.length}; missing: ${missing.join(', ')}`, displayMarkdown: `Found only ${matching.length} matching ventures. Missing: ${missing.join(', ')}` };
  }

  const rows: ComparisonRow[] = matching.map(s => ({ ventureId: s.id, ventureName: s.name, summary: s.summary }));
  const winners = compareSnapshots(rows);

  return {
    success: true,
    data: { rows, winners, missing },
    displayMarkdown: renderCompareMarkdown(rows, winners),
  };
};

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
  {
    name: 'compare_ventures',
    description: 'Head-to-head comparison of 2-6 ventures across 5 categories (health, quest %, confirmed assets, docs, verified domains). Returns a per-category winner and a category-count leaderboard. Use when asked "which venture is furthest along?", "compare MCV to BetEdge", or "who\'s leading on docs?".',
    input_schema: {
      type: 'object',
      properties: {
        venture_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'IDs of 2–6 ventures to compare.',
        },
      },
      required: ['venture_ids'],
    },
  },
  {
    name: 'find_docs',
    description: 'Semantic search across venture_docs using pgvector embeddings. Returns the best-matching doc per result (dedupe by doc_id, highest-score chunk wins). Use for "what do our legal docs say about indemnification?", "find all postmortems mentioning oncall", cross-venture precedent lookups.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Natural-language search query.' },
        venture: { type: 'string', description: 'Limit to one venture. Omit/null for cross-venture search.' },
        departments: {
          type: 'array',
          items: { type: 'string', enum: ['legal', 'compliance', 'research', 'finance', 'ops', 'product'] },
          description: 'Optional filter — restrict results to specific departments.',
        },
        max_results: { type: 'number', description: 'Number of distinct docs to return. Default 8, max 20.' },
      },
      required: ['query'],
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
  compare_ventures: compareVentures,
  find_docs: findDocs,
};

// Exposed for unit tests
export const __test = { summarizeSnapshot, formatConsultMarkdown, renderSnapshotMarkdown, filterAndDedupeChunks, renderFindDocsMarkdown, renderCompareMarkdown };
