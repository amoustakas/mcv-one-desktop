/**
 * mcv-one-desktop / vision-broker — observability-only ApprovalGate.
 *
 * VIL Session 2: every action is auto-approved. The point of this
 * file is to nail down the gate's wiring shape so Session 3's HITL
 * gate is a drop-in replacement — the route handler will keep the
 * same `gate.evaluate(req, ctx)` call site, just with a different
 * impl bound at startup.
 *
 * What this gate does:
 *   - returns verdict='auto' immediately (no async wait)
 *   - emits a structured console.info line per evaluation so the
 *     audit trail is visible even when no HITL UI is reading the
 *     SQLite store yet
 *
 * What this gate does NOT do (yet):
 *   - inspect navigation targets, mutation kinds, or the action
 *     surface area
 *   - block, time out, or persist a pending decision
 *   - emit any nervous-system event — that contract isn't firm
 *     until Session 4
 */

import type {
  ActionRequest,
  ApprovalContext,
  ApprovalDecision,
  ApprovalGate,
} from '@mcv/vision/broker-contract';

function describeRequest(req: ActionRequest): string {
  switch (req.kind) {
    case 'click':
      return `click ${req.refId}`;
    case 'type':
      return `type ${req.text.length} char(s) into ${req.refId}`;
    case 'scroll':
      return `scroll dx=${req.dx} dy=${req.dy}`;
    case 'wait':
      return `wait ${req.condition.kind}`;
    case 'navigate':
      return `navigate ${req.url}`;
  }
}

export const autoApproveGate: ApprovalGate = {
  async evaluate(req: ActionRequest, ctx: ApprovalContext): Promise<ApprovalDecision> {
    console.info(
      `[vision-broker] auto-approving ${describeRequest(req)} ` +
        `(session=${ctx.sessionId} agent=${ctx.agentHandle} tenant=${ctx.tenantId})`,
    );
    return {
      verdict: 'auto',
      decidedAt: Date.now(),
      decidedBy: null,
    };
  },
};
