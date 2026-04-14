// src/lib/mcv-core/index.ts
//
// MCV Desktop shim over @mcv/core-triangle. The extracted package holds the
// canonical client logic; this path stays as the blessed import for root-app
// code so future upgrades are a one-file swap.

export * from '@mcv/core-triangle';
