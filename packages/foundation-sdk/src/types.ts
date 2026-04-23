// @mcv/foundation-sdk/types — zod schemas 1:1 with the Foundation OS Supabase tables.
//
// Types mirror supabase/migration-foundation-os-v1-2026-04-22.sql. Camel-case in TS,
// snake-case at the DB boundary (services map on read/write).
//
// All evolving data (75 TM marks, 13 patents, 22 counsel tasks, 111 domains) lives
// in the database — no hand-authored arrays in this SDK. See corpus/ for the
// small set of truly-locked invariants (ratified names, crown entity ids).

import { z } from 'zod';

// ─── Enum vocabularies (mirror SQL enums) ───────────────────────────────────

export const IPMarkKind = z.enum(['trademark', 'patent', 'copyright', 'trade_secret']);
export type IPMarkKind = z.infer<typeof IPMarkKind>;

export const IPPriorityTier = z.enum(['P0', 'P1', 'P2', 'P3', 'DNF', 'PP0', 'PP1', 'PP2']);
export type IPPriorityTier = z.infer<typeof IPPriorityTier>;

export const IPStatus = z.enum([
  'identified', 'clearance_in_progress', 'filed', 'published',
  'registered', 'refused', 'abandoned',
]);
export type IPStatus = z.infer<typeof IPStatus>;

export const CounselWorkstream = z.enum(['corp_tax', 'ip', 'securities']);
export type CounselWorkstream = z.infer<typeof CounselWorkstream>;

export const CounselEngagementStatus = z.enum([
  'prospecting', 'nda_sent', 'nda_executed', 'engagement_letter_sent',
  'engaged', 'active', 'paused', 'closed',
]);
export type CounselEngagementStatus = z.infer<typeof CounselEngagementStatus>;

export const CounselTaskStatus = z.enum([
  'backlog', 'proposed', 'approved', 'in_progress', 'review', 'done', 'blocked',
]);
export type CounselTaskStatus = z.infer<typeof CounselTaskStatus>;

export const FilingType = z.enum([
  'clearance_search', 'trademark_filing', 'provisional_patent',
  'utility_patent', 'copyright_registration', 'madrid_extension', 'renewal',
]);
export type FilingType = z.infer<typeof FilingType>;

export const AcquisitionAssetKind = z.enum(['domain', 'trademark_purchase', 'patent_purchase']);
export type AcquisitionAssetKind = z.infer<typeof AcquisitionAssetKind>;

export const AcquisitionUrgencyTier = z.enum([
  'red_7day', 'orange_30day', 'yellow_90day', 'green_defensive',
]);
export type AcquisitionUrgencyTier = z.infer<typeof AcquisitionUrgencyTier>;

export const AcquisitionStatus = z.enum(['scoped', 'cart', 'acquired', 'deferred', 'killed']);
export type AcquisitionStatus = z.infer<typeof AcquisitionStatus>;

export const NamingOccurrenceKind = z.enum([
  'markdown_prose', 'code_comment', 'string_literal', 'identifier',
  'import_path', 'type_name', 'test_name', 'ui_copy',
]);
export type NamingOccurrenceKind = z.infer<typeof NamingOccurrenceKind>;

export const NamingClassification = z.enum(['safe', 'risky', 'unsafe', 'ambiguous']);
export type NamingClassification = z.infer<typeof NamingClassification>;

export const NamingApprovalStatus = z.enum(['pending', 'approved', 'rejected', 'applied']);
export type NamingApprovalStatus = z.infer<typeof NamingApprovalStatus>;

export const NamingContext = z.enum(['prose', 'identifier', 'any']);
export type NamingContext = z.infer<typeof NamingContext>;

export const IngestionSourceKind = z.enum([
  'counsel_markdown', 'csv_portfolio', 'csv_entities', 'csv_gaps', 'csv_carts',
]);
export type IngestionSourceKind = z.infer<typeof IngestionSourceKind>;

export const HoldingChainStage = z.enum(['interim_mcv_inc', 'final_root', 'transferred']);
export type HoldingChainStage = z.infer<typeof HoldingChainStage>;

export const ProvisionalDraftStatus = z.enum([
  'unscoped', 'outline', 'draft', 'reviewed', 'filed',
]);
export type ProvisionalDraftStatus = z.infer<typeof ProvisionalDraftStatus>;

export const PatentFilingVehicle = z.enum(['counsel_drafted', 'patent_nlp', 'hybrid']);
export type PatentFilingVehicle = z.infer<typeof PatentFilingVehicle>;

export const ConflictsCheckStatus = z.enum(['not_run', 'clean', 'conflict_flagged']);
export type ConflictsCheckStatus = z.infer<typeof ConflictsCheckStatus>;

export const NDATemplateKind = z.enum(['capital', 'partner']);
export type NDATemplateKind = z.infer<typeof NDATemplateKind>;

