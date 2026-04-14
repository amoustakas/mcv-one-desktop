import { useMemo, useState } from 'react';
import { Award, Users, Percent, Calendar, Plus, Trash2, Save, TrendingUp, Package } from 'lucide-react';
import { Dialog, DialogActions, Button, Badge, SectionCard, FormField, Input, Switch, DatePicker, ChipInput } from '../ui';
import { formatCurrency, timeAgo } from '../../lib/utils';

export interface RoyaltySplit {
  id: string;
  payee_name: string;
  payee_id?: string;
  percent: number;
  role?: string;
}

export interface RoyaltyDistribution {
  id: string;
  period_start: string;
  period_end: string;
  gross_revenue: number;
  payout_amount: number;
  status: 'pending' | 'paid' | 'held';
  paid_at?: string;
}

export interface RoyaltyAgreementLike {
  id: string;
  product_name?: string;
  title?: string;
  creator_name?: string;
  creator_id?: string;
  rate?: number;
  percent?: number;
  status?: string;
  product_sku?: string;
  effective_date?: string;
  termination_date?: string;
  minimum_guarantee?: number;
  recoupable?: boolean;
  auto_renew?: boolean;
  created_at?: string;
  updated_at?: string;
  splits?: RoyaltySplit[];
  distributions?: RoyaltyDistribution[];
  notes?: string;
  tags?: string[];
}

const STATUS_COLORS: Record<string, string> = {
  draft: '#6B7280',
  active: '#10B981',
  paused: '#F59E0B',
  terminated: '#EF4444',
  expired: '#6B7280',
};

const DIST_STATUS: Record<string, string> = {
  pending: '#F59E0B',
  paid: '#10B981',
  held: '#EF4444',
};

