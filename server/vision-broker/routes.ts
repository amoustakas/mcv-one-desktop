/**
 * mcv-one-desktop / vision-broker — Express routes.
 *
 * NOTE: The Session 2 plan named this file `fastify.ts`, but the
 * actual mcv-one-desktop daemon (server/local.ts) runs Express, not
 * Fastify. This file follows the local-server convention of
 * `register*Routes(app)` registration callbacks (see
 * server/browser-routes.ts) so the route mounts cleanly under the
 * same daemon process.
 *
 * Routes registered:
 *
 *   POST /vision/snapshot
 *     Pure observation — captures the AX-tree snapshot, optionally
 *     overlays numbered boxes, writes a synthetic audit row.
 *
 *   POST /vision/action/click | type | scroll | wait | navigate
 *     Gated mutation — captures pre-snapshot, runs heuristic-gate
 *     classification, on auto/approved verdict dispatches via
 *     @mcv/vision wrapped with withSideEffectCapture, on rejected/
 *     timeout returns without dispatching. Every dispatch writes
 *     a populated ActionAuditEntry.
 *
 *   GET  /vision/audit/recent?limit=20
 *     Lists the most recent ActionAuditEntry rows for the cockpit.
 *
 *   GET  /vision/pending-approvals
 *     JSON snapshot of currently-pending approvals (cockpit row data).
 *
 *   POST /vision/approvals/:id/decide
 *     Body: { verdict: 'approved'|'rejected', note?: string }
 *     Operator decision from the cockpit panel.
 *
 *   GET  /vision/pending-approvals/stream
 *     text/event-stream — SSE that emits pending-added / pending-decided
 *     / pending-timeout events from the in-process pending-store.
 *
 * VIL Session 3 added everything except /vision/snapshot and
 * /vision/audit/recent (those landed in Session 2). The auto-approve
 * gate is replaced by createHeuristicGate; see heuristic-gate.ts.
 */

import { randomUUID } from 'node:crypto';

import {
  click as visionClick,
  type as visionType,
  scroll as visionScroll,
  wait as visionWait,
  navigate as visionNavigate,
  getSnapshot,
  type CdpSession,
} from '@mcv/vision';
import type {
  ActionAuditEntry,
  ActionRequest,
  ActionResult,
  ApprovalContext,
  ApprovalDecision,
  ApprovalGate,
  SnapshotResult,
} from '@mcv/vision/broker-contract';

import { getSession } from '../browser-routes';
import { annotateCanvasAdapter } from './annotate-canvas';
import {
  createHeuristicGate,
  resolveDefaultTimeoutMs,
  type SnapshotResolver,
} from './heuristic-gate';
import {
  getDefaultPendingStore,
  type PendingStore,
  type PendingStoreEvent,
} from './pending-store';
import { withSideEffectCapture } from './side-effects';
import { openBrokerStore, type BrokerStore } from './sqlite-store';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExpressApp = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Req = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Res = any;

// ---------------------------------------------------------------------------
// Snapshot cache — bridge between the route handler (which captures the
// pre-snapshot) and the gate (which only sees the snapshot ID via the
// frozen ApprovalContext). FIFO eviction, 5-minute TTL — comfortably
// outlives the 60s approval window.
// ---------------------------------------------------------------------------

const SNAPSHOT_CACHE_TTL_MS = 5 * 60_000;
const SNAPSHOT_CACHE_MAX = 100;

interface CachedSnapshot {
  snap: SnapshotResult;
  expiresAt: number;
}

function createSnapshotCache(): SnapshotResolver & {
  set(id: string, snap: SnapshotResult): void;
} {
  const entries = new Map<string, CachedSnapshot>();

  function evictExpired(now: number): void {
    for (const [id, e] of entries) {
      if (e.expiresAt <= now) entries.delete(id);
    }
  }

  return {
    set(id: string, snap: SnapshotResult): void {
      const now = Date.now();
      evictExpired(now);
      // Cap size at SNAPSHOT_CACHE_MAX — drop oldest insertion (Map
      // iteration order = insertion order so this works without a
      // separate LRU structure).
      while (entries.size >= SNAPSHOT_CACHE_MAX) {
        const oldestKey = entries.keys().next().value;
        if (oldestKey === undefined) break;
        entries.delete(oldestKey);
      }
      entries.set(id, { snap, expiresAt: now + SNAPSHOT_CACHE_TTL_MS });
    },
    get(id: string): SnapshotResult | null {
      const e = entries.get(id);
      if (!e) return null;
      if (e.expiresAt <= Date.now()) {
        entries.delete(id);
        return null;
      }
      return e.snap;
    },
  };
}

