// scripts/foundation/_lib/csv — zero-dep RFC4180-ish CSV parser.
//
// Handles: quoted fields with embedded commas, escaped double-quotes ("" → "),
// CRLF/LF line endings, trailing newlines. Not a full parser — doesn't do
// streaming or weird quoting edge cases, which is fine for the .docs/counsel
// CSVs (exported from Google Sheets).

export interface CsvRow {
  [column: string]: string;
}

export function parseCsv(source: string): CsvRow[] {
  const records = parseRecords(source);
  if (records.length === 0) return [];
  const [header, ...rest] = records;
  const columns = header.map((c) => c.trim());
  return rest
    .filter((row) => row.length > 0 && !(row.length === 1 && row[0] === ''))
    .map((row) => {
      const out: CsvRow = {};
      for (let i = 0; i < columns.length; i += 1) {
        out[columns[i]] = (row[i] ?? '').trim();
      }
      return out;
    });
}

/**
 * Split the source into records (rows of cells). Each record is `string[]`.
 * Honors double-quote escaping — `"cell with ""quote"", comma"` becomes one cell.
 */
function parseRecords(source: string): string[][] {
  const records: string[][] = [];
  let current: string[] = [];
  let cell = '';
  let inQuotes = false;
  let i = 0;

  while (i < source.length) {
    const ch = source[i];

    if (inQuotes) {
      if (ch === '"') {
        if (source[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      cell += ch;
      i += 1;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === ',') {
      current.push(cell);
      cell = '';
      i += 1;
      continue;
    }
    if (ch === '\r') {
      // Skip; treat CRLF as LF.
      i += 1;
      continue;
    }
    if (ch === '\n') {
      current.push(cell);
      records.push(current);
      current = [];
      cell = '';
      i += 1;
      continue;
    }
    cell += ch;
    i += 1;
  }

  // Flush trailing cell/record.
  if (cell.length > 0 || current.length > 0) {
    current.push(cell);
    records.push(current);
  }
  return records;
}
