# @mcv/shared — Technical Architecture
## Tier 2.5: Shared Business Utilities

**Package:** `@mcv/shared`  
**Classification:** INTERNAL  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                   @mcv/shared                                            │
│                                                                                          │
│  ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                           Business Logic Layer                                      │ │
│  │                                                                                     │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │ │
│  │  │  templates  │ │  workflows  │ │ validation  │ │calculations │ │ scheduling  │  │ │
│  │  │             │ │             │ │             │ │             │ │             │  │ │
│  │  │ • Rendering │ │ • States    │ │ • Rules     │ │ • Pricing   │ │ • Cron      │  │ │
│  │  │ • Helpers   │ │ • Guards    │ │ • Async     │ │ • Tax       │ │ • Calendar  │  │ │
│  │  │ • Layouts   │ │ • Actions   │ │ • Custom    │ │ • Currency  │ │ • Booking   │  │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘  │ │
│  │                                                                                     │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │ │
│  │  │localization │ │   theming   │ │    media    │ │   export    │ │   import    │  │ │
│  │  │             │ │             │ │             │ │             │ │             │  │ │
│  │  │ • i18n      │ │ • Tokens    │ │ • Images    │ │ • PDF       │ │ • CSV       │  │ │
│  │  │ • Formats   │ │ • Themes    │ │ • Video     │ │ • Excel     │ │ • Mapping   │  │ │
│  │  │ • Plurals   │ │ • Chameleon │ │ • Transcode │ │ • CSV       │ │ • Transform │  │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘  │ │
│  │                                                                                     │ │
│  │                              ┌─────────────┐                                        │ │
│  │                              │ versioning  │                                        │ │
│  │                              │             │                                        │ │
│  │                              │ • Migrations│                                        │ │
│  │                              │ • History   │                                        │ │
│  │                              │ • Rollback  │                                        │ │
│  │                              └─────────────┘                                        │ │
│  │                                                                                     │ │
│  └────────────────────────────────────────────────────────────────────────────────────┘ │
│                                           │                                              │
│  ┌────────────────────────────────────────┴───────────────────────────────────────────┐ │
│  │                              Shared Services Layer                                  │ │
│  │                                                                                     │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐              │ │
│  │  │ Cache Layer  │ │  Job Queue   │ │ Event Bus    │ │ Storage      │              │ │
│  │  │ (Redis)      │ │ (BullMQ)     │ │ (Internal)   │ │ (S3/R2)      │              │ │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘              │ │
│  │                                                                                     │ │
│  └────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                           │
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                               Infrastructure Layer                                       │
│                                                                                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                   │
│  │  @mcv/fabric │ │   @mcv/api   │ │@mcv/connectors│ │ @mcv/kernel  │                   │
│  │              │ │              │ │              │ │              │                   │
│  │ • Storage    │ │ • tRPC       │ │ • Email      │ │ • DB         │                   │
│  │ • Jobs       │ │ • Routes     │ │ • Payment    │ │ • Config     │                   │
│  │ • Events     │ │ • Middleware │ │ • OAuth      │ │ • Logger     │                   │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘                   │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Module Architecture Details

### Templates Module Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            templates                                         │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         Template Engine                                 │ │
│  │                                                                         │ │
│  │  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐             │ │
│  │  │   Parser     │───▶│   Compiler   │───▶│   Renderer   │             │ │
│  │  │              │    │              │    │              │             │ │
│  │  │ • Tokenize   │    │ • AST Build  │    │ • Execute    │             │ │
│  │  │ • Validate   │    │ • Optimize   │    │ • Escape     │             │ │
│  │  └──────────────┘    └──────────────┘    └──────────────┘             │ │
│  │         │                   │                   │                      │ │
│  │         ▼                   ▼                   ▼                      │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐ │ │
│  │  │                       Helper Registry                             │ │ │
│  │  │                                                                    │ │ │
│  │  │  formatDate | formatCurrency | pluralize | truncate | ...        │ │ │
│  │  │                                                                    │ │ │
│  │  └──────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         Template Types                                  │ │
│  │                                                                         │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │ │
│  │  │  Email   │ │   SMS    │ │ Document │ │  Push    │ │  Slack   │    │ │
│  │  │          │ │          │ │          │ │          │ │          │    │ │
│  │  │ MJML     │ │ Plain    │ │ HTML/PDF │ │ Title+   │ │ Blocks   │    │ │
│  │  │ + HTML   │ │ Text     │ │          │ │ Body     │ │          │    │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘    │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Template Processing Flow

```
Template Definition          Context Data              Output
       │                          │                       │
       ▼                          ▼                       │
┌──────────────┐          ┌──────────────┐               │
│ Load Template│          │ Prepare      │               │
│ from DB/Cache│          │ Variables    │               │
└──────────────┘          └──────────────┘               │
       │                          │                       │
       ▼                          ▼                       │
┌─────────────────────────────────────────┐              │
│           Template Compiler              │              │
│                                          │              │
│  1. Parse Handlebars syntax             │              │
│  2. Build AST (Abstract Syntax Tree)    │              │
│  3. Register helpers and partials       │              │
│  4. Compile to executable function      │              │
│                                          │              │
└─────────────────────────────────────────┘              │
                    │                                     │
                    ▼                                     │
┌─────────────────────────────────────────┐              │
│           Template Renderer              │              │
│                                          │              │
│  1. Execute compiled template           │              │
│  2. Apply context variables             │              │
│  3. Run helper functions                │              │
│  4. Escape output (XSS prevention)      │              │
│  5. Post-process (MJML → HTML)          │              │
│                                          │              │
└─────────────────────────────────────────┘              │
                    │                                     │
                    ▼                                     ▼
            ┌──────────────┐                    ┌──────────────┐
            │  Email HTML  │                    │  Rendered    │
            │  Plain Text  │                    │  Content     │
            │  PDF Ready   │                    │              │
            └──────────────┘                    └──────────────┘
```

#### Template Caching Strategy

```typescript
interface TemplateCache {
  // L1: In-memory compiled template cache
  compiledTemplates: Map<string, CompiledTemplate>;
  
  // L2: Redis template content cache
  templateContent: RedisCache<Template>;
  
  // Cache key format: {ventureId}:{templateSlug}:{version}:{locale}
  // TTL: 1 hour for content, indefinite for compiled (until eviction)
}

// Cache invalidation events
type TemplateCacheEvent = 
  | { type: 'template:updated'; templateId: UUID }
  | { type: 'template:deleted'; templateId: UUID }
  | { type: 'venture:theme:updated'; ventureId: VentureID };
```

---

