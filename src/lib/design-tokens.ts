// src/lib/design-tokens.ts
//
// Root-app shim over @mcv/design-system. Use this as the blessed import path
// inside MCV Desktop components so future package upgrades are a one-file
// swap, not a repo-wide find-and-replace.
//
// Usage:
//   import { TOKENS, PALETTE } from '@/lib/design-tokens';
//   import { MCV_DESIGN_SYSTEM_VERSION } from '@/lib/design-tokens';
//
// As we extract more @mcv/* packages this file gradually expands into a
// single-entry SDK facade for the root app.

export {
  TOKENS,
  PALETTE,
  RADII,
  SPACING,
  TYPOGRAPHY,
  SHADOWS,
  Z,
  MOTION,
  MCV_DESIGN_SYSTEM_VERSION,
  type PaletteKey,
  type Tokens,
} from '@mcv/design-system';
