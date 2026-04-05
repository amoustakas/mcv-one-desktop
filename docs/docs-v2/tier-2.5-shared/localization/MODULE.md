# @mcv/shared/localization — Localization Module

**Parent Package:** @mcv/shared  
**Tier:** 2.5 (Shared Business Utilities)  
**Classification:** PUBLISHABLE (Phase 1)  
**Last Updated:** February 8, 2026

---

## Purpose

The `localization` module provides internationalization (i18n) and localization (l10n) for the entire MCV ecosystem. It handles key-based string translations with ICU MessageFormat support, locale-aware date/time/number/currency formatting, pluralization rules for 70+ languages, right-to-left (RTL) layout detection, dynamic translation bundle loading, and React context integration. Every user-facing string in MCV — from admin dashboards to customer-facing booking pages — flows through this module.

**This is the single source of truth for all multilingual content rendering across the MCV platform.**

### Why Not i18next / react-intl?

MCV needed a localization layer that:

1. **Spans server and client** — Same `t()` call in API error messages, email templates, PDF exports, and React components
2. **Is venture-aware** — Each venture has its own supported locales, defaults, and translation overrides stored in the database
3. **Supports hybrid sources** — Static JSON bundles for built-in keys + database for venture-specific overrides + CDN for lazy-loaded namespaces
4. **Integrates with MCV audit** — Every translation change emits audit events for compliance tracking
5. **Handles ICU natively** — Full ICU MessageFormat with plural, select, ordinal, and nested constructs — not a simplified subset
6. **Is tree-shakeable** — Client bundles import only what they need; server code is never shipped to the browser

Existing libraries cover subsets of this but none unify all six requirements under one API surface.

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// TRANSLATION API
// ═══════════════════════════════════════════════════════════════════════════════

// Core translation function
export {
  t,                           // Translate key with optional interpolation
  translate,                   // Full-featured translate (namespace, fallback)
  getTranslations,             // Get all translations for a namespace
  hasTranslation,              // Check if key exists in current locale
  addTranslations,             // Add translations at runtime
  loadTranslations,            // Load translation bundle (async)
  clearTranslations,           // Clear cached translations
} from './server/services/translate-service';

// Translation management (admin)
export {
  listTranslationKeys,         // List all keys with translation status
  getTranslationCoverage,      // Coverage % per locale
  getMissingTranslations,      // Keys missing translations per locale
  exportTranslations,          // Export as JSON/CSV/XLIFF
  importTranslations,          // Import from JSON/CSV/XLIFF
  syncTranslationKeys,         // Sync keys from source code scan
} from './server/services/translation-admin-service';

// ═══════════════════════════════════════════════════════════════════════════════
// FORMATTING API
// ═══════════════════════════════════════════════════════════════════════════════

export {
  formatDate,                  // Locale-aware date formatting
  formatTime,                  // Locale-aware time formatting
  formatDateTime,              // Combined date + time
  formatRelative,              // Relative time ("2 hours ago")
  formatNumber,                // Locale-aware number formatting
  formatCurrency,              // Currency formatting with symbol placement
  formatPercent,               // Percentage formatting
  formatUnit,                  // Unit formatting (kg, mi, °C)
  formatList,                  // List formatting ("A, B, and C")
  formatRange,                 // Range formatting ("Jan 1–5")
} from './server/services/format-service';

// ═══════════════════════════════════════════════════════════════════════════════
// LOCALE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

export {
  setLocale,                   // Set current locale globally
  getLocale,                   // Get current locale
  getDefaultLocale,            // Get venture default locale
  getSupportedLocales,         // Get list of supported locales
  addLocale,                   // Add a new supported locale
  removeLocale,                // Remove a supported locale
  resolveLocale,               // Resolve best match from Accept-Language
  isRtl,                       // Check if locale is right-to-left
  getDirection,                // Get 'ltr' or 'rtl' for locale
  getLanguageName,             // Get display name for a locale
  getRegionName,               // Get region display name
} from './server/services/locale-service';

// ═══════════════════════════════════════════════════════════════════════════════
// PLURALIZATION
// ═══════════════════════════════════════════════════════════════════════════════

export {
  plural,                      // Apply plural rules
  selectOrdinal,               // Ordinal pluralization (1st, 2nd, 3rd)
  getPluralCategories,         // Get CLDR plural categories for locale
} from './server/services/plural-service';

// ═══════════════════════════════════════════════════════════════════════════════
// ICU MESSAGE FORMAT
// ═══════════════════════════════════════════════════════════════════════════════

export {
  compileMessage,              // Compile ICU message to function
  parseMessage,                // Parse ICU message AST
  validateMessage,             // Validate ICU message syntax
} from './server/services/icu-service';

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDATION SCHEMAS (Zod)
// ═══════════════════════════════════════════════════════════════════════════════

export {
  localeCodeSchema,            // Validate BCP 47 locale code
  translationKeySchema,        // Validate translation key format
  translationValueSchema,      // Validate ICU message syntax
  localeConfigSchema,          // Validate venture locale configuration
  importPayloadSchema,         // Validate import file payload
  formatOptionsSchema,         // Validate format options
} from './server/validation';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT HOOKS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { useTranslation } from './client/hooks/use-translation';
export { useLocale } from './client/hooks/use-locale';
export { useFormatDate } from './client/hooks/use-format-date';
export { useFormatNumber } from './client/hooks/use-format-number';
export { useDirection } from './client/hooks/use-direction';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT COMPONENTS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { LocaleProvider } from './client/components/locale-provider';
export { Trans } from './client/components/trans';
export { FormattedDate } from './client/components/formatted-date';
export { FormattedNumber } from './client/components/formatted-number';
export { FormattedCurrency } from './client/components/formatted-currency';
export { LocaleSwitcher } from './client/components/locale-switcher';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  SUPPORTED_LOCALES,
  RTL_LOCALES,
  DEFAULT_LOCALE,
  FALLBACK_LOCALE,
  LOCALE_DISPLAY_NAMES,
  DATE_FORMAT_PRESETS,
  NUMBER_FORMAT_PRESETS,
  CURRENCY_CODES,
  PLURAL_RULES,
} from './constants';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  Locale,
  LocaleCode,
  LocaleConfig,
  TranslationKey,
  TranslationNamespace,
  TranslationBundle,
  TranslationMap,
  FormatOptions,
  DateFormatOptions,
  NumberFormatOptions,
  CurrencyFormatOptions,
  ListFormatOptions,
  PluralCategory,
  PluralRules,
  IcuMessage,
  Direction,
  TranslationCoverage,
  TranslationImportResult,
  TranslationExportOptions,
  LocaleResolveOptions,
} from './types';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     LOCALIZATION ARCHITECTURE                                    │
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐   │
│  │                       CONSUMER ENTRY POINTS                               │   │
│  │                                                                           │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │   │
│  │  │  React UI    │  │  API Routes  │  │  Email/SMS   │  │  PDF/Export │  │   │
│  │  │  Components  │  │  Error Msgs  │  │  Templates   │  │  Documents  │  │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘  │   │
│  │         └─────────────────┴─────────────────┴─────────────────┘          │   │
│  │                                    │                                      │   │
│  └────────────────────────────────────┼──────────────────────────────────────┘   │
│                                       │                                          │
│  ┌────────────────────────────────────▼──────────────────────────────────────┐   │
│  │                       TRANSLATION PIPELINE                                │   │
│  │                                                                           │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │   │
│  │  │    1.       │  │    2.       │  │    3.       │  │    4.       │    │   │
│  │  │  Resolve    │─▶│   Lookup    │─▶│  ICU Parse  │─▶│  Format &   │    │   │
│  │  │  Locale     │  │   Key       │  │  & Compile  │  │  Interpolate│    │   │
│  │  │             │  │             │  │             │  │             │    │   │
│  │  │ • Accept-   │  │ • Namespace │  │ • Plural    │  │ • Variables │    │   │
│  │  │   Language  │  │ • Key path  │  │ • Select    │  │ • Numbers   │    │   │
│  │  │ • User pref │  │ • Fallback  │  │ • Ordinal   │  │ • Dates     │    │   │
│  │  │ • Venture   │  │   chain     │  │ • Nested    │  │ • Currency  │    │   │
│  │  │   default   │  │ • Cache hit │  │             │  │             │    │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │   │
│  │                                                                           │   │
│  └───────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐   │
│  │                       TRANSLATION SOURCES                                 │   │
│  │                                                                           │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐       │   │
│  │  │  Static JSON      │  │  Database         │  │  CDN Bundles     │       │   │
│  │  │  (built-in)       │  │  (venture custom) │  │  (lazy loaded)   │       │   │
│  │  │                   │  │                   │  │                   │       │   │
│  │  │ • en.json         │  │ • Custom keys     │  │ • Chunked by     │       │   │
│  │  │ • fr.json         │  │ • Overrides       │  │   namespace      │       │   │
│  │  │ • es.json         │  │ • Venture-        │  │ • Versioned      │       │   │
│  │  │ • 20+ locales     │  │   specific        │  │ • Cache headers  │       │   │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘       │   │
│  │                                                                           │   │
│  └───────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐   │
│  │                       FORMAT ENGINES                                      │   │
│  │                                                                           │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐       │   │
│  │  │  Intl.DateTimeF.  │  │  Intl.NumberF.    │  │  Intl.PluralR.   │       │   │
│  │  │                   │  │                   │  │                   │       │   │
│  │  │ • Date/Time       │  │ • Decimal         │  │ • Cardinal        │       │   │
│  │  │ • Relative        │  │ • Currency        │  │ • Ordinal         │       │   │
│  │  │ • Calendar        │  │ • Percent         │  │ • Range           │       │   │
│  │  │ • Timezone        │  │ • Unit            │  │ • CLDR rules      │       │   │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘       │   │
│  │                                                                           │   │
│  └───────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐   │
│  │                       CACHE LAYER                                         │   │
│  │                                                                           │   │
│  │  ┌───────────────────────────────────┐  ┌────────────────────────────┐   │   │
│  │  │  In-Memory LRU Cache              │  │  CDN Edge Cache             │   │   │
│  │  │                                    │  │                             │   │   │
│  │  │ • Compiled ICU messages (10K max) │  │ • Immutable bundle files   │   │   │
│  │  │ • Intl.* formatter instances      │  │ • Content-hash versioned   │   │   │
│  │  │ • Resolved locale mappings        │  │ • 24h TTL, stale-while-    │   │   │
│  │  │ • Translation key lookups         │  │   revalidate               │   │   │
│  │  └───────────────────────────────────┘  └────────────────────────────┘   │   │
│  │                                                                           │   │
│  └───────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Translation Pipeline Internals

