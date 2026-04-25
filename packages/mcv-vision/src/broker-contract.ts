/**
 * @mcv/vision/broker-contract — names the broker side of the SDK.
 *
 * Re-exports the broker-relevant subset of `./types` so consumers can
 * `import { ApprovalGate, ActionAuditEntry } from '@mcv/vision/broker-contract'`
 * without pulling in snapshot/action helpers they don't need.
 *
 * No new types live here — the v0.1 contract in `./types` is the
 * single source of truth. This file's only job is to give the broker
 * a clean, narrow import surface so a future split (broker as its
 * own SDK package) is a one-file move.
 *
 * Session 2: observability-only. The auto-approve gate writes audit
 * rows; nothing reads them yet. Session 3 (HITL UI) introduces the
 * first real reader. Session 4 (event emission) introduces the first
 * BrokerEvent shape — at which point a `BrokerEvent` union may land
 * in this file. Skipped today on purpose: the contract isn't firm.
 */

export type {
  ApprovalGate,
  ApprovalContext,
  ApprovalVerdict,
  ApprovalDecision,
  ActionAuditEntry,
  ActionRequest,
  ActionResult,
  SideEffectSummary,
} from './types';
