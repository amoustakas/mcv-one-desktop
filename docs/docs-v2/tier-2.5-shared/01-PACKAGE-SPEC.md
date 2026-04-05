# @mcv/shared — Package Specification
## Tier 2.5: Shared Business Utilities

**Package:** `@mcv/shared`  
**Classification:** INTERNAL  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## Executive Summary

`@mcv/shared` is the shared business utilities layer of the MCV.ONE SDK. It provides reusable, cross-cutting business logic that spans multiple domain packages: template engines, workflow patterns, validation rules, business calculations, scheduling, localization, theming (Chameleon Engine), media processing, data export/import, and schema versioning.

**This package transforms raw primitives into business-ready building blocks that domain packages compose into complete features.**

---

## Strategic Position

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DOMAIN PACKAGES (Tier 5)                            │
│                                                                              │
│  @mcv/ventures  @mcv/commerce  @mcv/community  @mcv/jobs  @mcv/finance     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ uses
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              @mcv/shared                                     │
│                            Tier 2.5: Shared                                  │
│                                                                              │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐    │
│  │ templates │ │ workflows │ │validation │ │calculations│ │ scheduling│    │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘    │
│                                                                              │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐    │
│  │localization│ │  theming  │ │   media   │ │  export   │ │  import   │    │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘    │
│                                                                              │
│                              ┌───────────┐                                   │
│                              │versioning │                                   │
│                              └───────────┘                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                          ┌───────────┼───────────┐
                          │           │           │
                          ▼           ▼           ▼
              ┌───────────────┐ ┌─────────┐ ┌───────────────┐
              │  @mcv/fabric  │ │@mcv/api │ │@mcv/connectors│
              │   (Tier 2)    │ │(Tier 1) │ │   (Tier 3)    │
              └───────────────┘ └─────────┘ └───────────────┘
                          │           │           │
                          └───────────┼───────────┘
                                      │
                                      ▼
                              ┌───────────────┐
                              │  @mcv/kernel  │
                              │   (Tier 0)    │
                              └───────────────┘
```

---

## Business Context

### Why Shared Utilities?

1. **DRY Across Domains** — Template engines, calculations, and validations are needed by commerce, jobs, finance, and other domains
2. **Consistency** — One pricing engine, one tax calculator, one date formatter ensures consistent behavior
3. **Separation of Concerns** — Domain packages focus on business rules; shared handles cross-cutting mechanics
4. **Testability** — Isolated, stateless utilities are easy to unit test
5. **Vendor Independence** — Abstract media processing, export formats behind consistent interfaces

### Business Value by Module

| Module | Business Value | Example Use Cases |
|--------|----------------|-------------------|
| **templates** | Branded communications | Invoices, receipts, welcome emails |
| **workflows** | Process automation | Approval chains, onboarding sequences |
| **validation** | Data integrity | Form validation, business rule checks |
| **calculations** | Financial accuracy | Pricing, tax, currency conversion |
| **scheduling** | Time management | Appointments, recurring jobs, availability |
| **localization** | Global reach | Multi-language, regional formats |
| **theming** | Brand customization | White-labeling, dynamic color schemes |
| **media** | Rich content | Image resizing, video processing |
| **export** | Data portability | PDF reports, CSV exports |
| **import** | Data onboarding | Bulk customer import, product catalogs |
| **versioning** | Data evolution | Schema migrations, audit trails |

---

## Sub-Modules Overview

| Module | Purpose | Key Exports |
|--------|---------|-------------|
| **templates** | Email, document, notification template engine | `TemplateEngine`, `renderTemplate`, `registerHelper` |
| **workflows** | Reusable workflow state machine patterns | `WorkflowEngine`, `defineWorkflow`, `WorkflowStep` |
| **validation** | Business validation rules and schemas | `ValidationRule`, `validateEntity`, `createValidator` |
| **calculations** | Pricing, tax, currency, discount calculations | `PricingEngine`, `TaxCalculator`, `CurrencyConverter` |
| **scheduling** | Cron, calendar, booking, availability | `Scheduler`, `BookingEngine`, `AvailabilityManager` |
| **localization** | i18n, translations, date/number formats | `i18n`, `translate`, `formatNumber`, `formatDate` |
| **theming** | Design tokens, dynamic themes (Chameleon Engine) | `ThemeEngine`, `createTheme`, `resolveTokens` |
| **media** | Image processing, video transcoding, thumbnails | `MediaProcessor`, `ImageTransformer`, `VideoTranscoder` |
| **export** | PDF, CSV, Excel generation | `PDFGenerator`, `CSVExporter`, `ExcelBuilder` |
| **import** | Bulk data import parsers and validators | `ImportParser`, `CSVImporter`, `DataMapper` |
| **versioning** | Schema migrations, data versioning | `MigrationRunner`, `VersionedEntity`, `ChangeTracker` |

---

## Module: templates

### Purpose

Unified template engine for generating emails, documents, notifications, and other text-based content. Supports variable interpolation, conditionals, loops, partials, and helper functions.

### Core Capabilities

1. **Multi-Format Output** — HTML, plain text, Markdown, PDF-ready HTML
2. **Template Inheritance** — Base layouts with extendable blocks
3. **Helper Functions** — Date formatting, currency, pluralization
4. **Conditional Logic** — If/else, unless, switch statements
5. **Iteration** — Array loops with index access
6. **Partials** — Reusable template fragments
7. **Safe Rendering** — Auto-escaping, XSS prevention
8. **Preview Mode** — Render with sample data for testing

### Template Types

| Type | Purpose | Typical Use |
|------|---------|-------------|
| `email` | Transactional emails | Welcome, password reset, receipts |
| `notification` | In-app/push notifications | Alerts, reminders, updates |
| `document` | Printable documents | Invoices, contracts, reports |
| `sms` | SMS messages | Verification codes, alerts |
| `slack` | Slack messages | Notifications, reports |

### Key Schemas

```typescript
interface Template {
  id: UUID;
  ventureId: VentureID;
  type: 'email' | 'notification' | 'document' | 'sms' | 'slack';
  name: string;
  slug: string;
  subject?: string;           // For emails
  body: string;               // Template content
  bodyPlain?: string;         // Plain text fallback
  locale: string;             // e.g., 'en-US'
  variables: TemplateVariable[];
  helpers: string[];          // Registered helper names
  layoutId?: UUID;            // Base layout template
  metadata: Record<string, unknown>;
  version: number;
  isActive: boolean;
}

interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  required: boolean;
  defaultValue?: unknown;
  description: string;
}

interface RenderContext {
  ventureId: VentureID;
  locale: string;
  variables: Record<string, unknown>;
  helpers?: Record<string, HelperFunction>;
  partials?: Record<string, string>;
}
```

### Integration Points

- **@mcv/connectors/email** — Rendered templates sent via SendGrid, Resend, etc.
- **@mcv/connectors/voice** — SMS templates sent via Twilio
- **@mcv/shared/export** — Document templates rendered to PDF
- **@mcv/shared/localization** — Template content localized

---

## Module: workflows

### Purpose

Reusable workflow state machine patterns for multi-step processes. Defines states, transitions, guards, actions, and hooks for building approval workflows, onboarding sequences, and complex business processes.

### Core Capabilities

1. **State Machine Definition** — Declarative workflow states and transitions
2. **Guards** — Conditional transition checks
3. **Actions** — Side effects triggered on transition
4. **Hooks** — Entry/exit handlers for states
5. **Parallel States** — Multiple concurrent state branches
6. **History States** — Return to previous state
7. **Timeout Handling** — Auto-transition after duration
8. **Persistence** — Workflow state stored in database
9. **Event Sourcing** — Complete audit trail of transitions

### Workflow Patterns

| Pattern | Description | Use Cases |
|---------|-------------|-----------|
| **Linear** | Sequential steps | Onboarding checklist |
| **Approval** | Request → Review → Approve/Reject | Expense approval |
| **Parallel** | Multiple concurrent tracks | Document + Background check |
| **Branching** | Conditional paths | Risk-based verification |
| **Loop** | Repeatable steps | Revision cycles |
| **Escalation** | Timeout triggers escalation | SLA management |

### Key Schemas

```typescript
interface WorkflowDefinition {
  id: UUID;
  ventureId: VentureID;
  name: string;
  slug: string;
  version: number;
  initialState: string;
  states: WorkflowState[];
  transitions: WorkflowTransition[];
  context: WorkflowContextSchema;
  hooks: WorkflowHooks;
  metadata: Record<string, unknown>;
}

interface WorkflowState {
  name: string;
  type: 'initial' | 'intermediate' | 'final' | 'parallel' | 'history';
  onEntry?: WorkflowAction[];
  onExit?: WorkflowAction[];
  timeout?: {
    duration: string;        // ISO 8601 duration
    action: 'transition' | 'notify' | 'escalate';
    target?: string;
  };
  metadata: Record<string, unknown>;
}

interface WorkflowTransition {
  from: string | string[];
  to: string;
  event: string;
  guards?: WorkflowGuard[];
  actions?: WorkflowAction[];
}

