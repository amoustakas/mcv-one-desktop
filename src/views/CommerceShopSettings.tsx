// @ts-nocheck
// src/views/CommerceShopSettings.tsx
// Shop settings view — Shop Management

import { useState } from 'react';
import { SlidersHorizontal, Store, CreditCard, Truck, Bell, Shield } from 'lucide-react';
import { useNavigation } from '../stores/navigation';
import { PageShell, PageHeader, GlassCard } from '../components/ui';

const TABS = [
  { key: 'general', label: 'General', icon: Store },
  { key: 'payments', label: 'Payments', icon: CreditCard },
  { key: 'shipping', label: 'Shipping', icon: Truck },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'security', label: 'Security', icon: Shield },
];

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px',
      padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <div style={{ flex: '1' }}>
        <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '2px' }}>{label}</p>
        {description && <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{description}</p>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: '40px', height: '22px', borderRadius: '11px', border: 'none', cursor: 'pointer',
        background: value ? 'var(--color-cyan)' : 'rgba(255,255,255,0.1)',
        position: 'relative', transition: 'background 0.2s',
        boxShadow: value ? '0 0 8px rgba(0,245,255,0.4)' : 'none',
      }}
    >
      <span style={{
        position: 'absolute', top: '3px', left: value ? '21px' : '3px',
        width: '16px', height: '16px', borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s', display: 'block',
      }} />
    </button>
  );
}

