# @mcv/people/hiring

> **Recruiting & Hiring** — End-to-end talent acquisition platform with AI-powered resume parsing, multi-board job publishing, applicant tracking, interview orchestration, offer management, and hiring analytics.

**Module ID:** `@mcv/people/hiring`
**Tier:** 5 (Domain)
**Parent:** `@mcv/people`
**Status:** Stable
**Since:** 0.12.0
**Maintainers:** MCV People Team

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

The `@mcv/people/hiring` module provides a comprehensive talent acquisition system for multi-tenant organizations on the MCV.ONE platform. It replaces fragmented recruiting workflows — scattered across job boards, email inboxes, spreadsheets, and calendar tools — with a unified, auditable, and AI-augmented hiring pipeline.

### What It Does

1. **Job Posting Management** — Create rich job listings with structured requirements, compensation bands, and approval workflows. Publish simultaneously to LinkedIn, Indeed, Greenhouse, and your branded career page. Track views, clicks, and application rates per board.

2. **Applicant Tracking System (ATS)** — Full pipeline management from application receipt through screening, interview, offer, and hire/reject decisions. Visual kanban boards, bulk actions, automated stage transitions, and SLA tracking ensure no candidate falls through the cracks.

3. **AI-Powered Resume Parsing** — Extract structured data from resumes in any format (PDF, DOCX, plain text). Match skills against job requirements, score experience relevance, detect education credentials, and surface red flags — all powered by OpenRouter LLM integration.

4. **Interview Orchestration** — Schedule interviews with calendar integration (Google Calendar, Outlook), assign interviewers based on availability and expertise, distribute structured scorecards, collect feedback, and aggregate ratings for data-driven hiring decisions.

5. **Offer Management** — Generate offer letters from templates with dynamic compensation packages, route through approval chains, track negotiation history, and integrate with e-signature providers (DocuSign, HelloSign) for seamless close.

6. **Candidate Portal** — Self-service interface where candidates track application status, upload documents, schedule available interview slots, complete assessments, and communicate with recruiters.

7. **Referral Program** — Track employee referrals through the pipeline, manage referral bonuses with configurable rules (e.g., payout after 90-day retention), and surface referral pipeline analytics.

8. **Hiring Analytics** — Real-time dashboards covering time-to-hire, cost-per-hire, source effectiveness, pipeline conversion rates, interviewer calibration, diversity metrics, and offer acceptance rates.

9. **Talent Pool** — Build and nurture pools of passive candidates, silver medalists, and future prospects. Run targeted nurture campaigns, tag candidates by skills and interests, and re-engage when relevant roles open.

10. **Compliance Engine** — EEO/EEOC demographic tracking with voluntary self-identification, OFCCP audit readiness, configurable data retention policies, GDPR candidate data rights (access, portability, erasure), and full audit trails.

### Why It Exists

Hiring is one of the highest-leverage activities any organization undertakes, yet most recruiting tools are either prohibitively expensive enterprise suites or fragmented point solutions. This module provides:

- **Unified pipeline** — One system of record from job requisition to first-day onboarding handoff
- **AI augmentation** — Reduce recruiter toil on resume screening by 60-80% while improving match quality
- **Multi-tenant isolation** — Every tenant's candidates, jobs, and analytics are fully isolated via row-level security
- **Compliance by default** — EEO tracking, data retention, and audit trails are built in, not bolted on
- **Open integration** — Push/pull to any job board, calendar, or HRIS via typed adapters

### Design Principles

- **Candidate-centric** — The candidate experience drives UX decisions; every interaction should be respectful of their time
- **Data-driven** — Every stage transition, score, and decision is recorded for analytics and audit
- **Configurable pipelines** — Hiring stages are fully customizable per job or organization; no hardcoded workflows
- **AI-assisted, human-decided** — AI surfaces insights and recommendations; humans make all hiring decisions
- **Privacy-first** — Candidate PII is encrypted at rest, access-logged, and purgeable on demand

---

## Exports

```typescript
// === Primary Service ===
export { HiringService }             from './services/hiring.service';
export { HiringRouter }              from './router';

// === Job Postings ===
export { JobService }                from './services/job.service';
export { JobBoardPublisher }         from './services/job-board-publisher.service';
export { CareerPageService }         from './services/career-page.service';

// === Applicant Tracking ===
export { ApplicationService }        from './services/application.service';
export { PipelineService }           from './services/pipeline.service';
export { StageTransitionEngine }     from './services/stage-transition.engine';

// === Resume Parsing ===
export { ResumeParserService }       from './services/resume-parser.service';
export { SkillMatcherService }       from './services/skill-matcher.service';
export { ExperienceScorerService }   from './services/experience-scorer.service';

// === Interviews ===
export { InterviewService }          from './services/interview.service';
export { InterviewScheduler }        from './services/interview-scheduler.service';
export { ScorecardService }          from './services/scorecard.service';
export { FeedbackAggregator }        from './services/feedback-aggregator.service';

// === Offers ===
export { OfferService }              from './services/offer.service';
export { OfferLetterGenerator }      from './services/offer-letter-generator.service';
export { CompensationService }       from './services/compensation.service';

// === Candidate Portal ===
export { CandidatePortalService }    from './services/candidate-portal.service';
export { CandidateDocumentService }  from './services/candidate-document.service';

// === Referrals ===
export { ReferralService }           from './services/referral.service';
export { ReferralBonusEngine }       from './services/referral-bonus.engine';

// === Talent Pool ===
export { TalentPoolService }         from './services/talent-pool.service';
export { NurtureCampaignService }    from './services/nurture-campaign.service';

// === Analytics ===
export { HiringAnalyticsService }    from './services/hiring-analytics.service';
export { DiversityMetricsService }   from './services/diversity-metrics.service';
export { PipelineReportService }     from './services/pipeline-report.service';

// === Compliance ===
export { EEOComplianceService }      from './services/eeo-compliance.service';
export { DataRetentionService }      from './services/data-retention.service';
export { CandidateGDPRService }      from './services/candidate-gdpr.service';

// === Types ===
export type {
  Job,
  JobStatus,
  JobType,
  JobRequirement,
  JobCompensation,
  JobBoardConfig,
  Application,
  ApplicationStatus,
  ApplicationStage,
  Candidate,
  CandidateProfile,
  CandidateSource,
  ParsedResume,
  SkillMatch,
  ExperienceScore,
  Interview,
  InterviewType,
  InterviewSlot,
  InterviewerAssignment,
  Scorecard,
  ScorecardCriterion,
  ScorecardRating,
  Offer,
  OfferStatus,
  CompensationPackage,
  OfferApproval,
  Referral,
  ReferralStatus,
  ReferralBonus,
  TalentPool,
  TalentPoolMember,
  NurtureCampaign,
  HiringStage,
  HiringStageConfig,
  HiringAnalytics,
  TimeToHireMetric,
  CostPerHireMetric,
  SourceEffectiveness,
  PipelineConversion,
  DiversityMetric,
  EEORecord,
  CandidateDocument,
  CandidatePortalSession,
  CareerPageConfig,
} from './types';

// === Schemas (Drizzle) ===
export {
  jobs,
  applications,
  candidates,
  interviews,
  interviewScorecards,
  offers,
  referrals,
  talentPools,
  talentPoolMembers,
  hiringStages,
  jobBoards,
  candidateDocuments,
  eeoRecords,
  offerApprovals,
  nurtureCampaigns,
  hiringActivityLog,
} from './schema';

// === Adapters ===
export { LinkedInJobAdapter }        from './adapters/linkedin.adapter';
export { IndeedJobAdapter }          from './adapters/indeed.adapter';
export { GreenhouseJobAdapter }      from './adapters/greenhouse.adapter';
export { GoogleCalendarAdapter }     from './adapters/google-calendar.adapter';
export { OutlookCalendarAdapter }    from './adapters/outlook-calendar.adapter';
export { DocuSignAdapter }           from './adapters/docusign.adapter';
export { HelloSignAdapter }         from './adapters/hellosign.adapter';

// === Constants ===
export {
  HIRING_ERROR_CODES,
  DEFAULT_HIRING_STAGES,
  APPLICATION_STATUSES,
  JOB_TYPES,
  INTERVIEW_TYPES,
  OFFER_STATUSES,
  REFERRAL_STATUSES,
  CANDIDATE_SOURCES,
  MAX_RESUME_SIZE_MB,
  SUPPORTED_RESUME_FORMATS,
} from './constants';
```

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         @mcv/people/hiring                              │
│                                                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐ │
│  │  tRPC Router │  │ Career Page  │  │  Candidate   │  │  Webhooks    │ │
│  │  (Internal)  │  │ (Public API) │  │  Portal API  │  │  (Inbound)   │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
│         │                 │                  │                 │         │
│  ┌──────▼─────────────────▼──────────────────▼─────────────────▼──────┐ │
│  │                      HiringService (Orchestrator)                   │ │
│  └──┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬───────┘ │
│     │      │      │      │      │      │      │      │      │         │
│  ┌──▼──┐┌──▼──┐┌──▼───┐┌─▼──┐┌─▼───┐┌─▼──┐┌─▼───┐┌─▼──┐┌──▼────┐  │
│  │ Job ││ App ││Resume││Int ││Offer││Ref ││Talent││Ana ││Comply │  │
│  │ Svc ││ Svc ││Parser││Svc ││ Svc ││Svc ││Pool  ││lyti││ance   │  │
│  └──┬──┘└──┬──┘└──┬───┘└─┬──┘└─┬───┘└─┬──┘└─┬───┘└─┬──┘└──┬────┘  │
│     │      │      │      │     │      │     │      │      │        │
│  ┌──▼──────▼──────▼──────▼─────▼──────▼─────▼──────▼──────▼─────┐  │
│  │              Stage Transition Engine (FSM)                     │  │
│  └──────────────────────────┬────────────────────────────────────┘  │
│                             │                                       │
│  ┌──────────────────────────▼────────────────────────────────────┐  │
│  │                    Event Bus (Domain Events)                   │  │
│  │  application.received │ stage.changed │ interview.scheduled    │  │
│  │  offer.extended │ offer.accepted │ candidate.hired │ etc.     │  │
│  └──────────────────────────┬────────────────────────────────────┘  │
│                             │                                       │
│  ┌──────────────────────────▼────────────────────────────────────┐  │
│  │              External Adapters Layer                           │  │
│  │  ┌─────────┐ ┌────────┐ ┌──────────┐ ┌─────────┐ ┌────────┐ │  │
│  │  │LinkedIn │ │Indeed  │ │Greenhouse│ │Calendar │ │DocuSign│ │  │
│  │  │Adapter  │ │Adapter │ │Adapter   │ │Adapters │ │Adapter │ │  │
│  │  └─────────┘ └────────┘ └──────────┘ └─────────┘ └────────┘ │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              Supabase PostgreSQL (RLS per tenant)              │  │
│  │  jobs │ applications │ candidates │ interviews │ offers │ ... │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Request Flow

```
1. API Request (tRPC / Career Page / Candidate Portal / Webhook)
        │
2. Authentication & Tenant Resolution
        │
3. HiringService.method() — orchestration layer
        │
4. Domain Service — business logic (JobService, ApplicationService, etc.)
        │
5. Stage Transition Engine — validates and executes pipeline state changes
        │
6. Database Operations — Drizzle ORM with tenant-scoped queries
        │
7. Domain Events — emitted for side effects (notifications, analytics, webhooks)
        │
8. External Adapters — job board sync, calendar, e-signature (async)
        │
9. Response — typed result returned to caller
```

### Application Pipeline (Finite State Machine)

```
                    ┌─────────────────────────────────────────────────┐
                    │              APPLICATION PIPELINE                │
                    │                                                  │
  ┌──────────┐     │  ┌───────────┐    ┌───────────┐    ┌─────────┐ │
  │ APPLIED  │────▶│  │ SCREENING │───▶│ INTERVIEW │───▶│  OFFER  │ │
  └──────────┘     │  └─────┬─────┘    └─────┬─────┘    └────┬────┘ │
                   │        │                │               │      │
                   │        │  ┌─────────┐   │               │      │
                   │        └─▶│REJECTED │◀──┘               │      │
                   │           └─────────┘                   │      │
                   │                                         │      │
                   │        ┌──────────┐    ┌────────────┐   │      │
                   │        │ WITHDRAWN│    │   HIRED    │◀──┘      │
                   │        └──────────┘    └────────────┘          │
                   │             ▲               ▲                  │
                   │             │               │                  │
                   │        (any stage)    (offer accepted)         │
                   └─────────────────────────────────────────────────┘

  Custom stages can be inserted between SCREENING and INTERVIEW:
  e.g., PHONE_SCREEN → TECHNICAL_ASSESSMENT → PANEL_INTERVIEW → FINAL_ROUND
```

### Multi-Tenant Data Isolation

All hiring data is tenant-scoped via Supabase Row-Level Security (RLS):

```sql
-- Every hiring table includes tenant_id
-- RLS policies enforce tenant isolation at the database level
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON jobs
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Candidate portal uses candidate-scoped tokens
CREATE POLICY "candidate_portal_access" ON applications
  USING (
    candidate_id = current_setting('app.candidate_id')::uuid
    OR tenant_id = current_setting('app.tenant_id')::uuid
  );
```

### AI Integration Architecture

```
┌───────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Resume File  │────▶│ ResumeParserSvc  │────▶│  ParsedResume   │
│  (PDF/DOCX)   │     │  (text extract)  │     │  (structured)   │
└───────────────┘     └────────┬─────────┘     └────────┬────────┘
                               │                        │
                    ┌──────────▼─────────┐    ┌─────────▼────────┐
                    │  OpenRouter LLM    │    │ SkillMatcherSvc  │
                    │  (GPT-4 / Claude)  │    │ (score vs. job)  │
                    │  - entity extract  │    │ - skill overlap  │
                    │  - summarization   │    │ - experience fit │
                    │  - red flag detect │    │ - education req  │
                    └────────────────────┘    └──────────────────┘
```

The AI pipeline is designed for **graceful degradation**: if OpenRouter is unavailable, the system falls back to rule-based text extraction and keyword matching. AI-generated scores are always surfaced as recommendations, never as automated gates.

---

## Core Interfaces

### Job

```typescript
/**
 * Represents a job listing/requisition within the hiring system.
 * Jobs are the anchor entity — applications, interviews, and offers
 * all reference a specific job.
 */
interface Job {
  /** Unique job identifier */
  id: string;

  /** Owning tenant */
  tenantId: string;

  /** Human-readable job reference code (e.g., "ENG-2024-042") */
  referenceCode: string;

  /** Job title */
  title: string;

  /** Rich-text job description (HTML) */
  description: string;

  /** Plain-text summary for job boards with character limits */
  shortDescription: string;

  /** Department or team */
  departmentId: string | null;

  /** Hiring manager (user ID from @mcv/people/core) */
  hiringManagerId: string;

  /** Primary recruiter assigned */
  recruiterId: string | null;

  /** Job type */
  type: JobType;

  /** Work arrangement */
  workArrangement: 'onsite' | 'remote' | 'hybrid';

  /** Office location(s) — required for onsite/hybrid */
  locations: JobLocation[];

  /** Employment level */
  level: 'intern' | 'entry' | 'mid' | 'senior' | 'lead' | 'manager' | 'director' | 'vp' | 'c-level';

  /** Structured requirements */
  requirements: JobRequirement[];

  /** Compensation details */
  compensation: JobCompensation | null;

  /** Benefits highlights (free-form list) */
  benefits: string[];

  /** Headcount — how many positions to fill */
  headcount: number;

  /** Number of positions already filled for this job */
  filledCount: number;

  /** Custom hiring pipeline stages for this job (overrides org defaults) */
  customStages: HiringStageConfig[] | null;

  /** Job boards this is published to */
  publishedBoards: JobBoardPublication[];

  /** Career page visibility */
  showOnCareerPage: boolean;

  /** Application deadline (optional) */
  applicationDeadline: Date | null;

  /** Current status */
  status: JobStatus;

  /** Internal notes (not visible to candidates) */
  internalNotes: string | null;

  /** EEO job category for compliance */
  eeoCategory: string | null;

  /** Tags for filtering and search */
  tags: string[];

  /** Approval status for the requisition */
  approvalStatus: 'draft' | 'pending_approval' | 'approved' | 'rejected';

  /** Who approved the requisition */
  approvedBy: string | null;

  /** When the requisition was approved */
  approvedAt: Date | null;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  closedAt: Date | null;
  archivedAt: Date | null;
}

type JobStatus = 'draft' | 'pending_approval' | 'open' | 'paused' | 'closed' | 'archived';

type JobType = 'full_time' | 'part_time' | 'contract' | 'temporary' | 'internship' | 'freelance' | 'volunteer';

interface JobLocation {
  city: string;
  state: string | null;
  country: string;
  postalCode: string | null;
  timezone: string | null;
}

interface JobRequirement {
  /** Category: skill, education, experience, certification, language, other */
  category: 'skill' | 'education' | 'experience' | 'certification' | 'language' | 'other';

  /** Human-readable description */
  description: string;

  /** Is this a hard requirement or preferred? */
  priority: 'required' | 'preferred' | 'nice_to_have';

  /** Minimum years of experience (for experience-type requirements) */
  minYears: number | null;

  /** Structured skill tag for matching (e.g., "typescript", "react") */
  skillTag: string | null;
}

interface JobCompensation {
  /** Compensation type */
  type: 'salary' | 'hourly' | 'contract_rate';

  /** Currency code (ISO 4217) */
  currency: string;

  /** Minimum of range */
  min: number;

  /** Maximum of range */
  max: number;

  /** Pay period */
  period: 'annual' | 'monthly' | 'hourly' | 'weekly';

  /** Equity component */
  equity: {
    type: 'stock_options' | 'rsu' | 'phantom' | null;
    rangeMin: number | null;
    rangeMax: number | null;
    vestingSchedule: string | null;
  } | null;

  /** Bonus information */
  bonus: {
    type: 'signing' | 'annual' | 'performance';
    rangeMin: number | null;
    rangeMax: number | null;
  }[] | null;

  /** Whether to show compensation on public listing */
  showOnListing: boolean;
}

interface JobBoardPublication {
  /** Job board identifier */
  boardId: string;

  /** Board name (e.g., "LinkedIn", "Indeed") */
  boardName: string;

  /** External posting ID on the board */
  externalPostingId: string | null;

  /** Publication status */
  status: 'pending' | 'published' | 'expired' | 'removed' | 'error';

  /** Board-specific URL */
  externalUrl: string | null;

  /** When published */
  publishedAt: Date | null;

  /** When it expires */
  expiresAt: Date | null;

  /** Last sync timestamp */
  lastSyncedAt: Date | null;

  /** Error message if publication failed */
  errorMessage: string | null;
}
```

