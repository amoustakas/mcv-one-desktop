# @mcv/shared/validation — Validation Module

**Parent Package:** @mcv/shared  
**Tier:** 2.5 (Shared Business Utilities)  
**Classification:** PUBLISHABLE  
**Last Updated:** February 8, 2026

---

## Purpose

The `validation` module provides a comprehensive validation framework combining Zod schemas for type-safe structural validation with business rule engines for cross-field, async, and domain-specific validation. It powers both client-side form validation (React Hook Form integration) and server-side input validation (tRPC procedures), ensuring consistent data integrity rules across the entire MCV ecosystem.

**Every data entry point in MCV — from user registration forms to bulk CSV imports to API requests — validates through this module.**

The module follows a strict **validate-once, trust-downstream** principle: data is validated at the boundary (form submission, API ingress, file import) and flows as typed, trusted objects through all subsequent layers. This eliminates redundant checks, reduces latency, and ensures a single source of truth for every validation rule.

### Key Design Principles

1. **Isomorphic schemas** — Same Zod schemas run on client and server, zero rule divergence
2. **Progressive validation** — Sanitize → Schema → Business Rules → Async Checks, fail fast
3. **Composable** — Small validators combine into complex pipelines via `composeValidators`
4. **i18n-ready** — Every error message supports interpolation and locale switching
5. **Auditable** — Validation failures emit structured events for compliance logging
6. **Zero-trust input** — All external input is treated as hostile; sanitized before processing

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMA BUILDERS
// ═══════════════════════════════════════════════════════════════════════════════

export { z } from 'zod';                     // Re-export Zod for convenience

export {
  createSchema,              // Build schema from field definitions
  extendSchema,              // Extend existing schema with new fields
  mergeSchemas,              // Merge multiple schemas
  partialSchema,             // Make all fields optional
  pickSchema,                // Pick specific fields
  omitSchema,                // Omit specific fields
} from './server/services/schema-service';

// ═══════════════════════════════════════════════════════════════════════════════
// COMMON VALIDATORS (Pre-built Zod schemas)
// ═══════════════════════════════════════════════════════════════════════════════

export {
  email,                     // Email address validator
  phone,                     // Phone number (country-aware)
  url,                       // URL validator (protocol options)
  uuid,                      // UUID v4 validator
  slug,                      // URL-safe slug
  password,                  // Password strength validator
  username,                  // Username format validator
  postalCode,                // Postal/zip code (country-aware)
  creditCard,                // Credit card number (Luhn check)
  iban,                      // International bank account number
  vatNumber,                 // VAT/tax ID validator
  hexColor,                  // Hex color code
  ipAddress,                 // IPv4/IPv6 address
  dateString,                // ISO date string
  currencyCode,              // ISO 4217 currency code
  countryCode,               // ISO 3166-1 alpha-2 country code
  languageCode,              // ISO 639-1 language code
} from './server/validators/common';

// ═══════════════════════════════════════════════════════════════════════════════
// PATTERN VALIDATORS (Reusable field patterns)
// ═══════════════════════════════════════════════════════════════════════════════

export {
  requiredString,            // Non-empty trimmed string
  optionalString,            // Optional trimmed string
  numericString,             // String that parses to number
  dateRange,                 // Start/end date pair validation
  priceRange,                // Min/max price pair validation
  paginationParams,          // page, limit, offset
  sortParams,                // sortBy, sortOrder
  searchQuery,               // Sanitized search string
  fileUpload,                // File metadata validation (size, type, ext)
  colorValue,                // CSS color value (hex, rgb, hsl)
  jsonString,                // String that parses to valid JSON
  markdownString,            // Markdown content with length limits
  crontab,                   // Cron expression validator
} from './server/validators/patterns';

// ═══════════════════════════════════════════════════════════════════════════════
// BUSINESS VALIDATION ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

export {
  createValidator,           // Create business rule validator
  validateEntity,            // Validate entity against rules
  validateField,             // Validate single field
  validateAsync,             // Run async validations
  composeValidators,         // Combine multiple validators
  conditionalRule,           // Rule that applies conditionally
} from './server/services/validation-service';

// ═══════════════════════════════════════════════════════════════════════════════
// RULE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  defineRule,                // Define a validation rule
  defineRuleSet,             // Define a set of rules for an entity
  getRuleSet,                // Get rule set by name
  listRuleSets,              // List available rule sets
  cloneRuleSet,              // Clone and override a rule set per-venture
  mergeRuleSets,             // Merge multiple rule sets
} from './server/services/rule-service';

// ═══════════════════════════════════════════════════════════════════════════════
// FORM INTEGRATION (Client)
// ═══════════════════════════════════════════════════════════════════════════════

export {
  useFormValidation,         // React Hook Form + Zod integration
  validateForm,              // Imperative form validation
  zodResolver,               // Zod resolver for React Hook Form
  useFieldValidation,        // Single-field real-time validation hook
  useAsyncValidation,        // Debounced async validation hook (uniqueness)
} from './client/hooks/use-form-validation';

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR MESSAGES
// ═══════════════════════════════════════════════════════════════════════════════

export {
  setValidationMessages,     // Set global error message overrides
  getValidationMessages,     // Get current message config
  formatValidationError,     // Format error for display
  localizeErrors,            // Localize error messages
  interpolateMessage,        // Interpolate {{params}} in message template
} from './server/services/message-service';

// ═══════════════════════════════════════════════════════════════════════════════
// SANITIZATION
// ═══════════════════════════════════════════════════════════════════════════════

export {
  sanitize,                  // Sanitize input (trim, strip HTML)
  sanitizeHtml,              // Allow safe HTML subset
  normalizeWhitespace,       // Collapse whitespace
  normalizeEmail,            // Normalize email format
  normalizePhone,            // Normalize phone to E.164
  escapeRegex,               // Escape special regex characters
  stripNullBytes,            // Remove null bytes from input
  normalizeUnicode,          // NFC normalize unicode strings
} from './server/services/sanitize-service';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  VALIDATION_SEVERITY,
  PASSWORD_POLICIES,
  PHONE_FORMATS,
  POSTAL_CODE_FORMATS,
  COMMON_PATTERNS,
  VALIDATION_ERROR_CODES,
  DEFAULT_SANITIZE_OPTIONS,
  RESERVED_SLUGS,
} from './constants';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  ValidationRule,
  ValidationRuleType,
  ValidationResult,
  ValidationError,
  ValidationCondition,
  ValidationGroup,
  RuleSet,
  RuleSetDefinition,
  ValidatorConfig,
  PasswordPolicy,
  SanitizeOptions,
  FormValidationOptions,
  LocalizedString,
  ValidationPipeline,
  ValidationMiddleware,
  BulkValidationResult,
  FieldValidationState,
} from './types';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           VALIDATION ARCHITECTURE                                    │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐   │
│  │                            INPUT SOURCES                                      │   │
│  │                                                                               │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │   │
│  │  │  React Forms │  │  tRPC Input  │  │  CSV Import  │  │  API Body    │     │   │
│  │  │  (client)    │  │  (server)    │  │  (bulk)      │  │  (webhook)   │     │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │   │
│  │         │                 │                 │                  │              │   │
│  │         └─────────────────┴─────────────────┴──────────────────┘              │   │
│  │                                    │                                          │   │
│  └────────────────────────────────────┼──────────────────────────────────────────┘   │
│                                       │                                              │
│  ┌────────────────────────────────────▼──────────────────────────────────────────┐   │
│  │                      VALIDATION PIPELINE                                       │   │
│  │                                                                                │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  │   │
│  │  │   1.      │  │   2.      │  │   3.      │  │   4.      │  │   5.      │  │   │
│  │  │ Sanitize  │─▶│  Schema   │─▶│ Business  │─▶│  Async    │─▶│ Aggregate │  │   │
│  │  │ Input     │  │  (Zod)    │  │  Rules    │  │  Checks   │  │ Results   │  │   │
│  │  │           │  │           │  │           │  │           │  │           │  │   │
│  │  │ • Trim    │  │ • Type    │  │ • Cross-  │  │ • Unique  │  │ • Collect │  │   │
│  │  │ • Strip   │  │ • Format  │  │   field   │  │ • Exists  │  │ • Severity│  │   │
│  │  │ • Normal- │  │ • Range   │  │ • Cond.   │  │ • External│  │ • Locale  │  │   │
│  │  │   ize     │  │ • Enum    │  │ • Domain  │  │ • DB      │  │ • Return  │  │   │
│  │  │ • Encode  │  │ • Nested  │  │ • State   │  │ • API     │  │   Result  │  │   │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘  └───────────┘  │   │
│  │                                                                                │   │
│  │  Pipeline Guarantees:                                                          │   │
│  │  • Each stage runs ONLY if the previous stage passed (fail-fast)               │   │
│  │  • Async checks run ONLY after all sync checks pass (cost optimization)        │   │
│  │  • Abort-early mode stops at first error within each stage                     │   │
│  │  • Results include timing data for each stage                                  │   │
│  │                                                                                │   │
│  └────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                       │
│  ┌────────────────────────────────────────────────────────────────────────────────┐   │
│  │                     ISOMORPHIC LAYER (Client + Server)                          │   │
│  │                                                                                 │   │
│  │  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐        │   │
│  │  │    Zod Schemas     │  │   Common Patterns   │  │   Error Messages   │        │   │
│  │  │                    │  │                     │  │                    │        │   │
│  │  │  Same schema runs  │  │  email(), phone()   │  │  i18n-ready msgs  │        │   │
│  │  │  client + server.  │  │  url(), slug()      │  │  with {{param}}   │        │   │
│  │  │  Zero divergence.  │  │  password(), uuid() │  │  interpolation.   │        │   │
│  │  │                    │  │                     │  │                    │        │   │
│  │  │  Compiled once,    │  │  Country-aware:     │  │  Per-venture       │        │   │
│  │  │  cached for reuse. │  │  postalCode('CA')   │  │  message overrides │        │   │
│  │  │  Tree-shakeable.   │  │  phone('US')        │  │  supported.       │        │   │
│  │  └────────────────────┘  └────────────────────┘  └────────────────────┘        │   │
│  │                                                                                 │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                     SERVER-ONLY LAYER                                            │   │
│  │                                                                                  │   │
│  │  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐            │   │
│  │  │  Business Rules   │  │   Async Checks    │  │  Audit Events     │            │   │
│  │  │                   │  │                   │  │                   │            │   │
│  │  │  Rule engine with │  │  DB uniqueness    │  │  validation.failed│            │   │
│  │  │  conditional      │  │  External API     │  │  validation.warn  │            │   │
│  │  │  execution and    │  │  calls with       │  │  sanitize.stripped│            │   │
│  │  │  group support    │  │  timeout + retry  │  │  rule_set.changed │            │   │
│  │  │  (create/update)  │  │  and batching     │  │                   │            │   │
│  │  └───────────────────┘  └───────────────────┘  └───────────────────┘            │   │
│  │                                                                                  │   │
│  └──────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐   │
│  │                      DATABASE LAYER (Drizzle ORM)                                 │   │
│  │                                                                                   │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐                │   │
│  │  │ validation_rule_ │  │  validation_      │  │  validation_     │                │   │
│  │  │ sets             │  │  rules            │  │  messages        │                │   │
│  │  │                  │  │                   │  │                  │                │   │
│  │  │ Per-venture or   │  │ Individual rules  │  │ Per-locale       │                │   │
│  │  │ global rule set  │  │ within a set:     │  │ error message    │                │   │
│  │  │ definitions for  │  │ type, params,     │  │ templates with   │                │   │
│  │  │ each entity type │  │ conditions,       │  │ interpolation    │                │   │
│  │  │                  │  │ severity, group   │  │ support          │                │   │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘                │   │
│  │                                                                                   │   │
│  │  ┌──────────────────┐  ┌──────────────────┐                                      │   │
│  │  │ validation_      │  │ password_         │                                      │   │
│  │  │ audit_log        │  │ policies          │                                      │   │
│  │  │                  │  │                   │                                      │   │
│  │  │ Every failed     │  │ Per-venture       │                                      │   │
│  │  │ validation with  │  │ password strength │                                      │   │
│  │  │ entity, field,   │  │ requirements and  │                                      │   │
│  │  │ rule, user       │  │ blocklist config  │                                      │   │
│  │  └──────────────────┘  └──────────────────┘                                      │   │
│  │                                                                                   │   │
│  └───────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow: Form Submission

