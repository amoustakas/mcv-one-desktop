/**
 * BrowserSidebar — Claude AI intelligence panel for the browser widget.
 *
 * Quick actions: Summarize, Extract, Ask, Act.
 * Mini chat interface scoped to the current page context.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { X, FileText, Database, MessageSquare, Wand2, Send, Loader2 } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface BrowserSidebarProps {
  sessionId: string;
  pageUrl: string;
  onClose: () => void;
}

export default function BrowserSidebar({ sessionId, pageUrl, onClose }: BrowserSidebarProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchPageContent = useCallback(async () => {
    const res = await fetch('/local/browser/readability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });
    if (!res.ok) throw new Error('Failed to read page');
    return res.json();
  }, [sessionId]);

  const sendToAI = useCallback(async (userMessage: string, systemContext?: string) => {
    setLoading(true);
    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setInput('');

    try {
      const pageData = systemContext ? null : await fetchPageContent();
      const contextText = systemContext || `Page: ${pageData?.title || pageUrl}\nURL: ${pageData?.url || pageUrl}\n\nContent:\n${(pageData?.textContent || '').slice(0, 50000)}`;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: `[Page Context]\n${contextText}\n\n[User Question]\n${userMessage}` },
          ],
          system: 'You are a helpful assistant analyzing a web page. Answer the user\'s question based on the page content provided. Be concise and specific.',
        }),
      });

      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      const reply = data.content?.[0]?.text || data.text || 'No response received.';
      setMessages([...newMessages, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', content: `Error: ${(err as Error).message}` }]);
    } finally {
      setLoading(false);
    }
  }, [messages, fetchPageContent, pageUrl]);

  const handleSummarize = useCallback(() => {
    sendToAI('Summarize this page in 3-5 key bullet points.');
  }, [sendToAI]);

  const handleExtract = useCallback(() => {
    sendToAI('Extract the key structured data from this page (names, dates, numbers, lists, etc.) and format it as organized sections.');
  }, [sendToAI]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !loading) {
      sendToAI(input.trim());
    }
  }, [input, loading, sendToAI]);

  return (
    <div className="browser-sidebar">
      <div className="browser-sidebar-header">
        <h3>Claude AI</h3>
        <button className="browser-nav-btn" onClick={onClose} title="Close sidebar">
          <X size={14} />
        </button>
      </div>

      <div className="browser-sidebar-actions">
        <button className="browser-action-btn" onClick={handleSummarize} disabled={loading}>
          <FileText size={12} /> Summarize
        </button>
        <button className="browser-action-btn" onClick={handleExtract} disabled={loading}>
          <Database size={12} /> Extract
        </button>
        <button className="browser-action-btn" onClick={() => sendToAI('What are the main topics on this page?')} disabled={loading}>
          <MessageSquare size={12} /> Topics
        </button>
        <button className="browser-action-btn" onClick={() => sendToAI('What actions can I take on this page? List all buttons, links, and forms.')} disabled={loading}>
          <Wand2 size={12} /> Actions
        </button>
      </div>

      <div className="browser-sidebar-chat">
        <div className="browser-chat-messages">
          {messages.length === 0 && (
            <div style={{ padding: 12, color: 'var(--text-muted)', fontSize: 12, textAlign: 'center' }}>
              Ask Claude about this page, or use the quick actions above.
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`browser-chat-msg ${msg.role}`}>
              {msg.content}
            </div>
          ))}
          {loading && (
            <div className="browser-chat-msg assistant" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Loader2 size={14} className="spin" /> Analyzing page...
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <form className="browser-chat-input-row" onSubmit={handleSubmit}>
          <input
            className="browser-chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this page..."
            disabled={loading}
          />
          <button className="browser-chat-send" type="submit" disabled={!input.trim() || loading}>
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