// ---------------------------------------------------------------------------
// Lazy singletons — survive until the process exits.
// ---------------------------------------------------------------------------

let brokerStore: BrokerStore | null = null;
let pendingStore: PendingStore | null = null;
let gate: ApprovalGate | null = null;
let snapshotCache: ReturnType<typeof createSnapshotCache> | null = null;

function ensureStore(): BrokerStore {
  if (!brokerStore) brokerStore = openBrokerStore();
  return brokerStore;
}

function ensurePendingStore(): PendingStore {
  if (!pendingStore) pendingStore = getDefaultPendingStore();
  return pendingStore;
}

function ensureSnapshotCache(): ReturnType<typeof createSnapshotCache> {
  if (!snapshotCache) snapshotCache = createSnapshotCache();
  return snapshotCache;
}

function ensureGate(): ApprovalGate {
  if (!gate) {
    gate = createHeuristicGate({
      pendingStore: ensurePendingStore(),
      snapshots: ensureSnapshotCache(),
      timeoutMs: resolveDefaultTimeoutMs(),
    });
  }
  return gate;
}

// ---------------------------------------------------------------------------
// Synthetic snapshot-probe action — the AuditEntry contract from
// @mcv/vision/types only models the 5 ActionKinds; "snapshot" isn't one.
// We tag a wait/networkIdle as the placeholder + flag the decision.note
// so a reviewer can distinguish probes from real action audits at a glance.
// ---------------------------------------------------------------------------

const SNAPSHOT_PLACEHOLDER_ACTION: ActionRequest = {
  kind: 'wait',
  condition: { kind: 'networkIdle' },
};

const SNAPSHOT_PROBE_NOTE = 'snapshot-only-no-mutation';

// ---------------------------------------------------------------------------
// Action route helper — dispatches via @mcv/vision based on req.kind.
// Wrapping in withSideEffectCapture happens at the call site so the
// pre-action URL is in scope.
// ---------------------------------------------------------------------------

async function dispatchAction(cdp: CdpSession, req: ActionRequest): Promise<ActionResult> {
  switch (req.kind) {
    case 'click':
      return visionClick(cdp, req.refId);
    case 'type':
      return visionType(cdp, req.refId, req.text, { clear: req.clear });
    case 'scroll':
      return visionScroll(cdp, req.dx, req.dy);
    case 'wait':
      return visionWait(cdp, req.condition);
    case 'navigate':
      return visionNavigate(cdp, req.url);
  }
}

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

