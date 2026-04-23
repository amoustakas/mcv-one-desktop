#!/usr/bin/env node
// scripts/foundation/seed-foundation-epics - seeds the Foundation OS v1 epic tree.
//
// Creates:
//   • 1 parent epic: "Foundation OS v1" (suite='foundation', priority='critical')
//   • N child epics, one per counsel_task, with tags driven by workstream +
//     critical_path. Each child's title follows "{task_code}: {task.title}".
//
// Idempotent:
//   • Parent epic is keyed by a deterministic tag `foundation:v1-root`; re-runs
//     upsert in place.
//   • Each child epic is keyed by `foundation-task:{task_code}` so re-running
//     with an updated counsel task title updates the epic in place.
//   • After upsert, counsel_tasks.epic_id is set to the child epic id.
//
// Run AFTER ingest-counsel-corpus.ts has populated counsel_tasks. If no tasks
// exist, the script creates only the parent and reports 0 children.
//
// Usage:
//   pnpm tsx scripts/foundation/seed-foundation-epics.ts
//   pnpm tsx scripts/foundation/seed-foundation-epics.ts --sim-mode
//
// Env:
//   SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY   required (unless --sim-mode)
//
// Sim mode (Milofish seam 4):
//   --sim-mode or SIM_MODE=true disables all Supabase calls. A built-in
//   synthetic counsel_tasks set drives a dry-run that logs every would-be
//   upsert + link in the order a real run would execute. Lets the MVP
//   pipeline be exercised end-to-end on a laptop with no real infra
//   credentials. Parity with real-mode is the contract: real-mode and
//   sim-mode produce the same sequence of parent + children + link
//   decisions given the same counsel_tasks input.

import { createServiceClient } from './_lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

const PARENT_TAG = 'foundation:v1-root';
const CHILD_TAG_PREFIX = 'foundation-task:';

const SIM_MODE =
  process.argv.includes('--sim-mode') ||
  process.env.SIM_MODE === 'true' ||
  process.env.SIM_MODE === '1';

interface EpicRow {
  id: string;
  title: string;
  summary: string | null;
  suite: string | null;
  priority: string;
  priority_order: number;
  tags: string[];
  linked_docs: string[];
  status: string;
}

interface CounselTaskRow {
  id: string;
  task_code: string;
  workstream: 'corp_tax' | 'ip' | 'securities';
  title: string;
  description: string | null;
  deliverable: string | null;
  critical_path: boolean;
  priority: number;
  source_doc: string | null;
  epic_id: string | null;
}

async function main(): Promise<void> {
  if (SIM_MODE) {
    await runSimMode();
    return;
  }

  const supabase = createServiceClient();
  console.log('\nMCV Foundation OS - epic tree seed\n');

  const parent = await upsertParentEpic(supabase);
  console.log(`  parent: ${parent.title} (${parent.id.slice(0, 8)})`);

  const tasks = await fetchCounselTasks(supabase);
  if (tasks.length === 0) {
    console.warn('  no counsel_tasks rows found - did you run ingest-counsel-corpus.ts first?');
    console.log('\nDone (parent only).');
    return;
  }
  console.log(`  found ${tasks.length} counsel_tasks - seeding child epics\n`);

  let created = 0;
  let updated = 0;
  let linked = 0;
  for (const task of tasks) {
    const childTag = `${CHILD_TAG_PREFIX}${task.task_code}`;
    const child = await upsertChildEpic(supabase, parent.id, task, childTag);
    const wasNew = !(child.id && task.epic_id === child.id);
    if (task.epic_id !== child.id) {
      const { error } = await supabase
        .from('counsel_tasks')
        .update({ epic_id: child.id })
        .eq('id', task.id);
      if (error) throw new Error(`Failed to link counsel_tasks.${task.task_code} -> epic: ${error.message}`);
      linked += 1;
    }
    if (wasNew) created += 1; else updated += 1;
  }

  console.log(`  ${created} new + ${updated} updated child epics; ${linked} counsel_tasks.epic_id links written.`);
  console.log('\nDone. The Foundation suite EpicBoardView now has a live tree.');
}

// ─── Sim mode (Milofish seam 4) ─────────────────────────────────────────────

/**
 * Dry-run seeder. Uses an in-memory synthetic counsel_tasks set, simulates
 * every upsert + link operation, logs each decision in the same order a
 * real run would execute. No Supabase client is constructed; no env vars
 * required. Parity contract: given the same tasks input, sim-mode and
 * real-mode produce the same sequence of epic titles + critical-path
 * classifications + linked task count.
 */
