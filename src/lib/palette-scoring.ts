/**
 * Scoring + recents for the global Command Palette.
 *
 * Score scale (higher = better match):
 *   1000 — exact label match
 *    800 — label starts with query
 *    600 — sublabel starts with query
 *    400 — label contains query as substring
 *    300 — sublabel contains query as substring
 *    200 — fuzzy-abbreviation match against label (e.g. "cmcr" → "Command Center")
 *      0 — no match (filtered out)
 *
 * Recent-items boost: a recently actioned item gets +150 added to its score
 * so it floats up when the same query partially matches multiple items.
 */

export function scoreItem(label: string, sublabel: string | undefined, query: string): number {
  if (!query) return 0;
  const q = query.toLowerCase().trim();
  const l = label.toLowerCase();
  const s = (sublabel || '').toLowerCase();

  if (l === q) return 1000;
  if (l.startsWith(q)) return 800;
  if (s.startsWith(q)) return 600;
  if (l.includes(q)) return 400;
  if (s.includes(q)) return 300;
  if (fuzzyAbbrevMatch(l, q)) return 200;
  return 0;
}

/**
 * Returns true if `query` letters appear in `text` in order (gaps allowed).
 * Useful for typing initials: "cmcr" → "Command Center" or "ti" → "Treasury Index".
 */
export function fuzzyAbbrevMatch(text: string, query: string): boolean {
  if (!query) return false;
  let i = 0;
  for (let j = 0; j < text.length && i < query.length; j++) {
    if (text[j] === query[i]) i++;
  }
  return i === query.length;
}

// ─── Recent items LRU (localStorage) ──────────────────────────

const STORAGE_KEY = 'mcv-palette-recents';
const MAX_RECENTS = 8;

export function getRecentIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch { return []; }
}

export function pushRecentId(id: string): string[] {
  const current = getRecentIds().filter((x) => x !== id);
  const next = [id, ...current].slice(0, MAX_RECENTS);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* quota */ }
  return next;
}

export function clearRecents(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
}
