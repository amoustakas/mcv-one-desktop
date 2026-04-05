# @mcv/commerce/invoicing

> **Tier 5 Domain Module** · Commerce · Invoicing  
> **Classification:** Publishable  
> **Bundle:** `@mcv/commerce/invoicing`  
> **Since:** 0.1.0  
> **Status:** Production  
> **Maintainer:** MCV Commerce Team

---

## Purpose

The Invoicing module is the financial document backbone of the MCV.ONE commerce platform, responsible for generating, managing, tracking, and delivering invoices across every venture and billing context in the ecosystem. Whether a customer completes a one-time purchase, subscribes to a recurring service, or receives a complex multi-line enterprise quote, this module produces the corresponding financial documents — from initial draft through finalization, delivery, payment reconciliation, and eventual archival. It integrates tightly with the Orders, Subscriptions, Payments, and Tax modules to ensure that every monetary transaction has a compliant, auditable paper trail.

Beyond simple document generation, the module provides a complete invoicing lifecycle engine. Invoices progress through well-defined states (draft → sent → viewed → partially_paid → paid → void), with each transition triggering configurable side effects: email delivery via Resend, payment link generation, reminder scheduling, webhook notifications, and ledger postings. Credit notes, partial payments, payment plans, and multi-currency support ensure that real-world billing complexity — refunds, disputes, installment agreements, cross-border transactions — is handled natively rather than as an afterthought. Recurring invoice schedules align with subscription billing cycles, automatically generating and sending invoices on cadence with proper pro-ration for partial periods.

The module also provides the operational tooling that finance teams need to manage accounts receivable effectively. Aging reports with configurable bucket boundaries (30/60/90/120 days) surface overdue invoices and score collection priority. Venture-branded PDF generation via Puppeteer produces professional documents with digital signatures and PDF/A archival compliance. Configurable numbering sequences ensure gap-free, fiscally compliant invoice numbers per venture and fiscal year. Every operation respects multi-tenant row-level security, ensuring that venture data remains strictly isolated while platform administrators retain cross-venture visibility for consolidated reporting.

---

## Exports

```typescript
// @mcv/commerce/invoicing — public export map

// ─── Core Service ───────────────────────────────────────────────
export { InvoiceService }              from './services/invoice.service';
export { CreditNoteService }           from './services/credit-note.service';
export { RecurringInvoiceService }     from './services/recurring-invoice.service';
export { InvoiceDeliveryService }      from './services/invoice-delivery.service';
export { InvoicePdfService }           from './services/invoice-pdf.service';
export { AgingReportService }          from './services/aging-report.service';
export { NumberingSequenceService }    from './services/numbering-sequence.service';
export { InvoiceTemplateService }      from './services/invoice-template.service';
export { PaymentReconciliationService } from './services/payment-reconciliation.service';
export { InvoiceReminderService }      from './services/invoice-reminder.service';

// ─── tRPC Router ────────────────────────────────────────────────
export { invoiceRouter }               from './trpc/invoice.router';
export { creditNoteRouter }            from './trpc/credit-note.router';
export { recurringInvoiceRouter }      from './trpc/recurring-invoice.router';
export { invoiceTemplateRouter }       from './trpc/invoice-template.router';
export { agingReportRouter }           from './trpc/aging-report.router';
export { numberingSequenceRouter }     from './trpc/numbering-sequence.router';
export { invoiceDeliveryRouter }       from './trpc/invoice-delivery.router';

// ─── Domain Types ───────────────────────────────────────────────
export type { Invoice }                from './types/invoice';
export type { InvoiceLineItem }        from './types/invoice-line-item';
export type { InvoicePayment }         from './types/invoice-payment';
export type { InvoiceTemplate }        from './types/invoice-template';
export type { InvoiceDelivery }        from './types/invoice-delivery';
export type { CreditNote }             from './types/credit-note';
export type { CreditNoteApplication }  from './types/credit-note-application';
export type { RecurringInvoiceSchedule } from './types/recurring-invoice-schedule';
export type { AgingReport }            from './types/aging-report';
export type { AgingBucket }            from './types/aging-bucket';
export type { NumberingSequence }      from './types/numbering-sequence';
export type { InvoiceReminder }        from './types/invoice-reminder';
export type { AgingSnapshot }          from './types/aging-snapshot';

// ─── Enums ──────────────────────────────────────────────────────
export { InvoiceStatus }               from './types/enums';
export { InvoiceType }                 from './types/enums';
export { CreditNoteReason }            from './types/enums';
export { DeliveryChannel }             from './types/enums';
export { DeliveryStatus }              from './types/enums';
export { ReminderType }                from './types/enums';
export { RecurrenceFrequency }         from './types/enums';
export { NumberingResetPolicy }        from './types/enums';
export { TaxBehavior }                 from './types/enums';
export { PaymentReconciliationStatus } from './types/enums';

// ─── Schemas (Drizzle) ─────────────────────────────────────────
export { invoices }                    from './db/schema/invoices';
export { invoiceLineItems }           from './db/schema/invoice-line-items';
export { invoicePayments }            from './db/schema/invoice-payments';
export { creditNotes }                from './db/schema/credit-notes';
export { creditNoteApplications }     from './db/schema/credit-note-applications';
export { recurringInvoiceSchedules }  from './db/schema/recurring-invoice-schedules';
export { invoiceTemplates }           from './db/schema/invoice-templates';
export { invoiceDeliveries }          from './db/schema/invoice-deliveries';
export { numberingSequences }         from './db/schema/numbering-sequences';
export { invoiceReminders }           from './db/schema/invoice-reminders';
export { agingSnapshots }             from './db/schema/aging-snapshots';

// ─── Validation (Zod) ──────────────────────────────────────────
export { CreateInvoiceSchema }         from './validation/invoice.schemas';
export { UpdateInvoiceSchema }         from './validation/invoice.schemas';
export { FinalizeInvoiceSchema }       from './validation/invoice.schemas';
export { CreateLineItemSchema }        from './validation/line-item.schemas';
export { CreateCreditNoteSchema }      from './validation/credit-note.schemas';
export { ApplyCreditNoteSchema }       from './validation/credit-note.schemas';
export { CreateRecurringScheduleSchema } from './validation/recurring.schemas';
export { CreateTemplateSchema }        from './validation/template.schemas';
export { GenerateAgingReportSchema }   from './validation/aging.schemas';
export { ConfigureNumberingSchema }    from './validation/numbering.schemas';
export { RecordPaymentSchema }         from './validation/payment.schemas';
export { ReconcilePaymentSchema }      from './validation/payment.schemas';

// ─── Events ─────────────────────────────────────────────────────
export { InvoiceCreatedEvent }         from './events/invoice.events';
export { InvoiceFinalizedEvent }       from './events/invoice.events';
export { InvoiceSentEvent }            from './events/invoice.events';
export { InvoiceViewedEvent }          from './events/invoice.events';
export { InvoicePaidEvent }            from './events/invoice.events';
export { InvoicePartiallyPaidEvent }   from './events/invoice.events';
export { InvoiceOverdueEvent }         from './events/invoice.events';
export { InvoiceVoidedEvent }          from './events/invoice.events';
export { CreditNoteIssuedEvent }       from './events/credit-note.events';
export { CreditNoteAppliedEvent }      from './events/credit-note.events';
export { PaymentReconciledEvent }      from './events/payment.events';
export { RecurringInvoiceGeneratedEvent } from './events/recurring.events';
export { ReminderSentEvent }           from './events/reminder.events';

// ─── Utilities ──────────────────────────────────────────────────
export { calculateInvoiceTotals }      from './utils/calculations';
export { formatInvoiceNumber }         from './utils/numbering';
export { generatePaymentLink }         from './utils/payment-links';
export { computeAgingBuckets }         from './utils/aging';
export { convertInvoiceCurrency }      from './utils/currency';
export { renderInvoiceHtml }           from './utils/template-renderer';
export { validateTaxCompliance }       from './utils/tax-validation';
export { hashInvoiceContent }          from './utils/integrity';

// ─── Constants ──────────────────────────────────────────────────
export { INVOICE_DEFAULTS }            from './constants';
export { AGING_BUCKET_BOUNDARIES }     from './constants';
export { MAX_LINE_ITEMS_PER_INVOICE }  from './constants';
export { REMINDER_CADENCE_DEFAULTS }   from './constants';
export { PDF_GENERATION_TIMEOUT_MS }   from './constants';
export { SUPPORTED_INVOICE_CURRENCIES } from './constants';
```

---

## Architecture

### Invoice Lifecycle State Machine

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      INVOICE LIFECYCLE                                   │
│                                                                         │
│  ┌───────┐    finalize()    ┌──────┐    deliver()    ┌──────┐          │
│  │ DRAFT │ ───────────────► │ SENT │ ───────────────► │VIEWED│          │
│  └───┬───┘                  └──┬───┘                  └──┬───┘          │
│      │                         │                         │               │
│      │  void()                 │  void()                 │  void()       │
│      ▼                         ▼                         ▼               │
│  ┌───────┐              ┌──────────┐              ┌──────────┐          │
│  │ VOID  │              │  VOID    │              │  VOID    │          │
│  └───────┘              └──────────┘              └──────────┘          │
│                                                        │                │
│                              recordPayment()           │                │
│                              (partial)                 │                │
│                                    ┌───────────────────┘                │
│                                    ▼                                    │
│                           ┌────────────────┐                            │
│                           │ PARTIALLY_PAID │──┐                         │
│                           └───────┬────────┘  │                         │
│                                   │           │ recordPayment()         │
│                  recordPayment()  │           │ (partial)               │
│                  (remaining)      │           └──────┐                  │
│                                   ▼                  │                  │
│                              ┌─────────┐             │                  │
│                              │  PAID   │◄────────────┘                  │
│                              └────┬────┘                                │
│                                   │                                     │
│                    issueCreditNote()                                     │
│                                   ▼                                     │
│                           ┌──────────────┐                              │
│                           │ CREDIT_NOTED │                              │
│                           └──────────────┘                              │
│                                                                         │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                                                                         │
│  Side Effects on Transition:                                            │
│                                                                         │
│  DRAFT→SENT:     Assign invoice number, lock line items, compute        │
│                  totals, generate PDF, send email, schedule reminders    │
│                                                                         │
│  SENT→VIEWED:    Record view timestamp, notify venture owner            │
│                                                                         │
│  *→PAID:         Mark fully paid, cancel pending reminders, post to     │
│                  ledger, send payment confirmation email                 │
│                                                                         │
│  *→VOID:         Cancel reminders, reverse ledger entries if any,       │
│                  mark PDF as voided, notify customer                     │
│                                                                         │
│  PAID→CREDIT:    Generate credit note PDF, adjust ledger, track         │
│                  credit balance for future application                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Invoice Creation Pipeline

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                     INVOICE CREATION PIPELINE                                │
│                                                                              │
│  ┌─────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐  │
│  │   Trigger    │   │  Line Item   │   │     Tax      │   │   Totals     │  │
│  │  Sources     │──►│  Assembly    │──►│  Calculation │──►│  Computation │  │
│  └─────────────┘   └──────────────┘   └──────────────┘   └──────────────┘  │
│        │                                                        │            │
│        │                                                        ▼            │
│  ┌─────┴──────┐                                          ┌──────────────┐   │
│  │ • Manual   │                                          │   Invoice    │   │
│  │ • Order    │                                          │   Record     │   │
│  │ • Sub-     │                                          │   (DRAFT)    │   │
│  │   scription│                                          └──────┬───────┘   │
│  │ • Recurring│                                                 │            │
│  │   Schedule │                                                 │            │
│  └────────────┘                                                 │            │
│                                                                 │ finalize() │
│                                                                 ▼            │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │                      FINALIZATION PIPELINE                           │    │
│  │                                                                      │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────┐ │    │
│  │  │ Assign   │  │  Lock    │  │ Generate │  │ Generate │  │ Send │ │    │
│  │  │ Number   │─►│  Totals  │─►│   PDF    │─►│ Payment  │─►│Email │ │    │
│  │  │          │  │ + Hash   │  │          │  │  Link    │  │      │ │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────┘ │    │
│  │       │                            │                          │      │    │
│  │       ▼                            ▼                          ▼      │    │
│  │  numbering_       Puppeteer     Resend                              │    │
│  │  sequences        headless      transactional                       │    │
│  │  (gap-free)       Chrome        email                               │    │
│  │                   PDF/A                                             │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### PDF Generation Pipeline

```
┌──────────────────────────────────────────────────────────────────────┐
│                   PDF GENERATION PIPELINE                            │
│                                                                      │
│  ┌────────────┐    ┌────────────────┐    ┌───────────────────────┐  │
│  │  Invoice   │    │    Template    │    │    HTML Renderer      │  │
│  │  Data      │───►│    Engine      │───►│                       │  │
│  │            │    │                │    │  • Handlebars compile │  │
│  │ • header   │    │ • Load venture │    │  • i18n interpolation │  │
│  │ • lines    │    │   template     │    │  • QR code embed     │  │
│  │ • totals   │    │ • Merge brand  │    │  • Barcode generation│  │
│  │ • tax      │    │   colors/logo  │    │  • Payment link embed│  │
│  │ • customer │    │ • Select locale│    │                       │  │
│  │ • venture  │    │                │    └───────────┬───────────┘  │
│  └────────────┘    └────────────────┘                │              │
│                                                      ▼              │
│                                           ┌──────────────────────┐  │
│                                           │  Puppeteer Renderer  │  │
│                                           │                      │  │
│                                           │  • Launch headless   │  │
│                                           │    Chrome            │  │
│                                           │  • Set viewport      │  │
│                                           │    (A4/Letter)       │  │
│                                           │  • Render HTML       │  │
│                                           │  • Generate PDF      │  │
│                                           │  • PDF/A conversion  │  │
│                                           └──────────┬───────────┘  │
│                                                      │              │
│                                                      ▼              │
│                                           ┌──────────────────────┐  │
│                                           │  Post-Processing     │  │
│                                           │                      │  │
│                                           │  • Digital signature │  │
│                                           │    (PKCS#7)          │  │
│                                           │  • Content hash      │  │
│                                           │  • Upload to storage │  │
│                                           │  • Cache PDF URL     │  │
│                                           └──────────────────────┘  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Payment Reconciliation Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                  PAYMENT RECONCILIATION FLOW                             │
│                                                                          │
│  ┌──────────────┐    ┌──────────────────┐    ┌──────────────────────┐   │
│  │   Incoming   │    │    Matching       │    │    Application       │   │
│  │   Payment    │───►│    Engine         │───►│    Engine            │   │
│  │              │    │                   │    │                      │   │
│  │ • Stripe     │    │ • Invoice number  │    │ • Full payment       │   │
│  │   webhook    │    │ • Amount match    │    │ • Partial payment    │   │
│  │ • Bank       │    │ • Customer match  │    │ • Overpayment        │   │
│  │   transfer   │    │ • Reference match │    │   (→ credit balance) │   │
│  │ • Manual     │    │ • Fuzzy match     │    │ • Multi-invoice      │   │
│  │   entry      │    │   (configurable)  │    │   allocation         │   │
│  └──────────────┘    └──────────────────┘    └──────────┬───────────┘   │
│                                                          │               │
│                                                          ▼               │
│                                              ┌──────────────────────┐    │
│                                              │  State Transition    │    │
│                                              │                      │    │
│                                              │ • Update invoice     │    │
│                                              │   status             │    │
│                                              │ • Record payment     │    │
│                                              │   line               │    │
│                                              │ • Cancel reminders   │    │
│                                              │   (if fully paid)    │    │
│                                              │ • Post ledger entry  │    │
│                                              │ • Send confirmation  │    │
│                                              └──────────────────────┘    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Aging Report Pipeline

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     AGING REPORT PIPELINE                                │
│                                                                          │
│  ┌──────────────┐    ┌──────────────────┐    ┌──────────────────────┐   │
│  │   Invoice    │    │    Bucket        │    │    Scoring           │   │
│  │   Query      │───►│    Assignment    │───►│    Engine            │   │
│  │              │    │                  │    │                      │   │
│  │ • Status:    │    │ • Current (0-30) │    │ • Days overdue       │   │
│  │   sent,      │    │ • 31-60 days     │    │ • Amount outstanding │   │
│  │   viewed,    │    │ • 61-90 days     │    │ • Customer history   │   │
│  │   partially  │    │ • 91-120 days    │    │ • Payment pattern    │   │
│  │   _paid,     │    │ • 120+ days      │    │ • Credit risk score  │   │
│  │   overdue    │    │                  │    │                      │   │
│  └──────────────┘    └──────────────────┘    └──────────┬───────────┘   │
│                                                          │               │
│                                                          ▼               │
│  ┌───────────────────────────────────────────────────────────────────┐   │
│  │                      AGING REPORT OUTPUT                          │   │
│  │                                                                   │   │
│  │  Customer       Current    31-60    61-90   91-120   120+  Total  │   │
│  │  ──────────     ───────    ─────    ─────   ──────   ────  ─────  │   │
│  │  Acme Corp      $5,000   $2,000   $1,000       $0     $0  $8,000 │   │
│  │  Beta LLC            $0  $3,500        $0   $1,200    $0  $4,700 │   │
│  │  Gamma Inc       $1,200       $0       $0       $0  $800  $2,000 │   │
│  │  ──────────     ───────    ─────    ─────   ──────   ────  ─────  │   │
│  │  TOTALS          $6,200   $5,500   $1,000   $1,200  $800 $14,700 │   │
│  │                                                                   │   │
│  │  Collection Priority: Gamma Inc (120+ days) → Beta LLC (91-120)  │   │
│  └───────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Core Interfaces

### Invoice

```typescript
/**
 * Represents a complete invoice document within the MCV invoicing system.
 * Invoices are the primary financial document, tracking amounts owed by
 * customers for goods and services rendered by MCV ventures.
 */
