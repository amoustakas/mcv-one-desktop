import Anthropic from '@anthropic-ai/sdk';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getServiceClient } from './_supabase.js';
import { embedOne } from './_embeddings.js';
import { createServerIntelligence, type ChatRequest as IntelChatRequest } from '../../src/lib/mcv-core/intelligence.js';
import { createServerFabric } from '../../src/lib/mcv-core/fabric.js';

// Server-side Fabric publisher. Lazy singleton — null when FABRIC_URL unset.
const fabric = createServerFabric();

function publishChatAudit(opts: {
  type: 'chat.sent' | 'chat.completed' | 'chat.failed';
  userId: string;
  ventureId?: string;
  correlationId: string;
  meta?: Record<string, unknown>;
}): void {
  if (!fabric) return;
  void fabric
    .publish({
      topic: 'chat',
      payload: { type: opts.type, userId: opts.userId, ...opts.meta },
      traceId: opts.correlationId,
      ventureId: opts.ventureId,
    })
    .catch(() => {
      // audit must never break chat
    });
}

// Pre-fetch RAG context for the latest user message and return a block to
// prepend to the system prompt. Returns '' on any failure so chat never breaks.
async function buildRagContextBlock(opts: {
  query: string;
  ventureId?: string;
  topK?: number;
  threshold?: number;
}): Promise<string> {
  try {
    if (!opts.query || opts.query.trim().length < 4) return '';
    const supabase = getServiceClient();
    const queryEmbed = await embedOne(opts.query, 'RETRIEVAL_QUERY');
    const { data: matches, error } = await supabase.rpc('match_chunks', {
      query_embedding: queryEmbed,
      match_threshold: opts.threshold ?? 0.6,
      match_count: opts.topK ?? 4,
      filter_venture: opts.ventureId || null,
      filter_corpus: null,
    });
    if (error || !matches || matches.length === 0) return '';

    const fileIds = Array.from(new Set(matches.map((m: { file_id: string | null }) => m.file_id).filter(Boolean)));
    const { data: files } = fileIds.length
      ? await supabase.from('storage_files').select('id, name').in('id', fileIds as string[])
      : { data: [] };
    const fileMap = new Map((files || []).map(f => [f.id, f.name]));

    const lines = matches.map((m: { id: string; file_id: string | null; content: string; similarity: number; metadata: Record<string, unknown> }, i: number) => {
      const source = (m.file_id && fileMap.get(m.file_id)) || (m.metadata?.title as string) || (m.metadata?.source as string) || 'knowledge';
      return `[${i + 1}] (${source}, similarity ${m.similarity.toFixed(2)})\n${m.content.slice(0, 600)}`;
    });

    return `\n\n### RETRIEVED CONTEXT (MCV knowledge base)\nThe following chunks were pre-retrieved from the venture's docs/memory/files based on the user's latest message. Cite as [1], [2] etc when you use them. If they aren't relevant, ignore and rely on your knowledge.\n\n${lines.join('\n\n')}\n\n### END CONTEXT\n`;
  } catch {
    return '';
  }
}

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

  const { messages, systemPrompt, stream, tools, model, max_tokens, naos, preRag, useRag, ragCorpora } = req.body as {
    messages: Array<{ role: string; content: unknown }>;
    systemPrompt?: string;
    stream?: boolean;
    tools?: unknown[];
    model?: string;
    max_tokens?: number;
    naos?: { agent_codename?: string; venture_id?: string };
    preRag?: { enabled?: boolean; venture_id?: string; top_k?: number; threshold?: number };
    /** When true and Intelligence is routed, ask the gateway to fan corpora into RAG retrieval before generation. */
    useRag?: boolean;
    ragCorpora?: string[];
  };

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  // Correlate chat.sent → chat.completed across the streaming SSE flow.
  const correlationId = `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  publishChatAudit({
    type: 'chat.sent',
    userId,
    ventureId: naos?.venture_id,
    correlationId,
    meta: { agent: naos?.agent_codename, model: model || 'claude-sonnet-4-20250514', stream: !!stream },
  });

  // Optional: pre-fetch RAG context and prepend it to the system prompt so
  // Aegis has grounded facts without needing a separate tool-use round trip.
  let effectiveSystem = systemPrompt || 'You are a helpful assistant.';
  if (preRag?.enabled) {
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    const queryText = typeof lastUser?.content === 'string'
      ? lastUser.content
      : Array.isArray(lastUser?.content)
        ? lastUser.content.filter((b: { type?: string; text?: string }) => b.type === 'text').map((b: { text?: string }) => b.text || '').join(' ')
        : '';
    const contextBlock = await buildRagContextBlock({
      query: queryText,
      ventureId: preRag.venture_id || naos?.venture_id,
      topK: preRag.top_k ?? 4,
      threshold: preRag.threshold,
    });
    if (contextBlock) effectiveSystem += contextBlock;
  }

  // Build params shared between streaming and non-streaming
  const params: Anthropic.MessageCreateParams = {
    model: model || 'claude-sonnet-4-20250514',
    max_tokens: max_tokens || 4096,
    system: effectiveSystem,
    messages: messages.map((m: { role: string; content: unknown }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  };

  // Add tools if provided (Kit system tool-calling)
  if (tools && Array.isArray(tools) && tools.length > 0) {
    params.tools = tools;
  }

  // ── Triangle routing ────────────────────────────────────────────────
  // If INTELLIGENCE_URL is set, route through the gateway so cost tracking,
  // provider failover, and audit observability all happen centrally. Otherwise
  // fall through to the original direct Anthropic SDK path (graceful fallback).
  const intelligence = createServerIntelligence({ ventureId: naos?.venture_id });

  if (intelligence) {
    const intelReq: IntelChatRequest = {
      messages: messages
        .filter(m => m.role === 'user' || m.role === 'assistant' || m.role === 'system')
        .map(m => ({
          role: m.role as 'user' | 'assistant' | 'system',
          content: typeof m.content === 'string'
            ? m.content
            : Array.isArray(m.content)
              ? (m.content as Array<{ type?: string; text?: string }>)
                  .filter(b => b.type === 'text')
                  .map(b => b.text || '')
                  .join('')
              : String(m.content),
        })),
      provider: 'anthropic',
      model: model || 'claude-sonnet-4-20250514',
      maxTokens: max_tokens || 4096,
      ventureId: naos?.venture_id,
      tools: (tools as IntelChatRequest['tools']) || undefined,
      useRag: useRag || undefined,
      corpora: ragCorpora,
    };
    // Prepend RAG context to the system message position (Intelligence treats
    // the first 'system' role as the system prompt).
    intelReq.messages = [{ role: 'system', content: effectiveSystem }, ...intelReq.messages];

    try {
      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        const final = await intelligence.chatStream(intelReq, (chunk) => {
          res.write(`data: ${JSON.stringify({ type: 'text', text: chunk })}\n\n`);
        });
        for (const tc of final.toolCalls ?? []) {
          res.write(`data: ${JSON.stringify({ type: 'tool_use', id: tc.id, name: tc.name, input: tc.input })}\n\n`);
        }
        res.write(`data: ${JSON.stringify({ type: 'message_end', stop_reason: final.finishReason })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
        publishChatAudit({
          type: 'chat.completed',
          userId,
          ventureId: naos?.venture_id,
          correlationId,
          meta: {
            via: 'intelligence',
            provider: final.provider,
            model: final.model,
            inputTokens: final.usage.inputTokens,
            outputTokens: final.usage.outputTokens,
            costUsd: final.usage.costUsd,
            toolCalls: (final.toolCalls?.length ?? 0),
            finishReason: final.finishReason,
          },
        });
        if (naos?.agent_codename) {
          const lastUser = [...messages].reverse().find(m => m.role === 'user');
          const userText = typeof lastUser?.content === 'string' ? lastUser.content : JSON.stringify(lastUser?.content || '');
          void logNaosInteraction({
            agentCodename: naos.agent_codename,
            userId: userId || 'unknown',
            ventureId: naos.venture_id,
            userMessage: userText,
            assistantResponse: final.content,
          });
        }
        return;
      } else {
        const result = await intelligence.chat(intelReq);
        if (!result.ok) {
          // Triangle reachable but call failed — surface the error rather than silent fallback.
          return res.status(502).json({ error: `intelligence: ${result.error.message}` });
        }
        const final = result.data;
        if (naos?.agent_codename) {
          const lastUser = [...messages].reverse().find(m => m.role === 'user');
          const userText = typeof lastUser?.content === 'string' ? lastUser.content : JSON.stringify(lastUser?.content || '');
          void logNaosInteraction({
            agentCodename: naos.agent_codename,
            userId: userId || 'unknown',
            ventureId: naos.venture_id,
            userMessage: userText,
            assistantResponse: final.content,
          });
        }
        if ((final.toolCalls?.length ?? 0) > 0) {
          return res.status(200).json({
            content: final.content,
            stop_reason: final.finishReason,
            tool_calls: final.toolCalls,
          });
        }
        return res.status(200).json({ content: final.content });
      }
    } catch (err) {
      // Network-level failure on Intelligence — fall through to direct SDK so
      // chat keeps working. Log so the operator notices.
      // eslint-disable-next-line no-console
      console.warn('[chat] Intelligence stream failed, falling back to direct Anthropic SDK:', (err as Error).message);
      // fall through
    }
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
        publishChatAudit({
          type: 'chat.completed',
          userId,
          ventureId: naos?.venture_id,
          correlationId,
          meta: { via: 'direct-anthropic', model: params.model, finishReason: stopReason },
        });
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
        publishChatAudit({
          type: 'chat.failed',
          userId,
          ventureId: naos?.venture_id,
          correlationId,
          meta: { via: 'direct-anthropic', error: error.message },
        });
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
    const message = error instanceof Error ? error.message : (error && typeof error === 'object' && 'message' in error ? String((error as { message: unknown }).message) : JSON.stringify(error));
    return res.status(500).json({ error: message });
  }
}
