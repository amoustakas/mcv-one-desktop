import { useState } from 'react';
import { Settings, Palette, Users, Bell, Lock, Zap, Save, Loader2 } from 'lucide-react';
import { PageShell, PageHeader, GlassCard, Button, Badge, Tabs, Input } from '../components/ui';
import { useNavigation } from '../stores/navigation';
import { useGoogleWorkspaceStore } from '../stores/google-workspace';
import { ventures } from '../lib/ventures';
import { useToast } from '../components/Toasts';

export default function VentureSettingsView() {
  const { addToast } = useToast();
  const { activeVenture } = useNavigation();
  const venture = ventures.find(v => v.id === activeVenture) || ventures[0];
  const { getVentureMapping, setVentureMapping } = useGoogleWorkspaceStore();
  const mapping = getVentureMapping(venture.id);

  const [tab, setTab] = useState('general');
  const [saving, setSaving] = useState(false);

  // Google workspace mapping form state
  const [gmailLabels, setGmailLabels] = useState((mapping?.gmail.labels || []).join(', '));
  const [calendarIds, setCalendarIds] = useState((mapping?.calendar.calendarIds || []).join(', '));
  const [calendarKeywords, setCalendarKeywords] = useState((mapping?.calendar.keywords || []).join(', '));
  const [driveFolders, setDriveFolders] = useState((mapping?.drive.folderIds || []).join(', '));
  const [analyticsPropertyId, setAnalyticsPropertyId] = useState(mapping?.analytics.propertyId || '');
  const [searchConsoleUrl, setSearchConsoleUrl] = useState(mapping?.searchConsole.siteUrl || '');

  const TABS = [
    { id: 'general', label: 'General' },
    { id: 'google', label: 'Google Workspace' },
    { id: 'team', label: 'Team' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'security', label: 'Security' },
  ];

  const handleSaveGoogle = () => {
    setSaving(true);
    setVentureMapping(venture.id, {
      gmail: { labels: gmailLabels.split(',').map(s => s.trim()).filter(Boolean) },
      calendar: {
        calendarIds: calendarIds.split(',').map(s => s.trim()).filter(Boolean),
        keywords: calendarKeywords.split(',').map(s => s.trim()).filter(Boolean),
      },
      drive: { folderIds: driveFolders.split(',').map(s => s.trim()).filter(Boolean) },
      analytics: { propertyId: analyticsPropertyId || undefined },
      searchConsole: { siteUrl: searchConsoleUrl || undefined },
    });
    setTimeout(() => {
      setSaving(false);
      addToast({ type: 'success', message: `${venture.name} Google mapping saved` });
    }, 500);
  };

  return (
    <PageShell>
      <PageHeader title={`${venture.name} — Settings`} icon={<Settings size={20} />} />

      <div style={{ marginTop: 12 }}>
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>

      <div style={{ padding: '16px 0' }}>
        {tab === 'general' && (
          <GlassCard>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Palette size={14} /> Identity & Branding
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Venture Name</label>
                <div style={{ fontSize: 16, color: 'var(--text-primary)', marginTop: 4, fontWeight: 600 }}>{venture.name}</div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>ID</label>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>{venture.id}</div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Brand Color</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: venture.color || '#00F0FF', border: '1px solid var(--border)' }} />
                  <span style={{ fontSize: 14, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{venture.color || '#00F0FF'}</span>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Status</label>
                <div style={{ marginTop: 4 }}>
                  <Badge color="#10B981">Active</Badge>
                </div>
              </div>
            </div>
          </GlassCard>
        )}

        {tab === 'google' && (
          <GlassCard>
            <h3 style={{ margin: '0 0 8px', fontSize: 14, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={14} style={{ color: 'var(--cyan)' }} /> Google Workspace Mapping
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 16px' }}>
              Map Gmail labels, Calendar IDs, Drive folders, and Analytics properties to <strong>{venture.name}</strong>.
              This enables venture-scoped views of your Google data.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>Gmail Labels (comma-separated)</label>
                <Input placeholder="e.g. BetEdge, Investors, Users" value={gmailLabels} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGmailLabels(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>Calendar IDs</label>
                <Input placeholder="e.g. betedge@group.calendar.google.com" value={calendarIds} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCalendarIds(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>Auto-Tag Keywords</label>
                <Input placeholder="e.g. betting, sports, odds" value={calendarKeywords} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCalendarKeywords(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>Drive Folder IDs</label>
                <Input placeholder="Drive folder ID(s)" value={driveFolders} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDriveFolders(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>GA4 Property ID</label>
                  <Input placeholder="properties/123456789" value={analyticsPropertyId} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAnalyticsPropertyId(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>Search Console URL</label>
                  <Input placeholder="https://betedge.ai" value={searchConsoleUrl} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchConsoleUrl(e.target.value)} />
                </div>
              </div>
              <Button onClick={handleSaveGoogle} disabled={saving}>
                {saving ? <Loader2 size={14} className="mcv-spin" /> : <Save size={14} />} Save Google Mapping
              </Button>
            </div>
          </GlassCard>
        )}

        {tab === 'team' && (
          <GlassCard>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={14} /> Team & Access
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
              Manage team members with access to {venture.name}. Integration with user management coming soon.
            </p>
          </GlassCard>
        )}

        {tab === 'notifications' && (
          <GlassCard>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bell size={14} /> Notification Preferences
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Email notifications', desc: 'Daily digest of venture activity' },
                { label: 'Slack webhooks', desc: 'Real-time alerts to Slack channel' },
                { label: 'Incident alerts', desc: 'Critical incidents page on-call' },
                { label: 'Revenue milestones', desc: 'Notify when MRR hits targets' },
              ].map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, background: 'var(--bg-elevated)', borderRadius: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{p.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.desc}</div>
                  </div>
                  <Badge color="#10B981">Enabled</Badge>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {tab === 'security' && (
          <GlassCard>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Lock size={14} /> Security & Audit
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: '2FA required for venture changes', enabled: true },
                { label: 'IP allowlist for API calls', enabled: false },
                { label: 'Audit log retention (90 days)', enabled: true },
                { label: 'SOC 2 compliance mode', enabled: true },
              ].map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, background: 'var(--bg-elevated)', borderRadius: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{p.label}</span>
                  <Badge color={p.enabled ? '#10B981' : '#6B7280'}>{p.enabled ? 'Enabled' : 'Disabled'}</Badge>
                </div>
              ))}
            </div>
          </GlassCard>
        )}
      </div>
    </PageShell>
  );
}
