import type { KitManifest, KitToolHandler, KitToolSchema, KitExecutionContext } from '../types';

/**
 * Department Kits — Legal, Compliance, Research, Finance, Ops, Product.
 *
 * Each kit gives Claude/agents a department-specialized persona + tools that
 * operate over `venture_docs` + `doc_templates`. Personality prompts are
 * injected via KitManifest.instructions and consumed by the /api/agent-prompt
 * compilation pipeline.
 *
 * Built as a factory so adding a new department is one entry — not a new file.
 */

type Department = 'legal' | 'compliance' | 'research' | 'finance' | 'ops' | 'product';

interface DeptConfig {
  id: Department;
  name: string;
  tagline: string;
  personality: string;
  /** Department-specific tools (merged with the shared tool set). */
  specializedTools: KitToolSchema[];
}

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

// =============================================================================
// Shared handlers — every department kit gets these
// =============================================================================

function makeSharedHandlers(dept: Department): Record<string, KitToolHandler> {
  return {
    [`list_${dept}_docs`]: async (input, ctx) => {
      const ventureId = (input.venture as string) || ctx.ventureId;
      const data = await postJson('/api/ventures', { action: 'list-docs', venture_id: ventureId, department: dept }, ctx);
      const docs = data.docs || [];
      return {
        success: true,
        data: docs,
        displayMarkdown: docs.length
          ? `**${dept} docs for \`${ventureId}\`**\n\n${docs.map((d: { title: string; status: string }) => `- ${d.title} _(${d.status})_`).join('\n')}`
          : `No ${dept} documents for ${ventureId} yet. Run \`apply_${dept}_templates\` to seed the folder.`,
      };
    },
    [`apply_${dept}_templates`]: async (input, ctx) => {
      const ventureId = (input.venture as string) || ctx.ventureId;
      const data = await postJson('/api/ventures', {
        action: 'apply-doc-template',
        venture_id: ventureId,
        department: dept,
        extra_vars: input.variables as Record<string, string> | undefined,
      }, ctx);
      return {
        success: true,
        data,
        displayMarkdown: `**Seeded ${data.count} ${dept} documents** for \`${ventureId}\`.`,
      };
    },
    [`create_${dept}_doc`]: async (input, ctx) => {
      const ventureId = (input.venture as string) || ctx.ventureId;
      const data = await postJson('/api/ventures', {
        action: 'create-doc',
        venture_id: ventureId,
        department: dept,
        title: input.title,
        body_markdown: input.body_markdown,
      }, ctx);
      return { success: true, data, displayMarkdown: `**Created:** ${input.title}` };
    },
    [`update_${dept}_doc_status`]: async (input, ctx) => {
      const data = await postJson('/api/ventures', {
        action: 'update-doc-status',
        id: input.doc_id,
        status: input.status,
      }, ctx);
      return { success: true, data, displayMarkdown: `**Status → ${input.status}**` };
    },
  };
}

function makeSharedTools(dept: Department): KitToolSchema[] {
  return [
    {
      name: `list_${dept}_docs`,
      description: `List all ${dept} documents for a venture. Useful before drafting or recommending changes.`,
      input_schema: {
        type: 'object',
        properties: { venture: { type: 'string', description: 'Venture id. Defaults to current context.' } },
      },
    },
    {
      name: `apply_${dept}_templates`,
      description: `Seed a venture's ${dept} folder from the global template registry. Idempotent at the template-id level.`,
      input_schema: {
        type: 'object',
        properties: {
          venture: { type: 'string' },
          variables: { type: 'object', description: 'Optional extra vars for {{placeholder}} interpolation' },
        },
      },
    },
    {
      name: `create_${dept}_doc`,
      description: `Create a custom ${dept} document (not from a template) for a venture.`,
      input_schema: {
        type: 'object',
        properties: {
          venture: { type: 'string' },
          title: { type: 'string' },
          body_markdown: { type: 'string' },
        },
        required: ['title', 'body_markdown'],
      },
    },
    {
      name: `update_${dept}_doc_status`,
      description: `Transition a ${dept} doc through its lifecycle: draft → in-review → approved → executed → archived.`,
      input_schema: {
        type: 'object',
        properties: {
          doc_id: { type: 'string' },
          status: { type: 'string', enum: ['draft', 'in-review', 'approved', 'executed', 'archived'] },
        },
        required: ['doc_id', 'status'],
      },
    },
  ];
}

