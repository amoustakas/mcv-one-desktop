/**
 * Seed the Ventures-Expansion plan tree (Epics 0–8) into Supabase.
 *
 * Idempotent: each Epic carries a tag `vx-plan:epN` so re-runs no-op.
 * After seeding, EpicBoardView renders the tree live (realtime publication
 * on `epics` + `stories` is already enabled by migration-epics.sql).
 *
 * Usage:  npx tsx scripts/seed-plan-epics.ts
 * Env:    SUPABASE_URL (or VITE_SUPABASE_URL), SUPABASE_SERVICE_KEY
 *         (service key preferred — RLS lets anon insert but service is cleaner)
 */
import { createClient } from '@supabase/supabase-js';

type StorySeed = {
  title: string;
  description?: string;
  acceptance_criteria?: string[];
  xp?: number;
  priority_order?: number;
};

type EpicSeed = {
  phase: number;
  title: string;
  summary: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  priority_order: number;
  tags: string[];
  xp_total: number;
  stories: StorySeed[];
  checkpoints?: { type: string; title: string; description?: string }[];
};

const PLAN: EpicSeed[] = [
  {
    phase: 0,
    title: 'Shell Foundations — Portal dropdowns & z-index unification',
    summary: 'Fix shell-wide z-index conflicts by adopting --z-* tokens and introducing a Portal-based Select primitive. Unblocks every downstream dropdown/menu.',
    priority: 'critical',
    priority_order: 10,
    tags: ['vx-plan:ep0', 'ventures-expansion', 'shell', 'foundation'],
    xp_total: 200,
    stories: [
      { title: 'Create Portal <Select> primitive in src/components/ui/Select.tsx', xp: 40, acceptance_criteria: ['Uses Popover createPortal path', 'Escapes overflow parents', 'Keyboard navigable'] },
      { title: 'Sweep src/styles/shell.css to use var(--z-*) tokens', xp: 40, acceptance_criteria: ['No raw z-index numbers remain', 'Layering matches design-system scale'] },
      { title: 'Remove hardcoded z-index:100 from SettingsPanel.tsx, adopt overlay+modal tokens', xp: 30 },
      { title: 'Migrate every native <select> in SettingsView to Portal <Select>', xp: 50 },
      { title: 'Migrate dropdowns in VentureOnboarding to Portal <Select>', xp: 20 },
      { title: 'Playwright verification: settings dropdown escapes top bar', xp: 20, acceptance_criteria: ['menu boundingBox not clipped by .ws-tab-drop-indicator', 'screenshot diff vs report'] },
    ],
    checkpoints: [{ type: 'pre-merge', title: 'Visual QA: no dropdown clips across shell' }],
  },
  {
    phase: 1,
    title: 'Venture OS — data layer (ventures extensions, assets, quests matview)',
    summary: 'Ship migration-venture-os.sql, extend Venture type, add api/ventures routes for assets/domains/quests/org/docs.',
    priority: 'critical',
    priority_order: 20,
    tags: ['vx-plan:ep1', 'ventures-expansion', 'data-layer'],
    xp_total: 300,
    stories: [
      { title: 'Write supabase/migration-venture-os.sql with ventures columns + venture_assets + xp columns + matview', xp: 60, acceptance_criteria: ['tier, parent_venture_id, clerk_org_id, custom_domains, white_label, doc_namespace, quest_state cols added', 'venture_assets table created', 'xp int on epics/stories/tasks', 'venture_quests matview present'] },
      { title: 'Extend Venture interface in src/lib/ventures.ts (tier, parentVentureId, clerkOrgId, customDomains, whiteLabel, docNamespace)', xp: 30 },
      { title: 'Add /api/ventures?action=list-assets & create-asset & confirm-asset endpoints', xp: 40 },
      { title: 'Add /api/ventures?action=list-domains & add-domain & verify-domain endpoints', xp: 40 },
      { title: 'Add /api/ventures?action=list-quests (reads venture_quests matview)', xp: 30 },
      { title: 'Add /api/ventures?action=apply-doc-template for department seeding', xp: 30 },
      { title: 'Add /api/ventures?action=provision-org placeholder (full impl in Epic 4)', xp: 20 },
      { title: 'Unit tests for api/ventures route handlers', xp: 50, acceptance_criteria: ['vitest covers all new actions', 'negative paths tested'] },
    ],
    checkpoints: [{ type: 'spec-review', title: 'DB migration review before apply' }],
  },
  {
    phase: 2,
    title: 'Venture Detail Surface — routes, tabs, AssetTierGraph',
    summary: 'Route-based /ventures + /ventures/:id workspace with tabbed ops (Overview · Assets · Domains · Socials · Team · Quests · Docs · Ops · Settings).',
    priority: 'high',
    priority_order: 30,
    tags: ['vx-plan:ep2', 'ventures-expansion', 'ui'],
    xp_total: 380,
    stories: [
      { title: 'Add routes /ventures, /ventures/:id, /ventures/:id/:tab, /ventures/new, /ventures/:id/wizard in App.tsx', xp: 30 },
      { title: 'Build src/views/VenturesIndexView.tsx (grid with Tier filters, quest progress, quick jump)', xp: 60 },
      { title: 'Build src/views/VentureDetailView.tsx shell with tab nav', xp: 40 },
      { title: 'Overview tab — KPIs, description, quick links, recent activity', xp: 30 },
      { title: 'Assets tab — list + AssetTierGraph + add/confirm', xp: 50 },
      { title: 'Domains tab — list custom domains, add, verify state badges', xp: 30 },
      { title: 'Socials tab — edit VentureSocials with preview cards', xp: 20 },
      { title: 'Team tab — roster + invite (placeholder; full Clerk invites in Epic 4)', xp: 30 },
      { title: 'Ops tab — today\'s tasks, active sessions, live metrics', xp: 40 },
      { title: 'Settings tab — core Venture editing + delete gate', xp: 20 },
      { title: 'Build src/components/ventures/AssetTierGraph.tsx (Tier 1/2/3 radial/tree view)', xp: 30 },
    ],
    checkpoints: [{ type: 'design-review', title: 'Venture Detail layout sign-off' }],
  },
  {
    phase: 3,
    title: 'Epic-Backed Gamified Wizard — quest projection + Genesis seeds',
    summary: 'Wizard reads from Epic tree and writes Task updates; VentureQuestPanel renders XP view; seed Genesis Epics for the 9 legacy ventures.',
    priority: 'high',
    priority_order: 40,
    tags: ['vx-plan:ep3', 'ventures-expansion', 'wizard', 'gamification'],
    xp_total: 260,
    stories: [
      { title: 'Refactor VentureOnboarding to read/write Epic-backed Tasks via /api/epics', xp: 50 },
      { title: 'Build src/views/VentureWizardGamified.tsx with XP bar, step confetti, resumable state', xp: 60 },
      { title: 'Build src/components/ventures/VentureQuestPanel.tsx projecting open Stories/Tasks as quests', xp: 50 },
      { title: 'Seed Genesis Epic for each of the 9 legacy ventures with Tasks inferred from filled fields', xp: 40, acceptance_criteria: ['script scripts/seed-venture-genesis-epics.ts', 'idempotent per venture'] },
      { title: 'Add claimTask(taskId, sessionId) tool to src/lib/kits/builtin/epic-kit.ts', xp: 30 },
      { title: 'Sessions panel integration: show claimed tasks per session', xp: 30 },
    ],
  },
  {
    phase: 4,
    title: 'Clerk Hybrid Tenancy — root org default, child orgs on demand',
    summary: 'Wire ClerkProvider orgs, build ClerkOrgPanel, implement /api/ventures/provision-org, update RLS to dual-mode (org-scoped when clerk_org_id set, venture_assignments fallback otherwise).',
    priority: 'high',
    priority_order: 50,
    tags: ['vx-plan:ep4', 'ventures-expansion', 'clerk', 'tenancy'],
    xp_total: 320,
    stories: [
      { title: 'Enable Clerk Organizations in dashboard + useOrganization hooks in src/lib/auth.tsx', xp: 30 },
      { title: 'Provision root EdgeIQ Holdings org on first user sign-in (backend sync)', xp: 40 },
      { title: 'Build src/components/ventures/ClerkOrgPanel.tsx with OrganizationProfile/Switcher/Create themed to MCV', xp: 60 },
      { title: 'Implement POST /api/ventures/provision-org — create Clerk org, mirror members, set clerk_org_id', xp: 60 },
      { title: 'Add RLS policies: org-scoped when clerk_org_id set, else fallback to team_members.venture_assignments', xp: 50 },
      { title: 'NavRail venture switcher: use Clerk setActive() when venture has org; local fallback otherwise', xp: 30 },
      { title: 'Domain verification + SAML/OIDC surfaces in ClerkOrgPanel (gated on clerk_org_id)', xp: 30 },
      { title: 'Invitations + roles UI on Venture Team tab using Clerk memberships API', xp: 20 },
    ],
    checkpoints: [{ type: 'pre-deploy', title: 'RLS tenant isolation test before production' }],
  },
  {
    phase: 5,
    title: 'Asset Discovery — sibling-prefix scanner + domain/social inference',
    summary: 'Auto-suggest Tier 2/3 related assets (e.g. MCV One → mcv-core-triangle, mcv-one-admin-prototype, mcv.gg/dev/tech).',
    priority: 'medium',
    priority_order: 60,
    tags: ['vx-plan:ep5', 'ventures-expansion', 'discovery'],
    xp_total: 200,
    stories: [
      { title: 'Build src/lib/ventures/asset-discovery.ts with pure sibling-prefix + domain normalization functions', xp: 40 },
      { title: 'Wire GitHub kit scan for Documents/GitHub/<brand> repos', xp: 40 },
      { title: 'Cloudflare/Vercel MCP domain inventory scan (when keys present)', xp: 30 },
      { title: 'Confirmation UX: chips on AssetTierGraph, user taps to confirm', xp: 30 },
      { title: 'Unit tests: given MCV One, expect mcv-* siblings + mcv.gg/dev/tech suggestions', xp: 40 },
      { title: 'Nightly re-scan cron via Vercel cron', xp: 20 },
    ],
  },
  {
    phase: 6,
    title: 'Business Docs Automation — template registry + Notion BDT import',
    summary: 'Pull Notion Business Documents Tracker into doc_templates; per-venture department seeding; wire existing WordPress-like editor.',
    priority: 'high',
    priority_order: 70,
    tags: ['vx-plan:ep6', 'ventures-expansion', 'docs', 'automation'],
    xp_total: 420,
    stories: [
      { title: 'Write supabase/migration-venture-docs.sql (doc_templates + venture_docs)', xp: 40 },
      { title: 'Build scripts/import-notion-bdt.ts — hits Notion MCP, walks BDT, emits doc_templates rows grouped by department', xp: 80, acceptance_criteria: ['re-runnable', 'version bumps on change', 'source=notion recorded'] },
      { title: 'Seed all 6 departments with baseline templates (Legal/Compliance/Research/Finance/Ops/Product)', xp: 50 },
      { title: 'Implement POST /api/ventures/apply-doc-template with {{venture}} interpolation', xp: 40 },
      { title: 'Build src/components/ventures/VentureDocsPanel.tsx — department tree + WordPress-like editor mount', xp: 70 },
      { title: 'RAG integration: storage_chunks embeds venture_docs bodies for match_chunks RPC', xp: 40 },
      { title: 'Per-department Epics auto-generated on template apply (e.g. "Complete MSA")', xp: 40 },
      { title: 'Doc completion ticks Task + raises venture XP', xp: 30 },
      { title: 'End-to-end test: import → apply Legal to BetEdge AI → assert 5+ venture_docs rows', xp: 30 },
    ],
    checkpoints: [{ type: 'spec-review', title: 'Review Notion BDT field mapping before first import' }],
  },
  {
    phase: 7,
    title: 'White-Label + Custom Domains',
    summary: 'Per-venture Clerk appearance, Vercel rewrite configuration via vercel.ts, domain verification UX.',
    priority: 'medium',
    priority_order: 80,
    tags: ['vx-plan:ep7', 'ventures-expansion', 'white-label', 'domains'],
    xp_total: 180,
    stories: [
      { title: 'Extend vercel.ts with rewrites driven by ventures.custom_domains jsonb', xp: 50 },
      { title: 'Per-venture Clerk appearance object stored in white_label jsonb, applied on org switch', xp: 40 },
      { title: 'Domain verification UX in Venture Detail > Domains tab (DNS records, status polling)', xp: 40 },
      { title: 'Deploy preview per venture with custom domain smoke test', xp: 30 },
      { title: 'Document rollback path if domain verification stalls', xp: 20 },
    ],
  },
  {
    phase: 8,
    title: 'Department Automation — Legal/Compliance/Research/Finance/Ops agent kits',
    summary: 'NAOS personalities per department operating over venture_docs — contract redlines, filing reminders, market briefs, burn alerts, incident postmortems.',
    priority: 'medium',
    priority_order: 90,
    tags: ['vx-plan:ep8', 'ventures-expansion', 'agents', 'departments'],
    xp_total: 360,
    stories: [
      { title: 'Define department personality prompts + slot into existing api/agent-prompt compile pipeline', xp: 40 },
      { title: 'Legal kit: redline_contract, generate_nda, check_ip_assignment tools', xp: 50 },
      { title: 'Compliance kit: track_filings, schedule_reminder, SOC2 checklist tools', xp: 50 },
      { title: 'Research kit: draft_market_brief, competitor_teardown, interview_log tools', xp: 50 },
      { title: 'Finance kit: update_burn, cap_table_snapshot, unit_economics_calc tools', xp: 50 },
      { title: 'Ops kit: runbook_generate, postmortem_scaffold, onboarding_checklist tools', xp: 50 },
      { title: 'Department dashboards per venture with agent activity feed', xp: 40 },
      { title: 'Cross-department queries: "Show all venture legal status" across portfolio', xp: 30 },
    ],
  },
];

