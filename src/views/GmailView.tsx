import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Mail, Inbox, Send, FileText, Trash2, Star, Archive,
  Search, RefreshCw, ChevronRight, ChevronDown, Tag,
  Plus, CornerUpLeft, Forward, MoreHorizontal,
  AlertTriangle, X, Paperclip, Eye, EyeOff,
  Sparkles, Bot, ListChecks, CheckSquare, Square,
  Copy, Flag, Clock,
} from 'lucide-react';
import {
  PageHeader, Button, GlassCard, Badge, EmptyState,
  Input, Skeleton,
} from '../components/ui';
import { useToast } from '../components/Toasts';

// ── Types ──

interface GmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  cc?: string;
  date: string;
  snippet: string;
  body: string;
  labelIds: string[];
  isUnread: boolean;
}

interface GmailLabel {
  id: string;
  name: string;
  type: string;
  messagesTotal?: number;
  messagesUnread?: number;
}

interface GmailOverview {
  email: string;
  threadsTotal: number;
  messagesTotal: number;
  inboxMessages: number;
  unreadMessages: number;
}

interface ContactSuggestion {
  name: string;
  email: string;
}

type GmailFolder = 'INBOX' | 'SENT' | 'DRAFT' | 'TRASH' | 'STARRED' | 'SPAM';
type ComposeMode = 'new' | 'reply' | 'forward';

// ── API helpers ──

async function gmailApi(action: string, params: Record<string, unknown> = {}, method = 'GET') {
  const base = '/api/gmail';
  if (method === 'GET') {
    const qs = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])) }).toString();
    const res = await fetch(`${base}?${qs}`);
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `Gmail ${res.status}`); }
    return res.json();
  }
  const res = await fetch(base, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...params }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `Gmail ${res.status}`); }
  return res.json();
}