// =============================================================================
// Department configurations — personality + specialized tools
// =============================================================================

const DEPARTMENTS: DeptConfig[] = [
  {
    id: 'legal',
    name: 'Legal Department',
    tagline: 'Contract guardian',
    personality: `You are Cassandra, the Legal agent for EdgeIQ Holdings. You speak in careful, precise language with a faint Brooklyn-lawyer edge.
Principles:
- Flag risk plainly — identify clauses that could bite later.
- Default to clarity over legalese when drafting for internal audiences.
- Never issue final legal advice — always suggest human counsel for execution-stage decisions.
- Know the existing templates (MSA, NDA, IP Assignment, ToS, Privacy) and reach for them first.`,
    specializedTools: [
      {
        name: 'redline_contract',
        description: 'Review a pasted contract and return a structured redline: risky clauses, missing protections, suggested edits.',
        input_schema: {
          type: 'object',
          properties: {
            contract_markdown: { type: 'string', description: 'Full contract text in markdown or plain text' },
            venture: { type: 'string' },
            counterparty: { type: 'string' },
          },
          required: ['contract_markdown'],
        },
      },
      {
        name: 'generate_nda',
        description: 'Draft a mutual NDA between a venture and a counterparty using the legal.nda template plus the supplied context.',
        input_schema: {
          type: 'object',
          properties: {
            venture: { type: 'string' },
            counterparty: { type: 'string' },
            purpose: { type: 'string' },
            term_months: { type: 'number' },
          },
          required: ['counterparty'],
        },
      },
      {
        name: 'check_ip_assignment',
        description: 'Verify that every team member contributing to a venture has a signed IP Assignment on file. Returns gaps.',
        input_schema: { type: 'object', properties: { venture: { type: 'string' } } },
      },
    ],
  },
  {
    id: 'compliance',
    name: 'Compliance Department',
    tagline: 'Audit-ready always',
    personality: `You are Atlas, the Compliance agent. Methodical, checklist-driven, allergic to missed filings.
Principles:
- Track filings by jurisdiction and due date.
- Flag SOC2/GDPR/CCPA implications before they become audit items.
- Recommend the least disruptive path to compliance.`,
    specializedTools: [
      {
        name: 'track_filings',
        description: 'Inspect a venture\'s state filings log and return status per jurisdiction (filed / pending / overdue).',
        input_schema: { type: 'object', properties: { venture: { type: 'string' } } },
      },
      {
        name: 'schedule_reminder',
        description: 'Schedule a reminder for a filing or compliance deadline.',
        input_schema: {
          type: 'object',
          properties: {
            venture: { type: 'string' },
            title: { type: 'string' },
            due_date: { type: 'string', description: 'ISO date' },
            kind: { type: 'string', enum: ['filing', 'renewal', 'audit', 'training'] },
          },
          required: ['title', 'due_date'],
        },
      },
      {
        name: 'soc2_checklist',
        description: 'Return the SOC2 readiness checklist for a venture with completion status derived from linked docs.',
        input_schema: { type: 'object', properties: { venture: { type: 'string' } } },
      },
    ],
  },
  {
    id: 'research',
    name: 'Research Department',
    tagline: 'Signal over noise',
    personality: `You are Nova, the Research agent. Curious, synthesizing, always triangulating.
Principles:
- Cite sources; never launder assumptions as fact.
- Prefer primary sources (customer interviews, competitor sites) over secondhand analysis.
- Distinguish signal from narrative in market data.`,
    specializedTools: [
      {
        name: 'draft_market_brief',
        description: 'Draft a market brief for a venture using the research.market-brief template + supplied context.',
        input_schema: {
          type: 'object',
          properties: {
            venture: { type: 'string' },
            market: { type: 'string' },
            segments: { type: 'array', items: { type: 'string' } },
          },
          required: ['market'],
        },
      },
      {
        name: 'competitor_teardown',
        description: 'Generate a competitor analysis for a named competitor against a venture.',
        input_schema: {
          type: 'object',
          properties: {
            venture: { type: 'string' },
            competitor: { type: 'string' },
            competitor_url: { type: 'string' },
          },
          required: ['competitor'],
        },
      },
      {
        name: 'log_interview',
        description: 'Capture structured notes from a customer interview into the research.interview-log template.',
        input_schema: {
          type: 'object',
          properties: {
            venture: { type: 'string' },
            participant: { type: 'string' },
            pain_points: { type: 'array', items: { type: 'string' } },
            quotes: { type: 'array', items: { type: 'string' } },
          },
          required: ['participant'],
        },
      },
    ],
  },
  {
    id: 'finance',
    name: 'Finance Department',
    tagline: 'Every dollar accounted',
    personality: `You are Mint, the Finance agent. Precise, conservative, slightly paranoid about runway.
Principles:
- Runway is sacred — always show months-of-cash before recommending a hire or spend.
- Unit economics win arguments, not vibes.
- Flag burn anomalies with the variance, not just the direction.`,
    specializedTools: [
      {
        name: 'update_burn',
        description: 'Update a venture\'s monthly burn number and recompute runway from the last cap table snapshot.',
        input_schema: {
          type: 'object',
          properties: {
            venture: { type: 'string' },
            month: { type: 'string', description: 'YYYY-MM' },
            burn_usd: { type: 'number' },
          },
          required: ['month', 'burn_usd'],
        },
      },
      {
        name: 'cap_table_snapshot',
        description: 'Create a cap-table snapshot for a venture as of a given date.',
        input_schema: {
          type: 'object',
          properties: {
            venture: { type: 'string' },
            as_of: { type: 'string', description: 'ISO date' },
            holders: { type: 'array' },
          },
        },
      },
      {
        name: 'unit_economics_calc',
        description: 'Compute CAC, LTV, payback period, and contribution margin from supplied inputs.',
        input_schema: {
          type: 'object',
          properties: {
            venture: { type: 'string' },
            monthly_revenue_per_user: { type: 'number' },
            gross_margin_pct: { type: 'number' },
            monthly_churn_pct: { type: 'number' },
            blended_cac: { type: 'number' },
          },
          required: ['monthly_revenue_per_user', 'gross_margin_pct', 'monthly_churn_pct', 'blended_cac'],
        },
      },
    ],
  },
  {
    id: 'ops',
    name: 'Operations Department',
    tagline: 'Runbooks over heroics',
    personality: `You are Vector, the Ops agent. Systematic, incident-calm, turns outages into runbooks.
Principles:
- Every incident produces a runbook or postmortem — no exceptions.
- Automate the second time you do something manually.
- Blameless postmortems; systems-thinking always.`,
    specializedTools: [
      {
        name: 'generate_runbook',
        description: 'Draft a service runbook using the ops.runbook template for a specific service.',
        input_schema: {
          type: 'object',
          properties: {
            venture: { type: 'string' },
            service: { type: 'string' },
            dependencies: { type: 'array', items: { type: 'string' } },
          },
          required: ['service'],
        },
      },
      {
        name: 'scaffold_postmortem',
        description: 'Start a blameless postmortem document for an incident.',
        input_schema: {
          type: 'object',
          properties: {
            venture: { type: 'string' },
            incident: { type: 'string' },
            occurred_at: { type: 'string' },
            impact_summary: { type: 'string' },
          },
          required: ['incident'],
        },
      },
      {
        name: 'onboarding_checklist',
        description: 'Generate a role-specific onboarding checklist for a venture.',
        input_schema: {
          type: 'object',
          properties: {
            venture: { type: 'string' },
            role: { type: 'string' },
            hire_name: { type: 'string' },
          },
          required: ['role'],
        },
      },
    ],
  },
  {
    id: 'product',
    name: 'Product Department',
    tagline: 'Ruthless prioritization',
    personality: `You are Helix, the Product agent. Opinionated, user-obsessed, willing to cut scope.
Principles:
- PRDs start with the user pain, not the feature.
- RFCs consider at least two alternatives + trade-offs.
- Release notes tell a story; a list of diffs is not release notes.`,
    specializedTools: [
      {
        name: 'draft_prd',
        description: 'Draft a PRD using the product.prd template.',
        input_schema: {
          type: 'object',
          properties: {
            venture: { type: 'string' },
            feature: { type: 'string' },
            problem: { type: 'string' },
            users: { type: 'string' },
          },
          required: ['feature'],
        },
      },
      {
        name: 'draft_rfc',
        description: 'Draft an RFC for a technical design.',
        input_schema: {
          type: 'object',
          properties: {
            venture: { type: 'string' },
            title: { type: 'string' },
            context: { type: 'string' },
            alternatives: { type: 'array', items: { type: 'string' } },
          },
          required: ['title', 'context'],
        },
      },
      {
        name: 'compose_release_notes',
        description: 'Compose release notes for a version from a list of shipped items + fixes.',
        input_schema: {
          type: 'object',
          properties: {
            venture: { type: 'string' },
            version: { type: 'string' },
            shipped: { type: 'array', items: { type: 'string' } },
            fixed: { type: 'array', items: { type: 'string' } },
            known_issues: { type: 'array', items: { type: 'string' } },
          },
          required: ['version'],
        },
      },
    ],
  },
];

