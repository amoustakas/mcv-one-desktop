# MCV-DOCINT: Document Intelligence Platform — Epic Plan

**Release:** MCV-DOCINT-R1 — Document Intelligence Platform
**Spec Tier:** T4 (Venture-scale) → 8 Epics across 3 capability streams
**Ventures Affected:** MCV One (shared platform), Futurestate Admin
**Architecture Layers:** Domains + Intelligence + Connectors
**Owner:** Tony Moustakas
**Created:** 2026-04-04
**Estimated Duration:** 20–26 weeks (5–6 sprints per stream, with parallelization)

---

## Executive Summary

This release delivers a three-tier Document Intelligence Platform spanning the MCV One and Futurestate admin portals. The capability chain flows through three streams:

1. **Document Management System** — Migrate the Notion-based business document tracker into production admin apps with full lifecycle support (creation, versioning, signing, automations).
2. **Algorithmic Completion Intelligence** — Transform the 42+ raw business documents into a self-improving AI engine that understands context, auto-fills from CRM/compliance data, and intelligently completes documents.
3. **Netflix-Style Dynamic Presentation Engine** — A visual catalog where executives browse deck types, with content dynamically compiled from the document intelligence layer and personalized by audience context via CRM integration.

The primary dependency chain is **Document Management → Algorithmic Intelligence → Dynamic Presentations**, but significant parallelization is possible within and across streams.

---

## Architecture Mapping

```
MCV 5-Tier Architecture Alignment
═══════════════════════════════════════════════════════════════════════

Layer 6: DOMAINS (Venture-specific)
├── MCV-DOCINT-001: Document Management Core (MCV Admin)
├── MCV-DOCINT-002: Document Lifecycle & Workflow Engine
├── FS-DOCINT-001:  Futurestate Document Portal
└── MCV-DOCINT-008: Dynamic Presentation Engine (Domains + Intelligence)

Layer 5: INTELLIGENCE / NAOS
├── MCV-DOCINT-004: Document AI Foundation (RAG, embeddings, context)
├── MCV-DOCINT-005: Algorithmic Completion Engine
└── MCV-DOCINT-007: Audience-Aware Content Compiler

Layer 4: CONNECTORS
├── MCV-DOCINT-003: CRM + Compliance Integration Bridge
└── (Reuses existing Connector layer for CRM, Compliance Engine)

Layer 3: FABRIC (Event bus, storage — existing infrastructure)
Layer 2: IDENTITY (Auth, RBAC — existing infrastructure)
Layer 1: KERNEL (Runtime — existing infrastructure)
```

---

## Dependency Graph

```
                    ┌──────────────────┐
                    │  MCV-DOCINT-001  │
                    │  Doc Management  │
                    │     Core         │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
     ┌────────────┐  ┌────────────┐  ┌────────────┐
     │ DOCINT-002 │  │ DOCINT-003 │  │ FS-DOCINT  │
     │ Lifecycle  │  │ CRM+Compl  │  │    -001    │
     │ & Workflow │  │  Bridge    │  │ Futurestate│
     └──────┬─────┘  └──────┬─────┘  │  Portal   │
            │               │         └────────────┘
            └───────┬───────┘               ▲
                    │                       │
                    ▼                       │ (soft)
           ┌────────────────┐              │
           │  MCV-DOCINT-004│              │
           │  Document AI   │──────────────┘
           │  Foundation    │
           └───────┬────────┘
                   │
                   ▼
           ┌────────────────┐
           │  MCV-DOCINT-005│
           │  Algorithmic   │
           │  Completion    │
           └───────┬────────┘
                   │
        ┌──────────┼──────────┐
        ▼                     ▼
┌────────────────┐   ┌────────────────┐
│  MCV-DOCINT-007│   │  MCV-DOCINT-008│
│  Audience-Aware│   │  Presentation  │
│  Compiler      │   │  Engine        │
└────────┬───────┘   └────────────────┘
         │                    ▲
         └────────────────────┘

Legend:
  ──▶  Hard dependency (must complete first)
  - -▶ Soft dependency (prefer first, can work around)
```

