/**
 * @mcv/vision — getSnapshot()
 *
 * Walks the live page's accessibility tree via CDP, filters down to
 * action-relevant ARIA roles, computes per-element bounds via
 * DOM.getBoxModel, and mints a stable Ref.id for each via
 * `./ref-id`. Returns a self-contained `SnapshotResult` (URL, title,
 * PNG bytes, refs[], terse summary).
 *
 * Pure function: takes a `CdpSession` in, returns JSON+Uint8Array
 * out. No I/O, no Fastify, no DB. Annotated PNG overlay, broker
 * persistence, and approval gating live elsewhere.
 *
 * Zero npm deps by design. We talk to Playwright's CDPSession via
 * a structural interface (see CdpSession below), so the SDK stays
 * decoupled from the transport.
 */

import { makeRefId } from './ref-id';
import type {
  AxRole,
  Ref,
  SnapshotOptions,
  SnapshotResult,
} from './types';

// ---------------------------------------------------------------------------
// Structural CDP transport — compatible with Playwright's CDPSession at the
// call sites we use (`send(method, params)`). Exported so consumers and
// tests can pass any CDP-shaped client.
// ---------------------------------------------------------------------------

export interface CdpSession {
  send: (method: string, params?: Record<string, unknown>) => Promise<unknown>;
}

// ---------------------------------------------------------------------------
// Action-relevant role filter — AX may emit dozens of non-interactive roles
// (group, region, …); we mint refs only for elements an agent can act on.
// ---------------------------------------------------------------------------

const ACTIONABLE_ROLES: ReadonlySet<AxRole> = new Set<AxRole>([
  'button',
  'link',
  'textbox',
  'searchbox',
  'combobox',
  'checkbox',
  'radio',
  'switch',
  'slider',
  'menuitem',
  'option',
  'tab',
  'listbox',
]);

function isActionableRole(role: string | undefined): role is AxRole {
  return role !== undefined && ACTIONABLE_ROLES.has(role as AxRole);
}

// ---------------------------------------------------------------------------
// Minimal CDP response shapes — we only model the fields we actually read.
// ---------------------------------------------------------------------------

interface AxValueLike {
  type?: string;
  value?: unknown;
}

interface AxProperty {
  name?: string;
  value?: AxValueLike;
}

interface AxNode {
  nodeId?: string;
  parentId?: string;
  backendDOMNodeId?: number;
  role?: AxValueLike;
  name?: AxValueLike;
  properties?: AxProperty[];
  ignored?: boolean;
}

interface BoxModel {
  model?: {
    /** [x1,y1, x2,y2, x3,y3, x4,y4] — top-left, top-right, bottom-right, bottom-left. */
    content?: number[];
    width?: number;
    height?: number;
  };
}

interface LayoutMetrics {
  cssLayoutViewport?: { clientWidth?: number; clientHeight?: number };
  cssVisualViewport?: { clientWidth?: number; clientHeight?: number };
  layoutViewport?: { clientWidth?: number; clientHeight?: number };
}

interface TargetInfoResp {
  targetInfo?: { url?: string; title?: string };
}

interface ScreenshotResp {
  data?: string;
}

// ---------------------------------------------------------------------------
// Public API — getSnapshot()
// ---------------------------------------------------------------------------

const EMPTY_PNG_BASE64 =
  // 1x1 transparent PNG; used only when CDP screenshot fails (e.g. detached).
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';