### Workflows Module Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             workflows                                        │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                       Workflow Engine (XState)                          │ │
│  │                                                                         │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │ │
│  │  │                    State Machine Core                             │  │ │
│  │  │                                                                    │  │ │
│  │  │  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐      │  │ │
│  │  │  │ States   │──▶│Transitions│──▶│ Guards   │──▶│ Actions  │      │  │ │
│  │  │  │          │   │          │   │          │   │          │      │  │ │
│  │  │  │ • Initial│   │ • Events │   │ • Checks │   │ • Effects│      │  │ │
│  │  │  │ • Final  │   │ • Targets│   │ • Async  │   │ • Notify │      │  │ │
│  │  │  │ • Parallel│  │ • Self   │   │          │   │          │      │  │ │
│  │  │  └──────────┘   └──────────┘   └──────────┘   └──────────┘      │  │ │
│  │  │                                                                    │  │ │
│  │  └──────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                         │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │ │
│  │  │                    Persistence Layer                              │  │ │
│  │  │                                                                    │  │ │
│  │  │  ┌──────────┐   ┌──────────┐   ┌──────────┐                      │  │ │
│  │  │  │ Instance │   │ History  │   │ Snapshot │                      │  │ │
│  │  │  │ Store    │   │ Store    │   │ Store    │                      │  │ │
│  │  │  └──────────┘   └──────────┘   └──────────┘                      │  │ │
│  │  │                                                                    │  │ │
│  │  └──────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                        Workflow Patterns                                │ │
│  │                                                                         │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │ │
│  │  │   Linear    │  │  Approval   │  │  Parallel   │  │   Branch    │   │ │
│  │  │             │  │             │  │             │  │             │   │ │
│  │  │ A → B → C   │  │ Req→Rev→App│  │   ┌─B─┐     │  │    ┌─B      │   │ │
│  │  │             │  │      ↓      │  │ A─┤   ├─D   │  │ A──┤        │   │ │
│  │  │             │  │    Reject   │  │   └─C─┘     │  │    └─C      │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Workflow State Diagram (Approval Pattern)

```
                            ┌─────────────────┐
                            │                 │
                            │    INITIAL      │
                            │    (draft)      │
                            │                 │
                            └────────┬────────┘
                                     │
                               submit│
                                     ▼
                            ┌─────────────────┐
                            │                 │
                            │   PENDING       │
                     ┌──────│   REVIEW        │──────┐
                     │      │                 │      │
                     │      └─────────────────┘      │
                     │                               │
              approve│                               │reject
                     ▼                               ▼
            ┌─────────────────┐             ┌─────────────────┐
            │                 │             │                 │
            │    APPROVED     │             │    REJECTED     │
            │                 │             │                 │
            └────────┬────────┘             └────────┬────────┘
                     │                               │
              execute│                          revise│
                     ▼                               │
            ┌─────────────────┐                      │
            │                 │                      │
            │   COMPLETED     │◀─────────────────────┘
            │    (final)      │      (resubmit)
            │                 │
            └─────────────────┘
```

#### Workflow Event Sourcing

```typescript
interface WorkflowEvent {
  id: UUID;
  instanceId: UUID;
  type: string;                    // 'submit', 'approve', 'reject'
  payload: Record<string, unknown>;
  metadata: {
    userId: UserID;
    timestamp: ISOTimestamp;
    correlationId: string;
  };
  stateBeforeversion: number;
  stateAfter: string;
}

// Events are immutable - complete history preserved
// Current state = replay all events from genesis
// Enables: time-travel debugging, audit trails, undo
```

---

### Calculations Module Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           calculations                                       │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         Pricing Engine                                  │ │
│  │                                                                         │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │ │
│  │  │                    Calculation Pipeline                           │  │ │
│  │  │                                                                    │  │ │
│  │  │   Input      Discounts     Tax          Rounding     Output       │  │ │
│  │  │    │            │           │              │           │          │  │ │
│  │  │    ▼            ▼           ▼              ▼           ▼          │  │ │
│  │  │  ┌───┐       ┌───┐       ┌───┐         ┌───┐       ┌───┐        │  │ │
│  │  │  │ $ │──────▶│ % │──────▶│ + │────────▶│ ≈ │──────▶│ = │        │  │ │
│  │  │  └───┘       └───┘       └───┘         └───┘       └───┘        │  │ │
│  │  │  Items       Apply       Calculate     Round to    Final        │  │ │
│  │  │  + Qty       discounts   tax           currency    amount       │  │ │
│  │  │                                                                    │  │ │
│  │  └──────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                        Tax Calculator                                   │ │
│  │                                                                         │ │
│  │  ┌────────────┐   ┌────────────┐   ┌────────────┐   ┌────────────┐    │ │
│  │  │ Jurisdiction│   │ Product    │   │ Customer   │   │ Exemptions │    │ │
│  │  │ Resolver   │──▶│ Classifier │──▶│ Classifier │──▶│ Checker    │    │ │
│  │  │            │   │            │   │            │   │            │    │ │
│  │  │ State/Prov │   │ Category   │   │ B2B/B2C    │   │ Tax IDs    │    │ │
│  │  │ Country    │   │ Exceptions │   │ Reseller   │   │ Nexus      │    │ │
│  │  └────────────┘   └────────────┘   └────────────┘   └────────────┘    │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                      Currency Converter                                 │ │
│  │                                                                         │ │
│  │  ┌────────────┐   ┌────────────┐   ┌────────────┐                     │ │
│  │  │ Rate       │   │ Conversion │   │ Formatting │                     │ │
│  │  │ Provider   │──▶│ Engine     │──▶│ Engine     │                     │ │
│  │  │            │   │            │   │            │                     │ │
│  │  │ Live/Cached│   │ Decimal.js │   │ Per-locale │                     │ │
│  │  │ Historical │   │ Precision  │   │ Symbols    │                     │ │
│  │  └────────────┘   └────────────┘   └────────────┘                     │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Pricing Calculation Flow

```typescript
interface PricingPipeline {
  stages: [
    'loadItems',           // Load product prices
    'applyQuantityPricing',// Volume discounts
    'applyMemberPricing',  // Membership discounts
    'applyCoupons',        // Coupon codes
    'calculateSubtotal',   // Sum before tax
    'determineJurisdiction',// Tax jurisdiction
    'calculateTax',        // Apply tax rates
    'applyTaxExemptions',  // Handle exemptions
    'roundAmounts',        // Currency rounding
    'generateBreakdown'    // Audit trail
  ];
}

// All arithmetic uses Decimal.js - NEVER floating point
// Example: 0.1 + 0.2 === 0.3 ✓ (not 0.30000000000000004)
```

