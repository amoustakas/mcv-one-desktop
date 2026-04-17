// src/lib/server/webhook-verify.ts
//
// Cryptographic webhook signature verification for the investor-flow-webhook
// dispatcher (Marathon #5 I3.2). Replaces the prior "warn and accept" path —
// zero-trust for external callers: no signature, no access.
//
// ─── Processor coverage ──────────────────────────────────────────────────
//
//   • Stripe: Stripe.webhooks.constructEvent over STRIPE_WEBHOOK_SECRET.
//     Raw-body bytes required; the dispatch handler disables bodyParser
//     and streams the request before calling in.
//
//   • Plaid: Plaid-Verification JWT (ES256 over a rotating JWK set published
//     at /webhook_verification_key/get). Full verification is already in
//     api/_handlers/plaid-webhook.ts; we mirror the logic here so the
//     dispatcher can call through without a circular import.
//     Fallback: PLAID_WEBHOOK_SECRET HMAC-SHA256 for non-JWT ingestion paths
//     (dev + synthetic replay). Structural check always runs first.
//
//   • USDC: The webhook payload declares a Solana tx signature; we call
//     Connection.getTransaction against SOLANA_RPC_URL, require finalized
//     commitment, and confirm the SPL transfer amount + mint + recipient
//     match the claimed values. Any mismatch throws.
//
// ─── Known tradeoff ──────────────────────────────────────────────────────
//
// Plaid ES256 JWK rotation is fully implemented inline (no network round-trip
// is skipped). If PLAID_CLIENT_ID / PLAID_SECRET are unset at request time,
// we fall back to the HMAC-SHA256 path with PLAID_WEBHOOK_SECRET. The JWK
// fetch is per-request (no cache); a follow-up task is tracked for JWK
// memoization with a TTL.
//
// ─── Usage ───────────────────────────────────────────────────────────────
//
//   try {
//     verifyStripeWebhook(raw, req.headers['stripe-signature'], secret);
//   } catch (err) {
//     if (err instanceof WebhookVerificationError) res.status(401)...
//   }

import Stripe from 'stripe';
import crypto from 'node:crypto';

// ─── Error type ──────────────────────────────────────────────────────────

export type WebhookProcessor = 'stripe' | 'plaid' | 'usdc';

export class WebhookVerificationError extends Error {
  public readonly processor: WebhookProcessor;
  public readonly code: string;

  constructor(
    processor: WebhookProcessor,
    code: string,
    opts?: { cause?: unknown },
  ) {
    super(`webhook_verification_failed:${processor}:${code}`);
    this.name = 'WebhookVerificationError';
    this.processor = processor;
    this.code = code;
    if (opts?.cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = opts.cause;
    }
  }
}

// ─── Stripe ──────────────────────────────────────────────────────────────

/**
 * Verify a Stripe webhook using the shared signing secret.
 *
 * @param rawBody  Raw request body bytes. Required — parsed JSON cannot be
 *                 re-serialised to match the Stripe signature.
 * @param signature  The `stripe-signature` header value.
 * @param secret  The Stripe webhook signing secret (`whsec_...`). Typically
 *                `process.env.STRIPE_WEBHOOK_SECRET`.
 * @returns The verified Stripe.Event.
 * @throws  WebhookVerificationError on missing or invalid signature.
 */
export function verifyStripeWebhook(
  rawBody: string | Buffer,
  signature: string | undefined,
  secret: string,
): Stripe.Event {
  if (!signature) {
    throw new WebhookVerificationError('stripe', 'missing_signature');
  }
  if (!secret) {
    throw new WebhookVerificationError('stripe', 'missing_secret_config');
  }

  try {
    // constructEvent does not call Stripe's API — it's a pure HMAC check.
    // The SDK constructor still wants an API key; use the live one if set,
    // otherwise a placeholder. This never escapes the function.
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder');
    return stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    throw new WebhookVerificationError('stripe', 'signature_invalid', { cause: err });
  }
}

// ─── Plaid ───────────────────────────────────────────────────────────────

