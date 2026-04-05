# @mcv/shared/theming — Chameleon Engine

**Parent Package:** @mcv/shared  
**Tier:** 2.5 (Shared Business Utilities)  
**Classification:** PUBLISHABLE  
**Last Updated:** February 8, 2026

---

## Purpose

The `theming` module implements the **Chameleon Engine** — MCV's dynamic theming system that provides design tokens, color palettes, typography scales, spacing systems, and component-level customization. It enables white-labeling so every venture can have a fully branded experience with runtime theme switching, dark mode support, CSS variable generation, and Tailwind CSS integration.

**Every pixel of the MCV platform is styled through this engine — from venture dashboards to customer-facing embeds.**

The Chameleon Engine is designed around three core principles:

1. **Token-First Architecture** — All visual properties are expressed as hierarchical design tokens (primitives → semantic → component → context). Nothing is hard-coded; everything references a token.
2. **Inheritance & Override** — Themes extend parent themes. Ventures override the MCV system theme. Components override semantic tokens. This creates a cascade from global defaults down to individual widget states.
3. **Output Agnostic** — The token tree is resolved once, then transformed into any output format: CSS custom properties, Tailwind config, React context values, email inline styles, PDF stylesheets, or native mobile theme maps.

### What It Solves

| Problem | Chameleon Solution |
|---------|-------------------|
| Every venture needs unique branding | Theme-per-venture with full token customization |
| Dark mode across 200+ components | Single token layer swap — surface tokens change, component references stay |
| WCAG accessibility compliance | Built-in contrast checking and auto-adjustment on every color |
| White-label for enterprise clients | Complete brand replacement: logo, fonts, colors, component shapes |
| Email/PDF need inline styles | Same theme resolves to CSS variables, inline styles, or style objects |
| Designers can't push changes without deploys | Live theme editor with real-time preview and undo/redo |
| Tailwind integration | Auto-generated `tailwind.config.ts` theme section from tokens |
| Performance at scale | Aggressive caching, single `<style>` tag injection, tree-shakeable client |

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// THEME DEFINITION & MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

export {
  createTheme,               // Create a new theme from scratch
  defineTheme,               // Define theme with validation
  extendTheme,               // Extend a parent theme with overrides
  mergeThemes,               // Deep-merge two themes
  cloneTheme,                // Clone theme for modification
  validateTheme,             // Validate a theme config against schema
} from './server/services/theme-service';

// ═══════════════════════════════════════════════════════════════════════════════
// TOKEN RESOLUTION
// ═══════════════════════════════════════════════════════════════════════════════

export {
  resolveTokens,             // Resolve semantic tokens to final values
  resolveToken,              // Resolve a single token path
  getTokenValue,             // Get computed value for a token
  flattenTokens,             // Flatten nested token tree to dot-paths
  diffTokens,                // Compare two token trees and return delta
} from './server/services/token-service';

// ═══════════════════════════════════════════════════════════════════════════════
// CSS GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

export {
  generateCssVariables,      // Generate :root CSS custom properties
  generateTailwindConfig,    // Generate tailwind.config.ts theme section
  generateStylesheet,        // Generate full CSS stylesheet from theme
  generateScopedCss,         // Generate CSS scoped to a selector
  generateInlineStyles,      // Generate inline style object (for emails/PDFs)
  generateFontFaceRules,     // Generate @font-face CSS rules for custom fonts
} from './server/services/css-service';

// ═══════════════════════════════════════════════════════════════════════════════
// COLOR UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

export {
  generateColorScale,        // Generate 50-950 scale from a single color
  adjustContrast,            // Adjust color for WCAG contrast ratio
  parseColor,                // Parse hex/rgb/hsl to internal format
  mixColors,                 // Blend two colors
  getContrastRatio,          // WCAG contrast ratio between two colors
  isAccessible,              // Check WCAG AA/AAA compliance
  lighten,                   // Lighten a color by percentage
  darken,                    // Darken a color by percentage
  saturate,                  // Increase saturation
  desaturate,                // Decrease saturation
  toHex,                     // Convert any color format to hex
  toRgb,                     // Convert to rgb() string
  toHsl,                     // Convert to hsl() string
  toOklch,                   // Convert to oklch() string (modern CSS)
  getAlphaVariant,           // Get color with alpha channel
} from './server/services/color-service';

// ═══════════════════════════════════════════════════════════════════════════════
// THEME APPLICATION (Server)
// ═══════════════════════════════════════════════════════════════════════════════

