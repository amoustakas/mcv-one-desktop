/**
 * @mcv/vision — public entry.
 *
 * v0.1 surface:
 *   - types            — all contract types (Ref, SnapshotResult, ActionRequest, etc.)
 *   - ref-id           — `makeRefId({ role, name, ancestorRoles, originOrdinal })`
 *   - snapshot         — `getSnapshot(cdp, opts?)` + `CdpSession` structural type
 *   - actions          — `click / type / scroll / wait / navigate`
 *   - annotate         — `AnnotateAdapter` + `nullAnnotateAdapter` (Session 2)
 *   - broker-contract  — narrow re-export for broker consumers      (Session 2)
 *
 * Subpath exports mirror these in package.json. Future sessions add
 * `./mcp-adapter` — each new subpath requires a matching "exports"
 * entry there.
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

export { makeRefId, type RefIdInputs } from './ref-id';
export { getSnapshot, type CdpSession } from './snapshot';
export { click, type, scroll, wait, navigate } from './actions';
export {
  nullAnnotateAdapter,
  type AnnotateAdapter,
  type AnnotateInput,
} from './annotate';
