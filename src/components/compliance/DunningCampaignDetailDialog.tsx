import { useMemo, useState } from 'react';
import { TrendingDown, Mail, MessageSquare, Phone, Clock, Plus, Trash2, Save, Play, Pause, ArrowDown } from 'lucide-react';
import { Dialog, DialogActions, Button, Badge, SectionCard, FormField, Input, Select, Switch, Tooltip, Slider } from '../ui';
import { formatCurrency, timeAgo } from '../../lib/utils';

export type DunningChannel = 'email' | 'sms' | 'voice' | 'letter';

export interface DunningStep {
  id: string;
  offset_days: number;
  channel: DunningChannel;
  template_id?: string;
  subject?: string;
  body?: string;
  include_pay_link?: boolean;
}

export interface DunningInvocation {
  id: string;
  invoice_id: string;
  customer_name?: string;
  amount: number;
  step_index: number;
  last_action_at: string;
  status: 'active' | 'paused' | 'recovered' | 'escalated' | 'written_off';
  recovered_amount?: number;
}

export interface DunningCampaignLike {
  id: string;
  name?: string;
  description?: string;
  enabled?: boolean;
  trigger_days_overdue?: number;
  escalation_threshold_days?: number;
  auto_write_off_days?: number;
  steps?: DunningStep[];
  active_invocations?: DunningInvocation[];
  stats?: {
    active: number;
    recovered: number;
    recovered_revenue: number;
    at_risk_revenue: number;
    recovery_rate: number;
    avg_days_to_recover: number;
  };
  created_at?: string;
  updated_at?: string;
}

const CHANNEL_META: Record<DunningChannel, { label: string; icon: React.ElementType; color: string }> = {
  email:  { label: 'Email',    icon: Mail,          color: '#00F0FF' },
  sms:    { label: 'SMS',      icon: MessageSquare, color: '#8B5CF6' },
  voice:  { label: 'Voice',    icon: Phone,         color: '#F59E0B' },
  letter: { label: 'Letter',   icon: Mail,          color: '#6B7280' },
};

const STATUS_COLORS: Record<DunningInvocation['status'], string> = {
  active: '#F59E0B',
  paused: '#6B7280',
  recovered: '#10B981',
  escalated: '#EF4444',
  written_off: '#6B7280',
};

