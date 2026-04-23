// scripts/foundation/parsers/t6-carts — parses T6_FutureState_Cart.csv into
// acquisition_orders upserts for the FutureState-namespaced cart.
//
// T6 is huge (~400 rows across ACQUIRE / DEFER / KILL decisions). To avoid
// dumping thousands of green-defensive rows into the acquisition queue, this
// parser ingests ONLY rows with Decision=ACQUIRE. DEFER and KILL rows are
// captured as chunks (for RAG context) but not as structured acquisitions —
// they can be resurrected later via the acquisition-order service if strategy shifts.

import { parseCsv } from '../_lib/csv';

const SOURCE_DOC = 'T6_FutureState_Cart.csv';

export interface T6AcquisitionInput {
  assetKind: 'domain';
  assetIdentifier: string;
  urgencyTier: 'red_7day' | 'orange_30day' | 'yellow_90day' | 'green_defensive';
  targetRegistrar: string | null;
  priceCad: number | null;
  blocksDisclosure: boolean;
  blocksVentureName: string | null;
  notes: string | null;
  status: 'scoped' | 'cart' | 'acquired' | 'deferred' | 'killed';
}

export interface ParseT6Result {
  acquisitions: T6AcquisitionInput[];
  totalRows: number;
  deferred: number;
  killed: number;
  warnings: string[];
}

export function parseT6Carts(source: string): ParseT6Result {
  const rows = parseCsv(source);
  const acquisitions: T6AcquisitionInput[] = [];
  const warnings: string[] = [];
  let deferred = 0;
  let killed = 0;

  for (const row of rows) {
    const domain = (row['Domain'] ?? '').trim().toLowerCase();
    if (!domain || domain === 'domain') continue;
    const decision = (row['Decision'] ?? '').trim().toUpperCase();
    if (decision === 'DEFER') { deferred += 1; continue; }
    if (decision === 'KILL') { killed += 1; continue; }
    if (decision !== 'ACQUIRE') continue;

    const priority = (row['Priority'] ?? '').trim().toUpperCase();
    const urgency = priorityToUrgency(priority);
    const price = Number(row['Price CAD'] ?? '');
    const priceCad = Number.isFinite(price) && price > 0 ? price : null;
    const isBlocker = priority === 'P0' && /futurestate/.test(domain);

    acquisitions.push({
      assetKind: 'domain',
      assetIdentifier: domain,
      urgencyTier: urgency,
      targetRegistrar: 'Namecheap',
      priceCad,
      blocksDisclosure: isBlocker,
      blocksVentureName: 'futurestate',
      notes: (row['Rationale'] ?? '').trim() || null,
      status: 'cart',
    });
  }

  return {
    acquisitions,
    totalRows: rows.length,
    deferred,
    killed,
    warnings,
  };
}

function priorityToUrgency(p: string): T6AcquisitionInput['urgencyTier'] {
  if (p === 'P0') return 'red_7day';
  if (p === 'P1') return 'orange_30day';
  if (p === 'P2') return 'yellow_90day';
  return 'green_defensive';
}

/** Re-export the source doc name for orchestrator audit. */
export const T6_SOURCE_DOC = SOURCE_DOC;
