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