async function contactAutocomplete(query: string): Promise<ContactSuggestion[]> {
  if (query.length < 2) return [];
  try {
    const res = await fetch(`/api/google-contacts?action=autocomplete&q=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.suggestions ?? [];
  } catch { return []; }
}

async function aiAction(action: string, emailBody: string, subject: string): Promise<string> {
  const prompts: Record<string, string> = {
    summarize: `Summarize this email concisely in 2-3 bullet points:\n\nSubject: ${subject}\n\n${emailBody}`,
    'draft-reply': `Draft a professional, concise reply to this email:\n\nSubject: ${subject}\n\n${emailBody}`,
    'extract-actions': `Extract all action items and deadlines from this email as a bullet list:\n\nSubject: ${subject}\n\n${emailBody}`,
  };
  const res = await fetch('/api/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'gemini-generate', prompt: prompts[action] || emailBody }),
  });
  if (!res.ok) throw new Error('AI action failed');
  const data = await res.json();
  return data.content || 'No response.';
}

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}

// ── Folder config ──

const FOLDER_ITEMS: { id: GmailFolder; label: string; icon: typeof Inbox; query: string }[] = [
  { id: 'INBOX', label: 'Inbox', icon: Inbox, query: 'in:inbox' },
  { id: 'STARRED', label: 'Starred', icon: Star, query: 'is:starred' },
  { id: 'SENT', label: 'Sent', icon: Send, query: 'in:sent' },
  { id: 'DRAFT', label: 'Drafts', icon: FileText, query: 'in:drafts' },
  { id: 'SPAM', label: 'Spam', icon: AlertTriangle, query: 'in:spam' },
  { id: 'TRASH', label: 'Trash', icon: Trash2, query: 'in:trash' },
];

// ── Contact Autocomplete Input ──

function ContactInput({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder: string;
}) {
  const [suggestions, setSuggestions] = useState<ContactSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onChange(v);
    // Autocomplete on the last email being typed
    const lastPart = v.split(',').pop()?.trim() || '';
    clearTimeout(debounceRef.current);
    if (lastPart.length >= 2 && !lastPart.includes('@')) {
      debounceRef.current = setTimeout(async () => {
        const results = await contactAutocomplete(lastPart);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      }, 300);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (s: ContactSuggestion) => {
    const parts = value.split(',').map(p => p.trim()).filter(Boolean);
    parts[parts.length - 1] = s.name ? `${s.name} <${s.email}>` : s.email;
    onChange(parts.join(', ') + ', ');
    setShowSuggestions(false);
  };

  return (
    <div className="gmail-contact-input-wrap">
      <input
        className="gmail-contact-input"
        type="text"
        value={value}
        onChange={handleChange}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        placeholder={placeholder}
      />
      {showSuggestions && (
        <div className="gmail-contact-suggestions">
          {suggestions.map((s, i) => (
            <button key={i} className="gmail-suggestion" onMouseDown={() => selectSuggestion(s)}>
              <span className="gmail-suggestion-name">{s.name || s.email}</span>
              {s.name && <span className="gmail-suggestion-email">{s.email}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Compose Modal (enhanced) ──

function ComposeModal({ onClose, onSend, mode, replyTo }: {
  onClose: () => void;
  onSend: (to: string, subject: string, body: string, cc?: string, bcc?: string) => void;
  mode: ComposeMode;
  replyTo?: GmailMessage | null;
}) {
  const [to, setTo] = useState(mode === 'reply' && replyTo ? replyTo.from : '');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [subject, setSubject] = useState(
    mode === 'reply' && replyTo ? `Re: ${replyTo.subject}` :
    mode === 'forward' && replyTo ? `Fwd: ${replyTo.subject}` : '',
  );
  const [body, setBody] = useState(
    mode === 'forward' && replyTo ? `\n\n---------- Forwarded message ----------\nFrom: ${replyTo.from}\nDate: ${replyTo.date}\nSubject: ${replyTo.subject}\n\n${stripHtml(replyTo.body)}` :
    mode === 'reply' && replyTo ? `\n\nOn ${replyTo.date}, ${replyTo.from} wrote:\n> ${stripHtml(replyTo.body).split('\n').join('\n> ')}` : '',
  );
  const [sending, setSending] = useState(false);
  const [aiDrafting, setAiDrafting] = useState(false);

  const handleSend = async () => {
    if (!to || !subject) return;
    setSending(true);
    try {
      await onSend(to, subject, body, cc || undefined, bcc || undefined);
      onClose();
    } finally {
      setSending(false);
    }
  };

  const handleAiDraft = async () => {
    if (!replyTo) return;
    setAiDrafting(true);
    try {
      const draft = await aiAction('draft-reply', stripHtml(replyTo.body), replyTo.subject);
      setBody(draft);
    } catch { /* ignore */ }
    finally { setAiDrafting(false); }
  };

  return (
    <div className="gmail-compose-overlay" onClick={onClose}>
      <GlassCard className="gmail-compose-modal" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div className="gmail-compose-header">
          <h3>{mode === 'reply' ? 'Reply' : mode === 'forward' ? 'Forward' : 'New Message'}</h3>
          <button className="gmail-icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="gmail-compose-fields">
          <ContactInput value={to} onChange={setTo} placeholder="To" />
          {showCcBcc ? (
            <>
              <ContactInput value={cc} onChange={setCc} placeholder="Cc" />
              <ContactInput value={bcc} onChange={setBcc} placeholder="Bcc" />
            </>
          ) : (
            <button className="gmail-ccbcc-toggle" onClick={() => setShowCcBcc(true)}>Cc / Bcc</button>
          )}
          <input
            className="gmail-contact-input"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <textarea
            className="gmail-compose-body"
            placeholder="Write your message..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={14}
          />
        </div>
        <div className="gmail-compose-actions">
          <Button onClick={handleSend} disabled={sending || !to || !subject}>
            {sending ? 'Sending...' : 'Send'}
          </Button>
          {(mode === 'reply' || mode === 'forward') && replyTo && (
            <button className="gmail-ai-btn" onClick={handleAiDraft} disabled={aiDrafting} title="NAOS: Draft a reply with AI">
              <Bot size={14} /> {aiDrafting ? 'Drafting...' : 'AI Draft'}
            </button>
          )}
          <button className="gmail-icon-btn" title="Attach"><Paperclip size={16} /></button>
        </div>
      </GlassCard>
    </div>
  );
}

// ── AI Actions Panel ──

function AiActionsPanel({ message }: { message: GmailMessage }) {
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const runAction = async (action: string) => {
    setLoading(true);
    setActiveAction(action);
    try {
      const text = await aiAction(action, stripHtml(message.body), message.subject);
      setResult(text);
    } catch {
      setResult('AI action failed. Check your Gemini API key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gmail-ai-panel">
      <div className="gmail-ai-actions-row">
        <button className="gmail-ai-btn" onClick={() => runAction('summarize')} disabled={loading}>
          <Sparkles size={12} /> Summarize
        </button>
        <button className="gmail-ai-btn" onClick={() => runAction('draft-reply')} disabled={loading}>
          <Bot size={12} /> Draft Reply
        </button>
        <button className="gmail-ai-btn" onClick={() => runAction('extract-actions')} disabled={loading}>
          <ListChecks size={12} /> Extract Actions
        </button>
      </div>
      {loading && <div className="gmail-ai-loading">NAOS is thinking...</div>}
      {result && !loading && (
        <div className="gmail-ai-result">
          <div className="gmail-ai-result-header">
            <Sparkles size={12} /> <span>NAOS — {activeAction}</span>
            <button className="gmail-icon-btn" onClick={() => setResult(null)} style={{ width: 20, height: 20 }}><X size={12} /></button>
          </div>
          <div className="gmail-ai-result-body">{result}</div>
        </div>
      )}
    </div>
  );
}

// ── Message Detail (enhanced) ──

function MessageDetail({ message, onArchive, onTrash, onStar, onReply, onForward, onMarkRead }: {
  message: GmailMessage | null;
  onArchive: (id: string) => void;
  onTrash: (id: string) => void;
  onStar: (id: string) => void;
  onReply: (msg: GmailMessage) => void;
  onForward: (msg: GmailMessage) => void;
  onMarkRead: (id: string, unread: boolean) => void;
}) {
  if (!message) {
    return (
      <div className="gmail-detail-empty">
        <Mail size={48} strokeWidth={1} style={{ color: 'var(--text-muted)' }} />
        <p>Select a message to read</p>
        <p className="gmail-shortcut-hint">j/k to navigate &middot; e archive &middot; r reply &middot; # delete</p>
      </div>
    );
  }

  const bodyText = message.body ? stripHtml(message.body) : message.snippet;

  return (
    <div className="gmail-detail">
      <div className="gmail-detail-header">
        <h2 className="gmail-detail-subject">{message.subject || '(no subject)'}</h2>
        <div className="gmail-detail-meta">
          <span className="gmail-detail-from">{message.from}</span>
          <span className="gmail-detail-date">{new Date(message.date).toLocaleString()}</span>
        </div>
        {message.to && <div className="gmail-detail-to">To: {message.to}</div>}
        {message.cc && <div className="gmail-detail-to">Cc: {message.cc}</div>}
      </div>

      <div className="gmail-detail-actions">
        <button className="gmail-action-btn" onClick={() => onReply(message)} title="Reply (r)">
          <CornerUpLeft size={14} /> Reply
        </button>
        <button className="gmail-action-btn" onClick={() => onForward(message)} title="Forward (f)">
          <Forward size={14} /> Forward
        </button>
        <div className="gmail-detail-actions-sep" />
        <button className="gmail-icon-btn" title="Archive (e)" onClick={() => onArchive(message.id)}><Archive size={14} /></button>
        <button className="gmail-icon-btn" title="Star (s)" onClick={() => onStar(message.id)}><Star size={14} /></button>
        <button className="gmail-icon-btn" title={message.isUnread ? 'Mark read' : 'Mark unread'} onClick={() => onMarkRead(message.id, !message.isUnread)}>
          {message.isUnread ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>
        <button className="gmail-icon-btn" title="Delete (#)" onClick={() => onTrash(message.id)}><Trash2 size={14} /></button>
      </div>

      {/* NAOS AI Actions */}
      <AiActionsPanel message={message} />

      <div className="gmail-detail-body" style={{ whiteSpace: 'pre-wrap' }}>
        {bodyText}
      </div>
    </div>
  );
}

// ── Main View ──

export default function GmailView() {
  const { addToast } = useToast();
  const [activeFolder, setActiveFolder] = useState<GmailFolder>('INBOX');
  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [labels, setLabels] = useState<GmailLabel[]>([]);
  const [overview, setOverview] = useState<GmailOverview | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<GmailMessage | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [composeMode, setComposeMode] = useState<ComposeMode | null>(null);
  const [composeReplyTo, setComposeReplyTo] = useState<GmailMessage | null>(null);
  const [labelsExpanded, setLabelsExpanded] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const viewRef = useRef<HTMLDivElement>(null);

  // Load overview + labels on mount
  useEffect(() => {
    Promise.all([
      gmailApi('overview').catch(() => null),
      gmailApi('list-labels').catch(() => ({ labels: [] })),
    ]).then(([ov, lb]) => {
      if (ov) setOverview(ov);
      setLabels((lb?.labels ?? []).filter((l: GmailLabel) => l.type === 'user'));
    });
  }, []);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      gmailApi('overview').then(ov => { if (ov) setOverview(ov); }).catch(() => {});
    }, 120000);
    return () => clearInterval(interval);
  }, []);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const folder = FOLDER_ITEMS.find(f => f.id === activeFolder);
      const q = searchQuery || folder?.query || 'in:inbox';
      const data = await gmailApi('search', { q, maxResults: 50 });
      setMessages(data.messages ?? []);
      setSelectedIndex(-1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [activeFolder, searchQuery]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  const selectMessage = async (msg: GmailMessage, index: number) => {
    setSelectedIndex(index);
    try {
      const full = await gmailApi('get-message', { id: msg.id });
      const parsed = full._parsed ?? full;
      setSelectedMessage({
        id: msg.id, threadId: msg.threadId,
        subject: parsed.subject || msg.subject,
        from: parsed.from || msg.from,
        to: parsed.to || '', cc: parsed.cc || '',
        date: parsed.date || msg.date,
        snippet: msg.snippet,
        body: parsed.body || msg.snippet,
        labelIds: msg.labelIds || [],
        isUnread: (msg.labelIds || []).includes('UNREAD'),
      });
    } catch {
      setSelectedMessage({ ...msg, body: msg.snippet, to: '', isUnread: false });
    }
  };

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (composeMode) return;

      switch (e.key) {
        case 'j': // Next message
          if (selectedIndex < messages.length - 1) {
            const next = selectedIndex + 1;
            selectMessage(messages[next], next);
          }
          break;
        case 'k': // Previous message
          if (selectedIndex > 0) {
            const prev = selectedIndex - 1;
            selectMessage(messages[prev], prev);
          }
          break;
        case 'e': // Archive
          if (selectedMessage) handleArchive(selectedMessage.id);
          break;
        case 'r': // Reply
          if (selectedMessage) { setComposeMode('reply'); setComposeReplyTo(selectedMessage); }
          break;
        case 'f': // Forward
          if (selectedMessage) { setComposeMode('forward'); setComposeReplyTo(selectedMessage); }
          break;
        case 's': // Star
          if (selectedMessage) handleStar(selectedMessage.id);
          break;
        case '#': // Delete
          if (selectedMessage) handleTrash(selectedMessage.id);
          break;
        case 'c': // Compose
          setComposeMode('new');
          setComposeReplyTo(null);
          break;
        case '/': // Focus search
          e.preventDefault();
          viewRef.current?.querySelector<HTMLInputElement>('.gmail-search input')?.focus();
          break;
        case 'Escape':
          setSelectedMessage(null);
          setSelectedIndex(-1);
          break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedMessage, selectedIndex, messages, composeMode]);

  // ── Actions ──
  const handleSend = async (to: string, subject: string, body: string, cc?: string, bcc?: string) => {
    await gmailApi('send', { to, subject, body, cc, bcc }, 'POST');
    addToast({ type: 'success', message: `Email sent to ${to}` });
  };

  const handleArchive = async (id: string) => {
    await gmailApi('modify', { id, removeLabelIds: ['INBOX'] }, 'POST');
    setMessages(prev => prev.filter(m => m.id !== id));
    setSelectedMessage(null);
    addToast({ type: 'success', message: 'Archived' });
  };

  const handleTrash = async (id: string) => {
    await gmailApi('trash', { id }, 'POST');
    setMessages(prev => prev.filter(m => m.id !== id));
    setSelectedMessage(null);
    addToast({ type: 'success', message: 'Moved to trash' });
  };

  const handleStar = async (id: string) => {
    await gmailApi('modify', { id, addLabelIds: ['STARRED'] }, 'POST');
    addToast({ type: 'success', message: 'Starred' });
  };

  const handleMarkRead = async (id: string, unread: boolean) => {
    if (unread) {
      await gmailApi('modify', { id, addLabelIds: ['UNREAD'] }, 'POST');
    } else {
      await gmailApi('modify', { id, removeLabelIds: ['UNREAD'] }, 'POST');
    }
    addToast({ type: 'success', message: unread ? 'Marked unread' : 'Marked read' });
  };

  // ── Batch operations ──
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === messages.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(messages.map(m => m.id)));
    }
  };

  const batchArchive = async () => {
    const ids = [...selectedIds];
    await Promise.all(ids.map(id => gmailApi('modify', { id, removeLabelIds: ['INBOX'] }, 'POST')));
    setMessages(prev => prev.filter(m => !selectedIds.has(m.id)));
    setSelectedIds(new Set());
    addToast({ type: 'success', message: `Archived ${ids.length} messages` });
  };

  const batchTrash = async () => {
    const ids = [...selectedIds];
    await Promise.all(ids.map(id => gmailApi('trash', { id }, 'POST')));
    setMessages(prev => prev.filter(m => !selectedIds.has(m.id)));
    setSelectedIds(new Set());
    addToast({ type: 'success', message: `Deleted ${ids.length} messages` });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadMessages();
  };

  return (
    <div className="gmail-view" ref={viewRef} tabIndex={0}>
      <PageHeader title="Gmail" subtitle={overview ? `${overview.email} — ${overview.unreadMessages} unread` : undefined}>
        <Button onClick={() => { setComposeMode('new'); setComposeReplyTo(null); }}><Plus size={14} /> Compose</Button>
        <button className="gmail-icon-btn" onClick={loadMessages} title="Refresh"><RefreshCw size={16} /></button>
      </PageHeader>

      <div className="gmail-layout">
        {/* Sidebar */}
        <div className="gmail-sidebar">
          <div className="gmail-folders">
            {FOLDER_ITEMS.map(f => {
              const Icon = f.icon;
              const isActive = activeFolder === f.id && !searchQuery;
              return (
                <button
                  key={f.id}
                  className={`gmail-folder-item ${isActive ? 'active' : ''}`}
                  onClick={() => { setActiveFolder(f.id); setSearchQuery(''); setSelectedMessage(null); setSelectedIds(new Set()); }}
                >
                  <Icon size={14} />
                  <span>{f.label}</span>
                  {f.id === 'INBOX' && overview && overview.unreadMessages > 0 && (
                    <Badge>{overview.unreadMessages}</Badge>
                  )}
                </button>
              );
            })}
          </div>
          <div className="gmail-labels-section">
            <button className="gmail-labels-toggle" onClick={() => setLabelsExpanded(!labelsExpanded)}>
              {labelsExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              <span>Labels</span>
            </button>
            {labelsExpanded && labels.map(l => (
              <button
                key={l.id}
                className="gmail-folder-item"
                onClick={() => { setSearchQuery(`label:${l.name}`); setSelectedMessage(null); }}
              >
                <Tag size={12} />
                <span>{l.name}</span>
                {l.messagesUnread ? <Badge>{l.messagesUnread}</Badge> : null}
              </button>
            ))}
          </div>

          <div className="gmail-shortcuts-help">
            <div className="gmail-shortcut-row"><kbd>j</kbd><kbd>k</kbd> Navigate</div>
            <div className="gmail-shortcut-row"><kbd>r</kbd> Reply <kbd>f</kbd> Forward</div>
            <div className="gmail-shortcut-row"><kbd>e</kbd> Archive <kbd>c</kbd> Compose</div>
            <div className="gmail-shortcut-row"><kbd>/</kbd> Search <kbd>#</kbd> Delete</div>
          </div>
        </div>

        {/* Message List */}
        <div className="gmail-message-list">
          <form className="gmail-search" onSubmit={handleSearch}>
            <Search size={14} />
            <input
              type="text"
              placeholder="Search mail (from:devon subject:update)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          {/* Batch toolbar */}
          {selectedIds.size > 0 && (
            <div className="gmail-batch-bar">
              <button className="gmail-batch-btn" onClick={selectAll}>
                {selectedIds.size === messages.length ? <CheckSquare size={14} /> : <Square size={14} />}
                {selectedIds.size} selected
              </button>
              <button className="gmail-batch-btn" onClick={batchArchive}><Archive size={12} /> Archive</button>
              <button className="gmail-batch-btn" onClick={batchTrash}><Trash2 size={12} /> Delete</button>
            </div>
          )}

          {error && (
            <div className="gmail-error"><AlertTriangle size={14} /><span>{error}</span></div>
          )}

          {loading ? (
            <div className="gmail-loading">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} style={{ height: 56, borderRadius: 8, marginBottom: 4 }} />
              ))}
            </div>
          ) : messages.length === 0 ? (
            <EmptyState icon={<Mail size={32} />} title="No messages" description={searchQuery ? 'No results.' : 'Empty.'} />
          ) : (
            <div className="gmail-threads">
              {messages.map((msg, i) => (
                <div key={msg.id} className={`gmail-thread-row ${selectedMessage?.id === msg.id ? 'selected' : ''} ${msg.isUnread ? 'unread' : ''}`}>
                  <button
                    className="gmail-thread-check"
                    onClick={(e) => { e.stopPropagation(); toggleSelect(msg.id); }}
                  >
                    {selectedIds.has(msg.id) ? <CheckSquare size={14} /> : <Square size={14} />}
                  </button>
                  <button className="gmail-thread-content" onClick={() => selectMessage(msg, i)}>
                    <div className="gmail-thread-from">{msg.from?.split('<')[0]?.trim() || 'Unknown'}</div>
                    <div className="gmail-thread-subject">{msg.subject || '(no subject)'}</div>
                    <div className="gmail-thread-snippet">{msg.snippet}</div>
                    <div className="gmail-thread-date">{msg.date ? new Date(msg.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}</div>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail Pane */}
        <div className="gmail-detail-pane">
          <MessageDetail
            message={selectedMessage}
            onArchive={handleArchive}
            onTrash={handleTrash}
            onStar={handleStar}
            onReply={(msg) => { setComposeMode('reply'); setComposeReplyTo(msg); }}
            onForward={(msg) => { setComposeMode('forward'); setComposeReplyTo(msg); }}
            onMarkRead={handleMarkRead}
          />
        </div>
      </div>

      {composeMode && (
        <ComposeModal
          onClose={() => setComposeMode(null)}
          onSend={handleSend}
          mode={composeMode}
          replyTo={composeReplyTo}
        />
      )}

      <style>{`
        .gmail-view { height: 100%; display: flex; flex-direction: column; overflow: hidden; outline: none; }
        .gmail-layout { flex: 1; display: grid; grid-template-columns: 200px 340px 1fr; gap: 1px; background: var(--border); overflow: hidden; }
        .gmail-sidebar { background: var(--bg-surface); padding: var(--space-sm); overflow-y: auto; display: flex; flex-direction: column; }
        .gmail-folders { display: flex; flex-direction: column; gap: 2px; }
        .gmail-folder-item {
          display: flex; align-items: center; gap: var(--space-sm); padding: 8px 12px;
          border: none; background: transparent; color: var(--text-secondary); cursor: pointer;
          border-radius: var(--radius-sm); font-size: 13px; text-align: left; width: 100%;
          transition: var(--transition-fast);
        }
        .gmail-folder-item:hover { background: var(--bg-hover); color: var(--text-primary); }
        .gmail-folder-item.active { background: rgba(0, 240, 255, 0.08); color: var(--cyan); }
        .gmail-labels-section { margin-top: var(--space-md); }
        .gmail-labels-toggle {
          display: flex; align-items: center; gap: 6px; padding: 6px 12px;
          border: none; background: transparent; color: var(--text-muted); cursor: pointer;
          font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; width: 100%;
        }
        .gmail-shortcuts-help {
          margin-top: auto; padding-top: var(--space-md); border-top: 1px solid var(--border);
          display: flex; flex-direction: column; gap: 4px;
        }
        .gmail-shortcut-row { font-size: 10px; color: var(--text-muted); display: flex; align-items: center; gap: 4px; }
        .gmail-shortcut-row kbd {
          display: inline-block; min-width: 16px; text-align: center; padding: 1px 4px;
          background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 3px;
          font-family: var(--font-mono); font-size: 9px; color: var(--text-secondary);
        }
        .gmail-message-list { background: var(--bg-surface); display: flex; flex-direction: column; overflow: hidden; }
        .gmail-search {
          display: flex; align-items: center; gap: var(--space-sm); padding: var(--space-sm) var(--space-md);
          border-bottom: 1px solid var(--border); color: var(--text-muted);
        }
        .gmail-search input { flex: 1; background: transparent; border: none; color: var(--text-primary); font-size: 13px; outline: none; }
        .gmail-search input::placeholder { color: var(--text-muted); }
        .gmail-batch-bar {
          display: flex; align-items: center; gap: var(--space-sm); padding: 6px var(--space-md);
          background: rgba(0, 240, 255, 0.06); border-bottom: 1px solid var(--border);
        }
        .gmail-batch-btn {
          display: flex; align-items: center; gap: 4px; padding: 4px 8px; border: none;
          background: transparent; color: var(--cyan); cursor: pointer; font-size: 12px;
          border-radius: var(--radius-sm);
        }
        .gmail-batch-btn:hover { background: rgba(0, 240, 255, 0.1); }
        .gmail-threads { flex: 1; overflow-y: auto; }
        .gmail-thread-row {
          display: flex; align-items: stretch; border-bottom: 1px solid var(--border);
          transition: var(--transition-fast);
        }
        .gmail-thread-row:hover { background: var(--bg-hover); }
        .gmail-thread-row.selected { background: rgba(0, 240, 255, 0.06); }
        .gmail-thread-row.unread .gmail-thread-from { font-weight: 600; color: var(--text-primary); }
        .gmail-thread-check {
          display: flex; align-items: center; padding: 0 8px; border: none; background: transparent;
          color: var(--text-muted); cursor: pointer;
        }
        .gmail-thread-check:hover { color: var(--cyan); }
        .gmail-thread-content {
          flex: 1; display: grid; grid-template-columns: 130px 1fr auto; grid-template-rows: auto auto;
          padding: 10px 8px 10px 0; cursor: pointer; background: transparent; border: none;
          text-align: left; color: var(--text-secondary); font-size: 13px; gap: 2px 8px;
        }
        .gmail-thread-from { grid-column: 1; grid-row: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .gmail-thread-subject { grid-column: 2; grid-row: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-primary); }
        .gmail-thread-snippet { grid-column: 1 / -1; grid-row: 2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 12px; color: var(--text-muted); }
        .gmail-thread-date { grid-column: 3; grid-row: 1; font-size: 11px; color: var(--text-muted); white-space: nowrap; }
        .gmail-error { display: flex; align-items: center; gap: var(--space-sm); padding: var(--space-md); color: var(--danger, #ef4444); font-size: 13px; background: rgba(239, 68, 68, 0.06); }
        .gmail-loading { padding: var(--space-md); display: flex; flex-direction: column; gap: 4px; }
        .gmail-detail-pane { background: var(--bg-card); overflow-y: auto; }
        .gmail-detail-empty {
          height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: var(--space-md); color: var(--text-muted); font-size: 14px;
        }
        .gmail-shortcut-hint { font-size: 11px; color: var(--text-muted); }
        .gmail-detail { padding: var(--space-lg); }
        .gmail-detail-header { margin-bottom: var(--space-md); }
        .gmail-detail-subject { font-size: 20px; font-weight: 600; color: var(--text-primary); margin: 0 0 var(--space-sm); }
        .gmail-detail-meta { display: flex; align-items: baseline; gap: var(--space-md); font-size: 13px; }
        .gmail-detail-from { color: var(--text-primary); font-weight: 500; }
        .gmail-detail-date { color: var(--text-muted); font-size: 12px; }
        .gmail-detail-to { color: var(--text-muted); font-size: 12px; margin-top: 2px; }
        .gmail-detail-actions {
          display: flex; align-items: center; gap: var(--space-xs); padding: var(--space-sm) 0;
          border-bottom: 1px solid var(--border); margin-bottom: var(--space-sm);
        }
        .gmail-detail-actions-sep { width: 1px; height: 20px; background: var(--border); margin: 0 4px; }
        .gmail-action-btn {
          display: flex; align-items: center; gap: 4px; padding: 6px 10px; border: 1px solid var(--border);
          background: transparent; color: var(--text-secondary); cursor: pointer; border-radius: var(--radius-sm);
          font-size: 12px; transition: var(--transition-fast);
        }
        .gmail-action-btn:hover { background: var(--bg-hover); color: var(--text-primary); border-color: var(--border-active); }
        .gmail-detail-body { color: var(--text-secondary); font-size: 14px; line-height: 1.7; word-break: break-word; }

        /* AI Panel */
        .gmail-ai-panel { margin-bottom: var(--space-md); }
        .gmail-ai-actions-row { display: flex; gap: var(--space-xs); margin-bottom: var(--space-xs); }
        .gmail-ai-btn {
          display: flex; align-items: center; gap: 4px; padding: 5px 10px;
          border: 1px solid rgba(139, 92, 246, 0.3); background: rgba(139, 92, 246, 0.06);
          color: var(--purple, #8B5CF6); cursor: pointer; border-radius: var(--radius-sm);
          font-size: 12px; transition: var(--transition-fast);
        }
        .gmail-ai-btn:hover { background: rgba(139, 92, 246, 0.12); }
        .gmail-ai-btn:disabled { opacity: 0.5; cursor: default; }
        .gmail-ai-loading { font-size: 12px; color: var(--purple, #8B5CF6); padding: var(--space-xs) 0; }
        .gmail-ai-result {
          background: rgba(139, 92, 246, 0.04); border: 1px solid rgba(139, 92, 246, 0.15);
          border-radius: var(--radius-sm); padding: var(--space-sm); margin-top: var(--space-xs);
        }
        .gmail-ai-result-header {
          display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--purple, #8B5CF6);
          font-weight: 600; margin-bottom: var(--space-xs); text-transform: uppercase; letter-spacing: 0.5px;
        }
        .gmail-ai-result-body { font-size: 13px; color: var(--text-secondary); line-height: 1.6; white-space: pre-wrap; }

        /* Icon buttons */
        .gmail-icon-btn {
          display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;
          border: none; background: transparent; color: var(--text-secondary); cursor: pointer;
          border-radius: var(--radius-sm); transition: var(--transition-fast);
        }
        .gmail-icon-btn:hover { background: var(--bg-hover); color: var(--text-primary); }

        /* Compose */
        .gmail-compose-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000;
          display: flex; align-items: center; justify-content: center;
        }
        .gmail-compose-modal { width: 640px; max-height: 85vh; padding: var(--space-lg) !important; overflow-y: auto; }
        .gmail-compose-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-md); }
        .gmail-compose-header h3 { margin: 0; font-size: 16px; color: var(--text-primary); }
        .gmail-compose-fields { display: flex; flex-direction: column; gap: var(--space-sm); }
        .gmail-contact-input-wrap { position: relative; }
        .gmail-contact-input {
          width: 100%; background: var(--bg-input); border: 1px solid var(--border); color: var(--text-primary);
          border-radius: var(--radius-sm); padding: 8px 12px; font-size: 13px; outline: none;
        }
        .gmail-contact-input:focus { border-color: var(--border-active); }
        .gmail-contact-suggestions {
          position: absolute; top: 100%; left: 0; right: 0; z-index: 10;
          background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--radius-sm);
          box-shadow: 0 8px 24px rgba(0,0,0,0.3); max-height: 200px; overflow-y: auto;
        }
        .gmail-suggestion {
          display: flex; flex-direction: column; width: 100%; padding: 8px 12px; border: none;
          background: transparent; cursor: pointer; text-align: left; transition: var(--transition-fast);
        }
        .gmail-suggestion:hover { background: var(--bg-hover); }
        .gmail-suggestion-name { font-size: 13px; color: var(--text-primary); }
        .gmail-suggestion-email { font-size: 11px; color: var(--text-muted); }
        .gmail-ccbcc-toggle {
          border: none; background: transparent; color: var(--cyan); cursor: pointer;
          font-size: 12px; text-align: left; padding: 4px 0;
        }
        .gmail-compose-body {
          width: 100%; background: var(--bg-input); border: 1px solid var(--border); color: var(--text-primary);
          border-radius: var(--radius-sm); padding: var(--space-sm); font-size: 14px; font-family: var(--font-sans);
          resize: vertical; outline: none; line-height: 1.6;
        }
        .gmail-compose-body:focus { border-color: var(--border-active); }
        .gmail-compose-actions { display: flex; gap: var(--space-sm); align-items: center; margin-top: var(--space-md); }
      `}</style>
    </div>
  );
}