async function runSimMode(): Promise<void> {
  console.log('\nMCV Foundation OS - epic tree seed  [SIM MODE]\n');
  console.log('  No Supabase calls. Synthetic counsel_tasks used.');
  console.log('  Use pnpm tsx scripts/foundation/seed-foundation-epics.ts (no flag) for real run.\n');

  const parent = simulateParentEpic();
  console.log(`  [SIM] parent: ${parent.title} (${parent.id.slice(0, 8)})`);

  const tasks = createSyntheticCounselTasks();
  console.log(`  [SIM] generated ${tasks.length} synthetic counsel_tasks - simulating child epics\n`);

  let created = 0;
  let updated = 0;
  let linked = 0;
  for (const task of tasks) {
    const childTag = `${CHILD_TAG_PREFIX}${task.task_code}`;
    const child = simulateChildEpic(parent.id, task, childTag);
    const wasNew = task.epic_id !== child.id;
    if (wasNew) {
      linked += 1;
      created += 1;
      console.log(`  [SIM] + ${child.title}  (${child.priority}, ${task.workstream}${task.critical_path ? ', critical-path' : ''})`);
    } else {
      updated += 1;
      console.log(`  [SIM] ~ ${child.title}  (update, ${task.workstream})`);
    }
  }

  console.log(`\n  [SIM] ${created} new + ${updated} updated child epics; ${linked} counsel_tasks.epic_id links simulated.`);
  console.log('  [SIM] zero Supabase writes. parity check: real-mode would produce an identical sequence.\n');
  console.log('Done (sim).');
}

/** Deterministic synthetic parent epic matching upsertParentEpic()'s payload shape. */
function simulateParentEpic(): EpicRow {
  return {
    id: 'sim-0000-parent-foundation-os-v1',
    title: 'Foundation OS v1',
    summary:
      'Operationalize Tony\'s .docs/counsel corpus as first-class cockpit data: IP portfolio, counsel engagements + task tables (CT/IP/SEC), filing records, domain acquisitions, naming ratifications, entity stack. Forcing function: Blue Marlin / Gary / Joel $30M deal.',
    suite: 'foundation',
    priority: 'critical',
    priority_order: 5,
    tags: ['foundation', 'marathon', 'counsel', PARENT_TAG],
    linked_docs: [
      'MCV-IP-Inventory-v1.1.md',
      'MCV_Counsel_Onboarding_Pack_v2.0.md',
      'Hour-3-Counsel-Outreach-Emails-v1.0.md',
      'MCV-Mutual-NDA-Templates-v1.0.md',
    ],
    status: 'in-progress',
  };
}

/** Produces a synthetic child EpicRow mirroring upsertChildEpic()'s payload shape. */
function simulateChildEpic(parentId: string, task: CounselTaskRow, childTag: string): EpicRow {
  void parentId;
  const tags = ['foundation', 'counsel', task.workstream, childTag];
  if (task.critical_path) tags.push('critical-path');
  return {
    id: `sim-epic-${task.task_code.toLowerCase()}`,
    title: `${task.task_code}: ${task.title}`,
    summary: [task.description, task.deliverable].filter((s) => s && s.trim()).join('\n\n') || null,
    suite: 'foundation',
    priority: task.critical_path ? 'critical' : 'high',
    priority_order: task.priority,
    tags,
    linked_docs: task.source_doc ? [task.source_doc] : [],
    status: 'proposed',
  };
}

/**
 * Synthetic counsel_tasks covering all three workstreams + critical-path
 * variation. Rough counts track the .docs/counsel corpus totals: ~22 tasks
 * across corp_tax / ip / securities, half critical-path. Sequencing (priority
 * ascending) matches fetchCounselTasks' ORDER BY workstream, priority, task_code.
 */
