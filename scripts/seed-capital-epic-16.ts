/**
 * Epic 16 — Ecosystem Integration Bus.
 * Bridges Capital to Ledger, Payments, Ventures, Notifications (Fabric),
 * and any future MCV system via optional adapter injection.
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
const c = createClient(url, key);

async function main() {
  const tag = 'capital:ep16';
  const { data: existing } = await c.from('epics').select('id, title').contains('tags', [tag]).maybeSingle();
  if (existing) { console.log(`[skip] ${existing.title}`); return; }

  const { data: epic, error } = await c.from('epics').insert({
    title: 'Capital × Ecosystem Bus — Ledger, Payments, Ventures, Notifications wiring',
    summary:
      'Capital composes with every MCV domain via optional adapter injection. capital_distributions primitive + ledger adapter + payment router + notifications + ventures bridge — all available when passed to createCapitalEngine, all degrade gracefully when absent.',
    spec_md: 'See docs/capital/ECOSYSTEM.md — the unified integration map + composition rules. Everything is additive; no hard cross-SDK imports.',
    venture_id: 'mcv',
    suite: 'capital',
    status: 'in-progress',
    priority: 'critical',
    priority_order: 55,
    tags: [tag, 'capital', 'ecosystem', 'integration', 'distributions'],
    linked_docs: ['docs/capital/ECOSYSTEM.md', 'docs/capital/PROTOCOL.md'],
  }).select().single();

  if (error || !epic) throw error;
  console.log('[ok epic]', epic.title);

  const stories = [
    { title: 'Migration: capital_distributions + capital_distribution_recipients + triggers + FK capital_rounds→ventures', status: 'done' },
    { title: 'capital-sdk: DistributionsService with optional LedgerAdapter + PaymentRouter injection', status: 'done' },
    { title: 'capital-sdk: NotificationsBridge (writes to notifications table with source=capital)', status: 'done' },
    { title: 'capital-sdk: VenturesBridge (getVenture, listVentures, isVentureClerkOrg)', status: 'done' },
    { title: 'capital-sdk: payment-router singleton pattern (setCapitalPaymentRouter / getCapitalPaymentRouter)', status: 'done' },
    { title: 'createCapitalEngine accepts optional ledger + paymentRouter; adapters propagate to distributions', status: 'done' },
    { title: 'api/_handlers/capital.ts: publishCapitalEvent on create-round, update-round-status, record-payment', status: 'done' },
    { title: 'api/_handlers/capital.ts: 6 distribution actions (list/get/create/process/cancel) + 2 venture actions', status: 'done' },
    { title: 'capital-kit: 4 new NAOS tools — create_distribution, process_distribution, list_distributions, notify_investors (19 total)', status: 'done' },
    { title: 'apps/launchpad: per-round venture brand tokens applied via --venture-primary/accent CSS vars', status: 'done' },
    { title: 'Tests: DistributionsService ledger/payment/partial paths + NotificationsBridge + VenturesBridge (11 new tests, 37 total)', status: 'done' },
    { title: 'Wire real @mcv/ledger-sdk adapter at app startup (pass into createCapitalEngine from src/lib/capital.ts)', status: 'todo' },
    { title: 'Wire real @mcv/payments-sdk router at app startup (setCapitalPaymentRouter)', status: 'todo' },
    { title: 'Desktop: DistributionsPanel component in CapitalRoundDetailView — inline create + process', status: 'todo' },
    { title: 'Desktop: per-round venture branding on CapitalRoundDetailView (apply brand tokens on mount)', status: 'todo' },
    { title: 'Notification delivery dispatcher — read channels JSON + route to slack/email/etc via existing kits', status: 'todo' },
    { title: 'Fabric pub-sub wiring: Capital events publish to Fabric topic + investor portal subscribes', status: 'todo' },
    { title: 'Tax reporting export: 1099-DIV (US) + T5 (CA) CSV export from distributions + recipients', status: 'todo' },
    { title: 'Stripe + Solana processor registration at app startup + payment-method → processor routing table', status: 'todo' },
    { title: 'Cron: promote scheduled_for distributions to processing when scheduled_for <= now', status: 'todo' },
  ];

  const now = new Date().toISOString();
  const rows = stories.map((s, i) => ({
    epic_id: epic.id,
    title: s.title,
    priority_order: (i + 1) * 10,
    status: s.status,
    completed_at: s.status === 'done' ? now : null,
  }));
  const { data: inserted } = await c.from('stories').insert(rows).select('id, status');
  const doneCount = inserted?.filter((r) => r.status === 'done').length ?? 0;
  console.log(`[ok ${inserted?.length} stories - ${doneCount} done]`);
}

main().catch((e) => { console.error(e); process.exit(1); });
