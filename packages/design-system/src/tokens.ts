// @mcv/design-system — Design tokens.
//
// Single source of truth for the MCV palette, spacing, radii, typography.
// Consumed by MCV Desktop, FutureState, BetEdge, mcv.gg, WarForge, and any
// future venture apps via `import { TOKENS } from '@mcv/design-system'`.
//
// CSS variables live in ./design-system.css and mirror these values 1:1.

export const PALETTE = {
  cyan:            '#00F0FF',
  cyanDim:         '#00C4CC',
  cyanGlow:        'rgba(0, 240, 255, 0.15)',
  cyanIntense:     'rgba(0, 240, 255, 0.35)',
  purple:          '#8B5CF6',
  purpleDim:       '#7C3AED',
  purpleGlow:      'rgba(139, 92, 246, 0.15)',
  coreBlue:        '#0072F5',
  gold:            '#F59E0B',

  // Backgrounds — deep void palette
  bgDeep:          '#020408',
  bgSurface:       '#0B1121',
  bgCard:          '#0F1629',
  bgElevated:      '#161D2E',
  bgInput:         '#0A1020',

  // Text
  textPrimary:     '#E8F0FE',
  textSecondary:   '#8899AA',
  textMuted:       '#5A6670',

  // Semantic
  success:         '#10B981',
  warning:         '#F59E0B',
  error:           '#EF4444',
  info:            '#3B82F6',
} as const;

export type PaletteKey = keyof typeof PALETTE;

export const RADII = {
  none: '0',
  sm:   '4px',
  md:   '8px',
  lg:   '12px',
  xl:   '16px',
  full: '9999px',
} as const;

export const SPACING = {
  0:  '0',
  1:  '4px',
  2:  '8px',
  3:  '12px',
  4:  '16px',
  5:  '20px',
  6:  '24px',
  8:  '32px',
  10: '40px',
  12: '48px',
  16: '64px',
} as const;

export const TYPOGRAPHY = {
  fontSans: "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif",
  fontMono: "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace",
  fontDisplay: "'Inter', ui-sans-serif, system-ui, sans-serif",

  sizeXs:   '10px',
  sizeSm:   '11px',
  sizeBase: '13px',
  sizeMd:   '14px',
  sizeLg:   '16px',
  sizeXl:   '20px',
  size2xl:  '28px',

  weightNormal: 400,
  weightMedium: 500,
  weightSemi:   600,
  weightBold:   700,
} as const;

export const SHADOWS = {
  sm:       '0 1px 2px rgba(0, 0, 0, 0.35)',
  md:       '0 4px 12px rgba(0, 0, 0, 0.3)',
  lg:       '0 8px 24px rgba(0, 0, 0, 0.4)',
  glowCyan: '0 0 20px rgba(0, 240, 255, 0.15), 0 0 60px rgba(0, 245, 255, 0.05)',
  glowPurple:'0 0 20px rgba(139, 92, 246, 0.15), 0 0 60px rgba(139, 92, 246, 0.05)',
} as const;

/**
 * Z-index stack. Centralized to prevent wars between overlays.
 */
export const Z = {
  base:       0,
  dropdown:   100,
  sticky:     200,
  backdrop:   900,
  modal:      1000,
  popover:    1100,
  toast:      1200,
  tooltip:    1300,
} as const;

/**
 * Motion durations. All animations across ventures should reference these
 * to maintain a consistent feel.
 */
export const MOTION = {
  instant: 0,
  fast:    120,
  base:    200,
  slow:    320,
  crawl:   500,
} as const;

/**
 * Unified tokens object. Preferred import for consumers:
 *   import { TOKENS } from '@mcv/design-system';
 */
export const TOKENS = {
  palette: PALETTE,
  radii: RADII,
  spacing: SPACING,
  typography: TYPOGRAPHY,
  shadows: SHADOWS,
  z: Z,
  motion: MOTION,
} as const;

export type Tokens = typeof TOKENS;