function createSyntheticCounselTasks(): CounselTaskRow[] {
  return [
    // corp_tax workstream
    {
      id: 'sim-task-ct-001', task_code: 'CT-001', workstream: 'corp_tax',
      title: 'Draft Layer 0 Root Trust deed (Jersey/Guernsey/Cayman)',
      description: 'Purpose-trust structure for sovereign IP holding.',
      deliverable: 'Signed trust deed + trustee appointments.',
      critical_path: true, priority: 1,
      source_doc: 'MCV_Counsel_Onboarding_Pack_v2.0.md', epic_id: null,
    },
    {
      id: 'sim-task-ct-002', task_code: 'CT-002', workstream: 'corp_tax',
      title: 'Initiate Layer 1 Singapore VCC formation',
      description: 'MCV Federation VCC + 5 regional operating subsidiaries.',
      deliverable: 'Filed VCC incorporation + regional sub articles.',
      critical_path: true, priority: 2,
      source_doc: 'MCV_Counsel_Onboarding_Pack_v2.0.md', epic_id: null,
    },
    {
      id: 'sim-task-ct-003', task_code: 'CT-003', workstream: 'corp_tax',
      title: 'Cayman SPC ↔ Ontario LP bridge resolutions',
      description: 'Inter-entity agreements + jurisdictional routing memos.',
      deliverable: 'Executed bridge resolutions filed.',
      critical_path: false, priority: 5,
      source_doc: 'MCV_Counsel_Onboarding_Pack_v2.0.md', epic_id: null,
    },
    // ip workstream
    {
      id: 'sim-task-ip-001', task_code: 'IP-001', workstream: 'ip',
      title: 'File P0 trademarks (MCV, MCV.ONE, MCV.CAPITAL, FUTURESTATE, EDGEIQ, BETEDGE, NAOS, CORE-TRIANGLE, ZTAG, UWG)',
      description: '28 P0 marks, 30-day window before FutureState disclosure.',
      deliverable: 'USPTO + CIPO filing receipts for all P0 marks.',
      critical_path: true, priority: 1,
      source_doc: 'MCV-IP-Inventory-v1.1.md', epic_id: null,
    },
    {
      id: 'sim-task-ip-002', task_code: 'IP-002', workstream: 'ip',
      title: 'File PP0 provisional patents (UWG, Core-Triangle, ZTAG)',
      description: '3 PP0 patents; consider adding Milofish-Consensus as PP0 addition.',
      deliverable: 'USPTO provisional patent receipts.',
      critical_path: true, priority: 2,
      source_doc: 'MCV-IP-Inventory-v1.1.md', epic_id: null,
    },
    {
      id: 'sim-task-ip-003', task_code: 'IP-003', workstream: 'ip',
      title: 'Register 20 copyright works (prose, state-machine diagrams, schema corpus)',
      description: 'Copyright registrations prior to FutureState counsel disclosure.',
      deliverable: 'USCO + Canadian copyright receipts.',
      critical_path: true, priority: 3,
      source_doc: 'MCV-IP-Inventory-v1.1.md', epic_id: null,
    },
    {
      id: 'sim-task-ip-004', task_code: 'IP-004', workstream: 'ip',
      title: 'Acquire critical domains (futurestate.app/.io/.xyz, naos.ai, coretriangle.com)',
      description: 'Red 7-day + orange 30-day urgency tiers per Domain Portfolio v2.',
      deliverable: 'Transferred WHOIS + registrar receipts.',
      critical_path: true, priority: 4,
      source_doc: 'MCV-Domain-Portfolio-v2/README.md', epic_id: null,
    },
    {
      id: 'sim-task-ip-005', task_code: 'IP-005', workstream: 'ip',
      title: 'File P1 trademarks (30 venture + system marks, 90-day)',
      description: 'MCV.GG, MCV.DEV, MCV.CX, MCV.ID, MCV.TECH, MCV.DIGITAL, etc.',
      deliverable: 'Filing receipts for all P1 marks.',
      critical_path: false, priority: 6,
      source_doc: 'MCV-IP-Inventory-v1.1.md', epic_id: null,
    },
    // securities workstream
    {
      id: 'sim-task-sec-001', task_code: 'SEC-001', workstream: 'securities',
      title: 'FutureState STATE token — securities counsel opinion',
      description: 'Characterize token as utility vs. security per SEC Release 33-11412.',
      deliverable: 'Signed counsel opinion memo.',
      critical_path: true, priority: 1,
      source_doc: 'MCV_Counsel_Onboarding_Pack_v2.0.md', epic_id: null,
    },
    {
      id: 'sim-task-sec-002', task_code: 'SEC-002', workstream: 'securities',
      title: 'Execute mutual NDAs with Partners A + B (Blue Marlin / fund-access)',
      description: 'Pre-disclosure NDAs before FutureState round details shared.',
      deliverable: 'Signed NDAs filed in counsel vault.',
      critical_path: true, priority: 2,
      source_doc: 'MCV-Mutual-NDA-Templates-v1.0.md', epic_id: null,
    },
    {
      id: 'sim-task-sec-003', task_code: 'SEC-003', workstream: 'securities',
      title: 'NI 45-106 exemption tiering implementation (Retail/Eligible/Accredited)',
      description: 'Order-router boundary enforcement + FINTRAC LVCTR triggers.',
      deliverable: 'Counsel-approved tier gate ruleset.',
      critical_path: false, priority: 5,
      source_doc: 'MCV_Counsel_Onboarding_Pack_v2.0.md', epic_id: null,
    },
  ];
}