export async function getSnapshot(
  cdp: CdpSession,
  opts: SnapshotOptions = {},
): Promise<SnapshotResult> {
  const includeSummary = opts.includeSummary !== false;
  const fullPage = opts.fullPage ?? false;
  const maxRefs = opts.maxRefs ?? Number.POSITIVE_INFINITY;

  const [target, axResp, viewport] = await Promise.all([
    cdp.send('Target.getTargetInfo').catch(() => ({})) as Promise<TargetInfoResp>,
    cdp.send('Accessibility.getFullAXTree') as Promise<{ nodes?: AxNode[] }>,
    cdp.send('Page.getLayoutMetrics').catch(() => ({})) as Promise<LayoutMetrics>,
  ]);

  const url = target.targetInfo?.url ?? '';
  const title = target.targetInfo?.title ?? '';

  const viewportW =
    viewport.cssVisualViewport?.clientWidth ??
    viewport.cssLayoutViewport?.clientWidth ??
    viewport.layoutViewport?.clientWidth ??
    0;
  const viewportH =
    viewport.cssVisualViewport?.clientHeight ??
    viewport.cssLayoutViewport?.clientHeight ??
    viewport.layoutViewport?.clientHeight ??
    0;

  const nodes = axResp.nodes ?? [];
  const byId = new Map<string, AxNode>();
  for (const n of nodes) {
    if (n.nodeId) byId.set(n.nodeId, n);
  }

  const refs: Ref[] = [];
  // ordinal key = `${parentId ?? 'root'}|${role}` — counts siblings-of-same-role
  const ordinalCounter = new Map<string, number>();

  for (const node of nodes) {
    if (refs.length >= maxRefs) break;
    if (node.ignored) continue;

    const role = (node.role?.value as string | undefined) ?? '';
    if (!isActionableRole(role)) continue;

    const name = (node.name?.value as string | undefined) ?? '';
    const ancestorRoles = collectAncestorRoles(node, byId, 8);

    const ordinalKey = `${node.parentId ?? 'root'}|${role}`;
    const originOrdinal = ordinalCounter.get(ordinalKey) ?? 0;
    ordinalCounter.set(ordinalKey, originOrdinal + 1);

    const { bounds, offscreenFromBox } = await readBounds(
      cdp,
      node.backendDOMNodeId,
      viewportW,
      viewportH,
    );

    const disabled = readDisabled(node);

    const id = makeRefId({ role, name, ancestorRoles, originOrdinal });

    refs.push({
      id,
      role,
      name,
      bounds,
      originOrdinal,
      ancestorRoles,
      offscreen: offscreenFromBox,
      disabled,
    });
  }

  const screenshotPng = await captureScreenshot(cdp, fullPage);
  const summary = includeSummary ? buildSummary(title, refs) : '';

  return {
    url,
    title,
    takenAt: Date.now(),
    screenshotPng,
    refs,
    summary,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function collectAncestorRoles(
  node: AxNode,
  byId: Map<string, AxNode>,
  max: number,
): string[] {
  const out: string[] = [];
  let cur: AxNode | undefined = node.parentId ? byId.get(node.parentId) : undefined;
  while (cur && out.length < max) {
    const r = cur.role?.value as string | undefined;
    if (r) out.push(r);
    cur = cur.parentId ? byId.get(cur.parentId) : undefined;
  }
  return out;
}

function readDisabled(node: AxNode): boolean {
  for (const p of node.properties ?? []) {
    if (p.name === 'disabled' && p.value?.value === true) return true;
  }
  return false;
}

async function readBounds(
  cdp: CdpSession,
  backendNodeId: number | undefined,
  viewportW: number,
  viewportH: number,
): Promise<{ bounds: Ref['bounds']; offscreenFromBox: boolean }> {
  const empty = { x: 0, y: 0, width: 0, height: 0 };
  if (backendNodeId === undefined) {
    return { bounds: empty, offscreenFromBox: true };
  }

  let box: BoxModel | undefined;
  try {
    box = (await cdp.send('DOM.getBoxModel', { backendNodeId })) as BoxModel;
  } catch {
    // Element detached / display:none / iframe — leave at defaults.
    return { bounds: empty, offscreenFromBox: true };
  }

  const content = box?.model?.content;
  if (!content || content.length < 8) {
    return { bounds: empty, offscreenFromBox: true };
  }
  const xs = [content[0], content[2], content[4], content[6]];
  const ys = [content[1], content[3], content[5], content[7]];
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  const width = box?.model?.width ?? 0;
  const height = box?.model?.height ?? 0;

  // offscreen if zero-sized OR fully outside viewport in either axis.
  const zeroSize = width === 0 || height === 0;
  const outsideViewport =
    viewportW > 0 &&
    viewportH > 0 &&
    (x + width <= 0 || y + height <= 0 || x >= viewportW || y >= viewportH);

  return {
    bounds: { x, y, width, height },
    offscreenFromBox: zeroSize || outsideViewport,
  };
}

async function captureScreenshot(cdp: CdpSession, fullPage: boolean): Promise<Uint8Array> {
  try {
    const resp = (await cdp.send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: fullPage,
    })) as ScreenshotResp;
    if (resp.data) {
      return Uint8Array.from(Buffer.from(resp.data, 'base64'));
    }
  } catch {
    /* fall through to placeholder */
  }
  return Uint8Array.from(Buffer.from(EMPTY_PNG_BASE64, 'base64'));
}

function buildSummary(title: string, refs: Ref[]): string {
  if (refs.length === 0) {
    return `${title || 'Untitled'}, no actionable elements.`;
  }
  const counts = new Map<string, number>();
  for (const r of refs) counts.set(r.role, (counts.get(r.role) ?? 0) + 1);
  const parts: string[] = [];
  for (const [role, n] of counts) {
    parts.push(`${n} ${role}${n === 1 ? '' : 's'}`);
  }
  return `${title || 'Untitled'}, ${parts.join(', ')}.`;
}
