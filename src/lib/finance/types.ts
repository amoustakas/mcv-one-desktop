// src/lib/finance/types.ts
// Financial Reporting Types — MCV Commerce & Financial OS
// Covers: Income Statement, Balance Sheet, Cash Flow, Real-Time Metrics, Cost Intelligence

import { z } from 'zod';

// ─────────────────────────────────────────────────────────
// REPORT SCOPE
// ─────────────────────────────────────────────────────────

export const ReportLevelSchema = z.enum(['global', 'venture', 'customer']);
export type ReportLevel = z.infer<typeof ReportLevelSchema>;

export const DateRangeSchema = z.object({
  start: z.string().date(),
  end: z.string().date(),
});
export type DateRange = z.infer<typeof DateRangeSchema>;

export const ReportScopeSchema = z.object({
  level: ReportLevelSchema,
  ventureId: z.string().optional(),
  customerId: z.string().optional(),
  dateRange: DateRangeSchema,
  currency: z.string().min(2).max(10).default('USD'),
  comparePeriod: DateRangeSchema.optional(),
});
export type ReportScope = z.infer<typeof ReportScopeSchema>;

// ─────────────────────────────────────────────────────────
// COMPARISON
// ─────────────────────────────────────────────────────────

export const ComparisonSchema = z.object({
  amount: z.number(),
  percentage: z.number(),
});
export type Comparison = z.infer<typeof ComparisonSchema>;

// ─────────────────────────────────────────────────────────
// INCOME STATEMENT
// ─────────────────────────────────────────────────────────

export const RevenueBreakdownSchema = z.object({
  subscriptions: z.number().default(0),
  oneTimeSales: z.number().default(0),
  digitalProducts: z.number().default(0),
  physicalGoods: z.number().default(0),
  platformFees: z.number().default(0),
  transactionFees: z.number().default(0),
  creditSales: z.number().default(0),
  loanInterest: z.number().default(0),
  marketplaceCommissions: z.number().default(0),
  meteredUsage: z.number().default(0),
  services: z.number().default(0),
  total: z.number(),
});
export type RevenueBreakdown = z.infer<typeof RevenueBreakdownSchema>;

export const CostOfRevenueSchema = z.object({
  physicalGoodsCost: z.number().default(0),
  digitalDeliveryCost: z.number().default(0),
  paymentProcessingFees: z.number().default(0),
  refundsAndChargebacks: z.number().default(0),
  total: z.number(),
});
export type CostOfRevenue = z.infer<typeof CostOfRevenueSchema>;

export const OperatingExpensesSchema = z.object({
  infrastructure: z.number().default(0),
  thirdPartyServices: z.number().default(0),
  creditGrants: z.number().default(0),
  loanWriteoffs: z.number().default(0),
  total: z.number(),
});
export type OperatingExpenses = z.infer<typeof OperatingExpensesSchema>;

export const IncomeStatementSchema = z.object({
  scope: ReportScopeSchema,
  revenue: RevenueBreakdownSchema,
  costOfRevenue: CostOfRevenueSchema,
  grossProfit: z.number(),
  grossMargin: z.number(),
  operatingExpenses: OperatingExpensesSchema,
  operatingIncome: z.number(),
  netIncome: z.number(),
  comparison: ComparisonSchema.optional(),
  generatedAt: z.string().datetime(),
});
export type IncomeStatement = z.infer<typeof IncomeStatementSchema>;

// ─────────────────────────────────────────────────────────
// BALANCE SHEET
// ─────────────────────────────────────────────────────────

export const CurrentAssetsSchema = z.object({
  cashAndEquivalents: z.number().default(0),
  accountsReceivable: z.number().default(0),
  inventory: z.number().default(0),
  creditsReceivable: z.number().default(0),
  loansReceivable: z.number().default(0),
  prepaidExpenses: z.number().default(0),
  total: z.number(),
});
export type CurrentAssets = z.infer<typeof CurrentAssetsSchema>;

export const NonCurrentAssetsSchema = z.object({
  equipment: z.number().default(0),
  investments: z.number().default(0),
  tokenTreasury: z.number().default(0),
  total: z.number(),
});
export type NonCurrentAssets = z.infer<typeof NonCurrentAssetsSchema>;

export const CurrentLiabilitiesSchema = z.object({
  accountsPayable: z.number().default(0),
  creditsPayable: z.number().default(0),
  unearnedRevenue: z.number().default(0),
  taxPayable: z.number().default(0),
  refundsPayable: z.number().default(0),
  total: z.number(),
});
export type CurrentLiabilities = z.infer<typeof CurrentLiabilitiesSchema>;

