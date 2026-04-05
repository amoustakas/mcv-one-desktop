# @mcv/connectors/accounting — Accounting & Financial Operations Module

**Parent Package:** @mcv/connectors  
**Source Package:** @mcv/invoicing  
**Tier:** 3 (Connectors)  
**Classification:** PUBLISHABLE  
**Last Updated:** February 8, 2026

---

## Purpose

The `accounting` module is the financial backbone of the MCV ecosystem. It provides a complete invoicing, estimating, proposals, recurring billing, credit management, and platform fee infrastructure that powers all financial operations across MCV ventures. Unlike simple QuickBooks connectors, this is a full-featured, multi-tenant financial system built on Stripe Connect with venture-scoped isolation, approval workflows, document engagement analytics, interactive pricing, and branded PDF generation.

**This module handles every financial document from first proposal to final payment receipt across all MCV ventures.**

The system spans two database schemas (`invoicing.ts` for core financial entities, `engagement.ts` for document analytics) and ten server-side services that collectively manage:

- **Invoices** — Full lifecycle from draft through payment with Stripe integration
- **Estimates/Quotes** — Version-tracked quotes with e-signature acceptance and progress invoicing
- **Proposals** — Rich content business proposals with conversion tracking
- **Recurring Invoices** — Scheduled invoice generation (distinct from Stripe Subscriptions)
- **Credit Notes** — Refund and credit management against invoices
- **Payment Receipts** — Manual and Stripe payment recording
- **Platform Fees** — Stripe Connect application fee management across the ecosystem
- **Approval Workflows** — Multi-step conditional approval chains
- **Document Engagement** — View tracking, engagement scoring, and heatmaps
- **Interactive Pricing** — Client-facing package selection and addon configuration

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MCV ACCOUNTING ARCHITECTURE                         │
│                                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   Estimates   │  │  Proposals   │  │  Interactive │  │   Approval   │   │
│  │   & Quotes    │  │   (Rich      │  │   Pricing    │  │  Workflows   │   │
│  │              │  │   Content)   │  │   Builder    │  │              │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│         │ convert          │ convert         │ finalize       │ approve    │
│         ▼                  ▼                 ▼               ▼            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         INVOICE ENGINE                              │   │
│  │                                                                     │   │
│  │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │   │
│  │   │  Templates   │  │   Line Item  │  │   Reminder   │             │   │
│  │   │  & Branding  │  │   Calculator │  │   Scheduler  │             │   │
│  │   └──────────────┘  └──────────────┘  └──────────────┘             │   │
│  │                                                                     │   │
│  │   draft → sent → viewed → partial → paid                           │   │
│  │                          ↗                                          │   │
│  │              overdue → ─┘     void    write_off                     │   │
│  └──────────────────────────┬──────────────────────────────────────────┘   │
│                             │                                              │
│         ┌───────────────────┼───────────────────┐                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                     │
│  │   Recurring   │  │   Credit     │  │   Payment    │                     │
│  │   Invoice     │  │   Notes      │  │   Receipts   │                     │
│  │   Generator   │  │              │  │              │                     │
│  └──────────────┘  └──────────────┘  └──────────────┘                     │
│                             │                                              │
│         ┌───────────────────┼───────────────────┐                          │
│         ▼                   ▼                   ▼                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                     │
│  │   Platform    │  │   PDF        │  │  Engagement  │                     │
│  │   Fees &      │  │   Generation │  │  Analytics & │                     │
│  │   Ledger      │  │   & HTML     │  │  Heatmaps    │                     │
│  └──────┬───────┘  └──────────────┘  └──────────────┘                     │
│         │                                                                  │
│         ▼                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     STRIPE CONNECT LAYER                            │   │
│  │   Payment Links  │  Connect Transfers  │  Application Fees         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        POSTGRESQL (RLS)                             │   │
│  │   invoices_v2  │  proposals  │  estimates  │  recurring_invoices   │   │
│  │   credit_notes │  payment_receipts │  platform_fee_configs         │   │
│  │   platform_fee_ledger │  approval_workflows │  approval_requests   │   │
│  │   approval_decisions │  document_view_events │  engagement_scores  │   │
│  │   interactive_pricing_configs │  client_notifications              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow: Estimate → Invoice → Payment

```
Client Request                    MCV Platform                          Stripe
─────────────                     ────────────                          ──────
     │                                 │                                  │
     │  1. Create Estimate             │                                  │
     │─────────────────────────────────▶│                                  │
     │                                 │ Store in estimates table         │
     │                                 │ Version 1 snapshot               │
     │                                 │                                  │
     │  2. Client accepts (e-sign)     │                                  │
     │─────────────────────────────────▶│                                  │
     │                                 │ Record signature URL + IP        │
     │                                 │ Status → accepted                │
     │                                 │                                  │
     │  3. Convert to Invoice          │                                  │
     │─────────────────────────────────▶│                                  │
     │                                 │ Create invoices_v2 row           │
     │                                 │ Generate INV-XXXXX number        │
     │                                 │ Calculate totals                 │
     │                                 │───────────────────────────────────▶│
     │                                 │ Generate Stripe payment link     │
     │                                 │◀───────────────────────────────── │
     │                                 │                                  │
     │  4. Send Invoice                │                                  │
     │─────────────────────────────────▶│                                  │
     │                                 │ Email with payment link          │
     │                                 │ Status → sent                    │
     │                                 │ Schedule reminders               │
     │                                 │                                  │
     │  5. Client pays via link        │                                  │
     │────────────────────────────────────────────────────────────────────▶│
     │                                 │                                  │
     │                                 │  6. Webhook: payment_received    │
     │                                 │◀───────────────────────────────── │
     │                                 │ Record payment receipt           │
     │                                 │ Calculate platform fee           │
     │                                 │ Status → paid                    │
     │                                 │ Log to fee ledger                │
     │                                 │                                  │
```

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// SERVER SERVICES
// ═══════════════════════════════════════════════════════════════════════════════

// Invoice Engine
export { InvoiceV2Service, invoiceV2Service } from './server/services/invoice.service';

// Proposals
export { ProposalService, proposalService } from './server/services/proposal.service';

// Estimates & Quotes
export { EstimateService, estimateService } from './server/services/estimate.service';

// Recurring Billing
export {
  RecurringInvoiceService,
  recurringInvoiceService,
} from './server/services/recurring-invoice.service';

// Credit Notes
export { CreditNoteService, creditNoteService } from './server/services/credit-note.service';

// Platform Fees (Super Admin)
export { PlatformFeeService, platformFeeService } from './server/services/platform-fee.service';

// PDF Generation
export { InvoicePdfService, invoicePdfService } from './server/services/invoice-pdf.service';

// Approval Workflows
export { ApprovalService, approvalService } from './server/services/approval.service';

// Document Engagement Analytics
export { EngagementService, engagementService } from './server/services/engagement.service';

// Interactive Pricing Builder
export {
  InteractivePricingService,
  interactivePricingService,
} from './server/services/interactive-pricing.service';

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  // DB re-exports
  InvoiceV2LineItem,
  InvoiceReminder,
  InvoiceAddress,
  InvoiceTaxConfig,
  ProposalContentBlock,
  RecurringTemplateConfig,
  TieredFeeConfig,

  // Invoice inputs
  CreateInvoiceTemplateInput,
  UpdateInvoiceTemplateInput,
  CreateInvoiceV2Input,
  UpdateInvoiceV2Input,
  RecordPaymentInput,
  ListInvoicesV2Filter,

  // Proposal inputs
  CreateProposalInput,
  UpdateProposalInput,
  AcceptProposalInput,

  // Recurring invoice inputs
  CreateRecurringInvoiceInput,
  UpdateRecurringInvoiceInput,

  // Credit note inputs
  CreateCreditNoteInput,

  // Platform fee inputs
  UpdatePlatformFeeInput,

  // Estimate inputs
  CreateEstimateInput,
  UpdateEstimateInput,
  ConvertEstimateInput,

  // Approval inputs
  CreateApprovalWorkflowInput,
  UpdateApprovalWorkflowInput,
  SubmitForApprovalInput,
  ApprovalDecisionInput,
  ApprovalRule,

  // Reporting types
  InvoicingSummary,
  ProposalSummary,
  EstimateSummary,
} from './types';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT EXPORTS (React hooks / components — future)
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  CreateInvoiceV2Input,
  UpdateInvoiceV2Input,
  CreateProposalInput,
  UpdateProposalInput,
  CreateRecurringInvoiceInput,
  InvoicingSummary,
  ProposalSummary,
} from './client';
```

---

## TypeScript Interfaces

### Invoice Line Items

```typescript
export interface InvoiceV2LineItem {
  id: string;                    // Unique line item ID
  description: string;           // Item description
  quantity: number;              // Quantity
  unitPrice: number;             // Unit price in cents
  amount: number;                // Total = quantity × unitPrice (cents)
  taxRate?: number;              // Tax percentage (e.g., 13 for 13%)
  taxAmount?: number;            // Calculated tax in cents
  discountPercent?: number;      // Discount as percentage
  discountAmount?: number;       // Discount as fixed amount in cents
  productId?: string;            // Link to catalog product
  sortOrder: number;             // Display order
}
```

### Invoice Reminders

```typescript
export interface InvoiceReminder {
  date: string;                  // ISO date string
  sent: boolean;                 // Whether reminder was sent
  sentAt?: string;               // ISO timestamp of when sent
  type: 'before_due' | 'on_due' | 'after_due';
  dayOffset: number;             // Negative = before due, 0 = on due, positive = after
}
```

### Invoice Address

```typescript
export interface InvoiceAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}
```

### Tax Configuration

```typescript
export interface InvoiceTaxConfig {
  enabled: boolean;
  defaultRate: number;           // Percentage, e.g., 8.5
  taxLabel: string;              // "Sales Tax", "VAT", "GST"
  taxId?: string;                // Company tax registration number
  inclusive: boolean;             // Tax-inclusive pricing
  compoundTax?: boolean;         // Compound tax calculation
  additionalRates?: Array<{
    label: string;
    rate: number;
    appliesToAll: boolean;
  }>;
}
```

### Invoice Template Colors

```typescript
export interface InvoiceTemplateColors {
  primary: string;               // Primary brand color (hex)
  accent: string;                // Accent color (hex)
  background?: string;           // Background color
  textColor?: string;            // Text color override
}
```

### Proposal Content Blocks

```typescript
export interface ProposalContentBlock {
  id: string;
  type:
    | 'heading'
    | 'paragraph'
    | 'image'
    | 'table'
    | 'divider'
    | 'pricing'
    | 'terms'
    | 'signature'
    | 'video'
    | 'testimonial';
  content: string;               // HTML or markdown depending on type
  metadata?: Record<string, unknown>;
  sortOrder: number;
}
```

### Recurring Template Configuration

```typescript
export interface RecurringTemplateConfig {
  lineItems: InvoiceV2LineItem[];
  notes?: string;
  terms?: string;
  currency: string;
  paymentTermsDays: number;
  taxConfig?: InvoiceTaxConfig;
}
```

### Tiered Fee Configuration

```typescript
export interface TieredFeeConfig {
  tiers: Array<{
    upTo: number;                // Volume in cents (last tier = unlimited)
    feePercent: number;          // Fee percentage for this tier
  }>;
  resetPeriod: 'monthly' | 'quarterly' | 'yearly';
}
```

### Estimate Version Tracking

```typescript
export interface EstimateVersionEntry {
  version: number;
  lineItems: InvoiceV2LineItem[];
  total: number;
  createdAt: string;             // ISO timestamp
  note?: string;                 // Version change note
}

export interface ProgressInvoicing {
  milestones: Array<{
    name: string;
    percent: number;
    invoiceId?: string;
    invoicedAt?: string;
  }>;
}
```

### Approval Rule Configuration

```typescript
export interface ApprovalRuleConfig {
  step: number;
  approverRoleId?: string;       // Role-based approval
  approverUserId?: string;       // User-specific approval
  condition?: {
    field: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    value: number;
  };
  autoApproveBelow?: number;     // Auto-approve if entity total < this
}
```

### Document Engagement Types

```typescript
export interface ViewSectionData {
  sectionId: string;
  sectionName: string;
  durationMs: number;
  scrollDepthPercent: number;
}

export interface ViewerLocation {
  country?: string;
  region?: string;
  city?: string;
}
```

### Interactive Pricing Types

```typescript
export interface PricingPackage {
  id: string;
  name: string;
  description: string;
  isRecommended: boolean;
  lineItems: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  total: number;
  features: string[];
}

export interface PricingAddon {
  id: string;
  name: string;
  description: string;
  price: number;
  isSelected: boolean;
  category: string;
}

