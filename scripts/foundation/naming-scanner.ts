#!/usr/bin/env node
// scripts/foundation/naming-scanner - Node-only fs walker + git commit/rollback.
//
// Subcommands:
//   scan [paths...]       Walk filesystem, find occurrences of the 6 locked
//                         deprecated names, insert into naming_occurrences.
//   apply <batch-id>      Apply an approved batch: rewrite files + commit +
//                         stamp commit SHA onto the batch.
//   rollback <batch-id>   Revert an applied batch using its pre_commit_sha.
//
// Kit-layer stubs (foundation.scan_naming_occurrences /
// apply_approved_naming / rollback_naming_batch) dispatch to this script
// because fs + git are Node-only surfaces.

import { readFileSync, writeFileSync, statSync, readdirSync } from 'node:fs';
import { join, relative, extname, resolve, sep } from 'node:path';

import { createNamingService, type InsertOccurrenceInput } from '@mcv/foundation-sdk/services/naming';
import { RATIFIED_NAMES } from '@mcv/foundation-sdk/corpus/ratified-names';
import type { SupabaseClient } from '@supabase/supabase-js';

import { createServiceClient } from './_lib/supabase';
import { headSha, stagePaths, commit as gitCommit, resetHard, workingTreeIsClean } from './_lib/git';
import {
  EXT_CLASS, escapeRegex, isIdentifierKind, locateMatch, refineKindForLine,
} from './_lib/naming-classification';

async function main(): Promise<void> {
  const [, , cmd, ...args] = process.argv;
  if (!cmd) { usage(); process.exit(1); }
  const supabase = createServiceClient();

  switch (cmd) {
    case 'scan':     await scan(supabase, args); return;
    case 'apply':    await apply(supabase, args[0]); return;
    case 'rollback': await rollback(supabase, args[0]); return;
    default:
      console.error(`Unknown subcommand: ${cmd}`);
      usage();
      process.exit(1);
  }
}

function usage(): void {
  console.error(`
naming-scanner - foundation naming ratification operations

Usage:
  pnpm tsx scripts/foundation/naming-scanner.ts scan [path...]
  pnpm tsx scripts/foundation/naming-scanner.ts apply  <batch-id>
  pnpm tsx scripts/foundation/naming-scanner.ts rollback <batch-id>
`);
}

const DEFAULT_ROOTS = ['src', 'packages', 'docs'];
const IGNORE_DIRS = new Set([
  '.git', 'node_modules', 'dist', 'build', '.next', '.turbo', 'coverage',
  '.docs',              // Source-of-truth corpus - never rewrite inline
  '.claude', 'memory',
  'android', 'ios',
]);

