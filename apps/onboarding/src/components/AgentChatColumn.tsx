'use client';

// AgentChatColumn — live agent-routed chat for the wizard.
// Powered by Session B's chat-routing primitives. One conversation per
// journey; the responding agent voice flips automatically when the
// agent_assignment step completes (Atlas → specialist).

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ProspectJourney } from '@mcv/onboarding-sdk';
import { callChatApi } from '@/lib/api';

interface AgentSummary {
  id: string;
  handle: string;
  full_name: string;
  title: string;
  accent_color: string | null;
  avatar_url: string | null;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  agent: AgentSummary | null;
}

interface Props {
  journey: ProspectJourney | null;
}

export function AgentChatColumn({ journey }: Props) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [openingAgent, setOpeningAgent] = useState<AgentSummary | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Bootstrap conversation on first journey appearance.
  useEffect(() => {
    if (!journey?.id) return;
    if (conversationId) return;          // already opened for this journey

    let cancelled = false;
    setBootstrapping(true);
    setError(null);

    (async () => {
      try {
        const start = await callChatApi<{ conversation_id: string; agent: AgentSummary | null }>({
          action: 'start',
          journey_id: journey.id,
        });
        if (cancelled) return;
        setConversationId(start.conversation_id);
        setOpeningAgent(start.agent);

        const history = await callChatApi<{ messages: ChatMessage[] }>({
          action: 'list',
          conversation_id: start.conversation_id,
        });
        if (cancelled) return;
        setMessages(history.messages.filter((m) => m.role !== 'system'));
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();

    return () => { cancelled = true; };
  }, [journey?.id, conversationId]);

  // Auto-scroll on new messages.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, sending]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || !conversationId || !journey?.id) return;
    setInput('');
    setSending(true);
    setError(null);

    // Optimistic user-message echo.
    const optimisticId = `optim-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: optimisticId, role: 'user', content: text, created_at: new Date().toISOString(), agent: null },
    ]);

    try {
      const res = await callChatApi<{
        user_message: ChatMessage;
        assistant_message: ChatMessage;
      }>({
        action: 'send',
        journey_id: journey.id,
        conversation_id: conversationId,
        text,
      });
      // Replace optimistic with real, then append assistant.
      setMessages((prev) => {
        const withoutOptim = prev.filter((m) => m.id !== optimisticId);
        return [...withoutOptim, res.user_message, res.assistant_message];
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      // Remove optimistic on failure so user can retry.
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
    } finally {
      setSending(false);
    }
  }, [input, conversationId, journey?.id]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  // Header agent: prefer the most recent assistant's agent (reflects current
  // owner after handoff), else the conversation's opening agent.
  const headerAgent = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant' && messages[i].agent) return messages[i].agent;
    }
    return openingAgent;
  })();

  if (!journey) {
    return (
      <>
        <div className="wiz-chat-header">
          <div style={avatarStyle('A', '#00F5FF', '#8B5CF6')}>A</div>
          <div>
            <div className="wiz-chat-agent-name">Atlas</div>
            <div className="wiz-chat-agent-handle">@atlas · Chief of Staff</div>
          </div>
        </div>
        <div className="wiz-chat-body">
          <div className="wiz-chat-msg">
            Tell me your email on the left and we&rsquo;ll get going. I&rsquo;ll be here the whole way.
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="wiz-chat-header">
        <div style={avatarStyle(initialsOf(headerAgent?.full_name ?? 'A'), 'var(--brand)', 'var(--brand-accent)', headerAgent?.accent_color)}>
          {initialsOf(headerAgent?.full_name ?? 'A')}
        </div>
        <div>
          <div className="wiz-chat-agent-name">{headerAgent?.full_name ?? 'Atlas'}</div>
          <div className="wiz-chat-agent-handle">{headerAgent?.handle ?? '@atlas'} · {headerAgent?.title ?? 'Chief of Staff'}</div>
        </div>
      </div>

      <div className="wiz-chat-body" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 240px)' }}>
        {bootstrapping && messages.length === 0 && (
          <div className="wiz-chat-msg" style={{ opacity: 0.6 }}>Connecting…</div>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} msg={m} />
        ))}
        {sending && (
          <div className="wiz-chat-msg" style={{ opacity: 0.6, fontStyle: 'italic' }}>
            {headerAgent?.full_name?.split(' ')[0] ?? 'Atlas'} is typing…
          </div>
        )}
        <div ref={endRef} />
      </div>

      {error && (
        <div style={{ padding: 8, fontSize: 11, color: 'var(--danger)' }}>{error}</div>
      )}

      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={`Message ${headerAgent?.full_name?.split(' ')[0] ?? 'Atlas'}…`}
          rows={2}
          disabled={sending || bootstrapping}
          style={{
            width: '100%', padding: '10px 12px', borderRadius: 8,
            background: 'var(--bg-elevated)', color: 'var(--text)',
            border: '1px solid var(--border-subtle)',
            fontSize: 13, fontFamily: 'inherit', resize: 'none',
          }}
        />
        <div style={{ marginTop: 6, fontSize: 10, color: 'var(--text-muted)' }}>
          Enter to send · Shift+Enter for new line
        </div>
      </div>
    </>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Message bubble — agent avatar inline so handoffs read visually.
// ───────────────────────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  const agentName = msg.agent?.full_name?.split(' ')[0];
  const accent = msg.agent?.accent_color ?? undefined;

  if (isUser) {
    return (
      <div className="wiz-chat-msg" style={{
        background: 'transparent',
        border: '1px solid var(--border-subtle)',
        alignSelf: 'flex-end',
        maxWidth: '85%',
      }}>
        {msg.content}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <div style={avatarStyle(initialsOf(msg.agent?.full_name ?? 'A'), 'var(--brand)', 'var(--brand-accent)', accent, 28, 14)}>
        {initialsOf(msg.agent?.full_name ?? 'A')}
      </div>
      <div style={{ flex: 1 }}>
        {agentName && (
          <div style={{ fontSize: 10, color: accent ?? 'var(--text-muted)', marginBottom: 2, fontWeight: 600 }}>
            {agentName} {msg.agent?.handle ? <span style={{ opacity: 0.6, fontWeight: 400 }}>· {msg.agent.handle}</span> : null}
          </div>
        )}
        <div className="wiz-chat-msg">{msg.content}</div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Style helpers
// ───────────────────────────────────────────────────────────────────────────

function initialsOf(name: string): string {
  return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}

function avatarStyle(
  _initials: string,
  fallbackBrand: string,
  fallbackAccent: string,
  agentAccent?: string | null,
  size = 36,
  fontSize = 16,
): React.CSSProperties {
  const bg = agentAccent
    ? agentAccent
    : `linear-gradient(135deg, ${fallbackBrand}, ${fallbackAccent})`;
  return {
    width: size, height: size, borderRadius: size / 2,
    background: bg,
    color: '#000',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize,
    flexShrink: 0,
  };
}