#### Tax Jurisdiction Resolution

```
Customer Address
      │
      ▼
┌─────────────────┐
│ Parse Address   │
│                 │
│ • Country       │
│ • State/Prov    │
│ • Postal Code   │
│ • City          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ Nexus Check     │────▶│ No Tax Required │
│                 │ No  │                 │
│ Seller has      │     │ (No nexus)      │
│ presence?       │     └─────────────────┘
└────────┬────────┘
         │ Yes
         ▼
┌─────────────────┐     ┌─────────────────┐
│ Exemption Check │────▶│ Exempt          │
│                 │ Yes │                 │
│ • Reseller cert │     │ (Tax = 0)       │
│ • Non-profit    │     └─────────────────┘
│ • Tax holiday   │
└────────┬────────┘
         │ No
         ▼
┌─────────────────┐
│ Rate Lookup     │
│                 │
│ • State rate    │
│ • County rate   │
│ • City rate     │
│ • Special dist  │
│                 │
│ = Combined rate │
└─────────────────┘
```

---

### Scheduling Module Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           scheduling                                         │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         Scheduler Core                                  │ │
│  │                                                                         │ │
│  │  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐             │ │
│  │  │ Cron Parser  │    │ RRule Engine │    │ Time Window  │             │ │
│  │  │              │    │              │    │ Calculator   │             │ │
│  │  │ "0 9 * * 1-5"│    │ FREQ=WEEKLY; │    │              │             │ │
│  │  │     ↓        │    │ BYDAY=MO,WE  │    │ Business hrs │             │ │
│  │  │ Next runs    │    │     ↓        │    │ Holidays     │             │ │
│  │  │              │    │ Occurrences  │    │ Conflicts    │             │ │
│  │  └──────────────┘    └──────────────┘    └──────────────┘             │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                        Booking Engine                                   │ │
│  │                                                                         │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │ │
│  │  │                    Slot Management                                │  │ │
│  │  │                                                                    │  │ │
│  │  │  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐      │  │ │
│  │  │  │Available │──▶│ Reserved │──▶│  Booked  │──▶│Completed │      │  │ │
│  │  │  │          │   │ (5 min)  │   │          │   │          │      │  │ │
│  │  │  │          │   │          │   │          │   │          │      │  │ │
│  │  │  │  ↑       │   │    ↓     │   │    ↓     │   │          │      │  │ │
│  │  │  │  └───────┼───┤ Expired  │   │ Cancelled│   │          │      │  │ │
│  │  │  │          │   │          │   │          │   │          │      │  │ │
│  │  │  └──────────┘   └──────────┘   └──────────┘   └──────────┘      │  │ │
│  │  │                                                                    │  │ │
│  │  └──────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                         │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │ │
│  │  │                   Availability Matrix                             │  │ │
│  │  │                                                                    │  │ │
│  │  │      Mon    Tue    Wed    Thu    Fri    Sat    Sun               │  │ │
│  │  │  ┌──────┬──────┬──────┬──────┬──────┬──────┬──────┐             │  │ │
│  │  │  │ 9-17 │ 9-17 │ 9-17 │ 9-17 │ 9-17 │ 10-14│  -   │             │  │ │
│  │  │  └──────┴──────┴──────┴──────┴──────┴──────┴──────┘             │  │ │
│  │  │         │                                                         │  │ │
│  │  │         ▼ Apply overrides (holidays, blocks, extensions)         │  │ │
│  │  │                                                                    │  │ │
│  │  └──────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Booking Slot Calculation

```
Resource Availability + Existing Bookings + Overrides = Available Slots
        │                     │                │
        ▼                     ▼                ▼
┌───────────────┐     ┌───────────────┐  ┌───────────────┐
│ Weekly Pattern│     │ Booked Slots  │  │ Exceptions    │
│               │     │               │  │               │
│ Mon: 9-17     │     │ Mon 10-11 ✓   │  │ Dec 25: OFF   │
│ Tue: 9-17     │     │ Tue 14-15 ✓   │  │ Dec 24: 9-12  │
│ ...           │     │ ...           │  │               │
└───────────────┘     └───────────────┘  └───────────────┘
        │                     │                │
        └─────────────────────┼────────────────┘
                              ▼
                    ┌───────────────────┐
                    │ Slot Calculator   │
                    │                   │
                    │ 1. Generate base  │
                    │    time slots     │
                    │ 2. Apply overrides│
                    │ 3. Remove booked  │
                    │ 4. Apply buffers  │
                    │ 5. Return available│
                    └───────────────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │ Available Slots   │
                    │                   │
                    │ Mon 9-10, 11-12...│
                    │ Tue 9-14, 15-17...│
                    │                   │
                    └───────────────────┘
```

---

### Localization Module Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           localization                                       │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         i18n Core                                       │ │
│  │                                                                         │ │
│  │  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐             │ │
│  │  │ Translation  │    │ ICU Message  │    │ Pluralization│             │ │
│  │  │ Loader       │    │ Parser       │    │ Engine       │             │ │
│  │  │              │    │              │    │              │             │ │
│  │  │ • DB fetch   │    │ • Variables  │    │ • CLDR rules │             │ │
│  │  │ • File load  │    │ • Plurals    │    │ • Ordinals   │             │ │
│  │  │ • Lazy load  │    │ • Select     │    │ • Custom     │             │ │
│  │  └──────────────┘    └──────────────┘    └──────────────┘             │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                      Formatting Engines                                 │ │
│  │                                                                         │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐       │ │
│  │  │  Numbers   │  │   Dates    │  │  Currency  │  │  Relative  │       │ │
│  │  │            │  │            │  │            │  │  Time      │       │ │
│  │  │ 1,234.56   │  │ Feb 9, '26 │  │ $1,234.56  │  │ "5 min ago"│       │ │
│  │  │ 1.234,56   │  │ 9 Fév 26   │  │ 1.234,56 € │  │ "il y a 5m"│       │ │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘       │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                     Locale Resolution                                   │ │
│  │                                                                         │ │
│  │  Request → User Pref → Venture Default → Fallback (en-US)             │ │
│  │     │          │              │               │                        │ │
│  │     ▼          ▼              ▼               ▼                        │ │
│  │  Accept-    Profile        Settings       Hardcoded                    │ │
│  │  Language   locale         locale         default                      │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Translation Lookup Flow

