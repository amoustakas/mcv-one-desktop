#!/usr/bin/env node
// scripts/foundation/ingest-counsel-corpus - orchestrator for .docs/counsel ingestion.
//
// Parses all 12 .docs/counsel files + 6 CSVs, upserts structured rows into
// foundation tables (ip_marks, counsel_tasks, acquisition_orders,
// capital_legal_entity, domain_registry), and optionally chunks prose into
// storage_chunks for RAG retrieval.
//
// Idempotency: every table has a natural key; upserts with onConflict preserve
// prior data on re-run. The second run inserts 0 net-new rows.
//
// Run:
//   pnpm tsx scripts/foundation/ingest-counsel-corpus.ts
//
// Env:
//   SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY   required
//   GOOGLE_AI_KEY / VITE_GOOGLE_AI_KEY         optional (skips chunk embedding if absent)

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { createIngestionService } from '@mcv/foundation-sdk/services/ingestion';
import type { DocsIngestionRun, IngestionSourceKind } from '@mcv/foundation-sdk/types';
import type { SupabaseClient } from '@supabase/supabase-js';

import { createServiceClient } from './_lib/supabase';
import { writeChunks, embeddingKeyPresent } from './_lib/embedding';
import { chunkDocument, type FoundationChunk } from './_lib/chunking';

import { parseIpInventory } from './parsers/ip-inventory';
import { parsePatents } from './parsers/patent-section';
import { parseCounselPack } from './parsers/counsel-pack';
import { parseT0Portfolio } from './parsers/t0-portfolio';
import { parseT1Entities } from './parsers/t1-entities';
import { parseT2Gaps } from './parsers/t2-gaps';
import { parseT6Carts } from './parsers/t6-carts';

// ─── Paths ──────────────────────────────────────────────────────────────────

const CORPUS_ROOT = resolve(process.cwd(), '.docs', 'counsel');
const CSV_ROOT = resolve(CORPUS_ROOT, 'MCV-Domain-Portfolio-v2');

const SOURCES = {
  ipInventory: resolve(CORPUS_ROOT, 'MCV-IP-Inventory-v1.1.md'),
  counselPack: resolve(CORPUS_ROOT, 'MCV_Counsel_Onboarding_Pack_v2.0.md'),
  hour3Emails: resolve(CORPUS_ROOT, 'Hour-3-Counsel-Outreach-Emails-v1.0.md'),
  ndaTemplates: resolve(CORPUS_ROOT, 'MCV-Mutual-NDA-Templates-v1.0.md'),
  t0: resolve(CSV_ROOT, 'T0_Portfolio_Master.csv'),
  t1: resolve(CSV_ROOT, 'T1_Entities.csv'),
  t2: resolve(CSV_ROOT, 'T2_Gaps_Urgent.csv'),
  t6: resolve(CSV_ROOT, 'T6_FutureState_Cart.csv'),
};

