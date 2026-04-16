// EdgeIQ Capital kit — NAOS tools for cap-table, rounds, commitments, investors.
// Backed by /api/capital handler in mcv-one-desktop.
// SPEC-EQC-001 Epic 1.7

import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

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

function usd(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return String(value);
  return num.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function pct(value: number): string {
  return `${value.toFixed(1)}%`;
}

// ─── 1. list_rounds ─────────────────────────────────────────────────────

const listRounds: KitToolHandler = async (input, ctx) => {
  const ventureId = (input.venture_id as string) || undefined;
  const status = (input.status as string) || undefined;
  const data = await postJson('/api/capital', {
    action: 'list-rounds',
    venture_id: ventureId,
    status,
  }, ctx);
  const rounds = data.rounds ?? [];
  if (!rounds.length) return { success: true, data: [], displayMarkdown: 'No rounds found.' };
  let md = `## Rounds${ventureId ? ` — ${ventureId}` : ''}\n\n| Name | Type | Lane | Status | Target | Committed | % |\n|------|------|------|--------|--------|-----------|---|\n`;
  for (const r of rounds) {
    const progress = r.target_raise > 0 ? (Number(r.total_committed) / Number(r.target_raise)) * 100 : 0;
    md += `| ${r.name} | ${r.round_type} | ${r.raise_lane} | ${r.status} | ${usd(r.target_raise)} | ${usd(r.total_committed)} | ${pct(progress)} |\n`;
  }
  return { success: true, data: rounds, displayMarkdown: md };
};

// ─── 2. get_round_detail ────────────────────────────────────────────────

const getRoundDetail: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/capital', {
    action: 'get-round',
    id: input.round_id,
  }, ctx);
  const r = data.round;
  if (!r) return { success: false, error: 'Round not found' };
  const progress = r.target_raise > 0 ? (Number(r.total_committed) / Number(r.target_raise)) * 100 : 0;
  let md = `## ${r.name}\n\n`;
  md += `**Type:** ${r.round_type} (${r.raise_lane}) · **Status:** ${r.status}\n`;
  md += `**Target:** ${usd(r.target_raise)} · **Committed:** ${usd(r.total_committed)} (${pct(progress)})\n`;
  md += `**Funded:** ${usd(r.total_funded)} · **Investors:** ${r.total_investors}\n`;
  if (r.pre_money_valuation) md += `**Pre-money:** ${usd(r.pre_money_valuation)}\n`;
  if (r.valuation_cap) md += `**Cap:** ${usd(r.valuation_cap)}\n`;
  if (r.regulatory_framework) md += `**Framework:** ${r.regulatory_framework}\n`;
  if (r.funding_deadline) md += `**Deadline:** ${new Date(r.funding_deadline).toLocaleDateString()}\n`;
  return { success: true, data: r, displayMarkdown: md };
};

// ─── 3. list_commitments ────────────────────────────────────────────────

const listCommitments: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/capital', {
    action: 'list-commitments',
    venture_id: input.venture_id,
    round_id: input.round_id,
    contact_id: input.contact_id,
    status: input.status,
  }, ctx);
  const commits = data.commitments ?? [];
  if (!commits.length) return { success: true, data: [], displayMarkdown: 'No commitments found.' };
  let md = `## Commitments\n\n| Status | Amount | Currency | Contact | Round |\n|--------|--------|----------|---------|-------|\n`;
  for (const c of commits) {
    md += `| ${c.status} | ${usd(c.amount_usd)} | ${c.currency} | ${c.contact_id?.slice(0, 8) ?? '—'} | ${c.round_id?.slice(0, 8) ?? '—'} |\n`;
  }
  const total = commits.reduce((s: number, c: { amount_usd: number | string }) => s + Number(c.amount_usd), 0);
  md += `\n**Total:** ${usd(total)} across ${commits.length} commitments.`;
  return { success: true, data: commits, displayMarkdown: md };
};

// ─── 4. create_commitment ───────────────────────────────────────────────

