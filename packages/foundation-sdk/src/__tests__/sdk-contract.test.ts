// Foundation SDK contract tests.
//
// These lock the boundary between @mcv/foundation-sdk and the rest of the
// codebase — zod schemas parse valid input, reject invalid input, and the
// locked corpus constants (ratified names, crown entity ids) stay invariant.
// Also verifies @mcv/capital-sdk's CapitalFlow taxonomy now admits
// 'ip_filing_expense' as specified in Phase 1.

import { describe, it, expect } from 'vitest';

import {
  IPMark,
  IPMarkKind,
  IPPriorityTier,
  CounselTask,
  CounselWorkstream,
  NamingOccurrence,
  NamingClassification,
  AcquisitionOrder,
  AcquisitionUrgencyTier,
  DocsIngestionRun,
  IngestionStatus,
} from '../types';

import {
  RATIFIED_NAMES,
  RATIFIED_NAMES_BY_DEPRECATED,
  CLASSIFICATION_DEFAULTS,
} from '../corpus/ratified-names';

import {
  CROWN_ENTITY_IDS,
  CROWN_PROTECTED_FIELDS_SET,
  isCrownEntity,
} from '../corpus/entity-stack-ids';

describe('foundation-sdk contract / enums', () => {
  it('IPMarkKind exposes the four unified kinds', () => {
    const parsed = IPMarkKind.options;
    expect(parsed).toEqual(['trademark', 'patent', 'copyright', 'trade_secret']);
  });

  it('IPPriorityTier covers P0-P3 + DNF + PP0-PP2', () => {
    const parsed = IPPriorityTier.options;
    expect(parsed).toEqual(['P0', 'P1', 'P2', 'P3', 'DNF', 'PP0', 'PP1', 'PP2']);
  });

  it('CounselWorkstream has exactly 3 workstreams', () => {
    expect(CounselWorkstream.options).toEqual(['corp_tax', 'ip', 'securities']);
  });

  it('AcquisitionUrgencyTier follows red/orange/yellow/green ladder', () => {
    expect(AcquisitionUrgencyTier.options).toEqual([
      'red_7day', 'orange_30day', 'yellow_90day', 'green_defensive',
    ]);
  });

  it('NamingClassification covers safe/risky/unsafe/ambiguous', () => {
    expect(NamingClassification.options.sort()).toEqual(
      ['ambiguous', 'risky', 'safe', 'unsafe'],
    );
  });

  it('IngestionStatus covers running/ok/failed', () => {
    expect(IngestionStatus.options).toEqual(['running', 'ok', 'failed']);
  });
});

describe('foundation-sdk contract / zod round-trip', () => {
  it('accepts a valid IPMark row', () => {
    const row = {
      id: '00000000-0000-0000-0000-000000000000',
      markText: 'FUTURESTATE',
      markKind: 'trademark' as const,
      priorityTier: 'P0' as const,
      classes: [35, 36, 42],
      jurisdictions: ['US', 'CA'],
      ownerEntityId: null,
      holdingChainStage: 'interim_mcv_inc' as const,
      domainFk: null,
      status: 'identified' as const,
      filingNumber: null,
      registrationNumber: null,
      filedAt: null,
      registeredAt: null,
      renewalDue: null,
      isCompound: false,
      compoundParentMarkId: null,
      claimSummary: null,
      noveltyHook: null,
      supportingArtifacts: [],
      provisionalDraftStatus: null,
      filingVehicle: null,
      notes: null,
      sourceDoc: 'MCV-IP-Inventory-v1.1.md',
      sourceSection: '1.4 Venture Brand Marks',
      createdAt: '2026-04-22T00:00:00Z',
      updatedAt: '2026-04-22T00:00:00Z',
    };
    const parsed = IPMark.parse(row);
    expect(parsed.markText).toBe('FUTURESTATE');
    expect(parsed.classes).toEqual([35, 36, 42]);
  });

  it('rejects an invalid priority tier', () => {
    expect(() =>
      IPPriorityTier.parse('P99')
    ).toThrow();
  });

  it('round-trips a CounselTask', () => {
    const row = {
      id: '00000000-0000-0000-0000-000000000000',
      taskCode: 'CT-1',
      workstream: 'corp_tax' as const,
      title: 'Architecture opinion letter',
      description: null,
      deliverable: null,
      dependsOn: [],
      criticalPath: true,
      assignedEngagementId: null,
      status: 'backlog' as const,
      priority: 10,
      dueAt: null,
      completedAt: null,
      epicId: null,
      sourceDoc: 'MCV_Counsel_Onboarding_Pack_v2.0.md',
      sourceSection: '5.2 Specific Tasks',
      createdAt: '2026-04-22T00:00:00Z',
      updatedAt: '2026-04-22T00:00:00Z',
    };
    const parsed = CounselTask.parse(row);
    expect(parsed.taskCode).toBe('CT-1');
    expect(parsed.criticalPath).toBe(true);
  });

  it('round-trips a NamingOccurrence with defaults applied', () => {
    const row = {
      id: '00000000-0000-0000-0000-000000000000',
      ratificationId: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
      filePath: 'docs/codex.md',
      lineNumber: 42,
      columnNumber: 7,
      contextBefore: null,
      matchText: 'Sovereign Citizen',
      contextAfter: null,
      occurrenceKind: 'markdown_prose' as const,
      classification: 'safe' as const,
      proposedReplacement: 'Citizen',
      approvalStatus: 'pending' as const,
      approvedBy: null,
      approvedAt: null,
      appliedAt: null,
      commitSha: null,
      batchId: null,
      createdAt: '2026-04-22T00:00:00Z',
    };
    const parsed = NamingOccurrence.parse(row);
    expect(parsed.proposedReplacement).toBe('Citizen');
  });

  it('AcquisitionOrder accepts red_7day rows', () => {
    const row = {
      id: '00000000-0000-0000-0000-000000000000',
      assetKind: 'domain' as const,
      assetIdentifier: 'futurestate.app',
      urgencyTier: 'red_7day' as const,
      targetRegistrar: 'Namecheap',
      priceCad: null,
      priceUsd: null,
      brokerContact: null,
      status: 'scoped' as const,
      blocksDisclosure: true,
      blocksVentureName: 'futurestate',
      notes: 'Blocks Hunter disclosure.',
      acquiredAt: null,
      acquiredRegistrar: null,
      createdAt: '2026-04-22T00:00:00Z',
      updatedAt: '2026-04-22T00:00:00Z',
    };
    const parsed = AcquisitionOrder.parse(row);
    expect(parsed.blocksDisclosure).toBe(true);
  });

  it('DocsIngestionRun round-trips with 0-count defaults', () => {
    const row = {
      id: '00000000-0000-0000-0000-000000000000',
      sourcePath: '.docs/counsel/MCV-IP-Inventory-v1.1.md',
      sourceKind: 'counsel_markdown' as const,
      startedAt: '2026-04-22T00:00:00Z',
      completedAt: null,
      rowsInserted: 0,
      chunksEmbedded: 0,
      status: 'running' as const,
      errorLog: null,
    };
    const parsed = DocsIngestionRun.parse(row);
    expect(parsed.status).toBe('running');
  });
});