### Candidate

```typescript
/**
 * A candidate represents a person in the hiring system. A single candidate
 * can have multiple applications across different jobs. Candidates persist
 * across hiring cycles for talent pool management.
 */
interface Candidate {
  /** Unique candidate identifier */
  id: string;

  /** Owning tenant */
  tenantId: string;

  /** Full name */
  firstName: string;
  lastName: string;

  /** Contact information */
  email: string;
  phone: string | null;

  /** Location */
  city: string | null;
  state: string | null;
  country: string | null;
  timezone: string | null;

  /** Professional profile */
  profile: CandidateProfile;

  /** Original source of the candidate */
  source: CandidateSource;

  /** Source detail (e.g., specific job board name, referrer name) */
  sourceDetail: string | null;

  /** Referring employee ID (if source is 'referral') */
  referredBy: string | null;

  /** Tags for talent pool categorization */
  tags: string[];

  /** Internal recruiter notes */
  notes: string | null;

  /** Do-not-contact flag */
  doNotContact: boolean;

  /** GDPR consent tracking */
  gdprConsent: {
    given: boolean;
    consentDate: Date | null;
    consentMethod: string | null;
    retentionExpiresAt: Date | null;
  };

  /** Portal access */
  portalEnabled: boolean;
  portalLastLoginAt: Date | null;

  /** Resume metadata (latest) */
  latestResumeId: string | null;
  latestParsedResume: ParsedResume | null;

  /** Aggregate scoring across all applications */
  overallRating: number | null;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt: Date;
}

type CandidateSource =
  | 'direct_application'
  | 'referral'
  | 'linkedin'
  | 'indeed'
  | 'greenhouse'
  | 'career_page'
  | 'recruiter_sourced'
  | 'agency'
  | 'job_fair'
  | 'university'
  | 'internal_transfer'
  | 'social_media'
  | 'other';

interface CandidateProfile {
  /** Headline / current title */
  headline: string | null;

  /** Professional summary */
  summary: string | null;

  /** Current employer */
  currentCompany: string | null;

  /** Current title */
  currentTitle: string | null;

  /** Total years of professional experience */
  totalExperienceYears: number | null;

  /** Skills (normalized tags) */
  skills: string[];

  /** Education entries */
  education: {
    institution: string;
    degree: string;
    field: string | null;
    startYear: number | null;
    endYear: number | null;
  }[];

  /** Work experience entries */
  experience: {
    company: string;
    title: string;
    startDate: string | null;
    endDate: string | null;
    current: boolean;
    description: string | null;
  }[];

  /** Certifications */
  certifications: {
    name: string;
    issuer: string | null;
    issueDate: string | null;
    expiryDate: string | null;
  }[];

  /** Languages */
  languages: {
    language: string;
    proficiency: 'native' | 'fluent' | 'professional' | 'conversational' | 'basic';
  }[];

  /** Social/professional links */
  links: {
    type: 'linkedin' | 'github' | 'portfolio' | 'website' | 'twitter' | 'other';
    url: string;
  }[];

  /** Desired compensation (candidate-provided) */
  desiredCompensation: {
    currency: string;
    min: number;
    max: number | null;
    period: 'annual' | 'hourly';
  } | null;

  /** Work authorization */
  workAuthorization: string | null;

  /** Willing to relocate */
  willingToRelocate: boolean | null;

  /** Available start date */
  availableStartDate: Date | null;
}
```

### Application

```typescript
/**
 * An application links a candidate to a specific job and tracks their
 * progress through the hiring pipeline. This is the primary unit of
 * work in the ATS.
 */
interface Application {
  /** Unique application identifier */
  id: string;

  /** Owning tenant */
  tenantId: string;

  /** The job being applied to */
  jobId: string;

  /** The candidate applying */
  candidateId: string;

  /** Current pipeline stage */
  currentStageId: string;

  /** Current overall status */
  status: ApplicationStatus;

  /** Application source (may differ from candidate source) */
  source: CandidateSource;

  /** Source tracking UTM parameters or attribution */
  sourceAttribution: {
    utmSource: string | null;
    utmMedium: string | null;
    utmCampaign: string | null;
    referralId: string | null;
  } | null;

  /** AI-generated match score (0-100) */
  matchScore: number | null;

  /** AI match score breakdown */
  matchScoreDetails: {
    skillMatch: number;
    experienceMatch: number;
    educationMatch: number;
    overallFit: number;
    summary: string;
    strengths: string[];
    gaps: string[];
  } | null;

  /** Recruiter-assigned priority */
  priority: 'low' | 'normal' | 'high' | 'urgent';

  /** Assigned recruiter (may differ from job's recruiter) */
  assignedRecruiterId: string | null;

  /** Cover letter text */
  coverLetter: string | null;

  /** Custom application form responses */
  customFields: Record<string, unknown>;

  /** Rejection reason (if rejected) */
  rejectionReason: string | null;

  /** Rejection category for analytics */
  rejectionCategory: string | null;

  /** Whether rejection notification was sent */
  rejectionNotifiedAt: Date | null;

  /** Withdrawal reason (if withdrawn) */
  withdrawalReason: string | null;

  /** Internal notes */
  notes: ApplicationNote[];

  /** SLA tracking */
  sla: {
    /** Maximum days allowed at current stage */
    maxDaysAtStage: number | null;
    /** When the SLA for current stage expires */
    stageDeadline: Date | null;
    /** Whether the SLA is currently breached */
    breached: boolean;
  };

  /** History of stage transitions */
  stageHistory: StageTransition[];

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt: Date;
  submittedAt: Date;
  hiredAt: Date | null;
}

type ApplicationStatus =
  | 'active'
  | 'hired'
  | 'rejected'
  | 'withdrawn'
  | 'on_hold';

interface ApplicationNote {
  id: string;
  authorId: string;
  content: string;
  visibility: 'private' | 'team' | 'hiring_manager';
  createdAt: Date;
  updatedAt: Date;
}

interface StageTransition {
  fromStageId: string | null;
  toStageId: string;
  triggeredBy: string;
  reason: string | null;
  timestamp: Date;
  durationInStageMs: number | null;
}
```

### Interview

```typescript
/**
 * Represents a scheduled interview for an application. Supports multiple
 * interview types and multi-panel interviews with multiple interviewers.
 */
interface Interview {
  /** Unique interview identifier */
  id: string;

  /** Owning tenant */
  tenantId: string;

  /** The application this interview is for */
  applicationId: string;

  /** The job (denormalized for convenience) */
  jobId: string;

  /** The candidate (denormalized for convenience) */
  candidateId: string;

  /** Interview type */
  type: InterviewType;

  /** Human-readable title (e.g., "Technical Screen", "Culture Fit Panel") */
  title: string;

  /** Description / agenda */
  description: string | null;

  /** The hiring stage this interview belongs to */
  stageId: string;

  /** Round number (1 = first round, 2 = second, etc.) */
  round: number;

  /** Scheduling details */
  scheduledAt: Date | null;
  duration: number; // minutes
  timezone: string;

  /** Meeting details */
  meetingUrl: string | null;
  meetingProvider: 'google_meet' | 'zoom' | 'teams' | 'in_person' | 'phone' | 'other' | null;
  location: string | null;

  /** Calendar integration */
  calendarEventId: string | null;
  calendarProvider: 'google' | 'outlook' | null;

  /** Interviewers */
  interviewers: InterviewerAssignment[];

  /** Scorecard template to use */
  scorecardTemplateId: string | null;

  /** Interview status */
  status: 'pending' | 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

  /** Candidate confirmation */
  candidateConfirmedAt: Date | null;

  /** Rescheduling */
  rescheduledFrom: Date | null;
  rescheduleCount: number;

  /** Aggregate result after all scorecards submitted */
  aggregateRating: number | null;
  aggregateRecommendation: 'strong_hire' | 'hire' | 'no_decision' | 'no_hire' | 'strong_no_hire' | null;

  /** Feedback summary (AI-generated from all scorecards) */
  feedbackSummary: string | null;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}

type InterviewType =
  | 'phone_screen'
  | 'video_screen'
  | 'technical'
  | 'coding_challenge'
  | 'system_design'
  | 'behavioral'
  | 'culture_fit'
  | 'panel'
  | 'presentation'
  | 'case_study'
  | 'take_home'
  | 'final_round'
  | 'hiring_manager'
  | 'peer'
  | 'executive'
  | 'other';

interface InterviewerAssignment {
  /** User ID of the interviewer */
  userId: string;

  /** Role in the interview */
  role: 'lead' | 'participant' | 'observer' | 'shadow';

  /** Whether the interviewer has confirmed */
  confirmed: boolean;

  /** Scorecard ID once submitted */
  scorecardId: string | null;

  /** Whether scorecard has been submitted */
  scorecardSubmitted: boolean;

  /** Optional notes about why this interviewer was chosen */
  selectionReason: string | null;
}
```

### Scorecard

```typescript
/**
 * A structured evaluation form filled out by an interviewer after
 * conducting an interview. Scorecards enforce consistent evaluation
 * criteria and enable calibration analytics.
 */
interface Scorecard {
  /** Unique scorecard identifier */
  id: string;

  /** Owning tenant */
  tenantId: string;

  /** The interview this scorecard is for */
  interviewId: string;

  /** The application (denormalized) */
  applicationId: string;

  /** The interviewer who filled this out */
  interviewerId: string;

  /** Scorecard template used */
  templateId: string | null;

  /** Overall rating (1-5 scale) */
  overallRating: number;

  /** Overall recommendation */
  recommendation: 'strong_hire' | 'hire' | 'no_decision' | 'no_hire' | 'strong_no_hire';

  /** Individual criteria ratings */
  criteria: ScorecardCriterion[];

  /** Free-form strengths observed */
  strengths: string;

  /** Free-form concerns or areas of weakness */
  concerns: string;

  /** Overall comments */
  comments: string;

  /** Key quotes or moments from the interview */
  keyMoments: string | null;

  /** Submission status */
  status: 'draft' | 'submitted';

  /** Whether this scorecard is visible to other interviewers */
  visibleToPanel: boolean;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
  submittedAt: Date | null;
}

interface ScorecardCriterion {
  /** Criterion name (e.g., "Problem Solving", "Communication") */
  name: string;

  /** Category grouping */
  category: 'technical' | 'behavioral' | 'cultural' | 'leadership' | 'domain' | 'other';

  /** Rating (1-5) */
  rating: ScorecardRating;

  /** Weight of this criterion (0.0-1.0) */
  weight: number;

  /** Comments specific to this criterion */
  comments: string | null;
}

type ScorecardRating = 1 | 2 | 3 | 4 | 5;
// 1 = Does not meet expectations
// 2 = Partially meets expectations
// 3 = Meets expectations
// 4 = Exceeds expectations
// 5 = Exceptional
```

### Offer

```typescript
/**
 * Represents a formal job offer extended to a candidate. Includes
 * full compensation package, approval chain, and e-signature tracking.
 */
interface Offer {
  /** Unique offer identifier */
  id: string;

  /** Owning tenant */
  tenantId: string;

  /** The application this offer is for */
  applicationId: string;

  /** The job */
  jobId: string;

  /** The candidate */
  candidateId: string;

  /** Offer version (increments with each revision) */
  version: number;

  /** Current status */
  status: OfferStatus;

  /** Compensation package */
  compensation: CompensationPackage;

  /** Proposed start date */
  startDate: Date;

  /** Offer expiration date */
  expiresAt: Date;

  /** Job title (may differ from job listing title) */
  offerTitle: string;

  /** Department */
  departmentId: string | null;

  /** Reporting manager */
  reportingManagerId: string | null;

  /** Employment type */
  employmentType: JobType;

  /** Work arrangement */
  workArrangement: 'onsite' | 'remote' | 'hybrid';

  /** Work location */
  workLocation: string | null;

  /** Custom terms and conditions */
  customTerms: string | null;

  /** Offer letter document */
  offerLetterDocumentId: string | null;

  /** Offer letter template used */
  offerLetterTemplateId: string | null;

  /** Approval workflow */
  approvals: OfferApproval[];

  /** Whether all required approvals are obtained */
  fullyApproved: boolean;

  /** E-signature tracking */
  eSignature: {
    provider: 'docusign' | 'hellosign' | 'manual' | null;
    externalEnvelopeId: string | null;
    status: 'not_sent' | 'sent' | 'viewed' | 'signed' | 'declined' | 'voided' | null;
    sentAt: Date | null;
    signedAt: Date | null;
    signedDocumentUrl: string | null;
  };

  /** Negotiation history */
  negotiationHistory: {
    version: number;
    changedBy: string;
    changes: Record<string, { from: unknown; to: unknown }>;
    notes: string | null;
    timestamp: Date;
  }[];

  /** Extended by (user ID) */
  extendedBy: string;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
  extendedAt: Date | null;
  acceptedAt: Date | null;
  declinedAt: Date | null;
  revokedAt: Date | null;
}

type OfferStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'extended'
  | 'negotiating'
  | 'accepted'
  | 'declined'
  | 'revoked'
  | 'expired';

interface CompensationPackage {
  /** Base salary */
  baseSalary: {
    amount: number;
    currency: string;
    period: 'annual' | 'monthly' | 'hourly';
  };

  /** Signing bonus */
  signingBonus: {
    amount: number;
    currency: string;
    conditions: string | null;
  } | null;

  /** Annual bonus */
  annualBonus: {
    targetPercent: number;
    maxPercent: number | null;
    conditions: string | null;
  } | null;

  /** Equity */
  equity: {
    type: 'stock_options' | 'rsu' | 'phantom';
    amount: number;
    vestingSchedule: string;
    cliffMonths: number;
    vestingMonths: number;
    strikePrice: number | null;
  } | null;

  /** Relocation assistance */
  relocation: {
    amount: number;
    currency: string;
    description: string | null;
  } | null;

  /** Other benefits */
  additionalBenefits: {
    name: string;
    description: string;
    value: number | null;
  }[];

  /** PTO / vacation days */
  ptoDays: number | null;

  /** Total compensation estimate (annualized) */
  totalCompEstimate: number;
}

interface OfferApproval {
  /** Approval step order */
  order: number;

  /** Approver user ID */
  approverId: string;

  /** Approval status */
  status: 'pending' | 'approved' | 'rejected';

  /** Comments */
  comments: string | null;

  /** Decision timestamp */
  decidedAt: Date | null;

  /** Whether this approval is required or informational */
  required: boolean;
}
```

### ParsedResume

```typescript
/**
 * Structured data extracted from a resume via AI parsing.
 * Used for skill matching, experience scoring, and candidate profile enrichment.
 */
interface ParsedResume {
  /** Unique parse result identifier */
  id: string;

  /** Associated candidate */
  candidateId: string;

  /** Associated document */
  documentId: string;

  /** Parse metadata */
  parsedAt: Date;
  parserVersion: string;
  modelUsed: string;
  confidenceScore: number; // 0.0 - 1.0

  /** Extracted personal information */
  personal: {
    name: string | null;
    email: string | null;
    phone: string | null;
    location: string | null;
    linkedinUrl: string | null;
    githubUrl: string | null;
    portfolioUrl: string | null;
    summary: string | null;
  };

  /** Extracted skills */
  skills: {
    /** Skill name (normalized) */
    name: string;
    /** Category */
    category: 'technical' | 'soft' | 'tool' | 'framework' | 'language' | 'methodology' | 'other';
    /** Estimated proficiency level */
    proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null;
    /** Years of experience with this skill (estimated) */
    yearsOfExperience: number | null;
    /** Confidence in extraction (0.0 - 1.0) */
    confidence: number;
  }[];

  /** Extracted work experience */
  experience: {
    company: string;
    title: string;
    startDate: string | null;
    endDate: string | null;
    current: boolean;
    description: string | null;
    highlights: string[];
    skills: string[];
  }[];

  /** Extracted education */
  education: {
    institution: string;
    degree: string | null;
    field: string | null;
    startYear: number | null;
    endYear: number | null;
    gpa: number | null;
  }[];

  /** Extracted certifications */
  certifications: {
    name: string;
    issuer: string | null;
    date: string | null;
  }[];

  /** Extracted languages */
  languages: {
    language: string;
    proficiency: string | null;
  }[];

  /** AI-generated summary */
  aiSummary: string;

  /** AI-detected red flags */
  redFlags: {
    type: 'employment_gap' | 'short_tenure' | 'inconsistency' | 'missing_info' | 'other';
    description: string;
    severity: 'low' | 'medium' | 'high';
  }[];

  /** Raw extracted text */
  rawText: string;
}
```