interface WorkflowInstance {
  id: UUID;
  ventureId: VentureID;
  definitionId: UUID;
  definitionVersion: number;
  currentState: string;
  context: Record<string, unknown>;
  history: WorkflowEvent[];
  startedAt: ISOTimestamp;
  completedAt?: ISOTimestamp;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
}
```

### Integration Points

- **@mcv/fabric/jobs** — Workflow steps trigger background jobs
- **@mcv/fabric/events** — Transitions emit domain events
- **@mcv/shared/templates** — Workflow notifications use templates
- **@mcv/identity/permissions** — Guards check permissions

---

## Module: validation

### Purpose

Business validation rules that go beyond schema validation. Implements complex cross-field validations, async validations (uniqueness checks), and domain-specific rules.

### Core Capabilities

1. **Rule Definition** — Declarative validation rules
2. **Cross-Field Validation** — Rules spanning multiple fields
3. **Async Validation** — Database lookups, external checks
4. **Conditional Rules** — Apply based on other field values
5. **Custom Error Messages** — Localized, context-aware errors
6. **Rule Composition** — Combine rules with AND/OR logic
7. **Partial Validation** — Validate specific fields only
8. **Validation Groups** — Different rules for create vs update

### Validation Categories

| Category | Description | Examples |
|----------|-------------|----------|
| **Format** | String patterns | Email, phone, postal code |
| **Range** | Numeric bounds | Price > 0, age 18-120 |
| **Business** | Domain rules | End date > start date |
| **Uniqueness** | Database checks | Email not taken |
| **Dependency** | Cross-field | If country = US, require state |
| **External** | API checks | Valid VAT number, address verification |

### Key Schemas

```typescript
interface ValidationRule {
  id: string;
  name: string;
  field?: string;                    // Single field or cross-field
  fields?: string[];                 // For cross-field rules
  type: ValidationRuleType;
  params: Record<string, unknown>;
  condition?: ValidationCondition;   // When to apply
  message: string | LocalizedString;
  severity: 'error' | 'warning' | 'info';
  group?: string;                    // Validation group
}

type ValidationRuleType =
  | 'required' | 'optional'
  | 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object'
  | 'email' | 'url' | 'phone' | 'postalCode'
  | 'min' | 'max' | 'range' | 'length' | 'pattern'
  | 'enum' | 'oneOf' | 'noneOf'
  | 'unique' | 'exists'
  | 'custom' | 'async';

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

interface ValidationError {
  field: string;
  rule: string;
  message: string;
  params?: Record<string, unknown>;
  severity: 'error' | 'warning' | 'info';
}
```

### Integration Points

- **@mcv/api/trpc** — Input validation on procedures
- **@mcv/ui/forms** — Client-side validation
- **@mcv/shared/import** — Bulk data validation
- **@mcv/shared/workflows** — Guard conditions

---

## Module: calculations

### Purpose

Financial and business calculations with precision arithmetic. Handles pricing, taxes, discounts, currency conversion, and complex financial computations.

### Core Capabilities

1. **Decimal Precision** — No floating-point errors
2. **Tax Calculation** — Multi-jurisdiction tax rules
3. **Pricing Tiers** — Volume discounts, subscription tiers
4. **Currency Conversion** — Real-time and historical rates
5. **Discount Stacking** — Multiple discount rules
6. **Proration** — Partial period billing
7. **Rounding Rules** — Configurable per-currency
8. **Audit Trail** — Calculation breakdown

### Calculation Categories

| Category | Purpose | Examples |
|----------|---------|----------|
| **Pricing** | Product/service pricing | Unit price, quantity discounts |
| **Tax** | Sales tax, VAT, GST | US sales tax, EU VAT |
| **Currency** | Conversion, formatting | USD to EUR, crypto to fiat |
| **Discount** | Promotional pricing | Coupons, volume discounts |
| **Subscription** | Recurring billing | Proration, upgrades |
| **Commission** | Revenue sharing | Affiliate, marketplace fees |

### Key Schemas

```typescript
interface PriceCalculation {
  input: {
    items: LineItem[];
    currency: CurrencyCode;
    taxContext: TaxContext;
    discounts: DiscountCode[];
    customer?: CustomerContext;
  };
  output: {
    subtotal: Money;
    discounts: AppliedDiscount[];
    discountTotal: Money;
    taxableAmount: Money;
    taxes: AppliedTax[];
    taxTotal: Money;
    total: Money;
    breakdown: CalculationBreakdown[];
  };
}

interface Money {
  amount: string;           // Decimal string for precision
  currency: CurrencyCode;
  display: string;          // Formatted for display
}

interface TaxContext {
  jurisdiction: string;
  customerType: 'individual' | 'business';
  taxExempt: boolean;
  taxId?: string;
  shippingAddress?: Address;
  billingAddress?: Address;
}

