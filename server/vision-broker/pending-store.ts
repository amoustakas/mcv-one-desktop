/**
 * mcv-one-desktop / vision-broker — in-process pending approval store.
 *
 * The HITL gate's "destructive" classification path enqueues an
 * approval here, then awaits a verdict from either:
 *
 *   - a human operator deciding via the Desktop cockpit panel
 *     (POST /vision/approvals/:id/decide)
 *   - the configured timeout firing (default 60s)
 *
 * Subscribers (SSE handler in routes.ts, the cockpit panel via
 * EventSource, future BrokerEvent emitters) get pending-added /
 * pending-decided / pending-timeout events as they fire.
 *
 * Lifecycle invariants:
 *
 *   - exactly ONE terminal event per pending: pending-decided OR
 *     pending-timeout, never both
 *   - the awaited promise resolves exactly once with an
 *     ApprovalDecision; subsequent setVerdict() calls are no-ops
 *   - the entry is removed from `list()` on terminal event so the UI
 *     doesn't render stale rows
 *
 * Replacement path (Session 5):
 *   This in-process store is intentionally drop-in-replaceable with a
 *   Supabase Realtime adapter — both expose `subscribe(handler)` and
 *   `enqueue → Promise<ApprovalDecision>`. When cross-machine approval
 *   lands (Tony approves from Samsung while desktop runs on Atlas),
 *   the gate stays the same; only this file swaps.
 */

import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';

import type {
  ActionRequest,
  ApprovalContext,
  ApprovalDecision,
  ApprovalVerdict,
  SnapshotResult,
} from '@mcv/vision/broker-contract';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export const DEFAULT_APPROVAL_TIMEOUT_MS = 60_000;

/**
 * Snapshot data the cockpit needs to render an approval row. We
 * deliberately copy out only the human-readable fields + the PNG
 * bytes — sending the full SnapshotResult through SSE inflates
 * payloads with refs that the UI doesn't need at the row level.
 */
export interface PendingApprovalView {
  id: string;
  req: ActionRequest;
  ctx: ApprovalContext;
  enqueuedAt: number;
  deadlineAt: number;
  preSnapshotUrl: string | null;
  preSnapshotTitle: string | null;
  /** Base64-encoded PNG of the pre-action snapshot for the diff
   *  viewer. Null if no snapshot was attached at enqueue time. */
  preSnapshotPngBase64: string | null;
  /** Human-readable one-liner: "click 'Submit' on /dashboard". */
  refDescriptor: string;
}

export type PendingStoreEvent =
  | { kind: 'pending-added'; approval: PendingApprovalView }
  | {
      kind: 'pending-decided';
      id: string;
      verdict: ApprovalVerdict;
      decidedBy: string | null;
      note?: string;
    }
  | { kind: 'pending-timeout'; id: string };

export interface EnqueueOptions {
  req: ActionRequest;
  ctx: ApprovalContext;
  preSnapshot?: SnapshotResult | null;
  /** Override the default 60s timeout — used in tests to keep them fast. */
  timeoutMs?: number;
  /** Inject the deadline clock for tests; production calls pass undefined
   *  so we use Date.now(). */
  nowMs?: number;
}

export interface PendingStore {
  enqueue(opts: EnqueueOptions): Promise<ApprovalDecision>;
  list(): PendingApprovalView[];
  setVerdict(
    id: string,
    verdict: 'approved' | 'rejected',
    decidedBy: string | null,
    note?: string,
  ): boolean;
  subscribe(handler: (event: PendingStoreEvent) => void): () => void;
  /** Number of currently-pending entries. Useful in tests + telemetry. */
  size(): number;
  /** Test helper: force-fire timeouts immediately (returns count). */
  __forceTimeoutAll?(): number;
}

// ---------------------------------------------------------------------------
// Internal entry shape — superset of the view; we slice the view to
// avoid sending heavy fields like the full SnapshotResult over SSE.
// ---------------------------------------------------------------------------

