// packages/events-sdk/src/contracts/foundation.ts
//
// Foundation OS emissions + subscriptions.
//
// Topics MUST match what api/_handlers/foundation.ts already publishes (see
// `publishFoundationEvent` call sites) — we're formalizing the contract over
// live topics, not inventing new ones. Where the handler already publishes a
// shape, the zod schema mirrors that shape. Forward-looking emissions (status
// changes etc.) are marked in the description.

import { z } from 'zod';
import type { ContractDeclaration } from '../types.js';

// Shared vocabularies — live in @mcv/foundation-sdk as string-check constraints
// but inlined here so events-sdk has zero hard deps on other SDKs. If the
// foundation-sdk vocabulary drifts, the CI contract-drift check will flag it.
const CounselWorkstream = z.enum(['corp_tax', 'ip', 'securities']);
const IpMarkKind        = z.enum(['trademark', 'patent', 'copyright', 'trade_secret']);
const PriorityTier      = z.enum(['P0', 'P1', 'P2', 'P3', 'DNF', 'PP0', 'PP1', 'PP2']);
const FilingKind        = z.enum([
  'trademark_application',
  'trademark_renewal',
  'patent_application',
  'patent_maintenance',
  'copyright_registration',
  'entity_formation',
  'entity_annual_report',
  'securities_filing',
  'ip_assignment',
  'other',
]);