When `t('items.count', { count: 5 })` is called, the following steps execute:

```
t('items.count', { count: 5 })
  │
  ▼
┌──────────────────────────────────────────────────────────────────────┐
│ Step 1: Resolve Active Locale                                        │
│                                                                      │
│   1a. Check thread-local / React context for current locale         │
│   1b. If none → check user preference (req.user.preferredLocale)    │
│   1c. If none → use venture default locale                          │
│   1d. If none → FALLBACK_LOCALE ('en')                              │
│                                                                      │
│   Result: locale = 'fr-CA'                                           │
└──────────────────────┬───────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│ Step 2: Key Lookup with Fallback Chain                               │
│                                                                      │
│   2a. Check cache: translations['fr-CA']['items.count']             │
│       → cache HIT? Return cached compiled function, skip to Step 4  │
│   2b. Check venture DB overrides for key 'items.count' in 'fr-CA'   │
│   2c. Check static bundle: fr-CA.json → items.count                 │
│   2d. Fallback: fr.json → items.count                               │
│   2e. Fallback: en.json → items.count (FALLBACK_LOCALE)             │
│   2f. If all miss → missingKeyBehavior ('fallback'|'key'|'empty')   │
│                                                                      │
│   Result: "{count, plural, =0 {Aucun élément} one {# élément}      │
│            other {# éléments}}"                                      │
└──────────────────────┬───────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│ Step 3: ICU Compile (cached after first parse)                       │
│                                                                      │
│   3a. Parse ICU MessageFormat string into AST                       │
│   3b. Resolve plural rules for locale 'fr-CA'                       │
│       → CLDR: ['one', 'many', 'other']                              │
│   3c. Compile AST into executable function: (values) => string      │
│   3d. Store compiled function in LRU cache                          │
│       Key: 'fr-CA::items.count' → Function                          │
│                                                                      │
│   Result: compiledFn = (values) => { ... }                           │
└──────────────────────┬───────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│ Step 4: Execute with interpolation                                   │
│                                                                      │
│   4a. Pass { count: 5 } to compiled function                        │
│   4b. Plural rule for 'fr-CA', count=5 → 'other'                   │
│   4c. Select 'other' branch: "# éléments"                          │
│   4d. Replace # with formatted number: formatNumber(5, 'fr-CA')     │
│   4e. HTML-escape if escapeHtml=true                                │
│                                                                      │
│   Result: "5 éléments"                                               │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Core Interfaces

### Locale & Configuration

```typescript
/**
 * BCP 47 locale code (e.g., 'en', 'en-US', 'fr-CA', 'zh-Hans-CN')
 */
type LocaleCode = string;

interface Locale {
  code: LocaleCode;
  language: string;                     // ISO 639-1 ('en', 'fr')
  region?: string;                      // ISO 3166-1 ('US', 'CA')
  script?: string;                      // ISO 15924 ('Hans', 'Latn')
  displayName: string;                  // 'English (US)'
  nativeName: string;                   // 'English (US)' or '日本語'
  direction: Direction;                 // 'ltr' or 'rtl'
  pluralRules: PluralCategory[];        // ['one', 'other'] or ['zero','one','two','few','many','other']
  numberFormat: {
    decimal: string;                    // '.' or ','
    thousands: string;                  // ',' or '.'
    currencySymbolPosition: 'prefix' | 'suffix';
  };
  dateFormat: {
    short: string;                      // 'MM/dd/yyyy' or 'dd/MM/yyyy'
    medium: string;
    long: string;
    firstDayOfWeek: 0 | 1 | 6;         // 0=Sun, 1=Mon, 6=Sat
  };
}

type Direction = 'ltr' | 'rtl';

type PluralCategory = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';
```

### LocaleConfig (Venture-level)

```typescript
interface LocaleConfig {
  ventureId: VentureID;
  defaultLocale: LocaleCode;
  supportedLocales: LocaleCode[];
  fallbackLocale: LocaleCode;           // Usually 'en'
  autoDetect: boolean;                  // Use Accept-Language
  enableRtl: boolean;                   // Enable RTL stylesheet injection
  translationSource: 'static' | 'database' | 'hybrid';
  namespaces: string[];                 // ['common', 'dashboard', 'auth', ...]
  missingKeyBehavior: 'fallback' | 'key' | 'empty' | 'error';
  interpolation: {
    prefix: '{';
    suffix: '}';
    escapeHtml: boolean;
  };
}
```

### TranslationBundle

```typescript
interface TranslationBundle {
  locale: LocaleCode;
  namespace: string;
  version: string;                      // Content hash for cache busting
  keys: TranslationMap;
  metadata: {
    totalKeys: number;
    translatedKeys: number;
    lastUpdated: ISOTimestamp;
  };
}

type TranslationMap = Record<string, string | TranslationMap>;
// Supports nested: { "common": { "save": "Save", "cancel": "Cancel" } }
// And flat: { "common.save": "Save", "common.cancel": "Cancel" }
```

### FormatOptions

```typescript
interface DateFormatOptions {
  style?: 'short' | 'medium' | 'long' | 'full';
  dateStyle?: 'short' | 'medium' | 'long' | 'full';
  timeStyle?: 'short' | 'medium' | 'long' | 'full';
  timezone?: string;                    // IANA timezone
  calendar?: string;                    // 'gregory', 'islamic', 'hebrew'
  hour12?: boolean;
  relative?: boolean;                   // Use relative formatting
  relativeUnit?: 'auto' | 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';
}

interface NumberFormatOptions {
  style?: 'decimal' | 'currency' | 'percent' | 'unit';
  currency?: string;                    // ISO 4217 ('USD', 'EUR')
  currencyDisplay?: 'symbol' | 'narrowSymbol' | 'code' | 'name';
  unit?: string;                        // 'kilogram', 'mile', 'celsius'
  unitDisplay?: 'short' | 'long' | 'narrow';
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  notation?: 'standard' | 'scientific' | 'engineering' | 'compact';
  compactDisplay?: 'short' | 'long';
  signDisplay?: 'auto' | 'never' | 'always' | 'exceptZero';
  useGrouping?: boolean;
}

interface CurrencyFormatOptions extends NumberFormatOptions {
  currency: string;                     // Required for currency
  convertFrom?: string;                 // Source currency for conversion
  exchangeRate?: number;                // Manual rate override
}

interface ListFormatOptions {
  type?: 'conjunction' | 'disjunction' | 'unit';
  style?: 'long' | 'short' | 'narrow';
}
```

### TranslationCoverage

```typescript
interface TranslationCoverage {
  locale: LocaleCode;
  totalKeys: number;
  translatedKeys: number;
  missingKeys: string[];
  coveragePercent: number;              // 0-100
  staleKeys: string[];                  // Keys where source changed after translation
  namespaceBreakdown: Record<string, {
    total: number;
    translated: number;
    percent: number;
  }>;
}
```

### TranslationImportResult

```typescript
interface TranslationImportResult {
  locale: LocaleCode;
  format: 'json' | 'csv' | 'xliff';
  totalKeys: number;
  created: number;                      // New keys added
  updated: number;                      // Existing keys updated
  unchanged: number;                    // Keys with identical values
  errors: Array<{
    key: string;
    message: string;
    line?: number;
  }>;
  duration: number;                     // Processing time in ms
}
```

### TranslationExportOptions

```typescript
interface TranslationExportOptions {
  locale: LocaleCode;
  format: 'json' | 'csv' | 'xliff';
  namespaces?: string[];                // Filter by namespace (all if empty)
  onlyMissing?: boolean;               // Only include untranslated keys
  onlyStale?: boolean;                  // Only include stale translations
  includeMetadata?: boolean;            // Include description, context, maxLength
  flatKeys?: boolean;                   // Flatten nested keys to dot notation
}
```

### LocaleResolveOptions

```typescript
interface LocaleResolveOptions {
  supported: LocaleCode[];              // Venture's supported locales
  fallback: LocaleCode;                 // Last resort locale
  userPreference?: LocaleCode;          // Explicit user preference (highest priority)
  cookieLocale?: LocaleCode;            // Locale from cookie
  quality?: boolean;                    // Respect q-values in Accept-Language
}
```

---

## Validation Schemas (Zod)

All inputs are validated with Zod schemas before processing. These schemas are exported for use in API route handlers and form validation.

```typescript
import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════════════════
// LOCALE CODE VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Validates BCP 47 locale codes.
 * Accepts: 'en', 'en-US', 'fr-CA', 'zh-Hans', 'zh-Hans-CN'
 * Rejects: 'english', 'EN_US', 'x-custom', 'und'
 */
export const localeCodeSchema = z
  .string()
  .min(2)
  .max(35)
  .regex(
    /^[a-z]{2,3}(-[A-Z][a-z]{3})?(-[A-Z]{2})?$/,
    'Invalid BCP 47 locale code. Examples: en, en-US, fr-CA, zh-Hans-CN'
  );

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSLATION KEY VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Validates dot-separated translation key paths.
 * Accepts: 'common.save', 'errors.validation.required', 'a.b.c.d'
 * Rejects: '.leading', 'trailing.', 'double..dot', keys with spaces
 */
export const translationKeySchema = z
  .string()
  .min(1)
  .max(512)
  .regex(
    /^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*)*$/,
    'Translation key must be dot-separated alphanumeric segments'
  );

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSLATION VALUE VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Validates ICU MessageFormat syntax.
 * Runs the ICU parser to ensure the message compiles without errors.
 */
export const translationValueSchema = z
  .string()
  .min(0)
  .max(10000)
  .refine(
    (value) => {
      try {
        parseMessage(value);
        return true;
      } catch {
        return false;
      }
    },
    { message: 'Invalid ICU MessageFormat syntax' }
  );

// ═══════════════════════════════════════════════════════════════════════════════
// LOCALE CONFIG VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

export const localeConfigSchema = z.object({
  ventureId: z.string().uuid(),
  defaultLocale: localeCodeSchema,
  supportedLocales: z.array(localeCodeSchema).min(1).max(50),
  fallbackLocale: localeCodeSchema,
  autoDetect: z.boolean().default(true),
  enableRtl: z.boolean().default(true),
  translationSource: z.enum(['static', 'database', 'hybrid']).default('hybrid'),
  namespaces: z.array(z.string().min(1).max(64)).default(['common']),
  missingKeyBehavior: z.enum(['fallback', 'key', 'empty', 'error']).default('fallback'),
  interpolation: z.object({
    prefix: z.string().default('{'),
    suffix: z.string().default('}'),
    escapeHtml: z.boolean().default(true),
  }).default({}),
}).refine(
  (data) => data.supportedLocales.includes(data.defaultLocale),
  { message: 'defaultLocale must be in supportedLocales' }
).refine(
  (data) => data.supportedLocales.includes(data.fallbackLocale),
  { message: 'fallbackLocale must be in supportedLocales' }
);

