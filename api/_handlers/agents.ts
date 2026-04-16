// api/_handlers/agents.ts
// Agent Roster API — read/write the team that runs the ecosystem.
// Plan: C:\Users\moust\.claude\plans\agent-roster-foundation.md

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
  const userId = await requireAuth(req, res);
  if (!userId) return;
  const action = req.method === 'GET' ? (req.query.action as string) : req.body?.action;
  const params = { ...req.query, ...(req.body || {}) } as Record<string, unknown>;

  try {
    switch (action) {
      case 'list': {
        let q = supabase
          .from('agent_persona')
          .select('id, handle, full_name, title, department, seniority, scope_kind, scope_value, reports_to_agent_id, interaction_mode, persona_bio, voice_profile, kit_allowlist, tool_allowlist, data_scopes, avatar_url, accent_color, active, hired_at, metadata')
          .eq('active', true)
          .order('seniority', { ascending: true })
          .order('department', { ascending: true })
          .order('full_name', { ascending: true });
        if (params.department) q = q.eq('department', params.department as string);
        if (params.seniority) q = q.eq('seniority', params.seniority as string);
        if (params.scope_kind) q = q.eq('scope_kind', params.scope_kind as string);
        const { data, error } = await q;
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ agents: data ?? [] });
      }
      case 'get': {
        const handle = params.handle as string | undefined;
        const id = params.id as string | undefined;
        if (!handle && !id) return res.status(400).json({ error: 'handle or id required' });
        let q = supabase.from('agent_persona').select().eq('active', true);
        if (handle) q = q.eq('handle', handle);
        else q = q.eq('id', id!);
        const { data, error } = await q.maybeSingle();
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ agent: data });
      }
      case 'org-chart': {
        const { data, error } = await supabase
          .from('agent_persona')
          .select('id, handle, full_name, title, department, seniority, scope_kind, scope_value, reports_to_agent_id, accent_color, avatar_url')
          .eq('active', true);
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ nodes: data ?? [] });
      }
      case 'activity': {
        const agentId = params.agent_id as string | undefined;
        const limit = Number(params.limit ?? 50);
        let q = supabase
          .from('agent_activity_log')
          .select()
          .order('created_at', { ascending: false })
          .limit(Math.min(limit, 200));
        if (agentId) q = q.eq('agent_id', agentId);
        const { data, error } = await q;
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ activity: data ?? [] });
      }
      // ── start-conversation: wires chat to an agent persona ──────────
      // Creates an agent_conversation row + a matching conversations row
      // so the chat UI can stream through its existing /api/chat pipeline
      // while still carrying the agent_id on every message.
      case 'start-conversation': {
        const handle = params.handle as string | undefined;
        const ventureId = (params.venture_id as string | undefined) ?? null;
        const title = (params.title as string | undefined) ?? 'New conversation';
        if (!handle) return res.status(400).json({ error: 'handle required' });

        const { data: agent, error: agentErr } = await supabase
          .from('agent_persona')
          .select('id, handle, full_name, title, accent_color, avatar_url, system_prompt, kit_allowlist, tool_allowlist, scope_value, metadata')
          .eq('handle', handle)
          .eq('active', true)
          .maybeSingle();
        if (agentErr) return res.status(500).json({ error: agentErr.message });
        if (!agent) return res.status(404).json({ error: `Agent ${handle} not found` });

        const convVentureId = ventureId || (agent.scope_value as string | null) || 'mcv';

        const { data: agentConv, error: agentConvErr } = await supabase
          .from('agent_conversation')
          .insert({
            agent_id: agent.id,
            user_id: userId,
            venture_id: convVentureId,
            title,
          })
          .select('id')
          .single();
        if (agentConvErr) return res.status(500).json({ error: agentConvErr.message });

        const { data: conv, error: convErr } = await supabase
          .from('conversations')
          .insert({
            venture_id: convVentureId,
            title,
            agent_id: agent.id,
            agent_conversation_id: agentConv.id,
            user_id: userId,
          })
          .select('id, title, venture_id, created_at')
          .single();
        if (convErr) return res.status(500).json({ error: convErr.message });

        // Audit: first chat_turn is logged on first user message; the
        // start-conversation event itself is a 'system' action. Wrapped in
        // try/catch because audit must never break the conversation flow.
        try {
          await supabase.from('agent_activity_log').insert({
            agent_id: agent.id,
            actor_user_id: userId,
            session_id: agentConv.id,
            action_kind: 'system',
            input: { event: 'conversation_started', conversation_id: conv.id },
            output: {},
            venture_id: convVentureId,
          });
        } catch { /* non-fatal */ }

        return res.json({
          conversation_id: conv.id,
          agent_conversation_id: agentConv.id,
          venture_id: convVentureId,
          agent: {
            id: agent.id,
            handle: agent.handle,
            full_name: agent.full_name,
            title: agent.title,
            accent_color: agent.accent_color,
            avatar_url: agent.avatar_url,
            kit_allowlist: agent.kit_allowlist,
            tool_allowlist: agent.tool_allowlist,
            // Model is runtime — exposed so the client can pass it to /api/chat.
            // See CLAUDE invariant: "The persona is data. The model is runtime."
            model: (agent.metadata as Record<string, unknown> | null)?.model ?? null,
          },
          system_prompt: agent.system_prompt,
        });
      }
      // ── list-conversations: recent threads with this agent ──────────
      case 'list-conversations': {
        const handle = params.handle as string | undefined;
        const agentIdParam = params.agent_id as string | undefined;
        const limit = Math.min(Number(params.limit ?? 25), 100);

        let agentId = agentIdParam;
        if (!agentId && handle) {
          const { data: a } = await supabase
            .from('agent_persona')
            .select('id')
            .eq('handle', handle)
            .eq('active', true)
            .maybeSingle();
          agentId = a?.id;
        }
        if (!agentId) return res.status(400).json({ error: 'handle or agent_id required' });

        const { data, error } = await supabase
          .from('conversations')
          .select('id, title, venture_id, agent_id, agent_conversation_id, created_at, updated_at')
          .eq('agent_id', agentId)
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
          .limit(limit);
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ conversations: data ?? [] });
      }
      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'internal error' });
  }
}
