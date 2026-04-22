// MCV Foundation OS kit — NAOS tools for IP portfolio, counsel engagements,
// filings, domain acquisitions, naming ratifications, and corpus ingestion.
// Backed by /api/foundation (→ @mcv/foundation-sdk services).

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

// ─── 1. list_ip_marks ───────────────────────────────────────────────────────

const listIpMarks: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/foundation', {
    action: 'list-ip-marks',
    mark_kind: input.mark_kind,
    priority_tier: input.priority_tier,
    status: input.status,
    jurisdictions: input.jurisdictions,
    limit: input.limit ?? 50,
  }, ctx);
  const marks = data.marks ?? [];
  if (!marks.length) return { success: true, data: [], displayMarkdown: 'No IP marks found.' };
  let md = `## IP Portfolio (${marks.length})\n\n| Mark | Kind | Tier | Jurisdictions | Status |\n|------|------|------|---------------|--------|\n`;
  for (const m of marks.slice(0, 50)) {
    md += `| ${m.markText} | ${m.markKind} | ${m.priorityTier} | ${(m.jurisdictions ?? []).join('/') || '—'} | ${m.status} |\n`;
  }
  if (marks.length > 50) md += `\n_Showing 50 of ${marks.length}. Narrow with filters._\n`;
  return { success: true, data: marks, displayMarkdown: md };
};

// ─── 2. create_ip_mark ──────────────────────────────────────────────────────

const createIpMark: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/foundation', { action: 'create-ip-mark', mark: input }, ctx);
  const m = data.mark;
  return {
    success: true,
    data: m,
    displayMarkdown: `✓ Created IP mark: **${m.markText}** (${m.markKind}, ${m.priorityTier}). ID: ${m.id}`,
  };
};

// ─── 3. update_ip_mark_status ───────────────────────────────────────────────

const updateIpMarkStatus: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/foundation', {
    action: 'update-ip-mark-status', id: input.id, status: input.status,
  }, ctx);
  return { success: true, data: data.mark, displayMarkdown: `✓ ${data.mark.markText} → ${data.mark.status}` };
};

// ─── 4. file_ip_mark (records a filing + emits ledger journal) ──────────────

const fileIpMark: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/foundation', {
    action: 'record-filing',
    filing: {
      ipMarkId: input.ip_mark_id,
      filingType: input.filing_type,
      jurisdiction: input.jurisdiction,
      counselEngagementId: input.counsel_engagement_id,
      feeFilingUsd: input.fee_filing_usd ?? 0,
      feeCounselUsd: input.fee_counsel_usd ?? 0,
      filingNumber: input.filing_number,
      notes: input.notes,
    },
  }, ctx);
  const f = data.filing;
  const ledgerState = f.capitalFlowId ? `✓ Journal ${f.capitalFlowId.slice(0, 8)}` : '⚠ Ledger skipped';
  return {
    success: true,
    data: f,
    displayMarkdown:
      `✓ Filing recorded: **${f.filingType}** in ${f.jurisdiction} — ${usd(f.feeTotalUsd)}\n\n` +
      `Ledger: ${ledgerState}`,
  };
};

// ─── 5. read_ip_budget_rollup ───────────────────────────────────────────────

const readIpBudgetRollup: KitToolHandler = async (_input, ctx) => {
  const data = await postJson('/api/foundation', { action: 'read-ip-budget-rollup' }, ctx);
  const r = data.rollup;
  const low = r.yearOneEnvelopeLow;
  const high = r.yearOneEnvelopeHigh;
  const pct = r.allTotal > 0 ? ((r.allTotal / high) * 100).toFixed(1) : '0.0';
  const md =
    `## IP Filing Budget — Year One\n\n` +
    `**Spent to date:** ${usd(r.allTotal)} (${pct}% of ${usd(high)} envelope ceiling)\n\n` +
    `| Category | Spend |\n|----------|-------|\n` +
    `| P0 tier | ${usd(r.p0Total)} |\n| P1 tier | ${usd(r.p1Total)} |\n| P2 tier | ${usd(r.p2Total)} |\n` +
    `| Madrid extensions | ${usd(r.madridTotal)} |\n| Utility patents | ${usd(r.utilityTotal)} |\n\n` +
    `**Envelope**: ${usd(low)} – ${usd(high)} (per IP Inventory §7.5).`;
  return { success: true, data: r, displayMarkdown: md };
};