interface Invoice {
  /** Unique invoice identifier (UUID v7) */
  id: string;

  /** Venture that owns this invoice */
  ventureId: string;

  /** Organization/tenant context for RLS */
  organizationId: string;

  /** Customer being invoiced */
  customerId: string;

  /** Human-readable invoice number (e.g., "INV-2026-00042") */
  invoiceNumber: string | null;

  /** Invoice type classification */
  type: InvoiceType;

  /** Current lifecycle status */
  status: InvoiceStatus;

  /**
   * ISO 4217 currency code for the invoice.
   * All monetary amounts on this invoice are in this currency.
   */
  currency: string;

  /**
   * If the invoice currency differs from the venture's base currency,
   * this records the FX rate locked at finalization time.
   */
  fxRateToBase: number | null;

  /** Venture's base currency for dual-display */
  baseCurrency: string | null;

  /** Issue date (set on finalization) */
  issueDate: Date | null;

  /** Payment due date */
  dueDate: Date;

  /** Date the invoice was fully paid */
  paidDate: Date | null;

  /** Date the invoice was voided, if applicable */
  voidedDate: Date | null;

  /** Reason for voiding */
  voidReason: string | null;

  // ─── Amounts (all in invoice currency) ──────────────────────

  /** Sum of all line item amounts before tax and discount */
  subtotal: number;

  /** Total discount applied across all line items */
  discountTotal: number;

  /** Total tax amount */
  taxTotal: number;

  /** Grand total: subtotal - discountTotal + taxTotal */
  total: number;

  /** Amount paid so far */
  amountPaid: number;

  /** Amount remaining: total - amountPaid */
  amountDue: number;

  /** Amount credited via credit notes */
  amountCredited: number;

  // ─── Tax Behavior ───────────────────────────────────────────

  /** Whether prices on this invoice include or exclude tax */
  taxBehavior: TaxBehavior;

  /** Whether EU reverse charge applies */
  reverseCharge: boolean;

  /** Tax exemption reason if exempt */
  taxExemptionReason: string | null;

  /** Withholding tax rate (percentage, e.g., 0.15 for 15%) */
  withholdingTaxRate: number | null;

  /** Computed withholding tax amount */
  withholdingTaxAmount: number | null;

  // ─── References ─────────────────────────────────────────────

  /** Order that triggered this invoice, if any */
  orderId: string | null;

  /** Subscription that triggered this invoice, if any */
  subscriptionId: string | null;

  /** Recurring schedule that generated this invoice, if any */
  recurringScheduleId: string | null;

  /** Purchase order number provided by customer */
  purchaseOrderNumber: string | null;

  // ─── Content ────────────────────────────────────────────────

  /** Optional memo / notes visible to customer */
  memo: string | null;

  /** Internal notes (not visible to customer) */
  internalNotes: string | null;

  /** Terms and conditions text */
  terms: string | null;

  /** Footer text */
  footer: string | null;

  /** Custom metadata (JSON) */
  metadata: Record<string, unknown>;

  // ─── PDF & Delivery ─────────────────────────────────────────

  /** URL to the generated PDF in storage */
  pdfUrl: string | null;

  /** SHA-256 hash of the PDF for integrity verification */
  pdfHash: string | null;

  /** Content hash for tamper detection */
  contentHash: string | null;

  /** Template used for PDF generation */
  templateId: string | null;

  /** Locale used for rendering (e.g., "en-US", "fr-CA") */
  locale: string;

  /** Payment link for online payment */
  paymentLink: string | null;

  /** Payment link expiration */
  paymentLinkExpiresAt: Date | null;

  // ─── Billing Address ────────────────────────────────────────

  /** Snapshot of customer billing address at invoice time */
  billingAddress: {
    name: string;
    company: string | null;
    line1: string;
    line2: string | null;
    city: string;
    state: string | null;
    postalCode: string;
    country: string;
    taxId: string | null;
    taxIdType: string | null;
  };

  // ─── Relations (populated on query) ─────────────────────────

  /** Line items on this invoice */
  lineItems?: InvoiceLineItem[];

  /** Payments recorded against this invoice */
  payments?: InvoicePayment[];

  /** Delivery records (emails sent, etc.) */
  deliveries?: InvoiceDelivery[];

  /** Credit notes applied to this invoice */
  creditNotes?: CreditNote[];

  /** Reminder records */
  reminders?: InvoiceReminder[];

  // ─── Timestamps ─────────────────────────────────────────────

  createdAt: Date;
  updatedAt: Date;
  finalizedAt: Date | null;
  firstViewedAt: Date | null;
}
```

### InvoiceLineItem

```typescript
/**
 * A single line item on an invoice, representing a product, service,
 * or charge. Each line item independently tracks quantity, pricing,
 * discounts, and tax.
 */
interface InvoiceLineItem {
  /** Unique line item identifier (UUID v7) */
  id: string;

  /** Parent invoice */
  invoiceId: string;

  /** Venture context (for RLS) */
  ventureId: string;

  /** Display order position (1-based) */
  position: number;

  /** Line item description */
  description: string;

  /** Extended description / details */
  details: string | null;

  /** Quantity (supports fractional for hourly billing, etc.) */
  quantity: number;

  /** Unit of measurement (e.g., "hours", "units", "licenses") */
  unit: string | null;

  /** Price per unit in invoice currency */
  unitPrice: number;

  /** Gross amount before discount: quantity × unitPrice */
  grossAmount: number;

  /** Discount percentage (0-100) */
  discountPercent: number | null;

  /** Discount fixed amount (alternative to percentage) */
  discountAmount: number | null;

  /** Net amount after discount */
  netAmount: number;

  /** Tax rate applied to this line (percentage, e.g., 0.13 for 13%) */
  taxRate: number;

  /** Tax rate label (e.g., "HST 13%", "VAT 20%") */
  taxRateLabel: string | null;

  /** Tax amount for this line */
  taxAmount: number;

  /** Total for this line: netAmount + taxAmount */
  totalAmount: number;

  // ─── References ─────────────────────────────────────────────

  /** Product/SKU reference, if linked to a catalog item */
  productId: string | null;

  /** Price/plan reference, if linked to a pricing entry */
  priceId: string | null;

  /** Subscription item reference, if from a subscription */
  subscriptionItemId: string | null;

  /** Order line item reference, if from an order */
  orderLineItemId: string | null;

  /** Billing period start (for subscription line items) */
  periodStart: Date | null;

  /** Billing period end (for subscription line items) */
  periodEnd: Date | null;

  /** Whether this line item was pro-rated */
  prorated: boolean;

  /** Custom metadata */
  metadata: Record<string, unknown>;

  createdAt: Date;
  updatedAt: Date;
}
```

### InvoiceTemplate

```typescript
/**
 * Defines a reusable invoice template for PDF rendering.
 * Each venture can have multiple templates for different
 * use cases (standard, pro-forma, quote, receipt).
 */
interface InvoiceTemplate {
  /** Unique template identifier */
  id: string;

  /** Venture that owns this template */
  ventureId: string;

  /** Template name for identification */
  name: string;

  /** Whether this is the default template for the venture */
  isDefault: boolean;

  /** Template description */
  description: string | null;

  /** Handlebars HTML template body */
  htmlTemplate: string;

  /** CSS styles for the template */
  cssStyles: string;

  /** Header HTML (rendered on every page) */
  headerHtml: string | null;

  /** Footer HTML (rendered on every page) */
  footerHtml: string | null;

  // ─── Branding ───────────────────────────────────────────────

  /** Venture logo URL */
  logoUrl: string | null;

  /** Logo dimensions */
  logoWidth: number | null;
  logoHeight: number | null;

  /** Primary brand color (hex) */
  primaryColor: string;

  /** Secondary brand color (hex) */
  secondaryColor: string;

  /** Accent color (hex) */
  accentColor: string;

  /** Font family for headings */
  headingFont: string;

  /** Font family for body text */
  bodyFont: string;

  // ─── Layout ─────────────────────────────────────────────────

  /** Paper size: "A4" | "Letter" | "Legal" */
  paperSize: 'A4' | 'Letter' | 'Legal';

  /** Page orientation */
  orientation: 'portrait' | 'landscape';

  /** Margins in mm */
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };

  /** Whether to show page numbers */
  showPageNumbers: boolean;

  /** Whether to show the payment link QR code */
  showPaymentQr: boolean;

  /** Whether to show the venture's bank details */
  showBankDetails: boolean;

  /** Whether to show tax breakdown per line */
  showLineTax: boolean;

  // ─── Localization ───────────────────────────────────────────

  /** Default locale for this template */
  defaultLocale: string;

  /** Available locales */
  supportedLocales: string[];

  /** Localized label overrides (e.g., "Invoice" → "Facture") */
  labelOverrides: Record<string, Record<string, string>>;

  /** Date format pattern per locale */
  dateFormat: Record<string, string>;

  /** Number format locale */
  numberFormatLocale: string;

  // ─── Custom Sections ────────────────────────────────────────

  /** Additional sections to render (key → HTML) */
  customSections: Array<{
    key: string;
    label: string;
    position: 'before_lines' | 'after_lines' | 'after_totals' | 'before_footer';
    htmlTemplate: string;
    enabled: boolean;
  }>;

  createdAt: Date;
  updatedAt: Date;
}
```

### CreditNote

```typescript
/**
 * A credit note issued against a paid invoice, representing
 * a partial or full refund/credit. Credit notes create a
 * credit balance that can be applied to future invoices.
 */
interface CreditNote {
  /** Unique credit note identifier */
  id: string;

  /** Venture context */
  ventureId: string;

  /** Organization context (RLS) */
  organizationId: string;

  /** Customer receiving the credit */
  customerId: string;

  /** Human-readable credit note number (e.g., "CN-2026-00012") */
  creditNoteNumber: string;

  /** Original invoice this credit note is against */
  invoiceId: string;

  /** Reason for the credit note */
  reason: CreditNoteReason;

  /** Detailed description of why credit was issued */
  description: string | null;

  /** Credit note status */
  status: 'draft' | 'issued' | 'applied' | 'partially_applied' | 'void';

  /** Currency (must match original invoice) */
  currency: string;

  /** Total credit amount */
  total: number;

  /** Amount already applied to invoices */
  amountApplied: number;

  /** Remaining credit balance */
  amountRemaining: number;

  /** Line items on the credit note */
  lineItems: CreditNoteLineItem[];

  /** Applications of this credit note to invoices */
  applications?: CreditNoteApplication[];

  /** Issue date */
  issueDate: Date;

  /** PDF URL */
  pdfUrl: string | null;

  /** PDF content hash */
  pdfHash: string | null;

  /** Internal notes */
  internalNotes: string | null;

  metadata: Record<string, unknown>;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Tracks the application of a credit note balance to an invoice.
 * A single credit note can be applied across multiple invoices.
 */
interface CreditNoteApplication {
  id: string;
  creditNoteId: string;
  invoiceId: string;
  ventureId: string;
  amount: number;
  appliedAt: Date;
  appliedBy: string;
  notes: string | null;
  createdAt: Date;
}

interface CreditNoteLineItem {
  id: string;
  creditNoteId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  /** Reference to the original invoice line item */
  originalLineItemId: string | null;
}
```

### RecurringInvoiceSchedule

```typescript
/**
 * Defines a recurring invoice schedule that automatically generates
 * invoices at specified intervals. Typically aligned with subscription
 * billing cycles but can also be used for standalone recurring charges.
 */
interface RecurringInvoiceSchedule {
  /** Unique schedule identifier */
  id: string;

  /** Venture context */
  ventureId: string;

  /** Organization context (RLS) */
  organizationId: string;

  /** Customer to invoice */
  customerId: string;

  /** Schedule name for identification */
  name: string;

  /** Whether the schedule is currently active */
  active: boolean;

  /** Recurrence frequency */
  frequency: RecurrenceFrequency;

  /** Interval multiplier (e.g., 2 + "month" = every 2 months) */
  intervalCount: number;

  /** Day of month to generate (1-28, null for frequency-based) */
  dayOfMonth: number | null;

  /** Day of week for weekly schedules (0=Sun, 6=Sat) */
  dayOfWeek: number | null;

  /** Anchor date for schedule calculation */
  anchorDate: Date;

  /** When to generate next invoice */
  nextGenerationDate: Date;

  /** Schedule start date */
  startDate: Date;

  /** Schedule end date (null = indefinite) */
  endDate: Date | null;

  /** Total number of invoices to generate (null = unlimited) */
  maxOccurrences: number | null;

  /** Number of invoices generated so far */
  occurrenceCount: number;

  /** Currency for generated invoices */
  currency: string;

  /** Template to use for generated invoices */
  templateId: string | null;

  /** Linked subscription, if any */
  subscriptionId: string | null;

  /** Whether to auto-send on generation (vs. create as draft) */
  autoSend: boolean;

  /** Number of days after generation to set as due date */
  paymentTermDays: number;

  /** Whether to pro-rate the first invoice */
  prorateFirst: boolean;

  /** Whether to pro-rate the last invoice */
  prorateLast: boolean;

  /** Memo to include on generated invoices */
  memo: string | null;

  /** Line item templates for generation */
  lineItemTemplates: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    unit: string | null;
    taxRate: number;
    productId: string | null;
    priceId: string | null;
  }>;

  /** ID of the last invoice generated by this schedule */
  lastInvoiceId: string | null;

  /** Timestamp of last generation */
  lastGeneratedAt: Date | null;

  /** If generation failed, the error message */
  lastError: string | null;

  metadata: Record<string, unknown>;

  createdAt: Date;
  updatedAt: Date;
  pausedAt: Date | null;
}
```

### AgingReport

```typescript
/**
 * Represents a point-in-time aging report showing outstanding
 * invoice balances grouped by age buckets.
 */
interface AgingReport {
  /** Report identifier */
  id: string;

  /** Venture context */
  ventureId: string;

  /** Report generation timestamp */
  generatedAt: Date;

  /** Currency for all amounts */
  currency: string;

  /** As-of date for the report */
  asOfDate: Date;

  /** Bucket boundary configuration (days) */
  bucketBoundaries: number[];

  /** Summary totals per bucket */
  summary: {
    current: number;
    bucket1: number;    // e.g., 31-60
    bucket2: number;    // e.g., 61-90
    bucket3: number;    // e.g., 91-120
    bucket4Plus: number; // e.g., 120+
    total: number;
    invoiceCount: number;
    customerCount: number;
  };

  /** Per-customer breakdown */
  customers: AgingCustomerEntry[];

  /** Per-invoice detail */
  invoices: AgingInvoiceEntry[];

  /** Collection priority ranking */
  collectionPriorities: CollectionPriorityEntry[];
}

interface AgingBucket {
  /** Bucket label (e.g., "31-60 days") */
  label: string;

  /** Lower bound in days (inclusive) */
  minDays: number;

  /** Upper bound in days (exclusive, null = unbounded) */
  maxDays: number | null;

  /** Total amount in this bucket */
  amount: number;

  /** Number of invoices in this bucket */
  invoiceCount: number;

  /** Percentage of total outstanding */
  percentOfTotal: number;
}

interface AgingCustomerEntry {
  customerId: string;
  customerName: string;
  buckets: Record<string, number>;
  total: number;
  invoiceCount: number;
  oldestInvoiceDate: Date;
  averageDaysOutstanding: number;
  collectionScore: number;
}

interface AgingInvoiceEntry {
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  issueDate: Date;
  dueDate: Date;
  daysOutstanding: number;
  amountDue: number;
  bucket: string;
}

interface CollectionPriorityEntry {
  customerId: string;
  customerName: string;
  score: number;
  totalOverdue: number;
  oldestOverdueDays: number;
  recommendedAction: 'reminder' | 'escalation' | 'collection_agency' | 'write_off';
  invoiceIds: string[];
}
```

### InvoiceDelivery

```typescript
/**
 * Tracks the delivery of an invoice to a customer via
 * various channels (email, SMS, webhook, etc.).
 */
interface InvoiceDelivery {
  /** Unique delivery record identifier */
  id: string;

  /** Invoice being delivered */
  invoiceId: string;

  /** Venture context */
  ventureId: string;

  /** Delivery channel */
  channel: DeliveryChannel;

  /** Delivery status */
  status: DeliveryStatus;

  /** Recipient address (email, phone, URL) */
  recipient: string;

  /** Subject line (for email) */
  subject: string | null;

  /** Email body or message content */
  body: string | null;

  /** Whether the PDF was attached */
  pdfAttached: boolean;

  /** External delivery ID (e.g., Resend message ID) */
  externalId: string | null;

  /** Error message if delivery failed */
  errorMessage: string | null;

  /** Number of retry attempts */
  retryCount: number;

  /** Timestamps */
  sentAt: Date | null;
  deliveredAt: Date | null;
  openedAt: Date | null;
  bouncedAt: Date | null;
  failedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}
