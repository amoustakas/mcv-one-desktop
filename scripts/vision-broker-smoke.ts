/**
 * VIL Session 2 — manual smoke for /vision/snapshot.
 *
 * Boots the daemon side of the flow in-process (no external server
 * needed), opens a browser session, navigates to a small static
 * fixture page, calls the vision-broker route through the Express
 * app via supertest-style direct dispatch, decodes the returned
 * PNG, writes it to tmp-annotated-smoke.png, and prints the
 * resulting SQLite audit row.
 *
 * Run: pnpm tsx scripts/vision-broker-smoke.ts
 *
 * Outputs (relative to repo root):
 *   - tmp-annotated-smoke.png  (the annotated screenshot)
 *   - .mcv/vision-broker.db    (SQLite audit log; gitignored)
 */

import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { chromium, type CDPSession } from 'playwright';

import { getSnapshot, type CdpSession } from '@mcv/vision';
import { annotateCanvasAdapter } from '../server/vision-broker/annotate-canvas';
import { openBrokerStore } from '../server/vision-broker/sqlite-store';

const FIXTURE_HTML = `
<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>VIL Smoke Page</title>
<style>body{font-family:system-ui;padding:20px;background:#f5f7fa}
form{display:flex;gap:8px;align-items:center}
input,button{padding:8px 12px;font-size:14px;border:1px solid #ccc;border-radius:4px}
nav{margin-top:24px;display:flex;gap:16px}</style>
</head>
<body>
  <h1>VIL annotated overlay smoke</h1>
  <form>
    <label for="q">Query</label>
    <input id="q" name="q" type="text" placeholder="Search…" />
    <button type="submit" id="go">Submit</button>
  </form>
  <nav>
    <a href="https://example.com">Example</a>
    <a href="https://mcv.one">MCV</a>
  </nav>
</body>
</html>
`;

async function main(): Promise<void> {
  const tmp = mkdtempSync(path.join(tmpdir(), 'mcv-vision-smoke-'));
  const dbPath = path.join(tmp, 'broker-smoke.db');
  const store = openBrokerStore(dbPath);

  console.log(`[smoke] using temp DB: ${dbPath}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 600 } });
  const page = await ctx.newPage();
  const cdp: CDPSession = await ctx.newCDPSession(page);
  await page.setContent(FIXTURE_HTML, { waitUntil: 'load' });

  console.log('[smoke] capturing snapshot via @mcv/vision/getSnapshot…');
  const startedAt = Date.now();
  const snapshot = await getSnapshot(cdp as unknown as CdpSession, {
    highlightActionable: true,
  });

  console.log(`[smoke] refs minted: ${snapshot.refs.length}`);
  console.log(`[smoke] summary: ${snapshot.summary}`);

  console.log('[smoke] running annotateCanvasAdapter…');
  const annotated = await annotateCanvasAdapter.drawNumberedBoxes({
    pngBytes: snapshot.screenshotPng,
    refs: snapshot.refs,
  });

  const outPath = path.join(process.cwd(), 'tmp-annotated-smoke.png');
  writeFileSync(outPath, annotated);
  console.log(
    `[smoke] wrote ${annotated.byteLength} bytes -> ${outPath} ` +
      `(input was ${snapshot.screenshotPng.byteLength})`,
  );

  const completedAt = Date.now();
  store.appendAuditEntry({
    id: 'smoke_' + Date.now().toString(36),
    sessionId: 'smoke-session',
    agentHandle: 'snapshot-probe',
    tenantId: 'tenant_smoke',
    ventureId: 'venture_smoke',
    action: { kind: 'wait', condition: { kind: 'networkIdle' } },
    preSnapshotId: '',
    postSnapshotId: null,
    decision: {
      verdict: 'auto',
      decidedAt: completedAt,
      decidedBy: null,
      note: 'snapshot-only-no-mutation',
    },
    sideEffects: null,
    startedAt,
    completedAt,
  });

  const rows = store.listRecentEntries(5);
  console.log(`[smoke] audit rows after write: ${rows.length}`);
  for (const row of rows) {
    console.log(
      `  - ${row.id} agent=${row.agentHandle} action=${JSON.stringify(row.action)} ` +
        `decision=${row.decision?.verdict}/${row.decision?.note ?? ''}`,
    );
  }

  store.close();
  await ctx.close();
  await browser.close();
  rmSync(tmp, { recursive: true, force: true });

  console.log('[smoke] done. Open tmp-annotated-smoke.png to eyeball the overlay.');
}

main().catch((err) => {
  console.error('[smoke] FAILED:', err);
  process.exit(1);
});
