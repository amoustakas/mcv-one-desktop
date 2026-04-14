import { useMemo, useState } from 'react';
import { Lock, Users, CheckCircle2, Circle, Unlock, AlertTriangle, Calendar, Clock, DollarSign, Save, Plus } from 'lucide-react';
import { Dialog, DialogActions, Button, Badge, SectionCard, FormField, Input, Tooltip, DatePicker } from '../ui';
import { formatCurrency, timeAgo } from '../../lib/utils';

export interface EscrowMilestone {
  id: string;
  title: string;
  description?: string;
  amount: number;
  due_date?: string;
  status: 'pending' | 'submitted' | 'approved' | 'released' | 'disputed';
  released_at?: string;
  released_amount?: number;
}

export interface EscrowEvent {
  id: string;
  type: 'created' | 'funded' | 'milestone_submitted' | 'milestone_approved' | 'released' | 'disputed' | 'resolved';
  at: string;
  actor?: string;
  detail?: string;
}

export interface EscrowAgreementLike {
  id: string;
  title?: string;
  deal_name?: string;
  counterparty_name?: string;
  counterparty_id?: string;
  owner_name?: string;
  amount?: number;
  funded_amount?: number;
  released_amount?: number;
  status?: string;
  created_at?: string;
  funded_at?: string;
  completion_date?: string;
  milestones?: EscrowMilestone[];
  events?: EscrowEvent[];
  notes?: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: '#6B7280',
  pending: '#F59E0B',
  funded: '#00F0FF',
  active: '#00F0FF',
  completed: '#10B981',
  disputed: '#EF4444',
  cancelled: '#6B7280',
};

const MS_STATUS_COLORS: Record<EscrowMilestone['status'], string> = {
  pending: '#6B7280',
  submitted: '#F59E0B',
  approved: '#00F0FF',
  released: '#10B981',
  disputed: '#EF4444',
};

const MS_STATUS_ORDER: EscrowMilestone['status'][] = ['pending', 'submitted', 'approved', 'released'];

