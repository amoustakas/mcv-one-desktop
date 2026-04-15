#!/usr/bin/env tsx
/* eslint-disable no-console */
// scripts/triangle-smoke.ts
//
// Smoke test for the MCV Core Triangle integration. Pings all three services,
// sends a test chat completion through Intelligence, publishes a test audit
// event to Fabric, then queries it back. Exits 0 on full success, 1 on any
// failure with clear per-step diagnostics.
//
// Usage:
//   IDENTITY_URL=http://localhost:7001 \
//   FABRIC_URL=http://localhost:7002 \
//   INTELLIGENCE_URL=http://localhost:7003 \
//   INTERNAL_SERVICE_SECRET=devsecret \
//   npx tsx scripts/triangle-smoke.ts
//
// Or wire it into package.json:  "smoke:triangle": "tsx scripts/triangle-smoke.ts"
//
// Designed to run locally, in CI, or pre-deploy. Safe to run against
// production — only ever reads health + publishes one test event with a
// distinguishable ventureId ('__triangle-smoke__'), easy to filter out.

import { createIdentityClient } from '@mcv/core-triangle/identity';
import { createFabricClient } from '@mcv/core-triangle/fabric';
import { createIntelligenceClient } from '@mcv/core-triangle/intelligence';

const C = {
  reset: '\x1b[0m', dim: '\x1b[2m', red: '\x1b[31m',
  green: '\x1b[32m', yellow: '\x1b[33m', cyan: '\x1b[36m',
};

let failures = 0;
function ok(label: string, detail = ''): void {
  console.log(`${C.green}✓${C.reset} ${label}${detail ? `  ${C.dim}${detail}${C.reset}` : ''}`);
}
function fail(label: string, err: unknown): void {
  failures++;
  const msg = err instanceof Error ? err.message : JSON.stringify(err);
  console.log(`${C.red}✗${C.reset} ${label}  ${C.red}${msg}${C.reset}`);
}
function warn(label: string, detail = ''): void {
  console.log(`${C.yellow}!${C.reset} ${label}${detail ? `  ${C.dim}${detail}${C.reset}` : ''}`);
}
function heading(s: string): void {
  console.log(`\n${C.cyan}${s}${C.reset}`);
}

async function main(): Promise<void> {
  heading('MCV Core Triangle smoke test');

  const { IDENTITY_URL, FABRIC_URL, INTELLIGENCE_URL, INTERNAL_SERVICE_SECRET } = process.env;

  const missing = [
    !IDENTITY_URL && 'IDENTITY_URL',
    !FABRIC_URL && 'FABRIC_URL',
    !INTELLIGENCE_URL && 'INTELLIGENCE_URL',
    !INTERNAL_SERVICE_SECRET && 'INTERNAL_SERVICE_SECRET',
  ].filter(Boolean);
  if (missing.length) {
    console.log(`${C.red}Missing env vars: ${missing.join(', ')}${C.reset}`);
    console.log('See .env.example for the full list.');
    process.exit(1);
  }

  const auth = async () => INTERNAL_SERVICE_SECRET!;
  const identity = createIdentityClient({ baseUrl: IDENTITY_URL!, getAuthToken: auth });
  const fabric = createFabricClient({ baseUrl: FABRIC_URL!, getAuthToken: auth, ventureId: '__triangle-smoke__' });
  const intelligence = createIntelligenceClient({ baseUrl: INTELLIGENCE_URL!, getAuthToken: auth });

  // ── 1. Health pings ────────────────────────────────────────────────
  heading('1. Health pings');
  const pings = await Promise.all([identity.ping(), fabric.ping(), intelligence.ping()]);
  pings[0].ok ? ok('Identity /health', pings[0].data.version ? `v${pings[0].data.version}` : '') : fail('Identity /health', pings[0].error);
  pings[1].ok ? ok('Fabric   /health', pings[1].data.version ? `v${pings[1].data.version}` : '') : fail('Fabric   /health', pings[1].error);
  pings[2].ok ? ok('Intelligence /health', pings[2].data.version ? `v${pings[2].data.version}` : '') : fail('Intelligence /health', pings[2].error);

  // ── 2. Identity round-trip (optional — requires real JWT) ──────────
  heading('2. Identity session');
  const session = await identity.session();
  if (session.ok) {
    ok('Identity /users/me', `userId=${session.data.userId}, ventures=${session.data.tenants.length}`);
  } else {
    warn('Identity /users/me failed — expected when running with INTERNAL_SERVICE_SECRET only (no real JWT)', session.error.message);
  }

  // ── 3. Fabric publish → query round-trip ────────────────────────────
  heading('3. Fabric event round-trip');
  const correlationId = `smoke_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const pub = await fabric.publish({
    topic: 'smoke',
    payload: { type: 'triangle.smoke.ping', correlationId, timestamp: new Date().toISOString() },
    traceId: correlationId,
    ventureId: '__triangle-smoke__',
  });
  if (pub.ok) {
    ok('Fabric POST /events', `eventId=${pub.data.eventId}`);
  } else {
    fail('Fabric POST /events', pub.error);
  }

  // Give the write a second to land
  await new Promise((r) => setTimeout(r, 500));

  const query = await fabric.queryAudit({ ventureId: '__triangle-smoke__', limit: 10 });
  if (query.ok) {
    ok('Fabric GET /audit', `entries=${query.data.entries.length}, total=${query.data.total}`);
  } else {
    fail('Fabric GET /audit', query.error);
  }

  // ── 4. Intelligence chat round-trip ────────────────────────────────
  heading('4. Intelligence chat round-trip');
  const chat = await intelligence.chat({
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
    maxTokens: 32,
    messages: [
      { role: 'system', content: 'You are a test probe. Reply with only the word: pong' },
      { role: 'user', content: 'ping' },
    ],
    ventureId: '__triangle-smoke__',
  });
  if (chat.ok) {
    ok('Intelligence POST /chat', `content="${chat.data.content.slice(0, 40).replace(/\n/g, ' ')}", tokens=${chat.data.usage.inputTokens}+${chat.data.usage.outputTokens}, cost=$${chat.data.usage.costUsd}`);
  } else {
    fail('Intelligence POST /chat', chat.error);
  }

  // ── 5. Intelligence streaming smoke ────────────────────────────────
  heading('5. Intelligence streaming');
  let streamedChars = 0;
  try {
    const final = await intelligence.chatStream(
      {
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        maxTokens: 32,
        messages: [
          { role: 'system', content: 'You are a test probe. Reply with only: stream ok' },
          { role: 'user', content: 'ping' },
        ],
        ventureId: '__triangle-smoke__',
      },
      (chunk) => { streamedChars += chunk.length; },
    );
    ok('Intelligence POST /chat/stream', `${streamedChars} chars streamed, finish=${final.finishReason}, model=${final.model}`);
  } catch (err) {
    fail('Intelligence POST /chat/stream', err);
  }

  // ── Summary ────────────────────────────────────────────────────────
  heading('Summary');
  if (failures === 0) {
    console.log(`${C.green}All checks passed.${C.reset}`);
    process.exit(0);
  } else {
    console.log(`${C.red}${failures} check(s) failed.${C.reset}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`${C.red}Smoke test crashed:${C.reset}`, err);
  process.exit(2);
});