---

## Stream 1: Document Management System

### MCV-DOCINT-001: Document Management Core

| Attribute | Value |
|-----------|-------|
| **Code** | MCV-DOCINT-001 |
| **Stream** | 1 — Document Management |
| **Architecture Layer** | Domains |
| **Repo/App** | `packages/documents` (shared), `apps/admin` (MCV Admin) |
| **Status** | Backlog |
| **Priority** | P0 — Foundation for entire release |
| **Story Points** | 55 |
| **Sprints** | 3 (6 weeks) |
| **Risk Level** | Medium |

**Description:**
Build the foundational document management infrastructure within MCV One. This is the schema, storage, CRUD API, and base UI that every subsequent epic builds upon. Migrates the core data model from the current Notion-based business document tracker into the platform.

**In Scope:**
- Multi-tenant document schema with Drizzle ORM (`documents`, `document_versions`, `document_categories`, `document_templates`)
- `venture_id` RLS isolation on all tables
- R2/MinIO object storage integration for document binaries (PDF, DOCX, etc.)
- tRPC router: CRUD operations for documents, categories, templates
- Admin UI: document library view, upload flow, search/filter, detail view
- Document metadata model (tags, categories, status, owner, dates)
- Event emission on all document state changes (`document.created`, `document.updated`, etc.)
- Migration tooling to import existing Notion documents

**Out of Scope:**
- Workflow engine / approval chains (Epic 002)
- Digital signing (Epic 002)
- AI-powered features (Epics 004–005)
- Futurestate-specific customizations (Epic FS-001)

**Success Criteria:**
- [ ] Users can create, upload, view, edit, and delete documents in MCV Admin
- [ ] Documents are venture-isolated via RLS
- [ ] Version history is tracked for every document
- [ ] Document binaries stored in R2 with signed URL access
- [ ] Events emitted to Redpanda on all state changes
- [ ] Existing Notion documents can be imported via migration script

**Dependencies:**
- **Blocked By:** None (foundation epic)
- **Blocks:** MCV-DOCINT-002, MCV-DOCINT-003, MCV-DOCINT-004, FS-DOCINT-001

**Sprint Plan:**

| Sprint | Theme | Points | Key Features |
|--------|-------|--------|--------------|
| S1 | Schema + Storage | 20 | DB schema, R2 integration, base tRPC router |
| S2 | Admin UI + CRUD | 20 | Document library, upload, detail view, search |
| S3 | Versioning + Migration | 15 | Version tracking, Notion import, polish |

**Risks:**

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Notion export data quality | Medium | Medium | Early spike on Notion API export format |
| R2 large file handling | Low | Low | Multipart upload + chunking from day 1 |
| Schema design rework | High | Low | Review with all 3 streams before starting |

**Technical Notes:**
- Package: `@mcv/documents` in shared packages
- Schema follows multi-tenant pattern with `venture_id` + soft delete
- Events: `{ventureId}.documents.{entity}.{action}`
- Storage: R2 bucket per venture with path-based isolation

---

### MCV-DOCINT-002: Document Lifecycle & Workflow Engine

| Attribute | Value |
|-----------|-------|
| **Code** | MCV-DOCINT-002 |
| **Stream** | 1 — Document Management |
| **Architecture Layer** | Domains |
| **Repo/App** | `packages/documents`, `packages/workflows`, `apps/admin` |
| **Status** | Backlog |
| **Priority** | P0 |
| **Story Points** | 65 |
| **Sprints** | 3 (6 weeks) |
| **Risk Level** | High |

**Description:**
Implement the full document lifecycle — from draft through review, approval, signing, and archival. Includes a configurable workflow engine for approval chains, role-based review gates, and digital signature integration. This is the "documents are created, reviewed, approved, and signed all within the platform" requirement.

**In Scope:**
- Document status machine: Draft → In Review → Approved → Signing → Executed → Archived
- Configurable workflow engine (approval chains, parallel/sequential reviewers)
- Role-based permissions on document actions (RBAC integration)
- Digital signature integration (e-sign provider — DocuSign or similar via API)
- Review/comment system on documents
- Automated notifications on workflow transitions (via Notification Hub)
- Audit trail logging for compliance
- Document template engine (create from template with pre-filled fields)
- Automated reminders and escalation rules

