import { useMemo } from 'react';
import { Receipt, Send, CheckCircle2, Download, Copy, Calendar, Clock, ArrowUpRight, FileText } from 'lucide-react';
import { Dialog, DialogActions, Button, Badge, SectionCard, Tooltip } from '../ui';
import { formatCurrency, timeAgo } from '../../lib/utils';
import { useToast } from '../Toasts';

interface LineItem {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate?: number;
}

interface PaymentRecord {
  id: string;
  amount: number;
  recorded_at: string;
  method?: string;
  reference?: string;
}

interface InvoiceLike {
  id: string;
  invoice_number?: string;
  number?: string;
  status?: string;
  customer_name?: string;
  customer_email?: string;
  customer_id?: string;
  amount?: number;
  total?: number;
  subtotal?: number;
  tax?: number;
  due_date?: string;
  created_at?: string;
  issued_at?: string;
  sent_at?: string;
  paid_at?: string;
  line_items?: LineItem[];
  payments?: PaymentRecord[];
  notes?: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: '#6B7280',
  sent: '#F59E0B',
  paid: '#10B981',
  overdue: '#EF4444',
  cancelled: '#6B7280',
};

function statusLabel(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export default function InvoiceDetailDialog({
  open,
  onClose,
  invoice,
  onSend,
  onMarkPaid,
  onDownload,
}: {
  open: boolean;
  onClose: () => void;
  invoice: InvoiceLike | null;
  onSend?: (id: string) => void | Promise<void>;
  onMarkPaid?: (id: string, amount: number) => void | Promise<void>;
  onDownload?: (id: string) => void;
}) {
  const { toast } = useToast();

  const totals = useMemo(() => {
    if (!invoice) return { subtotal: 0, tax: 0, total: 0 };
    const lineSubtotal = (invoice.line_items || []).reduce(
      (sum, li) => sum + li.quantity * li.unit_price,
      0,
    );
    const subtotal = invoice.subtotal ?? lineSubtotal;
    const tax = invoice.tax ?? Math.round(subtotal * 0.08 * 100) / 100;
    const total = invoice.total ?? invoice.amount ?? subtotal + tax;
    return { subtotal, tax, total };
  }, [invoice]);

  if (!invoice) return null;

  const status = (invoice.status || 'draft').toLowerCase();
  const statusColor = STATUS_COLORS[status] || '#6B7280';
  const invoiceNumber = invoice.invoice_number || invoice.number || invoice.id.slice(0, 8);

  const timeline: { label: string; at: string; icon: React.ElementType; done: boolean }[] = [
    {
      label: 'Drafted',
      at: invoice.created_at || '',
      icon: FileText,
      done: !!invoice.created_at,
    },
    {
      label: 'Sent to customer',
      at: invoice.sent_at || '',
      icon: Send,
      done: !!invoice.sent_at || status === 'sent' || status === 'paid' || status === 'overdue',
    },
    {
      label: 'Paid in full',
      at: invoice.paid_at || '',
      icon: CheckCircle2,
      done: status === 'paid',
    },
  ];

  const payments = invoice.payments || [];
  const amountPaid = payments.reduce((s, p) => s + p.amount, 0);
  const balance = Math.max(0, totals.total - amountPaid);

  const copyInvoiceNumber = () => {
    navigator.clipboard.writeText(invoiceNumber);
    toast('success', 'Invoice number copied');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="xl"
      title={
        <span className="inv-dlg-title">
          <Receipt size={18} />
          Invoice {invoiceNumber}
          <Tooltip content="Copy invoice number">
            <button type="button" className="inv-dlg-copy" onClick={copyInvoiceNumber} aria-label="Copy invoice number">
              <Copy size={12} />
            </button>
          </Tooltip>
          <Badge color={statusColor} variant="outline" size="md">{statusLabel(status)}</Badge>
        </span>
      }
      description={invoice.customer_name || invoice.customer_email || invoice.customer_id}
      footer={
        <DialogActions align="between">
          <Button variant="ghost" size="sm" icon={<Download size={13} />} onClick={() => onDownload?.(invoice.id)}>
            Download PDF
          </Button>
          <div style={{ display: 'flex', gap: 8 }}>
            {status === 'draft' && onSend && (
              <Button variant="primary" size="sm" icon={<Send size={13} />} onClick={() => onSend(invoice.id)}>
                Send Invoice
              </Button>
            )}
            {(status === 'sent' || status === 'overdue') && onMarkPaid && balance > 0 && (
              <Button
                variant="primary"
                size="sm"
                icon={<CheckCircle2 size={13} />}
                onClick={() => onMarkPaid(invoice.id, balance)}
              >
                Mark Paid ({formatCurrency(balance)})
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
          </div>
        </DialogActions>
      }
    >
      <div className="inv-dlg-grid">
        {/* Left: summary + line items + totals */}
        <div className="inv-dlg-main">
          <SectionCard title="Line Items" icon={<Receipt size={14} />} padding="none">
            {invoice.line_items && invoice.line_items.length > 0 ? (
              <table className="inv-dlg-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th style={{ width: 60, textAlign: 'right' }}>Qty</th>
                    <th style={{ width: 100, textAlign: 'right' }}>Rate</th>
                    <th style={{ width: 100, textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.line_items.map((li, idx) => (
                    <tr key={li.id || idx}>
                      <td>{li.description}</td>
                      <td style={{ textAlign: 'right' }}>{li.quantity}</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(li.unit_price)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        {formatCurrency(li.quantity * li.unit_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="inv-dlg-empty">No line items recorded. Edit this invoice in the full editor to add items.</p>
            )}
          </SectionCard>

          <SectionCard title="Totals" padding="md">
            <dl className="inv-dlg-totals">
              <div><dt>Subtotal</dt><dd>{formatCurrency(totals.subtotal)}</dd></div>
              <div><dt>Tax</dt><dd>{formatCurrency(totals.tax)}</dd></div>
              <div className="inv-dlg-total"><dt>Total</dt><dd>{formatCurrency(totals.total)}</dd></div>
              {amountPaid > 0 && (
                <>
                  <div><dt>Paid</dt><dd style={{ color: 'var(--success)' }}>− {formatCurrency(amountPaid)}</dd></div>
                  <div className="inv-dlg-balance"><dt>Balance</dt><dd>{formatCurrency(balance)}</dd></div>
                </>
              )}
            </dl>
          </SectionCard>

          {invoice.notes && (
            <SectionCard title="Notes">
              <p className="inv-dlg-notes">{invoice.notes}</p>
            </SectionCard>
          )}
        </div>

        {/* Right: timeline + payments */}
        <div className="inv-dlg-side">
          <SectionCard title="Timeline" icon={<Clock size={14} />}>
            <ol className="inv-dlg-timeline">
              {timeline.map((step) => {
                const Icon = step.icon;
                return (
                  <li key={step.label} className={step.done ? 'inv-tl-done' : 'inv-tl-pending'}>
                    <span className="inv-tl-marker"><Icon size={11} /></span>
                    <div>
                      <span className="inv-tl-label">{step.label}</span>
                      {step.at && <span className="inv-tl-at">{timeAgo(step.at)}</span>}
                    </div>
                  </li>
                );
              })}
            </ol>
          </SectionCard>

          <SectionCard title={`Payments (${payments.length})`} icon={<ArrowUpRight size={14} />} padding="sm">
            {payments.length === 0 ? (
              <p className="inv-dlg-empty">No payments recorded yet.</p>
            ) : (
              <ul className="inv-dlg-payments">
                {payments.map((p) => (
                  <li key={p.id} className="inv-pay-row">
                    <span className="inv-pay-amount">{formatCurrency(p.amount)}</span>
                    <span className="inv-pay-method">{p.method || 'manual'}</span>
                    <span className="inv-pay-ref">{p.reference || '—'}</span>
                    <span className="inv-pay-time">{timeAgo(p.recorded_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Dates" icon={<Calendar size={14} />} padding="md">
            <dl className="inv-dlg-dates">
              <div><dt>Issued</dt><dd>{invoice.created_at ? new Date(invoice.created_at).toLocaleDateString() : '—'}</dd></div>
              <div><dt>Due</dt><dd>{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '—'}</dd></div>
            </dl>
          </SectionCard>
        </div>
      </div>

      <style>{`
        .inv-dlg-title { display: inline-flex; align-items: center; gap: 10px; }
        .inv-dlg-copy { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: var(--radius-sm); color: var(--text-muted); transition: all var(--transition-fast); }
        .inv-dlg-copy:hover { background: var(--bg-card); color: var(--cyan); }
        .inv-dlg-grid { display: grid; grid-template-columns: 1fr 280px; gap: 16px; }
        @media (max-width: 900px) { .inv-dlg-grid { grid-template-columns: 1fr; } }
        .inv-dlg-main, .inv-dlg-side { display: flex; flex-direction: column; gap: 12px; }
        .inv-dlg-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .inv-dlg-table thead { background: rgba(0, 0, 0, 0.15); }
        .inv-dlg-table th { padding: 8px 12px; text-align: left; font-weight: 600; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); border-bottom: 1px solid var(--border); }
        .inv-dlg-table td { padding: 10px 12px; border-bottom: 1px solid var(--border); color: var(--text-secondary); }
        .inv-dlg-table tbody tr:last-child td { border-bottom: none; }
        .inv-dlg-empty { font-size: 12px; color: var(--text-muted); padding: 12px; }
        .inv-dlg-totals { display: flex; flex-direction: column; gap: 6px; font-size: 13px; }
        .inv-dlg-totals > div { display: flex; justify-content: space-between; }
        .inv-dlg-totals dt { color: var(--text-muted); }
        .inv-dlg-totals dd { color: var(--text-secondary); font-variant-numeric: tabular-nums; }
        .inv-dlg-total { border-top: 1px solid var(--border); padding-top: 6px; margin-top: 4px; }
        .inv-dlg-total dt, .inv-dlg-total dd { color: var(--text-primary); font-weight: 600; font-size: 15px; }
        .inv-dlg-total dd { color: var(--cyan); }
        .inv-dlg-balance { border-top: 1px dashed var(--border); padding-top: 6px; }
        .inv-dlg-balance dd { color: var(--warning); font-weight: 600; }
        .inv-dlg-notes { font-size: 12px; color: var(--text-secondary); white-space: pre-wrap; line-height: 1.5; }

        .inv-dlg-timeline { list-style: none; padding: 0 0 0 4px; position: relative; display: flex; flex-direction: column; gap: 10px; }
        .inv-dlg-timeline::before { content: ""; position: absolute; left: 10px; top: 10px; bottom: 10px; width: 1px; background: var(--border); }
        .inv-dlg-timeline li { display: flex; align-items: flex-start; gap: 10px; position: relative; }
        .inv-tl-marker { width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--bg-card); border: 1px solid var(--border); color: var(--text-muted); z-index: 1; flex-shrink: 0; }
        .inv-tl-done .inv-tl-marker { background: var(--success); color: white; border-color: var(--success); }
        .inv-tl-pending .inv-tl-marker { opacity: 0.5; }
        .inv-tl-label { display: block; font-size: 12px; font-weight: 500; color: var(--text-primary); }
        .inv-tl-pending .inv-tl-label { color: var(--text-muted); }
        .inv-tl-at { display: block; font-size: 10px; color: var(--text-muted); font-family: var(--font-mono); }

        .inv-dlg-payments { list-style: none; display: flex; flex-direction: column; gap: 4px; }
        .inv-pay-row { display: grid; grid-template-columns: 1fr auto; gap: 6px; padding: 6px 8px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 11px; }
        .inv-pay-amount { color: var(--success); font-weight: 600; font-family: var(--font-mono); grid-row: 1; grid-column: 1; }
        .inv-pay-method { grid-row: 1; grid-column: 2; color: var(--text-muted); }
        .inv-pay-ref { grid-row: 2; grid-column: 1; color: var(--text-muted); font-size: 10px; }
        .inv-pay-time { grid-row: 2; grid-column: 2; color: var(--text-muted); font-family: var(--font-mono); font-size: 9px; }

        .inv-dlg-dates { display: flex; flex-direction: column; gap: 4px; font-size: 12px; }
        .inv-dlg-dates > div { display: flex; justify-content: space-between; }
        .inv-dlg-dates dt { color: var(--text-muted); }
        .inv-dlg-dates dd { color: var(--text-primary); font-family: var(--font-mono); }
      `}</style>
    </Dialog>
  );
}
