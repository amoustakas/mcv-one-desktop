// Unit tests for the naming-scanner's pure classification helpers.
// The scanner itself is Node-only (fs + git) so it can't be fully exercised
// here, but the classification logic is pure and locks the most error-prone
// heuristics: what counts as an identifier vs a prose match.

import { describe, it, expect } from 'vitest';

import {
  EXT_CLASS,
  escapeRegex,
  isIdentifierKind,
  locateMatch,
  refineKindForLine,
} from '../_lib/naming-classification';

describe('EXT_CLASS extension map', () => {
  it('markdown defaults to markdown_prose', () => {
    expect(EXT_CLASS['.md']).toBe('markdown_prose');
    expect(EXT_CLASS['.mdx']).toBe('markdown_prose');
  });

  it('TS/JS defaults to string_literal (operator refines up to identifier)', () => {
    expect(EXT_CLASS['.ts']).toBe('string_literal');
    expect(EXT_CLASS['.js']).toBe('string_literal');
  });

  it('TSX/HTML/CSS defaults to ui_copy', () => {
    expect(EXT_CLASS['.tsx']).toBe('ui_copy');
    expect(EXT_CLASS['.html']).toBe('ui_copy');
    expect(EXT_CLASS['.css']).toBe('ui_copy');
  });

  it('skips unknown extensions (no entry)', () => {
    expect(EXT_CLASS['.py']).toBeUndefined();
    expect(EXT_CLASS['.rs']).toBeUndefined();
    expect(EXT_CLASS['.go']).toBeUndefined();
  });
});

describe('escapeRegex', () => {
  it('escapes regex metacharacters', () => {
    expect(escapeRegex('a.b')).toBe('a\\.b');
    expect(escapeRegex('foo(bar)')).toBe('foo\\(bar\\)');
    expect(escapeRegex('[x]')).toBe('\\[x\\]');
    expect(escapeRegex('a|b')).toBe('a\\|b');
  });

  it('leaves plain text untouched', () => {
    expect(escapeRegex('Sovereign Citizen')).toBe('Sovereign Citizen');
  });
});

describe('isIdentifierKind', () => {
  it('flags identifier-family kinds as unsafe-path', () => {
    expect(isIdentifierKind('identifier')).toBe(true);
    expect(isIdentifierKind('import_path')).toBe(true);
    expect(isIdentifierKind('type_name')).toBe(true);
    expect(isIdentifierKind('test_name')).toBe(true);
  });

  it('does NOT flag prose/comment/ui kinds', () => {
    expect(isIdentifierKind('markdown_prose')).toBe(false);
    expect(isIdentifierKind('code_comment')).toBe(false);
    expect(isIdentifierKind('ui_copy')).toBe(false);
    expect(isIdentifierKind('string_literal')).toBe(false);
  });
});

describe('locateMatch', () => {
  it('returns 1-indexed line + column', () => {
    const body = 'line one\nSovereign Citizen shows up here\nline three';
    const offset = body.indexOf('Sovereign');
    const loc = locateMatch(body, offset, 'Sovereign Citizen');
    expect(loc.line).toBe(2);
    expect(loc.column).toBe(1);
    expect(loc.match).toBe('Sovereign Citizen');
  });

  it('caps context windows at 60 chars', () => {
    const body = 'x'.repeat(200) + 'Covenant' + 'y'.repeat(200);
    const offset = 200;
    const loc = locateMatch(body, offset, 'Covenant');
    expect(loc.contextBefore.length).toBe(60);
    expect(loc.contextAfter.length).toBe(60);
  });
});

describe('refineKindForLine', () => {
  it('keeps markdown_prose as-is (no refinement for markdown)', () => {
    const kind = refineKindForLine('markdown_prose', 'The ', 'Covenant');
    expect(kind).toBe('markdown_prose');
  });

  it('keeps code_comment as-is (already refined)', () => {
    const kind = refineKindForLine('code_comment', '// ', 'Covenant');
    expect(kind).toBe('code_comment');
  });

  it('detects single-line comment in TS code', () => {
    const kind = refineKindForLine('string_literal', '// note: use ', 'Covenant');
    expect(kind).toBe('code_comment');
  });

  it('detects block comment context', () => {
    const kind = refineKindForLine('string_literal', ' * description of ', 'Covenant');
    expect(kind).toBe('code_comment');
  });

  it('flags as identifier when preceded by identifier char', () => {
    const kind = refineKindForLine('string_literal', 'class My', 'Covenant');
    expect(kind).toBe('identifier');
  });

  it('flags as identifier for Capital* words after TS keywords', () => {
    const kind = refineKindForLine('string_literal', 'import { ', 'Covenant');
    // "import { " ends with space, so charBefore check fails; then capital-letter path
    // inspects tail "import { " and matches /import|from/ → identifier.
    expect(kind).toBe('identifier');
  });

  it('falls back to the default kind for plain string content', () => {
    const kind = refineKindForLine('string_literal', 'const label = "', 'Covenant');
    // Preceded by `"` (not identifier char, no comment marker, not after TS keyword directly)
    expect(kind).toBe('string_literal');
  });

  it('keeps ui_copy for plain TSX text content', () => {
    const kind = refineKindForLine('ui_copy', '<h1>Welcome to ', 'Covenant');
    expect(kind).toBe('ui_copy');
  });
});
