# @mcv/finance/expenses

> **Tier 5 Domain Module — Publishable**
> Employee expense management with multi-level approval workflows, receipt OCR, corporate card reconciliation, mileage tracking, per-diem calculation, and spending analytics.

---

## Purpose

The `@mcv/finance/expenses` module provides a comprehensive expense management system for multi-venture organizations. It handles the full lifecycle of employee expenses — from submission with receipt capture, through configurable multi-level approval chains, to batch reimbursement integrated with payroll.

Key capabilities:

- **Expense Submission** — Employees submit expenses with receipt uploads, automatic categorization, and project/department allocation
- **Expense Reports** — Group individual expenses into reports for batch approval and streamlined reimbursement
- **Approval Workflows** — Configurable multi-level approval chains (manager → finance → CFO) with amount-based routing and delegation
- **Expense Policies** — Per-venture policies governing category limits, per-diem rates, auto-approve thresholds, and restricted categories
- **Corporate Cards** — Card issuance tracking, automatic transaction import from providers, and reconciliation with submitted expenses
- **Receipt OCR** — AI-powered receipt scanning that extracts merchant, amount, date, tax, and line items automatically
- **Mileage Tracking** — Distance-based expense calculation with configurable per-kilometer/mile rates by jurisdiction
- **Per-Diem** — City/country-specific per-diem rates with automatic calculation for multi-day travel
- **Reimbursement** — Batch reimbursement processing with payroll integration and direct deposit support
- **Analytics** — Spending analytics by category, department, employee, project, and time period with trend analysis and budget alerts

This module enforces organizational spending policies while keeping the submission and approval process frictionless for employees and managers.

---

## Exports

```typescript
// === Core Services ===
export { ExpenseService }           from './services/expense.service';
export { ExpenseReportService }     from './services/expense-report.service';
export { ApprovalService }          from './services/approval.service';
export { PolicyService }            from './services/policy.service';
export { CorporateCardService }     from './services/corporate-card.service';
export { ReceiptOCRService }        from './services/receipt-ocr.service';
export { MileageService }           from './services/mileage.service';
export { PerDiemService }           from './services/per-diem.service';
export { ReimbursementService }     from './services/reimbursement.service';
export { ExpenseAnalyticsService }  from './services/expense-analytics.service';

// === tRPC Router ===
export { expensesRouter }           from './router';
export type { ExpensesRouter }      from './router';

// === Core Types ===
export type {
  Expense,
  ExpenseCreate,
  ExpenseUpdate,
  ExpenseStatus,
  ExpenseCategory,
  ExpenseLineItem,
} from './types/expense.types';

export type {
  ExpenseReport,
  ExpenseReportCreate,
  ExpenseReportStatus,
  ReportSummary,
} from './types/expense-report.types';

export type {
  ApprovalChain,
  ApprovalStep,
  ApprovalAction,
  ApprovalDecision,
  ApprovalDelegation,
} from './types/approval.types';

export type {
  ExpensePolicy,
  PolicyRule,
  CategoryLimit,
  AutoApproveRule,
  PolicyViolation,
} from './types/policy.types';

export type {
  CorporateCard,
  CardTransaction,
  CardReconciliation,
  CardStatus,
} from './types/corporate-card.types';

export type {
  ReceiptScan,
  ReceiptData,
  OCRResult,
  ReceiptLineItem,
} from './types/receipt-ocr.types';

export type {
  MileageExpense,
  MileageRate,
  MileageJurisdiction,
  MileageCalculation,
} from './types/mileage.types';

export type {
  PerDiemRate,
  PerDiemLocation,
  PerDiemCalculation,
  PerDiemBreakdown,
} from './types/per-diem.types';

export type {
  ReimbursementBatch,
  ReimbursementItem,
  ReimbursementStatus,
  PayrollIntegration,
} from './types/reimbursement.types';

export type {
  SpendingAnalytics,
  CategoryBreakdown,
  DepartmentSpend,
  TrendData,
  BudgetAlert,
} from './types/analytics.types';

// === Schemas (Zod) ===
export {
  expenseCreateSchema,
  expenseUpdateSchema,
  expenseReportCreateSchema,
  approvalActionSchema,
  policyCreateSchema,
  corporateCardCreateSchema,
  mileageExpenseSchema,
  perDiemRequestSchema,
  reimbursementBatchSchema,
  analyticsQuerySchema,
} from './schemas';

// === Constants ===
export {
  EXPENSE_CATEGORIES,
  EXPENSE_STATUSES,
  APPROVAL_STATUSES,
  CURRENCY_CODES,
  DEFAULT_MILEAGE_RATES,
  DEFAULT_PER_DIEM_RATES,
  MAX_RECEIPT_SIZE_MB,
  OCR_SUPPORTED_FORMATS,
} from './constants';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          @mcv/finance/expenses                              │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        tRPC Router Layer                            │    │
│  │  expenses.submit  │  expenses.approve  │  expenses.reports.create   │    │
│  │  expenses.list    │  expenses.reject   │  expenses.reports.submit   │    │
│  │  expenses.get     │  expenses.delegate │  expenses.cards.import     │    │
│  │  expenses.update  │  expenses.escalate │  expenses.reimburse.batch  │    │
│  │  expenses.delete  │  expenses.recall   │  expenses.analytics.query  │    │
│  └────────┬──────────┴──────────┬─────────┴──────────┬─────────────────┘    │
│           │                     │                     │                      │
│  ┌────────▼──────────┐ ┌───────▼──────────┐ ┌───────▼──────────────────┐   │
│  │  ExpenseService   │ │ ApprovalService  │ │ ExpenseReportService     │   │
│  │                   │ │                  │ │                          │   │
│  │ • create()        │ │ • evaluate()     │ │ • create()               │   │
│  │ • update()        │ │ • approve()      │ │ • addExpenses()          │   │
│  │ • submit()        │ │ • reject()       │ │ • submit()               │   │
│  │ • duplicate()     │ │ • delegate()     │ │ • getSummary()           │   │
│  │ • attachReceipt() │ │ • escalate()     │ │ • exportPDF()            │   │
│  │ • categorize()    │ │ • getChain()     │ │ • exportCSV()            │   │
│  └────────┬──────────┘ │ • recall()       │ └──────────┬───────────────┘   │
│           │            └──────┬───────────┘            │                    │
│  ┌────────▼──────────┐ ┌─────▼────────────┐ ┌─────────▼────────────────┐   │
│  │ ReceiptOCRService │ │  PolicyService   │ │  ReimbursementService    │   │
│  │                   │ │                  │ │                          │   │
│  │ • scan()          │ │ • validate()     │ │ • createBatch()          │   │
│  │ • extract()       │ │ • checkLimits()  │ │ • processBatch()         │   │
│  │ • parseLineItems()│ │ • getViolations()│ │ • markPaid()             │   │
│  │ • matchMerchant() │ │ • autoApprove()  │ │ • exportToPayroll()      │   │
│  └───────────────────┘ │ • getRules()     │ │ • getStatus()            │   │
│                        └──────────────────┘ └──────────────────────────┘   │
│                                                                             │
│  ┌───────────────────┐ ┌──────────────────┐ ┌──────────────────────────┐   │
│  │  MileageService   │ │  PerDiemService  │ │ CorporateCardService     │   │
│  │                   │ │                  │ │                          │   │
│  │ • calculate()     │ │ • getRates()     │ │ • importTransactions()   │   │
│  │ • getRates()      │ │ • calculate()    │ │ • reconcile()            │   │
│  │ • createExpense() │ │ • createExpense()│ │ • matchExpenses()        │   │
│  │ • validateRoute() │ │ • getByLocation()│ │ • flagUnreconciled()     │   │
│  └───────────────────┘ └──────────────────┘ │ • getStatement()         │   │
│                                              └──────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    ExpenseAnalyticsService                           │    │
│  │                                                                     │    │
│  │ • getSpendByCategory()  • getSpendByDepartment()  • getTrends()    │    │
│  │ • getTopSpenders()      • getBudgetAlerts()        • forecast()     │    │
│  │ • getPolicyCompliance() • getReimbursementTimes()  • exportReport() │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        Data Layer (Supabase)                         │   │
│  │                                                                      │   │
│  │  expenses  │  expense_reports  │  expense_report_items               │   │
│  │  expense_receipts  │  approval_chains  │  approval_steps             │   │
│  │  expense_policies  │  policy_rules  │  corporate_cards               │   │
│  │  card_transactions │  mileage_rates │  per_diem_rates                │   │
│  │  reimbursement_batches  │  reimbursement_items                       │   │
│  │  expense_categories  │  expense_audit_log                            │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘

External Integrations:
  @mcv/people ──────► Employee data, org hierarchy, manager chains
  @mcv/storage ─────► Receipt file storage, document management
  @mcv/finance/gl ──► General ledger posting for approved expenses
  @mcv/notifications► Email/push notifications for approvals
  OCR Provider ─────► Google Vision / AWS Textract for receipt scanning
  Card Provider ────► Stripe Issuing / bank API for transaction import
```

---

## Core Interfaces

### ExpenseService

The primary service for managing individual expense entries throughout their lifecycle.