export function registerVisionBrokerRoutes(app: ExpressApp): void {
  app.post('/vision/snapshot', async (req: Req, res: Res) => {
    const startedAt = Date.now();
    try {
      const {
        sessionId,
        opts,
        agentHandle,
        tenantId,
        ventureId,
      }: {
        sessionId?: string;
        opts?: Parameters<typeof getSnapshot>[1];
        agentHandle?: string;
        tenantId?: string;
        ventureId?: string;
      } = req.body ?? {};

      if (!sessionId || typeof sessionId !== 'string') {
        return res.status(400).json({ error: 'sessionId required' });
      }

      const session = getSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      const snapshot = await getSnapshot(session.cdp as unknown as CdpSession, opts);

      let pngBytes = snapshot.screenshotPng;
      if (opts?.highlightActionable && snapshot.refs.length > 0) {
        pngBytes = await annotateCanvasAdapter.drawNumberedBoxes({
          pngBytes,
          refs: snapshot.refs,
        });
      }

      const completedAt = Date.now();
      const entry: ActionAuditEntry = {
        id: randomUUID(),
        sessionId,
        agentHandle: agentHandle ?? 'snapshot-probe',
        tenantId: tenantId ?? '',
        ventureId: ventureId ?? '',
        action: SNAPSHOT_PLACEHOLDER_ACTION,
        preSnapshotId: '',
        postSnapshotId: null,
        decision: {
          verdict: 'auto',
          decidedAt: completedAt,
          decidedBy: null,
          note: SNAPSHOT_PROBE_NOTE,
        },
        sideEffects: null,
        startedAt,
        completedAt,
      };

      try {
        ensureStore().appendAuditEntry(entry);
      } catch (storeErr) {
        console.warn(
          '[vision-broker] audit append failed:',
          (storeErr as Error).message,
        );
      }

      const screenshotPngBase64 = Buffer.from(pngBytes).toString('base64');
      return res.json({
        url: snapshot.url,
        title: snapshot.title,
        takenAt: snapshot.takenAt,
        summary: snapshot.summary,
        refs: snapshot.refs,
        screenshotPngBase64,
        auditId: entry.id,
      });
    } catch (err: unknown) {
      console.error('[vision-broker] /vision/snapshot failed:', err);
      return res.status(500).json({ error: (err as Error).message });
    }
  });

  // ── Action routes (gated by heuristic-gate) ──

  app.post('/vision/action/:kind', async (req: Req, res: Res) => {
    const startedAt = Date.now();
    const kindParam = String(req.params?.kind ?? '');
    if (!isActionKind(kindParam)) {
      return res.status(400).json({ error: `unknown action kind: ${kindParam}` });
    }

    try {
      const {
        sessionId,
        agentHandle,
        tenantId,
        ventureId,
        ...actionPayload
      }: {
        sessionId?: string;
        agentHandle?: string;
        tenantId?: string;
        ventureId?: string;
        [k: string]: unknown;
      } = req.body ?? {};

      if (!sessionId || typeof sessionId !== 'string') {
        return res.status(400).json({ error: 'sessionId required' });
      }

      const session = getSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      const actionRequest = buildActionRequest(kindParam, actionPayload);
      if ('error' in actionRequest) {
        return res.status(400).json({ error: actionRequest.error });
      }

      const cdp = session.cdp as unknown as CdpSession;

      // Capture pre-snapshot, cache it under a fresh ID, then ask the gate.
      const preSnapshot = await getSnapshot(cdp);
      const preSnapshotId = randomUUID();
      ensureSnapshotCache().set(preSnapshotId, preSnapshot);

      const ctx: ApprovalContext = {
        sessionId,
        agentHandle: agentHandle ?? 'agent-default',
        tenantId: tenantId ?? '',
        ventureId: ventureId ?? '',
        preSnapshotId,
      };

      const decision: ApprovalDecision = await ensureGate().evaluate(actionRequest, ctx);

      // Verdicts that block dispatch: 'rejected' (explicit no) and 'timeout'
      // (auto-rejected after the deadline elapsed).
      const blocked = decision.verdict === 'rejected' || decision.verdict === 'timeout';

      let actionResult: ActionResult | null = null;
      let sideEffects = null as ActionResult['sideEffects'] | null;

      if (!blocked) {
        const wrap = await withSideEffectCapture(cdp, preSnapshot.url, () =>
          dispatchAction(cdp, actionRequest),
        );
        actionResult = wrap.result;
        sideEffects = wrap.sideEffects;
      }

      const completedAt = Date.now();
      const auditEntry: ActionAuditEntry = {
        id: randomUUID(),
        sessionId,
        agentHandle: ctx.agentHandle,
        tenantId: ctx.tenantId,
        ventureId: ctx.ventureId,
        action: actionRequest,
        preSnapshotId,
        postSnapshotId: null, // snapshot store lands in S4
        decision,
        sideEffects: sideEffects ?? null,
        startedAt,
        completedAt,
      };

      try {
        ensureStore().appendAuditEntry(auditEntry);
      } catch (storeErr) {
        console.warn(
          '[vision-broker] audit append failed:',
          (storeErr as Error).message,
        );
      }

      const responsePayload: Record<string, unknown> = {
        ok: !blocked && (actionResult?.ok ?? false),
        decision,
        auditId: auditEntry.id,
      };
      if (actionResult) {
        responsePayload.snapshot = actionResult.snapshot;
        responsePayload.error = actionResult.error;
        responsePayload.sideEffects = sideEffects;
      } else {
        responsePayload.snapshot = preSnapshot; // pre-snapshot if blocked
      }

      return res.json(responsePayload);
    } catch (err: unknown) {
      console.error(`[vision-broker] /vision/action/${kindParam} failed:`, err);
      return res.status(500).json({ error: (err as Error).message });
    }
  });

  // ── Health / introspection ──

  app.get('/vision/audit/recent', (req: Req, res: Res) => {
    const limitRaw = parseInt(String(req.query?.limit ?? '20'), 10);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : 20;
    try {
      const rows = ensureStore().listRecentEntries(limit);
      res.json({ entries: rows });
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // ── HITL endpoints ──

  app.get('/vision/pending-approvals', (_req: Req, res: Res) => {
    try {
      const pending = ensurePendingStore().list();
      res.json({ pending });
    } catch (err: unknown) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/vision/approvals/:id/decide', (req: Req, res: Res) => {
    try {
      const id = String(req.params?.id ?? '');
      const { verdict, note, decidedBy }: { verdict?: string; note?: string; decidedBy?: string } =
        req.body ?? {};

      if (verdict !== 'approved' && verdict !== 'rejected') {
        return res
          .status(400)
          .json({ error: "verdict must be 'approved' or 'rejected'" });
      }

      const labelDecidedBy = decidedBy ?? 'super-admin';
      const ok = ensurePendingStore().setVerdict(id, verdict, labelDecidedBy, note);
      if (!ok) {
        return res
          .status(404)
          .json({ error: 'pending approval not found or already decided' });
      }
      return res.json({ ok: true });
    } catch (err: unknown) {
      return res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get('/vision/pending-approvals/stream', (req: Req, res: Res) => {
    // Standard SSE handshake. EventSource on the browser side opens
    // a long-lived GET; we keep the connection open and write
    // text/event-stream frames until the client disconnects.
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    function sendEvent(event: PendingStoreEvent): void {
      try {
        res.write(`event: ${event.kind}\n`);
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      } catch {
        // Connection closed mid-write; cleanup runs in 'close' handler.
      }
    }

    // Replay current pending so a fresh subscriber sees existing rows.
    try {
      for (const approval of ensurePendingStore().list()) {
        sendEvent({ kind: 'pending-added', approval });
      }
    } catch {
      /* empty list is fine */
    }

    const off = ensurePendingStore().subscribe(sendEvent);

    // Keep-alive ping every 25s — proxies (and EventSource itself)
    // tolerate idle connections better when there's regular traffic.
    const keepAlive = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch {
        /* will be cleaned up on close */
      }
    }, 25_000);
    (keepAlive as { unref?: () => void }).unref?.();

    req.on('close', () => {
      clearInterval(keepAlive);
      off();
    });
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ACTION_KINDS = ['click', 'type', 'scroll', 'wait', 'navigate'] as const;
type SupportedActionKind = (typeof ACTION_KINDS)[number];

function isActionKind(value: string): value is SupportedActionKind {
  return (ACTION_KINDS as readonly string[]).includes(value);
}

type BuildResult = ActionRequest | { error: string };

function buildActionRequest(
  kind: SupportedActionKind,
  payload: Record<string, unknown>,
): BuildResult {
  switch (kind) {
    case 'click': {
      const refId = typeof payload.refId === 'string' ? payload.refId : '';
      if (!refId) return { error: 'refId required' };
      return { kind: 'click', refId };
    }
    case 'type': {
      const refId = typeof payload.refId === 'string' ? payload.refId : '';
      const text = typeof payload.text === 'string' ? payload.text : '';
      if (!refId) return { error: 'refId required' };
      const clear = typeof payload.clear === 'boolean' ? payload.clear : undefined;
      return clear === undefined
        ? { kind: 'type', refId, text }
        : { kind: 'type', refId, text, clear };
    }
    case 'scroll': {
      const dx = typeof payload.dx === 'number' ? payload.dx : 0;
      const dy = typeof payload.dy === 'number' ? payload.dy : 0;
      return { kind: 'scroll', dx, dy };
    }
    case 'wait': {
      const condition = payload.condition as ActionRequest extends { kind: 'wait'; condition: infer C }
        ? C
        : never;
      if (!condition || typeof condition !== 'object') {
        return { error: 'condition required' };
      }
      return { kind: 'wait', condition };
    }
    case 'navigate': {
      const url = typeof payload.url === 'string' ? payload.url : '';
      if (!url) return { error: 'url required' };
      return { kind: 'navigate', url };
    }
  }
}
