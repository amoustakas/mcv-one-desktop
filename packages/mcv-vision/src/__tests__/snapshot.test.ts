// snapshot.test.ts — drives a real Chromium against a static HTML
// fixture and asserts:
//   1. button + textbox + link refs are emitted
//   2. bounds are non-zero (real layout was performed)
//   3. ref ids are stable across two snapshots of the same page
//      (the load-bearing invariant agents rely on for replay)
//
// Uses Playwright at the workspace root (hoisted by pnpm). The
// SDK itself takes a structural CdpSession, so we cast Playwright's
// CDPSession across the boundary without adding a runtime dep.

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';

import { getSnapshot, type CdpSession } from '../snapshot';

const FIXTURE_HTML = `
<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>VIL Snapshot Fixture</title></head>
<body>
  <main>
    <form>
      <label for="q">Query</label>
      <input id="q" name="q" type="text" />
      <button type="submit" id="go">Submit</button>
    </form>
    <nav>
      <a href="https://example.com" id="ext">Example</a>
    </nav>
  </main>
</body>
</html>
`;

let browser: Browser;
let ctx: BrowserContext;
let page: Page;
let cdp: CdpSession;

beforeAll(async () => {
  browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  ctx = await browser.newContext({ viewport: { width: 800, height: 600 } });
  page = await ctx.newPage();
  cdp = (await ctx.newCDPSession(page)) as unknown as CdpSession;
  await page.setContent(FIXTURE_HTML, { waitUntil: 'load' });
}, 30_000);

afterAll(async () => {
  await ctx?.close().catch(() => {});
  await browser?.close().catch(() => {});
});

describe('@mcv/vision · getSnapshot()', () => {
  it('returns url, title, refs, summary, and a non-empty PNG', async () => {
    const snap = await getSnapshot(cdp);

    // setContent leaves the URL as 'about:blank' — that's fine, just
    // assert the field exists.
    expect(typeof snap.url).toBe('string');
    expect(snap.title).toBe('VIL Snapshot Fixture');
    expect(snap.takenAt).toBeGreaterThan(0);

    // PNG bytes — placeholder fallback is 70 bytes, real screenshot is much larger.
    expect(snap.screenshotPng.byteLength).toBeGreaterThan(200);

    expect(snap.refs.length).toBeGreaterThanOrEqual(3);
    expect(snap.summary).toContain('VIL Snapshot Fixture');
  }, 20_000);

  it('emits refs for the button, textbox, and link in the fixture', async () => {
    const snap = await getSnapshot(cdp);
    const roles = snap.refs.map((r) => r.role);
    expect(roles).toContain('button');
    expect(roles).toContain('textbox');
    expect(roles).toContain('link');
  }, 20_000);

  it('produces non-zero bounds for visible refs', async () => {
    const snap = await getSnapshot(cdp);
    const button = snap.refs.find((r) => r.role === 'button' && r.name === 'Submit');
    expect(button).toBeDefined();
    expect(button!.bounds.width).toBeGreaterThan(0);
    expect(button!.bounds.height).toBeGreaterThan(0);
    expect(button!.offscreen).toBe(false);
  }, 20_000);

  it('mints stable ref-ids across two snapshots of the same page', async () => {
    const a = await getSnapshot(cdp);
    const b = await getSnapshot(cdp);
    const aIds = a.refs.map((r) => r.id).sort();
    const bIds = b.refs.map((r) => r.id).sort();
    expect(bIds).toEqual(aIds);
    // Sanity floor: at least 2 stable refs (the kickoff smoke-floor).
    expect(aIds.length).toBeGreaterThanOrEqual(2);
  }, 30_000);

  it('honors maxRefs', async () => {
    const snap = await getSnapshot(cdp, { maxRefs: 2 });
    expect(snap.refs.length).toBeLessThanOrEqual(2);
  }, 20_000);
});