```
t('welcome.message', { name: 'John', count: 5 })
                    │
                    ▼
            ┌───────────────┐
            │ Key Resolver  │
            │               │
            │ namespace:key │
            │ welcome:message│
            └───────┬───────┘
                    │
                    ▼
            ┌───────────────┐
            │ Locale Chain  │
            │               │
            │ fr-CA → fr →  │
            │ en-US → en    │
            └───────┬───────┘
                    │
                    ▼
            ┌───────────────┐     ┌───────────────┐
            │ Cache Lookup  │────▶│ Found         │
            │               │ Yes │               │
            │ In-memory     │     │ ICU template  │
            └───────┬───────┘     └───────────────┘
                    │ No
                    ▼
            ┌───────────────┐
            │ DB Lookup     │
            │               │
            │ translations  │
            │ table         │
            └───────┬───────┘
                    │
                    ▼
            ┌───────────────┐
            │ ICU Parser    │
            │               │
            │ Parse message │
            │ format syntax │
            └───────┬───────┘
                    │
                    ▼
            ┌───────────────┐
            │ Interpolation │
            │               │
            │ • Variables   │
            │ • Plurals     │
            │ • Selects     │
            └───────┬───────┘
                    │
                    ▼
            "Bienvenue John! Vous avez 5 messages."
```

---

### Theming (Chameleon Engine) Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      theming (Chameleon Engine)                              │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         Token System                                    │ │
│  │                                                                         │ │
│  │  ┌────────────────────────────────────────────────────────────────┐   │ │
│  │  │                    Token Layers                                 │   │ │
│  │  │                                                                  │   │ │
│  │  │  Layer 1: Primitives     │  blue-500: #3B82F6                  │   │ │
│  │  │            ↓             │  gray-100: #F3F4F6                  │   │ │
│  │  │  Layer 2: Semantic       │  primary: {blue-500}               │   │ │
│  │  │            ↓             │  background: {gray-100}             │   │ │
│  │  │  Layer 3: Component      │  button-bg: {primary}              │   │ │
│  │  │            ↓             │  card-bg: {background}              │   │ │
│  │  │  Layer 4: State          │  button-bg-hover: {primary-600}    │   │ │
│  │  │                          │  button-bg-disabled: {gray-300}     │   │ │
│  │  │                                                                  │   │ │
│  │  └────────────────────────────────────────────────────────────────┘   │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                       Theme Resolution                                  │ │
│  │                                                                         │ │
│  │  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐             │ │
│  │  │ Base Theme   │───▶│ Venture      │───▶│ Mode         │             │ │
│  │  │ (System)     │    │ Override     │    │ (Light/Dark) │             │ │
│  │  │              │    │              │    │              │             │ │
│  │  │ MCV defaults │    │ Brand colors │    │ Contrast adj │             │ │
│  │  └──────────────┘    └──────────────┘    └──────────────┘             │ │
│  │         │                   │                   │                      │ │
│  │         └───────────────────┼───────────────────┘                      │ │
│  │                             ▼                                          │ │
│  │                    ┌──────────────┐                                    │ │
│  │                    │ Theme Merger │                                    │ │
│  │                    │              │                                    │ │
│  │                    │ Deep merge   │                                    │ │
│  │                    │ with inherit │                                    │ │
│  │                    └──────────────┘                                    │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                        Output Generators                                │ │
│  │                                                                         │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐       │ │
│  │  │ CSS Vars   │  │ Tailwind   │  │ JSON       │  │ TypeScript │       │ │
│  │  │            │  │ Config     │  │ Tokens     │  │ Constants  │       │ │
│  │  │ :root {    │  │ colors: {  │  │ {          │  │ export const│      │ │
│  │  │   --primary│  │   primary: │  │   primary: │  │  PRIMARY = │       │ │
│  │  │ }          │  │ }          │  │ }          │  │             │       │ │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘       │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Theme Token Resolution

```typescript
// Token reference resolution
resolveToken('button-bg')
    │
    ▼
┌───────────────┐
│ Parse Token   │
│ Reference     │
│               │
│ button-bg     │
│ = {primary}   │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ Resolve       │
│ Reference     │
│               │
│ primary       │
│ = {blue-500}  │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ Resolve       │
│ Primitive     │
│               │
│ blue-500      │
│ = #3B82F6     │
└───────┬───────┘
        │
        ▼
   "#3B82F6"
```

---

### Media Module Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              media                                           │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                        Media Pipeline                                   │ │
│  │                                                                         │ │
│  │  Upload → Validate → Analyze → Process → Store → CDN                   │ │
│  │    │         │          │         │        │      │                    │ │
│  │    ▼         ▼          ▼         ▼        ▼      ▼                    │ │
│  │  ┌───┐    ┌───┐      ┌───┐     ┌───┐    ┌───┐  ┌───┐                  │ │
│  │  │ 📤│    │ ✓ │      │ 🔍│     │ ⚙️│    │ 💾│  │ 🌐│                  │ │
│  │  └───┘    └───┘      └───┘     └───┘    └───┘  └───┘                  │ │
│  │  Buffer   Type       Extract   Transform S3/R2  CloudFlare            │ │
│  │  Stream   Size       Metadata  Resize    Bucket CDN                    │ │
│  │           Virus      EXIF      Compress                                │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                     Image Processor (Sharp)                             │ │
│  │                                                                         │ │
│  │  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐            │ │
│  │  │ Resize   │   │ Format   │   │ Optimize │   │ Effects  │            │ │
│  │  │          │   │          │   │          │   │          │            │ │
│  │  │ • Width  │   │ • JPEG   │   │ • Quality│   │ • Blur   │            │ │
│  │  │ • Height │   │ • PNG    │   │ • Strip  │   │ • Sharpen│            │ │
│  │  │ • Fit    │   │ • WebP   │   │ • Mozjpeg│   │ • Grayscale           │ │
│  │  │ • Crop   │   │ • AVIF   │   │ • Oxipng │   │ • Watermark           │ │
│  │  └──────────┘   └──────────┘   └──────────┘   └──────────┘            │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                   Video Transcoder (FFmpeg)                             │ │
│  │                                                                         │ │
│  │  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐            │ │
│  │  │ Transcode│   │ HLS/DASH │   │ Thumbnail│   │ Metadata │            │ │
│  │  │          │   │          │   │          │   │          │            │ │
│  │  │ • H.264  │   │ • Segment│   │ • Poster │   │ • Duration│           │ │
│  │  │ • H.265  │   │ • Playlist│  │ • Sprite │   │ • Bitrate│            │ │
│  │  │ • VP9    │   │ • ABR    │   │ • Preview│   │ • FPS    │            │ │
│  │  │ • AV1    │   │ • DRM    │   │          │   │          │            │ │
│  │  └──────────┘   └──────────┘   └──────────┘   └──────────┘            │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Image Processing Pipeline

