import { motion } from 'framer-motion';
import { CreditCard, Plus, Wallet, TrendingUp, Gift, Loader2 } from 'lucide-react';
import { PageShell, PageHeader, KpiCard, GridLayout, GlassCard, Button, Badge, Tabs, EmptyState } from '../components/ui';
import { useNavigation } from '../stores/navigation';
import { staggerContainer, fadeInUp } from '../lib/animations';
import { useState, useEffect } from 'react';
import { useToast } from '../components/Toasts';

interface CreditLedger {
  id: string;
  customer_id: string;
  customer_name?: string;
  balance: number;
  currency: string;
  last_activity?: string;
  status: string;
}

interface Transaction {
  id: string;
  ledger_id: string;
  type: 'grant' | 'debit' | 'credit' | 'expire';
  amount: number;
  note?: string;
  created_at: string;
}

async function fetchCredits(ventureId: string): Promise<CreditLedger[]> {
  try {
    const res = await fetch(`/api/commerce?action=list-credits&ventureId=${ventureId}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.ledgers || data.credits || [];
  } catch { return []; }
}

async function fetchCreditTransactions(ventureId: string, limit = 25): Promise<Transaction[]> {
  try {
    const res = await fetch(`/api/commerce?action=list-credit-transactions&ventureId=${ventureId}&limit=${limit}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.transactions || [];
  } catch { return []; }
}

async function grantCredit(ventureId: string, customerId: string, amount: number, note: string): Promise<boolean> {
  try {
    const res = await fetch('/api/commerce', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'grant-credit', ventureId, customerId, amount, note }),
    });
    return res.ok;
  } catch { return false; }
}

export default function CommerceCreditsView() {
  const { addToast } = useToast();
  const { activeVenture, mode } = useNavigation();
  const ventureId = (mode === 'venture' ? activeVenture : null) || 'mcv';

  const [tab, setTab] = useState('ledgers');
  const [loading, setLoading] = useState(true);
  const [ledgers, setLedgers] = useState<CreditLedger[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([fetchCredits(ventureId), fetchCreditTransactions(ventureId)])
      .then(([l, t]) => {
        if (mounted) { setLedgers(l); setTransactions(t); setLoading(false); }
      });
    return () => { mounted = false; };
  }, [ventureId]);

  const handleGrant = async () => {
    const customerId = prompt('Customer ID:');
    if (!customerId) return;
    const amountStr = prompt('Credit amount ($):', '100');
    if (!amountStr) return;
    const note = prompt('Note (optional):', 'Promotional credit') || '';
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) return;

    const success = await grantCredit(ventureId, customerId, amount, note);
    if (success) {
      addToast({ type: 'success', message: `$${amount} credit granted to ${customerId}` });
      fetchCredits(ventureId).then(setLedgers);
    } else {
      addToast({ type: 'error', message: 'Failed to grant credit' });
    }
  };

  const totalBalance = ledgers.reduce((sum, l) => sum + (l.balance || 0), 0);
  const activeLedgers = ledgers.filter(l => l.status === 'active').length;
  const grantsCount = transactions.filter(t => t.type === 'grant').length;

  const TABS = [
    { id: 'ledgers', label: 'Ledgers', count: ledgers.length },
    { id: 'transactions', label: 'Transactions', count: transactions.length },
  ];

  return (
    <PageShell>
      <PageHeader title="Credits & Wallets" icon={<CreditCard size={20} />} loading={loading}>
        <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={handleGrant}>Grant Credit</Button>
      </PageHeader>

      <motion.div variants={staggerContainer} initial="hidden" animate="show" style={{ marginTop: 12 }}>
        <GridLayout cols={4} gap="md">
          <motion.div variants={fadeInUp}><KpiCard icon={<Wallet size={16} />} title="Total Balance" value={`$${totalBalance.toLocaleString()}`} /></motion.div>
          <motion.div variants={fadeInUp}><KpiCard icon={<CreditCard size={16} />} title="Active Ledgers" value={String(activeLedgers)} /></motion.div>
          <motion.div variants={fadeInUp}><KpiCard icon={<Gift size={16} />} title="Grants (30d)" value={String(grantsCount)} /></motion.div>
          <motion.div variants={fadeInUp}><KpiCard icon={<TrendingUp size={16} />} title="Transactions" value={String(transactions.length)} /></motion.div>
        </GridLayout>
      </motion.div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      <div style={{ padding: '16px 0' }}>
        <GlassCard>
          {loading ? (
            <div style={{ display: 'flex', gap: 8, color: 'var(--text-muted)', alignItems: 'center' }}>
              <Loader2 size={14} className="mcv-spin" /> Loading...
            </div>
          ) : tab === 'ledgers' ? (
            ledgers.length === 0 ? (
              <EmptyState icon={<Wallet size={32} />} title="No credit ledgers" description="Grant store credits to customers for refunds, promotions, or loyalty rewards." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 140px 80px', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, gap: 8 }}>
                  <span>Customer</span><span>Ledger</span><span style={{ textAlign: 'right' }}>Balance</span><span>Last Activity</span><span>Status</span>
                </div>
                {ledgers.map((l) => (
                  <div key={l.id} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 140px 80px', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 13, gap: 8, alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-primary)' }}>{l.customer_name || l.customer_id}</span>
                    <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{l.id.slice(0, 10)}</span>
                    <span style={{ color: 'var(--cyan)', textAlign: 'right', fontWeight: 600 }}>${l.balance.toLocaleString()} {l.currency}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{l.last_activity ? new Date(l.last_activity).toLocaleDateString() : '—'}</span>
                    <Badge color={l.status === 'active' ? '#10B981' : '#6B7280'}>{l.status}</Badge>
                  </div>
                ))}
              </div>
            )
          ) : (
            transactions.length === 0 ? (
              <EmptyState icon={<TrendingUp size={32} />} title="No transactions" description="Credit grants, debits, and expirations will appear here." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {transactions.map((t) => (
                  <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '80px 120px 100px 1fr 120px', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13, gap: 8, alignItems: 'center' }}>
                    <Badge color={t.type === 'grant' ? '#10B981' : t.type === 'debit' ? '#ef4444' : t.type === 'expire' ? '#F59E0B' : 'var(--cyan)'}>{t.type}</Badge>
                    <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{t.ledger_id.slice(0, 12)}</span>
                    <span style={{ color: t.type === 'grant' ? '#10B981' : t.type === 'debit' ? '#ef4444' : 'var(--cyan)', textAlign: 'right', fontWeight: 600 }}>${t.amount.toLocaleString()}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{t.note || '—'}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{new Date(t.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )
          )}
        </GlassCard>
      </div>
    </PageShell>
  );
}
