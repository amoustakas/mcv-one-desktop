/**
 * Seed Epics 7–14 — the "New Standard" expansion of EdgeIQ Capital.
 * This is the protocol-first work that turns Capital from a cap-table SaaS
 * into the open standard for capital formation.
 *
 * Idempotent: each Epic carries a `capital:epN` tag so re-runs no-op.
 * Reference: docs/capital/PROTOCOL.md + plans/melodic-hopping-wren.md
 */
import { createClient } from '@supabase/supabase-js';

type StorySeed = {
  title: string;
  description?: string;
  acceptance_criteria?: string[];
  priority_order?: number;
};
type EpicSeed = {
  phase: number;
  title: string;
  summary: string;
  spec_md?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  priority_order: number;
  tags: string[];
  stories: StorySeed[];
  checkpoints?: { type: string; title: string; description?: string }[];
};

const PROTO = 'docs/capital/PROTOCOL.md';
const PLAN = 'C:/Users/moust/.claude/plans/melodic-hopping-wren.md';

const PLAN_EPICS: EpicSeed[] = [
  {
    phase: 7,
    title: 'MCV Capital Protocol — spec, governance, open-source distribution',
    summary:
      'Publish MCP-Capital v0.1 as an open protocol. Establish Consortium, governance process, versioning, conformance suite. This is the standards play that makes Layers 4-5 possible.',
    spec_md: `See ${PROTO}. The protocol spec itself is shipped in this Epic.\n\nPhase 7 outputs: public docs, MIT-licensed reference, conformance test vectors, Consortium charter.`,
    priority: 'critical',
    priority_order: 70,
    tags: ['capital:ep7', 'capital', 'protocol', 'new-standard'],
    stories: [
      { title: 'Publish MCP-Capital v0.1 spec to docs/capital/PROTOCOL.md', priority_order: 10, acceptance_criteria: ['Layer map, primitives, event schema, adoption ladder all documented', 'MIT license applied to reference implementations', 'Referenceable from external sites'] },
      { title: 'Define event schema as Zod types — @mcv/capital-sdk/protocol-events', priority_order: 20, acceptance_criteria: ['All 20+ capital.*.* events specified', 'Published as subpath export of capital-sdk'] },
      { title: 'Conformance test vectors — JSON fixtures + validator', priority_order: 30, acceptance_criteria: ['Round lifecycle fixtures', 'Commitment state-machine fixtures', 'Compliance check fixtures', 'Any implementation can self-test'] },
      { title: 'Consortium charter draft (Swiss Verein or similar)', priority_order: 40, description: 'Stewardship model, governance voting, fee model, regulatory-engagement mandate' },
      { title: 'Protocol versioning policy + upgrade path', priority_order: 50, acceptance_criteria: ['SemVer with stability commitments', 'Migration guide template', 'Deprecation policy'] },
      { title: 'Public protocol landing page at protocol.mcv.one or equivalent', priority_order: 60 },
    ],
    checkpoints: [
      { type: 'spec-review', title: 'v0.1 spec sign-off', description: 'Tony + legal counsel approve the public protocol scope before publishing externally.' },
    ],
  },
  {
    phase: 8,
    title: 'On-Chain Cap Table — Anchor program + client SDK',
    summary:
      'The cap table IS the SPL Token-2022 holder set, not a reflection of it. Anchor program stores CapitalEntity + Round + CommitmentReceipt accounts. Merkle-committed off-chain snapshots during ramp-up; full on-chain by v1.0.',
    spec_md: `Depends on Epic 7 spec. See PROTOCOL.md §Core Primitives.\n\n3-6 month heavy lift; ramp-up via Merkle snapshots of Supabase state to Solana.`,
    priority: 'critical',
    priority_order: 80,
    tags: ['capital:ep8', 'capital', 'solana', 'on-chain', 'new-standard'],
    stories: [
      { title: 'Anchor program scaffold — programs/mcv-capital-registry', priority_order: 10, acceptance_criteria: ['Entity + Round + CommitmentReceipt account structs', 'Issuer authority multisig (squads.so integration)', 'Passes cargo-test-bpf'] },
      { title: 'TypeScript client SDK — @mcv/capital-onchain-sdk', priority_order: 20, acceptance_criteria: ['Generated from IDL', 'Signed transaction builders', 'Read helpers for holder set → cap table'] },
      { title: 'Merkle snapshot writer — nightly Supabase → Solana', priority_order: 30, acceptance_criteria: ['Computes Merkle root over ordered commitments', 'Commits root via Anchor call', 'Inclusion proofs generatable for any commitment'] },
      { title: 'Issuance flow — round close triggers mint to investors', priority_order: 40, acceptance_criteria: ['Atomically mints equity/token per commitment', 'Updates round to funded', 'Emits capital.round.distributed'] },
      { title: 'Security audit — third-party review (Halborn, OtterSec, or similar)', priority_order: 50 },
      { title: 'Devnet soak — 30-day burn-in before mainnet', priority_order: 60 },
      { title: 'Mainnet launch + monitoring', priority_order: 70 },
    ],
    checkpoints: [
      { type: 'pre-deploy', title: 'Audit sign-off before mainnet', description: 'No unresolved high/critical findings.' },
    ],
  },
  {
    phase: 9,
    title: 'MCV Sign — on-chain signature alternative to DocuSign',
    summary:
      'Ed25519 signature from investor-controlled keypair + PDF hash + DID-linked proof. ESIGN + eIDAS + ETA compliant. Legacy DocuSign bridge for counterparties who contractually require it.',
    spec_md: `Replaces DocuSign as the primary signing flow. Legacy DocuSignAdapter runs in parallel for graduated migration.`,
    priority: 'high',
    priority_order: 90,
    tags: ['capital:ep9', 'capital', 'signing', 'new-standard'],
    stories: [
      { title: 'Sign service — @mcv/sign-sdk with signEnvelope / verifySignature', priority_order: 10, acceptance_criteria: ['PDF hash computed client-side', 'Ed25519 signature via wallet (Solana keypair) or Clerk key', 'Storage of signature + metadata in capital_documents'] },
      { title: 'ESIGN/eIDAS/ETA compliance brief — legal memo', priority_order: 20, description: 'Document the path to binding e-signature under all three jurisdictions. Sets the foundation for any counsel review.' },
      { title: 'Envelope UI — PDF viewer, sign-with-wallet button, audit trail', priority_order: 30 },
      { title: 'DocuSignAdapter — wrap real envelopes, mirror completion to MCV Sign receipt', priority_order: 40, acceptance_criteria: ['One-way mirror: DocuSign webhook → anchor signature hash in Supabase', 'Reverse not required in v0'] },
      { title: 'Anchor signature hashes to Solana (Merkle)', priority_order: 50, description: 'Depends on Epic 8 snapshot writer. Until then, Supabase is the auth source.' },
      { title: 'Integration with commitments — replace send-docusign with sendEnvelope', priority_order: 60 },
    ],
  },
  {
    phase: 10,
    title: 'MCV Settlement — USDC-native escrow + distribution program',
    summary:
      'Replace Stripe/wire with Solana-native USDC settlement. ~400ms finality, <$0.001 fees. Legacy Stripe + wire bridges for fiat-native LPs during migration.',
    spec_md: 'Depends on Epic 8 registry (escrow PDAs live in the program). Stripe/wire legacy bridges via existing @mcv/payments-sdk.',
    priority: 'high',
    priority_order: 100,
    tags: ['capital:ep10', 'capital', 'settlement', 'solana', 'new-standard'],
    stories: [
      { title: 'Escrow PDA per round — Anchor program', priority_order: 10, acceptance_criteria: ['Deposit / refund / release instructions', 'Multi-signer release (issuer + platform)', 'Emergency pause capability'] },
      { title: 'Distribution program — bulk USDC payouts with tax-reporting export', priority_order: 20, acceptance_criteria: ['One tx distributes to N holders', 'Per-distribution event for audit trail', '1099-DIV (US) + T5 (CA) CSV export'] },
      { title: 'StripeAdapter — card/ACH/wire → USDC escrow via Stripe Crypto', priority_order: 30, acceptance_criteria: ['Investor pays with card', 'USDC lands in escrow PDA', 'Commitment auto-moves to funded'] },
      { title: 'Wire adapter with reference-number reconciliation', priority_order: 40, description: 'Manual until bank API integration — covers the LP corner case' },
      { title: 'Integration with @mcv/capital-sdk commitments.recordPayment', priority_order: 50, description: 'Polymorphic payment router — routes by currency/chain' },
    ],
  },
  {
    phase: 11,
    title: 'MCV Identity — Portable Investor Credentials (DID + VC)',
    summary:
      'One KYC, used everywhere. did:mcv:* DIDs + W3C Verifiable Credentials signed by MCV-authorized verifiers. Futurestate compliance tier maps to AccreditedInvestorCredential.',
    spec_md: 'Depends on Futurestate compliance bridge. Credentials stored in capital_investor_profile.metadata.vc initially, on-chain resolver in Epic 8.',
    priority: 'high',
    priority_order: 110,
    tags: ['capital:ep11', 'capital', 'identity', 'did', 'vc', 'new-standard'],
    stories: [
      { title: 'DID method spec — did:mcv syntax + resolution', priority_order: 10, acceptance_criteria: ['Resolvable via did.mcv.one/{id}', 'Controller = investor public key', 'Published in docs/capital/DID-SPEC.md'] },
      { title: 'VC issuer — @mcv/identity-sdk/vc-issuer', priority_order: 20, acceptance_criteria: ['Issues AccreditedInvestorCredential', 'Issues JurisdictionCredential', 'Issues AmlScreeningCredential', 'Ed25519Signature2020 + JsonWebSignature2020'] },
      { title: 'VC verifier — on commit, validate credential before admitting', priority_order: 30 },
      { title: 'Futurestate compliance tier → VC mapping', priority_order: 40, acceptance_criteria: ['ACCREDITED tier → AccreditedInvestorCredential with method=income_200k_2yr or similar', 'KYC approval → JurisdictionCredential'] },
      { title: 'Credential wallet UX — investor portal view of their creds', priority_order: 50 },
      { title: 'Revocation registry — on-chain revocation list (Epic 8 dep)', priority_order: 60 },
      { title: 'Federated verifier network — onboard 2-3 external verifiers', priority_order: 70, description: 'Layer 4 adoption accelerator' },
    ],
  },
  {
    phase: 12,
    title: 'MCV Secondary — permissioned on-chain secondary market',
    summary:
      'Replace ATSs with transfer-hook-enforced secondary. Any wallet can make/take; non-compliant matches rejected at settlement. FINRA-style reporting export for regulatory interop.',
    spec_md: 'Depends on Epic 8 (transfer hook program) + Epic 11 (credentials). Partners optionally with real ATSs via AtsAdapter.',
    priority: 'medium',
    priority_order: 120,
    tags: ['capital:ep12', 'capital', 'secondary', 'solana', 'new-standard'],
    stories: [
      { title: 'Transfer hook program — compliance_check on every transfer', priority_order: 10, acceptance_criteria: ['Verifies buyer credential', 'Enforces jurisdiction rules', 'Enforces lockup windows', 'Caps max_investors'] },
      { title: 'Order book program — permissioned matching', priority_order: 20 },
      { title: 'UI — secondary market tab in investor portal', priority_order: 30 },
      { title: 'AtsAdapter — bridge to FINRA-reported ATS partners', priority_order: 40 },
      { title: 'Regulatory reporting export — daily trade summaries', priority_order: 50 },
    ],
  },
  {
    phase: 13,
    title: 'Legacy Interop Adapters — DocuSign / Stripe / Transfer Agents / Carta / ATS',
    summary:
      'Each legacy system gets a bridge so MCV Capital absorbs them rather than competing head-on. Adapters are kits; any adapter is independently shippable.',
    spec_md: `Protocol layer is vendor-agnostic; adapters handle the vendor-specific translation in both directions where needed.`,
    priority: 'high',
    priority_order: 130,
    tags: ['capital:ep13', 'capital', 'interop', 'adapters', 'new-standard'],
    stories: [
      { title: 'DocuSignAdapter (in Epic 9 Story 4) — status: reserved', priority_order: 10 },
      { title: 'StripeAdapter (in Epic 10 Story 3) — status: reserved', priority_order: 20 },
      { title: 'Transfer agent adapter — nightly Carta CSV or SS&C snapshot broadcast', priority_order: 30, acceptance_criteria: ['Deterministic CSV export', 'Reconciles to on-chain holder set', 'Signed snapshot for auditability'] },
      { title: 'Carta export — investor-facing LP report in Carta format', priority_order: 40 },
      { title: 'AtsAdapter (in Epic 12 Story 4) — status: reserved', priority_order: 50 },
      { title: 'Plaid adapter — investor bank-account verification for wire info', priority_order: 60 },
      { title: 'QuickBooks / Xero export — for issuer accountants', priority_order: 70 },
      { title: 'Adapter conformance test suite — ensures every adapter round-trips correctly', priority_order: 80 },
    ],
  },
  {
    phase: 14,
    title: 'MCV Capital Consortium — governance, stewardship, regulatory engagement',
    summary:
      'Non-profit governance body (Swiss Verein likely) with MCV as founding steward. Token-weighted voting on protocol upgrades, legal template amendments, conformance certification.',
    spec_md: `Operational/legal-heavy. Drives Layer 6 regulatory recognition.`,
    priority: 'medium',
    priority_order: 140,
    tags: ['capital:ep14', 'capital', 'governance', 'consortium', 'new-standard'],
    stories: [
      { title: 'Entity formation — Swiss Verein or equivalent', priority_order: 10 },
      { title: 'Consortium charter + member agreement (law firm drafted)', priority_order: 20 },
      { title: 'Voting mechanics — staked-EDGE-weighted with qualified majority', priority_order: 30 },
      { title: 'Conformance certification program — logo + listing for certified implementations', priority_order: 40 },
      { title: 'Founding members — Milborne, Soloviev, 2-3 launchpad partners', priority_order: 50 },
      { title: 'Regulatory engagement plan — SEC / CSA / MiCA notice-and-comment strategy', priority_order: 60 },
      { title: 'Annual protocol summit / standards publication', priority_order: 70 },
    ],
    checkpoints: [
      { type: 'spec-review', title: 'Legal counsel sign-off on Consortium charter', description: 'Blocking for any consortium launch communication.' },
    ],
  },
];

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] || (fallback ? process.env[fallback] : undefined);
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
}

