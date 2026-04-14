import { useState, useEffect, lazy, Suspense } from 'react';
import { lazyRetry } from '../lib/lazy-retry';
import { motion } from 'framer-motion';
import { Receipt, Plus, Send, DollarSign, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
import { PageShell, PageHeader, KpiCard, GridLayout, GlassCard, Button, Badge, Tabs, EmptyState } from '../components/ui';
import { useCommerceStore } from '../stores/commerce';
import { useNavigation } from '../stores/navigation';
import { staggerContainer, fadeInUp } from '../lib/animations';
import { useToast } from '../components/Toasts';
const InvoiceDetailDialog = lazyRetry(() => import('../components/commerce/InvoiceDetailDialog'));

export default function CommerceInvoicesView() {
  const { addToast } = useToast();
  const { activeVenture, mode } = useNavigation();
  const ventureId = (mode === 'venture' ? activeVenture : null) || 'mcv';

  const { invoices, invoicesLoading, fetchInvoices, sendInvoice, recordInvoicePayment } = useCommerceStore();
  const [tab, setTab] = useState('all');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const selectedInvoice = selectedInvoiceId
    ? (invoices.find((i) => String((i as unknown as Record<string, unknown>).id) === selectedInvoiceId) as unknown as Parameters<typeof InvoiceDetailDialog>[0]['invoice']) || null
    : null;

  useEffect(() => {
    fetchInvoices(ventureId).catch(() => {});
  }, [ventureId, fetchInvoices]);

  const filtered = tab === 'all' ? invoices
    : invoices.filter((i) => {
        const inv = i as unknown as Record<string, unknown>;
        return String(inv.status || '').toLowerCase() === tab;
      });

  const totalOutstanding = invoices.reduce((sum, i) => {
    const inv = i as unknown as Record<string, unknown>;
    return inv.status !== 'paid' ? sum + Number(inv.amount || inv.total || 0) : sum;
  }, 0);
  const totalPaid = invoices.reduce((sum, i) => {
    const inv = i as unknown as Record<string, unknown>;
    return inv.status === 'paid' ? sum + Number(inv.amount || inv.total || 0) : sum;
  }, 0);
  const overdueCount = invoices.filter((i) => (i as unknown as Record<string, unknown>).status === 'overdue').length;

  const TABS = [
    { id: 'all', label: 'All', count: invoices.length },
    { id: 'draft', label: 'Drafts' },
    { id: 'sent', label: 'Sent' },
    { id: 'paid', label: 'Paid' },
    { id: 'overdue', label: 'Overdue', count: overdueCount },
  ];

  const handleSend = async (id: string) => {
    try {
      await sendInvoice(ventureId, id);
      addToast({ type: 'success', message: 'Invoice sent' });
    } catch (err) {
      addToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed' });
    }
  };

  const handleMarkPaid = async (id: string, amount: number) => {
    try {
      await recordInvoicePayment(ventureId, id, amount);
      addToast({ type: 'success', message: 'Payment recorded' });
    } catch (err) {
      addToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed' });
    }
  };

  return (
    <PageShell>
      <PageHeader title="Invoices" icon={<Receipt size={20} />} loading={invoicesLoading} onRefresh={() => fetchInvoices(ventureId)}>
        <Button variant="primary" size="sm" icon={<Plus size={13} />}>New Invoice</Button>
      </PageHeader>

      <motion.div variants={staggerContainer} initial="hidden" animate="show" style={{ marginTop: 12 }}>
        <GridLayout cols={4} gap="md">
          <motion.div variants={fadeInUp}><KpiCard icon={<DollarSign size={16} />} title="Outstanding" value={`$${totalOutstanding.toLocaleString()}`} /></motion.div>
          <motion.div variants={fadeInUp}><KpiCard icon={<CheckCircle2 size={16} />} title="Collected" value={`$${totalPaid.toLocaleString()}`} /></motion.div>
          <motion.div variants={fadeInUp}><KpiCard icon={<AlertTriangle size={16} />} title="Overdue" value={String(overdueCount)} /></motion.div>
          <motion.div variants={fadeInUp}><KpiCard icon={<Receipt size={16} />} title="Total Invoices" value={String(invoices.length)} /></motion.div>
        </GridLayout>
      </motion.div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      <div style={{ padding: '16px 0' }}>
        <GlassCard>
          {invoicesLoading ? (
            <div style={{ display: 'flex', gap: 8, color: 'var(--text-muted)', alignItems: 'center' }}>
              <Loader2 size={14} className="mcv-spin" /> Loading invoices...
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={<Receipt size={32} />} title="No invoices" description="Create your first invoice to start tracking AR." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 100px 120px 100px 120px', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, gap: 8 }}>
                <span>Invoice #</span><span>Customer</span><span style={{ textAlign: 'right' }}>Amount</span><span>Due Date</span><span>Status</span><span style={{ textAlign: 'right' }}>Actions</span>
              </div>
              {filtered.map((i) => {
                const inv = i as unknown as Record<string, unknown>;
                const status = String(inv.status || 'draft');
                return (
                  <div
                    key={String(inv.id)}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedInvoiceId(String(inv.id))}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedInvoiceId(String(inv.id)); } }}
                    style={{ display: 'grid', gridTemplateColumns: '120px 1fr 100px 120px 100px 120px', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 13, gap: 8, alignItems: 'center', cursor: 'pointer', transition: 'background-color 150ms ease' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--bg-hover)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent'; }}
                  >
                    <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{String(inv.invoice_number || inv.number || inv.id).slice(0, 12)}</span>
                    <span style={{ color: 'var(--text-primary)' }}>{String(inv.customer_name || inv.customer_id || '—')}</span>
                    <span style={{ color: 'var(--cyan)', textAlign: 'right', fontWeight: 600 }}>${Number(inv.amount || inv.total || 0).toLocaleString()}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{inv.due_date ? new Date(String(inv.due_date)).toLocaleDateString() : '—'}</span>
                    <Badge color={status === 'paid' ? '#10B981' : status === 'overdue' ? '#ef4444' : status === 'sent' ? '#F59E0B' : '#6B7280'}>{status}</Badge>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
                      {status === 'draft' && <button title="Send" style={{ background: 'transparent', border: 'none', color: 'var(--cyan)', cursor: 'pointer' }} onClick={() => handleSend(String(inv.id))}><Send size={12} /></button>}
                      {status === 'sent' && <button title="Mark paid" style={{ background: 'transparent', border: 'none', color: '#10B981', cursor: 'pointer' }} onClick={() => handleMarkPaid(String(inv.id), Number(inv.amount || 0))}><CheckCircle2 size={12} /></button>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </div>

      <Suspense fallback={null}>
        {selectedInvoiceId && (
          <InvoiceDetailDialog
            open={!!selectedInvoiceId}
            onClose={() => setSelectedInvoiceId(null)}
            invoice={selectedInvoice}
            onSend={async (id) => { await handleSend(id); setSelectedInvoiceId(null); }}
            onMarkPaid={async (id, amount) => { await handleMarkPaid(id, amount); setSelectedInvoiceId(null); }}
            onDownload={(id) => addToast({ type: 'info', message: `PDF export queued for ${id.slice(0, 8)} (server-side rendering pending)` })}
          />
        )}
      </Suspense>
    </PageShell>
  );
}
