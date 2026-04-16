'use client';
import type { StepProps } from '../StepRenderer';
import { getVentureBrand } from '@/lib/brand';

export default function StepVentureDemo({ ventureId, loading, onAdvance }: StepProps) {
  const brand = getVentureBrand(ventureId);
  return (
    <div>
      <h1>A look at {brand.name}.</h1>
      <p className="lede">
        We&rsquo;re building an interactive walkthrough you&rsquo;ll run
        alongside your specialist. For now, we&rsquo;ll send it direct.
      </p>
      <div className="wiz-card">
        <div className="wiz-card-agent">
          <div className="wiz-card-agent-avatar" style={{
            background: `linear-gradient(135deg, ${brand.brand}, ${brand.brandAccent})`,
          }}>D</div>
          <div>
            <div className="wiz-card-agent-name">Your Specialist</div>
            <div className="wiz-card-agent-title">{brand.name} handoff</div>
          </div>
        </div>
        <p className="wiz-card-agent-line">
          &ldquo;The interactive demo experience is queued for the next
          session. In the meantime, I&rsquo;ll send you a short walkthrough
          directly — video + context on what we&rsquo;re building — so you
          see the real thing, not a marketing pitch.&rdquo;
        </p>
        <div className="wiz-cta-row">
          <button className="wiz-btn wiz-btn-primary" disabled={loading} onClick={() => void onAdvance({ status: 'skipped' })}>
            Send it my way →
          </button>
        </div>
      </div>
    </div>
  );
}
