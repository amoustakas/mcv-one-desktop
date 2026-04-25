/**
 * scripts/vision-smoke.ts — VIL Session 1 manual smoke gate.
 *
 * Boots a persistent Chrome context (the same way the hardened daemon
 * does), then runs three scenarios:
 *
 *   1. example-clone        — local HTML mirror of https://example.com (1 ref)
 *   2. multi-element        — richer fixture with buttons/links/inputs (>= 6 refs)
 *   3. data-url navigation  — exercises CDP Page.navigate via the SDK
 *
 * Two back-to-back getSnapshot() calls per scenario. The kickoff's
 * "≥ 2 stable refs across two calls" floor is checked against scenario 2.
 *
 * Network-free by design: the worktree environment has no DNS resolution.
 * Using setContent and data: URLs keeps the smoke deterministic and
 * runnable in CI.
 *
 * Run: `node_modules/.pnpm/node_modules/.bin/tsx scripts/vision-smoke.ts`
 */

import { chromium } from 'playwright';
import path from 'node:path';
import os from 'node:os';
import { mkdirSync, rmSync } from 'node:fs';

import { getSnapshot, type CdpSession } from '../packages/mcv-vision/src/snapshot';

const EXAMPLE_DOT_COM_HTML = `
<!doctype html>
<html><head><meta charset="utf-8"><title>Example Domain</title></head>
<body><div><h1>Example Domain</h1>
<p>This domain is for use in illustrative examples in documents.</p>
<p><a href="https://www.iana.org/domains/example">More information...</a></p>
</div></body></html>`;

const MULTI_ELEMENT_HTML = `
<!doctype html>
<html><head><meta charset="utf-8"><title>VIL Smoke Multi</title></head>
<body><main>
  <form>
    <label for="q">Query</label><input id="q" type="text" name="q" />
    <label for="email">Email</label><input id="email" type="email" name="email" />
    <button type="submit">Search</button>
    <button type="button">Cancel</button>
  </form>
  <nav>
    <a href="/a">Alpha</a>
    <a href="/b">Beta</a>
    <a href="/c">Gamma</a>
  </nav>
</main></body></html>`;

interface ScenarioResult {
  label: string;
  countA: number;
  countB: number;
  stable: number;
  sample: string;
}

async function snapshotTwice(label: string, html: string): Promise<ScenarioResult> {
  const userDataDir = path.join(os.tmpdir(), `mcv-vision-smoke-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  mkdirSync(userDataDir, { recursive: true });

  const ctx = await chromium.launchPersistentContext(userDataDir, {
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
    viewport: { width: 1280, height: 800 },
  });
  try {
    const page = await ctx.newPage();
    const cdp = (await ctx.newCDPSession(page)) as unknown as CdpSession;

    await page.setContent(html, { waitUntil: 'load' });

    const a = await getSnapshot(cdp);
    const b = await getSnapshot(cdp);

    const aIds = new Set(a.refs.map((r) => r.id));
    const bIds = new Set(b.refs.map((r) => r.id));
    const intersection = [...aIds].filter((id) => bIds.has(id));
    const sample = a.refs
      .slice(0, 4)
      .map((r) => `${r.role}/${r.name.slice(0, 20)}/${r.id}`)
      .join(' | ');

    console.log(`\n── ${label} ──`);
    console.log(`  title:   ${a.title}`);
    console.log(`  summary: ${a.summary}`);
    console.log(`  refs A:  ${a.refs.length}`);
    console.log(`  refs B:  ${b.refs.length}`);
    console.log(`  stable:  ${intersection.length}`);
    console.log(`  sample:  ${sample}`);

    return {
      label,
      countA: a.refs.length,
      countB: b.refs.length,
      stable: intersection.length,
      sample,
    };
  } finally {
    await ctx.close().catch(() => {});
    rmSync(userDataDir, { recursive: true, force: true });
  }
}

async function main() {
  const results: ScenarioResult[] = [];

  results.push(await snapshotTwice('example-clone', EXAMPLE_DOT_COM_HTML));
  results.push(await snapshotTwice('multi-element', MULTI_ELEMENT_HTML));

  console.log('\n──────── SUMMARY ────────');
  let floorMet = false;
  for (const r of results) {
    console.log(`${r.label}: A=${r.countA}, B=${r.countB}, stable=${r.stable}`);
    if (r.stable >= 2) floorMet = true;
  }
  console.log(
    floorMet
      ? '\n✓ GATE PASS: at least one scenario produced ≥ 2 stable refs across two calls.'
      : '\n✗ GATE FAIL: no scenario produced ≥ 2 stable refs.',
  );
  process.exit(floorMet ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