// ═══════════════════════════════════════════════════════════════════════════════
// IMPORT PAYLOAD VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

export const importPayloadSchema = z.object({
  locale: localeCodeSchema,
  format: z.enum(['json', 'csv', 'xliff']),
  namespace: z.string().min(1).max(64).optional(),
  data: z.string().min(1),                        // File content as string
  overwriteExisting: z.boolean().default(false),
  markAsReview: z.boolean().default(true),        // Set imported translations to 'review' status
});

// ═══════════════════════════════════════════════════════════════════════════════
// FORMAT OPTIONS VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

export const dateFormatOptionsSchema = z.object({
  style: z.enum(['short', 'medium', 'long', 'full']).optional(),
  dateStyle: z.enum(['short', 'medium', 'long', 'full']).optional(),
  timeStyle: z.enum(['short', 'medium', 'long', 'full']).optional(),
  timezone: z.string().optional(),
  calendar: z.string().optional(),
  hour12: z.boolean().optional(),
  relative: z.boolean().optional(),
  relativeUnit: z.enum(['auto', 'second', 'minute', 'hour', 'day', 'week', 'month', 'year']).optional(),
}).optional();

export const numberFormatOptionsSchema = z.object({
  style: z.enum(['decimal', 'currency', 'percent', 'unit']).optional(),
  currency: z.string().length(3).optional(),
  currencyDisplay: z.enum(['symbol', 'narrowSymbol', 'code', 'name']).optional(),
  unit: z.string().optional(),
  unitDisplay: z.enum(['short', 'long', 'narrow']).optional(),
  minimumFractionDigits: z.number().int().min(0).max(20).optional(),
  maximumFractionDigits: z.number().int().min(0).max(20).optional(),
  notation: z.enum(['standard', 'scientific', 'engineering', 'compact']).optional(),
  compactDisplay: z.enum(['short', 'long']).optional(),
  signDisplay: z.enum(['auto', 'never', 'always', 'exceptZero']).optional(),
  useGrouping: z.boolean().optional(),
}).optional();
```

---

## Database Schema

### translation_keys Table

```typescript
export const translationKeys = pgTable('translation_keys', {
  // ═══════════════════════════════════════════════════════════════════════════
  // PRIMARY KEY
  // ═══════════════════════════════════════════════════════════════════════════

  id: uuid('id').primaryKey().defaultRandom(),

  // ═══════════════════════════════════════════════════════════════════════════
  // SCOPE
  // ═══════════════════════════════════════════════════════════════════════════

  // Venture for multi-tenancy (each venture has its own keys)
  ventureId: uuid('venture_id').references(() => ventures.id, { onDelete: 'cascade' }).notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // KEY IDENTIFICATION
  // ═══════════════════════════════════════════════════════════════════════════

  // Namespace for grouping (e.g., 'common', 'dashboard', 'auth', 'errors')
  namespace: varchar('namespace', { length: 64 }).notNull().default('common'),

  // Dot-separated key path (e.g., 'save', 'validation.required', 'stats.totalUsers')
  key: varchar('key', { length: 512 }).notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // TRANSLATOR CONTEXT
  // ═══════════════════════════════════════════════════════════════════════════

  // Human-readable description of where/how this key is used
  description: text('description'),

  // The source (usually English) text — serves as the canonical reference
  sourceText: text('source_text').notNull(),

  // Additional context: screenshot URL, usage notes, or UI location
  context: text('context'),

  // Maximum character length for this translation (UI space constraint)
  maxLength: integer('max_length'),

  // Freeform tags for filtering and organization
  tags: jsonb('tags').$type<string[]>().default([]),

  // ═══════════════════════════════════════════════════════════════════════════
  // TIMESTAMPS
  // ═══════════════════════════════════════════════════════════════════════════

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  // Fast lookup: venture + namespace + key (unique constraint)
  uniqueIndex('translation_keys_venture_ns_key_idx')
    .on(table.ventureId, table.namespace, table.key),

  // List all keys in a namespace
  index('translation_keys_venture_ns_idx')
    .on(table.ventureId, table.namespace),

  // Tag-based filtering (GIN index for jsonb array containment)
  index('translation_keys_tags_idx')
    .using('gin', table.tags),
]);
```

### translations Table

```typescript
export const translations = pgTable('translations', {
  // ═══════════════════════════════════════════════════════════════════════════
  // PRIMARY KEY
  // ═══════════════════════════════════════════════════════════════════════════

  id: uuid('id').primaryKey().defaultRandom(),

  // ═══════════════════════════════════════════════════════════════════════════
  // FOREIGN KEY
  // ═══════════════════════════════════════════════════════════════════════════

  // Reference to the canonical translation key
  keyId: uuid('key_id').references(() => translationKeys.id, { onDelete: 'cascade' }).notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // TRANSLATION CONTENT
  // ═══════════════════════════════════════════════════════════════════════════

  // BCP 47 locale code for this translation
  locale: varchar('locale', { length: 16 }).notNull(),

  // Translated text (ICU MessageFormat)
  value: text('value').notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // WORKFLOW STATUS
  // ═══════════════════════════════════════════════════════════════════════════

  // Translation lifecycle: draft → review → approved → published
  status: varchar('status', { length: 20 }).notNull().default('draft'),

  // Who created this translation (user UUID or 'ai-auto' for AI suggestions)
  translatedBy: uuid('translated_by'),

  // Who reviewed and approved this translation
  reviewedBy: uuid('reviewed_by'),

  // ═══════════════════════════════════════════════════════════════════════════
  // STALENESS DETECTION
  // ═══════════════════════════════════════════════════════════════════════════

  // SHA-256 hash of source_text at the time of translation
  // When source_text changes, translations with a mismatching hash are flagged 'stale'
  sourceHash: varchar('source_hash', { length: 64 }),

  // ═══════════════════════════════════════════════════════════════════════════
  // TIMESTAMPS
  // ═══════════════════════════════════════════════════════════════════════════

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  // One translation per key per locale (unique constraint)
  uniqueIndex('translations_key_locale_idx')
    .on(table.keyId, table.locale),

  // List translations by locale and status (coverage queries)
  index('translations_locale_status_idx')
    .on(table.locale, table.status),
]);
```

### venture_locales Table

```typescript
export const ventureLocales = pgTable('venture_locales', {
  // ═══════════════════════════════════════════════════════════════════════════
  // PRIMARY KEY
  // ═══════════════════════════════════════════════════════════════════════════

  id: uuid('id').primaryKey().defaultRandom(),

  // ═══════════════════════════════════════════════════════════════════════════
  // SCOPE
  // ═══════════════════════════════════════════════════════════════════════════

  // Parent venture
  ventureId: uuid('venture_id').references(() => ventures.id, { onDelete: 'cascade' }).notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // LOCALE SETTINGS
  // ═══════════════════════════════════════════════════════════════════════════

  // BCP 47 locale code
  locale: varchar('locale', { length: 16 }).notNull(),

  // Whether this is the venture's default locale
  isDefault: boolean('is_default').notNull().default(false),

  // Whether this locale is active (visible to users)
  isActive: boolean('is_active').notNull().default(true),

  // Custom display name override (e.g., "Canadian French" instead of "French (Canada)")
  displayName: varchar('display_name', { length: 64 }),

  // ═══════════════════════════════════════════════════════════════════════════
  // TIMESTAMPS
  // ═══════════════════════════════════════════════════════════════════════════

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  // One entry per venture per locale
  uniqueIndex('venture_locales_venture_locale_idx')
    .on(table.ventureId, table.locale),

  // List all locales for a venture
  index('venture_locales_venture_idx')
    .on(table.ventureId),
]);
```

### Entity-Relationship Diagram

```
┌──────────────┐       ┌───────────────────┐       ┌──────────────────┐
│   ventures   │       │  translation_keys │       │   translations   │
├──────────────┤       ├───────────────────┤       ├──────────────────┤
│ id (PK)      │◄──┐   │ id (PK)           │◄──┐   │ id (PK)          │
│ name         │   │   │ venture_id (FK)───┘   │   │ key_id (FK)──────┘
│ ...          │   │   │ namespace          │   │   │ locale           │
└──────────────┘   │   │ key               │   │   │ value            │
                   │   │ source_text       │   │   │ status           │
                   │   │ description       │   │   │ translated_by    │
                   │   │ max_length        │   │   │ reviewed_by      │
                   │   │ tags (jsonb)      │   │   │ source_hash      │
                   │   └───────────────────┘   │   │ created_at       │
                   │                           │   │ updated_at       │
                   │   ┌───────────────────┐   │   └──────────────────┘
                   │   │  venture_locales  │   │
                   │   ├───────────────────┤   │
                   └───┤ venture_id (FK)   │   │
                       │ locale            │   │
                       │ is_default        │   │
                       │ is_active         │   │
                       │ display_name      │   │
                       └───────────────────┘   │
                                               │
                       One key ───────── Many translations (one per locale)
```

---

## Supported Locales

| Code | Language | Direction | Plural Forms |
|------|----------|-----------|--------------|
| `en` | English | LTR | one, other |
| `en-GB` | English (UK) | LTR | one, other |
| `fr` | French | LTR | one, many, other |
| `fr-CA` | French (Canada) | LTR | one, many, other |
| `es` | Spanish | LTR | one, many, other |
| `es-MX` | Spanish (Mexico) | LTR | one, many, other |
| `de` | German | LTR | one, other |
| `pt` | Portuguese | LTR | one, many, other |
| `pt-BR` | Portuguese (Brazil) | LTR | one, many, other |
| `it` | Italian | LTR | one, many, other |
| `nl` | Dutch | LTR | one, other |
| `ja` | Japanese | LTR | other |
| `ko` | Korean | LTR | other |
| `zh-Hans` | Chinese (Simplified) | LTR | other |
| `zh-Hant` | Chinese (Traditional) | LTR | other |
| `ar` | Arabic | **RTL** | zero, one, two, few, many, other |
| `he` | Hebrew | **RTL** | one, two, many, other |
| `fa` | Persian | **RTL** | one, other |
| `hi` | Hindi | LTR | one, other |
| `ru` | Russian | LTR | one, few, many, other |
| `pl` | Polish | LTR | one, few, many, other |
| `tr` | Turkish | LTR | one, other |
| `th` | Thai | LTR | other |
| `vi` | Vietnamese | LTR | other |

---

## Usage Examples

### Example 1: Basic Translation with Interpolation

```typescript
import { t, translate, setLocale } from '@mcv/shared/localization';

