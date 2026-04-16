'use client';
import type { StepProps } from '../StepRenderer';
import { TRACKS } from '@mcv/onboarding-sdk';
import { getVentureBrand } from '@/lib/brand';

// Simple local lookup — the real specialist is resolved server-side on advance,
// this component just renders the expected specialist for a preview.
function expectedSpecialist(track: string, ventureId: string | null | undefined) {
  if (track === 'partner') return { handle: '@leo', name: 'Leo Drucker', title: 'Product Strategist', icon: 'L' };
  if (track === 'creator') {
    if (ventureId === 'warforge') return { handle: '@dieter',  name: 'Dieter Wren',  title: 'Creative Director',  icon: 'D' };
    return { handle: '@nico', name: 'Nico Vega', title: 'BetEdge Growth', icon: 'N' };
  }
  // investor tracks — venture-scoped
  if (ventureId === 'futurestate') return { handle: '@sterling', name: 'Hannah Sterling', title: 'Futurestate IR', icon: 'S' };
  if (ventureId === 'betedge')     return { handle: '@nico',     name: 'Nico Vega',       title: 'BetEdge Growth', icon: 'N' };
  if (ventureId === 'mcvgg')       return { handle: '@satoshi',  name: 'Satoshi Kim',     title: 'MCV.gg Tokenomics', icon: 'S' };
  return { handle: '@amara', name: 'Amara Reeves', title: 'Investor Relations Chief', icon: 'A' };
}

export default function StepAgentAssignment({ track, ventureId, loading, onAdvance }: StepProps) {
  const brand = getVentureBrand(ventureId);
  const specialist = expectedSpecialist(track, ventureId);
  const trackLabel = TRACKS[track]?.label ?? track;

  return (
    <div>
      <h1>Meet your specialist.</h1>
      <p className="lede">
        I&rsquo;m handing you to {specialist.name}. They run {trackLabel.toLowerCase()} for us
        and they&rsquo;ll take it from here.
      </p>

      <div className="wiz-card">
        <div className="wiz-card-agent">
          <div className="wiz-card-agent-avatar" style={{
            background: `linear-gradient(135deg, ${brand.brand}, ${brand.brandAccent})`,
            width: 64, height: 64, borderRadius: 32, fontSize: 24,
          }}>{specialist.icon}</div>
          <div>
            <div className="wiz-card-agent-name" style={{ fontSize: 20 }}>{specialist.name}</div>
            <div className="wiz-card-agent-title">{specialist.title} · {specialist.handle}</div>
          </div>
        </div>
        <p className="wiz-card-agent-line">
          &ldquo;Hi — {specialist.name.split(' ')[0]} here. I&rsquo;ll be your direct line into
          {' '}{brand.name}. From this point forward you&rsquo;re talking to me, not to Atlas
          — and I&rsquo;ll stay with you through the whole arc.&rdquo;
        </p>

        <div className="wiz-cta-row">
          <button
            className="wiz-btn wiz-btn-primary"
            disabled={loading}
            onClick={() => void onAdvance({ outputs: { assigned_agent: specialist.handle } })}
          >
            Great — let&rsquo;s keep going →
          </button>
        </div>
      </div>
    </div>
  );
}
