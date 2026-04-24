/**
 * @mcv/vision — core type surface (v0.1 API contract).
 *
 * These types are the contract between:
 *   - the SDK (snapshot + actions + ref-id)
 *   - the broker (`mcv-one-desktop/server/vision-broker/`)
 *   - the HITL UI (`VisionBrokerPanel.tsx`)
 *   - the Antigravity MCP adapter (Session 5)
 *
 * Ref-id is the load-bearing invariant. Changing the shape or hashing
 * algorithm breaks every persisted action audit. Bump the package
 * `version` and note in memory if you need to evolve it.
 */

// ---------------------------------------------------------------------------
// Ref — stable, addressable handle to an actionable DOM element
// ---------------------------------------------------------------------------

/**
 * WAI-ARIA role narrowed to the action-relevant subset. Additional roles
 * may appear in AX output but are non-interactive — we ignore them for
 * ref minting.
 */
export type AxRole =
  | 'button'
  | 'link'
  | 'textbox'
  | 'searchbox'
  | 'combobox'
  | 'checkbox'
  | 'radio'
  | 'switch'
  | 'slider'
  | 'menuitem'
  | 'option'
  | 'tab'
  | 'listbox';

/**
 * Stable element reference. `id` is derived from the deterministic hash
 * implemented in `src/ref-id.ts` — never hand-constructed. Clients
 * address actions by `id` only; the remaining fields are for human /
 * agent inspection and the HITL UI.
 */
export interface Ref {
  /** Deterministic hash: see ref-id.ts. Opaque, stable across reloads. */
  id: string;
  role: AxRole;
  /** Accessible name resolved per the W3C AccName algorithm. */
  name: string;
  /** Viewport-relative bounding box at snapshot time. */
  bounds: { x: number; y: number; width: number; height: number };
  /** 0-based order among siblings of the same role under the same parent. */
  originOrdinal: number;
  /** Roles of ancestors from the element upward, truncated to 8. */
  ancestorRoles: string[];
  /** True if the element is clipped / off-screen at snapshot time. */
  offscreen: boolean;
  /** True if AX reports `disabled` — agents must not target disabled refs. */
  disabled: boolean;
}

// ---------------------------------------------------------------------------
// SnapshotResult — payload returned by getSnapshot() and by every action
// ---------------------------------------------------------------------------

export interface SnapshotOptions {
  /** Emit an annotated PNG with numbered boxes. Session 2+. */
  highlightActionable?: boolean;
  /** Cap the refs array at N. Default = unlimited. */
  maxRefs?: number;
  /** Include the terse text summary. Default = true. */
  includeSummary?: boolean;
  /** Full page vs viewport. Default = viewport. */
  fullPage?: boolean;
}

export interface SnapshotResult {
  /** Page URL at capture time. */
  url: string;
  /** Document title. */
  title: string;
  /** Epoch millis, server-side clock. */
  takenAt: number;
  /** Raw PNG bytes. Always present. */
  screenshotPng: Uint8Array;
  /** Refs indexed in document order. Box numbers in the annotated PNG
   *  (when `highlightActionable` is true) correspond to `refs[i]`. */
  refs: Ref[];
  /** Terse 1-line description. Example: "Dashboard, 2 forms, 5 inputs,
   *  1 submit button." Agents use this as a cheap prompt-cache-friendly
   *  view before scanning the full ref list. */
  summary: string;
}

// ---------------------------------------------------------------------------
// Actions — the agent's hands
// ---------------------------------------------------------------------------

export type ActionKind =
  | 'click'
  | 'type'
  | 'scroll'
  | 'wait'
  | 'navigate';

export type WaitCondition =
  | { kind: 'networkIdle'; timeoutMs?: number }
  | { kind: 'selector';    selector: string; timeoutMs?: number }
  | { kind: 'text';        text: string; timeoutMs?: number };

export type ActionRequest =
  | { kind: 'click';    refId: string }
  | { kind: 'type';     refId: string; text: string; clear?: boolean }
  | { kind: 'scroll';   dx: number; dy: number }
  | { kind: 'wait';     condition: WaitCondition }
  | { kind: 'navigate'; url: string };

export interface ActionResult {
  ok: boolean;
  /** Fresh snapshot captured after the action resolves. Agents always
   *  get a post-action view so they can chain decisions. */
  snapshot: SnapshotResult;
  /** Populated when `ok` is false. */
  error?: string;
  /** Network side-effects observed during action (POSTs, navs).
   *  Populated by the broker middleware, not by the raw SDK. */
  sideEffects?: SideEffectSummary;
}

export interface SideEffectSummary {
  networkRequests: Array<{ method: string; url: string; status: number }>;
  crossOriginNavigations: string[];
  formSubmits: number;
}

// ---------------------------------------------------------------------------
// ApprovalGate — HITL broker contract (impl lives in server/vision-broker)
// ---------------------------------------------------------------------------

export type ApprovalVerdict = 'approved' | 'rejected' | 'auto' | 'timeout';

export interface ApprovalDecision {
  verdict: ApprovalVerdict;
  decidedAt: number;
  /** Super-admin device label that approved/rejected.
   *  Null for 'auto' and 'timeout'. */
  decidedBy: string | null;
  /** Optional human-typed reason. */
  note?: string;
}

/**
 * The broker implements this. The SDK never calls it directly — action
 * wrappers in `server/vision-broker/fastify.ts` consult the gate before
 * dispatching an ActionRequest.
 */
export interface ApprovalGate {
  /** Returns 'auto' immediately for non-gated actions, else blocks
   *  until a human decides or the default timeout elapses. */
  evaluate(req: ActionRequest, ctx: ApprovalContext): Promise<ApprovalDecision>;
}

export interface ApprovalContext {
  sessionId: string;
  agentHandle: string;
  tenantId: string;
  ventureId: string;
  /** Snapshot captured immediately before this action — used by the
   *  HITL UI to render a "what the agent sees" preview. */
  preSnapshotId: string;
}

// ---------------------------------------------------------------------------
// Audit entries — broker SQLite row shape (stable across sessions)
// ---------------------------------------------------------------------------

export interface ActionAuditEntry {
  id: string;
  sessionId: string;
  agentHandle: string;
  tenantId: string;
  ventureId: string;
  action: ActionRequest;
  preSnapshotId: string;
  postSnapshotId: string | null;
  decision: ApprovalDecision | null;
  sideEffects: SideEffectSummary | null;
  startedAt: number;
  completedAt: number | null;
}
