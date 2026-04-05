// @ts-nocheck
// src/components/commerce/checkout/CartSidebar.tsx
// Smart cart sidebar — slides in from right, shows items, discount, totals, smart routing

import { useEffect, useRef, useState } from 'react';
import { X, Minus, Plus, Trash2, Zap, ShoppingBag } from 'lucide-react';
import { useCommerceSurfaceStore } from '../../../stores/commerce-surface';
import { useNavigation } from '../../../stores/navigation';
import type { CartSession } from '../../../lib/commerce/surface-types';
import type { CheckoutEstimate } from '../../../lib/commerce/checkout-service';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  ventureId?: string;
  estimate?: CheckoutEstimate | null;
}

function formatMoney(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

function EmptyCartState({ onClose }: { onClose: () => void }) {
  return (
    <div className="cs-empty">
      <div className="cs-empty-icon">
        <ShoppingBag size={40} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
      </div>
      <p className="cs-empty-title">Your cart is empty</p>
      <p className="cs-empty-sub">Add items to start shopping</p>
      <button className="cs-btn-secondary" onClick={onClose}>Continue Shopping</button>
      <style>{`
        .cs-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 40px 20px; flex: 1; justify-content: center; }
        .cs-empty-icon { margin-bottom: 8px; }
        .cs-empty-title { font-size: 15px; font-weight: 700; color: var(--text-primary); margin: 0; }
        .cs-empty-sub { font-size: 13px; color: var(--text-muted); margin: 0; }
      `}</style>
    </div>
  );
}

export default function CartSidebar({ isOpen, onClose, ventureId = 'mcv', estimate }: CartSidebarProps) {
  const { cart, cartLoading, removeFromCart, updateCartQuantity, applyCartDiscount } = useCommerceSurfaceStore();
  const { setView } = useNavigation();
  const [discountCode, setDiscountCode] = useState('');
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  async function handleApplyDiscount() {
    if (!cart || !discountCode.trim()) return;
    setApplyingDiscount(true);
    setDiscountError(null);
    try {
      await applyCartDiscount(ventureId, cart.id, discountCode.trim());
      setDiscountCode('');
    } catch (err) {
      setDiscountError(err instanceof Error ? err.message : 'Invalid discount code');
    } finally {
      setApplyingDiscount(false);
    }
  }

  function handleCheckout() {
    onClose();
    setView('checkout');
  }

  const items = cart?.items ?? [];
  const currency = cart?.currency ?? 'USD';
  const subtotal = cart?.subtotal ?? 0;
  const discountTotal = cart?.discountTotal ?? 0;
  const taxTotal = cart?.taxTotal ?? 0;
  const shippingTotal = cart?.shippingTotal ?? 0;
  const total = cart?.total ?? 0;
  const savings = estimate?.savingsVsDefault ?? 0;
  const primaryRail = estimate?.primaryRail ?? '';

  return (
    <>
      {/* Backdrop */}
      <div
        ref={overlayRef}
        className={`cs-backdrop ${isOpen ? 'cs-backdrop-visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar panel */}
      <aside className={`cs-sidebar ${isOpen ? 'cs-sidebar-open' : ''}`} role="dialog" aria-label="Shopping cart" aria-modal="true">
        {/* Header */}
        <div className="cs-header">
          <div className="cs-header-left">
            <ShoppingBag size={16} style={{ color: 'var(--color-cyan)' }} />
            <span className="cs-header-title">YOUR CART</span>
            {items.length > 0 ? <span className="cs-item-count">({items.length} item{items.length === 1 ? '' : 's'})</span> : null}
          </div>
          <button className="cs-close-btn" onClick={onClose} aria-label="Close cart">
            <X size={18} />
          </button>
        </div>

        <div className="cs-body">
          {items.length === 0 ? (
            <EmptyCartState onClose={onClose} />
          ) : (
            <>
              {/* Items list */}
              <div className="cs-items">
                {items.map((item) => (
                  <div key={item.id} className="cs-item">
                    <div className="cs-item-img">
                      <ShoppingBag size={20} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                    </div>
                    <div className="cs-item-body">
                      <span className="cs-item-name">{item.productId}</span>
                      {item.variantId ? <span className="cs-item-variant">{item.variantId}</span> : null}
                      <span className="cs-item-price">{formatMoney(item.unitPrice, currency)}</span>
                    </div>
                    <div className="cs-item-controls">
                      <div className="cs-qty-row">
                        <button
                          className="cs-qty-btn"
                          onClick={() => item.quantity > 1
                            ? updateCartQuantity(ventureId, cart!.id, item.id, item.quantity - 1)
                            : removeFromCart(ventureId, cart!.id, item.id)
                          }
                          disabled={cartLoading}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="cs-qty-val">{item.quantity}</span>
                        <button
                          className="cs-qty-btn"
                          onClick={() => updateCartQuantity(ventureId, cart!.id, item.id, item.quantity + 1)}
                          disabled={cartLoading}
                          aria-label="Increase quantity"
                        >
                          <Plus size={10} />
                        </button>
                      </div>
                      <button
                        className="cs-remove-btn"
                        onClick={() => removeFromCart(ventureId, cart!.id, item.id)}
                        disabled={cartLoading}
                        aria-label="Remove item"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Smart routing callout */}
              {savings > 0 ? (
                <div className="cs-routing-tip">
                  <Zap size={14} style={{ color: 'var(--color-cyan)', flexShrink: 0 }} />
                  <span>Pay with <strong>{primaryRail}</strong> to save {formatMoney(savings, currency)}</span>
                </div>
              ) : null}

              {/* Discount code */}
              <div className="cs-discount-row">
                <input
                  className="cs-discount-input"
                  placeholder="Discount code"
                  value={discountCode}
                  onChange={(e) => { setDiscountCode(e.target.value); setDiscountError(null); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleApplyDiscount(); }}
                />
                <button
                  className="cs-apply-btn"
                  onClick={handleApplyDiscount}
                  disabled={applyingDiscount || !discountCode.trim()}
                >
                  {applyingDiscount ? '...' : 'Apply'}
                </button>
              </div>
              {discountError ? <p className="cs-discount-error">{discountError}</p> : null}

              {/* Totals */}
              <div className="cs-totals">
                <div className="cs-total-row">
                  <span>Subtotal</span>
                  <span>{formatMoney(subtotal, currency)}</span>
                </div>
                {discountTotal > 0 ? (
                  <div className="cs-total-row cs-discount-row-val">
                    <span>Discount</span>
                    <span>-{formatMoney(discountTotal, currency)}</span>
                  </div>
                ) : null}
                <div className="cs-total-row">
                  <span>Tax</span>
                  <span>{taxTotal > 0 ? formatMoney(taxTotal, currency) : 'Calculated at checkout'}</span>
                </div>
                <div className="cs-total-row">
                  <span>Shipping</span>
                  <span>{shippingTotal > 0 ? formatMoney(shippingTotal, currency) : 'Calculated at checkout'}</span>
                </div>
                <div className="cs-divider" />
                <div className="cs-total-row cs-grand-total">
                  <span>TOTAL</span>
                  <span>{formatMoney(total, currency)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer actions */}
        {items.length > 0 ? (
          <div className="cs-footer">
            <button className="cs-checkout-btn" onClick={handleCheckout} disabled={cartLoading}>
              {cartLoading ? 'Loading...' : 'Checkout'}
            </button>
            <button className="cs-continue-btn" onClick={onClose}>
              Continue Shopping
            </button>
          </div>
        ) : null}
      </aside>

      <style>{`
        .cs-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(6, 13, 20, 0.7);
          z-index: 999;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.25s ease;
        }
        .cs-backdrop-visible { opacity: 1; pointer-events: all; }
        .cs-sidebar {
          position: fixed;
          right: 0;
          top: 0;
          height: 100vh;
          width: 420px;
          z-index: 1000;
          background: rgba(8, 16, 26, 0.97);
          backdrop-filter: blur(20px);
          border-left: 1px solid rgba(0, 245, 255, 0.12);
          display: flex;
          flex-direction: column;
          transform: translateX(100%);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .cs-sidebar-open { transform: translateX(0); }
        .cs-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid rgba(0, 245, 255, 0.08);
          flex-shrink: 0;
        }
        .cs-header-left { display: flex; align-items: center; gap: 8px; }
        .cs-header-title { font-size: 12px; font-weight: 800; color: var(--text-primary); letter-spacing: 1px; text-transform: uppercase; }
        .cs-item-count { font-size: 12px; color: var(--text-muted); }
        .cs-close-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: transparent;
          border: 1px solid rgba(0, 245, 255, 0.1);
          border-radius: 6px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s;
        }
        .cs-close-btn:hover { border-color: var(--color-cyan); color: var(--color-cyan); }
        .cs-body { flex: 1; overflow-y: auto; padding: 16px 20px; display: flex; flex-direction: column; gap: 14px; }
        .cs-items { display: flex; flex-direction: column; gap: 10px; }
        .cs-item {
          display: flex;
          gap: 10px;
          padding: 10px;
          background: rgba(6, 13, 20, 0.6);
          border: 1px solid rgba(0, 245, 255, 0.08);
          border-radius: 8px;
        }
        .cs-item-img {
          width: 48px;
          height: 48px;
          background: rgba(0, 245, 255, 0.04);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 1px solid rgba(0, 245, 255, 0.06);
        }
        .cs-item-body { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .cs-item-name { font-size: 13px; font-weight: 600; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .cs-item-variant { font-size: 11px; color: var(--text-muted); }
        .cs-item-price { font-size: 13px; font-weight: 700; color: var(--color-cyan); font-family: var(--font-mono); }
        .cs-item-controls { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; }
        .cs-qty-row { display: flex; align-items: center; gap: 6px; }
        .cs-qty-btn {
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 245, 255, 0.08);
          border: 1px solid rgba(0, 245, 255, 0.15);
          border-radius: 4px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: background 0.15s;
        }
        .cs-qty-btn:hover:not(:disabled) { background: rgba(0, 245, 255, 0.15); color: var(--color-cyan); }
        .cs-qty-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .cs-qty-val { font-size: 13px; font-weight: 700; color: var(--text-primary); min-width: 16px; text-align: center; font-family: var(--font-mono); }
        .cs-remove-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          border-radius: 4px;
          transition: color 0.15s;
        }
        .cs-remove-btn:hover:not(:disabled) { color: #EF4444; }
        .cs-routing-tip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: rgba(0, 245, 255, 0.05);
          border: 1px solid rgba(0, 245, 255, 0.15);
          border-radius: 7px;
          font-size: 12px;
          color: var(--text-secondary);
        }
        .cs-discount-row {
          display: flex;
          gap: 8px;
        }
        .cs-discount-input {
          flex: 1;
          background: rgba(6, 13, 20, 0.7);
          border: 1px solid rgba(0, 245, 255, 0.15);
          border-radius: 6px;
          padding: 8px 10px;
          color: var(--text-primary);
          font-size: 13px;
          outline: none;
          transition: border-color 0.15s;
        }
        .cs-discount-input:focus { border-color: var(--color-cyan); }
        .cs-discount-input::placeholder { color: var(--text-muted); }
        .cs-apply-btn {
          padding: 8px 14px;
          background: transparent;
          border: 1px solid rgba(0, 245, 255, 0.25);
          border-radius: 6px;
          color: var(--color-cyan);
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s;
          white-space: nowrap;
        }
        .cs-apply-btn:hover:not(:disabled) { background: rgba(0, 245, 255, 0.08); }
        .cs-apply-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .cs-discount-error { font-size: 11px; color: #EF4444; margin: -6px 0 0; }
        .cs-totals { display: flex; flex-direction: column; gap: 6px; }
        .cs-total-row { display: flex; justify-content: space-between; font-size: 13px; color: var(--text-secondary); font-family: var(--font-mono); }
        .cs-discount-row-val { color: #10B981; }
        .cs-divider { height: 1px; background: rgba(0, 245, 255, 0.08); margin: 4px 0; }
        .cs-grand-total { font-size: 16px; font-weight: 800; color: var(--text-primary); }
        .cs-footer {
          flex-shrink: 0;
          padding: 16px 20px;
          border-top: 1px solid rgba(0, 245, 255, 0.08);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .cs-checkout-btn {
          width: 100%;
          padding: 12px;
          background: var(--color-cyan);
          color: var(--bg-primary);
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: opacity 0.15s;
          text-transform: uppercase;
        }
        .cs-checkout-btn:hover:not(:disabled) { opacity: 0.85; }
        .cs-checkout-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .cs-continue-btn {
          width: 100%;
          padding: 10px;
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 13px;
          cursor: pointer;
          transition: color 0.15s;
        }
        .cs-continue-btn:hover { color: var(--text-secondary); }
        .cs-btn-secondary {
          padding: 10px 20px;
          background: transparent;
          border: 1px solid rgba(0, 245, 255, 0.2);
          border-radius: 8px;
          color: var(--text-primary);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: border-color 0.15s;
          margin-top: 8px;
        }
        .cs-btn-secondary:hover { border-color: var(--color-cyan); color: var(--color-cyan); }
        @media (max-width: 480px) {
          .cs-sidebar { width: 100vw; }
        }
      `}</style>
    </>
  );
}
