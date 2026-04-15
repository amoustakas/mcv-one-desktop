// @mcv/capital-sdk/tax-export — generates 1099-DIV (US) and T5 (CA) compatible
// CSV exports from processed distributions for a given tax year.
//
// Joins capital_distributions + capital_distribution_recipients + crm_contacts
// to produce one row per (recipient, distribution_type) aggregated for the year.
// Only `paid` recipient rows are counted. Tax authority box mappings:
//
//   1099-DIV:
//     Box 1a (Total ordinary dividends) ← dividend + interest + yield + fee_rebate
//     Box 1b (Qualified dividends)      ← dividend (subset, marked qualified)
//     Box 3  (Nondividend distributions) ← return_of_capital
//     Box 4  (Federal income tax withheld) ← sum(tax_withheld) for the contact
//
//   T5 (CRA):
//     Box 24 (Actual amount of eligible dividends)   ← dividend
//     Box 13 (Interest from Canadian sources)        ← interest
//     Box 16 (Income tax deducted)                   ← sum(tax_withheld)
//
// Pure compute over Supabase reads — no external API calls. Returns CSV
// string + structured rows (callers can render either as needed).

import type { SupabaseClient } from '@supabase/supabase-js';
import type { DistributionType } from './distributions-service';

export type TaxForm = '1099-DIV' | 'T5';

export interface TaxExportRow {
  contactId: string;
  contactName: string;
  contactEmail: string | null;
  contactCountry: string | null;
  totalDividend: number;
  totalInterest: number;
  totalYield: number;
  totalReturnOfCapital: number;
  totalFeeRebate: number;
  totalOther: number;
  totalTaxWithheld: number;
  paymentCount: number;
}

export interface TaxExportResult {
  form: TaxForm;
  ventureId: string;
  taxYear: number;
  generatedAt: string;
  rowCount: number;
  rows: TaxExportRow[];
  csv: string;
}

interface RecipientJoinRow {
  amount_usd: number | null;
  status: string;
  paid_at: string | null;
  tax_withheld: number | null;
  contact_id: string;
  capital_distributions: { distribution_type: string; status: string; ventureId?: string; venture_id?: string } | null;
  crm_contacts: { name: string | null; email: string | null; country: string | null } | null;
}

const ZERO_BUCKET: Omit<TaxExportRow, 'contactId' | 'contactName' | 'contactEmail' | 'contactCountry'> = {
  totalDividend: 0,
  totalInterest: 0,
  totalYield: 0,
  totalReturnOfCapital: 0,
  totalFeeRebate: 0,
  totalOther: 0,
  totalTaxWithheld: 0,
  paymentCount: 0,
};

function bucketKey(t: DistributionType | string): keyof typeof ZERO_BUCKET | null {
  switch (t) {
    case 'dividend': return 'totalDividend';
    case 'interest': return 'totalInterest';
    case 'yield': return 'totalYield';
    case 'return_of_capital': return 'totalReturnOfCapital';
    case 'fee_rebate': return 'totalFeeRebate';
    case 'token_airdrop':
    case 'buyback':
    case 'other':
      return 'totalOther';
    default:
      return null;
  }
}

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function rowsToCsv(form: TaxForm, rows: TaxExportRow[]): string {
  if (form === '1099-DIV') {
    const headers = [
      'recipient_contact_id', 'recipient_name', 'recipient_email', 'recipient_country',
      'box_1a_ordinary_dividends', 'box_1b_qualified_dividends',
      'box_3_nondividend_distributions', 'box_4_federal_tax_withheld',
      'box_5_section_199a_dividends', 'payment_count',
    ];
    const lines = [headers.join(',')];
    for (const r of rows) {
      const ordinary = r.totalDividend + r.totalInterest + r.totalYield + r.totalFeeRebate;
      lines.push([
        r.contactId, r.contactName, r.contactEmail ?? '', r.contactCountry ?? '',
        ordinary.toFixed(2),
        r.totalDividend.toFixed(2), // qualified dividend assumption: all dividend payouts are qualified
        r.totalReturnOfCapital.toFixed(2),
        r.totalTaxWithheld.toFixed(2),
        '0.00', // section 199A — not yet tracked
        String(r.paymentCount),
      ].map(csvEscape).join(','));
    }
    return lines.join('\n');
  }
  // T5
  const headers = [
    'recipient_contact_id', 'recipient_name', 'recipient_email', 'recipient_country',
    'box_13_canadian_interest', 'box_24_eligible_dividends_actual',
    'box_25_eligible_dividends_taxable', 'box_26_federal_dividend_tax_credit',
    'box_16_income_tax_deducted', 'payment_count',
  ];
  const GROSS_UP = 1.38;     // CRA eligible dividend gross-up factor (2026)
  const DTC_RATE = 0.150198; // approx federal DTC for eligible dividends (2026)
  const lines = [headers.join(',')];
  for (const r of rows) {
    const grossed = r.totalDividend * GROSS_UP;
    const dtc = grossed * DTC_RATE;
    lines.push([
      r.contactId, r.contactName, r.contactEmail ?? '', r.contactCountry ?? '',
      r.totalInterest.toFixed(2),
      r.totalDividend.toFixed(2),
      grossed.toFixed(2),
      dtc.toFixed(2),
      r.totalTaxWithheld.toFixed(2),
      String(r.paymentCount),
    ].map(csvEscape).join(','));
  }
  return lines.join('\n');
}