export {
  applyTheme,                // Apply theme globally (server-side rendering)
  getTheme,                  // Get theme by ID or slug
  getCurrentTheme,           // Get current active theme for venture
  listThemes,               // List all themes for a venture
  setDefaultTheme,           // Set venture default theme
  deleteTheme,               // Delete a theme
  exportTheme,               // Export theme as portable JSON
  importTheme,               // Import theme from portable JSON
} from './server/services/theme-store';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT HOOKS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { ThemeProvider } from './client/components/theme-provider';
export { useTheme } from './client/hooks/use-theme';
export { useColorMode } from './client/hooks/use-color-mode';
export { useDesignTokens } from './client/hooks/use-design-tokens';
export { useThemeEditor } from './client/hooks/use-theme-editor';
export { useContrastChecker } from './client/hooks/use-contrast-checker';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT COMPONENTS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { ThemeEditor } from './client/components/theme-editor';
export { ColorPicker } from './client/components/color-picker';
export { ThemePreview } from './client/components/theme-preview';
export { BrandingPanel } from './client/components/branding-panel';
export { ContrastChecker } from './client/components/contrast-checker';
export { TokenInspector } from './client/components/token-inspector';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  DEFAULT_THEME,
  DARK_THEME,
  HIGH_CONTRAST_THEME,
  DEFAULT_COLOR_SCALES,
  DEFAULT_TYPOGRAPHY,
  DEFAULT_SPACING,
  DEFAULT_RADII,
  DEFAULT_SHADOWS,
  BREAKPOINTS,
  SYSTEM_THEME_IDS,
  TOKEN_SEPARATOR,
  CSS_VARIABLE_PREFIX,
} from './constants';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  Theme,
  ThemeConfig,
  ThemeTokens,
  ThemeMode,
  ColorScale,
  ColorPalette,
  SemanticColors,
  SurfaceColors,
  TypeScale,
  TypographyTokens,
  SpacingTokens,
  RadiiTokens,
  ShadowTokens,
  BorderTokens,
  BreakpointTokens,
  TransitionTokens,
  ComponentThemes,
  ComponentTheme,
  ThemeOverride,
  CssVariableMap,
  TailwindThemeConfig,
  ContrastResult,
  AccessibilityLevel,
  BrandConfig,
  CustomFont,
  ThemeExport,
  ThemeImport,
  TokenPath,
  TokenDiff,
  ResolvedTokens,
  InlineStyleMap,
} from './types';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                          CHAMELEON ENGINE ARCHITECTURE                                │
│                                                                                       │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                           ENTRY POINTS                                         │  │
│  │                                                                                │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │  │
│  │  │Venture Admin │  │  ThemeEditor │  │  API Routes  │  │  SSR / RSC   │      │  │
│  │  │  Dashboard   │  │  Component   │  │  /api/themes │  │  Rendering   │      │  │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │  │
│  │         └─────────────────┴─────────────────┴─────────────────┘               │  │
│  │                                    │                                           │  │
│  └────────────────────────────────────┼───────────────────────────────────────────┘  │
│                                       │                                               │
│  ┌────────────────────────────────────▼───────────────────────────────────────────┐  │
│  │                         THEME PIPELINE                                          │  │
│  │                                                                                 │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │  │
│  │  │    1.       │  │    2.       │  │    3.       │  │    4.       │          │  │
│  │  │  Define /   │─▶│  Resolve    │─▶│  Generate   │─▶│   Apply     │          │  │
│  │  │  Extend     │  │  Tokens     │  │  Output     │  │   Theme     │          │  │
│  │  │             │  │             │  │             │  │             │          │  │
│  │  │ • Validate  │  │ • Inherit   │  │ • :root CSS │  │ • Inject    │          │  │
│  │  │ • Merge     │  │ • Flatten   │  │ • Scoped    │  │ • SSR head  │          │  │
│  │  │ • Override  │  │ • Compute   │  │ • Tailwind  │  │ • React ctx │          │  │
│  │  │ • Schema    │  │ • Contrast  │  │ • Inline    │  │ • Dark mode │          │  │
│  │  │ • Version   │  │ • Fallback  │  │ • @font-face│  │ • Scoped    │          │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘          │  │
│  │                                                                                 │  │
│  └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│  │                         TOKEN LAYERS                                             │  │
│  │                                                                                  │  │
│  │  ┌───────────────────┐                                                          │  │
│  │  │    PRIMITIVES     │  Raw values: blue-500=#3B82F6, gray-100=#F3F4F6         │  │
│  │  │  (Palette values) │  No semantic meaning — just raw swatches                │  │
│  │  └─────────┬─────────┘                                                          │  │
│  │            │ references                                                          │  │
│  │  ┌─────────▼─────────┐                                                          │  │
│  │  │     SEMANTIC      │  Meaning: primary=blue-500, error=red-500               │  │
│  │  │  (Role-based)     │  What it MEANS, not what it looks like                  │  │
│  │  └─────────┬─────────┘                                                          │  │
│  │            │ references                                                          │  │
│  │  ┌─────────▼─────────┐                                                          │  │
│  │  │    COMPONENT      │  UI: button-bg=primary, card-bg=surface                 │  │
│  │  │  (Widget-level)   │  Maps semantic tokens to specific UI elements           │  │
│  │  └─────────┬─────────┘                                                          │  │
│  │            │ references                                                          │  │
│  │  ┌─────────▼─────────┐                                                          │  │
│  │  │     CONTEXT       │  State: button-hover=primary-600, focus-ring=primary    │  │
│  │  │  (State-based)    │  Interaction states, responsive breakpoints             │  │
│  │  └───────────────────┘                                                          │  │
│  │                                                                                  │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                       OUTPUT TARGETS                                              │  │
│  │                                                                                   │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │  │
│  │  │  CSS Custom  │ │   Tailwind   │ │   Inline     │ │  React       │            │  │
│  │  │  Properties  │ │   Config     │ │   Styles     │ │  Context     │            │  │
│  │  │              │ │              │ │              │ │              │            │  │
│  │  │ :root { ... }│ │ theme: { ... │ │ { color: ... │ │ useTheme()   │            │  │
│  │  │ .dark { ... }│ │ extend: { ...│ │   bg: ...    │ │ useTokens()  │            │  │
│  │  │ .scope { ...}│ │ }            │ │ }            │ │              │            │  │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘            │  │
│  │                                                                                   │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                              │  │
│  │  │  @font-face  │ │   Email      │ │   PDF        │                              │  │
│  │  │  Rules       │ │   Templates  │ │   Stylesheet │                              │  │
│  │  └──────────────┘ └──────────────┘ └──────────────┘                              │  │
│  │                                                                                   │  │
│  └───────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│  ┌───────────────────────────────────────────────────────────────────────────────────┐  │
│  │                        STORAGE LAYER                                               │  │
│  │                                                                                    │  │
│  │  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐                  │  │
│  │  │    themes         │ │ theme_overrides   │ │  venture_brand   │                  │  │
│  │  │                   │ │                   │ │                  │                  │  │
│  │  │ Full theme defs   │ │ Per-venture       │ │ Logo, favicon,   │                  │  │
│  │  │ with tokens,      │ │ component-level   │ │ brand assets,    │                  │  │
│  │  │ mode, parent,     │ │ overrides with    │ │ custom fonts,    │                  │  │
│  │  │ version history   │ │ cascade priority  │ │ brand metadata   │                  │  │
│  │  └──────────────────┘ └──────────────────┘ └──────────────────┘                  │  │
│  │                                                                                    │  │
│  │  ┌──────────────────┐ ┌──────────────────┐                                       │  │
│  │  │ theme_versions    │ │  theme_cache      │                                       │  │
│  │  │                   │ │                   │                                       │  │
│  │  │ Point-in-time     │ │ Pre-computed CSS  │                                       │  │
│  │  │ snapshots for     │ │ variable maps and │                                       │  │
│  │  │ rollback & audit  │ │ Tailwind configs  │                                       │  │
│  │  └──────────────────┘ └──────────────────┘                                       │  │
│  │                                                                                    │  │
│  └────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

### Pipeline Detail

The theme pipeline processes every theme operation through four stages:

**Stage 1 — Define / Extend:** A theme is created from scratch (`createTheme`) or by extending a parent (`extendTheme`). The input is validated against the `ThemeConfig` Zod schema. Only override tokens are stored; the full token tree is computed at resolution time. Theme versioning creates a snapshot before every mutation.

**Stage 2 — Resolve Tokens:** The `resolveTokens` function walks the token tree, resolving references (e.g., `{colors.semantic.primary.500}` → `#6366F1`), inheriting from the parent theme where tokens are absent, and flattening the tree into dot-path keys. If WCAG enforcement is enabled, contrast ratios are validated for every foreground/background pair, and auto-adjusted if they fail.

**Stage 3 — Generate Output:** The resolved token tree is transformed into the target format. `generateCssVariables` produces a `:root {}` block. `generateTailwindConfig` produces the `theme.extend` object for `tailwind.config.ts`. `generateInlineStyles` produces a flat `Record<string, string>` for email templates. `generateFontFaceRules` produces `@font-face` declarations for custom fonts.

**Stage 4 — Apply Theme:** The output is injected into the rendering context. For SSR, a `<style>` tag is injected into `<head>`. For React SPAs, `ThemeProvider` sets CSS variables on `document.documentElement` and provides the theme via React context. For embedded widgets, `generateScopedCss` wraps variables in a CSS selector scope. Dark mode is handled by swapping the surface token layer — component references remain unchanged.

---

## Token Resolution Algorithm

Token resolution is the heart of the Chameleon Engine. Understanding how tokens cascade is critical for building themes correctly.

### Resolution Order (Highest to Lowest Priority)

```
1. Context-level override       (button-bg-hover for disabled state)
2. Component-level override     (button-bg from ComponentThemes)
3. Venture theme override       (theme_overrides table)
4. Current theme tokens         (themes.tokens JSONB column)
5. Parent theme tokens          (recursive up the inheritance chain)
6. System default theme         (DEFAULT_THEME constant)
```

### Token Reference Syntax

Tokens can reference other tokens using curly-brace syntax:

```typescript
// In a theme definition:
{
  colors: {
    semantic: {
      primary: { 500: '#6366F1' },          // Literal value
    },
    surface: {
      ring: '{colors.semantic.primary.500}', // Reference → resolves to '#6366F1'
    },
  },
}
```

The resolver performs a depth-first traversal, detecting and preventing circular references. Maximum reference depth is 10 levels (configurable via `THEME_MAX_TOKEN_DEPTH`).

### Flattened Token Paths

After resolution, the token tree is flattened to dot-notation paths that map 1:1 to CSS variable names:

```
colors.semantic.primary.50   →  --color-primary-50
colors.semantic.primary.500  →  --color-primary-500
colors.surface.background    →  --color-surface-background
typography.fonts.sans        →  --font-sans
spacing.4                    →  --spacing-4
radii.md                     →  --radius-md
shadows.lg                   →  --shadow-lg
```

The `CSS_VARIABLE_PREFIX` constant (default: empty string, yielding `--color-*`, `--font-*`, etc.) can be set per-venture to namespace variables when multiple themes coexist on a single page (e.g., `--acme-color-primary-500`).

---

## Core Interfaces

### Theme

```typescript
interface Theme {
  /** Unique theme identifier */
  id: UUID;

  /** Venture this theme belongs to */
  ventureId: VentureID;

  /** Human-readable name */
  name: string;

  /** URL-safe slug (unique per venture) */
  slug: string;

  /** Optional description for admin UI */
  description?: string;

  /** Color mode: light, dark, auto (system preference), high-contrast */
  mode: ThemeMode;

  /** Parent theme ID for inheritance (null = root theme) */
  parent?: UUID;

  /** Complete design token tree */
  tokens: ThemeTokens;

  /** Per-component style overrides */
  components: ComponentThemes;

  /** Brand assets and identity configuration */
  brand: BrandConfig;

  /** Arbitrary metadata (tags, notes, version labels) */
  metadata: Record<string, unknown>;

  /** Schema version — incremented on every save */
  version: number;

  /** Whether this is the venture's default theme */
  isDefault: boolean;

  /** System themes (DEFAULT, DARK, HIGH_CONTRAST) cannot be deleted */
  isSystem: boolean;

  /** Creation timestamp */
  createdAt: ISOTimestamp;

  /** Last modification timestamp */
  updatedAt: ISOTimestamp;
}

type ThemeMode = 'light' | 'dark' | 'auto' | 'high-contrast';
```

### ThemeConfig (Creation Input)

```typescript
/** Input for createTheme() — validated against Zod schema */
interface ThemeConfig {
  ventureId: string;
  name: string;
  slug: string;
  description?: string;
  mode: ThemeMode;
  parentId?: string;                     // Extend existing theme
  tokens: DeepPartial<ThemeTokens>;      // Only override tokens are required
  components?: ComponentThemes;
  brand?: Partial<BrandConfig>;
  metadata?: Record<string, unknown>;
}
```

### ThemeTokens

```typescript
interface ThemeTokens {
  // ═══════════════════════════════════════════════════════════════════════════
  // COLORS
  // ═══════════════════════════════════════════════════════════════════════════

  colors: {
    /** Raw color values — the palette primitives */
    primitives: Record<string, string>;

    /** Meaning-based color assignments */
    semantic: SemanticColors;

    /** Surface and background colors */
    surface: SurfaceColors;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // TYPOGRAPHY
  // ═══════════════════════════════════════════════════════════════════════════

  typography: TypographyTokens;

  // ═══════════════════════════════════════════════════════════════════════════
  // SPACING & LAYOUT
  // ═══════════════════════════════════════════════════════════════════════════

  spacing: Record<string, string>;      // '1': '4px', '2': '8px', ...
  radii: Record<string, string>;        // 'sm': '4px', 'md': '8px', ...
  shadows: Record<string, string>;      // 'sm': '0 1px 2px ...', ...
  borders: Record<string, string>;      // 'default': '1px solid ...', ...
  breakpoints: Record<string, string>;  // 'sm': '640px', 'md': '768px', ...
  transitions: Record<string, string>;  // 'fast': '150ms ease', ...
  zIndices: Record<string, number>;     // 'modal': 1000, 'toast': 1100, ...
}
```

### SemanticColors & SurfaceColors

```typescript
interface SemanticColors {
  primary: ColorScale;
  secondary: ColorScale;
  accent: ColorScale;
  neutral: ColorScale;
  success: ColorScale;
  warning: ColorScale;
  error: ColorScale;
  info: ColorScale;
}

interface SurfaceColors {
  /** Page background */
  background: string;

  /** Default text color */
  foreground: string;

  /** Card / panel background */
  card: string;

  /** Card text color */
  cardForeground: string;

  /** Popover / dropdown background */
  popover: string;

  /** Popover text color */
  popoverForeground: string;

  /** Muted / disabled background */
  muted: string;

  /** Muted text color (placeholders, secondary text) */
  mutedForeground: string;

  /** Default border color */
  border: string;

  /** Input field border color */
  input: string;

  /** Focus ring color */
  ring: string;
}

interface ColorScale {
  50: string;                            // Lightest tint
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;                           // Base / default
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;                           // Darkest shade
}
```

### TypographyTokens

```typescript
interface TypographyTokens {
  /** Font family stacks */
  fonts: {
    sans: string;                        // 'Inter, system-ui, sans-serif'
    serif: string;                       // 'Merriweather, Georgia, serif'
    mono: string;                        // 'JetBrains Mono, monospace'
    display?: string;                    // Optional display/heading font
  };

  /** Named type scales (maps to Tailwind's text-* utilities) */
  sizes: Record<string, TypeScale>;

  /** Font weight map */
  weights: Record<string, number>;

  /** Line height presets */
  lineHeights: Record<string, number | string>;

  /** Letter spacing presets */
  letterSpacing: Record<string, string>;
}

interface TypeScale {
  fontSize: string;                      // e.g., '1rem'
  lineHeight: string;                    // e.g., '1.5rem'
  letterSpacing?: string;                // e.g., '-0.025em'
  fontWeight?: number;                   // e.g., 700 for headings
}
```

### ComponentThemes

```typescript
interface ComponentThemes {
  button?: ComponentTheme;
  input?: ComponentTheme;
  card?: ComponentTheme;
  badge?: ComponentTheme;
  avatar?: ComponentTheme;
  table?: ComponentTheme;
  sidebar?: ComponentTheme;
  navbar?: ComponentTheme;
  dialog?: ComponentTheme;
  toast?: ComponentTheme;
  dropdown?: ComponentTheme;
  tabs?: ComponentTheme;
  tooltip?: ComponentTheme;
  [component: string]: ComponentTheme | undefined;
}

interface ComponentTheme {
  /** Base styles applied to all variants */
  base: Record<string, string>;

  /** Variant-specific overrides (e.g., primary, outline, ghost) */
  variants?: Record<string, Record<string, string>>;

  /** Size-specific overrides (e.g., sm, md, lg) */
  sizes?: Record<string, Record<string, string>>;

  /** State overrides (hover, focus, disabled, active, loading) */
  states?: Record<string, Record<string, string>>;
}
```

### BrandConfig

```typescript
interface BrandConfig {
  /** Primary logo URL (full color, for light backgrounds) */
  logoUrl?: string;

  /** Logo for dark backgrounds (reversed/white version) */
  logoDarkUrl?: string;

  /** Small logo / icon mark (used in favicon, mobile, compact layouts) */
  logomarkUrl?: string;

  /** Browser favicon URL */
  faviconUrl?: string;

  /** Custom font files to load */
  customFonts?: CustomFont[];

  /** Brand-specific metadata displayed in UI chrome */
  meta?: {
    companyName?: string;
    tagline?: string;
    supportEmail?: string;
    websiteUrl?: string;
    copyrightNotice?: string;
  };
}

interface CustomFont {
  /** CSS font-family name */
  family: string;

  /** Font weight (100-900) */
  weight: number;

  /** Normal or italic */
  style: 'normal' | 'italic';

  /** URL to font file (CDN or uploaded) */
  src: string;

  /** Font file format */
  format: 'woff2' | 'woff' | 'ttf' | 'otf';

  /** Font display strategy (swap recommended for custom fonts) */
  display: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
}
```

### CSS Output Types

```typescript
/** Flat map of CSS variable name → value */
interface CssVariableMap {
  [variableName: string]: string;        // '--color-primary-500': '#6366F1'
}

/** Tailwind theme configuration object */
interface TailwindThemeConfig {
  colors: Record<string, string | Record<string, string>>;
  fontFamily: Record<string, string[]>;
  fontSize: Record<string, [string, { lineHeight: string; letterSpacing?: string }]>;
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
  boxShadow: Record<string, string>;
  transitionDuration: Record<string, string>;
  zIndex: Record<string, string>;
}

/** Inline style map for email/PDF rendering */
interface InlineStyleMap {
  [tokenPath: string]: string;           // 'colors.semantic.primary.500': '#6366F1'
}
```

### ContrastResult & Accessibility

```typescript
interface ContrastResult {
  /** WCAG contrast ratio (1.0 – 21.0) */
  ratio: number;

  /** Passes WCAG AA for normal text (≥4.5:1) */
  aa: boolean;

  /** Passes WCAG AAA for normal text (≥7:1) */
  aaa: boolean;

  /** Passes WCAG AA for large text (≥3:1) */
  aaLargeText: boolean;

  /** Passes WCAG AAA for large text (≥4.5:1) */
  aaaLargeText: boolean;

  /** Suggested adjusted foreground color (if contrast fails) */
  suggestedForeground?: string;

  /** Suggested adjusted background color (if contrast fails) */
  suggestedBackground?: string;
}

type AccessibilityLevel = 'AA' | 'AAA';
```

### ThemeOverride

```typescript
/** Per-venture token override stored in theme_overrides table */
interface ThemeOverride {
  id: UUID;
  ventureId: VentureID;
  themeId: UUID;

  /** Dot-path to the token being overridden */
  tokenPath: string;                     // e.g., 'colors.semantic.primary.500'

  /** Override value */
  value: string;                         // e.g., '#FF6600'

  /** Priority for cascade ordering (higher wins) */
  priority: number;

  /** Who created this override */
  createdBy: UUID;

  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}
```

### Theme Export / Import

```typescript
/** Portable theme format for export/import */
interface ThemeExport {
  /** Export format version */
  formatVersion: '1.0';

  /** Theme metadata */
  theme: {
    name: string;
    slug: string;
    description?: string;
    mode: ThemeMode;
  };

  /** Full resolved token tree */
  tokens: ThemeTokens;

  /** Component overrides */
  components: ComponentThemes;

  /** Brand configuration (logo URLs may need re-mapping) */
  brand: BrandConfig;

  /** Checksum for integrity verification */
  checksum: string;

  /** Export timestamp */
  exportedAt: ISOTimestamp;
}

interface ThemeImport {
  /** The exported theme data */
  data: ThemeExport;

  /** Target venture to import into */
  ventureId: string;

  /** Slug override (if slug already exists in target venture) */
  slugOverride?: string;

  /** Whether to set as default after import */
  setAsDefault?: boolean;
}
```

### TokenDiff

```typescript
/** Result of diffTokens() — differences between two token trees */
interface TokenDiff {
  /** Tokens that were added (present in B, absent in A) */
  added: Record<string, string>;

  /** Tokens that were removed (present in A, absent in B) */
  removed: Record<string, string>;

  /** Tokens whose values changed */
  changed: Record<string, { from: string; to: string }>;

  /** Total number of differences */
  totalChanges: number;
}
```

---

## Database Schema

### themes Table

```typescript
export const themes = pgTable('themes', {
  // ═══════════════════════════════════════════════════════════════════════════
  // PRIMARY KEY
  // ═══════════════════════════════════════════════════════════════════════════

  id: uuid('id').primaryKey().defaultRandom(),

  // ═══════════════════════════════════════════════════════════════════════════
  // SCOPE
  // ═══════════════════════════════════════════════════════════════════════════

  ventureId: uuid('venture_id').references(() => ventures.id).notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // IDENTITY
  // ═══════════════════════════════════════════════════════════════════════════

  name: varchar('name', { length: 128 }).notNull(),
  slug: varchar('slug', { length: 128 }).notNull(),
  description: text('description'),
  mode: varchar('mode', { length: 20 }).notNull().default('light'),

  // ═══════════════════════════════════════════════════════════════════════════
  // INHERITANCE
  // ═══════════════════════════════════════════════════════════════════════════

  // Parent theme for token inheritance (null = root theme)
  parentId: uuid('parent_id').references(() => themes.id),

  // ═══════════════════════════════════════════════════════════════════════════
  // TOKEN DATA
  // ═══════════════════════════════════════════════════════════════════════════

  // Full token tree stored as JSONB (only override tokens for child themes)
  tokens: jsonb('tokens').notNull(),

  // Component-level overrides
  components: jsonb('components').notNull().default('{}'),

  // Brand configuration (logo URLs, custom fonts, company info)
  brand: jsonb('brand').notNull().default('{}'),

  // ═══════════════════════════════════════════════════════════════════════════
  // METADATA
  // ═══════════════════════════════════════════════════════════════════════════

  metadata: jsonb('metadata').notNull().default('{}'),
  version: integer('version').notNull().default(1),
  isDefault: boolean('is_default').notNull().default(false),
  isSystem: boolean('is_system').notNull().default(false),

  // ═══════════════════════════════════════════════════════════════════════════
  // TIMESTAMPS
  // ═══════════════════════════════════════════════════════════════════════════

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('themes_venture_slug_unique').on(table.ventureId, table.slug),
  index('themes_venture_default_idx').on(table.ventureId, table.isDefault),
  index('themes_parent_id_idx').on(table.parentId),
  index('themes_mode_idx').on(table.ventureId, table.mode),
]);
```

### theme_overrides Table

```typescript
export const themeOverrides = pgTable('theme_overrides', {
  // ═══════════════════════════════════════════════════════════════════════════
  // PRIMARY KEY
  // ═══════════════════════════════════════════════════════════════════════════

  id: uuid('id').primaryKey().defaultRandom(),

  // ═══════════════════════════════════════════════════════════════════════════
  // SCOPE
  // ═══════════════════════════════════════════════════════════════════════════

  ventureId: uuid('venture_id').references(() => ventures.id).notNull(),
  themeId: uuid('theme_id').references(() => themes.id).notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // OVERRIDE DATA
  // ═══════════════════════════════════════════════════════════════════════════

  // Dot-path to the token (e.g., 'colors.semantic.primary.500')
  tokenPath: varchar('token_path', { length: 256 }).notNull(),

  // Override value (e.g., '#FF6600')
  value: text('value').notNull(),

  // Priority for cascade ordering (higher wins)
  priority: integer('priority').notNull().default(0),

  // ═══════════════════════════════════════════════════════════════════════════
  // AUDIT
  // ═══════════════════════════════════════════════════════════════════════════

  createdBy: uuid('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('theme_overrides_unique').on(table.themeId, table.tokenPath),
  index('theme_overrides_venture_idx').on(table.ventureId),
]);
```

### venture_brand Table

```typescript
export const ventureBrand = pgTable('venture_brand', {
  // ═══════════════════════════════════════════════════════════════════════════
  // PRIMARY KEY
  // ═══════════════════════════════════════════════════════════════════════════

  id: uuid('id').primaryKey().defaultRandom(),

  // ═══════════════════════════════════════════════════════════════════════════
  // SCOPE
  // ═══════════════════════════════════════════════════════════════════════════

  ventureId: uuid('venture_id').references(() => ventures.id).notNull().unique(),

  // ═══════════════════════════════════════════════════════════════════════════
  // BRAND ASSETS
  // ═══════════════════════════════════════════════════════════════════════════

  // Primary logo (full color, light background)
  logoUrl: varchar('logo_url', { length: 512 }),

  // Logo for dark backgrounds
  logoDarkUrl: varchar('logo_dark_url', { length: 512 }),

  // Icon mark / small logo
  logomarkUrl: varchar('logomark_url', { length: 512 }),

  // Browser favicon
  faviconUrl: varchar('favicon_url', { length: 512 }),

  // ═══════════════════════════════════════════════════════════════════════════
  // CUSTOM FONTS
  // ═══════════════════════════════════════════════════════════════════════════

  // Array of CustomFont objects
  customFonts: jsonb('custom_fonts').notNull().default('[]'),

  // ═══════════════════════════════════════════════════════════════════════════
  // BRAND METADATA
  // ═══════════════════════════════════════════════════════════════════════════

  companyName: varchar('company_name', { length: 256 }),
  tagline: varchar('tagline', { length: 512 }),
  supportEmail: varchar('support_email', { length: 256 }),
  websiteUrl: varchar('website_url', { length: 512 }),
  copyrightNotice: varchar('copyright_notice', { length: 512 }),

  // ═══════════════════════════════════════════════════════════════════════════
  // TIMESTAMPS
  // ═══════════════════════════════════════════════════════════════════════════

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### theme_versions Table

```typescript
export const themeVersions = pgTable('theme_versions', {
  // ═══════════════════════════════════════════════════════════════════════════
  // PRIMARY KEY
  // ═══════════════════════════════════════════════════════════════════════════

  id: uuid('id').primaryKey().defaultRandom(),

  // ═══════════════════════════════════════════════════════════════════════════
  // SCOPE
  // ═══════════════════════════════════════════════════════════════════════════

  themeId: uuid('theme_id').references(() => themes.id).notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // SNAPSHOT
  // ═══════════════════════════════════════════════════════════════════════════

  // Version number at the time of snapshot
  version: integer('version').notNull(),

  // Full theme state as JSONB (tokens + components + brand)
  snapshot: jsonb('snapshot').notNull(),

  // What changed in this version
  changeDescription: text('change_description'),

  // Who made the change
  changedBy: uuid('changed_by').references(() => users.id),

  // ═══════════════════════════════════════════════════════════════════════════
  // TIMESTAMPS
  // ═══════════════════════════════════════════════════════════════════════════

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('theme_versions_theme_idx').on(table.themeId, table.version),
  index('theme_versions_created_idx').on(table.themeId, table.createdAt),
]);
```

### theme_cache Table

```typescript
export const themeCache = pgTable('theme_cache', {
  // ═══════════════════════════════════════════════════════════════════════════
  // PRIMARY KEY
  // ═══════════════════════════════════════════════════════════════════════════

  id: uuid('id').primaryKey().defaultRandom(),

  // ═══════════════════════════════════════════════════════════════════════════
  // SCOPE
  // ═══════════════════════════════════════════════════════════════════════════

  themeId: uuid('theme_id').references(() => themes.id).notNull(),

  // Cache key: format identifier (e.g., 'css-root', 'css-scoped', 'tailwind', 'inline')
  cacheKey: varchar('cache_key', { length: 64 }).notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // CACHED OUTPUT
  // ═══════════════════════════════════════════════════════════════════════════

  // Pre-computed output (CSS string, JSON config, etc.)
  output: text('output').notNull(),

  // Theme version at cache time (invalidated when version changes)
  themeVersion: integer('theme_version').notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // TIMESTAMPS
  // ═══════════════════════════════════════════════════════════════════════════

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
}, (table) => [
  uniqueIndex('theme_cache_key_unique').on(table.themeId, table.cacheKey),
  index('theme_cache_expires_idx').on(table.expiresAt),
]);
```

---

## Usage Examples

### Example 1: Create a Venture Theme

```typescript
import { createTheme, generateColorScale } from '@mcv/shared/theming';

// ═══════════════════════════════════════════════════════════════════════════════
// Create a fully branded theme from a single primary color
// ═══════════════════════════════════════════════════════════════════════════════

const acmeTheme = await createTheme({
  ventureId: 'acme-venture-uuid',
  name: 'Acme Brand',
  slug: 'acme-brand',
  mode: 'light',
  tokens: {
    colors: {
      primitives: {},
      semantic: {
        primary: generateColorScale('#6366F1'),   // Indigo
        secondary: generateColorScale('#EC4899'),  // Pink
        accent: generateColorScale('#F59E0B'),     // Amber
        neutral: generateColorScale('#6B7280'),    // Gray
        success: generateColorScale('#22C55E'),
        warning: generateColorScale('#F59E0B'),
        error: generateColorScale('#EF4444'),
        info: generateColorScale('#3B82F6'),
      },
      surface: {
        background: '#FFFFFF',
        foreground: '#0F172A',
        card: '#FFFFFF',
        cardForeground: '#0F172A',
        popover: '#FFFFFF',
        popoverForeground: '#0F172A',
        muted: '#F1F5F9',
        mutedForeground: '#64748B',
        border: '#E2E8F0',
        input: '#E2E8F0',
        ring: '#6366F1',
      },
    },
    typography: {
      fonts: {
        sans: 'Inter, system-ui, sans-serif',
        serif: 'Merriweather, Georgia, serif',
        mono: 'JetBrains Mono, Fira Code, monospace',
      },
      sizes: {
        xs:    { fontSize: '0.75rem',  lineHeight: '1rem' },
        sm:    { fontSize: '0.875rem', lineHeight: '1.25rem' },
        base:  { fontSize: '1rem',     lineHeight: '1.5rem' },
        lg:    { fontSize: '1.125rem', lineHeight: '1.75rem' },
        xl:    { fontSize: '1.25rem',  lineHeight: '1.75rem' },
        '2xl': { fontSize: '1.5rem',   lineHeight: '2rem' },
        '3xl': { fontSize: '1.875rem', lineHeight: '2.25rem' },
        '4xl': { fontSize: '2.25rem',  lineHeight: '2.5rem' },
        '5xl': { fontSize: '3rem',     lineHeight: '1' },
      },
      weights: { light: 300, normal: 400, medium: 500, semibold: 600, bold: 700 },
      lineHeights: { tight: 1.25, snug: 1.375, normal: 1.5, relaxed: 1.625, loose: 2 },
      letterSpacing: { tighter: '-0.05em', tight: '-0.025em', normal: '0em', wide: '0.025em', wider: '0.05em' },
    },
    spacing: {
      '0': '0px', '0.5': '2px', '1': '4px', '1.5': '6px', '2': '8px',
      '2.5': '10px', '3': '12px', '3.5': '14px', '4': '16px', '5': '20px',
      '6': '24px', '7': '28px', '8': '32px', '9': '36px', '10': '40px',
      '11': '44px', '12': '48px', '14': '56px', '16': '64px', '20': '80px',
      '24': '96px', '28': '112px', '32': '128px', '36': '144px',
      '40': '160px', '44': '176px', '48': '192px',
    },
    radii: {
      none: '0px', sm: '2px', DEFAULT: '4px', md: '6px',
      lg: '8px', xl: '12px', '2xl': '16px', '3xl': '24px', full: '9999px',
    },
    shadows: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
      none: '0 0 #0000',
    },
    borders: {
      default: '1px solid var(--color-border)',
      thick: '2px solid var(--color-border)',
    },
    breakpoints: {
      sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px',
    },
    transitions: {
      fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
      normal: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
      slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
      spring: '500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
    zIndices: {
      base: 0, dropdown: 1000, sticky: 1100, fixed: 1200,
      modalBackdrop: 1300, modal: 1400, popover: 1500, toast: 1600, tooltip: 1700,
    },
  },
  components: {},
  brand: {
    logoUrl: 'https://cdn.acme.com/logo.svg',
    logoDarkUrl: 'https://cdn.acme.com/logo-white.svg',
    faviconUrl: 'https://cdn.acme.com/favicon.ico',
  },
});
```

### Example 2: Extend Theme for Dark Mode

```typescript
import { extendTheme } from '@mcv/shared/theming';

// ═══════════════════════════════════════════════════════════════════════════════
// Create dark variant by extending the light theme
// Only surface colors and shadows change — semantic palette stays the same
// ═══════════════════════════════════════════════════════════════════════════════

const darkTheme = await extendTheme(acmeTheme.id, {
  name: 'Acme Brand Dark',
  slug: 'acme-brand-dark',
  mode: 'dark',
  tokens: {
    colors: {
      surface: {
        background: '#0F172A',
        foreground: '#F8FAFC',
        card: '#1E293B',
        cardForeground: '#F8FAFC',
        popover: '#1E293B',
        popoverForeground: '#F8FAFC',
        muted: '#334155',
        mutedForeground: '#94A3B8',
        border: '#334155',
        input: '#334155',
        ring: '#818CF8',
      },
    },
    shadows: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
      DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.4)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.4)',
    },
  },
});

