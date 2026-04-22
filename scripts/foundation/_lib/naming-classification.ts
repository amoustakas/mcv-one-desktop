// scripts/foundation/_lib/naming-classification - pure classification helpers
// for the naming-scanner. Factored out so tests can import them without
// triggering the scanner's CLI main() side-effect.

import type { InsertOccurrenceInput } from '@mcv/foundation-sdk/services/naming';

export type OccurrenceKind = InsertOccurrenceInput['occurrenceKind'];

/** Default occurrence_kind by file extension. Absent entries => skip file. */
export const EXT_CLASS: Record<string, OccurrenceKind> = {
  '.md':   'markdown_prose',
  '.mdx':  'markdown_prose',
  '.txt':  'markdown_prose',
  '.html': 'ui_copy',
  '.css':  'ui_copy',
  '.scss': 'ui_copy',
  '.tsx':  'ui_copy',
  '.jsx':  'ui_copy',
  '.ts':   'string_literal',
  '.js':   'string_literal',
  '.mjs':  'string_literal',
  '.cjs':  'string_literal',
  '.json': 'string_literal',
  '.yaml': 'string_literal',
  '.yml':  'string_literal',
};

/**
 * Escape a literal string for safe use in a RegExp. Mirrors MDN's standard
 * escape list so both the scanner and tests share the exact same rules.
 */
export function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Classify a match into identifier-family kinds (unsafe by default). */
export function isIdentifierKind(kind: OccurrenceKind): boolean {
  return kind === 'identifier' || kind === 'import_path'
      || kind === 'type_name' || kind === 'test_name';
}

/**
 * Refine the ext-based default when scanning a code file. Markdown + HTML keep
 * their default. For TS/JS we peek at the line prefix:
 *   • contains `//` or `*`  → code_comment
 *   • preceded by identifier char → identifier
 *   • matches common import/type/class keywords → identifier
 *   • otherwise → keep the ext default (string_literal or ui_copy)
 *
 * This is a heuristic, not an AST. The cockpit board lets operators override
 * per-row, so false positives are conservative (flag as unsafe, not unsafe-apply).
 */
export function refineKindForLine(
  defaultKind: OccurrenceKind,
  contextBefore: string,
  match: string,
): OccurrenceKind {
  if (defaultKind !== 'string_literal' && defaultKind !== 'ui_copy') return defaultKind;
  const linePrefix = contextBefore.split('\n').pop() ?? '';
  if (/\/\//.test(linePrefix) || /\*/.test(linePrefix)) return 'code_comment';
  const charBefore = contextBefore.slice(-1);
  if (/[A-Za-z0-9_]/.test(charBefore)) return 'identifier';
  if (match.length > 1 && /[A-Z]/.test(match[0])) {
    // 32-char tail lets us catch `import { `, `type X = `, `interface `, etc.
    // reliably even when there's an opening brace / whitespace before the match.
    const tail = contextBefore.slice(-32);
    if (/[A-Za-z0-9_]$/.test(tail) || /\b(import|from|type|interface|class|function)\b/.test(tail)) {
      return 'identifier';
    }
  }
  return defaultKind;
}

/**
 * Locate a match offset in a source string — returns 1-indexed line/column
 * plus ±60 char context windows.
 */
export function locateMatch(
  body: string,
  offset: number,
  needle: string,
): {
  line: number;
  column: number;
  contextBefore: string;
  match: string;
  contextAfter: string;
} {
  let line = 1;
  let col = 1;
  for (let i = 0; i < offset; i += 1) {
    if (body[i] === '\n') { line += 1; col = 1; continue; }
    col += 1;
  }
  const contextBefore = body.slice(Math.max(0, offset - 60), offset);
  const match = body.slice(offset, offset + needle.length);
  const contextAfter = body.slice(offset + needle.length, offset + needle.length + 60);
  return { line, column: col, contextBefore, match, contextAfter };
}