interface InternalEntry {
  view: PendingApprovalView;
  resolveDecision: (d: ApprovalDecision) => void;
  timeoutHandle: ReturnType<typeof setTimeout> | null;
  /** Set to true once a terminal event has fired. Subsequent
   *  setVerdict / timeout firings become no-ops. */
  settled: boolean;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createPendingStore(): PendingStore {
  const emitter = new EventEmitter();
  const entries = new Map<string, InternalEntry>();

  function emit(event: PendingStoreEvent): void {
    emitter.emit('event', event);
  }

  function settleEntry(
    id: string,
    decision: ApprovalDecision,
    terminal: PendingStoreEvent,
  ): void {
    const entry = entries.get(id);
    if (!entry || entry.settled) return;
    entry.settled = true;
    if (entry.timeoutHandle !== null) {
      clearTimeout(entry.timeoutHandle);
      entry.timeoutHandle = null;
    }
    entries.delete(id);
    entry.resolveDecision(decision);
    emit(terminal);
  }

  return {
    enqueue(opts: EnqueueOptions): Promise<ApprovalDecision> {
      const id = randomUUID();
      const now = opts.nowMs ?? Date.now();
      const timeoutMs = opts.timeoutMs ?? DEFAULT_APPROVAL_TIMEOUT_MS;
      const deadlineAt = now + timeoutMs;

      const view: PendingApprovalView = {
        id,
        req: opts.req,
        ctx: opts.ctx,
        enqueuedAt: now,
        deadlineAt,
        preSnapshotUrl: opts.preSnapshot?.url ?? null,
        preSnapshotTitle: opts.preSnapshot?.title ?? null,
        preSnapshotPngBase64: opts.preSnapshot
          ? Buffer.from(opts.preSnapshot.screenshotPng).toString('base64')
          : null,
        refDescriptor: describeRequest(opts.req, opts.preSnapshot),
      };

      return new Promise<ApprovalDecision>((resolve) => {
        const entry: InternalEntry = {
          view,
          resolveDecision: resolve,
          timeoutHandle: null,
          settled: false,
        };

        // Arm the timeout — fires the rejection path and emits
        // pending-timeout. We use 'timeout' as the verdict so the
        // audit can distinguish ignored from explicitly-rejected.
        entry.timeoutHandle = setTimeout(() => {
          settleEntry(
            id,
            {
              verdict: 'timeout',
              decidedAt: Date.now(),
              decidedBy: null,
              note: `auto-rejected after ${timeoutMs}ms with no human decision`,
            },
            { kind: 'pending-timeout', id },
          );
        }, timeoutMs);
        // Don't keep the event loop alive for a pending approval —
        // process exit is fine if nothing else is running.
        if (typeof entry.timeoutHandle === 'object' && entry.timeoutHandle !== null) {
          (entry.timeoutHandle as { unref?: () => void }).unref?.();
        }

        entries.set(id, entry);
        emit({ kind: 'pending-added', approval: view });
      });
    },

    list(): PendingApprovalView[] {
      return Array.from(entries.values()).map((e) => e.view);
    },

    setVerdict(
      id: string,
      verdict: 'approved' | 'rejected',
      decidedBy: string | null,
      note?: string,
    ): boolean {
      const entry = entries.get(id);
      if (!entry || entry.settled) return false;

      const decision: ApprovalDecision = {
        verdict,
        decidedAt: Date.now(),
        decidedBy,
        ...(note !== undefined ? { note } : {}),
      };

      settleEntry(id, decision, {
        kind: 'pending-decided',
        id,
        verdict,
        decidedBy,
        ...(note !== undefined ? { note } : {}),
      });
      return true;
    },

    subscribe(handler: (event: PendingStoreEvent) => void): () => void {
      emitter.on('event', handler);
      return () => {
        emitter.off('event', handler);
      };
    },

    size(): number {
      return entries.size;
    },

    __forceTimeoutAll(): number {
      const ids = Array.from(entries.keys());
      for (const id of ids) {
        const entry = entries.get(id);
        if (!entry || entry.settled) continue;
        settleEntry(
          id,
          {
            verdict: 'timeout',
            decidedAt: Date.now(),
            decidedBy: null,
            note: 'forced',
          },
          { kind: 'pending-timeout', id },
        );
      }
      return ids.length;
    },
  };
}

// ---------------------------------------------------------------------------
// Process-singleton (for the production daemon — tests use createPendingStore directly)
// ---------------------------------------------------------------------------

let singleton: PendingStore | null = null;

export function getDefaultPendingStore(): PendingStore {
  if (!singleton) singleton = createPendingStore();
  return singleton;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function describeRequest(req: ActionRequest, snap?: SnapshotResult | null): string {
  switch (req.kind) {
    case 'click': {
      const ref = snap?.refs.find((r) => r.id === req.refId);
      const ctx = snap?.url ? ` on ${snap.url}` : '';
      return ref
        ? `click '${ref.name || ref.role}' ${ref.role}${ctx}`
        : `click ${req.refId}${ctx}`;
    }
    case 'type': {
      const ref = snap?.refs.find((r) => r.id === req.refId);
      const target = ref ? `'${ref.name || ref.role}' ${ref.role}` : req.refId;
      return `type ${req.text.length} char(s) into ${target}`;
    }
    case 'scroll':
      return `scroll dx=${req.dx} dy=${req.dy}`;
    case 'wait':
      return `wait ${req.condition.kind}`;
    case 'navigate':
      return `navigate to ${req.url}`;
  }
}