export const IngestionStatus = z.enum(['running', 'ok', 'failed']);
export type IngestionStatus = z.infer<typeof IngestionStatus>;

// ─── IP marks (unified TM/patent/copyright/trade_secret) ────────────────────

export const IPMark = z.object({
  id: z.string().uuid(),
  markText: z.string(),
  markKind: IPMarkKind,
  priorityTier: IPPriorityTier,
  classes: z.array(z.number().int()).default([]),
  jurisdictions: z.array(z.string()).default([]),
  ownerEntityId: z.string().nullable(),
  holdingChainStage: HoldingChainStage.default('interim_mcv_inc'),
  domainFk: z.string().uuid().nullable(),
  status: IPStatus.default('identified'),
  filingNumber: z.string().nullable(),
  registrationNumber: z.string().nullable(),
  filedAt: z.string().nullable(),
  registeredAt: z.string().nullable(),
  renewalDue: z.string().nullable(),
  isCompound: z.boolean().default(false),
  compoundParentMarkId: z.string().uuid().nullable(),
  // Patent extension (null when markKind !== 'patent' — enforced by DB CHECK)
  claimSummary: z.string().nullable(),
  noveltyHook: z.string().nullable(),
  supportingArtifacts: z.array(z.string()).default([]),
  provisionalDraftStatus: ProvisionalDraftStatus.nullable(),
  filingVehicle: PatentFilingVehicle.nullable(),
  notes: z.string().nullable(),
  sourceDoc: z.string().nullable(),
  sourceSection: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type IPMark = z.infer<typeof IPMark>;

export const CreateIPMarkInput = IPMark.omit({
  id: true, createdAt: true, updatedAt: true,
}).partial({
  classes: true, jurisdictions: true, holdingChainStage: true, status: true,
  supportingArtifacts: true, isCompound: true,
});
export type CreateIPMarkInput = z.infer<typeof CreateIPMarkInput>;

// ─── Counsel engagements ────────────────────────────────────────────────────

export const CounselEngagement = z.object({
  id: z.string().uuid(),
  firmName: z.string(),
  workstream: CounselWorkstream,
  contactName: z.string().nullable(),
  contactEmail: z.string().nullable(),
  status: CounselEngagementStatus.default('prospecting'),
  conflictsCheckStatus: ConflictsCheckStatus.default('not_run'),
  scopingCallAt: z.string().nullable(),
  engagementLetterUrl: z.string().nullable(),
  ndaTemplateUsed: NDATemplateKind.nullable(),
  ndaExecutedAt: z.string().nullable(),
  budgetAllocatedUsd: z.number().default(0),
  budgetConsumedUsd: z.number().default(0),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type CounselEngagement = z.infer<typeof CounselEngagement>;

export const CreateCounselEngagementInput = CounselEngagement.omit({
  id: true, createdAt: true, updatedAt: true,
}).partial({
  status: true, conflictsCheckStatus: true, budgetAllocatedUsd: true, budgetConsumedUsd: true,
});
export type CreateCounselEngagementInput = z.infer<typeof CreateCounselEngagementInput>;

// ─── Counsel tasks (CT-*, IP-*, SEC-*) ──────────────────────────────────────

export const CounselTask = z.object({
  id: z.string().uuid(),
  taskCode: z.string(),                    // 'CT-1' | 'IP-3' | 'SEC-2' | ...
  workstream: CounselWorkstream,
  title: z.string(),
  description: z.string().nullable(),
  deliverable: z.string().nullable(),
  dependsOn: z.array(z.string()).default([]),
  criticalPath: z.boolean().default(false),
  assignedEngagementId: z.string().uuid().nullable(),
  status: CounselTaskStatus.default('backlog'),
  priority: z.number().int().default(100),
  dueAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  epicId: z.string().uuid().nullable(),
  sourceDoc: z.string().nullable(),
  sourceSection: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type CounselTask = z.infer<typeof CounselTask>;

// ─── Filing records ─────────────────────────────────────────────────────────

export const FilingRecord = z.object({
  id: z.string().uuid(),
  ipMarkId: z.string().uuid(),
  filingType: FilingType,
  jurisdiction: z.string(),
  filedAt: z.string().nullable(),
  filingNumber: z.string().nullable(),
  counselEngagementId: z.string().uuid().nullable(),
  feeFilingUsd: z.number().default(0),
  feeCounselUsd: z.number().default(0),
  feeTotalUsd: z.number(),                 // generated column
  status: IPStatus.default('filed'),
  notes: z.string().nullable(),
  capitalFlowId: z.string().uuid().nullable(),
  createdAt: z.string(),
});
export type FilingRecord = z.infer<typeof FilingRecord>;

export const RecordFilingInput = z.object({
  ipMarkId: z.string().uuid(),
  filingType: FilingType,
  jurisdiction: z.string(),
  counselEngagementId: z.string().uuid().nullable().optional(),
  feeFilingUsd: z.number().default(0),
  feeCounselUsd: z.number().default(0),
  filingNumber: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type RecordFilingInput = z.infer<typeof RecordFilingInput>;

// ─── Acquisition orders ─────────────────────────────────────────────────────

export const AcquisitionOrder = z.object({
  id: z.string().uuid(),
  assetKind: AcquisitionAssetKind,
  assetIdentifier: z.string(),             // e.g. 'futurestate.app'
  urgencyTier: AcquisitionUrgencyTier,
  targetRegistrar: z.string().nullable(),
  priceCad: z.number().nullable(),
  priceUsd: z.number().nullable(),
  brokerContact: z.string().nullable(),
  status: AcquisitionStatus.default('scoped'),
  blocksDisclosure: z.boolean().default(false),
  blocksVentureName: z.string().nullable(),
  notes: z.string().nullable(),
  acquiredAt: z.string().nullable(),
  acquiredRegistrar: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type AcquisitionOrder = z.infer<typeof AcquisitionOrder>;

// ─── Naming ratifications + occurrences + batches ───────────────────────────

export const NamingRatification = z.object({
  id: z.string().uuid(),
  deprecatedName: z.string(),
  ratifiedName: z.string(),
  context: NamingContext.default('any'),
  effectiveAt: z.string(),
  rationale: z.string().nullable(),
  createdAt: z.string(),
});
export type NamingRatification = z.infer<typeof NamingRatification>;

export const NamingOccurrence = z.object({
  id: z.string().uuid(),
  ratificationId: z.string().uuid(),
  filePath: z.string(),
  lineNumber: z.number().int(),
  columnNumber: z.number().int(),
  contextBefore: z.string().nullable(),
  matchText: z.string(),
  contextAfter: z.string().nullable(),
  occurrenceKind: NamingOccurrenceKind,
  classification: NamingClassification.default('ambiguous'),
  proposedReplacement: z.string().nullable(),
  approvalStatus: NamingApprovalStatus.default('pending'),
  approvedBy: z.string().nullable(),
  approvedAt: z.string().nullable(),
  appliedAt: z.string().nullable(),
  commitSha: z.string().nullable(),
  batchId: z.string().uuid().nullable(),
  createdAt: z.string(),
});
export type NamingOccurrence = z.infer<typeof NamingOccurrence>;

export const NamingBatch = z.object({
  id: z.string().uuid(),
  approvedBy: z.string().nullable(),
  approvedAt: z.string().nullable(),
  appliedAt: z.string().nullable(),
  commitSha: z.string().nullable(),
  preCommitSha: z.string().nullable(),
  occurrenceCount: z.number().int().default(0),
  rollbackOf: z.string().uuid().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
});
export type NamingBatch = z.infer<typeof NamingBatch>;

// ─── Docs ingestion runs ────────────────────────────────────────────────────

export const DocsIngestionRun = z.object({
  id: z.string().uuid(),
  sourcePath: z.string(),
  sourceKind: IngestionSourceKind,
  startedAt: z.string(),
  completedAt: z.string().nullable(),
  rowsInserted: z.number().int().default(0),
  chunksEmbedded: z.number().int().default(0),
  status: IngestionStatus.default('running'),
  errorLog: z.string().nullable(),
});
export type DocsIngestionRun = z.infer<typeof DocsIngestionRun>;

// ─── Cross-cutting rollup types (read models for cockpit panels) ────────────

export const IPBudgetRollup = z.object({
  p0Total: z.number(),
  p1Total: z.number(),
  p2Total: z.number(),
  madridTotal: z.number(),
  utilityTotal: z.number(),
  allTotal: z.number(),
  yearOneEnvelopeLow: z.number().default(266000),
  yearOneEnvelopeHigh: z.number().default(351000),
});
export type IPBudgetRollup = z.infer<typeof IPBudgetRollup>;

export const BlueMarlinGateStatus = z.object({
  p0Total: z.number().int(),
  p0Green: z.number().int(),
  ready: z.boolean(),
  blockers: z.array(z.string()),
  checkedAt: z.string(),
});
export type BlueMarlinGateStatus = z.infer<typeof BlueMarlinGateStatus>;

export const EntityStackNode = z.object({
  id: z.string(),
  label: z.string(),
  jurisdiction: z.string(),
  entityType: z.string(),
  parentEntityId: z.string().nullable(),
  isCrown: z.boolean().default(false),
  formationStatus: z.enum(['planned', 'in_formation', 'formed', 'dissolved']).default('planned'),
  children: z.lazy((): z.ZodType<EntityStackNode[]> => z.array(EntityStackNode)).default([]),
});
export type EntityStackNode = {
  id: string;
  label: string;
  jurisdiction: string;
  entityType: string;
  parentEntityId: string | null;
  isCrown: boolean;
  formationStatus: 'planned' | 'in_formation' | 'formed' | 'dissolved';
  children: EntityStackNode[];
};
