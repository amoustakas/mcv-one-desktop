// packages/signer-sdk/src/next/SignerPageShell.tsx
//
// Next 16 cacheComponents-safe signer page shell. The outer component
// is SYNC — no awaits, no uncached data access — so static prerender
// can stream the skeleton. Every dynamic bit (params / searchParams
// unwrap + envelope fetch) happens inside the <Suspense> boundary.
//
// This is the pattern proven in Futurestate PR #8 (and originally master
// commit e015cad at /embed/developments/[slug]). Don't set
// `export const dynamic = 'force-dynamic'` — it was explicitly reverted
// in master 744686d because it's incompatible with cacheComponents.
//
// Consumers (apps/investor/.../sign/[publicId]/page.tsx) wire this up in
// ~10 LOC. See README for the full quickstart.

import type { ReactNode } from 'react';
import { Suspense } from 'react';
import type { SignerConfig } from '../core/types';
import { createSignerServerClient } from '../core/server-client';
import { SignerShell } from '../react/SignerShell';

type ParamsPromise = Promise<{ publicId: string }>;
type SearchParamsPromise = Promise<{ token?: string }>;

export interface SignerPageShellProps {
  params: ParamsPromise;
  searchParams: SearchParamsPromise;
  config: SignerConfig;
  /** Optional theme props forwarded to SignerShell. */
  footerSlot?: ReactNode;
  /** Loading fallback. Defaults to a minimal "preparing document" screen. */
  fallback?: ReactNode;
  /** Overrides for terminal-state screens. */
  screens?: TerminalScreensOverride;
}

export interface TerminalScreensOverride {
  loading?: ReactNode;
  missingToken?: ReactNode;
  notFound?: ReactNode;
  voided?: ReactNode;
  expired?: ReactNode;
  alreadySigned?: ReactNode;
  upstreamError?: ReactNode;
}

/** SYNC outer component — emits a Suspense boundary only. */
export function SignerPageShell(props: SignerPageShellProps) {
  return (
    <Suspense fallback={props.fallback ?? <DefaultLoading />}>
      <SignerPageLoader {...props} />
    </Suspense>
  );
}

/** Async inner component — awaits params/searchParams + envelope fetch.
 *  Every terminal state branches here before hydrating the interactive
 *  SignerShell, so the client only pays the JS cost when there's
 *  actually an envelope to sign. */
async function SignerPageLoader({
  params,
  searchParams,
  config,
  footerSlot,
  screens,
}: SignerPageShellProps) {
  const { publicId } = await params;
  const { token } = await searchParams;

  if (!token) {
    return screens?.missingToken ?? <DefaultScreen title="Signing link incomplete"
      body="This URL is missing the signing token. Please use the full link from your email — tokens are not retrievable if the link is truncated." />;
  }

  const client = createSignerServerClient({ apiBaseUrl: config.apiBaseUrl });
  let envelope;
  try {
    envelope = await client.fetchEnvelope(publicId, token);
  } catch (err) {
    console.error('[signer-sdk] fetchEnvelope failed', err);
    return screens?.upstreamError ?? <DefaultScreen title="Temporary issue"
      body="We could not reach the signing service just now. Please try again in a minute. If this persists, contact the sender." />;
  }

  if (!envelope) {
    return screens?.notFound ?? <DefaultScreen title="Signing link invalid"
      body="We could not verify this signing token. It may have been revoked, or the link is not one we issued. Contact the sender to re-issue." />;
  }

  if (envelope.status === 'voided') {
    return screens?.voided ?? <DefaultScreen title="Envelope voided"
      body="This signing envelope has been voided by the sender. No further action is possible. Contact the sender for a replacement." />;
  }
  if (envelope.status === 'expired') {
    return screens?.expired ?? <DefaultScreen title="Signing link expired"
      body="This signing link has passed its expiry date. Contact the sender to re-issue a fresh link." />;
  }
  if (envelope.status === 'signed') {
    return screens?.alreadySigned ?? <DefaultScreen title="Envelope already signed"
      body="This envelope has been fully executed by all signers. A copy of the signed document should be in your email inbox." />;
  }

  return (
    <SignerShell
      envelope={envelope}
      token={token}
      config={config}
      footerSlot={footerSlot}
    />
  );
}

// ─── Default terminal screens ───────────────────────────────────────────
// Consumers override via `screens` — these are the fallback for the
// 80% case where the default copy suffices.

function DefaultLoading() {
  return (
    <DefaultScreen
      title="Preparing your document…"
      body="Fetching envelope detail from the signing service. This should only take a moment."
    />
  );
}

function DefaultScreen({ title, body }: { title: string; body: string }) {
  return (
    <main className="mcv-signer-terminal">
      <div className="mcv-signer-terminal-card">
        <h1>{title}</h1>
        <p>{body}</p>
      </div>
    </main>
  );
}