export const NonCurrentLiabilitiesSchema = z.object({
  loansPayable: z.number().default(0),
  total: z.number(),
});
export type NonCurrentLiabilities = z.infer<typeof NonCurrentLiabilitiesSchema>;

export const EquitySchema = z.object({
  ownersEquity: z.number().default(0),
  retainedEarnings: z.number().default(0),
  tokenTreasury: z.number().default(0),
  totalEquity: z.number(),
});
export type Equity = z.infer<typeof EquitySchema>;

export const BalanceSheetSchema = z.object({
  scope: ReportScopeSchema,
  assets: z.object({
    current: CurrentAssetsSchema,
    nonCurrent: NonCurrentAssetsSchema,
  }),
  totalAssets: z.number(),
  liabilities: z.object({
    current: CurrentLiabilitiesSchema,
    nonCurrent: NonCurrentLiabilitiesSchema,
  }),
  totalLiabilities: z.number(),
  equity: EquitySchema,
  balanced: z.boolean(), // totalAssets === totalLiabilities + equity.totalEquity
  generatedAt: z.string().datetime(),
});
export type BalanceSheet = z.infer<typeof BalanceSheetSchema>;

// ─────────────────────────────────────────────────────────
// CASH FLOW STATEMENT
// ─────────────────────────────────────────────────────────

export const OperatingCashFlowSchema = z.object({
  netIncome: z.number(),
  adjustments: z.object({
    depreciation: z.number().default(0),
    arChange: z.number().default(0),      // positive = AR decrease (inflow)
    apChange: z.number().default(0),      // positive = AP increase (inflow)
    inventoryChange: z.number().default(0),
    unearnedRevenueChange: z.number().default(0),
    creditsPayableChange: z.number().default(0),
    other: z.number().default(0),
  }),
  netOperatingCashFlow: z.number(),
});
export type OperatingCashFlow = z.infer<typeof OperatingCashFlowSchema>;

export const InvestingCashFlowSchema = z.object({
  equipmentPurchases: z.number().default(0),
  investmentPurchases: z.number().default(0),
  investmentSales: z.number().default(0),
  netInvestingCashFlow: z.number(),
});
export type InvestingCashFlow = z.infer<typeof InvestingCashFlowSchema>;

export const FinancingCashFlowSchema = z.object({
  loanProceeds: z.number().default(0),
  loanRepayments: z.number().default(0),
  equityContributions: z.number().default(0),
  equityDistributions: z.number().default(0),
  netFinancingCashFlow: z.number(),
});
export type FinancingCashFlow = z.infer<typeof FinancingCashFlowSchema>;

export const CashFlowStatementSchema = z.object({
  scope: ReportScopeSchema,
  operating: OperatingCashFlowSchema,
  investing: InvestingCashFlowSchema,
  financing: FinancingCashFlowSchema,
  netCashChange: z.number(),
  beginningCash: z.number(),
  endingCash: z.number(),
  generatedAt: z.string().datetime(),
});
export type CashFlowStatement = z.infer<typeof CashFlowStatementSchema>;

// ─────────────────────────────────────────────────────────
// AR AGING
// ─────────────────────────────────────────────────────────

export const ArAgingSchema = z.object({
  current: z.number().default(0),
  days30: z.number().default(0),
  days60: z.number().default(0),
  days90: z.number().default(0),
  days90plus: z.number().default(0),
});
export type ArAging = z.infer<typeof ArAgingSchema>;

// ─────────────────────────────────────────────────────────
// REAL-TIME METRICS
// ─────────────────────────────────────────────────────────

export const RevenueByRailSchema = z.record(z.string(), z.number());
export type RevenueByRail = z.infer<typeof RevenueByRailSchema>;

export const RevenueByVentureSchema = z.record(z.string(), z.number());
export type RevenueByVenture = z.infer<typeof RevenueByVentureSchema>;

export const RevenueByProductTypeSchema = z.record(z.string(), z.number());
export type RevenueByProductType = z.infer<typeof RevenueByProductTypeSchema>;

export const RevenueByCountrySchema = z.record(z.string(), z.number());
export type RevenueByCountry = z.infer<typeof RevenueByCountrySchema>;

export const RealTimeMetricsSchema = z.object({
  ventureId: z.string(),
  // Subscription metrics
  mrr: z.number(),
  arr: z.number(),
  activeSubscriptions: z.number().int(),
  churnRate30d: z.number(), // 0-1
  ltv: z.number(),
  // Revenue metrics
  netRevenue24h: z.number(),
  netRevenue7d: z.number(),
  netRevenue30d: z.number(),
  revenueGrowthMoM: z.number(), // percentage, e.g. 0.12 = 12%
  // Cash & burn
  burnRate: z.number(),        // per month
  runway: z.number(),          // months
  // Balances
  outstandingCredits: z.number(),
  outstandingLoans: z.number(),
  // Processing
  processingFeesTotal30d: z.number(),
  smartRoutingSavings30d: z.number(),
  // Revenue slices
  revenueByRail: RevenueByRailSchema,
  revenueByVenture: RevenueByVentureSchema,
  revenueByProductType: RevenueByProductTypeSchema,
  revenueByCountry: RevenueByCountrySchema,
  // AR aging
  arAging: ArAgingSchema,
  // Metadata
  calculatedAt: z.string().datetime(),
});
export type RealTimeMetrics = z.infer<typeof RealTimeMetricsSchema>;

