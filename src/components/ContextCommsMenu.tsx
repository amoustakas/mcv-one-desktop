import { useState } from 'react';
import { Mail, Phone, MessageSquare, Hash, Send, X } from 'lucide-react';
import { Button } from './ui';
import { apiPost } from '../lib/api/client';
import { useToast } from './Toasts';

/* ─── Types ──────────────────────────────────────────────────────── */

interface ContextCommsMenuProps {
  contact?: { name: string; email?: string; phone?: string };
  className?: string;
}

type FormType = 'email' | 'sms' | 'call' | 'slack' | null;

/* ─── Component ──────────────────────────────────────────────────── */

export default function ContextCommsMenu({ contact, className }: ContextCommsMenuProps) {
  const { toast } = useToast();
  const [openForm, setOpenForm] = useState<FormType>(null);
  const [sending, setSending] = useState(false);

  // Form state
  const [emailForm, setEmailForm] = useState({ subject: '', body: '' });
  const [smsBody, setSmsBody] = useState('');
  const [slackForm, setSlackForm] = useState({ channel: '', text: '' });

  if (!contact) return null;

  const hasEmail = !!contact.email;
  const hasPhone = !!contact.phone;

  function toggle(type: FormType) {
    setOpenForm(prev => (prev === type ? null : type));
  }

  async function handleEmail() {
    if (!emailForm.subject.trim() || !emailForm.body.trim()) return;
    setSending(true);
    try {
      await apiPost('/api/gmail', { action: 'send', to: contact!.email, subject: emailForm.subject, body: emailForm.body });
      toast('success', `Email sent to ${contact!.name}`);
      setEmailForm({ subject: '', body: '' });
      setOpenForm(null);
    } catch {
      toast('error', 'Failed to send email');
    } finally {
      setSending(false);
    }
  }

  async function handleSms() {
    if (!smsBody.trim()) return;
    setSending(true);
    try {
      await apiPost('/api/twilio', { action: 'send-sms', to: contact!.phone, body: smsBody });
      toast('success', `SMS sent to ${contact!.name}`);
      setSmsBody('');
      setOpenForm(null);
    } catch {
      toast('error', 'Failed to send SMS');
    } finally {
      setSending(false);
    }
  }

  async function handleCall() {
    setSending(true);
    try {
      await apiPost('/api/twilio', { action: 'make-call', to: contact!.phone });
      toast('success', `Calling ${contact!.name}...`);
      setOpenForm(null);
    } catch {
      toast('error', 'Failed to initiate call');
    } finally {
      setSending(false);
    }
  }

  async function handleSlack() {
    if (!slackForm.channel.trim() || !slackForm.text.trim()) return;
    setSending(true);
    try {
      await apiPost('/api/slack', { action: 'send-message', channel: slackForm.channel, text: slackForm.text });
      toast('success', 'Slack message sent');
      setSlackForm({ channel: '', text: '' });
      setOpenForm(null);
    } catch {
      toast('error', 'Failed to send Slack message');
    } finally {
      setSending(false);
    }
  }

  return (
    <span className={`ccm-root ${className || ''}`} onClick={e => e.stopPropagation()}>
      {/* Icon buttons */}
      <span className="ccm-icons">
        {hasEmail && (
          <button className="ccm-btn" title={`Email ${contact.name}`} onClick={() => toggle('email')}>
            <Mail size={13} />
          </button>
        )}
        {hasPhone && (
          <>
            <button className="ccm-btn" title={`Call ${contact.name}`} onClick={() => handleCall()}>
              <Phone size={13} />
            </button>
            <button className="ccm-btn" title={`SMS ${contact.name}`} onClick={() => toggle('sms')}>
              <MessageSquare size={13} />
            </button>
          </>
        )}
        <button className="ccm-btn" title="Slack message" onClick={() => toggle('slack')}>
          <Hash size={13} />
        </button>
      </span>

      {/* Inline forms */}
      {openForm === 'email' && (
        <div className="ccm-form">
          <div className="ccm-form-header">
            <span>Email {contact.name}</span>
            <button className="ccm-close" onClick={() => setOpenForm(null)}><X size={12} /></button>
          </div>
          <input className="ccm-input" value={contact.email || ''} disabled placeholder="To" />
          <input className="ccm-input" value={emailForm.subject} onChange={e => setEmailForm(f => ({ ...f, subject: e.target.value }))} placeholder="Subject" />
          <input className="ccm-input" value={emailForm.body} onChange={e => setEmailForm(f => ({ ...f, body: e.target.value }))} placeholder="Body" />
          <Button size="sm" onClick={handleEmail} disabled={sending}>
            <Send size={11} /> Send
          </Button>
        </div>
      )}

      {openForm === 'sms' && (
        <div className="ccm-form">
          <div className="ccm-form-header">
            <span>SMS {contact.name}</span>
            <button className="ccm-close" onClick={() => setOpenForm(null)}><X size={12} /></button>
          </div>
          <input className="ccm-input" value={contact.phone || ''} disabled placeholder="To" />
          <input className="ccm-input" value={smsBody} onChange={e => setSmsBody(e.target.value)} placeholder="Message" />
          <Button size="sm" onClick={handleSms} disabled={sending}>
            <Send size={11} /> Send
          </Button>
        </div>
      )}

      {openForm === 'slack' && (
        <div className="ccm-form">
          <div className="ccm-form-header">
            <span>Slack Message</span>
            <button className="ccm-close" onClick={() => setOpenForm(null)}><X size={12} /></button>
          </div>
          <input className="ccm-input" value={slackForm.channel} onChange={e => setSlackForm(f => ({ ...f, channel: e.target.value }))} placeholder="#channel" />
          <input className="ccm-input" value={slackForm.text} onChange={e => setSlackForm(f => ({ ...f, text: e.target.value }))} placeholder="Message" />
          <Button size="sm" onClick={handleSlack} disabled={sending}>
            <Send size={11} /> Send
          </Button>
        </div>
      )}

      <style>{`
        .ccm-root { position:relative; display:inline-flex; flex-direction:column; align-items:flex-start; }
        .ccm-icons { display:inline-flex; gap:2px; align-items:center; }
        .ccm-btn {
          display:inline-flex; align-items:center; justify-content:center;
          width:24px; height:24px; padding:0; border:none; border-radius:4px;
          background:transparent; color:var(--text-muted); cursor:pointer;
          transition: color 0.15s, background 0.15s;
        }
        .ccm-btn:hover { color:var(--cyan); background:rgba(0,245,255,0.08); }
        .ccm-form {
          display:flex; flex-direction:column; gap:4px;
          padding:8px; margin-top:4px;
          background:var(--bg-input); border:1px solid var(--border);
          border-radius:6px; min-width:220px;
        }
        .ccm-form-header {
          display:flex; justify-content:space-between; align-items:center;
          font-size:11px; font-weight:600; color:var(--text-primary);
          margin-bottom:2px;
        }
        .ccm-close {
          display:inline-flex; align-items:center; justify-content:center;
          width:18px; height:18px; padding:0; border:none; border-radius:3px;
          background:transparent; color:var(--text-muted); cursor:pointer;
        }
        .ccm-close:hover { color:var(--text-primary); background:rgba(255,255,255,0.06); }
        .ccm-input {
          padding:4px 8px; background:var(--bg-deep, rgba(0,0,0,0.3));
          border:1px solid var(--border); border-radius:4px;
          color:var(--text-primary); font-size:11px; outline:none;
        }
        .ccm-input:focus { border-color:var(--border-active); }
        .ccm-input:disabled { opacity:0.6; }
      `}</style>
    </span>
  );
}
