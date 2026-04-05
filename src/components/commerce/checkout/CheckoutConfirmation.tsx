// @ts-nocheck
// src/components/commerce/checkout/CheckoutConfirmation.tsx
// Order confirmation screen — shown after successful checkout

import { useEffect, useState } from 'react';
import { CheckCircle, Package, Download, ShoppingBag } from 'lucide-react';
import { useNavigation } from '../../../stores/navigation';
import type { OrderConfirmation } from '../../../lib/commerce/checkout-service';

interface CheckoutConfirmationProps {
  confirmation: OrderConfirmation;
  onContinueShopping?: () => void;
  onViewOrder?: (orderId: string) => void;
}

function formatMoney(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

function getEstimatedDelivery(): string {
  const d = new Date();
  d.setDate(d.getDate() + 5);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function CheckoutConfirmation({
  confirmation,
  onContinueShopping,
  onViewOrder,
}: CheckoutConfirmationProps) {
  const { setView } = useNavigation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  function handleContinue() {
    if (onContinueShopping) {
      onContinueShopping();
    } else {
      setView('commerce-products');
    }
  }

  const hasDigital = confirmation.items.some((i) => i.productId.startsWith('digital-'));
  const hasPhysical = !hasDigital || confirmation.items.length > 1;

  return (
    <div className={`cc-root ${visible ? 'cc-visible' : ''}`}>
      {/* Success icon */}
      <div className="cc-icon-wrap">
        <div className="cc-icon-ring">
          <CheckCircle size={40} color="var(--color-cyan)" />
        </div>
      </div>

      <h2 className="cc-title">Order Confirmed!</h2>
      <p className="cc-subtitle">
        Your order has been placed and payment processed successfully.
      </p>

      {/* Order metadata */}
      <div className="cc-meta-row">
        <div className="cc-meta-item">
          <span className="cc-meta-label">Order Number</span>
          <span className="cc-meta-value cc-mono">#{confirmation.orderNumber}</span>
        </div>
        <div className="cc-meta-item">
          <span className="cc-meta-label">Payment</span>
          <span className="cc-meta-value cc-mono">{confirmation.processorRail.toUpperCase()}</span>
        </div>
        <div className="cc-meta-item">
          <span className="cc-meta-label">Status</span>
          <span className="cc-meta-value cc-status-confirmed">Confirmed</span>
        </div>
      </div>

      {/* Order items summary */}
      <div className="cc-card">
        <div className="cc-card-header">
          <Package size={14} style={{ color: 'var(--color-cyan)' }} />
          <span className="cc-card-title">Order Summary</span>
        </div>
        <div className="cc-items-list">
          {confirmation.items.map((item, idx) => (
            <div key={idx} className="cc-item-row">
              <span className="cc-item-name">
                {item.productId}
                {item.variantId ? ` — ${item.variantId}` : ''}
              </span>
              <span className="cc-item-qty">×{item.quantity}</span>
              <span className="cc-item-price">{formatMoney(item.totalPrice, confirmation.currency)}</span>
            </div>
          ))}
        </div>
        <div className="cc-divider" />
        <div className="cc-totals">
          {confirmation.savingsVsDefault > 0 ? (
            <div className="cc-total-row cc-savings-row">
              <span>Payment Savings</span>
              <span>-{formatMoney(confirmation.savingsVsDefault, confirmation.currency)}</span>
            </div>
          ) : null}
          {confirmation.estimatedFee > 0 ? (
            <div className="cc-total-row">
              <span>Processing Fee</span>
              <span>{formatMoney(confirmation.estimatedFee, confirmation.currency)}</span>
            </div>
          ) : null}
          <div className="cc-total-row cc-grand-total">
            <span>Total Charged</span>
            <span>{formatMoney(confirmation.total, confirmation.currency)}</span>
          </div>
        </div>
      </div>

      {/* Delivery info */}
      {hasPhysical ? (
        <div className="cc-delivery-card">
          <span className="cc-delivery-label">Estimated Delivery</span>
          <span className="cc-delivery-date">{getEstimatedDelivery()}</span>
          {confirmation.shippingAddress ? (
            <span className="cc-delivery-addr">
              {String(confirmation.shippingAddress.line1)}, {String(confirmation.shippingAddress.city)},{' '}
              {String(confirmation.shippingAddress.state)}
            </span>
          ) : null}
        </div>
      ) : null}

      {/* Digital download links */}
      {hasDigital ? (
        <div className="cc-digital-card">
          <div className="cc-card-header">
            <Download size={14} style={{ color: 'var(--color-purple)' }} />
            <span className="cc-card-title" style={{ color: 'var(--color-purple)' }}>Digital Downloads</span>
          </div>
          <p className="cc-digital-note">Download links have been sent to your email and are available in your account.</p>
        </div>
      ) : null}

      {/* Action buttons */}
      <div className="cc-actions">
        {onViewOrder ? (
          <button className="cc-btn-secondary" onClick={() => onViewOrder(confirmation.orderId)}>
            View Order
          </button>
        ) : null}
        <button className="cc-btn-primary" onClick={handleContinue}>
          <ShoppingBag size={15} />
          Continue Shopping
        </button>
      </div>

      <style>{`
        .cc-root {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          padding: 40px 24px;
          max-width: 520px;
          margin: 0 auto;
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 0.3s ease, transform 0.3s ease;
        }
        .cc-visible { opacity: 1; transform: translateY(0); }
        .cc-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 80px;
          height: 80px;
        }
        .cc-icon-ring {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: rgba(0, 245, 255, 0.08);
          border: 2px solid rgba(0, 245, 255, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: cc-ring-pulse 2s ease infinite;
        }
        @keyframes cc-ring-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(0, 245, 255, 0.3); }
          50% { box-shadow: 0 0 0 8px rgba(0, 245, 255, 0); }
        }
        .cc-title { font-size: 24px; font-weight: 800; color: var(--text-primary); margin: 0; text-align: center; }
        .cc-subtitle { font-size: 14px; color: var(--text-secondary); margin: 0; text-align: center; }
        .cc-meta-row {
          display: flex;
          gap: 24px;
          padding: 12px 20px;
          background: rgba(6, 13, 20, 0.6);
          border: 1px solid rgba(0, 245, 255, 0.1);
          border-radius: 10px;
          width: 100%;
          box-sizing: border-box;
          flex-wrap: wrap;
          justify-content: center;
        }
        .cc-meta-item { display: flex; flex-direction: column; gap: 2px; align-items: center; }
        .cc-meta-label { font-size: 10px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
        .cc-meta-value { font-size: 13px; font-weight: 700; color: var(--text-primary); }
        .cc-mono { font-family: var(--font-mono); }
        .cc-status-confirmed { color: #10B981; }
        .cc-card {
          background: rgba(6, 13, 20, 0.6);
          border: 1px solid rgba(0, 245, 255, 0.1);
          border-radius: 10px;
          padding: 16px;
          width: 100%;
          box-sizing: border-box;
        }
        .cc-card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(0, 245, 255, 0.07);
        }
        .cc-card-title { font-size: 11px; font-weight: 700; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.5px; }
        .cc-items-list { display: flex; flex-direction: column; gap: 6px; }
        .cc-item-row { display: flex; align-items: center; gap: 8px; font-size: 13px; }
        .cc-item-name { flex: 1; color: var(--text-secondary); font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .cc-item-qty { color: var(--text-muted); font-family: var(--font-mono); font-size: 12px; flex-shrink: 0; }
        .cc-item-price { font-family: var(--font-mono); font-size: 13px; font-weight: 600; color: var(--text-primary); flex-shrink: 0; }
        .cc-divider { height: 1px; background: rgba(0, 245, 255, 0.07); margin: 12px 0; }
        .cc-totals { display: flex; flex-direction: column; gap: 6px; }
        .cc-total-row { display: flex; justify-content: space-between; font-size: 13px; color: var(--text-secondary); font-family: var(--font-mono); }
        .cc-savings-row { color: #10B981; }
        .cc-grand-total { font-size: 15px; font-weight: 800; color: var(--text-primary); margin-top: 4px; }
        .cc-delivery-card {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 14px 16px;
          background: rgba(16, 185, 129, 0.06);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 10px;
          width: 100%;
          box-sizing: border-box;
        }
        .cc-delivery-label { font-size: 10px; font-weight: 700; color: #10B981; text-transform: uppercase; letter-spacing: 0.5px; }
        .cc-delivery-date { font-size: 15px; font-weight: 700; color: var(--text-primary); }
        .cc-delivery-addr { font-size: 12px; color: var(--text-secondary); }
        .cc-digital-card {
          padding: 14px 16px;
          background: rgba(139, 92, 246, 0.06);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 10px;
          width: 100%;
          box-sizing: border-box;
        }
        .cc-digital-note { font-size: 12px; color: var(--text-secondary); margin: 8px 0 0; }
        .cc-actions { display: flex; gap: 10px; width: 100%; justify-content: center; flex-wrap: wrap; }
        .cc-btn-primary {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 24px;
          background: var(--color-cyan);
          color: var(--bg-primary);
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .cc-btn-primary:hover { opacity: 0.85; }
        .cc-btn-secondary {
          padding: 10px 24px;
          background: transparent;
          color: var(--text-primary);
          border: 1px solid rgba(0, 245, 255, 0.2);
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: border-color 0.15s;
        }
        .cc-btn-secondary:hover { border-color: var(--color-cyan); color: var(--color-cyan); }
      `}</style>
    </div>
  );
}