function getEnv(key: string, fallback?: string): string {
  const v = process.env[key] || (fallback ? process.env[fallback] : undefined);
  if (!v) throw new Error(`Missing env: ${key}${fallback ? ` (or ${fallback})` : ''}`);
  return v;
}

async function main() {
  const url = getEnv('SUPABASE_URL', 'VITE_SUPABASE_URL');
  const key = getEnv('SUPABASE_SERVICE_KEY', 'VITE_SUPABASE_ANON_KEY');
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  console.log(`[seed-plan-epics] connecting to ${url}`);
  console.log(`[seed-plan-epics] seeding ${PLAN.length} Epics for venture=mcv\n`);

  let created = 0, skipped = 0, storiesCreated = 0, checkpointsCreated = 0;

  for (const ep of PLAN) {
    const tag = `vx-plan:ep${ep.phase}`;
    const { data: existing, error: selErr } = await supabase
      .from('epics')
      .select('id, title, tags')
      .contains('tags', [tag])
      .limit(1);
    if (selErr) throw selErr;

    if (existing && existing.length > 0) {
      console.log(`  · ep${ep.phase} "${ep.title}" already exists (${existing[0].id}) — skipping`);
      skipped++;
      continue;
    }

    const { data: epicRow, error: epErr } = await supabase
      .from('epics')
      .insert({
        title: ep.title,
        summary: ep.summary,
        venture_id: 'mcv',
        suite: 'ventures-expansion',
        status: 'approved',
        priority: ep.priority,
        priority_order: ep.priority_order,
        tags: [...ep.tags, `xp:${ep.xp_total}`],
        linked_docs: ['plans/kind-stirring-sky.md'],
        created_by: 'plan-seed',
      })
      .select()
      .single();
    if (epErr) throw epErr;

    const storyRows = ep.stories.map((s, i) => ({
      epic_id: epicRow.id,
      title: s.title,
      description: s.description ?? null,
      acceptance_criteria: s.acceptance_criteria ?? [],
      status: 'todo' as const,
      priority_order: s.priority_order ?? (i + 1) * 10,
      artifacts: [{ kind: 'plan-xp', xp: s.xp ?? 0 }],
    }));
    const { data: insertedStories, error: stErr } = await supabase
      .from('stories')
      .insert(storyRows)
      .select();
    if (stErr) throw stErr;
    storiesCreated += insertedStories?.length ?? 0;

    if (ep.checkpoints?.length) {
      const cpRows = ep.checkpoints.map(cp => ({
        epic_id: epicRow.id,
        checkpoint_type: cp.type,
        title: cp.title,
        description: cp.description ?? null,
        required_approvers: ['tony'],
        state: 'pending' as const,
      }));
      const { data: cpData, error: cpErr } = await supabase
        .from('epic_checkpoints')
        .insert(cpRows)
        .select();
      if (cpErr) throw cpErr;
      checkpointsCreated += cpData?.length ?? 0;
    }

    created++;
    console.log(`  ✅ ep${ep.phase} "${ep.title}" → ${insertedStories?.length ?? 0} stories${ep.checkpoints?.length ? `, ${ep.checkpoints.length} checkpoints` : ''}`);
  }

  console.log(`\n[seed-plan-epics] done`);
  console.log(`  created:     ${created} Epics`);
  console.log(`  skipped:     ${skipped} (already seeded)`);
  console.log(`  stories:     ${storiesCreated}`);
  console.log(`  checkpoints: ${checkpointsCreated}`);
  console.log(`\nOpen EpicBoardView — tree renders live via supabase_realtime publication.`);
}

main().catch(err => {
  console.error('[seed-plan-epics] fatal:', err);
  process.exit(1);
});