```

### NumberingSequence

```typescript
/**
 * Configures invoice/credit note numbering for a venture.
 * Supports gap-free sequences with configurable formatting,
 * fiscal year resets, and prefix/suffix rules.
 */
interface NumberingSequence {
  /** Unique sequence identifier */
  id: string;

  /** Venture this sequence belongs to */
  ventureId: string;

  /** Sequence type: which document this numbers */
  documentType: 'invoice' | 'credit_note' | 'pro_forma' | 'quote';

  /** Sequence name */
  name: string;

  /** Whether this is the active sequence for the document type */
  active: boolean;

  /** Current counter value */
  currentValue: number;

  /** Counter increment step (usually 1) */
  step: number;

  /** Minimum digits for zero-padding (e.g., 5 → 00042) */
  minDigits: number;

  /** Prefix pattern (supports variables: {YEAR}, {MONTH}, {VENTURE}) */
  prefix: string;

  /** Suffix pattern */
  suffix: string;

  /** Separator between prefix, number, and suffix */
  separator: string;

  /** Reset policy */
  resetPolicy: NumberingResetPolicy;

  /** Fiscal year start month (1-12) for yearly reset */
  fiscalYearStartMonth: number;

  /** Last reset date */
  lastResetAt: Date | null;

  /** Whether to enforce gap-free numbering (uses advisory locks) */
  gapFree: boolean;

  /**
   * Preview of next number to be generated.
   * Example: "INV-2026-00043"
   */
  nextPreview: string;

  createdAt: Date;
  updatedAt: Date;
}
```

### InvoiceReminder

```typescript
/**
 * Tracks scheduled and sent payment reminders for invoices.
 * Reminders follow a configurable cadence and can be
 * customized per venture.
 */
interface InvoiceReminder {
  /** Unique reminder identifier */
  id: string;

  /** Invoice this reminder is for */
  invoiceId: string;

  /** Venture context */
  ventureId: string;

  /** Reminder type */
  type: ReminderType;

  /** Scheduled send date */
  scheduledDate: Date;

  /** Whether the reminder has been sent */
  sent: boolean;

  /** When the reminder was actually sent */
  sentAt: Date | null;

  /** Whether the reminder was cancelled (e.g., invoice paid) */
  cancelled: boolean;

  /** Delivery record ID if sent */
  deliveryId: string | null;

  /** Sequence number in the reminder cadence (1st, 2nd, 3rd...) */
  sequenceNumber: number;

  /** Custom message override for this reminder */
  customMessage: string | null;

  createdAt: Date;
  updatedAt: Date;
}
```

### InvoicePayment

```typescript
/**
 * Records a payment applied to an invoice. Tracks both
 * manual and automated (webhook-driven) payment applications.
 */
interface InvoicePayment {
  /** Unique payment record identifier */
  id: string;

  /** Invoice this payment applies to */
  invoiceId: string;

  /** Venture context */
  ventureId: string;

  /** Payment amount in invoice currency */
  amount: number;

  /** Payment currency (may differ from invoice; FX applied) */
  paymentCurrency: string;

  /** Amount in payment currency (before FX conversion) */
  paymentCurrencyAmount: number;

  /** FX rate applied (paymentCurrency → invoiceCurrency) */
  fxRate: number | null;

  /** Payment method used */
  paymentMethod: string;

  /** External payment reference (e.g., Stripe payment intent ID) */
  externalPaymentId: string | null;

  /** External payment provider */
  provider: string | null;

  /** Payment reference number (bank transfer ref, check number) */
  referenceNumber: string | null;

  /** Reconciliation status */
  reconciliationStatus: PaymentReconciliationStatus;

  /** Who recorded this payment */
  recordedBy: string;

  /** Whether this was auto-reconciled or manually entered */
  source: 'auto' | 'manual' | 'webhook' | 'import';

  /** Payment date */
  paidAt: Date;

  /** Notes about this payment */
  notes: string | null;

  metadata: Record<string, unknown>;

  createdAt: Date;
  updatedAt: Date;
}
```

### Enums

```typescript
enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  VIEWED = 'viewed',
  PARTIALLY_PAID = 'partially_paid',
  PAID = 'paid',
  OVERDUE = 'overdue',
  VOID = 'void',
  CREDIT_NOTED = 'credit_noted',
  UNCOLLECTIBLE = 'uncollectible',
}

enum InvoiceType {
  STANDARD = 'standard',
  PRO_FORMA = 'pro_forma',
  RECURRING = 'recurring',
  CREDIT_NOTE = 'credit_note',
  DEBIT_NOTE = 'debit_note',
  SELF_BILLING = 'self_billing',
}

enum CreditNoteReason {
  DUPLICATE = 'duplicate',
  FRAUDULENT = 'fraudulent',
  ORDER_CHANGE = 'order_change',
  PRODUCT_UNSATISFACTORY = 'product_unsatisfactory',
  SERVICE_ISSUE = 'service_issue',
  PRICING_ERROR = 'pricing_error',
  GOODWILL = 'goodwill',
  CANCELLATION = 'cancellation',
  OTHER = 'other',
}

enum DeliveryChannel {
  EMAIL = 'email',
  SMS = 'sms',
  WEBHOOK = 'webhook',
  PORTAL = 'portal',
  MANUAL = 'manual',
}

enum DeliveryStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  OPENED = 'opened',
  BOUNCED = 'bounced',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

enum ReminderType {
  /** Sent before due date as a courtesy */
  PRE_DUE = 'pre_due',
  /** Sent on the due date */
  ON_DUE = 'on_due',
  /** First reminder after due date */
  OVERDUE_FIRST = 'overdue_first',
  /** Second reminder */
  OVERDUE_SECOND = 'overdue_second',
  /** Third reminder (escalation) */
  OVERDUE_THIRD = 'overdue_third',
  /** Final notice before collection action */
  FINAL_NOTICE = 'final_notice',
}

enum RecurrenceFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  SEMIANNUAL = 'semiannual',
  ANNUAL = 'annual',
}

enum NumberingResetPolicy {
  /** Never reset; counter grows indefinitely */
  NEVER = 'never',
  /** Reset to 1 at the start of each fiscal year */
  FISCAL_YEAR = 'fiscal_year',
  /** Reset to 1 at the start of each calendar year */
  CALENDAR_YEAR = 'calendar_year',
  /** Reset to 1 at the start of each month */
  MONTHLY = 'monthly',
}

enum TaxBehavior {
  /** Prices exclude tax; tax is added on top */
  EXCLUSIVE = 'exclusive',
  /** Prices include tax; tax is extracted from total */
  INCLUSIVE = 'inclusive',
}

enum PaymentReconciliationStatus {
  /** Payment received, not yet matched to invoice */
  UNMATCHED = 'unmatched',
  /** Payment matched to invoice(s) automatically */
  AUTO_MATCHED = 'auto_matched',
  /** Payment manually matched to invoice(s) */
  MANUALLY_MATCHED = 'manually_matched',
  /** Payment confirmed and applied */
  CONFIRMED = 'confirmed',
  /** Payment disputed */
  DISPUTED = 'disputed',
}
```

### InvoiceService

```typescript
/**
 * Primary service for invoice operations. All mutations
 * go through this service to ensure consistent state
 * transitions, side effects, and audit logging.
 */
interface InvoiceService {
  // ─── CRUD ─────────────────────────────────────────────────────

  /**
   * Create a new draft invoice.
   * Does NOT assign an invoice number (that happens on finalization).
   */
  create(input: CreateInvoiceInput): Promise<Invoice>;

  /**
   * Get an invoice by ID with optional relations.
   */
  getById(
    invoiceId: string,
    options?: {
      includeLineItems?: boolean;
      includePayments?: boolean;
      includeDeliveries?: boolean;
      includeCreditNotes?: boolean;
      includeReminders?: boolean;
    }
  ): Promise<Invoice | null>;

  /**
   * List invoices with filtering, sorting, and pagination.
   */
  list(params: InvoiceListParams): Promise<PaginatedResult<Invoice>>;

  /**
   * Update a draft invoice. Throws if invoice is not in draft status.
   */
  update(invoiceId: string, input: UpdateInvoiceInput): Promise<Invoice>;

  /**
   * Delete a draft invoice. Finalized invoices cannot be deleted (void instead).
   */
  delete(invoiceId: string): Promise<void>;

  // ─── Line Items ───────────────────────────────────────────────

  /** Add a line item to a draft invoice */
  addLineItem(invoiceId: string, input: CreateLineItemInput): Promise<InvoiceLineItem>;

  /** Update a line item on a draft invoice */
  updateLineItem(lineItemId: string, input: UpdateLineItemInput): Promise<InvoiceLineItem>;

  /** Remove a line item from a draft invoice */
  removeLineItem(lineItemId: string): Promise<void>;

  /** Reorder line items */
  reorderLineItems(invoiceId: string, lineItemIds: string[]): Promise<void>;

  // ─── Lifecycle ────────────────────────────────────────────────

  /**
   * Finalize a draft invoice:
   * 1. Assigns invoice number from venture's numbering sequence
   * 2. Locks line items and computes final totals
   * 3. Computes content hash for tamper detection
   * 4. Generates PDF
   * 5. Creates payment link
   * 6. Transitions status to SENT
   * 7. Sends email delivery
   * 8. Schedules payment reminders
   */
  finalize(invoiceId: string, options?: FinalizeOptions): Promise<Invoice>;

  /**
   * Record that a customer viewed the invoice (e.g., opened email, visited portal).
   */
  recordView(invoiceId: string, viewSource: string): Promise<Invoice>;

  /**
   * Void an invoice. Cannot void a fully paid invoice (issue credit note instead).
   */
  void(invoiceId: string, reason: string): Promise<Invoice>;

  /**
   * Mark an invoice as uncollectible (bad debt write-off).
   */
  markUncollectible(invoiceId: string, reason: string): Promise<Invoice>;

  // ─── Payments ─────────────────────────────────────────────────

  /**
   * Record a payment against an invoice. Automatically transitions
   * status to PARTIALLY_PAID or PAID based on remaining balance.
   */
  recordPayment(invoiceId: string, input: RecordPaymentInput): Promise<InvoicePayment>;

  /**
   * Reconcile an incoming payment with an invoice.
   * Used by the payment webhook handler.
   */
  reconcilePayment(input: ReconcilePaymentInput): Promise<{
    payment: InvoicePayment;
    invoice: Invoice;
    fullyPaid: boolean;
  }>;

  // ─── PDF ──────────────────────────────────────────────────────

  /**
   * Generate or regenerate the PDF for an invoice.
   * Uses the invoice's template (or venture default).
   */
  generatePdf(invoiceId: string, options?: PdfOptions): Promise<{
    url: string;
    hash: string;
    sizeBytes: number;
  }>;

  /**
   * Get a short-lived signed URL for downloading the invoice PDF.
   */
  getPdfDownloadUrl(invoiceId: string, expiresInSeconds?: number): Promise<string>;

  // ─── Delivery ─────────────────────────────────────────────────

  /**
   * Send the invoice to the customer via specified channel.
   */
  deliver(invoiceId: string, input: DeliverInput): Promise<InvoiceDelivery>;

  /**
   * Resend the invoice (creates a new delivery record).
   */
  resend(invoiceId: string, channel?: DeliveryChannel): Promise<InvoiceDelivery>;

  // ─── Auto-Generation ──────────────────────────────────────────

  /**
   * Generate an invoice from an order.
   * Copies order line items, applies order-level discounts,
   * and links the invoice to the order.
   */
  generateFromOrder(orderId: string, options?: GenerateFromOrderOptions): Promise<Invoice>;

  /**
   * Generate an invoice from a subscription billing cycle.
   * Handles pro-ration for partial periods.
   */
  generateFromSubscription(
    subscriptionId: string,
    periodStart: Date,
    periodEnd: Date,
    options?: GenerateFromSubscriptionOptions
  ): Promise<Invoice>;

  // ─── Duplication ──────────────────────────────────────────────

  /**
   * Duplicate an existing invoice as a new draft.
   * Copies line items, template, and customer details.
   */
  duplicate(invoiceId: string): Promise<Invoice>;

  // ─── Batch Operations ─────────────────────────────────────────

  /**
   * Finalize and send multiple invoices in batch.
   */
  batchFinalize(invoiceIds: string[]): Promise<BatchResult<Invoice>>;

  /**
   * Process all due recurring invoice schedules.
   * Called by the cron job handler.
   */
  processRecurringSchedules(asOfDate?: Date): Promise<{
    processed: number;
    generated: number;
    errors: Array<{ scheduleId: string; error: string }>;
  }>;

  /**
   * Process and send all pending reminders.
   * Called by the cron job handler.
   */
  processReminders(asOfDate?: Date): Promise<{
    sent: number;
    errors: Array<{ reminderId: string; error: string }>;
  }>;

  /**
   * Mark overdue invoices (past due date, not fully paid).
   * Called by the cron job handler.
   */
  markOverdueInvoices(asOfDate?: Date): Promise<{ count: number }>;
}
```

---

## Database Schemas

### invoices

```typescript
import { pgTable, uuid, text, timestamp, numeric, boolean, jsonb, pgEnum, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ─── Enums ──────────────────────────────────────────────────────

export const invoiceStatusEnum = pgEnum('invoice_status', [
  'draft', 'sent', 'viewed', 'partially_paid', 'paid',
  'overdue', 'void', 'credit_noted', 'uncollectible',
]);

export const invoiceTypeEnum = pgEnum('invoice_type', [
  'standard', 'pro_forma', 'recurring', 'credit_note', 'debit_note', 'self_billing',
]);

export const taxBehaviorEnum = pgEnum('tax_behavior', ['exclusive', 'inclusive']);

// ─── Table ──────────────────────────────────────────────────────

export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  customerId: uuid('customer_id').notNull().references(() => customers.id),

  invoiceNumber: text('invoice_number').unique(),
  type: invoiceTypeEnum('type').notNull().default('standard'),
  status: invoiceStatusEnum('status').notNull().default('draft'),

  currency: text('currency').notNull().default('USD'),
  fxRateToBase: numeric('fx_rate_to_base', { precision: 18, scale: 8 }),
  baseCurrency: text('base_currency'),

  issueDate: timestamp('issue_date', { withTimezone: true }),
  dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
  paidDate: timestamp('paid_date', { withTimezone: true }),
  voidedDate: timestamp('voided_date', { withTimezone: true }),
  voidReason: text('void_reason'),

  // ─── Amounts ────────────────────────────────────────────────
  subtotal: numeric('subtotal', { precision: 18, scale: 4 }).notNull().default('0'),
  discountTotal: numeric('discount_total', { precision: 18, scale: 4 }).notNull().default('0'),
  taxTotal: numeric('tax_total', { precision: 18, scale: 4 }).notNull().default('0'),
  total: numeric('total', { precision: 18, scale: 4 }).notNull().default('0'),
  amountPaid: numeric('amount_paid', { precision: 18, scale: 4 }).notNull().default('0'),
  amountDue: numeric('amount_due', { precision: 18, scale: 4 }).notNull().default('0'),
  amountCredited: numeric('amount_credited', { precision: 18, scale: 4 }).notNull().default('0'),

  // ─── Tax ────────────────────────────────────────────────────
  taxBehavior: taxBehaviorEnum('tax_behavior').notNull().default('exclusive'),
  reverseCharge: boolean('reverse_charge').notNull().default(false),
  taxExemptionReason: text('tax_exemption_reason'),
  withholdingTaxRate: numeric('withholding_tax_rate', { precision: 5, scale: 4 }),
  withholdingTaxAmount: numeric('withholding_tax_amount', { precision: 18, scale: 4 }),

  // ─── References ─────────────────────────────────────────────
  orderId: uuid('order_id'),
  subscriptionId: uuid('subscription_id'),
  recurringScheduleId: uuid('recurring_schedule_id'),
  purchaseOrderNumber: text('purchase_order_number'),

  // ─── Content ────────────────────────────────────────────────
  memo: text('memo'),
  internalNotes: text('internal_notes'),
  terms: text('terms'),
  footer: text('footer'),
  metadata: jsonb('metadata').notNull().default('{}'),

  // ─── PDF & Delivery ─────────────────────────────────────────
  pdfUrl: text('pdf_url'),
  pdfHash: text('pdf_hash'),
  contentHash: text('content_hash'),
  templateId: uuid('template_id'),
  locale: text('locale').notNull().default('en-US'),
  paymentLink: text('payment_link'),
  paymentLinkExpiresAt: timestamp('payment_link_expires_at', { withTimezone: true }),

  // ─── Billing Address (snapshot) ─────────────────────────────
  billingAddress: jsonb('billing_address').notNull().default('{}'),

  // ─── Timestamps ─────────────────────────────────────────────
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  finalizedAt: timestamp('finalized_at', { withTimezone: true }),
  firstViewedAt: timestamp('first_viewed_at', { withTimezone: true }),
}, (table) => ({
  // ─── Indexes ────────────────────────────────────────────────
  ventureIdx: index('invoices_venture_id_idx').on(table.ventureId),
  customerIdx: index('invoices_customer_id_idx').on(table.customerId),
  statusIdx: index('invoices_status_idx').on(table.status),
  dueDateIdx: index('invoices_due_date_idx').on(table.dueDate),
  invoiceNumberIdx: index('invoices_invoice_number_idx').on(table.invoiceNumber),
  orderIdx: index('invoices_order_id_idx').on(table.orderId),
  subscriptionIdx: index('invoices_subscription_id_idx').on(table.subscriptionId),
  ventureStatusIdx: index('invoices_venture_status_idx').on(table.ventureId, table.status),
  customerStatusIdx: index('invoices_customer_status_idx').on(table.customerId, table.status),
  overdueIdx: index('invoices_overdue_idx').on(table.ventureId, table.dueDate).where(
    sql`status IN ('sent', 'viewed', 'partially_paid', 'overdue')`
  ),
}));