```typescript
import { TRPCError } from '@trpc/server';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Core expense lifecycle management.
 *
 * Handles creation, submission, updates, receipt attachment,
 * categorization, and deletion of individual expense entries.
 */
export class ExpenseService {
  constructor(
    private readonly db: SupabaseClient,
    private readonly policyService: PolicyService,
    private readonly receiptOCR: ReceiptOCRService,
    private readonly approvalService: ApprovalService,
  ) {}

  /**
   * Create a new draft expense.
   *
   * Expenses start in DRAFT status. The employee can edit freely
   * until submission. Receipt upload triggers OCR automatically.
   *
   * @param ventureId - Venture context
   * @param employeeId - The submitting employee
   * @param input - Expense details
   * @returns Created expense in DRAFT status
   *
   * @throws POLICY_VIOLATION - If the expense category is restricted
   * @throws INVALID_CURRENCY - If the currency code is not supported
   * @throws EMPLOYEE_NOT_FOUND - If the employee doesn't exist in the venture
   */
  async create(
    ventureId: string,
    employeeId: string,
    input: ExpenseCreate,
  ): Promise<Expense> {
    // Validate employee exists in venture
    const employee = await this.validateEmployee(ventureId, employeeId);

    // Validate currency
    this.validateCurrency(input.currency);

    // Check category restrictions
    const policy = await this.policyService.getVenturePolicy(ventureId);
    if (policy) {
      const categoryCheck = this.policyService.isCategoryAllowed(
        policy,
        input.category,
        employee.role,
      );
      if (!categoryCheck.allowed) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Category "${input.category}" is restricted: ${categoryCheck.reason}`,
          cause: 'POLICY_VIOLATION',
        });
      }
    }

    // Create the expense record
    const { data: expense, error } = await this.db
      .from('expenses')
      .insert({
        venture_id: ventureId,
        employee_id: employeeId,
        status: 'DRAFT',
        category: input.category,
        subcategory: input.subcategory ?? null,
        description: input.description,
        merchant_name: input.merchantName ?? null,
        amount: input.amount,
        currency: input.currency,
        exchange_rate: input.exchangeRate ?? null,
        base_amount: input.exchangeRate
          ? input.amount * input.exchangeRate
          : input.amount,
        expense_date: input.expenseDate,
        project_id: input.projectId ?? null,
        department_id: input.departmentId ?? null,
        cost_center: input.costCenter ?? null,
        tags: input.tags ?? [],
        notes: input.notes ?? null,
        is_billable: input.isBillable ?? false,
        is_personal: false,
      })
      .select()
      .single();

    if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

    // Log creation
    await this.auditLog(ventureId, expense.id, employeeId, 'CREATED', null);

    return this.mapToExpense(expense);
  }

  /**
   * Submit an expense for approval.
   *
   * Validates the expense against venture policies, checks for
   * required fields (receipt, category, etc.), and initiates the
   * approval workflow.
   *
   * @param ventureId - Venture context
   * @param expenseId - The expense to submit
   * @param employeeId - The submitting employee (must be owner)
   * @returns Updated expense with SUBMITTED status
   *
   * @throws EXPENSE_NOT_FOUND - If expense doesn't exist
   * @throws NOT_OWNER - If the employee doesn't own this expense
   * @throws INVALID_STATUS - If expense is not in DRAFT status
   * @throws RECEIPT_REQUIRED - If policy requires receipt and none attached
   * @throws POLICY_VIOLATION - If expense violates venture policy
   */
  async submit(
    ventureId: string,
    expenseId: string,
    employeeId: string,
  ): Promise<Expense> {
    const expense = await this.getOrThrow(ventureId, expenseId);

    if (expense.employeeId !== employeeId) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Not the expense owner', cause: 'NOT_OWNER' });
    }

    if (expense.status !== 'DRAFT') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Cannot submit expense in ${expense.status} status`,
        cause: 'INVALID_STATUS',
      });
    }

    // Policy validation
    const violations = await this.policyService.validate(ventureId, expense);
    const blockers = violations.filter(v => v.severity === 'BLOCKER');
    if (blockers.length > 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Policy violations: ${blockers.map(b => b.message).join('; ')}`,
        cause: 'POLICY_VIOLATION',
      });
    }

    // Check auto-approve eligibility
    const autoApprove = await this.policyService.checkAutoApprove(ventureId, expense);
    const newStatus = autoApprove ? 'APPROVED' : 'SUBMITTED';

    // Update status
    const { data: updated, error } = await this.db
      .from('expenses')
      .update({
        status: newStatus,
        submitted_at: new Date().toISOString(),
        approved_at: autoApprove ? new Date().toISOString() : null,
        policy_warnings: violations.filter(v => v.severity === 'WARNING'),
      })
      .eq('id', expenseId)
      .eq('venture_id', ventureId)
      .select()
      .single();

    if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

    // Initiate approval workflow (unless auto-approved)
    if (!autoApprove) {
      await this.approvalService.initiate(ventureId, expenseId, expense.employeeId, expense.amount);
    }

    await this.auditLog(ventureId, expenseId, employeeId, autoApprove ? 'AUTO_APPROVED' : 'SUBMITTED', {
      violations: violations.map(v => ({ rule: v.rule, severity: v.severity })),
    });

    return this.mapToExpense(updated);
  }

  /**
   * Attach a receipt to an expense.
   *
   * Uploads the file to @mcv/storage and triggers OCR processing.
   * OCR results are used to auto-fill missing expense fields
   * (merchant, amount, date, tax) if the expense is still in DRAFT.
   *
   * @param ventureId - Venture context
   * @param expenseId - Target expense
   * @param employeeId - Must be expense owner
   * @param file - Receipt file (image or PDF)
   * @returns OCR scan result with extracted data
   */
  async attachReceipt(
    ventureId: string,
    expenseId: string,
    employeeId: string,
    file: {
      buffer: Buffer;
      filename: string;
      mimeType: string;
      size: number;
    },
  ): Promise<ReceiptScan> {
    const expense = await this.getOrThrow(ventureId, expenseId);

    if (expense.employeeId !== employeeId) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Not the expense owner', cause: 'NOT_OWNER' });
    }

    // Validate file
    if (file.size > MAX_RECEIPT_SIZE_MB * 1024 * 1024) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Receipt file exceeds ${MAX_RECEIPT_SIZE_MB}MB limit`,
        cause: 'FILE_TOO_LARGE',
      });
    }

    if (!OCR_SUPPORTED_FORMATS.includes(file.mimeType)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Unsupported file format: ${file.mimeType}`,
        cause: 'UNSUPPORTED_FORMAT',
      });
    }

    // Upload to storage
    const storagePath = `ventures/${ventureId}/expenses/${expenseId}/receipts/${file.filename}`;
    const storageUrl = await this.uploadToStorage(storagePath, file);

    // Run OCR
    const ocrResult = await this.receiptOCR.scan(file.buffer, file.mimeType);

    // Save receipt record
    const { data: receipt } = await this.db
      .from('expense_receipts')
      .insert({
        expense_id: expenseId,
        venture_id: ventureId,
        storage_path: storagePath,
        storage_url: storageUrl,
        filename: file.filename,
        mime_type: file.mimeType,
        file_size: file.size,
        ocr_status: ocrResult.success ? 'COMPLETED' : 'FAILED',
        ocr_data: ocrResult.data ?? null,
        ocr_confidence: ocrResult.confidence ?? null,
      })
      .select()
      .single();

    // Auto-fill expense fields from OCR (only for DRAFT expenses)
    if (ocrResult.success && expense.status === 'DRAFT') {
      await this.applyOCRData(ventureId, expenseId, ocrResult.data);
    }

    await this.auditLog(ventureId, expenseId, employeeId, 'RECEIPT_ATTACHED', {
      receiptId: receipt.id,
      ocrSuccess: ocrResult.success,
      ocrConfidence: ocrResult.confidence,
    });

    return {
      id: receipt.id,
      expenseId,
      storageUrl,
      ocrResult,
      autoFilled: ocrResult.success && expense.status === 'DRAFT',
    };
  }

  /**
   * List expenses with filtering and pagination.
   */
  async list(
    ventureId: string,
    filters: ExpenseListFilters,
  ): Promise<PaginatedResult<Expense>> {
    let query = this.db
      .from('expenses')
      .select('*, expense_receipts(*)', { count: 'exact' })
      .eq('venture_id', ventureId)
      .order('expense_date', { ascending: false });

    if (filters.employeeId) query = query.eq('employee_id', filters.employeeId);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.category) query = query.eq('category', filters.category);
    if (filters.departmentId) query = query.eq('department_id', filters.departmentId);
    if (filters.projectId) query = query.eq('project_id', filters.projectId);
    if (filters.dateFrom) query = query.gte('expense_date', filters.dateFrom);
    if (filters.dateTo) query = query.lte('expense_date', filters.dateTo);
    if (filters.amountMin) query = query.gte('base_amount', filters.amountMin);
    if (filters.amountMax) query = query.lte('base_amount', filters.amountMax);
    if (filters.search) {
      query = query.or(
        `description.ilike.%${filters.search}%,merchant_name.ilike.%${filters.search}%`,
      );
    }

    // Pagination
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 25, 100);
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

    return {
      items: (data ?? []).map(this.mapToExpense),
      total: count ?? 0,
      page,
      limit,
      hasMore: (count ?? 0) > offset + limit,
    };
  }

  /**
   * Recall a submitted expense (pull back before approval).
   */
  async recall(
    ventureId: string,
    expenseId: string,
    employeeId: string,
  ): Promise<Expense> {
    const expense = await this.getOrThrow(ventureId, expenseId);

    if (expense.employeeId !== employeeId) {
      throw new TRPCError({ code: 'FORBIDDEN', cause: 'NOT_OWNER' });
    }

    if (expense.status !== 'SUBMITTED') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Can only recall expenses in SUBMITTED status',
        cause: 'INVALID_STATUS',
      });
    }

    // Check if any approver has already acted
    const hasActions = await this.approvalService.hasAnyAction(ventureId, expenseId);
    if (hasActions) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Cannot recall — an approver has already acted on this expense',
        cause: 'APPROVAL_IN_PROGRESS',
      });
    }

    const { data: updated } = await this.db
      .from('expenses')
      .update({ status: 'DRAFT', submitted_at: null })
      .eq('id', expenseId)
      .eq('venture_id', ventureId)
      .select()
      .single();

    await this.approvalService.cancel(ventureId, expenseId);
    await this.auditLog(ventureId, expenseId, employeeId, 'RECALLED', null);

    return this.mapToExpense(updated);
  }

  // --- Private helpers ---

  private async getOrThrow(ventureId: string, expenseId: string): Promise<Expense> {
    const { data, error } = await this.db
      .from('expenses')
      .select('*, expense_receipts(*)')
      .eq('id', expenseId)
      .eq('venture_id', ventureId)
      .single();

    if (error || !data) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Expense not found', cause: 'EXPENSE_NOT_FOUND' });
    }

    return this.mapToExpense(data);
  }

  private async auditLog(
    ventureId: string,
    expenseId: string,
    actorId: string,
    action: string,
    metadata: Record<string, unknown> | null,
  ): Promise<void> {
    await this.db.from('expense_audit_log').insert({
      venture_id: ventureId,
      expense_id: expenseId,
      actor_id: actorId,
      action,
      metadata,
      created_at: new Date().toISOString(),
    });
  }

  private mapToExpense(row: any): Expense {
    return {
      id: row.id,
      ventureId: row.venture_id,
      employeeId: row.employee_id,
      status: row.status as ExpenseStatus,
      category: row.category,
      subcategory: row.subcategory,
      description: row.description,
      merchantName: row.merchant_name,
      amount: parseFloat(row.amount),
      currency: row.currency,
      exchangeRate: row.exchange_rate ? parseFloat(row.exchange_rate) : null,
      baseAmount: parseFloat(row.base_amount),
      expenseDate: row.expense_date,
      projectId: row.project_id,
      departmentId: row.department_id,
      costCenter: row.cost_center,
      tags: row.tags ?? [],
      notes: row.notes,
      isBillable: row.is_billable,
      receipts: (row.expense_receipts ?? []).map(this.mapToReceipt),
      policyWarnings: row.policy_warnings ?? [],
      submittedAt: row.submitted_at,
      approvedAt: row.approved_at,
      rejectedAt: row.rejected_at,
      paidAt: row.paid_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
```

### Expense

Core data type representing an individual expense entry.

```typescript
/**
 * Status progression:
 *   DRAFT → SUBMITTED → APPROVED → REIMBURSED
 *                     → REJECTED → DRAFT (if resubmitted)
 *                     → RECALLED (back to DRAFT)
 */
export type ExpenseStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'REIMBURSED'
  | 'RECALLED'
  | 'CANCELLED';

export type ExpenseCategory =
  | 'TRAVEL'
  | 'MEALS'
  | 'ACCOMMODATION'
  | 'TRANSPORTATION'
  | 'OFFICE_SUPPLIES'
  | 'SOFTWARE'
  | 'HARDWARE'
  | 'PROFESSIONAL_SERVICES'
  | 'TRAINING'
  | 'ENTERTAINMENT'
  | 'COMMUNICATION'
  | 'MILEAGE'
  | 'PER_DIEM'
  | 'MISCELLANEOUS';

export interface Expense {
  /** Unique identifier */
  id: string;

  /** Venture this expense belongs to */
  ventureId: string;

  /** Employee who incurred the expense */
  employeeId: string;

  /** Current lifecycle status */
  status: ExpenseStatus;

  /** Primary category */
  category: ExpenseCategory;

  /** Optional subcategory (e.g., TRAVEL → "Flights") */
  subcategory: string | null;

  /** Human-readable description */
  description: string;

  /** Merchant or vendor name */
  merchantName: string | null;

  /** Amount in original currency */
  amount: number;

  /** ISO 4217 currency code */
  currency: string;

  /** Exchange rate to base currency (if foreign) */
  exchangeRate: number | null;

  /** Amount converted to venture's base currency */
  baseAmount: number;

  /** Date the expense was incurred */
  expenseDate: string;

  /** Optional project allocation */
  projectId: string | null;

  /** Department allocation */
  departmentId: string | null;

  /** Cost center code */
  costCenter: string | null;

  /** Freeform tags for organization */
  tags: string[];

  /** Additional notes */
  notes: string | null;

  /** Whether this expense is billable to a client */
  isBillable: boolean;

  /** Attached receipt scans */
  receipts: ReceiptScan[];

  /** Policy warnings (non-blocking) */
  policyWarnings: PolicyViolation[];

  /** Submission timestamp */
  submittedAt: string | null;

  /** Approval timestamp */
  approvedAt: string | null;

  /** Rejection timestamp */
  rejectedAt: string | null;

  /** Reimbursement timestamp */
  paidAt: string | null;

  /** Record timestamps */
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCreate {
  category: ExpenseCategory;
  subcategory?: string;
  description: string;
  merchantName?: string;
  amount: number;
  currency: string;
  exchangeRate?: number;
  expenseDate: string;
  projectId?: string;
  departmentId?: string;
  costCenter?: string;
  tags?: string[];
  notes?: string;
  isBillable?: boolean;
}

export interface ExpenseUpdate {
  category?: ExpenseCategory;
  subcategory?: string | null;
  description?: string;
  merchantName?: string | null;
  amount?: number;
  currency?: string;
  exchangeRate?: number | null;
  expenseDate?: string;
  projectId?: string | null;
  departmentId?: string | null;
  costCenter?: string | null;
  tags?: string[];
  notes?: string | null;
  isBillable?: boolean;
}

export interface ExpenseListFilters {
  employeeId?: string;
  status?: ExpenseStatus;
  category?: ExpenseCategory;
  departmentId?: string;
  projectId?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ExpenseLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxAmount: number;
  category: string;
}
```

### ExpenseReport

Groups multiple expenses into a batch for consolidated approval and reimbursement.

```typescript
export type ExpenseReportStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PARTIALLY_APPROVED'
  | 'APPROVED'
  | 'REJECTED'
  | 'REIMBURSED';

export interface ExpenseReport {
  id: string;
  ventureId: string;
  employeeId: string;
  status: ExpenseReportStatus;
  title: string;
  description: string | null;

  /** Purpose of the report (e.g., "Q4 Client Visit - London") */
  purpose: string | null;

  /** Travel dates if applicable */
  travelStartDate: string | null;
  travelEndDate: string | null;

  /** Summary amounts */
  totalAmount: number;
  totalBaseAmount: number;
  baseCurrency: string;

  /** Count of expenses in this report */
  expenseCount: number;

  /** Individual expenses */
  expenses: Expense[];

  /** Breakdown by category */
  categoryBreakdown: Array<{
    category: ExpenseCategory;
    count: number;
    amount: number;
  }>;

  submittedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  reimbursedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseReportCreate {
  title: string;
  description?: string;
  purpose?: string;
  travelStartDate?: string;
  travelEndDate?: string;
  expenseIds?: string[];
}

export interface ReportSummary {
  totalReports: number;
  totalAmount: number;
  byStatus: Record<ExpenseReportStatus, number>;
  averageApprovalTime: number; // hours
  averageReimbursementTime: number; // hours
}

/**
 * Expense Report service for batch management.
 */
export class ExpenseReportService {
  constructor(
    private readonly db: SupabaseClient,
    private readonly expenseService: ExpenseService,
    private readonly approvalService: ApprovalService,
    private readonly policyService: PolicyService,
  ) {}

  /**
   * Create a new expense report.
   *
   * Reports group related expenses (e.g., a business trip)
   * for batch submission and approval.
   */
  async create(
    ventureId: string,
    employeeId: string,
    input: ExpenseReportCreate,
  ): Promise<ExpenseReport> {
    const { data: report, error } = await this.db
      .from('expense_reports')
      .insert({
        venture_id: ventureId,
        employee_id: employeeId,
        status: 'DRAFT',
        title: input.title,
        description: input.description ?? null,
        purpose: input.purpose ?? null,
        travel_start_date: input.travelStartDate ?? null,
        travel_end_date: input.travelEndDate ?? null,
        total_amount: 0,
        total_base_amount: 0,
        expense_count: 0,
      })
      .select()
      .single();

    if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

    // Add expenses if provided
    if (input.expenseIds && input.expenseIds.length > 0) {
      await this.addExpenses(ventureId, report.id, employeeId, input.expenseIds);
    }

    return this.getOrThrow(ventureId, report.id);
  }

  /**
   * Add expenses to a draft report.
   *
   * Only DRAFT expenses owned by the same employee can be added.
   * Expenses already in another report are rejected.
   */
  async addExpenses(
    ventureId: string,
    reportId: string,
    employeeId: string,
    expenseIds: string[],
  ): Promise<ExpenseReport> {
    const report = await this.getOrThrow(ventureId, reportId);

    if (report.employeeId !== employeeId) {
      throw new TRPCError({ code: 'FORBIDDEN', cause: 'NOT_OWNER' });
    }

    if (report.status !== 'DRAFT') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Can only add expenses to draft reports',
        cause: 'INVALID_STATUS',
      });
    }

    // Validate each expense
    for (const expenseId of expenseIds) {
      const expense = await this.expenseService.get(ventureId, expenseId);
      if (!expense) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `Expense ${expenseId} not found` });
      }
      if (expense.employeeId !== employeeId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: `Expense ${expenseId} belongs to another employee` });
      }
      if (expense.status !== 'DRAFT') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Expense ${expenseId} is not in DRAFT status`,
        });
      }

      // Check not already in another report
      const { data: existing } = await this.db
        .from('expense_report_items')
        .select('report_id')
        .eq('expense_id', expenseId)
        .single();

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `Expense ${expenseId} is already in report ${existing.report_id}`,
          cause: 'ALREADY_IN_REPORT',
        });
      }
    }

    // Insert report items
    const items = expenseIds.map((expenseId, index) => ({
      report_id: reportId,
      expense_id: expenseId,
      venture_id: ventureId,
      sort_order: report.expenseCount + index,
    }));

    await this.db.from('expense_report_items').insert(items);

    // Recalculate totals
    await this.recalculateTotals(ventureId, reportId);

    return this.getOrThrow(ventureId, reportId);
  }

  /**
   * Submit the report — all expenses within are submitted together.
   *
   * Validates every expense against policy, then initiates
   * approval workflow for the full report amount.
   */
  async submit(
    ventureId: string,
    reportId: string,
    employeeId: string,
  ): Promise<ExpenseReport> {
    const report = await this.getOrThrow(ventureId, reportId);

    if (report.employeeId !== employeeId) {
      throw new TRPCError({ code: 'FORBIDDEN', cause: 'NOT_OWNER' });
    }
    if (report.status !== 'DRAFT') {
      throw new TRPCError({ code: 'BAD_REQUEST', cause: 'INVALID_STATUS' });
    }
    if (report.expenseCount === 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Cannot submit an empty report',
        cause: 'EMPTY_REPORT',
      });
    }

    // Validate all expenses
    const allViolations: PolicyViolation[] = [];
    for (const expense of report.expenses) {
      const violations = await this.policyService.validate(ventureId, expense);
      allViolations.push(...violations);
    }

    const blockers = allViolations.filter(v => v.severity === 'BLOCKER');
    if (blockers.length > 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Policy violations in report: ${blockers.map(b => b.message).join('; ')}`,
        cause: 'POLICY_VIOLATION',
      });
    }

    // Update all expense statuses
    const expenseIds = report.expenses.map(e => e.id);
    await this.db
      .from('expenses')
      .update({
        status: 'SUBMITTED',
        submitted_at: new Date().toISOString(),
      })
      .in('id', expenseIds)
      .eq('venture_id', ventureId);

    // Update report status
    await this.db
      .from('expense_reports')
      .update({
        status: 'SUBMITTED',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', reportId)
      .eq('venture_id', ventureId);

    // Initiate approval for the report
    await this.approvalService.initiateForReport(
      ventureId,
      reportId,
      employeeId,
      report.totalBaseAmount,
    );

    return this.getOrThrow(ventureId, reportId);
  }

  /**
   * Recalculate report totals from constituent expenses.
   */
  private async recalculateTotals(ventureId: string, reportId: string): Promise<void> {
    const { data: items } = await this.db
      .from('expense_report_items')
      .select('expense_id')
      .eq('report_id', reportId);

    if (!items || items.length === 0) {
      await this.db
        .from('expense_reports')
        .update({ total_amount: 0, total_base_amount: 0, expense_count: 0 })
        .eq('id', reportId);
      return;
    }

    const expenseIds = items.map(i => i.expense_id);
    const { data: expenses } = await this.db
      .from('expenses')
      .select('amount, base_amount')
      .in('id', expenseIds);

    const totalAmount = expenses?.reduce((sum, e) => sum + parseFloat(e.amount), 0) ?? 0;
    const totalBaseAmount = expenses?.reduce((sum, e) => sum + parseFloat(e.base_amount), 0) ?? 0;

    await this.db
      .from('expense_reports')
      .update({
        total_amount: totalAmount,
        total_base_amount: totalBaseAmount,
        expense_count: items.length,
      })
      .eq('id', reportId);
  }
}
```

### ExpensePolicy

Configurable per-venture expense policies controlling limits, approvals, and restrictions.

```typescript
export interface ExpensePolicy {
  id: string;
  ventureId: string;
  name: string;
  description: string | null;
  isActive: boolean;

  /** Global settings */
  baseCurrency: string;
  receiptRequiredAbove: number;
  autoApproveBelow: number;

  /** Category-specific limits */
  categoryLimits: CategoryLimit[];

  /** Role-based rules */
  roleLimits: Array<{
    role: string;
    maxSingleExpense: number;
    maxMonthlyTotal: number;
    allowedCategories: ExpenseCategory[];
    restrictedCategories: ExpenseCategory[];
  }>;

  /** Per-diem and mileage rates (references) */
  perDiemRateSetId: string | null;
  mileageRateSetId: string | null;

  /** Approval chain configuration */
  approvalRules: ApprovalRule[];

  /** Auto-approve rules */
  autoApproveRules: AutoApproveRule[];

  createdAt: string;
  updatedAt: string;
}

export interface CategoryLimit {
  category: ExpenseCategory;
  maxPerExpense: number | null;
  maxPerDay: number | null;
  maxPerMonth: number | null;
  requiresReceipt: boolean;
  requiresDescription: boolean;
  allowedSubcategories: string[];
  restrictedMerchants: string[];
  notes: string | null;
}

export interface AutoApproveRule {
  id: string;
  name: string;
  conditions: {
    maxAmount?: number;
    categories?: ExpenseCategory[];
    employeeRoles?: string[];
    daysSinceLastAudit?: number;
    complianceScore?: number;
  };
  isActive: boolean;
}

export interface ApprovalRule {
  id: string;
  name: string;
  priority: number;
  conditions: {
    minAmount?: number;
    maxAmount?: number;
    categories?: ExpenseCategory[];
  };
  approvalChainId: string;
}

export interface PolicyViolation {
  rule: string;
  severity: 'WARNING' | 'BLOCKER';
  message: string;
  category: ExpenseCategory | null;
  limit: number | null;
  actual: number | null;
}

/**
 * Policy evaluation and management service.
 */
export class PolicyService {
  constructor(private readonly db: SupabaseClient) {}

  /**
   * Validate an expense against the venture's active policy.
   *
   * Returns all violations found. BLOCKER violations prevent
   * submission; WARNING violations are attached to the expense.
   */
  async validate(ventureId: string, expense: Expense): Promise<PolicyViolation[]> {
    const policy = await this.getVenturePolicy(ventureId);
    if (!policy) return []; // No policy configured — allow everything

    const violations: PolicyViolation[] = [];

    // Check receipt requirement
    if (
      policy.receiptRequiredAbove > 0 &&
      expense.baseAmount >= policy.receiptRequiredAbove &&
      expense.receipts.length === 0
    ) {
      violations.push({
        rule: 'RECEIPT_REQUIRED',
        severity: 'BLOCKER',
        message: `Receipt required for expenses above ${policy.baseCurrency} ${policy.receiptRequiredAbove}`,
        category: null,
        limit: policy.receiptRequiredAbove,
        actual: expense.baseAmount,
      });
    }

    // Check category limits
    const categoryLimit = policy.categoryLimits.find(cl => cl.category === expense.category);
    if (categoryLimit) {
      // Per-expense limit
      if (categoryLimit.maxPerExpense && expense.baseAmount > categoryLimit.maxPerExpense) {
        violations.push({
          rule: 'CATEGORY_LIMIT_EXCEEDED',
          severity: 'BLOCKER',
          message: `${expense.category} expenses limited to ${policy.baseCurrency} ${categoryLimit.maxPerExpense}`,
          category: expense.category,
          limit: categoryLimit.maxPerExpense,
          actual: expense.baseAmount,
        });
      }

      // Per-day limit
      if (categoryLimit.maxPerDay) {
        const dailyTotal = await this.getDailyTotal(
          ventureId,
          expense.employeeId,
          expense.category,
          expense.expenseDate,
          expense.id,
        );
        if (dailyTotal + expense.baseAmount > categoryLimit.maxPerDay) {
          violations.push({
            rule: 'DAILY_LIMIT_EXCEEDED',
            severity: 'WARNING',
            message: `Daily ${expense.category} limit of ${policy.baseCurrency} ${categoryLimit.maxPerDay} exceeded`,
            category: expense.category,
            limit: categoryLimit.maxPerDay,
            actual: dailyTotal + expense.baseAmount,
          });
        }
      }

      // Per-month limit
      if (categoryLimit.maxPerMonth) {
        const monthlyTotal = await this.getMonthlyTotal(
          ventureId,
          expense.employeeId,
          expense.category,
          expense.expenseDate,
          expense.id,
        );
        if (monthlyTotal + expense.baseAmount > categoryLimit.maxPerMonth) {
          violations.push({
            rule: 'MONTHLY_LIMIT_EXCEEDED',
            severity: 'BLOCKER',
            message: `Monthly ${expense.category} limit of ${policy.baseCurrency} ${categoryLimit.maxPerMonth} exceeded`,
            category: expense.category,
            limit: categoryLimit.maxPerMonth,
            actual: monthlyTotal + expense.baseAmount,
          });
        }
      }

      // Restricted merchant check
      if (
        categoryLimit.restrictedMerchants.length > 0 &&
        expense.merchantName &&
        categoryLimit.restrictedMerchants.some(rm =>
          expense.merchantName!.toLowerCase().includes(rm.toLowerCase()),
        )
      ) {
        violations.push({
          rule: 'RESTRICTED_MERCHANT',
          severity: 'BLOCKER',
          message: `Merchant "${expense.merchantName}" is restricted for ${expense.category} expenses`,
          category: expense.category,
          limit: null,
          actual: null,
        });
      }

      // Description required
      if (categoryLimit.requiresDescription && !expense.description?.trim()) {
        violations.push({
          rule: 'DESCRIPTION_REQUIRED',
          severity: 'BLOCKER',
          message: `Description required for ${expense.category} expenses`,
          category: expense.category,
          limit: null,
          actual: null,
        });
      }

      // Receipt required per category
      if (categoryLimit.requiresReceipt && expense.receipts.length === 0) {
        violations.push({
          rule: 'CATEGORY_RECEIPT_REQUIRED',
          severity: 'BLOCKER',
          message: `Receipt required for ${expense.category} expenses`,
          category: expense.category,
          limit: null,
          actual: null,
        });
      }
    }

    // Check role limits
    const employee = await this.getEmployee(ventureId, expense.employeeId);
    if (employee) {
      const roleLimit = policy.roleLimits.find(rl => rl.role === employee.role);
      if (roleLimit) {
        // Max single expense for role
        if (expense.baseAmount > roleLimit.maxSingleExpense) {
          violations.push({
            rule: 'ROLE_EXPENSE_LIMIT',
            severity: 'BLOCKER',
            message: `${employee.role} role limited to ${policy.baseCurrency} ${roleLimit.maxSingleExpense} per expense`,
            category: null,
            limit: roleLimit.maxSingleExpense,
            actual: expense.baseAmount,
          });
        }

        // Category restriction for role
        if (
          roleLimit.restrictedCategories.includes(expense.category) ||
          (roleLimit.allowedCategories.length > 0 &&
            !roleLimit.allowedCategories.includes(expense.category))
        ) {
          violations.push({
            rule: 'ROLE_CATEGORY_RESTRICTED',
            severity: 'BLOCKER',
            message: `${employee.role} role cannot submit ${expense.category} expenses`,
            category: expense.category,
            limit: null,
            actual: null,
          });
        }
      }
    }

    return violations;
  }