**Out of Scope:**
- AI-powered auto-fill or suggestions (Epic 005)
- Cross-venture workflow orchestration
- External party signing portal (v2)

**Success Criteria:**
- [ ] Documents flow through configurable approval workflows
- [ ] Reviewers can comment and approve/reject inline
- [ ] Digital signatures are captured and legally binding
- [ ] Full audit trail of every action on every document
- [ ] Templates can be instantiated with pre-filled fields
- [ ] Notifications fire on all workflow transitions

**Dependencies:**
- **Blocked By:** MCV-DOCINT-001 (needs document schema and CRUD)
- **Blocks:** MCV-DOCINT-005 (completion engine needs template system)

**Sprint Plan:**

| Sprint | Theme | Points | Key Features |
|--------|-------|--------|--------------|
| S1 | Status Machine + Workflows | 25 | State machine, workflow config, approval chains |
| S2 | Signing + Reviews | 22 | E-sign integration, comment system, audit trail |
| S3 | Templates + Automations | 18 | Template engine, notifications, escalations |

**Risks:**

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| E-sign vendor API complexity | High | Medium | Evaluate vendors early; start with simple flow |
| Workflow engine over-engineering | Medium | Medium | Start with linear chains, add branching in v2 |
| Legal compliance for signatures | High | Medium | Legal review of e-sign provider early |

---

### MCV-DOCINT-003: CRM + Compliance Integration Bridge

| Attribute | Value |
|-----------|-------|
| **Code** | MCV-DOCINT-003 |
| **Stream** | 1 — Document Management (Connectors layer) |
| **Architecture Layer** | Connectors |
| **Repo/App** | `packages/connectors/crm-docs`, `packages/connectors/compliance-docs` |
| **Status** | Backlog |
| **Priority** | P1 |
| **Story Points** | 40 |
| **Sprints** | 2 (4 weeks) |
| **Risk Level** | Medium |

**Description:**
Build the bidirectional integration bridge between the Document Management System and MCV One's CRM and Compliance modules. Documents need to pull context from CRM (contact data, deal stages, company info) and Compliance (KYC status, regulatory requirements). This bridge is critical for the AI completion engine — it's the data pipeline that makes documents "smart."

**In Scope:**
- CRM → Documents: Pull contact/company data into document fields
- Compliance → Documents: Pull KYC/AML status, regulatory flags
- Documents → CRM: Link documents to contacts, deals, companies
- Documents → Compliance: Flag documents requiring compliance review
- Event-driven sync (Redpanda consumers for CRM and Compliance events)
- Context resolver service: given a document, resolve all related CRM/compliance data
- Data mapping configuration (which CRM fields map to which document fields)

**Out of Scope:**
- AI interpretation of CRM data (Epic 004)
- Third-party CRM integrations (Salesforce, HubSpot — future)
- Payment/billing document automation

**Success Criteria:**
- [ ] Documents can be linked to CRM contacts, deals, and companies
- [ ] Document creation can auto-populate fields from CRM context
- [ ] Compliance flags surface in document workflow (e.g., block signing if KYC incomplete)
- [ ] Bidirectional event sync operational
- [ ] Context resolver returns full CRM+compliance context for any document

**Dependencies:**
- **Blocked By:** MCV-DOCINT-001 (needs document schema)
- **Soft dependency:** CRM System module (spec exists, P1 priority)
- **Soft dependency:** Compliance Engine module (spec exists, P0 priority)
- **Blocks:** MCV-DOCINT-004, MCV-DOCINT-005

**Sprint Plan:**

| Sprint | Theme | Points | Key Features |
|--------|-------|--------|--------------|
| S1 | CRM Bridge + Event Sync | 22 | CRM data pull, document linking, Redpanda consumers |
| S2 | Compliance Bridge + Context Resolver | 18 | Compliance flags, context resolver, field mapping |