// ─── Run ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const supabase = createServiceClient();
  const ingestion = createIngestionService({ supabase });

  console.log('');
  console.log('MCV Foundation OS - counsel corpus ingestion');
  console.log(`  Corpus root:      ${CORPUS_ROOT}`);
  console.log(`  Embedding key:    ${embeddingKeyPresent() ? 'present - chunks will embed' : 'absent  - chunks deferred'}`);
  console.log('');

  const summary: Array<{ source: string; status: string; rows: number; chunks: number; notes?: string }> = [];

  // PASS 1 — Entities first (FK targets for subsequent passes)
  await runSource(
    'T1 Entities',
    SOURCES.t1,
    'csv_entities',
    summary,
    ingestion,
    async (text) => {
      const res = parseT1Entities(text);
      const inserted = await upsertEntities(supabase, res.entities);
      logWarnings(res.warnings);
      return { rows: inserted, chunks: 0 };
    },
  );

  // PASS 2 — Domain registry + pending-acquisition rollups from T0
  await runSource(
    'T0 Portfolio',
    SOURCES.t0,
    'csv_portfolio',
    summary,
    ingestion,
    async (text) => {
      const res = parseT0Portfolio(text);
      const ownedCount = await upsertDomains(supabase, res.owned);
      const pendingCount = await upsertAcquisitionsFromDomain(supabase, res.pending, 'T0_Portfolio_Master.csv');
      logWarnings(res.warnings);
      return {
        rows: ownedCount + pendingCount,
        chunks: 0,
        notes: `${ownedCount} owned + ${pendingCount} pending`,
      };
    },
  );

  // PASS 3 — IP Inventory (trademarks + copyrights) - markdown + tables
  await runSource(
    'IP Inventory v1.1 (TM + CR)',
    SOURCES.ipInventory,
    'counsel_markdown',
    summary,
    ingestion,
    async (text) => {
      const res = parseIpInventory(text);
      const total = [...res.trademarks, ...res.copyrights];
      const inserted = await upsertIpMarks(supabase, total);
      const { inserted: chunkInserted } = await writeChunks(supabase, res.chunks);
      logWarnings(res.warnings);
      return {
        rows: inserted,
        chunks: chunkInserted,
        notes: `${res.trademarks.length} TM + ${res.copyrights.length} copyright`,
      };
    },
  );

  // PASS 4 — Patents from same markdown file (different sections)
  await runSource(
    'IP Inventory v1.1 (patents)',
    SOURCES.ipInventory,
    'counsel_markdown',
    summary,
    ingestion,
    async (text) => {
      const res = parsePatents(text);
      const inserted = await upsertIpMarks(supabase, res.patents);
      logWarnings(res.warnings);
      return { rows: inserted, chunks: 0 };
    },
  );

  // PASS 5 — Counsel pack (tasks + engagements + RAG chunks)
  await runSource(
    'Counsel Pack v2.0',
    SOURCES.counselPack,
    'counsel_markdown',
    summary,
    ingestion,
    async (text) => {
      const res = parseCounselPack(text);
      const inserted = await upsertCounselTasks(supabase, res.tasks);
      const { inserted: chunkInserted } = await writeChunks(supabase, res.chunks);
      logWarnings(res.warnings);
      return { rows: inserted, chunks: chunkInserted };
    },
  );

  // PASS 6 — Hour-3 emails (chunks only; email templates live in counsel service)
  await runSource(
    'Hour-3 Emails',
    SOURCES.hour3Emails,
    'counsel_markdown',
    summary,
    ingestion,
    async (text) => {
      const chunks = chunkWholeFile(text, 'Hour-3-Counsel-Outreach-Emails-v1.0.md');
      const { inserted: chunkInserted } = await writeChunks(supabase, chunks);
      return { rows: 0, chunks: chunkInserted };
    },
  );

  // PASS 7 — NDA templates (chunks only)
  await runSource(
    'NDA Templates',
    SOURCES.ndaTemplates,
    'counsel_markdown',
    summary,
    ingestion,
    async (text) => {
      const chunks = chunkWholeFile(text, 'MCV-Mutual-NDA-Templates-v1.0.md');
      const { inserted: chunkInserted } = await writeChunks(supabase, chunks);
      return { rows: 0, chunks: chunkInserted };
    },
  );

  // PASS 8 — T2 gaps (yellow/green deferred entries)
  await runSource(
    'T2 Gaps & Urgent',
    SOURCES.t2,
    'csv_gaps',
    summary,
    ingestion,
    async (text) => {
      const res = parseT2Gaps(text);
      const inserted = await upsertAcquisitionsFull(supabase, res.acquisitions);
      logWarnings(res.warnings);
      return { rows: inserted, chunks: 0 };
    },
  );

  // PASS 9 — T6 FutureState cart (ACQUIRE-decision rows only)
  await runSource(
    'T6 FutureState Cart',
    SOURCES.t6,
    'csv_carts',
    summary,
    ingestion,
    async (text) => {
      const res = parseT6Carts(text);
      const inserted = await upsertAcquisitionsFromT6(supabase, res.acquisitions);
      logWarnings(res.warnings);
      return {
        rows: inserted,
        chunks: 0,
        notes: `acquire ${res.acquisitions.length} / defer ${res.deferred} / kill ${res.killed} of ${res.totalRows}`,
      };
    },
  );

  // ─── Final summary ────────────────────────────────────────────────────────
  console.log('');
  console.log('===== Ingestion summary =====');
  for (const row of summary) {
    const notes = row.notes ? ` (${row.notes})` : '';
    console.log(`  [${row.status}] ${row.source.padEnd(34)} rows=${row.rows}  chunks=${row.chunks}${notes}`);
  }
  const totalRows = summary.reduce((acc, r) => acc + r.rows, 0);
  const totalChunks = summary.reduce((acc, r) => acc + r.chunks, 0);
  console.log('-----');
  console.log(`  TOTAL: ${totalRows} rows · ${totalChunks} chunks`);
  console.log('');
  console.log('Re-running this script is safe - natural-key upserts yield 0 net-new rows on repeat.');
}

