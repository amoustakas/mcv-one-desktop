'use client';
import type { StepProps } from '../StepRenderer';

export default function StepKycFull({ loading, onAdvance }: StepProps) {
  return (
    <div>
      <h1>Document verification.</h1>
      <p className="lede">
        Full KYC runs through Plaid Identity or Jumio — a few minutes, done directly with them.
      </p>
      <div className="wiz-card">
        <div className="wiz-card-agent">
          <div className="wiz-card-agent-avatar" style={{ background: 'linear-gradient(135deg, #6EE7B7, #10B981)' }}>J</div>
          <div>
            <div className="wiz-card-agent-name">Justice Okonkwo</div>
            <div className="wiz-card-agent-title">Compliance Officer · @justice</div>
          </div>
        </div>
        <p className="wiz-card-agent-line">
          &ldquo;Full-document KYC goes live in our next cycle. I&rsquo;ll
          reach out directly within a week to walk you through it — no rush on
          your end. Skipping ahead for now so the rest of onboarding can
          continue.&rdquo;
        </p>
        <div className="wiz-cta-row">
          <button className="wiz-btn wiz-btn-primary" disabled={loading} onClick={() => void onAdvance({ status: 'skipped' })}>
            Got it — skip for now →
          </button>
        </div>
      </div>
    </div>
  );
}
