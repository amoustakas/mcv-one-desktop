# @mcv/commerce/pos

> Point of Sale — In-person retail terminal management, transaction processing, offline-first payment handling, and hardware integration for the MCV.ONE commerce platform.

**Module:** `@mcv/commerce/pos`
**Layer:** Tier 5 — Domain (Commerce)
**Status:** Stable
**Since:** 0.9.0
**Maintainer:** MCV Commerce Team
**License:** Proprietary

---

## Table of Contents

- [Purpose](#purpose)
- [Exports](#exports)
- [Architecture](#architecture)
  - [Terminal Topology](#terminal-topology)
  - [Offline Sync Flow](#offline-sync-flow)
  - [Transaction Lifecycle](#transaction-lifecycle)
- [Core Interfaces](#core-interfaces)
  - [POSService](#posservice)
  - [Terminal](#terminal)
  - [Transaction](#transaction)
  - [CashSession](#cashsession)
  - [Receipt](#receipt)
  - [ClerkSession](#clerksession)
  - [OfflineQueue](#offlinequeue)
  - [POSReport](#posreport)
  - [Supporting Types](#supporting-types)
- [Database Schemas](#database-schemas)
  - [terminals](#terminals)
  - [pos_transactions](#pos_transactions)
  - [pos_transaction_items](#pos_transaction_items)
  - [cash_sessions](#cash_sessions)
  - [clerk_sessions](#clerk_sessions)
  - [offline_queue](#offline_queue)
  - [pos_receipts](#pos_receipts)
  - [terminal_events](#terminal_events)
- [Code Examples](#code-examples)
  - [1. Register and Pair a Terminal](#1-register-and-pair-a-terminal)
  - [2. Process a Card-Present Payment](#2-process-a-card-present-payment)
  - [3. Handle a Cash Transaction with Change](#3-handle-a-cash-transaction-with-change)
  - [4. Open and Close a Cash Float](#4-open-and-close-a-cash-float)
  - [5. Offline Transaction Queuing and Sync](#5-offline-transaction-queuing-and-sync)
  - [6. Clerk Shift Management](#6-clerk-shift-management)
  - [7. Process an In-Store Return](#7-process-an-in-store-return)
  - [8. Generate End-of-Day Report](#8-generate-end-of-day-report)
- [Error Codes](#error-codes)
- [Security](#security)
  - [Multi-Tenant Isolation](#multi-tenant-isolation)
  - [Terminal Authentication](#terminal-authentication)
  - [PCI Compliance](#pci-compliance)
  - [Staff Access Control](#staff-access-control)
  - [Offline Security](#offline-security)
- [Environment Variables](#environment-variables)
- [Dependencies](#dependencies)
- [Testing](#testing)
  - [Unit Tests](#unit-tests)
  - [Integration Tests](#integration-tests)
  - [Hardware Simulation](#hardware-simulation)
  - [Offline Scenario Tests](#offline-scenario-tests)

---

## Purpose

`@mcv/commerce/pos` provides the complete in-person retail experience for MCV.ONE tenants. Brick-and-mortar stores, pop-up shops, market stalls, food trucks, and hybrid online/offline businesses all rely on this module to accept payments at the physical point of sale.

### What This Module Does

1. **Terminal Management** — Registers physical payment terminals (Stripe Terminal, Square Terminal, generic EMV devices), handles device pairing via Bluetooth or network discovery, monitors terminal health through heartbeat pings, and coordinates firmware updates across fleets of devices.

2. **Transaction Processing** — Handles card-present payments (contactless tap, chip insert, magnetic swipe), cash transactions with automatic change calculation, split payments across multiple methods, tip prompting and adjustment, and penny-rounding for cash transactions in jurisdictions that require it.

3. **Receipt Generation** — Produces digital receipts delivered via email or SMS, drives thermal printers using ESC/POS command protocols, supports per-venue receipt templates with branding, and maintains a receipt archive for returns and disputes.

4. **Cash Management** — Tracks opening and closing cash floats, monitors expected versus actual cash drawer contents, reconciles tills at shift changes, and generates variance reports when counts don't match.

5. **Offline Mode** — Queues transactions when network connectivity is lost, automatically syncs queued transactions when connectivity resumes, resolves conflicts between offline and online state (e.g., inventory discrepancies), and prints receipts locally even when disconnected.

6. **Staff Management** — Authenticates clerks via PIN codes or NFC badge taps, tracks per-clerk sales performance, manages shift start/end times, and enforces permission levels (e.g., only managers can process returns over a threshold).

7. **Barcode/SKU Scanning** — Integrates with camera-based barcode scanning on tablets, connects to dedicated hardware barcode scanners via HID/serial, performs real-time SKU lookups against the catalog, and supports quick-add for items not yet in the system.

8. **Returns at POS** — Processes in-store returns by looking up original receipts, issues instant refunds back to the original payment card, handles exchanges where the customer swaps for a different item, and enforces return policies (time limits, restocking fees).

9. **Multi-Location** — Supports location-specific pricing overrides, tracks inventory per physical location, facilitates stock transfers between locations, and aggregates reporting across all locations for a tenant.

10. **Reporting** — Generates end-of-day summary reports, breaks down sales by clerk, terminal, and hour, shows payment method distribution, and computes tax summaries grouped by rate.

11. **Hardware Integration** — Opens cash drawers on command, drives receipt printers (USB, Bluetooth, network), reads barcode scanners, powers customer-facing displays showing line items and totals, and integrates with scales for weight-based pricing.

### Why It Exists

Online-only commerce misses a massive segment of retail. Physical stores need payment terminals, cash handling, receipt printing, and the ability to keep selling even when the internet goes down. This module bridges the gap so MCV.ONE tenants can run a unified commerce operation — one catalog, one inventory, one customer database — across both online and in-person channels.

### Design Philosophy

- **Offline-first** — Every critical path (payment capture, receipt printing, cart management) must work without a network connection. The network is a luxury, not a requirement.
- **Hardware-agnostic** — Adapters abstract away specific terminal brands and printer models. Today it's Stripe Terminal; tomorrow it could be Adyen or a custom device.
- **Tenant-isolated** — Every terminal, transaction, and report is scoped to a tenant. Row-level security ensures no data leaks between businesses.
- **Clerk-centric** — The POS UI is designed for speed. PIN login, fast scanning, one-tap payments. Clerks shouldn't have to think about the software.

---

## Exports

```typescript
// === Core Service ===
export { POSService }              from './services/pos.service';
export { POSServiceImpl }          from './services/pos.service.impl';

// === Terminal Management ===
export { TerminalManager }         from './services/terminal-manager';
export { TerminalRegistry }        from './services/terminal-registry';
export { TerminalHeartbeat }       from './services/terminal-heartbeat';
export { TerminalPairing }         from './services/terminal-pairing';
export { FirmwareUpdater }         from './services/firmware-updater';

// === Transaction Processing ===
export { TransactionProcessor }    from './services/transaction-processor';
export { PaymentCapture }          from './services/payment-capture';
export { SplitPaymentHandler }     from './services/split-payment-handler';
export { TipProcessor }            from './services/tip-processor';
export { CashRounding }            from './services/cash-rounding';
export { RefundProcessor }         from './services/refund-processor';

// === Receipt Engine ===
export { ReceiptGenerator }        from './services/receipt-generator';
export { ReceiptTemplateEngine }   from './services/receipt-template-engine';
export { ThermalPrinter }          from './services/thermal-printer';
export { EscPosEncoder }           from './services/escpos-encoder';
export { DigitalReceiptSender }    from './services/digital-receipt-sender';

// === Cash Management ===
export { CashSessionManager }      from './services/cash-session-manager';
export { FloatTracker }            from './services/float-tracker';
export { TillReconciliation }      from './services/till-reconciliation';
export { VarianceReporter }        from './services/variance-reporter';

// === Offline ===
export { OfflineQueueManager }     from './services/offline-queue-manager';
export { OfflineSyncEngine }       from './services/offline-sync-engine';
export { ConflictResolver }        from './services/conflict-resolver';
export { ConnectivityMonitor }     from './services/connectivity-monitor';

// === Staff ===
export { ClerkAuthenticator }      from './services/clerk-authenticator';
export { ClerkSessionManager }     from './services/clerk-session-manager';
export { ShiftManager }            from './services/shift-manager';
export { PermissionEnforcer }      from './services/permission-enforcer';

// === Scanning ===
export { BarcodeScanner }          from './services/barcode-scanner';
export { CameraScanAdapter }       from './services/camera-scan-adapter';
export { HardwareScanAdapter }     from './services/hardware-scan-adapter';
export { SkuLookup }               from './services/sku-lookup';

// === Returns ===
export { ReturnProcessor }         from './services/return-processor';
export { ReceiptLookup }           from './services/receipt-lookup';
export { ExchangeProcessor }       from './services/exchange-processor';

// === Multi-Location ===
export { LocationPricingResolver } from './services/location-pricing-resolver';
export { LocationInventoryTracker } from './services/location-inventory-tracker';
export { StockTransferService }    from './services/stock-transfer-service';

// === Reporting ===
export { POSReportGenerator }      from './services/pos-report-generator';
export { EndOfDayReport }          from './services/end-of-day-report';
export { SalesBreakdown }          from './services/sales-breakdown';
export { TaxSummaryReport }        from './services/tax-summary-report';

// === Hardware Adapters ===
export { CashDrawerAdapter }       from './adapters/cash-drawer.adapter';
export { PrinterAdapter }          from './adapters/printer.adapter';
export { ScannerAdapter }          from './adapters/scanner.adapter';
export { CustomerDisplayAdapter }  from './adapters/customer-display.adapter';
export { ScaleAdapter }            from './adapters/scale.adapter';

// === Payment Provider Adapters ===
export { StripeTerminalAdapter }   from './adapters/stripe-terminal.adapter';
export { SquareTerminalAdapter }   from './adapters/square-terminal.adapter';
export { GenericEMVAdapter }       from './adapters/generic-emv.adapter';

// === tRPC Router ===
export { posRouter }               from './router';
export type { POSRouter }          from './router';

// === Types ===
export type {
  Terminal,
  TerminalStatus,
  TerminalType,
  TerminalConfig,
  TerminalHeartbeatData,
  Transaction,
  TransactionStatus,
  TransactionType,
  PaymentMethod,
  PaymentMethodType,
  TransactionItem,
  SplitPayment,
  TipConfig,
  CashSession,
  CashSessionStatus,
  CashCount,
  CashVariance,
  FloatConfig,
  Receipt,
  ReceiptFormat,
  ReceiptTemplate,
  ReceiptDeliveryMethod,
  ClerkSession,
  ClerkPermissionLevel,
  ClerkCredentials,
  OfflineQueue,
  OfflineQueueEntry,
  OfflineSyncResult,
  ConflictResolutionStrategy,
  POSReport,
  POSReportType,
  EndOfDayData,
  SalesBreakdownData,
  TaxSummaryData,
  BarcodeFormat,
  ScanResult,
  ReturnRequest,
  ReturnResult,
  ExchangeRequest,
  LocationPricing,
  StockTransfer,
  HardwareDeviceInfo,
  CustomerDisplayMessage,
  ScaleReading,
} from './types';

// === Schemas (Drizzle) ===
export {
  terminals,
  posTransactions,
  posTransactionItems,
  cashSessions,
  clerkSessions,
  offlineQueue,
  posReceipts,
  terminalEvents,
} from './schema';

// === Constants ===
export {
  POS_ERROR_CODES,
  DEFAULT_TIP_PERCENTAGES,
  DEFAULT_RECEIPT_TEMPLATE,
  CASH_DENOMINATIONS,
  SUPPORTED_BARCODE_FORMATS,
  TERMINAL_HEARTBEAT_INTERVAL_MS,
  OFFLINE_SYNC_BATCH_SIZE,
  MAX_OFFLINE_QUEUE_SIZE,
} from './constants';
```

---

## Architecture

### Terminal Topology

The POS module uses a hub-and-spoke topology where the MCV.ONE backend serves as the central hub, and physical terminals are spokes that connect via the Stripe Terminal SDK (or equivalent provider SDK). Each tenant's location has one or more registered terminals. The POS client application (running on a tablet or dedicated POS hardware) communicates with both the backend and the terminal simultaneously.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MCV.ONE Backend                              │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────────┐ │
│  │  tRPC Router  │  │  WebSocket   │  │  Supabase PostgreSQL      │ │
│  │  (pos.*)      │  │  Gateway     │  │  ┌─────────────────────┐  │ │
│  │               │  │              │  │  │  terminals           │  │ │
│  │  • register   │  │  • terminal  │  │  │  pos_transactions    │  │ │
│  │  • transact   │  │    status    │  │  │  cash_sessions       │  │ │
│  │  • receipt    │  │  • heartbeat │  │  │  clerk_sessions      │  │ │
│  │  • cash       │  │  • sync      │  │  │  offline_queue       │  │ │
│  │  • report     │  │    events    │  │  │  pos_receipts        │  │ │
│  │  • clerk      │  │              │  │  │  terminal_events     │  │ │
│  └──────┬───────┘  └──────┬───────┘  │  └─────────────────────┘  │ │
│         │                  │          └───────────────────────────┘ │
└─────────┼──────────────────┼───────────────────────────────────────┘
          │                  │
          │   HTTPS / WSS    │
          │                  │
┌─────────┼──────────────────┼───────────────────────────────────────┐
│         │    POS Client    │     (Tablet / Dedicated Hardware)      │
│  ┌──────┴───────┐  ┌──────┴───────┐  ┌──────────────────────────┐ │
│  │  POS App     │  │  Offline     │  │  Local Storage            │ │
│  │              │  │  Queue       │  │  (IndexedDB / SQLite)     │ │
│  │  • Cart UI   │  │              │  │                            │ │
│  │  • Clerk     │  │  • Enqueue   │  │  • Queued transactions     │ │
│  │    Login     │  │  • Dequeue   │  │  • Receipt cache           │ │
│  │  • Scanning  │  │  • Conflict  │  │  • Catalog snapshot        │ │
│  │  • Returns   │  │    resolve   │  │  • Clerk credentials       │ │
│  └──────┬───────┘  └──────────────┘  └──────────────────────────┘ │
│         │                                                           │
│  ┌──────┴─────────────────────────────────────────────────────────┐ │
│  │                    Hardware Abstraction Layer                    │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────┐ │ │
│  │  │ Payment  │ │ Receipt  │ │ Barcode  │ │ Cash     │ │Scale│ │ │
│  │  │ Terminal │ │ Printer  │ │ Scanner  │ │ Drawer   │ │     │ │ │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └──┬──┘ │ │
│  └───────┼────────────┼────────────┼────────────┼───────────┼────┘ │
└──────────┼────────────┼────────────┼────────────┼───────────┼──────┘
           │            │            │            │           │
     ┌─────┴─────┐ ┌───┴────┐  ┌───┴────┐  ┌───┴────┐ ┌───┴────┐
     │  Stripe   │ │ Epson  │  │ Zebra  │  │ APG    │ │ CAS    │
     │  Terminal │ │ TM-T88 │  │ DS2208 │  │ Vasario│ │ SW-1S  │
     │  WisePOS  │ │        │  │        │  │        │ │        │
     └───────────┘ └────────┘  └────────┘  └────────┘ └────────┘

    ┌──────────────────────────────────────────────────────────┐
    │            Customer-Facing Display (Optional)            │
    │  ┌────────────────────────────────────────────────────┐  │
    │  │  Line items, running total, "Tap / Insert / Swipe" │  │
    │  └────────────────────────────────────────────────────┘  │
    └──────────────────────────────────────────────────────────┘
```

**Key architectural decisions:**

- **Payment terminals are server-driven.** The POS client sends transaction intents to the backend, which creates a PaymentIntent via Stripe (or equivalent) and returns a client secret. The POS client then uses the Stripe Terminal SDK to collect the payment on the physical device. This ensures the backend always has the authoritative transaction record.

- **Hardware adapters are pluggable.** Each hardware class (printer, scanner, drawer, display, scale) has an abstract adapter interface. Concrete implementations exist for specific models. New hardware is supported by adding a new adapter without changing core logic.

- **The POS client maintains a local catalog snapshot.** Product data, pricing, and tax rates are synced periodically and stored locally. This allows cart building and price lookups even when offline.

- **WebSocket connections provide real-time updates.** Terminal status changes, inventory adjustments from other channels, and clerk session events are pushed to the POS client in real time.

### Offline Sync Flow

The offline sync engine is the most critical subsystem. It ensures that no transaction is ever lost, even when the network is completely unavailable for extended periods.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ONLINE MODE (Normal)                         │
│                                                                     │
│  Customer Taps Card                                                 │
│       │                                                             │
│       ▼                                                             │
│  ┌─────────────────┐    tRPC    ┌─────────────────┐                │
│  │  POS Client     │ ────────► │  Backend          │                │
│  │  Creates Intent │           │  Creates PI       │                │
│  │                 │ ◄──────── │  Returns Secret   │                │
│  │  Collects       │           │                   │                │
│  │  Payment via    │           │  Confirms PI      │                │
│  │  Terminal SDK   │ ────────► │  Records Txn      │                │
│  │                 │           │  Updates Inventory │                │
│  │  Prints Receipt │ ◄──────── │  Returns Receipt  │                │
│  └─────────────────┘           └─────────────────┘                 │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      OFFLINE MODE (Degraded)                        │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Connectivity Monitor detects network loss                    │   │
│  │       │                                                       │   │
│  │       ▼                                                       │   │
│  │  POS Client switches to OFFLINE MODE                          │   │
│  │  • Banner: "OFFLINE — Transactions will sync when online"     │   │
│  │  • Cash transactions: processed locally                       │   │
│  │  • Card transactions: stored as PENDING in offline queue      │   │
│  │  • Receipts: printed locally with "PENDING" watermark         │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Customer Pays Cash                                                 │
│       │                                                             │
│       ▼                                                             │
│  ┌─────────────────┐          ┌─────────────────┐                  │
│  │  POS Client     │          │  Offline Queue   │                  │
│  │  Records Txn    │ ───────► │  (IndexedDB)     │                  │
│  │  Locally        │          │                  │                  │
│  │                 │          │  { id, type,     │                  │
│  │  Opens Drawer   │          │    items, total, │                  │
│  │  Prints Receipt │          │    timestamp,    │                  │
│  │  (local)        │          │    status:       │                  │
│  └─────────────────┘          │    'queued' }    │                  │
│                               └─────────────────┘                  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        SYNC MODE (Recovery)                         │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Connectivity Monitor detects network restored                │   │
│  │       │                                                       │   │
│  │       ▼                                                       │   │
│  │  Offline Sync Engine activates                                │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────┐                  ┌─────────────────┐          │
│  │  Offline Queue   │    Batch of N    │  Backend         │          │
│  │                  │ ──────────────► │                  │          │
│  │  Dequeue oldest  │    (ordered by   │  For each txn:   │          │
│  │  N entries       │     timestamp)   │  • Validate      │          │
│  │                  │                  │  • Check stock   │          │
│  │                  │                  │  • Process pay   │          │
│  │                  │  ◄────────────── │  • Return result │          │
│  │                  │    Sync results  │                  │          │
│  └─────────────────┘                  └─────────────────┘          │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Conflict Resolution                                          │   │
│  │                                                               │   │
│  │  IF item out of stock:                                        │   │
│  │    → Mark txn as SYNC_CONFLICT                                │   │
│  │    → Flag for manager review                                  │   │
│  │    → Do NOT reverse the sale (customer already left)          │   │
│  │    → Adjust inventory to negative (backorder)                 │   │
│  │                                                               │   │
│  │  IF price changed since offline snapshot:                     │   │
│  │    → Use the price at time of sale (offline snapshot price)   │   │
│  │    → Log price discrepancy for audit                          │   │
│  │                                                               │   │
│  │  IF card payment stored offline:                              │   │
│  │    → Attempt to create and capture PaymentIntent now          │   │
│  │    → If card declined: mark as REQUIRES_COLLECTION            │   │
│  │    → Generate "payment due" notice for customer               │   │
│  │                                                               │   │
│  │  IF duplicate transaction detected:                           │   │
│  │    → Idempotency key prevents double-processing               │   │
│  │    → Return existing transaction record                       │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

**Sync guarantees:**

| Guarantee | Implementation |
|-----------|----------------|
| **At-least-once delivery** | Queued entries are not removed until the backend confirms receipt. If sync fails mid-batch, the entire batch is retried. |
| **Ordering** | Transactions are synced in chronological order. A newer transaction never syncs before an older one from the same terminal. |
| **Idempotency** | Every transaction has a client-generated UUID. The backend uses this as an idempotency key to prevent duplicates. |
| **Conflict visibility** | All conflicts are logged in `terminal_events` with type `sync_conflict` and surfaced in the management dashboard. |
| **Bounded queue** | The offline queue has a configurable maximum size (default 500 entries). When full, the POS client warns the clerk and refuses new transactions until space is freed. |

### Transaction Lifecycle

Every POS transaction follows a deterministic state machine:

```
                    ┌──────────┐
                    │ CREATED  │
                    └────┬─────┘
                         │
              ┌──────────┼──────────┐
              │          │          │
              ▼          ▼          ▼
        ┌──────────┐ ┌────────┐ ┌──────────┐
        │ CARD     │ │ CASH   │ │ SPLIT    │
        │ PENDING  │ │ TENDERED│ │ PENDING  │
        └────┬─────┘ └───┬────┘ └────┬─────┘
             │            │           │
             ▼            ▼           ▼
        ┌──────────┐ ┌────────┐ ┌──────────┐
        │ CARD     │ │ CASH   │ │ SPLIT    │
        │ CAPTURED │ │ ACCEPTED│ │ PARTIAL  │
        └────┬─────┘ └───┬────┘ └────┬─────┘
             │            │           │
             └────────────┼───────────┘
                          │
                          ▼
                    ┌──────────┐
                    │ COMPLETED│
                    └────┬─────┘
                         │
              ┌──────────┼──────────┐
              │          │          │
              ▼          ▼          ▼
        ┌──────────┐ ┌────────┐ ┌──────────┐
        │ RECEIPT  │ │ VOID   │ │ REFUND   │
        │ SENT     │ │        │ │ PENDING  │
        └──────────┘ └────────┘ └────┬─────┘
                                     │
                                     ▼
                               ┌──────────┐
                               │ REFUNDED │
                               └──────────┘

  Offline-specific states:

        ┌──────────────┐
        │ QUEUED       │ ──► (Sync Engine picks up)
        │ (offline)    │
        └──────┬───────┘
               │
        ┌──────┴───────┐
        │              │
        ▼              ▼
  ┌──────────┐  ┌────────────────┐
  │ SYNCED   │  │ SYNC_CONFLICT  │
  │          │  │                │
  └──────────┘  └────────────────┘
```

---

## Core Interfaces

### POSService

The top-level service facade that orchestrates all POS operations. This is the primary entry point for the tRPC router and for direct programmatic use.

```typescript
interface POSService {
  // === Terminal Management ===
  registerTerminal(input: RegisterTerminalInput): Promise<Terminal>;
  deregisterTerminal(terminalId: string): Promise<void>;
  pairTerminal(terminalId: string, pairingCode: string): Promise<Terminal>;
  unpairTerminal(terminalId: string): Promise<void>;
  getTerminal(terminalId: string): Promise<Terminal | null>;
  listTerminals(locationId: string): Promise<Terminal[]>;
  getTerminalStatus(terminalId: string): Promise<TerminalStatus>;
  updateTerminalConfig(terminalId: string, config: Partial<TerminalConfig>): Promise<Terminal>;
  initiateFirmwareUpdate(terminalId: string): Promise<FirmwareUpdateResult>;

  // === Transaction Processing ===
  createTransaction(input: CreateTransactionInput): Promise<Transaction>;
  processCardPayment(transactionId: string, terminalId: string): Promise<Transaction>;
  processCashPayment(transactionId: string, amountTendered: number): Promise<CashPaymentResult>;
  processSplitPayment(transactionId: string, splits: SplitPayment[]): Promise<Transaction>;
  addTip(transactionId: string, tipAmount: number): Promise<Transaction>;
  voidTransaction(transactionId: string, reason: string): Promise<Transaction>;
  getTransaction(transactionId: string): Promise<Transaction | null>;
  listTransactions(filter: TransactionFilter): Promise<PaginatedResult<Transaction>>;

  // === Cart Operations ===
  addItem(transactionId: string, item: AddItemInput): Promise<Transaction>;
  removeItem(transactionId: string, itemId: string): Promise<Transaction>;
  updateItemQuantity(transactionId: string, itemId: string, quantity: number): Promise<Transaction>;
  applyDiscount(transactionId: string, discount: DiscountInput): Promise<Transaction>;
  removeDiscount(transactionId: string, discountId: string): Promise<Transaction>;

  // === Receipt ===
  generateReceipt(transactionId: string, format: ReceiptFormat): Promise<Receipt>;
  sendDigitalReceipt(transactionId: string, method: ReceiptDeliveryMethod, destination: string): Promise<void>;
  printReceipt(transactionId: string, printerId: string): Promise<void>;
  getReceipt(receiptId: string): Promise<Receipt | null>;
  lookupReceipt(query: ReceiptLookupQuery): Promise<Receipt[]>;

  // === Cash Management ===
  openCashSession(input: OpenCashSessionInput): Promise<CashSession>;
  closeCashSession(sessionId: string, closingCount: CashCount): Promise<CashSession>;
  recordCashDrop(sessionId: string, amount: number, reason: string): Promise<CashSession>;
  recordCashPickup(sessionId: string, amount: number, reason: string): Promise<CashSession>;
  getCashSession(sessionId: string): Promise<CashSession | null>;
  getActiveCashSession(terminalId: string): Promise<CashSession | null>;

  // === Offline ===
  enqueueOfflineTransaction(entry: OfflineQueueEntry): Promise<void>;
  syncOfflineQueue(terminalId: string): Promise<OfflineSyncResult>;
  getOfflineQueueStatus(terminalId: string): Promise<OfflineQueueStatus>;
  resolveConflict(entryId: string, resolution: ConflictResolution): Promise<void>;

  // === Staff ===
  authenticateClerk(credentials: ClerkCredentials): Promise<ClerkSession>;
  endClerkSession(sessionId: string): Promise<ClerkSession>;
  getActiveClerkSession(terminalId: string): Promise<ClerkSession | null>;
  getClerkSalesStats(clerkId: string, dateRange: DateRange): Promise<ClerkSalesStats>;

  // === Scanning ===
  lookupBarcode(barcode: string, format: BarcodeFormat): Promise<ScanResult>;
  quickAddItem(barcode: string, name: string, price: number): Promise<CatalogItem>;

  // === Returns ===
  initiateReturn(input: ReturnRequest): Promise<ReturnResult>;
  processExchange(input: ExchangeRequest): Promise<ExchangeResult>;

  // === Reporting ===
  generateEndOfDayReport(locationId: string, date: string): Promise<POSReport>;
  generateSalesBreakdown(filter: ReportFilter): Promise<POSReport>;
  generateTaxSummary(locationId: string, dateRange: DateRange): Promise<POSReport>;
  getReport(reportId: string): Promise<POSReport | null>;
  listReports(filter: ReportFilter): Promise<PaginatedResult<POSReport>>;

  // === Hardware ===
  openCashDrawer(terminalId: string): Promise<void>;
  updateCustomerDisplay(terminalId: string, message: CustomerDisplayMessage): Promise<void>;
  readScale(terminalId: string): Promise<ScaleReading>;
}
```

### Terminal

Represents a physical payment terminal registered to a location.

```typescript
interface Terminal {
  /** Unique terminal identifier (UUID) */
  id: string;

  /** Tenant that owns this terminal */
  tenantId: string;

  /** Physical location where this terminal is deployed */
  locationId: string;

  /** Human-readable name (e.g., "Register 1", "Bar Terminal") */
  name: string;

  /** Terminal hardware type */
  type: TerminalType;

  /** Current operational status */
  status: TerminalStatus;

  /** External provider terminal ID (e.g., Stripe Terminal ID) */
  providerTerminalId: string | null;

  /** Provider type (stripe, square, generic) */
  provider: TerminalProvider;

  /** Serial number of the physical device */
  serialNumber: string | null;

  /** Current firmware version */
  firmwareVersion: string | null;

  /** IP address on the local network */
  ipAddress: string | null;

  /** Last successful heartbeat timestamp */
  lastHeartbeatAt: Date | null;

  /** Terminal-specific configuration */
  config: TerminalConfig;

  /** Whether this terminal supports offline mode */
  offlineEnabled: boolean;

  /** Maximum amount allowed for offline transactions (cents) */
  offlineMaxAmount: number;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
  pairedAt: Date | null;
}

type TerminalType =
  | 'stripe_wisePosE'
  | 'stripe_s700'
  | 'stripe_m2'
  | 'stripe_bbpos_chipper'
  | 'square_terminal'
  | 'square_reader'
  | 'generic_emv'
  | 'virtual';     // For testing

type TerminalStatus =
  | 'registered'   // Created in system, not yet paired
  | 'pairing'      // Pairing in progress
  | 'online'       // Paired and communicating
  | 'offline'      // Paired but not communicating
  | 'busy'         // Processing a transaction
  | 'error'        // In an error state
  | 'updating'     // Firmware update in progress
  | 'decommissioned'; // No longer in use

type TerminalProvider = 'stripe' | 'square' | 'generic';

interface TerminalConfig {
  /** Whether to prompt for tips on this terminal */
  tipsEnabled: boolean;

  /** Tip percentage presets (e.g., [15, 18, 20]) */
  tipPercentages: number[];

  /** Whether to allow custom tip amounts */
  customTipAllowed: boolean;

  /** Currency code (ISO 4217) */
  currency: string;

  /** Locale for display formatting */
  locale: string;

  /** Cash rounding rule for this terminal's jurisdiction */
  cashRoundingRule: CashRoundingRule | null;

  /** Receipt printer ID associated with this terminal */
  receiptPrinterId: string | null;

  /** Cash drawer ID associated with this terminal */
  cashDrawerId: string | null;

  /** Customer-facing display ID */
  customerDisplayId: string | null;

  /** Scale ID for weight-based items */
  scaleId: string | null;

  /** Auto-print receipt after every transaction */
  autoPrintReceipt: boolean;

  /** Send digital receipt automatically (if customer email/phone on file) */
  autoSendDigitalReceipt: boolean;

  /** Timeout in seconds for card payment collection */
  paymentTimeoutSeconds: number;

  /** Maximum offline queue size for this terminal */
  maxOfflineQueueSize: number;
}

type CashRoundingRule =
  | 'none'             // No rounding
  | 'nearest_5_cents'  // Canadian rounding (round to nearest $0.05)
  | 'nearest_10_cents' // Some European countries
  | 'swedish_rounding'; // Round to nearest $0.50 or $1.00
```

### Transaction

Represents a single POS transaction — one customer, one payment (or split payment), one receipt.

```typescript
interface Transaction {
  /** Unique transaction identifier (UUID, client-generated for idempotency) */
  id: string;

  /** Tenant ID */
  tenantId: string;

  /** Location where this transaction occurred */
  locationId: string;

  /** Terminal that processed this transaction */
  terminalId: string;

  /** Clerk who processed this transaction */
  clerkId: string;

  /** Clerk session at time of transaction */
  clerkSessionId: string;

  /** Cash session at time of transaction */
  cashSessionId: string | null;

  /** Current transaction status */
  status: TransactionStatus;

  /** Transaction type */
  type: TransactionType;

  /** Line items */
  items: TransactionItem[];

  /** Subtotal before tax and discounts (cents) */
  subtotal: number;

  /** Total discount amount (cents) */
  discountTotal: number;

  /** Total tax amount (cents) */
  taxTotal: number;

  /** Tip amount (cents) */
  tipAmount: number;

  /** Cash rounding adjustment (cents, can be negative) */
  roundingAdjustment: number;

  /** Grand total (cents) */
  total: number;

  /** Payment method(s) used */
  payments: PaymentMethod[];

  /** Amount tendered in cash (cents), null if not cash */
  cashTendered: number | null;

  /** Change given (cents), null if not cash */
  changeGiven: number | null;

  /** External payment provider reference (e.g., Stripe PaymentIntent ID) */
  providerPaymentId: string | null;

  /** Card brand (visa, mastercard, amex, etc.) */
  cardBrand: string | null;

  /** Last 4 digits of card */
  cardLast4: string | null;

  /** Card entry method */
  cardEntryMethod: CardEntryMethod | null;

  /** Receipt ID (once generated) */
  receiptId: string | null;

  /** If this is a refund, references the original transaction */
  originalTransactionId: string | null;

  /** If this transaction was processed offline */
  offlineCreated: boolean;

  /** When the offline transaction was synced to server */
  syncedAt: Date | null;

  /** Customer ID if linked (from CRM/loyalty) */
  customerId: string | null;

  /** Customer email for digital receipt */
  customerEmail: string | null;

  /** Customer phone for SMS receipt */
  customerPhone: string | null;

  /** Free-form notes */
  notes: string | null;

  /** Metadata for extensibility */
  metadata: Record<string, unknown>;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  voidedAt: Date | null;
}

type TransactionStatus =
  | 'created'           // Cart created, items being added
  | 'card_pending'      // Waiting for card tap/insert/swipe
  | 'card_captured'     // Card payment captured
  | 'cash_tendered'     // Cash handed over, awaiting acceptance
  | 'cash_accepted'     // Cash transaction finalized
  | 'split_pending'     // Split payment in progress
  | 'split_partial'     // Some splits completed, others pending
  | 'completed'         // Fully paid and finalized
  | 'voided'            // Voided before completion
  | 'refund_pending'    // Refund initiated
  | 'refunded'          // Refund completed
  | 'partial_refund'    // Partial refund completed
  | 'queued'            // In offline queue
  | 'synced'            // Synced from offline queue
  | 'sync_conflict';    // Synced with conflicts

type TransactionType =
  | 'sale'
  | 'return'
  | 'exchange'
  | 'void';

type CardEntryMethod =
  | 'contactless'   // NFC tap
  | 'chip'          // EMV chip insert
  | 'swipe'         // Magnetic stripe
  | 'manual'        // Keyed in (rare at POS)
  | 'fallback';     // Chip failed, fell back to swipe

interface TransactionItem {
  /** Unique item line ID */
  id: string;

  /** Transaction this item belongs to */
  transactionId: string;

  /** Catalog product ID (null for quick-add items) */
  productId: string | null;

  /** Catalog variant ID */
  variantId: string | null;

  /** SKU */
  sku: string | null;

  /** Barcode scanned */
  barcode: string | null;

  /** Display name */
  name: string;

  /** Unit price (cents) */
  unitPrice: number;

  /** Quantity */
  quantity: number;

  /** Unit of measure (for weight-based items) */
  unitOfMeasure: string | null;

  /** Weight (for scale items) */
  weight: number | null;

  /** Line-item discount (cents) */
  discount: number;

  /** Tax amount for this line (cents) */
  tax: number;

  /** Tax rate applied (percentage, e.g., 13.0 for 13%) */
  taxRate: number;

  /** Tax code / category */
  taxCode: string | null;

  /** Line total after discount and tax (cents) */
  lineTotal: number;

  /** Whether this is a return item (negative quantity) */
  isReturn: boolean;

  /** Notes for this line item */
  notes: string | null;

  /** Metadata */
  metadata: Record<string, unknown>;
}

interface PaymentMethod {
  /** Payment method type */
  type: PaymentMethodType;

  /** Amount paid with this method (cents) */
  amount: number;

  /** External reference */
  providerPaymentId: string | null;

  /** Card details (if applicable) */
  cardBrand: string | null;
  cardLast4: string | null;
  cardEntryMethod: CardEntryMethod | null;

  /** Timestamp of this payment */
  processedAt: Date;
}

type PaymentMethodType =
  | 'card_present'
  | 'cash'
  | 'gift_card'
  | 'store_credit'
  | 'external';     // e.g., Interac, mobile wallet via separate system

interface SplitPayment {
  /** Payment method for this split */
  type: PaymentMethodType;

  /** Amount for this split (cents) */
  amount: number;

  /** Terminal to use (for card splits) */
  terminalId?: string;
}
```

### CashSession

Represents a cash drawer session — from opening float to closing count.

```typescript
interface CashSession {
  /** Unique session identifier */
  id: string;

  /** Tenant ID */
  tenantId: string;

  /** Location ID */
  locationId: string;

  /** Terminal this cash session is for */
  terminalId: string;

  /** Clerk who opened the session */
  openedByClerkId: string;

  /** Clerk who closed the session (null if still open) */
  closedByClerkId: string | null;

  /** Current status */
  status: CashSessionStatus;

  /** Opening float amount (cents) */
  openingFloat: number;

  /** Detailed denomination count at opening */
  openingCount: CashCount;

  /** Expected cash in drawer based on transactions (cents) */
  expectedCash: number;

  /** Actual closing count amount (cents, null if still open) */
  actualCash: number | null;

  /** Detailed denomination count at closing */
  closingCount: CashCount | null;

  /** Variance: actual minus expected (cents, null if still open) */
  variance: number | null;

  /** Cash drops during the session (safe drops) */
  drops: CashMovement[];

  /** Cash pickups during the session */
  pickups: CashMovement[];

  /** Number of cash transactions in this session */
  transactionCount: number;

  /** Total cash received from sales (cents) */
  totalCashReceived: number;

  /** Total change given (cents) */
  totalChangeGiven: number;

  /** Total cash refunds issued (cents) */
  totalCashRefunds: number;

  /** Notes */
  notes: string | null;

  /** Timestamps */
  openedAt: Date;
  closedAt: Date | null;
}

type CashSessionStatus =
  | 'open'
  | 'closing'    // Count in progress
  | 'closed'
  | 'reconciled' // Manager has reviewed variance
  | 'disputed';  // Variance under investigation

interface CashCount {
  /** Count by denomination. Key is denomination in cents (e.g., "10000" for $100 bill) */
  denominations: Record<string, number>;

  /** Total amount (cents) — computed from denominations */
  total: number;

  /** Count timestamp */
  countedAt: Date;

  /** Who counted */
  countedByClerkId: string;
}

interface CashMovement {
  /** Movement ID */
  id: string;

  /** Amount (cents) */
  amount: number;

  /** Reason for the drop/pickup */
  reason: string;

  /** Clerk who performed the movement */
  clerkId: string;

  /** Timestamp */
  performedAt: Date;
}

interface CashVariance {
  /** Session ID */
  sessionId: string;

  /** Expected amount (cents) */
  expected: number;

  /** Actual amount (cents) */
  actual: number;

  /** Variance amount (cents, positive = over, negative = short) */
  variance: number;

  /** Variance percentage */
  variancePercent: number;

  /** Whether this variance exceeds the acceptable threshold */
  exceedsThreshold: boolean;

  /** Threshold amount (cents) */
  threshold: number;

  /** Breakdown by denomination */
  denominationVariances: Record<string, { expected: number; actual: number; variance: number }>;
}
```

### Receipt

Represents a receipt generated for a transaction.

```typescript
interface Receipt {
  /** Unique receipt identifier */
  id: string;

  /** Tenant ID */
  tenantId: string;

  /** Transaction this receipt is for */
  transactionId: string;

  /** Receipt number (human-readable, sequential per location) */
  receiptNumber: string;

  /** Format of the receipt content */
  format: ReceiptFormat;

  /** Rendered receipt content */
  content: string;

  /** Raw ESC/POS bytes (for thermal printers), base64 encoded */
  escposData: string | null;

  /** HTML version (for email / digital display) */
  htmlContent: string | null;

  /** Plain text version (for SMS) */
  textContent: string | null;

  /** PDF URL (if generated) */
  pdfUrl: string | null;

  /** Template used to generate this receipt */
  templateId: string;

  /** Delivery status */
  deliveries: ReceiptDelivery[];

  /** Whether this receipt was generated offline */
  offlineGenerated: boolean;

  /** Timestamps */
  createdAt: Date;
}

type ReceiptFormat =
  | 'escpos'      // Thermal printer format
  | 'html'        // Email / display
  | 'text'        // SMS / plain text
  | 'pdf';        // PDF document

interface ReceiptTemplate {
  /** Template ID */
  id: string;

  /** Tenant ID */
  tenantId: string;

  /** Location ID (null = tenant-wide default) */
  locationId: string | null;

  /** Template name */
  name: string;

  /** Template format */
  format: ReceiptFormat;

  /** Template body (Handlebars syntax) */
  body: string;

  /** Header content (logo, store name, address) */
  header: string;

  /** Footer content (return policy, social media, etc.) */
  footer: string;

  /** Whether to include itemized tax breakdown */
  showTaxBreakdown: boolean;

  /** Whether to include barcode/QR code for receipt lookup */
  includeBarcode: boolean;

  /** Barcode type for receipt lookup */
  barcodeType: 'qr' | 'code128' | 'none';

  /** Custom CSS (for HTML format) */
  css: string | null;

  /** Logo URL */
  logoUrl: string | null;

  /** Active flag */
  isActive: boolean;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}

interface ReceiptDelivery {
  /** Delivery method */
  method: ReceiptDeliveryMethod;

  /** Destination (email address, phone number, printer ID) */
  destination: string;

  /** Delivery status */
  status: 'pending' | 'sent' | 'delivered' | 'failed';

  /** Error message if failed */
  error: string | null;

  /** Timestamp */
  sentAt: Date | null;
  deliveredAt: Date | null;
}

type ReceiptDeliveryMethod =
  | 'print'    // Thermal printer
  | 'email'    // Email
  | 'sms'      // SMS
  | 'none';    // No delivery (just stored)
```

### ClerkSession

Represents a clerk's active session on a terminal.

```typescript
interface ClerkSession {
  /** Unique session identifier */
  id: string;

  /** Tenant ID */
  tenantId: string;

  /** Clerk user ID (from auth system) */
  clerkId: string;

  /** Clerk display name */
  clerkName: string;

  /** Terminal this session is on */
  terminalId: string;

  /** Location ID */
  locationId: string;

  /** Permission level for this session */
  permissionLevel: ClerkPermissionLevel;

  /** Whether this session is currently active */
  isActive: boolean;

  /** Number of transactions processed in this session */
  transactionCount: number;

  /** Total sales in this session (cents) */
  totalSales: number;

  /** Total returns in this session (cents) */
  totalReturns: number;

  /** Average transaction value (cents) */
  averageTransactionValue: number;

  /** Authentication method used */
  authMethod: ClerkAuthMethod;

  /** Timestamps */
  startedAt: Date;
  endedAt: Date | null;

  /** Last activity timestamp */
  lastActivityAt: Date;
}

type ClerkPermissionLevel =
  | 'cashier'       // Basic transactions, no returns
  | 'senior'        // Transactions + returns up to limit
  | 'supervisor'    // Transactions + returns + voids + cash management
  | 'manager'       // Full access including reporting and config
  | 'admin';        // System administration

type ClerkAuthMethod =
  | 'pin'           // 4-6 digit PIN
  | 'badge'         // NFC badge tap
  | 'biometric'     // Fingerprint (future)
  | 'password';     // Fallback username/password

interface ClerkCredentials {
  /** Authentication method */
  method: ClerkAuthMethod;

  /** Terminal ID where login is happening */
  terminalId: string;

  /** PIN code (for pin method) */
  pin?: string;

  /** Badge ID (for badge method) */
  badgeId?: string;

  /** Username (for password method) */
  username?: string;

  /** Password (for password method) */
  password?: string;
}

interface ClerkSalesStats {
  /** Clerk ID */
  clerkId: string;

  /** Date range */
  dateRange: DateRange;

  /** Total number of transactions */
  totalTransactions: number;

  /** Total sales amount (cents) */
  totalSales: number;

  /** Total returns amount (cents) */
  totalReturns: number;

  /** Net sales (sales - returns, cents) */
  netSales: number;

  /** Average transaction value (cents) */
  averageTransactionValue: number;

  /** Total tips received (cents) */
  totalTips: number;

  /** Items sold */
  itemsSold: number;

  /** Items returned */
  itemsReturned: number;

  /** Transactions per hour */
  transactionsPerHour: number;

  /** Void count */
  voidCount: number;

  /** Discount total given (cents) */
  discountsGiven: number;

  /** Breakdown by payment method */
  paymentMethodBreakdown: Record<PaymentMethodType, { count: number; total: number }>;

  /** Hourly sales distribution */
  hourlySales: Record<number, { count: number; total: number }>;
}
```

### OfflineQueue

Manages the queue of transactions created while the terminal was offline.

```typescript
interface OfflineQueue {
  /** Terminal this queue belongs to */
  terminalId: string;

  /** Current number of entries in the queue */
  size: number;

  /** Maximum queue capacity */
  maxSize: number;

  /** Oldest entry timestamp */
  oldestEntryAt: Date | null;

  /** Newest entry timestamp */
  newestEntryAt: Date | null;

  /** Number of entries pending sync */
  pendingCount: number;

  /** Number of entries with conflicts */
  conflictCount: number;

  /** Number of entries successfully synced */
  syncedCount: number;

  /** Whether the queue is currently syncing */
  isSyncing: boolean;

  /** Last sync attempt timestamp */
  lastSyncAttemptAt: Date | null;

  /** Last successful sync timestamp */
  lastSuccessfulSyncAt: Date | null;
}

interface OfflineQueueEntry {
  /** Unique entry ID (UUID, client-generated) */
  id: string;

  /** Tenant ID */
  tenantId: string;

  /** Terminal that created this entry */
  terminalId: string;

  /** Clerk who created the transaction */
  clerkId: string;

  /** Entry type */
  type: OfflineEntryType;

  /** Serialized transaction data */
  payload: OfflineTransactionPayload;

  /** Entry status */
  status: OfflineEntryStatus;

  /** Idempotency key (same as transaction ID) */
  idempotencyKey: string;

  /** Catalog snapshot version used for pricing */
  catalogSnapshotVersion: string;

  /** Number of sync attempts */
  syncAttempts: number;

  /** Last sync error (if any) */
  lastSyncError: string | null;

  /** Conflict details (if status is conflict) */
  conflictDetails: ConflictDetail[] | null;

  /** Resolution applied (if resolved) */
  resolution: ConflictResolution | null;

  /** Timestamps */
  createdAt: Date;
  syncedAt: Date | null;
  resolvedAt: Date | null;
}

type OfflineEntryType =
  | 'sale'
  | 'return'
  | 'void'
  | 'cash_session_open'
  | 'cash_session_close'
  | 'cash_drop'
  | 'cash_pickup';

type OfflineEntryStatus =
  | 'queued'        // Waiting to sync
  | 'syncing'       // Currently being synced
  | 'synced'        // Successfully synced
  | 'conflict'      // Synced with conflicts
  | 'resolved'      // Conflict resolved
  | 'failed'        // Permanently failed (max retries exceeded)
  | 'expired';      // Expired (too old to process)

interface OfflineTransactionPayload {
  /** Transaction data */
  transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>;

  /** Items */
  items: Omit<TransactionItem, 'id' | 'transactionId'>[];

  /** Payment method used */
  payment: {
    type: PaymentMethodType;
    amount: number;
    cashTendered?: number;
    /** For offline card payments: encrypted card data (PCI-compliant token) */
    cardToken?: string;
  };

  /** Receipt data for local printing */
  receiptData: {
    templateId: string;
    headerHtml: string;
    footerHtml: string;
  };
}

interface OfflineSyncResult {
  /** Terminal ID */
  terminalId: string;

  /** Total entries processed */
  totalProcessed: number;

  /** Successfully synced */
  successCount: number;

  /** Failed / conflict */
  failureCount: number;

  /** Conflict count */
  conflictCount: number;

  /** Details per entry */
  entries: OfflineSyncEntryResult[];

  /** Timestamp */
  syncedAt: Date;

  /** Duration in milliseconds */
  durationMs: number;
}

interface OfflineSyncEntryResult {
  /** Entry ID */
  entryId: string;

  /** Result status */
  status: 'synced' | 'conflict' | 'failed';

  /** Server-assigned transaction ID (if synced) */
  serverTransactionId: string | null;

  /** Conflict details (if any) */
  conflicts: ConflictDetail[] | null;

  /** Error message (if failed) */
  error: string | null;
}

interface ConflictDetail {
  /** Conflict type */
  type: ConflictType;

  /** Human-readable description */
  description: string;

  /** Field that conflicted */
  field: string;

  /** Value in the offline entry */
  offlineValue: unknown;

  /** Value on the server */
  serverValue: unknown;

  /** Suggested resolution */
  suggestedResolution: ConflictResolutionStrategy;
}

type ConflictType =
  | 'inventory_insufficient'   // Item out of stock
  | 'price_changed'            // Price differs from snapshot
  | 'item_discontinued'        // Item no longer available
  | 'card_declined'            // Offline card payment failed
  | 'duplicate_transaction'    // Already processed
  | 'clerk_inactive'           // Clerk no longer active
  | 'terminal_decommissioned'; // Terminal no longer registered

type ConflictResolutionStrategy =
  | 'accept_offline'    // Use offline values
  | 'accept_server'     // Use server values
  | 'manual_review'     // Requires human decision
  | 'auto_adjust'       // System auto-adjusts (e.g., backorder)
  | 'reject';           // Reject the offline entry entirely

interface ConflictResolution {
  /** Strategy applied */
  strategy: ConflictResolutionStrategy;

  /** Clerk/manager who resolved */
  resolvedByClerkId: string;

  /** Notes */
  notes: string;

  /** Adjustments made */
  adjustments: Record<string, unknown>;

  /** Timestamp */
  resolvedAt: Date;
}
```

### POSReport

Represents a generated POS report.

```typescript
interface POSReport {
  /** Unique report ID */
  id: string;

  /** Tenant ID */
  tenantId: string;

  /** Location ID (null for multi-location reports) */
  locationId: string | null;

  /** Report type */
  type: POSReportType;

  /** Report title */
  title: string;

  /** Date range covered */
  dateRange: DateRange;

  /** Report data (type-specific) */
  data: EndOfDayData | SalesBreakdownData | TaxSummaryData;

  /** Generated by (clerk ID or 'system') */
  generatedBy: string;

  /** PDF URL (if rendered) */
  pdfUrl: string | null;

  /** Timestamps */
  generatedAt: Date;
}

type POSReportType =
  | 'end_of_day'
  | 'sales_breakdown'
  | 'tax_summary'
  | 'clerk_performance'
  | 'terminal_activity'
  | 'payment_method'
  | 'hourly_sales'
  | 'inventory_movement'
  | 'return_summary'
  | 'variance_report';

interface EndOfDayData {
  /** Location summary */
  location: {
    id: string;
    name: string;
  };

  /** Date */
  date: string;

  /** Overall totals */
  totals: {
    grossSales: number;           // cents
    returns: number;              // cents
    netSales: number;             // cents
    discounts: number;            // cents
    tips: number;                 // cents
    tax: number;                  // cents
    transactionCount: number;
    returnCount: number;
    voidCount: number;
    averageTransactionValue: number; // cents
    itemsSold: number;
    itemsReturned: number;
  };

  /** Payment method breakdown */
  paymentMethods: {
    type: PaymentMethodType;
    count: number;
    total: number;                // cents
    percentage: number;           // percentage of total
  }[];

  /** Sales by hour */
  hourlyBreakdown: {
    hour: number;                 // 0-23
    transactionCount: number;
    total: number;                // cents
  }[];

  /** Sales by clerk */
  clerkBreakdown: {
    clerkId: string;
    clerkName: string;
    transactionCount: number;
    total: number;                // cents
    tips: number;                 // cents
    returns: number;              // cents
    voids: number;
  }[];

  /** Sales by terminal */
  terminalBreakdown: {
    terminalId: string;
    terminalName: string;
    transactionCount: number;
    total: number;                // cents
  }[];

  /** Cash session summaries */
  cashSessions: {
    sessionId: string;
    clerkName: string;
    openedAt: Date;
    closedAt: Date | null;
    openingFloat: number;         // cents
    expectedCash: number;         // cents
    actualCash: number | null;    // cents
    variance: number | null;      // cents
  }[];

  /** Top selling items */
  topItems: {
    productId: string;
    name: string;
    quantitySold: number;
    revenue: number;              // cents
  }[];

  /** Tax summary */
  taxSummary: {
    taxCode: string;
    taxRate: number;
    taxableAmount: number;        // cents
    taxAmount: number;            // cents
  }[];

  /** Offline sync stats */
  offlineStats: {
    transactionsCreatedOffline: number;
    transactionsSynced: number;
    transactionsWithConflicts: number;
    pendingSync: number;
  };
}

interface SalesBreakdownData {
  /** Grouping type */
  groupBy: 'clerk' | 'terminal' | 'hour' | 'day' | 'product' | 'category' | 'payment_method';

  /** Breakdown rows */
  rows: {
    key: string;
    label: string;
    transactionCount: number;
    grossSales: number;       // cents
    returns: number;          // cents
    netSales: number;         // cents
    discounts: number;        // cents
    tax: number;              // cents
    tips: number;             // cents
    averageValue: number;     // cents
  }[];

  /** Totals */
  totals: {
    transactionCount: number;
    grossSales: number;
    returns: number;
    netSales: number;
    discounts: number;
    tax: number;
    tips: number;
  };
}

interface TaxSummaryData {
  /** Location */
  location: {
    id: string;
    name: string;
  };

  /** Date range */
  dateRange: DateRange;

  /** Tax breakdown by rate */
  taxRates: {
    taxCode: string;
    taxName: string;
    taxRate: number;           // percentage
    taxableAmount: number;     // cents
    taxCollected: number;      // cents
    transactionCount: number;
  }[];

  /** Total tax collected (cents) */
  totalTaxCollected: number;

  /** Total taxable amount (cents) */
  totalTaxableAmount: number;

  /** Exempt transactions */
  exemptTransactions: {
    count: number;
    total: number;             // cents
  };
}
```

### Supporting Types

```typescript
interface DateRange {
  from: Date;
  to: Date;
}

interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

interface RegisterTerminalInput {
  locationId: string;
  name: string;
  type: TerminalType;
  provider: TerminalProvider;
  serialNumber?: string;
  config?: Partial<TerminalConfig>;
}

interface CreateTransactionInput {
  terminalId: string;
  clerkSessionId: string;
  items: AddItemInput[];
  customerId?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

interface AddItemInput {
  productId?: string;
  variantId?: string;
  sku?: string;
  barcode?: string;
  name: string;
  unitPrice: number;          // cents
  quantity: number;
  unitOfMeasure?: string;
  weight?: number;
  taxCode?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

interface DiscountInput {
  type: 'percentage' | 'fixed';
  value: number;               // percentage (0-100) or fixed amount in cents
  reason: string;
  appliesTo: 'transaction' | 'item';
  itemId?: string;             // Required if appliesTo is 'item'
  code?: string;               // Discount/promo code
}

interface CashPaymentResult {
  transaction: Transaction;
  changeGiven: number;         // cents
  roundingApplied: number;     // cents
  cashDrawerOpened: boolean;
}

interface TransactionFilter {
  locationId?: string;
  terminalId?: string;
  clerkId?: string;
  status?: TransactionStatus[];
  type?: TransactionType[];
  dateRange?: DateRange;
  minAmount?: number;
  maxAmount?: number;
  customerId?: string;
  offlineOnly?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: 'createdAt' | 'total' | 'status';
  sortOrder?: 'asc' | 'desc';
}

interface OpenCashSessionInput {
  terminalId: string;
  clerkSessionId: string;
  openingFloat: number;        // cents
  openingCount: CashCount;
  notes?: string;
}

interface ReceiptLookupQuery {
  receiptNumber?: string;
  transactionId?: string;
  customerEmail?: string;
  customerPhone?: string;
  dateRange?: DateRange;
  locationId?: string;
}

interface ReturnRequest {
  originalTransactionId: string;
  items: {
    transactionItemId: string;
    quantity: number;
    reason: string;
  }[];
  refundMethod: 'original_payment' | 'cash' | 'store_credit';
  clerkSessionId: string;
  terminalId: string;
  notes?: string;
}

interface ReturnResult {
  returnTransaction: Transaction;
  refundAmount: number;        // cents
  refundMethod: string;
  providerRefundId: string | null;
  receipt: Receipt;
}

interface ExchangeRequest {
  originalTransactionId: string;
  returnItems: {
    transactionItemId: string;
    quantity: number;
    reason: string;
  }[];
  newItems: AddItemInput[];
  clerkSessionId: string;
  terminalId: string;
  notes?: string;
}

interface ExchangeResult {
  exchangeTransaction: Transaction;
  priceDifference: number;     // cents (positive = customer owes, negative = refund)
  refundAmount: number | null;
  additionalChargeAmount: number | null;
  receipt: Receipt;
}

interface ReportFilter {
  locationId?: string;
  terminalId?: string;
  clerkId?: string;
  type?: POSReportType;
  dateRange?: DateRange;
  page?: number;
  pageSize?: number;
}

interface FirmwareUpdateResult {
  terminalId: string;
  currentVersion: string;
  targetVersion: string;
  status: 'started' | 'no_update_available' | 'already_updating' | 'error';
  estimatedDurationMs: number | null;
  error: string | null;
}

interface OfflineQueueStatus {
  terminalId: string;
  queueSize: number;
  maxSize: number;
  pendingCount: number;
  conflictCount: number;
  isSyncing: boolean;
  lastSyncAt: Date | null;
  oldestPendingAt: Date | null;
}

interface CustomerDisplayMessage {
  /** Message type */
  type: 'line_item' | 'subtotal' | 'total' | 'welcome' | 'thank_you' | 'custom';

  /** Primary text (e.g., item name) */
  primaryText: string;

  /** Secondary text (e.g., price) */
  secondaryText?: string;

  /** Full line items (for itemized display) */
  lineItems?: {
    name: string;
    quantity: number;
    price: number;
  }[];

  /** Running total (cents) */
  runningTotal?: number;

  /** Clear display before showing */
  clear?: boolean;
}

interface ScaleReading {
  /** Weight value */
  weight: number;

  /** Unit of measure */
  unit: 'g' | 'kg' | 'oz' | 'lb';

  /** Whether the reading is stable */
  stable: boolean;

  /** Timestamp */
  readAt: Date;
}

interface BarcodeFormat {
  type: 'ean13' | 'ean8' | 'upc_a' | 'upc_e' | 'code128' | 'code39' | 'qr' | 'datamatrix' | 'pdf417';
}

interface ScanResult {
  /** Raw barcode value */
  barcode: string;

  /** Detected format */
  format: BarcodeFormat;

  /** Matched product (null if not found) */
  product: {
    productId: string;
    variantId: string | null;
    name: string;
    sku: string;
    price: number;           // cents
    inStock: boolean;
    stockQuantity: number;
    taxCode: string | null;
    imageUrl: string | null;
  } | null;

  /** Whether the barcode was found in the catalog */
  found: boolean;
}

interface LocationPricing {
  locationId: string;
  productId: string;
  variantId: string | null;
  overridePrice: number | null;   // cents, null = use default price
  overrideTaxCode: string | null;
  effectiveFrom: Date;
  effectiveTo: Date | null;
}

interface StockTransfer {
  id: string;
  tenantId: string;
  fromLocationId: string;
  toLocationId: string;
  items: {
    productId: string;
    variantId: string | null;
    quantity: number;
  }[];
  status: 'pending' | 'in_transit' | 'received' | 'cancelled';
  initiatedByClerkId: string;
  createdAt: Date;
  completedAt: Date | null;
}

interface HardwareDeviceInfo {
  id: string;
  type: 'printer' | 'scanner' | 'cash_drawer' | 'customer_display' | 'scale';
  name: string;
  manufacturer: string;
  model: string;
  connectionType: 'usb' | 'bluetooth' | 'network' | 'serial';
  connectionAddress: string;       // IP, serial port, BT address, etc.
  status: 'connected' | 'disconnected' | 'error';
  firmwareVersion: string | null;
  lastSeenAt: Date | null;
}
```

---

## Database Schemas

All tables are tenant-scoped with Row-Level Security (RLS) policies ensuring complete isolation between tenants. The `tenant_id` column is present on every table and is automatically filtered by the RLS policy based on the authenticated session's tenant context.

### terminals

Stores registered payment terminals.

```typescript
import { pgTable, uuid, text, varchar, timestamp, boolean, integer, jsonb, index } from 'drizzle-orm/pg-core';

export const terminals = pgTable('terminals', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  locationId: uuid('location_id').notNull().references(() => locations.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),             // TerminalType
  status: varchar('status', { length: 30 }).notNull().default('registered'), // TerminalStatus
  provider: varchar('provider', { length: 30 }).notNull(),      // TerminalProvider
  providerTerminalId: varchar('provider_terminal_id', { length: 255 }),
  serialNumber: varchar('serial_number', { length: 255 }),
  firmwareVersion: varchar('firmware_version', { length: 50 }),
  ipAddress: varchar('ip_address', { length: 45 }),              // IPv4 or IPv6
  lastHeartbeatAt: timestamp('last_heartbeat_at', { withTimezone: true }),
  config: jsonb('config').notNull().default('{}'),               // TerminalConfig
  offlineEnabled: boolean('offline_enabled').notNull().default(true),
  offlineMaxAmount: integer('offline_max_amount').notNull().default(50000), // $500 in cents
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  pairedAt: timestamp('paired_at', { withTimezone: true }),
}, (table) => ({
  tenantIdx: index('terminals_tenant_idx').on(table.tenantId),
  locationIdx: index('terminals_location_idx').on(table.tenantId, table.locationId),
  providerTerminalIdx: index('terminals_provider_terminal_idx').on(table.providerTerminalId),
  statusIdx: index('terminals_status_idx').on(table.tenantId, table.status),
}));
```

**RLS Policy:**

```sql
CREATE POLICY terminals_tenant_isolation ON terminals
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY terminals_insert ON terminals
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY terminals_update ON terminals
  FOR UPDATE USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY terminals_delete ON terminals
  FOR DELETE USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

### pos_transactions

Stores all POS transactions (sales, returns, exchanges, voids).

```typescript
export const posTransactions = pgTable('pos_transactions', {
  id: uuid('id').primaryKey(),                                   // Client-generated for idempotency
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  locationId: uuid('location_id').notNull().references(() => locations.id),
  terminalId: uuid('terminal_id').notNull().references(() => terminals.id),
  clerkId: uuid('clerk_id').notNull(),
  clerkSessionId: uuid('clerk_session_id').notNull().references(() => clerkSessions.id),
  cashSessionId: uuid('cash_session_id').references(() => cashSessions.id),
  status: varchar('status', { length: 30 }).notNull().default('created'),
  type: varchar('type', { length: 20 }).notNull().default('sale'),
  subtotal: integer('subtotal').notNull().default(0),            // cents
  discountTotal: integer('discount_total').notNull().default(0),
  taxTotal: integer('tax_total').notNull().default(0),
  tipAmount: integer('tip_amount').notNull().default(0),
  roundingAdjustment: integer('rounding_adjustment').notNull().default(0),
  total: integer('total').notNull().default(0),
  payments: jsonb('payments').notNull().default('[]'),           // PaymentMethod[]
  cashTendered: integer('cash_tendered'),
  changeGiven: integer('change_given'),
  providerPaymentId: varchar('provider_payment_id', { length: 255 }),
  cardBrand: varchar('card_brand', { length: 30 }),
  cardLast4: varchar('card_last4', { length: 4 }),
  cardEntryMethod: varchar('card_entry_method', { length: 20 }),
  receiptId: uuid('receipt_id'),
  originalTransactionId: uuid('original_transaction_id').references(() => posTransactions.id),
  offlineCreated: boolean('offline_created').notNull().default(false),
  syncedAt: timestamp('synced_at', { withTimezone: true }),
  customerId: uuid('customer_id'),
  customerEmail: varchar('customer_email', { length: 255 }),
  customerPhone: varchar('customer_phone', { length: 30 }),
  notes: text('notes'),
  metadata: jsonb('metadata').notNull().default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  voidedAt: timestamp('voided_at', { withTimezone: true }),
}, (table) => ({
  tenantIdx: index('pos_txn_tenant_idx').on(table.tenantId),
  locationIdx: index('pos_txn_location_idx').on(table.tenantId, table.locationId),
  terminalIdx: index('pos_txn_terminal_idx').on(table.tenantId, table.terminalId),
  clerkIdx: index('pos_txn_clerk_idx').on(table.tenantId, table.clerkId),
  statusIdx: index('pos_txn_status_idx').on(table.tenantId, table.status),
  createdAtIdx: index('pos_txn_created_at_idx').on(table.tenantId, table.createdAt),
  providerPaymentIdx: index('pos_txn_provider_payment_idx').on(table.providerPaymentId),
  offlineIdx: index('pos_txn_offline_idx').on(table.tenantId, table.offlineCreated),
  customerIdx: index('pos_txn_customer_idx').on(table.tenantId, table.customerId),
  originalTxnIdx: index('pos_txn_original_txn_idx').on(table.originalTransactionId),
}));
```

### pos_transaction_items

Stores line items for each transaction.

```typescript
export const posTransactionItems = pgTable('pos_transaction_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  transactionId: uuid('transaction_id').notNull().references(() => posTransactions.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  productId: uuid('product_id'),
  variantId: uuid('variant_id'),
  sku: varchar('sku', { length: 100 }),
  barcode: varchar('barcode', { length: 100 }),
  name: varchar('name', { length: 500 }).notNull(),
  unitPrice: integer('unit_price').notNull(),                     // cents
  quantity: integer('quantity').notNull().default(1),
  unitOfMeasure: varchar('unit_of_measure', { length: 20 }),
  weight: integer('weight'),                                      // grams (for scale items)
  discount: integer('discount').notNull().default(0),             // cents
  tax: integer('tax').notNull().default(0),                       // cents
  taxRate: integer('tax_rate').notNull().default(0),              // basis points (1300 = 13%)
  taxCode: varchar('tax_code', { length: 50 }),
  lineTotal: integer('line_total').notNull(),                     // cents
  isReturn: boolean('is_return').notNull().default(false),
  notes: text('notes'),
  metadata: jsonb('metadata').notNull().default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  transactionIdx: index('pos_txn_items_txn_idx').on(table.transactionId),
  tenantIdx: index('pos_txn_items_tenant_idx').on(table.tenantId),
  productIdx: index('pos_txn_items_product_idx').on(table.tenantId, table.productId),
  skuIdx: index('pos_txn_items_sku_idx').on(table.tenantId, table.sku),
  barcodeIdx: index('pos_txn_items_barcode_idx').on(table.tenantId, table.barcode),
}));
```

### cash_sessions

Stores cash drawer sessions.

```typescript
export const cashSessions = pgTable('cash_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  locationId: uuid('location_id').notNull().references(() => locations.id),
  terminalId: uuid('terminal_id').notNull().references(() => terminals.id),
  openedByClerkId: uuid('opened_by_clerk_id').notNull(),
  closedByClerkId: uuid('closed_by_clerk_id'),
  status: varchar('status', { length: 20 }).notNull().default('open'),
  openingFloat: integer('opening_float').notNull(),               // cents
  openingCount: jsonb('opening_count').notNull(),                 // CashCount
  expectedCash: integer('expected_cash').notNull().default(0),    // cents
  actualCash: integer('actual_cash'),                             // cents
  closingCount: jsonb('closing_count'),                           // CashCount
  variance: integer('variance'),                                  // cents
  drops: jsonb('drops').notNull().default('[]'),                  // CashMovement[]
  pickups: jsonb('pickups').notNull().default('[]'),              // CashMovement[]
  transactionCount: integer('transaction_count').notNull().default(0),
  totalCashReceived: integer('total_cash_received').notNull().default(0),
  totalChangeGiven: integer('total_change_given').notNull().default(0),
  totalCashRefunds: integer('total_cash_refunds').notNull().default(0),
  notes: text('notes'),
  openedAt: timestamp('opened_at', { withTimezone: true }).notNull().defaultNow(),
  closedAt: timestamp('closed_at', { withTimezone: true }),
}, (table) => ({
  tenantIdx: index('cash_sessions_tenant_idx').on(table.tenantId),
  terminalIdx: index('cash_sessions_terminal_idx').on(table.tenantId, table.terminalId),
  statusIdx: index('cash_sessions_status_idx').on(table.tenantId, table.status),
  openedAtIdx: index('cash_sessions_opened_at_idx').on(table.tenantId, table.openedAt),
}));
```

### clerk_sessions

Stores clerk login sessions on terminals.

```typescript
export const clerkSessions = pgTable('clerk_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  clerkId: uuid('clerk_id').notNull(),
  clerkName: varchar('clerk_name', { length: 255 }).notNull(),
  terminalId: uuid('terminal_id').notNull().references(() => terminals.id),
  locationId: uuid('location_id').notNull().references(() => locations.id),
  permissionLevel: varchar('permission_level', { length: 20 }).notNull().default('cashier'),
  isActive: boolean('is_active').notNull().default(true),
  transactionCount: integer('transaction_count').notNull().default(0),
  totalSales: integer('total_sales').notNull().default(0),        // cents
  totalReturns: integer('total_returns').notNull().default(0),    // cents
  authMethod: varchar('auth_method', { length: 20 }).notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  lastActivityAt: timestamp('last_activity_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('clerk_sessions_tenant_idx').on(table.tenantId),
  clerkIdx: index('clerk_sessions_clerk_idx').on(table.tenantId, table.clerkId),
  terminalIdx: index('clerk_sessions_terminal_idx').on(table.tenantId, table.terminalId),
  activeIdx: index('clerk_sessions_active_idx').on(table.tenantId, table.isActive),
  startedAtIdx: index('clerk_sessions_started_at_idx').on(table.tenantId, table.startedAt),
}));
```

### offline_queue

Stores offline transactions pending sync.

```typescript
export const offlineQueue = pgTable('offline_queue', {
  id: uuid('id').primaryKey(),                                    // Client-generated
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  terminalId: uuid('terminal_id').notNull().references(() => terminals.id),
  clerkId: uuid('clerk_id').notNull(),
  type: varchar('type', { length: 30 }).notNull(),                // OfflineEntryType
  payload: jsonb('payload').notNull(),                            // OfflineTransactionPayload
  status: varchar('status', { length: 20 }).notNull().default('queued'),
  idempotencyKey: varchar('idempotency_key', { length: 100 }).notNull().unique(),
  catalogSnapshotVersion: varchar('catalog_snapshot_version', { length: 50 }).notNull(),
  syncAttempts: integer('sync_attempts').notNull().default(0),
  lastSyncError: text('last_sync_error'),
  conflictDetails: jsonb('conflict_details'),                     // ConflictDetail[]
  resolution: jsonb('resolution'),                                // ConflictResolution
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  syncedAt: timestamp('synced_at', { withTimezone: true }),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
}, (table) => ({
  tenantIdx: index('offline_queue_tenant_idx').on(table.tenantId),
  terminalIdx: index('offline_queue_terminal_idx').on(table.tenantId, table.terminalId),
  statusIdx: index('offline_queue_status_idx').on(table.tenantId, table.status),
  createdAtIdx: index('offline_queue_created_at_idx').on(table.tenantId, table.createdAt),
  idempotencyIdx: index('offline_queue_idempotency_idx').on(table.idempotencyKey),
}));
```

### pos_receipts

Stores generated receipts.

```typescript
export const posReceipts = pgTable('pos_receipts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  transactionId: uuid('transaction_id').notNull().references(() => posTransactions.id),
  receiptNumber: varchar('receipt_number', { length: 50 }).notNull(),
  format: varchar('format', { length: 20 }).notNull(),
  content: text('content').notNull(),
  escposData: text('escpos_data'),                                // base64 encoded
  htmlContent: text('html_content'),
  textContent: text('text_content'),
  pdfUrl: varchar('pdf_url', { length: 1000 }),
  templateId: uuid('template_id').notNull(),
  deliveries: jsonb('deliveries').notNull().default('[]'),        // ReceiptDelivery[]
  offlineGenerated: boolean('offline_generated').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('pos_receipts_tenant_idx').on(table.tenantId),
  transactionIdx: index('pos_receipts_txn_idx').on(table.transactionId),
  receiptNumberIdx: index('pos_receipts_number_idx').on(table.tenantId, table.receiptNumber),
}));
```

### terminal_events

Stores terminal lifecycle events and audit trail.

```typescript
export const terminalEvents = pgTable('terminal_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  terminalId: uuid('terminal_id').notNull().references(() => terminals.id, { onDelete: 'cascade' }),
  eventType: varchar('event_type', { length: 50 }).notNull(),     // see EventType below
  severity: varchar('severity', { length: 10 }).notNull().default('info'),
  message: text('message').notNull(),
  details: jsonb('details').notNull().default('{}'),
  clerkId: uuid('clerk_id'),
  transactionId: uuid('transaction_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('terminal_events_tenant_idx').on(table.tenantId),
  terminalIdx: index('terminal_events_terminal_idx').on(table.tenantId, table.terminalId),
  eventTypeIdx: index('terminal_events_type_idx').on(table.tenantId, table.eventType),
  createdAtIdx: index('terminal_events_created_at_idx').on(table.tenantId, table.createdAt),
  severityIdx: index('terminal_events_severity_idx').on(table.tenantId, table.severity),
}));

/**
 * Terminal event types:
 * - registered          Terminal registered in system
 * - paired              Terminal successfully paired
 * - unpaired            Terminal unpaired
 * - online              Terminal came online (heartbeat received)
 * - offline             Terminal went offline (heartbeat missed)
 * - firmware_update     Firmware update started/completed/failed
 * - transaction_start   Transaction processing started
 * - transaction_complete Transaction completed
 * - transaction_fail    Transaction failed
 * - transaction_void    Transaction voided
 * - clerk_login         Clerk logged in
 * - clerk_logout        Clerk logged out
 * - cash_session_open   Cash session opened
 * - cash_session_close  Cash session closed
 * - cash_variance       Cash variance detected
 * - offline_mode_enter  Terminal entered offline mode
 * - offline_mode_exit   Terminal exited offline mode
 * - sync_start          Offline sync started
 * - sync_complete       Offline sync completed
 * - sync_conflict       Sync conflict detected
 * - hardware_connect    Hardware device connected
 * - hardware_disconnect Hardware device disconnected
 * - hardware_error      Hardware device error
 * - config_change       Terminal configuration changed
 * - error               General error
 */
```

---

## Code Examples

### 1. Register and Pair a Terminal

Register a new Stripe Terminal WisePOS E device at a location and pair it using the connection token flow.

```typescript
import { POSService } from '@mcv/commerce/pos';

// 1. Register the terminal in MCV
const terminal = await posService.registerTerminal({
  locationId: 'loc_downtown_store',
  name: 'Register 1 - Main Counter',
  type: 'stripe_wisePosE',
  provider: 'stripe',
  serialNumber: 'WSP-E-2024-001234',
  config: {
    tipsEnabled: true,
    tipPercentages: [15, 18, 20],
    customTipAllowed: true,
    currency: 'CAD',
    locale: 'en-CA',
    cashRoundingRule: 'nearest_5_cents',     // Canadian penny rounding
    autoPrintReceipt: true,
    autoSendDigitalReceipt: false,
    paymentTimeoutSeconds: 120,
    maxOfflineQueueSize: 500,
  },
});

console.log(`Terminal registered: ${terminal.id}`);
// Terminal registered: 7f3a8b2c-1d4e-5f6a-7b8c-9d0e1f2a3b4c
console.log(`Status: ${terminal.status}`);
// Status: registered

// 2. Initiate pairing — the terminal will display a pairing code
//    In a real flow, the Stripe Terminal SDK on the POS client handles
//    the discovery and pairing. The backend coordinates via connection tokens.
const paired = await posService.pairTerminal(
  terminal.id,
  'simulated-pairing-code-abc123'
);

console.log(`Status after pairing: ${paired.status}`);
// Status after pairing: online
console.log(`Provider terminal ID: ${paired.providerTerminalId}`);
// Provider terminal ID: tmr_FGhIjKlMnOpQ

// 3. Verify the terminal is online via heartbeat
const status = await posService.getTerminalStatus(terminal.id);
console.log(`Heartbeat status: ${status}`);
// Heartbeat status: online

// 4. List all terminals at this location
const terminals = await posService.listTerminals('loc_downtown_store');
console.log(`Terminals at location: ${terminals.length}`);
// Terminals at location: 3
terminals.forEach(t => {
  console.log(`  ${t.name} — ${t.status} — ${t.type}`);
});
// Register 1 - Main Counter — online — stripe_wisePosE
// Register 2 - Side Counter — online — stripe_wisePosE
// Kitchen Display — offline — virtual
```

### 2. Process a Card-Present Payment

Create a transaction with line items, prompt for tip, and collect a contactless card payment.

```typescript
import { POSService } from '@mcv/commerce/pos';

// Clerk is already logged in — we have their session
const clerkSession = await posService.getActiveClerkSession('terminal_001');

// 1. Create the transaction with items
const transaction = await posService.createTransaction({
  terminalId: 'terminal_001',
  clerkSessionId: clerkSession!.id,
  items: [
    {
      productId: 'prod_espresso',
      name: 'Double Espresso',
      unitPrice: 450,             // $4.50
      quantity: 2,
      taxCode: 'food_prepared',
    },
    {
      productId: 'prod_croissant',
      name: 'Butter Croissant',
      unitPrice: 375,             // $3.75
      quantity: 1,
      taxCode: 'food_prepared',
    },
  ],
  customerEmail: 'coffee.lover@example.com',
});

console.log(`Transaction created: ${transaction.id}`);
console.log(`Subtotal: $${(transaction.subtotal / 100).toFixed(2)}`);
// Subtotal: $12.75
console.log(`Tax (13% HST): $${(transaction.taxTotal / 100).toFixed(2)}`);
// Tax (13% HST): $1.66
console.log(`Total: $${(transaction.total / 100).toFixed(2)}`);
// Total: $14.41

// 2. Customer wants to add a tip
const withTip = await posService.addTip(transaction.id, 300); // $3.00 tip
console.log(`Total with tip: $${(withTip.total / 100).toFixed(2)}`);
// Total with tip: $17.41

// 3. Process card payment — this triggers the terminal to show
//    "Tap, Insert, or Swipe" on the customer-facing display
const completed = await posService.processCardPayment(
  transaction.id,
  'terminal_001'
);

console.log(`Status: ${completed.status}`);
// Status: completed
console.log(`Card: ${completed.cardBrand} ****${completed.cardLast4}`);
// Card: visa ****4242
console.log(`Entry method: ${completed.cardEntryMethod}`);
// Entry method: contactless
console.log(`Stripe PI: ${completed.providerPaymentId}`);
// Stripe PI: pi_3ABC123DEF456GHI

// 4. Auto-print receipt (config says autoPrintReceipt: true)
// Receipt is automatically sent to the thermal printer.
// Also send digital receipt to the customer's email.
await posService.sendDigitalReceipt(
  transaction.id,
  'email',
  'coffee.lover@example.com'
);
console.log('Digital receipt sent to email');

// 5. Update customer-facing display
await posService.updateCustomerDisplay('terminal_001', {
  type: 'thank_you',
  primaryText: 'Thank you!',
  secondaryText: 'See you next time',
  clear: true,
});
```

### 3. Handle a Cash Transaction with Change

Process a cash payment, calculate change with Canadian penny rounding, and open the cash drawer.

```typescript
import { POSService } from '@mcv/commerce/pos';

const clerkSession = await posService.getActiveClerkSession('terminal_002');

// 1. Create transaction
const transaction = await posService.createTransaction({
  terminalId: 'terminal_002',
  clerkSessionId: clerkSession!.id,
  items: [
    {
      productId: 'prod_novel',
      name: 'The Great Gatsby — Paperback',
      unitPrice: 1499,           // $14.99
      quantity: 1,
      taxCode: 'book_printed',   // Books are taxed differently in some jurisdictions
    },
    {
      productId: 'prod_bookmark',
      name: 'Leather Bookmark',
      unitPrice: 599,            // $5.99
      quantity: 2,
      taxCode: 'general',
    },
  ],
});

console.log(`Subtotal: $${(transaction.subtotal / 100).toFixed(2)}`);
// Subtotal: $26.97
console.log(`Tax: $${(transaction.taxTotal / 100).toFixed(2)}`);
// Tax: $3.51
console.log(`Total: $${(transaction.total / 100).toFixed(2)}`);
// Total: $30.48

// 2. Process cash payment — customer hands over $40.00
const result = await posService.processCashPayment(
  transaction.id,
  4000  // $40.00 tendered
);

// Canadian penny rounding applies:
// $30.48 rounds to $30.50 (nearest 5 cents)
// Rounding adjustment: +$0.02
// Change: $40.00 - $30.50 = $9.50
console.log(`Rounding adjustment: $${(result.roundingApplied / 100).toFixed(2)}`);
// Rounding adjustment: $0.02
console.log(`Change to give: $${(result.changeGiven / 100).toFixed(2)}`);
// Change to give: $9.50
console.log(`Cash drawer opened: ${result.cashDrawerOpened}`);
// Cash drawer opened: true

// The cash session's expectedCash is automatically updated:
// expectedCash += (cashTendered - changeGiven) = $40.00 - $9.50 = $30.50
const cashSession = await posService.getActiveCashSession('terminal_002');
console.log(`Expected cash in drawer: $${(cashSession!.expectedCash / 100).toFixed(2)}`);
// Expected cash in drawer: $230.50 (opening float + today's cash sales)
```

### 4. Open and Close a Cash Float

Manage the full lifecycle of a cash drawer session: open with a counted float, process transactions, then close with a reconciliation count.

```typescript
import { POSService } from '@mcv/commerce/pos';

const clerkSession = await posService.getActiveClerkSession('terminal_001');

// 1. Open a cash session with a $200 float
const session = await posService.openCashSession({
  terminalId: 'terminal_001',
  clerkSessionId: clerkSession!.id,
  openingFloat: 20000,          // $200.00
  openingCount: {
    denominations: {
      '10000': 1,    // 1x $100 bill
      '2000': 3,     // 3x $20 bills
      '1000': 2,     // 2x $10 bills
      '500': 2,      // 2x $5 bills
      '200': 5,      // 5x $2 coins (toonies)
      '100': 5,      // 5x $1 coins (loonies)
      '25': 20,      // 20x quarters
    },
    total: 20000,
    countedAt: new Date(),
    countedByClerkId: clerkSession!.clerkId,
  },
  notes: 'Morning shift opening',
});

console.log(`Cash session opened: ${session.id}`);
console.log(`Opening float: $${(session.openingFloat / 100).toFixed(2)}`);
// Opening float: $200.00

// ... Many transactions happen throughout the day ...

// 2. Mid-shift safe drop — remove excess cash from the drawer
const afterDrop = await posService.recordCashDrop(
  session.id,
  30000,              // $300.00 drop to the safe
  'Excess cash — drawer getting full'
);
console.log(`Cash drop recorded. Drops total: $${
  (afterDrop.drops.reduce((sum, d) => sum + d.amount, 0) / 100).toFixed(2)
}`);
// Cash drop recorded. Drops total: $300.00

// 3. End of shift — close with a count
const closedSession = await posService.closeCashSession(session.id, {
  denominations: {
    '10000': 2,    // 2x $100 bills
    '5000': 1,     // 1x $50 bill
    '2000': 4,     // 4x $20 bills
    '1000': 3,     // 3x $10 bills
    '500': 5,      // 5x $5 bills
    '200': 8,      // 8x $2 coins
    '100': 12,     // 12x $1 coins
    '25': 24,      // 24x quarters
    '10': 15,      // 15x dimes
    '5': 10,       // 10x nickels
  },
  total: 46350,                 // $463.50 counted
  countedAt: new Date(),
  countedByClerkId: clerkSession!.clerkId,
});

console.log(`Session closed`);
console.log(`Expected cash: $${(closedSession.expectedCash / 100).toFixed(2)}`);
// Expected cash: $463.50  (opening float + cash sales - change given - drops + pickups)
console.log(`Actual cash: $${(closedSession.actualCash! / 100).toFixed(2)}`);
// Actual cash: $463.50
console.log(`Variance: $${(closedSession.variance! / 100).toFixed(2)}`);
// Variance: $0.00  (perfect count!)
console.log(`Status: ${closedSession.status}`);
// Status: closed

// If there were a variance:
// Variance: -$2.50 (short $2.50)
// Status: closed  (under threshold, auto-accepted)
// OR
// Variance: -$25.00 (short $25.00)
// Status: disputed (over threshold, requires manager review)
```

### 5. Offline Transaction Queuing and Sync

Demonstrate what happens when the network goes down during business hours: transactions queue locally and sync when connectivity returns.

```typescript
import {
  POSService,
  ConnectivityMonitor,
  OfflineQueueManager,
  OfflineSyncEngine,
} from '@mcv/commerce/pos';

// The ConnectivityMonitor runs continuously on the POS client
const connectivity = new ConnectivityMonitor({
  pingUrl: 'https://api.mcv.one/health',
  pingIntervalMs: 5000,
  offlineThreshold: 3,   // 3 consecutive failures = offline
});

connectivity.on('offline', () => {
  console.warn('⚠️ Network lost — entering offline mode');
  // The POS UI shows an "OFFLINE" banner
  // All new transactions go to the offline queue
});

connectivity.on('online', async () => {
  console.log('✅ Network restored — starting sync');
  // Trigger offline queue sync
  const result = await syncEngine.syncAll('terminal_001');
  console.log(`Synced ${result.successCount}/${result.totalProcessed} transactions`);

  if (result.conflictCount > 0) {
    console.warn(`⚠️ ${result.conflictCount} conflicts need manager review`);
  }
});

// --- Scenario: Network goes down ---

// Customer 1 pays cash — this works fine offline
const offlineEntry1: OfflineQueueEntry = {
  id: crypto.randomUUID(),
  tenantId: 'tenant_abc',
  terminalId: 'terminal_001',
  clerkId: 'clerk_jane',
  type: 'sale',
  payload: {
    transaction: {
      tenantId: 'tenant_abc',
      locationId: 'loc_downtown',
      terminalId: 'terminal_001',
      clerkId: 'clerk_jane',
      clerkSessionId: 'session_xyz',
      cashSessionId: 'cash_session_123',
      status: 'cash_accepted',
      type: 'sale',
      items: [],
      subtotal: 2500,
      discountTotal: 0,
      taxTotal: 325,
      tipAmount: 0,
      roundingAdjustment: 0,
      total: 2825,
      payments: [{ type: 'cash', amount: 2825, processedAt: new Date(), providerPaymentId: null, cardBrand: null, cardLast4: null, cardEntryMethod: null }],
      cashTendered: 3000,
      changeGiven: 175,
      providerPaymentId: null,
      cardBrand: null,
      cardLast4: null,
      cardEntryMethod: null,
      receiptId: null,
      originalTransactionId: null,
      offlineCreated: true,
      syncedAt: null,
      customerId: null,
      customerEmail: null,
      customerPhone: null,
      notes: null,
      metadata: {},
      completedAt: new Date(),
      voidedAt: null,
    },
    items: [
      {
        productId: 'prod_sandwich',
        variantId: null,
        sku: 'SAND-001',
        barcode: '0123456789012',
        name: 'Turkey Club Sandwich',
        unitPrice: 1250,
        quantity: 2,
        unitOfMeasure: null,
        weight: null,
        discount: 0,
        tax: 325,
        taxRate: 1300,
        taxCode: 'food_prepared',
        lineTotal: 2825,
        isReturn: false,
        notes: null,
        metadata: {},
      },
    ],
    payment: {
      type: 'cash',
      amount: 2825,
      cashTendered: 3000,
    },
    receiptData: {
      templateId: 'tmpl_default',
      headerHtml: '<h2>Downtown Deli</h2><p>123 Main St</p>',
      footerHtml: '<p>Thank you! Come again!</p>',
    },
  },
  status: 'queued',
  idempotencyKey: crypto.randomUUID(),
  catalogSnapshotVersion: 'snap_2026-02-08_001',
  syncAttempts: 0,
  lastSyncError: null,
  conflictDetails: null,
  resolution: null,
  createdAt: new Date(),
  syncedAt: null,
  resolvedAt: null,
};

await offlineQueueManager.enqueue(offlineEntry1);
console.log('Offline transaction queued');

// Print receipt locally (offline)
// The receipt prints with a "PENDING SYNC" watermark
await receiptGenerator.printOfflineReceipt(offlineEntry1);
console.log('Offline receipt printed');

// Check queue status
const queueStatus = await offlineQueueManager.getStatus('terminal_001');
console.log(`Queue: ${queueStatus.pendingCount} pending, ${queueStatus.size}/${queueStatus.maxSize} capacity`);
// Queue: 1 pending, 1/500 capacity

// --- Later: Network comes back ---

// The sync engine processes entries in chronological order
const syncResult = await syncEngine.syncAll('terminal_001');
console.log(`Sync complete:`);
console.log(`  Processed: ${syncResult.totalProcessed}`);
console.log(`  Success: ${syncResult.successCount}`);
console.log(`  Conflicts: ${syncResult.conflictCount}`);
console.log(`  Failed: ${syncResult.failureCount}`);
console.log(`  Duration: ${syncResult.durationMs}ms`);
// Sync complete:
//   Processed: 1
//   Success: 1
//   Conflicts: 0
//   Failed: 0
//   Duration: 342ms
```

### 6. Clerk Shift Management

Authenticate clerks, manage their sessions, and track performance.

```typescript
import { POSService } from '@mcv/commerce/pos';

// 1. Clerk logs in with PIN at the start of their shift
const session = await posService.authenticateClerk({
  method: 'pin',
  terminalId: 'terminal_001',
  pin: '4829',
});

console.log(`Welcome, ${session.clerkName}!`);
// Welcome, Jane Smith!
console.log(`Permission level: ${session.permissionLevel}`);
// Permission level: senior
console.log(`Session started: ${session.startedAt.toISOString()}`);

// 2. Another clerk tries to log in with NFC badge
const session2 = await posService.authenticateClerk({
  method: 'badge',
  terminalId: 'terminal_002',
  badgeId: 'NFC-BADGE-00042',
});

console.log(`Welcome, ${session2.clerkName}!`);
// Welcome, Mike Johnson!
console.log(`Permission level: ${session2.permissionLevel}`);
// Permission level: cashier

// 3. Cashier Mike tries to process a return over $50
// (cashier level can only do returns up to $50)
try {
  await posService.initiateReturn({
    originalTransactionId: 'txn_original_123',
    items: [{ transactionItemId: 'item_1', quantity: 1, reason: 'Defective' }],
    refundMethod: 'original_payment',
    clerkSessionId: session2.id,    // Mike's session (cashier)
    terminalId: 'terminal_002',
  });
} catch (error) {
  console.error(error.code);
  // POS_INSUFFICIENT_PERMISSION
  console.error(error.message);
  // Clerk 'cashier' level cannot process returns over $50.00. Required: 'senior' or above.
}

// 4. Manager override — Jane (senior) processes the return instead
const returnResult = await posService.initiateReturn({
  originalTransactionId: 'txn_original_123',
  items: [{ transactionItemId: 'item_1', quantity: 1, reason: 'Defective' }],
  refundMethod: 'original_payment',
  clerkSessionId: session.id,     // Jane's session (senior)
  terminalId: 'terminal_001',
});

console.log(`Return processed: $${(returnResult.refundAmount / 100).toFixed(2)}`);
// Return processed: $89.99

// 5. End of shift — check stats
const stats = await posService.getClerkSalesStats(session.clerkId, {
  from: new Date('2026-02-08T00:00:00'),
  to: new Date('2026-02-08T23:59:59'),
});

console.log(`Jane's daily stats:`);
console.log(`  Transactions: ${stats.totalTransactions}`);
console.log(`  Gross sales: $${(stats.totalSales / 100).toFixed(2)}`);
console.log(`  Returns: $${(stats.totalReturns / 100).toFixed(2)}`);
console.log(`  Net sales: $${(stats.netSales / 100).toFixed(2)}`);
console.log(`  Tips: $${(stats.totalTips / 100).toFixed(2)}`);
console.log(`  Txns/hour: ${stats.transactionsPerHour.toFixed(1)}`);
// Jane's daily stats:
//   Transactions: 47
//   Gross sales: $3,842.50
//   Returns: $89.99
//   Net sales: $3,752.51
//   Tips: $412.00
//   Txns/hour: 5.9

// 6. End clerk session
const ended = await posService.endClerkSession(session.id);
console.log(`Session ended at ${ended.endedAt!.toISOString()}`);
console.log(`Total transactions in session: ${ended.transactionCount}`);
// Session ended at 2026-02-08T22:15:00.000Z
// Total transactions in session: 47
```

### 7. Process an In-Store Return

Look up a receipt, process a return with refund to the original card, and handle an exchange.

```typescript
import { POSService } from '@mcv/commerce/pos';

const clerkSession = await posService.getActiveClerkSession('terminal_001');

// 1. Customer has a receipt — look it up by receipt number
const receipts = await posService.lookupReceipt({
  receiptNumber: 'RCP-2026-0208-0042',
});

if (receipts.length === 0) {
  throw new Error('Receipt not found');
}

const receipt = receipts[0];
const originalTxn = await posService.getTransaction(receipt.transactionId);
console.log(`Found original transaction: ${originalTxn!.id}`);
console.log(`Date: ${originalTxn!.createdAt.toISOString()}`);
console.log(`Items:`);
originalTxn!.items.forEach(item => {
  console.log(`  ${item.name} x${item.quantity} — $${(item.lineTotal / 100).toFixed(2)}`);
});
// Found original transaction: txn_abc123
// Date: 2026-02-06T14:30:00.000Z
// Items:
//   Running Shoes (Size 10) x1 — $129.99
//   Athletic Socks (3-pack) x2 — $29.98

// 2. Customer wants to return the shoes (keeping the socks)
const returnResult = await posService.initiateReturn({
  originalTransactionId: originalTxn!.id,
  items: [
    {
      transactionItemId: originalTxn!.items[0].id,  // Running Shoes
      quantity: 1,
      reason: 'Wrong size — customer needs size 11',
    },
  ],
  refundMethod: 'original_payment',    // Refund to original Visa card
  clerkSessionId: clerkSession!.id,
  terminalId: 'terminal_001',
  notes: 'Customer exchanging for size 11',
});

console.log(`Return processed:`);
console.log(`  Refund amount: $${(returnResult.refundAmount / 100).toFixed(2)}`);
console.log(`  Refund method: ${returnResult.refundMethod}`);
console.log(`  Stripe refund: ${returnResult.providerRefundId}`);
// Return processed:
//   Refund amount: $129.99
//   Refund method: original_payment
//   Stripe refund: re_1ABC123DEF456

// 3. Now process the exchange — customer wants size 11 instead
const exchangeResult = await posService.processExchange({
  originalTransactionId: originalTxn!.id,
  returnItems: [
    {
      transactionItemId: originalTxn!.items[0].id,
      quantity: 1,
      reason: 'Wrong size',
    },
  ],
  newItems: [
    {
      productId: 'prod_running_shoes',
      variantId: 'var_size_11',
      name: 'Running Shoes (Size 11)',
      unitPrice: 13999,          // $139.99 (price went up since original purchase!)
      quantity: 1,
      taxCode: 'general',
    },
  ],
  clerkSessionId: clerkSession!.id,
  terminalId: 'terminal_001',
  notes: 'Size exchange 10 → 11',
});

console.log(`Exchange processed:`);
console.log(`  Price difference: $${(exchangeResult.priceDifference / 100).toFixed(2)}`);
// Price difference: $10.00 (new item costs $10 more)
console.log(`  Additional charge: $${(exchangeResult.additionalChargeAmount! / 100).toFixed(2)}`);
// Additional charge: $11.30 (including tax on the difference)

// Customer pays the $11.30 difference — terminal prompts for card tap
```

### 8. Generate End-of-Day Report

Generate a comprehensive end-of-day report for a location.

```typescript
import { POSService } from '@mcv/commerce/pos';

// Generate end-of-day report for the downtown store
const report = await posService.generateEndOfDayReport(
  'loc_downtown_store',
  '2026-02-08'
);

const data = report.data as EndOfDayData;

console.log(`\n${'='.repeat(50)}`);
console.log(`  END OF DAY REPORT`);
console.log(`  ${data.location.name}`);
console.log(`  ${data.date}`);
console.log(`${'='.repeat(50)}\n`);

// === Totals ===
console.log(`TOTALS`);
console.log(`  Gross Sales:      $${(data.totals.grossSales / 100).toLocaleString('en-CA', { minimumFractionDigits: 2 })}`);
console.log(`  Returns:          $${(data.totals.returns / 100).toLocaleString('en-CA', { minimumFractionDigits: 2 })}`);
console.log(`  Net Sales:        $${(data.totals.netSales / 100).toLocaleString('en-CA', { minimumFractionDigits: 2 })}`);
console.log(`  Discounts:        $${(data.totals.discounts / 100).toLocaleString('en-CA', { minimumFractionDigits: 2 })}`);
console.log(`  Tips:             $${(data.totals.tips / 100).toLocaleString('en-CA', { minimumFractionDigits: 2 })}`);
console.log(`  Tax Collected:    $${(data.totals.tax / 100).toLocaleString('en-CA', { minimumFractionDigits: 2 })}`);
console.log(`  Transactions:     ${data.totals.transactionCount}`);
console.log(`  Returns:          ${data.totals.returnCount}`);
console.log(`  Voids:            ${data.totals.voidCount}`);
console.log(`  Avg Txn Value:    $${(data.totals.averageTransactionValue / 100).toFixed(2)}`);
console.log(`  Items Sold:       ${data.totals.itemsSold}`);
console.log(`  Items Returned:   ${data.totals.itemsReturned}`);

// === Payment Methods ===
console.log(`\nPAYMENT METHODS`);
data.paymentMethods.forEach(pm => {
  const bar = '█'.repeat(Math.round(pm.percentage / 2));
  console.log(`  ${pm.type.padEnd(15)} ${pm.count.toString().padStart(4)} txns  $${(pm.total / 100).toFixed(2).padStart(10)}  ${pm.percentage.toFixed(1)}%  ${bar}`);
});
// card_present      142 txns  $12,485.00   72.3%  ████████████████████████████████████
// cash               38 txns  $ 3,120.50   18.1%  █████████
// gift_card          12 txns  $   985.00    5.7%  ███
// store_credit        8 txns  $   680.25    3.9%  ██

// === Hourly Breakdown ===
console.log(`\nSALES BY HOUR`);
data.hourlyBreakdown.forEach(h => {
  const bar = '▓'.repeat(Math.round(h.transactionCount / 2));
  console.log(`  ${h.hour.toString().padStart(2)}:00  ${h.transactionCount.toString().padStart(3)} txns  $${(h.total / 100).toFixed(2).padStart(10)}  ${bar}`);
});
//  09:00    8 txns  $   620.00  ▓▓▓▓
//  10:00   15 txns  $ 1,180.50  ▓▓▓▓▓▓▓▓
//  11:00   22 txns  $ 1,840.00  ▓▓▓▓▓▓▓▓▓▓▓
//  12:00   35 txns  $ 2,950.75  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
//  13:00   28 txns  $ 2,320.00  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓
//  ...

// === Clerk Performance ===
console.log(`\nSALES BY CLERK`);
data.clerkBreakdown.forEach(c => {
  console.log(`  ${c.clerkName.padEnd(20)} ${c.transactionCount.toString().padStart(4)} txns  $${(c.total / 100).toFixed(2).padStart(10)}  Tips: $${(c.tips / 100).toFixed(2)}`);
});
// Jane Smith              47 txns  $ 3,842.50  Tips: $412.00
// Mike Johnson            38 txns  $ 2,985.00  Tips: $286.50
// Sarah Chen              52 txns  $ 4,120.25  Tips: $502.00

// === Cash Session Summary ===
console.log(`\nCASH SESSIONS`);
data.cashSessions.forEach(cs => {
  const variance = cs.variance !== null ? `$${(cs.variance / 100).toFixed(2)}` : 'Open';
  console.log(`  ${cs.clerkName.padEnd(20)} Float: $${(cs.openingFloat / 100).toFixed(2)}  Variance: ${variance}`);
});

// === Offline Stats ===
console.log(`\nOFFLINE SYNC`);
console.log(`  Created offline:     ${data.offlineStats.transactionsCreatedOffline}`);
console.log(`  Synced:              ${data.offlineStats.transactionsSynced}`);
console.log(`  Conflicts:           ${data.offlineStats.transactionsWithConflicts}`);
console.log(`  Pending:             ${data.offlineStats.pendingSync}`);
```

---

## Error Codes

All POS errors extend the base MCV error format with a `code` string, HTTP-compatible `status`, human-readable `message`, and optional `details` object.

| Code | Status | Description |
|------|--------|-------------|
| `POS_TERMINAL_NOT_FOUND` | 404 | Terminal ID does not exist or is not accessible to this tenant. |
| `POS_TERMINAL_OFFLINE` | 503 | Terminal is registered but not responding to heartbeats. Cannot process card payments. |
| `POS_TERMINAL_BUSY` | 409 | Terminal is currently processing another transaction. Wait and retry. |
| `POS_TERMINAL_NOT_PAIRED` | 400 | Terminal has been registered but pairing has not completed. Run the pairing flow first. |
| `POS_TERMINAL_DECOMMISSIONED` | 410 | Terminal has been decommissioned and cannot be used. Register a new terminal. |
| `POS_PAIRING_FAILED` | 400 | Terminal pairing failed. The pairing code may be expired or incorrect. |
| `POS_PAIRING_TIMEOUT` | 408 | Terminal did not respond during the pairing window. Ensure the terminal is powered on and nearby. |
| `POS_TRANSACTION_NOT_FOUND` | 404 | Transaction ID does not exist or is not accessible to this tenant. |
| `POS_TRANSACTION_ALREADY_COMPLETED` | 409 | Cannot modify a transaction that has already been completed. Void or refund instead. |
| `POS_TRANSACTION_ALREADY_VOIDED` | 409 | This transaction has already been voided. |
| `POS_TRANSACTION_VOID_WINDOW_EXPIRED` | 400 | Transactions can only be voided within the configured void window (default: same business day). Use a refund instead. |
| `POS_PAYMENT_DECLINED` | 402 | The card payment was declined by the issuing bank. Ask the customer for an alternative payment method. |
| `POS_PAYMENT_TIMEOUT` | 408 | The customer did not present a card within the configured timeout. The terminal has been reset. |
| `POS_PAYMENT_CAPTURE_FAILED` | 500 | Payment was authorized but capture failed. The hold will auto-release. Retry the payment. |
| `POS_INSUFFICIENT_CASH` | 400 | Cash tendered is less than the transaction total. The customer must provide more cash. |
| `POS_CASH_SESSION_NOT_OPEN` | 400 | No active cash session for this terminal. Open a cash session before processing cash transactions. |
| `POS_CASH_SESSION_ALREADY_OPEN` | 409 | A cash session is already open on this terminal. Close it before opening a new one. |
| `POS_CASH_VARIANCE_EXCEEDED` | 400 | Cash variance exceeds the acceptable threshold. Flagged for manager review. |
| `POS_INSUFFICIENT_PERMISSION` | 403 | The clerk's permission level is insufficient for this operation. A higher-level clerk must perform it. |
| `POS_CLERK_NOT_AUTHENTICATED` | 401 | No active clerk session on this terminal. Clerk must log in first. |
| `POS_CLERK_SESSION_EXPIRED` | 401 | The clerk session has expired due to inactivity. Re-authenticate. |
| `POS_CLERK_PIN_INVALID` | 401 | The PIN entered is incorrect. Verify and try again. |
| `POS_CLERK_BADGE_UNKNOWN` | 401 | The badge ID is not recognized. Ensure the badge is registered in the system. |
| `POS_CLERK_LOCKED_OUT` | 423 | Too many failed authentication attempts. The clerk account is temporarily locked. |
| `POS_OFFLINE_QUEUE_FULL` | 507 | The offline queue has reached its maximum capacity. Cannot queue more transactions until sync completes. |
| `POS_OFFLINE_SYNC_IN_PROGRESS` | 409 | A sync operation is already in progress for this terminal. Wait for it to complete. |
| `POS_OFFLINE_ENTRY_EXPIRED` | 410 | The offline queue entry is too old to process (exceeded the configurable TTL). |
| `POS_OFFLINE_CONFLICT` | 409 | The offline transaction conflicts with current server state. Manual resolution required. |
| `POS_RECEIPT_NOT_FOUND` | 404 | Receipt not found. The receipt number or transaction ID does not match any records. |
| `POS_RECEIPT_DELIVERY_FAILED` | 500 | Receipt delivery (email/SMS) failed. The receipt is still stored and can be re-sent. |
| `POS_PRINTER_NOT_CONNECTED` | 503 | The receipt printer is not connected or not responding. Check hardware connections. |
| `POS_PRINTER_OUT_OF_PAPER` | 503 | The receipt printer is out of paper. Replace the paper roll and retry. |
| `POS_SCANNER_NOT_CONNECTED` | 503 | No barcode scanner detected. Ensure the scanner is connected and powered on. |
| `POS_BARCODE_NOT_FOUND` | 404 | The scanned barcode does not match any product in the catalog. Use quick-add to create it. |
| `POS_RETURN_WINDOW_EXPIRED` | 400 | The return window for this transaction has expired per the venue's return policy. |
| `POS_RETURN_ALREADY_PROCESSED` | 409 | A return has already been processed for these items on this transaction. |
| `POS_RETURN_EXCEEDS_ORIGINAL` | 400 | The return quantity exceeds the original purchase quantity. |
| `POS_ITEM_NOT_IN_STOCK` | 409 | The requested item is not available at this location. Check other locations or backorder. |
| `POS_LOCATION_NOT_FOUND` | 404 | The specified location ID does not exist or is not accessible. |
| `POS_SCALE_NOT_CONNECTED` | 503 | No scale detected. Connect a scale for weight-based items. |
| `POS_SCALE_UNSTABLE` | 400 | Scale reading is not stable. Wait for the reading to settle before proceeding. |
| `POS_CASH_DRAWER_JAMMED` | 503 | Cash drawer failed to open. It may be mechanically jammed. |
| `POS_CUSTOMER_DISPLAY_ERROR` | 503 | Failed to update the customer-facing display. Check the connection. |
| `POS_FIRMWARE_UPDATE_FAILED` | 500 | Terminal firmware update failed. The terminal may need manual intervention. |
| `POS_DUPLICATE_TRANSACTION` | 409 | A transaction with this idempotency key already exists. This is a duplicate request. |
| `POS_SPLIT_PAYMENT_MISMATCH` | 400 | The sum of split payment amounts does not equal the transaction total. |

---

## Security

### Multi-Tenant Isolation

Every table in the POS module includes a `tenant_id` column enforced by PostgreSQL Row-Level Security (RLS) policies. The tenant context is set at the connection level via `SET app.tenant_id = '<uuid>'` before any query executes.

```sql
-- Example RLS policy (applied to every POS table)
ALTER TABLE pos_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY pos_transactions_tenant_isolation ON pos_transactions
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);
```

**Guarantees:**
- A tenant can never read, modify, or delete another tenant's terminals, transactions, or reports.
- Even if a SQL injection were to bypass the application layer, RLS at the database level prevents cross-tenant access.
- Supabase service-role keys bypass RLS; these are only used for system-level operations (migrations, backfills) and are never exposed to client code.

### Terminal Authentication

Terminals authenticate via a multi-layer scheme:

1. **Registration Token** — When a terminal is registered, the backend generates a short-lived registration token. This token is used during the pairing flow.

2. **Connection Token** — After pairing, the Stripe Terminal SDK uses connection tokens issued by the backend. These tokens are scoped to the tenant and location, and rotate automatically.

3. **Heartbeat Authentication** — Heartbeat pings include a terminal-specific HMAC signature to prevent spoofing. A terminal that sends heartbeats with an invalid signature is immediately flagged.

4. **IP Allowlisting** — Optionally, terminals can be restricted to specific IP ranges (useful for fixed installations on a store's local network).

```typescript
// Terminal heartbeat verification
const isValid = terminalHeartbeat.verifySignature({
  terminalId: 'terminal_001',
  timestamp: Date.now(),
  signature: 'hmac-sha256:abc123...',
  secret: terminal.config.heartbeatSecret,
});

if (!isValid) {
  await terminalEvents.log({
    terminalId: 'terminal_001',
    eventType: 'error',
    severity: 'critical',
    message: 'Invalid heartbeat signature — possible spoofing attempt',
  });
}
```

### PCI Compliance

The POS module is designed for **PCI DSS SAQ B-IP** compliance:

- **No card data storage** — Card numbers, CVVs, and magnetic stripe data never touch MCV.ONE servers. The Stripe Terminal SDK handles all sensitive card data directly between the terminal hardware and Stripe's PCI-compliant infrastructure.

- **Tokenization** — After a payment is processed, only a Stripe PaymentIntent ID and the last 4 digits of the card are stored. Full card data is never persisted.

- **Offline card handling** — When a card payment is attempted offline, only a PCI-compliant token (generated by the terminal's secure enclave) is stored in the offline queue. The actual card data remains on the terminal hardware and is never exposed to the application layer.

- **End-to-end encryption** — Communication between the terminal hardware and Stripe uses point-to-point encryption (P2PE). The POS client application cannot read the encrypted card data.

- **No card data in logs** — Application logging explicitly excludes any field that could contain card data. Log sanitization filters strip any string matching card number patterns.

### Staff Access Control

Clerk permissions are enforced at the service layer with a hierarchical model:

| Action | cashier | senior | supervisor | manager | admin |
|--------|---------|--------|------------|---------|-------|
| Process sale | ✅ | ✅ | ✅ | ✅ | ✅ |
| Process cash payment | ✅ | ✅ | ✅ | ✅ | ✅ |
| Apply discount (≤10%) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Apply discount (>10%) | ❌ | ✅ | ✅ | ✅ | ✅ |
| Process return (≤$50) | ❌ | ✅ | ✅ | ✅ | ✅ |
| Process return (>$50) | ❌ | ❌ | ✅ | ✅ | ✅ |
| Void transaction | ❌ | ❌ | ✅ | ✅ | ✅ |
| Open/close cash session | ❌ | ❌ | ✅ | ✅ | ✅ |
| Record cash drop/pickup | ❌ | ❌ | ✅ | ✅ | ✅ |
| View reports | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage terminals | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage clerk accounts | ❌ | ❌ | ❌ | ❌ | ✅ |
| Resolve sync conflicts | ❌ | ❌ | ❌ | ✅ | ✅ |
| Change terminal config | ❌ | ❌ | ❌ | ❌ | ✅ |

**PIN Security:**
- PINs are stored as bcrypt hashes, never in plaintext.
- After 5 failed attempts, the clerk account is locked for 15 minutes.
- PINs must be 4-6 digits and cannot be sequential (1234) or repeated (1111).
- PIN changes require the current PIN or a manager override.

**Badge Security:**
- NFC badge IDs are stored as SHA-256 hashes.
- Lost badges can be instantly deactivated via the admin panel.
- Badge authentication logs include the terminal's NFC reader ID for audit.

### Offline Security

Offline mode introduces unique security considerations:

- **Offline amount limits** — Each terminal has a configurable maximum transaction amount for offline mode (`offlineMaxAmount`, default $500). Transactions exceeding this limit are rejected even offline.

- **Queue TTL** — Offline entries have a time-to-live (default 7 days). Entries older than the TTL are marked as `expired` and require manual processing.

- **Offline clerk verification** — Clerk PINs are cached locally (as bcrypt hashes) for offline authentication. The cache is refreshed whenever the terminal syncs.

- **Encrypted local storage** — The offline queue (IndexedDB/SQLite) is encrypted at rest using a terminal-specific key derived from the pairing process.

- **Tamper detection** — Offline entries include an HMAC signature computed over the transaction data and timestamp. If the signature doesn't match on sync, the entry is flagged for review.

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `POS_STRIPE_SECRET_KEY` | Yes | — | Stripe secret key for payment processing. Must have Terminal permissions. |
| `POS_STRIPE_TERMINAL_LOCATION` | No | — | Default Stripe Terminal location ID. Overridden per-location in config. |
| `POS_STRIPE_WEBHOOK_SECRET` | Yes | — | Stripe webhook signing secret for Terminal events. |
| `POS_SQUARE_ACCESS_TOKEN` | No | — | Square access token (if using Square terminals). |
| `POS_SQUARE_LOCATION_ID` | No | — | Square location ID (if using Square terminals). |
| `POS_DATABASE_URL` | Yes | — | PostgreSQL connection string (Supabase). |
| `POS_HEARTBEAT_INTERVAL_MS` | No | `30000` | How often terminals should send heartbeats (milliseconds). |
| `POS_HEARTBEAT_TIMEOUT_MS` | No | `90000` | How long before a missing heartbeat marks a terminal offline. |
| `POS_OFFLINE_MAX_QUEUE_SIZE` | No | `500` | Maximum number of entries in the offline queue per terminal. |
| `POS_OFFLINE_SYNC_BATCH_SIZE` | No | `10` | Number of offline entries to sync per batch. |
| `POS_OFFLINE_ENTRY_TTL_DAYS` | No | `7` | Time-to-live for offline queue entries. |
| `POS_OFFLINE_MAX_AMOUNT_CENTS` | No | `50000` | Maximum transaction amount (cents) allowed in offline mode. |
| `POS_CASH_VARIANCE_THRESHOLD_CENTS` | No | `1000` | Cash variance threshold (cents) before flagging for manager review. |
| `POS_CLERK_PIN_MAX_ATTEMPTS` | No | `5` | Maximum failed PIN attempts before lockout. |
| `POS_CLERK_LOCKOUT_DURATION_MIN` | No | `15` | Lockout duration (minutes) after max failed PIN attempts. |
| `POS_CLERK_SESSION_TIMEOUT_MIN` | No | `480` | Clerk session inactivity timeout (minutes, default 8 hours). |
| `POS_RECEIPT_EMAIL_FROM` | No | `receipts@mcv.one` | From address for email receipts. |
| `POS_RECEIPT_SMS_FROM` | No | — | From phone number for SMS receipts (Twilio). |
| `POS_TWILIO_ACCOUNT_SID` | No | — | Twilio account SID for SMS receipts. |
| `POS_TWILIO_AUTH_TOKEN` | No | — | Twilio auth token for SMS receipts. |
| `POS_VOID_WINDOW_HOURS` | No | `24` | Hours after transaction creation during which void is allowed. |
| `POS_RETURN_WINDOW_DAYS` | No | `30` | Default return window (days). Overridden per-venue in config. |
| `POS_WEBSOCKET_URL` | No | — | WebSocket gateway URL for real-time terminal events. |
| `POS_ENCRYPTION_KEY` | Yes | — | 256-bit key for encrypting offline queue data at rest. |
| `POS_HMAC_SECRET` | Yes | — | Secret key for HMAC signatures on terminal heartbeats and offline entries. |
| `POS_LOG_LEVEL` | No | `info` | Logging level: `debug`, `info`, `warn`, `error`. |
| `POS_SENTRY_DSN` | No | — | Sentry DSN for error tracking. |

---

## Dependencies

### Internal Dependencies

| Package | Purpose |
|---------|---------|
| `@mcv/core` | Base types, error classes, logging, configuration |
| `@mcv/auth` | Tenant context, session management, RLS setup |
| `@mcv/db` | Drizzle ORM instance, migration utilities, connection pooling |
| `@mcv/commerce/catalog` | Product catalog for SKU lookups and price resolution |
| `@mcv/commerce/inventory` | Inventory tracking and stock adjustments |
| `@mcv/commerce/tax` | Tax rate calculation and tax code resolution |
| `@mcv/commerce/customers` | Customer profile lookup for digital receipts |
| `@mcv/commerce/discounts` | Discount and promotion engine |
| `@mcv/notifications` | Email and SMS delivery for digital receipts |
| `@mcv/realtime` | WebSocket gateway for terminal status events |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@stripe/terminal-js` | `^1.x` | Stripe Terminal JavaScript SDK for POS client |
| `stripe` | `^14.x` | Stripe Node.js SDK for backend PaymentIntent management |
| `drizzle-orm` | `^0.30.x` | ORM for PostgreSQL queries |
| `trpc` | `^10.x` | Type-safe API router |
| `zod` | `^3.x` | Input validation schemas |
| `bcryptjs` | `^2.x` | PIN hashing for clerk authentication |
| `uuid` | `^9.x` | UUID generation for transaction IDs |
| `escpos` | `^3.x` | ESC/POS command encoding for thermal printers |
| `handlebars` | `^4.x` | Receipt template rendering |
| `qrcode` | `^1.x` | QR code generation for receipts |
| `jsbarcode` | `^3.x` | Barcode generation for receipts |
| `@anthropic-ai/sdk` | `^0.x` | (Optional) AI-powered receipt OCR for return lookup |
| `node-hid` | `^3.x` | USB HID interface for barcode scanners and NFC readers |
| `serialport` | `^12.x` | Serial port interface for legacy hardware |
| `ws` | `^8.x` | WebSocket client for real-time events |
| `pino` | `^8.x` | Structured logging |

### Peer Dependencies

| Package | Version | Notes |
|---------|---------|-------|
| `@supabase/supabase-js` | `^2.x` | Supabase client (provided by host application) |
| `react` | `^18.x` | (POS client only) UI framework |
| `react-native` | `^0.73.x` | (Mobile POS only) Mobile framework |

---

## Testing

### Unit Tests

Unit tests cover all business logic in isolation, with mocked database and external service calls.

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CashRounding } from '@mcv/commerce/pos';

describe('CashRounding', () => {
  const rounding = new CashRounding();

  describe('Canadian rounding (nearest 5 cents)', () => {
    it.each([
      [1001, 1000],   // $10.01 → $10.00
      [1002, 1000],   // $10.02 → $10.00
      [1003, 1005],   // $10.03 → $10.05
      [1004, 1005],   // $10.04 → $10.05
      [1005, 1005],   // $10.05 → $10.05 (no change)
      [1006, 1005],   // $10.06 → $10.05
      [1007, 1005],   // $10.07 → $10.05
      [1008, 1010],   // $10.08 → $10.10
      [1009, 1010],   // $10.09 → $10.10
    ])('rounds %i cents to %i cents', (input, expected) => {
      expect(rounding.round(input, 'nearest_5_cents')).toBe(expected);
    });
  });

  describe('no rounding', () => {
    it('returns the original amount', () => {
      expect(rounding.round(1003, 'none')).toBe(1003);
    });
  });
});

describe('PermissionEnforcer', () => {
  const enforcer = new PermissionEnforcer();

  it('allows cashiers to process sales', () => {
    expect(enforcer.canPerform('cashier', 'process_sale')).toBe(true);
  });

  it('blocks cashiers from processing returns', () => {
    expect(enforcer.canPerform('cashier', 'process_return', { amount: 5000 })).toBe(false);
  });

  it('allows seniors to process returns under $50', () => {
    expect(enforcer.canPerform('senior', 'process_return', { amount: 4999 })).toBe(true);
  });

  it('blocks seniors from processing returns over $50', () => {
    expect(enforcer.canPerform('senior', 'process_return', { amount: 5001 })).toBe(false);
  });

  it('allows supervisors to process any return', () => {
    expect(enforcer.canPerform('supervisor', 'process_return', { amount: 50000 })).toBe(true);
  });

  it('allows supervisors to void transactions', () => {
    expect(enforcer.canPerform('supervisor', 'void_transaction')).toBe(true);
  });

  it('blocks supervisors from managing terminals', () => {
    expect(enforcer.canPerform('supervisor', 'manage_terminals')).toBe(false);
  });
});

describe('TransactionProcessor', () => {
  let processor: TransactionProcessor;
  let mockDb: MockDatabase;

  beforeEach(() => {
    mockDb = createMockDatabase();
    processor = new TransactionProcessor(mockDb);
  });

  it('calculates correct totals for multi-item transaction', async () => {
    const txn = await processor.createTransaction({
      terminalId: 'term_1',
      clerkSessionId: 'session_1',
      items: [
        { name: 'Coffee', unitPrice: 450, quantity: 2, taxCode: 'food_prepared' },
        { name: 'Muffin', unitPrice: 350, quantity: 1, taxCode: 'food_prepared' },
      ],
    });

    expect(txn.subtotal).toBe(1250);        // $12.50
    expect(txn.taxTotal).toBe(163);          // 13% HST = $1.63 (rounded)
    expect(txn.total).toBe(1413);            // $14.13
    expect(txn.items).toHaveLength(2);
  });

  it('prevents double-payment via idempotency', async () => {
    const txn = await processor.createTransaction({
      terminalId: 'term_1',
      clerkSessionId: 'session_1',
      items: [{ name: 'Item', unitPrice: 1000, quantity: 1 }],
    });

    await processor.processCashPayment(txn.id, 1500);

    await expect(
      processor.processCashPayment(txn.id, 1500)
    ).rejects.toThrow('POS_TRANSACTION_ALREADY_COMPLETED');
  });
});
```

### Integration Tests

Integration tests run against a real PostgreSQL database (via Supabase local development) and test the full stack including RLS policies.

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestSupabaseClient, createTestTenant } from '@mcv/testing';
import { POSServiceImpl } from '@mcv/commerce/pos';

describe('POS Integration', () => {
  let posService: POSServiceImpl;
  let tenantA: TestTenant;
  let tenantB: TestTenant;

  beforeAll(async () => {
    tenantA = await createTestTenant('Store A');
    tenantB = await createTestTenant('Store B');
    posService = new POSServiceImpl(createTestSupabaseClient());
  });

  it('enforces tenant isolation — Store A cannot see Store B terminals', async () => {
    // Register terminal for Store A
    const termA = await posService.withTenant(tenantA.id).registerTerminal({
      locationId: tenantA.locationId,
      name: 'Terminal A',
      type: 'virtual',
      provider: 'stripe',
    });

    // Store B should see zero terminals
    const termBList = await posService.withTenant(tenantB.id).listTerminals(tenantB.locationId);
    expect(termBList).toHaveLength(0);

    // Store B should not be able to fetch Terminal A by ID
    const termBFetch = await posService.withTenant(tenantB.id).getTerminal(termA.id);
    expect(termBFetch).toBeNull();
  });

  it('processes full sale lifecycle — create → pay → receipt', async () => {
    const service = posService.withTenant(tenantA.id);

    // Setup: clerk session + cash session
    const clerk = await service.authenticateClerk({
      method: 'pin', terminalId: tenantA.terminalId, pin: '1234',
    });
    const cash = await service.openCashSession({
      terminalId: tenantA.terminalId,
      clerkSessionId: clerk.id,
      openingFloat: 20000,
      openingCount: { denominations: { '2000': 10 }, total: 20000, countedAt: new Date(), countedByClerkId: clerk.clerkId },
    });

    // Create and complete a cash transaction
    const txn = await service.createTransaction({
      terminalId: tenantA.terminalId,
      clerkSessionId: clerk.id,
      items: [{ name: 'Test Item', unitPrice: 999, quantity: 1 }],
    });

    const result = await service.processCashPayment(txn.id, 1000);

    expect(result.transaction.status).toBe('completed');
    expect(result.changeGiven).toBeGreaterThanOrEqual(0);

    // Verify receipt was generated
    const receipt = await service.getReceipt(result.transaction.receiptId!);
    expect(receipt).not.toBeNull();
    expect(receipt!.receiptNumber).toMatch(/^RCP-/);
  });

  afterAll(async () => {
    await tenantA.cleanup();
    await tenantB.cleanup();
  });
});
```

### Hardware Simulation

For testing without physical hardware, the module provides virtual adapters:

```typescript
import { describe, it, expect } from 'vitest';
import {
  VirtualTerminal,
  VirtualPrinter,
  VirtualCashDrawer,
  VirtualScanner,
  VirtualCustomerDisplay,
  VirtualScale,
} from '@mcv/commerce/pos/testing';

describe('Hardware Simulation', () => {
  it('VirtualTerminal simulates card tap', async () => {
    const terminal = new VirtualTerminal({ simulateDelay: true });

    // Simulate a contactless payment
    const result = await terminal.collectPayment({
      amount: 2500,
      currency: 'cad',
    });

    expect(result.status).toBe('succeeded');
    expect(result.cardBrand).toBe('visa');
    expect(result.cardLast4).toBe('4242');
    expect(result.entryMethod).toBe('contactless');
  });

  it('VirtualTerminal can simulate declined card', async () => {
    const terminal = new VirtualTerminal({
      simulateDecline: true,
      declineReason: 'insufficient_funds',
    });

    await expect(
      terminal.collectPayment({ amount: 2500, currency: 'cad' })
    ).rejects.toThrow('POS_PAYMENT_DECLINED');
  });

  it('VirtualPrinter captures ESC/POS output', async () => {
    const printer = new VirtualPrinter();

    await printer.print(escposData);

    // Inspect what was "printed"
    const output = printer.getLastPrintJob();
    expect(output.text).toContain('Downtown Deli');
    expect(output.text).toContain('Turkey Club Sandwich');
    expect(output.cutPerformed).toBe(true);
    expect(output.drawerKickSent).toBe(true);
  });

  it('VirtualCashDrawer tracks open/close state', async () => {
    const drawer = new VirtualCashDrawer();

    expect(drawer.isOpen).toBe(false);
    await drawer.open();
    expect(drawer.isOpen).toBe(true);
    expect(drawer.openCount).toBe(1);
  });

  it('VirtualScale returns configurable weight', async () => {
    const scale = new VirtualScale({ weight: 0.5, unit: 'kg', stable: true });

    const reading = await scale.read();
    expect(reading.weight).toBe(0.5);
    expect(reading.unit).toBe('kg');
    expect(reading.stable).toBe(true);
  });
});
```

### Offline Scenario Tests

Dedicated test suite for offline/sync scenarios using a simulated network.

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import {
  OfflineTestHarness,
  SimulatedNetwork,
} from '@mcv/commerce/pos/testing';

describe('Offline Scenarios', () => {
  let harness: OfflineTestHarness;
  let network: SimulatedNetwork;

  beforeEach(() => {
    network = new SimulatedNetwork({ initialState: 'online' });
    harness = new OfflineTestHarness({ network });
  });

  it('queues transactions when offline and syncs on reconnect', async () => {
    // Go offline
    network.disconnect();

    // Process 3 cash transactions while offline
    await harness.processCashSale(1500);
    await harness.processCashSale(2000);
    await harness.processCashSale(850);

    expect(harness.offlineQueue.size).toBe(3);

    // Go back online
    network.reconnect();
    const result = await harness.syncOfflineQueue();

    expect(result.totalProcessed).toBe(3);
    expect(result.successCount).toBe(3);
    expect(result.conflictCount).toBe(0);
    expect(harness.offlineQueue.size).toBe(0);
  });

  it('detects inventory conflict on sync', async () => {
    // Go offline and sell the last item in stock
    network.disconnect();
    await harness.processCashSale(1500, { productId: 'prod_limited', quantity: 1 });

    // Meanwhile, someone buys it online
    await harness.simulateOnlinePurchase('prod_limited', 1);

    // Reconnect and sync
    network.reconnect();
    const result = await harness.syncOfflineQueue();

    expect(result.conflictCount).toBe(1);
    expect(result.entries[0].status).toBe('conflict');
    expect(result.entries[0].conflicts![0].type).toBe('inventory_insufficient');
  });

  it('handles partial sync failure gracefully', async () => {
    network.disconnect();
    await harness.processCashSale(1500);
    await harness.processCashSale(2000);
    await harness.processCashSale(850);

    // Reconnect but drop connection after 1st entry syncs
    network.reconnect({ dropAfter: 1 });
    const result1 = await harness.syncOfflineQueue();

    expect(result1.successCount).toBe(1);
    expect(harness.offlineQueue.size).toBe(2); // 2 still pending

    // Reconnect fully and sync remaining
    network.reconnect();
    const result2 = await harness.syncOfflineQueue();

    expect(result2.successCount).toBe(2);
    expect(harness.offlineQueue.size).toBe(0);
  });

  it('respects offline queue capacity limit', async () => {
    network.disconnect();

    // Fill the queue to capacity (default 500)
    for (let i = 0; i < 500; i++) {
      await harness.processCashSale(100);
    }

    // 501st should fail
    await expect(
      harness.processCashSale(100)
    ).rejects.toThrow('POS_OFFLINE_QUEUE_FULL');
  });

  it('prevents duplicate transactions via idempotency keys', async () => {
    network.disconnect();
    const entry = await harness.processCashSale(1500);

    network.reconnect();
    // Sync twice (simulating retry)
    await harness.syncOfflineQueue();
    await harness.syncOfflineQueue();

    // Should only have 1 transaction on server
    const serverTxns = await harness.getServerTransactions();
    const matching = serverTxns.filter(t => t.id === entry.id);
    expect(matching).toHaveLength(1);
  });
});
```

### Running Tests

```bash
# Run all POS tests
pnpm test --filter @mcv/commerce/pos

# Run only unit tests
pnpm test --filter @mcv/commerce/pos -- --grep "unit"

# Run integration tests (requires local Supabase)
pnpm test:integration --filter @mcv/commerce/pos

# Run offline scenario tests
pnpm test --filter @mcv/commerce/pos -- --grep "Offline"

# Run with coverage
pnpm test:coverage --filter @mcv/commerce/pos

# Run hardware simulation tests
pnpm test --filter @mcv/commerce/pos -- --grep "Hardware"
```

**Coverage targets:**

| Area | Target | Notes |
|------|--------|-------|
| Business logic (services) | ≥90% | Transaction processing, cash management, rounding |
| Database queries | ≥85% | Schema operations, RLS verification |
| Error paths | ≥90% | Every error code must have a test |
| Offline sync | ≥95% | Critical path — no data loss allowed |
| Hardware adapters | ≥75% | Virtual adapters cover happy paths; real hardware in QA |
| tRPC routes | ≥85% | Input validation, authorization, response shaping |

---

*Last updated: 2026-02-08*
*Module version: 0.9.0*
*Documentation version: 1.0.0*