interface TaxRule {
  id: UUID;
  ventureId: VentureID;
  name: string;
  jurisdiction: string;     // Country/state/province code
  type: 'sales_tax' | 'vat' | 'gst' | 'pst' | 'hst';
  rate: string;             // Decimal rate (e.g., "0.13" for 13%)
  compound: boolean;        // Tax on tax
  inclusive: boolean;       // Tax included in price
  categories: string[];     // Product categories
  validFrom: ISOTimestamp;
  validTo?: ISOTimestamp;
}
```

### Integration Points

- **@mcv/commerce/orders** — Order total calculations
- **@mcv/commerce/subscriptions** — Recurring billing
- **@mcv/connectors/payments** — Payment amounts
- **@mcv/shared/export** — Financial reports

---

## Module: scheduling

### Purpose

Time-based logic for cron jobs, calendar management, booking systems, and availability calculations.

### Core Capabilities

1. **Cron Expressions** — Standard and extended cron syntax
2. **Calendar Operations** — Event scheduling, conflicts
3. **Booking Engine** — Appointment scheduling
4. **Availability** — Resource availability windows
5. **Timezone Handling** — Proper TZ conversion
6. **Recurring Events** — RRule support
7. **Conflict Detection** — Overlapping event prevention
8. **Buffer Times** — Pre/post event buffers

### Scheduling Contexts

| Context | Description | Use Cases |
|---------|-------------|-----------|
| **Cron** | Periodic job execution | Daily reports, cleanup tasks |
| **Calendar** | Event scheduling | Meetings, appointments |
| **Booking** | Resource reservation | Room booking, consultations |
| **Availability** | Working hours | Business hours, staff schedules |
| **Reminder** | Scheduled notifications | Appointment reminders |
| **SLA** | Service level timers | Response time tracking |

### Key Schemas

```typescript
interface ScheduleDefinition {
  id: UUID;
  ventureId: VentureID;
  type: 'cron' | 'calendar' | 'booking' | 'availability';
  name: string;
  timezone: string;
  schedule: CronSchedule | CalendarSchedule | BookingSchedule;
  metadata: Record<string, unknown>;
}

interface CronSchedule {
  expression: string;         // "0 9 * * 1-5"
  startDate?: ISOTimestamp;
  endDate?: ISOTimestamp;
  maxRuns?: number;
}

interface BookingSlot {
  id: UUID;
  resourceId: UUID;
  resourceType: string;
  startTime: ISOTimestamp;
  endTime: ISOTimestamp;
  duration: number;           // Minutes
  bufferBefore: number;
  bufferAfter: number;
  status: 'available' | 'booked' | 'blocked' | 'tentative';
  booking?: Booking;
}

interface AvailabilityWindow {
  id: UUID;
  resourceId: UUID;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  startTime: string;          // "09:00"
  endTime: string;            // "17:00"
  timezone: string;
  validFrom?: ISOTimestamp;
  validTo?: ISOTimestamp;
  overrides: AvailabilityOverride[];
}
```

### Integration Points

- **@mcv/fabric/jobs** — Cron-triggered jobs
- **@mcv/connectors/google** — Google Calendar sync
- **@mcv/shared/templates** — Reminder notifications
- **@mcv/shared/localization** — Timezone display

---

## Module: localization

### Purpose

Internationalization (i18n) and localization (l10n) for multi-language support, regional formatting, and cultural adaptation.

### Core Capabilities

1. **Translation Management** — String translations with ICU MessageFormat
2. **Pluralization** — Language-specific plural rules
3. **Number Formatting** — Currency, percentages, decimals
4. **Date Formatting** — Regional date/time formats
5. **Relative Time** — "5 minutes ago", "in 2 days"
6. **RTL Support** — Right-to-left language support
7. **Fallback Chain** — Graceful degradation
8. **Dynamic Loading** — Load translations on demand

### Locale Components

| Component | Description | Examples |
|-----------|-------------|----------|
| **Language** | Base language | en, fr, es, zh |
| **Region** | Country variant | en-US, en-GB, fr-CA |
| **Script** | Writing system | zh-Hans, zh-Hant |
| **Calendar** | Calendar system | gregory, islamic |
| **Numbers** | Numbering system | latn, arab |

### Key Schemas

```typescript
interface Translation {
  id: UUID;
  ventureId: VentureID;
  namespace: string;          // 'common', 'errors', 'emails'
  key: string;                // 'welcome.title'
  locale: string;             // 'en-US'
  value: string;              // ICU MessageFormat
  context?: string;           // Usage context
  metadata: Record<string, unknown>;
  lastUsed?: ISOTimestamp;
}

interface LocaleConfig {
  locale: string;
  language: string;
  region?: string;
  direction: 'ltr' | 'rtl';
  numberFormat: NumberFormatConfig;
  dateFormat: DateFormatConfig;
  currencyFormat: CurrencyFormatConfig;
  fallbackLocales: string[];
}