interface PlaidJwtHeader {
  alg: string;
  kid: string;
  typ?: string;
}

interface PlaidJwtBody {
  iat: number;
  request_body_sha256: string;
}

function base64UrlDecode(s: string): Buffer {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

function decodePlaidJwt(
  token: string,
): { header: PlaidJwtHeader; body: PlaidJwtBody; signingInput: string; signature: Buffer } | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const header = JSON.parse(base64UrlDecode(parts[0]).toString('utf8')) as PlaidJwtHeader;
    const body = JSON.parse(base64UrlDecode(parts[1]).toString('utf8')) as PlaidJwtBody;
    const signature = base64UrlDecode(parts[2]);
    return { header, body, signingInput: `${parts[0]}.${parts[1]}`, signature };
  } catch {
    return null;
  }
}

// Plaid signs ES256 as JOSE-flavoured R||S (64 bytes). node:crypto.verify
// wants DER ECDSA. Mirrors the helper in api/_handlers/plaid-webhook.ts.
function joseToDer(jose: Buffer): Buffer {
  if (jose.length !== 64) throw new Error(`expected 64-byte R||S signature, got ${jose.length}`);
  const r = jose.subarray(0, 32);
  const s = jose.subarray(32, 64);
  const trim = (buf: Buffer): Buffer => {
    let i = 0;
    while (i < buf.length - 1 && buf[i] === 0) i++;
    if (buf[i] & 0x80) return Buffer.concat([Buffer.from([0x00]), buf.subarray(i)]);
    return buf.subarray(i);
  };
  const rTrim = trim(r);
  const sTrim = trim(s);
  const derLen = 2 + rTrim.length + 2 + sTrim.length;
  return Buffer.concat([
    Buffer.from([0x30, derLen]),
    Buffer.from([0x02, rTrim.length]), rTrim,
    Buffer.from([0x02, sTrim.length]), sTrim,
  ]);
}

interface PlaidVerifyOptions {
  /** If provided, used as the HMAC key for the fallback path. */
  hmacSecret?: string;
  /** Client id for the JWK fetch (Plaid webhook_verification_key/get). */
  plaidClientId?: string;
  /** Secret for the JWK fetch. */
  plaidSecret?: string;
  /** sandbox | development | production. Defaults to sandbox. */
  plaidEnv?: string;
  /** Inject-for-test JWK fetcher. */
  fetchKey?: (kid: string) => Promise<crypto.KeyObject | null>;
}

const PLAID_BASE: Record<string, string> = {
  sandbox: 'https://sandbox.plaid.com',
  development: 'https://development.plaid.com',
  production: 'https://production.plaid.com',
};

async function defaultFetchPlaidKey(
  kid: string,
  clientId: string,
  secret: string,
  env: string,
): Promise<crypto.KeyObject | null> {
  const base = PLAID_BASE[env] || PLAID_BASE.sandbox;
  try {
    const res = await fetch(`${base}/webhook_verification_key/get`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, secret, key_id: kid }),
    });
    const data = (await res.json()) as {
      key?: { alg: string; crv: string; kty: string; use: string; x: string; y: string; kid: string };
    };
    if (!data.key) return null;
    return crypto.createPublicKey({ format: 'jwk', key: data.key });
  } catch {
    return null;
  }
}

/**
 * Verify a Plaid webhook. Prefers ES256 JWT verification via
 * `/webhook_verification_key/get`; falls back to HMAC-SHA256 over
 * `PLAID_WEBHOOK_SECRET` when Plaid credentials aren't configured.
 *
 * Structural validation (three-part JWT) always runs first — a malformed
 * header is never accepted.
 *
 * @throws WebhookVerificationError
 */
