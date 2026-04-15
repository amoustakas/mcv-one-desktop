// 4-step round creation wizard — Type → Terms → Timeline → Docs.
// Replaces the alert() stub in CapitalVentureView.
// SPEC-EQC-001 Epic 2 Story 6.

import { useState } from 'react';
import { Dialog, DialogActions, Button, FormField, Input, Select } from '../ui';
import { useCreateRound } from '../../hooks/use-capital';
import type {
  CreateRoundInput, RoundType, RaiseLane, RegulatoryFramework,
} from '@mcv/capital-sdk';

interface Props {
  open: boolean;
  ventureId: string;
  onClose: () => void;
  onCreated?: (roundId: string) => void;
}

const ROUND_TYPES: RoundType[] = [
  'safe', 'convertible_note', 'priced_equity',
  'token_sale', 'token_presale', 'rwa_tranche',
  'hybrid_equity_token', 'crowdfund_reg_cf', 'crowdfund_reg_d',
  'crowdfund_mi_45', 'revenue_share',
];
const LANES: RaiseLane[] = ['equity', 'token', 'hybrid'];
const FRAMEWORKS: RegulatoryFramework[] = [
  'reg_d_506c', 'reg_d_506b', 'reg_cf', 'reg_a', 'reg_s',
  'mi_45_110', 'mi_45_106', 'token_utility', 'token_security', 'exempt', 'other',
];

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100);
}

type Step = 1 | 2 | 3 | 4;