export default function EscrowDetailDialog({
  open,
  onClose,
  escrow,
  onRelease,
  onDispute,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  escrow: EscrowAgreementLike | null;
  onRelease?: (escrowId: string, milestoneId: string) => void | Promise<void>;
  onDispute?: (escrowId: string, milestoneId: string, reason: string) => void | Promise<void>;
  onSave?: (updated: EscrowAgreementLike) => void | Promise<void>;
}) {
  const [draft, setDraft] = useState<EscrowAgreementLike | null>(escrow);
  const [disputeFor, setDisputeFor] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState('');

  useMemo(() => setDraft(escrow), [escrow]);

  if (!escrow || !draft) return null;

  const status = (draft.status || 'draft').toLowerCase();
  const statusColor = STATUS_COLORS[status] || '#6B7280';
  const title = draft.title || draft.deal_name || `Escrow ${draft.id.slice(0, 8)}`;
  const milestones = draft.milestones || [];
  const events = draft.events || [];

  const totalAmount = draft.amount || milestones.reduce((s, m) => s + m.amount, 0);
  const releasedAmount = draft.released_amount ?? milestones.filter((m) => m.status === 'released').reduce((s, m) => s + (m.released_amount ?? m.amount), 0);
  const pendingAmount = totalAmount - releasedAmount;
  const progressPct = totalAmount > 0 ? Math.round((releasedAmount / totalAmount) * 100) : 0;

  const update = <K extends keyof EscrowAgreementLike>(key: K, value: EscrowAgreementLike[K]) => {
    setDraft((p) => (p ? { ...p, [key]: value } : p));
  };

  const updateMilestone = (id: string, partial: Partial<EscrowMilestone>) => {
    update('milestones', milestones.map((m) => (m.id === id ? { ...m, ...partial } : m)));
  };

  const addMilestone = () => {
    const next: EscrowMilestone = {
      id: `ms_${Date.now()}`,
      title: 'New Milestone',
      amount: 0,
      status: 'pending',
    };
    update('milestones', [...milestones, next]);
  };

  const dirty = JSON.stringify(escrow) !== JSON.stringify(draft);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="xl"
      title={
        <span className="esc-dlg-title">
          <Lock size={18} />
          {title}
          <Badge color={statusColor} variant="outline" size="md">{status.toUpperCase()}</Badge>
        </span>
      }
      description={draft.counterparty_name || draft.counterparty_id || 'Unassigned counterparty'}
      footer={
        <DialogActions align="between">
          <div className="esc-dlg-meta">
            Released: <strong style={{ color: 'var(--success)' }}>{formatCurrency(releasedAmount)}</strong>
            {' · '}
            Pending: <strong style={{ color: 'var(--warning)' }}>{formatCurrency(pendingAmount)}</strong>
            {' · '}
            <strong>{progressPct}%</strong> complete
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
      <div className="esc-dlg-grid">
        <div className="esc-dlg-main">
          <SectionCard title="Deal Summary" icon={<DollarSign size={14} />} padding="md">
            <div className="esc-summary">
              <div className="esc-summary-item">
                <span>Total Deal</span>
                <strong>{formatCurrency(totalAmount)}</strong>
              </div>
              <div className="esc-summary-item">
                <span>Funded</span>
                <strong style={{ color: 'var(--cyan)' }}>{formatCurrency(draft.funded_amount ?? totalAmount)}</strong>
              </div>
              <div className="esc-summary-item">
                <span>Released</span>
                <strong style={{ color: 'var(--success)' }}>{formatCurrency(releasedAmount)}</strong>
              </div>
              <div className="esc-summary-item">
                <span>In Escrow</span>
                <strong style={{ color: 'var(--warning)' }}>{formatCurrency(pendingAmount)}</strong>
              </div>
            </div>
            <div className="esc-progress-wrap">
              <div className="esc-progress-track">
                <div className="esc-progress-fill" style={{ width: `${progressPct}%` }} />
              </div>
              <span className="esc-progress-label">{progressPct}% released</span>
            </div>
          </SectionCard>

          <SectionCard
            title={`Milestones (${milestones.length})`}
            icon={<CheckCircle2 size={14} />}
            action={<Button size="sm" variant="ghost" icon={<Plus size={12} />} onClick={addMilestone}>Add milestone</Button>}
          >
            {milestones.length === 0 ? (
              <p className="esc-empty">No milestones yet. Add one to get started.</p>
            ) : (
              <ol className="esc-ms-list">
                {milestones.map((m, idx) => {
                  const statusColor = MS_STATUS_COLORS[m.status];
                  const canRelease = m.status === 'approved' && !!onRelease;
                  return (
                    <li key={m.id} className="esc-ms-row">
                      <div className="esc-ms-marker-col">
                        <span className="esc-ms-idx">{idx + 1}</span>
                        <span className="esc-ms-marker" style={{ background: statusColor }} />
                      </div>
                      <div className="esc-ms-body">
                        <div className="esc-ms-head">
                          <input
                            className="esc-ms-title-input"
                            value={m.title}
                            onChange={(e) => updateMilestone(m.id, { title: e.target.value })}
                            placeholder="Milestone title"
                          />
                          <Badge color={statusColor} size="sm">{m.status}</Badge>
                        </div>
                        <textarea
                          className="esc-ms-desc-input"
                          value={m.description || ''}
                          onChange={(e) => updateMilestone(m.id, { description: e.target.value })}
                          placeholder="Deliverables, acceptance criteria…"
                          rows={2}
                        />
                        <div className="esc-ms-meta">
                          <div className="esc-ms-meta-field">
                            <span>Amount</span>
                            <input
                              className="esc-ms-num"
                              type="number"
                              value={m.amount}
                              onChange={(e) => updateMilestone(m.id, { amount: Number(e.target.value) })}
                            />
                          </div>
                          <div className="esc-ms-meta-field">
                            <span>Due</span>
                            <DatePicker
                              size="sm"
                              value={m.due_date?.slice(0, 10) || null}
                              onChange={(v) => updateMilestone(m.id, { due_date: v || undefined })}
                              ariaLabel="Milestone due date"
                            />
                          </div>
                          {m.released_at && (
                            <div className="esc-ms-meta-field">
                              <span>Released</span>
                              <strong style={{ color: 'var(--success)' }}>{timeAgo(m.released_at)}</strong>
                            </div>
                          )}
                        </div>
                        <div className="esc-ms-actions">
                          {canRelease && (
                            <Tooltip content="Release funds to counterparty">
                              <Button
                                size="sm"
                                variant="primary"
                                icon={<Unlock size={12} />}
                                onClick={() => onRelease?.(draft.id, m.id)}
                              >
                                Release {formatCurrency(m.amount)}
                              </Button>
                            </Tooltip>
                          )}
                          {m.status !== 'released' && onDispute && (
                            <Button
                              size="sm"
                              variant="ghost"
                              icon={<AlertTriangle size={12} />}
                              onClick={() => setDisputeFor(m.id)}
                            >
                              Dispute
                            </Button>
                          )}
                        </div>

                        {disputeFor === m.id && (
                          <div className="esc-dispute-form">
                            <FormField label="Dispute reason">
                              <Input
                                value={disputeReason}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDisputeReason(e.target.value)}
                                placeholder="Describe the issue"
                              />
                            </FormField>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => {
                                  if (onDispute && disputeReason.trim()) {
                                    onDispute(draft.id, m.id, disputeReason.trim());
                                    setDisputeFor(null);
                                    setDisputeReason('');
                                  }
                                }}
                              >
                                Submit dispute
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => { setDisputeFor(null); setDisputeReason(''); }}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </SectionCard>
        </div>

        <div className="esc-dlg-side">
          <SectionCard title="Parties" icon={<Users size={14} />} padding="md">
            <dl className="esc-stats">
              <div><dt>Owner</dt><dd>{draft.owner_name || 'You'}</dd></div>
              <div><dt>Counterparty</dt><dd>{draft.counterparty_name || draft.counterparty_id || '—'}</dd></div>
            </dl>
          </SectionCard>

          <SectionCard title="Timeline" icon={<Clock size={14} />} padding="md">
            <dl className="esc-stats">
              <div><dt>Created</dt><dd>{draft.created_at ? timeAgo(draft.created_at) : '—'}</dd></div>
              <div><dt>Funded</dt><dd>{draft.funded_at ? timeAgo(draft.funded_at) : 'Not yet'}</dd></div>
              <div><dt>Target completion</dt><dd>{draft.completion_date ? new Date(draft.completion_date).toLocaleDateString() : '—'}</dd></div>
            </dl>
          </SectionCard>

          <SectionCard title="Activity" icon={<Calendar size={14} />} padding="sm">
            {events.length === 0 ? (
              <p className="esc-empty">No activity yet.</p>
            ) : (
              <ul className="esc-event-list">
                {events.slice(0, 8).map((ev) => (
                  <li key={ev.id} className="esc-event-row">
                    {ev.type === 'released' ? <Unlock size={10} style={{ color: 'var(--success)' }} /> :
                     ev.type === 'disputed' ? <AlertTriangle size={10} style={{ color: 'var(--error)' }} /> :
                     <Circle size={10} style={{ color: 'var(--text-muted)' }} />}
                    <div className="esc-event-body">
                      <span className="esc-event-type">{ev.type.replace(/_/g, ' ')}</span>
                      {ev.detail && <span className="esc-event-detail">{ev.detail}</span>}
                    </div>
                    <span className="esc-event-time">{timeAgo(ev.at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>

      <style>{`
        .esc-dlg-title { display: inline-flex; align-items: center; gap: 10px; }
        .esc-dlg-meta { font-size: 12px; color: var(--text-secondary); }
        .esc-dlg-meta strong { font-family: var(--font-mono); }
        .esc-dlg-grid { display: grid; grid-template-columns: 1fr 280px; gap: 16px; }
        @media (max-width: 900px) { .esc-dlg-grid { grid-template-columns: 1fr; } }
        .esc-dlg-main, .esc-dlg-side { display: flex; flex-direction: column; gap: 12px; }
        .esc-empty { font-size: 12px; color: var(--text-muted); padding: 12px; }

        .esc-summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
        .esc-summary-item { padding: 10px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm); display: flex; flex-direction: column; gap: 4px; }
        .esc-summary-item span { font-size: 9px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
        .esc-summary-item strong { font-size: 13px; font-family: var(--font-mono); color: var(--text-primary); font-weight: 600; }
        .esc-progress-wrap { margin-top: 12px; display: flex; align-items: center; gap: 10px; }
        .esc-progress-track { flex: 1; height: 6px; background: var(--bg-input); border-radius: var(--radius-full); overflow: hidden; }
        .esc-progress-fill { height: 100%; background: linear-gradient(90deg, var(--cyan), var(--purple)); box-shadow: 0 0 8px var(--cyan-glow); transition: width var(--transition-slow); }
        .esc-progress-label { font-size: 11px; color: var(--text-muted); font-family: var(--font-mono); }

        .esc-ms-list { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 8px; }
        .esc-ms-row { display: grid; grid-template-columns: 24px 1fr; gap: 10px; padding: 12px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md); }
        .esc-ms-marker-col { display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .esc-ms-idx { font-size: 10px; font-family: var(--font-mono); color: var(--text-muted); font-weight: 700; }
        .esc-ms-marker { width: 10px; height: 10px; border-radius: 50%; box-shadow: 0 0 6px currentColor; }
        .esc-ms-body { display: flex; flex-direction: column; gap: 8px; }
        .esc-ms-head { display: flex; align-items: center; gap: 8px; }
        .esc-ms-title-input { flex: 1; background: transparent; border: 1px solid transparent; border-radius: var(--radius-sm); padding: 4px 6px; font-size: 13px; font-weight: 600; color: var(--text-primary); font-family: inherit; transition: all var(--transition-fast); }
        .esc-ms-title-input:hover { border-color: var(--border); }
        .esc-ms-title-input:focus { outline: none; border-color: var(--cyan); background: var(--bg-input); }
        .esc-ms-desc-input { background: transparent; border: 1px solid transparent; border-radius: var(--radius-sm); padding: 4px 6px; font-size: 12px; color: var(--text-secondary); font-family: inherit; resize: vertical; min-height: 30px; transition: all var(--transition-fast); }
        .esc-ms-desc-input:hover { border-color: var(--border); }
        .esc-ms-desc-input:focus { outline: none; border-color: var(--cyan); background: var(--bg-input); }
        .esc-ms-meta { display: flex; gap: 16px; font-size: 11px; }
        .esc-ms-meta-field { display: flex; flex-direction: column; gap: 2px; }
        .esc-ms-meta-field span { font-size: 9px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
        .esc-ms-num, .esc-ms-date { background: var(--bg-input); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 3px 6px; font-size: 12px; font-family: var(--font-mono); color: var(--text-primary); min-width: 80px; }
        .esc-ms-num:focus, .esc-ms-date:focus { outline: none; border-color: var(--cyan); }
        .esc-ms-actions { display: flex; gap: 6px; align-items: center; }
        .esc-dispute-form { display: flex; flex-direction: column; gap: 8px; padding: 10px; background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: var(--radius-sm); margin-top: 4px; }

        .esc-stats { display: flex; flex-direction: column; gap: 6px; font-size: 12px; }
        .esc-stats > div { display: flex; justify-content: space-between; gap: 8px; }
        .esc-stats dt { color: var(--text-muted); }
        .esc-stats dd { color: var(--text-primary); font-weight: 500; text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .esc-event-list { list-style: none; display: flex; flex-direction: column; gap: 4px; }
        .esc-event-row { display: grid; grid-template-columns: 12px 1fr auto; gap: 8px; padding: 6px 8px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 11px; align-items: center; }
        .esc-event-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .esc-event-type { font-size: 10px; text-transform: capitalize; color: var(--text-primary); font-weight: 500; }
        .esc-event-detail { font-size: 10px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .esc-event-time { font-size: 9px; color: var(--text-muted); font-family: var(--font-mono); }
      `}</style>
    </Dialog>
  );
}
