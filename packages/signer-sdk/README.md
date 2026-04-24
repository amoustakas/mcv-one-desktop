# @mcv/signer-sdk

> v0.1 — venture-agnostic, role-agnostic, agent-friendly electronic-signing primitive.
> Built for mass expansion. Ready for the agentic OS.

## Why

Once the agentic OS lights up, documents stop being hand-drafted and start being agent-generated at scale. This SDK is the contract every MCV venture + child venture + agent workflow signs against — N documents per envelope, agent-generated origin, role-agnostic signer shape, child-venture tenancy, template versioning, cross-tree audit rollup, 5 event topics from day 1.

Futurestate PR #8 (the `/sign/[publicId]` investor page) is the prototype + first consumer. This SDK is the forward contract every subsequent venture adopts in ≤ 25 LOC.

## Subpaths

```ts
import { /* … */ } from '@mcv/signer-sdk/core';           // types, errors, ESIGN, envelope schema, tenancy, server client
import { SignerShell, useSigner } from '@mcv/signer-sdk/react';
import { SignerPageShell, createSignerAcceptProxy } from '@mcv/signer-sdk/next';
import { buildEnvelope, rollupEnvelopes, detectMutations } from '@mcv/signer-sdk/server';
import { SigningContract, createSigningEmitter } from '@mcv/signer-sdk/events';
import { createInMemoryRegistry } from '@mcv/signer-sdk/registry';
```

## Consumer quickstart — Next.js (Futurestate, investor app, any Next venture)

Two files. Under 20 lines total.

```tsx
// apps/investor/src/app/(public)/sign/[publicId]/page.tsx
import { SignerPageShell } from '@mcv/signer-sdk/next';
import { futurestateSignerTheme } from '@/theme/signer';

export default function Page({
  params,
  searchParams,
}: {
  params: Promise<{ publicId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  return (
    <SignerPageShell
      params={params}
      searchParams={searchParams}
      config={{
        apiBaseUrl: process.env.MCV_SIGN_API_URL!,
        theme: futurestateSignerTheme,
      }}
    />
  );
}
```

```ts
// apps/investor/src/app/api/sign/accept/route.ts
import { createSignerAcceptProxy } from '@mcv/signer-sdk/next';

export const POST = createSignerAcceptProxy({
  apiBaseUrl: process.env.MCV_SIGN_API_URL!,
});
```

That's the whole consumer surface. Every other MCV venture clones this with a different `theme` object — mcv.one's `/user/sign`, warforge's `/ops/agreement`, betedge's `/partner/contract`.

## Consumer quickstart — non-Next (Vite, mcv-one-desktop itself)

```tsx
import { SignerShell } from '@mcv/signer-sdk/react';
import { createSignerServerClient } from '@mcv/signer-sdk/core';

const client = createSignerServerClient({ apiBaseUrl: import.meta.env.VITE_MCV_SIGN_API_URL });
const envelope = await client.fetchEnvelope(publicId, token);
// … render SignerShell with the fetched envelope.
```

## Themeing

CSS custom properties cover the 80% case — the shell's default CSS consumes `--signer-surface`, `--signer-text`, `--signer-accent`, etc. Ventures override them via `config.theme.cssVars`.

```ts
const futurestateSignerTheme = {
  cssVars: {
    '--signer-accent': '#7c3aed',
    '--signer-surface': '#060D14',
    '--signer-text': '#E7E9EE',
  },
  logo: { src: '/futurestate-logo.svg', alt: 'Futurestate' },
  legalTone: 'plain',
};
```

For deeper customization, the `SignerShell` accepts slot props (`errorCopy`, `completionSlot`, `footerSlot`) and the `react/` subpath also exports the composition primitives (`SignerDocumentList`, `SignerConsent`, `SignerStatusBar`, `useSigner`) so power users can write a custom shell.

## Server-side envelope composition (human or agent origin)

```ts
import { buildEnvelope } from '@mcv/signer-sdk/server';

const { envelope, renderedShas } = buildEnvelope({
  tenantId: 'mcv',
  parentVentureId: 'mcv',
  childVentureId: 'futurestate',
  signer: { name: 'Tony Moustakas', email: 'tony@mcv.one', role: 'investor' },
  origin: 'agent',                                         // agent-generated document
  generatedByAgent: { agentHandle: '@draft-agent', workflowId: 'wf-42' },
  documents: [
    { templateId: 'nda-v3', templateVersion: 3, renderedBytes: '…' },
    { templateId: 'subscription-agreement-v2', templateVersion: 2, renderedBytes: '…' },
  ],
  message: 'Please review both documents before signing.',
});

// Persist envelope + documents via your backbone. The rendered SHAs are the
// signer's commitment — store them indexed for mutation detection.
```

## Events — emit, subscribe

The SDK integrates with `@mcv/events-sdk` via the `signing` module. Emit the 5 canonical topics from the backbone:

```ts
import { createPublisher, createSubscriber } from '@mcv/events-sdk';
import { createSigningEmitter, createSigningObserver } from '@mcv/signer-sdk/events';

const publisher = createPublisher({ supabase, registry });
const signing = createSigningEmitter(publisher);

await signing.emitCreated({
  publicId: envelope.publicId,
  tenantId: envelope.tenantId,
  parentVentureId: envelope.parentVentureId,
  documentCount: envelope.documents.length,
  signerEmail: envelope.signer.email,
  issuedAt: envelope.issuedAt,
});
```

Subscribe from a workflow or cockpit:

```ts
const subscriber = createSubscriber({ supabase });
const handle = createSigningObserver({
  subscriber,
  handlers: {
    onSigned: async (event) => {
      // Provision access, notify next signer, cascade to capital workflow, etc.
    },
    onMutation: async (event) => {
      // Flag compliance; the signer view is now diverging from signed bytes.
    },
  },
});
```

### Topics

| Topic | Fires when | Payload keys |
|---|---|---|
| `signing.envelope.created` | Server-side envelope row inserted | `publicId, tenantId, parentVentureId, childVentureId?, documentCount, signerEmail, issuedAt` |
| `signing.envelope.viewed` | Client first loads the signer page | `publicId, tenantId, viewedAt, userAgent?, ipHash?` |
| `signing.envelope.signed` | Server-verified accept | `publicId, tenantId, documentId, signedAt, signatureHash` (one per document) |
| `signing.envelope.voided` | Admin/agent voids | `publicId, tenantId, voidedAt, voidedBy, reason?` |
| `signing.envelope.mutation-detected` | Template version drift | `publicId, templateId, expectedVersion, actualVersion, detectedAt` |

`schemaVersion: '1.0'` rides on every event — topic suffix `.v1` was intentionally dropped (events-sdk's topic regex rejects underscores, and version lives on the envelope, not the topic).

## Namespace split — `signing.*` vs `mcv-sign.*`

`@mcv/events-sdk` already declares an `mcv-sign.envelope.*` contract for the **operator inbox** (PR #35 — who sends envelopes, tracks sent/signed/executed). This SDK introduces `signing.envelope.*` for the **signer-page + venture-agnostic primitive**. Two contracts, two lifecycles, one DB today (different tables) — a future convergence session can reconcile. The bridge is trivial: `schemaVersion` lives on each event, not in the topic.

## Backend migration

Apply `supabase/migration-signer-sdk-v0-1-2026-04-24.sql` to your Supabase project. Creates:

- `signing_envelopes` — envelope headers with `(tenant_id, parent_venture_id, child_venture_id)` scope tuple.
- `signing_documents` — per-document rows; enforces `origin = 'agent'` attribution constraint at the DB level.
- `signing_events_audit` — immutable lifecycle log; append-only.

RLS mirrors `migration-agentic-os-events-2026-04-22`: mcv_admin SELECT, service-role writes. Per-tenant scoped policies land once Phase-1 Intelligence Router's `set_tenant` RPC is on master.

Preview integrations are flaky on `migration-*.sql` file layouts — apply via the Supabase MCP `execute_sql` tool in batches per `project_supabase_service_key_mismatch`, or use the seed script pattern.

## Mass-expansion checklist — v0.1 satisfies all

| Requirement | Implementation |
|---|---|
| N documents per envelope | `SignerEnvelope.documents: SignerDocument[]` |
| Agent-generated docs | `origin: 'human' \| 'agent'` + `generatedByAgent` metadata |
| Role-agnostic signer | `role?: string` (freeform) + `displayRole?: string` |
| Child-venture tenancy | `parentVentureId` required + `childVentureId` optional |
| Template versioning | `templateId + templateVersion` pinned per document + `mutation-detected` event |
| Registry discovery | `SignerBundleManifest` + `createInMemoryRegistry()` |
| Cross-venture audit rollup | `server/audit-rollup.ts` — `rollupEnvelopes` + `rollupByChildVenture` |
| Hybrid tenancy | `apiBaseUrl` configurable per consumer |
| Events emission | 5 topics via events-sdk from day 1 |
| v0.2 extension points | `jurisdiction` + `attestationHook` types exported as no-ops |
| Framework-agnostic | `core` / `react` / `next` split |

## v0.1 → v0.2 roadmap

v0.2 picks up:

1. **Jurisdictions beyond US** — `JurisdictionV02 = 'us' | 'eu-eidas' | 'ca' | 'uk-etr' | 'au-etr'`. Types already exported; runtime activation is a drop-in replacement of `buildUsEsignConsent` with the parameterised builder.
2. **Attestation** — `AttestationHook` wires into server-side `envelope-builder` so every signature carries WebAuthn / authorized-device proof of the human who approved.
3. **Multi-signer envelopes** — today's v0.1 is one signer per envelope. v0.2 widens to N signers with the `pending_others` terminal outcome (already modeled in the server-client's `AcceptSignatureResult.outcome` enum).
4. **Supabase-backed registry** — the in-memory registry becomes a thin facade over `signing_bundles` tables.

## Promotion to core-triangle

This SDK lives in `mcv-one-desktop/packages/` during its bootstrap phase (same pattern as `@mcv/intelligence-sdk-router`). Promote to `mcv-core-triangle/packages/signer` once these stabilize:

- Ed25519 token-verification implementation (currently `TokenVerifier` is a pluggable interface; promotion pins a canonical impl).
- Multi-signer envelope state machine.
- Jurisdiction widening (at least `eu-eidas`).
- Attestation-hook wired end-to-end.

Target: v0.5 or once ≥ 3 non-MCV ventures consume the SDK in production.

## Out of scope for v0.1 (deferred)

- Multi-signer envelopes (single signer only).
- Jurisdictions beyond US.
- Attestation runtime wiring (types only; v0.2 activates).
- Server-side Supabase-backed registry (in-memory only for v0.1).
- DocumentRenderer markdown→safe-HTML pipeline (v0.1 ships pre-wrapped text only for ESIGN integrity).
- Signing bundle authoring UI (the manifest shape is defined; author tooling is a later session).