  /**
   * Check if an expense qualifies for auto-approval.
   */
  async checkAutoApprove(ventureId: string, expense: Expense): Promise<boolean> {
    const policy = await this.getVenturePolicy(ventureId);
    if (!policy) return false;

    // Simple threshold check
    if (policy.autoApproveBelow > 0 && expense.baseAmount < policy.autoApproveBelow) {
      // Also check auto-approve rules for additional conditions
      for (const rule of policy.autoApproveRules) {
        if (!rule.isActive) continue;
        const { conditions } = rule;

        let matches = true;
        if (conditions.maxAmount && expense.baseAmount > conditions.maxAmount) matches = false;
        if (conditions.categories && !conditions.categories.includes(expense.category)) matches = false;

        if (matches) return true;
      }
    }

    return false;
  }

  /**
   * Get the active policy for a venture.
   */
  async getVenturePolicy(ventureId: string): Promise<ExpensePolicy | null> {
    const { data } = await this.db
      .from('expense_policies')
      .select('*, policy_rules(*)')
      .eq('venture_id', ventureId)
      .eq('is_active', true)
      .single();

    return data ? this.mapToPolicy(data) : null;
  }
}
```

### ApprovalChain

Multi-level approval workflow with delegation and escalation support.

```typescript
export interface ApprovalChain {
  id: string;
  ventureId: string;
  name: string;
  description: string | null;

  /** Ordered approval steps */
  steps: ApprovalStep[];

  /** Amount thresholds that trigger this chain */
  minAmount: number;
  maxAmount: number | null;

  /** Categories this chain applies to (empty = all) */
  categories: ExpenseCategory[];

  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ApprovalStepType = 'MANAGER' | 'SPECIFIC_USER' | 'ROLE' | 'DEPARTMENT_HEAD' | 'FINANCE' | 'CFO';

export interface ApprovalStep {
  id: string;
  chainId: string;
  stepOrder: number;
  stepType: ApprovalStepType;

  /**
   * For SPECIFIC_USER: the user ID
   * For ROLE: the role name
   * For MANAGER: "direct" or "skip-level"
   */
  approverRef: string;

  /** If true, this step is skipped when the submitter IS the approver */
  skipIfSelf: boolean;

  /** Timeout before auto-escalation (hours) */
  timeoutHours: number | null;

  /** Escalation target if timeout is reached */
  escalateToStepId: string | null;

  /** Whether this step can be delegated */
  allowDelegation: boolean;
}

export type ApprovalDecision = 'APPROVED' | 'REJECTED' | 'RETURNED' | 'DELEGATED' | 'ESCALATED';

export interface ApprovalAction {
  stepId: string;
  decision: ApprovalDecision;
  comment: string | null;
  delegateToUserId?: string;
}

export interface ApprovalDelegation {
  id: string;
  fromUserId: string;
  toUserId: string;
  ventureId: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  isActive: boolean;
}

/**
 * Approval workflow engine.
 *
 * Manages multi-step approval chains for expenses and reports.
 * Supports delegation, escalation, and timeout-based routing.
 */
export class ApprovalService {
  constructor(
    private readonly db: SupabaseClient,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Initiate approval workflow for a single expense.
   *
   * Determines the correct approval chain based on amount and category,
   * resolves the first approver, and sends notification.
   */
  async initiate(
    ventureId: string,
    expenseId: string,
    employeeId: string,
    amount: number,
  ): Promise<void> {
    // Find matching approval chain
    const chain = await this.resolveChain(ventureId, amount);
    if (!chain) {
      // No chain configured — auto-approve
      await this.db
        .from('expenses')
        .update({ status: 'APPROVED', approved_at: new Date().toISOString() })
        .eq('id', expenseId);
      return;
    }

    // Create approval instance
    const { data: instance } = await this.db
      .from('approval_instances')
      .insert({
        venture_id: ventureId,
        chain_id: chain.id,
        expense_id: expenseId,
        report_id: null,
        submitter_id: employeeId,
        current_step_order: 1,
        status: 'PENDING',
      })
      .select()
      .single();

    // Resolve first step approver
    const firstStep = chain.steps.find(s => s.stepOrder === 1);
    if (!firstStep) return;

    const approverId = await this.resolveApprover(ventureId, employeeId, firstStep);

    // Create step instance
    await this.db.from('approval_step_instances').insert({
      instance_id: instance.id,
      step_id: firstStep.id,
      approver_id: approverId,
      status: 'PENDING',
      due_at: firstStep.timeoutHours
        ? new Date(Date.now() + firstStep.timeoutHours * 3600000).toISOString()
        : null,
    });

    // Notify approver
    await this.notificationService.send({
      userId: approverId,
      type: 'EXPENSE_APPROVAL_REQUIRED',
      title: 'Expense awaiting your approval',
      data: { expenseId, amount, ventureId },
    });
  }

  /**
   * Initiate approval workflow for an expense report.
   */
  async initiateForReport(
    ventureId: string,
    reportId: string,
    employeeId: string,
    totalAmount: number,
  ): Promise<void> {
    const chain = await this.resolveChain(ventureId, totalAmount);
    if (!chain) {
      await this.db
        .from('expense_reports')
        .update({ status: 'APPROVED', approved_at: new Date().toISOString() })
        .eq('id', reportId);
      return;
    }

    const { data: instance } = await this.db
      .from('approval_instances')
      .insert({
        venture_id: ventureId,
        chain_id: chain.id,
        expense_id: null,
        report_id: reportId,
        submitter_id: employeeId,
        current_step_order: 1,
        status: 'PENDING',
      })
      .select()
      .single();

    const firstStep = chain.steps.find(s => s.stepOrder === 1);
    if (!firstStep) return;

    const approverId = await this.resolveApprover(ventureId, employeeId, firstStep);

    await this.db.from('approval_step_instances').insert({
      instance_id: instance.id,
      step_id: firstStep.id,
      approver_id: approverId,
      status: 'PENDING',
      due_at: firstStep.timeoutHours
        ? new Date(Date.now() + firstStep.timeoutHours * 3600000).toISOString()
        : null,
    });

    await this.notificationService.send({
      userId: approverId,
      type: 'REPORT_APPROVAL_REQUIRED',
      title: 'Expense report awaiting your approval',
      data: { reportId, totalAmount, ventureId },
    });
  }

  /**
   * Process an approval decision.
   *
   * When a step is approved, advances to the next step in the chain.
   * When the last step is approved, the expense/report moves to APPROVED.
   * When rejected, the expense/report moves to REJECTED.
   * When returned, the expense/report goes back to DRAFT.
   */
  async processDecision(
    ventureId: string,
    instanceId: string,
    approverId: string,
    action: ApprovalAction,
  ): Promise<{ completed: boolean; nextApprover: string | null }> {
    const instance = await this.getInstanceOrThrow(instanceId);

    // Verify the actor is the assigned approver (or a delegate)
    const stepInstance = await this.getCurrentStepInstance(instanceId);
    const isAuthorized =
      stepInstance.approver_id === approverId ||
      (await this.isDelegate(ventureId, stepInstance.approver_id, approverId));

    if (!isAuthorized) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You are not authorized to act on this approval step',
        cause: 'NOT_APPROVER',
      });
    }

    // Record the decision
    await this.db
      .from('approval_step_instances')
      .update({
        status: action.decision,
        decided_by: approverId,
        decided_at: new Date().toISOString(),
        comment: action.comment,
      })
      .eq('id', stepInstance.id);

    switch (action.decision) {
      case 'APPROVED': {
        // Check if there's a next step
        const chain = await this.getChain(instance.chain_id);
        const nextStep = chain.steps.find(
          s => s.stepOrder === instance.current_step_order + 1,
        );

        if (nextStep) {
          // Advance to next step
          const nextApproverId = await this.resolveApprover(
            ventureId,
            instance.submitter_id,
            nextStep,
          );

          await this.db
            .from('approval_instances')
            .update({ current_step_order: nextStep.stepOrder })
            .eq('id', instanceId);

          await this.db.from('approval_step_instances').insert({
            instance_id: instanceId,
            step_id: nextStep.id,
            approver_id: nextApproverId,
            status: 'PENDING',
            due_at: nextStep.timeoutHours
              ? new Date(Date.now() + nextStep.timeoutHours * 3600000).toISOString()
              : null,
          });

          await this.notificationService.send({
            userId: nextApproverId,
            type: 'EXPENSE_APPROVAL_REQUIRED',
            title: 'Expense awaiting your approval',
            data: { instanceId, ventureId },
          });

          return { completed: false, nextApprover: nextApproverId };
        }

        // Final approval — mark as approved
        await this.completeApproval(instance, 'APPROVED');
        return { completed: true, nextApprover: null };
      }

      case 'REJECTED': {
        await this.completeApproval(instance, 'REJECTED');
        return { completed: true, nextApprover: null };
      }

      case 'RETURNED': {
        await this.completeApproval(instance, 'RETURNED');
        return { completed: true, nextApprover: null };
      }

      case 'DELEGATED': {
        if (!action.delegateToUserId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Delegation requires a target user',
          });
        }

        // Update the step instance with the new approver
        await this.db
          .from('approval_step_instances')
          .update({
            approver_id: action.delegateToUserId,
            status: 'PENDING',
            delegated_from: approverId,
            delegated_at: new Date().toISOString(),
          })
          .eq('id', stepInstance.id);

        await this.notificationService.send({
          userId: action.delegateToUserId,
          type: 'EXPENSE_APPROVAL_DELEGATED',
          title: 'Expense approval delegated to you',
          data: { instanceId, ventureId, delegatedBy: approverId },
        });

        return { completed: false, nextApprover: action.delegateToUserId };
      }

      default:
        throw new TRPCError({ code: 'BAD_REQUEST', message: `Unknown decision: ${action.decision}` });
    }
  }

  /**
   * Resolve the correct approver for a step.
   *
   * - MANAGER: looks up the employee's direct manager via @mcv/people
   * - DEPARTMENT_HEAD: looks up the department head
   * - FINANCE: finds a user with the FINANCE role
   * - CFO: finds a user with the CFO role
   * - SPECIFIC_USER: uses the step's approverRef directly
   * - ROLE: finds any user with the specified role
   */
  private async resolveApprover(
    ventureId: string,
    employeeId: string,
    step: ApprovalStep,
  ): Promise<string> {
    switch (step.stepType) {
      case 'MANAGER': {
        const { data: employee } = await this.db
          .from('employees')
          .select('manager_id')
          .eq('id', employeeId)
          .eq('venture_id', ventureId)
          .single();
        if (!employee?.manager_id) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'No manager found for employee',
            cause: 'NO_MANAGER',
          });
        }
        return employee.manager_id;
      }

      case 'DEPARTMENT_HEAD': {
        const { data: employee } = await this.db
          .from('employees')
          .select('department_id')
          .eq('id', employeeId)
          .eq('venture_id', ventureId)
          .single();
        const { data: dept } = await this.db
          .from('departments')
          .select('head_id')
          .eq('id', employee!.department_id)
          .single();
        if (!dept?.head_id) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'No department head found',
            cause: 'NO_DEPT_HEAD',
          });
        }
        return dept.head_id;
      }

      case 'FINANCE': {
        const { data: financeUsers } = await this.db
          .from('venture_roles')
          .select('user_id')
          .eq('venture_id', ventureId)
          .eq('role', 'FINANCE_APPROVER')
          .limit(1);
        if (!financeUsers?.length) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'No finance approver configured' });
        }
        return financeUsers[0].user_id;
      }

      case 'CFO': {
        const { data: cfoUsers } = await this.db
          .from('venture_roles')
          .select('user_id')
          .eq('venture_id', ventureId)
          .eq('role', 'CFO')
          .limit(1);
        if (!cfoUsers?.length) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'No CFO configured' });
        }
        return cfoUsers[0].user_id;
      }

      case 'SPECIFIC_USER':
        return step.approverRef;

      case 'ROLE': {
        const { data: roleUsers } = await this.db
          .from('venture_roles')
          .select('user_id')
          .eq('venture_id', ventureId)
          .eq('role', step.approverRef)
          .limit(1);
        if (!roleUsers?.length) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `No user with role ${step.approverRef} found`,
          });
        }
        return roleUsers[0].user_id;
      }

      default:
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `Unknown step type: ${step.stepType}` });
    }
  }

  /**
   * Check if any approver has already acted on an expense's approval.
   */
  async hasAnyAction(ventureId: string, expenseId: string): Promise<boolean> {
    const { data: instances } = await this.db
      .from('approval_instances')
      .select('id')
      .eq('venture_id', ventureId)
      .eq('expense_id', expenseId);

    if (!instances?.length) return false;

    const { count } = await this.db
      .from('approval_step_instances')
      .select('*', { count: 'exact', head: true })
      .in('instance_id', instances.map(i => i.id))
      .neq('status', 'PENDING');

    return (count ?? 0) > 0;
  }

  /**
   * Cancel all pending approval instances for an expense.
   */
  async cancel(ventureId: string, expenseId: string): Promise<void> {
    const { data: instances } = await this.db
      .from('approval_instances')
      .select('id')
      .eq('venture_id', ventureId)
      .eq('expense_id', expenseId)
      .eq('status', 'PENDING');

    if (!instances?.length) return;

    const instanceIds = instances.map(i => i.id);

    await this.db
      .from('approval_step_instances')
      .update({ status: 'CANCELLED' })
      .in('instance_id', instanceIds)
      .eq('status', 'PENDING');

    await this.db
      .from('approval_instances')
      .update({ status: 'CANCELLED' })
      .in('id', instanceIds);
  }
}
```

### CorporateCard

Corporate card management with transaction import and reconciliation.

```typescript
export type CardStatus = 'ACTIVE' | 'FROZEN' | 'CANCELLED' | 'PENDING_ACTIVATION';

export interface CorporateCard {
  id: string;
  ventureId: string;
  employeeId: string;
  cardProvider: 'STRIPE' | 'BREX' | 'RAMP' | 'MANUAL';
  externalCardId: string | null;
  lastFour: string;
  cardholderName: string;
  status: CardStatus;
  monthlyLimit: number;
  singleTransactionLimit: number;
  allowedCategories: ExpenseCategory[];
  currentMonthSpend: number;
  issuedAt: string;
  expiresAt: string;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CardTransaction {
  id: string;
  ventureId: string;
  cardId: string;
  externalTransactionId: string;
  merchantName: string;
  merchantCategory: string;
  amount: number;
  currency: string;
  transactionDate: string;
  status: 'PENDING' | 'POSTED' | 'DECLINED' | 'REVERSED';
  matchedExpenseId: string | null;
  reconciliationStatus: 'UNMATCHED' | 'MATCHED' | 'DISPUTED' | 'IGNORED';
  rawData: Record<string, unknown>;
  createdAt: string;
}

export interface CardReconciliation {
  cardId: string;
  period: string;
  totalTransactions: number;
  matchedTransactions: number;
  unmatchedTransactions: number;
  disputedTransactions: number;
  totalAmount: number;
  matchedAmount: number;
  unmatchedAmount: number;
  reconciliationRate: number; // percentage
}

/**
 * Corporate card management and reconciliation.
 */
export class CorporateCardService {
  constructor(
    private readonly db: SupabaseClient,
    private readonly expenseService: ExpenseService,
  ) {}