```
Original Image (4000x3000 JPEG, 5MB)
              │
              ▼
     ┌────────────────┐
     │ Analyze        │
     │                │
     │ • Dimensions   │
     │ • Format       │
     │ • Color space  │
     │ • Has alpha    │
     └────────┬───────┘
              │
              ▼
     ┌────────────────┐
     │ Generate       │
     │ Variants       │
     └────────┬───────┘
              │
    ┌─────────┼─────────┬─────────────┐
    │         │         │             │
    ▼         ▼         ▼             ▼
┌───────┐ ┌───────┐ ┌───────┐   ┌───────┐
│Thumb  │ │Medium │ │ Large │   │ WebP  │
│       │ │       │ │       │   │       │
│ 200x  │ │ 800x  │ │ 1600x │   │ 1600x │
│ 150   │ │ 600   │ │ 1200  │   │ 1200  │
│       │ │       │ │       │   │       │
│ 15KB  │ │ 80KB  │ │ 250KB │   │ 120KB │
└───────┘ └───────┘ └───────┘   └───────┘
    │         │         │             │
    └─────────┴─────────┴─────────────┘
                      │
                      ▼
             ┌────────────────┐
             │ Store to S3    │
             │                │
             │ /media/{id}/   │
             │  ├─ original   │
             │  ├─ thumb      │
             │  ├─ medium     │
             │  ├─ large      │
             │  └─ large.webp │
             └────────────────┘
```

---

### Export Module Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              export                                          │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                        Export Pipeline                                  │ │
│  │                                                                         │ │
│  │  Request → Queue → Process → Generate → Upload → Notify                │ │
│  │     │        │        │          │         │        │                  │ │
│  │     ▼        ▼        ▼          ▼         ▼        ▼                  │ │
│  │  Validate  BullMQ   Fetch      Render    S3/R2   Email/                │ │
│  │  params    job      data       output    signed   webhook              │ │
│  │                                file      URL                           │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                        PDF Generator                                    │ │
│  │                                                                         │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │ │
│  │  │                    Generation Flow                                │  │ │
│  │  │                                                                    │  │ │
│  │  │  Template    +    Data    →    HTML    →    PDF                   │  │ │
│  │  │     │              │             │            │                    │  │ │
│  │  │     ▼              ▼             ▼            ▼                    │  │ │
│  │  │  Handlebars   JSON/DB      Rendered     Puppeteer/               │  │ │
│  │  │  template     query        HTML         pdfmake                   │  │ │
│  │  │                                                                    │  │ │
│  │  └──────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                         │ │
│  │  Features:                                                              │ │
│  │  • Headers/Footers with page numbers                                   │ │
│  │  • Table of contents generation                                        │ │
│  │  • Watermarks (text/image)                                             │ │
│  │  • Custom fonts                                                         │ │
│  │  • Page breaks                                                          │ │
│  │  • Multi-page tables                                                    │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                       Excel Builder                                     │ │
│  │                                                                         │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐       │ │
│  │  │ Workbook   │  │ Worksheets │  │ Formatting │  │ Features   │       │ │
│  │  │            │  │            │  │            │  │            │       │ │
│  │  │ • Create   │  │ • Add data │  │ • Styles   │  │ • Charts   │       │ │
│  │  │ • Metadata │  │ • Columns  │  │ • Borders  │  │ • Formulas │       │ │
│  │  │ • Props    │  │ • Rows     │  │ • Colors   │  │ • Filters  │       │ │
│  │  │            │  │ • Cells    │  │ • Fonts    │  │ • Freeze   │       │ │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘       │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                        CSV Exporter                                     │ │
│  │                                                                         │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐                        │ │
│  │  │ Streaming  │  │ Formatting │  │ Encoding   │                        │ │
│  │  │            │  │            │  │            │                        │ │
│  │  │ • Chunked  │  │ • Quotes   │  │ • UTF-8    │                        │ │
│  │  │ • Memory   │  │ • Escapes  │  │ • UTF-16   │                        │ │
│  │  │   efficient│  │ • Delimit  │  │ • BOM      │                        │ │
│  │  │            │  │ • Newlines │  │ • Latin1   │                        │ │
│  │  └────────────┘  └────────────┘  └────────────┘                        │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Import Module Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              import                                          │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                       Import Pipeline                                   │ │
│  │                                                                         │ │
│  │  Upload → Parse → Map → Validate → Preview → Import → Report           │ │
│  │    │        │      │       │          │         │        │             │ │
│  │    ▼        ▼      ▼       ▼          ▼         ▼        ▼             │ │
│  │  Store   Detect  Field   Check      Sample   Batch    Generate         │ │
│  │  temp    format  mapping rules      rows     insert   summary          │ │
│  │  file    parse                                                          │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                        Format Parsers                                   │ │
│  │                                                                         │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐       │ │
│  │  │ CSV Parser │  │ Excel      │  │ JSON       │  │ XML        │       │ │
│  │  │            │  │ Parser     │  │ Parser     │  │ Parser     │       │ │
│  │  │ PapaParse  │  │ ExcelJS    │  │ Native     │  │ xml2js     │       │ │
│  │  │            │  │            │  │            │  │            │       │ │
│  │  │ Streaming  │  │ Multi-sheet│  │ JSONPath   │  │ XPath      │       │ │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘       │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                       Field Mapping UI                                  │ │
│  │                                                                         │ │
│  │   Source Column          →          Target Field                       │ │
│  │  ┌─────────────────┐              ┌─────────────────┐                  │ │
│  │  │ "Full Name"     │──────────────│ name            │                  │ │
│  │  │ "Email Address" │──────────────│ email           │                  │ │
│  │  │ "Phone #"       │──────────────│ phone           │                  │ │
│  │  │ "DOB"           │──────Transform──│ birthDate     │                  │ │
│  │  │ "Status"        │──────Enum Map───│ status        │                  │ │
│  │  └─────────────────┘              └─────────────────┘                  │ │
│  │                                                                         │ │
│  │  Auto-mapping suggestions based on column name similarity              │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                      Validation & Transform                             │ │
│  │                                                                         │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐       │ │
│  │  │ Type       │  │ Format     │  │ Transform  │  │ Dedup      │       │ │
│  │  │ Validation │  │ Validation │  │            │  │            │       │ │
│  │  │            │  │            │  │ • Trim     │  │ • By field │       │ │
│  │  │ • String   │  │ • Email    │  │ • Case     │  │ • Strategy │       │ │
│  │  │ • Number   │  │ • Phone    │  │ • Date     │  │   - Skip   │       │ │
│  │  │ • Date     │  │ • URL      │  │ • Split    │  │   - Update │       │ │
│  │  │ • Boolean  │  │ • PostCode │  │ • Lookup   │  │   - Error  │       │ │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘       │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Import Processing Flow