// darkTheme inherits ALL tokens from acmeTheme (primary colors, typography,
// spacing, radii, etc.) — only the overridden surface colors and shadows differ.
```

### Example 3: Generate CSS Variables

```typescript
import { generateCssVariables, generateScopedCss, generateFontFaceRules } from '@mcv/shared/theming';

// ═══════════════════════════════════════════════════════════════════════════════
// Generate global CSS custom properties
// ═══════════════════════════════════════════════════════════════════════════════

const css = generateCssVariables(acmeTheme);
// Output:
// :root {
//   /* Colors — Semantic — Primary */
//   --color-primary-50: #EEF2FF;
//   --color-primary-100: #E0E7FF;
//   --color-primary-200: #C7D2FE;
//   --color-primary-300: #A5B4FC;
//   --color-primary-400: #818CF8;
//   --color-primary-500: #6366F1;
//   --color-primary-600: #4F46E5;
//   --color-primary-700: #4338CA;
//   --color-primary-800: #3730A3;
//   --color-primary-900: #312E81;
//   --color-primary-950: #1E1B4B;
//
//   /* Colors — Surface */
//   --color-surface-background: #FFFFFF;
//   --color-surface-foreground: #0F172A;
//   --color-surface-card: #FFFFFF;
//   --color-surface-card-foreground: #0F172A;
//   ...
//
//   /* Typography */
//   --font-sans: Inter, system-ui, sans-serif;
//   --font-serif: Merriweather, Georgia, serif;
//   --font-mono: JetBrains Mono, Fira Code, monospace;
//
//   /* Spacing */
//   --spacing-1: 4px;
//   --spacing-2: 8px;
//   --spacing-4: 16px;
//   ...
//
//   /* Radii */
//   --radius-sm: 2px;
//   --radius-md: 6px;
//   --radius-lg: 8px;
//   ...
//
//   /* Shadows */
//   --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
//   --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
//   ...
// }