// ─── Audit-wrapped runner ───────────────────────────────────────────────────

async function runSource(
  label: string,
  path: string,
  sourceKind: IngestionSourceKind,
  summary: Array<{ source: string; status: string; rows: number; chunks: number; notes?: string }>,
  ingestion: ReturnType<typeof createIngestionService>,
  work: (text: string) => Promise<{ rows: number; chunks: number; notes?: string }>,
): Promise<void> {
  if (!existsSync(path)) {
    console.log(`  [skip ]  ${label.padEnd(34)} - source file missing (${path})`);
    summary.push({ source: label, status: 'skip', rows: 0, chunks: 0, notes: 'missing' });
    return;
  }

  let run: DocsIngestionRun | null = null;
  try {
    run = await ingestion.startRun({ sourcePath: path, sourceKind });
  } catch (err) {
    console.warn(`  [warn ]  ${label.padEnd(34)} - could not open audit row (${(err as Error).message}); proceeding without.`);
  }

  const text = readFileSync(path, 'utf-8');
  try {
    const { rows, chunks, notes } = await work(text);
    if (run) {
      await ingestion.completeRun({
        runId: run.id,
        rowsInserted: rows,
        chunksEmbedded: chunks,
        status: 'ok',
      }).catch((err) => console.warn(`  [warn ]  completeRun failed for ${label}: ${(err as Error).message}`));
    }
    console.log(`  [ok   ]  ${label.padEnd(34)} rows=${rows}  chunks=${chunks}${notes ? `  (${notes})` : ''}`);
    summary.push({ source: label, status: 'ok', rows, chunks, notes });
  } catch (err) {
    const message = (err as Error).message;
    console.error(`  [FAIL ]  ${label.padEnd(34)} ${message}`);
    if (run) {
      await ingestion.completeRun({
        runId: run.id,
        rowsInserted: 0,
        chunksEmbedded: 0,
        status: 'failed',
        errorLog: message,
      }).catch(() => void 0);
    }
    summary.push({ source: label, status: 'FAIL', rows: 0, chunks: 0, notes: message.slice(0, 80) });
  }
}

// ─── Upsert helpers (natural-key idempotency) ───────────────────────────────

async function upsertEntities(
  supabase: SupabaseClient,
  entities: ReturnType<typeof parseT1Entities>['entities'],
): Promise<number> {
  if (entities.length === 0) return 0;
  const rows = entities.map((e) => ({
    id: e.id,
    label: e.label,
    entity_type: e.entityType,
    jurisdiction: e.jurisdiction,
    parent_entity_id: e.parentEntityId,
    is_crown: e.isCrown,
    active: e.active,
    metadata: e.metadata,
  }));
  const { error, count } = await supabase
    .from('capital_legal_entity')
    .upsert(rows, { onConflict: 'id', ignoreDuplicates: false, count: 'exact' });
  if (error) throw new Error(`capital_legal_entity upsert failed: ${error.message}`);
  return count ?? rows.length;
}

