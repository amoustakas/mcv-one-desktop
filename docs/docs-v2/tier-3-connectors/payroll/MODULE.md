# @mcv/payroll — Payroll Connector Module

**Package:** `@mcv/payroll`  
**Classification:** Tier 3 — Connector  
**Source:** `packages/payroll/`  
**Version:** 1.0.0  
**Last Updated:** February 8, 2026  
**Status:** DESIGN DOCUMENT — Pre-implementation

---

## Purpose

Multi-provider payroll integration system supporting **ADP**, **Gusto**, and **Rippling** as first-class backends. Each MCV venture connects to its own payroll provider account, enabling unified employee management, payroll run processing, pay statement retrieval, time-off tracking, benefits enrollment, tax document generation, compensation management, and compliance reporting. The module abstracts provider-specific APIs behind a normalized interface so that business-tier modules (`@mcv/hr`, `@mcv/finance`, `@mcv/operations`) interact with a single, consistent payroll API regardless of the underlying provider.

**This is the single integration point for all payroll and HR data across the MCV ecosystem.**

### Why a Unified Payroll Connector?

Without this module, each MCV venture would need to build bespoke integrations with their payroll provider. This leads to fragmented employee data, inconsistent tax handling, duplicated compliance logic, and no cross-venture workforce analytics. The payroll module solves all of this:

1. **Single payroll API** — One interface for ADP, Gusto, and Rippling; swap providers without code changes
2. **Canonical data model** — Provider-specific employee, paystub, and tax data normalized into MCV types
3. **Real-time sync** — Webhooks + scheduled sync keep local cache fresh; no stale employee data
4. **Tax compliance** — Federal, state, and local tax withholding calculations with provider validation
5. **PII protection** — SSN, DOB, and address fields encrypted at rest with role-based access control
6. **Multi-venture isolation** — Each venture's payroll data is strictly scoped; no cross-contamination
7. **Audit trail** — Every payroll action (salary change, termination, PTO approval) logged immutably
8. **Time tracking integration** — Links `@mcv/db` time entries to payroll hours for billable/non-billable tracking

### Design Document Notice

> **This module does not yet have an implementation directory (`packages/payroll/`).** This document serves as the
> complete design specification, covering interfaces, database schemas, service contracts, security requirements,
> and integration patterns. Implementation will follow this spec. The only existing related schema is
> `time-entries.ts` in `@mcv/db`, which this module will consume for time tracking integration.

---

## Architecture

### System Context Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BUSINESS DOMAINS (Tier 5)                           │
│                @mcv/hr     @mcv/finance     @mcv/operations                 │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              @mcv/payroll                                   │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                     Server Services Layer                            │   │
│  │                                                                      │   │
│  │  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────┐     │   │
│  │  │ PayrollProvider  │  │ EmployeeService  │  │ PayrollRun      │     │   │
│  │  │ Service          │  │                  │  │ Service         │     │   │
│  │  │ • connect        │  │ • syncEmployees  │  │ • getRuns       │     │   │
│  │  │ • disconnect     │  │ • getEmployee    │  │ • getRun        │     │   │
│  │  │ • getStatus      │  │ • createEmployee │  │ • getPaystubs   │     │   │
│  │  │ • refreshToken   │  │ • updateEmployee │  │ • getPaystub    │     │   │
│  │  │ • getCapabilities│  │ • terminateEmp   │  │ • processRun    │     │   │
│  │  └─────────────────┘  └──────────────────┘  └─────────────────┘     │   │
│  │                                                                      │   │
│  │  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────┐     │   │
│  │  │ TimeOffService   │  │ BenefitsService  │  │ Compensation    │     │   │
│  │  │                  │  │                  │  │ Service         │     │   │
│  │  │ • getBalances    │  │ • getEnrollments │  │ • getHistory    │     │   │
│  │  │ • requestTimeOff │  │ • getBenefitPlan │  │ • updateSalary  │     │   │
│  │  │ • approveRequest │  │ • enrollEmployee │  │ • addBonus      │     │   │
│  │  │ • denyRequest    │  │ • disenroll      │  │ • getPayRates   │     │   │
│  │  │ • cancelRequest  │  │ • syncBenefits   │  │ • getEquity     │     │   │
│  │  │ • syncBalances   │  │ • getCosts       │  │ • syncComp      │     │   │
│  │  └─────────────────┘  └──────────────────┘  └─────────────────┘     │   │
│  │                                                                      │   │
│  │  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────┐     │   │
│  │  │ TaxDocService    │  │ DepartmentService│  │ OnboardingService│    │   │
│  │  │                  │  │                  │  │                  │    │   │
│  │  │ • getW2s         │  │ • syncDepts      │  │ • startOnboard  │    │   │
│  │  │ • get1099s       │  │ • getDepartment  │  │ • getStatus     │    │   │
│  │  │ • getTaxForms    │  │ • getTeamMembers │  │ • completeTask  │    │   │
│  │  │ • downloadPdf    │  │ • getOrgChart    │  │ • startOffboard │    │   │
│  │  │ • getYtdSummary  │  │ • updateDept     │  │ • getChecklist  │    │   │
│  │  └─────────────────┘  └──────────────────┘  └─────────────────┘     │   │
│  │                                                                      │   │
│  │  ┌─────────────────┐  ┌──────────────────┐                           │   │
│  │  │ ComplianceService│  │ WebhookHandler   │                           │   │
│  │  │                  │  │ Service          │                           │   │
│  │  │ • getDeadlines   │  │ • handleEvent    │                           │   │
│  │  │ • getTaxFilings  │  │ • routeEvents    │                           │   │
│  │  │ • getAuditTrail  │  │ • syncState      │                           │   │
│  │  │ • getFLSAStatus  │  │ • verifySignature│                           │   │
│  │  └─────────────────┘  └──────────────────┘                           │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                     Provider Adapter Layer                           │   │
│  │                                                                      │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │   │
│  │  │ ADPAdapter        │  │ GustoAdapter     │  │ RipplingAdapter  │   │   │
│  │  │                   │  │                  │  │                  │   │   │
│  │  │ • OAuth 2.0       │  │ • OAuth 2.0 PKCE │  │ • OAuth 2.0      │   │   │
│  │  │ • REST API v2     │  │ • REST API v2024 │  │ • GraphQL + REST │   │   │
│  │  │ • Event Notif.    │  │ • Webhooks       │  │ • Webhooks       │   │   │
│  │  │ • Rate: 50/min    │  │ • Rate: 100/min  │  │ • Rate: 200/min  │   │   │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │               PayrollProviderAdapter (interface)              │   │   │
│  │  │                                                               │   │   │
│  │  │  Implemented by each provider; normalizes responses into      │   │   │
│  │  │  canonical @mcv/payroll types. Handles auth refresh,          │   │   │
│  │  │  pagination, rate limiting, and error mapping.                │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                      Client Hooks Layer (React)                      │   │
│  │                                                                      │   │
│  │  useEmployees()  usePayrollRuns()  useTimeOff()  useBenefits()       │   │
│  │  useCompensation()  useTaxDocs()  useOnboarding()  useOrgChart()     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                      Middleware & Utilities                           │   │
│  │                                                                      │   │
│  │  verifyPayrollWebhook()  getProviderClient()  getPayrollConfig()     │   │
│  │  normalizeEmployee()  normalizePaystub()  calculateGrossToNet()      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  @mcv/db (PostgreSQL)  │  @mcv/secrets (GCP Vault)  │  ADP / Gusto / Rip. │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Payroll Processing Pipeline

This diagram shows the end-to-end flow from time tracking through disbursement:

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                        PAYROLL PROCESSING PIPELINE                                   │
│                                                                                      │
│  ┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │  1. TIME     │     │  2. PAYROLL  │     │  3. TAX      │     │  4. DISBURSE │    │
│  │  TRACKING    │────▶│  CALCULATION │────▶│  WITHHOLDING │────▶│  MENT        │    │
│  │             │     │              │     │              │     │              │    │
│  └──────┬──────┘     └──────┬───────┘     └──────┬───────┘     └──────┬───────┘    │
│         │                   │                    │                    │             │
│         ▼                   ▼                    ▼                    ▼             │
│  ┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │ • Collect    │     │ • Base salary│     │ • Federal    │     │ • Net pay    │    │
│  │   time       │     │ • Hourly ×   │     │   income tax │     │   direct     │    │
│  │   entries    │     │   hours      │     │ • State      │     │   deposit    │    │
│  │ • Approve    │     │ • Overtime   │     │   income tax │     │ • Employer   │    │
│  │   timesheets │     │   calc (1.5×)│     │ • Local tax  │     │   tax        │    │
│  │ • Link to    │     │ • PTO/       │     │ • FICA:      │     │   remittance │    │
│  │   pay period │     │   holiday pay│     │   - SS 6.2%  │     │ • Generate   │    │
│  │ • Validate   │     │ • Bonuses    │     │   - Med 1.45%│     │   pay stubs  │    │
│  │   billable   │     │ • Commission │     │ • FUTA/SUTA  │     │ • Update     │    │
│  │   hours      │     │ • Reimburse  │     │ • SDI        │     │   YTD totals │    │
│  └─────────────┘     └──────────────┘     └──────────────┘     └──────────────┘    │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐     │
│  │                         5. POST-PAYROLL                                      │     │
│  │                                                                              │     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │     │
│  │  │ Deduct   │  │ Employer │  │ Record   │  │ Generate │  │ Emit     │      │     │
│  │  │ employee │  │ matches  │  │ journal  │  │ tax      │  │ audit    │      │     │
│  │  │ benefits │  │ (401k,   │  │ entries  │  │ filings  │  │ events   │      │     │
│  │  │ premiums │  │ health)  │  │ to GL    │  │ (941,    │  │ for all  │      │     │
│  │  │ & 401(k) │  │          │  │          │  │ W-2)     │  │ changes  │      │     │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘      │     │
│  └─────────────────────────────────────────────────────────────────────────────┘     │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐     │
│  │                      GROSS-TO-NET BREAKDOWN                                  │     │
│  │                                                                              │     │
│  │  Gross Pay                                                                   │     │
│  │    ├── Regular Pay (salary ÷ periods, or hourly × hours)                     │     │
│  │    ├── Overtime Pay (1.5× rate × OT hours)                                   │     │
│  │    ├── Holiday / PTO Pay                                                     │     │
│  │    ├── Bonus Pay                                                             │     │
│  │    └── Commission / Other Earnings                                           │     │
│  │                                                                              │     │
│  │  − Employee Tax Withholdings                                                 │     │
│  │    ├── Federal Income Tax (IRS tables, W-4 elections)                        │     │
│  │    ├── State Income Tax (state-specific rates)                               │     │
│  │    ├── Local Income Tax (where applicable)                                   │     │
│  │    ├── Social Security (6.2% up to $176,100 for 2026)                       │     │
│  │    ├── Medicare (1.45% + 0.9% Additional Medicare above $200k)              │     │
│  │    └── Other (SDI, SUI employee share, etc.)                                │     │
│  │                                                                              │     │
│  │  − Employee Deductions (pre-tax and post-tax)                               │     │
│  │    ├── Medical / Dental / Vision premiums                                    │     │
│  │    ├── 401(k) / 403(b) employee contribution                               │     │
│  │    ├── HSA / FSA contribution                                               │     │
│  │    ├── Life / Disability insurance                                          │     │
│  │    └── Other deductions (garnishments, union dues, etc.)                    │     │
│  │                                                                              │     │
│  │  + Reimbursements (non-taxable)                                             │     │
│  │    └── Expense reimbursements, mileage, etc.                                │     │
│  │                                                                              │     │
│  │  = Net Pay (amount deposited)                                               │     │
│  │                                                                              │     │
│  │  Employer Obligations (not deducted from employee, separate remittance):    │     │
│  │    ├── Employer Social Security (6.2%)                                      │     │
│  │    ├── Employer Medicare (1.45%)                                            │     │
│  │    ├── FUTA (6.0% on first $7,000, offset by SUTA credit)                  │     │
│  │    ├── SUTA (state-specific rate and wage base)                             │     │
│  │    ├── Employer 401(k) match                                                │     │
│  │    └── Employer health insurance contribution                               │     │
│  └─────────────────────────────────────────────────────────────────────────────┘     │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