### TalentPool

```typescript
/**
 * A curated collection of candidates for future opportunities.
 * Used for proactive sourcing, silver medalist tracking, and
 * nurture campaign management.
 */
interface TalentPool {
  /** Unique pool identifier */
  id: string;

  /** Owning tenant */
  tenantId: string;

  /** Pool name */
  name: string;

  /** Description */
  description: string | null;

  /** Pool type */
  type: 'general' | 'role_specific' | 'department' | 'silver_medalist' | 'alumni' | 'custom';

  /** Associated department (if role/department-specific) */
  departmentId: string | null;

  /** Pool owner (recruiter/hiring manager) */
  ownerId: string;

  /** Number of members (denormalized) */
  memberCount: number;

  /** Criteria for automatic pool inclusion */
  autoCriteria: {
    skills: string[];
    minExperienceYears: number | null;
    locations: string[];
    sources: CandidateSource[];
    tags: string[];
  } | null;

  /** Active nurture campaign ID */
  activeCampaignId: string | null;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}

interface TalentPoolMember {
  /** Pool membership ID */
  id: string;

  /** Pool */
  poolId: string;

  /** Candidate */
  candidateId: string;

  /** How they were added */
  addedMethod: 'manual' | 'automatic' | 'silver_medalist' | 'import';

  /** Relevant job they were previously considered for */
  relatedJobId: string | null;

  /** Recruiter notes for this pool membership */
  notes: string | null;

  /** Engagement score (based on nurture campaign interactions) */
  engagementScore: number | null;

  /** Last contacted date */
  lastContactedAt: Date | null;

  /** Timestamps */
  addedAt: Date;
  updatedAt: Date;
}
```

### HiringAnalytics

```typescript
/**
 * Analytics and reporting interfaces for hiring metrics.
 * All analytics respect tenant isolation and support date range filtering.
 */
interface HiringAnalytics {
  /** Time range for the analytics */
  dateRange: {
    start: Date;
    end: Date;
  };

  /** Tenant */
  tenantId: string;

  /** Summary metrics */
  summary: {
    totalJobs: number;
    openJobs: number;
    totalApplications: number;
    totalHires: number;
    totalRejections: number;
    totalWithdrawals: number;
    averageTimeToHire: number; // days
    averageCostPerHire: number; // currency
    offerAcceptanceRate: number; // percentage
    pipelineVelocity: number; // applications moved per day
  };

  /** Time-to-hire breakdown */
  timeToHire: TimeToHireMetric[];

  /** Cost-per-hire breakdown */
  costPerHire: CostPerHireMetric[];

  /** Source effectiveness */
  sourceEffectiveness: SourceEffectiveness[];

  /** Pipeline conversion funnel */
  pipelineConversion: PipelineConversion[];

  /** Diversity metrics (anonymized) */
  diversity: DiversityMetric[];

  /** Interviewer calibration */
  interviewerCalibration: {
    interviewerId: string;
    interviewCount: number;
    averageRating: number;
    hireRate: number;
    scorecardCompletionRate: number;
    averageFeedbackDelayHours: number;
  }[];

  /** Recruiter performance */
  recruiterPerformance: {
    recruiterId: string;
    applicationsProcessed: number;
    hiresMade: number;
    averageTimeToHire: number;
    pipelineHealth: number; // score 0-100
    candidateSatisfaction: number | null;
  }[];
}

interface TimeToHireMetric {
  /** Job or department (depending on grouping) */
  groupBy: string;
  groupValue: string;

  /** Average days from application to hire */
  averageDays: number;

  /** Median days */
  medianDays: number;

  /** Breakdown by stage */
  stageBreakdown: {
    stageName: string;
    averageDays: number;
    medianDays: number;
  }[];

  /** Trend vs previous period */
  trendPercent: number;
}

interface CostPerHireMetric {
  /** Grouping dimension */
  groupBy: string;
  groupValue: string;

  /** Total cost */
  totalCost: number;

  /** Cost breakdown */
  breakdown: {
    category: 'job_board_fees' | 'recruiter_time' | 'agency_fees' | 'tools' | 'travel' | 'relocation' | 'signing_bonus' | 'other';
    amount: number;
  }[];

  /** Cost per hire */
  costPerHire: number;

  /** Number of hires */
  hireCount: number;
}

interface SourceEffectiveness {
  /** Candidate source */
  source: CandidateSource;

  /** Volume metrics */
  applicationsCount: number;
  screenedCount: number;
  interviewedCount: number;
  offeredCount: number;
  hiredCount: number;

  /** Conversion rates */
  applicationToScreenRate: number;
  screenToInterviewRate: number;
  interviewToOfferRate: number;
  offerToHireRate: number;
  overallConversionRate: number;

  /** Quality metrics */
  averageMatchScore: number | null;
  averageInterviewRating: number | null;

  /** Cost */
  totalCost: number;
  costPerApplication: number;
  costPerHire: number;

  /** Speed */
  averageTimeToHire: number;
}

interface PipelineConversion {
  /** Stage */
  stageName: string;
  stageOrder: number;

  /** Counts at this stage */
  enteredCount: number;
  exitedCount: number;
  currentCount: number;

  /** Conversion to next stage */
  conversionRate: number;

  /** Average time at this stage */
  averageDaysInStage: number;

  /** Drop-off reasons */
  dropOffReasons: {
    reason: string;
    count: number;
    percent: number;
  }[];
}

interface DiversityMetric {
  /** Demographic dimension (anonymized) */
  dimension: 'gender' | 'ethnicity' | 'veteran_status' | 'disability_status' | 'age_range';

  /** Pipeline stage */
  stage: string;

  /** Breakdown by category */
  categories: {
    category: string;
    count: number;
    percent: number;
    conversionRate: number;
  }[];

  /** Representation delta vs. benchmark */
  benchmarkDelta: number | null;
}
```

### HiringService

```typescript
/**
 * Primary orchestration service for all hiring operations. Acts as the
 * main entry point for the tRPC router and coordinates between domain
 * services, the stage transition engine, and external adapters.
 */
interface HiringService {
  // === Job Management ===

  /** Create a new job requisition */
  createJob(input: CreateJobInput): Promise<Job>;

  /** Update an existing job */
  updateJob(jobId: string, input: UpdateJobInput): Promise<Job>;

  /** Get a job by ID */
  getJob(jobId: string): Promise<Job>;

  /** List jobs with filtering and pagination */
  listJobs(filters: JobFilters): Promise<PaginatedResult<Job>>;

  /** Change job status (open, pause, close, archive) */
  changeJobStatus(jobId: string, status: JobStatus, reason?: string): Promise<Job>;

  /** Publish job to external boards */
  publishToBoards(jobId: string, boardIds: string[]): Promise<JobBoardPublication[]>;

  /** Remove job from external boards */
  unpublishFromBoards(jobId: string, boardIds: string[]): Promise<void>;

  /** Sync job board publication statuses */
  syncBoardStatuses(jobId: string): Promise<JobBoardPublication[]>;

  /** Duplicate a job (useful for recurring roles) */
  duplicateJob(jobId: string, overrides?: Partial<CreateJobInput>): Promise<Job>;

  // === Application Management ===

  /** Submit a new application (candidate-facing) */
  submitApplication(input: SubmitApplicationInput): Promise<Application>;

  /** Get an application by ID */
  getApplication(applicationId: string): Promise<Application>;

  /** List applications with filtering */
  listApplications(filters: ApplicationFilters): Promise<PaginatedResult<Application>>;

  /** Get applications for a specific job (kanban view) */
  getJobPipeline(jobId: string): Promise<PipelineView>;

  /** Move application to a different stage */
  moveToStage(applicationId: string, stageId: string, reason?: string): Promise<Application>;

  /** Reject an application */
  rejectApplication(applicationId: string, reason: string, category?: string, sendNotification?: boolean): Promise<Application>;

  /** Bulk reject applications */
  bulkReject(applicationIds: string[], reason: string, category?: string, sendNotification?: boolean): Promise<Application[]>;

  /** Bulk move applications to a stage */
  bulkMoveToStage(applicationIds: string[], stageId: string, reason?: string): Promise<Application[]>;

  /** Add a note to an application */
  addApplicationNote(applicationId: string, content: string, visibility: 'private' | 'team' | 'hiring_manager'): Promise<ApplicationNote>;

  /** Set application priority */
  setApplicationPriority(applicationId: string, priority: 'low' | 'normal' | 'high' | 'urgent'): Promise<Application>;

  // === Candidate Management ===

  /** Create or update a candidate profile */
  upsertCandidate(input: UpsertCandidateInput): Promise<Candidate>;

  /** Get a candidate by ID */
  getCandidate(candidateId: string): Promise<Candidate>;

  /** Search candidates */
  searchCandidates(query: CandidateSearchQuery): Promise<PaginatedResult<Candidate>>;

  /** Get all applications for a candidate */
  getCandidateApplications(candidateId: string): Promise<Application[]>;

  /** Merge duplicate candidate records */
  mergeCandidates(primaryId: string, duplicateIds: string[]): Promise<Candidate>;

  // === Resume Parsing ===

  /** Parse a resume and enrich candidate profile */
  parseResume(candidateId: string, documentId: string): Promise<ParsedResume>;

  /** Score a candidate against a specific job */
  scoreCandidate(candidateId: string, jobId: string): Promise<SkillMatch>;

  /** Bulk parse resumes for a list of candidates */
  bulkParseResumes(items: { candidateId: string; documentId: string }[]): Promise<ParsedResume[]>;

  // === Interview Management ===

  /** Schedule an interview */
  scheduleInterview(input: ScheduleInterviewInput): Promise<Interview>;

  /** Get interview by ID */
  getInterview(interviewId: string): Promise<Interview>;

  /** List interviews for an application */
  listInterviews(applicationId: string): Promise<Interview[]>;

  /** Get available interview slots */
  getAvailableSlots(input: AvailableSlotsInput): Promise<InterviewSlot[]>;

  /** Reschedule an interview */
  rescheduleInterview(interviewId: string, newTime: Date, reason?: string): Promise<Interview>;

  /** Cancel an interview */
  cancelInterview(interviewId: string, reason: string): Promise<Interview>;

  /** Submit a scorecard */
  submitScorecard(input: SubmitScorecardInput): Promise<Scorecard>;

  /** Get scorecards for an interview */
  getInterviewScorecards(interviewId: string): Promise<Scorecard[]>;

  /** Get aggregated feedback for an application */
  getAggregatedFeedback(applicationId: string): Promise<AggregatedFeedback>;

  // === Offer Management ===

  /** Create an offer */
  createOffer(input: CreateOfferInput): Promise<Offer>;

  /** Get an offer by ID */
  getOffer(offerId: string): Promise<Offer>;

  /** Update/revise an offer */
  reviseOffer(offerId: string, input: ReviseOfferInput): Promise<Offer>;

  /** Submit offer for approval */
  submitForApproval(offerId: string): Promise<Offer>;

  /** Approve an offer (called by approver) */
  approveOffer(offerId: string, comments?: string): Promise<Offer>;

  /** Reject an offer approval (called by approver) */
  rejectOfferApproval(offerId: string, comments: string): Promise<Offer>;

  /** Extend the offer to the candidate */
  extendOffer(offerId: string): Promise<Offer>;

  /** Send offer for e-signature */
  sendForSignature(offerId: string): Promise<Offer>;

  /** Record offer acceptance */
  recordOfferAcceptance(offerId: string): Promise<Offer>;

  /** Record offer decline */
  recordOfferDecline(offerId: string, reason?: string): Promise<Offer>;

  /** Revoke an extended offer */
  revokeOffer(offerId: string, reason: string): Promise<Offer>;

  // === Referral Management ===

  /** Submit a referral */
  submitReferral(input: SubmitReferralInput): Promise<Referral>;

  /** List referrals for an employee */
  listEmployeeReferrals(employeeId: string): Promise<Referral[]>;

  /** Get referral pipeline analytics */
  getReferralAnalytics(dateRange: DateRange): Promise<ReferralAnalytics>;

  /** Process referral bonus (after hire retention period) */
  processReferralBonus(referralId: string): Promise<ReferralBonus>;

  // === Talent Pool ===

  /** Create a talent pool */
  createTalentPool(input: CreateTalentPoolInput): Promise<TalentPool>;

  /** Add candidates to a talent pool */
  addToTalentPool(poolId: string, candidateIds: string[], notes?: string): Promise<TalentPoolMember[]>;

  /** Remove candidates from a talent pool */
  removeFromTalentPool(poolId: string, candidateIds: string[]): Promise<void>;

  /** Get talent pool with members */
  getTalentPool(poolId: string, pagination?: PaginationInput): Promise<TalentPool & { members: TalentPoolMember[] }>;

  /** List talent pools */
  listTalentPools(filters?: TalentPoolFilters): Promise<PaginatedResult<TalentPool>>;

  /** Launch a nurture campaign */
  launchNurtureCampaign(poolId: string, input: NurtureCampaignInput): Promise<NurtureCampaign>;

  // === Analytics ===

  /** Get comprehensive hiring analytics */
  getAnalytics(input: AnalyticsInput): Promise<HiringAnalytics>;

  /** Get time-to-hire metrics */
  getTimeToHire(input: AnalyticsInput): Promise<TimeToHireMetric[]>;

  /** Get source effectiveness report */
  getSourceEffectiveness(input: AnalyticsInput): Promise<SourceEffectiveness[]>;

  /** Get pipeline conversion funnel */
  getPipelineConversion(jobId: string): Promise<PipelineConversion[]>;

  /** Get diversity metrics */
  getDiversityMetrics(input: AnalyticsInput): Promise<DiversityMetric[]>;

  /** Export analytics report */
  exportReport(input: ExportReportInput): Promise<{ url: string; expiresAt: Date }>;

  // === Compliance ===

  /** Record EEO self-identification data */
  recordEEOData(candidateId: string, data: EEOSelfIdentification): Promise<void>;

  /** Generate OFCCP compliance report */
  generateOFCCPReport(dateRange: DateRange): Promise<OFCCPReport>;

  /** Process GDPR data access request */
  processDataAccessRequest(candidateId: string): Promise<CandidateDataExport>;

  /** Process GDPR data deletion request */
  processDataDeletionRequest(candidateId: string, reason: string): Promise<void>;

  /** Run data retention cleanup */
  runRetentionCleanup(): Promise<RetentionCleanupResult>;

  // === Candidate Portal ===

  /** Get candidate portal view (candidate-facing) */
  getCandidatePortalView(candidateToken: string): Promise<CandidatePortalView>;

  /** Upload candidate document */
  uploadCandidateDocument(candidateId: string, input: UploadDocumentInput): Promise<CandidateDocument>;

  /** Get candidate-available interview slots (candidate self-scheduling) */
  getCandidateAvailableSlots(applicationId: string, candidateToken: string): Promise<InterviewSlot[]>;

  /** Candidate self-schedules an interview */
  candidateSelfSchedule(applicationId: string, slotId: string, candidateToken: string): Promise<Interview>;

  // === Hiring Stages Configuration ===

  /** Get default hiring stages for the tenant */
  getDefaultStages(): Promise<HiringStageConfig[]>;

  /** Update default hiring stages */
  updateDefaultStages(stages: HiringStageConfig[]): Promise<HiringStageConfig[]>;

  /** Get custom stages for a specific job */
  getJobStages(jobId: string): Promise<HiringStageConfig[]>;

  /** Update custom stages for a specific job */
  updateJobStages(jobId: string, stages: HiringStageConfig[]): Promise<HiringStageConfig[]>;
}

interface HiringStageConfig {
  /** Stage identifier */
  id: string;

  /** Display name */
  name: string;

  /** Stage type */
  type: 'applied' | 'screening' | 'interview' | 'assessment' | 'offer' | 'hired' | 'rejected' | 'custom';

  /** Order in the pipeline */
  order: number;

  /** Color for kanban display */
  color: string;

  /** Whether this stage is a terminal state */
  isTerminal: boolean;

  /** SLA: max days at this stage before warning */
  slaDays: number | null;

  /** Automated actions when entering this stage */
  automations: {
    sendCandidateEmail: boolean;
    emailTemplateId: string | null;
    assignScorecard: boolean;
    scorecardTemplateId: string | null;
    requireApproval: boolean;
    approverIds: string[];
    webhookUrl: string | null;
  };
}
```

### Referral