```
User types → React Hook Form onChange
  │
  ├─ Client: zodResolver(schema).parse(fieldValue)     ← instant feedback
  │    └─ Error? → Display inline message, block submit
  │
  ├─ User clicks Submit
  │    └─ Client: zodResolver(schema).parse(allFields)  ← full form check
  │         └─ Error? → Display all messages, block submit
  │
  ├─ tRPC mutation fires with validated input
  │    └─ Server: .input(schema) validates again         ← defense in depth
  │         └─ Error? → TRPCError(BAD_REQUEST)
  │
  ├─ Server: businessRuleValidator.validate(data)        ← domain rules
  │    └─ Cross-field, conditional, state-dependent
  │         └─ Error? → TRPCError(UNPROCESSABLE_ENTITY)
  │
  ├─ Server: asyncValidations(data)                      ← DB checks
  │    └─ Uniqueness, existence, external API
  │         └─ Error? → TRPCError(CONFLICT)
  │
  └─ ✅ Data flows downstream as fully trusted typed object
```

---

## Core Interfaces

### ValidationRule

```typescript
/**
 * A single validation rule that can be applied to one or more fields.
 * Rules are composed into RuleSets and executed by the validation engine.
 */
interface ValidationRule {
  /** Unique rule identifier (auto-generated if omitted in defineRule) */
  id: string;

  /** Human-readable name for debugging and audit logs */
  name: string;

  /** Single field target (dot-notation for nested: 'address.zip') */
  field?: string;

  /** Multi-field target for cross-field rules */
  fields?: string[];

  /** Rule type determines which validator function runs */
  type: ValidationRuleType;

  /** Rule-specific parameters (e.g., { min: 5, max: 100 }) */
  params: Record<string, unknown>;

  /** When to apply this rule — null means always apply */
  condition?: ValidationCondition;

  /** Error message (supports interpolation: '{{field}} must be at least {{min}}') */
  message: string | LocalizedString;

  /** Severity level — errors block submission, warnings/infos do not */
  severity: 'error' | 'warning' | 'info';

  /** Validation group — determines when rule applies (e.g., 'create', 'update', 'import') */
  group?: string;

  /** Priority — lower numbers run first within a stage (default: 0) */
  priority?: number;

  /** Whether this rule requires async execution (DB lookup, API call) */
  async?: boolean;

  /** Timeout for async rules in milliseconds (default: VALIDATION_MAX_ASYNC_TIMEOUT_MS) */
  timeoutMs?: number;
}
```

### ValidationRuleType

```typescript
/**
 * All supported rule types. Each type maps to a specific validator function
 * in the rule execution engine.
 */
type ValidationRuleType =
  // ─── Presence ──────────────────────────────────────────────────────────
  | 'required'           // Field must be present and non-empty
  | 'optional'           // Field may be absent (modifier for other rules)
  | 'requiredIf'         // Required when condition is met
  | 'requiredUnless'     // Required unless condition is met

  // ─── Type ──────────────────────────────────────────────────────────────
  | 'string'             // Must be a string
  | 'number'             // Must be a number (or numeric string with coerce)
  | 'boolean'            // Must be a boolean
  | 'date'               // Must be a valid Date or ISO date string
  | 'array'              // Must be an array
  | 'object'             // Must be a plain object

  // ─── Format ────────────────────────────────────────────────────────────
  | 'email'              // Valid email address (RFC 5322)
  | 'url'                // Valid URL with configurable protocol list
  | 'phone'              // Phone number (country-aware via libphonenumber)
  | 'postalCode'         // Postal/zip code (country-aware format)
  | 'creditCard'         // Credit card number (Luhn algorithm check)
  | 'iban'               // International Bank Account Number
  | 'uuid'               // UUID v4 format
  | 'slug'               // URL-safe slug (lowercase, hyphens, no spaces)
  | 'ipAddress'          // IPv4 or IPv6 address
  | 'hexColor'           // Hex color code (#RGB or #RRGGBB)
  | 'iso8601'            // ISO 8601 datetime string
  | 'semver'             // Semantic versioning string

  // ─── Bounds ────────────────────────────────────────────────────────────
  | 'min'                // Minimum value (number) or length (string/array)
  | 'max'                // Maximum value (number) or length (string/array)
  | 'range'              // Between min and max (inclusive)
  | 'length'             // Exact length or length range
  | 'pattern'            // Regex pattern match

  // ─── Set ───────────────────────────────────────────────────────────────
  | 'enum'               // Must be one of allowed values
  | 'oneOf'              // Must match at least one sub-schema
  | 'noneOf'             // Must not match any blocked values

  // ─── Database ──────────────────────────────────────────────────────────
  | 'unique'             // Value must not exist in database
  | 'exists'             // Referenced record must exist in database
  | 'immutable'          // Field cannot be changed after creation

  // ─── Custom ────────────────────────────────────────────────────────────
  | 'custom'             // Custom sync validation function
  | 'async';             // Custom async validation function
```

### ValidationResult

```typescript
/**
 * The output of any validation operation. Contains all errors, warnings,
 * informational messages, and performance timing.
 */
interface ValidationResult {
  /** Overall validity — true only if zero errors */
  valid: boolean;

  /** Blocking errors that prevent submission */
  errors: ValidationError[];

  /** Non-blocking warnings (e.g., 'large order may require approval') */
  warnings: ValidationError[];

  /** Informational messages (e.g., 'strong password') */
  infos: ValidationError[];

  /** Errors grouped by field path for easy UI binding */
  fieldErrors: Record<string, string[]>;

  /** Field-level warnings grouped by field path */
  fieldWarnings: Record<string, string[]>;

  /** Total validation time in milliseconds */
  duration: number;

  /** Per-stage timing breakdown */
  stageTiming: {
    sanitize: number;
    schema: number;
    businessRules: number;
    asyncChecks: number;
    aggregate: number;
  };

  /** Number of rules evaluated */
  rulesEvaluated: number;

  /** Number of async checks performed */
  asyncChecksPerformed: number;

  /** The group that was validated (if applicable) */
  group?: string;
}
```

### ValidationError

```typescript
/**
 * A single validation error, warning, or informational message.
 */
interface ValidationError {
  /** Field path using dot-notation (e.g., 'address.zip', 'items[0].quantity') */
  field: string;

  /** Rule name/ID that produced this error */
  rule: string;

  /** Localized, interpolated error message ready for display */
  message: string;

  /** Raw message template before interpolation (for re-localization) */
  messageTemplate?: string;

  /** Rule parameters used for message interpolation */
  params?: Record<string, unknown>;

  /** Severity level */
  severity: 'error' | 'warning' | 'info';

  /** The invalid value (omitted for sensitive fields like passwords) */
  value?: unknown;

  /** Error code for programmatic handling */
  code: string;
}
```

### ValidationCondition

```typescript
/**
 * Condition that determines whether a rule should be applied.
 * Allows conditional validation based on other field values.
 */
interface ValidationCondition {
  /** Field path to check (dot-notation) */
  field: string;

  /** Comparison operator */
  operator:
    | 'eq'       // Equal (strict)
    | 'neq'      // Not equal
    | 'gt'       // Greater than
    | 'lt'       // Less than
    | 'gte'      // Greater than or equal
    | 'lte'      // Less than or equal
    | 'in'       // Value in array
    | 'notIn'    // Value not in array
    | 'exists'   // Field is present and not null/undefined
    | 'empty'    // Field is null, undefined, or empty string
    | 'matches'  // Regex match
    | 'contains' // String contains substring
    ;

  /** Expected value for comparison (not needed for 'exists' / 'empty') */
  value?: unknown;

  /** Combine multiple conditions (default: 'and') */
  logic?: 'and' | 'or';

  /** Nested conditions for complex logic */
  conditions?: ValidationCondition[];
}
```

### RuleSet & RuleSetDefinition

```typescript
/**
 * A compiled set of validation rules for a specific entity type.
 * RuleSets are registered globally and can be overridden per-venture.
 */
interface RuleSet {
  /** Unique name (e.g., 'user-registration', 'product-create') */
  name: string;

  /** Entity type this rule set validates (e.g., 'user', 'product', 'order') */
  entity: string;

  /** Venture ID if this is a venture-specific override (null = global) */
  ventureId: string | null;

  /** Compiled validation rules */
  rules: ValidationRule[];

  /** Named groups mapping to rule IDs */
  groups: Record<string, string[]>;

  /** Optional Zod schema for structural validation */
  schema?: z.ZodSchema;

  /** Whether this rule set can be overridden per-venture */
  overridable: boolean;

  /** Metadata */
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input definition for creating a new rule set.
 */
interface RuleSetDefinition {
  name: string;
  entity: string;
  ventureId?: string;
  rules: Omit<ValidationRule, 'id'>[];
  schema?: z.ZodSchema;
  overridable?: boolean;
}
```

### ValidatorConfig

```typescript
/**
 * Configuration options passed to validation operations.
 */
interface ValidatorConfig {
  /** Venture scope — used for venture-specific rule overrides and locale */
  ventureId?: VentureID;

  /** Locale for error message localization (e.g., 'en-US', 'fr-FR') */
  locale?: string;

  /** Stop on first error within each stage (default: false) */
  abortEarly?: boolean;

  /** Remove unknown fields not defined in schema (default: false) */
  stripUnknown?: boolean;

  /** Validation group to use (e.g., 'create', 'update', 'import') */
  group?: string;

  /** Extra context for conditional rules (e.g., current user role) */
  context?: Record<string, unknown>;

  /** Skip async validations (for client-side or performance-critical paths) */
  skipAsync?: boolean;

  /** Skip sanitization stage (for already-sanitized input) */
  skipSanitize?: boolean;

  /** Maximum async validation timeout in ms (overrides env default) */
  asyncTimeoutMs?: number;

  /** Existing entity data for comparison (used by 'immutable' rules on update) */
  existingData?: Record<string, unknown>;
}
```

### PasswordPolicy

```typescript
/**
 * Configurable password strength policy. Per-venture overrides supported.
 */
interface PasswordPolicy {
  /** Minimum characters (default: 12) */
  minLength: number;

  /** Maximum characters (default: 128) */
  maxLength: number;

  /** At least one uppercase letter (default: true) */
  requireUppercase: boolean;

  /** At least one lowercase letter (default: true) */
  requireLowercase: boolean;

  /** At least one digit (default: true) */
  requireNumber: boolean;

  /** At least one special character (default: true) */
  requireSpecial: boolean;

  /** Block common passwords from haveibeenpwned list (default: true) */
  disallowCommon: boolean;

  /** Block email/name substrings in password (default: true) */
  disallowUserInfo: boolean;

  /** Max sequential repeated chars, e.g., 'aaa' (default: 3) */
  maxRepeatedChars: number;

  /** Minimum character classes required (out of 4: upper, lower, digit, special) */
  minCharacterClasses: number;

  /** Custom regex patterns to enforce (optional) */
  customPatterns?: { pattern: string; message: string }[];

  /** Custom blocklist words (in addition to common passwords) */
  blocklist?: string[];
}
```

### SanitizeOptions

```typescript
/**
 * Options for the sanitize() function.
 */
interface SanitizeOptions {
  /** Trim leading/trailing whitespace (default: true) */
  trim: boolean;

  /** Strip all HTML tags (default: true) */
  stripHtml: boolean;

  /** Collapse multiple whitespace to single space (default: true) */
  normalizeWhitespace: boolean;

  /** Maximum allowed string length — truncates beyond this (default: 100000) */
  maxLength: number;

  /** Unicode normalization form (default: 'NFC') */
  unicodeNormalization: 'NFC' | 'NFD' | 'NFKC' | 'NFKD' | false;

  /** Remove null bytes (default: true) */
  stripNullBytes: boolean;

  /** Remove control characters except newlines and tabs (default: true) */
  stripControlChars: boolean;

  /** Allowed HTML tags when stripHtml is false (for sanitizeHtml) */
  allowedTags?: string[];

  /** Allowed HTML attributes per tag */
  allowedAttributes?: Record<string, string[]>;
}
```

### FormValidationOptions

```typescript
/**
 * Options for the useFormValidation hook.
 */
interface FormValidationOptions<T extends z.ZodSchema> {
  /** Zod schema for validation */
  schema: T;

  /** Validation mode: when to trigger validation */
  mode: 'onBlur' | 'onChange' | 'onSubmit' | 'onTouched' | 'all';

  /** Revalidation mode after first submission */
  reValidateMode?: 'onBlur' | 'onChange' | 'onSubmit';

  /** Default form values */
  defaultValues?: Partial<z.infer<T>>;

  /** Async validation debounce in ms (default: 300) */
  asyncDebounceMs?: number;

  /** Fields that require async validation */
  asyncFields?: string[];

  /** Async validation functions by field */
  asyncValidators?: Record<string, (value: unknown) => Promise<string | null>>;

  /** Locale for error messages */
  locale?: string;
}
```

### BulkValidationResult