**Risks:**

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| CRM module not ready | High | Medium | Build against interface contract; mock CRM data |
| Compliance Engine not ready | High | Medium | Same — interface contract + mocks |
| Data mapping complexity | Medium | Medium | Start with core fields, make extensible |

---

### FS-DOCINT-001: Futurestate Document Portal

| Attribute | Value |
|-----------|-------|
| **Code** | FS-DOCINT-001 |
| **Stream** | 1 — Document Management |
| **Architecture Layer** | Domains (Venture-specific) |
| **Repo/App** | `apps/futurestate-admin` |
| **Status** | Backlog |
| **Priority** | P1 |
| **Story Points** | 35 |
| **Sprints** | 2 (4 weeks) |
| **Risk Level** | Low |

**Description:**
Extend the shared document management core into the Futurestate admin portal with RWA (Real World Asset) specific customizations. Futurestate deals with asset tokenization documents — property deeds, regulatory filings, investment agreements — which need specialized workflows and metadata.

**In Scope:**
- Futurestate admin integration of shared `@mcv/documents` package
- RWA-specific document categories (deed, filing, agreement, prospectus, audit)
- Asset-linked document model (documents tied to specific tokenized assets)
- Futurestate-specific metadata fields (jurisdiction, asset class, regulatory body)
- Custom document views for Futurestate admin dashboard
- Venture-specific workflow overrides (e.g., mandatory legal review for all filings)

**Out of Scope:**
- Futurestate blockchain integration
- Public investor document portal
- Regulatory filing automation

**Success Criteria:**
- [ ] Futurestate admin has full document management capability
- [ ] Documents are linked to tokenized assets
- [ ] RWA-specific categories and metadata are available
- [ ] Venture-specific workflows function correctly
- [ ] Shared package changes don't break MCV Admin

**Dependencies:**
- **Blocked By:** MCV-DOCINT-001 (needs shared document core)
- **Soft Blocked By:** MCV-DOCINT-002 (benefits from workflow engine, but can launch with basic status flow)
- **Blocks:** Nothing directly (venture-specific)

**Sprint Plan:**

| Sprint | Theme | Points | Key Features |
|--------|-------|--------|--------------|
| S1 | Portal + RWA Model | 20 | Admin integration, RWA categories, asset linking |
| S2 | Custom Views + Workflows | 15 | Dashboard views, venture-specific workflows |

---

## Stream 2: Algorithmic Completion Intelligence

### MCV-DOCINT-004: Document AI Foundation

| Attribute | Value |
|-----------|-------|
| **Code** | MCV-DOCINT-004 |
| **Stream** | 2 — Algorithmic Intelligence |
| **Architecture Layer** | Intelligence |
| **Repo/App** | `packages/intelligence/document-ai` |
| **Status** | Backlog |
| **Priority** | P0 |
| **Story Points** | 60 |
| **Sprints** | 3 (6 weeks) |
| **Risk Level** | High |

**Description:**
Build the AI foundation that powers all document intelligence features. This includes document ingestion into a vector store, RAG (Retrieval Augmented Generation) pipeline, context understanding from the 42+ business documents currently in Notion, and the Neural Hive-Mind integration for document-aware AI capabilities.

**In Scope:**
- Document ingestion pipeline: parse, chunk, embed all documents into vector store
- RAG pipeline: retrieve relevant document context for any query
- Vector store setup (pgvector extension in Supabase or dedicated Qdrant)
- Neural Hive-Mind integration: document-aware AI persona
- Business context model: learn from the 42+ existing business documents
- Context window builder: given a document type, assemble relevant business context
- Embedding refresh pipeline (re-embed on document updates via Redpanda events)
- Evaluation framework: measure retrieval quality and generation accuracy

**Out of Scope:**
- Auto-completion UI (Epic 005)
- Presentation generation (Epics 007–008)
- Real-time collaborative editing

**Success Criteria:**
- [ ] All 42+ business documents ingested and searchable via semantic search
- [ ] RAG pipeline returns relevant context for document-related queries
- [ ] Context window builder produces accurate, relevant context for any document type
- [ ] Embedding refresh triggers automatically on document changes
- [ ] Retrieval quality metrics meet baseline thresholds (>80% relevance)