async function scan(supabase: SupabaseClient, pathArgs: string[]): Promise<void> {
  const service = createNamingService({ supabase });
  const ratifications = await service.listRatifications();
  if (ratifications.length === 0) {
    console.error('No naming_ratifications rows found. Has the foundation migration been applied?');
    process.exit(1);
  }

  for (const locked of RATIFIED_NAMES) {
    if (!ratifications.find((r) => r.deprecatedName === locked.deprecatedName)) {
      console.warn(`  corpus/DB mismatch: deprecated name "${locked.deprecatedName}" not in DB. Re-apply migration.`);
    }
  }

  const roots = pathArgs.length ? pathArgs : DEFAULT_ROOTS;
  const absoluteRoots = roots.map((r) => resolve(process.cwd(), r));
  console.log(`\nScanning ${absoluteRoots.length} root(s) for ${ratifications.length} ratifications...\n`);

  for (const rat of ratifications) {
    await service.clearOccurrences({ ratificationId: rat.id, approvalStatus: 'pending' }).catch(() => void 0);
  }

  const collected: InsertOccurrenceInput[] = [];
  const fileCount = { scanned: 0, skipped: 0 };
  for (const root of absoluteRoots) {
    for (const file of walk(root)) {
      fileCount.scanned += 1;
      const ext = extname(file).toLowerCase();
      const defaultKind = EXT_CLASS[ext];
      if (!defaultKind) { fileCount.skipped += 1; continue; }
      let body: string;
      try { body = readFileSync(file, 'utf-8'); }
      catch { fileCount.skipped += 1; continue; }
      const relPath = relative(process.cwd(), file).replace(/\\/g, '/');

      for (const rat of ratifications) {
        const re = new RegExp(`\\b${escapeRegex(rat.deprecatedName)}\\b`, 'g');
        let m: RegExpExecArray | null;
        while ((m = re.exec(body)) !== null) {
          const located = locateMatch(body, m.index, rat.deprecatedName);
          const occurrenceKind = refineKindForLine(defaultKind, located.contextBefore, located.match);
          if (rat.context === 'prose' && isIdentifierKind(occurrenceKind)) continue;
          if (rat.context === 'identifier' && !isIdentifierKind(occurrenceKind)) continue;

          collected.push({
            ratificationId: rat.id,
            filePath: relPath,
            lineNumber: located.line,
            columnNumber: located.column,
            contextBefore: located.contextBefore.slice(-60),
            matchText: located.match,
            contextAfter: located.contextAfter.slice(0, 60),
            occurrenceKind,
            proposedReplacement: rat.ratifiedName,
          });
        }
      }
    }
  }

  console.log(`\nScanned ${fileCount.scanned} files (${fileCount.skipped} skipped by extension/IO).`);
  console.log(`Collected ${collected.length} occurrences across ${ratifications.length} ratifications.`);

  if (collected.length === 0) return;

  const BATCH = 500;
  let inserted = 0;
  for (let i = 0; i < collected.length; i += BATCH) {
    const slice = collected.slice(i, i + BATCH);
    const res = await service.insertOccurrences(slice);
    inserted += res.inserted;
  }
  console.log(`Inserted ${inserted} occurrences into naming_occurrences (approval_status=pending).\n`);
  console.log(`Next: open NamingRatificationBoardView to classify + approve, or call`);
  console.log(`  foundation.approve_naming_batch({ occurrence_ids: [...] })`);
  console.log(`then re-run:  apply <batch-id>`);
}

async function apply(supabase: SupabaseClient, batchId: string | undefined): Promise<void> {
  if (!batchId) { console.error('apply: batch id required.'); process.exit(1); }
  const service = createNamingService({ supabase });

  const { clean, dirtyPaths } = workingTreeIsClean();
  if (!clean) {
    console.error('Working tree is dirty - commit or stash first.');
    console.error(`  Dirty paths (${dirtyPaths.length}): ${dirtyPaths.slice(0, 5).join(', ')}${dirtyPaths.length > 5 ? '...' : ''}`);
    process.exit(1);
  }

  const occurrences = await service.listOccurrences({ batchId, approvalStatus: 'approved', limit: 10000 });
  if (occurrences.length === 0) {
    console.error(`Batch ${batchId} has no approved occurrences.`);
    process.exit(1);
  }

  const preCommitSha = headSha();
  console.log(`\nApplying batch ${batchId} (${occurrences.length} occurrences) on top of ${preCommitSha.slice(0, 8)}.\n`);

  const byFile = new Map<string, typeof occurrences>();
  for (const occ of occurrences) {
    const list = byFile.get(occ.filePath) ?? [];
    list.push(occ);
    byFile.set(occ.filePath, list);
  }
  const touchedFiles: string[] = [];
  for (const [relPath, occurrences] of byFile) {
    const abs = resolve(process.cwd(), relPath);
    let body: string;
    try { body = readFileSync(abs, 'utf-8'); }
    catch (err) {
      console.warn(`  ${relPath}: read failed (${(err as Error).message}) - skipping.`);
      continue;
    }
    const sorted = [...occurrences].sort((a, b) =>
      b.lineNumber - a.lineNumber || b.columnNumber - a.columnNumber,
    );
    const lines = body.split('\n');
    let fileChanged = false;
    for (const occ of sorted) {
      const replacement = occ.proposedReplacement ?? '';
      if (!replacement) continue;
      const idx = occ.lineNumber - 1;
      const line = lines[idx];
      if (!line) continue;
      const col = occ.columnNumber - 1;
      const len = occ.matchText.length;
      if (line.slice(col, col + len) !== occ.matchText) {
        console.warn(`  ${relPath}:${occ.lineNumber}:${occ.columnNumber} drift - expected "${occ.matchText}" not found. Skipping.`);
        continue;
      }
      lines[idx] = line.slice(0, col) + replacement + line.slice(col + len);
      fileChanged = true;
    }
    if (fileChanged) {
      writeFileSync(abs, lines.join('\n'), 'utf-8');
      touchedFiles.push(relPath);
      console.log(`  edited  ${relPath} (${sorted.length} occurrence(s))`);
    }
  }

  if (touchedFiles.length === 0) {
    console.log('\nNo files touched - nothing to commit.');
    return;
  }

  stagePaths(touchedFiles);
  const commitSha = gitCommit(
    `chore(naming): apply ratification batch ${batchId.slice(0, 8)}\n\nRewrote ${occurrences.length} occurrences across ${touchedFiles.length} file(s).`,
  );
  await service.recordBatchApplied(batchId, preCommitSha, commitSha);
  console.log(`\nCommitted ${commitSha.slice(0, 8)} - batch ${batchId.slice(0, 8)} applied.`);
  console.log(`Rollback command: pnpm tsx scripts/foundation/naming-scanner.ts rollback ${batchId}`);
}