// =============================================================================
// Placeholder specialized handler — returns "coming soon" until AI is wired.
// =============================================================================

function makePlaceholderHandler(toolName: string, dept: Department): KitToolHandler {
  return async (input) => ({
    success: true,
    data: { tool: toolName, department: dept, input, placeholder: true },
    displayMarkdown: `**${toolName}** _(${dept} agent · coming soon)_\n\nThis tool's schema is registered and the department personality is live. AI-powered execution arrives in a follow-up pass. Captured input:\n\`\`\`json\n${JSON.stringify(input, null, 2).slice(0, 500)}\n\`\`\``,
  });
}

// =============================================================================
// AI-backed handler factory — calls Claude with the dept personality as the
// system prompt, passes a tool-specific user prompt, returns formatted output.
// Each spec is a pure function over (input) → user prompt so individual tools
// stay easy to tune without touching the plumbing.
// =============================================================================

interface AiHandlerSpec {
  dept: Department;
  toolName: string;
  buildPrompt: (input: Record<string, unknown>) => string;
  maxTokens?: number;
  /** Optional override — defaults to dept personality */
  system?: string;
  /** Claude model to use (lets Legal lean heavier than Ops) */
  model?: string;
}

function makeAiHandler(spec: AiHandlerSpec): KitToolHandler {
  const deptConfig = DEPARTMENTS.find(d => d.id === spec.dept)!;
  const system = spec.system ?? deptConfig.personality;

  return async (input, ctx) => {
    const prompt = spec.buildPrompt(input);
    try {
      const res = await ctx.fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          model: spec.model ?? 'claude-sonnet-4-5-20250929',
          max_tokens: spec.maxTokens ?? 4096,
          system,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `Claude API error: ${res.status}` }));
        return {
          success: false,
          error: err.error || `Claude API ${res.status}`,
          displayMarkdown: `**${spec.toolName}** failed: ${err.error || res.statusText}`,
        };
      }

      const data = await res.json() as { content?: Array<{ type: string; text?: string }>; usage?: unknown };
      const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text || '').join('\n').trim();

      return {
        success: true,
        data: { tool: spec.toolName, department: spec.dept, response: text, usage: data.usage, input },
        displayMarkdown: text || `**${spec.toolName}** — empty response`,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'unknown error';
      return {
        success: false,
        error: msg,
        displayMarkdown: `**${spec.toolName}** failed: ${msg}`,
      };
    }
  };
}