const createCommitment: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/capital', {
    action: 'create-commitment',
    commitment: {
      venture_id: input.venture_id,
      contact_id: input.contact_id,
      round_id: input.round_id,
      amount: Number(input.amount),
      amount_usd: Number(input.amount_usd ?? input.amount),
      currency: input.currency || 'USD',
      status: input.status || 'soft_commit',
      notes: input.notes,
    },
  }, ctx);
  const c = data.commitment;
  return {
    success: true,
    data: c,
    displayMarkdown: `**Commitment Created:** ${usd(c.amount_usd)} (${c.status}) for round \`${c.round_id?.slice(0, 8)}\``,
  };
};

// ─── 5. update_commitment_status ────────────────────────────────────────

const updateCommitmentStatus: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/capital', {
    action: 'update-commitment-status',
    id: input.commitment_id,
    status: input.next_status,
  }, ctx);
  const c = data.commitment;
  return {
    success: true,
    data: c,
    displayMarkdown: `Commitment \`${c.id?.slice(0, 8)}\` → **${c.status}**`,
  };
};

// ─── 6. list_investors ──────────────────────────────────────────────────

const listInvestors: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/capital', {
    action: 'list-investors',
    venture_id: input.venture_id,
    stage: input.stage,
    contact_type: input.contact_type,
  }, ctx);
  const investors = data.investors ?? [];
  if (!investors.length) return { success: true, data: [], displayMarkdown: 'No investors found.' };
  let md = `## Investors\n\n| Type | Stage | Score | Total Committed | KYC | Accreditation |\n|------|-------|-------|-----------------|-----|---------------|\n`;
  for (const i of investors) {
    md += `| ${i.contact_type} | ${i.stage} | ${i.lead_score} | ${usd(i.total_committed_usd)} | ${i.kyc_status} | ${i.accreditation_status} |\n`;
  }
  return { success: true, data: investors, displayMarkdown: md };
};

// ─── 7. get_investor_position ───────────────────────────────────────────

const getInvestorPosition: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/capital', {
    action: 'get-investor-position',
    contact_id: input.contact_id,
  }, ctx);
  const profile = data.profile;
  const commitments = data.commitments ?? [];
  if (!profile) return { success: false, error: 'Investor not found' };
  let md = `## Investor Position — \`${profile.contact_id?.slice(0, 8)}\`\n\n`;
  md += `**Type:** ${profile.contact_type} · **Stage:** ${profile.stage} · **Score:** ${profile.lead_score}\n`;
  md += `**Total Committed:** ${usd(profile.total_committed_usd)} · **Funded:** ${usd(profile.total_funded_usd)}\n\n`;
  if (commitments.length) {
    md += `### Commitments\n\n| Round | Status | Amount |\n|-------|--------|--------|\n`;
    for (const c of commitments) md += `| \`${c.round_id?.slice(0, 8)}\` | ${c.status} | ${usd(c.amount_usd)} |\n`;
  }
  return { success: true, data: { profile, commitments }, displayMarkdown: md };
};

// ─── 8. get_pipeline_health ─────────────────────────────────────────────

const getPipelineHealth: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/capital', {
    action: 'pipeline-funnel',
    venture_id: input.venture_id,
  }, ctx);
  const funnel = data.funnel ?? {};
  const total = Object.values(funnel).reduce((s: number, n) => s + (n as number), 0);
  let md = `## Pipeline Health${input.venture_id ? ` — ${input.venture_id}` : ''}\n\n| Stage | Count | % |\n|-------|-------|---|\n`;
  for (const [stage, count] of Object.entries(funnel)) {
    const c = count as number;
    md += `| ${stage} | ${c} | ${total > 0 ? pct((c / total) * 100) : '—'} |\n`;
  }
  md += `\n**Total contacts:** ${total}`;
  return { success: true, data: funnel, displayMarkdown: md };
};

// ─── 9. get_capital_summary ─────────────────────────────────────────────

const getCapitalSummary: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/capital', {
    action: input.venture_id ? 'venture-summary' : 'global-summary',
    venture_id: input.venture_id,
  }, ctx);
  const s = data.summary ?? data;
  let md = `## Capital Summary${input.venture_id ? ` — ${input.venture_id}` : ' — Portfolio'}\n\n`;
  md += `**Total Raised:** ${usd(s.totalRaisedUsd ?? s.total_raised_usd ?? 0)}\n`;
  md += `**Total Committed:** ${usd(s.totalCommittedUsd ?? s.total_committed_usd ?? 0)}\n`;
  md += `**Active Rounds:** ${s.activeRounds ?? s.active_rounds_count ?? 0}\n`;
  md += `**Total Investors:** ${s.totalInvestors ?? s.investor_count ?? 0}\n`;
  if (s.topInvestors?.length) {
    md += `\n### Top Investors\n\n`;
    for (const t of s.topInvestors.slice(0, 5)) {
      md += `- **${t.name}** ${t.organizationName ? `(${t.organizationName})` : ''} — ${usd(t.totalCommittedUsd)} across ${t.ventureCount} venture(s)\n`;
    }
  }
  return { success: true, data: s, displayMarkdown: md };
};

