// @ts-nocheck
// src/lib/compliance/tax-engine.ts
// Multi-jurisdiction Tax Engine — CA, US, EU, UK, AU
// Handles: compound taxes (QC), inclusive taxes (EU VAT), B2B reverse charge
// MCV Commerce & Financial OS — Plan 6

import { supabase } from '../supabase';
import type {
  CustomerLocation,
  TaxBreakdown,
  TaxCalculationRequest,
  TaxComponent,
  TaxJurisdiction,
  TaxType,
} from './types';

// ─────────────────────────────────────────────────────────
// JURISDICTION LOOKUP
// ─────────────────────────────────────────────────────────

export async function getJurisdictions(
  country: string,
  state?: string,
): Promise<TaxJurisdiction[]> {
  if (!supabase) return getFallbackJurisdictions(country, state);

  const query = supabase
    .from('tax_jurisdictions')
    .select('*')
    .eq('country', country.toUpperCase());

  const { data } = state
    ? await query.or(`state.eq.${state.toUpperCase()},state.is.null`)
    : await query.is('state', null);

  if (!data || data.length === 0) return getFallbackJurisdictions(country, state);

  return data.map(mapJurisdictionRow);
}

function mapJurisdictionRow(row: Record<string, unknown>): TaxJurisdiction {
  return {
    id: row.id as string,
    code: row.code as string,
    country: row.country as string,
    state: (row.state as string | null) ?? undefined,
    name: row.name as string,
    taxType: row.tax_type as TaxType,
    defaultRate: parseFloat(String(row.default_rate)),
    filingFrequency: row.filing_frequency as TaxJurisdiction['filingFrequency'],
    filingDeadlineDays: row.filing_deadline_days as number,
  };
}

// ─────────────────────────────────────────────────────────
// FALLBACK: in-memory jurisdiction table (used when Supabase is unavailable)
// ─────────────────────────────────────────────────────────

const JURISDICTION_MAP: Record<string, TaxJurisdiction[]> = {
  // Canada
  'CA':    [{ id: 'ca',    code: 'CA',    country: 'CA', name: 'Canada GST',          taxType: 'gst',   defaultRate: 0.05,    filingFrequency: 'quarterly', filingDeadlineDays: 30 }],
  'CA-ON': [{ id: 'ca',    code: 'CA',    country: 'CA', name: 'Canada GST',          taxType: 'gst',   defaultRate: 0.05,    filingFrequency: 'quarterly', filingDeadlineDays: 30 },
            { id: 'ca-on', code: 'CA-ON', country: 'CA', state: 'ON', name: 'Ontario HST', taxType: 'hst', defaultRate: 0.13, filingFrequency: 'quarterly', filingDeadlineDays: 30 }],
  'CA-BC': [{ id: 'ca',    code: 'CA',    country: 'CA', name: 'Canada GST',          taxType: 'gst',   defaultRate: 0.05,    filingFrequency: 'quarterly', filingDeadlineDays: 30 },
            { id: 'ca-bc', code: 'CA-BC', country: 'CA', state: 'BC', name: 'BC PST',       taxType: 'pst', defaultRate: 0.07, filingFrequency: 'quarterly', filingDeadlineDays: 30 }],
  'CA-QC': [{ id: 'ca',    code: 'CA',    country: 'CA', name: 'Canada GST',          taxType: 'gst',   defaultRate: 0.05,    filingFrequency: 'quarterly', filingDeadlineDays: 30 },
            { id: 'ca-qc', code: 'CA-QC', country: 'CA', state: 'QC', name: 'Quebec QST',   taxType: 'qst', defaultRate: 0.09975, filingFrequency: 'quarterly', filingDeadlineDays: 30 }],
  // US
  'US-CA': [{ id: 'us-ca', code: 'US-CA', country: 'US', state: 'CA', name: 'California Sales Tax', taxType: 'sales', defaultRate: 0.0725, filingFrequency: 'quarterly', filingDeadlineDays: 30 }],
  'US-NY': [{ id: 'us-ny', code: 'US-NY', country: 'US', state: 'NY', name: 'New York Sales Tax',   taxType: 'sales', defaultRate: 0.08,   filingFrequency: 'quarterly', filingDeadlineDays: 20 }],
  'US-TX': [{ id: 'us-tx', code: 'US-TX', country: 'US', state: 'TX', name: 'Texas Sales Tax',      taxType: 'sales', defaultRate: 0.0625, filingFrequency: 'quarterly', filingDeadlineDays: 20 }],
  'US-FL': [{ id: 'us-fl', code: 'US-FL', country: 'US', state: 'FL', name: 'Florida Sales Tax',    taxType: 'sales', defaultRate: 0.06,   filingFrequency: 'quarterly', filingDeadlineDays: 30 }],
  'US-WA': [{ id: 'us-wa', code: 'US-WA', country: 'US', state: 'WA', name: 'Washington Sales Tax', taxType: 'sales', defaultRate: 0.065,  filingFrequency: 'monthly',   filingDeadlineDays: 25 }],
  // EU
  'DE': [{ id: 'eu-de', code: 'EU-DE', country: 'DE', name: 'Germany VAT',     taxType: 'vat', defaultRate: 0.19, filingFrequency: 'quarterly', filingDeadlineDays: 30 }],
  'FR': [{ id: 'eu-fr', code: 'EU-FR', country: 'FR', name: 'France VAT',      taxType: 'vat', defaultRate: 0.20, filingFrequency: 'quarterly', filingDeadlineDays: 30 }],
  'NL': [{ id: 'eu-nl', code: 'EU-NL', country: 'NL', name: 'Netherlands VAT', taxType: 'vat', defaultRate: 0.21, filingFrequency: 'quarterly', filingDeadlineDays: 30 }],
  'GB': [{ id: 'gb',    code: 'GB',    country: 'GB', name: 'UK VAT',          taxType: 'vat', defaultRate: 0.20, filingFrequency: 'quarterly', filingDeadlineDays: 30 }],
  'AU': [{ id: 'au',    code: 'AU',    country: 'AU', name: 'Australia GST',   taxType: 'gst', defaultRate: 0.10, filingFrequency: 'quarterly', filingDeadlineDays: 28 }],
};