```typescript
/**
 * Employee referral tracking with bonus management.
 */
interface Referral {
  /** Unique referral identifier */
  id: string;

  /** Owning tenant */
  tenantId: string;

  /** Referring employee (user ID) */
  referrerId: string;

  /** Referred candidate */
  candidateId: string;

  /** Job referred for */
  jobId: string;

  /** Resulting application (once created) */
  applicationId: string | null;

  /** Referral status */
  status: ReferralStatus;

  /** Referrer's relationship to candidate */
  relationship: string | null;

  /** Referrer's recommendation note */
  recommendation: string | null;

  /** How the referrer knows the candidate */
  howKnown: string | null;

  /** Bonus tracking */
  bonus: ReferralBonus | null;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
  hiredAt: Date | null;
  bonusPaidAt: Date | null;
}

type ReferralStatus =
  | 'submitted'
  | 'under_review'
  | 'application_created'
  | 'interviewing'
  | 'offered'
  | 'hired'
  | 'not_hired'
  | 'bonus_eligible'
  | 'bonus_paid'
  | 'ineligible';

interface ReferralBonus {
  /** Bonus amount */
  amount: number;

  /** Currency */
  currency: string;

  /** Bonus type */
  type: 'flat' | 'tiered' | 'custom';

  /** Retention requirement (days after hire) */
  retentionDays: number;

  /** Retention period start date (hire date) */
  retentionStartDate: Date | null;

  /** Whether retention requirement is met */
  retentionMet: boolean;

  /** Payment status */
  paymentStatus: 'pending' | 'eligible' | 'processing' | 'paid' | 'forfeited';

  /** Payment date */
  paidAt: Date | null;

  /** Payroll reference */
  payrollReferenceId: string | null;
}
```

### NurtureCampaign

```typescript
/**
 * Automated communication campaigns for talent pool engagement.
 */
interface NurtureCampaign {
  /** Unique campaign identifier */
  id: string;

  /** Owning tenant */
  tenantId: string;

  /** Associated talent pool */
  talentPoolId: string;

  /** Campaign name */
  name: string;

  /** Campaign status */
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';

  /** Campaign type */
  type: 'drip' | 'one_time' | 'event_triggered';

  /** Email sequence */
  steps: {
    order: number;
    delayDays: number;
    subject: string;
    templateId: string;
    sentCount: number;
    openCount: number;
    clickCount: number;
    replyCount: number;
  }[];

  /** Target criteria (subset of pool) */
  targetCriteria: {
    skills: string[];
    locations: string[];
    lastContactedBefore: Date | null;
    minEngagementScore: number | null;
  } | null;

  /** Metrics */
  metrics: {
    totalTargeted: number;
    totalSent: number;
    totalOpened: number;
    totalClicked: number;
    totalReplied: number;
    totalUnsubscribed: number;
    totalApplications: number;
  };

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
}
```

---

## Database Schemas

### jobs

```typescript
import { pgTable, uuid, text, varchar, timestamp, integer, jsonb, boolean, pgEnum } from 'drizzle-orm/pg-core';

export const jobStatusEnum = pgEnum('job_status', [
  'draft', 'pending_approval', 'open', 'paused', 'closed', 'archived',
]);

export const jobTypeEnum = pgEnum('job_type', [
  'full_time', 'part_time', 'contract', 'temporary', 'internship', 'freelance', 'volunteer',
]);

export const workArrangementEnum = pgEnum('work_arrangement', [
  'onsite', 'remote', 'hybrid',
]);

export const jobs = pgTable('hiring_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  referenceCode: varchar('reference_code', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  shortDescription: text('short_description'),
  departmentId: uuid('department_id'),
  hiringManagerId: uuid('hiring_manager_id').notNull(),
  recruiterId: uuid('recruiter_id'),
  type: jobTypeEnum('type').notNull().default('full_time'),
  workArrangement: workArrangementEnum('work_arrangement').notNull().default('onsite'),
  locations: jsonb('locations').notNull().default('[]'),
  level: varchar('level', { length: 50 }),
  requirements: jsonb('requirements').notNull().default('[]'),
  compensation: jsonb('compensation'),
  benefits: jsonb('benefits').notNull().default('[]'),
  headcount: integer('headcount').notNull().default(1),
  filledCount: integer('filled_count').notNull().default(0),
  customStages: jsonb('custom_stages'),
  showOnCareerPage: boolean('show_on_career_page').notNull().default(true),
  applicationDeadline: timestamp('application_deadline', { withTimezone: true }),
  status: jobStatusEnum('status').notNull().default('draft'),
  internalNotes: text('internal_notes'),
  eeoCategory: varchar('eeo_category', { length: 100 }),
  tags: jsonb('tags').notNull().default('[]'),
  approvalStatus: varchar('approval_status', { length: 50 }).notNull().default('draft'),
  approvedBy: uuid('approved_by'),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
}, (table) => ({
  tenantIdx: index('hiring_jobs_tenant_idx').on(table.tenantId),
  statusIdx: index('hiring_jobs_status_idx').on(table.tenantId, table.status),
  refCodeIdx: uniqueIndex('hiring_jobs_ref_code_idx').on(table.tenantId, table.referenceCode),
  hiringManagerIdx: index('hiring_jobs_hm_idx').on(table.tenantId, table.hiringManagerId),
  recruiterIdx: index('hiring_jobs_recruiter_idx').on(table.tenantId, table.recruiterId),
  departmentIdx: index('hiring_jobs_dept_idx').on(table.tenantId, table.departmentId),
}));
```

### candidates

```typescript
export const candidates = pgTable('hiring_candidates', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  country: varchar('country', { length: 100 }),
  timezone: varchar('timezone', { length: 100 }),
  profile: jsonb('profile').notNull().default('{}'),
  source: varchar('source', { length: 50 }).notNull(),
  sourceDetail: varchar('source_detail', { length: 255 }),
  referredBy: uuid('referred_by'),
  tags: jsonb('tags').notNull().default('[]'),
  notes: text('notes'),
  doNotContact: boolean('do_not_contact').notNull().default(false),
  gdprConsent: jsonb('gdpr_consent').notNull().default('{}'),
  portalEnabled: boolean('portal_enabled').notNull().default(false),
  portalLastLoginAt: timestamp('portal_last_login_at', { withTimezone: true }),
  latestResumeId: uuid('latest_resume_id'),
  latestParsedResume: jsonb('latest_parsed_resume'),
  overallRating: integer('overall_rating'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  lastActivityAt: timestamp('last_activity_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('hiring_candidates_tenant_idx').on(table.tenantId),
  emailIdx: uniqueIndex('hiring_candidates_email_idx').on(table.tenantId, table.email),
  nameIdx: index('hiring_candidates_name_idx').on(table.tenantId, table.lastName, table.firstName),
  sourceIdx: index('hiring_candidates_source_idx').on(table.tenantId, table.source),
  tagsIdx: index('hiring_candidates_tags_idx').using('gin', table.tags),
}));
```

### applications

```typescript
export const applicationStatusEnum = pgEnum('application_status', [
  'active', 'hired', 'rejected', 'withdrawn', 'on_hold',
]);

export const applications = pgTable('hiring_applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  jobId: uuid('job_id').notNull().references(() => jobs.id),
  candidateId: uuid('candidate_id').notNull().references(() => candidates.id),
  currentStageId: uuid('current_stage_id').notNull(),
  status: applicationStatusEnum('status').notNull().default('active'),
  source: varchar('source', { length: 50 }).notNull(),
  sourceAttribution: jsonb('source_attribution'),
  matchScore: integer('match_score'),
  matchScoreDetails: jsonb('match_score_details'),
  priority: varchar('priority', { length: 20 }).notNull().default('normal'),
  assignedRecruiterId: uuid('assigned_recruiter_id'),
  coverLetter: text('cover_letter'),
  customFields: jsonb('custom_fields').notNull().default('{}'),
  rejectionReason: text('rejection_reason'),
  rejectionCategory: varchar('rejection_category', { length: 100 }),
  rejectionNotifiedAt: timestamp('rejection_notified_at', { withTimezone: true }),
  withdrawalReason: text('withdrawal_reason'),
  notes: jsonb('notes').notNull().default('[]'),
  sla: jsonb('sla').notNull().default('{}'),
  stageHistory: jsonb('stage_history').notNull().default('[]'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  lastActivityAt: timestamp('last_activity_at', { withTimezone: true }).notNull().defaultNow(),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
  hiredAt: timestamp('hired_at', { withTimezone: true }),
}, (table) => ({
  tenantIdx: index('hiring_applications_tenant_idx').on(table.tenantId),
  jobIdx: index('hiring_applications_job_idx').on(table.tenantId, table.jobId),
  candidateIdx: index('hiring_applications_candidate_idx').on(table.tenantId, table.candidateId),
  statusIdx: index('hiring_applications_status_idx').on(table.tenantId, table.status),
  stageIdx: index('hiring_applications_stage_idx').on(table.tenantId, table.currentStageId),
  recruiterIdx: index('hiring_applications_recruiter_idx').on(table.tenantId, table.assignedRecruiterId),
  matchScoreIdx: index('hiring_applications_score_idx').on(table.tenantId, table.matchScore),
  uniqueAppIdx: uniqueIndex('hiring_applications_unique_idx').on(table.tenantId, table.jobId, table.candidateId),
}));
```

### interviews

```typescript
export const interviewStatusEnum = pgEnum('interview_status', [
  'pending', 'scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show',
]);

export const interviews = pgTable('hiring_interviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  applicationId: uuid('application_id').notNull().references(() => applications.id),
  jobId: uuid('job_id').notNull().references(() => jobs.id),
  candidateId: uuid('candidate_id').notNull().references(() => candidates.id),
  type: varchar('type', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  stageId: uuid('stage_id').notNull(),
  round: integer('round').notNull().default(1),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  duration: integer('duration').notNull().default(60),
  timezone: varchar('timezone', { length: 100 }).notNull().default('UTC'),
  meetingUrl: text('meeting_url'),
  meetingProvider: varchar('meeting_provider', { length: 50 }),
  location: text('location'),
  calendarEventId: varchar('calendar_event_id', { length: 255 }),
  calendarProvider: varchar('calendar_provider', { length: 50 }),
  interviewers: jsonb('interviewers').notNull().default('[]'),
  scorecardTemplateId: uuid('scorecard_template_id'),
  status: interviewStatusEnum('status').notNull().default('pending'),
  candidateConfirmedAt: timestamp('candidate_confirmed_at', { withTimezone: true }),
  rescheduledFrom: timestamp('rescheduled_from', { withTimezone: true }),
  rescheduleCount: integer('reschedule_count').notNull().default(0),
  aggregateRating: integer('aggregate_rating'),
  aggregateRecommendation: varchar('aggregate_recommendation', { length: 50 }),
  feedbackSummary: text('feedback_summary'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
}, (table) => ({
  tenantIdx: index('hiring_interviews_tenant_idx').on(table.tenantId),
  applicationIdx: index('hiring_interviews_app_idx').on(table.tenantId, table.applicationId),
  scheduledIdx: index('hiring_interviews_scheduled_idx').on(table.tenantId, table.scheduledAt),
  statusIdx: index('hiring_interviews_status_idx').on(table.tenantId, table.status),
  candidateIdx: index('hiring_interviews_candidate_idx').on(table.tenantId, table.candidateId),
}));
```

### interview_scorecards

```typescript
export const interviewScorecards = pgTable('hiring_interview_scorecards', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  interviewId: uuid('interview_id').notNull().references(() => interviews.id),
  applicationId: uuid('application_id').notNull().references(() => applications.id),
  interviewerId: uuid('interviewer_id').notNull(),
  templateId: uuid('template_id'),
  overallRating: integer('overall_rating').notNull(),
  recommendation: varchar('recommendation', { length: 50 }).notNull(),
  criteria: jsonb('criteria').notNull().default('[]'),
  strengths: text('strengths').notNull().default(''),
  concerns: text('concerns').notNull().default(''),
  comments: text('comments').notNull().default(''),
  keyMoments: text('key_moments'),
  status: varchar('status', { length: 20 }).notNull().default('draft'),
  visibleToPanel: boolean('visible_to_panel').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
}, (table) => ({
  tenantIdx: index('hiring_scorecards_tenant_idx').on(table.tenantId),
  interviewIdx: index('hiring_scorecards_interview_idx').on(table.tenantId, table.interviewId),
  interviewerIdx: index('hiring_scorecards_interviewer_idx').on(table.tenantId, table.interviewerId),
  applicationIdx: index('hiring_scorecards_app_idx').on(table.tenantId, table.applicationId),
  uniqueIdx: uniqueIndex('hiring_scorecards_unique_idx').on(table.interviewId, table.interviewerId),
}));
```

### offers

```typescript
export const offerStatusEnum = pgEnum('offer_status', [
  'draft', 'pending_approval', 'approved', 'extended', 'negotiating',
  'accepted', 'declined', 'revoked', 'expired',
]);

export const offers = pgTable('hiring_offers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  applicationId: uuid('application_id').notNull().references(() => applications.id),
  jobId: uuid('job_id').notNull().references(() => jobs.id),
  candidateId: uuid('candidate_id').notNull().references(() => candidates.id),
  version: integer('version').notNull().default(1),
  status: offerStatusEnum('status').notNull().default('draft'),
  compensation: jsonb('compensation').notNull(),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  offerTitle: varchar('offer_title', { length: 255 }).notNull(),
  departmentId: uuid('department_id'),
  reportingManagerId: uuid('reporting_manager_id'),
  employmentType: jobTypeEnum('employment_type').notNull(),
  workArrangement: workArrangementEnum('work_arrangement').notNull(),
  workLocation: varchar('work_location', { length: 255 }),
  customTerms: text('custom_terms'),
  offerLetterDocumentId: uuid('offer_letter_document_id'),
  offerLetterTemplateId: uuid('offer_letter_template_id'),
  approvals: jsonb('approvals').notNull().default('[]'),
  fullyApproved: boolean('fully_approved').notNull().default(false),
  eSignature: jsonb('e_signature').notNull().default('{}'),
  negotiationHistory: jsonb('negotiation_history').notNull().default('[]'),
  extendedBy: uuid('extended_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  extendedAt: timestamp('extended_at', { withTimezone: true }),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  declinedAt: timestamp('declined_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
}, (table) => ({
  tenantIdx: index('hiring_offers_tenant_idx').on(table.tenantId),
  applicationIdx: index('hiring_offers_app_idx').on(table.tenantId, table.applicationId),
  candidateIdx: index('hiring_offers_candidate_idx').on(table.tenantId, table.candidateId),
  statusIdx: index('hiring_offers_status_idx').on(table.tenantId, table.status),
  jobIdx: index('hiring_offers_job_idx').on(table.tenantId, table.jobId),
}));
```

### referrals

```typescript
export const referralStatusEnum = pgEnum('referral_status', [
  'submitted', 'under_review', 'application_created', 'interviewing',
  'offered', 'hired', 'not_hired', 'bonus_eligible', 'bonus_paid', 'ineligible',
]);

export const referrals = pgTable('hiring_referrals', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  referrerId: uuid('referrer_id').notNull(),
  candidateId: uuid('candidate_id').notNull().references(() => candidates.id),
  jobId: uuid('job_id').notNull().references(() => jobs.id),
  applicationId: uuid('application_id').references(() => applications.id),
  status: referralStatusEnum('status').notNull().default('submitted'),
  relationship: varchar('relationship', { length: 100 }),
  recommendation: text('recommendation'),
  howKnown: text('how_known'),
  bonus: jsonb('bonus'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  hiredAt: timestamp('hired_at', { withTimezone: true }),
  bonusPaidAt: timestamp('bonus_paid_at', { withTimezone: true }),
}, (table) => ({
  tenantIdx: index('hiring_referrals_tenant_idx').on(table.tenantId),
  referrerIdx: index('hiring_referrals_referrer_idx').on(table.tenantId, table.referrerId),
  candidateIdx: index('hiring_referrals_candidate_idx').on(table.tenantId, table.candidateId),
  jobIdx: index('hiring_referrals_job_idx').on(table.tenantId, table.jobId),
  statusIdx: index('hiring_referrals_status_idx').on(table.tenantId, table.status),
}));
```

### talent_pools

```typescript
export const talentPools = pgTable('hiring_talent_pools', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull().default('general'),
  departmentId: uuid('department_id'),
  ownerId: uuid('owner_id').notNull(),
  memberCount: integer('member_count').notNull().default(0),
  autoCriteria: jsonb('auto_criteria'),
  activeCampaignId: uuid('active_campaign_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('hiring_talent_pools_tenant_idx').on(table.tenantId),
  ownerIdx: index('hiring_talent_pools_owner_idx').on(table.tenantId, table.ownerId),
  typeIdx: index('hiring_talent_pools_type_idx').on(table.tenantId, table.type),
}));

export const talentPoolMembers = pgTable('hiring_talent_pool_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  poolId: uuid('pool_id').notNull().references(() => talentPools.id, { onDelete: 'cascade' }),
  candidateId: uuid('candidate_id').notNull().references(() => candidates.id),
  addedMethod: varchar('added_method', { length: 50 }).notNull().default('manual'),
  relatedJobId: uuid('related_job_id'),
  notes: text('notes'),
  engagementScore: integer('engagement_score'),
  lastContactedAt: timestamp('last_contacted_at', { withTimezone: true }),
  addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  poolIdx: index('hiring_tpm_pool_idx').on(table.poolId),
  candidateIdx: index('hiring_tpm_candidate_idx').on(table.candidateId),
  uniqueIdx: uniqueIndex('hiring_tpm_unique_idx').on(table.poolId, table.candidateId),
}));
```

