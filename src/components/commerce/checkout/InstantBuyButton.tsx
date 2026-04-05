// @ts-nocheck
// src/components/commerce/checkout/InstantBuyButton.tsx
// One-click instant buy button — checks saved address/payment, fires off purchase

import { useState } from 'react';
import { Zap, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useCommerceSurfaceStore } from '../../../stores/commerce-surface';

interface InstantBuyButtonProps {
  productId: string;
  variantId?: string | null;
  quantity?: number;
  className?: string;
  ventureId?: string;
  customerId?: string;
  productName?: string;
  price?: number;
  currency?: string;
  /** Called when no saved address/payment — opens cart sidebar or settings */
  onNeedsSetup?: (productId: string) => void;
}

type BtnState = 'idle' | 'loading' | 'confirming' | 'success' | 'error';

export default function InstantBuyButton({
  productId,
  variantId = null,
  quantity = 1,
  className = '',
  ventureId = 'mcv',
  customerId,
  productName,
  price,
  currency = 'USD',
  onNeedsSetup,
}: InstantBuyButtonProps) {
  const { instantBuy } = useCommerceSurfaceStore();
  const [state, setBtnState] = useState<BtnState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmTimeout, setConfirmTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  function formatMoney(amount: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  }

  async function handleClick() {
    if (state === 'loading' || state === 'success') return;

    if (!customerId) {
      if (onNeedsSetup) onNeedsSetup(productId);
      return;
    }

    // Show brief confirmation toast
    setBtnState('confirming');
    const t = setTimeout(async () => {
      setBtnState('loading');
      try {
        await instantBuy(ventureId, productId, customerId, {
          variantId,
          quantity,
        });
        setBtnState('success');
        const resetT = setTimeout(() => setBtnState('idle'), 3000);
        setConfirmTimeout(resetT);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Purchase failed';
        if (msg.includes('No saved payment') || msg.includes('No saved shipping')) {
          setBtnState('idle');
          if (onNeedsSetup) onNeedsSetup(productId);
        } else {
          setErrorMsg(msg);
          setBtnState('error');
          const resetT = setTimeout(() => { setBtnState('idle'); setErrorMsg(null); }, 4000);
          setConfirmTimeout(resetT);
        }
      }
    }, 600);

    setConfirmTimeout(t);
  }

  function handleCancel() {
    if (confirmTimeout) clearTimeout(confirmTimeout);
    setBtnState('idle');
  }

  if (state === 'error') {
    return (
      <div className={`ib-error-wrap ${className}`}>
        <AlertCircle size={14} />
        <span className="ib-error-msg">{errorMsg ?? 'Purchase failed'}</span>
        <style>{`
          .ib-error-wrap {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 12px;
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: 8px;
            color: #EF4444;
            font-size: 12px;
          }
          .ib-error-msg { flex: 1; }
        `}</style>
      </div>
    );
  }

  if (state === 'success') {
    return (
      <button className={`ib-btn ib-success ${className}`} disabled>
        <Check size={15} />
        <span>Order Placed!</span>
        <style>{`
          .ib-btn { display: flex; align-items: center; gap: 6px; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; border: none; transition: opacity 0.15s; white-space: nowrap; }
          .ib-success { background: #10B981; color: #fff; }
        `}</style>
      </button>
    );
  }

  if (state === 'confirming') {
    const confirmText = productName && price
      ? `Buying ${productName} for ${formatMoney(price)} via smart routing...`
      : 'Confirming purchase...';
    return (
      <div className={`ib-confirming-wrap ${className}`}>
        <span className="ib-confirming-text">{confirmText}</span>
        <button className="ib-cancel-btn" onClick={handleCancel}>Cancel</button>
        <style>{`
          .ib-confirming-wrap {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 14px;
            background: rgba(0, 245, 255, 0.06);
            border: 1px solid rgba(0, 245, 255, 0.2);
            border-radius: 8px;
            font-size: 12px;
            color: var(--text-secondary);
          }
          .ib-confirming-text { flex: 1; }
          .ib-cancel-btn {
            padding: 4px 10px;
            background: transparent;
            border: 1px solid rgba(0, 245, 255, 0.2);
            border-radius: 5px;
            color: var(--text-muted);
            font-size: 11px;
            cursor: pointer;
            white-space: nowrap;
          }
          .ib-cancel-btn:hover { color: var(--text-primary); }
        `}</style>
      </div>
    );
  }

  return (
    <button
      className={`ib-btn ib-idle ${className}`}
      onClick={handleClick}
      disabled={state === 'loading'}
      aria-label={`Instant buy${productName ? ` — ${productName}` : ''}${price ? ` for ${formatMoney(price)}` : ''}`}
    >
      {state === 'loading' ? (
        <Loader2 size={15} className="ib-spinner" />
      ) : (
        <Zap size={15} />
      )}
      <span>{state === 'loading' ? 'Processing...' : 'Buy Now'}</span>
      <style>{`
        .ib-btn { display: flex; align-items: center; gap: 6px; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; border: none; transition: opacity 0.15s; white-space: nowrap; }
        .ib-idle { background: linear-gradient(135deg, var(--color-cyan), var(--color-purple)); color: var(--bg-primary); }
        .ib-idle:hover:not(:disabled) { opacity: 0.85; }
        .ib-idle:disabled { opacity: 0.5; cursor: not-allowed; }
        @keyframes ib-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .ib-spinner { animation: ib-spin 0.8s linear infinite; }
      `}</style>
    </button>
  );
}
