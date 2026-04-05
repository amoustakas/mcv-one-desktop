// @ts-nocheck
// src/components/commerce/checkout/CheckoutFlow.tsx
// Multi-step checkout: Cart Review → Shipping → Payment → Review & Place Order

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ShoppingBag, Truck, CreditCard, CheckSquare } from 'lucide-react';
import { useCommerceSurfaceStore } from '../../../stores/commerce-surface';
import type { SurfaceAddress } from '../../../lib/commerce/surface-types';
import type { CheckoutEstimate, OrderConfirmation } from '../../../lib/commerce/checkout-service';
import AddressForm from './AddressForm';
import PaymentMethodSelector from './PaymentMethodSelector';
import CheckoutConfirmation from './CheckoutConfirmation';

interface CheckoutFlowProps {
  ventureId?: string;
  customerId?: string;
  onComplete?: (confirmation: OrderConfirmation) => void;
}

type Step = 0 | 1 | 2 | 3;

const STEPS = [
  { label: 'Cart', icon: ShoppingBag },
  { label: 'Shipping', icon: Truck },
  { label: 'Payment', icon: CreditCard },
  { label: 'Review', icon: CheckSquare },
] as const;

function formatMoney(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="cf-steps">
      {STEPS.map((s, idx) => {
        const Icon = s.icon;
        const done = idx < current;
        const active = idx === current;
        return (
          <div key={s.label} className="cf-step-item">
            {idx > 0 ? <div className={`cf-step-line ${done ? 'cf-step-line-done' : ''}`} /> : null}
            <div className={`cf-step-circle ${active ? 'cf-step-active' : ''} ${done ? 'cf-step-done' : ''}`}>
              <Icon size={12} />
            </div>
            <span className={`cf-step-label ${active ? 'cf-step-label-active' : ''}`}>{s.label}</span>
          </div>
        );
      })}
      <style>{`
        .cf-steps { display: flex; align-items: flex-start; justify-content: center; gap: 0; margin-bottom: 28px; }
        .cf-step-item { display: flex; flex-direction: column; align-items: center; gap: 4px; position: relative; }
        .cf-step-line {
          position: absolute;
          left: -50%;
          top: 13px;
          width: 100%;
          height: 1px;
          background: rgba(0, 245, 255, 0.1);
          z-index: 0;
          transform: translateX(-50%);
        }
        .cf-step-line-done { background: rgba(0, 245, 255, 0.5); }
        .cf-step-circle {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(6, 13, 20, 0.8);
          border: 1px solid rgba(0, 245, 255, 0.15);
          color: var(--text-muted);
          font-size: 12px;
          font-weight: 700;
          position: relative;
          z-index: 1;
          transition: background 0.2s, border-color 0.2s, color 0.2s;
        }
        .cf-step-active { border-color: var(--color-cyan); color: var(--color-cyan); background: rgba(0, 245, 255, 0.08); }
        .cf-step-done { border-color: rgba(0, 245, 255, 0.4); color: var(--color-cyan); background: rgba(0, 245, 255, 0.06); }
        .cf-step-label { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; white-space: nowrap; }
        .cf-step-label-active { color: var(--color-cyan); }
      `}</style>
    </div>
  );
}

// ─── Step 1: Cart Review ─────────────────────────────────

