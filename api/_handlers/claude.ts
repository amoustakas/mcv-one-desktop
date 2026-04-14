import { requireAuth } from './_auth.js';
import Anthropic from '@anthropic-ai/sdk';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ---------------------------------------------------------------------------
// Claude API — Full capabilities: chat, vision, PDF, batches, token counting,
// extended thinking, prompt caching, tool use, streaming, models
// ---------------------------------------------------------------------------

const API_KEY = process.env.ANTHROPIC_API_KEY || '';

function getClient() {
  if (!API_KEY) throw new Error('ANTHROPIC_API_KEY not configured');
  return new Anthropic({ apiKey: API_KEY });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const action = (req.method === 'GET' ? req.query.action : req.body?.action) as string;
  const client = getClient();

  try {
    switch (action) {
      // ── Chat Completion ──
      case 'chat': {
        const { messages, model = 'claude-sonnet-4-5-20250929', max_tokens = 4096, system, temperature, tools, tool_choice } = req.body;
        if (!messages) return res.status(400).json({ error: 'messages required' });
        const params: Record<string, unknown> = { model, max_tokens, messages };
        if (system) params.system = system;
        if (temperature !== undefined) params.temperature = temperature;
        if (tools) params.tools = tools;
        if (tool_choice) params.tool_choice = tool_choice;
        const message = await client.messages.create(params as Anthropic.MessageCreateParamsNonStreaming);
        return res.json({
          content: message.content,
          model: message.model,
          stop_reason: message.stop_reason,
          usage: message.usage,
          id: message.id,
        });
      }

      // ── Vision (Image Analysis) ──
      case 'vision': {
        const { imageUrl, imageBase64, mediaType = 'image/png', prompt = 'Describe this image in detail.', model = 'claude-sonnet-4-5-20250929' } = req.body;
        if (!imageUrl && !imageBase64) return res.status(400).json({ error: 'imageUrl or imageBase64 required' });
        const imageContent: Anthropic.ImageBlockParam = imageUrl
          ? { type: 'image', source: { type: 'url', url: imageUrl } }
          : { type: 'image', source: { type: 'base64', media_type: mediaType as 'image/png', data: imageBase64 } };
        const message = await client.messages.create({
          model, max_tokens: 4096,
          messages: [{ role: 'user', content: [imageContent, { type: 'text', text: prompt }] }],
        });
        return res.json({ content: message.content, usage: message.usage });
      }

      // ── PDF Document Analysis ──
      case 'pdf': {
        const { pdfUrl, pdfBase64, prompt = 'Analyze this document.', model = 'claude-sonnet-4-5-20250929' } = req.body;
        if (!pdfUrl && !pdfBase64) return res.status(400).json({ error: 'pdfUrl or pdfBase64 required' });
        const docContent: Anthropic.DocumentBlockParam = pdfUrl
          ? { type: 'document', source: { type: 'url', url: pdfUrl } }
          : { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 } };
        const message = await client.messages.create({
          model, max_tokens: 8192,
          messages: [{ role: 'user', content: [docContent, { type: 'text', text: prompt }] }],
        });
        return res.json({ content: message.content, usage: message.usage });
      }

      // ── Extended Thinking ──
      case 'think': {
        const { messages, model = 'claude-sonnet-4-5-20250929', budget_tokens = 10000, max_tokens = 16000 } = req.body;
        if (!messages) return res.status(400).json({ error: 'messages required' });
        const message = await client.messages.create({
          model, max_tokens,
          thinking: { type: 'enabled', budget_tokens },
          messages,
        } as Anthropic.MessageCreateParamsNonStreaming);
        // Separate thinking from response
        const thinking = message.content.filter((b) => b.type === 'thinking');
        const text = message.content.filter((b) => b.type === 'text');
        return res.json({
          thinking: thinking.map((b) => ('thinking' in b ? b.thinking : '')),
          response: text.map((b) => ('text' in b ? b.text : '')).join(''),
          usage: message.usage,
          model: message.model,
        });
      }

      // ── Prompt Caching ──
      case 'chat-cached': {
        const { messages, model = 'claude-sonnet-4-5-20250929', max_tokens = 4096, system } = req.body;
        if (!messages || !system) return res.status(400).json({ error: 'messages and system required for caching' });
        // Add cache_control to system prompt
        const systemWithCache = Array.isArray(system)
          ? system.map((s: Anthropic.TextBlockParam, i: number) =>
              i === system.length - 1 ? { ...s, cache_control: { type: 'ephemeral' } } : s)
          : [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }];
        const message = await client.messages.create({
          model, max_tokens, system: systemWithCache, messages,
        } as Anthropic.MessageCreateParamsNonStreaming);
        return res.json({
          content: message.content,
          usage: message.usage, // cache_creation_input_tokens + cache_read_input_tokens
          model: message.model,
        });
      }

      // ── Token Counting ──
      case 'count-tokens': {
        const { messages, model = 'claude-sonnet-4-5-20250929', system, tools } = req.body;
        if (!messages) return res.status(400).json({ error: 'messages required' });
        const params: Record<string, unknown> = { model, messages };
        if (system) params.system = system;
        if (tools) params.tools = tools;
        const count = await client.messages.countTokens(params as Anthropic.MessageCountTokensParams);
        return res.json({ input_tokens: count.input_tokens });
      }

      // ── Batch API ──
      case 'create-batch': {
        const { requests } = req.body;
        if (!requests || !Array.isArray(requests)) return res.status(400).json({ error: 'requests array required' });
        const batch = await client.messages.batches.create({ requests });
        return res.json({ id: batch.id, status: batch.processing_status, created: batch.created_at });
      }

      case 'get-batch': {
        const { batchId } = req.query;
        if (!batchId) return res.status(400).json({ error: 'batchId required' });
        const batch = await client.messages.batches.retrieve(batchId as string);
        return res.json({
          id: batch.id, status: batch.processing_status,
          counts: batch.request_counts, created: batch.created_at,
          ended: batch.ended_at,
        });
      }

      case 'list-batches': {
        const batches = await client.messages.batches.list({ limit: 20 });
        const list: unknown[] = [];
        for await (const b of batches) list.push({ id: b.id, status: b.processing_status, created: b.created_at });
        return res.json({ batches: list });
      }

      case 'batch-results': {
        const { batchId } = req.query;
        if (!batchId) return res.status(400).json({ error: 'batchId required' });
        const results = await client.messages.batches.results(batchId as string);
        const items: unknown[] = [];
        for await (const r of results) items.push({ custom_id: r.custom_id, type: r.result.type });
        return res.json({ results: items });
      }

      // ── Tool Use (standalone) ──
      case 'tool-use': {
        const { messages, tools, model = 'claude-sonnet-4-5-20250929', max_tokens = 4096, system } = req.body;
        if (!messages || !tools) return res.status(400).json({ error: 'messages and tools required' });
        const params: Record<string, unknown> = { model, max_tokens, messages, tools };
        if (system) params.system = system;
        const message = await client.messages.create(params as Anthropic.MessageCreateParamsNonStreaming);
        // Extract tool calls
        const toolCalls = message.content.filter((b) => b.type === 'tool_use');
        const textBlocks = message.content.filter((b) => b.type === 'text');
        return res.json({
          text: textBlocks.map((b) => ('text' in b ? b.text : '')).join(''),
          tool_calls: toolCalls.map((b) => ('id' in b ? { id: b.id, name: b.name, input: b.input } : null)).filter(Boolean),
          stop_reason: message.stop_reason,
          usage: message.usage,
        });
      }

      // ── Models ──
      case 'list-models': {
        // Anthropic doesn't have a models list endpoint — return known models
        return res.json({
          models: [
            { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', context: 200000, output: 32000 },
            { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5', context: 200000, output: 16000 },
            { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', context: 200000, output: 16000 },
            { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', context: 200000, output: 8192 },
          ],
        });
      }

      // ── Overview ──
      case 'overview': {
        // Quick test: send a minimal message to verify the API key works
        try {
          const test = await client.messages.create({
            model: 'claude-haiku-4-5-20251001', max_tokens: 10,
            messages: [{ role: 'user', content: 'ping' }],
          });
          return res.json({
            status: 'active',
            model_tested: test.model,
            input_tokens: test.usage.input_tokens,
            available_models: 4,
            capabilities: ['chat', 'vision', 'pdf', 'extended_thinking', 'tool_use', 'prompt_caching', 'batches', 'token_counting'],
          });
        } catch (err) {
          return res.json({ status: 'error', error: err instanceof Error ? err.message : 'API key invalid' });
        }
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : (err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : JSON.stringify(err)) });
  }
}
