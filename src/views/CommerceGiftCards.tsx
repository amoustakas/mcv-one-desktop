// @ts-nocheck
// src/views/CommerceGiftCards.tsx
// Gift card management view — Shop Management

import { useEffect, useState } from 'react';
import { Gift, Plus, X, CreditCard } from 'lucide-react';
import { useCommerceSurfaceStore } from '../stores/commerce-surface';
import { useNavigation } from '../stores/navigation';
import type { GiftCard } from '../lib/commerce/surface-types';
import { PageShell, PageHeader, StatCard, GlassCard } from '../components/ui';
import { formatMoney } from '../lib/utils';

const STATUS_COLORS: Record<string, string> = {
  active: '#10B981',
  redeemed: '#6B7280',
  expired: '#EF4444',
  disabled: '#EF4444',
};

export default function CommerceGiftCards() {
  const { giftCards, giftCardLoading, createGiftCard } = useCommerceSurfaceStore();
  const { activeVenture } = useNavigation();
  const ventureId = activeVenture || 'mcv';

  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const activeCards = giftCards.filter((g: GiftCard) => g.status === 'active');
  const totalBalance = activeCards.reduce((s: number, g: GiftCard) => s + (g.currentBalance ?? 0), 0);
  const totalIssued = giftCards.reduce((s: number, g: GiftCard) => s + (g.initialBalance ?? 0), 0);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!amount) return;
    setSaving(true);
    try {
      await createGiftCard(ventureId, {
        amount: parseFloat(amount),
        recipientEmail: recipientEmail || null,
        message: message || null,
        currency: 'USD',
      });
      setShowForm(false);
      setAmount(''); setRecipientEmail(''); setMessage('');
    } finally {
      setSaving(false);
    }
  }

  function maskCode(code: string): string {
    if (code.length <= 4) return code;
    return '****-****-****-' + code.slice(-4).toUpperCase();
  }

  return (
    <PageShell scroll>
      <PageHeader title="Gift Cards" subtitle="Issue and manage gift cards" loading={giftCardLoading} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <StatCard label="Active Cards" value={String(activeCards.length)} icon={<Gift size={16} />} accent="cyan" />
        <StatCard label="Total Cards" value={String(giftCards.length)} icon={<CreditCard size={16} />} accent="purple" />
        <StatCard label="Outstanding Balance" value={formatMoney(totalBalance)} icon={<Gift size={16} />} accent="cyan" />
        <StatCard label="Total Issued" value={formatMoney(totalIssued)} icon={<Gift size={16} />} accent="purple" />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
        <button className="gc-create-btn" onClick={() => setShowForm(true)}>
          <Plus size={13} /> Issue Gift Card
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <GlassCard style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Gift size={14} style={{ color: 'var(--color-cyan)' }} /> Issue New Gift Card
            </span>
            <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setShowForm(false)}>
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label className="gc-label">Amount ($)</label>
                <input className="gc-input" type="number" min="1" step="0.01" placeholder="50.00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              </div>
              <div>
                <label className="gc-label">Recipient Email (optional)</label>
                <input className="gc-input" type="email" placeholder="customer@example.com" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="gc-label">Personal Message (optional)</label>
                <textarea className="gc-input" rows={2} placeholder="Happy birthday! Enjoy your gift." value={message} onChange={(e) => setMessage(e.target.value)} style={{ resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button type="button" className="gc-btn" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="gc-btn gc-btn--cyan" disabled={saving}>
                {saving ? 'Issuing...' : 'Issue Gift Card'}
              </button>
            </div>
          </form>
        </GlassCard>
      )}

      {/* Gift card list */}
      <GlassCard>
        <div className="gc-table-header">
          <span style={{ flex: '0 0 200px' }}>Code</span>
          <span style={{ flex: '0 0 100px', textAlign: 'right' }}>Balance</span>
          <span style={{ flex: '0 0 100px', textAlign: 'right' }}>Initial</span>
          <span style={{ flex: '0 0 100px' }}>Status</span>
          <span style={{ flex: '1' }}>Recipient</span>
          <span style={{ flex: '0 0 100px' }}>Issued</span>
          <span style={{ flex: '0 0 100px' }}>Expires</span>
        </div>
        {giftCards.length === 0 && (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            {giftCardLoading ? 'Loading gift cards...' : 'No gift cards issued yet. Click "Issue Gift Card" to create one.'}
          </div>
        )}
        {giftCards.map((gc: GiftCard) => (
          <div key={gc.id} className="gc-table-row">
            <span style={{ flex: '0 0 200px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-cyan)' }}>
              {maskCode(gc.code)}
            </span>
            <span style={{ flex: '0 0 100px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, color: gc.currentBalance > 0 ? '#10B981' : 'var(--text-muted)' }}>
              {formatMoney(gc.currentBalance ?? 0)}
            </span>
            <span style={{ flex: '0 0 100px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>
              {formatMoney(gc.initialBalance ?? 0)}
            </span>
            <span style={{ flex: '0 0 100px' }}>
              <span style={{
                fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px',
                textTransform: 'uppercase', letterSpacing: '0.5px',
                background: `${STATUS_COLORS[gc.status] ?? '#6B7280'}18`,
                color: STATUS_COLORS[gc.status] ?? '#6B7280',
                border: `1px solid ${STATUS_COLORS[gc.status] ?? '#6B7280'}40`,
              }}>
                {gc.status}
              </span>
            </span>
            <span style={{ flex: '1', fontSize: '12px', color: 'var(--text-secondary)' }}>
              {gc.recipientEmail || gc.purchasedByCustomerId ? (gc.recipientEmail || `Customer ${gc.purchasedByCustomerId?.slice(-6)}`) : '—'}
            </span>
            <span style={{ flex: '0 0 100px', fontSize: '11px', color: 'var(--text-muted)' }}>
              {new Date(gc.createdAt).toLocaleDateString()}
            </span>
            <span style={{ flex: '0 0 100px', fontSize: '11px', color: gc.expiresAt ? 'var(--text-muted)' : 'var(--text-muted)' }}>
              {gc.expiresAt ? new Date(gc.expiresAt).toLocaleDateString() : 'No expiry'}
            </span>
          </div>
        ))}
      </GlassCard>

      <style>{`
        .gc-create-btn {
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; padding: 6px 14px; border-radius: 6px;
          background: rgba(0,245,255,0.08); border: 1px solid rgba(0,245,255,0.25);
          color: var(--color-cyan); cursor: pointer; transition: all 0.12s;
        }
        .gc-create-btn:hover { background: rgba(0,245,255,0.14); }
        .gc-label { font-size: 11px; color: var(--text-muted); display: block; margin-bottom: 4px; }
        .gc-input {
          width: 100%; background: rgba(6,13,20,0.6);
          border: 1px solid rgba(0,245,255,0.12); border-radius: 6px;
          padding: 6px 10px; font-size: 12px; color: var(--text-primary);
          outline: none; transition: border-color 0.15s; box-sizing: border-box; font-family: inherit;
        }
        .gc-input:focus { border-color: rgba(0,245,255,0.35); }
        .gc-btn {
          font-size: 12px; padding: 6px 14px; border-radius: 6px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          color: var(--text-secondary); cursor: pointer; transition: all 0.12s;
        }
        .gc-btn:hover { background: rgba(255,255,255,0.09); }
        .gc-btn--cyan { border-color: rgba(0,245,255,0.3); color: var(--color-cyan); }
        .gc-btn--cyan:hover { background: rgba(0,245,255,0.1); }
        .gc-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .gc-table-header {
          display: flex; align-items: center; padding: 8px 16px;
          border-bottom: 1px solid rgba(0,245,255,0.07);
          font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.8px; color: var(--text-muted); gap: 8px;
        }
        .gc-table-row {
          display: flex; align-items: center; padding: 10px 16px; gap: 8px;
          border-bottom: 1px solid rgba(255,255,255,0.03); transition: background 0.12s;
        }
        .gc-table-row:hover { background: rgba(0,245,255,0.02); }
        .gc-table-row:last-child { border-bottom: none; }
      `}</style>
    </PageShell>
  );
}
