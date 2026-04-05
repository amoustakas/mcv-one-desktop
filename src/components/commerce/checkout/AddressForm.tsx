// @ts-nocheck
// src/components/commerce/checkout/AddressForm.tsx
// Reusable address form — shipping and billing

import { useState, useEffect } from 'react';
import type { SurfaceAddress } from '../../../lib/commerce/surface-types';

interface AddressFormProps {
  onSubmit: (address: SurfaceAddress) => void;
  defaultValues?: Partial<SurfaceAddress>;
  savedAddresses?: SurfaceAddress[];
  submitLabel?: string;
  showSubmitButton?: boolean;
}

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'JP', name: 'Japan' },
  { code: 'SG', name: 'Singapore' },
  { code: 'AE', name: 'United Arab Emirates' },
];

const EMPTY: SurfaceAddress = {
  firstName: '',
  lastName: '',
  company: null,
  line1: '',
  line2: null,
  city: '',
  state: '',
  postalCode: '',
  country: 'US',
  phone: null,
};

export default function AddressForm({
  onSubmit,
  defaultValues,
  savedAddresses = [],
  submitLabel = 'Save Address',
  showSubmitButton = true,
}: AddressFormProps) {
  const [form, setForm] = useState<SurfaceAddress>({ ...EMPTY, ...defaultValues });
  const [errors, setErrors] = useState<Partial<Record<keyof SurfaceAddress, string>>>({});
  const [selectedSaved, setSelectedSaved] = useState<string>('new');

  useEffect(() => {
    if (defaultValues) setForm((f) => ({ ...f, ...defaultValues }));
  }, [defaultValues]);

  function handleSavedSelect(idx: string) {
    setSelectedSaved(idx);
    if (idx === 'new') {
      setForm({ ...EMPTY });
    } else {
      const addr = savedAddresses[Number(idx)];
      if (addr) setForm({ ...addr });
    }
  }

  function set(field: keyof SurfaceAddress, value: string) {
    setForm((f) => ({ ...f, [field]: value || null }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof SurfaceAddress, string>> = {};
    if (!form.firstName) errs.firstName = 'Required';
    if (!form.lastName) errs.lastName = 'Required';
    if (!form.line1) errs.line1 = 'Required';
    if (!form.city) errs.city = 'Required';
    if (!form.state) errs.state = 'Required';
    if (!form.postalCode) errs.postalCode = 'Required';
    if (!form.country) errs.country = 'Required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="af-form">
      {savedAddresses.length > 0 && (
        <div className="af-saved-row">
          <label className="af-label">Use saved address</label>
          <select
            className="af-input af-select"
            value={selectedSaved}
            onChange={(e) => handleSavedSelect(e.target.value)}
          >
            <option value="new">+ Enter new address</option>
            {savedAddresses.map((a, i) => (
              <option key={i} value={String(i)}>
                {a.firstName} {a.lastName} — {a.line1}, {a.city}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="af-row">
        <div className="af-field">
          <label className="af-label">First Name *</label>
          <input className={`af-input ${errors.firstName ? 'af-error' : ''}`} value={form.firstName} onChange={(e) => set('firstName', e.target.value)} placeholder="First name" />
          {errors.firstName && <span className="af-err-msg">{errors.firstName}</span>}
        </div>
        <div className="af-field">
          <label className="af-label">Last Name *</label>
          <input className={`af-input ${errors.lastName ? 'af-error' : ''}`} value={form.lastName} onChange={(e) => set('lastName', e.target.value)} placeholder="Last name" />
          {errors.lastName && <span className="af-err-msg">{errors.lastName}</span>}
        </div>
      </div>

      <div className="af-field">
        <label className="af-label">Company <span className="af-optional">(optional)</span></label>
        <input className="af-input" value={form.company ?? ''} onChange={(e) => set('company', e.target.value)} placeholder="Company name" />
      </div>

      <div className="af-field">
        <label className="af-label">Address Line 1 *</label>
        <input className={`af-input ${errors.line1 ? 'af-error' : ''}`} value={form.line1} onChange={(e) => set('line1', e.target.value)} placeholder="Street address" />
        {errors.line1 && <span className="af-err-msg">{errors.line1}</span>}
      </div>

      <div className="af-field">
        <label className="af-label">Address Line 2 <span className="af-optional">(optional)</span></label>
        <input className="af-input" value={form.line2 ?? ''} onChange={(e) => set('line2', e.target.value)} placeholder="Apt, suite, floor..." />
      </div>

      <div className="af-row">
        <div className="af-field">
          <label className="af-label">City *</label>
          <input className={`af-input ${errors.city ? 'af-error' : ''}`} value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="City" />
          {errors.city && <span className="af-err-msg">{errors.city}</span>}
        </div>
        <div className="af-field">
          <label className="af-label">State / Province *</label>
          <input className={`af-input ${errors.state ? 'af-error' : ''}`} value={form.state} onChange={(e) => set('state', e.target.value)} placeholder="State" />
          {errors.state && <span className="af-err-msg">{errors.state}</span>}
        </div>
      </div>

      <div className="af-row">
        <div className="af-field">
          <label className="af-label">Postal Code *</label>
          <input className={`af-input ${errors.postalCode ? 'af-error' : ''}`} value={form.postalCode} onChange={(e) => set('postalCode', e.target.value)} placeholder="Postal code" />
          {errors.postalCode && <span className="af-err-msg">{errors.postalCode}</span>}
        </div>
        <div className="af-field">
          <label className="af-label">Country *</label>
          <select className={`af-input af-select ${errors.country ? 'af-error' : ''}`} value={form.country} onChange={(e) => set('country', e.target.value)}>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
          {errors.country && <span className="af-err-msg">{errors.country}</span>}
        </div>
      </div>

      <div className="af-field">
        <label className="af-label">Phone <span className="af-optional">(optional)</span></label>
        <input className="af-input" value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} placeholder="+1 (555) 000-0000" type="tel" />
      </div>

      {showSubmitButton && (
        <button type="submit" className="af-submit-btn">{submitLabel}</button>
      )}

      <style>{`
        .af-form { display: flex; flex-direction: column; gap: 12px; }
        .af-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .af-field { display: flex; flex-direction: column; gap: 4px; }
        .af-saved-row { display: flex; flex-direction: column; gap: 4px; margin-bottom: 4px; }
        .af-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .af-optional { font-weight: 400; text-transform: none; color: var(--text-muted); font-size: 10px; }
        .af-input {
          background: rgba(6, 13, 20, 0.7);
          border: 1px solid rgba(0, 245, 255, 0.15);
          border-radius: 6px;
          padding: 8px 10px;
          color: var(--text-primary);
          font-size: 13px;
          outline: none;
          transition: border-color 0.15s;
          width: 100%;
          box-sizing: border-box;
        }
        .af-input:focus { border-color: var(--color-cyan); }
        .af-input::placeholder { color: var(--text-muted); }
        .af-select { appearance: none; cursor: pointer; }
        .af-error { border-color: #EF4444 !important; }
        .af-err-msg { font-size: 10px; color: #EF4444; }
        .af-submit-btn {
          margin-top: 8px;
          background: var(--color-cyan);
          color: var(--bg-primary);
          border: none;
          border-radius: 8px;
          padding: 10px 20px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .af-submit-btn:hover { opacity: 0.85; }
        @media (max-width: 500px) { .af-row { grid-template-columns: 1fr; } }
      `}</style>
    </form>
  );
}
