import type { KitToolSchema, ToolCallResult } from './kits/types';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string | unknown[];
}

// ---------------------------------------------------------------------------
// Original API (unchanged for backward compat)
// ---------------------------------------------------------------------------

export async function sendMessage(
  messages: ChatMessage[],
  systemPrompt: string,
): Promise<string> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, systemPrompt }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `API error: ${res.status}`);
  }

  const data = await res.json();
  return data.content;
}

export async function streamMessage(
  messages: ChatMessage[],
  systemPrompt: string,
  onChunk: (text: string) => void,
): Promise<string> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, systemPrompt, stream: true }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `API error: ${res.status}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let full = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          if (parsed.text) {
            full += parsed.text;
            onChunk(full);
          }
        } catch {
          // skip malformed chunks
        }
      }
    }
  }

  return full;
}

// ---------------------------------------------------------------------------
// Tool-Calling API (Kit system)
// ---------------------------------------------------------------------------

export interface ToolCallEvent {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface StreamWithToolsCallbacks {
  onText: (fullText: string) => void;
  onToolCall: (toolCall: ToolCallEvent) => void;
  onToolResult: (toolCallId: string, result: ToolCallResult) => void;
}

/**
 * Stream a message to Claude with tool-calling support.
 * Handles the multi-turn tool-use loop:
 *   send → tool_use → execute → tool_result → send again → final text
 *
 * @param toolExecutor Called when Claude requests a tool. Must return the result.
 * @param maxToolRounds Maximum number of tool-calling round trips (default 5).
 */
export async function streamMessageWithTools(
  messages: ChatMessage[],
  systemPrompt: string,
  tools: KitToolSchema[],
  toolExecutor: (toolCall: ToolCallEvent) => Promise<ToolCallResult>,
  callbacks: StreamWithToolsCallbacks,
  maxToolRounds = 5,
): Promise<{ text: string; toolCalls: ToolCallEvent[] }> {
  let conversationMessages = [...messages];
  let fullText = '';
  const allToolCalls: ToolCallEvent[] = [];
  let round = 0;

  while (round < maxToolRounds) {
    round++;

    const { text, toolCalls, stopReason } = await streamOnce(
      conversationMessages,
      systemPrompt,
      tools,
      callbacks,
      fullText,
    );

    fullText += text;

    if (toolCalls.length === 0 || stopReason !== 'tool_use') {
      // No more tool calls — done
      break;
    }

    // Build assistant message with tool_use content blocks
    const assistantContent: unknown[] = [];
    if (text) {
      assistantContent.push({ type: 'text', text });
    }
    for (const tc of toolCalls) {
      assistantContent.push({ type: 'tool_use', id: tc.id, name: tc.name, input: tc.input });
    }

    conversationMessages = [
      ...conversationMessages,
      { role: 'assistant', content: assistantContent },
    ];

    // Execute each tool and build tool_result messages
    const toolResults: unknown[] = [];
    for (const tc of toolCalls) {
      allToolCalls.push(tc);
      callbacks.onToolCall(tc);

      const result = await toolExecutor(tc);
      callbacks.onToolResult(tc.id, result);

      const resultContent = result.displayMarkdown || (result.success
        ? JSON.stringify(result.data ?? 'Tool executed successfully.')
        : `Error: ${result.error}`);

      toolResults.push({
        type: 'tool_result',
        tool_use_id: tc.id,
        content: resultContent,
        is_error: !result.success,
      });
    }

    conversationMessages = [
      ...conversationMessages,
      { role: 'user', content: toolResults },
    ];
  }

  return { text: fullText, toolCalls: allToolCalls };
}

/** Single streaming request — returns text, tool calls, and stop reason */
async function streamOnce(
  messages: ChatMessage[],
  systemPrompt: string,
  tools: KitToolSchema[],
  callbacks: StreamWithToolsCallbacks,
  existingText: string,
): Promise<{ text: string; toolCalls: ToolCallEvent[]; stopReason: string }> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, systemPrompt, stream: true, tools }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `API error: ${res.status}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let text = '';
  let stopReason = 'end_turn';
  const toolCalls: ToolCallEvent[] = [];
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? ''; // keep incomplete last line for next read

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6);
      if (raw === '[DONE]') continue;

      try {
        const parsed = JSON.parse(raw);

        if (parsed.type === 'text') {
          text += parsed.text;
          callbacks.onText(existingText + text);
        } else if (parsed.type === 'tool_use') {
          toolCalls.push({
            id: parsed.id,
            name: parsed.name,
            input: parsed.input || {},
          });
        } else if (parsed.type === 'message_end') {
          stopReason = parsed.stop_reason || 'end_turn';
        } else if (parsed.type === 'error') {
          throw new Error(parsed.error);
        } else if (parsed.text) {
          // Legacy format (backward compat with old SSE format)
          text += parsed.text;
          callbacks.onText(existingText + text);
        }
      } catch (e) {
        if (e instanceof SyntaxError) continue; // skip malformed JSON
        throw e;
      }
    }
  }

  return { text, toolCalls, stopReason };
}
