// Thin re-export shim — source of truth is @mcv/naos-sdk.
// Preserves historical ../lib/naos import paths (types, genesis, evolution,
// prediction, authority, resonance, culture, prompt-compiler). Runtime and
// personality-compiler stay in the app (they depend on stores/kits/claude).
export * from '@mcv/naos-sdk';