export interface QuantityOverride {
  lineItemId: string;
  minQty: number;
  maxQty: number;
  step: number;
}
```

### Invoice Input Types

```typescript
export interface CreateInvoiceV2Input {
  contactId?: string;
  organizationId?: string;
  templateId?: string;
  issueDate?: Date;
  dueDate?: Date;
  lineItems: InvoiceV2LineItem[];
  notes?: string;
  terms?: string;
  currency?: string;
  customFields?: Record<string, string>;
  billingAddress?: InvoiceAddress;
  reminders?: InvoiceReminder[];
}

export interface UpdateInvoiceV2Input {
  contactId?: string;
  organizationId?: string;
  templateId?: string;
  issueDate?: Date;
  dueDate?: Date;
  lineItems?: InvoiceV2LineItem[];
  notes?: string;
  terms?: string;
  customFields?: Record<string, string>;
  billingAddress?: InvoiceAddress;
  reminders?: InvoiceReminder[];
}

export interface RecordPaymentInput {
  amount: number;                // Amount in cents
  method: string;                // 'card', 'bank_transfer', 'cash', 'check', 'other'
  reference?: string;            // Check number, transaction ID
  notes?: string;
}

export interface ListInvoicesV2Filter {
  page: number;
  pageSize: number;
  status?: string;
  contactId?: string;
  organizationId?: string;
  search?: string;
  from?: Date;
  to?: Date;
  sortBy?: 'createdAt' | 'dueDate' | 'total' | 'number';
  sortDir?: 'asc' | 'desc';
}
```

### Proposal Input Types

```typescript
export interface CreateProposalInput {
  contactId?: string;
  organizationId?: string;
  title: string;
  content?: ProposalContentBlock[];
  lineItems?: InvoiceV2LineItem[];
  currency?: string;
  validUntil?: Date;
  coverImageUrl?: string;
  customFields?: Record<string, string>;
}

export interface UpdateProposalInput {
  title?: string;
  contactId?: string;
  organizationId?: string;
  content?: ProposalContentBlock[];
  lineItems?: InvoiceV2LineItem[];
  currency?: string;
  validUntil?: Date;
  coverImageUrl?: string;
  customFields?: Record<string, string>;
}

export interface AcceptProposalInput {
  signatureUrl: string;          // URL to stored signature image
  signatureIp?: string;          // IP address for audit trail
}
```

### Estimate Input Types

```typescript
export interface CreateEstimateInput {
  contactId?: string;
  organizationId?: string;
  templateId?: string;
  title: string;
  lineItems: InvoiceV2LineItem[];
  currency?: string;
  validUntil?: Date;
  notes?: string;
  terms?: string;
  customFields?: Record<string, string>;
}

export interface UpdateEstimateInput {
  title?: string;
  contactId?: string;
  organizationId?: string;
  lineItems?: InvoiceV2LineItem[];
  currency?: string;
  validUntil?: Date;
  notes?: string;
  terms?: string;
  customFields?: Record<string, string>;
  versionNote?: string;          // Note explaining what changed in this version
}

export interface ConvertEstimateInput {
  milestonePercent?: number;     // Percentage to invoice (e.g., 25 for 25%)
  milestoneName?: string;        // Human-readable milestone name
}
```

### Recurring Invoice Input Types

```typescript
export interface CreateRecurringInvoiceInput {
  contactId?: string;
  organizationId?: string;
  templateId?: string;
  name: string;
  templateConfig: RecurringTemplateConfig;
  interval: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'semiannually' | 'yearly';
  dayOfMonth?: number;           // 1-28
  dayOfWeek?: number;            // 0 = Sunday (for weekly intervals)
  startDate: Date;
  endDate?: Date;                // null = indefinite
  autoSend?: boolean;            // Auto-send generated invoices
}

export interface UpdateRecurringInvoiceInput {
  name?: string;
  templateConfig?: RecurringTemplateConfig;
  interval?: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'semiannually' | 'yearly';
  dayOfMonth?: number;
  dayOfWeek?: number;
  endDate?: Date;
  autoSend?: boolean;
}
```

### Platform Fee & Credit Note Input Types

```typescript
export interface CreateCreditNoteInput {
  invoiceId: string;
  amount: number;                // Amount in cents
  reason: string;
  notes?: string;
}

export interface UpdatePlatformFeeInput {
  ventureId: string;
  feeType?: 'percentage' | 'flat' | 'tiered';
  feePercent?: number;
  flatFeeCents?: number;
  tieredConfig?: TieredFeeConfig;
  invoiceFeePercent?: number;
  proposalConversionFee?: number;
  cappedAt?: number | null;      // Max fee per transaction (null = no cap)
  minimumFee?: number;
  isActive?: boolean;
  effectiveFrom?: Date;
  effectiveUntil?: Date | null;
  notes?: string;
}
```

### Approval Input Types

```typescript
export interface CreateApprovalWorkflowInput {
  name: string;
  entityType: 'invoice' | 'proposal' | 'estimate' | 'credit_note' | 'discount';
  rules: ApprovalRule[];
}

export interface UpdateApprovalWorkflowInput {
  name?: string;
  entityType?: 'invoice' | 'proposal' | 'estimate' | 'credit_note' | 'discount';
  rules?: ApprovalRule[];
  isActive?: boolean;
}

export interface ApprovalRule {
  step: number;
  approverRoleId?: string;
  approverUserId?: string;
  condition?: {
    field: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    value: number;
  };
  autoApproveBelow?: number;
}

export interface SubmitForApprovalInput {
  entityType: 'invoice' | 'proposal' | 'estimate' | 'credit_note' | 'discount';
  entityId: string;
  notes?: string;
}

export interface ApprovalDecisionInput {
  approvalRequestId: string;
  decision: 'approved' | 'rejected' | 'changes_requested';
  reason?: string;
}
```

### Reporting Types

```typescript
export interface InvoicingSummary {
  totalDraft: number;
  totalSent: number;
  totalOverdue: number;
  totalPaid: number;
  totalVoid: number;
  amountOutstanding: number;     // Total outstanding in cents
  amountOverdue: number;         // Total overdue in cents
  amountCollected: number;       // Total collected in cents
  averageDaysToPayment: number;  // Average days from sent → paid
}

export interface ProposalSummary {
  totalDraft: number;
  totalSent: number;
  totalAccepted: number;
  totalDeclined: number;
  totalExpired: number;
  conversionRate: number;        // Percentage
  totalValue: number;            // Total value in cents
  averageValue: number;          // Average proposal value in cents
}

export interface EstimateSummary {
  totalDraft: number;
  totalSent: number;
  totalAccepted: number;
  totalDeclined: number;
  totalExpired: number;
  totalConverted: number;
  conversionRate: number;        // Percentage
  totalValue: number;            // Total value in cents
}

export interface InvoicePdfData {
  invoice: {
    number: string;
    issueDate: string;
    dueDate: string;
    status: string;
    currency: string;
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    total: number;
    amountPaid: number;
    amountDue: number;
    notes?: string;
    terms?: string;
    paymentLink?: string;
  };
  lineItems: InvoiceV2LineItem[];
  contact?: { name: string; email?: string; phone?: string };
  organization?: { name: string };
  venture: { name: string };
  billingAddress?: InvoiceAddress;
  template: {
    headerHtml?: string;
    footerHtml?: string;
    logoUrl?: string;
    colors?: InvoiceTemplateColors;
  };
  qrCodeData?: string;
}
```

---

## Database Schema

### Enums

```sql
-- Invoice lifecycle states
CREATE TYPE invoice_v2_status AS ENUM (
  'draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'void', 'write_off'
);

-- Proposal lifecycle states
CREATE TYPE proposal_status AS ENUM (
  'draft', 'sent', 'viewed', 'accepted', 'declined', 'expired'
);

-- Estimate lifecycle states
CREATE TYPE estimate_status AS ENUM (
  'draft', 'sent', 'viewed', 'accepted', 'declined', 'expired', 'converted'
);

-- Recurring invoice intervals
CREATE TYPE recurring_invoice_interval AS ENUM (
  'weekly', 'biweekly', 'monthly', 'quarterly', 'semiannually', 'yearly'
);

-- Recurring invoice states
CREATE TYPE recurring_invoice_status AS ENUM (
  'active', 'paused', 'cancelled', 'completed'
);

-- Credit note states
CREATE TYPE credit_note_status AS ENUM (
  'draft', 'issued', 'applied', 'void'
);

-- Platform fee calculation types
CREATE TYPE platform_fee_type AS ENUM (
  'percentage', 'flat', 'tiered'
);

-- Approval workflow states
CREATE TYPE approval_status AS ENUM (
  'pending', 'approved', 'rejected', 'changes_requested'
);

-- Approval entity types
CREATE TYPE approval_entity_type AS ENUM (
  'invoice', 'proposal', 'estimate', 'credit_note', 'discount'
);

-- Engagement entity types
CREATE TYPE engagement_entity_type AS ENUM (
  'invoice', 'proposal', 'estimate'
);

-- Device types for view tracking
CREATE TYPE viewer_device_type AS ENUM (
  'desktop', 'tablet', 'mobile'
);

-- Interactive pricing modes
CREATE TYPE interactive_pricing_mode AS ENUM (
  'standard', 'packages', 'builder'
);