// ─── 10. send_docusign ──────────────────────────────────────────────────

const sendDocusign: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/capital', {
    action: 'send-docusign',
    commitment_id: input.commitment_id,
    template_id: input.template_id,
  }, ctx);
  return {
    success: true,
    data,
    displayMarkdown: `DocuSign envelope **${data.envelope_id ?? '(pending)'}** queued for commitment \`${input.commitment_id}\`.`,
  };
};

// ─── 11. record_payment ─────────────────────────────────────────────────

const recordPayment: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/capital', {
    action: 'record-payment',
    commitment_id: input.commitment_id,
    payment_method: input.payment_method,
    payment_reference: input.payment_reference,
  }, ctx);
  return {
    success: true,
    data: data.commitment,
    displayMarkdown: `Payment recorded for commitment \`${input.commitment_id}\` via ${input.payment_method}. Status → **funded**.`,
  };
};

// ─── 12. distribute_tokens ──────────────────────────────────────────────

const distributeTokens: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/capital', {
    action: 'distribute-tokens',
    round_id: input.round_id,
    commitment_id: input.commitment_id,
  }, ctx);
  return {
    success: true,
    data,
    displayMarkdown: `Token distribution queued. ${data.distributed_count ?? 0} commitments processed.`,
  };
};

// ─── 13. publish_investor_update ────────────────────────────────────────

const publishInvestorUpdate: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/capital', {
    action: 'create-round-content',
    input: {
      ventureId: input.venture_id,
      roundId: input.round_id,
      role: 'update',
      contentType: 'capital_investor_update',
      title: input.title,
      bodyMarkdown: input.body_markdown,
      excerpt: input.excerpt,
      visibility: input.visibility || 'internal',
      status: 'approved',
      publishImmediately: !input.scheduled_for,
      scheduledFor: input.scheduled_for,
      tags: ['investor-update'],
      author: input.author,
    },
  }, ctx);
  const e = data.entry;
  return {
    success: true,
    data: e,
    displayMarkdown: `**Investor update ${e?.content?.publishedAt ? 'published' : 'scheduled'}:** ${e?.content?.title}`,
  };
};

// ─── 14. get_round_updates ──────────────────────────────────────────────

const getRoundUpdates: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/capital', {
    action: 'list-round-updates',
    round_id: input.round_id,
    include_drafts: input.include_drafts === true,
    limit: input.limit,
  }, ctx);
  const updates = data.updates ?? [];
  if (!updates.length) return { success: true, data: [], displayMarkdown: 'No updates yet.' };
  let md = `## Round Updates\n\n`;
  for (const u of updates) {
    const when = u.content?.publishedAt ? new Date(u.content.publishedAt).toLocaleDateString() : 'draft';
    md += `- **${u.content?.title}** _(${when})_ — ${u.content?.excerpt ?? ''}\n`;
  }
  return { success: true, data: updates, displayMarkdown: md };
};

// ─── 15. draft_round_description ────────────────────────────────────────

const draftRoundDescription: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/capital', {
    action: 'create-round-content',
    input: {
      ventureId: input.venture_id,
      roundId: input.round_id,
      role: 'description',
      contentType: 'capital_round_description',
      title: input.title,
      bodyMarkdown: input.body_markdown,
      excerpt: input.excerpt,
      visibility: input.publish ? 'public' : 'private',
      status: input.publish ? 'approved' : 'draft',
      isPrimary: true,
      publishImmediately: input.publish === true,
      tags: ['round-description'],
      author: input.author,
    },
  }, ctx);
  const e = data.entry;
  return {
    success: true,
    data: e,
    displayMarkdown: `**Round description ${input.publish ? 'published' : 'drafted'}:** ${e?.content?.title} (content \`${e?.contentId?.slice(0, 8)}\`)`,
  };
};

