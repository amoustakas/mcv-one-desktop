import { useState, useEffect } from 'react';
import {
  MessageSquare, Hash, Gamepad2, Mail, Phone, Send,
  Inbox, Radio, BarChart3,
  Users, Megaphone, Activity, Search, RefreshCw,
  ExternalLink, CheckCircle, XCircle, AlertTriangle, Wifi,
  Heart, Share2, Eye, MessageCircle, ChevronRight,
  Calendar, PhoneCall, PhoneOff, PhoneIncoming, PhoneOutgoing,
  Clock, Video, MapPin, Plus, Archive, Star, Trash2,
} from 'lucide-react';
import { useCommsStore } from '../stores/comms';
import { useNavigation } from '../stores/navigation';
import { ventures } from '../lib/ventures';
import { useToast } from '../components/Toasts';
import {
  useUnifiedInbox, useCommsChannels, useSocialFeed,
  usePlatformStatuses, useSendMessage, useBroadcast,
  useSlackUsers, useDiscordGuilds, useDiscordMembers,
  useUpcomingEvents, useCalendarOverview, useQuickAddEvent,
  useRecentCalls, useMakeCall, useGmailOverview,
  useArchiveEmail, useStarEmail, useTrashEmail,
} from '../hooks/use-comms';
import {
  PageHeader, Button, GlassCard, Badge, StatCard, Tabs,
  EmptyState, GridLayout,
} from '../components/ui';
import { timeAgo } from '../lib/utils';
import type {
  CommsPlatform, CommsTab, UnifiedMessage, UnifiedChannel,
  SocialPost, PlatformStatus,
} from '../lib/types/comms';
import { PLATFORM_META } from '../lib/types/comms';
import CommsSyncStatus from '../components/comms/CommsSyncStatus';
import { usePresenceStore, STATUS_COLORS, STATUS_LABELS } from '../stores/presence';

// ── Constants ──

const COMMS_TABS: Array<{ id: CommsTab; label: string }> = [
  { id: 'inbox', label: 'Inbox' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'calls', label: 'Calls' },
  { id: 'channels', label: 'Channels' },
  { id: 'compose', label: 'Compose' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'social', label: 'Social' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'broadcast', label: 'Broadcast' },
  { id: 'status', label: 'Status' },
];

const PLATFORM_ICONS: Record<CommsPlatform, typeof Hash> = {
  slack: Hash,
  discord: Gamepad2,
  gmail: Mail,
  'twilio-sms': MessageSquare,
  'twilio-whatsapp': Phone,
  twitter: Hash,
  linkedin: Share2,
  youtube: Radio,
};

function PlatformIcon({ platform, size = 14 }: { platform: CommsPlatform; size?: number }) {
  const Icon = PLATFORM_ICONS[platform] || Radio;
  const meta = PLATFORM_META[platform];
  return <Icon size={size} style={{ color: meta?.color }} />;
}

// ═══════════════════════════════════════════
// Platform Filter Chips
// ═══════════════════════════════════════════