// ─── Row-Level Security ─────────────────────────────────────────

/*
  ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

  -- Venture isolation: users can only see invoices for their venture(s)
  CREATE POLICY invoices_venture_isolation ON invoices
    USING (venture_id IN (
      SELECT venture_id FROM venture_members
      WHERE user_id = auth.uid()
    ));

  -- Organization isolation (platform-level RLS)
  CREATE POLICY invoices_org_isolation ON invoices
    USING (organization_id = (
      SELECT organization_id FROM user_profiles
      WHERE user_id = auth.uid()
    ));

  -- Customers can view their own invoices via the portal
  CREATE POLICY invoices_customer_read ON invoices
    FOR SELECT
    USING (
      customer_id IN (
        SELECT id FROM customers WHERE user_id = auth.uid()
      )
      AND status != 'draft'
    );

  -- Only finalize/void with specific permissions
  CREATE POLICY invoices_manage ON invoices
    FOR UPDATE
    USING (venture_id IN (
      SELECT venture_id FROM venture_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'billing')
    ));
*/
```

### invoice_line_items

```typescript
export const invoiceLineItems = pgTable('invoice_line_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),

  position: integer('position').notNull().default(1),
  description: text('description').notNull(),
  details: text('details'),

  quantity: numeric('quantity', { precision: 18, scale: 6 }).notNull().default('1'),
  unit: text('unit'),
  unitPrice: numeric('unit_price', { precision: 18, scale: 4 }).notNull(),

  grossAmount: numeric('gross_amount', { precision: 18, scale: 4 }).notNull(),
  discountPercent: numeric('discount_percent', { precision: 5, scale: 2 }),
  discountAmount: numeric('discount_amount', { precision: 18, scale: 4 }),
  netAmount: numeric('net_amount', { precision: 18, scale: 4 }).notNull(),

  taxRate: numeric('tax_rate', { precision: 5, scale: 4 }).notNull().default('0'),
  taxRateLabel: text('tax_rate_label'),
  taxAmount: numeric('tax_amount', { precision: 18, scale: 4 }).notNull().default('0'),
  totalAmount: numeric('total_amount', { precision: 18, scale: 4 }).notNull(),

  productId: uuid('product_id'),
  priceId: uuid('price_id'),
  subscriptionItemId: uuid('subscription_item_id'),
  orderLineItemId: uuid('order_line_item_id'),

  periodStart: timestamp('period_start', { withTimezone: true }),
  periodEnd: timestamp('period_end', { withTimezone: true }),
  prorated: boolean('prorated').notNull().default(false),

  metadata: jsonb('metadata').notNull().default('{}'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  invoiceIdx: index('line_items_invoice_id_idx').on(table.invoiceId),
  ventureIdx: index('line_items_venture_id_idx').on(table.ventureId),
  positionIdx: index('line_items_position_idx').on(table.invoiceId, table.position),
}));

/*
  ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;

  CREATE POLICY line_items_via_invoice ON invoice_line_items
    USING (invoice_id IN (
      SELECT id FROM invoices WHERE venture_id IN (
        SELECT venture_id FROM venture_members WHERE user_id = auth.uid()
      )
    ));
*/
```

### invoice_payments

```typescript
export const invoicePayments = pgTable('invoice_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),

  amount: numeric('amount', { precision: 18, scale: 4 }).notNull(),
  paymentCurrency: text('payment_currency').notNull(),
  paymentCurrencyAmount: numeric('payment_currency_amount', { precision: 18, scale: 4 }).notNull(),
  fxRate: numeric('fx_rate', { precision: 18, scale: 8 }),

  paymentMethod: text('payment_method').notNull(),
  externalPaymentId: text('external_payment_id'),
  provider: text('provider'),
  referenceNumber: text('reference_number'),

  reconciliationStatus: text('reconciliation_status').notNull().default('unmatched'),
  recordedBy: uuid('recorded_by').notNull(),
  source: text('source').notNull().default('manual'),

  paidAt: timestamp('paid_at', { withTimezone: true }).notNull(),
  notes: text('notes'),
  metadata: jsonb('metadata').notNull().default('{}'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  invoiceIdx: index('payments_invoice_id_idx').on(table.invoiceId),
  ventureIdx: index('payments_venture_id_idx').on(table.ventureId),
  externalIdx: index('payments_external_id_idx').on(table.externalPaymentId),
  reconciliationIdx: index('payments_reconciliation_idx').on(table.reconciliationStatus),
}));

/*
  ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;

  CREATE POLICY payments_via_invoice ON invoice_payments
    USING (invoice_id IN (
      SELECT id FROM invoices WHERE venture_id IN (
        SELECT venture_id FROM venture_members WHERE user_id = auth.uid()
      )
    ));
*/
```

### credit_notes

```typescript
export const creditNoteReasonEnum = pgEnum('credit_note_reason', [
  'duplicate', 'fraudulent', 'order_change', 'product_unsatisfactory',
  'service_issue', 'pricing_error', 'goodwill', 'cancellation', 'other',
]);

export const creditNoteStatusEnum = pgEnum('credit_note_status', [
  'draft', 'issued', 'applied', 'partially_applied', 'void',
]);

export const creditNotes = pgTable('credit_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  customerId: uuid('customer_id').notNull().references(() => customers.id),

  creditNoteNumber: text('credit_note_number').notNull().unique(),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id),

  reason: creditNoteReasonEnum('reason').notNull(),
  description: text('description'),
  status: creditNoteStatusEnum('status').notNull().default('draft'),

  currency: text('currency').notNull(),
  total: numeric('total', { precision: 18, scale: 4 }).notNull(),
  amountApplied: numeric('amount_applied', { precision: 18, scale: 4 }).notNull().default('0'),
  amountRemaining: numeric('amount_remaining', { precision: 18, scale: 4 }).notNull(),

  issueDate: timestamp('issue_date', { withTimezone: true }),
  pdfUrl: text('pdf_url'),
  pdfHash: text('pdf_hash'),
  internalNotes: text('internal_notes'),
  metadata: jsonb('metadata').notNull().default('{}'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ventureIdx: index('credit_notes_venture_id_idx').on(table.ventureId),
  customerIdx: index('credit_notes_customer_id_idx').on(table.customerId),
  invoiceIdx: index('credit_notes_invoice_id_idx').on(table.invoiceId),
  statusIdx: index('credit_notes_status_idx').on(table.status),
}));

/*
  ALTER TABLE credit_notes ENABLE ROW LEVEL SECURITY;

  CREATE POLICY credit_notes_venture_isolation ON credit_notes
    USING (venture_id IN (
      SELECT venture_id FROM venture_members WHERE user_id = auth.uid()
    ));
*/
```

### credit_note_applications

```typescript
export const creditNoteApplications = pgTable('credit_note_applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  creditNoteId: uuid('credit_note_id').notNull().references(() => creditNotes.id),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),

  amount: numeric('amount', { precision: 18, scale: 4 }).notNull(),
  appliedAt: timestamp('applied_at', { withTimezone: true }).notNull().defaultNow(),
  appliedBy: uuid('applied_by').notNull(),
  notes: text('notes'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  creditNoteIdx: index('cn_applications_credit_note_idx').on(table.creditNoteId),
  invoiceIdx: index('cn_applications_invoice_idx').on(table.invoiceId),
}));
```

### recurring_invoice_schedules

```typescript
export const recurrenceFrequencyEnum = pgEnum('recurrence_frequency', [
  'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'semiannual', 'annual',
]);

export const recurringInvoiceSchedules = pgTable('recurring_invoice_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  customerId: uuid('customer_id').notNull().references(() => customers.id),

  name: text('name').notNull(),
  active: boolean('active').notNull().default(true),

  frequency: recurrenceFrequencyEnum('frequency').notNull(),
  intervalCount: integer('interval_count').notNull().default(1),
  dayOfMonth: integer('day_of_month'),
  dayOfWeek: integer('day_of_week'),

  anchorDate: timestamp('anchor_date', { withTimezone: true }).notNull(),
  nextGenerationDate: timestamp('next_generation_date', { withTimezone: true }).notNull(),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }),

  maxOccurrences: integer('max_occurrences'),
  occurrenceCount: integer('occurrence_count').notNull().default(0),

  currency: text('currency').notNull().default('USD'),
  templateId: uuid('template_id'),
  subscriptionId: uuid('subscription_id'),

  autoSend: boolean('auto_send').notNull().default(true),
  paymentTermDays: integer('payment_term_days').notNull().default(30),
  prorateFirst: boolean('prorate_first').notNull().default(false),
  prorateLast: boolean('prorate_last').notNull().default(false),

  memo: text('memo'),
  lineItemTemplates: jsonb('line_item_templates').notNull().default('[]'),

  lastInvoiceId: uuid('last_invoice_id'),
  lastGeneratedAt: timestamp('last_generated_at', { withTimezone: true }),
  lastError: text('last_error'),

  metadata: jsonb('metadata').notNull().default('{}'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  pausedAt: timestamp('paused_at', { withTimezone: true }),
}, (table) => ({
  ventureIdx: index('recurring_schedules_venture_idx').on(table.ventureId),
  nextGenIdx: index('recurring_schedules_next_gen_idx').on(table.nextGenerationDate)
    .where(sql`active = true`),
  subscriptionIdx: index('recurring_schedules_sub_idx').on(table.subscriptionId),
}));

/*
  ALTER TABLE recurring_invoice_schedules ENABLE ROW LEVEL SECURITY;

  CREATE POLICY recurring_venture_isolation ON recurring_invoice_schedules
    USING (venture_id IN (
      SELECT venture_id FROM venture_members WHERE user_id = auth.uid()
    ));
*/
```

### invoice_templates

```typescript
export const invoiceTemplates = pgTable('invoice_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),

  name: text('name').notNull(),
  isDefault: boolean('is_default').notNull().default(false),
  description: text('description'),

  htmlTemplate: text('html_template').notNull(),
  cssStyles: text('css_styles').notNull().default(''),
  headerHtml: text('header_html'),
  footerHtml: text('footer_html'),

  // Branding
  logoUrl: text('logo_url'),
  logoWidth: integer('logo_width'),
  logoHeight: integer('logo_height'),
  primaryColor: text('primary_color').notNull().default('#1a1a2e'),
  secondaryColor: text('secondary_color').notNull().default('#16213e'),
  accentColor: text('accent_color').notNull().default('#0f3460'),
  headingFont: text('heading_font').notNull().default('Inter'),
  bodyFont: text('body_font').notNull().default('Inter'),

  // Layout
  paperSize: text('paper_size').notNull().default('A4'),
  orientation: text('orientation').notNull().default('portrait'),
  margins: jsonb('margins').notNull().default('{"top":20,"right":15,"bottom":20,"left":15}'),
  showPageNumbers: boolean('show_page_numbers').notNull().default(true),
  showPaymentQr: boolean('show_payment_qr').notNull().default(true),
  showBankDetails: boolean('show_bank_details').notNull().default(false),
  showLineTax: boolean('show_line_tax').notNull().default(true),

  // Localization
  defaultLocale: text('default_locale').notNull().default('en-US'),
  supportedLocales: jsonb('supported_locales').notNull().default('["en-US"]'),
  labelOverrides: jsonb('label_overrides').notNull().default('{}'),
  dateFormat: jsonb('date_format').notNull().default('{}'),
  numberFormatLocale: text('number_format_locale').notNull().default('en-US'),

  // Custom sections
  customSections: jsonb('custom_sections').notNull().default('[]'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ventureIdx: index('templates_venture_id_idx').on(table.ventureId),
  defaultIdx: index('templates_default_idx').on(table.ventureId, table.isDefault)
    .where(sql`is_default = true`),
}));
```

### invoice_deliveries

```typescript
export const deliveryChannelEnum = pgEnum('delivery_channel', [
  'email', 'sms', 'webhook', 'portal', 'manual',
]);

export const deliveryStatusEnum = pgEnum('delivery_status', [
  'pending', 'sent', 'delivered', 'opened', 'bounced', 'failed', 'cancelled',
]);

export const invoiceDeliveries = pgTable('invoice_deliveries', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),

  channel: deliveryChannelEnum('channel').notNull(),
  status: deliveryStatusEnum('status').notNull().default('pending'),

  recipient: text('recipient').notNull(),
  subject: text('subject'),
  body: text('body'),
  pdfAttached: boolean('pdf_attached').notNull().default(true),

  externalId: text('external_id'),
  errorMessage: text('error_message'),
  retryCount: integer('retry_count').notNull().default(0),

  sentAt: timestamp('sent_at', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  openedAt: timestamp('opened_at', { withTimezone: true }),
  bouncedAt: timestamp('bounced_at', { withTimezone: true }),
  failedAt: timestamp('failed_at', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  invoiceIdx: index('deliveries_invoice_id_idx').on(table.invoiceId),
  statusIdx: index('deliveries_status_idx').on(table.status),
  externalIdx: index('deliveries_external_id_idx').on(table.externalId),
}));
```

### numbering_sequences

```typescript
export const numberingResetPolicyEnum = pgEnum('numbering_reset_policy', [
  'never', 'fiscal_year', 'calendar_year', 'monthly',
]);

export const numberingSequences = pgTable('numbering_sequences', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),

  documentType: text('document_type').notNull(),
  name: text('name').notNull(),
  active: boolean('active').notNull().default(true),

  currentValue: integer('current_value').notNull().default(0),
  step: integer('step').notNull().default(1),
  minDigits: integer('min_digits').notNull().default(5),

  prefix: text('prefix').notNull().default('INV-{YEAR}-'),
  suffix: text('suffix').notNull().default(''),
  separator: text('separator').notNull().default(''),

  resetPolicy: numberingResetPolicyEnum('reset_policy').notNull().default('calendar_year'),
  fiscalYearStartMonth: integer('fiscal_year_start_month').notNull().default(1),
  lastResetAt: timestamp('last_reset_at', { withTimezone: true }),

  gapFree: boolean('gap_free').notNull().default(true),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ventureTypeIdx: index('numbering_venture_type_idx').on(table.ventureId, table.documentType),
  activeIdx: index('numbering_active_idx').on(table.ventureId, table.documentType, table.active)
    .where(sql`active = true`),
}));

/*
  -- Gap-free numbering requires advisory locks to prevent concurrent allocation
  -- This is handled at the application level using pg_advisory_xact_lock

  CREATE OR REPLACE FUNCTION next_invoice_number(p_sequence_id UUID)
  RETURNS TEXT AS $$
  DECLARE
    v_seq RECORD;
    v_next_value INTEGER;
    v_formatted TEXT;
    v_year TEXT;
    v_month TEXT;
  BEGIN
    -- Acquire advisory lock for this sequence
    PERFORM pg_advisory_xact_lock(hashtext(p_sequence_id::text));

    -- Get and increment sequence
    UPDATE numbering_sequences
    SET current_value = current_value + step,
        updated_at = NOW()
    WHERE id = p_sequence_id AND active = true
    RETURNING * INTO v_seq;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Numbering sequence not found or inactive: %', p_sequence_id;
    END IF;

    v_next_value := v_seq.current_value;
    v_year := EXTRACT(YEAR FROM NOW())::TEXT;
    v_month := LPAD(EXTRACT(MONTH FROM NOW())::TEXT, 2, '0');

    -- Format the number
    v_formatted := v_seq.prefix;
    v_formatted := REPLACE(v_formatted, '{YEAR}', v_year);
    v_formatted := REPLACE(v_formatted, '{MONTH}', v_month);
    v_formatted := v_formatted || LPAD(v_next_value::TEXT, v_seq.min_digits, '0');
    v_formatted := v_formatted || v_seq.suffix;

    RETURN v_formatted;
  END;
  $$ LANGUAGE plpgsql;
*/
```

### invoice_reminders

```typescript
export const reminderTypeEnum = pgEnum('reminder_type', [
  'pre_due', 'on_due', 'overdue_first', 'overdue_second', 'overdue_third', 'final_notice',
]);

export const invoiceReminders = pgTable('invoice_reminders', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),

  type: reminderTypeEnum('type').notNull(),
  scheduledDate: timestamp('scheduled_date', { withTimezone: true }).notNull(),
  sent: boolean('sent').notNull().default(false),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  cancelled: boolean('cancelled').notNull().default(false),
  deliveryId: uuid('delivery_id'),
  sequenceNumber: integer('sequence_number').notNull(),
  customMessage: text('custom_message'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  invoiceIdx: index('reminders_invoice_id_idx').on(table.invoiceId),
  pendingIdx: index('reminders_pending_idx').on(table.scheduledDate)
    .where(sql`sent = false AND cancelled = false`),
}));
```

### aging_snapshots

```typescript
export const agingSnapshots = pgTable('aging_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),

  asOfDate: timestamp('as_of_date', { withTimezone: true }).notNull(),
  currency: text('currency').notNull(),
  bucketBoundaries: jsonb('bucket_boundaries').notNull().default('[30, 60, 90, 120]'),

  summary: jsonb('summary').notNull(),
  customers: jsonb('customers').notNull(),
  invoices: jsonb('invoices').notNull(),
  collectionPriorities: jsonb('collection_priorities').notNull(),

  generatedBy: uuid('generated_by'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ventureIdx: index('aging_snapshots_venture_idx').on(table.ventureId),
  dateIdx: index('aging_snapshots_date_idx').on(table.ventureId, table.asOfDate),
}));

