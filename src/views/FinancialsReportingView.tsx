import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileBarChart, Download, Send, Calendar, Clock,
  Plus, Loader2, FileText, BarChart3, DollarSign, TrendingUp, Sparkles,
} from 'lucide-react';
import {
  PageShell, PageHeader, KpiCard, GridLayout, GlassCard, Button, Badge, Tabs, Input,
} from '../components/ui';
import { useNavigation } from '../stores/navigation';
import { staggerContainer, fadeInUp } from '../lib/animations';
import { useToast } from '../components/Toasts';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: typeof FileText;
  type: 'pl' | 'balance' | 'cashflow' | 'revenue' | 'cohort' | 'custom';
  cadence: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'on-demand';
}

const TEMPLATES: ReportTemplate[] = [
  { id: 'pl', name: 'Profit & Loss', description: 'Revenue, expenses, and net income by period', icon: DollarSign, type: 'pl', cadence: 'monthly' },
  { id: 'balance', name: 'Balance Sheet', description: 'Assets, liabilities, and equity snapshot', icon: FileText, type: 'balance', cadence: 'monthly' },
  { id: 'cashflow', name: 'Cash Flow Statement', description: 'Operating, investing, and financing activities', icon: TrendingUp, type: 'cashflow', cadence: 'monthly' },
  { id: 'revenue', name: 'Revenue Analysis', description: 'MRR, ARR, churn, expansion, net revenue retention', icon: BarChart3, type: 'revenue', cadence: 'weekly' },
  { id: 'cohort', name: 'Cohort Analysis', description: 'Customer retention and LTV by acquisition cohort', icon: Sparkles, type: 'cohort', cadence: 'monthly' },
];

interface Schedule {
  id: string;
  reportId: string;
  cadence: string;
  recipients: string[];
  lastRun?: string;
  nextRun?: string;
  enabled: boolean;
}