// ─── 6. list_counsel_engagements ────────────────────────────────────────────

const listCounselEngagements: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/foundation', {
    action: 'list-counsel-engagements', workstream: input.workstream,
  }, ctx);
  const engs = data.engagements ?? [];
  if (!engs.length) return { success: true, data: [], displayMarkdown: 'No counsel engagements yet.' };
  let md = `## Counsel Engagements (${engs.length})\n\n| Firm | Workstream | Status | NDA | Budget (used / alloc) |\n|------|------------|--------|-----|----------------------|\n`;
  for (const e of engs) {
    const nda = e.ndaExecutedAt ? '✓' : (e.status === 'nda_sent' ? '…' : '—');
    md += `| ${e.firmName} | ${e.workstream} | ${e.status} | ${nda} | ${usd(e.budgetConsumedUsd)} / ${usd(e.budgetAllocatedUsd)} |\n`;
  }
  return { success: true, data: engs, displayMarkdown: md };
};

// ─── 7. record_counsel_engagement ───────────────────────────────────────────

const recordCounselEngagement: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/foundation', {
    action: 'record-counsel-engagement',
    engagement: {
      firmName: input.firm_name,
      workstream: input.workstream,
      contactName: input.contact_name,
      contactEmail: input.contact_email,
      ndaTemplateUsed: input.nda_template_used,
      status: input.status ?? 'prospecting',
      budgetAllocatedUsd: input.budget_allocated_usd,
      notes: input.notes,
    },
  }, ctx);
  const e = data.engagement;
  return {
    success: true, data: e,
    displayMarkdown: `✓ Engagement recorded: **${e.firmName}** — ${e.workstream} workstream. Status: ${e.status}.`,
  };
};

// ─── 8. mark_nda_executed ───────────────────────────────────────────────────

const markNdaExecuted: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/foundation', {
    action: 'mark-nda-executed', id: input.engagement_id, executed_at: input.executed_at,
  }, ctx);
  const e = data.engagement;
  return {
    success: true, data: e,
    displayMarkdown: `✓ NDA executed: **${e.firmName}** (${e.workstream}). Trade-secret disclosure now unlocked for this firm.`,
  };
};

// ─── 9. list_counsel_tasks ──────────────────────────────────────────────────

const listCounselTasks: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/foundation', {
    action: 'list-counsel-tasks', workstream: input.workstream,
  }, ctx);
  const tasks = data.tasks ?? [];
  if (!tasks.length) return { success: true, data: [], displayMarkdown: 'No counsel tasks seeded yet — run `run_full_counsel_ingestion`.' };
  let md = `## Counsel Tasks (${tasks.length})\n\n| Code | Workstream | Title | Status | Critical |\n|------|-----------|-------|--------|----------|\n`;
  for (const t of tasks) {
    md += `| **${t.taskCode}** | ${t.workstream} | ${t.title} | ${t.status} | ${t.criticalPath ? '🔥' : ''} |\n`;
  }
  return { success: true, data: tasks, displayMarkdown: md };
};

// ─── 10. list_critical_path_tasks ───────────────────────────────────────────

const listCriticalPathTasks: KitToolHandler = async (_input, ctx) => {
  const data = await postJson('/api/foundation', { action: 'list-critical-path-tasks' }, ctx);
  const tasks = data.tasks ?? [];
  if (!tasks.length) return { success: true, data: [], displayMarkdown: '✓ No critical-path tasks outstanding.' };
  let md = `## Critical Path — ${tasks.length} open\n\n`;
  for (const t of tasks) md += `- **${t.taskCode}** — ${t.title} (${t.status})${t.dueAt ? ` · due ${t.dueAt.slice(0, 10)}` : ''}\n`;
  return { success: true, data: tasks, displayMarkdown: md };
};

// ─── 11. advance_counsel_task ───────────────────────────────────────────────

