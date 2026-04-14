import { useMemo, useState } from 'react';
import { Wallet, Plus, Minus, ArrowRightLeft, XCircle, Calendar } from 'lucide-react';
import { Dialog, DialogActions, Button, Badge, SectionCard, FormField, Input, Select } from '../ui';
import { formatCurrency, timeAgo } from '../../lib/utils';

interface LedgerEntry {
  id: string;
  type: 'issue' | 'redeem' | 'transfer_in' | 'transfer_out' | 'revoke' | 'adjustment';
  amount: number;
  balance_after?: number;
  created_at: string;
  memo?: string;
  reference?: string;
}

interface CreditWalletLike {
  id: string;
  wallet_id?: string;
  owner_name?: string;
  owner_email?: string;
  owner_id?: string;
  balance?: number;
  status?: string;
  currency?: string;
  issued_total?: number;
  redeemed_total?: number;
  created_at?: string;
  expires_at?: string;
  ledger?: LedgerEntry[];
  notes?: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: '#10B981',
  suspended: '#F59E0B',
  revoked: '#EF4444',
  expired: '#6B7280',
};

const TYPE_META: Record<LedgerEntry['type'], { label: string; color: string; icon: React.ElementType }> = {
  issue:         { label: 'Issued',       color: '#10B981', icon: Plus },
  redeem:        { label: 'Redeemed',     color: '#F59E0B', icon: Minus },
  transfer_in:   { label: 'Received',     color: '#00F0FF', icon: ArrowRightLeft },
  transfer_out:  { label: 'Sent',         color: '#8B5CF6', icon: ArrowRightLeft },
  revoke:        { label: 'Revoked',      color: '#EF4444', icon: XCircle },
  adjustment:    { label: 'Adjustment',   color: '#6B7280', icon: ArrowRightLeft },
};

