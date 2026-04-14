import { useState, useMemo, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import {
  Phone, MessageSquare, PhoneOutgoing, PhoneIncoming, Send,
  Loader2, DollarSign, Search, Users,
} from 'lucide-react';

const ConversationDetailDialog = lazy(() => import('../components/contact-center/ConversationDetailDialog'));
type ConversationProp = Parameters<typeof import('../components/contact-center/ConversationDetailDialog').default>[0]['conversation'];
type ThreadMessageProp = NonNullable<ConversationProp>['messages'][number];
import {
  PageShell, PageHeader, KpiCard, GridLayout, GlassCard, Button,
  Badge, Tabs, EmptyState, Input,
} from '../components/ui';
import { staggerContainer, fadeInUp } from '../lib/animations';
import {
  useTwilioAccount, useTwilioBalance, useRecentMessages, useRecentCalls,
  useSendSms, useMakeCall, usePhoneLookup,
} from '../hooks/use-twilio';
import { useToast } from '../components/Toasts';

export default function ContactCenterView() {
  const { addToast } = useToast();
  const [tab, setTab] = useState('overview');
  const [selectedThreadKey, setSelectedThreadKey] = useState<string | null>(null);

  const account = useTwilioAccount();
  const balance = useTwilioBalance();
  const messages = useRecentMessages(25);
  const calls = useRecentCalls(25);
  const sendSms = useSendSms();
  const makeCall = useMakeCall();

  // Compose state
  const [smsTo, setSmsTo] = useState('');
  const [smsBody, setSmsBody] = useState('');
  const [callTo, setCallTo] = useState('');
  const [callMessage, setCallMessage] = useState('Hello from NAOS. This is a test call.');

  // Lookup state
  const [lookupPhone, setLookupPhone] = useState('');
  const [lookupQuery, setLookupQuery] = useState('');
  const lookup = usePhoneLookup(lookupQuery || undefined);

  // Group messages + calls by the "other party" phone number (inbound: from; outbound: to)
  // to produce unified conversation threads that include both SMS and voice history.
  const conversations = useMemo(() => {
    const msgs = (messages.data?.messages as Record<string, unknown>[] | undefined) || [];
    const callList = (calls.data?.calls as Record<string, unknown>[] | undefined) || [];
    const threads: Record<string, { phone: string; messages: ThreadMessageProp[]; lastAt: string }> = {};

    const addToThread = (phone: string, msg: ThreadMessageProp) => {
      const key = phone || 'unknown';
      if (!threads[key]) threads[key] = { phone: key, messages: [], lastAt: msg.timestamp };
      threads[key].messages.push(msg);
      if (msg.timestamp > threads[key].lastAt) threads[key].lastAt = msg.timestamp;
    };

    msgs.forEach((m, i) => {
      const direction = ((m.direction as string) || '').startsWith('in') ? 'inbound' : 'outbound';
      const otherParty = direction === 'inbound' ? String(m.from || '') : String(m.to || '');
      addToThread(otherParty, {
        id: String(m.sid || m.id || `sms_${i}`),
        type: 'sms',
        direction,
        from: String(m.from || ''),
        to: String(m.to || ''),
        body: String(m.body || ''),
        status: String(m.status || 'sent'),
        timestamp: String(m.date_sent || m.date_created || m.timestamp || new Date().toISOString()),
      });
    });

    callList.forEach((c, i) => {
      const direction = ((c.direction as string) || '').startsWith('in') ? 'inbound' : 'outbound';
      const otherParty = direction === 'inbound' ? String(c.from || '') : String(c.to || '');
      addToThread(otherParty, {
        id: String(c.sid || c.id || `call_${i}`),
        type: 'call',
        direction,
        from: String(c.from || ''),
        to: String(c.to || ''),
        status: String(c.status || 'completed'),
        duration: Number(c.duration || 0),
        timestamp: String(c.start_time || c.date_created || c.timestamp || new Date().toISOString()),
        recording_url: c.recording_url ? String(c.recording_url) : undefined,
      });
    });

    return Object.values(threads).sort((a, b) => (b.lastAt > a.lastAt ? 1 : -1));
  }, [messages.data, calls.data]);

  const selectedConversation: ConversationProp = useMemo(() => {
    if (!selectedThreadKey) return null;
    const thread = conversations.find((t) => t.phone === selectedThreadKey);
    if (!thread) return null;
    return {
      contact_id: thread.phone,
      contact_phone: thread.phone,
      contact_name: thread.phone,
      messages: thread.messages,
    };
  }, [selectedThreadKey, conversations]);

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'conversations', label: 'Conversations', count: conversations.length },
    { id: 'sms', label: 'SMS', count: (messages.data?.messages as unknown[] | undefined)?.length },
    { id: 'voice', label: 'Voice Calls', count: (calls.data?.calls as unknown[] | undefined)?.length },
    { id: 'compose', label: 'Compose' },
    { id: 'lookup', label: 'Lookup' },
  ];

  const handleSendSms = async () => {
    if (!smsTo || !smsBody) return;
    try {
      await sendSms.mutateAsync({ to: smsTo, body: smsBody });
      addToast({ type: 'success', message: `SMS sent to ${smsTo}` });
      setSmsBody('');
    } catch (err) {
      addToast({ type: 'error', message: err instanceof Error ? err.message : 'SMS failed' });
    }
  };

  const handleMakeCall = async () => {
    if (!callTo) return;
    try {
      // Build TwiML for a simple say-then-hangup call
      const twiml = `<Response><Say voice="Polly.Joanna">${callMessage}</Say></Response>`;
      await makeCall.mutateAsync({ to: callTo, twiml });
      addToast({ type: 'success', message: `Call initiated to ${callTo}` });
    } catch (err) {
      addToast({ type: 'error', message: err instanceof Error ? err.message : 'Call failed' });
    }
  };

  const handleLookup = () => {
    setLookupQuery(lookupPhone);
  };

  const handleRefresh = () => {
    messages.refetch();
    calls.refetch();
    account.refetch();
    balance.refetch();
  };

  const totalMessages = (messages.data?.messages as unknown[] | undefined)?.length ?? 0;
  const totalCalls = (calls.data?.calls as unknown[] | undefined)?.length ?? 0;
  const accountBalance = (balance.data as Record<string, unknown>)?.balance as string | undefined;
  const accountStatus = (account.data as Record<string, unknown>)?.status as string | undefined;

  return (
    <PageShell>
      <PageHeader
        title="Contact Center"
        icon={<Phone size={20} />}
        loading={account.isLoading || balance.isLoading}
        onRefresh={handleRefresh}
      />

      {/* KPI Strip */}
      <motion.div variants={staggerContainer} initial="hidden" animate="show" style={{ marginTop: 12 }}>
        <GridLayout cols={4} gap="md">
          <motion.div variants={fadeInUp}>
            <KpiCard icon={<MessageSquare size={16} />} title="Recent SMS" value={String(totalMessages)} />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <KpiCard icon={<Phone size={16} />} title="Recent Calls" value={String(totalCalls)} />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <KpiCard icon={<DollarSign size={16} />} title="Account Balance" value={accountBalance ? `$${accountBalance}` : '—'} />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <KpiCard icon={<PhoneOutgoing size={16} />} title="Account Status" value={accountStatus || '—'} />
          </motion.div>
        </GridLayout>
      </motion.div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      <div style={{ padding: '16px 0' }}>
        {tab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <GlassCard>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-primary)' }}>Recent Messages</h3>
              {messages.isLoading ? (
                <Loader2 size={14} className="mcv-spin" />
              ) : (messages.data?.messages as Record<string, unknown>[] | undefined)?.slice(0, 5).map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ color: 'var(--text-primary)' }}>{String(m.from || 'Unknown')} → {String(m.to || '—')}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(m.body || '')}</div>
                  </div>
                  <Badge color={m.status === 'delivered' ? '#10B981' : '#F59E0B'}>{String(m.status || 'sent')}</Badge>
                </div>
              )) ?? (
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No messages yet. Check Twilio is connected in Settings.</p>
              )}
            </GlassCard>

            <GlassCard>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-primary)' }}>Recent Calls</h3>
              {calls.isLoading ? (
                <Loader2 size={14} className="mcv-spin" />
              ) : (calls.data?.calls as Record<string, unknown>[] | undefined)?.slice(0, 5).map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                  <div>
                    <div style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {c.direction === 'inbound' ? <PhoneIncoming size={12} /> : <PhoneOutgoing size={12} />}
                      {String(c.from || 'Unknown')} → {String(c.to || '—')}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{Number(c.duration || 0)}s · {c.start_time ? new Date(String(c.start_time)).toLocaleString() : '—'}</div>
                  </div>
                  <Badge>{String(c.status || 'queued')}</Badge>
                </div>
              )) ?? (
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No calls yet.</p>
              )}
            </GlassCard>
          </div>
        )}

        {tab === 'conversations' && (
          <GlassCard>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Users size={14} /> Unified Conversations
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 16px' }}>
              SMS and voice calls grouped by contact phone number. Click any thread to see the full history and reply.
            </p>
            {conversations.length === 0 ? (
              <EmptyState icon={<Users size={32} />} title="No conversations yet" description="Start an SMS or call from the Compose tab. Threads will appear here." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {conversations.map((thread) => {
                  const smsCount = thread.messages.filter((m) => m.type === 'sms').length;
                  const callCount = thread.messages.filter((m) => m.type === 'call').length;
                  const lastMsg = thread.messages[thread.messages.length - 1];
                  return (
                    <div
                      key={thread.phone}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedThreadKey(thread.phone)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedThreadKey(thread.phone); } }}
                      style={{ display: 'grid', gridTemplateColumns: '200px 1fr 120px 120px', padding: '12px 10px', borderBottom: '1px solid var(--border)', fontSize: 13, gap: 8, alignItems: 'center', cursor: 'pointer', borderRadius: 6, transition: 'background-color 150ms ease' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--bg-hover)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent'; }}
                    >
                      <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{thread.phone || 'Unknown'}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {lastMsg?.type === 'call' ? `Call · ${lastMsg.duration || 0}s` : lastMsg?.body || '—'}
                      </span>
                      <span style={{ display: 'inline-flex', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                        <Badge color="#00F0FF" size="sm" variant="outline">{smsCount} SMS</Badge>
                        <Badge color="#8B5CF6" size="sm" variant="outline">{callCount} calls</Badge>
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)', textAlign: 'right' }}>
                        {lastMsg ? new Date(lastMsg.timestamp).toLocaleString() : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        )}

        {tab === 'sms' && (
          <GlassCard>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-primary)' }}>SMS Inbox</h3>
            {messages.isLoading ? (
              <Loader2 size={14} className="mcv-spin" />
            ) : !(messages.data?.messages as unknown[] | undefined)?.length ? (
              <EmptyState icon={<MessageSquare size={32} />} title="No messages" description="Send an SMS from the Compose tab to get started." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {(messages.data?.messages as Record<string, unknown>[]).map((m, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 120px 1fr 90px', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 13, gap: 8, alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{String(m.from || '—')}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{String(m.to || '—')}</span>
                    <span style={{ color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(m.body || '')}</span>
                    <Badge color={m.status === 'delivered' ? '#10B981' : '#F59E0B'}>{String(m.status || 'sent')}</Badge>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        )}

        {tab === 'voice' && (
          <GlassCard>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-primary)' }}>Call History</h3>
            {calls.isLoading ? (
              <Loader2 size={14} className="mcv-spin" />
            ) : !(calls.data?.calls as unknown[] | undefined)?.length ? (
              <EmptyState icon={<Phone size={32} />} title="No calls" description="Initiate a call from the Compose tab." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {(calls.data?.calls as Record<string, unknown>[]).map((c, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '30px 120px 120px 80px 1fr 90px', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 13, gap: 8, alignItems: 'center' }}>
                    {c.direction === 'inbound' ? <PhoneIncoming size={12} /> : <PhoneOutgoing size={12} />}
                    <span style={{ color: 'var(--text-secondary)' }}>{String(c.from || '—')}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{String(c.to || '—')}</span>
                    <span style={{ color: 'var(--cyan)' }}>{Number(c.duration || 0)}s</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{c.start_time ? new Date(String(c.start_time)).toLocaleString() : '—'}</span>
                    <Badge>{String(c.status || 'queued')}</Badge>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        )}

        {tab === 'compose' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <GlassCard>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <MessageSquare size={14} style={{ color: 'var(--cyan)' }} />
                <h3 style={{ margin: 0, fontSize: 14, color: 'var(--text-primary)' }}>Send SMS</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Input placeholder="To phone number (+1234567890)" value={smsTo} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSmsTo(e.target.value)} />
                <textarea
                  placeholder="Message body..."
                  value={smsBody}
                  onChange={(e) => setSmsBody(e.target.value)}
                  rows={4}
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-sm)', fontSize: 13, resize: 'vertical', outline: 'none', fontFamily: 'var(--font-sans)' }}
                />
                <Button onClick={handleSendSms} disabled={sendSms.isPending || !smsTo || !smsBody}>
                  {sendSms.isPending ? <Loader2 size={14} className="mcv-spin" /> : <Send size={14} />} Send SMS
                </Button>
              </div>
            </GlassCard>

            <GlassCard>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Phone size={14} style={{ color: 'var(--purple)' }} />
                <h3 style={{ margin: 0, fontSize: 14, color: 'var(--text-primary)' }}>Make Voice Call</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Input placeholder="To phone number (+1234567890)" value={callTo} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCallTo(e.target.value)} />
                <textarea
                  placeholder="Voice message (will be spoken by Twilio TTS)"
                  value={callMessage}
                  onChange={(e) => setCallMessage(e.target.value)}
                  rows={4}
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-sm)', fontSize: 13, resize: 'vertical', outline: 'none', fontFamily: 'var(--font-sans)' }}
                />
                <Button onClick={handleMakeCall} disabled={makeCall.isPending || !callTo}>
                  {makeCall.isPending ? <Loader2 size={14} className="mcv-spin" /> : <PhoneOutgoing size={14} />} Make Call
                </Button>
              </div>
            </GlassCard>
          </div>
        )}

        {tab === 'lookup' && (
          <GlassCard>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Search size={14} style={{ color: 'var(--cyan)' }} />
              <h3 style={{ margin: 0, fontSize: 14, color: 'var(--text-primary)' }}>Phone Number Lookup</h3>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 12px' }}>
              Verify phone numbers, check carrier info, caller name, line type, and fraud risk.
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <Input
                placeholder="+1234567890"
                value={lookupPhone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLookupPhone(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleLookup()}
              />
              <Button onClick={handleLookup} disabled={lookup.isLoading || !lookupPhone}>
                {lookup.isLoading ? <Loader2 size={14} className="mcv-spin" /> : <Search size={14} />} Lookup
              </Button>
            </div>
            {lookup.data ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {Object.entries(lookup.data as Record<string, unknown>).filter(([k]) => !k.startsWith('_')).map(([k, v]) => (
                  <div key={k} style={{ padding: 10, background: 'var(--bg-elevated)', borderRadius: 6 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{k.replace(/_/g, ' ')}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {typeof v === 'object' ? JSON.stringify(v).slice(0, 60) : String(v || '—')}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </GlassCard>
        )}
      </div>

      <Suspense fallback={null}>
        {selectedThreadKey && (
          <ConversationDetailDialog
            open={!!selectedThreadKey}
            onClose={() => setSelectedThreadKey(null)}
            conversation={selectedConversation}
            onSendSms={async (to, body) => {
              await sendSms.mutateAsync({ to, body });
              addToast({ type: 'success', message: `SMS sent to ${to}` });
              messages.refetch();
            }}
            onMakeCall={async (to) => {
              const twiml = `<Response><Say voice="Polly.Joanna">Hello from NAOS.</Say></Response>`;
              await makeCall.mutateAsync({ to, twiml });
              addToast({ type: 'success', message: `Call initiated to ${to}` });
            }}
          />
        )}
      </Suspense>
    </PageShell>
  );
}