// ═══════════════════════════════════════════════════════════════════════════════
// Simple key-based translation with variable interpolation
// ═══════════════════════════════════════════════════════════════════════════════

setLocale('en');

// Simple translation
t('common.save');                       // "Save"
t('common.cancel');                     // "Cancel"

// With interpolation
t('greeting', { name: 'John' });
// "Hello, John!"

// Nested keys
t('errors.validation.required', { field: 'Email' });
// "Email is required"

// With namespace prefix
translate('dashboard', 'stats.totalUsers', { count: 1500 });
// "1,500 total users"

// Switch locale
setLocale('es');
t('common.save');                       // "Guardar"
t('greeting', { name: 'John' });        // "¡Hola, John!"
t('errors.validation.required', { field: 'Email' });
// "Email es obligatorio"
```

### Example 2: Pluralization (ICU MessageFormat)

```typescript
import { t, setLocale } from '@mcv/shared/localization';

// ═══════════════════════════════════════════════════════════════════════════════
// ICU MessageFormat pluralization — handles ALL CLDR plural rules
// ═══════════════════════════════════════════════════════════════════════════════

// Translation file:
// "items.count": "{count, plural, =0 {No items} one {# item} other {# items}}"

setLocale('en');
t('items.count', { count: 0 });         // "No items"
t('items.count', { count: 1 });         // "1 item"
t('items.count', { count: 42 });        // "42 items"

// Russian has more plural forms (one, few, many, other)
// "items.count": "{count, plural, one {# элемент} few {# элемента} many {# элементов} other {# элементов}}"
setLocale('ru');
t('items.count', { count: 1 });         // "1 элемент"
t('items.count', { count: 3 });         // "3 элемента"
t('items.count', { count: 5 });         // "5 элементов"
t('items.count', { count: 21 });        // "21 элемент"

// Arabic has 6 plural forms (zero, one, two, few, many, other)
setLocale('ar');
t('items.count', { count: 0 });         // "لا عناصر"
t('items.count', { count: 1 });         // "عنصر واحد"
t('items.count', { count: 2 });         // "عنصران"
t('items.count', { count: 5 });         // "٥ عناصر"
```

### Example 3: Date & Time Formatting

```typescript
import { formatDate, formatTime, formatDateTime, formatRelative } from '@mcv/shared/localization';

// ═══════════════════════════════════════════════════════════════════════════════
// Locale-aware date/time formatting using Intl.DateTimeFormat
// ═══════════════════════════════════════════════════════════════════════════════

const date = new Date('2026-02-08T14:30:00Z');

// English
formatDate(date, { style: 'short' });           // "2/8/26"
formatDate(date, { style: 'medium' });          // "Feb 8, 2026"
formatDate(date, { style: 'long' });            // "February 8, 2026"
formatDate(date, { style: 'full' });            // "Sunday, February 8, 2026"

formatTime(date, { timeStyle: 'short' });       // "2:30 PM"
formatDateTime(date, { dateStyle: 'medium', timeStyle: 'short' });
// "Feb 8, 2026, 2:30 PM"

// German
formatDate(date, { style: 'long' }, 'de');      // "8. Februar 2026"
formatDateTime(date, { dateStyle: 'medium', timeStyle: 'short' }, 'de');
// "08.02.2026, 14:30"

// Japanese
formatDate(date, { style: 'long' }, 'ja');      // "2026年2月8日"

// Relative time
formatRelative(new Date(Date.now() - 3600000)); // "1 hour ago"
formatRelative(new Date(Date.now() + 86400000)); // "in 1 day"
formatRelative(new Date(Date.now() - 120000), {}, 'es');
// "hace 2 minutos"

// With timezone
formatDateTime(date, {
  dateStyle: 'medium',
  timeStyle: 'long',
  timezone: 'America/New_York',
});
// "Feb 8, 2026, 9:30:00 AM EST"
```

### Example 4: Number & Currency Formatting

```typescript
import { formatNumber, formatCurrency, formatPercent, formatUnit } from '@mcv/shared/localization';

// ═══════════════════════════════════════════════════════════════════════════════
// Locale-aware number formatting
// ═══════════════════════════════════════════════════════════════════════════════

// English (US)
formatNumber(1234567.89);                           // "1,234,567.89"
formatNumber(1234567.89, { notation: 'compact' });  // "1.2M"

// German
formatNumber(1234567.89, {}, 'de');                 // "1.234.567,89"

// Currency
formatCurrency(1999, 'USD');                        // "$19.99"
formatCurrency(1999, 'USD', {}, 'de');              // "19,99 $"
formatCurrency(1999, 'EUR', {}, 'fr');              // "19,99 €"
formatCurrency(1999, 'JPY', {}, 'ja');              // "￥1,999"

// Percent
formatPercent(0.8523);                              // "85.23%"
formatPercent(0.8523, { maximumFractionDigits: 0 }); // "85%"

// Units
formatUnit(72.5, 'kilogram');                       // "72.5 kg"
formatUnit(72.5, 'kilogram', { unitDisplay: 'long' }); // "72.5 kilograms"
formatUnit(100, 'mile', {}, 'en-GB');               // "100 mi"

// Compact notation
formatNumber(1_500_000, { notation: 'compact', compactDisplay: 'long' });
// "1.5 million"
```

### Example 5: List Formatting

```typescript
import { formatList, formatRange } from '@mcv/shared/localization';

// ═══════════════════════════════════════════════════════════════════════════════
// Locale-aware list and range formatting
// ═══════════════════════════════════════════════════════════════════════════════

// Conjunction (and)
formatList(['Alice', 'Bob', 'Charlie']);
// en: "Alice, Bob, and Charlie"
// fr: "Alice, Bob et Charlie"
// ja: "Alice、Bob、Charlie"

// Disjunction (or)
formatList(['red', 'blue', 'green'], { type: 'disjunction' });
// en: "red, blue, or green"
// de: "red, blue oder green"

// Date range
formatRange(new Date('2026-02-01'), new Date('2026-02-05'));
// en: "Feb 1 – 5, 2026"
// de: "1.–5. Feb. 2026"
```

### Example 6: React Integration — LocaleProvider & useTranslation

```tsx
import { LocaleProvider, useTranslation, useLocale, useDirection } from '@mcv/shared/localization';

// ═══════════════════════════════════════════════════════════════════════════════
// Full React integration with context provider
// ═══════════════════════════════════════════════════════════════════════════════

function App() {
  return (
    <LocaleProvider
      defaultLocale="en"
      supportedLocales={['en', 'fr', 'es', 'ar', 'ja']}
      fallbackLocale="en"
      autoDetect={true}
      loadBundle={async (locale, namespace) => {
        const response = await fetch(`/locales/${locale}/${namespace}.json`);
        return response.json();
      }}
    >
      <AppContent />
    </LocaleProvider>
  );
}

function AppContent() {
  const { t, locale, setLocale } = useTranslation();
  const direction = useDirection();

  return (
    <div dir={direction}>
      <h1>{t('welcome.title')}</h1>
      <p>{t('welcome.subtitle', { name: 'Acme Corp' })}</p>

      <nav>
        <button onClick={() => setLocale('en')}>English</button>
        <button onClick={() => setLocale('fr')}>Français</button>
        <button onClick={() => setLocale('ar')}>العربية</button>
      </nav>
    </div>
  );
}
```

### Example 7: React Components — Trans, FormattedDate, FormattedCurrency

```tsx
import { Trans, FormattedDate, FormattedNumber, FormattedCurrency } from '@mcv/shared/localization';

// ═══════════════════════════════════════════════════════════════════════════════
// Declarative formatting components
// ═══════════════════════════════════════════════════════════════════════════════

function InvoiceSummary({ invoice }) {
  return (
    <div>
      {/* Rich text with embedded components */}
      <Trans
        id="invoice.summary"
        values={{
          date: <FormattedDate value={invoice.date} style="long" />,
          amount: <FormattedCurrency value={invoice.total} currency="USD" />,
          customer: <strong>{invoice.customerName}</strong>,
        }}
      />
      {/* "Invoice for <strong>Acme Corp</strong> dated <em>February 8, 2026</em> totaling <strong>$1,234.56</strong>" */}

      <p>
        Items: <FormattedNumber value={invoice.itemCount} />
      </p>
      <p>
        Due: <FormattedDate value={invoice.dueDate} style="medium" />
      </p>
    </div>
  );
}
```

### Example 8: Dynamic Translation Loading & Namespaces

```typescript
import { loadTranslations, t, addTranslations } from '@mcv/shared/localization';

// ═══════════════════════════════════════════════════════════════════════════════
// Lazy-load translation bundles by namespace
// ═══════════════════════════════════════════════════════════════════════════════

// Load only when the user navigates to a section
async function onNavigateToSettings() {
  await loadTranslations('fr', 'settings');
  // Now settings.* keys are available
  t('settings.profile.title');          // "Paramètres du profil"
}

// Add custom translations at runtime (venture-specific overrides)
addTranslations('en', 'custom', {
  'branding.tagline': 'Your Business, Supercharged',
  'branding.cta': 'Start Free Trial',
});

t('custom.branding.tagline');           // "Your Business, Supercharged"
```

### Example 9: Locale Resolution from HTTP Request

```typescript
import { resolveLocale, getSupportedLocales } from '@mcv/shared/localization';

// ═══════════════════════════════════════════════════════════════════════════════
// Server-side locale resolution from Accept-Language header
// ═══════════════════════════════════════════════════════════════════════════════

function middleware(req, res, next) {
  const acceptLanguage = req.headers['accept-language'];
  // "fr-CA,fr;q=0.9,en-US;q=0.8,en;q=0.7"

  const supported = getSupportedLocales('venture-uuid');
  // ['en', 'fr', 'fr-CA', 'es']

  const resolved = resolveLocale(acceptLanguage, {
    supported,
    fallback: 'en',
    userPreference: req.user?.preferredLocale,
  });
  // 'fr-CA' (exact match found)

  req.locale = resolved;
  next();
}
```

### Example 10: RTL Support

```typescript
import { isRtl, getDirection } from '@mcv/shared/localization';

// ═══════════════════════════════════════════════════════════════════════════════
// Right-to-left language detection and layout
// ═══════════════════════════════════════════════════════════════════════════════

