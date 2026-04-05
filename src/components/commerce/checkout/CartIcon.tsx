// @ts-nocheck
// src/components/commerce/checkout/CartIcon.tsx
// Cart icon for header/nav with animated badge

import { useEffect, useRef, useState } from 'react';
import { ShoppingBag } from 'lucide-react';

interface CartIconProps {
  onClick: () => void;
  itemCount: number;
  className?: string;
}

export default function CartIcon({ onClick, itemCount, className = '' }: CartIconProps) {
  const prevCount = useRef(itemCount);
  const [bumping, setBumping] = useState(false);

  useEffect(() => {
    if (itemCount > prevCount.current) {
      setBumping(true);
      const t = setTimeout(() => setBumping(false), 400);
      prevCount.current = itemCount;
      return () => clearTimeout(t);
    }
    prevCount.current = itemCount;
  }, [itemCount]);

  return (
    <button className={`cart-icon-btn ${className}`} onClick={onClick} aria-label={`Cart — ${itemCount} item${itemCount === 1 ? '' : 's'}`}>
      <ShoppingBag size={20} />
      {itemCount > 0 ? (
        <span className={`cart-badge ${bumping ? 'cart-badge-bump' : ''}`}>
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      ) : null}
      <style>{`
        .cart-icon-btn {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: transparent;
          border: 1px solid rgba(0, 245, 255, 0.15);
          border-radius: 8px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s, background 0.15s;
        }
        .cart-icon-btn:hover {
          border-color: var(--color-cyan);
          color: var(--color-cyan);
          background: rgba(0, 245, 255, 0.06);
        }
        .cart-badge {
          position: absolute;
          top: -6px;
          right: -6px;
          min-width: 16px;
          height: 16px;
          padding: 0 4px;
          background: var(--color-cyan);
          color: var(--bg-primary);
          border-radius: 8px;
          font-size: 9px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.15s;
        }
        @keyframes badge-bump {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.5); }
          70%  { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
        .cart-badge-bump { animation: badge-bump 0.4s ease; }
      `}</style>
    </button>
  );
}