export async function verifyPlaidWebhook(
  rawBody: string | Buffer,
  verificationHeader: string | undefined,
  options: PlaidVerifyOptions = {},
): Promise<void> {
  if (!verificationHeader) {
    throw new WebhookVerificationError('plaid', 'missing_signature');
  }

  // Structural gate — three dot-separated base64url parts.
  const parts = verificationHeader.split('.');
  if (parts.length !== 3 || parts.some((p) => p.length === 0)) {
    throw new WebhookVerificationError('plaid', 'signature_malformed');
  }

  const raw = typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf8') : rawBody;
  const decoded = decodePlaidJwt(verificationHeader);

  // If the JWT is decodable AND Plaid credentials exist, do full ES256.
  const clientId = options.plaidClientId ?? process.env.PLAID_CLIENT_ID ?? '';
  const secret = options.plaidSecret ?? process.env.PLAID_SECRET ?? '';
  const env = options.plaidEnv ?? process.env.PLAID_ENV ?? 'sandbox';

  if (decoded && clientId && secret) {
    if (decoded.header.alg !== 'ES256') {
      throw new WebhookVerificationError('plaid', 'alg_not_supported');
    }
    // iat must be within 5 minutes (replay protection).
    const nowSec = Math.floor(Date.now() / 1000);
    if (!decoded.body.iat || nowSec - decoded.body.iat > 5 * 60) {
      throw new WebhookVerificationError('plaid', 'stale_iat');
    }
    const bodyHash = crypto.createHash('sha256').update(raw).digest('hex');
    if (bodyHash !== decoded.body.request_body_sha256) {
      throw new WebhookVerificationError('plaid', 'body_hash_mismatch');
    }
    const fetchKey = options.fetchKey
      ? options.fetchKey
      : (kid: string) => defaultFetchPlaidKey(kid, clientId, secret, env);
    const pubKey = await fetchKey(decoded.header.kid);
    if (!pubKey) {
      throw new WebhookVerificationError('plaid', 'key_not_found');
    }
    try {
      const derSig = joseToDer(decoded.signature);
      const ok = crypto.verify(
        'SHA256',
        Buffer.from(decoded.signingInput, 'utf8'),
        pubKey,
        derSig,
      );
      if (!ok) throw new WebhookVerificationError('plaid', 'signature_invalid');
      return;
    } catch (err) {
      if (err instanceof WebhookVerificationError) throw err;
      throw new WebhookVerificationError('plaid', 'signature_invalid', { cause: err });
    }
  }

  // Fallback: HMAC-SHA256 with shared secret.
  const hmacSecret = options.hmacSecret ?? process.env.PLAID_WEBHOOK_SECRET ?? '';
  if (!hmacSecret) {
    throw new WebhookVerificationError('plaid', 'no_verification_method');
  }
  const expected = crypto.createHmac('sha256', hmacSecret).update(raw).digest('hex');
  const provided = verificationHeader;
  // Timing-safe compare — lengths may differ (JWT vs hex), so normalise first.
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(provided, 'utf8');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new WebhookVerificationError('plaid', 'signature_invalid');
  }
}

// ─── USDC on-chain ──────────────────────────────────────────────────────

export interface USDCWebhookPayload {
  tx_signature: string;
  amount: number;          // Expected amount in token base units (6-decimal USDC → micro-dollars)
  recipient: string;       // Destination wallet (SPL token account OR owner address)
  mint: string;            // Token mint — canonical USDC is EPjFWdd5...
}

export interface USDCVerifyResult {
  confirmed: boolean;
  actualAmount: number;
}

// Injectable Connection factory for test mocking. Production default uses
// @solana/web3.js.
type SolanaConnectionLike = {
  getTransaction: (
    signature: string,
    config?: { commitment?: string; maxSupportedTransactionVersion?: number },
  ) => Promise<{
    meta?: {
      err: unknown;
      preTokenBalances?: Array<{ accountIndex: number; mint: string; owner?: string; uiTokenAmount: { amount: string } }>;
      postTokenBalances?: Array<{ accountIndex: number; mint: string; owner?: string; uiTokenAmount: { amount: string } }>;
    } | null;
    transaction?: {
      message: {
        staticAccountKeys?: Array<{ toBase58: () => string }>;
        accountKeys?: Array<{ toBase58: () => string }>;
      };
    };
  } | null>;
};

