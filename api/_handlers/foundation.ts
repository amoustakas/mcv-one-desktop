// MCV Foundation OS — unified API handler
//
// Backed by @mcv/foundation-sdk services + Supabase. Pattern matches
// api/_handlers/capital.ts (Clerk auth, action-dispatch, publishEvent for
// cross-venture notifications).
//
// Surfaces:
//   /api/foundation POST { action, ...params }
//
// Action groups:
//   IP portfolio     — list-ip-marks / get-ip-mark / create-ip-mark / etc.
//   Counsel          — engagements + tasks + Hour-3 email rendering
//   Acquisition      — domain/mark buy queue + 🔴🟠 urgent seed
//   Naming           — ratifications + occurrence CRUD + batch approve/apply
//   Filings          — record-filing (emits CR journal via LedgerAdapter)
//   Ingestion        — audit wrapper around docs_ingestion_runs
//   Aggregate        — blue-marlin-gate, entity-stack tree

import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  createIPPortfolioService,
  createCounselService,
  createAcquisitionService,
  createNamingService,
  createFilingsService,
  createIngestionService,
  CROWN_ENTITY_IDS,
} from '@mcv/foundation-sdk';
import { createPublisher } from '@mcv/events-sdk';
import { makeCapitalLedgerAdapter } from '../../src/lib/capital/adapters';
import { requestLogger } from '../../src/lib/server/logger';

// Clerk-backed auth (matches api/_handlers/capital.ts pattern).
async function requireAuth(req: VercelRequest, res: VercelResponse): Promise<string | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return 'no-secret'; // Local dev without Clerk configured
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.cookies?.__session || null);
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }
  try {
    const { verifyToken } = await import('@clerk/backend');
    const payload = await verifyToken(token, { secretKey });
    return payload.sub;
  } catch {
    res.status(401).json({ error: 'Invalid session' });
    return null;
  }
}

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
);

// Wire services. FilingsService gets the LedgerAdapter so filing_records
// posts emit a DR 5180 / CR 2010|1010 journal entry via the same rails
// that commerce-sdk and capital-sdk use.
const ledger = makeCapitalLedgerAdapter(supabase);
const ipPortfolio = createIPPortfolioService({ supabase });
const counsel = createCounselService({ supabase });
const acquisition = createAcquisitionService({ supabase });
const naming = createNamingService({ supabase });
const filings = createFilingsService({ supabase, ledger });
const ingestion = createIngestionService({ supabase });

// Typed events-sdk publisher — routes through event_log (Agentic OS Layer 1).
// No registry attached here so legacy call sites that pass loosely-typed
// payloads still publish; strict validation lives on new-code paths (workflow
// engine M-F2, agent subscribers M-F3) which instantiate their own publisher
// with a ContractRegistry. Until then, subscribers validate at the receive
// boundary — producer → consumer drift stays observable without blocking ship.
const eventPublisher = createPublisher({ supabase });

// Fire-and-forget notification + typed event publish. Non-fatal.
//
// Two sinks, both best-effort:
//   1. notifications row — drives the bell UI + cron-notifications-dispatch.
//   2. event_log via @mcv/events-sdk — durable typed bus, powers EventStreamView,
//      workflow triggers (M-F2), and agent subscriptions (M-F3).
async function publishFoundationEvent(
  topic: string,
  title: string,
  opts: {
    description?: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    payload?: Record<string, unknown>;
  } = {},
) {
  try {
    await supabase.from('notifications').insert({
      type: opts.type ?? 'info',
      title,
      description: opts.description ?? null,
      source: 'foundation',
      venture_id: null,                    // foundation events are org-level
    });
  } catch (err) {
    console.warn(`[foundation ${topic}] notify failed:`, err instanceof Error ? err.message : err);
  }
  try {
    await eventPublisher.publish(
      topic,
      {
        title,
        description: opts.description ?? null,
        type: opts.type ?? 'info',
        ...(opts.payload ?? {}),
      },
      { ventureId: null, emittedBy: 'system:foundation' },
    );
  } catch (err) {
    console.warn(`[foundation ${topic}] event_log publish failed:`, err instanceof Error ? err.message : err);
  }
}

// ─── Aggregate / rollup queries ─────────────────────────────────────────────

