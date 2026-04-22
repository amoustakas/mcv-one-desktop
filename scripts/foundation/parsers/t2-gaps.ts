// scripts/foundation/parsers/t2-gaps - parses T2_Gaps_Urgent.csv into
// acquisition_orders upserts.
//
// The 5 red/orange rows are already seeded in the DB by
// `foundation.seed_urgent_acquisitions` (hand-authored constant in
// @mcv/foundation-sdk/services/acquisition.ts) - upsert-on-conflict means
// re-seeding them via this parser is a no-op. T2 adds the yellow/green rows
// (planned/research/existing-negotiation) that the service-level seed does not
// cover.

import { parseCsv } from '../_lib/csv';

const SOURCE_DOC = 'T2_Gaps_Urgent.csv';

export interface AcquisitionOrderUpsertInput {
  assetKind: 'domain' | 'trademark_purchase' | 'patent_purchase';
  assetIdentifier: string;
  urgencyTier: 'red_7day' | 'orange_30day' | 'yellow_90day' | 'green_defensive';
  targetRegistrar: string | null;
  blocksDisclosure: boolean;
  blocksVentureName: string | null;
  notes: string | null;
  status: 'scoped' | 'cart' | 'acquired' | 'deferred' | 'killed';
}

export interface ParseT2Result {
  acquisitions: AcquisitionOrderUpsertInput[];
  warnings: string[];
}

export function parseT2Gaps(source: string): ParseT2Result {
  const rows = parseCsv(source);
  const acquisitions: AcquisitionOrderUpsertInput[] = [];
  const warnings: string[] = [];

  for (const row of rows) {
    const assetRaw = (row['Domain'] ?? '').trim().toLowerCase();
    if (!assetRaw || assetRaw === 'domain') continue;
    // Skip "futurestate.* (Kirill-owned)" etc. - these are narrative rows, not acquirable targets.
    if (/\s|\(/.test(assetRaw)) continue;
    if (!isDomainLike(assetRaw)) continue;

    const urgency = mapUrgencyFlag((row['Gap / Urgency'] ?? '').trim());
    if (!urgency) {
      warnings.push(`[t2-gaps] skipped ${assetRaw} - unknown urgency flag.`);
      continue;
    }
    const status = (row['Status'] ?? '').trim().toLowerCase();
    const blocker = (row['Blocker'] ?? '').trim();
    const blocksDisclosure = /hunter|disclosure|kirill/i.test(blocker);

    acquisitions.push({
      assetKind: 'domain',
      assetIdentifier: assetRaw,
      urgencyTier: urgency,
      targetRegistrar: null,
      blocksDisclosure,
      blocksVentureName: extractVentureName(assetRaw, row['Function'] ?? ''),
      notes: [row['Function'], blocker, row['Notes']].filter((s) => s && s.trim()).join(' / ') || null,
      status: mapStatus(status),
    });
  }

  return { acquisitions, warnings };
}

function isDomainLike(value: string): boolean {
  return /^[a-z0-9][a-z0-9-]*(\.[a-z0-9-]+)+$/i.test(value);
}

function mapUrgencyFlag(flag: string): AcquisitionOrderUpsertInput['urgencyTier'] | null {
  if (flag.includes('🔴')) return 'red_7day';
  if (flag.includes('🟠')) return 'orange_30day';
  if (flag.includes('🟡')) return 'yellow_90day';
  if (flag.includes('🟢')) return 'green_defensive';
  if (/critical/i.test(flag)) return 'red_7day';
  if (/strategic/i.test(flag)) return 'orange_30day';
  if (/research|existing/i.test(flag)) return 'yellow_90day';
  if (/planned/i.test(flag)) return 'green_defensive';
  return null;
}

function mapStatus(text: string): AcquisitionOrderUpsertInput['status'] {
  if (/acquired/i.test(text)) return 'acquired';
  if (/cart|acquire/i.test(text)) return 'cart';
  if (/not acquired|not researched|not yet|kirill holds|planned/i.test(text)) return 'scoped';
  return 'scoped';
}

function extractVentureName(fqdn: string, functionText: string): string | null {
  const m = /^([a-z0-9-]+)\./i.exec(fqdn);
  if (!m) return null;
  const sld = m[1].toLowerCase();
  if (sld === 'futurestate') return 'futurestate';
  if (sld === 'naos' || /NAOS/i.test(functionText)) return 'mcv-one';
  if (sld === 'coretriangle' || /Core-Triangle/i.test(functionText)) return 'mcv-one';
  return null;
}

export const T2_SOURCE_DOC = SOURCE_DOC;
