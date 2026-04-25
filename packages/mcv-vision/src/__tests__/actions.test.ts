// actions.test.ts — confirms each action verb actually drives the
// browser. We attach observable handlers to the fixture (data-clicked,
// input.value, navigation count) and assert the SDK's CDP-event
// dispatch reaches them end-to-end.

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';

import { click, navigate, scroll, type as typeText, wait } from '../actions';
import { getSnapshot, type CdpSession } from '../snapshot';

const FIXTURE_HTML = `
<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>VIL Actions Fixture</title>
<style>
  body { margin: 0; padding: 24px; font-family: sans-serif; }
  /* Force a tall page so scroll has somewhere to go. */
  .spacer { height: 2000px; }
  button { padding: 8px 16px; }
  input { padding: 8px; width: 200px; }
</style>
</head>
<body>
  <main>
    <button id="b" type="button" onclick="window.__clicked=(window.__clicked||0)+1">Tap me</button>
    <input id="t" type="text" />
    <div class="spacer"></div>
    <div id="end">end-marker</div>
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
}, 30_000);

afterAll(async () => {
  await browser?.close().catch(() => {});
});

beforeEach(async () => {
  // Fresh context per test so click counters and input values reset.
  ctx = await browser.newContext({ viewport: { width: 800, height: 600 } });
  page = await ctx.newPage();
  cdp = (await ctx.newCDPSession(page)) as unknown as CdpSession;
  await page.setContent(FIXTURE_HTML, { waitUntil: 'load' });
});

afterEach(async () => {
  await ctx?.close().catch(() => {});
});

describe('@mcv/vision · click()', () => {
  it('triggers the button onclick handler', async () => {
    const snap = await getSnapshot(cdp);
    const button = snap.refs.find((r) => r.role === 'button' && r.name === 'Tap me');
    expect(button, 'fixture must expose a button ref').toBeDefined();

    const result = await click(cdp, button!.id);
    expect(result.ok).toBe(true);

    const observed = await page.evaluate(() => (window as unknown as { __clicked?: number }).__clicked ?? 0);
    expect(observed).toBe(1);
  }, 20_000);

  it('errors when refId is unknown without crashing', async () => {
    const result = await click(cdp, 'nonexistent-ref');
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/not found/i);
    expect(result.snapshot).toBeDefined();
  }, 20_000);
});

describe('@mcv/vision · type()', () => {
  it('inserts text into the focused textbox', async () => {
    const snap = await getSnapshot(cdp);
    const textbox = snap.refs.find((r) => r.role === 'textbox');
    expect(textbox, 'fixture must expose a textbox ref').toBeDefined();

    const result = await typeText(cdp, textbox!.id, 'hi');
    expect(result.ok).toBe(true);

    const value = await page.evaluate(() => (document.getElementById('t') as HTMLInputElement).value);
    expect(value).toBe('hi');
  }, 20_000);
});

describe('@mcv/vision · scroll()', () => {
  it('shifts window.scrollY', async () => {
    const before = await page.evaluate(() => window.scrollY);
    const result = await scroll(cdp, 0, 400);
    expect(result.ok).toBe(true);
    // Scroll dispatch is async — wait briefly for layout to settle.
    await new Promise((r) => setTimeout(r, 100));
    const after = await page.evaluate(() => window.scrollY);
    expect(after).toBeGreaterThan(before);
  }, 20_000);
});

describe('@mcv/vision · wait()', () => {
  it('resolves on selector present', async () => {
    const result = await wait(cdp, { kind: 'selector', selector: '#end', timeoutMs: 2000 });
    expect(result.ok).toBe(true);
  }, 10_000);

  it('returns an error result when selector never appears', async () => {
    const result = await wait(cdp, {
      kind: 'selector',
      selector: '#never-exists',
      timeoutMs: 800,
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/timed out/i);
  }, 10_000);
});

describe('@mcv/vision · navigate()', () => {
  it('changes document.location and re-snapshots', async () => {
    // Use a data: URL so we don't hit the network during tests.
    const dataUrl =
      'data:text/html,' +
      encodeURIComponent(
        '<!doctype html><html><head><title>nav-target</title></head>' +
        '<body><a id="x" href="#">link-on-target</a></body></html>',
      );
    const result = await navigate(cdp, dataUrl);
    expect(result.ok).toBe(true);
    expect(result.snapshot.title).toBe('nav-target');
  }, 15_000);
});