interface NumberFormatConfig {
  decimal: string;            // '.' or ','
  thousands: string;          // ',' or '.'
  grouping: number[];         // [3] or [3, 2]
  positive: string;           // '' or '+'
  negative: string;           // '-' or '()'
  percent: string;            // '%'
}

interface DateFormatConfig {
  short: string;              // 'MM/DD/YYYY'
  medium: string;             // 'MMM D, YYYY'
  long: string;               // 'MMMM D, YYYY'
  full: string;               // 'EEEE, MMMM D, YYYY'
  time: string;               // 'h:mm a'
  datetime: string;           // 'MMM D, YYYY h:mm a'
  firstDayOfWeek: 0 | 1;      // Sunday or Monday
}
```

### Integration Points

- **@mcv/shared/templates** — Localized templates
- **@mcv/shared/calculations** — Currency formatting
- **@mcv/ui** — UI translations
- **@mcv/api** — Response localization

---

## Module: theming

### Purpose

The Chameleon Engine — dynamic theming system with design tokens, color schemes, typography, and component-level customization for white-labeling.

### Core Capabilities

1. **Design Tokens** — Semantic color, spacing, typography tokens
2. **Theme Variants** — Light, dark, high-contrast modes
3. **Brand Customization** — Venture-specific branding
4. **Runtime Switching** — Dynamic theme changes
5. **CSS Variable Generation** — Browser-compatible output
6. **Tailwind Integration** — Generate Tailwind config
7. **Component Themes** — Per-component customization
8. **Inheritance** — Theme extends theme

### Theme Structure

| Layer | Description | Examples |
|-------|-------------|----------|
| **Primitives** | Raw values | `blue-500: #3B82F6` |
| **Semantic** | Meaning-based | `primary: blue-500` |
| **Component** | UI elements | `button-bg: primary` |
| **Context** | State variants | `button-bg-hover: primary-dark` |

### Key Schemas

```typescript
interface Theme {
  id: UUID;
  ventureId: VentureID;
  name: string;
  slug: string;
  mode: 'light' | 'dark' | 'auto';
  parent?: UUID;              // Base theme to extend
  tokens: ThemeTokens;
  components: ComponentThemes;
  metadata: Record<string, unknown>;
  version: number;
}

interface ThemeTokens {
  colors: {
    primitives: Record<string, string>;
    semantic: {
      primary: ColorScale;
      secondary: ColorScale;
      accent: ColorScale;
      neutral: ColorScale;
      success: ColorScale;
      warning: ColorScale;
      error: ColorScale;
      info: ColorScale;
    };
    surface: {
      background: string;
      foreground: string;
      card: string;
      cardForeground: string;
      popover: string;
      popoverForeground: string;
      muted: string;
      mutedForeground: string;
    };
  };
  typography: {
    fonts: {
      sans: string;
      serif: string;
      mono: string;
    };
    sizes: Record<string, TypeScale>;
    weights: Record<string, number>;
    lineHeights: Record<string, number>;
    letterSpacing: Record<string, string>;
  };
  spacing: Record<string, string>;
  radii: Record<string, string>;
  shadows: Record<string, string>;
  borders: Record<string, string>;
  breakpoints: Record<string, string>;
  transitions: Record<string, string>;
}

interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;  // Default
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}
```

### Integration Points

- **@mcv/ui** — Component styling
- **@mcv/fabric/ventures** — Venture branding
- **@mcv/shared/templates** — Email theme
- **@mcv/shared/export** — PDF styling

---

## Module: media

### Purpose

Media asset processing including image manipulation, video transcoding, thumbnail generation, and format conversion.

### Core Capabilities

1. **Image Processing** — Resize, crop, rotate, filter
2. **Video Transcoding** — Format conversion, compression
3. **Thumbnail Generation** — Auto-thumbnails for media
4. **Optimization** — WebP, AVIF, compression
5. **Metadata Extraction** — EXIF, dimensions, duration
6. **Watermarking** — Image/video watermarks
7. **Sprite Sheets** — Icon sprite generation
8. **Responsive Images** — srcset generation

### Processing Pipelines

| Pipeline | Input | Output | Use Cases |
|----------|-------|--------|-----------|
| **Avatar** | Any image | 64/128/256px square | User avatars |
| **Product** | Product photo | Multiple sizes + zoom | E-commerce |
| **Document** | PDF | Thumbnail + preview | Document management |
| **Video** | Any video | HLS/DASH + poster | Video streaming |
| **Banner** | Image | Multiple aspect ratios | Marketing |

### Key Schemas

