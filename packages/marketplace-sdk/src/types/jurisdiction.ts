// 14-entity jurisdictional topology — the Cayman SPC ↔ Ontario LP bridge
// and its supporting cast.
//
// Every RWA instrument, every commit, and every settlement carries a
// Jurisdiction tag. The `JurisdictionalRouter` service (Phase 4) resolves
// which legal entity signs, which Dealer of Record (EMD) is engaged, and
// whether the Ontario 7-unit NRST exclusion applies.
//
// This file is the code-level mirror of the counsel-maintained 14-entity
// topology in .docs/counsel/MCV_Counsel_Onboarding_Pack_v2.0.md §2.
// Adding a new entity to the topology requires a PR that updates this file
// plus the counsel_tasks table in Supabase.

/** Discriminator union — kept flat so switch statements stay exhaustive. */
export type JurisdictionId =
  // Layer 0 — sovereign IP trust
  | 'RootTrust'
  // Layer 1 — federation
  | 'MCVFederationVCC'
  | 'MCVCanadaSub'
  | 'MCVUSASub'
  | 'MCVIrelandSub'
  | 'MCVUAESub'
  | 'MCVEUSub'
  // Layer 2 — operating entities
  | 'CaymanSPC'           // segregated-portfolio issuer for RWA pools
  | 'OntarioLP'           // operating partnership for on-the-ground RE ops
  | 'MCVCapitalInc'       // MCV Capital — fundraising + launchpad
  | 'FutureStateLP'       // investor-facing LP
  | 'EdgeIQHoldingsInc'   // BetEdge parent
  | 'MCVStudiosInc'       // mcv.gg Web3 hub
  | 'MCVDigitalAgency';   // legacy agency ops (Full Gain, SerpSpace)

/** Role each entity plays in the SDK's legal routing logic. */
export type EntityRole =
  | 'trust'              // holds sovereign IP (Layer 0)
  | 'federation'         // VCC parent (Layer 1)
  | 'regional-sub'       // regional operating subsidiary (Layer 1)
  | 'issuer'             // issues RWA tokens (Cayman SPC)
  | 'operator'           // day-to-day property ops (Ontario LP)
  | 'dealer-of-record'   // EMD partnership surface
  | 'custodian'          // holds KMS keys + multisig authority
  | 'treasury'           // corporate treasury
  | 'venture-operating'; // other venture-specific ops

export interface JurisdictionConfig {
  id: JurisdictionId;
  label: string;
  role: EntityRole;
  /** ISO 3166-1 alpha-2 (for tax + compliance routing). null = multi-jurisdiction / trust */
  countryCode: string | null;
  /** Parent entity in the topology; null for Root */
  parent: JurisdictionId | null;
  /** Whether this entity can be listed as token issuer on a Token-2022 mint */
  canIssueRwa: boolean;
  /**
   * Whether Ontario's 7-unit commercial NRST exclusion applies to offerings
   * this entity issues. Only Ontario-seated real-estate issuers hit this.
   */
  nrstSevenUnitApplies: boolean;
}

export const JURISDICTIONS: Record<JurisdictionId, JurisdictionConfig> = {
  RootTrust:             { id: 'RootTrust',            label: 'MCV Root Trust (Purpose Trust)',  role: 'trust',             countryCode: null, parent: null,                canIssueRwa: false, nrstSevenUnitApplies: false },
  MCVFederationVCC:      { id: 'MCVFederationVCC',     label: 'MCV Federation VCC (Singapore)',  role: 'federation',        countryCode: 'SG', parent: 'RootTrust',         canIssueRwa: false, nrstSevenUnitApplies: false },
  MCVCanadaSub:          { id: 'MCVCanadaSub',         label: 'MCV Canada Ltd',                  role: 'regional-sub',      countryCode: 'CA', parent: 'MCVFederationVCC',  canIssueRwa: false, nrstSevenUnitApplies: false },
  MCVUSASub:             { id: 'MCVUSASub',            label: 'MCV USA Inc',                     role: 'regional-sub',      countryCode: 'US', parent: 'MCVFederationVCC',  canIssueRwa: false, nrstSevenUnitApplies: false },
  MCVIrelandSub:         { id: 'MCVIrelandSub',        label: 'MCV Ireland Ltd',                 role: 'regional-sub',      countryCode: 'IE', parent: 'MCVFederationVCC',  canIssueRwa: false, nrstSevenUnitApplies: false },
  MCVUAESub:             { id: 'MCVUAESub',            label: 'MCV UAE Free Zone',               role: 'regional-sub',      countryCode: 'AE', parent: 'MCVFederationVCC',  canIssueRwa: false, nrstSevenUnitApplies: false },
  MCVEUSub:              { id: 'MCVEUSub',             label: 'MCV EU SRL',                      role: 'regional-sub',      countryCode: 'LU', parent: 'MCVFederationVCC',  canIssueRwa: false, nrstSevenUnitApplies: false },
  CaymanSPC:             { id: 'CaymanSPC',            label: 'MCV Segregated Portfolio Co.',    role: 'issuer',            countryCode: 'KY', parent: 'MCVFederationVCC',  canIssueRwa: true,  nrstSevenUnitApplies: false },
  OntarioLP:             { id: 'OntarioLP',            label: 'MCV Ontario Realty LP',           role: 'operator',          countryCode: 'CA', parent: 'MCVCanadaSub',      canIssueRwa: false, nrstSevenUnitApplies: true  },
  MCVCapitalInc:         { id: 'MCVCapitalInc',        label: 'MCV Capital Inc',                 role: 'venture-operating', countryCode: 'CA', parent: 'MCVCanadaSub',      canIssueRwa: false, nrstSevenUnitApplies: false },
  FutureStateLP:         { id: 'FutureStateLP',        label: 'FutureState LP',                  role: 'venture-operating', countryCode: 'KY', parent: 'CaymanSPC',         canIssueRwa: true,  nrstSevenUnitApplies: false },
  EdgeIQHoldingsInc:     { id: 'EdgeIQHoldingsInc',    label: 'EdgeIQ Holdings Inc',             role: 'venture-operating', countryCode: 'CA', parent: 'MCVCanadaSub',      canIssueRwa: false, nrstSevenUnitApplies: false },
  MCVStudiosInc:         { id: 'MCVStudiosInc',        label: 'MCV Studios Inc',                 role: 'venture-operating', countryCode: 'CA', parent: 'MCVCanadaSub',      canIssueRwa: false, nrstSevenUnitApplies: false },
  MCVDigitalAgency:      { id: 'MCVDigitalAgency',     label: 'MCV Digital Agency',              role: 'venture-operating', countryCode: 'CA', parent: 'MCVCanadaSub',      canIssueRwa: false, nrstSevenUnitApplies: false },
};

/** All jurisdictions that can be listed as issuer on a Token-2022 mint. */
export function listRwaIssuers(): JurisdictionConfig[] {
  return Object.values(JURISDICTIONS).filter((j) => j.canIssueRwa);
}

/** Walks up the parent chain to Root; useful for audit + governance. */
export function ancestryOf(id: JurisdictionId): JurisdictionId[] {
  const chain: JurisdictionId[] = [id];
  let current: JurisdictionId | null = JURISDICTIONS[id].parent;
  while (current) {
    chain.push(current);
    current = JURISDICTIONS[current].parent;
  }
  return chain;
}

/** Whether two entities share the same federation branch. */
export function shareFederation(a: JurisdictionId, b: JurisdictionId): boolean {
  const ancestryA = new Set(ancestryOf(a));
  return ancestryOf(b).some((id) => ancestryA.has(id));
}