export default function FinancialsReportingView() {
  const { addToast } = useToast();
  const { activeVenture, mode } = useNavigation();
  const ventureId = (mode === 'venture' ? activeVenture : null) || 'mcv';

  const [tab, setTab] = useState('templates');
  const [generating, setGenerating] = useState<string | null>(null);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiQuery, setAiQuery] = useState('');

  // Mock schedules (in production, fetched from API)
  const [schedules] = useState<Schedule[]>([
    { id: '1', reportId: 'pl', cadence: 'monthly', recipients: ['tony@edgeiq.com'], lastRun: '2026-04-01T00:00:00Z', nextRun: '2026-05-01T00:00:00Z', enabled: true },
    { id: '2', reportId: 'revenue', cadence: 'weekly', recipients: ['tony@edgeiq.com', 'devon@edgeiq.com'], lastRun: '2026-04-08T00:00:00Z', nextRun: '2026-04-15T00:00:00Z', enabled: true },
  ]);

  const handleGenerate = async (template: ReportTemplate) => {
    setGenerating(template.id);
    try {
      // Try fetching from finance API
      const res = await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: `generate-${template.type}-report`, ventureId }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${template.name.replace(/\s/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`;
        a.click();
        addToast({ type: 'success', message: `${template.name} downloaded` });
      } else {
        addToast({ type: 'info', message: `${template.name} report endpoint not yet available` });
      }
    } catch {
      addToast({ type: 'warning', message: 'Report generation failed' });
    } finally {
      setGenerating(null);
    }
  };

  const handleAiReport = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiReport(null);
    try {
      const res = await fetch('/api/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'gemini-generate',
          prompt: `You are a CFO analyzing ${ventureId} financial data. Generate a concise executive summary for: "${aiQuery}". Include specific numbers (estimate if needed), trends, risks, and 3 recommended actions. Format with clear sections.`,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiReport(data.content || null);
      }
    } catch {
      addToast({ type: 'error', message: 'AI report generation failed' });
    } finally {
      setAiLoading(false);
    }
  };

  const TABS = [
    { id: 'templates', label: 'Report Templates', count: TEMPLATES.length },
    { id: 'scheduled', label: 'Scheduled', count: schedules.length },
    { id: 'ai-report', label: 'AI Reports' },
  ];

  return (
    <PageShell>
      <PageHeader title="Financial Reporting" icon={<FileBarChart size={20} />}>
        <Button variant="primary" size="sm" icon={<Plus size={13} />}>Schedule Report</Button>
      </PageHeader>

      <motion.div variants={staggerContainer} initial="hidden" animate="show" style={{ marginTop: 12 }}>
        <GridLayout cols={4} gap="md">
          <motion.div variants={fadeInUp}><KpiCard icon={<FileText size={16} />} title="Report Templates" value={String(TEMPLATES.length)} /></motion.div>
          <motion.div variants={fadeInUp}><KpiCard icon={<Clock size={16} />} title="Scheduled" value={String(schedules.filter(s => s.enabled).length)} /></motion.div>
          <motion.div variants={fadeInUp}><KpiCard icon={<Send size={16} />} title="Delivered (30d)" value="12" /></motion.div>
          <motion.div variants={fadeInUp}><KpiCard icon={<Sparkles size={16} />} title="AI Reports" value="—" /></motion.div>
        </GridLayout>
      </motion.div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      <div style={{ padding: '16px 0' }}>
        {tab === 'templates' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {TEMPLATES.map((t) => {
              const Icon = t.icon;
              return (
                <GlassCard key={t.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 32, height: 32, background: 'rgba(0, 240, 255, 0.08)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={16} style={{ color: 'var(--cyan)' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 600 }}>{t.name}</div>
                      <Badge>{t.cadence}</Badge>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.5 }}>{t.description}</p>
                  <Button size="sm" onClick={() => handleGenerate(t)} disabled={generating === t.id}>
                    {generating === t.id ? <Loader2 size={12} className="mcv-spin" /> : <Download size={12} />}
                    Generate
                  </Button>
                </GlassCard>
              );
            })}
          </div>
        )}

        {tab === 'scheduled' && (
          <GlassCard>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-primary)' }}>Scheduled Reports</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 1fr 120px 120px 80px', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, gap: 8 }}>
                <span>Report</span><span>Cadence</span><span>Recipients</span><span>Last Run</span><span>Next Run</span><span>Status</span>
              </div>
              {schedules.map((s) => {
                const template = TEMPLATES.find(t => t.id === s.reportId);
                return (
                  <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 1fr 120px 120px 80px', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 13, gap: 8, alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-primary)' }}>{template?.name || s.reportId}</span>
                    <Badge>{s.cadence}</Badge>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{s.recipients.join(', ')}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{s.lastRun ? new Date(s.lastRun).toLocaleDateString() : '—'}</span>
                    <span style={{ color: 'var(--cyan)', fontSize: 11 }}>{s.nextRun ? new Date(s.nextRun).toLocaleDateString() : '—'}</span>
                    <Badge color={s.enabled ? '#10B981' : '#6B7280'}>{s.enabled ? 'active' : 'paused'}</Badge>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        )}

        {tab === 'ai-report' && (
          <GlassCard>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Sparkles size={14} style={{ color: 'var(--purple)' }} />
              <h3 style={{ margin: 0, fontSize: 14, color: 'var(--text-primary)' }}>AI-Generated Financial Reports</h3>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 12px' }}>
              Ask NAOS to generate any financial report or analysis on demand.
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <Input
                placeholder="e.g. 'Summarize Q1 performance with focus on margins'"
                value={aiQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAiQuery(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleAiReport()}
              />
              <Button onClick={handleAiReport} disabled={aiLoading || !aiQuery.trim()}>
                {aiLoading ? <Loader2 size={14} className="mcv-spin" /> : <Sparkles size={14} />} Generate
              </Button>
            </div>
            {aiReport && (
              <div style={{ padding: 16, background: 'var(--bg-elevated)', borderRadius: 8, borderLeft: '3px solid var(--purple)' }}>
                <pre style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'var(--font-sans)' }}>{aiReport}</pre>
              </div>
            )}
          </GlassCard>
        )}
      </div>
    </PageShell>
  );
}
