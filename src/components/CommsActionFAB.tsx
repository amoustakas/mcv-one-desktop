import { useState, useRef, useEffect } from 'react';
import {
  MessageSquare, Hash, Mail, Phone,
  Send, X, Loader2, ChevronDown, Star,
} from 'lucide-react';
import { apiPost } from '../lib/api/client';
import { useCommsActions, type RecentRecipient } from '../stores/comms-actions';
import { useToast } from './Toasts';
import { GlassCard } from './ui';
import { cn } from '../lib/utils';
import { PLATFORM_META } from '../lib/types/comms';

// ---------------------------------------------------------------------------
// CommsActionFAB — Global floating action button for quick communications
// Always visible on every page. Ctrl+M to toggle.
// ---------------------------------------------------------------------------

type ActionType = 'slack' | 'email' | 'sms' | 'call';

const ACTIONS: Array<{ id: ActionType; icon: typeof Hash; label: string; color: string }> = [
  { id: 'slack', icon: Hash, label: 'Slack', color: '#4A154B' },
  { id: 'email', icon: Mail, label: 'Email', color: '#EA4335' },
  { id: 'sms', icon: MessageSquare, label: 'SMS', color: '#F22F46' },
  { id: 'call', icon: Phone, label: 'Call', color: '#10B981' },
];

