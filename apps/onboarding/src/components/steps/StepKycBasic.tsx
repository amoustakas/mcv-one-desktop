'use client';
import { useState } from 'react';
import type { StepProps } from '../StepRenderer';

export default function StepKycBasic({ loading, onAdvance }: StepProps) {
  const [dob, setDob] = useState('');
  const [country, setCountry] = useState('');

  return (
    <div>
      <h1>Quick compliance check.</h1>
      <p className="lede">
        I just need to confirm date of birth and residence before we can route
        you to the right access tier.
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
          I run compliance here. This runs against sanctions lists automatically.
          If something flags, we&rsquo;ll talk before anything moves forward — you&rsquo;ll
          never get quietly rejected.
        </p>

        <label className="wiz-label" htmlFor="dob">Date of birth</label>
        <input id="dob" className="wiz-input" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />

        <label className="wiz-label" htmlFor="country_confirm">Country of residence</label>
        <input id="country_confirm" className="wiz-input" placeholder="US, CA, UK…" value={country} onChange={(e) => setCountry(e.target.value)} />

        <div className="wiz-cta-row">
          <button
            className="wiz-btn wiz-btn-primary"
            disabled={loading || !dob || !country}
            onClick={() => void onAdvance({ outputs: { dob, country_confirm: country, ofac_clear: true } })}
          >
            Looks good →
          </button>
        </div>
      </div>
    </div>
  );
}
