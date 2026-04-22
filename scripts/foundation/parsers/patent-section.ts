// scripts/foundation/parsers/patent-section - parses section 2 of MCV-IP-Inventory-v1.1.md.
//
// Section 2 contains three bullet lists - 2.1 (PP0-A/B/C), 2.2 (PP1-A..F),
// 2.3 (PP2-A..D). Each bullet reads:
//   - **PP0-A: Universal Wealth Grant Mechanism** - combination of biometric-triangle...
// or multi-sentence for PP1-E / PP1-F / PP2-D entries (those explicitly call out
// "Novelty hook:" / "Supporting artifacts:" labels).
//
// Output: CreateIPMarkInput[] with markKind='patent' and the patent-extension fields
// (claimSummary, noveltyHook, supportingArtifacts) populated where the doc provides them.

import type { CreateIPMarkInput } from '@mcv/foundation-sdk/types';
import { splitSections, type MarkdownSection } from '../_lib/markdown';

const SOURCE_DOC = 'MCV-IP-Inventory-v1.1.md';
// The IP Inventory v1.1 uses two bullet formats interchangeably:
//   - **PP0-A: Title** — prose
//   - **PP1-E: Title.** Prose     (no em-dash after bold)
// Both feed into the same row; the trailing prose is captured in group 3.
const BULLET_LINE_RE = /^-\s+\*\*(PP[012]-[A-Z]):\s+([^*]+?)\*\*\s*(?:[-—]\s*)?(.*)$/;

export interface ParsePatentsResult {
  patents: CreateIPMarkInput[];
  warnings: string[];
}

export function parsePatents(source: string): ParsePatentsResult {
  const sections = splitSections(source);
  const patents: CreateIPMarkInput[] = [];
  const warnings: string[] = [];

  for (const section of sections) {
    const tierMatch = /^2\.(\d+)/.exec(section.heading);
    if (!tierMatch) continue;
    const subIdx = Number(tierMatch[1]);
    if (subIdx < 1 || subIdx > 3) continue;
    const tier: CreateIPMarkInput['priorityTier'] =
      subIdx === 1 ? 'PP0' : subIdx === 2 ? 'PP1' : 'PP2';

    patents.push(...parseBullets(section, tier, warnings));
  }

  return { patents, warnings };
}

function parseBullets(
  section: MarkdownSection,
  tier: CreateIPMarkInput['priorityTier'],
  warnings: string[],
): CreateIPMarkInput[] {
  const lines = section.body.split('\n');
  const rows: CreateIPMarkInput[] = [];
  let current: { code: string; title: string; lines: string[] } | null = null;

  const flush = () => {
    if (!current) return;
    const fullBody = current.lines.join('\n').trim();
    const claim = extractFirstSentence(fullBody);
    const noveltyHook = extractLabeledField(fullBody, ['Novelty hook', 'Novelty claim', 'Novelty'])
      ?? null;
    const artifacts = extractLabeledField(fullBody, ['Supporting artifacts', 'Supporting artifact', 'Artifacts']);

    rows.push({
      markText: `${current.code}: ${current.title}`.trim(),
      markKind: 'patent',
      priorityTier: tier,
      classes: [],
      jurisdictions: ['US'],
      isCompound: false,
      ownerEntityId: null,
      domainFk: null,
      notes: null,
      claimSummary: claim ?? (fullBody.slice(0, 500) || null),
      noveltyHook,
      supportingArtifacts: artifacts ? splitArtifacts(artifacts) : [],
      provisionalDraftStatus: 'unscoped',
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
    current = null;
  };

  for (const line of lines) {
    const m = BULLET_LINE_RE.exec(line);
    if (m) {
      flush();
      const code = m[1];
      const title = m[2].trim();
      current = { code, title, lines: [] };
      if (m[3]) current.lines.push(m[3]);
      continue;
    }
    if (current) {
      if (/^---+\s*$/.test(line)) {
        flush();
        continue;
      }
      current.lines.push(line);
    }
  }
  flush();

  if (rows.length === 0) {
    warnings.push(`[patent-section ${section.heading}] emitted 0 patents - check PP* bullet format.`);
  }
  return rows;
}

function extractFirstSentence(body: string): string | null {
  const trimmed = body.trim();
  if (!trimmed) return null;
  const m = /^(.+?[.!?])(?:\s|$)/s.exec(trimmed);
  return m ? m[1].trim() : trimmed.slice(0, 300);
}

function extractLabeledField(body: string, labels: string[]): string | null {
  for (const label of labels) {
    const re = new RegExp(
      `${escapeRegex(label)}\\s*:\\s*([\\s\\S]*?)(?=\\n\\s*(?:[A-Z][a-z]+(?:\\s[A-Z][a-z]+)*\\s*:|$)|\\.(?:\\s+[A-Z]|$))`,
      'i',
    );
    const m = re.exec(body);
    if (m && m[1].trim()) return collapseWhitespace(m[1].trim());
  }
  return null;
}

function splitArtifacts(field: string): string[] {
  return field
    .split(/[;,]/)
    .map((a) => a.replace(/^[\s\-—•]+|[\s;,.]+$/g, '').trim())
    .filter((a) => a.length > 0);
}

function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