// ─────────────────────────────────────────────────────────
// COST INTELLIGENCE
// ─────────────────────────────────────────────────────────

export const CostRecommendationTypeSchema = z.enum([
  'switch_rail',
  'increase_crypto',
  'batch_payouts',
  'negotiate_rates',
  'reduce_chargebacks',
  'optimize_credits',
]);
export type CostRecommendationType = z.infer<typeof CostRecommendationTypeSchema>;

export const CostRecommendationEffortSchema = z.enum(['low', 'medium', 'high']);
export type CostRecommendationEffort = z.infer<typeof CostRecommendationEffortSchema>;

export const CostRecommendationSchema = z.object({
  type: CostRecommendationTypeSchema,
  title: z.string(),
  description: z.string(),
  estimatedMonthlySavings: z.number(),
  effort: CostRecommendationEffortSchema,
  ventureId: z.string().optional(),
  priority: z.number().int().min(1),
});
export type CostRecommendation = z.infer<typeof CostRecommendationSchema>;

export const FeesByProcessorSchema = z.record(z.string(), z.number());
export type FeesByProcessor = z.infer<typeof FeesByProcessorSchema>;

export const FeesByRailSchema = z.record(z.string(), z.number());
export type FeesByRail = z.infer<typeof FeesByRailSchema>;

export const CostIntelligenceSchema = z.object({
  ventureId: z.string().optional(),
  periodStart: z.string().date(),
  periodEnd: z.string().date(),
  totalProcessingFees: z.number(),
  feesByProcessor: FeesByProcessorSchema,
  feesByRail: FeesByRailSchema,
  avgFeePercentage: z.number(),
  savingsFromSmartRouting: z.number(),
  savingsFromCryptoRails: z.number(),
  totalSavings: z.number(),
  recommendations: z.array(CostRecommendationSchema),
  generatedAt: z.string().datetime(),
});
export type CostIntelligence = z.infer<typeof CostIntelligenceSchema>;

// ─────────────────────────────────────────────────────────
// REVENUE SCHEDULE (ASC 606)
// ─────────────────────────────────────────────────────────

export const RecognitionMethodSchema = z.enum([
  'straight_line',
  'usage_based',
  'milestone',
  'point_in_time',
]);
export type RecognitionMethod = z.infer<typeof RecognitionMethodSchema>;

export const RevenueScheduleStatusSchema = z.enum(['active', 'completed', 'voided']);
export type RevenueScheduleStatus = z.infer<typeof RevenueScheduleStatusSchema>;

export const RevenueEntryTypeSchema = z.enum(['recognition', 'deferral', 'adjustment']);
export type RevenueEntryType = z.infer<typeof RevenueEntryTypeSchema>;

export const RevenueEntrySchema = z.object({
  id: z.string().uuid(),
  scheduleId: z.string().uuid(),
  periodDate: z.string().date(),
  amount: z.number(),
  type: RevenueEntryTypeSchema,
  journalEntryId: z.string().uuid().nullable().default(null),
  recognizedAt: z.string().datetime().nullable().default(null),
});
export type RevenueEntry = z.infer<typeof RevenueEntrySchema>;

export const RevenueScheduleSchema = z.object({
  id: z.string().uuid(),
  ventureId: z.string(),
  sourceType: z.string(), // 'subscription' | 'invoice' | 'order' | etc.
  sourceId: z.string(),
  totalAmount: z.number(),
  recognizedAmount: z.number(),
  deferredAmount: z.number(),
  startDate: z.string().date(),
  endDate: z.string().date(),
  recognitionMethod: RecognitionMethodSchema,
  status: RevenueScheduleStatusSchema,
  entries: z.array(RevenueEntrySchema).default([]),
  createdAt: z.string().datetime(),
});
export type RevenueSchedule = z.infer<typeof RevenueScheduleSchema>;

export const CreateRevenueScheduleInput = RevenueScheduleSchema.omit({
  id: true,
  createdAt: true,
  entries: true,
}).extend({
  status: RevenueScheduleStatusSchema.default('active'),
});
export type CreateRevenueScheduleInput = z.infer<typeof CreateRevenueScheduleInput>;
