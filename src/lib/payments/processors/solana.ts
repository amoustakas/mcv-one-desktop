// src/lib/payments/processors/solana.ts
//
// Solana Pay processor — STUB implementation.
// Returns mock/error responses until the @solana/web3.js integration is built.
//
// TODO: Implement with @solana/web3.js + @solana/pay
//   - createPayment  → construct a Solana Pay transaction URL / QR
//   - refundPayment  → construct a reverse transfer instruction
//   - getStatus      → poll the Solana RPC for transaction confirmation
//   - getHealth      → ping an RPC node (helius.dev or custom)

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

// ── SOLANA TX FEE ─────────────────────────────────────────────────────────────
// Solana transaction fee is ~0.000005 SOL ≈ $0.005 USD at typical prices.
const SOLANA_TX_FEE_USD = 0.005;

// ── STUB MESSAGE ────────────────────────────────────────────────────────────
const STUB_ERROR = 'Solana Pay integration pending — use Platform Credits or Stripe';

// ── PROCESSOR ────────────────────────────────────────────────────────────────

export const solanaProcessor: PaymentProcessor = {
  id: 'solana',
  name: 'Solana Pay',

  capabilities: ['one_time', 'crypto', 'p2p'] as ProcessorCapability[],

  supportedCurrencies: ['USDC', 'SOL', 'EDGE'],

  // Solana Pay has no country restrictions — it's permissionless.
  supportedCountries: ['*'],

  supportedMethods: ['usdc', 'sol', 'edge'] as PaymentMethod[],

  // ── createPayment ──────────────────────────────────────────────────────────
  // TODO: Implement with @solana/web3.js
  //   1. Resolve recipient wallet from ventureId config
  //   2. Build a SPL-token transfer instruction (USDC / EDGE) or SOL transfer
  //   3. Return a Solana Pay URL (solana:<recipient>?amount=X&spl-token=X)
  //   4. The UI layer renders this as a QR code for mobile wallet scanning
  async createPayment(req: PaymentRequest): Promise<PaymentResult> {
    const fee = await this.estimateFee(req);
    return {
      success: false,
      paymentId: '',
      processorId: 'solana',
      processorPaymentId: null,
      status: 'failed',
      amount: req.amount,
      currency: req.currency,
      fee,
      error: STUB_ERROR,
    };
  },

  // ── refundPayment ──────────────────────────────────────────────────────────
  // TODO: Implement with @solana/web3.js
  //   Solana has no native refund — build a reverse transfer transaction
  //   signed by the venture's treasury wallet.
  async refundPayment(_paymentId: string, _amount?: number): Promise<RefundResult> {
    return {
      success: false,
      refundId: '',
      amount: 0,
      error: STUB_ERROR,
    };
  },

  // ── getStatus ─────────────────────────────────────────────────────────────
  // TODO: Implement with @solana/web3.js
  //   Poll RPC getTransaction(signature, { commitment: 'confirmed' })
  //   Map confirmationStatus → PaymentStatus
  async getStatus(_paymentId: string): Promise<PaymentStatus> {
    return 'failed';
  },

  // ── estimateFee ───────────────────────────────────────────────────────────
  // Solana fees are near-zero: flat ~$0.005 per transaction, no percentage.
  async estimateFee(_req: PaymentRequest): Promise<FeeEstimate> {
    return {
      fixedFee: SOLANA_TX_FEE_USD,
      percentageFee: 0,
      totalFee: SOLANA_TX_FEE_USD,
      currency: 'USD',
      networkFee: SOLANA_TX_FEE_USD,
    };
  },

  // ── getHealth ─────────────────────────────────────────────────────────────
  // Returns 'degraded' because this is an unimplemented stub.
  // TODO: ping an RPC node — e.g. https://api.mainnet-beta.solana.com
  //   or a Helius endpoint for higher reliability
  async getHealth(): Promise<ProcessorHealth> {
    return {
      processorId: 'solana',
      status: 'degraded',
      latencyMs: 0,
      successRate: 0,
      lastChecked: new Date().toISOString(),
    };
  },
};
