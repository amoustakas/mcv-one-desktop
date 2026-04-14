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

99 tables across public schema. ~52 were added during 2026-04-13's session — prior state had ~33 tables and 7 entire subsystems (NAOS, Commerce, Financials, Payments, Creator, Compliance) were dead (API queries against non-existent tables).

See individual `supabase/migration-*.sql` files in this repo for reference schemas. Live schemas applied may differ slightly (permissive RLS, `IF NOT EXISTS` guards, pinned `search_path` on functions).
