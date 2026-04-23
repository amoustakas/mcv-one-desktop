// Agentic OS Layer 1 — Events API handler
//
// Routes: POST /api/events { action, ...params }  + GET variants.
//
// Actions:
//   list-recent-events      — query event_log with filters (topic, venture, since, limit)
//   list-contracts          — query integration_contracts (per-module declarations)
//   register-contracts      — persist ALL_CONTRACTS to integration_contracts (boot wiring)
//   list-dead-letters       — query event_dead_letters (DLQ cockpit)
//   retry-dead-letter       — re-invoke an archived event against a registered handler
//   replay                  — replay a window of event_log to a target handler (ad-hoc)
//   publish-test            — dev-only: emit a synthetic event (EventStreamView smoke test)
//
// Pattern matches api/_handlers/capital.ts + foundation.ts (Clerk auth,
// action-dispatch). Service-role Supabase for writes; RLS protects read-only
// surfaces behind mcv_admin.

import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  ALL_CONTRACTS,
  createContractRegistry,
  createDeadLetterService,
  createPublisher,
  createReplayService,
  registerContracts,
  topicMatches,
} from '@mcv/events-sdk';
import { requestLogger } from '../../src/lib/server/logger';

async function requireAuth(req: VercelRequest, res: VercelResponse): Promise<string | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return 'no-secret';
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.cookies?.__session || null);
  if (!token) { res.status(401).json({ error: 'Authentication required' }); return null; }
  try {
    const { verifyToken } = await import('@clerk/backend');
    const payload = await verifyToken(token, { secretKey });
    return payload.sub;
  } catch { res.status(401).json({ error: 'Invalid session' }); return null; }
}

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
);

// Shared services.
const registry  = createContractRegistry({ contracts: ALL_CONTRACTS });
const publisher = createPublisher({ supabase, registry });
const deadLetters = createDeadLetterService({ supabase });
const replayer  = createReplayService({ supabase });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { log, correlationId } = requestLogger(
    req as unknown as { headers?: Record<string, unknown>; url?: string; method?: string },
  );
  try { res.setHeader('x-correlation-id', correlationId); } catch { /* headers already sent */ }
  const start = Date.now();
  log.info({ event: 'request_in' });
  res.on('finish', () => {
    log.info({ event: 'request_out', status: res.statusCode, duration_ms: Date.now() - start });
  });

  const userId = await requireAuth(req, res);
  if (!userId) return;

  const action = req.method === 'GET' ? (req.query.action as string) : req.body?.action;
  const p = { ...req.query, ...(req.body || {}) } as Record<string, unknown>;

  try {
    switch (action) {
      // ─── Event log queries ──────────────────────────────────────────────
      case 'list-recent-events': {
        const limit = Math.min(Number(p.limit) || 200, 1000);
        let q = supabase
          .from('event_log')
          .select('*')
          .order('emitted_at', { ascending: false })
          .limit(limit);
        if (p.topic_prefix) q = q.like('topic', `${p.topic_prefix as string}%`);
        if (p.venture_id) q = q.eq('venture_id', p.venture_id as string);
        if (p.correlation_id) q = q.eq('correlation_id', p.correlation_id as string);
        if (p.since) q = q.gte('emitted_at', p.since as string);
        if (p.status) q = q.eq('status', p.status as string);
        const { data, error } = await q;
        if (error) throw new Error(error.message);
        // If topic_pattern is provided, re-filter in memory (supports segment wildcards).
        const pattern = p.topic_pattern as string | undefined;
        const rows = pattern
          ? (data ?? []).filter((r) => topicMatches((r as { topic: string }).topic, pattern))
          : data ?? [];
        return res.json({ events: rows });
      }

      // ─── Contracts ──────────────────────────────────────────────────────
      case 'list-contracts': {
        const { data, error } = await supabase
          .from('integration_contracts')
          .select('*')
          .order('module');
        if (error) throw new Error(error.message);
        return res.json({
          contracts: data ?? [],
          inMemory: {
            modules: ALL_CONTRACTS.map((c) => ({
              module: c.module,
              version: c.version,
              emitCount: c.emits.length,
              subscribeCount: c.subscribes.length,
              emits: c.emits.map((e) => ({ topic: e.topic, description: e.description })),
              subscribes: c.subscribes.map((s) => ({ topicPattern: s.topicPattern, description: s.description })),
            })),
          },
        });
      }

      case 'register-contracts': {
        await registerContracts(supabase, ALL_CONTRACTS);
        return res.json({ ok: true, registered: ALL_CONTRACTS.length });
      }

      // ─── Dead-letter queue ──────────────────────────────────────────────
      case 'list-dead-letters': {
        const letters = await deadLetters.list({
          topic: p.topic as string | undefined,
          status: (p.status as never) ?? undefined,
          limit: Number(p.limit) || 100,
        });
        return res.json({ deadLetters: letters });
      }

      case 'retry-dead-letter': {
        // Without a registered in-process handler, retry is a no-op that just
        // bumps attempt_count. Real retry hooks land with M-F2 (workflow engine)
        // and M-F3 (agent fleet) which register handlers on this process.
        const result = await deadLetters.retry(p.id as string, async () => {
          throw new Error('no registered handler — retry ineffective until M-F2/M-F3 attach subscribers');
        });
        return res.json(result);
      }

      // ─── Replay ─────────────────────────────────────────────────────────
      case 'replay': {
        // Replay is observation-only: we count how many events matched but
        // don't actually re-drive handlers from an HTTP request — the caller
        // supplies no handler. For a real replay, use events-sdk directly
        // from an agent/workflow in-process.
        const topicPattern = p.topic_pattern as string;
        if (!topicPattern) return res.status(400).json({ error: 'topic_pattern required' });
        let count = 0;
        const result = await replayer.replay({
          topicPattern,
          since: p.since as string | undefined,
          until: p.until as string | undefined,
          limit: Math.min(Number(p.limit) || 100, 1000),
          ventureId: p.venture_id as string | undefined,
          correlationId: p.correlation_id as string | undefined,
          targetHandler: async () => { count += 1; },
        });
        return res.json({ ...result, counted: count });
      }

      // ─── Dev-only smoke test ────────────────────────────────────────────
      case 'publish-test': {
        const topic = (p.topic as string) ?? 'foundation.counsel.nda-executed';
        const payload = (p.payload as Record<string, unknown>) ?? {
          engagementId: '00000000-0000-0000-0000-000000000001',
          firmName: 'Test & Partners LLP',
          workstream: 'ip',
          executedAt: new Date().toISOString(),
        };
        const envelope = await publisher.publish(topic, payload, {
          ventureId: (p.venture_id as string | null) ?? null,
          emittedBy: `user:${userId}`,
        });
        return res.json({ envelope });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error({ event: 'request_err', err: msg });
    if (!res.headersSent) res.status(500).json({ error: msg });
  }
}
