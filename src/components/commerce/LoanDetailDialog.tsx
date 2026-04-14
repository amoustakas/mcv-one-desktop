import { useMemo, useState } from 'react';
import { Banknote, Send, CheckCircle2, Calendar, Clock, DollarSign, Percent, TrendingDown } from 'lucide-react';
import { Dialog, DialogActions, Button, Badge, SectionCard, FormField, Input } from '../ui';
import { formatCurrency, timeAgo } from '../../lib/utils';

interface RepaymentRecord {
  id: string;
  amount: number;
  principal?: number;
  interest?: number;
  recorded_at: string;
  reference?: string;
}

interface LoanLike {
  id: string;
  loan_number?: string;
  status?: string;
  borrower_name?: string;
  borrower_email?: string;
  borrower_id?: string;
  principal?: number;
  balance?: number;
  disbursed_amount?: number;
  interest_rate?: number; // annual %
  term_months?: number;
  created_at?: string;
  approved_at?: string;
  disbursed_at?: string;
  next_payment_date?: string;
  repayments?: RepaymentRecord[];
  notes?: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: '#6B7280',
  approved: '#00F0FF',
  disbursed: '#8B5CF6',
  active: '#F59E0B',
  repaid: '#10B981',
  defaulted: '#EF4444',
};

interface AmortRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

/**
 * Standard amortization math:
 *   M = P * [r(1+r)^n / ((1+r)^n − 1)]
 * where P = principal, r = monthly rate, n = term in months
 */