// ─── 16. create_distribution ────────────────────────────────────────────

const createDistribution: KitToolHandler = async (input, ctx) => {
  const recipients = Array.isArray(input.recipients) ? input.recipients : [];
  const data = await postJson('/api/capital', {
    action: 'create-distribution',
    input: {
      ventureId: input.venture_id,
      roundId: input.round_id,
      distributionType: input.distribution_type || 'dividend',
      totalAmount: Number(input.total_amount),
      currency: input.currency || 'USD',
      scheduledFor: input.scheduled_for,
      notes: input.notes,
      recipients: recipients.map((r: Record<string, unknown>) => ({
        contactId: r.contact_id,
        commitmentId: r.commitment_id,
        amount: Number(r.amount),
        amountUsd: Number(r.amount_usd ?? r.amount),
        currency: r.currency || 'USD',
        paymentMethod: r.payment_method,
      })),
    },
  }, ctx);
  const d = data.distribution;
  return {
    success: true,
    data: d,
    displayMarkdown: `**Distribution scheduled:** ${usd(d.totalAmount)} ${d.distributionType} across ${recipients.length} recipients \`${d.id?.slice(0, 8)}\``,
  };
};

// ─── 17. process_distribution ───────────────────────────────────────────

const processDistribution: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/capital', { action: 'process-distribution', id: input.distribution_id }, ctx);
  const d = data.distribution;
  return {
    success: true,
    data: d,
    displayMarkdown: `**Distribution ${d.status}:** paid ${usd(d.totalPaid)} to ${d.totalRecipients} recipients${d.journalEntryId ? ` · JE \`${d.journalEntryId.slice(0, 8)}\`` : ''}`,
  };
};

// ─── 18. list_distributions ─────────────────────────────────────────────

const listDistributions: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/capital', {
    action: 'list-distributions',
    venture_id: input.venture_id,
    round_id: input.round_id,
    status: input.status,
  }, ctx);
  const list = data.distributions ?? [];
  if (!list.length) return { success: true, data: [], displayMarkdown: 'No distributions.' };
  let md = `## Distributions\n\n| Type | Status | Total | Paid | Recipients |\n|------|--------|-------|------|------------|\n`;
  for (const d of list) md += `| ${d.distributionType} | ${d.status} | ${usd(d.totalAmount)} | ${usd(d.totalPaid)} | ${d.totalRecipients} |\n`;
  return { success: true, data: list, displayMarkdown: md };
};

// ─── 19. notify_investors ───────────────────────────────────────────────

const notifyInvestors: KitToolHandler = async (input, ctx) => {
  // Thin wrapper that uses publish_investor_update with a short title + body
  // to hit the portal timeline + launchpad (if visibility=public) + RAG.
  const data = await postJson('/api/capital', {
    action: 'create-round-content',
    input: {
      ventureId: input.venture_id,
      roundId: input.round_id,
      role: 'update',
      contentType: 'capital_investor_update',
      title: input.title || 'Update',
      bodyMarkdown: input.message,
      visibility: input.visibility || 'internal',
      status: 'approved',
      publishImmediately: true,
    },
  }, ctx);
  return {
    success: true,
    data: data.entry,
    displayMarkdown: `**Notified investors** via update \`${data.entry?.contentId?.slice(0, 8)}\``,
  };
};

// ─── 21. request_accreditation_verification ─────────────────────────────

const requestAccreditationVerification: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/capital', {
    action: 'initiate-accreditation-verification',
    contact_id: input.contact_id,
    return_url: input.return_url,
  }, ctx);
  const r = data.request;
  if (!r) return { success: false, error: 'verification request produced no response' };
  let md = `## Accreditation verification requested\n\n`;
  md += `**Contact:** ${r.contactId}\n**Vendor request id:** \`${r.requestId}\`\n**Status:** ${r.status}\n\n`;
  md += `**Hosted URL (send to investor):**\n\`${r.hostedUrl}\`\n\n`;
  md += `_Completion will arrive at the VerifyInvestor webhook; an AccreditedInvestorCredential VC issues automatically on verified status._`;
  return { success: true, data: r, displayMarkdown: md };
};

