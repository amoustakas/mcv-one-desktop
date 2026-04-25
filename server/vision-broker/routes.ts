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
 * Routes registered (Session 2):
 *
 *   POST /vision/snapshot
 *     body: { sessionId, opts?: SnapshotOptions, agentHandle?, tenantId?, ventureId? }
 *     - resolves the live BrowserSession from server/browser-routes
 *     - calls @mcv/vision/getSnapshot(cdp, opts) — returns SnapshotResult
 *     - if opts.highlightActionable, runs annotateCanvasAdapter to
 *       overlay numbered boxes on the captured PNG
 *     - writes a synthetic ActionAuditEntry to the broker store
 *       (action = wait/networkIdle placeholder, decision.note flags
 *       it as snapshot-only-no-mutation — see below)
 *     - returns SnapshotResult with screenshotPng as base64
 *
 * Out-of-scope for Session 2 (lands in Session 3+):
 *   - real action routes (click/type/scroll/wait/navigate)
 *   - gate.evaluate() callsite — the gate is wired in
 *     ./auto-approve-gate.ts but this route does not invoke it
 *     (snapshots are non-mutating reads, no approval needed)
 *   - HITL UI / cockpit panel
 *   - M1 nervous-system event emission
 */

import { randomUUID } from 'node:crypto';

import { getSnapshot, type CdpSession } from '@mcv/vision';
import type { ActionAuditEntry, ActionRequest } from '@mcv/vision/broker-contract';

import { getSession } from '../browser-routes';
import { annotateCanvasAdapter } from './annotate-canvas';
import { openBrokerStore, type BrokerStore } from './sqlite-store';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExpressApp = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Req = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Res = any;

// ---------------------------------------------------------------------------
// Lazy singleton — the SQLite handle survives until the process exits.
// Tests do not use this path; they call openBrokerStore() directly with a
// per-test temp path.
// ---------------------------------------------------------------------------

let brokerStore: BrokerStore | null = null;

function ensureStore(): BrokerStore {
  if (!brokerStore) {
    brokerStore = openBrokerStore();
  }
  return brokerStore;
}

// ---------------------------------------------------------------------------
// Synthetic snapshot-probe action — the AuditEntry contract from
// @mcv/vision/types only models the 5 ActionKinds, none of which is
// "snapshot". We tag a wait/networkIdle as the placeholder and
// flag the decision.note so a reviewer can distinguish probes from
// real action audits at-a-glance.
// ---------------------------------------------------------------------------

const SNAPSHOT_PLACEHOLDER_ACTION: ActionRequest = {
  kind: 'wait',
  condition: { kind: 'networkIdle' },
};

const SNAPSHOT_PROBE_NOTE = 'snapshot-only-no-mutation';

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

      // Playwright's CDPSession is structurally compatible with the
      // SDK's CdpSession — both expose `send(method, params?)`.
      const snapshot = await getSnapshot(session.cdp as unknown as CdpSession, opts);

      // Optional annotation pass — overlay numbered boxes when the
      // caller asked for it. The adapter is canvas-backed; the SDK
      // remains zero-dep.
      let pngBytes = snapshot.screenshotPng;
      if (opts?.highlightActionable && snapshot.refs.length > 0) {
        pngBytes = await annotateCanvasAdapter.drawNumberedBoxes({
          pngBytes,
          refs: snapshot.refs,
        });
      }

      // Write a synthetic audit row so Session 3's HITL UI has rows
      // to render even before the first real action lands.
      const completedAt = Date.now();
      const entry: ActionAuditEntry = {
        id: randomUUID(),
        sessionId,
        agentHandle: agentHandle ?? 'snapshot-probe',
        tenantId: tenantId ?? '',
        ventureId: ventureId ?? '',
        action: SNAPSHOT_PLACEHOLDER_ACTION,
        preSnapshotId: '',
        postSnapshotId: null, // snapshot store lands in S3 — no ID to point at yet
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
        // Audit failure must NOT mask the snapshot — log and continue.
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

  // ── Health / introspection — used by the HITL UI in Session 3 ──
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
}
