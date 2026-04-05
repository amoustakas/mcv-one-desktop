# @mcv/ui/branding — Venture Brand Customization

**Parent Package:** @mcv/ui  
**Submodule:** branding  
**Tier:** 6 (Presentation Layer — UI)  
**Classification:** PUBLISHABLE  
**Version:** 0.1.0  
**Last Updated:** February 9, 2026

---

## Overview

`@mcv/ui/branding` is the venture-specific theming and brand customization submodule of the MCV design system. It houses the **Chameleon Engine** — a runtime theming system that enables every MCV application to dynamically switch between venture brands without page reloads, rebuild cycles, or CSS extraction. A single deployment serves BetEdge, SerpSpace, The Forge, and every future venture with distinct visual identities — colors, typography, logos, favicons, and OG images — all resolved at runtime through CSS custom properties and React context.

The branding system sits at **Layer 0 (Design Tokens & Theme)** of the `@mcv/ui` component architecture. Every component in the library — from `Button` to `WorkflowCanvas` — consumes brand tokens through CSS custom properties. When the active venture changes, all 508 components automatically re-skin without prop drilling, re-rendering trees, or imperative style updates.

### Design Principles

1. **Zero-config defaults** — Every venture gets a sensible default theme derived from MCV.ONE's base palette. Custom branding is additive, never required.
2. **Runtime-first** — Theme switching happens in the browser via CSS custom property mutation. No server round-trips, no dynamic CSS generation, no flash of unstyled content (FOUC).
3. **Token-driven** — All visual decisions flow through semantic tokens. Components never reference raw hex values — they reference intentions (`--color-primary-500`, `--font-heading`).
4. **Dark/light as first-class** — Every venture theme ships both color modes. The system respects `prefers-color-scheme`, allows manual toggle, and persists user preference per venture.
5. **Type-safe** — Full TypeScript coverage from theme definition to consumption. Invalid token references fail at compile time, not at runtime.
6. **Accessible by default** — Color contrast ratios are validated at theme creation time. The system warns when a venture palette violates WCAG 2.1 AA.

### What This Submodule Provides

- **Chameleon Engine** — Runtime theme switching with `<ThemeProvider>` and `data-venture` attribute propagation
- **Brand Configuration** — Structured schema for logos, colors, fonts, favicons, and OG images per venture
- **Theme Token System** — 200+ CSS custom properties organized into semantic layers
- **Color System** — 11-step color scales (50–950) for primary, secondary, accent, neutral, success, warning, danger, and info
- **Typography System** — Font family stacks, modular type scale, and weight tokens
- **Dark/Light Mode** — Automatic OS detection, manual toggle, per-venture defaults, and persistent preferences
- **Brand Asset Management** — Logo upload pipeline, favicon generation, OG image templates
- **Component Theming** — Token-to-HeroUI mapping so all components adapt automatically
- **Venture Theme Creation** — Step-by-step guide and CLI tooling for new venture onboarding
- **Configuration API** — `ThemeProvider`, `useTheme`, `useVenture`, `createVentureTheme`
- **Storybook Integration** — Theme switcher addon for visual QA across all venture brands

### What This Submodule Does NOT Provide

- Does not render components — components live in their respective `@mcv/ui/*` categories
- Does not manage user preferences beyond theme mode — user settings belong in `@mcv/api`
- Does not handle CSS-in-JS or styled-components — all theming is CSS custom properties + Tailwind
- Does not generate marketing materials — brand assets are consumed, not created here

---

## Chameleon Engine

The Chameleon Engine is the runtime theming system at the heart of `@mcv/ui/branding`. It enables a single application build to serve multiple venture brands by injecting CSS custom properties onto the document root based on the active venture context.

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        APPLICATION SHELL                             │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                      <ThemeProvider>                            │  │
│  │                                                                │  │
│  │  venture="betedge" ──► resolveTheme("betedge")                │  │
│  │                              │                                 │  │
│  │                              ▼                                 │  │
│  │  ┌──────────────────────────────────────────────────────────┐ │  │
│  │  │              CHAMELEON ENGINE CORE                        │ │  │
│  │  │                                                          │ │  │
│  │  │  1. Load VentureTheme config                             │ │  │
│  │  │  2. Merge with base MCV theme (defaults)                 │ │  │
│  │  │  3. Resolve dark/light mode                              │ │  │
│  │  │  4. Generate CSS custom property map                     │ │  │
│  │  │  5. Inject onto <html data-venture="betedge">            │ │  │
│  │  │  6. Notify React context subscribers                     │ │  │
│  │  │                                                          │ │  │
│  │  └──────────────────────────────────────────────────────────┘ │  │
│  │                              │                                 │  │
│  │                              ▼                                 │  │
│  │  ┌──────────────────────────────────────────────────────────┐ │  │
│  │  │              CSS CUSTOM PROPERTIES                        │ │  │
│  │  │                                                          │ │  │
│  │  │  :root[data-venture="betedge"] {                         │ │  │
│  │  │    --color-primary-50: #eff6ff;                          │ │  │
│  │  │    --color-primary-500: #3b82f6;                         │ │  │
│  │  │    --color-primary-900: #1e3a5f;                         │ │  │
│  │  │    --font-heading: 'Inter', sans-serif;                  │ │  │
│  │  │    --radius-default: 0.5rem;                             │ │  │
│  │  │    ...200+ tokens                                        │ │  │
│  │  │  }                                                       │ │  │
│  │  └──────────────────────────────────────────────────────────┘ │  │
│  │                              │                                 │  │
│  │                              ▼                                 │  │
│  │  ┌──────────────────────────────────────────────────────────┐ │  │
│  │  │       ALL 508 COMPONENTS RE-SKIN AUTOMATICALLY           │ │  │
│  │  │                                                          │ │  │
│  │  │  Button ──► reads --color-primary-500 for "solid"        │ │  │
│  │  │  Card   ──► reads --color-surface, --radius-default      │ │  │
│  │  │  Badge  ──► reads --color-success-500 for "success"      │ │  │
│  │  │  Chart  ──► reads --color-chart-1..6 for series colors   │ │  │
│  │  └──────────────────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Theme Resolution Pipeline

When a venture context changes, the Chameleon Engine executes a deterministic resolution pipeline:

```typescript
// Pseudo-code for the resolution pipeline
function resolveTheme(ventureId: string, mode?: 'light' | 'dark'): ResolvedTheme {
  // 1. Load venture config (static import or async from registry)
  const ventureTheme = themeRegistry.get(ventureId) ?? defaultTheme;

  // 2. Determine color mode
  const colorMode = mode
    ?? userPreference.get(ventureId)           // Per-venture saved preference
    ?? ventureTheme.defaults.colorMode          // Venture default
    ?? systemPreference();                      // OS prefers-color-scheme

  // 3. Merge with base theme (venture overrides win)
  const merged = deepMerge(baseTheme, ventureTheme, { mode: colorMode });

  // 4. Validate contrast ratios
  const warnings = validateAccessibility(merged);
  if (warnings.length) console.warn('[Chameleon]', warnings);

  // 5. Flatten to CSS custom property map
  const properties = flattenToCSS(merged);

  // 6. Return resolved theme
  return { ventureId, colorMode, properties, warnings, raw: merged };
}
```

### Data Attribute Strategy

The engine uses `data-venture` and `data-mode` attributes on `<html>` for CSS cascade targeting:

```html
<!-- BetEdge in dark mode -->
<html data-venture="betedge" data-mode="dark" lang="en">

<!-- SerpSpace in light mode -->
<html data-venture="serpspace" data-mode="light" lang="en">

<!-- Super Admin (MCV base theme) -->
<html data-venture="mcv" data-mode="system" lang="en">
```

This enables pure CSS overrides without JavaScript for static contexts:

```css
/* Base token */
:root {
  --color-primary-500: #6366f1; /* MCV default indigo */
}

/* Venture override */
:root[data-venture="betedge"] {
  --color-primary-500: #3b82f6; /* BetEdge blue */
}

:root[data-venture="serpspace"] {
  --color-primary-500: #10b981; /* SerpSpace emerald */
}

/* Mode-specific overrides */
:root[data-mode="dark"] {
  --color-surface: #0a0a0b;
  --color-on-surface: #fafafa;
}

:root[data-mode="light"] {
  --color-surface: #ffffff;
  --color-on-surface: #0a0a0b;
}
```

### Theme Switching Performance

| Metric | Target | Mechanism |
|--------|--------|-----------|
| Theme switch latency | < 16ms (single frame) | CSS custom property mutation — no DOM diffing |
| FOUC prevention | Zero FOUC | Inline `<script>` in `<head>` sets `data-venture` before first paint |
| Bundle impact | 0 KB per theme | Themes are CSS declarations, not JS bundles |
| Memory overhead | ~2 KB per loaded theme | Token map stored in a flat `Map<string, string>` |
| React re-renders on switch | 1 (context update) | Only `ThemeProvider` consumers re-render; CSS handles visuals |

### Anti-FOUC Script

Placed in `<head>` before any stylesheet to prevent flash of wrong theme:

```typescript
// packages/ui/src/branding/anti-fouc.ts
export const antiFoucScript = `
  (function() {
    try {
      var venture = document.cookie.match(/mcv_venture=([^;]+)/)?.[1]
        || localStorage.getItem('mcv-venture')
        || 'mcv';
      var mode = localStorage.getItem('mcv-theme-' + venture)
        || (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');
      document.documentElement.setAttribute('data-venture', venture);
      document.documentElement.setAttribute('data-mode', mode);
    } catch(e) {}
  })();
`;
```

Usage in Next.js `layout.tsx`:

```tsx
import { antiFoucScript } from '@mcv/ui/branding';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: antiFoucScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

---

## Brand Configuration

Each venture's brand is defined by a structured configuration object that captures all visual identity elements. The configuration is fully typed, validated at build time, and resolved at runtime by the Chameleon Engine.

### Configuration Schema

```typescript
interface VentureBrandConfig {
  /** Unique venture identifier — matches data-venture attribute */
  id: string;

  /** Human-readable venture name */
  name: string;

  /** Optional tagline for branded contexts */
  tagline?: string;

  /** Logo assets */
  logos: {
    /** Primary logo (full color, horizontal) */
    primary: BrandAsset;
    /** Logo mark / icon only */
    mark: BrandAsset;
    /** Wordmark / text only */
    wordmark?: BrandAsset;
    /** Monochrome variant for constrained contexts */
    monochrome?: BrandAsset;
    /** Favicon source (used to generate multi-size favicons) */
    favicon: BrandAsset;
  };

  /** Color palette — overrides base theme tokens */
  colors: VentureColorConfig;

  /** Typography — font families, scale overrides */
  typography: VentureTypographyConfig;

  /** Default preferences */
  defaults: {
    /** Default color mode for this venture */
    colorMode: 'light' | 'dark' | 'system';
    /** Default border radius preset */
    radius: RadiusPreset;
    /** Default font scale multiplier (1 = 100%) */
    fontScale: number;
    /** Enable/disable animations globally */
    animations: boolean;
  };

  /** Open Graph / social sharing metadata */
  social: {
    ogImage: BrandAsset;
    twitterCard?: 'summary' | 'summary_large_image';
    themeColor: string; // Meta theme-color for mobile browsers
  };
}

interface BrandAsset {
  /** Light mode asset URL or import path */
  light: string;
  /** Dark mode asset URL or import path */
  dark: string;
  /** Alt text for accessibility */
  alt: string;
  /** Intrinsic width for layout hints */
  width?: number;
  /** Intrinsic height for layout hints */
  height?: number;
}
```

### Example: BetEdge Brand Configuration

```typescript
// packages/ui/src/branding/ventures/betedge.ts

import { defineVentureBrand } from '../define-venture-brand';

export const betedgeBrand = defineVentureBrand({
  id: 'betedge',
  name: 'BetEdge',
  tagline: 'Sharper Bets. Bigger Wins.',

  logos: {
    primary: {
      light: '/brands/betedge/logo-light.svg',
      dark: '/brands/betedge/logo-dark.svg',
      alt: 'BetEdge Logo',
      width: 180,
      height: 40,
    },
    mark: {
      light: '/brands/betedge/mark-light.svg',
      dark: '/brands/betedge/mark-dark.svg',
      alt: 'BetEdge',
      width: 32,
      height: 32,
    },
    favicon: {
      light: '/brands/betedge/favicon.svg',
      dark: '/brands/betedge/favicon.svg',
      alt: 'BetEdge',
    },
  },

  colors: {
    primary: {
      50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd',
      400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8',
      800: '#1e40af', 900: '#1e3a8a', 950: '#172554',
    },
    secondary: {
      50: '#fdf4ff', 100: '#fae8ff', 200: '#f5d0fe', 300: '#f0abfc',
      400: '#e879f9', 500: '#d946ef', 600: '#c026d3', 700: '#a21caf',
      800: '#86198f', 900: '#701a75', 950: '#4a044e',
    },
    accent: {
      50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74',
      400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c',
      800: '#9a3412', 900: '#7c2d12', 950: '#431407',
    },
  },

  typography: {
    heading: "'Instrument Sans', 'Inter', sans-serif",
    body: "'Inter', sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },

  defaults: {
    colorMode: 'dark',
    radius: 'lg',
    fontScale: 1,
    animations: true,
  },

  social: {
    ogImage: {
      light: '/brands/betedge/og-image.png',
      dark: '/brands/betedge/og-image-dark.png',
      alt: 'BetEdge — Sharper Bets. Bigger Wins.',
      width: 1200,
      height: 630,
    },
    twitterCard: 'summary_large_image',
    themeColor: '#3b82f6',
  },
});
```

### Example: SerpSpace Brand Configuration

```typescript
// packages/ui/src/branding/ventures/serpspace.ts

import { defineVentureBrand } from '../define-venture-brand';

export const serpspaceBrand = defineVentureBrand({
  id: 'serpspace',
  name: 'SerpSpace',
  tagline: 'Dominate Search. Scale Results.',

  logos: {
    primary: {
      light: '/brands/serpspace/logo-light.svg',
      dark: '/brands/serpspace/logo-dark.svg',
      alt: 'SerpSpace Logo',
      width: 200,
      height: 40,
    },
    mark: {
      light: '/brands/serpspace/mark-light.svg',
      dark: '/brands/serpspace/mark-dark.svg',
      alt: 'SerpSpace',
      width: 32,
      height: 32,
    },
    favicon: {
      light: '/brands/serpspace/favicon.svg',
      dark: '/brands/serpspace/favicon.svg',
      alt: 'SerpSpace',
    },
  },

  colors: {
    primary: {
      50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7',
      400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857',
      800: '#065f46', 900: '#064e3b', 950: '#022c22',
    },
    secondary: {
      50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4', 300: '#5eead4',
      400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e',
      800: '#115e59', 900: '#134e4a', 950: '#042f2e',
    },
    accent: {
      50: '#fefce8', 100: '#fef9c3', 200: '#fef08a', 300: '#fde047',
      400: '#facc15', 500: '#eab308', 600: '#ca8a04', 700: '#a16207',
      800: '#854d0e', 900: '#713f12', 950: '#422006',
    },
  },

  typography: {
    heading: "'DM Sans', 'Inter', sans-serif",
    body: "'Inter', sans-serif",
    mono: "'JetBrains Mono', monospace",
  },

  defaults: {
    colorMode: 'light',
    radius: 'md',
    fontScale: 1,
    animations: true,
  },

  social: {
    ogImage: {
      light: '/brands/serpspace/og-image.png',
      dark: '/brands/serpspace/og-image-dark.png',
      alt: 'SerpSpace — Dominate Search. Scale Results.',
      width: 1200,
      height: 630,
    },
    twitterCard: 'summary_large_image',
    themeColor: '#10b981',
  },
});
```

### Venture Brand Registry

All venture brands are registered in a central registry that the Chameleon Engine queries:

```typescript
// packages/ui/src/branding/registry.ts

import type { VentureBrandConfig } from './types';
import { mcvBrand } from './ventures/mcv';
import { betedgeBrand } from './ventures/betedge';
import { serpspaceBrand } from './ventures/serpspace';
import { forgeBrand } from './ventures/the-forge';

const registry = new Map<string, VentureBrandConfig>();

/** Register a venture brand config */
export function registerVentureBrand(config: VentureBrandConfig): void {
  if (registry.has(config.id)) {
    console.warn(`[Chameleon] Overwriting existing brand: ${config.id}`);
  }
  registry.set(config.id, config);
}

/** Retrieve a venture brand config (falls back to MCV base) */
export function getVentureBrand(ventureId: string): VentureBrandConfig {
  return registry.get(ventureId) ?? mcvBrand;
}

/** List all registered venture IDs */
export function listVentures(): string[] {
  return Array.from(registry.keys());
}

// Register built-in ventures
registerVentureBrand(mcvBrand);
registerVentureBrand(betedgeBrand);
registerVentureBrand(serpspaceBrand);
registerVentureBrand(forgeBrand);
```

---

## Theme Token System

The token system is the abstraction layer between venture brand configurations and CSS rendering. Tokens are organized into three semantic layers that map from high-level brand decisions down to component-level styling.

### Token Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 3: COMPONENT TOKENS (consumed by components directly)        │
│                                                                      │
│  --button-bg             → var(--color-primary-500)                 │
│  --button-bg-hover       → var(--color-primary-600)                 │
│  --card-bg               → var(--color-surface)                     │
│  --card-border           → var(--color-border)                      │
│  --input-ring            → var(--color-primary-400)                 │
│  --badge-success-bg      → var(--color-success-100)                 │
│  --chart-series-1        → var(--color-chart-1)                     │
├─────────────────────────────────────────────────────────────────────┤
│  LAYER 2: SEMANTIC TOKENS (map meaning to palette)                   │
│                                                                      │
│  --color-surface         → var(--color-neutral-50)   [light]        │
│  --color-surface         → var(--color-neutral-950)  [dark]         │
│  --color-on-surface      → var(--color-neutral-900)  [light]        │
│  --color-on-surface      → var(--color-neutral-50)   [dark]         │
│  --color-border          → var(--color-neutral-200)  [light]        │
│  --color-border          → var(--color-neutral-800)  [dark]         │
│  --color-muted           → var(--color-neutral-500)                 │
│  --color-accent          → var(--color-accent-500)                  │
├─────────────────────────────────────────────────────────────────────┤
│  LAYER 1: PRIMITIVE TOKENS (raw venture palette values)              │
│                                                                      │
│  --color-primary-50      → #eff6ff                                  │
│  --color-primary-500     → #3b82f6                                  │
│  --color-primary-900     → #1e3a8a                                  │
│  --color-neutral-50      → #fafafa                                  │
│  --color-neutral-950     → #0a0a0b                                  │
│  --font-heading          → 'Inter', sans-serif                      │
│  --radius-default        → 0.5rem                                   │
│  --shadow-sm             → 0 1px 2px rgba(0,0,0,0.05)              │
└─────────────────────────────────────────────────────────────────────┘
```

### Complete Token Inventory

The branding system defines **200+ CSS custom properties** organized into the following groups:

#### Color Tokens (140+)

```css
/* ── Palette Scales (11 steps × 8 palettes = 88 tokens) ── */

/* Primary — venture's main brand color */
--color-primary-50 through --color-primary-950

/* Secondary — complementary brand color */
--color-secondary-50 through --color-secondary-950

/* Accent — highlight / call-to-action color */
--color-accent-50 through --color-accent-950

/* Neutral — grays for text, borders, backgrounds */
--color-neutral-50 through --color-neutral-950

/* Success — positive outcomes */
--color-success-50 through --color-success-950

/* Warning — cautionary states */
--color-warning-50 through --color-warning-950

/* Danger — error / destructive states */
--color-danger-50 through --color-danger-950

/* Info — informational states */
--color-info-50 through --color-info-950

/* ── Semantic Surface Tokens (20+) ── */

--color-background          /* Page background */
--color-surface              /* Card / panel background */
--color-surface-raised       /* Elevated surface (modals, dropdowns) */
--color-surface-sunken       /* Recessed surface (code blocks, wells) */
--color-on-surface           /* Text on surface */
--color-on-surface-muted     /* Secondary text on surface */
--color-border               /* Default border color */
--color-border-strong        /* Emphasized border */
--color-border-subtle        /* De-emphasized border */
--color-ring                 /* Focus ring color */
--color-ring-offset          /* Focus ring offset background */
--color-overlay              /* Modal/drawer backdrop */
--color-selection            /* Text selection highlight */

/* ── Chart Colors (6 tokens) ── */

--color-chart-1 through --color-chart-6

/* ── Sidebar Tokens (10+) ── */

--color-sidebar-bg
--color-sidebar-fg
--color-sidebar-border
--color-sidebar-active
--color-sidebar-active-fg
--color-sidebar-hover
--color-sidebar-hover-fg
--color-sidebar-muted
--color-sidebar-accent
--color-sidebar-accent-fg
```

#### Typography Tokens (20+)

```css
/* ── Font Families ── */

--font-heading               /* Headings — e.g. 'Instrument Sans', sans-serif */
--font-body                  /* Body text — e.g. 'Inter', sans-serif */
--font-mono                  /* Code / monospace — e.g. 'JetBrains Mono', monospace */

/* ── Font Sizes (Modular Scale) ── */

--font-size-xs               /* 0.75rem  (12px) */
--font-size-sm               /* 0.875rem (14px) */
--font-size-base             /* 1rem     (16px) */
--font-size-lg               /* 1.125rem (18px) */
--font-size-xl               /* 1.25rem  (20px) */
--font-size-2xl              /* 1.5rem   (24px) */
--font-size-3xl              /* 1.875rem (30px) */
--font-size-4xl              /* 2.25rem  (36px) */
--font-size-5xl              /* 3rem     (48px) */

/* ── Font Weights ── */

--font-weight-normal         /* 400 */
--font-weight-medium         /* 500 */
--font-weight-semibold       /* 600 */
--font-weight-bold           /* 700 */

/* ── Line Heights ── */

--line-height-tight           /* 1.25 */
--line-height-normal          /* 1.5 */
--line-height-relaxed         /* 1.75 */

/* ── Letter Spacing ── */

--letter-spacing-tight        /* -0.025em */
--letter-spacing-normal       /* 0 */
--letter-spacing-wide         /* 0.025em */
```

#### Spacing & Layout Tokens (15+)

```css
--spacing-px                 /* 1px */
--spacing-0                  /* 0 */
--spacing-1                  /* 0.25rem  (4px) */
--spacing-2                  /* 0.5rem   (8px) */
--spacing-3                  /* 0.75rem  (12px) */
--spacing-4                  /* 1rem     (16px) */
--spacing-5                  /* 1.25rem  (20px) */
--spacing-6                  /* 1.5rem   (24px) */
--spacing-8                  /* 2rem     (32px) */
--spacing-10                 /* 2.5rem   (40px) */
--spacing-12                 /* 3rem     (48px) */
--spacing-16                 /* 4rem     (64px) */
--spacing-20                 /* 5rem     (80px) */
--spacing-24                 /* 6rem     (96px) */
```

#### Shape Tokens (10+)

```css
/* ── Border Radius ── */

--radius-none                /* 0 */
--radius-sm                  /* 0.25rem  (4px) */
--radius-default             /* 0.5rem   (8px) — venture-configurable */
--radius-md                  /* 0.375rem (6px) */
--radius-lg                  /* 0.75rem  (12px) */
--radius-xl                  /* 1rem     (16px) */
--radius-2xl                 /* 1.5rem   (24px) */
--radius-full                /* 9999px */

/* ── Shadows ── */

--shadow-xs                  /* Subtle elevation */
--shadow-sm                  /* Low elevation */
--shadow-md                  /* Medium elevation */
--shadow-lg                  /* High elevation */
--shadow-xl                  /* Max elevation */
--shadow-inner               /* Inset shadow */
--shadow-ring                /* Focus ring shadow (used with --color-ring) */
```

#### Motion Tokens (8+)

```css
--transition-fast            /* 150ms ease */
--transition-normal          /* 200ms ease */
--transition-slow            /* 300ms ease */
--transition-spring          /* 500ms cubic-bezier(0.34, 1.56, 0.64, 1) */

--duration-fast              /* 150ms */
--duration-normal            /* 200ms */
--duration-slow              /* 300ms */

--ease-default               /* cubic-bezier(0.4, 0, 0.2, 1) */
--ease-in                    /* cubic-bezier(0.4, 0, 1, 1) */
--ease-out                   /* cubic-bezier(0, 0, 0.2, 1) */
--ease-spring                /* cubic-bezier(0.34, 1.56, 0.64, 1) */
```

#### Z-Index Tokens (8)

```css
--z-base                     /* 0 */
--z-dropdown                 /* 1000 */
--z-sticky                   /* 1100 */
--z-fixed                    /* 1200 */
--z-overlay                  /* 1300 */
--z-modal                    /* 1400 */
--z-popover                  /* 1500 */
--z-toast                    /* 1600 */
--z-tooltip                  /* 1700 */
```

### Token Resolution Order

When a component reads a token, the CSS cascade resolves it through this specificity chain:

```
Component reads: var(--color-primary-500)
                          │
                          ▼
  1. [data-venture="betedge"][data-mode="dark"]   (most specific)
  2. [data-venture="betedge"]                      (venture default)
  3. [data-mode="dark"]                            (mode default)
  4. :root                                         (base fallback)
```

---

## Color System

The color system provides a systematic approach to generating, managing, and applying color palettes across ventures. Each venture defines up to 8 color scales, each with 11 steps from `50` (lightest) to `950` (darkest).

### Color Scale Structure

```
Step    Light Mode Usage              Dark Mode Usage
─────   ────────────────────────      ────────────────────────
50      Tinted backgrounds            —
100     Hover backgrounds             —
200     Subtle borders                Active text
300     —                             Hover text
400     —                             Default text
500     DEFAULT — buttons, links      DEFAULT — buttons, links
600     Hover states (solid)          Hover states (solid)
700     Active/pressed states         Active/pressed states
800     —                             Subtle borders
900     Heading text                  Hover backgrounds
950     Body text                     Tinted backgrounds
```

### Palette Roles

| Palette | Purpose | Example (BetEdge) | Example (SerpSpace) |
|---------|---------|-------------------|---------------------|
| **Primary** | Brand identity, primary CTAs, active states | Blue `#3b82f6` | Emerald `#10b981` |
| **Secondary** | Supporting elements, secondary CTAs | Purple `#d946ef` | Teal `#14b8a6` |
| **Accent** | Highlights, promotions, attention-grabbers | Orange `#f97316` | Yellow `#eab308` |
| **Neutral** | Text, borders, backgrounds, surfaces | Slate | Zinc |
| **Success** | Positive outcomes, confirmations | Green `#22c55e` | Green `#22c55e` |
| **Warning** | Caution, pending states | Amber `#f59e0b` | Amber `#f59e0b` |
| **Danger** | Errors, destructive actions | Red `#ef4444` | Red `#ef4444` |
| **Info** | Informational, tips, notes | Sky `#0ea5e9` | Sky `#0ea5e9` |

### Color Generation

Ventures can provide full 11-step scales manually, or supply a single seed color and let the generator produce the full scale:

```typescript
import { generateColorScale } from '@mcv/ui/branding';

// Generate full scale from a single seed
const primaryScale = generateColorScale('#3b82f6');
// Returns: { 50: '#eff6ff', 100: '#dbeafe', ..., 950: '#172554' }

// Generate with custom lightness curve
const customScale = generateColorScale('#10b981', {
  lightnessCurve: 'perceptual',  // 'linear' | 'perceptual' | 'material'
  saturationBoost: 0.1,          // Boost saturation in mid-tones
  hueShift: 2,                   // Slight hue rotation across scale
});
```

### Accessibility Validation

The color system includes built-in WCAG 2.1 AA contrast validation:

```typescript
import { validatePaletteAccessibility } from '@mcv/ui/branding';

const report = validatePaletteAccessibility({
  primary: betedgeColors.primary,
  neutral: betedgeColors.neutral,
});

// report.results:
// [
//   { pair: 'primary-500 on neutral-50', ratio: 4.68, level: 'AA', pass: true },
//   { pair: 'primary-500 on neutral-100', ratio: 3.92, level: 'AA', pass: false },
//   { pair: 'primary-700 on neutral-50', ratio: 7.21, level: 'AAA', pass: true },
// ]
//
// report.warnings:
// [ 'primary-500 on neutral-100 fails AA (3.92:1, need 4.5:1)' ]
```

### Chart Color Tokens

Six dedicated chart color tokens ensure data visualizations are readable across all ventures and modes:

```typescript
interface VentureChartColors {
  chart1: string; // Primary series
  chart2: string; // Secondary series
  chart3: string; // Tertiary series
  chart4: string; // Quaternary series
  chart5: string; // Quinary series
  chart6: string; // Senary series
}
```

Chart colors are derived from the venture palette but validated for:
- Minimum distinguishability (CIEDE2000 ΔE ≥ 15 between adjacent series)
- Colorblind safety (simulated deuteranopia, protanopia, tritanopia)
- Consistent perceived brightness across series

---

## Typography System

The typography system defines font families, a modular type scale, weight tokens, and line height presets that ventures can override to match their brand typography.

### Font Stack Configuration

Each venture specifies three font stacks:

```typescript
interface VentureTypographyConfig {
  /** Heading font family stack */
  heading: string;

  /** Body text font family stack */
  body: string;

  /** Monospace font family stack */
  mono: string;

  /** Optional: scale multiplier (1 = 100%, 1.1 = 110%) */
  scale?: number;

  /** Optional: custom font weights */
  weights?: {
    normal?: number;   // Default: 400
    medium?: number;   // Default: 500
    semibold?: number; // Default: 600
    bold?: number;     // Default: 700
  };

  /** Optional: custom line height multipliers */
  lineHeights?: {
    tight?: number;    // Default: 1.25
    normal?: number;   // Default: 1.5
    relaxed?: number;  // Default: 1.75
  };
}
```

### Modular Type Scale

The system uses a **1.250 (Major Third)** ratio by default, configurable per venture:

```
Step     Size (rem)    Pixels (at 16px base)    Usage
──────   ──────────    ─────────────────────    ─────────────────────────
xs       0.75          12                       Captions, badges, chips
sm       0.875         14                       Secondary text, labels
base     1.000         16                       Body text (root)
lg       1.125         18                       Lead text, large body
xl       1.250         20                       H6, small headings
2xl      1.500         24                       H5, section headings
3xl      1.875         30                       H4, subsection headings
4xl      2.250         36                       H3, page titles
5xl      3.000         48                       H2, hero headings
6xl      3.750         60                       H1, display headings
```

### Font Loading Strategy

Venture fonts are loaded via `next/font` for optimal performance:

```typescript
// packages/ui/src/branding/fonts/betedge.ts

import { Inter } from 'next/font/google';
import localFont from 'next/font/local';

export const betedgeFonts = {
  heading: localFont({
    src: [
      { path: './InstrumentSans-Regular.woff2', weight: '400' },
      { path: './InstrumentSans-SemiBold.woff2', weight: '600' },
      { path: './InstrumentSans-Bold.woff2', weight: '700' },
    ],
    variable: '--font-heading',
    display: 'swap',
    preload: true,
  }),

  body: Inter({
    subsets: ['latin'],
    variable: '--font-body',
    display: 'swap',
  }),
};
```

### Responsive Typography

The type scale adjusts at breakpoints via CSS `clamp()`:

```css
/* Fluid heading that scales between 24px (mobile) and 36px (desktop) */
--font-size-4xl: clamp(1.5rem, 1.2rem + 1.5vw, 2.25rem);

/* Fluid display heading */
--font-size-6xl: clamp(2.25rem, 1.5rem + 3vw, 3.75rem);
```

---

## Dark/Light Mode

The branding system provides comprehensive dark/light mode support with automatic detection, manual toggle, per-venture defaults, and persistent user preferences.

### Mode Resolution Chain

```
Priority    Source                      Example
────────    ──────                      ───────
1 (highest) Explicit prop               <ThemeProvider mode="dark">
2           User preference (stored)    localStorage: mcv-theme-betedge=dark
3           Venture default             betedgeBrand.defaults.colorMode = 'dark'
4           System preference           prefers-color-scheme: dark
5 (lowest)  Fallback                    'light'
```

### Mode-Aware Token Mapping

Semantic tokens resolve differently based on the active mode:

```css
/* ── Light Mode ── */
:root[data-mode="light"] {
  --color-background: var(--color-neutral-50);
  --color-surface: #ffffff;
  --color-surface-raised: #ffffff;
  --color-surface-sunken: var(--color-neutral-100);
  --color-on-surface: var(--color-neutral-900);
  --color-on-surface-muted: var(--color-neutral-500);
  --color-border: var(--color-neutral-200);
  --color-border-strong: var(--color-neutral-300);
  --color-border-subtle: var(--color-neutral-100);
  --color-overlay: rgba(0, 0, 0, 0.5);
  --color-selection: var(--color-primary-100);
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
}

/* ── Dark Mode ── */
:root[data-mode="dark"] {
  --color-background: var(--color-neutral-950);
  --color-surface: var(--color-neutral-900);
  --color-surface-raised: var(--color-neutral-800);
  --color-surface-sunken: var(--color-neutral-950);
  --color-on-surface: var(--color-neutral-50);
  --color-on-surface-muted: var(--color-neutral-400);
  --color-border: var(--color-neutral-800);
  --color-border-strong: var(--color-neutral-700);
  --color-border-subtle: var(--color-neutral-900);
  --color-overlay: rgba(0, 0, 0, 0.75);
  --color-selection: var(--color-primary-900);
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4);
}
```

### System Preference Detection

```typescript
// packages/ui/src/branding/hooks/use-system-theme.ts

import { useEffect, useState } from 'react';

export function useSystemTheme(): 'light' | 'dark' {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? 'dark' : 'light');
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return theme;
}
```

### Persistent Mode Preference

Mode preferences are stored per-venture so users can have dark mode on BetEdge and light mode on SerpSpace simultaneously:

```typescript
// Storage key pattern: mcv-theme-{ventureId}
// Values: 'light' | 'dark' | 'system'

function persistModePreference(ventureId: string, mode: ThemeMode): void {
  localStorage.setItem(`mcv-theme-${ventureId}`, mode);
  // Also set cookie for SSR anti-FOUC
  document.cookie = `mcv_theme_${ventureId}=${mode};path=/;max-age=31536000;SameSite=Lax`;
}

function getModePreference(ventureId: string): ThemeMode | null {
  return localStorage.getItem(`mcv-theme-${ventureId}`) as ThemeMode | null;
}
```

### Transition Animation

Mode switches include a smooth CSS transition to prevent jarring visual changes:

```css
/* Applied during mode transitions only */
html.theme-transitioning,
html.theme-transitioning *,
html.theme-transitioning *::before,
html.theme-transitioning *::after {
  transition: background-color 200ms ease,
              color 200ms ease,
              border-color 200ms ease,
              box-shadow 200ms ease !important;
}
```

```typescript
function transitionTheme(callback: () => void): void {
  document.documentElement.classList.add('theme-transitioning');
  callback();
  // Remove after transition completes
  setTimeout(() => {
    document.documentElement.classList.remove('theme-transitioning');
  }, 250);
}
```

---

## Brand Asset Management

The branding system includes a pipeline for managing, validating, and serving brand assets (logos, favicons, OG images) across ventures.

### Asset Directory Structure

```
public/
  brands/
    mcv/
      logo-light.svg
      logo-dark.svg
      mark-light.svg
      mark-dark.svg
      favicon.svg
      og-image.png
      og-image-dark.png
    betedge/
      logo-light.svg
      logo-dark.svg
      mark-light.svg
      mark-dark.svg
      favicon.svg
      og-image.png
      og-image-dark.png
    serpspace/
      ...
    the-forge/
      ...
```

### Logo Component

The `<Logo>` component automatically renders the correct venture logo based on active theme context:

```tsx
import { Logo, LogoMark, Wordmark } from '@mcv/ui';

// Renders full logo for active venture + current mode
<Logo className="h-8 w-auto" />

// Renders just the icon mark
<LogoMark size={32} />

// Renders just the wordmark text
<Wordmark className="h-6" />

// Override venture (e.g., in Super Admin switching between ventures)
<Logo venture="betedge" mode="dark" />
```

### Favicon Generation

The system generates multi-size favicons from a single SVG source:

```typescript
// packages/ui/src/branding/assets/generate-favicons.ts

interface FaviconGeneratorConfig {
  source: string;      // Path to source SVG
  outputDir: string;   // Output directory
  sizes: number[];     // Target sizes (default: [16, 32, 48, 64, 128, 192, 512])
  formats: ('png' | 'ico')[];
}

// Generated at build time
// Output:
//   favicon-16.png
//   favicon-32.png
//   favicon-192.png  (Android)
//   favicon-512.png  (PWA)
//   favicon.ico      (legacy)
//   apple-touch-icon.png (180×180)
```

### OG Image Templates

Ventures can use template-based OG image generation for dynamic pages:

```typescript
import { generateOGImage } from '@mcv/ui/branding';

// Generate OG image for a specific page
const ogImage = await generateOGImage({
  venture: 'betedge',
  title: 'NFL Week 12 Predictions',
  subtitle: 'AI-powered picks with 73% accuracy',
  template: 'article', // 'default' | 'article' | 'product' | 'event'
});
```

### Asset Validation

Brand assets are validated at build time:

| Check | Requirement | Error Level |
|-------|-------------|-------------|
| Logo SVG viewBox | Must have explicit viewBox | Error |
| Logo file size | < 50KB (SVG), < 200KB (PNG) | Warning |
| Favicon source | SVG preferred, PNG ≥ 512px | Error |
| OG image dimensions | 1200×630px | Warning |
| Alt text | Required for all assets | Error |
| Dark variant | Required for logos and OG images | Warning |

---

## Component Theming

Every component in the `@mcv/ui` library consumes brand tokens through CSS custom properties. The theming system ensures components automatically adapt when the venture or mode changes.

### HeroUI Token Mapping

HeroUI components use their own token naming. The branding system maps MCV tokens to HeroUI's expected structure:

```css
/* HeroUI ← MCV Token Mapping */

:root {
  /* HeroUI expects these specific token names */
  --heroui-background: var(--color-background);
  --heroui-foreground: var(--color-on-surface);
  --heroui-primary: var(--color-primary-500);
  --heroui-primary-foreground: #ffffff;
  --heroui-secondary: var(--color-secondary-500);
  --heroui-secondary-foreground: #ffffff;
  --heroui-success: var(--color-success-500);
  --heroui-success-foreground: #ffffff;
  --heroui-warning: var(--color-warning-500);
  --heroui-warning-foreground: #000000;
  --heroui-danger: var(--color-danger-500);
  --heroui-danger-foreground: #ffffff;
  --heroui-default: var(--color-neutral-200);
  --heroui-default-foreground: var(--color-neutral-800);
  --heroui-content1: var(--color-surface);
  --heroui-content2: var(--color-surface-raised);
  --heroui-content3: var(--color-surface-sunken);
  --heroui-content4: var(--color-neutral-300);
  --heroui-divider: var(--color-border);
  --heroui-focus: var(--color-ring);
}
```

### Component Token Consumption Patterns

Components consume tokens through Tailwind CSS utility classes that reference custom properties:

```tsx
// Button — consumes primary color tokens
function Button({ variant = 'solid', color = 'primary', children, ...props }) {
  return (
    <button
      className={cn(
        // Base styles
        'inline-flex items-center justify-center font-medium',
        'transition-colors duration-[var(--duration-fast)]',
        'rounded-[var(--radius-default)]',

        // Variant + color combination
        variant === 'solid' && color === 'primary' && [
          'bg-[var(--color-primary-500)]',
          'text-white',
          'hover:bg-[var(--color-primary-600)]',
          'active:bg-[var(--color-primary-700)]',
          'focus-visible:ring-2 ring-[var(--color-ring)]',
        ],

        variant === 'outline' && color === 'primary' && [
          'border border-[var(--color-primary-500)]',
          'text-[var(--color-primary-500)]',
          'hover:bg-[var(--color-primary-50)]',
        ],
      )}
      {...props}
    >
      {children}
    </button>
  );
}
```

### Tailwind CSS v4 Integration

The token system integrates with Tailwind CSS v4's native CSS variable support:

```css
/* tailwind.css — theme extension */
@theme {
  --color-primary-50: var(--color-primary-50);
  --color-primary-100: var(--color-primary-100);
  --color-primary-200: var(--color-primary-200);
  --color-primary-300: var(--color-primary-300);
  --color-primary-400: var(--color-primary-400);
  --color-primary-500: var(--color-primary-500);
  --color-primary-600: var(--color-primary-600);
  --color-primary-700: var(--color-primary-700);
  --color-primary-800: var(--color-primary-800);
  --color-primary-900: var(--color-primary-900);
  --color-primary-950: var(--color-primary-950);

  /* Enables: bg-primary-500, text-primary-500, border-primary-500, etc. */
}
```

This allows components to use standard Tailwind utility classes that automatically respect the active venture theme:

```tsx
// These classes resolve to venture-specific colors at runtime
<div className="bg-primary-500 text-white hover:bg-primary-600">
  Themed button
</div>

<div className="bg-surface border border-border text-on-surface">
  Themed card
</div>
```

### Component Category Token Requirements

| Component Category | Key Tokens Consumed |
|-------------------|-------------------|
| **Button** | `--color-primary-*`, `--color-secondary-*`, `--radius-default`, `--transition-fast` |
| **Card** | `--color-surface`, `--color-border`, `--radius-lg`, `--shadow-sm` |
| **Input** | `--color-surface`, `--color-border`, `--color-ring`, `--radius-default`, `--font-body` |
| **Badge** | `--color-{semantic}-100`, `--color-{semantic}-700`, `--radius-full`, `--font-size-xs` |
| **Alert** | `--color-{semantic}-50`, `--color-{semantic}-500`, `--radius-lg` |
| **Charts** | `--color-chart-1` through `--color-chart-6`, `--font-body`, `--color-on-surface-muted` |
| **Table** | `--color-surface`, `--color-border`, `--color-neutral-*`, `--font-body` |
| **Sidebar** | `--color-sidebar-*` (10 tokens), `--font-body` |
| **Dialog** | `--color-surface-raised`, `--color-overlay`, `--radius-xl`, `--shadow-xl` |
| **Typography** | `--font-heading`, `--font-body`, `--font-mono`, `--font-size-*`, `--font-weight-*` |

---

## Venture Theme Creation

This section provides a step-by-step guide for creating a new venture theme.

### Step 1: Define Brand Configuration

Create a new file in the ventures directory:

```typescript
// packages/ui/src/branding/ventures/new-venture.ts

import { defineVentureBrand } from '../define-venture-brand';

export const newVentureBrand = defineVentureBrand({
  id: 'new-venture',
  name: 'New Venture',
  tagline: 'Your tagline here.',

  logos: {
    primary: {
      light: '/brands/new-venture/logo-light.svg',
      dark: '/brands/new-venture/logo-dark.svg',
      alt: 'New Venture Logo',
    },
    mark: {
      light: '/brands/new-venture/mark-light.svg',
      dark: '/brands/new-venture/mark-dark.svg',
      alt: 'New Venture',
    },
    favicon: {
      light: '/brands/new-venture/favicon.svg',
      dark: '/brands/new-venture/favicon.svg',
      alt: 'New Venture',
    },
  },

  colors: {
    // Provide full scales or seed colors
    primary: '#8b5cf6',   // Seed — auto-generates 11-step scale
    secondary: '#ec4899', // Seed
    accent: '#f59e0b',    // Seed
    // neutral, success, warning, danger, info inherit from base
  },

  typography: {
    heading: "'Poppins', 'Inter', sans-serif",
    body: "'Inter', sans-serif",
    mono: "'JetBrains Mono', monospace",
  },

  defaults: {
    colorMode: 'system',
    radius: 'lg',
    fontScale: 1,
    animations: true,
  },

  social: {
    ogImage: {
      light: '/brands/new-venture/og-image.png',
      dark: '/brands/new-venture/og-image-dark.png',
      alt: 'New Venture',
    },
    themeColor: '#8b5cf6',
  },
});
```

### Step 2: Register the Brand

```typescript
// packages/ui/src/branding/registry.ts

import { newVentureBrand } from './ventures/new-venture';

registerVentureBrand(newVentureBrand);
```

### Step 3: Add Brand Assets

Place assets in the public directory:

```
public/brands/new-venture/
  logo-light.svg        ← Full logo, light backgrounds
  logo-dark.svg         ← Full logo, dark backgrounds
  mark-light.svg        ← Icon only, light backgrounds
  mark-dark.svg         ← Icon only, dark backgrounds
  favicon.svg           ← Source for favicon generation
  og-image.png          ← 1200×630 Open Graph image
  og-image-dark.png     ← Dark variant OG image
```

### Step 4: Configure Fonts

```typescript
// packages/ui/src/branding/fonts/new-venture.ts

import { Inter } from 'next/font/google';
import { Poppins } from 'next/font/google';

export const newVentureFonts = {
  heading: Poppins({
    subsets: ['latin'],
    weight: ['400', '600', '700'],
    variable: '--font-heading',
    display: 'swap',
  }),
  body: Inter({
    subsets: ['latin'],
    variable: '--font-body',
    display: 'swap',
  }),
};
```

### Step 5: Validate the Theme

```bash
# CLI validation command
pnpm mcv theme:validate new-venture

# Output:
# ✓ Brand config schema valid
# ✓ All logo assets found
# ✓ Favicon source present
# ✓ OG images present (1200×630)
# ✓ Primary scale: 11 steps generated from seed #8b5cf6
# ✓ WCAG AA contrast: 42/42 pairs pass
# ⚠ Secondary-500 on neutral-100 ratio is 4.12:1 (AA requires 4.5:1)
# ✓ Font files loadable
# ✓ Theme registered successfully
```

### Step 6: Preview in Storybook

```bash
pnpm storybook

# Use the theme switcher addon to select "New Venture"
# All components render with the new brand
```

### CLI Scaffolding

For convenience, the MCV CLI can scaffold a new venture theme:

```bash
pnpm mcv theme:create my-venture \
  --name "My Venture" \
  --primary "#8b5cf6" \
  --secondary "#ec4899" \
  --font-heading "Poppins" \
  --mode dark

# Creates:
#   packages/ui/src/branding/ventures/my-venture.ts
#   packages/ui/src/branding/fonts/my-venture.ts
#   public/brands/my-venture/ (directory with placeholders)
#   Updates registry.ts with import + registration
```

---

## Configuration API

### ThemeProvider

The root provider that initializes the Chameleon Engine and provides theme context to the entire application:

```tsx
// packages/ui/src/branding/providers/theme-provider.tsx

interface ThemeProviderProps {
  /** Active venture ID */
  venture: string;

  /** Force a specific color mode (overrides all other resolution) */
  mode?: 'light' | 'dark' | 'system';

  /** Disable mode transitions (useful for SSR / testing) */
  disableTransitions?: boolean;

  /** Custom theme overrides (merged on top of venture theme) */
  overrides?: Partial<ThemeTokens>;

  /** Callback when theme changes */
  onThemeChange?: (theme: ResolvedTheme) => void;

  /** Children */
  children: React.ReactNode;
}

export function ThemeProvider({
  venture,
  mode,
  disableTransitions = false,
  overrides,
  onThemeChange,
  children,
}: ThemeProviderProps) {
  // Implementation:
  // 1. Resolves theme via Chameleon Engine
  // 2. Injects CSS custom properties onto <html>
  // 3. Sets data-venture and data-mode attributes
  // 4. Provides ThemeContext for hooks
  // 5. Manages mode persistence
  // ...
}
```

**Usage:**

```tsx
// app/layout.tsx

import { ThemeProvider } from '@mcv/ui/branding';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const ventureId = getVentureFromDomain(); // e.g., 'betedge'

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: antiFoucScript }} />
      </head>
      <body>
        <ThemeProvider venture={ventureId}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### useTheme Hook

Access and control the active theme from any component:

```typescript
// packages/ui/src/branding/hooks/use-theme.ts

interface UseThemeReturn {
  /** Active venture ID */
  venture: string;

  /** Active color mode */
  mode: 'light' | 'dark';

  /** Resolved mode source ('user' | 'venture' | 'system') */
  modeSource: 'user' | 'venture' | 'system';

  /** Full resolved theme object */
  theme: ResolvedTheme;

  /** Set color mode (persists to localStorage) */
  setMode: (mode: 'light' | 'dark' | 'system') => void;

  /** Toggle between light and dark */
  toggleMode: () => void;

  /** Check if currently dark */
  isDark: boolean;

  /** Check if currently light */
  isLight: boolean;

  /** Get a specific token value */
  getToken: (token: string) => string;

  /** Get the resolved color for a semantic role */
  getColor: (role: SemanticColor, step?: ColorStep) => string;
}

export function useTheme(): UseThemeReturn;
```

**Usage:**

```tsx
import { useTheme } from '@mcv/ui/branding';

function Header() {
  const { venture, mode, toggleMode, isDark } = useTheme();

  return (
    <header>
      <Logo />
      <span>Welcome to {venture}</span>
      <button onClick={toggleMode}>
        {isDark ? '☀️' : '🌙'}
      </button>
    </header>
  );
}
```

### useVenture Hook

Access venture-specific brand configuration:

```typescript
// packages/ui/src/branding/hooks/use-venture.ts

interface UseVentureReturn {
  /** Venture brand configuration */
  brand: VentureBrandConfig;

  /** Venture ID */
  id: string;

  /** Venture display name */
  name: string;

  /** Get logo URL for current mode */
  logoUrl: string;

  /** Get logo mark URL for current mode */
  markUrl: string;

  /** Get favicon URL */
  faviconUrl: string;

  /** Get OG image URL for current mode */
  ogImageUrl: string;

  /** Meta theme-color value */
  themeColor: string;
}

export function useVenture(): UseVentureReturn;
```

**Usage:**

```tsx
import { useVenture } from '@mcv/ui/branding';

function SEOHead() {
  const { brand, ogImageUrl, themeColor } = useVenture();

  return (
    <Head>
      <meta property="og:image" content={ogImageUrl} />
      <meta name="theme-color" content={themeColor} />
      <title>{brand.name}</title>
    </Head>
  );
}
```

### createVentureTheme

Programmatically create a venture theme (useful for runtime customization or white-label scenarios):

```typescript
// packages/ui/src/branding/create-venture-theme.ts

interface CreateVentureThemeOptions {
  /** Base venture to extend (defaults to 'mcv') */
  extends?: string;

  /** Color overrides */
  colors?: Partial<VentureColorConfig>;

  /** Typography overrides */
  typography?: Partial<VentureTypographyConfig>;

  /** Default preferences */
  defaults?: Partial<VentureDefaults>;
}

export function createVentureTheme(
  id: string,
  options: CreateVentureThemeOptions
): VentureBrandConfig;
```

**Usage:**

```typescript
import { createVentureTheme, registerVentureBrand } from '@mcv/ui/branding';

// Create a custom theme extending BetEdge
const customTheme = createVentureTheme('betedge-vip', {
  extends: 'betedge',
  colors: {
    primary: '#fbbf24', // Gold primary for VIP
    accent: '#f43f5e',  // Rose accent
  },
  defaults: {
    colorMode: 'dark',
    radius: 'xl',
  },
});

registerVentureBrand(customTheme);
```

### defineVentureBrand

Type-safe builder for venture brand configurations with validation:

```typescript
// packages/ui/src/branding/define-venture-brand.ts

/**
 * Define a venture brand configuration with full type safety.
 * Validates required fields and normalizes color inputs.
 */
export function defineVentureBrand(config: VentureBrandInput): VentureBrandConfig {
  // 1. Validate required fields
  assertRequiredFields(config);

  // 2. Normalize color inputs (seed strings → full scales)
  const normalizedColors = normalizeColors(config.colors);

  // 3. Generate derived tokens (chart colors, sidebar colors)
  const derivedTokens = deriveSemantic(normalizedColors);

  // 4. Merge with defaults
  return {
    ...config,
    colors: { ...normalizedColors, ...derivedTokens },
  };
}
```

---

## Storybook Integration

The branding system ships a Storybook addon that enables visual QA across all venture themes directly in the component development environment.

### Theme Switcher Addon

```typescript
// packages/ui/.storybook/addons/theme-switcher.ts

import { addons, types } from '@storybook/manager-api';
import { listVentures } from '@mcv/ui/branding';

addons.register('mcv/theme-switcher', () => {
  addons.add('mcv/theme-switcher/toolbar', {
    type: types.TOOL,
    title: 'Venture Theme',
    match: ({ viewMode }) => viewMode === 'story' || viewMode === 'docs',
    render: ThemeSwitcherTool,
  });
});
```

### Storybook Decorator

```typescript
// packages/ui/.storybook/decorators/with-theme.tsx

import { ThemeProvider } from '@mcv/ui/branding';

export function withTheme(Story, context) {
  const venture = context.globals.venture ?? 'mcv';
  const mode = context.globals.mode ?? 'light';

  return (
    <ThemeProvider venture={venture} mode={mode}>
      <div className="p-6 bg-[var(--color-background)] text-[var(--color-on-surface)]">
        <Story />
      </div>
    </ThemeProvider>
  );
}
```

### Global Types Configuration

```typescript
// packages/ui/.storybook/preview.ts

export const globalTypes = {
  venture: {
    name: 'Venture',
    description: 'Active venture theme',
    defaultValue: 'mcv',
    toolbar: {
      icon: 'paintbrush',
      items: [
        { value: 'mcv', title: 'MCV.ONE (Base)' },
        { value: 'betedge', title: 'BetEdge' },
        { value: 'serpspace', title: 'SerpSpace' },
        { value: 'the-forge', title: 'The Forge' },
      ],
      dynamicTitle: true,
    },
  },
  mode: {
    name: 'Color Mode',
    description: 'Light or dark mode',
    defaultValue: 'light',
    toolbar: {
      icon: 'sun',
      items: [
        { value: 'light', title: '☀️ Light', icon: 'sun' },
        { value: 'dark', title: '🌙 Dark', icon: 'moon' },
      ],
      dynamicTitle: true,
    },
  },
};

export const decorators = [withTheme];
```

### Theme Matrix Testing

For comprehensive visual regression testing, the system supports rendering stories across all venture × mode combinations:

```typescript
// packages/ui/.storybook/theme-matrix.ts

import { listVentures } from '@mcv/ui/branding';

/**
 * Generate story variants for all venture + mode combinations.
 * Used with Chromatic for visual regression testing.
 */
export function withThemeMatrix(Story) {
  const ventures = listVentures(); // ['mcv', 'betedge', 'serpspace', 'the-forge']
  const modes: Array<'light' | 'dark'> = ['light', 'dark'];

  return ventures.flatMap((venture) =>
    modes.map((mode) => ({
      name: `${venture}/${mode}`,
      render: () => (
        <ThemeProvider venture={venture} mode={mode}>
          <Story />
        </ThemeProvider>
      ),
    }))
  );
}
```

---

## TypeScript Interfaces

### Core Types

```typescript
// packages/ui/src/branding/types.ts

// ─── Color Types ──────────────────────────────────────────────────────

/** 11-step color scale from 50 (lightest) to 950 (darkest) */
interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

/** Color step values */
type ColorStep = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;

/** Color input — either a full scale or a seed hex for auto-generation */
type ColorInput = ColorScale | string;

/** Venture color configuration */
interface VentureColorConfig {
  primary: ColorInput;
  secondary: ColorInput;
  accent: ColorInput;
  neutral?: ColorInput;
  success?: ColorInput;
  warning?: ColorInput;
  danger?: ColorInput;
  info?: ColorInput;
  chart?: VentureChartColors;
}

/** Chart-specific color tokens */
interface VentureChartColors {
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
  chart6: string;
}

// ─── Typography Types ─────────────────────────────────────────────────

/** Venture typography configuration */
interface VentureTypographyConfig {
  heading: string;
  body: string;
  mono: string;
  scale?: number;
  weights?: {
    normal?: number;
    medium?: number;
    semibold?: number;
    bold?: number;
  };
  lineHeights?: {
    tight?: number;
    normal?: number;
    relaxed?: number;
  };
}

// ─── Theme Types ──────────────────────────────────────────────────────

/** Theme color mode */
type ThemeMode = 'light' | 'dark' | 'system';

/** Resolved mode (system resolved to light or dark) */
type ResolvedMode = 'light' | 'dark';

/** Border radius presets */
type RadiusPreset = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

/** Venture default preferences */
interface VentureDefaults {
  colorMode: ThemeMode;
  radius: RadiusPreset;
  fontScale: number;
  animations: boolean;
}

// ─── Brand Asset Types ────────────────────────────────────────────────

/** A brand asset with light/dark variants */
interface BrandAsset {
  light: string;
  dark: string;
  alt: string;
  width?: number;
  height?: number;
}

/** Venture logo configuration */
interface VentureLogos {
  primary: BrandAsset;
  mark: BrandAsset;
  wordmark?: BrandAsset;
  monochrome?: BrandAsset;
  favicon: BrandAsset;
}

/** Social/OG metadata */
interface VentureSocial {
  ogImage: BrandAsset;
  twitterCard?: 'summary' | 'summary_large_image';
  themeColor: string;
}

// ─── Complete Theme Types ─────────────────────────────────────────────

/** Full venture brand configuration (input) */
interface VentureBrandInput {
  id: string;
  name: string;
  tagline?: string;
  logos: VentureLogos;
  colors: VentureColorConfig;
  typography: VentureTypographyConfig;
  defaults: VentureDefaults;
  social: VentureSocial;
}

/** Validated and normalized venture brand configuration */
interface VentureBrandConfig extends VentureBrandInput {
  colors: NormalizedColorConfig; // All ColorInputs resolved to full ColorScales
}

/** Color config after normalization (all seeds expanded to full scales) */
interface NormalizedColorConfig {
  primary: ColorScale;
  secondary: ColorScale;
  accent: ColorScale;
  neutral: ColorScale;
  success: ColorScale;
  warning: ColorScale;
  danger: ColorScale;
  info: ColorScale;
  chart: VentureChartColors;
}

/** Flat map of CSS custom property name → value */
type ThemeTokenMap = Map<string, string>;

/** Resolved theme after Chameleon Engine processing */
interface ResolvedTheme {
  /** Active venture ID */
  ventureId: string;

  /** Resolved color mode */
  colorMode: ResolvedMode;

  /** Flat CSS custom property map */
  properties: ThemeTokenMap;

  /** Accessibility warnings from validation */
  warnings: string[];

  /** Raw brand config reference */
  raw: VentureBrandConfig;
}

/** Theme context value provided by ThemeProvider */
interface ThemeContextValue {
  venture: string;
  mode: ResolvedMode;
  modeSource: 'user' | 'venture' | 'system';
  theme: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  isDark: boolean;
  isLight: boolean;
  getToken: (token: string) => string;
  getColor: (role: string, step?: ColorStep) => string;
}
```

### Utility Types

```typescript
/** Extract the color palette names from a venture config */
type PaletteName = keyof NormalizedColorConfig;

/** Token path for type-safe getToken access */
type TokenPath =
  | `color-${PaletteName}-${ColorStep}`
  | `color-${'background' | 'surface' | 'surface-raised' | 'surface-sunken'}`
  | `color-${'on-surface' | 'on-surface-muted'}`
  | `color-${'border' | 'border-strong' | 'border-subtle'}`
  | `color-${'ring' | 'overlay' | 'selection'}`
  | `color-chart-${1 | 2 | 3 | 4 | 5 | 6}`
  | `font-${'heading' | 'body' | 'mono'}`
  | `font-size-${'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl'}`
  | `font-weight-${'normal' | 'medium' | 'semibold' | 'bold'}`
  | `radius-${'none' | 'sm' | 'default' | 'md' | 'lg' | 'xl' | '2xl' | 'full'}`
  | `shadow-${'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'inner' | 'ring'}`
  | `spacing-${number}`
  | `z-${'base' | 'dropdown' | 'sticky' | 'fixed' | 'overlay' | 'modal' | 'popover' | 'toast' | 'tooltip'}`;

/** Type-safe token accessor */
type TypedGetToken = (token: TokenPath) => string;
```

---

## Usage Examples

### Basic Application Setup

```tsx
// app/layout.tsx
import { ThemeProvider, antiFoucScript } from '@mcv/ui/branding';
import { betedgeFonts } from '@mcv/ui/branding/fonts/betedge';

export default function BetEdgeLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${betedgeFonts.heading.variable} ${betedgeFonts.body.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: antiFoucScript }} />
      </head>
      <body>
        <ThemeProvider venture="betedge">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### Theme Toggle Component

```tsx
import { useTheme } from '@mcv/ui/branding';
import { Button } from '@mcv/ui';

function ThemeModeToggle() {
  const { mode, toggleMode, isDark } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleMode}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? '☀️' : '🌙'}
    </Button>
  );
}
```

### Multi-Venture Super Admin

```tsx
import { ThemeProvider, useTheme } from '@mcv/ui/branding';
import { Select } from '@mcv/ui';

function SuperAdminShell({ children }: { children: React.ReactNode }) {
  const [activeVenture, setActiveVenture] = useState('mcv');

  return (
    <ThemeProvider venture={activeVenture}>
      <header className="flex items-center gap-4 p-4 bg-[var(--color-surface)]">
        <VentureSelector value={activeVenture} onChange={setActiveVenture} />
        <ThemeModeToggle />
      </header>
      <main>{children}</main>
    </ThemeProvider>
  );
}

function VentureSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <Select.Trigger className="w-48" />
      <Select.Content>
        <Select.Item value="mcv">MCV.ONE</Select.Item>
        <Select.Item value="betedge">BetEdge</Select.Item>
        <Select.Item value="serpspace">SerpSpace</Select.Item>
        <Select.Item value="the-forge">The Forge</Select.Item>
      </Select.Content>
    </Select>
  );
}
```

### Accessing Tokens Programmatically

```tsx
import { useTheme } from '@mcv/ui/branding';

function ChartWithVentureColors() {
  const { getColor, getToken } = useTheme();

  const chartColors = [
    getToken('color-chart-1'),
    getToken('color-chart-2'),
    getToken('color-chart-3'),
    getToken('color-chart-4'),
  ];

  return (
    <AreaChart
      data={data}
      colors={chartColors}
      style={{
        fontFamily: getToken('font-body'),
        fontSize: getToken('font-size-sm'),
      }}
    />
  );
}
```

### Conditional Rendering by Venture

```tsx
import { useVenture } from '@mcv/ui/branding';

function VentureFeature() {
  const { id } = useVenture();

  return (
    <div>
      {id === 'betedge' && <LiveOddsWidget />}
      {id === 'serpspace' && <RankTracker />}
      {id === 'the-forge' && <ProjectDashboard />}
    </div>
  );
}
```

### White-Label Runtime Customization

```tsx
import { createVentureTheme, registerVentureBrand, ThemeProvider } from '@mcv/ui/branding';

function WhiteLabelApp({ tenantConfig }: { tenantConfig: TenantBranding }) {
  useEffect(() => {
    // Create and register theme at runtime from tenant configuration
    const theme = createVentureTheme(tenantConfig.id, {
      extends: 'mcv',
      colors: {
        primary: tenantConfig.primaryColor,
        secondary: tenantConfig.secondaryColor,
      },
      typography: {
        heading: tenantConfig.fontFamily,
        body: tenantConfig.fontFamily,
        mono: "'JetBrains Mono', monospace",
      },
    });
    registerVentureBrand(theme);
  }, [tenantConfig]);

  return (
    <ThemeProvider venture={tenantConfig.id}>
      <App />
    </ThemeProvider>
  );
}
```

---

## Testing

### Unit Tests

```typescript
// packages/ui/src/branding/__tests__/chameleon-engine.test.ts

import { describe, it, expect } from 'vitest';
import { resolveTheme, generateColorScale, validatePaletteAccessibility } from '../';

describe('Chameleon Engine', () => {
  it('resolves venture theme with correct token count', () => {
    const resolved = resolveTheme('betedge', 'dark');
    expect(resolved.ventureId).toBe('betedge');
    expect(resolved.colorMode).toBe('dark');
    expect(resolved.properties.size).toBeGreaterThan(200);
  });

  it('falls back to MCV base for unknown venture', () => {
    const resolved = resolveTheme('unknown-venture');
    expect(resolved.ventureId).toBe('mcv');
  });

  it('resolves mode from venture defaults when no preference set', () => {
    const resolved = resolveTheme('betedge'); // betedge defaults to dark
    expect(resolved.colorMode).toBe('dark');
  });
});

describe('Color Scale Generation', () => {
  it('generates 11-step scale from seed color', () => {
    const scale = generateColorScale('#3b82f6');
    expect(Object.keys(scale)).toHaveLength(11);
    expect(scale[50]).toBeDefined();
    expect(scale[950]).toBeDefined();
  });

  it('preserves seed color at step 500', () => {
    const seed = '#3b82f6';
    const scale = generateColorScale(seed);
    // Allow slight deviation due to perceptual adjustments
    expect(colorDistance(scale[500], seed)).toBeLessThan(5);
  });

  it('ensures monotonic lightness progression', () => {
    const scale = generateColorScale('#10b981');
    const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
    const lightness = steps.map((s) => getLightness(scale[s]));
    for (let i = 1; i < lightness.length; i++) {
      expect(lightness[i]).toBeLessThan(lightness[i - 1]);
    }
  });
});

describe('Accessibility Validation', () => {
  it('identifies contrast failures', () => {
    const report = validatePaletteAccessibility({
      primary: generateColorScale('#fbbf24'), // Yellow — tricky for contrast
      neutral: generateColorScale('#71717a'),
    });
    expect(report.warnings.length).toBeGreaterThan(0);
  });

  it('passes for well-chosen palettes', () => {
    const report = validatePaletteAccessibility({
      primary: generateColorScale('#2563eb'), // Strong blue
      neutral: generateColorScale('#71717a'),
    });
    const failures = report.results.filter((r) => !r.pass);
    expect(failures.length).toBe(0);
  });
});
```

### Component Theme Integration Tests

```typescript
// packages/ui/src/branding/__tests__/component-theming.test.tsx

import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../providers/theme-provider';
import { Button } from '../../button';

describe('Component Theming', () => {
  it('renders Button with venture-specific primary color', () => {
    const { container } = render(
      <ThemeProvider venture="betedge" mode="light">
        <Button color="primary" variant="solid">Click me</Button>
      </ThemeProvider>
    );

    const htmlEl = document.documentElement;
    expect(htmlEl.getAttribute('data-venture')).toBe('betedge');
    expect(htmlEl.getAttribute('data-mode')).toBe('light');
  });

  it('switches theme without remount', () => {
    const { rerender } = render(
      <ThemeProvider venture="betedge" mode="light">
        <Button>Test</Button>
      </ThemeProvider>
    );

    expect(document.documentElement.getAttribute('data-venture')).toBe('betedge');

    rerender(
      <ThemeProvider venture="serpspace" mode="dark">
        <Button>Test</Button>
      </ThemeProvider>
    );

    expect(document.documentElement.getAttribute('data-venture')).toBe('serpspace');
    expect(document.documentElement.getAttribute('data-mode')).toBe('dark');
  });
});
```

### Hook Tests

```typescript
// packages/ui/src/branding/__tests__/hooks.test.tsx

import { renderHook, act } from '@testing-library/react';
import { ThemeProvider } from '../providers/theme-provider';
import { useTheme } from '../hooks/use-theme';
import { useVenture } from '../hooks/use-venture';

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider venture="betedge" mode="dark">
      {children}
    </ThemeProvider>
  );
}

describe('useTheme', () => {
  it('returns current venture and mode', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    expect(result.current.venture).toBe('betedge');
    expect(result.current.mode).toBe('dark');
    expect(result.current.isDark).toBe(true);
    expect(result.current.isLight).toBe(false);
  });

  it('toggles mode', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => result.current.toggleMode());
    expect(result.current.mode).toBe('light');
  });

  it('returns token values', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    const primary500 = result.current.getToken('color-primary-500');
    expect(primary500).toBe('#3b82f6'); // BetEdge blue
  });
});

describe('useVenture', () => {
  it('returns brand config', () => {
    const { result } = renderHook(() => useVenture(), { wrapper });
    expect(result.current.id).toBe('betedge');
    expect(result.current.name).toBe('BetEdge');
    expect(result.current.themeColor).toBe('#3b82f6');
  });

  it('resolves logo URL for current mode', () => {
    const { result } = renderHook(() => useVenture(), { wrapper });
    expect(result.current.logoUrl).toBe('/brands/betedge/logo-dark.svg');
  });
});
```

### Visual Regression Tests

```typescript
// packages/ui/src/branding/__tests__/visual-regression.test.ts

import { test, expect } from '@playwright/test';

const ventures = ['mcv', 'betedge', 'serpspace', 'the-forge'];
const modes = ['light', 'dark'] as const;

for (const venture of ventures) {
  for (const mode of modes) {
    test(`Button renders correctly for ${venture}/${mode}`, async ({ page }) => {
      await page.goto(
        `/storybook/iframe.html?id=button--default&globals=venture:${venture};mode:${mode}`
      );
      await expect(page.locator('.story-container')).toHaveScreenshot(
        `button-${venture}-${mode}.png`
      );
    });
  }
}
```

### Test Utilities

```typescript
// packages/ui/src/branding/test-utils.ts

import { ThemeProvider } from './providers/theme-provider';

/**
 * Create a wrapper for React Testing Library that provides theme context.
 */
export function createThemeWrapper(
  venture = 'mcv',
  mode: 'light' | 'dark' = 'light'
) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <ThemeProvider venture={venture} mode={mode} disableTransitions>
        {children}
      </ThemeProvider>
    );
  };
}

/**
 * Render a component with theme context for testing.
 */
export function renderWithTheme(
  ui: React.ReactElement,
  options?: {
    venture?: string;
    mode?: 'light' | 'dark';
  }
) {
  const wrapper = createThemeWrapper(options?.venture, options?.mode);
  return render(ui, { wrapper });
}
```

---

## File Structure

```
packages/ui/src/branding/
  index.ts                          # Barrel export
  types.ts                          # All TypeScript interfaces
  define-venture-brand.ts           # Brand config builder + validation
  create-venture-theme.ts           # Programmatic theme creation
  anti-fouc.ts                      # Anti-FOUC inline script
  registry.ts                       # Venture brand registry
  chameleon-engine.ts               # Core theme resolution engine
  token-generator.ts                # Token flattening + CSS property generation
  color-utils.ts                    # Color scale generation + accessibility checks

  providers/
    theme-provider.tsx              # <ThemeProvider> root component
    theme-context.ts                # React context definition

  hooks/
    use-theme.ts                    # useTheme hook
    use-venture.ts                  # useVenture hook
    use-system-theme.ts             # useSystemTheme (OS preference)

  ventures/
    mcv.ts                          # MCV.ONE base theme
    betedge.ts                      # BetEdge brand config
    serpspace.ts                     # SerpSpace brand config
    the-forge.ts                    # The Forge brand config

  fonts/
    betedge.ts                      # BetEdge font loading
    serpspace.ts                    # SerpSpace font loading
    the-forge.ts                    # The Forge font loading

  assets/
    generate-favicons.ts            # Favicon generation pipeline
    generate-og-image.ts            # OG image template renderer
    validate-assets.ts              # Build-time asset validation

  __tests__/
    chameleon-engine.test.ts        # Engine unit tests
    color-utils.test.ts             # Color generation tests
    component-theming.test.tsx      # Component integration tests
    hooks.test.tsx                  # Hook tests
    visual-regression.test.ts       # Playwright visual tests
    registry.test.ts                # Registry tests

  test-utils.ts                     # Testing helpers (createThemeWrapper, renderWithTheme)
```

---

## Dependencies

| Dependency | Version | Purpose |
|-----------|---------|---------|
| `react` | ^18.2 \|\| ^19.0 | Peer — context, hooks |
| `next-themes` | ^0.4 | Peer — OS preference detection, SSR support |
| `tailwindcss` | ^4.0 | Peer — CSS variable integration |
| `culori` | ^4.0 | Color manipulation, scale generation, CIEDE2000 |

---

## Related Modules

| Module | Relationship |
|--------|-------------|
| `@mcv/ui` (parent) | Consumes tokens from branding for all 508 components |
| `@mcv/ui/theme` | Runtime theme toggle UI (ThemeCustomizer, AccentColorPicker) — built on top of branding tokens |
| `@mcv/ui/brand` | Logo, Wordmark, LogoMark components — consume brand assets from branding config |
| `@mcv/ui/styles` | `theme.css` (460+ lines) — the CSS file where base tokens are defined |
| `@mcv/config` | Environment-level venture detection (domain → venture ID mapping) |

---

*@mcv/ui/branding — Venture Brand Customization*