function buildAmortization(principal: number, annualRatePct: number, termMonths: number): AmortRow[] {
  if (principal <= 0 || termMonths <= 0) return [];
  const r = annualRatePct / 100 / 12;
  const n = termMonths;
  const payment = r === 0 ? principal / n : (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

  const rows: AmortRow[] = [];
  let balance = principal;
  for (let m = 1; m <= n; m++) {
    const interest = balance * r;
    const principalPaid = Math.min(payment - interest, balance);
    balance = Math.max(0, balance - principalPaid);
    rows.push({ month: m, payment, principal: principalPaid, interest, balance });
  }
  return rows;
}

export default function LoanDetailDialog({
  open,
  onClose,
  loan,
  onDisburse,
  onRepay,
}: {
  open: boolean;
  onClose: () => void;
  loan: LoanLike | null;
  onDisburse?: (id: string) => void | Promise<void>;
  onRepay?: (id: string, amount: number) => void | Promise<void>;
}) {
  const [repayAmount, setRepayAmount] = useState('');

  const amort = useMemo(() => {
    if (!loan) return [];
    const principal = loan.principal || 0;
    const rate = loan.interest_rate ?? 8;
    const term = loan.term_months ?? 12;
    return buildAmortization(principal, rate, term);
  }, [loan]);

  if (!loan) return null;

  const status = (loan.status || 'draft').toLowerCase();
  const statusColor = STATUS_COLORS[status] || '#6B7280';
  const loanNumber = loan.loan_number || loan.id.slice(0, 8);

  const repayments = loan.repayments || [];
  const totalRepaid = repayments.reduce((s, r) => s + r.amount, 0);
  const balance = loan.balance ?? Math.max(0, (loan.principal || 0) - totalRepaid);
  const payment = amort[0]?.payment ?? 0;

  const timeline: { label: string; at: string; icon: React.ElementType; done: boolean }[] = [
    { label: 'Application drafted', at: loan.created_at || '', icon: Clock, done: !!loan.created_at },
    { label: 'Approved', at: loan.approved_at || '', icon: CheckCircle2, done: !!loan.approved_at || ['approved', 'disbursed', 'active', 'repaid'].includes(status) },
    { label: 'Disbursed', at: loan.disbursed_at || '', icon: Send, done: ['disbursed', 'active', 'repaid'].includes(status) },
    { label: 'Repaid in full', at: '', icon: TrendingDown, done: status === 'repaid' },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="xl"
      title={
        <span className="loan-dlg-title">
          <Banknote size={18} />
          Loan {loanNumber}
          <Badge color={statusColor} variant="outline" size="md">{status.toUpperCase()}</Badge>
        </span>
      }
      description={loan.borrower_name || loan.borrower_email || loan.borrower_id}
      footer={
        <DialogActions align="between">
          <div className="loan-dlg-footer-stats">
            Balance: <strong style={{ color: 'var(--warning)' }}>{formatCurrency(balance)}</strong>
            {status === 'active' && payment > 0 && (
              <> · Payment: <strong>{formatCurrency(payment)}</strong>/mo</>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {status === 'approved' && onDisburse && (
              <Button variant="primary" size="sm" icon={<Send size={13} />} onClick={() => onDisburse(loan.id)}>
                Disburse {formatCurrency(loan.principal || 0)}
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
          </div>
        </DialogActions>
      }
    >
      <div className="loan-dlg-grid">
        <div className="loan-dlg-main">
          <SectionCard title="Loan Terms" icon={<DollarSign size={14} />} padding="md">
            <div className="loan-terms-grid">
              <div><span>Principal</span><strong>{formatCurrency(loan.principal || 0)}</strong></div>
              <div><span>Interest Rate</span><strong>{loan.interest_rate ?? '–'}% APR</strong></div>
              <div><span>Term</span><strong>{loan.term_months ?? '–'} months</strong></div>
              <div><span>Monthly Payment</span><strong style={{ color: 'var(--cyan)' }}>{formatCurrency(payment)}</strong></div>
              <div><span>Total Repaid</span><strong style={{ color: 'var(--success)' }}>{formatCurrency(totalRepaid)}</strong></div>
              <div><span>Balance</span><strong style={{ color: 'var(--warning)' }}>{formatCurrency(balance)}</strong></div>
            </div>
          </SectionCard>

          <SectionCard title="Amortization Schedule" icon={<Percent size={14} />} description={`${amort.length} scheduled payments`} padding="none">
            {amort.length === 0 ? (
              <p className="loan-dlg-empty">Add principal, rate, and term to see the amortization schedule.</p>
            ) : (
              <div className="loan-amort-wrap">
                <table className="loan-amort-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th style={{ textAlign: 'right' }}>Payment</th>
                      <th style={{ textAlign: 'right' }}>Principal</th>
                      <th style={{ textAlign: 'right' }}>Interest</th>
                      <th style={{ textAlign: 'right' }}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {amort.map((row) => (
                      <tr key={row.month}>
                        <td>{row.month}</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(row.payment)}</td>
                        <td style={{ textAlign: 'right', color: 'var(--cyan)' }}>{formatCurrency(row.principal)}</td>
                        <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{formatCurrency(row.interest)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(row.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          {status === 'active' && onRepay && balance > 0 && (
            <SectionCard title="Record Repayment">
              <div className="loan-repay-form">
                <FormField label="Amount">
                  <Input
                    type="number"
                    placeholder={formatCurrency(payment)}
                    value={repayAmount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRepayAmount(e.target.value)}
                  />
                </FormField>
                <Button
                  variant="primary"
                  icon={<CheckCircle2 size={13} />}
                  onClick={() => {
                    const amt = Number(repayAmount) || payment;
                    if (amt > 0) { onRepay(loan.id, amt); setRepayAmount(''); }
                  }}
                >
                  Record Payment
                </Button>
              </div>
            </SectionCard>
          )}
        </div>

        <div className="loan-dlg-side">
          <SectionCard title="Timeline" icon={<Clock size={14} />}>
            <ol className="loan-dlg-timeline">
              {timeline.map((step) => {
                const Icon = step.icon;
                return (
                  <li key={step.label} className={step.done ? 'loan-tl-done' : 'loan-tl-pending'}>
                    <span className="loan-tl-marker"><Icon size={11} /></span>
                    <div>
                      <span className="loan-tl-label">{step.label}</span>
                      {step.at && <span className="loan-tl-at">{timeAgo(step.at)}</span>}
                    </div>
                  </li>
                );
              })}
            </ol>
          </SectionCard>

          <SectionCard title={`Repayments (${repayments.length})`} padding="sm">
            {repayments.length === 0 ? (
              <p className="loan-dlg-empty">No repayments recorded.</p>
            ) : (
              <ul className="loan-repay-list">
                {repayments.map((r) => (
                  <li key={r.id} className="loan-repay-row">
                    <span className="loan-repay-amount">{formatCurrency(r.amount)}</span>
                    {r.principal !== undefined && (
                      <span className="loan-repay-split">
                        {formatCurrency(r.principal)} principal · {formatCurrency(r.interest || 0)} interest
                      </span>
                    )}
                    <span className="loan-repay-time">{timeAgo(r.recorded_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Next Payment" icon={<Calendar size={14} />} padding="md">
            {loan.next_payment_date ? (
              <>
                <div className="loan-next-date">{new Date(loan.next_payment_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                <div className="loan-next-amount">{formatCurrency(payment)}</div>
              </>
            ) : (
              <p className="loan-dlg-empty">Not scheduled yet.</p>
            )}
          </SectionCard>
        </div>
      </div>

      <style>{`
        .loan-dlg-title { display: inline-flex; align-items: center; gap: 10px; }
        .loan-dlg-footer-stats { font-size: 12px; color: var(--text-secondary); }
        .loan-dlg-footer-stats strong { color: var(--text-primary); font-family: var(--font-mono); }
        .loan-dlg-grid { display: grid; grid-template-columns: 1fr 280px; gap: 16px; }
        @media (max-width: 900px) { .loan-dlg-grid { grid-template-columns: 1fr; } }
        .loan-dlg-main, .loan-dlg-side { display: flex; flex-direction: column; gap: 12px; }
        .loan-dlg-empty { font-size: 12px; color: var(--text-muted); padding: 12px; }
        .loan-terms-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .loan-terms-grid > div { display: flex; flex-direction: column; gap: 4px; padding: 10px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm); }
        .loan-terms-grid span { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
        .loan-terms-grid strong { font-size: 14px; color: var(--text-primary); font-family: var(--font-mono); font-weight: 600; }
        .loan-amort-wrap { max-height: 280px; overflow-y: auto; }
        .loan-amort-table { width: 100%; border-collapse: collapse; font-size: 11px; font-family: var(--font-mono); }
        .loan-amort-table thead { position: sticky; top: 0; background: var(--bg-card); border-bottom: 1px solid var(--border); }
        .loan-amort-table th { padding: 8px 10px; text-align: left; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); }
        .loan-amort-table td { padding: 6px 10px; border-bottom: 1px solid var(--border); color: var(--text-secondary); }
        .loan-amort-table tbody tr:hover { background: var(--bg-hover); }
        .loan-repay-form { display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: flex-end; }
        .loan-dlg-timeline { list-style: none; padding: 0 0 0 4px; position: relative; display: flex; flex-direction: column; gap: 10px; }
        .loan-dlg-timeline::before { content: ""; position: absolute; left: 10px; top: 10px; bottom: 10px; width: 1px; background: var(--border); }
        .loan-dlg-timeline li { display: flex; align-items: flex-start; gap: 10px; position: relative; }
        .loan-tl-marker { width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--bg-card); border: 1px solid var(--border); color: var(--text-muted); z-index: 1; flex-shrink: 0; }
        .loan-tl-done .loan-tl-marker { background: var(--success); color: white; border-color: var(--success); }
        .loan-tl-pending { opacity: 0.6; }
        .loan-tl-label { display: block; font-size: 12px; font-weight: 500; color: var(--text-primary); }
        .loan-tl-at { display: block; font-size: 10px; color: var(--text-muted); font-family: var(--font-mono); }
        .loan-repay-list { list-style: none; display: flex; flex-direction: column; gap: 4px; }
        .loan-repay-row { padding: 6px 8px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 11px; display: flex; flex-direction: column; gap: 2px; }
        .loan-repay-amount { color: var(--success); font-weight: 600; font-family: var(--font-mono); }
        .loan-repay-split { font-size: 10px; color: var(--text-muted); font-family: var(--font-mono); }
        .loan-repay-time { font-size: 9px; color: var(--text-muted); font-family: var(--font-mono); }
        .loan-next-date { font-size: 13px; color: var(--text-primary); font-weight: 600; }
        .loan-next-amount { font-size: 18px; color: var(--cyan); font-family: var(--font-display); font-weight: 700; margin-top: 4px; }
      `}</style>
    </Dialog>
  );
}