```typescript
interface MediaAsset {
  id: UUID;
  ventureId: VentureID;
  type: 'image' | 'video' | 'audio' | 'document';
  originalFilename: string;
  mimeType: string;
  size: number;
  storage: {
    bucket: string;
    key: string;
    url: string;
    cdnUrl?: string;
  };
  metadata: MediaMetadata;
  variants: MediaVariant[];
  processing: {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    error?: string;
    startedAt?: ISOTimestamp;
    completedAt?: ISOTimestamp;
  };
}

interface MediaMetadata {
  width?: number;
  height?: number;
  duration?: number;           // Seconds for video/audio
  codec?: string;
  bitrate?: number;
  frameRate?: number;
  colorSpace?: string;
  hasAlpha?: boolean;
  exif?: Record<string, unknown>;
}

interface MediaVariant {
  name: string;               // 'thumbnail', 'medium', 'large'
  width: number;
  height: number;
  format: string;             // 'webp', 'avif', 'mp4'
  quality: number;
  storage: {
    bucket: string;
    key: string;
    url: string;
  };
  size: number;
}

interface ImageTransform {
  resize?: {
    width?: number;
    height?: number;
    fit: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
    position?: string;
  };
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  rotate?: number;
  flip?: 'horizontal' | 'vertical';
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
  quality?: number;
  blur?: number;
  sharpen?: boolean;
  grayscale?: boolean;
  watermark?: {
    image: string;
    position: 'center' | 'nw' | 'ne' | 'sw' | 'se';
    opacity: number;
  };
}
```

### Integration Points

- **@mcv/fabric/storage** — Asset storage
- **@mcv/connectors/google** — Google Drive media
- **@mcv/shared/export** — PDF image embedding
- **@mcv/ui** — Image components

---

## Module: export

### Purpose

Generate downloadable documents and data files in various formats: PDF reports, CSV exports, Excel spreadsheets.

### Core Capabilities

1. **PDF Generation** — Reports, invoices, certificates
2. **CSV Export** — Data tables, lists
3. **Excel Builder** — Multi-sheet workbooks
4. **Template-Based** — Use document templates
5. **Streaming** — Large file generation
6. **Async Processing** — Background generation
7. **Signed URLs** — Secure download links
8. **Scheduling** — Recurring exports

### Export Types

| Type | Format | Use Cases |
|------|--------|-----------|
| **Report** | PDF | Financial reports, analytics |
| **Invoice** | PDF | Customer invoices |
| **Receipt** | PDF | Payment receipts |
| **List** | CSV | Contact lists, product catalogs |
| **Spreadsheet** | XLSX | Financial data, complex tables |
| **Certificate** | PDF | Completion certificates |

### Key Schemas

```typescript
interface ExportJob {
  id: UUID;
  ventureId: VentureID;
  type: 'pdf' | 'csv' | 'xlsx' | 'json';
  name: string;
  templateId?: UUID;
  data: ExportData;
  options: ExportOptions;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  output?: {
    url: string;
    signedUrl: string;
    signedUrlExpires: ISOTimestamp;
    filename: string;
    size: number;
    mimeType: string;
  };
  error?: string;
  requestedBy: UserID;
  createdAt: ISOTimestamp;
  completedAt?: ISOTimestamp;
}

interface PDFOptions {
  template: string | UUID;
  pageSize: 'letter' | 'a4' | 'legal';
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  header?: string;
  footer?: string;
  watermark?: {
    text: string;
    opacity: number;
  };
}

interface CSVOptions {
  delimiter: ',' | ';' | '\t';
  quote: '"' | "'";
  escape: '\\' | '"';
  header: boolean;
  columns: CSVColumn[];
  encoding: 'utf-8' | 'utf-16' | 'latin1';
  lineEnding: 'lf' | 'crlf';
}

interface CSVColumn {
  field: string;
  header: string;
  format?: (value: unknown) => string;
  width?: number;
}

interface ExcelOptions {
  sheets: ExcelSheet[];
  styles?: ExcelStyles;
  protection?: ExcelProtection;
}

interface ExcelSheet {
  name: string;
  columns: ExcelColumn[];
  data: Record<string, unknown>[];
  freezePane?: { row: number; col: number };
  autoFilter?: boolean;
}
```

### Integration Points

- **@mcv/shared/templates** — PDF templates
- **@mcv/fabric/storage** — Export storage
- **@mcv/fabric/jobs** — Background processing
- **@mcv/shared/scheduling** — Recurring exports

---

## Module: import

### Purpose

Parse and validate bulk data imports from CSV, Excel, JSON, and other formats. Map external data to internal schemas with transformation and validation.

### Core Capabilities

1. **Format Detection** — Auto-detect file format
2. **Schema Mapping** — Map columns to fields
3. **Validation** — Row-by-row validation
4. **Transformation** — Data normalization
5. **Deduplication** — Detect duplicates
6. **Preview Mode** — Preview before commit
7. **Partial Import** — Skip invalid rows
8. **Progress Tracking** — Real-time progress
9. **Rollback** — Undo failed imports

### Import Pipeline

