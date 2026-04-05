# @mcv/people — Technical Architecture

> **Package:** `@mcv/people`
> **Classification:** PUBLISHABLE
> **Tier:** 5 — Domain Layer
> **Version:** 1.0.0
> **Last Updated:** February 9, 2026

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [System Diagram](#system-diagram)
3. [Module Architecture](#module-architecture)
   - [Directory](#directory-module)
   - [Hiring](#hiring-module)
   - [Learning](#learning-module)
   - [Leave](#leave-module)
   - [Onboarding](#onboarding-module)
   - [Org](#org-module)
   - [Performance](#performance-module)
   - [Time](#time-module)
4. [Data Models (Drizzle ORM)](#data-models-drizzle-orm)
5. [Data Flow & Events](#data-flow--events)
6. [Integration Points](#integration-points)
7. [Performance & Scalability](#performance--scalability)
8. [Error Handling](#error-handling)
9. [Observability](#observability)
10. [Security Architecture](#security-architecture)

---

## Architecture Overview

`@mcv/people` follows a **modular monolith** architecture within the MCV Turborepo. Each of the 8 submodules (directory, hiring, learning, leave, onboarding, org, performance, time) is a self-contained bounded context with its own schema, service layer, and event contracts — but all run within the same deployment unit and share a single PostgreSQL database (with schema isolation via the `people` schema prefix).

### Design Principles

| Principle | Implementation |
|---|---|
| **Domain-Driven Design** | Each submodule maps to a bounded context with clear aggregate roots (Person, Requisition, LeaveRequest, Timesheet, ReviewCycle, Course) |
| **Event-Driven Integration** | Inter-module communication via domain events on Redpanda/Kafka; no direct service-to-service calls between submodules |
| **CQRS (Lite)** | Write operations go through service classes; read-heavy queries (org chart, analytics) use materialized views and read replicas |
| **Multi-Tenant by Default** | Every table includes `ventureId`; every query is scoped via Supabase RLS policies |
| **PII-First Security** | Sensitive fields encrypted at the ORM layer before hitting the database; decryption requires explicit permissions |
| **Schema-Per-Module** | All tables prefixed with `people_` and organized by submodule for logical separation |
| **Event Sourcing (Selective)** | Employment history, org changes, leave accruals, and audit trails use event-sourcing patterns for complete traceability |

### Technology Stack

| Layer | Technology |
|---|---|
| **Runtime** | Next.js 15 (App Router) with server actions |
| **Build System** | Turborepo monorepo |
| **Database** | Supabase (PostgreSQL 15) with Row-Level Security |
| **ORM** | Drizzle ORM with type-safe schema definitions |
| **Validation** | Zod schemas for all inputs |
| **Event Bus** | Redpanda (Kafka-compatible) for domain events |
| **Cache** | Redis for hot data (career page, org chart, leave policies) |
| **AI** | OpenRouter for AI-powered features (resume screening, skill matching, talent insights) |
| **File Storage** | @mcv/fabric (S3-compatible) for encrypted document storage |
| **Search** | PostgreSQL full-text search with GIN indexes (directory); optional Elasticsearch for advanced search |

---

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                            @mcv/people — SYSTEM ARCHITECTURE                         │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐   │
│  │                              ENTRY POINTS                                      │   │
│  │                                                                                │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │   │
│  │  │  API Routes   │  │  Cron Jobs    │  │  Webhooks     │  │ NAOS Agents  │      │   │
│  │  │ /api/people   │  │  Accruals     │  │ ATS inbound   │  │  HR Agent    │      │   │
│  │  │ /api/hiring   │  │  Reviews      │  │ Background    │  │  Recruiter   │      │   │
│  │  │ /api/time     │  │  Reminders    │  │ Checks        │  │  Manager     │      │   │
│  │  └───────┬──────┘  └───────┬──────┘  └───────┬──────┘  └───────┬──────┘      │   │
│  │          │                  │                  │                  │              │   │
│  │          └──────────────────┴──────────────────┴──────────────────┘              │   │
│  │                                        │                                        │   │
│  │                              ┌─────────┴─────────┐                              │   │
│  │                              │  Auth Middleware    │                              │   │
│  │                              │  @mcv/identity      │                              │   │
│  │                              │  - JWT validation   │                              │   │
│  │                              │  - Tenant context   │                              │   │
│  │                              │  - RBAC check       │                              │   │
│  │                              └─────────┬─────────┘                              │   │
│  └────────────────────────────────────────┼────────────────────────────────────────┘   │
│                                           │                                            │
│  ┌────────────────────────────────────────┼────────────────────────────────────────┐   │
│  │                              SERVICE LAYER                                       │   │
│  │                                                                                  │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐                   │   │
│  │  │ Directory   │ │    Org     │ │   Hiring   │ │ Onboarding │                   │   │
│  │  │  Service    │ │  Service   │ │  Service   │ │  Service   │                   │   │
│  │  └──────┬─────┘ └──────┬─────┘ └──────┬─────┘ └──────┬─────┘                   │   │
│  │         │               │              │               │                         │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐                   │   │
│  │  │   Leave    │ │    Time    │ │Performance │ │  Learning  │                   │   │
│  │  │  Service   │ │  Service   │ │  Service   │ │  Service   │                   │   │
│  │  └──────┬─────┘ └──────┬─────┘ └──────┬─────┘ └──────┬─────┘                   │   │
│  │         │               │              │               │                         │   │
│  └─────────┼───────────────┼──────────────┼───────────────┼─────────────────────────┘   │
│            │               │              │               │                              │
│  ┌─────────┼───────────────┼──────────────┼───────────────┼─────────────────────────┐   │
│  │         │          DATA ACCESS LAYER   │               │                          │   │
│  │         │               │              │               │                          │   │
│  │  ┌──────┴──────────────┴──────────────┴───────────────┴──────┐                   │   │
│  │  │                     Drizzle ORM                             │                   │   │
│  │  │                                                            │                   │   │
│  │  │  - Type-safe schema definitions                            │                   │   │
│  │  │  - PII encryption interceptor (encrypt before write,       │                   │   │
│  │  │    decrypt after read with permission check)               │                   │   │
│  │  │  - Venture ID injection (automatic WHERE clause)           │                   │   │
│  │  │  - Audit logging interceptor                               │                   │   │
│  │  └──────────────────────┬─────────────────────────────────────┘                   │   │
│  │                         │                                                          │   │
│  │  ┌──────────────────────┴─────────────────────────────────────┐                   │   │
│  │  │                  Supabase PostgreSQL                         │                   │   │
│  │  │                                                             │                   │   │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │                   │   │
│  │  │  │Directory │ │   Org    │ │  Hiring  │ │Onboarding│     │                   │   │
│  │  │  │ 6 tables │ │ 7 tables │ │10 tables │ │ 8 tables │     │                   │   │
│  │  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘     │                   │   │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │                   │   │
│  │  │  │  Leave   │ │   Time   │ │Performnce│ │ Learning │     │                   │   │
│  │  │  │ 7 tables │ │ 6 tables │ │14 tables │ │12 tables │     │                   │   │
│  │  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘     │                   │   │
│  │  │                                                             │                   │   │
│  │  │  Row-Level Security (RLS) on ALL tables                    │                   │   │
│  │  │  60+ tables total, all venture_id scoped                   │                   │   │
│  │  └─────────────────────────────────────────────────────────────┘                   │   │
│  │                                                                                    │   │
│  └────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                           │
│  ┌────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                           CROSS-CUTTING CONCERNS                                    │   │
│  │                                                                                     │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │   │
│  │  │  Event Bus    │  │  Audit Log    │  │   Cache      │  │  File Store  │           │   │
│  │  │  Redpanda     │  │  @mcv/fabric  │  │   Redis      │  │ @mcv/fabric  │           │   │
│  │  │              │  │              │  │              │  │              │           │   │
│  │  │  40+ event   │  │  Every PII   │  │  Career page │  │  Employee   │           │   │
│  │  │  types       │  │  access      │  │  Org chart   │  │  documents  │           │   │
│  │  │  published   │  │  logged      │  │  Policies    │  │  Resumes    │           │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘           │   │
│  │                                                                                     │   │
│  └────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                           │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

### Request Processing Pipeline

```
Client Request
      │
      ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Next.js API  │────▶│  Auth Middle  │────▶│  Rate Limit  │
│  Route        │     │  - JWT parse  │     │  - Per user  │
│  /api/people  │     │  - Tenant ctx │     │  - Per route │
└──────────────┘     │  - RBAC check │     └──────┬───────┘
                     └──────────────┘              │
                                                   ▼
                     ┌──────────────┐     ┌──────────────┐
                     │  Zod Input    │────▶│  Service      │
                     │  Validation   │     │  Method       │
                     │  - Schema     │     │  - Business   │
                     │  - Sanitize   │     │    logic      │
                     └──────────────┘     │  - DB ops     │
                                          │  - Events     │
                                          └──────┬───────┘
                                                  │
                            ┌─────────────────────┼─────────────────────┐
                            │                     │                     │
                            ▼                     ▼                     ▼
                     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
                     │  Database     │     │  Event Bus   │     │  Audit Log   │
                     │  Write/Read   │     │  Publish     │     │  Record      │
                     │  (Drizzle)    │     │  (Redpanda)  │     │  (@mcv/      │
                     │              │     │              │     │   fabric)    │
                     └──────────────┘     └──────────────┘     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  Response     │
                     │  - Serialize  │
                     │  - PII mask   │
                     │  - Paginate   │
                     └──────────────┘
```

---

## Module Architecture

### Directory Module

**Bounded Context:** Person Registry — the golden record for all employees, contractors, interns, and advisors.

#### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DIRECTORY MODULE                           │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                 DirectoryService                         │ │
│  │                                                         │ │
│  │  createPerson()      ─── Validates, encrypts PII,      │ │
│  │                          generates EMP/CTR number,      │ │
│  │                          creates record, emits event    │ │
│  │                                                         │ │
│  │  updatePerson()      ─── Validates, diffs changes,     │ │
│  │                          auto-logs employment history,  │ │
│  │                          re-encrypts PII if changed     │ │
│  │                                                         │ │
│  │  searchPeople()      ─── Full-text search via GIN      │ │
│  │                          index, faceted filtering,      │ │
│  │                          venture-scoped                 │ │
│  │                                                         │ │
│  │  bulkImport()        ─── Streaming CSV/XLSX parse,     │ │
│  │                          all-or-nothing validation,     │ │
│  │                          batch insert                   │ │
│  │                                                         │ │
│  │  processDeleteRequest() ─ GDPR erasure: anonymize      │ │
│  │                            PII across all submodules,   │ │
│  │                            cascade to related records   │ │
│  └────────────────────────────────────────────────────────┘ │
│                           │                                  │
│  ┌────────────────────────┴───────────────────────────────┐ │
│  │                 Database Tables                          │ │
│  │                                                         │ │
│  │  people_persons             ── Core person record       │ │
│  │  people_person_profiles     ── Extended profile data    │ │
│  │  people_person_skills       ── Skills & certifications  │ │
│  │  people_person_documents    ── Document attachments     │ │
│  │  people_emergency_contacts  ── Emergency contacts       │ │
│  │  people_employment_history  ── Status change log        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Domain Events:                                              │
│  - person.created                                            │
│  - person.updated                                            │
│  - person.deactivated                                        │
│  - person.pii_accessed                                       │
│  - person.bulk_imported                                      │
│  - person.gdpr_deleted                                       │
│  - skill.added / skill.endorsed                              │
│  - document.uploaded / document.verified                     │
└─────────────────────────────────────────────────────────────┘
```

#### Employee Number Generation

```typescript
// Auto-numbering strategy — venture-scoped, zero-padded 6-digit sequence
const generateEmployeeNumber = async (ventureId: string, type: EmploymentType) => {
  const prefix = type === 'contractor' ? 'CTR' : 'EMP';
  const sequence = await db.execute(sql`
    SELECT nextval(pg_get_serial_sequence('people_person_sequences', '${prefix}_${ventureId}'))
  `);
  return `${prefix}-${String(sequence).padStart(6, '0')}`;
  // e.g., "EMP-000042", "CTR-000007"
};
```

#### PII Encryption Flow

```
┌─────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Service  │────▶│ PII Encrypt  │────▶│   Drizzle    │────▶│  PostgreSQL  │
│ Layer    │     │ Interceptor  │     │   ORM        │     │  (encrypted) │
│          │     │              │     │              │     │              │
│ Raw data │     │ AES-256-GCM  │     │ INSERT/      │     │ Ciphertext   │
│          │     │ per field    │     │ UPDATE       │     │ stored       │
└─────────┘     └──────────────┘     └──────────────┘     └──────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌─────────┐
│  PostgreSQL  │────▶│   Drizzle    │────▶│ PII Decrypt  │────▶│ Service │
│  (encrypted) │     │   ORM        │     │ Interceptor  │     │ Layer   │
│              │     │              │     │              │     │         │
│ Ciphertext   │     │ SELECT       │     │ Check perm:  │     │ Plain   │
│              │     │              │     │ people:pii:  │     │ text    │
│              │     │              │     │ read         │     │ (if     │
│              │     │              │     │ Decrypt or   │     │  perm)  │
│              │     │              │     │ return masked │     │         │
└──────────────┘     └──────────────┘     └──────────────┘     └─────────┘
```

**Encrypted PII Fields:**
- `ssn` — Social Security Number / National ID
- `taxId` — Tax identification number
- `personalEmail` — Personal (non-work) email
- `personalPhone` — Personal phone number
- `dateOfBirth` — Date of birth
- `salary` / `previousSalary` / `newSalary` — Compensation data
- `bankDetails` — Banking information for payroll
- `address` — Full mailing address
- `taxWithholding` — W-4 / TD1 withholding data
- Emergency contact `phone`, `alternatePhone`, `address`

#### Full-Text Search Architecture

```typescript
// GIN index-powered search with weighted ranking
const searchPeople = async (query: string, options: SearchOptions) => {
  const tsQuery = plainto_tsquery('english', query);
  
  return db.select()
    .from(people)
    .where(and(
      eq(people.ventureId, ctx.ventureId),
      sql`to_tsvector('english', 
        coalesce(${people.firstName}, '') || ' ' ||
        coalesce(${people.lastName}, '') || ' ' ||
        coalesce(${people.email}, '') || ' ' ||
        coalesce(${people.title}, '') || ' ' ||
        coalesce(${people.preferredName}, '')
      ) @@ ${tsQuery}`
    ))
    .orderBy(sql`ts_rank(to_tsvector('english', ...), ${tsQuery}) DESC`)
    .limit(options.limit ?? 25);
};
```

---

### Hiring Module

**Bounded Context:** Applicant Tracking — Full recruiting lifecycle from requisition to hire.

#### Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           HIRING MODULE                                   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                      HiringService                                │   │
│  │                                                                   │   │
│  │  Requisition Flow:                                                │   │
│  │    createRequisition → submitForApproval → approveRequisition     │   │
│  │                                                                   │   │
│  │  Posting Flow:                                                    │   │
│  │    createJobPosting → publishJobPosting → closeJobPosting         │   │
│  │                                                                   │   │
│  │  Application Flow:                                                │   │
│  │    submitApplication → moveToStage(×N) → reject/offer            │   │
│  │                                                                   │   │
│  │  Interview Flow:                                                  │   │
│  │    scheduleInterview → submitScorecard(×N) → advance             │   │
│  │                                                                   │   │
│  │  Offer Flow:                                                      │   │
│  │    createOffer → submitForApproval → sendOffer → accept/decline   │   │
│  │                                                                   │   │
│  │  Conversion:                                                      │   │
│  │    convertToEmployee → Creates Person + Triggers Onboarding       │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Pipeline State Machine:                                                 │
│                                                                          │
│    ┌─────────┐ publish ┌──────────┐ apply  ┌───────────┐               │
│    │REQ OPEN │────────▶│JOB POSTED│───────▶│  APPLIED  │               │
│    └─────────┘         └──────────┘        └─────┬─────┘               │
│                                                   │                     │
│                                              screen│                    │
│                                                   ▼                     │
│    ┌──────────┐   reject  ┌───────────┐ advance ┌───────────┐         │
│    │ REJECTED │◀──────────│ SCREENING │────────▶│INTERVIEWING│         │
│    └──────────┘           └───────────┘         └─────┬─────┘         │
│         ▲                                             │                │
│         │  reject                           scorecards│                │
│         │                                             ▼                │
│         ├──────────────────────────────── ┌───────────┐               │
│         │                                 │OFFER STAGE│               │
│         │                                 └─────┬─────┘               │
│         │                                       │                     │
│         │                                 send  │                     │
│         │                                       ▼                     │
│    ┌──────────┐  declined  ┌───────────┐                              │
│    │ DECLINED │◀───────────│  OFFERED  │                              │
│    └──────────┘            └─────┬─────┘                              │
│                                  │                                    │
│                            accept│                                    │
│                                  ▼                                    │
│                            ┌───────────┐                              │
│                            │   HIRED   │──▶ Person Record Created    │
│                            └───────────┘──▶ Onboarding Triggered     │
│                                                                       │
│  Database: 10 tables                                                  │
│  requisitions, job_postings, candidates, applications, interviews,   │
│  interview_scorecards, offers, hiring_pipelines, pipeline_stages,    │
│  referrals                                                            │
│                                                                       │
│  Domain Events:                                                       │
│  - requisition.created / .approved / .filled                         │
│  - posting.published / .closed                                       │
│  - application.submitted / .stage_changed / .rejected / .hired       │
│  - interview.scheduled / .completed / .cancelled                     │
│  - scorecard.submitted                                               │
│  - offer.created / .sent / .accepted / .declined                     │
│  - candidate.converted_to_employee                                    │
└──────────────────────────────────────────────────────────────────────┘
```

#### Candidate Deduplication Strategy

```typescript
// When a new application is submitted, check for existing candidate by email
const submitApplication = async (input: CreateApplicationInput) => {
  let candidate = await db.select()
    .from(candidates)
    .where(and(
      eq(candidates.ventureId, ctx.ventureId),
      eq(candidates.email, input.email.toLowerCase())
    ))
    .limit(1);

  if (candidate) {
    // Link to existing candidate, increment totalApplications
    await db.update(candidates)
      .set({ totalApplications: sql`total_applications + 1` })
      .where(eq(candidates.id, candidate.id));
  } else {
    // Create new candidate record
    candidate = await db.insert(candidates).values({
      ventureId: ctx.ventureId,
      ...input.candidateData,
      totalApplications: 1,
    }).returning();
  }

  // Create application linked to candidate
  const application = await db.insert(applications).values({
    ventureId: ctx.ventureId,
    candidateId: candidate.id,
    requisitionId: input.requisitionId,
    applicationNumber: await generateApplicationNumber(),
    status: 'applied',
    appliedAt: new Date(),
    ...input.applicationData,
  }).returning();

  // Emit event
  await eventBus.publish('application.submitted', {
    applicationId: application.id,
    candidateId: candidate.id,
    requisitionId: input.requisitionId,
  });

  // Execute auto-actions for "Applied" stage
  await executeStageAutoActions(application.id, 'applied');

  return application;
};
```

#### Offer-to-Employee Atomic Conversion

```typescript
// Atomically converts an accepted offer into a person record + onboarding plan
const convertToEmployee = async (offerId: string) => {
  return db.transaction(async (tx) => {
    // 1. Validate offer is accepted
    const offer = await tx.select().from(offers).where(eq(offers.id, offerId));
    if (offer.status !== 'accepted') throw new Error('Offer must be accepted');

    // 2. Get candidate data
    const candidate = await tx.select().from(candidates).where(eq(candidates.id, offer.candidateId));

    // 3. Create person record in directory
    const person = await directoryService.createPerson({
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      email: candidate.email,
      employmentType: offer.employmentType,
      title: offer.title,
      departmentId: offer.departmentId,
      managerId: offer.managerId,
      hireDate: offer.startDate,
      salary: offer.salary,
      status: 'pending',  // Until onboarding complete
    }, { tx });

    // 4. Update requisition filledCount
    await tx.update(requisitions)
      .set({ filledCount: sql`filled_count + 1` })
      .where(eq(requisitions.id, offer.requisitionId));

    // 5. Auto-generate onboarding plan
    const onboardingPlan = await onboardingService.createOnboardingPlan(person.id, {
      startDate: offer.startDate,
      departmentId: offer.departmentId,
      employmentType: offer.employmentType,
    }, { tx });

    // 6. Initialize leave balances based on jurisdiction
    await leaveService.initializeBalances(person.id, { tx });

    // 7. Emit events
    await eventBus.publish('candidate.converted_to_employee', {
      personId: person.id,
      offerId: offer.id,
      requisitionId: offer.requisitionId,
      onboardingPlanId: onboardingPlan.id,
    });

    return { person, onboardingPlan };
  });
};
```

---

### Learning Module

**Bounded Context:** Learning Management — Course delivery, certifications, skill development, and compliance training.

#### Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          LEARNING MODULE                                  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                     LearningService                               │   │
│  │                                                                   │   │
│  │  Course Lifecycle:                                                │   │
│  │    createCourse → addModules → publish → archive                  │   │
│  │                                                                   │   │
│  │  Enrollment Flow:                                                 │   │
│  │    enrollInCourse → trackProgress → recordCompletion              │   │
│  │                                                                   │   │
│  │  Learning Paths:                                                  │   │
│  │    createLearningPath → addCourses → enrollPath                   │   │
│  │                                                                   │   │
│  │  Certification:                                                   │   │
│  │    issueCertification → trackExpiry → renewCertification          │   │
│  │                                                                   │   │
│  │  Compliance:                                                      │   │
│  │    assignComplianceTraining → enforceDeadline → trackCompletion   │   │
│  │                                                                   │   │
│  │  Analytics:                                                       │   │
│  │    analyzeSkillGaps → recommendCourses → measureROI               │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Skill Gap Analysis Flow:                                                │
│                                                                          │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐      │
│  │ Position │     │ Person   │     │  Gap     │     │ Course   │      │
│  │ Required │────▶│ Current  │────▶│ Analysis │────▶│ Recommend│      │
│  │ Skills   │     │ Skills   │     │          │     │ ations   │      │
│  └──────────┘     └──────────┘     └──────────┘     └──────────┘      │
│                                                                          │
│  Database: 12 tables                                                     │
│  courses, course_modules, course_enrollments, course_completions,       │
│  learning_paths, learning_path_courses, certifications,                 │
│  person_certifications, training_budgets, training_budget_allocations,  │
│  skill_gap_analyses, compliance_training_requirements                   │
│                                                                          │
│  Domain Events:                                                          │
│  - course.created / .published / .archived                              │
│  - enrollment.started / .completed / .dropped                           │
│  - certification.issued / .expired / .renewed / .revoked               │
│  - compliance.assigned / .completed / .overdue                          │
│  - skill_gap.identified / .resolved                                     │
└──────────────────────────────────────────────────────────────────────────┘
```

#### Certification Lifecycle

```
┌───────────┐  issue   ┌───────────┐  expiry    ┌───────────┐
│  Course   │─────────▶│  ACTIVE   │───────────▶│  EXPIRED  │
│  Completed│          │           │             │           │
└───────────┘          └─────┬─────┘             └─────┬─────┘
                             │                         │
                         revoke│                   renew│
                             ▼                         ▼
                       ┌───────────┐             ┌───────────┐
                       │  REVOKED  │             │  ACTIVE   │
                       │           │             │ (renewed) │
                       └───────────┘             └───────────┘
```

---

### Leave Module

**Bounded Context:** Leave Management — Multi-jurisdiction PTO, accruals, approvals, and balance tracking.

#### Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           LEAVE MODULE                                    │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                      LeaveService                                 │   │
│  │                                                                   │   │
│  │  Request Flow:                                                    │   │
│  │    createLeaveRequest → validate → approveLeaveRequest            │   │
│  │                                                                   │   │
│  │  Balance Management:                                              │   │
│  │    getLeaveBalances → adjustBalance → processYearEndCarryOver     │   │
│  │                                                                   │   │
│  │  Accrual Processing:                                              │   │
│  │    runAccruals (cron) → calculate per policy → credit balances    │   │
│  │                                                                   │   │
│  │  Policy Engine:                                                   │   │
│  │    getApplicablePolicy → match jurisdiction → apply tenure tiers  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Jurisdiction-Aware Policy Matching:                                     │
│                                                                          │
│  ┌──────────┐     ┌──────────────┐     ┌──────────────┐                │
│  │ Person   │     │ Jurisdiction │     │   Policy     │                │
│  │ Record   │────▶│ Code Match   │────▶│   Rules      │                │
│  │          │     │              │     │              │                │
│  │ country: │     │ US-CA match? │     │ Entitlement  │                │
│  │ "US"     │     │ US match?    │     │ Accrual rate │                │
│  │ state:   │     │ Default?     │     │ Tenure tiers │                │
│  │ "CA"     │     │              │     │ Carry-over   │                │
│  │ juris:   │     │ Most specific│     │ constraints  │                │
│  │ "US-CA"  │     │ policy wins  │     │              │                │
│  └──────────┘     └──────────────┘     └──────────────┘                │
│                                                                          │
│  Balance Calculation:                                                    │
│                                                                          │
│    available = entitled + carriedOver + accrued + adjustment             │
│              - used - pending                                            │
│                                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │Entitled  │+ │CarriedOvr│+ │ Accrued  │+ │Adjustment│               │
│  │(annual)  │  │(prev yr) │  │(YTD)     │  │(manual)  │               │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘               │
│       ─ ┌──────────┐  ─ ┌──────────┐  = ┌──────────┐                  │
│         │   Used   │    │ Pending  │    │Available │                  │
│         │(taken)   │    │(awaiting │    │(can use) │                  │
│         │          │    │ approval)│    │          │                  │
│         └──────────┘    └──────────┘    └──────────┘                  │
│                                                                          │
│  Database: 7 tables                                                      │
│  leave_requests, leave_policies, leave_policy_rules,                    │
│  leave_balances, leave_accrual_logs, leave_blockout_dates,             │
│  public_holidays                                                         │
│                                                                          │
│  Domain Events:                                                          │
│  - leave.requested / .approved / .rejected / .cancelled / .taken        │
│  - leave.balance_updated / .accrual_processed / .carry_over_processed   │
│  - leave.blockout_created                                                │
└──────────────────────────────────────────────────────────────────────────┘
```

#### Accrual Processing Architecture

```typescript
// Cron job runs daily at 01:00 — processes accruals for all active employees
const runAccruals = async (asOfDate: Date = new Date()) => {
  const results: AccrualRunResult = { processed: 0, errors: [] };

  // Get all active employees with accrual-based policies
  const employees = await db.select()
    .from(people)
    .innerJoin(leaveBalances, eq(people.id, leaveBalances.personId))
    .innerJoin(leavePolicyRules, eq(leaveBalances.policyRuleId, leavePolicyRules.id))
    .where(and(
      eq(people.status, 'active'),
      eq(leavePolicyRules.entitlementType, 'accrued'),
      // Only process if accrual is due
      sql`${leaveBalances.lastAccrualDate} IS NULL 
        OR ${leaveBalances.lastAccrualDate} < ${getNextAccrualDate(leavePolicyRules.accrualFrequency)}`
    ));

  for (const employee of employees) {
    try {
      await db.transaction(async (tx) => {
        // Calculate accrual amount based on tenure tier
        const accrualDays = calculateAccrualAmount(employee, asOfDate);
        
        // Credit balance
        await tx.update(leaveBalances)
          .set({
            accrued: sql`accrued + ${accrualDays}`,
            available: sql`available + ${accrualDays}`,
            lastAccrualDate: asOfDate,
          })
          .where(eq(leaveBalances.id, employee.balanceId));

        // Log accrual for audit trail
        await tx.insert(leaveAccrualLogs).values({
          personId: employee.personId,
          leaveType: employee.leaveType,
          balanceId: employee.balanceId,
          accrualDate: asOfDate,
          daysAccrued: accrualDays,
          runningBalance: sql`(SELECT available FROM people_leave_balances WHERE id = ${employee.balanceId})`,
          source: 'scheduled_accrual',
        });

        results.processed++;
      });
    } catch (error) {
      results.errors.push({ personId: employee.personId, error: error.message });
    }
  }

  return results;
};
```

#### Year-End Carry-Over Processing

```typescript
// Processes carry-over for all employees at year end
const processYearEndCarryOver = async (year: number) => {
  const nextYear = year + 1;
  
  // For each employee's leave balance
  const balances = await db.select()
    .from(leaveBalances)
    .innerJoin(leavePolicies, /* join through rules */)
    .where(eq(leaveBalances.year, year));

  for (const balance of balances) {
    const unused = balance.available;
    const policy = balance.carryOverPolicy;
    
    // Calculate carry-over amount (respecting max limit)
    const carryOver = Math.min(
      unused,
      policy.maxCarryOverDays ?? Infinity
    );
    const forfeited = unused - carryOver;

    // Create next year's balance with carry-over
    await db.insert(leaveBalances).values({
      personId: balance.personId,
      leaveType: balance.leaveType,
      year: nextYear,
      entitled: calculateEntitlement(balance.personId, nextYear),
      carriedOver: carryOver,
      available: calculateEntitlement(balance.personId, nextYear) + carryOver,
    });

    // Log the carry-over and any forfeiture
    if (forfeited > 0) {
      await eventBus.publish('leave.balance_forfeited', {
        personId: balance.personId,
        leaveType: balance.leaveType,
        year,
        forfeited,
        carriedOver: carryOver,
      });
    }
  }
};
```

---

### Onboarding Module

**Bounded Context:** New Hire Onboarding — Structured workflows for getting new hires productive.

#### Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        ONBOARDING MODULE                                  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                   OnboardingService                               │   │
│  │                                                                   │   │
│  │  Plan Lifecycle:                                                  │   │
│  │    createOnboardingPlan → assignTasks → trackProgress → complete  │   │
│  │                                                                   │   │
│  │  Task Management:                                                 │   │
│  │    completeTask → skipTask → blockTask → reassignTask             │   │
│  │                                                                   │   │
│  │  Document Collection:                                             │   │
│  │    uploadDocument → verifyDocument → rejectDocument                │   │
│  │                                                                   │   │
│  │  Provisioning:                                                    │   │
│  │    requestEquipment → approveEquipment → deliverEquipment         │   │
│  │    requestAccess → approveAccess → provisionAccess                │   │
│  │                                                                   │   │
│  │  Milestones:                                                      │   │
│  │    30-day check-in → 60-day review → 90-day assessment            │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Auto-Plan Generation (triggered by hiring.convertToEmployee):           │
│                                                                          │
│  ┌──────────┐     ┌────────────────┐     ┌──────────────┐              │
│  │ Accepted │     │ Select Template│     │ Instantiate  │              │
│  │ Offer    │────▶│ by Dept +      │────▶│ Plan + Tasks │              │
│  │          │     │ Employment Type│     │              │              │
│  └──────────┘     └────────────────┘     └──────┬───────┘              │
│                                                  │                      │
│                          ┌───────────────────────┼─────────────┐        │
│                          │                       │             │        │
│                          ▼                       ▼             ▼        │
│                   ┌──────────┐          ┌──────────┐  ┌──────────┐    │
│                   │ HR Tasks │          │ IT Tasks │  │Mgr Tasks │    │
│                   │ (Day -5) │          │ (Day -3) │  │ (Day 1)  │    │
│                   │ Docs,    │          │ Laptop,  │  │ Welcome, │    │
│                   │ Benefits │          │ Accounts │  │ Buddy    │    │
│                   └──────────┘          └──────────┘  └──────────┘    │
│                                                                          │
│  Task Timeline with Pre-Start Support:                                   │
│                                                                          │
│  Day -7    Day -5     Day -3     Day -1    Day 1     Day 30   Day 90  │
│    │         │          │          │         │          │        │      │
│    ▼         ▼          ▼          ▼         ▼          ▼        ▼      │
│  ┌────┐  ┌────────┐ ┌────────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
│  │Req │  │Collect │ │Provisi│ │Ship  │ │Day 1 │ │30-day│ │90-day│  │
│  │eqip│  │docs    │ │on     │ │equip │ │orient│ │check │ │final │  │
│  │ment│  │        │ │access │ │      │ │      │ │-in   │ │assess│  │
│  └────┘  └────────┘ └────────┘ └──────┘ └──────┘ └──────┘ └──────┘  │
│                                                                          │
│  Database: 8 tables                                                      │
│  onboarding_checklists, onboarding_checklist_items, onboarding_plans,   │
│  onboarding_tasks, onboarding_documents, onboarding_equipment,          │
│  onboarding_access_requests, onboarding_milestones                      │
│                                                                          │
│  Domain Events:                                                          │
│  - onboarding.plan_created / .plan_completed / .plan_cancelled          │
│  - onboarding.task_completed / .task_overdue / .task_blocked            │
│  - onboarding.document_uploaded / .document_verified                    │
│  - onboarding.equipment_delivered / .access_provisioned                 │
│  - onboarding.milestone_due / .milestone_completed                      │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### Org Module

**Bounded Context:** Organizational Structure — Departments, teams, positions, and reporting lines.

#### Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                            ORG MODULE                                     │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                       OrgService                                  │   │
│  │                                                                   │   │
│  │  Structure Management:                                            │   │
│  │    createDepartment → nestDepartments → mergeDepartments          │   │
│  │    createTeam → addMembers → assignLead                           │   │
│  │    createPosition → defineSkills → setBands                       │   │
│  │                                                                   │   │
│  │  Reporting Lines:                                                 │   │
│  │    setReportingLine → solid (primary) / dotted (matrix)           │   │
│  │    getDirectReports → getReportingChain                           │   │
│  │                                                                   │   │
│  │  Org Chart:                                                       │   │
│  │    getOrgChart → recursive tree with lazy-loading                 │   │
│  │                                                                   │   │
│  │  Headcount:                                                       │   │
│  │    createHeadcountPlan → addLineItems → approveplan               │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Hierarchical Department Tree:                                           │
│                                                                          │
│             ┌──────────────────┐                                        │
│             │   Company (Root)  │                                        │
│             └────────┬─────────┘                                        │
│           ┌──────────┼──────────┐                                       │
│           ▼          ▼          ▼                                        │
│    ┌──────────┐ ┌──────────┐ ┌──────────┐                              │
│    │Engineering│ │ Product  │ │Operations│                              │
│    └────┬─────┘ └──────────┘ └──────────┘                              │
│    ┌────┼────────────┐                                                  │
│    ▼    ▼            ▼                                                  │
│  ┌────┐┌──────────┐┌──────┐                                            │
│  │Plat││Frontend  ││  AI  │                                            │
│  │form││          ││  /ML │                                            │
│  └────┘└──────────┘└──────┘                                            │
│                                                                          │
│  Matrix Reporting Support:                                               │
│                                                                          │
│  Person A ──solid──▶ Manager B (primary, handles reviews/leave)         │
│  Person A ─dotted──▶ Lead C (functional guidance for project X)         │
│  Person A ─dotted──▶ Mentor D (career development)                      │
│                                                                          │
│  Closure Table for Efficient Hierarchy Queries:                          │
│                                                                          │
│  ┌─────────────┬─────────────┬───────┐                                  │
│  │  ancestor    │ descendant  │ depth │                                  │
│  ├─────────────┼─────────────┼───────┤                                  │
│  │  Company     │ Company     │   0   │                                  │
│  │  Company     │ Engineering │   1   │                                  │
│  │  Company     │ Platform    │   2   │                                  │
│  │  Engineering │ Engineering │   0   │                                  │
│  │  Engineering │ Platform    │   1   │                                  │
│  │  Platform    │ Platform    │   0   │                                  │
│  └─────────────┴─────────────┴───────┘                                  │
│                                                                          │
│  Database: 7 tables                                                      │
│  departments, teams, positions, reporting_lines, org_changes,           │
│  headcount_plans, headcount_plan_lines                                  │
│                                                                          │
│  Domain Events:                                                          │
│  - org.department_created / .department_merged / .department_changed    │
│  - org.team_created / .team_member_added / .team_member_removed        │
│  - org.reporting_line_changed                                            │
│  - org.headcount_plan_approved                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

#### Org Chart Query Strategy

```typescript
// Materialized closure table for O(1) subtree queries
// Refreshed via trigger on department/reporting_line changes

const getOrgChart = async (options?: OrgChartOptions) => {
  const rootId = options?.rootPersonId ?? await getCompanyHead();
  const maxDepth = options?.maxDepth ?? 3;  // Lazy-load beyond depth 3

  // Single query: get all people in the subtree up to maxDepth
  const nodes = await db.execute(sql`
    WITH RECURSIVE org_tree AS (
      SELECT p.*, 0 as depth
      FROM people_persons p
      WHERE p.id = ${rootId}
      
      UNION ALL
      
      SELECT p.*, ot.depth + 1
      FROM people_persons p
      JOIN people_reporting_lines rl ON rl.person_id = p.id
      JOIN org_tree ot ON rl.manager_id = ot.id
      WHERE rl.line_type = 'solid'
        AND rl.is_primary = true
        AND ot.depth < ${maxDepth}
    )
    SELECT * FROM org_tree
    ORDER BY depth, last_name
  `);

  return buildOrgChartTree(nodes, rootId);
};
```

---

### Performance Module

**Bounded Context:** Performance Management — Reviews, goals, feedback, PIPs, calibration, competencies.

#### Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                       PERFORMANCE MODULE                                  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                   PerformanceService                              │   │
│  │                                                                   │   │
│  │  Review Cycles:                                                   │   │
│  │    createReviewCycle → configureQuestions → launchCycle            │   │
│  │    → collectReviews → runCalibration → finalizeRatings            │   │
│  │                                                                   │   │
│  │  Goal Management:                                                 │   │
│  │    createGoal → addKeyResults → trackProgress → close             │   │
│  │    cascadeGoals: Company → Department → Team → Individual         │   │
│  │                                                                   │   │
│  │  Feedback Loop:                                                   │   │
│  │    submitFeedback → notify → acknowledge                          │   │
│  │    (continuous, not tied to review cycles)                         │   │
│  │                                                                   │   │
│  │  1-on-1 Tracking:                                                 │   │
│  │    createOneOnOne → addAgendaItems → recordNotes → trackActions   │   │
│  │                                                                   │   │
│  │  PIPs:                                                            │   │
│  │    createPip → setMilestones → checkIn → resolve/extend           │   │
│  │                                                                   │   │
│  │  Calibration:                                                     │   │
│  │    createSession → addRatings → discuss → finalizeNormalization   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  360° Review Data Flow:                                                  │
│                                                                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐         │
│  │   Self   │    │ Manager  │    │   Peer   │    │  Upward  │         │
│  │ Review   │    │ Review   │    │ Review(s)│    │ Review(s)│         │
│  └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘         │
│       │               │              │               │                 │
│       └───────────────┴──────────────┴───────────────┘                 │
│                                  │                                      │
│                                  ▼                                      │
│                         ┌────────────────┐                              │
│                         │  Calibration   │                              │
│                         │  Session       │                              │
│                         │                │                              │
│                         │ Cross-team     │                              │
│                         │ normalization  │                              │
│                         └────────┬───────┘                              │
│                                  │                                      │
│                                  ▼                                      │
│                         ┌────────────────┐                              │
│                         │ Final Rating   │                              │
│                         │ + Feedback     │                              │
│                         │ Delivered      │                              │
│                         └────────────────┘                              │
│                                                                          │
│  OKR Cascading Model:                                                    │
│                                                                          │
│  ┌─────────────────────────────────────────────────┐                    │
│  │ Company OKR: "Grow revenue 40% YoY"             │                    │
│  └──────────────────────┬──────────────────────────┘                    │
│                         │                                                │
│        ┌────────────────┼────────────────┐                              │
│        ▼                ▼                ▼                               │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐                           │
│  │Dept OKR:  │  │Dept OKR:  │  │Dept OKR:  │                           │
│  │"Ship v2.0"│  │"50 new    │  │"Hire 30   │                           │
│  │           │  │ clients"  │  │ engineers" │                           │
│  └─────┬─────┘  └───────────┘  └─────┬─────┘                           │
│        │                              │                                  │
│  ┌─────┴─────┐                 ┌─────┴─────┐                           │
│  │Team OKR:  │                 │Team OKR:  │                           │
│  │"Complete  │                 │"Close 15  │                           │
│  │ API layer"│                 │ reqs by Q2"│                           │
│  └─────┬─────┘                 └───────────┘                           │
│        │                                                                 │
│  ┌─────┴─────┐                                                          │
│  │Individual:│                                                          │
│  │"Design &  │                                                          │
│  │ implement │                                                          │
│  │ auth API" │                                                          │
│  └───────────┘                                                          │
│                                                                          │
│  Database: 14 tables                                                     │
│  review_cycles, reviews, review_questions, review_responses,            │
│  goals, goal_key_results, feedback_entries, one_on_ones,                │
│  one_on_one_agenda_items, pips, pip_milestones,                         │
│  calibration_sessions, calibration_ratings,                             │
│  competency_frameworks, competency_levels                               │
│                                                                          │
│  Domain Events:                                                          │
│  - review.cycle_launched / .submitted / .calibrated / .finalized        │
│  - goal.created / .progress_updated / .completed / .at_risk            │
│  - feedback.submitted / .acknowledged                                    │
│  - pip.created / .milestone_checked / .resolved / .extended            │
│  - calibration.session_started / .session_completed                     │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### Time Module

**Bounded Context:** Time & Attendance — Time tracking, timesheets, overtime, payroll feeds.

#### Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           TIME MODULE                                     │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                      TimeService                                  │   │
│  │                                                                   │   │
│  │  Time Entry:                                                      │   │
│  │    createTimeEntry / startTimer / stopTimer                       │   │
│  │    Sources: manual, timer, calendar_sync, API integration         │   │
│  │                                                                   │   │
│  │  Timesheet Flow:                                                  │   │
│  │    createTimesheet → addEntries → submit → approve → process      │   │
│  │                                                                   │   │
│  │  Overtime Calculation:                                            │   │
│  │    jurisdiction-aware: daily threshold, weekly threshold,         │   │
│  │    double-time (CA), weekend/holiday multipliers                  │   │
│  │                                                                   │   │
│  │  Payroll Feed Generation:                                         │   │
│  │    aggregate approved timesheets → apply OT rules →               │   │
│  │    format (CSV/JSON/ADP/Gusto) → generate feed → send            │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Timesheet Approval Flow:                                                │
│                                                                          │
│  ┌────────┐ submit ┌───────────┐ approve ┌──────────┐ payroll          │
│  │ DRAFT  │───────▶│ SUBMITTED │────────▶│ APPROVED │────────▶         │
│  │        │        │           │         │          │         │         │
│  │Employee│        │ Manager   │         │ Locked   │  ┌──────────┐   │
│  │enters  │        │ reviews   │         │ entries  │  │PROCESSED │   │
│  │time    │        │           │         │          │  │          │   │
│  └────────┘        └─────┬─────┘         └──────────┘  │Payroll   │   │
│                          │                              │feed sent │   │
│                    reject│                              └──────────┘   │
│                          ▼                                              │
│                   ┌───────────┐                                         │
│                   │ REJECTED  │                                         │
│                   │           │                                         │
│                   │ Employee  │                                         │
│                   │ revises   │──▶ back to DRAFT                       │
│                   └───────────┘                                         │
│                                                                          │
│  Overtime Calculation Engine:                                            │
│                                                                          │
│  ┌──────────────────────────────────────────────────┐                   │
│  │ Input: Time entries for period + jurisdiction     │                   │
│  ├──────────────────────────────────────────────────┤                   │
│  │ 1. Sort entries by date                           │                   │
│  │ 2. Apply daily threshold (8h → OT, 12h → 2x)    │                   │
│  │ 3. Apply weekly threshold (40h → OT)             │                   │
│  │ 4. Apply weekend/holiday multipliers             │                   │
│  │ 5. Check exempt employment types                 │                   │
│  ├──────────────────────────────────────────────────┤                   │
│  │ Output: { regularHours, overtimeHours,           │                   │
│  │           doubleTimeHours, holidayHours,         │                   │
│  │           totalCost }                             │                   │
│  └──────────────────────────────────────────────────┘                   │
│                                                                          │
│  Payroll Feed Generation Pipeline:                                       │
│                                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │ Approved │  │ Calculate│  │ Format   │  │ Generate │               │
│  │Timesheets│─▶│ Overtime │─▶│ per      │─▶│ & Store  │               │
│  │          │  │          │  │ target   │  │ Feed     │               │
│  │ Filter   │  │ Apply    │  │ (CSV,    │  │          │               │
│  │ by period│  │ rules    │  │  ADP,    │  │ Review   │               │
│  │          │  │          │  │  Gusto)  │  │ → Send   │               │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘               │
│                                                                          │
│  Database: 6 tables                                                      │
│  time_entries, timesheets, timesheet_lines, time_projects,              │
│  overtime_rules, payroll_feeds                                           │
│                                                                          │
│  Domain Events:                                                          │
│  - time.entry_created / .entry_updated / .timer_started / .timer_stopped│
│  - time.timesheet_submitted / .timesheet_approved / .timesheet_rejected │
│  - time.payroll_feed_generated / .payroll_feed_confirmed                │
│  - time.overtime_threshold_reached                                       │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Data Models (Drizzle ORM)

### Table Summary

| Module | Table | Primary Purpose | Row Estimate (per venture) |
|---|---|---|---|
| **directory** | `people_persons` | Core person records | 500 - 50,000 |
| | `people_person_profiles` | Extended profile data | 1:1 with persons |
| | `people_person_skills` | Skills & certifications | ~5 per person |
| | `people_person_documents` | Document attachments | ~10 per person |
| | `people_emergency_contacts` | Emergency contacts | ~2 per person |
| | `people_employment_history` | Employment event log | ~5 per person |
| **org** | `people_departments` | Department definitions | 10 - 500 |
| | `people_teams` | Team definitions | 20 - 1,000 |
| | `people_positions` | Position definitions | 20 - 500 |
| | `people_reporting_lines` | Manager relationships | 1-3 per person |
| | `people_org_changes` | Org change audit log | ~100/year |
| | `people_headcount_plans` | Workforce planning | ~4/year |
| | `people_headcount_plan_lines` | Plan line items | ~20 per plan |
| **hiring** | `people_requisitions` | Job requisitions | ~100/year |
| | `people_job_postings` | Public postings | ~80/year |
| | `people_candidates` | Candidate profiles | ~5,000/year |
| | `people_applications` | Candidate applications | ~10,000/year |
| | `people_interviews` | Interview sessions | ~3,000/year |
| | `people_interview_scorecards` | Interviewer scorecards | ~6,000/year |
| | `people_offers` | Job offers | ~200/year |
| | `people_hiring_pipelines` | Pipeline definitions | 3-10 |
| | `people_hiring_pipeline_stages` | Stage definitions | ~8 per pipeline |
| | `people_referrals` | Employee referrals | ~200/year |
| **onboarding** | `people_onboarding_checklists` | Checklist templates | 5-20 |
| | `people_onboarding_checklist_items` | Template items | ~30 per checklist |
| | `people_onboarding_plans` | Plan instances | ~100/year |
| | `people_onboarding_tasks` | Task instances | ~30 per plan |
| | `people_onboarding_documents` | Required docs | ~10 per plan |
| | `people_onboarding_equipment` | Equipment requests | ~3 per plan |
| | `people_onboarding_access_requests` | Access requests | ~8 per plan |
| | `people_onboarding_milestones` | 30/60/90 milestones | 3 per plan |
| **leave** | `people_leave_requests` | Leave requests | ~2,000/year |
| | `people_leave_policies` | Policy definitions | 5-20 |
| | `people_leave_policy_rules` | Per-type rules | ~10 per policy |
| | `people_leave_balances` | Current balances | ~5 per person/year |
| | `people_leave_accrual_logs` | Accrual audit trail | ~24 per person/year |
| | `people_leave_blockout_dates` | Blackout periods | ~5/year |
| | `people_public_holidays` | Public holidays | ~15 per jurisdiction/year |
| **time** | `people_time_entries` | Time entries | ~250 per person/year |
| | `people_timesheets` | Timesheets | ~52 per person/year |
| | `people_timesheet_lines` | Daily lines | ~5 per timesheet |
| | `people_time_projects` | Project allocation | 10-100 |
| | `people_overtime_rules` | Overtime rules | 5-15 |
| | `people_payroll_feeds` | Payroll exports | ~26/year |
| **performance** | `people_review_cycles` | Review cycle definitions | ~4/year |
| | `people_reviews` | Review submissions | ~4 per person/year |
| | `people_review_questions` | Question templates | ~15 per cycle |
| | `people_review_responses` | Per-question answers | ~15 per review |
| | `people_goals` | OKR/KPI goals | ~5 per person/year |
| | `people_goal_key_results` | Key results for OKRs | ~3 per goal |
| | `people_feedback_entries` | Continuous feedback | ~20 per person/year |
| | `people_one_on_ones` | 1-on-1 meeting records | ~26 per person/year |
| | `people_one_on_one_agenda_items` | Agenda items | ~4 per meeting |
| | `people_pips` | Performance improvement plans | ~5/year |
| | `people_pip_milestones` | PIP milestones | ~4 per PIP |
| | `people_calibration_sessions` | Rating calibration | ~4/year |
| | `people_calibration_ratings` | Per-person ratings | ~50 per session |
| | `people_competency_frameworks` | Competency definitions | 5-20 |
| | `people_competency_levels` | Level definitions | ~5 per framework |
| **learning** | `people_courses` | Course definitions | 50-500 |
| | `people_course_modules` | Course modules/lessons | ~8 per course |
| | `people_course_enrollments` | Enrollment records | ~3 per person/year |
| | `people_course_completions` | Completion records | ~2 per person/year |
| | `people_learning_paths` | Curated learning paths | 10-50 |
| | `people_learning_path_courses` | Path → course links | ~5 per path |
| | `people_certifications` | Certification definitions | 20-100 |
| | `people_person_certifications` | Issued certifications | ~2 per person |
| | `people_training_budgets` | Budget allocations | 1 per dept/year |
| | `people_training_budget_allocations` | Spend records | ~10 per budget |
| | `people_skill_gap_analyses` | Gap analysis records | ~1 per person/year |
| | `people_compliance_training_requirements` | Mandatory training | 10-30 |

### Base Columns Pattern

Every table in `@mcv/people` extends the `baseColumns` pattern from `@mcv/kernel`:

```typescript
// Shared base columns — applied to every table
const baseColumns = {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
};
```

### Entity Relationship Overview

```
                    ┌─────────────────────┐
                    │   people_persons    │ ◀── Golden Record
                    │   (directory)        │
                    └──────────┬──────────┘
                               │
          ┌────────────────────┼────────────────────────┐
          │                    │                         │
          ▼                    ▼                         ▼
  ┌───────────────┐  ┌───────────────┐        ┌───────────────┐
  │ person_       │  │ person_       │        │ employment_   │
  │ profiles      │  │ skills        │        │ history       │
  │ (1:1)         │  │ (1:N)         │        │ (1:N)         │
  └───────────────┘  └───────────────┘        └───────────────┘

  people_persons is referenced by:
  ├── org.departments (headId)
  ├── org.teams (leadId)
  ├── org.reporting_lines (personId, managerId)
  ├── hiring.requisitions (hiringManagerId, recruiterId)
  ├── hiring.applications (via candidateId → converted)
  ├── hiring.interviews (interviewerIds)
  ├── hiring.offers (managerId)
  ├── onboarding.plans (personId, buddyId)
  ├── onboarding.tasks (assigneeId)
  ├── leave.requests (personId, approverId, delegateTo)
  ├── leave.balances (personId)
  ├── time.entries (personId)
  ├── time.timesheets (personId, approvedBy)
  ├── performance.reviews (personId, reviewerId)
  ├── performance.goals (personId)
  ├── performance.feedback (fromPersonId, toPersonId)
  ├── performance.one_on_ones (managerId, reportId)
  ├── performance.pips (personId)
  ├── learning.enrollments (personId)
  └── learning.person_certifications (personId)
```

---

## Data Flow & Events

### Domain Event Catalog

`@mcv/people` publishes over 40 domain event types to the Redpanda event bus. All events follow a consistent envelope:

```typescript
interface PeopleEvent<T = unknown> {
  eventId: string;                  // UUID
  eventType: string;                // e.g., "people.person.created"
  version: number;                  // Schema version (1)
  timestamp: string;                // ISO 8601
  ventureId: string;                // Tenant context
  actorId: string;                  // User who triggered
  correlationId: string;            // Request correlation
  payload: T;                       // Event-specific data
  metadata: {
    source: 'people';
    module: string;                 // directory | hiring | leave | ...
  };
}
```

### Event Types by Module

| Module | Event | Triggered By | Consumers |
|---|---|---|---|
| **directory** | `person.created` | createPerson, convertToEmployee | onboarding, leave, time, analytics |
| | `person.updated` | updatePerson | analytics, connectors |
| | `person.deactivated` | deactivatePerson | leave (cancel pending), time (close timesheets), identity (disable account) |
| | `person.pii_accessed` | getPerson with PII | audit, compliance |
| | `person.gdpr_deleted` | processDeleteRequest | all modules (cascade cleanup) |
| **org** | `org.structure_changed` | createDepartment, mergeDepartments | analytics (headcount), identity (RBAC update) |
| | `org.reporting_line_changed` | setReportingLine | leave (new approver), performance (new reviewer) |
| **hiring** | `application.submitted` | submitApplication | recruiter notifications |
| | `offer.accepted` | recordOfferResponse | directory (create person), onboarding (create plan) |
| | `candidate.converted` | convertToEmployee | leave (init balances), time (enable tracking), performance (add to cycle) |
| **onboarding** | `onboarding.task_overdue` | Cron check | HR notifications, manager alerts |
| | `onboarding.plan_completed` | All required tasks done | directory (status → active) |
| **leave** | `leave.requested` | createLeaveRequest | Manager notification |
| | `leave.approved` | approveLeaveRequest | Calendar sync, team notification |
| | `leave.balance_updated` | Accrual, approval, carry-over | Analytics |
| **time** | `time.timesheet_submitted` | submitTimesheet | Manager notification |
| | `time.timesheet_approved` | approveTimesheet | Payroll processing |
| | `time.payroll_feed_generated` | generatePayrollFeed | Finance module |
| **performance** | `review.cycle_launched` | launchReviewCycle | All participants notified |
| | `review.submitted` | submitReview | Manager, HR |
| | `goal.at_risk` | Progress update | Manager alert |
| **learning** | `certification.expired` | Cron check | Person alert, compliance |
| | `compliance.overdue` | Deadline passed | Person alert, HR alert |

### Cross-Module Data Flow: Hire → Onboard → Active Employee

```
┌──────────────────────────────────────────────────────────────────────┐
│ HIRE-TO-ACTIVE WORKFLOW (Cross-Module Event Chain)                    │
│                                                                      │
│ hiring.offer.accepted                                                │
│   │                                                                  │
│   ├─▶ hiring.convertToEmployee() [TRANSACTION]                      │
│   │     ├─▶ directory.createPerson()          → person.created       │
│   │     ├─▶ onboarding.createOnboardingPlan() → onboarding.created  │
│   │     ├─▶ leave.initializeBalances()        → balance.initialized │
│   │     └─▶ requisition.filledCount++         → requisition.filled? │
│   │                                                                  │
│   │ person.created event consumed by:                                │
│   │   ├─▶ identity: link user account (if SSO match)                │
│   │   ├─▶ time: enable time tracking for person                     │
│   │   ├─▶ performance: add to current review cycle                  │
│   │   └─▶ analytics: update headcount dashboard                     │
│   │                                                                  │
│   │ onboarding.created event triggers:                               │
│   │   ├─▶ Assign tasks to HR, IT, Manager, Buddy                   │
│   │   ├─▶ Send welcome email to new hire                            │
│   │   ├─▶ Create equipment requests                                 │
│   │   └─▶ Create access requests                                    │
│   │                                                                  │
│   │ [Days pass — tasks completed]                                    │
│   │                                                                  │
│   │ onboarding.plan_completed:                                       │
│   │   ├─▶ directory: update person status → 'active'                │
│   │   └─▶ analytics: onboarding time metric                        │
│   │                                                                  │
│   │ [Employee is now fully active]                                   │
│   │   ├─▶ Can submit leave requests                                 │
│   │   ├─▶ Can log time entries                                      │
│   │   ├─▶ Participates in review cycles                             │
│   │   └─▶ Can enroll in learning courses                            │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Integration Points

### @mcv/identity — User & Auth Integration

```typescript
// Person ↔ User linkage
// When a person is created, we optionally link to an existing identity user
// or create a new user account during onboarding access provisioning

interface PersonUserLink {
  personId: string;        // @mcv/people person record
  userId: string;          // @mcv/identity user account
  linkedAt: Date;
  linkedBy: string;        // 'system' | userId who linked
}

// Auth context provides:
// - ctx.userId — authenticated user
// - ctx.ventureId — current tenant (for RLS)
// - ctx.roles — ['hr_admin', 'department_manager', ...]
// - ctx.personId — linked person record (resolved from userId)
```

### @mcv/connectors — Payroll Integration

```typescript
// Payroll feed is generated by the time module and consumed by connectors
interface PayrollFeedExport {
  feedId: string;
  format: 'csv' | 'json' | 'adp' | 'gusto' | 'paychex';
  periodStart: Date;
  periodEnd: Date;
  employees: Array<{
    employeeNumber: string;
    regularHours: number;
    overtimeHours: number;
    doubleTimeHours: number;
    holidayHours: number;
    ptoHours: number;
    totalHours: number;
    billableHours: number;
    department: string;
    costCenter: string;
  }>;
}
```

### @mcv/operations — Project Staffing

```typescript
// Time entries reference operations projects for cross-module reporting
interface TimeProjectLink {
  peopleProjectId: string;      // people_time_projects.id
  operationsProjectId: string;  // @mcv/operations project ID
  syncEnabled: boolean;
  lastSyncAt: Date;
}

// Operations can query People for:
// - Available employees by skill/department
// - Current allocation (hours logged per project)
// - Team capacity (scheduled hours - leave - allocated)
```

### @mcv/fabric — Events, Audit, Storage

```typescript
// Event publishing pattern
await fabric.events.publish({
  topic: 'people.domain',
  key: person.ventureId,
  value: {
    eventType: 'person.created',
    payload: { personId, ventureId, employmentType },
  },
});

// Audit logging pattern (automatic via interceptor)
await fabric.audit.log({
  action: 'people.person.pii_read',
  actor: ctx.userId,
  resource: `person:${personId}`,
  fields: ['ssn', 'salary'],
  ip: ctx.ip,
  userAgent: ctx.userAgent,
});

// Document storage pattern
const url = await fabric.storage.upload({
  bucket: 'people-documents',
  key: `${ventureId}/${personId}/${documentId}`,
  file: encryptedBuffer,
  contentType: 'application/pdf',
  metadata: { encrypted: 'true', classification: 'confidential' },
});
```

---

## Performance & Scalability

### Performance Targets

| Operation | Target Latency | Strategy |
|---|---|---|
| Directory search | < 100ms (p95) | GIN index full-text search, result caching |
| Person profile load | < 50ms (p95) | Single query with joins, profile caching |
| Org chart render | < 500ms (p95) | Recursive CTE with depth limit, materialized closure table |
| Leave balance query | < 200ms (p95) | Pre-computed balances, no recalculation on read |
| Timesheet list | < 150ms (p95) | Partitioned by period, indexed by person + status |
| Review cycle load | < 300ms (p95) | Cursor-based pagination, lazy response loading |
| Bulk import (1K rows) | < 30s | Streaming CSV parser, batch insert |
| Career page listings | < 100ms (p95) | Redis cache with 5-minute TTL |
| Payroll feed generation | < 60s | Background job with progress tracking |
| Application pipeline | < 200ms (p95) | Indexed by requisition + status, eager-load stage |

### Scaling Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                     SCALING ARCHITECTURE                         │
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │  Application  │     │  Application  │     │  Application  │    │
│  │  Instance 1   │     │  Instance 2   │     │  Instance N   │    │
│  └──────┬───────┘     └──────┬───────┘     └──────┬───────┘    │
│         │                     │                     │            │
│         └─────────────────────┼─────────────────────┘            │
│                               │                                  │
│                    ┌──────────┴──────────┐                       │
│                    │   Connection Pool    │                       │
│                    │   (PgBouncer via     │                       │
│                    │    Supabase)         │                       │
│                    └──────────┬──────────┘                       │
│                               │                                  │
│              ┌────────────────┼────────────────┐                 │
│              │                │                │                 │
│              ▼                ▼                ▼                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Primary    │  │ Read Replica │  │ Read Replica │          │
│  │   Database   │  │      #1      │  │      #2      │          │
│  │              │  │              │  │              │          │
│  │  Writes      │  │ Analytics    │  │ Reporting    │          │
│  │  Reads       │  │ Queries      │  │ Queries      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐                             │
│  │   Redis      │  │  Background  │                             │
│  │   Cache      │  │  Job Queue   │                             │
│  │              │  │              │                             │
│  │ Career page  │  │ Bulk imports │                             │
│  │ Org chart    │  │ Payroll feeds│                             │
│  │ Policies     │  │ Accruals     │                             │
│  │ Holidays     │  │ Reports      │                             │
│  └──────────────┘  └──────────────┘                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Partitioning

```sql
-- Time entries partitioned by quarter for efficient range queries
CREATE TABLE people_time_entries (
  ...
) PARTITION BY RANGE (date);

CREATE TABLE people_time_entries_2026_q1 PARTITION OF people_time_entries
  FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');

CREATE TABLE people_time_entries_2026_q2 PARTITION OF people_time_entries
  FOR VALUES FROM ('2026-04-01') TO ('2026-07-01');

-- Leave accrual logs partitioned similarly
-- Application data partitioned by year
```

### Materialized Views

```sql
-- Org chart materialized view (refreshed on structure changes)
CREATE MATERIALIZED VIEW people_org_chart_mv AS
WITH RECURSIVE org_tree AS (
  SELECT id, first_name, last_name, title, department_id, manager_id, 0 as depth
  FROM people_persons WHERE manager_id IS NULL AND status = 'active'
  UNION ALL
  SELECT p.id, p.first_name, p.last_name, p.title, p.department_id, p.manager_id, ot.depth + 1
  FROM people_persons p
  JOIN org_tree ot ON p.manager_id = ot.id
  WHERE p.status = 'active'
)
SELECT * FROM org_tree;

-- Headcount rollup by department
CREATE MATERIALIZED VIEW people_headcount_mv AS
SELECT 
  department_id,
  COUNT(*) FILTER (WHERE status = 'active') as active_count,
  COUNT(*) FILTER (WHERE employment_type = 'full_time') as ft_count,
  COUNT(*) FILTER (WHERE employment_type = 'contractor') as contractor_count,
  COUNT(*) FILTER (WHERE status = 'active' AND hire_date > NOW() - INTERVAL '90 days') as new_hires_90d
FROM people_persons
GROUP BY department_id;
```

---

## Error Handling

### Error Code System

All errors follow the `PPL_XXX` code pattern with structured error responses:

```typescript
interface PeopleError {
  code: string;           // "PPL_004"
  name: string;           // "LEAVE_INSUFFICIENT_BALANCE"
  message: string;        // Human-readable description
  httpStatus: number;     // 400, 404, 409, etc.
  details?: Record<string, unknown>;  // Additional context
}

// Example error response
{
  "error": {
    "code": "PPL_004",
    "name": "LEAVE_INSUFFICIENT_BALANCE",
    "message": "Insufficient leave balance. Requested 5 days but only 2 days available.",
    "httpStatus": 400,
    "details": {
      "requested": 5,
      "available": 2,
      "leaveType": "vacation",
      "personId": "uuid-..."
    }
  }
}
```

### Error Catalog

| Code | Name | HTTP | Recovery Strategy |
|---|---|---|---|
| `PPL_001` | PERSON_NOT_FOUND | 404 | Verify person ID, check venture context |
| `PPL_002` | DUPLICATE_EMAIL | 409 | Use existing person or choose different email |
| `PPL_003` | INVALID_REPORTING_LINE | 400 | Fix circular reference in org structure |
| `PPL_004` | LEAVE_INSUFFICIENT_BALANCE | 400 | Check balance, request fewer days, or use unpaid |
| `PPL_005` | LEAVE_OVERLAP | 409 | Modify dates to avoid overlap with existing leave |
| `PPL_006` | TIMESHEET_ALREADY_SUBMITTED | 409 | Request manager rejection to re-edit |
| `PPL_007` | TIMESHEET_APPROVAL_DENIED | 403 | Must be the person's manager to approve |
| `PPL_008` | REVIEW_CYCLE_CLOSED | 400 | Contact HR to reopen cycle or wait for next |
| `PPL_009` | HIRING_PIPELINE_FULL | 400 | Close existing applications before adding new |
| `PPL_010` | ONBOARDING_TASK_DEPENDENCY | 400 | Complete prerequisite task first |
| `PPL_011` | IMPORT_VALIDATION_FAILED | 422 | Fix validation errors in import file and retry |
| `PPL_012` | PAYROLL_FEED_LOCKED | 409 | Feed already confirmed; create new feed if needed |
| `PPL_013` | ORG_DEPTH_EXCEEDED | 400 | Flatten hierarchy or increase max depth config |
| `PPL_014` | CERTIFICATION_EXPIRED | 400 | Renew certification before proceeding |
| `PPL_015` | PII_DECRYPTION_FAILED | 500 | Check encryption key configuration |

### Transaction Boundaries

Critical multi-step operations use database transactions to ensure atomicity:

```typescript
// Atomic operations (wrapped in transactions):
// - convertToEmployee (creates person + onboarding plan + leave balances)
// - bulkImport (all-or-nothing import)
// - processDeleteRequest (cascade anonymization across modules)
// - processYearEndCarryOver (balance creation + forfeiture logging)
// - mergeDepartments (transfer people + update references + audit log)

// Non-atomic operations (eventual consistency via events):
// - Notification delivery (fire-and-forget via event bus)
// - Calendar sync (async via @mcv/connectors)
// - Analytics aggregation (async via materialized view refresh)
```

---

## Observability

### Logging Strategy

```typescript
// Structured logging with correlation IDs
const logger = kernel.logger.child({
  module: 'people',
  submodule: 'leave',
});

logger.info('Leave request created', {
  requestId: request.id,
  personId: request.personId,
  leaveType: request.leaveType,
  days: request.totalDays,
  correlationId: ctx.correlationId,
});

// PII access logging (mandatory, audit-grade)
logger.audit('PII field accessed', {
  personId,
  fields: ['ssn', 'salary'],
  accessor: ctx.userId,
  ip: ctx.ip,
  reason: 'hr_admin_review',
});
```

### Metrics

| Metric | Type | Description |
|---|---|---|
| `people.directory.search_latency_ms` | Histogram | Directory search response time |
| `people.leave.requests_total` | Counter | Leave requests by type and status |
| `people.time.entries_total` | Counter | Time entries created |
| `people.hiring.applications_total` | Counter | Applications by source and status |
| `people.hiring.time_to_fill_days` | Histogram | Days from requisition open to fill |
| `people.onboarding.completion_days` | Histogram | Days to complete onboarding |
| `people.performance.review_completion_rate` | Gauge | Percentage of reviews submitted on time |
| `people.learning.enrollment_rate` | Gauge | Course enrollment rate |
| `people.pii.access_count` | Counter | PII field access count by field and actor |
| `people.errors_total` | Counter | Errors by code |

### Health Checks

```typescript
// /api/people/health
const healthCheck = async () => ({
  status: 'healthy',
  version: '1.0.0',
  uptime: process.uptime(),
  checks: {
    database: await checkDatabaseConnection(),
    cache: await checkRedisConnection(),
    eventBus: await checkRedpandaConnection(),
    encryption: await checkEncryptionKey(),
  },
  submodules: {
    directory: await checkDirectoryHealth(),
    org: await checkOrgHealth(),
    hiring: await checkHiringHealth(),
    onboarding: await checkOnboardingHealth(),
    leave: await checkLeaveHealth(),
    time: await checkTimeHealth(),
    performance: await checkPerformanceHealth(),
    learning: await checkLearningHealth(),
  },
});
```

### Alerting Rules

| Alert | Condition | Severity | Action |
|---|---|---|---|
| PII access spike | > 100 PII reads in 5 min by single user | Critical | Notify security team |
| Payroll feed failure | Feed generation fails | High | Notify HR admin + engineering |
| Leave accrual failure | Accrual cron errors > 0 | High | Investigate, manual rerun |
| Onboarding tasks overdue | > 10 overdue tasks venture-wide | Medium | Notify HR coordinator |
| Database latency | p95 > 500ms for 5 min | High | Scale read replicas |
| Encryption key missing | Health check fails | Critical | Block all PII operations |

---

## Security Architecture

### Defense in Depth

```
┌──────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                             │
│                                                               │
│  Layer 1: Network                                             │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ TLS 1.3 in transit, WAF, rate limiting               │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                               │
│  Layer 2: Authentication                                      │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ JWT via @mcv/identity, session timeout for PII ops   │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                               │
│  Layer 3: Authorization                                       │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ RBAC roles + RLS policies + manager hierarchy check  │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                               │
│  Layer 4: Data Protection                                     │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ AES-256-GCM per-field encryption, data masking       │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                               │
│  Layer 5: Audit                                               │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ Full audit trail on all PII access, tamper-proof log │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                               │
│  Layer 6: Compliance                                          │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ GDPR DSAR, right to erasure, data retention, residency│   │
│  └──────────────────────────────────────────────────────┘    │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Row-Level Security (RLS) Implementation

```sql
-- Every table gets venture isolation
ALTER TABLE people_persons ENABLE ROW LEVEL SECURITY;

-- Venture isolation policy (applied to ALL tables)
CREATE POLICY "venture_isolation" ON people_persons
  FOR ALL
  USING (venture_id = current_setting('app.current_venture_id')::uuid);

-- Manager hierarchy policy (for leave approvals, time approvals, reviews)
CREATE POLICY "manager_access" ON people_leave_requests
  FOR SELECT
  USING (
    person_id = current_setting('app.current_person_id')::uuid  -- Own requests
    OR approver_id = current_setting('app.current_person_id')::uuid  -- Assigned approver
    OR EXISTS (
      SELECT 1 FROM people_reporting_lines rl
      WHERE rl.manager_id = current_setting('app.current_person_id')::uuid
        AND rl.person_id = people_leave_requests.person_id
        AND rl.is_primary = true
    )  -- Direct manager
    OR has_role('hr_admin')  -- HR admin override
  );

-- PII field restriction
CREATE POLICY "pii_access" ON people_persons
  FOR SELECT
  USING (true)  -- Row visible
  -- PII columns are encrypted; decryption happens at ORM layer
  -- with explicit permission check (people:pii:read)
```

### Data Retention Architecture

```typescript
// Configurable retention policies
const DEFAULT_RETENTION = {
  // Active employee data: retained while employed
  activeEmployee: null,  // No expiry

  // Terminated employee records
  terminatedEmployee: {
    personalData: '7 years',     // Legal requirement (tax, employment records)
    piiFields: '90 days',        // Anonymize PII after 90 days post-term
    fullDeletion: '7 years',     // Complete record deletion
  },

  // Candidate/applicant data
  applicantData: {
    hired: 'converted to employee record',
    rejected: '2 years',         // For compliance and re-application
    withdrawn: '1 year',
  },

  // Audit logs
  auditLogs: '10 years',        // Compliance requirement

  // Time entries
  timeEntries: '7 years',       // Tax/payroll compliance
};

// Automated retention enforcement via cron
const enforceRetention = async () => {
  // 1. Find terminated employees past PII retention
  // 2. Anonymize PII fields (replace with hashes)
  // 3. Find applicants past retention
  // 4. Delete applicant records
  // 5. Log all actions to audit trail
};
```

### GDPR Data Subject Access Request (DSAR) Flow

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Employee │     │  HR Admin    │     │  People      │     │  Data Export │
│ Requests │────▶│  Verifies    │────▶│  Service     │────▶│  Package     │
│ Data     │     │  Identity    │     │  Collects    │     │  Generated   │
│ Export   │     │              │     │  All Data    │     │              │
└──────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                             │
                                    Collects from:
                                    ├── directory (profile, skills, docs)
                                    ├── org (department, team, position)
                                    ├── hiring (application history)
                                    ├── onboarding (plan, tasks)
                                    ├── leave (requests, balances)
                                    ├── time (entries, timesheets)
                                    ├── performance (reviews, goals, feedback)
                                    └── learning (enrollments, certifications)
```

---

*@mcv/people — People & HR Management Domain*