async function upsertDomains(
  supabase: SupabaseClient,
  domains: ReturnType<typeof parseT0Portfolio>['owned'],
): Promise<number> {
  if (domains.length === 0) return 0;

  // Pre-fetch existing entity IDs so we can null-out unmapped parent FKs
  // rather than crashing the whole T0 pass. The T0 CSV's Holding Entity text
  // slugifies cleanly for most rows, but slash-separated values like
  // "EdgeIQ Holdings Inc / MCV Inc" produce IDs that don't exist.
  const { data: entityRows } = await supabase.from('capital_legal_entity').select('id');
  const validEntityIds = new Set(
    ((entityRows ?? []) as Array<{ id: string }>).map((r) => r.id),
  );

  // Same defense for venture_id — any string that doesn't match a real
  // ventures.id row would violate that FK too.
  const { data: ventureRows } = await supabase.from('ventures').select('id');
  const validVentureIds = new Set(
    ((ventureRows ?? []) as Array<{ id: string }>).map((r) => r.id),
  );

  const rows = domains.map((d) => ({
    fqdn: d.fqdn,
    registrar: d.registrar,
    parent_entity_id: d.parentEntityId && validEntityIds.has(d.parentEntityId)
      ? d.parentEntityId : null,
    venture_id: d.ventureId && validVentureIds.has(d.ventureId)
      ? d.ventureId : null,
    status: d.status,
    registered_at: d.registeredAt,
    expires_at: d.expiresAt,
  }));
  const { error, count } = await supabase
    .from('domain_registry')
    .upsert(rows, { onConflict: 'fqdn', ignoreDuplicates: false, count: 'exact' });
  if (error) throw new Error(`domain_registry upsert failed: ${error.message}`);
  return count ?? rows.length;
}

async function upsertAcquisitionsFromDomain(
  supabase: SupabaseClient,
  pending: ReturnType<typeof parseT0Portfolio>['pending'],
  sourceHint: string,
): Promise<number> {
  if (pending.length === 0) return 0;
  const rows = pending.map((p) => ({
    asset_kind: p.assetKind,
    asset_identifier: p.assetIdentifier,
    urgency_tier: p.urgencyTier,
    target_registrar: p.targetRegistrar,
    status: 'scoped',
    blocks_disclosure: false,
    notes: [p.notes, `source: ${sourceHint}`].filter(Boolean).join(' | '),
  }));
  const { error, count } = await supabase
    .from('acquisition_orders')
    .upsert(rows, { onConflict: 'asset_kind,asset_identifier', ignoreDuplicates: false, count: 'exact' });
  if (error) throw new Error(`acquisition_orders (T0) upsert failed: ${error.message}`);
  return count ?? rows.length;
}

async function upsertAcquisitionsFull(
  supabase: SupabaseClient,
  rows: ReturnType<typeof parseT2Gaps>['acquisitions'],
): Promise<number> {
  if (rows.length === 0) return 0;
  const dbRows = rows.map((a) => ({
    asset_kind: a.assetKind,
    asset_identifier: a.assetIdentifier,
    urgency_tier: a.urgencyTier,
    target_registrar: a.targetRegistrar,
    status: a.status,
    blocks_disclosure: a.blocksDisclosure,
    blocks_venture_name: a.blocksVentureName,
    notes: a.notes,
  }));
  const { error, count } = await supabase
    .from('acquisition_orders')
    .upsert(dbRows, { onConflict: 'asset_kind,asset_identifier', ignoreDuplicates: false, count: 'exact' });
  if (error) throw new Error(`acquisition_orders (T2) upsert failed: ${error.message}`);
  return count ?? dbRows.length;
}

async function upsertAcquisitionsFromT6(
  supabase: SupabaseClient,
  rows: ReturnType<typeof parseT6Carts>['acquisitions'],
): Promise<number> {
  if (rows.length === 0) return 0;
  const dbRows = rows.map((a) => ({
    asset_kind: a.assetKind,
    asset_identifier: a.assetIdentifier,
    urgency_tier: a.urgencyTier,
    target_registrar: a.targetRegistrar,
    price_cad: a.priceCad,
    status: a.status,
    blocks_disclosure: a.blocksDisclosure,
    blocks_venture_name: a.blocksVentureName,
    notes: a.notes,
  }));
  const { error, count } = await supabase
    .from('acquisition_orders')
    .upsert(dbRows, { onConflict: 'asset_kind,asset_identifier', ignoreDuplicates: false, count: 'exact' });
  if (error) throw new Error(`acquisition_orders (T6) upsert failed: ${error.message}`);
  return count ?? dbRows.length;
}

