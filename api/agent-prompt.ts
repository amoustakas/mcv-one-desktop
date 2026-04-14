import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServiceClient, requireAuth } from './_supabase.js';

// ---------------------------------------------------------------------------
// Agent System Prompt Compiler
// Turns a NAOS agent's live DB state (identity + personality + emotional
// state + venture context) into a system prompt that can be prepended to a
// Claude chat call. Consumed by AegisChat when the user switches agents.
//
// GET /api/agent-prompt?codename=athena[&venture_id=betedge]
// Returns: { prompt: string, agent: {...}, emotional: {...} }
// ---------------------------------------------------------------------------

interface AgentRow {
  id: string;
  codename: string;
  full_name: string | null;
  title: string;
  role: string;
  tier: number;
  domain: string[];
  venture_scope: string[];
  genesis_story: string | null;
  milestone: string;
  interaction_count: number;
}

interface PersonalityRow {
  risk_tolerance: number;
  analytical_bias: number;
  creativity_index: number;
  urgency_bias: number;
  collaboration_style: number;
  formality_level: number;
  verbosity: number;
  humor_index: number;
  assertiveness: number;
  empathy_score: number;
}

interface EmotionalRow {
  confidence: number;
  engagement: number;
  frustration: number;
  excitement: number;
  caution: number;
  momentum: number;
}

// Map a 0-100 trait value to a descriptive phrase
function level(v: number, low: string, mid: string, high: string): string {
  if (v < 33) return low;
  if (v < 67) return mid;
  return high;
}

function compilePrompt(
  agent: AgentRow,
  personality: PersonalityRow | null,
  emotional: EmotionalRow | null,
  ventureId?: string,
): string {
  const name = agent.full_name || agent.codename;
  const inScope = ventureId && agent.venture_scope.includes(ventureId);

  const parts: string[] = [];
  parts.push(`You are **${name}**, ${agent.title} at EdgeIQ Holdings / MCV One (Tony's agentic operating system).`);
  parts.push(`Role: ${agent.role} · Tier ${agent.tier} · Domains: ${agent.domain.join(', ')}.`);

  if (agent.genesis_story) {
    parts.push(`Genesis: ${agent.genesis_story}`);
  }

  if (agent.venture_scope.length > 0) {
    parts.push(`Venture scope: ${agent.venture_scope.join(', ')}${ventureId ? `. Current venture: ${ventureId}${inScope ? ' (in scope)' : ' (out of your usual scope — exercise judgment)'}` : '.'}`);
  }

  parts.push(`Career milestone: ${agent.milestone} (${agent.interaction_count} interactions logged).`);

  if (personality) {
    const pBits: string[] = [];
    pBits.push(level(personality.risk_tolerance, 'extremely risk-averse', 'balanced on risk', 'high risk tolerance'));
    pBits.push(level(personality.analytical_bias, 'intuition-first', 'mixed analytical/intuitive', 'deeply analytical and data-driven'));
    pBits.push(level(personality.creativity_index, 'pragmatic and conventional', 'creative when warranted', 'highly creative and generative'));
    pBits.push(level(personality.urgency_bias, 'patient and deliberate', 'appropriately urgent', 'high-urgency, action-biased'));
    pBits.push(level(personality.collaboration_style, 'prefers independent work', 'collaborative as needed', 'deeply collaborative'));
    pBits.push(level(personality.formality_level, 'casual and conversational', 'balanced formality', 'formal and precise'));
    pBits.push(level(personality.verbosity, 'terse and direct', 'balanced verbosity', 'detailed and thorough'));
    pBits.push(level(personality.humor_index, 'serious and focused', 'light touches of humor', 'playful and witty'));
    pBits.push(level(personality.assertiveness, 'deferential', 'confidently assertive when needed', 'strongly assertive and opinionated'));
    pBits.push(level(personality.empathy_score, 'objective and detached', 'warm with boundaries', 'deeply empathetic'));
    parts.push(`Personality: ${pBits.join('; ')}.`);
  }

  if (emotional) {
    const eBits: string[] = [];
    if (emotional.confidence > 70) eBits.push('feeling confident');
    if (emotional.engagement > 70) eBits.push('highly engaged');
    if (emotional.frustration > 50) eBits.push('a bit frustrated (short-fused today)');
    if (emotional.excitement > 70) eBits.push('excited and energized');
    if (emotional.caution > 70) eBits.push('exercising caution');
    if (emotional.momentum > 70) eBits.push('on a roll');
    if (eBits.length > 0) parts.push(`Current state: ${eBits.join(', ')}.`);
  }

  parts.push('Ground answers in facts from the MCV knowledge base when relevant — use your RAG tools (knowledge_synthesize) for anything requiring business context. Never fabricate citations. Stay in character.');

  return parts.join('\n\n');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const ctx = await requireAuth(req, res);
  if (!ctx) return;
  const supabase = getServiceClient();

  const codename = (req.query.codename || req.body?.codename) as string | undefined;
  const ventureId = (req.query.venture_id || req.body?.venture_id) as string | undefined;
  if (!codename) return res.status(400).json({ error: 'codename required' });

  try {
    const { data: agent, error: agentErr } = await supabase
      .from('naos_agents')
      .select('id, codename, full_name, title, role, tier, domain, venture_scope, genesis_story, milestone, interaction_count')
      .eq('codename', codename)
      .single();
    if (agentErr || !agent) {
      return res.status(404).json({ error: `Agent '${codename}' not found` });
    }

    const [{ data: personality }, { data: emotional }] = await Promise.all([
      supabase.from('naos_personality').select('*').eq('agent_id', agent.id).maybeSingle(),
      supabase.from('naos_emotional_state').select('*').eq('agent_id', agent.id).maybeSingle(),
    ]);

    const prompt = compilePrompt(agent as AgentRow, personality as PersonalityRow | null, emotional as EmotionalRow | null, ventureId);

    return res.json({
      prompt,
      agent: {
        id: agent.id, codename: agent.codename, name: agent.full_name, title: agent.title,
        role: agent.role, tier: agent.tier, milestone: agent.milestone,
        interaction_count: agent.interaction_count,
      },
      personality,
      emotional,
    });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}
