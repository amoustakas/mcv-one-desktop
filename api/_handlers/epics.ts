import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res); if (!userId) return;
  const action = req.method === 'GET' ? req.query.action as string : req.body?.action;

  try {
    switch (action) {
      case 'list': {
        const { venture_id, suite, status } = { ...req.query, ...(req.body || {}) } as Record<string, string | undefined>;
        let q = supabase.from('epics').select('*').order('priority_order', { ascending: true }).order('created_at', { ascending: false }).limit(200);
        if (venture_id) q = q.eq('venture_id', venture_id);
        if (suite) q = q.eq('suite', suite);
        if (status) q = q.eq('status', status);
        const { data, error } = await q;
        if (error) throw error;
        return res.json({ epics: data || [] });
      }

      case 'get': {
        const id = (req.query.id || req.body?.id) as string;
        const [{ data: epic }, { data: stories }, { data: checkpoints }] = await Promise.all([
          supabase.from('epics').select('*').eq('id', id).single(),
          supabase.from('stories').select('*').eq('epic_id', id).order('priority_order', { ascending: true }),
          supabase.from('epic_checkpoints').select('*').eq('epic_id', id).order('created_at', { ascending: true }),
        ]);
        return res.json({ epic, stories: stories || [], checkpoints: checkpoints || [] });
      }

      case 'create': {
        const epic = { ...(req.body?.epic || {}), created_by: userId };
        const { data, error } = await supabase.from('epics').insert(epic).select().single();
        if (error) throw error;
        await supabase.from('notifications').insert({
          type: 'info',
          title: `Epic filed: ${data.title}`,
          description: data.summary || `Priority: ${data.priority}`,
          source: 'naos',
          venture_id: data.venture_id,
        }).then(() => null).catch(() => null);
        return res.json({ epic: data });
      }

      case 'update': {
        const { id, ...updates } = req.body;
        if (updates.status === 'done' && !updates.completed_at) updates.completed_at = new Date().toISOString();
        const { data, error } = await supabase.from('epics').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
        if (error) throw error;
        return res.json({ epic: data });
      }

      case 'delete': {
        await supabase.from('epics').delete().eq('id', req.body.id);
        return res.json({ success: true });
      }

      case 'decompose': {
        const { epic_id, stories } = req.body as { epic_id: string; stories: Array<Record<string, unknown>> };
        if (!Array.isArray(stories) || stories.length === 0) return res.status(400).json({ error: 'stories[] required' });
        const rows = stories.map((s, i) => ({ ...s, epic_id, priority_order: (s.priority_order as number) ?? (i + 1) * 10 }));
        const { data, error } = await supabase.from('stories').insert(rows).select();
        if (error) throw error;
        return res.json({ stories: data || [] });
      }

      case 'create_story': {
        const { data, error } = await supabase.from('stories').insert(req.body.story).select().single();
        if (error) throw error;
        return res.json({ story: data });
      }

      // Story read — used by claim_story to check for prior claims before
      // reserving. Returns null if not found so callers branch cleanly.
      case 'get_story': {
        const id = (req.query.id || req.body?.id) as string;
        if (!id) return res.status(400).json({ error: 'id required' });
        const { data, error } = await supabase.from('stories').select('*').eq('id', id).maybeSingle();
        if (error) throw error;
        return res.json({ story: data });
      }

      case 'update_story': {
        const { id, ...updates } = req.body;
        if (updates.status === 'done' && !updates.completed_at) updates.completed_at = new Date().toISOString();
        const { data, error } = await supabase.from('stories').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
        if (error) throw error;
        return res.json({ story: data });
      }

      // Counterpart to claim_story: releases a claim without finishing the
      // work. Clears any session_claim invocations matching session_id and
      // optionally moves status back to 'todo'. Safe to call even if no
      // active claim exists for this session.
      case 'release_story': {
        const { id, session_id, reset_status = true } = req.body as { id: string; session_id: string; reset_status?: boolean };
        if (!id || !session_id) return res.status(400).json({ error: 'id and session_id required' });
        const { data: story } = await supabase.from('stories').select('kit_invocations, status').eq('id', id).maybeSingle();
        if (!story) return res.status(404).json({ error: 'story not found' });
        const prior = Array.isArray(story.kit_invocations) ? story.kit_invocations : [];
        const kit_invocations = prior.filter((k: Record<string, unknown>) => !(k.type === 'session_claim' && k.session_id === session_id));
        kit_invocations.push({ type: 'session_release', session_id, at: new Date().toISOString() });
        const updates: Record<string, unknown> = { kit_invocations, updated_at: new Date().toISOString() };
        if (reset_status && story.status === 'in-progress') updates.status = 'todo';
        const { data, error } = await supabase.from('stories').update(updates).eq('id', id).select().single();
        if (error) throw error;
        return res.json({ story: data });
      }

      case 'request_checkpoint': {
        const checkpoint = req.body.checkpoint as Record<string, unknown>;
        const { data, error } = await supabase.from('epic_checkpoints').insert({ ...checkpoint, state: 'awaiting-review' }).select().single();
        if (error) throw error;
        await supabase.from('notifications').insert({
          type: 'warning',
          title: `Checkpoint awaiting review`,
          description: `${checkpoint.title || checkpoint.checkpoint_type}`,
          source: 'naos',
        }).then(() => null).catch(() => null);
        return res.json({ checkpoint: data });
      }

      case 'resolve_checkpoint': {
        const { id, state, decision_notes, approver } = req.body as Record<string, string>;
        const patch: Record<string, unknown> = { state, decision_notes, resolved_at: new Date().toISOString() };
        if (approver && (state === 'approved' || state === 'rejected')) {
          const { data: current } = await supabase.from('epic_checkpoints').select('approved_by').eq('id', id).single();
          const approved_by = Array.from(new Set([...(current?.approved_by || []), approver]));
          patch.approved_by = approved_by;
        }
        const { data, error } = await supabase.from('epic_checkpoints').update(patch).eq('id', id).select().single();
        if (error) throw error;
        return res.json({ checkpoint: data });
      }

      case 'stats': {
        const { data } = await supabase.from('epics').select('status, priority, venture_id, suite, progress_pct');
        const epics = data || [];
        const byStatus: Record<string, number> = {};
        const bySuite: Record<string, number> = {};
        let avgProgress = 0;
        epics.forEach((e: any) => {
          byStatus[e.status] = (byStatus[e.status] || 0) + 1;
          if (e.suite) bySuite[e.suite] = (bySuite[e.suite] || 0) + 1;
          avgProgress += e.progress_pct || 0;
        });
        avgProgress = epics.length ? Math.round(avgProgress / epics.length) : 0;
        return res.json({ total: epics.length, byStatus, bySuite, avgProgress });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : (error && typeof error === 'object' && 'message' in error ? String((error as { message: unknown }).message) : JSON.stringify(error)) });
  }
}