export default function CreditDetailDialog({
  open,
  onClose,
  wallet,
  onIssue,
  onRevoke,
  onTransfer,
}: {
  open: boolean;
  onClose: () => void;
  wallet: CreditWalletLike | null;
  onIssue?: (id: string, amount: number, memo?: string) => void | Promise<void>;
  onRevoke?: (id: string, amount: number, reason?: string) => void | Promise<void>;
  onTransfer?: (id: string, toWalletId: string, amount: number) => void | Promise<void>;
}) {
  const [action, setAction] = useState<'issue' | 'revoke' | 'transfer'>('issue');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [toWallet, setToWallet] = useState('');

  const ledger = useMemo(() => wallet?.ledger || [], [wallet]);
  const totals = useMemo(() => {
    const issued = ledger.filter((e) => e.type === 'issue' || e.type === 'transfer_in').reduce((s, e) => s + e.amount, 0);
    const redeemed = ledger.filter((e) => e.type === 'redeem' || e.type === 'transfer_out' || e.type === 'revoke').reduce((s, e) => s + e.amount, 0);
    return { issued, redeemed };
  }, [ledger]);

  if (!wallet) return null;

  const status = (wallet.status || 'active').toLowerCase();
  const statusColor = STATUS_COLORS[status] || '#6B7280';
  const walletLabel = wallet.wallet_id || wallet.id.slice(0, 10);
  const currency = wallet.currency || 'USD';
  const balance = wallet.balance ?? totals.issued - totals.redeemed;

  const actionOptions = [
    { value: 'issue', label: 'Issue Credits' },
    { value: 'revoke', label: 'Revoke Credits' },
    { value: 'transfer', label: 'Transfer' },
  ];

  const submitAction = () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) return;
    if (action === 'issue' && onIssue) onIssue(wallet.id, amt, memo || undefined);
    if (action === 'revoke' && onRevoke) onRevoke(wallet.id, amt, memo || undefined);
    if (action === 'transfer' && onTransfer && toWallet) onTransfer(wallet.id, toWallet, amt);
    setAmount('');
    setMemo('');
    setToWallet('');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="xl"
      title={
        <span className="cred-dlg-title">
          <Wallet size={18} />
          Wallet {walletLabel}
          <Badge color={statusColor} variant="outline" size="md">{status.toUpperCase()}</Badge>
        </span>
      }
      description={wallet.owner_name || wallet.owner_email || wallet.owner_id}
      footer={
        <DialogActions align="between">
          <div className="cred-dlg-balance">
            Balance: <strong>{formatCurrency(balance)}</strong> {currency}
          </div>
          <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
        </DialogActions>
      }
    >
      <div className="cred-dlg-grid">
        <div className="cred-dlg-main">
          <SectionCard title="Balance Summary" icon={<Wallet size={14} />} padding="md">
            <div className="cred-summary">
              <div className="cred-summary-item">
                <span>Current Balance</span>
                <strong className="cred-summary-balance">{formatCurrency(balance)}</strong>
              </div>
              <div className="cred-summary-item">
                <span>Total Issued</span>
                <strong style={{ color: 'var(--success)' }}>{formatCurrency(wallet.issued_total ?? totals.issued)}</strong>
              </div>
              <div className="cred-summary-item">
                <span>Total Redeemed</span>
                <strong style={{ color: 'var(--warning)' }}>{formatCurrency(wallet.redeemed_total ?? totals.redeemed)}</strong>
              </div>
              <div className="cred-summary-item">
                <span>Utilization</span>
                <strong>{totals.issued > 0 ? `${Math.round((totals.redeemed / totals.issued) * 100)}%` : '—'}</strong>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Ledger"
            description={`${ledger.length} ${ledger.length === 1 ? 'entry' : 'entries'}`}
            padding="none"
          >
            {ledger.length === 0 ? (
              <p className="cred-dlg-empty">No ledger activity yet.</p>
            ) : (
              <div className="cred-ledger-wrap">
                <table className="cred-ledger-table">
                  <thead>
                    <tr>
                      <th style={{ width: 100 }}>Type</th>
                      <th style={{ textAlign: 'right', width: 110 }}>Amount</th>
                      <th style={{ textAlign: 'right', width: 110 }}>Balance After</th>
                      <th>Memo / Reference</th>
                      <th style={{ width: 80, textAlign: 'right' }}>When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.map((entry) => {
                      const meta = TYPE_META[entry.type];
                      const Icon = meta.icon;
                      const positive = entry.type === 'issue' || entry.type === 'transfer_in';
                      return (
                        <tr key={entry.id}>
                          <td>
                            <span className="cred-ledger-type" style={{ color: meta.color, borderColor: meta.color + '55' }}>
                              <Icon size={10} /> {meta.label}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', color: positive ? 'var(--success)' : 'var(--warning)', fontWeight: 600 }}>
                            {positive ? '+' : '−'}{formatCurrency(entry.amount)}
                          </td>
                          <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                            {entry.balance_after !== undefined ? formatCurrency(entry.balance_after) : '—'}
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: 10 }}>
                            {entry.memo || entry.reference || '—'}
                          </td>
                          <td style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: 10 }}>
                            {timeAgo(entry.created_at)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>

        <div className="cred-dlg-side">
          <SectionCard title="Wallet Actions" icon={<ArrowRightLeft size={14} />}>
            <div className="cred-action-form">
              <FormField label="Action">
                <Select
                  value={action}
                  onChange={(v: string) => setAction(v as typeof action)}
                  options={actionOptions}
                />
              </FormField>
              <FormField label="Amount" hint={`In ${currency}`}>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
                />
              </FormField>
              {action === 'transfer' && (
                <FormField label="Destination Wallet ID">
                  <Input
                    placeholder="wallet_…"
                    value={toWallet}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToWallet(e.target.value)}
                  />
                </FormField>
              )}
              {action !== 'transfer' && (
                <FormField label="Memo" hint="Optional note for the ledger entry">
                  <Input
                    placeholder="Reason or reference"
                    value={memo}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMemo(e.target.value)}
                  />
                </FormField>
              )}
              <Button
                variant={action === 'revoke' ? 'danger' : 'primary'}
                onClick={submitAction}
                disabled={!amount || (action === 'transfer' && !toWallet)}
              >
                {action === 'issue' && 'Issue Credits'}
                {action === 'revoke' && 'Revoke Credits'}
                {action === 'transfer' && 'Send Transfer'}
              </Button>
            </div>
          </SectionCard>

          <SectionCard title="Dates" icon={<Calendar size={14} />} padding="md">
            <dl className="cred-dates">
              <div><dt>Created</dt><dd>{wallet.created_at ? new Date(wallet.created_at).toLocaleDateString() : '—'}</dd></div>
              <div><dt>Expires</dt><dd>{wallet.expires_at ? new Date(wallet.expires_at).toLocaleDateString() : 'Never'}</dd></div>
            </dl>
          </SectionCard>
        </div>
      </div>

      <style>{`
        .cred-dlg-title { display: inline-flex; align-items: center; gap: 10px; }
        .cred-dlg-balance { font-size: 13px; color: var(--text-secondary); }
        .cred-dlg-balance strong { color: var(--cyan); font-family: var(--font-mono); font-size: 15px; }
        .cred-dlg-grid { display: grid; grid-template-columns: 1fr 300px; gap: 16px; }
        @media (max-width: 900px) { .cred-dlg-grid { grid-template-columns: 1fr; } }
        .cred-dlg-main, .cred-dlg-side { display: flex; flex-direction: column; gap: 12px; }
        .cred-dlg-empty { font-size: 12px; color: var(--text-muted); padding: 16px; text-align: center; }
        .cred-summary { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
        .cred-summary-item { padding: 12px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm); display: flex; flex-direction: column; gap: 4px; }
        .cred-summary-item span { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
        .cred-summary-item strong { font-size: 14px; font-family: var(--font-mono); color: var(--text-primary); font-weight: 600; }
        .cred-summary-balance { font-size: 20px !important; color: var(--cyan) !important; font-family: var(--font-display) !important; }
        .cred-ledger-wrap { max-height: 340px; overflow-y: auto; }
        .cred-ledger-table { width: 100%; border-collapse: collapse; font-size: 11px; }
        .cred-ledger-table thead { position: sticky; top: 0; background: var(--bg-card); border-bottom: 1px solid var(--border); }
        .cred-ledger-table th { padding: 8px 10px; text-align: left; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); }
        .cred-ledger-table td { padding: 8px 10px; border-bottom: 1px solid var(--border); }
        .cred-ledger-table tbody tr:hover { background: var(--bg-hover); }
        .cred-ledger-type { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: var(--radius-full); border: 1px solid; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
        .cred-action-form { display: flex; flex-direction: column; gap: 10px; }
        .cred-dates { display: flex; flex-direction: column; gap: 4px; font-size: 12px; }
        .cred-dates > div { display: flex; justify-content: space-between; }
        .cred-dates dt { color: var(--text-muted); }
        .cred-dates dd { color: var(--text-primary); font-family: var(--font-mono); }
      `}</style>
    </Dialog>
  );
}
