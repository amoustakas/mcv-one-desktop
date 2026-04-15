/**
 * Seed the "EdgeIQ Capital" epic tree (Epics 0 6) into Supabase.
 *
 * Idempotent: each Epic carries a tag `capital:ep{N}` so re-runs no-op.
 *
 * Usage:  npx tsx scripts/seed-capital-epics.ts
 * Env:    SUPABASE_URL (or VITE_SUPABASE_URL), SUPABASE_SERVICE_KEY
 *
 * Reference: C:\Users\moust\.claude\plans\melodic-hopping-wren.md (SPEC-EQC-001)
 * PRD: EdgeIQ-Capital-PRD-v1.0.md
 */
import { createClient } from '@supabase/supabase-js';

type StorySeed = {
  title: string;
  description?: string;
  acceptance_criteria?: string[];
  priority_order?: number;
  estimated_effort?: string;
};

type EpicSeed = {
  phase: number;
  title: string;
  summary: string;
  spec_md?: string;
  status?: 'draft' | 'proposed' | 'approved' | 'in-progress' | 'blocked' | 'review' | 'done' | 'cancelled';
  priority: 'critical' | 'high' | 'medium' | 'low';
  priority_order: number;
  tags: string[];
  stories: StorySeed[];
  checkpoints?: { type: string; title: string; description?: string }[];
};

const PLAN_DOC = 'C:/Users/moust/.claude/plans/melodic-hopping-wren.md';
const PRD_DOC  = 'EdgeIQ-Capital-PRD-v1.0.md';

