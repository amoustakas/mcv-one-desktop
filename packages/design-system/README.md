# @mcv/design-system

Design tokens + CSS variables shared across the MCV ecosystem.

## Usage

```ts
import { TOKENS, PALETTE, RADII } from '@mcv/design-system';

// Direct values
const cyan = TOKENS.palette.cyan; // '#00F0FF'

// Tailwind config
import { PALETTE } from '@mcv/design-system';
export default {
  theme: {
    extend: { colors: { cyan: PALETTE.cyan, purple: PALETTE.purple } },
  },
};

// CSS variables
import '@mcv/design-system/css';
// Now `var(--cyan)` works anywhere.
```

## Consumers

- `mcv-one-desktop` (root app)
- `FutureState` (planned)
- `BetEdge` (planned)
- `mcv.gg` (planned)
- `WarForge` (planned)

## Contents

- `PALETTE` — cyan / purple / core-blue / gold + surface + text + semantic colors
- `RADII` — none / sm / md / lg / xl / full
- `SPACING` — 0..16 scale in px
- `TYPOGRAPHY` — font families + sizes + weights
- `SHADOWS` — sm / md / lg + cyan glow + purple glow
- `Z` — z-index stack
- `MOTION` — animation durations

## Versioning

`0.1.0` — initial extraction from MCV Desktop. Values match the canonical
root CSS (`src/styles/design-system.css` in mcv-one-desktop).