### Time Entry Integration

This module consumes time entries from `@mcv/db` (see `packages/db/src/schema/time-entries.ts`):

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  @mcv/db          │     │  @mcv/payroll     │     │  Provider API     │
│  time_entries     │────▶│  PayrollRun       │────▶│  (ADP/Gusto/      │
│                   │     │  Service          │     │   Rippling)       │
│  • startedAt      │     │                   │     │                   │
│  • endedAt        │     │  Aggregates hours │     │  Submits hours    │
│  • durationMinutes│     │  by employee &    │     │  as part of       │
│  • isBillable     │     │  pay period.      │     │  payroll run.     │
│  • isApproved     │     │  Only approved    │     │                   │
│  • userId         │     │  entries counted. │     │                   │
│  • category       │     │                   │     │                   │
└──────────────────┘     └──────────────────┘     └──────────────────┘
```

---

## Dependencies

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `zod` | `^3.22` | Runtime validation for provider responses and inputs |
| `date-fns` | `^3.x` | Pay period calculations, date arithmetic, formatting |
| `decimal.js` | `^10.x` | Precise monetary calculations (avoids floating-point errors) |
| `crypto` | built-in | HMAC-SHA256 webhook signature verification |
| `react` | `^18.x` | Client-side hooks for admin UI |

### Internal Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@mcv/db` | `workspace:*` | Database connection, Drizzle ORM, time_entries schema |
| `@mcv/secrets` | `workspace:*` | GCP Secret Manager for provider OAuth credentials |
| `@mcv/oauth` | `workspace:*` | OAuth 2.0 flow management for ADP/Gusto/Rippling |
| `@mcv/kernel` | `workspace:*` | UUID generation, timestamps, base types |
| `@mcv/fabric/events` | `workspace:*` | Audit event emission |

### Dependency Flow

```
@mcv/kernel (Tier 0)
    ↑
@mcv/fabric/events (Tier 1)
    ↑
@mcv/db (Tier 2)   ──── time_entries schema
    ↑
@mcv/secrets (Tier 2)
    ↑
@mcv/oauth (Tier 2.5)
    ↑
@mcv/payroll (Tier 3)  ← THIS MODULE
    ↑
@mcv/hr (Tier 5)           — employee management UI
@mcv/finance (Tier 5)      — payroll cost reporting
@mcv/operations (Tier 5)   — workforce analytics
```

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// PROVIDER MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

export {
  connectProvider,             // Connect venture to payroll provider (OAuth)
  disconnectProvider,          // Disconnect and revoke tokens
  getProviderStatus,           // Provider connection health check
  refreshProviderToken,        // Force token refresh
  getProviderCapabilities,     // Query what this provider supports
} from './server/services/provider-service';

// ═══════════════════════════════════════════════════════════════════════════════
// EMPLOYEE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

export {
  syncEmployees,               // Full/incremental employee sync from provider
  getEmployee,                 // Get single employee with full details
  getEmployees,                // List employees with filters + pagination
  createEmployee,              // Create employee in provider + local DB
  updateEmployee,              // Update employee details
  terminateEmployee,           // Process employee termination
  rehireEmployee,              // Rehire previously terminated employee
} from './server/services/employee-service';

// ═══════════════════════════════════════════════════════════════════════════════
// PAYROLL PROCESSING
// ═══════════════════════════════════════════════════════════════════════════════

export {
  getPayrollRuns,              // List payroll runs with filters
  getPayrollRun,               // Get single payroll run details
  getPaystubs,                 // Get all paystubs for a run
  getPaystub,                  // Get individual paystub
  getEmployeePaystubs,         // Get all paystubs for an employee
  processPayrollRun,           // Initiate payroll processing
  calculatePayroll,            // Preview payroll before processing
  getPayDates,                 // Get upcoming pay dates
  aggregateTimeEntries,        // Aggregate time entries for a pay period
} from './server/services/payroll-run-service';

// ═══════════════════════════════════════════════════════════════════════════════
// TIME OFF / PTO
// ═══════════════════════════════════════════════════════════════════════════════

export {
  syncTimeOff,                 // Sync time-off balances and requests
  getTimeOffBalances,          // Get employee PTO balances
  getTimeOffRequests,          // List requests with filters
  requestTimeOff,              // Submit new time-off request
  approveTimeOffRequest,       // Manager approves request
  denyTimeOffRequest,          // Manager denies request
  cancelTimeOffRequest,        // Employee cancels own request
  getTimeOffPolicies,          // Get company time-off policies
} from './server/services/timeoff-service';

// ═══════════════════════════════════════════════════════════════════════════════
// BENEFITS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  syncBenefits,                // Sync benefit plans and enrollments
  getBenefitPlans,             // List available benefit plans
  getBenefitPlan,              // Get plan details with eligibility rules
  getEnrollments,              // Get employee benefit enrollments
  enrollEmployee,              // Enroll employee in benefit plan
  disenrollEmployee,           // Remove employee from benefit plan
  getBenefitsCosts,            // Get employer + employee cost breakdown
  getOpenEnrollmentWindow,     // Get current enrollment period info
} from './server/services/benefits-service';

// ═══════════════════════════════════════════════════════════════════════════════
// COMPENSATION
// ═══════════════════════════════════════════════════════════════════════════════

export {
  getCompensationHistory,      // Full compensation timeline for employee
  updateSalary,                // Change salary (with effective date)
  addBonus,                    // Schedule one-time bonus payment
  getPayRates,                 // Get current pay rates (hourly/salary)
  getEquityGrants,             // Get stock/option grants (Rippling)
  syncCompensation,            // Sync compensation data from provider
} from './server/services/compensation-service';

// ═══════════════════════════════════════════════════════════════════════════════
// TAX DOCUMENTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  getW2s,                      // Get W-2 forms for tax year
  get1099s,                    // Get 1099 forms for contractors
  getTaxForms,                 // Generic tax form query
  downloadTaxDocument,         // Download PDF of tax document
  getYtdTaxSummary,            // Year-to-date tax withholding summary
  getTaxFilingDeadlines,       // Upcoming tax filing deadlines
} from './server/services/tax-doc-service';

// ═══════════════════════════════════════════════════════════════════════════════
// DEPARTMENTS & ORG STRUCTURE
// ═══════════════════════════════════════════════════════════════════════════════

export {
  syncDepartments,             // Sync department hierarchy from provider
  getDepartments,              // List departments
  getDepartment,               // Get department details
  getTeamMembers,              // Get employees in department
  getOrgChart,                 // Build org chart tree structure
  updateDepartment,            // Update department metadata
} from './server/services/department-service';

// ═══════════════════════════════════════════════════════════════════════════════
// ONBOARDING & OFFBOARDING
// ═══════════════════════════════════════════════════════════════════════════════

export {
  startOnboarding,             // Initiate new employee onboarding
  getOnboardingStatus,         // Check onboarding progress
  completeOnboardingTask,      // Mark onboarding task complete
  startOffboarding,            // Initiate employee offboarding
  getOffboardingChecklist,     // Get remaining offboarding tasks
} from './server/services/onboarding-service';

// ═══════════════════════════════════════════════════════════════════════════════
// COMPLIANCE & REPORTING
// ═══════════════════════════════════════════════════════════════════════════════

export {
  getComplianceDeadlines,      // Upcoming compliance deadlines
  getTaxFilings,               // Tax filing history and status
  getAuditTrail,               // Audit log for payroll changes
  getFLSAClassifications,      // Employee exempt/non-exempt status
  getNewHireReport,            // New hire reporting for state compliance
  getPayrollSummaryReport,     // Aggregate payroll summary
} from './server/services/compliance-service';

// ═══════════════════════════════════════════════════════════════════════════════
// WEBHOOK HANDLING
// ═══════════════════════════════════════════════════════════════════════════════

export {
  handlePayrollWebhook,        // Central webhook event router
  verifyPayrollWebhook,        // Signature verification
} from './server/services/webhook-handler-service';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT HOOKS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { useEmployees } from './client/hooks/use-employees';
export { usePayrollRuns } from './client/hooks/use-payroll-runs';
export { useTimeOff } from './client/hooks/use-time-off';
export { useBenefits } from './client/hooks/use-benefits';
export { useCompensation } from './client/hooks/use-compensation';
export { useTaxDocs } from './client/hooks/use-tax-docs';
export { useOnboarding } from './client/hooks/use-onboarding';
export { useOrgChart } from './client/hooks/use-org-chart';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT COMPONENTS (React)
// ═══════════════════════════════════════════════════════════════════════════════

export { EmployeeDirectory } from './client/components/employee-directory';
export { PayrollRunSummary } from './client/components/payroll-run-summary';
export { PaystubViewer } from './client/components/paystub-viewer';
export { TimeOffCalendar } from './client/components/time-off-calendar';
export { BenefitsEnrollment } from './client/components/benefits-enrollment';
export { OrgChartTree } from './client/components/org-chart-tree';
export { CompensationTimeline } from './client/components/compensation-timeline';
export { TaxDocumentList } from './client/components/tax-document-list';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  PAYROLL_PROVIDERS,
  EMPLOYMENT_TYPES,
  PAY_FREQUENCIES,
  FLSA_CLASSIFICATIONS,
  TIME_OFF_TYPES,
  BENEFIT_CATEGORIES,
  TAX_FORM_TYPES,
  ONBOARDING_TASK_TYPES,
  PAYROLL_SYNC_INTERVALS,
  TAX_RATES_2026,
} from './constants';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  // Provider types
  PayrollProvider,
  PayrollProviderConfig,
  ProviderCapabilities,
  ProviderConnectionStatus,

  // Employee types
  Employee,
  EmployeeInput,
  EmployeeUpdateInput,
  EmployeeTerminationInput,
  EmployeeFilters,
  EmploymentType,
  EmploymentStatus,

  // Payroll types
  PayrollRun,
  PayrollRunStatus,
  Paystub,
  PaystubLineItem,
  PayFrequency,
  PayPeriod,
  PayDate,

  // Time off types
  TimeOffBalance,
  TimeOffRequest,
  TimeOffRequestInput,
  TimeOffRequestStatus,
  TimeOffPolicy,
  TimeOffType,

  // Benefits types
  BenefitPlan,
  BenefitEnrollment,
  BenefitCategory,
  BenefitCost,
  EnrollmentWindow,

  // Compensation types
  CompensationRecord,
  SalaryUpdateInput,
  BonusInput,
  PayRate,
  EquityGrant,

  // Tax types
  TaxDocument,
  TaxFormType,
  TaxWithholding,
  YtdTaxSummary,
  TaxFilingDeadline,

  // Department types
  Department,
  OrgChartNode,

  // Onboarding types
  OnboardingStatus,
  OnboardingTask,
  OffboardingChecklist,

  // Compliance types
  ComplianceDeadline,
  TaxFiling,
  AuditEntry,
  FLSAClassification,
  NewHireReport,
  PayrollSummaryReport,

  // Webhook types
  PayrollWebhookEvent,
  PayrollWebhookPayload,

  // Sync types
  SyncResult,
  SyncOptions,
} from './types';
```

---

## Provider Adapter Pattern

The module uses an adapter pattern to normalize provider-specific APIs into a canonical interface. Each provider implements `PayrollProviderAdapter`:

```typescript
interface PayrollProviderAdapter {
  // ═══════════════════════════════════════════════════════════════════════════
  // CONNECTION
  // ═══════════════════════════════════════════════════════════════════════════

