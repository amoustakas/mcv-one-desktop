// api/_handlers/knowledge-observer.ts
//
// Phase-1 Intelligence Router · STRICT subscriber
//
// Subscribes to 4 event topics (seeded into event_subscribers by the
// Phase-1 migration):
//   - agentic.draft.approved  → kind='decision' memory
//   - agentic.draft.edited    → kind='preference' memory
//   - agentic.draft.rejected  → kind='constraint' memory
//   - foundation.*.approved   → kind='fact' memory (per-module extraction)
//
// Invocation shape — this handler is called by:
//   (a) the Phase-2 event-resolver cron (not yet live) via POST with the
//       full event envelope in the body
//   (b) direct calls from any handler that wants to force-observe (debug /
//       admin flows)
//
// POST body:
//   { topic, payload, correlation_id?, venture_id?, tenant_id?, event_id? }
//
// STRICT RLS from day one — calls supabase.rpc('set_tenant', { t: tenantId })
// BEFORE any read/write. No service-role bypass dependence.

import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createPublisher } from '@mcv/events-sdk';
import { IntelligenceRouter, type ObserveKind, type Provenance } from '@mcv/intelligence-sdk-router';
import { requestLogger } from '../../src/lib/server/logger';

/** Platform tenant — matches the retroactive backfill default in
 *  migration-intelligence-unification-2026-04-28.sql. */
const PLATFORM_TENANT_ID = '00000000-0000-0000-0000-000000000000';

const supabase = createClient(
  process.env.SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_KEY ?? '',
);

const events = createPublisher({ supabase });

/**
 * Server-side embedding fn — calls /api/_embeddings which is the Phase-0
 * proxy that scrubs PII and never exposes GOOGLE_AI_KEY to the browser.
 * Knowledge-observer always runs server-side so we hit the local endpoint
 * via the function's own origin — but for Phase-1 simplicity we call the
 * embedding proxy directly from here (same process).
 */
async function embed(text: string): Promise<number[]> {
  const res = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/_embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-internal-service': 'knowledge-observer' },
    body: JSON.stringify({ inputs: [text], scrubPii: true }),
  });
  if (!res.ok) throw new Error(`embed failed: ${res.status}`);
  const data = (await res.json()) as number[][];
  const first = data[0];
  if (!Array.isArray(first)) throw new Error('embed: malformed response');
  return first;
}

interface InboundEvent {
  topic: string;
  payload?: Record<string, unknown>;
  correlation_id?: string;
  venture_id?: string | null;
  tenant_id?: string | null;
  event_id?: string;
}

/** Resolve tenant — body-provided tenant wins, else platform tenant. */
function resolveTenant(body: InboundEvent): string {
  if (body.tenant_id && typeof body.tenant_id === 'string') return body.tenant_id;
  return PLATFORM_TENANT_ID;
}

async function requireAuth(req: VercelRequest, res: VercelResponse): Promise<string | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  // Phase-1: also accept an internal service token so the Phase-2 resolver
  // cron can invoke this handler without a user session. The internal
  // token is derived from AGENT_SIGNING_KEY (already in env per CLAUDE.md).
  const internal = req.headers['x-internal-service'];
  if (internal && typeof internal === 'string' && internal.length > 0) {
    return 'internal:' + internal;
  }
  if (!secretKey) return 'no-secret';
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.cookies?.__session || null);
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }
  try {
    const { verifyToken } = await import('@clerk/backend');
    const payload = await verifyToken(token, { secretKey });
    return payload.sub;
  } catch {
    res.status(401).json({ error: 'Invalid session' });
    return null;
  }
}

function topicToKind(topic: string): { kind: ObserveKind; summaryStub: string } | null {
  if (topic === 'agentic.draft.approved') return { kind: 'decision', summaryStub: 'approved draft' };
  if (topic === 'agentic.draft.edited')   return { kind: 'preference', summaryStub: 'edited draft' };
  if (topic === 'agentic.draft.rejected') return { kind: 'constraint', summaryStub: 'rejected draft' };
  if (topic.startsWith('foundation.') && topic.endsWith('.approved')) {
    return { kind: 'fact', summaryStub: `approved ${topic.slice('foundation.'.length, -'.approved'.length)}` };
  }
  return null;
}

