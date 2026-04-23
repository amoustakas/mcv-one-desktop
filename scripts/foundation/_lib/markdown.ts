// scripts/foundation/_lib/markdown — tiny markdown helpers for section-aware parsing.
//
// The corpus files share a consistent shape (GitHub-flavored markdown with
// pipe tables) so we don't need a full markdown AST — just section-chunking
// and pipe-table parsing. If the files grow more complex, swap in `marked`
// or `remark`; for now these two functions cover every parser we ship.

export interface MarkdownSection {
  /** Heading level (number of #). 0 = preface before any heading. */
  level: number;
  /** Heading text without the leading `#`s (trimmed). Empty string for the preface. */
  heading: string;
  /** Full body including newlines; does NOT include the heading line itself. */
  body: string;
  /** Dotted hierarchy path built from parent headings, e.g. "1.1 Corporate Marks". */
  path: string;
}

/**
 * Walk the document and emit one section per heading. The preface (before the first
 * heading) is emitted as `{ level: 0, heading: '', path: '' }`.
 */
export function splitSections(markdown: string): MarkdownSection[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const sections: MarkdownSection[] = [];
  const pathStack: Array<{ level: number; heading: string }> = [];
  let current: MarkdownSection | null = null;
  const flush = () => {
    if (current) {
      current.body = current.body.replace(/\n+$/, '');
      sections.push(current);
    }
  };

  for (const line of lines) {
    const headingMatch = /^(#{1,6})\s+(.*)$/.exec(line);
    if (headingMatch) {
      flush();
      const level = headingMatch[1].length;
      const heading = headingMatch[2].trim();
      while (pathStack.length && pathStack[pathStack.length - 1].level >= level) pathStack.pop();
      pathStack.push({ level, heading });
      const path = pathStack.map((p) => p.heading).join(' > ');
      current = { level, heading, body: '', path };
      continue;
    }
    if (!current) {
      current = { level: 0, heading: '', body: '', path: '' };
    }
    current.body += `${line}\n`;
  }
  flush();
  return sections;
}

export interface MarkdownTable {
  columns: string[];
  rows: Array<Record<string, string>>;
}

/**
 * Extract every pipe table in the body. Returns one table per contiguous run of
 * pipe-lines separated by the `|---|---|` divider. Cells are stripped of leading/
 * trailing pipes and whitespace; `**bold**` wrappers are preserved (caller decides).
 */
export function extractTables(body: string): MarkdownTable[] {
  const lines = body.split('\n');
  const tables: MarkdownTable[] = [];
  let i = 0;
  while (i < lines.length) {
    if (!isPipeRow(lines[i])) {
      i += 1;
      continue;
    }
    const headerRow = lines[i];
    const divider = lines[i + 1];
    if (!divider || !isDividerRow(divider)) {
      i += 1;
      continue;
    }
    const columns = splitPipeRow(headerRow);
    const rows: Array<Record<string, string>> = [];
    let j = i + 2;
    while (j < lines.length && isPipeRow(lines[j])) {
      const cells = splitPipeRow(lines[j]);
      const row: Record<string, string> = {};
      for (let k = 0; k < columns.length; k += 1) {
        row[columns[k]] = (cells[k] ?? '').trim();
      }
      rows.push(row);
      j += 1;
    }
    tables.push({ columns, rows });
    i = j;
  }
  return tables;
}

function isPipeRow(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.length > 2;
}

function isDividerRow(line: string): boolean {
  return /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/.test(line);
}

function splitPipeRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return trimmed.split('|').map((c) => c.trim());
}

/** Strip **bold** wrappers for values coming out of markdown tables. */
export function unbold(text: string): string {
  return text.replace(/^\*\*([\s\S]+?)\*\*$/, '$1').trim();
}