```
File Upload (10,000 rows)
         │
         ▼
┌─────────────────┐
│ Store in temp   │
│ storage (S3)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Parse & Sample  │
│                 │
│ Read first 100  │
│ rows for preview│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Auto-Detect     │
│                 │
│ • Column types  │
│ • Field matches │
│ • Data patterns │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ User Mapping    │
│                 │
│ Confirm/adjust  │
│ field mappings  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Full Validation │
│                 │
│ Validate all    │
│ 10,000 rows     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│ Errors Found?   │─Yes─│ Review Errors   │
│                 │     │                 │
│                 │     │ Fix or skip     │
└────────┬────────┘     └────────┬────────┘
         │ No                    │
         ▼                       │
┌─────────────────┐◀─────────────┘
│ Preview Import  │
│                 │
│ Show first 10   │
│ as they'd appear│
└────────┬────────┘
         │ Confirm
         ▼
┌─────────────────┐
│ Batch Import    │
│                 │
│ Chunks of 100   │
│ with progress   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Generate Report │
│                 │
│ • Imported: 9,850│
│ • Skipped: 100  │
│ • Errors: 50    │
└─────────────────┘
```

---

### Versioning Module Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            versioning                                        │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                      Migration System                                   │ │
│  │                                                                         │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │ │
│  │  │                   Migration Runner                                │  │ │
│  │  │                                                                    │  │ │
│  │  │   Load        Sort         Execute       Record                   │  │ │
│  │  │     │           │             │             │                      │  │ │
│  │  │     ▼           ▼             ▼             ▼                      │  │ │
│  │  │  Discover    Topological   Run up/down  Update                    │  │ │
│  │  │  migrations  sort by       migrations   schema_migrations         │  │ │
│  │  │  in folder   dependencies               table                     │  │ │
│  │  │                                                                    │  │ │
│  │  └──────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                         │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │ │
│  │  │                   Migration DAG                                   │  │ │
│  │  │                                                                    │  │ │
│  │  │          ┌─────────┐                                              │  │ │
│  │  │          │ m_001   │ (create users table)                        │  │ │
│  │  │          └────┬────┘                                              │  │ │
│  │  │               │                                                    │  │ │
│  │  │        ┌──────┴──────┐                                            │  │ │
│  │  │        ▼             ▼                                            │  │ │
│  │  │   ┌─────────┐   ┌─────────┐                                      │  │ │
│  │  │   │ m_002   │   │ m_003   │                                      │  │ │
│  │  │   │(profiles)│  │(settings)│                                      │  │ │
│  │  │   └────┬────┘   └────┬────┘                                      │  │ │
│  │  │        │             │                                            │  │ │
│  │  │        └──────┬──────┘                                            │  │ │
│  │  │               ▼                                                    │  │ │
│  │  │          ┌─────────┐                                              │  │ │
│  │  │          │ m_004   │ (add user preferences)                      │  │ │
│  │  │          └─────────┘                                              │  │ │
│  │  │                                                                    │  │ │
│  │  └──────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                      Change Tracking                                    │ │
│  │                                                                         │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │ │
│  │  │                   Audit Trail                                     │  │ │
│  │  │                                                                    │  │ │
│  │  │  Entity: Product                                                  │  │ │
│  │  │  ┌────────┬──────────┬─────────┬───────────┬───────────┐         │  │ │
│  │  │  │Version │ Operation│ Field   │ Before    │ After     │         │  │ │
│  │  │  ├────────┼──────────┼─────────┼───────────┼───────────┤         │  │ │
│  │  │  │ 1      │ CREATE   │ *       │ null      │ {...}     │         │  │ │
│  │  │  │ 2      │ UPDATE   │ price   │ 99.00     │ 89.00     │         │  │ │
│  │  │  │ 3      │ UPDATE   │ name    │ "Widget"  │ "Gadget"  │         │  │ │
│  │  │  │ 4      │ DELETE   │ *       │ {...}     │ null      │         │  │ │
│  │  │  └────────┴──────────┴─────────┴───────────┴───────────┘         │  │ │
│  │  │                                                                    │  │ │
│  │  └──────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                         │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │ │
│  │  │                   Version Comparison                              │  │ │
│  │  │                                                                    │  │ │
│  │  │    Version 2                    Version 3                         │  │ │
│  │  │   ┌─────────────┐             ┌─────────────┐                    │  │ │
│  │  │   │ name: Widget│─────diff────│ name: Gadget│                    │  │ │
│  │  │   │ price: 89   │             │ price: 89   │                    │  │ │
│  │  │   │ stock: 100  │             │ stock: 100  │                    │  │ │
│  │  │   └─────────────┘             └─────────────┘                    │  │ │
│  │  │                                                                    │  │ │
│  │  │   Diff: { name: ["Widget", "Gadget"] }                           │  │ │
│  │  │                                                                    │  │ │
│  │  └──────────────────────────────────────────────────────────────────┘  │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### Template Rendering Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ API Request │     │ Database    │     │ Cache       │
│             │     │             │     │ (Redis)     │
│ POST /render│     │ Templates   │     │ Compiled    │
│ {template,  │     │ Partials    │     │ templates   │
│  data}      │     │ Layouts     │     │             │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────┐
│                 Template Service                     │
│                                                      │
│  1. Resolve template (cache → DB)                   │
│  2. Resolve layout and partials                     │
│  3. Compile template (if not cached)                │
│  4. Merge context data with locale                  │
│  5. Execute template                                │
│  6. Post-process (MJML → HTML if email)            │
│                                                      │
└──────────────────────────┬──────────────────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │ Rendered Output         │
              │                         │
              │ • HTML content          │
              │ • Plain text fallback   │
              │ • Subject line (email)  │
              └─────────────────────────┘
