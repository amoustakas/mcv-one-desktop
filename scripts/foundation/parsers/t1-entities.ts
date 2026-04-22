// scripts/foundation/parsers/t1-entities — parses T1_Entities.csv into
// capital_legal_entity upsert rows.
//
// The CSV has 13 entities: Root (Layer 0), 4 Layer 1 entities (MCV Holdings
// Ltd / MCV Tech DAC / MCV Finance VCC / EdgeIQ Holdings), 2 Canadian ops
// (Moose Caliber Ventures Inc., MCV Inc.), and 6 Layer 2 venture entities.
//
// capital_legal_entity has CHECK constraint on entity_type: must be one of
// 'corporation' | 'llc' | 'gp' | 'lp' | 'trust' | 'foundation' | 'dao' | 'other'.
// Since the CSV uses VCC / DAC / C-Corp / Corp / LP / Trust / TBD, we map them
// here and stash the original string in metadata.original_type.

import { parseCsv } from '../_lib/csv';

const SOURCE_DOC = 'T1_Entities.csv';

export interface LegalEntityUpsertInput {
  id: string;
  label: string;
  entityType: 'corporation' | 'llc' | 'gp' | 'lp' | 'trust' | 'foundation' | 'dao' | 'other';
  jurisdiction: string;
  parentEntityId: string | null;
  isCrown: boolean;
  active: boolean;
  metadata: Record<string, unknown>;
}

export interface ParseT1Result {
  entities: LegalEntityUpsertInput[];
  warnings: string[];
}

const ENTITY_TYPE_MAP: Record<string, LegalEntityUpsertInput['entityType']> = {
  'vcc': 'corporation',
  'dac': 'corporation',
  'c-corp': 'corporation',
  'corp': 'corporation',
  'corporation': 'corporation',
  'llc': 'llc',
  'gp': 'gp',
  'limited partnership': 'lp',
  'lp': 'lp',
  'trust': 'trust',
  'foundation': 'foundation',
  'dao': 'dao',
  'tbd': 'other',
};

export function parseT1Entities(source: string): ParseT1Result {
  const rows = parseCsv(source);
  const entities: LegalEntityUpsertInput[] = [];
  const warnings: string[] = [];

  for (const row of rows) {
    const name = (row['Entity Name'] ?? '').trim();
    if (!name || name.toLowerCase() === 'entity name') continue;
    const layer = (row['Layer'] ?? '').trim();
    if (!layer) continue;

    const rawType = (row['Entity Type'] ?? '').trim().toLowerCase();
    const entityType = ENTITY_TYPE_MAP[rawType] ?? 'other';
    if (!ENTITY_TYPE_MAP[rawType]) {
      warnings.push(`[t1-entities] unknown entity type "${row['Entity Type']}" for ${name} — defaulting to 'other'.`);
    }

    const jurisdictionRaw = (row['Jurisdiction'] ?? '').trim();
    const jurisdiction = normalizeJurisdiction(jurisdictionRaw);
    const status = (row['Status'] ?? '').trim().toLowerCase();
    const active = !/planned|not yet|legacy \(rebuild\)/i.test(status);
    const isCrown = /\blayer 0\b/i.test(layer) || /^Root/i.test(name)
      || /MCV Holdings Ltd/i.test(name) || /Moose Caliber Ventures Inc/i.test(name);

    entities.push({
      id: slugifyEntity(name),
      label: name,
      entityType,
      jurisdiction,
      parentEntityId: inferParentId(name, layer),
      isCrown,
      active,
      metadata: {
        original_type: row['Entity Type'] ?? '',
        layer,
        role: row['Role'] ?? '',
        formation_status: row['Status'] ?? '',
        source_doc: SOURCE_DOC,
        domains_held: row['Domains Held'] ?? '',
        key_functions: row['Key Functions'] ?? '',
      },
    });
  }

  return { entities, warnings };
}

/**
 * Slugify entity names into stable kebab-case IDs. This matches the ID style
 * already used in the repo (mcv-inc-crown, edgeiq-holdings) — parentheticals
 * are collapsed into suffixes so "Root (Purpose Trust)" → "root-trust" and
 * "EdgeIQ Holdings Inc (Wyoming)" → "edgeiq-holdings-wy".
 */
export function slugifyEntity(name: string): string {
  const alias = SPECIAL_ALIASES[name.trim()];
  if (alias) return alias;
  return name
    .toLowerCase()
    .replace(/[()]/g, ' ')
    .replace(/[.,'"]/g, '')
    .replace(/&/g, 'and')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Hard-coded aliases for entities that need to collapse into existing crown IDs. */
const SPECIAL_ALIASES: Record<string, string> = {
  'MCV Inc.': 'mcv-inc-crown',
  'MCV LTD': 'mcv-ltd-crown',
};

function normalizeJurisdiction(raw: string): string {
  if (!raw || /TBD/i.test(raw)) return 'TBD';
  const lower = raw.toLowerCase();
  if (lower.includes('singapore')) return 'SG';
  if (lower.includes('cayman')) return 'CAYMAN';
  if (lower.includes('ireland')) return 'IE';
  if (lower.includes('jersey')) return 'JE';
  if (lower.includes('guernsey')) return 'GG';
  if (lower.includes('ontario') || lower.includes('canada')) return 'CA-ON';
  if (lower.includes('wyoming') || lower.includes('usa')) return 'US-WY';
  if (lower.includes('uk') || lower.includes('united kingdom')) return 'UK';
  if (lower.includes('eu')) return 'EU';
  if (lower.includes('uae')) return 'UAE';
  return raw.slice(0, 16);
}

/**
 * Parent hierarchy per IP Inventory §3:
 *   Root (Layer 0) → MCV Holdings Ltd (Layer 1) → Layer 2 ventures
 *   MCV Tech DAC / MCV Finance VCC are Layer 1 subs of MCV Holdings Ltd.
 *   Moose Caliber Ventures Inc. is the interim IP holder, reports under MCV Holdings Ltd
 *   once the VCC forms.
 */
function inferParentId(name: string, layer: string): string | null {
  if (/^Root/i.test(name)) return null;
  if (/layer 0/i.test(layer)) return null;
  if (/MCV Holdings Ltd/i.test(name)) return 'root-purpose-trust';   // Aspirational parent
  if (/layer 1/i.test(layer)) return 'mcv-holdings-ltd';
  return 'mcv-holdings-ltd';   // Layer 2 default
}