const EU_COUNTRIES = new Set(['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE']);

function getFallbackJurisdictions(country: string, state?: string): TaxJurisdiction[] {
  const key = state ? `${country.toUpperCase()}-${state.toUpperCase()}` : country.toUpperCase();
  return JURISDICTION_MAP[key] ?? JURISDICTION_MAP[country.toUpperCase()] ?? [];
}

// ─────────────────────────────────────────────────────────
// RATE LOOKUP
// ─────────────────────────────────────────────────────────

function getEffectiveRate(
  jurisdiction: TaxJurisdiction,
  category?: string,
): number {
  // category-specific rates would come from jurisdiction.categories JSONB
  // for now, use default rate
  return jurisdiction.defaultRate;
}

// ─────────────────────────────────────────────────────────
// IS B2B REVERSE CHARGE (EU)
// When a valid VAT ID is provided for a B2B EU transaction, 0% applies
// ─────────────────────────────────────────────────────────

function isReverseCharge(
  request: TaxCalculationRequest,
  jurisdiction: TaxJurisdiction,
): boolean {
  return (
    request.isB2B &&
    !!request.customerVatId &&
    jurisdiction.taxType === 'vat' &&
    EU_COUNTRIES.has(request.customerLocation.country.toUpperCase())
  );
}

// ─────────────────────────────────────────────────────────
// CALCULATE TAX
// ─────────────────────────────────────────────────────────

export async function calculateTax(
  request: TaxCalculationRequest,
): Promise<TaxBreakdown> {
  const { customerLocation, lineItems, shippingAmount = 0, discountAmount = 0 } = request;

  // Compute subtotal from line items
  const subtotal = lineItems
    .filter((li) => !li.taxExempt)
    .reduce((sum, li) => sum + li.amount * li.quantity, 0);

  const exemptAmount = lineItems
    .filter((li) => li.taxExempt)
    .reduce((sum, li) => sum + li.amount * li.quantity, 0);

  const taxableBase = Math.max(0, subtotal + shippingAmount - discountAmount);

  if (taxableBase === 0) {
    return {
      subtotal,
      taxableAmount: 0,
      totalTax: 0,
      components: [],
      exemptAmount,
      effectiveRate: 0,
    };
  }

  // Look up applicable jurisdictions
  const jurisdictions = await getJurisdictions(
    customerLocation.country,
    customerLocation.state,
  );

  if (jurisdictions.length === 0) {
    return {
      subtotal,
      taxableAmount: taxableBase,
      totalTax: 0,
      components: [],
      exemptAmount,
      effectiveRate: 0,
    };
  }

  const components: TaxComponent[] = [];
  let runningBase = taxableBase; // for compound tax calculation
  let totalTax = 0;

  for (const jurisdiction of jurisdictions) {
    // B2B EU reverse charge — 0%
    if (isReverseCharge(request, jurisdiction)) {
      components.push({
        jurisdiction: jurisdiction.code,
        name: `${jurisdiction.name} (Reverse Charge)`,
        rate: 0,
        amount: 0,
        taxType: jurisdiction.taxType,
        compound: false,
        inclusive: false,
      });
      continue;
    }

    const rate = getEffectiveRate(jurisdiction, lineItems[0]?.category);

    // EU VAT — inclusive (price includes tax, extract from subtotal)
    const isInclusive = jurisdiction.taxType === 'vat' || jurisdiction.taxType === 'gst';

    // QST (Quebec) — compound: applied on subtotal + GST
    const isCompound = jurisdiction.taxType === 'qst';

    let taxAmount: number;

    if (isInclusive) {
      // Extract tax from inclusive price: tax = price - (price / (1 + rate))
      taxAmount = Math.round(taxableBase - taxableBase / (1 + rate));
    } else if (isCompound) {
      // QST: applies on (subtotal + GST already calculated)
      const gstComponent = components.find((c) => c.taxType === 'gst');
      const compoundBase = taxableBase + (gstComponent?.amount ?? 0);
      taxAmount = Math.round(compoundBase * rate);
      runningBase = compoundBase;
    } else {
      taxAmount = Math.round(taxableBase * rate);
    }

    components.push({
      jurisdiction: jurisdiction.code,
      name: jurisdiction.name,
      rate,
      amount: taxAmount,
      taxType: jurisdiction.taxType,
      compound: isCompound,
      inclusive: isInclusive,
    });

    if (!isInclusive) {
      totalTax += taxAmount;
    }
    // For inclusive taxes, tax is already in the price — don't add to totalTax
  }

  // For inclusive taxes, totalTax = extracted amounts
  if (jurisdictions.some((j) => j.taxType === 'vat' || j.taxType === 'gst')) {
    totalTax = components.reduce((sum, c) => {
      if (c.inclusive) return sum + c.amount;
      return sum;
    }, 0);
    // Add non-inclusive components too
    totalTax += components.reduce((sum, c) => {
      if (!c.inclusive) return sum + c.amount;
      return sum;
    }, 0);
  }

  const effectiveRate = taxableBase > 0 ? totalTax / taxableBase : 0;

  return {
    subtotal,
    taxableAmount: taxableBase,
    totalTax,
    components,
    exemptAmount,
    effectiveRate,
  };
}