const advanceCounselTask: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/foundation', {
    action: 'advance-counsel-task', task_code: input.task_code, new_status: input.new_status,
  }, ctx);
  return { success: true, data: data.task, displayMarkdown: `✓ ${data.task.taskCode} → ${data.task.status}` };
};

// ─── 12. assign_counsel_task ────────────────────────────────────────────────

const assignCounselTask: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/foundation', {
    action: 'assign-counsel-task', task_code: input.task_code, engagement_id: input.engagement_id,
  }, ctx);
  return {
    success: true, data: data.task,
    displayMarkdown: `✓ ${data.task.taskCode} assigned to engagement ${data.task.assignedEngagementId ?? '(unassigned)'}.`,
  };
};

// ─── 13. render_hour3_email ─────────────────────────────────────────────────

const renderHour3Email: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/foundation', {
    action: 'render-hour3-email', workstream: input.workstream,
  }, ctx);
  const e = data.email;
  const recipient = e.recipient.contactName
    ? `${e.recipient.contactName} @ ${e.recipient.firmName}`
    : e.recipient.firmName;
  const withheld = e.withheldMarks > 0 ? `\n> ⚠ **${e.withheldMarks} trade-secret marks withheld** (NDA not yet executed).` : '';
  const md =
    `## Hour-3 Email Draft — ${e.workstream}\n\n**To:** ${recipient}${e.recipient.contactEmail ? ` <${e.recipient.contactEmail}>` : ''}\n` +
    `**Subject:** ${e.subject}\n\n---\n\n${e.body}${withheld}\n\n` +
    `---\n\n_${e.redactedMarks.length} marks included · ready to copy/send_`;
  return { success: true, data: e, displayMarkdown: md };
};

// ─── 14. list_acquisition_orders ────────────────────────────────────────────

const listAcquisitionOrders: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/foundation', {
    action: 'list-acquisition-orders',
    urgency_tier: input.urgency_tier,
    status: input.status,
    blocks_disclosure: input.blocks_disclosure,
  }, ctx);
  const orders = data.orders ?? [];
  if (!orders.length) return { success: true, data: [], displayMarkdown: 'No acquisition orders found.' };
  const badge = (t: string) => ({ red_7day: '🔴', orange_30day: '🟠', yellow_90day: '🟡', green_defensive: '🟢' }[t] ?? '');
  let md = `## Acquisition Queue (${orders.length})\n\n| Urgency | Asset | Status | Blocks Disclosure |\n|---------|-------|--------|-------------------|\n`;
  for (const o of orders) {
    md += `| ${badge(o.urgencyTier)} ${o.urgencyTier} | ${o.assetIdentifier} | ${o.status} | ${o.blocksDisclosure ? '**YES** (' + o.blocksVentureName + ')' : 'no'} |\n`;
  }
  return { success: true, data: orders, displayMarkdown: md };
};

// ─── 15. seed_urgent_acquisitions ───────────────────────────────────────────

const seedUrgentAcquisitions: KitToolHandler = async (_input, ctx) => {
  const data = await postJson('/api/foundation', { action: 'seed-urgent-acquisitions' }, ctx);
  const r = data.result;
  return {
    success: true, data: r,
    displayMarkdown:
      `✓ Urgent acquisitions seeded: **${r.inserted} new**, ${r.already} already present.\n\n` +
      `Covers: futurestate.app / .io / .xyz (🔴 — blocks Hunter disclosure), naos.ai (🟠), coretriangle.com (🟠).`,
  };
};

// ─── 16. mark_acquisition_acquired ──────────────────────────────────────────

const markAcquisitionAcquired: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/foundation', {
    action: 'mark-acquisition-acquired',
    id: input.id, registrar: input.registrar, acquired_at: input.acquired_at,
  }, ctx);
  const o = data.order;
  return {
    success: true, data: o,
    displayMarkdown: `✓ **${o.assetIdentifier}** acquired at ${o.acquiredRegistrar} on ${o.acquiredAt?.slice(0, 10)}.`,
  };
};

// ─── 17. list_naming_ratifications ──────────────────────────────────────────

