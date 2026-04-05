// src/lib/compliance/index.ts
// Barrel export for all compliance modules
// MCV Commerce & Financial OS — Plan 6

// Types
export type {
  FraudSignalType,
  FraudSeverity,
  FraudSignal,
  FraudDecision,
  FraudCheckResult,
  FraudRuleAction,
  FraudRule,
  PaymentRail,
  NotificationChannel,
  NotificationTone,
  DunningFinalAction,
  DunningStatus,
  DunningRetryStep,
  DunningNotificationStep,
  DunningConfig,
  DunningState,
  TaxType,
  FilingFrequency,
  TaxLineItem,
  CustomerLocation,
  TaxCalculationRequest,
  TaxComponent,
  TaxBreakdown,
  NexusThreshold,
  TaxJurisdiction,
  PricingStrategy,
  RoundingRule,
  CountryPriceOverride,
  PriceLocalizationConfig,
  LocalizedPrice,
} from './types';

// Fraud Engine
export {
  scoreTransaction,
  createFraudRule,
  updateFraudRule,
  listFraudRules,
} from './fraud-engine';
export type { ScoreTransactionRequest } from './fraud-engine';

// Dunning Manager
export {
  getDunningConfig,
  updateDunningConfig,
  initiateDunning,
  processRetries,
  markRecovered,
  markExhausted,
  getDunningStats,
} from './dunning-manager';
export type { RetryResult, DunningStats } from './dunning-manager';

// Tax Engine
export {
  calculateTax,
  getJurisdictions,
  checkNexus,
  updateNexusTracking,
} from './tax-engine';
export type { NexusAlert } from './tax-engine';

// Price Localization
export {
  localizePrice,
  localizeForCountries,
  formatLocalizedPrice,
  getCountryMultiplier,
  getCountryCurrency,
  getPriceLocalizationConfig,
  updatePriceLocalizationConfig,
} from './price-localization';
