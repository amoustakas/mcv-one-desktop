// Wizard chat handler — wires the AgentChatColumn into Session B's
// chat-routing infrastructure. One conversation per journey; the responding
// agent voice flips automatically when journey.agent_id is updated by the
// agent_assignment step (Atlas → specialist handoff).
//
// Actions:
//   start  — ensure a conversation exists for the journey, return id + agent
//            context (system prompt, name, accent). Idempotent — returns the
//            existing conversation if one was already created for this journey.
//   send   — append user msg, call Claude with the CURRENT journey owner's
//            system prompt, append assistant msg, return assistant text.
//            Records messages.agent_id so the per-message author is queryable.
//   list   — return conversation messages in order, joined with the agent
//            persona of each message so the UI can render avatars/colors.
//
// Lazy Supabase + Anthropic accessors — never run at module load so Next.js
// page-data collection succeeds without env vars.

import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import Anthropic from '@anthropic-ai/sdk';

const supabase = () => getServiceSupabase();

let _anthropic: Anthropic | null = null;
function anthropic(): Anthropic {
  if (_anthropic) return _anthropic;
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');
  _anthropic = new Anthropic({ apiKey });
  return _anthropic;
}

const DEFAULT_MODEL = 'claude-sonnet-4-5-20250929';
const MAX_TOKENS = 1024;

// ───────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────

interface JourneyRow {
  id: string;
  prospect_id: string;
  track: string;
  status: string;
  current_step_index: number;
  steps: string[];
  agent_id: string | null;
  metadata: Record<string, unknown> & { chat_conversation_id?: string; venture_id?: string | null };
}

interface AgentRow {
  id: string;
  handle: string;
  full_name: string;
  title: string;
  accent_color: string | null;
  avatar_url: string | null;
  persona_bio: string | null;
  system_prompt: string | null;
}

async function loadJourney(journeyId: string): Promise<JourneyRow | null> {
  const { data, error } = await supabase()
    .from('prospect_journey')
    .select('*')
    .eq('id', journeyId)
    .maybeSingle();
  if (error) throw error;
  return (data as JourneyRow) ?? null;
}

async function loadAgent(agentId: string | null): Promise<AgentRow | null> {
  if (!agentId) return null;
  const { data, error } = await supabase()
    .from('agent_persona')
    .select('id, handle, full_name, title, accent_color, avatar_url, persona_bio, system_prompt')
    .eq('id', agentId)
    .maybeSingle();
  if (error) throw error;
  return (data as AgentRow) ?? null;
}

async function loadAgentByHandle(handle: string): Promise<AgentRow | null> {
  const { data, error } = await supabase()
    .from('agent_persona')
    .select('id, handle, full_name, title, accent_color, avatar_url, persona_bio, system_prompt')
    .eq('handle', handle)
    .maybeSingle();
  if (error) throw error;
  return (data as AgentRow) ?? null;
}

function systemPromptFor(agent: AgentRow, journeyContext: { track: string; venture_id: string | null }): string {
  const base = (agent.system_prompt && agent.system_prompt.trim())
    || agent.persona_bio
    || `You are ${agent.full_name}, ${agent.title}, working with a prospect during onboarding.`;
  const ventureLine = journeyContext.venture_id
    ? `\n\nThe prospect is engaging with the ${journeyContext.venture_id} venture.`
    : '';
  const trackLine = `\n\nYou are running the "${journeyContext.track}" onboarding track. Keep responses warm, specific, and short — two to four sentences. Speak as yourself, in first person. Never break character or refer to yourself as an AI; you are the named human professional.`;
  return base + ventureLine + trackLine;
}

