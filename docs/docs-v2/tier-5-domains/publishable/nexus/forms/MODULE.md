# @mcv/nexus/forms

> Forms & Surveys — Build, collect, analyze. From simple contact forms to complex multi-step surveys with conditional logic, submission management, and real-time analytics.

**Package:** `@mcv/nexus/forms`
**Since:** 0.9.0
**Status:** Stable
**Domain:** Nexus (Tier 5)
**Maintainer:** MCV Platform Team

---

## Table of Contents

- [Purpose](#purpose)
- [Exports](#exports)
- [Architecture](#architecture)
- [Core Interfaces](#core-interfaces)
- [Database Schemas](#database-schemas)
- [Code Examples](#code-examples)
- [Error Codes](#error-codes)
- [Security](#security)
- [Environment Variables](#environment-variables)
- [Dependencies](#dependencies)
- [Testing](#testing)

---

## Purpose

`@mcv/nexus/forms` is the data-collection backbone of the MCV.ONE platform. It provides everything an organization needs to build forms, run surveys, collect submissions, enforce validation, and analyze responses — all within a multi-tenant, RLS-protected environment.

### Why This Module Exists

Every SaaS platform eventually needs to collect structured data from users: contact requests, feedback surveys, job applications, event registrations, NPS scores. Rather than bolting on third-party form tools (Typeform, Google Forms, JotForm) with their own data silos, auth models, and pricing tiers, `@mcv/nexus/forms` provides a first-party, deeply integrated solution that:

1. **Lives inside your tenant** — submissions are stored alongside your other data, queryable via the same APIs, subject to the same RLS policies.
2. **Integrates natively** — forms can trigger workflows (`@mcv/nexus/workflows`), create CRM contacts (`@mcv/nexus/crm`), send notifications (`@mcv/nexus/notifications`), and pipe data into analytics dashboards.
3. **Respects your brand** — full CSS customization, embeddable components, white-label standalone URLs.
4. **Scales with complexity** — from a 3-field contact form to a 50-question branching survey with quotas, skip logic, and calculated scores.

### Core Capabilities

| Capability | Description |
|---|---|
| **Form Builder** | Drag-and-drop designer with 15+ field types including text, number, email, phone, date, select, checkbox, radio, file upload, signature, rating, and NPS |
| **Conditional Logic** | Show/hide fields based on answers, skip logic, branching paths, calculated fields with expression evaluation |
| **Multi-Step Forms** | Wizard-style multi-page forms with progress indicators, save-and-resume, per-step validation |
| **Form Templates** | Pre-built templates (contact, lead capture, feedback, registration, application) and a template marketplace |
| **Submission Management** | View, filter, search, and export submissions; email notifications; webhook triggers; Zapier integration |
| **Surveys** | Survey-specific features: NPS, CSAT, CES scoring; response quotas; randomized questions; survey branching logic |
| **Embedding** | Embeddable iframe, popup/slide-in modal, standalone URL, React component, custom CSS injection |
| **Validation** | Required fields, regex patterns, min/max values, file type/size limits, custom validation functions |
| **Spam Protection** | reCAPTCHA v3, honeypot fields, rate limiting, IP-based blocking, bot detection heuristics |
| **Analytics** | Submission rate, completion rate, drop-off by field, average completion time, response distribution charts |

---

## Exports

```typescript
// ─── Services ───────────────────────────────────────────────────────
export { FormService }            from './services/form.service';
export { FormFieldService }       from './services/form-field.service';
export { SubmissionService }      from './services/submission.service';
export { SurveyService }          from './services/survey.service';
export { FormTemplateService }    from './services/form-template.service';
export { FormEmbedService }       from './services/form-embed.service';
export { FormAnalyticsService }   from './services/form-analytics.service';
export { FormWebhookService }     from './services/form-webhook.service';
export { ConditionalLogicEngine } from './services/conditional-logic.engine';
export { ValidationEngine }       from './services/validation.engine';
export { SpamProtectionService }  from './services/spam-protection.service';

// ─── Router (tRPC) ─────────────────────────────────────────────────
export { formsRouter }            from './router';
export type { FormsRouter }       from './router';

// ─── Schemas (Drizzle) ─────────────────────────────────────────────
export {
  forms,
  formFields,
  formSubmissions,
  submissionValues,
  conditionalRules,
  formTemplates,
  surveys,
  surveyResponses,
  formEmbeds,
  formWebhooks,
  formAnalytics,
}                                  from './schema';

// ─── Types ──────────────────────────────────────────────────────────
export type {
  Form,
  FormInsert,
  FormUpdate,
  FormField,
  FormFieldInsert,
  FormFieldUpdate,
  FormSubmission,
  FormSubmissionInsert,
  SubmissionValue,
  SubmissionValueInsert,
  ConditionalRule,
  ConditionalRuleInsert,
  FormTemplate,
  FormTemplateInsert,
  Survey,
  SurveyInsert,
  SurveyUpdate,
  SurveyResponse,
  SurveyResponseInsert,
  FormEmbed,
  FormEmbedInsert,
  FormWebhook,
  FormWebhookInsert,
  FormAnalytics,
  FormAnalyticsInsert,
}                                  from './types';

// ─── Enums ──────────────────────────────────────────────────────────
export {
  FieldType,
  FormStatus,
  SubmissionStatus,
  SurveyType,
  EmbedType,
  WebhookEvent,
  ConditionalOperator,
  ConditionalAction,
  ValidationRuleType,
  SpamVerdict,
}                                  from './enums';

// ─── DTOs ───────────────────────────────────────────────────────────
export type {
  CreateFormInput,
  UpdateFormInput,
  CreateFieldInput,
  UpdateFieldInput,
  SubmitFormInput,
  CreateSurveyInput,
  UpdateSurveyInput,
  CreateTemplateInput,
  CreateEmbedInput,
  CreateWebhookInput,
  FormListQuery,
  SubmissionListQuery,
  AnalyticsQuery,
}                                  from './dto';

// ─── Hooks (React) ──────────────────────────────────────────────────
export { useForm }                 from './hooks/use-form';
export { useFormBuilder }          from './hooks/use-form-builder';
export { useFormSubmit }           from './hooks/use-form-submit';
export { useSubmissions }          from './hooks/use-submissions';
export { useSurvey }               from './hooks/use-survey';
export { useFormAnalytics }        from './hooks/use-form-analytics';
export { useFormTemplates }        from './hooks/use-form-templates';
export { useConditionalLogic }     from './hooks/use-conditional-logic';

// ─── Components (React) ─────────────────────────────────────────────
export { FormRenderer }            from './components/FormRenderer';
export { FormBuilder }             from './components/FormBuilder';
export { FormEmbedWidget }         from './components/FormEmbedWidget';
export { SurveyRenderer }          from './components/SurveyRenderer';
export { SubmissionTable }         from './components/SubmissionTable';
export { AnalyticsDashboard }      from './components/AnalyticsDashboard';
export { FieldPalette }            from './components/FieldPalette';
export { ConditionalRuleEditor }   from './components/ConditionalRuleEditor';

// ─── Utilities ──────────────────────────────────────────────────────
export { calculateNPS }            from './utils/scoring';
export { calculateCSAT }           from './utils/scoring';
export { calculateCES }            from './utils/scoring';
export { evaluateExpression }      from './utils/expression';
export { generateStandaloneUrl }   from './utils/embed';
export { exportSubmissionsCSV }    from './utils/export';
export { exportSubmissionsXLSX }   from './utils/export';
export { sanitizeSubmissionHtml }  from './utils/sanitize';
```

---

## Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Client Applications                          │
│                                                                     │
│   ┌──────────┐  ┌──────────────┐  ┌────────┐  ┌────────────────┐  │
│   │  Form     │  │  Form        │  │ Survey │  │  Embed Widget  │  │
│   │  Builder  │  │  Renderer    │  │ Renderer│  │  (iframe/popup)│  │
│   └────┬─────┘  └──────┬───────┘  └───┬────┘  └───────┬────────┘  │
│        │               │              │                │            │
│   ┌────┴───────────────┴──────────────┴────────────────┴────────┐  │
│   │                    React Hooks Layer                         │  │
│   │  useFormBuilder · useFormSubmit · useSurvey · useAnalytics   │  │
│   └────────────────────────────┬────────────────────────────────┘  │
└────────────────────────────────┼────────────────────────────────────┘
                                 │ tRPC
┌────────────────────────────────┼────────────────────────────────────┐
│                         API Layer (tRPC)                            │
│                                │                                    │
│   ┌────────────────────────────┴────────────────────────────────┐  │
│   │                     formsRouter                              │  │
│   │                                                              │  │
│   │  form.create · form.update · form.delete · form.get         │  │
│   │  form.list · form.duplicate · form.publish · form.archive   │  │
│   │  field.create · field.update · field.delete · field.reorder │  │
│   │  submission.create · submission.list · submission.export     │  │
│   │  survey.create · survey.update · survey.respond             │  │
│   │  template.list · template.apply · template.publish          │  │
│   │  embed.create · embed.update · embed.getConfig              │  │
│   │  webhook.create · webhook.test · webhook.list               │  │
│   │  analytics.summary · analytics.dropoff · analytics.trend    │  │
│   └────────────────────────────┬────────────────────────────────┘  │
│                                │                                    │
│   ┌────────────────────────────┴────────────────────────────────┐  │
│   │                     Service Layer                            │  │
│   │                                                              │  │
│   │  ┌───────────────┐  ┌──────────────────┐  ┌──────────────┐ │  │
│   │  │ FormService    │  │ SubmissionService│  │ SurveyService│ │  │
│   │  └───────┬───────┘  └────────┬─────────┘  └──────┬───────┘ │  │
│   │          │                   │                    │          │  │
│   │  ┌───────┴───────┐  ┌───────┴──────────┐  ┌─────┴────────┐ │  │
│   │  │FormFieldService│ │ FormWebhookService│ │FormAnalytics │ │  │
│   │  └───────────────┘  └──────────────────┘  │   Service    │ │  │
│   │                                            └──────────────┘ │  │
│   │  ┌───────────────────┐  ┌──────────────────────────────┐   │  │
│   │  │ ConditionalLogic  │  │ SpamProtectionService        │   │  │
│   │  │    Engine         │  │ (reCAPTCHA, honeypot, rate)   │   │  │
│   │  └───────────────────┘  └──────────────────────────────┘   │  │
│   │  ┌───────────────────┐  ┌──────────────────────────────┐   │  │
│   │  │ ValidationEngine  │  │ FormTemplateService          │   │  │
│   │  └───────────────────┘  └──────────────────────────────┘   │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                │                                    │
└────────────────────────────────┼────────────────────────────────────┘
                                 │ Drizzle ORM
┌────────────────────────────────┼────────────────────────────────────┐
│                       Data Layer (Supabase)                         │
│                                │                                    │
│   ┌────────────────────────────┴────────────────────────────────┐  │
│   │               PostgreSQL (with RLS)                          │  │
│   │                                                              │  │
│   │  forms · form_fields · form_submissions · submission_values │  │
│   │  conditional_rules · form_templates · surveys               │  │
│   │  survey_responses · form_embeds · form_webhooks             │  │
│   │  form_analytics                                              │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │               Supabase Storage                               │  │
│   │  form-uploads/ · signatures/ · template-thumbnails/         │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │               Supabase Edge Functions                        │  │
│   │  form-submit (public) · webhook-dispatch · analytics-agg    │  │
│   └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow: Form Submission

```
User fills form → FormRenderer validates client-side
    → tRPC submission.create (or Edge Function for public forms)
        → SpamProtectionService.evaluate()
            → reCAPTCHA v3 score check
            → Honeypot field detection
            → Rate limit check (IP + fingerprint)
            → Bot behavior heuristics
        → ValidationEngine.validate()
            → Required field checks
            → Type-specific validation (email, phone, URL)
            → Regex pattern matching
            → Custom validation functions
            → File type/size verification
        → ConditionalLogicEngine.evaluateVisibility()
            → Determine which fields were actually visible
            → Strip values for hidden fields
        → SubmissionService.create()
            → Insert form_submissions row
            → Insert submission_values rows (one per field)
            → Upload files to Supabase Storage
        → FormWebhookService.dispatch()
            → Fire registered webhooks (async)
            → Zapier webhook integration
        → FormAnalyticsService.record()
            → Increment submission count
            → Record completion time
            → Update field-level drop-off stats
        → NotificationService.send() (if configured)
            → Email to form owner
            → Email confirmation to submitter
            → Slack/Teams notification
```

### Multi-Tenant Architecture

Every table in the forms module includes a `tenant_id` column with Row-Level Security (RLS) policies enforced at the database level:

```sql
-- Example RLS policy for forms table
CREATE POLICY "tenant_isolation" ON forms
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Public submission policy (allows anonymous form submissions)
CREATE POLICY "public_submit" ON form_submissions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM forms
      WHERE forms.id = form_submissions.form_id
      AND forms.status = 'published'
      AND forms.allow_public = true
    )
  );
```

### Conditional Logic Engine

The conditional logic engine evaluates rules at both client and server side to determine field visibility, skip logic, and calculated values:

```
ConditionalRule {
  source_field_id  →  The field whose value triggers the rule
  operator         →  eq, neq, gt, lt, gte, lte, contains, not_contains,
                      starts_with, ends_with, is_empty, is_not_empty,
                      in_list, not_in_list, between, regex_match
  value            →  The comparison value (JSON-encoded)
  action           →  show, hide, skip_to, set_value, require, unrequire,
                      enable, disable
  target_field_id  →  The field affected by this rule
  target_step      →  (for skip_to) Which step to jump to
}
```

Rules are evaluated in priority order, with conflict resolution (last-write-wins for contradictory show/hide rules on the same target).

---

## Core Interfaces

### Form

The root entity representing a single form or survey configuration.

```typescript
/**
 * Core form entity. Represents a form configuration including its metadata,
 * settings, styling, and publication state.
 */
interface Form {
  /** Unique form identifier (UUIDv7) */
  id: string;

  /** Tenant that owns this form */
  tenantId: string;

  /** User who created the form */
  createdBy: string;

  /** Human-readable form title */
  title: string;

  /** Optional description shown to respondents */
  description: string | null;

  /** URL-safe slug for standalone form pages */
  slug: string;

  /** Current form status */
  status: FormStatus;

  /** Form settings */
  settings: FormSettings;

  /** Visual styling/theme configuration */
  theme: FormTheme;

  /** Whether the form accepts public (unauthenticated) submissions */
  allowPublic: boolean;

  /** Maximum number of submissions (null = unlimited) */
  submissionLimit: number | null;

  /** Form expiration date (null = no expiry) */
  expiresAt: Date | null;

  /** Custom redirect URL after submission */
  redirectUrl: string | null;

  /** Custom thank-you message after submission */
  confirmationMessage: string | null;

  /** Whether to send confirmation email to submitter */
  sendConfirmationEmail: boolean;

  /** Confirmation email template ID */
  confirmationEmailTemplateId: string | null;

  /** Email addresses to notify on submission */
  notificationEmails: string[];

  /** Spam protection configuration */
  spamProtection: SpamProtectionConfig;

  /** Whether form is a multi-step wizard */
  isMultiStep: boolean;

  /** Step configuration (for multi-step forms) */
  steps: FormStep[] | null;

  /** Whether to allow save-and-resume for partial submissions */
  allowSaveAndResume: boolean;

  /** Form version number (incremented on publish) */
  version: number;

  /** ID of the template this form was created from (null if from scratch) */
  templateId: string | null;

  /** Total submission count (denormalized for performance) */
  submissionCount: number;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  archivedAt: Date | null;
}

/** Form status lifecycle */
enum FormStatus {
  /** Form is being built, not yet accessible */
  DRAFT = 'draft',
  /** Form is live and accepting submissions */
  PUBLISHED = 'published',
  /** Form is closed, no longer accepting submissions */
  CLOSED = 'closed',
  /** Form is archived and hidden from lists */
  ARCHIVED = 'archived',
}

/** Form-level settings */
interface FormSettings {
  /** Show progress bar for multi-step forms */
  showProgressBar: boolean;

  /** Progress bar style */
  progressBarStyle: 'bar' | 'steps' | 'percentage';

  /** Show field numbers */
  showFieldNumbers: boolean;

  /** Enable autosave for partially completed forms */
  autosave: boolean;

  /** Autosave interval in milliseconds */
  autosaveIntervalMs: number;

  /** Allow multiple submissions from same user */
  allowMultipleSubmissions: boolean;

  /** Require authentication to submit */
  requireAuth: boolean;

  /** Collect submitter's IP address */
  collectIpAddress: boolean;

  /** Collect browser/device information */
  collectDeviceInfo: boolean;

  /** Enable keyboard navigation (Tab through fields) */
  keyboardNavigation: boolean;

  /** Time limit for form completion in seconds (null = no limit) */
  timeLimitSeconds: number | null;

  /** Show time remaining for timed forms */
  showTimeRemaining: boolean;

  /** Locale/language for built-in text */
  locale: string;

  /** Custom CSS class to apply to form container */
  customClass: string | null;

  /** Google Analytics tracking ID */
  gaTrackingId: string | null;

  /** Facebook Pixel ID */
  fbPixelId: string | null;
}

/** Visual theme for form rendering */
interface FormTheme {
  /** Primary color (hex) */
  primaryColor: string;

  /** Background color (hex) */
  backgroundColor: string;

  /** Text color (hex) */
  textColor: string;

  /** Font family */
  fontFamily: string;

  /** Font size in pixels */
  fontSize: number;

  /** Border radius for inputs in pixels */
  borderRadius: number;

  /** Input field style */
  inputStyle: 'outlined' | 'filled' | 'underlined';

  /** Button style */
  buttonStyle: 'filled' | 'outlined' | 'text';

  /** Layout mode */
  layout: 'standard' | 'card' | 'conversational';

  /** Custom CSS (sanitized) */
  customCss: string | null;

  /** Logo URL */
  logoUrl: string | null;

  /** Logo position */
  logoPosition: 'left' | 'center' | 'right';

  /** Background image URL */
  backgroundImageUrl: string | null;

  /** Whether to show "Powered by MCV" branding */
  showBranding: boolean;
}

/** Configuration for a single step in a multi-step form */
interface FormStep {
  /** Step identifier */
  id: string;

  /** Step title */
  title: string;

  /** Step description */
  description: string | null;

  /** Order index (0-based) */
  order: number;

  /** Field IDs that belong to this step */
  fieldIds: string[];

  /** Conditional rules for skipping this step */
  skipConditions: ConditionalRule[] | null;
}
```

### FormField

Represents a single field within a form.

```typescript
/**
 * A single field in a form. Fields define the data structure and
 * validation rules for collected information.
 */
interface FormField {
  /** Unique field identifier (UUIDv7) */
  id: string;

  /** Parent form ID */
  formId: string;

  /** Tenant ID (denormalized for RLS) */
  tenantId: string;

  /** Field type */
  type: FieldType;

  /** Field label shown to user */
  label: string;

  /** Internal field name (used in APIs and exports) */
  name: string;

  /** Placeholder text */
  placeholder: string | null;

  /** Help text shown below the field */
  helpText: string | null;

  /** Whether the field is required */
  required: boolean;

  /** Display order within the form or step */
  order: number;

  /** Step index this field belongs to (for multi-step forms) */
  stepIndex: number | null;

  /** Default value */
  defaultValue: unknown | null;

  /** Type-specific configuration */
  config: FieldConfig;

  /** Validation rules */
  validation: FieldValidation;

  /** Whether this field is a hidden/honeypot field */
  isHidden: boolean;

  /** Column width (1-12 grid) for layout purposes */
  width: number;

  /** Custom CSS class */
  customClass: string | null;

  /** Conditional visibility rules */
  conditionalRules: ConditionalRule[];

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}

/** Supported field types */
enum FieldType {
  // Text inputs
  TEXT = 'text',
  TEXTAREA = 'textarea',
  EMAIL = 'email',
  PHONE = 'phone',
  URL = 'url',
  PASSWORD = 'password',

  // Numeric
  NUMBER = 'number',
  CURRENCY = 'currency',
  SLIDER = 'slider',

  // Selection
  SELECT = 'select',
  MULTI_SELECT = 'multi_select',
  CHECKBOX = 'checkbox',
  CHECKBOX_GROUP = 'checkbox_group',
  RADIO = 'radio',
  TOGGLE = 'toggle',

  // Date/Time
  DATE = 'date',
  TIME = 'time',
  DATETIME = 'datetime',
  DATE_RANGE = 'date_range',

  // File & Media
  FILE_UPLOAD = 'file_upload',
  IMAGE_UPLOAD = 'image_upload',
  SIGNATURE = 'signature',

  // Rating & Scoring
  RATING = 'rating',
  NPS = 'nps',
  SCALE = 'scale',

  // Layout & Display
  HEADING = 'heading',
  PARAGRAPH = 'paragraph',
  DIVIDER = 'divider',
  SPACER = 'spacer',
  IMAGE = 'image',

  // Advanced
  ADDRESS = 'address',
  NAME = 'name',
  MATRIX = 'matrix',
  RANKING = 'ranking',
  CALCULATED = 'calculated',
  HIDDEN = 'hidden',

  // Payment
  PAYMENT = 'payment',
  PRICE = 'price',
}

/**
 * Type-specific field configuration. Only the properties relevant
 * to the field's type will be populated.
 */
interface FieldConfig {
  // ─── Select/Radio/Checkbox Options ────────────────────────────
  /** Available options for select, radio, checkbox_group fields */
  options?: FieldOption[];

  /** Allow "Other" free-text option */
  allowOther?: boolean;

  /** Randomize option order */
  randomizeOptions?: boolean;

  // ─── Number/Slider ────────────────────────────────────────────
  /** Minimum numeric value */
  min?: number;

  /** Maximum numeric value */
  max?: number;

  /** Step increment for number/slider */
  step?: number;

  /** Currency code (e.g., 'USD', 'EUR') for currency fields */
  currency?: string;

  /** Number format locale */
  numberLocale?: string;

  // ─── Text ─────────────────────────────────────────────────────
  /** Minimum text length */
  minLength?: number;

  /** Maximum text length */
  maxLength?: number;

  /** Number of visible textarea rows */
  rows?: number;

  /** Enable rich text editor for textarea */
  richText?: boolean;

  // ─── Date ─────────────────────────────────────────────────────
  /** Minimum selectable date (ISO string) */
  minDate?: string;

  /** Maximum selectable date (ISO string) */
  maxDate?: string;

  /** Date format for display (e.g., 'MM/DD/YYYY') */
  dateFormat?: string;

  /** Disable specific days of week (0=Sun, 6=Sat) */
  disabledDays?: number[];

  // ─── File Upload ──────────────────────────────────────────────
  /** Allowed MIME types */
  allowedMimeTypes?: string[];

  /** Maximum file size in bytes */
  maxFileSize?: number;

  /** Maximum number of files */
  maxFiles?: number;

  /** Enable drag-and-drop upload area */
  dragAndDrop?: boolean;

  // ─── Signature ────────────────────────────────────────────────
  /** Signature canvas width in pixels */
  signatureWidth?: number;

  /** Signature canvas height in pixels */
  signatureHeight?: number;

  /** Pen color */
  penColor?: string;

  /** Background color */
  signatureBackgroundColor?: string;

  // ─── Rating ───────────────────────────────────────────────────
  /** Maximum rating value */
  maxRating?: number;

  /** Rating icon (star, heart, thumbsUp, emoji) */
  ratingIcon?: 'star' | 'heart' | 'thumbsUp' | 'emoji';

  /** Allow half-step ratings */
  allowHalf?: boolean;

  // ─── NPS ──────────────────────────────────────────────────────
  /** Low-end label (e.g., "Not at all likely") */
  npsLowLabel?: string;

  /** High-end label (e.g., "Extremely likely") */
  npsHighLabel?: string;

  // ─── Scale ────────────────────────────────────────────────────
  /** Scale start value */
  scaleStart?: number;

  /** Scale end value */
  scaleEnd?: number;

  /** Labels for scale points */
  scaleLabels?: Record<number, string>;

  // ─── Matrix ───────────────────────────────────────────────────
  /** Matrix row labels */
  matrixRows?: string[];

  /** Matrix column labels */
  matrixColumns?: string[];

  /** Matrix input type */
  matrixType?: 'radio' | 'checkbox' | 'text' | 'select';

  // ─── Ranking ──────────────────────────────────────────────────
  /** Items to rank */
  rankingItems?: string[];

  // ─── Calculated ───────────────────────────────────────────────
  /** Calculation expression (references other fields by name) */
  expression?: string;

  /** Display format for calculated result */
  displayFormat?: string;

  // ─── Address ──────────────────────────────────────────────────
  /** Which address sub-fields to show */
  addressFields?: ('street' | 'street2' | 'city' | 'state' | 'zip' | 'country')[];

  /** Enable Google Places autocomplete */
  autocomplete?: boolean;

  /** Default country code */
  defaultCountry?: string;

  // ─── Name ─────────────────────────────────────────────────────
  /** Which name sub-fields to show */
  nameFields?: ('prefix' | 'first' | 'middle' | 'last' | 'suffix')[];

  // ─── Layout (Heading, Paragraph, Image) ───────────────────────
  /** Heading level (1-6) */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;

  /** Rich text content for paragraph fields */
  content?: string;

  /** Image URL for image display fields */
  imageUrl?: string;

  /** Image alt text */
  imageAlt?: string;

  /** Spacer height in pixels */
  spacerHeight?: number;

  // ─── Payment ──────────────────────────────────────────────────
  /** Payment provider ('stripe' | 'paypal') */
  paymentProvider?: string;

  /** Fixed price amount in cents */
  priceAmount?: number;

  /** Whether price is user-defined */
  userDefinedPrice?: boolean;

  /** Minimum payment amount in cents */
  minPayment?: number;
}

/** A single option for select/radio/checkbox fields */
interface FieldOption {
  /** Option value (stored in submission) */
  value: string;

  /** Display label */
  label: string;

  /** Optional image URL for visual options */
  imageUrl?: string;

  /** Whether this option is pre-selected by default */
  isDefault?: boolean;

  /** Sort order */
  order: number;
}

/** Validation configuration for a field */
interface FieldValidation {
  /** Custom regex pattern */
  pattern?: string;

  /** Error message for pattern mismatch */
  patternMessage?: string;

  /** Custom validation function name (registered in ValidationEngine) */
  customValidator?: string;

  /** Minimum number of selections (for multi-select, checkbox_group) */
  minSelections?: number;

  /** Maximum number of selections */
  maxSelections?: number;

  /** Unique constraint (no duplicate submissions for this field) */
  unique?: boolean;

  /** Custom error messages */
  messages?: {
    required?: string;
    invalid?: string;
    min?: string;
    max?: string;
    pattern?: string;
  };
}
```

### FormSubmission

Represents a single form submission with all collected values.

```typescript
/**
 * A completed form submission. Contains metadata about the submission
 * event and references to individual field values.
 */
interface FormSubmission {
  /** Unique submission identifier (UUIDv7) */
  id: string;

  /** Parent form ID */
  formId: string;

  /** Tenant ID (denormalized for RLS) */
  tenantId: string;

  /** Authenticated user ID (null for anonymous submissions) */
  userId: string | null;

  /** Submission status */
  status: SubmissionStatus;

  /** IP address of submitter (if collection enabled) */
  ipAddress: string | null;

  /** User-Agent string */
  userAgent: string | null;

  /** Referrer URL */
  referrer: string | null;

  /** Device/browser information */
  deviceInfo: DeviceInfo | null;

  /** Spam protection verdict */
  spamVerdict: SpamVerdict;

  /** reCAPTCHA v3 score (0.0 - 1.0) */
  recaptchaScore: number | null;

  /** Time taken to complete the form in milliseconds */
  completionTimeMs: number | null;

  /** For multi-step forms, which step the user reached */
  lastStepReached: number | null;

  /** Partial submission data for save-and-resume */
  partialData: Record<string, unknown> | null;

  /** Resume token for save-and-resume */
  resumeToken: string | null;

  /** Form version at time of submission */
  formVersion: number;

  /** Custom metadata (e.g., UTM params, referral source) */
  metadata: Record<string, unknown>;

  /** Collected field values (joined from submission_values) */
  values: SubmissionValue[];

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}

/** Submission lifecycle status */
enum SubmissionStatus {
  /** Submission is in progress (save-and-resume) */
  IN_PROGRESS = 'in_progress',
  /** Submission completed successfully */
  COMPLETED = 'completed',
  /** Submission flagged as spam */
  SPAM = 'spam',
  /** Submission is under review */
  UNDER_REVIEW = 'under_review',
  /** Submission was approved (moderated forms) */
  APPROVED = 'approved',
  /** Submission was rejected (moderated forms) */
  REJECTED = 'rejected',
  /** Submission was archived */
  ARCHIVED = 'archived',
}

/** Spam protection verdict */
enum SpamVerdict {
  /** Clean, no spam indicators */
  CLEAN = 'clean',
  /** Low-confidence spam, passed through */
  SUSPICIOUS = 'suspicious',
  /** High-confidence spam, blocked */
  SPAM = 'spam',
  /** Blocked by rate limiting */
  RATE_LIMITED = 'rate_limited',
}

/** Device/browser information */
interface DeviceInfo {
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  device: 'desktop' | 'tablet' | 'mobile';
  screenWidth: number;
  screenHeight: number;
}
```

### SubmissionValue

An individual field value within a submission.

```typescript
/**
 * A single field's value within a form submission. Stored as a
 * separate row for queryability and indexing.
 */
interface SubmissionValue {
  /** Unique value identifier (UUIDv7) */
  id: string;

  /** Parent submission ID */
  submissionId: string;

  /** Field ID this value corresponds to */
  fieldId: string;

  /** Field name (denormalized for export convenience) */
  fieldName: string;

  /** Field type (denormalized for type-appropriate rendering) */
  fieldType: FieldType;

  /** The actual value (JSON-encoded for complex types) */
  value: unknown;

  /** For file uploads: storage path */
  filePath: string | null;

  /** For file uploads: original filename */
  fileName: string | null;

  /** For file uploads: MIME type */
  fileMimeType: string | null;

  /** For file uploads: file size in bytes */
  fileSize: number | null;

  /** Timestamp */
  createdAt: Date;
}
```

### ConditionalRule

Defines conditional logic for field visibility, skip logic, and computed values.

```typescript
/**
 * A conditional rule that modifies form behavior based on field values.
 * Rules are evaluated client-side for responsiveness and server-side
 * for security.
 */
interface ConditionalRule {
  /** Unique rule identifier (UUIDv7) */
  id: string;

  /** Parent form ID */
  formId: string;

  /** Tenant ID (denormalized for RLS) */
  tenantId: string;

  /** Source field whose value is evaluated */
  sourceFieldId: string;

  /** Comparison operator */
  operator: ConditionalOperator;

  /** Comparison value (JSON-encoded) */
  value: unknown;

  /** Action to take when condition is met */
  action: ConditionalAction;

  /** Target field affected by this rule */
  targetFieldId: string | null;

  /** Target step (for skip_to action) */
  targetStep: number | null;

  /** Value to set (for set_value action) */
  setValue: unknown | null;

  /** Rule priority (higher = evaluated later, overrides lower) */
  priority: number;

  /** Whether this rule is active */
  enabled: boolean;

  /** Logical group for AND/OR combinations */
  group: string | null;

  /** Group operator: all rules in group must match (AND) or any (OR) */
  groupOperator: 'and' | 'or';

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}

/** Conditional comparison operators */
enum ConditionalOperator {
  EQUALS = 'eq',
  NOT_EQUALS = 'neq',
  GREATER_THAN = 'gt',
  LESS_THAN = 'lt',
  GREATER_THAN_OR_EQUAL = 'gte',
  LESS_THAN_OR_EQUAL = 'lte',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  IS_EMPTY = 'is_empty',
  IS_NOT_EMPTY = 'is_not_empty',
  IN_LIST = 'in_list',
  NOT_IN_LIST = 'not_in_list',
  BETWEEN = 'between',
  REGEX_MATCH = 'regex_match',
}

/** Actions performed when a conditional rule matches */
enum ConditionalAction {
  /** Show the target field */
  SHOW = 'show',
  /** Hide the target field */
  HIDE = 'hide',
  /** Skip to a specific step */
  SKIP_TO = 'skip_to',
  /** Set the target field's value */
  SET_VALUE = 'set_value',
  /** Make the target field required */
  REQUIRE = 'require',
  /** Make the target field optional */
  UNREQUIRE = 'unrequire',
  /** Enable the target field */
  ENABLE = 'enable',
  /** Disable the target field */
  DISABLE = 'disable',
}
```

### FormTemplate

Pre-built or user-published form templates.

```typescript
/**
 * A reusable form template. Can be system-provided (e.g., "Contact Us")
 * or user-published to the template marketplace.
 */
interface FormTemplate {
  /** Unique template identifier (UUIDv7) */
  id: string;

  /** Tenant ID (null for system templates) */
  tenantId: string | null;

  /** Template name */
  name: string;

  /** Template description */
  description: string;

  /** Template category */
  category: TemplateCategory;

  /** Tags for search/filter */
  tags: string[];

  /** Thumbnail image URL */
  thumbnailUrl: string | null;

  /** Preview image URL */
  previewUrl: string | null;

  /** Full form configuration (serialized Form + FormField[]) */
  config: TemplateConfig;

  /** Whether this is a system-provided template */
  isSystem: boolean;

  /** Whether this template is published to the marketplace */
  isPublished: boolean;

  /** Number of times this template has been used */
  useCount: number;

  /** Average rating (1-5) */
  rating: number | null;

  /** Number of ratings */
  ratingCount: number;

  /** Template version */
  version: number;

  /** User who created this template */
  createdBy: string | null;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
}

/** Template categories */
type TemplateCategory =
  | 'contact'
  | 'feedback'
  | 'registration'
  | 'application'
  | 'lead_capture'
  | 'survey'
  | 'order'
  | 'booking'
  | 'quiz'
  | 'poll'
  | 'rsvp'
  | 'support'
  | 'hr'
  | 'education'
  | 'healthcare'
  | 'other';

/** Serialized template configuration */
interface TemplateConfig {
  /** Form settings */
  form: Omit<Form, 'id' | 'tenantId' | 'createdBy' | 'createdAt' | 'updatedAt'>;

  /** Field definitions */
  fields: Omit<FormField, 'id' | 'formId' | 'tenantId' | 'createdAt' | 'updatedAt'>[];

  /** Conditional rules */
  rules: Omit<ConditionalRule, 'id' | 'formId' | 'tenantId' | 'createdAt' | 'updatedAt'>[];
}
```

### Survey

Survey-specific configuration layered on top of a form.

```typescript
/**
 * Survey entity. Extends a form with survey-specific features like
 * scoring, quotas, and randomization.
 */
interface Survey {
  /** Unique survey identifier (UUIDv7) */
  id: string;

  /** Linked form ID (the form that provides the structure) */
  formId: string;

  /** Tenant ID (denormalized for RLS) */
  tenantId: string;

  /** Survey type */
  type: SurveyType;

  /** Survey title (may differ from form title) */
  title: string;

  /** Survey description */
  description: string | null;

  /** Welcome screen configuration */
  welcomeScreen: SurveyScreen | null;

  /** Thank-you screen configuration */
  thankYouScreen: SurveyScreen | null;

  /** Whether to randomize question order */
  randomizeQuestions: boolean;

  /** Whether to randomize option order for all applicable fields */
  randomizeOptions: boolean;

  /** Maximum number of responses (null = unlimited) */
  responseQuota: number | null;

  /** Current response count (denormalized) */
  responseCount: number;

  /** Whether the survey is anonymous (no user tracking) */
  isAnonymous: boolean;

  /** Allow respondents to edit their responses */
  allowEditing: boolean;

  /** Show results to respondents after completion */
  showResults: boolean;

  /** Results display mode */
  resultsDisplay: 'summary' | 'detailed' | 'chart' | null;

  /** Scoring configuration */
  scoring: SurveyScoring | null;

  /** Whether to show a score/result at the end */
  showScore: boolean;

  /** Score interpretation ranges */
  scoreRanges: ScoreRange[] | null;

  /** Survey scheduling */
  scheduledStart: Date | null;
  scheduledEnd: Date | null;

  /** Reminder configuration */
  reminders: SurveyReminder[] | null;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
}

/** Survey types */
enum SurveyType {
  /** General survey */
  GENERAL = 'general',
  /** Net Promoter Score */
  NPS = 'nps',
  /** Customer Satisfaction */
  CSAT = 'csat',
  /** Customer Effort Score */
  CES = 'ces',
  /** Quiz with scored answers */
  QUIZ = 'quiz',
  /** Simple poll */
  POLL = 'poll',
  /** Research survey */
  RESEARCH = 'research',
}

/** Welcome/thank-you screen configuration */
interface SurveyScreen {
  title: string;
  description: string | null;
  imageUrl: string | null;
  buttonText: string;
}

/** Scoring configuration for quizzes and scored surveys */
interface SurveyScoring {
  /** Scoring method */
  method: 'sum' | 'average' | 'weighted' | 'percentage';

  /** Per-field scoring rules (field_id → score mapping) */
  fieldScores: Record<string, Record<string, number>>;

  /** Weight per field (for weighted scoring) */
  fieldWeights: Record<string, number>;

  /** Maximum possible score */
  maxScore: number;

  /** Pass threshold (null = no pass/fail) */
  passThreshold: number | null;
}

/** Score interpretation range */
interface ScoreRange {
  /** Minimum score (inclusive) */
  min: number;

  /** Maximum score (inclusive) */
  max: number;

  /** Label for this range */
  label: string;

  /** Description shown to respondent */
  description: string;

  /** Color for visual display */
  color: string;
}

/** Survey reminder configuration */
interface SurveyReminder {
  /** When to send (relative to survey distribution) */
  delayHours: number;

  /** Reminder channel */
  channel: 'email' | 'sms' | 'push';

  /** Custom message (null = default) */
  message: string | null;

  /** Whether this reminder is enabled */
  enabled: boolean;
}
```

### SurveyResponse

A survey-specific response with scoring information.

```typescript
/**
 * A response to a survey. Extends submission data with survey-specific
 * scoring and analysis fields.
 */
interface SurveyResponse {
  /** Unique response identifier (UUIDv7) */
  id: string;

  /** Parent survey ID */
  surveyId: string;

  /** Linked form submission ID */
  submissionId: string;

  /** Tenant ID (denormalized for RLS) */
  tenantId: string;

  /** Respondent user ID (null for anonymous) */
  respondentId: string | null;

  /** Respondent email (if collected) */
  respondentEmail: string | null;

  /** Calculated score (for scored surveys) */
  score: number | null;

  /** Score as percentage (0-100) */
  scorePercentage: number | null;

  /** Whether the respondent passed (for quizzes) */
  passed: boolean | null;

  /** Score range label */
  scoreLabel: string | null;

  /** NPS category: promoter (9-10), passive (7-8), detractor (0-6) */
  npsCategory: 'promoter' | 'passive' | 'detractor' | null;

  /** CSAT score (1-5 typically) */
  csatScore: number | null;

  /** CES score (1-7 typically) */
  cesScore: number | null;

  /** Sentiment analysis result (if enabled) */
  sentiment: 'positive' | 'neutral' | 'negative' | null;

  /** Time taken to complete in milliseconds */
  completionTimeMs: number | null;

  /** Whether the respondent completed the survey */
  isComplete: boolean;

  /** Whether the respondent edited their response */
  isEdited: boolean;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}
```

### FormEmbed

Embedding configuration for forms.

```typescript
/**
 * Configuration for embedding a form in external pages or
 * as a standalone widget.
 */
interface FormEmbed {
  /** Unique embed identifier (UUIDv7) */
  id: string;

  /** Parent form ID */
  formId: string;

  /** Tenant ID (denormalized for RLS) */
  tenantId: string;

  /** Embed type */
  type: EmbedType;

  /** Embed-specific configuration */
  config: EmbedConfig;

  /** Custom domain for standalone URL (null = default) */
  customDomain: string | null;

  /** Generated embed code (HTML snippet) */
  embedCode: string;

  /** Standalone URL */
  standaloneUrl: string;

  /** Whether this embed is active */
  isActive: boolean;

  /** View count */
  viewCount: number;

  /** Submission count via this embed */
  submissionCount: number;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}

/** Embed types */
enum EmbedType {
  /** Standard iframe embed */
  IFRAME = 'iframe',
  /** Popup/modal overlay */
  POPUP = 'popup',
  /** Slide-in panel from edge of screen */
  SLIDE_IN = 'slide_in',
  /** Standalone URL (full page) */
  STANDALONE = 'standalone',
  /** React component (SDK integration) */
  REACT = 'react',
  /** Floating button that opens form */
  FLOATING_BUTTON = 'floating_button',
  /** Full-page takeover */
  FULLSCREEN = 'fullscreen',
}

/** Embed-specific configuration */
interface EmbedConfig {
  /** Width (pixels or percentage) */
  width?: string;

  /** Height (pixels or percentage) */
  height?: string;

  /** Border style */
  border?: string;

  /** Background color */
  backgroundColor?: string;

  // ─── Popup/Slide-in specific ──────────────────────────────────
  /** Trigger type for popup/slide-in */
  trigger?: 'button' | 'delay' | 'scroll' | 'exit_intent' | 'page_load';

  /** Delay in milliseconds (for delay trigger) */
  triggerDelay?: number;

  /** Scroll percentage (for scroll trigger) */
  triggerScrollPercent?: number;

  /** Button text (for button trigger) */
  buttonText?: string;

  /** Button color */
  buttonColor?: string;

  /** Button position */
  buttonPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

  /** Slide-in direction */
  slideDirection?: 'left' | 'right' | 'bottom';

  /** Show overlay backdrop */
  showOverlay?: boolean;

  /** Close on overlay click */
  closeOnOverlayClick?: boolean;

  /** Show close button */
  showCloseButton?: boolean;

  // ─── Frequency ────────────────────────────────────────────────
  /** How often to show (for popup/slide-in) */
  frequency?: 'always' | 'once' | 'once_per_session' | 'once_per_day';

  /** Cookie name for tracking display frequency */
  frequencyCookie?: string;

  // ─── Custom styling ───────────────────────────────────────────
  /** Custom CSS to inject */
  customCss?: string;

  /** Custom JavaScript to run after load */
  customJs?: string;

  /** Override form theme */
  themeOverride?: Partial<FormTheme>;
}
```

### FormAnalytics

Analytics data for form performance tracking.

```typescript
/**
 * Analytics snapshot for a form. Aggregated data for dashboards
 * and reporting. Can represent hourly, daily, or monthly granularity.
 */
interface FormAnalytics {
  /** Unique analytics record identifier (UUIDv7) */
  id: string;

  /** Parent form ID */
  formId: string;

  /** Tenant ID (denormalized for RLS) */
  tenantId: string;

  /** Time period start */
  periodStart: Date;

  /** Time period end */
  periodEnd: Date;

  /** Granularity of this record */
  granularity: 'hour' | 'day' | 'week' | 'month';

  /** Number of form views/loads */
  viewCount: number;

  /** Number of interactions (first field focused) */
  startCount: number;

  /** Number of completed submissions */
  completionCount: number;

  /** Number of partial/abandoned submissions */
  abandonCount: number;

  /** Number of spam-blocked submissions */
  spamCount: number;

  /** Completion rate (completionCount / startCount) */
  completionRate: number;

  /** Average completion time in milliseconds */
  avgCompletionTimeMs: number;

  /** Median completion time in milliseconds */
  medianCompletionTimeMs: number;

  /** Per-field drop-off data */
  fieldDropoff: FieldDropoff[];

  /** Per-field response distribution */
  fieldDistribution: FieldDistribution[];

  /** Device breakdown */
  deviceBreakdown: {
    desktop: number;
    tablet: number;
    mobile: number;
  };

  /** Referrer breakdown */
  referrerBreakdown: Record<string, number>;

  /** Embed type breakdown */
  embedBreakdown: Record<string, number>;

  /** For NPS/CSAT/CES surveys: aggregated scores */
  surveyScores: SurveyScoreAggregate | null;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}

/** Per-field drop-off tracking */
interface FieldDropoff {
  fieldId: string;
  fieldName: string;
  fieldLabel: string;
  /** Number of users who saw this field */
  viewCount: number;
  /** Number of users who filled this field */
  fillCount: number;
  /** Number of users who abandoned at this field */
  dropoffCount: number;
  /** Drop-off rate */
  dropoffRate: number;
  /** Average time spent on this field in ms */
  avgTimeMs: number;
  /** Number of validation errors on this field */
  errorCount: number;
}

/** Per-field response distribution */
interface FieldDistribution {
  fieldId: string;
  fieldName: string;
  fieldType: FieldType;
  /** Value distribution (value → count) */
  distribution: Record<string, number>;
  /** For numeric fields: statistical summary */
  stats?: {
    min: number;
    max: number;
    mean: number;
    median: number;
    stdDev: number;
  };
}

/** Aggregated survey scores */
interface SurveyScoreAggregate {
  /** NPS: -100 to +100 */
  npsScore?: number;
  npsPromoters?: number;
  npsPassives?: number;
  npsDetractors?: number;

  /** CSAT: 0-100% */
  csatScore?: number;
  csatResponses?: number;

  /** CES: 1-7 average */
  cesScore?: number;
  cesResponses?: number;

  /** General scoring */
  avgScore?: number;
  minScore?: number;
  maxScore?: number;
  passRate?: number;
}
```

### FormService

The primary service for form CRUD operations.

```typescript
/**
 * Core service for managing forms. Handles creation, updates,
 * publishing lifecycle, and form duplication.
 */
interface FormService {
  /**
   * Create a new form.
   *
   * @param input - Form creation parameters
   * @returns The created form with generated ID and slug
   * @throws {FORM_TITLE_REQUIRED} if title is empty
   * @throws {FORM_SLUG_TAKEN} if slug already exists in tenant
   */
  create(input: CreateFormInput): Promise<Form>;

  /**
   * Get a form by ID.
   *
   * @param formId - Form UUID
   * @param opts - Options (include fields, rules, etc.)
   * @returns Form with optional relations
   * @throws {FORM_NOT_FOUND} if form doesn't exist or is in another tenant
   */
  get(formId: string, opts?: FormGetOptions): Promise<FormWithRelations>;

  /**
   * Get a form by slug (for public access).
   *
   * @param slug - URL-safe slug
   * @returns Published form with fields and rules
   * @throws {FORM_NOT_FOUND} if slug doesn't resolve
   * @throws {FORM_NOT_PUBLISHED} if form is not in published status
   * @throws {FORM_EXPIRED} if form has passed its expiration date
   * @throws {FORM_SUBMISSION_LIMIT_REACHED} if submission limit hit
   */
  getBySlug(slug: string): Promise<FormWithRelations>;

  /**
   * List forms for the current tenant.
   *
   * @param query - Filtering, sorting, pagination options
   * @returns Paginated form list
   */
  list(query: FormListQuery): Promise<PaginatedResult<Form>>;

  /**
   * Update a form.
   *
   * @param formId - Form UUID
   * @param input - Fields to update
   * @returns Updated form
   * @throws {FORM_NOT_FOUND} if form doesn't exist
   * @throws {FORM_ARCHIVED} if form is archived (must unarchive first)
   */
  update(formId: string, input: UpdateFormInput): Promise<Form>;

  /**
   * Delete a form and all associated data.
   *
   * @param formId - Form UUID
   * @throws {FORM_NOT_FOUND} if form doesn't exist
   * @throws {FORM_HAS_SUBMISSIONS} if form has submissions (use archive instead)
   */
  delete(formId: string): Promise<void>;

  /**
   * Publish a form (draft → published).
   *
   * @param formId - Form UUID
   * @returns Updated form with published status
   * @throws {FORM_NOT_FOUND} if form doesn't exist
   * @throws {FORM_NO_FIELDS} if form has no fields
   * @throws {FORM_ALREADY_PUBLISHED} if form is already published
   * @throws {FORM_VALIDATION_FAILED} if form configuration is invalid
   */
  publish(formId: string): Promise<Form>;

  /**
   * Close a form (stop accepting submissions).
   *
   * @param formId - Form UUID
   * @returns Updated form with closed status
   */
  close(formId: string): Promise<Form>;

  /**
   * Archive a form.
   *
   * @param formId - Form UUID
   * @returns Updated form with archived status
   */
  archive(formId: string): Promise<Form>;

  /**
   * Unarchive a form (return to draft status).
   *
   * @param formId - Form UUID
   * @returns Updated form with draft status
   */
  unarchive(formId: string): Promise<Form>;

  /**
   * Duplicate a form with all fields and rules.
   *
   * @param formId - Source form UUID
   * @param title - Optional new title (default: "Copy of {original}")
   * @returns New form in draft status
   */
  duplicate(formId: string, title?: string): Promise<Form>;

  /**
   * Create a form from a template.
   *
   * @param templateId - Template UUID
   * @param overrides - Optional overrides for form settings
   * @returns New form in draft status
   */
  createFromTemplate(
    templateId: string,
    overrides?: Partial<CreateFormInput>,
  ): Promise<Form>;

  /**
   * Generate a unique slug for a form.
   *
   * @param title - Form title to slugify
   * @returns Unique URL-safe slug
   */
  generateSlug(title: string): Promise<string>;

  /**
   * Validate a form configuration before publishing.
   *
   * @param formId - Form UUID
   * @returns Validation result with any errors/warnings
   */
  validate(formId: string): Promise<FormValidationResult>;
}

/** Options for form retrieval */
interface FormGetOptions {
  includeFields?: boolean;
  includeRules?: boolean;
  includeSteps?: boolean;
  includeEmbeds?: boolean;
  includeAnalytics?: boolean;
}

/** Form with eagerly loaded relations */
interface FormWithRelations extends Form {
  fields?: FormField[];
  rules?: ConditionalRule[];
  embeds?: FormEmbed[];
  analytics?: FormAnalytics | null;
  survey?: Survey | null;
}

/** Form validation result */
interface FormValidationResult {
  valid: boolean;
  errors: FormValidationIssue[];
  warnings: FormValidationIssue[];
}

interface FormValidationIssue {
  code: string;
  message: string;
  fieldId?: string;
  ruleId?: string;
  stepIndex?: number;
}
```

### FormWebhook

Webhook configuration for form submission events.

```typescript
/**
 * Webhook endpoint configuration. Fires HTTP requests to external
 * services when form events occur.
 */
interface FormWebhook {
  /** Unique webhook identifier (UUIDv7) */
  id: string;

  /** Parent form ID */
  formId: string;

  /** Tenant ID (denormalized for RLS) */
  tenantId: string;

  /** Webhook name (for identification in UI) */
  name: string;

  /** Target URL */
  url: string;

  /** HTTP method */
  method: 'POST' | 'PUT' | 'PATCH';

  /** Events that trigger this webhook */
  events: WebhookEvent[];

  /** Custom headers to include */
  headers: Record<string, string>;

  /** Request body template (Handlebars syntax) */
  bodyTemplate: string | null;

  /** Secret for HMAC signature verification */
  secret: string;

  /** Whether this webhook is active */
  isActive: boolean;

  /** Number of consecutive failures */
  failureCount: number;

  /** Last successful fire timestamp */
  lastSuccessAt: Date | null;

  /** Last failure timestamp */
  lastFailureAt: Date | null;

  /** Last failure error message */
  lastError: string | null;

  /** Maximum retry attempts */
  maxRetries: number;

  /** Retry backoff in milliseconds */
  retryBackoffMs: number;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}

/** Webhook trigger events */
enum WebhookEvent {
  /** New submission created */
  SUBMISSION_CREATED = 'submission.created',
  /** Submission status changed */
  SUBMISSION_UPDATED = 'submission.updated',
  /** Submission marked as spam */
  SUBMISSION_SPAM = 'submission.spam',
  /** Submission approved (moderated forms) */
  SUBMISSION_APPROVED = 'submission.approved',
  /** Submission rejected (moderated forms) */
  SUBMISSION_REJECTED = 'submission.rejected',
  /** Form published */
  FORM_PUBLISHED = 'form.published',
  /** Form closed */
  FORM_CLOSED = 'form.closed',
  /** Submission limit reached */
  FORM_LIMIT_REACHED = 'form.limit_reached',
}
```

### SpamProtectionConfig

Configuration for spam protection on a form.

```typescript
/**
 * Spam protection configuration for a form. Multiple protection
 * layers can be enabled simultaneously.
 */
interface SpamProtectionConfig {
  /** Enable reCAPTCHA v3 */
  recaptchaEnabled: boolean;

  /** reCAPTCHA v3 site key (public) */
  recaptchaSiteKey: string | null;

  /** Minimum reCAPTCHA score to accept (0.0-1.0, default 0.5) */
  recaptchaThreshold: number;

  /** Enable honeypot field */
  honeypotEnabled: boolean;

  /** Honeypot field name (randomized per form) */
  honeypotFieldName: string | null;

  /** Enable rate limiting */
  rateLimitEnabled: boolean;

  /** Maximum submissions per IP per time window */
  rateLimitMaxSubmissions: number;

  /** Rate limit time window in seconds */
  rateLimitWindowSeconds: number;

  /** Enable IP-based blocking */
  ipBlockingEnabled: boolean;

  /** Blocked IP addresses/ranges */
  blockedIps: string[];

  /** Allowed IP addresses/ranges (whitelist overrides blocklist) */
  allowedIps: string[];

  /** Enable bot detection heuristics */
  botDetectionEnabled: boolean;

  /** Minimum time to complete form in seconds (bot speed detection) */
  minCompletionTimeSeconds: number;

  /** Enable country-based blocking */
  countryBlockingEnabled: boolean;

  /** Blocked country codes */
  blockedCountries: string[];

  /** Allowed country codes (whitelist mode) */
  allowedCountries: string[];
}
```

---

## Database Schemas

All tables are defined using Drizzle ORM and live in the `nexus` schema with Row-Level Security enabled.

### forms

```typescript
import { pgTable, uuid, text, varchar, boolean, integer, timestamp, jsonb, pgSchema } from 'drizzle-orm/pg-core';

const nexus = pgSchema('nexus');

export const forms = nexus.table('forms', {
  id:                       uuid('id').primaryKey().defaultRandom(),
  tenantId:                 uuid('tenant_id').notNull().references(() => tenants.id),
  createdBy:                uuid('created_by').notNull().references(() => users.id),
  title:                    varchar('title', { length: 255 }).notNull(),
  description:              text('description'),
  slug:                     varchar('slug', { length: 255 }).notNull(),
  status:                   varchar('status', { length: 20 }).notNull().default('draft'),
  settings:                 jsonb('settings').notNull().default('{}'),
  theme:                    jsonb('theme').notNull().default('{}'),
  allowPublic:              boolean('allow_public').notNull().default(false),
  submissionLimit:          integer('submission_limit'),
  expiresAt:                timestamp('expires_at', { withTimezone: true }),
  redirectUrl:              text('redirect_url'),
  confirmationMessage:      text('confirmation_message'),
  sendConfirmationEmail:    boolean('send_confirmation_email').notNull().default(false),
  confirmationEmailTemplateId: uuid('confirmation_email_template_id'),
  notificationEmails:       jsonb('notification_emails').notNull().default('[]'),
  spamProtection:           jsonb('spam_protection').notNull().default('{}'),
  isMultiStep:              boolean('is_multi_step').notNull().default(false),
  steps:                    jsonb('steps'),
  allowSaveAndResume:       boolean('allow_save_and_resume').notNull().default(false),
  version:                  integer('version').notNull().default(1),
  templateId:               uuid('template_id'),
  submissionCount:          integer('submission_count').notNull().default(0),
  createdAt:                timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:                timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  publishedAt:              timestamp('published_at', { withTimezone: true }),
  archivedAt:               timestamp('archived_at', { withTimezone: true }),
}, (table) => ({
  slugTenantUnique: unique().on(table.slug, table.tenantId),
  tenantIdx: index('forms_tenant_idx').on(table.tenantId),
  statusIdx: index('forms_status_idx').on(table.status),
  createdByIdx: index('forms_created_by_idx').on(table.createdBy),
}));
```

### form_fields

```typescript
export const formFields = nexus.table('form_fields', {
  id:              uuid('id').primaryKey().defaultRandom(),
  formId:          uuid('form_id').notNull().references(() => forms.id, { onDelete: 'cascade' }),
  tenantId:        uuid('tenant_id').notNull().references(() => tenants.id),
  type:            varchar('type', { length: 30 }).notNull(),
  label:           varchar('label', { length: 500 }).notNull(),
  name:            varchar('name', { length: 100 }).notNull(),
  placeholder:     text('placeholder'),
  helpText:        text('help_text'),
  required:        boolean('required').notNull().default(false),
  order:           integer('order').notNull().default(0),
  stepIndex:       integer('step_index'),
  defaultValue:    jsonb('default_value'),
  config:          jsonb('config').notNull().default('{}'),
  validation:      jsonb('validation').notNull().default('{}'),
  isHidden:        boolean('is_hidden').notNull().default(false),
  width:           integer('width').notNull().default(12),
  customClass:     varchar('custom_class', { length: 255 }),
  conditionalRules: jsonb('conditional_rules').notNull().default('[]'),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  formIdx: index('form_fields_form_idx').on(table.formId),
  formOrderIdx: index('form_fields_form_order_idx').on(table.formId, table.order),
  nameFormUnique: unique().on(table.name, table.formId),
}));
```

### form_submissions

```typescript
export const formSubmissions = nexus.table('form_submissions', {
  id:                uuid('id').primaryKey().defaultRandom(),
  formId:            uuid('form_id').notNull().references(() => forms.id, { onDelete: 'cascade' }),
  tenantId:          uuid('tenant_id').notNull().references(() => tenants.id),
  userId:            uuid('user_id').references(() => users.id),
  status:            varchar('status', { length: 20 }).notNull().default('completed'),
  ipAddress:         varchar('ip_address', { length: 45 }),
  userAgent:         text('user_agent'),
  referrer:          text('referrer'),
  deviceInfo:        jsonb('device_info'),
  spamVerdict:       varchar('spam_verdict', { length: 20 }).notNull().default('clean'),
  recaptchaScore:    real('recaptcha_score'),
  completionTimeMs:  integer('completion_time_ms'),
  lastStepReached:   integer('last_step_reached'),
  partialData:       jsonb('partial_data'),
  resumeToken:       varchar('resume_token', { length: 64 }),
  formVersion:       integer('form_version').notNull(),
  metadata:          jsonb('metadata').notNull().default('{}'),
  createdAt:         timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:         timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt:       timestamp('completed_at', { withTimezone: true }),
}, (table) => ({
  formIdx: index('form_submissions_form_idx').on(table.formId),
  tenantIdx: index('form_submissions_tenant_idx').on(table.tenantId),
  statusIdx: index('form_submissions_status_idx').on(table.status),
  createdAtIdx: index('form_submissions_created_at_idx').on(table.createdAt),
  resumeTokenIdx: index('form_submissions_resume_token_idx').on(table.resumeToken),
  spamIdx: index('form_submissions_spam_idx').on(table.spamVerdict),
}));
```

### submission_values

```typescript
export const submissionValues = nexus.table('submission_values', {
  id:             uuid('id').primaryKey().defaultRandom(),
  submissionId:   uuid('submission_id').notNull().references(() => formSubmissions.id, { onDelete: 'cascade' }),
  fieldId:        uuid('field_id').notNull().references(() => formFields.id),
  fieldName:      varchar('field_name', { length: 100 }).notNull(),
  fieldType:      varchar('field_type', { length: 30 }).notNull(),
  value:          jsonb('value'),
  filePath:       text('file_path'),
  fileName:       varchar('file_name', { length: 500 }),
  fileMimeType:   varchar('file_mime_type', { length: 100 }),
  fileSize:       integer('file_size'),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  submissionIdx: index('submission_values_submission_idx').on(table.submissionId),
  fieldIdx: index('submission_values_field_idx').on(table.fieldId),
  submissionFieldUnique: unique().on(table.submissionId, table.fieldId),
}));
```

### conditional_rules

```typescript
export const conditionalRules = nexus.table('conditional_rules', {
  id:              uuid('id').primaryKey().defaultRandom(),
  formId:          uuid('form_id').notNull().references(() => forms.id, { onDelete: 'cascade' }),
  tenantId:        uuid('tenant_id').notNull().references(() => tenants.id),
  sourceFieldId:   uuid('source_field_id').notNull().references(() => formFields.id, { onDelete: 'cascade' }),
  operator:        varchar('operator', { length: 30 }).notNull(),
  value:           jsonb('value'),
  action:          varchar('action', { length: 20 }).notNull(),
  targetFieldId:   uuid('target_field_id').references(() => formFields.id, { onDelete: 'cascade' }),
  targetStep:      integer('target_step'),
  setValue:         jsonb('set_value'),
  priority:        integer('priority').notNull().default(0),
  enabled:         boolean('enabled').notNull().default(true),
  group:           varchar('group', { length: 50 }),
  groupOperator:   varchar('group_operator', { length: 3 }).notNull().default('and'),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  formIdx: index('conditional_rules_form_idx').on(table.formId),
  sourceIdx: index('conditional_rules_source_idx').on(table.sourceFieldId),
  targetIdx: index('conditional_rules_target_idx').on(table.targetFieldId),
}));
```

### form_templates

```typescript
export const formTemplates = nexus.table('form_templates', {
  id:            uuid('id').primaryKey().defaultRandom(),
  tenantId:      uuid('tenant_id'),
  name:          varchar('name', { length: 255 }).notNull(),
  description:   text('description').notNull(),
  category:      varchar('category', { length: 50 }).notNull(),
  tags:          jsonb('tags').notNull().default('[]'),
  thumbnailUrl:  text('thumbnail_url'),
  previewUrl:    text('preview_url'),
  config:        jsonb('config').notNull(),
  isSystem:      boolean('is_system').notNull().default(false),
  isPublished:   boolean('is_published').notNull().default(false),
  useCount:      integer('use_count').notNull().default(0),
  rating:        real('rating'),
  ratingCount:   integer('rating_count').notNull().default(0),
  version:       integer('version').notNull().default(1),
  createdBy:     uuid('created_by'),
  createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:     timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  publishedAt:   timestamp('published_at', { withTimezone: true }),
}, (table) => ({
  categoryIdx: index('form_templates_category_idx').on(table.category),
  systemIdx: index('form_templates_system_idx').on(table.isSystem),
  publishedIdx: index('form_templates_published_idx').on(table.isPublished),
}));
```

### surveys

```typescript
export const surveys = nexus.table('surveys', {
  id:                  uuid('id').primaryKey().defaultRandom(),
  formId:              uuid('form_id').notNull().references(() => forms.id, { onDelete: 'cascade' }),
  tenantId:            uuid('tenant_id').notNull().references(() => tenants.id),
  type:                varchar('type', { length: 20 }).notNull().default('general'),
  title:               varchar('title', { length: 255 }).notNull(),
  description:         text('description'),
  welcomeScreen:       jsonb('welcome_screen'),
  thankYouScreen:      jsonb('thank_you_screen'),
  randomizeQuestions:  boolean('randomize_questions').notNull().default(false),
  randomizeOptions:    boolean('randomize_options').notNull().default(false),
  responseQuota:       integer('response_quota'),
  responseCount:       integer('response_count').notNull().default(0),
  isAnonymous:         boolean('is_anonymous').notNull().default(false),
  allowEditing:        boolean('allow_editing').notNull().default(false),
  showResults:         boolean('show_results').notNull().default(false),
  resultsDisplay:      varchar('results_display', { length: 20 }),
  scoring:             jsonb('scoring'),
  showScore:           boolean('show_score').notNull().default(false),
  scoreRanges:         jsonb('score_ranges'),
  scheduledStart:      timestamp('scheduled_start', { withTimezone: true }),
  scheduledEnd:        timestamp('scheduled_end', { withTimezone: true }),
  reminders:           jsonb('reminders'),
  createdAt:           timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:           timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  closedAt:            timestamp('closed_at', { withTimezone: true }),
}, (table) => ({
  formIdx: index('surveys_form_idx').on(table.formId),
  tenantIdx: index('surveys_tenant_idx').on(table.tenantId),
  typeIdx: index('surveys_type_idx').on(table.type),
}));
```

### survey_responses

```typescript
export const surveyResponses = nexus.table('survey_responses', {
  id:               uuid('id').primaryKey().defaultRandom(),
  surveyId:         uuid('survey_id').notNull().references(() => surveys.id, { onDelete: 'cascade' }),
  submissionId:     uuid('submission_id').notNull().references(() => formSubmissions.id, { onDelete: 'cascade' }),
  tenantId:         uuid('tenant_id').notNull().references(() => tenants.id),
  respondentId:     uuid('respondent_id'),
  respondentEmail:  varchar('respondent_email', { length: 255 }),
  score:            real('score'),
  scorePercentage:  real('score_percentage'),
  passed:           boolean('passed'),
  scoreLabel:       varchar('score_label', { length: 100 }),
  npsCategory:      varchar('nps_category', { length: 20 }),
  csatScore:        real('csat_score'),
  cesScore:         real('ces_score'),
  sentiment:        varchar('sentiment', { length: 20 }),
  completionTimeMs: integer('completion_time_ms'),
  isComplete:       boolean('is_complete').notNull().default(false),
  isEdited:         boolean('is_edited').notNull().default(false),
  createdAt:        timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt:      timestamp('completed_at', { withTimezone: true }),
}, (table) => ({
  surveyIdx: index('survey_responses_survey_idx').on(table.surveyId),
  submissionIdx: index('survey_responses_submission_idx').on(table.submissionId),
  npsCategoryIdx: index('survey_responses_nps_category_idx').on(table.npsCategory),
  respondentIdx: index('survey_responses_respondent_idx').on(table.respondentId),
}));
```

### form_embeds

```typescript
export const formEmbeds = nexus.table('form_embeds', {
  id:              uuid('id').primaryKey().defaultRandom(),
  formId:          uuid('form_id').notNull().references(() => forms.id, { onDelete: 'cascade' }),
  tenantId:        uuid('tenant_id').notNull().references(() => tenants.id),
  type:            varchar('type', { length: 20 }).notNull(),
  config:          jsonb('config').notNull().default('{}'),
  customDomain:    varchar('custom_domain', { length: 255 }),
  embedCode:       text('embed_code').notNull(),
  standaloneUrl:   text('standalone_url').notNull(),
  isActive:        boolean('is_active').notNull().default(true),
  viewCount:       integer('view_count').notNull().default(0),
  submissionCount: integer('submission_count').notNull().default(0),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  formIdx: index('form_embeds_form_idx').on(table.formId),
  typeIdx: index('form_embeds_type_idx').on(table.type),
}));
```

### form_webhooks

```typescript
export const formWebhooks = nexus.table('form_webhooks', {
  id:              uuid('id').primaryKey().defaultRandom(),
  formId:          uuid('form_id').notNull().references(() => forms.id, { onDelete: 'cascade' }),
  tenantId:        uuid('tenant_id').notNull().references(() => tenants.id),
  name:            varchar('name', { length: 255 }).notNull(),
  url:             text('url').notNull(),
  method:          varchar('method', { length: 10 }).notNull().default('POST'),
  events:          jsonb('events').notNull().default('[]'),
  headers:         jsonb('headers').notNull().default('{}'),
  bodyTemplate:    text('body_template'),
  secret:          varchar('secret', { length: 255 }).notNull(),
  isActive:        boolean('is_active').notNull().default(true),
  failureCount:    integer('failure_count').notNull().default(0),
  lastSuccessAt:   timestamp('last_success_at', { withTimezone: true }),
  lastFailureAt:   timestamp('last_failure_at', { withTimezone: true }),
  lastError:       text('last_error'),
  maxRetries:      integer('max_retries').notNull().default(3),
  retryBackoffMs:  integer('retry_backoff_ms').notNull().default(1000),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  formIdx: index('form_webhooks_form_idx').on(table.formId),
  activeIdx: index('form_webhooks_active_idx').on(table.isActive),
}));
```

### form_analytics

```typescript
export const formAnalytics = nexus.table('form_analytics', {
  id:                  uuid('id').primaryKey().defaultRandom(),
  formId:              uuid('form_id').notNull().references(() => forms.id, { onDelete: 'cascade' }),
  tenantId:            uuid('tenant_id').notNull().references(() => tenants.id),
  periodStart:         timestamp('period_start', { withTimezone: true }).notNull(),
  periodEnd:           timestamp('period_end', { withTimezone: true }).notNull(),
  granularity:         varchar('granularity', { length: 10 }).notNull(),
  viewCount:           integer('view_count').notNull().default(0),
  startCount:          integer('start_count').notNull().default(0),
  completionCount:     integer('completion_count').notNull().default(0),
  abandonCount:        integer('abandon_count').notNull().default(0),
  spamCount:           integer('spam_count').notNull().default(0),
  completionRate:      real('completion_rate').notNull().default(0),
  avgCompletionTimeMs: integer('avg_completion_time_ms').notNull().default(0),
  medianCompletionTimeMs: integer('median_completion_time_ms').notNull().default(0),
  fieldDropoff:        jsonb('field_dropoff').notNull().default('[]'),
  fieldDistribution:   jsonb('field_distribution').notNull().default('[]'),
  deviceBreakdown:     jsonb('device_breakdown').notNull().default('{}'),
  referrerBreakdown:   jsonb('referrer_breakdown').notNull().default('{}'),
  embedBreakdown:      jsonb('embed_breakdown').notNull().default('{}'),
  surveyScores:        jsonb('survey_scores'),
  createdAt:           timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:           timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  formIdx: index('form_analytics_form_idx').on(table.formId),
  periodIdx: index('form_analytics_period_idx').on(table.periodStart, table.periodEnd),
  granularityIdx: index('form_analytics_granularity_idx').on(table.granularity),
  formPeriodUnique: unique().on(table.formId, table.periodStart, table.granularity),
}));
```

### Row-Level Security Policies

```sql
-- ─── forms ──────────────────────────────────────────────────────────
ALTER TABLE nexus.forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "forms_tenant_isolation" ON nexus.forms
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY "forms_public_read" ON nexus.forms
  FOR SELECT
  USING (
    status = 'published'
    AND allow_public = true
  );

-- ─── form_submissions ───────────────────────────────────────────────
ALTER TABLE nexus.form_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "submissions_tenant_isolation" ON nexus.form_submissions
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY "submissions_public_insert" ON nexus.form_submissions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM nexus.forms
      WHERE forms.id = form_submissions.form_id
      AND forms.status = 'published'
      AND forms.allow_public = true
    )
  );

-- ─── surveys ────────────────────────────────────────────────────────
ALTER TABLE nexus.surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "surveys_tenant_isolation" ON nexus.surveys
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Similar policies applied to all other tables...

-- ─── Cross-tenant template access ───────────────────────────────────
ALTER TABLE nexus.form_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "templates_own_or_system" ON nexus.form_templates
  FOR SELECT
  USING (
    tenant_id = current_setting('app.tenant_id')::uuid
    OR is_system = true
    OR (is_published = true AND tenant_id IS NOT NULL)
  );

CREATE POLICY "templates_own_write" ON nexus.form_templates
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

---

## Code Examples

### Example 1: Creating a Contact Form

```typescript
import { FormService, FormFieldService } from '@mcv/nexus/forms';
import { FieldType } from '@mcv/nexus/forms';

const formService = new FormService(db, tenantId);
const fieldService = new FormFieldService(db, tenantId);

// Create the form
const form = await formService.create({
  title: 'Contact Us',
  description: 'We\'d love to hear from you. Send us a message and we\'ll respond within 24 hours.',
  allowPublic: true,
  sendConfirmationEmail: true,
  confirmationMessage: 'Thank you for reaching out! We\'ll get back to you shortly.',
  notificationEmails: ['support@acme.com'],
  theme: {
    primaryColor: '#4F46E5',
    backgroundColor: '#FFFFFF',
    textColor: '#111827',
    fontFamily: 'Inter, sans-serif',
    fontSize: 16,
    borderRadius: 8,
    inputStyle: 'outlined',
    buttonStyle: 'filled',
    layout: 'standard',
    customCss: null,
    logoUrl: 'https://acme.com/logo.svg',
    logoPosition: 'center',
    backgroundImageUrl: null,
    showBranding: false,
  },
  spamProtection: {
    recaptchaEnabled: true,
    recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY!,
    recaptchaThreshold: 0.5,
    honeypotEnabled: true,
    honeypotFieldName: '_hp_website',
    rateLimitEnabled: true,
    rateLimitMaxSubmissions: 5,
    rateLimitWindowSeconds: 3600,
    ipBlockingEnabled: false,
    blockedIps: [],
    allowedIps: [],
    botDetectionEnabled: true,
    minCompletionTimeSeconds: 3,
    countryBlockingEnabled: false,
    blockedCountries: [],
    allowedCountries: [],
  },
});

// Add fields
await fieldService.createMany(form.id, [
  {
    type: FieldType.NAME,
    label: 'Your Name',
    name: 'full_name',
    required: true,
    order: 0,
    width: 12,
    config: {
      nameFields: ['first', 'last'],
    },
  },
  {
    type: FieldType.EMAIL,
    label: 'Email Address',
    name: 'email',
    required: true,
    placeholder: 'you@example.com',
    order: 1,
    width: 6,
    validation: {
      messages: {
        required: 'We need your email to get back to you.',
        invalid: 'Please enter a valid email address.',
      },
    },
  },
  {
    type: FieldType.PHONE,
    label: 'Phone Number',
    name: 'phone',
    required: false,
    placeholder: '+1 (555) 000-0000',
    order: 2,
    width: 6,
  },
  {
    type: FieldType.SELECT,
    label: 'What can we help you with?',
    name: 'subject',
    required: true,
    order: 3,
    width: 12,
    config: {
      options: [
        { value: 'general', label: 'General Inquiry', order: 0 },
        { value: 'support', label: 'Technical Support', order: 1 },
        { value: 'billing', label: 'Billing Question', order: 2 },
        { value: 'partnership', label: 'Partnership Opportunity', order: 3 },
        { value: 'other', label: 'Other', order: 4 },
      ],
      allowOther: false,
    },
  },
  {
    type: FieldType.TEXTAREA,
    label: 'Your Message',
    name: 'message',
    required: true,
    placeholder: 'Tell us how we can help...',
    order: 4,
    width: 12,
    config: {
      rows: 5,
      minLength: 10,
      maxLength: 5000,
    },
    validation: {
      messages: {
        min: 'Please write at least 10 characters.',
      },
    },
  },
  {
    type: FieldType.FILE_UPLOAD,
    label: 'Attachments (optional)',
    name: 'attachments',
    required: false,
    order: 5,
    width: 12,
    config: {
      allowedMimeTypes: ['image/*', 'application/pdf', '.doc', '.docx'],
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 3,
      dragAndDrop: true,
    },
  },
]);

// Publish the form
await formService.publish(form.id);

console.log(`Form published at: /forms/${form.slug}`);
// Form published at: /forms/contact-us
```

### Example 2: Multi-Step Application Form with Conditional Logic

```typescript
import {
  FormService,
  FormFieldService,
  ConditionalLogicEngine,
  FieldType,
  ConditionalOperator,
  ConditionalAction,
} from '@mcv/nexus/forms';

const formService = new FormService(db, tenantId);
const fieldService = new FormFieldService(db, tenantId);

// Create a multi-step job application form
const form = await formService.create({
  title: 'Job Application',
  description: 'Apply for a position at Acme Corp.',
  allowPublic: true,
  isMultiStep: true,
  allowSaveAndResume: true,
  settings: {
    showProgressBar: true,
    progressBarStyle: 'steps',
    showFieldNumbers: false,
    autosave: true,
    autosaveIntervalMs: 30000,
    allowMultipleSubmissions: false,
    requireAuth: false,
    collectIpAddress: false,
    collectDeviceInfo: false,
    keyboardNavigation: true,
    timeLimitSeconds: null,
    showTimeRemaining: false,
    locale: 'en-US',
    customClass: null,
    gaTrackingId: null,
    fbPixelId: null,
  },
  steps: [
    { id: 'step-1', title: 'Personal Info', description: 'Tell us about yourself', order: 0, fieldIds: [], skipConditions: null },
    { id: 'step-2', title: 'Experience', description: 'Your professional background', order: 1, fieldIds: [], skipConditions: null },
    { id: 'step-3', title: 'Position', description: 'The role you\'re applying for', order: 2, fieldIds: [], skipConditions: null },
    { id: 'step-4', title: 'Additional Info', description: 'Anything else we should know', order: 3, fieldIds: [], skipConditions: null },
  ],
});

// Step 1: Personal Info
const nameField = await fieldService.create(form.id, {
  type: FieldType.NAME,
  label: 'Full Name',
  name: 'full_name',
  required: true,
  order: 0,
  stepIndex: 0,
  config: { nameFields: ['first', 'middle', 'last'] },
});

const emailField = await fieldService.create(form.id, {
  type: FieldType.EMAIL,
  label: 'Email',
  name: 'email',
  required: true,
  order: 1,
  stepIndex: 0,
  validation: { unique: true },
});

const phoneField = await fieldService.create(form.id, {
  type: FieldType.PHONE,
  label: 'Phone',
  name: 'phone',
  required: true,
  order: 2,
  stepIndex: 0,
});

const addressField = await fieldService.create(form.id, {
  type: FieldType.ADDRESS,
  label: 'Address',
  name: 'address',
  required: true,
  order: 3,
  stepIndex: 0,
  config: {
    addressFields: ['street', 'city', 'state', 'zip', 'country'],
    autocomplete: true,
    defaultCountry: 'US',
  },
});

// Step 2: Experience
const experienceField = await fieldService.create(form.id, {
  type: FieldType.SELECT,
  label: 'Years of Experience',
  name: 'experience_years',
  required: true,
  order: 0,
  stepIndex: 1,
  config: {
    options: [
      { value: '0-1', label: '0-1 years', order: 0 },
      { value: '2-4', label: '2-4 years', order: 1 },
      { value: '5-9', label: '5-9 years', order: 2 },
      { value: '10+', label: '10+ years', order: 3 },
    ],
  },
});

const resumeField = await fieldService.create(form.id, {
  type: FieldType.FILE_UPLOAD,
  label: 'Resume/CV',
  name: 'resume',
  required: true,
  order: 1,
  stepIndex: 1,
  config: {
    allowedMimeTypes: ['application/pdf', '.doc', '.docx'],
    maxFileSize: 5 * 1024 * 1024,
    maxFiles: 1,
    dragAndDrop: true,
  },
});

const portfolioField = await fieldService.create(form.id, {
  type: FieldType.URL,
  label: 'Portfolio/LinkedIn URL',
  name: 'portfolio_url',
  required: false,
  order: 2,
  stepIndex: 1,
  placeholder: 'https://',
});

// Step 3: Position
const positionField = await fieldService.create(form.id, {
  type: FieldType.SELECT,
  label: 'Position Applying For',
  name: 'position',
  required: true,
  order: 0,
  stepIndex: 2,
  config: {
    options: [
      { value: 'engineering', label: 'Software Engineering', order: 0 },
      { value: 'design', label: 'Design', order: 1 },
      { value: 'marketing', label: 'Marketing', order: 2 },
      { value: 'sales', label: 'Sales', order: 3 },
      { value: 'other', label: 'Other', order: 4 },
    ],
    allowOther: true,
  },
});

// Conditional field: only shown when position = 'engineering'
const techStackField = await fieldService.create(form.id, {
  type: FieldType.CHECKBOX_GROUP,
  label: 'Tech Stack',
  name: 'tech_stack',
  required: false,
  order: 1,
  stepIndex: 2,
  config: {
    options: [
      { value: 'typescript', label: 'TypeScript', order: 0 },
      { value: 'react', label: 'React', order: 1 },
      { value: 'node', label: 'Node.js', order: 2 },
      { value: 'python', label: 'Python', order: 3 },
      { value: 'go', label: 'Go', order: 4 },
      { value: 'rust', label: 'Rust', order: 5 },
      { value: 'postgres', label: 'PostgreSQL', order: 6 },
    ],
  },
  conditionalRules: [
    {
      id: crypto.randomUUID(),
      formId: form.id,
      tenantId,
      sourceFieldId: positionField.id,
      operator: ConditionalOperator.EQUALS,
      value: 'engineering',
      action: ConditionalAction.SHOW,
      targetFieldId: null, // self
      targetStep: null,
      setValue: null,
      priority: 0,
      enabled: true,
      group: null,
      groupOperator: 'and',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
});

// Conditional field: only shown when position = 'design'
const designToolsField = await fieldService.create(form.id, {
  type: FieldType.CHECKBOX_GROUP,
  label: 'Design Tools',
  name: 'design_tools',
  required: false,
  order: 2,
  stepIndex: 2,
  config: {
    options: [
      { value: 'figma', label: 'Figma', order: 0 },
      { value: 'sketch', label: 'Sketch', order: 1 },
      { value: 'adobe_xd', label: 'Adobe XD', order: 2 },
      { value: 'illustrator', label: 'Illustrator', order: 3 },
      { value: 'photoshop', label: 'Photoshop', order: 4 },
    ],
  },
  conditionalRules: [
    {
      id: crypto.randomUUID(),
      formId: form.id,
      tenantId,
      sourceFieldId: positionField.id,
      operator: ConditionalOperator.EQUALS,
      value: 'design',
      action: ConditionalAction.SHOW,
      targetFieldId: null,
      targetStep: null,
      setValue: null,
      priority: 0,
      enabled: true,
      group: null,
      groupOperator: 'and',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
});

// Step 4: Additional
const coverLetterField = await fieldService.create(form.id, {
  type: FieldType.TEXTAREA,
  label: 'Cover Letter',
  name: 'cover_letter',
  required: false,
  order: 0,
  stepIndex: 3,
  config: { rows: 8, maxLength: 10000 },
});

const salaryField = await fieldService.create(form.id, {
  type: FieldType.CURRENCY,
  label: 'Desired Salary (Annual)',
  name: 'desired_salary',
  required: false,
  order: 1,
  stepIndex: 3,
  config: { currency: 'USD', min: 0 },
});

const startDateField = await fieldService.create(form.id, {
  type: FieldType.DATE,
  label: 'Earliest Start Date',
  name: 'start_date',
  required: true,
  order: 2,
  stepIndex: 3,
  config: { minDate: new Date().toISOString().split('T')[0] },
});

// Validate and publish
const validation = await formService.validate(form.id);
if (validation.valid) {
  await formService.publish(form.id);
  console.log('Application form published!');
} else {
  console.error('Validation errors:', validation.errors);
}
```

### Example 3: NPS Survey with Scoring

```typescript
import {
  FormService,
  FormFieldService,
  SurveyService,
  FieldType,
  SurveyType,
} from '@mcv/nexus/forms';

const formService = new FormService(db, tenantId);
const fieldService = new FormFieldService(db, tenantId);
const surveyService = new SurveyService(db, tenantId);

// Create the underlying form
const form = await formService.create({
  title: 'Customer Satisfaction - Q1 2026',
  allowPublic: true,
  settings: {
    showProgressBar: false,
    showFieldNumbers: false,
    autosave: false,
    autosaveIntervalMs: 0,
    allowMultipleSubmissions: false,
    requireAuth: false,
    collectIpAddress: false,
    collectDeviceInfo: true,
    keyboardNavigation: true,
    timeLimitSeconds: null,
    showTimeRemaining: false,
    locale: 'en-US',
    customClass: null,
    gaTrackingId: null,
    fbPixelId: null,
    progressBarStyle: 'bar',
  },
  theme: {
    primaryColor: '#7C3AED',
    backgroundColor: '#F5F3FF',
    textColor: '#1F2937',
    fontFamily: 'Inter, sans-serif',
    fontSize: 18,
    borderRadius: 12,
    inputStyle: 'filled',
    buttonStyle: 'filled',
    layout: 'conversational',
    customCss: null,
    logoUrl: null,
    logoPosition: 'center',
    backgroundImageUrl: null,
    showBranding: false,
  },
});

// Add NPS question
const npsField = await fieldService.create(form.id, {
  type: FieldType.NPS,
  label: 'How likely are you to recommend us to a friend or colleague?',
  name: 'nps_score',
  required: true,
  order: 0,
  config: {
    npsLowLabel: 'Not at all likely',
    npsHighLabel: 'Extremely likely',
  },
});

// Add follow-up question
const feedbackField = await fieldService.create(form.id, {
  type: FieldType.TEXTAREA,
  label: 'What\'s the primary reason for your score?',
  name: 'feedback',
  required: false,
  order: 1,
  config: { rows: 4, maxLength: 2000 },
});

// Add CSAT question
const csatField = await fieldService.create(form.id, {
  type: FieldType.RATING,
  label: 'How satisfied are you with our product overall?',
  name: 'satisfaction',
  required: true,
  order: 2,
  config: {
    maxRating: 5,
    ratingIcon: 'star',
    allowHalf: false,
  },
});

// Add CES question
const cesField = await fieldService.create(form.id, {
  type: FieldType.SCALE,
  label: 'How easy was it to get your issue resolved?',
  name: 'effort',
  required: true,
  order: 3,
  config: {
    scaleStart: 1,
    scaleEnd: 7,
    scaleLabels: {
      1: 'Very difficult',
      4: 'Neutral',
      7: 'Very easy',
    },
  },
});

// Create the survey layer
const survey = await surveyService.create({
  formId: form.id,
  type: SurveyType.NPS,
  title: 'Customer Satisfaction - Q1 2026',
  description: 'Help us improve by sharing your experience.',
  welcomeScreen: {
    title: 'We value your feedback',
    description: 'This survey takes about 2 minutes. Your responses are anonymous.',
    imageUrl: null,
    buttonText: 'Start Survey',
  },
  thankYouScreen: {
    title: 'Thank you!',
    description: 'Your feedback helps us improve. We appreciate your time.',
    imageUrl: null,
    buttonText: 'Close',
  },
  randomizeQuestions: false,
  randomizeOptions: false,
  responseQuota: 1000,
  isAnonymous: true,
  allowEditing: false,
  showResults: true,
  resultsDisplay: 'chart',
  showScore: false,
  scoring: null,
  scoreRanges: null,
  reminders: [
    {
      delayHours: 48,
      channel: 'email',
      message: 'We noticed you haven\'t completed our survey yet. Your feedback matters!',
      enabled: true,
    },
  ],
});

// Publish and get the standalone URL
await formService.publish(form.id);

console.log(`Survey available at: /s/${form.slug}`);
console.log(`Response quota: ${survey.responseQuota}`);
```

### Example 4: Submitting a Form Programmatically

```typescript
import { SubmissionService, SpamProtectionService, ValidationEngine } from '@mcv/nexus/forms';

const submissionService = new SubmissionService(db, tenantId);
const spamService = new SpamProtectionService(db, tenantId);
const validator = new ValidationEngine(db, tenantId);

// Prepare submission data
const formId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const submissionData: SubmitFormInput = {
  formId,
  values: {
    full_name: { first: 'Jane', last: 'Doe' },
    email: 'jane.doe@example.com',
    phone: '+1-555-123-4567',
    subject: 'support',
    message: 'I\'m having trouble logging into my account. I\'ve tried resetting my password but the link never arrives.',
  },
  metadata: {
    utm_source: 'google',
    utm_medium: 'cpc',
    utm_campaign: 'support-2026',
    referrer: 'https://google.com',
  },
  recaptchaToken: 'token-from-client-recaptcha',
  completionTimeMs: 45000,
};

// Step 1: Spam check
const spamResult = await spamService.evaluate(formId, {
  recaptchaToken: submissionData.recaptchaToken,
  ipAddress: '203.0.113.42',
  userAgent: 'Mozilla/5.0 ...',
  completionTimeMs: submissionData.completionTimeMs,
  honeypotValue: '', // empty = good, filled = bot
});

if (spamResult.verdict === 'spam' || spamResult.verdict === 'rate_limited') {
  throw new Error(`Submission blocked: ${spamResult.verdict} (reason: ${spamResult.reason})`);
}

// Step 2: Validate
const validationResult = await validator.validate(formId, submissionData.values);
if (!validationResult.valid) {
  console.error('Validation errors:', validationResult.errors);
  // validationResult.errors → [{ fieldName: 'email', code: 'INVALID_EMAIL', message: '...' }]
  throw new Error('Validation failed');
}

// Step 3: Create submission
const submission = await submissionService.create({
  ...submissionData,
  ipAddress: '203.0.113.42',
  userAgent: 'Mozilla/5.0 ...',
  spamVerdict: spamResult.verdict,
  recaptchaScore: spamResult.recaptchaScore,
});

console.log('Submission created:', submission.id);
console.log('Status:', submission.status);
// Submission created: a1b2c3d4-e5f6-7890-abcd-ef1234567890
// Status: completed

// Step 4: Retrieve submission with values
const full = await submissionService.get(submission.id, { includeValues: true });
for (const val of full.values) {
  console.log(`  ${val.fieldName}: ${JSON.stringify(val.value)}`);
}
```

### Example 5: Embedding a Form

```typescript
import { FormEmbedService, EmbedType } from '@mcv/nexus/forms';

const embedService = new FormEmbedService(db, tenantId);

// ─── 1. Inline iframe embed ────────────────────────────────────────
const iframeEmbed = await embedService.create({
  formId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  type: EmbedType.IFRAME,
  config: {
    width: '100%',
    height: '600px',
    border: 'none',
    backgroundColor: 'transparent',
  },
});

console.log('Iframe embed code:');
console.log(iframeEmbed.embedCode);
// <iframe
//   src="https://forms.mcv.one/embed/f47ac10b-58cc-4372-a567-0e02b2c3d479?embed=iframe"
//   width="100%" height="600px"
//   style="border: none; background: transparent;"
//   loading="lazy"
//   allow="camera; microphone"
// ></iframe>

// ─── 2. Popup embed with exit-intent trigger ───────────────────────
const popupEmbed = await embedService.create({
  formId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  type: EmbedType.POPUP,
  config: {
    trigger: 'exit_intent',
    showOverlay: true,
    closeOnOverlayClick: true,
    showCloseButton: true,
    frequency: 'once_per_session',
    width: '500px',
    height: 'auto',
    backgroundColor: '#FFFFFF',
  },
});

console.log('Popup embed code:');
console.log(popupEmbed.embedCode);
// <script
//   src="https://forms.mcv.one/sdk/embed.js"
//   data-form-id="f47ac10b-58cc-4372-a567-0e02b2c3d479"
//   data-embed-type="popup"
//   data-trigger="exit_intent"
//   data-frequency="once_per_session"
//   async
// ></script>

// ─── 3. Slide-in from right ────────────────────────────────────────
const slideInEmbed = await embedService.create({
  formId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  type: EmbedType.SLIDE_IN,
  config: {
    trigger: 'scroll',
    triggerScrollPercent: 50,
    slideDirection: 'right',
    showOverlay: false,
    showCloseButton: true,
    frequency: 'once_per_day',
    width: '400px',
  },
});

// ─── 4. React component embed ──────────────────────────────────────
// In your React application:
// import { FormEmbedWidget } from '@mcv/nexus/forms';
//
// function ContactPage() {
//   return (
//     <FormEmbedWidget
//       formId="f47ac10b-58cc-4372-a567-0e02b2c3d479"
//       theme={{ primaryColor: '#4F46E5' }}
//       onSubmit={(submission) => {
//         console.log('Form submitted:', submission.id);
//         analytics.track('form_submitted', { formId: submission.formId });
//       }}
//       onError={(error) => {
//         console.error('Form error:', error);
//       }}
//       className="my-form-container"
//     />
//   );
// }

// ─── 5. Standalone URL with custom domain ──────────────────────────
const standaloneEmbed = await embedService.create({
  formId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  type: EmbedType.STANDALONE,
  customDomain: 'forms.acme.com',
  config: {
    themeOverride: {
      showBranding: false,
      backgroundColor: '#F9FAFB',
    },
  },
});

console.log('Standalone URL:', standaloneEmbed.standaloneUrl);
// https://forms.acme.com/contact-us
```

### Example 6: Querying Submissions and Exporting Data

```typescript
import { SubmissionService, exportSubmissionsCSV, exportSubmissionsXLSX } from '@mcv/nexus/forms';

const submissionService = new SubmissionService(db, tenantId);

// ─── List submissions with filters ─────────────────────────────────
const result = await submissionService.list({
  formId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  status: ['completed', 'approved'],
  dateFrom: new Date('2026-01-01'),
  dateTo: new Date('2026-02-01'),
  search: 'jane',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  page: 1,
  pageSize: 25,
});

console.log(`Found ${result.total} submissions (page ${result.page}/${result.totalPages})`);

for (const submission of result.items) {
  console.log(`  [${submission.id}] ${submission.status} at ${submission.createdAt}`);
  for (const val of submission.values) {
    console.log(`    ${val.fieldName}: ${JSON.stringify(val.value)}`);
  }
}

// ─── Filter by field value ──────────────────────────────────────────
const supportSubmissions = await submissionService.list({
  formId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  fieldFilters: [
    { fieldName: 'subject', operator: 'eq', value: 'support' },
    { fieldName: 'message', operator: 'contains', value: 'password' },
  ],
  page: 1,
  pageSize: 50,
});

// ─── Export to CSV ──────────────────────────────────────────────────
const csvBuffer = await exportSubmissionsCSV({
  formId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  filters: {
    status: ['completed'],
    dateFrom: new Date('2026-01-01'),
  },
  columns: ['full_name', 'email', 'subject', 'message', 'createdAt'],
  includeMetadata: true,
  db,
  tenantId,
});

// csvBuffer is a Buffer containing UTF-8 CSV data
// Write to file or send as download
const fs = await import('fs/promises');
await fs.writeFile('submissions.csv', csvBuffer);

// ─── Export to XLSX ─────────────────────────────────────────────────
const xlsxBuffer = await exportSubmissionsXLSX({
  formId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  filters: { status: ['completed'] },
  includeMetadata: true,
  includeFileLinks: true,
  db,
  tenantId,
});

await fs.writeFile('submissions.xlsx', xlsxBuffer);
```

### Example 7: Form Analytics Dashboard

```typescript
import { FormAnalyticsService, calculateNPS, calculateCSAT, calculateCES } from '@mcv/nexus/forms';

const analyticsService = new FormAnalyticsService(db, tenantId);

// ─── Get overall form analytics ─────────────────────────────────────
const summary = await analyticsService.getSummary({
  formId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  dateFrom: new Date('2026-01-01'),
  dateTo: new Date('2026-02-01'),
});

console.log('Form Analytics Summary:');
console.log(`  Total views:       ${summary.totalViews}`);
console.log(`  Total starts:      ${summary.totalStarts}`);
console.log(`  Total completions: ${summary.totalCompletions}`);
console.log(`  Completion rate:   ${(summary.completionRate * 100).toFixed(1)}%`);
console.log(`  Avg completion:    ${(summary.avgCompletionTimeMs / 1000).toFixed(1)}s`);
console.log(`  Spam blocked:      ${summary.totalSpam}`);

// ─── Get field-level drop-off analysis ──────────────────────────────
const dropoff = await analyticsService.getFieldDropoff({
  formId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  dateFrom: new Date('2026-01-01'),
  dateTo: new Date('2026-02-01'),
});

console.log('\nField Drop-off:');
for (const field of dropoff) {
  const bar = '█'.repeat(Math.round(field.dropoffRate * 20));
  console.log(`  ${field.fieldLabel.padEnd(25)} ${bar} ${(field.dropoffRate * 100).toFixed(1)}% drop-off`);
}
// Field Drop-off:
//   Your Name                 ██ 8.2% drop-off
//   Email Address             █ 3.1% drop-off
//   Phone Number              ████ 18.5% drop-off
//   Subject                   █ 2.0% drop-off
//   Your Message              ██████ 28.3% drop-off
//   Attachments               ████████ 40.1% drop-off

// ─── Get trend data for charting ────────────────────────────────────
const trend = await analyticsService.getTrend({
  formId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  dateFrom: new Date('2026-01-01'),
  dateTo: new Date('2026-02-01'),
  granularity: 'day',
});

// trend: FormAnalytics[] — one record per day
for (const day of trend) {
  console.log(`${day.periodStart.toISOString().split('T')[0]}: ${day.completionCount} completions`);
}

// ─── Survey-specific scoring ────────────────────────────────────────
const surveyAnalytics = await analyticsService.getSurveyScores({
  surveyId: 'survey-uuid-here',
  dateFrom: new Date('2026-01-01'),
  dateTo: new Date('2026-02-01'),
});

if (surveyAnalytics.surveyScores) {
  const { npsScore, npsPromoters, npsPassives, npsDetractors } = surveyAnalytics.surveyScores;
  console.log(`\nNPS Score: ${npsScore}`);
  console.log(`  Promoters:  ${npsPromoters}`);
  console.log(`  Passives:   ${npsPassives}`);
  console.log(`  Detractors: ${npsDetractors}`);

  if (surveyAnalytics.surveyScores.csatScore !== undefined) {
    console.log(`\nCSAT Score: ${surveyAnalytics.surveyScores.csatScore}%`);
  }

  if (surveyAnalytics.surveyScores.cesScore !== undefined) {
    console.log(`\nCES Score: ${surveyAnalytics.surveyScores.cesScore} / 7`);
  }
}

// ─── Utility: Calculate NPS from raw scores ─────────────────────────
const rawScores = [10, 9, 8, 7, 6, 10, 9, 3, 8, 10, 7, 9, 5, 10, 8];
const nps = calculateNPS(rawScores);
console.log(`\nCalculated NPS: ${nps.score}`);
console.log(`  Promoters:  ${nps.promoterCount} (${(nps.promoterPercent * 100).toFixed(0)}%)`);
console.log(`  Passives:   ${nps.passiveCount} (${(nps.passivePercent * 100).toFixed(0)}%)`);
console.log(`  Detractors: ${nps.detractorCount} (${(nps.detractorPercent * 100).toFixed(0)}%)`);
// Calculated NPS: 33
//   Promoters:  7 (47%)
//   Passives:   4 (27%)
//   Detractors: 4 (27%)
```

### Example 8: Webhooks and Integration

```typescript
import { FormWebhookService, WebhookEvent } from '@mcv/nexus/forms';

const webhookService = new FormWebhookService(db, tenantId);

// ─── Create a webhook for Slack notifications ──────────────────────
const slackWebhook = await webhookService.create({
  formId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  name: 'Slack Notification',
  url: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
  method: 'POST',
  events: [WebhookEvent.SUBMISSION_CREATED],
  headers: {
    'Content-Type': 'application/json',
  },
  bodyTemplate: JSON.stringify({
    text: '📋 New form submission!',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*New submission on {{form.title}}*\n\n{{#each values}}• *{{this.fieldLabel}}:* {{this.value}}\n{{/each}}',
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: 'Submitted at {{submission.createdAt}} | <{{dashboardUrl}}|View in dashboard>',
          },
        ],
      },
    ],
  }),
});

// ─── Create a Zapier webhook ────────────────────────────────────────
const zapierWebhook = await webhookService.create({
  formId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  name: 'Zapier - Add to Google Sheets',
  url: 'https://hooks.zapier.com/hooks/catch/123456/abcdef/',
  method: 'POST',
  events: [WebhookEvent.SUBMISSION_CREATED, WebhookEvent.SUBMISSION_APPROVED],
  headers: {},
  bodyTemplate: null, // null = send full submission JSON
});

// ─── Create a CRM integration webhook ──────────────────────────────
const crmWebhook = await webhookService.create({
  formId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  name: 'CRM - Create Contact',
  url: 'https://api.acme-crm.com/v1/contacts',
  method: 'POST',
  events: [WebhookEvent.SUBMISSION_CREATED],
  headers: {
    'Authorization': 'Bearer {{env.CRM_API_KEY}}',
    'Content-Type': 'application/json',
  },
  bodyTemplate: JSON.stringify({
    firstName: '{{values.full_name.first}}',
    lastName: '{{values.full_name.last}}',
    email: '{{values.email}}',
    phone: '{{values.phone}}',
    source: 'web_form',
    formName: '{{form.title}}',
    notes: '{{values.message}}',
  }),
});

// ─── Test a webhook ─────────────────────────────────────────────────
const testResult = await webhookService.test(slackWebhook.id);
console.log(`Webhook test result: ${testResult.success ? 'OK' : 'FAILED'}`);
console.log(`Response status: ${testResult.statusCode}`);
if (!testResult.success) {
  console.error(`Error: ${testResult.error}`);
}

// ─── List webhooks for a form ───────────────────────────────────────
const webhooks = await webhookService.list({
  formId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
});

for (const wh of webhooks) {
  console.log(`  ${wh.name} → ${wh.url}`);
  console.log(`    Events: ${wh.events.join(', ')}`);
  console.log(`    Active: ${wh.isActive}, Failures: ${wh.failureCount}`);
  if (wh.lastSuccessAt) {
    console.log(`    Last success: ${wh.lastSuccessAt}`);
  }
  if (wh.lastError) {
    console.log(`    Last error: ${wh.lastError}`);
  }
}

// ─── Webhook payload signature verification (receiver side) ─────────
import { createHmac } from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const expected = createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return `sha256=${expected}` === signature;
}

// In your webhook receiver:
// const isValid = verifyWebhookSignature(
//   req.body,
//   req.headers['x-mcv-signature'],
//   'your-webhook-secret',
// );
```

---

## Error Codes

All errors thrown by `@mcv/nexus/forms` follow the MCV error format with a `code`, `message`, and optional `details` object.

| Code | HTTP | Message | Description |
|---|---|---|---|
| `FORM_NOT_FOUND` | 404 | Form not found | The requested form does not exist or belongs to a different tenant |
| `FORM_NOT_PUBLISHED` | 403 | Form is not published | Attempted to access/submit a form that is not in `published` status |
| `FORM_EXPIRED` | 410 | Form has expired | The form's `expiresAt` date has passed |
| `FORM_CLOSED` | 403 | Form is closed | The form has been manually closed and is no longer accepting submissions |
| `FORM_ARCHIVED` | 403 | Form is archived | Attempted to modify an archived form; unarchive first |
| `FORM_SUBMISSION_LIMIT_REACHED` | 429 | Submission limit reached | The form has reached its maximum number of allowed submissions |
| `FORM_TITLE_REQUIRED` | 400 | Form title is required | The `title` field was empty or missing during form creation |
| `FORM_SLUG_TAKEN` | 409 | Form slug already exists | The generated or provided slug conflicts with an existing form in the same tenant |
| `FORM_NO_FIELDS` | 400 | Form has no fields | Attempted to publish a form with zero fields |
| `FORM_ALREADY_PUBLISHED` | 409 | Form is already published | Attempted to publish a form that is already in `published` status |
| `FORM_VALIDATION_FAILED` | 400 | Form configuration is invalid | Pre-publish validation detected errors in form configuration |
| `FORM_HAS_SUBMISSIONS` | 409 | Cannot delete form with submissions | Attempted to hard-delete a form that has submissions; use archive instead |
| `FIELD_NOT_FOUND` | 404 | Form field not found | The referenced field does not exist on the specified form |
| `FIELD_NAME_TAKEN` | 409 | Field name already exists | Duplicate field name within the same form |
| `FIELD_TYPE_INVALID` | 400 | Invalid field type | The specified `FieldType` is not recognized |
| `FIELD_CONFIG_INVALID` | 400 | Invalid field configuration | The field's `config` object is malformed for its type |
| `SUBMISSION_NOT_FOUND` | 404 | Submission not found | The requested submission does not exist or belongs to a different tenant |
| `SUBMISSION_VALIDATION_FAILED` | 400 | Submission validation failed | One or more field values failed validation; `details.errors` contains per-field errors |
| `SUBMISSION_SPAM_BLOCKED` | 403 | Submission blocked as spam | The spam protection system rejected this submission |
| `SUBMISSION_RATE_LIMITED` | 429 | Too many submissions | The submitter has exceeded the rate limit for this form |
| `SUBMISSION_DUPLICATE` | 409 | Duplicate submission | A field with `unique: true` validation detected a duplicate value |
| `SUBMISSION_RESUME_EXPIRED` | 410 | Resume token expired | The save-and-resume token has expired (default 30 days) |
| `SURVEY_NOT_FOUND` | 404 | Survey not found | The requested survey does not exist or belongs to a different tenant |
| `SURVEY_QUOTA_REACHED` | 429 | Survey response quota reached | The survey has reached its maximum number of responses |
| `SURVEY_NOT_ACTIVE` | 403 | Survey is not active | The survey is outside its scheduled start/end window |
| `TEMPLATE_NOT_FOUND` | 404 | Template not found | The referenced template does not exist or is not accessible |
| `TEMPLATE_CONFIG_INVALID` | 400 | Invalid template configuration | The template's `config` object is malformed |
| `EMBED_NOT_FOUND` | 404 | Embed configuration not found | The referenced embed does not exist |
| `WEBHOOK_NOT_FOUND` | 404 | Webhook not found | The referenced webhook does not exist |
| `WEBHOOK_URL_INVALID` | 400 | Invalid webhook URL | The webhook URL is not a valid HTTPS URL |
| `WEBHOOK_DELIVERY_FAILED` | 502 | Webhook delivery failed | The webhook endpoint returned a non-2xx status code |
| `RECAPTCHA_FAILED` | 403 | reCAPTCHA verification failed | The reCAPTCHA token was invalid or scored below the threshold |
| `FILE_TOO_LARGE` | 413 | File exceeds maximum size | An uploaded file exceeds the field's `maxFileSize` limit |
| `FILE_TYPE_NOT_ALLOWED` | 400 | File type not allowed | An uploaded file's MIME type is not in the field's `allowedMimeTypes` |
| `FILE_UPLOAD_FAILED` | 500 | File upload failed | An error occurred while uploading a file to Supabase Storage |
| `CONDITIONAL_RULE_INVALID` | 400 | Invalid conditional rule | A conditional rule references a nonexistent field or has an invalid operator |
| `EXPRESSION_EVAL_ERROR` | 400 | Expression evaluation error | A calculated field's expression could not be evaluated |

### Error Response Format

```typescript
interface FormError {
  code: string;
  message: string;
  details?: {
    /** Per-field validation errors */
    errors?: Array<{
      fieldId: string;
      fieldName: string;
      code: string;
      message: string;
    }>;
    /** Form validation issues */
    issues?: FormValidationIssue[];
    /** Additional context */
    [key: string]: unknown;
  };
}

// Example error response:
// {
//   "code": "SUBMISSION_VALIDATION_FAILED",
//   "message": "Submission validation failed",
//   "details": {
//     "errors": [
//       {
//         "fieldId": "abc-123",
//         "fieldName": "email",
//         "code": "INVALID_EMAIL",
//         "message": "Please enter a valid email address."
//       },
//       {
//         "fieldId": "def-456",
//         "fieldName": "phone",
//         "code": "REQUIRED",
//         "message": "This field is required."
//       }
//     ]
//   }
// }
```

---

## Security

### Authentication & Authorization

| Operation | Auth Required | Permission |
|---|---|---|
| Create form | Yes | `forms:create` |
| Update form | Yes | `forms:update` (own or admin) |
| Delete form | Yes | `forms:delete` (own or admin) |
| Publish form | Yes | `forms:publish` |
| View form (admin) | Yes | `forms:read` |
| View form (public) | No | Form must be `published` + `allowPublic` |
| Submit form (authenticated) | Yes | `forms:submit` |
| Submit form (public) | No | Form must be `published` + `allowPublic` |
| View submissions | Yes | `submissions:read` |
| Export submissions | Yes | `submissions:export` |
| Manage webhooks | Yes | `webhooks:manage` |
| View analytics | Yes | `analytics:read` |
| Manage templates | Yes | `templates:manage` |
| Use system templates | Yes | `templates:read` |

### Row-Level Security

All database queries pass through Supabase RLS. The `tenant_id` is injected via `SET LOCAL app.tenant_id = '...'` at the start of every request transaction. This ensures:

- **Tenant isolation**: A tenant can never read or modify another tenant's forms, submissions, or analytics.
- **Public access**: Published forms with `allow_public = true` are accessible for reading and submission creation via dedicated RLS policies.
- **Template sharing**: System templates (`is_system = true`) and published marketplace templates are readable by all tenants.

### Input Sanitization

All user-provided content is sanitized before storage and rendering:

```typescript
// HTML content (rich text fields, confirmation messages)
import DOMPurify from 'isomorphic-dompurify';

const sanitized = DOMPurify.sanitize(userHtml, {
  ALLOWED_TAGS: ['b', 'i', 'u', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
});

// Custom CSS injection (form themes)
// CSS is parsed and validated using a whitelist of safe properties
import { sanitizeCss } from './utils/sanitize';

const safeCss = sanitizeCss(userCss, {
  allowedProperties: [
    'color', 'background-color', 'font-family', 'font-size',
    'font-weight', 'border', 'border-radius', 'padding', 'margin',
    'text-align', 'line-height', 'width', 'max-width',
  ],
  disallowedPatterns: [/url\(/i, /expression\(/i, /javascript:/i, /@import/i],
});

// Custom JS (embed config) — not stored in DB, only used client-side
// with a Content Security Policy that restricts execution
```

### File Upload Security

```typescript
// File validation pipeline:
// 1. Check MIME type against allowedMimeTypes
// 2. Check file size against maxFileSize
// 3. Scan file magic bytes (verify MIME matches actual content)
// 4. Strip EXIF metadata from images
// 5. Rename file with UUID (prevent path traversal)
// 6. Upload to Supabase Storage with restricted bucket policy

const STORAGE_BUCKET = 'form-uploads';
const MAX_GLOBAL_FILE_SIZE = 50 * 1024 * 1024; // 50MB hard limit

// Supabase Storage bucket policy:
// - Files are stored under: {tenant_id}/{form_id}/{submission_id}/{uuid}.{ext}
// - Read access: Only via signed URLs (default expiry: 1 hour)
// - Write access: Only via authenticated API calls
// - No public listing
```

### Spam Protection Layers

The module implements defense-in-depth against form spam:

1. **reCAPTCHA v3** — Invisible challenge with configurable score threshold (default: 0.5). Scores below threshold are rejected.
2. **Honeypot fields** — Invisible fields that bots fill in. Any submission with a non-empty honeypot value is automatically flagged.
3. **Rate limiting** — Configurable per-IP rate limits (default: 5 submissions per hour per form). Uses a sliding window algorithm.
4. **Bot detection heuristics** — Minimum completion time check (submissions completed faster than `minCompletionTimeSeconds` are flagged). Field interaction tracking.
5. **IP blocking** — Manual blocklist/allowlist of IP addresses and CIDR ranges.
6. **Country blocking** — GeoIP-based country filtering using MaxMind GeoLite2 database.

### Webhook Security

```typescript
// All webhook payloads are signed with HMAC-SHA256
// using the webhook's secret key.
//
// Header: X-MCV-Signature: sha256={hex_digest}
// Header: X-MCV-Timestamp: {unix_timestamp}
//
// Signature is computed over: {timestamp}.{body}
// This prevents replay attacks (receivers should reject
// signatures older than 5 minutes).

function signWebhookPayload(body: string, secret: string, timestamp: number): string {
  const payload = `${timestamp}.${body}`;
  const signature = createHmac('sha256', secret).update(payload).digest('hex');
  return `sha256=${signature}`;
}
```

### Data Privacy

- **IP collection opt-in**: IP addresses are only collected if `settings.collectIpAddress` is explicitly `true`.
- **Device info opt-in**: Browser/device info only collected if `settings.collectDeviceInfo` is `true`.
- **Anonymous surveys**: When `survey.isAnonymous = true`, no user ID or identifiable information is stored with the response.
- **Data export**: Submissions can be exported and then purged for GDPR data subject access requests.
- **Data retention**: Configurable per-tenant retention policies. Submissions older than the retention period are automatically purged.
- **Encryption at rest**: All data in Supabase PostgreSQL is encrypted at rest via AES-256.
- **Encryption in transit**: All connections use TLS 1.3.

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `SUPABASE_URL` | Yes | — | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Yes | — | Supabase service role key (server-side only) |
| `SUPABASE_ANON_KEY` | Yes | — | Supabase anonymous key (client-side) |
| `RECAPTCHA_SITE_KEY` | No | — | Google reCAPTCHA v3 site key (public) |
| `RECAPTCHA_SECRET_KEY` | No | — | Google reCAPTCHA v3 secret key (server-side) |
| `FORMS_STORAGE_BUCKET` | No | `form-uploads` | Supabase Storage bucket for file uploads |
| `FORMS_SIGNATURES_BUCKET` | No | `signatures` | Supabase Storage bucket for signature images |
| `FORMS_MAX_FILE_SIZE` | No | `52428800` | Global maximum file upload size in bytes (50MB) |
| `FORMS_MAX_FIELDS_PER_FORM` | No | `200` | Maximum number of fields per form |
| `FORMS_MAX_SUBMISSIONS_EXPORT` | No | `50000` | Maximum submissions per export operation |
| `FORMS_WEBHOOK_TIMEOUT_MS` | No | `10000` | Webhook HTTP request timeout in milliseconds |
| `FORMS_WEBHOOK_MAX_RETRIES` | No | `3` | Default max webhook retry attempts |
| `FORMS_RESUME_TOKEN_TTL_DAYS` | No | `30` | Save-and-resume token expiry in days |
| `FORMS_ANALYTICS_RETENTION_DAYS` | No | `365` | Analytics data retention in days |
| `FORMS_RATE_LIMIT_STORE` | No | `memory` | Rate limit store backend (`memory`, `redis`) |
| `REDIS_URL` | No | — | Redis connection URL (if `FORMS_RATE_LIMIT_STORE=redis`) |
| `FORMS_STANDALONE_BASE_URL` | No | `https://forms.mcv.one` | Base URL for standalone form pages |
| `FORMS_EMBED_SDK_URL` | No | `https://forms.mcv.one/sdk/embed.js` | URL for the embeddable JavaScript SDK |
| `MAXMIND_LICENSE_KEY` | No | — | MaxMind GeoLite2 license key (for country-based blocking) |
| `FORMS_CUSTOM_VALIDATION_DIR` | No | — | Directory path for custom validation function modules |
| `FORMS_ENABLE_SENTIMENT` | No | `false` | Enable sentiment analysis on text responses |

---

## Dependencies

### Runtime Dependencies

| Package | Version | Purpose |
|---|---|---|
| `drizzle-orm` | `^0.34` | Database ORM for PostgreSQL schema and queries |
| `@supabase/supabase-js` | `^2.45` | Supabase client for Storage and Edge Functions |
| `@trpc/server` | `^11` | Type-safe API layer |
| `zod` | `^3.23` | Runtime schema validation for DTOs |
| `isomorphic-dompurify` | `^2.15` | HTML sanitization |
| `nanoid` | `^5.0` | Short unique ID generation for slugs and tokens |
| `handlebars` | `^4.7` | Webhook body template rendering |
| `papaparse` | `^5.4` | CSV generation for submission exports |
| `exceljs` | `^4.4` | XLSX generation for submission exports |
| `sharp` | `^0.33` | Image processing (EXIF stripping, thumbnails) |
| `file-type` | `^19` | Magic byte detection for file upload validation |
| `maxmind` | `^4.3` | GeoIP lookups for country-based blocking |
| `css-tree` | `^3.0` | CSS parsing and sanitization |

### Peer Dependencies

| Package | Version | Purpose |
|---|---|---|
| `react` | `^18 \|\| ^19` | React hooks and components |
| `react-dom` | `^18 \|\| ^19` | DOM rendering for form components |
| `@dnd-kit/core` | `^6.1` | Drag-and-drop for form builder |
| `@dnd-kit/sortable` | `^8.0` | Sortable list for field reordering |

### Dev Dependencies

| Package | Version | Purpose |
|---|---|---|
| `vitest` | `^2.1` | Test runner |
| `@testing-library/react` | `^16` | React component testing |
| `msw` | `^2.6` | API mocking for integration tests |
| `drizzle-kit` | `^0.27` | Schema migrations |
| `@faker-js/faker` | `^9.2` | Test data generation |
| `playwright` | `^1.49` | E2E testing for form rendering and submission |

### Internal Dependencies

| Package | Purpose |
|---|---|
| `@mcv/core` | Shared types, error handling, logging, config |
| `@mcv/auth` | Authentication context, permission checks |
| `@mcv/nexus/notifications` | Email/Slack/Teams notifications on submission |
| `@mcv/nexus/storage` | File upload abstraction over Supabase Storage |
| `@mcv/nexus/workflows` | Trigger automated workflows on form events |
| `@mcv/nexus/crm` | Create CRM contacts from form submissions |

---

## Testing

### Test Structure

```
src/
├── __tests__/
│   ├── unit/
│   │   ├── form.service.test.ts
│   │   ├── form-field.service.test.ts
│   │   ├── submission.service.test.ts
│   │   ├── survey.service.test.ts
│   │   ├── conditional-logic.engine.test.ts
│   │   ├── validation.engine.test.ts
│   │   ├── spam-protection.service.test.ts
│   │   ├── form-webhook.service.test.ts
│   │   ├── form-analytics.service.test.ts
│   │   ├── form-embed.service.test.ts
│   │   ├── form-template.service.test.ts
│   │   └── utils/
│   │       ├── scoring.test.ts
│   │       ├── expression.test.ts
│   │       ├── export.test.ts
│   │       └── sanitize.test.ts
│   ├── integration/
│   │   ├── form-lifecycle.test.ts
│   │   ├── submission-flow.test.ts
│   │   ├── multi-step-form.test.ts
│   │   ├── conditional-logic.test.ts
│   │   ├── survey-scoring.test.ts
│   │   ├── webhook-dispatch.test.ts
│   │   ├── file-upload.test.ts
│   │   ├── spam-protection.test.ts
│   │   ├── analytics-aggregation.test.ts
│   │   └── rls-policies.test.ts
│   └── e2e/
│       ├── form-builder.spec.ts
│       ├── form-submission.spec.ts
│       ├── survey-flow.spec.ts
│       ├── embed-widget.spec.ts
│       └── export-download.spec.ts
```

### Running Tests

```bash
# All tests
pnpm test

# Unit tests only
pnpm test:unit

# Integration tests (requires Supabase local)
pnpm test:integration

# E2E tests (requires running dev server)
pnpm test:e2e

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage
```

### Example Unit Test: Conditional Logic Engine

```typescript
import { describe, it, expect } from 'vitest';
import { ConditionalLogicEngine } from '../services/conditional-logic.engine';
import { ConditionalOperator, ConditionalAction } from '../enums';

describe('ConditionalLogicEngine', () => {
  const engine = new ConditionalLogicEngine();

  describe('evaluateCondition', () => {
    it('should return true for EQUALS match', () => {
      const result = engine.evaluateCondition({
        operator: ConditionalOperator.EQUALS,
        sourceValue: 'engineering',
        targetValue: 'engineering',
      });
      expect(result).toBe(true);
    });

    it('should return false for EQUALS mismatch', () => {
      const result = engine.evaluateCondition({
        operator: ConditionalOperator.EQUALS,
        sourceValue: 'design',
        targetValue: 'engineering',
      });
      expect(result).toBe(false);
    });

    it('should handle CONTAINS operator', () => {
      expect(engine.evaluateCondition({
        operator: ConditionalOperator.CONTAINS,
        sourceValue: 'I need help with my password',
        targetValue: 'password',
      })).toBe(true);

      expect(engine.evaluateCondition({
        operator: ConditionalOperator.CONTAINS,
        sourceValue: 'I need help with my account',
        targetValue: 'password',
      })).toBe(false);
    });

    it('should handle BETWEEN operator', () => {
      expect(engine.evaluateCondition({
        operator: ConditionalOperator.BETWEEN,
        sourceValue: 5,
        targetValue: [1, 10],
      })).toBe(true);

      expect(engine.evaluateCondition({
        operator: ConditionalOperator.BETWEEN,
        sourceValue: 15,
        targetValue: [1, 10],
      })).toBe(false);
    });

    it('should handle IS_EMPTY operator', () => {
      expect(engine.evaluateCondition({
        operator: ConditionalOperator.IS_EMPTY,
        sourceValue: '',
        targetValue: null,
      })).toBe(true);

      expect(engine.evaluateCondition({
        operator: ConditionalOperator.IS_EMPTY,
        sourceValue: null,
        targetValue: null,
      })).toBe(true);

      expect(engine.evaluateCondition({
        operator: ConditionalOperator.IS_EMPTY,
        sourceValue: 'hello',
        targetValue: null,
      })).toBe(false);
    });

    it('should handle IN_LIST operator', () => {
      expect(engine.evaluateCondition({
        operator: ConditionalOperator.IN_LIST,
        sourceValue: 'react',
        targetValue: ['react', 'vue', 'angular'],
      })).toBe(true);

      expect(engine.evaluateCondition({
        operator: ConditionalOperator.IN_LIST,
        sourceValue: 'svelte',
        targetValue: ['react', 'vue', 'angular'],
      })).toBe(false);
    });

    it('should handle REGEX_MATCH operator', () => {
      expect(engine.evaluateCondition({
        operator: ConditionalOperator.REGEX_MATCH,
        sourceValue: 'john@example.com',
        targetValue: '^[\\w.-]+@[\\w.-]+\\.\\w+$',
      })).toBe(true);
    });
  });

  describe('evaluateVisibility', () => {
    const fields = [
      { id: 'field-1', name: 'position', conditionalRules: [] },
      { id: 'field-2', name: 'tech_stack', conditionalRules: [
        {
          sourceFieldId: 'field-1',
          operator: ConditionalOperator.EQUALS,
          value: 'engineering',
          action: ConditionalAction.SHOW,
          targetFieldId: 'field-2',
          priority: 0,
          enabled: true,
          group: null,
          groupOperator: 'and' as const,
        },
      ]},
      { id: 'field-3', name: 'design_tools', conditionalRules: [
        {
          sourceFieldId: 'field-1',
          operator: ConditionalOperator.EQUALS,
          value: 'design',
          action: ConditionalAction.SHOW,
          targetFieldId: 'field-3',
          priority: 0,
          enabled: true,
          group: null,
          groupOperator: 'and' as const,
        },
      ]},
    ];

    it('should show tech_stack when position = engineering', () => {
      const visibility = engine.evaluateVisibility(fields, {
        'field-1': 'engineering',
      });

      expect(visibility['field-1']).toBe(true);
      expect(visibility['field-2']).toBe(true);
      expect(visibility['field-3']).toBe(false);
    });

    it('should show design_tools when position = design', () => {
      const visibility = engine.evaluateVisibility(fields, {
        'field-1': 'design',
      });

      expect(visibility['field-1']).toBe(true);
      expect(visibility['field-2']).toBe(false);
      expect(visibility['field-3']).toBe(true);
    });

    it('should hide both conditional fields when position = marketing', () => {
      const visibility = engine.evaluateVisibility(fields, {
        'field-1': 'marketing',
      });

      expect(visibility['field-1']).toBe(true);
      expect(visibility['field-2']).toBe(false);
      expect(visibility['field-3']).toBe(false);
    });
  });
});
```

### Example Integration Test: Form Submission Flow

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestDb, cleanupTestDb } from '@mcv/test-utils';
import { FormService } from '../services/form.service';
import { FormFieldService } from '../services/form-field.service';
import { SubmissionService } from '../services/submission.service';
import { ValidationEngine } from '../services/validation.engine';
import { FieldType } from '../enums';

describe('Form Submission Flow', () => {
  let db: TestDb;
  let formService: FormService;
  let fieldService: FormFieldService;
  let submissionService: SubmissionService;
  let validator: ValidationEngine;

  const tenantId = 'test-tenant-uuid';

  beforeEach(async () => {
    db = await createTestDb();
    formService = new FormService(db, tenantId);
    fieldService = new FormFieldService(db, tenantId);
    submissionService = new SubmissionService(db, tenantId);
    validator = new ValidationEngine(db, tenantId);
  });

  afterEach(async () => {
    await cleanupTestDb(db);
  });

  it('should create, publish, and submit a form end-to-end', async () => {
    // Create form
    const form = await formService.create({
      title: 'Test Contact Form',
      allowPublic: true,
    });
    expect(form.id).toBeDefined();
    expect(form.status).toBe('draft');

    // Add fields
    await fieldService.create(form.id, {
      type: FieldType.TEXT,
      label: 'Name',
      name: 'name',
      required: true,
      order: 0,
    });

    await fieldService.create(form.id, {
      type: FieldType.EMAIL,
      label: 'Email',
      name: 'email',
      required: true,
      order: 1,
    });

    await fieldService.create(form.id, {
      type: FieldType.TEXTAREA,
      label: 'Message',
      name: 'message',
      required: true,
      order: 2,
      config: { minLength: 10 },
    });

    // Validate and publish
    const validation = await formService.validate(form.id);
    expect(validation.valid).toBe(true);

    const published = await formService.publish(form.id);
    expect(published.status).toBe('published');
    expect(published.publishedAt).not.toBeNull();

    // Submit
    const submission = await submissionService.create({
      formId: form.id,
      values: {
        name: 'Jane Doe',
        email: 'jane@example.com',
        message: 'This is a test submission with enough characters.',
      },
    });

    expect(submission.id).toBeDefined();
    expect(submission.status).toBe('completed');
    expect(submission.values).toHaveLength(3);

    // Verify submission count
    const updatedForm = await formService.get(form.id);
    expect(updatedForm.submissionCount).toBe(1);
  });

  it('should reject submission with validation errors', async () => {
    const form = await formService.create({ title: 'Test', allowPublic: true });

    await fieldService.create(form.id, {
      type: FieldType.EMAIL,
      label: 'Email',
      name: 'email',
      required: true,
      order: 0,
    });

    await formService.publish(form.id);

    // Submit with invalid email
    const result = await validator.validate(form.id, {
      email: 'not-an-email',
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].code).toBe('INVALID_EMAIL');
  });

  it('should enforce submission limit', async () => {
    const form = await formService.create({
      title: 'Limited Form',
      allowPublic: true,
      submissionLimit: 2,
    });

    await fieldService.create(form.id, {
      type: FieldType.TEXT,
      label: 'Name',
      name: 'name',
      required: true,
      order: 0,
    });

    await formService.publish(form.id);

    // First two submissions should succeed
    await submissionService.create({ formId: form.id, values: { name: 'User 1' } });
    await submissionService.create({ formId: form.id, values: { name: 'User 2' } });

    // Third should fail
    await expect(
      submissionService.create({ formId: form.id, values: { name: 'User 3' } }),
    ).rejects.toThrow('FORM_SUBMISSION_LIMIT_REACHED');
  });

  it('should support save-and-resume', async () => {
    const form = await formService.create({
      title: 'Long Form',
      allowPublic: true,
      allowSaveAndResume: true,
      isMultiStep: true,
    });

    await fieldService.create(form.id, {
      type: FieldType.TEXT, label: 'Name', name: 'name',
      required: true, order: 0, stepIndex: 0,
    });
    await fieldService.create(form.id, {
      type: FieldType.EMAIL, label: 'Email', name: 'email',
      required: true, order: 0, stepIndex: 1,
    });

    await formService.publish(form.id);

    // Save partial submission (step 1 only)
    const partial = await submissionService.savePartial({
      formId: form.id,
      values: { name: 'Jane Doe' },
      lastStepReached: 0,
    });

    expect(partial.status).toBe('in_progress');
    expect(partial.resumeToken).toBeDefined();
    expect(partial.lastStepReached).toBe(0);

    // Resume and complete
    const completed = await submissionService.resume({
      resumeToken: partial.resumeToken!,
      values: { name: 'Jane Doe', email: 'jane@example.com' },
    });

    expect(completed.status).toBe('completed');
    expect(completed.completedAt).not.toBeNull();
  });
});
```

### Example Unit Test: NPS Scoring

```typescript
import { describe, it, expect } from 'vitest';
import { calculateNPS, calculateCSAT, calculateCES } from '../utils/scoring';

describe('Survey Scoring Utilities', () => {
  describe('calculateNPS', () => {
    it('should calculate NPS from raw scores', () => {
      // 3 promoters (9, 10, 10), 2 passives (7, 8), 1 detractor (3)
      const result = calculateNPS([9, 7, 10, 3, 8, 10]);

      expect(result.promoterCount).toBe(3);
      expect(result.passiveCount).toBe(2);
      expect(result.detractorCount).toBe(1);
      expect(result.score).toBeCloseTo(33.3, 0); // (3/6 - 1/6) * 100
    });

    it('should return 100 for all promoters', () => {
      const result = calculateNPS([9, 10, 10, 9, 10]);
      expect(result.score).toBe(100);
    });

    it('should return -100 for all detractors', () => {
      const result = calculateNPS([0, 1, 2, 3, 4, 5, 6]);
      expect(result.score).toBe(-100);
    });

    it('should handle empty array', () => {
      const result = calculateNPS([]);
      expect(result.score).toBe(0);
      expect(result.promoterCount).toBe(0);
    });
  });

  describe('calculateCSAT', () => {
    it('should calculate CSAT percentage', () => {
      // Scores 4 and 5 are "satisfied" on a 1-5 scale
      const result = calculateCSAT([5, 4, 3, 5, 2, 4, 1, 5, 4, 3]);

      expect(result.satisfiedCount).toBe(6); // 5+4+5+4+5+4
      expect(result.totalCount).toBe(10);
      expect(result.score).toBe(60); // 6/10 * 100
    });

    it('should return 100 when all are satisfied', () => {
      const result = calculateCSAT([4, 5, 5, 4, 5]);
      expect(result.score).toBe(100);
    });
  });

  describe('calculateCES', () => {
    it('should calculate average CES score', () => {
      const result = calculateCES([5, 6, 7, 4, 3, 6, 5]);
      expect(result.score).toBeCloseTo(5.14, 1); // avg of all scores
      expect(result.totalCount).toBe(7);
    });

    it('should separate easy vs difficult responses', () => {
      // 1-3 = difficult, 4 = neutral, 5-7 = easy
      const result = calculateCES([1, 2, 5, 6, 7, 4, 3]);
      expect(result.easyCount).toBe(3); // 5, 6, 7
      expect(result.difficultCount).toBe(3); // 1, 2, 3
      expect(result.neutralCount).toBe(1); // 4
    });
  });
});
```

### Coverage Requirements

| Category | Target | Notes |
|---|---|---|
| Statements | ≥ 90% | Core services must be ≥ 95% |
| Branches | ≥ 85% | Conditional logic engine must be ≥ 95% |
| Functions | ≥ 90% | All exported functions must be tested |
| Lines | ≥ 90% | — |

### Test Data Factories

```typescript
import { faker } from '@faker-js/faker';
import { FieldType, FormStatus, SubmissionStatus } from '../enums';

export function createTestForm(overrides: Partial<Form> = {}): Form {
  return {
    id: faker.string.uuid(),
    tenantId: faker.string.uuid(),
    createdBy: faker.string.uuid(),
    title: faker.lorem.sentence(3),
    description: faker.lorem.paragraph(),
    slug: faker.helpers.slugify(faker.lorem.words(3)).toLowerCase(),
    status: FormStatus.DRAFT,
    settings: { /* defaults */ },
    theme: { /* defaults */ },
    allowPublic: true,
    submissionLimit: null,
    expiresAt: null,
    redirectUrl: null,
    confirmationMessage: 'Thank you!',
    sendConfirmationEmail: false,
    confirmationEmailTemplateId: null,
    notificationEmails: [],
    spamProtection: { /* defaults */ },
    isMultiStep: false,
    steps: null,
    allowSaveAndResume: false,
    version: 1,
    templateId: null,
    submissionCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    publishedAt: null,
    archivedAt: null,
    ...overrides,
  };
}

export function createTestField(
  formId: string,
  overrides: Partial<FormField> = {},
): FormField {
  return {
    id: faker.string.uuid(),
    formId,
    tenantId: faker.string.uuid(),
    type: FieldType.TEXT,
    label: faker.lorem.words(2),
    name: faker.helpers.slugify(faker.lorem.words(2)).toLowerCase(),
    placeholder: null,
    helpText: null,
    required: false,
    order: 0,
    stepIndex: null,
    defaultValue: null,
    config: {},
    validation: {},
    isHidden: false,
    width: 12,
    customClass: null,
    conditionalRules: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createTestSubmission(
  formId: string,
  overrides: Partial<FormSubmission> = {},
): FormSubmission {
  return {
    id: faker.string.uuid(),
    formId,
    tenantId: faker.string.uuid(),
    userId: null,
    status: SubmissionStatus.COMPLETED,
    ipAddress: faker.internet.ipv4(),
    userAgent: faker.internet.userAgent(),
    referrer: faker.internet.url(),
    deviceInfo: null,
    spamVerdict: 'clean',
    recaptchaScore: 0.9,
    completionTimeMs: faker.number.int({ min: 10000, max: 300000 }),
    lastStepReached: null,
    partialData: null,
    resumeToken: null,
    formVersion: 1,
    metadata: {},
    values: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: new Date(),
    ...overrides,
  };
}
```

---

*Last updated: 2026-02-09*
*Module version: 0.9.0*
*Documentation version: 1.0.0*