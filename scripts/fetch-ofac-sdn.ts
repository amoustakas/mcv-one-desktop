// scripts/fetch-ofac-sdn.ts
//
// Pulls the US Treasury OFAC SDN list + alt-names feed, parses into
// SdnEntry[], and upserts into ofac_sdn_entries via the Capital API.
//
// Run manually:
//   pnpm tsx scripts/fetch-ofac-sdn.ts
//
// Or wire to a Vercel cron (future PR). Requires CAPITAL_REFRESH_URL
// + CAPITAL_REFRESH_BEARER env vars so the script authenticates as a
// service-role API key — never embed Clerk sessions.
//
// Source format reference:
//   https://www.treasury.gov/ofac/downloads/sdn_comments.txt
//   sdn.csv columns: ent_num, SDN_Name, SDN_Type, Program, Title,
//                    Call_Sign, Vess_type, Tonnage, GRT, Vess_flag,
//                    Vess_owner, Remarks
//   alt.csv columns: ent_num, alt_num, alt_type, alt_name, alt_remarks

import type { SdnEntry } from '../src/lib/capital/adapters/ofac-adapter';

const SDN_URL = process.env.OFAC_SDN_URL || 'https://www.treasury.gov/ofac/downloads/sdn.csv';
const ALT_URL = process.env.OFAC_ALT_URL || 'https://www.treasury.gov/ofac/downloads/alt.csv';
const REFRESH_URL = process.env.CAPITAL_REFRESH_URL || 'http://localhost:3100/api/capital';
const REFRESH_BEARER = process.env.CAPITAL_REFRESH_BEARER;

// OFAC CSVs are not RFC-4180 compliant: fields containing commas are
// quoted with double quotes, and literal double quotes are doubled
// inside. We parse field-by-field rather than string.split(',').
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuote) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; continue; }
      if (ch === '"') { inQuote = false; continue; }
      cur += ch;
    } else {
      if (ch === ',') { out.push(cur); cur = ''; continue; }
      if (ch === '"') { inQuote = true; continue; }
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim()).map((s) => (s === '-0-' ? '' : s));
}

/** Extract DOB from OFAC "Remarks" column — format is usually
 *  "DOB 01 Jan 1970; POB ...". Best-effort; unparseable remarks just
 *  leave DOB null. */
function dobFromRemarks(remarks: string): string | undefined {
  const m = remarks.match(/DOB\s+(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (!m) return undefined;
  const [, d, monthName, y] = m;
  const months: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  };
  const mm = months[monthName.slice(0, 3).toLowerCase()];
  if (!mm) return undefined;
  return `${y}-${mm}-${d.padStart(2, '0')}`;
}

interface SdnRow { ent_num: string; name: string; type: string; program: string; remarks: string }

function parseSdnCsv(csv: string): SdnRow[] {
  const rows: SdnRow[] = [];
  for (const line of csv.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const fields = parseCsvLine(line);
    if (fields.length < 4) continue;
    rows.push({
      ent_num: fields[0],
      name: fields[1],
      type: fields[2],
      program: fields[3],
      remarks: fields[11] ?? '',
    });
  }
  return rows;
}

interface AltRow { ent_num: string; alt_name: string }

function parseAltCsv(csv: string): AltRow[] {
  const rows: AltRow[] = [];
  for (const line of csv.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const fields = parseCsvLine(line);
    if (fields.length < 4) continue;
    rows.push({ ent_num: fields[0], alt_name: fields[3] });
  }
  return rows;
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.text();
}

async function main() {
  console.log('[ofac-fetch] downloading SDN + alt lists…');
  const [sdnCsv, altCsv] = await Promise.all([fetchText(SDN_URL), fetchText(ALT_URL)]);
  const sdnRows = parseSdnCsv(sdnCsv);
  const altRows = parseAltCsv(altCsv);
  console.log(`[ofac-fetch] parsed ${sdnRows.length} SDN rows, ${altRows.length} alt-name rows`);

  // Group aliases by ent_num.
  const aliasByEnt = new Map<string, string[]>();
  for (const a of altRows) {
    if (!a.alt_name) continue;
    const list = aliasByEnt.get(a.ent_num) ?? [];
    list.push(a.alt_name);
    aliasByEnt.set(a.ent_num, list);
  }

  const entries: SdnEntry[] = sdnRows.map((r) => ({
    id: `sdn-${r.ent_num}`,
    primaryName: r.name,
    aliases: aliasByEnt.get(r.ent_num),
    dob: dobFromRemarks(r.remarks),
    list: 'SDN',
    programs: r.program ? r.program.split(/\s*;\s*/).filter(Boolean) : [],
  }));
  console.log(`[ofac-fetch] prepared ${entries.length} SdnEntry records`);

  if (!REFRESH_BEARER) {
    console.warn('[ofac-fetch] CAPITAL_REFRESH_BEARER not set — writing preview to stdout');
    console.log(JSON.stringify(entries.slice(0, 5), null, 2));
    return;
  }

  console.log(`[ofac-fetch] POSTing refresh-ofac-sdn to ${REFRESH_URL}…`);
  const res = await fetch(REFRESH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${REFRESH_BEARER}`,
    },
    body: JSON.stringify({ action: 'refresh-ofac-sdn', entries, source_url: SDN_URL, delete_missing: true }),
  });
  const out = await res.json();
  console.log(`[ofac-fetch] response: ${res.status}`, out);
}

main().catch((err) => {
  console.error('[ofac-fetch] FAILED:', err instanceof Error ? err.message : err);
  process.exit(1);
});
