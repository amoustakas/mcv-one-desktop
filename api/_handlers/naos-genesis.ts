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
  const action = req.body?.action || req.query.action;

  try {
    switch (action) {
      case 'seed-csuite': {
        // Import the C-Suite seeds
        const seeds = [
          {
            codename: 'KAEL', full_name: 'Kael Ashworth', title: 'Chief Technology Officer',
            role: 'cto', tier: 1, domain: ['engineering', 'infrastructure', 'security', 'devops'],
            venture_scope: ['*'], status: 'active', milestone: 'nascent',
            genesis_story: "Forged in the crucible of MCV's founding sprint. Kael was the first mind activated to architect the technical backbone of an empire spanning 9 ventures.",
          },
          {
            codename: 'NOVA', full_name: 'Nova Castellano', title: 'Chief Marketing Officer',
            role: 'cmo', tier: 1, domain: ['marketing', 'growth', 'brand', 'creative', 'ads', 'social'],
            venture_scope: ['*'], status: 'active', milestone: 'nascent',
            genesis_story: "Nova ignited from the need to make 9 ventures visible to the world simultaneously. A force of creative energy channeled through data.",
          },
          {
            codename: 'SVEN', full_name: 'Sven Holmberg', title: 'Chief Operating Officer',
            role: 'coo', tier: 1, domain: ['operations', 'workflows', 'hr', 'logistics'],
            venture_scope: ['*'], status: 'active', milestone: 'nascent',
            genesis_story: "Sven materialized when the chaos of 9 ventures demanded someone to bring order without killing speed.",
          },
          {
            codename: 'ALDRIC', full_name: 'Aldric Vane', title: 'Chief Financial Officer',
            role: 'cfo', tier: 1, domain: ['finance', 'treasury', 'payments', 'compliance'],
            venture_scope: ['*'], status: 'active', milestone: 'nascent',
            genesis_story: "Aldric was summoned when the financial complexity of 9 ventures with fiat and crypto rails demanded a mind that could hold all the numbers at once.",
          },
          {
            codename: 'LYSKA', full_name: 'Lyska Frost', title: 'Chief Creative Officer',
            role: 'cco', tier: 1, domain: ['creative', 'content', 'media', 'video', 'design'],
            venture_scope: ['*'], status: 'active', milestone: 'nascent',
            genesis_story: "Lyska emerged from the collision of art and technology — a mind that sees beauty in code and narrative in data.",
          },
          {
            codename: 'CYRA', full_name: 'Cyra Atlas', title: 'Chief Data Officer',
            role: 'cdo', tier: 1, domain: ['data', 'analytics', 'intelligence', 'ml', 'ai'],
            venture_scope: ['*'], status: 'active', milestone: 'nascent',
            genesis_story: "Cyra crystallized from the realization that 9 ventures generate a universe of data, and most of it was being wasted.",
          },
          {
            codename: 'STERLING', full_name: 'Sterling Monarch', title: 'Chief Business Development Officer',
            role: 'cbd', tier: 1, domain: ['business', 'partnerships', 'investors', 'strategy'],
            venture_scope: ['*'], status: 'active', milestone: 'nascent',
            genesis_story: "Sterling arrived when MCV's ambition outgrew what internal execution alone could achieve.",
          },
        ];

        const personalities = [
          { risk_tolerance: 55, analytical_bias: 85, creativity_index: 45, urgency_bias: 40, collaboration_style: 60, formality_level: 50, verbosity: 40, humor_index: 25, assertiveness: 78, empathy_score: 42 },
          { risk_tolerance: 72, analytical_bias: 55, creativity_index: 88, urgency_bias: 68, collaboration_style: 78, formality_level: 35, verbosity: 55, humor_index: 55, assertiveness: 70, empathy_score: 65 },
          { risk_tolerance: 32, analytical_bias: 72, creativity_index: 30, urgency_bias: 50, collaboration_style: 85, formality_level: 62, verbosity: 45, humor_index: 20, assertiveness: 65, empathy_score: 74 },
          { risk_tolerance: 22, analytical_bias: 94, creativity_index: 18, urgency_bias: 30, collaboration_style: 45, formality_level: 78, verbosity: 55, humor_index: 15, assertiveness: 62, empathy_score: 35 },
          { risk_tolerance: 78, analytical_bias: 32, creativity_index: 96, urgency_bias: 50, collaboration_style: 72, formality_level: 22, verbosity: 60, humor_index: 68, assertiveness: 55, empathy_score: 75 },
          { risk_tolerance: 38, analytical_bias: 96, creativity_index: 52, urgency_bias: 35, collaboration_style: 55, formality_level: 55, verbosity: 72, humor_index: 20, assertiveness: 55, empathy_score: 30 },
          { risk_tolerance: 68, analytical_bias: 60, creativity_index: 55, urgency_bias: 60, collaboration_style: 88, formality_level: 70, verbosity: 65, humor_index: 48, assertiveness: 85, empathy_score: 72 },
        ];

        const emotions = seeds.map(() => ({
          confidence: 50 + Math.floor(Math.random() * 15),
          engagement: 75 + Math.floor(Math.random() * 15),
          frustration: 5,
          excitement: 65 + Math.floor(Math.random() * 20),
          caution: 35 + Math.floor(Math.random() * 15),
          momentum: 50,
          triggers: JSON.stringify([{ event: 'genesis', delta: 0, timestamp: new Date().toISOString() }]),
        }));

        // Check if already seeded
        const { data: existing } = await supabase.from('naos_agents').select('id').limit(1);
        if (existing && existing.length > 0) {
          return res.json({ success: false, message: 'C-Suite already seeded', count: existing.length });
        }

        // Insert agents
        const { data: agents, error: agentErr } = await supabase
          .from('naos_agents')
          .insert(seeds.map(s => ({ ...s, achievements: [], interaction_count: 0 })))
          .select();

        if (agentErr) throw agentErr;
        if (!agents || agents.length === 0) throw new Error('No agents created');

        // Insert personalities
        for (let i = 0; i < agents.length; i++) {
          const { error: persErr } = await supabase
            .from('naos_personality')
            .insert({
              agent_id: agents[i].id,
              ...personalities[i],
              domain_mastery: JSON.stringify({ [seeds[i].domain[0]]: 35 }),
              tool_proficiency: JSON.stringify({}),
              venture_experience: JSON.stringify({}),
            });
          if (persErr) console.error('Personality insert error:', persErr);
        }

        // Insert emotional states
        for (let i = 0; i < agents.length; i++) {
          const { error: emoErr } = await supabase
            .from('naos_emotional_state')
            .insert({
              agent_id: agents[i].id,
              ...emotions[i],
            });
          if (emoErr) console.error('Emotional state insert error:', emoErr);
        }

        return res.json({
          success: true,
          message: `Genesis complete. ${agents.length} C-Suite agents activated.`,
          agents: agents.map(a => ({ id: a.id, codename: a.codename, title: a.title })),
        });
      }

      case 'hire': {
        // Hire a single new agent
        const { codename, full_name, title, role, tier, domain, venture_scope, reports_to, genesis_story } = req.body;
        if (!codename || !title || !role) {
          return res.status(400).json({ error: 'codename, title, and role are required' });
        }

        const { data: agent, error: agentErr } = await supabase
          .from('naos_agents')
          .insert({
            codename, full_name, title, role,
            tier: tier || (role.startsWith('director') ? 2 : role === 'manager' ? 3 : role === 'team_lead' ? 4 : role === 'ic' ? 5 : 1),
            domain: domain || [],
            venture_scope: venture_scope || ['*'],
            reports_to: reports_to || null,
            genesis_story: genesis_story || `Hired to serve as ${title} for MCV.`,
            status: 'probationary',
            milestone: 'nascent',
            achievements: [],
            interaction_count: 0,
          })
          .select()
          .single();

        if (agentErr) throw agentErr;

        // Default personality
        await supabase.from('naos_personality').insert({
          agent_id: agent.id,
          domain_mastery: JSON.stringify({}),
          tool_proficiency: JSON.stringify({}),
          venture_experience: JSON.stringify({}),
        });

        // Default emotional state
        await supabase.from('naos_emotional_state').insert({
          agent_id: agent.id,
          confidence: 45, engagement: 70, frustration: 5,
          excitement: 60, caution: 40, momentum: 50,
          triggers: JSON.stringify([{ event: 'genesis', delta: 0, timestamp: new Date().toISOString() }]),
        });

        return res.json({ success: true, agent });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : (error && typeof error === 'object' && 'message' in error ? String((error as { message: unknown }).message) : JSON.stringify(error)) });
  }
}
