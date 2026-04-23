// scripts/foundation/parsers/counsel-pack - parses MCV_Counsel_Onboarding_Pack_v2.0.md.
//
// Extracts counsel tasks from the section 5 / 6 / 7 workstream tables (CT-*, IP-*,
// SEC-*), section 4.5 pre-disclosure checklist (→ critical_path flagging), and
// section 8.2 cross-workstream dependencies (→ depends_on).
//
// Also chunks the whole document into storage_chunks for RAG.
//
// Note: Pack 1.3 says "7 IP tasks" but the 6.2 table actually lists IP-1..IP-10 -
// the parser is data-driven, so it emits whatever the tables contain. If counts
// drift, re-ingestion picks up the change.

import { splitSections, extractTables, unbold, type MarkdownSection } from '../_lib/markdown';
import { chunkDocument, type FoundationChunk } from '../_lib/chunking';

const SOURCE_DOC = 'MCV_Counsel_Onboarding_Pack_v2.0.md';

export type Workstream = 'corp_tax' | 'ip' | 'securities';

export interface UpsertCounselTaskInput {
  taskCode: string;
  workstream: Workstream;
  title: string;
  description: string | null;
  deliverable: string | null;
  dependsOn: string[];
  criticalPath: boolean;
  priority: number;
  sourceDoc: string;
  sourceSection: string;
}

export interface ParseCounselPackResult {
  tasks: UpsertCounselTaskInput[];
  chunks: FoundationChunk[];
  warnings: string[];
}

export function parseCounselPack(source: string): ParseCounselPackResult {
  const sections = splitSections(source);
  const tasks: UpsertCounselTaskInput[] = [];
  const chunks: FoundationChunk[] = [];
  const warnings: string[] = [];

  const byCode = new Map<string, UpsertCounselTaskInput>();

  for (const section of sections) {
    const h = section.heading;

    const taskTableMatch = /^(5\.2|6\.2|7\.2)\b/.exec(h);
    if (taskTableMatch) {
      const ws: Workstream =
        taskTableMatch[1].startsWith('5') ? 'corp_tax'
        : taskTableMatch[1].startsWith('6') ? 'ip'
        : 'securities';
      const extracted = parseTaskTable(section, ws);
      for (const t of extracted) {
        tasks.push(t);
        byCode.set(t.taskCode, t);
      }
    }

    if (section.body.trim()) {
      chunks.push(...chunkDocument(section.body, {
        sourceDoc: SOURCE_DOC,
        sourceSection: section.path || h,
      }));
    }
  }

  // Pass 2: 4.5 pre-disclosure checklist -> every task mentioned here is critical_path.
  const preDisclose = sections.find((s) => /^4\.5/.test(s.heading));
  if (preDisclose) {
    const referenced = collectReferencedTaskCodes(preDisclose.body);
    for (const code of referenced) {
      const task = byCode.get(code);
      if (task) task.criticalPath = true;
    }
  }

  // Pass 3: 8.2 cross-workstream dependencies table.
  const deps = sections.find((s) => /^8\.2/.test(s.heading));
  if (deps) {
    applyDependencyHints(deps, byCode);
  }

  if (tasks.length === 0) {
    warnings.push(`[counsel-pack] parsed 0 tasks - check 5.2/6.2/7.2 heading anchors.`);
  }

  return { tasks, chunks, warnings };
}

function parseTaskTable(section: MarkdownSection, workstream: Workstream): UpsertCounselTaskInput[] {
  const tables = extractTables(section.body);
  const rows: UpsertCounselTaskInput[] = [];
  for (const table of tables) {
    const idCol = table.columns.find((c) => /^ID$|^Code$|^Task$|^#$/i.test(c.replace(/\*/g, '').trim())) ?? table.columns[0];
    const titleCol = table.columns.find((c) => /task|item|deliverable|summary|description/i.test(c)) ?? table.columns[1];
    const summaryCol = table.columns.find((c) => /summary|purpose|detail/i.test(c)) ?? titleCol;
    const priorityCol = table.columns.find((c) => /priority/i.test(c));
    const timingCol = table.columns.find((c) => /timing|target|week|when/i.test(c));

    for (const row of table.rows) {
      const code = unbold(row[idCol] ?? '').trim();
      if (!/^(CT|IP|SEC)-\d+$/.test(code)) continue;
      const title = unbold(row[titleCol] ?? '').trim();
      if (!title) continue;
      const deliverable = summaryCol !== titleCol ? (row[summaryCol] || null) : null;
      const priorityText = priorityCol ? row[priorityCol] ?? '' : '';
      const critical = /\bP0\b/.test(priorityText);
      const numericPriority =
        /\bP0\b/.test(priorityText) ? 10 :
        /\bP1\b/.test(priorityText) ? 20 :
        /\bP2\b/.test(priorityText) ? 30 : 100;

      const description = timingCol && row[timingCol]
        ? `Timing: ${row[timingCol]}.`
        : null;

      rows.push({
        taskCode: code,
        workstream,
        title,
        description,
        deliverable,
        dependsOn: [],
        criticalPath: critical,
        priority: numericPriority,
        sourceDoc: SOURCE_DOC,
        sourceSection: section.heading,
      });
    }
  }
  return rows;
}

function collectReferencedTaskCodes(body: string): Set<string> {
  const codes = new Set<string>();
  const re = /\b(CT|IP|SEC)-\d+\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) codes.add(m[0]);
  return codes;
}

function applyDependencyHints(
  depsSection: MarkdownSection,
  byCode: Map<string, UpsertCounselTaskInput>,
): void {
  const tables = extractTables(depsSection.body);
  const codePattern = /\b(CT|IP|SEC)-\d+\b/g;
  for (const table of tables) {
    for (const row of table.rows) {
      const cells = Object.values(row);
      if (cells.length < 2) continue;
      const upstreamMatches = [...cells[0].matchAll(codePattern)];
      const downstreamMatches = [...cells[1].matchAll(codePattern)];
      if (upstreamMatches.length === 0 || downstreamMatches.length === 0) continue;
      const upstream = upstreamMatches[0][0];
      for (const d of downstreamMatches) {
        const downstream = d[0];
        if (downstream === upstream) continue;
        const task = byCode.get(downstream);
        if (task && !task.dependsOn.includes(upstream)) task.dependsOn.push(upstream);
      }
    }
  }
}
