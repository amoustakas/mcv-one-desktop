'use client';
import { useState } from 'react';
import type { StepProps } from '../StepRenderer';
import { listVentureBrands } from '@/lib/brand';

export default function StepVentureSelection({ loading, onAdvance }: StepProps) {
  const brands = listVentureBrands();
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  return (
    <div>
      <h1>Which ventures do you want to engage with?</h1>
      <p className="lede">
        Pick anywhere from one to all. I&rsquo;ll tailor the rest of the
        journey — and who on our team you&rsquo;ll meet — to what you care about.
      </p>

      <div className="wiz-card">
        <div className="wiz-card-agent">
          <div className="wiz-card-agent-avatar">A</div>
          <div>
            <div className="wiz-card-agent-name">Atlas</div>
            <div className="wiz-card-agent-title">Chief of Staff · @atlas</div>
          </div>
        </div>
        <p className="wiz-card-agent-line">
          Each venture has its own specialist — Hannah Sterling runs Futurestate
          IR, Nico runs BetEdge, Dieter runs WarForge creative. Selecting tells
          me who to introduce you to.
        </p>
      </div>

      <div className="wiz-venture-grid">
        {brands.map((b) => {
          const active = selected.includes(b.id);
          return (
            <button
              key={b.id}
              className={`wiz-venture-tile ${active ? 'selected' : ''}`}
              onClick={() => toggle(b.id)}
              type="button"
            >
              <div className="wiz-venture-tile-icon" style={{ background: b.brand }}>{b.icon}</div>
              <div className="wiz-venture-tile-name">{b.name}</div>
              <div className="wiz-venture-tile-tag">{b.tagline}</div>
            </button>
          );
        })}
      </div>

      <div className="wiz-cta-row">
        <button
          className="wiz-btn wiz-btn-primary"
          disabled={loading || selected.length === 0}
          onClick={() => void onAdvance({ outputs: { ventures: selected } })}
        >
          Continue with {selected.length} venture{selected.length === 1 ? '' : 's'} →
        </button>
        <button className="wiz-btn wiz-btn-ghost" disabled={loading} onClick={() => void onAdvance({ status: 'skipped' })}>
          Skip for now
        </button>
      </div>
    </div>
  );
}
