// src/lib/compliance/types.ts
// Compliance types — Fraud Detection, Dunning, Tax Engine, Price Localization
// MCV Commerce & Financial OS — Plan 6

// ─────────────────────────────────────────────────────────
// FRAUD DETECTION
// ─────────────────────────────────────────────────────────

export type FraudSignalType =
  | 'velocity_amount'
  | 'velocity_count'
  | 'geo_mismatch'
  | 'device_fingerprint'
  | 'card_testing'
  | 'account_age'
  | 'unusual_amount'
  | 'repeated_decline';

export type FraudSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface FraudSignal {
  type: FraudSignalType;
  severity: FraudSeverity;
  description: string;
  score: number; // 0-100 contribution to total risk score
}

export type FraudDecision = 'allow' | 'review' | 'block';

export interface FraudCheckResult {
  transactionId: string;
  riskScore: number; // 0-100
  decision: FraudDecision;
  signals: FraudSignal[];
  requiresVerification: boolean;
}

export type FraudRuleAction = 'block' | 'review' | 'require_3ds' | 'flag' | 'add_score';

export interface FraudRule {
  id: string;
  ventureId: string;
  name: string;
  condition: string; // string expression evaluated at runtime
  action: FraudRuleAction;
  scoreImpact: number;
  enabled: boolean;
}

// ─────────────────────────────────────────────────────────
// DUNNING
// ─────────────────────────────────────────────────────────

export type PaymentRail = 'stripe' | 'paypal' | 'crypto' | 'ach' | 'sepa' | 'wire';
export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app';
export type NotificationTone = 'friendly' | 'neutral' | 'urgent';
export type DunningFinalAction = 'cancel' | 'pause' | 'downgrade_to_free';
export type DunningStatus = 'active' | 'recovered' | 'exhausted' | 'canceled';

export interface DunningRetryStep {
  dayAfterFailure: number;
  retryTime: string; // HH:MM in UTC
  rail: PaymentRail;
}

export interface DunningNotificationStep {
  dayAfterFailure: number;
  channel: NotificationChannel;
  template: string;
  tone: NotificationTone;
}

export interface DunningConfig {
  ventureId: string;
  retrySchedule: DunningRetryStep[];
  notificationSchedule: DunningNotificationStep[];
  gracePeriodDays: number;
  finalAction: DunningFinalAction;
  smartRetryEnabled: boolean;
}

export interface DunningState {
  id: string;
  subscriptionId: string;
  paymentIntentId: string;
  failedAt: string; // ISO timestamp
  retryCount: number;
  nextRetryAt: string | null; // ISO timestamp
  status: DunningStatus;
  recoveredAt: string | null; // ISO timestamp
}

// ─────────────────────────────────────────────────────────
// TAX ENGINE
// ─────────────────────────────────────────────────────────

export type TaxType = 'sales' | 'vat' | 'gst' | 'hst' | 'pst' | 'qst';
export type FilingFrequency = 'monthly' | 'quarterly' | 'annually';

export interface TaxLineItem {
  id: string;
  description: string;
  amount: number; // in cents
  quantity: number;
  category?: string; // product category for category-specific rates
  taxExempt?: boolean;
}

export interface CustomerLocation {
  country: string; // ISO 3166-1 alpha-2
  state?: string; // ISO 3166-2 subdivision code
  postalCode?: string;
  city?: string;
}

export interface TaxCalculationRequest {
  ventureId: string;
  lineItems: TaxLineItem[];
  customerLocation: CustomerLocation;
  sellerLocation?: CustomerLocation;
  isB2B: boolean;
  customerVatId?: string;
  shippingAmount?: number; // in cents
  discountAmount?: number; // in cents
}

export interface TaxComponent {
  jurisdiction: string;
  name: string;
  rate: number; // e.g. 0.0725 for 7.25%
  amount: number; // in cents
  taxType: TaxType;
  compound: boolean; // true = tax-on-tax (e.g. QST on subtotal+GST)
  inclusive: boolean; // true = tax already included in price (EU VAT)
}

export interface TaxBreakdown {
  subtotal: number; // in cents
  taxableAmount: number; // in cents
  totalTax: number; // in cents
  components: TaxComponent[];
  exemptAmount: number; // in cents
  effectiveRate: number; // e.g. 0.1325 for 13.25%
}

export interface NexusThreshold {
  type: 'revenue' | 'transactions' | 'physical_presence';
  threshold: number;
  period: string; // e.g. 'calendar_year', 'rolling_12_months'
}

export interface TaxJurisdiction {
  id: string;
  code: string; // e.g. 'US-CA', 'CA-ON', 'EU-DE'
  country: string;
  state?: string;
  name: string;
  taxType: TaxType;
  defaultRate: number;
  filingFrequency: FilingFrequency;
  filingDeadlineDays: number;
  nexusThresholds?: NexusThreshold[];
}

// ─────────────────────────────────────────────────────────
// PRICE LOCALIZATION
// ─────────────────────────────────────────────────────────

export type PricingStrategy = 'purchasing_power_parity' | 'exchange_rate_only' | 'manual_override';
export type RoundingRule = 'nearest_dollar' | 'nearest_5' | 'nearest_10' | 'psychological' | 'none';

export interface CountryPriceOverride {
  country: string; // ISO 3166-1 alpha-2
  multiplier?: number; // override the default PPP multiplier
  fixedPrice?: number; // fixed price in local currency (overrides calculation entirely)
  currency?: string; // local currency code
  enabled: boolean;
}

export interface PriceLocalizationConfig {
  ventureId: string;
  enabled: boolean;
  baseCurrency: string; // e.g. 'USD'
  strategy: PricingStrategy;
  roundingRule: RoundingRule;
  countryOverrides: CountryPriceOverride[];
}

export interface LocalizedPrice {
  originalAmount: number; // in base currency cents
  localizedAmount: number; // in target currency cents
  baseCurrency: string;
  targetCurrency: string;
  country: string;
  multiplier: number;
  strategy: PricingStrategy;
}