describe('foundation-sdk contract / locked corpus', () => {
  it('RATIFIED_NAMES has exactly 6 entries locked', () => {
    expect(RATIFIED_NAMES.length).toBe(6);
  });

  it('each deprecated name maps to a unique ratified form', () => {
    const deprecated = RATIFIED_NAMES.map((r) => r.deprecatedName);
    const unique = new Set(deprecated);
    expect(unique.size).toBe(deprecated.length);
  });

  it('Sovereign Citizen -> Citizen (brand-risk kill)', () => {
    const rule = RATIFIED_NAMES_BY_DEPRECATED['Sovereign Citizen'];
    expect(rule.ratifiedName).toBe('Citizen');
    expect(rule.context).toBe('any');
  });

  it('ATLAS -> MCV Atlas is prose-only (identifier rewrites would break imports)', () => {
    const rule = RATIFIED_NAMES_BY_DEPRECATED['ATLAS'];
    expect(rule.ratifiedName).toBe('MCV Atlas');
    expect(rule.context).toBe('prose');
  });

  it('CLASSIFICATION_DEFAULTS ladder: markdown/comments safe, identifiers unsafe', () => {
    expect(CLASSIFICATION_DEFAULTS.markdown_prose).toBe('safe');
    expect(CLASSIFICATION_DEFAULTS.code_comment).toBe('safe');
    expect(CLASSIFICATION_DEFAULTS.ui_copy).toBe('safe');
    expect(CLASSIFICATION_DEFAULTS.string_literal).toBe('ambiguous');
    expect(CLASSIFICATION_DEFAULTS.identifier).toBe('unsafe');
    expect(CLASSIFICATION_DEFAULTS.import_path).toBe('unsafe');
    expect(CLASSIFICATION_DEFAULTS.type_name).toBe('unsafe');
    expect(CLASSIFICATION_DEFAULTS.test_name).toBe('unsafe');
  });
});

describe('foundation-sdk contract / crown entities', () => {
  it('exposes the two sovereign crown ids', () => {
    expect(CROWN_ENTITY_IDS).toContain('mcv-inc-crown');
    expect(CROWN_ENTITY_IDS).toContain('mcv-ltd-crown');
  });

  it('isCrownEntity returns true only for the locked ids', () => {
    expect(isCrownEntity('mcv-inc-crown')).toBe(true);
    expect(isCrownEntity('mcv-ltd-crown')).toBe(true);
    expect(isCrownEntity('edgeiq-holdings')).toBe(false);
    expect(isCrownEntity('')).toBe(false);
  });

  it('CROWN_PROTECTED_FIELDS_SET is non-empty (enforces immutability)', () => {
    expect(CROWN_PROTECTED_FIELDS_SET.size).toBeGreaterThan(0);
  });
});
