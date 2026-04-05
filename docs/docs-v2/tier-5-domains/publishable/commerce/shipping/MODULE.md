# @mcv/commerce/shipping

> Shipping logistics engine for the MCV.ONE platform — carrier integration, rate calculation, label generation, shipment tracking, and fulfillment orchestration across multi-tenant ventures.

**Package:** `@mcv/commerce/shipping`
**Layer:** Tier 5 — Domain Module (Commerce)
**Status:** Stable
**Since:** 0.9.0
**DB Schema Prefix:** `shipping_`
**RLS:** Venture-scoped (all tables enforce `venture_id` isolation)

---

## Table of Contents

- [Purpose](#purpose)
- [Exports](#exports)
- [Architecture](#architecture)
  - [Carrier Abstraction Layer](#carrier-abstraction-layer)
  - [Tracking Pipeline](#tracking-pipeline)
  - [Rate Shopping Engine](#rate-shopping-engine)
  - [Fulfillment Router](#fulfillment-router)
- [Core Interfaces](#core-interfaces)
  - [ShippingService](#shippingservice)
  - [Carrier](#carrier)
  - [ShipmentRate](#shipmentrate)
  - [ShippingLabel](#shippinglabel)
  - [Shipment](#shipment)
  - [TrackingEvent](#trackingevent)
  - [Package](#package)
  - [ShippingRule](#shippingrule)
  - [CustomsDeclaration](#customsdeclaration)
  - [FulfillmentLocation](#fulfillmentlocation)
  - [ShippingZone](#shippingzone)
  - [ReturnShipment](#returnshipment)
  - [CarrierConfig](#carrierconfig)
  - [PackingResult](#packingresult)
  - [DutiesTaxEstimate](#dutiestaxestimate)
- [Database Schemas](#database-schemas)
  - [shipments](#shipments)
  - [shipping_labels](#shipping_labels)
  - [tracking_events](#tracking_events)
  - [packages](#packages)
  - [shipping_rules](#shipping_rules)
  - [carrier_configs](#carrier_configs)
  - [customs_declarations](#customs_declarations)
  - [fulfillment_locations](#fulfillment_locations)
  - [shipping_zones](#shipping_zones)
  - [return_shipments](#return_shipments)
- [Code Examples](#code-examples)
  - [1 — Get Shipping Rates for a Cart](#1--get-shipping-rates-for-a-cart)
  - [2 — Purchase a Shipping Label](#2--purchase-a-shipping-label)
  - [3 — Track a Shipment](#3--track-a-shipment)
  - [4 — Configure Carrier Credentials](#4--configure-carrier-credentials)
  - [5 — Create International Shipment with Customs](#5--create-international-shipment-with-customs)
  - [6 — Apply Shipping Rules Engine](#6--apply-shipping-rules-engine)
  - [7 — Generate Return Label](#7--generate-return-label)
  - [8 — Multi-Warehouse Fulfillment Routing](#8--multi-warehouse-fulfillment-routing)
- [Error Codes](#error-codes)
- [Security](#security)
- [Environment Variables](#environment-variables)
- [Dependencies](#dependencies)
- [Testing](#testing)

---

## Purpose

The `@mcv/commerce/shipping` module is the logistics backbone of MCV.ONE's commerce stack. It provides a unified abstraction over multiple shipping carriers, enabling ventures to:

1. **Shop rates in real time** — Query UPS, FedEx, USPS, DHL, Canada Post, and Royal Mail simultaneously and present the cheapest, fastest, or best-value options to customers at checkout.

2. **Generate shipping labels** — Create labels in PDF, ZPL (thermal printer), or PNG format with a single API call. Supports batch generation for high-volume fulfillment operations.

3. **Track shipments end-to-end** — Ingest tracking updates via carrier polling and webhook push, normalize events into a unified timeline, and notify customers via email or SMS at key milestones (shipped, in transit, out for delivery, delivered, exception).

4. **Handle international logistics** — Manage customs declarations (CN22/CN23), HS code classification, duties and taxes estimation (DDP vs DDU), and restricted/prohibited item enforcement per destination country.

5. **Optimize fulfillment** — Route orders to the nearest warehouse, split shipments when inventory is distributed, and apply packing algorithms to minimize dimensional weight charges.

6. **Enforce business rules** — Configure free shipping thresholds, flat-rate tiers, product-based shipping restrictions, geographic zone limitations, and hazardous materials classifications through a declarative rules engine.

7. **Process returns** — Generate return shipping labels (prepaid or customer-paid), schedule carrier pickups, track return shipments, and allocate shipping costs back to the appropriate party.

8. **Analyze shipping performance** — Track delivery time SLAs, compare carrier costs, monitor shipping cost as a percentage of revenue, and flag lost or damaged shipment trends.

Every operation is scoped to a `venture_id` via Supabase Row-Level Security. Carrier credentials, shipping rules, and fulfillment locations are configured per venture, ensuring complete multi-tenant isolation.

---

## Exports

```typescript
// === Primary Service ===
export { ShippingService }              from './services/shipping.service';
export { createShippingService }        from './services/shipping.service';

// === Carrier Adapters ===
export { CarrierAdapter }               from './carriers/carrier-adapter';
export { UPSCarrier }                   from './carriers/ups.carrier';
export { FedExCarrier }                 from './carriers/fedex.carrier';
export { USPSCarrier }                  from './carriers/usps.carrier';
export { DHLCarrier }                   from './carriers/dhl.carrier';
export { CanadaPostCarrier }            from './carriers/canada-post.carrier';
export { RoyalMailCarrier }             from './carriers/royal-mail.carrier';
export { EasyPostAdapter }              from './carriers/easypost.adapter';
export { ShippoAdapter }               from './carriers/shippo.adapter';

// === Rate Engine ===
export { RateEngine }                   from './rates/rate-engine';
export { RateShoppingService }          from './rates/rate-shopping.service';
export { DimensionalWeightCalculator }  from './rates/dimensional-weight';
export { ZonePricingEngine }            from './rates/zone-pricing';

// === Label Generation ===
export { LabelService }                 from './labels/label.service';
export { LabelFormatter }              from './labels/label-formatter';
export { BatchLabelProcessor }          from './labels/batch-label.processor';
export { ReturnLabelGenerator }         from './labels/return-label.generator';

// === Tracking ===
export { TrackingService }              from './tracking/tracking.service';
export { TrackingPoller }               from './tracking/tracking-poller';
export { TrackingWebhookHandler }       from './tracking/tracking-webhook.handler';
export { TrackingPageRenderer }         from './tracking/tracking-page.renderer';
export { DeliveryNotifier }             from './tracking/delivery-notifier';

// === Package Management ===
export { PackageService }               from './packages/package.service';
export { PackingAlgorithm }             from './packages/packing-algorithm';
export { BoxDimensionLibrary }          from './packages/box-dimension-library';

// === Rules Engine ===
export { ShippingRulesEngine }          from './rules/shipping-rules.engine';
export { FreeShippingEvaluator }        from './rules/free-shipping.evaluator';
export { GeoRestrictionChecker }        from './rules/geo-restriction.checker';
export { HazmatClassifier }            from './rules/hazmat.classifier';

// === Fulfillment ===
export { FulfillmentRouter }            from './fulfillment/fulfillment-router';
export { WarehouseSelector }            from './fulfillment/warehouse-selector';
export { SplitShipmentPlanner }         from './fulfillment/split-shipment.planner';
export { InStorePickupService }         from './fulfillment/in-store-pickup.service';

// === International ===
export { CustomsService }               from './international/customs.service';
export { HSCodeManager }                from './international/hs-code.manager';
export { DutiesTaxEstimator }           from './international/duties-tax.estimator';
export { RestrictedItemChecker }        from './international/restricted-item.checker';
export { CustomsFormGenerator }         from './international/customs-form.generator';

// === Returns ===
export { ReturnShippingService }        from './returns/return-shipping.service';
export { CarrierPickupScheduler }       from './returns/carrier-pickup.scheduler';

// === Analytics ===
export { ShippingAnalyticsService }     from './analytics/shipping-analytics.service';
export { CarrierCostAnalyzer }          from './analytics/carrier-cost.analyzer';
export { DeliveryPerformanceTracker }   from './analytics/delivery-performance.tracker';

// === tRPC Router ===
export { shippingRouter }               from './trpc/shipping.router';

// === Drizzle Schemas ===
export * from './db/schemas';

// === Types ===
export type {
  Carrier,
  CarrierCode,
  CarrierConfig,
  CarrierCredentials,
  CustomsDeclaration,
  CustomsItem,
  DutiesTaxEstimate,
  FulfillmentLocation,
  HazmatClass,
  IncotermsCode,
  Package,
  PackageType,
  PackingResult,
  ReturnShipment,
  Shipment,
  ShipmentRate,
  ShipmentStatus,
  ShippingAddress,
  ShippingLabel,
  ShippingLabelFormat,
  ShippingRule,
  ShippingRuleType,
  ShippingZone,
  TrackingEvent,
  TrackingEventType,
  TrackingStatus,
  WeightUnit,
  DimensionUnit,
} from './types';

// === Constants ===
export {
  CARRIER_CODES,
  SHIPMENT_STATUSES,
  TRACKING_EVENT_TYPES,
  LABEL_FORMATS,
  HAZMAT_CLASSES,
  INCOTERMS,
  WEIGHT_UNITS,
  DIMENSION_UNITS,
  SHIPPING_RULE_TYPES,
  PACKAGE_TYPES,
} from './constants';

// === Error Codes ===
export { SHIPPING_ERROR_CODES }         from './errors';
export { ShippingError }                from './errors';
```

---

## Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        tRPC Shipping Router                         │
│   getRates · purchaseLabel · trackShipment · createReturn · ...     │
├─────────────────────────────────────────────────────────────────────┤
│                         ShippingService                             │
│   Orchestrates all shipping operations; venture-scoped              │
├──────────┬──────────┬──────────┬──────────┬─────────┬──────────────┤
│  Rate    │  Label   │ Tracking │  Rules   │Customs  │ Fulfillment  │
│  Engine  │ Service  │ Service  │  Engine  │Service  │   Router     │
├──────────┴──────────┴──────────┴──────────┴─────────┴──────────────┤
│                    Carrier Abstraction Layer                         │
│        Unified interface across all carrier implementations         │
├─────┬─────┬──────┬─────┬────────────┬────────────┬─────────────────┤
│ UPS │FedEx│ USPS │ DHL │Canada Post │ Royal Mail │  EasyPost/Shippo│
└─────┴─────┴──────┴─────┴────────────┴────────────┴─────────────────┘
          │              │                    │
          ▼              ▼                    ▼
   Carrier REST APIs   Webhook Endpoints   SDK Clients
```

### Carrier Abstraction Layer

The carrier abstraction layer is the foundational pattern of this module. Every shipping carrier — whether integrated directly via REST API or through aggregator SDKs like EasyPost/Shippo — implements the same `CarrierAdapter` interface:

```typescript
/**
 * Carrier Abstraction Layer
 *
 * All carrier implementations conform to this interface.
 * The ShippingService never interacts with carrier-specific
 * APIs directly — it always goes through the adapter.
 *
 * This enables:
 * - Hot-swappable carriers per venture
 * - Unified rate comparison across carriers
 * - Consistent label/tracking data structures
 * - Easy addition of new carriers without touching core logic
 */
interface CarrierAdapter {
  /** Unique carrier code (e.g., 'ups', 'fedex', 'usps') */
  readonly code: CarrierCode;

  /** Human-readable carrier name */
  readonly displayName: string;

  /** Supported service levels for this carrier */
  readonly serviceLevels: ServiceLevel[];

  /** Countries this carrier supports for origin/destination */
  readonly supportedCountries: CountrySupport;

  /**
   * Initialize the adapter with venture-specific credentials.
   * Called once per venture context; credentials are loaded from
   * the carrier_configs table.
   */
  initialize(config: CarrierConfig): Promise<void>;

  /**
   * Get available shipping rates for a shipment.
   * Returns all service levels with pricing.
   */
  getRates(request: RateRequest): Promise<ShipmentRate[]>;

  /**
   * Purchase a shipping label at a specific rate.
   * Returns the label data (binary) and tracking number.
   */
  purchaseLabel(rate: ShipmentRate, options: LabelOptions): Promise<ShippingLabel>;

  /**
   * Void/cancel a previously purchased label.
   * Subject to carrier-specific void windows.
   */
  voidLabel(labelId: string): Promise<VoidResult>;

  /**
   * Get current tracking status for a shipment.
   * Used for polling-based tracking updates.
   */
  getTracking(trackingNumber: string): Promise<TrackingEvent[]>;

  /**
   * Register a webhook URL for tracking push notifications.
   * Not all carriers support this — check capabilities.
   */
  registerWebhook?(trackingNumber: string, webhookUrl: string): Promise<void>;

  /**
   * Validate a shipping address with the carrier.
   * Returns corrected/standardized address or validation errors.
   */
  validateAddress(address: ShippingAddress): Promise<AddressValidationResult>;

  /**
   * Schedule a carrier pickup from a location.
   * Used for return shipments and bulk pickups.
   */
  schedulePickup?(request: PickupRequest): Promise<PickupConfirmation>;

  /**
   * Get carrier-specific capabilities and limitations.
   */
  getCapabilities(): CarrierCapabilities;
}
```

**Adapter Registry:**

Carriers are registered in a global adapter registry. When the `ShippingService` is instantiated for a venture, it loads the venture's enabled carriers from `carrier_configs`, initializes the corresponding adapters, and caches them for the session:

```typescript
class CarrierRegistry {
  private adapters = new Map<CarrierCode, CarrierAdapter>();

  register(adapter: CarrierAdapter): void {
    this.adapters.set(adapter.code, adapter);
  }

  get(code: CarrierCode): CarrierAdapter {
    const adapter = this.adapters.get(code);
    if (!adapter) throw new ShippingError('CARRIER_NOT_FOUND', { code });
    return adapter;
  }

  getAll(): CarrierAdapter[] {
    return Array.from(this.adapters.values());
  }
}

// Default registry with all built-in carriers
const defaultRegistry = new CarrierRegistry();
defaultRegistry.register(new UPSCarrier());
defaultRegistry.register(new FedExCarrier());
defaultRegistry.register(new USPSCarrier());
defaultRegistry.register(new DHLCarrier());
defaultRegistry.register(new CanadaPostCarrier());
defaultRegistry.register(new RoyalMailCarrier());
```

**Aggregator Adapters (EasyPost / Shippo):**

For ventures that prefer a unified aggregator over direct carrier integrations, `EasyPostAdapter` and `ShippoAdapter` wrap the respective SDKs while conforming to the same `CarrierAdapter` interface. These adapters delegate rate shopping, label purchase, and tracking to the aggregator, which in turn communicates with carriers:

```
Venture → ShippingService → EasyPostAdapter → EasyPost API → UPS/FedEx/USPS/...
```

A venture can mix direct and aggregator integrations. For example, use EasyPost for USPS/FedEx but direct integration for Canada Post (which EasyPost may not support).

### Tracking Pipeline

The tracking pipeline ingests shipment status updates from two sources and normalizes them into a unified timeline:

```
┌──────────────────────┐     ┌──────────────────────┐
│   Polling Service    │     │   Webhook Receiver    │
│  (cron: every 30m)   │     │  (POST /webhooks/     │
│                      │     │   tracking/:carrier)  │
│  Queries carrier API │     │                       │
│  for active shipments│     │  Receives push events │
│  in batches          │     │  from carrier servers  │
└──────────┬───────────┘     └──────────┬───────────┘
           │                            │
           ▼                            ▼
┌──────────────────────────────────────────────────┐
│              Tracking Event Normalizer             │
│                                                    │
│  Carrier-specific statuses → unified TrackingEvent │
│  e.g., FedEx "DL" → { type: 'delivered' }         │
│  e.g., UPS "X"   → { type: 'exception' }          │
│                                                    │
│  Deduplication: same event from poll + webhook     │
│  is stored once (keyed on carrier_event_id)        │
└──────────────────────┬───────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────┐
│             tracking_events table                  │
│                                                    │
│  Append-only event log per shipment               │
│  Ordered by occurred_at                            │
└──────────────────────┬───────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────┐
│            Shipment Status Updater                 │
│                                                    │
│  Derives current shipment status from latest      │
│  tracking event: pre_transit → in_transit →        │
│  out_for_delivery → delivered | exception          │
│                                                    │
│  Updates shipments.status + shipments.updated_at   │
└──────────────────────┬───────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────┐
│            Delivery Notifier                       │
│                                                    │
│  Sends notifications at key milestones:           │
│  • shipped (label created + first scan)           │
│  • out_for_delivery                               │
│  • delivered                                       │
│  • exception (delay, return to sender, etc.)       │
│                                                    │
│  Channels: email (via @mcv/notifications/email)   │
│            SMS   (via @mcv/notifications/sms)     │
│                                                    │
│  Respects customer notification preferences        │
└──────────────────────────────────────────────────┘
```

**Polling Strategy:**

The `TrackingPoller` runs as a background job (configurable interval, default 30 minutes). It batches active shipments (status not `delivered` or `cancelled`) and queries carrier APIs in parallel with rate limiting:

- **Active shipments** (in_transit, out_for_delivery): polled every 30 minutes
- **Pre-transit shipments** (label created but no scan): polled every 2 hours
- **Stale shipments** (no update in 7+ days): polled every 12 hours, flagged for review
- **Delivered/cancelled**: removed from polling queue

**Webhook Deduplication:**

When both a poll and a webhook deliver the same tracking event, the normalizer deduplicates using a composite key of `(shipment_id, carrier_event_id, occurred_at)`. The first-write wins; subsequent duplicates are silently dropped.

### Rate Shopping Engine

The rate shopping engine queries multiple carriers simultaneously and returns a unified, comparable list of rates:

```
┌─────────────────────────────────────┐
│         Rate Shopping Request        │
│                                     │
│  origin, destination, packages[],   │
│  ship_date, venture_id              │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│       Shipping Rules Engine          │
│                                     │
│  Pre-filter:                         │
│  • Geo restrictions (no carrier X   │
│    to country Y)                     │
│  • Product restrictions (hazmat     │
│    limits carrier options)           │
│  • Weight/dimension limits           │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│     Parallel Carrier Queries         │
│                                     │
│  Promise.allSettled([               │
│    ups.getRates(req),               │
│    fedex.getRates(req),             │
│    usps.getRates(req),              │
│    ...enabledCarriers               │
│  ])                                 │
│                                     │
│  Timeout: 10s per carrier           │
│  Failures: logged, excluded from    │
│  results (other carriers still work)│
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│       Rate Post-Processing           │
│                                     │
│  • Apply shipping rules (free       │
│    shipping, flat rate overrides)    │
│  • Apply venture markup/discount    │
│  • Sort by price/speed/value        │
│  • Add estimated delivery dates     │
│  • Currency conversion if needed    │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│     ShipmentRate[] Response          │
│                                     │
│  Unified rates with carrier name,   │
│  service level, price, estimated    │
│  delivery, and rate_id for purchase │
└─────────────────────────────────────┘
```

**Rate Caching:**

Rates are cached for a configurable TTL (default: 15 minutes) keyed on `(origin_zip, dest_zip, packages_hash, carrier, service_level)`. This prevents redundant carrier API calls when a customer refreshes checkout or changes payment method without modifying their cart.

**Dimensional Weight:**

The `DimensionalWeightCalculator` computes dimensional (volumetric) weight using each carrier's divisor:

```
DIM Weight = (L × W × H) / DIM Divisor

Carrier DIM Divisors:
  UPS:         139 (in³/lb) or 5000 (cm³/kg)
  FedEx:       139 (in³/lb) or 5000 (cm³/kg)
  USPS:        166 (in³/lb)
  DHL:         5000 (cm³/kg)
  Canada Post: 5000 (cm³/kg)
  Royal Mail:  5000 (cm³/kg)

Billable Weight = max(actual_weight, dim_weight)
```

### Fulfillment Router

The fulfillment router determines the optimal warehouse(s) to ship from for each order:

```
┌─────────────────────────────────────┐
│        Order with Line Items         │
│                                     │
│  Items: [A(qty:2), B(qty:1), C(qty:3)]│
│  Destination: Toronto, ON, Canada   │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│      Inventory Availability Check    │
│                                     │
│  Query inventory by location:       │
│  Warehouse NYC: A(5), B(0), C(10)  │
│  Warehouse LAX: A(3), B(8), C(0)   │
│  Warehouse YYZ: A(0), B(2), C(7)   │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│      Fulfillment Strategy Engine     │
│                                     │
│  Strategy options (venture config): │
│  • closest_single: Ship all from    │
│    nearest warehouse that has all   │
│  • closest_split: Split across      │
│    warehouses, minimize distance    │
│  • cheapest_single: Ship all from   │
│    cheapest-to-ship warehouse       │
│  • cheapest_split: Split to         │
│    minimize total shipping cost     │
│  • balanced: Optimize for cost +    │
│    speed (weighted scoring)         │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│      Split Shipment Planner          │
│                                     │
│  If split needed:                   │
│  Shipment 1: NYC → [A(2), C(3)]    │
│  Shipment 2: YYZ → [B(1)]          │
│                                     │
│  Each shipment gets its own rate    │
│  quote, label, and tracking number  │
└─────────────────────────────────────┘
```

---

## Core Interfaces

### ShippingService

The primary orchestrator for all shipping operations within a venture context.

```typescript
interface ShippingService {
  /**
   * Get shipping rates for a set of packages from origin to destination.
   * Queries all enabled carriers in parallel and returns unified rates.
   *
   * @param request - Origin, destination, packages, and options
   * @returns Sorted array of rates across all carriers
   * @throws SHIPPING_ORIGIN_REQUIRED, SHIPPING_DESTINATION_REQUIRED
   */
  getRates(request: RateRequest): Promise<ShipmentRate[]>;

  /**
   * Purchase a shipping label using a previously quoted rate.
   * The rate_id from getRates() must be used within its TTL window.
   *
   * @param rateId - Rate identifier from a previous getRates() call
   * @param options - Label format, reference numbers, etc.
   * @returns Generated label with tracking number
   * @throws RATE_EXPIRED, CARRIER_PURCHASE_FAILED
   */
  purchaseLabel(rateId: string, options?: LabelOptions): Promise<ShippingLabel>;

  /**
   * Purchase labels for multiple shipments in a single batch.
   * More efficient than individual calls for high-volume fulfillment.
   *
   * @param requests - Array of rate IDs and options
   * @returns Array of results (label or error per request)
   */
  purchaseLabelBatch(
    requests: BatchLabelRequest[]
  ): Promise<BatchLabelResult[]>;

  /**
   * Create a complete shipment: rate → label → initial tracking.
   * Convenience method that combines getRates + purchaseLabel.
   *
   * @param request - Full shipment creation request
   * @returns Created shipment with label and tracking
   */
  createShipment(request: CreateShipmentRequest): Promise<Shipment>;

  /**
   * Void/cancel a shipment and its label.
   * Subject to carrier-specific void windows (typically 24h).
   *
   * @param shipmentId - The shipment to void
   * @throws VOID_WINDOW_EXPIRED, SHIPMENT_ALREADY_IN_TRANSIT
   */
  voidShipment(shipmentId: string): Promise<VoidResult>;

  /**
   * Get current tracking information for a shipment.
   *
   * @param shipmentId - Internal shipment ID
   * @returns Full tracking event timeline
   */
  getTracking(shipmentId: string): Promise<TrackingTimeline>;

  /**
   * Get tracking info by carrier tracking number (public API).
   *
   * @param trackingNumber - Carrier-assigned tracking number
   * @param carrierCode - Which carrier to query
   * @returns Tracking timeline
   */
  getTrackingByNumber(
    trackingNumber: string,
    carrierCode: CarrierCode
  ): Promise<TrackingTimeline>;

  /**
   * Validate and standardize a shipping address.
   *
   * @param address - Address to validate
   * @param carrierCode - Optional carrier for carrier-specific validation
   * @returns Validated/corrected address or validation errors
   */
  validateAddress(
    address: ShippingAddress,
    carrierCode?: CarrierCode
  ): Promise<AddressValidationResult>;

  /**
   * Generate a return shipping label for an existing shipment.
   *
   * @param shipmentId - Original outbound shipment
   * @param options - Return label options (prepaid, format, etc.)
   * @returns Return shipment with label
   */
  createReturnLabel(
    shipmentId: string,
    options?: ReturnLabelOptions
  ): Promise<ReturnShipment>;

  /**
   * Calculate optimal fulfillment routing for an order.
   *
   * @param order - Order with line items and destination
   * @returns Fulfillment plan with warehouse assignments
   */
  planFulfillment(order: FulfillmentOrderInput): Promise<FulfillmentPlan>;

  /**
   * Estimate duties and taxes for an international shipment.
   *
   * @param request - Items, origin/destination countries, value
   * @returns Estimated duties, taxes, and total landed cost
   */
  estimateDutiesTax(request: DutiesTaxRequest): Promise<DutiesTaxEstimate>;

  /**
   * Get the customer-facing tracking page URL for a shipment.
   *
   * @param shipmentId - Shipment to generate URL for
   * @returns Public tracking page URL
   */
  getTrackingPageUrl(shipmentId: string): Promise<string>;
}
```

### Carrier

Represents a shipping carrier's identity and capabilities.

```typescript
interface Carrier {
  /** Unique carrier code: 'ups' | 'fedex' | 'usps' | 'dhl' | 'canada_post' | 'royal_mail' */
  code: CarrierCode;

  /** Display name for the carrier */
  displayName: string;

  /** Carrier logo URL */
  logoUrl: string;

  /** Available service levels */
  serviceLevels: ServiceLevel[];

  /** Whether the carrier supports webhook-based tracking */
  supportsWebhookTracking: boolean;

  /** Whether the carrier supports address validation */
  supportsAddressValidation: boolean;

  /** Whether the carrier supports scheduled pickups */
  supportsPickupScheduling: boolean;

  /** Maximum package weight in the carrier's default unit */
  maxPackageWeight: { value: number; unit: WeightUnit };

  /** Maximum package dimensions */
  maxPackageDimensions: {
    length: number;
    width: number;
    height: number;
    unit: DimensionUnit;
  };

  /** Countries supported as origin */
  originCountries: string[];

  /** Countries supported as destination */
  destinationCountries: string[];

  /** DIM weight divisor used by this carrier */
  dimWeightDivisor: { imperial: number; metric: number };
}

type CarrierCode =
  | 'ups'
  | 'fedex'
  | 'usps'
  | 'dhl'
  | 'canada_post'
  | 'royal_mail'
  | 'easypost'
  | 'shippo';

interface ServiceLevel {
  /** Carrier-specific service code (e.g., 'ups_ground', 'fedex_2day') */
  code: string;

  /** Human-readable name */
  name: string;

  /** Estimated transit days (business days) */
  estimatedTransitDays: { min: number; max: number };

  /** Whether this is a domestic-only, international-only, or both service */
  scope: 'domestic' | 'international' | 'both';

  /** Whether Saturday delivery is available */
  saturdayDelivery: boolean;

  /** Whether signature is required by default */
  signatureRequired: boolean;
}
```

### ShipmentRate

A quoted shipping rate from a carrier for a specific origin/destination/package combination.

```typescript
interface ShipmentRate {
  /** Unique rate identifier (used to purchase label) */
  rateId: string;

  /** Carrier that quoted this rate */
  carrierCode: CarrierCode;

  /** Carrier display name */
  carrierName: string;

  /** Service level code */
  serviceLevel: string;

  /** Service level display name */
  serviceLevelName: string;

  /** Quoted price in the venture's currency */
  price: {
    amount: number;
    currency: string;
  };

  /** Original carrier price before any venture markup/discount */
  listPrice: {
    amount: number;
    currency: string;
  };

  /** Estimated delivery date */
  estimatedDeliveryDate: Date;

  /** Estimated transit business days */
  estimatedTransitDays: number;

  /** Whether a delivery guarantee exists */
  guaranteedDelivery: boolean;

  /** Billable weight used for this rate */
  billableWeight: {
    value: number;
    unit: WeightUnit;
    isDimensional: boolean;
  };

  /** Rate expiration time (must purchase before this) */
  expiresAt: Date;

  /** Additional surcharges itemized */
  surcharges: Surcharge[];

  /** Whether this rate includes insurance */
  insuranceIncluded: boolean;

  /** Whether Saturday delivery is included */
  saturdayDelivery: boolean;

  /** Whether signature confirmation is included */
  signatureRequired: boolean;

  /** Carrier-specific metadata */
  metadata: Record<string, unknown>;
}

interface Surcharge {
  type: string;
  description: string;
  amount: number;
  currency: string;
}
```

### ShippingLabel

A purchased shipping label with binary content and metadata.

```typescript
interface ShippingLabel {
  /** Internal label ID */
  id: string;

  /** Associated shipment ID */
  shipmentId: string;

  /** Venture ID */
  ventureId: string;

  /** Carrier that issued the label */
  carrierCode: CarrierCode;

  /** Carrier-assigned tracking number */
  trackingNumber: string;

  /** Label format */
  format: ShippingLabelFormat;

  /** Label content as base64-encoded string */
  labelData: string;

  /** URL to download the label (signed, time-limited) */
  labelUrl: string;

  /** Price paid for this label */
  price: {
    amount: number;
    currency: string;
  };

  /** Service level purchased */
  serviceLevel: string;

  /** Whether this is a return label */
  isReturn: boolean;

  /** Carrier-specific label ID (for voiding) */
  carrierLabelId: string;

  /** Void window expiration */
  voidableUntil: Date;

  /** Created timestamp */
  createdAt: Date;
}

type ShippingLabelFormat = 'pdf' | 'zpl' | 'png' | 'epl';
```

### Shipment

A complete shipment record encompassing origin, destination, packages, label, and tracking.

```typescript
interface Shipment {
  /** Internal shipment ID (UUID) */
  id: string;

  /** Venture ID */
  ventureId: string;

  /** Associated order ID */
  orderId: string;

  /** Fulfillment location this ships from */
  fulfillmentLocationId: string;

  /** Current shipment status */
  status: ShipmentStatus;

  /** Carrier used */
  carrierCode: CarrierCode;

  /** Service level */
  serviceLevel: string;

  /** Tracking number */
  trackingNumber: string;

  /** Origin address (warehouse/fulfillment location) */
  origin: ShippingAddress;

  /** Destination address (customer) */
  destination: ShippingAddress;

  /** Packages in this shipment */
  packages: Package[];

  /** Shipping label */
  label: ShippingLabel | null;

  /** Latest tracking event */
  latestTrackingEvent: TrackingEvent | null;

  /** Estimated delivery date */
  estimatedDeliveryDate: Date | null;

  /** Actual delivery date */
  actualDeliveryDate: Date | null;

  /** Total shipping cost */
  cost: {
    amount: number;
    currency: string;
  };

  /** Amount charged to customer */
  customerCharge: {
    amount: number;
    currency: string;
  };

  /** Insurance details */
  insurance: {
    insured: boolean;
    value: number;
    currency: string;
    provider: string;
  } | null;

  /** Whether this is an international shipment */
  isInternational: boolean;

  /** Customs declaration (international only) */
  customsDeclaration: CustomsDeclaration | null;

  /** Shipment reference numbers */
  referenceNumbers: string[];

  /** Notes/instructions */
  notes: string;

  /** Metadata */
  metadata: Record<string, unknown>;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
  shippedAt: Date | null;
  deliveredAt: Date | null;
}

type ShipmentStatus =
  | 'draft'
  | 'label_created'
  | 'pre_transit'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'exception'
  | 'return_to_sender'
  | 'cancelled'
  | 'voided';
```

### TrackingEvent

A single event in a shipment's tracking timeline.

```typescript
interface TrackingEvent {
  /** Internal event ID */
  id: string;

  /** Associated shipment ID */
  shipmentId: string;

  /** Event type (normalized) */
  type: TrackingEventType;

  /** Human-readable status description */
  description: string;

  /** Location where the event occurred */
  location: {
    city: string;
    state: string;
    postalCode: string;
    country: string;
  } | null;

  /** When the event occurred (carrier timestamp) */
  occurredAt: Date;

  /** When we received/processed this event */
  receivedAt: Date;

  /** Carrier-specific event code */
  carrierEventCode: string;

  /** Carrier-specific event description */
  carrierDescription: string;

  /** Carrier-assigned event ID (for deduplication) */
  carrierEventId: string;

  /** Whether this event was from a webhook (true) or polling (false) */
  source: 'webhook' | 'poll';

  /** Signed-by name (for delivery events) */
  signedBy: string | null;
}

type TrackingEventType =
  | 'label_created'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivery_attempted'
  | 'delivered'
  | 'exception'
  | 'return_to_sender'
  | 'customs_hold'
  | 'available_for_pickup'
  | 'unknown';
```

### Package

Represents a physical package with dimensions, weight, and contents.

```typescript
interface Package {
  /** Internal package ID */
  id: string;

  /** Associated shipment ID */
  shipmentId: string | null;

  /** Package type (predefined or custom) */
  packageType: PackageType;

  /** Custom package name (if packageType is 'custom') */
  customName: string | null;

  /** Dimensions */
  length: number;
  width: number;
  height: number;
  dimensionUnit: DimensionUnit;

  /** Weight */
  weight: number;
  weightUnit: WeightUnit;

  /** Calculated dimensional weight */
  dimWeight: number | null;

  /** Billable weight (max of actual and dim) */
  billableWeight: number;

  /** Declared value for insurance */
  declaredValue: {
    amount: number;
    currency: string;
  } | null;

  /** Whether the package requires special handling */
  fragile: boolean;

  /** Whether the package contains hazardous materials */
  hazmat: boolean;

  /** Hazmat classification (if hazmat is true) */
  hazmatClass: HazmatClass | null;

  /** Items packed in this package */
  items: PackageItem[];

  /** Signature requirement */
  signatureRequired: 'none' | 'standard' | 'adult';
}

type PackageType =
  | 'custom'
  | 'envelope'
  | 'small_flat_rate_box'
  | 'medium_flat_rate_box'
  | 'large_flat_rate_box'
  | 'ups_express_box_small'
  | 'ups_express_box_medium'
  | 'ups_express_box_large'
  | 'fedex_envelope'
  | 'fedex_small_box'
  | 'fedex_medium_box'
  | 'fedex_large_box'
  | 'tube'
  | 'pallet';

type WeightUnit = 'oz' | 'lb' | 'g' | 'kg';
type DimensionUnit = 'in' | 'cm';

type HazmatClass =
  | 'class_1_explosives'
  | 'class_2_gases'
  | 'class_3_flammable_liquids'
  | 'class_4_flammable_solids'
  | 'class_5_oxidizers'
  | 'class_6_poisons'
  | 'class_7_radioactive'
  | 'class_8_corrosives'
  | 'class_9_miscellaneous'
  | 'orm_d'
  | 'limited_quantity';

interface PackageItem {
  /** Product/variant ID */
  productId: string;
  variantId: string | null;

  /** Item description */
  description: string;

  /** Quantity */
  quantity: number;

  /** Individual item weight */
  weight: number;
  weightUnit: WeightUnit;

  /** Item value (for customs) */
  value: number;
  currency: string;

  /** HS code (for international) */
  hsCode: string | null;

  /** Country of origin (for customs) */
  countryOfOrigin: string | null;
}
```

### ShippingRule

Declarative shipping rule evaluated by the rules engine.

```typescript
interface ShippingRule {
  /** Rule ID */
  id: string;

  /** Venture ID */
  ventureId: string;

  /** Rule type */
  type: ShippingRuleType;

  /** Rule name (admin label) */
  name: string;

  /** Rule description */
  description: string;

  /** Priority (lower = evaluated first) */
  priority: number;

  /** Whether this rule is active */
  enabled: boolean;

  /** Conditions that must be met for this rule to apply */
  conditions: ShippingRuleCondition[];

  /** Action to take when conditions are met */
  action: ShippingRuleAction;

  /** Date range for this rule (null = always active) */
  validFrom: Date | null;
  validUntil: Date | null;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}

type ShippingRuleType =
  | 'free_shipping'
  | 'flat_rate'
  | 'rate_adjustment'
  | 'carrier_restriction'
  | 'service_restriction'
  | 'geo_restriction'
  | 'product_restriction'
  | 'hazmat_restriction'
  | 'weight_surcharge'
  | 'handling_fee';

interface ShippingRuleCondition {
  /** What to evaluate */
  field:
    | 'cart_subtotal'
    | 'cart_total'
    | 'cart_weight'
    | 'cart_item_count'
    | 'destination_country'
    | 'destination_state'
    | 'destination_zip'
    | 'origin_country'
    | 'product_id'
    | 'product_category'
    | 'product_tag'
    | 'carrier_code'
    | 'service_level'
    | 'customer_group'
    | 'coupon_code';

  /** Comparison operator */
  operator:
    | 'eq'
    | 'neq'
    | 'gt'
    | 'gte'
    | 'lt'
    | 'lte'
    | 'in'
    | 'not_in'
    | 'contains'
    | 'starts_with'
    | 'regex';

  /** Value to compare against */
  value: string | number | string[];
}

interface ShippingRuleAction {
  /** Action type */
  type:
    | 'set_price'
    | 'adjust_price'
    | 'free_shipping'
    | 'block_carrier'
    | 'block_service'
    | 'block_destination'
    | 'add_surcharge'
    | 'require_signature'
    | 'set_handling_fee';

  /** Value for the action (interpretation depends on type) */
  value: number | string | null;

  /** Unit for numeric values */
  unit: 'fixed' | 'percent' | null;

  /** Message to display to customer (if applicable) */
  customerMessage: string | null;
}
```

### CustomsDeclaration

Customs information for international shipments.

```typescript
interface CustomsDeclaration {
  /** Declaration ID */
  id: string;

  /** Associated shipment ID */
  shipmentId: string;

  /** Venture ID */
  ventureId: string;

  /** Customs form type */
  formType: 'cn22' | 'cn23' | 'commercial_invoice' | 'proforma_invoice';

  /** Contents type */
  contentsType:
    | 'merchandise'
    | 'gift'
    | 'documents'
    | 'sample'
    | 'return'
    | 'other';

  /** Contents description */
  contentsDescription: string;

  /** Incoterms (trade terms) */
  incoterms: IncotermsCode;

  /** Whether duties/taxes are paid by sender (DDP) or receiver (DDU) */
  dutiesPayor: 'sender' | 'receiver';

  /** Items declared */
  items: CustomsItem[];

  /** Total declared value */
  totalValue: {
    amount: number;
    currency: string;
  };

  /** Total weight */
  totalWeight: {
    value: number;
    unit: WeightUnit;
  };

  /** EEL/PFC code (US exports) */
  eelPfc: string | null;

  /** Non-delivery option */
  nonDeliveryOption: 'return' | 'abandon';

  /** Signer name */
  signerName: string;

  /** Signature date */
  signatureDate: Date;

  /** Generated customs form document */
  formDocument: {
    format: 'pdf';
    data: string; // base64
    url: string;  // signed download URL
  } | null;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}

type IncotermsCode =
  | 'DAP'   // Delivered at Place (DDU)
  | 'DDP'   // Delivered Duty Paid
  | 'EXW'   // Ex Works
  | 'FCA'   // Free Carrier
  | 'FOB'   // Free on Board
  | 'CIF'   // Cost, Insurance, Freight
  | 'CPT';  // Carriage Paid To

interface CustomsItem {
  /** Item description (for customs) */
  description: string;

  /** Quantity */
  quantity: number;

  /** Individual item value */
  value: number;

  /** Currency */
  currency: string;

  /** Weight per unit */
  weight: number;
  weightUnit: WeightUnit;

  /** Harmonized System code (6-10 digits) */
  hsCode: string;

  /** Country where the item was manufactured */
  countryOfOrigin: string;

  /** SKU or product identifier */
  sku: string | null;

  /** URL to product page (some customs require this) */
  productUrl: string | null;
}
```

### FulfillmentLocation

A physical location from which shipments can be fulfilled.

```typescript
interface FulfillmentLocation {
  /** Location ID */
  id: string;

  /** Venture ID */
  ventureId: string;

  /** Location name */
  name: string;

  /** Location type */
  type: 'warehouse' | 'store' | 'dropship' | 'third_party_logistics';

  /** Whether this location is active for fulfillment */
  active: boolean;

  /** Physical address */
  address: ShippingAddress;

  /** Geographic coordinates (for distance calculations) */
  coordinates: {
    latitude: number;
    longitude: number;
  };

  /** Priority for fulfillment (lower = preferred) */
  priority: number;

  /** Operating hours (for cutoff time calculations) */
  operatingHours: {
    timezone: string;
    weekday: { open: string; close: string; cutoffTime: string };
    saturday: { open: string; close: string; cutoffTime: string } | null;
    sunday: { open: string; close: string; cutoffTime: string } | null;
  };

  /** Carriers available at this location */
  enabledCarriers: CarrierCode[];

  /** Whether this location supports in-store pickup */
  supportsPickup: boolean;

  /** Maximum daily shipment capacity (null = unlimited) */
  dailyCapacity: number | null;

  /** Contact information */
  contact: {
    name: string;
    phone: string;
    email: string;
  };

  /** Metadata */
  metadata: Record<string, unknown>;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}
```

### ShippingZone

Geographic zone definitions for zone-based pricing and restrictions.

```typescript
interface ShippingZone {
  /** Zone ID */
  id: string;

  /** Venture ID */
  ventureId: string;

  /** Zone name (e.g., "Domestic", "Canada", "Europe", "Rest of World") */
  name: string;

  /** Zone code (unique within venture) */
  code: string;

  /** Countries in this zone (ISO 3166-1 alpha-2) */
  countries: string[];

  /** State/province subdivisions (optional, for regional zones) */
  regions: {
    country: string;
    states: string[];
  }[];

  /** Postal code patterns (optional, for hyperlocal zones) */
  postalCodePatterns: {
    country: string;
    patterns: string[]; // regex patterns
  }[];

  /** Default shipping rates for this zone (if zone-based pricing is used) */
  defaultRates: ZoneRate[];

  /** Whether shipping to this zone is enabled */
  enabled: boolean;

  /** Sort order for display */
  sortOrder: number;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}

interface ZoneRate {
  /** Service tier name */
  name: string;

  /** Base price */
  basePrice: number;

  /** Price per additional kg/lb */
  pricePerUnit: number;

  /** Weight unit for pricePerUnit */
  weightUnit: WeightUnit;

  /** Estimated delivery days */
  estimatedDays: { min: number; max: number };

  /** Currency */
  currency: string;
}
```

### ReturnShipment

A return shipment linked to an original outbound shipment.

```typescript
interface ReturnShipment {
  /** Return shipment ID */
  id: string;

  /** Venture ID */
  ventureId: string;

  /** Original outbound shipment ID */
  originalShipmentId: string;

  /** Associated return/RMA ID (from returns module) */
  returnId: string | null;

  /** Return shipment status */
  status:
    | 'label_created'
    | 'in_transit'
    | 'delivered'
    | 'cancelled';

  /** Carrier */
  carrierCode: CarrierCode;

  /** Tracking number */
  trackingNumber: string;

  /** Return label */
  label: ShippingLabel;

  /** Whether the return label is prepaid by the venture */
  prepaid: boolean;

  /** Return shipping cost */
  cost: {
    amount: number;
    currency: string;
  };

  /** Who pays for return shipping */
  costAllocatedTo: 'venture' | 'customer';

  /** Pickup scheduled (if applicable) */
  pickup: {
    scheduledDate: Date;
    confirmationNumber: string;
    carrierPickupId: string;
  } | null;

  /** Origin (customer address) */
  origin: ShippingAddress;

  /** Destination (return warehouse) */
  destination: ShippingAddress;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
  deliveredAt: Date | null;
}
```

### CarrierConfig

Per-venture carrier configuration and credentials.

```typescript
interface CarrierConfig {
  /** Config ID */
  id: string;

  /** Venture ID */
  ventureId: string;

  /** Carrier code */
  carrierCode: CarrierCode;

  /** Whether this carrier is enabled for the venture */
  enabled: boolean;

  /** Carrier API credentials (encrypted at rest) */
  credentials: CarrierCredentials;

  /** Carrier account number */
  accountNumber: string | null;

  /** Whether to use the carrier's sandbox/test mode */
  testMode: boolean;

  /** Markup to apply on carrier rates (percent) */
  rateMarkupPercent: number;

  /** Flat markup to apply on carrier rates */
  rateMarkupFlat: {
    amount: number;
    currency: string;
  } | null;

  /** Default label format for this carrier */
  defaultLabelFormat: ShippingLabelFormat;

  /** Default service level (used if customer doesn't choose) */
  defaultServiceLevel: string | null;

  /** Whether to auto-register webhooks for tracking */
  enableWebhookTracking: boolean;

  /** Custom webhook URL override (default: auto-generated) */
  webhookUrl: string | null;

  /** Carrier-specific settings */
  settings: Record<string, unknown>;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}

interface CarrierCredentials {
  /** Credential type varies by carrier */
  apiKey?: string;
  apiSecret?: string;
  accessLicenseNumber?: string; // UPS
  meterNumber?: string;        // FedEx
  userId?: string;             // USPS
  password?: string;
  clientId?: string;
  clientSecret?: string;
  contractId?: string;         // Canada Post
  customerNumber?: string;     // Canada Post
}
```

### PackingResult

Output of the bin-packing algorithm.

```typescript
interface PackingResult {
  /** Packages produced by the algorithm */
  packages: PackedBox[];

  /** Items that couldn't fit in any available box */
  unpackedItems: PackageItem[];

  /** Whether all items were successfully packed */
  allItemsPacked: boolean;

  /** Total number of boxes used */
  totalBoxes: number;

  /** Total weight across all boxes */
  totalWeight: {
    value: number;
    unit: WeightUnit;
  };

  /** Algorithm metadata */
  algorithm: {
    name: string;
    executionTimeMs: number;
    iterations: number;
  };
}

interface PackedBox {
  /** Box type used */
  boxType: PackageType;

  /** Box dimensions */
  length: number;
  width: number;
  height: number;
  dimensionUnit: DimensionUnit;

  /** Items packed in this box */
  items: PackedItem[];

  /** Total weight of this box (items + box tare weight) */
  totalWeight: {
    value: number;
    unit: WeightUnit;
  };

  /** Volume utilization percentage */
  volumeUtilization: number;

  /** Weight utilization percentage */
  weightUtilization: number;
}

interface PackedItem {
  /** Reference to the original item */
  productId: string;
  variantId: string | null;

  /** Quantity of this item in this box */
  quantity: number;

  /** Position within the box (for visualization) */
  position: { x: number; y: number; z: number };

  /** Orientation */
  rotation: { rotatedX: boolean; rotatedY: boolean; rotatedZ: boolean };
}
```

### DutiesTaxEstimate

Estimated duties and taxes for an international shipment.

```typescript
interface DutiesTaxEstimate {
  /** Destination country */
  destinationCountry: string;

  /** Origin country */
  originCountry: string;

  /** Declared value of goods */
  declaredValue: {
    amount: number;
    currency: string;
  };

  /** Estimated import duty */
  duty: {
    amount: number;
    currency: string;
    rate: number; // percentage
  };

  /** Estimated VAT/GST/sales tax */
  tax: {
    amount: number;
    currency: string;
    rate: number;
    type: 'vat' | 'gst' | 'sales_tax' | 'consumption_tax';
  };

  /** Additional fees (processing, customs clearance, etc.) */
  fees: {
    description: string;
    amount: number;
    currency: string;
  }[];

  /** Total estimated landed cost (goods + shipping + duty + tax + fees) */
  totalLandedCost: {
    amount: number;
    currency: string;
  };

  /** Incoterms used for this estimate */
  incoterms: IncotermsCode;

  /** De minimis threshold for this destination */
  deMinimis: {
    dutyThreshold: number;
    taxThreshold: number;
    currency: string;
  };

  /** Whether the shipment falls under de minimis (no duty/tax) */
  isDeMinimis: boolean;

  /** Per-item breakdown */
  itemBreakdown: {
    description: string;
    hsCode: string;
    dutyRate: number;
    dutyAmount: number;
    taxAmount: number;
  }[];

  /** Disclaimer / accuracy note */
  disclaimer: string;

  /** Estimate calculated at */
  calculatedAt: Date;
}
```

---

## Database Schemas

All tables use Supabase PostgreSQL with Row-Level Security policies enforcing `venture_id` isolation. UUIDs are used for all primary keys. Timestamps use `timestamptz`.

### shipments

The central table tracking every shipment from creation through delivery.

```typescript
import { pgTable, uuid, text, timestamp, numeric, jsonb, boolean, index } from 'drizzle-orm/pg-core';

export const shipments = pgTable('shipments', {
  id:                     uuid('id').primaryKey().defaultRandom(),
  ventureId:              uuid('venture_id').notNull().references(() => ventures.id),
  orderId:                uuid('order_id').notNull().references(() => orders.id),
  fulfillmentLocationId:  uuid('fulfillment_location_id').references(() => fulfillmentLocations.id),

  // Status
  status:                 text('status').notNull().default('draft'),
  // 'draft' | 'label_created' | 'pre_transit' | 'in_transit' |
  // 'out_for_delivery' | 'delivered' | 'exception' |
  // 'return_to_sender' | 'cancelled' | 'voided'

  // Carrier info
  carrierCode:            text('carrier_code').notNull(),
  serviceLevel:           text('service_level').notNull(),
  trackingNumber:         text('tracking_number'),
  carrierShipmentId:      text('carrier_shipment_id'),

  // Addresses (stored as JSONB for flexibility)
  origin:                 jsonb('origin').notNull().$type<ShippingAddress>(),
  destination:            jsonb('destination').notNull().$type<ShippingAddress>(),

  // Weight & dimensions (aggregate)
  totalWeight:            numeric('total_weight', { precision: 10, scale: 3 }),
  weightUnit:             text('weight_unit').default('lb'),

  // Cost
  shippingCostAmount:     numeric('shipping_cost_amount', { precision: 10, scale: 2 }),
  shippingCostCurrency:   text('shipping_cost_currency').default('USD'),
  customerChargeAmount:   numeric('customer_charge_amount', { precision: 10, scale: 2 }),
  customerChargeCurrency: text('customer_charge_currency').default('USD'),

  // Insurance
  insured:                boolean('insured').default(false),
  insuredValue:           numeric('insured_value', { precision: 10, scale: 2 }),
  insuranceCurrency:      text('insurance_currency'),
  insuranceProvider:      text('insurance_provider'),

  // International
  isInternational:        boolean('is_international').default(false),
  customsDeclarationId:   uuid('customs_declaration_id').references(() => customsDeclarations.id),

  // Delivery
  estimatedDeliveryDate:  timestamp('estimated_delivery_date', { withTimezone: true }),
  actualDeliveryDate:     timestamp('actual_delivery_date', { withTimezone: true }),
  signedBy:               text('signed_by'),

  // Reference
  referenceNumbers:       jsonb('reference_numbers').$type<string[]>().default([]),
  notes:                  text('notes'),
  metadata:               jsonb('metadata').$type<Record<string, unknown>>().default({}),

  // Timestamps
  createdAt:              timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:              timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  shippedAt:              timestamp('shipped_at', { withTimezone: true }),
  deliveredAt:            timestamp('delivered_at', { withTimezone: true }),
  cancelledAt:            timestamp('cancelled_at', { withTimezone: true }),
}, (table) => ({
  ventureIdx:             index('shipments_venture_id_idx').on(table.ventureId),
  orderIdx:               index('shipments_order_id_idx').on(table.orderId),
  statusIdx:              index('shipments_status_idx').on(table.ventureId, table.status),
  trackingIdx:            index('shipments_tracking_number_idx').on(table.trackingNumber),
  carrierIdx:             index('shipments_carrier_code_idx').on(table.ventureId, table.carrierCode),
  createdIdx:             index('shipments_created_at_idx').on(table.ventureId, table.createdAt),
  fulfillmentIdx:         index('shipments_fulfillment_location_idx').on(table.fulfillmentLocationId),
}));

// RLS Policy
// CREATE POLICY shipments_venture_isolation ON shipments
//   USING (venture_id = current_setting('app.venture_id')::uuid);
```

### shipping_labels

Stores generated shipping labels with references to the binary data in object storage.

```typescript
export const shippingLabels = pgTable('shipping_labels', {
  id:                     uuid('id').primaryKey().defaultRandom(),
  ventureId:              uuid('venture_id').notNull().references(() => ventures.id),
  shipmentId:             uuid('shipment_id').notNull().references(() => shipments.id),

  // Carrier info
  carrierCode:            text('carrier_code').notNull(),
  carrierLabelId:         text('carrier_label_id').notNull(),
  trackingNumber:         text('tracking_number').notNull(),

  // Label content
  format:                 text('format').notNull().default('pdf'),
  // 'pdf' | 'zpl' | 'png' | 'epl'
  storageKey:             text('storage_key').notNull(), // Object storage key
  labelUrl:               text('label_url'),              // Signed URL (regenerated on access)
  fileSizeBytes:          numeric('file_size_bytes'),

  // Pricing
  priceAmount:            numeric('price_amount', { precision: 10, scale: 2 }).notNull(),
  priceCurrency:          text('price_currency').notNull().default('USD'),

  // Service info
  serviceLevel:           text('service_level').notNull(),
  isReturn:               boolean('is_return').default(false),

  // Void tracking
  voidableUntil:          timestamp('voidable_until', { withTimezone: true }),
  voidedAt:               timestamp('voided_at', { withTimezone: true }),
  voidReason:             text('void_reason'),

  // Timestamps
  createdAt:              timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:              timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ventureIdx:             index('shipping_labels_venture_id_idx').on(table.ventureId),
  shipmentIdx:            index('shipping_labels_shipment_id_idx').on(table.shipmentId),
  trackingIdx:            index('shipping_labels_tracking_number_idx').on(table.trackingNumber),
  carrierLabelIdx:        index('shipping_labels_carrier_label_id_idx').on(table.carrierLabelId),
}));
```

### tracking_events

Append-only log of all tracking events for all shipments.

```typescript
export const trackingEvents = pgTable('tracking_events', {
  id:                     uuid('id').primaryKey().defaultRandom(),
  ventureId:              uuid('venture_id').notNull().references(() => ventures.id),
  shipmentId:             uuid('shipment_id').notNull().references(() => shipments.id),

  // Event type (normalized)
  type:                   text('type').notNull(),
  // 'label_created' | 'picked_up' | 'in_transit' | 'out_for_delivery' |
  // 'delivery_attempted' | 'delivered' | 'exception' | 'return_to_sender' |
  // 'customs_hold' | 'available_for_pickup' | 'unknown'

  // Event details
  description:            text('description').notNull(),
  location:               jsonb('location').$type<{
                            city: string;
                            state: string;
                            postalCode: string;
                            country: string;
                          }>(),

  // Timing
  occurredAt:             timestamp('occurred_at', { withTimezone: true }).notNull(),
  receivedAt:             timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),

  // Carrier-specific data
  carrierEventCode:       text('carrier_event_code'),
  carrierDescription:     text('carrier_description'),
  carrierEventId:         text('carrier_event_id'),

  // Source
  source:                 text('source').notNull().default('poll'),
  // 'webhook' | 'poll'

  // Delivery-specific
  signedBy:               text('signed_by'),

  // Metadata
  rawPayload:             jsonb('raw_payload').$type<Record<string, unknown>>(),
}, (table) => ({
  ventureIdx:             index('tracking_events_venture_id_idx').on(table.ventureId),
  shipmentIdx:            index('tracking_events_shipment_id_idx').on(table.shipmentId),
  occurredIdx:            index('tracking_events_occurred_at_idx').on(table.shipmentId, table.occurredAt),
  typeIdx:                index('tracking_events_type_idx').on(table.ventureId, table.type),
  dedupeIdx:              index('tracking_events_dedupe_idx')
                            .on(table.shipmentId, table.carrierEventId, table.occurredAt)
                            .where('carrier_event_id IS NOT NULL'),
}));
```

### packages

Physical packages associated with shipments.

```typescript
export const packages = pgTable('packages', {
  id:                     uuid('id').primaryKey().defaultRandom(),
  ventureId:              uuid('venture_id').notNull().references(() => ventures.id),
  shipmentId:             uuid('shipment_id').references(() => shipments.id),

  // Package type
  packageType:            text('package_type').notNull().default('custom'),
  customName:             text('custom_name'),

  // Dimensions
  length:                 numeric('length', { precision: 8, scale: 2 }).notNull(),
  width:                  numeric('width', { precision: 8, scale: 2 }).notNull(),
  height:                 numeric('height', { precision: 8, scale: 2 }).notNull(),
  dimensionUnit:          text('dimension_unit').notNull().default('in'),

  // Weight
  weight:                 numeric('weight', { precision: 8, scale: 3 }).notNull(),
  weightUnit:             text('weight_unit').notNull().default('lb'),
  dimWeight:              numeric('dim_weight', { precision: 8, scale: 3 }),
  billableWeight:         numeric('billable_weight', { precision: 8, scale: 3 }),

  // Value
  declaredValueAmount:    numeric('declared_value_amount', { precision: 10, scale: 2 }),
  declaredValueCurrency:  text('declared_value_currency'),

  // Handling
  fragile:                boolean('fragile').default(false),
  hazmat:                 boolean('hazmat').default(false),
  hazmatClass:            text('hazmat_class'),
  signatureRequired:      text('signature_required').default('none'),
  // 'none' | 'standard' | 'adult'

  // Contents
  items:                  jsonb('items').$type<PackageItem[]>().default([]),

  // Timestamps
  createdAt:              timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:              timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ventureIdx:             index('packages_venture_id_idx').on(table.ventureId),
  shipmentIdx:            index('packages_shipment_id_idx').on(table.shipmentId),
}));
```

### shipping_rules

Declarative shipping rules evaluated by the rules engine.

```typescript
export const shippingRules = pgTable('shipping_rules', {
  id:                     uuid('id').primaryKey().defaultRandom(),
  ventureId:              uuid('venture_id').notNull().references(() => ventures.id),

  // Rule definition
  type:                   text('type').notNull(),
  name:                   text('name').notNull(),
  description:            text('description'),
  priority:               numeric('priority').notNull().default(100),
  enabled:                boolean('enabled').notNull().default(true),

  // Conditions (evaluated as AND by default)
  conditions:             jsonb('conditions').$type<ShippingRuleCondition[]>().notNull().default([]),

  // Action
  action:                 jsonb('action').$type<ShippingRuleAction>().notNull(),

  // Validity period
  validFrom:              timestamp('valid_from', { withTimezone: true }),
  validUntil:             timestamp('valid_until', { withTimezone: true }),

  // Timestamps
  createdAt:              timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:              timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ventureIdx:             index('shipping_rules_venture_id_idx').on(table.ventureId),
  typeIdx:                index('shipping_rules_type_idx').on(table.ventureId, table.type),
  priorityIdx:            index('shipping_rules_priority_idx').on(table.ventureId, table.priority),
  enabledIdx:             index('shipping_rules_enabled_idx').on(table.ventureId, table.enabled),
}));
```

### carrier_configs

Per-venture carrier credentials and settings.

```typescript
export const carrierConfigs = pgTable('carrier_configs', {
  id:                     uuid('id').primaryKey().defaultRandom(),
  ventureId:              uuid('venture_id').notNull().references(() => ventures.id),

  // Carrier
  carrierCode:            text('carrier_code').notNull(),
  enabled:                boolean('enabled').notNull().default(true),

  // Credentials (encrypted via Supabase Vault)
  credentialsVaultId:     text('credentials_vault_id').notNull(),
  accountNumber:          text('account_number'),

  // Mode
  testMode:               boolean('test_mode').notNull().default(true),

  // Rate adjustments
  rateMarkupPercent:      numeric('rate_markup_percent', { precision: 5, scale: 2 }).default(0),
  rateMarkupFlatAmount:   numeric('rate_markup_flat_amount', { precision: 10, scale: 2 }),
  rateMarkupFlatCurrency: text('rate_markup_flat_currency'),

  // Defaults
  defaultLabelFormat:     text('default_label_format').default('pdf'),
  defaultServiceLevel:    text('default_service_level'),

  // Webhook config
  enableWebhookTracking:  boolean('enable_webhook_tracking').default(false),
  webhookUrl:             text('webhook_url'),
  webhookSecret:          text('webhook_secret'),

  // Carrier-specific settings
  settings:               jsonb('settings').$type<Record<string, unknown>>().default({}),

  // Timestamps
  createdAt:              timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:              timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ventureCarrierIdx:      index('carrier_configs_venture_carrier_idx')
                            .on(table.ventureId, table.carrierCode)
                            .where('enabled = true'),
  ventureIdx:             index('carrier_configs_venture_id_idx').on(table.ventureId),
}));

// Unique constraint: one config per carrier per venture
// CREATE UNIQUE INDEX carrier_configs_venture_carrier_unique
//   ON carrier_configs (venture_id, carrier_code);
```

### customs_declarations

Customs declaration documents for international shipments.

```typescript
export const customsDeclarations = pgTable('customs_declarations', {
  id:                     uuid('id').primaryKey().defaultRandom(),
  ventureId:              uuid('venture_id').notNull().references(() => ventures.id),
  shipmentId:             uuid('shipment_id').notNull().references(() => shipments.id),

  // Form type
  formType:               text('form_type').notNull().default('cn23'),
  // 'cn22' | 'cn23' | 'commercial_invoice' | 'proforma_invoice'

  // Contents
  contentsType:           text('contents_type').notNull().default('merchandise'),
  contentsDescription:    text('contents_description').notNull(),

  // Trade terms
  incoterms:              text('incoterms').notNull().default('DAP'),
  dutiesPayor:            text('duties_payor').notNull().default('receiver'),

  // Items
  items:                  jsonb('items').$type<CustomsItem[]>().notNull(),

  // Totals
  totalValueAmount:       numeric('total_value_amount', { precision: 10, scale: 2 }).notNull(),
  totalValueCurrency:     text('total_value_currency').notNull().default('USD'),
  totalWeight:            numeric('total_weight', { precision: 10, scale: 3 }).notNull(),
  totalWeightUnit:        text('total_weight_unit').notNull().default('lb'),

  // Regulatory
  eelPfc:                 text('eel_pfc'),
  nonDeliveryOption:      text('non_delivery_option').default('return'),

  // Signer
  signerName:             text('signer_name').notNull(),
  signatureDate:          timestamp('signature_date', { withTimezone: true }).notNull(),

  // Generated form
  formStorageKey:         text('form_storage_key'),
  formUrl:                text('form_url'),

  // Timestamps
  createdAt:              timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:              timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ventureIdx:             index('customs_declarations_venture_id_idx').on(table.ventureId),
  shipmentIdx:            index('customs_declarations_shipment_id_idx').on(table.shipmentId),
}));
```

### fulfillment_locations

Physical locations that can fulfill and ship orders.

```typescript
export const fulfillmentLocations = pgTable('fulfillment_locations', {
  id:                     uuid('id').primaryKey().defaultRandom(),
  ventureId:              uuid('venture_id').notNull().references(() => ventures.id),

  // Identity
  name:                   text('name').notNull(),
  type:                   text('type').notNull().default('warehouse'),
  // 'warehouse' | 'store' | 'dropship' | 'third_party_logistics'
  active:                 boolean('active').notNull().default(true),

  // Address
  address:                jsonb('address').notNull().$type<ShippingAddress>(),
  latitude:               numeric('latitude', { precision: 10, scale: 7 }),
  longitude:              numeric('longitude', { precision: 10, scale: 7 }),

  // Fulfillment config
  priority:               numeric('priority').notNull().default(100),
  enabledCarriers:        jsonb('enabled_carriers').$type<CarrierCode[]>().default([]),
  supportsPickup:         boolean('supports_pickup').default(false),
  dailyCapacity:          numeric('daily_capacity'),

  // Operating hours
  operatingHours:         jsonb('operating_hours').$type<{
                            timezone: string;
                            weekday: { open: string; close: string; cutoffTime: string };
                            saturday: { open: string; close: string; cutoffTime: string } | null;
                            sunday: { open: string; close: string; cutoffTime: string } | null;
                          }>(),

  // Contact
  contactName:            text('contact_name'),
  contactPhone:           text('contact_phone'),
  contactEmail:           text('contact_email'),

  // Metadata
  metadata:               jsonb('metadata').$type<Record<string, unknown>>().default({}),

  // Timestamps
  createdAt:              timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:              timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ventureIdx:             index('fulfillment_locations_venture_id_idx').on(table.ventureId),
  activeIdx:              index('fulfillment_locations_active_idx').on(table.ventureId, table.active),
  geoIdx:                 index('fulfillment_locations_geo_idx').on(table.latitude, table.longitude),
}));
```

### shipping_zones

Geographic zone definitions for pricing and restrictions.

```typescript
export const shippingZones = pgTable('shipping_zones', {
  id:                     uuid('id').primaryKey().defaultRandom(),
  ventureId:              uuid('venture_id').notNull().references(() => ventures.id),

  // Zone definition
  name:                   text('name').notNull(),
  code:                   text('code').notNull(),
  enabled:                boolean('enabled').notNull().default(true),
  sortOrder:              numeric('sort_order').default(0),

  // Geographic scope
  countries:              jsonb('countries').$type<string[]>().notNull().default([]),
  regions:                jsonb('regions').$type<{ country: string; states: string[] }[]>().default([]),
  postalCodePatterns:     jsonb('postal_code_patterns').$type<{
                            country: string;
                            patterns: string[];
                          }[]>().default([]),

  // Default rates
  defaultRates:           jsonb('default_rates').$type<ZoneRate[]>().default([]),

  // Timestamps
  createdAt:              timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:              timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ventureIdx:             index('shipping_zones_venture_id_idx').on(table.ventureId),
  codeIdx:                index('shipping_zones_code_idx').on(table.ventureId, table.code),
}));

// Unique constraint: one zone code per venture
// CREATE UNIQUE INDEX shipping_zones_venture_code_unique
//   ON shipping_zones (venture_id, code);
```

### return_shipments

Return shipments linked back to original outbound shipments.

```typescript
export const returnShipments = pgTable('return_shipments', {
  id:                     uuid('id').primaryKey().defaultRandom(),
  ventureId:              uuid('venture_id').notNull().references(() => ventures.id),
  originalShipmentId:     uuid('original_shipment_id').notNull().references(() => shipments.id),
  returnId:               uuid('return_id'), // references returns module

  // Status
  status:                 text('status').notNull().default('label_created'),
  // 'label_created' | 'in_transit' | 'delivered' | 'cancelled'

  // Carrier
  carrierCode:            text('carrier_code').notNull(),
  trackingNumber:         text('tracking_number').notNull(),
  labelId:                uuid('label_id').references(() => shippingLabels.id),

  // Cost
  prepaid:                boolean('prepaid').notNull().default(true),
  costAmount:             numeric('cost_amount', { precision: 10, scale: 2 }).notNull(),
  costCurrency:           text('cost_currency').notNull().default('USD'),
  costAllocatedTo:        text('cost_allocated_to').notNull().default('venture'),
  // 'venture' | 'customer'

  // Pickup
  pickupScheduledDate:    timestamp('pickup_scheduled_date', { withTimezone: true }),
  pickupConfirmationNum:  text('pickup_confirmation_num'),
  carrierPickupId:        text('carrier_pickup_id'),

  // Addresses
  origin:                 jsonb('origin').notNull().$type<ShippingAddress>(),
  destination:            jsonb('destination').notNull().$type<ShippingAddress>(),

  // Timestamps
  createdAt:              timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:              timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deliveredAt:            timestamp('delivered_at', { withTimezone: true }),
}, (table) => ({
  ventureIdx:             index('return_shipments_venture_id_idx').on(table.ventureId),
  originalIdx:            index('return_shipments_original_shipment_idx').on(table.originalShipmentId),
  statusIdx:              index('return_shipments_status_idx').on(table.ventureId, table.status),
  trackingIdx:            index('return_shipments_tracking_number_idx').on(table.trackingNumber),
}));
```

---

## Code Examples

### 1 — Get Shipping Rates for a Cart

Fetch real-time rates from all enabled carriers at checkout. Rates are pre-filtered by shipping rules and sorted by price.

```typescript
import { createShippingService } from '@mcv/commerce/shipping';

// Initialize the shipping service for this venture
const shipping = createShippingService({
  ventureId: ctx.ventureId,
  db: ctx.db,
});

// Get rates for a cart ready for shipment
const rates = await shipping.getRates({
  origin: {
    name: 'MCV Warehouse NYC',
    street1: '123 Fulfillment Ave',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'US',
  },
  destination: {
    name: 'Jane Smith',
    street1: '456 Customer St',
    street2: 'Apt 7B',
    city: 'Los Angeles',
    state: 'CA',
    postalCode: '90210',
    country: 'US',
  },
  packages: [
    {
      length: 12,
      width: 8,
      height: 6,
      dimensionUnit: 'in',
      weight: 3.5,
      weightUnit: 'lb',
      items: [
        {
          productId: 'prod_abc123',
          variantId: 'var_red_lg',
          description: 'Premium Widget (Red, Large)',
          quantity: 2,
          weight: 1.5,
          weightUnit: 'lb',
          value: 49.99,
          currency: 'USD',
        },
        {
          productId: 'prod_def456',
          variantId: null,
          description: 'Widget Accessory Kit',
          quantity: 1,
          weight: 0.5,
          weightUnit: 'lb',
          value: 19.99,
          currency: 'USD',
        },
      ],
    },
  ],
  shipDate: new Date('2026-02-10'),
});

// rates is sorted by price ascending
// Example output:
// [
//   {
//     rateId: 'rate_usps_ground_abc123',
//     carrierCode: 'usps',
//     carrierName: 'USPS',
//     serviceLevel: 'usps_ground_advantage',
//     serviceLevelName: 'USPS Ground Advantage',
//     price: { amount: 8.45, currency: 'USD' },
//     estimatedDeliveryDate: new Date('2026-02-14'),
//     estimatedTransitDays: 4,
//     guaranteedDelivery: false,
//     ...
//   },
//   {
//     rateId: 'rate_ups_ground_def456',
//     carrierCode: 'ups',
//     carrierName: 'UPS',
//     serviceLevel: 'ups_ground',
//     serviceLevelName: 'UPS Ground',
//     price: { amount: 11.23, currency: 'USD' },
//     estimatedDeliveryDate: new Date('2026-02-13'),
//     estimatedTransitDays: 3,
//     ...
//   },
//   {
//     rateId: 'rate_fedex_2day_ghi789',
//     carrierCode: 'fedex',
//     carrierName: 'FedEx',
//     serviceLevel: 'fedex_2day',
//     serviceLevelName: 'FedEx 2Day',
//     price: { amount: 18.67, currency: 'USD' },
//     estimatedDeliveryDate: new Date('2026-02-12'),
//     estimatedTransitDays: 2,
//     guaranteedDelivery: true,
//     ...
//   },
// ]

// Present rates to customer at checkout
const cheapest = rates[0];
const fastest = rates.reduce((a, b) =>
  a.estimatedTransitDays < b.estimatedTransitDays ? a : b
);

console.log(`Cheapest: ${cheapest.serviceLevelName} — $${cheapest.price.amount}`);
console.log(`Fastest:  ${fastest.serviceLevelName} — $${fastest.price.amount}`);
```

### 2 — Purchase a Shipping Label

Purchase a label using a rate ID from a previous `getRates()` call. The label is stored in object storage and a signed URL is generated.

```typescript
import { createShippingService } from '@mcv/commerce/shipping';

const shipping = createShippingService({
  ventureId: ctx.ventureId,
  db: ctx.db,
});

// Customer selected UPS Ground at checkout
const selectedRateId = 'rate_ups_ground_def456';

// Purchase the label
const label = await shipping.purchaseLabel(selectedRateId, {
  format: 'pdf',
  referenceNumbers: ['ORD-2026-0001'],
  signatureRequired: 'none',
  saturdayDelivery: false,
  insurance: {
    insure: true,
    value: 119.97,
    currency: 'USD',
  },
});

console.log(`Label ID:        ${label.id}`);
console.log(`Tracking Number: ${label.trackingNumber}`);
console.log(`Label URL:       ${label.labelUrl}`);
console.log(`Cost:            $${label.price.amount}`);
console.log(`Voidable Until:  ${label.voidableUntil.toISOString()}`);
// Label ID:        lbl_a1b2c3d4
// Tracking Number: 1Z999AA10123456784
// Label URL:       https://storage.mcv.one/labels/lbl_a1b2c3d4.pdf?token=...
// Cost:            $11.23
// Voidable Until:  2026-02-11T23:59:59.000Z

// For batch fulfillment, use purchaseLabelBatch:
const batchResults = await shipping.purchaseLabelBatch([
  { rateId: 'rate_ups_ground_001', options: { format: 'zpl' } },
  { rateId: 'rate_ups_ground_002', options: { format: 'zpl' } },
  { rateId: 'rate_ups_ground_003', options: { format: 'zpl' } },
  { rateId: 'rate_fedex_2day_004', options: { format: 'zpl' } },
]);

// batchResults: [
//   { success: true, label: { ... }, error: null },
//   { success: true, label: { ... }, error: null },
//   { success: false, label: null, error: { code: 'RATE_EXPIRED', ... } },
//   { success: true, label: { ... }, error: null },
// ]

const succeeded = batchResults.filter(r => r.success);
const failed = batchResults.filter(r => !r.success);
console.log(`Batch: ${succeeded.length} labels created, ${failed.length} failures`);
```

### 3 — Track a Shipment

Get the full tracking timeline for a shipment, including normalized events from multiple sources.

```typescript
import { createShippingService } from '@mcv/commerce/shipping';

const shipping = createShippingService({
  ventureId: ctx.ventureId,
  db: ctx.db,
});

// Track by internal shipment ID
const timeline = await shipping.getTracking('shp_xyz789');

console.log(`Status:    ${timeline.currentStatus}`);
console.log(`Carrier:   ${timeline.carrierName}`);
console.log(`Tracking:  ${timeline.trackingNumber}`);
console.log(`ETA:       ${timeline.estimatedDeliveryDate?.toLocaleDateString()}`);
console.log(`Events:    ${timeline.events.length}`);

// Output:
// Status:    in_transit
// Carrier:   UPS
// Tracking:  1Z999AA10123456784
// ETA:       2/13/2026
// Events:    4

for (const event of timeline.events) {
  const loc = event.location
    ? `${event.location.city}, ${event.location.state}`
    : 'N/A';
  console.log(
    `  [${event.occurredAt.toISOString()}] ${event.type}: ${event.description} (${loc})`
  );
}
// [2026-02-10T14:30:00Z] label_created: Shipping label created (N/A)
// [2026-02-10T18:45:00Z] picked_up: Picked up by carrier (New York, NY)
// [2026-02-11T06:12:00Z] in_transit: In transit — arrived at facility (Columbus, OH)
// [2026-02-11T22:30:00Z] in_transit: In transit — departed facility (Denver, CO)

// Track by carrier tracking number (public API — no auth needed for tracking page)
const publicTimeline = await shipping.getTrackingByNumber(
  '1Z999AA10123456784',
  'ups'
);

// Get customer-facing tracking page URL
const trackingPageUrl = await shipping.getTrackingPageUrl('shp_xyz789');
console.log(`Public tracking page: ${trackingPageUrl}`);
// Public tracking page: https://track.myventure.com/shp_xyz789

// The tracking page is rendered by TrackingPageRenderer and shows:
// - Current status with visual progress bar
// - Full event timeline with locations
// - Estimated delivery date
// - Map visualization (if carrier provides coordinates)
// - Venture branding
```

### 4 — Configure Carrier Credentials

Set up carrier API credentials for a venture. Credentials are encrypted at rest via Supabase Vault.

```typescript
import { shippingRouter } from '@mcv/commerce/shipping';

// Via tRPC (admin panel context)
// Configure UPS for this venture
const upsConfig = await trpc.shipping.configureCarrier.mutate({
  carrierCode: 'ups',
  enabled: true,
  credentials: {
    clientId: 'ups_client_id_here',
    clientSecret: 'ups_client_secret_here',
    accountNumber: '1A2B3C',
  },
  testMode: false,
  rateMarkupPercent: 5.0, // 5% markup on UPS rates
  defaultLabelFormat: 'zpl', // Thermal printer labels
  defaultServiceLevel: 'ups_ground',
  enableWebhookTracking: true,
  settings: {
    negotiatedRates: true,     // Use negotiated/account rates
    carbonNeutral: true,       // UPS Carbon Neutral shipping
    directDeliveryOnly: false,
  },
});

// Configure FedEx
const fedexConfig = await trpc.shipping.configureCarrier.mutate({
  carrierCode: 'fedex',
  enabled: true,
  credentials: {
    clientId: 'fedex_api_key',
    clientSecret: 'fedex_secret_key',
    accountNumber: '123456789',
    meterNumber: '987654321',
  },
  testMode: false,
  rateMarkupPercent: 0, // No markup
  defaultLabelFormat: 'pdf',
  enableWebhookTracking: true,
  settings: {
    smartPostEnabled: true,
    smartPostHubId: '5531',
    holdAtLocation: true,
  },
});

// Configure EasyPost (aggregator — covers multiple carriers)
const easypostConfig = await trpc.shipping.configureCarrier.mutate({
  carrierCode: 'easypost',
  enabled: true,
  credentials: {
    apiKey: 'EZAKxxxxxxxxxxxxxxxxxxxxxxxx',
  },
  testMode: false,
  rateMarkupPercent: 3.0,
  defaultLabelFormat: 'pdf',
  enableWebhookTracking: true,
  settings: {
    enabledCarriers: ['usps', 'ups', 'fedex'], // Carriers enabled via EasyPost
    preferEasyPostRates: false, // Use direct carrier rates when available
  },
});

// List all configured carriers for a venture
const configs = await trpc.shipping.listCarrierConfigs.query();
// [
//   { carrierCode: 'ups', enabled: true, testMode: false, ... },
//   { carrierCode: 'fedex', enabled: true, testMode: false, ... },
//   { carrierCode: 'easypost', enabled: true, testMode: false, ... },
// ]

// Test carrier connection (validates credentials)
const testResult = await trpc.shipping.testCarrierConnection.mutate({
  carrierCode: 'ups',
});
// { success: true, message: 'Connected to UPS API successfully', responseTimeMs: 342 }
```

### 5 — Create International Shipment with Customs

Ship internationally with a full customs declaration, HS codes, and duties estimation.

```typescript
import { createShippingService } from '@mcv/commerce/shipping';

const shipping = createShippingService({
  ventureId: ctx.ventureId,
  db: ctx.db,
});

// Step 1: Estimate duties and taxes before customer commits
const estimate = await shipping.estimateDutiesTax({
  originCountry: 'US',
  destinationCountry: 'GB',
  items: [
    {
      description: 'Handcrafted Leather Wallet',
      hsCode: '4202.31',
      quantity: 1,
      value: 89.99,
      currency: 'USD',
      weight: 0.3,
      weightUnit: 'lb',
      countryOfOrigin: 'US',
    },
    {
      description: 'Silk Scarf',
      hsCode: '6214.10',
      quantity: 2,
      value: 45.00,
      currency: 'USD',
      weight: 0.1,
      weightUnit: 'lb',
      countryOfOrigin: 'IT',
    },
  ],
  shippingCost: 24.50,
  incoterms: 'DDP', // We pay duties on behalf of customer
});

console.log(`Duty:         $${estimate.duty.amount} (${estimate.duty.rate}%)`);
console.log(`VAT:          $${estimate.tax.amount} (${estimate.tax.rate}%)`);
console.log(`Landed Cost:  $${estimate.totalLandedCost.amount}`);
// Duty:         $8.10 (4.5%)
// VAT:          $40.92 (20%)
// Landed Cost:  $253.51

// Step 2: Create the shipment with customs declaration
const shipment = await shipping.createShipment({
  orderId: 'ord_intl_001',
  carrierCode: 'dhl',
  serviceLevel: 'dhl_express_worldwide',
  origin: {
    name: 'MCV Warehouse',
    company: 'MCV Ventures Inc.',
    street1: '123 Fulfillment Ave',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'US',
    phone: '+12125551234',
  },
  destination: {
    name: 'John Smith',
    street1: '42 Baker Street',
    city: 'London',
    postalCode: 'NW1 6XE',
    country: 'GB',
    phone: '+447700900123',
  },
  packages: [
    {
      length: 10,
      width: 8,
      height: 4,
      dimensionUnit: 'in',
      weight: 0.8,
      weightUnit: 'lb',
      declaredValue: { amount: 179.99, currency: 'USD' },
      items: [
        {
          productId: 'prod_wallet',
          description: 'Handcrafted Leather Wallet',
          quantity: 1,
          weight: 0.3,
          weightUnit: 'lb',
          value: 89.99,
          currency: 'USD',
          hsCode: '4202.31',
          countryOfOrigin: 'US',
        },
        {
          productId: 'prod_scarf',
          description: 'Silk Scarf',
          quantity: 2,
          weight: 0.1,
          weightUnit: 'lb',
          value: 45.00,
          currency: 'USD',
          hsCode: '6214.10',
          countryOfOrigin: 'IT',
        },
      ],
    },
  ],
  customs: {
    contentsType: 'merchandise',
    contentsDescription: 'Leather goods and silk accessories',
    incoterms: 'DDP',
    dutiesPayor: 'sender',
    nonDeliveryOption: 'return',
    signerName: 'Fulfillment Manager',
    eelPfc: 'NOEEI 30.37(a)',
  },
  labelFormat: 'pdf',
  insurance: { insure: true, value: 179.99, currency: 'USD' },
});

console.log(`Shipment ID:      ${shipment.id}`);
console.log(`Tracking:         ${shipment.trackingNumber}`);
console.log(`Customs Form:     ${shipment.customsDeclaration?.formDocument?.url}`);
console.log(`Label URL:        ${shipment.label?.labelUrl}`);
```

### 6 — Apply Shipping Rules Engine

Configure and evaluate shipping rules for free shipping, flat rate, restrictions, and more.

```typescript
import { shippingRouter } from '@mcv/commerce/shipping';

// === Create Shipping Rules ===

// Rule 1: Free shipping on orders over $75
await trpc.shipping.createRule.mutate({
  type: 'free_shipping',
  name: 'Free shipping over $75',
  description: 'Free standard shipping for domestic orders over $75',
  priority: 10,
  enabled: true,
  conditions: [
    { field: 'cart_subtotal', operator: 'gte', value: 75.00 },
    { field: 'destination_country', operator: 'eq', value: 'US' },
  ],
  action: {
    type: 'free_shipping',
    value: null,
    unit: null,
    customerMessage: '🎉 Free shipping on your order!',
  },
});

// Rule 2: Flat rate $5.99 for small items
await trpc.shipping.createRule.mutate({
  type: 'flat_rate',
  name: 'Flat rate small items',
  description: '$5.99 flat rate for orders under 2 lbs',
  priority: 20,
  enabled: true,
  conditions: [
    { field: 'cart_weight', operator: 'lt', value: 2.0 },
    { field: 'destination_country', operator: 'eq', value: 'US' },
  ],
  action: {
    type: 'set_price',
    value: 5.99,
    unit: 'fixed',
    customerMessage: null,
  },
});

// Rule 3: Block shipping to PO Boxes for large items
await trpc.shipping.createRule.mutate({
  type: 'product_restriction',
  name: 'No PO Box for large items',
  description: 'Products tagged "oversized" cannot ship to PO Boxes',
  priority: 5, // High priority — evaluated early
  enabled: true,
  conditions: [
    { field: 'product_tag', operator: 'contains', value: 'oversized' },
    { field: 'destination_zip', operator: 'regex', value: '^(?:PO|P\\.O\\.)' },
  ],
  action: {
    type: 'block_destination',
    value: null,
    unit: null,
    customerMessage: 'Oversized items cannot be shipped to PO Boxes.',
  },
});

// Rule 4: Restrict hazmat items to ground shipping only
await trpc.shipping.createRule.mutate({
  type: 'hazmat_restriction',
  name: 'Hazmat ground only',
  description: 'Hazardous materials can only ship via ground services',
  priority: 1,
  enabled: true,
  conditions: [
    { field: 'product_tag', operator: 'contains', value: 'hazmat' },
  ],
  action: {
    type: 'block_service',
    value: 'air', // Block all air services
    unit: null,
    customerMessage: 'This order contains materials that require ground shipping.',
  },
});

// Rule 5: Holiday surcharge
await trpc.shipping.createRule.mutate({
  type: 'rate_adjustment',
  name: 'Holiday peak surcharge',
  description: '15% surcharge during peak holiday season',
  priority: 50,
  enabled: true,
  conditions: [], // Applies to all shipments
  action: {
    type: 'adjust_price',
    value: 15,
    unit: 'percent',
    customerMessage: 'Holiday season shipping surcharge applies.',
  },
  validFrom: new Date('2026-11-15'),
  validUntil: new Date('2026-12-31'),
});

// Rule 6: No shipping to sanctioned countries
await trpc.shipping.createRule.mutate({
  type: 'geo_restriction',
  name: 'Sanctioned country block',
  description: 'Block shipping to OFAC sanctioned countries',
  priority: 0, // Highest priority
  enabled: true,
  conditions: [
    {
      field: 'destination_country',
      operator: 'in',
      value: ['CU', 'IR', 'KP', 'SY', 'RU'],
    },
  ],
  action: {
    type: 'block_destination',
    value: null,
    unit: null,
    customerMessage: 'We are unable to ship to this destination.',
  },
});

// === Evaluate Rules at Checkout ===

import { ShippingRulesEngine } from '@mcv/commerce/shipping';

const rulesEngine = new ShippingRulesEngine({
  ventureId: ctx.ventureId,
  db: ctx.db,
});

const evaluation = await rulesEngine.evaluate({
  cartSubtotal: 89.99,
  cartWeight: 1.5,
  cartItemCount: 3,
  destination: { country: 'US', state: 'CA', postalCode: '90210' },
  productTags: ['clothing', 'accessories'],
  rates: originalRates, // Rates from carrier APIs
});

console.log(`Rules applied: ${evaluation.appliedRules.map(r => r.name).join(', ')}`);
console.log(`Free shipping: ${evaluation.freeShipping}`);
console.log(`Blocked carriers: ${evaluation.blockedCarriers}`);
console.log(`Customer messages: ${evaluation.customerMessages}`);
// Rules applied: Free shipping over $75
// Free shipping: true
// Blocked carriers: []
// Customer messages: ['🎉 Free shipping on your order!']
```

### 7 — Generate Return Label

Create a return label for a customer who wants to send items back, with optional carrier pickup scheduling.

```typescript
import { createShippingService } from '@mcv/commerce/shipping';

const shipping = createShippingService({
  ventureId: ctx.ventureId,
  db: ctx.db,
});

// Generate a prepaid return label for an existing shipment
const returnShipment = await shipping.createReturnLabel('shp_xyz789', {
  prepaid: true,
  costAllocatedTo: 'venture', // Venture pays for return shipping
  carrierCode: 'ups',         // Use UPS for returns (or null for cheapest)
  serviceLevel: 'ups_ground', // Ground for returns
  format: 'pdf',
  reason: 'Customer return — wrong size',
  returnWarehouseId: 'loc_returns_nyc', // Specific return processing center
});

console.log(`Return ID:       ${returnShipment.id}`);
console.log(`Return Tracking: ${returnShipment.trackingNumber}`);
console.log(`Return Label:    ${returnShipment.label.labelUrl}`);
console.log(`Return Cost:     $${returnShipment.cost.amount}`);
// Return ID:       ret_abc123
// Return Tracking: 1Z999AA10987654321
// Return Label:    https://storage.mcv.one/labels/ret_abc123.pdf?token=...
// Return Cost:     $9.87

// Email the return label to the customer
// (This integrates with @mcv/notifications/email)
await trpc.shipping.emailReturnLabel.mutate({
  returnShipmentId: returnShipment.id,
  customerEmail: 'jane@example.com',
  message: 'Here is your prepaid return label. Please ship within 30 days.',
});

// Schedule a carrier pickup for the return
const pickup = await trpc.shipping.scheduleReturnPickup.mutate({
  returnShipmentId: returnShipment.id,
  pickupDate: new Date('2026-02-15'),
  pickupAddress: {
    name: 'Jane Smith',
    street1: '456 Customer St',
    street2: 'Apt 7B',
    city: 'Los Angeles',
    state: 'CA',
    postalCode: '90210',
    country: 'US',
    phone: '+13105551234',
  },
  pickupWindow: {
    earliest: '09:00',
    latest: '17:00',
  },
  packageCount: 1,
  totalWeight: { value: 3.5, unit: 'lb' },
  specialInstructions: 'Leave at front door if no answer.',
});

console.log(`Pickup confirmation: ${pickup.confirmationNumber}`);
console.log(`Pickup date:         ${pickup.scheduledDate.toLocaleDateString()}`);
// Pickup confirmation: PKP-20260215-001
// Pickup date:         2/15/2026

// Track the return shipment
const returnTracking = await shipping.getTracking(returnShipment.id);
console.log(`Return status: ${returnTracking.currentStatus}`);
```

### 8 — Multi-Warehouse Fulfillment Routing

Route an order to the optimal warehouse(s) based on inventory availability, proximity, and cost.

```typescript
import { createShippingService, FulfillmentRouter } from '@mcv/commerce/shipping';

const shipping = createShippingService({
  ventureId: ctx.ventureId,
  db: ctx.db,
});

// Plan fulfillment for an order with multiple items
const fulfillmentPlan = await shipping.planFulfillment({
  orderId: 'ord_multi_001',
  destination: {
    name: 'Alex Johnson',
    street1: '789 Main St',
    city: 'Chicago',
    state: 'IL',
    postalCode: '60601',
    country: 'US',
  },
  lineItems: [
    { productId: 'prod_a', variantId: 'var_a1', quantity: 2, weight: 1.0, weightUnit: 'lb' },
    { productId: 'prod_b', variantId: null,      quantity: 1, weight: 5.0, weightUnit: 'lb' },
    { productId: 'prod_c', variantId: 'var_c2', quantity: 3, weight: 0.5, weightUnit: 'lb' },
  ],
  strategy: 'balanced', // Optimize for cost + speed
  preferences: {
    maxSplits: 2,             // Allow at most 2 shipments
    preferSingleShipment: true, // Try single shipment first
    excludeLocations: [],
  },
});

console.log(`Strategy used: ${fulfillmentPlan.strategy}`);
console.log(`Shipments:     ${fulfillmentPlan.shipments.length}`);
console.log(`Total cost:    $${fulfillmentPlan.totalEstimatedCost.amount}`);
console.log(`Split needed:  ${fulfillmentPlan.isSplit}`);

for (const shipment of fulfillmentPlan.shipments) {
  console.log(`\n  From: ${shipment.fulfillmentLocation.name}`);
  console.log(`  Distance: ${shipment.distanceMiles} miles`);
  console.log(`  Items: ${shipment.items.map(i => i.productId).join(', ')}`);
  console.log(`  Est. cost: $${shipment.estimatedShippingCost.amount}`);
  console.log(`  Est. delivery: ${shipment.estimatedDeliveryDate.toLocaleDateString()}`);
}

// Example output:
// Strategy used: balanced
// Shipments:     2
// Total cost:    $14.67
// Split needed:  true
//
//   From: Warehouse Chicago (ORD)
//   Distance: 3 miles
//   Items: prod_a, prod_c
//   Est. cost: $6.45
//   Est. delivery: 2/11/2026
//
//   From: Warehouse NYC (JFK)
//   Distance: 790 miles
//   Items: prod_b
//   Est. cost: $8.22
//   Est. delivery: 2/13/2026

// Execute the fulfillment plan (creates actual shipments)
const executedShipments = await shipping.executeFulfillmentPlan(fulfillmentPlan.id);

for (const shipment of executedShipments) {
  console.log(`Shipment ${shipment.id}: tracking ${shipment.trackingNumber}`);
}

// === In-Store Pickup Example ===

const pickupPlan = await shipping.planFulfillment({
  orderId: 'ord_pickup_001',
  destination: {
    name: 'Alex Johnson',
    street1: '789 Main St',
    city: 'Chicago',
    state: 'IL',
    postalCode: '60601',
    country: 'US',
  },
  lineItems: [
    { productId: 'prod_d', variantId: null, quantity: 1, weight: 2.0, weightUnit: 'lb' },
  ],
  strategy: 'closest_single',
  preferences: {
    allowPickup: true,
    preferPickup: true, // Customer prefers in-store pickup
    maxPickupDistanceMiles: 25,
  },
});

if (fulfillmentPlan.shipments[0].isPickup) {
  console.log(`In-store pickup at: ${fulfillmentPlan.shipments[0].fulfillmentLocation.name}`);
  console.log(`Ready by: ${fulfillmentPlan.shipments[0].readyByDate.toLocaleDateString()}`);
  // In-store pickup at: MCV Store — Michigan Ave
  // Ready by: 2/9/2026
}
```

---

## Error Codes

All errors thrown by this module are instances of `ShippingError` with a `code` property from the following table:

| Code | HTTP | Description |
|------|------|-------------|
| `CARRIER_NOT_FOUND` | 404 | Requested carrier code does not exist or is not registered |
| `CARRIER_NOT_CONFIGURED` | 400 | Carrier is not configured for this venture |
| `CARRIER_DISABLED` | 400 | Carrier is configured but disabled for this venture |
| `CARRIER_AUTH_FAILED` | 401 | Carrier API returned an authentication error; credentials may be invalid |
| `CARRIER_API_ERROR` | 502 | Carrier API returned an unexpected error |
| `CARRIER_TIMEOUT` | 504 | Carrier API did not respond within the timeout window |
| `CARRIER_RATE_LIMITED` | 429 | Carrier API rate limit exceeded; retry after backoff |
| `RATE_NOT_FOUND` | 404 | The specified rate ID does not exist |
| `RATE_EXPIRED` | 410 | The quoted rate has expired; re-query rates |
| `RATE_UNAVAILABLE` | 422 | The carrier cannot provide rates for this origin/destination/package |
| `LABEL_PURCHASE_FAILED` | 502 | Carrier could not generate a label (insufficient funds, invalid address, etc.) |
| `LABEL_VOID_FAILED` | 400 | Could not void the label (already voided, in transit, etc.) |
| `VOID_WINDOW_EXPIRED` | 400 | The void window for this label has passed |
| `SHIPMENT_NOT_FOUND` | 404 | Requested shipment ID does not exist in this venture |
| `SHIPMENT_ALREADY_IN_TRANSIT` | 409 | Cannot modify a shipment that is already in transit |
| `SHIPMENT_ALREADY_DELIVERED` | 409 | Cannot modify a shipment that has been delivered |
| `SHIPMENT_CANCELLED` | 409 | Cannot perform operations on a cancelled shipment |
| `TRACKING_NOT_FOUND` | 404 | No tracking information found for this number/shipment |
| `ADDRESS_VALIDATION_FAILED` | 422 | Address could not be validated; details in error.meta |
| `ADDRESS_INCOMPLETE` | 422 | Required address fields are missing |
| `ORIGIN_REQUIRED` | 400 | Origin address is required for rate calculation |
| `DESTINATION_REQUIRED` | 400 | Destination address is required for rate calculation |
| `PACKAGE_REQUIRED` | 400 | At least one package is required |
| `PACKAGE_EXCEEDS_LIMITS` | 422 | Package weight or dimensions exceed carrier limits |
| `CUSTOMS_REQUIRED` | 400 | International shipments require a customs declaration |
| `CUSTOMS_HS_CODE_INVALID` | 422 | HS code format is invalid or not recognized |
| `CUSTOMS_RESTRICTED_ITEM` | 403 | Item is restricted for export to the destination country |
| `CUSTOMS_PROHIBITED_ITEM` | 403 | Item is prohibited for export to the destination country |
| `GEO_RESTRICTION` | 403 | Shipping to this destination is blocked by a geo restriction rule |
| `HAZMAT_NOT_ALLOWED` | 403 | Hazardous materials cannot be shipped with the selected service |
| `FULFILLMENT_NO_INVENTORY` | 422 | No fulfillment location has sufficient inventory |
| `FULFILLMENT_LOCATION_NOT_FOUND` | 404 | Specified fulfillment location does not exist |
| `FULFILLMENT_LOCATION_CLOSED` | 400 | Fulfillment location is closed or inactive |
| `RETURN_ORIGINAL_NOT_FOUND` | 404 | Original outbound shipment not found for return |
| `RETURN_ALREADY_EXISTS` | 409 | A return shipment already exists for this outbound shipment |
| `PICKUP_SCHEDULE_FAILED` | 502 | Carrier could not schedule a pickup |
| `PICKUP_DATE_INVALID` | 422 | Pickup date is in the past or outside carrier's scheduling window |
| `WEBHOOK_SIGNATURE_INVALID` | 401 | Webhook payload signature verification failed |
| `RULE_VALIDATION_FAILED` | 422 | Shipping rule definition is invalid |
| `RULE_CONFLICT` | 409 | Shipping rule conflicts with an existing rule of higher priority |
| `ZONE_NOT_FOUND` | 404 | No shipping zone matches the destination |
| `PACKING_FAILED` | 422 | Items could not be packed into available box types |
| `INSURANCE_LIMIT_EXCEEDED` | 422 | Declared value exceeds carrier's insurance limit |
| `VENTURE_NOT_CONFIGURED` | 400 | Venture has no shipping configuration (no carriers enabled) |

Error shape:

```typescript
class ShippingError extends Error {
  constructor(
    public readonly code: string,
    public readonly meta?: Record<string, unknown>,
    public readonly httpStatus?: number,
  ) {
    super(`[${code}] ${meta?.message || code}`);
    this.name = 'ShippingError';
  }
}

// Usage:
try {
  await shipping.purchaseLabel(rateId);
} catch (err) {
  if (err instanceof ShippingError) {
    switch (err.code) {
      case 'RATE_EXPIRED':
        // Re-fetch rates
        break;
      case 'CARRIER_AUTH_FAILED':
        // Alert admin to check credentials
        break;
      case 'ADDRESS_VALIDATION_FAILED':
        // Show validation errors to customer
        const issues = err.meta?.validationErrors as string[];
        break;
    }
  }
}
```

---

## Security

### Credential Storage

All carrier API credentials are stored encrypted at rest using **Supabase Vault**. The `carrier_configs` table stores a `credentials_vault_id` reference rather than raw credentials. Credentials are decrypted only in memory during carrier adapter initialization and are never logged, serialized to JSON responses, or exposed in error messages.

```sql
-- Credentials are stored in Supabase Vault, referenced by ID
-- NEVER in plaintext in carrier_configs
SELECT decrypted_secret
FROM vault.decrypted_secrets
WHERE id = carrier_configs.credentials_vault_id;
```

### Row-Level Security

Every table in this module enforces venture-scoped RLS:

```sql
-- All tables have this policy pattern:
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY shipments_venture_isolation ON shipments
  FOR ALL
  USING (venture_id = current_setting('app.venture_id')::uuid)
  WITH CHECK (venture_id = current_setting('app.venture_id')::uuid);

-- The venture_id is set per-request in the Supabase client:
-- SET LOCAL app.venture_id = '<uuid>';
```

### Webhook Security

Incoming tracking webhooks from carriers are verified using carrier-specific signature validation:

- **UPS:** HMAC-SHA256 signature in `X-UPS-Signature` header, verified against the webhook secret stored in `carrier_configs.settings.webhookSecret`
- **FedEx:** OAuth2 bearer token validation
- **EasyPost:** HMAC-SHA256 in `X-Hmac-Sha256-Signature` header
- **DHL:** API key in query parameter, validated against stored key

Webhooks that fail signature verification are rejected with `401` and logged for security review. The `WEBHOOK_SIGNATURE_INVALID` error code is recorded.

### Label Storage

Generated shipping labels are stored in **Supabase Storage** with:

- **Signed URLs:** Labels are accessed via time-limited signed URLs (default: 1 hour). The `labelUrl` field is regenerated on each access.
- **Bucket-level RLS:** The labels storage bucket enforces venture isolation; labels are stored under `labels/{venture_id}/{label_id}.{format}`.
- **No public access:** Labels are never served from public URLs.

### PII Handling

Shipping addresses contain PII (names, addresses, phone numbers). This module:

- Stores addresses as JSONB in the database (covered by Supabase encryption at rest)
- Never logs full addresses in application logs (only city/state/country for debugging)
- Redacts PII from error messages and carrier API error responses
- Supports address deletion for GDPR compliance via the data subject deletion flow

### Rate Integrity

Rate IDs are cryptographically signed to prevent tampering:

```typescript
// Rate ID structure:
// rate_{carrier}_{service}_{hash}
// where hash = HMAC-SHA256(rateDetails, SHIPPING_RATE_SECRET)

// This prevents:
// - Modifying the rate amount between getRates() and purchaseLabel()
// - Replaying rates from a different venture
// - Forging rate IDs to get discounted labels
```

### tRPC Authorization

All tRPC procedures enforce role-based access:

| Procedure | Required Role |
|-----------|---------------|
| `getRates` | `customer`, `staff`, `admin` |
| `purchaseLabel` | `staff`, `admin` |
| `purchaseLabelBatch` | `staff`, `admin` |
| `voidShipment` | `staff`, `admin` |
| `getTracking` | `customer`, `staff`, `admin` |
| `configureCarrier` | `admin` |
| `testCarrierConnection` | `admin` |
| `createRule` | `admin` |
| `updateRule` | `admin` |
| `deleteRule` | `admin` |
| `createReturnLabel` | `staff`, `admin` |
| `scheduleReturnPickup` | `staff`, `admin` |
| `planFulfillment` | `staff`, `admin` |
| `executeFulfillmentPlan` | `staff`, `admin` |
| `estimateDutiesTax` | `customer`, `staff`, `admin` |
| `validateAddress` | `customer`, `staff`, `admin` |
| `manageFulfillmentLocations` | `admin` |
| `manageShippingZones` | `admin` |
| `viewAnalytics` | `staff`, `admin` |

### Audit Logging

All shipping operations that involve carrier API calls, label purchases, or void operations are recorded in the platform audit log:

```typescript
// Audit events emitted by this module:
'shipping.rate.queried'           // Rates fetched from carriers
'shipping.label.purchased'        // Label purchased (includes cost)
'shipping.label.voided'           // Label voided
'shipping.shipment.created'       // Shipment created
'shipping.shipment.cancelled'     // Shipment cancelled
'shipping.tracking.updated'       // Tracking status changed
'shipping.return.created'         // Return label generated
'shipping.pickup.scheduled'       // Carrier pickup scheduled
'shipping.carrier.configured'     // Carrier credentials updated (no secret logged)
'shipping.rule.created'           // Shipping rule created
'shipping.rule.updated'           // Shipping rule modified
'shipping.rule.deleted'           // Shipping rule deleted
'shipping.webhook.received'       // Tracking webhook received
'shipping.webhook.rejected'       // Webhook failed signature verification
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SHIPPING_RATE_SECRET` | **Yes** | — | HMAC secret for signing rate IDs. Must be at least 32 bytes. |
| `SHIPPING_RATE_CACHE_TTL_SECONDS` | No | `900` | How long quoted rates are valid (seconds). |
| `SHIPPING_TRACKING_POLL_INTERVAL_MINUTES` | No | `30` | Interval between tracking poll cycles. |
| `SHIPPING_TRACKING_STALE_THRESHOLD_DAYS` | No | `7` | Days without update before a shipment is flagged stale. |
| `SHIPPING_CARRIER_TIMEOUT_MS` | No | `10000` | Timeout for carrier API calls (milliseconds). |
| `SHIPPING_MAX_BATCH_SIZE` | No | `50` | Maximum labels in a single batch operation. |
| `SHIPPING_LABEL_STORAGE_BUCKET` | No | `shipping-labels` | Supabase Storage bucket for label files. |
| `SHIPPING_LABEL_URL_EXPIRY_SECONDS` | No | `3600` | Signed URL expiration for label downloads. |
| `SHIPPING_WEBHOOK_BASE_URL` | **Yes** | — | Public base URL for receiving carrier webhooks (e.g., `https://api.mcv.one`). |
| `SHIPPING_WEBHOOK_PATH_PREFIX` | No | `/webhooks/shipping` | URL path prefix for webhook endpoints. |
| `EASYPOST_API_KEY` | Conditional | — | EasyPost API key (required if any venture uses EasyPost). |
| `EASYPOST_WEBHOOK_SECRET` | Conditional | — | EasyPost webhook signing secret. |
| `SHIPPO_API_KEY` | Conditional | — | Shippo API key (required if any venture uses Shippo). |
| `SHIPPO_WEBHOOK_SECRET` | Conditional | — | Shippo webhook signing secret. |
| `SHIPPING_DUTIES_API_KEY` | No | — | API key for duties/tax estimation service (e.g., Zonos, Avalara). |
| `SHIPPING_DUTIES_API_URL` | No | — | Duties/tax estimation API endpoint. |
| `SHIPPING_HS_CODE_DATABASE_URL` | No | — | URL to HS code classification database/API. |
| `SHIPPING_PACKING_ALGORITHM` | No | `best_fit_decreasing` | Default bin-packing algorithm: `best_fit_decreasing`, `first_fit_decreasing`, `guillotine`. |
| `SHIPPING_DIM_WEIGHT_DIVISOR_IMPERIAL` | No | `139` | Default DIM weight divisor for imperial units. |
| `SHIPPING_DIM_WEIGHT_DIVISOR_METRIC` | No | `5000` | Default DIM weight divisor for metric units. |
| `SHIPPING_NOTIFICATION_ENABLED` | No | `true` | Enable delivery notification emails/SMS. |
| `SHIPPING_TRACKING_PAGE_DOMAIN` | No | — | Custom domain for public tracking pages (e.g., `track.myventure.com`). |
| `SHIPPING_ANALYTICS_RETENTION_DAYS` | No | `365` | Days to retain shipping analytics data. |

### Per-Venture Overrides

Many of these settings can be overridden at the venture level via the `carrier_configs.settings` JSONB column or dedicated venture-level shipping settings. Environment variables serve as system-wide defaults.

---

## Dependencies

### Internal Dependencies

| Package | Purpose |
|---------|---------|
| `@mcv/core/db` | Drizzle ORM client, Supabase connection, transaction support |
| `@mcv/core/auth` | Venture context, user roles, RLS session management |
| `@mcv/core/events` | Event bus for publishing shipping events (label purchased, delivered, etc.) |
| `@mcv/core/storage` | Supabase Storage client for label file upload/download |
| `@mcv/core/vault` | Supabase Vault integration for encrypted credential storage |
| `@mcv/core/jobs` | Background job scheduling for tracking poller |
| `@mcv/core/cache` | Rate caching (Redis-backed) |
| `@mcv/core/logging` | Structured logging with PII redaction |
| `@mcv/core/errors` | Base error classes and error handling patterns |
| `@mcv/commerce/orders` | Order data for shipment creation and fulfillment routing |
| `@mcv/commerce/inventory` | Inventory availability for multi-warehouse routing |
| `@mcv/notifications/email` | Delivery notification emails, return label emails |
| `@mcv/notifications/sms` | Delivery notification SMS messages |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@easypost/api` | `^7.x` | EasyPost SDK for multi-carrier shipping API |
| `shippo` | `^3.x` | Shippo SDK for multi-carrier shipping API |
| `drizzle-orm` | `^0.30.x` | ORM for database operations |
| `zod` | `^3.22.x` | Input validation for tRPC procedures and carrier requests |
| `@trpc/server` | `^10.x` | tRPC router definitions |
| `bp3d` | `^0.2.x` | 3D bin-packing algorithm for package optimization |
| `geolib` | `^3.3.x` | Geographic distance calculations for warehouse routing |
| `luxon` | `^3.x` | Timezone-aware date/time handling for cutoff times |
| `node-fetch` | `^3.x` | HTTP client for direct carrier API integrations |
| `pdfkit` | `^0.14.x` | PDF generation for customs forms and return labels |
| `jsbarcode` | `^3.11.x` | Barcode generation for shipping labels |
| `crypto` | (built-in) | HMAC-SHA256 for rate signing and webhook verification |

### Carrier API Dependencies (Direct Integrations)

These are external REST APIs accessed at runtime. No npm packages are required for direct integrations — they use `node-fetch` with custom clients:

| Carrier | API Version | Auth Method |
|---------|------------|-------------|
| UPS | REST v1 (OAuth2) | Client ID + Secret → Bearer token |
| FedEx | REST v1 (OAuth2) | Client ID + Secret → Bearer token |
| USPS | Web Tools v3 | User ID in URL params |
| DHL | Express API v2 | API Key header |
| Canada Post | REST v2 | Basic Auth (username:password) |
| Royal Mail | Shipping API v4 | OAuth2 Bearer token |

---

## Testing

### Test Strategy

The shipping module uses a layered testing strategy that isolates carrier API dependencies and ensures reliable CI runs without live API calls.

### Unit Tests

Unit tests cover pure business logic: rules engine evaluation, dimensional weight calculation, packing algorithms, address validation, and tracking event normalization.

```typescript
// tests/unit/dimensional-weight.test.ts
import { describe, it, expect } from 'vitest';
import { DimensionalWeightCalculator } from '@mcv/commerce/shipping';

describe('DimensionalWeightCalculator', () => {
  const calc = new DimensionalWeightCalculator();

  it('calculates DIM weight with UPS imperial divisor', () => {
    const result = calc.calculate({
      length: 24,
      width: 18,
      height: 12,
      dimensionUnit: 'in',
      actualWeight: 5,
      weightUnit: 'lb',
      carrier: 'ups',
    });

    // DIM = (24 × 18 × 12) / 139 = 37.3 lb
    expect(result.dimWeight).toBeCloseTo(37.3, 1);
    expect(result.billableWeight).toBeCloseTo(37.3, 1); // DIM > actual
    expect(result.isDimensional).toBe(true);
  });

  it('uses actual weight when heavier than DIM', () => {
    const result = calc.calculate({
      length: 6,
      width: 4,
      height: 3,
      dimensionUnit: 'in',
      actualWeight: 10,
      weightUnit: 'lb',
      carrier: 'ups',
    });

    // DIM = (6 × 4 × 3) / 139 = 0.52 lb
    expect(result.dimWeight).toBeCloseTo(0.52, 1);
    expect(result.billableWeight).toBe(10);
    expect(result.isDimensional).toBe(false);
  });

  it('handles metric units with DHL divisor', () => {
    const result = calc.calculate({
      length: 60,
      width: 40,
      height: 30,
      dimensionUnit: 'cm',
      actualWeight: 5,
      weightUnit: 'kg',
      carrier: 'dhl',
    });

    // DIM = (60 × 40 × 30) / 5000 = 14.4 kg
    expect(result.dimWeight).toBeCloseTo(14.4, 1);
    expect(result.billableWeight).toBeCloseTo(14.4, 1);
  });
});
```

```typescript
// tests/unit/rules-engine.test.ts
import { describe, it, expect } from 'vitest';
import { ShippingRulesEngine } from '@mcv/commerce/shipping';

describe('ShippingRulesEngine', () => {
  it('applies free shipping when cart exceeds threshold', async () => {
    const engine = new ShippingRulesEngine({
      rules: [
        {
          id: 'rule_1',
          type: 'free_shipping',
          name: 'Free over $50',
          priority: 10,
          enabled: true,
          conditions: [
            { field: 'cart_subtotal', operator: 'gte', value: 50 },
          ],
          action: {
            type: 'free_shipping',
            value: null,
            unit: null,
            customerMessage: 'Free shipping!',
          },
          validFrom: null,
          validUntil: null,
        },
      ],
    });

    const result = await engine.evaluate({
      cartSubtotal: 75.00,
      cartWeight: 2.0,
      destination: { country: 'US', state: 'CA' },
      rates: [
        { rateId: 'r1', price: { amount: 9.99 }, carrierCode: 'usps' },
      ],
    });

    expect(result.freeShipping).toBe(true);
    expect(result.appliedRules).toHaveLength(1);
    expect(result.customerMessages).toContain('Free shipping!');
  });

  it('blocks geo-restricted destinations', async () => {
    const engine = new ShippingRulesEngine({
      rules: [
        {
          id: 'rule_geo',
          type: 'geo_restriction',
          name: 'No sanctioned countries',
          priority: 0,
          enabled: true,
          conditions: [
            { field: 'destination_country', operator: 'in', value: ['KP', 'IR'] },
          ],
          action: {
            type: 'block_destination',
            value: null,
            unit: null,
            customerMessage: 'Cannot ship to this country.',
          },
          validFrom: null,
          validUntil: null,
        },
      ],
    });

    const result = await engine.evaluate({
      cartSubtotal: 100,
      destination: { country: 'IR' },
      rates: [],
    });

    expect(result.blocked).toBe(true);
    expect(result.blockReason).toBe('Cannot ship to this country.');
  });

  it('respects rule priority ordering', async () => {
    const engine = new ShippingRulesEngine({
      rules: [
        {
          id: 'rule_low',
          type: 'flat_rate',
          priority: 100,
          enabled: true,
          conditions: [],
          action: { type: 'set_price', value: 9.99, unit: 'fixed' },
        },
        {
          id: 'rule_high',
          type: 'free_shipping',
          priority: 10,
          enabled: true,
          conditions: [
            { field: 'cart_subtotal', operator: 'gte', value: 50 },
          ],
          action: { type: 'free_shipping', value: null, unit: null },
        },
      ],
    });

    const result = await engine.evaluate({
      cartSubtotal: 75,
      destination: { country: 'US' },
      rates: [{ rateId: 'r1', price: { amount: 15 } }],
    });

    // Free shipping rule (priority 10) applies before flat rate (priority 100)
    expect(result.freeShipping).toBe(true);
  });
});
```

### Integration Tests

Integration tests use **carrier sandbox/test modes** to validate end-to-end flows with real carrier APIs. These run in CI with test credentials.

```typescript
// tests/integration/carrier-rates.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { createShippingService } from '@mcv/commerce/shipping';
import { createTestVenture } from '@mcv/testing';

describe('Carrier Rate Integration', () => {
  let shipping: ShippingService;

  beforeAll(async () => {
    const venture = await createTestVenture({
      carriers: [
        { code: 'ups', testMode: true },
        { code: 'usps', testMode: true },
      ],
    });
    shipping = createShippingService({
      ventureId: venture.id,
      db: venture.db,
    });
  });

  it('fetches rates from multiple carriers in parallel', async () => {
    const rates = await shipping.getRates({
      origin: {
        street1: '123 Test St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
      },
      destination: {
        street1: '456 Test Ave',
        city: 'Los Angeles',
        state: 'CA',
        postalCode: '90001',
        country: 'US',
      },
      packages: [
        {
          length: 10, width: 8, height: 6,
          dimensionUnit: 'in',
          weight: 2.5, weightUnit: 'lb',
          items: [],
        },
      ],
    });

    expect(rates.length).toBeGreaterThan(0);
    expect(rates.every(r => r.price.amount > 0)).toBe(true);
    expect(rates.every(r => r.estimatedTransitDays > 0)).toBe(true);

    // Should have rates from both carriers
    const carriers = new Set(rates.map(r => r.carrierCode));
    expect(carriers.has('ups')).toBe(true);
    expect(carriers.has('usps')).toBe(true);
  });

  it('handles carrier timeout gracefully', async () => {
    // Even if one carrier times out, other rates should still return
    const rates = await shipping.getRates({
      origin: { street1: '123 Test St', city: 'NY', state: 'NY', postalCode: '10001', country: 'US' },
      destination: { street1: '456 Test Ave', city: 'LA', state: 'CA', postalCode: '90001', country: 'US' },
      packages: [{ length: 10, width: 8, height: 6, dimensionUnit: 'in', weight: 2, weightUnit: 'lb', items: [] }],
    });

    // Should still have rates even if one carrier failed
    expect(rates.length).toBeGreaterThan(0);
  });
});
```

### Mock Carriers

For fast CI runs and local development, mock carrier adapters are provided that return deterministic, configurable responses:

```typescript
// tests/mocks/mock-carrier.ts
import { CarrierAdapter } from '@mcv/commerce/shipping';

export class MockCarrier implements CarrierAdapter {
  readonly code = 'mock' as CarrierCode;
  readonly displayName = 'Mock Carrier';
  readonly serviceLevels = [
    { code: 'mock_ground', name: 'Mock Ground', estimatedTransitDays: { min: 3, max: 5 } },
    { code: 'mock_express', name: 'Mock Express', estimatedTransitDays: { min: 1, max: 2 } },
  ];

  private config: { failOnPurchase?: boolean; rateMultiplier?: number } = {};

  configure(opts: typeof this.config) {
    this.config = opts;
  }

  async getRates(request: RateRequest): Promise<ShipmentRate[]> {
    return this.serviceLevels.map((sl, i) => ({
      rateId: `mock_rate_${i}`,
      carrierCode: this.code,
      carrierName: this.displayName,
      serviceLevel: sl.code,
      serviceLevelName: sl.name,
      price: {
        amount: (5 + i * 10) * (this.config.rateMultiplier ?? 1),
        currency: 'USD',
      },
      estimatedTransitDays: sl.estimatedTransitDays.max,
      expiresAt: new Date(Date.now() + 900_000),
      // ... other fields with sensible defaults
    }));
  }

  async purchaseLabel(rate: ShipmentRate): Promise<ShippingLabel> {
    if (this.config.failOnPurchase) {
      throw new ShippingError('LABEL_PURCHASE_FAILED', {
        message: 'Mock carrier configured to fail',
      });
    }
    return {
      id: `mock_label_${Date.now()}`,
      trackingNumber: `MOCK${Date.now()}`,
      format: 'pdf',
      labelData: 'base64mockdata',
      // ... other fields
    };
  }

  async getTracking(trackingNumber: string): Promise<TrackingEvent[]> {
    return [
      {
        type: 'label_created',
        description: 'Mock label created',
        occurredAt: new Date(),
        source: 'poll',
      },
    ];
  }
}
```

### Test Utilities

```typescript
// tests/utils/shipping-test-helpers.ts
import { createTestVenture, createTestOrder } from '@mcv/testing';

/**
 * Create a fully configured test venture with shipping carriers.
 */
export async function createShippingTestVenture(opts?: {
  carriers?: CarrierCode[];
  rules?: Partial<ShippingRule>[];
  locations?: Partial<FulfillmentLocation>[];
}) {
  const venture = await createTestVenture();

  // Configure carriers (mock by default)
  for (const carrier of opts?.carriers ?? ['mock']) {
    await venture.db.insert(carrierConfigs).values({
      ventureId: venture.id,
      carrierCode: carrier,
      enabled: true,
      credentialsVaultId: 'test_vault_id',
      testMode: true,
    });
  }

  // Create shipping rules
  for (const rule of opts?.rules ?? []) {
    await venture.db.insert(shippingRules).values({
      ventureId: venture.id,
      type: rule.type ?? 'flat_rate',
      name: rule.name ?? 'Test Rule',
      priority: rule.priority ?? 100,
      enabled: rule.enabled ?? true,
      conditions: rule.conditions ?? [],
      action: rule.action ?? { type: 'set_price', value: 9.99, unit: 'fixed' },
    });
  }

  // Create fulfillment locations
  for (const loc of opts?.locations ?? []) {
    await venture.db.insert(fulfillmentLocations).values({
      ventureId: venture.id,
      name: loc.name ?? 'Test Warehouse',
      type: loc.type ?? 'warehouse',
      active: true,
      address: loc.address ?? {
        street1: '123 Test St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
      },
      latitude: loc.coordinates?.latitude ?? 40.7128,
      longitude: loc.coordinates?.longitude ?? -74.0060,
      enabledCarriers: loc.enabledCarriers ?? ['mock'],
    });
  }

  return venture;
}

/**
 * Create a test shipment with all associated records.
 */
export async function createTestShipment(
  ventureId: string,
  db: DrizzleClient,
  overrides?: Partial<typeof shipments.$inferInsert>
) {
  const order = await createTestOrder(ventureId, db);

  const [shipment] = await db.insert(shipments).values({
    ventureId,
    orderId: order.id,
    status: 'label_created',
    carrierCode: 'mock',
    serviceLevel: 'mock_ground',
    trackingNumber: `TEST${Date.now()}`,
    origin: {
      street1: '123 Warehouse St',
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'US',
    },
    destination: {
      street1: '456 Customer Ave',
      city: 'Los Angeles',
      state: 'CA',
      postalCode: '90001',
      country: 'US',
    },
    shippingCostAmount: '11.23',
    shippingCostCurrency: 'USD',
    ...overrides,
  }).returning();

  return shipment;
}
```

### Running Tests

```bash
# Run all shipping module tests
pnpm test --filter @mcv/commerce/shipping

# Run unit tests only (fast, no external deps)
pnpm test --filter @mcv/commerce/shipping -- --run tests/unit

# Run integration tests (requires carrier test credentials)
pnpm test --filter @mcv/commerce/shipping -- --run tests/integration

# Run with coverage
pnpm test --filter @mcv/commerce/shipping -- --coverage

# Run specific test file
pnpm test --filter @mcv/commerce/shipping -- tests/unit/rules-engine.test.ts
```

### Coverage Targets

| Category | Target | Notes |
|----------|--------|-------|
| Statements | ≥ 90% | Core business logic must be fully covered |
| Branches | ≥ 85% | All rule condition operators, carrier error paths |
| Functions | ≥ 90% | Every exported function must have tests |
| Lines | ≥ 90% | — |

### CI Pipeline

```yaml
# .github/workflows/shipping-tests.yml
shipping-tests:
  runs-on: ubuntu-latest
  services:
    postgres:
      image: supabase/postgres:15
      env:
        POSTGRES_PASSWORD: test
  env:
    SHIPPING_RATE_SECRET: test-secret-minimum-32-bytes-long
    SHIPPING_WEBHOOK_BASE_URL: https://test.mcv.one
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v2
    - run: pnpm install --frozen-lockfile
    - run: pnpm db:migrate --filter @mcv/commerce/shipping
    - run: pnpm test --filter @mcv/commerce/shipping -- --coverage
    - uses: codecov/codecov-action@v3
```

---

*Last updated: 2026-02-08*
*Module maintainer: Commerce Platform Team*