async function rollback(supabase: SupabaseClient, batchId: string | undefined): Promise<void> {
  if (!batchId) { console.error('rollback: batch id required.'); process.exit(1); }
  const service = createNamingService({ supabase });

  const { data, error } = await supabase
    .from('naming_batches')
    .select('id, pre_commit_sha, commit_sha, applied_at')
    .eq('id', batchId)
    .maybeSingle();
  if (error) { console.error(`Lookup failed: ${error.message}`); process.exit(1); }
  const batch = data as { id: string; pre_commit_sha: string | null; commit_sha: string | null; applied_at: string | null } | null;
  if (!batch) { console.error(`Batch ${batchId} not found.`); process.exit(1); }
  if (!batch.pre_commit_sha || !batch.applied_at) {
    console.error(`Batch ${batchId} has not been applied - nothing to roll back.`);
    process.exit(1);
  }

  const { clean } = workingTreeIsClean();
  if (!clean) { console.error('Working tree is dirty - commit or stash first.'); process.exit(1); }

  console.log(`\nRolling back batch ${batchId.slice(0, 8)} to pre-commit ${batch.pre_commit_sha.slice(0, 8)}.`);
  resetHard(batch.pre_commit_sha);
  const newHead = headSha();
  console.log(`  HEAD is now ${newHead.slice(0, 8)}.`);
  await service.recordRollback(batchId, newHead, 'naming-scanner', `Reset to ${batch.pre_commit_sha.slice(0, 8)}.`);
  console.log(`Rollback audit row created.`);
}

function* walk(dir: string): Generator<string> {
  let entries: string[];
  try { entries = readdirSync(dir); }
  catch { return; }
  for (const name of entries) {
    if (IGNORE_DIRS.has(name)) continue;
    const full = join(dir, name);
    let st: ReturnType<typeof statSync>;
    try { st = statSync(full); }
    catch { continue; }
    if (st.isDirectory()) yield* walk(full);
    else if (st.isFile()) yield full;
  }
}

void sep;

// Only auto-run when invoked directly as a CLI, not when imported by a test.
const invokedDirectly = (() => {
  const argv1 = process.argv[1] ?? '';
  return /naming-scanner(\.ts|\.js)?$/.test(argv1.replace(/\\/g, '/'));
})();

if (invokedDirectly) {
  main().catch((err) => {
    console.error('naming-scanner crashed:', err);
    process.exit(1);
  });
}