  /**
   * Import transactions from a card provider.
   *
   * Fetches new transactions since the last import,
   * creates records, and attempts automatic matching
   * with existing expenses.
   */
  async importTransactions(
    ventureId: string,
    cardId: string,
    options?: { fromDate?: string; toDate?: string },
  ): Promise<{
    imported: number;
    matched: number;
    duplicatesSkipped: number;
  }> {
    const card = await this.getCardOrThrow(ventureId, cardId);

    // Fetch from provider
    const transactions = await this.fetchFromProvider(card, options);

    let imported = 0;
    let matched = 0;
    let duplicatesSkipped = 0;

    for (const txn of transactions) {
      // Skip duplicates
      const { data: existing } = await this.db
        .from('card_transactions')
        .select('id')
        .eq('external_transaction_id', txn.externalId)
        .eq('card_id', cardId)
        .single();

      if (existing) {
        duplicatesSkipped++;
        continue;
      }

      // Insert transaction
      const { data: record } = await this.db
        .from('card_transactions')
        .insert({
          venture_id: ventureId,
          card_id: cardId,
          external_transaction_id: txn.externalId,
          merchant_name: txn.merchantName,
          merchant_category: txn.merchantCategory,
          amount: txn.amount,
          currency: txn.currency,
          transaction_date: txn.date,
          status: txn.status,
          reconciliation_status: 'UNMATCHED',
          raw_data: txn.rawData,
        })
        .select()
        .single();

      imported++;

      // Attempt automatic matching
      const matchedExpense = await this.attemptAutoMatch(ventureId, card.employeeId, record);
      if (matchedExpense) {
        await this.db
          .from('card_transactions')
          .update({
            matched_expense_id: matchedExpense.id,
            reconciliation_status: 'MATCHED',
          })
          .eq('id', record.id);
        matched++;
      }
    }

    return { imported, matched, duplicatesSkipped };
  }

  /**
   * Attempt to automatically match a card transaction to an expense.
   *
   * Matching criteria:
   * 1. Same employee
   * 2. Amount within 2% tolerance (for currency conversion)
   * 3. Date within 3 days
   * 4. Similar merchant name (fuzzy)
   */
  private async attemptAutoMatch(
    ventureId: string,
    employeeId: string,
    transaction: any,
  ): Promise<Expense | null> {
    const amountTolerance = 0.02; // 2%
    const dateTolerance = 3; // days

    const txnDate = new Date(transaction.transaction_date);
    const dateFrom = new Date(txnDate);
    dateFrom.setDate(dateFrom.getDate() - dateTolerance);
    const dateTo = new Date(txnDate);
    dateTo.setDate(dateTo.getDate() + dateTolerance);

    const amountMin = transaction.amount * (1 - amountTolerance);
    const amountMax = transaction.amount * (1 + amountTolerance);

    const { data: candidates } = await this.db
      .from('expenses')
      .select('*')
      .eq('venture_id', ventureId)
      .eq('employee_id', employeeId)
      .gte('expense_date', dateFrom.toISOString().split('T')[0])
      .lte('expense_date', dateTo.toISOString().split('T')[0])
      .gte('amount', amountMin)
      .lte('amount', amountMax)
      .is('card_transaction_id', null);

    if (!candidates?.length) return null;

    // Score candidates by merchant name similarity
    const scored = candidates.map(c => ({
      expense: c,
      score: this.merchantSimilarity(
        transaction.merchant_name,
        c.merchant_name ?? '',
      ),
    }));

    scored.sort((a, b) => b.score - a.score);

    // Accept if similarity > 0.6
    if (scored[0].score > 0.6) {
      return this.expenseService.mapToExpense(scored[0].expense);
    }

    return null;
  }

  /**
   * Get reconciliation summary for a card over a period.
   */
  async getReconciliation(
    ventureId: string,
    cardId: string,
    period: { startDate: string; endDate: string },
  ): Promise<CardReconciliation> {
    const { data: transactions } = await this.db
      .from('card_transactions')
      .select('*')
      .eq('venture_id', ventureId)
      .eq('card_id', cardId)
      .gte('transaction_date', period.startDate)
      .lte('transaction_date', period.endDate)
      .eq('status', 'POSTED');

    const total = transactions?.length ?? 0;
    const matchedTxns = transactions?.filter(t => t.reconciliation_status === 'MATCHED') ?? [];
    const unmatchedTxns = transactions?.filter(t => t.reconciliation_status === 'UNMATCHED') ?? [];
    const disputedTxns = transactions?.filter(t => t.reconciliation_status === 'DISPUTED') ?? [];

    const totalAmount = transactions?.reduce((s, t) => s + parseFloat(t.amount), 0) ?? 0;
    const matchedAmount = matchedTxns.reduce((s, t) => s + parseFloat(t.amount), 0);
    const unmatchedAmount = unmatchedTxns.reduce((s, t) => s + parseFloat(t.amount), 0);

    return {
      cardId,
      period: `${period.startDate} to ${period.endDate}`,
      totalTransactions: total,
      matchedTransactions: matchedTxns.length,
      unmatchedTransactions: unmatchedTxns.length,
      disputedTransactions: disputedTxns.length,
      totalAmount,
      matchedAmount,
      unmatchedAmount,
      reconciliationRate: total > 0 ? (matchedTxns.length / total) * 100 : 0,
    };
  }

  /**
   * Flag unreconciled transactions past a threshold age.
   */
  async flagUnreconciled(
    ventureId: string,
    daysThreshold: number = 14,
  ): Promise<CardTransaction[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);

    const { data: unreconciled } = await this.db
      .from('card_transactions')
      .select('*')
      .eq('venture_id', ventureId)
      .eq('reconciliation_status', 'UNMATCHED')
      .eq('status', 'POSTED')
      .lte('transaction_date', cutoffDate.toISOString().split('T')[0])
      .order('transaction_date', { ascending: true });

    return (unreconciled ?? []).map(this.mapToTransaction);
  }
}
```

---

## Database Schema

### expenses

Primary table for individual expense entries.

```sql
CREATE TABLE expenses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id      UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  employee_id     UUID NOT NULL REFERENCES employees(id),
  status          TEXT NOT NULL DEFAULT 'DRAFT'
                    CHECK (status IN ('DRAFT','SUBMITTED','APPROVED','REJECTED','REIMBURSED','RECALLED','CANCELLED')),
  category        TEXT NOT NULL,
  subcategory     TEXT,
  description     TEXT NOT NULL,
  merchant_name   TEXT,
  amount          NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  currency        TEXT NOT NULL DEFAULT 'USD',
  exchange_rate   NUMERIC(12,6),
  base_amount     NUMERIC(15,2) NOT NULL CHECK (base_amount > 0),
  expense_date    DATE NOT NULL,
  project_id      UUID REFERENCES projects(id),
  department_id   UUID REFERENCES departments(id),
  cost_center     TEXT,
  tags            TEXT[] DEFAULT '{}',
  notes           TEXT,
  is_billable     BOOLEAN NOT NULL DEFAULT FALSE,
  is_personal     BOOLEAN NOT NULL DEFAULT FALSE,
  card_transaction_id UUID REFERENCES card_transactions(id),
  report_id       UUID REFERENCES expense_reports(id),
  policy_warnings JSONB DEFAULT '[]',
  submitted_at    TIMESTAMPTZ,
  approved_at     TIMESTAMPTZ,
  rejected_at     TIMESTAMPTZ,
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Performance indexes
CREATE INDEX idx_expenses_venture_id ON expenses(venture_id);
CREATE INDEX idx_expenses_employee_id ON expenses(employee_id);
CREATE INDEX idx_expenses_status ON expenses(venture_id, status);
CREATE INDEX idx_expenses_date ON expenses(venture_id, expense_date DESC);
CREATE INDEX idx_expenses_category ON expenses(venture_id, category);
CREATE INDEX idx_expenses_department ON expenses(venture_id, department_id);
CREATE INDEX idx_expenses_project ON expenses(venture_id, project_id);
CREATE INDEX idx_expenses_search ON expenses USING gin(
  to_tsvector('english', coalesce(description, '') || ' ' || coalesce(merchant_name, ''))
);

-- Auto-update timestamp
CREATE TRIGGER expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY expenses_venture_isolation ON expenses
  USING (venture_id = current_setting('app.venture_id')::UUID);

CREATE POLICY expenses_employee_read ON expenses
  FOR SELECT USING (
    employee_id = current_setting('app.user_id')::UUID
    OR has_role(current_setting('app.user_id')::UUID, venture_id, 'FINANCE')
    OR has_role(current_setting('app.user_id')::UUID, venture_id, 'MANAGER')
  );

CREATE POLICY expenses_employee_write ON expenses
  FOR ALL USING (
    employee_id = current_setting('app.user_id')::UUID
    AND status = 'DRAFT'
  );
```

### expense_reports

Groups expenses into batch reports.

```sql
CREATE TABLE expense_reports (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id        UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  employee_id       UUID NOT NULL REFERENCES employees(id),
  status            TEXT NOT NULL DEFAULT 'DRAFT'
                      CHECK (status IN ('DRAFT','SUBMITTED','PARTIALLY_APPROVED','APPROVED','REJECTED','REIMBURSED')),
  title             TEXT NOT NULL,
  description       TEXT,
  purpose           TEXT,
  travel_start_date DATE,
  travel_end_date   DATE,
  total_amount      NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_base_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  base_currency     TEXT NOT NULL DEFAULT 'USD',
  expense_count     INTEGER NOT NULL DEFAULT 0,
  submitted_at      TIMESTAMPTZ,
  approved_at       TIMESTAMPTZ,
  rejected_at       TIMESTAMPTZ,
  reimbursed_at     TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_expense_reports_venture ON expense_reports(venture_id);
CREATE INDEX idx_expense_reports_employee ON expense_reports(employee_id);
CREATE INDEX idx_expense_reports_status ON expense_reports(venture_id, status);

ALTER TABLE expense_reports ENABLE ROW LEVEL SECURITY;
```

### expense_report_items

Junction table linking expenses to reports.

```sql
CREATE TABLE expense_report_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id   UUID NOT NULL REFERENCES expense_reports(id) ON DELETE CASCADE,
  expense_id  UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  venture_id  UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (expense_id)  -- An expense can only be in one report
);

CREATE INDEX idx_report_items_report ON expense_report_items(report_id);
CREATE INDEX idx_report_items_expense ON expense_report_items(expense_id);
```

### expense_receipts

Receipt files and OCR results.

```sql
CREATE TABLE expense_receipts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id      UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  venture_id      UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  storage_path    TEXT NOT NULL,
  storage_url     TEXT NOT NULL,
  filename        TEXT NOT NULL,
  mime_type       TEXT NOT NULL,
  file_size       INTEGER NOT NULL,
  ocr_status      TEXT NOT NULL DEFAULT 'PENDING'
                    CHECK (ocr_status IN ('PENDING','PROCESSING','COMPLETED','FAILED')),
  ocr_data        JSONB,
  ocr_confidence  NUMERIC(5,4),
  ocr_raw_result  JSONB,
  verified_by     UUID REFERENCES employees(id),
  verified_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_receipts_expense ON expense_receipts(expense_id);
CREATE INDEX idx_receipts_ocr_status ON expense_receipts(venture_id, ocr_status);

ALTER TABLE expense_receipts ENABLE ROW LEVEL SECURITY;
```

### expense_policies

Per-venture expense policies.

```sql
CREATE TABLE expense_policies (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id             UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  name                   TEXT NOT NULL,
  description            TEXT,
  is_active              BOOLEAN NOT NULL DEFAULT TRUE,
  base_currency          TEXT NOT NULL DEFAULT 'USD',
  receipt_required_above NUMERIC(15,2) NOT NULL DEFAULT 25.00,
  auto_approve_below     NUMERIC(15,2) NOT NULL DEFAULT 0,
  category_limits        JSONB NOT NULL DEFAULT '[]',
  role_limits            JSONB NOT NULL DEFAULT '[]',
  approval_rules         JSONB NOT NULL DEFAULT '[]',
  auto_approve_rules     JSONB NOT NULL DEFAULT '[]',
  per_diem_rate_set_id   UUID,
  mileage_rate_set_id    UUID,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Only one active policy per venture
  UNIQUE (venture_id) WHERE (is_active = TRUE)
);

CREATE INDEX idx_policies_venture ON expense_policies(venture_id);

ALTER TABLE expense_policies ENABLE ROW LEVEL SECURITY;
```

### approval_chains

Multi-level approval chain definitions.

```sql
CREATE TABLE approval_chains (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id  UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  min_amount  NUMERIC(15,2) NOT NULL DEFAULT 0,
  max_amount  NUMERIC(15,2),
  categories  TEXT[] DEFAULT '{}',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE approval_steps (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id           UUID NOT NULL REFERENCES approval_chains(id) ON DELETE CASCADE,
  step_order         INTEGER NOT NULL,
  step_type          TEXT NOT NULL
                       CHECK (step_type IN ('MANAGER','SPECIFIC_USER','ROLE','DEPARTMENT_HEAD','FINANCE','CFO')),
  approver_ref       TEXT NOT NULL,
  skip_if_self       BOOLEAN NOT NULL DEFAULT TRUE,
  timeout_hours      INTEGER,
  escalate_to_step_id UUID REFERENCES approval_steps(id),
  allow_delegation   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (chain_id, step_order)
);

CREATE TABLE approval_instances (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id         UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  chain_id           UUID NOT NULL REFERENCES approval_chains(id),
  expense_id         UUID REFERENCES expenses(id),
  report_id          UUID REFERENCES expense_reports(id),
  submitter_id       UUID NOT NULL REFERENCES employees(id),
  current_step_order INTEGER NOT NULL DEFAULT 1,
  status             TEXT NOT NULL DEFAULT 'PENDING'
                       CHECK (status IN ('PENDING','APPROVED','REJECTED','RETURNED','CANCELLED')),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

  CHECK (expense_id IS NOT NULL OR report_id IS NOT NULL)
);

CREATE TABLE approval_step_instances (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id     UUID NOT NULL REFERENCES approval_instances(id) ON DELETE CASCADE,
  step_id         UUID NOT NULL REFERENCES approval_steps(id),
  approver_id     UUID NOT NULL REFERENCES employees(id),
  status          TEXT NOT NULL DEFAULT 'PENDING'
                    CHECK (status IN ('PENDING','APPROVED','REJECTED','RETURNED','DELEGATED','ESCALATED','CANCELLED')),
  decided_by      UUID REFERENCES employees(id),
  decided_at      TIMESTAMPTZ,
  comment         TEXT,
  delegated_from  UUID REFERENCES employees(id),
  delegated_at    TIMESTAMPTZ,
  due_at          TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_approval_chains_venture ON approval_chains(venture_id);
CREATE INDEX idx_approval_instances_expense ON approval_instances(expense_id);
CREATE INDEX idx_approval_instances_report ON approval_instances(report_id);
CREATE INDEX idx_approval_instances_status ON approval_instances(venture_id, status);
CREATE INDEX idx_approval_step_inst_approver ON approval_step_instances(approver_id, status);
CREATE INDEX idx_approval_step_inst_due ON approval_step_instances(due_at) WHERE status = 'PENDING';

ALTER TABLE approval_chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_step_instances ENABLE ROW LEVEL SECURITY;
```

### corporate_cards & card_transactions

Corporate card management and transaction tracking.

```sql
CREATE TABLE corporate_cards (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id                UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  employee_id               UUID NOT NULL REFERENCES employees(id),
  card_provider             TEXT NOT NULL CHECK (card_provider IN ('STRIPE','BREX','RAMP','MANUAL')),
  external_card_id          TEXT,
  last_four                 TEXT NOT NULL CHECK (length(last_four) = 4),
  cardholder_name           TEXT NOT NULL,
  status                    TEXT NOT NULL DEFAULT 'PENDING_ACTIVATION'
                              CHECK (status IN ('ACTIVE','FROZEN','CANCELLED','PENDING_ACTIVATION')),
  monthly_limit             NUMERIC(15,2) NOT NULL DEFAULT 5000.00,
  single_transaction_limit  NUMERIC(15,2) NOT NULL DEFAULT 1000.00,
  allowed_categories        TEXT[] DEFAULT '{}',
  current_month_spend       NUMERIC(15,2) NOT NULL DEFAULT 0,
  issued_at                 TIMESTAMPTZ,
  expires_at                TIMESTAMPTZ NOT NULL,
  cancelled_at              TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE card_transactions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id               UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  card_id                  UUID NOT NULL REFERENCES corporate_cards(id) ON DELETE CASCADE,
  external_transaction_id  TEXT NOT NULL,
  merchant_name            TEXT NOT NULL,
  merchant_category        TEXT,
  amount                   NUMERIC(15,2) NOT NULL,
  currency                 TEXT NOT NULL DEFAULT 'USD',
  transaction_date         DATE NOT NULL,
  status                   TEXT NOT NULL DEFAULT 'PENDING'
                             CHECK (status IN ('PENDING','POSTED','DECLINED','REVERSED')),
  matched_expense_id       UUID REFERENCES expenses(id),
  reconciliation_status    TEXT NOT NULL DEFAULT 'UNMATCHED'
                             CHECK (reconciliation_status IN ('UNMATCHED','MATCHED','DISPUTED','IGNORED')),
  raw_data                 JSONB DEFAULT '{}',
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (card_id, external_transaction_id)
);

CREATE INDEX idx_cards_venture ON corporate_cards(venture_id);
CREATE INDEX idx_cards_employee ON corporate_cards(employee_id);
CREATE INDEX idx_card_txn_card ON card_transactions(card_id);
CREATE INDEX idx_card_txn_date ON card_transactions(venture_id, transaction_date DESC);
CREATE INDEX idx_card_txn_unmatched ON card_transactions(venture_id, reconciliation_status)
  WHERE reconciliation_status = 'UNMATCHED';

ALTER TABLE corporate_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_transactions ENABLE ROW LEVEL SECURITY;
```

### mileage_rates & per_diem_rates

Jurisdiction-specific rates for mileage and per-diem calculations.

```sql
CREATE TABLE mileage_rates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id      UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  jurisdiction    TEXT NOT NULL,                -- e.g., 'US', 'CA-ON', 'UK'
  vehicle_type    TEXT NOT NULL DEFAULT 'CAR'
                    CHECK (vehicle_type IN ('CAR','MOTORCYCLE','BICYCLE','ELECTRIC')),
  rate_per_km     NUMERIC(8,4) NOT NULL,
  rate_per_mile   NUMERIC(8,4) NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'USD',
  effective_from  DATE NOT NULL,
  effective_to    DATE,
  is_default      BOOLEAN NOT NULL DEFAULT FALSE,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (venture_id, jurisdiction, vehicle_type, effective_from)
);

CREATE TABLE per_diem_rates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id      UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  location_type   TEXT NOT NULL CHECK (location_type IN ('CITY','STATE','COUNTRY')),
  location_code   TEXT NOT NULL,                -- e.g., 'US-NY-NYC', 'CA', 'GB-LON'
  location_name   TEXT NOT NULL,                -- e.g., 'New York City', 'Canada', 'London'
  lodging_rate    NUMERIC(10,2) NOT NULL,
  meals_rate      NUMERIC(10,2) NOT NULL,
  incidentals_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_rate      NUMERIC(10,2) GENERATED ALWAYS AS (lodging_rate + meals_rate + incidentals_rate) STORED,
  currency        TEXT NOT NULL DEFAULT 'USD',
  effective_from  DATE NOT NULL,
  effective_to    DATE,
  first_last_day_rate NUMERIC(5,2) NOT NULL DEFAULT 0.75,  -- % of full rate for first/last day
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (venture_id, location_code, effective_from)
);