```
Upload → Parse → Map → Transform → Validate → Preview → Import → Report
```

### Key Schemas

```typescript
interface ImportJob {
  id: UUID;
  ventureId: VentureID;
  type: string;                // 'customers', 'products', 'orders'
  source: {
    filename: string;
    format: 'csv' | 'xlsx' | 'json' | 'xml';
    size: number;
    encoding: string;
    url: string;
  };
  mapping: FieldMapping[];
  options: ImportOptions;
  status: ImportStatus;
  progress: {
    total: number;
    processed: number;
    succeeded: number;
    failed: number;
    skipped: number;
  };
  errors: ImportError[];
  report?: ImportReport;
  createdBy: UserID;
  createdAt: ISOTimestamp;
  completedAt?: ISOTimestamp;
}

interface FieldMapping {
  source: string;             // Column name or path
  target: string;             // Internal field name
  transform?: FieldTransform;
  defaultValue?: unknown;
  required: boolean;
}

interface FieldTransform {
  type: 'lowercase' | 'uppercase' | 'trim' | 'date' | 'number' | 'boolean' | 'custom';
  params?: Record<string, unknown>;
  customFn?: string;          // Function name for custom transform
}

type ImportStatus = 
  | 'uploaded'
  | 'parsing'
  | 'mapped'
  | 'validating'
  | 'previewing'
  | 'importing'
  | 'completed'
  | 'failed'
  | 'cancelled';

interface ImportError {
  row: number;
  column?: string;
  field?: string;
  value?: unknown;
  error: string;
  severity: 'error' | 'warning';
}

interface ImportReport {
  totalRows: number;
  importedRows: number;
  failedRows: number;
  skippedRows: number;
  duration: number;
  errors: ImportError[];
  warnings: ImportError[];
  createdEntities: UUID[];
  updatedEntities: UUID[];
}
```

### Integration Points

- **@mcv/shared/validation** — Row validation
- **@mcv/fabric/jobs** — Background processing
- **@mcv/fabric/storage** — File upload
- **@mcv/api** — Import status API

---

## Module: versioning

### Purpose

Schema migrations, data versioning, and change tracking for maintaining data integrity across system evolution.

### Core Capabilities

1. **Schema Migrations** — Database schema changes
2. **Data Migrations** — Data transformation scripts
3. **Version Tracking** — Entity version numbers
4. **Change History** — Audit log of changes
5. **Rollback Support** — Undo migrations
6. **Dry Run Mode** — Preview changes
7. **Dependency Graph** — Migration ordering
8. **Conflict Resolution** — Concurrent update handling

### Versioning Strategies

| Strategy | Description | Use Cases |
|----------|-------------|-----------|
| **Incremental** | Version number increments | Simple entities |
| **Timestamp** | Last-modified timestamp | Sync scenarios |
| **Hash** | Content hash | Immutable data |
| **Vector** | Multi-origin versioning | Distributed systems |

### Key Schemas

```typescript
interface Migration {
  id: string;                 // '20240209120000_add_users'
  name: string;
  version: number;
  dependencies: string[];     // Migration IDs that must run first
  up: MigrationStep[];
  down: MigrationStep[];
  checksum: string;
  appliedAt?: ISOTimestamp;
  rollbackAt?: ISOTimestamp;
}

interface MigrationStep {
  type: 'sql' | 'script' | 'function';
  content: string;
  params?: Record<string, unknown>;
  timeout?: number;
}

interface VersionedEntity {
  version: number;
  versionTimestamp: ISOTimestamp;
  previousVersionId?: UUID;
  changeType: 'create' | 'update' | 'delete';
  changedBy: UserID;
  changedFields?: string[];
}

interface ChangeTrack {
  id: UUID;
  entityType: string;
  entityId: UUID;
  ventureId: VentureID;
  version: number;
  operation: 'create' | 'update' | 'delete';
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  diff?: FieldChange[];
  userId: UserID;
  timestamp: ISOTimestamp;
  metadata?: Record<string, unknown>;
}

interface FieldChange {
  field: string;
  path?: string;              // For nested fields
  before: unknown;
  after: unknown;
}

interface MigrationStatus {
  current: string;            // Current migration ID
  pending: Migration[];
  applied: Migration[];
  failed?: Migration;
  lastRun: ISOTimestamp;
}
```

### Integration Points

- **@mcv/kernel/db** — Database migrations
- **@mcv/fabric/audit** — Audit trail integration
- **@mcv/api** — Version headers
- **@mcv/shared/import** — Data migration

---

## Dependencies

### External Dependencies

