import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, Trash2 } from 'lucide-react';
import { streamMessage, type ChatMessage } from '../lib/claude';
import { type Venture } from '../lib/ventures';

interface NAOSChatProps {
  venture: Venture;
}

function loadHistory(ventureId: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(`naos-chat-${ventureId}`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveHistory(ventureId: string, msgs: ChatMessage[]) {
  localStorage.setItem(`naos-chat-${ventureId}`, JSON.stringify(msgs.slice(-100)));
}

export default function NAOSChat({ venture }: NAOSChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadHistory(venture.id));
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  useEffect(() => {
    const history = loadHistory(venture.id);
    setMessages(history);
    setStreamingText('');
  }, [venture.id]);

  useEffect(() => {
    if (messages.length > 0) saveHistory(venture.id, messages);
  }, [messages, venture.id]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setStreamingText('');

    try {
      const full = await streamMessage(
        newMessages,
        venture.systemPrompt,
        (partial) => setStreamingText(partial),
      );
      setMessages((prev) => [...prev, { role: 'assistant', content: full }]);
      setStreamingText('');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${errorMsg}` },
      ]);
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
    <div className="chat-container">
      <div className="chat-messages">
        {messages.length === 0 && !streamingText && (
          <div className="chat-empty">
            <div className="chat-empty-icon" style={{ color: venture.color }}>
              {venture.icon}
            </div>
            <h2 className="chat-empty-title">
              NAOS <span style={{ color: venture.color }}>&middot;</span> {venture.name}
            </h2>
            <p className="chat-empty-sub">{venture.tagline}</p>
            <p className="chat-empty-hint">Ask me anything about {venture.name}.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`chat-msg ${msg.role}`}>
            <div className="chat-msg-avatar">
              {msg.role === 'user' ? (
                <User size={16} />
              ) : (
                <Bot size={16} />
              )}
            </div>
            <div className="chat-msg-content">
              <div className="chat-msg-name">
                {msg.role === 'user' ? 'You' : 'NAOS'}
              </div>
              <div className="chat-msg-text">{msg.content}</div>
            </div>
          </div>
        ))}

        {streamingText && (
          <div className="chat-msg assistant">
            <div className="chat-msg-avatar">
              <Bot size={16} />
            </div>
            <div className="chat-msg-content">
              <div className="chat-msg-name">NAOS</div>
              <div className="chat-msg-text">{streamingText}</div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <div className="chat-input-wrap">
          <textarea
            ref={inputRef}
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message NAOS (${venture.name})...`}
            rows={1}
            disabled={loading}
          />
          <button
            className="chat-send"
            onClick={handleSend}
            disabled={!input.trim() || loading}
            aria-label="Send message"
          >
            {loading ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
          </button>
        </div>
        <div className="chat-footer-row">
          <p className="chat-disclaimer">
            Powered by Claude claude-sonnet-4-20250514
          </p>
          {messages.length > 0 && (
            <button
              className="chat-clear"
              onClick={() => {
                setMessages([]);
                localStorage.removeItem(`naos-chat-${venture.id}`);
              }}
              aria-label="Clear chat"
            >
              <Trash2 size={14} />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      <style>{`
        .chat-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: var(--space-lg);
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .chat-empty {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: var(--space-sm);
          text-align: center;
          padding: var(--space-2xl);
        }

        .chat-empty-icon {
          width: 64px;
          height: 64px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--text-3xl);
          font-weight: 800;
          background: var(--bg-card);
          border: 1px solid var(--border);
          margin-bottom: var(--space-md);
        }

        .chat-empty-title {
          font-size: var(--text-2xl);
          font-weight: 700;
          color: var(--text-primary);
        }

        .chat-empty-sub {
          font-size: var(--text-sm);
          color: var(--text-secondary);
        }

        .chat-empty-hint {
          font-size: var(--text-sm);
          color: var(--text-muted);
          margin-top: var(--space-lg);
        }

        .chat-msg {
          display: flex;
          gap: var(--space-sm);
          max-width: 800px;
        }

        .chat-msg.user {
          align-self: flex-end;
          flex-direction: row-reverse;
        }

        .chat-msg-avatar {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: var(--bg-card);
          border: 1px solid var(--border);
          color: var(--text-secondary);
        }

        .chat-msg.assistant .chat-msg-avatar {
          color: var(--cyan);
          border-color: var(--cyan-glow);
        }

        .chat-msg-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        .chat-msg-name {
          font-size: var(--text-xs);
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .chat-msg.user .chat-msg-name {
          text-align: right;
        }

        .chat-msg-text {
          padding: var(--space-sm) var(--space-md);
          border-radius: var(--radius-md);
          font-size: var(--text-sm);
          line-height: 1.6;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .chat-msg.user .chat-msg-text {
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          color: var(--text-primary);
        }

        .chat-msg.assistant .chat-msg-text {
          background: var(--bg-card);
          border: 1px solid var(--border);
          color: var(--text-primary);
        }

        .chat-input-area {
          padding: var(--space-md) var(--space-lg);
          border-top: 1px solid var(--border);
          background: var(--bg-surface);
        }

        .chat-input-wrap {
          display: flex;
          align-items: flex-end;
          gap: var(--space-sm);
          background: var(--bg-input);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: var(--space-sm);
          transition: border-color var(--transition-fast);
        }

        .chat-input-wrap:focus-within {
          border-color: var(--border-active);
        }

        .chat-input {
          flex: 1;
          resize: none;
          border: none;
          background: transparent;
          padding: var(--space-xs) var(--space-sm);
          font-size: var(--text-sm);
          color: var(--text-primary);
          max-height: 120px;
          line-height: 1.5;
        }

        .chat-input:focus {
          outline: none;
          border: none;
        }

        .chat-send {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--cyan);
          color: var(--bg-deep);
          transition: all var(--transition-fast);
          flex-shrink: 0;
        }

        .chat-send:hover:not(:disabled) {
          background: var(--cyan-dim);
        }

        .chat-send:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .chat-footer-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: var(--space-sm);
        }

        .chat-disclaimer {
          font-size: var(--text-xs);
          color: var(--text-muted);
        }

        .chat-clear {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: var(--text-xs);
          color: var(--text-muted);
          padding: 4px 8px;
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast);
        }

        .chat-clear:hover {
          color: var(--error);
          background: rgba(239, 68, 68, 0.1);
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @media (max-width: 640px) {
          .chat-messages { padding: var(--space-md); }
          .chat-input-area { padding: var(--space-sm) var(--space-md); }
        }
      `}</style>
    </div>
  );
}
