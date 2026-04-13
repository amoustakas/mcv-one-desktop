import { useState, useEffect, useCallback } from 'react';
import {
  Mail, Inbox, Send, FileText, Trash2, Star, Archive,
  Search, RefreshCw, ChevronRight, ChevronDown, Tag,
  Plus, CornerUpLeft, Forward,
  AlertTriangle, X, Paperclip,
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

type GmailFolder = 'INBOX' | 'SENT' | 'DRAFT' | 'TRASH' | 'STARRED' | 'SPAM' | 'ALL';

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

/** Strip HTML tags for safe text rendering */
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

// ── Compose Modal ──

function ComposeModal({ onClose, onSend }: { onClose: () => void; onSend: (to: string, subject: string, body: string) => void }) {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!to || !subject || !body) return;
    setSending(true);
    try {
      await onSend(to, subject, body);
      onClose();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="gmail-compose-overlay" onClick={onClose}>
      <GlassCard className="gmail-compose-modal" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div className="gmail-compose-header">
          <h3>New Message</h3>
          <button className="gmail-icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="gmail-compose-fields">
          <Input placeholder="To" value={to} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTo(e.target.value)} />
          <Input placeholder="Subject" value={subject} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubject(e.target.value)} />
          <textarea
            className="gmail-compose-body"
            placeholder="Write your message..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={12}
          />
        </div>
        <div className="gmail-compose-actions">
          <Button onClick={handleSend} disabled={sending || !to || !subject}>
            {sending ? 'Sending...' : 'Send'}
          </Button>
          <button className="gmail-icon-btn" title="Attach"><Paperclip size={16} /></button>
        </div>
      </GlassCard>
    </div>
  );
}

// ── Message Detail ──

