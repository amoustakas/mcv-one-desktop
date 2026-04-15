/**
 * Epic 15 — Content OS Integration.
 * Ties Capital artifacts (round descriptions, investor updates, term sheets,
 * commitment receipts) to the existing Content OS primitive.
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
const c = createClient(url, key);

async function main() {
  const tag = 'capital:ep15';
  const { data: existing } = await c.from('epics').select('id, title').contains('tags', [tag]).maybeSingle();
  if (existing) { console.log(`[skip] ${existing.title}`); return; }

  const { data: epic, error } = await c.from('epics').insert({
    title: 'Capital × Content OS — unified doc primitive for rounds, updates, receipts, legal',
    summary:
      'Bridge Capital artifacts (round descriptions, investor updates, term sheets, commitment receipts) to the Content OS primitive for versioning, scheduled publish, RAG indexing, and Launchpad rendering. Capital becomes a Content consumer, not a parallel doc system.',
    spec_md: 'See docs/capital/CONTENT_INTEGRATION.md. Additive migration applied 2026-04-15 (capital_documents.content_id, capital_round_content, capital_commitments.receipt_content_id). capital-sdk ContentIntegrationService + 3 new capital-kit tools + InvestorUpdatesPanel in CapitalRoundDetailView + Launchpad round page renders long-form description + public updates timeline. 5 new tests passing.',
    venture_id: 'mcv',
    suite: 'capital',
    status: 'in-progress',
    priority: 'high',
    priority_order: 25,
    tags: [tag, 'capital', 'content-os', 'integration'],
    linked_docs: ['docs/capital/CONTENT_INTEGRATION.md', 'docs/capital/PROTOCOL.md'],
  }).select().single();

  if (error || !epic) throw error;
  console.log('[ok epic]', epic.title);

  const stories = [
    { title: 'Migration: capital_documents.content_id + capital_round_content junction + capital_commitments.receipt_content_id', status: 'done' },
    { title: 'capital-sdk: ContentIntegrationService (create/list/attach/detach/publish)', status: 'done' },
    { title: 'api/_handlers/capital.ts: 6 new actions for content integration', status: 'done' },
    { title: 'capital-kit: publish_investor_update, get_round_updates, draft_round_description tools', status: 'done' },
    { title: 'React Query hooks: useRoundContent, useRoundDescription, useRoundUpdates, useCreateRoundContent, usePublishRoundUpdate', status: 'done' },
    { title: 'InvestorUpdatesPanel + wire into CapitalRoundDetailView', status: 'done' },
    { title: 'Launchpad /p/[venture]/[round]: render Content long-form + public updates timeline', status: 'done' },
    { title: 'Tests: ContentIntegrationService unit tests (5 passing)', status: 'done' },
    { title: 'Render markdown properly in Launchpad (upgrade to react-markdown or similar)', status: 'todo' },
    { title: 'OG image generator for capital rounds — /api/og/capital-round/[id]', status: 'todo' },
    { title: 'Scheduled updates: wire into content-scheduler cron for scheduled_for publish promotion', status: 'todo' },
    { title: 'Public announcement banner — surface capital_announcement role in investor portal + Desktop banner', status: 'todo' },
    { title: 'Sitemap extension: include public rounds + update URLs in /api/sitemap/:venture.xml', status: 'todo' },
    { title: 'Commitment receipt content — auto-generate capital_commitment_receipt on fund, link via receipt_content_id', status: 'todo' },
    { title: 'Templated SAFE / subscription agreement content (pairs with Epic 9 MCV Sign)', status: 'todo' },
    { title: 'Notification pipeline: capital.update.published → email + in-portal toast to round investors', status: 'todo' },
  ];

  const now = new Date().toISOString();
  const { data: rows, error: sErr } = await c.from('stories').insert(stories.map((s, i) => ({
    epic_id: epic.id,
    title: s.title,
    priority_order: (i + 1) * 10,
    status: s.status,
    completed_at: s.status === 'done' ? now : null,
  }))).select('id, status');
  if (sErr) throw sErr;
  const doneCount = rows?.filter((r) => r.status === 'done').length ?? 0;
  console.log(`[ok ${rows?.length} stories — ${doneCount} done]`);
}

main().catch((e) => { console.error(e); process.exit(1); });