const listNamingRatifications: KitToolHandler = async (_input, ctx) => {
  const data = await postJson('/api/foundation', { action: 'list-naming-ratifications' }, ctx);
  const rats = data.ratifications ?? [];
  let md = `## Naming Ratifications (${rats.length})\n\n| Deprecated | → | Ratified | Context |\n|------------|---|----------|---------|\n`;
  for (const r of rats) md += `| ${r.deprecatedName} | → | **${r.ratifiedName}** | ${r.context} |\n`;
  return { success: true, data: rats, displayMarkdown: md };
};

// ─── 18. scan_naming_occurrences (Node-only — dispatches to script) ─────────

const scanNamingOccurrences: KitToolHandler = async (input, ctx) => {
  void ctx;                                   // Node-only stub — no HTTP round-trip
  const paths = (input.paths as string[] | undefined)?.join(' ') ?? '. (repo root)';
  return {
    success: true,
    data: null,
    displayMarkdown:
      `ℹ️ Filesystem scan is Node-only. Run:\n\n` +
      `\`\`\`bash\npnpm tsx scripts/foundation/naming-scanner.ts scan ${paths}\n\`\`\`\n\n` +
      `Then call \`list_naming_ratifications\` to see the 6 locked mappings, and \`foundation.list_naming_occurrences\` via chat to review scan output.`,
  };
};

// ─── 19. approve_naming_batch ───────────────────────────────────────────────

const approveNamingBatch: KitToolHandler = async (input, ctx) => {
  const data = await postJson('/api/foundation', {
    action: 'approve-naming-batch',
    occurrence_ids: input.occurrence_ids,
    approver: input.approver,
    notes: input.notes,
  }, ctx);
  const r = data.result;
  return {
    success: true, data: r,
    displayMarkdown:
      `✓ Batch **${r.batch.id.slice(0, 8)}** approved by ${r.batch.approvedBy}: **${r.occurrences.length} occurrences**.\n\n` +
      `Next step: run \`pnpm tsx scripts/foundation/naming-scanner.ts apply ${r.batch.id}\` to perform the git commit.`,
  };
};

// ─── 20. apply_approved_naming (Node-only — dispatches to script) ──────────

const applyApprovedNaming: KitToolHandler = async (input, ctx) => {
  void ctx;                                   // Node-only stub
  return {
    success: true, data: null,
    displayMarkdown:
      `ℹ️ Batch apply is Node-only (writes files + creates git commit). Run:\n\n` +
      `\`\`\`bash\npnpm tsx scripts/foundation/naming-scanner.ts apply ${input.batch_id}\n\`\`\`\n\n` +
      `The script reads the approved occurrences, applies replacements, commits, and calls \`record-batch-applied\` to stamp the commit SHA.`,
  };
};

// ─── 21. rollback_naming_batch ──────────────────────────────────────────────

const rollbackNamingBatch: KitToolHandler = async (input, ctx) => {
  void ctx;                                   // Node-only stub
  return {
    success: true, data: null,
    displayMarkdown:
      `ℹ️ Rollback is Node-only. Run:\n\n` +
      `\`\`\`bash\npnpm tsx scripts/foundation/naming-scanner.ts rollback ${input.batch_id}\n\`\`\`\n\n` +
      `The script reverts to the batch's pre_commit_sha, then calls \`record-rollback\`.`,
  };
};

// ─── 22. get_entity_stack ───────────────────────────────────────────────────

const getEntityStack: KitToolHandler = async (_input, ctx) => {
  const data = await postJson('/api/foundation', { action: 'get-entity-stack' }, ctx);
  const nodes = data.stack?.nodes ?? [];
  const crown = nodes.filter((n: { is_crown?: boolean }) => n.is_crown);
  let md = `## Entity Stack — ${nodes.length} active entities\n\n`;
  if (crown.length) {
    md += `### 👑 Crown entities (succession-locked)\n`;
    for (const c of crown) md += `- **${c.label}** (${c.id}) — ${c.jurisdiction} · ${c.entity_type}\n`;
    md += `\n`;
  }
  md += `### All entities\n`;
  for (const n of nodes) {
    const indent = n.parent_entity_id ? '  → ' : '- ';
    md += `${indent}${n.is_crown ? '👑 ' : ''}**${n.label}** (${n.jurisdiction}, ${n.entity_type})\n`;
  }
  return { success: true, data: data.stack, displayMarkdown: md };
};

