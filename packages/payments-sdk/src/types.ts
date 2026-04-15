// src/lib/payments/types.ts

import { z } from 'zod';

// ── PROCESSOR CAPABILITIES ──
export const ProcessorCapability = z.enum([
  'one_time', 'recurring', 'invoicing', 'payout', 'refund',
  'dispute', 'connect', 'pos', 'crypto', 'p2p', 'bnpl', 'credits',
]);
export type ProcessorCapability = z.infer<typeof ProcessorCapability>;

export const PaymentMethod = z.enum([
  'card', 'ach', 'sepa', 'interac', 'wire', 'paypal',
  'apple_pay', 'google_pay', 'usdc', 'sol', 'btc', 'edge',
  'platform_credit', 'invoice',
]);
export type PaymentMethod = z.infer<typeof PaymentMethod>;

export const PaymentStatus = z.enum([
  'pending', 'processing', 'succeeded', 'failed',
  'refunded', 'partially_refunded', 'disputed', 'canceled',
]);
export type PaymentStatus = z.infer<typeof PaymentStatus>;

// ── PROCESSOR INTERFACE ──
// Every payment processor implements this
export interface PaymentProcessor {
  id: string;
  name: string;
  capabilities: ProcessorCapability[];
  supportedCurrencies: string[];
  supportedCountries: string[];
  supportedMethods: PaymentMethod[];

  createPayment(req: PaymentRequest): Promise<PaymentResult>;
  refundPayment(paymentId: string, amount?: number): Promise<RefundResult>;
  getStatus(paymentId: string): Promise<PaymentStatus>;
  estimateFee(req: PaymentRequest): Promise<FeeEstimate>;
  getHealth(): Promise<ProcessorHealth>;
}

// ── PAYMENT REQUEST / RESULT ──
export const PaymentRequestSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().min(2).max(10),
  method: PaymentMethod.nullable().default(null), // null = let router decide
  customerId: z.string().nullable().default(null),
  customerCountry: z.string().length(2).default('US'),
  ventureId: z.string(),
  description: z.string().max(500).default(''),
  metadata: z.record(z.string(), z.unknown()).default({}),
});
export type PaymentRequest = z.infer<typeof PaymentRequestSchema>;

export interface PaymentResult {
  success: boolean;
  paymentId: string;
  processorId: string;
  processorPaymentId: string | null; // external ID (e.g., Stripe pi_xxx)
  status: PaymentStatus;
  amount: number;
  currency: string;
  fee: FeeEstimate;
  error?: string;
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  amount: number;
  error?: string;
}

export interface FeeEstimate {
  fixedFee: number;
  percentageFee: number;
  totalFee: number;
  currency: string;
  networkFee?: number;
}

export interface ProcessorHealth {
  processorId: string;
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number;
  successRate: number; // 0-1
  lastChecked: string;
}

// ── ROUTING ──
export interface RoutingRequest {
  amount: number;
  currency: string;
  customerCountry: string;
  paymentMethod: PaymentMethod | null;
  urgency: 'instant' | 'same_day' | 'standard';
  ventureId: string;
  customerId: string | null;
  isRecurring: boolean;
  /** Optional per-request hints — `preferred_processor` forces the scoring
   *  layer to weight a specific processor above all others (used by
   *  Capital payment_processor_config for per-venture per-method routing). */
  metadata?: Record<string, unknown>;
}

export interface RoutingDecision {
  primaryRail: string;
  fallbackRails: string[];
  estimatedFee: FeeEstimate;
  estimatedSettlement: string;
  reasoning: string;
  savingsVsDefault: number;
}

export interface RoutingFactors {
  cost: number;      // weight: 0.35
  speed: number;     // weight: 0.20
  reliability: number; // weight: 0.20
  compliance: number;  // weight: 0.10
  preference: number;  // weight: 0.15
}

// ── SPLIT PAYMENTS ──
export const SplitPaymentRequestSchema = z.object({
  totalAmount: z.number().positive(),
  currency: z.string().min(2).max(10),
  ventureId: z.string(),
  description: z.string().max(500).default(''),
  splits: z.array(z.object({
    recipientId: z.string(),
    recipientType: z.enum(['venture', 'user', 'platform', 'tax_authority', 'external']),
    amount: z.number().min(0),
    percentage: z.number().min(0).max(100).optional(),
    rail: z.string().optional(),
    description: z.string(),
    ledgerAccount: z.string(), // account code
    timing: z.enum(['immediate', 'on_settlement', 'deferred']).default('immediate'),
  })).min(1),
  metadata: z.record(z.string(), z.unknown()).default({}),
});
export type SplitPaymentRequest = z.infer<typeof SplitPaymentRequestSchema>;

export interface SplitPaymentResult {
  success: boolean;
  splitPaymentId: string;
  items: Array<{
    recipientId: string;
    amount: number;
    status: PaymentStatus;
    rail: string;
    journalEntryId: string | null;
  }>;
  totalFees: number;
  error?: string;
}

// ── VENTURE PAYMENT CONFIG ──
export const VenturePaymentConfigSchema = z.object({
  ventureId: z.string(),
  enabledProcessors: z.array(z.string()),
  preferredRail: z.string().nullable().default(null),
  platformFee: z.object({
    type: z.enum(['percentage', 'flat', 'tiered']),
    value: z.number().min(0),
    tiers: z.array(z.object({
      minAmount: z.number(),
      maxAmount: z.number(),
      feePercent: z.number(),
    })).optional(),
  }),
  autoPayoutSchedule: z.enum(['daily', 'weekly', 'monthly', 'manual']).default('weekly'),
  autoPayoutMinimum: z.number().min(0).default(100),
  cryptoEnabled: z.boolean().default(false),
  creditSystemEnabled: z.boolean().default(true),
  invoicingEnabled: z.boolean().default(true),
});
export type VenturePaymentConfig = z.infer<typeof VenturePaymentConfigSchema>;
