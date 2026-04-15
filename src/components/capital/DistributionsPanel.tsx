// Distributions panel — list, create, process distributions for a round.
// SPEC-EQC-001 Epic 16 Story 14 — Capital × Ledger × Payments UI surface.
//
// When the engine is wired with a real LedgerAdapter + PaymentRouter
// (see api/_handlers/capital.ts), processing a distribution auto-posts
// double-entry journals and routes payouts via registered processors.
// Without those adapters, processing optimistically marks recipients paid
// (admin reconciles externally).

import { useMemo, useState } from 'react';
import { Banknote, Plus, Send, Clock, Trash2, Check, X, Sparkles } from 'lucide-react';
import { GlassCard, Badge, EmptyState, Button, FormField, Input, Select } from '../ui';
import {
  useDistributionsByRound,
  useCreateDistribution,
  useProcessDistribution,
  useCancelDistribution,
  useCommitmentsByRound,
} from '../../hooks/use-capital';
import type { DistributionType, DistributionStatus, CreateDistributionInput } from '@mcv/capital-sdk';

interface Props {
  ventureId: string;
  roundId: string;
  currency?: string;
}

interface RecipientRow {
  contactId: string;
  contactLabel: string;
  amount: number;
  paymentMethod: string;
}

const TYPE_OPTIONS: Array<{ value: DistributionType; label: string }> = [
  { value: 'dividend', label: 'Dividend' },
  { value: 'interest', label: 'Interest' },
  { value: 'yield', label: 'Yield' },
  { value: 'token_airdrop', label: 'Token airdrop' },
  { value: 'buyback', label: 'Buyback' },
  { value: 'return_of_capital', label: 'Return of capital' },
  { value: 'fee_rebate', label: 'Fee rebate' },
  { value: 'other', label: 'Other' },
];

const PAYMENT_METHODS: Array<{ value: string; label: string }> = [
  { value: 'wire_usd', label: 'Wire (USD)' },
  { value: 'crypto_usdc', label: 'USDC (Solana)' },
  { value: 'credits', label: 'Platform credits' },
  { value: 'manual', label: 'Manual / off-platform' },
];

const STATUS_COLORS: Record<DistributionStatus, string> = {
  scheduled: '#6B7280',
  processing: '#F59E0B',
  partial: '#F59E0B',
  completed: '#10B981',
  failed: '#EF4444',
  cancelled: '#6B7280',
};