// ─── 23. check_blue_marlin_gate ─────────────────────────────────────────────

const checkBlueMarlinGate: KitToolHandler = async (_input, ctx) => {
  const data = await postJson('/api/foundation', { action: 'check-blue-marlin-gate' }, ctx);
  const s = data.status;
  const emoji = s.ready ? '🟢' : (s.p0Green > 0 ? '🟡' : '🔴');
  let md = `## ${emoji} Blue Marlin Gate — ${s.p0Green} / ${s.p0Total} P0 marks green\n\n`;
  md += s.ready
    ? `**✅ Ready.** All P0 marks are filed or better. Safe to open Gary/Joel/Blue Marlin pitch.\n`
    : `**⛔ NOT READY.** ${s.blockers.length} blockers:\n${s.blockers.map((b: string) => `- ${b}`).join('\n')}\n`;
  md += `\n_Checked at ${s.checkedAt}_`;
  return { success: true, data: s, displayMarkdown: md };
};

// ─── 24. run_full_counsel_ingestion (Node-only — dispatches to script) ─────

const runFullCounselIngestion: KitToolHandler = async (input, ctx) => {
  void input; void ctx;                       // Node-only stub — no inputs used, no HTTP round-trip
  return {
    success: true, data: null,
    displayMarkdown:
      `ℹ️ Counsel corpus ingestion is Node-only. Run:\n\n` +
      `\`\`\`bash\npnpm tsx scripts/foundation/ingest-counsel-corpus.ts\n\`\`\`\n\n` +
      `Parses all 12 .docs/counsel/ files (+ 6 CSVs), upserts to foundation tables, chunks into storage_chunks. Idempotent — re-running inserts 0.`,
  };
};

// ─── Manifest ───────────────────────────────────────────────────────────────