  /** Provider identifier */
  readonly provider: PayrollProvider;

  /** Initialize connection with OAuth tokens */
  connect(config: ProviderAuthConfig): Promise<void>;

  /** Test connection health */
  healthCheck(): Promise<ProviderConnectionStatus>;

  /** Refresh expired OAuth token */
  refreshToken(): Promise<{ accessToken: string; expiresAt: Date }>;

  /** Get provider feature support matrix */
  getCapabilities(): ProviderCapabilities;

  // ═══════════════════════════════════════════════════════════════════════════
  // EMPLOYEES
  // ═══════════════════════════════════════════════════════════════════════════

  /** Fetch all employees (full sync) */
  fetchEmployees(options?: { since?: Date }): AsyncIterable<ProviderEmployee>;

  /** Fetch single employee by provider ID */
  fetchEmployee(providerEmployeeId: string): Promise<ProviderEmployee>;

  /** Create employee in provider system */
  createEmployee(input: ProviderEmployeeInput): Promise<ProviderEmployee>;

  /** Update employee in provider system */
  updateEmployee(
    providerEmployeeId: string,
    input: Partial<ProviderEmployeeInput>,
  ): Promise<ProviderEmployee>;

  /** Process termination in provider system */
  terminateEmployee(
    providerEmployeeId: string,
    input: ProviderTerminationInput,
  ): Promise<void>;

  // ═══════════════════════════════════════════════════════════════════════════
  // PAYROLL
  // ═══════════════════════════════════════════════════════════════════════════

  /** Fetch payroll runs for a date range */
  fetchPayrollRuns(options: { from: Date; to: Date }): Promise<ProviderPayrollRun[]>;

  /** Fetch paystubs for a specific payroll run */
  fetchPaystubs(providerRunId: string): Promise<ProviderPaystub[]>;

  /** Fetch paystubs for a specific employee */
  fetchEmployeePaystubs(
    providerEmployeeId: string,
    options?: { from?: Date; to?: Date },
  ): Promise<ProviderPaystub[]>;

  /** Process payroll run (Gusto: full; ADP: limited; Rippling: read-only) */
  processPayrollRun?(input: ProviderPayrollRunInput): Promise<ProviderPayrollRun>;

  /** Calculate/preview payroll before processing */
  calculatePayroll?(input: ProviderPayrollRunInput): Promise<ProviderPayrollPreview>;

  // ═══════════════════════════════════════════════════════════════════════════
  // TIME OFF
  // ═══════════════════════════════════════════════════════════════════════════

  /** Fetch time-off balances for employee */
  fetchTimeOffBalances(providerEmployeeId: string): Promise<ProviderTimeOffBalance[]>;

  /** Fetch time-off requests with filters */
  fetchTimeOffRequests(
    options?: { status?: string; from?: Date; to?: Date },
  ): Promise<ProviderTimeOffRequest[]>;

  /** Submit time-off request */
  submitTimeOffRequest(
    input: ProviderTimeOffRequestInput,
  ): Promise<ProviderTimeOffRequest>;

  /** Approve/deny time-off request */
  updateTimeOffRequest(
    providerRequestId: string,
    action: 'approve' | 'deny',
    notes?: string,
  ): Promise<void>;

  // ═══════════════════════════════════════════════════════════════════════════
  // BENEFITS
  // ═══════════════════════════════════════════════════════════════════════════

  /** Fetch available benefit plans */
  fetchBenefitPlans(): Promise<ProviderBenefitPlan[]>;

  /** Fetch employee enrollments */
  fetchEnrollments(providerEmployeeId: string): Promise<ProviderBenefitEnrollment[]>;

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPENSATION
  // ═══════════════════════════════════════════════════════════════════════════

  /** Fetch compensation history */
  fetchCompensationHistory(
    providerEmployeeId: string,
  ): Promise<ProviderCompensationRecord[]>;

  /** Update compensation */
  updateCompensation(
    providerEmployeeId: string,
    input: ProviderCompensationInput,
  ): Promise<void>;

  // ═══════════════════════════════════════════════════════════════════════════
  // TAX DOCUMENTS
  // ═══════════════════════════════════════════════════════════════════════════

  /** Fetch tax documents for a year */
  fetchTaxDocuments(year: number, type?: TaxFormType): Promise<ProviderTaxDocument[]>;

  /** Download tax document PDF */
  downloadTaxDocument(providerDocumentId: string): Promise<Buffer>;

  // ═══════════════════════════════════════════════════════════════════════════
  // DEPARTMENTS
  // ═══════════════════════════════════════════════════════════════════════════

  /** Fetch department hierarchy */
  fetchDepartments(): Promise<ProviderDepartment[]>;

  // ═══════════════════════════════════════════════════════════════════════════
  // WEBHOOKS
  // ═══════════════════════════════════════════════════════════════════════════

  /** Verify incoming webhook signature */
  verifyWebhook(rawBody: Buffer, signature: string): boolean;

  /** Parse webhook payload into canonical event */
  parseWebhookEvent(rawBody: Buffer): PayrollWebhookEvent;
}
```

### Provider Capabilities Matrix

| Capability | ADP | Gusto | Rippling | Notes |
|-----------|-----|-------|----------|-------|
| Employee CRUD | ✅ Full | ✅ Full | ✅ Full | All three support create/read/update/terminate |
| Payroll Run Processing | ⚠️ Limited | ✅ Full | ❌ Read-only | ADP: preview+submit for some plans; Rippling: in-platform only |
| Payroll Preview/Calculate | ✅ Full | ✅ Full | ❌ N/A | Preview before submitting payroll |
| Paystub Retrieval | ✅ Full | ✅ Full | ✅ Full | All support individual and batch |
| Time Off Management | ✅ Full | ✅ Full | ✅ Full | Request, approve, deny, cancel |
| Time Off Policies | ✅ Read | ✅ Read | ✅ Read | Policy configuration done in provider UI |
| Benefits Enrollment | ✅ Read | ✅ Read | ✅ Full | ADP/Gusto: read-only; Rippling: full CRUD |
| Benefits Plans | ✅ Read | ✅ Read | ✅ Read | Plan creation done in provider admin |
| Compensation Management | ✅ Full | ✅ Full | ✅ Full | Salary changes, bonuses |
| Equity/Stock Grants | ❌ N/A | ❌ N/A | ✅ Read | Rippling-only feature |
| W-2 / 1099 Documents | ✅ Full | ✅ Full | ✅ Full | PDF download supported |
| Department Hierarchy | ✅ Full | ✅ Full | ✅ Full | All support nested departments |
| Org Chart | ✅ Derived | ✅ Derived | ✅ Native | ADP/Gusto: built from manager_id; Rippling: native API |
| Onboarding Checklists | ⚠️ Partial | ✅ Full | ✅ Full | ADP: limited API; tracks in-platform |
| Webhooks / Events | ✅ Event Notif. | ✅ Webhooks | ✅ Webhooks | ADP uses Event Notification Service |
| OAuth 2.0 | ✅ Standard | ✅ PKCE | ✅ Standard | Gusto requires PKCE flow |
| Rate Limits | 50/min | 100/min | 200/min | Per-application limits |
| Multi-EIN Support | ✅ Native | ❌ Single | ⚠️ Limited | ADP handles multiple EINs natively |
| Garnishments | ✅ Full | ⚠️ Read-only | ⚠️ Read-only | ADP: full management; others: read |

---

## TypeScript Interfaces

### Enums and Constant Types

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════════════════════════════

type PayrollProvider = 'adp' | 'gusto' | 'rippling';
type ProviderConnectionStatus = 'connected' | 'disconnected' | 'expired' | 'error';

// ═══════════════════════════════════════════════════════════════════════════════
// EMPLOYMENT
// ═══════════════════════════════════════════════════════════════════════════════

type EmploymentType = 'full_time' | 'part_time' | 'contractor' | 'intern' | 'temporary';
type EmploymentStatus = 'active' | 'terminated' | 'on_leave' | 'onboarding' | 'offboarding';
type FLSAClassification = 'exempt' | 'non_exempt' | 'contractor';

// ═══════════════════════════════════════════════════════════════════════════════
// PAY
// ═══════════════════════════════════════════════════════════════════════════════

type PayFrequency = 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';
type PayrollRunStatus =
  | 'draft'
  | 'calculated'
  | 'submitted'
  | 'processing'
  | 'processed'
  | 'failed'
  | 'reversed';
type CompensationType =
  | 'salary'
  | 'hourly'
  | 'bonus'
  | 'commission'
  | 'equity'
  | 'adjustment';

// ═══════════════════════════════════════════════════════════════════════════════
// TIME OFF
// ═══════════════════════════════════════════════════════════════════════════════

type TimeOffType =
  | 'vacation'
  | 'sick'
  | 'personal'
  | 'bereavement'
  | 'jury_duty'
  | 'parental'
  | 'military'
  | 'unpaid'
  | 'other';
type TimeOffRequestStatus = 'pending' | 'approved' | 'denied' | 'canceled' | 'taken';

// ═══════════════════════════════════════════════════════════════════════════════
// BENEFITS
// ═══════════════════════════════════════════════════════════════════════════════

type BenefitCategory =
  | 'medical'
  | 'dental'
  | 'vision'
  | 'life'
  | 'disability'
  | 'retirement_401k'
  | 'hsa'
  | 'fsa'
  | 'commuter'
  | 'other';
type BenefitEnrollmentStatus = 'enrolled' | 'waived' | 'pending' | 'terminated';
type CoverageLevel =
  | 'employee_only'
  | 'employee_spouse'
  | 'employee_children'
  | 'family';

// ═══════════════════════════════════════════════════════════════════════════════
// TAX
// ═══════════════════════════════════════════════════════════════════════════════

type TaxFormType =
  | 'w2'
  | 'w4'
  | '1099_nec'
  | '1099_misc'
  | '941'
  | '940'
  | 'state_w2';
type TaxDocumentStatus = 'draft' | 'filed' | 'corrected' | 'available';

// ═══════════════════════════════════════════════════════════════════════════════
// ONBOARDING
// ═══════════════════════════════════════════════════════════════════════════════

type OnboardingTaskType =
  | 'personal_info'
  | 'tax_forms'
  | 'direct_deposit'
  | 'i9_verification'
  | 'benefits_enrollment'
  | 'policy_acknowledgement'
  | 'equipment_setup'
  | 'welcome_meeting';
type OnboardingTaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

// ═══════════════════════════════════════════════════════════════════════════════
// SYNC
// ═══════════════════════════════════════════════════════════════════════════════

type SyncType =
  | 'employees'
  | 'payroll_runs'
  | 'time_off'
  | 'benefits'
  | 'compensation'
  | 'departments'
  | 'tax_documents'
  | 'full';
type SyncStatus = 'running' | 'completed' | 'failed' | 'partial';
```

### Core Domain Types

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// EMPLOYEE
// ═══════════════════════════════════════════════════════════════════════════════

interface Employee {
  id: string;                           // UUID primary key (local)
  ventureId: string;                    // Owning venture
  providerEmployeeId: string;           // External ID in ADP/Gusto/Rippling

