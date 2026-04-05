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

/**
 * Orchestration API — hierarchical task system + session coordination
 *
 * Task hierarchy: epic → sprint → story → task → sub_atomic
 * Session pulse: tracks all active Claude Code sessions across ventures
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res); if (!userId) return;
  const action = req.method === 'GET' ? req.query.action as string : req.body?.action;

  try {
    switch (action) {
      // ── Epics: top-level initiatives ──
      case 'list-epics': {
        const ventureId = req.body?.venture_id;
        let q = supabase.from('tasks').select('*').eq('task_type', 'epic').order('sort_order').order('created_at');
        if (ventureId) q = q.eq('venture_id', ventureId);
        const { data, error } = await q;
        if (error) throw error;
        return res.json({ epics: data });
      }

      // ── Full hierarchy: epic with children ──
      case 'get-epic': {
        const epicId = req.body?.id;
        if (!epicId) return res.status(400).json({ error: 'id required' });

        const { data: epic } = await supabase.from('tasks').select('*').eq('id', epicId).single();
        const { data: children } = await supabase.from('tasks').select('*').eq('parent_id', epicId).order('sort_order');

        // For each child (sprint/story), get its children too
        const enriched = await Promise.all((children || []).map(async (child: any) => {
          const { data: subChildren } = await supabase.from('tasks').select('*').eq('parent_id', child.id).order('sort_order');
          return { ...child, children: subChildren || [] };
        }));

        return res.json({ epic, children: enriched });
      }

      // ── Create task at any level ──
      case 'create': {
        const { title, description, task_type, parent_id, venture_id, priority, assignee, session_id, story_points, acceptance_criteria, sprint_id } = req.body;
        if (!title || !task_type) return res.status(400).json({ error: 'title and task_type required' });

        // Auto-inherit venture from parent
        let resolvedVenture = venture_id;
        if (parent_id && !resolvedVenture) {
          const { data: parent } = await supabase.from('tasks').select('venture_id').eq('id', parent_id).single();
          resolvedVenture = parent?.venture_id;
        }

        const { data, error } = await supabase.from('tasks').insert({
          user_id: userId,
          title,
          description: description || '',
          task_type,
          parent_id: parent_id || null,
          venture_id: resolvedVenture || 'mcv',
          priority: priority || 'medium',
          assignee: assignee || null,
          session_id: session_id || null,
          source: session_id ? 'session' : 'manual',
          story_points: story_points || 0,
          acceptance_criteria: acceptance_criteria || [],
          sprint_id: sprint_id || null,
          status: 'todo',
        }).select().single();
        if (error) throw error;
        return res.json({ task: data });
      }

      // ── Update progress: roll up from children ──
      case 'update-progress': {
        const taskId = req.body?.id;
        if (!taskId) return res.status(400).json({ error: 'id required' });

        const { data: children } = await supabase.from('tasks').select('status, progress').eq('parent_id', taskId);
        if (!children?.length) {
          // Leaf node — use direct progress
          const { data } = await supabase.from('tasks').update({ progress: req.body.progress || 0, updated_at: new Date().toISOString() }).eq('id', taskId).select().single();
          return res.json({ task: data });
        }

        // Roll up from children
        const total = children.length;
        const completed = children.filter((c: any) => c.status === 'done').length;
        const avgProgress = Math.round(children.reduce((s: number, c: any) => s + (c.progress || 0), 0) / total);
        const rollupProgress = Math.max(Math.round((completed / total) * 100), avgProgress);

        const newStatus = completed === total ? 'done' : completed > 0 ? 'in_progress' : 'todo';
        const { data } = await supabase.from('tasks').update({
          progress: rollupProgress,
          status: newStatus,
          completed_at: newStatus === 'done' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        }).eq('id', taskId).select().single();

        return res.json({ task: data, rollup: { total, completed, avgProgress } });
      }

      // ── Session pulse: register/update active session ──
      case 'session-heartbeat': {
        const { session_id, project, venture_id, summary, plan_file, worktree, commits_count, files_changed } = req.body;
        if (!session_id || !project) return res.status(400).json({ error: 'session_id and project required' });

        const { data, error } = await supabase.from('sessions').upsert({
          id: session_id,
          project,
          venture_id: venture_id || null,
          status: 'active',
          last_active: new Date().toISOString(),
          summary: summary || null,
          plan_file: plan_file || null,
          worktree: worktree || null,
          commits_count: commits_count || 0,
          files_changed: files_changed || 0,
        }, { onConflict: 'id' }).select().single();
        if (error) throw error;
        return res.json({ session: data });
      }

      // ── List active sessions ──
      case 'list-sessions': {
        const { data, error } = await supabase.from('sessions')
          .select('*')
          .in('status', ['active', 'idle'])
          .order('last_active', { ascending: false });
        if (error) throw error;
        return res.json({ sessions: data });
      }

      // ── Log session event ──
      case 'log-event': {
        const { session_id, event_type, title, description, venture_id, task_id, metadata } = req.body;
        if (!session_id || !event_type || !title) return res.status(400).json({ error: 'session_id, event_type, title required' });

        const { data, error } = await supabase.from('session_events').insert({
          session_id,
          event_type,
          title,
          description: description || null,
          venture_id: venture_id || null,
          task_id: task_id || null,
          metadata: metadata || {},
        }).select().single();
        if (error) throw error;
        return res.json({ event: data });
      }

      // ── Get session timeline ──
      case 'session-timeline': {
        const sessionId = req.body?.session_id;
        let q = supabase.from('session_events').select('*').order('created_at', { ascending: false }).limit(100);
        if (sessionId) q = q.eq('session_id', sessionId);
        const { data, error } = await q;
        if (error) throw error;
        return res.json({ events: data });
      }

      // ── Roadmap overview: all epics with child counts ──
      case 'roadmap': {
        const { data: epics, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('task_type', 'epic')
          .order('sort_order');
        if (error) throw error;

        // Get child counts for each epic
        const enriched = await Promise.all((epics || []).map(async (epic: any) => {
          const { data: children } = await supabase
            .from('tasks')
            .select('id, status, task_type, progress')
            .eq('parent_id', epic.id);

          const total = children?.length || 0;
          const done = children?.filter((c: any) => c.status === 'done').length || 0;
          const inProgress = children?.filter((c: any) => c.status === 'in_progress').length || 0;

          return {
            ...epic,
            child_count: total,
            done_count: done,
            in_progress_count: inProgress,
            completion: total > 0 ? Math.round((done / total) * 100) : (epic.status === 'done' ? 100 : 0),
          };
        }));

        // Active sessions
        const { data: sessions } = await supabase
          .from('sessions')
          .select('*')
          .eq('status', 'active')
          .order('last_active', { ascending: false });

        return res.json({ epics: enriched, sessions: sessions || [] });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
  }
}