### hiring_stages

```typescript
export const hiringStages = pgTable('hiring_stages', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  jobId: uuid('job_id').references(() => jobs.id), // null = default tenant stages
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  order: integer('order').notNull(),
  color: varchar('color', { length: 20 }).notNull().default('#6B7280'),
  isTerminal: boolean('is_terminal').notNull().default(false),
  slaDays: integer('sla_days'),
  automations: jsonb('automations').notNull().default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('hiring_stages_tenant_idx').on(table.tenantId),
  jobIdx: index('hiring_stages_job_idx').on(table.tenantId, table.jobId),
  orderIdx: index('hiring_stages_order_idx').on(table.tenantId, table.jobId, table.order),
}));
```

### job_boards

```typescript
export const jobBoards = pgTable('hiring_job_boards', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: varchar('name', { length: 100 }).notNull(),
  adapter: varchar('adapter', { length: 50 }).notNull(),
  config: jsonb('config').notNull().default('{}'),
  credentials: jsonb('credentials'), // encrypted at rest
  enabled: boolean('enabled').notNull().default(true),
  lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('hiring_job_boards_tenant_idx').on(table.tenantId),
  adapterIdx: index('hiring_job_boards_adapter_idx').on(table.tenantId, table.adapter),
}));
```

### candidate_documents

```typescript
export const candidateDocuments = pgTable('hiring_candidate_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  candidateId: uuid('candidate_id').notNull().references(() => candidates.id),
  applicationId: uuid('application_id').references(() => applications.id),
  type: varchar('type', { length: 50 }).notNull(), // resume, cover_letter, portfolio, certificate, other
  filename: varchar('filename', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  storagePath: text('storage_path').notNull(),
  storageProvider: varchar('storage_provider', { length: 50 }).notNull().default('supabase'),
  parsedResumeId: uuid('parsed_resume_id'),
  uploadedBy: varchar('uploaded_by', { length: 50 }).notNull(), // 'candidate' | 'recruiter' | 'system'
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('hiring_documents_tenant_idx').on(table.tenantId),
  candidateIdx: index('hiring_documents_candidate_idx').on(table.tenantId, table.candidateId),
  applicationIdx: index('hiring_documents_app_idx').on(table.tenantId, table.applicationId),
  typeIdx: index('hiring_documents_type_idx').on(table.tenantId, table.type),
}));
```

### eeo_records

```typescript
export const eeoRecords = pgTable('hiring_eeo_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  candidateId: uuid('candidate_id').notNull().references(() => candidates.id),
  applicationId: uuid('application_id').references(() => applications.id),

  // Self-identification fields (all voluntary)
  gender: varchar('gender', { length: 50 }),
  ethnicity: varchar('ethnicity', { length: 100 }),
  veteranStatus: varchar('veteran_status', { length: 50 }),
  disabilityStatus: varchar('disability_status', { length: 50 }),
  ageRange: varchar('age_range', { length: 20 }),

  // Consent and methodology
  selfIdentified: boolean('self_identified').notNull().default(true),
  collectionMethod: varchar('collection_method', { length: 50 }).notNull(), // 'voluntary_form' | 'visual_survey' | 'other'
  consentGiven: boolean('consent_given').notNull().default(false),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('hiring_eeo_tenant_idx').on(table.tenantId),
  candidateIdx: index('hiring_eeo_candidate_idx').on(table.tenantId, table.candidateId),
  applicationIdx: index('hiring_eeo_app_idx').on(table.tenantId, table.applicationId),
}));
```

### offer_approvals

```typescript
export const offerApprovals = pgTable('hiring_offer_approvals', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  offerId: uuid('offer_id').notNull().references(() => offers.id, { onDelete: 'cascade' }),
  order: integer('order').notNull(),
  approverId: uuid('approver_id').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  comments: text('comments'),
  required: boolean('required').notNull().default(true),
  decidedAt: timestamp('decided_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  offerIdx: index('hiring_approvals_offer_idx').on(table.offerId),
  approverIdx: index('hiring_approvals_approver_idx').on(table.tenantId, table.approverId),
}));
```

### nurture_campaigns

```typescript
export const nurtureCampaigns = pgTable('hiring_nurture_campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  talentPoolId: uuid('talent_pool_id').notNull().references(() => talentPools.id),
  name: varchar('name', { length: 255 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('draft'),
  type: varchar('type', { length: 50 }).notNull().default('drip'),
  steps: jsonb('steps').notNull().default('[]'),
  targetCriteria: jsonb('target_criteria'),
  metrics: jsonb('metrics').notNull().default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
}, (table) => ({
  tenantIdx: index('hiring_campaigns_tenant_idx').on(table.tenantId),
  poolIdx: index('hiring_campaigns_pool_idx').on(table.tenantId, table.talentPoolId),
  statusIdx: index('hiring_campaigns_status_idx').on(table.tenantId, table.status),
}));
```

### hiring_activity_log

```typescript
export const hiringActivityLog = pgTable('hiring_activity_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  entityType: varchar('entity_type', { length: 50 }).notNull(), // 'job' | 'application' | 'candidate' | 'interview' | 'offer' | 'referral'
  entityId: uuid('entity_id').notNull(),
  action: varchar('action', { length: 100 }).notNull(), // e.g., 'stage_changed', 'offer_extended', 'scorecard_submitted'
  actorId: uuid('actor_id'), // null for system actions
  actorType: varchar('actor_type', { length: 20 }).notNull().default('user'), // 'user' | 'system' | 'candidate'
  metadata: jsonb('metadata').notNull().default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('hiring_activity_tenant_idx').on(table.tenantId),
  entityIdx: index('hiring_activity_entity_idx').on(table.tenantId, table.entityType, table.entityId),
  actorIdx: index('hiring_activity_actor_idx').on(table.tenantId, table.actorId),
  createdIdx: index('hiring_activity_created_idx').on(table.tenantId, table.createdAt),
}));
```

---

## Code Examples

### 1. Creating a Job Posting and Publishing to Boards

```typescript
import { HiringService } from '@mcv/people/hiring';

const hiringService = container.resolve(HiringService);

// Create a job requisition
const job = await hiringService.createJob({
  title: 'Senior Full-Stack Engineer',
  description: `
    <h2>About the Role</h2>
    <p>We're looking for a senior full-stack engineer to join our platform team.
    You'll be building the next generation of our SaaS product using TypeScript,
    React, and Node.js.</p>
    <h2>What You'll Do</h2>
    <ul>
      <li>Design and implement new features across the entire stack</li>
      <li>Mentor junior engineers and conduct code reviews</li>
      <li>Participate in architecture decisions and technical planning</li>
      <li>Improve developer experience and CI/CD pipelines</li>
    </ul>
  `,
  shortDescription: 'Senior full-stack engineer for our platform team. TypeScript, React, Node.js.',
  departmentId: 'dept-engineering-uuid',
  hiringManagerId: 'user-sarah-uuid',
  recruiterId: 'user-recruiter-uuid',
  type: 'full_time',
  workArrangement: 'hybrid',
  locations: [
    { city: 'San Francisco', state: 'CA', country: 'US', postalCode: '94105', timezone: 'America/Los_Angeles' },
    { city: 'New York', state: 'NY', country: 'US', postalCode: '10001', timezone: 'America/New_York' },
  ],
  level: 'senior',
  requirements: [
    { category: 'experience', description: '5+ years of professional software development', priority: 'required', minYears: 5, skillTag: null },
    { category: 'skill', description: 'Strong TypeScript/JavaScript proficiency', priority: 'required', minYears: 3, skillTag: 'typescript' },
    { category: 'skill', description: 'React experience with modern patterns (hooks, server components)', priority: 'required', minYears: 2, skillTag: 'react' },
    { category: 'skill', description: 'Node.js backend development', priority: 'required', minYears: 2, skillTag: 'nodejs' },
    { category: 'skill', description: 'PostgreSQL or similar relational database', priority: 'required', minYears: null, skillTag: 'postgresql' },
    { category: 'skill', description: 'Experience with GraphQL or tRPC', priority: 'preferred', minYears: null, skillTag: 'trpc' },
    { category: 'skill', description: 'Infrastructure/DevOps experience (Docker, K8s, Terraform)', priority: 'nice_to_have', minYears: null, skillTag: 'devops' },
    { category: 'education', description: "BS in Computer Science or equivalent experience", priority: 'preferred', minYears: null, skillTag: null },
  ],
  compensation: {
    type: 'salary',
    currency: 'USD',
    min: 180000,
    max: 240000,
    period: 'annual',
    equity: {
      type: 'rsu',
      rangeMin: 50000,
      rangeMax: 100000,
      vestingSchedule: '4-year vest, 1-year cliff',
    },
    bonus: [
      { type: 'annual', rangeMin: 10, rangeMax: 20 },
    ],
    showOnListing: true,
  },
  benefits: [
    'Comprehensive health, dental, and vision insurance',
    'Unlimited PTO',
    '401(k) with 4% match',
    '$5,000 annual learning & development budget',
    'Home office stipend',
  ],
  headcount: 2,
  showOnCareerPage: true,
  applicationDeadline: new Date('2025-04-30'),
  tags: ['engineering', 'platform', 'senior', 'full-stack'],
});

console.log(`Created job: ${job.referenceCode} — ${job.title}`);
// → Created job: ENG-2025-012 — Senior Full-Stack Engineer

// Submit for approval
const approved = await hiringService.changeJobStatus(job.id, 'pending_approval');

// After approval, publish to job boards
const publications = await hiringService.publishToBoards(job.id, [
  'board-linkedin-uuid',
  'board-indeed-uuid',
]);

for (const pub of publications) {
  console.log(`Published to ${pub.boardName}: ${pub.status}`);
}
// → Published to LinkedIn: published
// → Published to Indeed: published
```

### 2. Processing an Application with AI Resume Parsing

```typescript
import { HiringService } from '@mcv/people/hiring';

const hiringService = container.resolve(HiringService);

// Candidate applies through career page
const application = await hiringService.submitApplication({
  jobId: 'job-senior-engineer-uuid',
  candidate: {
    firstName: 'Alex',
    lastName: 'Chen',
    email: 'alex.chen@example.com',
    phone: '+1-415-555-0123',
    source: 'career_page',
  },
  coverLetter: 'I am excited to apply for the Senior Full-Stack Engineer role...',
  resumeFile: {
    filename: 'alex_chen_resume.pdf',
    mimeType: 'application/pdf',
    buffer: resumeBuffer,
  },
  customFields: {
    workAuthorization: 'US Citizen',
    startAvailability: '2 weeks notice',
    howDidYouHear: 'Company blog',
  },
  sourceAttribution: {
    utmSource: 'blog',
    utmMedium: 'organic',
    utmCampaign: 'engineering-hiring-q1',
    referralId: null,
  },
});

console.log(`Application ${application.id} received — Stage: Applied`);

// AI automatically parses the resume
const parsedResume = await hiringService.parseResume(
  application.candidateId,
  application.id, // triggers parse for the uploaded resume
);

console.log(`Resume parsed with ${parsedResume.confidenceScore * 100}% confidence`);
console.log(`Skills found: ${parsedResume.skills.map(s => s.name).join(', ')}`);
console.log(`Experience: ${parsedResume.experience.length} positions`);
console.log(`AI Summary: ${parsedResume.aiSummary}`);

if (parsedResume.redFlags.length > 0) {
  console.log('Red flags detected:');
  for (const flag of parsedResume.redFlags) {
    console.log(`  ⚠️ [${flag.severity}] ${flag.type}: ${flag.description}`);
  }
}

// Score candidate against job requirements
const matchResult = await hiringService.scoreCandidate(
  application.candidateId,
  'job-senior-engineer-uuid',
);

console.log(`\nMatch Score: ${matchResult.overallScore}/100`);
console.log(`  Skill Match: ${matchResult.skillScore}/100`);
console.log(`  Experience: ${matchResult.experienceScore}/100`);
console.log(`  Education: ${matchResult.educationScore}/100`);
console.log(`  Strengths: ${matchResult.strengths.join(', ')}`);
console.log(`  Gaps: ${matchResult.gaps.join(', ')}`);
// → Match Score: 87/100
// →   Skill Match: 92/100
// →   Experience: 85/100
// →   Education: 80/100
// →   Strengths: typescript, react, nodejs, postgresql
// →   Gaps: devops (nice-to-have)
```

### 3. Managing the Hiring Pipeline (Kanban Operations)

```typescript
import { HiringService } from '@mcv/people/hiring';

const hiringService = container.resolve(HiringService);

// Get the pipeline view for a job (kanban board data)
const pipeline = await hiringService.getJobPipeline('job-senior-engineer-uuid');

console.log(`Pipeline for: ${pipeline.job.title}`);
for (const stage of pipeline.stages) {
  console.log(`\n📋 ${stage.name} (${stage.applications.length} candidates)`);
  for (const app of stage.applications) {
    const score = app.matchScore ? ` — Score: ${app.matchScore}` : '';
    console.log(`  • ${app.candidate.firstName} ${app.candidate.lastName}${score}`);
  }
}

// Move a candidate from Screening to Interview stage
const movedApp = await hiringService.moveToStage(
  'application-alex-uuid',
  'stage-interview-uuid',
  'Strong technical background, passed phone screen',
);

console.log(`Moved ${movedApp.id} to stage: Interview`);
// This triggers:
//   1. Stage transition recorded in history
//   2. Event: application.stage_changed emitted
//   3. Automated email sent to candidate (if configured)
//   4. Scorecard template assigned (if configured)
//   5. SLA timer restarted for new stage

// Bulk reject candidates who don't meet minimum requirements
const rejected = await hiringService.bulkReject(
  ['app-1-uuid', 'app-2-uuid', 'app-3-uuid'],
  'Does not meet minimum experience requirement of 5 years',
  'insufficient_experience',
  true, // send notification emails
);

console.log(`Rejected ${rejected.length} applications`);

// Set priority on a promising candidate
await hiringService.setApplicationPriority('application-alex-uuid', 'high');

// Add a recruiter note
await hiringService.addApplicationNote(
  'application-alex-uuid',
  'Impressive open-source contributions on GitHub. Currently at FAANG — may need competitive offer.',
  'team',
);
```

### 4. Scheduling and Conducting Interviews

```typescript
import { HiringService } from '@mcv/people/hiring';

const hiringService = container.resolve(HiringService);

// Find available interview slots
const availableSlots = await hiringService.getAvailableSlots({
  applicationId: 'application-alex-uuid',
  interviewerIds: ['user-eng-lead-uuid', 'user-senior-dev-uuid'],
  duration: 60,
  dateRange: {
    start: new Date('2025-03-10'),
    end: new Date('2025-03-14'),
  },
  timezone: 'America/Los_Angeles',
  preferredTimes: ['morning', 'early_afternoon'],
});

console.log(`Found ${availableSlots.length} available slots`);

// Schedule a technical interview
const interview = await hiringService.scheduleInterview({
  applicationId: 'application-alex-uuid',
  type: 'technical',
  title: 'Technical Interview — System Design & Coding',
  description: 'Focus areas: system design, TypeScript coding, React architecture patterns',
  stageId: 'stage-interview-uuid',
  round: 1,
  scheduledAt: availableSlots[0].startTime,
  duration: 60,
  timezone: 'America/Los_Angeles',
  meetingProvider: 'google_meet',
  interviewers: [
    { userId: 'user-eng-lead-uuid', role: 'lead', selectionReason: 'System design expert' },
    { userId: 'user-senior-dev-uuid', role: 'participant', selectionReason: 'TypeScript domain expert' },
  ],
  scorecardTemplateId: 'template-technical-uuid',
  calendarProvider: 'google',
});

console.log(`Interview scheduled: ${interview.title}`);
console.log(`  Time: ${interview.scheduledAt}`);
console.log(`  Meeting: ${interview.meetingUrl}`);
console.log(`  Interviewers: ${interview.interviewers.length}`);

// After the interview, interviewers submit scorecards
const scorecard = await hiringService.submitScorecard({
  interviewId: interview.id,
  overallRating: 4,
  recommendation: 'hire',
  criteria: [
    { name: 'System Design', category: 'technical', rating: 4, weight: 0.3, comments: 'Solid distributed systems knowledge. Good trade-off analysis.' },
    { name: 'Coding Ability', category: 'technical', rating: 5, weight: 0.25, comments: 'Clean TypeScript, excellent use of generics and type narrowing.' },
    { name: 'React Architecture', category: 'technical', rating: 4, weight: 0.2, comments: 'Strong React patterns. Good understanding of server components.' },
    { name: 'Problem Solving', category: 'behavioral', rating: 4, weight: 0.15, comments: 'Methodical approach, asked good clarifying questions.' },
    { name: 'Communication', category: 'behavioral', rating: 5, weight: 0.1, comments: 'Articulate, explained complex concepts clearly.' },
  ],
  strengths: 'Excellent TypeScript skills, strong system design thinking, great communicator. Would be a strong contributor from day one.',
  concerns: 'Limited infrastructure/DevOps experience, but this is a nice-to-have.',
  comments: 'Strong recommend for hire. Would be a great addition to the platform team.',
  keyMoments: 'Particularly impressed by their approach to the caching layer design question — proposed a multi-tier strategy that was well-reasoned.',
});

console.log(`Scorecard submitted: ${scorecard.recommendation} (${scorecard.overallRating}/5)`);

// Get aggregated feedback across all interviewers
const feedback = await hiringService.getAggregatedFeedback('application-alex-uuid');
console.log(`\nAggregated Feedback:`);
console.log(`  Average Rating: ${feedback.averageRating}/5`);
console.log(`  Consensus: ${feedback.consensusRecommendation}`);
console.log(`  Scorecards: ${feedback.submittedCount}/${feedback.totalCount}`);
```

