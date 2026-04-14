import { useMemo, useRef, useState, useEffect } from 'react';
import { Phone, MessageSquare, PhoneIncoming, PhoneOutgoing, Send, User, Clock, FileText, Play } from 'lucide-react';
import { Dialog, DialogActions, Button, Badge, SectionCard, Input, Tooltip } from '../ui';
import { timeAgo, formatDuration } from '../../lib/utils';

export interface ThreadMessage {
  id: string;
  type: 'sms' | 'call' | 'email' | 'note';
  direction?: 'inbound' | 'outbound';
  from?: string;
  to?: string;
  body?: string;
  status?: string;
  timestamp: string;
  duration?: number; // for calls, in seconds
  recording_url?: string;
  transcript?: string;
  media_url?: string;
}

export interface ConversationLike {
  contact_id: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  contact_avatar?: string;
  messages: ThreadMessage[];
  tags?: string[];
  notes?: string;
}

export default function ConversationDetailDialog({
  open,
  onClose,
  conversation,
  onSendSms,
  onMakeCall,
}: {
  open: boolean;
  onClose: () => void;
  conversation: ConversationLike | null;
  onSendSms?: (to: string, body: string) => Promise<void> | void;
  onMakeCall?: (to: string) => Promise<void> | void;
}) {
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Sort messages chronologically (oldest first) so newest appears at bottom
  const sortedMessages = useMemo(() => {
    if (!conversation) return [];
    return [...conversation.messages].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [conversation]);

  useEffect(() => {
    if (open && bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [open, sortedMessages.length]);

  if (!conversation) return null;

  const phone = conversation.contact_phone || '';
  const name = conversation.contact_name || phone || conversation.contact_id;
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const stats = useMemo(() => {
    const sms = sortedMessages.filter((m) => m.type === 'sms');
    const calls = sortedMessages.filter((m) => m.type === 'call');
    const totalDuration = calls.reduce((s, c) => s + (c.duration || 0), 0);
    const inbound = sortedMessages.filter((m) => m.direction === 'inbound').length;
    const outbound = sortedMessages.filter((m) => m.direction === 'outbound').length;
    return { smsCount: sms.length, callCount: calls.length, totalDuration, inbound, outbound };
  }, [sortedMessages]);

  const handleSend = async () => {
    if (!reply.trim() || !onSendSms || !phone) return;
    setSending(true);
    try {
      await onSendSms(phone, reply.trim());
      setReply('');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title={
        <span className="conv-dlg-title">
          <span className="conv-avatar" aria-hidden>{initials}</span>
          {name}
          {conversation.tags?.map((t) => <Badge key={t} size="sm" color="#8B5CF6">{t}</Badge>)}
        </span>
      }
      description={
        <span className="conv-dlg-desc">
          {phone && <span><Phone size={10} /> {phone}</span>}
          {conversation.contact_email && <span>· <a href={`mailto:${conversation.contact_email}`}>{conversation.contact_email}</a></span>}
        </span>
      }
      footer={
        <DialogActions align="between">
          <div className="conv-dlg-stats">
            <span><MessageSquare size={11} /> {stats.smsCount} SMS</span>
            <span><Phone size={11} /> {stats.callCount} calls · {formatDuration(stats.totalDuration * 1000)}</span>
            <span>{stats.inbound} in · {stats.outbound} out</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {onMakeCall && phone && (
              <Tooltip content={`Call ${phone}`}>
                <Button variant="ghost" size="sm" icon={<Phone size={13} />} onClick={() => onMakeCall(phone)}>
                  Call
                </Button>
              </Tooltip>
            )}
            <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
          </div>
        </DialogActions>
      }
    >
      <div className="conv-dlg-layout">
        <div className="conv-dlg-thread">
          <div ref={bodyRef} className="conv-thread-body">
            {sortedMessages.length === 0 ? (
              <p className="conv-empty">No messages in this conversation yet.</p>
            ) : (
              sortedMessages.map((msg) => <ThreadBubble key={msg.id} msg={msg} />)
            )}
          </div>

          {onSendSms && phone && (
            <div className="conv-reply-bar">
              <Input
                value={reply}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReply(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={`Reply to ${name}…`}
                disabled={sending}
              />
              <Button
                variant="primary"
                size="sm"
                icon={<Send size={13} />}
                onClick={handleSend}
                disabled={!reply.trim() || sending}
              >
                Send
              </Button>
            </div>
          )}
        </div>

        <aside className="conv-dlg-side">
          <SectionCard title="Contact" icon={<User size={14} />} padding="md">
            <dl className="conv-meta">
              <div><dt>Name</dt><dd>{conversation.contact_name || '—'}</dd></div>
              <div><dt>Phone</dt><dd style={{ fontFamily: 'var(--font-mono)' }}>{phone || '—'}</dd></div>
              <div><dt>Email</dt><dd>{conversation.contact_email || '—'}</dd></div>
            </dl>
          </SectionCard>

          <SectionCard title="Last activity" icon={<Clock size={14} />} padding="md">
            <div className="conv-last">
              {sortedMessages.length > 0 ? timeAgo(sortedMessages[sortedMessages.length - 1].timestamp) : 'No activity'}
            </div>
          </SectionCard>

          {conversation.notes && (
            <SectionCard title="Notes" icon={<FileText size={14} />}>
              <p className="conv-notes">{conversation.notes}</p>
            </SectionCard>
          )}
        </aside>
      </div>

      <style>{`
        .conv-dlg-title { display: inline-flex; align-items: center; gap: 10px; }
        .conv-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, var(--cyan), var(--purple)); display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: var(--bg-deep); letter-spacing: 0.5px; }
        .conv-dlg-desc { display: inline-flex; align-items: center; gap: 8px; font-size: 12px; }
        .conv-dlg-desc a { color: var(--cyan); text-decoration: none; }
        .conv-dlg-desc a:hover { text-decoration: underline; }
        .conv-dlg-stats { display: inline-flex; gap: 14px; font-size: 11px; color: var(--text-muted); }
        .conv-dlg-stats span { display: inline-flex; align-items: center; gap: 4px; }

        .conv-dlg-layout { display: grid; grid-template-columns: 1fr 260px; gap: 16px; height: 520px; }
        @media (max-width: 900px) { .conv-dlg-layout { grid-template-columns: 1fr; height: auto; } }

        .conv-dlg-thread { display: flex; flex-direction: column; gap: 10px; min-height: 0; }
        .conv-thread-body { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding: 4px 2px; }
        .conv-reply-bar { display: grid; grid-template-columns: 1fr auto; gap: 8px; align-items: center; padding-top: 10px; border-top: 1px solid var(--border); }
        .conv-empty { font-size: 12px; color: var(--text-muted); text-align: center; padding: 40px 16px; }

        .conv-dlg-side { display: flex; flex-direction: column; gap: 10px; overflow-y: auto; }
        .conv-meta { display: flex; flex-direction: column; gap: 6px; font-size: 12px; }
        .conv-meta > div { display: flex; justify-content: space-between; gap: 8px; }
        .conv-meta dt { color: var(--text-muted); }
        .conv-meta dd { color: var(--text-primary); font-weight: 500; overflow: hidden; text-overflow: ellipsis; }
        .conv-last { font-size: 13px; color: var(--cyan); font-family: var(--font-mono); }
        .conv-notes { font-size: 12px; color: var(--text-secondary); line-height: 1.5; white-space: pre-wrap; }
      `}</style>
    </Dialog>
  );
}

// ──────────────────────────────────────────────
// Thread bubble
// ──────────────────────────────────────────────

const TYPE_META: Record<ThreadMessage['type'], { label: string; icon: React.ElementType; color: string }> = {
  sms:   { label: 'SMS',   icon: MessageSquare, color: '#00F0FF' },
  call:  { label: 'Call',  icon: Phone,         color: '#8B5CF6' },
  email: { label: 'Email', icon: FileText,      color: '#F59E0B' },
  note:  { label: 'Note',  icon: FileText,      color: '#6B7280' },
};

function ThreadBubble({ msg }: { msg: ThreadMessage }) {
  const meta = TYPE_META[msg.type];
  const Icon = meta.icon;
  const isOutbound = msg.direction === 'outbound';
  const isCall = msg.type === 'call';

  return (
    <div className={`conv-bubble conv-bubble-${msg.direction || 'system'}`}>
      <div className="conv-bubble-meta">
        {msg.direction === 'inbound' ? <PhoneIncoming size={10} /> : msg.direction === 'outbound' ? <PhoneOutgoing size={10} /> : null}
        <span className="conv-bubble-type" style={{ color: meta.color }}>
          <Icon size={10} /> {meta.label}
        </span>
        {msg.status && <Badge color={msg.status === 'delivered' || msg.status === 'completed' ? '#10B981' : '#F59E0B'} size="sm">{msg.status}</Badge>}
        <span className="conv-bubble-time">{timeAgo(msg.timestamp)}</span>
      </div>

      {isCall ? (
        <div className="conv-bubble-call">
          <div className="conv-bubble-call-duration">
            {isOutbound ? <PhoneOutgoing size={14} /> : <PhoneIncoming size={14} />}
            <span>{msg.duration !== undefined ? formatDuration(msg.duration * 1000) : 'Call'}</span>
          </div>
          {msg.recording_url && (
            <a href={msg.recording_url} target="_blank" rel="noreferrer" className="conv-bubble-play">
              <Play size={12} /> Play recording
            </a>
          )}
          {msg.transcript && (
            <details className="conv-bubble-transcript">
              <summary>Transcript</summary>
              <p>{msg.transcript}</p>
            </details>
          )}
        </div>
      ) : (
        <div className="conv-bubble-body">{msg.body || '(no content)'}</div>
      )}

      <style>{`
        .conv-bubble { max-width: 75%; padding: 8px 12px; border-radius: var(--radius-md); border: 1px solid var(--border); display: flex; flex-direction: column; gap: 4px; }
        .conv-bubble-inbound { align-self: flex-start; background: var(--bg-card); }
        .conv-bubble-outbound { align-self: flex-end; background: rgba(0, 240, 255, 0.08); border-color: rgba(0, 240, 255, 0.2); }
        .conv-bubble-system { align-self: center; background: transparent; border-style: dashed; max-width: 90%; font-style: italic; }
        .conv-bubble-meta { display: inline-flex; align-items: center; gap: 6px; font-size: 10px; color: var(--text-muted); }
        .conv-bubble-type { display: inline-flex; align-items: center; gap: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .conv-bubble-time { margin-left: auto; font-family: var(--font-mono); }
        .conv-bubble-body { font-size: 13px; color: var(--text-primary); line-height: 1.4; word-break: break-word; white-space: pre-wrap; }
        .conv-bubble-call { display: flex; flex-direction: column; gap: 6px; }
        .conv-bubble-call-duration { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-secondary); }
        .conv-bubble-call-duration span { font-family: var(--font-mono); font-weight: 600; color: var(--text-primary); }
        .conv-bubble-play { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: var(--cyan); text-decoration: none; }
        .conv-bubble-play:hover { text-decoration: underline; }
        .conv-bubble-transcript { margin-top: 4px; }
        .conv-bubble-transcript summary { font-size: 11px; color: var(--text-muted); cursor: pointer; user-select: none; }
        .conv-bubble-transcript p { font-size: 11px; color: var(--text-secondary); margin-top: 4px; line-height: 1.4; white-space: pre-wrap; }
      `}</style>
    </div>
  );
}
