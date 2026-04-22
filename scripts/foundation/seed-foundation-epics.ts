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
// Env:
//   SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY   required

import { createServiceClient } from './_lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

const PARENT_TAG = 'foundation:v1-root';
const CHILD_TAG_PREFIX = 'foundation-task:';

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