const PLAN: EpicSeed[] = [
  // ============================================================
  // Epic 0: Prerequisites (pre-flight)
  // ============================================================
  {
    phase: 0,
    title: 'Capital Prereqs — SDK location discovery + arch lock',
    summary:
      'Confirm actual filesystem home of @mcv/* SDKs, resolve core-triangle vs Desktop schema split, verify Futurestate compliance reuse surface. Gatekeeper for Epic 1.',
    spec_md: `Pre-flight confirmation before any Capital scaffolding. Outcome: packages/capital-sdk placement locked, schema home locked, compliance-bridge contract locked.\n\nSee: ${PLAN_DOC}`,
    status: 'in-progress',
    priority: 'critical',
    priority_order: 5,
    tags: ['capital:ep0', 'capital', 'prereqs'],
    stories: [
      {
        title: 'Locate @mcv/* SDK homes — grep all candidate repos, document paths',
        acceptance_criteria: [
          'All 8 @mcv/* SDKs (kits, commerce, payments, storage, ventures, mcp, ad-specs, ledger) located',
          'Path, version, install mechanism recorded for each',
          'Monorepo root identified (confirmed: mcv-one-desktop pnpm workspace)',
        ],
        priority_order: 10,
      },
      {
        title: 'Correct MEMORY entries for SDK locations',
        acceptance_criteria: [
          'project_kits_sdk.md reflects mcv-one-desktop/packages/ correctly (confirmed no change needed)',
          'project_commerce_sdk.md confirmed accurate',
          'Cross-check against core-triangle (confirmed: separate SDK layer for services)',
        ],
        priority_order: 20,
      },
      {
        title: 'Lock schema home decision — Desktop Supabase vs core-triangle kernel',
        acceptance_criteria: [
          'Decision recorded in plan with rationale',
          'Schema home = Desktop Supabase (supabase/migration-capital.sql)',
          'core-triangle kernel used only for compliance read-through',
        ],
        priority_order: 30,
      },
      {
        title: 'Confirm Futurestate compliance bridge contract',
        description: 'Verify @futurestate/mcv-sdk exports triangle.IdentityInternalHttpClient with getCompliance + setComplianceTier signatures. Document which methods Capital will call.',
        acceptance_criteria: [
          'SDK method signatures documented',
          'If gaps found, filed as separate story',
          'Direct HTTP fallback plan documented if SDK lacks needed methods',
        ],
        priority_order: 40,
      },
      {
        title: 'Confirm Futurestate Stripe reuse surface',
        description: 'Read StripeCheckoutSession + StripeDistribution handlers. Document callable function surface that Capital will reuse for fiat commitment collection in Phase 3.',
        acceptance_criteria: [
          'Function signatures captured in plan',
          'Integration points identified (webhook, session creation, distribution)',
        ],
        priority_order: 50,
      },
      {
        title: 'Seed full Capital epic tree into Desktop epics table',
        acceptance_criteria: [
          '7 epics (Epic 0 6) inserted with capital:ep{N} tags',
          '~55 stories inserted with acceptance criteria',
          'Checkpoints inserted for spec/design/pre-deploy gates',
          'EpicBoardView renders tree live',
        ],
        priority_order: 60,
      },
    ],
    checkpoints: [
      { type: 'spec-review', title: 'Epic 0 prereqs sign-off', description: 'All architectural decisions locked before Epic 1 scaffolding begins.' },
    ],
  },

  // ============================================================
  // Epic 1: Capital Ledger Foundation
  // ============================================================
  {
    phase: 1,
    title: 'Capital Ledger — schema + SDK scaffold + service factories',
    summary:
      'Foundation for the entire product: Supabase migration for rounds/commitments/investor_profile/organizations/activities/documents, @mcv/capital-sdk workspace package with 3-tier factories, event emission verified end-to-end.',
    spec_md: `Depends on Epic 0 sign-off. Ships no UI no user-visible changes until Epic 2.\n\nSee: ${PLAN_DOC}`,
    status: 'proposed',
    priority: 'critical',
    priority_order: 10,
    tags: ['capital:ep1', 'capital', 'schema', 'sdk', 'foundation'],
    stories: [
      {
        title: 'Write supabase/migration-capital.sql — full ledger schema (7 tables, 9 enums, RLS, indexes)',
        acceptance_criteria: [
          'Tables: capital_organizations, capital_investor_profile, capital_rounds, capital_commitments, capital_activities, capital_documents, capital_contact_ventures',
          'Enums: contact_type, contact_stage, org_type, round_type, raise_lane, round_status, commitment_status, payment_method, accreditation_status, kyc_status',
          'RLS: venture_id scoped; super_admin global view policy; portal_user_id self-scoped policy for investor portal reads; public_rounds policy for Launchpad',
          'Indexes on venture_id, contact_id, round_id, status, accreditation_status, lead_score',
          'Updated_at triggers + progress auto-roll-up trigger (recompute round.total_committed on commitment change)',
          'Realtime publication enabled',
          'Audit log trigger writing to existing audit_log table',
        ],
        priority_order: 10,
      },
      {
        title: 'Write supabase/migration-capital-ux.sql — UX-only tables (saved views, dashboard prefs, epic links, import jobs)',
        acceptance_criteria: [
          'capital_saved_views (user filter persistence on commitment grid)',
          'capital_dashboard_prefs (per-user layout)',
          'capital_import_jobs (CSV import tracking: rows, errors, field mappings)',
          'capital_epic_links (junction epics.id capital_rounds.id for EpicBoardView integration)',
          'No rounds/commitments tables here (those live in migration-capital.sql)',
        ],
        priority_order: 20,
      },
      {
        title: 'Scaffold packages/capital-sdk workspace package (TypeScript, ESM, subpath exports)',
        acceptance_criteria: [
          'package.json matches @mcv/commerce-sdk pattern (private, type:module, subpath exports)',
          'src/index.ts main barrel',
          'src/types.ts — Contact, Round, Commitment, Instrument, Activity, Document, + all enums',
          'src/factories/ — createRoundsService, createCommitmentsService, createContactsService, createDocumentsService, createDashboardService',
          'Peer dep: @supabase/supabase-js; optional dep: @mcv/ledger-sdk (for distribution ops)',
          'Added to pnpm-workspace.yaml and consumed by Desktop app',
        ],
        priority_order: 30,
      },
      {
        title: 'Implement createRoundsService (CRUD + status machine + allocation math)',
        acceptance_criteria: [
          'create/update/delete/list/getById + updateStatus with valid transition guard',
          'getWaterfall: computes cap table waterfall given commitments',
          'Status transitions: draft open closing closed funded (no skips)',
          'Triggers allocation.recompute on commitment write',
        ],
        priority_order: 40,
      },
      {
        title: 'Implement createCommitmentsService (CRUD + status machine + amount normalization)',
        acceptance_criteria: [
          'Status machine: interest soft_commit reserved pending_docs signed pending_wire funded token_distributed',
          'amount_usd normalized from amount+currency at commitment time',
          'Refuses commitment if round.status not in (open, closing)',
          'Emits capital.commitment.{created|status_changed|funded}',
        ],
        priority_order: 50,
      },
      {
        title: 'Implement createContactsService (satellite CRUD over crm_contacts + capital_investor_profile)',
        acceptance_criteria: [
          'upsertInvestorProfile: finds or creates crm_contacts row then upserts capital_investor_profile by contact_id',
          'enrichFromLinkedIn: stubbed call (Phase 2 wires Proxycurl)',
          'getTimeline: merges CRM activities + capital_activities by contact_id',
          'computeLeadScore: derived from touches + total_committed + stage (0-100)',
        ],
        priority_order: 60,
      },
      {
        title: 'Integration test — create contact create round create commitment verify audit + trigger',
        acceptance_criteria: [
          'vitest or node:test harness',
          'Contact creation writes to crm_contacts + capital_investor_profile atomically',
          'Round + commitment creation triggers round.total_committed auto-update',
          'Audit log entry exists with correct actor_id and before/after state',
        ],
        priority_order: 70,
      },
    ],
    checkpoints: [
      { type: 'spec-review', title: 'Schema review pre-apply', description: 'Validate RLS, indexes, enums against active Desktop Supabase. Confirm no FK conflicts with ventures, crm_contacts, storage_files.' },
      { type: 'pre-merge', title: 'Zero-regression gate for CRM', description: 'CRM contacts CRUD unchanged; investor type still filterable; activities timeline accepts capital_activities merge.' },
    ],
  },

  // ============================================================
  // Epic 2: Cap Table Core UI
  // ============================================================
  {
    phase: 2,
    title: 'Capital UI — global dashboard + per-venture + round detail + CRM investors tab',
    summary:
      'Tonys daily driver. Portfolio-wide dashboard, per-venture round roster, commitment grid with inline editing, CSV import, activity timeline. Reuses Desktop custom DataTable (no AG Grid), direct Supabase + React Query.',
    spec_md: `Depends on Epic 1. First user-visible surface. No portal no launchpad yet.\n\nSee: ${PLAN_DOC}`,
    status: 'proposed',
    priority: 'critical',
    priority_order: 20,
    tags: ['capital:ep2', 'capital', 'ui', 'desktop'],
    stories: [
      {
        title: 'Navigation — add 5 Capital view IDs + VIEW_LABELS + lazy-load in App.tsx',
        acceptance_criteria: [
          'ViewId union extends with capital | capital-venture | capital-round-detail | capital-contact-detail | capital-launchpad-admin',
          'VIEW_LABELS entries + sidebar nav entry with appropriate icon',
          'Lazy-registered in App.tsx following existing pattern',
          'Venture switcher context flows to capital views',
        ],
        priority_order: 10,
      },
      {
        title: 'Design system — stage + lane CSS tokens in design-system.css',
        acceptance_criteria: [
          '--stage-cold/warm/engaged/soft-commit/signed/funded tokens',
          '--lane-equity/token/hybrid tokens',
          'Badge component Capital variants',
        ],
        priority_order: 20,
      },
      {
        title: 'CapitalGlobalView — portfolio dashboard (total raised, funnel, active rounds grid, top investors, follow-ups)',
        acceptance_criteria: [
          'Calls dashboard.globalSummary across all ventures (super_admin view)',
          'Cards: Total Capital Raised, Active Rounds, Pipeline Funnel (cold warm funded), Top Investors (by total_committed)',
          'Upcoming Follow-ups calendar (7-day horizon)',
          'Real-time: subscribes to capital.* events via Supabase Realtime',
        ],
        priority_order: 30,
      },
      {
        title: 'CapitalVentureView — per-venture round list + investor roster + activity timeline + document vault',
        acceptance_criteria: [
          'Uses useNavigation().activeVenture',
          'RoundProgressCard grid showing progress, target, committed, deadline',
          'Investor roster reads capital_investor_profile joined on crm_contacts',
          'Activity timeline from capital_activities (filtered by venture)',
          'Document vault list with visibility + download',
        ],
        priority_order: 40,
      },
      {
        title: 'CapitalRoundDetailView — commitment grid (custom DataTable, inline edit, bulk ops)',
        acceptance_criteria: [
          'Columns: investor, org, status, amount, signed_at, funded_at, notes',
          'Inline-edit status transitions (validated client-side + server-side)',
          'Bulk: send DocuSign, change status, assign owner, export CSV',
          'Row-click opens commitment detail slide-over',
          'No AG Grid — uses src/components/ui/DataTable',
        ],
        priority_order: 50,
      },
      {
        title: 'RoundCreationWizard — 4-step (type terms timeline docs)',
        acceptance_criteria: [
          'Step 1: round_type + raise_lane selection',
          'Step 2: target, min/max check, valuation, discount/cap for SAFE',
          'Step 3: open_date, close_date, funding_deadline',
          'Step 4: upload/link term sheet, SAFE template, pitch deck',
          'Submit creates round with status=draft; user promotes to open from detail view',
        ],
        priority_order: 60,
      },
      {
        title: 'CRM extension — Investors tab in CRMView.tsx',
        acceptance_criteria: [
          'Filters crm_contacts where contact_type=investor',
          'Surfaces capital_investor_profile satellite fields (accreditation, total_committed_usd, lead_score, portal_enabled)',
          'Drill-through to capital-contact-detail view',
          'Portal enable toggle + magic-link send button',
        ],
        priority_order: 70,
      },
      {
        title: 'CSV import job — upload schema mapping queue + polling UI',
        acceptance_criteria: [
          'Import wizard uploads CSV to storage_files + creates capital_import_jobs row',
          'Worker handler processes rows idempotently, writes errors to job.errors jsonb',
          'UI polls job status, shows progress bar, displays errors inline',
          '50-row test import completes without dup contacts',
        ],
        priority_order: 80,
      },
      {
        title: 'Activity timeline component + audit log viewer (admin only)',
        acceptance_criteria: [
          'Reads capital_activities + audit_log joined view',
          'Filter by activity_type, actor, date range',
          'Admin-only tab shows full audit trail with before/after diffs',
        ],
        priority_order: 90,
      },
    ],
    checkpoints: [
      { type: 'design-review', title: 'Commitment grid UX review', description: 'Inline-edit UX, bulk-bar, keyboard navigation, empty state all validated against MCV design language.' },
    ],
  },

  // ============================================================
  // Epic 3: Investor Portal
  // ============================================================
  {
    phase: 3,
    title: 'Capital Portal — Futurestate investor self-serve + DocuSign + dogfooded FutureState raise',
    summary:
      'Gated portal in apps/investor/src/app/(dashboard)/capital/. Cross-venture position dashboard, self-serve commitment, DocuSign embedded signing, compliance gate routing through Futurestate KYC. FutureState raise migrates to Capital as first production dogfood.',
    spec_md: `Depends on Epic 1 + 2. Consumes @futurestate/mcv-sdk compliance-status. First production raise = FutureState.\n\nSee: ${PLAN_DOC}`,
    status: 'proposed',
    priority: 'high',
    priority_order: 30,
    tags: ['capital:ep3', 'capital', 'portal', 'futurestate'],
    stories: [
      {
        title: 'Futurestate (dashboard)/capital/ route group + Clerk-gated layout',
        acceptance_criteria: [
          'Layout reuses existing Clerk middleware',
          'Empty state for investors with no positions',
          'Venture-scoped navigation matches existing dashboard',
        ],
        priority_order: 10,
      },
      {
        title: 'apps/investor/src/lib/mcv/capital.ts — getCapitalClient() wiring',
        acceptance_criteria: [
          'Mirrors getTriangleClient pattern',
          'Reads SUPABASE_URL + SERVICE_KEY from env',
          'Exports typed client + React hooks',
        ],
        priority_order: 20,
      },
      {
        title: 'Position dashboard cross-venture (portal.getMyPositions)',
        acceptance_criteria: [
          'Lists all commitments across all ventures for current Clerk user',
          'Groups by venture, shows current value if valuation set',
          'Links to round detail for each position',
        ],
        priority_order: 30,
      },
      {
        title: 'Round detail + commitment wizard (amount DocuSign payment)',
        acceptance_criteria: [
          'Round detail page shows target, committed, timeline, documents, legal framework',
          'Commit flow: amount input (min/max validation) DocuSign embedded payment instructions',
          'Compliance gate: if tier insufficient, route to Futurestate /onboarding/kyc',
          'Confirmation page + email receipt',
        ],
        priority_order: 40,
      },
      {
        title: 'DocuSign service + webhook handler in @mcv/capital-sdk',
        acceptance_criteria: [
          'createEnvelope: calls DocuSign API with template + investor + round data',
          'Webhook handler receives signed status, updates commitment.docusign_status + signed_at',
          'Manual fallback: recordSignedManually for PDF upload',
        ],
        priority_order: 50,
      },
      {
        title: 'Compliance gate using Futurestate mcv-sdk triangle.IdentityInternalHttpClient',
        acceptance_criteria: [
          'Capital service calls triangle.getCompliance(userId, ventureId) before allowing commitment',
          'Tier < required routes to Futurestate KYC submit flow',
          'After KYC complete, investor returns to commit flow preserving round context',
        ],
        priority_order: 60,
      },
      {
        title: 'Document vault — investor-visible docs per round',
        acceptance_criteria: [
          'Filters capital_documents where is_investor_visible=true',
          'NDA gate if requires_nda=true (click-through acknowledgment)',
          'Download tracked via capital_activities',
        ],
        priority_order: 70,
      },
      {
        title: 'Notification system — email (Futurestate email service) + in-portal toast',
        acceptance_criteria: [
          'Investor receives email on: commitment created, docs ready to sign, payment received, quarterly update posted',
          'In-portal toast for real-time round progress changes',
          'Founder receives digest email daily with commitment changes',
        ],
        priority_order: 80,
      },
      {
        title: 'NAOS enrichment pipeline — LinkedIn via Proxycurl',
        acceptance_criteria: [
          'On investor signup, trigger enrich job',
          'Fills missing: company, job_title, headshot, LinkedIn url',
          'Rate-limited to respect Proxycurl quota',
        ],
        priority_order: 90,
      },
      {
        title: 'FutureState raise migrated to Capital — first production dogfood',
        acceptance_criteria: [
          'FutureState Series Seed round created in Capital',
          'Existing investor data imported via CSV',
          'Live commitments flow through Capital portal, not Futurestate-native',
          'Reconciliation report: Capital totals match FutureState Prisma totals',
        ],
        priority_order: 100,
      },
    ],
    checkpoints: [
      { type: 'pre-deploy', title: 'Portal compliance + KYC leak review', description: 'Confirm no accreditation bypass. Super-admin can see all; investor can only see own positions. Audit log captures every portal access.' },
    ],
  },

  // ============================================================
  // Epic 4: Launchpad MVP
  // ============================================================
  {
    phase: 4,
    title: 'Capital Launchpad — public raise pages + 3 lanes + hybrid builder + embeddable widget',
    summary:
      'The public product. Separate Next.js SSR app at apps/launchpad/. Project onboarding, lane selection (Token/Equity/Hybrid), auto-generated legal templates, public raise pages with live progress, embeddable widgets, admin approval queue in Desktop.',
    spec_md: `Depends on Epic 1 3. Hybrid lane requires securities counsel review before legal template generation. New apps/launchpad/ Next.js app for SEO + widget distribution.\n\nSee: ${PLAN_DOC}`,
    status: 'proposed',
    priority: 'high',
    priority_order: 40,
    tags: ['capital:ep4', 'capital', 'launchpad', 'public'],
    stories: [
      {
        title: 'apps/launchpad — Next.js 15 app scaffold (App Router, SSR, Tailwind, white-label support)',
        acceptance_criteria: [
          'Separate deployment target (launchpad.mcv.one)',
          'Reuses MCV design system tokens',
          'OG image generation + sitemap per venture',
        ],
        priority_order: 10,
      },
      {
        title: 'Startup self-serve signup — CapitalAdminClient.createOrg + createVenture + kick-off round',
        acceptance_criteria: [
          'Anonymous signup via Clerk',
          'Creates capital_organizations row with is_raising_project=true',
          'Creates venture entry in ventures table with tier=launchpad',
          'Routes to lane selection wizard',
        ],
        priority_order: 20,
      },
      {
        title: 'Lane selection wizard (Token / Equity / Hybrid) + NAOS compliance routing',
        acceptance_criteria: [
          'Questions: jurisdiction, target amount, investor type (accredited/crowd), asset class',
          'NAOS suggests regulatory_framework (reg_d_506c, reg_cf, mi_45_110, token_utility)',
          'Warning gate on hybrid (blocks until counsel approval set)',
        ],
        priority_order: 30,
      },
      {
        title: 'Auto-generated legal templates (SAFE, subscription agreement) — legal partner API integration',
        acceptance_criteria: [
          'TBD: partner selection (Clerky, Stripe Atlas Legal, or internal template + counsel review)',
          'Generated templates saved to capital_documents',
          'Round term sheet URL set automatically',
        ],
        priority_order: 40,
      },
      {
        title: 'Project review + approval workflow in CapitalLaunchpadAdminView',
        acceptance_criteria: [
          'Tony sees queue of pending projects',
          'Approve/reject with notes',
          'Approved projects become is_public=true',
          'Featured_order configurable for homepage carousel',
        ],
        priority_order: 50,
      },
      {
        title: 'Public raise page (SSR) + live progress bar via WebSocket',
        acceptance_criteria: [
          '/p/[projectSlug]/[roundSlug] server-rendered for SEO',
          'Live progress uses Supabase Realtime subscription',
          'Social proof: investor count, recent commitments (anonymized)',
          'Open Graph + Twitter card metadata',
        ],
        priority_order: 60,
      },
      {
        title: 'Embeddable widget — /widget/[projectSlug]/[roundSlug]',
        acceptance_criteria: [
          'Iframe-safe with sandbox attributes',
          'Configurable size + theme via query params',
          'Shows progress + commit CTA that deep-links to full raise page',
          'Script tag include for <script src=launchpad.mcv.one/embed.js>',
        ],
        priority_order: 70,
      },
      {
        title: 'Featured raises carousel + search + filter (industry, stage, lane, geography)',
        acceptance_criteria: [
          'Homepage carousel of 5 featured raises',
          'Search page with filter chips',
          'Cursor pagination',
          'Only shows rounds where is_public=true and status in (open, closing)',
        ],
        priority_order: 80,
      },
      {
        title: 'HybridInstrumentBuilder — equity + token warrant config with preview',
        acceptance_criteria: [
          'Config: equity %, token warrant ratio, vesting schedule, exercise price',
          'Preview renders term sheet draft',
          'Gated behind counsel-approved flag',
        ],
        priority_order: 90,
      },
      {
        title: 'Token warrant legal template generation (holding for counsel review)',
        acceptance_criteria: [
          'Template draft committed to docs/legal/ for counsel annotation',
          'Integration point stubbed in RoundCreationWizard for hybrid lane',
          'Real generation unlocks post-counsel-signoff',
        ],
        priority_order: 100,
      },
      {
        title: 'Escrow integration — Stripe (fiat) + Solana program (crypto)',
        acceptance_criteria: [
          'Fiat: reuse Futurestate StripeCheckoutSession pattern',
          'Crypto: Solana program receives USDC, releases on round close',
          'Escrow status surfaces in commitment.metadata',
        ],
        priority_order: 110,
      },
      {
        title: 'Automated cap table + token allocation on round close',
        acceptance_criteria: [
          'Round status to closed funded triggers',
          'Equity: shares_allocated computed per commitment, waterfall recomputed',
          'Token: tokens_allocated computed, distribution job queued',
          'Hybrid: both paths fire atomically',
        ],
        priority_order: 120,
      },
      {
        title: 'Investor matching algorithm (NAOS) — rank rounds for each investor by profile fit',
        acceptance_criteria: [
          'Computes fit score from investor focus + stage + jurisdiction + checkSize vs round',
          'Emits capital.naos.investor_matched event',
          'Portal dashboard shows recommended rounds',
        ],
        priority_order: 130,
      },
    ],
    checkpoints: [
      { type: 'spec-review', title: 'Hybrid lane counsel gate', description: 'Counsel signoff on hybrid instrument legal template before enabling for external projects.' },
      { type: 'pre-deploy', title: 'Public data-leak audit', description: 'Unauthenticated Launchpad routes return only is_public data. No PII no compliance data no internal notes.' },
    ],
  },

  // ============================================================
  // Epic 5: Liquidity Layer
  // ============================================================
  {
    phase: 5,
    title: 'Capital Liquidity — token mint, vesting, DEX/ATS, secondary market, distributions',
    summary:
      'Phase 4 of PRD. Solana token minting + vesting on round close, DEX listing, ATS partnership for regulated secondary, P2P transfers with compliance gating, portfolio analytics, dividend/distribution engine.',
    spec_md: `Depends on Epic 4. Partnership-heavy (transfer agent, ATS). Phase 1-3 does NOT block on this.\n\nSee: ${PLAN_DOC}`,
    status: 'proposed',
    priority: 'medium',
    priority_order: 50,
    tags: ['capital:ep5', 'capital', 'liquidity', 'solana'],
    stories: [
      {
        title: 'Automated token minting on round close (Solana program)',
        acceptance_criteria: [
          'Anchor program for token mint with freeze authority',
          'Called automatically when round status to funded',
          'Mint authority retained for ongoing distributions',
        ],
        priority_order: 10,
      },
      {
        title: 'Vesting contract deployment + investor claim portal',
        acceptance_criteria: [
          'Per-investor vesting schedule on-chain',
          'Claim portal in Futurestate (dashboard)/capital/claim',
          'Clock-based unlocks matching commitment terms',
        ],
        priority_order: 20,
      },
      {
        title: 'DEX listing automation — Jupiter/Raydium metadata push',
        acceptance_criteria: [
          'Metadata URI published for token',
          'Initial liquidity pool seeded from treasury allocation',
          'Price feed active within 1hr of mint',
        ],
        priority_order: 30,
      },
      {
        title: 'Transfer agent API integration (partner TBD — Carta-compete)',
        acceptance_criteria: [
          'Partnership selected (candidates: Vertalo, Securitize, Clear Street)',
          'Shareholder registry sync bi-directional',
          'Equity lane rounds opt-in for transfer agent on creation',
        ],
        priority_order: 40,
      },
      {
        title: 'Equity token standard — Solana SPL with freeze authority for compliance',
        acceptance_criteria: [
          'Freeze authority used to enforce jurisdiction + accreditation transfer rules',
          'Compliance check middleware on every transfer',
          'Emergency freeze capability for regulatory holds',
        ],
        priority_order: 50,
      },
      {
        title: 'ATS partnership for regulated secondary trading',
        acceptance_criteria: [
          'Partnership signed',
          'Integration: order routing + settlement',
          'UI: secondary market tab in portal',
        ],
        priority_order: 60,
      },
      {
        title: 'P2P transfer requests — compliance-gated',
        acceptance_criteria: [
          'Seller initiates, buyer accepts, compliance check runs',
          'Gated on buyer accreditation + jurisdiction match',
          'Audit entry per transfer attempt (approved or blocked)',
        ],
        priority_order: 70,
      },
      {
        title: 'Portfolio analytics — IRR, MOIC, TVPI (analytics.service.ts in @mcv/capital-sdk)',
        acceptance_criteria: [
          'Per-investor IRR computed on demand',
          'Multiple on Invested Capital (MOIC) tracked per position',
          'TVPI (Total Value to Paid-In) aggregated at portfolio level',
          'Surfaces in portal dashboard + Tony global view',
        ],
        priority_order: 80,
      },
      {
        title: 'Dividend/distribution engine — auto-payout (Stripe + Solana distribution program)',
        acceptance_criteria: [
          'Fiat distributions reuse Futurestate StripeDistribution pattern',
          'Crypto distributions via new Solana program that reads cap_table and disperses SPL tokens/USDC',
          'Per-distribution audit trail + investor email',
          'Tax reporting export (1099-DIV for US, T5 for Canada)',
        ],
        priority_order: 90,
      },
    ],
  },

  // ============================================================
  // Epic 6: Ecosystem Integration + GA Hardening
  // ============================================================
  {
    phase: 6,
    title: 'Capital GA — capital-kit for NAOS, white-label API, SOC 2 prep, observability',
    summary:
      'Parallel to Epic 4-5. capital-kit builtin in @mcv/kits-sdk with 12 NAOS tools, white-label API tier, SOC 2 audit prep (audit log completeness, encryption-at-rest verification, access review), multi-jurisdiction enforcement, observability dashboards.',
    spec_md: `Runs parallel with Epic 4-5. Hardens for external partnerships and regulated clients.\n\nSee: ${PLAN_DOC}`,
    status: 'proposed',
    priority: 'medium',
    priority_order: 60,
    tags: ['capital:ep6', 'capital', 'hardening', 'kit', 'ga'],
    stories: [
      {
        title: 'capital-kit builtin in packages/kits-sdk/src/builtin/capital-kit.ts — 12 NAOS tools',
        acceptance_criteria: [
          'Tools: list_rounds, get_round_detail, list_commitments, create_commitment, update_commitment_status, list_investors, get_investor_position, get_pipeline_health, get_capital_summary, send_docusign, record_payment, distribute_tokens',
          'Manifest schemas + handlers using CapitalAdminClient',
          'Registered in packages/kits-sdk/src/loader.ts setSharedBuiltinKits',
          'Tested: NAOS chat invokes get_pipeline_health and returns live numbers',
        ],
        priority_order: 10,
      },
      {
        title: 'White-label API tier — CapitalAdminClient for 3rd-party platforms',
        acceptance_criteria: [
          'API key auth mode in Capital service',
          'Rate limits per tier (Starter/Growth/Scale/Enterprise)',
          'Usage metering via @mcv/ledger-sdk',
          'Docs site',
        ],
        priority_order: 20,
      },
      {
        title: 'SOC 2 audit prep — audit log completeness + encryption + access review',
        acceptance_criteria: [
          'Every capital_* table writes to audit_log',
          'Encryption at rest verified (Supabase default + Vault for secrets)',
          'Quarterly access review procedure documented',
          'SOC 2 readiness checklist 100%',
        ],
        priority_order: 30,
      },
      {
        title: 'Multi-jurisdiction enforcement in commitment creation',
        acceptance_criteria: [
          'Round.jurisdiction_restrictions honored at commit time',
          'Investor jurisdiction from Triangle Identity compliance record',
          'Blocked commitments written to audit_log with reason',
        ],
        priority_order: 40,
      },
      {
        title: 'Cross-venture super-admin global view — reuses role=super_admin identity check',
        acceptance_criteria: [
          'Tony sees all ventures in CapitalGlobalView',
          'Venture admins see only their own',
          'RLS enforces at DB level, not only UI',
        ],
        priority_order: 50,
      },
      {
        title: 'Observability — Grafana dashboards for capital.* royalty + event volume',
        acceptance_criteria: [
          'Dashboard: commitments/day, $raised/day, event latency, failed transitions',
          'Alerts: round approaching deadline, compliance failures, DocuSign failures',
          'Integrates with existing MCV observability stack',
        ],
        priority_order: 60,
      },
      {
        title: 'Documentation — docs/capital/ in mcv-one-desktop + public docs site',
        acceptance_criteria: [
          'Internal docs: schema reference, SDK usage, operational runbooks',
          'Public docs: API reference for white-label tier, integration guide',
          'Tutorial: "Running your first raise on EdgeIQ Capital" (covers full lifecycle)',
        ],
        priority_order: 70,
      },
    ],
    checkpoints: [
      { type: 'pre-deploy', title: 'GA launch gate', description: 'All Epic 1-4 scope live, Epic 6 hardening complete, first 3 external projects onboarded, SOC 2 readiness signed off.' },
    ],
  },
];

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] || (fallback ? process.env[fallback] : undefined);
  if (!value) {
    throw new Error(`Missing required env: ${name}${fallback ? ` (or ${fallback})` : ''}`);
  }
  return value;
}

