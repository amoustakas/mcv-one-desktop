import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Users, DollarSign, Award, Plus, Loader2, RefreshCw } from 'lucide-react';
import { PageShell, PageHeader, KpiCard, GridLayout, GlassCard, Button, Badge, Tabs, EmptyState } from '../components/ui';
import { lazy, Suspense } from 'react';
import { useCreatorStore } from '../stores/creator';
import { useNavigation } from '../stores/navigation';
import { staggerContainer, fadeInUp } from '../lib/animations';

const RoyaltyAgreementDetailDialog = lazy(() => import('../components/creator/RoyaltyAgreementDetailDialog'));
const EscrowDetailDialog = lazy(() => import('../components/creator/EscrowDetailDialog'));
type RoyaltyLikeProp = Parameters<typeof import('../components/creator/RoyaltyAgreementDetailDialog').default>[0]['agreement'];
type EscrowLikeProp = Parameters<typeof import('../components/creator/EscrowDetailDialog').default>[0]['escrow'];

export default function CreatorHubView() {
  const { activeVenture, mode } = useNavigation();
  const ventureId = (mode === 'venture' ? activeVenture : null) || 'mcv';

  const {
    royaltyAgreements, royaltyAgreementsLoading,
    escrowAgreements, escrowAgreementsLoading,
    transactions, transactionsLoading,
    fetchRoyaltyAgreements, fetchEscrowAgreements, fetchTransactions,
  } = useCreatorStore();

  const [tab, setTab] = useState('overview');
  const [selectedRoyaltyId, setSelectedRoyaltyId] = useState<string | null>(null);
  const [selectedEscrowId, setSelectedEscrowId] = useState<string | null>(null);

  const selectedRoyalty = selectedRoyaltyId
    ? (royaltyAgreements.find((r) => String((r as unknown as Record<string, unknown>).id) === selectedRoyaltyId) as unknown as RoyaltyLikeProp) || null
    : null;
  const selectedEscrow = selectedEscrowId
    ? (escrowAgreements.find((e) => String((e as unknown as Record<string, unknown>).id) === selectedEscrowId) as unknown as EscrowLikeProp) || null
    : null;

  useEffect(() => {
    fetchRoyaltyAgreements(ventureId);
    fetchEscrowAgreements(ventureId);
    fetchTransactions(ventureId, 25, 0);
  }, [ventureId, fetchRoyaltyAgreements, fetchEscrowAgreements, fetchTransactions]);

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'royalties', label: 'Royalties', count: royaltyAgreements.length },
    { id: 'escrow', label: 'Escrow', count: escrowAgreements.length },
    { id: 'transactions', label: 'Transactions', count: transactions.length },
  ];

  const activeRoyalties = royaltyAgreements.filter(r => (r as unknown as Record<string, unknown>).status === 'active').length;
  const activeEscrows = escrowAgreements.filter(e => (e as unknown as Record<string, unknown>).status === 'active').length;
  const totalPaidOut = transactions.reduce((sum, t) => sum + (Number((t as unknown as Record<string, unknown>).amount) || 0), 0);

  const handleRefresh = () => {
    fetchRoyaltyAgreements(ventureId);
    fetchEscrowAgreements(ventureId);
    fetchTransactions(ventureId, 25, 0);
  };

  return (
    <PageShell>
      <PageHeader
        title="Creator Hub"
        icon={<Sparkles size={20} />}
        loading={royaltyAgreementsLoading || escrowAgreementsLoading}
        onRefresh={handleRefresh}
      >
        <Button variant="primary" size="sm" icon={<Plus size={13} />}>New Agreement</Button>
      </PageHeader>

      {/* KPI Strip */}
      <motion.div variants={staggerContainer} initial="hidden" animate="show" style={{ marginTop: 12 }}>
        <GridLayout cols={4} gap="md">
          <motion.div variants={fadeInUp}>
            <KpiCard icon={<Award size={16} />} title="Active Royalties" value={String(activeRoyalties)} />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <KpiCard icon={<DollarSign size={16} />} title="Active Escrows" value={String(activeEscrows)} />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <KpiCard icon={<TrendingUp size={16} />} title="Transactions" value={transactions.length.toLocaleString()} />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <KpiCard icon={<Users size={16} />} title="Total Paid Out" value={`$${totalPaidOut.toLocaleString()}`} />
          </motion.div>
        </GridLayout>
      </motion.div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      <div style={{ padding: '16px 0' }}>
        {tab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <GlassCard>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-primary)' }}>Recent Royalty Distributions</h3>
              {royaltyAgreements.slice(0, 5).map((r) => {
                const agreement = r as unknown as Record<string, unknown>;
                return (
                  <div key={String(agreement.id)} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-primary)' }}>{String(agreement.product_name || agreement.title || 'Royalty Agreement')}</span>
                    <Badge>{String(agreement.status || 'draft')}</Badge>
                  </div>
                );
              })}
              {royaltyAgreements.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>No royalty agreements yet.</p>
              )}
            </GlassCard>

            <GlassCard>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-primary)' }}>Active Escrow Agreements</h3>
              {escrowAgreements.slice(0, 5).map((e) => {
                const escrow = e as unknown as Record<string, unknown>;
                return (
                  <div key={String(escrow.id)} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <div>
                      <div style={{ color: 'var(--text-primary)' }}>{String(escrow.title || escrow.deal_name || 'Escrow Agreement')}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>${Number(escrow.amount || 0).toLocaleString()}</div>
                    </div>
                    <Badge>{String(escrow.status || 'pending')}</Badge>
                  </div>
                );
              })}
              {escrowAgreements.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>No escrow agreements yet.</p>
              )}
            </GlassCard>
          </div>
        )}

        {tab === 'royalties' && (
          <GlassCard>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-primary)' }}>Royalty Agreements</h3>
            {royaltyAgreementsLoading ? (
              <div style={{ display: 'flex', gap: 8, color: 'var(--text-muted)', alignItems: 'center' }}>
                <Loader2 size={14} className="mcv-spin" /> Loading...
              </div>
            ) : royaltyAgreements.length === 0 ? (
              <EmptyState icon={<Award size={32} />} title="No royalty agreements" description="Create an agreement to track creator payouts, splits, and resale royalties." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {royaltyAgreements.map((r) => {
                  const agreement = r as unknown as Record<string, unknown>;
                  return (
                    <div
                      key={String(agreement.id)}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedRoyaltyId(String(agreement.id))}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedRoyaltyId(String(agreement.id)); } }}
                      style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 100px 80px', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 13, gap: 8, alignItems: 'center', cursor: 'pointer', transition: 'background-color 150ms ease' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--bg-hover)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent'; }}
                    >
                      <span style={{ color: 'var(--text-primary)' }}>{String(agreement.product_name || agreement.title || 'Agreement')}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{String(agreement.creator_name || agreement.creator_id || 'Unknown')}</span>
                      <span style={{ color: 'var(--cyan)', textAlign: 'right' }}>{Number(agreement.rate || agreement.percent || 0)}%</span>
                      <Badge>{String(agreement.status || 'draft')}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        )}

        {tab === 'escrow' && (
          <GlassCard>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-primary)' }}>Escrow Agreements</h3>
            {escrowAgreementsLoading ? (
              <div style={{ display: 'flex', gap: 8, color: 'var(--text-muted)', alignItems: 'center' }}>
                <Loader2 size={14} className="mcv-spin" /> Loading...
              </div>
            ) : escrowAgreements.length === 0 ? (
              <EmptyState icon={<DollarSign size={32} />} title="No escrow agreements" description="Create milestone-based deals with automated payments on completion." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {escrowAgreements.map((e) => {
                  const escrow = e as unknown as Record<string, unknown>;
                  return (
                    <div
                      key={String(escrow.id)}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedEscrowId(String(escrow.id))}
                      onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); setSelectedEscrowId(String(escrow.id)); } }}
                      style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 120px 80px', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 13, gap: 8, alignItems: 'center', cursor: 'pointer', transition: 'background-color 150ms ease' }}
                      onMouseEnter={(ev) => { (ev.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--bg-hover)'; }}
                      onMouseLeave={(ev) => { (ev.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent'; }}
                    >
                      <span style={{ color: 'var(--text-primary)' }}>{String(escrow.title || escrow.deal_name || 'Escrow')}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{String(escrow.counterparty_name || 'TBD')}</span>
                      <span style={{ color: 'var(--cyan)', textAlign: 'right' }}>${Number(escrow.amount || 0).toLocaleString()}</span>
                      <Badge>{String(escrow.status || 'pending')}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        )}

        {tab === 'transactions' && (
          <GlassCard>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-primary)' }}>Transaction History</h3>
            {transactionsLoading ? (
              <div style={{ display: 'flex', gap: 8, color: 'var(--text-muted)', alignItems: 'center' }}>
                <Loader2 size={14} className="mcv-spin" /> Loading...
              </div>
            ) : transactions.length === 0 ? (
              <EmptyState icon={<TrendingUp size={32} />} title="No transactions" description="Distributions and payouts will appear here." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {transactions.slice(0, 50).map((t) => {
                  const txn = t as unknown as Record<string, unknown>;
                  return (
                    <div key={String(txn.id)} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 120px 100px', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13, gap: 8, alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-primary)' }}>{String(txn.description || txn.type || 'Transaction')}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{String(txn.recipient_name || txn.recipient_id || '—')}</span>
                      <span style={{ color: 'var(--cyan)', textAlign: 'right' }}>${Number(txn.amount || 0).toLocaleString()}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 11, textAlign: 'right' }}>
                        {txn.created_at ? new Date(String(txn.created_at)).toLocaleDateString() : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        )}
      </div>

      <Suspense fallback={null}>
        {selectedRoyaltyId && (
          <RoyaltyAgreementDetailDialog
            open={!!selectedRoyaltyId}
            onClose={() => setSelectedRoyaltyId(null)}
            agreement={selectedRoyalty}
            onSave={(updated) => {
              console.log('Save royalty agreement', updated);
              setSelectedRoyaltyId(null);
            }}
          />
        )}
        {selectedEscrowId && (
          <EscrowDetailDialog
            open={!!selectedEscrowId}
            onClose={() => setSelectedEscrowId(null)}
            escrow={selectedEscrow}
            onRelease={(escrowId, milestoneId) => {
              console.log('Release escrow milestone', escrowId, milestoneId);
            }}
            onDispute={(escrowId, milestoneId, reason) => {
              console.log('Dispute escrow milestone', escrowId, milestoneId, reason);
            }}
            onSave={(updated) => {
              console.log('Save escrow agreement', updated);
              setSelectedEscrowId(null);
            }}
          />
        )}
      </Suspense>
    </PageShell>
  );
}