-- Client notification types
CREATE TYPE client_notification_type AS ENUM (
  'first_view', 'repeat_view', 'high_engagement', 'low_engagement',
  'selection_made', 'signature_started', 'link_clicked'
);
```

### Invoice Templates

```sql
CREATE TABLE invoice_templates (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id            UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL,
  is_default            BOOLEAN DEFAULT FALSE,
  header_html           TEXT,
  footer_html           TEXT,
  logo_url              TEXT,
  colors                JSONB,       -- InvoiceTemplateColors
  default_payment_terms INTEGER DEFAULT 30,
  default_notes         TEXT,
  tax_config            JSONB,       -- InvoiceTaxConfig
  number_prefix         TEXT DEFAULT 'INV',
  next_number           INTEGER DEFAULT 1001,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX invoice_template_venture_idx ON invoice_templates(venture_id);
CREATE INDEX invoice_template_default_idx ON invoice_templates(venture_id, is_default);
```

### Invoices V2

```sql
CREATE TABLE invoices_v2 (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id            UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  contact_id            UUID REFERENCES contacts(id) ON DELETE SET NULL,
  organization_id       UUID REFERENCES organizations(id) ON DELETE SET NULL,
  template_id           UUID REFERENCES invoice_templates(id) ON DELETE SET NULL,
  recurring_invoice_id  UUID,
  number                TEXT NOT NULL,
  status                invoice_v2_status NOT NULL DEFAULT 'draft',
  issue_date            TIMESTAMPTZ DEFAULT NOW(),
  due_date              TIMESTAMPTZ,
  line_items            JSONB NOT NULL DEFAULT '[]',
  subtotal              INTEGER NOT NULL DEFAULT 0,
  tax_amount            INTEGER DEFAULT 0,
  discount_amount       INTEGER DEFAULT 0,
  total                 INTEGER NOT NULL DEFAULT 0,
  amount_paid           INTEGER DEFAULT 0,
  amount_due            INTEGER DEFAULT 0,
  currency              TEXT NOT NULL DEFAULT 'usd',
  notes                 TEXT,
  terms                 TEXT,
  payment_link          TEXT,
  stripe_invoice_id     TEXT,
  sent_at               TIMESTAMPTZ,
  viewed_at             TIMESTAMPTZ,
  paid_at               TIMESTAMPTZ,
  reminders             JSONB,       -- InvoiceReminder[]
  custom_fields         JSONB,       -- Record<string, string>
  billing_address       JSONB,       -- InvoiceAddress
  created_by            UUID,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- All monetary values stored in cents (integer) for precision
CREATE INDEX invoice_v2_venture_idx ON invoices_v2(venture_id);
CREATE INDEX invoice_v2_contact_idx ON invoices_v2(contact_id);
CREATE INDEX invoice_v2_org_idx ON invoices_v2(organization_id);
CREATE INDEX invoice_v2_template_idx ON invoices_v2(template_id);
CREATE INDEX invoice_v2_status_idx ON invoices_v2(venture_id, status);
CREATE INDEX invoice_v2_number_idx ON invoices_v2(venture_id, number);
CREATE INDEX invoice_v2_due_date_idx ON invoices_v2(due_date);
CREATE INDEX invoice_v2_recurring_idx ON invoices_v2(recurring_invoice_id);
CREATE INDEX invoice_v2_created_idx ON invoices_v2(created_at);
```

### Proposals

```sql
CREATE TABLE proposals (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id            UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  contact_id            UUID REFERENCES contacts(id) ON DELETE SET NULL,
  organization_id       UUID REFERENCES organizations(id) ON DELETE SET NULL,
  title                 TEXT NOT NULL,
  proposal_number       TEXT,
  status                proposal_status NOT NULL DEFAULT 'draft',
  content               JSONB NOT NULL DEFAULT '[]',   -- ProposalContentBlock[]
  line_items            JSONB NOT NULL DEFAULT '[]',   -- InvoiceV2LineItem[]
  subtotal              INTEGER DEFAULT 0,
  tax_amount            INTEGER DEFAULT 0,
  discount_amount       INTEGER DEFAULT 0,
  total                 INTEGER NOT NULL DEFAULT 0,
  currency              TEXT NOT NULL DEFAULT 'usd',
  valid_until           TIMESTAMPTZ,
  accepted_at           TIMESTAMPTZ,
  declined_at           TIMESTAMPTZ,
  decline_reason        TEXT,
  signature_url         TEXT,
  signature_ip          TEXT,
  sent_at               TIMESTAMPTZ,
  viewed_at             TIMESTAMPTZ,
  cover_image_url       TEXT,
  custom_fields         JSONB,
  converted_invoice_id  UUID,
  created_by            UUID,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX proposal_venture_idx ON proposals(venture_id);
CREATE INDEX proposal_contact_idx ON proposals(contact_id);
CREATE INDEX proposal_org_idx ON proposals(organization_id);
CREATE INDEX proposal_status_idx ON proposals(venture_id, status);
CREATE INDEX proposal_valid_until_idx ON proposals(valid_until);
CREATE INDEX proposal_created_idx ON proposals(created_at);
```

### Estimates

```sql
CREATE TABLE estimates (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id            UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  contact_id            UUID REFERENCES contacts(id) ON DELETE SET NULL,
  organization_id       UUID REFERENCES organizations(id) ON DELETE SET NULL,
  template_id           UUID REFERENCES invoice_templates(id) ON DELETE SET NULL,
  estimate_number       TEXT NOT NULL,
  title                 TEXT NOT NULL,
  status                estimate_status NOT NULL DEFAULT 'draft',
  line_items            JSONB NOT NULL DEFAULT '[]',
  subtotal              INTEGER NOT NULL DEFAULT 0,
  tax_amount            INTEGER DEFAULT 0,
  discount_amount       INTEGER DEFAULT 0,
  total                 INTEGER NOT NULL DEFAULT 0,
  currency              TEXT NOT NULL DEFAULT 'usd',
  valid_until           TIMESTAMPTZ,
  notes                 TEXT,
  terms                 TEXT,
  custom_fields         JSONB,
  versions              JSONB DEFAULT '[]',            -- EstimateVersionEntry[]
  current_version       INTEGER DEFAULT 1,
  converted_invoice_id  UUID,
  converted_at          TIMESTAMPTZ,
  progress_invoicing    JSONB,                         -- ProgressInvoicing
  sent_at               TIMESTAMPTZ,
  viewed_at             TIMESTAMPTZ,
  accepted_at           TIMESTAMPTZ,
  declined_at           TIMESTAMPTZ,
  decline_reason        TEXT,
  signature_url         TEXT,
  signature_ip          TEXT,
  created_by            UUID,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX estimate_venture_idx ON estimates(venture_id);
CREATE INDEX estimate_contact_idx ON estimates(contact_id);
CREATE INDEX estimate_status_idx ON estimates(venture_id, status);
CREATE INDEX estimate_number_idx ON estimates(venture_id, estimate_number);
CREATE INDEX estimate_valid_until_idx ON estimates(valid_until);
CREATE INDEX estimate_created_idx ON estimates(created_at);
```

### Recurring Invoices

```sql
CREATE TABLE recurring_invoices (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id            UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  contact_id            UUID REFERENCES contacts(id) ON DELETE SET NULL,
  organization_id       UUID REFERENCES organizations(id) ON DELETE SET NULL,
  template_id           UUID REFERENCES invoice_templates(id) ON DELETE SET NULL,
  name                  TEXT NOT NULL,
  template_config       JSONB NOT NULL,                -- RecurringTemplateConfig
  interval              recurring_invoice_interval NOT NULL DEFAULT 'monthly',
  day_of_month          INTEGER DEFAULT 1,
  day_of_week           INTEGER,
  start_date            TIMESTAMPTZ NOT NULL,
  end_date              TIMESTAMPTZ,
  next_date             TIMESTAMPTZ NOT NULL,
  last_generated_at     TIMESTAMPTZ,
  status                recurring_invoice_status NOT NULL DEFAULT 'active',
  auto_send             BOOLEAN DEFAULT FALSE,
  total_generated       INTEGER DEFAULT 0,
  total_revenue         INTEGER DEFAULT 0,
  created_by            UUID,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX recurring_invoice_venture_idx ON recurring_invoices(venture_id);
CREATE INDEX recurring_invoice_contact_idx ON recurring_invoices(contact_id);
CREATE INDEX recurring_invoice_status_idx ON recurring_invoices(venture_id, status);
CREATE INDEX recurring_invoice_next_date_idx ON recurring_invoices(next_date);
```

### Credit Notes

```sql
CREATE TABLE credit_notes (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id            UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  invoice_id            UUID NOT NULL REFERENCES invoices_v2(id) ON DELETE CASCADE,
  number                TEXT,
  amount                INTEGER NOT NULL,
  reason                TEXT NOT NULL,
  notes                 TEXT,
  status                credit_note_status NOT NULL DEFAULT 'draft',
  applied_at            TIMESTAMPTZ,
  created_by            UUID,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX credit_note_venture_idx ON credit_notes(venture_id);
CREATE INDEX credit_note_invoice_idx ON credit_notes(invoice_id);
CREATE INDEX credit_note_status_idx ON credit_notes(venture_id, status);
```

### Payment Receipts

```sql
CREATE TABLE payment_receipts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id            UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  invoice_id            UUID NOT NULL REFERENCES invoices_v2(id) ON DELETE CASCADE,
  payment_id            TEXT,              -- Stripe payment intent or internal ref
  amount                INTEGER NOT NULL,  -- cents
  method                TEXT NOT NULL,     -- 'card', 'bank_transfer', 'cash', 'check'
  reference             TEXT,              -- Check number, transaction ID
  receipt_url           TEXT,
  notes                 TEXT,
  sent_at               TIMESTAMPTZ,
  created_by            UUID,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX payment_receipt_venture_idx ON payment_receipts(venture_id);
CREATE INDEX payment_receipt_invoice_idx ON payment_receipts(invoice_id);
CREATE INDEX payment_receipt_created_idx ON payment_receipts(created_at);
```

### Platform Fee Configuration

```sql
CREATE TABLE platform_fee_configs (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id              UUID NOT NULL UNIQUE REFERENCES ventures(id) ON DELETE CASCADE,
  fee_type                platform_fee_type NOT NULL DEFAULT 'percentage',
  fee_percent             NUMERIC(5,2) DEFAULT 2.50,
  flat_fee_cents          INTEGER DEFAULT 0,
  tiered_config           JSONB,           -- TieredFeeConfig
  invoice_fee_percent     NUMERIC(5,2) DEFAULT 1.00,
  proposal_conversion_fee INTEGER DEFAULT 0,
  capped_at               INTEGER,         -- Max fee cents per transaction (null = no cap)
  minimum_fee             INTEGER DEFAULT 0,
  is_active               BOOLEAN DEFAULT TRUE,
  effective_from          TIMESTAMPTZ DEFAULT NOW(),
  effective_until         TIMESTAMPTZ,
  notes                   TEXT,
  updated_by              UUID,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX platform_fee_venture_idx ON platform_fee_configs(venture_id);
CREATE INDEX platform_fee_active_idx ON platform_fee_configs(is_active);
```

### Platform Fee Ledger

```sql
CREATE TABLE platform_fee_ledger (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id            UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  invoice_id            UUID REFERENCES invoices_v2(id) ON DELETE SET NULL,
  fee_config_id         UUID REFERENCES platform_fee_configs(id) ON DELETE SET NULL,
  transaction_amount    INTEGER NOT NULL,  -- cents
  fee_amount            INTEGER NOT NULL,  -- cents
  fee_percent           NUMERIC(5,2),
  description           TEXT,
  stripe_transfer_id    TEXT,
  period                TEXT,              -- 'YYYY-MM' for aggregation
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX platform_fee_ledger_venture_idx ON platform_fee_ledger(venture_id);
CREATE INDEX platform_fee_ledger_invoice_idx ON platform_fee_ledger(invoice_id);
CREATE INDEX platform_fee_ledger_period_idx ON platform_fee_ledger(venture_id, period);
CREATE INDEX platform_fee_ledger_created_idx ON platform_fee_ledger(created_at);
```

### Approval Workflows

```sql
CREATE TABLE approval_workflows (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id            UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL,
  entity_type           approval_entity_type NOT NULL,
  is_active             BOOLEAN DEFAULT TRUE,
  rules                 JSONB NOT NULL DEFAULT '[]',   -- ApprovalRuleConfig[]
  created_by            UUID,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX approval_workflow_venture_idx ON approval_workflows(venture_id);
CREATE INDEX approval_workflow_entity_type_idx ON approval_workflows(venture_id, entity_type);
```

### Approval Requests

```sql
CREATE TABLE approval_requests (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id            UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  workflow_id           UUID NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,
  entity_type           approval_entity_type NOT NULL,
  entity_id             UUID NOT NULL,
  current_step          INTEGER NOT NULL DEFAULT 1,
  total_steps           INTEGER NOT NULL,
  status                approval_status NOT NULL DEFAULT 'pending',
  requested_by          UUID,
  requested_at          TIMESTAMPTZ DEFAULT NOW(),
  completed_at          TIMESTAMPTZ,
  completed_by          UUID,
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX approval_request_venture_idx ON approval_requests(venture_id);
CREATE INDEX approval_request_workflow_idx ON approval_requests(workflow_id);
CREATE INDEX approval_request_entity_idx ON approval_requests(entity_type, entity_id);
CREATE INDEX approval_request_status_idx ON approval_requests(venture_id, status);
```

### Approval Decisions

```sql
CREATE TABLE approval_decisions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_request_id   UUID NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
  step                  INTEGER NOT NULL,
  decided_by            UUID,
  decision              approval_status NOT NULL,
  reason                TEXT,
  decided_at            TIMESTAMPTZ DEFAULT NOW(),
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX approval_decision_request_idx ON approval_decisions(approval_request_id);
CREATE INDEX approval_decision_step_idx ON approval_decisions(approval_request_id, step);
```

### Document View Events

```sql
CREATE TABLE document_view_events (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id            UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  entity_type           engagement_entity_type NOT NULL,
  entity_id             UUID NOT NULL,
  viewer_email          TEXT,
  viewer_ip             TEXT,
  viewer_user_agent     TEXT,
  session_id            TEXT,
  sections              JSONB,           -- ViewSectionData[]
  total_duration_ms     INTEGER DEFAULT 0,
  page_count            INTEGER DEFAULT 1,
  pages_viewed          INTEGER DEFAULT 1,
  device_type           viewer_device_type,
  location              JSONB,           -- ViewerLocation
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX doc_view_venture_idx ON document_view_events(venture_id);
CREATE INDEX doc_view_entity_idx ON document_view_events(entity_type, entity_id);
CREATE INDEX doc_view_email_idx ON document_view_events(viewer_email);
CREATE INDEX doc_view_session_idx ON document_view_events(session_id);
CREATE INDEX doc_view_created_idx ON document_view_events(created_at);
```

### Engagement Scores

```sql
CREATE TABLE engagement_scores (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id            UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  entity_type           engagement_entity_type NOT NULL,
  entity_id             UUID NOT NULL,
  total_views           INTEGER DEFAULT 0,
  unique_viewers        INTEGER DEFAULT 0,
  total_duration_ms     INTEGER DEFAULT 0,
  avg_duration_ms       INTEGER DEFAULT 0,
  max_duration_ms       INTEGER DEFAULT 0,
  most_viewed_section   TEXT,
  least_viewed_section  TEXT,
  score                 INTEGER DEFAULT 0,  -- 0-100
  first_viewed_at       TIMESTAMPTZ,
  last_viewed_at        TIMESTAMPTZ,
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX engagement_score_venture_idx ON engagement_scores(venture_id);
CREATE UNIQUE INDEX engagement_score_entity_idx ON engagement_scores(entity_type, entity_id);
CREATE INDEX engagement_score_score_idx ON engagement_scores(score);
```

### Interactive Pricing Configs

```sql
CREATE TABLE interactive_pricing_configs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id            UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  entity_type           engagement_entity_type NOT NULL,
  entity_id             UUID NOT NULL,
  pricing_mode          interactive_pricing_mode NOT NULL DEFAULT 'standard',
  packages              JSONB DEFAULT '[]',
  addons                JSONB DEFAULT '[]',
  quantity_overrides    JSONB DEFAULT '[]',
  selected_package_id   TEXT,
  selected_addons       TEXT[],
  custom_quantities     JSONB,
  locked_at             TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX pricing_config_venture_idx ON interactive_pricing_configs(venture_id);
CREATE INDEX pricing_config_entity_idx ON interactive_pricing_configs(entity_type, entity_id);
```

### Client Notifications

```sql
CREATE TABLE client_notifications (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id            UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  entity_type           engagement_entity_type NOT NULL,
  entity_id             UUID NOT NULL,
  type                  client_notification_type NOT NULL,
  recipient_user_id     UUID NOT NULL,
  message               TEXT NOT NULL,
  metadata              JSONB,
  read_at               TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX client_notif_venture_idx ON client_notifications(venture_id);
CREATE INDEX client_notif_recipient_idx ON client_notifications(recipient_user_id);
CREATE INDEX client_notif_read_idx ON client_notifications(read_at);
CREATE INDEX client_notif_created_idx ON client_notifications(created_at);
```

---

## Server Services

### 1. InvoiceV2Service

The core invoice engine. Manages the complete invoice lifecycle from draft to payment, including Stripe payment link generation, overdue detection, and automated reminders.

**Key Distinction:** This is the "V2" invoice system, superseding the simpler `payments.invoices` table. V2 invoices support templates, custom branding, multi-line items with per-line tax/discount, reminders, and credit note application.

#### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `create` | `(ventureId, input, createdBy?) → Invoice` | Create draft invoice with auto-numbering |
| `update` | `(ventureId, invoiceId, input) → Invoice` | Update draft invoice (recalculates totals) |
| `delete` | `(ventureId, invoiceId) → { success }` | Delete draft invoice only |
| `getById` | `(ventureId, invoiceId) → Invoice \| null` | Get invoice with relations |
| `list` | `(ventureId, filter) → PaginatedResult` | List with search, status, date filters |
| `send` | `(ventureId, invoiceId) → Invoice` | Send invoice, generate Stripe payment link |
| `markViewed` | `(ventureId, invoiceId) → Invoice` | Track when client views invoice |
| `recordPayment` | `(ventureId, invoiceId, input, createdBy?) → { invoice, receipt }` | Record manual payment |
| `applyCredit` | `(ventureId, invoiceId, creditNoteId) → { success, amountDue }` | Apply credit note |
| `voidInvoice` | `(ventureId, invoiceId) → Invoice` | Void unpaid invoice |
| `writeOff` | `(ventureId, invoiceId) → Invoice` | Write off uncollectable invoice |
| `duplicate` | `(ventureId, invoiceId, createdBy?) → Invoice` | Clone invoice as new draft |
| `detectOverdueInvoices` | `(ventureId?) → Invoice[]` | Find and mark overdue invoices |
| `processReminders` | `(ventureId?) → { sent }` | Process and send due reminders |
| `getSummary` | `(ventureId) → InvoicingSummary` | Dashboard metrics and KPIs |

#### Invoice Status Flow

```
                    ┌──────────┐
                    │  draft   │
                    └────┬─────┘
                         │ send()
                    ┌────▼─────┐
                    │   sent   │
                    └────┬─────┘
                         │ markViewed()
                    ┌────▼─────┐
                    │  viewed  │
                    └────┬─────┘
                         │
               ┌─────────┼─────────┐
               │         │         │
          recordPayment() │    detectOverdue()
          (partial)       │         │
          ┌────▼─────┐   │   ┌─────▼────┐
          │ partial  │   │   │ overdue  │
          └────┬─────┘   │   └────┬─────┘
               │         │        │ recordPayment()
               └─────────┼────────┘
                         │
                   recordPayment()
                   (full amount)
                    ┌────▼─────┐
                    │   paid   │
                    └──────────┘

  Side transitions (from any non-paid state):
  ─ voidInvoice() → void
  ─ writeOff()    → write_off
```

#### Auto-Numbering

Invoices are numbered sequentially per template. Each template maintains a `numberPrefix` (default: `'INV'`) and `nextNumber` (default: `1001`). Generated format: `INV-01001`, `INV-01002`, etc. The template's `nextNumber` is atomically incremented after each invoice creation.

#### Default Reminders

When no custom reminders are provided, the system creates five default reminders:

| Type | Day Offset | Description |
|------|------------|-------------|
| `before_due` | -3 | 3 days before due date |
| `on_due` | 0 | On the due date |
| `after_due` | +3 | 3 days after due date |
| `after_due` | +7 | 7 days after due date |
| `after_due` | +14 | 14 days after due date |

#### Line Item Calculation

```typescript
// Per-line calculation (all values in cents)
for (const item of lineItems) {
  const lineTotal = item.quantity * item.unitPrice;
  subtotal += lineTotal;

  // Percentage discount
  if (item.discountPercent) {
    discountAmount += Math.round(lineTotal * (item.discountPercent / 100));
  }
  // Fixed discount
  if (item.discountAmount) {
    discountAmount += item.discountAmount;
  }
  // Tax on discounted amount
  if (item.taxRate) {
    const taxableAmount = lineTotal - (item.discountAmount || 0);
    taxAmount += Math.round(taxableAmount * (item.taxRate / 100));
  }
  // Fixed tax override
  if (item.taxAmount) {
    taxAmount += item.taxAmount;
  }
}

total = subtotal - discountAmount + taxAmount;
```

---

### 2. EstimateService

Full lifecycle for estimates/quotes with version history, e-signature acceptance, and conversion to invoices (including milestone-based progress invoicing).

#### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `create` | `(ventureId, input, createdBy?) → Estimate` | Create draft with version 1 |
| `update` | `(ventureId, estimateId, input) → Estimate` | Update draft, auto-creates new version |
| `delete` | `(ventureId, estimateId) → { success }` | Delete draft only |
| `getById` | `(ventureId, estimateId) → Estimate \| null` | Get with relations |
| `list` | `(ventureId, filter) → PaginatedResult` | List with filters |
| `send` | `(ventureId, estimateId) → Estimate` | Send to client |
| `markViewed` | `(ventureId, estimateId) → Estimate` | Track client view |
| `accept` | `(ventureId, estimateId, signatureUrl, signatureIp?) → Estimate` | Accept with e-signature |
| `decline` | `(ventureId, estimateId, reason?) → Estimate` | Decline with reason |
| `convertToInvoice` | `(ventureId, estimateId, input?, createdBy?) → { invoice, estimate }` | Convert to invoice |
| `detectExpired` | `(ventureId?) → Estimate[]` | Find and mark expired estimates |
| `getSummary` | `(ventureId) → EstimateSummary` | Dashboard metrics |
| `duplicate` | `(ventureId, estimateId, createdBy?) → Estimate` | Clone estimate |

#### Version History

Every time line items are updated, a new version snapshot is automatically created:

```typescript
const newVersion: EstimateVersionEntry = {
  version: newVersionNum,
  lineItems: input.lineItems,
  total: calculatedTotal,
  createdAt: new Date().toISOString(),
  note: input.versionNote,  // Optional description of changes
};
// Appended to versions[] array, currentVersion incremented
```

#### Progress Invoicing (Milestone-Based Conversion)

Instead of converting an entire estimate to a single invoice, you can invoice milestones:

```typescript
// Invoice 25% as "Design Phase"
const result = await estimateService.convertToInvoice(ventureId, estimateId, {
  milestonePercent: 25,
  milestoneName: 'Design Phase',
});

// Later, invoice another 50% as "Development Phase"
const result2 = await estimateService.convertToInvoice(ventureId, estimateId, {
  milestonePercent: 50,
  milestoneName: 'Development Phase',
});

// Line items are proportionally scaled: quantity × (milestonePercent / 100)
// When total milestones reach 100%, estimate status → 'converted'
```

---

### 3. ProposalService

Business proposals with rich content blocks, e-signature acceptance, and conversion to invoices. Proposals support headings, paragraphs, images, tables, pricing sections, terms, signature blocks, videos, and testimonials.

#### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `create` | `(ventureId, input, createdBy?) → Proposal` | Create draft proposal |
| `update` | `(ventureId, proposalId, input) → Proposal` | Update draft only |
| `delete` | `(ventureId, proposalId) → { success }` | Delete draft only |
| `getById` | `(ventureId, proposalId) → Proposal \| null` | Get with relations |
| `list` | `(ventureId, filter) → PaginatedResult` | List with search/status |
| `send` | `(ventureId, proposalId) → Proposal` | Send to client |
| `markViewed` | `(ventureId, proposalId) → Proposal` | Track client view |
| `accept` | `(ventureId, proposalId, input) → Proposal` | Accept with e-signature |
| `decline` | `(ventureId, proposalId, reason?) → Proposal` | Decline with reason |
| `convertToInvoice` | `(ventureId, proposalId, createdBy?) → Invoice` | Convert accepted proposal |
| `detectExpiredProposals` | `(ventureId?) → Proposal[]` | Find and mark expired |
| `getSummary` | `(ventureId) → ProposalSummary` | Dashboard metrics |

#### Proposal Content Blocks

Proposals are composed of ordered content blocks:

```typescript
const content: ProposalContentBlock[] = [
  {
    id: 'block-1',
    type: 'heading',
    content: '<h1>Website Redesign Proposal</h1>',
    sortOrder: 1,
  },
  {
    id: 'block-2',
    type: 'paragraph',
    content: '<p>We are excited to present our approach...</p>',
    sortOrder: 2,
  },
  {
    id: 'block-3',
    type: 'image',
    content: 'https://cdn.mcv.one/proposals/mockup.png',
    metadata: { alt: 'Design mockup', width: 800 },
    sortOrder: 3,
  },
  {
    id: 'block-4',
    type: 'pricing',
    content: '',  // Rendered from lineItems
    sortOrder: 4,
  },
  {
    id: 'block-5',
    type: 'signature',
    content: '',  // Rendered as e-signature capture
    sortOrder: 5,
  },
];
```

---

### 4. RecurringInvoiceService

Manages scheduled invoice generation with configurable intervals. This is fundamentally different from Stripe Subscriptions:

| Feature | Recurring Invoices | Stripe Subscriptions |
|---------|-------------------|---------------------|
| Billing | Manual (payment link) | Auto-charge |
| Management | MCV internal | Stripe-managed |
| Use case | Retainers, rent, consulting | SaaS plans, memberships |
| Payment | Customer pays via link | Customer charged automatically |
| Source | `@mcv/invoicing` | `@mcv/payments` |

#### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `create` | `(ventureId, input, createdBy?) → RecurringInvoice` | Create recurring schedule |
| `update` | `(ventureId, id, input) → RecurringInvoice` | Update schedule settings |
| `pause` | `(ventureId, id) → RecurringInvoice` | Pause active schedule |
| `resume` | `(ventureId, id) → RecurringInvoice` | Resume paused schedule |
| `cancel` | `(ventureId, id) → RecurringInvoice` | Cancel schedule |
| `getById` | `(ventureId, id) → RecurringInvoice \| null` | Get with relations |
| `list` | `(ventureId, filter) → PaginatedResult` | List with status filter |
| `processDueInvoices` | `() → { generated, failed, errors[] }` | Cron: generate all due invoices |

#### Generation Engine

The `processDueInvoices()` method is designed to be called from a cron job (hourly or daily):

```
1. Find all active recurring invoices where nextDate ≤ now
2. For each:
   a. Check end date (if expired → status = 'completed', skip)
   b. Generate invoice from templateConfig
   c. If autoSend enabled → send invoice immediately
   d. Calculate next date based on interval
   e. Increment totalGenerated counter
   f. Add invoice total to totalRevenue
3. Return { generated, failed, errors }
```

#### Next Date Calculation

| Interval | Calculation |
|----------|-------------|
| `weekly` | +7 days |
| `biweekly` | +14 days |
| `monthly` | +1 month, clamped to valid day |
| `quarterly` | +3 months, clamped |
| `semiannually` | +6 months, clamped |
| `yearly` | +1 year, clamped |

Day-of-month clamping ensures February 30th becomes February 28th (or 29th in leap years).

---

### 5. CreditNoteService

Manages credit notes against invoices for refunds, billing errors, and adjustments.

#### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `create` | `(ventureId, input, createdBy?) → CreditNote` | Create draft credit note |
| `issue` | `(ventureId, creditNoteId) → CreditNote` | Issue credit (draft → issued) |
| `voidNote` | `(ventureId, creditNoteId) → CreditNote` | Void credit note |
| `list` | `(ventureId, filter) → PaginatedResult` | List by invoice/status |

#### Credit Note Lifecycle

```
draft → issued → applied
  │              (via invoiceV2Service.applyCredit)
  └→ void
```

**Validation:** Credit note amount cannot exceed the invoice total. Credit notes are applied to invoices via `invoiceV2Service.applyCredit()`, which reduces the invoice's `amountDue` and updates status to `partial` or `paid`.

---

### 6. PlatformFeeService (Super Admin)

Manages Stripe Connect application fees across the MCV ecosystem. Each venture can have a unique fee configuration with percentage, flat, or tiered pricing.

#### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getConfig` | `(ventureId) → PlatformFeeConfig \| null` | Get venture fee config |
| `updateConfig` | `(input, updatedBy?) → PlatformFeeConfig` | Create or update config |
| `listConfigs` | `(filter) → PaginatedResult` | List all venture configs |
| `calculateFee` | `(ventureId, transactionAmount) → number` | Calculate fee for amount |
| `recordFee` | `(ventureId, invoiceId, amount, fee, percent, desc?, stripeId?) → LedgerEntry` | Record fee in ledger |
| `getPlatformRevenueReport` | `(dateRange) → RevenueReport` | Platform-wide revenue report |

#### Fee Calculation Logic

```typescript
async calculateFee(ventureId: string, transactionAmount: number): Promise<number> {
  const config = await this.getConfig(ventureId);
  if (!config || !config.isActive) return 0;

  let fee = 0;

  switch (config.feeType) {
    case 'percentage':
      fee = Math.round(transactionAmount * (feePercent / 100));
      break;
    case 'flat':
      fee = config.flatFeeCents || 0;
      break;
    case 'tiered':
      // Find matching tier based on transaction amount
      for (const tier of tieredConfig.tiers) {
        if (transactionAmount <= tier.upTo || isLastTier) {
          fee = Math.round(transactionAmount * (tier.feePercent / 100));
          break;
        }
      }
      break;
  }

  // Apply minimum fee
  if (config.minimumFee && fee < config.minimumFee) fee = config.minimumFee;

  // Apply fee cap
  if (config.cappedAt && fee > config.cappedAt) fee = config.cappedAt;

  return fee;
}
```

#### Platform Revenue Report

The `getPlatformRevenueReport()` method returns:

```typescript
{
  totalFees: number;           // Total fees collected (cents)
  totalTransactions: number;   // Total transaction volume (cents)
  count: number;               // Number of fee entries
  byVenture: Array<{
    ventureId: string;
    totalFees: number;
    totalTransactions: number;
    count: number;
  }>;
  byPeriod: Array<{
    period: string;            // 'YYYY-MM'
    totalFees: number;
    count: number;
  }>;
}
```

---

### 7. InvoicePdfService

Generates branded PDF data and HTML for invoices with custom headers, footers, logos, color schemes, and payment QR codes.

#### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getPdfData` | `(ventureId, invoiceId) → InvoicePdfData` | Gather all data for PDF rendering |
| `generateHtml` | `(ventureId, invoiceId) → string` | Generate complete HTML invoice |

The HTML output is a fully self-contained document suitable for:
- Direct browser rendering
- PDF conversion via Puppeteer / @react-pdf/renderer / wkhtmltopdf
- Email body (inline styles, no external CSS)

#### HTML Template Features

- **Branded header** with logo and venture name
- **Color theming** from template configuration
- **Line item table** with description, quantity, unit price, amount
- **Totals section** with subtotal, discount, tax, total, paid, amount due
- **Payment link** with QR code data
- **Notes and terms** sections
- **Custom header/footer HTML** from template

---

### 8. ApprovalService

Multi-step approval workflows with conditional rules, auto-approve thresholds, and step-by-step decision tracking. Supports invoices, proposals, estimates, credit notes, and discounts.

#### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `createWorkflow` | `(ventureId, input, createdBy?) → ApprovalWorkflow` | Create workflow definition |
| `updateWorkflow` | `(ventureId, workflowId, input) → ApprovalWorkflow` | Update workflow |
| `deleteWorkflow` | `(ventureId, workflowId) → { success }` | Delete workflow |
| `listWorkflows` | `(ventureId, filter) → PaginatedResult` | List by entity type |
| `submitForApproval` | `(ventureId, input, requestedBy?) → ApprovalRequest` | Submit entity for approval |
| `makeDecision` | `(ventureId, input, decidedBy?) → ApprovalDecision` | Approve/reject/request changes |
| `getApprovalStatus` | `(ventureId, entityType, entityId) → ApprovalRequest \| null` | Check approval status |
| `getMyPendingApprovals` | `(ventureId, userId, filter) → PaginatedResult` | Get pending items for user |
| `cancelApproval` | `(ventureId, approvalRequestId) → { success }` | Cancel pending request |

#### Approval Flow

```
Submit → [Step 1] → [Step 2] → ... → [Step N] → Approved
              │          │               │
              └──────────┴───────────────┘
                         │
                   Rejected / Changes Requested

Auto-approve logic:
- If step condition doesn't match entity → auto-approve (not applicable)
- If entity total < step's autoApproveBelow → auto-approve
- If ALL steps auto-approved → immediately approved
```

#### Conditional Rules Example

```typescript
const rules: ApprovalRule[] = [
  {
    step: 1,
    approverRoleId: 'manager-role-id',
    autoApproveBelow: 100000,        // Auto-approve invoices under $1,000
  },
  {
    step: 2,
    approverUserId: 'cfo-user-id',
    condition: {
      field: 'total',
      operator: 'gte',
      value: 500000,                 // Only triggered for invoices ≥ $5,000
    },
  },
  {
    step: 3,
    approverRoleId: 'executive-role-id',
    condition: {
      field: 'total',
      operator: 'gte',
      value: 1000000,               // Only triggered for invoices ≥ $10,000
    },
  },
];
```

---

### 9. EngagementService

Tracks document view events, calculates engagement scores (0–100), generates section heatmaps, and manages client view notifications.

#### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `trackView` | `(ventureId, input) → DocumentViewEvent` | Record a document view |
| `getEngagementScore` | `(ventureId, entityType, entityId) → EngagementScore \| null` | Get score |
| `recalculateScore` | `(ventureId, entityType, entityId) → EngagementScore` | Recalculate from events |
| `getViewHistory` | `(ventureId, entityType, entityId, pagination) → PaginatedResult` | View history |
| `getHeatmap` | `(ventureId, entityType, entityId) → HeatmapResult` | Section engagement map |
| `sendViewNotification` | `(ventureId, entityType, entityId, viewEvent) → void` | Send view notification |
| `getNotifications` | `(ventureId, userId, options) → PaginatedResult` | Get user notifications |
| `markNotificationRead` | `(ventureId, notificationId) → ClientNotification` | Mark read |
| `getEngagementReport` | `(ventureId, dateRange) → EngagementReportResult` | Aggregate report |

#### Engagement Score Calculation

The score (0–100) uses weighted components:

```
Score = (viewScore × 0.30) + (uniqueScore × 0.20) + (avgDurScore × 0.30) + (totalDurScore × 0.20)

Where:
  viewScore    = min(totalViews × 10, 100)        → 10 views = max
  uniqueScore  = min(uniqueViewers × 20, 100)     → 5 unique viewers = max
  avgDurScore  = min((avgDurationMs / 60000) × 33, 100)  → 3 min avg = max
  totalDurScore = min((totalDurationMs / 300000) × 20, 100) → 5 min total = max
```

#### Heatmap Output

```typescript
{
  sections: [
    {
      sectionId: 'pricing-table',
      sectionName: 'Pricing',
      totalDurationMs: 45000,     // 45 seconds total across all views
      avgScrollDepth: 92.5,       // Percentage
      viewCount: 8,
    },
    {
      sectionId: 'terms',
      sectionName: 'Terms & Conditions',
      totalDurationMs: 12000,
      avgScrollDepth: 45.0,
      viewCount: 3,
    },
  ],
  totalEvents: 12,
}
```

---

### 10. InteractivePricingService

Allows clients to interact with proposals and estimates by selecting packages, toggling add-ons, and adjusting quantities before finalizing.

#### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `createConfig` | `(ventureId, input) → InteractivePricingConfig` | Create pricing config |
| `updateConfig` | `(ventureId, configId, updates) → InteractivePricingConfig` | Update config |
| `getConfig` | `(ventureId, entityType, entityId) → Config \| null` | Get by entity |
| `selectPackage` | `(ventureId, configId, packageId) → Config` | Client selects package |
| `toggleAddon` | `(ventureId, configId, addonId, selected) → Config` | Toggle add-on |
| `updateQuantity` | `(ventureId, configId, lineItemId, quantity) → Config` | Adjust quantity |
| `lockSelection` | `(ventureId, configId) → Config` | Lock selections (finalize) |
| `calculateTotal` | `(config) → { packageTotal, addonsTotal, grandTotal }` | Calculate totals |
| `getSelectionSummary` | `(ventureId, configId) → SelectionSummary` | Full summary with selections |

#### Pricing Modes

| Mode | Description |
|------|-------------|
| `standard` | Standard line items, no package selection |
| `packages` | Client chooses from pre-defined packages (Basic/Pro/Enterprise) |
| `builder` | Client builds custom configuration with quantity overrides and addons |

#### Quantity Validation

When `quantityOverrides` are configured, quantity changes are validated:

```typescript
if (quantity < override.minQty || quantity > override.maxQty) {
  throw new Error(`Quantity must be between ${override.minQty} and ${override.maxQty}`);
}
if (override.step > 0 && (quantity - override.minQty) % override.step !== 0) {
  throw new Error(`Quantity must be in steps of ${override.step}`);
}
```

---

## Code Examples

### Example 1: Create and Send an Invoice

```typescript
import { invoiceV2Service } from '@mcv/invoicing/server';

// Create a draft invoice
const invoice = await invoiceV2Service.create(ventureId, {
  contactId: 'contact-uuid',
  organizationId: 'org-uuid',
  lineItems: [
    {
      id: 'li-1',
      description: 'Web Development - Phase 1',
      quantity: 40,
      unitPrice: 15000,          // $150.00/hr in cents
      amount: 600000,            // $6,000.00
      taxRate: 13,               // 13% HST
      sortOrder: 1,
    },
    {
      id: 'li-2',
      description: 'UI/UX Design',
      quantity: 20,
      unitPrice: 12500,          // $125.00/hr
      amount: 250000,            // $2,500.00
      taxRate: 13,
      sortOrder: 2,
    },
    {
      id: 'li-3',
      description: 'Project Management',
      quantity: 1,
      unitPrice: 50000,          // $500.00 flat
      amount: 50000,
      discountPercent: 10,       // 10% discount
      sortOrder: 3,
    },
  ],
  currency: 'cad',
  notes: 'Payment due within 30 days.',
  terms: 'Late payments subject to 1.5% monthly interest.',
  billingAddress: {
    line1: '123 Bay Street',
    line2: 'Suite 400',
    city: 'Toronto',
    state: 'ON',
    postalCode: 'M5J 2T3',
    country: 'CA',
  },
});

console.log(invoice.number);     // "INV-01001"
console.log(invoice.total);      // Calculated: subtotal - discounts + tax
console.log(invoice.status);     // "draft"

// Send the invoice (generates Stripe payment link)
const sentInvoice = await invoiceV2Service.send(ventureId, invoice.id);
console.log(sentInvoice.status);       // "sent"
console.log(sentInvoice.paymentLink);  // "https://pay.mcv.one/inv/..."
```

### Example 2: Record Payment and Handle Partial Payments

```typescript
import { invoiceV2Service } from '@mcv/invoicing/server';

// Record a partial payment
const { invoice, receipt } = await invoiceV2Service.recordPayment(
  ventureId,
  invoiceId,
  {
    amount: 300000,              // $3,000.00
    method: 'bank_transfer',
    reference: 'EFT-2026-0142',
    notes: 'First installment',
  },
  userId
);

console.log(invoice.status);      // "partial"
console.log(invoice.amountPaid);  // 300000
console.log(invoice.amountDue);   // remaining amount

// Record the final payment
const { invoice: paid } = await invoiceV2Service.recordPayment(
  ventureId,
  invoiceId,
  {
    amount: invoice.amountDue,
    method: 'card',
    reference: 'pi_stripe_payment_intent_id',
  },
  userId
);

console.log(paid.status);  // "paid"
console.log(paid.paidAt);  // Date when fully paid
```

### Example 3: Create Estimate with Version History and Convert to Invoice

```typescript
import { estimateService } from '@mcv/invoicing/server';

// Create an estimate
const estimate = await estimateService.create(ventureId, {
  title: 'E-Commerce Platform Development',
  contactId: 'contact-uuid',
  lineItems: [
    {
      id: 'li-1',
      description: 'Backend Development',
      quantity: 200,
      unitPrice: 15000,
      amount: 3000000,
      sortOrder: 1,
    },
    {
      id: 'li-2',
      description: 'Frontend Development',
      quantity: 150,
      unitPrice: 14000,
      amount: 2100000,
      sortOrder: 2,
    },
  ],
  validUntil: new Date('2026-03-31'),
  notes: 'Estimate valid for 30 days.',
});

console.log(estimate.estimateNumber);  // "EST-00001"
console.log(estimate.currentVersion);  // 1

// Update creates a new version
const updated = await estimateService.update(ventureId, estimate.id, {
  lineItems: [
    // Updated pricing
    { id: 'li-1', description: 'Backend Development', quantity: 180, unitPrice: 15000, amount: 2700000, sortOrder: 1 },
    { id: 'li-2', description: 'Frontend Development', quantity: 150, unitPrice: 14000, amount: 2100000, sortOrder: 2 },
    { id: 'li-3', description: 'QA Testing', quantity: 40, unitPrice: 10000, amount: 400000, sortOrder: 3 },
  ],
  versionNote: 'Added QA testing, reduced backend hours',
});

console.log(updated.currentVersion);  // 2
console.log(updated.versions.length); // 2

// Send and accept
await estimateService.send(ventureId, estimate.id);
await estimateService.accept(ventureId, estimate.id, 'https://signatures.mcv.one/sig-123.png', '192.168.1.100');

// Convert with progress invoicing (25% milestone)
const { invoice, estimate: updatedEstimate } = await estimateService.convertToInvoice(
  ventureId,
  estimate.id,
  { milestonePercent: 25, milestoneName: 'Design & Planning' }
);

console.log(invoice.total);  // 25% of estimate total
console.log(updatedEstimate.progressInvoicing.milestones.length);  // 1
```

### Example 4: Create a Rich Proposal with Interactive Pricing

```typescript
import { proposalService } from '@mcv/invoicing/server';
import { interactivePricingService } from '@mcv/invoicing/server';

// Create the proposal
const proposal = await proposalService.create(ventureId, {
  title: 'Brand Identity & Marketing Strategy',
  contactId: 'contact-uuid',
  content: [
    { id: 'b1', type: 'heading', content: '<h1>Brand Identity Package</h1>', sortOrder: 1 },
    { id: 'b2', type: 'paragraph', content: '<p>A comprehensive brand identity...</p>', sortOrder: 2 },
    { id: 'b3', type: 'image', content: 'https://cdn.mcv.one/portfolio/brand-samples.jpg', sortOrder: 3 },
    { id: 'b4', type: 'testimonial', content: '"Outstanding work!" — Previous Client', sortOrder: 4 },
    { id: 'b5', type: 'pricing', content: '', sortOrder: 5 },
    { id: 'b6', type: 'terms', content: '<p>Standard terms and conditions...</p>', sortOrder: 6 },
    { id: 'b7', type: 'signature', content: '', sortOrder: 7 },
  ],
  lineItems: [
    { id: 'li-1', description: 'Logo Design', quantity: 1, unitPrice: 500000, amount: 500000, sortOrder: 1 },
    { id: 'li-2', description: 'Brand Guidelines', quantity: 1, unitPrice: 300000, amount: 300000, sortOrder: 2 },
    { id: 'li-3', description: 'Social Media Templates', quantity: 5, unitPrice: 50000, amount: 250000, sortOrder: 3 },
  ],
  validUntil: new Date('2026-03-15'),
  coverImageUrl: 'https://cdn.mcv.one/proposals/cover.jpg',
});

// Add interactive pricing
const pricing = await interactivePricingService.createConfig(ventureId, {
  entityType: 'proposal',
  entityId: proposal.id,
  pricingMode: 'packages',
  packages: [
    {
      id: 'basic',
      name: 'Essential',
      description: 'Logo and basic brand guidelines',
      isRecommended: false,
      lineItems: [
        { id: 'p-1', description: 'Logo Design', quantity: 1, unitPrice: 300000, amount: 300000 },
        { id: 'p-2', description: 'Color Palette', quantity: 1, unitPrice: 50000, amount: 50000 },
      ],
      total: 350000,
      features: ['Logo (3 concepts)', 'Color palette', 'Basic typography'],
    },
    {
      id: 'pro',
      name: 'Professional',
      description: 'Complete brand identity package',
      isRecommended: true,
      lineItems: [
        { id: 'p-3', description: 'Logo Design', quantity: 1, unitPrice: 500000, amount: 500000 },
        { id: 'p-4', description: 'Brand Guidelines', quantity: 1, unitPrice: 300000, amount: 300000 },
        { id: 'p-5', description: 'Stationery', quantity: 1, unitPrice: 150000, amount: 150000 },
      ],
      total: 950000,
      features: ['Logo (5 concepts)', 'Full brand guidelines', 'Stationery design', 'Social templates'],
    },
  ],
  addons: [
    { id: 'addon-1', name: 'Business Cards', description: '500 premium cards', price: 15000, isSelected: false, category: 'print' },
    { id: 'addon-2', name: 'Animated Logo', description: 'Motion graphics logo', price: 200000, isSelected: false, category: 'digital' },
  ],
});

// Client selects a package
await interactivePricingService.selectPackage(ventureId, pricing.id, 'pro');
await interactivePricingService.toggleAddon(ventureId, pricing.id, 'addon-2', true);

// Get final summary
const summary = await interactivePricingService.getSelectionSummary(ventureId, pricing.id);
console.log(summary.grandTotal);  // 950000 + 200000 = 1150000 ($11,500.00)

// Lock and convert
await interactivePricingService.lockSelection(ventureId, pricing.id);
```

### Example 5: Set Up Recurring Invoices for a Retainer

```typescript
import { recurringInvoiceService } from '@mcv/invoicing/server';

const recurring = await recurringInvoiceService.create(ventureId, {
  name: 'Monthly SEO Retainer - Acme Corp',
  contactId: 'contact-uuid',
  organizationId: 'org-uuid',
  interval: 'monthly',
  dayOfMonth: 1,
  startDate: new Date('2026-03-01'),
  endDate: new Date('2027-02-28'),    // 12-month contract
  autoSend: true,
  templateConfig: {
    lineItems: [
      {
        id: 'seo-1',
        description: 'SEO Strategy & Execution',
        quantity: 1,
        unitPrice: 350000,           // $3,500.00/month
        amount: 350000,
        sortOrder: 1,
      },
      {
        id: 'seo-2',
        description: 'Monthly Analytics Report',
        quantity: 1,
        unitPrice: 50000,            // $500.00/month
        amount: 50000,
        sortOrder: 2,
      },
    ],
    currency: 'usd',
    paymentTermsDays: 15,
    notes: 'Monthly retainer for SEO services.',
  },
});

console.log(recurring.status);       // "active"
console.log(recurring.nextDate);     // 2026-03-01

// Pause during holiday season
await recurringInvoiceService.pause(ventureId, recurring.id);

// Resume after holidays
await recurringInvoiceService.resume(ventureId, recurring.id);

// Process all due invoices (called by cron)
const result = await recurringInvoiceService.processDueInvoices();
console.log(result);  // { generated: 5, failed: 0, errors: [] }
```

### Example 6: Credit Note and Application

```typescript
import { creditNoteService } from '@mcv/invoicing/server';
import { invoiceV2Service } from '@mcv/invoicing/server';

// Create credit note for overbilling
const creditNote = await creditNoteService.create(ventureId, {
  invoiceId: invoiceId,
  amount: 50000,                 // $500.00 credit
  reason: 'Overbilled for Q4 consulting hours',
  notes: 'Client reported 5 hours fewer than invoiced',
}, userId);

console.log(creditNote.number);   // "CN-00001"
console.log(creditNote.status);   // "draft"

// Issue the credit note
const issued = await creditNoteService.issue(ventureId, creditNote.id);
console.log(issued.status);       // "issued"

// Apply credit to the invoice
const result = await invoiceV2Service.applyCredit(ventureId, invoiceId, creditNote.id);
console.log(result.amountDue);    // Reduced by $500.00
// Credit note status → "applied"
```

### Example 7: Approval Workflow for High-Value Invoices

```typescript
import { approvalService } from '@mcv/invoicing/server';

// Create a 3-step approval workflow
const workflow = await approvalService.createWorkflow(ventureId, {
  name: 'Invoice Approval - Tiered',
  entityType: 'invoice',
  rules: [
    {
      step: 1,
      approverRoleId: 'account-manager',
      autoApproveBelow: 100000,    // Auto-approve under $1,000
    },
    {
      step: 2,
      approverUserId: 'cfo-user-id',
      condition: { field: 'total', operator: 'gte', value: 500000 },
    },
    {
      step: 3,
      approverRoleId: 'executive',
      condition: { field: 'total', operator: 'gte', value: 2000000 },
    },
  ],
});

// Submit a $7,500 invoice for approval
const request = await approvalService.submitForApproval(ventureId, {
  entityType: 'invoice',
  entityId: invoiceId,
  notes: 'Q1 consulting engagement invoice',
}, userId);

// Step 1: Not auto-approved (≥ $1,000), needs manager approval
// Step 2: Condition met (≥ $5,000), needs CFO approval
// Step 3: Condition not met (< $20,000), auto-approved

console.log(request.status);       // "pending"
console.log(request.currentStep);  // 1 (waiting for manager)

// Manager approves
await approvalService.makeDecision(ventureId, {
  approvalRequestId: request.id,
  decision: 'approved',
  reason: 'Approved per engagement agreement',
}, managerId);

// CFO approves (now on step 2)
await approvalService.makeDecision(ventureId, {
  approvalRequestId: request.id,
  decision: 'approved',
  reason: 'Within budget allocation',
}, cfoId);

// Check status — step 3 was auto-approved, so request is fully approved
const status = await approvalService.getApprovalStatus(ventureId, 'invoice', invoiceId);
console.log(status.status);  // "approved"
```

### Example 8: Track Document Engagement

```typescript
import { engagementService } from '@mcv/invoicing/server';

// Track when a client views a proposal
const viewEvent = await engagementService.trackView(ventureId, {
  entityType: 'proposal',
  entityId: proposalId,
  viewerEmail: 'client@acme.com',
  viewerIp: '203.0.113.42',
  viewerUserAgent: 'Mozilla/5.0...',
  sessionId: 'sess-abc-123',
  totalDurationMs: 180000,        // 3 minutes
  pageCount: 5,
  pagesViewed: 5,
  deviceType: 'desktop',
  location: { country: 'CA', region: 'Ontario', city: 'Toronto' },
  sections: [
    { sectionId: 'intro', sectionName: 'Introduction', durationMs: 15000, scrollDepthPercent: 100 },
    { sectionId: 'pricing', sectionName: 'Pricing', durationMs: 95000, scrollDepthPercent: 100 },
    { sectionId: 'terms', sectionName: 'Terms', durationMs: 45000, scrollDepthPercent: 80 },
    { sectionId: 'signature', sectionName: 'Signature', durationMs: 25000, scrollDepthPercent: 100 },
  ],
});

// Get engagement score
const score = await engagementService.getEngagementScore(ventureId, 'proposal', proposalId);
console.log(score.score);            // 72 (out of 100)
console.log(score.mostViewedSection); // "Pricing"
console.log(score.totalViews);       // 3
console.log(score.uniqueViewers);    // 2

// Get section heatmap
const heatmap = await engagementService.getHeatmap(ventureId, 'proposal', proposalId);
console.log(heatmap.sections[0]);     // Pricing section — most engaged
```

### Example 9: Generate Invoice PDF

```typescript
import { invoicePdfService } from '@mcv/invoicing/server';

// Get structured data for PDF rendering
const pdfData = await invoicePdfService.getPdfData(ventureId, invoiceId);

console.log(pdfData.invoice.number);     // "INV-01042"
console.log(pdfData.lineItems.length);   // 3
console.log(pdfData.venture.name);       // "Acme Consulting"
console.log(pdfData.template.logoUrl);   // "https://cdn.mcv.one/logos/acme.png"

// Generate HTML for email or PDF conversion
const html = await invoicePdfService.generateHtml(ventureId, invoiceId);

// Use with Puppeteer for PDF:
// const browser = await puppeteer.launch();
// const page = await browser.newPage();
// await page.setContent(html);
// const pdf = await page.pdf({ format: 'A4' });
```

### Example 10: Platform Fee Configuration (Super Admin)

```typescript
import { platformFeeService } from '@mcv/invoicing/server';

// Configure tiered fees for a venture
await platformFeeService.updateConfig({
  ventureId: 'venture-uuid',
  feeType: 'tiered',
  tieredConfig: {
    tiers: [
      { upTo: 1000000, feePercent: 3.5 },     // 3.5% up to $10,000
      { upTo: 5000000, feePercent: 2.5 },      // 2.5% from $10,001 to $50,000
      { upTo: 99999999, feePercent: 1.5 },     // 1.5% above $50,000
    ],
    resetPeriod: 'monthly',
  },
  minimumFee: 100,                // $1.00 minimum fee
  cappedAt: 500000,               // $5,000 max fee per transaction
  isActive: true,
  effectiveFrom: new Date('2026-03-01'),
});

// Calculate fee for a $25,000 transaction
const fee = await platformFeeService.calculateFee('venture-uuid', 2500000);
console.log(fee);  // 62500 ($625.00 = 2.5% of $25,000)

// Record fee in ledger after payment
await platformFeeService.recordFee(
  'venture-uuid',
  invoiceId,
  2500000,           // Transaction amount
  62500,             // Fee amount
  2.5,               // Fee percent
  'Invoice payment - Acme Corp',
  'tr_stripe_transfer_id'
);

// Get platform revenue report
const report = await platformFeeService.getPlatformRevenueReport({
  from: new Date('2026-01-01'),
  to: new Date('2026-12-31'),
});

console.log(report.totalFees);           // Total platform revenue in cents
console.log(report.byVenture.length);    // Per-venture breakdown
console.log(report.byPeriod);            // Monthly breakdown
```

### Example 11: Overdue Detection and Reminder Processing (Cron Job)

```typescript
import { invoiceV2Service } from '@mcv/invoicing/server';
import { estimateService } from '@mcv/invoicing/server';
import { proposalService } from '@mcv/invoicing/server';

// Run in a daily cron job
async function dailyFinancialMaintenance() {
  // 1. Detect and mark overdue invoices
  const overdueInvoices = await invoiceV2Service.detectOverdueInvoices();
  console.log(`Marked ${overdueInvoices.length} invoices as overdue`);

  // 2. Process and send due reminders
  const reminders = await invoiceV2Service.processReminders();
  console.log(`Sent ${reminders.sent} reminder emails`);

  // 3. Detect expired estimates
  const expiredEstimates = await estimateService.detectExpired();
  console.log(`Marked ${expiredEstimates.length} estimates as expired`);

  // 4. Detect expired proposals
  const expiredProposals = await proposalService.detectExpiredProposals();
  console.log(`Marked ${expiredProposals.length} proposals as expired`);
}

// Run hourly for recurring invoice generation
async function hourlyInvoiceGeneration() {
  const { generated, failed, errors } = await recurringInvoiceService.processDueInvoices();
  console.log(`Generated: ${generated}, Failed: ${failed}`);
  if (errors.length > 0) {
    console.error('Errors:', errors);
  }
}
```

### Example 12: Dashboard Summary Report

```typescript
import { invoiceV2Service } from '@mcv/invoicing/server';
import { proposalService } from '@mcv/invoicing/server';
import { estimateService } from '@mcv/invoicing/server';
import { engagementService } from '@mcv/invoicing/server';

async function getFinancialDashboard(ventureId: string) {
  const [invoiceSummary, proposalSummary, estimateSummary, engagementReport] = await Promise.all([
    invoiceV2Service.getSummary(ventureId),
    proposalService.getSummary(ventureId),
    estimateService.getSummary(ventureId),
    engagementService.getEngagementReport(ventureId, {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),   // Last 30 days
      to: new Date(),
    }),
  ]);

  return {
    invoices: {
      outstanding: invoiceSummary.amountOutstanding / 100,   // Convert to dollars
      overdue: invoiceSummary.amountOverdue / 100,
      collected: invoiceSummary.amountCollected / 100,
      avgDaysToPayment: invoiceSummary.averageDaysToPayment,
      counts: {
        draft: invoiceSummary.totalDraft,
        sent: invoiceSummary.totalSent,
        overdue: invoiceSummary.totalOverdue,
        paid: invoiceSummary.totalPaid,
      },
    },
    proposals: {
      conversionRate: proposalSummary.conversionRate,
      totalValue: proposalSummary.totalValue / 100,
      averageValue: proposalSummary.averageValue / 100,
      pending: proposalSummary.totalSent,
      accepted: proposalSummary.totalAccepted,
    },
    estimates: {
      conversionRate: estimateSummary.conversionRate,
      totalValue: estimateSummary.totalValue / 100,
      converted: estimateSummary.totalConverted,
    },
    engagement: {
      avgScore: engagementReport.avgScore,
      totalViews: engagementReport.totalViews,
      topDocuments: engagementReport.topDocuments,
    },
  };
}
```

### Example 13: Full Proposal-to-Payment Workflow

```typescript
import { proposalService } from '@mcv/invoicing/server';
import { approvalService } from '@mcv/invoicing/server';
import { invoiceV2Service } from '@mcv/invoicing/server';
import { engagementService } from '@mcv/invoicing/server';
import { platformFeeService } from '@mcv/invoicing/server';

async function fullSalesWorkflow(ventureId: string, contactId: string) {
  // 1. Create proposal
  const proposal = await proposalService.create(ventureId, {
    title: 'Marketing Campaign Q2 2026',
    contactId,
    lineItems: [
      { id: 'l1', description: 'Strategy Development', quantity: 1, unitPrice: 500000, amount: 500000, sortOrder: 1 },
      { id: 'l2', description: 'Content Creation', quantity: 10, unitPrice: 75000, amount: 750000, sortOrder: 2 },
      { id: 'l3', description: 'Ad Spend Management', quantity: 3, unitPrice: 200000, amount: 600000, sortOrder: 3 },
    ],
    validUntil: new Date('2026-04-30'),
  });

  // 2. Send to client
  await proposalService.send(ventureId, proposal.id);

  // 3. Track engagement (from client-facing portal)
  await engagementService.trackView(ventureId, {
    entityType: 'proposal',
    entityId: proposal.id,
    viewerEmail: 'buyer@client.com',
    totalDurationMs: 240000,
    deviceType: 'desktop',
  });

  // 4. Client accepts with e-signature
  await proposalService.accept(ventureId, proposal.id, {
    signatureUrl: 'https://signatures.mcv.one/sig-456.png',
    signatureIp: '198.51.100.23',
  });

  // 5. Convert to invoice
  const invoice = await proposalService.convertToInvoice(ventureId, proposal.id, userId);

  // 6. Submit for approval (if workflow exists)
  try {
    await approvalService.submitForApproval(ventureId, {
      entityType: 'invoice',
      entityId: invoice.id,
    }, userId);
  } catch (e) {
    // No active workflow — proceed directly
  }

  // 7. Send invoice
  await invoiceV2Service.send(ventureId, invoice.id);

  // 8. Record payment when received
  const { invoice: paidInvoice } = await invoiceV2Service.recordPayment(
    ventureId, invoice.id,
    { amount: invoice.total, method: 'card', reference: 'pi_xxx' },
    userId
  );

  // 9. Calculate and record platform fee
  const fee = await platformFeeService.calculateFee(ventureId, paidInvoice.total);
  await platformFeeService.recordFee(
    ventureId, paidInvoice.id,
    paidInvoice.total, fee, 2.5,
    'Commission on marketing campaign invoice'
  );

  return { proposal, invoice: paidInvoice, fee };
}
```

### Example 14: Void Invoice and Issue Credit Note

```typescript
import { invoiceV2Service } from '@mcv/invoicing/server';
import { creditNoteService } from '@mcv/invoicing/server';

// Scenario: Invoice was paid, but work was not delivered
// Cannot void a paid invoice — must issue credit note instead

try {
  await invoiceV2Service.voidInvoice(ventureId, paidInvoiceId);
} catch (e) {
  // Error: "Cannot void a paid invoice. Create a credit note instead."
}

// Issue full credit
const cn = await creditNoteService.create(ventureId, {
  invoiceId: paidInvoiceId,
  amount: invoiceTotal,
  reason: 'Full refund - services not rendered',
  notes: 'Per client agreement dated 2026-02-01',
}, userId);

await creditNoteService.issue(ventureId, cn.id);

// For unpaid invoices, voiding is straightforward
const voidedInvoice = await invoiceV2Service.voidInvoice(ventureId, unpaidInvoiceId);
console.log(voidedInvoice.status);  // "void"
```

### Example 15: Estimate Duplicate and Bulk Operations

```typescript
import { estimateService } from '@mcv/invoicing/server';
import { invoiceV2Service } from '@mcv/invoicing/server';

// Duplicate a successful estimate as a template for a new client
const original = await estimateService.getById(ventureId, estimateId);
const duplicate = await estimateService.duplicate(ventureId, estimateId, userId);

console.log(duplicate.title);           // "E-Commerce Platform Development (Copy)"
console.log(duplicate.currentVersion);   // 1 (fresh start)
console.log(duplicate.status);           // "draft"

// Similarly, duplicate an invoice
const invoiceDup = await invoiceV2Service.duplicate(ventureId, invoiceId, userId);
console.log(invoiceDup.number);          // New auto-generated number
console.log(invoiceDup.status);          // "draft"
```

---

## Performance Considerations

### Database Indexing Strategy

The module uses 40+ database indexes across its tables. Key performance indexes:

| Index | Purpose | Query Pattern |
|-------|---------|---------------|
| `invoice_v2_status_idx` | Composite (venture_id, status) | Dashboard status counts |
| `invoice_v2_due_date_idx` | Single on due_date | Overdue detection |
| `invoice_v2_number_idx` | Composite (venture_id, number) | Invoice lookup by number |
| `invoice_v2_created_idx` | Single on created_at | Date range queries |
| `recurring_invoice_next_date_idx` | Single on next_date | Cron job processing |
| `engagement_score_entity_idx` | Unique composite | Upsert engagement scores |
| `doc_view_entity_idx` | Composite (entity_type, entity_id) | View history queries |
| `platform_fee_ledger_period_idx` | Composite (venture_id, period) | Revenue reports |

### Monetary Value Storage

All monetary values are stored as **integers in cents** (not floating-point) to prevent rounding errors:

```
$150.00 → 15000 (cents)
$0.99   → 99 (cents)
$1,234.56 → 123456 (cents)
```

This applies to: `subtotal`, `total`, `amountPaid`, `amountDue`, `taxAmount`, `discountAmount`, `unitPrice`, `amount`, `feeAmount`, `transactionAmount`, etc.

### Query Optimization

- **Paginated queries** use `LIMIT/OFFSET` with parallel `COUNT(*)` for total
- **Status counts** use `GROUP BY status` to get all counts in a single query
- **Average days to payment** calculated via PostgreSQL `extract(epoch)` function
- **Invoice totals** calculated in-memory at creation/update time and stored (not computed on read)
- **Engagement scores** use `ON CONFLICT DO UPDATE` (upsert) to avoid race conditions

### Batch Processing

- **Overdue detection** processes all ventures in a single query, then batch-updates via `ANY(ids)` operator
- **Reminder processing** scans invoices once and batches reminder emails
- **Recurring invoice generation** processes all due schedules serially with error isolation

### Recommended Cron Schedule

| Job | Frequency | Method |
|-----|-----------|--------|
| Overdue detection | Every 6 hours | `invoiceV2Service.detectOverdueInvoices()` |
| Reminder processing | Daily at 9 AM | `invoiceV2Service.processReminders()` |
| Recurring invoice generation | Hourly | `recurringInvoiceService.processDueInvoices()` |
| Estimate expiration | Daily at midnight | `estimateService.detectExpired()` |
| Proposal expiration | Daily at midnight | `proposalService.detectExpiredProposals()` |

---

## Security

### Row-Level Security (RLS)

All tables enforce venture-scoped isolation through `ventureId` columns. Every query includes `ventureId` as a required filter:

```typescript
// Every service method requires ventureId as first parameter
async getById(ventureId: string, invoiceId: string) {
  return db.query.invoicesV2.findFirst({
    where: and(
      eq(invoicesV2.id, invoiceId),
      eq(invoicesV2.ventureId, ventureId)  // Always scoped
    ),
  });
}
```

**Cross-venture access is impossible** at the service layer — there is no method to query invoices without a venture scope.

### Financial Data Handling

| Concern | Implementation |
|---------|----------------|
| **Currency precision** | Integer cents storage (no floating-point) |
| **Amount validation** | Credit note amount ≤ invoice total |
| **Status guards** | Only draft invoices can be edited/deleted |
| **Void protection** | Paid invoices cannot be voided (use credit notes) |
| **Payment integrity** | amountDue = total - amountPaid (recalculated on every payment) |
| **Template numbering** | Atomic increment prevents duplicate invoice numbers |
| **Signature tracking** | E-signature URL + IP address stored for legal compliance |

### PCI Compliance Considerations

The accounting module does **not** store or process raw credit card data. Payment processing flows through Stripe:

```
Client → Stripe Payment Link → Stripe processes card → Webhook → Record receipt

Stored in MCV:
✅ Payment receipt (amount, method, reference)
✅ Stripe payment intent ID
✅ Payment link URL
❌ Card numbers
❌ CVV
❌ Card expiry
❌ Bank account numbers
```

For Stripe Connect fee collection, the module stores `stripe_transfer_id` references but never Stripe secret keys (those are in environment variables).

### Approval Security

- Approval workflows enforce step-by-step escalation
- Auto-approve thresholds prevent unnecessary friction for small amounts
- Each decision records the `decidedBy` user ID for audit trail
- Cancelled approvals delete all associated decisions (no orphan data)

### Engagement Tracking Privacy

- Viewer IP addresses and user agents are stored for analytics
- Email-based viewer identification (optional field)
- Location data stored at country/region/city level (no precise coordinates)
- Session IDs enable cross-visit correlation
- All engagement data is venture-scoped

---

## Audit Events

The accounting module generates the following audit events for the platform audit log:

| Event | Trigger | Data Captured |
|-------|---------|---------------|
| `invoice.created` | New invoice created | invoiceId, number, total, contactId |
| `invoice.sent` | Invoice sent to client | invoiceId, sentAt, paymentLink |
| `invoice.viewed` | Client views invoice | invoiceId, viewedAt |
| `invoice.payment_recorded` | Payment received | invoiceId, amount, method, receiptId |
| `invoice.credit_applied` | Credit note applied | invoiceId, creditNoteId, amount |
| `invoice.voided` | Invoice voided | invoiceId, previousStatus |
| `invoice.written_off` | Invoice written off | invoiceId, amountDue |
| `invoice.overdue` | Invoice marked overdue | invoiceId, dueDate, daysPastDue |
| `invoice.reminder_sent` | Reminder email sent | invoiceId, reminderType, dayOffset |
| `estimate.created` | New estimate created | estimateId, number, total |
| `estimate.accepted` | Client accepts estimate | estimateId, signatureUrl, signatureIp |
| `estimate.converted` | Estimate converted to invoice | estimateId, invoiceId, milestonePercent |
| `estimate.version_created` | New estimate version | estimateId, versionNumber, versionNote |
| `proposal.created` | New proposal created | proposalId, title, total |
| `proposal.accepted` | Client accepts proposal | proposalId, signatureUrl, signatureIp |
| `proposal.converted` | Proposal converted to invoice | proposalId, invoiceId |
| `proposal.expired` | Proposal expired | proposalId, validUntil |
| `recurring.created` | Recurring schedule created | recurringId, interval, startDate |
| `recurring.generated` | Invoice generated from recurring | recurringId, invoiceId, totalGenerated |
| `recurring.paused` | Recurring schedule paused | recurringId |
| `recurring.cancelled` | Recurring schedule cancelled | recurringId |
| `credit_note.created` | Credit note created | creditNoteId, invoiceId, amount |
| `credit_note.issued` | Credit note issued | creditNoteId, amount |
| `credit_note.applied` | Credit note applied to invoice | creditNoteId, invoiceId |
| `approval.submitted` | Entity submitted for approval | requestId, entityType, entityId |
| `approval.approved` | Approval granted | requestId, step, decidedBy |
| `approval.rejected` | Approval rejected | requestId, step, decidedBy, reason |
| `approval.auto_approved` | Step auto-approved | requestId, step, reason |
| `platform_fee.configured` | Fee config updated | ventureId, feeType, feePercent |
| `platform_fee.recorded` | Fee recorded in ledger | ventureId, feeAmount, transactionAmount |
| `engagement.first_view` | First document view | entityType, entityId, viewerEmail |
| `engagement.high_engagement` | Engagement score > 80 | entityType, entityId, score |
| `pricing.package_selected` | Client selected a package | configId, packageId |
| `pricing.locked` | Pricing selection locked | configId, grandTotal |

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `STRIPE_SECRET_KEY` | ✅ | — | Stripe API secret key (per venture or platform) |
| `STRIPE_CONNECT_CLIENT_ID` | ⚠️ | — | Stripe Connect OAuth client ID |
| `STRIPE_WEBHOOK_SECRET` | ✅ | — | Stripe webhook signing secret |
| `INVOICE_PAYMENT_BASE_URL` | ❌ | `https://pay.mcv.one` | Base URL for payment links |
| `PDF_SERVICE_URL` | ❌ | — | External PDF rendering service URL |
| `SMTP_HOST` | ❌ | — | SMTP server for invoice/reminder emails |
| `SMTP_PORT` | ❌ | `587` | SMTP port |
| `SMTP_USER` | ❌ | — | SMTP username |
| `SMTP_PASS` | ❌ | — | SMTP password |
| `REMINDER_ENABLED` | ❌ | `true` | Enable/disable reminder processing |
| `RECURRING_INVOICE_ENABLED` | ❌ | `true` | Enable/disable recurring generation |
| `PLATFORM_FEE_ENABLED` | ❌ | `true` | Enable/disable platform fee calculation |
| `ENGAGEMENT_TRACKING_ENABLED` | ❌ | `true` | Enable/disable view tracking |
| `CDN_BASE_URL` | ❌ | — | CDN URL for logos, signatures, cover images |

---

## Error Codes and Resolutions

| Error Code | Message | Cause | Resolution |
|------------|---------|-------|------------|
| `INVOICE_NOT_FOUND` | Invoice not found | Invalid invoiceId or wrong ventureId | Verify invoiceId belongs to the current venture |
| `INVOICE_NOT_DRAFT` | Only draft invoices can be edited | Attempting to edit a sent/paid invoice | Duplicate the invoice and edit the new draft |
| `INVOICE_NOT_DELETABLE` | Only draft invoices can be deleted | Attempting to delete non-draft invoice | Void the invoice instead of deleting |
| `INVOICE_CANNOT_SEND` | Invoice cannot be sent in current status | Sending void/paid invoice | Check invoice status before sending |
| `INVOICE_VOID_PAID` | Cannot void a paid invoice | Attempting to void after payment | Create a credit note instead |
| `INVOICE_PAYMENT_VOID` | Cannot record payment on void/written-off invoice | Payment on closed invoice | Reopen or create new invoice |
| `ESTIMATE_NOT_FOUND` | Estimate not found | Invalid estimateId | Verify estimateId and ventureId |
| `ESTIMATE_NOT_DRAFT` | Only draft estimates can be edited | Editing sent/accepted estimate | Create new version or duplicate |
| `ESTIMATE_CANNOT_ACCEPT` | Estimate cannot be accepted in current status | Accept on draft or declined | Must be in sent or viewed status |
| `ESTIMATE_CONVERSION_INVALID` | Estimate must be accepted/sent/viewed to convert | Converting draft estimate | Send or accept the estimate first |
| `PROPOSAL_NOT_FOUND` | Proposal not found | Invalid proposalId | Verify proposalId and ventureId |
| `PROPOSAL_NOT_DRAFT` | Only draft proposals can be edited | Editing sent proposal | Duplicate and modify |
| `PROPOSAL_EXPIRED` | Proposal has expired | Accepting after validUntil date | Create and send a new proposal |
| `PROPOSAL_ALREADY_CONVERTED` | Proposal already converted to invoice | Re-converting accepted proposal | Use the existing invoice |
| `CREDIT_NOTE_EXCEEDS_TOTAL` | Credit note amount cannot exceed invoice total | Amount > invoice total | Reduce credit note amount |
| `CREDIT_NOTE_NOT_DRAFT` | Credit note not found or not in draft status | Issuing non-draft credit note | Create a new credit note |
| `RECURRING_NOT_FOUND` | Recurring invoice not found | Invalid recurring ID | Verify ID and ventureId |
| `RECURRING_NOT_ACTIVE` | Recurring invoice not found or not active | Pausing non-active schedule | Check current status |
| `RECURRING_NOT_PAUSED` | Recurring invoice not found or not paused | Resuming non-paused schedule | Check current status |
| `APPROVAL_NO_WORKFLOW` | No active approval workflow found | Missing workflow for entity type | Create an approval workflow first |
| `APPROVAL_NO_RULES` | Workflow has no approval rules | Empty rules array | Add rules to the workflow |
| `APPROVAL_NOT_PENDING` | Approval request not found or not pending | Decision on completed request | Check request status |
| `PRICING_CONFIG_NOT_FOUND` | Pricing config not found | Invalid configId | Verify configId and ventureId |
| `PRICING_CONFIG_LOCKED` | Pricing config is locked | Modifying locked selection | Selection has been finalized |
| `PRICING_PACKAGE_NOT_FOUND` | Package not found in config | Invalid packageId | Check available packages |
| `PRICING_ADDON_NOT_FOUND` | Addon not found in config | Invalid addonId | Check available addons |
| `PRICING_QUANTITY_INVALID` | Quantity out of valid range | Quantity outside min/max | Check quantityOverrides constraints |
| `PRICING_QUANTITY_STEP` | Quantity not matching step increment | Quantity doesn't match step | Use valid step increments |
| `DATABASE_UNAVAILABLE` | Database unavailable | DB connection lost | Check DATABASE_URL and connection pool |

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@mcv/db` | workspace | Database client, schema definitions, Drizzle ORM |
| `@mcv/db/schema` | workspace | Invoice, proposal, estimate, engagement table schemas |
| `drizzle-orm` | `^0.35.x` | ORM for PostgreSQL queries and mutations |
| `drizzle-orm/pg-core` | `^0.35.x` | PostgreSQL-specific column types and indexes |
| `stripe` | `^14.x` | Stripe API client for payment links and Connect |
| `@mcv/notifications` | workspace | Email notifications for invoices and reminders (planned) |

### Peer Dependencies

| Package | Purpose |
|---------|---------|
| `@mcv/auth` | User authentication and venture membership validation |
| `@mcv/contacts` | Contact and organization data for invoice recipients |
| `@mcv/payments` | Stripe Connect integration, payment intent handling |

### Optional Dependencies

| Package | Purpose |
|---------|---------|
| `puppeteer` | Server-side PDF generation from HTML |
| `@react-pdf/renderer` | React-based PDF rendering |
| `jspdf` | Client-side PDF generation |
| `qrcode` | QR code generation for payment links |

---

## Relationships to Other Modules

```
┌──────────────────────────────────────────────────────────────────┐
│                        MODULE RELATIONSHIPS                       │
│                                                                   │
│  @mcv/contacts ────────────────▶ contactId / organizationId       │
│  @mcv/auth ────────────────────▶ createdBy / decidedBy            │
│  @mcv/payments ────────────────▶ Stripe payment links & webhooks  │
│  @mcv/notifications ───────────▶ Email delivery (planned)         │
│  @mcv/catalog ─────────────────▶ productId in line items          │
│  @mcv/audit ───────────────────▶ Audit log events                 │
│  @mcv/ventures ────────────────▶ ventureId (tenant isolation)     │
│                                                                   │
│  @mcv/invoicing ◀──────────────  This module IS the source        │
│  @mcv/connectors/accounting ──▶  QuickBooks sync (future)         │
└──────────────────────────────────────────────────────────────────┘
```

---

## Recurring Invoices vs. Stripe Subscriptions

This distinction is critical for understanding when to use each:

| Aspect | Recurring Invoices (`@mcv/invoicing`) | Subscriptions (`@mcv/payments`) |
|--------|---------------------------------------|---------------------------------|
| **Who creates** | MCV platform on schedule | Stripe manages lifecycle |
| **Payment** | Client pays manually via link | Client auto-charged |
| **Billing model** | Invoice-based (net 15/30) | Subscription-based (prepaid) |
| **Use cases** | Retainers, consulting, rent, services | SaaS, memberships, digital goods |
| **Invoicing** | Full branded invoice PDF | Stripe-generated invoice |
| **Customization** | Full template control | Limited to Stripe branding |
| **Credit notes** | Via CreditNoteService | Via Stripe credit notes |
| **Platform fees** | Calculated by PlatformFeeService | Stripe application_fee_amount |
| **Failure handling** | Manual follow-up + reminders | Stripe retry + dunning |

**Rule of thumb:** If the client should be auto-charged → use Subscriptions. If you need to send an invoice and wait for manual payment → use Recurring Invoices.

---

## Migration Notes

### From V1 Invoices

The `invoices_v2` table supersedes the simpler `invoices` table in `@mcv/payments`. Key differences:

| Feature | V1 (payments.invoices) | V2 (invoicing.invoices_v2) |
|---------|----------------------|---------------------------|
| Line items | Simple JSON | Structured with tax/discount per line |
| Templates | None | Full branded templates |
| Reminders | None | Configurable multi-stage |
| Credit notes | None | Full credit note system |
| Approval | None | Multi-step workflows |
| Engagement | None | View tracking + scoring |
| Status flow | Basic | 8-state lifecycle |
| PDF generation | None | HTML/PDF with branding |

---

*@mcv/connectors/accounting — Accounting & Financial Operations Module*