async function checkBlueMarlinGate(): Promise<{
  p0Total: number;
  p0Green: number;
  ready: boolean;
  blockers: string[];
  checkedAt: string;
}> {
  // P0 filings must all be >= filed status before Blue Marlin / Gary / Joel pitch.
  const { data: p0Marks, error } = await supabase
    .from('ip_marks').select('id, mark_text, status')
    .eq('priority_tier', 'P0');
  if (error) throw new Error(`checkBlueMarlinGate failed: ${error.message}`);
  const rows = (p0Marks ?? []) as Array<{ id: string; mark_text: string; status: string }>;
  const greenStatuses = new Set(['filed', 'published', 'registered']);
  let green = 0;
  const blockers: string[] = [];
  for (const r of rows) {
    if (greenStatuses.has(r.status)) green += 1;
    else blockers.push(`${r.mark_text} (status=${r.status})`);
  }
  return {
    p0Total: rows.length,
    p0Green: green,
    ready: rows.length > 0 && green === rows.length,
    blockers,
    checkedAt: new Date().toISOString(),
  };
}

async function getEntityStack(): Promise<unknown> {
  // Pull the full capital_legal_entity tree + tag is_crown.
  const { data, error } = await supabase
    .from('capital_legal_entity')
    .select('id, label, jurisdiction, entity_type, parent_entity_id, active, metadata, is_crown')
    .eq('active', true)
    .order('label');
  if (error) throw new Error(`getEntityStack failed: ${error.message}`);
  type Row = {
    id: string; label: string; jurisdiction: string; entity_type: string;
    parent_entity_id: string | null; active: boolean;
    metadata: Record<string, unknown>; is_crown?: boolean;
  };
  const rows = (data ?? []) as Row[];
  const nodes = new Map<string, Row & { children: string[] }>();
  for (const r of rows) {
    nodes.set(r.id, { ...r, is_crown: Boolean(r.is_crown) || CROWN_ENTITY_IDS.includes(r.id as (typeof CROWN_ENTITY_IDS)[number]), children: [] });
  }
  for (const n of nodes.values()) {
    if (n.parent_entity_id && nodes.has(n.parent_entity_id)) {
      nodes.get(n.parent_entity_id)!.children.push(n.id);
    }
  }
  const roots = [...nodes.values()].filter((n) => !n.parent_entity_id || !nodes.has(n.parent_entity_id));
  return { nodes: [...nodes.values()], roots: roots.map((r) => r.id) };
}