**Dependencies:**
- **Blocked By:** MCV-DOCINT-001 (needs document storage to ingest from)
- **Blocked By:** MCV-DOCINT-003 (needs CRM/compliance context for enriched embeddings)
- **Blocks:** MCV-DOCINT-005, MCV-DOCINT-007

**Sprint Plan:**

| Sprint | Theme | Points | Key Features |
|--------|-------|--------|--------------|
| S1 | Ingestion + Vector Store | 22 | Document parsing, chunking, embedding, vector store |
| S2 | RAG Pipeline + Context Builder | 22 | Retrieval pipeline, context window assembly, Hive-Mind integration |
| S3 | Business Context + Evaluation | 16 | 42+ doc ingestion, refresh pipeline, quality metrics |

**Risks:**

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Embedding quality for business docs | High | Medium | Test multiple embedding models; manual eval of top-k results |
| RAG hallucination on business context | High | Medium | Grounding checks, citation tracking, human review |
| Vector store scaling | Medium | Low | Start with pgvector, migrate to Qdrant if needed |
| Business docs in Notion format | Medium | Medium | Build robust parser for Notion export format |

**Technical Notes:**
- Integrates with Neural Hive-Mind (`@mcv/intelligence`) via document-aware persona
- Events: `{ventureId}.intelligence.document.embedded`, `{ventureId}.intelligence.document.queried`
- Claude API (primary), with model routing for cost optimization
- Context window budget: ~100k tokens for full document context assembly

---

### MCV-DOCINT-005: Algorithmic Completion Engine

| Attribute | Value |
|-----------|-------|
| **Code** | MCV-DOCINT-005 |
| **Stream** | 2 — Algorithmic Intelligence |
| **Architecture Layer** | Intelligence + Domains |
| **Repo/App** | `packages/intelligence/document-ai`, `packages/documents`, `apps/admin` |
| **Status** | Backlog |
| **Priority** | P0 |
| **Story Points** | 70 |
| **Sprints** | 3 (6 weeks) |
| **Risk Level** | High |

**Description:**
The core AI engine that intelligently completes, generates, enhances, and maintains documents. Smart templates understand context, auto-fill from CRM/compliance data, suggest completions, and get smarter over time. This is where the 42+ business documents become a living, learning knowledge base.

**In Scope:**
- Smart template system: templates with AI-aware field definitions
- Auto-fill engine: populate document fields from CRM, compliance, and business context
- Inline completion: suggest text completions while drafting (copilot-style)
- Document generation: generate entire document sections from context + template
- Enhancement suggestions: AI reviews drafts and suggests improvements
- Learning loop: track which suggestions are accepted/rejected to improve over time
- Document consistency checker: flag contradictions with existing documents
- Admin UI: completion settings, template AI config, suggestion review

**Out of Scope:**
- Presentation generation (Epics 007–008)
- Automated document execution (signing without human review)
- Multi-language document support (v2)

**Success Criteria:**
- [ ] Smart templates auto-fill fields from CRM and compliance data with >90% accuracy
- [ ] Inline completions are contextually relevant and accepted >50% of the time
- [ ] Full document sections can be generated from templates + context
- [ ] Enhancement suggestions improve document quality measurably
- [ ] Learning loop shows improvement in suggestion acceptance over 30-day window
- [ ] Consistency checker flags contradictions with existing business documents

**Dependencies:**
- **Blocked By:** MCV-DOCINT-004 (needs RAG pipeline and document AI foundation)
- **Blocked By:** MCV-DOCINT-002 (needs template system from lifecycle engine)
- **Blocked By:** MCV-DOCINT-003 (needs CRM/compliance data bridge)
- **Blocks:** MCV-DOCINT-007

**Sprint Plan:**

| Sprint | Theme | Points | Key Features |
|--------|-------|--------|--------------|
| S1 | Smart Templates + Auto-Fill | 25 | Template AI fields, CRM/compliance auto-fill engine |
| S2 | Inline Completion + Generation | 25 | Copilot-style suggestions, section generation |
| S3 | Enhancement + Learning Loop | 20 | Suggestion review, learning pipeline, consistency checker |