async function main() {
  const url = requireEnv('SUPABASE_URL', 'VITE_SUPABASE_URL');
  const key = requireEnv('SUPABASE_SERVICE_KEY', 'VITE_SUPABASE_ANON_KEY');
  const client = createClient(url, key);

  console.log('Seeding EdgeIQ Capital epic tree...\n');

  let seededEpics = 0;
  let skippedEpics = 0;
  let seededStories = 0;
  let seededCheckpoints = 0;

  for (const ep of PLAN) {
    const tag = ep.tags.find((t) => t.startsWith('capital:ep'));
    if (!tag) {
      console.warn(`  Epic "${ep.title}" missing capital:ep{N} tag — skipping`);
      continue;
    }

    const { data: existing } = await client.from('epics').select('id, title').contains('tags', [tag]).maybeSingle();
    if (existing) {
      console.log(`[skip exists] ${ep.title}`);
      skippedEpics++;
      continue;
    }

    const { data: epic, error: epicErr } = await client
      .from('epics')
      .insert({
        title: ep.title,
        summary: ep.summary,
        spec_md: ep.spec_md,
        venture_id: 'mcv',
        suite: 'capital',
        status: ep.status ?? 'proposed',
        priority: ep.priority,
        priority_order: ep.priority_order,
        tags: ep.tags,
        linked_docs: [PLAN_DOC, PRD_DOC],
      })
      .select()
      .single();

    if (epicErr || !epic) {
      console.error(`[fail] "${ep.title}":`, epicErr);
      continue;
    }

    seededEpics++;
    console.log(`[ok epic] ${ep.title}`);

    const rows = ep.stories.map((s, i) => ({
      epic_id: epic.id,
      title: s.title,
      description: s.description ?? null,
      acceptance_criteria: s.acceptance_criteria ?? [],
      priority_order: s.priority_order ?? (i + 1) * 10,
      estimated_effort: s.estimated_effort ?? null,
      status: ep.phase === 0 ? 'in-progress' : 'todo',
    }));

    const { data: storyRows, error: storyErr } = await client.from('stories').insert(rows).select('id');
    if (storyErr) {
      console.error(`   [fail stories]`, storyErr);
    } else {
      seededStories += storyRows?.length ?? 0;
      console.log(`   [ok ${storyRows?.length ?? 0} stories]`);
    }

    if (ep.checkpoints?.length) {
      const checkpointRows = ep.checkpoints.map((cp) => ({
        epic_id: epic.id,
        checkpoint_type: cp.type,
        title: cp.title,
        description: cp.description ?? null,
        state: 'pending',
      }));
      const { error: cpErr } = await client.from('epic_checkpoints').insert(checkpointRows);
      if (cpErr) {
        console.error(`   [fail checkpoints]`, cpErr);
      } else {
        seededCheckpoints += checkpointRows.length;
        console.log(`   [ok ${checkpointRows.length} checkpoints]`);
      }
    }
  }

  console.log('\n-- summary --');
  console.log(`Epics seeded:      ${seededEpics}`);
  console.log(`Epics skipped:     ${skippedEpics}`);
  console.log(`Stories seeded:    ${seededStories}`);
  console.log(`Checkpoints:       ${seededCheckpoints}`);
  console.log('\nCapital epic tree ready. Open EpicBoardView to see it live.');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