  // Identity
  firstName: string;
  middleName: string | null;
  lastName: string;
  preferredName: string | null;
  email: string;                        // Work email
  personalEmail: string | null;

  // Employment
  employmentType: EmploymentType;       // full_time, part_time, contractor, etc.
  status: EmploymentStatus;             // active, terminated, on_leave, etc.
  flsaClassification: FLSAClassification; // exempt, non_exempt, contractor
  title: string | null;                 // Job title
  departmentId: string | null;          // FK to payroll_departments
  managerId: string | null;             // FK to payroll_employees (self-ref)
  workLocation: string | null;          // Office location or 'remote'

  // Dates
  startDate: Date;                      // Employment start date
  terminationDate: Date | null;         // Set when terminated
  dateOfBirth: Date | null;             // PII — access controlled

  // Compensation (current)
  currentSalary: number | null;         // Annual salary in cents
  currentHourlyRate: number | null;     // Hourly rate in cents
  payFrequency: PayFrequency;           // weekly, biweekly, semimonthly, monthly

  // Tax
  ssnLastFour: string | null;           // PII — last 4 digits only
  federalFilingStatus: string | null;   // e.g., 'single', 'married_filing_jointly'
  stateFilingStatus: string | null;
  workState: string | null;             // 2-letter state code
  homeState: string | null;             // 2-letter state code

  // Metadata
  avatarUrl: string | null;
  phone: string | null;
  address: EmployeeAddress | null;      // PII — access controlled
  customFields: Record<string, unknown>;

  // Sync
  lastSyncedAt: Date;
  provider: PayrollProvider;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

interface EmployeeAddress {
  street1: string;
  street2: string | null;
  city: string;
  state: string;                        // 2-letter state code
  zip: string;
  country: string;                      // ISO 3166-1 alpha-2
}

interface EmployeeInput {
  firstName: string;
  lastName: string;
  email: string;
  personalEmail?: string;
  employmentType: EmploymentType;
  title?: string;
  departmentId?: string;
  managerId?: string;
  startDate: Date;
  salary?: number;                      // Annual salary in cents
  hourlyRate?: number;                  // Hourly rate in cents
  payFrequency?: PayFrequency;
  workLocation?: string;
  address?: EmployeeAddress;
  customFields?: Record<string, unknown>;
}

interface EmployeeUpdateInput {
  firstName?: string;
  lastName?: string;
  preferredName?: string;
  email?: string;
  title?: string;
  departmentId?: string;
  managerId?: string;
  workLocation?: string;
  address?: EmployeeAddress;
  customFields?: Record<string, unknown>;
}

interface EmployeeTerminationInput {
  terminationDate: Date;
  reason:
    | 'voluntary'
    | 'involuntary'
    | 'retirement'
    | 'layoff'
    | 'death'
    | 'other';
  reasonDetail?: string;
  finalPayDate?: Date;
  runOffboarding?: boolean;             // Auto-start offboarding checklist
}

interface EmployeeFilters {
  status?: EmploymentStatus | EmploymentStatus[];
  employmentType?: EmploymentType | EmploymentType[];
  departmentId?: string;
  managerId?: string;
  search?: string;                      // Full-text search on name/email
  startDateFrom?: Date;
  startDateTo?: Date;
  page?: number;
  pageSize?: number;                    // Default: 25
  sortBy?: 'name' | 'startDate' | 'department' | 'title';
  sortOrder?: 'asc' | 'desc';
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAYROLL RUN
// ═══════════════════════════════════════════════════════════════════════════════

interface PayrollRun {
  id: string;                           // UUID primary key (local)
  ventureId: string;
  providerRunId: string;                // External ID in provider

  // Period
  payPeriodStart: Date;
  payPeriodEnd: Date;
  checkDate: Date;                      // Pay date (when checks are issued)
  payFrequency: PayFrequency;

  // Status
  status: PayrollRunStatus;
  processedAt: Date | null;

  // Totals (all in cents)
  totalGrossPay: number;
  totalNetPay: number;
  totalEmployeeTaxes: number;
  totalEmployerTaxes: number;
  totalEmployeeDeductions: number;      // Benefits, 401k, etc.
  totalEmployerContributions: number;   // Employer match, etc.
  totalReimbursements: number;

  // Counts
  employeeCount: number;
  hoursWorked: number | null;           // Total hours (hourly employees)

  // Metadata
  notes: string | null;
  provider: PayrollProvider;
  lastSyncedAt: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAY PERIOD
// ═══════════════════════════════════════════════════════════════════════════════

interface PayPeriod {
  startDate: Date;
  endDate: Date;
  checkDate: Date;
  payFrequency: PayFrequency;
  periodNumber: number;                 // e.g., period 3 of 26 for biweekly
  year: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAYSTUB
// ═══════════════════════════════════════════════════════════════════════════════

interface Paystub {
  id: string;
  ventureId: string;
  employeeId: string;
  runId: string;
  providerPaystubId: string;

  // Period
  payPeriodStart: Date;
  payPeriodEnd: Date;
  checkDate: Date;

  // Pay (all in cents)
  grossPay: number;
  netPay: number;

  // Earnings breakdown
  regularPay: number;
  overtimePay: number;
  holidayPay: number;
  ptoPay: number;
  bonusPay: number;
  commissionPay: number;
  otherPay: number;

  // Hours
  regularHours: number | null;
  overtimeHours: number | null;
  ptoHours: number | null;

  // Tax withholdings
  federalIncomeTax: number;
  stateIncomeTax: number;
  localIncomeTax: number;
  socialSecurity: number;              // Employee portion
  medicare: number;                    // Employee portion
  additionalMedicare: number;          // 0.9% above $200k threshold
  otherTaxes: number;

  // Employee deductions
  medicalDeduction: number;
  dentalDeduction: number;
  visionDeduction: number;
  retirement401k: number;
  hsaContribution: number;
  fsaContribution: number;
  lifeInsurance: number;
  disabilityInsurance: number;
  otherDeductions: number;

  // Employer contributions (informational)
  employerSocialSecurity: number;
  employerMedicare: number;
  employer401kMatch: number;
  employerHealthContribution: number;
  otherEmployerContributions: number;

  // Reimbursements
  reimbursements: number;

  // Line items (raw detail)
  lineItems: PaystubLineItem[];

  // Year-to-date
  ytdGrossPay: number;
  ytdNetPay: number;
  ytdFederalTax: number;
  ytdStateTax: number;
  ytdSocialSecurity: number;
  ytdMedicare: number;

