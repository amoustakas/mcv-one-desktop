// src/lib/payments/processors/solana.ts
//
// Solana Pay processor — real implementation.
//
// Flow:
//   createPayment → builds a Solana Pay URL with a unique `reference` PublicKey.
//                   UI renders the URL as a QR code; the user's mobile wallet
//                   (Phantom, Solflare, Backpack) signs and submits the tx.
//   getStatus     → uses findReference() to locate the on-chain tx by reference
//                   and validates it matches the expected recipient + amount.
//   refundPayment → returns a structured "refund request" payload. True on-chain
//                   refunds require a treasury signer and should flow through a
//                   server-side endpoint; we surface a clear error here rather
//                   than silently succeed.
//   getHealth     → pings the RPC node.
//
// Config (env):
//   VITE_SOLANA_NETWORK        = 'mainnet-beta' | 'devnet' | 'testnet'  (default: 'mainnet-beta')
//   VITE_SOLANA_RPC_URL        = custom RPC (Helius / QuickNode recommended)
//   VITE_SOLANA_TREASURY_WALLET = default recipient wallet (base58 pubkey)
//   VITE_SOLANA_USDC_MINT      = USDC SPL mint (defaults to canonical mainnet USDC)
//   VITE_SOLANA_EDGE_MINT      = EDGE token SPL mint (venture-specific)

import {
  Connection,
  PublicKey,
  Keypair,
  clusterApiUrl,
  type Finality,
} from '@solana/web3.js';
import { encodeURL, findReference, FindReferenceError, validateTransfer } from '@solana/pay';
import BigNumber from 'bignumber.js';
import type {
  PaymentProcessor,
  PaymentRequest,
  PaymentResult,
  RefundResult,
  FeeEstimate,
  ProcessorHealth,
  ProcessorCapability,
  PaymentMethod,
  PaymentStatus,
} from '../types';

// ── Fees ──
const SOLANA_TX_FEE_USD = 0.005;

// Canonical USDC mainnet mint (Circle).
const CANONICAL_USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

// ── Network / connection ──
function getNetwork(): 'mainnet-beta' | 'devnet' | 'testnet' {
  const n = (import.meta?.env?.VITE_SOLANA_NETWORK || 'mainnet-beta') as string;
  return (n === 'devnet' || n === 'testnet' ? n : 'mainnet-beta') as 'mainnet-beta' | 'devnet' | 'testnet';
}

function getRpcUrl(): string {
  const custom = import.meta?.env?.VITE_SOLANA_RPC_URL as string | undefined;
  if (custom) return custom;
  return clusterApiUrl(getNetwork());
}

let _connection: Connection | null = null;
function getConnection(): Connection {
  if (!_connection) _connection = new Connection(getRpcUrl(), 'confirmed');
  return _connection;
}

// ── Treasury / token mints ──
function getTreasuryWallet(): PublicKey {
  const raw = import.meta?.env?.VITE_SOLANA_TREASURY_WALLET as string | undefined;
  if (!raw) throw new Error('VITE_SOLANA_TREASURY_WALLET not configured');
  return new PublicKey(raw);
}

function getMintFor(currency: string): PublicKey | null {
  const up = currency.toUpperCase();
  if (up === 'SOL') return null; // native SOL transfer
  if (up === 'USDC') {
    const m = (import.meta?.env?.VITE_SOLANA_USDC_MINT as string | undefined) || CANONICAL_USDC_MINT;
    return new PublicKey(m);
  }
  if (up === 'EDGE') {
    const m = import.meta?.env?.VITE_SOLANA_EDGE_MINT as string | undefined;
    if (!m) throw new Error('VITE_SOLANA_EDGE_MINT not configured');
    return new PublicKey(m);
  }
  throw new Error(`Unsupported Solana currency: ${currency}`);
}

// ── In-memory reference store ──
// Maps internal paymentId → { reference, recipient, amount, splToken? }.
// In production this should be persisted (e.g. in the `payments` table's
// metadata column). For the processor layer we keep it in-memory so
// `getStatus()` / `refundPayment()` can find it.
interface ReferenceRecord {
  reference: PublicKey;
  recipient: PublicKey;
  amount: BigNumber;
  splToken?: PublicKey;
  createdAt: number;
}
const referenceStore = new Map<string, ReferenceRecord>();

// ── PROCESSOR ──