/*
  ALTER TABLE aging_snapshots ENABLE ROW LEVEL SECURITY;

  CREATE POLICY aging_venture_isolation ON aging_snapshots
    USING (venture_id IN (
      SELECT venture_id FROM venture_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'billing')
    ));
*/
```

---

## Code Examples

### 1. Create an Invoice Manually

```typescript
import { InvoiceService } from '@mcv/commerce/invoicing';
import { addDays } from 'date-fns';

const invoiceService = container.resolve(InvoiceService);

// Create a draft invoice with line items
const invoice = await invoiceService.create({
  ventureId: 'venture_abc123',
  customerId: 'cust_xyz789',
  currency: 'CAD',
  dueDate: addDays(new Date(), 30),
  taxBehavior: 'exclusive',
  memo: 'Thank you for your business!',
  terms: 'Net 30. Late payments subject to 1.5% monthly interest.',
  billingAddress: {
    name: 'Jane Doe',
    company: 'Acme Corp',
    line1: '123 Main Street',
    line2: 'Suite 400',
    city: 'Toronto',
    state: 'ON',
    postalCode: 'M5V 2H1',
    country: 'CA',
    taxId: '123456789RT0001',
    taxIdType: 'ca_gst',
  },
  lineItems: [
    {
      description: 'Web Development Services — January 2026',
      details: '40 hours of full-stack development at agreed hourly rate',
      quantity: 40,
      unit: 'hours',
      unitPrice: 150.00,
      taxRate: 0.13,
      taxRateLabel: 'HST 13%',
    },
    {
      description: 'Cloud Hosting — January 2026',
      details: 'Production environment (3x t3.xlarge, RDS, CloudFront)',
      quantity: 1,
      unit: 'month',
      unitPrice: 450.00,
      taxRate: 0.13,
      taxRateLabel: 'HST 13%',
    },
    {
      description: 'SSL Certificate Renewal',
      quantity: 1,
      unitPrice: 99.00,
      taxRate: 0.13,
      taxRateLabel: 'HST 13%',
      discountPercent: 10,  // 10% loyalty discount
    },
  ],
});

console.log(invoice.id);          // "inv_01HX..."
console.log(invoice.status);      // "draft"
console.log(invoice.subtotal);    // 6549.00
console.log(invoice.discountTotal); // 9.90
console.log(invoice.taxTotal);    // 850.08
console.log(invoice.total);       // 7389.18
console.log(invoice.invoiceNumber); // null (assigned on finalization)

// Now finalize the invoice — this triggers the full pipeline
const finalized = await invoiceService.finalize(invoice.id, {
  sendEmail: true,
  generatePaymentLink: true,
});

console.log(finalized.status);         // "sent"
console.log(finalized.invoiceNumber);  // "INV-2026-00042"
console.log(finalized.pdfUrl);         // "https://storage.mcv.one/invoices/..."
console.log(finalized.paymentLink);    // "https://pay.mcv.one/inv/..."
console.log(finalized.contentHash);    // "sha256:a1b2c3..."
```

### 2. Auto-Generate Invoice from Order

```typescript
import { InvoiceService } from '@mcv/commerce/invoicing';

const invoiceService = container.resolve(InvoiceService);

// When an order is completed, automatically generate an invoice
// This is typically called from the order.completed event handler

const invoice = await invoiceService.generateFromOrder('order_abc123', {
  // Auto-finalize and send immediately
  autoFinalize: true,
  // Use the customer's preferred locale
  locale: 'fr-CA',
  // Override payment terms (default comes from venture settings)
  paymentTermDays: 15,
  // Include a custom memo
  memo: 'Merci pour votre commande! Paiement dû dans 15 jours.',
});

// The invoice now mirrors the order:
// - Line items copied from order lines (with product refs)
// - Discounts preserved (coupon, volume, etc.)
// - Tax calculated per line based on shipping address jurisdiction
// - PDF generated in French Canadian locale
// - Email sent to customer with PDF attachment and payment link

console.log(invoice.status);        // "sent" (auto-finalized)
console.log(invoice.orderId);       // "order_abc123"
console.log(invoice.locale);        // "fr-CA"
console.log(invoice.lineItems);     // [...order line items mapped to invoice lines]

// ─── Event Handler Pattern ────────────────────────────────────

// In practice, this is wired up as an event handler:
eventBus.on('order.completed', async (event) => {
  const { orderId, ventureId } = event.payload;

  // Check if venture has auto-invoicing enabled
  const ventureSettings = await settingsService.get(ventureId, 'invoicing');

  if (ventureSettings.autoInvoiceOnOrderComplete) {
    try {
      const invoice = await invoiceService.generateFromOrder(orderId, {
        autoFinalize: ventureSettings.autoFinalizeInvoices,
        paymentTermDays: ventureSettings.defaultPaymentTermDays,
      });

      logger.info('Invoice generated from order', {
        invoiceId: invoice.id,
        orderId,
        invoiceNumber: invoice.invoiceNumber,
        total: invoice.total,
        currency: invoice.currency,
      });
    } catch (error) {
      logger.error('Failed to generate invoice from order', {
        orderId,
        error: error.message,
      });
      // Don't throw — order completion shouldn't fail because of invoicing
      // The invoice can be manually created later
      await alertService.notify('invoicing.generation_failed', {
        orderId,
        error: error.message,
      });
    }
  }
});
```

### 3. Configure and Process Recurring Invoices

```typescript
import { RecurringInvoiceService, InvoiceService } from '@mcv/commerce/invoicing';

const recurringService = container.resolve(RecurringInvoiceService);
const invoiceService = container.resolve(InvoiceService);

// ─── Create a Recurring Schedule ──────────────────────────────

const schedule = await recurringService.create({
  ventureId: 'venture_abc123',
  customerId: 'cust_xyz789',
  name: 'Monthly SaaS Subscription — Acme Corp',

  frequency: 'monthly',
  intervalCount: 1,
  dayOfMonth: 1,         // Generate on the 1st of each month

  startDate: new Date('2026-03-01'),
  endDate: null,         // Indefinite
  maxOccurrences: null,  // Unlimited

  currency: 'USD',
  autoSend: true,        // Finalize and send immediately on generation
  paymentTermDays: 14,   // Due 14 days after generation
  prorateFirst: true,    // Pro-rate if starting mid-cycle

  subscriptionId: 'sub_abc123',  // Linked to subscription

  lineItemTemplates: [
    {
      description: 'Enterprise Plan — Monthly',
      quantity: 1,
      unitPrice: 499.00,
      unit: 'month',
      taxRate: 0.0,
      productId: 'prod_enterprise',
      priceId: 'price_enterprise_monthly',
    },
    {
      description: 'Additional Seat License',
      quantity: 15,
      unitPrice: 12.00,
      unit: 'seats',
      taxRate: 0.0,
      productId: 'prod_seat',
      priceId: 'price_seat_monthly',
    },
    {
      description: 'Premium Support Add-On',
      quantity: 1,
      unitPrice: 99.00,
      unit: 'month',
      taxRate: 0.0,
      productId: 'prod_premium_support',
      priceId: 'price_support_monthly',
    },
  ],

  memo: 'Your monthly subscription invoice. Thank you for being an Enterprise customer!',
});

console.log(schedule.id);                 // "sched_01HX..."
console.log(schedule.nextGenerationDate); // 2026-03-01T00:00:00Z
console.log(schedule.active);             // true

// ─── Process All Due Recurring Schedules (Cron Job) ───────────

// This runs as a scheduled cron job (e.g., every hour)
const results = await invoiceService.processRecurringSchedules();

console.log(results);
// {
//   processed: 47,    // Total schedules evaluated
//   generated: 12,    // Invoices actually generated
//   errors: [
//     { scheduleId: 'sched_err1', error: 'Customer has no billing address' },
//   ],
// }

// ─── Pause and Resume ─────────────────────────────────────────

await recurringService.pause(schedule.id);
// schedule.active = false, schedule.pausedAt = now

await recurringService.resume(schedule.id);
// schedule.active = true, schedule.pausedAt = null

// ─── Update Line Item Amounts ─────────────────────────────────

// When a subscription changes (e.g., seats added), update the template
await recurringService.updateLineItemTemplates(schedule.id, [
  {
    description: 'Enterprise Plan — Monthly',
    quantity: 1,
    unitPrice: 499.00,
    unit: 'month',
    taxRate: 0.0,
    productId: 'prod_enterprise',
    priceId: 'price_enterprise_monthly',
  },
  {
    description: 'Additional Seat License',
    quantity: 25,         // ← Increased from 15 to 25 seats
    unitPrice: 12.00,
    unit: 'seats',
    taxRate: 0.0,
    productId: 'prod_seat',
    priceId: 'price_seat_monthly',
  },
  {
    description: 'Premium Support Add-On',
    quantity: 1,
    unitPrice: 99.00,
    unit: 'month',
    taxRate: 0.0,
    productId: 'prod_premium_support',
    priceId: 'price_support_monthly',
  },
]);
```

### 4. Issue and Apply Credit Notes

```typescript
import { CreditNoteService, InvoiceService } from '@mcv/commerce/invoicing';

const creditNoteService = container.resolve(CreditNoteService);
const invoiceService = container.resolve(InvoiceService);

// ─── Issue a Partial Credit Note ──────────────────────────────

// Customer reported that 5 of the 20 units delivered were defective
const creditNote = await creditNoteService.create({
  invoiceId: 'inv_abc123',
  reason: 'product_unsatisfactory',
  description: '5 units returned due to manufacturing defect (batch #2026-0142)',

  lineItems: [
    {
      description: 'Widget Pro — Defective Units Credit',
      quantity: 5,
      unitPrice: 49.99,
      taxRate: 0.13,
      originalLineItemId: 'li_widget_pro',  // Reference to original invoice line
    },
  ],
});

console.log(creditNote.creditNoteNumber);  // "CN-2026-00012"
console.log(creditNote.total);             // 282.44 (5 × 49.99 × 1.13)
console.log(creditNote.amountRemaining);   // 282.44
console.log(creditNote.status);            // "draft"

// ─── Issue the Credit Note ────────────────────────────────────

const issued = await creditNoteService.issue(creditNote.id, {
  sendEmail: true,
  generatePdf: true,
});

console.log(issued.status);   // "issued"
console.log(issued.pdfUrl);   // "https://storage.mcv.one/credit-notes/..."

// ─── Apply Credit to a Future Invoice ─────────────────────────

// Customer's next invoice is $1,200. Apply the $282.44 credit.
const application = await creditNoteService.apply({
  creditNoteId: creditNote.id,
  invoiceId: 'inv_next_month',
  amount: 282.44,  // Full credit balance
  notes: 'Applied credit from CN-2026-00012 (defective units)',
});

console.log(application.amount);  // 282.44

// Check updated balances
const updatedCreditNote = await creditNoteService.getById(creditNote.id);
console.log(updatedCreditNote.amountApplied);    // 282.44
console.log(updatedCreditNote.amountRemaining);  // 0.00
console.log(updatedCreditNote.status);           // "applied"

const updatedInvoice = await invoiceService.getById('inv_next_month');
console.log(updatedInvoice.amountCredited);  // 282.44
console.log(updatedInvoice.amountDue);       // 917.56 (1200.00 - 282.44)

// ─── Check Customer Credit Balance ────────────────────────────

const balance = await creditNoteService.getCustomerCreditBalance('cust_xyz789', {
  currency: 'CAD',
});

console.log(balance);
// {
//   customerId: 'cust_xyz789',
//   currency: 'CAD',
//   totalIssued: 1547.20,
//   totalApplied: 1264.76,
//   availableBalance: 282.44,
//   creditNotes: [
//     { id: 'cn_001', number: 'CN-2026-00008', remaining: 0.00 },
//     { id: 'cn_002', number: 'CN-2026-00012', remaining: 282.44 },
//   ],
// }

// ─── Full Credit Note (Void Original Invoice) ────────────────

// For a complete refund, credit the entire invoice amount
const fullCredit = await creditNoteService.createFullCredit('inv_to_refund', {
  reason: 'cancellation',
  description: 'Customer cancelled within 30-day refund window',
  sendEmail: true,
});

// This creates a credit note for the full invoice total and
// transitions the original invoice to 'credit_noted' status
```

### 5. Payment Reconciliation

```typescript
import { PaymentReconciliationService, InvoiceService } from '@mcv/commerce/invoicing';

const reconciliationService = container.resolve(PaymentReconciliationService);
const invoiceService = container.resolve(InvoiceService);

// ─── Auto-Reconciliation from Stripe Webhook ─────────────────

// When a Stripe payment_intent.succeeded webhook arrives:
async function handleStripePaymentSuccess(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;

  const result = await invoiceService.reconcilePayment({
    provider: 'stripe',
    externalPaymentId: paymentIntent.id,
    amount: paymentIntent.amount / 100,  // Stripe uses cents
    currency: paymentIntent.currency.toUpperCase(),
    paymentMethod: paymentIntent.payment_method_types[0],
    paidAt: new Date(paymentIntent.created * 1000),

    // Matching hints (Stripe metadata should include invoice reference)
    matchingHints: {
      invoiceNumber: paymentIntent.metadata?.invoice_number,
      customerId: paymentIntent.metadata?.customer_id,
      invoiceId: paymentIntent.metadata?.invoice_id,
    },
  });

  if (result.matched) {
    console.log('Payment auto-reconciled:', {
      invoiceId: result.invoice.id,
      invoiceNumber: result.invoice.invoiceNumber,
      amountApplied: result.payment.amount,
      fullyPaid: result.fullyPaid,
      newStatus: result.invoice.status,
    });
  } else {
    // Payment couldn't be auto-matched — queue for manual review
    console.log('Payment unmatched, queued for review:', {
      externalPaymentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
    });
    await reconciliationService.queueForReview(result.unmatchedPaymentId);
  }
}

// ─── Manual Payment Recording ─────────────────────────────────

// Finance team records a bank transfer payment
const payment = await invoiceService.recordPayment('inv_abc123', {
  amount: 2500.00,
  paymentCurrency: 'USD',
  paymentCurrencyAmount: 2500.00,
  paymentMethod: 'bank_transfer',
  referenceNumber: 'TRF-2026020812345',
  paidAt: new Date('2026-02-05'),
  notes: 'Wire transfer received from Acme Corp — Chase Bank',
  source: 'manual',
});

console.log(payment.reconciliationStatus);  // "confirmed"

// Check if the invoice is now fully paid
const invoice = await invoiceService.getById('inv_abc123');

if (invoice.status === 'paid') {
  console.log('Invoice fully paid!');
  console.log('Paid date:', invoice.paidDate);
} else if (invoice.status === 'partially_paid') {
  console.log('Partial payment recorded');
  console.log('Amount paid:', invoice.amountPaid);
  console.log('Amount remaining:', invoice.amountDue);
}

// ─── Multi-Invoice Payment Allocation ─────────────────────────

// Customer sends a single payment covering multiple invoices
const allocation = await reconciliationService.allocatePayment({
  totalAmount: 10000.00,
  currency: 'USD',
  paymentMethod: 'bank_transfer',
  referenceNumber: 'BATCH-2026-02',
  paidAt: new Date(),
  source: 'manual',
  allocations: [
    { invoiceId: 'inv_001', amount: 3500.00 },
    { invoiceId: 'inv_002', amount: 4200.00 },
    { invoiceId: 'inv_003', amount: 2300.00 },
  ],
});

console.log(allocation.results);
// [
//   { invoiceId: 'inv_001', applied: 3500.00, fullyPaid: true },
//   { invoiceId: 'inv_002', applied: 4200.00, fullyPaid: true },
//   { invoiceId: 'inv_003', applied: 2300.00, fullyPaid: false },  // was $3000
// ]

// ─── Review Unmatched Payments ────────────────────────────────

const unmatched = await reconciliationService.listUnmatched({
  ventureId: 'venture_abc123',
  limit: 50,
});

console.log(unmatched);
// [
//   {
//     id: 'upay_001',
//     amount: 499.00,
//     currency: 'USD',
//     provider: 'stripe',
//     externalPaymentId: 'pi_xxx',
//     receivedAt: '2026-02-07T...',
//     suggestedMatches: [
//       { invoiceId: 'inv_042', invoiceNumber: 'INV-2026-00042', confidence: 0.92 },
//       { invoiceId: 'inv_041', invoiceNumber: 'INV-2026-00041', confidence: 0.45 },
//     ],
//   },
// ]
```

### 6. PDF Generation

```typescript
import { InvoicePdfService, InvoiceTemplateService } from '@mcv/commerce/invoicing';

const pdfService = container.resolve(InvoicePdfService);
const templateService = container.resolve(InvoiceTemplateService);