| Package | Version | Purpose | Module(s) |
|---------|---------|---------|-----------|
| `handlebars` | ^4.7.x | Template engine | templates |
| `mjml` | ^4.15.x | Email templates | templates |
| `xstate` | ^5.x | State machines | workflows |
| `zod` | ^3.22.x | Validation | validation |
| `decimal.js` | ^10.x | Precise math | calculations |
| `node-cron` | ^3.x | Cron parsing | scheduling |
| `date-fns` | ^3.x | Date utilities | scheduling |
| `rrule` | ^2.8.x | Recurring rules | scheduling |
| `i18next` | ^23.x | i18n framework | localization |
| `intl-messageformat` | ^10.x | ICU messages | localization |
| `sharp` | ^0.33.x | Image processing | media |
| `ffmpeg` | system | Video processing | media |
| `pdfmake` | ^0.2.x | PDF generation | export |
| `exceljs` | ^4.4.x | Excel files | export |
| `papaparse` | ^5.4.x | CSV parsing | import |

### Internal Dependencies

| Package | Purpose |
|---------|---------|
| `@mcv/kernel` | Core primitives |
| `@mcv/fabric` | Storage, jobs, events |
| `@mcv/api` | tRPC router integration |
| `@mcv/connectors` | External service calls |

---

## Security Considerations

### Template Security
- **Sandbox Execution** — Template helpers run in restricted context
- **Input Sanitization** — All variables escaped by default
- **No Arbitrary Code** — Templates cannot execute arbitrary code

### Data Security
- **PII Handling** — Mask sensitive data in exports
- **Access Control** — Export permissions per entity type
- **Signed URLs** — Time-limited download links
- **Audit Logging** — All exports logged

### Import Security
- **File Scanning** — Malware detection on uploads
- **Size Limits** — Maximum file size per type
- **Rate Limiting** — Import frequency limits
- **Validation** — Strict schema validation

---

## Performance Considerations

### Caching Strategy
- **Translation Cache** — In-memory translation cache per locale
- **Theme Cache** — Compiled themes cached
- **Calculation Cache** — Tax rate lookups cached

### Async Processing
- **Media Processing** — Background jobs for transcoding
- **Large Exports** — Streamed to storage
- **Bulk Imports** — Chunked processing

### Resource Limits
| Resource | Limit |
|----------|-------|
| Max template size | 1 MB |
| Max import file size | 50 MB |
| Max export rows | 100,000 |
| Max media file size | 500 MB |
| Max video duration | 2 hours |

---

## Package Exports

```typescript
// @mcv/shared/index.ts

// Templates
export { TemplateEngine, renderTemplate, registerHelper } from './templates';
export type { Template, TemplateVariable, RenderContext } from './templates';

// Workflows
export { WorkflowEngine, defineWorkflow } from './workflows';
export type { WorkflowDefinition, WorkflowInstance, WorkflowStep } from './workflows';

// Validation
export { createValidator, validateEntity, ValidationRule } from './validation';
export type { ValidationResult, ValidationError } from './validation';

// Calculations
export { PricingEngine, TaxCalculator, CurrencyConverter } from './calculations';
export type { PriceCalculation, Money, TaxRule } from './calculations';

// Scheduling
export { Scheduler, BookingEngine, AvailabilityManager } from './scheduling';
export type { ScheduleDefinition, BookingSlot, AvailabilityWindow } from './scheduling';

// Localization
export { i18n, translate, formatNumber, formatDate, formatRelative } from './localization';
export type { Translation, LocaleConfig } from './localization';

// Theming
export { ThemeEngine, createTheme, resolveTokens } from './theming';
export type { Theme, ThemeTokens, ColorScale } from './theming';

// Media
export { MediaProcessor, ImageTransformer, VideoTranscoder } from './media';
export type { MediaAsset, MediaVariant, ImageTransform } from './media';

// Export
export { PDFGenerator, CSVExporter, ExcelBuilder } from './export';
export type { ExportJob, PDFOptions, CSVOptions, ExcelOptions } from './export';

// Import
export { ImportParser, CSVImporter, DataMapper } from './import';
export type { ImportJob, FieldMapping, ImportReport } from './import';

// Versioning
export { MigrationRunner, ChangeTracker } from './versioning';
export type { Migration, VersionedEntity, ChangeTrack } from './versioning';
```

---

## Related Documentation

- [templates Module](./templates/MODULE.md)
- [workflows Module](./workflows/MODULE.md)
- [validation Module](./validation/MODULE.md)
- [calculations Module](./calculations/MODULE.md)
- [scheduling Module](./scheduling/MODULE.md)
- [localization Module](./localization/MODULE.md)
- [theming Module](./theming/MODULE.md)
- [media Module](./media/MODULE.md)
- [export Module](./export/MODULE.md)
- [import Module](./import/MODULE.md)
- [versioning Module](./versioning/MODULE.md)

---

*@mcv/shared — Business Building Blocks for MCV.ONE*