let connectionFactory: ((rpcUrl: string) => SolanaConnectionLike) | null = null;

/** Test hook — inject a fake Solana connection. */
export function __setUSDCConnectionFactory(factory: ((rpcUrl: string) => SolanaConnectionLike) | null): void {
  connectionFactory = factory;
}

async function getConnection(rpcUrl: string): Promise<SolanaConnectionLike> {
  if (connectionFactory) return connectionFactory(rpcUrl);
  const web3 = await import('@solana/web3.js');
  return new web3.Connection(rpcUrl, 'finalized') as unknown as SolanaConnectionLike;
}

/**
 * Verify a USDC on-chain payment. Checks:
 *   1. The transaction exists and is finalized.
 *   2. meta.err is null.
 *   3. A post-balance delta on the claimed mint, for the claimed recipient,
 *      matches the claimed amount (in base units).
 *
 * @throws WebhookVerificationError on missing fields, RPC failure, or mismatch.
 */
export async function verifyUSDCWebhook(
  payload: USDCWebhookPayload,
  rpcUrl: string,
): Promise<USDCVerifyResult> {
  if (!payload?.tx_signature) {
    throw new WebhookVerificationError('usdc', 'missing_tx_signature');
  }
  if (!payload.mint) {
    throw new WebhookVerificationError('usdc', 'missing_mint');
  }
  if (!payload.recipient) {
    throw new WebhookVerificationError('usdc', 'missing_recipient');
  }
  if (typeof payload.amount !== 'number' || payload.amount <= 0) {
    throw new WebhookVerificationError('usdc', 'invalid_amount');
  }
  if (!rpcUrl) {
    throw new WebhookVerificationError('usdc', 'missing_rpc_config');
  }

  let conn: SolanaConnectionLike;
  try {
    conn = await getConnection(rpcUrl);
  } catch (err) {
    throw new WebhookVerificationError('usdc', 'rpc_init_failed', { cause: err });
  }

  let tx: Awaited<ReturnType<SolanaConnectionLike['getTransaction']>>;
  try {
    tx = await conn.getTransaction(payload.tx_signature, {
      commitment: 'finalized',
      maxSupportedTransactionVersion: 0,
    });
  } catch (err) {
    throw new WebhookVerificationError('usdc', 'rpc_query_failed', { cause: err });
  }

  if (!tx) {
    throw new WebhookVerificationError('usdc', 'tx_not_found');
  }
  if (!tx.meta) {
    throw new WebhookVerificationError('usdc', 'tx_meta_missing');
  }
  if (tx.meta.err) {
    throw new WebhookVerificationError('usdc', 'tx_failed_onchain');
  }

  // Compute balance delta for (mint, recipient) across pre/post token balances.
  const pre = tx.meta.preTokenBalances ?? [];
  const post = tx.meta.postTokenBalances ?? [];

  // Match on mint first, then owner == recipient (owner-address form) OR
  // account-key-at-index == recipient (token-account form).
  const accountKeys =
    tx.transaction?.message.staticAccountKeys ??
    tx.transaction?.message.accountKeys ??
    [];

  function matchesRecipient(entry: { accountIndex: number; owner?: string }): boolean {
    if (entry.owner && entry.owner === payload.recipient) return true;
    const key = accountKeys[entry.accountIndex];
    if (key && typeof key.toBase58 === 'function' && key.toBase58() === payload.recipient) return true;
    return false;
  }

  const preAmt = pre
    .filter((p) => p.mint === payload.mint && matchesRecipient(p))
    .reduce((sum, p) => sum + Number(p.uiTokenAmount.amount), 0);
  const postAmt = post
    .filter((p) => p.mint === payload.mint && matchesRecipient(p))
    .reduce((sum, p) => sum + Number(p.uiTokenAmount.amount), 0);

  const delta = postAmt - preAmt;

  if (delta !== payload.amount) {
    throw new WebhookVerificationError('usdc', 'amount_mismatch', {
      cause: { expected: payload.amount, actual: delta },
    });
  }

  return { confirmed: true, actualAmount: delta };
}
