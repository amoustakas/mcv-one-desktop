'use client';
import type { StepProps } from '../StepRenderer';

export default function StepAccreditationVerification({ loading, onAdvance }: StepProps) {
  return (
    <div>
      <h1>Accreditation.</h1>
      <p className="lede">
        If you&rsquo;re qualifying under Reg D 506(c), we verify accreditation
        through a dedicated provider and issue you a verifiable credential.
      </p>
      <div className="wiz-card">
        <div className="wiz-card-agent">
          <div className="wiz-card-agent-avatar" style={{ background: 'linear-gradient(135deg, #A78BFA, #7C3AED)' }}>A</div>
          <div>
            <div className="wiz-card-agent-name">Ada Marlowe</div>
            <div className="wiz-card-agent-title">Legal Counsel · @ada</div>
          </div>
        </div>
        <p className="wiz-card-agent-line">
          &ldquo;Accreditation verification ships alongside full KYC in the
          next cycle. Until then, any accredited-tier round you join will be
          gated manually — I&rsquo;ll personally clear you before allocation.
          Moving on for now.&rdquo;
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