// ─── Create a Custom Template ─────────────────────────────────

const template = await templateService.create({
  ventureId: 'venture_abc123',
  name: 'Modern Minimal',
  isDefault: true,
  description: 'Clean, modern invoice design with accent sidebar',

  htmlTemplate: `
    <!DOCTYPE html>
    <html lang="{{locale}}">
    <head>
      <meta charset="UTF-8">
      <style>{{{css}}}</style>
    </head>
    <body>
      <div class="invoice-container">
        <!-- Header -->
        <header class="invoice-header">
          <div class="brand">
            {{#if logoUrl}}
              <img src="{{logoUrl}}" alt="{{ventureName}}" class="logo" />
            {{/if}}
            <div class="venture-details">
              <h1>{{ventureName}}</h1>
              <p>{{ventureAddress}}</p>
              <p>{{ventureTaxId}}</p>
            </div>
          </div>
          <div class="invoice-meta">
            <h2>{{labels.invoice}}</h2>
            <table>
              <tr><td>{{labels.invoiceNumber}}:</td><td><strong>{{invoiceNumber}}</strong></td></tr>
              <tr><td>{{labels.issueDate}}:</td><td>{{formatDate issueDate}}</td></tr>
              <tr><td>{{labels.dueDate}}:</td><td>{{formatDate dueDate}}</td></tr>
              {{#if purchaseOrderNumber}}
              <tr><td>{{labels.poNumber}}:</td><td>{{purchaseOrderNumber}}</td></tr>
              {{/if}}
            </table>
          </div>
        </header>

        <!-- Bill To -->
        <section class="bill-to">
          <h3>{{labels.billTo}}</h3>
          <p><strong>{{billingAddress.name}}</strong></p>
          {{#if billingAddress.company}}<p>{{billingAddress.company}}</p>{{/if}}
          <p>{{billingAddress.line1}}</p>
          {{#if billingAddress.line2}}<p>{{billingAddress.line2}}</p>{{/if}}
          <p>{{billingAddress.city}}, {{billingAddress.state}} {{billingAddress.postalCode}}</p>
          <p>{{billingAddress.country}}</p>
          {{#if billingAddress.taxId}}
          <p>{{labels.taxId}}: {{billingAddress.taxId}}</p>
          {{/if}}
        </section>

        <!-- Line Items -->
        <section class="line-items">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>{{labels.description}}</th>
                <th class="right">{{labels.quantity}}</th>
                <th class="right">{{labels.unitPrice}}</th>
                {{#if showLineTax}}<th class="right">{{labels.tax}}</th>{{/if}}
                <th class="right">{{labels.amount}}</th>
              </tr>
            </thead>
            <tbody>
              {{#each lineItems}}
              <tr>
                <td>{{position}}</td>
                <td>
                  {{description}}
                  {{#if details}}<br><small>{{details}}</small>{{/if}}
                  {{#if periodStart}}
                  <br><small>{{../labels.period}}: {{formatDate periodStart}} — {{formatDate periodEnd}}</small>
                  {{/if}}
                </td>
                <td class="right">{{formatNumber quantity}} {{unit}}</td>
                <td class="right">{{formatCurrency unitPrice ../currency}}</td>
                {{#if ../showLineTax}}<td class="right">{{taxRateLabel}}</td>{{/if}}
                <td class="right">{{formatCurrency totalAmount ../currency}}</td>
              </tr>
              {{/each}}
            </tbody>
          </table>
        </section>

        <!-- Totals -->
        <section class="totals">
          <table>
            <tr><td>{{labels.subtotal}}</td><td>{{formatCurrency subtotal currency}}</td></tr>
            {{#if discountTotal}}
            <tr class="discount"><td>{{labels.discount}}</td><td>-{{formatCurrency discountTotal currency}}</td></tr>
            {{/if}}
            <tr><td>{{labels.tax}} ({{taxSummary}})</td><td>{{formatCurrency taxTotal currency}}</td></tr>
            {{#if withholdingTaxAmount}}
            <tr><td>{{labels.withholdingTax}}</td><td>-{{formatCurrency withholdingTaxAmount currency}}</td></tr>
            {{/if}}
            <tr class="grand-total">
              <td><strong>{{labels.totalDue}}</strong></td>
              <td><strong>{{formatCurrency total currency}}</strong></td>
            </tr>
            {{#if amountPaid}}
            <tr><td>{{labels.paid}}</td><td>-{{formatCurrency amountPaid currency}}</td></tr>
            <tr class="balance-due">
              <td><strong>{{labels.balanceDue}}</strong></td>
              <td><strong>{{formatCurrency amountDue currency}}</strong></td>
            </tr>
            {{/if}}
          </table>
        </section>

        {{#if showPaymentQr}}
        <section class="payment-qr">
          <img src="{{paymentQrDataUrl}}" alt="Pay online" />
          <p>{{labels.scanToPay}}</p>
        </section>
        {{/if}}

        {{#if memo}}
        <section class="memo">
          <h4>{{labels.notes}}</h4>
          <p>{{memo}}</p>
        </section>
        {{/if}}

        {{#if terms}}
        <section class="terms">
          <h4>{{labels.terms}}</h4>
          <p>{{terms}}</p>
        </section>
        {{/if}}

        <footer class="invoice-footer">
          {{#if footer}}
          <p>{{footer}}</p>
          {{/if}}
          <p class="powered-by">Powered by MCV.ONE</p>
        </footer>
      </div>
    </body>
    </html>
  `,

  cssStyles: `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: {{bodyFont}}, system-ui, sans-serif; font-size: 10pt; color: #1a1a2e; }
    .invoice-container { max-width: 210mm; margin: 0 auto; padding: 20mm 15mm; }
    .invoice-header { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .logo { max-width: {{logoWidth}}px; max-height: {{logoHeight}}px; }
    h1 { font-family: {{headingFont}}, system-ui, sans-serif; color: {{primaryColor}}; }
    h2 { color: {{accentColor}}; font-size: 24pt; }
    .line-items table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .line-items th { background: {{primaryColor}}; color: white; padding: 8px 12px; text-align: left; }
    .line-items td { padding: 8px 12px; border-bottom: 1px solid #e0e0e0; }
    .line-items tr:nth-child(even) { background: #f8f9fa; }
    .right { text-align: right; }
    .totals { float: right; width: 300px; }
    .totals table { width: 100%; }
    .totals td { padding: 6px 12px; }
    .totals .grand-total { border-top: 2px solid {{primaryColor}}; font-size: 14pt; }
    .totals .grand-total td { padding-top: 12px; }
    .payment-qr { text-align: center; margin-top: 30px; }
    .payment-qr img { width: 120px; height: 120px; }
  `,

  primaryColor: '#1a1a2e',
  secondaryColor: '#16213e',
  accentColor: '#e94560',
  headingFont: 'Inter',
  bodyFont: 'Inter',

  paperSize: 'A4',
  orientation: 'portrait',
  margins: { top: 20, right: 15, bottom: 20, left: 15 },
  showPageNumbers: true,
  showPaymentQr: true,
  showBankDetails: false,
  showLineTax: true,

  defaultLocale: 'en-US',
  supportedLocales: ['en-US', 'en-CA', 'fr-CA'],
  labelOverrides: {
    'fr-CA': {
      invoice: 'Facture',
      invoiceNumber: 'Numéro de facture',
      issueDate: 'Date d\'émission',
      dueDate: 'Date d\'échéance',
      billTo: 'Facturer à',
      description: 'Description',
      quantity: 'Quantité',
      unitPrice: 'Prix unitaire',
      tax: 'Taxe',
      amount: 'Montant',
      subtotal: 'Sous-total',
      discount: 'Remise',
      totalDue: 'Total dû',
      paid: 'Payé',
      balanceDue: 'Solde dû',
      notes: 'Notes',
      terms: 'Conditions',
      scanToPay: 'Scannez pour payer',
    },
  },
});

// ─── Generate PDF for a Specific Invoice ──────────────────────

const pdfResult = await pdfService.generate('inv_abc123', {
  templateId: template.id,
  locale: 'en-CA',
  // PDF/A for archival compliance
  pdfA: true,
  // Apply digital signature
  sign: true,
  signingCertificateId: 'cert_venture_abc123',
});

console.log(pdfResult);
// {
//   url: 'https://storage.mcv.one/invoices/venture_abc123/INV-2026-00042.pdf',
//   hash: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
//   sizeBytes: 142857,
//   pageCount: 2,
//   signatureValid: true,
//   pdfACompliant: true,
//   generatedAt: '2026-02-08T14:30:00Z',
//   generationTimeMs: 1847,
// }

// ─── Get Download URL ─────────────────────────────────────────

const downloadUrl = await pdfService.getDownloadUrl('inv_abc123', {
  expiresInSeconds: 3600,  // 1 hour
  disposition: 'attachment',
  filename: 'INV-2026-00042.pdf',
});

console.log(downloadUrl);
// "https://storage.mcv.one/invoices/...?token=...&expires=..."
```

### 7. Aging Report Generation

```typescript
import { AgingReportService } from '@mcv/commerce/invoicing';

const agingService = container.resolve(AgingReportService);

// ─── Generate Aging Report ────────────────────────────────────

const report = await agingService.generate({
  ventureId: 'venture_abc123',
  asOfDate: new Date('2026-02-08'),
  currency: 'USD',
  bucketBoundaries: [30, 60, 90, 120],
  // Save snapshot for historical comparison
  saveSnapshot: true,
});

console.log(report.summary);
// {
//   current: 15200.00,     // 0-30 days
//   bucket1: 8750.00,      // 31-60 days
//   bucket2: 3200.00,      // 61-90 days
//   bucket3: 1800.00,      // 91-120 days
//   bucket4Plus: 950.00,   // 120+ days
//   total: 29900.00,
//   invoiceCount: 47,
//   customerCount: 18,
// }

// ─── Customer-Level Breakdown ─────────────────────────────────

console.log(report.customers[0]);
// {
//   customerId: 'cust_acme',
//   customerName: 'Acme Corporation',
//   buckets: {
//     'current': 5000.00,
//     '31-60': 2000.00,
//     '61-90': 1000.00,
//     '91-120': 0.00,
//     '120+': 0.00,
//   },
//   total: 8000.00,
//   invoiceCount: 5,
//   oldestInvoiceDate: '2025-12-15T...',
//   averageDaysOutstanding: 38,
//   collectionScore: 45,  // Lower = less risky
// }

// ─── Collection Priorities ────────────────────────────────────

console.log(report.collectionPriorities);
// [
//   {
//     customerId: 'cust_gamma',
//     customerName: 'Gamma Inc',
//     score: 92,
//     totalOverdue: 2000.00,
//     oldestOverdueDays: 145,
//     recommendedAction: 'collection_agency',
//     invoiceIds: ['inv_028', 'inv_019'],
//   },
//   {
//     customerId: 'cust_beta',
//     customerName: 'Beta LLC',
//     score: 68,
//     totalOverdue: 4700.00,
//     oldestOverdueDays: 95,
//     recommendedAction: 'escalation',
//     invoiceIds: ['inv_031', 'inv_025', 'inv_020'],
//   },
//   {
//     customerId: 'cust_acme',
//     customerName: 'Acme Corporation',
//     score: 35,
//     totalOverdue: 3000.00,
//     oldestOverdueDays: 55,
//     recommendedAction: 'reminder',
//     invoiceIds: ['inv_038', 'inv_035'],
//   },
// ]

// ─── Compare With Previous Period ─────────────────────────────

const comparison = await agingService.compare({
  ventureId: 'venture_abc123',
  currentDate: new Date('2026-02-08'),
  previousDate: new Date('2026-01-08'),
  currency: 'USD',
});

console.log(comparison);
// {
//   current: { total: 29900.00, invoiceCount: 47 },
//   previous: { total: 25400.00, invoiceCount: 42 },
//   change: {
//     totalDelta: 4500.00,
//     totalDeltaPercent: 17.7,
//     invoiceCountDelta: 5,
//     bucketMigration: {
//       improvedCount: 8,    // Invoices that moved to younger buckets (payments)
//       worsenedCount: 12,   // Invoices that aged into older buckets
//       resolvedCount: 15,   // Invoices that were paid off
//       newCount: 20,        // New unpaid invoices since last report
//     },
//   },
// }

// ─── Schedule Automatic Aging Snapshots ───────────────────────

// Typically run weekly via cron job
await agingService.scheduleSnapshot({
  ventureId: 'venture_abc123',
  frequency: 'weekly',
  dayOfWeek: 1,  // Monday
  currency: 'USD',
  notifyRoles: ['billing', 'admin'],
});
```

### 8. Multi-Currency Invoice

```typescript
import { InvoiceService, convertInvoiceCurrency } from '@mcv/commerce/invoicing';

const invoiceService = container.resolve(InvoiceService);

// ─── Create Invoice in Foreign Currency ───────────────────────

// Venture's base currency is CAD, but customer pays in EUR
const invoice = await invoiceService.create({
  ventureId: 'venture_abc123',
  customerId: 'cust_eu_partner',
  currency: 'EUR',
  baseCurrency: 'CAD',
  dueDate: addDays(new Date(), 30),
  taxBehavior: 'exclusive',

  // EU B2B reverse charge — customer self-accounts for VAT
  reverseCharge: true,

  billingAddress: {
    name: 'Hans Mueller',
    company: 'Deutsche Tech GmbH',
    line1: 'Hauptstraße 42',
    city: 'Berlin',
    state: 'Berlin',
    postalCode: '10115',
    country: 'DE',
    taxId: 'DE123456789',
    taxIdType: 'eu_vat',
  },

  lineItems: [
    {
      description: 'Enterprise Software License — Q1 2026',
      quantity: 1,
      unitPrice: 15000.00,  // EUR
      taxRate: 0.0,          // Reverse charge: 0% on invoice
      taxRateLabel: 'Reverse Charge',
    },
    {
      description: 'Implementation Services',
      details: '20 hours of remote implementation support',
      quantity: 20,
      unit: 'hours',
      unitPrice: 200.00,    // EUR
      taxRate: 0.0,
      taxRateLabel: 'Reverse Charge',
    },
  ],
});

// ─── Lock FX Rate at Finalization ─────────────────────────────

const finalized = await invoiceService.finalize(invoice.id, {
  sendEmail: true,
  // Lock the EUR/CAD exchange rate at finalization time
  lockFxRate: true,
  // Alternatively, provide a specific rate:
  // fxRate: 1.4732,
});

console.log(finalized.currency);       // "EUR"
console.log(finalized.baseCurrency);   // "CAD"
console.log(finalized.fxRateToBase);   // 1.4732 (1 EUR = 1.4732 CAD)
console.log(finalized.total);          // 19000.00 EUR
console.log(finalized.reverseCharge);  // true

// The PDF will show dual-currency display:
// Total: €19,000.00 (CAD $27,990.80)

// ─── Currency Conversion Utility ──────────────────────────────

const converted = convertInvoiceCurrency(finalized, 'CAD');

console.log(converted);
// {
//   originalCurrency: 'EUR',
//   targetCurrency: 'CAD',
//   fxRate: 1.4732,
//   originalTotal: 19000.00,
//   convertedTotal: 27990.80,
//   originalSubtotal: 19000.00,
//   convertedSubtotal: 27990.80,
//   lineItems: [
//     { description: 'Enterprise Software License...', originalAmount: 15000.00, convertedAmount: 22098.00 },
//     { description: 'Implementation Services',       originalAmount: 4000.00,  convertedAmount: 5892.80 },
//   ],
// }

// ─── Payment in Different Currency ────────────────────────────

// Customer pays via bank transfer in EUR
const payment = await invoiceService.recordPayment(finalized.id, {
  amount: 19000.00,               // Applied in invoice currency (EUR)
  paymentCurrency: 'EUR',
  paymentCurrencyAmount: 19000.00,
  fxRate: 1.0,                    // Same currency, no conversion
  paymentMethod: 'bank_transfer',
  referenceNumber: 'SEPA-2026-DE-12345',
  paidAt: new Date(),
  source: 'manual',
});

// ─── Handle FX Gain/Loss ──────────────────────────────────────

// If the payment arrives when the rate has changed:
const paymentWithFxDifference = await invoiceService.recordPayment('inv_fx_example', {
  amount: 19000.00,               // Invoice amount in EUR
  paymentCurrency: 'USD',         // Customer paid in USD
  paymentCurrencyAmount: 20520.00, // Actual USD amount received
  fxRate: 1.08,                   // USD/EUR rate at payment time
  paymentMethod: 'bank_transfer',
  paidAt: new Date(),
  source: 'manual',
  notes: 'FX rate at payment: 1 EUR = 1.08 USD (locked rate was 1.0765)',
});