```

### Calculation Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Pricing Calculation Flow                            │
│                                                                              │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐       │
│  │ Cart    │──▶│ Product │──▶│ Customer│──▶│ Address │──▶│ Coupons │       │
│  │ Items   │   │ Prices  │   │ Profile │   │ Details │   │ Codes   │       │
│  └─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘       │
│       │             │             │             │             │             │
│       └─────────────┴─────────────┴─────────────┴─────────────┘             │
│                                   │                                          │
│                                   ▼                                          │
│                          ┌───────────────┐                                  │
│                          │ Pricing Engine│                                  │
│                          └───────┬───────┘                                  │
│                                  │                                          │
│       ┌──────────────────────────┼──────────────────────────┐               │
│       │                          │                          │               │
│       ▼                          ▼                          ▼               │
│  ┌─────────┐               ┌─────────┐               ┌─────────┐           │
│  │ Quantity│               │ Coupon  │               │ Member  │           │
│  │ Discount│               │ Discount│               │ Discount│           │
│  └────┬────┘               └────┬────┘               └────┬────┘           │
│       │                         │                         │                 │
│       └─────────────────────────┼─────────────────────────┘                 │
│                                 │                                           │
│                                 ▼                                           │
│                         ┌─────────────┐                                     │
│                         │ Tax Engine  │                                     │
│                         └──────┬──────┘                                     │
│                                │                                            │
│       ┌────────────────────────┼────────────────────────┐                   │
│       │                        │                        │                   │
│       ▼                        ▼                        ▼                   │
│  ┌─────────┐              ┌─────────┐              ┌─────────┐             │
│  │ State   │              │ County  │              │ City    │             │
│  │ Tax     │              │ Tax     │              │ Tax     │             │
│  └────┬────┘              └────┬────┘              └────┬────┘             │
│       │                        │                        │                   │
│       └────────────────────────┼────────────────────────┘                   │
│                                │                                            │
│                                ▼                                            │
│                        ┌─────────────┐                                      │
│                        │ Final Total │                                      │
│                        │ + Breakdown │                                      │
│                        └─────────────┘                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Caching Strategy

### Multi-Level Cache Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Cache Hierarchy                                   │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                        L1: In-Memory (Node.js)                          │ │
│  │                                                                         │ │
│  │  • Compiled templates           • Parsed cron expressions              │ │
│  │  • Resolved themes              • Translation bundles                   │ │
│  │  • Validation schemas           • Tax rate lookups                      │ │
│  │                                                                         │ │
│  │  TTL: Session/Process lifetime  │  Size: 100MB max per process        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                     │                                        │
│                                     ▼ Miss                                   │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                          L2: Redis Cluster                              │ │
│  │                                                                         │ │
│  │  • Template content             • Workflow definitions                  │ │
│  │  • Translation strings          • Theme configurations                  │ │
│  │  • Currency rates               • Import job state                      │ │
│  │                                                                         │ │
│  │  TTL: Configurable (1h - 24h)  │  Size: Cluster capacity               │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                     │                                        │
│                                     ▼ Miss                                   │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         L3: Database (PostgreSQL)                       │ │
│  │                                                                         │ │
│  │  • Source of truth for all data                                        │ │
│  │  • Always consulted on L2 miss                                         │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Cache Key Patterns

```typescript
const cacheKeys = {
  // Templates
  template: (ventureId: string, slug: string, locale: string) =>
    `template:${ventureId}:${slug}:${locale}`,
  templateCompiled: (templateId: string, version: number) =>
    `template:compiled:${templateId}:v${version}`,
  
  // Translations
  translations: (ventureId: string, namespace: string, locale: string) =>
    `i18n:${ventureId}:${namespace}:${locale}`,
  
  // Themes
  theme: (ventureId: string, themeId: string, mode: string) =>
    `theme:${ventureId}:${themeId}:${mode}`,
  themeCompiled: (themeId: string, version: number) =>
    `theme:compiled:${themeId}:v${version}`,
  
  // Tax rates
  taxRates: (jurisdiction: string) =>
    `tax:rates:${jurisdiction}`,
  
  // Currency rates
  currencyRates: (baseCurrency: string, date: string) =>
    `currency:rates:${baseCurrency}:${date}`,
  
  // Availability
  availability: (resourceId: string, date: string) =>
    `availability:${resourceId}:${date}`,
};
```

---

## Error Handling

### Error Categories

```typescript
// Module-specific error codes (7xxx range for @mcv/shared)
enum SharedErrorCode {
  // Templates (70xx)
  TEMPLATE_NOT_FOUND = 7001,
  TEMPLATE_COMPILATION_ERROR = 7002,
  TEMPLATE_RENDER_ERROR = 7003,
  INVALID_TEMPLATE_SYNTAX = 7004,
  MISSING_TEMPLATE_VARIABLE = 7005,
  
  // Workflows (71xx)
  WORKFLOW_NOT_FOUND = 7101,
  INVALID_WORKFLOW_TRANSITION = 7102,
  WORKFLOW_GUARD_FAILED = 7103,
  WORKFLOW_ACTION_FAILED = 7104,
  WORKFLOW_ALREADY_COMPLETED = 7105,
  
  // Validation (72xx)
  VALIDATION_RULE_ERROR = 7201,
  ASYNC_VALIDATION_TIMEOUT = 7202,
  
  // Calculations (73xx)
  CALCULATION_OVERFLOW = 7301,
  INVALID_CURRENCY = 7302,
  TAX_JURISDICTION_NOT_FOUND = 7303,
  CURRENCY_RATE_UNAVAILABLE = 7304,
  
  // Scheduling (74xx)
  INVALID_CRON_EXPRESSION = 7401,
  BOOKING_CONFLICT = 7402,
  SLOT_NOT_AVAILABLE = 7403,
  RESOURCE_NOT_FOUND = 7404,
  
  // Localization (75xx)
  LOCALE_NOT_SUPPORTED = 7501,
  TRANSLATION_NOT_FOUND = 7502,
  INVALID_MESSAGE_FORMAT = 7503,
  
  // Theming (76xx)
  THEME_NOT_FOUND = 7601,
  INVALID_TOKEN_REFERENCE = 7602,
  THEME_CIRCULAR_DEPENDENCY = 7603,
  
  // Media (77xx)
  UNSUPPORTED_MEDIA_TYPE = 7701,
  MEDIA_TOO_LARGE = 7702,
  MEDIA_PROCESSING_FAILED = 7703,
  TRANSCODING_FAILED = 7704,
  
  // Export (78xx)
  EXPORT_GENERATION_FAILED = 7801,
  EXPORT_TOO_LARGE = 7802,
  TEMPLATE_PDF_ERROR = 7803,
  
  // Import (79xx)
  IMPORT_PARSE_ERROR = 7901,
  IMPORT_MAPPING_ERROR = 7902,
  IMPORT_VALIDATION_FAILED = 7903,
  IMPORT_ROW_LIMIT_EXCEEDED = 7904,
  