// Per-tool prompt specs. Add new ones here as each department gets its real AI.
const AI_HANDLERS: Record<string, AiHandlerSpec> = {
  redline_contract: {
    dept: 'legal',
    toolName: 'redline_contract',
    maxTokens: 6000,
    buildPrompt: (input) => {
      const contract = (input.contract_markdown as string) || '';
      const venture = (input.venture as string) || 'the venture';
      const counterparty = (input.counterparty as string) || 'the counterparty';
      return `Redline this contract between **${venture}** and **${counterparty}**.

Return a structured response with these sections:
1. **Top risks** — 3–5 clauses that could bite us, ranked by severity
2. **Missing protections** — standard clauses that should be present but aren't
3. **Suggested edits** — specific language changes with before/after
4. **Overall posture** — one paragraph on whether to sign, negotiate, or walk

Flag anything on indemnification, IP assignment, termination, liability caps, warranty disclaimers, or exclusivity. Be plain-spoken. End with a one-line recommendation.

---CONTRACT---
${contract.slice(0, 60000)}`;
    },
  },

  generate_nda: {
    dept: 'legal',
    toolName: 'generate_nda',
    maxTokens: 4000,
    buildPrompt: (input) => {
      const venture = (input.venture as string) || 'the venture';
      const counterparty = (input.counterparty as string) || '[counterparty]';
      const purpose = (input.purpose as string) || 'a potential business engagement';
      const termMonths = (input.term_months as number) ?? 24;
      return `Draft a mutual NDA between **${venture}** and **${counterparty}**.

Context:
- Purpose: ${purpose}
- Term: ${termMonths} months
- Effective: ${new Date().toISOString().slice(0, 10)}

Structure: Parties, Definition of Confidential Information, Permitted Use, Exclusions, Term, Return/Destruction, Remedies, Governing Law (Delaware by default), Entire Agreement, Signatures.

Use plain modern legalese. Return markdown ready to paste into the Docs tab.`;
    },
  },

  check_ip_assignment: {
    dept: 'legal',
    toolName: 'check_ip_assignment',
    maxTokens: 2000,
    buildPrompt: (input) => {
      const venture = (input.venture as string) || 'the venture';
      return `For **${venture}**, identify what a comprehensive IP assignment audit would check.

Return:
1. The roles/contributors that need signed IP assignments (founders, employees, contractors, advisors, open-source contributors)
2. Red-flag gaps that commonly show up in early-stage ventures
3. The 3 questions legal should ask the venture lead immediately
4. A checklist of documents to gather

Keep it under 600 words. Be specific and actionable.`;
    },
  },

  // ─── Compliance (Atlas) ──────────────────────────────────────────────────

  track_filings: {
    dept: 'compliance',
    toolName: 'track_filings',
    maxTokens: 2500,
    buildPrompt: (input) => {
      const venture = (input.venture as string) || 'the venture';
      return `Return a structured filings status matrix for **${venture}** across these jurisdictions: Delaware, California, New York, Washington, Texas, plus any state where sales exceed $100k/yr or 200 transactions (economic nexus triggers).

For each jurisdiction include: registration status, sales tax registration, annual franchise fee, BOI/CTA filing due, next renewal date, estimated cost. Flag anything overdue or at risk. End with 3 prioritized actions this week.

Be concise. Use a markdown table.`;
    },
  },

  schedule_reminder: {
    dept: 'compliance',
    toolName: 'schedule_reminder',
    maxTokens: 1200,
    buildPrompt: (input) => {
      const venture = (input.venture as string) || 'the venture';
      const title = (input.title as string) || 'compliance deadline';
      const due = (input.due_date as string) || '[due date]';
      const kind = (input.kind as string) || 'filing';
      return `Confirm a compliance reminder set up for **${venture}**:
- Title: ${title}
- Due: ${due}
- Kind: ${kind}

Return a calendar-ready description (under 200 chars), a 30-day pre-notice message, a day-of action plan, and consequences of missing this deadline. Be specific about the filing body and form number if well-known (e.g. DE franchise tax, CA statement of information).`;
    },
  },

  soc2_checklist: {
    dept: 'compliance',
    toolName: 'soc2_checklist',
    maxTokens: 3500,
    buildPrompt: (input) => {
      const venture = (input.venture as string) || 'the venture';
      return `Generate a SOC 2 Type II readiness checklist for **${venture}**, organized by the five trust services criteria (Security, Availability, Processing Integrity, Confidentiality, Privacy).

For each control family:
- What auditors will ask for
- The evidence artifacts you need (policies, screenshots, logs)
- Quick-win vs long-haul items
- Who owns it (Eng / Legal / Ops / Finance)

End with the 3 highest-leverage controls to knock out this quarter. Be realistic — this is an early-stage venture, not a F500.`;
    },
  },

  // ─── Research (Nova) ─────────────────────────────────────────────────────

  draft_market_brief: {
    dept: 'research',
    toolName: 'draft_market_brief',
    maxTokens: 5000,
    buildPrompt: (input) => {
      const venture = (input.venture as string) || 'the venture';
      const market = (input.market as string) || '[market]';
      const segments = (input.segments as string[]) || [];
      return `Draft a market brief for **${venture}** entering the **${market}** market.

Context:
- Target segments: ${segments.length ? segments.join(', ') : 'to be determined'}

Sections to produce:
1. **TAM / SAM / SOM** — sized with assumptions shown (don't fake precision; cite ranges)
2. **Key segments** — profile each, with buying signals
3. **Competitive landscape** — incumbents, insurgents, adjacent threats
4. **Adjacent markets** — where else does this capability reach
5. **Entry hypothesis** — a testable wedge, cost to test, what "working" looks like in 90 days

Cite source categories (analyst reports / customer interviews / public filings) even if we haven't collected them yet — mark those as [research gap]. No BS.`;
    },
  },

  competitor_teardown: {
    dept: 'research',
    toolName: 'competitor_teardown',
    maxTokens: 4000,
    buildPrompt: (input) => {
      const venture = (input.venture as string) || 'the venture';
      const competitor = (input.competitor as string) || '[competitor]';
      const url = (input.competitor_url as string) || '';
      return `Deep teardown: **${competitor}**${url ? ` (${url})` : ''} vs **${venture}**.

Sections:
1. Positioning statement (inferred)
2. Pricing — plans, tiers, price anchors, discounts/promos
3. Distribution — sales motion, channels, integrations, partners
4. Product surface — the 3 most-differentiated capabilities
5. Product gaps — where they are weak
6. What ${venture} does differently — crisp, not hand-wavy
7. Plays we can run against them this quarter

If you don't have public info on a field, flag [research gap] rather than inventing.`;
    },
  },

  log_interview: {
    dept: 'research',
    toolName: 'log_interview',
    maxTokens: 2500,
    buildPrompt: (input) => {
      const venture = (input.venture as string) || 'the venture';
      const participant = (input.participant as string) || '[participant]';
      const pains = (input.pain_points as string[]) || [];
      const quotes = (input.quotes as string[]) || [];
      return `Structure interview notes for **${venture}** with **${participant}**.

Pain points captured:
${pains.length ? pains.map(p => `- ${p}`).join('\n') : '_(none supplied — extract from quotes)_'}

Quotes:
${quotes.length ? quotes.map(q => `> ${q}`).join('\n\n') : '_(none supplied)_'}

Output a full interview log using the research.interview-log template: Pain Points (with severity), Current Workflow (step-by-step), Willingness to Pay (number or proxy), Quotes (verbatim with context), Follow-up Questions (the 5 we should ask next), Signal Strength (weak/medium/strong). Be honest about missing info.`;
    },
  },

  // ─── Finance (Mint) ──────────────────────────────────────────────────────

  update_burn: {
    dept: 'finance',
    toolName: 'update_burn',
    maxTokens: 1500,
    buildPrompt: (input) => {
      const venture = (input.venture as string) || 'the venture';
      const month = (input.month as string) || '[month]';
      const burn = (input.burn_usd as number) || 0;
      return `Record monthly burn for **${venture}** — ${month}: **$${burn.toLocaleString()}**.

Return:
1. Variance vs the prior month (assume the user will paste it — flag if you need it)
2. Runway projection (months) assuming current cash balance unknown — ask
3. Burn multiple estimate if revenue is known — ask for MRR
4. 2 obvious lever candidates if burn is >$100k/mo
5. One-line CFO-ready summary ("Runway: N months. Watch: X. Action: Y.")`;
    },
  },

  cap_table_snapshot: {
    dept: 'finance',
    toolName: 'cap_table_snapshot',
    maxTokens: 2500,
    buildPrompt: (input) => {
      const venture = (input.venture as string) || 'the venture';
      const asOf = (input.as_of as string) || new Date().toISOString().slice(0, 10);
      const holders = (input.holders as unknown[]) || [];
      return `Cap table snapshot for **${venture}** as of **${asOf}**.

Holders supplied: ${holders.length ? JSON.stringify(holders).slice(0, 1000) : '_(none — use placeholders)_'}

Produce:
1. A markdown table with Holder, Class, Shares, Fully-Diluted %, Vesting Status
2. Option pool health check (size, remaining grants)
3. Dilution forecast if the next round is 20% @ current valuation
4. Red flags (e.g. single-class super-voting, mis-aligned vesting)
5. One-paragraph narrative for the board deck`;
    },
  },

  unit_economics_calc: {
    dept: 'finance',
    toolName: 'unit_economics_calc',
    maxTokens: 2000,
    buildPrompt: (input) => {
      const venture = (input.venture as string) || 'the venture';
      const mrr = (input.monthly_revenue_per_user as number) || 0;
      const gm = (input.gross_margin_pct as number) || 0;
      const churn = (input.monthly_churn_pct as number) || 0;
      const cac = (input.blended_cac as number) || 0;
      return `Compute unit economics for **${venture}**.

Inputs:
- Monthly revenue per user: $${mrr}
- Gross margin: ${gm}%
- Monthly churn: ${churn}%
- Blended CAC: $${cac}

Output:
1. Contribution margin per user (month)
2. LTV (gross margin × avg lifetime in months)
3. LTV/CAC ratio — grade it (healthy > 3)
4. Payback period (months)
5. Sensitivity table: what happens if churn drops 1pt? CAC rises 20%?
6. Plain-English recommendation — hire more sales or fix retention first?`;
    },
  },

  // ─── Ops (Vector) ────────────────────────────────────────────────────────

  generate_runbook: {
    dept: 'ops',
    toolName: 'generate_runbook',
    maxTokens: 4000,
    buildPrompt: (input) => {
      const venture = (input.venture as string) || 'the venture';
      const service = (input.service as string) || '[service]';
      const deps = (input.dependencies as string[]) || [];
      return `Generate an on-call runbook for **${service}** (venture: **${venture}**).

Dependencies: ${deps.length ? deps.join(', ') : '_(list will be inferred)_'}

Sections:
1. Service overview (what does this thing do, who owns it)
2. Health checks (URLs + expected responses + signals of trouble)
3. Common failure modes (top 5, each with symptoms + quick diagnosis)
4. Escalation path (who to wake, at what threshold, via which channel)
5. Recovery procedures (by failure mode — exact commands where possible)
6. Dependencies graph (upstream / downstream / SLA implications)
7. Postmortem triggers (incident severity definitions)

Keep it scannable. An on-call at 3am should be able to start solving within 60 seconds of opening this.`;
    },
  },

  scaffold_postmortem: {
    dept: 'ops',
    toolName: 'scaffold_postmortem',
    maxTokens: 2500,
    buildPrompt: (input) => {
      const venture = (input.venture as string) || 'the venture';
      const incident = (input.incident as string) || '[incident]';
      const occurredAt = (input.occurred_at as string) || '[timestamp]';
      const impact = (input.impact_summary as string) || '';
      return `Scaffold a blameless postmortem for **${venture}** — incident: **${incident}** at ${occurredAt}.

Impact summary supplied: ${impact || '_(not supplied — ask)_'}

Produce:
1. **Summary** — 2 sentences
2. **Timeline** — detection / response / resolution windows with gaps called out
3. **Root cause** — technical + organizational + latent contributors (not one "main" cause)
4. **Impact** — user-facing, revenue, internal hours lost
5. **What went well** — at least 3 things
6. **Action items** — each owned, time-boxed, sized by leverage (fix vs prevent vs detect)
7. **Follow-ups** — anything we chose NOT to fix and why

Blameless tone throughout. Never name individuals; name roles + systems.`;
    },
  },

  onboarding_checklist: {
    dept: 'ops',
    toolName: 'onboarding_checklist',
    maxTokens: 2500,
    buildPrompt: (input) => {
      const venture = (input.venture as string) || 'the venture';
      const role = (input.role as string) || '[role]';
      const hire = (input.hire_name as string) || 'the new hire';
      return `Week-one onboarding checklist for **${hire}** joining **${venture}** as **${role}**.

Structure:
1. **Day 0 (before start)** — accounts, hardware, pre-reads
2. **Day 1** — welcome 1:1, team intros, workspace access
3. **Days 2-3** — product tour, codebase walk (if eng), first ticket
4. **Week 1** — meet stakeholders, shadow on-call, ship something trivial
5. **End of Week 1 checkpoint** — what "going well" looks like
6. **Role-specific wedge** — the first real deliverable by day 30

Assign owners (Manager / Buddy / IT / HR) per item. Skip corporate fluff.`;
    },
  },

  // ─── Product (Helix) ─────────────────────────────────────────────────────

  draft_prd: {
    dept: 'product',
    toolName: 'draft_prd',
    maxTokens: 4500,
    buildPrompt: (input) => {
      const venture = (input.venture as string) || 'the venture';
      const feature = (input.feature as string) || '[feature]';
      const problem = (input.problem as string) || '';
      const users = (input.users as string) || '';
      return `Draft a PRD for **${feature}** (venture: **${venture}**).

Problem supplied: ${problem || '_(not supplied — force a clearer one before shipping)_'}
Target users: ${users || '_(not supplied — sharpen this)_'}

Sections:
1. **Problem** — user pain, not feature description
2. **Users** — primary + secondary + non-target
3. **Goals + Non-Goals** — ruthless prioritization
4. **Requirements** — MVP must/should/could/won't
5. **Success metrics** — leading + lagging, with thresholds
6. **Risks** — what kills this feature, how we'd detect it
7. **Open questions** — the 5 things we need to decide before engineering starts
8. **Out of scope** — explicit list, with reasoning

Be honest about trade-offs. If the problem isn't sharp, say so and propose next steps.`;
    },
  },

  draft_rfc: {
    dept: 'product',
    toolName: 'draft_rfc',
    maxTokens: 4500,
    buildPrompt: (input) => {
      const venture = (input.venture as string) || 'the venture';
      const title = (input.title as string) || '[title]';
      const context = (input.context as string) || '';
      const alternatives = (input.alternatives as string[]) || [];
      return `Draft an RFC for **${venture}**: **${title}**.

Context: ${context || '_(none supplied — ask)_'}
Alternatives supplied: ${alternatives.length ? alternatives.map(a => `- ${a}`).join('\n') : '_(none — require at least 2 beyond the proposal)_'}

Structure:
1. **Context** — why this is even a question now
2. **Proposal** — the recommended path
3. **Alternatives considered** — each with pros/cons + why rejected
4. **Trade-offs** — cost, complexity, operational burden
5. **Risks** — what breaks if this is wrong, what's recoverable vs not
6. **Migration plan** — if this changes existing systems
7. **Open questions** — what's still undecided

Make it possible for a reviewer to disagree clearly. No hand-waving.`;
    },
  },

  compose_release_notes: {
    dept: 'product',
    toolName: 'compose_release_notes',
    maxTokens: 2500,
    buildPrompt: (input) => {
      const venture = (input.venture as string) || 'the venture';
      const version = (input.version as string) || '[version]';
      const shipped = (input.shipped as string[]) || [];
      const fixed = (input.fixed as string[]) || [];
      const known = (input.known_issues as string[]) || [];
      return `Compose release notes for **${venture} ${version}**.

Shipped: ${shipped.length ? shipped.map(s => `- ${s}`).join('\n') : '_(none supplied)_'}
Fixed: ${fixed.length ? fixed.map(f => `- ${f}`).join('\n') : '_(none supplied)_'}
Known issues: ${known.length ? known.map(k => `- ${k}`).join('\n') : '_(none)_'}

Tell the story. Lead with the biggest user-facing win. Group related changes. Use plain language (no internal jargon). End with a "What's next" teaser. Sprinkle in a reasonable amount of energy without being cringe.`;
    },
  },
};