export const FoundationContract: ContractDeclaration<'foundation'> = {
  module: 'foundation',
  version: '1.0',

  emits: [
    // ── IP portfolio ────────────────────────────────────────────────────
    {
      topic: 'foundation.ip-mark.created',
      schemaVersion: '1.0',
      payload: z.object({
        id: z.string().uuid(),
        markText: z.string(),
        markKind: IpMarkKind,
        priorityTier: PriorityTier,
      }),
      description: 'New IP mark (trademark/patent/copyright/trade_secret) added to the portfolio.',
    },
    {
      topic: 'foundation.ip-mark.status-changed',
      schemaVersion: '1.0',
      payload: z.object({
        id: z.string().uuid(),
        markText: z.string(),
        fromStatus: z.string(),
        toStatus: z.string(),
      }),
      description: 'IP mark status transitioned (identified → clearance → filed → registered etc.).',
    },

    // ── Counsel ─────────────────────────────────────────────────────────
    {
      topic: 'foundation.counsel.engaged',
      schemaVersion: '1.0',
      payload: z.object({
        engagementId: z.string().uuid(),
        firmName: z.string(),
        workstream: CounselWorkstream,
      }),
      description: 'Outside counsel firm engaged on a workstream.',
    },
    {
      topic: 'foundation.counsel.nda-executed',
      schemaVersion: '1.0',
      payload: z.object({
        engagementId: z.string().uuid(),
        firmName: z.string(),
        workstream: CounselWorkstream,
        executedAt: z.string(),
      }),
      description: 'Counsel NDA marked executed. Unlocks trade-secret disclosure to that firm.',
    },
    {
      topic: 'foundation.counsel-task.created',
      schemaVersion: '1.0',
      payload: z.object({
        taskId: z.string().uuid(),
        taskCode: z.string(),
        workstream: CounselWorkstream,
      }),
      description: 'New counsel task assigned (CT-*, IP-*, SEC-*).',
    },
    {
      topic: 'foundation.counsel-task.done',
      schemaVersion: '1.0',
      payload: z.object({
        taskId: z.string().uuid(),
        taskCode: z.string(),
        workstream: CounselWorkstream,
      }),
      description: 'Counsel task marked complete.',
    },

    // ── Domains / acquisitions ──────────────────────────────────────────
    {
      topic: 'foundation.domain.acquired',
      schemaVersion: '1.0',
      payload: z.object({
        orderId: z.string().uuid(),
        assetIdentifier: z.string(),
        priceUsd: z.number().nullable(),
      }),
      description: 'Domain or mark acquisition completed (wire sent + asset transferred).',
    },
    {
      topic: 'foundation.acquisition.seeded',
      schemaVersion: '1.0',
      payload: z.object({
        count: z.number(),
        source: z.string(),
      }),
      description: 'Acquisition queue seeded from a docs corpus run (🔴/🟠 triplet etc.).',
    },
    {
      topic: 'foundation.domains.synced',
      schemaVersion: '1.0',
      payload: z.object({
        domainCount: z.number(),
        source: z.string(), // "namecheap" | "cloudflare" | etc.
      }),
      description: 'Domain registry refreshed from a registrar API (Namecheap today, Cloudflare next).',
    },

    // ── GitHub repositories (Foundation-OS Portfolio panel) ─────────────
    {
      topic: 'foundation.repo.synced',
      schemaVersion: '1.0',
      payload: z.object({
        repoCount: z.number(),
        archivedCount: z.number(),
        source: z.string(), // "github-api"
      }),
      description: 'GitHub repository registry refreshed from the GitHub REST API.',
    },

    // ── Vercel deployments (Foundation-OS Portfolio panel) ──────────────
    {
      topic: 'foundation.deployment.live',
      schemaVersion: '1.0',
      payload: z.object({
        projectName: z.string(),
        url: z.string(),
        target: z.enum(['production', 'staging', 'preview']),
        commitSha: z.string().nullable(),
        commitMessage: z.string().nullable(),
      }),
      description: 'Vercel deployment reached READY state. Production targets carry operational weight.',
    },
    {
      topic: 'foundation.deployment.failed',
      schemaVersion: '1.0',
      payload: z.object({
        projectName: z.string(),
        deploymentId: z.string(),
        target: z.enum(['production', 'staging', 'preview']),
        commitSha: z.string().nullable(),
      }),
      description: 'Vercel deployment errored. Production failures are ops-page-worthy; preview failures are PR-review signal.',
    },

    // ── Naming ratifications ────────────────────────────────────────────
    {
      topic: 'foundation.naming.batch-approved',
      schemaVersion: '1.0',
      payload: z.object({
        batchId: z.string().uuid(),
        occurrenceCount: z.number(),
      }),
      description: 'Naming-rename batch approved. Ready for apply.',
    },
    {
      topic: 'foundation.naming.batch-applied',
      schemaVersion: '1.0',
      payload: z.object({
        batchId: z.string().uuid(),
        commitSha: z.string().nullable(),
        occurrenceCount: z.number(),
      }),
      description: 'Naming-rename batch applied to the repo.',
    },
    {
      topic: 'foundation.naming.batch-rollback',
      schemaVersion: '1.0',
      payload: z.object({
        batchId: z.string().uuid(),
        reason: z.string().nullable(),
      }),
      description: 'Naming-rename batch rolled back to the pre-apply commit SHA.',
    },

    // ── Filings (every filing fires + emits a journal entry via LedgerAdapter) ──
    {
      topic: 'foundation.filing.recorded',
      schemaVersion: '1.0',
      payload: z.object({
        filingId: z.string().uuid(),
        filingKind: FilingKind,
        amountUsd: z.number().nullable(),
        journalEntryId: z.string().uuid().nullable(),
      }),
      description: 'Filing record persisted + journal entry emitted (DR 5180 / CR cash|AP).',
    },
    {
      topic: 'foundation.filing.deadline-approaching',
      schemaVersion: '1.0',
      payload: z.object({
        filingId: z.string().uuid(),
        filingKind: FilingKind,
        dueDate: z.string(),
        daysRemaining: z.number(),
      }),
      description: 'Filing deadline within alert window (30 / 7 / 1 day). Forward-looking — fires from a cron once M-F2 is live.',
    },

    // ── Ingestion runs ──────────────────────────────────────────────────
    {
      topic: 'foundation.ingestion.completed',
      schemaVersion: '1.0',
      payload: z.object({
        runId: z.string().uuid(),
        docsProcessed: z.number(),
        anomalies: z.number(),
      }),
      description: 'A .docs/counsel corpus ingestion run finished.',
    },
  ],

  subscribes: [
    {
      topicPattern: 'capital.round.funded',
      description:
        'Triggers IP transfer-to-Root eligibility review — when a round funds, the mcv-final-root holding-chain step unlocks for IP assets assigned to the receiving venture.',
    },
    {
      topicPattern: 'commerce.order.flagged',
      description:
        'Watch for trademark-infringing merchandise listings so counsel can advise whether to take action.',
    },
    {
      topicPattern: 'mcv-sign.envelope.executed',
      description:
        'Counsel NDAs + IP assignments delivered via MCV-Sign should auto-update the engagement status on executed.',
    },
  ],
};
