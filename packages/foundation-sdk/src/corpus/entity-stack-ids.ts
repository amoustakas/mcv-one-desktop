// @mcv/foundation-sdk/corpus/entity-stack-ids — LOCKED identifiers for the 3-layer architecture.
//
// These strings are stable identifiers that NEVER change without a governance event.
// They match capital_legal_entity.id (TEXT primary key) in Supabase. The actual entity
// rows (label, jurisdiction, formation_status, parent tree) live in the DB and are
// fetched via IPPortfolioService / EntityStackService — never hand-authored here.
//
// Why separate this tiny file from entity-stack data:
// 1. These ids are referenced by is_crown checks, the "transfer_ip_to_root" gate,
//    and the EntityStackView's Crown posture — needing them to be compile-time
//    constants (not DB reads) for type safety.
// 2. The actual tree of operating subs + venture SPVs evolves (SPVs spin up as
//    rounds close, new jurisdictions unlock) and must live in the DB.

/** Layer 0 — the Purpose Trust that ultimately holds all MCV IP.
 *  Formation pending; jurisdiction is TBD (Jersey / Guernsey / Cayman per counsel advice).
 *  Name is ratified as "Root" per naming ratification (was "Covenant"). */
export const LAYER_0_ROOT_TRUST_ID = 'root-purpose-trust' as const;

/** Layer 1 — Singapore VCC that holds MCV Inc. + all operating subs.
 *  Crown-tier entity: never for sale, succession-locked. */
export const MCV_HOLDINGS_LTD_ID = 'mcv-ltd-crown' as const;

/** Layer 1 (interim) — Ontario corporation that holds IP interim-period (MCV Inc → Root transfer
 *  completes in CT-5/CT-6 per Counsel Pack v2.0). Crown-tier: never for sale, succession-locked. */
export const MCV_INC_ID = 'mcv-inc-crown' as const;

/** The two Crown entities. `is_crown=true` is permanent and enforced:
 *   - In the DB via capital_legal_entity.is_crown column + crown_entities view.
 *   - In the foundation store via updateEntity() throwing on protected-field edits.
 *   - In the UI by absence of edit controls on <CrownBadge>-wrapped nodes.
 *
 *  Any new crown entity requires a schema change + governance sign-off + addition here. */
export const CROWN_ENTITY_IDS = [MCV_HOLDINGS_LTD_ID, MCV_INC_ID] as const;
export type CrownEntityId = (typeof CROWN_ENTITY_IDS)[number];

/** Quick check for immutability enforcement. Use at ALL write sites that could mutate
 *  a crown entity's protected fields (label, entityType, parentEntityId, active). */
export function isCrownEntity(id: string): id is CrownEntityId {
  return (CROWN_ENTITY_IDS as readonly string[]).includes(id);
}

/** Fields on capital_legal_entity that are protected for Crown entities.
 *  Attempts to patch these trigger a throw in foundation store's updateEntity. */
export const CROWN_PROTECTED_FIELDS = [
  'label',
  'entityType',
  'parentEntityId',
  'jurisdiction',
  'active',
  'isCrown',
] as const;
export type CrownProtectedField = (typeof CROWN_PROTECTED_FIELDS)[number];

/** Hash-set form for O(1) lookup in the store's guard. */
export const CROWN_PROTECTED_FIELDS_SET: ReadonlySet<string> = new Set(CROWN_PROTECTED_FIELDS);

/** The three entity architecture layers, by numeric position in the Pack v2.0 §3 hierarchy. */
export const ENTITY_LAYERS = Object.freeze({
  LAYER_0: 'root',              // Purpose Trust — Jersey/Guernsey/Cayman, formation pending
  LAYER_1: 'parent',            // MCV Holdings Ltd (SG VCC) + MCV Inc. (Ontario)
  LAYER_2: 'operating_sub',     // Operating subsidiaries (CA/US-DE/IE/AE/EU)
  LAYER_2_SPV: 'venture_spv',   // Per-venture SPVs (FutureState LP, EdgeIQ Holdings, BetEdge AI, etc.)
} as const);
export type EntityLayerKind = (typeof ENTITY_LAYERS)[keyof typeof ENTITY_LAYERS];