isRtl('ar');                            // true
isRtl('he');                            // true
isRtl('fa');                            // true
isRtl('en');                            // false
isRtl('ja');                            // false

getDirection('ar');                     // 'rtl'
getDirection('en');                     // 'ltr'

// In React
function Layout() {
  const { locale } = useLocale();
  const dir = getDirection(locale);

  return (
    <html lang={locale} dir={dir}>
      <body className={dir === 'rtl' ? 'rtl-layout' : 'ltr-layout'}>
        {/* CSS logical properties handle margin/padding automatically */}
      </body>
    </html>
  );
}
```

### Example 11: Translation Coverage & Admin

```typescript
import { getTranslationCoverage, getMissingTranslations, exportTranslations } from '@mcv/shared/localization';

// ═══════════════════════════════════════════════════════════════════════════════
// Admin tools for managing translation completeness
// ═══════════════════════════════════════════════════════════════════════════════

const coverage = await getTranslationCoverage('venture-uuid', 'fr');
console.log(`French: ${coverage.coveragePercent}% complete`);
// French: 87% complete
console.log(`Missing: ${coverage.missingKeys.length} keys`);
console.log(`Stale: ${coverage.staleKeys.length} keys need re-translation`);

// Get specific missing keys
const missing = await getMissingTranslations('venture-uuid', 'fr', 'dashboard');
// ['dashboard.stats.newFeature', 'dashboard.alerts.budgetWarning']

// Export for external translation service
const xliff = await exportTranslations('venture-uuid', {
  locale: 'fr',
  format: 'xliff',                      // or 'json', 'csv'
  onlyMissing: true,
});
```

### Example 12: ICU MessageFormat — Select & Nested

```typescript
import { t } from '@mcv/shared/localization';

// ═══════════════════════════════════════════════════════════════════════════════
// Advanced ICU MessageFormat: select, nested plural+select
// ═══════════════════════════════════════════════════════════════════════════════

// Translation key with gender select:
// "user.greeting": "{gender, select, male {He} female {She} other {They}} updated {gender, select, male {his} female {her} other {their}} profile"

t('user.greeting', { gender: 'female' });
// "She updated her profile"

// Nested plural + select:
// "inbox.summary": "{count, plural, =0 {No messages} one {{gender, select, male {He has} female {She has} other {You have}} # message} other {{gender, select, male {He has} female {She has} other {You have}} # messages}}"

t('inbox.summary', { count: 5, gender: 'male' });
// "He has 5 messages"

t('inbox.summary', { count: 1, gender: 'female' });
// "She has 1 message"
```

### Example 13: API Route — Translation CRUD

```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import {
  listTranslationKeys,
  importTranslations,
  exportTranslations,
  getTranslationCoverage,
} from '@mcv/shared/localization';
import {
  localeCodeSchema,
  importPayloadSchema,
} from '@mcv/shared/localization';
import { requirePermission } from '@mcv/shared/auth';

// ═══════════════════════════════════════════════════════════════════════════════
// RESTful API routes for translation management
// ═══════════════════════════════════════════════════════════════════════════════

const app = new Hono();

// List all translation keys for a venture
app.get('/api/v1/translations/keys', async (c) => {
  const ventureId = c.get('ventureId');
  const namespace = c.req.query('namespace');
  const search = c.req.query('search');
  const page = parseInt(c.req.query('page') ?? '1');
  const limit = Math.min(parseInt(c.req.query('limit') ?? '50'), 200);

  const result = await listTranslationKeys(ventureId, {
    namespace,
    search,
    page,
    limit,
  });

  return c.json({
    keys: result.keys,
    total: result.total,
    page,
    limit,
    totalPages: Math.ceil(result.total / limit),
  });
});

// Get translation coverage for a locale
app.get('/api/v1/translations/coverage/:locale',
  zValidator('param', z.object({ locale: localeCodeSchema })),
  async (c) => {
    const ventureId = c.get('ventureId');
    const { locale } = c.req.valid('param');

    const coverage = await getTranslationCoverage(ventureId, locale);
    return c.json(coverage);
  }
);

// Import translations
app.post('/api/v1/translations/import',
  requirePermission('localization:manage'),
  zValidator('json', importPayloadSchema),
  async (c) => {
    const ventureId = c.get('ventureId');
    const payload = c.req.valid('json');

    const result = await importTranslations(ventureId, payload);

    return c.json({
      success: true,
      result,
    }, result.errors.length > 0 ? 207 : 200);
  }
);