// ─────────────────────────────────────────────────────────
// NEXUS TRACKING
// ─────────────────────────────────────────────────────────

// US nexus thresholds (South Dakota v. Wayfair standard)
const NEXUS_THRESHOLDS: Record<string, { revenue: number; transactions: number }> = {
  'US-CA': { revenue: 50000000,  transactions: 200 },  // $500k revenue or 200 txns
  'US-NY': { revenue: 50000000,  transactions: 100 },
  'US-TX': { revenue: 50000000,  transactions: 200 },
  'US-FL': { revenue: 10000000,  transactions: 200 },  // $100k or 200 txns
  'US-WA': { revenue: 10000000,  transactions: 200 },
};

export interface NexusAlert {
  jurisdictionCode: string;
  jurisdictionName: string;
  metricType: 'revenue' | 'transactions';
  currentValue: number;
  threshold: number;
  percentageOfThreshold: number;
  thresholdReached: boolean;
  periodStart: string;
  periodEnd: string;
}

export async function checkNexus(ventureId: string): Promise<NexusAlert[]> {
  if (!supabase) return [];

  const { data } = await supabase
    .from('tax_nexus_tracking')
    .select('*, tax_jurisdictions(code, name)')
    .eq('venture_id', ventureId)
    .order('updated_at', { ascending: false });

  if (!data) return [];

  return data.map((row: Record<string, unknown>) => {
    const jurisdiction = row.tax_jurisdictions as Record<string, string> | null;
    return {
      jurisdictionCode: jurisdiction?.code ?? '',
      jurisdictionName: jurisdiction?.name ?? '',
      metricType: row.metric_type as 'revenue' | 'transactions',
      currentValue: parseFloat(String(row.current_value)),
      threshold: parseFloat(String(row.threshold)),
      percentageOfThreshold:
        parseFloat(String(row.threshold)) > 0
          ? (parseFloat(String(row.current_value)) / parseFloat(String(row.threshold))) * 100
          : 0,
      thresholdReached: row.threshold_reached as boolean,
      periodStart: row.period_start as string,
      periodEnd: row.period_end as string,
    };
  });
}

export async function updateNexusTracking(
  ventureId: string,
  jurisdictionCode: string,
  amount: number,
): Promise<void> {
  if (!supabase) return;

  // Get jurisdiction ID
  const { data: jurisdiction } = await supabase
    .from('tax_jurisdictions')
    .select('id')
    .eq('code', jurisdictionCode)
    .single();

  if (!jurisdiction) return;

  const now = new Date();
  const periodStart = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10); // Jan 1
  const periodEnd = new Date(now.getFullYear(), 11, 31).toISOString().slice(0, 10); // Dec 31

  const nexus = NEXUS_THRESHOLDS[jurisdictionCode];
  const revenueThreshold = nexus?.revenue ?? 10000000;
  const txnThreshold = nexus?.transactions ?? 200;

  // Upsert revenue tracking
  await supabase.rpc('increment_nexus_tracking', {
    p_venture_id: ventureId,
    p_jurisdiction_id: jurisdiction.id,
    p_metric_type: 'revenue',
    p_amount: amount,
    p_threshold: revenueThreshold,
    p_period_start: periodStart,
    p_period_end: periodEnd,
  }).catch(() => {
    // Fallback: manual upsert if RPC not available
    return supabase!
      .from('tax_nexus_tracking')
      .upsert({
        venture_id: ventureId,
        jurisdiction_id: jurisdiction.id,
        metric_type: 'revenue',
        current_value: amount,
        threshold: revenueThreshold,
        threshold_reached: amount >= revenueThreshold,
        period_start: periodStart,
        period_end: periodEnd,
        updated_at: now.toISOString(),
      }, { onConflict: 'venture_id,jurisdiction_id,metric_type,period_start' });
  });
}