  // Versioning (80xx)
  MIGRATION_FAILED = 8001,
  MIGRATION_CHECKSUM_MISMATCH = 8002,
  VERSION_CONFLICT = 8003,
}
```

### Error Recovery Strategies

```typescript
const errorRecovery = {
  // Templates
  TEMPLATE_NOT_FOUND: {
    strategy: 'fallback',
    action: 'Use default template for type',
  },
  TEMPLATE_RENDER_ERROR: {
    strategy: 'log-and-continue',
    action: 'Return raw content with error marker',
  },
  
  // Calculations
  CURRENCY_RATE_UNAVAILABLE: {
    strategy: 'cache-stale',
    action: 'Use last known rate with warning',
  },
  
  // Scheduling
  BOOKING_CONFLICT: {
    strategy: 'retry-alternative',
    action: 'Suggest next available slot',
  },
  
  // Media
  MEDIA_PROCESSING_FAILED: {
    strategy: 'retry-with-backoff',
    action: 'Queue for retry, max 3 attempts',
  },
  
  // Import
  IMPORT_ROW_LIMIT_EXCEEDED: {
    strategy: 'partial',
    action: 'Import first N rows, report remainder',
  },
};
```

---

## Security Architecture

### Input Sanitization

```typescript
// Template variable sanitization
const sanitize = {
  // HTML escape by default
  html: (value: unknown) => escapeHtml(String(value)),
  
  // URL encode for URLs
  url: (value: unknown) => encodeURIComponent(String(value)),
  
  // JSON encode for data attributes
  json: (value: unknown) => JSON.stringify(value),
  
  // No escaping (explicit opt-in)
  raw: (value: unknown) => String(value),
};

// File upload validation
const validateUpload = {
  maxSize: 50 * 1024 * 1024, // 50MB
  allowedTypes: [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm',
    'application/pdf',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  scanForMalware: true,
};
```

### Access Control

```typescript
// Permission checks for shared operations
const permissions = {
  templates: {
    read: 'shared:templates:read',
    write: 'shared:templates:write',
    render: 'shared:templates:render',
  },
  workflows: {
    read: 'shared:workflows:read',
    manage: 'shared:workflows:manage',
    execute: 'shared:workflows:execute',
  },
  exports: {
    generate: 'shared:exports:generate',
    download: 'shared:exports:download',
  },
  imports: {
    create: 'shared:imports:create',
    execute: 'shared:imports:execute',
  },
  media: {
    upload: 'shared:media:upload',
    process: 'shared:media:process',
    delete: 'shared:media:delete',
  },
};
```

---

## Performance Optimization

### Resource Limits

| Resource | Limit | Reasoning |
|----------|-------|-----------|
| Template size | 1 MB | Prevent memory exhaustion |
| Template variables | 1000 | Limit render complexity |
| Workflow states | 100 | Prevent state explosion |
| Calculation precision | 20 digits | Decimal.js precision |
| Translation bundle | 5 MB | Per-locale bundle size |
| Image upload | 50 MB | Original file size |
| Video upload | 500 MB | Before transcoding |
| Export rows | 100,000 | Single export limit |
| Import rows | 100,000 | Per import limit |
| Import batch | 100 | Rows per transaction |

### Async Processing Thresholds

```typescript
const asyncThresholds = {
  // Process synchronously if below threshold
  export: {
    sync: { rows: 1000, estimatedTime: 5000 },
    async: { rows: 1000, estimatedTime: 5000 },
  },
  import: {
    sync: { rows: 100, estimatedTime: 3000 },
    async: { rows: 100, estimatedTime: 3000 },
  },
  media: {
    sync: { size: 5 * 1024 * 1024 }, // 5MB
    async: { size: 5 * 1024 * 1024 },
  },
};
```

---

## Testing Strategy

### Test Levels

| Level | Coverage Target | Focus Areas |
|-------|-----------------|-------------|
| Unit | 90% | Pure functions, calculations, parsing |
| Integration | 80% | Database operations, external libs |
| E2E | Critical paths | Full workflows, exports, imports |

### Test Fixtures

```typescript
// Template fixtures
const templateFixtures = {
  simple: '{{greeting}}, {{name}}!',
  conditional: '{{#if premium}}Premium{{else}}Basic{{/if}}',
  loop: '{{#each items}}{{name}}{{/each}}',
  email: readFixture('email-template.mjml'),
};

// Calculation fixtures
const calculationFixtures = {
  simpleOrder: {
    items: [{ price: '10.00', quantity: 2 }],
    expected: { subtotal: '20.00', tax: '2.60', total: '22.60' },
  },
  withDiscount: {
    items: [{ price: '100.00', quantity: 1 }],
    discount: { type: 'percentage', value: 10 },
    expected: { subtotal: '90.00', tax: '11.70', total: '101.70' },
  },
};
```

---

## Deployment Considerations

### Environment Configuration

```typescript
const sharedConfig = {
  // Templates
  TEMPLATE_CACHE_TTL: env.number('TEMPLATE_CACHE_TTL', 3600),
  MJML_MINIFY: env.boolean('MJML_MINIFY', true),
  
  // Media
  SHARP_CONCURRENCY: env.number('SHARP_CONCURRENCY', 4),
  FFMPEG_PATH: env.string('FFMPEG_PATH', '/usr/bin/ffmpeg'),
  MAX_VIDEO_DURATION: env.number('MAX_VIDEO_DURATION', 7200),
  
  // Export
  PDF_WORKER_POOL: env.number('PDF_WORKER_POOL', 2),
  CSV_BUFFER_SIZE: env.number('CSV_BUFFER_SIZE', 64 * 1024),
  
  // Import
  IMPORT_BATCH_SIZE: env.number('IMPORT_BATCH_SIZE', 100),
  IMPORT_MAX_ROWS: env.number('IMPORT_MAX_ROWS', 100000),
  
  // Currency
  EXCHANGE_RATE_API_KEY: env.string('EXCHANGE_RATE_API_KEY'),
  EXCHANGE_RATE_CACHE_TTL: env.number('EXCHANGE_RATE_CACHE_TTL', 3600),
};
```

### System Dependencies

| Dependency | Version | Required For |
|------------|---------|--------------|
| FFmpeg | 5.x+ | Video transcoding |
| Sharp | 0.33.x | Image processing |
| Chromium | Latest | PDF generation (Puppeteer) |
| Redis | 7.x+ | Caching, job queues |
| PostgreSQL | 15+ | Data storage |

---

## Related Documentation

- [Package Specification](./01-PACKAGE-SPEC.md)
- [API Reference](./03-API-REFERENCE.md)
- [Implementation Plan](./04-IMPLEMENTATION-PLAN.md)
- [Module Documentation](./templates/MODULE.md)

---

*@mcv/shared — Technical Architecture v1.0*
