# @mcv/shared — API Reference
## Complete Schema, Routes & Type Definitions

**Package:** `@mcv/shared`  
**Classification:** INTERNAL  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## Table of Contents

1. [TypeScript Types](#typescript-types)
2. [Zod Schemas](#zod-schemas)
3. [tRPC Routes](#trpc-routes)
4. [Service APIs](#service-apis)

---

## TypeScript Types

### Templates Module

```typescript
// @mcv/shared/templates/types.ts

import { UUID, VentureID, ISOTimestamp } from '@mcv/kernel/types';

// ============================================================================
// TEMPLATE TYPES
// ============================================================================

export type TemplateType = 'email' | 'notification' | 'document' | 'sms' | 'slack';

export interface Template {
  id: UUID;
  ventureId: VentureID;
  type: TemplateType;
  name: string;
  slug: string;
  subject?: string;
  body: string;
  bodyPlain?: string;
  locale: string;
  variables: TemplateVariable[];
  helpers: string[];
  layoutId?: UUID;
  metadata: Record<string, unknown>;
  version: number;
  isActive: boolean;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
  createdBy?: UUID;
  updatedBy?: UUID;
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  required: boolean;
  defaultValue?: unknown;
  description: string;
}

export interface RenderContext {
  ventureId: VentureID;
  locale: string;
  variables: Record<string, unknown>;
  helpers?: Record<string, HelperFunction>;
  partials?: Record<string, string>;
}

export type HelperFunction = (...args: unknown[]) => string;

export interface RenderResult {
  subject?: string;
  html: string;
  text?: string;
  metadata?: Record<string, unknown>;
}

export interface TemplateLayout {
  id: UUID;
  ventureId: VentureID;
  name: string;
  slug: string;
  body: string;
  contentPlaceholder: string;
  isDefault: boolean;
}
```

### Workflows Module

```typescript
// @mcv/shared/workflows/types.ts

export type WorkflowStateType = 'initial' | 'intermediate' | 'final' | 'parallel' | 'history';

export interface WorkflowDefinition {
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
  isActive: boolean;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}

export interface WorkflowState {
  name: string;
  type: WorkflowStateType;
  onEntry?: WorkflowAction[];
  onExit?: WorkflowAction[];
  timeout?: {
    duration: string;
    action: 'transition' | 'notify' | 'escalate';
    target?: string;
  };
  metadata: Record<string, unknown>;
}

export interface WorkflowTransition {
  from: string | string[];
  to: string;
  event: string;
  guards?: WorkflowGuard[];
  actions?: WorkflowAction[];
}

export interface WorkflowGuard {
  type: 'condition' | 'permission' | 'custom';
  expression: string;
  params?: Record<string, unknown>;
}

export interface WorkflowAction {
  type: 'notify' | 'update' | 'trigger' | 'log' | 'custom';
  handler: string;
  params?: Record<string, unknown>;
  async?: boolean;
}

export interface WorkflowHooks {
  onStart?: WorkflowAction[];
  onComplete?: WorkflowAction[];
  onError?: WorkflowAction[];
  onTimeout?: WorkflowAction[];
}

export interface WorkflowContextSchema {
  properties: Record<string, {
    type: string;
    required?: boolean;
    default?: unknown;
  }>;
}

export interface WorkflowInstance {
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

export interface WorkflowEvent {
  id: UUID;
  instanceId: UUID;
  type: 'transition' | 'action' | 'error' | 'timeout';
  fromState?: string;
  toState?: string;
  event?: string;
  data?: Record<string, unknown>;
  timestamp: ISOTimestamp;
  triggeredBy?: UUID;
}
```

### Validation Module

```typescript
// @mcv/shared/validation/types.ts

export type ValidationRuleType =
  | 'required' | 'optional'
  | 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object'
  | 'email' | 'url' | 'phone' | 'postalCode'
  | 'min' | 'max' | 'range' | 'length' | 'pattern'
  | 'enum' | 'oneOf' | 'noneOf'
  | 'unique' | 'exists'
  | 'custom' | 'async';

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationRule {
  id: string;
  name: string;
  field?: string;
  fields?: string[];
  type: ValidationRuleType;
  params: Record<string, unknown>;
  condition?: ValidationCondition;
  message: string | LocalizedString;
  severity: ValidationSeverity;
  group?: string;
}

export interface ValidationCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
  value: unknown;
}

export interface LocalizedString {
  [locale: string]: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export interface ValidationError {
  field: string;
  rule: string;
  message: string;
  params?: Record<string, unknown>;
  severity: ValidationSeverity;
}

export interface ValidationSchema {
  id: UUID;
  ventureId: VentureID;
  name: string;
  entityType: string;
  rules: ValidationRule[];
  groups?: string[];
  version: number;
  isActive: boolean;
}

export type ValidatorFn<T = unknown> = (
  value: T,
  context?: ValidationContext
) => ValidationResult | Promise<ValidationResult>;

export interface ValidationContext {
  ventureId: VentureID;
  entityType: string;
  entityId?: UUID;
  mode: 'create' | 'update' | 'partial';
  locale: string;
}
```

### Calculations Module

```typescript
// @mcv/shared/calculations/types.ts

export interface Money {
  amount: string;
  currency: CurrencyCode;
  display: string;
}

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY' | string;

export interface LineItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: string;
  currency: CurrencyCode;
  taxCode?: string;
  discountable: boolean;
  metadata?: Record<string, unknown>;
}

export interface PriceCalculationInput {
  items: LineItem[];
  currency: CurrencyCode;
  taxContext: TaxContext;
  discounts: DiscountCode[];
  customer?: CustomerContext;
}

export interface PriceCalculationOutput {
  subtotal: Money;
  discounts: AppliedDiscount[];
  discountTotal: Money;
  taxableAmount: Money;
  taxes: AppliedTax[];
  taxTotal: Money;
  total: Money;
  breakdown: CalculationBreakdown[];
}

export interface TaxContext {
  jurisdiction: string;
  customerType: 'individual' | 'business';
  taxExempt: boolean;
  taxId?: string;
  shippingAddress?: Address;
  billingAddress?: Address;
}

export interface CustomerContext {
  id: UUID;
  type: 'individual' | 'business';
  tier?: string;
  loyaltyPoints?: number;
}

export interface Address {
  country: string;
  state?: string;
  city?: string;
  postalCode?: string;
}

export interface DiscountCode {
  code: string;
  type: 'percentage' | 'fixed' | 'bogo' | 'shipping';
  value: string;
  minPurchase?: string;
  maxDiscount?: string;
  applicableItems?: string[];
  stackable: boolean;
}

export interface AppliedDiscount {
  code: string;
  type: string;
  amount: Money;
  itemsAffected: string[];
}

export interface TaxRule {
  id: UUID;
  ventureId: VentureID;
  name: string;
  jurisdiction: string;
  type: 'sales_tax' | 'vat' | 'gst' | 'pst' | 'hst';
  rate: string;
  compound: boolean;
  inclusive: boolean;
  categories: string[];
  validFrom: ISOTimestamp;
  validTo?: ISOTimestamp;
}

export interface AppliedTax {
  ruleId: UUID;
  name: string;
  jurisdiction: string;
  type: string;
  rate: string;
  amount: Money;
  taxableAmount: Money;
}

export interface CalculationBreakdown {
  step: string;
  description: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
}

export interface CurrencyConversionRequest {
  amount: string;
  from: CurrencyCode;
  to: CurrencyCode;
  date?: string;
}

export interface CurrencyConversionResult {
  originalAmount: Money;
  convertedAmount: Money;
  rate: string;
  rateDate: string;
  source: string;
}
```

### Scheduling Module

```typescript
// @mcv/shared/scheduling/types.ts

export type ScheduleType = 'cron' | 'calendar' | 'booking' | 'availability';

export interface ScheduleDefinition {
  id: UUID;
  ventureId: VentureID;
  type: ScheduleType;
  name: string;
  timezone: string;
  schedule: CronSchedule | CalendarSchedule | BookingSchedule;
  metadata: Record<string, unknown>;
  isActive: boolean;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}

export interface CronSchedule {
  expression: string;
  startDate?: ISOTimestamp;
  endDate?: ISOTimestamp;
  maxRuns?: number;
}

export interface CalendarSchedule {
  recurrence?: RecurrenceRule;
  exceptions: ISOTimestamp[];
  timezone: string;
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  byDay?: number[];
  byMonth?: number[];
  byMonthDay?: number[];
  until?: ISOTimestamp;
  count?: number;
}

export interface BookingSchedule {
  slotDuration: number;
  bufferBefore: number;
  bufferAfter: number;
  maxAdvanceDays: number;
  minAdvanceHours: number;
  availability: AvailabilityWindow[];
}

export interface BookingSlot {
  id: UUID;
  resourceId: UUID;
  resourceType: string;
  startTime: ISOTimestamp;
  endTime: ISOTimestamp;
  duration: number;
  bufferBefore: number;
  bufferAfter: number;
  status: 'available' | 'booked' | 'blocked' | 'tentative';
  booking?: Booking;
}

export interface Booking {
  id: UUID;
  ventureId: VentureID;
  slotId: UUID;
  resourceId: UUID;
  customerId: UUID;
  customerName: string;
  customerEmail: string;
  startTime: ISOTimestamp;
  endTime: ISOTimestamp;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: ISOTimestamp;
  confirmedAt?: ISOTimestamp;
  cancelledAt?: ISOTimestamp;
}

export interface AvailabilityWindow {
  id: UUID;
  resourceId: UUID;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  startTime: string;
  endTime: string;
  timezone: string;
  validFrom?: ISOTimestamp;
  validTo?: ISOTimestamp;
  overrides: AvailabilityOverride[];
}

export interface AvailabilityOverride {
  date: string;
  available: boolean;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

export interface AvailabilityQuery {
  resourceId: UUID;
  startDate: ISOTimestamp;
  endDate: ISOTimestamp;
  duration: number;
  timezone: string;
}

export interface AvailabilityResult {
  slots: AvailableSlot[];
  timezone: string;
  generated: ISOTimestamp;
}

export interface AvailableSlot {
  start: ISOTimestamp;
  end: ISOTimestamp;
  duration: number;
}
```

### Localization Module

```typescript
// @mcv/shared/localization/types.ts

export interface Translation {
  id: UUID;
  ventureId: VentureID;
  namespace: string;
  key: string;
  locale: string;
  value: string;
  context?: string;
  metadata: Record<string, unknown>;
  lastUsed?: ISOTimestamp;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}

export interface LocaleConfig {
  locale: string;
  language: string;
  region?: string;
  direction: 'ltr' | 'rtl';
  numberFormat: NumberFormatConfig;
  dateFormat: DateFormatConfig;
  currencyFormat: CurrencyFormatConfig;
  fallbackLocales: string[];
}

export interface NumberFormatConfig {
  decimal: string;
  thousands: string;
  grouping: number[];
  positive: string;
  negative: string;
  percent: string;
}

export interface DateFormatConfig {
  short: string;
  medium: string;
  long: string;
  full: string;
  time: string;
  datetime: string;
  firstDayOfWeek: 0 | 1;
}

export interface CurrencyFormatConfig {
  symbol: string;
  position: 'before' | 'after';
  space: boolean;
  decimals: number;
}

export interface TranslateOptions {
  locale?: string;
  defaultValue?: string;
  count?: number;
  context?: string;
  interpolation?: Record<string, unknown>;
}

export interface FormatNumberOptions {
  style?: 'decimal' | 'currency' | 'percent' | 'unit';
  currency?: CurrencyCode;
  unit?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  notation?: 'standard' | 'scientific' | 'engineering' | 'compact';
  compactDisplay?: 'short' | 'long';
}

export interface FormatDateOptions {
  format?: 'short' | 'medium' | 'long' | 'full' | 'relative' | string;
  timezone?: string;
  locale?: string;
}

export interface RelativeTimeOptions {
  unit?: 'auto' | 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second';
  style?: 'long' | 'short' | 'narrow';
  numeric?: 'always' | 'auto';
}
```

### Theming Module

```typescript
// @mcv/shared/theming/types.ts

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface Theme {
  id: UUID;
  ventureId: VentureID;
  name: string;
  slug: string;
  mode: ThemeMode;
  parent?: UUID;
  tokens: ThemeTokens;
  components: ComponentThemes;
  metadata: Record<string, unknown>;
  version: number;
  isActive: boolean;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}

export interface ThemeTokens {
  colors: {
    primitives: Record<string, string>;
    semantic: SemanticColors;
    surface: SurfaceColors;
  };
  typography: {
    fonts: FontConfig;
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

export interface SemanticColors {
  primary: ColorScale;
  secondary: ColorScale;
  accent: ColorScale;
  neutral: ColorScale;
  success: ColorScale;
  warning: ColorScale;
  error: ColorScale;
  info: ColorScale;
}

export interface SurfaceColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  muted: string;
  mutedForeground: string;
}

export interface ColorScale {
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

export interface FontConfig {
  sans: string;
  serif: string;
  mono: string;
}

export interface TypeScale {
  fontSize: string;
  lineHeight: string;
  letterSpacing?: string;
  fontWeight?: number;
}

export interface ComponentThemes {
  [componentName: string]: {
    defaultProps?: Record<string, unknown>;
    variants?: Record<string, Record<string, string>>;
    slots?: Record<string, string>;
  };
}

export interface ThemeGeneratorOptions {
  primaryColor: string;
  mode: ThemeMode;
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  fontFamily?: string;
}
```

### Media Module

```typescript
// @mcv/shared/media/types.ts

export type MediaType = 'image' | 'video' | 'audio' | 'document';

export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface MediaAsset {
  id: UUID;
  ventureId: VentureID;
  type: MediaType;
  originalFilename: string;
  mimeType: string;
  size: number;
  storage: MediaStorage;
  metadata: MediaMetadata;
  variants: MediaVariant[];
  processing: {
    status: ProcessingStatus;
    error?: string;
    startedAt?: ISOTimestamp;
    completedAt?: ISOTimestamp;
  };
  createdAt: ISOTimestamp;
  createdBy?: UUID;
}

export interface MediaStorage {
  bucket: string;
  key: string;
  url: string;
  cdnUrl?: string;
}

export interface MediaMetadata {
  width?: number;
  height?: number;
  duration?: number;
  codec?: string;
  bitrate?: number;
  frameRate?: number;
  colorSpace?: string;
  hasAlpha?: boolean;
  exif?: Record<string, unknown>;
}

export interface MediaVariant {
  name: string;
  width: number;
  height: number;
  format: string;
  quality: number;
  storage: MediaStorage;
  size: number;
}

export interface ImageTransform {
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

export interface ProcessingPipeline {
  name: string;
  input: MediaType[];
  output: PipelineOutput[];
}

export interface PipelineOutput {
  name: string;
  transform: ImageTransform;
}

export interface VideoTranscodeOptions {
  format: 'mp4' | 'webm' | 'hls' | 'dash';
  codec: 'h264' | 'h265' | 'vp9' | 'av1';
  resolution: '480p' | '720p' | '1080p' | '4k';
  bitrate?: number;
  fps?: number;
  audioCodec?: 'aac' | 'opus';
  audioBitrate?: number;
}
```

### Export Module

```typescript
// @mcv/shared/export/types.ts

export type ExportFormat = 'pdf' | 'csv' | 'xlsx' | 'json';

export type ExportStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface ExportJob {
  id: UUID;
  ventureId: VentureID;
  type: ExportFormat;
  name: string;
  templateId?: UUID;
  data: ExportData;
  options: ExportOptions;
  status: ExportStatus;
  output?: ExportOutput;
  error?: string;
  requestedBy: UUID;
  createdAt: ISOTimestamp;
  completedAt?: ISOTimestamp;
}

export interface ExportData {
  source: 'query' | 'array' | 'stream';
  query?: string;
  params?: Record<string, unknown>;
  rows?: Record<string, unknown>[];
}

export interface ExportOutput {
  url: string;
  signedUrl: string;
  signedUrlExpires: ISOTimestamp;
  filename: string;
  size: number;
  mimeType: string;
}

export type ExportOptions = PDFOptions | CSVOptions | ExcelOptions | JSONOptions;

export interface PDFOptions {
  format: 'pdf';
  template?: string | UUID;
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

export interface CSVOptions {
  format: 'csv';
  delimiter: ',' | ';' | '\t';
  quote: '"' | "'";
  escape: '\\' | '"';
  header: boolean;
  columns: CSVColumn[];
  encoding: 'utf-8' | 'utf-16' | 'latin1';
  lineEnding: 'lf' | 'crlf';
}

export interface CSVColumn {
  field: string;
  header: string;
  format?: (value: unknown) => string;
  width?: number;
}

export interface ExcelOptions {
  format: 'xlsx';
  sheets: ExcelSheet[];
  styles?: ExcelStyles;
  protection?: ExcelProtection;
}

export interface ExcelSheet {
  name: string;
  columns: ExcelColumn[];
  data: Record<string, unknown>[];
  freezePane?: { row: number; col: number };
  autoFilter?: boolean;
}

export interface ExcelColumn {
  field: string;
  header: string;
  width?: number;
  format?: string;
  style?: Record<string, unknown>;
}

export interface ExcelStyles {
  headerStyle?: Record<string, unknown>;
  rowStyle?: Record<string, unknown>;
  alternateRowStyle?: Record<string, unknown>;
}

export interface ExcelProtection {
  password?: string;
  sheet?: boolean;
  objects?: boolean;
  scenarios?: boolean;
}

export interface JSONOptions {
  format: 'json';
  pretty: boolean;
  includeMetadata: boolean;
}
```

### Import Module

```typescript
// @mcv/shared/import/types.ts

export type ImportFormat = 'csv' | 'xlsx' | 'json' | 'xml';

export type ImportStatus =
  | 'uploaded'
  | 'parsing'
  | 'mapped'
  | 'validating'
  | 'previewing'
  | 'importing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface ImportJob {
  id: UUID;
  ventureId: VentureID;
  type: string;
  source: ImportSource;
  mapping: FieldMapping[];
  options: ImportOptions;
  status: ImportStatus;
  progress: ImportProgress;
  errors: ImportError[];
  report?: ImportReport;
  createdBy: UUID;
  createdAt: ISOTimestamp;
  completedAt?: ISOTimestamp;
}

export interface ImportSource {
  filename: string;
  format: ImportFormat;
  size: number;
  encoding: string;
  url: string;
}

export interface FieldMapping {
  source: string;
  target: string;
  transform?: FieldTransform;
  defaultValue?: unknown;
  required: boolean;
}

export interface FieldTransform {
  type: 'lowercase' | 'uppercase' | 'trim' | 'date' | 'number' | 'boolean' | 'custom';
  params?: Record<string, unknown>;
  customFn?: string;
}

export interface ImportOptions {
  skipHeader: boolean;
  batchSize: number;
  onDuplicate: 'skip' | 'update' | 'error';
  duplicateKey?: string[];
  validateOnly: boolean;
  dryRun: boolean;
}

export interface ImportProgress {
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
}

export interface ImportError {
  row: number;
  column?: string;
  field?: string;
  value?: unknown;
  error: string;
  severity: 'error' | 'warning';
}

export interface ImportReport {
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

export interface ImportPreview {
  headers: string[];
  sampleRows: Record<string, unknown>[];
  totalRows: number;
  suggestedMappings: FieldMapping[];
}
```

### Versioning Module

```typescript
// @mcv/shared/versioning/types.ts

export interface Migration {
  id: string;
  name: string;
  version: number;
  dependencies: string[];
  up: MigrationStep[];
  down: MigrationStep[];
  checksum: string;
  appliedAt?: ISOTimestamp;
  rollbackAt?: ISOTimestamp;
}

export interface MigrationStep {
  type: 'sql' | 'script' | 'function';
  content: string;
  params?: Record<string, unknown>;
  timeout?: number;
}

export interface VersionedEntity {
  version: number;
  versionTimestamp: ISOTimestamp;
  previousVersionId?: UUID;
  changeType: 'create' | 'update' | 'delete';
  changedBy: UUID;
  changedFields?: string[];
}

export interface ChangeTrack {
  id: UUID;
  entityType: string;
  entityId: UUID;
  ventureId: VentureID;
  version: number;
  operation: 'create' | 'update' | 'delete';
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  diff?: FieldChange[];
  userId: UUID;
  timestamp: ISOTimestamp;
  metadata?: Record<string, unknown>;
}

export interface FieldChange {
  field: string;
  path?: string;
  before: unknown;
  after: unknown;
}

export interface MigrationStatus {
  current: string;
  pending: Migration[];
  applied: Migration[];
  failed?: Migration;
  lastRun: ISOTimestamp;
}

export interface MigrationRunOptions {
  dryRun?: boolean;
  target?: string;
  step?: number;
  force?: boolean;
}

export interface MigrationRunResult {
  success: boolean;
  migrationsRun: string[];
  error?: string;
  duration: number;
}
```

---

## Zod Schemas

```typescript
// @mcv/shared/schemas/index.ts

import { z } from 'zod';

// ============================================================================
// TEMPLATE SCHEMAS
// ============================================================================

export const templateTypeSchema = z.enum(['email', 'notification', 'document', 'sms', 'slack']);

export const templateVariableSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['string', 'number', 'boolean', 'date', 'array', 'object']),
  required: z.boolean(),
  defaultValue: z.unknown().optional(),
  description: z.string(),
});

export const createTemplateSchema = z.object({
  type: templateTypeSchema,
  name: z.string().min(1).max(200),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  subject: z.string().optional(),
  body: z.string().min(1),
  bodyPlain: z.string().optional(),
  locale: z.string().default('en'),
  variables: z.array(templateVariableSchema).optional().default([]),
  helpers: z.array(z.string()).optional().default([]),
  layoutId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional().default({}),
});

export const renderTemplateSchema = z.object({
  templateId: z.string().uuid().optional(),
  templateSlug: z.string().optional(),
  locale: z.string().optional(),
  variables: z.record(z.unknown()),
});

// ============================================================================
// WORKFLOW SCHEMAS
// ============================================================================

export const workflowStateTypeSchema = z.enum(['initial', 'intermediate', 'final', 'parallel', 'history']);

export const workflowActionSchema = z.object({
  type: z.enum(['notify', 'update', 'trigger', 'log', 'custom']),
  handler: z.string(),
  params: z.record(z.unknown()).optional(),
  async: z.boolean().optional(),
});

export const workflowStateSchema = z.object({
  name: z.string().min(1),
  type: workflowStateTypeSchema,
  onEntry: z.array(workflowActionSchema).optional(),
  onExit: z.array(workflowActionSchema).optional(),
  timeout: z.object({
    duration: z.string(),
    action: z.enum(['transition', 'notify', 'escalate']),
    target: z.string().optional(),
  }).optional(),
  metadata: z.record(z.unknown()).optional().default({}),
});

export const workflowTransitionSchema = z.object({
  from: z.union([z.string(), z.array(z.string())]),
  to: z.string(),
  event: z.string(),
  guards: z.array(z.object({
    type: z.enum(['condition', 'permission', 'custom']),
    expression: z.string(),
    params: z.record(z.unknown()).optional(),
  })).optional(),
  actions: z.array(workflowActionSchema).optional(),
});

export const createWorkflowSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  initialState: z.string(),
  states: z.array(workflowStateSchema),
  transitions: z.array(workflowTransitionSchema),
  context: z.object({
    properties: z.record(z.object({
      type: z.string(),
      required: z.boolean().optional(),
      default: z.unknown().optional(),
    })),
  }).optional(),
  hooks: z.object({
    onStart: z.array(workflowActionSchema).optional(),
    onComplete: z.array(workflowActionSchema).optional(),
    onError: z.array(workflowActionSchema).optional(),
    onTimeout: z.array(workflowActionSchema).optional(),
  }).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const triggerTransitionSchema = z.object({
  instanceId: z.string().uuid(),
  event: z.string(),
  data: z.record(z.unknown()).optional(),
});

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

export const validationRuleTypeSchema = z.enum([
  'required', 'optional', 'string', 'number', 'boolean', 'date', 'array', 'object',
  'email', 'url', 'phone', 'postalCode', 'min', 'max', 'range', 'length', 'pattern',
  'enum', 'oneOf', 'noneOf', 'unique', 'exists', 'custom', 'async',
]);

export const validationRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  field: z.string().optional(),
  fields: z.array(z.string()).optional(),
  type: validationRuleTypeSchema,
  params: z.record(z.unknown()),
  condition: z.object({
    field: z.string(),
    operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'contains']),
    value: z.unknown(),
  }).optional(),
  message: z.union([z.string(), z.record(z.string())]),
  severity: z.enum(['error', 'warning', 'info']),
  group: z.string().optional(),
});

export const validateEntitySchema = z.object({
  entityType: z.string(),
  data: z.record(z.unknown()),
  mode: z.enum(['create', 'update', 'partial']).optional(),
  groups: z.array(z.string()).optional(),
});

// ============================================================================
// CALCULATION SCHEMAS
// ============================================================================

export const lineItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  quantity: z.number().positive(),
  unitPrice: z.string(),
  currency: z.string().length(3),
  taxCode: z.string().optional(),
  discountable: z.boolean().default(true),
  metadata: z.record(z.unknown()).optional(),
});

export const taxContextSchema = z.object({
  jurisdiction: z.string(),
  customerType: z.enum(['individual', 'business']),
  taxExempt: z.boolean().default(false),
  taxId: z.string().optional(),
  shippingAddress: z.object({
    country: z.string(),
    state: z.string().optional(),
    city: z.string().optional(),
    postalCode: z.string().optional(),
  }).optional(),
  billingAddress: z.object({
    country: z.string(),
    state: z.string().optional(),
    city: z.string().optional(),
    postalCode: z.string().optional(),
  }).optional(),
});

export const calculatePriceSchema = z.object({
  items: z.array(lineItemSchema),
  currency: z.string().length(3),
  taxContext: taxContextSchema,
  discounts: z.array(z.object({
    code: z.string(),
    type: z.enum(['percentage', 'fixed', 'bogo', 'shipping']),
    value: z.string(),
    minPurchase: z.string().optional(),
    maxDiscount: z.string().optional(),
    applicableItems: z.array(z.string()).optional(),
    stackable: z.boolean().default(false),
  })).optional().default([]),
  customerId: z.string().uuid().optional(),
});

export const convertCurrencySchema = z.object({
  amount: z.string(),
  from: z.string().length(3),
  to: z.string().length(3),
  date: z.string().optional(),
});

// ============================================================================
// SCHEDULING SCHEMAS
// ============================================================================

export const cronScheduleSchema = z.object({
  expression: z.string(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  maxRuns: z.number().positive().optional(),
});

export const recurrenceRuleSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  interval: z.number().positive().default(1),
  byDay: z.array(z.number().min(0).max(6)).optional(),
  byMonth: z.array(z.number().min(1).max(12)).optional(),
  byMonthDay: z.array(z.number().min(1).max(31)).optional(),
  until: z.string().datetime().optional(),
  count: z.number().positive().optional(),
});

export const availabilityWindowSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  timezone: z.string(),
  validFrom: z.string().datetime().optional(),
  validTo: z.string().datetime().optional(),
});

export const createBookingSchema = z.object({
  resourceId: z.string().uuid(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  customerName: z.string(),
  customerEmail: z.string().email(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const queryAvailabilitySchema = z.object({
  resourceId: z.string().uuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  duration: z.number().positive(),
  timezone: z.string(),
});

// ============================================================================
// LOCALIZATION SCHEMAS
// ============================================================================

export const createTranslationSchema = z.object({
  namespace: z.string(),
  key: z.string(),
  locale: z.string(),
  value: z.string(),
  context: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const translateSchema = z.object({
  key: z.string(),
  namespace: z.string().optional(),
  locale: z.string().optional(),
  defaultValue: z.string().optional(),
  count: z.number().optional(),
  context: z.string().optional(),
  interpolation: z.record(z.unknown()).optional(),
});

export const formatNumberSchema = z.object({
  value: z.number(),
  style: z.enum(['decimal', 'currency', 'percent', 'unit']).optional(),
  currency: z.string().optional(),
  unit: z.string().optional(),
  locale: z.string().optional(),
  minimumFractionDigits: z.number().optional(),
  maximumFractionDigits: z.number().optional(),
  notation: z.enum(['standard', 'scientific', 'engineering', 'compact']).optional(),
});

export const formatDateSchema = z.object({
  date: z.union([z.string(), z.date()]),
  format: z.string().optional(),
  timezone: z.string().optional(),
  locale: z.string().optional(),
});

// ============================================================================
// THEMING SCHEMAS
// ============================================================================

export const colorScaleSchema = z.object({
  50: z.string(),
  100: z.string(),
  200: z.string(),
  300: z.string(),
  400: z.string(),
  500: z.string(),
  600: z.string(),
  700: z.string(),
  800: z.string(),
  900: z.string(),
  950: z.string(),
});

export const createThemeSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  mode: z.enum(['light', 'dark', 'auto']),
  parent: z.string().uuid().optional(),
  tokens: z.object({
    colors: z.object({
      primary: colorScaleSchema.optional(),
      secondary: colorScaleSchema.optional(),
      accent: colorScaleSchema.optional(),
    }).optional(),
    typography: z.object({
      fonts: z.object({
        sans: z.string().optional(),
        serif: z.string().optional(),
        mono: z.string().optional(),
      }).optional(),
    }).optional(),
    spacing: z.record(z.string()).optional(),
    radii: z.record(z.string()).optional(),
  }).optional(),
  components: z.record(z.object({
    defaultProps: z.record(z.unknown()).optional(),
    variants: z.record(z.record(z.string())).optional(),
  })).optional(),
});

export const generateThemeSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  mode: z.enum(['light', 'dark', 'auto']),
  borderRadius: z.enum(['none', 'sm', 'md', 'lg', 'full']).optional(),
  fontFamily: z.string().optional(),
});

// ============================================================================
// MEDIA SCHEMAS
// ============================================================================

export const imageTransformSchema = z.object({
  resize: z.object({
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
    fit: z.enum(['cover', 'contain', 'fill', 'inside', 'outside']),
    position: z.string().optional(),
  }).optional(),
  crop: z.object({
    x: z.number().min(0),
    y: z.number().min(0),
    width: z.number().positive(),
    height: z.number().positive(),
  }).optional(),
  rotate: z.number().min(-360).max(360).optional(),
  flip: z.enum(['horizontal', 'vertical']).optional(),
  format: z.enum(['jpeg', 'png', 'webp', 'avif']).optional(),
  quality: z.number().min(1).max(100).optional(),
  blur: z.number().min(0).max(100).optional(),
  sharpen: z.boolean().optional(),
  grayscale: z.boolean().optional(),
  watermark: z.object({
    image: z.string(),
    position: z.enum(['center', 'nw', 'ne', 'sw', 'se']),
    opacity: z.number().min(0).max(1),
  }).optional(),
});

export const processMediaSchema = z.object({
  assetId: z.string().uuid(),
  pipeline: z.string().optional(),
  transforms: z.array(z.object({
    name: z.string(),
    transform: imageTransformSchema,
  })).optional(),
});

// ============================================================================
// EXPORT SCHEMAS
// ============================================================================

export const pdfOptionsSchema = z.object({
  format: z.literal('pdf'),
  template: z.string().optional(),
  pageSize: z.enum(['letter', 'a4', 'legal']),
  orientation: z.enum(['portrait', 'landscape']),
  margins: z.object({
    top: z.number(),
    right: z.number(),
    bottom: z.number(),
    left: z.number(),
  }),
  header: z.string().optional(),
  footer: z.string().optional(),
  watermark: z.object({
    text: z.string(),
    opacity: z.number().min(0).max(1),
  }).optional(),
});

export const csvOptionsSchema = z.object({
  format: z.literal('csv'),
  delimiter: z.enum([',', ';', '\t']),
  quote: z.enum(['"', "'"]),
  escape: z.enum(['\\', '"']),
  header: z.boolean(),
  columns: z.array(z.object({
    field: z.string(),
    header: z.string(),
    width: z.number().optional(),
  })),
  encoding: z.enum(['utf-8', 'utf-16', 'latin1']),
  lineEnding: z.enum(['lf', 'crlf']),
});

export const createExportJobSchema = z.object({
  name: z.string(),
  type: z.enum(['pdf', 'csv', 'xlsx', 'json']),
  templateId: z.string().uuid().optional(),
  query: z.string().optional(),
  params: z.record(z.unknown()).optional(),
  options: z.union([pdfOptionsSchema, csvOptionsSchema]).optional(),
});

// ============================================================================
// IMPORT SCHEMAS
// ============================================================================

export const fieldMappingSchema = z.object({
  source: z.string(),
  target: z.string(),
  transform: z.object({
    type: z.enum(['lowercase', 'uppercase', 'trim', 'date', 'number', 'boolean', 'custom']),
    params: z.record(z.unknown()).optional(),
    customFn: z.string().optional(),
  }).optional(),
  defaultValue: z.unknown().optional(),
  required: z.boolean(),
});

export const createImportJobSchema = z.object({
  type: z.string(),
  fileUrl: z.string().url(),
  mapping: z.array(fieldMappingSchema),
  options: z.object({
    skipHeader: z.boolean().default(true),
    batchSize: z.number().positive().default(100),
    onDuplicate: z.enum(['skip', 'update', 'error']).default('skip'),
    duplicateKey: z.array(z.string()).optional(),
    validateOnly: z.boolean().default(false),
    dryRun: z.boolean().default(false),
  }).optional(),
});

// ============================================================================
// VERSIONING SCHEMAS
// ============================================================================

export const migrationStepSchema = z.object({
  type: z.enum(['sql', 'script', 'function']),
  content: z.string(),
  params: z.record(z.unknown()).optional(),
  timeout: z.number().positive().optional(),
});

export const createMigrationSchema = z.object({
  name: z.string(),
  dependencies: z.array(z.string()).optional(),
  up: z.array(migrationStepSchema),
  down: z.array(migrationStepSchema),
});

export const runMigrationSchema = z.object({
  target: z.string().optional(),
  step: z.number().positive().optional(),
  dryRun: z.boolean().optional(),
  force: z.boolean().optional(),
});
```

---

## tRPC Routes

```typescript
// @mcv/shared/server/router.ts

import { router, protectedProcedure, ventureProcedure } from '@mcv/api/trpc';
import * as schemas from '../schemas';

// ============================================================================
// TEMPLATES ROUTER
// ============================================================================

export const templatesRouter = router({
  create: ventureProcedure
    .input(schemas.createTemplateSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.shared.templates.create({
        ...input,
        ventureId: ctx.venture.id,
      });
    }),

  get: ventureProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.shared.templates.get(ctx.venture.id, input.id);
    }),

  getBySlug: ventureProcedure
    .input(z.object({ slug: z.string(), type: schemas.templateTypeSchema }))
    .query(async ({ ctx, input }) => {
      return ctx.shared.templates.getBySlug(ctx.venture.id, input.slug, input.type);
    }),

  list: ventureProcedure
    .input(z.object({
      type: schemas.templateTypeSchema.optional(),
      locale: z.string().optional(),
      isActive: z.boolean().optional(),
      cursor: z.string().optional(),
      limit: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.shared.templates.list(ctx.venture.id, input);
    }),

  update: ventureProcedure
    .input(z.object({
      id: z.string().uuid(),
      data: schemas.createTemplateSchema.partial(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.shared.templates.update(ctx.venture.id, input.id, input.data);
    }),

  delete: ventureProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.shared.templates.delete(ctx.venture.id, input.id);
    }),

  render: ventureProcedure
    .input(schemas.renderTemplateSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.shared.templates.render({
        ...input,
        ventureId: ctx.venture.id,
      });
    }),

  preview: ventureProcedure
    .input(z.object({
      body: z.string(),
      variables: z.record(z.unknown()),
      locale: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.shared.templates.preview(input);
    }),
});

// ============================================================================
// WORKFLOWS ROUTER
// ============================================================================

export const workflowsRouter = router({
  createDefinition: ventureProcedure
    .input(schemas.createWorkflowSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.shared.workflows.createDefinition({
        ...input,
        ventureId: ctx.venture.id,
      });
    }),

  getDefinition: ventureProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.shared.workflows.getDefinition(ctx.venture.id, input.id);
    }),

  listDefinitions: ventureProcedure
    .input(z.object({
      isActive: z.boolean().optional(),
      cursor: z.string().optional(),
      limit: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.shared.workflows.listDefinitions(ctx.venture.id, input);
    }),

  startInstance: ventureProcedure
    .input(z.object({
      definitionId: z.string().uuid(),
      context: z.record(z.unknown()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.shared.workflows.startInstance({
        ...input,
        ventureId: ctx.venture.id,
        startedBy: ctx.user?.id,
      });
    }),

  getInstance: ventureProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.shared.workflows.getInstance(ctx.venture.id, input.id);
    }),

  listInstances: ventureProcedure
    .input(z.object({
      definitionId: z.string().uuid().optional(),
      status: z.enum(['running', 'completed', 'failed', 'cancelled']).optional(),
      cursor: z.string().optional(),
      limit: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.shared.workflows.listInstances(ctx.venture.id, input);
    }),

  triggerTransition: ventureProcedure
    .input(schemas.triggerTransitionSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.shared.workflows.triggerTransition({
        ...input,
        triggeredBy: ctx.user?.id,
      });
    }),

  cancelInstance: ventureProcedure
    .input(z.object({
      id: z.string().uuid(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.shared.workflows.cancelInstance(ctx.venture.id, input.id, {
        reason: input.reason,
        cancelledBy: ctx.user?.id,
      });
    }),

  getHistory: ventureProcedure
    .input(z.object({
      instanceId: z.string().uuid(),
      cursor: z.string().optional(),
      limit: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.shared.workflows.getHistory(ctx.venture.id, input.instanceId, input);
    }),
});

// ============================================================================
// VALIDATION ROUTER
// ============================================================================

export const validationRouter = router({
  validate: ventureProcedure
    .input(schemas.validateEntitySchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.shared.validation.validate({
        ...input,
        ventureId: ctx.venture.id,
      });
    }),

  createSchema: ventureProcedure
    .input(z.object({
      name: z.string(),
      entityType: z.string(),
      rules: z.array(schemas.validationRuleSchema),
      groups: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.shared.validation.createSchema({
        ...input,
        ventureId: ctx.venture.id,
      });
    }),

  getSchema: ventureProcedure
    .input(z.object({ entityType: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.shared.validation.getSchema(ctx.venture.id, input.entityType);
    }),
});

// ============================================================================
// CALCULATIONS ROUTER
// ============================================================================

export const calculationsRouter = router({
  calculatePrice: ventureProcedure
    .input(schemas.calculatePriceSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.shared.calculations.calculatePrice({
        ...input,
        ventureId: ctx.venture.id,
      });
    }),

  convertCurrency: ventureProcedure
    .input(schemas.convertCurrencySchema)
    .query(async ({ ctx, input }) => {
      return ctx.shared.calculations.convertCurrency(input);
    }),

  getTaxRates: ventureProcedure
    .input(z.object({
      jurisdiction: z.string(),
      categories: z.array(z.string()).optional(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.shared.calculations.getTaxRates(ctx.venture.id, input);
    }),

  createTaxRule: ventureProcedure
    .input(z.object({
      name: z.string(),
      jurisdiction: z.string(),
      type: z.enum(['sales_tax', 'vat', 'gst', 'pst', 'hst']),
      rate: z.string(),
      compound: z.boolean().optional(),
      inclusive: z.boolean().optional(),
      categories: z.array(z.string()).optional(),
      validFrom: z.string().datetime(),
      validTo: z.string().datetime().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.shared.calculations.createTaxRule({
        ...input,
        ventureId: ctx.venture.id,
      });
    }),
});

// ============================================================================
// SCHEDULING ROUTER
// ============================================================================

export const schedulingRouter = router({
  getAvailability: ventureProcedure
    .input(schemas.queryAvailabilitySchema)
    .query(async ({ ctx, input }) => {
      return ctx.shared.scheduling.getAvailability(ctx.venture.id, input);
    }),

  createBooking: ventureProcedure
    .input(schemas.createBookingSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.shared.scheduling.createBooking({
        ...input,
        ventureId: ctx.venture.id,
        createdBy: ctx.user?.id,
      });
    }),

  getBooking: ventureProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.shared.scheduling.getBooking(ctx.venture.id, input.id);
    }),

  cancelBooking: ventureProcedure
    .input(z.object({
      id: z.string().uuid(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.shared.scheduling.cancelBooking(ctx.venture.id, input.id, {
        reason: input.reason,
        cancelledBy: ctx.user?.id,
      });
    }),

  setAvailability: ventureProcedure
    .input(z.object({
      resourceId: z.string().uuid(),
      windows: z.array(schemas.availabilityWindowSchema),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.shared.scheduling.setAvailability(ctx.venture.id, input);
    }),

  addOverride: ventureProcedure
    .input(z.object({
      resourceId: z.string().uuid(),
      date: z.string(),
      available: z.boolean(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.shared.scheduling.addOverride(ctx.venture.id, input);
    }),
});

// ============================================================================
// LOCALIZATION ROUTER
// ============================================================================

export const localizationRouter = router({
  translate: ventureProcedure
    .input(schemas.translateSchema)
    .query(async ({ ctx, input }) => {
      return ctx.shared.localization.translate({
        ...input,
        ventureId: ctx.venture.id,
      });
    }),

  translateBatch: ventureProcedure
    .input(z.object({
      keys: z.array(z.string()),
      namespace: z.string().optional(),
      locale: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.shared.localization.translateBatch({
        ...input,
        ventureId: ctx.venture.id,
      });
    }),

  createTranslation: ventureProcedure
    .input(schemas.createTranslationSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.shared.localization.createTranslation({
        ...input,
        ventureId: ctx.venture.id,
      });
    }),

  updateTranslation: ventureProcedure
    .input(z.object({
      id: z.string().uuid(),
      value: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.shared.localization.updateTranslation(ctx.venture.id, input.id, input.value);
    }),

  listTranslations: ventureProcedure
    .input(z.object({
      namespace: z.string().optional(),
      locale: z.string().optional(),
      cursor: z.string().optional(),
      limit: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.shared.localization.listTranslations(ctx.venture.id, input);
    }),

  formatNumber: protectedProcedure
    .input(schemas.formatNumberSchema)
    .query(async ({ ctx, input }) => {
      return ctx.shared.localization.formatNumber(input);
    }),

  formatDate: protectedProcedure
    .input(schemas.formatDateSchema)
    .query(async ({ ctx, input }) => {
      return ctx.shared.localization.formatDate(input);
    }),

  getLocaleConfig: ventureProcedure
    .input(z.object({ locale: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.shared.localization.getLocaleConfig(input.locale);
    }),
});

// ============================================================================
// THEMING ROUTER
// ============================================================================

export const themingRouter = router({
  create: ventureProcedure
    .input(schemas.createThemeSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.shared.theming.create({
        ...input,
        ventureId: ctx.venture.id,
      });
    }),

  get: ventureProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.shared.theming.get(ctx.venture.id, input.id);
    }),

  getBySlug: ventureProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.shared.theming.getBySlug(ctx.venture.id, input.slug);
    }),

  list: ventureProcedure
    .input(z.object({
      mode: z.enum(['light', 'dark', 'auto']).optional(),
      isActive: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.shared.theming.list(ctx.venture.id, input);
    }),

  update: ventureProcedure
    .input(z.object({
      id: z.string().uuid(),
      data: schemas.createThemeSchema.partial(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.shared.theming.update(ctx.venture.id, input.id, input.data);
    }),

  generate: ventureProcedure
    .input(schemas.generateThemeSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.shared.theming.generate(input);
    }),

  resolveTokens: ventureProcedure
    .input(z.object({ themeId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.shared.theming.resolveTokens(ctx.venture.id, input.themeId);
    }),

  getCSSVariables: ventureProcedure
    .input(z.object({ themeId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.shared.theming.getCSSVariables(ctx.venture.id, input.themeId);
    }),
});

// ============================================================================
// MEDIA ROUTER
// ============================================================================

export const mediaRouter = router({
  upload: ventureProcedure
    .input(z.object({
      filename: z.string(),
      mimeType: z.string(),
      size: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.shared.media.getUploadUrl({
        ...input,
        ventureId: ctx.venture.id,
      });
    }),

  get: ventureProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.shared.media.get(ctx.venture.id, input.id);
    }),

  list: ventureProcedure
    .input(z.object({
      type: z.enum(['image', 'video', 'audio', 'document']).optional(),
      cursor: z.string().optional(),
      limit: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.shared.media.list(ctx.venture.id, input);
    }),

  process: ventureProcedure
    .input(schemas.processMediaSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.shared.media.process(ctx.venture.id, input);
    }),

  delete: ventureProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.shared.media.delete(ctx.venture.id, input.id);
    }),

  getVariant: ventureProcedure
    .input(z.object({
      assetId: z.string().uuid(),
      variantName: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.shared.media.getVariant(ctx.venture.id, input.assetId, input.variantName);
    }),
});

// ============================================================================
// EXPORT ROUTER
// ============================================================================

export const exportRouter = router({
  create: ventureProcedure
    .input(schemas.createExportJobSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.shared.export.create({
        ...input,
        ventureId: ctx.venture.id,
        requestedBy: ctx.user!.id,
      });
    }),

  get: ventureProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.shared.export.get(ctx.venture.id, input.id);
    }),

  list: ventureProcedure
    .input(z.object({
      status: z.enum(['queued', 'processing', 'completed', 'failed']).optional(),
      cursor: z.string().optional(),
      limit: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.shared.export.list(ctx.venture.id, input);
    }),

  download: ventureProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.shared.export.getDownloadUrl(ctx.venture.id, input.id);
    }),

  cancel: ventureProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.shared.export.cancel(ctx.venture.id, input.id);
    }),
});

// ============================================================================
// IMPORT ROUTER
// ============================================================================

export const importRouter = router({
  create: ventureProcedure
    .input(schemas.createImportJobSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.shared.import.create({
        ...input,
        ventureId: ctx.venture.id,
        createdBy: ctx.user!.id,
      });
    }),

  get: ventureProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.shared.import.get(ctx.venture.id, input.id);
    }),

  list: ventureProcedure
    .input(z.object({
      status: z.enum(['uploaded', 'parsing', 'mapped', 'validating', 'previewing', 'importing', 'completed', 'failed', 'cancelled']).optional(),
      cursor: z.string().optional(),
      limit: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.shared.import.list(ctx.venture.id, input);
    }),

  preview: ventureProcedure
    .input(z.object({
      id: z.string().uuid(),
      limit: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.shared.import.preview(ctx.venture.id, input.id, input.limit);
    }),

  updateMapping: ventureProcedure
    .input(z.object({
      id: z.string().uuid(),
      mapping: z.array(schemas.fieldMappingSchema),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.shared.import.updateMapping(ctx.venture.id, input.id, input.mapping);
    }),

  start: ventureProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.shared.import.start(ctx.venture.id, input.id);
    }),

  cancel: ventureProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.shared.import.cancel(ctx.venture.id, input.id);
    }),
});

// ============================================================================
// VERSIONING ROUTER
// ============================================================================

export const versioningRouter = router({
  getMigrationStatus: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.shared.versioning.getMigrationStatus();
    }),

  runMigrations: protectedProcedure
    .input(schemas.runMigrationSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.shared.versioning.runMigrations(input);
    }),

  rollback: protectedProcedure
    .input(z.object({
      target: z.string().optional(),
      step: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.shared.versioning.rollback(input);
    }),

  getChangeHistory: ventureProcedure
    .input(z.object({
      entityType: z.string(),
      entityId: z.string().uuid(),
      cursor: z.string().optional(),
      limit: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.shared.versioning.getChangeHistory(ctx.venture.id, input);
    }),

  getEntityAtVersion: ventureProcedure
    .input(z.object({
      entityType: z.string(),
      entityId: z.string().uuid(),
      version: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.shared.versioning.getEntityAtVersion(ctx.venture.id, input);
    }),

  compareVersions: ventureProcedure
    .input(z.object({
      entityType: z.string(),
      entityId: z.string().uuid(),
      fromVersion: z.number(),
      toVersion: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.shared.versioning.compareVersions(ctx.venture.id, input);
    }),
});

// ============================================================================
// MAIN ROUTER
// ============================================================================

export const sharedRouter = router({
  templates: templatesRouter,
  workflows: workflowsRouter,
  validation: validationRouter,
  calculations: calculationsRouter,
  scheduling: schedulingRouter,
  localization: localizationRouter,
  theming: themingRouter,
  media: mediaRouter,
  export: exportRouter,
  import: importRouter,
  versioning: versioningRouter,
});

export type SharedRouter = typeof sharedRouter;
```

---

## Service APIs

### Template Engine

```typescript
// @mcv/shared/templates/engine.ts

export class TemplateEngine {
  /**
   * Register a custom helper function
   */
  registerHelper(name: string, fn: HelperFunction): void;
  
  /**
   * Register a partial template
   */
  registerPartial(name: string, template: string): void;
  
  /**
   * Render a template with variables
   */
  render(template: string, context: RenderContext): Promise<RenderResult>;
  
  /**
   * Compile a template for reuse
   */
  compile(template: string): CompiledTemplate;
  
  /**
   * Validate template syntax
   */
  validate(template: string): ValidationResult;
  
  /**
   * Extract variables from template
   */
  extractVariables(template: string): TemplateVariable[];
}
```

### Pricing Engine

```typescript
// @mcv/shared/calculations/pricing.ts

export class PricingEngine {
  /**
   * Calculate full price with tax and discounts
   */
  calculate(input: PriceCalculationInput): Promise<PriceCalculationOutput>;
  
  /**
   * Apply discounts to line items
   */
  applyDiscounts(items: LineItem[], discounts: DiscountCode[]): AppliedDiscount[];
  
  /**
   * Calculate taxes for items
   */
  calculateTax(items: LineItem[], context: TaxContext): AppliedTax[];
  
  /**
   * Prorate an amount for partial periods
   */
  prorate(amount: string, startDate: Date, endDate: Date, billingPeriod: string): Money;
}
```

### Booking Engine

```typescript
// @mcv/shared/scheduling/booking.ts

export class BookingEngine {
  /**
   * Get available slots for a resource
   */
  getAvailability(query: AvailabilityQuery): Promise<AvailabilityResult>;
  
  /**
   * Create a booking
   */
  createBooking(input: CreateBookingInput): Promise<Booking>;
  
  /**
   * Confirm a pending booking
   */
  confirmBooking(bookingId: UUID): Promise<Booking>;
  
  /**
   * Cancel a booking
   */
  cancelBooking(bookingId: UUID, reason?: string): Promise<Booking>;
  
  /**
   * Reschedule a booking
   */
  rescheduleBooking(bookingId: UUID, newSlot: { startTime: Date; endTime: Date }): Promise<Booking>;
  
  /**
   * Check if a slot is available
   */
  isSlotAvailable(resourceId: UUID, startTime: Date, endTime: Date): Promise<boolean>;
}
```

---

## Related Documentation

- [01-PACKAGE-SPEC.md](./01-PACKAGE-SPEC.md) — Package overview
- [02-TECHNICAL-ARCHITECTURE.md](./02-TECHNICAL-ARCHITECTURE.md) — System design
- [04-IMPLEMENTATION-PLAN.md](./04-IMPLEMENTATION-PLAN.md) — Build roadmap

---

*@mcv/shared — API Reference v1.0*