### 5. Creating and Managing Offers

```typescript
import { HiringService } from '@mcv/people/hiring';

const hiringService = container.resolve(HiringService);

// Create an offer
const offer = await hiringService.createOffer({
  applicationId: 'application-alex-uuid',
  offerTitle: 'Senior Full-Stack Engineer',
  startDate: new Date('2025-04-14'),
  expiresAt: new Date('2025-03-28'),
  compensation: {
    baseSalary: {
      amount: 210000,
      currency: 'USD',
      period: 'annual',
    },
    signingBonus: {
      amount: 15000,
      currency: 'USD',
      conditions: 'Payable within first paycheck. Subject to 1-year clawback.',
    },
    annualBonus: {
      targetPercent: 15,
      maxPercent: 25,
      conditions: 'Based on individual and company performance.',
    },
    equity: {
      type: 'rsu',
      amount: 75000,
      vestingSchedule: '4-year vest, 1-year cliff, quarterly thereafter',
      cliffMonths: 12,
      vestingMonths: 48,
      strikePrice: null,
    },
    relocation: null,
    additionalBenefits: [
      { name: 'Health Insurance', description: 'Platinum PPO plan, 100% employee premium covered', value: 18000 },
      { name: 'Learning Budget', description: '$5,000 annual for conferences, courses, books', value: 5000 },
      { name: 'Home Office', description: 'One-time $2,000 home office setup stipend', value: 2000 },
    ],
    ptoDays: null, // Unlimited PTO
    totalCompEstimate: 268750, // base + target bonus + equity/year + benefits
  },
  workArrangement: 'hybrid',
  workLocation: 'San Francisco, CA',
  reportingManagerId: 'user-sarah-uuid',
  departmentId: 'dept-engineering-uuid',
  approverIds: ['user-sarah-uuid', 'user-vp-eng-uuid', 'user-hr-director-uuid'],
  offerLetterTemplateId: 'template-standard-offer-uuid',
});

console.log(`Offer created: v${offer.version} — Total comp: $${offer.compensation.totalCompEstimate.toLocaleString()}`);

// Submit for approval chain
await hiringService.submitForApproval(offer.id);
console.log('Offer submitted for approval');

// Approvers approve in sequence
await hiringService.approveOffer(offer.id, 'Great candidate, strong yes from the team.');
await hiringService.approveOffer(offer.id, 'Approved. Comp is within band.');
await hiringService.approveOffer(offer.id, 'HR approved.');

// Extend the offer to the candidate
const extended = await hiringService.extendOffer(offer.id);
console.log(`Offer extended to candidate. Status: ${extended.status}`);

// Send for e-signature via DocuSign
const signed = await hiringService.sendForSignature(offer.id);
console.log(`E-signature envelope sent. Status: ${signed.eSignature.status}`);

// When candidate accepts
const accepted = await hiringService.recordOfferAcceptance(offer.id);
console.log(`🎉 Offer accepted! Start date: ${accepted.startDate}`);
// This triggers:
//   1. Application status → hired
//   2. Job filledCount incremented
//   3. Event: offer.accepted + candidate.hired emitted
//   4. Referral bonus processing (if applicable)
//   5. Onboarding handoff to @mcv/people/onboarding
```

### 6. Employee Referral Program

```typescript
import { HiringService } from '@mcv/people/hiring';

const hiringService = container.resolve(HiringService);

// Employee submits a referral
const referral = await hiringService.submitReferral({
  referrerId: 'user-employee-jane-uuid',
  jobId: 'job-senior-engineer-uuid',
  candidate: {
    firstName: 'Marcus',
    lastName: 'Johnson',
    email: 'marcus.j@example.com',
    phone: '+1-415-555-0456',
  },
  relationship: 'Former colleague at TechCorp',
  howKnown: 'Worked together for 3 years on the platform team',
  recommendation: `Marcus is an exceptional engineer. We worked together at TechCorp
    where he led the migration from a monolith to microservices. He's a strong
    TypeScript developer with excellent system design skills. He'd be a perfect
    fit for the platform team.`,
  resumeFile: {
    filename: 'marcus_johnson_resume.pdf',
    mimeType: 'application/pdf',
    buffer: resumeBuffer,
  },
});

console.log(`Referral submitted: ${referral.id}`);
console.log(`Status: ${referral.status}`);

// Track referral through the pipeline
const employeeReferrals = await hiringService.listEmployeeReferrals('user-employee-jane-uuid');
for (const ref of employeeReferrals) {
  console.log(`${ref.candidateId} → Job: ${ref.jobId} — Status: ${ref.status}`);
}

// After the referred candidate is hired and completes retention period
const bonus = await hiringService.processReferralBonus(referral.id);
console.log(`Referral bonus: $${bonus.amount} ${bonus.currency}`);
console.log(`Payment status: ${bonus.paymentStatus}`);

// Get referral program analytics
const referralAnalytics = await hiringService.getReferralAnalytics({
  start: new Date('2025-01-01'),
  end: new Date('2025-03-31'),
});
console.log(`\nReferral Program Q1 2025:`);
console.log(`  Total referrals: ${referralAnalytics.totalReferrals}`);
console.log(`  Hired: ${referralAnalytics.hiredCount}`);
console.log(`  Conversion rate: ${referralAnalytics.conversionRate}%`);
console.log(`  Total bonuses paid: $${referralAnalytics.totalBonusesPaid}`);
console.log(`  Avg time-to-hire (referrals): ${referralAnalytics.avgTimeToHire} days`);
console.log(`  Top referrers: ${referralAnalytics.topReferrers.map(r => r.name).join(', ')}`);
```

### 7. Hiring Analytics Dashboard

```typescript
import { HiringService } from '@mcv/people/hiring';

const hiringService = container.resolve(HiringService);

// Get comprehensive hiring analytics
const analytics = await hiringService.getAnalytics({
  dateRange: {
    start: new Date('2025-01-01'),
    end: new Date('2025-03-31'),
  },
  groupBy: 'department',
});

// Summary metrics
console.log('=== Q1 2025 Hiring Report ===\n');
console.log(`Open Jobs: ${analytics.summary.openJobs} / ${analytics.summary.totalJobs}`);
console.log(`Applications: ${analytics.summary.totalApplications}`);
console.log(`Hires: ${analytics.summary.totalHires}`);
console.log(`Avg Time-to-Hire: ${analytics.summary.averageTimeToHire} days`);
console.log(`Avg Cost-per-Hire: $${analytics.summary.averageCostPerHire.toLocaleString()}`);
console.log(`Offer Acceptance Rate: ${analytics.summary.offerAcceptanceRate}%`);

// Source effectiveness
console.log('\n--- Source Effectiveness ---');
for (const source of analytics.sourceEffectiveness) {
  console.log(`\n${source.source}:`);
  console.log(`  Applications: ${source.applicationsCount}`);
  console.log(`  Hired: ${source.hiredCount}`);
  console.log(`  Conversion: ${source.overallConversionRate}%`);
  console.log(`  Cost/Hire: $${source.costPerHire.toLocaleString()}`);
  console.log(`  Avg Match Score: ${source.averageMatchScore}`);
}

// Pipeline conversion funnel
console.log('\n--- Pipeline Funnel ---');
for (const stage of analytics.pipelineConversion) {
  const bar = '█'.repeat(Math.round(stage.conversionRate / 5));
  console.log(`${stage.stageName.padEnd(15)} ${bar} ${stage.conversionRate}% (${stage.enteredCount} → ${stage.exitedCount})`);
}

// Diversity metrics
console.log('\n--- Diversity Report ---');
const diversityReport = await hiringService.getDiversityMetrics({
  dateRange: { start: new Date('2025-01-01'), end: new Date('2025-03-31') },
});

for (const metric of diversityReport) {
  console.log(`\n${metric.dimension}:`);
  for (const cat of metric.categories) {
    console.log(`  ${cat.category}: ${cat.percent}% (conversion: ${cat.conversionRate}%)`);
  }
}

// Export report
const report = await hiringService.exportReport({
  type: 'comprehensive',
  format: 'pdf',
  dateRange: { start: new Date('2025-01-01'), end: new Date('2025-03-31') },
  sections: ['summary', 'source_effectiveness', 'pipeline', 'diversity', 'interviewer_calibration'],
});
console.log(`\nReport exported: ${report.url} (expires: ${report.expiresAt})`);
```

### 8. Talent Pool Management and Nurture Campaigns

```typescript
import { HiringService } from '@mcv/people/hiring';

const hiringService = container.resolve(HiringService);

// Create a talent pool for silver medalists
const pool = await hiringService.createTalentPool({
  name: 'Engineering Silver Medalists — Q1 2025',
  description: 'Strong engineering candidates who made it to final rounds but were not selected. Re-engage for future roles.',
  type: 'silver_medalist',
  departmentId: 'dept-engineering-uuid',
  autoCriteria: {
    skills: ['typescript', 'react', 'nodejs'],
    minExperienceYears: 3,
    locations: [],
    sources: [],
    tags: [],
  },
});

console.log(`Talent pool created: ${pool.name} (${pool.id})`);

// Add silver medalist candidates
const members = await hiringService.addToTalentPool(
  pool.id,
  ['candidate-bob-uuid', 'candidate-carla-uuid', 'candidate-dave-uuid'],
  'Strong final-round candidates for the Senior Engineer role. Consider for future openings.',
);
console.log(`Added ${members.length} candidates to pool`);

// Launch a nurture campaign
const campaign = await hiringService.launchNurtureCampaign(pool.id, {
  name: 'Engineering Talent Re-engagement — Spring 2025',
  type: 'drip',
  steps: [
    {
      order: 1,
      delayDays: 0,
      subject: 'Thank you for interviewing with us',
      templateId: 'template-silver-medalist-thanks-uuid',
    },
    {
      order: 2,
      delayDays: 30,
      subject: 'What we\'re building at {{company_name}}',
      templateId: 'template-company-update-uuid',
    },
    {
      order: 3,
      delayDays: 60,
      subject: 'New engineering opportunities at {{company_name}}',
      templateId: 'template-new-roles-uuid',
    },
    {
      order: 4,
      delayDays: 90,
      subject: 'Let\'s reconnect — {{candidate_first_name}}',
      templateId: 'template-reconnect-uuid',
    },
  ],
});

console.log(`Nurture campaign launched: ${campaign.name}`);
console.log(`  Status: ${campaign.status}`);
console.log(`  Steps: ${campaign.steps.length}`);
console.log(`  Targeted: ${campaign.metrics.totalTargeted} candidates`);

// Check campaign metrics after some time
const updatedCampaign = await hiringService.getTalentPool(pool.id);
console.log(`\nPool: ${updatedCampaign.name}`);
console.log(`  Members: ${updatedCampaign.memberCount}`);
for (const member of updatedCampaign.members) {
  console.log(`  • ${member.candidateId} — Engagement: ${member.engagementScore} — Last contact: ${member.lastContactedAt}`);
}
```

---

## Error Codes

All errors from `@mcv/people/hiring` use the `HIRING_` prefix and follow the MCV error code convention. Errors are thrown as `HiringError` instances with structured metadata.

```typescript
import { HiringError, HIRING_ERROR_CODES } from '@mcv/people/hiring';

try {
  await hiringService.moveToStage(appId, stageId);
} catch (error) {
  if (error instanceof HiringError) {
    console.error(`[${error.code}] ${error.message}`);
    console.error('Details:', error.metadata);
  }
}
```

| Code | HTTP | Description |
|------|------|-------------|
| `HIRING_JOB_NOT_FOUND` | 404 | Job with the specified ID does not exist or is not accessible to the current tenant. |
| `HIRING_JOB_CLOSED` | 409 | Cannot perform the requested action because the job is closed or archived. |
| `HIRING_JOB_APPROVAL_REQUIRED` | 403 | Job must be approved before it can be published or accept applications. |
| `HIRING_JOB_HEADCOUNT_FILLED` | 409 | All positions for this job have been filled. No more hires can be made. |
| `HIRING_APPLICATION_NOT_FOUND` | 404 | Application with the specified ID does not exist or is not accessible. |
| `HIRING_APPLICATION_DUPLICATE` | 409 | A candidate already has an active application for this job. |
| `HIRING_APPLICATION_CLOSED` | 409 | Cannot modify an application that is in a terminal state (hired, rejected, withdrawn). |
| `HIRING_STAGE_INVALID_TRANSITION` | 422 | The requested stage transition is not valid from the current stage. |
| `HIRING_STAGE_NOT_FOUND` | 404 | The specified hiring stage does not exist for this job or tenant. |
| `HIRING_STAGE_REQUIRES_APPROVAL` | 403 | Moving to this stage requires approval that has not been granted. |
| `HIRING_CANDIDATE_NOT_FOUND` | 404 | Candidate with the specified ID does not exist or is not accessible. |
| `HIRING_CANDIDATE_DO_NOT_CONTACT` | 403 | Candidate has been flagged as do-not-contact. No outreach allowed. |
| `HIRING_CANDIDATE_DUPLICATE_EMAIL` | 409 | A candidate with this email already exists in the tenant. Use merge or update. |
| `HIRING_RESUME_PARSE_FAILED` | 500 | Resume parsing failed. The file may be corrupted, password-protected, or in an unsupported format. |
| `HIRING_RESUME_TOO_LARGE` | 413 | Resume file exceeds the maximum allowed size (default: 10MB). |
| `HIRING_RESUME_UNSUPPORTED_FORMAT` | 415 | Resume file format is not supported. Accepted: PDF, DOCX, DOC, TXT, RTF. |
| `HIRING_INTERVIEW_NOT_FOUND` | 404 | Interview with the specified ID does not exist or is not accessible. |
| `HIRING_INTERVIEW_CONFLICT` | 409 | Scheduling conflict: one or more interviewers are unavailable at the requested time. |
| `HIRING_INTERVIEW_PAST_DATE` | 422 | Cannot schedule an interview in the past. |
| `HIRING_INTERVIEW_CANCELLED` | 409 | Cannot modify a cancelled interview. Create a new one instead. |
| `HIRING_SCORECARD_ALREADY_SUBMITTED` | 409 | This interviewer has already submitted a scorecard for this interview. |
| `HIRING_SCORECARD_NOT_INTERVIEWER` | 403 | Only assigned interviewers can submit scorecards for an interview. |
| `HIRING_OFFER_NOT_FOUND` | 404 | Offer with the specified ID does not exist or is not accessible. |
| `HIRING_OFFER_NOT_APPROVED` | 403 | Offer must be fully approved before it can be extended to the candidate. |
| `HIRING_OFFER_EXPIRED` | 410 | The offer has expired and can no longer be accepted. Create a new offer. |
| `HIRING_OFFER_ALREADY_ACCEPTED` | 409 | This offer has already been accepted. |
| `HIRING_OFFER_ALREADY_REVOKED` | 409 | This offer has already been revoked and cannot be modified. |
| `HIRING_REFERRAL_SELF_REFERRAL` | 422 | Employees cannot refer themselves. |
| `HIRING_REFERRAL_DUPLICATE` | 409 | This candidate has already been referred for this job. |
| `HIRING_REFERRAL_BONUS_NOT_ELIGIBLE` | 422 | Referral bonus cannot be processed: retention requirement not met or referral is ineligible. |
| `HIRING_TALENT_POOL_NOT_FOUND` | 404 | Talent pool with the specified ID does not exist or is not accessible. |
| `HIRING_TALENT_POOL_MEMBER_EXISTS` | 409 | Candidate is already a member of this talent pool. |
| `HIRING_CAMPAIGN_ALREADY_ACTIVE` | 409 | A nurture campaign is already active for this talent pool. Pause or complete it first. |
| `HIRING_BOARD_PUBLISH_FAILED` | 502 | Failed to publish job to the external job board. Check board credentials and configuration. |
| `HIRING_BOARD_NOT_CONFIGURED` | 422 | The specified job board has not been configured for this tenant. |
| `HIRING_ESIGNATURE_FAILED` | 502 | E-signature provider returned an error. Check provider configuration and connectivity. |
| `HIRING_CALENDAR_SYNC_FAILED` | 502 | Failed to create/update calendar event. Check calendar integration credentials. |
| `HIRING_GDPR_DELETION_ACTIVE_APP` | 409 | Cannot delete candidate data while they have active applications. Withdraw or close applications first. |
| `HIRING_EEO_DATA_REQUIRED` | 422 | EEO self-identification data is required for this tenant's compliance configuration. |
| `HIRING_PORTAL_TOKEN_INVALID` | 401 | Candidate portal token is invalid, expired, or revoked. |
| `HIRING_PORTAL_TOKEN_EXPIRED` | 401 | Candidate portal token has expired. Request a new one. |
| `HIRING_AI_SERVICE_UNAVAILABLE` | 503 | AI service (OpenRouter) is temporarily unavailable. Falling back to rule-based matching. |
| `HIRING_RATE_LIMIT_EXCEEDED` | 429 | Too many requests. Application submission is rate-limited to prevent spam. |
| `HIRING_DATA_RETENTION_EXPIRED` | 410 | Candidate data has been purged per data retention policy. |