async function main() {
  const url = requireEnv('SUPABASE_URL', 'VITE_SUPABASE_URL');
  const key = requireEnv('SUPABASE_SERVICE_KEY', 'VITE_SUPABASE_ANON_KEY');
  const client = createClient(url, key);

  console.log('Seeding EdgeIQ Capital Epics 7-14 (New Standard expansion)...\n');

  let seededEpics = 0, skippedEpics = 0, seededStories = 0, seededCheckpoints = 0;

  for (const ep of PLAN_EPICS) {
    const tag = ep.tags.find((t) => t.startsWith('capital:ep'));
    if (!tag) continue;

    const { data: existing } = await client.from('epics').select('id, title').contains('tags', [tag]).maybeSingle();
    if (existing) { console.log(`[skip] ${ep.title}`); skippedEpics++; continue; }

    const { data: epic, error: epicErr } = await client
      .from('epics')
      .insert({
        title: ep.title,
        summary: ep.summary,
        spec_md: ep.spec_md,
        venture_id: 'mcv',
        suite: 'capital',
        status: 'proposed',
        priority: ep.priority,
        priority_order: ep.priority_order,
        tags: ep.tags,
        linked_docs: [PROTO, PLAN],
      })
      .select()
      .single();
    if (epicErr || !epic) { console.error(`[fail] ${ep.title}:`, epicErr); continue; }

    seededEpics++;
    console.log(`[ok epic] ${ep.title}`);

    const rows = ep.stories.map((s, i) => ({
      epic_id: epic.id,
      title: s.title,
      description: s.description ?? null,
      acceptance_criteria: s.acceptance_criteria ?? [],
      priority_order: s.priority_order ?? (i + 1) * 10,
      status: 'todo',
    }));
    const { data: storyRows, error: storyErr } = await client.from('stories').insert(rows).select('id');
    if (storyErr) console.error(`  [fail stories]`, storyErr);
    else { seededStories += storyRows?.length ?? 0; console.log(`  [ok ${storyRows?.length} stories]`); }

    if (ep.checkpoints?.length) {
      const cpRows = ep.checkpoints.map((cp) => ({
        epic_id: epic.id,
        checkpoint_type: cp.type,
        title: cp.title,
        description: cp.description ?? null,
        state: 'pending',
      }));
      const { error: cpErr } = await client.from('epic_checkpoints').insert(cpRows);
      if (!cpErr) { seededCheckpoints += cpRows.length; console.log(`  [ok ${cpRows.length} checkpoints]`); }
    }
  }

  console.log(`\n-- summary --\nEpics seeded: ${seededEpics}\nSkipped: ${skippedEpics}\nStories: ${seededStories}\nCheckpoints: ${seededCheckpoints}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