```typescript
/**
 * Result of validating a batch of records (e.g., CSV import).
 */
interface BulkValidationResult {
  /** Total records processed */
  totalRecords: number;

  /** Number of valid records */
  validCount: number;

  /** Number of records with errors */
  errorCount: number;

  /** Number of records with warnings only */
  warningCount: number;

  /** Per-record results (only failures included to save memory) */
  failures: Array<{
    row: number;
    data: Record<string, unknown>;
    result: ValidationResult;
  }>;

  /** Aggregate error summary by rule name */
  errorSummary: Record<string, number>;

  /** Total processing time in ms */
  duration: number;

  /** Records processed per second */
  throughput: number;
}
```

---

## Built-in Validation Patterns

### Common Validators Reference

| Validator | Parameters | Example Valid | Example Invalid | Notes |
|-----------|-----------|---------------|-----------------|-------|
| `email()` | none | `user@example.com` | `user@` | RFC 5322 compliant |
| `phone({ country })` | `country: string` | `+1 (555) 123-4567` | `123` | Uses libphonenumber |
| `url({ protocols })` | `protocols: string[]` | `https://example.com` | `ftp://x` | Default: http/https |
| `uuid()` | none | `550e8400-e29b-...` | `not-a-uuid` | UUID v4 only |
| `slug()` | none | `my-cool-slug` | `My Slug!` | `[a-z0-9-]+` |
| `password(policy)` | `PasswordPolicy` | `Str0ng!Pass` | `weak` | Configurable policy |
| `username()` | none | `john_doe-42` | `@invalid!` | `[a-zA-Z0-9_-]{3,30}` |
| `postalCode({ country })` | `country: string` | `10001` (US), `K1A 0B1` (CA) | `ABCDE` | 50+ country formats |
| `creditCard()` | none | `4111111111111111` | `1234` | Luhn algorithm |
| `iban()` | none | `DE89370400440532013000` | `INVALID` | Checksum validated |
| `vatNumber()` | none | `DE123456789` | `123` | EU format validation |
| `currencyCode()` | none | `USD` | `USDX` | ISO 4217 |
| `countryCode()` | none | `US` | `USA` | ISO 3166-1 alpha-2 |
| `languageCode()` | none | `en` | `english` | ISO 639-1 |
| `hexColor()` | none | `#FF5733` | `red` | 3 or 6 digit hex |
| `ipAddress()` | none | `192.168.1.1` | `999.999.999.999` | IPv4 and IPv6 |
| `dateString()` | none | `2026-02-08` | `02/08/2026` | ISO 8601 only |

### Pattern Validators Reference

| Pattern | Returns | Description |
|---------|---------|-------------|
| `requiredString()` | `z.string().min(1).trim()` | Non-empty trimmed string |
| `optionalString()` | `z.string().trim().optional()` | Optional trimmed string |
| `numericString()` | `z.string().regex(/^\d+$/)` | String of digits only |
| `dateRange()` | `z.object({ start, end })` | Start/end pair with start < end |
| `priceRange()` | `z.object({ min, max })` | Min/max pair with min ≤ max |
| `paginationParams()` | `z.object({ page, limit, offset })` | Pagination with defaults |
| `sortParams()` | `z.object({ sortBy, sortOrder })` | Sort column + asc/desc |
| `searchQuery()` | `z.string().trim().max(500)` | Sanitized search input |
| `fileUpload()` | `z.object({ name, size, type })` | File metadata checks |
| `jsonString()` | `z.string().refine(JSON.parse)` | Valid JSON string |
| `crontab()` | `z.string().regex(cronRegex)` | Standard cron expression |

---

## Database Schema

### validation_rule_sets Table

```typescript
export const validationRuleSets = pgTable('validation_rule_sets', {
  // ═══════════════════════════════════════════════════════════════════════════
  // PRIMARY KEY
  // ═══════════════════════════════════════════════════════════════════════════

  id: uuid('id').primaryKey().defaultRandom(),

  // ═══════════════════════════════════════════════════════════════════════════
  // IDENTIFICATION
  // ═══════════════════════════════════════════════════════════════════════════

  // Unique name within venture scope (e.g., 'user-registration', 'product-create')
  name: varchar('name', { length: 128 }).notNull(),

  // Entity type this rule set validates (e.g., 'user', 'product', 'order')
  entity: varchar('entity', { length: 64 }).notNull(),

  // Venture scope — null = global default, set for per-venture overrides
  ventureId: uuid('venture_id').references(() => ventures.id),

  // ═══════════════════════════════════════════════════════════════════════════
  // CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════════

  // Human-readable description
  description: varchar('description', { length: 500 }),

  // Whether ventures can create overrides of this rule set
  overridable: boolean('overridable').notNull().default(true),

  // Rule set version — incremented on every update
  version: integer('version').notNull().default(1),

  // Named groups for selective validation (JSON: { "create": ["rule-1", "rule-2"] })
  groups: jsonb('groups').notNull().default('{}'),

  // ═══════════════════════════════════════════════════════════════════════════
  // STATUS
  // ═══════════════════════════════════════════════════════════════════════════

  enabled: boolean('enabled').notNull().default(true),

  // ═══════════════════════════════════════════════════════════════════════════
  // TIMESTAMPS
  // ═══════════════════════════════════════════════════════════════════════════

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  // Unique rule set name per venture (null venture = global)
  uniqueIndex('validation_rule_sets_name_venture_unique')
    .on(table.name, table.ventureId),

  // Query by entity type
  index('validation_rule_sets_entity_idx')
    .on(table.entity),

  // Query by venture
  index('validation_rule_sets_venture_idx')
    .on(table.ventureId),
]);
```

### validation_rules Table

```typescript
export const validationRules = pgTable('validation_rules', {
  // ═══════════════════════════════════════════════════════════════════════════
  // PRIMARY KEY
  // ═══════════════════════════════════════════════════════════════════════════

  id: uuid('id').primaryKey().defaultRandom(),

  // ═══════════════════════════════════════════════════════════════════════════
  // PARENT RULE SET
  // ═══════════════════════════════════════════════════════════════════════════

  ruleSetId: uuid('rule_set_id')
    .references(() => validationRuleSets.id, { onDelete: 'cascade' })
    .notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // RULE DEFINITION
  // ═══════════════════════════════════════════════════════════════════════════

  // Human-readable rule name (e.g., 'email-required', 'password-strength')
  name: varchar('name', { length: 128 }).notNull(),

  // Target field path (dot-notation, e.g., 'address.zip')
  field: varchar('field', { length: 256 }),

  // Multiple target fields for cross-field rules (JSON array)
  fields: jsonb('fields'),

  // Rule type (e.g., 'required', 'email', 'min', 'custom')
  type: varchar('type', { length: 32 }).notNull(),

  // Rule-specific parameters (JSON: { "min": 5, "max": 100 })
  params: jsonb('params').notNull().default('{}'),

  // ═══════════════════════════════════════════════════════════════════════════
  // CONDITIONAL EXECUTION
  // ═══════════════════════════════════════════════════════════════════════════

  // Condition for when this rule applies (JSON: { field, operator, value })
  condition: jsonb('condition'),

  // ═══════════════════════════════════════════════════════════════════════════
  // ERROR MESSAGE
  // ═══════════════════════════════════════════════════════════════════════════

  // Error message template with {{param}} interpolation
  message: varchar('message', { length: 1000 }).notNull(),

  // Localized messages (JSON: { "fr-FR": "...", "es-ES": "..." })
  localizedMessages: jsonb('localized_messages'),

  // ═══════════════════════════════════════════════════════════════════════════
  // SEVERITY & GROUPING
  // ═══════════════════════════════════════════════════════════════════════════

  // 'error' = blocks submission, 'warning' = advisory, 'info' = informational
  severity: varchar('severity', { length: 16 }).notNull().default('error'),

  // Validation group (e.g., 'create', 'update', 'import', 'admin')
  group: varchar('group', { length: 64 }),

  // Execution priority — lower numbers run first (default: 0)
  priority: integer('priority').notNull().default(0),

  // ═══════════════════════════════════════════════════════════════════════════
  // ASYNC FLAG
  // ═══════════════════════════════════════════════════════════════════════════

  // Whether this rule requires async execution (DB/API check)
  isAsync: boolean('is_async').notNull().default(false),

  // Timeout for async execution in ms (null = use global default)
  timeoutMs: integer('timeout_ms'),

  // ═══════════════════════════════════════════════════════════════════════════
  // STATUS
  // ═══════════════════════════════════════════════════════════════════════════

  enabled: boolean('enabled').notNull().default(true),

  // ═══════════════════════════════════════════════════════════════════════════
  // TIMESTAMPS
  // ═══════════════════════════════════════════════════════════════════════════

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  // Unique rule name within a rule set
  uniqueIndex('validation_rules_name_ruleset_unique')
    .on(table.name, table.ruleSetId),

  // Query rules by rule set
  index('validation_rules_ruleset_idx')
    .on(table.ruleSetId),

  // Query rules by type
  index('validation_rules_type_idx')
    .on(table.type),

  // Query rules by group
  index('validation_rules_group_idx')
    .on(table.group),
]);
```

### validation_messages Table

```typescript
export const validationMessages = pgTable('validation_messages', {
  // ═══════════════════════════════════════════════════════════════════════════
  // PRIMARY KEY
  // ═══════════════════════════════════════════════════════════════════════════

  id: uuid('id').primaryKey().defaultRandom(),

  // ═══════════════════════════════════════════════════════════════════════════
  // SCOPE
  // ═══════════════════════════════════════════════════════════════════════════

  // Venture scope — null = global default
  ventureId: uuid('venture_id').references(() => ventures.id),

  // Locale code (e.g., 'en-US', 'fr-FR', 'de-DE')
  locale: varchar('locale', { length: 10 }).notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // MESSAGES
  // ═══════════════════════════════════════════════════════════════════════════

  // Message key → template mapping (JSON object)
  // {
  //   "required": "{{field}} is required",
  //   "email": "Please enter a valid email address",
  //   "min": "{{field}} must be at least {{min}}",
  //   "max": "{{field}} must be at most {{max}}",
  //   "unique": "{{field}} is already taken",
  //   ...
  // }
  messages: jsonb('messages').notNull(),

  // ═══════════════════════════════════════════════════════════════════════════
  // TIMESTAMPS
  // ═══════════════════════════════════════════════════════════════════════════

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  // One message set per locale per venture
  uniqueIndex('validation_messages_locale_venture_unique')
    .on(table.locale, table.ventureId),

  // Query by locale
  index('validation_messages_locale_idx')
    .on(table.locale),
]);
```

### validation_audit_log Table

```typescript
export const validationAuditLog = pgTable('validation_audit_log', {
  // ═══════════════════════════════════════════════════════════════════════════
  // PRIMARY KEY
  // ═══════════════════════════════════════════════════════════════════════════

  id: uuid('id').primaryKey().defaultRandom(),

  // ═══════════════════════════════════════════════════════════════════════════
  // SCOPE
  // ═══════════════════════════════════════════════════════════════════════════

  ventureId: uuid('venture_id').references(() => ventures.id).notNull(),

  // User who submitted the data (null for system/import operations)
  userId: uuid('user_id'),

  // ═══════════════════════════════════════════════════════════════════════════
  // VALIDATION CONTEXT
  // ═══════════════════════════════════════════════════════════════════════════

  // Entity type validated (e.g., 'user', 'product', 'order')
  entity: varchar('entity', { length: 64 }).notNull(),

  // Entity ID if updating existing record
  entityId: uuid('entity_id'),

  // Operation type
  operation: varchar('operation', { length: 16 }).notNull(), // 'create' | 'update' | 'import' | 'api'

  // Rule set name used
  ruleSetName: varchar('rule_set_name', { length: 128 }),

  // Validation group used
  validationGroup: varchar('validation_group', { length: 64 }),

  // ═══════════════════════════════════════════════════════════════════════════
  // RESULTS
  // ═══════════════════════════════════════════════════════════════════════════

  // Whether validation passed
  passed: boolean('passed').notNull(),

  // Number of errors
  errorCount: integer('error_count').notNull().default(0),

  // Number of warnings
  warningCount: integer('warning_count').notNull().default(0),

  // Error details (JSON array of { field, rule, message, code })
  // Sensitive values are redacted before storage
  errors: jsonb('errors').notNull().default('[]'),

  // Validation duration in milliseconds
  durationMs: integer('duration_ms'),

  // ═══════════════════════════════════════════════════════════════════════════
  // REQUEST CONTEXT
  // ═══════════════════════════════════════════════════════════════════════════

  // Client IP address (for rate limiting correlation)
  ipAddress: varchar('ip_address', { length: 45 }),

  // User agent string
  userAgent: varchar('user_agent', { length: 512 }),

  // Request trace ID for distributed tracing
  traceId: varchar('trace_id', { length: 64 }),

  // ═══════════════════════════════════════════════════════════════════════════
  // TIMESTAMPS
  // ═══════════════════════════════════════════════════════════════════════════

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  // Query by venture + date range
  index('validation_audit_venture_created_idx')
    .on(table.ventureId, table.createdAt),

  // Query by entity type
  index('validation_audit_entity_idx')
    .on(table.entity),

  // Query by user
  index('validation_audit_user_idx')
    .on(table.userId),

  // Query failures only
  index('validation_audit_passed_idx')
    .on(table.passed),

  // Distributed tracing
  index('validation_audit_trace_idx')
    .on(table.traceId),
]);
```