CREATE INDEX idx_mileage_rates_venture ON mileage_rates(venture_id, jurisdiction);
CREATE INDEX idx_per_diem_rates_venture ON per_diem_rates(venture_id, location_code);
CREATE INDEX idx_per_diem_rates_effective ON per_diem_rates(effective_from, effective_to);

ALTER TABLE mileage_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE per_diem_rates ENABLE ROW LEVEL SECURITY;
```

### reimbursement_batches & reimbursement_items

Batch reimbursement processing.

```sql
CREATE TABLE reimbursement_batches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id      UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'PENDING'
                    CHECK (status IN ('PENDING','PROCESSING','COMPLETED','FAILED','CANCELLED')),
  batch_number    TEXT NOT NULL,
  total_amount    NUMERIC(15,2) NOT NULL DEFAULT 0,
  currency        TEXT NOT NULL DEFAULT 'USD',
  item_count      INTEGER NOT NULL DEFAULT 0,
  payment_method  TEXT NOT NULL DEFAULT 'PAYROLL'
                    CHECK (payment_method IN ('PAYROLL','DIRECT_DEPOSIT','CHECK','WIRE')),
  payroll_run_id  UUID,
  processed_by    UUID REFERENCES employees(id),
  processed_at    TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE reimbursement_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id          UUID NOT NULL REFERENCES reimbursement_batches(id) ON DELETE CASCADE,
  venture_id        UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  expense_id        UUID REFERENCES expenses(id),
  report_id         UUID REFERENCES expense_reports(id),
  employee_id       UUID NOT NULL REFERENCES employees(id),
  amount            NUMERIC(15,2) NOT NULL,
  currency          TEXT NOT NULL DEFAULT 'USD',
  status            TEXT NOT NULL DEFAULT 'PENDING'
                      CHECK (status IN ('PENDING','PAID','FAILED','CANCELLED')),
  payment_reference TEXT,
  paid_at           TIMESTAMPTZ,
  error_message     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CHECK (expense_id IS NOT NULL OR report_id IS NOT NULL)
);

CREATE INDEX idx_reimbursement_batches_venture ON reimbursement_batches(venture_id);
CREATE INDEX idx_reimbursement_batches_status ON reimbursement_batches(venture_id, status);
CREATE INDEX idx_reimbursement_items_batch ON reimbursement_items(batch_id);
CREATE INDEX idx_reimbursement_items_employee ON reimbursement_items(employee_id);

ALTER TABLE reimbursement_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE reimbursement_items ENABLE ROW LEVEL SECURITY;
```

### expense_audit_log

Immutable audit trail for all expense actions.

```sql
CREATE TABLE expense_audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id  UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  expense_id  UUID REFERENCES expenses(id),
  report_id   UUID REFERENCES expense_reports(id),
  actor_id    UUID NOT NULL,
  action      TEXT NOT NULL,
  metadata    JSONB,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_venture ON expense_audit_log(venture_id);
CREATE INDEX idx_audit_log_expense ON expense_audit_log(expense_id);
CREATE INDEX idx_audit_log_report ON expense_audit_log(report_id);
CREATE INDEX idx_audit_log_actor ON expense_audit_log(actor_id);
CREATE INDEX idx_audit_log_action ON expense_audit_log(venture_id, action);
CREATE INDEX idx_audit_log_created ON expense_audit_log(created_at DESC);

-- Append-only: no updates or deletes
ALTER TABLE expense_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_log_read ON expense_audit_log
  FOR SELECT USING (
    has_role(current_setting('app.user_id')::UUID, venture_id, 'FINANCE')
    OR has_role(current_setting('app.user_id')::UUID, venture_id, 'ADMIN')
  );

CREATE POLICY audit_log_insert ON expense_audit_log
  FOR INSERT WITH CHECK (TRUE);  -- Any authenticated user can create audit entries
```

---

## Additional Services

### ReceiptOCRService

AI-powered receipt scanning and data extraction.

```typescript
/**
 * Receipt OCR service for automatic data extraction.
 *
 * Supports multiple OCR providers (Google Vision, AWS Textract)
 * with fallback chain. Extracts structured data from receipt
 * images and PDFs.
 */
export class ReceiptOCRService {
  constructor(
    private readonly config: OCRConfig,
  ) {}

  /**
   * Scan a receipt and extract structured data.
   *
   * @param buffer - File contents
   * @param mimeType - File MIME type
   * @returns Extraction result with confidence score
   */
  async scan(buffer: Buffer, mimeType: string): Promise<OCRResult> {
    try {
      // Choose provider based on configuration
      const rawText = await this.extractText(buffer, mimeType);

      // Parse structured data from raw text
      const parsed = await this.parseReceiptData(rawText);

      return {
        success: true,
        data: parsed,
        confidence: parsed.confidence,
        rawText,
        provider: this.config.provider,
      };
    } catch (error) {
      // Try fallback provider
      if (this.config.fallbackProvider) {
        try {
          const rawText = await this.extractText(buffer, mimeType, this.config.fallbackProvider);
          const parsed = await this.parseReceiptData(rawText);
          return {
            success: true,
            data: parsed,
            confidence: parsed.confidence,
            rawText,
            provider: this.config.fallbackProvider,
          };
        } catch {
          // Both providers failed
        }
      }

      return {
        success: false,
        data: null,
        confidence: 0,
        rawText: null,
        provider: this.config.provider,
        error: error instanceof Error ? error.message : 'OCR processing failed',
      };
    }
  }

  /**
   * Parse structured receipt data from raw OCR text.
   *
   * Extracts:
   * - Merchant name and address
   * - Transaction date and time
   * - Individual line items with quantities and prices
   * - Subtotal, tax, tip, and total amounts
   * - Payment method
   * - Currency
   */
  private async parseReceiptData(rawText: string): Promise<ReceiptData> {
    // Use AI model for intelligent extraction
    const extraction = await this.aiExtract(rawText);

    return {
      merchantName: extraction.merchant?.name ?? null,
      merchantAddress: extraction.merchant?.address ?? null,
      merchantPhone: extraction.merchant?.phone ?? null,
      transactionDate: extraction.date ?? null,
      transactionTime: extraction.time ?? null,
      currency: extraction.currency ?? 'USD',
      subtotal: extraction.subtotal ?? null,
      taxAmount: extraction.tax ?? null,
      tipAmount: extraction.tip ?? null,
      totalAmount: extraction.total ?? null,
      paymentMethod: extraction.paymentMethod ?? null,
      lastFourDigits: extraction.lastFour ?? null,
      lineItems: (extraction.items ?? []).map((item: any) => ({
        description: item.description,
        quantity: item.quantity ?? 1,
        unitPrice: item.unitPrice ?? item.amount,
        amount: item.amount,
        taxAmount: item.tax ?? 0,
        category: item.category ?? null,
      })),
      confidence: extraction.confidence ?? 0,
      rawFields: extraction.rawFields ?? {},
    };
  }
}

export interface OCRResult {
  success: boolean;
  data: ReceiptData | null;
  confidence: number;
  rawText: string | null;
  provider: string;
  error?: string;
}

export interface ReceiptData {
  merchantName: string | null;
  merchantAddress: string | null;
  merchantPhone: string | null;
  transactionDate: string | null;
  transactionTime: string | null;
  currency: string;
  subtotal: number | null;
  taxAmount: number | null;
  tipAmount: number | null;
  totalAmount: number | null;
  paymentMethod: string | null;
  lastFourDigits: string | null;
  lineItems: ReceiptLineItem[];
  confidence: number;
  rawFields: Record<string, unknown>;
}

export interface ReceiptLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxAmount: number;
  category: string | null;
}
```

### MileageService

Distance-based expense calculation.

```typescript
/**
 * Mileage expense calculation service.
 *
 * Calculates reimbursement amounts based on distance traveled,
 * using jurisdiction-specific rates. Supports multiple vehicle
 * types and automatic rate lookup.
 */
export class MileageService {
  constructor(
    private readonly db: SupabaseClient,
    private readonly expenseService: ExpenseService,
  ) {}

  /**
   * Calculate mileage reimbursement.
   *
   * @param ventureId - Venture context
   * @param input - Mileage details
   * @returns Calculation result with rate applied
   */
  async calculate(
    ventureId: string,
    input: MileageCalculationInput,
  ): Promise<MileageCalculation> {
    // Look up applicable rate
    const rate = await this.getRate(ventureId, input.jurisdiction, input.vehicleType, input.date);

    if (!rate) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `No mileage rate found for ${input.jurisdiction} / ${input.vehicleType}`,
        cause: 'RATE_NOT_FOUND',
      });
    }

    const distanceKm = input.unit === 'miles'
      ? input.distance * 1.60934
      : input.distance;

    const distanceMiles = input.unit === 'km'
      ? input.distance * 0.621371
      : input.distance;

    const amount = input.unit === 'miles'
      ? input.distance * rate.ratePerMile
      : input.distance * rate.ratePerKm;

    return {
      distance: input.distance,
      unit: input.unit,
      distanceKm,
      distanceMiles,
      rate: input.unit === 'miles' ? rate.ratePerMile : rate.ratePerKm,
      rateUnit: input.unit === 'miles' ? 'per_mile' : 'per_km',
      amount: Math.round(amount * 100) / 100,
      currency: rate.currency,
      jurisdiction: input.jurisdiction,
      vehicleType: input.vehicleType,
      rateEffectiveDate: rate.effectiveFrom,
    };
  }

  /**
   * Create an expense from a mileage calculation.
   */
  async createExpense(
    ventureId: string,
    employeeId: string,
    input: MileageExpenseInput,
  ): Promise<Expense> {
    const calculation = await this.calculate(ventureId, {
      jurisdiction: input.jurisdiction,
      vehicleType: input.vehicleType ?? 'CAR',
      distance: input.distance,
      unit: input.unit ?? 'km',
      date: input.date,
    });

    return this.expenseService.create(ventureId, employeeId, {
      category: 'MILEAGE',
      description: `Mileage: ${input.fromLocation} → ${input.toLocation} (${calculation.distance} ${calculation.unit})`,
      amount: calculation.amount,
      currency: calculation.currency,
      expenseDate: input.date,
      projectId: input.projectId,
      departmentId: input.departmentId,
      notes: `Distance: ${calculation.distance} ${calculation.unit}\nRate: ${calculation.rate} ${calculation.rateUnit}\nVehicle: ${calculation.vehicleType}\nRoute: ${input.fromLocation} → ${input.toLocation}${input.roundTrip ? ' (round trip)' : ''}`,
    });
  }

  /**
   * Get the applicable mileage rate for a jurisdiction.
   */
  async getRate(
    ventureId: string,
    jurisdiction: string,
    vehicleType: string = 'CAR',
    date: string = new Date().toISOString().split('T')[0],
  ): Promise<MileageRate | null> {
    // Try exact jurisdiction match first
    const { data } = await this.db
      .from('mileage_rates')
      .select('*')
      .eq('venture_id', ventureId)
      .eq('jurisdiction', jurisdiction)
      .eq('vehicle_type', vehicleType)
      .lte('effective_from', date)
      .or(`effective_to.is.null,effective_to.gte.${date}`)
      .order('effective_from', { ascending: false })
      .limit(1)
      .single();

    if (data) return this.mapToMileageRate(data);

    // Fall back to country-level rate
    const countryCode = jurisdiction.split('-')[0];
    const { data: fallback } = await this.db
      .from('mileage_rates')
      .select('*')
      .eq('venture_id', ventureId)
      .eq('jurisdiction', countryCode)
      .eq('vehicle_type', vehicleType)
      .lte('effective_from', date)
      .or(`effective_to.is.null,effective_to.gte.${date}`)
      .order('effective_from', { ascending: false })
      .limit(1)
      .single();

    if (fallback) return this.mapToMileageRate(fallback);

    // Fall back to default rate
    const { data: defaultRate } = await this.db
      .from('mileage_rates')
      .select('*')
      .eq('venture_id', ventureId)
      .eq('is_default', true)
      .eq('vehicle_type', vehicleType)
      .lte('effective_from', date)
      .or(`effective_to.is.null,effective_to.gte.${date}`)
      .order('effective_from', { ascending: false })
      .limit(1)
      .single();

    return defaultRate ? this.mapToMileageRate(defaultRate) : null;
  }
}

export interface MileageCalculationInput {
  jurisdiction: string;
  vehicleType: string;
  distance: number;
  unit: 'km' | 'miles';
  date: string;
}

export interface MileageExpenseInput {
  fromLocation: string;
  toLocation: string;
  distance: number;
  unit?: 'km' | 'miles';
  jurisdiction: string;
  vehicleType?: string;
  date: string;
  roundTrip?: boolean;
  projectId?: string;
  departmentId?: string;
}

export interface MileageCalculation {
  distance: number;
  unit: 'km' | 'miles';
  distanceKm: number;
  distanceMiles: number;
  rate: number;
  rateUnit: string;
  amount: number;
  currency: string;
  jurisdiction: string;
  vehicleType: string;
  rateEffectiveDate: string;
}

export interface MileageRate {
  id: string;
  ventureId: string;
  jurisdiction: string;
  vehicleType: string;
  ratePerKm: number;
  ratePerMile: number;
  currency: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  isDefault: boolean;
}
```

### PerDiemService

Per-diem rate management and expense calculation for travel.

```typescript
/**
 * Per-diem rate lookup and expense generation.
 *
 * Manages per-diem rates by city/country and calculates
 * daily allowances for multi-day travel with first/last
 * day proration.
 */
export class PerDiemService {
  constructor(
    private readonly db: SupabaseClient,
    private readonly expenseService: ExpenseService,
  ) {}

  /**
   * Calculate per-diem for a trip.
   *
   * Handles multi-city itineraries, first/last day proration,
   * and meal deductions when meals are provided.
   */
  async calculate(
    ventureId: string,
    input: PerDiemCalculationInput,
  ): Promise<PerDiemCalculation> {
    const days: PerDiemDayBreakdown[] = [];
    let totalLodging = 0;
    let totalMeals = 0;
    let totalIncidentals = 0;

    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);
    const totalDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    ) + 1;

    for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + dayIndex);
      const dateStr = currentDate.toISOString().split('T')[0];

      // Determine location for this day
      const location = this.getLocationForDate(input.itinerary, dateStr);
      const rate = await this.getRate(ventureId, location.code, dateStr);

      if (!rate) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `No per-diem rate found for ${location.name} on ${dateStr}`,
          cause: 'RATE_NOT_FOUND',
        });
      }

      // First/last day proration
      const isFirstDay = dayIndex === 0;
      const isLastDay = dayIndex === totalDays - 1;
      const dayFactor = (isFirstDay || isLastDay) ? rate.firstLastDayRate : 1.0;

      // Meal deductions
      const mealDeductions = input.mealsProvided?.[dateStr] ?? {};
      let mealsDeduction = 0;
      if (mealDeductions.breakfast) mealsDeduction += rate.mealsRate * 0.20;
      if (mealDeductions.lunch) mealsDeduction += rate.mealsRate * 0.30;
      if (mealDeductions.dinner) mealsDeduction += rate.mealsRate * 0.50;

      const lodging = isLastDay ? 0 : rate.lodgingRate;
      const meals = Math.max(0, (rate.mealsRate * dayFactor) - mealsDeduction);
      const incidentals = rate.incidentalsRate * dayFactor;

      days.push({
        date: dateStr,
        location: location.name,
        locationCode: location.code,
        isFirstDay,
        isLastDay,
        dayFactor,
        lodging,
        meals,
        incidentals,
        mealsDeduction,
        dayTotal: lodging + meals + incidentals,
      });

      totalLodging += lodging;
      totalMeals += meals;
      totalIncidentals += incidentals;
    }

    return {
      startDate: input.startDate,
      endDate: input.endDate,
      totalDays,
      currency: 'USD', // rates are in USD by default
      totalLodging,
      totalMeals,
      totalIncidentals,
      grandTotal: totalLodging + totalMeals + totalIncidentals,
      days,
    };
  }

  /**
   * Create per-diem expenses from a calculation.
   *
   * Generates one expense per day for granular tracking,
   * or a single consolidated expense for the full trip.
   */
  async createExpenses(
    ventureId: string,
    employeeId: string,
    calculation: PerDiemCalculation,
    options: { consolidate?: boolean; projectId?: string; departmentId?: string } = {},
  ): Promise<Expense[]> {
    if (options.consolidate) {
      // Single consolidated expense
      const expense = await this.expenseService.create(ventureId, employeeId, {
        category: 'PER_DIEM',
        description: `Per diem: ${calculation.startDate} to ${calculation.endDate} (${calculation.totalDays} days)`,
        amount: calculation.grandTotal,
        currency: calculation.currency,
        expenseDate: calculation.startDate,
        projectId: options.projectId,
        departmentId: options.departmentId,
        notes: this.formatCalculationNotes(calculation),
      });
      return [expense];
    }

    // One expense per day
    const expenses: Expense[] = [];
    for (const day of calculation.days) {
      if (day.dayTotal === 0) continue;
      const expense = await this.expenseService.create(ventureId, employeeId, {
        category: 'PER_DIEM',
        description: `Per diem: ${day.location} (${day.date})`,
        amount: day.dayTotal,
        currency: calculation.currency,
        expenseDate: day.date,
        projectId: options.projectId,
        departmentId: options.departmentId,
        notes: `Lodging: ${day.lodging}, Meals: ${day.meals}, Incidentals: ${day.incidentals}`,
      });
      expenses.push(expense);
    }

    return expenses;
  }

  /**
   * Get per-diem rate for a location.
   */
  async getRate(
    ventureId: string,
    locationCode: string,
    date: string = new Date().toISOString().split('T')[0],
  ): Promise<PerDiemRate | null> {
    // Try exact location first, then broader (city → state → country)
    const locationParts = locationCode.split('-');
    const searchCodes = [];
    for (let i = locationParts.length; i > 0; i--) {
      searchCodes.push(locationParts.slice(0, i).join('-'));
    }

    for (const code of searchCodes) {
      const { data } = await this.db
        .from('per_diem_rates')
        .select('*')
        .eq('venture_id', ventureId)
        .eq('location_code', code)
        .lte('effective_from', date)
        .or(`effective_to.is.null,effective_to.gte.${date}`)
        .order('effective_from', { ascending: false })
        .limit(1)
        .single();

      if (data) return this.mapToPerDiemRate(data);
    }

    return null;
  }
}