export const manifest: KitManifest = {
  id: 'foundation',
  name: 'MCV Foundation OS',
  version: '0.1.0',
  description:
    'IP portfolio (trademarks/patents/copyrights/trade secrets), counsel engagements and task tables (CT/IP/SEC), ' +
    'filings with ledger emission, domain acquisition queue, naming ratifications, corpus ingestion, entity stack, and Blue Marlin gate.',
  author: 'MCV',
  capabilities: ['network'],
  runtime: 'inline',
  ventureScope: '*',
  instructions:
    'Use these tools for anything touching MCV legal architecture: trademarks, patents, copyrights, ' +
    'counsel firms, filing status, counsel task codes (CT-*, IP-*, SEC-*), Hour-3 outreach emails, domain ' +
    'acquisitions, entity structure (Root Trust / MCV Holdings Ltd / MCV Inc. / venture SPVs), naming ' +
    'ratifications (Sovereign Citizen→Citizen, Covenant→Root, etc.), or readiness gates before institutional pitches.',
  tools: [
    { name: 'list_ip_marks', description: 'List IP marks (trademarks / patents / copyrights / trade_secret), optionally filtered by kind, tier, status, or jurisdiction.',
      input_schema: { type: 'object', properties: {
        mark_kind: { type: 'string', enum: ['trademark', 'patent', 'copyright', 'trade_secret'] },
        priority_tier: { type: 'string', description: 'P0 (30 day), P1 (90 day), P2 (year-1), P3 (watch), DNF (do-not-file), PP0/PP1/PP2 for patents' },
        status: { type: 'string' }, jurisdictions: { type: 'array', items: { type: 'string' } },
        limit: { type: 'number' },
      } } },
    { name: 'create_ip_mark', description: 'Register a new IP mark row. Patent-specific fields (claim_summary, novelty_hook) only used when mark_kind=patent.',
      input_schema: { type: 'object', required: ['markText', 'markKind', 'priorityTier'], properties: {
        markText: { type: 'string' }, markKind: { type: 'string' }, priorityTier: { type: 'string' },
        classes: { type: 'array' }, jurisdictions: { type: 'array' }, ownerEntityId: { type: 'string' },
        claimSummary: { type: 'string' }, noveltyHook: { type: 'string' },
        sourceDoc: { type: 'string' }, sourceSection: { type: 'string' },
      } } },
    { name: 'update_ip_mark_status', description: 'Transition an IP mark through its lifecycle (identified → clearance_in_progress → filed → published → registered).',
      input_schema: { type: 'object', required: ['id', 'status'], properties: { id: { type: 'string' }, status: { type: 'string' } } } },
    { name: 'file_ip_mark', description: 'Record a filing action (TM filing, provisional patent, etc.). Automatically emits DR 5180 / CR 2010|1010 double-entry journal via LedgerAdapter.',
      input_schema: { type: 'object', required: ['ip_mark_id', 'filing_type', 'jurisdiction'], properties: {
        ip_mark_id: { type: 'string' }, filing_type: { type: 'string' }, jurisdiction: { type: 'string' },
        counsel_engagement_id: { type: 'string' }, fee_filing_usd: { type: 'number' }, fee_counsel_usd: { type: 'number' },
        filing_number: { type: 'string' }, notes: { type: 'string' },
      } } },
    { name: 'read_ip_budget_rollup', description: 'Rollup of IP filing fees paid to date — P0/P1/P2 tiers, Madrid extensions, utility patents — vs IP Inventory §7.5 $266–351K year-one envelope.',
      input_schema: { type: 'object', properties: {} } },
    { name: 'list_counsel_engagements', description: 'List law firm engagements across the 3 workstreams (corp_tax, ip, securities).',
      input_schema: { type: 'object', properties: { workstream: { type: 'string', enum: ['corp_tax', 'ip', 'securities'] } } } },
    { name: 'record_counsel_engagement', description: 'Register a new counsel firm. Status defaults to prospecting (pre-NDA).',
      input_schema: { type: 'object', required: ['firm_name', 'workstream'], properties: {
        firm_name: { type: 'string' }, workstream: { type: 'string' }, contact_name: { type: 'string' },
        contact_email: { type: 'string' }, nda_template_used: { type: 'string', enum: ['capital', 'partner'] },
        budget_allocated_usd: { type: 'number' }, notes: { type: 'string' },
      } } },
    { name: 'mark_nda_executed', description: 'Mark an engagement as NDA-executed. CRITICAL: this unlocks trade-secret disclosure in render_hour3_email for that firm.',
      input_schema: { type: 'object', required: ['engagement_id'], properties: { engagement_id: { type: 'string' }, executed_at: { type: 'string' } } } },
    { name: 'list_counsel_tasks', description: 'List counsel tasks (CT-1..CT-9 corp/tax, IP-1..IP-7, SEC-1..SEC-6 = 22 canonical codes).',
      input_schema: { type: 'object', properties: { workstream: { type: 'string' } } } },
    { name: 'list_critical_path_tasks', description: 'Open critical-path tasks — the subset that gates the Blue Marlin disclosure window.',
      input_schema: { type: 'object', properties: {} } },
    { name: 'advance_counsel_task', description: 'Move a task through backlog → proposed → approved → in_progress → review → done. Pass task_code (e.g. CT-1).',
      input_schema: { type: 'object', required: ['task_code', 'new_status'], properties: { task_code: { type: 'string' }, new_status: { type: 'string' } } } },
    { name: 'assign_counsel_task', description: 'Assign a task to a counsel engagement, or unassign (pass null).',
      input_schema: { type: 'object', required: ['task_code'], properties: { task_code: { type: 'string' }, engagement_id: { type: 'string' } } } },
    { name: 'render_hour3_email', description: 'Render the Hour-3 outreach email for a workstream, populated with current P0/P1 marks and urgent acquisitions. Trade-secret marks are WITHHELD until NDA executed with the target firm.',
      input_schema: { type: 'object', required: ['workstream'], properties: { workstream: { type: 'string', enum: ['corp_tax', 'ip', 'securities'] } } } },
    { name: 'list_acquisition_orders', description: 'List the domain / trademark / patent buy queue. Filter by urgency (🔴 red_7day, 🟠 orange_30day, 🟡 yellow_90day, 🟢 green_defensive).',
      input_schema: { type: 'object', properties: {
        urgency_tier: { type: 'string' }, status: { type: 'string' }, blocks_disclosure: { type: 'boolean' },
      } } },
    { name: 'seed_urgent_acquisitions', description: 'Idempotent seed of the 5 🔴🟠 blocker entries (futurestate.app/.io/.xyz + naos.ai + coretriangle.com). Safe to re-run.',
      input_schema: { type: 'object', properties: {} } },
    { name: 'mark_acquisition_acquired', description: 'Mark a queued acquisition as acquired. Pass registrar used.',
      input_schema: { type: 'object', required: ['id', 'registrar'], properties: { id: { type: 'string' }, registrar: { type: 'string' }, acquired_at: { type: 'string' } } } },
    { name: 'list_naming_ratifications', description: 'The 6 locked deprecated→ratified mappings (Sovereign Citizen→Citizen, Covenant→Root, Confluence→Weave, Whole→Chorus, Unhoused→Unsworn, ATLAS→MCV Atlas).',
      input_schema: { type: 'object', properties: {} } },
    { name: 'scan_naming_occurrences', description: 'Walk files and populate naming_occurrences. Node-only — dispatches instructions to run the scanner script.',
      input_schema: { type: 'object', properties: { paths: { type: 'array', items: { type: 'string' } } } } },
    { name: 'approve_naming_batch', description: 'Approve a set of naming_occurrence IDs into a batch, flipping their approval_status. Caller typically runs the apply script next.',
      input_schema: { type: 'object', required: ['occurrence_ids', 'approver'], properties: {
        occurrence_ids: { type: 'array', items: { type: 'string' } }, approver: { type: 'string' }, notes: { type: 'string' },
      } } },
    { name: 'apply_approved_naming', description: 'Apply an approved batch: writes file edits + creates a git commit. Node-only.',
      input_schema: { type: 'object', required: ['batch_id'], properties: { batch_id: { type: 'string' } } } },
    { name: 'rollback_naming_batch', description: 'Revert an applied naming batch to its pre_commit_sha. Node-only.',
      input_schema: { type: 'object', required: ['batch_id'], properties: { batch_id: { type: 'string' } } } },
    { name: 'get_entity_stack', description: 'Returns the full capital_legal_entity tree with is_crown highlighted (Layer 0 Root → Crown pair → operating subs → venture SPVs).',
      input_schema: { type: 'object', properties: {} } },
    { name: 'check_blue_marlin_gate', description: 'Readiness check: are all P0 marks filed or better? Returns ready boolean + blocker list. Call before Gary/Joel/Blue Marlin $30M pitch.',
      input_schema: { type: 'object', properties: {} } },
    { name: 'run_full_counsel_ingestion', description: 'Ingest all 12 .docs/counsel/ files + 6 CSVs into foundation tables and RAG chunks. Node-only — dispatches instructions to run the script.',
      input_schema: { type: 'object', properties: {} } },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  list_ip_marks: listIpMarks,
  create_ip_mark: createIpMark,
  update_ip_mark_status: updateIpMarkStatus,
  file_ip_mark: fileIpMark,
  read_ip_budget_rollup: readIpBudgetRollup,
  list_counsel_engagements: listCounselEngagements,
  record_counsel_engagement: recordCounselEngagement,
  mark_nda_executed: markNdaExecuted,
  list_counsel_tasks: listCounselTasks,
  list_critical_path_tasks: listCriticalPathTasks,
  advance_counsel_task: advanceCounselTask,
  assign_counsel_task: assignCounselTask,
  render_hour3_email: renderHour3Email,
  list_acquisition_orders: listAcquisitionOrders,
  seed_urgent_acquisitions: seedUrgentAcquisitions,
  mark_acquisition_acquired: markAcquisitionAcquired,
  list_naming_ratifications: listNamingRatifications,
  scan_naming_occurrences: scanNamingOccurrences,
  approve_naming_batch: approveNamingBatch,
  apply_approved_naming: applyApprovedNaming,
  rollback_naming_batch: rollbackNamingBatch,
  get_entity_stack: getEntityStack,
  check_blue_marlin_gate: checkBlueMarlinGate,
  run_full_counsel_ingestion: runFullCounselIngestion,
};
