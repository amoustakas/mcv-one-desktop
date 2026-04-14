import { useState, useEffect } from 'react';
import { Shield, ToggleLeft, AlertTriangle, Gauge, Target, Activity, Save, Trash2 } from 'lucide-react';
import { Dialog, DialogActions, Button, Badge, SectionCard, FormField, Input, Switch, Select, Slider, Tooltip } from '../ui';
import { timeAgo } from '../../lib/utils';

type RuleTriggerType =
  | 'velocity'
  | 'card_testing'
  | 'device_fingerprint'
  | 'geographic'
  | 'amount_threshold'
  | 'custom';

type RuleAction = 'block' | 'review' | 'challenge' | 'flag';

const TRIGGER_OPTIONS: { value: RuleTriggerType; label: string; description: string }[] = [
  { value: 'velocity', label: 'Velocity', description: 'Too many transactions in a window' },
  { value: 'card_testing', label: 'Card Testing', description: 'Sequential low-amount authorizations' },
  { value: 'device_fingerprint', label: 'Device Fingerprint', description: 'Suspicious device signals' },
  { value: 'geographic', label: 'Geographic', description: 'Mismatched billing / shipping country' },
  { value: 'amount_threshold', label: 'Amount Threshold', description: 'Transactions above a ceiling' },
  { value: 'custom', label: 'Custom Expression', description: 'User-defined predicate' },
];

const ACTION_OPTIONS: { value: RuleAction; label: string; color: string }[] = [
  { value: 'block', label: 'Block', color: '#EF4444' },
  { value: 'review', label: 'Review', color: '#F59E0B' },
  { value: 'challenge', label: 'Challenge (3DS)', color: '#8B5CF6' },
  { value: 'flag', label: 'Flag Only', color: '#00F0FF' },
];

interface RecentHit {
  id: string;
  matched_at: string;
  transaction_id?: string;
  amount?: number;
  action_taken?: RuleAction;
  outcome?: 'blocked' | 'approved' | 'pending';
}

export interface FraudRuleLike {
  id: string;
  name?: string;
  description?: string;
  type?: string;
  trigger_type?: RuleTriggerType;
  risk_score?: number;
  action?: RuleAction;
  enabled?: boolean;
  threshold?: number;
  window_minutes?: number;
  custom_expression?: string;
  created_at?: string;
  updated_at?: string;
  last_triggered_at?: string;
  trigger_count?: number;
  recent_hits?: RecentHit[];
}

