import { Globe, TrendingUp, AlertTriangle, DollarSign, Calendar, FileText, ExternalLink } from 'lucide-react';
import { Dialog, DialogActions, Button, Badge, SectionCard, Tooltip } from '../ui';
import { formatCurrency, timeAgo } from '../../lib/utils';

export interface NexusAlertLike {
  id: string;
  jurisdiction?: string;
  state?: string;
  country?: string;
  severity?: 'info' | 'warning' | 'critical';
  message?: string;
  revenue_threshold?: number;
  current_revenue?: number;
  transaction_threshold?: number;
  current_transactions?: number;
  threshold_period_days?: number;
  first_triggered_at?: string;
  detected_at?: string;
  registration_deadline?: string;
  registration_url?: string;
  status?: 'new' | 'acknowledged' | 'registered' | 'exempt';
  notes?: string;
  related_rule_id?: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  info: '#00F0FF',
  warning: '#F59E0B',
  critical: '#EF4444',
};

const STATUS_COLORS: Record<string, string> = {
  new: '#EF4444',
  acknowledged: '#F59E0B',
  registered: '#10B981',
  exempt: '#6B7280',
};

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function NexusAlertDetailDialog({
  open,
  onClose,
  alert,
  onAcknowledge,
  onMarkRegistered,
  onMarkExempt,
}: {
  open: boolean;
  onClose: () => void;
  alert: NexusAlertLike | null;
  onAcknowledge?: (id: string) => void;
  onMarkRegistered?: (id: string) => void;
  onMarkExempt?: (id: string) => void;
}) {
  if (!alert) return null;

  const severity = (alert.severity || 'info').toLowerCase();
  const severityColor = SEVERITY_COLORS[severity] || '#00F0FF';
  const status = (alert.status || 'new').toLowerCase();
  const statusColor = STATUS_COLORS[status] || '#EF4444';
  const jurisdiction = alert.jurisdiction || alert.state || alert.country || 'Unknown';

  const revenuePct = alert.revenue_threshold && alert.current_revenue
    ? Math.min(100, Math.round((alert.current_revenue / alert.revenue_threshold) * 100))
    : 0;
  const transactionPct = alert.transaction_threshold && alert.current_transactions
    ? Math.min(100, Math.round((alert.current_transactions / alert.transaction_threshold) * 100))
    : 0;

  const deadlineDays = alert.registration_deadline ? daysUntil(alert.registration_deadline) : null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title={
        <span className="nex-dlg-title">
          <Globe size={18} />
          Nexus Alert — {jurisdiction}
          <Badge color={severityColor} variant="outline" size="md">{severity.toUpperCase()}</Badge>
          <Badge color={statusColor} size="md">{status.toUpperCase()}</Badge>
        </span>
      }
      description={alert.message || 'Sales tax nexus threshold approaching'}
      footer={
        <DialogActions align="between">
          {alert.registration_url && (
            <Tooltip content="Open registration portal in new tab">
              <Button
                variant="ghost"
                size="sm"
                icon={<ExternalLink size={13} />}
                onClick={() => window.open(alert.registration_url, '_blank', 'noopener,noreferrer')}
              >
                Register in {jurisdiction}
              </Button>
            </Tooltip>
          )}
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
            {status === 'new' && onAcknowledge && (
              <Button variant="secondary" size="sm" onClick={() => onAcknowledge(alert.id)}>
                Acknowledge
              </Button>
            )}
            {status !== 'registered' && onMarkRegistered && (
              <Button variant="primary" size="sm" onClick={() => onMarkRegistered(alert.id)}>
                Mark Registered
              </Button>
            )}
            {status !== 'exempt' && onMarkExempt && (
              <Button variant="ghost" size="sm" onClick={() => onMarkExempt(alert.id)}>
                Mark Exempt
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
          </div>
        </DialogActions>
      }
    >
      <div className="nex-dlg-stack">
        <SectionCard title="Threshold Progress" icon={<TrendingUp size={14} />} padding="md">
          <div className="nex-thresholds">
            {alert.revenue_threshold !== undefined && (
              <div className="nex-threshold">
                <div className="nex-thresh-head">
                  <DollarSign size={12} />
                  <span>Revenue threshold</span>
                  <strong style={{ color: revenuePct >= 100 ? 'var(--error)' : revenuePct >= 80 ? 'var(--warning)' : 'var(--text-primary)' }}>
                    {revenuePct}%
                  </strong>
                </div>
                <div className="nex-bar">
                  <div className="nex-bar-fill" style={{ width: `${revenuePct}%`, background: revenuePct >= 100 ? 'var(--error)' : revenuePct >= 80 ? 'var(--warning)' : 'var(--cyan)' }} />
                </div>
                <div className="nex-thresh-foot">
                  <span>{formatCurrency(alert.current_revenue || 0)} of {formatCurrency(alert.revenue_threshold)}</span>
                  {alert.threshold_period_days && <span className="nex-period">in last {alert.threshold_period_days} days</span>}
                </div>
              </div>
            )}

            {alert.transaction_threshold !== undefined && (
              <div className="nex-threshold">
                <div className="nex-thresh-head">
                  <TrendingUp size={12} />
                  <span>Transaction count</span>
                  <strong style={{ color: transactionPct >= 100 ? 'var(--error)' : transactionPct >= 80 ? 'var(--warning)' : 'var(--text-primary)' }}>
                    {transactionPct}%
                  </strong>
                </div>
                <div className="nex-bar">
                  <div className="nex-bar-fill" style={{ width: `${transactionPct}%`, background: transactionPct >= 100 ? 'var(--error)' : transactionPct >= 80 ? 'var(--warning)' : 'var(--cyan)' }} />
                </div>
                <div className="nex-thresh-foot">
                  <span>{(alert.current_transactions || 0).toLocaleString()} of {alert.transaction_threshold.toLocaleString()} transactions</span>
                  {alert.threshold_period_days && <span className="nex-period">in last {alert.threshold_period_days} days</span>}
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        {alert.registration_deadline && (
          <SectionCard title="Registration Deadline" icon={<Calendar size={14} />} padding="md">
            <div className="nex-deadline">
              <AlertTriangle size={20} style={{ color: deadlineDays && deadlineDays < 30 ? 'var(--error)' : 'var(--warning)' }} />
              <div>
                <div className="nex-deadline-date">{new Date(alert.registration_deadline).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
                <div className="nex-deadline-delta">
                  {deadlineDays === null ? '' : deadlineDays < 0 ? <span style={{ color: 'var(--error)' }}>Overdue by {Math.abs(deadlineDays)} days</span> : <span>{deadlineDays} days remaining</span>}
                </div>
              </div>
            </div>
          </SectionCard>
        )}

        <SectionCard title="Details" icon={<FileText size={14} />} padding="md">
          <dl className="nex-details">
            <div><dt>Jurisdiction</dt><dd>{jurisdiction}</dd></div>
            {alert.country && <div><dt>Country</dt><dd>{alert.country}</dd></div>}
            {alert.detected_at && <div><dt>Detected</dt><dd>{timeAgo(alert.detected_at)}</dd></div>}
            {alert.first_triggered_at && <div><dt>First triggered</dt><dd>{timeAgo(alert.first_triggered_at)}</dd></div>}
            {alert.related_rule_id && (
              <div>
                <dt>Source rule</dt>
                <dd style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{alert.related_rule_id}</dd>
              </div>
            )}
          </dl>
        </SectionCard>

        {alert.notes && (
          <SectionCard title="Notes">
            <p className="nex-notes">{alert.notes}</p>
          </SectionCard>
        )}
      </div>

      <style>{`
        .nex-dlg-title { display: inline-flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .nex-dlg-stack { display: flex; flex-direction: column; gap: 12px; }
        .nex-thresholds { display: flex; flex-direction: column; gap: 14px; }
        .nex-threshold { display: flex; flex-direction: column; gap: 6px; }
        .nex-thresh-head { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-secondary); }
        .nex-thresh-head strong { margin-left: auto; font-family: var(--font-mono); font-weight: 700; }
        .nex-bar { height: 8px; background: var(--bg-input); border-radius: var(--radius-full); overflow: hidden; }
        .nex-bar-fill { height: 100%; transition: width var(--transition-slow); box-shadow: 0 0 6px currentColor; }
        .nex-thresh-foot { display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted); font-family: var(--font-mono); }
        .nex-period { font-size: 10px; }
        .nex-deadline { display: flex; align-items: center; gap: 12px; padding: 8px; }
        .nex-deadline-date { font-size: 14px; font-weight: 600; color: var(--text-primary); }
        .nex-deadline-delta { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
        .nex-details { display: flex; flex-direction: column; gap: 6px; font-size: 12px; }
        .nex-details > div { display: flex; justify-content: space-between; }
        .nex-details dt { color: var(--text-muted); }
        .nex-details dd { color: var(--text-primary); font-weight: 500; }
        .nex-notes { font-size: 12px; color: var(--text-secondary); line-height: 1.5; white-space: pre-wrap; }
      `}</style>
    </Dialog>
  );
}