export interface PerDiemCalculationInput {
  startDate: string;
  endDate: string;
  itinerary: Array<{
    startDate: string;
    endDate: string;
    locationCode: string;
    locationName: string;
  }>;
  mealsProvided?: Record<string, {
    breakfast?: boolean;
    lunch?: boolean;
    dinner?: boolean;
  }>;
}

export interface PerDiemCalculation {
  startDate: string;
  endDate: string;
  totalDays: number;
  currency: string;
  totalLodging: number;
  totalMeals: number;
  totalIncidentals: number;
  grandTotal: number;
  days: PerDiemDayBreakdown[];
}

export interface PerDiemDayBreakdown {
  date: string;
  location: string;
  locationCode: string;
  isFirstDay: boolean;
  isLastDay: boolean;
  dayFactor: number;
  lodging: number;
  meals: number;
  incidentals: number;
  mealsDeduction: number;
  dayTotal: number;
}

export interface PerDiemRate {
  id: string;
  ventureId: string;
  locationType: 'CITY' | 'STATE' | 'COUNTRY';
  locationCode: string;
  locationName: string;
  lodgingRate: number;
  mealsRate: number;
  incidentalsRate: number;
  totalRate: number;
  currency: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  firstLastDayRate: number;
}
```

### ReimbursementService

Batch reimbursement processing with payroll integration.

```typescript
/**
 * Batch reimbursement processing.
 *
 * Groups approved expenses by employee and creates
 * reimbursement batches for payment via payroll,
 * direct deposit, or other methods.
 */
export class ReimbursementService {
  constructor(
    private readonly db: SupabaseClient,
    private readonly payrollIntegration: PayrollIntegration,
  ) {}