### password_policies Table

```typescript
export const passwordPolicies = pgTable('password_policies', {
  // ═══════════════════════════════════════════════════════════════════════════
  // PRIMARY KEY
  // ═══════════════════════════════════════════════════════════════════════════

  id: uuid('id').primaryKey().defaultRandom(),

  // ═══════════════════════════════════════════════════════════════════════════
  // SCOPE
  // ═══════════════════════════════════════════════════════════════════════════

  // Venture scope — null = global default
  ventureId: uuid('venture_id').references(() => ventures.id).unique(),

  // ═══════════════════════════════════════════════════════════════════════════
  // POLICY SETTINGS
  // ═══════════════════════════════════════════════════════════════════════════

  minLength: integer('min_length').notNull().default(12),
  maxLength: integer('max_length').notNull().default(128),
  requireUppercase: boolean('require_uppercase').notNull().default(true),
  requireLowercase: boolean('require_lowercase').notNull().default(true),
  requireNumber: boolean('require_number').notNull().default(true),
  requireSpecial: boolean('require_special').notNull().default(true),
  disallowCommon: boolean('disallow_common').notNull().default(true),
  disallowUserInfo: boolean('disallow_user_info').notNull().default(true),
  maxRepeatedChars: integer('max_repeated_chars').notNull().default(3),
  minCharacterClasses: integer('min_character_classes').notNull().default(3),

  // Custom blocklist words (JSON string array)
  blocklist: jsonb('blocklist').notNull().default('[]'),

  // ═══════════════════════════════════════════════════════════════════════════
  // TIMESTAMPS
  // ═══════════════════════════════════════════════════════════════════════════

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

---

## tRPC Router

```typescript
import { router, protectedProcedure, adminProcedure } from '@mcv/fabric/trpc';
import { z } from 'zod';

