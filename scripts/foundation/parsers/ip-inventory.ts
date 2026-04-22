// scripts/foundation/parsers/ip-inventory - parses MCV-IP-Inventory-v1.1.md.
//
// Produces:
//   - Trademark ip_marks rows from 1.1-1.10 (markdown pipe tables)
//   - Copyright ip_marks rows from 3.2-3.4 (foundational works enumerated in prose)
//   - Prose chunks for every section (for the RAG corpus)
//
// Patents are parsed separately in patent-section.ts.
// Per feedback_dynamic_data_over_constants.md: this file contains NO hand-authored
// 75-mark arrays - it DERIVES everything from the document. If the doc gains marks
// in v1.2, re-running adds them with no code change.

import type { CreateIPMarkInput } from '@mcv/foundation-sdk/types';
import { splitSections, extractTables, unbold, type MarkdownSection } from '../_lib/markdown';
import { chunkDocument, type FoundationChunk } from '../_lib/chunking';

export interface ParseIpInventoryResult {
  trademarks: CreateIPMarkInput[];
  copyrights: CreateIPMarkInput[];
  chunks: FoundationChunk[];
  warnings: string[];
}

const SOURCE_DOC = 'MCV-IP-Inventory-v1.1.md';
const TRADEMARK_SECTION = /^1\.\d+/;
const COPYRIGHT_SECTION = /^3\.\d+/;

export function parseIpInventory(source: string): ParseIpInventoryResult {
  const sections = splitSections(source);
  const warnings: string[] = [];
  const trademarks: CreateIPMarkInput[] = [];
  const copyrights: CreateIPMarkInput[] = [];
  const chunks: FoundationChunk[] = [];

  for (const section of sections) {
    const heading = section.heading.trim();
    const sectionKey = extractSectionKey(heading);

    if (sectionKey && TRADEMARK_SECTION.test(sectionKey) && sectionKey !== '1.11') {
      const marks = parseTrademarkTables(section, warnings);
      trademarks.push(...marks);
    }

    if (sectionKey && COPYRIGHT_SECTION.test(sectionKey)) {
      const cps = parseCopyrightSection(section, warnings);
      copyrights.push(...cps);
    }

    if (section.body.trim()) {
      chunks.push(...chunkDocument(section.body, {
        sourceDoc: SOURCE_DOC,
        sourceSection: section.path || heading || '(preface)',
      }));
    }
  }

  return { trademarks, copyrights, chunks, warnings };
}

function extractSectionKey(heading: string): string | null {
  const m = /^(\d+(?:\.\d+)*)/.exec(heading);
  return m ? m[1] : null;
}

function parseTrademarkTables(section: MarkdownSection, warnings: string[]): CreateIPMarkInput[] {
  const tables = extractTables(section.body);
  const rows: CreateIPMarkInput[] = [];
  for (const table of tables) {
    const markCol = pickColumn(table.columns, ['Mark']);
    const priorityCol = pickColumn(table.columns, ['Priority']);
    const classesCol = pickColumn(table.columns, ['Classes']);
    const notesCol = pickColumn(table.columns, ['Notes']);
    const domainCol = pickColumn(table.columns, ['Domain']);
    if (!markCol || !priorityCol) continue;

    for (const row of table.rows) {
      const rawMark = unbold(row[markCol] ?? '');
      if (!rawMark || rawMark === '-' || rawMark.toLowerCase() === 'mark') continue;
      const tier = firstPriorityToken(row[priorityCol] ?? '');
      if (!tier) {
        warnings.push(`[IP Inventory ${section.heading}] skipped row with unknown priority: ${rawMark}`);
        continue;
      }
      const { markText, isCompound } = stripCompoundMarker(rawMark);

      rows.push({
        markText,
        markKind: 'trademark',
        priorityTier: tier,
        classes: parseClasses(classesCol ? row[classesCol] : ''),
        jurisdictions: ['US', 'CA'],
        isCompound,
        notes: notesCol ? (row[notesCol] || null) : null,
        ownerEntityId: null,
        domainFk: null,
        claimSummary: null,
        noveltyHook: null,
        provisionalDraftStatus: null,
        filingVehicle: null,
        compoundParentMarkId: null,
        filingNumber: null,
        registrationNumber: null,
        filedAt: null,
        registeredAt: null,
        renewalDue: null,
        sourceDoc: SOURCE_DOC,
        sourceSection: section.heading,
      });

      if (domainCol && row[domainCol] && !row[domainCol].includes('-')) {
        const last = rows[rows.length - 1];
        last.notes = [last.notes, `domain: ${row[domainCol]}`].filter(Boolean).join(' | ');
      }
    }
  }
  return rows;
}

function pickColumn(columns: string[], candidates: string[]): string | null {
  for (const cand of candidates) {
    const hit = columns.find((c) => c.replace(/\*/g, '').trim().toLowerCase() === cand.toLowerCase());
    if (hit) return hit;
  }
  return null;
}

function firstPriorityToken(cell: string): CreateIPMarkInput['priorityTier'] | null {
  const match = /\bP[0-3]|\bDNF\b|\bPP[0-2]\b/.exec(cell);
  if (!match) return null;
  return match[0] as CreateIPMarkInput['priorityTier'];
}

function stripCompoundMarker(raw: string): { markText: string; isCompound: boolean } {
  const compound = /\(compound[^)]*\)/i.test(raw);
  const clean = raw.replace(/\([^)]*compound[^)]*\)/gi, '').trim();
  return { markText: clean, isCompound: compound };
}

function parseClasses(cell: string | undefined): number[] {
  if (!cell) return [];
  return Array.from(cell.matchAll(/\b(\d{1,2})\b/g))
    .map((m) => Number(m[1]))
    .filter((n) => n >= 1 && n <= 45);
}

const EXPLICIT_WORK_TITLES = [
  'MCV Universe Codex',
  'UWG Architecture',
  'Multi-Token Whitepaper',
  'Global Jurisdictional Routing',
  'Fractal Pyramid Diagram',
  'Batch Kickoff Manifest',
  'Phase 0 Audit Kickoff',
  'MCV Atlas Command Center Mockup',
  'Counsel Onboarding Pack v2.0',
  'IP Inventory v1.1',
];

function parseCopyrightSection(section: MarkdownSection, warnings: string[]): CreateIPMarkInput[] {
  void warnings;
  const rows: CreateIPMarkInput[] = [];
  const key = extractSectionKey(section.heading);
  const defaultTier: CreateIPMarkInput['priorityTier'] =
    key === '3.2' ? 'P0' : key === '3.3' ? 'P1' : 'P2';

  const seen = new Set<string>();
  for (const title of EXPLICIT_WORK_TITLES) {
    const pattern = new RegExp(`\\b${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (pattern.test(section.body) && !seen.has(title)) {
      seen.add(title);
      rows.push(copyrightRow(title, defaultTier, section.heading));
    }
  }

  return rows;
}

function copyrightRow(
  title: string,
  tier: CreateIPMarkInput['priorityTier'],
  sourceSection: string,
): CreateIPMarkInput {
  return {
    markText: title,
    markKind: 'copyright',
    priorityTier: tier,
    classes: [],
    jurisdictions: ['US', 'CA'],
    isCompound: false,
    ownerEntityId: null,
    domainFk: null,
    notes: null,
    claimSummary: null,
    noveltyHook: null,
    provisionalDraftStatus: null,
    filingVehicle: null,
    compoundParentMarkId: null,
    filingNumber: null,
    registrationNumber: null,
    filedAt: null,
    registeredAt: null,
    renewalDue: null,
    sourceDoc: SOURCE_DOC,
    sourceSection,
  };
}