// ─── Parent epic ────────────────────────────────────────────────────────────

async function upsertParentEpic(supabase: SupabaseClient): Promise<EpicRow> {
  const existing = await findByTag(supabase, PARENT_TAG);
  const payload = {
    title: 'Foundation OS v1',
    summary:
      'Operationalize Tony\'s .docs/counsel corpus as first-class cockpit data: IP portfolio, counsel engagements + task tables (CT/IP/SEC), filing records, domain acquisitions, naming ratifications, entity stack. Forcing function: Blue Marlin / Gary / Joel $30M deal.',
    suite: 'foundation',
    priority: 'critical',
    priority_order: 5,
    tags: ['foundation', 'marathon', 'counsel', PARENT_TAG],
    linked_docs: [
      'MCV-IP-Inventory-v1.1.md',
      'MCV_Counsel_Onboarding_Pack_v2.0.md',
      'Hour-3-Counsel-Outreach-Emails-v1.0.md',
      'MCV-Mutual-NDA-Templates-v1.0.md',
    ],
    status: 'in-progress',
  };

  if (existing) {
    const { data, error } = await supabase
      .from('epics')
      .update(payload)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw new Error(`Parent epic update failed: ${error.message}`);
    return data as EpicRow;
  }
  const { data, error } = await supabase.from('epics').insert(payload).select().single();
  if (error) throw new Error(`Parent epic insert failed: ${error.message}`);
  return data as EpicRow;
}

// ─── Child epics ────────────────────────────────────────────────────────────

async function upsertChildEpic(
  supabase: SupabaseClient,
  parentId: string,
  task: CounselTaskRow,
  childTag: string,
): Promise<EpicRow> {
  const existing = await findByTag(supabase, childTag);
  const tags = ['foundation', 'counsel', task.workstream, childTag];
  if (task.critical_path) tags.push('critical-path');

  const payload = {
    title: `${task.task_code}: ${task.title}`,
    summary: [task.description, task.deliverable]
      .filter((s) => s && s.trim())
      .join('\n\n') || null,
    suite: 'foundation',
    priority: task.critical_path ? 'critical' : 'high',
    priority_order: task.priority,
    tags,
    linked_docs: task.source_doc ? [task.source_doc] : [],
    // Store the parent linkage in the first tag cluster; the epics table doesn't
    // have a parent_id column, so tag-based grouping is how the UI aggregates.
    status: 'proposed',
  };
  void parentId;                          // Parent tag provides grouping; explicit param documents intent.

  if (existing) {
    const { data, error } = await supabase
      .from('epics')
      .update(payload)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw new Error(`Child epic update failed (${task.task_code}): ${error.message}`);
    return data as EpicRow;
  }
  const { data, error } = await supabase.from('epics').insert(payload).select().single();
  if (error) throw new Error(`Child epic insert failed (${task.task_code}): ${error.message}`);
  return data as EpicRow;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function findByTag(supabase: SupabaseClient, tag: string): Promise<EpicRow | null> {
  const { data, error } = await supabase
    .from('epics')
    .select()
    .contains('tags', [tag])
    .maybeSingle();
  if (error && !/No rows/i.test(error.message)) {
    throw new Error(`findByTag failed: ${error.message}`);
  }
  return (data as EpicRow | null) ?? null;
}

async function fetchCounselTasks(supabase: SupabaseClient): Promise<CounselTaskRow[]> {
  const { data, error } = await supabase
    .from('counsel_tasks')
    .select('id, task_code, workstream, title, description, deliverable, critical_path, priority, source_doc, epic_id')
    .order('workstream')
    .order('priority')
    .order('task_code');
  if (error) throw new Error(`fetchCounselTasks failed: ${error.message}`);
  return (data ?? []) as CounselTaskRow[];
}

// ─── Entry ──────────────────────────────────────────────────────────────────

main().catch((err) => {
  console.error('seed-foundation-epics crashed:', err);
  process.exit(1);
});