// ─── 20. screen_investor_ofac ───────────────────────────────────────────

const screenInvestorOfac: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/capital', {
    action: 'screen-contact-ofac',
    contact_id: input.contact_id,
    dob: input.dob,
  }, ctx);
  const e = data.event;
  if (!e) return { success: false, error: 'screening produced no event — contact missing full_name?' };
  const iconByOutcome: Record<string, string> = { clear: '✅', review: '⚠️', match: '🚨' };
  const icon = iconByOutcome[e.outcome] ?? '•';
  let md = `## ${icon} OFAC screening — ${e.outcome.toUpperCase()}\n\n`;
  md += `**Contact:** ${e.contactId}\n**Score:** ${e.score.toFixed(3)} (threshold ${e.matchDiagnostics.threshold})\n**Strategy:** ${e.matchDiagnostics.strategy}\n`;
  if (e.matchedRecord) {
    md += `\n**Matched record**\n- Name: ${e.matchedRecord.name ?? '—'}\n- List: ${e.matchedRecord.list ?? '—'}\n- Programs: ${(e.matchedRecord.programs ?? []).join(', ') || '—'}\n- Source id: ${e.matchedRecord.sourceEntryId ?? '—'}\n`;
  }
  md += `\n_Result stamped on capital_investor_profile.metadata.compliance.ofac._`;
  return { success: true, data: e, displayMarkdown: md };
};

// ─── Manifest ───────────────────────────────────────────────────────────