function PlatformFilters() {
  const { activePlatforms, togglePlatform } = useCommsStore();

  return (
    <div className="comms-platform-chips">
      {Object.values(PLATFORM_META).map((meta) => {
        const active = activePlatforms.includes(meta.id);
        return (
          <button
            key={meta.id}
            className={`comms-chip ${active ? 'comms-chip-active' : ''}`}
            onClick={() => togglePlatform(meta.id)}
            style={active ? { borderColor: meta.color, color: meta.color } : undefined}
          >
            <PlatformIcon platform={meta.id} size={12} />
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════
// Tab: Inbox
// ═══════════════════════════════════════════

function InboxTab() {
  const { inboxFilter, setInboxFilter, searchQuery, setSearchQuery, selectMessage, ventureFilter } = useCommsStore();
  const { data: messages = [], isLoading, refetch } = useUnifiedInbox();

  const filtered = messages.filter((m) => {
    if (ventureFilter && m.ventureId !== ventureFilter) return false;
    if (inboxFilter === 'unread' && m.isRead) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return m.content.toLowerCase().includes(q) ||
             m.author.name.toLowerCase().includes(q) ||
             m.channelName.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="comms-inbox">
      <div className="comms-inbox-controls">
        <div className="comms-filter-group">
          {(['all', 'unread'] as const).map((f) => (
            <button
              key={f}
              className={`comms-filter-btn ${inboxFilter === f ? 'comms-filter-active' : ''}`}
              onClick={() => setInboxFilter(f)}
            >
              {f === 'all' ? 'All' : 'Unread'}
            </button>
          ))}
        </div>
        <div className="comms-search">
          <Search size={12} />
          <input
            className="comms-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages..."
          />
        </div>
        <button className="comms-refresh-btn" onClick={() => refetch()}>
          <RefreshCw size={12} className={isLoading ? 'mcv-spin' : ''} />
        </button>
      </div>

      {filtered.length === 0 && !isLoading && (
        <EmptyState icon={<Inbox size={28} />} title="No messages" description="Connect platforms in the Status tab to see messages here." />
      )}

      <div className="comms-message-list">
        {filtered.map((msg) => (
          <MessageRow key={`${msg.platform}-${msg.id}`} message={msg} onClick={() => selectMessage(msg)} />
        ))}
      </div>
    </div>
  );
}

function MessageRow({ message, onClick }: { message: UnifiedMessage; onClick: () => void }) {
  const venture = message.ventureId ? ventures.find((v) => v.id === message.ventureId) : null;
  const archiveEmail = useArchiveEmail();
  const starEmail = useStarEmail();
  const trashEmail = useTrashEmail();
  const isGmail = message.platform === 'gmail';

  return (
    <div className="comms-msg-row" onClick={onClick} role="button" tabIndex={0}>
      <div className="comms-msg-platform">
        <PlatformIcon platform={message.platform} size={16} />
      </div>
      <div className="comms-msg-body">
        <div className="comms-msg-header">
          <span className="comms-msg-author">{message.author.name}</span>
          {message.channelName && (
            <span className="comms-msg-channel">
              <ChevronRight size={10} /> {message.channelName}
            </span>
          )}
          {venture && (
            <span className="comms-msg-venture" style={{ color: venture.color }}>{venture.name}</span>
          )}
          <span className="comms-msg-time">{timeAgo(message.timestamp)}</span>
        </div>
        <div className="comms-msg-preview">{message.content.slice(0, 200)}</div>
      </div>
      {/* Triage actions (Gmail) */}
      {isGmail && (
        <div className="comms-msg-actions" onClick={(e) => e.stopPropagation()}>
          <button className="comms-triage-btn" title="Archive" onClick={() => archiveEmail.mutate(message.id)}><Archive size={12} /></button>
          <button className="comms-triage-btn" title="Star" onClick={() => starEmail.mutate(message.id)}><Star size={12} /></button>
          <button className="comms-triage-btn comms-triage-danger" title="Trash" onClick={() => trashEmail.mutate(message.id)}><Trash2 size={12} /></button>
        </div>
      )}
      {!message.isRead && <div className="comms-msg-unread-dot" />}
    </div>
  );
}

// ═══════════════════════════════════════════
// Live Command Strip (always visible above tabs)
// ═══════════════════════════════════════════

function PresenceWidget() {
  const presence = usePresenceStore((s) => s.ownPresence);
  const deviceCount = usePresenceStore((s) => s.getDeviceCount());
  if (!presence) return null;
  const color = STATUS_COLORS[presence.status];
  return (
    <div className="lcs-widget">
      <span className="lcs-icon" style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
      <div className="lcs-widget-body">
        <span className="lcs-widget-label">{STATUS_LABELS[presence.status]}</span>
        <span className="lcs-widget-value">
          {presence.city && `${presence.city} · `}{deviceCount} device{deviceCount !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}

function LiveCommandStrip() {
  const { data: calOverview } = useCalendarOverview();
  const { data: events = [] } = useUpcomingEvents(3);
  const { data: calls = [] } = useRecentCalls(5);
  const { data: gmailOv } = useGmailOverview();
  const { data: messages = [] } = useUnifiedInbox();
  const [now, setNow] = useState(Date.now());

  // Tick every 30s for countdown
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const nextEvent = events[0];
  const activeCalls = calls.filter((c) => c.status === 'in-progress' || c.status === 'ringing' || c.status === 'queued');
  const unreadEmails = gmailOv?.unreadMessages ?? 0;
  const totalUnread = messages.filter((m) => !m.isRead).length;

  // Time until next event
  let nextIn = '';
  if (nextEvent) {
    const diff = new Date(nextEvent.start).getTime() - now;
    if (diff < 0) nextIn = 'Now';
    else if (diff < 60_000) nextIn = '<1m';
    else if (diff < 3_600_000) nextIn = `${Math.floor(diff / 60_000)}m`;
    else nextIn = `${Math.floor(diff / 3_600_000)}h ${Math.floor((diff % 3_600_000) / 60_000)}m`;
  }

  return (
    <div className="lcs">
      {/* Next Meeting */}
      <div className="lcs-widget">
        <Calendar size={13} className="lcs-icon" style={{ color: 'var(--cyan)' }} />
        {nextEvent ? (
          <div className="lcs-widget-body">
            <span className="lcs-widget-label">{nextIn}</span>
            <span className="lcs-widget-value">{nextEvent.summary}</span>
            {nextEvent.hangoutLink && (
              <a href={nextEvent.hangoutLink} target="_blank" rel="noopener noreferrer" className="lcs-join-btn">
                <Video size={10} /> Join
              </a>
            )}
          </div>
        ) : (
          <span className="lcs-widget-value lcs-muted">No meetings</span>
        )}
      </div>

      {/* Active Calls */}
      <div className={`lcs-widget ${activeCalls.length > 0 ? 'lcs-widget-live' : ''}`}>
        <PhoneCall size={13} className="lcs-icon" style={{ color: activeCalls.length > 0 ? 'var(--success)' : 'var(--text-muted)' }} />
        <div className="lcs-widget-body">
          <span className="lcs-widget-label">Calls</span>
          <span className="lcs-widget-value">{activeCalls.length > 0 ? `${activeCalls.length} active` : 'None'}</span>
        </div>
      </div>

      {/* Unread Messages */}
      <div className="lcs-widget">
        <MessageSquare size={13} className="lcs-icon" style={{ color: totalUnread > 0 ? 'var(--warning)' : 'var(--text-muted)' }} />
        <div className="lcs-widget-body">
          <span className="lcs-widget-label">Messages</span>
          <span className="lcs-widget-value">{totalUnread > 0 ? totalUnread : 'Clear'}</span>
        </div>
      </div>

      {/* Gmail Unread */}
      <div className="lcs-widget">
        <Mail size={13} className="lcs-icon" style={{ color: unreadEmails > 0 ? '#EA4335' : 'var(--text-muted)' }} />
        <div className="lcs-widget-body">
          <span className="lcs-widget-label">Email</span>
          <span className="lcs-widget-value">{unreadEmails > 0 ? `${unreadEmails} unread` : 'Clear'}</span>
        </div>
      </div>

      {/* Upcoming Count */}
      <div className="lcs-widget">
        <Clock size={13} className="lcs-icon" style={{ color: 'var(--purple)' }} />
        <div className="lcs-widget-body">
          <span className="lcs-widget-label">Today</span>
          <span className="lcs-widget-value">{calOverview?.upcoming_events ?? 0} events</span>
        </div>
      </div>

      {/* Presence */}
      <PresenceWidget />
    </div>
  );
}

// ═══════════════════════════════════════════
// Tab: Calendar
// ═══════════════════════════════════════════

function CalendarTab() {
  const { data: events = [], isLoading, refetch } = useUpcomingEvents(20);
  const quickAdd = useQuickAddEvent();
  const [quickText, setQuickText] = useState('');
  const { toast } = useToast();

  async function handleQuickAdd() {
    if (!quickText.trim()) return;
    try {
      await quickAdd.mutateAsync(quickText);
      toast('success', 'Event created');
      setQuickText('');
    } catch (err) {
      toast('error', `Failed: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  }

  // Group events by day
  const grouped = events.reduce<Record<string, typeof events>>((acc, ev) => {
    const day = new Date(ev.start).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    (acc[day] ??= []).push(ev);
    return acc;
  }, {});

  return (
    <div className="comms-calendar">
      {/* Quick add */}
      <div className="cal-quick-add">
        <input
          className="comms-input cal-quick-input"
          value={quickText}
          onChange={(e) => setQuickText(e.target.value)}
          placeholder='Quick add: "Meeting with Devon at 3pm tomorrow"'
          onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
        />
        <Button variant="primary" size="sm" icon={<Plus size={12} />} onClick={handleQuickAdd} disabled={quickAdd.isPending}>
          {quickAdd.isPending ? 'Adding...' : 'Add'}
        </Button>
        <button className="comms-refresh-btn" onClick={() => refetch()}>
          <RefreshCw size={12} className={isLoading ? 'mcv-spin' : ''} />
        </button>
      </div>

      {events.length === 0 && !isLoading && (
        <EmptyState icon={<Calendar size={28} />} title="No upcoming events" description="Connect Google Calendar to see your schedule." />
      )}

      {Object.entries(grouped).map(([day, dayEvents]) => (
        <div key={day} className="cal-day-group">
          <div className="cal-day-header">{day}</div>
          {dayEvents.map((ev) => {
            const startTime = new Date(ev.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            const endTime = new Date(ev.end).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            const isNow = new Date(ev.start) <= new Date() && new Date(ev.end) >= new Date();

            return (
              <GlassCard key={ev.id} className={`cal-event ${isNow ? 'cal-event-now' : ''}`}>
                <div className="cal-event-time">
                  <span className="cal-time-start">{startTime}</span>
                  <span className="cal-time-end">{endTime}</span>
                </div>
                <div className="cal-event-body">
                  <div className="cal-event-title">
                    {isNow && <span className="cal-live-dot" />}
                    {ev.summary}
                  </div>
                  {ev.location && (
                    <div className="cal-event-meta"><MapPin size={10} /> {ev.location}</div>
                  )}
                  {ev.attendees && ev.attendees.length > 0 && (
                    <div className="cal-event-meta"><Users size={10} /> {ev.attendees.length} attendee{ev.attendees.length !== 1 ? 's' : ''}</div>
                  )}
                </div>
                <div className="cal-event-actions">
                  {ev.hangoutLink && (
                    <a href={ev.hangoutLink} target="_blank" rel="noopener noreferrer" className="cal-join-btn">
                      <Video size={12} /> Join
                    </a>
                  )}
                  {ev.htmlLink && (
                    <a href={ev.htmlLink} target="_blank" rel="noopener noreferrer" className="cal-link-btn">
                      <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════
// Tab: Calls
// ═══════════════════════════════════════════

function CallsTab() {
  const { data: calls = [], isLoading, refetch } = useRecentCalls(30);
  const makeCallMut = useMakeCall();
  const [dialNumber, setDialNumber] = useState('');
  const { toast } = useToast();

  const activeCalls = calls.filter((c) => c.status === 'in-progress' || c.status === 'ringing' || c.status === 'queued');
  const recentCalls = calls.filter((c) => c.status !== 'in-progress' && c.status !== 'ringing' && c.status !== 'queued');

  async function handleDial() {
    if (!dialNumber.trim()) return;
    try {
      await makeCallMut.mutateAsync({ to: dialNumber });
      toast('success', `Calling ${dialNumber}...`);
      setDialNumber('');
    } catch (err) {
      toast('error', `Call failed: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case 'in-progress': return <PhoneCall size={12} style={{ color: 'var(--success)' }} />;
      case 'ringing': case 'queued': return <PhoneIncoming size={12} style={{ color: 'var(--warning)' }} />;
      case 'completed': return <PhoneOff size={12} style={{ color: 'var(--text-muted)' }} />;
      case 'busy': case 'no-answer': return <PhoneOff size={12} style={{ color: 'var(--warning)' }} />;
      case 'failed': case 'canceled': return <PhoneOff size={12} style={{ color: 'var(--error)' }} />;
      default: return <Phone size={12} />;
    }
  };

  const directionIcon = (dir: string) =>
    dir === 'inbound' ? <PhoneIncoming size={10} /> : <PhoneOutgoing size={10} />;

  return (
    <div className="comms-calls">
      {/* Dialer */}
      <GlassCard className="calls-dialer">
        <div className="calls-dialer-row">
          <Phone size={14} style={{ color: 'var(--cyan)' }} />
          <input
            className="comms-input calls-dial-input"
            value={dialNumber}
            onChange={(e) => setDialNumber(e.target.value)}
            placeholder="+1 (555) 123-4567"
            onKeyDown={(e) => e.key === 'Enter' && handleDial()}
          />
          <Button variant="primary" size="sm" icon={<PhoneCall size={12} />} onClick={handleDial} disabled={makeCallMut.isPending || !dialNumber.trim()}>
            {makeCallMut.isPending ? 'Dialing...' : 'Call'}
          </Button>
          <button className="comms-refresh-btn" onClick={() => refetch()}>
            <RefreshCw size={12} className={isLoading ? 'mcv-spin' : ''} />
          </button>
        </div>
      </GlassCard>

      {/* Active Calls */}
      {activeCalls.length > 0 && (
        <div className="calls-section">
          <h3 className="comms-section-title">
            <span className="cal-live-dot" /> Active Calls
          </h3>
          {activeCalls.map((call) => (
            <GlassCard key={call.sid} className="calls-card calls-card-active">
              <div className="calls-card-icon">{statusIcon(call.status)}</div>
              <div className="calls-card-body">
                <span className="calls-card-number">{call.direction === 'inbound' ? call.from : call.to}</span>
                <span className="calls-card-status">{call.status} {directionIcon(call.direction)}</span>
              </div>
              <span className="calls-card-duration">{call.duration}s</span>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Recent Calls */}
      <div className="calls-section">
        <h3 className="comms-section-title">Recent Calls</h3>
        {recentCalls.length === 0 && !isLoading && (
          <EmptyState icon={<Phone size={24} />} title="No recent calls" description="Connect Twilio to see call history." />
        )}
        {recentCalls.map((call) => (
          <div key={call.sid} className="calls-row">
            <div className="calls-row-icon">{statusIcon(call.status)}</div>
            <div className="calls-row-body">
              <span className="calls-row-number">{call.direction === 'inbound' ? call.from : call.to}</span>
              <span className="calls-row-meta">
                {directionIcon(call.direction)} {call.direction} &middot; {call.duration}s
              </span>
            </div>
            <span className="comms-msg-time">{timeAgo(call.dateCreated)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Tab: Channels
// ═══════════════════════════════════════════

function ChannelsTab() {
  const { data: channels = [], isLoading } = useCommsChannels();
  const { selectChannel, ventureFilter } = useCommsStore();

  const filteredChannels = ventureFilter
    ? channels.filter((ch) => ch.ventureId === ventureFilter || !ch.ventureId)
    : channels;

  // Group by platform
  const grouped = filteredChannels.reduce<Record<string, UnifiedChannel[]>>((acc, ch) => {
    (acc[ch.platform] ??= []).push(ch);
    return acc;
  }, {});

  if (filteredChannels.length === 0 && !isLoading) {
    return <EmptyState icon={<Hash size={28} />} title="No channels" description="Connect Slack or Discord to see channels." />;
  }

  return (
    <div className="comms-channels">
      {Object.entries(grouped).map(([platform, chs]) => (
        <div key={platform} className="comms-channel-group">
          <div className="comms-channel-group-header">
            <PlatformIcon platform={platform as CommsPlatform} size={14} />
            <span>{PLATFORM_META[platform as CommsPlatform]?.label || platform}</span>
            <Badge size="sm">{chs.length}</Badge>
          </div>
          <GridLayout cols={3} gap="sm">
            {chs.map((ch) => (
              <GlassCard
                key={`${ch.platform}-${ch.id}`}
                className="comms-channel-card"
                onClick={() => selectChannel(ch.platform, ch.id)}
              >
                <div className="comms-channel-name">{ch.name}</div>
                <div className="comms-channel-meta">
                  {ch.memberCount !== undefined && (
                    <span className="comms-channel-members"><Users size={10} /> {ch.memberCount}</span>
                  )}
                  <span className="comms-channel-type">{ch.type}</span>
                  {ch.unreadCount !== undefined && ch.unreadCount > 0 && (
                    <Badge size="sm" variant="dot">{ch.unreadCount}</Badge>
                  )}
                </div>
              </GlassCard>
            ))}
          </GridLayout>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════
// Tab: Compose
// ═══════════════════════════════════════════

function ComposeTab() {
  const { composeTarget, composeDraft, setComposeDraft, closeCompose } = useCommsStore();
  const [platform, setPlatform] = useState<CommsPlatform>(composeTarget?.platform || 'slack');
  const [channelId, setChannelId] = useState(composeTarget?.channelId || '');
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const sendMessage = useSendMessage();
  const { toast } = useToast();
  const { data: channels = [] } = useCommsChannels();

  const isDirectMessage = platform === 'twilio-sms' || platform === 'twilio-whatsapp' || platform === 'gmail';
  const platformChannels = channels.filter((ch) => ch.platform === platform);

  async function handleSend() {
    if (!composeDraft.content.trim()) return;
    try {
      await sendMessage.mutateAsync({
        platform,
        channelId: isDirectMessage ? '' : channelId,
        content: composeDraft.content,
        to: isDirectMessage ? to : undefined,
        subject: platform === 'gmail' ? subject : undefined,
      });
      toast('success', 'Message sent');
      setComposeDraft({ content: '' });
      setTo('');
      setSubject('');
      closeCompose();
    } catch (err) {
      toast('error', `Send failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  return (
    <div className="comms-compose">
      <GlassCard className="comms-compose-form">
        <div className="comms-compose-row">
          <label className="comms-label">Platform</label>
          <select
            className="comms-select"
            value={platform}
            onChange={(e) => { setPlatform(e.target.value as CommsPlatform); setChannelId(''); }}
          >
            {['slack', 'discord', 'gmail', 'twilio-sms', 'twilio-whatsapp'].map((p) => (
              <option key={p} value={p}>{PLATFORM_META[p as CommsPlatform]?.label}</option>
            ))}
          </select>
        </div>

        {isDirectMessage ? (
          <div className="comms-compose-row">
            <label className="comms-label">{platform === 'gmail' ? 'To (email)' : 'To (phone)'}</label>
            <input className="comms-input" value={to} onChange={(e) => setTo(e.target.value)} placeholder={platform === 'gmail' ? 'email@example.com' : '+1234567890'} />
          </div>
        ) : (
          <div className="comms-compose-row">
            <label className="comms-label">Channel</label>
            {platformChannels.length > 0 ? (
              <select className="comms-select" value={channelId} onChange={(e) => setChannelId(e.target.value)}>
                <option value="">Select a channel...</option>
                {platformChannels.map((ch) => (
                  <option key={ch.id} value={ch.id}>{ch.name}</option>
                ))}
              </select>
            ) : (
              <input className="comms-input" value={channelId} onChange={(e) => setChannelId(e.target.value)} placeholder="Channel ID (connect platform for picker)" />
            )}
          </div>
        )}

        {platform === 'gmail' && (
          <div className="comms-compose-row">
            <label className="comms-label">Subject</label>
            <input className="comms-input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject" />
          </div>
        )}

        <div className="comms-compose-row">
          <label className="comms-label">Message</label>
          <textarea
            className="comms-textarea"
            rows={6}
            value={composeDraft.content}
            onChange={(e) => setComposeDraft({ ...composeDraft, content: e.target.value })}
            placeholder="Type your message..."
          />
        </div>

        <div className="comms-compose-actions">
          <Button variant="primary" icon={<Send size={13} />} onClick={handleSend} disabled={sendMessage.isPending || !composeDraft.content.trim()}>
            {sendMessage.isPending ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}

// ═══════════════════════════════════════════
// Tab: Analytics (placeholder with KPIs)
// ═══════════════════════════════════════════

function AnalyticsTab() {
  const { data: messages = [] } = useUnifiedInbox();
  const statuses = usePlatformStatuses();

  const connectedCount = statuses.filter((s) => s.connected).length;
  const totalMessages = messages.length;
  const platformCounts = messages.reduce<Record<string, number>>((acc, m) => {
    acc[m.platform] = (acc[m.platform] || 0) + 1;
    return acc;
  }, {});
  const mostActive = Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="comms-analytics">
      <GridLayout cols={4} gap="sm" className="comms-kpis">
        <StatCard icon={<MessageSquare size={13} />} label="Total Messages" value={totalMessages} color="var(--cyan)" />
        <StatCard icon={<Wifi size={13} />} label="Connected" value={`${connectedCount}/8`} color="var(--success)" />
        <StatCard
          icon={<Activity size={13} />}
          label="Most Active"
          value={mostActive ? PLATFORM_META[mostActive[0] as CommsPlatform]?.label || mostActive[0] : 'N/A'}
          color="var(--purple)"
        />
        <StatCard icon={<Inbox size={13} />} label="Unread" value={messages.filter((m) => !m.isRead).length} color="var(--warning)" />
      </GridLayout>

      <GlassCard className="comms-analytics-breakdown">
        <h3 className="comms-section-title">Message Distribution</h3>
        <div className="comms-analytics-bars">
          {Object.entries(platformCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([platform, count]) => {
              const meta = PLATFORM_META[platform as CommsPlatform];
              const pct = totalMessages > 0 ? Math.round((count / totalMessages) * 100) : 0;
              return (
                <div key={platform} className="comms-bar-row">
                  <div className="comms-bar-label">
                    <PlatformIcon platform={platform as CommsPlatform} size={12} />
                    <span>{meta?.label || platform}</span>
                  </div>
                  <div className="comms-bar-track">
                    <div className="comms-bar-fill" style={{ width: `${pct}%`, backgroundColor: meta?.color }} />
                  </div>
                  <span className="comms-bar-value">{count}</span>
                </div>
              );
            })}
        </div>
        {Object.keys(platformCounts).length === 0 && (
          <EmptyState icon={<BarChart3 size={24} />} title="No data yet" description="Send and receive messages to see analytics." />
        )}
      </GlassCard>
    </div>
  );
}

// ═══════════════════════════════════════════
// Tab: Social
// ═══════════════════════════════════════════

function SocialTab() {
  const { socialPlatform, setSocialPlatform } = useCommsStore();
  const { data: posts = [], isLoading } = useSocialFeed(socialPlatform);

  const socialTabs = [
    { id: 'twitter' as const, label: 'X / Twitter' },
    { id: 'linkedin' as const, label: 'LinkedIn' },
    { id: 'youtube' as const, label: 'YouTube' },
  ];

  return (
    <div className="comms-social">
      <Tabs
        tabs={socialTabs.map((t) => ({ id: t.id, label: t.label }))}
        active={socialPlatform}
        onChange={(id) => setSocialPlatform(id as typeof socialPlatform)}
        className="comms-social-tabs"
      />

      {posts.length === 0 && !isLoading && (
        <EmptyState icon={<Radio size={24} />} title={`No ${socialPlatform} posts`} description="Connect the platform and configure credentials to see posts." />
      )}

      <div className="comms-social-feed">
        {posts.map((post) => (
          <SocialPostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}

function SocialPostCard({ post }: { post: SocialPost }) {
  return (
    <GlassCard className="comms-social-card">
      <div className="comms-social-header">
        <PlatformIcon platform={post.platform} size={14} />
        <span className="comms-social-author">{post.author.name}</span>
        <span className="comms-social-handle">{post.author.handle}</span>
        <span className="comms-social-time">{timeAgo(post.timestamp)}</span>
      </div>
      <div className="comms-social-content">{post.content}</div>
      <div className="comms-social-metrics">
        <span><Heart size={11} /> {post.metrics.likes}</span>
        <span><Share2 size={11} /> {post.metrics.shares}</span>
        <span><MessageCircle size={11} /> {post.metrics.comments}</span>
        {post.metrics.views !== undefined && <span><Eye size={11} /> {post.metrics.views}</span>}
      </div>
      {post.url && (
        <a href={post.url} target="_blank" rel="noopener noreferrer" className="comms-social-link">
          <ExternalLink size={11} /> View
        </a>
      )}
    </GlassCard>
  );
}

// ═══════════════════════════════════════════
// Tab: Contacts
// ═══════════════════════════════════════════

function ContactsTab() {
  const { data: slackUsers = [], isLoading: slackLoading } = useSlackUsers();
  const { data: guilds = [] } = useDiscordGuilds();
  const firstGuildId = guilds[0]?.id || '';
  const { data: discordMembers = [], isLoading: discordLoading } = useDiscordMembers(firstGuildId);
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState<'all' | 'slack' | 'discord'>('all');

  // Deduplicate contacts across platforms by name (case-insensitive)
  const allContacts = [...slackUsers, ...discordMembers];
  const deduped = new Map<string, typeof allContacts[0]>();
  for (const contact of allContacts) {
    const key = contact.name.toLowerCase().trim();
    const existing = deduped.get(key);
    if (existing) {
      // Merge platforms
      const existingIds = new Set(existing.platforms.map((p) => `${p.platform}-${p.platformId}`));
      for (const p of contact.platforms) {
        if (!existingIds.has(`${p.platform}-${p.platformId}`)) {
          existing.platforms.push(p);
        }
      }
      // Prefer avatar from whichever has one
      if (!existing.avatarUrl && contact.avatarUrl) existing.avatarUrl = contact.avatarUrl;
      if (!existing.email && contact.email) existing.email = contact.email;
    } else {
      deduped.set(key, { ...contact, platforms: [...contact.platforms] });
    }
  }

  const contacts = Array.from(deduped.values());
  const isLoading = slackLoading || discordLoading;

  const filtered = contacts.filter((u) => {
    if (platformFilter !== 'all' && !u.platforms.some((p) => p.platform === platformFilter)) return false;
    if (search) {
      const q = search.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    }
    return true;
  });

  const slackCount = contacts.filter((c) => c.platforms.some((p) => p.platform === 'slack')).length;
  const discordCount = contacts.filter((c) => c.platforms.some((p) => p.platform === 'discord')).length;
  const multiPlatformCount = contacts.filter((c) => c.platforms.length > 1).length;

  return (
    <div className="comms-contacts">
      <GridLayout cols={4} gap="sm" className="comms-kpis">
        <StatCard icon={<Users size={13} />} label="Total Contacts" value={contacts.length} color="var(--cyan)" />
        <StatCard icon={<Hash size={13} />} label="Slack" value={slackCount} color="#4A154B" />
        <StatCard icon={<Gamepad2 size={13} />} label="Discord" value={discordCount} color="#5865F2" />
        <StatCard icon={<Share2 size={13} />} label="Multi-Platform" value={multiPlatformCount} color="var(--purple)" />
      </GridLayout>

      <div className="comms-contacts-controls">
        <div className="comms-filter-group">
          {(['all', 'slack', 'discord'] as const).map((f) => (
            <button key={f} className={`comms-filter-btn ${platformFilter === f ? 'comms-filter-active' : ''}`} onClick={() => setPlatformFilter(f)}>
              {f === 'all' ? 'All' : PLATFORM_META[f]?.label}
            </button>
          ))}
        </div>
        <div className="comms-search">
          <Search size={12} />
          <input className="comms-search-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search contacts..." />
        </div>
      </div>

      {filtered.length === 0 && !isLoading && (
        <EmptyState icon={<Users size={24} />} title="No contacts" description="Connect Slack or Discord to see team members." />
      )}

      <div className="comms-contact-list">
        {filtered.map((contact) => (
          <div key={contact.id} className="comms-contact-row">
            {contact.avatarUrl ? (
              <img src={contact.avatarUrl} alt="" className="comms-contact-avatar" />
            ) : (
              <div className="comms-contact-avatar-placeholder"><Users size={14} /></div>
            )}
            <div className="comms-contact-info">
              <span className="comms-contact-name">{contact.name}</span>
              {contact.email && <span className="comms-contact-email">{contact.email}</span>}
            </div>
            <div className="comms-contact-platforms">
              {contact.platforms.map((p) => (
                <PlatformIcon key={`${p.platform}-${p.platformId}`} platform={p.platform} size={12} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Tab: Broadcast
// ═══════════════════════════════════════════

function BroadcastTab() {
  const [selectedPlatforms, setSelectedPlatforms] = useState<CommsPlatform[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState('');
  const [smsRecipients, setSmsRecipients] = useState('');
  const { toast } = useToast();
  const { data: channels = [] } = useCommsChannels();
  const broadcast = useBroadcast();

  function toggleBroadcastPlatform(p: CommsPlatform) {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  }

  function toggleChannel(platform: string, channelId: string) {
    setSelectedChannels((prev) => {
      const current = prev[platform] || [];
      const updated = current.includes(channelId)
        ? current.filter((id) => id !== channelId)
        : [...current, channelId];
      return { ...prev, [platform]: updated };
    });
  }

  async function handleBroadcast() {
    if (!message.trim()) return;

    const targets: Array<{ platform: CommsPlatform; channelId: string; to?: string }> = [];

    for (const platform of selectedPlatforms) {
      if (platform === 'twilio-sms' || platform === 'twilio-whatsapp') {
        // Parse comma-separated phone numbers
        const numbers = smsRecipients.split(',').map((n) => n.trim()).filter(Boolean);
        for (const num of numbers) {
          targets.push({ platform, channelId: '', to: num });
        }
      } else {
        const chIds = selectedChannels[platform] || [];
        for (const chId of chIds) {
          targets.push({ platform, channelId: chId });
        }
      }
    }

    if (targets.length === 0) {
      toast('warning', 'No targets selected');
      return;
    }

    try {
      const result = await broadcast.mutateAsync({ targets, content: message });
      toast('success', `Broadcast complete: ${result.succeeded}/${result.total} sent`);
      if (result.failed > 0) {
        toast('warning', `${result.failed} target${result.failed > 1 ? 's' : ''} failed`);
      }
      setMessage('');
    } catch (err) {
      toast('error', `Broadcast failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  const totalTargets = selectedPlatforms.reduce((sum, p) => {
    if (p === 'twilio-sms' || p === 'twilio-whatsapp') {
      return sum + smsRecipients.split(',').filter((n) => n.trim()).length;
    }
    return sum + (selectedChannels[p]?.length || 0);
  }, 0);

  return (
    <div className="comms-broadcast">
      <GlassCard className="comms-broadcast-form">
        <h3 className="comms-section-title">Cross-Platform Broadcast</h3>
        <p className="comms-subtitle">Send the same message to multiple channels across platforms.</p>

        <div className="comms-broadcast-targets">
          {(['slack', 'discord', 'twilio-sms', 'twilio-whatsapp'] as CommsPlatform[]).map((p) => (
            <label key={p} className="comms-broadcast-checkbox">
              <input type="checkbox" checked={selectedPlatforms.includes(p)} onChange={() => toggleBroadcastPlatform(p)} />
              <PlatformIcon platform={p} size={12} />
              {PLATFORM_META[p].label}
            </label>
          ))}
        </div>

        {/* Channel selectors per platform */}
        {selectedPlatforms.filter((p) => p === 'slack' || p === 'discord').map((platform) => {
          const platformChs = channels.filter((ch) => ch.platform === platform);
          if (platformChs.length === 0) return null;
          return (
            <div key={platform} className="comms-broadcast-channels">
              <label className="comms-label">{PLATFORM_META[platform].label} Channels</label>
              <div className="comms-broadcast-channel-list">
                {platformChs.map((ch) => (
                  <label key={ch.id} className="comms-broadcast-checkbox">
                    <input type="checkbox" checked={(selectedChannels[platform] || []).includes(ch.id)} onChange={() => toggleChannel(platform, ch.id)} />
                    {ch.name}
                  </label>
                ))}
              </div>
            </div>
          );
        })}

        {/* SMS/WhatsApp recipients */}
        {selectedPlatforms.some((p) => p === 'twilio-sms' || p === 'twilio-whatsapp') && (
          <div className="comms-compose-row">
            <label className="comms-label">Recipients (comma-separated phone numbers)</label>
            <input className="comms-input" value={smsRecipients} onChange={(e) => setSmsRecipients(e.target.value)} placeholder="+1234567890, +0987654321" />
          </div>
        )}

        <textarea
          className="comms-textarea"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your broadcast message..."
        />

        <div className="comms-compose-actions">
          <Badge>{totalTargets} target{totalTargets !== 1 ? 's' : ''} across {selectedPlatforms.length} platform{selectedPlatforms.length !== 1 ? 's' : ''}</Badge>
          <Button
            variant="primary"
            icon={<Megaphone size={13} />}
            disabled={totalTargets === 0 || !message.trim() || broadcast.isPending}
            onClick={handleBroadcast}
          >
            {broadcast.isPending ? 'Sending...' : 'Broadcast'}
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}

// ═══════════════════════════════════════════
// Tab: Status
// ═══════════════════════════════════════════

function StatusTab() {
  const statuses = usePlatformStatuses();
  const { setView } = useNavigation();

  const healthIcon = (s: PlatformStatus) => {
    if (s.health === 'active') return <CheckCircle size={14} style={{ color: 'var(--success)' }} />;
    if (s.health === 'degraded') return <AlertTriangle size={14} style={{ color: 'var(--warning)' }} />;
    return <XCircle size={14} style={{ color: 'var(--error)' }} />;
  };

  return (
    <div className="comms-status">
      {/* Data Ingestion Pipeline Status */}
      <CommsSyncStatus />

      {/* Automation Trigger Rules */}

      {/* Platform Connection Status */}
      <GridLayout cols={2} gap="sm">
        {statuses.map((s) => {
          const meta = PLATFORM_META[s.platform];
          return (
            <GlassCard key={s.platform} className={`comms-status-card comms-status-${s.health}`}>
              <div className="comms-status-header">
                <PlatformIcon platform={s.platform} size={18} />
                <span className="comms-status-name">{meta.label}</span>
                {healthIcon(s)}
              </div>
              <div className="comms-status-detail">
                <Badge size="sm" variant={s.connected ? 'default' : 'outline'}>
                  {s.connected ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>
            </GlassCard>
          );
        })}
      </GridLayout>

      <div className="comms-status-footer">
        <Button variant="secondary" size="sm" onClick={() => setView('settings')}>
          Manage Integrations
        </Button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Message Detail Panel (slide-out)
// ═══════════════════════════════════════════

function MessageDetail({ message, onClose }: { message: UnifiedMessage; onClose: () => void }) {
  return (
    <div className="comms-detail-panel">
      <div className="comms-detail-header">
        <PlatformIcon platform={message.platform} size={16} />
        <span className="comms-detail-title">{message.channelName || message.platform}</span>
        <button className="comms-detail-close" onClick={onClose}>&times;</button>
      </div>
      <div className="comms-detail-message">
        <div className="comms-detail-author">
          <strong>{message.author.name}</strong>
          <span className="comms-msg-time">{timeAgo(message.timestamp)}</span>
        </div>
        <div className="comms-detail-content">{message.content}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Main View
// ═══════════════════════════════════════════

export default function CommsHub() {
  const {
    activeTab, setActiveTab, ventureFilter, setVentureFilter,
    selectedMessage, closeThread, threadOpen,
  } = useCommsStore();
  const { data: messages = [] } = useUnifiedInbox();
  const statuses = usePlatformStatuses();

  const connectedCount = statuses.filter((s) => s.connected).length;

  return (
    <div className="comms-hub">
      <PageHeader icon={<MessageSquare size={20} />} title="Communications Hub" count={messages.length}>
        <PlatformFilters />
        <select
          className="comms-venture-select"
          value={ventureFilter || ''}
          onChange={(e) => setVentureFilter(e.target.value || null)}
        >
          <option value="">All Ventures</option>
          {ventures.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
      </PageHeader>

      <LiveCommandStrip />

      <Tabs
        tabs={COMMS_TABS.map((t) => ({
          ...t,
          count: t.id === 'inbox' ? messages.length :
                 t.id === 'status' ? connectedCount : undefined,
        }))}
        active={activeTab}
        onChange={(id) => setActiveTab(id as CommsTab)}
      />

      <div className={`comms-body ${threadOpen ? 'comms-body-split' : ''}`}>
        <div className="comms-main">
          {activeTab === 'inbox' && <InboxTab />}
          {activeTab === 'calendar' && <CalendarTab />}
          {activeTab === 'calls' && <CallsTab />}
          {activeTab === 'channels' && <ChannelsTab />}
          {activeTab === 'compose' && <ComposeTab />}
          {activeTab === 'analytics' && <AnalyticsTab />}
          {activeTab === 'social' && <SocialTab />}
          {activeTab === 'contacts' && <ContactsTab />}
          {activeTab === 'broadcast' && <BroadcastTab />}
          {activeTab === 'status' && <StatusTab />}
        </div>

        {threadOpen && selectedMessage && (
          <MessageDetail message={selectedMessage} onClose={closeThread} />
        )}
      </div>

      <style>{`
        .comms-hub{height:100%;display:flex;flex-direction:column;overflow:hidden}
        .comms-platform-chips{display:flex;gap:4px;flex-wrap:wrap}
        .comms-chip{display:flex;align-items:center;gap:4px;padding:3px 8px;font-size:10px;border:1px solid var(--border);border-radius:var(--radius-full);background:transparent;color:var(--text-muted);cursor:pointer;transition:all var(--transition-fast);white-space:nowrap}
        .comms-chip:hover{border-color:var(--border-active);color:var(--text-secondary)}
        .comms-chip-active{background:rgba(0,240,255,0.06);border-color:var(--border-active);color:var(--text-primary)}
        .comms-venture-select{padding:4px 8px;background:var(--bg-input);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text-secondary);font-size:10px}
        .comms-body{flex:1;overflow:hidden;display:flex}
        .comms-body-split .comms-main{flex:1;min-width:0}
        .comms-main{flex:1;overflow-y:auto;padding:12px 20px}
        .comms-inbox-controls{display:flex;align-items:center;gap:8px;margin-bottom:12px}
        .comms-filter-group{display:flex;gap:2px;background:var(--bg-input);border-radius:var(--radius-sm);padding:2px}
        .comms-filter-btn{padding:4px 10px;font-size:10px;border:none;background:transparent;color:var(--text-muted);border-radius:var(--radius-sm);cursor:pointer;transition:all var(--transition-fast)}
        .comms-filter-active{background:var(--bg-card);color:var(--text-primary)}
        .comms-search{display:flex;align-items:center;gap:6px;padding:4px 10px;background:var(--bg-input);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text-muted);flex:1;max-width:280px}
        .comms-search-input{background:none;border:none;color:var(--text-primary);font-size:11px;width:100%;outline:none}
        .comms-refresh-btn{padding:6px;background:none;border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text-muted);cursor:pointer;display:flex}
        .comms-refresh-btn:hover{border-color:var(--border-active);color:var(--text-secondary)}
        .comms-message-list{display:flex;flex-direction:column;gap:1px}
        .comms-msg-row{display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border-bottom:1px solid var(--border);cursor:pointer;transition:background var(--transition-fast)}
        .comms-msg-row:hover{background:var(--bg-card)}
        .comms-msg-platform{width:28px;height:28px;border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;background:var(--bg-elevated);flex-shrink:0}
        .comms-msg-body{flex:1;min-width:0}
        .comms-msg-header{display:flex;align-items:center;gap:6px;font-size:11px;margin-bottom:2px}
        .comms-msg-author{font-weight:600;color:var(--text-primary)}
        .comms-msg-channel{color:var(--text-muted);display:flex;align-items:center;gap:2px;font-size:10px}
        .comms-msg-time{color:var(--text-muted);font-size:10px;font-family:var(--font-mono);margin-left:auto;flex-shrink:0}
        .comms-msg-preview{font-size:12px;color:var(--text-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .comms-msg-unread-dot{width:8px;height:8px;border-radius:50%;background:var(--cyan);flex-shrink:0;margin-top:8px}
        .comms-channels{display:flex;flex-direction:column;gap:20px}
        .comms-channel-group-header{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:600;color:var(--text-secondary);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.3px}
        .comms-channel-card{cursor:pointer;transition:border-color var(--transition-fast)}
        .comms-channel-card:hover{border-color:var(--border-active)}
        .comms-channel-name{font-size:13px;font-weight:500;margin-bottom:4px}
        .comms-channel-meta{display:flex;align-items:center;gap:8px;font-size:10px;color:var(--text-muted)}
        .comms-channel-members{display:flex;align-items:center;gap:3px}
        .comms-channel-type{text-transform:capitalize}
        .comms-compose{max-width:640px}
        .comms-compose-form{display:flex;flex-direction:column;gap:12px;padding:16px}
        .comms-compose-row{display:flex;flex-direction:column;gap:4px}
        .comms-label{font-size:10px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px}
        .comms-select{padding:6px 10px;background:var(--bg-input);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text-primary);font-size:12px}
        .comms-input{padding:6px 10px;background:var(--bg-input);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text-primary);font-size:12px}
        .comms-input:focus,.comms-select:focus{border-color:var(--border-active);outline:none}
        .comms-textarea{padding:10px;background:var(--bg-input);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text-primary);font-size:12px;resize:vertical;font-family:var(--font-sans)}
        .comms-textarea:focus{border-color:var(--border-active);outline:none}
        .comms-compose-actions{display:flex;justify-content:flex-end;gap:8px;align-items:center}
        .comms-analytics{display:flex;flex-direction:column;gap:16px}
        .comms-kpis{padding:0}
        .comms-section-title{font-family:var(--font-display);font-size:12px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px}
        .comms-analytics-bars{display:flex;flex-direction:column;gap:8px}
        .comms-bar-row{display:flex;align-items:center;gap:10px}
        .comms-bar-label{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text-secondary);width:100px;flex-shrink:0}
        .comms-bar-track{flex:1;height:6px;background:var(--bg-input);border-radius:3px;overflow:hidden}
        .comms-bar-fill{height:100%;border-radius:3px;transition:width var(--transition-base)}
        .comms-bar-value{font-size:11px;font-family:var(--font-mono);color:var(--text-muted);width:36px;text-align:right}
        .comms-social{display:flex;flex-direction:column;gap:12px}
        .comms-social-tabs{margin-bottom:4px}
        .comms-social-feed{display:flex;flex-direction:column;gap:8px}
        .comms-social-card{padding:14px}
        .comms-social-header{display:flex;align-items:center;gap:8px;font-size:12px;margin-bottom:8px}
        .comms-social-author{font-weight:600}
        .comms-social-handle{color:var(--text-muted);font-size:11px}
        .comms-social-time{color:var(--text-muted);font-size:10px;font-family:var(--font-mono);margin-left:auto}
        .comms-social-content{font-size:13px;color:var(--text-primary);line-height:1.5;margin-bottom:10px}
        .comms-social-metrics{display:flex;gap:16px;font-size:11px;color:var(--text-muted)}
        .comms-social-metrics span{display:flex;align-items:center;gap:4px}
        .comms-social-link{display:inline-flex;align-items:center;gap:4px;font-size:10px;color:var(--cyan);text-decoration:none;margin-top:6px}
        .comms-social-link:hover{text-decoration:underline}
        .comms-contacts-controls{margin-bottom:12px}
        .comms-contact-list{display:flex;flex-direction:column;gap:1px}
        .comms-contact-row{display:flex;align-items:center;gap:10px;padding:8px 12px;border-bottom:1px solid var(--border);transition:background var(--transition-fast)}
        .comms-contact-row:hover{background:var(--bg-card)}
        .comms-contact-avatar{width:28px;height:28px;border-radius:50%;object-fit:cover;flex-shrink:0}
        .comms-contact-avatar-placeholder{width:28px;height:28px;border-radius:50%;background:var(--bg-elevated);display:flex;align-items:center;justify-content:center;color:var(--text-muted);flex-shrink:0}
        .comms-contact-info{flex:1;min-width:0}
        .comms-contact-name{display:block;font-size:12px;font-weight:500}
        .comms-contact-email{display:block;font-size:10px;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .comms-contact-platforms{display:flex;gap:6px}
        .comms-broadcast{max-width:640px}
        .comms-broadcast-form{display:flex;flex-direction:column;gap:12px;padding:16px}
        .comms-subtitle{font-size:11px;color:var(--text-muted);margin-top:-6px}
        .comms-broadcast-targets{display:flex;flex-wrap:wrap;gap:10px}
        .comms-broadcast-checkbox{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text-secondary);cursor:pointer}
        .comms-broadcast-checkbox input{accent-color:var(--cyan)}
        .comms-status{display:flex;flex-direction:column;gap:16px}
        .comms-status-card{padding:14px;display:flex;flex-direction:column;gap:8px}
        .comms-status-active{border-left:2px solid var(--success)}
        .comms-status-degraded{border-left:2px solid var(--warning)}
        .comms-status-disconnected{border-left:2px solid var(--border)}
        .comms-status-error{border-left:2px solid var(--error)}
        .comms-status-header{display:flex;align-items:center;gap:8px}
        .comms-status-name{font-size:13px;font-weight:500;flex:1}
        .comms-status-detail{display:flex;gap:6px}
        .comms-status-footer{display:flex;justify-content:center;padding:8px}
        .comms-detail-panel{width:360px;flex-shrink:0;border-left:1px solid var(--border);background:var(--bg-surface);display:flex;flex-direction:column;overflow:hidden}
        .comms-detail-header{display:flex;align-items:center;gap:8px;padding:12px 14px;border-bottom:1px solid var(--border);flex-shrink:0}
        .comms-detail-title{font-size:13px;font-weight:600;flex:1}
        .comms-detail-close{background:none;border:none;color:var(--text-muted);font-size:18px;cursor:pointer;padding:2px 6px}
        .comms-detail-close:hover{color:var(--text-primary)}
        .comms-detail-message{padding:14px;flex:1;overflow-y:auto}
        .comms-detail-author{display:flex;align-items:center;gap:8px;margin-bottom:8px}
        .comms-detail-content{font-size:13px;color:var(--text-primary);line-height:1.6;white-space:pre-wrap}
        .comms-msg-venture{font-size:9px;padding:1px 6px;background:var(--bg-elevated);border-radius:3px;font-weight:500}
        .comms-broadcast-channels{display:flex;flex-direction:column;gap:4px}
        .comms-broadcast-channel-list{display:flex;flex-wrap:wrap;gap:6px;max-height:120px;overflow-y:auto;padding:6px;background:var(--bg-input);border:1px solid var(--border);border-radius:var(--radius-sm)}

        /* ── Live Command Strip ── */
        .lcs{display:flex;gap:6px;padding:6px 20px;border-bottom:1px solid var(--border);overflow-x:auto;flex-shrink:0}
        .lcs-widget{display:flex;align-items:center;gap:8px;padding:6px 12px;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-md);min-width:0;flex-shrink:0}
        .lcs-widget-live{border-color:var(--success);background:rgba(16,185,129,0.05);animation:lcs-pulse 2s infinite}
        @keyframes lcs-pulse{0%,100%{opacity:1}50%{opacity:0.7}}
        .lcs-icon{flex-shrink:0}
        .lcs-widget-body{display:flex;flex-direction:column;min-width:0}
        .lcs-widget-label{font-size:9px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px}
        .lcs-widget-value{font-size:11px;font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:140px}
        .lcs-muted{color:var(--text-muted);font-weight:400}
        .lcs-join-btn{display:inline-flex;align-items:center;gap:3px;font-size:9px;padding:2px 6px;border-radius:3px;background:rgba(0,240,255,0.1);color:var(--cyan);text-decoration:none;border:1px solid rgba(0,240,255,0.2);margin-top:2px;white-space:nowrap}
        .lcs-join-btn:hover{background:rgba(0,240,255,0.2)}

        /* ── Calendar Tab ── */
        .comms-calendar{display:flex;flex-direction:column;gap:12px}
        .cal-quick-add{display:flex;gap:6px;align-items:center;margin-bottom:8px}
        .cal-quick-input{flex:1}
        .cal-day-group{margin-bottom:8px}
        .cal-day-header{font-family:var(--font-display);font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;padding:4px 0;margin-bottom:6px;border-bottom:1px solid var(--border)}
        .cal-event{display:flex;gap:12px;align-items:flex-start;padding:10px 12px;margin-bottom:4px}
        .cal-event-now{border-left:2px solid var(--success);background:rgba(16,185,129,0.03)}
        .cal-event-time{display:flex;flex-direction:column;align-items:flex-end;min-width:65px;flex-shrink:0}
        .cal-time-start{font-size:12px;font-weight:600;font-family:var(--font-mono)}
        .cal-time-end{font-size:10px;color:var(--text-muted);font-family:var(--font-mono)}
        .cal-event-body{flex:1;min-width:0}
        .cal-event-title{font-size:13px;font-weight:500;display:flex;align-items:center;gap:6px}
        .cal-live-dot{width:6px;height:6px;border-radius:50%;background:var(--success);animation:lcs-pulse 2s infinite;flex-shrink:0}
        .cal-event-meta{font-size:10px;color:var(--text-muted);display:flex;align-items:center;gap:4px;margin-top:3px}
        .cal-event-actions{display:flex;gap:4px;flex-shrink:0;align-items:center}
        .cal-join-btn{display:flex;align-items:center;gap:4px;padding:4px 10px;font-size:11px;font-weight:500;border-radius:var(--radius-sm);background:rgba(0,240,255,0.08);color:var(--cyan);border:1px solid rgba(0,240,255,0.2);text-decoration:none;white-space:nowrap}
        .cal-join-btn:hover{background:rgba(0,240,255,0.15)}
        .cal-link-btn{padding:4px;color:var(--text-muted);text-decoration:none}
        .cal-link-btn:hover{color:var(--text-primary)}

        /* ── Calls Tab ── */
        .comms-calls{display:flex;flex-direction:column;gap:12px}
        .calls-dialer{padding:12px}
        .calls-dialer-row{display:flex;align-items:center;gap:8px}
        .calls-dial-input{flex:1;font-size:14px;font-family:var(--font-mono)}
        .calls-section{margin-bottom:8px}
        .calls-card{display:flex;align-items:center;gap:10px;padding:10px 12px;margin-bottom:4px}
        .calls-card-active{border-left:2px solid var(--success);animation:lcs-pulse 2s infinite}
        .calls-card-icon{width:28px;height:28px;border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;background:var(--bg-elevated);flex-shrink:0}
        .calls-card-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
        .calls-card-number{font-size:13px;font-weight:500;font-family:var(--font-mono)}
        .calls-card-status{font-size:10px;color:var(--text-muted);display:flex;align-items:center;gap:4px;text-transform:capitalize}
        .calls-card-duration{font-size:11px;font-family:var(--font-mono);color:var(--text-muted)}
        .calls-row{display:flex;align-items:center;gap:10px;padding:8px 12px;border-bottom:1px solid var(--border);transition:background var(--transition-fast)}
        .calls-row:hover{background:var(--bg-card)}
        .calls-row-icon{width:24px;display:flex;justify-content:center;flex-shrink:0}
        .calls-row-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}
        .calls-row-number{font-size:12px;font-weight:500;font-family:var(--font-mono)}
        .calls-row-meta{font-size:10px;color:var(--text-muted);display:flex;align-items:center;gap:4px}

        /* ── Inbox Triage Actions ── */
        .comms-msg-actions{display:flex;gap:2px;opacity:0;transition:opacity var(--transition-fast);flex-shrink:0}
        .comms-msg-row:hover .comms-msg-actions{opacity:1}
        .comms-triage-btn{padding:4px;border:none;background:none;color:var(--text-muted);cursor:pointer;border-radius:var(--radius-sm);transition:all var(--transition-fast)}
        .comms-triage-btn:hover{color:var(--cyan);background:rgba(0,240,255,0.08)}
        .comms-triage-danger:hover{color:var(--error);background:rgba(239,68,68,0.08)}

        @media(max-width:768px){.comms-platform-chips{display:none}.comms-detail-panel{width:100%;position:absolute;inset:0;z-index:10}.comms-bar-label{width:60px}.lcs{flex-wrap:wrap}}
      `}</style>
    </div>
  );
}