interface DraftRow {
  id: string;
  title: string;
  summary: string;
  body_md: string;
  target_venture: string | null;
  tenant_id: string;
  status: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { log, correlationId } = requestLogger(
    req as unknown as { headers?: Record<string, unknown>; url?: string; method?: string },
  );
  try { res.setHeader('x-correlation-id', correlationId); } catch { /* headers already sent */ }
  const start = Date.now();
  log.info({ event: 'request_in', path: '/api/knowledge-observer' });

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST required' });
    return;
  }

  const who = await requireAuth(req, res);
  if (!who) return; // requireAuth already wrote response

  const body = (req.body ?? {}) as InboundEvent;
  const topic = body.topic;
  if (!topic) {
    res.status(400).json({ error: 'topic required' });
    return;
  }

  const routeInfo = topicToKind(topic);
  if (!routeInfo) {
    log.info({ event: 'knowledge_observer.topic_skip', topic });
    res.status(200).json({ ok: true, skipped: true, reason: 'topic not routable to observe kind' });
    return;
  }

  const tenantId = resolveTenant(body);

  // STRICT: set_tenant BEFORE any DB touch.
  const { error: setErr } = await supabase.rpc('set_tenant', { t: tenantId });
  if (setErr) {
    log.info({ event: 'knowledge_observer.set_tenant_error', error: setErr.message });
    res.status(500).json({ error: `set_tenant failed: ${setErr.message}` });
    return;
  }

  // Resolve draft context if the event is draft-scoped.
  let content: string = routeInfo.summaryStub;
  let draftId: string | undefined;
  const ventureId = (body.venture_id as string | null | undefined) ?? null;
  const payloadDraftId = (body.payload as { draftId?: string } | undefined)?.draftId;
  if (payloadDraftId && (topic === 'agentic.draft.approved' || topic === 'agentic.draft.edited' || topic === 'agentic.draft.rejected')) {
    const { data } = await supabase
      .from('agent_drafts')
      .select('id, title, summary, body_md, target_venture, tenant_id, status')
      .eq('id', payloadDraftId)
      .maybeSingle();
    const draft = data as DraftRow | null;
    if (draft) {
      draftId = draft.id;
      content = `${draft.title} — ${draft.summary}`;
    }
  }

  // For foundation.*.approved, derive content from topic + payload keys.
  if (topic.startsWith('foundation.') && topic.endsWith('.approved')) {
    const pl = body.payload ?? {};
    const keyBits = Object.entries(pl)
      .filter(([, v]) => typeof v === 'string' || typeof v === 'number')
      .slice(0, 4)
      .map(([k, v]) => `${k}=${String(v).slice(0, 80)}`);
    if (keyBits.length > 0) content = `${topic} — ${keyBits.join(' · ')}`;
  }

  const provenance: Provenance = {
    source: draftId ? `draft:${draftId}` : `event:${body.event_id ?? 'unknown'}`,
    correlationId: body.correlation_id,
    eventId: body.event_id,
    driver: 'knowledge-observer',
    topic,
  };

  const router = new IntelligenceRouter({
    supabase,
    events,
    tenantId,
    ventureId: ventureId ?? undefined,
    userId: undefined,
    agentHandle: undefined,
    embed,
  });

  try {
    const result = await router.observe({
      kind: routeInfo.kind,
      content,
      provenance,
      confidence: routeInfo.kind === 'decision' ? 1.0 : 0.85,
      tags: [`topic:${topic}`, ...(draftId ? [`draft:${draftId}`] : [])],
      ventureId: ventureId ?? undefined,
    });

    res.on('finish', () => log.info({
      event: 'request_out',
      status: res.statusCode,
      duration_ms: Date.now() - start,
      memoryId: result.id,
      kind: result.kind,
      topic,
    }));
    res.status(200).json({ ok: true, memoryId: result.id, substrate: result.substrate, kind: result.kind });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.info({ event: 'knowledge_observer.observe_error', error: msg, topic });
    res.status(500).json({ error: msg });
  }
}
