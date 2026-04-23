# MCV Domain Portfolio v2 — 6-Tab Workbook Structure

## Import instructions

1. In Google Sheets: File → New → Spreadsheet
2. Name it: "future"
3. For each CSV: File → Import → Upload → Select file → "Insert new sheet(s)"
4. Import in order: T0 → T1 → T2 → T3 → T4 → T5
5. Rename each tab to match the file (strip the `.csv`)

## Tab purposes

| Tab | Function | Key use |
|---|---|---|
| **T0 — Portfolio Master** | Canonical inventory (owned + acquire-pending) | Counsel filings, daily operations |
| **T1 — Entities** | Legal shell registry; maps entities to domains | KYC, counsel correspondence |
| **T2 — Gaps & Urgent** | Red-flagged missing pieces | Acquisition priorities |
| **T3 — Cart Filter** | All 218 cart domains classified ACQUIRE/DEFER/KILL | This-week purchase decisions |
| **T4 — Allocation Summary** | Pivot counts + cost analysis | Investor view, Gary/Joel deck |
| **T5 — Intel & Acquisition** | Offensive research on domains elsewhere | Broker/WHOIS outreach planning |

## Cost summary (from T4)

- Full cart cost (if you bought everything): **C$47,049.93** — DO NOT
- Recommended ACQUIRE only: **C$6,406.22** (83 domains)
- Savings: **C$40,643.71**

## Critical urgency flags (from T2)

🔴 `futurestate.app` / `.io` / `.xyz` — acquire this week, blocks Hunter disclosure
🟠 `naos.ai` / `coretriangle.com` — 30-day window, patent-brand protection

## Formatting (apply after import)

- Freeze row 1 in every tab
- T0: conditional color column B (Class): Core = blue, Platform = green, Venture = yellow, Entity = red, Defensive = gray
- T3: conditional color column F (Decision): ACQUIRE = green, DEFER = yellow, KILL = red
- T2: conditional color column A: 🔴 = red row, 🟠 = orange row, 🟢 = green row
- T4: bold section headers (rows with "═══")

