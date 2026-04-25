/**
 * @mcv/vision — action primitives.
 *
 * Five verbs: click / type / scroll / wait / navigate.
 *
 * Each action:
 *   1. Captures a pre-snapshot to resolve the target Ref.
 *   2. Dispatches CDP input events at the Ref's bounds center
 *      (or, for scroll/wait/navigate, at the page level).
 *   3. Captures a fresh post-action snapshot and returns it inside
 *      `ActionResult.snapshot` so callers can chain decisions
 *      without a separate getSnapshot() call.
 *
 * Side-effect tracking (network requests, form submits, cross-origin
 * navigations) is the broker's job — see types.SideEffectSummary —
 * and not populated here. The raw SDK is observe-and-act only.
 */

import { getSnapshot, type CdpSession } from './snapshot';
import type { ActionResult, Ref, WaitCondition } from './types';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function click(cdp: CdpSession, refId: string): Promise<ActionResult> {
  const pre = await getSnapshot(cdp);
  const ref = pre.refs.find((r) => r.id === refId);
  if (!ref) {
    return { ok: false, snapshot: pre, error: `ref ${refId} not found in current snapshot` };
  }
  if (ref.disabled) {
    return { ok: false, snapshot: pre, error: `ref ${refId} is disabled` };
  }
  if (ref.bounds.width === 0 || ref.bounds.height === 0) {
    return { ok: false, snapshot: pre, error: `ref ${refId} has zero-size bounds` };
  }

  const { cx, cy } = boundsCenter(ref);
  await dispatchClick(cdp, cx, cy);
  await sleep(50); // let synchronous handlers flush before re-snapshot
  const post = await getSnapshot(cdp);
  return { ok: true, snapshot: post };
}

export async function type(
  cdp: CdpSession,
  refId: string,
  text: string,
  opts: { clear?: boolean } = {},
): Promise<ActionResult> {
  const pre = await getSnapshot(cdp);
  const ref = pre.refs.find((r) => r.id === refId);
  if (!ref) {
    return { ok: false, snapshot: pre, error: `ref ${refId} not found in current snapshot` };
  }
  if (ref.disabled) {
    return { ok: false, snapshot: pre, error: `ref ${refId} is disabled` };
  }

  // Click to focus first; Input.insertText only acts on the focused element.
  const { cx, cy } = boundsCenter(ref);
  await dispatchClick(cdp, cx, cy);
  await sleep(20);

  if (opts.clear) {
    await selectAllAndDelete(cdp);
  }

  await cdp.send('Input.insertText', { text });
  await sleep(50);
  const post = await getSnapshot(cdp);
  return { ok: true, snapshot: post };
}

export async function scroll(cdp: CdpSession, dx: number, dy: number): Promise<ActionResult> {
  const center = await viewportCenter(cdp);
  await cdp.send('Input.dispatchMouseEvent', {
    type: 'mouseWheel',
    x: center.x,
    y: center.y,
    deltaX: dx,
    deltaY: dy,
  });
  await sleep(50);
  const post = await getSnapshot(cdp);
  return { ok: true, snapshot: post };
}

export async function wait(cdp: CdpSession, condition: WaitCondition): Promise<ActionResult> {
  const timeoutMs = condition.timeoutMs ?? 10_000;
  try {
    switch (condition.kind) {
      case 'selector':
        await pollExpression(
          cdp,
          `!!document.querySelector(${JSON.stringify(condition.selector)})`,
          timeoutMs,
        );
        break;
      case 'text':
        await pollExpression(
          cdp,
          `!!(document.body && document.body.innerText.indexOf(${JSON.stringify(
            condition.text,
          )}) >= 0)`,
          timeoutMs,
        );
        break;
      case 'networkIdle':
        await pollExpression(cdp, 'document.readyState === "complete"', timeoutMs);
        break;
    }
    const post = await getSnapshot(cdp);
    return { ok: true, snapshot: post };
  } catch (err) {
    const post = await getSnapshot(cdp);
    return {
      ok: false,
      snapshot: post,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function navigate(cdp: CdpSession, url: string): Promise<ActionResult> {
  try {
    await cdp.send('Page.navigate', { url });
    // Poll for completion rather than relying on Page.loadEventFired —
    // event registration via the structural CdpSession is intentionally
    // omitted (Session 1 zero-dep contract).
    await pollExpression(cdp, 'document.readyState === "complete"', 15_000);
    const post = await getSnapshot(cdp);
    return { ok: true, snapshot: post };
  } catch (err) {
    const post = await getSnapshot(cdp);
    return {
      ok: false,
      snapshot: post,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ---------------------------------------------------------------------------
// CDP helpers — kept private to this module so callers can't bypass the
// snapshot-on-completion contract.
// ---------------------------------------------------------------------------

function boundsCenter(ref: Ref): { cx: number; cy: number } {
  return {
    cx: ref.bounds.x + ref.bounds.width / 2,
    cy: ref.bounds.y + ref.bounds.height / 2,
  };
}

async function dispatchClick(cdp: CdpSession, x: number, y: number): Promise<void> {
  await cdp.send('Input.dispatchMouseEvent', {
    type: 'mouseMoved',
    x,
    y,
    button: 'none',
    buttons: 0,
  });
  await cdp.send('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    x,
    y,
    button: 'left',
    clickCount: 1,
    buttons: 1,
  });
  await cdp.send('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x,
    y,
    button: 'left',
    clickCount: 1,
    buttons: 0,
  });
}

async function selectAllAndDelete(cdp: CdpSession): Promise<void> {
  // Modifier 2 = Ctrl on Win/Linux, 4 = Meta on macOS. Most agent runs are
  // Linux/Windows headless, so Ctrl-A is the right pick.
  const ctrl = 2;
  await cdp.send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'a',
    code: 'KeyA',
    modifiers: ctrl,
    windowsVirtualKeyCode: 65,
  });
  await cdp.send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: 'a',
    code: 'KeyA',
    modifiers: ctrl,
    windowsVirtualKeyCode: 65,
  });
  await cdp.send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'Delete',
    code: 'Delete',
    windowsVirtualKeyCode: 46,
  });
  await cdp.send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: 'Delete',
    code: 'Delete',
    windowsVirtualKeyCode: 46,
  });
}

async function viewportCenter(cdp: CdpSession): Promise<{ x: number; y: number }> {
  try {
    const m = (await cdp.send('Page.getLayoutMetrics')) as {
      cssVisualViewport?: { clientWidth?: number; clientHeight?: number };
      cssLayoutViewport?: { clientWidth?: number; clientHeight?: number };
    };
    const w =
      m.cssVisualViewport?.clientWidth ?? m.cssLayoutViewport?.clientWidth ?? 1280;
    const h =
      m.cssVisualViewport?.clientHeight ?? m.cssLayoutViewport?.clientHeight ?? 800;
    return { x: w / 2, y: h / 2 };
  } catch {
    return { x: 640, y: 400 };
  }
}

async function pollExpression(
  cdp: CdpSession,
  expression: string,
  timeoutMs: number,
  intervalMs = 100,
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = (await cdp.send('Runtime.evaluate', {
        expression,
        returnByValue: true,
      })) as { result?: { value?: unknown } };
      if (r.result?.value === true) return;
    } catch {
      // Swallow eval errors during navigation transitions — keep polling.
    }
    await sleep(intervalMs);
  }
  throw new Error(`wait condition timed out after ${timeoutMs}ms (expr: ${expression})`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
