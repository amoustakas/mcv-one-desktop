/**
 * mcv-one-desktop / vision-broker — heuristic HITL gate.
 *
 * VIL Session 3 replacement for auto-approve-gate.ts. Implements the
 * Decision #8 policy from the master plan:
 *
 *   - destructive actions  -> HITL approval (queued in pending-store)
 *   - blocked actions      -> rejected without queueing
 *   - everything else      -> auto-approved immediately
 *
 * The gate is constructed with a `getPreSnapshot(preSnapshotId)`
 * resolver because the ApprovalContext (frozen v0.1) only carries the
 * snapshot ID — not the full SnapshotResult. The route handler
 * registers the snapshot in a small in-memory cache before calling
 * gate.evaluate(); the cache TTL covers the approval window plus
 * margin.
 *
 * Why classify is exported separately from the ApprovalGate impl:
 *   - tests can exercise classification logic against fixture refs
 *     without spinning up a pending-store
 *   - future ML-based replacements (a small classifier trained on
 *     Tony's actual approve/reject history) can plug in by replacing
 *     just the classify() function
 */

import type {
  ActionRequest,
  ApprovalContext,
  ApprovalDecision,
  ApprovalGate,
  Ref,
  SnapshotResult,
} from '@mcv/vision/broker-contract';

import {
  DEFAULT_APPROVAL_TIMEOUT_MS,
  type PendingStore,
} from './pending-store';

// ---------------------------------------------------------------------------
// Classification policy
// ---------------------------------------------------------------------------

/**
 * Vocabulary of words that, when they appear in a Ref's accessible
 * name, mark a click as destructive. Case-insensitive. Word-fragments
 * count by design — a button labeled "Submit Form" hits on "submit",
 * "Confirm Delete" hits on both "confirm" and "delete".
 *
 * Adding to this list is a policy change; document the why in a memory
 * entry so future agents understand the intent.
 */
export const DESTRUCTIVE_VOCAB =
  /submit|delete|publish|send|pay|confirm|destroy|remove|withdraw|transfer/i;

export type Classification = 'safe' | 'destructive' | 'blocked';

export interface ClassifyContext {
  snapshot: SnapshotResult | null;
}

/**
 * Pure classification — no side effects, no I/O. The gate's
 * .evaluate() wraps this with the pending-store enqueue-and-await
 * machinery; tests of the policy can call classify() directly.
 *
 * When `ctx.snapshot` is null (the route couldn't capture a
 * pre-snapshot for some reason) the classifier returns 'destructive'
 * for any click/type/navigate — fail-closed by design. Scroll/wait
 * stay 'safe' regardless of snapshot availability.
 */
export function classify(req: ActionRequest, ctx: ClassifyContext): Classification {
  switch (req.kind) {
    case 'click': {
      const ref = ctx.snapshot?.refs.find((r) => r.id === req.refId);
      if (!ref) return ctx.snapshot ? 'safe' : 'destructive';
      // Plan §C: click on a Ref whose name matches DESTRUCTIVE_VOCAB.
      if (DESTRUCTIVE_VOCAB.test(ref.name)) return 'destructive';
      // Plan §C: any action whose ref ancestor includes 'dialog' AND
      // ref name matches the destructive vocab — already covered
      // above, but explicit for completeness as the policy evolves.
      if (isInsideDialog(ref) && DESTRUCTIVE_VOCAB.test(ref.name)) return 'destructive';
      return 'safe';
    }
    case 'type': {
      const ref = ctx.snapshot?.refs.find((r) => r.id === req.refId);
      if (!ref) return ctx.snapshot ? 'safe' : 'destructive';
      // Plan §C: type into a Ref where role==='textbox' AND any
      // ancestor in ancestorRoles includes 'form'. Filling form
      // fields is a precursor to submit and gates accordingly.
      if (ref.role === 'textbox' && isInsideForm(ref)) return 'destructive';
      return 'safe';
    }
    case 'navigate': {
      const targetOrigin = originOf(req.url);
      const currentOrigin = originOf(ctx.snapshot?.url ?? '');
      // Cross-origin nav is destructive (could be phishing trap or
      // exfiltration). Same-origin SPA route changes are safe.
      // If we can't determine either origin, fall back to safe —
      // navigates to data:/blob:/about:blank don't have origins.
      if (targetOrigin && currentOrigin && targetOrigin !== currentOrigin) {
        return 'destructive';
      }
      return 'safe';
    }
    case 'scroll':
    case 'wait':
      return 'safe';
  }
}

function isInsideForm(ref: Ref): boolean {
  return ref.ancestorRoles.includes('form');
}

function isInsideDialog(ref: Ref): boolean {
  return ref.ancestorRoles.includes('dialog');
}

function originOf(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.protocol === 'about:' || u.protocol === 'data:' || u.protocol === 'blob:') {
      return null;
    }
    return u.origin;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Gate factory
// ---------------------------------------------------------------------------

export interface SnapshotResolver {
  /** Returns the snapshot the route handler captured immediately
   *  before calling gate.evaluate(). May return null if the cache
   *  entry has expired or was never set — classify() handles that
   *  with a fail-closed default. */
  get(preSnapshotId: string): SnapshotResult | null;
}

export interface CreateHeuristicGateOptions {
  pendingStore: PendingStore;
  snapshots: SnapshotResolver;
  /** Override default 60s timeout for destructive-pending awaits.
   *  Production reads MCV_VISION_APPROVAL_TIMEOUT_MS via
   *  resolveDefaultTimeoutMs() below; tests inject directly. */
  timeoutMs?: number;
}

export function createHeuristicGate(opts: CreateHeuristicGateOptions): ApprovalGate {
  const timeoutMs = opts.timeoutMs ?? resolveDefaultTimeoutMs();

  return {
    async evaluate(
      req: ActionRequest,
      ctx: ApprovalContext,
    ): Promise<ApprovalDecision> {
      const snapshot = opts.snapshots.get(ctx.preSnapshotId);
      const verdict = classify(req, { snapshot });

      if (verdict === 'safe') {
        return {
          verdict: 'auto',
          decidedAt: Date.now(),
          decidedBy: null,
        };
      }

      if (verdict === 'blocked') {
        return {
          verdict: 'rejected',
          decidedAt: Date.now(),
          decidedBy: 'gate-policy',
          note: 'blocked by policy',
        };
      }

      // 'destructive' — enqueue and await human / timeout.
      return opts.pendingStore.enqueue({
        req,
        ctx,
        preSnapshot: snapshot,
        timeoutMs,
      });
    },
  };
}

/** Reads MCV_VISION_APPROVAL_TIMEOUT_MS from the env, parses, and
 *  falls back to DEFAULT_APPROVAL_TIMEOUT_MS if missing/invalid. */
export function resolveDefaultTimeoutMs(): number {
  const raw = process.env.MCV_VISION_APPROVAL_TIMEOUT_MS;
  if (!raw) return DEFAULT_APPROVAL_TIMEOUT_MS;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_APPROVAL_TIMEOUT_MS;
  return n;
}