// ═══════════════════════════════════════════════════════════════════════════════
// Generate scoped CSS for embedded widgets
// ═══════════════════════════════════════════════════════════════════════════════

const scopedCss = generateScopedCss(acmeTheme, '.mcv-widget');
// Output:
// .mcv-widget {
//   --color-primary-500: #6366F1;
//   --color-surface-background: #FFFFFF;
//   ...
// }

// ═══════════════════════════════════════════════════════════════════════════════
// Generate @font-face rules for custom fonts
// ═══════════════════════════════════════════════════════════════════════════════

const fontCss = generateFontFaceRules(acmeTheme.brand.customFonts ?? []);
// Output:
// @font-face {
//   font-family: 'ClientSans';
//   font-weight: 400;
//   font-style: normal;
//   font-display: swap;
//   src: url('https://cdn.clientco.com/fonts/ClientSans-Regular.woff2') format('woff2');
// }
```

### Example 4: Generate Tailwind Config

```typescript
import { generateTailwindConfig } from '@mcv/shared/theming';

// ═══════════════════════════════════════════════════════════════════════════════
// Generate Tailwind CSS theme configuration
// Uses CSS variable references so the same Tailwind config works
// across light/dark/high-contrast modes
// ═══════════════════════════════════════════════════════════════════════════════

const tailwindTheme = generateTailwindConfig(acmeTheme);
// Output:
// {
//   colors: {
//     primary: {
//       50:  'var(--color-primary-50)',
//       100: 'var(--color-primary-100)',
//       200: 'var(--color-primary-200)',
//       300: 'var(--color-primary-300)',
//       400: 'var(--color-primary-400)',
//       500: 'var(--color-primary-500)',
//       600: 'var(--color-primary-600)',
//       700: 'var(--color-primary-700)',
//       800: 'var(--color-primary-800)',
//       900: 'var(--color-primary-900)',
//       950: 'var(--color-primary-950)',
//       DEFAULT: 'var(--color-primary-500)',
//     },
//     secondary: { ... },
//     accent: { ... },
//     background: 'var(--color-surface-background)',
//     foreground: 'var(--color-surface-foreground)',
//     card: {
//       DEFAULT:    'var(--color-surface-card)',
//       foreground: 'var(--color-surface-card-foreground)',
//     },
//     muted: {
//       DEFAULT:    'var(--color-surface-muted)',
//       foreground: 'var(--color-surface-muted-foreground)',
//     },
//     border: 'var(--color-surface-border)',
//     input:  'var(--color-surface-input)',
//     ring:   'var(--color-surface-ring)',
//   },
//   fontFamily: {
//     sans: ['var(--font-sans)'],
//     serif: ['var(--font-serif)'],
//     mono: ['var(--font-mono)'],
//   },
//   borderRadius: {
//     sm:  'var(--radius-sm)',
//     DEFAULT: 'var(--radius-DEFAULT)',
//     md:  'var(--radius-md)',
//     lg:  'var(--radius-lg)',
//     xl:  'var(--radius-xl)',
//     full:'var(--radius-full)',
//   },
//   boxShadow: {
//     sm: 'var(--shadow-sm)',
//     DEFAULT: 'var(--shadow-DEFAULT)',
//     md: 'var(--shadow-md)',
//     lg: 'var(--shadow-lg)',
//   },
// }

// Usage in tailwind.config.ts:
// import { generateTailwindConfig } from '@mcv/shared/theming';
// import { acmeTheme } from './themes';
//
// export default {
//   theme: {
//     extend: generateTailwindConfig(acmeTheme),
//   },
// };
```

### Example 5: React ThemeProvider

```tsx
import { ThemeProvider, useTheme, useDesignTokens } from '@mcv/shared/theming';

// ═══════════════════════════════════════════════════════════════════════════════
// Wrap app with ThemeProvider
// ═══════════════════════════════════════════════════════════════════════════════

function App({ ventureId }: { ventureId: string }) {
  return (
    <ThemeProvider
      ventureId={ventureId}
      defaultMode="auto"              // Follows system preference
      storageKey="mcv-color-mode"     // Persists preference to localStorage
      enableTransitions={true}        // Smooth CSS transitions on mode switch
    >
      <Dashboard />
    </ThemeProvider>
  );
}

function Dashboard() {
  const { theme, mode, setMode, toggleDarkMode, resolveToken } = useTheme();
  const tokens = useDesignTokens();

  return (
    <div>
      <header style={{ background: tokens.surface.card }}>
        <img
          src={mode === 'dark' ? theme.brand.logoDarkUrl : theme.brand.logoUrl}
          alt={theme.name}
        />
        <nav className="flex gap-4">
          <button onClick={() => setMode('light')}>☀️</button>
          <button onClick={() => setMode('dark')}>🌙</button>
          <button onClick={() => setMode('auto')}>🖥️</button>
        </nav>
      </header>

      {/* Tokens are available as plain values for dynamic styling */}
      <div style={{
        padding: tokens.spacing[6],
        borderRadius: tokens.radii.lg,
        color: resolveToken('colors.surface.foreground'),
      }}>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to {theme.brand.meta?.companyName}</p>
      </div>
    </div>
  );
}
```

### Example 6: Color Scale Generation & Accessibility

```typescript
import {
  generateColorScale,
  getContrastRatio,
  isAccessible,
  adjustContrast,
  mixColors,
  toOklch,
} from '@mcv/shared/theming';

// ═══════════════════════════════════════════════════════════════════════════════
// Generate a full color scale from a single brand color
// ═══════════════════════════════════════════════════════════════════════════════

const brandPurple = generateColorScale('#7C3AED');
// {
//   50:  '#F5F3FF',
//   100: '#EDE9FE',
//   200: '#DDD6FE',
//   300: '#C4B5FD',
//   400: '#A78BFA',
//   500: '#7C3AED',   ← Input color becomes the 500
//   600: '#6D28D9',
//   700: '#5B21B6',
//   800: '#4C1D95',
//   900: '#3B0764',
//   950: '#2E1065',
// }

// ═══════════════════════════════════════════════════════════════════════════════
// Check WCAG contrast ratios
// ═══════════════════════════════════════════════════════════════════════════════

const ratio = getContrastRatio(brandPurple[500], '#FFFFFF');
console.log(`Contrast ratio: ${ratio.toFixed(2)}`);  // 4.63
console.log(`AA compliant:  ${isAccessible(brandPurple[500], '#FFFFFF', 'AA')}`);   // true
console.log(`AAA compliant: ${isAccessible(brandPurple[500], '#FFFFFF', 'AAA')}`);  // false

// ═══════════════════════════════════════════════════════════════════════════════
// Auto-adjust color to meet contrast requirement
// ═══════════════════════════════════════════════════════════════════════════════

const adjustedColor = adjustContrast(brandPurple[500], '#FFFFFF', 'AAA');
// Returns a darker shade of purple that passes AAA (7:1)
console.log(adjustedColor);               // '#5B21B6' (darkened to meet threshold)
console.log(getContrastRatio(adjustedColor, '#FFFFFF'));  // 7.24

// ═══════════════════════════════════════════════════════════════════════════════
// Mix colors for intermediate values
// ═══════════════════════════════════════════════════════════════════════════════

const blended = mixColors('#FF0000', '#0000FF', 0.5); // 50% mix
console.log(blended); // '#800080' (purple)

// ═══════════════════════════════════════════════════════════════════════════════
// Convert to modern CSS color formats
// ═══════════════════════════════════════════════════════════════════════════════

console.log(toOklch('#6366F1'));  // 'oklch(0.546 0.245 264.1deg)'
```

### Example 7: Component-Level Theming

```typescript
import { createTheme } from '@mcv/shared/theming';

// ═══════════════════════════════════════════════════════════════════════════════
// Override specific component styles per venture
// Components reference tokens via CSS variables, so they adapt to theme changes
// ═══════════════════════════════════════════════════════════════════════════════

const theme = await createTheme({
  ventureId: 'venture-uuid',
  name: 'Custom Components',
  slug: 'custom-components',
  mode: 'light',
  tokens: { /* ... base tokens ... */ },
  components: {
    button: {
      base: {
        borderRadius: 'var(--radius-full)',   // Pill-shaped buttons
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        transition: 'var(--transition-fast)',
      },
      variants: {
        primary: {
          background: 'var(--color-primary-500)',
          color: '#FFFFFF',
          boxShadow: 'var(--shadow-sm)',
        },
        secondary: {
          background: 'var(--color-secondary-500)',
          color: '#FFFFFF',
        },
        outline: {
          background: 'transparent',
          borderColor: 'var(--color-primary-500)',
          border: '2px solid var(--color-primary-500)',
          color: 'var(--color-primary-500)',
        },
        ghost: {
          background: 'transparent',
          color: 'var(--color-primary-500)',
        },
        destructive: {
          background: 'var(--color-error-500)',
          color: '#FFFFFF',
        },
      },
      sizes: {
        xs: { padding: '4px 8px', fontSize: '0.75rem', height: '28px' },
        sm: { padding: '6px 12px', fontSize: '0.8125rem', height: '32px' },
        md: { padding: '10px 20px', fontSize: '0.875rem', height: '40px' },
        lg: { padding: '14px 28px', fontSize: '1rem', height: '48px' },
        xl: { padding: '18px 36px', fontSize: '1.125rem', height: '56px' },
      },
      states: {
        hover: { opacity: '0.9', transform: 'translateY(-1px)', boxShadow: 'var(--shadow-md)' },
        active: { transform: 'translateY(0)', boxShadow: 'var(--shadow-sm)' },
        focus: { outline: '2px solid var(--color-surface-ring)', outlineOffset: '2px' },
        disabled: { opacity: '0.5', cursor: 'not-allowed', pointerEvents: 'none' },
        loading: { opacity: '0.7', cursor: 'wait' },
      },
    },
    card: {
      base: {
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-surface-border)',
        boxShadow: 'var(--shadow-sm)',
        background: 'var(--color-surface-card)',
        color: 'var(--color-surface-card-foreground)',
      },
      variants: {
        elevated: { boxShadow: 'var(--shadow-lg)', border: 'none' },
        outline: { boxShadow: 'none', border: '2px solid var(--color-surface-border)' },
        ghost: { boxShadow: 'none', border: 'none', background: 'transparent' },
      },
    },
    sidebar: {
      base: {
        background: 'var(--color-surface-card)',
        borderRight: '1px solid var(--color-surface-border)',
        width: '280px',
      },
    },
    toast: {
      base: {
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        padding: 'var(--spacing-4)',
      },
      variants: {
        success: { borderLeft: '4px solid var(--color-success-500)' },
        error: { borderLeft: '4px solid var(--color-error-500)' },
        warning: { borderLeft: '4px solid var(--color-warning-500)' },
        info: { borderLeft: '4px solid var(--color-info-500)' },
      },
    },
  },
  brand: {},
});
```

### Example 8: White-Label Configuration

```typescript
import { createTheme } from '@mcv/shared/theming';

