// api/_handlers/agentic.ts
//
// Agentic OS · Layer 4 (Draft Inbox) API surface.
//
// POST /api/agentic { action, ...params }
//
// Actions:
//   list-drafts     → all drafts newest-first
//   approve-draft   → { id, notes? }  → status=approved, emits agentic.draft_approved
//   reject-draft    → { id, reason? } → status=rejected, emits agentic.draft_rejected
//   edit-draft      → { id, body_md } → status=edited,   emits agentic.draft_edited
//
// Writes go through the service-role Supabase client; reads as well (no RLS
// needed — Clerk gates at the handler boundary).

import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createPublisher } from '@mcv/events-sdk';
import { requestLogger } from '../../src/lib/server/logger';

async function requireAuth(req: VercelRequest, res: VercelResponse): Promise<string | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
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

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
);

const eventPublisher = createPublisher({ supabase });

type AgenticTopic =
  | 'agentic.draft_created'
  | 'agentic.draft_approved'
  | 'agentic.draft_rejected'
  | 'agentic.draft_edited';

async function publishAgenticEvent(
  topic: AgenticTopic,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    await eventPublisher.publish(topic, payload, {
      ventureId: (payload.targetVenture as string | null) ?? null,
      emittedBy: 'api:agentic',
    });
  } catch {
    // Event publish is best-effort — the state transition already succeeded.
    // Failures land in the publisher's own error path; don't block the UI.
  }
}

interface AgentDraftRow {
  id: string;
  draft_type: string;
  title: string;
  summary: string;
  body_md: string;
  emitter_agent: string;
  target_venture: string | null;
  status: string;
  context_refs: unknown;
  created_at: string;
  decided_at: string | null;
  decided_by: string | null;
  created_key: string | null;
}

function draftCore(d: AgentDraftRow) {
  return {
    draftId: d.id,
    draftType: d.draft_type,
    title: d.title,
    emitterAgent: d.emitter_agent,
    targetVenture: d.target_venture,
  };
}

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
      case 'list-drafts': {
        const { data, error } = await supabase
          .from('agent_drafts')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return res.json({ drafts: (data ?? []) as AgentDraftRow[] });
      }

      case 'approve-draft': {
        const { data, error } = await supabase
          .from('agent_drafts')
          .update({
            status: 'approved',
            decided_at: new Date().toISOString(),
            decided_by: userId,
          })
          .eq('id', p.id as string)
          .select('*')
          .single();
        if (error) throw error;
        const draft = data as AgentDraftRow;
        await publishAgenticEvent('agentic.draft_approved', {
          ...draftCore(draft),
          decidedBy: userId,
          notes: (p.notes as string | null) ?? null,
        });
        return res.json({ draft });
      }

      case 'reject-draft': {
        const { data, error } = await supabase
          .from('agent_drafts')
          .update({
            status: 'rejected',
            decided_at: new Date().toISOString(),
            decided_by: userId,
          })
          .eq('id', p.id as string)
          .select('*')
          .single();
        if (error) throw error;
        const draft = data as AgentDraftRow;
        await publishAgenticEvent('agentic.draft_rejected', {
          ...draftCore(draft),
          decidedBy: userId,
          reason: (p.reason as string | null) ?? null,
        });
        return res.json({ draft });
      }

      case 'edit-draft': {
        const body = p.body_md as string;
        if (!body) return res.status(400).json({ error: 'body_md required' });
        const { data, error } = await supabase
          .from('agent_drafts')
          .update({
            body_md: body,
            status: 'edited',
            decided_at: new Date().toISOString(),
            decided_by: userId,
          })
          .eq('id', p.id as string)
          .select('*')
          .single();
        if (error) throw error;
        const draft = data as AgentDraftRow;
        await publishAgenticEvent('agentic.draft_edited', {
          ...draftCore(draft),
          decidedBy: userId,
          bodyPreview: body.slice(0, 240),
        });
        return res.json({ draft });
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