**Risks:**

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| AI completion quality | High | Medium | Extensive prompt engineering; human-in-the-loop |
| LLM cost at scale | Medium | Medium | Caching, model routing (Haiku for simple, Opus for complex) |
| User trust in AI suggestions | Medium | High | Transparent confidence scores; easy accept/reject UX |
| Learning loop cold start | Medium | Medium | Seed with curated examples from 42 existing docs |

---

## Stream 3: Netflix-Style Dynamic Presentation Engine

### MCV-DOCINT-007: Audience-Aware Content Compiler

| Attribute | Value |
|-----------|-------|
| **Code** | MCV-DOCINT-007 |
| **Stream** | 3 — Dynamic Presentations |
| **Architecture Layer** | Intelligence |
| **Repo/App** | `packages/intelligence/content-compiler` |
| **Status** | Backlog |
| **Priority** | P1 |
| **Story Points** | 50 |
| **Sprints** | 2–3 (4–6 weeks) |
| **Risk Level** | High |

**Description:**
The content compiler sits between the document intelligence layer and the presentation engine. It takes raw document content, understands the intended audience (investor vs. regulator vs. partner vs. internal), and compiles audience-appropriate content packages. CRM integration means it knows who the audience is automatically.

**In Scope:**
- Audience profile system: investor, regulator, partner, internal, custom
- Content extraction from document intelligence layer
- Audience-aware content transformation (depth, tone, focus area adjustment)
- CRM-driven audience detection (who is this presentation for? auto-resolve from CRM)
- Content package assembly: structured output ready for presentation rendering
- Onboarding flow engine: short questionnaire to customize output (audience, depth, focus)
- Content caching and invalidation (when source documents change)

**Out of Scope:**
- Visual rendering of presentations (Epic 008)
- Real-time collaboration on presentations
- Export to PowerPoint/Google Slides (v2)

**Success Criteria:**
- [ ] Content packages differ meaningfully by audience type
- [ ] CRM integration auto-detects audience context for known contacts
- [ ] Onboarding flow produces relevant customization in <60 seconds
- [ ] Content refreshes when source documents are updated
- [ ] Content quality rated >4/5 by internal reviewers across all audience types

**Dependencies:**
- **Blocked By:** MCV-DOCINT-005 (needs algorithmic completion for content generation)
- **Blocked By:** MCV-DOCINT-004 (needs RAG pipeline for content retrieval)
- **Soft dependency:** MCV-DOCINT-003 (CRM data for audience detection)
- **Blocks:** MCV-DOCINT-008

**Sprint Plan:**

| Sprint | Theme | Points | Key Features |
|--------|-------|--------|--------------|
| S1 | Audience Profiles + Content Extraction | 20 | Profile system, document content extraction, transformation |
| S2 | CRM Detection + Onboarding Flow | 18 | CRM audience resolution, questionnaire engine |
| S3 | Caching + Polish | 12 | Content caching, invalidation, quality evaluation |

**Risks:**

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Content quality variance by audience | High | Medium | Extensive prompt tuning per audience persona |
| CRM data quality for audience detection | Medium | High | Graceful fallback to manual audience selection |
| Content staleness | Medium | Medium | Event-driven invalidation from document updates |

---

### MCV-DOCINT-008: Dynamic Presentation Engine

| Attribute | Value |
|-----------|-------|
| **Code** | MCV-DOCINT-008 |
| **Stream** | 3 — Dynamic Presentations |
| **Architecture Layer** | Domains + Intelligence |
| **Repo/App** | `packages/presentations`, `apps/admin` |
| **Status** | Backlog |
| **Priority** | P1 |
| **Story Points** | 65 |
| **Sprints** | 3 (6 weeks) |
| **Risk Level** | High |

**Description:**
The Netflix-style visual catalog where executives browse deck types, explainer experiences, and presentation formats. Content is dynamically compiled from the document intelligence layer via the audience-aware content compiler. Deep personalization means the same underlying content renders differently based on audience context.