// ─── Handler ────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { log, correlationId } = requestLogger(
    req as unknown as { headers?: Record<string, unknown>; url?: string; method?: string },
  );
  try { res.setHeader('x-correlation-id', correlationId); } catch { /* headers already sent */ }
  const start = Date.now();
  log.info({ event: 'request_in' });
  res.on('finish', () => {
    log.info({ event: 'request_out', status: res.statusCode, duration_ms: Date.now() - start });
  });

  const userId = await requireAuth(req, res);
  if (!userId) return;

  const action = req.method === 'GET' ? (req.query.action as string) : req.body?.action;
  const p = { ...req.query, ...(req.body || {}) } as Record<string, unknown>;

  try {
    switch (action) {
      // ─── IP portfolio ─────────────────────────────────────────────────
      case 'list-ip-marks': {
        const marks = await ipPortfolio.list({
          markKind: p.mark_kind as never,
          priorityTier: p.priority_tier as never,
          status: p.status as never,
          ownerEntityId: p.owner_entity_id as string | undefined,
          holdingChainStage: p.holding_chain_stage as never,
          jurisdictions: p.jurisdictions as string[] | undefined,
          isCompound: typeof p.is_compound === 'boolean' ? p.is_compound : undefined,
          compoundParentMarkId: p.compound_parent_mark_id as string | undefined,
          search: p.search as string | undefined,
          limit: p.limit as number | undefined,
          offset: p.offset as number | undefined,
        });
        return res.json({ marks });
      }
      case 'get-ip-mark': {
        const mark = await ipPortfolio.get(p.id as string);
        return res.json({ mark });
      }
      case 'create-ip-mark': {
        const mark = await ipPortfolio.create(p.mark as never);
        await publishFoundationEvent('foundation.ip-mark.created', `IP mark added: ${mark.markText}`, {
          description: `${mark.markKind} · ${mark.priorityTier} · ${mark.jurisdictions.join('/')}`,
          type: 'success',
        });
        return res.json({ mark });
      }
      case 'update-ip-mark-status': {
        const mark = await ipPortfolio.updateStatus(p.id as string, p.status as never);
        return res.json({ mark });
      }
      case 'link-ip-mark-domain': {
        const mark = await ipPortfolio.linkDomain(p.id as string, (p.domain_id as string) ?? null);
        return res.json({ mark });
      }
      case 'list-ip-mark-compounds': {
        const compounds = await ipPortfolio.listCompoundsOf(p.parent_id as string);
        return res.json({ compounds });
      }
      case 'read-ip-budget-rollup': {
        const rollup = await ipPortfolio.readBudgetRollup();
        return res.json({ rollup });
      }

      // ─── Counsel engagements + tasks ──────────────────────────────────
      case 'list-counsel-engagements': {
        const engagements = await counsel.listEngagements(p.workstream as never);
        return res.json({ engagements });
      }
      case 'get-counsel-engagement': {
        const engagement = await counsel.getEngagement(p.id as string);
        return res.json({ engagement });
      }
      case 'record-counsel-engagement': {
        const engagement = await counsel.recordEngagement(p.engagement as never);
        await publishFoundationEvent('foundation.counsel.engaged', `Counsel engaged: ${engagement.firmName}`, {
          description: `${engagement.workstream} workstream`,
          type: 'info',
        });
        return res.json({ engagement });
      }
      case 'update-engagement-status': {
        const engagement = await counsel.updateEngagementStatus(p.id as string, p.status as never);
        return res.json({ engagement });
      }
      case 'mark-nda-executed': {
        const engagement = await counsel.markNDAExecuted(p.id as string, p.executed_at as string | undefined);
        await publishFoundationEvent('foundation.counsel.nda-executed', `NDA executed: ${engagement.firmName}`, {
          description: `${engagement.workstream} — unlocks P0/P1 trade-secret disclosure`,
          type: 'success',
        });
        return res.json({ engagement });
      }
      case 'list-counsel-tasks': {
        const tasks = await counsel.listTasks(p.workstream as never);
        return res.json({ tasks });
      }
      case 'list-critical-path-tasks': {
        const tasks = await counsel.listCriticalPathTasks();
        return res.json({ tasks });
      }
      case 'advance-counsel-task': {
        const task = await counsel.advanceTask(p.task_code as string, p.new_status as never);
        if (task.status === 'done') {
          await publishFoundationEvent('foundation.counsel-task.done', `Counsel task complete: ${task.taskCode}`, {
            description: task.title,
            type: 'success',
          });
        }
        return res.json({ task });
      }
      case 'assign-counsel-task': {
        const task = await counsel.assignTask(p.task_code as string, (p.engagement_id as string) ?? null);
        return res.json({ task });
      }
      case 'render-hour3-email': {
        const email = await counsel.renderHour3Email(p.workstream as never);
        return res.json({ email });
      }

      // ─── Acquisition orders ───────────────────────────────────────────
      case 'list-acquisition-orders': {
        const orders = await acquisition.list({
          urgencyTier: p.urgency_tier as never,
          status: p.status as never,
          assetKind: p.asset_kind as never,
          blocksDisclosure: typeof p.blocks_disclosure === 'boolean' ? p.blocks_disclosure : undefined,
        });
        return res.json({ orders });
      }
      case 'get-acquisition-order': {
        const order = await acquisition.get(p.id as string);
        return res.json({ order });
      }
      case 'upsert-acquisition-order': {
        const order = await acquisition.upsert(p.order as never);
        return res.json({ order });
      }
      case 'mark-acquisition-acquired': {
        const order = await acquisition.markAcquired(
          p.id as string,
          p.registrar as string,
          p.acquired_at as string | undefined,
        );
        await publishFoundationEvent('foundation.domain.acquired', `Domain acquired: ${order.assetIdentifier}`, {
          description: `Registrar: ${order.acquiredRegistrar}`,
          type: 'success',
        });
        return res.json({ order });
      }
      case 'kill-acquisition': {
        const order = await acquisition.kill(p.id as string, p.reason as string);
        return res.json({ order });
      }

      // ─── Owned-domain registry (Namecheap-synced) ─────────────────────
      // Thin read surface over the domain_registry table. Hydrated by
      // scripts/seed-domain-registry.ts (one-shot or scheduled) which calls
      // the Namecheap API and upserts here. UI consumes via the
      // DomainPortfolioView "Owned Domains" section.
      case 'list-owned-domains': {
        const { data, error } = await supabase
          .from('domain_registry')
          .select('*')
          .order('expires_at', { ascending: true, nullsFirst: false });
        if (error) throw error;
        return res.json({ domains: data ?? [] });
      }
      case 'seed-urgent-acquisitions': {
        const result = await acquisition.seedUrgent();
        if (result.inserted > 0) {
          await publishFoundationEvent('foundation.acquisition.seeded',
            `Urgent acquisitions seeded: ${result.inserted} new 🔴🟠 rows`, {
              description: `${result.inserted} new, ${result.already} already present`,
              type: 'info',
            });
        }
        return res.json({ result });
      }

      // ─── Naming ratifications + occurrences + batches ─────────────────
      case 'list-naming-ratifications': {
        const ratifications = await naming.listRatifications();
        return res.json({ ratifications });
      }
      case 'list-naming-occurrences': {
        const occurrences = await naming.listOccurrences({
          ratificationId: p.ratification_id as string | undefined,
          approvalStatus: p.approval_status as never,
          classification: p.classification as never,
          occurrenceKind: p.occurrence_kind as never,
          filePath: p.file_path as string | undefined,
          batchId: p.batch_id as string | null | undefined,
          limit: p.limit as number | undefined,
          offset: p.offset as number | undefined,
        });
        return res.json({ occurrences });
      }
      case 'get-naming-occurrence': {
        const occurrence = await naming.getOccurrence(p.id as string);
        return res.json({ occurrence });
      }
      case 'insert-naming-occurrences': {
        const result = await naming.insertOccurrences(p.occurrences as never);
        return res.json({ result });
      }
      case 'clear-naming-occurrences': {
        const result = await naming.clearOccurrences({
          ratificationId: p.ratification_id as string | undefined,
          approvalStatus: p.approval_status as never,
        });
        return res.json({ result });
      }
      case 'classify-occurrence': {
        const occurrence = await naming.classifyOccurrence(p.id as string, p.classification as never);
        return res.json({ occurrence });
      }
      case 'approve-naming-batch': {
        const result = await naming.approveBatch(
          p.occurrence_ids as string[],
          p.approver as string,
          p.notes as string | undefined,
        );
        await publishFoundationEvent('foundation.naming.batch-approved',
          `Naming batch approved: ${result.occurrences.length} occurrences`, {
            description: `Approved by ${p.approver}`,
            type: 'info',
          });
        return res.json({ result });
      }
      case 'record-batch-applied': {
        const batch = await naming.recordBatchApplied(
          p.batch_id as string,
          p.pre_commit_sha as string,
          p.commit_sha as string,
          p.applied_at as string | undefined,
        );
        await publishFoundationEvent('foundation.naming.batch-applied',
          `Naming batch applied: ${batch.commitSha?.slice(0, 8)}`, {
            description: `Occurrences: ${batch.occurrenceCount}`,
            type: 'success',
          });
        return res.json({ batch });
      }
      case 'record-rollback': {
        const batch = await naming.recordRollback(
          p.original_batch_id as string,
          p.revert_commit_sha as string,
          p.approver as string,
          p.notes as string | undefined,
        );
        await publishFoundationEvent('foundation.naming.batch-rollback',
          `Naming batch rolled back`, {
            description: `Revert commit: ${batch.commitSha?.slice(0, 8)}`,
            type: 'warning',
          });
        return res.json({ batch });
      }

      // ─── Filings ──────────────────────────────────────────────────────
      case 'list-filings': {
        const list = await filings.list(p.ip_mark_id as string | undefined);
        return res.json({ filings: list });
      }
      case 'get-filing': {
        const filing = await filings.get(p.id as string);
        return res.json({ filing });
      }
      case 'record-filing': {
        const filing = await filings.record(p.filing as never, userId ?? 'system:foundation-filings');
        await publishFoundationEvent('foundation.filing.recorded',
          `Filing recorded: ${filing.filingType} in ${filing.jurisdiction}`, {
            description: `Fee: $${filing.feeTotalUsd}`,
            type: 'success',
          });
        return res.json({ filing });
      }
      case 'update-filing-status': {
        const filing = await filings.updateStatus(p.id as string, p.status as never);
        return res.json({ filing });
      }
      case 'total-fees-paid': {
        const total = await filings.totalFeesPaid();
        return res.json({ total });
      }

      // ─── Ingestion ────────────────────────────────────────────────────
      case 'start-ingestion-run': {
        const run = await ingestion.startRun(p.input as never);
        return res.json({ run });
      }
      case 'complete-ingestion-run': {
        const run = await ingestion.completeRun(p.input as never);
        return res.json({ run });
      }
      case 'list-ingestion-runs': {
        const runs = await ingestion.listRuns(p.source_path as string | undefined, p.limit as number | undefined);
        return res.json({ runs });
      }
      case 'latest-ingestion-run': {
        const run = await ingestion.latestRunForPath(p.source_path as string);
        return res.json({ run });
      }
      case 'ingestion-aggregate-counts': {
        const counts = await ingestion.aggregateCounts();
        return res.json({ counts });
      }

      // ─── Aggregate queries ────────────────────────────────────────────
      case 'check-blue-marlin-gate': {
        const status = await checkBlueMarlinGate();
        return res.json({ status });
      }
      case 'get-entity-stack': {
        const stack = await getEntityStack();
        return res.json({ stack });
      }

      default:
        return res.status(400).json({ error: `Unknown foundation action: ${action}` });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error({ event: 'foundation_error', action, error: msg });
    return res.status(500).json({ error: msg, action });
  }
}