function CartReviewStep({
  ventureId,
  onNext,
}: {
  ventureId: string;
  onNext: () => void;
}) {
  const { cart, cartLoading, removeFromCart, updateCartQuantity, applyCartDiscount } = useCommerceSurfaceStore();
  const [code, setCode] = useState('');
  const [applying, setApplying] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  const items = cart?.items ?? [];
  const currency = cart?.currency ?? 'USD';

  async function handleApply() {
    if (!cart || !code.trim()) return;
    setApplying(true);
    setCodeError(null);
    try {
      await applyCartDiscount(ventureId, cart.id, code.trim());
      setCode('');
    } catch (err) {
      setCodeError(err instanceof Error ? err.message : 'Invalid code');
    } finally {
      setApplying(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="cfstep-empty">
        <ShoppingBag size={32} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Your cart is empty</p>
      </div>
    );
  }

  return (
    <div className="cfstep">
      <div className="cf-items-list">
        {items.map((item) => (
          <div key={item.id} className="cf-item">
            <div className="cf-item-img">
              <ShoppingBag size={18} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
            </div>
            <div className="cf-item-body">
              <span className="cf-item-name">{item.productId}</span>
              {item.variantId ? <span className="cf-item-variant">{item.variantId}</span> : null}
            </div>
            <div className="cf-item-right">
              <div className="cf-qty-row">
                <button className="cf-qty-btn" onClick={() => item.quantity > 1 ? updateCartQuantity(ventureId, cart!.id, item.id, item.quantity - 1) : removeFromCart(ventureId, cart!.id, item.id)} disabled={cartLoading}>−</button>
                <span className="cf-qty-val">{item.quantity}</span>
                <button className="cf-qty-btn" onClick={() => updateCartQuantity(ventureId, cart!.id, item.id, item.quantity + 1)} disabled={cartLoading}>+</button>
              </div>
              <span className="cf-item-price">{formatMoney(item.totalPrice, currency)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="cf-discount-row">
        <input className="cf-input" placeholder="Discount code" value={code} onChange={(e) => { setCode(e.target.value); setCodeError(null); }} onKeyDown={(e) => { if (e.key === 'Enter') handleApply(); }} />
        <button className="cf-apply-btn" onClick={handleApply} disabled={applying || !code.trim()}>{applying ? '...' : 'Apply'}</button>
      </div>
      {codeError ? <p className="cf-err">{codeError}</p> : null}

      <div className="cf-subtotal-row">
        <span className="cf-subtotal-label">Subtotal ({items.length} item{items.length === 1 ? '' : 's'})</span>
        <span className="cf-subtotal-val">{formatMoney(cart?.subtotal ?? 0, currency)}</span>
      </div>
      {(cart?.discountTotal ?? 0) > 0 ? (
        <div className="cf-subtotal-row cf-discount-val">
          <span>Discount</span>
          <span>-{formatMoney(cart!.discountTotal, currency)}</span>
        </div>
      ) : null}

      <button className="cf-next-btn" onClick={onNext} disabled={cartLoading}>
        Continue to Shipping <ChevronRight size={15} />
      </button>
    </div>
  );
}

// ─── Step 2: Shipping ────────────────────────────────────

const SHIPPING_METHODS = [
  { id: 'standard', label: 'Standard Shipping', desc: '5–7 business days', price: 0 },
  { id: 'express', label: 'Express Shipping', desc: '2–3 business days', price: 12.99 },
  { id: 'overnight', label: 'Overnight', desc: 'Next business day', price: 29.99 },
];

function ShippingStep({
  onNext,
  onBack,
  onAddressChange,
  defaultAddress,
}: {
  onNext: () => void;
  onBack: () => void;
  onAddressChange: (addr: SurfaceAddress, method: string) => void;
  defaultAddress?: Partial<SurfaceAddress>;
}) {
  const [address, setAddress] = useState<SurfaceAddress | null>(null);
  const [method, setMethod] = useState('standard');
  const currency = 'USD';

  function handleAddrSubmit(addr: SurfaceAddress) {
    setAddress(addr);
    onAddressChange(addr, method);
    onNext();
  }

  return (
    <div className="cfstep">
      <h3 className="cf-step-heading">Shipping Address</h3>
      <AddressForm
        onSubmit={handleAddrSubmit}
        defaultValues={defaultAddress}
        showSubmitButton={false}
      />

      <h3 className="cf-step-heading" style={{ marginTop: 16 }}>Shipping Method</h3>
      <div className="cf-ship-methods">
        {SHIPPING_METHODS.map((m) => (
          <label key={m.id} className={`cf-ship-method ${method === m.id ? 'cf-ship-selected' : ''}`}>
            <input type="radio" name="shipping-method" value={m.id} checked={method === m.id} onChange={() => setMethod(m.id)} className="cf-radio" />
            <div className="cf-ship-info">
              <span className="cf-ship-name">{m.label}</span>
              <span className="cf-ship-desc">{m.desc}</span>
            </div>
            <span className="cf-ship-price">{m.price === 0 ? 'FREE' : formatMoney(m.price, currency)}</span>
          </label>
        ))}
      </div>

      <div className="cf-nav-row">
        <button className="cf-back-btn" onClick={onBack}><ChevronLeft size={15} /> Back</button>
        <button
          className="cf-next-btn"
          onClick={() => {
            // Trigger AddressForm submission programmatically via a dummy submit
            const form = document.querySelector('.af-form') as HTMLFormElement | null;
            if (form) form.requestSubmit();
            else onNext(); // fallback if address not required
          }}
        >
          Continue to Payment <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Payment ─────────────────────────────────────

function PaymentStep({
  onNext,
  onBack,
  onPaymentChange,
  estimate,
}: {
  onNext: () => void;
  onBack: () => void;
  onPaymentChange: (methodId: string | null, rail: string) => void;
  estimate: CheckoutEstimate | null;
}) {
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [selectedRail, setSelectedRail] = useState<string>(estimate?.primaryRail ?? 'stripe');

  function handleSelect(methodId: string | null, rail: string) {
    setSelectedMethodId(methodId);
    setSelectedRail(rail);
    onPaymentChange(methodId, rail);
  }

  return (
    <div className="cfstep">
      <h3 className="cf-step-heading">Payment</h3>
      <PaymentMethodSelector
        onSelect={handleSelect}
        routingEstimate={estimate}
        selectedMethodId={selectedMethodId}
        selectedRail={selectedRail}
      />

      <div className="cf-nav-row">
        <button className="cf-back-btn" onClick={onBack}><ChevronLeft size={15} /> Back</button>
        <button className="cf-next-btn" onClick={onNext}>
          Review Order <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── Step 4: Review & Place Order ────────────────────────

function ReviewStep({
  onBack,
  onPlaceOrder,
  ventureId,
  customerId,
  estimate,
  shippingAddress,
  shippingMethod,
  selectedRail,
  placing,
}: {
  onBack: () => void;
  onPlaceOrder: () => void;
  ventureId: string;
  customerId?: string;
  estimate: CheckoutEstimate | null;
  shippingAddress: SurfaceAddress | null;
  shippingMethod: string;
  selectedRail: string;
  placing: boolean;
}) {
  const { cart } = useCommerceSurfaceStore();
  const items = cart?.items ?? [];
  const currency = cart?.currency ?? 'USD';

  return (
    <div className="cfstep">
      <h3 className="cf-step-heading">Order Review</h3>

      {/* Items */}
      <div className="cf-review-section">
        <span className="cf-review-label">Items ({items.length})</span>
        {items.map((item) => (
          <div key={item.id} className="cf-review-row">
            <span className="cf-review-item-name">{item.productId} ×{item.quantity}</span>
            <span className="cf-review-item-price">{formatMoney(item.totalPrice, currency)}</span>
          </div>
        ))}
      </div>

      {/* Shipping */}
      {shippingAddress ? (
        <div className="cf-review-section">
          <span className="cf-review-label">Ships To</span>
          <span className="cf-review-detail">
            {shippingAddress.firstName} {shippingAddress.lastName}<br />
            {shippingAddress.line1}{shippingAddress.line2 ? `, ${shippingAddress.line2}` : ''}<br />
            {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
          </span>
        </div>
      ) : null}

      {/* Payment */}
      <div className="cf-review-section">
        <span className="cf-review-label">Payment Rail</span>
        <span className="cf-review-detail" style={{ textTransform: 'capitalize' }}>{selectedRail}</span>
      </div>

      {/* Totals */}
      <div className="cf-review-totals">
        <div className="cf-total-row">
          <span>Subtotal</span>
          <span>{formatMoney(cart?.subtotal ?? 0, currency)}</span>
        </div>
        {(cart?.discountTotal ?? 0) > 0 ? (
          <div className="cf-total-row" style={{ color: '#10B981' }}>
            <span>Discount</span>
            <span>-{formatMoney(cart!.discountTotal, currency)}</span>
          </div>
        ) : null}
        <div className="cf-total-row">
          <span>Tax</span>
          <span>{formatMoney(estimate?.taxTotal ?? cart?.taxTotal ?? 0, currency)}</span>
        </div>
        <div className="cf-total-row">
          <span>Shipping</span>
          <span>{formatMoney(estimate?.shippingTotal ?? cart?.shippingTotal ?? 0, currency)}</span>
        </div>
        {(estimate?.estimatedProcessingFee ?? 0) > 0 ? (
          <div className="cf-total-row" style={{ color: 'var(--text-muted)' }}>
            <span>Processing Fee</span>
            <span>{formatMoney(estimate!.estimatedProcessingFee, currency)}</span>
          </div>
        ) : null}
        {(estimate?.savingsVsDefault ?? 0) > 0 ? (
          <div className="cf-total-row" style={{ color: '#10B981' }}>
            <span>Smart Routing Savings</span>
            <span>-{formatMoney(estimate!.savingsVsDefault, currency)}</span>
          </div>
        ) : null}
        <div className="cf-divider" />
        <div className="cf-total-row cf-grand-total">
          <span>TOTAL</span>
          <span>{formatMoney(estimate?.total ?? cart?.total ?? 0, currency)}</span>
        </div>
      </div>

      <div className="cf-nav-row">
        <button className="cf-back-btn" onClick={onBack} disabled={placing}><ChevronLeft size={15} /> Back</button>
        <button className="cf-place-btn" onClick={onPlaceOrder} disabled={placing}>
          {placing ? 'Placing Order...' : 'Place Order'}
        </button>
      </div>
    </div>
  );
}

// ─── Main CheckoutFlow ───────────────────────────────────

export default function CheckoutFlow({ ventureId = 'mcv', customerId, onComplete }: CheckoutFlowProps) {
  const { cart, checkout: doCheckout } = useCommerceSurfaceStore();
  const [step, setStep] = useState<Step>(0);
  const [shippingAddress, setShippingAddress] = useState<SurfaceAddress | null>(null);
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [selectedRail, setSelectedRail] = useState('stripe');
  const [estimate, setEstimate] = useState<CheckoutEstimate | null>(null);
  const [placing, setPlacing] = useState(false);
  const [confirmation, setConfirmation] = useState<OrderConfirmation | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch estimate when cart is available
  useEffect(() => {
    if (!cart?.id) return;
    fetch(`/api/commerce-surface?action=estimate-checkout&cartId=${cart.id}`)
      .then((r) => r.json())
      .then((d) => { if (d.data) setEstimate(d.data); })
      .catch(() => null);
  }, [cart?.id]);

  function handleShippingSubmit(addr: SurfaceAddress, method: string) {
    setShippingAddress(addr);
    setShippingMethod(method);
  }

  async function handlePlaceOrder() {
    if (!cart?.id || !customerId) {
      setError('Missing cart or customer information');
      return;
    }
    setPlacing(true);
    setError(null);
    try {
      const result = await doCheckout(ventureId, cart.id, customerId, selectedMethodId ?? undefined);
      const conf = result as unknown as OrderConfirmation;
      setConfirmation(conf);
      if (onComplete) onComplete(conf);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setPlacing(false);
    }
  }

  if (confirmation) {
    return <CheckoutConfirmation confirmation={confirmation} />;
  }

  return (
    <div className="cf-root">
      <StepIndicator current={step} />

      {error ? <div className="cf-error-banner">{error}</div> : null}

      {step === 0 ? (
        <CartReviewStep ventureId={ventureId} onNext={() => setStep(1)} />
      ) : step === 1 ? (
        <ShippingStep
          onNext={() => setStep(2)}
          onBack={() => setStep(0)}
          onAddressChange={handleShippingSubmit}
        />
      ) : step === 2 ? (
        <PaymentStep
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
          onPaymentChange={(mId, rail) => { setSelectedMethodId(mId); setSelectedRail(rail); }}
          estimate={estimate}
        />
      ) : (
        <ReviewStep
          onBack={() => setStep(2)}
          onPlaceOrder={handlePlaceOrder}
          ventureId={ventureId}
          customerId={customerId}
          estimate={estimate}
          shippingAddress={shippingAddress}
          shippingMethod={shippingMethod}
          selectedRail={selectedRail}
          placing={placing}
        />
      )}

      <style>{`
        .cf-root { display: flex; flex-direction: column; max-width: 560px; margin: 0 auto; padding: 24px; }
        .cfstep { display: flex; flex-direction: column; gap: 12px; }
        .cfstep-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 40px 20px; }
        .cf-step-heading { font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin: 0; }
        .cf-items-list { display: flex; flex-direction: column; gap: 8px; }
        .cf-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          background: rgba(6, 13, 20, 0.6);
          border: 1px solid rgba(0, 245, 255, 0.08);
          border-radius: 8px;
        }
        .cf-item-img {
          width: 40px;
          height: 40px;
          background: rgba(0, 245, 255, 0.04);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .cf-item-body { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .cf-item-name { font-size: 13px; font-weight: 600; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .cf-item-variant { font-size: 11px; color: var(--text-muted); }
        .cf-item-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
        .cf-qty-row { display: flex; align-items: center; gap: 6px; }
        .cf-qty-btn {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 245, 255, 0.08);
          border: 1px solid rgba(0, 245, 255, 0.15);
          border-radius: 4px;
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 14px;
          line-height: 1;
        }
        .cf-qty-val { font-size: 13px; font-weight: 700; color: var(--text-primary); min-width: 16px; text-align: center; font-family: var(--font-mono); }
        .cf-item-price { font-size: 13px; font-weight: 700; color: var(--color-cyan); font-family: var(--font-mono); }
        .cf-discount-row { display: flex; gap: 8px; }
        .cf-input {
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
        .cf-input:focus { border-color: var(--color-cyan); }
        .cf-input::placeholder { color: var(--text-muted); }
        .cf-apply-btn {
          padding: 8px 14px;
          background: transparent;
          border: 1px solid rgba(0, 245, 255, 0.25);
          border-radius: 6px;
          color: var(--color-cyan);
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }
        .cf-apply-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .cf-err { font-size: 11px; color: #EF4444; margin: 0; }
        .cf-subtotal-row { display: flex; justify-content: space-between; font-size: 13px; color: var(--text-secondary); font-family: var(--font-mono); }
        .cf-subtotal-label { color: var(--text-muted); }
        .cf-subtotal-val { font-weight: 700; color: var(--text-primary); }
        .cf-discount-val { color: #10B981; }
        .cf-ship-methods { display: flex; flex-direction: column; gap: 6px; }
        .cf-ship-method {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: rgba(6, 13, 20, 0.6);
          border: 1px solid rgba(0, 245, 255, 0.1);
          border-radius: 8px;
          cursor: pointer;
          transition: border-color 0.15s;
        }
        .cf-ship-selected { border-color: var(--color-cyan); background: rgba(0, 245, 255, 0.05); }
        .cf-radio { accent-color: var(--color-cyan); }
        .cf-ship-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
        .cf-ship-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
        .cf-ship-desc { font-size: 11px; color: var(--text-muted); }
        .cf-ship-price { font-size: 13px; font-weight: 700; color: var(--color-cyan); font-family: var(--font-mono); flex-shrink: 0; }
        .cf-nav-row { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; }
        .cf-back-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 9px 16px;
          background: transparent;
          border: 1px solid rgba(0, 245, 255, 0.15);
          border-radius: 8px;
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: border-color 0.15s;
        }
        .cf-back-btn:hover:not(:disabled) { border-color: var(--color-cyan); color: var(--text-primary); }
        .cf-back-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .cf-next-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 10px 20px;
          background: var(--color-cyan);
          color: var(--bg-primary);
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.15s;
          width: 100%;
          justify-content: center;
        }
        .cf-nav-row .cf-next-btn { width: auto; }
        .cf-next-btn:hover:not(:disabled) { opacity: 0.85; }
        .cf-next-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .cf-place-btn {
          padding: 10px 24px;
          background: linear-gradient(135deg, var(--color-cyan), var(--color-purple));
          color: var(--bg-primary);
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          transition: opacity 0.15s;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .cf-place-btn:hover:not(:disabled) { opacity: 0.85; }
        .cf-place-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .cf-review-section { display: flex; flex-direction: column; gap: 4px; padding: 12px; background: rgba(6, 13, 20, 0.5); border: 1px solid rgba(0, 245, 255, 0.08); border-radius: 8px; }
        .cf-review-label { font-size: 10px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .cf-review-row { display: flex; justify-content: space-between; font-size: 13px; }
        .cf-review-item-name { color: var(--text-secondary); }
        .cf-review-item-price { font-family: var(--font-mono); color: var(--text-primary); font-weight: 600; }
        .cf-review-detail { font-size: 12px; color: var(--text-secondary); line-height: 1.6; }
        .cf-review-totals { display: flex; flex-direction: column; gap: 6px; }
        .cf-total-row { display: flex; justify-content: space-between; font-size: 13px; color: var(--text-secondary); font-family: var(--font-mono); }
        .cf-divider { height: 1px; background: rgba(0, 245, 255, 0.08); margin: 4px 0; }
        .cf-grand-total { font-size: 16px; font-weight: 800; color: var(--text-primary); }
        .cf-error-banner {
          padding: 10px 14px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          font-size: 12px;
          color: #EF4444;
          margin-bottom: 8px;
        }
      `}</style>
    </div>
  );
}