export interface ExportTaxFormInput {
  form: TaxForm;
  ventureId: string;
  taxYear: number;
}

export interface TaxExportService {
  exportTaxForm(input: ExportTaxFormInput): Promise<TaxExportResult>;
}

export function createTaxExportService({ supabase }: { supabase: SupabaseClient | null }): TaxExportService {
  return {
    async exportTaxForm({ form, ventureId, taxYear }) {
      const generatedAt = new Date().toISOString();
      if (!supabase) {
        return { form, ventureId, taxYear, generatedAt, rowCount: 0, rows: [], csv: rowsToCsv(form, []) };
      }

      const yearStart = `${taxYear}-01-01T00:00:00Z`;
      const yearEnd = `${taxYear + 1}-01-01T00:00:00Z`;

      // Pull paid recipients in tax year for the venture, joined with their
      // distribution + contact metadata.
      const { data, error } = await supabase
        .from('capital_distribution_recipients')
        .select(`
          amount_usd, status, paid_at, tax_withheld, contact_id,
          capital_distributions!inner(distribution_type, status, venture_id),
          crm_contacts(name, email, country)
        `)
        .eq('status', 'paid')
        .eq('capital_distributions.venture_id', ventureId)
        .gte('paid_at', yearStart)
        .lt('paid_at', yearEnd)
        .limit(10000);

      if (error) throw new Error(`tax export query failed: ${error.message}`);

      const byContact = new Map<string, TaxExportRow>();
      for (const raw of (data ?? []) as unknown as RecipientJoinRow[]) {
        if (!raw.capital_distributions) continue;
        const distType = raw.capital_distributions.distribution_type;
        const bucket = bucketKey(distType);
        if (!bucket) continue;

        const existing = byContact.get(raw.contact_id) ?? {
          contactId: raw.contact_id,
          contactName: raw.crm_contacts?.name ?? raw.contact_id.slice(0, 8),
          contactEmail: raw.crm_contacts?.email ?? null,
          contactCountry: raw.crm_contacts?.country ?? null,
          ...ZERO_BUCKET,
        };

        const amt = Number(raw.amount_usd ?? 0);
        const tax = Number(raw.tax_withheld ?? 0);
        existing[bucket] += amt;
        existing.totalTaxWithheld += tax;
        existing.paymentCount += 1;

        byContact.set(raw.contact_id, existing);
      }

      const rows = [...byContact.values()].sort((a, b) => a.contactName.localeCompare(b.contactName));
      return {
        form,
        ventureId,
        taxYear,
        generatedAt,
        rowCount: rows.length,
        rows,
        csv: rowsToCsv(form, rows),
      };
    },
  };
}
