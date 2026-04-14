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
  const action = req.body?.action || req.query.action;

  try {
    switch (action) {

      // ── list agents with optional filters ──────────────────────────
      case 'list': {
        const p = { ...req.query, ...req.body };
        let query = supabase
          .from('naos_agents')
          .select('*, naos_personality(*), naos_emotional_state(*)');

        if (p.tier) query = query.eq('tier', p.tier);
        if (p.venture) query = query.eq('venture_id', p.venture);
        if (p.status) query = query.eq('status', p.status);

        query = query.order('created_at', { ascending: false });
        const limit = parseInt(String(p.limit || '50'));
        query = query.limit(limit);

        const { data, error } = await query;
        if (error) throw error;
        return res.json({ agents: data });
      }

      // ── get single agent by id ────────────────────────────────────
      case 'get': {
        const id = req.body?.id || req.query.id;
        if (!id) return res.status(400).json({ error: 'id required' });

        const { data, error } = await supabase
          .from('naos_agents')
          .select('*, naos_personality(*), naos_emotional_state(*), naos_relationships(*)')
          .eq('id', id)
          .single();
        if (error) throw error;
        return res.json({ agent: data });
      }

      // ── create agent (3 inserts: agent + personality + emotional_state) ──
      case 'create': {
        const {
          agent_id, full_name, short_name, tier, venture_id, role, archetype,
          avatar_url, status, personality, emotional_state,
        } = req.body;

        if (!agent_id || !full_name || !tier) {
          return res.status(400).json({ error: 'agent_id, full_name, and tier required' });
        }

        // 1. Insert agent
        const { data: agentData, error: agentErr } = await supabase
          .from('naos_agents')
          .insert({
            agent_id,
            full_name,
            short_name: short_name || full_name,
            tier,
            venture_id: venture_id || null,
            role: role || null,
            archetype: archetype || null,
            avatar_url: avatar_url || null,
            status: status || 'active',
            created_by: userId,
          })
          .select()
          .single();
        if (agentErr) throw agentErr;

        const agentPk = agentData.id;

        // 2. Insert personality
        const { error: persErr } = await supabase
          .from('naos_personality')
          .insert({
            agent_id: agentPk,
            warmth: personality?.warmth ?? 0.5,
            assertiveness: personality?.assertiveness ?? 0.5,
            analytical: personality?.analytical ?? 0.5,
            creativity: personality?.creativity ?? 0.5,
            humor: personality?.humor ?? 0.3,
            formality: personality?.formality ?? 0.5,
            empathy: personality?.empathy ?? 0.5,
            directness: personality?.directness ?? 0.5,
          });
        if (persErr) throw persErr;

        // 3. Insert emotional state
        const { error: emoErr } = await supabase
          .from('naos_emotional_state')
          .insert({
            agent_id: agentPk,
            valence: emotional_state?.valence ?? 0.6,
            arousal: emotional_state?.arousal ?? 0.5,
            dominance: emotional_state?.dominance ?? 0.5,
            current_mood: emotional_state?.current_mood ?? 'neutral',
          });
        if (emoErr) throw emoErr;

        return res.json({ agent: agentData });
      }

      // ── update agent fields ───────────────────────────────────────
      case 'update': {
        const { id, ...fields } = req.body;
        if (!id) return res.status(400).json({ error: 'id required' });

        // Only allow safe fields
        const allowed = ['status', 'milestone', 'achievements', 'interaction_count', 'full_name'];
        const patch: Record<string, unknown> = {};
        for (const key of allowed) {
          if (fields[key] !== undefined) patch[key] = fields[key];
        }
        if (Object.keys(patch).length === 0) {
          return res.status(400).json({ error: 'No valid fields to update' });
        }

        patch.updated_at = new Date().toISOString();

        const { data, error } = await supabase
          .from('naos_agents')
          .update(patch)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return res.json({ agent: data });
      }

      // ── update personality matrix ─────────────────────────────────
      case 'update-personality': {
        const { agent_id, ...traits } = req.body;
        if (!agent_id) return res.status(400).json({ error: 'agent_id required' });

        const allowed = ['warmth', 'assertiveness', 'analytical', 'creativity', 'humor', 'formality', 'empathy', 'directness'];
        const patch: Record<string, unknown> = {};
        for (const key of allowed) {
          if (traits[key] !== undefined) patch[key] = traits[key];
        }
        if (Object.keys(patch).length === 0) {
          return res.status(400).json({ error: 'No valid personality traits to update' });
        }

        patch.updated_at = new Date().toISOString();

        const { data, error } = await supabase
          .from('naos_personality')
          .update(patch)
          .eq('agent_id', agent_id)
          .select()
          .single();
        if (error) throw error;
        return res.json({ personality: data });
      }

      // ── update emotional state ────────────────────────────────────
      case 'update-emotional': {
        const { agent_id, ...state } = req.body;
        if (!agent_id) return res.status(400).json({ error: 'agent_id required' });

        const allowed = ['valence', 'arousal', 'dominance', 'current_mood'];
        const patch: Record<string, unknown> = {};
        for (const key of allowed) {
          if (state[key] !== undefined) patch[key] = state[key];
        }
        if (Object.keys(patch).length === 0) {
          return res.status(400).json({ error: 'No valid emotional state fields to update' });
        }

        patch.updated_at = new Date().toISOString();

        const { data, error } = await supabase
          .from('naos_emotional_state')
          .update(patch)
          .eq('agent_id', agent_id)
          .select()
          .single();
        if (error) throw error;
        return res.json({ emotional_state: data });
      }

      // ── list relationships for an agent ───────────────────────────
      case 'relationships': {
        const agentId = req.body?.agent_id || req.query.agent_id;
        if (!agentId) return res.status(400).json({ error: 'agent_id required' });

        const { data, error } = await supabase
          .from('naos_relationships')
          .select('*')
          .or(`agent_a.eq.${agentId},agent_b.eq.${agentId}`)
          .order('updated_at', { ascending: false });
        if (error) throw error;
        return res.json({ relationships: data });
      }

      // ── list predictions for an agent ─────────────────────────────
      case 'predictions': {
        const agentId = req.body?.agent_id || req.query.agent_id;
        if (!agentId) return res.status(400).json({ error: 'agent_id required' });

        const limit = parseInt(String(req.body?.limit || req.query.limit || '20'));
        const { data, error } = await supabase
          .from('naos_predictions')
          .select('*')
          .eq('agent_id', agentId)
          .order('created_at', { ascending: false })
          .limit(limit);
        if (error) throw error;
        return res.json({ predictions: data });
      }

      // ── log an interaction ────────────────────────────────────────
      case 'log-interaction': {
        const { agent_id, user_id, interaction_type, content, sentiment, context } = req.body;
        if (!agent_id) return res.status(400).json({ error: 'agent_id required' });

        const { data, error } = await supabase
          .from('naos_interactions')
          .insert({
            agent_id,
            user_id: user_id || userId,
            interaction_type: interaction_type || 'chat',
            content: content || null,
            sentiment: sentiment ?? null,
            context: context || {},
          })
          .select()
          .single();
        if (error) throw error;

        // Bump interaction_count on the agent
        await supabase.rpc('increment_field', {
          table_name: 'naos_agents',
          field_name: 'interaction_count',
          row_id: agent_id,
        }).catch(() => {
          // Fallback: manual increment if RPC doesn't exist
          return supabase
            .from('naos_agents')
            .select('interaction_count')
            .eq('id', agent_id)
            .single()
            .then(({ data: agentRow }) => {
              if (agentRow) {
                return supabase
                  .from('naos_agents')
                  .update({ interaction_count: (agentRow.interaction_count || 0) + 1 })
                  .eq('id', agent_id);
              }
            });
        });

        return res.json({ interaction: data });
      }

      // ── culture snapshot ──────────────────────────────────────────
      case 'culture': {
        const ventureId = req.body?.venture_id || req.query.venture_id;

        let query = supabase
          .from('naos_culture_snapshot')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1);

        if (ventureId) query = query.eq('venture_id', ventureId);

        const { data, error } = await query;
        if (error) throw error;

        const snapshot = data?.[0] || null;

        // Check staleness (older than 24h)
        if (snapshot) {
          const age = Date.now() - new Date(snapshot.created_at).getTime();
          const stale = age > 24 * 60 * 60 * 1000;
          return res.json({ snapshot, stale });
        }

        return res.json({ snapshot: null, stale: true });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : (error && typeof error === 'object' && 'message' in error ? String((error as { message: unknown }).message) : JSON.stringify(error)) });
  }
}
