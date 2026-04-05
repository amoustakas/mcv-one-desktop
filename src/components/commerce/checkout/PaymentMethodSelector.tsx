// @ts-nocheck
// src/components/commerce/checkout/PaymentMethodSelector.tsx
// Payment method selection — saved methods + smart routing recommendation

import type { CheckoutEstimate } from '../../../lib/commerce/checkout-service';

interface SavedMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  type: 'card' | 'bank' | 'crypto' | 'paypal';
}

interface PaymentMethodSelectorProps {
  onSelect: (methodId: string | null, rail: string) => void;
  savedMethods?: SavedMethod[];
  routingEstimate?: CheckoutEstimate | null;
  selectedMethodId?: string | null;
  selectedRail?: string;
}

const RAIL_META: Record<string, { label: string; icon: string; color: string }> = {
  stripe: { label: 'Stripe', icon: '💳', color: '#635BFF' },
  interac: { label: 'Interac', icon: '🍁', color: '#F5A623' },
  ach: { label: 'ACH / Bank Transfer', icon: '🏦', color: '#10B981' },
  solana: { label: 'Solana Pay', icon: '◎', color: '#9945FF' },
  paypal: { label: 'PayPal', icon: '🅿', color: '#003087' },
  crypto: { label: 'Crypto', icon: '₿', color: '#F59E0B' },
};

const CARD_ICONS: Record<string, string> = {
  visa: '💳',
  mastercard: '💳',
  amex: '💳',
  bank: '🏦',
  crypto: '₿',
  paypal: '🅿',
};

function fmtSavings(amount: number): string {
  return amount > 0 ? `Save $${amount.toFixed(2)}` : '';
}

export default function PaymentMethodSelector({
  onSelect,
  savedMethods = [],
  routingEstimate,
  selectedMethodId,
  selectedRail,
}: PaymentMethodSelectorProps) {
  const primaryRail = routingEstimate?.primaryRail ?? 'stripe';
  const fallbackRails = routingEstimate?.fallbackRails ?? [];
  const savings = routingEstimate?.savingsVsDefault ?? 0;
  const fee = routingEstimate?.estimatedProcessingFee ?? 0;

  const allRails = [primaryRail, ...fallbackRails.filter((r) => r !== primaryRail)];

  return (
    <div className="pms-root">
      {/* Smart routing callout */}
      {savings > 0 ? (
        <div className="pms-routing-callout">
          <span className="pms-callout-icon">⚡</span>
          <div className="pms-callout-body">
            <span className="pms-callout-title">Smart Routing Active</span>
            <span className="pms-callout-sub">
              {routingEstimate?.reasoning ?? `Pay with ${RAIL_META[primaryRail]?.label ?? primaryRail} to save $${savings.toFixed(2)}`}
            </span>
          </div>
          <span className="pms-callout-savings">{fmtSavings(savings)}</span>
        </div>
      ) : null}

      {/* Saved payment methods */}
      {savedMethods.length > 0 ? (
        <div className="pms-section">
          <span className="pms-section-label">Saved Methods</span>
          <div className="pms-methods-list">
            {savedMethods.map((m) => (
              <label key={m.id} className={`pms-method-row ${selectedMethodId === m.id ? 'pms-selected' : ''}`}>
                <input
                  type="radio"
                  name="payment-method"
                  value={m.id}
                  checked={selectedMethodId === m.id}
                  onChange={() => onSelect(m.id, 'stripe')}
                  className="pms-radio"
                />
                <span className="pms-method-icon">{CARD_ICONS[m.brand?.toLowerCase()] ?? '💳'}</span>
                <div className="pms-method-info">
                  <span className="pms-method-name">{m.brand?.toUpperCase()} •••• {m.last4}</span>
                  <span className="pms-method-exp">Exp {m.expMonth}/{m.expYear}</span>
                </div>
              </label>
            ))}
          </div>
        </div>
      ) : null}

      {/* Pay with rail */}
      <div className="pms-section">
        <span className="pms-section-label">Pay With</span>
        <div className="pms-rails-list">
          {allRails.map((rail, idx) => {
            const meta = RAIL_META[rail] ?? { label: rail, icon: '💳', color: 'var(--color-cyan)' };
            const isRecommended = idx === 0;
            const isSelected = selectedRail === rail && !selectedMethodId;
            return (
              <label key={rail} className={`pms-rail-row ${isSelected ? 'pms-selected' : ''}`}>
                <input
                  type="radio"
                  name="payment-method"
                  value={`rail:${rail}`}
                  checked={isSelected}
                  onChange={() => onSelect(null, rail)}
                  className="pms-radio"
                />
                <span className="pms-rail-icon" style={{ color: meta.color }}>{meta.icon}</span>
                <div className="pms-rail-info">
                  <div className="pms-rail-name-row">
                    <span className="pms-rail-name">{meta.label}</span>
                    {isRecommended ? (
                      <span className="pms-badge-recommended">Recommended</span>
                    ) : null}
                  </div>
                  <span className="pms-rail-fee">
                    Est. fee: ${fee.toFixed(2)}
                    {isRecommended && savings > 0 ? ` · ${fmtSavings(savings)} vs Stripe` : ''}
                  </span>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <style>{`
        .pms-root { display: flex; flex-direction: column; gap: 16px; }
        .pms-routing-callout {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: rgba(0, 245, 255, 0.06);
          border: 1px solid rgba(0, 245, 255, 0.2);
          border-radius: 8px;
        }
        .pms-callout-icon { font-size: 16px; flex-shrink: 0; }
        .pms-callout-body { flex: 1; display: flex; flex-direction: column; gap: 2px; }
        .pms-callout-title { font-size: 11px; font-weight: 700; color: var(--color-cyan); text-transform: uppercase; letter-spacing: 0.5px; }
        .pms-callout-sub { font-size: 12px; color: var(--text-secondary); }
        .pms-callout-savings { font-size: 12px; font-weight: 700; color: #10B981; white-space: nowrap; }
        .pms-section { display: flex; flex-direction: column; gap: 8px; }
        .pms-section-label { font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
        .pms-methods-list, .pms-rails-list { display: flex; flex-direction: column; gap: 6px; }
        .pms-method-row, .pms-rail-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: rgba(6, 13, 20, 0.6);
          border: 1px solid rgba(0, 245, 255, 0.1);
          border-radius: 8px;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
        }
        .pms-method-row:hover, .pms-rail-row:hover { background: rgba(6, 13, 20, 0.85); border-color: rgba(0, 245, 255, 0.25); }
        .pms-selected { border-color: var(--color-cyan) !important; background: rgba(0, 245, 255, 0.06) !important; }
        .pms-radio { accent-color: var(--color-cyan); width: 14px; height: 14px; flex-shrink: 0; cursor: pointer; }
        .pms-method-icon, .pms-rail-icon { font-size: 18px; flex-shrink: 0; }
        .pms-method-info, .pms-rail-info { display: flex; flex-direction: column; gap: 2px; flex: 1; }
        .pms-method-name, .pms-rail-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
        .pms-method-exp, .pms-rail-fee { font-size: 11px; color: var(--text-muted); font-family: var(--font-mono); }
        .pms-rail-name-row { display: flex; align-items: center; gap: 6px; }
        .pms-badge-recommended {
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 2px 6px;
          background: rgba(0, 245, 255, 0.15);
          color: var(--color-cyan);
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}
