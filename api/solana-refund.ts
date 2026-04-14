import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
  type Finality,
} from '@solana/web3.js';
import {
  createTransferCheckedInstruction,
  getOrCreateAssociatedTokenAccount,
  getMint,
} from '@solana/spl-token';
import bs58 from 'bs58';
import { emitPaymentEvent } from './_payment-events.js';

// ---------------------------------------------------------------------------
// /api/solana-refund — server-side Solana refund with treasury signer.
//
// Requires server-only env vars:
//   SOLANA_NETWORK           — 'mainnet-beta' | 'devnet' (default: mainnet-beta)
//   SOLANA_RPC_URL           — custom RPC (Helius / QuickNode) [optional]
//   SOLANA_TREASURY_SECRET   — base58-encoded secret key OR JSON array of 64 bytes
//   SOLANA_USDC_MINT         — USDC mint (default: canonical mainnet USDC)
//   SOLANA_EDGE_MINT         — EDGE token mint
//
// Input:
//   {
//     venture_id: string,
//     recipient_wallet: string (base58),  // original payer, now refund recipient
//     amount: number,                      // major units (e.g. 12.50)
//     currency: 'SOL' | 'USDC' | 'EDGE',
//     original_signature?: string,         // optional audit link
//     original_payment_id?: string,        // our internal id (for logging)
//   }
// ---------------------------------------------------------------------------

const CANONICAL_USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

async function requireAuth(req: VercelRequest, res: VercelResponse): Promise<string | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return 'no-secret';
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.cookies?.__session || null);
  if (!token) { res.status(401).json({ error: 'Authentication required' }); return null; }
  try {
    const { verifyToken } = await import('@clerk/backend');
    const payload = await verifyToken(token, { secretKey });
    return payload.sub;
  } catch { res.status(401).json({ error: 'Invalid session' }); return null; }
}

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
);

function getConnection(): Connection {
  const custom = process.env.SOLANA_RPC_URL;
  if (custom) return new Connection(custom, 'confirmed');
  const net = (process.env.SOLANA_NETWORK || 'mainnet-beta') as 'mainnet-beta' | 'devnet' | 'testnet';
  return new Connection(clusterApiUrl(net === 'testnet' ? 'testnet' : net === 'devnet' ? 'devnet' : 'mainnet-beta'), 'confirmed');
}

function getTreasuryKeypair(): Keypair {
  const raw = process.env.SOLANA_TREASURY_SECRET;
  if (!raw) throw new Error('SOLANA_TREASURY_SECRET not configured');
  // Accept either JSON array of bytes or base58 string.
  if (raw.trim().startsWith('[')) {
    const arr = JSON.parse(raw) as number[];
    return Keypair.fromSecretKey(Uint8Array.from(arr));
  }
  return Keypair.fromSecretKey(bs58.decode(raw.trim()));
}

function getMintFor(currency: string): PublicKey | null {
  const up = currency.toUpperCase();
  if (up === 'SOL') return null;
  if (up === 'USDC') return new PublicKey(process.env.SOLANA_USDC_MINT || CANONICAL_USDC_MINT);
  if (up === 'EDGE') {
    const m = process.env.SOLANA_EDGE_MINT;
    if (!m) throw new Error('SOLANA_EDGE_MINT not configured');
    return new PublicKey(m);
  }
  throw new Error(`Unsupported currency: ${currency}`);
}

// logEvent replaced by the shared emitPaymentEvent helper. See imports.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res); if (!userId) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });

  const { venture_id, recipient_wallet, amount, currency, original_signature, original_payment_id } = req.body as {
    venture_id: string;
    recipient_wallet: string;
    amount: number;
    currency: string;
    original_signature?: string;
    original_payment_id?: string;
  };

  if (!venture_id || !recipient_wallet || !amount || !currency) {
    return res.status(400).json({ error: 'venture_id, recipient_wallet, amount, currency required' });
  }
  if (amount <= 0) return res.status(400).json({ error: 'amount must be positive' });

  try {
    const connection = getConnection();
    const treasury = getTreasuryKeypair();
    const recipient = new PublicKey(recipient_wallet);
    const mint = getMintFor(currency);
    const finality: Finality = 'confirmed';

    let signature: string;

    if (!mint) {
      // Native SOL refund
      const lamports = Math.round(amount * LAMPORTS_PER_SOL);
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: treasury.publicKey,
          toPubkey: recipient,
          lamports,
        }),
      );
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash(finality);
      tx.recentBlockhash = blockhash;
      tx.feePayer = treasury.publicKey;
      tx.sign(treasury);
      signature = await connection.sendRawTransaction(tx.serialize());
      await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, finality);
    } else {
      // SPL token refund (USDC / EDGE)
      const mintInfo = await getMint(connection, mint);
      const decimals = mintInfo.decimals;
      const raw = BigInt(Math.round(amount * Math.pow(10, decimals)));

      const treasuryAta = await getOrCreateAssociatedTokenAccount(connection, treasury, mint, treasury.publicKey);
      const recipientAta = await getOrCreateAssociatedTokenAccount(connection, treasury, mint, recipient);

      const tx = new Transaction().add(
        createTransferCheckedInstruction(
          treasuryAta.address,
          mint,
          recipientAta.address,
          treasury.publicKey,
          raw,
          decimals,
        ),
      );
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash(finality);
      tx.recentBlockhash = blockhash;
      tx.feePayer = treasury.publicKey;
      tx.sign(treasury);
      signature = await connection.sendRawTransaction(tx.serialize());
      await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, finality);
    }

    await emitPaymentEvent({
      event_type: 'refund.succeeded',
      processor: 'solana',
      venture_id,
      actor: userId,
      payment_id: original_payment_id ?? null,
      external_id: signature,
      external_signature: signature,
      amount_cents: Math.round(amount * 100),
      currency: currency.toUpperCase(),
      status: 'succeeded',
      payload: {
        original_signature,
        recipient: recipient_wallet,
        treasury: treasury.publicKey.toBase58(),
      },
    });

    return res.json({
      success: true,
      refund_signature: signature,
      amount,
      currency,
      recipient: recipient_wallet,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Refund failed';
    await emitPaymentEvent({
      event_type: 'refund.failed',
      processor: 'solana',
      venture_id,
      actor: userId,
      payment_id: original_payment_id ?? null,
      amount_cents: Math.round(amount * 100),
      currency: currency.toUpperCase(),
      status: 'failed',
      error_message: msg,
      payload: {
        original_signature,
        recipient: recipient_wallet,
      },
    });
    return res.status(500).json({ error: msg });
  }
}