export default function FraudRuleDetailDialog({
  open,
  onClose,
  rule,
  onSave,
  onDelete,
  onToggle,
}: {
  open: boolean;
  onClose: () => void;
  rule: FraudRuleLike | null;
  onSave?: (rule: FraudRuleLike) => void | Promise<void>;
  onDelete?: (id: string) => void | Promise<void>;
  onToggle?: (id: string, enabled: boolean) => void | Promise<void>;
}) {
  const [draft, setDraft] = useState<FraudRuleLike | null>(rule);

  useEffect(() => { setDraft(rule); }, [rule]);

  if (!rule || !draft) return null;

  const enabled = draft.enabled !== false;
  const currentAction = draft.action || 'flag';
  const actionMeta = ACTION_OPTIONS.find((a) => a.value === currentAction);

  const hits = draft.recent_hits || [];
  const hitCount = draft.trigger_count || hits.length;

  const update = <K extends keyof FraudRuleLike>(key: K, value: FraudRuleLike[K]) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const dirty = JSON.stringify(rule) !== JSON.stringify(draft);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="xl"
      title={
        <span className="fr-dlg-title">
          <Shield size={18} />
          {draft.name || 'Fraud Rule'}
          <Badge color={enabled ? '#10B981' : '#6B7280'} variant="outline" size="md">
            {enabled ? 'ACTIVE' : 'DISABLED'}
          </Badge>
        </span>
      }
      description={draft.description || `${hitCount} triggers all-time`}
      footer={
        <DialogActions align="between">
          {onDelete && (
            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 size={13} />}
              onClick={() => {
                if (confirm(`Delete fraud rule "${draft.name}"? This cannot be undone.`)) onDelete(draft.id);
              }}
            >
              Delete Rule
            </Button>
          )}
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
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
      <div className="fr-dlg-grid">
        <div className="fr-dlg-main">
          <SectionCard title="Identity" icon={<Shield size={14} />}>
            <div className="fr-form-grid">
              <FormField label="Name" required>
                <Input
                  value={draft.name || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('name', e.target.value)}
                  placeholder="Descriptive rule name"
                />
              </FormField>
              <FormField label="Description" hint="What the rule looks for and why">
                <Input
                  value={draft.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('description', e.target.value)}
                  placeholder="e.g. Blocks 5+ auths in 2min window"
                />
              </FormField>
            </div>
          </SectionCard>

          <SectionCard title="Trigger" icon={<Target size={14} />}>
            <div className="fr-form-grid">
              <FormField label="Trigger Type">
                <Select
                  value={draft.trigger_type || 'velocity'}
                  onChange={(v) => update('trigger_type', v as RuleTriggerType)}
                  options={TRIGGER_OPTIONS.map((o) => ({
                    value: o.value,
                    label: o.label,
                    description: o.description,
                  }))}
                />
              </FormField>
              {draft.trigger_type !== 'custom' && (
                <>
                  <FormField label="Threshold" hint={draft.trigger_type === 'amount_threshold' ? 'Dollar amount' : 'Count per window'}>
                    <Input
                      type="number"
                      value={draft.threshold ?? ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('threshold', Number(e.target.value))}
                      placeholder="e.g. 5"
                    />
                  </FormField>
                  {(draft.trigger_type === 'velocity' || draft.trigger_type === 'card_testing') && (
                    <FormField label="Window (minutes)" hint="Rolling time window">
                      <Input
                        type="number"
                        value={draft.window_minutes ?? ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('window_minutes', Number(e.target.value))}
                        placeholder="e.g. 2"
                      />
                    </FormField>
                  )}
                </>
              )}
              {draft.trigger_type === 'custom' && (
                <FormField label="Custom Expression" hint="Predicate evaluated against transaction context" className="fr-custom-field">
                  <Input
                    value={draft.custom_expression || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('custom_expression', e.target.value)}
                    placeholder='e.g. amount > 1000 && country != "US"'
                  />
                </FormField>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Response" icon={<Gauge size={14} />}>
            <div className="fr-form-grid">
              <FormField label="Action on Match">
                <Select
                  value={currentAction}
                  onChange={(v) => update('action', v as RuleAction)}
                  options={ACTION_OPTIONS.map((a) => ({
                    value: a.value,
                    label: a.label,
                    icon: <span style={{ width: 8, height: 8, borderRadius: '50%', background: a.color, display: 'inline-block' }} />,
                  }))}
                />
              </FormField>
              <FormField label={`Risk Score: ${draft.risk_score ?? 0}/100`} hint="Higher = riskier — compounds into customer risk profile">
                <Slider
                  value={draft.risk_score ?? 0}
                  onChange={(v) => update('risk_score', v)}
                  min={0}
                  max={100}
                  step={5}
                  showValue={false}
                />
              </FormField>
            </div>
            <div className="fr-rule-preview">
              <AlertTriangle size={14} style={{ color: actionMeta?.color }} />
              <span>
                On match, this rule will <strong style={{ color: actionMeta?.color }}>{actionMeta?.label.toLowerCase()}</strong> the transaction
                and add <strong>{draft.risk_score ?? 0}</strong> risk points.
              </span>
            </div>
          </SectionCard>
        </div>

        <div className="fr-dlg-side">
          <SectionCard title="Status" icon={<ToggleLeft size={14} />} padding="md">
            <Switch
              checked={enabled}
              onChange={(v) => {
                update('enabled', v);
                if (onToggle) onToggle(draft.id, v);
              }}
              label={enabled ? 'Rule is active' : 'Rule is disabled'}
              description={enabled ? 'Evaluated on every transaction' : 'No effect on transactions'}
            />
          </SectionCard>

          <SectionCard title="Statistics" icon={<Activity size={14} />} padding="md">
            <dl className="fr-stats">
              <div>
                <dt>Total triggers</dt>
                <dd>{hitCount.toLocaleString()}</dd>
              </div>
              <div>
                <dt>Last triggered</dt>
                <dd>{draft.last_triggered_at ? timeAgo(draft.last_triggered_at) : 'Never'}</dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{draft.created_at ? timeAgo(draft.created_at) : '—'}</dd>
              </div>
              <div>
                <dt>Updated</dt>
                <dd>{draft.updated_at ? timeAgo(draft.updated_at) : '—'}</dd>
              </div>
            </dl>
          </SectionCard>

          <SectionCard title={`Recent Hits (${hits.length})`} padding="sm">
            {hits.length === 0 ? (
              <p className="fr-empty">No recent hits. The rule has not been triggered yet.</p>
            ) : (
              <ul className="fr-hit-list">
                {hits.slice(0, 8).map((hit) => {
                  const outcome = hit.outcome || 'pending';
                  const outcomeColor =
                    outcome === 'blocked' ? 'var(--error)' :
                    outcome === 'approved' ? 'var(--success)' : 'var(--warning)';
                  return (
                    <li key={hit.id} className="fr-hit-row">
                      <Tooltip content={`Transaction ${hit.transaction_id || hit.id}`}>
                        <span className="fr-hit-outcome" style={{ background: outcomeColor }} />
                      </Tooltip>
                      <div className="fr-hit-body">
                        <span className="fr-hit-action">{hit.action_taken || 'flag'}</span>
                        {hit.amount !== undefined && (
                          <span className="fr-hit-amount">${hit.amount.toLocaleString()}</span>
                        )}
                      </div>
                      <span className="fr-hit-time">{timeAgo(hit.matched_at)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>

      <style>{`
        .fr-dlg-title { display: inline-flex; align-items: center; gap: 10px; }
        .fr-dlg-grid { display: grid; grid-template-columns: 1fr 280px; gap: 16px; }
        @media (max-width: 900px) { .fr-dlg-grid { grid-template-columns: 1fr; } }
        .fr-dlg-main, .fr-dlg-side { display: flex; flex-direction: column; gap: 12px; }
        .fr-form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
        .fr-custom-field { grid-column: 1 / -1; }
        .fr-rule-preview { display: flex; align-items: center; gap: 8px; padding: 10px 12px; margin-top: 10px; background: rgba(245, 158, 11, 0.06); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: var(--radius-sm); font-size: 12px; color: var(--text-secondary); }
        .fr-rule-preview strong { color: var(--text-primary); font-weight: 600; }

        .fr-stats { display: flex; flex-direction: column; gap: 6px; font-size: 12px; }
        .fr-stats > div { display: flex; justify-content: space-between; }
        .fr-stats dt { color: var(--text-muted); }
        .fr-stats dd { color: var(--text-primary); font-family: var(--font-mono); }

        .fr-empty { font-size: 11px; color: var(--text-muted); padding: 12px; text-align: center; }
        .fr-hit-list { list-style: none; display: flex; flex-direction: column; gap: 4px; }
        .fr-hit-row { display: grid; grid-template-columns: 8px 1fr auto; align-items: center; gap: 8px; padding: 6px 8px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 11px; }
        .fr-hit-outcome { width: 8px; height: 8px; border-radius: 50%; }
        .fr-hit-body { display: flex; flex-direction: column; gap: 2px; }
        .fr-hit-action { font-size: 10px; text-transform: uppercase; font-weight: 700; color: var(--text-secondary); letter-spacing: 0.5px; }
        .fr-hit-amount { font-size: 11px; font-family: var(--font-mono); color: var(--text-primary); font-weight: 600; }
        .fr-hit-time { font-size: 9px; color: var(--text-muted); font-family: var(--font-mono); }
      `}</style>
    </Dialog>
  );
}
