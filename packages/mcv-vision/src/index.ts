/**
 * @mcv/vision — public entry.
 *
 * v0.1: types-only while the SDK primitives land in Session 1.
 * Subsequent sessions add `./snapshot`, `./actions`, `./ref-id`,
 * `./annotate`, `./broker-contract`, `./mcp-adapter` subpath exports.
 * Update `package.json` "exports" when each lands.
 */

export type {
  AxRole,
  Ref,
  SnapshotOptions,
  SnapshotResult,
  ActionKind,
  WaitCondition,
  ActionRequest,
  ActionResult,
  SideEffectSummary,
  ApprovalVerdict,
  ApprovalDecision,
  ApprovalGate,
  ApprovalContext,
  ActionAuditEntry,
} from './types';
