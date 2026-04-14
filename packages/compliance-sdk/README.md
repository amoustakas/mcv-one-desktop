# @mcv/compliance-sdk

Compliance type system for MCV venture apps.

## Contents (v0.1.0)

**Types only**: FraudSignal / FraudRule / DunningConfig / DunningState /
TaxBreakdown / TaxComponent / NexusThreshold / PriceLocalizationConfig /
CountryPriceOverride / LocalizedPrice / CustomerLocation + enums
(FraudSeverity, FraudDecision, PaymentRail, NotificationChannel,
NotificationTone, DunningStatus, TaxType, FilingFrequency, etc.)

## What's deferred

The Supabase-bound runtime (1,662 LOC across fraud-engine, dunning-manager,
tax-engine, price-localization) stays in consuming apps until a future
`createComplianceEngine({ supabase })` DI factory extraction. MCV
Desktop's `src/lib/compliance/*.ts` is the reference implementation.

## Usage

```ts
import type {
  FraudRule,
  DunningConfig,
  TaxBreakdown,
  LocalizedPrice,
} from '@mcv/compliance-sdk';

// Validate at API boundaries, use in UI, share between server + client.
```