**In Scope:**
- Visual catalog UI: browsable grid of deck types / presentation templates
- Presentation type registry (pitch deck, regulatory overview, partner brief, internal update, etc.)
- Dynamic content rendering: compile presentation from content package + template
- Audience-personalized rendering (same content, different depth/tone/visuals per audience)
- Preview and customization flow (adjust slides, reorder, override AI suggestions)
- Export: PDF, shareable link, embedded viewer
- Presentation analytics: who viewed what, engagement tracking
- Admin: manage presentation types, templates, default audience configs

**Out of Scope:**
- Real-time collaborative editing of presentations
- PowerPoint/Keynote export (v2)
- Video/animation generation
- External-facing self-service portal

**Success Criteria:**
- [ ] Executives can browse a visual catalog of 10+ presentation types
- [ ] Presentations are dynamically generated from document content in <30 seconds
- [ ] Same content renders differently for investor vs. regulator vs. partner audiences
- [ ] Previews are editable before finalizing
- [ ] Exported PDFs are professional quality
- [ ] Engagement analytics track views and time spent

**Dependencies:**
- **Blocked By:** MCV-DOCINT-007 (needs content compiler for content packages)
- **Soft dependency:** MCV-DOCINT-001 (document storage for source content)
- **Blocks:** Nothing (final epic in chain)

**Sprint Plan:**

| Sprint | Theme | Points | Key Features |
|--------|-------|--------|--------------|
| S1 | Catalog + Template Registry | 22 | Visual catalog UI, presentation type system, template registry |
| S2 | Dynamic Rendering + Personalization | 25 | Content-to-slides rendering, audience-aware layout, preview |
| S3 | Export + Analytics + Polish | 18 | PDF export, shareable links, engagement tracking, admin tools |

**Risks:**

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Rendering quality expectations | High | High | Set clear design system; invest in slide templates early |
| Generation latency (>30s target) | Medium | Medium | Pre-compile common combinations; aggressive caching |
| Content-to-visual mapping complexity | High | Medium | Start with structured templates, not free-form layout |
| User expectation vs. AI capability gap | High | Medium | Clear "AI-assisted, human-finalized" positioning |

---

## Critical Path Analysis

```
CRITICAL PATH (longest sequential chain)
════════════════════════════════════════════════════════════════════

MCV-DOCINT-001 ──▶ MCV-DOCINT-002 ──▶ MCV-DOCINT-005 ──▶ MCV-DOCINT-007 ──▶ MCV-DOCINT-008
  (6 weeks)          (6 weeks)          (6 weeks)          (6 weeks)          (6 weeks)

Naive sequential: 30 weeks

WITH PARALLELIZATION: ~22 weeks
════════════════════════════════════════════════════════════════════

Week  1-6:   DOCINT-001 (Core)
Week  3-8:   DOCINT-003 (CRM Bridge — can start after S1 of 001)  [fast-tracked]
Week  7-12:  DOCINT-002 (Lifecycle — starts when 001 done)
Week  7-10:  FS-DOCINT-001 (Futurestate — parallel with 002)
Week  9-14:  DOCINT-004 (AI Foundation — starts when 001+003 done)
Week 13-18:  DOCINT-005 (Completion — starts when 002+003+004 done)
Week 17-22:  DOCINT-007 (Content Compiler — can start after S2 of 005)  [fast-tracked]
Week 19-24:  DOCINT-008 (Presentation Engine — starts when 007 S1 done)  [fast-tracked]

Actual Critical Path: 001 → 003 → 004 → 005 → 007 → 008
Duration with fast-tracking: ~22-24 weeks
```

### Gantt View (Approximate)

```
Week:     1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24
          ├──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┤

001 Core  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│                                            CRITICAL
003 CRM          ░░░░░░░░░░░░░░░░░░│                                            fast-track
002 Life                     ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│                         CRITICAL
FS-001                       ░░░░░░░░░░░░░░░░│                                  parallel
004 AI-F                             ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│                 CRITICAL
005 Comp                                               ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│   CRITICAL
007 Cmplr                                                       ░░░░░░░░░░░░░░░ fast-track
008 Pres                                                             ░░░░░░░░░░░░ fast-track

▓ = Critical path    ░ = Parallel / has slack
```