async function upsertIpMarks(
  supabase: SupabaseClient,
  marks: Array<ReturnType<typeof parseIpInventory>['trademarks'][number]>,
): Promise<number> {
  if (marks.length === 0) return 0;
  // ip_marks has no composite unique constraint in the migration, so we emulate
  // upsert via check-then-insert-or-update. Keyed on (mark_text, mark_kind, priority_tier).
  let inserted = 0;
  for (const m of marks) {
    const { data: existing } = await supabase
      .from('ip_marks')
      .select('id')
      .eq('mark_text', m.markText)
      .eq('mark_kind', m.markKind)
      .eq('priority_tier', m.priorityTier)
      .maybeSingle();

    const isPatent = m.markKind === 'patent';
    const row: Record<string, unknown> = {
      mark_text: m.markText,
      mark_kind: m.markKind,
      priority_tier: m.priorityTier,
      classes: m.classes ?? [],
      jurisdictions: m.jurisdictions ?? [],
      owner_entity_id: m.ownerEntityId,
      holding_chain_stage: m.holdingChainStage ?? 'interim_mcv_inc',
      domain_fk: m.domainFk,
      status: m.status ?? 'identified',
      is_compound: m.isCompound ?? false,
      compound_parent_mark_id: m.compoundParentMarkId,
      claim_summary: isPatent ? m.claimSummary : null,
      novelty_hook: isPatent ? m.noveltyHook : null,
      supporting_artifacts: isPatent ? (m.supportingArtifacts ?? []) : null,
      provisional_draft_status: isPatent ? m.provisionalDraftStatus : null,
      filing_vehicle: isPatent ? m.filingVehicle : null,
      notes: m.notes,
      source_doc: m.sourceDoc,
      source_section: m.sourceSection,
    };

    if (existing) {
      const { error } = await supabase
        .from('ip_marks')
        .update(row)
        .eq('id', (existing as { id: string }).id);
      if (error) throw new Error(`ip_marks update failed for "${m.markText}": ${error.message}`);
    } else {
      const { error } = await supabase.from('ip_marks').insert(row);
      if (error) throw new Error(`ip_marks insert failed for "${m.markText}": ${error.message}`);
      inserted += 1;
    }
  }
  return inserted;
}

async function upsertCounselTasks(
  supabase: SupabaseClient,
  tasks: ReturnType<typeof parseCounselPack>['tasks'],
): Promise<number> {
  if (tasks.length === 0) return 0;
  const rows = tasks.map((t) => ({
    task_code: t.taskCode,
    workstream: t.workstream,
    title: t.title,
    description: t.description,
    deliverable: t.deliverable,
    depends_on: t.dependsOn,
    critical_path: t.criticalPath,
    priority: t.priority,
    source_doc: t.sourceDoc,
    source_section: t.sourceSection,
  }));
  const { error, count } = await supabase
    .from('counsel_tasks')
    .upsert(rows, { onConflict: 'task_code', ignoreDuplicates: false, count: 'exact' });
  if (error) throw new Error(`counsel_tasks upsert failed: ${error.message}`);
  return count ?? rows.length;
}

// ─── Small helpers ──────────────────────────────────────────────────────────

function chunkWholeFile(text: string, sourceDoc: string): FoundationChunk[] {
  return chunkDocument(text, { sourceDoc, sourceSection: '(full file)' });
}

function logWarnings(warnings: string[]): void {
  for (const w of warnings) console.warn(`    ⚠ ${w}`);
}

// ─── Entry point ────────────────────────────────────────────────────────────

main().catch((err) => {
  console.error('Foundation ingestion crashed:', err);
  process.exit(1);
});
