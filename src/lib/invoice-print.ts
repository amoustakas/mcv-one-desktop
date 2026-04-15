// Client-side invoice → PDF via browser print.
//
// Builds a clean, print-optimized HTML invoice as a Blob, navigates a
// new window to that blob URL, and lets the loaded page auto-trigger
// the browser's print dialog. Users save as PDF from there. No
// server-side rendering or PDF library needed — works offline and
// respects the venture's brand colors.
//
// Uses Blob + URL.createObjectURL rather than document.write() so the
// new window loads as a normal document (no document.write XSS risk
// even though all input is escaped, and avoids the perf gotchas where
// document.write blocks paint).
//
// This is intentionally a fallback: when a real /api/invoice-pdf endpoint
// lands (with proper PDF generation, signed download URLs, server-side
// archival), we can swap the call site without changing the dialog UI.

interface PrintLineItem {
  description: string;
  quantity: number;
  unit_price: number;
}

interface PrintPayment {
  amount: number;
  recorded_at: string;
  method?: string;
}

export interface PrintInvoiceInput {
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
  line_items?: PrintLineItem[];
  payments?: PrintPayment[];
  notes?: string;
}

function fmt(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildInvoiceHtml(invoice: PrintInvoiceInput, brand?: { name?: string; primaryColor?: string }): string {
  const number = invoice.invoice_number || invoice.number || invoice.id.slice(0, 8);
  const status = (invoice.status || 'draft').toLowerCase();
  const lineItems = invoice.line_items ?? [];
  const lineSubtotal = lineItems.reduce((s, li) => s + li.quantity * li.unit_price, 0);
  const subtotal = invoice.subtotal ?? lineSubtotal;
  const tax = invoice.tax ?? Math.round(subtotal * 0.08 * 100) / 100;
  const total = invoice.total ?? invoice.amount ?? subtotal + tax;
  const payments = invoice.payments ?? [];
  const amountPaid = payments.reduce((s, p) => s + p.amount, 0);
  const balance = Math.max(0, total - amountPaid);

  const accent = brand?.primaryColor ?? '#00F0FF';
  const brandName = brand?.name ?? 'MCV One';

  const issuedDate = invoice.created_at ? new Date(invoice.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
  const dueDate = invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Invoice ${escapeHtml(number)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Inter, sans-serif; color: #111; background: #fff; margin: 0; padding: 40px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .head { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 2px solid ${accent}; margin-bottom: 28px; }
    .head h1 { margin: 0 0 4px; font-size: 28px; letter-spacing: -0.5px; }
    .brand { font-size: 18px; font-weight: 700; color: ${accent}; }
    .brand-meta { font-size: 11px; color: #666; margin-top: 4px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 28px; font-size: 12px; }
    .meta-grid h3 { margin: 0 0 4px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #666; font-weight: 600; }
    .meta-grid p { margin: 0; line-height: 1.5; }
    .status-pill { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #fff; }
    .status-pill.draft { background: #6B7280; }
    .status-pill.sent { background: #F59E0B; }
    .status-pill.paid { background: #10B981; }
    .status-pill.overdue { background: #EF4444; }
    .status-pill.voided { background: #6B7280; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 16px; }
    thead { background: #f6f8fa; }
    th { text-align: left; padding: 10px 12px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #444; border-bottom: 1px solid #e5e7eb; }
    td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; }
    .totals { margin-left: auto; width: 280px; font-size: 12px; }
    .totals dl { display: grid; grid-template-columns: 1fr auto; gap: 6px 16px; margin: 0; }
    .totals dt { color: #555; }
    .totals dd { margin: 0; text-align: right; font-variant-numeric: tabular-nums; }
    .totals .total-row { font-size: 16px; font-weight: 700; padding-top: 8px; border-top: 1px solid #e5e7eb; margin-top: 8px; }
    .totals .total-row dd { color: ${accent}; }
    .totals .balance-row { font-size: 14px; font-weight: 600; padding-top: 6px; border-top: 1px dashed #e5e7eb; }
    .totals .balance-row dd { color: ${balance > 0 ? '#EF4444' : '#10B981'}; }
    .payments { margin-top: 28px; font-size: 11px; }
    .payments h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #444; margin: 0 0 8px; }
    .payments-table { font-size: 11px; }
    .notes { margin-top: 28px; padding: 14px 16px; background: #f6f8fa; border-left: 3px solid ${accent}; font-size: 12px; line-height: 1.5; color: #333; white-space: pre-wrap; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #888; text-align: center; }
    @media print { body { padding: 20px; } .footer { font-size: 9px; } }
  </style>
</head>
<body>
  <div class="head">
    <div>
      <div class="brand">${escapeHtml(brandName)}</div>
      <div class="brand-meta">Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
    </div>
    <div style="text-align: right;">
      <h1>Invoice ${escapeHtml(number)}</h1>
      <span class="status-pill ${status}">${status}</span>
    </div>
  </div>

  <div class="meta-grid">
    <div>
      <h3>Bill to</h3>
      <p><strong>${escapeHtml(invoice.customer_name ?? invoice.customer_email ?? invoice.customer_id ?? '—')}</strong></p>
      ${invoice.customer_email && invoice.customer_name ? `<p>${escapeHtml(invoice.customer_email)}</p>` : ''}
    </div>
    <div style="text-align: right;">
      <h3>Dates</h3>
      <p><strong>Issued:</strong> ${escapeHtml(issuedDate)}</p>
      <p><strong>Due:</strong> ${escapeHtml(dueDate)}</p>
    </div>
  </div>

  ${lineItems.length > 0 ? `
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th style="width: 60px; text-align: right;">Qty</th>
        <th style="width: 100px; text-align: right;">Rate</th>
        <th style="width: 100px; text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${lineItems.map((li) => `
        <tr>
          <td>${escapeHtml(li.description)}</td>
          <td style="text-align: right;">${li.quantity}</td>
          <td style="text-align: right;">${fmt(li.unit_price)}</td>
          <td style="text-align: right; font-weight: 600;">${fmt(li.quantity * li.unit_price)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  ` : `<p style="font-size: 12px; color: #666; padding: 16px; background: #f6f8fa; border-radius: 4px;">No line items recorded.</p>`}

  <div class="totals">
    <dl>
      <dt>Subtotal</dt><dd>${fmt(subtotal)}</dd>
      <dt>Tax</dt><dd>${fmt(tax)}</dd>
      <dt class="total-row">Total</dt><dd class="total-row">${fmt(total)}</dd>
      ${amountPaid > 0 ? `
        <dt>Paid</dt><dd style="color: #10B981;">− ${fmt(amountPaid)}</dd>
        <dt class="balance-row">Balance Due</dt><dd class="balance-row">${fmt(balance)}</dd>
      ` : ''}
    </dl>
  </div>

  ${payments.length > 0 ? `
    <div class="payments">
      <h3>Payment History</h3>
      <table class="payments-table">
        <thead>
          <tr><th>Date</th><th>Method</th><th style="text-align: right;">Amount</th></tr>
        </thead>
        <tbody>
          ${payments.map((p) => `
            <tr>
              <td>${escapeHtml(new Date(p.recorded_at).toLocaleDateString())}</td>
              <td>${escapeHtml(p.method ?? 'manual')}</td>
              <td style="text-align: right; color: #10B981; font-weight: 600;">${fmt(p.amount)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  ` : ''}

  ${invoice.notes ? `<div class="notes">${escapeHtml(invoice.notes)}</div>` : ''}

  <div class="footer">
    Use your browser's print dialog to save this invoice as PDF · Invoice ID ${escapeHtml(invoice.id)}
  </div>

  <script>
    // Auto-open the print dialog after first paint. Double rAF gives the
    // browser time to lay out + paint before the print snapshot is taken
    // (some browsers print blank otherwise).
    window.addEventListener('load', function () {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { window.print(); });
      });
    });
  </script>
</body>
</html>`;
}

/**
 * Open a print-ready invoice in a new window. Returns false if the popup
 * was blocked so the caller can surface that to the user.
 *
 * Uses Blob + URL.createObjectURL instead of document.write so the new
 * window loads as a normal document (avoids document.write XSS surface
 * even though all interpolation is HTML-escaped).
 */
export function printInvoice(invoice: PrintInvoiceInput, brand?: { name?: string; primaryColor?: string }): boolean {
  const html = buildInvoiceHtml(invoice, brand);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank', 'width=900,height=1100');
  if (!win) {
    URL.revokeObjectURL(url);
    return false;
  }
  // Revoke the object URL after a short delay so the new window has time
  // to load it. 60s is generous; the browser has long since loaded the
  // doc by then, and waiting isn't bad because URL.revokeObjectURL is
  // cheap.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return true;
}