export default function RoyaltyAgreementDetailDialog({
  open,
  onClose,
  agreement,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  agreement: RoyaltyAgreementLike | null;
  onSave?: (updated: RoyaltyAgreementLike) => void | Promise<void>;
}) {
  const [draft, setDraft] = useState<RoyaltyAgreementLike | null>(agreement);

  // Sync draft when agreement changes
  useMemo(() => setDraft(agreement), [agreement]);

  if (!agreement || !draft) return null;

  const status = (draft.status || 'draft').toLowerCase();
  const statusColor = STATUS_COLORS[status] || '#6B7280';
  const title = draft.product_name || draft.title || `Agreement ${draft.id.slice(0, 8)}`;
  const rate = draft.rate ?? draft.percent ?? 0;

  const splits = draft.splits || [];
  const splitsTotal = splits.reduce((sum, s) => sum + s.percent, 0);
  const splitsValid = Math.abs(splitsTotal - 100) < 0.01 || splits.length === 0;

  const distributions = draft.distributions || [];
  const totalDistributed = distributions.filter((d) => d.status === 'paid').reduce((s, d) => s + d.payout_amount, 0);
  const pendingAmount = distributions.filter((d) => d.status === 'pending').reduce((s, d) => s + d.payout_amount, 0);

  const update = <K extends keyof RoyaltyAgreementLike>(key: K, value: RoyaltyAgreementLike[K]) => {
    setDraft((p) => (p ? { ...p, [key]: value } : p));
  };

  const addSplit = () => {
    const next: RoyaltySplit = { id: `split_${Date.now()}`, payee_name: 'New Payee', percent: 0 };
    update('splits', [...splits, next]);
  };

  const updateSplit = (id: string, partial: Partial<RoyaltySplit>) => {
    update('splits', splits.map((s) => (s.id === id ? { ...s, ...partial } : s)));
  };

  const removeSplit = (id: string) => {
    update('splits', splits.filter((s) => s.id !== id));
  };

  const dirty = JSON.stringify(agreement) !== JSON.stringify(draft);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="xl"
      title={
        <span className="ra-dlg-title">
          <Award size={18} />
          {title}
          <Badge color={statusColor} variant="outline" size="md">{status.toUpperCase()}</Badge>
        </span>
      }
      description={draft.creator_name || draft.creator_id}
      footer={
        <DialogActions align="between">
          <div className="ra-dlg-meta">
            Total royalty rate: <strong style={{ color: 'var(--cyan)' }}>{rate}%</strong>
            {splits.length > 0 && !splitsValid && (
              <span style={{ color: 'var(--warning)', marginLeft: 12 }}>
                Splits total {splitsTotal}% — must equal 100%
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
            {onSave && (
              <Button
                variant="primary"
                size="sm"
                icon={<Save size={13} />}
                disabled={!dirty || !splitsValid}
                onClick={() => onSave(draft)}
              >
                Save Changes
              </Button>
            )}
          </div>
        </DialogActions>
      }
    >
      <div className="ra-dlg-grid">
        <div className="ra-dlg-main">
          <SectionCard title="Terms" icon={<Percent size={14} />}>
            <div className="ra-form-grid">
              <FormField label="Product / Title">
                <Input
                  value={draft.product_name || draft.title || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('product_name', e.target.value)}
                />
              </FormField>
              <FormField label="SKU / Reference">
                <Input
                  value={draft.product_sku || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('product_sku', e.target.value)}
                  placeholder="SKU-0000"
                />
              </FormField>
              <FormField label="Royalty Rate (%)" hint="Percent of gross revenue paid to creators">
                <Input
                  type="number"
                  value={String(draft.rate ?? draft.percent ?? 0)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('rate', Number(e.target.value))}
                />
              </FormField>
              <FormField label="Minimum Guarantee" hint="Floor paid regardless of sales">
                <Input
                  type="number"
                  value={String(draft.minimum_guarantee ?? '')}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => update('minimum_guarantee', Number(e.target.value))}
                  placeholder="0"
                />
              </FormField>
              <FormField label="Effective Date">
                <DatePicker
                  value={draft.effective_date?.slice(0, 10) || null}
                  onChange={(v) => update('effective_date', v || undefined)}
                />
              </FormField>
              <FormField label="Termination Date" hint="Optional — blank = no expiry">
                <DatePicker
                  value={draft.termination_date?.slice(0, 10) || null}
                  onChange={(v) => update('termination_date', v || undefined)}
                  placeholder="No expiry"
                />
              </FormField>
              <FormField label="Tags" hint="Categorize for search and reporting — press Enter or comma to add">
                <ChipInput
                  value={draft.tags || []}
                  onChange={(v) => update('tags', v)}
                  placeholder="Add tag…"
                  normalize={(s) => s.toLowerCase()}
                  max={12}
                />
              </FormField>
            </div>
            <div className="ra-switch-stack">
              <Switch
                checked={!!draft.recoupable}
                onChange={(v) => update('recoupable', v)}
                label="Recoupable against advance"
                description="Minimum guarantee recovers from first royalties earned"
              />
              <Switch
                checked={!!draft.auto_renew}
                onChange={(v) => update('auto_renew', v)}
                label="Auto-renew"
                description="Extend one year on termination date unless cancelled"
              />
            </div>
          </SectionCard>

          <SectionCard
            title={`Royalty Splits (${splits.length})`}
            icon={<Users size={14} />}
            description={splitsValid ? `${splitsTotal}% allocated` : `${splitsTotal}% — must equal 100%`}
            action={<Button size="sm" variant="ghost" icon={<Plus size={12} />} onClick={addSplit}>Add payee</Button>}
            padding={splits.length === 0 ? 'md' : 'none'}
          >
            {splits.length === 0 ? (
              <p className="ra-empty">No splits defined. Without splits, royalties go 100% to the creator.</p>
            ) : (
              <table className="ra-splits-table">
                <thead>
                  <tr>
                    <th>Payee</th>
                    <th>Role</th>
                    <th style={{ textAlign: 'right', width: 90 }}>Percent</th>
                    <th style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {splits.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <input
                          className="ra-cell-input"
                          value={s.payee_name}
                          onChange={(e) => updateSplit(s.id, { payee_name: e.target.value })}
                          placeholder="Payee name"
                        />
                      </td>
                      <td>
                        <input
                          className="ra-cell-input"
                          value={s.role || ''}
                          onChange={(e) => updateSplit(s.id, { role: e.target.value })}
                          placeholder="e.g. Writer, Producer"
                        />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <input
                          className="ra-cell-input ra-cell-percent"
                          type="number"
                          value={s.percent}
                          onChange={(e) => updateSplit(s.id, { percent: Number(e.target.value) })}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="ra-split-remove"
                          onClick={() => removeSplit(s.id)}
                          aria-label={`Remove ${s.payee_name}`}
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </SectionCard>

          <SectionCard title={`Distribution History (${distributions.length})`} icon={<TrendingUp size={14} />} padding="none">
            {distributions.length === 0 ? (
              <p className="ra-empty">No distributions recorded yet.</p>
            ) : (
              <table className="ra-dist-table">
                <thead>
                  <tr>
                    <th>Period</th>
                    <th style={{ textAlign: 'right' }}>Gross Revenue</th>
                    <th style={{ textAlign: 'right' }}>Payout</th>
                    <th style={{ textAlign: 'right' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {distributions.map((d) => (
                    <tr key={d.id}>
                      <td>
                        {new Date(d.period_start).toLocaleDateString()} — {new Date(d.period_end).toLocaleDateString()}
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{formatCurrency(d.gross_revenue)}</td>
                      <td style={{ textAlign: 'right', color: 'var(--cyan)', fontWeight: 600 }}>{formatCurrency(d.payout_amount)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <Badge color={DIST_STATUS[d.status]} size="sm">{d.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </SectionCard>
        </div>

        <div className="ra-dlg-side">
          <SectionCard title="Lifetime Stats" icon={<Package size={14} />} padding="md">
            <dl className="ra-stats">
              <div>
                <dt>Total distributed</dt>
                <dd style={{ color: 'var(--success)' }}>{formatCurrency(totalDistributed)}</dd>
              </div>
              <div>
                <dt>Pending</dt>
                <dd style={{ color: 'var(--warning)' }}>{formatCurrency(pendingAmount)}</dd>
              </div>
              <div>
                <dt>Distributions</dt>
                <dd>{distributions.length}</dd>
              </div>
              <div>
                <dt>Last payout</dt>
                <dd>
                  {distributions.filter((d) => d.paid_at).sort((a, b) => (b.paid_at! > a.paid_at! ? 1 : -1))[0]?.paid_at
                    ? timeAgo(distributions.filter((d) => d.paid_at).sort((a, b) => (b.paid_at! > a.paid_at! ? 1 : -1))[0]!.paid_at!)
                    : '—'}
                </dd>
              </div>
            </dl>
          </SectionCard>

          <SectionCard title="Timeline" icon={<Calendar size={14} />} padding="md">
            <dl className="ra-stats">
              <div>
                <dt>Created</dt>
                <dd>{draft.created_at ? timeAgo(draft.created_at) : '—'}</dd>
              </div>
              <div>
                <dt>Last updated</dt>
                <dd>{draft.updated_at ? timeAgo(draft.updated_at) : '—'}</dd>
              </div>
              <div>
                <dt>Effective</dt>
                <dd>{draft.effective_date ? new Date(draft.effective_date).toLocaleDateString() : 'Not set'}</dd>
              </div>
              <div>
                <dt>Terminates</dt>
                <dd>{draft.termination_date ? new Date(draft.termination_date).toLocaleDateString() : 'Never'}</dd>
              </div>
            </dl>
          </SectionCard>

          {draft.notes !== undefined && (
            <SectionCard title="Notes">
              <textarea
                className="ra-notes"
                rows={5}
                value={draft.notes || ''}
                onChange={(e) => update('notes', e.target.value)}
                placeholder="Internal notes, amendments, context…"
              />
            </SectionCard>
          )}
        </div>
      </div>

      <style>{`
        .ra-dlg-title { display: inline-flex; align-items: center; gap: 10px; }
        .ra-dlg-meta { font-size: 12px; color: var(--text-secondary); }
        .ra-dlg-meta strong { font-family: var(--font-mono); font-size: 13px; }
        .ra-dlg-grid { display: grid; grid-template-columns: 1fr 280px; gap: 16px; }
        @media (max-width: 900px) { .ra-dlg-grid { grid-template-columns: 1fr; } }
        .ra-dlg-main, .ra-dlg-side { display: flex; flex-direction: column; gap: 12px; }
        .ra-form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
        .ra-switch-stack { display: flex; flex-direction: column; gap: 10px; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border); }
        .ra-empty { font-size: 12px; color: var(--text-muted); padding: 12px; }

        .ra-splits-table, .ra-dist-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .ra-splits-table th, .ra-dist-table th { padding: 8px 12px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); font-weight: 600; border-bottom: 1px solid var(--border); background: rgba(0, 0, 0, 0.1); }
        .ra-splits-table td, .ra-dist-table td { padding: 6px 12px; border-bottom: 1px solid var(--border); }
        .ra-dist-table td { padding: 10px 12px; color: var(--text-secondary); }
        .ra-cell-input { width: 100%; background: transparent; border: 1px solid transparent; border-radius: var(--radius-sm); padding: 4px 6px; font-size: 12px; color: var(--text-primary); font-family: inherit; transition: all var(--transition-fast); }
        .ra-cell-input:hover { border-color: var(--border); }
        .ra-cell-input:focus { outline: none; border-color: var(--cyan); background: var(--bg-input); }
        .ra-cell-percent { font-family: var(--font-mono); text-align: right; color: var(--cyan); font-weight: 600; }
        .ra-split-remove { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: var(--radius-sm); color: var(--text-muted); transition: all var(--transition-fast); }
        .ra-split-remove:hover { color: var(--error); background: rgba(239, 68, 68, 0.1); }

        .ra-stats { display: flex; flex-direction: column; gap: 6px; font-size: 12px; }
        .ra-stats > div { display: flex; justify-content: space-between; }
        .ra-stats dt { color: var(--text-muted); }
        .ra-stats dd { color: var(--text-primary); font-family: var(--font-mono); font-weight: 600; }

        .ra-notes { width: 100%; background: var(--bg-input); border: 1px solid var(--border); color: var(--text-primary); border-radius: var(--radius-sm); padding: 8px 10px; font-size: 12px; font-family: var(--font-sans); resize: vertical; outline: none; }
        .ra-notes:focus { border-color: var(--cyan); box-shadow: var(--field-ring-focus); }
      `}</style>
    </Dialog>
  );
}