export const validationRouter = router({
  // ═══════════════════════════════════════════════════════════════════════════
  // RULE SET MANAGEMENT (Admin)
  // ═══════════════════════════════════════════════════════════════════════════

  /** List all rule sets for the venture (or global defaults) */
  listRuleSets: protectedProcedure
    .input(z.object({
      entity: z.string().optional(),
      enabled: z.boolean().optional(),
      includeGlobal: z.boolean().default(true),
    }))
    .query(async ({ input, ctx }) => {
      return listRuleSets(ctx.ventureId, input);
    }),

  /** Get a single rule set by name */
  getRuleSet: protectedProcedure
    .input(z.object({ name: z.string() }))
    .query(async ({ input, ctx }) => {
      return getRuleSet(input.name, ctx.ventureId);
    }),

  /** Create a venture-specific rule set override */
  createRuleSet: adminProcedure
    .input(z.object({
      name: z.string().min(1).max(128),
      entity: z.string().min(1).max(64),
      description: z.string().max(500).optional(),
      rules: z.array(ruleDefinitionSchema),
      groups: z.record(z.array(z.string())).optional(),
      overridable: z.boolean().default(true),
    }))
    .mutation(async ({ input, ctx }) => {
      return createRuleSet({ ...input, ventureId: ctx.ventureId });
    }),

  /** Update rule set configuration */
  updateRuleSet: adminProcedure
    .input(z.object({
      name: z.string(),
      rules: z.array(ruleDefinitionSchema).optional(),
      groups: z.record(z.array(z.string())).optional(),
      enabled: z.boolean().optional(),
      description: z.string().max(500).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return updateRuleSet(input.name, ctx.ventureId, input);
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // VALIDATION OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /** Validate data against a named rule set */
  validate: protectedProcedure
    .input(z.object({
      ruleSetName: z.string(),
      data: z.record(z.unknown()),
      group: z.string().optional(),
      abortEarly: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return validateEntity(input.data, input.ruleSetName, {
        ventureId: ctx.ventureId,
        group: input.group,
        abortEarly: input.abortEarly,
      });
    }),

  /** Validate a single field (for real-time form validation) */
  validateField: protectedProcedure
    .input(z.object({
      ruleSetName: z.string(),
      field: z.string(),
      value: z.unknown(),
      context: z.record(z.unknown()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return validateField(input.field, input.value, input.ruleSetName, {
        ventureId: ctx.ventureId,
        context: input.context,
      });
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // ERROR MESSAGES (Admin)
  // ═══════════════════════════════════════════════════════════════════════════

  /** Get validation messages for a locale */
  getMessages: protectedProcedure
    .input(z.object({ locale: z.string() }))
    .query(async ({ input, ctx }) => {
      return getValidationMessages(input.locale, ctx.ventureId);
    }),

  /** Set validation messages for a locale */
  setMessages: adminProcedure
    .input(z.object({
      locale: z.string().min(2).max(10),
      messages: z.record(z.string()),
    }))
    .mutation(async ({ input, ctx }) => {
      return setValidationMessages(input.locale, input.messages, ctx.ventureId);
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // PASSWORD POLICY (Admin)
  // ═══════════════════════════════════════════════════════════════════════════

  /** Get password policy for the venture (or global default) */
  getPasswordPolicy: protectedProcedure
    .query(async ({ ctx }) => {
      return getPasswordPolicy(ctx.ventureId);
    }),

  /** Update password policy */
  updatePasswordPolicy: adminProcedure
    .input(passwordPolicySchema)
    .mutation(async ({ input, ctx }) => {
      return updatePasswordPolicy(ctx.ventureId, input);
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // AUDIT LOG (Admin)
  // ═══════════════════════════════════════════════════════════════════════════

  /** Query validation audit log */
  getAuditLog: adminProcedure
    .input(z.object({
      entity: z.string().optional(),
      passed: z.boolean().optional(),
      userId: z.string().uuid().optional(),
      dateFrom: z.coerce.date().optional(),
      dateTo: z.coerce.date().optional(),
      limit: z.number().int().min(1).max(500).default(50),
      offset: z.number().int().min(0).default(0),
    }))
    .query(async ({ input, ctx }) => {
      return getValidationAuditLog(ctx.ventureId, input);
    }),
});
```

---

## Usage Examples

### Example 1: Basic Zod Schema

```typescript
import { z, createSchema, email, password } from '@mcv/shared/validation';

// ═══════════════════════════════════════════════════════════════════════════════
// Define a registration schema — runs identically on client and server
// ═══════════════════════════════════════════════════════════════════════════════

const registrationSchema = createSchema({
  email: email(),
  password: password({ minLength: 12, requireSpecial: true }),
  name: z.string().min(2).max(100).trim(),
  age: z.number().int().min(18).max(120).optional(),
  role: z.enum(['admin', 'user', 'guest']),
  acceptedTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms' }),
  }),
});

// Type-safe validation — result is fully typed
const result = registrationSchema.safeParse(input);
if (!result.success) {
  const flat = result.error.flatten();
  console.log(flat.fieldErrors);
  // { email: ['Invalid email'], password: ['Must contain special character'] }
}

// TypeScript type automatically inferred from schema
type Registration = z.infer<typeof registrationSchema>;
// {
//   email: string;
//   password: string;
//   name: string;
//   age?: number;
//   role: 'admin' | 'user' | 'guest';
//   acceptedTerms: true;
// }
```

### Example 2: Common Validators with Configuration

```typescript
import { email, phone, url, slug, password, postalCode } from '@mcv/shared/validation';

// ═══════════════════════════════════════════════════════════════════════════════
// Pre-built validators with extensive configuration options
// ═══════════════════════════════════════════════════════════════════════════════

// Email with custom domain restriction
const corporateEmail = email().refine(
  (val) => val.endsWith('@acme.com'),
  { message: 'Must be an @acme.com email' }
);

// Phone with country format
const usPhone = phone({ country: 'US' });    // Validates US format: (555) 123-4567
const caPhone = phone({ country: 'CA' });    // Validates Canadian format
const intlPhone = phone({ format: 'e164' }); // E.164 international: +15551234567

// URL with protocol restrictions
const secureUrl = url({ protocols: ['https'] });
const webUrl = url({ protocols: ['http', 'https'] });

// Password with enterprise policy
const enterprisePassword = password({
  minLength: 16,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
  disallowCommon: true,
  maxRepeatedChars: 3,
});

// Postal code by country — supports 50+ formats
const usZip = postalCode({ country: 'US' });     // 12345 or 12345-6789
const caPostal = postalCode({ country: 'CA' });   // K1A 0B1
const ukPostcode = postalCode({ country: 'GB' }); // SW1A 1AA
const dePostcode = postalCode({ country: 'DE' }); // 10115
```

### Example 3: Cross-Field Validation

```typescript
import { z, createSchema } from '@mcv/shared/validation';

// ═══════════════════════════════════════════════════════════════════════════════
// Validate relationships between fields with precise error paths
// ═══════════════════════════════════════════════════════════════════════════════

const eventSchema = z.object({
  name: z.string().min(1).max(200),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  earlyBirdDeadline: z.coerce.date().optional(),
  minAttendees: z.number().int().min(1),
  maxAttendees: z.number().int().min(1),
  registrationFee: z.number().min(0),
  earlyBirdFee: z.number().min(0).optional(),
}).refine(
  (data) => data.endDate > data.startDate,
  { message: 'End date must be after start date', path: ['endDate'] }
).refine(
  (data) => data.maxAttendees >= data.minAttendees,
  { message: 'Max attendees must be ≥ min attendees', path: ['maxAttendees'] }
).refine(
  (data) => !data.earlyBirdDeadline || data.earlyBirdDeadline < data.startDate,
  { message: 'Early bird deadline must be before event start', path: ['earlyBirdDeadline'] }
).refine(
  (data) => !data.earlyBirdFee || data.earlyBirdFee < data.registrationFee,
  { message: 'Early bird fee must be less than regular fee', path: ['earlyBirdFee'] }
);

// All four cross-field checks run independently — user sees all errors at once
const result = eventSchema.safeParse({
  name: 'MCV Summit 2026',
  startDate: '2026-06-15',
  endDate: '2026-06-10',    // ← Error: before start
  minAttendees: 50,
  maxAttendees: 20,          // ← Error: less than min
  registrationFee: 100,
  earlyBirdFee: 150,         // ← Error: more than regular
});
// result.error.flatten().fieldErrors:
// {
//   endDate: ['End date must be after start date'],
//   maxAttendees: ['Max attendees must be ≥ min attendees'],
//   earlyBirdFee: ['Early bird fee must be less than regular fee'],
// }
```

### Example 4: Business Rule Validator

```typescript
import { createValidator, defineRule, conditionalRule } from '@mcv/shared/validation';

// ═══════════════════════════════════════════════════════════════════════════════
// Domain-specific business rules with conditions and severity levels
// ═══════════════════════════════════════════════════════════════════════════════

const orderValidator = createValidator({
  entity: 'order',
  rules: [
    defineRule({
      name: 'minimum-order-amount',
      field: 'subtotal',
      type: 'min',
      params: { min: 500 }, // $5.00 minimum in cents
      message: 'Order must be at least $5.00',
      severity: 'error',
    }),

    defineRule({
      name: 'shipping-address-required',
      fields: ['shippingAddress'],
      type: 'required',
      condition: { field: 'hasPhysicalItems', operator: 'eq', value: true },
      message: 'Shipping address required for physical items',
      severity: 'error',
    }),

    defineRule({
      name: 'large-order-warning',
      field: 'subtotal',
      type: 'custom',
      params: {
        fn: (value: number) => value < 100000, // $1,000
      },
      message: 'Large orders may require manager approval',
      severity: 'warning',
    }),

    conditionalRule({
      name: 'us-state-required',
      condition: { field: 'shippingAddress.country', operator: 'eq', value: 'US' },
      rule: defineRule({
        field: 'shippingAddress.state',
        type: 'required',
        message: 'State is required for US addresses',
      }),
    }),

    defineRule({
      name: 'coupon-format',
      field: 'couponCode',
      type: 'pattern',
      params: { pattern: '^[A-Z0-9]{4,20}$' },
      message: 'Invalid coupon code format',
      severity: 'error',
      condition: { field: 'couponCode', operator: 'exists' },
    }),
  ],
});

// Run validation — returns errors AND warnings
const result = await orderValidator.validate(orderData);
if (!result.valid) {
  console.log('Errors:', result.errors);     // Blocking issues
  console.log('Warnings:', result.warnings); // Advisory messages
}
```

### Example 5: Async Validation (Uniqueness Checks)

```typescript
import { z, validateAsync } from '@mcv/shared/validation';

// ═══════════════════════════════════════════════════════════════════════════════
// Database-backed uniqueness and existence checks
// ═══════════════════════════════════════════════════════════════════════════════

const usernameSchema = z.string()
  .min(3).max(30)
  .regex(/^[a-zA-Z0-9_-]+$/, 'Only letters, numbers, hyphens, underscores')
  .refine(
    async (username) => {
      const exists = await db.query.users.findFirst({
        where: eq(users.username, username.toLowerCase()),
      });
      return !exists;
    },
    { message: 'Username already taken' }
  );

// Email uniqueness check
const emailSchema = z.string()
  .email()
  .refine(
    async (email) => {
      const exists = await db.query.users.findFirst({
        where: eq(users.email, email.toLowerCase()),
      });
      return !exists;
    },
    { message: 'Email already registered' }
  );

// Product SKU existence check (reference must exist)
const skuReferenceSchema = z.string()
  .refine(
    async (sku) => {
      const product = await db.query.products.findFirst({
        where: eq(products.sku, sku),
      });
      return !!product; // Must exist
    },
    { message: 'Product SKU not found' }
  );

// Validate with async — awaits all async refinements
const result = await usernameSchema.parseAsync('newuser');
```

### Example 6: React Hook Form Integration

```tsx
import { useFormValidation, zodResolver } from '@mcv/shared/validation';
import { useForm } from 'react-hook-form';
import { z } from '@mcv/shared/validation';

// ═══════════════════════════════════════════════════════════════════════════════
// Type-safe form with Zod validation and async username check
// ═══════════════════════════════════════════════════════════════════════════════

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
  confirmPassword: z.string(),
  name: z.string().min(2).max(100),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords must match',
  path: ['confirmPassword'],
});

type SignupForm = z.infer<typeof signupSchema>;

function SignupPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    mode: 'onBlur', // Validate on blur for better UX
  });

  const onSubmit = async (data: SignupForm) => {
    await api.auth.register.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>Email</label>
        <input {...register('email')} type="email" />
        {errors.email && <span className="error">{errors.email.message}</span>}
      </div>

      <div>
        <label>Password</label>
        <input {...register('password')} type="password" />
        {errors.password && <span className="error">{errors.password.message}</span>}
      </div>

      <div>
        <label>Confirm Password</label>
        <input {...register('confirmPassword')} type="password" />
        {errors.confirmPassword && (
          <span className="error">{errors.confirmPassword.message}</span>
        )}
      </div>

      <div>
        <label>Full Name</label>
        <input {...register('name')} />
        {errors.name && <span className="error">{errors.name.message}</span>}
      </div>

      <button type="submit" disabled={isSubmitting}>Sign Up</button>
    </form>
  );
}
```

### Example 7: Validation Groups (Create vs Update)

```typescript
import { defineRuleSet, validateEntity } from '@mcv/shared/validation';

// ═══════════════════════════════════════════════════════════════════════════════
// Different rules apply for create vs update vs import operations
// ═══════════════════════════════════════════════════════════════════════════════

const productRuleSet = defineRuleSet({
  name: 'product',
  entity: 'product',
  rules: [
    // CREATE-only rules — only enforced on new records
    { name: 'name-required', field: 'name', type: 'required',
      message: 'Name is required', severity: 'error', group: 'create' },
    { name: 'sku-required', field: 'sku', type: 'required',
      message: 'SKU is required', severity: 'error', group: 'create' },
    { name: 'sku-unique', field: 'sku', type: 'unique',
      message: 'SKU already exists', severity: 'error', group: 'create', async: true },

    // ALWAYS-applied rules — enforced on both create and update
    { name: 'name-length', field: 'name', type: 'length',
      params: { min: 2, max: 200 }, message: 'Name must be 2-200 chars', severity: 'error' },
    { name: 'price-positive', field: 'price', type: 'min',
      params: { min: 0 }, message: 'Price must be ≥ 0', severity: 'error' },
    { name: 'stock-integer', field: 'stock', type: 'custom',
      params: { fn: (v: number) => Number.isInteger(v) },
      message: 'Stock must be a whole number', severity: 'error' },

    // UPDATE-only rules
    { name: 'sku-immutable', field: 'sku', type: 'immutable',
      message: 'SKU cannot be changed after creation', severity: 'error', group: 'update' },

    // IMPORT-only rules (more lenient)
    { name: 'import-name', field: 'name', type: 'required',
      message: 'Name is required for import', severity: 'error', group: 'import' },
  ],
});

// Validate for creation — includes 'create' group + ungrouped rules
const createResult = await validateEntity(productData, productRuleSet, {
  group: 'create',
});

// Validate for update — includes 'update' group + ungrouped rules
const updateResult = await validateEntity(productData, productRuleSet, {
  group: 'update',
  existingData: existingProduct, // For immutability checks
});

// Validate for import — includes 'import' group + ungrouped rules
const importResult = await validateEntity(productData, productRuleSet, {
  group: 'import',
});
```

### Example 8: Composing Validators from Multiple Domains

```typescript
import { composeValidators, createValidator } from '@mcv/shared/validation';

// ═══════════════════════════════════════════════════════════════════════════════
// Combine validators from different domains into a unified pipeline
// ═══════════════════════════════════════════════════════════════════════════════

const addressValidator = createValidator({
  entity: 'address',
  rules: [
    { name: 'street', field: 'street', type: 'required', message: 'Street required' },
    { name: 'city', field: 'city', type: 'required', message: 'City required' },
    { name: 'country', field: 'country', type: 'required', message: 'Country required' },
    { name: 'country-code', field: 'country', type: 'pattern',
      params: { pattern: '^[A-Z]{2}$' }, message: 'Must be ISO 3166-1 alpha-2' },
  ],
});

const paymentValidator = createValidator({
  entity: 'payment',
  rules: [
    { name: 'method', field: 'method', type: 'enum',
      params: { values: ['card', 'bank', 'paypal'] }, message: 'Invalid payment method' },
    { name: 'amount', field: 'amount', type: 'min',
      params: { min: 1 }, message: 'Amount must be positive' },
  ],
});

const contactValidator = createValidator({
  entity: 'contact',
  rules: [
    { name: 'email', field: 'email', type: 'email', message: 'Valid email required' },
    { name: 'phone', field: 'phone', type: 'phone',
      params: { format: 'e164' }, message: 'Invalid phone', severity: 'warning' },
  ],
});

// Compose into a single checkout validator with path prefixing
const checkoutValidator = composeValidators([
  { validator: addressValidator, prefix: 'shippingAddress' },
  { validator: addressValidator, prefix: 'billingAddress' },
  { validator: paymentValidator, prefix: 'payment' },
  { validator: contactValidator, prefix: 'contact' },
]);

const result = await checkoutValidator.validate(checkoutData);
// Errors are prefixed: 'shippingAddress.street', 'payment.method', 'contact.email', etc.
```

### Example 9: Sanitization Pipeline

```typescript
import {
  sanitize, sanitizeHtml, normalizeEmail, normalizePhone,
  normalizeWhitespace, stripNullBytes,
} from '@mcv/shared/validation';

// ═══════════════════════════════════════════════════════════════════════════════
// Clean and normalize input BEFORE validation
// ═══════════════════════════════════════════════════════════════════════════════

// Basic sanitization — trim, strip HTML, normalize whitespace
const cleaned = sanitize(rawInput, {
  trim: true,
  stripHtml: true,
  normalizeWhitespace: true,
  maxLength: 10000,
  unicodeNormalization: 'NFC',
  stripNullBytes: true,
});

// Allow specific safe HTML (for rich text fields)
const richText = sanitizeHtml(rawHtml, {
  allowedTags: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'h2', 'h3'],
  allowedAttributes: { a: ['href', 'title'] },
});

// Normalize email: lowercase, remove dots from gmail, strip +tags
const email = normalizeEmail('John.Doe+tag@Gmail.com');
// → "johndoe@gmail.com"

// Normalize phone to E.164 international format
const phone = normalizePhone('(555) 123-4567', 'US');
// → "+15551234567"

// Strip null bytes (security: prevent null byte injection)
const safe = stripNullBytes('hello\x00world');
// → "helloworld"

// Normalize whitespace (collapse multiple spaces, trim)
const normalized = normalizeWhitespace('  hello   world  \n\n  foo  ');
// → "hello world\nfoo"
```

### Example 10: Custom Error Messages with i18n

```typescript
import {
  setValidationMessages, getValidationMessages,
  localizeErrors, interpolateMessage,
} from '@mcv/shared/validation';

// ═══════════════════════════════════════════════════════════════════════════════
// Localized error messages with interpolation
// ═══════════════════════════════════════════════════════════════════════════════

// Set messages for English (global default)
setValidationMessages('en-US', {
  required: '{{field}} is required',
  email: 'Please enter a valid email address',
  min: '{{field}} must be at least {{min}}',
  max: '{{field}} must be at most {{max}}',
  length: '{{field}} must be between {{min}} and {{max}} characters',
  unique: '{{field}} is already taken',
  pattern: '{{field}} format is invalid',
  password_min_length: 'Password must be at least {{minLength}} characters',
  password_require_special: 'Password must contain at least one special character',
});

// Set messages for French
setValidationMessages('fr-FR', {
  required: '{{field}} est requis',
  email: 'Veuillez saisir une adresse e-mail valide',
  min: '{{field}} doit être au moins {{min}}',
  max: '{{field}} doit être au maximum {{max}}',
  length: '{{field}} doit comporter entre {{min}} et {{max}} caractères',
  unique: '{{field}} est déjà pris',
  pattern: 'Le format de {{field}} est invalide',
});

// Set messages for Spanish (venture-specific override)
setValidationMessages('es-ES', {
  required: '{{field}} es obligatorio',
  email: 'Ingrese una dirección de correo electrónico válida',
}, 'betedge-venture-uuid'); // Venture-specific

// Localize validation errors to user's locale
const result = await validateEntity(data, rules);
const localized = localizeErrors(result.errors, 'fr-FR');
// Error messages are now in French with interpolated field names

// Manual interpolation for custom scenarios
const msg = interpolateMessage('{{field}} must be between {{min}} and {{max}}', {
  field: 'Name',
  min: 2,
  max: 100,
});
// → "Name must be between 2 and 100"
```

### Example 11: tRPC Input Validation

```typescript
import { z, email, password, slug, uuid } from '@mcv/shared/validation';
import { publicProcedure, protectedProcedure, router } from '@mcv/api/trpc';

// ═══════════════════════════════════════════════════════════════════════════════
// Server-side validation in tRPC procedures — single source of truth
// ═══════════════════════════════════════════════════════════════════════════════

export const authRouter = router({
  register: publicProcedure
    .input(z.object({
      email: email(),
      password: password({ minLength: 12 }),
      name: z.string().min(2).max(100).trim(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Input is fully validated and typed — no further checks needed
      const user = await createUser(input);
      return { user };
    }),

  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().min(2).max(100).trim().optional(),
      bio: z.string().max(500).optional(),
      website: z.string().url().optional().or(z.literal('')),
      phone: z.string().optional().pipe(
        z.string().refine(
          (val) => !val || /^\+?[1-9]\d{1,14}$/.test(val),
          { message: 'Invalid phone number' }
        )
      ),
      avatar: z.string().url().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return await updateUser(ctx.userId, input);
    }),
});

export const productRouter = router({
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(2).max(200).trim(),
      slug: slug(),
      description: z.string().max(10000).optional(),
      price: z.number().int().min(0),          // Cents
      currency: z.string().length(3),           // ISO 4217
      sku: z.string().min(1).max(50),
      categoryId: z.string().uuid(),
      tags: z.array(z.string().max(50)).max(20).optional(),
      metadata: z.record(z.unknown()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return await createProduct(ctx.ventureId, input);
    }),
});
```

### Example 12: Bulk Import Validation

```typescript
import { createValidator, validateEntity } from '@mcv/shared/validation';
import type { BulkValidationResult } from '@mcv/shared/validation';

// ═══════════════════════════════════════════════════════════════════════════════
// Row-by-row validation for CSV imports with aggregate reporting
// ═══════════════════════════════════════════════════════════════════════════════

const customerImportValidator = createValidator({
  entity: 'customer-import',
  rules: [
    { name: 'email-required', field: 'email', type: 'required', message: 'Email required' },
    { name: 'email-format', field: 'email', type: 'email', message: 'Invalid email format' },
    { name: 'email-unique', field: 'email', type: 'unique', message: 'Duplicate email in system',
      async: true },
    { name: 'name-required', field: 'name', type: 'required', message: 'Name required' },
    { name: 'name-length', field: 'name', type: 'length', params: { min: 1, max: 200 },
      message: 'Name must be 1-200 characters' },
    { name: 'phone-format', field: 'phone', type: 'phone', params: { format: 'e164' },
      message: 'Invalid phone format (expected E.164)', severity: 'warning' },
    { name: 'country-code', field: 'country', type: 'pattern',
      params: { pattern: '^[A-Z]{2}$' }, message: 'Invalid country code' },
  ],
});

// Validate entire import batch with progress tracking
async function validateImport(rows: Record<string, unknown>[]): Promise<BulkValidationResult> {
  const startTime = Date.now();
  const failures: BulkValidationResult['failures'] = [];
  const errorSummary: Record<string, number> = {};
  let validCount = 0;
  let warningCount = 0;

  // Batch uniqueness checks for performance
  const emails = rows.map(r => r.email as string).filter(Boolean);
  const existingEmails = await db.query.customers.findMany({
    where: inArray(customers.email, emails),
    columns: { email: true },
  });
  const existingEmailSet = new Set(existingEmails.map(e => e.email));

  for (let i = 0; i < rows.length; i++) {
    const result = await customerImportValidator.validate(rows[i], {
      skipAsync: true, // We pre-fetched uniqueness data above
      context: { existingEmails: existingEmailSet },
    });

    if (!result.valid) {
      failures.push({ row: i + 1, data: rows[i], result });
      result.errors.forEach(e => {
        errorSummary[e.rule] = (errorSummary[e.rule] || 0) + 1;
      });
    } else if (result.warnings.length > 0) {
      warningCount++;
    } else {
      validCount++;
    }
  }

  const duration = Date.now() - startTime;
  return {
    totalRecords: rows.length,
    validCount,
    errorCount: failures.length,
    warningCount,
    failures,
    errorSummary,
    duration,
    throughput: Math.round((rows.length / duration) * 1000),
  };
}

const importResult = await validateImport(csvRows);
console.log(`${importResult.validCount}/${importResult.totalRecords} valid`);
console.log(`${importResult.errorCount} errors, ${importResult.warningCount} warnings`);
console.log(`Throughput: ${importResult.throughput} records/sec`);
console.log('Error summary:', importResult.errorSummary);
// { 'email-format': 12, 'name-required': 3, 'country-code': 7 }
```

### Example 13: Schema Extension and Reuse

```typescript
import { z, extendSchema, pickSchema, partialSchema, mergeSchemas } from '@mcv/shared/validation';

// ═══════════════════════════════════════════════════════════════════════════════
// Build schemas incrementally from reusable parts
// ═══════════════════════════════════════════════════════════════════════════════

// Base user schema — shared across all user operations
const baseUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  role: z.enum(['admin', 'user', 'guest']),
  avatar: z.string().url().optional(),
});

// Extend for admin users (adds fields)
const adminUserSchema = extendSchema(baseUserSchema, {
  department: z.string(),
  permissions: z.array(z.string()),
  managedVentures: z.array(z.string().uuid()),
});

// Pick subset for login (only email)
const loginSchema = pickSchema(baseUserSchema, ['email']).extend({
  password: z.string().min(1),
});

// Make everything optional for PATCH updates
const updateUserSchema = partialSchema(baseUserSchema);

// Merge two schemas into one
const userWithAddressSchema = mergeSchemas(baseUserSchema, z.object({
  address: z.object({
    street: z.string(),
    city: z.string(),
    country: z.string().length(2),
  }).optional(),
}));

// Type inference works on all derived schemas
type AdminUser = z.infer<typeof adminUserSchema>;
type LoginInput = z.infer<typeof loginSchema>;
type UserUpdate = z.infer<typeof updateUserSchema>;
```

### Example 14: Coercion and Transforms

```typescript
import { z } from '@mcv/shared/validation';

// ═══════════════════════════════════════════════════════════════════════════════
// Transform raw string input (query params, form data) into typed values
// ═══════════════════════════════════════════════════════════════════════════════

const querySchema = z.object({
  // String "123" → number 123
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),

  // String "true" → boolean true
  includeInactive: z.coerce.boolean().default(false),

  // String "2026-02-08" → Date object
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),

  // Comma-separated string → array
  tags: z.string()
    .transform(s => s.split(',').map(t => t.trim()).filter(Boolean))
    .optional(),

  // Lowercase, trim, and cap length
  search: z.string().trim().toLowerCase().max(500).optional(),

  // Enum with default
  status: z.enum(['active', 'inactive', 'archived']).default('active'),

  // Sort with coercion
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
}).refine(
  (data) => !data.startDate || !data.endDate || data.endDate >= data.startDate,
  { message: 'endDate must be after startDate', path: ['endDate'] }
);