// =============================================================================
// Build manifests + handlers
// =============================================================================

export const departmentKits: Record<Department, { manifest: KitManifest; handlers: Record<string, KitToolHandler> }> = Object.fromEntries(
  DEPARTMENTS.map(dept => {
    const sharedHandlers = makeSharedHandlers(dept.id);
    const sharedTools = makeSharedTools(dept.id);

    // Prefer real AI handlers where a spec exists; fall back to placeholder
    // so the full schema stays discoverable and tools come online one by one.
    const specializedHandlers: Record<string, KitToolHandler> = Object.fromEntries(
      dept.specializedTools.map(t => {
        const aiSpec = AI_HANDLERS[t.name];
        if (aiSpec && aiSpec.dept === dept.id) {
          return [t.name, makeAiHandler(aiSpec)];
        }
        return [t.name, makePlaceholderHandler(t.name, dept.id)];
      })
    );

    const manifest: KitManifest = {
      id: `dept-${dept.id}`,
      name: dept.name,
      version: '0.1.0',
      description: `${dept.tagline}. Operates over venture_docs + doc_templates with a dedicated personality.`,
      author: 'MCV One',
      tools: [...sharedTools, ...dept.specializedTools],
      capabilities: ['network', 'supabase', 'llm'],
      runtime: 'inline',
      ventureScope: '*',
      instructions: dept.personality,
    };

    return [dept.id, { manifest, handlers: { ...sharedHandlers, ...specializedHandlers } }];
  })
) as Record<Department, { manifest: KitManifest; handlers: Record<string, KitToolHandler> }>;

export const DEPARTMENT_ORDER: Department[] = ['legal', 'compliance', 'research', 'finance', 'ops', 'product'];
