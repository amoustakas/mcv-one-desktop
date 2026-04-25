/**
 * mcv-one-desktop / vision-broker — withSideEffectCapture middleware.
 *
 * Wraps an action dispatch so we can attribute network requests, form
 * submissions, and cross-origin navigations BACK to the action that
 * caused them. Without this, the `SideEffectSummary` field on every
 * `ActionAuditEntry` stays `null` (Session 2 state) and the audit
 * trail is just "agent did X" with no fallout context.
 *
 * Usage from a route handler:
 *
 *   const { result, sideEffects } = await withSideEffectCapture(cdp, async () => {
 *     return click(cdp, refId);   // or any other @mcv/vision action
 *   });
 *
 * Implementation notes:
 *
 * - We require the caller's CdpSession to be the *same* instance the
 *   action will dispatch through — events are session-scoped in CDP.
 *   The route handler in routes.ts pulls the session from
 *   server/browser-routes.ts and passes the same `session.cdp` to
 *   both the SDK action and this wrapper.
 *
 * - Network.enable / Page.enable are sent on entry. Both are no-ops
 *   if the domain is already on (the SDK's networkIdle wait has
 *   probably already enabled Network.*). Disabling on exit would
 *   create event-drop windows for concurrent actions, so we leave
 *   them on for the lifetime of the session.
 *
 * - Form-submit detection: CDP doesn't expose a first-class "this
 *   request was triggered by a <form>" event. We approximate via
 *   `request.hasPostData === true`, which captures POST/PATCH/PUT
 *   with bodies. False positives (XHR mutations not tied to a form
 *   element) are acceptable — the gate's PRIMARY defense against
 *   form submits is the `type-into-textbox-inside-form` heuristic
 *   that runs BEFORE the request, not the post-hoc tally.
 *
 * - Cross-origin nav detection compares `frame.url` origin against
 *   the snapshot URL passed in. Same-origin SPA route changes don't
 *   fire `Page.frameNavigated` (they go through history.pushState),
 *   so this catches only true browser navigations, which is what
 *   the gate's `navigate` heuristic actually cares about.
 *
 * - Subscriptions are torn down in a finally block so an exception
 *   during the action doesn't leak handlers across actions. With
 *   thousands of actions per agent run, leaked handlers would
 *   compound until the daemon OOMs.
 */

import type { CdpSession } from '@mcv/vision';
import type { SideEffectSummary } from '@mcv/vision/broker-contract';

// ---------------------------------------------------------------------------
// CDP event payload shapes — narrow surface, only the fields we read.
// ---------------------------------------------------------------------------

interface CdpRequestParams {
  requestId?: string;
  request?: {
    url?: string;
    method?: string;
    hasPostData?: boolean;
  };
}

interface CdpResponseParams {
  requestId?: string;
  response?: {
    url?: string;
    status?: number;
  };
}

interface CdpFrameNavigatedParams {
  frame?: {
    url?: string;
    parentId?: string;
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface WithSideEffectCaptureResult<T> {
  result: T;
  sideEffects: SideEffectSummary;
}

/**
 * Run `fn` while subscribed to CDP Network + Page events; return its
 * result alongside a `SideEffectSummary` accumulated for the duration.
 *
 * `preActionUrl` is the page URL captured immediately before `fn` runs
 * (typically `snapshot.url` from the gate's pre-snapshot). Used to
 * decide whether a `Page.frameNavigated` event is cross-origin.
 *
 * If event subscription itself throws (transport disconnect during a
 * navigation transition), the wrapper still runs `fn` and returns an
 * empty `SideEffectSummary` — better to lose the audit attribution
 * than to fail the action entirely.
 */
export async function withSideEffectCapture<T>(
  cdp: CdpSession,
  preActionUrl: string,
  fn: () => Promise<T>,
): Promise<WithSideEffectCaptureResult<T>> {
  const initialOrigin = originOf(preActionUrl);

  // Method/URL bookkeeping per requestId so responses can join back.
  const methodsByRequestId = new Map<string, string>();
  const urlsByRequestId = new Map<string, string>();

  const networkRequests: SideEffectSummary['networkRequests'] = [];
  const crossOriginNavigations: string[] = [];
  let formSubmits = 0;

  const offFns: Array<() => void> = [];

  try {
    // Best-effort enable — both are no-ops if already on.
    await cdp.send('Network.enable').catch(() => undefined);
    await cdp.send('Page.enable').catch(() => undefined);

    offFns.push(
      cdp.on('Network.requestWillBeSent', (raw) => {
        const params = raw as CdpRequestParams;
        const id = params.requestId;
        const method = params.request?.method ?? 'GET';
        const url = params.request?.url ?? '';
        if (id) {
          methodsByRequestId.set(id, method);
          urlsByRequestId.set(id, url);
        }
        if (params.request?.hasPostData === true) {
          formSubmits += 1;
        }
      }),
    );

    offFns.push(
      cdp.on('Network.responseReceived', (raw) => {
        const params = raw as CdpResponseParams;
        const id = params.requestId;
        const status = params.response?.status ?? 0;
        const url = (id && urlsByRequestId.get(id)) || params.response?.url || '';
        const method = (id && methodsByRequestId.get(id)) || 'GET';
        networkRequests.push({ method, url, status });
      }),
    );

    offFns.push(
      cdp.on('Page.frameNavigated', (raw) => {
        const params = raw as CdpFrameNavigatedParams;
        // Top-level frames only — subframe navigations are noise for
        // the gate's purposes.
        if (params.frame?.parentId) return;
        const navUrl = params.frame?.url;
        if (!navUrl) return;
        const navOrigin = originOf(navUrl);
        if (navOrigin && initialOrigin && navOrigin !== initialOrigin) {
          crossOriginNavigations.push(navUrl);
        }
      }),
    );
  } catch {
    // Subscription path failed — proceed with empty handlers. The
    // action still dispatches; the audit just won't have the events.
  }

  try {
    const result = await fn();
    return {
      result,
      sideEffects: {
        networkRequests,
        crossOriginNavigations,
        formSubmits,
      },
    };
  } finally {
    for (const off of offFns) {
      try {
        off();
      } catch {
        /* one bad unsubscribe must not block the others */
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Best-effort origin extraction. Returns null for non-URL strings
 *  (data:, blob:, about:blank, …) so cross-origin comparisons skip
 *  them — those targets aren't gated by the cross-origin rule. */
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