// The system records the FX difference for accounting purposes
// FX gain/loss is surfaced in financial reports
```

---

## Error Codes

| Code | Name | HTTP | Description |
|------|------|------|-------------|
| `INV_001` | `INVOICE_NOT_FOUND` | 404 | Invoice with the specified ID does not exist or is not accessible |
| `INV_002` | `INVOICE_NOT_DRAFT` | 409 | Operation requires invoice to be in draft status |
| `INV_003` | `INVOICE_ALREADY_FINALIZED` | 409 | Invoice has already been finalized and cannot be modified |
| `INV_004` | `INVOICE_ALREADY_PAID` | 409 | Invoice is already fully paid; use credit note for refunds |
| `INV_005` | `INVOICE_ALREADY_VOID` | 409 | Invoice has already been voided |
| `INV_006` | `INVOICE_NO_LINE_ITEMS` | 422 | Cannot finalize an invoice with no line items |
| `INV_007` | `INVOICE_TOTAL_ZERO` | 422 | Cannot finalize an invoice with a zero or negative total |
| `INV_008` | `INVOICE_TAMPERED` | 409 | Invoice content hash does not match; possible tampering detected |
| `INV_009` | `INVOICE_VOID_PAID` | 409 | Cannot void a fully paid invoice; issue a credit note instead |
| `INV_010` | `INVOICE_DUE_DATE_PAST` | 422 | Due date cannot be in the past for new invoices |
| `INV_011` | `LINE_ITEM_NOT_FOUND` | 404 | Line item with the specified ID does not exist |
| `INV_012` | `LINE_ITEM_LIMIT_EXCEEDED` | 422 | Maximum number of line items per invoice exceeded (limit: 250) |
| `INV_013` | `LINE_ITEM_NEGATIVE_AMOUNT` | 422 | Line item amount cannot be negative; use credit notes for credits |
| `INV_014` | `PAYMENT_EXCEEDS_BALANCE` | 422 | Payment amount exceeds the remaining invoice balance |
| `INV_015` | `PAYMENT_NEGATIVE_AMOUNT` | 422 | Payment amount must be positive |
| `INV_016` | `PAYMENT_DUPLICATE` | 409 | A payment with this external ID has already been recorded |
| `INV_017` | `CREDIT_NOTE_EXCEEDS_INVOICE` | 422 | Credit note total cannot exceed the original invoice total |
| `INV_018` | `CREDIT_NOTE_NOT_FOUND` | 404 | Credit note with the specified ID does not exist |
| `INV_019` | `CREDIT_INSUFFICIENT_BALANCE` | 422 | Credit note does not have sufficient remaining balance for this application |
| `INV_020` | `CREDIT_CURRENCY_MISMATCH` | 422 | Credit note currency must match the target invoice currency |
| `INV_021` | `NUMBERING_SEQUENCE_NOT_FOUND` | 404 | No active numbering sequence found for this venture and document type |
| `INV_022` | `NUMBERING_SEQUENCE_LOCKED` | 503 | Numbering sequence is locked by another transaction; retry |
| `INV_023` | `TEMPLATE_NOT_FOUND` | 404 | Invoice template with the specified ID does not exist |
| `INV_024` | `TEMPLATE_RENDER_FAILED` | 500 | Failed to render invoice template (Handlebars compilation error) |
| `INV_025` | `PDF_GENERATION_FAILED` | 500 | Failed to generate PDF (Puppeteer error) |
| `INV_026` | `PDF_GENERATION_TIMEOUT` | 504 | PDF generation timed out (exceeded configured timeout) |
| `INV_027` | `PDF_SIGNING_FAILED` | 500 | Failed to apply digital signature to PDF |
| `INV_028` | `DELIVERY_FAILED` | 500 | Failed to deliver invoice via the specified channel |
| `INV_029` | `DELIVERY_BOUNCED` | 422 | Invoice delivery bounced; recipient address may be invalid |
| `INV_030` | `RECURRING_SCHEDULE_NOT_FOUND` | 404 | Recurring invoice schedule not found |
| `INV_031` | `RECURRING_SCHEDULE_INACTIVE` | 409 | Recurring schedule is paused or has reached its end date |
| `INV_032` | `RECURRING_MAX_OCCURRENCES` | 409 | Recurring schedule has reached its maximum number of occurrences |
| `INV_033` | `FX_RATE_UNAVAILABLE` | 503 | Cannot fetch FX rate for the specified currency pair |
| `INV_034` | `FX_RATE_STALE` | 422 | FX rate is older than the allowed staleness threshold |
| `INV_035` | `PAYMENT_LINK_EXPIRED` | 410 | Payment link has expired; request a new one |
| `INV_036` | `CUSTOMER_NO_BILLING_ADDRESS` | 422 | Customer does not have a billing address on file |
| `INV_037` | `TAX_CALCULATION_FAILED` | 500 | Tax calculation failed for the specified jurisdiction |
| `INV_038` | `VENTURE_INVOICING_DISABLED` | 403 | Invoicing is not enabled for this venture |
| `INV_039` | `RECONCILIATION_CONFLICT` | 409 | Payment has already been reconciled with a different invoice |
| `INV_040` | `BATCH_PARTIAL_FAILURE` | 207 | Some invoices in the batch operation failed; see individual results |

---

## Security

### Invoice Tamper Prevention

```typescript
/**
 * Content hashing ensures invoice integrity after finalization.
 * Any modification to a finalized invoice's financial data is detectable.
 */

import { createHash } from 'crypto';

/**
 * Compute a deterministic hash of all financial content on an invoice.
 * This hash is stored at finalization and verified before any read
 * operation that relies on invoice integrity (PDF download, payment, etc.).
 */
function hashInvoiceContent(invoice: Invoice): string {
  const payload = {
    invoiceNumber: invoice.invoiceNumber,
    customerId: invoice.customerId,
    currency: invoice.currency,
    subtotal: invoice.subtotal,
    discountTotal: invoice.discountTotal,
    taxTotal: invoice.taxTotal,
    total: invoice.total,
    taxBehavior: invoice.taxBehavior,
    reverseCharge: invoice.reverseCharge,
    withholdingTaxRate: invoice.withholdingTaxRate,
    dueDate: invoice.dueDate.toISOString(),
    lineItems: invoice.lineItems?.map(li => ({
      description: li.description,
      quantity: li.quantity,
      unitPrice: li.unitPrice,
      discountPercent: li.discountPercent,
      discountAmount: li.discountAmount,
      taxRate: li.taxRate,
      totalAmount: li.totalAmount,
    })),
    billingAddress: invoice.billingAddress,
  };

  const canonical = JSON.stringify(payload, Object.keys(payload).sort());
  return `sha256:${createHash('sha256').update(canonical).digest('hex')}`;
}

/**
 * Verify invoice integrity by comparing stored hash with computed hash.
 * Called before PDF download, payment processing, and any financial operation.
 */
async function verifyInvoiceIntegrity(invoice: Invoice): Promise<{
  valid: boolean;
  storedHash: string | null;
  computedHash: string;
}> {
  const computedHash = hashInvoiceContent(invoice);
  return {
    valid: invoice.contentHash === computedHash,
    storedHash: invoice.contentHash,
    computedHash,
  };
}

// ─── Middleware: Verify integrity before financial operations ──

const verifyIntegrityMiddleware = t.middleware(async ({ ctx, next, rawInput }) => {
  const input = rawInput as { invoiceId: string };
  if (input.invoiceId) {
    const invoice = await ctx.invoiceService.getById(input.invoiceId, {
      includeLineItems: true,
    });

    if (invoice && invoice.contentHash) {
      const integrity = await verifyInvoiceIntegrity(invoice);
      if (!integrity.valid) {
        logger.error('Invoice integrity check failed', {
          invoiceId: invoice.id,
          storedHash: integrity.storedHash,
          computedHash: integrity.computedHash,
        });
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Invoice content integrity check failed. The invoice may have been tampered with.',
          cause: 'INV_008',
        });
      }
    }
  }
  return next({ ctx });
});
```

### PDF Digital Signatures

```typescript
/**
 * PDF signing using PKCS#7 detached signatures.
 * Each venture can configure a signing certificate.
 * Signatures are embedded in the PDF for verification by any PDF reader.
 */

import { SignPdf } from '@signpdf/signpdf';
import { P12Signer } from '@signpdf/signer-p12';

interface PdfSigningConfig {
  /** PKCS#12 certificate file (base64-encoded) */
  p12Certificate: string;
  /** Certificate password */
  certificatePassword: string;
  /** Signer name (displayed in PDF reader) */
  signerName: string;
  /** Signing reason */
  reason: string;
  /** Location */
  location: string;
  /** Contact info */
  contactInfo: string;
}

async function signInvoicePdf(
  pdfBuffer: Buffer,
  config: PdfSigningConfig
): Promise<{
  signedPdf: Buffer;
  signatureHash: string;
  signedAt: Date;
}> {
  const p12Buffer = Buffer.from(config.p12Certificate, 'base64');

  const signer = new P12Signer(p12Buffer, {
    passphrase: config.certificatePassword,
  });

  const signedPdf = await new SignPdf().sign(pdfBuffer, signer, {
    reason: config.reason,
    contactInfo: config.contactInfo,
    name: config.signerName,
    location: config.location,
  });

  const signatureHash = createHash('sha256')
    .update(signedPdf)
    .digest('hex');

  return {
    signedPdf: Buffer.from(signedPdf),
    signatureHash: `sha256:${signatureHash}`,
    signedAt: new Date(),
  };
}
```

### Payment Link Security

```typescript
/**
 * Payment links use HMAC-signed tokens with configurable expiration.
 * Links are one-time-use for the exact invoice amount.
 */

import { createHmac, timingSafeEqual } from 'crypto';

interface PaymentLinkPayload {
  invoiceId: string;
  ventureId: string;
  amount: number;
  currency: string;
  expiresAt: number;    // Unix timestamp
}

function generatePaymentLink(
  payload: PaymentLinkPayload,
  secret: string
): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', secret)
    .update(data)
    .digest('base64url');

  const token = `${data}.${signature}`;
  return `https://pay.mcv.one/inv/${token}`;
}

function verifyPaymentLink(
  token: string,
  secret: string
): { valid: boolean; payload?: PaymentLinkPayload; error?: string } {
  const [data, signature] = token.split('.');

  if (!data || !signature) {
    return { valid: false, error: 'Malformed token' };
  }

  const expectedSignature = createHmac('sha256', secret)
    .update(data)
    .digest('base64url');

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedBuffer.length) {
    return { valid: false, error: 'Invalid signature' };
  }

  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return { valid: false, error: 'Invalid signature' };
  }

  const payload: PaymentLinkPayload = JSON.parse(
    Buffer.from(data, 'base64url').toString()
  );

  if (Date.now() > payload.expiresAt * 1000) {
    return { valid: false, error: 'Payment link expired' };
  }

  return { valid: true, payload };
}

// ─── Rate Limiting on Payment Links ───────────────────────────

// Payment link endpoints are rate-limited to prevent brute-force
// token guessing and payment fraud:
//
// - 10 requests per minute per IP
// - 3 failed verification attempts per link → link is invalidated
// - Geo-velocity check: flag if payment originates from a different
//   country than the customer's billing address

// ─── Audit Trail ──────────────────────────────────────────────

// Every payment link access is logged:
// - IP address
// - User agent
// - Geolocation
// - Verification result
// - Timestamp
//
// Suspicious patterns trigger alerts to the venture admin.
```

### Row-Level Security Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                    RLS POLICY MATRIX                             │
│                                                                 │
│  Table                    │ Policy                              │
│  ─────────────────────────┼─────────────────────────────────── │
│  invoices                 │ venture_id ∈ user's ventures        │
│                           │ + org_id = user's org               │
│                           │ + customer self-service (non-draft) │
│  invoice_line_items       │ via parent invoice RLS              │
│  invoice_payments         │ via parent invoice RLS              │
│  credit_notes             │ venture_id ∈ user's ventures        │
│  credit_note_applications │ via parent credit note RLS          │
│  recurring_schedules      │ venture_id ∈ user's ventures        │
│  invoice_templates        │ venture_id ∈ user's ventures        │
│  invoice_deliveries       │ via parent invoice RLS              │
│  numbering_sequences      │ venture_id ∈ user's ventures        │
│  invoice_reminders        │ via parent invoice RLS              │
│  aging_snapshots          │ venture_id + billing role required  │
│                                                                 │
│  Mutation Policies:                                             │
│  • Create/Update: owner, admin, or billing role                │
│  • Finalize/Void: owner, admin, or billing role                │
│  • Delete (drafts only): owner, admin, or billing role         │
│  • Record Payment: owner, admin, billing, or finance role      │
│  • View: any venture member + customer self-service            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `INVOICE_DATABASE_URL` | Yes | — | Supabase PostgreSQL connection string |
| `INVOICE_STORAGE_BUCKET` | Yes | — | Supabase Storage bucket for PDF files |
| `INVOICE_STORAGE_URL` | Yes | — | Base URL for the storage service |
| `RESEND_API_KEY` | Yes | — | Resend API key for email delivery |
| `RESEND_FROM_EMAIL` | No | `invoices@mcv.one` | Default sender email address |
| `RESEND_REPLY_TO_EMAIL` | No | — | Reply-to email (overridable per venture) |
| `PAYMENT_LINK_SECRET` | Yes | — | HMAC secret for payment link token signing |
| `PAYMENT_LINK_BASE_URL` | No | `https://pay.mcv.one` | Base URL for payment links |
| `PAYMENT_LINK_EXPIRY_HOURS` | No | `168` | Default payment link expiry (7 days) |
| `PDF_SIGNING_ENABLED` | No | `false` | Enable PDF digital signatures |
| `PDF_SIGNING_P12_PATH` | Cond. | — | Path to PKCS#12 certificate (required if signing enabled) |
| `PDF_SIGNING_PASSWORD` | Cond. | — | Certificate password (required if signing enabled) |
| `PDF_GENERATION_TIMEOUT_MS` | No | `30000` | Maximum time for PDF generation |
| `PDF_PUPPETEER_EXECUTABLE` | No | — | Path to Chromium executable (auto-detected if not set) |
| `PDF_PUPPETEER_ARGS` | No | `--no-sandbox` | Additional Puppeteer launch arguments |
| `INVOICE_REMINDER_ENABLED` | No | `true` | Enable automatic payment reminders |
| `INVOICE_REMINDER_PRE_DUE_DAYS` | No | `3` | Days before due date to send pre-due reminder |
| `INVOICE_REMINDER_CADENCE_DAYS` | No | `7,14,30` | Comma-separated overdue reminder cadence |
| `INVOICE_MAX_LINE_ITEMS` | No | `250` | Maximum line items per invoice |
| `INVOICE_DEFAULT_LOCALE` | No | `en-US` | Default locale for new invoices |
| `INVOICE_DEFAULT_CURRENCY` | No | `USD` | Default currency for new invoices |
| `INVOICE_DEFAULT_PAYMENT_TERMS` | No | `30` | Default payment terms in days |
| `FX_RATE_PROVIDER` | No | `ecb` | FX rate provider (`ecb`, `openexchangerates`, `custom`) |
| `FX_RATE_API_KEY` | Cond. | — | API key for FX rate provider (if not ECB) |
| `FX_RATE_CACHE_TTL_MINUTES` | No | `60` | How long to cache FX rates |
| `FX_RATE_MAX_STALENESS_HOURS` | No | `24` | Maximum age of FX rate before rejection |
| `AGING_REPORT_CRON` | No | `0 6 * * 1` | Cron schedule for automatic aging reports (Mon 6am) |
| `RECURRING_INVOICE_CRON` | No | `0 */1 * * *` | Cron schedule for recurring invoice processing |
| `OVERDUE_CHECK_CRON` | No | `0 8 * * *` | Cron schedule for marking overdue invoices |
| `INVOICE_WEBHOOK_URL` | No | — | Webhook URL for invoice lifecycle events |
| `INVOICE_WEBHOOK_SECRET` | No | — | HMAC secret for webhook payload signing |

---

## Dependencies

### Runtime Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `drizzle-orm` | `^0.34` | Database ORM and query builder |
| `@trpc/server` | `^11` | Type-safe API router |
| `zod` | `^3.23` | Schema validation |
| `puppeteer` | `^23` | Headless Chrome for PDF generation |
| `@signpdf/signpdf` | `^4` | PDF digital signature application |
| `@signpdf/signer-p12` | `^4` | PKCS#12 certificate signer |
| `handlebars` | `^4.7` | Template engine for invoice HTML |
| `resend` | `^4` | Email delivery service client |
| `date-fns` | `^4` | Date arithmetic and formatting |
| `qrcode` | `^1.5` | QR code generation for payment links |
| `dinero.js` | `^2` | Precise monetary calculations |
| `ioredis` | `^5` | Redis client for caching FX rates and sequences |
| `pino` | `^9` | Structured logging |
| `nanoid` | `^5` | Short ID generation |

### Internal Dependencies

| Module | Purpose |
|--------|---------|
| `@mcv/core/auth` | Authentication and authorization context |
| `@mcv/core/rls` | Row-level security policy enforcement |
| `@mcv/core/events` | Event bus for lifecycle event publishing |
| `@mcv/core/storage` | Supabase Storage integration for PDF uploads |
| `@mcv/core/cache` | Redis caching layer |
| `@mcv/core/queue` | Background job queue for PDF generation and delivery |
| `@mcv/core/i18n` | Internationalization and localization |
| `@mcv/commerce/orders` | Order data for auto-invoice generation |
| `@mcv/commerce/subscriptions` | Subscription data for recurring invoicing |
| `@mcv/commerce/customers` | Customer profile and billing address data |
| `@mcv/commerce/tax` | Tax calculation engine |
| `@mcv/commerce/payments` | Payment provider integrations |
| `@mcv/platform/ventures` | Venture configuration and settings |
| `@mcv/platform/notifications` | Multi-channel notification delivery |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `vitest` | `^2` | Test runner |
| `@faker-js/faker` | `^9` | Test data generation |
| `testcontainers` | `^10` | PostgreSQL containers for integration tests |
| `msw` | `^2` | Mock Service Worker for API mocking |
| `pdf-parse` | `^1.1` | PDF content extraction for test assertions |