// ═══════════════════════════════════════════════════════════════════════════════
// Complete white-label setup for a client venture
// Everything branded: logo, fonts, colors, component shapes, metadata
// ═══════════════════════════════════════════════════════════════════════════════

const whitelabelTheme = await createTheme({
  ventureId: 'client-venture-uuid',
  name: 'ClientCo Brand',
  slug: 'clientco',
  mode: 'light',
  tokens: {
    colors: {
      primitives: {
        'clientco-blue': '#0052CC',
        'clientco-navy': '#003087',
        'clientco-gold': '#FFB800',
      },
      semantic: {
        primary: generateColorScale('#0052CC'),
        secondary: generateColorScale('#003087'),
        accent: generateColorScale('#FFB800'),
        neutral: generateColorScale('#6B7280'),
        success: generateColorScale('#22C55E'),
        warning: generateColorScale('#F59E0B'),
        error: generateColorScale('#EF4444'),
        info: generateColorScale('#3B82F6'),
      },
      surface: {
        background: '#FAFBFC',
        foreground: '#172B4D',
        card: '#FFFFFF',
        cardForeground: '#172B4D',
        popover: '#FFFFFF',
        popoverForeground: '#172B4D',
        muted: '#F4F5F7',
        mutedForeground: '#6B778C',
        border: '#DFE1E6',
        input: '#DFE1E6',
        ring: '#0052CC',
      },
    },
    typography: {
      fonts: {
        sans: 'ClientSans, system-ui, sans-serif',   // Custom brand font
        serif: 'Georgia, serif',
        mono: 'SF Mono, Menlo, monospace',
      },
      sizes: { /* ... */ },
      weights: { normal: 400, medium: 500, semibold: 600, bold: 700 },
      lineHeights: { tight: 1.2, normal: 1.5, relaxed: 1.75 },
      letterSpacing: { tight: '-0.015em', normal: '0em', wide: '0.02em' },
    },
    spacing: { /* ... Tailwind-compatible spacing scale ... */ },
    radii: {
      none: '0px', sm: '3px', DEFAULT: '4px', md: '6px',
      lg: '8px', xl: '12px', '2xl': '16px', full: '9999px',
    },
    shadows: { /* ... */ },
    borders: { default: '1px solid var(--color-border)' },
    breakpoints: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px' },
    transitions: { fast: '150ms ease', normal: '200ms ease', slow: '300ms ease' },
    zIndices: { dropdown: 1000, sticky: 1100, modal: 1200, popover: 1300, toast: 1400 },
  },
  components: {
    button: {
      base: { borderRadius: 'var(--radius-DEFAULT)', fontWeight: '500' },
    },
  },
  brand: {
    logoUrl: 'https://cdn.clientco.com/logo.svg',
    logoDarkUrl: 'https://cdn.clientco.com/logo-white.svg',
    logomarkUrl: 'https://cdn.clientco.com/icon.svg',
    faviconUrl: 'https://cdn.clientco.com/favicon.ico',
    customFonts: [
      {
        family: 'ClientSans',
        weight: 400,
        style: 'normal',
        src: 'https://cdn.clientco.com/fonts/ClientSans-Regular.woff2',
        format: 'woff2',
        display: 'swap',
      },
      {
        family: 'ClientSans',
        weight: 500,
        style: 'normal',
        src: 'https://cdn.clientco.com/fonts/ClientSans-Medium.woff2',
        format: 'woff2',
        display: 'swap',
      },
      {
        family: 'ClientSans',
        weight: 600,
        style: 'normal',
        src: 'https://cdn.clientco.com/fonts/ClientSans-Semibold.woff2',
        format: 'woff2',
        display: 'swap',
      },
      {
        family: 'ClientSans',
        weight: 700,
        style: 'normal',
        src: 'https://cdn.clientco.com/fonts/ClientSans-Bold.woff2',
        format: 'woff2',
        display: 'swap',
      },
    ],
    meta: {
      companyName: 'ClientCo Inc.',
      tagline: 'Innovation at Scale',
      supportEmail: 'help@clientco.com',
      websiteUrl: 'https://clientco.com',
      copyrightNotice: '© 2026 ClientCo Inc. All rights reserved.',
    },
  },
});
```

### Example 9: Theme Editor Hook (Admin UI)

```tsx
import { useThemeEditor, ColorPicker, ThemePreview } from '@mcv/shared/theming';

// ═══════════════════════════════════════════════════════════════════════════════
// Live theme editor in admin dashboard with real-time preview
// Supports undo/redo, diff viewing, and one-click save/reset
// ═══════════════════════════════════════════════════════════════════════════════