export default function CommerceShopSettings() {
  const { activeVenture } = useNavigation();
  const ventureId = activeVenture || 'mcv';
  const [activeTab, setActiveTab] = useState('general');

  // General settings
  const [shopName, setShopName] = useState('MCV Shop');
  const [currency, setCurrency] = useState('USD');
  const [timezone, setTimezone] = useState('America/New_York');
  const [orderPrefix, setOrderPrefix] = useState('MCV-');

  // Payment toggles
  const [stripeEnabled, setStripeEnabled] = useState(true);
  const [solanaEnabled, setSolanaEnabled] = useState(true);
  const [creditsEnabled, setCreditsEnabled] = useState(true);
  const [paypalEnabled, setPaypalEnabled] = useState(false);

  // Shipping
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('75');
  const [defaultCarrier, setDefaultCarrier] = useState('UPS');

  // Notifications
  const [orderConfirmEmail, setOrderConfirmEmail] = useState(true);
  const [shipmentEmail, setShipmentEmail] = useState(true);
  const [lowStockAlert, setLowStockAlert] = useState(true);
  const [reviewAlert, setReviewAlert] = useState(false);

  // Security
  const [requireAddressVerification, setRequireAddressVerification] = useState(true);
  const [fraudPrevention, setFraudPrevention] = useState(true);

  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
  }

  return (
    <PageShell scroll>
      <PageHeader
        title="Shop Settings"
        subtitle={`Configuration for ${ventureId.toUpperCase()} shop`}
      />

      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        {/* Sidebar tabs */}
        <div style={{
          width: '160px', flexShrink: 0,
          background: 'rgba(6,13,20,0.8)', border: '1px solid rgba(0,245,255,0.08)',
          borderRadius: '10px', overflow: 'hidden',
        }}>
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={`ss-tab-btn${activeTab === key ? ' active' : ''}`}
              onClick={() => setActiveTab(key)}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Settings panel */}
        <div style={{ flex: 1 }}>
          {activeTab === 'general' && (
            <GlassCard>
              <div className="ss-section-header">
                <Store size={14} style={{ color: 'var(--color-cyan)' }} />
                <span className="ss-section-title">General</span>
              </div>
              <SettingRow label="Shop Name" description="Displayed to customers on receipts and emails">
                <input className="ss-input" value={shopName} onChange={(e) => setShopName(e.target.value)} style={{ width: '200px' }} />
              </SettingRow>
              <SettingRow label="Default Currency" description="Currency for all transactions">
                <select className="ss-input" value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ width: '120px' }}>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="SOL">SOL</option>
                </select>
              </SettingRow>
              <SettingRow label="Timezone" description="Used for order timestamps and reports">
                <select className="ss-input" value={timezone} onChange={(e) => setTimezone(e.target.value)} style={{ width: '200px' }}>
                  <option value="America/New_York">Eastern (UTC-5)</option>
                  <option value="America/Los_Angeles">Pacific (UTC-8)</option>
                  <option value="UTC">UTC</option>
                  <option value="Europe/London">London (UTC+0)</option>
                </select>
              </SettingRow>
              <SettingRow label="Order Number Prefix" description="Prefix added to all order numbers">
                <input className="ss-input" value={orderPrefix} onChange={(e) => setOrderPrefix(e.target.value)} style={{ width: '120px' }} />
              </SettingRow>
            </GlassCard>
          )}

          {activeTab === 'payments' && (
            <GlassCard>
              <div className="ss-section-header">
                <CreditCard size={14} style={{ color: 'var(--color-cyan)' }} />
                <span className="ss-section-title">Payment Methods</span>
              </div>
              <SettingRow label="Stripe" description="Credit/debit cards, Apple Pay, Google Pay">
                <Toggle value={stripeEnabled} onChange={setStripeEnabled} />
              </SettingRow>
              <SettingRow label="Solana Pay" description="Native Solana and SPL token payments">
                <Toggle value={solanaEnabled} onChange={setSolanaEnabled} />
              </SettingRow>
              <SettingRow label="MCV Credits" description="Platform credit wallets and earned credits">
                <Toggle value={creditsEnabled} onChange={setCreditsEnabled} />
              </SettingRow>
              <SettingRow label="PayPal" description="PayPal and Venmo payments">
                <Toggle value={paypalEnabled} onChange={setPaypalEnabled} />
              </SettingRow>
            </GlassCard>
          )}

          {activeTab === 'shipping' && (
            <GlassCard>
              <div className="ss-section-header">
                <Truck size={14} style={{ color: 'var(--color-cyan)' }} />
                <span className="ss-section-title">Shipping</span>
              </div>
              <SettingRow label="Free Shipping Threshold ($)" description="Orders above this amount get free shipping">
                <input className="ss-input" type="number" min="0" value={freeShippingThreshold} onChange={(e) => setFreeShippingThreshold(e.target.value)} style={{ width: '100px' }} />
              </SettingRow>
              <SettingRow label="Default Carrier" description="Carrier used when none is specified">
                <select className="ss-input" value={defaultCarrier} onChange={(e) => setDefaultCarrier(e.target.value)} style={{ width: '140px' }}>
                  <option value="UPS">UPS</option>
                  <option value="FedEx">FedEx</option>
                  <option value="USPS">USPS</option>
                  <option value="DHL">DHL</option>
                </select>
              </SettingRow>
            </GlassCard>
          )}

          {activeTab === 'notifications' && (
            <GlassCard>
              <div className="ss-section-header">
                <Bell size={14} style={{ color: 'var(--color-cyan)' }} />
                <span className="ss-section-title">Notifications</span>
              </div>
              <SettingRow label="Order Confirmation Emails" description="Send email to customer when order is placed">
                <Toggle value={orderConfirmEmail} onChange={setOrderConfirmEmail} />
              </SettingRow>
              <SettingRow label="Shipment Confirmation Emails" description="Notify customer when order ships">
                <Toggle value={shipmentEmail} onChange={setShipmentEmail} />
              </SettingRow>
              <SettingRow label="Low Stock Alerts" description="Notify ops team when inventory drops below threshold">
                <Toggle value={lowStockAlert} onChange={setLowStockAlert} />
              </SettingRow>
              <SettingRow label="New Review Alerts" description="Notify when a new review is submitted">
                <Toggle value={reviewAlert} onChange={setReviewAlert} />
              </SettingRow>
            </GlassCard>
          )}

          {activeTab === 'security' && (
            <GlassCard>
              <div className="ss-section-header">
                <Shield size={14} style={{ color: 'var(--color-cyan)' }} />
                <span className="ss-section-title">Security & Fraud</span>
              </div>
              <SettingRow label="Address Verification (AVS)" description="Verify billing address against card records">
                <Toggle value={requireAddressVerification} onChange={setRequireAddressVerification} />
              </SettingRow>
              <SettingRow label="Fraud Prevention" description="Block high-risk transactions automatically">
                <Toggle value={fraudPrevention} onChange={setFraudPrevention} />
              </SettingRow>
            </GlassCard>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button className="ss-save-btn" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .ss-tab-btn {
          width: 100%; display: flex; align-items: center; gap: 8px;
          padding: 10px 14px; font-size: 12px; background: none; border: none;
          color: var(--text-muted); cursor: pointer; transition: all 0.12s;
          border-left: 3px solid transparent;
        }
        .ss-tab-btn:hover { color: var(--text-secondary); background: rgba(0,245,255,0.03); }
        .ss-tab-btn.active { color: var(--color-cyan); border-left-color: var(--color-cyan); background: rgba(0,245,255,0.05); }
        .ss-tab-btn + .ss-tab-btn { border-top: 1px solid rgba(255,255,255,0.03); }
        .ss-section-header {
          display: flex; align-items: center; gap: 8px;
          margin-bottom: 4px; padding-bottom: 12px;
          border-bottom: 1px solid rgba(0,245,255,0.07);
        }
        .ss-section-title {
          font-size: 12px; font-weight: 600; color: var(--text-primary);
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        .ss-input {
          background: rgba(6,13,20,0.6); border: 1px solid rgba(0,245,255,0.12);
          border-radius: 6px; padding: 5px 10px; font-size: 12px;
          color: var(--text-primary); outline: none; transition: border-color 0.15s; font-family: inherit;
        }
        .ss-input:focus { border-color: rgba(0,245,255,0.35); }
        .ss-save-btn {
          font-size: 13px; padding: 8px 20px; border-radius: 7px;
          background: rgba(0,245,255,0.1); border: 1px solid rgba(0,245,255,0.3);
          color: var(--color-cyan); cursor: pointer; transition: all 0.12s; font-weight: 500;
        }
        .ss-save-btn:hover { background: rgba(0,245,255,0.16); }
        .ss-save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </PageShell>
  );
}