export default function CommsActionFAB() {
  const { fabOpen, fabMode, openFab, closeFab, setFabMode, recentRecipients, addRecentRecipient } = useCommsActions();
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Form state
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [channel, setChannel] = useState('');
  const [message, setMessage] = useState('');
  const [_showRecent, setShowRecent] = useState(false);

  // Keyboard shortcut: Ctrl+M
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.ctrlKey && e.key === 'm' && !(e.target as HTMLElement)?.matches?.('input,textarea')) {
        e.preventDefault();
        if (fabOpen) closeFab(); else openFab();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [fabOpen, openFab, closeFab]);

  // Click outside to close
  useEffect(() => {
    if (!fabOpen) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) closeFab();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [fabOpen, closeFab]);

  function resetForm() {
    setTo(''); setSubject(''); setChannel(''); setMessage(''); setShowRecent(false);
  }

  function selectRecent(r: RecentRecipient) {
    setTo(r.target);
    setFabMode(r.platform === 'slack' ? 'slack' : r.platform === 'gmail' ? 'email' : r.platform === 'twilio-sms' ? 'sms' : 'call');
    setShowRecent(false);
  }

  async function handleSend() {
    if (sending) return;
    setSending(true);

    try {
      switch (fabMode) {
        case 'slack':
          if (!channel || !message) { toast('warning', 'Channel and message required'); break; }
          await apiPost('/api/slack', { action: 'send-message', channel, text: message });
          addRecentRecipient({ name: `#${channel}`, platform: 'slack', target: channel });
          toast('success', 'Slack message sent');
          break;

        case 'email':
          if (!to || !message) { toast('warning', 'Recipient and message required'); break; }
          await apiPost('/api/gmail', { action: 'send', to, subject: subject || '(No subject)', body: message });
          addRecentRecipient({ name: to, platform: 'gmail', target: to });
          toast('success', 'Email sent');
          break;

        case 'sms':
          if (!to || !message) { toast('warning', 'Phone number and message required'); break; }
          await apiPost('/api/twilio', { action: 'send-sms', to, body: message });
          addRecentRecipient({ name: to, platform: 'twilio-sms', target: to });
          toast('success', 'SMS sent');
          break;

        case 'call':
          if (!to) { toast('warning', 'Phone number required'); break; }
          await apiPost('/api/twilio', { action: 'make-call', to });
          addRecentRecipient({ name: to, platform: 'twilio-sms', target: to });
          toast('success', `Calling ${to}...`);
          break;
      }
      resetForm();
      closeFab();
    } catch (err) {
      toast('error', `Failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSending(false);
    }
  }

  const platformRecents = fabMode
    ? recentRecipients.filter((r) =>
        fabMode === 'slack' ? r.platform === 'slack' :
        fabMode === 'email' ? r.platform === 'gmail' :
        fabMode === 'sms' || fabMode === 'call' ? r.platform === 'twilio-sms' : false,
      ).slice(0, 5)
    : recentRecipients.slice(0, 8);

  return (
    <div className="cfab-root" ref={panelRef}>
      {/* FAB Button */}
      <button
        className={cn('cfab-btn', fabOpen && 'cfab-btn-open')}
        onClick={() => fabOpen ? closeFab() : openFab()}
        title="Quick Comms (Ctrl+M)"
      >
        {fabOpen ? <X size={18} /> : <MessageSquare size={18} />}
      </button>

      {/* Panel */}
      {fabOpen && (
        <GlassCard className="cfab-panel">
          {/* Action selector */}
          {!fabMode && (
            <div className="cfab-actions">
              <div className="cfab-title">Quick Comms</div>
              <div className="cfab-action-grid">
                {ACTIONS.map((a) => {
                  const Icon = a.icon;
                  return (
                    <button key={a.id} className="cfab-action" onClick={() => { setFabMode(a.id); resetForm(); }}>
                      <div className="cfab-action-icon" style={{ color: a.color }}><Icon size={18} /></div>
                      <span className="cfab-action-label">{a.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Recent recipients */}
              {recentRecipients.length > 0 && (
                <div className="cfab-recent">
                  <div className="cfab-recent-title">Recent</div>
                  {recentRecipients.slice(0, 5).map((r, i) => {
                    const meta = PLATFORM_META[r.platform];
                    return (
                      <button key={i} className="cfab-recent-item" onClick={() => selectRecent(r)}>
                        <span className="cfab-recent-dot" style={{ background: meta?.color }} />
                        <span className="cfab-recent-name">{r.name}</span>
                        <span className="cfab-recent-platform">{meta?.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Compose form */}
          {fabMode && (
            <div className="cfab-compose">
              <div className="cfab-compose-header">
                <button className="cfab-back" onClick={() => setFabMode(null)}><ChevronDown size={14} /></button>
                <span className="cfab-compose-title">
                  {fabMode === 'slack' && 'Slack Message'}
                  {fabMode === 'email' && 'Send Email'}
                  {fabMode === 'sms' && 'Send SMS'}
                  {fabMode === 'call' && 'Make Call'}
                </span>
              </div>

              {/* Recent for this platform */}
              {platformRecents.length > 0 && (
                <div className="cfab-recent-strip">
                  {platformRecents.map((r, i) => (
                    <button key={i} className="cfab-recent-chip" onClick={() => setTo(r.target)}>
                      <Star size={8} /> {r.name}
                    </button>
                  ))}
                </div>
              )}

              {fabMode === 'slack' && (
                <input className="cfab-input" value={channel} onChange={(e) => setChannel(e.target.value)} placeholder="Channel ID or name" autoFocus />
              )}

              {(fabMode === 'email' || fabMode === 'sms' || fabMode === 'call') && (
                <input className="cfab-input" value={to} onChange={(e) => setTo(e.target.value)} placeholder={fabMode === 'email' ? 'to@example.com' : '+1 (555) 123-4567'} autoFocus />
              )}

              {fabMode === 'email' && (
                <input className="cfab-input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
              )}

              {fabMode !== 'call' && (
                <textarea className="cfab-textarea" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message..." rows={3} />
              )}

              <button className="cfab-send" onClick={handleSend} disabled={sending}>
                {sending ? <Loader2 size={14} className="mcv-spin" /> : <Send size={14} />}
                {sending ? 'Sending...' : fabMode === 'call' ? 'Call' : 'Send'}
              </button>
            </div>
          )}
        </GlassCard>
      )}

      <style>{`
        .cfab-root{position:fixed;bottom:100px;right:20px;z-index:900}
        .cfab-btn{width:48px;height:48px;border-radius:50%;border:none;background:linear-gradient(135deg,var(--cyan),var(--purple));color:var(--bg-deep);cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 24px rgba(0,240,255,0.3);transition:all 0.2s}
        .cfab-btn:hover{transform:scale(1.08);box-shadow:0 6px 32px rgba(0,240,255,0.4)}
        .cfab-btn-open{background:var(--bg-elevated);color:var(--text-muted);box-shadow:none}
        .cfab-panel{position:absolute;bottom:56px;right:0;width:320px;padding:14px;animation:cfab-slide 0.2s ease}
        @keyframes cfab-slide{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .cfab-title{font-size:13px;font-weight:600;margin-bottom:10px;color:var(--text-primary)}
        .cfab-action-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px}
        .cfab-action{display:flex;align-items:center;gap:8px;padding:10px 12px;border:1px solid var(--border);border-radius:var(--radius-md);background:transparent;color:var(--text-secondary);cursor:pointer;transition:all var(--transition-fast)}
        .cfab-action:hover{border-color:var(--border-active);background:rgba(0,240,255,0.03)}
        .cfab-action-icon{width:28px;height:28px;border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;background:var(--bg-elevated)}
        .cfab-action-label{font-size:12px;font-weight:500}
        .cfab-recent{border-top:1px solid var(--border);padding-top:8px}
        .cfab-recent-title{font-size:9px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px}
        .cfab-recent-item{display:flex;align-items:center;gap:6px;width:100%;padding:4px 6px;border:none;background:none;color:var(--text-secondary);font-size:11px;cursor:pointer;border-radius:var(--radius-sm)}
        .cfab-recent-item:hover{background:var(--bg-card)}
        .cfab-recent-dot{width:5px;height:5px;border-radius:50%;flex-shrink:0}
        .cfab-recent-name{flex:1;text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .cfab-recent-platform{font-size:9px;color:var(--text-muted)}
        .cfab-compose{display:flex;flex-direction:column;gap:8px}
        .cfab-compose-header{display:flex;align-items:center;gap:6px;margin-bottom:2px}
        .cfab-back{padding:4px;border:none;background:none;color:var(--text-muted);cursor:pointer;border-radius:var(--radius-sm)}
        .cfab-back:hover{color:var(--text-primary)}
        .cfab-compose-title{font-size:13px;font-weight:600}
        .cfab-recent-strip{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:2px}
        .cfab-recent-chip{display:flex;align-items:center;gap:3px;padding:2px 8px;font-size:9px;border:1px solid var(--border);border-radius:var(--radius-full);background:none;color:var(--text-muted);cursor:pointer}
        .cfab-recent-chip:hover{border-color:var(--cyan);color:var(--cyan)}
        .cfab-input{padding:6px 10px;background:var(--bg-input);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text-primary);font-size:12px;outline:none}
        .cfab-input:focus{border-color:var(--border-active)}
        .cfab-textarea{padding:6px 10px;background:var(--bg-input);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text-primary);font-size:12px;resize:none;font-family:var(--font-sans);outline:none}
        .cfab-textarea:focus{border-color:var(--border-active)}
        .cfab-send{display:flex;align-items:center;justify-content:center;gap:6px;padding:8px;border:none;border-radius:var(--radius-sm);background:var(--cyan);color:var(--bg-deep);font-size:12px;font-weight:600;cursor:pointer;transition:opacity 0.15s}
        .cfab-send:hover{opacity:0.9}
        .cfab-send:disabled{opacity:0.5;cursor:not-allowed}
        @media(max-width:768px){.cfab-panel{width:calc(100vw - 40px);right:-10px}}
      `}</style>
    </div>
  );
}