---

## Security

### Authentication & Authorization

```typescript
// All hiring endpoints require authentication via @mcv/auth
// Role-based access control with hiring-specific roles:

const HIRING_ROLES = {
  // Full access to all hiring features
  HIRING_ADMIN: 'hiring:admin',

  // Can manage jobs, view all applications, manage offers
  HIRING_MANAGER: 'hiring:manager',

  // Can manage applications, schedule interviews, send offers
  RECRUITER: 'hiring:recruiter',

  // Can view applications for their jobs, submit scorecards
  INTERVIEWER: 'hiring:interviewer',

  // Can submit referrals and track their status
  REFERRER: 'hiring:referrer',

  // Read-only access to hiring analytics
  ANALYTICS_VIEWER: 'hiring:analytics_viewer',

  // Candidate self-service (token-based, not user-based)
  CANDIDATE_PORTAL: 'hiring:candidate_portal',
} as const;

// Permission matrix
const PERMISSIONS = {
  'job:create':          ['hiring:admin', 'hiring:manager'],
  'job:update':          ['hiring:admin', 'hiring:manager', 'hiring:recruiter'],
  'job:publish':         ['hiring:admin', 'hiring:manager'],
  'job:close':           ['hiring:admin', 'hiring:manager'],
  'application:view':    ['hiring:admin', 'hiring:manager', 'hiring:recruiter', 'hiring:interviewer'],
  'application:manage':  ['hiring:admin', 'hiring:manager', 'hiring:recruiter'],
  'application:reject':  ['hiring:admin', 'hiring:manager', 'hiring:recruiter'],
  'interview:schedule':  ['hiring:admin', 'hiring:recruiter'],
  'interview:view':      ['hiring:admin', 'hiring:manager', 'hiring:recruiter', 'hiring:interviewer'],
  'scorecard:submit':    ['hiring:admin', 'hiring:recruiter', 'hiring:interviewer'],
  'scorecard:view_all':  ['hiring:admin', 'hiring:manager', 'hiring:recruiter'],
  'offer:create':        ['hiring:admin', 'hiring:manager', 'hiring:recruiter'],
  'offer:approve':       ['hiring:admin', 'hiring:manager'],
  'offer:extend':        ['hiring:admin', 'hiring:recruiter'],
  'referral:submit':     ['hiring:admin', 'hiring:recruiter', 'hiring:referrer'],
  'referral:manage':     ['hiring:admin', 'hiring:recruiter'],
  'talent_pool:manage':  ['hiring:admin', 'hiring:recruiter'],
  'analytics:view':      ['hiring:admin', 'hiring:manager', 'hiring:analytics_viewer'],
  'compliance:manage':   ['hiring:admin'],
  'gdpr:process':        ['hiring:admin'],
};
```

### Data Protection

```typescript
// Candidate PII encryption at rest
// All sensitive candidate data is encrypted using AES-256-GCM
// Encryption keys are managed via @mcv/security/encryption

const ENCRYPTED_FIELDS = [
  'candidates.email',
  'candidates.phone',
  'candidates.profile',       // contains work history, education, etc.
  'eeo_records.gender',       // EEO data is doubly isolated
  'eeo_records.ethnicity',
  'eeo_records.veteran_status',
  'eeo_records.disability_status',
  'job_boards.credentials',   // API keys for job board integrations
];

// PII access is logged for audit
// Every access to candidate PII generates an audit log entry
```

### Multi-Tenant Isolation

```typescript
// Row-Level Security (RLS) ensures tenant isolation at the database level
// No application-level bugs can leak data across tenants

// RLS is enforced on ALL hiring tables:
const RLS_TABLES = [
  'hiring_jobs', 'hiring_applications', 'hiring_candidates',
  'hiring_interviews', 'hiring_interview_scorecards', 'hiring_offers',
  'hiring_referrals', 'hiring_talent_pools', 'hiring_talent_pool_members',
  'hiring_stages', 'hiring_job_boards', 'hiring_candidate_documents',
  'hiring_eeo_records', 'hiring_offer_approvals', 'hiring_nurture_campaigns',
  'hiring_activity_log',
];

// Tenant context is set at the connection level
// via Supabase's app.tenant_id runtime parameter
```

### Candidate Portal Security

```typescript
// Candidate portal uses short-lived JWT tokens (24h)
// Tokens are scoped to a specific candidate and their applications
// No tenant credentials or internal user sessions are exposed

interface CandidatePortalToken {
  sub: string;           // candidate ID
  iss: 'mcv-hiring';
  type: 'candidate_portal';
  tenantId: string;
  applicationIds: string[];   // scoped to specific applications
  exp: number;                // 24h expiry
  iat: number;
}

// Portal tokens are generated via:
// 1. Magic link sent to candidate's verified email
// 2. OAuth via LinkedIn (if configured)
// 3. Direct link from recruiter (generates one-time token)
```

### Scorecard Visibility Controls

```typescript
// Scorecard visibility is carefully controlled to prevent anchoring bias:

// Before all scorecards are submitted:
//   - Interviewers can ONLY see their own draft/submitted scorecard
//   - Other interviewers' scores are hidden
//   - This prevents anchoring bias

// After all scorecards for an interview are submitted:
//   - All interviewers can see each other's scorecards (if visibleToPanel=true)
//   - Hiring managers and recruiters can see all scorecards

// Configuration option:
//   scorecardVisibility: 'hidden_until_all_submitted' | 'always_visible' | 'never_visible_to_peers'
```

### Data Retention & GDPR

```typescript
// Configurable per-tenant data retention policies

interface DataRetentionPolicy {
  // How long to retain candidate data after last activity
  candidateRetentionDays: number; // default: 365 (1 year)

  // How long to retain rejected application data
  rejectedApplicationRetentionDays: number; // default: 180 (6 months)

  // How long to retain hired candidate data (usually longer for employment records)
  hiredRetentionDays: number; // default: 2555 (7 years, for tax/compliance)

  // Whether to anonymize or hard-delete
  retentionAction: 'anonymize' | 'delete';

  // EEO data retention (may have separate legal requirements)
  eeoRetentionDays: number; // default: 730 (2 years, per EEOC)

  // Automatic cleanup schedule
  cleanupSchedule: 'daily' | 'weekly' | 'monthly';
}

// GDPR candidate rights:
// - Right to access: candidates can request all data held about them
// - Right to portability: data export in machine-readable format (JSON)
// - Right to erasure: candidates can request deletion of their data
// - Right to rectification: candidates can update their data via portal
// - Consent tracking: all data collection consent is recorded with timestamps
```

### Audit Logging

```typescript
// Every significant action in the hiring system is logged to hiring_activity_log
// Logs are immutable and retained per compliance requirements

// Actions that generate audit logs:
const AUDITED_ACTIONS = [
  'job.created', 'job.updated', 'job.published', 'job.closed',
  'application.received', 'application.stage_changed', 'application.rejected',
  'application.withdrawn', 'application.hired',
  'candidate.created', 'candidate.updated', 'candidate.merged',
  'candidate.pii_accessed', 'candidate.data_exported', 'candidate.data_deleted',
  'interview.scheduled', 'interview.rescheduled', 'interview.cancelled',
  'interview.completed', 'interview.no_show',
  'scorecard.submitted', 'scorecard.updated',
  'offer.created', 'offer.submitted_for_approval', 'offer.approved',
  'offer.rejected', 'offer.extended', 'offer.accepted', 'offer.declined',
  'offer.revoked', 'offer.esignature_sent', 'offer.esignature_signed',
  'referral.submitted', 'referral.bonus_processed',
  'talent_pool.created', 'talent_pool.member_added', 'talent_pool.member_removed',
  'campaign.launched', 'campaign.paused', 'campaign.completed',
  'eeo.data_recorded', 'gdpr.access_request', 'gdpr.deletion_request',
  'retention.cleanup_executed',
];
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `HIRING_DATABASE_URL` | Yes | — | Supabase PostgreSQL connection string for hiring tables. |
| `HIRING_OPENROUTER_API_KEY` | Yes | — | OpenRouter API key for AI resume parsing and skill matching. |
| `HIRING_OPENROUTER_MODEL` | No | `anthropic/claude-sonnet-4-20250514` | Default model for resume parsing. Must support structured output. |
| `HIRING_OPENROUTER_FALLBACK_MODEL` | No | `openai/gpt-4o-mini` | Fallback model if primary is unavailable. |
| `HIRING_AI_ENABLED` | No | `true` | Whether AI features (resume parsing, scoring) are enabled. |
| `HIRING_ENCRYPTION_KEY` | Yes | — | AES-256 key for candidate PII encryption at rest. |
| `HIRING_LINKEDIN_CLIENT_ID` | No | — | LinkedIn API client ID for job board integration. |
| `HIRING_LINKEDIN_CLIENT_SECRET` | No | — | LinkedIn API client secret. |
| `HIRING_INDEED_API_KEY` | No | — | Indeed job board API key. |
| `HIRING_INDEED_EMPLOYER_ID` | No | — | Indeed employer account ID. |
| `HIRING_GREENHOUSE_API_KEY` | No | — | Greenhouse ATS API key (for bi-directional sync). |
| `HIRING_GOOGLE_CALENDAR_CREDENTIALS` | No | — | Google Calendar service account credentials (JSON). |
| `HIRING_OUTLOOK_CLIENT_ID` | No | — | Microsoft Graph API client ID for Outlook calendar. |
| `HIRING_OUTLOOK_CLIENT_SECRET` | No | — | Microsoft Graph API client secret. |
| `HIRING_DOCUSIGN_INTEGRATION_KEY` | No | — | DocuSign integration key for e-signatures. |
| `HIRING_DOCUSIGN_API_BASE_URL` | No | `https://demo.docusign.net` | DocuSign API base URL (`demo` for sandbox, production for live). |
| `HIRING_HELLOSIGN_API_KEY` | No | — | HelloSign API key for e-signatures. |
| `HIRING_CAREER_PAGE_BASE_URL` | No | — | Base URL for the branded career page (e.g., `https://careers.example.com`). |
| `HIRING_CANDIDATE_PORTAL_URL` | No | — | Base URL for the candidate self-service portal. |
| `HIRING_PORTAL_TOKEN_SECRET` | Yes | — | Secret key for signing candidate portal JWT tokens. |
| `HIRING_PORTAL_TOKEN_EXPIRY` | No | `24h` | Candidate portal token expiry duration. |
| `HIRING_MAX_RESUME_SIZE_MB` | No | `10` | Maximum resume file size in megabytes. |
| `HIRING_WEBHOOK_SECRET` | No | — | Secret for validating inbound webhooks from job boards. |
| `HIRING_RATE_LIMIT_APPLICATIONS` | No | `10` | Maximum applications per candidate per hour (anti-spam). |
| `HIRING_DEFAULT_OFFER_EXPIRY_DAYS` | No | `14` | Default number of days before an offer expires. |
| `HIRING_REFERRAL_BONUS_DEFAULT` | No | `2500` | Default referral bonus amount (in primary currency). |
| `HIRING_REFERRAL_RETENTION_DAYS` | No | `90` | Days after hire before referral bonus is eligible. |
| `HIRING_DATA_RETENTION_DAYS` | No | `365` | Default candidate data retention period in days. |
| `HIRING_EEO_RETENTION_DAYS` | No | `730` | EEO data retention period (EEOC requires minimum 1 year). |
| `HIRING_STORAGE_BUCKET` | No | `hiring-documents` | Supabase storage bucket name for candidate documents. |
| `HIRING_EMAIL_FROM_ADDRESS` | No | — | Sender email for candidate notifications (e.g., `hiring@example.com`). |
| `HIRING_EMAIL_FROM_NAME` | No | — | Sender name for candidate notifications. |

---

## Dependencies

### Internal Dependencies

| Module | Purpose |
|--------|---------|
| `@mcv/core` | Base types, error handling, pagination, tenant context, event bus |
| `@mcv/auth` | Authentication, authorization, role-based access control |
| `@mcv/db` | Drizzle ORM setup, connection pooling, migration runner |
| `@mcv/storage` | Supabase storage for candidate documents and resumes |
| `@mcv/email` | Email sending for candidate notifications, offer letters, nurture campaigns |
| `@mcv/security/encryption` | AES-256 encryption for candidate PII at rest |
| `@mcv/people/core` | Employee/user references for hiring managers, interviewers, recruiters |
| `@mcv/people/directory` | Department and organizational structure lookups |
| `@mcv/people/onboarding` | Handoff for hired candidates (post-offer acceptance) |
| `@mcv/ai` | OpenRouter integration for resume parsing and skill matching |
| `@mcv/notifications` | In-app notifications for interviewers, approvers, and recruiters |
| `@mcv/calendar` | Calendar integration abstraction (Google Calendar, Outlook) |
| `@mcv/templates` | Template engine for offer letters, email templates, scorecard templates |
| `@mcv/audit` | Audit logging infrastructure |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `drizzle-orm` | `^0.30.0` | ORM for type-safe database queries |
| `@trpc/server` | `^10.0.0` | Type-safe API layer |
| `zod` | `^3.22.0` | Input validation and schema definition |
| `pdf-parse` | `^1.1.1` | PDF text extraction for resume parsing |
| `mammoth` | `^1.6.0` | DOCX text extraction for resume parsing |
| `ical-generator` | `^7.0.0` | iCal event generation for interview scheduling |
| `date-fns` | `^3.0.0` | Date manipulation for scheduling and analytics |
| `date-fns-tz` | `^3.0.0` | Timezone-aware date handling |
| `jsonwebtoken` | `^9.0.0` | JWT generation/verification for candidate portal tokens |
| `nanoid` | `^5.0.0` | Short ID generation for job reference codes |
| `bullmq` | `^5.0.0` | Job queue for async operations (board sync, campaign sending, cleanup) |

---

## Testing

### Unit Tests

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JobService } from '../services/job.service';
import { createMockDb, createMockTenantContext } from '@mcv/testing';

describe('JobService', () => {
  let jobService: JobService;
  let mockDb: ReturnType<typeof createMockDb>;
  let tenantCtx: ReturnType<typeof createMockTenantContext>;

  beforeEach(() => {
    mockDb = createMockDb();
    tenantCtx = createMockTenantContext({ tenantId: 'tenant-test-uuid' });
    jobService = new JobService(mockDb, tenantCtx);
  });

  describe('createJob', () => {
    it('should create a job with generated reference code', async () => {
      const job = await jobService.create({
        title: 'Software Engineer',
        description: '<p>Test job</p>',
        hiringManagerId: 'user-hm-uuid',
        type: 'full_time',
        workArrangement: 'remote',
        locations: [],
        requirements: [],
        headcount: 1,
      });

      expect(job.id).toBeDefined();
      expect(job.referenceCode).toMatch(/^ENG-\d{4}-\d{3}$/);
      expect(job.status).toBe('draft');
      expect(job.tenantId).toBe('tenant-test-uuid');
    });

    it('should reject job creation with headcount < 1', async () => {
      await expect(
        jobService.create({ ...validInput, headcount: 0 })
      ).rejects.toThrow('HIRING_JOB_INVALID_HEADCOUNT');
    });

    it('should require locations for onsite/hybrid arrangements', async () => {
      await expect(
        jobService.create({ ...validInput, workArrangement: 'onsite', locations: [] })
      ).rejects.toThrow('HIRING_JOB_LOCATION_REQUIRED');
    });
  });

  describe('changeStatus', () => {
    it('should transition from draft to open', async () => {
      mockDb.returning.mockResolvedValueOnce([{ ...mockJob, status: 'open', publishedAt: new Date() }]);

      const updated = await jobService.changeStatus(mockJob.id, 'open');
      expect(updated.status).toBe('open');
      expect(updated.publishedAt).toBeDefined();
    });

    it('should not allow reopening an archived job', async () => {
      mockDb.returning.mockResolvedValueOnce([{ ...mockJob, status: 'archived' }]);

      await expect(
        jobService.changeStatus(mockJob.id, 'open')
      ).rejects.toThrow('HIRING_JOB_CLOSED');
    });
  });
});

