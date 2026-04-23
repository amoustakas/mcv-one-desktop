// @mcv/foundation-sdk/corpus — LOCKED invariants only.
//
// Rule: if a value can change without governance approval, it does NOT belong here —
// it belongs in Supabase + services/*. See feedback_dynamic_data_over_constants.md.

export * from './ratified-names';
export * from './entity-stack-ids';