// Works with raw query strings
const parsed = querySchema.parse({
  page: '3',
  limit: '50',
  includeInactive: 'true',
  tags: 'electronics, gadgets, sale',
  search: '  LAPTOP  ',
});
// Result: {
//   page: 3,
//   limit: 50,
//   includeInactive: true,
//   tags: ['electronics', 'gadgets', 'sale'],
//   search: 'laptop',
//   status: 'active',
//   sortOrder: 'desc'
// }
```

### Example 15: Entity-Specific Commerce Schemas

```typescript
import { z, email, currencyCode, countryCode, uuid } from '@mcv/shared/validation';

// ═══════════════════════════════════════════════════════════════════════════════
// Domain schemas used across multiple packages in MCV Commerce
// ═══════════════════════════════════════════════════════════════════════════════

export const addressSchema = z.object({
  street1: z.string().min(1).max(200),
  street2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().max(100).optional(),
  postalCode: z.string().min(1).max(20),
  country: countryCode(),
});

export const moneySchema = z.object({
  amount: z.number().int(), // Stored in minor units (cents)
  currency: currencyCode(),
}).refine(
  (data) => data.amount >= 0,
  { message: 'Amount cannot be negative', path: ['amount'] }
);

export const lineItemSchema = z.object({
  productId: uuid(),
  name: z.string().min(1).max(200),
  quantity: z.number().int().min(1).max(9999),
  unitPrice: moneySchema,
  taxRate: z.number().min(0).max(1).optional(),
  discount: z.number().min(0).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const orderSchema = z.object({
  customerId: uuid(),
  items: z.array(lineItemSchema).min(1).max(500),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  currency: currencyCode(),
  notes: z.string().max(2000).optional(),
  couponCode: z.string().max(50).optional(),
}).refine(
  (data) => {
    // All line items must use the order's currency
    return data.items.every(item => item.unitPrice.currency === data.currency);
  },
  { message: 'All line items must use the order currency', path: ['items'] }
);

// Type-safe — use across tRPC, forms, and services
type Order = z.infer<typeof orderSchema>;
type LineItem = z.infer<typeof lineItemSchema>;
type Money = z.infer<typeof moneySchema>;
type Address = z.infer<typeof addressSchema>;
```

---

## Error Codes

Every validation error includes a machine-readable error code for programmatic handling.

| Code | Rule Type | Description | HTTP Status |
|------|-----------|-------------|-------------|
| `VAL_REQUIRED` | required | Required field is missing or empty | 400 |
| `VAL_TYPE_STRING` | string | Expected string type | 400 |
| `VAL_TYPE_NUMBER` | number | Expected number type | 400 |
| `VAL_TYPE_BOOLEAN` | boolean | Expected boolean type | 400 |
| `VAL_TYPE_DATE` | date | Expected valid date | 400 |
| `VAL_TYPE_ARRAY` | array | Expected array type | 400 |
| `VAL_TYPE_OBJECT` | object | Expected object type | 400 |
| `VAL_FORMAT_EMAIL` | email | Invalid email format | 400 |
| `VAL_FORMAT_URL` | url | Invalid URL format | 400 |
| `VAL_FORMAT_PHONE` | phone | Invalid phone number | 400 |
| `VAL_FORMAT_UUID` | uuid | Invalid UUID format | 400 |
| `VAL_FORMAT_SLUG` | slug | Invalid slug format | 400 |
| `VAL_FORMAT_IP` | ipAddress | Invalid IP address | 400 |
| `VAL_FORMAT_COLOR` | hexColor | Invalid hex color | 400 |
| `VAL_FORMAT_POSTAL` | postalCode | Invalid postal code | 400 |
| `VAL_FORMAT_CC` | creditCard | Invalid credit card (Luhn) | 400 |
| `VAL_FORMAT_IBAN` | iban | Invalid IBAN | 400 |
| `VAL_FORMAT_VAT` | vatNumber | Invalid VAT number | 400 |
| `VAL_BOUNDS_MIN` | min | Below minimum value/length | 400 |
| `VAL_BOUNDS_MAX` | max | Above maximum value/length | 400 |
| `VAL_BOUNDS_RANGE` | range | Outside allowed range | 400 |
| `VAL_BOUNDS_LENGTH` | length | Invalid length | 400 |
| `VAL_PATTERN` | pattern | Regex pattern mismatch | 400 |
| `VAL_ENUM` | enum | Value not in allowed set | 400 |
| `VAL_ONE_OF` | oneOf | No matching sub-schema | 400 |
| `VAL_NONE_OF` | noneOf | Value in blocked set | 400 |
| `VAL_UNIQUE` | unique | Value already exists in DB | 409 |
| `VAL_EXISTS` | exists | Referenced record not found | 404 |
| `VAL_IMMUTABLE` | immutable | Attempted change to immutable field | 400 |
| `VAL_CUSTOM` | custom | Custom rule failed | 400 |
| `VAL_ASYNC` | async | Async validation failed | 400 |
| `VAL_ASYNC_TIMEOUT` | async | Async validation timed out | 408 |
| `VAL_CROSS_FIELD` | refine | Cross-field validation failed | 400 |
| `VAL_PWD_LENGTH` | password | Password too short/long | 400 |
| `VAL_PWD_UPPERCASE` | password | Missing uppercase character | 400 |
| `VAL_PWD_LOWERCASE` | password | Missing lowercase character | 400 |
| `VAL_PWD_NUMBER` | password | Missing numeric character | 400 |
| `VAL_PWD_SPECIAL` | password | Missing special character | 400 |
| `VAL_PWD_COMMON` | password | Password in common blocklist | 400 |
| `VAL_PWD_USER_INFO` | password | Password contains user info | 400 |
| `VAL_PWD_REPEATED` | password | Too many repeated characters | 400 |
| `VAL_SANITIZE_XSS` | sanitize | XSS attempt detected and stripped | 400 |
| `VAL_SANITIZE_SQL` | sanitize | SQL injection pattern detected | 400 |
| `VAL_SANITIZE_PATH` | sanitize | Path traversal pattern detected | 400 |
| `VAL_RATE_LIMITED` | system | Too many validation requests | 429 |
| `VAL_RULE_SET_NOT_FOUND` | system | Referenced rule set does not exist | 404 |
| `VAL_INTERNAL` | system | Internal validation engine error | 500 |

### Error Code Usage

```typescript
import { VALIDATION_ERROR_CODES } from '@mcv/shared/validation';

// Programmatic error handling by code
const result = await validateEntity(data, ruleSet);
if (!result.valid) {
  for (const error of result.errors) {
    switch (error.code) {
      case 'VAL_UNIQUE':
        // Show "already taken" UI with suggestion
        showAlternatives(error.field, error.value);
        break;
      case 'VAL_EXISTS':
        // Referenced entity not found — refresh options
        refreshReferenceData(error.field);
        break;
      case 'VAL_ASYNC_TIMEOUT':
        // Retry async validation
        retryValidation(error.field);
        break;
      default:
        // Display error message
        showFieldError(error.field, error.message);
    }
  }
}
```

---

## Performance Considerations

### Latency Targets

| Operation | Target | P99 | Measurement Point |
|-----------|--------|-----|-------------------|
| Simple schema validation (5-10 fields) | < 0.5ms | < 2ms | `schema.safeParse()` return |
| Complex schema (20+ fields, nested) | < 3ms | < 10ms | `schema.safeParse()` return |
| Cross-field validation (5 refinements) | < 1ms | < 3ms | `.refine()` chain completion |
| Business rule evaluation (10 rules) | < 2ms | < 5ms | `validator.validate()` return |
| Single async validation (DB lookup) | < 30ms | < 100ms | Individual `refine` async |
| Bulk validation (1,000 rows) | < 400ms | < 1.5s | Full batch processed |
| Bulk validation (10,000 rows) | < 3s | < 8s | Full batch processed |
| Form validation (client-side) | < 3ms | < 8ms | React re-render triggered |
| Sanitization (single field) | < 0.1ms | < 0.5ms | `sanitize()` return |
| Message interpolation | < 0.05ms | < 0.2ms | `interpolateMessage()` return |

### Optimization Strategies

1. **Schema compilation caching** — Zod schemas are JavaScript objects compiled once at module load; zero per-validation overhead
2. **Abort early** — `abortEarly: true` stops at first error per field for real-time validation; reduces work by 60-80%
3. **Lazy async** — Async validations only execute after all sync checks pass; avoids unnecessary DB queries
4. **Batch uniqueness** — For bulk imports, pre-fetch all existing values in one query instead of N individual lookups
5. **Client-first strategy** — Run Zod schema on client for instant feedback; server re-validates + runs business rules
6. **Partial validation** — On update, only validate fields that actually changed (diff against `existingData`)
7. **Rule priority ordering** — Cheap rules run first; expensive rules (regex, custom functions) run last
8. **Schema tree-shaking** — Import individual validators (`email`, `phone`) not the entire module

### Resource Limits

| Resource | Limit | Rationale |
|----------|-------|-----------|
| Max schema nesting depth | 10 levels | Prevent stack overflow on deep validation |
| Max array items per field | 10,000 | Memory safety for large arrays |
| Max async validations per request | 20 | Prevent connection pool exhaustion |
| Max custom rule execution time | 1,000ms | Prevent blocking event loop |
| Max error messages per result | 500 | Prevent memory exhaustion on adversarial input |
| Max bulk validation batch | 10,000 rows | Memory and timeout safety |
| Max input string length | 100,000 chars | Prevent ReDoS on long strings |
| Max regex pattern length | 1,000 chars | Prevent complex regex compilation |
| Max message template size | 1,000 chars | Prevent large message generation |

### Memory Profile

| Scenario | Memory Usage |
|----------|-------------|
| 100 registered schemas | ~2 MB |
| 50 rule sets (10 rules each) | ~1 MB |
| Bulk validation of 10,000 rows | ~15 MB peak (failures only stored) |
| Message templates (10 locales) | ~500 KB |

---

## Security Considerations

### Input Sanitization

- **All string inputs** trimmed by default — prevents whitespace-only bypass of `required`
- **HTML stripped** unless explicitly allowed via `sanitizeHtml` with allowlist
- **SQL injection patterns** detected and rejected — common `SELECT`, `DROP`, `UNION` patterns blocked
- **Path traversal patterns** blocked — `../`, `..\\`, encoded variants
- **Null byte injection** prevented — `\x00` stripped from all inputs
- **Unicode normalization** applied (NFC) — prevents homoglyph attacks
- **Control characters** stripped — except `\n`, `\r`, `\t`
- **Max length enforced** before regex evaluation — prevents ReDoS on oversized input

### Denial of Service Prevention

- **Schema depth limits** (10 levels) prevent stack overflow from deeply nested objects
- **Array size limits** (10,000 items) prevent memory exhaustion
- **Regex patterns pre-tested** for catastrophic backtracking (ReDoS analysis at registration)
- **Async validation timeouts** prevent hanging requests (configurable, default 5s)
- **Custom function sandboxed** with execution timeout (1s default)
- **Rate limiting** on uniqueness check endpoints (100/min per IP)
- **Input length capped** before any validation runs (100KB default)

### Data Leakage Prevention

- Validation errors **never expose database internals** (table names, query details)
- Uniqueness checks return generic **"already taken"** messages — no information about existing records
- Password validation does **not reveal which specific rule failed** (configurable — `detailedPasswordErrors: false` for production)
- Failed validation values are **redacted from audit logs** for sensitive fields (password, creditCard, ssn)
- **Error messages sanitized** — user input in messages is HTML-escaped to prevent stored XSS

### Regex Security

```typescript
// All custom regex patterns are validated at registration time
function registerPattern(pattern: string): void {
  // 1. Length check
  if (pattern.length > 1000) throw new Error('Pattern too long');

  // 2. Compile check (syntax valid)
  new RegExp(pattern);

  // 3. ReDoS check — test with adversarial input
  const testInput = 'a'.repeat(100);
  const start = performance.now();
  new RegExp(pattern).test(testInput);
  const elapsed = performance.now() - start;

  if (elapsed > 100) {
    throw new Error(`Pattern exhibits catastrophic backtracking (${elapsed}ms on test input)`);
  }
}
```

---

## Audit Events

| Event | Category | Severity | Description |
|-------|----------|----------|-------------|
| `validation.entity.failed` | data | info | Entity validation failed — includes entity type, field count, error count |
| `validation.entity.passed` | data | debug | Entity validation passed (opt-in, disabled by default for volume) |
| `validation.entity.warning` | data | info | Validation passed but with warnings |
| `validation.async.timeout` | error | warn | Async validation timed out — field, timeout value |
| `validation.async.error` | error | error | Async validation threw unexpected error |
| `validation.rule_set.created` | admin | info | New rule set created — name, entity, venture, rule count |
| `validation.rule_set.updated` | admin | info | Rule set modified — name, version, changes |
| `validation.rule_set.deleted` | admin | warn | Rule set deleted — name, entity |
| `validation.rule_set.cloned` | admin | info | Rule set cloned for venture override |
| `validation.messages.updated` | admin | info | Error messages changed — locale, venture, key count |
| `validation.password_policy.updated` | admin | info | Password policy changed — venture, changes |
| `validation.bulk.completed` | system | info | Bulk validation batch completed — total, valid, errors, duration |
| `validation.bulk.failed` | system | warn | Bulk validation encountered critical errors |
| `validation.sanitize.xss_stripped` | security | warn | XSS content stripped from input — field, pattern matched |
| `validation.sanitize.sql_detected` | security | warn | SQL injection pattern detected — field, pattern |
| `validation.sanitize.path_traversal` | security | warn | Path traversal attempt — field, value |
| `validation.rate_limited` | security | warn | Uniqueness check rate limit exceeded — IP, endpoint |

### Audit Event Payload Example

```typescript
// Emitted on validation failure
{
  event: 'validation.entity.failed',
  category: 'data',
  timestamp: '2026-02-08T19:30:00.000Z',
  ventureId: 'venture-uuid',
  userId: 'user-uuid',
  data: {
    entity: 'user',
    operation: 'create',
    ruleSetName: 'user-registration',
    group: 'create',
    errorCount: 3,
    warningCount: 1,
    errors: [
      { field: 'email', rule: 'email-format', code: 'VAL_FORMAT_EMAIL' },
      { field: 'password', rule: 'password-strength', code: 'VAL_PWD_SPECIAL' },
      { field: 'name', rule: 'name-required', code: 'VAL_REQUIRED' },
    ],
    duration: 2.4, // ms
    traceId: 'trace-abc123',
  },
}
```

---

## Environment Variables

```bash
# ═══════════════════════════════════════════════════════════════════════════════
# VALIDATION ENGINE CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

# Stop on first error within each validation stage (default: false)
VALIDATION_ABORT_EARLY=false

# Remove unknown fields not defined in schema (default: false)
VALIDATION_STRIP_UNKNOWN=false

# Maximum timeout for any single async validation in ms (default: 5000)
VALIDATION_MAX_ASYNC_TIMEOUT_MS=5000

# Maximum rows per bulk validation batch (default: 10000)
VALIDATION_MAX_BULK_BATCH=10000

# Maximum errors collected per validation result (default: 500)
VALIDATION_MAX_ERRORS=500

# Maximum schema nesting depth (default: 10)
VALIDATION_MAX_DEPTH=10

# Maximum input string length before validation (default: 100000)
VALIDATION_MAX_INPUT_LENGTH=100000

# Default locale for error messages (default: en-US)
VALIDATION_DEFAULT_LOCALE=en-US

# Enable detailed password error messages (default: false in production)
# false = generic "Password does not meet requirements"
# true  = specific "Must contain special character", "Must be 12+ chars"
VALIDATION_DETAILED_PASSWORD_ERRORS=false

# ═══════════════════════════════════════════════════════════════════════════════
# PASSWORD POLICY DEFAULTS
# ═══════════════════════════════════════════════════════════════════════════════

# Minimum password length (default: 12)
VALIDATION_PASSWORD_MIN_LENGTH=12

# Maximum password length (default: 128)
VALIDATION_PASSWORD_MAX_LENGTH=128

# Require at least one special character (default: true)
VALIDATION_PASSWORD_REQUIRE_SPECIAL=true

# Block common passwords from haveibeenpwned list (default: true)
VALIDATION_PASSWORD_DISALLOW_COMMON=true

# Block user info (email, name) in password (default: true)
VALIDATION_PASSWORD_DISALLOW_USER_INFO=true

# Max sequential repeated characters (default: 3)
VALIDATION_PASSWORD_MAX_REPEATED_CHARS=3

# Minimum character classes required out of 4 (default: 3)
VALIDATION_PASSWORD_MIN_CHAR_CLASSES=3

# ═══════════════════════════════════════════════════════════════════════════════
# SANITIZATION DEFAULTS
# ═══════════════════════════════════════════════════════════════════════════════

# Auto-trim strings (default: true)
VALIDATION_SANITIZE_TRIM=true

# Strip HTML by default (default: true)
VALIDATION_SANITIZE_STRIP_HTML=true

# Maximum input string length for sanitization (default: 100000)
VALIDATION_SANITIZE_MAX_LENGTH=100000

# Unicode normalization form (default: NFC)
VALIDATION_SANITIZE_UNICODE_FORM=NFC

# Strip null bytes from input (default: true)
VALIDATION_SANITIZE_STRIP_NULL_BYTES=true

# ═══════════════════════════════════════════════════════════════════════════════
# RATE LIMITING (for async uniqueness checks)
# ═══════════════════════════════════════════════════════════════════════════════

# Maximum uniqueness checks per minute per IP (default: 100)
VALIDATION_UNIQUENESS_RATE_LIMIT=100

# Rate limit window in seconds (default: 60)
VALIDATION_UNIQUENESS_RATE_WINDOW=60

# ═══════════════════════════════════════════════════════════════════════════════
# AUDIT LOGGING
# ═══════════════════════════════════════════════════════════════════════════════

# Log successful validations (default: false — high volume)
VALIDATION_AUDIT_LOG_SUCCESS=false

# Log validation warnings (default: true)
VALIDATION_AUDIT_LOG_WARNINGS=true

# Retention period for audit logs in days (default: 90)
VALIDATION_AUDIT_RETENTION_DAYS=90
```

---

## Dependencies

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `zod` | ^3.22.x | Schema definition, structural validation, type inference |
| `@hookform/resolvers` | ^3.x | React Hook Form ↔ Zod integration (zodResolver) |
| `validator` | ^13.x | String validation utilities (isEmail, isURL, isIP, etc.) |
| `sanitize-html` | ^2.x | HTML sanitization with allowlist-based tag/attribute control |
| `libphonenumber-js` | ^1.x | Phone number parsing, formatting, and country-aware validation |
| `dompurify` | ^3.x | XSS sanitization for HTML content (server-side via jsdom) |

### Internal Dependencies

| Package | Purpose |
|---------|---------|
| `@mcv/kernel` | Base types (`VentureID`, `UUID`), constants, environment |
| `@mcv/shared/localization` | Error message localization, locale resolution |
| `@mcv/fabric/events` | Audit event emission (`emitEvent()`) |
| `@mcv/fabric/trpc` | tRPC procedure definitions, router factory |
| `@mcv/fabric/db` | Database connection for async validation (uniqueness, existence) |
| `@mcv/fabric/rate-limit` | Rate limiting for uniqueness check endpoints |

### Dependency Graph

```
@mcv/shared/validation
├── @mcv/kernel (types, env)
├── @mcv/shared/localization (i18n)
├── @mcv/fabric/events (audit)
├── @mcv/fabric/trpc (router)
├── @mcv/fabric/db (async checks)
├── @mcv/fabric/rate-limit (rate limiting)
├── zod (schemas)
├── @hookform/resolvers (forms)
├── validator (string checks)
├── sanitize-html (sanitization)
├── libphonenumber-js (phone)
└── dompurify (XSS)
```

### Who Depends on This Module

| Consumer | Usage |
|----------|-------|
| `@mcv/iam` (Tier 3) | User registration, login, profile validation |
| `@mcv/commerce` (Tier 3) | Product, order, payment, address schemas |
| `@mcv/cms` (Tier 3) | Content, page, media upload validation |
| `@mcv/intelligence/gateway` (Tier 4) | ChatRequest, budget input validation |
| `@mcv/intelligence/naos` (Tier 4) | Agent configuration validation |
| `@mcv/admin` (Tier 5) | Admin form validation across all modules |
| `@mcv/portal` (Tier 6) | End-user form validation |
| All tRPC procedures | `.input()` schema validation |

---

## Testing Notes

### Unit Testing

```typescript
import { z, email, password, phone, createValidator, sanitize } from '@mcv/shared/validation';

describe('Common Validators', () => {
  describe('email()', () => {
    it('should accept valid email addresses', () => {
      expect(email().safeParse('user@example.com').success).toBe(true);
      expect(email().safeParse('name+tag@domain.co.uk').success).toBe(true);
      expect(email().safeParse('test@sub.domain.com').success).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(email().safeParse('invalid').success).toBe(false);
      expect(email().safeParse('user@').success).toBe(false);
      expect(email().safeParse('@domain.com').success).toBe(false);
      expect(email().safeParse('').success).toBe(false);
      expect(email().safeParse('user@domain').success).toBe(false);
    });
  });

  describe('password()', () => {
    it('should enforce minimum length', () => {
      const schema = password({ minLength: 12 });
      expect(schema.safeParse('Str0ng!Pass!!').success).toBe(true);
      expect(schema.safeParse('Short!1').success).toBe(false);
    });

    it('should enforce special character requirement', () => {
      const schema = password({ minLength: 12, requireSpecial: true });
      expect(schema.safeParse('Str0ng!Password').success).toBe(true);
      expect(schema.safeParse('NoSpecialChar12').success).toBe(false);
    });

    it('should enforce all character class requirements', () => {
      const schema = password({
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumber: true,
        requireSpecial: true,
      });
      expect(schema.safeParse('Abcdef1!').success).toBe(true);
      expect(schema.safeParse('abcdef1!').success).toBe(false); // no uppercase
      expect(schema.safeParse('ABCDEF1!').success).toBe(false); // no lowercase
      expect(schema.safeParse('Abcdefg!').success).toBe(false); // no number
      expect(schema.safeParse('Abcdefg1').success).toBe(false); // no special
    });
  });

  describe('phone()', () => {
    it('should validate US phone numbers', () => {
      const usPhone = phone({ country: 'US' });
      expect(usPhone.safeParse('+15551234567').success).toBe(true);
      expect(usPhone.safeParse('(555) 123-4567').success).toBe(true);
      expect(usPhone.safeParse('123').success).toBe(false);
    });

    it('should validate E.164 format', () => {
      const e164 = phone({ format: 'e164' });
      expect(e164.safeParse('+15551234567').success).toBe(true);
      expect(e164.safeParse('+442071234567').success).toBe(true);
      expect(e164.safeParse('5551234567').success).toBe(false);
    });
  });
});

describe('Business Rules', () => {
  it('should validate cross-field rules', async () => {
    const validator = createValidator({
      entity: 'event',
      rules: [{
        name: 'end-after-start',
        fields: ['startDate', 'endDate'],
        type: 'custom',
        params: { fn: (data: any) => data.endDate > data.startDate },
        message: 'End must be after start',
      }],
    });

    const result = await validator.validate({
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-02-01'),
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toBe('End must be after start');
  });

  it('should apply conditional rules', async () => {
    const validator = createValidator({
      entity: 'order',
      rules: [{
        name: 'state-required',
        field: 'state',
        type: 'required',
        message: 'State required for US',
        condition: { field: 'country', operator: 'eq', value: 'US' },
      }],
    });

    // US order without state → error
    const usResult = await validator.validate({ country: 'US' });
    expect(usResult.valid).toBe(false);

    // Canadian order without state → passes (condition not met)
    const caResult = await validator.validate({ country: 'CA' });
    expect(caResult.valid).toBe(true);
  });

  it('should respect validation groups', async () => {
    const validator = createValidator({
      entity: 'product',
      rules: [
        { name: 'name-required', field: 'name', type: 'required',
          message: 'Name required', group: 'create' },
        { name: 'price-positive', field: 'price', type: 'min',
          params: { min: 0 }, message: 'Price ≥ 0' },
      ],
    });

    // Update group: name-required skipped, price validated
    const updateResult = await validator.validate(
      { price: -5 },
      { group: 'update' }
    );
    expect(updateResult.valid).toBe(false);
    expect(updateResult.errors).toHaveLength(1); // only price error
    expect(updateResult.errors[0].rule).toBe('price-positive');
  });
});

describe('Sanitization', () => {
  it('should strip HTML tags', () => {
    expect(sanitize('<script>alert("xss")</script>Hello', { stripHtml: true }))
      .toBe('Hello');
  });

  it('should trim whitespace', () => {
    expect(sanitize('  hello  ', { trim: true })).toBe('hello');
  });

  it('should normalize whitespace', () => {
    expect(sanitize('hello   world', { normalizeWhitespace: true }))
      .toBe('hello world');
  });

  it('should strip null bytes', () => {
    expect(sanitize('hello\x00world', { stripNullBytes: true }))
      .toBe('helloworld');
  });

  it('should enforce max length', () => {
    const input = 'a'.repeat(200);
    expect(sanitize(input, { maxLength: 100 })).toHaveLength(100);
  });

  it('should strip path traversal patterns', () => {
    expect(sanitize('../../../etc/passwd', { stripHtml: true }))
      .not.toContain('..');
  });
});

describe('Error Messages', () => {
  it('should interpolate message templates', () => {
    const msg = interpolateMessage('{{field}} must be at least {{min}}', {
      field: 'Name',
      min: 2,
    });
    expect(msg).toBe('Name must be at least 2');
  });

  it('should localize errors to specified locale', () => {
    setValidationMessages('fr-FR', { required: '{{field}} est requis' });
    const errors = [{ field: 'email', rule: 'required', message: '', code: 'VAL_REQUIRED' }];
    const localized = localizeErrors(errors, 'fr-FR');
    expect(localized[0].message).toBe('email est requis');
  });
});
```

### Integration Testing

```typescript
import { validateEntity, defineRuleSet, getRuleSet } from '@mcv/shared/validation';

describe('Validation Pipeline E2E', () => {
  it('should run full pipeline: sanitize → schema → rules → async', async () => {
    const ruleSet = defineRuleSet({
      name: 'test-user',
      entity: 'user',
      rules: [
        { name: 'email-required', field: 'email', type: 'required', message: 'Email required' },
        { name: 'email-format', field: 'email', type: 'email', message: 'Invalid email' },
        { name: 'email-unique', field: 'email', type: 'unique', message: 'Email taken', async: true },
        { name: 'name-required', field: 'name', type: 'required', message: 'Name required' },
        { name: 'name-length', field: 'name', type: 'length', params: { min: 2, max: 100 },
          message: 'Name must be 2-100 chars' },
      ],
    });

    // Valid input
    const validResult = await validateEntity({
      email: 'new@example.com',
      name: 'Jane Doe',
    }, ruleSet);
    expect(validResult.valid).toBe(true);
    expect(validResult.errors).toHaveLength(0);
    expect(validResult.duration).toBeLessThan(200); // ms

    // Invalid input — multiple errors
    const invalidResult = await validateEntity({
      email: 'not-an-email',
      name: '',
    }, ruleSet);
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.errors.length).toBeGreaterThanOrEqual(2);
    expect(invalidResult.fieldErrors['email']).toBeDefined();
    expect(invalidResult.fieldErrors['name']).toBeDefined();
  });

  it('should persist and retrieve rule sets from database', async () => {
    const ruleSet = await defineRuleSet({
      name: 'integration-test-product',
      entity: 'product',
      ventureId: testVentureId,
      rules: [
        { name: 'name', field: 'name', type: 'required', message: 'Required' },
        { name: 'price', field: 'price', type: 'min', params: { min: 0 }, message: 'Min 0' },
      ],
    });

    const retrieved = await getRuleSet('integration-test-product', testVentureId);
    expect(retrieved).toBeDefined();
    expect(retrieved!.rules).toHaveLength(2);
    expect(retrieved!.entity).toBe('product');
  });

  it('should audit log failed validations', async () => {
    const result = await validateEntity(
      { email: 'invalid' },
      userRuleSet,
      { ventureId: testVentureId }
    );

    expect(result.valid).toBe(false);

    // Check audit log was created
    const auditLog = await db.query.validationAuditLog.findFirst({
      where: and(
        eq(validationAuditLog.ventureId, testVentureId),
        eq(validationAuditLog.entity, 'user'),
        eq(validationAuditLog.passed, false),
      ),
      orderBy: desc(validationAuditLog.createdAt),
    });

    expect(auditLog).toBeDefined();
    expect(auditLog!.errorCount).toBeGreaterThan(0);
  });

  it('should handle bulk validation with performance tracking', async () => {
    const rows = Array.from({ length: 1000 }, (_, i) => ({
      email: i % 10 === 0 ? 'invalid' : `user${i}@example.com`,
      name: i % 20 === 0 ? '' : `User ${i}`,
      country: 'US',
    }));

    const result = await validateImport(rows);

    expect(result.totalRecords).toBe(1000);
    expect(result.validCount).toBeLessThan(1000); // Some are invalid
    expect(result.errorCount).toBeGreaterThan(0);
    expect(result.throughput).toBeGreaterThan(100); // >100 records/sec
    expect(result.duration).toBeLessThan(5000); // Under 5 seconds
  });
});

describe('Security', () => {
  it('should strip XSS from input', async () => {
    const result = await validateEntity(
      { name: '<script>alert("xss")</script>John' },
      userRuleSet
    );
    // After sanitization, name should be "John"
    expect(result.valid).toBe(true);
  });

  it('should rate limit uniqueness checks', async () => {
    // Fire 200 uniqueness checks rapidly
    const promises = Array.from({ length: 200 }, (_, i) =>
      validateField('email', `user${i}@test.com`, userRuleSet)
    );

    const results = await Promise.allSettled(promises);
    const rateLimited = results.filter(
      r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value?.errors?.some(e => e.code === 'VAL_RATE_LIMITED'))
    );

    expect(rateLimited.length).toBeGreaterThan(0); // Some should be rate limited
  });

  it('should timeout long-running async validations', async () => {
    const validator = createValidator({
      entity: 'test',
      rules: [{
        name: 'slow-check',
        field: 'value',
        type: 'async',
        params: {
          fn: async () => {
            await new Promise(r => setTimeout(r, 10000)); // 10 seconds
            return true;
          },
        },
        message: 'Slow validation',
        async: true,
        timeoutMs: 100, // 100ms timeout
      }],
    });

    const result = await validator.validate({ value: 'test' });
    expect(result.errors.some(e => e.code === 'VAL_ASYNC_TIMEOUT')).toBe(true);
  });
});
```

---

## Migration Guide

### From Manual Validation to @mcv/shared/validation

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// BEFORE: Manual validation scattered across services
// ═══════════════════════════════════════════════════════════════════════════════

function validateUser(data: any) {
  const errors = [];
  if (!data.email) errors.push('Email required');
  if (data.email && !data.email.includes('@')) errors.push('Invalid email');
  if (!data.name) errors.push('Name required');
  if (data.name && data.name.length < 2) errors.push('Name too short');
  if (data.name && data.name.length > 100) errors.push('Name too long');
  return errors;
}

// ═══════════════════════════════════════════════════════════════════════════════
// AFTER: Type-safe schema with automatic error messages
// ═══════════════════════════════════════════════════════════════════════════════

import { z, email } from '@mcv/shared/validation';

const userSchema = z.object({
  email: email(),
  name: z.string().min(2).max(100).trim(),
});

// Single line validates + types + provides error messages
const result = userSchema.safeParse(data);
```

### From Joi to Zod

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// BEFORE: Joi (no TypeScript inference)
// ═══════════════════════════════════════════════════════════════════════════════

const schema = Joi.object({
  email: Joi.string().email().required(),
  age: Joi.number().integer().min(18).max(120),
});
// TypeScript type must be maintained separately 😢

// ═══════════════════════════════════════════════════════════════════════════════
// AFTER: Zod (TypeScript type inferred automatically)
// ═══════════════════════════════════════════════════════════════════════════════

const schema = z.object({
  email: z.string().email(),
  age: z.number().int().min(18).max(120).optional(),
});
type User = z.infer<typeof schema>; // ← Type is always in sync 🎉
```

---

## FAQ

### Q: Should I validate on client, server, or both?
**Both.** Client-side validation (via `zodResolver`) gives instant UX feedback. Server-side validation (via tRPC `.input()`) ensures security. They share the same Zod schema, so there's zero divergence.

### Q: When should I use business rules vs Zod refinements?
Use **Zod refinements** for structural concerns (format, type, range). Use **business rules** (`createValidator`) for domain logic that may change per-venture, require database access, or have conditional execution.

### Q: How do I handle validation in bulk imports?
Use the batch validation pattern (Example 12). Pre-fetch uniqueness data, validate row-by-row with `skipAsync: true`, and return a `BulkValidationResult` with aggregate error summaries.

### Q: Can ventures customize validation rules?
Yes. Rule sets support per-venture overrides via `cloneRuleSet()`. Ventures can modify rules, add new ones, or change severity levels without affecting the global defaults.

### Q: How do I add a new country's postal code format?
Add the regex pattern to `POSTAL_CODE_FORMATS` in `constants.ts`. The `postalCode({ country })` validator will automatically use it.

### Q: How are validation errors displayed in different languages?
Use `setValidationMessages(locale, messages)` to register translations. Error messages use `{{param}}` interpolation. Call `localizeErrors(errors, locale)` to translate error arrays.

---

*@mcv/shared/validation — Type-Safe Validation for MCV.ONE*
