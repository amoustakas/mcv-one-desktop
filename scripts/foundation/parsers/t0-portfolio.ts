// scripts/foundation/parsers/t0-portfolio - parses T0_Portfolio_Master.csv.
//
// The master domain sheet has 111 rows. Rows with Status='Active' represent owned
// domains -> upsert into domain_registry. Rows with Status='ACQUIRE-PENDING'
// represent the cart overflow that merges with T2/T6 acquisition seeds ->
// acquisition_orders.
//
// The CSV's Holding Entity column is free-text (e.g. "MCV Holdings Ltd",
// "FutureState LP") - we slugify it and rely on the orchestrator's entity upsert
// pass (t1-entities) to have created matching IDs beforehand.

import { parseCsv } from '../_lib/csv';
import { slugifyEntity } from './t1-entities';

export interface DomainUpsertInput {
  fqdn: string;
  registrar: string | null;
  parentEntityId: string | null;
  ventureId: string | null;
  status: 'active' | 'expiring' | 'expired' | 'transfer' | 'parked';
  registeredAt: string | null;
  expiresAt: string | null;
  tmPriority: string | null;
  notes: string | null;
}

export interface DomainAcquisitionInput {
  assetKind: 'domain';
  assetIdentifier: string;
  urgencyTier: 'red_7day' | 'orange_30day' | 'yellow_90day' | 'green_defensive';
  targetRegistrar: string | null;
  notes: string | null;
}

export interface ParseT0Result {
  owned: DomainUpsertInput[];
  pending: DomainAcquisitionInput[];
  warnings: string[];
}

export function parseT0Portfolio(source: string): ParseT0Result {
  const rows = parseCsv(source);
  const owned: DomainUpsertInput[] = [];
  const pending: DomainAcquisitionInput[] = [];
  const warnings: string[] = [];

  for (const row of rows) {
    const fqdn = (row['Domain'] ?? '').trim().toLowerCase();
    if (!fqdn || fqdn === 'domain') continue;
    const status = (row['Status'] ?? '').trim().toUpperCase();
    const holdingEntity = row['Holding Entity'] ?? '';
    const tmPriority = (row['TM Priority'] ?? '').trim() || null;
    const notes = (row['Notes'] ?? '').trim() || null;
    const productOwner = row['Product Owner'] ?? '';
    const registrar = (row['Registrar'] ?? '').trim() || null;

    if (status === 'ACTIVE' || status === 'LEGACY') {
      owned.push({
        fqdn,
        registrar,
        parentEntityId: holdingEntity && !/TBD/i.test(holdingEntity)
          ? slugifyEntity(holdingEntity)
          : null,
        ventureId: inferVentureId(fqdn, productOwner, holdingEntity),
        status: 'active',
        registeredAt: null,
        expiresAt: parseIsoDate(row['Renewal Date']),
        tmPriority,
        notes,
      });
      continue;
    }

    if (status === 'ACQUIRE-PENDING' || status === 'ACQUIRE') {
      pending.push({
        assetKind: 'domain',
        assetIdentifier: fqdn,
        urgencyTier: mapPriorityToUrgency(tmPriority),
        targetRegistrar: registrar,
        notes,
      });
      continue;
    }
  }

  if (owned.length === 0 && pending.length === 0) {
    warnings.push(`[t0-portfolio] parsed 0 rows - check CSV header alignment.`);
  }
  return { owned, pending, warnings };
}

function parseIsoDate(cell: string | undefined): string | null {
  if (!cell) return null;
  const trimmed = cell.trim();
  if (!trimmed || /N\/A|TBD/i.test(trimmed)) return null;
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed);
  if (!m) return null;
  const yyyy = m[1];
  const mm = m[2].padStart(2, '0');
  const dd = m[3].padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function mapPriorityToUrgency(priority: string | null): DomainAcquisitionInput['urgencyTier'] {
  if (!priority) return 'green_defensive';
  const p = priority.trim().toUpperCase();
  if (p === 'P0') return 'red_7day';
  if (p === 'P1') return 'orange_30day';
  if (p === 'P2') return 'yellow_90day';
  return 'green_defensive';
}

function inferVentureId(fqdn: string, productOwner: string, holdingEntity: string): string | null {
  const needles: Record<string, string> = {
    futurestate: 'futurestate',
    betedge: 'betedge',
    warforge: 'warforge',
    mcvgg: 'mcvgg',
    'mcv.gg': 'mcvgg',
    edgeiq: 'edgeiq-markets',
    'arq labs': 'arq',
    arqlabs: 'arq',
    serpspace: 'serpspace',
    fullgain: 'full-gain',
    'full gain': 'full-gain',
  };
  const lower = `${fqdn} ${productOwner} ${holdingEntity}`.toLowerCase();
  for (const needle of Object.keys(needles)) {
    if (lower.includes(needle)) return needles[needle];
  }
  return null;
}
