// @mcv/foundation-sdk — MCV Foundation OS v1.
//
// Operationalizes the .docs/counsel corpus (IP Inventory v1.1 + Counsel Pack v2.0 + 6 CSVs)
// as first-class cockpit data:
//
//   - IP portfolio (trademarks, patents, copyrights, trade secrets)
//   - Counsel engagements + task tables (CT-*, IP-*, SEC-*)
//   - Filing records (each emits a CapitalFlow via LedgerAdapter — ip_filing_expense kind)
//   - Domain / mark / asset acquisition orders (with urgency tiers for Blue Marlin gating)
//   - Naming ratifications (6 locked mappings) + reviewable occurrence scan + batch apply/rollback
//   - Docs ingestion pipeline (markdown → structured rows + pgvector RAG chunks)
//
// Design principle: dynamic data over constants. Only the genuinely-locked invariants
// (RATIFIED_NAMES, CROWN_ENTITY_IDS) live as SDK constants. The 75 TM marks, 13 patent
// candidates, 22 counsel tasks, 111 domain rows — all in the DB, all fetched via services.
//
// Subpath exports for surgical imports:
//   @mcv/foundation-sdk/types                 — zod schemas + TS types
//   @mcv/foundation-sdk/corpus                — locked invariants (ratified names, crown ids)
//   @mcv/foundation-sdk/services/ip-portfolio — IP CRUD
//   @mcv/foundation-sdk/services/counsel      — engagements + tasks
//   @mcv/foundation-sdk/services/filings      — filing records + LedgerAdapter bridge
//   @mcv/foundation-sdk/services/acquisition  — domain / mark / asset acquisition queue
//   @mcv/foundation-sdk/services/naming       — naming ratification scan / approve / apply
//   @mcv/foundation-sdk/services/ingestion    — counsel corpus ingestion orchestrator

export * from './types';
export * from './corpus';
