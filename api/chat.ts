import Anthropic from '@anthropic-ai/sdk';
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


const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res); if (!userId) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, systemPrompt, stream, tools } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  // Build params shared between streaming and non-streaming
  const params: Anthropic.MessageCreateParams = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
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