export const manifest: KitManifest = {
  id: 'capital-ops',
  name: 'EdgeIQ Capital',
  version: '0.1.0',
  description: 'Cap table, fundraising rounds, investor commitments, pipeline health, and the launchpad ledger.',
  author: 'MCV',
  capabilities: ['network'],
  runtime: 'inline',
  ventureScope: '*',
  instructions:
    'Use these tools when the user asks about fundraising, cap table, rounds, commitments, investors, ' +
    'KYC, accreditation, pipeline, raise progress, or anything related to capital formation. ' +
    'Always pass venture_id when scoped to a single venture; omit for portfolio-wide queries.',
  tools: [
    {
      name: 'list_rounds',
      description: 'List funding rounds, optionally filtered by venture or status.',
      input_schema: {
        type: 'object',
        properties: {
          venture_id: { type: 'string', description: 'Venture slug (e.g. "betedge", "futurestate"). Omit for all ventures.' },
          status: { type: 'string', enum: ['draft', 'preview', 'open', 'closing', 'closed', 'funded', 'cancelled'] },
        },
      },
    },
    {
      name: 'get_round_detail',
      description: 'Get full detail for a single round including progress, terms, and timeline.',
      input_schema: { type: 'object', properties: { round_id: { type: 'string' } }, required: ['round_id'] },
    },
    {
      name: 'list_commitments',
      description: 'List commitments, optionally filtered by venture, round, contact, or status.',
      input_schema: {
        type: 'object',
        properties: {
          venture_id: { type: 'string' },
          round_id: { type: 'string' },
          contact_id: { type: 'string' },
          status: { type: 'string' },
        },
      },
    },
    {
      name: 'create_commitment',
      description: 'Create a new commitment from an investor for a round. Default status is soft_commit.',
      input_schema: {
        type: 'object',
        properties: {
          venture_id: { type: 'string' },
          contact_id: { type: 'string', description: 'crm_contacts.id of the investor' },
          round_id: { type: 'string' },
          amount: { type: 'number', description: 'Amount in chosen currency' },
          amount_usd: { type: 'number', description: 'Amount normalized to USD' },
          currency: { type: 'string', description: 'Currency code (default USD)' },
          status: { type: 'string', enum: ['interest', 'soft_commit', 'reserved'] },
          notes: { type: 'string' },
        },
        required: ['venture_id', 'contact_id', 'round_id', 'amount'],
      },
    },
    {
      name: 'update_commitment_status',
      description: 'Move a commitment to the next status (validates against state machine).',
      input_schema: {
        type: 'object',
        properties: {
          commitment_id: { type: 'string' },
          next_status: { type: 'string', enum: ['soft_commit', 'reserved', 'pending_docs', 'signed', 'pending_wire', 'funded', 'token_pending', 'token_distributed', 'refunded', 'withdrawn'] },
        },
        required: ['commitment_id', 'next_status'],
      },
    },
    {
      name: 'list_investors',
      description: 'List investor profiles with accreditation, KYC, lead score, and commitment totals.',
      input_schema: {
        type: 'object',
        properties: {
          venture_id: { type: 'string' },
          stage: { type: 'string' },
          contact_type: { type: 'string', enum: ['prospect', 'angel', 'vc', 'lp', 'institutional', 'strategic_partner', 'advisor'] },
        },
      },
    },
    {
      name: 'get_investor_position',
      description: 'Get cross-venture position for a single investor (profile + all commitments).',
      input_schema: { type: 'object', properties: { contact_id: { type: 'string' } }, required: ['contact_id'] },
    },
    {
      name: 'get_pipeline_health',
      description: 'Show the investor pipeline funnel (cold → warm → engaged → committed → funded).',
      input_schema: { type: 'object', properties: { venture_id: { type: 'string' } } },
    },
    {
      name: 'get_capital_summary',
      description: 'Portfolio-wide or per-venture summary: total raised, committed, active rounds, top investors.',
      input_schema: { type: 'object', properties: { venture_id: { type: 'string', description: 'Omit for portfolio summary' } } },
    },
    {
      name: 'send_docusign',
      description: 'Send a DocuSign envelope for a commitment using a stored template.',
      input_schema: {
        type: 'object',
        properties: { commitment_id: { type: 'string' }, template_id: { type: 'string' } },
        required: ['commitment_id'],
      },
    },
    {
      name: 'record_payment',
      description: 'Mark a commitment as funded with payment method + reference (wire ref or tx hash).',
      input_schema: {
        type: 'object',
        properties: {
          commitment_id: { type: 'string' },
          payment_method: { type: 'string', enum: ['wire_usd', 'wire_cad', 'wire_eur', 'ach', 'crypto_usdc', 'crypto_sol', 'edge_token', 'check', 'other'] },
          payment_reference: { type: 'string' },
        },
        required: ['commitment_id', 'payment_method', 'payment_reference'],
      },
    },
    {
      name: 'distribute_tokens',
      description: 'Trigger token distribution for a round or specific commitment (token/hybrid lanes).',
      input_schema: {
        type: 'object',
        properties: { round_id: { type: 'string' }, commitment_id: { type: 'string' } },
      },
    },
    {
      name: 'publish_investor_update',
      description: 'Publish (or schedule) an investor update for a round — content-backed, versioned, surfaces in portal timeline.',
      input_schema: {
        type: 'object',
        properties: {
          venture_id: { type: 'string' },
          round_id: { type: 'string' },
          title: { type: 'string' },
          body_markdown: { type: 'string', description: 'Full markdown body of the update' },
          excerpt: { type: 'string', description: 'One-line summary surfaced in the timeline' },
          visibility: { type: 'string', enum: ['internal', 'published', 'public'], description: 'Default internal = investor-portal-gated' },
          scheduled_for: { type: 'string', description: 'ISO timestamp. Omit to publish immediately.' },
          author: { type: 'string' },
        },
        required: ['venture_id', 'round_id', 'title', 'body_markdown'],
      },
    },
    {
      name: 'get_round_updates',
      description: 'List investor updates for a round (ordered by published_at desc). Used by NAOS to summarize the update timeline.',
      input_schema: {
        type: 'object',
        properties: {
          round_id: { type: 'string' },
          include_drafts: { type: 'boolean' },
          limit: { type: 'number' },
        },
        required: ['round_id'],
      },
    },
    {
      name: 'draft_round_description',
      description: 'Create the long-form round description content (rendered on the public launchpad page). Draft by default; pass publish=true to ship live.',
      input_schema: {
        type: 'object',
        properties: {
          venture_id: { type: 'string' },
          round_id: { type: 'string' },
          title: { type: 'string' },
          body_markdown: { type: 'string' },
          excerpt: { type: 'string' },
          publish: { type: 'boolean', description: 'If true, visibility=public + status=approved immediately' },
          author: { type: 'string' },
        },
        required: ['venture_id', 'round_id', 'title', 'body_markdown'],
      },
    },
    {
      name: 'create_distribution',
      description: 'Schedule a dividend/yield/interest distribution for investors of a round. Provide per-recipient list with amount + payment method.',
      input_schema: {
        type: 'object',
        properties: {
          venture_id: { type: 'string' },
          round_id: { type: 'string', description: 'Optional — round context for the payout' },
          distribution_type: { type: 'string', enum: ['dividend','interest','yield','token_airdrop','buyback','return_of_capital','fee_rebate','other'] },
          total_amount: { type: 'number' },
          currency: { type: 'string' },
          scheduled_for: { type: 'string', description: 'ISO timestamp. Omit to process immediately via process_distribution.' },
          notes: { type: 'string' },
          recipients: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                contact_id: { type: 'string' },
                commitment_id: { type: 'string' },
                amount: { type: 'number' },
                amount_usd: { type: 'number' },
                currency: { type: 'string' },
                payment_method: { type: 'string' },
              },
              required: ['contact_id', 'amount'],
            },
          },
        },
        required: ['venture_id', 'total_amount', 'recipients'],
      },
    },
    {
      name: 'process_distribution',
      description: 'Execute a scheduled distribution: post journal entries (if Ledger configured), route payouts via payment router (if configured), mark recipients paid. Emits capital.distribution.paid event.',
      input_schema: {
        type: 'object',
        properties: { distribution_id: { type: 'string' } },
        required: ['distribution_id'],
      },
    },
    {
      name: 'list_distributions',
      description: 'List distributions for a venture, optionally filtered by round or status.',
      input_schema: {
        type: 'object',
        properties: {
          venture_id: { type: 'string' },
          round_id: { type: 'string' },
          status: { type: 'string', enum: ['scheduled','processing','partial','completed','failed','cancelled'] },
        },
        required: ['venture_id'],
      },
    },
    {
      name: 'request_accreditation_verification',
      description: 'Start a VerifyInvestor accreditation flow for a Capital contact. Returns a hosted URL the investor visits. Completion webhook auto-issues an AccreditedInvestorCredential VC and stamps it on the investor profile.',
      input_schema: {
        type: 'object',
        properties: {
          contact_id: { type: 'string', description: 'crm_contacts.id of the investor to verify.' },
          return_url: { type: 'string', description: 'Optional redirect URL after the investor completes the flow.' },
        },
        required: ['contact_id'],
      },
    },
    {
      name: 'screen_investor_ofac',
      description: 'Run an OFAC SDN screening on a Capital investor contact. Stamps capital_investor_profile.metadata.compliance.ofac and emits a capital.compliance.match / review_needed notification when non-clear.',
      input_schema: {
        type: 'object',
        properties: {
          contact_id: { type: 'string', description: 'crm_contacts.id of the investor to screen.' },
          dob: { type: 'string', description: 'Optional ISO date of birth to strengthen the match. Overrides contact metadata.date_of_birth when supplied.' },
        },
        required: ['contact_id'],
      },
    },
    {
      name: 'notify_investors',
      description: 'Send a quick update to investors of a round (publishes capital_investor_update content immediately). Short-circuit of publish_investor_update.',
      input_schema: {
        type: 'object',
        properties: {
          venture_id: { type: 'string' },
          round_id: { type: 'string' },
          title: { type: 'string' },
          message: { type: 'string', description: 'Markdown body' },
          visibility: { type: 'string', enum: ['internal','public'], description: 'internal = portal investors; public = launchpad' },
        },
        required: ['venture_id', 'round_id', 'message'],
      },
    },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  list_rounds: listRounds,
  get_round_detail: getRoundDetail,
  list_commitments: listCommitments,
  create_commitment: createCommitment,
  update_commitment_status: updateCommitmentStatus,
  list_investors: listInvestors,
  get_investor_position: getInvestorPosition,
  get_pipeline_health: getPipelineHealth,
  get_capital_summary: getCapitalSummary,
  send_docusign: sendDocusign,
  record_payment: recordPayment,
  distribute_tokens: distributeTokens,
  publish_investor_update: publishInvestorUpdate,
  get_round_updates: getRoundUpdates,
  draft_round_description: draftRoundDescription,
  create_distribution: createDistribution,
  process_distribution: processDistribution,
  list_distributions: listDistributions,
  notify_investors: notifyInvestors,
  screen_investor_ofac: screenInvestorOfac,
  request_accreditation_verification: requestAccreditationVerification,
};