function ThemeEditorPage({ themeId }: { themeId: string }) {
  const {
    theme,               // Current working copy of the theme
    original,            // Original saved theme (for diff)
    updateToken,         // Update a single token path
    updateComponent,     // Update a component theme
    updateBrand,         // Update brand config
    preview,             // Resolved preview theme (live)
    save,                // Persist changes to database
    reset,               // Revert all changes to saved state
    isDirty,             // Has unsaved changes
    diff,                // TokenDiff between original and working copy
    history,             // Undo/redo state
    undo,                // Undo last change
    redo,                // Redo last undone change
    isSaving,            // Save in progress
    error,               // Last error
  } = useThemeEditor(themeId);

  return (
    <div className="flex h-screen">
      {/* Left panel: controls */}
      <aside className="w-96 border-r overflow-y-auto p-6 space-y-8">
        {/* Color section */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Brand Colors</h2>
          <div className="space-y-4">
            <ColorPicker
              label="Primary"
              value={theme.tokens.colors.semantic.primary[500]}
              onChange={(color) =>
                updateToken('colors.semantic.primary', generateColorScale(color))
              }
              showScale={true}
            />
            <ColorPicker
              label="Secondary"
              value={theme.tokens.colors.semantic.secondary[500]}
              onChange={(color) =>
                updateToken('colors.semantic.secondary', generateColorScale(color))
              }
            />
            <ColorPicker
              label="Accent"
              value={theme.tokens.colors.semantic.accent[500]}
              onChange={(color) =>
                updateToken('colors.semantic.accent', generateColorScale(color))
              }
            />
          </div>
        </section>

        {/* Surface section */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Surface Colors</h2>
          <ColorPicker
            label="Background"
            value={theme.tokens.colors.surface.background}
            onChange={(color) => updateToken('colors.surface.background', color)}
          />
          <ColorPicker
            label="Foreground"
            value={theme.tokens.colors.surface.foreground}
            onChange={(color) => updateToken('colors.surface.foreground', color)}
          />
        </section>

        {/* Typography section */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Typography</h2>
          <FontSelector
            value={theme.tokens.typography.fonts.sans}
            onChange={(font) => updateToken('typography.fonts.sans', font)}
            label="Sans Font"
          />
        </section>

        {/* Brand section */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Brand Assets</h2>
          <LogoUploader
            value={theme.brand.logoUrl}
            onChange={(url) => updateBrand({ logoUrl: url })}
            label="Primary Logo"
          />
        </section>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-4 border-t sticky bottom-0 bg-white py-4">
          <Button onClick={undo} disabled={!history.canUndo} variant="outline" size="sm">
            ↶ Undo
          </Button>
          <Button onClick={redo} disabled={!history.canRedo} variant="outline" size="sm">
            ↷ Redo
          </Button>
          <div className="flex-1" />
          <Button onClick={reset} variant="outline" disabled={!isDirty}>
            Reset
          </Button>
          <Button onClick={save} disabled={!isDirty} loading={isSaving}>
            Save Theme
          </Button>
        </div>

        {/* Change diff */}
        {isDirty && diff.totalChanges > 0 && (
          <div className="text-xs text-muted-foreground">
            {diff.totalChanges} token{diff.totalChanges !== 1 ? 's' : ''} changed
          </div>
        )}
      </aside>

      {/* Right panel: live preview */}
      <main className="flex-1 overflow-hidden">
        <ThemePreview theme={preview} />
      </main>
    </div>
  );
}
```

### Example 10: Server-Side Theme Resolution (SSR)

```typescript
import { getTheme, getCurrentTheme, generateCssVariables, generateFontFaceRules, resolveTokens } from '@mcv/shared/theming';

// ═══════════════════════════════════════════════════════════════════════════════
// Resolve theme for server-side rendering
// Injects CSS variables into <head> and provides brand data to layout
// ═══════════════════════════════════════════════════════════════════════════════

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const ventureId = ctx.params.ventureId as string;
  const prefersDark = ctx.req.cookies['mcv-color-mode'] === 'dark';

  // Get the venture's active theme (resolves default + mode)
  const theme = await getCurrentTheme({
    ventureId,
    mode: prefersDark ? 'dark' : 'light',
  });

  // Resolve all token references and inheritance
  const resolvedTokens = resolveTokens(theme);

  // Generate CSS for injection into <head>
  const cssVariables = generateCssVariables(theme);
  const fontFaceRules = generateFontFaceRules(theme.brand.customFonts ?? []);

  return {
    props: {
      theme: {
        id: theme.id,
        name: theme.name,
        mode: theme.mode,
      },
      resolvedTokens,
      cssVariables,
      fontFaceRules,
      brand: theme.brand,
    },
  };
}

// In layout component:
function RootLayout({ cssVariables, fontFaceRules, brand, children }) {
  return (
    <html>
      <head>
        {/* Inject theme CSS variables */}
        <style dangerouslySetInnerHTML={{ __html: cssVariables }} />

        {/* Inject custom font faces */}
        {fontFaceRules && (
          <style dangerouslySetInnerHTML={{ __html: fontFaceRules }} />
        )}

        {/* Brand favicon */}
        {brand.faviconUrl && <link rel="icon" href={brand.faviconUrl} />}

        {/* Preload custom fonts for performance */}
        {brand.customFonts?.map((font) => (
          <link key={font.src} rel="preload" href={font.src} as="font" type={`font/${font.format}`} crossOrigin="anonymous" />
        ))}
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### Example 11: Email Template Integration

```typescript
import { getTheme, resolveToken, generateInlineStyles } from '@mcv/shared/theming';

// ═══════════════════════════════════════════════════════════════════════════════
// Apply venture theme to email templates
// Emails require inline styles (no CSS variables)
// ═══════════════════════════════════════════════════════════════════════════════

async function renderBrandedEmail(
  ventureId: string,
  templateId: string,
  data: unknown,
) {
  // Always use light mode for emails (email clients don't support dark mode vars)
  const theme = await getTheme({ ventureId, mode: 'light' });

  // Generate inline style map (flat token paths → resolved values)
  const styles = generateInlineStyles(theme);

  const emailVars = {
    primaryColor: styles['colors.semantic.primary.500'],
    primaryDark: styles['colors.semantic.primary.700'],
    backgroundColor: styles['colors.surface.background'],
    cardBackground: styles['colors.surface.card'],
    textColor: styles['colors.surface.foreground'],
    mutedTextColor: styles['colors.surface.mutedForeground'],
    borderColor: styles['colors.surface.border'],
    fontFamily: styles['typography.fonts.sans'],
    borderRadius: styles['radii.md'],
    logoUrl: theme.brand.logoUrl,
    companyName: theme.brand.meta?.companyName ?? 'MCV',
    supportEmail: theme.brand.meta?.supportEmail ?? 'support@mcv.one',
    copyrightNotice: theme.brand.meta?.copyrightNotice ?? '© 2026 MCV.ONE',
  };

  return renderTemplate(templateId, { ...data, theme: emailVars });
}

// In the email template (e.g., welcome.tsx):
function WelcomeEmail({ theme, userName }) {
  return (
    <div style={{
      fontFamily: theme.fontFamily,
      backgroundColor: theme.backgroundColor,
      color: theme.textColor,
      padding: '32px',
    }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <img src={theme.logoUrl} alt={theme.companyName} height="40" />
      </div>

      <div style={{
        backgroundColor: theme.cardBackground,
        borderRadius: theme.borderRadius,
        border: `1px solid ${theme.borderColor}`,
        padding: '24px',
      }}>
        <h1 style={{ color: theme.primaryColor, margin: '0 0 16px' }}>
          Welcome, {userName}!
        </h1>
        <p style={{ color: theme.mutedTextColor, lineHeight: '1.6' }}>
          We're excited to have you on board.
        </p>
        <a href="#" style={{
          display: 'inline-block',
          backgroundColor: theme.primaryColor,
          color: '#FFFFFF',
          padding: '12px 24px',
          borderRadius: theme.borderRadius,
          textDecoration: 'none',
          fontWeight: '600',
        }}>
          Get Started
        </a>
      </div>

      <p style={{
        textAlign: 'center',
        color: theme.mutedTextColor,
        fontSize: '12px',
        marginTop: '24px',
      }}>
        {theme.copyrightNotice}
      </p>
    </div>
  );
}
```

### Example 12: High-Contrast Theme for Accessibility

```typescript
import { createTheme, adjustContrast, getContrastRatio } from '@mcv/shared/theming';

// ═══════════════════════════════════════════════════════════════════════════════
// Create WCAG AAA compliant high-contrast theme
// All foreground/background pairs guaranteed ≥7:1 contrast ratio
// ═══════════════════════════════════════════════════════════════════════════════

const highContrastTheme = await createTheme({
  ventureId: 'acme-venture-uuid',
  name: 'Acme High Contrast',
  slug: 'acme-high-contrast',
  mode: 'high-contrast',
  tokens: {
    colors: {
      primitives: {},
      semantic: {
        primary: generateColorScale('#0000CC'),      // Deep blue
        secondary: generateColorScale('#CC0066'),     // Deep magenta
        accent: generateColorScale('#CC6600'),        // Deep orange
        neutral: generateColorScale('#333333'),       // Near-black
        success: generateColorScale('#006600'),       // Deep green
        warning: generateColorScale('#CC6600'),       // Deep orange
        error: generateColorScale('#CC0000'),         // Deep red
        info: generateColorScale('#0066CC'),          // Deep blue
      },
      surface: {
        background: '#FFFFFF',
        foreground: '#000000',
        card: '#FFFFFF',
        cardForeground: '#000000',
        popover: '#FFFFFF',
        popoverForeground: '#000000',
        muted: '#F0F0F0',
        mutedForeground: '#333333',
        border: '#000000',
        input: '#000000',
        ring: '#0000CC',
      },
    },
    typography: {
      fonts: {
        sans: 'Inter, system-ui, sans-serif',
        serif: 'Georgia, serif',
        mono: 'monospace',
      },
      sizes: {
        xs:    { fontSize: '0.875rem', lineHeight: '1.25rem' }, // Slightly larger than default xs
        sm:    { fontSize: '1rem',     lineHeight: '1.5rem' },
        base:  { fontSize: '1.125rem', lineHeight: '1.75rem' },
        lg:    { fontSize: '1.25rem',  lineHeight: '2rem' },
        xl:    { fontSize: '1.5rem',   lineHeight: '2rem' },
        '2xl': { fontSize: '1.875rem', lineHeight: '2.25rem' },
        '3xl': { fontSize: '2.25rem',  lineHeight: '2.5rem' },
      },
      weights: { normal: 400, medium: 500, semibold: 600, bold: 700 },
      lineHeights: { tight: 1.3, normal: 1.6, relaxed: 1.8 },
      letterSpacing: { tight: '-0.01em', normal: '0em', wide: '0.03em' },
    },
    spacing: { /* ... standard spacing scale ... */ },
    radii: {
      none: '0px', sm: '2px', DEFAULT: '4px', md: '6px',
      lg: '8px', xl: '12px', '2xl': '16px', full: '9999px',
    },
    shadows: {
      // High contrast shadows use solid borders instead of soft shadows
      sm: '0 0 0 1px #000000',
      md: '0 0 0 2px #000000',
      lg: '0 0 0 3px #000000',
    },
    borders: { default: '2px solid #000000' }, // Thicker borders
    breakpoints: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px' },
    transitions: { fast: '100ms ease', normal: '150ms ease', slow: '200ms ease' },
    zIndices: { dropdown: 1000, sticky: 1100, modal: 1200, popover: 1300, toast: 1400 },
  },
  components: {
    button: {
      base: { borderWidth: '2px', fontWeight: '700' },
      states: {
        focus: {
          outline: '3px solid #000000',
          outlineOffset: '3px',
        },
      },
    },
  },
  brand: {},
});

// Validate all foreground/background pairs meet AAA
const pairs = [
  [highContrastTheme.tokens.colors.surface.foreground, highContrastTheme.tokens.colors.surface.background],
  [highContrastTheme.tokens.colors.surface.cardForeground, highContrastTheme.tokens.colors.surface.card],
  [highContrastTheme.tokens.colors.surface.mutedForeground, highContrastTheme.tokens.colors.surface.muted],
];

for (const [fg, bg] of pairs) {
  const ratio = getContrastRatio(fg, bg);
  console.assert(ratio >= 7, `Contrast ${ratio} < 7 for ${fg} on ${bg}`);
}
```

### Example 13: Theme Export & Import

```typescript
import { exportTheme, importTheme, diffTokens } from '@mcv/shared/theming';

// ═══════════════════════════════════════════════════════════════════════════════
// Export a theme for backup or transfer between ventures
// ═══════════════════════════════════════════════════════════════════════════════

const exported = await exportTheme('theme-uuid');
// exported: ThemeExport = {
//   formatVersion: '1.0',
//   theme: { name: 'Acme Brand', slug: 'acme-brand', mode: 'light' },
//   tokens: { ... full resolved token tree ... },
//   components: { ... },
//   brand: { ... },
//   checksum: 'sha256:abc123...',
//   exportedAt: '2026-02-08T19:30:00Z',
// }

// Save to file
const json = JSON.stringify(exported, null, 2);
await writeFile('acme-theme-backup.json', json);

// ═══════════════════════════════════════════════════════════════════════════════
// Import into another venture
// ═══════════════════════════════════════════════════════════════════════════════

const imported = await importTheme({
  data: exported,
  ventureId: 'other-venture-uuid',
  slugOverride: 'acme-brand-imported',  // Avoid slug collision
  setAsDefault: false,
});

console.log(`Imported as: ${imported.id} (${imported.name})`);

// ═══════════════════════════════════════════════════════════════════════════════
// Compare two themes for differences
// ═══════════════════════════════════════════════════════════════════════════════

const themeA = await getTheme({ id: 'theme-a-uuid' });
const themeB = await getTheme({ id: 'theme-b-uuid' });

const diff = diffTokens(themeA.tokens, themeB.tokens);
console.log(`Tokens added: ${Object.keys(diff.added).length}`);
console.log(`Tokens removed: ${Object.keys(diff.removed).length}`);
console.log(`Tokens changed: ${Object.keys(diff.changed).length}`);

for (const [path, change] of Object.entries(diff.changed)) {
  console.log(`  ${path}: ${change.from} → ${change.to}`);
}
```

### Example 14: useColorMode Hook

```tsx
import { useColorMode } from '@mcv/shared/theming';

// ═══════════════════════════════════════════════════════════════════════════════
// Color mode management in any component
// Persists preference to localStorage, respects system preference
// ═══════════════════════════════════════════════════════════════════════════════

function ColorModeToggle() {
  const {
    mode,                    // Current resolved mode: 'light' | 'dark'
    preference,              // User preference: 'light' | 'dark' | 'system'
    setPreference,           // Set user preference
    systemMode,              // System preference: 'light' | 'dark'
    isDark,                  // Convenience: mode === 'dark'
    isLight,                 // Convenience: mode === 'light'
    toggle,                  // Toggle between light and dark
  } = useColorMode();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setPreference('light')}
        className={preference === 'light' ? 'bg-primary text-white' : 'bg-muted'}
      >
        ☀️ Light
      </button>
      <button
        onClick={() => setPreference('dark')}
        className={preference === 'dark' ? 'bg-primary text-white' : 'bg-muted'}
      >
        🌙 Dark
      </button>
      <button
        onClick={() => setPreference('system')}
        className={preference === 'system' ? 'bg-primary text-white' : 'bg-muted'}
      >
        🖥️ System {systemMode === 'dark' ? '(Dark)' : '(Light)'}
      </button>
    </div>
  );
}
```

### Example 15: Contrast Checker Component

```tsx
import { useContrastChecker, ContrastChecker } from '@mcv/shared/theming';

// ═══════════════════════════════════════════════════════════════════════════════
// Built-in contrast checker for the theme editor
// Shows real-time WCAG compliance as colors are edited
// ═══════════════════════════════════════════════════════════════════════════════

function AccessibilityPanel({ theme }: { theme: Theme }) {
  const { results, overallScore, issues } = useContrastChecker(theme);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold">Accessibility Score</h3>
        <Badge variant={overallScore === 'AAA' ? 'success' : overallScore === 'AA' ? 'warning' : 'error'}>
          WCAG {overallScore}
        </Badge>
      </div>

      {issues.length > 0 && (
        <div className="bg-error-50 border border-error-200 rounded-lg p-4">
          <h4 className="font-medium text-error-700 mb-2">
            {issues.length} contrast issue{issues.length !== 1 ? 's' : ''} found
          </h4>
          <ul className="space-y-2">
            {issues.map((issue, i) => (
              <li key={i} className="text-sm">
                <span className="font-mono">{issue.foreground}</span> on{' '}
                <span className="font-mono">{issue.background}</span> — ratio{' '}
                <strong>{issue.ratio.toFixed(2)}:1</strong>
                {issue.suggestion && (
                  <span className="text-muted-foreground">
                    {' '}(try {issue.suggestion})
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Inline contrast checker for ad-hoc testing */}
      <ContrastChecker
        foreground={theme.tokens.colors.semantic.primary[500]}
        background={theme.tokens.colors.surface.background}
        showSuggestions={true}
      />
    </div>
  );
}
```

---

## Built-in System Themes

The Chameleon Engine ships with three system themes that cannot be deleted. They serve as the default inheritance chain for all venture themes.

### DEFAULT_THEME (Light)

The base theme used when no venture-specific theme exists. Follows a neutral gray palette with blue primary. Designed for readability and professional appearance.

| Token Category | Key Values |
|----------------|------------|
| Primary | `#3B82F6` (Blue 500) |
| Background | `#FFFFFF` |
| Foreground | `#0F172A` |
| Font Sans | `Inter, system-ui, sans-serif` |
| Border Radius | `md: 6px` |

### DARK_THEME

Extends `DEFAULT_THEME` with dark surface overrides. Semantic colors (primary, error, success, etc.) are shared with the light theme — only surface colors and shadows change.

| Token Category | Key Values |
|----------------|------------|
| Background | `#0F172A` |
| Foreground | `#F8FAFC` |
| Card | `#1E293B` |
| Border | `#334155` |
| Shadows | Higher opacity for visibility on dark backgrounds |

### HIGH_CONTRAST_THEME

Extends `DEFAULT_THEME` with AAA-compliant colors. Uses deeper color values, thicker borders, larger text sizes, and solid outlines instead of soft shadows. Ideal for users with low vision.

| Token Category | Key Values |
|----------------|------------|
| Foreground | `#000000` |
| Background | `#FFFFFF` |
| Borders | `2px solid #000000` |
| Focus Ring | `3px solid #000000, offset 3px` |
| Shadows | Replaced with solid outlines |

---

## Performance Considerations

### Latency Targets

| Operation | Target | P99 | Notes |
|-----------|--------|-----|-------|
| Theme resolution (cached) | < 1ms | < 5ms | In-memory LRU cache hit |
| Theme resolution (DB) | < 20ms | < 50ms | Single row + parent join |
| Token resolution (full tree) | < 3ms | < 10ms | Recursive reference resolution |
| CSS variable generation | < 5ms | < 15ms | ~200 variables for full theme |
| Tailwind config generation | < 10ms | < 30ms | JSON construction from tokens |
| Color scale generation | < 2ms | < 5ms | 11-step perceptual interpolation |
| Inline style generation | < 3ms | < 8ms | Flat map from resolved tokens |
| Contrast ratio calculation | < 0.1ms | < 0.5ms | Pure math (no I/O) |
| Theme save (with versioning) | < 50ms | < 100ms | Write + snapshot + cache invalidation |

### Throughput

| Metric | Small Deployment | Enterprise |
|--------|------------------|------------|
| Theme resolutions/sec | 5,000+ | 50,000+ |
| CSS generations/sec | 2,000+ | 20,000+ |
| Concurrent theme editors | 10 | 100+ |

### Caching Strategy

| Cache Layer | TTL | Invalidation | Storage |
|-------------|-----|--------------|---------|
| In-memory theme cache (LRU) | 5 min | On theme update event | Process memory |
| CSS variable cache | 10 min | On theme version change | `theme_cache` table |
| Tailwind config cache | 30 min | On theme version change | `theme_cache` table |
| Inline style cache | 10 min | On theme version change | `theme_cache` table |
| Color scale cache | 1 hour | Immutable (input = output) | Process memory |
| Resolved token cache | 5 min | On theme or parent update | Process memory |
| Font face rules cache | 24 hours | On brand font change | `theme_cache` table |

### Optimization Notes

1. **CSS variable injection** — Single `<style>` tag in `<head>`. No re-render on mode switch — class change on `<html>` triggers CSS cascade.
2. **Font loading** — `font-display: swap` for custom fonts. Critical fonts preloaded via `<link rel="preload">`. Non-critical fonts loaded async.
3. **Theme inheritance** — Only override tokens are stored in child themes. Parent tokens resolved at read time via single recursive query. Flattened result cached.
4. **Color calculation** — `generateColorScale` is deterministic (pure function). Cached by input hex — same input always produces same output. Uses perceptual color space (OKLCh) for uniform lightness distribution.
5. **Bundle size** — Color utilities are tree-shakeable. Core client bundle: ~3.2KB gzipped. Full client with editor: ~18KB gzipped. Server utilities: ~8KB gzipped.
6. **Cache invalidation** — Theme updates publish a `theme.updated` event. All caches (in-memory, DB, CDN) are invalidated within 100ms. Stale-while-revalidate pattern prevents cache stampede.
7. **Batch token resolution** — `resolveTokens` resolves the entire tree in a single pass with memoization, not per-token queries. O(n) where n = token count.
8. **SSR optimization** — CSS variables are pre-generated at build time for system themes. Venture themes are generated on first request and cached.

---

## Security Considerations

### Input Sanitization

- **CSS value sanitization** — All token values are sanitized before CSS injection. Characters like `<`, `>`, `"`, `'`, `;`, `{`, `}` are escaped or rejected. The regex `^[a-zA-Z0-9\s\-_.,%#()\/]+$` whitelists safe CSS value characters.
- **URL validation** — Logo and font URLs are validated against a domain allowlist (`THEME_ALLOWED_ASSET_DOMAINS`). Relative URLs, `javascript:`, `data:` (except for small data-URIs under 10KB), and IP-based URLs are rejected.
- **No script injection** — CSS custom properties cannot execute JavaScript. The engine strips any value containing `expression(`, `url(javascript:`, `@import`, or `</style>`.
- **Token path validation** — Token paths (e.g., `colors.semantic.primary.500`) are validated against the schema. Arbitrary keys are rejected to prevent prototype pollution.

### Access Control

| Permission | Required For |
|------------|-------------|
| `venture:theme:read` | View theme configuration |
| `venture:theme:write` | Create, update, delete themes |
| `venture:theme:set_default` | Set venture default theme |
| `venture:brand:write` | Upload logos, fonts, brand assets |
| `venture:theme:export` | Export theme to JSON |
| `venture:theme:import` | Import theme from JSON |
| `system:theme:manage` | Modify system themes (admin only) |

### Content Security Policy

When custom fonts are used, their CDN domains must be added to the page's Content Security Policy:

```
font-src 'self' https://cdn.mcv.one https://cdn.clientco.com;
style-src 'self' 'unsafe-inline';
img-src 'self' https://cdn.mcv.one https://cdn.clientco.com data:;
```

The Chameleon Engine provides a helper to generate the correct CSP directives based on active theme configuration:

```typescript
import { getThemeCspDirectives } from '@mcv/shared/theming';

const csp = await getThemeCspDirectives(ventureId);
// { 'font-src': ['https://cdn.clientco.com'], 'img-src': ['https://cdn.clientco.com'] }
```

### Font File Security

- Custom font uploads are scanned for embedded scripts (OpenType allows JavaScript in some features)
- Maximum file size enforced: `THEME_FONT_MAX_SIZE_MB` (default: 5MB)
- Only `woff2`, `woff`, `ttf`, `otf` formats accepted
- Font files are served from CDN with `Content-Type: font/woff2` (etc.) and `X-Content-Type-Options: nosniff`
- Maximum `THEME_MAX_CUSTOM_FONTS` fonts per venture (default: 10)

---

## Error Codes

| Code | Name | HTTP | Description |
|------|------|------|-------------|
| `THEME_NOT_FOUND` | Theme Not Found | 404 | Requested theme ID or slug does not exist |
| `THEME_SLUG_EXISTS` | Slug Already Exists | 409 | Theme slug already in use for this venture |
| `THEME_SYSTEM_IMMUTABLE` | System Theme Immutable | 403 | Cannot modify or delete system themes |
| `THEME_VALIDATION_FAILED` | Validation Failed | 400 | Theme config does not match schema |
| `THEME_MAX_EXCEEDED` | Theme Limit Exceeded | 429 | Venture has reached `THEME_MAX_THEMES_PER_VENTURE` |
| `THEME_CIRCULAR_PARENT` | Circular Inheritance | 400 | Parent chain creates a cycle |
| `THEME_PARENT_NOT_FOUND` | Parent Not Found | 404 | Parent theme ID does not exist |
| `THEME_TOKEN_DEPTH_EXCEEDED` | Token Depth Exceeded | 400 | Token reference chain exceeds `THEME_MAX_TOKEN_DEPTH` |
| `THEME_CIRCULAR_TOKEN_REF` | Circular Token Reference | 400 | Token references create a cycle |
| `THEME_CONTRAST_VIOLATION` | Contrast Violation | 400 | Color pair fails WCAG enforcement (when `THEME_ENFORCE_WCAG_AA=true`) |
| `BRAND_FONT_TOO_LARGE` | Font File Too Large | 413 | Font file exceeds `THEME_FONT_MAX_SIZE_MB` |
| `BRAND_FONT_INVALID_FORMAT` | Invalid Font Format | 400 | Font file is not woff2/woff/ttf/otf |
| `BRAND_FONT_LIMIT_EXCEEDED` | Font Limit Exceeded | 429 | Venture has reached `THEME_MAX_CUSTOM_FONTS` |
| `BRAND_URL_NOT_ALLOWED` | Asset URL Not Allowed | 400 | URL domain not in `THEME_ALLOWED_ASSET_DOMAINS` |
| `THEME_IMPORT_INVALID` | Invalid Import Data | 400 | Import JSON fails format validation or checksum |
| `THEME_IMPORT_VERSION_MISMATCH` | Version Mismatch | 400 | Import `formatVersion` is not supported |
| `THEME_PERMISSION_DENIED` | Permission Denied | 403 | User lacks required theme permission |
| `THEME_VERSION_CONFLICT` | Version Conflict | 409 | Concurrent edit detected (optimistic locking) |
| `THEME_CACHE_STALE` | Cache Stale | — | Internal: cached theme was invalidated during request |

---

## Audit Events

| Event | Category | Description | Metadata |
|-------|----------|-------------|----------|
| `theme.created` | admin | New theme created | `themeId`, `ventureId`, `slug`, `mode`, `parentId` |
| `theme.updated` | admin | Theme tokens or config changed | `themeId`, `version`, `changedTokenPaths[]` |
| `theme.deleted` | admin | Theme removed | `themeId`, `slug`, `wasDefault` |
| `theme.set_default` | admin | Theme set as venture default | `themeId`, `previousDefaultId` |
| `theme.cloned` | admin | Theme cloned from another | `sourceThemeId`, `newThemeId` |
| `theme.exported` | admin | Theme exported to JSON | `themeId`, `exportChecksum` |
| `theme.imported` | admin | Theme imported from JSON | `newThemeId`, `importChecksum`, `sourceVentureId` |
| `theme.version_rolled_back` | admin | Theme reverted to previous version | `themeId`, `fromVersion`, `toVersion` |
| `theme.brand_updated` | admin | Brand assets (logo, favicon) changed | `themeId`, `changedFields[]` |
| `theme.font_uploaded` | admin | Custom font file uploaded | `ventureId`, `fontFamily`, `fontWeight`, `fileSizeBytes` |
| `theme.font_deleted` | admin | Custom font removed | `ventureId`, `fontFamily`, `fontWeight` |
| `theme.override_created` | admin | Token override created | `themeId`, `tokenPath`, `value` |
| `theme.override_deleted` | admin | Token override removed | `themeId`, `tokenPath` |
| `theme.mode_switched` | user | User toggled color mode | `userId`, `fromMode`, `toMode` |
| `theme.contrast_warning` | system | Color pair flagged for low contrast | `themeId`, `tokenPath`, `ratio`, `required` |
| `theme.cache_invalidated` | system | Theme cache was cleared | `themeId`, `cacheKeys[]` |

---

## Environment Variables

```bash
# ═══════════════════════════════════════════════════════════════════════════════
# THEME DEFAULTS
# ═══════════════════════════════════════════════════════════════════════════════

# Theme cache TTL in seconds (in-memory LRU cache)
THEME_CACHE_TTL=300

# CSS variable cache TTL in seconds (theme_cache table)
THEME_CSS_CACHE_TTL=600

# Tailwind config cache TTL in seconds
THEME_TAILWIND_CACHE_TTL=1800

# Maximum custom fonts per venture
THEME_MAX_CUSTOM_FONTS=10

# Maximum themes per venture
THEME_MAX_THEMES_PER_VENTURE=20

# Maximum font file size in MB
THEME_FONT_MAX_SIZE_MB=5

# Maximum depth for token reference chains ({token.ref.to.another})
THEME_MAX_TOKEN_DEPTH=10

# Maximum theme versions to keep (older ones purged)
THEME_MAX_VERSIONS=50

# ═══════════════════════════════════════════════════════════════════════════════
# ACCESSIBILITY
# ═══════════════════════════════════════════════════════════════════════════════

# Enforce WCAG AA contrast checking on theme save (blocks save if fails)
THEME_ENFORCE_WCAG_AA=true

# Minimum contrast ratio for normal text (WCAG AA = 4.5, AAA = 7.0)
THEME_MIN_CONTRAST_RATIO=4.5

# Auto-adjust colors that fail contrast check (instead of blocking)
THEME_AUTO_ADJUST_CONTRAST=false

# ═══════════════════════════════════════════════════════════════════════════════
# CDN & ASSETS
# ═══════════════════════════════════════════════════════════════════════════════

# CDN base URL for font files
THEME_FONT_CDN_BASE=https://cdn.mcv.one/fonts

# CDN base URL for brand assets (logos, favicons)
THEME_ASSET_CDN_BASE=https://cdn.mcv.one/brand

# Allowed asset domains (comma-separated) for logo/font URLs
THEME_ALLOWED_ASSET_DOMAINS=cdn.mcv.one,fonts.googleapis.com

# ═══════════════════════════════════════════════════════════════════════════════
# CSS GENERATION
# ═══════════════════════════════════════════════════════════════════════════════

# Prefix for CSS custom properties (empty = default: --color-*, --font-*, etc.)
# Set to namespace when multiple themes coexist: --acme-color-*, --acme-font-*
THEME_CSS_VARIABLE_PREFIX=

# Include comments in generated CSS (disable in production for smaller output)
THEME_CSS_INCLUDE_COMMENTS=true

# Minify generated CSS output
THEME_CSS_MINIFY=false
```

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| culori | ^4.x | Color parsing, conversion, contrast calculation, OKLCh interpolation |
| chroma-js | ^2.6.x | Color manipulation, scale generation (legacy, being migrated to culori) |
| zod | ^3.22.x | Theme schema validation, input sanitization |
| deepmerge-ts | ^7.x | Type-safe deep merging for theme inheritance |
| drizzle-orm | ^0.29.x | Database ORM for theme storage |
| nanoid | ^5.x | Slug-safe ID generation for theme exports |
| react | ^18.x / ^19.x | Client hooks and components (peer dependency) |

### Dependency Notes

- **culori** was chosen over raw color math because it supports perceptual color spaces (OKLCh, OKLCH) which produce more visually uniform color scales than HSL-based interpolation.
- **deepmerge-ts** is used instead of `deepmerge` for full TypeScript type inference through the merge — the output type correctly reflects the merged structure.
- **chroma-js** is a transitional dependency being gradually replaced by culori. Both are currently used; new code should use culori exclusively.

---

## Testing Notes

### Unit Testing

```typescript
import {
  generateColorScale,
  getContrastRatio,
  isAccessible,
  resolveTokens,
  flattenTokens,
  generateCssVariables,
  generateTailwindConfig,
  generateInlineStyles,
  diffTokens,
  validateTheme,
} from '@mcv/shared/theming';

describe('Color Scale Generation', () => {
  it('should generate full 11-step scale from single hex', () => {
    const scale = generateColorScale('#3B82F6');
    expect(Object.keys(scale)).toHaveLength(11); // 50-950
    expect(scale[500]).toBe('#3B82F6');           // Input = 500
    expect(scale[50]).toBeDefined();
    expect(scale[950]).toBeDefined();
  });

  it('should produce perceptually uniform lightness steps', () => {
    const scale = generateColorScale('#3B82F6');
    // 50 should be very light, 950 should be very dark
    const lightness50 = getLightness(scale[50]);
    const lightness950 = getLightness(scale[950]);
    expect(lightness50).toBeGreaterThan(0.9);
    expect(lightness950).toBeLessThan(0.15);
  });

  it('should be deterministic (same input → same output)', () => {
    const a = generateColorScale('#FF6600');
    const b = generateColorScale('#FF6600');
    expect(a).toEqual(b);
  });
});

describe('Contrast Ratio', () => {
  it('should calculate correct WCAG contrast ratio', () => {
    // White on black = 21:1
    expect(getContrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 0);
    // Same color = 1:1
    expect(getContrastRatio('#FF0000', '#FF0000')).toBeCloseTo(1, 0);
  });

  it('should correctly assess WCAG AA compliance', () => {
    // 4.5:1 minimum for AA normal text
    expect(isAccessible('#767676', '#FFFFFF', 'AA')).toBe(true);   // 4.54:1
    expect(isAccessible('#777777', '#FFFFFF', 'AA')).toBe(false);  // 4.48:1
  });

  it('should correctly assess WCAG AAA compliance', () => {
    expect(isAccessible('#000000', '#FFFFFF', 'AAA')).toBe(true);  // 21:1
    expect(isAccessible('#767676', '#FFFFFF', 'AAA')).toBe(false); // 4.54:1
  });
});

describe('Token Resolution', () => {
  it('should resolve token references', () => {
    const theme = createTestTheme({
      tokens: {
        colors: {
          primitives: { 'brand-blue': '#3B82F6' },
          semantic: {
            primary: { 500: '{colors.primitives.brand-blue}' },
          },
        },
      },
    });

    const resolved = resolveTokens(theme);
    expect(resolved.colors.semantic.primary[500]).toBe('#3B82F6');
  });

  it('should resolve inherited tokens from parent', async () => {
    const parent = await createTheme({
      tokens: {
        colors: {
          semantic: { primary: generateColorScale('#3B82F6') },
        },
      },
    });

    const child = await extendTheme(parent.id, {
      tokens: {
        colors: {
          surface: { background: '#000' },
        },
      },
    });

    const resolved = resolveTokens(child);
    // Child gets parent's primary color
    expect(resolved.colors.semantic.primary[500]).toBe('#3B82F6');
    // Child's own override takes precedence
    expect(resolved.colors.surface.background).toBe('#000');
  });

  it('should detect circular token references', () => {
    const theme = createTestTheme({
      tokens: {
        colors: {
          primitives: {
            a: '{colors.primitives.b}',
            b: '{colors.primitives.a}',
          },
        },
      },
    });

    expect(() => resolveTokens(theme)).toThrow('THEME_CIRCULAR_TOKEN_REF');
  });

  it('should respect max token depth', () => {
    // Create a chain of 15 references (exceeds default max of 10)
    const primitives: Record<string, string> = {};
    for (let i = 0; i < 15; i++) {
      primitives[`level${i}`] = i === 0
        ? '#FF0000'
        : `{colors.primitives.level${i - 1}}`;
    }

    const theme = createTestTheme({
      tokens: { colors: { primitives } },
    });

    expect(() => resolveTokens(theme)).toThrow('THEME_TOKEN_DEPTH_EXCEEDED');
  });
});

describe('CSS Generation', () => {
  it('should generate valid CSS variables', () => {
    const theme = createTestTheme();
    const css = generateCssVariables(theme);

    expect(css).toContain(':root {');
    expect(css).toContain('--color-primary-500');
    expect(css).toContain('--font-sans');
    expect(css).toContain('--spacing-4');
    expect(css).toContain('--radius-md');
    expect(css).toContain('--shadow-md');
    expect(css).not.toContain('undefined');
    expect(css).not.toContain('null');
  });

  it('should generate scoped CSS with correct selector', () => {
    const theme = createTestTheme();
    const css = generateScopedCss(theme, '.mcv-widget');

    expect(css).toContain('.mcv-widget {');
    expect(css).not.toContain(':root');
  });

  it('should generate valid Tailwind config', () => {
    const theme = createTestTheme();
    const config = generateTailwindConfig(theme);

    expect(config.colors.primary).toBeDefined();
    expect(config.colors.primary[500]).toBe('var(--color-primary-500)');
    expect(config.fontFamily.sans).toContain('var(--font-sans)');
    expect(config.borderRadius.md).toBe('var(--radius-md)');
  });

  it('should generate inline styles with resolved values (not CSS variables)', () => {
    const theme = createTestTheme();
    const styles = generateInlineStyles(theme);

    // Inline styles must have actual values, not var() references
    expect(styles['colors.semantic.primary.500']).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(styles['typography.fonts.sans']).toContain('Inter');
    expect(styles['colors.semantic.primary.500']).not.toContain('var(');
  });
});

describe('Token Diffing', () => {
  it('should detect added, removed, and changed tokens', () => {
    const tokensA = { colors: { semantic: { primary: { 500: '#3B82F6' } } } };
    const tokensB = { colors: { semantic: { primary: { 500: '#6366F1' }, accent: { 500: '#F59E0B' } } } };

    const diff = diffTokens(tokensA, tokensB);

    expect(diff.changed['colors.semantic.primary.500']).toEqual({
      from: '#3B82F6',
      to: '#6366F1',
    });
    expect(diff.added['colors.semantic.accent.500']).toBe('#F59E0B');
    expect(diff.totalChanges).toBeGreaterThan(0);
  });
});

describe('Theme Validation', () => {
  it('should reject invalid color values', () => {
    const result = validateTheme({
      tokens: {
        colors: {
          surface: { background: 'not-a-color' },
        },
      },
    });

    expect(result.success).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ path: 'tokens.colors.surface.background' })
    );
  });

  it('should reject themes exceeding max token depth', () => {
    const result = validateTheme({
      tokens: {
        colors: {
          primitives: {
            a: '{colors.primitives.b}',
            b: '{colors.primitives.c}',
            // ... chain exceeding THEME_MAX_TOKEN_DEPTH
          },
        },
      },
    });

    expect(result.success).toBe(false);
  });

  it('should validate font file constraints', () => {
    const result = validateTheme({
      brand: {
        customFonts: [{
          family: 'Test',
          weight: 400,
          style: 'normal',
          src: 'https://evil.com/font.woff2',  // Not in allowed domains
          format: 'woff2',
          display: 'swap',
        }],
      },
    });

    expect(result.success).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'BRAND_URL_NOT_ALLOWED' })
    );
  });
});
```

### Integration Testing

```typescript
describe('Theme Lifecycle', () => {
  it('should create, update, and delete a theme', async () => {
    // Create
    const theme = await createTheme({
      ventureId: testVentureId,
      name: 'Test Theme',
      slug: 'test-theme',
      mode: 'light',
      tokens: { colors: { surface: { background: '#FFFFFF' } } },
    });
    expect(theme.id).toBeDefined();
    expect(theme.version).toBe(1);

    // Update
    const updated = await updateTheme(theme.id, {
      tokens: { colors: { surface: { background: '#FAFAFA' } } },
    });
    expect(updated.version).toBe(2);

    // Verify version history
    const versions = await getThemeVersions(theme.id);
    expect(versions).toHaveLength(2);

    // Delete
    await deleteTheme(theme.id);
    await expect(getTheme({ id: theme.id })).rejects.toThrow('THEME_NOT_FOUND');
  });

  it('should prevent deleting system themes', async () => {
    await expect(deleteTheme(SYSTEM_THEME_IDS.DEFAULT)).rejects.toThrow('THEME_SYSTEM_IMMUTABLE');
  });

  it('should enforce unique slug per venture', async () => {
    await createTheme({ ventureId: testVentureId, slug: 'unique-slug', /* ... */ });
    await expect(
      createTheme({ ventureId: testVentureId, slug: 'unique-slug', /* ... */ })
    ).rejects.toThrow('THEME_SLUG_EXISTS');
  });

  it('should export and import a theme', async () => {
    const original = await createTheme({ /* ... */ });
    const exported = await exportTheme(original.id);

    const imported = await importTheme({
      data: exported,
      ventureId: otherVentureId,
      slugOverride: 'imported-theme',
    });

    // Tokens should match
    const resolvedOriginal = resolveTokens(original);
    const resolvedImported = resolveTokens(imported);
    expect(resolvedImported.colors.semantic.primary[500])
      .toBe(resolvedOriginal.colors.semantic.primary[500]);
  });

  it('should handle concurrent edits with optimistic locking', async () => {
    const theme = await createTheme({ /* ... */ });

    // Two concurrent updates
    const update1 = updateTheme(theme.id, {
      tokens: { colors: { surface: { background: '#111' } } },
      expectedVersion: 1,
    });
    const update2 = updateTheme(theme.id, {
      tokens: { colors: { surface: { background: '#222' } } },
      expectedVersion: 1,
    });

    const results = await Promise.allSettled([update1, update2]);
    const fulfilled = results.filter(r => r.status === 'fulfilled');
    const rejected = results.filter(r => r.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason.message).toContain('THEME_VERSION_CONFLICT');
  });
});
```

---

## API Routes

The theming module exposes the following API routes (mounted under the venture's base path):

| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| `GET` | `/api/ventures/:id/themes` | List all themes for venture | `venture:theme:read` |
| `GET` | `/api/ventures/:id/themes/:themeId` | Get single theme | `venture:theme:read` |
| `GET` | `/api/ventures/:id/themes/current` | Get current active theme | `venture:theme:read` |
| `POST` | `/api/ventures/:id/themes` | Create new theme | `venture:theme:write` |
| `PATCH` | `/api/ventures/:id/themes/:themeId` | Update theme | `venture:theme:write` |
| `DELETE` | `/api/ventures/:id/themes/:themeId` | Delete theme | `venture:theme:write` |
| `POST` | `/api/ventures/:id/themes/:themeId/default` | Set as default | `venture:theme:set_default` |
| `POST` | `/api/ventures/:id/themes/:themeId/clone` | Clone theme | `venture:theme:write` |
| `GET` | `/api/ventures/:id/themes/:themeId/export` | Export theme JSON | `venture:theme:export` |
| `POST` | `/api/ventures/:id/themes/import` | Import theme JSON | `venture:theme:import` |
| `GET` | `/api/ventures/:id/themes/:themeId/css` | Get generated CSS | `venture:theme:read` |
| `GET` | `/api/ventures/:id/themes/:themeId/tailwind` | Get Tailwind config | `venture:theme:read` |
| `GET` | `/api/ventures/:id/themes/:themeId/versions` | List version history | `venture:theme:read` |
| `POST` | `/api/ventures/:id/themes/:themeId/rollback` | Rollback to version | `venture:theme:write` |
| `POST` | `/api/ventures/:id/brand/logo` | Upload logo | `venture:brand:write` |
| `POST` | `/api/ventures/:id/brand/font` | Upload custom font | `venture:brand:write` |
| `GET` | `/api/ventures/:id/brand` | Get brand configuration | `venture:theme:read` |
| `PUT` | `/api/ventures/:id/brand` | Update brand configuration | `venture:brand:write` |

---

## Related Modules

| Module | Relationship |
|--------|-------------|
| `@mcv/shared/ventures` | Themes are scoped to ventures; venture creation seeds default themes |
| `@mcv/shared/auth` | Permission checks for theme CRUD operations |
| `@mcv/shared/audit` | All theme mutations emit audit events |
| `@mcv/shared/cdn` | Brand assets and custom fonts served via CDN layer |
| `@mcv/shared/email` | Email templates consume inline styles from theme |
| `@mcv/presentation/dashboard` | Dashboard consumes ThemeProvider and theme context |
| `@mcv/presentation/widgets` | Embedded widgets use scoped CSS from theme |

---

*@mcv/shared/theming — Chameleon Engine*