'use client';
import { useState } from 'react';
import type { StepProps } from '../StepRenderer';
import { getVentureBrand } from '@/lib/brand';

export default function StepIntro({ journey, ventureId, loading, onAdvance }: StepProps) {
  const brand = getVentureBrand(ventureId);
  const [continuing, setContinuing] = useState(false);

  // If journey already exists, this means we've already started — just show a
  // resume card and advance when user confirms.
  if (journey) {
    return (
      <div>
        <h1>Welcome back.</h1>
        <p className="lede">You&rsquo;re on step {journey.current_step_index + 1} of {journey.steps.length}. Let&rsquo;s keep going.</p>
        <div className="wiz-cta-row">
          <button className="wiz-btn wiz-btn-primary" disabled={loading || continuing} onClick={async () => {
            setContinuing(true);
            await onAdvance();
          }}>
            Continue →
          </button>
        </div>
      </div>
    );
  }

  // Fresh journey — Atlas opens the conversation.
  return (
    <div>
      <h1>Hi — I&rsquo;m Atlas.</h1>
      <p className="lede">
        I&rsquo;m Tony&rsquo;s Chief of Staff. Before we go deep, I want to
        understand what brought you to {brand.name} so I can hand you to the
        right specialist on our team.
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
          This takes about five minutes. I&rsquo;ll ask a few questions,
          then introduce you to whoever on our team is the best match.
          You can ping me any time — I&rsquo;m in the chat column on your right.
        </p>
        <div className="wiz-cta-row">
          <button className="wiz-btn wiz-btn-primary" disabled={loading} onClick={() => void onAdvance()}>
            Let&rsquo;s go →
          </button>
        </div>
      </div>
    </div>
  );
}