describe('StageTransitionEngine', () => {
  it('should validate allowed transitions', () => {
    const engine = new StageTransitionEngine(defaultStages);

    expect(engine.canTransition('applied', 'screening')).toBe(true);
    expect(engine.canTransition('screening', 'interview')).toBe(true);
    expect(engine.canTransition('interview', 'offer')).toBe(true);
    expect(engine.canTransition('offer', 'hired')).toBe(true);
    expect(engine.canTransition('hired', 'screening')).toBe(false);
    expect(engine.canTransition('rejected', 'interview')).toBe(false);
  });

  it('should allow rejection from any non-terminal stage', () => {
    const engine = new StageTransitionEngine(defaultStages);

    expect(engine.canTransition('applied', 'rejected')).toBe(true);
    expect(engine.canTransition('screening', 'rejected')).toBe(true);
    expect(engine.canTransition('interview', 'rejected')).toBe(true);
    expect(engine.canTransition('offer', 'rejected')).toBe(true);
    expect(engine.canTransition('hired', 'rejected')).toBe(false);
  });

  it('should allow withdrawal from any non-terminal stage', () => {
    const engine = new StageTransitionEngine(defaultStages);

    expect(engine.canTransition('applied', 'withdrawn')).toBe(true);
    expect(engine.canTransition('interview', 'withdrawn')).toBe(true);
    expect(engine.canTransition('hired', 'withdrawn')).toBe(false);
  });
});
```

### Integration Tests

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestHiringService, seedTestData, cleanupTestData } from '../testing/helpers';

describe('Hiring Pipeline Integration', () => {
  let service: Awaited<ReturnType<typeof createTestHiringService>>;
  let testData: Awaited<ReturnType<typeof seedTestData>>;

  beforeAll(async () => {
    service = await createTestHiringService();
    testData = await seedTestData(service);
  });

  afterAll(async () => {
    await cleanupTestData(service);
  });

  it('should process an application through the full pipeline', async () => {
    // 1. Submit application
    const application = await service.submitApplication({
      jobId: testData.job.id,
      candidate: {
        firstName: 'Test',
        lastName: 'Candidate',
        email: `test-${Date.now()}@example.com`,
        source: 'direct_application',
      },
    });
    expect(application.status).toBe('active');

    // 2. Move to screening
    const screened = await service.moveToStage(application.id, testData.stages.screening.id);
    expect(screened.currentStageId).toBe(testData.stages.screening.id);
    expect(screened.stageHistory).toHaveLength(1);

    // 3. Move to interview
    const interviewed = await service.moveToStage(application.id, testData.stages.interview.id);
    expect(interviewed.currentStageId).toBe(testData.stages.interview.id);

    // 4. Schedule and complete interview
    const interview = await service.scheduleInterview({
      applicationId: application.id,
      type: 'technical',
      title: 'Technical Screen',
      scheduledAt: new Date(Date.now() + 86400000),
      duration: 60,
      timezone: 'UTC',
      interviewers: [{ userId: testData.interviewer.id, role: 'lead' }],
    });
    expect(interview.status).toBe('scheduled');

    // 5. Submit scorecard
    const scorecard = await service.submitScorecard({
      interviewId: interview.id,
      overallRating: 4,
      recommendation: 'hire',
      criteria: [
        { name: 'Technical', category: 'technical', rating: 4, weight: 0.5, comments: 'Good' },
        { name: 'Communication', category: 'behavioral', rating: 5, weight: 0.5, comments: 'Great' },
      ],
      strengths: 'Strong technical skills',
      concerns: 'None',
      comments: 'Recommend hire',
    });
    expect(scorecard.status).toBe('submitted');

    // 6. Move to offer stage
    const offered = await service.moveToStage(application.id, testData.stages.offer.id);
    expect(offered.currentStageId).toBe(testData.stages.offer.id);

    // 7. Create and extend offer
    const offer = await service.createOffer({
      applicationId: application.id,
      offerTitle: 'Software Engineer',
      startDate: new Date(Date.now() + 30 * 86400000),
      expiresAt: new Date(Date.now() + 14 * 86400000),
      compensation: {
        baseSalary: { amount: 150000, currency: 'USD', period: 'annual' },
        additionalBenefits: [],
        totalCompEstimate: 150000,
      },
      workArrangement: 'remote',
      approverIds: [testData.hiringManager.id],
    });

    await service.approveOffer(offer.id, 'Approved');
    const extended = await service.extendOffer(offer.id);
    expect(extended.status).toBe('extended');

    // 8. Accept offer → candidate hired
    const accepted = await service.recordOfferAcceptance(offer.id);
    expect(accepted.status).toBe('accepted');

    // Verify application is now hired
    const finalApp = await service.getApplication(application.id);
    expect(finalApp.status).toBe('hired');
    expect(finalApp.hiredAt).toBeDefined();

    // Verify job filled count incremented
    const updatedJob = await service.getJob(testData.job.id);
    expect(updatedJob.filledCount).toBe(testData.job.filledCount + 1);
  });

  it('should enforce unique application per candidate per job', async () => {
    const candidate = testData.candidates[0];

    await service.submitApplication({
      jobId: testData.job.id,
      candidate: { firstName: candidate.firstName, lastName: candidate.lastName, email: candidate.email, source: 'direct_application' },
    });

    await expect(
      service.submitApplication({
        jobId: testData.job.id,
        candidate: { firstName: candidate.firstName, lastName: candidate.lastName, email: candidate.email, source: 'direct_application' },
      })
    ).rejects.toThrow('HIRING_APPLICATION_DUPLICATE');
  });

  it('should enforce tenant isolation', async () => {
    const otherTenantService = await createTestHiringService({ tenantId: 'other-tenant-uuid' });

    // Should not find jobs from the other tenant
    const jobs = await otherTenantService.listJobs({});
    expect(jobs.items).toHaveLength(0);

    // Should not access applications from the other tenant
    await expect(
      otherTenantService.getApplication(testData.applications[0].id)
    ).rejects.toThrow('HIRING_APPLICATION_NOT_FOUND');
  });
});
```

### Resume Parsing Tests

```typescript
import { describe, it, expect, vi } from 'vitest';
import { ResumeParserService } from '../services/resume-parser.service';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('ResumeParserService', () => {
  const parser = new ResumeParserService({
    openRouterApiKey: 'test-key',
    model: 'anthropic/claude-sonnet-4-20250514',
  });

  it('should parse a PDF resume and extract structured data', async () => {
    const pdfBuffer = readFileSync(join(__dirname, 'fixtures', 'sample-resume.pdf'));

    const result = await parser.parse(pdfBuffer, 'application/pdf');

    expect(result.confidenceScore).toBeGreaterThan(0.7);
    expect(result.personal.name).toBeDefined();
    expect(result.personal.email).toBeDefined();
    expect(result.skills.length).toBeGreaterThan(0);
    expect(result.experience.length).toBeGreaterThan(0);
    expect(result.education.length).toBeGreaterThan(0);
    expect(result.aiSummary).toBeDefined();
    expect(result.rawText.length).toBeGreaterThan(100);
  });

  it('should parse a DOCX resume', async () => {
    const docxBuffer = readFileSync(join(__dirname, 'fixtures', 'sample-resume.docx'));

    const result = await parser.parse(docxBuffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

    expect(result.confidenceScore).toBeGreaterThan(0.7);
    expect(result.skills.length).toBeGreaterThan(0);
  });

  it('should detect employment gaps', async () => {
    const resumeWithGap = readFileSync(join(__dirname, 'fixtures', 'resume-with-gap.pdf'));

    const result = await parser.parse(resumeWithGap, 'application/pdf');

    const gapFlags = result.redFlags.filter(f => f.type === 'employment_gap');
    expect(gapFlags.length).toBeGreaterThan(0);
    expect(gapFlags[0].severity).toBeDefined();
  });

  it('should fall back to rule-based parsing when AI is unavailable', async () => {
    const fallbackParser = new ResumeParserService({
      openRouterApiKey: 'invalid-key',
      model: 'anthropic/claude-sonnet-4-20250514',
      fallbackEnabled: true,
    });

    const pdfBuffer = readFileSync(join(__dirname, 'fixtures', 'sample-resume.pdf'));
    const result = await fallbackParser.parse(pdfBuffer, 'application/pdf');

    // Should still produce results, just lower confidence
    expect(result.confidenceScore).toBeLessThan(0.5);
    expect(result.rawText.length).toBeGreaterThan(0);
    expect(result.skills.length).toBeGreaterThanOrEqual(0); // May find some via keywords
  });

  it('should reject files over the size limit', async () => {
    const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB

    await expect(
      parser.parse(largeBuffer, 'application/pdf')
    ).rejects.toThrow('HIRING_RESUME_TOO_LARGE');
  });

  it('should reject unsupported file formats', async () => {
    const buffer = Buffer.from('test');

    await expect(
      parser.parse(buffer, 'image/png')
    ).rejects.toThrow('HIRING_RESUME_UNSUPPORTED_FORMAT');
  });
});
```

### Analytics Tests

```typescript
import { describe, it, expect } from 'vitest';
import { HiringAnalyticsService } from '../services/hiring-analytics.service';
import { createTestHiringService, seedAnalyticsTestData } from '../testing/helpers';

describe('HiringAnalyticsService', () => {
  it('should calculate time-to-hire correctly', async () => {
    const service = await createTestHiringService();
    const testData = await seedAnalyticsTestData(service, {
      hiredCandidates: 10,
      averageDaysToHire: 25,
    });

    const metrics = await service.getTimeToHire({
      dateRange: { start: testData.startDate, end: testData.endDate },
      groupBy: 'overall',
    });

    expect(metrics.length).toBeGreaterThan(0);
    expect(metrics[0].averageDays).toBeCloseTo(25, 0);
    expect(metrics[0].medianDays).toBeDefined();
    expect(metrics[0].stageBreakdown.length).toBeGreaterThan(0);
  });

  it('should calculate source effectiveness with conversion rates', async () => {
    const service = await createTestHiringService();
    const testData = await seedAnalyticsTestData(service, {
      sources: ['career_page', 'linkedin', 'referral'],
    });

    const effectiveness = await service.getSourceEffectiveness({
      dateRange: { start: testData.startDate, end: testData.endDate },
    });

    expect(effectiveness.length).toBe(3);
    for (const source of effectiveness) {
      expect(source.applicationsCount).toBeGreaterThan(0);
      expect(source.overallConversionRate).toBeGreaterThanOrEqual(0);
      expect(source.overallConversionRate).toBeLessThanOrEqual(100);
      expect(source.costPerHire).toBeGreaterThanOrEqual(0);
    }
  });

  it('should generate pipeline conversion funnel', async () => {
    const service = await createTestHiringService();
    const testData = await seedAnalyticsTestData(service);

    const funnel = await service.getPipelineConversion(testData.job.id);

    expect(funnel.length).toBeGreaterThan(0);

    // Verify funnel shape: each stage should have <= entries of previous stage
    for (let i = 1; i < funnel.length; i++) {
      expect(funnel[i].enteredCount).toBeLessThanOrEqual(funnel[i - 1].enteredCount);
    }

    // Verify conversion rates are between 0 and 100
    for (const stage of funnel) {
      expect(stage.conversionRate).toBeGreaterThanOrEqual(0);
      expect(stage.conversionRate).toBeLessThanOrEqual(100);
    }
  });

  it('should calculate diversity metrics without exposing individual data', async () => {
    const service = await createTestHiringService();
    const testData = await seedAnalyticsTestData(service, {
      eeoDataEnabled: true,
    });

    const diversity = await service.getDiversityMetrics({
      dateRange: { start: testData.startDate, end: testData.endDate },
    });

    for (const metric of diversity) {
      // Ensure minimum group size for anonymization
      for (const cat of metric.categories) {
        // Groups smaller than 5 should be aggregated into "Other"
        if (cat.category !== 'Other' && cat.category !== 'Prefer not to say') {
          expect(cat.count).toBeGreaterThanOrEqual(5);
        }
      }

      // Percentages should sum to ~100%
      const totalPercent = metric.categories.reduce((sum, c) => sum + c.percent, 0);
      expect(totalPercent).toBeCloseTo(100, 0);
    }
  });
});
```

### GDPR Compliance Tests

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestHiringService, seedTestData } from '../testing/helpers';

describe('GDPR Compliance', () => {
  let service: Awaited<ReturnType<typeof createTestHiringService>>;
  let testData: Awaited<ReturnType<typeof seedTestData>>;

  beforeAll(async () => {
    service = await createTestHiringService();
    testData = await seedTestData(service);
  });

  it('should export all candidate data on access request', async () => {
    const dataExport = await service.processDataAccessRequest(testData.candidates[0].id);

    expect(dataExport.candidate).toBeDefined();
    expect(dataExport.applications).toBeDefined();
    expect(dataExport.interviews).toBeDefined();
    expect(dataExport.documents).toBeDefined();
    expect(dataExport.eeoRecords).toBeDefined();
    expect(dataExport.activityLog).toBeDefined();
    expect(dataExport.format).toBe('json');
    expect(dataExport.exportedAt).toBeDefined();
  });

  it('should anonymize candidate data on deletion request', async () => {
    // First withdraw all active applications
    for (const app of testData.candidates[0].applications.filter(a => a.status === 'active')) {
      await service.moveToStage(app.id, 'withdrawn');
    }

    await service.processDataDeletionRequest(
      testData.candidates[0].id,
      'Candidate requested data deletion per GDPR Article 17',
    );

    // Candidate record should be anonymized
    const candidate = await service.getCandidate(testData.candidates[0].id);
    expect(candidate.firstName).toBe('[REDACTED]');
    expect(candidate.lastName).toBe('[REDACTED]');
    expect(candidate.email).toMatch(/^deleted-[a-z0-9]+@redacted\.invalid$/);
    expect(candidate.phone).toBeNull();
    expect(candidate.profile.skills).toEqual([]);
    expect(candidate.profile.experience).toEqual([]);

    // Verify audit log records the deletion
    // (implementation detail — actual verification would query the log)
  });

  it('should not delete data for candidates with active applications', async () => {
    const candidateWithActiveApp = testData.candidates[1]; // has an active application

    await expect(
      service.processDataDeletionRequest(
        candidateWithActiveApp.id,
        'GDPR request',
      )
    ).rejects.toThrow('HIRING_GDPR_DELETION_ACTIVE_APP');
  });

  it('should run retention cleanup and purge expired data', async () => {
    const result = await service.runRetentionCleanup();

    expect(result.candidatesProcessed).toBeDefined();
    expect(result.candidatesAnonymized).toBeDefined();
    expect(result.documentsDeleted).toBeDefined();
    expect(result.eeoRecordsPurged).toBeDefined();
    expect(result.executionTimeMs).toBeDefined();
  });
});
```

### Test Utilities

```typescript
// testing/helpers.ts — Shared test utilities for hiring module

import { HiringService } from '../services/hiring.service';
import { createTestDb, createTestTenantContext } from '@mcv/testing';

/**
 * Creates a fully wired HiringService for integration testing.
 * Uses a real (test) database with isolated tenant context.
 */
export async function createTestHiringService(overrides?: {
  tenantId?: string;
  aiEnabled?: boolean;
}) {
  const db = await createTestDb();
  const tenantCtx = createTestTenantContext({
    tenantId: overrides?.tenantId ?? `test-tenant-${Date.now()}`,
  });

  return new HiringService({
    db,
    tenantCtx,
    aiEnabled: overrides?.aiEnabled ?? false, // disabled by default in tests
    openRouterApiKey: 'test-key',
  });
}

/**
 * Seeds common test data: a job, hiring stages, candidates, applications.
 */
export async function seedTestData(service: HiringService) {
  // Create default hiring stages
  const stages = await service.updateDefaultStages([
    { id: 'stage-applied', name: 'Applied', type: 'applied', order: 1, color: '#3B82F6', isTerminal: false, slaDays: 3, automations: {} },
    { id: 'stage-screening', name: 'Screening', type: 'screening', order: 2, color: '#F59E0B', isTerminal: false, slaDays: 5, automations: {} },
    { id: 'stage-interview', name: 'Interview', type: 'interview', order: 3, color: '#8B5CF6', isTerminal: false, slaDays: 10, automations: {} },
    { id: 'stage-offer', name: 'Offer', type: 'offer', order: 4, color: '#10B981', isTerminal: false, slaDays: 7, automations: {} },
    { id: 'stage-hired', name: 'Hired', type: 'hired', order: 5, color: '#059669', isTerminal: true, slaDays: null, automations: {} },
    { id: 'stage-rejected', name: 'Rejected', type: 'rejected', order: 6, color: '#EF4444', isTerminal: true, slaDays: null, automations: {} },
  ]);

  // Create test job
  const job = await service.createJob({
    title: 'Test Engineer',
    description: '<p>Test job for integration tests</p>',
    hiringManagerId: 'test-hm-uuid',
    type: 'full_time',
    workArrangement: 'remote',
    locations: [],
    requirements: [
      { category: 'skill', description: 'TypeScript', priority: 'required', minYears: 2, skillTag: 'typescript' },
    ],
    headcount: 3,
  });

  return { stages, job, /* ... */ };
}

/**
 * Cleans up all test data for the tenant.
 */
export async function cleanupTestData(service: HiringService) {
  await service.runRetentionCleanup(); // Purges all data for test tenant
}
```

---

## Related Modules

| Module | Relationship |
|--------|-------------|
| `@mcv/people/core` | Provides employee/user identities referenced as hiring managers, recruiters, interviewers |
| `@mcv/people/directory` | Department and org structure for job categorization and reporting |
| `@mcv/people/onboarding` | Receives hired candidates for onboarding workflow initiation |
| `@mcv/people/compensation` | Compensation bands and benchmarking data for offer creation |
| `@mcv/people/performance` | Historical performance data for internal transfer hiring decisions |
| `@mcv/ai` | OpenRouter integration layer for resume parsing and skill matching |
| `@mcv/notifications` | Notification delivery for interview reminders, offer alerts, SLA warnings |
| `@mcv/calendar` | Calendar integration abstraction for interview scheduling |
| `@mcv/templates` | Template engine for offer letters, rejection emails, nurture campaigns |
| `@mcv/audit` | Centralized audit logging for compliance and security |
| `@mcv/analytics` | Shared analytics infrastructure for dashboard rendering and report export |