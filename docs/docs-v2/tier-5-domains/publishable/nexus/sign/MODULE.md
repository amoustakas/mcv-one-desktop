# @mcv/nexus/sign

> **Electronic Signature Platform** — Document preparation, signing workflows, audit trails, and legal compliance for the MCV.ONE ecosystem.

**Package:** `@mcv/nexus/sign`
**Layer:** Tier 5 — Domain Module
**Parent:** `@mcv/nexus`
**Status:** Stable
**Since:** 0.9.0

---

## Table of Contents

- [Purpose](#purpose)
- [Exports](#exports)
- [Architecture](#architecture)
  - [Signing Flow](#signing-flow)
  - [Audit Trail Architecture](#audit-trail-architecture)
  - [PDF Processing Pipeline](#pdf-processing-pipeline)
  - [Multi-Tenant Isolation](#multi-tenant-isolation)
- [Core Interfaces](#core-interfaces)
  - [SignService](#signservice)
  - [Envelope](#envelope)
  - [Document](#document)
  - [SignatureField](#signaturefield)
  - [Signer](#signer)
  - [SigningSession](#signingsession)
  - [AuditTrail](#audittrail)
  - [SignTemplate](#signtemplate)
  - [BulkSend](#bulksend)
  - [Certificate](#certificate)
  - [SignatureValue](#signaturevalue)
  - [SignerAuthentication](#signerauthentication)
  - [EmbeddedSigningConfig](#embeddedsigningconfig)
  - [WebhookEvent](#webhookevent)
- [Database Schemas](#database-schemas)
  - [envelopes](#envelopes)
  - [envelope_documents](#envelope_documents)
  - [signature_fields](#signature_fields)
  - [signers](#signers)
  - [signing_sessions](#signing_sessions)
  - [audit_events](#audit_events)
  - [sign_templates](#sign_templates)
  - [template_fields](#template_fields)
  - [bulk_sends](#bulk_sends)
  - [bulk_send_recipients](#bulk_send_recipients)
  - [certificates](#certificates)
- [Code Examples](#code-examples)
  - [1. Create and Send an Envelope](#1-create-and-send-an-envelope)
  - [2. Add Signature Fields to a Document](#2-add-signature-fields-to-a-document)
  - [3. Embedded Signing Experience](#3-embedded-signing-experience)
  - [4. Create and Use a Template](#4-create-and-use-a-template)
  - [5. Bulk Send from Template](#5-bulk-send-from-template)
  - [6. Verify Audit Trail Integrity](#6-verify-audit-trail-integrity)
  - [7. Handle Webhook Events](#7-handle-webhook-events)
  - [8. Digital Certificate-Based Signing (PKI)](#8-digital-certificate-based-signing-pki)
- [Error Codes](#error-codes)
- [Security](#security)
  - [Document Security](#document-security)
  - [Signer Authentication](#signer-authentication-1)
  - [Cryptographic Integrity](#cryptographic-integrity)
  - [Multi-Tenant Isolation](#multi-tenant-isolation-1)
  - [Compliance Framework](#compliance-framework)
- [Environment Variables](#environment-variables)
- [Dependencies](#dependencies)
- [Testing](#testing)

---

## Purpose

`@mcv/nexus/sign` provides a complete electronic signature platform within MCV.ONE. It enables organizations to prepare documents for signing, manage complex multi-party signing workflows, capture legally binding signatures, and maintain tamper-evident audit trails that satisfy global regulatory requirements.

### Why This Module Exists

Electronic signatures are a critical business workflow touching contracts, HR onboarding, procurement, legal agreements, and compliance documentation. Rather than integrating third-party signature platforms (DocuSign, Adobe Sign) with their per-envelope costs and data sovereignty concerns, `@mcv/nexus/sign` provides a first-party solution that:

1. **Keeps data sovereign** — Documents never leave your Supabase infrastructure. No third-party has access to your contracts.
2. **Eliminates per-envelope costs** — No per-signature or per-envelope fees. Your signing volume is bounded only by your infrastructure.
3. **Integrates natively** — Deep integration with `@mcv/nexus/docs`, `@mcv/nexus/crm`, `@mcv/nexus/hr`, and other MCV.ONE modules.
4. **Satisfies compliance** — Built-in support for ESIGN Act, UETA, eIDAS (EU), with tamper-evident audit trails and optional PKI signing.
5. **Supports embedding** — White-label signing experiences embedded directly in your application via iframe or modal.

### Core Capabilities

| Capability | Description |
|---|---|
| **Document Preparation** | Upload PDFs, add signature/text/date/initials/checkbox fields with drag-and-drop placement |
| **Signing Workflow** | Sequential or parallel signing order, multiple signers, CC recipients, reminders, expiration |
| **Signature Types** | Draw, type (font rendering), upload image, digital certificate (PKI) |
| **Authentication** | Email verification, SMS OTP, knowledge-based authentication (KBA), government ID |
| **Templates** | Reusable document templates with pre-placed fields, template variables, bulk send |
| **Audit Trail** | Tamper-evident log with IP, timestamps, device info, geolocation, certificate of completion |
| **Legal Compliance** | ESIGN Act, UETA, eIDAS, SOC 2; long-term validation (LTV), timestamp authority (TSA) |
| **API Integration** | Programmatic envelope creation, webhook events for all lifecycle stages |
| **Embedded Signing** | In-app iframe/modal signing, branded pages, mobile-optimized responsive design |
| **Bulk Send** | CSV-based bulk sending, merge fields, status tracking, bulk reminders |

---

## Exports

```typescript
// === Primary Service ===
export { SignService } from './services/sign.service';
export { createSignService } from './services/sign.service.factory';

// === Envelope Management ===
export { EnvelopeService } from './services/envelope.service';
export { DocumentService } from './services/document.service';
export { FieldService } from './services/field.service';

// === Signing ===
export { SigningService } from './services/signing.service';
export { SigningSessionManager } from './services/signing-session.manager';
export { SignatureRenderer } from './services/signature-renderer.service';
export { EmbeddedSigningService } from './services/embedded-signing.service';

// === Authentication ===
export { SignerAuthService } from './services/signer-auth.service';
export { OtpVerificationService } from './services/otp-verification.service';
export { KbaService } from './services/kba.service';
export { IdVerificationService } from './services/id-verification.service';

// === Templates ===
export { TemplateService } from './services/template.service';
export { BulkSendService } from './services/bulk-send.service';

// === Audit & Compliance ===
export { AuditTrailService } from './services/audit-trail.service';
export { CertificateOfCompletionService } from './services/certificate-of-completion.service';
export { ComplianceService } from './services/compliance.service';

// === PKI / Cryptography ===
export { PkiSigningService } from './services/pki-signing.service';
export { TimestampAuthorityClient } from './services/tsa-client.service';
export { LtvService } from './services/ltv.service';

// === PDF Processing ===
export { PdfProcessor } from './services/pdf-processor.service';
export { PdfFieldRenderer } from './services/pdf-field-renderer.service';
export { PdfFlattener } from './services/pdf-flattener.service';

// === Webhooks ===
export { SignWebhookService } from './services/sign-webhook.service';
export { SignWebhookRouter } from './routers/sign-webhook.router';

// === tRPC Routers ===
export { signRouter } from './routers/sign.router';
export { envelopeRouter } from './routers/envelope.router';
export { templateRouter } from './routers/template.router';
export { signingRouter } from './routers/signing.router';
export { bulkSendRouter } from './routers/bulk-send.router';

// === Database Schema ===
export {
  envelopes,
  envelopeDocuments,
  signatureFields,
  signers,
  signingSessions,
  auditEvents,
  signTemplates,
  templateFields,
  bulkSends,
  bulkSendRecipients,
  certificates,
} from './schema';

// === Types ===
export type {
  Envelope,
  EnvelopeStatus,
  EnvelopeCreateInput,
  EnvelopeUpdateInput,
  Document,
  DocumentUploadInput,
  SignatureField,
  SignatureFieldType,
  FieldPlacement,
  Signer,
  SignerRole,
  SignerStatus,
  SigningSession,
  SigningSessionToken,
  AuditTrail,
  AuditEvent,
  AuditEventType,
  SignTemplate,
  TemplateField,
  TemplateVariable,
  BulkSend,
  BulkSendRecipient,
  BulkSendStatus,
  Certificate,
  CertificateOfCompletion,
  SignatureValue,
  SignatureType,
  SignerAuthentication,
  AuthenticationMethod,
  EmbeddedSigningConfig,
  EmbeddedSigningUrl,
  WebhookEvent,
  WebhookEventType,
  SignWebhookPayload,
  PkiSignatureOptions,
  TimestampToken,
  LtvData,
  MergeField,
  SignModuleConfig,
} from './types';

// === Constants ===
export {
  ENVELOPE_STATUSES,
  FIELD_TYPES,
  SIGNATURE_TYPES,
  SIGNER_STATUSES,
  AUTHENTICATION_METHODS,
  WEBHOOK_EVENT_TYPES,
  AUDIT_EVENT_TYPES,
  SIGN_ERROR_CODES,
  DEFAULT_EXPIRATION_DAYS,
  DEFAULT_REMINDER_DAYS,
  MAX_SIGNERS_PER_ENVELOPE,
  MAX_DOCUMENTS_PER_ENVELOPE,
  MAX_FIELDS_PER_DOCUMENT,
} from './constants';

// === Validators ===
export {
  envelopeCreateSchema,
  envelopeUpdateSchema,
  fieldPlacementSchema,
  signerCreateSchema,
  templateCreateSchema,
  bulkSendSchema,
  webhookConfigSchema,
  embeddedSigningSchema,
} from './validators';
```

---

## Architecture

### Signing Flow

The signing flow follows an **envelope model** — a logical container that groups one or more documents with their associated signers, fields, and workflow rules.

```
┌──────────────────────────────────────────────────────────────────────┐
│                        ENVELOPE LIFECYCLE                            │
│                                                                      │
│  ┌─────────┐    ┌──────────┐    ┌────────┐    ┌───────────┐        │
│  │  DRAFT  │───▶│   SENT   │───▶│ ACTIVE │───▶│ COMPLETED │        │
│  └─────────┘    └──────────┘    └────────┘    └───────────┘        │
│       │              │              │               │                │
│       │              │              │               ▼                │
│       ▼              ▼              ▼         ┌───────────┐         │
│  ┌─────────┐   ┌──────────┐  ┌─────────┐    │  SEALED   │         │
│  │ DELETED │   │  VOIDED  │  │ DECLINED│    └───────────┘         │
│  └─────────┘   └──────────┘  └─────────┘         │                │
│                      │                             ▼                │
│                      ▼                       ┌───────────┐         │
│                 ┌──────────┐                 │ ARCHIVED  │         │
│                 │ EXPIRED  │                 └───────────┘         │
│                 └──────────┘                                        │
└──────────────────────────────────────────────────────────────────────┘
```

#### State Definitions

| State | Description |
|---|---|
| `draft` | Envelope is being prepared. Documents and fields can be added/modified. |
| `sent` | Envelope has been dispatched to signers. Notifications sent. |
| `active` | At least one signer has viewed or interacted with the envelope. |
| `completed` | All signers have completed their required actions. |
| `sealed` | Completed envelope has been cryptographically sealed with final audit trail. |
| `archived` | Sealed envelope moved to long-term storage. |
| `declined` | A signer has declined to sign. Workflow halted. |
| `voided` | Sender has voided the envelope before completion. |
| `expired` | Envelope passed its expiration date without completion. |
| `deleted` | Draft envelope was discarded. Soft-deleted; recoverable within retention period. |

#### Detailed Signing Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    SIGNING FLOW (PER SIGNER)                     │
│                                                                   │
│  1. NOTIFICATION                                                  │
│     │  Email/SMS sent with unique signing link                   │
│     ▼                                                             │
│  2. AUTHENTICATION                                                │
│     │  Verify identity (email, OTP, KBA, Gov ID)                 │
│     ▼                                                             │
│  3. SESSION CREATION                                              │
│     │  Generate SigningSession with JWT token                    │
│     │  Record: IP, User-Agent, device fingerprint                │
│     ▼                                                             │
│  4. DOCUMENT REVIEW                                               │
│     │  Signer views all documents in order                       │
│     │  Audit: "document_viewed" event per document               │
│     ▼                                                             │
│  5. FIELD COMPLETION                                              │
│     │  For each assigned field:                                  │
│     │    ├─ Signature → draw/type/upload/certificate             │
│     │    ├─ Initials  → draw/type                                │
│     │    ├─ Text      → free text input                          │
│     │    ├─ Date      → date picker                              │
│     │    └─ Checkbox  → check/uncheck                            │
│     │  Audit: "field_completed" event per field                  │
│     ▼                                                             │
│  6. SIGNING CONFIRMATION                                          │
│     │  "Agree & Sign" button with legal consent text             │
│     │  Audit: "signer_completed" event                           │
│     ▼                                                             │
│  7. POST-SIGN PROCESSING                                          │
│     │  ├─ Flatten signature onto PDF                             │
│     │  ├─ Apply digital signature (if PKI enabled)               │
│     │  ├─ Check if all signers complete                          │
│     │  ├─ If sequential: notify next signer                      │
│     │  └─ If all done: seal envelope                             │
│     ▼                                                             │
│  8. COMPLETION (if final signer)                                  │
│     │  ├─ Generate Certificate of Completion                     │
│     │  ├─ Apply LTV data + timestamp                             │
│     │  ├─ Transition to "completed" → "sealed"                   │
│     │  ├─ Send completed copies to all parties                   │
│     │  └─ Fire webhook: envelope.completed                       │
│     ▼                                                             │
│     DONE                                                          │
└─────────────────────────────────────────────────────────────────┘
```

### Audit Trail Architecture

The audit trail is the legal backbone of the e-signature system. Every action is recorded as an immutable, hash-chained event.

```
┌────────────────────────────────────────────────────────────────────┐
│                     AUDIT TRAIL (HASH CHAIN)                       │
│                                                                    │
│  Event 1               Event 2               Event 3              │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐      │
│  │ type: created │     │ type: sent   │     │ type: viewed │      │
│  │ ts: T1        │     │ ts: T2        │     │ ts: T3        │      │
│  │ actor: sender │────▶│ actor: system │────▶│ actor: signer│      │
│  │ ip: ...       │     │ ip: ...       │     │ ip: ...       │      │
│  │ prev: null    │     │ prev: H(E1)   │     │ prev: H(E2)   │      │
│  │ hash: H(E1)   │     │ hash: H(E2)   │     │ hash: H(E3)   │      │
│  └──────────────┘     └──────────────┘     └──────────────┘      │
│                                                                    │
│  Each event includes:                                              │
│    • Event type + metadata                                        │
│    • ISO 8601 timestamp (server clock + optional TSA)             │
│    • Actor identity (user ID, email, or "system")                 │
│    • IP address + User-Agent string                               │
│    • Device fingerprint (screen size, platform, etc.)             │
│    • Geolocation (if consent granted)                             │
│    • SHA-256 hash of event content + previous hash               │
│                                                                    │
│  Verification: replay chain from genesis, recompute hashes.       │
│  Any tampering breaks the chain at the modified event.            │
└────────────────────────────────────────────────────────────────────┘
```

#### Audit Event Types

| Event Type | Description |
|---|---|
| `envelope.created` | Envelope draft created |
| `envelope.sent` | Envelope dispatched to signers |
| `envelope.voided` | Sender voided the envelope |
| `envelope.completed` | All signers completed |
| `envelope.sealed` | Envelope cryptographically sealed |
| `envelope.expired` | Envelope reached expiration date |
| `document.uploaded` | Document added to envelope |
| `document.viewed` | Signer viewed a document |
| `signer.notified` | Notification sent to signer |
| `signer.authenticated` | Signer passed identity verification |
| `signer.auth_failed` | Signer failed identity verification |
| `signer.viewed` | Signer opened the signing session |
| `signer.completed` | Signer finished all fields and confirmed |
| `signer.declined` | Signer declined to sign |
| `signer.reassigned` | Signer role reassigned to another person |
| `field.completed` | Individual field value submitted |
| `field.updated` | Field value changed before confirmation |
| `session.created` | Signing session initiated |
| `session.expired` | Signing session timed out |
| `reminder.sent` | Reminder notification dispatched |
| `certificate.generated` | Certificate of completion PDF created |

### PDF Processing Pipeline

```
┌───────────────────────────────────────────────────────────────────┐
│                    PDF PROCESSING PIPELINE                         │
│                                                                   │
│  1. UPLOAD & VALIDATION                                           │
│     │  ├─ Validate PDF format (PDF 1.4+)                         │
│     │  ├─ Check file size (≤ 25MB per document)                  │
│     │  ├─ Scan for malicious content (JavaScript, actions)       │
│     │  ├─ Extract page count, dimensions                         │
│     │  └─ Store original in Supabase Storage (encrypted)         │
│     ▼                                                             │
│  2. PREPARATION                                                   │
│     │  ├─ Generate page thumbnails (for field placement UI)      │
│     │  ├─ Extract text layers (for search/accessibility)         │
│     │  ├─ Compute document hash (SHA-256)                        │
│     │  └─ Create working copy for field overlay                  │
│     ▼                                                             │
│  3. FIELD OVERLAY (during signing)                                │
│     │  ├─ Render signature images onto PDF pages                 │
│     │  ├─ Insert text values at field coordinates                │
│     │  ├─ Add checkmarks for checkbox fields                     │
│     │  ├─ Render date values in configured format                │
│     │  └─ Flatten form fields (non-editable)                     │
│     ▼                                                             │
│  4. SEALING (after all signers complete)                          │
│     │  ├─ Apply PKCS#7 digital signature (if PKI enabled)       │
│     │  ├─ Embed timestamp token from TSA                         │
│     │  ├─ Add LTV data (OCSP responses, CRLs)                   │
│     │  ├─ Attach audit trail as PDF appendix                     │
│     │  └─ Store final sealed document                            │
│     ▼                                                             │
│  5. DISTRIBUTION                                                  │
│     │  ├─ Generate Certificate of Completion                     │
│     │  ├─ Email completed bundle to all parties                  │
│     │  └─ Archive to long-term storage                           │
│     ▼                                                             │
│     COMPLETE                                                      │
└───────────────────────────────────────────────────────────────────┘
```

### Multi-Tenant Isolation

All sign module data is isolated via Supabase Row-Level Security (RLS). Every table includes a `tenant_id` column that is automatically filtered by the RLS policy.

```
┌─────────────────────────────────────────────────────────────┐
│                  MULTI-TENANT DATA MODEL                     │
│                                                             │
│  Tenant A (org_abc)          Tenant B (org_xyz)            │
│  ┌───────────────────┐      ┌───────────────────┐         │
│  │ Envelopes: 1,200  │      │ Envelopes: 450    │         │
│  │ Templates: 35     │      │ Templates: 12     │         │
│  │ Storage: 8.2 GB   │      │ Storage: 2.1 GB   │         │
│  └───────────────────┘      └───────────────────┘         │
│         │                          │                       │
│         ▼                          ▼                       │
│  ┌─────────────────────────────────────────────────┐      │
│  │              Supabase PostgreSQL                 │      │
│  │  RLS Policy: tenant_id = auth.jwt()->>'tid'     │      │
│  │  Every query automatically scoped to tenant     │      │
│  └─────────────────────────────────────────────────┘      │
│         │                          │                       │
│         ▼                          ▼                       │
│  ┌─────────────────────────────────────────────────┐      │
│  │             Supabase Storage                     │      │
│  │  Bucket: sign-documents/{tenant_id}/...          │      │
│  │  Policies enforce tenant-scoped access           │      │
│  └─────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Interfaces

### SignService

The primary service facade that orchestrates all signing operations.

```typescript
interface SignService {
  // === Envelope Lifecycle ===

  /** Create a new envelope in draft state. */
  createEnvelope(input: EnvelopeCreateInput): Promise<Envelope>;

  /** Retrieve an envelope by ID with all related data. */
  getEnvelope(envelopeId: string, options?: EnvelopeGetOptions): Promise<Envelope | null>;

  /** List envelopes with filtering, pagination, and sorting. */
  listEnvelopes(params: EnvelopeListParams): Promise<PaginatedResult<Envelope>>;

  /** Update envelope metadata (only in draft state). */
  updateEnvelope(envelopeId: string, input: EnvelopeUpdateInput): Promise<Envelope>;

  /** Send the envelope to all signers, transitioning from draft to sent. */
  sendEnvelope(envelopeId: string, options?: SendOptions): Promise<Envelope>;

  /** Void a sent/active envelope, halting all signing activity. */
  voidEnvelope(envelopeId: string, reason: string): Promise<Envelope>;

  /** Resend notifications to pending signers. */
  resendEnvelope(envelopeId: string, signerIds?: string[]): Promise<void>;

  /** Delete a draft envelope (soft delete). */
  deleteEnvelope(envelopeId: string): Promise<void>;

  // === Document Management ===

  /** Upload a document (PDF) to an envelope. */
  addDocument(envelopeId: string, input: DocumentUploadInput): Promise<Document>;

  /** Remove a document from a draft envelope. */
  removeDocument(envelopeId: string, documentId: string): Promise<void>;

  /** Reorder documents within an envelope. */
  reorderDocuments(envelopeId: string, documentIds: string[]): Promise<void>;

  /** Download the current version of a document (original or signed). */
  downloadDocument(envelopeId: string, documentId: string): Promise<DocumentDownload>;

  /** Download the final completed bundle (all documents + certificate). */
  downloadCompletedBundle(envelopeId: string): Promise<DocumentDownload>;

  // === Signature Fields ===

  /** Add a signature field to a document. */
  addField(documentId: string, input: FieldCreateInput): Promise<SignatureField>;

  /** Update field placement or properties. */
  updateField(fieldId: string, input: FieldUpdateInput): Promise<SignatureField>;

  /** Remove a field from a document. */
  removeField(fieldId: string): Promise<void>;

  /** Batch add/update/remove fields. */
  batchUpdateFields(documentId: string, operations: FieldBatchOperation[]): Promise<SignatureField[]>;

  // === Signers ===

  /** Add a signer to an envelope. */
  addSigner(envelopeId: string, input: SignerCreateInput): Promise<Signer>;

  /** Update signer details (only in draft state, or limited updates when sent). */
  updateSigner(signerId: string, input: SignerUpdateInput): Promise<Signer>;

  /** Remove a signer from a draft envelope. */
  removeSigner(signerId: string): Promise<void>;

  /** Reassign a signer's role to a different person. */
  reassignSigner(signerId: string, newSignerInput: SignerCreateInput): Promise<Signer>;

  // === Signing Sessions ===

  /** Generate a signing URL for a specific signer. */
  getSigningUrl(signerId: string, options?: SigningUrlOptions): Promise<string>;

  /** Create an embedded signing session (returns iframe-ready URL + token). */
  createEmbeddedSession(signerId: string, config: EmbeddedSigningConfig): Promise<EmbeddedSigningUrl>;

  /** Submit a signature value for a field. */
  submitFieldValue(sessionToken: string, fieldId: string, value: SignatureValue): Promise<void>;

  /** Complete the signing process for a signer (confirm all fields). */
  completeSigning(sessionToken: string): Promise<SigningResult>;

  /** Decline to sign with a reason. */
  declineSigning(sessionToken: string, reason: string): Promise<void>;

  // === Templates ===

  /** Create a reusable template from a document set. */
  createTemplate(input: TemplateCreateInput): Promise<SignTemplate>;

  /** Create an envelope from a template with variable substitution. */
  createFromTemplate(
    templateId: string,
    variables: Record<string, string>,
    signers: SignerCreateInput[],
  ): Promise<Envelope>;

  /** List available templates. */
  listTemplates(params: TemplateListParams): Promise<PaginatedResult<SignTemplate>>;

  // === Bulk Send ===

  /** Initiate a bulk send from a template using CSV data. */
  createBulkSend(input: BulkSendCreateInput): Promise<BulkSend>;

  /** Get bulk send status with per-recipient breakdown. */
  getBulkSendStatus(bulkSendId: string): Promise<BulkSendStatus>;

  /** Send reminders to incomplete recipients in a bulk send. */
  sendBulkReminders(bulkSendId: string): Promise<void>;

  // === Audit Trail ===

  /** Get the complete audit trail for an envelope. */
  getAuditTrail(envelopeId: string): Promise<AuditTrail>;

  /** Verify the integrity of an envelope's audit chain. */
  verifyAuditTrail(envelopeId: string): Promise<AuditVerificationResult>;

  /** Download the Certificate of Completion PDF. */
  downloadCertificate(envelopeId: string): Promise<DocumentDownload>;

  // === Webhooks ===

  /** Register a webhook endpoint for envelope events. */
  registerWebhook(input: WebhookRegistrationInput): Promise<WebhookRegistration>;

  /** List registered webhooks. */
  listWebhooks(): Promise<WebhookRegistration[]>;

  /** Delete a webhook registration. */
  deleteWebhook(webhookId: string): Promise<void>;
}

/** Options for retrieving an envelope. */
interface EnvelopeGetOptions {
  /** Include related documents. */
  includeDocuments?: boolean;
  /** Include signers with status. */
  includeSigners?: boolean;
  /** Include signature fields. */
  includeFields?: boolean;
  /** Include audit trail events. */
  includeAuditTrail?: boolean;
}

/** Parameters for listing envelopes. */
interface EnvelopeListParams {
  /** Filter by status. */
  status?: EnvelopeStatus | EnvelopeStatus[];
  /** Filter by sender user ID. */
  senderId?: string;
  /** Search by subject or signer email. */
  search?: string;
  /** Filter envelopes created after this date. */
  createdAfter?: Date;
  /** Filter envelopes created before this date. */
  createdBefore?: Date;
  /** Sort field. Default: 'createdAt'. */
  sortBy?: 'createdAt' | 'updatedAt' | 'subject' | 'status';
  /** Sort direction. Default: 'desc'. */
  sortDir?: 'asc' | 'desc';
  /** Page number (1-indexed). Default: 1. */
  page?: number;
  /** Items per page. Default: 25. Max: 100. */
  pageSize?: number;
}

/** Options for sending an envelope. */
interface SendOptions {
  /** Custom email subject (overrides envelope subject). */
  emailSubject?: string;
  /** Custom email body. */
  emailBody?: string;
  /** Schedule send for a future time. */
  scheduledAt?: Date;
  /** Skip email notification (for embedded-only workflows). */
  suppressNotifications?: boolean;
}

/** Result of a signing completion. */
interface SigningResult {
  /** The updated signer record. */
  signer: Signer;
  /** Whether this was the final signer (envelope is now completed). */
  envelopeCompleted: boolean;
  /** The next signer to be notified (if sequential). */
  nextSigner?: Signer;
  /** Download URL for the signed document (available immediately). */
  downloadUrl?: string;
}
```

### Envelope

```typescript
/** The top-level container for a signing transaction. */
interface Envelope {
  /** Unique envelope identifier. */
  id: string;
  /** Tenant ID for multi-tenant isolation. */
  tenantId: string;
  /** User ID of the envelope creator/sender. */
  senderId: string;
  /** Envelope subject line (shown in notifications and UI). */
  subject: string;
  /** Optional message to all signers. */
  message?: string;
  /** Current lifecycle status. */
  status: EnvelopeStatus;
  /** Signing order mode. */
  signingOrder: SigningOrderMode;
  /** Expiration date (null = no expiration). */
  expiresAt?: Date;
  /** Reminder configuration. */
  reminderConfig?: ReminderConfig;
  /** Custom branding for the signing experience. */
  branding?: EnvelopeBranding;
  /** Metadata key-value pairs for custom integrations. */
  metadata?: Record<string, string>;
  /** Attached documents (populated when requested). */
  documents?: Document[];
  /** Assigned signers (populated when requested). */
  signers?: Signer[];
  /** ISO 8601 creation timestamp. */
  createdAt: Date;
  /** ISO 8601 last update timestamp. */
  updatedAt: Date;
  /** ISO 8601 timestamp when envelope was sent. */
  sentAt?: Date;
  /** ISO 8601 timestamp when envelope was completed. */
  completedAt?: Date;
  /** ISO 8601 timestamp when envelope was voided. */
  voidedAt?: Date;
  /** Void reason (if voided). */
  voidReason?: string;
}

type EnvelopeStatus =
  | 'draft'
  | 'sent'
  | 'active'
  | 'completed'
  | 'sealed'
  | 'archived'
  | 'declined'
  | 'voided'
  | 'expired'
  | 'deleted';

type SigningOrderMode = 'sequential' | 'parallel';

interface ReminderConfig {
  /** Send reminders automatically. */
  enabled: boolean;
  /** Days between reminders. Default: 3. */
  intervalDays: number;
  /** Maximum number of reminders to send. Default: 5. */
  maxReminders: number;
}

interface EnvelopeBranding {
  /** Custom logo URL. */
  logoUrl?: string;
  /** Primary brand color (hex). */
  primaryColor?: string;
  /** Custom "powered by" text. */
  companyName?: string;
  /** Custom redirect URL after signing. */
  redirectUrl?: string;
  /** Custom decline redirect URL. */
  declineRedirectUrl?: string;
}

interface EnvelopeCreateInput {
  /** Envelope subject line. Required. */
  subject: string;
  /** Optional message to signers. */
  message?: string;
  /** Signing order mode. Default: 'sequential'. */
  signingOrder?: SigningOrderMode;
  /** Expiration date. */
  expiresAt?: Date;
  /** Reminder configuration. */
  reminderConfig?: ReminderConfig;
  /** Custom branding. */
  branding?: EnvelopeBranding;
  /** Metadata. */
  metadata?: Record<string, string>;
}

interface EnvelopeUpdateInput {
  subject?: string;
  message?: string;
  signingOrder?: SigningOrderMode;
  expiresAt?: Date | null;
  reminderConfig?: ReminderConfig;
  branding?: EnvelopeBranding;
  metadata?: Record<string, string>;
}
```

### Document

```typescript
/** A PDF document attached to an envelope. */
interface Document {
  /** Unique document identifier. */
  id: string;
  /** Parent envelope ID. */
  envelopeId: string;
  /** Original filename. */
  filename: string;
  /** Display name (can differ from filename). */
  name: string;
  /** Document order within the envelope (0-indexed). */
  order: number;
  /** Number of pages in the document. */
  pageCount: number;
  /** File size in bytes. */
  fileSize: number;
  /** SHA-256 hash of the original document. */
  originalHash: string;
  /** Storage path for the original document. */
  storagePath: string;
  /** Storage path for the signed/completed document (null until sealed). */
  signedStoragePath?: string;
  /** SHA-256 hash of the signed document (null until sealed). */
  signedHash?: string;
  /** MIME type. Always 'application/pdf'. */
  mimeType: 'application/pdf';
  /** Signature fields placed on this document. */
  fields?: SignatureField[];
  /** Page thumbnail URLs (for field placement UI). */
  thumbnailUrls?: string[];
  /** ISO 8601 creation timestamp. */
  createdAt: Date;
}

interface DocumentUploadInput {
  /** The PDF file buffer. */
  file: Buffer | ArrayBuffer;
  /** Original filename. */
  filename: string;
  /** Display name (defaults to filename). */
  name?: string;
  /** Order within the envelope. */
  order?: number;
}

interface DocumentDownload {
  /** The document binary data. */
  data: Buffer;
  /** Filename for the download. */
  filename: string;
  /** MIME type. */
  mimeType: string;
  /** File size in bytes. */
  size: number;
}
```

### SignatureField

```typescript
/** A field placed on a document that a signer must complete. */
interface SignatureField {
  /** Unique field identifier. */
  id: string;
  /** Parent document ID. */
  documentId: string;
  /** Signer assigned to this field. */
  signerId: string;
  /** Field type. */
  type: SignatureFieldType;
  /** Whether this field is required. Default: true. */
  required: boolean;
  /** Field placement on the document. */
  placement: FieldPlacement;
  /** Field label (shown as tooltip or placeholder). */
  label?: string;
  /** Default value for text/date fields. */
  defaultValue?: string;
  /** Validation rules for text fields. */
  validation?: FieldValidation;
  /** Options for dropdown fields. */
  options?: string[];
  /** Group name (for radio button groups). */
  group?: string;
  /** Date format for date fields. Default: 'MM/DD/YYYY'. */
  dateFormat?: string;
  /** Font family for typed signatures. */
  fontFamily?: string;
  /** Font size in points. */
  fontSize?: number;
  /** The submitted value (null until completed). */
  value?: SignatureValue;
  /** Whether the field has been completed. */
  completed: boolean;
  /** ISO 8601 timestamp when the field was completed. */
  completedAt?: Date;
  /** Tab order for keyboard navigation. */
  tabOrder?: number;
  /** Conditional visibility rule. */
  conditionalOn?: ConditionalRule;
  /** ISO 8601 creation timestamp. */
  createdAt: Date;
}

type SignatureFieldType =
  | 'signature'     // Full signature (draw, type, upload, or PKI)
  | 'initials'      // Initials (draw or type)
  | 'text'          // Free text input
  | 'date'          // Date picker
  | 'checkbox'      // Boolean checkbox
  | 'dropdown'      // Dropdown select
  | 'radio'         // Radio button (part of a group)
  | 'attachment'    // File attachment upload
  | 'formula'       // Computed field (read-only)
  | 'note'          // Read-only text annotation (no signer input)
  | 'stamp'         // Date/time stamp (auto-filled on sign);

/** Physical placement of a field on a PDF page. */
interface FieldPlacement {
  /** Page number (1-indexed). */
  page: number;
  /** X coordinate from left edge (points, 72dpi). */
  x: number;
  /** Y coordinate from top edge (points, 72dpi). */
  y: number;
  /** Field width in points. */
  width: number;
  /** Field height in points. */
  height: number;
  /** Rotation in degrees (0, 90, 180, 270). Default: 0. */
  rotation?: number;
}

interface FieldValidation {
  /** Minimum character length. */
  minLength?: number;
  /** Maximum character length. */
  maxLength?: number;
  /** Regex pattern for validation. */
  pattern?: string;
  /** Human-readable validation error message. */
  patternMessage?: string;
}

interface ConditionalRule {
  /** Field ID that controls visibility. */
  fieldId: string;
  /** Show this field when the controlling field has this value. */
  value: string;
}

interface FieldCreateInput {
  signerId: string;
  type: SignatureFieldType;
  placement: FieldPlacement;
  required?: boolean;
  label?: string;
  defaultValue?: string;
  validation?: FieldValidation;
  options?: string[];
  group?: string;
  dateFormat?: string;
  fontFamily?: string;
  fontSize?: number;
  tabOrder?: number;
  conditionalOn?: ConditionalRule;
}

interface FieldUpdateInput {
  placement?: FieldPlacement;
  required?: boolean;
  label?: string;
  defaultValue?: string;
  validation?: FieldValidation;
  options?: string[];
  dateFormat?: string;
  fontFamily?: string;
  fontSize?: number;
  tabOrder?: number;
  conditionalOn?: ConditionalRule;
}

interface FieldBatchOperation {
  operation: 'add' | 'update' | 'remove';
  fieldId?: string; // Required for update/remove
  data?: FieldCreateInput | FieldUpdateInput;
}
```

### Signer

```typescript
/** A person assigned to sign or take action on an envelope. */
interface Signer {
  /** Unique signer identifier. */
  id: string;
  /** Parent envelope ID. */
  envelopeId: string;
  /** Signer's email address. */
  email: string;
  /** Signer's full name. */
  name: string;
  /** Signer's role in the workflow. */
  role: SignerRole;
  /** Current signer status. */
  status: SignerStatus;
  /** Order in sequential signing (1-indexed). Null for parallel. */
  order?: number;
  /** Required authentication methods before signing. */
  authentication: SignerAuthentication;
  /** Access code (additional PIN protection). */
  accessCode?: string;
  /** Custom message to this specific signer. */
  personalMessage?: string;
  /** Phone number for SMS-based authentication. */
  phone?: string;
  /** Language preference for the signing UI. */
  locale?: string;
  /** Number of reminders sent. */
  remindersSent: number;
  /** ISO 8601 timestamp of last reminder. */
  lastReminderAt?: Date;
  /** ISO 8601 timestamp when signer was notified. */
  notifiedAt?: Date;
  /** ISO 8601 timestamp when signer first viewed. */
  viewedAt?: Date;
  /** ISO 8601 timestamp when signer completed signing. */
  completedAt?: Date;
  /** ISO 8601 timestamp when signer declined. */
  declinedAt?: Date;
  /** Decline reason (if declined). */
  declineReason?: string;
  /** Signing session IP address. */
  signingIp?: string;
  /** Custom metadata for this signer. */
  metadata?: Record<string, string>;
  /** ISO 8601 creation timestamp. */
  createdAt: Date;
}

type SignerRole =
  | 'signer'          // Must sign designated fields
  | 'cc'              // Receives a copy (no action required)
  | 'in_person'       // In-person signer (host initiates session)
  | 'approver'        // Must approve (no signature, just approval action)
  | 'witness'         // Witnesses the signing (signs after main signer)
  | 'notary'          // Notarizes the document
  | 'editor'          // Can edit fields before sending (preparation role)
  | 'intermediary';   // Manages routing but does not sign

type SignerStatus =
  | 'pending'         // Not yet notified
  | 'notified'        // Notification sent, awaiting action
  | 'viewed'          // Signer opened the documents
  | 'in_progress'     // Signer has started filling fields
  | 'completed'       // Signer finished all required actions
  | 'declined'        // Signer declined to sign
  | 'reassigned';     // Signer role transferred to another person

interface SignerCreateInput {
  email: string;
  name: string;
  role?: SignerRole;
  order?: number;
  authentication?: Partial<SignerAuthentication>;
  accessCode?: string;
  personalMessage?: string;
  phone?: string;
  locale?: string;
  metadata?: Record<string, string>;
}

interface SignerUpdateInput {
  email?: string;
  name?: string;
  order?: number;
  authentication?: Partial<SignerAuthentication>;
  accessCode?: string;
  personalMessage?: string;
  phone?: string;
  locale?: string;
}
```

### SigningSession

```typescript
/** An active signing session for a specific signer. */
interface SigningSession {
  /** Unique session identifier. */
  id: string;
  /** Associated signer ID. */
  signerId: string;
  /** Associated envelope ID. */
  envelopeId: string;
  /** JWT token for this session. */
  token: string;
  /** Session status. */
  status: SigningSessionStatus;
  /** IP address of the signer. */
  ipAddress: string;
  /** User-Agent string. */
  userAgent: string;
  /** Device fingerprint data. */
  deviceFingerprint?: DeviceFingerprint;
  /** Geolocation data (if consent granted). */
  geolocation?: Geolocation;
  /** Authentication method used. */
  authenticationMethod: AuthenticationMethod;
  /** Whether authentication was successful. */
  authenticated: boolean;
  /** Session expiration time. */
  expiresAt: Date;
  /** ISO 8601 session creation timestamp. */
  createdAt: Date;
  /** ISO 8601 timestamp of last activity. */
  lastActivityAt: Date;
  /** ISO 8601 session completion timestamp. */
  completedAt?: Date;
}

type SigningSessionStatus =
  | 'active'
  | 'completed'
  | 'declined'
  | 'expired'
  | 'revoked';

interface DeviceFingerprint {
  /** Screen width in pixels. */
  screenWidth: number;
  /** Screen height in pixels. */
  screenHeight: number;
  /** Platform (Windows, macOS, iOS, Android, Linux). */
  platform: string;
  /** Browser name and version. */
  browser: string;
  /** Whether touch is available. */
  touchEnabled: boolean;
  /** Device pixel ratio. */
  devicePixelRatio: number;
  /** Timezone offset in minutes. */
  timezoneOffset: number;
  /** IANA timezone string. */
  timezone: string;
  /** Preferred language. */
  language: string;
}

interface Geolocation {
  /** Latitude. */
  latitude: number;
  /** Longitude. */
  longitude: number;
  /** Accuracy in meters. */
  accuracy: number;
  /** City (reverse geocoded). */
  city?: string;
  /** Country code. */
  country?: string;
  /** Region/state. */
  region?: string;
}

interface SigningSessionToken {
  /** Signer ID. */
  signerId: string;
  /** Envelope ID. */
  envelopeId: string;
  /** Session ID. */
  sessionId: string;
  /** Tenant ID. */
  tenantId: string;
  /** Issued at (Unix timestamp). */
  iat: number;
  /** Expiration (Unix timestamp). */
  exp: number;
}
```

### AuditTrail

```typescript
/** The complete audit trail for an envelope. */
interface AuditTrail {
  /** Envelope ID this trail belongs to. */
  envelopeId: string;
  /** Ordered list of audit events. */
  events: AuditEvent[];
  /** Whether the hash chain is valid. */
  chainValid: boolean;
  /** The hash of the most recent event. */
  currentHash: string;
  /** Total number of events. */
  eventCount: number;
}

/** A single event in the audit trail. */
interface AuditEvent {
  /** Unique event identifier. */
  id: string;
  /** Parent envelope ID. */
  envelopeId: string;
  /** Event type. */
  type: AuditEventType;
  /** ISO 8601 timestamp (server time). */
  timestamp: Date;
  /** Actor who triggered this event. */
  actor: AuditActor;
  /** IP address of the actor. */
  ipAddress?: string;
  /** User-Agent string. */
  userAgent?: string;
  /** Device fingerprint. */
  deviceFingerprint?: DeviceFingerprint;
  /** Geolocation. */
  geolocation?: Geolocation;
  /** Event-specific metadata. */
  metadata?: Record<string, unknown>;
  /** SHA-256 hash of this event (including previousHash). */
  hash: string;
  /** SHA-256 hash of the previous event (null for genesis event). */
  previousHash?: string;
  /** RFC 3161 timestamp token (if TSA enabled). */
  timestampToken?: string;
}

type AuditEventType =
  | 'envelope.created'
  | 'envelope.sent'
  | 'envelope.voided'
  | 'envelope.completed'
  | 'envelope.sealed'
  | 'envelope.expired'
  | 'document.uploaded'
  | 'document.viewed'
  | 'signer.notified'
  | 'signer.authenticated'
  | 'signer.auth_failed'
  | 'signer.viewed'
  | 'signer.completed'
  | 'signer.declined'
  | 'signer.reassigned'
  | 'field.completed'
  | 'field.updated'
  | 'session.created'
  | 'session.expired'
  | 'reminder.sent'
  | 'certificate.generated';

interface AuditActor {
  /** Actor type. */
  type: 'user' | 'signer' | 'system';
  /** User or signer ID. */
  id?: string;
  /** Display name. */
  name?: string;
  /** Email address. */
  email?: string;
}

interface AuditVerificationResult {
  /** Whether the entire chain is valid. */
  valid: boolean;
  /** Total events verified. */
  totalEvents: number;
  /** Number of valid events. */
  validEvents: number;
  /** Index of first invalid event (-1 if all valid). */
  firstInvalidIndex: number;
  /** Details of any verification failures. */
  failures: AuditVerificationFailure[];
}

interface AuditVerificationFailure {
  /** Event index in the chain. */
  index: number;
  /** Event ID. */
  eventId: string;
  /** Expected hash. */
  expectedHash: string;
  /** Actual hash found. */
  actualHash: string;
  /** Description of the failure. */
  reason: string;
}
```

### SignTemplate

```typescript
/** A reusable document template with pre-placed fields. */
interface SignTemplate {
  /** Unique template identifier. */
  id: string;
  /** Tenant ID. */
  tenantId: string;
  /** Creator user ID. */
  createdBy: string;
  /** Template name. */
  name: string;
  /** Template description. */
  description?: string;
  /** Template category/folder. */
  category?: string;
  /** Whether this template is active and available for use. */
  active: boolean;
  /** Template documents with pre-placed fields. */
  documents: TemplateDocument[];
  /** Role definitions for signers (e.g., "Sender", "Client", "Witness"). */
  roles: TemplateRole[];
  /** Template-level variables for merge fields. */
  variables: TemplateVariable[];
  /** Default envelope settings from this template. */
  defaults: TemplateDefaults;
  /** Number of times this template has been used. */
  useCount: number;
  /** ISO 8601 creation timestamp. */
  createdAt: Date;
  /** ISO 8601 last update timestamp. */
  updatedAt: Date;
  /** ISO 8601 timestamp of last use. */
  lastUsedAt?: Date;
}

interface TemplateDocument {
  /** Template document ID. */
  id: string;
  /** Display name. */
  name: string;
  /** Document order. */
  order: number;
  /** Storage path for the template PDF. */
  storagePath: string;
  /** Page count. */
  pageCount: number;
  /** Pre-placed fields. */
  fields: TemplateField[];
}

interface TemplateField {
  /** Template field ID. */
  id: string;
  /** Template document ID. */
  templateDocumentId: string;
  /** Role name this field is assigned to. */
  roleName: string;
  /** Field type. */
  type: SignatureFieldType;
  /** Whether this field is required. */
  required: boolean;
  /** Field placement. */
  placement: FieldPlacement;
  /** Field label. */
  label?: string;
  /** Default value (can reference template variables via {{variable_name}}). */
  defaultValue?: string;
  /** Validation rules. */
  validation?: FieldValidation;
  /** Options for dropdown fields. */
  options?: string[];
  /** Date format for date fields. */
  dateFormat?: string;
  /** Tab order. */
  tabOrder?: number;
}

interface TemplateRole {
  /** Role name (e.g., "Sender", "Client", "Witness"). */
  name: string;
  /** Default signer role type. */
  defaultRole: SignerRole;
  /** Order in sequential signing. */
  order: number;
  /** Default authentication requirements. */
  authentication?: Partial<SignerAuthentication>;
}

interface TemplateVariable {
  /** Variable name (used as {{name}} in field defaults). */
  name: string;
  /** Human-readable label. */
  label: string;
  /** Variable type. */
  type: 'text' | 'date' | 'number' | 'email';
  /** Whether this variable is required when creating from template. */
  required: boolean;
  /** Default value. */
  defaultValue?: string;
}

interface TemplateDefaults {
  /** Default envelope subject (can use {{variables}}). */
  subject?: string;
  /** Default message to signers. */
  message?: string;
  /** Default signing order. */
  signingOrder?: SigningOrderMode;
  /** Default expiration in days. */
  expirationDays?: number;
  /** Default reminder configuration. */
  reminderConfig?: ReminderConfig;
  /** Default branding. */
  branding?: EnvelopeBranding;
}

interface TemplateCreateInput {
  name: string;
  description?: string;
  category?: string;
  documents: {
    file: Buffer | ArrayBuffer;
    filename: string;
    name?: string;
    order?: number;
  }[];
  roles: TemplateRole[];
  variables?: TemplateVariable[];
  defaults?: TemplateDefaults;
}
```

### BulkSend

```typescript
/** A bulk send job that creates multiple envelopes from a template. */
interface BulkSend {
  /** Unique bulk send identifier. */
  id: string;
  /** Tenant ID. */
  tenantId: string;
  /** Creator user ID. */
  createdBy: string;
  /** Source template ID. */
  templateId: string;
  /** Bulk send name/label. */
  name: string;
  /** Current status. */
  status: BulkSendJobStatus;
  /** Total recipients. */
  totalRecipients: number;
  /** Number of envelopes created. */
  sentCount: number;
  /** Number of envelopes completed. */
  completedCount: number;
  /** Number of errors. */
  errorCount: number;
  /** Per-recipient details. */
  recipients: BulkSendRecipient[];
  /** CSV column mappings. */
  columnMappings: ColumnMapping[];
  /** ISO 8601 creation timestamp. */
  createdAt: Date;
  /** ISO 8601 timestamp when processing started. */
  startedAt?: Date;
  /** ISO 8601 timestamp when all envelopes were sent. */
  completedAt?: Date;
}

type BulkSendJobStatus =
  | 'pending'       // Awaiting processing
  | 'processing'    // Creating and sending envelopes
  | 'sent'          // All envelopes dispatched
  | 'completed'     // All envelopes signed
  | 'partial'       // Some envelopes completed, some pending/failed
  | 'failed'        // Critical failure
  | 'cancelled';    // User cancelled

interface BulkSendRecipient {
  /** Unique recipient identifier. */
  id: string;
  /** Parent bulk send ID. */
  bulkSendId: string;
  /** Signer email. */
  email: string;
  /** Signer name. */
  name: string;
  /** Template variable values for this recipient. */
  variables: Record<string, string>;
  /** Per-recipient status. */
  status: BulkSendRecipientStatus;
  /** Created envelope ID (null until processed). */
  envelopeId?: string;
  /** Error message (if failed). */
  error?: string;
  /** ISO 8601 timestamp when processed. */
  processedAt?: Date;
}

type BulkSendRecipientStatus =
  | 'pending'
  | 'sent'
  | 'completed'
  | 'declined'
  | 'expired'
  | 'error';

interface ColumnMapping {
  /** CSV column header name. */
  csvColumn: string;
  /** Target: 'email', 'name', or template variable name. */
  target: string;
}

interface BulkSendCreateInput {
  /** Source template ID. */
  templateId: string;
  /** Bulk send name. */
  name: string;
  /** CSV file content. */
  csvData: string;
  /** Column mappings (auto-detected if headers match). */
  columnMappings?: ColumnMapping[];
  /** Send immediately or queue for review. Default: false. */
  sendImmediately?: boolean;
}
```

### Certificate

```typescript
/** A digital signing certificate (for PKI-based signatures). */
interface Certificate {
  /** Unique certificate identifier. */
  id: string;
  /** Tenant ID. */
  tenantId: string;
  /** User ID of the certificate owner. */
  userId: string;
  /** Certificate subject (CN). */
  subjectName: string;
  /** Issuer organization. */
  issuer: string;
  /** Serial number. */
  serialNumber: string;
  /** Certificate fingerprint (SHA-256). */
  fingerprint: string;
  /** Not valid before date. */
  validFrom: Date;
  /** Not valid after date. */
  validTo: Date;
  /** Key usage extensions. */
  keyUsage: string[];
  /** Whether the certificate is currently valid. */
  isValid: boolean;
  /** Whether the certificate has been revoked. */
  isRevoked: boolean;
  /** PEM-encoded certificate (public portion). */
  certificatePem: string;
  /** Encrypted storage path for private key (HSM reference or encrypted blob). */
  privateKeyRef: string;
  /** ISO 8601 creation timestamp. */
  createdAt: Date;
}
```

### SignatureValue

```typescript
/** The value submitted for a signature or field. */
type SignatureValue =
  | DrawnSignatureValue
  | TypedSignatureValue
  | UploadedSignatureValue
  | PkiSignatureValue
  | TextFieldValue
  | DateFieldValue
  | CheckboxFieldValue
  | DropdownFieldValue
  | AttachmentFieldValue;

interface DrawnSignatureValue {
  type: 'drawn';
  /** SVG path data of the drawn signature. */
  svgData: string;
  /** PNG image of the rendered signature (base64). */
  imageBase64: string;
  /** Image dimensions. */
  width: number;
  height: number;
}

interface TypedSignatureValue {
  type: 'typed';
  /** The typed text. */
  text: string;
  /** Font family used to render. */
  fontFamily: string;
  /** Rendered PNG image (base64). */
  imageBase64: string;
}

interface UploadedSignatureValue {
  type: 'uploaded';
  /** Uploaded image (base64). */
  imageBase64: string;
  /** Original filename. */
  filename: string;
  /** MIME type of the uploaded image. */
  mimeType: string;
}

interface PkiSignatureValue {
  type: 'pki';
  /** Certificate ID used for signing. */
  certificateId: string;
  /** PKCS#7 detached signature (base64). */
  pkcs7Signature: string;
  /** RFC 3161 timestamp token (base64). */
  timestampToken?: string;
  /** Algorithm used (e.g., 'SHA256withRSA'). */
  algorithm: string;
}

interface TextFieldValue {
  type: 'text';
  /** The text content. */
  text: string;
}

interface DateFieldValue {
  type: 'date';
  /** ISO 8601 date string. */
  date: string;
  /** Formatted display string. */
  formatted: string;
}

interface CheckboxFieldValue {
  type: 'checkbox';
  /** Whether checked. */
  checked: boolean;
}

interface DropdownFieldValue {
  type: 'dropdown';
  /** Selected value. */
  selected: string;
}

interface AttachmentFieldValue {
  type: 'attachment';
  /** Storage path of the uploaded file. */
  storagePath: string;
  /** Original filename. */
  filename: string;
  /** File size in bytes. */
  fileSize: number;
  /** MIME type. */
  mimeType: string;
}
```

### SignerAuthentication

```typescript
/** Authentication requirements for a signer. */
interface SignerAuthentication {
  /** Require email verification (click link in email). Always true for email-based signing. */
  email: boolean;
  /** Require SMS one-time password. */
  smsOtp: boolean;
  /** Require knowledge-based authentication questions. */
  kba: boolean;
  /** Require government ID verification. */
  governmentId: boolean;
  /** Require an access code (PIN). */
  accessCode: boolean;
  /** Custom authentication webhook URL. */
  customWebhook?: string;
}

type AuthenticationMethod =
  | 'email'
  | 'sms_otp'
  | 'kba'
  | 'government_id'
  | 'access_code'
  | 'custom_webhook'
  | 'none';
```

### EmbeddedSigningConfig

```typescript
/** Configuration for an embedded signing experience. */
interface EmbeddedSigningConfig {
  /** Allowed origin(s) for iframe embedding. */
  allowedOrigins: string[];
  /** Redirect URL after signing completion. */
  returnUrl?: string;
  /** Redirect URL after declining. */
  declineUrl?: string;
  /** Show or hide the header bar. Default: true. */
  showHeader?: boolean;
  /** Show or hide the "Powered by" footer. Default: true. */
  showFooter?: boolean;
  /** Show or hide the download button. Default: true. */
  showDownload?: boolean;
  /** Custom CSS overrides (limited set of properties). */
  customCss?: EmbeddedCustomCss;
  /** Locale override. */
  locale?: string;
  /** Session duration in minutes. Default: 60. */
  sessionDurationMinutes?: number;
  /** Enable mobile-optimized layout. Default: true. */
  mobileOptimized?: boolean;
  /** Disable signer's ability to decline. Default: false. */
  disableDecline?: boolean;
  /** Message display mode. */
  messageDisplay?: 'modal' | 'inline' | 'hidden';
}

interface EmbeddedCustomCss {
  primaryColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
  buttonBorderRadius?: string;
  headerBackgroundColor?: string;
}

interface EmbeddedSigningUrl {
  /** The URL to load in an iframe or new window. */
  url: string;
  /** JWT session token (also embedded in the URL). */
  token: string;
  /** Session expiration time. */
  expiresAt: Date;
  /** Unique session ID for event tracking. */
  sessionId: string;
}
```

### WebhookEvent

```typescript
/** A webhook event dispatched when envelope state changes. */
interface WebhookEvent {
  /** Unique event identifier. */
  id: string;
  /** Event type. */
  type: WebhookEventType;
  /** ISO 8601 timestamp. */
  timestamp: Date;
  /** The payload data. */
  data: SignWebhookPayload;
  /** Tenant ID. */
  tenantId: string;
  /** HMAC-SHA256 signature of the payload. */
  signature: string;
}

type WebhookEventType =
  | 'envelope.sent'
  | 'envelope.viewed'
  | 'envelope.completed'
  | 'envelope.declined'
  | 'envelope.voided'
  | 'envelope.expired'
  | 'signer.sent'
  | 'signer.viewed'
  | 'signer.completed'
  | 'signer.declined';

interface SignWebhookPayload {
  /** Envelope ID. */
  envelopeId: string;
  /** Envelope subject. */
  subject: string;
  /** Envelope status. */
  status: EnvelopeStatus;
  /** Signer ID (for signer-level events). */
  signerId?: string;
  /** Signer email. */
  signerEmail?: string;
  /** Signer name. */
  signerName?: string;
  /** Custom metadata from the envelope. */
  metadata?: Record<string, string>;
  /** Decline reason (for decline events). */
  declineReason?: string;
  /** Void reason (for void events). */
  voidReason?: string;
}

interface WebhookRegistrationInput {
  /** Endpoint URL to receive webhook POSTs. */
  url: string;
  /** Event types to subscribe to. Empty = all events. */
  events?: WebhookEventType[];
  /** Secret key for HMAC signature verification. */
  secret: string;
  /** Whether the webhook is active. Default: true. */
  active?: boolean;
  /** Custom headers to include in webhook requests. */
  headers?: Record<string, string>;
}

interface WebhookRegistration {
  id: string;
  url: string;
  events: WebhookEventType[];
  active: boolean;
  headers?: Record<string, string>;
  createdAt: Date;
  lastDeliveryAt?: Date;
  lastDeliveryStatus?: number;
  failureCount: number;
}
```

---

## Database Schemas

All tables use the following conventions:
- **`id`**: UUID v7 primary key (time-ordered)
- **`tenant_id`**: UUID foreign key, RLS-enforced
- **`created_at`** / **`updated_at`**: ISO 8601 timestamps with timezone
- **Soft deletes**: `deleted_at` column where applicable
- **Indexes**: Optimized for common query patterns

### envelopes

The primary table for signing transactions.

```typescript
export const envelopes = pgTable('sign_envelopes', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  senderId: uuid('sender_id').notNull().references(() => users.id),
  subject: text('subject').notNull(),
  message: text('message'),
  status: text('status', {
    enum: ['draft', 'sent', 'active', 'completed', 'sealed', 'archived',
           'declined', 'voided', 'expired', 'deleted'],
  }).notNull().default('draft'),
  signingOrder: text('signing_order', {
    enum: ['sequential', 'parallel'],
  }).notNull().default('sequential'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  reminderConfig: jsonb('reminder_config').$type<ReminderConfig>(),
  branding: jsonb('branding').$type<EnvelopeBranding>(),
  metadata: jsonb('metadata').$type<Record<string, string>>(),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  sealedAt: timestamp('sealed_at', { withTimezone: true }),
  voidedAt: timestamp('voided_at', { withTimezone: true }),
  voidReason: text('void_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  tenantIdx: index('sign_envelopes_tenant_idx').on(table.tenantId),
  senderIdx: index('sign_envelopes_sender_idx').on(table.tenantId, table.senderId),
  statusIdx: index('sign_envelopes_status_idx').on(table.tenantId, table.status),
  createdIdx: index('sign_envelopes_created_idx').on(table.tenantId, table.createdAt),
  expiresIdx: index('sign_envelopes_expires_idx')
    .on(table.status, table.expiresAt)
    .where(sql`status IN ('sent', 'active') AND expires_at IS NOT NULL`),
}));
```

### envelope_documents

Documents attached to envelopes.

```typescript
export const envelopeDocuments = pgTable('sign_envelope_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  envelopeId: uuid('envelope_id').notNull().references(() => envelopes.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  filename: text('filename').notNull(),
  name: text('name').notNull(),
  order: integer('order').notNull().default(0),
  pageCount: integer('page_count').notNull(),
  fileSize: integer('file_size').notNull(),
  originalHash: text('original_hash').notNull(),
  storagePath: text('storage_path').notNull(),
  signedStoragePath: text('signed_storage_path'),
  signedHash: text('signed_hash'),
  mimeType: text('mime_type').notNull().default('application/pdf'),
  thumbnailPaths: jsonb('thumbnail_paths').$type<string[]>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  envelopeIdx: index('sign_documents_envelope_idx').on(table.envelopeId),
  tenantIdx: index('sign_documents_tenant_idx').on(table.tenantId),
}));
```

### signature_fields

Fields placed on documents that signers must complete.

```typescript
export const signatureFields = pgTable('sign_signature_fields', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').notNull().references(() => envelopeDocuments.id, { onDelete: 'cascade' }),
  signerId: uuid('signer_id').notNull().references(() => signers.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  type: text('type', {
    enum: ['signature', 'initials', 'text', 'date', 'checkbox',
           'dropdown', 'radio', 'attachment', 'formula', 'note', 'stamp'],
  }).notNull(),
  required: boolean('required').notNull().default(true),
  placement: jsonb('placement').notNull().$type<FieldPlacement>(),
  label: text('label'),
  defaultValue: text('default_value'),
  validation: jsonb('validation').$type<FieldValidation>(),
  options: jsonb('options').$type<string[]>(),
  groupName: text('group_name'),
  dateFormat: text('date_format'),
  fontFamily: text('font_family'),
  fontSize: integer('font_size'),
  value: jsonb('value').$type<SignatureValue>(),
  completed: boolean('completed').notNull().default(false),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  tabOrder: integer('tab_order'),
  conditionalOn: jsonb('conditional_on').$type<ConditionalRule>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  documentIdx: index('sign_fields_document_idx').on(table.documentId),
  signerIdx: index('sign_fields_signer_idx').on(table.signerId),
  tenantIdx: index('sign_fields_tenant_idx').on(table.tenantId),
}));
```

### signers

People assigned to sign or receive envelopes.

```typescript
export const signers = pgTable('sign_signers', {
  id: uuid('id').primaryKey().defaultRandom(),
  envelopeId: uuid('envelope_id').notNull().references(() => envelopes.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  email: text('email').notNull(),
  name: text('name').notNull(),
  role: text('role', {
    enum: ['signer', 'cc', 'in_person', 'approver', 'witness', 'notary', 'editor', 'intermediary'],
  }).notNull().default('signer'),
  status: text('status', {
    enum: ['pending', 'notified', 'viewed', 'in_progress', 'completed', 'declined', 'reassigned'],
  }).notNull().default('pending'),
  order: integer('order'),
  authentication: jsonb('authentication').notNull().$type<SignerAuthentication>()
    .default({ email: true, smsOtp: false, kba: false, governmentId: false, accessCode: false }),
  accessCodeHash: text('access_code_hash'),
  personalMessage: text('personal_message'),
  phone: text('phone'),
  locale: text('locale').default('en'),
  remindersSent: integer('reminders_sent').notNull().default(0),
  lastReminderAt: timestamp('last_reminder_at', { withTimezone: true }),
  notifiedAt: timestamp('notified_at', { withTimezone: true }),
  viewedAt: timestamp('viewed_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  declinedAt: timestamp('declined_at', { withTimezone: true }),
  declineReason: text('decline_reason'),
  signingIp: text('signing_ip'),
  metadata: jsonb('metadata').$type<Record<string, string>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  envelopeIdx: index('sign_signers_envelope_idx').on(table.envelopeId),
  tenantIdx: index('sign_signers_tenant_idx').on(table.tenantId),
  emailIdx: index('sign_signers_email_idx').on(table.tenantId, table.email),
  statusIdx: index('sign_signers_status_idx').on(table.envelopeId, table.status),
}));
```

### signing_sessions

Active and historical signing sessions.

```typescript
export const signingSessions = pgTable('sign_signing_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  signerId: uuid('signer_id').notNull().references(() => signers.id, { onDelete: 'cascade' }),
  envelopeId: uuid('envelope_id').notNull().references(() => envelopes.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  tokenHash: text('token_hash').notNull(),
  status: text('status', {
    enum: ['active', 'completed', 'declined', 'expired', 'revoked'],
  }).notNull().default('active'),
  ipAddress: text('ip_address').notNull(),
  userAgent: text('user_agent').notNull(),
  deviceFingerprint: jsonb('device_fingerprint').$type<DeviceFingerprint>(),
  geolocation: jsonb('geolocation').$type<Geolocation>(),
  authenticationMethod: text('authentication_method', {
    enum: ['email', 'sms_otp', 'kba', 'government_id', 'access_code', 'custom_webhook', 'none'],
  }).notNull(),
  authenticated: boolean('authenticated').notNull().default(false),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  lastActivityAt: timestamp('last_activity_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  signerIdx: index('sign_sessions_signer_idx').on(table.signerId),
  envelopeIdx: index('sign_sessions_envelope_idx').on(table.envelopeId),
  tenantIdx: index('sign_sessions_tenant_idx').on(table.tenantId),
  tokenIdx: uniqueIndex('sign_sessions_token_idx').on(table.tokenHash),
  activeIdx: index('sign_sessions_active_idx')
    .on(table.status, table.expiresAt)
    .where(sql`status = 'active'`),
}));
```

### audit_events

The tamper-evident audit trail with hash chaining.

```typescript
export const auditEvents = pgTable('sign_audit_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  envelopeId: uuid('envelope_id').notNull().references(() => envelopes.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  type: text('type', {
    enum: [
      'envelope.created', 'envelope.sent', 'envelope.voided',
      'envelope.completed', 'envelope.sealed', 'envelope.expired',
      'document.uploaded', 'document.viewed',
      'signer.notified', 'signer.authenticated', 'signer.auth_failed',
      'signer.viewed', 'signer.completed', 'signer.declined', 'signer.reassigned',
      'field.completed', 'field.updated',
      'session.created', 'session.expired',
      'reminder.sent', 'certificate.generated',
    ],
  }).notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
  actorType: text('actor_type', { enum: ['user', 'signer', 'system'] }).notNull(),
  actorId: uuid('actor_id'),
  actorName: text('actor_name'),
  actorEmail: text('actor_email'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  deviceFingerprint: jsonb('device_fingerprint').$type<DeviceFingerprint>(),
  geolocation: jsonb('geolocation').$type<Geolocation>(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  hash: text('hash').notNull(),
  previousHash: text('previous_hash'),
  timestampToken: text('timestamp_token'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  envelopeIdx: index('sign_audit_envelope_idx').on(table.envelopeId),
  tenantIdx: index('sign_audit_tenant_idx').on(table.tenantId),
  typeIdx: index('sign_audit_type_idx').on(table.envelopeId, table.type),
  timestampIdx: index('sign_audit_timestamp_idx').on(table.envelopeId, table.timestamp),
  hashIdx: uniqueIndex('sign_audit_hash_idx').on(table.hash),
}));
```

### sign_templates

Reusable document templates.

```typescript
export const signTemplates = pgTable('sign_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category'),
  active: boolean('active').notNull().default(true),
  documents: jsonb('documents').notNull().$type<TemplateDocument[]>(),
  roles: jsonb('roles').notNull().$type<TemplateRole[]>(),
  variables: jsonb('variables').notNull().$type<TemplateVariable[]>().default([]),
  defaults: jsonb('defaults').notNull().$type<TemplateDefaults>().default({}),
  useCount: integer('use_count').notNull().default(0),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  tenantIdx: index('sign_templates_tenant_idx').on(table.tenantId),
  nameIdx: index('sign_templates_name_idx').on(table.tenantId, table.name),
  categoryIdx: index('sign_templates_category_idx').on(table.tenantId, table.category),
  activeIdx: index('sign_templates_active_idx')
    .on(table.tenantId, table.active)
    .where(sql`active = true AND deleted_at IS NULL`),
}));
```

### template_fields

Pre-placed fields on template documents (stored separately for indexed querying).

```typescript
export const templateFields = pgTable('sign_template_fields', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: uuid('template_id').notNull().references(() => signTemplates.id, { onDelete: 'cascade' }),
  templateDocumentId: text('template_document_id').notNull(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  roleName: text('role_name').notNull(),
  type: text('type', {
    enum: ['signature', 'initials', 'text', 'date', 'checkbox',
           'dropdown', 'radio', 'attachment', 'formula', 'note', 'stamp'],
  }).notNull(),
  required: boolean('required').notNull().default(true),
  placement: jsonb('placement').notNull().$type<FieldPlacement>(),
  label: text('label'),
  defaultValue: text('default_value'),
  validation: jsonb('validation').$type<FieldValidation>(),
  options: jsonb('options').$type<string[]>(),
  dateFormat: text('date_format'),
  tabOrder: integer('tab_order'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  templateIdx: index('sign_tpl_fields_template_idx').on(table.templateId),
  tenantIdx: index('sign_tpl_fields_tenant_idx').on(table.tenantId),
}));
```

### bulk_sends

Bulk send jobs.

```typescript
export const bulkSends = pgTable('sign_bulk_sends', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  templateId: uuid('template_id').notNull().references(() => signTemplates.id),
  name: text('name').notNull(),
  status: text('status', {
    enum: ['pending', 'processing', 'sent', 'completed', 'partial', 'failed', 'cancelled'],
  }).notNull().default('pending'),
  totalRecipients: integer('total_recipients').notNull(),
  sentCount: integer('sent_count').notNull().default(0),
  completedCount: integer('completed_count').notNull().default(0),
  errorCount: integer('error_count').notNull().default(0),
  columnMappings: jsonb('column_mappings').notNull().$type<ColumnMapping[]>(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('sign_bulk_sends_tenant_idx').on(table.tenantId),
  templateIdx: index('sign_bulk_sends_template_idx').on(table.templateId),
  statusIdx: index('sign_bulk_sends_status_idx').on(table.tenantId, table.status),
}));
```

### bulk_send_recipients

Per-recipient records within a bulk send.

```typescript
export const bulkSendRecipients = pgTable('sign_bulk_send_recipients', {
  id: uuid('id').primaryKey().defaultRandom(),
  bulkSendId: uuid('bulk_send_id').notNull().references(() => bulkSends.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  email: text('email').notNull(),
  name: text('name').notNull(),
  variables: jsonb('variables').notNull().$type<Record<string, string>>(),
  status: text('status', {
    enum: ['pending', 'sent', 'completed', 'declined', 'expired', 'error'],
  }).notNull().default('pending'),
  envelopeId: uuid('envelope_id').references(() => envelopes.id),
  error: text('error'),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  bulkSendIdx: index('sign_bulk_recipients_bulk_idx').on(table.bulkSendId),
  tenantIdx: index('sign_bulk_recipients_tenant_idx').on(table.tenantId),
  statusIdx: index('sign_bulk_recipients_status_idx').on(table.bulkSendId, table.status),
}));
```

### certificates

Digital signing certificates for PKI-based signatures.

```typescript
export const certificates = pgTable('sign_certificates', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  subjectName: text('subject_name').notNull(),
  issuer: text('issuer').notNull(),
  serialNumber: text('serial_number').notNull(),
  fingerprint: text('fingerprint').notNull(),
  validFrom: timestamp('valid_from', { withTimezone: true }).notNull(),
  validTo: timestamp('valid_to', { withTimezone: true }).notNull(),
  keyUsage: jsonb('key_usage').notNull().$type<string[]>(),
  isRevoked: boolean('is_revoked').notNull().default(false),
  certificatePem: text('certificate_pem').notNull(),
  privateKeyRef: text('private_key_ref').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('sign_certificates_tenant_idx').on(table.tenantId),
  userIdx: index('sign_certificates_user_idx').on(table.tenantId, table.userId),
  fingerprintIdx: uniqueIndex('sign_certificates_fingerprint_idx').on(table.fingerprint),
  validIdx: index('sign_certificates_valid_idx')
    .on(table.userId, table.validTo)
    .where(sql`is_revoked = false`),
}));
```

---

## Code Examples

### 1. Create and Send an Envelope

Create an envelope with two documents, add signers, place signature fields, and send.

```typescript
import { createSignService } from '@mcv/nexus/sign';

const signService = createSignService({ db, storage, config });

// Step 1: Create envelope
const envelope = await signService.createEnvelope({
  subject: 'Service Agreement — Acme Corp',
  message: 'Please review and sign the attached service agreement.',
  signingOrder: 'sequential',
  expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
  reminderConfig: {
    enabled: true,
    intervalDays: 3,
    maxReminders: 5,
  },
  branding: {
    logoUrl: 'https://acme.com/logo.png',
    primaryColor: '#2563EB',
    companyName: 'Acme Corp',
    redirectUrl: 'https://acme.com/signing-complete',
  },
});

// Step 2: Upload documents
const mainDoc = await signService.addDocument(envelope.id, {
  file: await readFile('./service-agreement.pdf'),
  filename: 'service-agreement.pdf',
  name: 'Service Agreement',
  order: 0,
});

const appendix = await signService.addDocument(envelope.id, {
  file: await readFile('./appendix-a.pdf'),
  filename: 'appendix-a.pdf',
  name: 'Appendix A — Terms of Service',
  order: 1,
});

// Step 3: Add signers
const clientSigner = await signService.addSigner(envelope.id, {
  email: 'jane@clientcorp.com',
  name: 'Jane Smith',
  role: 'signer',
  order: 1,
  authentication: { email: true, smsOtp: true },
  phone: '+14155551234',
});

const internalSigner = await signService.addSigner(envelope.id, {
  email: 'legal@acme.com',
  name: 'Bob Johnson',
  role: 'signer',
  order: 2,
  authentication: { email: true },
});

const ccRecipient = await signService.addSigner(envelope.id, {
  email: 'records@acme.com',
  name: 'Records Department',
  role: 'cc',
});

// Step 4: Place signature fields on the main document
await signService.addField(mainDoc.id, {
  signerId: clientSigner.id,
  type: 'signature',
  required: true,
  placement: { page: 5, x: 72, y: 600, width: 200, height: 50 },
  label: 'Client Signature',
});

await signService.addField(mainDoc.id, {
  signerId: clientSigner.id,
  type: 'date',
  required: true,
  placement: { page: 5, x: 300, y: 610, width: 120, height: 30 },
  label: 'Date',
  dateFormat: 'MM/DD/YYYY',
});

await signService.addField(mainDoc.id, {
  signerId: clientSigner.id,
  type: 'text',
  required: true,
  placement: { page: 5, x: 72, y: 560, width: 250, height: 25 },
  label: 'Printed Name',
});

await signService.addField(mainDoc.id, {
  signerId: internalSigner.id,
  type: 'signature',
  required: true,
  placement: { page: 5, x: 72, y: 480, width: 200, height: 50 },
  label: 'Acme Corp Signature',
});

await signService.addField(mainDoc.id, {
  signerId: internalSigner.id,
  type: 'date',
  required: true,
  placement: { page: 5, x: 300, y: 490, width: 120, height: 30 },
  label: 'Date',
  dateFormat: 'MM/DD/YYYY',
});

// Step 5: Place initials on appendix
await signService.addField(appendix.id, {
  signerId: clientSigner.id,
  type: 'initials',
  required: true,
  placement: { page: 1, x: 500, y: 720, width: 80, height: 30 },
  label: 'Client Initials',
});

// Step 6: Send the envelope
const sentEnvelope = await signService.sendEnvelope(envelope.id, {
  emailSubject: 'Action Required: Service Agreement Ready for Signature',
  emailBody: 'Hi {{signer_name}}, please review and sign the attached service agreement.',
});

console.log(sentEnvelope.status); // 'sent'
console.log(sentEnvelope.sentAt); // 2024-01-15T10:30:00Z
```

### 2. Add Signature Fields to a Document

Batch field placement with various field types and conditional logic.

```typescript
import { SignService, SignatureFieldType } from '@mcv/nexus/sign';

// Batch add fields for a complex form
const fields = await signService.batchUpdateFields(documentId, [
  // Signature block
  {
    operation: 'add',
    data: {
      signerId: primarySignerId,
      type: 'signature',
      required: true,
      placement: { page: 3, x: 72, y: 600, width: 200, height: 50 },
      label: 'Authorized Signature',
    },
  },
  // Printed name
  {
    operation: 'add',
    data: {
      signerId: primarySignerId,
      type: 'text',
      required: true,
      placement: { page: 3, x: 72, y: 560, width: 250, height: 25 },
      label: 'Printed Name',
      validation: { minLength: 2, maxLength: 100 },
    },
  },
  // Title/Role
  {
    operation: 'add',
    data: {
      signerId: primarySignerId,
      type: 'text',
      required: true,
      placement: { page: 3, x: 72, y: 530, width: 250, height: 25 },
      label: 'Title',
    },
  },
  // Date signed (auto-stamp)
  {
    operation: 'add',
    data: {
      signerId: primarySignerId,
      type: 'stamp',
      required: true,
      placement: { page: 3, x: 350, y: 600, width: 150, height: 25 },
      label: 'Date Signed',
      dateFormat: 'MMMM D, YYYY',
    },
  },
  // Agreement type dropdown
  {
    operation: 'add',
    data: {
      signerId: primarySignerId,
      type: 'dropdown',
      required: true,
      placement: { page: 1, x: 72, y: 400, width: 200, height: 30 },
      label: 'Agreement Type',
      options: ['Standard', 'Premium', 'Enterprise', 'Custom'],
    },
  },
  // Terms acceptance checkbox
  {
    operation: 'add',
    data: {
      signerId: primarySignerId,
      type: 'checkbox',
      required: true,
      placement: { page: 3, x: 72, y: 500, width: 20, height: 20 },
      label: 'I accept the Terms and Conditions',
    },
  },
  // Conditional field: only show if Enterprise selected
  {
    operation: 'add',
    data: {
      signerId: primarySignerId,
      type: 'text',
      required: true,
      placement: { page: 1, x: 72, y: 360, width: 300, height: 25 },
      label: 'Enterprise Account Manager',
      conditionalOn: {
        fieldId: 'dropdown-field-id', // Reference to the dropdown above
        value: 'Enterprise',
      },
    },
  },
  // Initials on each page
  ...[1, 2, 3].map((page) => ({
    operation: 'add' as const,
    data: {
      signerId: primarySignerId,
      type: 'initials' as SignatureFieldType,
      required: true,
      placement: { page, x: 500, y: 720, width: 60, height: 25 },
      label: `Page ${page} Initials`,
      tabOrder: page * 10,
    },
  })),
]);

console.log(`Created ${fields.length} fields`);
```

### 3. Embedded Signing Experience

Generate an embedded signing URL for an in-app iframe signing experience.

```typescript
import { SignService, EmbeddedSigningConfig } from '@mcv/nexus/sign';

// Configure the embedded experience
const embeddedConfig: EmbeddedSigningConfig = {
  allowedOrigins: ['https://app.acme.com', 'https://portal.acme.com'],
  returnUrl: 'https://app.acme.com/signing/complete?envelopeId={{envelopeId}}',
  declineUrl: 'https://app.acme.com/signing/declined?envelopeId={{envelopeId}}',
  showHeader: true,
  showFooter: false,
  showDownload: true,
  customCss: {
    primaryColor: '#2563EB',
    backgroundColor: '#F8FAFC',
    fontFamily: 'Inter, system-ui, sans-serif',
    buttonBorderRadius: '8px',
    headerBackgroundColor: '#1E293B',
  },
  locale: 'en-US',
  sessionDurationMinutes: 30,
  mobileOptimized: true,
  disableDecline: false,
  messageDisplay: 'inline',
};

// Generate embedded signing URL
const embeddedSession = await signService.createEmbeddedSession(
  signerId,
  embeddedConfig,
);

console.log(embeddedSession);
// {
//   url: 'https://sign.acme.com/embedded/session/abc123?token=eyJhbG...',
//   token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
//   expiresAt: 2024-01-15T11:00:00Z,
//   sessionId: 'sess_abc123',
// }

// === Frontend Integration (React) ===

function SigningEmbed({ signingUrl }: { signingUrl: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Listen for signing events from the iframe
    const handleMessage = (event: MessageEvent) => {
      if (!embeddedConfig.allowedOrigins.includes(event.origin)) return;

      switch (event.data.type) {
        case 'signing.ready':
          console.log('Signing UI loaded');
          break;
        case 'signing.completed':
          console.log('Signer completed:', event.data.signerId);
          // Handle completion — e.g., show success message, redirect
          break;
        case 'signing.declined':
          console.log('Signer declined:', event.data.reason);
          break;
        case 'signing.error':
          console.error('Signing error:', event.data.error);
          break;
        case 'signing.sessionExpired':
          console.warn('Session expired, prompting re-authentication');
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <iframe
      ref={iframeRef}
      src={signingUrl}
      style={{
        width: '100%',
        height: '800px',
        border: 'none',
        borderRadius: '8px',
      }}
      allow="camera" // For government ID verification
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      title="Document Signing"
    />
  );
}
```

### 4. Create and Use a Template

Create a reusable NDA template with pre-placed fields and template variables.

```typescript
import { TemplateService } from '@mcv/nexus/sign';

// Create a template
const ndaTemplate = await signService.createTemplate({
  name: 'Mutual NDA',
  description: 'Standard mutual non-disclosure agreement for business partnerships.',
  category: 'Legal',
  documents: [
    {
      file: await readFile('./templates/mutual-nda.pdf'),
      filename: 'mutual-nda.pdf',
      name: 'Mutual Non-Disclosure Agreement',
      order: 0,
    },
  ],
  roles: [
    {
      name: 'Disclosing Party',
      defaultRole: 'signer',
      order: 1,
      authentication: { email: true },
    },
    {
      name: 'Receiving Party',
      defaultRole: 'signer',
      order: 2,
      authentication: { email: true, smsOtp: true },
    },
  ],
  variables: [
    {
      name: 'disclosing_company',
      label: 'Disclosing Party Company Name',
      type: 'text',
      required: true,
    },
    {
      name: 'receiving_company',
      label: 'Receiving Party Company Name',
      type: 'text',
      required: true,
    },
    {
      name: 'effective_date',
      label: 'Agreement Effective Date',
      type: 'date',
      required: true,
    },
    {
      name: 'duration_years',
      label: 'NDA Duration (Years)',
      type: 'number',
      required: true,
      defaultValue: '2',
    },
    {
      name: 'governing_law_state',
      label: 'Governing Law State',
      type: 'text',
      required: true,
      defaultValue: 'California',
    },
  ],
  defaults: {
    subject: 'NDA: {{disclosing_company}} ↔ {{receiving_company}}',
    message: 'Please review and sign the attached Non-Disclosure Agreement.',
    signingOrder: 'sequential',
    expirationDays: 14,
    reminderConfig: {
      enabled: true,
      intervalDays: 3,
      maxReminders: 4,
    },
  },
});

// After template creation, add fields via the field placement UI
// (Fields are stored as TemplateField records linked to the template)

// Use the template to create an envelope
const envelope = await signService.createFromTemplate(
  ndaTemplate.id,
  {
    disclosing_company: 'Acme Corp',
    receiving_company: 'Widget Inc',
    effective_date: '2024-02-01',
    duration_years: '3',
    governing_law_state: 'New York',
  },
  [
    {
      email: 'legal@acme.com',
      name: 'Alice Johnson',
      // Maps to "Disclosing Party" role
    },
    {
      email: 'cto@widget.com',
      name: 'Bob Williams',
      phone: '+14155559876',
      // Maps to "Receiving Party" role
    },
  ],
);

// The envelope is created with:
// - Subject: "NDA: Acme Corp ↔ Widget Inc"
// - Pre-placed fields from the template
// - Template variables substituted in field defaults
// - Signer authentication from role defaults

// Send immediately
await signService.sendEnvelope(envelope.id);
```

### 5. Bulk Send from Template

Send an onboarding packet to 500 new hires using CSV data.

```typescript
import { BulkSendService } from '@mcv/nexus/sign';

// CSV format:
// name,email,phone,start_date,department,manager_name,salary
const csvData = `name,email,phone,start_date,department,manager_name,salary
Alice Johnson,alice@example.com,+14155551001,2024-03-01,Engineering,Sarah Tech,125000
Bob Williams,bob@example.com,+14155551002,2024-03-01,Marketing,Mike Sales,95000
Carol Davis,carol@example.com,+14155551003,2024-03-15,Design,Lisa Creative,105000
...
`;

// Create bulk send
const bulkSend = await signService.createBulkSend({
  templateId: onboardingTemplateId,
  name: 'Q1 2024 New Hire Onboarding',
  csvData,
  columnMappings: [
    { csvColumn: 'name', target: 'name' },
    { csvColumn: 'email', target: 'email' },
    { csvColumn: 'phone', target: 'phone' },
    { csvColumn: 'start_date', target: 'start_date' },
    { csvColumn: 'department', target: 'department' },
    { csvColumn: 'manager_name', target: 'manager_name' },
    { csvColumn: 'salary', target: 'salary' },
  ],
  sendImmediately: false, // Queue for review first
});

console.log(bulkSend);
// {
//   id: 'bulk_abc123',
//   status: 'pending',
//   totalRecipients: 500,
//   sentCount: 0,
//   completedCount: 0,
// }

// Review the parsed data before sending
const status = await signService.getBulkSendStatus(bulkSend.id);
console.log(`Parsed ${status.totalRecipients} recipients`);
console.log(`Errors: ${status.errorCount}`);

// Check for parsing errors
const errors = status.recipients.filter(r => r.status === 'error');
if (errors.length > 0) {
  console.error('Recipient errors:', errors.map(e => ({
    email: e.email,
    error: e.error,
  })));
}

// Start sending (processes in batches of 50)
// Internally triggers a background job
await signService.createBulkSend({
  ...bulkSend,
  sendImmediately: true,
});

// Monitor progress
const interval = setInterval(async () => {
  const progress = await signService.getBulkSendStatus(bulkSend.id);
  console.log(
    `Sent: ${progress.sentCount}/${progress.totalRecipients} | ` +
    `Completed: ${progress.completedCount} | ` +
    `Errors: ${progress.errorCount}`
  );
  if (progress.status === 'sent' || progress.status === 'failed') {
    clearInterval(interval);
  }
}, 5000);

// Later: send reminders to anyone who hasn't signed
await signService.sendBulkReminders(bulkSend.id);
```

### 6. Verify Audit Trail Integrity

Verify the cryptographic integrity of an envelope's audit trail.

```typescript
import { AuditTrailService } from '@mcv/nexus/sign';

// Get the complete audit trail
const trail = await signService.getAuditTrail(envelopeId);

console.log(`Envelope: ${envelopeId}`);
console.log(`Total events: ${trail.eventCount}`);
console.log(`Chain valid: ${trail.chainValid}`);

// Display the trail
for (const event of trail.events) {
  console.log(
    `[${event.timestamp.toISOString()}] ${event.type} — ` +
    `${event.actor.name ?? event.actor.type} ` +
    `(IP: ${event.ipAddress ?? 'N/A'})`
  );
}

// Example output:
// [2024-01-15T10:30:00Z] envelope.created — Alice Johnson (IP: 198.51.100.1)
// [2024-01-15T10:35:00Z] document.uploaded — Alice Johnson (IP: 198.51.100.1)
// [2024-01-15T10:35:01Z] document.uploaded — Alice Johnson (IP: 198.51.100.1)
// [2024-01-15T10:36:00Z] envelope.sent — system (IP: N/A)
// [2024-01-15T10:36:01Z] signer.notified — system (IP: N/A)
// [2024-01-15T10:36:02Z] signer.notified — system (IP: N/A)
// [2024-01-15T11:15:00Z] signer.viewed — Jane Smith (IP: 203.0.113.42)
// [2024-01-15T11:15:01Z] session.created — Jane Smith (IP: 203.0.113.42)
// [2024-01-15T11:15:02Z] signer.authenticated — Jane Smith (IP: 203.0.113.42)
// [2024-01-15T11:16:00Z] document.viewed — Jane Smith (IP: 203.0.113.42)
// [2024-01-15T11:20:00Z] field.completed — Jane Smith (IP: 203.0.113.42)
// [2024-01-15T11:20:05Z] field.completed — Jane Smith (IP: 203.0.113.42)
// [2024-01-15T11:20:30Z] signer.completed — Jane Smith (IP: 203.0.113.42)
// [2024-01-15T11:20:31Z] signer.notified — system (IP: N/A)
// ...
// [2024-01-16T09:00:00Z] envelope.completed — system (IP: N/A)
// [2024-01-16T09:00:01Z] envelope.sealed — system (IP: N/A)
// [2024-01-16T09:00:02Z] certificate.generated — system (IP: N/A)

// Verify integrity
const verification = await signService.verifyAuditTrail(envelopeId);

if (verification.valid) {
  console.log(`✓ Audit trail integrity verified (${verification.totalEvents} events)`);
} else {
  console.error(`✗ Audit trail integrity FAILED`);
  console.error(`  Valid: ${verification.validEvents}/${verification.totalEvents}`);
  console.error(`  First invalid at index: ${verification.firstInvalidIndex}`);
  for (const failure of verification.failures) {
    console.error(
      `  Event #${failure.index} (${failure.eventId}): ${failure.reason}\n` +
      `    Expected: ${failure.expectedHash}\n` +
      `    Actual:   ${failure.actualHash}`
    );
  }
}

// Download Certificate of Completion
const certPdf = await signService.downloadCertificate(envelopeId);
await writeFile(`./certificate-${envelopeId}.pdf`, certPdf.data);
console.log(`Certificate saved: ${certPdf.filename} (${certPdf.size} bytes)`);
```

### 7. Handle Webhook Events

Register webhooks and process incoming events.

```typescript
import { SignWebhookService, WebhookEvent } from '@mcv/nexus/sign';
import { createHmac, timingSafeEqual } from 'crypto';

// Register a webhook endpoint
const webhook = await signService.registerWebhook({
  url: 'https://api.acme.com/webhooks/sign',
  events: [
    'envelope.completed',
    'envelope.declined',
    'envelope.voided',
    'signer.completed',
    'signer.declined',
  ],
  secret: process.env.SIGN_WEBHOOK_SECRET!,
  active: true,
  headers: {
    'X-API-Key': process.env.INTERNAL_API_KEY!,
  },
});

console.log(`Webhook registered: ${webhook.id}`);

// === Webhook Handler (Express/tRPC endpoint) ===

import { TRPCError } from '@trpc/server';

export const signWebhookHandler = async (req: Request) => {
  const signature = req.headers['x-sign-signature'] as string;
  const timestamp = req.headers['x-sign-timestamp'] as string;
  const body = await req.text();

  // Step 1: Verify timestamp freshness (prevent replay attacks)
  const eventTime = parseInt(timestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - eventTime) > 300) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Webhook timestamp too old',
    });
  }

  // Step 2: Verify HMAC signature
  const expectedSignature = createHmac('sha256', process.env.SIGN_WEBHOOK_SECRET!)
    .update(`${timestamp}.${body}`)
    .digest('hex');

  const sigBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');

  if (!timingSafeEqual(sigBuffer, expectedBuffer)) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Invalid webhook signature',
    });
  }

  // Step 3: Parse and process the event
  const event: WebhookEvent = JSON.parse(body);

  switch (event.type) {
    case 'envelope.completed': {
      console.log(`Envelope completed: ${event.data.envelopeId}`);
      // Download the signed documents
      const bundle = await signService.downloadCompletedBundle(event.data.envelopeId);
      // Archive to document management system
      await archiveSignedDocument(event.data, bundle);
      // Update CRM deal status
      if (event.data.metadata?.dealId) {
        await crmService.updateDeal(event.data.metadata.dealId, {
          status: 'closed_won',
          contractSignedAt: new Date(),
        });
      }
      break;
    }

    case 'envelope.declined': {
      console.log(`Envelope declined: ${event.data.envelopeId}`);
      console.log(`Reason: ${event.data.declineReason}`);
      // Notify the sender
      await notificationService.send({
        userId: event.data.metadata?.senderId,
        title: 'Signature Declined',
        body: `${event.data.signerName} declined to sign "${event.data.subject}": ${event.data.declineReason}`,
      });
      break;
    }

    case 'signer.completed': {
      console.log(`Signer completed: ${event.data.signerEmail}`);
      // Track progress
      await analyticsService.track('signer_completed', {
        envelopeId: event.data.envelopeId,
        signerEmail: event.data.signerEmail,
      });
      break;
    }

    default:
      console.log(`Unhandled event: ${event.type}`);
  }

  return { received: true };
};
```

### 8. Digital Certificate-Based Signing (PKI)

Use PKI certificates for advanced digital signatures with timestamp authority.

```typescript
import { PkiSigningService, TimestampAuthorityClient } from '@mcv/nexus/sign';

// Register a signing certificate
const certificate = await signService.registerCertificate({
  // PEM-encoded certificate
  certificatePem: await readFile('./certs/signing-cert.pem', 'utf-8'),
  // Private key (will be encrypted and stored securely)
  privateKeyPem: await readFile('./certs/signing-key.pem', 'utf-8'),
  // Private key passphrase
  passphrase: process.env.CERT_PASSPHRASE,
});

console.log(`Certificate registered: ${certificate.id}`);
console.log(`Subject: ${certificate.subjectName}`);
console.log(`Issuer: ${certificate.issuer}`);
console.log(`Valid: ${certificate.validFrom} — ${certificate.validTo}`);
console.log(`Fingerprint: ${certificate.fingerprint}`);

// Create an envelope with PKI signing enabled
const envelope = await signService.createEnvelope({
  subject: 'Board Resolution — Digital Signature Required',
  signingOrder: 'sequential',
  metadata: {
    requirePki: 'true',
    complianceLevel: 'qualified', // eIDAS QES level
  },
});

// Add document and signer (similar to Example 1)
// ...

// When the signer completes, PKI signing is applied:
// The signing flow internally:
//
// 1. Signer draws/types their visual signature
// 2. System creates PKCS#7 detached signature using the signer's certificate
// 3. Timestamp token obtained from TSA (RFC 3161)
// 4. Signature embedded in the PDF (/ByteRange covering entire file)
// 5. LTV data (OCSP responses + CRLs) embedded for long-term validation

// Verify a PKI-signed document
const verificationResult = await signService.verifyPkiSignature(envelopeId, documentId);

console.log('PKI Verification:');
console.log(`  Signature valid: ${verificationResult.signatureValid}`);
console.log(`  Certificate valid: ${verificationResult.certificateValid}`);
console.log(`  Not revoked: ${!verificationResult.certificateRevoked}`);
console.log(`  Timestamp valid: ${verificationResult.timestampValid}`);
console.log(`  LTV enabled: ${verificationResult.ltvEnabled}`);
console.log(`  Algorithm: ${verificationResult.algorithm}`);
console.log(`  Signed at: ${verificationResult.signedAt}`);
console.log(`  TSA: ${verificationResult.timestampAuthority}`);

// Verify long-term validity (even if certificate has since expired)
const ltvResult = await signService.verifyLtv(envelopeId, documentId);
console.log(`  LTV valid: ${ltvResult.valid}`);
console.log(`  Validation chain: ${ltvResult.chainLength} certificates`);
console.log(`  OCSP responses embedded: ${ltvResult.ocspResponseCount}`);
```

---

## Error Codes

All errors follow the MCV.ONE error format with the `SIGN_` prefix.

| Code | HTTP | Description |
|---|---|---|
| `SIGN_ENVELOPE_NOT_FOUND` | 404 | Envelope with the specified ID does not exist or is not accessible. |
| `SIGN_ENVELOPE_NOT_DRAFT` | 409 | Operation requires envelope to be in draft state (e.g., adding fields). |
| `SIGN_ENVELOPE_NOT_SENT` | 409 | Operation requires envelope to be in sent or active state. |
| `SIGN_ENVELOPE_ALREADY_SENT` | 409 | Cannot modify an envelope that has already been sent. |
| `SIGN_ENVELOPE_COMPLETED` | 409 | Cannot modify a completed/sealed envelope. |
| `SIGN_ENVELOPE_VOIDED` | 409 | Operation attempted on a voided envelope. |
| `SIGN_ENVELOPE_EXPIRED` | 410 | Envelope has passed its expiration date. |
| `SIGN_DOCUMENT_NOT_FOUND` | 404 | Document with the specified ID does not exist. |
| `SIGN_DOCUMENT_INVALID_PDF` | 422 | Uploaded file is not a valid PDF or is corrupted. |
| `SIGN_DOCUMENT_TOO_LARGE` | 413 | Document exceeds the maximum file size (25MB). |
| `SIGN_DOCUMENT_PAGE_LIMIT` | 422 | Document exceeds the maximum page count (500 pages). |
| `SIGN_DOCUMENT_MALICIOUS` | 422 | PDF contains potentially malicious content (JavaScript, actions). |
| `SIGN_FIELD_NOT_FOUND` | 404 | Signature field with the specified ID does not exist. |
| `SIGN_FIELD_INVALID_PLACEMENT` | 422 | Field placement is outside document bounds or overlaps. |
| `SIGN_FIELD_REQUIRED` | 422 | A required field has not been completed. |
| `SIGN_FIELD_VALIDATION_FAILED` | 422 | Field value does not pass validation rules. |
| `SIGN_FIELD_ALREADY_COMPLETED` | 409 | Field has already been completed and cannot be modified. |
| `SIGN_SIGNER_NOT_FOUND` | 404 | Signer with the specified ID does not exist. |
| `SIGN_SIGNER_ALREADY_COMPLETED` | 409 | Signer has already completed signing. |
| `SIGN_SIGNER_DECLINED` | 409 | Signer has already declined this envelope. |
| `SIGN_SIGNER_NOT_CURRENT` | 403 | In sequential signing, this signer is not the current active signer. |
| `SIGN_SIGNER_LIMIT_EXCEEDED` | 422 | Maximum number of signers per envelope exceeded (50). |
| `SIGN_SESSION_EXPIRED` | 401 | Signing session has expired. A new session must be created. |
| `SIGN_SESSION_INVALID` | 401 | Signing session token is invalid or has been revoked. |
| `SIGN_SESSION_IP_MISMATCH` | 403 | Session IP address does not match the original authentication IP. |
| `SIGN_AUTH_REQUIRED` | 401 | Signer authentication is required before signing. |
| `SIGN_AUTH_FAILED` | 401 | Signer failed identity verification. |
| `SIGN_AUTH_OTP_INVALID` | 401 | SMS OTP code is invalid or expired. |
| `SIGN_AUTH_OTP_MAX_ATTEMPTS` | 429 | Maximum OTP verification attempts exceeded. |
| `SIGN_AUTH_ACCESS_CODE_INVALID` | 401 | Access code (PIN) is incorrect. |
| `SIGN_AUTH_KBA_FAILED` | 401 | Knowledge-based authentication answers incorrect. |
| `SIGN_AUTH_ID_VERIFICATION_FAILED` | 401 | Government ID verification failed. |
| `SIGN_TEMPLATE_NOT_FOUND` | 404 | Template with the specified ID does not exist. |
| `SIGN_TEMPLATE_INACTIVE` | 409 | Template is inactive and cannot be used. |
| `SIGN_TEMPLATE_VARIABLE_MISSING` | 422 | Required template variable not provided. |
| `SIGN_BULK_SEND_NOT_FOUND` | 404 | Bulk send job with the specified ID does not exist. |
| `SIGN_BULK_SEND_ALREADY_STARTED` | 409 | Bulk send has already started processing. |
| `SIGN_BULK_CSV_INVALID` | 422 | CSV data is malformed or missing required columns. |
| `SIGN_BULK_CSV_TOO_LARGE` | 413 | CSV exceeds maximum recipient count (10,000). |
| `SIGN_CERTIFICATE_NOT_FOUND` | 404 | Digital certificate with the specified ID does not exist. |
| `SIGN_CERTIFICATE_EXPIRED` | 409 | Certificate has expired and cannot be used for signing. |
| `SIGN_CERTIFICATE_REVOKED` | 409 | Certificate has been revoked. |
| `SIGN_PKI_SIGNATURE_FAILED` | 500 | Failed to create PKCS#7 digital signature. |
| `SIGN_TSA_UNAVAILABLE` | 503 | Timestamp Authority service is unavailable. |
| `SIGN_WEBHOOK_DELIVERY_FAILED` | 502 | Webhook delivery failed after retries. |
| `SIGN_RATE_LIMIT_EXCEEDED` | 429 | Too many requests. Rate limit exceeded for this operation. |
| `SIGN_STORAGE_QUOTA_EXCEEDED` | 507 | Tenant storage quota exceeded. |

### Error Response Format

```typescript
interface SignError {
  code: string;        // e.g., 'SIGN_ENVELOPE_NOT_FOUND'
  message: string;     // Human-readable error message
  statusCode: number;  // HTTP status code
  details?: Record<string, unknown>; // Additional context
}

// Example error response:
// {
//   code: 'SIGN_FIELD_VALIDATION_FAILED',
//   message: 'Field value does not pass validation rules.',
//   statusCode: 422,
//   details: {
//     fieldId: 'field_abc123',
//     fieldType: 'text',
//     label: 'Company Name',
//     rule: 'minLength',
//     expected: 2,
//     actual: 0,
//   }
// }
```

---

## Security

### Document Security

| Control | Implementation |
|---|---|
| **Encryption at rest** | All documents stored in Supabase Storage with AES-256 encryption. Storage bucket policies enforce tenant isolation. |
| **Encryption in transit** | All API and signing endpoints require TLS 1.2+. HSTS headers enforced. |
| **Document hash verification** | SHA-256 hash computed on upload and verified on every access. Any tampering is detected. |
| **Malicious content scanning** | PDFs are scanned for JavaScript, form actions, embedded executables, and other potentially dangerous content before acceptance. |
| **File type validation** | Only PDF files are accepted. MIME type and magic bytes are validated, not just file extension. |
| **Size limits** | 25MB per document, 100MB per envelope, 500 pages per document. Prevents resource exhaustion. |
| **Temporary URL signing** | Document download URLs are signed with short-lived tokens (15 minutes). No persistent public URLs. |
| **Watermarking** | Draft documents are watermarked with "DRAFT" overlay. Voided documents are watermarked with "VOID". |

### Signer Authentication

The module supports multiple authentication methods that can be combined for stronger identity assurance.

| Method | Security Level | Description |
|---|---|---|
| **Email verification** | Basic | Signer accesses documents via a unique link sent to their email. Proves email ownership. |
| **SMS OTP** | Medium | One-time passcode sent via SMS to the signer's registered phone number. 6-digit code, 5-minute expiry, 3 attempts max. |
| **Access code (PIN)** | Medium | Sender-defined access code that the signer must enter. Shared out-of-band (phone call, separate email). |
| **Knowledge-based authentication (KBA)** | High | Identity verification questions pulled from public records databases. 4 questions, must answer 3 correctly. |
| **Government ID** | Highest | Photo ID verification using camera capture. AI-powered document extraction and face match. |
| **Custom webhook** | Variable | Delegates authentication to a custom endpoint. Useful for SSO or internal identity providers. |

```typescript
// Authentication flow:
// 1. Signer clicks signing link
// 2. System checks required authentication methods
// 3. Methods are verified in order: email → access code → SMS OTP → KBA → Gov ID
// 4. Each successful verification is recorded as an audit event
// 5. Failed attempts are logged with IP and device info
// 6. After max failed attempts, signer is locked out (configurable)

// Security controls:
const AUTH_SECURITY_DEFAULTS = {
  otpLength: 6,
  otpExpiryMinutes: 5,
  otpMaxAttempts: 3,
  kbaQuestionCount: 4,
  kbaMinCorrect: 3,
  accessCodeMaxAttempts: 5,
  lockoutDurationMinutes: 30,
  sessionDurationMinutes: 60,
  sessionInactivityMinutes: 15,
};
```

### Cryptographic Integrity

| Component | Algorithm | Purpose |
|---|---|---|
| **Audit trail hash chain** | SHA-256 | Each audit event is hashed with the previous event's hash, creating a tamper-evident chain. |
| **Document integrity** | SHA-256 | Original and signed document hashes ensure no modification. |
| **Session tokens** | JWT (HS256/RS256) | Signing session tokens with short expiry and IP binding. |
| **Webhook signatures** | HMAC-SHA256 | Webhook payloads are signed with a shared secret for verification. |
| **PKI signatures** | PKCS#7 / CMS | Digital signatures using X.509 certificates with RSA or ECDSA. |
| **Timestamp authority** | RFC 3161 | Trusted third-party timestamps prove signing time. |
| **Long-term validation** | PDF LTV | OCSP responses and CRLs embedded for validation after certificate expiry. |
| **Password/PIN storage** | Argon2id | Access codes and PINs are hashed with Argon2id before storage. |

### Multi-Tenant Isolation

```sql
-- RLS Policy (applied to all sign_* tables)
CREATE POLICY "tenant_isolation" ON sign_envelopes
  FOR ALL
  USING (tenant_id = (current_setting('app.tenant_id'))::uuid)
  WITH CHECK (tenant_id = (current_setting('app.tenant_id'))::uuid);

-- Signing session access (allows cross-tenant read for signer access)
CREATE POLICY "signer_session_access" ON sign_signing_sessions
  FOR SELECT
  USING (
    tenant_id = (current_setting('app.tenant_id'))::uuid
    OR token_hash = current_setting('app.session_token_hash')
  );

-- Storage bucket policy
-- sign-documents/{tenant_id}/**
-- Only accessible by authenticated users with matching tenant_id
```

### Compliance Framework

| Standard | Coverage | Notes |
|---|---|---|
| **ESIGN Act** (US, 2000) | ✅ Full | Electronic signatures carry same legal weight as wet ink signatures. Consent mechanism, opt-out ability, record retention. |
| **UETA** (US, 1999) | ✅ Full | Uniform Electronic Transactions Act. Intent to sign, association with record, record retention. |
| **eIDAS** (EU, 2014) | ✅ SES/AES/QES | Simple Electronic Signatures (default), Advanced (PKI), Qualified (with qualified certificate + SSCD). |
| **SOC 2 Type II** | ✅ Aligned | Controls for security, availability, processing integrity, confidentiality, and privacy. |
| **GDPR** | ✅ Aligned | Data minimization, right to erasure (with legal hold exceptions), data portability, consent management. |
| **HIPAA** | ⚠️ Configurable | BAA-ready when deployed on HIPAA-compliant infrastructure. PHI encryption and access controls built in. |
| **21 CFR Part 11** | ⚠️ Configurable | FDA electronic records. Requires PKI signing, audit trails, and specific validation. |

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `SIGN_STORAGE_BUCKET` | Yes | `sign-documents` | Supabase Storage bucket name for document storage. |
| `SIGN_SESSION_SECRET` | Yes | — | Secret key for signing JWT session tokens (min 32 chars). |
| `SIGN_SESSION_DURATION_MINUTES` | No | `60` | Default signing session duration in minutes. |
| `SIGN_SESSION_INACTIVITY_MINUTES` | No | `15` | Session inactivity timeout in minutes. |
| `SIGN_MAX_DOCUMENT_SIZE_MB` | No | `25` | Maximum document file size in megabytes. |
| `SIGN_MAX_DOCUMENTS_PER_ENVELOPE` | No | `10` | Maximum documents per envelope. |
| `SIGN_MAX_SIGNERS_PER_ENVELOPE` | No | `50` | Maximum signers per envelope. |
| `SIGN_MAX_FIELDS_PER_DOCUMENT` | No | `200` | Maximum fields per document. |
| `SIGN_DEFAULT_EXPIRATION_DAYS` | No | `30` | Default envelope expiration in days (0 = no expiration). |
| `SIGN_DEFAULT_REMINDER_DAYS` | No | `3` | Default reminder interval in days. |
| `SIGN_WEBHOOK_TIMEOUT_MS` | No | `10000` | Webhook delivery timeout in milliseconds. |
| `SIGN_WEBHOOK_MAX_RETRIES` | No | `3` | Maximum webhook delivery retry attempts. |
| `SIGN_WEBHOOK_RETRY_DELAY_MS` | No | `5000` | Delay between webhook retries (exponential backoff applied). |
| `SIGN_OTP_PROVIDER` | No | `twilio` | SMS OTP provider (`twilio`, `vonage`, `aws_sns`). |
| `SIGN_OTP_FROM_NUMBER` | Cond. | — | SMS sender phone number (required if OTP enabled). |
| `SIGN_TSA_URL` | No | — | RFC 3161 Timestamp Authority URL. Required for PKI signing. |
| `SIGN_TSA_USERNAME` | No | — | TSA authentication username (if required). |
| `SIGN_TSA_PASSWORD` | No | — | TSA authentication password (if required). |
| `SIGN_PKI_ENABLED` | No | `false` | Enable PKI-based digital signatures. |
| `SIGN_PKI_HSM_PROVIDER` | No | — | HSM provider for private key storage (`aws_cloudhsm`, `azure_keyvault`, `local`). |
| `SIGN_ID_VERIFICATION_PROVIDER` | No | — | Government ID verification provider (`onfido`, `jumio`, `persona`). |
| `SIGN_ID_VERIFICATION_API_KEY` | Cond. | — | API key for ID verification provider. |
| `SIGN_KBA_PROVIDER` | No | — | KBA provider (`lexisnexis`, `idology`). |
| `SIGN_KBA_API_KEY` | Cond. | — | API key for KBA provider. |
| `SIGN_EMAIL_FROM` | No | `sign@{tenant_domain}` | Sender email address for signing notifications. |
| `SIGN_EMAIL_REPLY_TO` | No | — | Reply-to email for signing notifications. |
| `SIGN_BASE_URL` | Yes | — | Base URL for signing links (e.g., `https://sign.acme.com`). |
| `SIGN_EMBEDDED_ALLOWED_ORIGINS` | No | — | Comma-separated allowed origins for embedded signing iframes. |
| `SIGN_BULK_BATCH_SIZE` | No | `50` | Number of envelopes created per batch in bulk send. |
| `SIGN_BULK_MAX_RECIPIENTS` | No | `10000` | Maximum recipients per bulk send. |
| `SIGN_AUDIT_TSA_ENABLED` | No | `false` | Enable timestamp authority for audit trail events. |
| `SIGN_THUMBNAIL_QUALITY` | No | `80` | JPEG quality for page thumbnails (1-100). |
| `SIGN_THUMBNAIL_MAX_WIDTH` | No | `800` | Maximum width in pixels for page thumbnails. |

---

## Dependencies

### Runtime Dependencies

| Package | Version | Purpose |
|---|---|---|
| `pdf-lib` | `^1.17.1` | PDF manipulation: reading, writing, field overlay, flattening, digital signatures. |
| `@pdf-lib/fontkit` | `^1.1.1` | Custom font embedding for typed signatures in PDFs. |
| `sharp` | `^0.33.0` | Image processing for signature rendering, thumbnails, and ID verification preprocessing. |
| `jose` | `^5.2.0` | JWT creation and verification for signing session tokens. |
| `@noble/hashes` | `^1.3.3` | SHA-256 hashing for audit trail chain, document integrity, and HMAC. |
| `csv-parse` | `^5.5.0` | CSV parsing for bulk send recipient data. |
| `drizzle-orm` | `^0.30.0` | Database ORM for all sign module tables. |
| `@trpc/server` | `^10.45.0` | API router definitions. |
| `zod` | `^3.22.0` | Input validation schemas. |
| `@supabase/supabase-js` | `^2.40.0` | Supabase client for storage and auth integration. |

### Optional Dependencies

| Package | Version | Purpose |
|---|---|---|
| `pkijs` | `^3.0.16` | PKCS#7/CMS digital signature creation (required if PKI enabled). |
| `asn1js` | `^3.0.5` | ASN.1 encoding for PKI operations (peer dep of pkijs). |
| `@peculiar/x509` | `^1.9.0` | X.509 certificate parsing and validation. |
| `twilio` | `^4.20.0` | SMS OTP delivery via Twilio (if `SIGN_OTP_PROVIDER=twilio`). |
| `@vonage/server-sdk` | `^3.10.0` | SMS OTP delivery via Vonage (if `SIGN_OTP_PROVIDER=vonage`). |
| `@aws-sdk/client-sns` | `^3.500.0` | SMS OTP delivery via AWS SNS (if `SIGN_OTP_PROVIDER=aws_sns`). |
| `@aws-sdk/client-cloudhsm` | `^3.500.0` | AWS CloudHSM for private key storage (if configured). |
| `@azure/keyvault-keys` | `^4.8.0` | Azure Key Vault for private key storage (if configured). |

### Internal Dependencies

| Package | Purpose |
|---|---|
| `@mcv/core` | Shared types, error handling, tenant context, logging. |
| `@mcv/auth` | User authentication and authorization context. |
| `@mcv/db` | Database connection pooling and Drizzle configuration. |
| `@mcv/storage` | Supabase Storage abstraction for document upload/download. |
| `@mcv/email` | Email delivery for signer notifications and completed copies. |
| `@mcv/jobs` | Background job queue for bulk sends, reminders, and expiration checks. |
| `@mcv/webhooks` | Webhook delivery infrastructure with retry logic. |
| `@mcv/notifications` | Push notification delivery for in-app signing alerts. |

---

## Testing

### Test Structure

```
src/
  __tests__/
    unit/
      envelope.service.test.ts
      document.service.test.ts
      field.service.test.ts
      signing.service.test.ts
      signer-auth.service.test.ts
      audit-trail.service.test.ts
      template.service.test.ts
      bulk-send.service.test.ts
      pdf-processor.service.test.ts
      pdf-field-renderer.service.test.ts
      signature-renderer.service.test.ts
      pki-signing.service.test.ts
      tsa-client.service.test.ts
      webhook.service.test.ts
    integration/
      envelope-lifecycle.test.ts
      signing-flow.test.ts
      embedded-signing.test.ts
      template-workflow.test.ts
      bulk-send-workflow.test.ts
      audit-trail-integrity.test.ts
      pki-signing-flow.test.ts
      webhook-delivery.test.ts
      signer-authentication.test.ts
    e2e/
      complete-signing-flow.test.ts
      multi-signer-sequential.test.ts
      multi-signer-parallel.test.ts
      template-to-completion.test.ts
      bulk-send-lifecycle.test.ts
      embedded-signing-iframe.test.ts
    fixtures/
      sample-contract.pdf
      sample-nda.pdf
      multi-page-document.pdf
      malicious-pdf.pdf
      oversized-pdf.pdf
      signing-cert.pem
      signing-key.pem
      ca-cert.pem
      bulk-send-sample.csv
```

### Running Tests

```bash
# All sign module tests
pnpm test --filter @mcv/nexus-sign

# Unit tests only
pnpm test --filter @mcv/nexus-sign -- --testPathPattern=unit

# Integration tests (requires database)
pnpm test --filter @mcv/nexus-sign -- --testPathPattern=integration

# E2E tests (requires full stack)
pnpm test:e2e --filter @mcv/nexus-sign

# Specific test file
pnpm test --filter @mcv/nexus-sign -- envelope.service.test

# Coverage report
pnpm test --filter @mcv/nexus-sign -- --coverage
```

### Unit Test Examples

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EnvelopeService } from '../services/envelope.service';
import { createMockDb, createMockStorage } from '@mcv/testing';

describe('EnvelopeService', () => {
  let service: EnvelopeService;
  let mockDb: ReturnType<typeof createMockDb>;
  let mockStorage: ReturnType<typeof createMockStorage>;

  beforeEach(() => {
    mockDb = createMockDb();
    mockStorage = createMockStorage();
    service = new EnvelopeService(mockDb, mockStorage, {
      tenantId: 'tenant_test',
      userId: 'user_test',
    });
  });

  describe('createEnvelope', () => {
    it('creates an envelope in draft state', async () => {
      const envelope = await service.create({
        subject: 'Test Agreement',
        signingOrder: 'sequential',
      });

      expect(envelope.status).toBe('draft');
      expect(envelope.subject).toBe('Test Agreement');
      expect(envelope.signingOrder).toBe('sequential');
      expect(envelope.tenantId).toBe('tenant_test');
      expect(envelope.senderId).toBe('user_test');
    });

    it('validates subject is not empty', async () => {
      await expect(service.create({ subject: '' }))
        .rejects.toThrow('SIGN_FIELD_VALIDATION_FAILED');
    });

    it('sets default expiration when configured', async () => {
      const envelope = await service.create({
        subject: 'Test',
        expiresAt: new Date('2024-12-31'),
      });

      expect(envelope.expiresAt).toEqual(new Date('2024-12-31'));
    });
  });

  describe('sendEnvelope', () => {
    it('transitions from draft to sent', async () => {
      const envelope = await createDraftEnvelopeWithSigners(service);
      const sent = await service.send(envelope.id);

      expect(sent.status).toBe('sent');
      expect(sent.sentAt).toBeDefined();
    });

    it('rejects sending without documents', async () => {
      const envelope = await service.create({ subject: 'No Docs' });
      await service.addSigner(envelope.id, {
        email: 'test@example.com',
        name: 'Test',
      });

      await expect(service.send(envelope.id))
        .rejects.toThrow('SIGN_ENVELOPE_NOT_DRAFT');
    });

    it('rejects sending without signers', async () => {
      const envelope = await service.create({ subject: 'No Signers' });
      await service.addDocument(envelope.id, {
        file: samplePdf,
        filename: 'test.pdf',
      });

      await expect(service.send(envelope.id))
        .rejects.toThrow('SIGN_SIGNER_LIMIT_EXCEEDED');
    });

    it('rejects sending an already-sent envelope', async () => {
      const envelope = await createSentEnvelope(service);

      await expect(service.send(envelope.id))
        .rejects.toThrow('SIGN_ENVELOPE_ALREADY_SENT');
    });
  });

  describe('voidEnvelope', () => {
    it('voids a sent envelope with reason', async () => {
      const envelope = await createSentEnvelope(service);
      const voided = await service.void(envelope.id, 'Terms changed');

      expect(voided.status).toBe('voided');
      expect(voided.voidReason).toBe('Terms changed');
      expect(voided.voidedAt).toBeDefined();
    });

    it('cannot void a completed envelope', async () => {
      const envelope = await createCompletedEnvelope(service);

      await expect(service.void(envelope.id, 'Too late'))
        .rejects.toThrow('SIGN_ENVELOPE_COMPLETED');
    });
  });
});

describe('AuditTrailService', () => {
  describe('hash chain integrity', () => {
    it('builds a valid hash chain', async () => {
      const trail = await auditService.getTrail(envelopeId);

      // Verify first event has no previousHash
      expect(trail.events[0].previousHash).toBeNull();

      // Verify each subsequent event chains to the previous
      for (let i = 1; i < trail.events.length; i++) {
        expect(trail.events[i].previousHash).toBe(trail.events[i - 1].hash);
      }
    });

    it('detects tampered events', async () => {
      // Manually tamper with an event in the database
      await mockDb.execute(sql`
        UPDATE sign_audit_events
        SET metadata = '{"tampered": true}'::jsonb
        WHERE id = ${middleEventId}
      `);

      const result = await auditService.verify(envelopeId);

      expect(result.valid).toBe(false);
      expect(result.firstInvalidIndex).toBeGreaterThan(0);
      expect(result.failures).toHaveLength(1);
    });

    it('computes deterministic hashes', async () => {
      const event = {
        type: 'envelope.created',
        timestamp: new Date('2024-01-15T10:30:00Z'),
        actor: { type: 'user', id: 'user_1', name: 'Alice' },
        ipAddress: '198.51.100.1',
        previousHash: null,
      };

      const hash1 = auditService.computeHash(event);
      const hash2 = auditService.computeHash(event);

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex
    });
  });
});

describe('PdfProcessor', () => {
  it('validates PDF format', async () => {
    const invalidFile = Buffer.from('not a pdf');
    await expect(pdfProcessor.validate(invalidFile))
      .rejects.toThrow('SIGN_DOCUMENT_INVALID_PDF');
  });

  it('rejects PDFs with JavaScript', async () => {
    const maliciousPdf = await readFile('./fixtures/malicious-pdf.pdf');
    await expect(pdfProcessor.validate(maliciousPdf))
      .rejects.toThrow('SIGN_DOCUMENT_MALICIOUS');
  });

  it('extracts page count and dimensions', async () => {
    const pdf = await readFile('./fixtures/sample-contract.pdf');
    const info = await pdfProcessor.analyze(pdf);

    expect(info.pageCount).toBe(5);
    expect(info.pages[0].width).toBe(612); // Letter width in points
    expect(info.pages[0].height).toBe(792); // Letter height in points
  });

  it('renders signature onto PDF page', async () => {
    const pdf = await readFile('./fixtures/sample-contract.pdf');
    const signatureImage = Buffer.from(testSignatureBase64, 'base64');

    const result = await pdfProcessor.renderSignature(pdf, {
      page: 1,
      x: 72,
      y: 600,
      width: 200,
      height: 50,
      image: signatureImage,
    });

    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(pdf.length);

    // Verify the signature is on the correct page
    const analyzed = await pdfProcessor.analyze(result);
    expect(analyzed.pageCount).toBe(5); // Same page count
  });

  it('generates page thumbnails', async () => {
    const pdf = await readFile('./fixtures/multi-page-document.pdf');
    const thumbnails = await pdfProcessor.generateThumbnails(pdf, {
      maxWidth: 800,
      quality: 80,
    });

    expect(thumbnails).toHaveLength(10);
    for (const thumb of thumbnails) {
      expect(thumb.width).toBeLessThanOrEqual(800);
      expect(thumb.mimeType).toBe('image/jpeg');
    }
  });
});

describe('SignerAuthService', () => {
  it('sends SMS OTP and verifies', async () => {
    const session = await authService.initiateOtp(signerId, '+14155551234');
    expect(session.status).toBe('pending');

    // Verify with correct code
    const result = await authService.verifyOtp(session.id, '123456');
    expect(result.authenticated).toBe(true);
  });

  it('rejects expired OTP', async () => {
    const session = await authService.initiateOtp(signerId, '+14155551234');

    // Fast-forward time past expiry
    vi.advanceTimersByTime(6 * 60 * 1000); // 6 minutes

    await expect(authService.verifyOtp(session.id, '123456'))
      .rejects.toThrow('SIGN_AUTH_OTP_INVALID');
  });

  it('locks out after max attempts', async () => {
    const session = await authService.initiateOtp(signerId, '+14155551234');

    // Fail 3 times
    for (let i = 0; i < 3; i++) {
      await expect(authService.verifyOtp(session.id, 'wrong'))
        .rejects.toThrow('SIGN_AUTH_OTP_INVALID');
    }

    // 4th attempt should be locked
    await expect(authService.verifyOtp(session.id, '123456'))
      .rejects.toThrow('SIGN_AUTH_OTP_MAX_ATTEMPTS');
  });
});
```

### Integration Test Example

```typescript
describe('Complete Signing Flow (Integration)', () => {
  it('handles sequential two-signer flow end-to-end', async () => {
    // Step 1: Create and send envelope
    const envelope = await signService.createEnvelope({
      subject: 'Integration Test Agreement',
      signingOrder: 'sequential',
    });

    const doc = await signService.addDocument(envelope.id, {
      file: samplePdf,
      filename: 'agreement.pdf',
    });

    const signer1 = await signService.addSigner(envelope.id, {
      email: 'signer1@test.com',
      name: 'First Signer',
      order: 1,
    });

    const signer2 = await signService.addSigner(envelope.id, {
      email: 'signer2@test.com',
      name: 'Second Signer',
      order: 2,
    });

    const sigField1 = await signService.addField(doc.id, {
      signerId: signer1.id,
      type: 'signature',
      required: true,
      placement: { page: 1, x: 72, y: 600, width: 200, height: 50 },
    });

    const sigField2 = await signService.addField(doc.id, {
      signerId: signer2.id,
      type: 'signature',
      required: true,
      placement: { page: 1, x: 72, y: 500, width: 200, height: 50 },
    });

    await signService.sendEnvelope(envelope.id);

    // Step 2: First signer signs
    const url1 = await signService.getSigningUrl(signer1.id);
    const session1 = await signService.createSigningSession(signer1.id, {
      ipAddress: '198.51.100.1',
      userAgent: 'Test/1.0',
    });

    await signService.submitFieldValue(session1.token, sigField1.id, {
      type: 'drawn',
      svgData: '<svg>...</svg>',
      imageBase64: testSignatureBase64,
      width: 200,
      height: 50,
    });

    const result1 = await signService.completeSigning(session1.token);
    expect(result1.envelopeCompleted).toBe(false);
    expect(result1.nextSigner?.id).toBe(signer2.id);

    // Verify signer2 is now notified (sequential)
    const updatedSigner2 = await signService.getSigner(signer2.id);
    expect(updatedSigner2.status).toBe('notified');

    // Step 3: Second signer signs
    const session2 = await signService.createSigningSession(signer2.id, {
      ipAddress: '203.0.113.42',
      userAgent: 'Test/1.0',
    });

    await signService.submitFieldValue(session2.token, sigField2.id, {
      type: 'typed',
      text: 'Second Signer',
      fontFamily: 'Dancing Script',
      imageBase64: typedSignatureBase64,
    });

    const result2 = await signService.completeSigning(session2.token);
    expect(result2.envelopeCompleted).toBe(true);

    // Step 4: Verify final state
    const finalEnvelope = await signService.getEnvelope(envelope.id, {
      includeSigners: true,
      includeAuditTrail: true,
    });

    expect(finalEnvelope!.status).toBe('sealed');
    expect(finalEnvelope!.completedAt).toBeDefined();
    expect(finalEnvelope!.signers).toHaveLength(2);
    expect(finalEnvelope!.signers![0].status).toBe('completed');
    expect(finalEnvelope!.signers![1].status).toBe('completed');

    // Step 5: Verify audit trail
    const verification = await signService.verifyAuditTrail(envelope.id);
    expect(verification.valid).toBe(true);
    expect(verification.totalEvents).toBeGreaterThanOrEqual(10);

    // Step 6: Download completed bundle
    const bundle = await signService.downloadCompletedBundle(envelope.id);
    expect(bundle.data).toBeInstanceOf(Buffer);
    expect(bundle.mimeType).toBe('application/pdf');

    // Step 7: Download certificate
    const cert = await signService.downloadCertificate(envelope.id);
    expect(cert.data).toBeInstanceOf(Buffer);
    expect(cert.filename).toContain('certificate');
  });
});
```

### Test Coverage Requirements

| Area | Minimum Coverage | Notes |
|---|---|---|
| Envelope lifecycle | 95% | All state transitions must be tested. |
| Field validation | 90% | All field types and validation rules. |
| Signer authentication | 95% | All auth methods including failure paths. |
| Audit trail | 100% | Hash chain integrity is critical. |
| PDF processing | 85% | Upload validation, rendering, flattening. |
| PKI signing | 90% | Certificate validation, signature creation/verification. |
| Template workflows | 85% | Creation, variable substitution, role mapping. |
| Bulk send | 80% | CSV parsing, batch processing, error handling. |
| Webhook delivery | 85% | Signature verification, retry logic, error handling. |
| Security controls | 95% | RLS enforcement, session management, rate limiting. |

---

*Last updated: 2025-02-09*
*Module version: 0.9.0*
*Maintainer: MCV Platform Team*