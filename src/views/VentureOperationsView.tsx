import { motion } from 'framer-motion';
import { Activity, Users, Phone, MessageSquare, AlertTriangle, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { PageShell, PageHeader, KpiCard, GridLayout, GlassCard, Badge, Tabs } from '../components/ui';
import { useNavigation } from '../stores/navigation';
import { ventures } from '../lib/ventures';
import { staggerContainer, fadeInUp } from '../lib/animations';
import { useState, useEffect } from 'react';
import { useGmailOverview } from '../hooks/use-comms';
import { useRecentCalls, useRecentMessages } from '../hooks/use-twilio';

export default function VentureOperationsView() {
  const { activeVenture, mode } = useNavigation();
  const venture = ventures.find(v => v.id === activeVenture) || ventures[0];
  const [tab, setTab] = useState('overview');

  const gmail = useGmailOverview();
  const calls = useRecentCalls(10);
  const messages = useRecentMessages(10);

  const TABS = [
    { id: 'overview', label: 'Operations Overview' },
    { id: 'comms', label: 'Comms & Support' },
    { id: 'incidents', label: 'Incidents' },
    { id: 'metrics', label: 'Health Metrics' },
  ];

  const recentCalls = (calls.data?.calls as unknown[] | undefined)?.length ?? 0;
  const recentSms = (messages.data?.messages as unknown[] | undefined)?.length ?? 0;

  // Mock health metrics (would be live in production)
  const healthMetrics = {
    uptime: 99.8,
    avgResponseTime: 240,
    openIncidents: 2,
    slaCompliance: 98.5,
  };

  return (
    <PageShell>
      <PageHeader title={`${venture.name} — Operations`} icon={<Activity size={20} />} />

      <motion.div variants={staggerContainer} initial="hidden" animate="show" style={{ marginTop: 12 }}>
        <GridLayout cols={4} gap="md">
          <motion.div variants={fadeInUp}>
            <KpiCard icon={<TrendingUp size={16} />} title="Uptime" value={`${healthMetrics.uptime}%`} />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <KpiCard icon={<Clock size={16} />} title="Avg Response" value={`${healthMetrics.avgResponseTime}ms`} />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <KpiCard icon={<AlertTriangle size={16} />} title="Open Incidents" value={String(healthMetrics.openIncidents)} />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <KpiCard icon={<CheckCircle2 size={16} />} title="SLA Compliance" value={`${healthMetrics.slaCompliance}%`} />
          </motion.div>
        </GridLayout>
      </motion.div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      <div style={{ padding: '16px 0' }}>
        {tab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <GlassCard>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-primary)' }}>Communications Summary</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}><MessageSquare size={11} /> Email (Gmail)</div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginTop: 4 }}>
                    {gmail.data?.unreadMessages ?? '—'} unread
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {gmail.data?.inboxMessages ?? 0} in inbox
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}><Phone size={11} /> Voice Calls</div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginTop: 4 }}>
                    {recentCalls} recent
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}><MessageSquare size={11} /> SMS</div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginTop: 4 }}>
                    {recentSms} recent
                  </div>
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-primary)' }}>System Health</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <HealthBar label="API Response Time" value={85} suffix="healthy" color="#10B981" />
                <HealthBar label="Database Latency" value={92} suffix="healthy" color="#10B981" />
                <HealthBar label="Queue Processing" value={78} suffix="normal" color="var(--cyan)" />
                <HealthBar label="Error Rate" value={96} suffix="excellent" color="#10B981" />
              </div>
            </GlassCard>
          </div>
        )}

        {tab === 'comms' && (
          <GlassCard>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-primary)' }}>Customer Communications</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 12px' }}>
              Unified view of email, SMS, and voice interactions for {venture.name} customers.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ padding: 12, background: 'var(--bg-elevated)', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email Threads (24h)</div>
                <div style={{ fontSize: 18, color: 'var(--text-primary)', marginTop: 4 }}>{gmail.data?.inboxMessages || 0}</div>
              </div>
              <div style={{ padding: 12, background: 'var(--bg-elevated)', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Conversations</div>
                <div style={{ fontSize: 18, color: 'var(--text-primary)', marginTop: 4 }}>{recentCalls + recentSms}</div>
              </div>
            </div>
          </GlassCard>
        )}

        {tab === 'incidents' && (
          <GlassCard>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-primary)' }}>Open Incidents</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <IncidentRow severity="critical" title="API latency spike" time="12 min ago" />
              <IncidentRow severity="warning" title="Stripe webhook delay" time="45 min ago" />
              <IncidentRow severity="info" title="Scheduled maintenance" time="2h ago" />
            </div>
          </GlassCard>
        )}

        {tab === 'metrics' && (
          <GlassCard>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-primary)' }}>Operational Metrics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {[
                { label: 'MTBF (Mean Time Between Failures)', value: '14 days' },
                { label: 'MTTR (Mean Time To Recover)', value: '8 minutes' },
                { label: 'Change Success Rate', value: '94.5%' },
                { label: 'Deployment Frequency', value: '3.2/day' },
                { label: 'Customer Tickets (30d)', value: '127' },
                { label: 'First Response Time', value: '18 min' },
              ].map((m, i) => (
                <div key={i} style={{ padding: 12, background: 'var(--bg-elevated)', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{m.label}</div>
                  <div style={{ fontSize: 18, color: 'var(--text-primary)', marginTop: 4, fontWeight: 600 }}>{m.value}</div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}
      </div>
    </PageShell>
  );
}

function HealthBar({ label, value, suffix, color }: { label: string; value: number; suffix: string; color: string }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ color }}>{value}% · {suffix}</span>
      </div>
      <div style={{ width: '100%', height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}

function IncidentRow({ severity, title, time }: { severity: string; title: string; time: string }) {
  const colors: Record<string, string> = { critical: '#ef4444', warning: '#F59E0B', info: 'var(--cyan)' };
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 8, borderLeft: `3px solid ${colors[severity]}` }}>
      <div>
        <div style={{ color: 'var(--text-primary)', fontSize: 13 }}>{title}</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>{time}</div>
      </div>
      <Badge color={colors[severity]}>{severity}</Badge>
    </div>
  );
}