export default function RoundCreationWizard({ open, ventureId, onClose, onCreated }: Props) {
  const [step, setStep] = useState<Step>(1);

  // Step 1
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [roundType, setRoundType] = useState<RoundType>('safe');
  const [raiseLane, setRaiseLane] = useState<RaiseLane>('equity');
  const [description, setDescription] = useState('');

  // Step 2
  const [targetRaise, setTargetRaise] = useState<string>('');
  const [minimumCheck, setMinimumCheck] = useState<string>('');
  const [maximumCheck, setMaximumCheck] = useState<string>('');
  const [preMoneyValuation, setPreMoneyValuation] = useState<string>('');
  const [valuationCap, setValuationCap] = useState<string>('');
  const [discountRate, setDiscountRate] = useState<string>('');
  const [currency, setCurrency] = useState('USD');

  // Step 3
  const [openDate, setOpenDate] = useState('');
  const [closeDate, setCloseDate] = useState('');
  const [fundingDeadline, setFundingDeadline] = useState('');
  const [regulatoryFramework, setRegulatoryFramework] = useState<RegulatoryFramework | ''>('');
  const [accreditedOnly, setAccreditedOnly] = useState(false);

  // Step 4
  const [termSheetUrl, setTermSheetUrl] = useState('');
  const [safeTemplateUrl, setSafeTemplateUrl] = useState('');
  const [subscriptionAgreementUrl, setSubscriptionAgreementUrl] = useState('');
  const [pitchDeckUrl, setPitchDeckUrl] = useState('');
  const [dataRoomUrl, setDataRoomUrl] = useState('');

  const createRound = useCreateRound();

  function reset() {
    setStep(1); setName(''); setSlug(''); setRoundType('safe'); setRaiseLane('equity'); setDescription('');
    setTargetRaise(''); setMinimumCheck(''); setMaximumCheck(''); setPreMoneyValuation(''); setValuationCap(''); setDiscountRate(''); setCurrency('USD');
    setOpenDate(''); setCloseDate(''); setFundingDeadline(''); setRegulatoryFramework(''); setAccreditedOnly(false);
    setTermSheetUrl(''); setSafeTemplateUrl(''); setSubscriptionAgreementUrl(''); setPitchDeckUrl(''); setDataRoomUrl('');
  }

  function handleClose() { reset(); onClose(); }

  async function handleSubmit() {
    const input: CreateRoundInput = {
      ventureId,
      name: name.trim(),
      slug: slug.trim() || slugify(name),
      description: description || null,
      roundType,
      raiseLane,
      targetRaise: Number(targetRaise),
      minimumCheck: minimumCheck ? Number(minimumCheck) : 0,
      maximumCheck: maximumCheck ? Number(maximumCheck) : null,
      preMoneyValuation: preMoneyValuation ? Number(preMoneyValuation) : null,
      valuationCap: valuationCap ? Number(valuationCap) : null,
      discountRate: discountRate ? Number(discountRate) : null,
      currency,
      openDate: openDate || null,
      closeDate: closeDate || null,
      fundingDeadline: fundingDeadline || null,
      regulatoryFramework: regulatoryFramework || null,
      accreditedOnly,
      jurisdictionRestrictions: [],
      termSheetUrl: termSheetUrl || null,
      safeTemplateUrl: safeTemplateUrl || null,
      subscriptionAgreementUrl: subscriptionAgreementUrl || null,
      pitchDeckUrl: pitchDeckUrl || null,
      dataRoomUrl: dataRoomUrl || null,
      isPublic: false,
      tags: [],
      metadata: {},
    };

    try {
      const round = await createRound.mutateAsync(input);
      onCreated?.(round.id);
      handleClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create round');
    }
  }

  // Validation per step
  const step1Valid = name.trim().length > 0 && roundType;
  const step2Valid = Number(targetRaise) > 0;
  const step3Valid = true; // all optional
  const canSubmit = step1Valid && step2Valid && !createRound.isPending;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={`New Round · ${ventureId.toUpperCase()}`}
      description={`Step ${step} of 4 — ${['Type', 'Terms', 'Timeline', 'Docs'][step - 1]}`}
      size="lg"
      footer={
        <DialogActions align="between">
          <Button variant="ghost" onClick={handleClose}>Cancel</Button>
          <div style={{ display: 'flex', gap: 8 }}>
            {step > 1 && <Button variant="ghost" onClick={() => setStep((s) => (s - 1) as Step)}>Back</Button>}
            {step < 4 ? (
              <Button
                variant="primary"
                onClick={() => setStep((s) => (s + 1) as Step)}
                disabled={(step === 1 && !step1Valid) || (step === 2 && !step2Valid)}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={!canSubmit}
                loading={createRound.isPending}
              >
                Create round
              </Button>
            )}
          </div>
        </DialogActions>
      }
    >
      {/* Step 1 — Type */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FormField label="Round name" required>
            <Input
              placeholder="e.g. Seed Round"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slug || slug === slugify(name)) setSlug(slugify(e.target.value));
              }}
              autoFocus
            />
          </FormField>
          <FormField label="Slug (URL)" hint="Used in /p/:venture/:slug — lowercase, hyphens only">
            <Input placeholder="seed-round" value={slug} onChange={(e) => setSlug(slugify(e.target.value))} />
          </FormField>
          <FormField label="Round type" required>
            <Select<RoundType>
              value={roundType}
              onChange={setRoundType}
              options={ROUND_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, ' ') }))}
            />
          </FormField>
          <FormField label="Raise lane" required hint="Pure equity, pure token, or hybrid (equity + token warrant)">
            <Select<RaiseLane>
              value={raiseLane}
              onChange={setRaiseLane}
              options={LANES.map((l) => ({ value: l, label: l }))}
            />
          </FormField>
          <FormField label="Description">
            <Input
              placeholder="One-line pitch shown on the public raise page"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </FormField>
        </div>
      )}

      {/* Step 2 — Terms */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FormField label="Target raise" required>
            <Input type="number" placeholder="1000000" value={targetRaise} onChange={(e) => setTargetRaise(e.target.value)} />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Minimum check">
              <Input type="number" placeholder="10000" value={minimumCheck} onChange={(e) => setMinimumCheck(e.target.value)} />
            </FormField>
            <FormField label="Maximum check">
              <Input type="number" placeholder="250000" value={maximumCheck} onChange={(e) => setMaximumCheck(e.target.value)} />
            </FormField>
          </div>
          <FormField label="Currency">
            <Select<string>
              value={currency}
              onChange={setCurrency}
              options={[
                { value: 'USD', label: 'USD' },
                { value: 'CAD', label: 'CAD' },
                { value: 'EUR', label: 'EUR' },
                { value: 'GBP', label: 'GBP' },
                { value: 'USDC', label: 'USDC' },
              ]}
            />
          </FormField>
          {(roundType === 'priced_equity' || raiseLane === 'equity') && (
            <FormField label="Pre-money valuation">
              <Input type="number" placeholder="10000000" value={preMoneyValuation} onChange={(e) => setPreMoneyValuation(e.target.value)} />
            </FormField>
          )}
          {(roundType === 'safe' || roundType === 'convertible_note') && (
            <>
              <FormField label="Valuation cap">
                <Input type="number" placeholder="15000000" value={valuationCap} onChange={(e) => setValuationCap(e.target.value)} />
              </FormField>
              <FormField label="Discount (%)">
                <Input type="number" placeholder="20" value={discountRate} onChange={(e) => setDiscountRate(e.target.value)} />
              </FormField>
            </>
          )}
        </div>
      )}

      {/* Step 3 — Timeline + Compliance */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Open date"><Input type="date" value={openDate} onChange={(e) => setOpenDate(e.target.value)} /></FormField>
            <FormField label="Close date"><Input type="date" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} /></FormField>
          </div>
          <FormField label="Funding deadline">
            <Input type="date" value={fundingDeadline} onChange={(e) => setFundingDeadline(e.target.value)} />
          </FormField>
          <FormField label="Regulatory framework" hint="SEC / CSA / other path this raise runs on">
            <Select<string>
              value={regulatoryFramework}
              onChange={(v) => setRegulatoryFramework(v as RegulatoryFramework | '')}
              options={[
                { value: '', label: '(none / exempt)' },
                ...FRAMEWORKS.map((f) => ({ value: f as string, label: f.replace(/_/g, ' ') })),
              ]}
            />
          </FormField>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={accreditedOnly} onChange={(e) => setAccreditedOnly(e.target.checked)} style={{ accentColor: 'var(--cyan)' }} />
            <span style={{ fontSize: 13 }}>Accredited investors only</span>
          </label>
        </div>
      )}

      {/* Step 4 — Docs */}
      {step === 4 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: 12, background: 'var(--bg-elevated)', borderRadius: 6 }}>
            All document URLs are optional. You can add or update them anytime from the round detail page.
          </div>
          <FormField label="Term sheet URL">
            <Input placeholder="https://..." value={termSheetUrl} onChange={(e) => setTermSheetUrl(e.target.value)} />
          </FormField>
          {(roundType === 'safe' || roundType === 'convertible_note') && (
            <FormField label="SAFE / note template URL">
              <Input placeholder="https://..." value={safeTemplateUrl} onChange={(e) => setSafeTemplateUrl(e.target.value)} />
            </FormField>
          )}
          <FormField label="Subscription agreement URL">
            <Input placeholder="https://..." value={subscriptionAgreementUrl} onChange={(e) => setSubscriptionAgreementUrl(e.target.value)} />
          </FormField>
          <FormField label="Pitch deck URL">
            <Input placeholder="https://..." value={pitchDeckUrl} onChange={(e) => setPitchDeckUrl(e.target.value)} />
          </FormField>
          <FormField label="Data room URL">
            <Input placeholder="https://..." value={dataRoomUrl} onChange={(e) => setDataRoomUrl(e.target.value)} />
          </FormField>
        </div>
      )}
    </Dialog>
  );
}
