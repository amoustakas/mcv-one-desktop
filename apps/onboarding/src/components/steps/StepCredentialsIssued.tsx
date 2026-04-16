'use client';
import type { StepProps } from '../StepRenderer';

export default function StepCredentialsIssued({ loading, onAdvance }: StepProps) {
  return (
    <div>
      <h1>Access coming up.</h1>
      <p className="lede">
        Portal, wallet, and verifiable credentials issue automatically
        once full KYC completes. For now they&rsquo;re provisioned manually
        on a per-deal basis.
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
          &ldquo;Auto-provisioning ships alongside the full KYC flow. Until
          then, I&rsquo;ll issue your portal access and any credentials you
          need by hand when you engage with a specific round or deal. You
          won&rsquo;t have to chase anyone.&rdquo;
        </p>
        <div className="wiz-cta-row">
          <button className="wiz-btn wiz-btn-primary" disabled={loading} onClick={() => void onAdvance({ status: 'skipped' })}>
            Understood →
          </button>
        </div>
      </div>
    </div>
  );
}