export default function DunningCampaignDetailDialog({
  open,
  onClose,
  campaign,
  onSave,
  onToggle,
  onPauseInvocation,
  onResumeInvocation,
}: {
  open: boolean;
  onClose: () => void;
  campaign: DunningCampaignLike | null;
  onSave?: (updated: DunningCampaignLike) => void | Promise<void>;
  onToggle?: (id: string, enabled: boolean) => void | Promise<void>;
  onPauseInvocation?: (campaignId: string, invocationId: string) => void | Promise<void>;
  onResumeInvocation?: (campaignId: string, invocationId: string) => void | Promise<void>;
}) {
  const [draft, setDraft] = useState<DunningCampaignLike | null>(campaign);

  useMemo(() => setDraft(campaign), [campaign]);

  if (!campaign || !draft) return null;

  const enabled = draft.enabled !== false;
  const steps = draft.steps || [];
  const invocations = draft.active_invocations || [];
  const stats = draft.stats;

  const update = <K extends keyof DunningCampaignLike>(key: K, value: DunningCampaignLike[K]) => {
    setDraft((p) => (p ? { ...p, [key]: value } : p));
  };

  const addStep = () => {
    const nextDay = steps.length === 0 ? 1 : Math.max(...steps.map((s) => s.offset_days)) + 3;
    update('steps', [
      ...steps,
      {
        id: `step_${Date.now()}`,
        offset_days: nextDay,
        channel: 'email',
        subject: 'Friendly reminder',
        include_pay_link: true,
      },
    ]);
  };

  const updateStep = (id: string, partial: Partial<DunningStep>) => {
    update('steps', steps.map((s) => (s.id === id ? { ...s, ...partial } : s)));
  };

  const removeStep = (id: string) => {
    update('steps', steps.filter((s) => s.id !== id));
  };

  const dirty = JSON.stringify(campaign) !== JSON.stringify(draft);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="xl"
      title={
        <span className="dn-dlg-title">
          <TrendingDown size={18} />
          {draft.name || 'Dunning Campaign'}
          <Badge color={enabled ? '#10B981' : '#6B7280'} variant="outline" size="md">
            {enabled ? 'ACTIVE' : 'PAUSED'}
          </Badge>
        </span>
      }
      description={draft.description || `Recovers overdue invoices over ${steps.length} escalation ${steps.length === 1 ? 'step' : 'steps'}`}
      footer={
        <DialogActions align="between">
          <div className="dn-dlg-meta">
            {stats && (
              <>
                <strong style={{ color: 'var(--success)' }}>{stats.recovery_rate.toFixed(1)}%</strong> recovery ·{' '}
                <strong>{stats.active}</strong> active ·{' '}
                <strong style={{ color: 'var(--success)' }}>{formatCurrency(stats.recovered_revenue)}</strong> recovered
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
            {onSave && (
              <Button
                variant="primary"
                size="sm"
                icon={<Save size={13} />}
                disabled={!dirty}
                onClick={() => onSave(draft)}
              >
                Save Changes
              </Button>
            )}
          </div>
        </DialogActions>
      }
    >
      <div className="dn-dlg-grid">
        <div className="dn-dlg-main">
          <SectionCard title="Campaign Rules" icon={<Clock size={14} />}>
            <div className="dn-form-grid">
              <FormField label="Campaign Name" required>
                <Input
                  value={draft.name || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('name', e.target.value)}
                  placeholder="e.g. SaaS Recovery — Standard"
                />
              </FormField>
              <FormField label="Description" hint="Shown in reports and admin UI">
                <Input
                  value={draft.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('description', e.target.value)}
                />
              </FormField>
              <FormField label="Trigger when invoices are overdue by" hint="Days past due date before campaign starts">
                <Input
                  type="number"
                  value={String(draft.trigger_days_overdue ?? 1)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('trigger_days_overdue', Number(e.target.value))}
                />
              </FormField>
              <FormField label="Escalate after (days)" hint="Route to human review after this many days in campaign">
                <Input
                  type="number"
                  value={String(draft.escalation_threshold_days ?? 30)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('escalation_threshold_days', Number(e.target.value))}
                />
              </FormField>
              <FormField label="Auto write-off (days)" hint="0 to never write off automatically">
                <Input
                  type="number"
                  value={String(draft.auto_write_off_days ?? 0)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('auto_write_off_days', Number(e.target.value))}
                />
              </FormField>
            </div>
          </SectionCard>

          <SectionCard
            title={`Escalation Steps (${steps.length})`}
            icon={<ArrowDown size={14} />}
            description="Ordered communications — runs in sequence based on days past due"
            action={<Button size="sm" variant="ghost" icon={<Plus size={12} />} onClick={addStep}>Add step</Button>}
          >
            {steps.length === 0 ? (
              <p className="dn-empty">No steps yet. Add the first reminder to get started.</p>
            ) : (
              <ol className="dn-steps">
                {[...steps].sort((a, b) => a.offset_days - b.offset_days).map((step, idx) => {
                  const meta = CHANNEL_META[step.channel];
                  const Icon = meta.icon;
                  return (
                    <li key={step.id} className="dn-step">
                      <div className="dn-step-marker">
                        <span className="dn-step-idx">{idx + 1}</span>
                        <span className="dn-step-day">Day +{step.offset_days}</span>
                      </div>
                      <div className="dn-step-body">
                        <div className="dn-step-head">
                          <div className="dn-step-channel" style={{ color: meta.color, borderColor: meta.color + '55' }}>
                            <Icon size={11} /> {meta.label}
                          </div>
                          <input
                            className="dn-step-subject"
                            value={step.subject || ''}
                            onChange={(e) => updateStep(step.id, { subject: e.target.value })}
                            placeholder="Subject / headline"
                          />
                          <button
                            type="button"
                            className="dn-step-remove"
                            onClick={() => removeStep(step.id)}
                            aria-label="Remove step"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                        <div className="dn-step-config">
                          <FormField label="Channel">
                            <Select
                              value={step.channel}
                              onChange={(v) => updateStep(step.id, { channel: v as DunningChannel })}
                              options={(Object.entries(CHANNEL_META) as [DunningChannel, typeof CHANNEL_META.email][]).map(([v, m]) => ({
                                value: v,
                                label: m.label,
                              }))}
                              size="sm"
                            />
                          </FormField>
                          <FormField label="Offset (days past due)">
                            <Input
                              type="number"
                              value={String(step.offset_days)}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateStep(step.id, { offset_days: Number(e.target.value) })}
                            />
                          </FormField>
                        </div>
                        {step.channel === 'email' && (
                          <textarea
                            className="dn-step-body-text"
                            value={step.body || ''}
                            onChange={(e) => updateStep(step.id, { body: e.target.value })}
                            placeholder="Email body (supports {{customer.name}}, {{invoice.amount}}, {{invoice.pay_link}})"
                            rows={3}
                          />
                        )}
                        <Switch
                          checked={step.include_pay_link !== false}
                          onChange={(v) => updateStep(step.id, { include_pay_link: v })}
                          label="Include one-click payment link"
                          size="sm"
                        />
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </SectionCard>

          <SectionCard title={`Active Invocations (${invocations.length})`} icon={<Mail size={14} />} padding="none">
            {invocations.length === 0 ? (
              <p className="dn-empty">No invoices currently being dunned under this campaign.</p>
            ) : (
              <table className="dn-inv-table">
                <thead>
                  <tr>
                    <th>Invoice / Customer</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th>Step</th>
                    <th>Last Action</th>
                    <th>Status</th>
                    <th style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {invocations.map((inv) => (
                    <tr key={inv.id}>
                      <td>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--cyan)' }}>
                          {inv.invoice_id.slice(-8).toUpperCase()}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {inv.customer_name || '—'}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--warning)', fontWeight: 600 }}>
                        {formatCurrency(inv.amount)}
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Step {inv.step_index + 1} of {steps.length}
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {timeAgo(inv.last_action_at)}
                      </td>
                      <td>
                        <Badge color={STATUS_COLORS[inv.status]} size="sm">{inv.status}</Badge>
                      </td>
                      <td>
                        {inv.status === 'active' && onPauseInvocation && (
                          <Tooltip content="Pause this invocation">
                            <button type="button" className="dn-inv-pause" onClick={() => onPauseInvocation(draft.id, inv.id)} aria-label="Pause">
                              <Pause size={11} />
                            </button>
                          </Tooltip>
                        )}
                        {inv.status === 'paused' && onResumeInvocation && (
                          <Tooltip content="Resume this invocation">
                            <button type="button" className="dn-inv-pause" onClick={() => onResumeInvocation(draft.id, inv.id)} aria-label="Resume">
                              <Play size={11} />
                            </button>
                          </Tooltip>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </SectionCard>
        </div>

        <div className="dn-dlg-side">
          <SectionCard title="Status" icon={<Play size={14} />} padding="md">
            <Switch
              checked={enabled}
              onChange={(v) => {
                update('enabled', v);
                if (onToggle) onToggle(draft.id, v);
              }}
              label={enabled ? 'Campaign is active' : 'Campaign is paused'}
              description={enabled ? 'New overdue invoices enter automatically' : 'Existing invocations continue; no new ones enter'}
            />
          </SectionCard>

          {stats && (
            <SectionCard title="Performance" icon={<TrendingDown size={14} />} padding="md">
              <dl className="dn-stats">
                <div>
                  <dt>Recovery rate</dt>
                  <dd style={{ color: stats.recovery_rate >= 50 ? 'var(--success)' : 'var(--warning)' }}>
                    {stats.recovery_rate.toFixed(1)}%
                  </dd>
                </div>
                <div>
                  <dt>Active</dt>
                  <dd>{stats.active}</dd>
                </div>
                <div>
                  <dt>Recovered</dt>
                  <dd>{stats.recovered}</dd>
                </div>
                <div>
                  <dt>Recovered revenue</dt>
                  <dd style={{ color: 'var(--success)' }}>{formatCurrency(stats.recovered_revenue)}</dd>
                </div>
                <div>
                  <dt>At-risk revenue</dt>
                  <dd style={{ color: 'var(--warning)' }}>{formatCurrency(stats.at_risk_revenue)}</dd>
                </div>
                <div>
                  <dt>Avg days to recover</dt>
                  <dd>{stats.avg_days_to_recover.toFixed(1)}</dd>
                </div>
              </dl>
            </SectionCard>
          )}

          <SectionCard title="Risk Tuning" icon={<Clock size={14} />} padding="md">
            <FormField label={`Escalation threshold: ${draft.escalation_threshold_days ?? 30} days`} hint="Invocations escalate to human review after this many days">
              <Slider
                value={draft.escalation_threshold_days ?? 30}
                onChange={(v) => update('escalation_threshold_days', v)}
                min={7}
                max={120}
                step={1}
                showValue={false}
              />
            </FormField>
          </SectionCard>
        </div>
      </div>

      <style>{`
        .dn-dlg-title { display: inline-flex; align-items: center; gap: 10px; }
        .dn-dlg-meta { font-size: 12px; color: var(--text-secondary); }
        .dn-dlg-meta strong { font-family: var(--font-mono); }
        .dn-dlg-grid { display: grid; grid-template-columns: 1fr 280px; gap: 16px; }
        @media (max-width: 900px) { .dn-dlg-grid { grid-template-columns: 1fr; } }
        .dn-dlg-main, .dn-dlg-side { display: flex; flex-direction: column; gap: 12px; }
        .dn-form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
        .dn-empty { font-size: 12px; color: var(--text-muted); padding: 16px; text-align: center; }

        .dn-steps { list-style: none; display: flex; flex-direction: column; gap: 8px; padding: 0; }
        .dn-step { display: grid; grid-template-columns: 80px 1fr; gap: 12px; padding: 12px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); }
        .dn-step-marker { display: flex; flex-direction: column; align-items: center; gap: 4px; padding-top: 4px; }
        .dn-step-idx { width: 24px; height: 24px; border-radius: 50%; background: rgba(0, 240, 255, 0.1); color: var(--cyan); display: inline-flex; align-items: center; justify-content: center; font-family: var(--font-mono); font-weight: 700; font-size: 11px; border: 1px solid var(--border-active); }
        .dn-step-day { font-size: 10px; color: var(--text-muted); font-family: var(--font-mono); font-weight: 600; }
        .dn-step-body { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
        .dn-step-head { display: flex; align-items: center; gap: 8px; }
        .dn-step-channel { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: var(--radius-sm); border: 1px solid; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; flex-shrink: 0; }
        .dn-step-subject { flex: 1; background: transparent; border: 1px solid transparent; border-radius: var(--radius-sm); padding: 4px 6px; font-size: 12px; font-weight: 500; color: var(--text-primary); font-family: inherit; transition: all var(--transition-fast); }
        .dn-step-subject:hover { border-color: var(--border); }
        .dn-step-subject:focus { outline: none; border-color: var(--cyan); background: var(--bg-input); }
        .dn-step-remove { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: var(--radius-sm); color: var(--text-muted); transition: all var(--transition-fast); }
        .dn-step-remove:hover { color: var(--error); background: rgba(239, 68, 68, 0.1); }
        .dn-step-config { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .dn-step-body-text { background: var(--bg-input); border: 1px solid var(--border); color: var(--text-primary); border-radius: var(--radius-sm); padding: 6px 8px; font-size: 11px; font-family: var(--font-mono); resize: vertical; outline: none; }
        .dn-step-body-text:focus { border-color: var(--cyan); }

        .dn-inv-table { width: 100%; border-collapse: collapse; font-size: 11px; }
        .dn-inv-table thead { background: rgba(0, 0, 0, 0.1); }
        .dn-inv-table th { padding: 8px 12px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); font-weight: 600; border-bottom: 1px solid var(--border); }
        .dn-inv-table td { padding: 8px 12px; border-bottom: 1px solid var(--border); color: var(--text-secondary); }
        .dn-inv-pause { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: var(--radius-sm); color: var(--text-muted); transition: all var(--transition-fast); }
        .dn-inv-pause:hover { color: var(--cyan); background: var(--bg-elevated); }

        .dn-stats { display: flex; flex-direction: column; gap: 6px; font-size: 12px; }
        .dn-stats > div { display: flex; justify-content: space-between; gap: 8px; }
        .dn-stats dt { color: var(--text-muted); }
        .dn-stats dd { color: var(--text-primary); font-family: var(--font-mono); font-weight: 600; }
      `}</style>
    </Dialog>
  );
}