---

## Testing

### Test Structure

```
src/
├── __tests__/
│   ├── unit/
│   │   ├── calculations.test.ts          # Total, discount, tax calculations
│   │   ├── numbering.test.ts             # Invoice number formatting
│   │   ├── payment-links.test.ts         # Payment link generation/verification
│   │   ├── aging.test.ts                 # Aging bucket computation
│   │   ├── currency.test.ts              # Currency conversion utilities
│   │   ├── integrity.test.ts             # Content hash computation
│   │   └── tax-validation.test.ts        # Tax compliance validation
│   │
│   ├── integration/
│   │   ├── invoice.service.test.ts       # Full CRUD lifecycle
│   │   ├── finalization.test.ts          # Finalization pipeline
│   │   ├── payment-reconciliation.test.ts # Payment matching & application
│   │   ├── credit-note.test.ts           # Credit note issuance & application
│   │   ├── recurring.test.ts             # Recurring schedule processing
│   │   ├── numbering-sequence.test.ts    # Gap-free numbering under concurrency
│   │   ├── pdf-generation.test.ts        # Puppeteer PDF rendering
│   │   ├── email-delivery.test.ts        # Resend email delivery
│   │   ├── aging-report.test.ts          # Aging report generation
│   │   ├── multi-currency.test.ts        # FX rate locking & conversion
│   │   └── rls.test.ts                   # Row-level security enforcement
│   │
│   └── e2e/
│       ├── invoice-lifecycle.test.ts     # Full draft→paid lifecycle
│       ├── stripe-webhook.test.ts        # Stripe payment webhook flow
│       └── recurring-billing.test.ts     # End-to-end recurring billing
│
├── __fixtures__/
│   ├── invoices.ts                       # Sample invoice data
│   ├── templates.ts                      # Sample templates
│   ├── customers.ts                      # Sample customer data
│   └── payments.ts                       # Sample payment data
│
└── __mocks__/
    ├── puppeteer.ts                      # Puppeteer mock for unit tests
    ├── resend.ts                         # Resend API mock
    └── storage.ts                        # Storage service mock
```

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { calculateInvoiceTotals } from '../utils/calculations';
import { hashInvoiceContent } from '../utils/integrity';
import { formatInvoiceNumber } from '../utils/numbering';
import { computeAgingBuckets } from '../utils/aging';

describe('calculateInvoiceTotals', () => {
  it('should compute subtotal, discount, tax, and total correctly', () => {
    const lineItems = [
      { quantity: 10, unitPrice: 100.00, discountPercent: 10, taxRate: 0.13 },
      { quantity: 5,  unitPrice: 50.00,  discountPercent: 0,  taxRate: 0.13 },
      { quantity: 1,  unitPrice: 200.00, discountPercent: 25, taxRate: 0.13 },
    ];

    const totals = calculateInvoiceTotals(lineItems, { taxBehavior: 'exclusive' });

    expect(totals.subtotal).toBe(1450.00);         // 1000 + 250 + 200
    expect(totals.discountTotal).toBe(150.00);      // 100 + 0 + 50
    expect(totals.netBeforeTax).toBe(1300.00);      // 1450 - 150
    expect(totals.taxTotal).toBe(169.00);           // 1300 * 0.13
    expect(totals.total).toBe(1469.00);             // 1300 + 169
  });

  it('should handle tax-inclusive pricing', () => {
    const lineItems = [
      { quantity: 1, unitPrice: 113.00, discountPercent: 0, taxRate: 0.13 },
    ];

    const totals = calculateInvoiceTotals(lineItems, { taxBehavior: 'inclusive' });

    expect(totals.subtotal).toBe(100.00);      // 113 / 1.13
    expect(totals.taxTotal).toBe(13.00);       // 113 - 100
    expect(totals.total).toBe(113.00);         // Original inclusive price
  });

  it('should apply withholding tax', () => {
    const lineItems = [
      { quantity: 1, unitPrice: 10000.00, discountPercent: 0, taxRate: 0 },
    ];

    const totals = calculateInvoiceTotals(lineItems, {
      taxBehavior: 'exclusive',
      withholdingTaxRate: 0.15,
    });

    expect(totals.subtotal).toBe(10000.00);
    expect(totals.withholdingTaxAmount).toBe(1500.00);
    expect(totals.total).toBe(8500.00);         // 10000 - 1500
  });

  it('should handle zero-quantity line items gracefully', () => {
    const lineItems = [
      { quantity: 0, unitPrice: 100.00, discountPercent: 0, taxRate: 0.13 },
    ];

    const totals = calculateInvoiceTotals(lineItems, { taxBehavior: 'exclusive' });
    expect(totals.total).toBe(0);
  });

  it('should use precise decimal arithmetic (no floating point errors)', () => {
    const lineItems = [
      { quantity: 3, unitPrice: 0.1, discountPercent: 0, taxRate: 0.07 },
    ];

    const totals = calculateInvoiceTotals(lineItems, { taxBehavior: 'exclusive' });
    // 3 * 0.1 = 0.3 (not 0.30000000000000004)
    expect(totals.subtotal).toBe(0.30);
    expect(totals.taxTotal).toBe(0.02);  // Rounded
    expect(totals.total).toBe(0.32);
  });
});

describe('formatInvoiceNumber', () => {
  it('should format with year prefix and zero-padded number', () => {
    expect(formatInvoiceNumber({
      prefix: 'INV-{YEAR}-',
      suffix: '',
      separator: '',
      value: 42,
      minDigits: 5,
      date: new Date('2026-03-15'),
    })).toBe('INV-2026-00042');
  });

  it('should support month variable', () => {
    expect(formatInvoiceNumber({
      prefix: 'INV-{YEAR}{MONTH}-',
      suffix: '',
      separator: '',
      value: 7,
      minDigits: 4,
      date: new Date('2026-03-15'),
    })).toBe('INV-202603-0007');
  });

  it('should support venture prefix', () => {
    expect(formatInvoiceNumber({
      prefix: '{VENTURE}-',
      suffix: '',
      separator: '',
      value: 1,
      minDigits: 6,
      date: new Date('2026-01-01'),
      ventureCode: 'ACME',
    })).toBe('ACME-000001');
  });
});

describe('computeAgingBuckets', () => {
  it('should assign invoices to correct buckets', () => {
    const invoices = [
      { id: '1', dueDate: new Date('2026-01-25'), amountDue: 1000 },  // 14 days
      { id: '2', dueDate: new Date('2025-12-20'), amountDue: 2000 },  // 50 days
      { id: '3', dueDate: new Date('2025-11-01'), amountDue: 3000 },  // 99 days
      { id: '4', dueDate: new Date('2025-08-01'), amountDue: 500 },   // 191 days
    ];

    const buckets = computeAgingBuckets(invoices, {
      asOfDate: new Date('2026-02-08'),
      boundaries: [30, 60, 90, 120],
    });

    expect(buckets.current.amount).toBe(1000);
    expect(buckets.bucket1.amount).toBe(2000);   // 31-60
    expect(buckets.bucket2.amount).toBe(3000);   // 61-90
    expect(buckets.bucket3.amount).toBe(0);      // 91-120
    expect(buckets.bucket4Plus.amount).toBe(500); // 120+
  });
});

describe('hashInvoiceContent', () => {
  it('should produce deterministic hashes', () => {
    const invoice = createTestInvoice();

    const hash1 = hashInvoiceContent(invoice);
    const hash2 = hashInvoiceContent(invoice);

    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  it('should detect content changes', () => {
    const invoice = createTestInvoice();
    const hash1 = hashInvoiceContent(invoice);

    const modified = { ...invoice, total: invoice.total + 0.01 };
    const hash2 = hashInvoiceContent(modified);

    expect(hash1).not.toBe(hash2);
  });
});
```

### Integration Test Example

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { InvoiceService } from '../services/invoice.service';
import { CreditNoteService } from '../services/credit-note.service';
import { createTestContext } from '../__fixtures__/context';

describe('Invoice Lifecycle Integration', () => {
  let container: StartedPostgreSqlContainer;
  let invoiceService: InvoiceService;
  let creditNoteService: CreditNoteService;
  let ctx: TestContext;

  beforeAll(async () => {
    container = await new PostgreSqlContainer()
      .withDatabase('invoicing_test')
      .start();

    ctx = await createTestContext({
      databaseUrl: container.getConnectionUri(),
    });

    invoiceService = ctx.resolve(InvoiceService);
    creditNoteService = ctx.resolve(CreditNoteService);

    await ctx.runMigrations();
    await ctx.seedTestData();
  }, 60000);

  afterAll(async () => {
    await container.stop();
  });

  beforeEach(async () => {
    await ctx.resetTestData();
  });

  it('should complete full draft → finalize → pay lifecycle', async () => {
    // 1. Create draft
    const draft = await invoiceService.create({
      ventureId: ctx.testVenture.id,
      customerId: ctx.testCustomer.id,
      currency: 'USD',
      dueDate: addDays(new Date(), 30),
      lineItems: [
        { description: 'Service A', quantity: 1, unitPrice: 500, taxRate: 0 },
        { description: 'Service B', quantity: 2, unitPrice: 250, taxRate: 0 },
      ],
    });

    expect(draft.status).toBe('draft');
    expect(draft.total).toBe(1000);
    expect(draft.invoiceNumber).toBeNull();

    // 2. Finalize
    const finalized = await invoiceService.finalize(draft.id, {
      sendEmail: false,  // Skip email in tests
    });

    expect(finalized.status).toBe('sent');
    expect(finalized.invoiceNumber).toMatch(/^INV-\d{4}-\d{5}$/);
    expect(finalized.contentHash).toBeDefined();
    expect(finalized.pdfUrl).toBeDefined();
    expect(finalized.finalizedAt).toBeDefined();

    // 3. Record partial payment
    const payment1 = await invoiceService.recordPayment(finalized.id, {
      amount: 600,
      paymentCurrency: 'USD',
      paymentCurrencyAmount: 600,
      paymentMethod: 'bank_transfer',
      paidAt: new Date(),
      source: 'manual',
    });

    const afterPartial = await invoiceService.getById(finalized.id);
    expect(afterPartial?.status).toBe('partially_paid');
    expect(afterPartial?.amountPaid).toBe(600);
    expect(afterPartial?.amountDue).toBe(400);

    // 4. Record remaining payment
    const payment2 = await invoiceService.recordPayment(finalized.id, {
      amount: 400,
      paymentCurrency: 'USD',
      paymentCurrencyAmount: 400,
      paymentMethod: 'credit_card',
      paidAt: new Date(),
      source: 'manual',
    });

    const afterFull = await invoiceService.getById(finalized.id);
    expect(afterFull?.status).toBe('paid');
    expect(afterFull?.amountPaid).toBe(1000);
    expect(afterFull?.amountDue).toBe(0);
    expect(afterFull?.paidDate).toBeDefined();
  });

  it('should prevent modification of finalized invoices', async () => {
    const draft = await invoiceService.create({
      ventureId: ctx.testVenture.id,
      customerId: ctx.testCustomer.id,
      currency: 'USD',
      dueDate: addDays(new Date(), 30),
      lineItems: [
        { description: 'Test', quantity: 1, unitPrice: 100, taxRate: 0 },
      ],
    });

    await invoiceService.finalize(draft.id);

    // Attempt to update should throw
    await expect(invoiceService.update(draft.id, {
      memo: 'Changed memo',
    })).rejects.toThrow('INV_003');

    // Attempt to add line item should throw
    await expect(invoiceService.addLineItem(draft.id, {
      description: 'New item',
      quantity: 1,
      unitPrice: 50,
      taxRate: 0,
    })).rejects.toThrow('INV_003');

    // Attempt to delete should throw
    await expect(invoiceService.delete(draft.id))
      .rejects.toThrow('INV_003');
  });

  it('should enforce RLS isolation between ventures', async () => {
    const invoice = await invoiceService.create({
      ventureId: ctx.testVenture.id,
      customerId: ctx.testCustomer.id,
      currency: 'USD',
      dueDate: addDays(new Date(), 30),
      lineItems: [
        { description: 'Test', quantity: 1, unitPrice: 100, taxRate: 0 },
      ],
    });

    // Switch to a different venture context
    const otherCtx = ctx.asVenture(ctx.otherVenture.id);
    const otherInvoiceService = otherCtx.resolve(InvoiceService);

    // Should not be able to see the invoice
    const result = await otherInvoiceService.getById(invoice.id);
    expect(result).toBeNull();

    // Should not appear in list
    const list = await otherInvoiceService.list({ limit: 100 });
    expect(list.items.find(i => i.id === invoice.id)).toBeUndefined();
  });

  it('should handle credit note lifecycle correctly', async () => {
    // Create and pay an invoice
    const invoice = await invoiceService.create({
      ventureId: ctx.testVenture.id,
      customerId: ctx.testCustomer.id,
      currency: 'USD',
      dueDate: addDays(new Date(), 30),
      lineItems: [
        { description: 'Widget', quantity: 10, unitPrice: 50, taxRate: 0.1 },
      ],
    });

    await invoiceService.finalize(invoice.id);
    await invoiceService.recordPayment(invoice.id, {
      amount: 550,
      paymentCurrency: 'USD',
      paymentCurrencyAmount: 550,
      paymentMethod: 'credit_card',
      paidAt: new Date(),
      source: 'manual',
    });

    // Issue credit note for 3 defective units
    const creditNote = await creditNoteService.create({
      invoiceId: invoice.id,
      reason: 'product_unsatisfactory',
      lineItems: [
        { description: 'Widget — Defective', quantity: 3, unitPrice: 50, taxRate: 0.1 },
      ],
    });

    expect(creditNote.total).toBe(165);  // 3 × 50 × 1.1
    expect(creditNote.status).toBe('draft');

    // Issue it
    await creditNoteService.issue(creditNote.id);

    // Apply to a new invoice
    const nextInvoice = await invoiceService.create({
      ventureId: ctx.testVenture.id,
      customerId: ctx.testCustomer.id,
      currency: 'USD',
      dueDate: addDays(new Date(), 30),
      lineItems: [
        { description: 'New Widgets', quantity: 5, unitPrice: 50, taxRate: 0.1 },
      ],
    });

    await invoiceService.finalize(nextInvoice.id);

    // Apply credit
    await creditNoteService.apply({
      creditNoteId: creditNote.id,
      invoiceId: nextInvoice.id,
      amount: 165,
    });

    const updated = await invoiceService.getById(nextInvoice.id);
    expect(updated?.amountCredited).toBe(165);
    expect(updated?.amountDue).toBe(110);  // 275 - 165
  });

  it('should generate gap-free invoice numbers under concurrency', async () => {
    const invoiceIds: string[] = [];

    // Create 20 invoices
    for (let i = 0; i < 20; i++) {
      const inv = await invoiceService.create({
        ventureId: ctx.testVenture.id,
        customerId: ctx.testCustomer.id,
        currency: 'USD',
        dueDate: addDays(new Date(), 30),
        lineItems: [
          { description: `Item ${i}`, quantity: 1, unitPrice: 100, taxRate: 0 },
        ],
      });
      invoiceIds.push(inv.id);
    }

    // Finalize all concurrently
    const results = await Promise.all(
      invoiceIds.map(id => invoiceService.finalize(id, { sendEmail: false }))
    );

    // Extract numbers and verify gap-free
    const numbers = results
      .map(r => {
        const match = r.invoiceNumber!.match(/(\d+)$/);
        return match ? parseInt(match[1]) : 0;
      })
      .sort((a, b) => a - b);

    // Should be consecutive with no gaps
    for (let i = 1; i < numbers.length; i++) {
      expect(numbers[i]).toBe(numbers[i - 1] + 1);
    }
  }, 30000);
});
```

### Test Coverage Requirements

| Category | Minimum Coverage | Key Scenarios |
|----------|-----------------|---------------|
| **Invoice CRUD** | 95% | Create, read, update, delete, list with filters |
| **Lifecycle Transitions** | 100% | Every valid state transition, invalid transition rejection |
| **Calculations** | 100% | Totals, discounts, tax (inclusive/exclusive), withholding, rounding |
| **Numbering** | 95% | Format patterns, year reset, gap-free under concurrency |
| **Payment Recording** | 95% | Full, partial, overpayment, multi-currency, reconciliation |
| **Credit Notes** | 95% | Create, issue, apply (full/partial), balance tracking |
| **PDF Generation** | 80% | Template rendering, page layout, signature verification |
| **Email Delivery** | 80% | Send, retry, bounce handling, reminder scheduling |
| **Aging Reports** | 90% | Bucket assignment, scoring, comparison, snapshot persistence |
| **RLS** | 100% | Venture isolation, org isolation, customer self-service |
| **Security** | 100% | Content hashing, payment link signing/verification, tamper detection |
| **Error Handling** | 90% | All error codes triggered with correct HTTP status |

---

*Last updated: 2026-02-08*  
*Module version: 0.1.0*  
*Documentation version: 1.0.0*