---

## Parallelization Strategy

**What CAN run in parallel:**

1. **MCV-DOCINT-003** (CRM Bridge) can start after Sprint 1 of MCV-DOCINT-001 completes (schema exists). Interface contract against CRM module spec; mock data until CRM module ships.
2. **FS-DOCINT-001** (Futurestate Portal) runs entirely parallel to MCV-DOCINT-002 once 001 is done.
3. **MCV-DOCINT-004** (AI Foundation) can begin document ingestion R&D and vector store setup while 003 finishes — full integration after 003 completes.
4. **MCV-DOCINT-007** and **MCV-DOCINT-008** can be fast-tracked by starting once the content generation API from 005 is functional (after 005 Sprint 2), without waiting for the full learning loop.

**What MUST be sequential:**

1. MCV-DOCINT-001 → MCV-DOCINT-002 (lifecycle needs document schema)
2. MCV-DOCINT-003 + MCV-DOCINT-004 → MCV-DOCINT-005 (completion needs both CRM bridge and RAG pipeline)
3. MCV-DOCINT-005 → MCV-DOCINT-007 → MCV-DOCINT-008 (content flows downstream)

---

## Sizing Summary

| Epic | Code | Points | Sprints | Weeks | Priority | Layer |
|------|------|--------|---------|-------|----------|-------|
| Document Management Core | MCV-DOCINT-001 | 55 | 3 | 6 | P0 | Domains |
| Lifecycle & Workflow Engine | MCV-DOCINT-002 | 65 | 3 | 6 | P0 | Domains |
| CRM + Compliance Bridge | MCV-DOCINT-003 | 40 | 2 | 4 | P1 | Connectors |
| Futurestate Document Portal | FS-DOCINT-001 | 35 | 2 | 4 | P1 | Domains |
| Document AI Foundation | MCV-DOCINT-004 | 60 | 3 | 6 | P0 | Intelligence |
| Algorithmic Completion Engine | MCV-DOCINT-005 | 70 | 3 | 6 | P0 | Intelligence |
| Audience-Aware Content Compiler | MCV-DOCINT-007 | 50 | 2–3 | 4–6 | P1 | Intelligence |
| Dynamic Presentation Engine | MCV-DOCINT-008 | 65 | 3 | 6 | P1 | Domains+Intel |
| **TOTAL** | | **440** | **21–22** | **~22–24 w/ parallel** | | |

**Note:** Epic numbering skips 006 intentionally — reserved for a future "Document Analytics & Reporting" epic if needed.

---

## Open Questions

- [ ] Which e-sign vendor? DocuSign vs. HelloSign vs. Dropbox Sign — needs vendor evaluation
- [ ] CRM module readiness: is the CRM System module far enough along to build against, or do we need full mocks?
- [ ] Compliance Engine readiness: same question — are the APIs defined?
- [ ] Vector store decision: pgvector (simpler, in Supabase) vs. Qdrant (more powerful, separate infra)?
- [ ] Presentation rendering approach: React-based slide renderer vs. HTML-to-PDF pipeline vs. PPTX generation?
- [ ] Budget for LLM inference costs across completion + generation + compilation engines?
- [ ] Legal review timeline for e-sign compliance by jurisdiction?

---

## Next Steps

1. **Schema Design Review** — Review MCV-DOCINT-001 schema with all 3 stream leads before development starts
2. **CRM/Compliance Interface Contract** — Define API contracts with CRM and Compliance module owners
3. **E-Sign Vendor Spike** — 1-week evaluation of signature providers (cost, API quality, compliance)
4. **Vector Store Spike** — 1-week evaluation of pgvector vs. Qdrant for document embeddings
5. **Sprint Planning** — Break MCV-DOCINT-001 into features and atomize into NAOS-ready tasks
6. **Notion Migration Spike** — Test export and import of existing 42+ business documents