// ───────────────────────────────────────────────────────────────────────────
// Handler
// ───────────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try { body = (await req.json()) as Record<string, unknown>; }
  catch { return NextResponse.json({ error: 'invalid body' }, { status: 400 }); }

  const action = body.action as string;
  if (!action) return NextResponse.json({ error: 'action required' }, { status: 400 });

  try {
    switch (action) {
      // ─── start: ensure conversation exists for this journey ──────────
      case 'start': {
        const journeyId = body.journey_id as string;
        if (!journeyId) return NextResponse.json({ error: 'journey_id required' }, { status: 400 });

        const journey = await loadJourney(journeyId);
        if (!journey) return NextResponse.json({ error: 'journey not found' }, { status: 404 });

        // Resume if a conversation already exists for this journey.
        const existingId = journey.metadata?.chat_conversation_id;
        if (existingId) {
          const agent = await loadAgent(journey.agent_id);
          return NextResponse.json({
            conversation_id: existingId,
            journey_id: journeyId,
            agent: agent && agentHandle(agent),
          });
        }

        // Pick the opening agent: the journey's current owner (Atlas pre-handoff,
        // specialist post-handoff). Falls back to @atlas if journey.agent_id is null.
        const owner = (await loadAgent(journey.agent_id)) ?? (await loadAgentByHandle('@atlas'));
        if (!owner) return NextResponse.json({ error: 'no agent configured' }, { status: 500 });

        const ventureId = (journey.metadata?.venture_id as string | null) ?? null;

        // Create the conversation row, agent-scoped.
        const { data: conv, error: convErr } = await supabase()
          .from('conversations')
          .insert({
            venture_id: ventureId ?? 'mcv',
            title: `Onboarding · ${journey.track}`,
            agent_id: owner.id,
            user_id: `prospect:${journey.prospect_id}`,
          })
          .select('id')
          .single();
        if (convErr) throw convErr;

        // Persist the conversation id back onto the journey so refreshes resume.
        await supabase()
          .from('prospect_journey')
          .update({
            metadata: { ...journey.metadata, chat_conversation_id: conv.id },
          })
          .eq('id', journeyId);

        // Drop a system message that anchors the thread to its agent.
        await supabase().from('messages').insert({
          conversation_id: conv.id,
          role: 'system',
          content: `Conversation opened with ${owner.full_name} (${owner.handle}) for the ${journey.track} onboarding track.`,
          agent_id: owner.id,
          metadata: { kind: 'system_open', journey_id: journeyId },
        });

        return NextResponse.json({
          conversation_id: conv.id,
          journey_id: journeyId,
          agent: agentHandle(owner),
        });
      }

      // ─── send: user message → assistant response ─────────────────────
      case 'send': {
        const journeyId = body.journey_id as string;
        const conversationId = body.conversation_id as string;
        const userText = ((body.text as string) || '').trim();
        if (!journeyId || !conversationId || !userText) {
          return NextResponse.json({ error: 'journey_id + conversation_id + text required' }, { status: 400 });
        }

        const journey = await loadJourney(journeyId);
        if (!journey) return NextResponse.json({ error: 'journey not found' }, { status: 404 });

        // Always look up the CURRENT agent — handoff during the journey
        // automatically flips who responds.
        const owner = (await loadAgent(journey.agent_id)) ?? (await loadAgentByHandle('@atlas'));
        if (!owner) return NextResponse.json({ error: 'no agent configured' }, { status: 500 });

        const ventureId = (journey.metadata?.venture_id as string | null) ?? null;

        // 1) Append user message.
        const { data: userMsg, error: userErr } = await supabase()
          .from('messages')
          .insert({
            conversation_id: conversationId,
            role: 'user',
            content: userText,
            metadata: { journey_id: journeyId },
          })
          .select('id, created_at')
          .single();
        if (userErr) throw userErr;

        // 2) Build history for Claude — omit the anchoring 'system_open' note.
        const { data: history } = await supabase()
          .from('messages')
          .select('role, content')
          .eq('conversation_id', conversationId)
          .neq('role', 'system')
          .order('created_at', { ascending: true });

        const claudeMessages = (history ?? []).map((m: { role: string; content: string }) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })) as Array<{ role: 'user' | 'assistant'; content: string }>;

        const systemPrompt = systemPromptFor(owner, { track: journey.track, venture_id: ventureId });

        // 3) Call Claude.
        let assistantText = '';
        try {
          const completion = await anthropic().messages.create({
            model: DEFAULT_MODEL,
            max_tokens: MAX_TOKENS,
            system: systemPrompt,
            messages: claudeMessages,
          });
          const block = completion.content.find((b) => b.type === 'text');
          assistantText = block && 'text' in block ? block.text : '';
        } catch (err) {
          // Failure path — drop a polite agent line so the UI never strands.
          const msg = err instanceof Error ? err.message : String(err);
          assistantText = `Sorry — I lost the connection on my end. Try again in a moment? (${msg})`;
          console.warn('[chat] anthropic failed:', msg);
        }

        // 4) Append assistant message scoped to the agent who authored it.
        const { data: assistantMsg, error: asstErr } = await supabase()
          .from('messages')
          .insert({
            conversation_id: conversationId,
            role: 'assistant',
            content: assistantText,
            agent_id: owner.id,
            metadata: { journey_id: journeyId, model: DEFAULT_MODEL },
          })
          .select('id, created_at')
          .single();
        if (asstErr) throw asstErr;

        // 5) Audit trail — chat_turn lands in agent_activity_log, joining the
        //    journey to the agent's activity history.
        try {
          await supabase().from('agent_activity_log').insert({
            agent_id: owner.id,
            session_id: journeyId,
            action_kind: 'chat_turn',
            tool_name: 'onboarding_chat',
            input: { user_text: userText, conversation_id: conversationId },
            output: { assistant_text: assistantText.slice(0, 500) },
            venture_id: ventureId,
          });
        } catch { /* best-effort */ }

        return NextResponse.json({
          user_message: { id: userMsg.id, role: 'user', content: userText, created_at: userMsg.created_at },
          assistant_message: {
            id: assistantMsg.id,
            role: 'assistant',
            content: assistantText,
            created_at: assistantMsg.created_at,
            agent: agentHandle(owner),
          },
        });
      }

      // ─── list: conversation history ─────────────────────────────────
      case 'list': {
        const conversationId = body.conversation_id as string;
        if (!conversationId) return NextResponse.json({ error: 'conversation_id required' }, { status: 400 });

        const { data, error } = await supabase()
          .from('messages')
          .select(`
            id, role, content, created_at, metadata,
            agent:agent_id(id, handle, full_name, title, accent_color)
          `)
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });
        if (error) throw error;

        return NextResponse.json({ messages: data ?? [] });
      }

      default:
        return NextResponse.json({ error: `unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[chat] ${action} failed:`, msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// Slim agent shape returned to the client.
function agentHandle(a: AgentRow) {
  return {
    id: a.id,
    handle: a.handle,
    full_name: a.full_name,
    title: a.title,
    accent_color: a.accent_color,
    avatar_url: a.avatar_url,
  };
}
