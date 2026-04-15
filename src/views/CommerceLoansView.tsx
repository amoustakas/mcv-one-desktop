import { useState, useEffect, lazy, Suspense } from 'react';
import { lazyRetry } from '../lib/lazy-retry';
import { motion } from 'framer-motion';
import { Banknote, Plus, TrendingUp, DollarSign, Loader2, CheckCircle2 } from 'lucide-react';
import { PageShell, PageHeader, KpiCard, GridLayout, GlassCard, Button, Badge, Tabs, EmptyState } from '../components/ui';
import { useCommerceStore } from '../stores/commerce';
import { useNavigation } from '../stores/navigation';
import { staggerContainer, fadeInUp } from '../lib/animations';
import { useToast } from '../components/Toasts';
const LoanDetailDialog = lazyRetry(() => import('../components/commerce/LoanDetailDialog'));

export default function CommerceLoansView() {
  const { addToast } = useToast();
  const { activeVenture, mode } = useNavigation();
  const ventureId = (mode === 'venture' ? activeVenture : null) || 'mcv';

  const { loans, loansLoading, fetchLoans, disburseLoan, recordRepayment } = useCommerceStore();
  const [tab, setTab] = useState('all');
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);

  const selectedLoan = selectedLoanId
    ? (loans.find((l) => String((l as unknown as Record<string, unknown>).id) === selectedLoanId) as unknown as Parameters<typeof LoanDetailDialog>[0]['loan']) || null
    : null;

  useEffect(() => {
    fetchLoans(ventureId).catch(() => {});
  }, [ventureId, fetchLoans]);

  const filtered = tab === 'all' ? loans
    : loans.filter((l) => String((l as unknown as Record<string, unknown>).status || '').toLowerCase() === tab);

  const totalOutstanding = loans.reduce((sum, l) => {
    const loan = l as unknown as Record<string, unknown>;
    return loan.status !== 'repaid' ? sum + Number(loan.balance || loan.principal || 0) : sum;
  }, 0);
  const totalDisbursed = loans.reduce((sum, l) => sum + Number((l as unknown as Record<string, unknown>).disbursed_amount || 0), 0);
  const activeCount = loans.filter((l) => (l as unknown as Record<string, unknown>).status === 'active' || (l as unknown as Record<string, unknown>).status === 'disbursed').length;

  const TABS = [
    { id: 'all', label: 'All', count: loans.length },
    { id: 'draft', label: 'Draft' },
    { id: 'approved', label: 'Approved' },
    { id: 'disbursed', label: 'Disbursed' },
    { id: 'active', label: 'Active' },
    { id: 'repaid', label: 'Repaid' },
  ];

  const handleDisburse = async (id: string) => {
    try {
      await disburseLoan(ventureId, id);
      addToast({ type: 'success', message: 'Loan disbursed' });
    } catch (err) {
      addToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed' });
    }
  };

  // Row-level repayment quick action — routes the user into the detail
  // dialog (which has a proper amount input + payment-history context)
  // instead of a single-field native prompt. Detail dialog's RecordPayment
  // form calls recordRepayment directly so the data path stays the same.
  const handleRepayment = (id: string, _amount: number) => {
    setSelectedLoanId(id);
    void _amount;
  };

  return (
    <PageShell>
      <PageHeader title="Loans" icon={<Banknote size={20} />} loading={loansLoading} onRefresh={() => fetchLoans(ventureId)}>
        <Button variant="primary" size="sm" icon={<Plus size={13} />}>New Loan</Button>
      </PageHeader>

      <motion.div variants={staggerContainer} initial="hidden" animate="show" style={{ marginTop: 12 }}>
        <GridLayout cols={4} gap="md">
          <motion.div variants={fadeInUp}><KpiCard icon={<DollarSign size={16} />} title="Outstanding" value={`$${totalOutstanding.toLocaleString()}`} /></motion.div>
          <motion.div variants={fadeInUp}><KpiCard icon={<TrendingUp size={16} />} title="Total Disbursed" value={`$${totalDisbursed.toLocaleString()}`} /></motion.div>
          <motion.div variants={fadeInUp}><KpiCard icon={<Banknote size={16} />} title="Active Loans" value={String(activeCount)} /></motion.div>
          <motion.div variants={fadeInUp}><KpiCard icon={<CheckCircle2 size={16} />} title="Total Loans" value={String(loans.length)} /></motion.div>
        </GridLayout>
      </motion.div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      <div style={{ padding: '16px 0' }}>
        <GlassCard>
          {loansLoading ? (
            <div style={{ display: 'flex', gap: 8, color: 'var(--text-muted)', alignItems: 'center' }}>
              <Loader2 size={14} className="mcv-spin" /> Loading loans...
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={<Banknote size={32} />} title="No loans" description="Originate loans to customers or partners with automated repayment tracking." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 100px 100px 100px 100px 80px', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, gap: 8 }}>
                <span>Borrower</span><span>Loan ID</span><span style={{ textAlign: 'right' }}>Principal</span><span style={{ textAlign: 'right' }}>Balance</span><span style={{ textAlign: 'right' }}>APR</span><span>Status</span><span style={{ textAlign: 'right' }}>Actions</span>
              </div>
              {filtered.map((l) => {
                const loan = l as unknown as Record<string, unknown>;
                const status = String(loan.status || 'draft');
                return (
                  <div
                    key={String(loan.id)}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedLoanId(String(loan.id))}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedLoanId(String(loan.id)); } }}
                    style={{ display: 'grid', gridTemplateColumns: '1fr 140px 100px 100px 100px 100px 80px', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 13, gap: 8, alignItems: 'center', cursor: 'pointer', transition: 'background-color 150ms ease' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--bg-hover)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent'; }}
                  >
                    <span style={{ color: 'var(--text-primary)' }}>{String(loan.borrower_name || loan.customer_name || loan.customer_id || '—')}</span>
                    <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{String(loan.id).slice(0, 14)}</span>
                    <span style={{ color: 'var(--text-secondary)', textAlign: 'right' }}>${Number(loan.principal || 0).toLocaleString()}</span>
                    <span style={{ color: 'var(--cyan)', textAlign: 'right', fontWeight: 600 }}>${Number(loan.balance || loan.principal || 0).toLocaleString()}</span>
                    <span style={{ color: 'var(--text-muted)', textAlign: 'right' }}>{Number(loan.apr || loan.interest_rate || 0).toFixed(2)}%</span>
                    <Badge color={status === 'repaid' ? '#10B981' : status === 'disbursed' || status === 'active' ? 'var(--cyan)' : status === 'defaulted' ? '#ef4444' : '#6B7280'}>{status}</Badge>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
                      {status === 'approved' && <button title="Disburse" style={{ background: 'transparent', border: 'none', color: 'var(--cyan)', cursor: 'pointer' }} onClick={() => handleDisburse(String(loan.id))}><DollarSign size={12} /></button>}
                      {(status === 'disbursed' || status === 'active') && <button title="Record repayment" style={{ background: 'transparent', border: 'none', color: '#10B981', cursor: 'pointer' }} onClick={() => handleRepayment(String(loan.id), Number(loan.balance || 0))}><CheckCircle2 size={12} /></button>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </div>

      <Suspense fallback={null}>
        {selectedLoanId && (
          <LoanDetailDialog
            open={!!selectedLoanId}
            onClose={() => setSelectedLoanId(null)}
            loan={selectedLoan}
            onDisburse={async (id) => { await handleDisburse(id); setSelectedLoanId(null); }}
            onRepay={async (id, amount) => {
              try {
                await recordRepayment(ventureId, id, amount);
                addToast({ type: 'success', message: `Repayment of $${amount} recorded` });
              } catch (err) {
                addToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed' });
              }
            }}
          />
        )}
      </Suspense>
    </PageShell>
  );
}
