import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, TrendingDown, Globe, DollarSign, Loader2, RefreshCw, Bell } from 'lucide-react';
import { PageShell, PageHeader, KpiCard, GridLayout, GlassCard, Badge, Tabs, EmptyState } from '../components/ui';
import { useComplianceStore } from '../stores/compliance';
import { useNavigation } from '../stores/navigation';
import { staggerContainer, fadeInUp } from '../lib/animations';
import { lazy, Suspense } from 'react';
import FraudRuleDetailDialog, { type FraudRuleLike } from '../components/compliance/FraudRuleDetailDialog';
import { Button } from '../components/ui';
import { Plus } from 'lucide-react';

const NexusAlertDetailDialog = lazy(() => import('../components/compliance/NexusAlertDetailDialog'));
type NexusAlertProp = Parameters<typeof import('../components/compliance/NexusAlertDetailDialog').default>[0]['alert'];

export default function ComplianceHubView() {
  const { activeVenture, mode } = useNavigation();
  const ventureId = (mode === 'venture' ? activeVenture : null) || 'mcv';

  const {
    fraudRules, fraudRulesLoading,
    dunningStats, dunningStatsLoading,
    nexusAlerts, nexusAlertsLoading,
    fetchFraudRules, fetchDunningStats, fetchNexusAlerts,
  } = useComplianceStore();

  const [tab, setTab] = useState('overview');
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [selectedNexusId, setSelectedNexusId] = useState<string | null>(null);

  const selectedRule = selectedRuleId
    ? (fraudRules.find((r) => String((r as unknown as Record<string, unknown>).id) === selectedRuleId) as unknown as FraudRuleLike) || null
    : null;
  const selectedNexus = selectedNexusId
    ? (nexusAlerts.find((a) => String((a as unknown as Record<string, unknown>).id) === selectedNexusId) as unknown as NexusAlertProp) || null
    : null;

  useEffect(() => {
    fetchFraudRules(ventureId);
    fetchDunningStats(ventureId);
    fetchNexusAlerts(ventureId);
  }, [ventureId, fetchFraudRules, fetchDunningStats, fetchNexusAlerts]);

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'fraud', label: 'Fraud Rules', count: fraudRules.length },
    { id: 'dunning', label: 'Dunning' },
    { id: 'tax', label: 'Tax & Nexus', count: nexusAlerts.length },
  ];

  const handleRefresh = () => {
    fetchFraudRules(ventureId);
    fetchDunningStats(ventureId);
    fetchNexusAlerts(ventureId);
  };

  const activeFraudRules = fraudRules.filter(r => (r as unknown as Record<string, unknown>).enabled !== false).length;
  const criticalAlerts = nexusAlerts.filter(a => (a as unknown as Record<string, unknown>).severity === 'critical').length;
  const dunningRecovered = dunningStats ? (dunningStats as unknown as Record<string, number>).recovered_revenue || 0 : 0;
  const dunningAtRisk = dunningStats ? (dunningStats as unknown as Record<string, number>).at_risk_revenue || 0 : 0;

  return (
    <PageShell>
      <PageHeader
        title="Compliance Hub"
        icon={<Shield size={20} />}
        loading={fraudRulesLoading || dunningStatsLoading || nexusAlertsLoading}
        onRefresh={handleRefresh}
      >
        {tab === 'fraud' && (
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={13} />}
            onClick={() => {
              const newId = `rule_${Date.now()}`;
              setSelectedRuleId(newId);
            }}
          >
            New Rule
          </Button>
        )}
      </PageHeader>

      {/* KPI Strip */}
      <motion.div variants={staggerContainer} initial="hidden" animate="show" style={{ marginTop: 12 }}>
        <GridLayout cols={4} gap="md">
          <motion.div variants={fadeInUp}>
            <KpiCard icon={<Shield size={16} />} title="Active Fraud Rules" value={String(activeFraudRules)} />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <KpiCard icon={<AlertTriangle size={16} />} title="Critical Nexus Alerts" value={String(criticalAlerts)} />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <KpiCard icon={<TrendingDown size={16} />} title="Recovered Revenue" value={`$${dunningRecovered.toLocaleString()}`} />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <KpiCard icon={<DollarSign size={16} />} title="At-Risk Revenue" value={`$${dunningAtRisk.toLocaleString()}`} />
          </motion.div>
        </GridLayout>
      </motion.div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      <div style={{ padding: '16px 0' }}>
        {tab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <GlassCard>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Bell size={14} style={{ color: 'var(--warning, #F59E0B)' }} />
                <h3 style={{ margin: 0, fontSize: 14, color: 'var(--text-primary)' }}>Top Nexus Alerts</h3>
              </div>
              {nexusAlerts.slice(0, 5).map((a) => {
                const alert = a as unknown as Record<string, unknown>;
                const severity = String(alert.severity || 'info');
                const severityColor = severity === 'critical' ? '#ef4444' : severity === 'warning' ? '#F59E0B' : 'var(--cyan)';
                return (
                  <div key={String(alert.id)} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13, alignItems: 'center' }}>
                    <div>
                      <div style={{ color: 'var(--text-primary)' }}>{String(alert.jurisdiction || alert.state || 'Unknown')}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{String(alert.message || 'Nexus threshold approaching')}</div>
                    </div>
                    <Badge color={severityColor}>{severity}</Badge>
                  </div>
                );
              })}
              {nexusAlerts.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>No nexus alerts. Tax obligations are in good standing.</p>
              )}
            </GlassCard>

            <GlassCard>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-primary)' }}>Dunning Performance</h3>
              {dunningStats ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Active Campaigns</div>
                    <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginTop: 4 }}>
                      {String((dunningStats as unknown as Record<string, number>).active_campaigns || 0)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Recovery Rate</div>
                    <div style={{ fontSize: 20, fontWeight: 600, color: '#10B981', marginTop: 4 }}>
                      {Number((dunningStats as unknown as Record<string, number>).recovery_rate || 0).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Avg Days to Recover</div>
                    <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--cyan)', marginTop: 4 }}>
                      {Number((dunningStats as unknown as Record<string, number>).avg_days_to_recover || 0).toFixed(0)}
                    </div>
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>No dunning data available.</p>
              )}
            </GlassCard>
          </div>
        )}

        {tab === 'fraud' && (
          <GlassCard>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-primary)' }}>Fraud Detection Rules</h3>
            {fraudRulesLoading ? (
              <div style={{ display: 'flex', gap: 8, color: 'var(--text-muted)', alignItems: 'center' }}>
                <Loader2 size={14} className="mcv-spin" /> Loading...
              </div>
            ) : fraudRules.length === 0 ? (
              <EmptyState icon={<Shield size={32} />} title="No fraud rules" description="Add rules to detect velocity abuse, card testing, device anomalies, and geographic risks." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {fraudRules.map((r) => {
                  const rule = r as unknown as Record<string, unknown>;
                  return (
                    <div
                      key={String(rule.id)}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedRuleId(String(rule.id))}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedRuleId(String(rule.id)); } }}
                      style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 100px 80px', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 13, gap: 8, alignItems: 'center', cursor: 'pointer', transition: 'background-color 150ms ease' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--bg-hover)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent'; }}
                    >
                      <div>
                        <div style={{ color: 'var(--text-primary)' }}>{String(rule.name || 'Rule')}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{String(rule.description || rule.type || '')}</div>
                      </div>
                      <span style={{ color: 'var(--text-secondary)' }}>{String(rule.trigger_type || rule.type || 'Custom')}</span>
                      <span style={{ color: 'var(--cyan)', textAlign: 'right' }}>{Number(rule.risk_score || 0)} risk</span>
                      <Badge color={rule.enabled !== false ? '#10B981' : '#6B7280'}>
                        {rule.enabled !== false ? 'active' : 'disabled'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        )}

        {tab === 'dunning' && (
          <GlassCard>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-primary)' }}>Dunning Campaigns</h3>
            {dunningStatsLoading ? (
              <div style={{ display: 'flex', gap: 8, color: 'var(--text-muted)', alignItems: 'center' }}>
                <Loader2 size={14} className="mcv-spin" /> Loading...
              </div>
            ) : !dunningStats ? (
              <EmptyState icon={<TrendingDown size={32} />} title="No dunning data" description="Automated recovery campaigns for failed payments." />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                {Object.entries(dunningStats as unknown as unknown as Record<string, unknown>).map(([key, value]) => (
                  <div key={key} style={{ padding: 12, background: 'var(--bg-elevated)', borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {key.replace(/_/g, ' ')}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginTop: 4 }}>
                      {typeof value === 'number' ? (key.includes('rate') ? `${value.toFixed(1)}%` : key.includes('revenue') ? `$${value.toLocaleString()}` : value.toLocaleString()) : String(value)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        )}

        {tab === 'tax' && (
          <GlassCard>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-primary)' }}>Tax Nexus Monitoring</h3>
            {nexusAlertsLoading ? (
              <div style={{ display: 'flex', gap: 8, color: 'var(--text-muted)', alignItems: 'center' }}>
                <Loader2 size={14} className="mcv-spin" /> Loading...
              </div>
            ) : nexusAlerts.length === 0 ? (
              <EmptyState icon={<Globe size={32} />} title="All clear" description="No jurisdictions approaching nexus thresholds." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {nexusAlerts.map((a) => {
                  const alert = a as unknown as Record<string, unknown>;
                  const severity = String(alert.severity || 'info');
                  return (
                    <div
                      key={String(alert.id)}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedNexusId(String(alert.id))}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedNexusId(String(alert.id)); } }}
                      style={{ display: 'grid', gridTemplateColumns: '120px 2fr 120px 80px', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 13, gap: 8, alignItems: 'center', cursor: 'pointer', transition: 'background-color 150ms ease' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--bg-hover)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent'; }}
                    >
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{String(alert.jurisdiction || alert.state || '—')}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{String(alert.message || 'Nexus threshold approaching')}</span>
                      <span style={{ color: 'var(--cyan)', textAlign: 'right' }}>${Number(alert.revenue_threshold || 0).toLocaleString()}</span>
                      <Badge color={severity === 'critical' ? '#ef4444' : severity === 'warning' ? '#F59E0B' : 'var(--cyan)'}>{severity}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        )}
      </div>

      <FraudRuleDetailDialog
        open={!!selectedRuleId}
        onClose={() => setSelectedRuleId(null)}
        rule={selectedRule || (selectedRuleId ? { id: selectedRuleId, name: 'New Rule', enabled: true, risk_score: 50, action: 'flag', trigger_type: 'velocity' } : null)}
        onSave={(updated) => {
          // Save handler — wire to compliance store when API endpoint lands
          console.log('Save fraud rule', updated);
          setSelectedRuleId(null);
        }}
        onToggle={(id, enabled) => {
          console.log('Toggle fraud rule', id, enabled);
        }}
        onDelete={(id) => {
          console.log('Delete fraud rule', id);
          setSelectedRuleId(null);
        }}
      />

      <Suspense fallback={null}>
        {selectedNexusId && (
          <NexusAlertDetailDialog
            open={!!selectedNexusId}
            onClose={() => setSelectedNexusId(null)}
            alert={selectedNexus}
            onAcknowledge={(id) => { console.log('Acknowledge nexus', id); setSelectedNexusId(null); }}
            onMarkRegistered={(id) => { console.log('Mark nexus registered', id); setSelectedNexusId(null); }}
            onMarkExempt={(id) => { console.log('Mark nexus exempt', id); setSelectedNexusId(null); }}
          />
        )}
      </Suspense>
    </PageShell>
  );
}