export const solanaProcessor: PaymentProcessor = {
  id: 'solana',
  name: 'Solana Pay',

  capabilities: ['one_time', 'crypto', 'p2p'] as ProcessorCapability[],
  supportedCurrencies: ['USDC', 'SOL', 'EDGE'],
  supportedCountries: ['*'],
  supportedMethods: ['usdc', 'sol', 'edge'] as PaymentMethod[],

  // ── createPayment ──
  // Build a Solana Pay transfer request URL. Returns the URL as
  // `processorPaymentId`; the UI renders it as a QR code.
  async createPayment(req: PaymentRequest): Promise<PaymentResult> {
    const fee = await this.estimateFee(req);
    try {
      const recipient = getTreasuryWallet(); // TODO: per-venture override via config table
      const splToken = getMintFor(req.currency);
      const amount = new BigNumber(req.amount);
      const reference = Keypair.generate().publicKey;

      const url = encodeURL({
        recipient,
        amount,
        splToken: splToken ?? undefined,
        reference,
        label: req.description?.slice(0, 60) || 'MCV Payment',
        message: `Venture: ${req.ventureId}`,
        memo: `mcv:${req.ventureId}:${reference.toBase58().slice(0, 8)}`,
      });

      const paymentId = `sol_${reference.toBase58().slice(0, 20)}`;
      referenceStore.set(paymentId, {
        reference,
        recipient,
        amount,
        splToken: splToken ?? undefined,
        createdAt: Date.now(),
      });

      return {
        success: true,
        paymentId,
        processorId: 'solana',
        processorPaymentId: url.toString(),
        status: 'pending',
        amount: req.amount,
        currency: req.currency,
        fee,
      };
    } catch (e) {
      return {
        success: false,
        paymentId: '',
        processorId: 'solana',
        processorPaymentId: null,
        status: 'failed',
        amount: req.amount,
        currency: req.currency,
        fee,
        error: e instanceof Error ? e.message : 'Solana createPayment failed',
      };
    }
  },

  // ── refundPayment ──
  // On-chain Solana refunds require a treasury signer and network access that
  // belongs on a server endpoint (api/solana-refund.ts), not in the browser.
  // Return a structured error so the router falls back or escalates.
  async refundPayment(paymentId: string, _amount?: number): Promise<RefundResult> {
    const record = referenceStore.get(paymentId);
    if (!record) {
      return {
        success: false,
        refundId: '',
        amount: 0,
        error: `Unknown Solana payment: ${paymentId}. Refund must be processed via server endpoint with treasury signer.`,
      };
    }
    return {
      success: false,
      refundId: '',
      amount: 0,
      error: 'Solana refunds require a server-side treasury signer. Route to /api/solana-refund.',
    };
  },

  // ── getStatus ──
  // Look up the reference on-chain. If found, validate it matches expected
  // recipient/amount/token, then return 'succeeded'.
  async getStatus(paymentId: string): Promise<PaymentStatus> {
    const record = referenceStore.get(paymentId);
    if (!record) return 'failed';

    const connection = getConnection();
    const finality: Finality = 'confirmed';

    try {
      const sigInfo = await findReference(connection, record.reference, { finality });
      // Validate the transfer matches our expected parameters.
      await validateTransfer(
        connection,
        sigInfo.signature,
        {
          recipient: record.recipient,
          amount: record.amount,
          splToken: record.splToken,
          reference: record.reference,
        },
        { commitment: finality },
      );
      return 'succeeded';
    } catch (e) {
      if (e instanceof FindReferenceError) return 'pending';
      return 'failed';
    }
  },

  // ── estimateFee ──
  async estimateFee(_req: PaymentRequest): Promise<FeeEstimate> {
    return {
      fixedFee: SOLANA_TX_FEE_USD,
      percentageFee: 0,
      totalFee: SOLANA_TX_FEE_USD,
      currency: 'USD',
      networkFee: SOLANA_TX_FEE_USD,
    };
  },

  // ── getHealth ──
  async getHealth(): Promise<ProcessorHealth> {
    const start = Date.now();
    try {
      const connection = getConnection();
      // getVersion is lightweight and doesn't require any auth.
      await connection.getVersion();
      return {
        processorId: 'solana',
        status: 'healthy',
        latencyMs: Date.now() - start,
        successRate: 0.98,
        lastChecked: new Date().toISOString(),
      };
    } catch {
      return {
        processorId: 'solana',
        status: 'degraded',
        latencyMs: Date.now() - start,
        successRate: 0,
        lastChecked: new Date().toISOString(),
      };
    }
  },
};
