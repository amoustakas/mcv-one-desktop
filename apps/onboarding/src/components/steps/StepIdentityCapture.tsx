'use client';
import { useState } from 'react';
import type { StepProps } from '../StepRenderer';

export default function StepIdentityCapture({ journey, loading, onStart, onAdvance }: StepProps) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('US');

  const submit = async () => {
    if (!email) return;
    if (!journey) {
      // Journey hasn't been created yet (first time through identity capture)
      // → create the journey now and seed identity into the profile.
      await onStart({ email: email.trim().toLowerCase(), full_name: fullName.trim() || undefined, country });
    } else {
      // Journey already exists (resumed or subsequent identity edit) → just advance.
      await onAdvance({ outputs: { email, full_name: fullName, country } });
    }
  };

  return (
    <div>
      <h1>Let&rsquo;s get your details.</h1>
      <p className="lede">
        Just the basics for now. We&rsquo;ll capture the rest as we go —
        nothing here commits you to anything.
      </p>

      <div className="wiz-card">
        <label className="wiz-label" htmlFor="email">Email</label>
        <input
          id="email"
          className="wiz-input"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label className="wiz-label" htmlFor="full_name">Full name</label>
        <input
          id="full_name"
          className="wiz-input"
          placeholder="Your name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

        <label className="wiz-label" htmlFor="country">Country of residence</label>
        <select id="country" className="wiz-input" value={country} onChange={(e) => setCountry(e.target.value)}>
          <option value="US">United States</option>
          <option value="CA">Canada</option>
          <option value="GB">United Kingdom</option>
          <option value="AU">Australia</option>
          <option value="DE">Germany</option>
          <option value="FR">France</option>
          <option value="SG">Singapore</option>
          <option value="AE">United Arab Emirates</option>
          <option value="OTHER">Somewhere else</option>
        </select>

        <div className="wiz-cta-row">
          <button className="wiz-btn wiz-btn-primary" disabled={loading || !email} onClick={() => void submit()}>
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}