function MessageDetail({ message, onArchive, onTrash, onStar }: {
  message: GmailMessage | null;
  onArchive: (id: string) => void;
  onTrash: (id: string) => void;
  onStar: (id: string) => void;
}) {
  if (!message) {
    return (
      <div className="gmail-detail-empty">
        <Mail size={48} strokeWidth={1} style={{ color: 'var(--text-muted)' }} />
        <p>Select a message to read</p>
      </div>
    );
  }

  // Safely render body text (strip HTML to prevent XSS)
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
      </div>
      <div className="gmail-detail-actions">
        <button className="gmail-icon-btn" title="Reply"><CornerUpLeft size={14} /></button>
        <button className="gmail-icon-btn" title="Forward"><Forward size={14} /></button>
        <button className="gmail-icon-btn" title="Archive" onClick={() => onArchive(message.id)}><Archive size={14} /></button>
        <button className="gmail-icon-btn" title="Star" onClick={() => onStar(message.id)}><Star size={14} /></button>
        <button className="gmail-icon-btn" title="Delete" onClick={() => onTrash(message.id)}><Trash2 size={14} /></button>
      </div>
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
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [labelsExpanded, setLabelsExpanded] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Load messages when folder/search changes
  const loadMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const folder = FOLDER_ITEMS.find(f => f.id === activeFolder);
      const q = searchQuery || folder?.query || 'in:inbox';
      const data = await gmailApi('search', { q, maxResults: 25 });
      setMessages(data.messages ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load messages';
      setError(msg);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [activeFolder, searchQuery]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  // Load full message when selected
  const selectMessage = async (msg: GmailMessage) => {
    try {
      const full = await gmailApi('get-message', { id: msg.id });
      const parsed = full._parsed ?? full;
      setSelectedMessage({
        id: msg.id,
        threadId: msg.threadId,
        subject: parsed.subject || msg.subject,
        from: parsed.from || msg.from,
        to: parsed.to || '',
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

  // Actions
  const handleSend = async (to: string, subject: string, body: string) => {
    await gmailApi('send', { to, subject, body }, 'POST');
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadMessages();
  };

  return (
    <div className="gmail-view">
      <PageHeader title="Gmail" subtitle={overview ? `${overview.email} — ${overview.unreadMessages} unread` : undefined}>
        <Button onClick={() => setShowCompose(true)}><Plus size={14} /> Compose</Button>
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
                  onClick={() => { setActiveFolder(f.id); setSearchQuery(''); setSelectedMessage(null); }}
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
        </div>

        {/* Message List */}
        <div className="gmail-message-list">
          <form className="gmail-search" onSubmit={handleSearch}>
            <Search size={14} />
            <input
              type="text"
              placeholder="Search mail (e.g. from:devon subject:update)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          {error && (
            <div className="gmail-error">
              <AlertTriangle size={14} />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="gmail-loading">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} style={{ height: 56, borderRadius: 8, marginBottom: 4 }} />
              ))}
            </div>
          ) : messages.length === 0 ? (
            <EmptyState icon={<Mail size={32} />} title="No messages" description={searchQuery ? 'No results for your search.' : 'This folder is empty.'} />
          ) : (
            <div className="gmail-threads">
              {messages.map(msg => (
                <button
                  key={msg.id}
                  className={`gmail-thread-row ${selectedMessage?.id === msg.id ? 'selected' : ''} ${msg.isUnread ? 'unread' : ''}`}
                  onClick={() => selectMessage(msg)}
                >
                  <div className="gmail-thread-from">{msg.from?.split('<')[0]?.trim() || 'Unknown'}</div>
                  <div className="gmail-thread-subject">{msg.subject || '(no subject)'}</div>
                  <div className="gmail-thread-snippet">{msg.snippet}</div>
                  <div className="gmail-thread-date">{msg.date ? new Date(msg.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}</div>
                </button>
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
          />
        </div>
      </div>

      {showCompose && <ComposeModal onClose={() => setShowCompose(false)} onSend={handleSend} />}

      <style>{`
        .gmail-view { height: 100%; display: flex; flex-direction: column; overflow: hidden; }
        .gmail-layout { flex: 1; display: grid; grid-template-columns: 200px 320px 1fr; gap: 1px; background: var(--border); overflow: hidden; }
        .gmail-sidebar { background: var(--bg-surface); padding: var(--space-sm); overflow-y: auto; }
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
        .gmail-message-list { background: var(--bg-surface); display: flex; flex-direction: column; overflow: hidden; }
        .gmail-search {
          display: flex; align-items: center; gap: var(--space-sm); padding: var(--space-sm) var(--space-md);
          border-bottom: 1px solid var(--border); color: var(--text-muted);
        }
        .gmail-search input {
          flex: 1; background: transparent; border: none; color: var(--text-primary); font-size: 13px; outline: none;
        }
        .gmail-search input::placeholder { color: var(--text-muted); }
        .gmail-threads { flex: 1; overflow-y: auto; }
        .gmail-thread-row {
          display: grid; grid-template-columns: 140px 1fr auto; grid-template-rows: auto auto;
          padding: 10px var(--space-md); border-bottom: 1px solid var(--border);
          cursor: pointer; background: transparent; border-left: none; border-right: none; border-top: none;
          width: 100%; text-align: left; transition: var(--transition-fast);
          color: var(--text-secondary); font-size: 13px; gap: 2px 8px;
        }
        .gmail-thread-row:hover { background: var(--bg-hover); }
        .gmail-thread-row.selected { background: rgba(0, 240, 255, 0.06); border-left: 2px solid var(--cyan); }
        .gmail-thread-row.unread { color: var(--text-primary); }
        .gmail-thread-row.unread .gmail-thread-from { font-weight: 600; }
        .gmail-thread-from { grid-column: 1; grid-row: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .gmail-thread-subject { grid-column: 2; grid-row: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-primary); }
        .gmail-thread-snippet { grid-column: 1 / -1; grid-row: 2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 12px; color: var(--text-muted); }
        .gmail-thread-date { grid-column: 3; grid-row: 1; font-size: 11px; color: var(--text-muted); white-space: nowrap; }
        .gmail-error {
          display: flex; align-items: center; gap: var(--space-sm); padding: var(--space-md);
          color: var(--danger, #ef4444); font-size: 13px; background: rgba(239, 68, 68, 0.06);
        }
        .gmail-loading { padding: var(--space-md); display: flex; flex-direction: column; gap: 4px; }
        .gmail-detail-pane { background: var(--bg-card); overflow-y: auto; }
        .gmail-detail-empty {
          height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: var(--space-md); color: var(--text-muted); font-size: 14px;
        }
        .gmail-detail { padding: var(--space-lg); }
        .gmail-detail-header { margin-bottom: var(--space-md); }
        .gmail-detail-subject { font-size: 20px; font-weight: 600; color: var(--text-primary); margin: 0 0 var(--space-sm); }
        .gmail-detail-meta { display: flex; align-items: baseline; gap: var(--space-md); font-size: 13px; }
        .gmail-detail-from { color: var(--text-primary); font-weight: 500; }
        .gmail-detail-date { color: var(--text-muted); font-size: 12px; }
        .gmail-detail-to { color: var(--text-muted); font-size: 12px; margin-top: 4px; }
        .gmail-detail-actions {
          display: flex; gap: var(--space-xs); padding: var(--space-sm) 0; border-bottom: 1px solid var(--border);
          margin-bottom: var(--space-md);
        }
        .gmail-detail-body { color: var(--text-secondary); font-size: 14px; line-height: 1.6; word-break: break-word; }
        .gmail-icon-btn {
          display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;
          border: none; background: transparent; color: var(--text-secondary); cursor: pointer;
          border-radius: var(--radius-sm); transition: var(--transition-fast);
        }
        .gmail-icon-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
        .gmail-compose-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000;
          display: flex; align-items: center; justify-content: center;
        }
        .gmail-compose-modal { width: 600px; max-height: 80vh; padding: var(--space-lg) !important; }
        .gmail-compose-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-md); }
        .gmail-compose-header h3 { margin: 0; font-size: 16px; color: var(--text-primary); }
        .gmail-compose-fields { display: flex; flex-direction: column; gap: var(--space-sm); }
        .gmail-compose-body {
          width: 100%; background: var(--bg-input); border: 1px solid var(--border); color: var(--text-primary);
          border-radius: var(--radius-sm); padding: var(--space-sm); font-size: 14px; font-family: var(--font-sans);
          resize: vertical; outline: none;
        }
        .gmail-compose-body:focus { border-color: var(--border-active); }
        .gmail-compose-actions { display: flex; gap: var(--space-sm); align-items: center; margin-top: var(--space-md); }
      `}</style>
    </div>
  );
}