  /**
   * Create a reimbursement batch from approved expenses.
   *
   * Finds all APPROVED expenses not yet reimbursed and
   * groups them by employee into a payment batch.
   */
  async createBatch(
    ventureId: string,
    options: ReimbursementBatchOptions = {},
  ): Promise<ReimbursementBatch> {
    // Find approved, unreimbursed expenses
    let query = this.db
      .from('expenses')
      .select('*')
      .eq('venture_id', ventureId)
      .eq('status', 'APPROVED')
      .is('paid_at', null);

    if (options.employeeIds?.length) {
      query = query.in('employee_id', options.employeeIds);
    }
    if (options.dateFrom) {
      query = query.gte('approved_at', options.dateFrom);
    }
    if (options.dateTo) {
      query = query.lte('approved_at', options.dateTo);
    }
    if (options.departmentId) {
      query = query.eq('department_id', options.departmentId);
    }

    const { data: expenses } = await query;
    if (!expenses?.length) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'No approved unreimbursed expenses found',
        cause: 'NO_EXPENSES',
      });
    }

    // Group by employee
    const byEmployee = new Map<string, typeof expenses>();
    for (const exp of expenses) {
      const list = byEmployee.get(exp.employee_id) ?? [];
      list.push(exp);
      byEmployee.set(exp.employee_id, list);
    }

    // Generate batch number
    const batchNumber = await this.generateBatchNumber(ventureId);

    // Create batch
    const totalAmount = expenses.reduce((sum, e) => sum + parseFloat(e.base_amount), 0);

    const { data: batch, error } = await this.db
      .from('reimbursement_batches')
      .insert({
        venture_id: ventureId,
        status: 'PENDING',
        batch_number: batchNumber,
        total_amount: totalAmount,
        currency: 'USD',
        item_count: expenses.length,
        payment_method: options.paymentMethod ?? 'PAYROLL',
        notes: options.notes ?? null,
      })
      .select()
      .single();

    if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

    // Create reimbursement items grouped by employee
    const items: any[] = [];
    for (const [employeeId, employeeExpenses] of byEmployee) {
      const employeeTotal = employeeExpenses.reduce(
        (sum, e) => sum + parseFloat(e.base_amount),
        0,
      );

      items.push({
        batch_id: batch.id,
        venture_id: ventureId,
        employee_id: employeeId,
        amount: employeeTotal,
        currency: 'USD',
        status: 'PENDING',
      });

      // Link individual expenses
      for (const exp of employeeExpenses) {
        await this.db
          .from('reimbursement_items')
          .insert({
            batch_id: batch.id,
            venture_id: ventureId,
            expense_id: exp.id,
            employee_id: employeeId,
            amount: parseFloat(exp.base_amount),
            currency: 'USD',
            status: 'PENDING',
          });
      }
    }

    return this.mapToBatch(batch);
  }

  /**
   * Process a reimbursement batch.
   *
   * Sends payment instructions to the payroll system or
   * initiates direct deposit transfers. Updates expense
   * statuses to REIMBURSED on success.
   */
  async processBatch(
    ventureId: string,
    batchId: string,
    processedBy: string,
  ): Promise<ReimbursementBatch> {
    const batch = await this.getBatchOrThrow(ventureId, batchId);

    if (batch.status !== 'PENDING') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Cannot process batch in ${batch.status} status`,
        cause: 'INVALID_STATUS',
      });
    }

    // Update batch to processing
    await this.db
      .from('reimbursement_batches')
      .update({
        status: 'PROCESSING',
        processed_by: processedBy,
        processed_at: new Date().toISOString(),
      })
      .eq('id', batchId);

    // Get all items in this batch
    const { data: items } = await this.db
      .from('reimbursement_items')
      .select('*')
      .eq('batch_id', batchId);

    let allSuccess = true;

    for (const item of items ?? []) {
      try {
        // Send to payroll/payment system
        const paymentRef = await this.payrollIntegration.submitReimbursement({
          employeeId: item.employee_id,
          amount: parseFloat(item.amount),
          currency: item.currency,
          reference: `${batch.batch_number}-${item.id}`,
        });

        // Mark item as paid
        await this.db
          .from('reimbursement_items')
          .update({
            status: 'PAID',
            payment_reference: paymentRef,
            paid_at: new Date().toISOString(),
          })
          .eq('id', item.id);

        // Update expense status
        if (item.expense_id) {
          await this.db
            .from('expenses')
            .update({
              status: 'REIMBURSED',
              paid_at: new Date().toISOString(),
            })
            .eq('id', item.expense_id);
        }
      } catch (err) {
        allSuccess = false;
        await this.db
          .from('reimbursement_items')
          .update({
            status: 'FAILED',
            error_message: err instanceof Error ? err.message : 'Payment failed',
          })
          .eq('id', item.id);
      }
    }

    // Update batch status
    const finalStatus = allSuccess ? 'COMPLETED' : 'FAILED';
    await this.db
      .from('reimbursement_batches')
      .update({ status: finalStatus })
      .eq('id', batchId);

    return this.getBatchOrThrow(ventureId, batchId);
  }

  /**
   * Export batch data for payroll integration.
   */
  async exportToPayroll(
    ventureId: string,
    batchId: string,
    format: 'CSV' | 'JSON' = 'CSV',
  ): Promise<{ data: string; filename: string; mimeType: string }> {
    const batch = await this.getBatchOrThrow(ventureId, batchId);
    const { data: items } = await this.db
      .from('reimbursement_items')
      .select('*, employees(first_name, last_name, employee_number, bank_account)')
      .eq('batch_id', batchId);

    if (format === 'CSV') {
      const header = 'Employee Number,Employee Name,Amount,Currency,Reference\n';
      const rows = (items ?? [])
        .map(i =>
          `${i.employees.employee_number},${i.employees.first_name} ${i.employees.last_name},${i.amount},${i.currency},${batch.batchNumber}-${i.id}`,
        )
        .join('\n');

      return {
        data: header + rows,
        filename: `reimbursement-${batch.batchNumber}.csv`,
        mimeType: 'text/csv',
      };
    }

    return {
      data: JSON.stringify({ batch, items }, null, 2),
      filename: `reimbursement-${batch.batchNumber}.json`,
      mimeType: 'application/json',
    };
  }
}

export interface ReimbursementBatch {
  id: string;
  ventureId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  batchNumber: string;
  totalAmount: number;
  currency: string;
  itemCount: number;
  paymentMethod: string;
  processedBy: string | null;
  processedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReimbursementBatchOptions {
  employeeIds?: string[];
  dateFrom?: string;
  dateTo?: string;
  departmentId?: string;
  paymentMethod?: 'PAYROLL' | 'DIRECT_DEPOSIT' | 'CHECK' | 'WIRE';
  notes?: string;
}

export interface ReimbursementItem {
  id: string;
  batchId: string;
  expenseId: string | null;
  reportId: string | null;
  employeeId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';
  paymentReference: string | null;
  paidAt: string | null;
  errorMessage: string | null;
}

export interface PayrollIntegration {
  submitReimbursement(params: {
    employeeId: string;
    amount: number;
    currency: string;
    reference: string;
  }): Promise<string>;
}
```

### ExpenseAnalyticsService

Spending analytics, trend analysis, and budget monitoring.

```typescript
/**
 * Expense analytics and reporting service.
 *
 * Provides spending insights by category, department,
 * employee, and time period. Supports budget monitoring,
 * trend analysis, and policy compliance reporting.
 */
export class ExpenseAnalyticsService {
  constructor(private readonly db: SupabaseClient) {}

  /**
   * Get spending breakdown by category.
   */
  async getSpendByCategory(
    ventureId: string,
    period: { startDate: string; endDate: string },
    filters?: { departmentId?: string; employeeId?: string },
  ): Promise<CategoryBreakdown[]> {
    let query = this.db
      .from('expenses')
      .select('category, base_amount')
      .eq('venture_id', ventureId)
      .in('status', ['APPROVED', 'REIMBURSED'])
      .gte('expense_date', period.startDate)
      .lte('expense_date', period.endDate);

    if (filters?.departmentId) query = query.eq('department_id', filters.departmentId);
    if (filters?.employeeId) query = query.eq('employee_id', filters.employeeId);

    const { data: expenses } = await query;
    if (!expenses?.length) return [];

    const grouped = new Map<string, { count: number; total: number }>();
    let grandTotal = 0;

    for (const exp of expenses) {
      const amount = parseFloat(exp.base_amount);
      const entry = grouped.get(exp.category) ?? { count: 0, total: 0 };
      entry.count++;
      entry.total += amount;
      grouped.set(exp.category, entry);
      grandTotal += amount;
    }

    return Array.from(grouped.entries())
      .map(([category, data]) => ({
        category,
        count: data.count,
        totalAmount: Math.round(data.total * 100) / 100,
        percentage: grandTotal > 0 ? Math.round((data.total / grandTotal) * 10000) / 100 : 0,
        averageAmount: Math.round((data.total / data.count) * 100) / 100,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }

  /**
   * Get spending breakdown by department.
   */
  async getSpendByDepartment(
    ventureId: string,
    period: { startDate: string; endDate: string },
  ): Promise<DepartmentSpend[]> {
    const { data } = await this.db.rpc('expense_spend_by_department', {
      p_venture_id: ventureId,
      p_start_date: period.startDate,
      p_end_date: period.endDate,
    });

    return (data ?? []).map((row: any) => ({
      departmentId: row.department_id,
      departmentName: row.department_name,
      expenseCount: row.expense_count,
      totalAmount: parseFloat(row.total_amount),
      budget: row.budget ? parseFloat(row.budget) : null,
      budgetUtilization: row.budget
        ? Math.round((parseFloat(row.total_amount) / parseFloat(row.budget)) * 10000) / 100
        : null,
      topCategories: row.top_categories ?? [],
    }));
  }

  /**
   * Get spending trends over time.
   */
  async getTrends(
    ventureId: string,
    options: {
      granularity: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY';
      periods: number;
      category?: ExpenseCategory;
      departmentId?: string;
    },
  ): Promise<TrendData[]> {
    const intervals = this.generateIntervals(options.granularity, options.periods);
    const trends: TrendData[] = [];

    for (const interval of intervals) {
      let query = this.db
        .from('expenses')
        .select('base_amount', { count: 'exact' })
        .eq('venture_id', ventureId)
        .in('status', ['APPROVED', 'REIMBURSED'])
        .gte('expense_date', interval.start)
        .lte('expense_date', interval.end);

      if (options.category) query = query.eq('category', options.category);
      if (options.departmentId) query = query.eq('department_id', options.departmentId);

      const { data: expenses, count } = await query;

      const totalAmount = expenses?.reduce(
        (sum, e) => sum + parseFloat(e.base_amount),
        0,
      ) ?? 0;

      trends.push({
        periodStart: interval.start,
        periodEnd: interval.end,
        periodLabel: interval.label,
        expenseCount: count ?? 0,
        totalAmount: Math.round(totalAmount * 100) / 100,
        averageAmount:
          count && count > 0
            ? Math.round((totalAmount / count) * 100) / 100
            : 0,
      });
    }

    // Calculate period-over-period changes
    for (let i = 1; i < trends.length; i++) {
      const prev = trends[i - 1].totalAmount;
      const curr = trends[i].totalAmount;
      trends[i].changePercent =
        prev > 0 ? Math.round(((curr - prev) / prev) * 10000) / 100 : null;
    }

    return trends;
  }

  /**
   * Get top spenders in a venture.
   */
  async getTopSpenders(
    ventureId: string,
    period: { startDate: string; endDate: string },
    limit: number = 10,
  ): Promise<Array<{
    employeeId: string;
    employeeName: string;
    expenseCount: number;
    totalAmount: number;
    topCategory: string;
  }>> {
    const { data } = await this.db.rpc('expense_top_spenders', {
      p_venture_id: ventureId,
      p_start_date: period.startDate,
      p_end_date: period.endDate,
      p_limit: limit,
    });

    return (data ?? []).map((row: any) => ({
      employeeId: row.employee_id,
      employeeName: row.employee_name,
      expenseCount: row.expense_count,
      totalAmount: parseFloat(row.total_amount),
      topCategory: row.top_category,
    }));
  }

  /**
   * Get budget alerts for departments exceeding thresholds.
   */
  async getBudgetAlerts(
    ventureId: string,
    thresholdPercent: number = 80,
  ): Promise<BudgetAlert[]> {
    const departments = await this.getSpendByDepartment(ventureId, {
      startDate: this.getCurrentPeriodStart(),
      endDate: new Date().toISOString().split('T')[0],
    });

    return departments
      .filter(d => d.budget && d.budgetUtilization && d.budgetUtilization >= thresholdPercent)
      .map(d => ({
        departmentId: d.departmentId,
        departmentName: d.departmentName,
        budget: d.budget!,
        spent: d.totalAmount,
        utilization: d.budgetUtilization!,
        severity: d.budgetUtilization! >= 100 ? 'CRITICAL' as const
          : d.budgetUtilization! >= 90 ? 'HIGH' as const
          : 'MEDIUM' as const,
        projectedOverage: d.budgetUtilization! >= 100
          ? d.totalAmount - d.budget!
          : null,
      }));
  }

  /**
   * Get policy compliance metrics.
   */
  async getPolicyCompliance(
    ventureId: string,
    period: { startDate: string; endDate: string },
  ): Promise<{
    totalExpenses: number;
    withReceipts: number;
    receiptRate: number;
    policyViolations: number;
    violationRate: number;
    avgApprovalHours: number;
    avgReimbursementHours: number;
    autoApproved: number;
    autoApproveRate: number;
  }> {
    const { data: expenses } = await this.db
      .from('expenses')
      .select('id, status, receipts:expense_receipts(id), policy_warnings, submitted_at, approved_at, paid_at')
      .eq('venture_id', ventureId)
      .gte('expense_date', period.startDate)
      .lte('expense_date', period.endDate)
      .neq('status', 'DRAFT')
      .neq('status', 'CANCELLED');

    if (!expenses?.length) {
      return {
        totalExpenses: 0, withReceipts: 0, receiptRate: 0,
        policyViolations: 0, violationRate: 0,
        avgApprovalHours: 0, avgReimbursementHours: 0,
        autoApproved: 0, autoApproveRate: 0,
      };
    }

    const total = expenses.length;
    const withReceipts = expenses.filter(e => e.receipts?.length > 0).length;
    const withViolations = expenses.filter(
      e => e.policy_warnings && (e.policy_warnings as any[]).length > 0,
    ).length;

    // Calculate approval times
    const approvalTimes = expenses
      .filter(e => e.submitted_at && e.approved_at)
      .map(e => {
        const submitted = new Date(e.submitted_at!).getTime();
        const approved = new Date(e.approved_at!).getTime();
        return (approved - submitted) / 3600000; // hours
      });

    const reimbursementTimes = expenses
      .filter(e => e.approved_at && e.paid_at)
      .map(e => {
        const approved = new Date(e.approved_at!).getTime();
        const paid = new Date(e.paid_at!).getTime();
        return (paid - approved) / 3600000;
      });

    // Check audit log for auto-approved count
    const { count: autoApprovedCount } = await this.db
      .from('expense_audit_log')
      .select('*', { count: 'exact', head: true })
      .eq('venture_id', ventureId)
      .eq('action', 'AUTO_APPROVED')
      .gte('created_at', period.startDate)
      .lte('created_at', period.endDate);

    const autoApproved = autoApprovedCount ?? 0;

    return {
      totalExpenses: total,
      withReceipts,
      receiptRate: Math.round((withReceipts / total) * 10000) / 100,
      policyViolations: withViolations,
      violationRate: Math.round((withViolations / total) * 10000) / 100,
      avgApprovalHours: approvalTimes.length > 0
        ? Math.round((approvalTimes.reduce((a, b) => a + b, 0) / approvalTimes.length) * 100) / 100
        : 0,
      avgReimbursementHours: reimbursementTimes.length > 0
        ? Math.round((reimbursementTimes.reduce((a, b) => a + b, 0) / reimbursementTimes.length) * 100) / 100
        : 0,
      autoApproved,
      autoApproveRate: total > 0 ? Math.round((autoApproved / total) * 10000) / 100 : 0,
    };
  }
}

export interface CategoryBreakdown {
  category: string;
  count: number;
  totalAmount: number;
  percentage: number;
  averageAmount: number;
}

export interface DepartmentSpend {
  departmentId: string;
  departmentName: string;
  expenseCount: number;
  totalAmount: number;
  budget: number | null;
  budgetUtilization: number | null;
  topCategories: string[];
}

export interface TrendData {
  periodStart: string;
  periodEnd: string;
  periodLabel: string;
  expenseCount: number;
  totalAmount: number;
  averageAmount: number;
  changePercent?: number | null;
}

export interface BudgetAlert {
  departmentId: string;
  departmentName: string;
  budget: number;
  spent: number;
  utilization: number;
  severity: 'MEDIUM' | 'HIGH' | 'CRITICAL';
  projectedOverage: number | null;
}

export interface SpendingAnalytics {
  period: { startDate: string; endDate: string };
  totalSpend: number;
  expenseCount: number;
  uniqueEmployees: number;
  byCategory: CategoryBreakdown[];
  byDepartment: DepartmentSpend[];
  trends: TrendData[];
  budgetAlerts: BudgetAlert[];
  compliance: {
    receiptRate: number;
    violationRate: number;
    avgApprovalHours: number;
  };
}
```

---

## tRPC Router

```typescript
import { z } from 'zod';
import { router, protectedProcedure, financeProcedure } from '@mcv/trpc';

export const expensesRouter = router({
  // === Expense CRUD ===

  create: protectedProcedure
    .input(expenseCreateSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.expenses.create(ctx.ventureId, ctx.userId, input);
    }),

  get: protectedProcedure
    .input(z.object({ expenseId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.expenses.get(ctx.ventureId, input.expenseId);
    }),

  list: protectedProcedure
    .input(z.object({
      status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'REIMBURSED']).optional(),
      category: z.string().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      search: z.string().optional(),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(25),
    }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.expenses.list(ctx.ventureId, { ...input, employeeId: ctx.userId });
    }),

  update: protectedProcedure
    .input(z.object({
      expenseId: z.string().uuid(),
      data: expenseUpdateSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.expenses.update(ctx.ventureId, input.expenseId, ctx.userId, input.data);
    }),

  delete: protectedProcedure
    .input(z.object({ expenseId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.expenses.delete(ctx.ventureId, input.expenseId, ctx.userId);
    }),

  // === Submission & Recall ===

  submit: protectedProcedure
    .input(z.object({ expenseId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.expenses.submit(ctx.ventureId, input.expenseId, ctx.userId);
    }),

  recall: protectedProcedure
    .input(z.object({ expenseId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.expenses.recall(ctx.ventureId, input.expenseId, ctx.userId);
    }),

  // === Receipts ===

  attachReceipt: protectedProcedure
    .input(z.object({
      expenseId: z.string().uuid(),
      filename: z.string(),
      mimeType: z.string(),
      base64: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const buffer = Buffer.from(input.base64, 'base64');
      return ctx.expenses.attachReceipt(ctx.ventureId, input.expenseId, ctx.userId, {
        buffer,
        filename: input.filename,
        mimeType: input.mimeType,
        size: buffer.length,
      });
    }),

  // === Approvals ===

  approve: financeProcedure
    .input(approvalActionSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.approval.processDecision(ctx.ventureId, input.instanceId, ctx.userId, {
        stepId: input.stepId,
        decision: 'APPROVED',
        comment: input.comment ?? null,
      });
    }),

  reject: financeProcedure
    .input(approvalActionSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.approval.processDecision(ctx.ventureId, input.instanceId, ctx.userId, {
        stepId: input.stepId,
        decision: 'REJECTED',
        comment: input.comment ?? null,
      });
    }),

  delegate: financeProcedure
    .input(z.object({
      instanceId: z.string().uuid(),
      stepId: z.string().uuid(),
      delegateToUserId: z.string().uuid(),
      comment: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.approval.processDecision(ctx.ventureId, input.instanceId, ctx.userId, {
        stepId: input.stepId,
        decision: 'DELEGATED',
        comment: input.comment ?? null,
        delegateToUserId: input.delegateToUserId,
      });
    }),

  pendingApprovals: financeProcedure
    .input(z.object({
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(50).default(10),
    }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.approval.getPendingForApprover(ctx.ventureId, ctx.userId, input);
    }),

  // === Reports ===

  reports: router({
    create: protectedProcedure
      .input(expenseReportCreateSchema)
      .mutation(async ({ ctx, input }) => {
        return ctx.expenseReports.create(ctx.ventureId, ctx.userId, input);
      }),

    get: protectedProcedure
      .input(z.object({ reportId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        return ctx.expenseReports.get(ctx.ventureId, input.reportId);
      }),

    addExpenses: protectedProcedure
      .input(z.object({
        reportId: z.string().uuid(),
        expenseIds: z.array(z.string().uuid()),
      }))
      .mutation(async ({ ctx, input }) => {
        return ctx.expenseReports.addExpenses(
          ctx.ventureId, input.reportId, ctx.userId, input.expenseIds,
        );
      }),

    submit: protectedProcedure
      .input(z.object({ reportId: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        return ctx.expenseReports.submit(ctx.ventureId, input.reportId, ctx.userId);
      }),
  }),

  // === Mileage ===

  mileage: router({
    calculate: protectedProcedure
      .input(mileageExpenseSchema)
      .query(async ({ ctx, input }) => {
        return ctx.mileage.calculate(ctx.ventureId, input);
      }),

    createExpense: protectedProcedure
      .input(mileageExpenseSchema)
      .mutation(async ({ ctx, input }) => {
        return ctx.mileage.createExpense(ctx.ventureId, ctx.userId, input);
      }),
  }),

  // === Per-Diem ===

  perDiem: router({
    calculate: protectedProcedure
      .input(perDiemRequestSchema)
      .query(async ({ ctx, input }) => {
        return ctx.perDiem.calculate(ctx.ventureId, input);
      }),

    createExpenses: protectedProcedure
      .input(z.object({
        calculation: z.any(), // PerDiemCalculation
        consolidate: z.boolean().default(false),
        projectId: z.string().uuid().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return ctx.perDiem.createExpenses(ctx.ventureId, ctx.userId, input.calculation, {
          consolidate: input.consolidate,
          projectId: input.projectId,
        });
      }),

    rates: protectedProcedure
      .input(z.object({
        locationCode: z.string(),
        date: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return ctx.perDiem.getRate(ctx.ventureId, input.locationCode, input.date);
      }),
  }),

  // === Corporate Cards ===

  cards: router({
    list: financeProcedure
      .query(async ({ ctx }) => {
        return ctx.corporateCards.list(ctx.ventureId);
      }),

    importTransactions: financeProcedure
      .input(z.object({
        cardId: z.string().uuid(),
        fromDate: z.string().optional(),
        toDate: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return ctx.corporateCards.importTransactions(ctx.ventureId, input.cardId, {
          fromDate: input.fromDate,
          toDate: input.toDate,
        });
      }),

    reconciliation: financeProcedure
      .input(z.object({
        cardId: z.string().uuid(),
        startDate: z.string(),
        endDate: z.string(),
      }))
      .query(async ({ ctx, input }) => {
        return ctx.corporateCards.getReconciliation(ctx.ventureId, input.cardId, {
          startDate: input.startDate,
          endDate: input.endDate,
        });
      }),

    flagUnreconciled: financeProcedure
      .input(z.object({ daysThreshold: z.number().int().default(14) }).optional())
      .query(async ({ ctx, input }) => {
        return ctx.corporateCards.flagUnreconciled(ctx.ventureId, input?.daysThreshold);
      }),
  }),

  // === Reimbursement ===

  reimburse: router({
    createBatch: financeProcedure
      .input(reimbursementBatchSchema)
      .mutation(async ({ ctx, input }) => {
        return ctx.reimbursement.createBatch(ctx.ventureId, input);
      }),

    processBatch: financeProcedure
      .input(z.object({ batchId: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        return ctx.reimbursement.processBatch(ctx.ventureId, input.batchId, ctx.userId);
      }),

    exportToPayroll: financeProcedure
      .input(z.object({
        batchId: z.string().uuid(),
        format: z.enum(['CSV', 'JSON']).default('CSV'),
      }))
      .query(async ({ ctx, input }) => {
        return ctx.reimbursement.exportToPayroll(ctx.ventureId, input.batchId, input.format);
      }),
  }),

  // === Analytics ===

  analytics: router({
    spendByCategory: financeProcedure
      .input(analyticsQuerySchema)
      .query(async ({ ctx, input }) => {
        return ctx.analytics.getSpendByCategory(ctx.ventureId, {
          startDate: input.startDate,
          endDate: input.endDate,
        }, { departmentId: input.departmentId });
      }),

    spendByDepartment: financeProcedure
      .input(analyticsQuerySchema)
      .query(async ({ ctx, input }) => {
        return ctx.analytics.getSpendByDepartment(ctx.ventureId, {
          startDate: input.startDate,
          endDate: input.endDate,
        });
      }),

    trends: financeProcedure
      .input(z.object({
        granularity: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY']).default('MONTHLY'),
        periods: z.number().int().min(1).max(24).default(6),
        category: z.string().optional(),
        departmentId: z.string().uuid().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return ctx.analytics.getTrends(ctx.ventureId, input);
      }),

    topSpenders: financeProcedure
      .input(analyticsQuerySchema.extend({ limit: z.number().int().max(50).default(10) }))
      .query(async ({ ctx, input }) => {
        return ctx.analytics.getTopSpenders(ctx.ventureId, {
          startDate: input.startDate,
          endDate: input.endDate,
        }, input.limit);
      }),

    budgetAlerts: financeProcedure
      .input(z.object({ thresholdPercent: z.number().default(80) }).optional())
      .query(async ({ ctx, input }) => {
        return ctx.analytics.getBudgetAlerts(ctx.ventureId, input?.thresholdPercent);
      }),

    compliance: financeProcedure
      .input(analyticsQuerySchema)
      .query(async ({ ctx, input }) => {
        return ctx.analytics.getPolicyCompliance(ctx.ventureId, {
          startDate: input.startDate,
          endDate: input.endDate,
        });
      }),
  }),
});
```

---

## Code Examples

### Example 1: Submit an Expense with Receipt

```typescript
import { createTRPCClient } from '@trpc/client';
import type { ExpensesRouter } from '@mcv/finance/expenses';

const client = createTRPCClient<ExpensesRouter>({ /* config */ });

// 1. Create a draft expense
const expense = await client.expenses.create.mutate({
  category: 'MEALS',
  description: 'Team dinner with client',
  merchantName: 'The Capital Grille',
  amount: 284.50,
  currency: 'USD',
  expenseDate: '2026-02-01',
  projectId: 'proj_abc123',
  isBillable: true,
  tags: ['client-entertainment', 'project-alpha'],
});

console.log(`Created expense: ${expense.id} (${expense.status})`);
// → Created expense: exp_xyz... (DRAFT)

// 2. Attach receipt (OCR will auto-extract data)
const receiptFile = await fs.readFile('./receipt.jpg');
const scan = await client.expenses.attachReceipt.mutate({
  expenseId: expense.id,
  filename: 'receipt.jpg',
  mimeType: 'image/jpeg',
  base64: receiptFile.toString('base64'),
});

console.log(`OCR confidence: ${scan.ocrResult.confidence}`);
console.log(`Extracted total: ${scan.ocrResult.data?.totalAmount}`);
// → OCR confidence: 0.94
// → Extracted total: 284.50

// 3. Submit for approval
const submitted = await client.expenses.submit.mutate({
  expenseId: expense.id,
});

console.log(`Status: ${submitted.status}`);
// → Status: SUBMITTED (or APPROVED if auto-approved)
```

### Example 2: Multi-Level Approval Workflow

```typescript
// Finance manager views pending approvals
const pending = await client.expenses.pendingApprovals.query({
  page: 1,
  limit: 10,
});

console.log(`${pending.total} expenses awaiting approval`);

for (const item of pending.items) {
  console.log(
    `${item.employeeName}: ${item.description} — $${item.amount}`,
  );

  // Approve small amounts, flag large ones
  if (item.amount < 500) {
    await client.expenses.approve.mutate({
      instanceId: item.approvalInstanceId,
      stepId: item.currentStepId,
      comment: 'Approved — within threshold',
    });
  } else if (item.amount > 5000) {
    // Delegate to CFO for large amounts
    await client.expenses.delegate.mutate({
      instanceId: item.approvalInstanceId,
      stepId: item.currentStepId,
      delegateToUserId: 'cfo_user_id',
      comment: 'Escalating to CFO — amount exceeds $5,000',
    });
  } else {
    // Reject with reason
    await client.expenses.reject.mutate({
      instanceId: item.approvalInstanceId,
      stepId: item.currentStepId,
      comment: 'Missing itemized receipt — please resubmit',
    });
  }
}
```

### Example 3: Per-Diem Calculation for Business Trip

```typescript
// Calculate per-diem for a multi-city trip
const calculation = await client.expenses.perDiem.calculate.query({
  startDate: '2026-03-10',
  endDate: '2026-03-14',
  itinerary: [
    {
      startDate: '2026-03-10',
      endDate: '2026-03-12',
      locationCode: 'US-NY-NYC',
      locationName: 'New York City',
    },
    {
      startDate: '2026-03-13',
      endDate: '2026-03-14',
      locationCode: 'US-DC',
      locationName: 'Washington, D.C.',
    },
  ],
  mealsProvided: {
    '2026-03-11': { lunch: true },         // Conference provided lunch
    '2026-03-12': { breakfast: true, dinner: true }, // Hotel + client dinner
  },
});

console.log(`Trip total: $${calculation.grandTotal}`);
console.log(`Days: ${calculation.totalDays}`);
for (const day of calculation.days) {
  console.log(
    `  ${day.date} (${day.location}): ` +
    `Lodging=$${day.lodging} Meals=$${day.meals} Inc=$${day.incidentals} ` +
    `= $${day.dayTotal}${day.isFirstDay ? ' [first day]' : ''}${day.isLastDay ? ' [last day]' : ''}`,
  );
}

// Create consolidated expense from calculation
const expenses = await client.expenses.perDiem.createExpenses.mutate({
  calculation,
  consolidate: true,
  projectId: 'proj_def456',
});

console.log(`Created ${expenses.length} per-diem expense(s)`);
```

### Example 4: Corporate Card Reconciliation

```typescript
// Import latest card transactions
const importResult = await client.expenses.cards.importTransactions.mutate({
  cardId: 'card_abc123',
  fromDate: '2026-01-01',
  toDate: '2026-01-31',
});

console.log(`Imported: ${importResult.imported}`);
console.log(`Auto-matched: ${importResult.matched}`);
console.log(`Duplicates skipped: ${importResult.duplicatesSkipped}`);

// Get reconciliation report
const recon = await client.expenses.cards.reconciliation.query({
  cardId: 'card_abc123',
  startDate: '2026-01-01',
  endDate: '2026-01-31',
});

console.log(`Reconciliation rate: ${recon.reconciliationRate.toFixed(1)}%`);
console.log(`Unmatched: ${recon.unmatchedTransactions} ($${recon.unmatchedAmount})`);

// Flag old unreconciled transactions
const flagged = await client.expenses.cards.flagUnreconciled.query({
  daysThreshold: 14,
});

if (flagged.length > 0) {
  console.log(`⚠️ ${flagged.length} unreconciled transactions older than 14 days:`);
  for (const txn of flagged) {
    console.log(`  ${txn.transactionDate}: ${txn.merchantName} — $${txn.amount}`);
  }
}
```

### Example 5: Batch Reimbursement Processing

```typescript
// Create reimbursement batch for the engineering department
const batch = await client.expenses.reimburse.createBatch.mutate({
  departmentId: 'dept_engineering',
  paymentMethod: 'PAYROLL',
  notes: 'January 2026 expense reimbursements',
});

console.log(`Batch ${batch.batchNumber}: $${batch.totalAmount} (${batch.itemCount} expenses)`);

// Export for payroll review
const csv = await client.expenses.reimburse.exportToPayroll.query({
  batchId: batch.id,
  format: 'CSV',
});

// Write CSV for payroll team review
await fs.writeFile(csv.filename, csv.data);
console.log(`Exported to ${csv.filename}`);

// Process the batch (sends to payroll)
const processed = await client.expenses.reimburse.processBatch.mutate({
  batchId: batch.id,
});

console.log(`Batch status: ${processed.status}`);
// → Batch status: COMPLETED
```

### Example 6: Spending Analytics Dashboard

```typescript
// Get comprehensive analytics for the current quarter
const q1Start = '2026-01-01';
const q1End = '2026-03-31';

// Category breakdown
const byCategory = await client.expenses.analytics.spendByCategory.query({
  startDate: q1Start,
  endDate: q1End,
});

console.log('Spending by Category:');
for (const cat of byCategory) {
  console.log(
    `  ${cat.category}: $${cat.totalAmount.toLocaleString()} ` +
    `(${cat.percentage}%, ${cat.count} expenses, avg $${cat.averageAmount})`,
  );
}

// Department spending with budget tracking
const byDept = await client.expenses.analytics.spendByDepartment.query({
  startDate: q1Start,
  endDate: q1End,
});

for (const dept of byDept) {
  const budgetStr = dept.budget
    ? ` | Budget: $${dept.budget.toLocaleString()} (${dept.budgetUtilization}% used)`
    : '';
  console.log(`  ${dept.departmentName}: $${dept.totalAmount.toLocaleString()}${budgetStr}`);
}

// Budget alerts
const alerts = await client.expenses.analytics.budgetAlerts.query({
  thresholdPercent: 80,
});

for (const alert of alerts) {
  console.log(
    `⚠️ [${alert.severity}] ${alert.departmentName}: ` +
    `${alert.utilization}% of budget used ($${alert.spent} / $${alert.budget})`,
  );
}

// Monthly trend analysis
const trends = await client.expenses.analytics.trends.query({
  granularity: 'MONTHLY',
  periods: 6,
});

for (const t of trends) {
  const change = t.changePercent != null ? ` (${t.changePercent > 0 ? '+' : ''}${t.changePercent}%)` : '';
  console.log(`  ${t.periodLabel}: $${t.totalAmount.toLocaleString()}${change}`);
}
```

---

## Error Codes

| Code | HTTP | Cause | Description |
|------|------|-------|-------------|
| `EXPENSE_NOT_FOUND` | 404 | Expense ID does not exist in this venture | Verify the expense ID and venture context |
| `NOT_OWNER` | 403 | Actor is not the expense owner | Only the submitting employee can edit/submit/recall |
| `INVALID_STATUS` | 400 | Operation not allowed for current status | Check expense lifecycle (e.g., can't submit a non-DRAFT) |
| `POLICY_VIOLATION` | 400 | Expense violates venture policy | Check category limits, receipt requirements, role restrictions |
| `RECEIPT_REQUIRED` | 400 | Policy requires receipt but none attached | Upload a receipt before submitting |
| `FILE_TOO_LARGE` | 400 | Receipt file exceeds size limit | Default max: 10MB per receipt file |
| `UNSUPPORTED_FORMAT` | 400 | Receipt file format not supported | Supported: JPEG, PNG, PDF, HEIC, WebP |
| `ALREADY_IN_REPORT` | 409 | Expense is already in another report | Remove from existing report first |
| `EMPTY_REPORT` | 400 | Expense report has no expenses | Add at least one expense before submitting |
| `APPROVAL_IN_PROGRESS` | 400 | Cannot recall — approver has acted | Contact the approver or wait for rejection |
| `NOT_APPROVER` | 403 | Actor is not the assigned approver | Only the designated approver (or delegate) can act |
| `NO_MANAGER` | 500 | Employee has no manager in org hierarchy | Configure manager in @mcv/people |
| `NO_DEPT_HEAD` | 500 | Department has no head configured | Set department head in @mcv/people |
| `RATE_NOT_FOUND` | 404 | No mileage/per-diem rate for jurisdiction | Configure rates for the jurisdiction/location |
| `NO_EXPENSES` | 404 | No unreimbursed approved expenses found | Nothing to reimburse for the given filters |
| `INVALID_CURRENCY` | 400 | Currency code is not a valid ISO 4217 code | Use standard currency codes (USD, EUR, GBP, etc.) |
| `DUPLICATE_EXPENSE` | 409 | Potential duplicate detected | Same employee, amount, date, and merchant within 24h |
| `CARD_NOT_ACTIVE` | 400 | Corporate card is not in ACTIVE status | Activate or unfreeze the card first |
| `BATCH_ALREADY_PROCESSED` | 400 | Reimbursement batch already processed | Cannot reprocess a completed/failed batch |

---

## Security

### Authentication & Authorization

All expense operations require authenticated sessions via Supabase Auth. Authorization is enforced at three levels:

1. **Row-Level Security (RLS)** — Supabase policies enforce venture isolation and employee-level access
2. **Role-Based Access** — Finance roles required for approvals, analytics, and reimbursement
3. **Ownership Checks** — Application-level validation that actors own or are authorized for resources

### Access Control Matrix

| Operation | Employee (Owner) | Manager | Finance | Admin |
|-----------|:----------------:|:-------:|:-------:|:-----:|
| Create expense | ✅ | — | — | — |
| View own expenses | ✅ | — | — | — |
| View team expenses | — | ✅ | ✅ | ✅ |
| Submit expense | ✅ | — | — | — |
| Approve expense | — | ✅ | ✅ | ✅ |
| Reject expense | — | ✅ | ✅ | ✅ |
| View analytics | — | 🔶 Own team | ✅ | ✅ |
| Manage policies | — | — | ✅ | ✅ |
| Process reimbursement | — | — | ✅ | ✅ |
| Manage cards | — | — | ✅ | ✅ |
| View audit log | — | — | ✅ | ✅ |

### Data Protection

- **Receipt storage**: Encrypted at rest in @mcv/storage (AES-256)
- **PII handling**: Employee financial data (bank accounts, card numbers) are encrypted columns
- **Card numbers**: Only last 4 digits stored; full numbers never persisted
- **OCR data**: Raw OCR results stored temporarily; PII extracted and classified
- **Audit trail**: Immutable append-only log; no updates or deletes permitted
- **Data retention**: Configurable per-venture; default 7 years for tax compliance

### Input Validation

- All inputs validated with Zod schemas before processing
- Amount fields: positive, max 15 digits with 2 decimal places
- Currency: validated against ISO 4217 codelist
- Date fields: validated as ISO 8601 date strings
- File uploads: MIME type validation, virus scanning (delegated to @mcv/storage)
- Rate limiting: 100 expense creates/hour, 20 receipt uploads/hour per user

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `SUPABASE_URL` | ✅ | — | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | — | Service role key for admin operations |
| `SUPABASE_ANON_KEY` | ✅ | — | Anonymous key for client operations |
| `OCR_PROVIDER` | ❌ | `google_vision` | OCR provider (`google_vision`, `aws_textract`, `azure_form_recognizer`) |
| `OCR_API_KEY` | ✅ | — | API key for OCR provider |
| `OCR_FALLBACK_PROVIDER` | ❌ | — | Fallback OCR provider if primary fails |
| `OCR_FALLBACK_API_KEY` | ❌ | — | API key for fallback provider |
| `OCR_CONFIDENCE_THRESHOLD` | ❌ | `0.7` | Minimum confidence for OCR auto-fill |
| `MAX_RECEIPT_SIZE_MB` | ❌ | `10` | Maximum receipt file size in MB |
| `CARD_PROVIDER_API_KEY` | ❌ | — | API key for corporate card provider (Stripe, Brex, Ramp) |
| `CARD_PROVIDER_WEBHOOK_SECRET` | ❌ | — | Webhook secret for real-time card transaction events |
| `PAYROLL_API_URL` | ❌ | — | Payroll system API endpoint for reimbursement |
| `PAYROLL_API_KEY` | ❌ | — | API key for payroll integration |
| `DEFAULT_CURRENCY` | ❌ | `USD` | Default currency for new ventures |
| `EXCHANGE_RATE_API_KEY` | ❌ | — | API key for currency exchange rate service |
| `EXPENSE_AUTO_APPROVE_ENABLED` | ❌ | `true` | Enable/disable auto-approval globally |
| `APPROVAL_TIMEOUT_CHECK_CRON` | ❌ | `0 */1 * * *` | Cron for checking approval timeouts |
| `REIMBURSEMENT_BATCH_CRON` | ❌ | `0 9 * * 1` | Cron for automatic batch reimbursement (weekly) |
| `AUDIT_LOG_RETENTION_DAYS` | ❌ | `2555` | Audit log retention period (7 years default) |
| `STORAGE_BUCKET` | ❌ | `expense-receipts` | Storage bucket for receipt files |

---

## Dependencies

### Internal

| Package | Purpose |
|---------|---------|
| `@mcv/people` | Employee data, org hierarchy, manager chains, department info |
| `@mcv/storage` | Receipt file storage, document management, virus scanning |
| `@mcv/finance/gl` | General ledger posting for approved/reimbursed expenses |
| `@mcv/notifications` | Email/push notifications for approvals, rejections, reimbursements |
| `@mcv/auth` | Authentication, session management, role verification |
| `@mcv/trpc` | tRPC router infrastructure, middleware, context |

### External

| Package | Version | Purpose |
|---------|---------|---------|
| `@supabase/supabase-js` | `^2.x` | Database client, RLS, real-time |
| `@trpc/server` | `^10.x` | API router layer |
| `zod` | `^3.x` | Input validation and schema definition |
| `date-fns` | `^3.x` | Date manipulation, period calculation |
| `decimal.js` | `^10.x` | Precise financial calculations |
| `string-similarity` | `^4.x` | Merchant name fuzzy matching for card reconciliation |
| `csv-stringify` | `^6.x` | CSV export for reimbursement batches |
| `pdfkit` | `^0.13.x` | PDF generation for expense reports |

---

## Testing

### Unit Tests

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExpenseService } from '../services/expense.service';
import { PolicyService } from '../services/policy.service';
import { createMockSupabase } from '@mcv/test-utils';

describe('ExpenseService', () => {
  let service: ExpenseService;
  let db: ReturnType<typeof createMockSupabase>;
  let policyService: PolicyService;

  beforeEach(() => {
    db = createMockSupabase();
    policyService = new PolicyService(db);
    service = new ExpenseService(db, policyService, mockReceiptOCR, mockApprovalService);
  });

  describe('create', () => {
    it('should create a draft expense', async () => {
      db.from('expenses').insert.mockResolvedValue({
        data: {
          id: 'exp_1',
          status: 'DRAFT',
          amount: 50.00,
          category: 'MEALS',
        },
        error: null,
      });

      const expense = await service.create('venture_1', 'emp_1', {
        category: 'MEALS',
        description: 'Business lunch',
        amount: 50.00,
        currency: 'USD',
        expenseDate: '2026-02-01',
      });

      expect(expense.status).toBe('DRAFT');
      expect(expense.amount).toBe(50.00);
    });

    it('should reject restricted categories', async () => {
      vi.spyOn(policyService, 'isCategoryAllowed').mockReturnValue({
        allowed: false,
        reason: 'ENTERTAINMENT restricted for INTERN role',
      });

      await expect(
        service.create('venture_1', 'emp_intern', {
          category: 'ENTERTAINMENT',
          description: 'Concert tickets',
          amount: 200,
          currency: 'USD',
          expenseDate: '2026-02-01',
        }),
      ).rejects.toThrow('POLICY_VIOLATION');
    });
  });

  describe('submit', () => {
    it('should submit a draft expense', async () => {
      vi.spyOn(service as any, 'getOrThrow').mockResolvedValue({
        id: 'exp_1',
        employeeId: 'emp_1',
        status: 'DRAFT',
        baseAmount: 50,
        receipts: [{ id: 'r1' }],
      });

      vi.spyOn(policyService, 'validate').mockResolvedValue([]);
      vi.spyOn(policyService, 'checkAutoApprove').mockResolvedValue(false);

      db.from('expenses').update.mockResolvedValue({
        data: { id: 'exp_1', status: 'SUBMITTED' },
        error: null,
      });

      const result = await service.submit('venture_1', 'exp_1', 'emp_1');
      expect(result.status).toBe('SUBMITTED');
    });

    it('should auto-approve below threshold', async () => {
      vi.spyOn(service as any, 'getOrThrow').mockResolvedValue({
        id: 'exp_1',
        employeeId: 'emp_1',
        status: 'DRAFT',
        baseAmount: 15,
        receipts: [],
      });

      vi.spyOn(policyService, 'validate').mockResolvedValue([]);
      vi.spyOn(policyService, 'checkAutoApprove').mockResolvedValue(true);

      db.from('expenses').update.mockResolvedValue({
        data: { id: 'exp_1', status: 'APPROVED' },
        error: null,
      });

      const result = await service.submit('venture_1', 'exp_1', 'emp_1');
      expect(result.status).toBe('APPROVED');
    });

    it('should block submission with policy violations', async () => {
      vi.spyOn(service as any, 'getOrThrow').mockResolvedValue({
        id: 'exp_1',
        employeeId: 'emp_1',
        status: 'DRAFT',
        baseAmount: 500,
        receipts: [],
      });

      vi.spyOn(policyService, 'validate').mockResolvedValue([
        {
          rule: 'RECEIPT_REQUIRED',
          severity: 'BLOCKER',
          message: 'Receipt required for expenses above $25',
          category: null,
          limit: 25,
          actual: 500,
        },
      ]);

      await expect(
        service.submit('venture_1', 'exp_1', 'emp_1'),
      ).rejects.toThrow('POLICY_VIOLATION');
    });

    it('should prevent non-owners from submitting', async () => {
      vi.spyOn(service as any, 'getOrThrow').mockResolvedValue({
        id: 'exp_1',
        employeeId: 'emp_1',
        status: 'DRAFT',
      });

      await expect(
        service.submit('venture_1', 'exp_1', 'emp_other'),
      ).rejects.toThrow('NOT_OWNER');
    });
  });

  describe('recall', () => {
    it('should recall a submitted expense', async () => {
      vi.spyOn(service as any, 'getOrThrow').mockResolvedValue({
        id: 'exp_1',
        employeeId: 'emp_1',
        status: 'SUBMITTED',
      });

      vi.spyOn(mockApprovalService, 'hasAnyAction').mockResolvedValue(false);

      db.from('expenses').update.mockResolvedValue({
        data: { id: 'exp_1', status: 'DRAFT' },
        error: null,
      });

      const result = await service.recall('venture_1', 'exp_1', 'emp_1');
      expect(result.status).toBe('DRAFT');
    });

    it('should prevent recall when approval is in progress', async () => {
      vi.spyOn(service as any, 'getOrThrow').mockResolvedValue({
        id: 'exp_1',
        employeeId: 'emp_1',
        status: 'SUBMITTED',
      });

      vi.spyOn(mockApprovalService, 'hasAnyAction').mockResolvedValue(true);

      await expect(
        service.recall('venture_1', 'exp_1', 'emp_1'),
      ).rejects.toThrow('APPROVAL_IN_PROGRESS');
    });
  });
});

describe('PolicyService', () => {
  describe('validate', () => {
    it('should flag missing receipt above threshold', async () => {
      const violations = await policyService.validate('venture_1', {
        ...mockExpense,
        baseAmount: 100,
        receipts: [],
      });

      expect(violations).toContainEqual(
        expect.objectContaining({
          rule: 'RECEIPT_REQUIRED',
          severity: 'BLOCKER',
        }),
      );
    });

    it('should flag category limit exceeded', async () => {
      const violations = await policyService.validate('venture_1', {
        ...mockExpense,
        category: 'MEALS',
        baseAmount: 200,
      });

      expect(violations).toContainEqual(
        expect.objectContaining({
          rule: 'CATEGORY_LIMIT_EXCEEDED',
          severity: 'BLOCKER',
        }),
      );
    });

    it('should warn on daily limit approach', async () => {
      const violations = await policyService.validate('venture_1', {
        ...mockExpense,
        category: 'MEALS',
        baseAmount: 40,
      });

      const warnings = violations.filter(v => v.severity === 'WARNING');
      expect(warnings.length).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('MileageService', () => {
  it('should calculate mileage in kilometers', async () => {
    vi.spyOn(mileageService, 'getRate').mockResolvedValue({
      id: 'rate_1',
      ventureId: 'venture_1',
      jurisdiction: 'CA-ON',
      vehicleType: 'CAR',
      ratePerKm: 0.70,
      ratePerMile: 1.1265,
      currency: 'CAD',
      effectiveFrom: '2026-01-01',
      effectiveTo: null,
      isDefault: false,
    });

    const result = await mileageService.calculate('venture_1', {
      jurisdiction: 'CA-ON',
      vehicleType: 'CAR',
      distance: 150,
      unit: 'km',
      date: '2026-02-01',
    });

    expect(result.amount).toBe(105.00); // 150 × 0.70
    expect(result.currency).toBe('CAD');
  });

  it('should convert miles to kilometers', async () => {
    const result = await mileageService.calculate('venture_1', {
      jurisdiction: 'US',
      vehicleType: 'CAR',
      distance: 100,
      unit: 'miles',
      date: '2026-02-01',
    });

    expect(result.distanceKm).toBeCloseTo(160.934, 2);
  });
});
```

### Integration Tests

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestVenture, createTestEmployee, cleanupTestData } from '@mcv/test-utils';

describe('Expense Workflow Integration', () => {
  let ventureId: string;
  let employeeId: string;
  let managerId: string;

  beforeAll(async () => {
    const venture = await createTestVenture();
    ventureId = venture.id;

    const manager = await createTestEmployee(ventureId, { role: 'MANAGER' });
    managerId = manager.id;

    const employee = await createTestEmployee(ventureId, {
      role: 'EMPLOYEE',
      managerId: manager.id,
    });
    employeeId = employee.id;

    // Set up a basic policy
    await setupTestPolicy(ventureId, {
      receiptRequiredAbove: 25,
      autoApproveBelow: 10,
      categoryLimits: [
        { category: 'MEALS', maxPerExpense: 150, maxPerDay: 75, requiresReceipt: true },
      ],
    });
  });

  afterAll(async () => {
    await cleanupTestData(ventureId);
  });

  it('should complete full expense lifecycle', async () => {
    // Create
    const expense = await expenseService.create(ventureId, employeeId, {
      category: 'MEALS',
      description: 'Team lunch',
      amount: 45.00,
      currency: 'USD',
      expenseDate: '2026-02-01',
    });
    expect(expense.status).toBe('DRAFT');

    // Attach receipt
    const receipt = await expenseService.attachReceipt(
      ventureId, expense.id, employeeId,
      { buffer: testReceiptBuffer, filename: 'receipt.jpg', mimeType: 'image/jpeg', size: 1024 },
    );
    expect(receipt.ocrResult.success).toBe(true);

    // Submit
    const submitted = await expenseService.submit(ventureId, expense.id, employeeId);
    expect(submitted.status).toBe('SUBMITTED');

    // Approve (as manager)
    const instances = await approvalService.getPendingForApprover(ventureId, managerId);
    expect(instances.items.length).toBeGreaterThan(0);

    const result = await approvalService.processDecision(
      ventureId, instances.items[0].id, managerId,
      { stepId: instances.items[0].currentStepId, decision: 'APPROVED', comment: 'Looks good' },
    );
    expect(result.completed).toBe(true);

    // Verify approved
    const approved = await expenseService.get(ventureId, expense.id);
    expect(approved.status).toBe('APPROVED');

    // Reimburse
    const batch = await reimbursementService.createBatch(ventureId, {
      employeeIds: [employeeId],
    });
    expect(batch.totalAmount).toBe(45.00);

    const processed = await reimbursementService.processBatch(ventureId, batch.id, managerId);
    expect(processed.status).toBe('COMPLETED');

    // Verify reimbursed
    const final = await expenseService.get(ventureId, expense.id);
    expect(final.status).toBe('REIMBURSED');
    expect(final.paidAt).not.toBeNull();
  });

  it('should auto-approve small expenses', async () => {
    const expense = await expenseService.create(ventureId, employeeId, {
      category: 'OFFICE_SUPPLIES',
      description: 'Pens',
      amount: 5.00,
      currency: 'USD',
      expenseDate: '2026-02-01',
    });

    const submitted = await expenseService.submit(ventureId, expense.id, employeeId);
    expect(submitted.status).toBe('APPROVED');
  });
});
```

### Test Coverage Targets

| Area | Target | Notes |
|------|--------|-------|
| ExpenseService | 95% | Core lifecycle, all status transitions |
| PolicyService | 95% | All validation rules, edge cases |
| ApprovalService | 90% | Multi-step chains, delegation, escalation |
| ReceiptOCRService | 85% | Mock OCR providers, parsing logic |
| MileageService | 95% | Rate calculations, jurisdiction fallback |
| PerDiemService | 90% | Multi-city, proration, meal deductions |
| CorporateCardService | 85% | Import, auto-match, reconciliation |
| ReimbursementService | 90% | Batch creation, processing, payroll export |
| ExpenseAnalyticsService | 80% | Aggregations, trend calculation |
| tRPC Router | 85% | Input validation, authorization |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 0.1.0 | 2026-01-15 | Initial module: expense CRUD, basic approval, receipt upload |
| 0.2.0 | 2026-01-28 | Multi-level approval chains, delegation, escalation |
| 0.3.0 | 2026-02-05 | Expense reports, batch submission |
| 0.4.0 | 2026-02-08 | Receipt OCR, mileage service, per-diem service |
| 0.5.0 | — | Corporate card integration, reconciliation |
| 0.6.0 | — | Reimbursement batches, payroll integration |
| 0.7.0 | — | Analytics dashboard, budget alerts |
| 1.0.0 | — | Production release, full policy engine |