function timeAgo(iso: string): string {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return 'just now';
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

function fmtMoney(amount: number, currency = 'USD') {
  return amount.toLocaleString('en-US', { style: 'currency', currency, maximumFractionDigits: 0 });
}

export default function DistributionsPanel({ ventureId, roundId, currency = 'USD' }: Props) {
  const { data: distributions = [], isLoading } = useDistributionsByRound(ventureId, roundId);
  const { data: commitments = [] } = useCommitmentsByRound(roundId);
  const create = useCreateDistribution();
  const processDist = useProcessDistribution();
  const cancel = useCancelDistribution();

  const [composing, setComposing] = useState(false);
  const [type, setType] = useState<DistributionType>('dividend');
  const [totalAmount, setTotalAmount] = useState<string>('');
  const [defaultMethod, setDefaultMethod] = useState<string>('wire_usd');
  const [scheduledFor, setScheduledFor] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [recipients, setRecipients] = useState<RecipientRow[]>([]);

  const fundedCommitments = useMemo(
    () => commitments.filter((c) => c.status === 'funded' || c.status === 'paid'),
    [commitments],
  );
  const fundedTotal = useMemo(
    () => fundedCommitments.reduce((sum, c) => sum + (c.amountUsd || 0), 0),
    [fundedCommitments],
  );
  const recipientTotal = useMemo(
    () => recipients.reduce((sum, r) => sum + (r.amount || 0), 0),
    [recipients],
  );

  function reset() {
    setComposing(false);
    setType('dividend');
    setTotalAmount('');
    setScheduledFor('');
    setNotes('');
    setRecipients([]);
  }

  function autoFillProRata() {
    const total = Number(totalAmount);
    if (!total || !fundedCommitments.length || !fundedTotal) return;
    const rows: RecipientRow[] = fundedCommitments.map((c) => ({
      contactId: c.contactId,
      contactLabel: c.contactId.slice(0, 8),
      amount: Math.round((c.amountUsd / fundedTotal) * total * 100) / 100,
      paymentMethod: defaultMethod,
    }));
    setRecipients(rows);
  }

  function addRecipient() {
    setRecipients((rs) => [...rs, { contactId: '', contactLabel: '', amount: 0, paymentMethod: defaultMethod }]);
  }

  function updateRecipient(idx: number, patch: Partial<RecipientRow>) {
    setRecipients((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  function removeRecipient(idx: number) {
    setRecipients((rs) => rs.filter((_, i) => i !== idx));
  }

  async function handleSubmit() {
    const total = Number(totalAmount);
    if (!total || !recipients.length) return;
    const validRecipients = recipients.filter((r) => r.contactId && r.amount > 0);
    if (!validRecipients.length) return;
    const input: CreateDistributionInput = {
      ventureId,
      roundId,
      distributionType: type,
      totalAmount: total,
      currency,
      scheduledFor: scheduledFor || undefined,
      notes: notes.trim() || undefined,
      recipients: validRecipients.map((r) => ({
        contactId: r.contactId,
        amount: r.amount,
        amountUsd: r.amount,
        currency,
        paymentMethod: r.paymentMethod,
      })),
    };
    try {
      await create.mutateAsync(input);
      reset();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create distribution');
    }
  }

  const commitmentOptions = useMemo(
    () => fundedCommitments.map((c) => ({
      value: c.contactId,
      label: `${c.contactId.slice(0, 8)}… · ${fmtMoney(c.amountUsd, c.currency)}`,
    })),
    [fundedCommitments],
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
          <Banknote size={14} style={{ display: 'inline', marginRight: 4 }} />
          Distributions ({distributions.length})
        </h2>
        {!composing && (
          <Button variant="ghost" icon={<Plus size={13} />} onClick={() => setComposing(true)}>
            New distribution
          </Button>
        )}
      </div>

      {composing && (
        <GlassCard style={{ padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <FormField label="Type" required>
                <Select<DistributionType>
                  value={type}
                  onChange={setType}
                  options={TYPE_OPTIONS}
                />
              </FormField>
              <FormField label={`Total (${currency})`} required>
                <Input
                  type="number"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="10000"
                  min={0}
                />
              </FormField>
              <FormField label="Default method">
                <Select
                  value={defaultMethod}
                  onChange={setDefaultMethod}
                  options={PAYMENT_METHODS}
                />
              </FormField>
            </div>

            <FormField label="Schedule (optional)" hint="Leave blank to make it ready to process now">
              <Input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
              />
            </FormField>

            <FormField label="Notes">
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Q4 dividend per board resolution 2026-03-15…" />
            </FormField>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Recipients ({recipients.length}) · sum {fmtMoney(recipientTotal, currency)}
                  {totalAmount && Math.abs(recipientTotal - Number(totalAmount)) > 0.01 && (
                    <span style={{ color: '#F59E0B', marginLeft: 8 }}>
                      ⚠ {fmtMoney(Math.abs(recipientTotal - Number(totalAmount)), currency)} off
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Button
                    variant="ghost"
                    icon={<Sparkles size={12} />}
                    onClick={autoFillProRata}
                    disabled={!totalAmount || !fundedCommitments.length}
                  >
                    Pro-rata from {fundedCommitments.length} funded
                  </Button>
                  <Button variant="ghost" icon={<Plus size={12} />} onClick={addRecipient}>
                    Add row
                  </Button>
                </div>
              </div>

              {recipients.length === 0 ? (
                <div style={{ padding: 12, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', border: '1px dashed var(--border-subtle)', borderRadius: 4 }}>
                  No recipients yet — auto-fill pro-rata or add manually.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {recipients.map((r, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 32px', gap: 6, alignItems: 'center' }}>
                      <Select
                        value={r.contactId}
                        onChange={(v) => updateRecipient(idx, { contactId: v as string, contactLabel: v as string })}
                        options={[
                          ...(r.contactId && !commitmentOptions.find((o) => o.value === r.contactId)
                            ? [{ value: r.contactId, label: `${r.contactId.slice(0, 8)}… (manual)` }]
                            : []),
                          ...commitmentOptions,
                        ]}
                        placeholder="Pick contact…"
                      />
                      <Input
                        type="number"
                        value={String(r.amount)}
                        onChange={(e) => updateRecipient(idx, { amount: Number(e.target.value) })}
                        min={0}
                      />
                      <Select
                        value={r.paymentMethod}
                        onChange={(v) => updateRecipient(idx, { paymentMethod: v as string })}
                        options={PAYMENT_METHODS}
                      />
                      <Button variant="ghost" onClick={() => removeRecipient(idx)} aria-label="Remove">
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button variant="ghost" onClick={reset}>Cancel</Button>
              <Button
                variant="primary"
                icon={<Send size={13} />}
                onClick={handleSubmit}
                disabled={!totalAmount || !recipients.length || create.isPending}
                loading={create.isPending}
              >
                Schedule distribution
              </Button>
            </div>
          </div>
        </GlassCard>
      )}

      {isLoading ? (
        <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: 12 }}>Loading distributions…</div>
      ) : !distributions.length && !composing ? (
        <EmptyState
          icon={<Banknote size={24} />}
          title="No distributions yet"
          description="Schedule a dividend, yield, or token airdrop. When processed, the engine posts journal entries and routes payouts via configured processors."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {distributions.map((d) => {
            const canProcess = d.status === 'scheduled';
            const canCancel = d.status === 'scheduled' || d.status === 'processing';
            const isProcessing = processDist.isPending && processDist.variables === d.id;
            const isCancelling = cancel.isPending && cancel.variables === d.id;
            return (
              <GlassCard key={d.id} style={{ padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                      {fmtMoney(d.totalAmount, d.currency)} · {d.distributionType.replace(/_/g, ' ')}
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Badge color={STATUS_COLORS[d.status]}>{d.status}</Badge>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {d.totalRecipients} recipient{d.totalRecipients === 1 ? '' : 's'} · paid {fmtMoney(d.totalPaid, d.currency)}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        <Clock size={10} style={{ display: 'inline', marginRight: 3 }} />
                        {timeAgo(d.scheduledFor ?? d.createdAt)}
                      </span>
                      {d.journalEntryId && (
                        <Badge color="#10B981">JE posted</Badge>
                      )}
                    </div>
                    {d.notes && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{d.notes}</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {canProcess && (
                      <Button
                        variant="primary"
                        icon={<Check size={12} />}
                        onClick={() => processDist.mutate(d.id)}
                        disabled={isProcessing}
                        loading={isProcessing}
                      >
                        Process
                      </Button>
                    )}
                    {canCancel && (
                      <Button
                        variant="ghost"
                        icon={<X size={12} />}
                        onClick={() => cancel.mutate(d.id)}
                        disabled={isCancelling}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
