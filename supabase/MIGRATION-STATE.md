# Supabase Migration State — MCV Desktop (`kovsdngjojzfebrxulyj`)

Live migration inventory as of 2026-04-13. All applied via Supabase MCP.

## Applied (alphabetical)

| Name | Tables | Purpose |
|---|---|---|
| `add_commerce_layer` | 9 | products, orders, order_items, subscriptions, invoices, invoice_line_items, loans, loan_repayments, usage_records |
| `add_commerce_surface` | 19 | cart_sessions, cart_items, customers, customer_addresses, customer_payment_methods, discounts, fulfillments, return_requests, notification_templates, notification_deliveries, inventory_locations, inventory_levels, inventory_movements, digital_fulfillments, reviews, wishlists, wishlist_items, gift_cards, search_analytics |
| `add_compliance_engine` | 8 | fraud_rules, fraud_checks, dunning_configs, dunning_states, tax_jurisdictions (14 seeded), tax_nexus_tracking, nexus_alerts, price_localization_configs |
| `add_creator_economy` | 5 | royalty_agreements, royalty_splits, royalty_distributions, escrow_agreements, escrow_milestones |
| `add_financials_engine` | 4 | revenue_schedules, revenue_entries, cost_snapshots, financial_report_cache |
| `add_ledger_and_credits` | 7 | ledger_accounts, journal_entries, journal_entry_lines, credit_accounts, credit_grants, credit_consumptions, credit_transfers |
| `add_naos_living_civilization` | 8 | naos_agents, naos_personality, naos_venture_overrides, naos_emotional_state, naos_relationships, naos_predictions, naos_interactions, naos_culture_snapshot |
| `add_payment_router` | 5 | venture_payment_configs, payment_intents, payment_records, routing_decisions, transaction_records |
| `add_pgvector_rag_chunks` | 1 | storage_chunks (vector(768)), match_chunks() RPC, v_corpus_stats view |
| `add_project_memory` | 1 | project_memory |
| `add_storage_system` | 8 | storage_files, storage_compartments, storage_versions, storage_ai_analysis, storage_signals, storage_generations, storage_audit_log, storage_rag_corpora |
| `harden_rag_functions_and_view` | — | security_invoker on v_corpus_stats + pinned search_path |
| `naos C-Suite seed` | — | 12 agents (Aegis, Athena, Daedalus, Helios, Hermes, Atlas, Minerva, Vulcan, Forge, Muse, Sentry, Scribe) |
| `user_kits_drop_kit_fk` | — | dropped FK so user prefs survive kit catalog changes |

## Extensions

- `vector` 0.8.0 (pgvector)
- `uuid-ossp` 1.1

## RLS policy

All `public.*` tables have `USING (true) WITH CHECK (true)` permissive policies. Access gating happens at the API layer via `requireAuth()` + service-role client. Tighten to venture/user filters once Clerk JWT bridge is exercised broadly.

## Total surface

**115 tables + 3 views** across public schema. ~82 were added during 2026-04-13's session — prior state had ~33 tables and 7 entire subsystems (NAOS, Commerce, Financials, Payments, Creator, Compliance) were dead (API queries against non-existent tables).

## Additional migrations applied same session

| Name | Purpose |
|---|---|
| `user_kits_drop_kit_fk` | Kit preferences live independent of catalog |
| `add_remaining_surface_tables` | 16 referenced-but-missing tables: api_keys, discount_usage, fulfillment_items, gift_card_transactions, google_api_telemetry, notification_queue, product_ratings, return_items, saved_payment_methods, screen_registry, split_payments, split_payment_items, subscription_plans, transactions, webhook_endpoints, webhook_deliveries |
| NAOS seed expansion | 14 relationship edges, 11 interaction history rows, 1 culture snapshot |
| Commerce seed spread | All 7 ventures have products + founding customer; mcv has full orders/invoices/payment_intent/transaction flow |
| Realtime publication | Expanded from 12 -> 37 tables (NAOS agent state, storage chunks, orders, invoices, payments, fraud checks, nexus alerts, etc.) |

## Zero-code auth wiring

`src/lib/supabase.ts` uses supabase-js `accessToken` callback so every existing browser query transparently attaches the Clerk JWT. No call sites changed; all 9 consumer files (AegisChat, NotificationCenter, OpsPanel, StatusBar, use-presence, use-realtime, chat store, SessionsView, VentureProfile) are now RLS-aware without refactor.

See individual `supabase/migration-*.sql` files in this repo for reference schemas. Live schemas applied may differ slightly (permissive RLS, `IF NOT EXISTS` guards, pinned `search_path` on functions).

## Applied 2026-04-17 (marathon follow-up)

| Name | File | Purpose |
| --- | --- | --- |
| `persona_voices_real_ids_and_onboarding_agents` | `migration-persona-voices-real-ids.sql` | Replaced placeholder voice aliases (`josh`, `rachel`) with real ElevenLabs voice IDs (verified vs `/v1/voices`) for all 12 NAOS codenames, plus inserted 12 new rows for the onboarding agent handles (`ada`, `amara`, `dieter`, `hannah`, `hedy`, `justice`, `leo`, `linus`, `nico`, `satoshi`, `sterling`, `warren`). Unblocks voice playback via `/api/tts` (wizard) and `/api/voice-tts` (Desktop). |
| `seed_demo_capital_rounds_v3` | `seed-demo-rounds.sql` | Four live rounds for the D2 round-browse demo: 3 Futurestate (Seed II, Ocean Drive LP, Starter Tranche) + 1 BetEdge (Token Pre-Sale). Mix of accredited-only + retail. Idempotent via `WHERE NOT EXISTS (slug)`. |
| `rename_contacts_to_crm_contacts_with_compat_view` | `migration-rename-contacts-to-crm-contacts.sql` | Wave-5D final resolution (PR #40): `ALTER TABLE contacts RENAME TO crm_contacts` + add `full_name` (GENERATED from `name`) and `country` columns + `CREATE VIEW contacts AS SELECT * FROM crm_contacts` for backward compat. FKs, RLS, and realtime publication carried over automatically. Post-apply verification: `contacts` is now VIEW, `crm_contacts` is BASE TABLE, 3 FKs preserved (activities, deals, signing_envelope_signers), full_name mirrors name on every row. CRM + Capital surfaces both smoke-tested green. |

## Pending application 2026-04-22 (Foundation OS v1 marathon)

| Name | File | Purpose |
| --- | --- | --- |
| `foundation_os_v1` | `migration-foundation-os-v1-2026-04-22.sql` | Operationalizes the `.docs/counsel` corpus (IP Inventory v1.1 + Counsel Pack v2.0 + 6 T0-T6 CSVs) as first-class rows. 9 new tables (`ip_marks`, `counsel_engagements`, `counsel_tasks`, `filing_records`, `acquisition_orders`, `naming_ratifications`, `naming_occurrences`, `naming_batches`, `docs_ingestion_runs`) + 21 new enum types + RLS (admin-only except `naming_ratifications` which is authenticated-read) + `updated_at` triggers + inline seed of the 6 locked naming ratifications (Sovereign Citizen→Citizen, Covenant→Root, Confluence→Weave, Whole→Chorus, Unhoused→Unsworn, ATLAS→MCV Atlas). Expected post-ingestion counts: ~108 `ip_marks` (75 TM + 13 patent + 20 copyright), 22 `counsel_tasks` (9 CT + 7 IP + 6 SEC), 3 `counsel_engagements`, 5 🔴🟠 `acquisition_orders`, 6 `naming_ratifications`. Apply via Supabase MCP in Phase 2 Step 10 of the marathon. |