// Export translations
app.get('/api/v1/translations/export/:locale',
  requirePermission('localization:manage'),
  async (c) => {
    const ventureId = c.get('ventureId');
    const locale = c.req.param('locale');
    const format = c.req.query('format') ?? 'json';

    const data = await exportTranslations(ventureId, {
      locale,
      format: format as 'json' | 'csv' | 'xliff',
      onlyMissing: c.req.query('onlyMissing') === 'true',
    });

    const contentType = {
      json: 'application/json',
      csv: 'text/csv',
      xliff: 'application/xml',
    }[format] ?? 'application/json';

    return c.body(data, 200, {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="translations-${locale}.${format}"`,
    });
  }
);
```

### Example 14: Server-Side Rendering with Locale Context

```typescript
import { setLocale, t, formatDate, formatCurrency } from '@mcv/shared/localization';

// ═══════════════════════════════════════════════════════════════════════════════
// SSR: Set locale per-request using AsyncLocalStorage
// ═══════════════════════════════════════════════════════════════════════════════

import { AsyncLocalStorage } from 'node:async_hooks';

const localeStorage = new AsyncLocalStorage<{ locale: string }>();

// Middleware sets locale for the entire request lifecycle
function localeMiddleware(req, res, next) {
  const locale = resolveLocale(req.headers['accept-language'], {
    supported: ['en', 'fr', 'es', 'ar'],
    fallback: 'en',
    userPreference: req.user?.preferredLocale,
  });

  localeStorage.run({ locale }, () => {
    setLocale(locale);
    next();
  });
}

// In any server-side code, t() uses the request-scoped locale
function renderInvoiceEmail(invoice) {
  return {
    subject: t('email.invoice.subject', { invoiceNumber: invoice.number }),
    // "Invoice #INV-2026-001" (en) or "Facture #INV-2026-001" (fr)

    body: t('email.invoice.body', {
      customerName: invoice.customer.name,
      amount: formatCurrency(invoice.total, invoice.currency),
      dueDate: formatDate(invoice.dueDate, { style: 'long' }),
    }),
    // "Dear John, your invoice for $1,234.56 is due on February 15, 2026."
    // "Cher John, votre facture de 1 234,56 $ est due le 15 février 2026."
  };
}
```

### Example 15: Translation Import/Export Workflow

```typescript
import { importTranslations, exportTranslations, syncTranslationKeys } from '@mcv/shared/localization';

// ═══════════════════════════════════════════════════════════════════════════════
// Full translation workflow: scan → export → translate → import → publish
// ═══════════════════════════════════════════════════════════════════════════════

// Step 1: Scan source code for translation keys (CI/CD pipeline)
const scanResult = await syncTranslationKeys('venture-uuid', {
  sourceDir: './src',
  patterns: ['**/*.tsx', '**/*.ts'],
  extractors: ['t()', 'translate()', '<Trans id='],
});

console.log(`Found ${scanResult.newKeys} new keys, ${scanResult.removedKeys} orphaned keys`);

// Step 2: Export missing translations for external translators
const xliffData = await exportTranslations('venture-uuid', {
  locale: 'ja',
  format: 'xliff',
  onlyMissing: true,
  includeMetadata: true,          // Include description and context
});

// Send xliffData to translation agency or Crowdin/Lokalise...

// Step 3: Import completed translations
const importResult = await importTranslations('venture-uuid', {
  locale: 'ja',
  format: 'xliff',
  data: completedXliffFromAgency,
  overwriteExisting: false,       // Don't overwrite approved translations
  markAsReview: true,             // Imported translations need review
});

console.log(`Import: ${importResult.created} new, ${importResult.updated} updated`);
if (importResult.errors.length > 0) {
  console.warn(`Import errors:`, importResult.errors);
}

// Step 4: Review and publish (admin UI action)
// Translation status: draft → review → approved → published
// Only 'published' translations are served to end users
```

---

## Translation File Format

### JSON (Primary)

```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "confirm": "Are you sure?",
    "loading": "Loading...",
    "error": "Something went wrong"
  },
  "auth": {
    "login": "Log in",
    "logout": "Log out",
    "forgotPassword": "Forgot password?",
    "resetPassword": "Reset password"
  },
  "items": {
    "count": "{count, plural, =0 {No items} one {# item} other {# items}}"
  },
  "greeting": "Hello, {name}!",
  "errors": {
    "validation": {
      "required": "{field} is required",
      "minLength": "{field} must be at least {min} characters",
      "email": "Please enter a valid email address"
    }
  }
}
```

### XLIFF (Import/Export)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<xliff version="2.0" srcLang="en" trgLang="fr">
  <file id="common">
    <unit id="common.save">
      <segment>
        <source>Save</source>
        <target>Enregistrer</target>
      </segment>
    </unit>
    <unit id="common.cancel">
      <segment>
        <source>Cancel</source>
        <target>Annuler</target>
      </segment>
    </unit>
  </file>
</xliff>
```

### CSV (Import/Export)

```csv
key,namespace,source,translation,description,max_length
common.save,common,Save,Enregistrer,Main save button,20
common.cancel,common,Cancel,Annuler,Cancel/dismiss button,20
items.count,items,"{count, plural, =0 {No items} one {# item} other {# items}}","{count, plural, =0 {Aucun élément} one {# élément} other {# éléments}}",Item count display,
greeting,common,"Hello, {name}!","Bonjour, {name} !",Welcome greeting,
```

---

## Fallback Chain

When a translation key is not found, the module follows this resolution order:

```
1. Exact locale match (fr-CA)
2. Language match (fr)
3. Fallback locale (en)
4. Key path as string ("common.save")
5. Empty string or error (configurable)
```

For venture-specific overrides:

```
1. Venture custom translation (database, status='published')
2. Built-in translation (static JSON)
3. Fallback locale chain (above)
```

### Fallback Chain Decision Tree

```
t('dashboard.stats.newUsers', {}, 'fr-CA')
  │
  ├─ [1] translations['fr-CA']['dashboard.stats.newUsers']
  │      Found? → Return ✓
  │      Miss?  → Continue ↓
  │
  ├─ [2] translations['fr']['dashboard.stats.newUsers']
  │      Found? → Return ✓  (language fallback)
  │      Miss?  → Continue ↓
  │
  ├─ [3] translations['en']['dashboard.stats.newUsers']
  │      Found? → Return ✓  (fallback locale)
  │      Miss?  → Continue ↓
  │
  ├─ [4] missingKeyBehavior:
  │      'fallback' → Return sourceText from translation_keys table
  │      'key'      → Return "dashboard.stats.newUsers"
  │      'empty'    → Return ""
  │      'error'    → Throw TRANSLATION_KEY_NOT_FOUND
  │
  └─ [5] If NODE_ENV === 'development':
         Log warning: "Missing translation: dashboard.stats.newUsers [fr-CA]"
```

---

## Caching Strategy

The localization module uses a multi-layer caching approach for maximum performance:

### Layer 1: In-Memory LRU Cache (Server)

```typescript
// Compiled ICU message cache
// Key: `${locale}::${namespace}.${key}`
// Value: (values: Record<string, unknown>) => string
const compiledMessageCache = new LRUCache<string, MessageFunction>({
  max: 10_000,                          // Max 10K compiled messages
  ttl: 0,                               // Never expire (invalidated on translation change)
});

// Intl.* formatter instance pool
// Key: `${locale}::${JSON.stringify(options)}`
// Value: Intl.DateTimeFormat | Intl.NumberFormat | Intl.PluralRules
const formatterCache = new LRUCache<string, Intl.DateTimeFormat | Intl.NumberFormat>({
  max: 500,                             // Max 500 formatter instances
  ttl: 0,                               // Formatters are locale+options immutable
});
```

### Layer 2: Translation Bundle Cache (Client)

```typescript
// In-memory bundle cache per locale + namespace
const bundleCache = new Map<string, TranslationMap>();
// Key: `${locale}/${namespace}`
// Populated by loadTranslations() and never evicted during session

// Service Worker cache for offline support
// Cache name: 'mcv-translations-v1'
// Strategy: stale-while-revalidate
```

### Layer 3: CDN Edge Cache

```
URL pattern: https://cdn.mcv.one/locales/{ventureId}/{locale}/{namespace}.{hash}.json

Cache headers:
  Cache-Control: public, max-age=86400, immutable
  ETag: "{content-hash}"
  Vary: Accept-Encoding

The content hash in the filename ensures:
  - New translations get new URLs (cache bust)
  - Old URLs remain valid indefinitely (immutable)
  - CDN can cache aggressively without stale content risk
```

### Cache Invalidation

```
Translation updated in database
  │
  ├─ [1] Recompute content hash for affected bundle
  ├─ [2] Publish new bundle to CDN with new hash URL
  ├─ [3] Invalidate in-memory compiledMessageCache for affected key
  ├─ [4] Broadcast WebSocket event: { type: 'translation.updated', locale, namespace }
  └─ [5] Connected clients fetch new bundle URL (stale-while-revalidate)
```

---

## ICU MessageFormat Reference

Quick reference for the ICU MessageFormat syntax supported by this module:

### Simple Interpolation
```
Hello, {name}!
→ Hello, John!
```

### Plural
```
{count, plural,
  =0 {No items}
  one {# item}
  other {# items}
}
→ 0: "No items", 1: "1 item", 5: "5 items"
```

### Select (Gender/Category)
```
{gender, select,
  male {He}
  female {She}
  other {They}
} liked your post.
→ male: "He liked your post."
```

### Ordinal
```
{rank, selectordinal,
  one {#st}
  two {#nd}
  few {#rd}
  other {#th}
}
→ 1: "1st", 2: "2nd", 3: "3rd", 4: "4th"
```

### Nested (Plural + Select)
```
{count, plural,
  =0 {No new messages}
  one {{gender, select, male {He has} female {She has} other {They have}} # new message}
  other {{gender, select, male {He has} female {She has} other {They have}} # new messages}
}
→ { count: 3, gender: 'female' }: "She has 3 new messages"
```

### Number Formatting in ICU
```
The price is {price, number, ::currency/USD}.
→ "The price is $19.99."

You scored {score, number, percent}.
→ "You scored 85%."
```

### Date Formatting in ICU
```
Last updated on {date, date, medium}.
→ "Last updated on Feb 8, 2026."
```

---

## Performance Considerations

### Latency Targets

| Operation | Target | P99 |
|-----------|--------|-----|
| `t()` translation lookup (cache hit) | < 0.01ms | < 0.05ms |
| `t()` translation lookup (cache miss) | < 0.1ms | < 0.5ms |
| ICU message compile (first parse) | < 0.5ms | < 2ms |
| ICU compiled message execute | < 0.01ms | < 0.05ms |
| `formatDate()` | < 0.1ms | < 0.5ms |
| `formatNumber()` | < 0.05ms | < 0.2ms |
| `formatCurrency()` | < 0.05ms | < 0.2ms |
| `formatRelative()` | < 0.1ms | < 0.5ms |
| `formatList()` | < 0.05ms | < 0.2ms |
| Bundle load (CDN, cold) | < 100ms | < 300ms |
| Bundle load (CDN, warm/SW) | < 5ms | < 20ms |
| Locale resolution | < 0.1ms | < 0.5ms |
| Coverage calculation (1K keys) | < 200ms | < 500ms |
| Coverage calculation (10K keys) | < 1s | < 3s |

### Throughput

| Metric | Small Deployment | Enterprise |
|--------|------------------|------------|
| `t()` calls per second | 500,000+ | 500,000+ |
| Bundle loads per minute | 1,000 | 10,000+ |
| Coverage calculations per minute | 100 | 1,000+ |

### Optimization Strategies

1. **Compiled ICU messages** — ICU messages are compiled once and cached as functions; subsequent calls are zero-parse
2. **Intl.* caching** — `Intl.DateTimeFormat` and `Intl.NumberFormat` instances are pooled and reused per locale+options combo
3. **Bundle chunking** — Translation bundles split by namespace; only active namespaces loaded
4. **Content hash versioning** — Bundle URLs include content hash for immutable CDN caching
5. **Tree-shaking** — Client-only and server-only exports cleanly separated
6. **SSR hydration** — Translations resolved server-side; client hydrates without re-fetching
7. **Lazy namespace loading** — Navigation-based code splitting loads translation namespaces on demand
8. **Service Worker** — Stale-while-revalidate strategy for offline-capable translation bundles

### Bundle Size

| Import | Size (minified + gzipped) |
|--------|---------------------------|
| `t` only | ~2.1 KB |
| `t` + formatting | ~4.8 KB |
| Full client (hooks + components) | ~8.2 KB |
| ICU parser | ~3.5 KB |
| Total (all exports) | ~12.5 KB |

### Translation Bundle Sizes (Typical)

| Namespace | Keys | JSON Size (gzipped) |
|-----------|------|---------------------|
| `common` | ~200 | ~2 KB |
| `dashboard` | ~350 | ~4 KB |
| `auth` | ~50 | ~0.5 KB |
| `errors` | ~150 | ~2 KB |
| `settings` | ~200 | ~2.5 KB |
| Full app (all ns) | ~1,000 | ~12 KB |

---

## Security Considerations

### XSS Prevention

- **HTML escaping** — All interpolated values are HTML-escaped by default to prevent XSS via translation variables
- Translation values like `Hello, {name}!` where `name = '<script>alert(1)</script>'` will render as `Hello, &lt;script&gt;alert(1)&lt;/script&gt;!`
- The `<Trans>` React component uses React's built-in JSX escaping for rich text interpolation
- Escaping can be disabled per-call with `{ escapeHtml: false }` for trusted HTML content (admin-only)

### ICU Injection Prevention

- **Syntax validation** — ICU message syntax validated before compilation; malformed patterns rejected with `ICU_PARSE_ERROR`
- **No eval** — ICU compilation uses AST-based approach, never `eval()` or `new Function()`
- **Depth limiting** — Nested ICU constructs limited to 10 levels to prevent DoS via deeply nested plurals
- **Variable whitelist** — Only declared interpolation variables are injected; undeclared variables are ignored

### Translation Source Trust

- Database translations from untrusted sources (e.g., community contributions) are sanitized
- Imported translations go through `translationValueSchema` Zod validation
- AI-generated translations are marked with `translatedBy: 'ai-auto'` and require human review before publishing
- Only translations with `status: 'published'` are served to end users

### Access Control

- **Read access**: Any authenticated user can read translations (public data)
- **Write access**: `localization:manage` permission required for creating/updating/deleting translations
- **Import/Export**: `localization:manage` permission required
- **Locale configuration**: `localization:admin` permission required for adding/removing locales
- Translation key enumeration is unrestricted (keys are not sensitive)

### Content-Security-Policy

- No inline styles or scripts injected by locale switching
- RTL stylesheet loaded as external CSS file, not inline `<style>` tag
- Font loading for non-Latin scripts uses preconnect hints, not inline JavaScript

---

## Audit Events

| Event | Category | Description |
|-------|----------|-------------|
| `localization.locale_added` | admin | New locale added to venture |
| `localization.locale_removed` | admin | Locale removed from venture |
| `localization.locale_activated` | admin | Locale activated (visible to users) |
| `localization.locale_deactivated` | admin | Locale deactivated (hidden from users) |
| `localization.default_changed` | admin | Default locale changed |
| `localization.translations_imported` | admin | Translations imported (JSON/XLIFF/CSV) |
| `localization.translations_exported` | admin | Translations exported |
| `localization.key_created` | admin | New translation key created |
| `localization.key_updated` | admin | Translation key metadata updated |
| `localization.key_deleted` | admin | Translation key deleted |
| `localization.translation_created` | admin | New translation value added |
| `localization.translation_updated` | admin | Translation value changed |
| `localization.translation_approved` | admin | Translation reviewed and approved |
| `localization.translation_published` | system | Translation status set to published |
| `localization.translation_rejected` | admin | Translation review rejected |
| `localization.bundle_published` | system | Translation bundle published to CDN |
| `localization.bundle_invalidated` | system | Translation bundle cache invalidated |
| `localization.keys_synced` | system | Translation keys synced from source code scan |

### Audit Event Payload Example

```typescript
{
  event: 'localization.translation_updated',
  category: 'admin',
  ventureId: 'venture-uuid',
  actorId: 'user-uuid',
  timestamp: '2026-02-08T19:30:00.000Z',
  metadata: {
    keyId: 'key-uuid',
    key: 'dashboard.stats.totalUsers',
    namespace: 'dashboard',
    locale: 'fr',
    previousValue: '{count} utilisateurs au total',
    newValue: '{count, plural, one {# utilisateur} other {# utilisateurs}} au total',
    previousStatus: 'published',
    newStatus: 'review',
  },
}
```

---

## Environment Variables

```bash
# ═══════════════════════════════════════════════════════════════════════════════
# CORE SETTINGS
# ═══════════════════════════════════════════════════════════════════════════════

# Platform default locale (used when no venture default is set)
LOCALIZATION_DEFAULT_LOCALE=en

# Last-resort fallback locale (must always have 100% translation coverage)
LOCALIZATION_FALLBACK_LOCALE=en

# Comma-separated list of platform-wide supported locales
LOCALIZATION_SUPPORTED_LOCALES=en,fr,es,de,ja,ar

# ═══════════════════════════════════════════════════════════════════════════════
# TRANSLATION SOURCE
# ═══════════════════════════════════════════════════════════════════════════════

# Where to load translations from:
#   'static'   — JSON files only (fastest, no DB queries)
#   'database' — Database only (fully dynamic, venture-customizable)
#   'hybrid'   — Static as base, DB overrides on top (recommended)
LOCALIZATION_SOURCE=hybrid

# CDN base URL for translation bundles (client-side lazy loading)
LOCALIZATION_BUNDLE_CDN_URL=https://cdn.mcv.one/locales

# ═══════════════════════════════════════════════════════════════════════════════
# BEHAVIOR
# ═══════════════════════════════════════════════════════════════════════════════

# What to do when a translation key is missing:
#   'fallback' — Use fallback locale's translation (recommended)
#   'key'      — Return the key path as-is ("common.save")
#   'empty'    — Return empty string
#   'error'    — Throw TRANSLATION_KEY_NOT_FOUND
LOCALIZATION_MISSING_KEY_BEHAVIOR=fallback

# Use Accept-Language header for automatic locale detection
LOCALIZATION_AUTO_DETECT=true

# HTML-escape interpolated values by default (XSS prevention)
LOCALIZATION_ESCAPE_HTML=true

# ═══════════════════════════════════════════════════════════════════════════════
# CACHE
# ═══════════════════════════════════════════════════════════════════════════════

# CDN cache TTL for translation bundles (seconds)
LOCALIZATION_BUNDLE_CACHE_TTL=86400

# Maximum compiled ICU messages in the in-memory LRU cache
LOCALIZATION_ICU_CACHE_SIZE=10000

# Maximum Intl.* formatter instances in the pool
LOCALIZATION_FORMATTER_CACHE_SIZE=500

# ═══════════════════════════════════════════════════════════════════════════════
# AI TRANSLATION (Optional)
# ═══════════════════════════════════════════════════════════════════════════════

# Enable AI-assisted translation suggestions (routes through @mcv/intelligence/gateway)
LOCALIZATION_ENABLE_AI_TRANSLATE=false

# Model to use for AI translation suggestions
LOCALIZATION_AI_TRANSLATE_MODEL=gpt-4o

# Maximum AI translation suggestions per day per venture
LOCALIZATION_AI_TRANSLATE_DAILY_LIMIT=500

# ═══════════════════════════════════════════════════════════════════════════════
# DEVELOPMENT
# ═══════════════════════════════════════════════════════════════════════════════

# Log missing translation keys to console (development only)
LOCALIZATION_LOG_MISSING_KEYS=false

# Show translation key overlays in UI (development only)
LOCALIZATION_SHOW_KEY_OVERLAY=false

# Pseudo-localization for testing (adds accents/brackets to all strings)
LOCALIZATION_PSEUDO_LOCALE=false
```

---

## Error Codes

| Code | HTTP | Description | Recovery |
|------|------|-------------|----------|
| `LOCALE_NOT_SUPPORTED` | 400 | Requested locale not in venture's supported list | Use `getSupportedLocales()` to check available locales |
| `LOCALE_CONFIG_INVALID` | 400 | Invalid locale configuration (Zod validation failed) | Check `localeConfigSchema` for required fields |
| `TRANSLATION_KEY_NOT_FOUND` | 404 | Translation key does not exist in any source | Only thrown when `missingKeyBehavior: 'error'` |
| `TRANSLATION_KEY_DUPLICATE` | 409 | Key already exists in namespace for this venture | Use `hasTranslation()` to check before creating |
| `TRANSLATION_VALUE_INVALID` | 400 | Translation value contains invalid ICU syntax | Validate with `validateMessage()` before saving |
| `ICU_PARSE_ERROR` | 400 | ICU MessageFormat syntax error during compilation | Check ICU syntax reference; common issue: unbalanced braces |
| `ICU_MISSING_VARIABLE` | 400 | Required interpolation variable not provided | Check message for `{varName}` placeholders and provide all |
| `ICU_DEPTH_EXCEEDED` | 400 | Nested ICU constructs exceed 10-level depth limit | Simplify the message; split into multiple keys |
| `BUNDLE_LOAD_FAILED` | 500 | Failed to load translation bundle from CDN or disk | Check CDN URL and network connectivity |
| `BUNDLE_PARSE_FAILED` | 500 | Translation bundle is not valid JSON | Re-publish bundle; check for corrupted CDN cache |
| `IMPORT_FORMAT_ERROR` | 400 | Invalid import file format (not valid JSON/CSV/XLIFF) | Validate file format before importing |
| `IMPORT_LOCALE_MISMATCH` | 400 | Import file locale doesn't match target locale | Ensure XLIFF trgLang matches import locale parameter |
| `EXPORT_FORMAT_ERROR` | 400 | Unsupported export format requested | Supported: 'json', 'csv', 'xliff' |
| `COVERAGE_CALC_FAILED` | 500 | Failed to calculate translation coverage | Check database connectivity; may timeout on very large key sets |

### Error Handling Example

```typescript
import { t, loadTranslations, LocalizationError } from '@mcv/shared/localization';

try {
  await loadTranslations('xx-INVALID', 'common');
} catch (error) {
  if (error instanceof LocalizationError) {
    switch (error.code) {
      case 'LOCALE_NOT_SUPPORTED':
        console.warn(`Locale not supported, falling back to default`);
        await loadTranslations('en', 'common');
        break;
      case 'BUNDLE_LOAD_FAILED':
        console.error(`CDN unreachable, using static fallback`);
        break;
      default:
        console.error(`Localization error: ${error.code} — ${error.message}`);
    }
  }
}
```

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| @formatjs/intl-messageformat | ^10.x | ICU MessageFormat compilation & execution |
| @formatjs/intl-pluralrules | ^5.x | CLDR plural rules polyfill |
| @formatjs/intl-relativetimeformat | ^11.x | Relative time formatting polyfill |
| @formatjs/intl-listformat | ^7.x | List formatting polyfill |
| @formatjs/icu-messageformat-parser | ^2.x | ICU message AST parser for validation |
| drizzle-orm | ^0.29.x | Database ORM for translation storage |
| zod | ^3.22.x | Input validation schemas |
| lru-cache | ^10.x | In-memory caching for compiled messages and formatters |
| react | ^18.x | React context, hooks, and components (peer dependency) |

### Peer Dependencies

| Package | Version | Required By |
|---------|---------|-------------|
| react | ^18.x | Client hooks and components |
| react-dom | ^18.x | LocaleProvider, Trans component |

### Internal Dependencies

| Module | Relationship |
|--------|-------------|
| `@mcv/shared/audit` | Emits audit events for translation changes |
| `@mcv/shared/auth` | Permission checks for admin operations |
| `@mcv/shared/config` | Reads venture-level locale configuration |
| `@mcv/core/db` | Database connection for translation storage |

---

## Testing Notes

### Unit Testing

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import {
  t,
  setLocale,
  addTranslations,
  clearTranslations,
  formatDate,
  formatNumber,
  formatCurrency,
  formatList,
  isRtl,
  getDirection,
  resolveLocale,
  compileMessage,
  validateMessage,
} from '@mcv/shared/localization';

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSLATION TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Translation Service', () => {
  beforeEach(() => {
    clearTranslations();
    setLocale('en');
    addTranslations('en', 'common', {
      save: 'Save',
      cancel: 'Cancel',
      greeting: 'Hello, {name}!',
      'items.count': '{count, plural, =0 {No items} one {# item} other {# items}}',
    });
    addTranslations('fr', 'common', {
      save: 'Enregistrer',
      cancel: 'Annuler',
      greeting: 'Bonjour, {name} !',
    });
  });

  it('should translate simple keys', () => {
    expect(t('common.save')).toBe('Save');
    expect(t('common.cancel')).toBe('Cancel');
  });

  it('should interpolate variables', () => {
    expect(t('common.greeting', { name: 'John' })).toBe('Hello, John!');
  });

  it('should handle pluralization', () => {
    expect(t('common.items.count', { count: 0 })).toBe('No items');
    expect(t('common.items.count', { count: 1 })).toBe('1 item');
    expect(t('common.items.count', { count: 42 })).toBe('42 items');
  });

  it('should switch locales', () => {
    setLocale('fr');
    expect(t('common.save')).toBe('Enregistrer');
    expect(t('common.greeting', { name: 'Marie' })).toBe('Bonjour, Marie !');
  });

  it('should fall back to fallback locale for missing keys', () => {
    setLocale('fr');
    // 'items.count' not translated in French
    expect(t('common.items.count', { count: 3 })).toBe('3 items');
  });

  it('should HTML-escape interpolated values by default', () => {
    expect(t('common.greeting', { name: '<script>alert(1)</script>' }))
      .toBe('Hello, &lt;script&gt;alert(1)&lt;/script&gt;!');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// FORMAT TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Format Service', () => {
  const date = new Date('2026-02-08T14:30:00Z');

  it('should format dates with different styles', () => {
    expect(formatDate(date, { style: 'short' }, 'en')).toMatch(/2\/8\/26/);
    expect(formatDate(date, { style: 'long' }, 'en')).toContain('February');
  });

  it('should format dates for different locales', () => {
    expect(formatDate(date, { style: 'long' }, 'de')).toContain('Februar');
    expect(formatDate(date, { style: 'long' }, 'ja')).toContain('2月');
  });

  it('should format numbers with locale-specific separators', () => {
    expect(formatNumber(1234567.89, {}, 'en')).toBe('1,234,567.89');
    expect(formatNumber(1234567.89, {}, 'de')).toBe('1.234.567,89');
  });

  it('should format currency with correct symbol placement', () => {
    expect(formatCurrency(1999, 'USD', {}, 'en')).toMatch(/\$19\.99/);
    expect(formatCurrency(1999, 'EUR', {}, 'fr')).toMatch(/19,99\s*€/);
  });

  it('should format lists with correct conjunctions', () => {
    expect(formatList(['A', 'B', 'C'], {}, 'en')).toBe('A, B, and C');
    expect(formatList(['A', 'B', 'C'], {}, 'fr')).toMatch(/A, B et C/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// LOCALE TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Locale Service', () => {
  it('should detect RTL locales', () => {
    expect(isRtl('ar')).toBe(true);
    expect(isRtl('he')).toBe(true);
    expect(isRtl('fa')).toBe(true);
    expect(isRtl('en')).toBe(false);
    expect(isRtl('ja')).toBe(false);
  });

  it('should return correct direction', () => {
    expect(getDirection('ar')).toBe('rtl');
    expect(getDirection('en')).toBe('ltr');
  });

  it('should resolve locale from Accept-Language header', () => {
    const result = resolveLocale('fr-CA,fr;q=0.9,en;q=0.8', {
      supported: ['en', 'fr', 'fr-CA'],
      fallback: 'en',
    });
    expect(result).toBe('fr-CA');
  });

  it('should fall back when no supported locale matches', () => {
    const result = resolveLocale('zh-CN,zh;q=0.9', {
      supported: ['en', 'fr'],
      fallback: 'en',
    });
    expect(result).toBe('en');
  });

  it('should prefer user preference over Accept-Language', () => {
    const result = resolveLocale('en-US,en;q=0.9', {
      supported: ['en', 'fr', 'de'],
      fallback: 'en',
      userPreference: 'de',
    });
    expect(result).toBe('de');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ICU VALIDATION TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('ICU Service', () => {
  it('should validate correct ICU messages', () => {
    expect(validateMessage('Hello, {name}!')).toBe(true);
    expect(validateMessage('{count, plural, one {# item} other {# items}}')).toBe(true);
    expect(validateMessage('{gender, select, male {He} female {She} other {They}}')).toBe(true);
  });

  it('should reject invalid ICU messages', () => {
    expect(validateMessage('{count, plural, one {# item}')).toBe(false);  // Missing closing brace
    expect(validateMessage('{, plural, one {a} other {b}}')).toBe(false); // Missing variable name
    expect(validateMessage('{{{')).toBe(false);                            // Unbalanced braces
  });

  it('should compile and execute ICU messages', () => {
    const fn = compileMessage('{count, plural, one {# dog} other {# dogs}}', 'en');
    expect(fn({ count: 1 })).toBe('1 dog');
    expect(fn({ count: 5 })).toBe('5 dogs');
  });
});
```

### Integration Testing

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '@mcv/core/db';
import {
  importTranslations,
  exportTranslations,
  getTranslationCoverage,
  getMissingTranslations,
  listTranslationKeys,
  syncTranslationKeys,
} from '@mcv/shared/localization';

describe('Translation Admin (Integration)', () => {
  const ventureId = 'test-venture-uuid';

  beforeAll(async () => {
    // Seed test venture and translation keys
    await seedTestVenture(ventureId, {
      locales: ['en', 'fr', 'es'],
      defaultLocale: 'en',
    });

    await seedTranslationKeys(ventureId, [
      { namespace: 'common', key: 'save', sourceText: 'Save' },
      { namespace: 'common', key: 'cancel', sourceText: 'Cancel' },
      { namespace: 'common', key: 'delete', sourceText: 'Delete' },
      { namespace: 'dashboard', key: 'title', sourceText: 'Dashboard' },
    ]);

    // Add French translations for 2 of 4 keys
    await seedTranslations(ventureId, 'fr', {
      'common.save': 'Enregistrer',
      'common.cancel': 'Annuler',
    });
  });

  afterAll(async () => {
    await cleanupTestVenture(ventureId);
  });

  it('should calculate correct coverage', async () => {
    const coverage = await getTranslationCoverage(ventureId, 'fr');

    expect(coverage.totalKeys).toBe(4);
    expect(coverage.translatedKeys).toBe(2);
    expect(coverage.coveragePercent).toBe(50);
    expect(coverage.missingKeys).toContain('common.delete');
    expect(coverage.missingKeys).toContain('dashboard.title');
  });

  it('should list missing translations by namespace', async () => {
    const missing = await getMissingTranslations(ventureId, 'fr', 'common');

    expect(missing).toHaveLength(1);
    expect(missing[0]).toBe('common.delete');
  });

  it('should import translations from JSON', async () => {
    const result = await importTranslations(ventureId, {
      locale: 'fr',
      format: 'json',
      data: JSON.stringify({
        common: { delete: 'Supprimer' },
        dashboard: { title: 'Tableau de bord' },
      }),
      overwriteExisting: false,
      markAsReview: true,
    });

    expect(result.created).toBe(2);
    expect(result.updated).toBe(0);
    expect(result.errors).toHaveLength(0);

    // Verify coverage improved
    const coverage = await getTranslationCoverage(ventureId, 'fr');
    expect(coverage.coveragePercent).toBe(100);
  });

  it('should export translations as XLIFF', async () => {
    const xliff = await exportTranslations(ventureId, {
      locale: 'fr',
      format: 'xliff',
    });

    expect(xliff).toContain('srcLang="en"');
    expect(xliff).toContain('trgLang="fr"');
    expect(xliff).toContain('Enregistrer');
    expect(xliff).toContain('Supprimer');
  });

  it('should detect stale translations after source text change', async () => {
    // Update source text
    await updateTranslationKeySource(ventureId, 'common.save', 'Save Changes');

    const coverage = await getTranslationCoverage(ventureId, 'fr');

    // French translation for 'save' is now stale (source changed)
    expect(coverage.staleKeys).toContain('common.save');
  });
});
```

### React Component Testing

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  LocaleProvider,
  useTranslation,
  FormattedDate,
  FormattedCurrency,
  LocaleSwitcher,
} from '@mcv/shared/localization';

function TestApp({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider
      defaultLocale="en"
      supportedLocales={['en', 'fr', 'ar']}
      fallbackLocale="en"
      loadBundle={async (locale, ns) => mockBundles[locale]?.[ns] ?? {}}
    >
      {children}
    </LocaleProvider>
  );
}

const mockBundles = {
  en: { common: { greeting: 'Hello, {name}!', save: 'Save' } },
  fr: { common: { greeting: 'Bonjour, {name} !', save: 'Enregistrer' } },
  ar: { common: { greeting: '!{name} ،مرحبا', save: 'حفظ' } },
};

describe('LocaleProvider & useTranslation', () => {
  function GreetingComponent() {
    const { t } = useTranslation();
    return <p data-testid="greeting">{t('common.greeting', { name: 'Alice' })}</p>;
  }

  it('should render translations in default locale', async () => {
    render(
      <TestApp>
        <GreetingComponent />
      </TestApp>
    );

    await waitFor(() => {
      expect(screen.getByTestId('greeting').textContent).toBe('Hello, Alice!');
    });
  });

  it('should switch locale and re-render', async () => {
    function SwitchableApp() {
      const { t, setLocale } = useTranslation();
      return (
        <>
          <p data-testid="text">{t('common.save')}</p>
          <button onClick={() => setLocale('fr')}>Switch to French</button>
        </>
      );
    }

    render(
      <TestApp>
        <SwitchableApp />
      </TestApp>
    );

    await waitFor(() => {
      expect(screen.getByTestId('text').textContent).toBe('Save');
    });

    fireEvent.click(screen.getByText('Switch to French'));

    await waitFor(() => {
      expect(screen.getByTestId('text').textContent).toBe('Enregistrer');
    });
  });

  it('should set dir="rtl" for Arabic locale', async () => {
    function DirComponent() {
      const { locale, setLocale } = useTranslation();
      const dir = locale === 'ar' ? 'rtl' : 'ltr';
      return (
        <>
          <div data-testid="container" dir={dir} />
          <button onClick={() => setLocale('ar')}>Arabic</button>
        </>
      );
    }

    render(
      <TestApp>
        <DirComponent />
      </TestApp>
    );

    fireEvent.click(screen.getByText('Arabic'));

    await waitFor(() => {
      expect(screen.getByTestId('container').getAttribute('dir')).toBe('rtl');
    });
  });
});

describe('Formatted Components', () => {
  it('should render FormattedDate', async () => {
    render(
      <TestApp>
        <FormattedDate value={new Date('2026-02-08')} style="long" />
      </TestApp>
    );

    await waitFor(() => {
      expect(screen.getByText(/February/)).toBeTruthy();
    });
  });

  it('should render FormattedCurrency', async () => {
    render(
      <TestApp>
        <FormattedCurrency value={4999} currency="USD" />
      </TestApp>
    );

    await waitFor(() => {
      expect(screen.getByText(/\$49\.99/)).toBeTruthy();
    });
  });
});
```

---

## Migration Guide

### Adding a New Locale to a Venture

```typescript
// 1. Add locale to venture configuration
await addLocale('venture-uuid', {
  locale: 'ja',
  isDefault: false,
  isActive: false,                      // Start inactive until translations are ready
  displayName: '日本語',
});

// 2. Check how many keys need translation
const coverage = await getTranslationCoverage('venture-uuid', 'ja');
console.log(`Japanese: ${coverage.missingKeys.length} keys to translate`);

// 3. Export missing keys for translation
const xliff = await exportTranslations('venture-uuid', {
  locale: 'ja',
  format: 'xliff',
  onlyMissing: true,
  includeMetadata: true,
});

// 4. After translations are imported and reviewed, activate the locale
await activateLocale('venture-uuid', 'ja');
// Emits: localization.locale_activated
```

### Migrating from i18next

```typescript
// i18next format:
// { "key": "Hello {{name}}" }
// { "key_plural": "{{count}} items" }

// MCV localization format:
// { "key": "Hello, {name}!" }
// { "key": "{count, plural, one {# item} other {# items}}" }

// Migration script converts:
// 1. {{var}} → {var}
// 2. key / key_plural → single key with ICU plural
// 3. $t(ref) → nested key reference
// 4. Namespace files remain compatible (JSON structure)
```

---

## Related Modules

| Module | Relationship |
|--------|-------------|
| `@mcv/shared/templates` | Templates use `t()` for multilingual email/PDF content |
| `@mcv/shared/export` | Export module formats dates/numbers using localization formatters |
| `@mcv/shared/theming` | RTL direction influences theme layout properties |
| `@mcv/shared/audit` | All translation changes emit audit events via the audit module |
| `@mcv/shared/config` | Venture-level locale configuration stored and read via config |
| `@mcv/fabric/notifications` | Notification content localized per user preference |
| `@mcv/intelligence/gateway` | AI translation suggestions route through gateway |
| `@mcv/core/db` | Drizzle schema and database connection for translation storage |

---

*@mcv/shared/localization — Localization Module*
