// src/views/AgentChatView.tsx
// Session B — chat scoped to an agent persona.
// A slimmer sibling of AegisChat. The persona provides the system prompt,
// accent color, avatar, and tool belt; this view streams turns through the
// existing /api/chat endpoint with `agent: { agent_id, conversation_id }`.
//
// Why not extend AegisChat? AegisChat is tightly coupled to `venture.*`
// defaults (system prompt, color, icon). Agent-routed chat has a different
// source of truth (agent_persona) and a different conversation lifecycle
// (created server-side, carried by id). Keeping it separate also makes the
// tool-belt filter explicit rather than an opt-in behind a flag.

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Bot, Loader2, Send, User } from 'lucide-react';
import { useNavigation } from '../stores/navigation';
import { useAgentChat } from '../stores/agent-chat';
import { useAgent } from '../hooks/use-agents';
import { useKitStore } from '../stores/kits';
import { filterToolsForAgent } from '../lib/agents/tool-belt';
import { streamMessage } from '../lib/claude';
import type { ChatMessage } from '../lib/claude';
import { supabase, getMessages, saveMessage } from '../lib/supabase';
import Markdown from '../components/Markdown';

export default function AgentChatView() {
  const activeHandle = useNavigation((s) => s.activeAgentHandle);
  const setView = useNavigation((s) => s.setView);
  const openAgentProfile = useNavigation((s) => s.openAgentProfile);
  const { data: agentRow } = useAgent(activeHandle);
  const {
    activeAgent,
    activeConversationId,
    activeSystemPrompt,
    clear: clearAgentChat,
  } = useAgentChat();

  const { getLoadedKits, getToolsForVenture, initBuiltins } = useKitStore();
  useEffect(() => { initBuiltins(); }, [initBuiltins]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  // Load history for the active conversation on mount / switch.
  useEffect(() => {
    if (!activeConversationId) { setMessages([]); return; }
    let cancelled = false;
    (async () => {
      if (!supabase) return;
      const rows = await getMessages(activeConversationId);
      if (cancelled) return;
      setMessages(rows.map((m) => ({ role: m.role, content: m.content })));
    })();
    return () => { cancelled = true; };
  }, [activeConversationId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  // Effective agent: prefer the cached AgentChatHandle (carries allowlist,
  // accent, avatar from start-conversation) but fall back to the full
  // agent_persona row when the store is cold (refresh right after nav).
  const agent = activeAgent ?? (agentRow ? {
    id: agentRow.id,
    handle: agentRow.handle,
    full_name: agentRow.full_name,
    title: agentRow.title,
    accent_color: agentRow.accent_color,
    avatar_url: agentRow.avatar_url,
    kit_allowlist: agentRow.kit_allowlist,
    tool_allowlist: (agentRow as { tool_allowlist?: string[] | null }).tool_allowlist ?? null,
    model: (agentRow.metadata as Record<string, unknown> | null)?.model as string | null ?? null,
  } : null);

  const accent = agent?.accent_color ?? '#64748B';
  const initials = agent?.full_name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() ?? '··';

  // Tool belt — intersection of kit tools × agent allowlist (defense-in-depth:
  // server re-checks tool_allowlist in api/_handlers/chat.ts).
  const ventureIdForTools = useMemo(() => 'mcv', []);
  const tools = useMemo(() => {
    if (!agent) return [];
    const allTools = getToolsForVenture(ventureIdForTools);
    const kits = getLoadedKits();
    return filterToolsForAgent(allTools, kits, {
      kit_allowlist: agent.kit_allowlist,
      tool_allowlist: agent.tool_allowlist,
    });
  }, [agent, getToolsForVenture, getLoadedKits, ventureIdForTools]);

  if (!activeHandle || !agent) {
    return (
      <div style={{ padding: 32, color: 'var(--text-muted)' }}>
        <button
          onClick={() => setView('agents')}
          style={{ marginBottom: 16, padding: '6px 12px', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 8, color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12 }}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> The Team
        </button>
        <p>No agent selected. Open an agent profile and click "Start conversation".</p>
      </div>
    );
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || loading || !activeConversationId || !agent) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    setStreamingText('');

    // Persist the user turn immediately so the thread survives a refresh
    // even if streaming fails mid-way.
    if (supabase) {
      await saveMessage(activeConversationId, 'user', text);
      // Also stamp the agent link on the row (saveMessage is shared with
      // AegisChat so it doesn't write agent_id itself).
      await supabase
        .from('messages')
        .update({ agent_id: agent.id })
        .eq('conversation_id', activeConversationId)
        .eq('role', 'user')
        .is('agent_id', null);
    }

    try {
      // Use the agent-routed chat endpoint. The server loads agent_persona,
      // prepends system_prompt, filters tools by tool_allowlist, picks the
      // effective model from agent.metadata.model, and writes an
      // agent_activity_log chat_turn on completion.
      const full = await streamAgentMessage({
        messages: nextMessages,
        agent,
        conversationId: activeConversationId,
        tools,
        systemPrompt: activeSystemPrompt ?? null,
        onChunk: (partial) => setStreamingText(partial),
      });

      const finalMessages: ChatMessage[] = [...nextMessages, { role: 'assistant', content: full }];
      setMessages(finalMessages);
      setStreamingText('');

      if (supabase) {
        await saveMessage(activeConversationId, 'assistant', full);
        await supabase
          .from('messages')
          .update({ agent_id: agent.id })
          .eq('conversation_id', activeConversationId)
          .eq('role', 'assistant')
          .is('agent_id', null);
      }
    } catch (err) {
      const errText = err instanceof Error ? err.message : 'Unknown error';
      setMessages([...nextMessages, { role: 'assistant', content: `**Error:** ${errText}` }]);
      setStreamingText('');
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Conversation header — agent identity front and center. */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 20px',
        borderBottom: `1px solid ${accent}33`,
        background: `linear-gradient(90deg, ${accent}18 0%, transparent 60%)`,
      }}>
        <button
          onClick={() => { clearAgentChat(); openAgentProfile(activeHandle); }}
          style={{ padding: 6, background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          aria-label="Back to profile"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: `linear-gradient(135deg, ${accent} 0%, ${accent}55 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--surface-base)', fontWeight: 700, fontSize: 13, flexShrink: 0,
          boxShadow: `0 4px 14px ${accent}55`,
        }}>
          {agent.avatar_url
            ? <img src={agent.avatar_url} alt={agent.full_name} style={{ width: '100%', height: '100%', borderRadius: 10, objectFit: 'cover' }} />
            : initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
            {agent.full_name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            <code style={{ color: accent }}>{agent.handle}</code> · {agent.title}
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {tools.length} tool{tools.length === 1 ? '' : 's'} in belt
        </div>
      </div>

      {/* Message list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {messages.length === 0 && !streamingText && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, marginTop: 60 }}>
            Start the thread — {agent.full_name} is ready.
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: 'flex', gap: 10, maxWidth: 820,
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: msg.role === 'user' ? 'var(--surface-elevated)' : accent,
              color: msg.role === 'user' ? 'var(--text-muted)' : 'var(--surface-base)',
              flexShrink: 0, fontSize: 11, fontWeight: 700,
            }}>
              {msg.role === 'user' ? <User size={14} /> : (agent.avatar_url ? <Bot size={14} /> : initials)}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, color: msg.role === 'user' ? 'var(--text-muted)' : accent, fontWeight: 600, marginBottom: 3 }}>
                {msg.role === 'user' ? 'You' : agent.full_name}
              </div>
              <div style={{
                padding: '8px 12px', borderRadius: 10, lineHeight: 1.6,
                background: msg.role === 'user' ? 'var(--surface-elevated)' : 'var(--surface-raised)',
                border: `1px solid ${msg.role === 'user' ? 'var(--border-subtle)' : accent + '44'}`,
                whiteSpace: msg.role === 'user' ? 'pre-wrap' : 'normal',
              }}>
                {msg.role === 'assistant'
                  ? <Markdown content={typeof msg.content === 'string' ? msg.content : ''} />
                  : (typeof msg.content === 'string' ? msg.content : '')}
              </div>
            </div>
          </div>
        ))}

        {streamingText && (
          <div style={{ display: 'flex', gap: 10, maxWidth: 820 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, background: accent,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--surface-base)', fontSize: 11, fontWeight: 700, flexShrink: 0,
            }}>
              {initials}
            </div>
            <div>
              <div style={{ fontSize: 11, color: accent, fontWeight: 600, marginBottom: 3 }}>{agent.full_name}</div>
              <div style={{
                padding: '8px 12px', borderRadius: 10, lineHeight: 1.6,
                background: 'var(--surface-raised)', border: `1px solid ${accent}44`,
              }}>
                <Markdown content={streamingText} />
              </div>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Input */}
      <div style={{ padding: 14, borderTop: '1px solid var(--border-subtle)', background: 'var(--surface-base)' }}>
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: 8,
          background: 'var(--surface-elevated)', borderRadius: 10, padding: 8,
          border: '1px solid var(--border-subtle)',
        }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${agent.full_name}…`}
            rows={1}
            disabled={loading}
            style={{
              flex: 1, resize: 'none', border: 'none', background: 'transparent',
              padding: '6px 8px', color: 'var(--text-primary)', fontSize: 14, lineHeight: 1.5,
              maxHeight: 140, outline: 'none',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            style={{
              width: 36, height: 36, borderRadius: 8, background: accent,
              color: 'var(--surface-base)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
              opacity: !input.trim() || loading ? 0.4 : 1, flexShrink: 0,
            }}
            aria-label="Send message"
          >
            {loading ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`}</style>
    </div>
  );
}

// ─── Streaming helper ─────────────────────────────────────────────────
// Wraps streamMessage to inject the agent context into the /api/chat body.
// Kept private to this view so the public streamMessage API stays stable.
async function streamAgentMessage(opts: {
  messages: ChatMessage[];
  agent: { id: string; kit_allowlist: string[]; tool_allowlist: string[] | null; model: string | null };
  conversationId: string;
  tools: Array<{ name: string }>;
  systemPrompt: string | null;
  onChunk: (text: string) => void;
}): Promise<string> {
  // We use fetch directly rather than streamMessage so we can pass the
  // `agent` body param. The SSE envelope is identical to /api/chat's
  // standard stream — reuse the same parser shape here.
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: opts.messages,
      systemPrompt: opts.systemPrompt ?? undefined,
      stream: true,
      tools: opts.tools.length > 0 ? opts.tools : undefined,
      model: opts.agent.model ?? undefined, // null → server picks default
      agent: {
        agent_id: opts.agent.id,
        conversation_id: opts.conversationId,
      },
    }),
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
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6);
      if (raw === '[DONE]') continue;
      try {
        const parsed = JSON.parse(raw);
        if (parsed.type === 'text' || parsed.text) {
          full += parsed.text ?? '';
          opts.onChunk(full);
        } else if (parsed.type === 'error') {
          throw new Error(parsed.error);
        }
      } catch (e) {
        if (e instanceof SyntaxError) continue;
        throw e;
      }
    }
  }
  return full;
}

// Keep the module idempotent against tree-shaking warnings.
void streamMessage;
