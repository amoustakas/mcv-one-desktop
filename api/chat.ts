import Anthropic from '@anthropic-ai/sdk';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServiceClient } from './_supabase.js';

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

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Fire-and-forget: record a NAOS interaction after a successful chat turn.
// Idempotent-ish (duplicates are fine since they represent distinct turns).
async function logNaosInteraction(opts: {
  agentCodename: string;
  userId: string;
  ventureId?: string;
  userMessage: string;
  assistantResponse: string;
}) {
  try {
    const supabase = getServiceClient();
    const { data: agent } = await supabase
      .from('naos_agents')
      .select('id, interaction_count')
      .eq('codename', opts.agentCodename)
      .single();
    if (!agent) return;

    await supabase.from('naos_interactions').insert({
      agent_id: agent.id,
      user_id: opts.userId,
      venture_id: opts.ventureId ?? null,
      interaction_type: 'chat',
      context: { user_message_preview: opts.userMessage.slice(0, 400) },
      outcome: opts.assistantResponse.slice(0, 400),
    });

    await supabase
      .from('naos_agents')
      .update({ interaction_count: (agent.interaction_count || 0) + 1 })
      .eq('id', agent.id);

    // Gentle emotional nudge: +2 engagement, -1 frustration per positive turn.
    // Clamp 0..100. Upsert so missing rows get created.
    const { data: current } = await supabase
      .from('naos_emotional_state')
      .select('engagement, frustration, momentum')
      .eq('agent_id', agent.id)
      .maybeSingle();
    const engagement = Math.min(100, (current?.engagement ?? 50) + 2);
    const frustration = Math.max(0, (current?.frustration ?? 10) - 1);
    const momentum = Math.min(100, (current?.momentum ?? 50) + 1);
    await supabase
      .from('naos_emotional_state')
      .upsert({ agent_id: agent.id, engagement, frustration, momentum }, { onConflict: 'agent_id' });
  } catch (err) {
    // Never break the chat response on NAOS side-effects.
    // eslint-disable-next-line no-console
    console.error('[logNaosInteraction]', err instanceof Error ? err.message : err);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res); if (!userId) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, systemPrompt, stream, tools, model, max_tokens, naos } = req.body as {
    messages: Array<{ role: string; content: unknown }>;
    systemPrompt?: string;
    stream?: boolean;
    tools?: unknown[];
    model?: string;
    max_tokens?: number;
    naos?: { agent_codename?: string; venture_id?: string };
  };

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  // Build params shared between streaming and non-streaming
  const params: Anthropic.MessageCreateParams = {
    model: model || 'claude-sonnet-4-20250514',
    max_tokens: max_tokens || 4096,
    system: systemPrompt || 'You are a helpful assistant.',
    messages: messages.map((m: { role: string; content: unknown }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  };

  // Add tools if provided (Kit system tool-calling)
  if (tools && Array.isArray(tools) && tools.length > 0) {
    params.tools = tools;
  }

  try {
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const response = client.messages.stream(params);

      // Track current content block for tool_use events
      let currentBlock: { type: string; id?: string; name?: string; input?: unknown } | null = null;

      response.on('contentBlockStart', (event) => {
        const block = event.content_block;
        if (block.type === 'tool_use') {
          currentBlock = { type: 'tool_use', id: block.id, name: block.name, input: {} };
        } else {
          currentBlock = { type: 'text' };
        }
      });

      response.on('text', (text) => {
        res.write(`data: ${JSON.stringify({ type: 'text', text })}\n\n`);
      });

      response.on('inputJson', (_delta, snapshot) => {
        // snapshot is already a parsed object from the SDK
        if (currentBlock?.type === 'tool_use') {
          currentBlock.input = snapshot;
        }
      });

      response.on('contentBlockStop', () => {
        if (currentBlock?.type === 'tool_use') {
          res.write(`data: ${JSON.stringify({
            type: 'tool_use',
            id: currentBlock.id,
            name: currentBlock.name,
            input: currentBlock.input ?? {},
          })}\n\n`);
        }
        currentBlock = null;
      });

      response.on('end', () => {
        // Send stop reason so client knows if it needs to handle tool results
        const stopReason = response.currentMessage()?.stop_reason ?? 'end_turn';
        res.write(`data: ${JSON.stringify({ type: 'message_end', stop_reason: stopReason })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
        // Fire-and-forget NAOS interaction log (streaming path)
        if (naos?.agent_codename) {
          const lastUser = [...messages].reverse().find(m => m.role === 'user');
          const userText = typeof lastUser?.content === 'string' ? lastUser.content : JSON.stringify(lastUser?.content || '');
          const finalText = response.currentMessage()?.content
            ?.filter((b): b is { type: 'text'; text: string } => b.type === 'text')
            .map(b => b.text).join('') || '';
          void logNaosInteraction({
            agentCodename: naos.agent_codename,
            userId: userId || 'unknown',
            ventureId: naos.venture_id,
            userMessage: userText,
            assistantResponse: finalText,
          });
        }
      });

      response.on('error', (error) => {
        res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
        res.end();
      });
    } else {
      const response = await client.messages.create(params);

      // Check if response contains tool_use blocks
      const toolUseBlocks = response.content.filter((b) => b.type === 'tool_use');
      const textBlocks = response.content.filter((b) => b.type === 'text');
      const text = textBlocks.map((b) => b.type === 'text' ? b.text : '').join('');

      // Fire-and-forget NAOS interaction log (non-streaming path)
      if (naos?.agent_codename) {
        const lastUser = [...messages].reverse().find(m => m.role === 'user');
        const userText = typeof lastUser?.content === 'string' ? lastUser.content : JSON.stringify(lastUser?.content || '');
        void logNaosInteraction({
          agentCodename: naos.agent_codename,
          userId: userId || 'unknown',
          ventureId: naos.venture_id,
          userMessage: userText,
          assistantResponse: text,
        });
      }

      if (toolUseBlocks.length > 0) {
        return res.status(200).json({
          content: text,
          stop_reason: response.stop_reason,
          tool_calls: toolUseBlocks.map((b) => ({
            id: b.type === 'tool_use' ? b.id : '',
            name: b.type === 'tool_use' ? b.name : '',
            input: b.type === 'tool_use' ? b.input : {},
          })),
        });
      }

      return res.status(200).json({ content: text });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