  // Metadata
  provider: PayrollProvider;
  lastSyncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface PaystubLineItem {
  category:
    | 'earnings'
    | 'taxes'
    | 'deductions'
    | 'employer_contributions'
    | 'reimbursements';
  name: string;                         // e.g., 'Regular Pay', 'Federal Income Tax'
  amount: number;                       // In cents
  hours: number | null;
  rate: number | null;                  // Per-hour or per-unit rate in cents
  ytdAmount: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAX WITHHOLDING
// ═══════════════════════════════════════════════════════════════════════════════

interface TaxWithholding {
  employeeId: string;
  paystubId: string;

  // Federal
  federalIncomeTax: number;             // Cents
  federalFilingStatus: string;
  federalAllowances: number;
  additionalFederalWithholding: number;

  // State
  stateCode: string;                    // 2-letter
  stateIncomeTax: number;
  stateFilingStatus: string | null;
  additionalStateWithholding: number;

  // Local
  localJurisdiction: string | null;
  localIncomeTax: number;

  // FICA
  socialSecurityWages: number;          // Subject wages (up to cap)
  socialSecurityTax: number;            // 6.2% employee share
  medicareWages: number;
  medicareTax: number;                  // 1.45% employee share
  additionalMedicareTax: number;        // 0.9% above $200k

  // Employer FICA (mirror)
  employerSocialSecurityTax: number;
  employerMedicareTax: number;

  // Unemployment
  futaLiability: number;                // Employer only
  sutaLiability: number;                // Employer only
  sutaState: string;
  sutaRate: number;                     // State-specific rate

  // Calculated
  totalEmployeeTax: number;
  totalEmployerTax: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEDUCTION
// ═══════════════════════════════════════════════════════════════════════════════

interface Deduction {
  id: string;
  employeeId: string;
  ventureId: string;

  name: string;                         // e.g., 'Medical Premium — Gold PPO'
  category: DeductionCategory;
  type: 'pre_tax' | 'post_tax' | 'exempt';
  frequency: PayFrequency;
  amount: number;                       // Per-period amount in cents
  annualLimit: number | null;           // IRS limit (e.g., 401k: $23,500 for 2026)
  ytdAmount: number;                    // Year-to-date total
  effectiveDate: Date;
  endDate: Date | null;
  isActive: boolean;

  // Employer match (if applicable)
  employerMatchPercent: number | null;   // e.g., 50 = 50% match
  employerMatchLimit: number | null;     // Max employer match in cents/year

  provider: PayrollProvider;
  createdAt: Date;
  updatedAt: Date;
}

type DeductionCategory =
  | 'medical'
  | 'dental'
  | 'vision'
  | 'retirement_401k'
  | 'retirement_403b'
  | 'hsa'
  | 'fsa'
  | 'life_insurance'
  | 'disability'
  | 'garnishment'
  | 'union_dues'
  | 'charitable'
  | 'other';

// ═══════════════════════════════════════════════════════════════════════════════
// COMPENSATION
// ═══════════════════════════════════════════════════════════════════════════════

interface CompensationRecord {
  id: string;
  employeeId: string;
  type: CompensationType;
  amount: number;                       // In cents (annual for salary, per-hour for hourly)
  effectiveDate: Date;
  endDate: Date | null;
  reason: string | null;
  approvedBy: string | null;
  currency: string;                     // ISO 4217 (default: 'USD')
  payFrequency: PayFrequency | null;
  provider: PayrollProvider;
  createdAt: Date;
  updatedAt: Date;
}

interface SalaryUpdateInput {
  employeeId: string;
  newSalary: number;                    // Annual salary in cents
  effectiveDate: Date;
  reason?: string;
}

interface BonusInput {
  employeeId: string;
  amount: number;                       // In cents
  description: string;
  payDate?: Date;
  type?: 'one_time' | 'retention' | 'signing' | 'performance' | 'holiday';
}

interface EquityGrant {
  id: string;
  employeeId: string;
  grantType: 'iso' | 'nso' | 'rsu' | 'phantom';
  shares: number;
  strikePrice: number | null;
  vestingSchedule: string;              // e.g., '4yr/1yr cliff'
  grantDate: Date;
  vestingStartDate: Date;
  expirationDate: Date | null;
  vestedShares: number;
  unvestedShares: number;
  nextVestingDate: Date | null;
  nextVestingShares: number | null;
  provider: 'rippling';                 // Only available via Rippling
  createdAt: Date;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAY STUB (generation context)
// ═══════════════════════════════════════════════════════════════════════════════

interface PayStubGenerationContext {
  employee: Employee;
  payPeriod: PayPeriod;
  timeEntries: AggregatedTimeEntry[];
  compensation: CompensationRecord;
  deductions: Deduction[];
  taxWithholding: TaxWithholding;
  reimbursements: ReimbursementItem[];
  previousStubs: Paystub[];             // For YTD calculations
}

interface AggregatedTimeEntry {
  employeeId: string;
  payPeriodStart: Date;
  payPeriodEnd: Date;
  regularHours: number;
  overtimeHours: number;
  ptoHours: number;
  holidayHours: number;
  totalBillableHours: number;
  totalNonBillableHours: number;
  entries: Array<{
    timeEntryId: string;                // FK to time_entries.id
    date: Date;
    hours: number;
    category: string;
    isBillable: boolean;
    isApproved: boolean;
  }>;
}

interface ReimbursementItem {
  description: string;
  amount: number;                       // In cents
  category: string;
  receiptUrl: string | null;
  approvedBy: string;
  approvedAt: Date;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIME OFF
// ═══════════════════════════════════════════════════════════════════════════════

interface TimeOffBalance {
  id: string;
  employeeId: string;
  policyType: TimeOffType;
  policyName: string;
  balanceHours: number;
  usedHours: number;
  pendingHours: number;
  accrualRate: number;
  accrualPeriod: 'per_pay_period' | 'per_month' | 'per_year' | 'unlimited';
  maxBalance: number | null;
  carryoverLimit: number | null;
  lastSyncedAt: Date;
  updatedAt: Date;
}

interface TimeOffRequest {
  id: string;
  ventureId: string;
  employeeId: string;
  providerRequestId: string;
  type: TimeOffType;
  status: TimeOffRequestStatus;
  startDate: Date;
  endDate: Date;
  totalHours: number;
  notes: string | null;
  approverId: string | null;
  approvedAt: Date | null;
  deniedAt: Date | null;
  denialReason: string | null;
  provider: PayrollProvider;
  lastSyncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface TimeOffPolicy {
  id: string;
  ventureId: string;
  providerPolicyId: string;
  name: string;
  type: TimeOffType;
  accrualRate: number;
  accrualPeriod: 'per_pay_period' | 'per_month' | 'per_year' | 'unlimited';
  maxBalance: number | null;
  carryoverLimit: number | null;
  waitingPeriodDays: number;
  requiresApproval: boolean;
  provider: PayrollProvider;
  createdAt: Date;
  updatedAt: Date;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BENEFITS
// ═══════════════════════════════════════════════════════════════════════════════

interface BenefitPlan {
  id: string;
  ventureId: string;
  providerPlanId: string;
  name: string;
  category: BenefitCategory;
  description: string | null;
  carrier: string | null;
  employeeCostMonthly: number;
  employerCostMonthly: number;
  dependentCostMonthly: number | null;
  coverageLevels: CoverageLevel[];
  eligibleEmploymentTypes: EmploymentType[];
  waitingPeriodDays: number;
  isActive: boolean;
  provider: PayrollProvider;
  createdAt: Date;
  updatedAt: Date;
}

interface BenefitEnrollment {
  id: string;
  employeeId: string;
  planId: string;
  status: BenefitEnrollmentStatus;
  coverageLevel: CoverageLevel;
  coverageStart: Date;
  coverageEnd: Date | null;
  employeeCost: number;
  employerCost: number;
  dependents: BenefitDependent[];
  provider: PayrollProvider;
  createdAt: Date;
  updatedAt: Date;
}

interface BenefitDependent {
  name: string;
  relationship: 'spouse' | 'child' | 'domestic_partner';
  dateOfBirth: Date | null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAX DOCUMENTS
// ═══════════════════════════════════════════════════════════════════════════════

interface TaxDocument {
  id: string;
  ventureId: string;
  employeeId: string;
  providerDocumentId: string;
  formType: TaxFormType;
  taxYear: number;
  status: TaxDocumentStatus;
  wagesOrCompensation: number | null;
  federalTaxWithheld: number | null;
  stateTaxWithheld: number | null;
  socialSecurityWages: number | null;
  socialSecurityTax: number | null;
  medicareWages: number | null;
  medicareTax: number | null;
  pdfAvailable: boolean;
  pdfUrl: string | null;
  provider: PayrollProvider;
  filedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface YtdTaxSummary {
  employeeId: string;
  year: number;
  asOfDate: Date;
  grossPay: number;
  netPay: number;
  federalIncomeTax: number;
  stateIncomeTax: number;
  socialSecurity: number;
  medicare: number;
  totalDeductions: number;
  totalEmployerContributions: number;
  deductionsByCategory: Record<string, number>;
  employerContributionsByCategory: Record<string, number>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEPARTMENTS & ORG CHART
// ═══════════════════════════════════════════════════════════════════════════════

interface Department {
  id: string;
  ventureId: string;
  providerDeptId: string;
  name: string;
  parentId: string | null;
  managerId: string | null;
  employeeCount: number;
  isActive: boolean;
  provider: PayrollProvider;
  createdAt: Date;
  updatedAt: Date;
}

interface OrgChartNode {
  employee: Pick<Employee, 'id' | 'firstName' | 'lastName' | 'title' | 'avatarUrl'>;
  department: Pick<Department, 'id' | 'name'> | null;
  directReports: OrgChartNode[];
  reportCount: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPLIANCE & REPORTING
// ═══════════════════════════════════════════════════════════════════════════════

interface PayrollSummaryReport {
  ventureId: string;
  period: { from: Date; to: Date };
  totalGrossPay: number;
  totalNetPay: number;
  totalEmployeeTaxes: number;
  totalEmployerTaxes: number;
  totalDeductions: number;
  totalEmployerContributions: number;
  totalReimbursements: number;

  byDepartment: Array<{
    department: string;
    employeeCount: number;
    grossPay: number;
    netPay: number;
  }>;
  byPayFrequency: Record<PayFrequency, {
    runCount: number;
    grossPay: number;
    netPay: number;
  }>;

  federalTaxTotal: number;
  stateTaxByState: Record<string, number>;
  ficaTotal: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAYROLL SETTINGS (per-venture configuration)
// ═══════════════════════════════════════════════════════════════════════════════

interface PayrollSettings {
  id: string;
  ventureId: string;
  defaultPayFrequency: PayFrequency;
  defaultWorkHoursPerWeek: number;      // e.g., 40
  overtimeThresholdHours: number;       // e.g., 40 (weekly)
  overtimeMultiplier: number;           // e.g., 1.5
  doubleTimeThresholdHours: number | null; // e.g., 60 (CA requires 2× after 12h/day)
  doubleTimeMultiplier: number | null;
  autoApproveTimesheets: boolean;
  requireManagerApproval: boolean;
  payrollApprovalRequired: boolean;
  payrollApprovers: string[];           // User IDs
  defaultCurrency: string;              // ISO 4217
  fiscalYearStartMonth: number;         // 1-12
  ein: string | null;                   // Employer Identification Number (encrypted)
  companyLegalName: string | null;
  companyAddress: EmployeeAddress | null;
  createdAt: Date;
  updatedAt: Date;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SYNC & WEBHOOK
// ═══════════════════════════════════════════════════════════════════════════════

interface SyncResult {
  syncType: SyncType;
  status: SyncStatus;
  recordsSynced: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsSkipped: number;
  errors: SyncError[];
  durationMs: number;
  startedAt: Date;
  completedAt: Date;
}

interface SyncError {
  providerRecordId: string;
  errorCode: string;
  message: string;
  retryable: boolean;
}

interface SyncOptions {
  since?: Date;
  fullSync?: boolean;
  batchSize?: number;
  dryRun?: boolean;
  entities?: SyncType[];
}

interface PayrollWebhookEvent {
  id: string;
  provider: PayrollProvider;
  eventType: string;
  canonicalType: PayrollWebhookCanonicalType;
  payload: Record<string, unknown>;
  receivedAt: Date;
  ventureId: string;
}

type PayrollWebhookCanonicalType =
  | 'employee.created'
  | 'employee.updated'
  | 'employee.terminated'
  | 'payroll.processed'
  | 'payroll.reversed'
  | 'time_off.requested'
  | 'time_off.approved'
  | 'time_off.denied'
  | 'time_off.canceled'
  | 'benefits.enrolled'
  | 'benefits.disenrolled'
  | 'compensation.updated'
  | 'tax_document.available'
  | 'provider.disconnected';
```

---

## Database Schema

### Entity Relationship Diagram

```
ventures ──1:1──▶ payroll_connections
    │                   │
    ├──1:1──▶ payroll_settings
    │
    ├──1:N──▶ payroll_departments ──self-ref──▶ parent_id
    │              │
    │              └──1:N──▶ payroll_employees
    │                             │
    │                             ├──1:N──▶ payroll_paystubs ◀── payroll_runs
    │                             │
    │                             ├──1:N──▶ payroll_time_off_balances
    │                             │
    │                             ├──1:N──▶ payroll_time_off_requests
    │                             │
    │                             ├──1:N──▶ payroll_benefits_enrollments ◀── payroll_benefits_plans
    │                             │
    │                             ├──1:N──▶ payroll_compensation
    │                             │
    │                             ├──1:N──▶ payroll_deductions
    │                             │
    │                             ├──1:N──▶ payroll_tax_withholdings ◀── payroll_paystubs
    │                             │
    │                             ├──1:N──▶ payroll_tax_documents
    │                             │
    │                             └──1:N──▶ payroll_onboarding_tasks
    │
    ├──1:N──▶ payroll_runs
    │
    ├──1:N──▶ payroll_time_off_policies
    │
    ├──1:N──▶ payroll_benefits_plans
    │
    ├──1:N──▶ payroll_audit_log
    │
    └──1:N──▶ payroll_sync_log
```

### SQL DDL

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- PAYROLL CONNECTIONS
-- One connection per venture to a payroll provider (ADP, Gusto, or Rippling)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE payroll_connections (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venture_id      UUID NOT NULL UNIQUE REFERENCES ventures(id) ON DELETE CASCADE,

    -- Provider
    provider                VARCHAR(32)  NOT NULL CHECK (provider IN ('adp', 'gusto', 'rippling')),
    provider_company_id     VARCHAR(128) NOT NULL,

    -- OAuth tokens (encrypted at rest via column-level encryption)
    access_token            TEXT         NOT NULL,
    refresh_token           TEXT         NOT NULL,
    token_expires_at        TIMESTAMPTZ  NOT NULL,
    scopes                  JSONB        NOT NULL DEFAULT '[]',

    -- Status
    status                  VARCHAR(32)  NOT NULL DEFAULT 'connected'
                            CHECK (status IN ('connected', 'disconnected', 'expired', 'error')),
    last_health_check       TIMESTAMPTZ,
    health_check_error      TEXT,
    capabilities            JSONB,

    -- Sync state
    last_full_sync          TIMESTAMPTZ,
    last_incremental_sync   TIMESTAMPTZ,
    sync_interval           VARCHAR(16)  DEFAULT '15m',

    -- Timestamps
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX payroll_conn_venture_idx ON payroll_connections(venture_id);
CREATE INDEX payroll_conn_provider_idx ON payroll_connections(provider);

-- ═══════════════════════════════════════════════════════════════════════════════
-- PAYROLL SETTINGS
-- Per-venture payroll configuration
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE payroll_settings (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venture_id                  UUID NOT NULL UNIQUE REFERENCES ventures(id) ON DELETE CASCADE,

    default_pay_frequency       VARCHAR(32)  NOT NULL DEFAULT 'biweekly',
    default_work_hours_per_week NUMERIC(5,2) NOT NULL DEFAULT 40.00,
    overtime_threshold_hours    NUMERIC(5,2) NOT NULL DEFAULT 40.00,
    overtime_multiplier         NUMERIC(4,2) NOT NULL DEFAULT 1.50,
    double_time_threshold_hours NUMERIC(5,2),
    double_time_multiplier      NUMERIC(4,2),

    auto_approve_timesheets     BOOLEAN      NOT NULL DEFAULT false,
    require_manager_approval    BOOLEAN      NOT NULL DEFAULT true,
    payroll_approval_required   BOOLEAN      NOT NULL DEFAULT true,
    payroll_approvers           JSONB        NOT NULL DEFAULT '[]',

    default_currency            VARCHAR(3)   NOT NULL DEFAULT 'USD',
    fiscal_year_start_month     SMALLINT     NOT NULL DEFAULT 1 CHECK (fiscal_year_start_month BETWEEN 1 AND 12),

    -- Company info (encrypted PII)
    ein                         TEXT,        -- Employer Identification Number
    company_legal_name          TEXT,
    company_address             JSONB,

    created_at                  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX payroll_settings_venture_idx ON payroll_settings(venture_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- PAYROLL EMPLOYEES
-- Canonical employee records synced from provider
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE payroll_employees (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venture_id              UUID         NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
    provider_employee_id    VARCHAR(128) NOT NULL,

    -- Identity
    first_name              VARCHAR(128) NOT NULL,
    middle_name             VARCHAR(128),
    last_name               VARCHAR(128) NOT NULL,
    preferred_name          VARCHAR(128),
    email                   VARCHAR(255) NOT NULL,
    personal_email          VARCHAR(255),

    -- Employment
    employment_type         VARCHAR(32)  NOT NULL,
    status                  VARCHAR(32)  NOT NULL DEFAULT 'active',
    flsa_classification     VARCHAR(32),
    title                   VARCHAR(256),
    department_id           UUID,        -- FK to payroll_departments
    manager_id              UUID,        -- Self-ref FK
    work_location           VARCHAR(256),

    -- Dates
    start_date              DATE         NOT NULL,
    termination_date        DATE,
    date_of_birth           DATE,        -- PII: access controlled

    -- Compensation (current snapshot)
    current_salary          INTEGER,     -- Annual, cents
    current_hourly_rate     INTEGER,     -- Cents
    pay_frequency           VARCHAR(32),

    -- Tax info (PII: access controlled, encrypted)
    ssn_last_four           VARCHAR(4),
    federal_filing_status   VARCHAR(64),
    state_filing_status     VARCHAR(64),
    work_state              VARCHAR(2),
    home_state              VARCHAR(2),

    -- Metadata
    avatar_url              TEXT,
    phone                   VARCHAR(32),
    address                 JSONB,       -- PII: encrypted
    custom_fields           JSONB        DEFAULT '{}',

    -- Sync
    provider                VARCHAR(32)  NOT NULL,
    last_synced_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),

    -- Timestamps
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT payroll_emp_venture_provider_unique
        UNIQUE (venture_id, provider_employee_id)
);

CREATE INDEX payroll_emp_venture_status_idx ON payroll_employees(venture_id, status);
CREATE INDEX payroll_emp_department_idx ON payroll_employees(department_id);
CREATE INDEX payroll_emp_email_idx ON payroll_employees(venture_id, email);
CREATE INDEX payroll_emp_manager_idx ON payroll_employees(manager_id);
CREATE INDEX payroll_emp_name_search_idx ON payroll_employees
    USING gin (to_tsvector('english', first_name || ' ' || last_name));

-- ═══════════════════════════════════════════════════════════════════════════════
-- EMPLOYEE COMPENSATION HISTORY
-- Full timeline of salary changes, bonuses, and adjustments
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE employee_compensation (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venture_id      UUID         NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
    employee_id     UUID         NOT NULL REFERENCES payroll_employees(id) ON DELETE CASCADE,

    type            VARCHAR(32)  NOT NULL CHECK (type IN (
                        'salary', 'hourly', 'bonus', 'commission', 'equity', 'adjustment'
                    )),
    amount          INTEGER      NOT NULL,  -- Cents (annual for salary, per-hour for hourly)
    effective_date  DATE         NOT NULL,
    end_date        DATE,
    reason          TEXT,
    approved_by     UUID,        -- User ID who approved
    currency        VARCHAR(3)   NOT NULL DEFAULT 'USD',
    pay_frequency   VARCHAR(32),

    provider        VARCHAR(32)  NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX comp_employee_date_idx ON employee_compensation(employee_id, effective_date DESC);
CREATE INDEX comp_venture_idx ON employee_compensation(venture_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- PAYROLL RUNS
-- Each completed payroll cycle
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE payroll_runs (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venture_id                  UUID         NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
    provider_run_id             VARCHAR(128) NOT NULL,

    -- Period
    pay_period_start            DATE         NOT NULL,
    pay_period_end              DATE         NOT NULL,
    check_date                  DATE         NOT NULL,
    pay_frequency               VARCHAR(32)  NOT NULL,

    -- Status
    status                      VARCHAR(32)  NOT NULL DEFAULT 'draft'
                                CHECK (status IN (
                                    'draft', 'calculated', 'submitted',
                                    'processing', 'processed', 'failed', 'reversed'
                                )),
    processed_at                TIMESTAMPTZ,

    -- Totals (cents)
    total_gross_pay             INTEGER      NOT NULL DEFAULT 0,
    total_net_pay               INTEGER      NOT NULL DEFAULT 0,
    total_employee_taxes        INTEGER      NOT NULL DEFAULT 0,
    total_employer_taxes        INTEGER      NOT NULL DEFAULT 0,
    total_employee_deductions   INTEGER      NOT NULL DEFAULT 0,
    total_employer_contributions INTEGER     NOT NULL DEFAULT 0,
    total_reimbursements        INTEGER      NOT NULL DEFAULT 0,

    -- Counts
    employee_count              INTEGER      NOT NULL DEFAULT 0,
    hours_worked                NUMERIC(10,2),

    -- Metadata
    notes                       TEXT,
    provider                    VARCHAR(32)  NOT NULL,
    last_synced_at              TIMESTAMPTZ  NOT NULL DEFAULT now(),

    created_at                  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT payroll_run_venture_provider_unique
        UNIQUE (venture_id, provider_run_id)
);

CREATE INDEX payroll_run_period_idx ON payroll_runs(venture_id, pay_period_start);
CREATE INDEX payroll_run_check_date_idx ON payroll_runs(venture_id, check_date);
CREATE INDEX payroll_run_status_idx ON payroll_runs(venture_id, status);

-- ═══════════════════════════════════════════════════════════════════════════════
-- PAY STUBS
-- Individual pay statements per employee per payroll run
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE pay_stubs (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venture_id                  UUID         NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
    employee_id                 UUID         NOT NULL REFERENCES payroll_employees(id) ON DELETE CASCADE,
    run_id                      UUID         NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
    provider_paystub_id         VARCHAR(128) NOT NULL,

    -- Period
    pay_period_start            DATE         NOT NULL,
    pay_period_end              DATE         NOT NULL,
    check_date                  DATE         NOT NULL,

    -- Pay (cents)
    gross_pay                   INTEGER      NOT NULL,
    net_pay                     INTEGER      NOT NULL,

    -- Earnings breakdown (cents)
    regular_pay                 INTEGER      NOT NULL DEFAULT 0,
    overtime_pay                INTEGER      NOT NULL DEFAULT 0,
    holiday_pay                 INTEGER      NOT NULL DEFAULT 0,
    pto_pay                     INTEGER      NOT NULL DEFAULT 0,
    bonus_pay                   INTEGER      NOT NULL DEFAULT 0,
    commission_pay              INTEGER      NOT NULL DEFAULT 0,
    other_pay                   INTEGER      NOT NULL DEFAULT 0,

    -- Hours
    regular_hours               NUMERIC(8,2),
    overtime_hours              NUMERIC(8,2),
    pto_hours                   NUMERIC(8,2),

    -- Tax withholdings (cents)
    federal_income_tax          INTEGER      NOT NULL DEFAULT 0,
    state_income_tax            INTEGER      NOT NULL DEFAULT 0,
    local_income_tax            INTEGER      NOT NULL DEFAULT 0,
    social_security             INTEGER      NOT NULL DEFAULT 0,
    medicare                    INTEGER      NOT NULL DEFAULT 0,
    additional_medicare         INTEGER      NOT NULL DEFAULT 0,
    other_taxes                 INTEGER      NOT NULL DEFAULT 0,

    -- Employee deductions (cents)
    medical_deduction           INTEGER      NOT NULL DEFAULT 0,
    dental_deduction            INTEGER      NOT NULL DEFAULT 0,
    vision_deduction            INTEGER      NOT NULL DEFAULT 0,
    retirement_401k             INTEGER      NOT NULL DEFAULT 0,
    hsa_contribution            INTEGER      NOT NULL DEFAULT 0,
    fsa_contribution            INTEGER      NOT NULL DEFAULT 0,
    life_insurance              INTEGER      NOT NULL DEFAULT 0,
    disability_insurance        INTEGER      NOT NULL DEFAULT 0,
    other_deductions            INTEGER      NOT NULL DEFAULT 0,

    -- Employer contributions (informational, cents)
    employer_social_security    INTEGER      NOT NULL DEFAULT 0,
    employer_medicare           INTEGER      NOT NULL DEFAULT 0,
    employer_401k_match         INTEGER      NOT NULL DEFAULT 0,
    employer_health_contribution INTEGER     NOT NULL DEFAULT 0,
    other_employer_contributions INTEGER     NOT NULL DEFAULT 0,

    -- Reimbursements (cents)
    reimbursements              INTEGER      NOT NULL DEFAULT 0,

    -- Line items (raw detail)
    line_items                  JSONB        NOT NULL DEFAULT '[]',

    -- Year-to-date (cents)
    ytd_gross_pay               INTEGER      NOT NULL DEFAULT 0,
    ytd_net_pay                 INTEGER      NOT NULL DEFAULT 0,
    ytd_federal_tax             INTEGER      NOT NULL DEFAULT 0,
    ytd_state_tax               INTEGER      NOT NULL DEFAULT 0,
    ytd_social_security         INTEGER      NOT NULL DEFAULT 0,
    ytd_medicare                INTEGER      NOT NULL DEFAULT 0,

    -- Metadata
    provider                    VARCHAR(32)  NOT NULL,
    last_synced_at              TIMESTAMPTZ  NOT NULL DEFAULT now(),
    created_at                  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX pay_stubs_run_idx ON pay_stubs(run_id);
CREATE INDEX pay_stubs_employee_idx ON pay_stubs(employee_id, created_at DESC);
CREATE INDEX pay_stubs_venture_check_date_idx ON pay_stubs(venture_id, check_date);

-- ═══════════════════════════════════════════════════════════════════════════════
-- TAX WITHHOLDINGS
-- Detailed tax breakdown per paystub
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE tax_withholdings (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venture_id                  UUID         NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
    employee_id                 UUID         NOT NULL REFERENCES payroll_employees(id) ON DELETE CASCADE,
    paystub_id                  UUID         NOT NULL REFERENCES pay_stubs(id) ON DELETE CASCADE,

    -- Federal
    federal_income_tax          INTEGER      NOT NULL DEFAULT 0,
    federal_filing_status       VARCHAR(64),
    federal_allowances          SMALLINT     DEFAULT 0,
    additional_federal_wh       INTEGER      DEFAULT 0,

    -- State
    state_code                  VARCHAR(2)   NOT NULL,
    state_income_tax            INTEGER      NOT NULL DEFAULT 0,
    state_filing_status         VARCHAR(64),
    additional_state_wh         INTEGER      DEFAULT 0,

    -- Local
    local_jurisdiction          VARCHAR(128),
    local_income_tax            INTEGER      NOT NULL DEFAULT 0,

    -- FICA (employee)
    ss_wages                    INTEGER      NOT NULL DEFAULT 0,
    ss_tax                      INTEGER      NOT NULL DEFAULT 0,
    medicare_wages              INTEGER      NOT NULL DEFAULT 0,
    medicare_tax                INTEGER      NOT NULL DEFAULT 0,
    additional_medicare_tax     INTEGER      NOT NULL DEFAULT 0,

    -- FICA (employer)
    employer_ss_tax             INTEGER      NOT NULL DEFAULT 0,
    employer_medicare_tax       INTEGER      NOT NULL DEFAULT 0,

    -- Unemployment (employer only)
    futa_liability              INTEGER      NOT NULL DEFAULT 0,
    suta_liability              INTEGER      NOT NULL DEFAULT 0,
    suta_state                  VARCHAR(2),
    suta_rate                   NUMERIC(6,4),

    -- Totals
    total_employee_tax          INTEGER      NOT NULL DEFAULT 0,
    total_employer_tax          INTEGER      NOT NULL DEFAULT 0,

    created_at                  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX tax_wh_paystub_idx ON tax_withholdings(paystub_id);
CREATE INDEX tax_wh_employee_idx ON tax_withholdings(employee_id);
CREATE INDEX tax_wh_venture_state_idx ON tax_withholdings(venture_id, state_code);

-- ═══════════════════════════════════════════════════════════════════════════════
-- DEDUCTIONS
-- Employee deduction configurations (benefits premiums, 401k, etc.)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE deductions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venture_id              UUID         NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
    employee_id             UUID         NOT NULL REFERENCES payroll_employees(id) ON DELETE CASCADE,

    name                    VARCHAR(256) NOT NULL,
    category                VARCHAR(32)  NOT NULL,
    type                    VARCHAR(16)  NOT NULL CHECK (type IN ('pre_tax', 'post_tax', 'exempt')),
    frequency               VARCHAR(32)  NOT NULL,
    amount                  INTEGER      NOT NULL,  -- Per-period, cents
    annual_limit            INTEGER,     -- IRS limit, cents
    ytd_amount              INTEGER      NOT NULL DEFAULT 0,
    effective_date          DATE         NOT NULL,
    end_date                DATE,
    is_active               BOOLEAN      NOT NULL DEFAULT true,

    employer_match_percent  NUMERIC(5,2),
    employer_match_limit    INTEGER,

    provider                VARCHAR(32)  NOT NULL,
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX deductions_employee_idx ON deductions(employee_id);
CREATE INDEX deductions_venture_active_idx ON deductions(venture_id, is_active);

-- ═══════════════════════════════════════════════════════════════════════════════
-- PAYROLL DEPARTMENTS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE payroll_departments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venture_id          UUID         NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
    provider_dept_id    VARCHAR(128) NOT NULL,

    name                VARCHAR(256) NOT NULL,
    parent_id           UUID         REFERENCES payroll_departments(id) ON DELETE SET NULL,
    manager_id          UUID         REFERENCES payroll_employees(id) ON DELETE SET NULL,
    employee_count      INTEGER      NOT NULL DEFAULT 0,
    is_active           BOOLEAN      NOT NULL DEFAULT true,

    provider            VARCHAR(32)  NOT NULL,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT dept_venture_provider_unique UNIQUE (venture_id, provider_dept_id)
);

CREATE INDEX payroll_dept_venture_idx ON payroll_departments(venture_id);
CREATE INDEX payroll_dept_parent_idx ON payroll_departments(parent_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- TIME OFF POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE payroll_time_off_policies (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venture_id          UUID         NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
    provider_policy_id  VARCHAR(128) NOT NULL,

    name                VARCHAR(256) NOT NULL,
    type                VARCHAR(32)  NOT NULL,
    accrual_rate        NUMERIC(8,2) NOT NULL,
    accrual_period      VARCHAR(32)  NOT NULL,
    max_balance         NUMERIC(8,2),
    carryover_limit     NUMERIC(8,2),
    waiting_period_days INTEGER      NOT NULL DEFAULT 0,
    requires_approval   BOOLEAN      NOT NULL DEFAULT true,

    provider            VARCHAR(32)  NOT NULL,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX pto_policy_venture_idx ON payroll_time_off_policies(venture_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- TIME OFF BALANCES
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE payroll_time_off_balances (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id     UUID         NOT NULL REFERENCES payroll_employees(id) ON DELETE CASCADE,
    policy_type     VARCHAR(32)  NOT NULL,
    policy_name     VARCHAR(256) NOT NULL,

    balance_hours   NUMERIC(8,2) NOT NULL DEFAULT 0,
    used_hours      NUMERIC(8,2) NOT NULL DEFAULT 0,
    pending_hours   NUMERIC(8,2) NOT NULL DEFAULT 0,
    accrual_rate    NUMERIC(8,2) NOT NULL DEFAULT 0,
    accrual_period  VARCHAR(32)  NOT NULL,
    max_balance     NUMERIC(8,2),
    carryover_limit NUMERIC(8,2),

    last_synced_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX pto_balance_employee_idx ON payroll_time_off_balances(employee_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- TIME OFF REQUESTS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE payroll_time_off_requests (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venture_id          UUID         NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
    employee_id         UUID         NOT NULL REFERENCES payroll_employees(id) ON DELETE CASCADE,
    provider_request_id VARCHAR(128) NOT NULL,

    type                VARCHAR(32)  NOT NULL,
    status              VARCHAR(32)  NOT NULL DEFAULT 'pending',
    start_date          DATE         NOT NULL,
    end_date            DATE         NOT NULL,
    total_hours         NUMERIC(8,2) NOT NULL,
    notes               TEXT,

    approver_id         UUID,
    approved_at         TIMESTAMPTZ,
    denied_at           TIMESTAMPTZ,
    denial_reason       TEXT,

    provider            VARCHAR(32)  NOT NULL,
    last_synced_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX pto_req_employee_status_idx ON payroll_time_off_requests(employee_id, status);
CREATE INDEX pto_req_venture_dates_idx ON payroll_time_off_requests(venture_id, start_date, end_date);

-- ═══════════════════════════════════════════════════════════════════════════════
-- BENEFITS PLANS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE payroll_benefits_plans (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venture_id                  UUID         NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
    provider_plan_id            VARCHAR(128) NOT NULL,

    name                        VARCHAR(256) NOT NULL,
    category                    VARCHAR(32)  NOT NULL,
    description                 TEXT,
    carrier                     VARCHAR(256),
    employee_cost_monthly       INTEGER      NOT NULL DEFAULT 0,
    employer_cost_monthly       INTEGER      NOT NULL DEFAULT 0,
    dependent_cost_monthly      INTEGER,
    coverage_levels             JSONB        NOT NULL DEFAULT '[]',
    eligible_employment_types   JSONB        NOT NULL DEFAULT '[]',
    waiting_period_days         INTEGER      NOT NULL DEFAULT 0,
    is_active                   BOOLEAN      NOT NULL DEFAULT true,

    provider                    VARCHAR(32)  NOT NULL,
    created_at                  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX benefits_plan_venture_idx ON payroll_benefits_plans(venture_id);
CREATE INDEX benefits_plan_category_idx ON payroll_benefits_plans(venture_id, category);

-- ═══════════════════════════════════════════════════════════════════════════════
-- BENEFITS ENROLLMENTS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE payroll_benefits_enrollments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venture_id      UUID         NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
    employee_id     UUID         NOT NULL REFERENCES payroll_employees(id) ON DELETE CASCADE,
    plan_id         UUID         NOT NULL REFERENCES payroll_benefits_plans(id) ON DELETE CASCADE,

    status          VARCHAR(32)  NOT NULL DEFAULT 'pending',
    coverage_level  VARCHAR(32)  NOT NULL,
    coverage_start  DATE         NOT NULL,
    coverage_end    DATE,
    employee_cost   INTEGER      NOT NULL DEFAULT 0,
    employer_cost   INTEGER      NOT NULL DEFAULT 0,
    dependents      JSONB        NOT NULL DEFAULT '[]',

    provider        VARCHAR(32)  NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX benefits_enroll_employee_idx ON payroll_benefits_enrollments(employee_id);
CREATE INDEX benefits_enroll_plan_idx ON payroll_benefits_enrollments(plan_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- TAX DOCUMENTS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE payroll_tax_documents (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venture_id              UUID         NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
    employee_id             UUID         NOT NULL REFERENCES payroll_employees(id) ON DELETE CASCADE,
    provider_document_id    VARCHAR(128) NOT NULL,

    form_type               VARCHAR(32)  NOT NULL,
    tax_year                SMALLINT     NOT NULL,
    status                  VARCHAR(32)  NOT NULL DEFAULT 'draft',

    -- Key figures (cents)
    wages_or_compensation   INTEGER,
    federal_tax_withheld    INTEGER,
    state_tax_withheld      INTEGER,
    ss_wages                INTEGER,
    ss_tax                  INTEGER,
    medicare_wages          INTEGER,
    medicare_tax            INTEGER,

    pdf_available           BOOLEAN      NOT NULL DEFAULT false,
    pdf_url                 TEXT,        -- Signed URL (expires)

    provider                VARCHAR(32)  NOT NULL,
    filed_at                TIMESTAMPTZ,
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX taxdoc_venture_year_idx ON payroll_tax_documents(venture_id, tax_year, form_type);
CREATE INDEX taxdoc_employee_idx ON payroll_tax_documents(employee_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- ONBOARDING TASKS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE payroll_onboarding_tasks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venture_id      UUID         NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
    employee_id     UUID         NOT NULL REFERENCES payroll_employees(id) ON DELETE CASCADE,

    task_type       VARCHAR(64)  NOT NULL,
    title           VARCHAR(256) NOT NULL,
    description     TEXT,
    assignee        VARCHAR(32)  NOT NULL CHECK (assignee IN ('employee', 'manager', 'hr', 'it', 'finance')),
    status          VARCHAR(32)  NOT NULL DEFAULT 'pending',
    due_date        DATE,
    completed_at    TIMESTAMPTZ,
    completed_by    UUID,
    sort_order      INTEGER      NOT NULL DEFAULT 0,

    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX onboard_employee_idx ON payroll_onboarding_tasks(employee_id);
CREATE INDEX onboard_venture_status_idx ON payroll_onboarding_tasks(venture_id, status);

-- ═══════════════════════════════════════════════════════════════════════════════
-- AUDIT LOG
-- Immutable log of all payroll changes
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE payroll_audit_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venture_id      UUID         NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,

    entity_type     VARCHAR(64)  NOT NULL,
    entity_id       UUID         NOT NULL,
    action          VARCHAR(64)  NOT NULL,
    changes         JSONB        NOT NULL DEFAULT '{}',
    actor_id        UUID         NOT NULL,
    actor_name      VARCHAR(256) NOT NULL,
    ip_address      INET,

    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Immutable: no UPDATE or DELETE triggers; append-only
CREATE INDEX audit_entity_idx ON payroll_audit_log(entity_type, entity_id);
CREATE INDEX audit_venture_time_idx ON payroll_audit_log(venture_id, created_at DESC);
CREATE INDEX audit_actor_idx ON payroll_audit_log(actor_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- SYNC LOG
-- Tracks sync operations for monitoring and debugging
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE payroll_sync_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venture_id      UUID         NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,

    sync_type       VARCHAR(32)  NOT NULL,
    status          VARCHAR(32)  NOT NULL,
    records_synced  INTEGER      NOT NULL DEFAULT 0,
    records_created INTEGER      NOT NULL DEFAULT 0,
    records_updated INTEGER      NOT NULL DEFAULT 0,
    records_skipped INTEGER      NOT NULL DEFAULT 0,
    errors          JSONB        NOT NULL DEFAULT '[]',
    duration_ms     INTEGER,

    started_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    completed_at    TIMESTAMPTZ
);

CREATE INDEX sync_log_venture_type_idx ON payroll_sync_log(venture_id, sync_type, created_at DESC);
CREATE INDEX sync_log_status_idx ON payroll_sync_log(status);
```

### Drizzle ORM Schema (Reference)

The Drizzle ORM schema mirrors the SQL DDL above. Key tables shown here for developer reference:

```typescript
// payroll_connections — see SQL DDL above
export const payrollConnections = pgTable('payroll_connections', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id).notNull().unique(),
  provider: varchar('provider', { length: 32 }).notNull(),
  providerCompanyId: varchar('provider_company_id', { length: 128 }).notNull(),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token').notNull(),
  tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }).notNull(),
  scopes: jsonb('scopes').$type<string[]>().notNull(),
  status: varchar('status', { length: 32 }).notNull().default('connected'),
  lastHealthCheck: timestamp('last_health_check', { withTimezone: true }),
  healthCheckError: text('health_check_error'),
  capabilities: jsonb('capabilities').$type<ProviderCapabilities>(),
  lastFullSync: timestamp('last_full_sync', { withTimezone: true }),
  lastIncrementalSync: timestamp('last_incremental_sync', { withTimezone: true }),
  syncInterval: varchar('sync_interval', { length: 16 }).default('15m'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('payroll_conn_venture_idx').on(table.ventureId),
  index('payroll_conn_provider_idx').on(table.provider),
]);

// payroll_runs — see SQL DDL above
export const payrollRuns = pgTable('payroll_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').references(() => ventures.id).notNull(),
  providerRunId: varchar('provider_run_id', { length: 128 }).notNull(),
  payPeriodStart: date('pay_period_start').notNull(),
  payPeriodEnd: date('pay_period_end').notNull(),
  checkDate: date('check_date').notNull(),
  payFrequency: varchar('pay_frequency', { length: 32 }).notNull(),
  status: varchar('status', { length: 32 }).notNull().default('draft'),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  totalGrossPay: integer('total_gross_pay').notNull().default(0),
  totalNetPay: integer('total_net_pay').notNull().default(0),
  totalEmployeeTaxes: integer('total_employee_taxes').notNull().default(0),
  totalEmployerTaxes: integer('total_employer_taxes').notNull().default(0),
  totalEmployeeDeductions: integer('total_employee_deductions').notNull().default(0),
  totalEmployerContributions: integer('total_employer_contributions').notNull().default(0),
  totalReimbursements: integer('total_reimbursements').notNull().default(0),
  employeeCount: integer('employee_count').notNull().default(0),
  hoursWorked: decimal('hours_worked', { precision: 10, scale: 2 }),
  notes: text('notes'),
  provider: varchar('provider', { length: 32 }).notNull(),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('payroll_run_venture_provider_id_idx').on(table.ventureId, table.providerRunId),
  index('payroll_run_period_idx').on(table.ventureId, table.payPeriodStart),
  index('payroll_run_check_date_idx').on(table.ventureId, table.checkDate),
  index('payroll_run_status_idx').on(table.ventureId, table.status),
]);
```

---

## Server Services

### PayrollProviderService

Manages the OAuth connection lifecycle for each venture.

| Method | Description |
|--------|-------------|
| `connectProvider(ventureId, provider, oauthCode)` | Exchanges OAuth code for tokens, stores connection |
| `disconnectProvider(ventureId)` | Revokes tokens and removes connection |
| `getProviderStatus(ventureId)` | Returns connection health, token expiry, last sync |
| `refreshProviderToken(ventureId)` | Force OAuth token refresh |
| `getProviderCapabilities(ventureId)` | Returns feature matrix for connected provider |
| `getAdapter(ventureId)` | Returns initialized adapter for the venture's provider |

**Connection Status Derivation:**
```typescript
if (tokenExpiresAt > now && lastHealthCheck.ok) → 'connected'
if (tokenExpiresAt < now && refreshToken.valid)  → 'expired' (auto-refresh attempted)
if (lastHealthCheck.error)                        → 'error'
if (no connection record)                         → 'disconnected'
```

### EmployeeService

Unified employee management with provider sync.

| Method | Description |
|--------|-------------|
| `syncEmployees(ventureId, options?)` | Full or incremental sync from provider |
| `getEmployee(ventureId, employeeId)` | Get employee with latest data |
| `getEmployees(ventureId, filters)` | Paginated employee list with search and filters |
| `createEmployee(ventureId, input)` | Creates employee in provider + local DB |
| `updateEmployee(ventureId, employeeId, input)` | Updates employee in both systems |
| `terminateEmployee(ventureId, employeeId, input)` | Processes termination with offboarding |
| `rehireEmployee(ventureId, employeeId, input)` | Rehires previously terminated employee |

**Employee Sync Strategy:**
```typescript
// Incremental sync (default): only fetch changes since lastSyncedAt
// Full sync: re-fetch all employees, upsert by providerEmployeeId
// Conflict resolution: provider data wins for provider-managed fields;
//   local-only fields (customFields, notes) are preserved

async function* syncEmployees(
  ventureId: string,
  options?: SyncOptions,
): AsyncGenerator<SyncProgress> {
  const adapter = await getAdapter(ventureId);
  const connection = await getConnection(ventureId);
  const since = options?.fullSync ? undefined : connection.lastIncrementalSync;

  let synced = 0, created = 0, updated = 0;

  for await (const providerEmployee of adapter.fetchEmployees({ since })) {
    const normalized = normalizeEmployee(providerEmployee, adapter.provider);
    const existing = await findByProviderId(ventureId, normalized.providerEmployeeId);

    if (existing) {
      await updateLocal(existing.id, normalized);
      updated++;
    } else {
      await insertLocal(ventureId, normalized);
      created++;
    }
    synced++;

    if (synced % 50 === 0) {
      yield { synced, created, updated, total: null };
    }
  }

  await updateSyncTimestamp(ventureId, 'employees');
  yield { synced, created, updated, total: synced };
}
```

### PayrollRunService

Payroll run processing and paystub retrieval.

| Method | Description |
|--------|-------------|
| `getPayrollRuns(ventureId, filters)` | List payroll runs with date/status filters |
| `getPayrollRun(ventureId, runId)` | Get single run with totals |
| `getPaystubs(ventureId, runId)` | Get all paystubs for a payroll run |
| `getPaystub(ventureId, paystubId)` | Get individual paystub with line items |
| `getEmployeePaystubs(ventureId, employeeId, filters?)` | Get employee's paystub history |
| `processPayrollRun(ventureId, input)` | Submit payroll for processing |
| `calculatePayroll(ventureId, input)` | Preview payroll before submitting |
| `getPayDates(ventureId, options?)` | Get upcoming pay dates for the venture |
| `aggregateTimeEntries(ventureId, payPeriod)` | Aggregate approved time entries into payroll hours |

**Time Entry Aggregation (links to `@mcv/db` `time_entries` table):**
```typescript
async function aggregateTimeEntries(
  ventureId: string,
  payPeriod: PayPeriod,
): Promise<Map<string, AggregatedTimeEntry>> {
  // Query approved time entries for the pay period
  const entries = await db
    .select()
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.projectId, ventureProjectId),
        gte(timeEntries.startedAt, payPeriod.startDate),
        lte(timeEntries.startedAt, payPeriod.endDate),
        eq(timeEntries.isApproved, true),
        eq(timeEntries.isRunning, false), // Exclude running timers
      ),
    );

  // Group by user/employee and aggregate
  const byEmployee = new Map<string, AggregatedTimeEntry>();

  for (const entry of entries) {
    const employeeId = await resolveEmployeeFromUserId(ventureId, entry.userId);
    if (!employeeId) continue;

    const agg = byEmployee.get(employeeId) || createEmptyAggregation(employeeId, payPeriod);
    const hours = entry.durationMinutes / 60;

    if (entry.category === 'pto' || entry.category === 'vacation') {
      agg.ptoHours += hours;
    } else if (entry.category === 'holiday') {
      agg.holidayHours += hours;
    } else {
      agg.regularHours += hours;
    }

    if (entry.isBillable) {
      agg.totalBillableHours += hours;
    } else {
      agg.totalNonBillableHours += hours;
    }

    agg.entries.push({
      timeEntryId: entry.id,
      date: entry.startedAt,
      hours,
      category: entry.category || 'general',
      isBillable: entry.isBillable,
      isApproved: entry.isApproved,
    });

    byEmployee.set(employeeId, agg);
  }

  // Apply overtime calculations per venture settings
  const settings = await getPayrollSettings(ventureId);
  for (const [empId, agg] of byEmployee) {
    if (agg.regularHours > settings.overtimeThresholdHours) {
      agg.overtimeHours = agg.regularHours - settings.overtimeThresholdHours;
      agg.regularHours = settings.overtimeThresholdHours;
    }
  }

  return byEmployee;
}
```

### TimeOffService

| Method | Description |
|--------|-------------|
| `syncTimeOff(ventureId)` | Sync balances and requests from provider |
| `getTimeOffBalances(ventureId, employeeId)` | Get current PTO balances for employee |
| `getTimeOffRequests(ventureId, filters)` | List requests with status/date filters |
| `requestTimeOff(ventureId, input)` | Submit time-off request to provider |
| `approveTimeOffRequest(ventureId, requestId, approverId)` | Manager approves request |
| `denyTimeOffRequest(ventureId, requestId, approverId, reason)` | Manager denies with reason |
| `cancelTimeOffRequest(ventureId, requestId)` | Employee cancels own pending request |
| `getTimeOffPolicies(ventureId)` | Get company time-off policies |

### BenefitsService

| Method | Description |
|--------|-------------|
| `syncBenefits(ventureId)` | Sync plans and enrollments from provider |
| `getBenefitPlans(ventureId, filters?)` | List available benefit plans |
| `getEnrollments(ventureId, employeeId)` | Get employee's benefit enrollments |
| `enrollEmployee(ventureId, employeeId, planId, input)` | Enroll in benefit plan |
| `disenrollEmployee(ventureId, employeeId, enrollmentId)` | Remove from benefit plan |
| `getBenefitsCosts(ventureId, period)` | Aggregate employer/employee cost breakdown |
| `getOpenEnrollmentWindow(ventureId)` | Get current enrollment period info |

### CompensationService

| Method | Description |
|--------|-------------|
| `getCompensationHistory(ventureId, employeeId)` | Full compensation timeline |
| `updateSalary(ventureId, input)` | Change salary with effective date |
| `addBonus(ventureId, input)` | Schedule one-time bonus |
| `getPayRates(ventureId, employeeId)` | Get current pay rates |
| `getEquityGrants(ventureId, employeeId)` | Get equity/stock grants (Rippling only) |
| `syncCompensation(ventureId)` | Sync compensation data from provider |

### TaxDocService

| Method | Description |
|--------|-------------|
| `getW2s(ventureId, year)` | Get W-2 forms for all employees for a tax year |
| `get1099s(ventureId, year)` | Get 1099-NEC forms for contractors |
| `downloadTaxDocument(ventureId, documentId)` | Download PDF of tax document |
| `getYtdTaxSummary(ventureId, employeeId)` | Year-to-date tax withholding summary |
| `getTaxFilingDeadlines(ventureId)` | Upcoming tax filing deadlines |

### ComplianceService

| Method | Description |
|--------|-------------|
| `getComplianceDeadlines(ventureId)` | Upcoming compliance deadlines |
| `getTaxFilings(ventureId, filters?)` | Tax filing history and status |
| `getAuditTrail(ventureId, filters)` | Audit log for payroll changes |
| `getFLSAClassifications(ventureId)` | Employee exempt/non-exempt breakdown |
|