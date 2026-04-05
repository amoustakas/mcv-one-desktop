# @mcv/operations/assets

> **Asset Management** — Complete lifecycle management for organizational assets including equipment, licenses, inventory, maintenance tracking, depreciation, and check-in/check-out workflows.

| Field | Value |
|---|---|
| **Package** | `@mcv/operations/assets` |
| **Domain** | Operations |
| **Tier** | 5 (Domain Module) |
| **Registry** | `@mcv` npm scope |
| **Since** | 0.12.0 |
| **Status** | Stable |
| **License** | Proprietary |

---

## Table of Contents

- [Purpose](#purpose)
- [Exports](#exports)
- [Architecture](#architecture)
- [Core Interfaces](#core-interfaces)
- [Database Schemas](#database-schemas)
- [Code Examples](#code-examples)
- [Error Codes](#error-codes)
- [Security](#security)
- [Environment Variables](#environment-variables)
- [Dependencies](#dependencies)
- [Testing](#testing)

---

## Purpose

`@mcv/operations/assets` provides a comprehensive asset management system for the MCV.ONE platform. Every organization tracks physical and digital assets — laptops, servers, vehicles, furniture, software licenses, office supplies — and needs to understand where those assets are, who has them, what they cost, and when they need attention.

This module addresses the full asset lifecycle:

1. **Procurement & Registration** — Assets enter the system through procurement workflows or manual registration. Each asset receives a unique tag, is categorized, and assigned to a location and custodian.

2. **Deployment & Utilization** — Assets are deployed to employees, departments, or locations. The check-in/check-out system handles reservable assets (projectors, vehicles, shared equipment) with booking calendars and condition tracking.

3. **Maintenance & Compliance** — Preventive maintenance schedules ensure assets remain operational. Work orders track service requests, vendor involvement, and cost. Software licenses are monitored for seat compliance and renewal dates.

4. **Depreciation & Valuation** — Financial depreciation calculations (straight-line, declining balance, units-of-production) maintain accurate book values. Depreciation entries integrate with the finance module for accounting purposes.

5. **Retirement & Disposal** — End-of-life assets are retired, disposed of, or recycled with full audit trails. Disposal methods, environmental compliance, and residual value are tracked.

6. **Inventory Management** — Consumable supplies and parts maintain stock levels with reorder points, automatic alerts, and purchase requisition generation.

### Why This Module Exists

Without centralized asset management, organizations face:

- **Ghost assets** — Assets on the books that no longer exist physically, inflating balance sheets
- **License non-compliance** — Over-deployed software licenses creating legal and financial risk
- **Unplanned downtime** — Equipment failures that preventive maintenance would have caught
- **Lost equipment** — No visibility into who has what, leading to duplicate purchases
- **Inaccurate financials** — Manual depreciation calculations that drift from reality
- **Stockouts** — Critical supplies running out because nobody tracked consumption rates

This module eliminates these problems with automated tracking, proactive alerts, and deep integration with MCV.ONE's finance, people, and procurement domains.

### Design Principles

- **Tag Everything** — Every asset gets a unique identifier (asset tag, barcode, QR code) for physical tracking
- **Lifecycle-Aware** — Status transitions are explicit, audited, and trigger downstream workflows
- **Multi-Tenant by Default** — All queries are scoped by `org_id` via Supabase RLS; no data leakage between tenants
- **Category-Driven Attributes** — Each asset category defines its own custom fields (e.g., RAM/CPU for laptops, mileage for vehicles)
- **Financial Integration** — Depreciation entries flow to the general ledger; asset capitalization respects accounting periods
- **Event-Sourced Activities** — Every change to an asset produces an activity record for complete audit history

---

## Exports

### Services

```typescript
export { AssetService } from './services/asset.service';
export { AssetCategoryService } from './services/asset-category.service';
export { LicenseService } from './services/license.service';
export { MaintenanceService } from './services/maintenance.service';
export { DepreciationService } from './services/depreciation.service';
export { CheckoutService } from './services/checkout.service';
export { InventoryService } from './services/inventory.service';
export { AssetReportingService } from './services/asset-reporting.service';
export { AssetActivityService } from './services/asset-activity.service';
export { AssetImportService } from './services/asset-import.service';
```

### Router

```typescript
export { assetRouter } from './router';
export type { AssetRouter } from './router';
```

### Schemas (Drizzle)

```typescript
export {
  assets,
  assetCategories,
  licenses,
  licenseAssignments,
  maintenanceSchedules,
  workOrders,
  depreciationEntries,
  checkoutRecords,
  inventoryItems,
  assetCustomFields,
  assetActivities,
} from './schemas';
```

### Types

```typescript
export type {
  Asset,
  AssetInsert,
  AssetUpdate,
  AssetWithRelations,
  AssetStatus,
  AssetCondition,
  AssetCategory,
  AssetCategoryInsert,
  AssetCategoryUpdate,
  AssetCategoryWithChildren,
  License,
  LicenseInsert,
  LicenseUpdate,
  LicenseType,
  LicenseComplianceStatus,
  LicenseAssignment,
  LicenseAssignmentInsert,
  MaintenanceSchedule,
  MaintenanceScheduleInsert,
  MaintenanceScheduleUpdate,
  MaintenanceFrequency,
  WorkOrder,
  WorkOrderInsert,
  WorkOrderUpdate,
  WorkOrderStatus,
  WorkOrderPriority,
  DepreciationSchedule,
  DepreciationEntry,
  DepreciationEntryInsert,
  DepreciationMethod,
  CheckoutRecord,
  CheckoutRecordInsert,
  CheckoutRecordUpdate,
  CheckoutStatus,
  InventoryItem,
  InventoryItemInsert,
  InventoryItemUpdate,
  InventoryTransaction,
  InventoryTransactionType,
  AssetCustomField,
  AssetCustomFieldInsert,
  AssetCustomFieldValue,
  AssetActivity,
  AssetActivityType,
  AssetFilter,
  AssetSort,
  AssetValuationReport,
  AssetUtilizationReport,
  MaintenanceCostReport,
  LicenseComplianceReport,
  DepreciationReport,
} from './types';
```

### Enums

```typescript
export {
  AssetStatusEnum,
  AssetConditionEnum,
  LicenseTypeEnum,
  WorkOrderStatusEnum,
  WorkOrderPriorityEnum,
  DepreciationMethodEnum,
  CheckoutStatusEnum,
  InventoryTransactionTypeEnum,
  AssetActivityTypeEnum,
  MaintenanceFrequencyEnum,
  CustomFieldTypeEnum,
} from './enums';
```

### Validators (Zod)

```typescript
export {
  assetInsertSchema,
  assetUpdateSchema,
  assetFilterSchema,
  assetCategoryInsertSchema,
  assetCategoryUpdateSchema,
  licenseInsertSchema,
  licenseUpdateSchema,
  licenseAssignmentSchema,
  maintenanceScheduleInsertSchema,
  maintenanceScheduleUpdateSchema,
  workOrderInsertSchema,
  workOrderUpdateSchema,
  depreciationScheduleSchema,
  checkoutRecordInsertSchema,
  checkoutRecordUpdateSchema,
  inventoryItemInsertSchema,
  inventoryItemUpdateSchema,
  inventoryTransactionSchema,
  assetCustomFieldSchema,
  assetImportSchema,
} from './validators';
```

### Hooks (React)

```typescript
export {
  useAssets,
  useAsset,
  useCreateAsset,
  useUpdateAsset,
  useDeleteAsset,
  useAssetCategories,
  useAssetCategory,
  useLicenses,
  useLicense,
  useLicenseCompliance,
  useMaintenanceSchedules,
  useWorkOrders,
  useCreateWorkOrder,
  useDepreciationSchedule,
  useCheckoutRecords,
  useCheckoutAsset,
  useCheckinAsset,
  useInventoryItems,
  useInventoryItem,
  useInventoryTransaction,
  useAssetActivities,
  useAssetReports,
  useAssetValuation,
  useAssetSearch,
} from './hooks';
```

### Constants

```typescript
export {
  ASSET_TAG_PREFIX,
  ASSET_TAG_LENGTH,
  MAX_CUSTOM_FIELDS_PER_CATEGORY,
  DEFAULT_DEPRECIATION_METHOD,
  CHECKOUT_MAX_DURATION_DAYS,
  INVENTORY_LOW_STOCK_THRESHOLD,
  ASSET_IMAGE_MAX_SIZE_MB,
  BARCODE_FORMATS,
  SUPPORTED_IMPORT_FORMATS,
  DEPRECIATION_METHODS,
  MAINTENANCE_FREQUENCIES,
} from './constants';
```

---

## Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────────┐  │
│  │  Asset    │ │ License  │ │Inventory │ │   Maintenance     │  │
│  │  Registry │ │ Manager  │ │ Tracker  │ │   Dashboard       │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬──────────┘  │
│       │             │            │                 │              │
│  React Hooks (useAssets, useLicenses, useInventoryItems, ...)   │
└───────┼─────────────┼────────────┼─────────────────┼─────────────┘
        │             │            │                 │
        ▼             ▼            ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                       tRPC Router                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  assetRouter                                              │   │
│  │  ├── asset.*        (CRUD, search, bulk operations)       │   │
│  │  ├── category.*     (hierarchy, custom fields)            │   │
│  │  ├── license.*      (CRUD, assignments, compliance)       │   │
│  │  ├── maintenance.*  (schedules, work orders)              │   │
│  │  ├── depreciation.* (calculations, entries, schedules)    │   │
│  │  ├── checkout.*     (check-in, check-out, reservations)   │   │
│  │  ├── inventory.*    (stock, transactions, alerts)         │   │
│  │  ├── activity.*     (audit log, timeline)                 │   │
│  │  ├── import.*       (CSV/Excel bulk import)               │   │
│  │  └── report.*       (valuation, utilization, compliance)  │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────┬─────────────┬────────────┬─────────────────┬─────────────┘
        │             │            │                 │
        ▼             ▼            ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Service Layer                               │
│  ┌────────────────┐ ┌──────────────────┐ ┌───────────────────┐  │
│  │  AssetService   │ │ LicenseService   │ │ InventoryService  │  │
│  │  - create       │ │ - create         │ │ - create          │  │
│  │  - update       │ │ - assign         │ │ - adjustStock     │  │
│  │  - transfer     │ │ - revoke         │ │ - transfer        │  │
│  │  - retire       │ │ - checkCompliance│ │ - checkReorder    │  │
│  │  - dispose      │ │ - renewalAlerts  │ │ - requisition     │  │
│  │  - search       │ │ - usageReport    │ │ - stockAlerts     │  │
│  └────────┬───────┘ └────────┬─────────┘ └────────┬──────────┘  │
│  ┌────────────────┐ ┌──────────────────┐ ┌───────────────────┐  │
│  │ MaintenanceSvc  │ │ DepreciationSvc  │ │  CheckoutService  │  │
│  │ - schedule      │ │ - calculate      │ │ - checkout        │  │
│  │ - createOrder   │ │ - runPeriod      │ │ - checkin         │  │
│  │ - completeOrder │ │ - getSchedule    │ │ - reserve         │  │
│  │ - overdueAlerts │ │ - bookValue      │ │ - overdueAlerts   │  │
│  │ - vendorMgmt    │ │ - journalEntries │ │ - conditionReport │  │
│  └────────┬───────┘ └────────┬─────────┘ └────────┬──────────┘  │
│  ┌────────────────┐ ┌──────────────────┐ ┌───────────────────┐  │
│  │ CategoryService │ │ ActivityService  │ │  ReportingService │  │
│  │ - create        │ │ - log            │ │ - valuation       │  │
│  │ - getTree       │ │ - getTimeline    │ │ - utilization     │  │
│  │ - customFields  │ │ - getByAsset     │ │ - maintenance     │  │
│  │ - reorder       │ │ - search         │ │ - compliance      │  │
│  └────────┬───────┘ └────────┬─────────┘ └────────┬──────────┘  │
└───────────┼─────────────────┼──────────────────────┼─────────────┘
            │                 │                      │
            ▼                 ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Data Layer (Drizzle ORM)                        │
│  ┌─────────┐ ┌───────────────┐ ┌──────────┐ ┌───────────────┐  │
│  │ assets   │ │asset_categories│ │ licenses │ │license_assign │  │
│  └─────────┘ └───────────────┘ └──────────┘ └───────────────┘  │
│  ┌─────────────────┐ ┌────────────┐ ┌─────────────────────┐    │
│  │maint_schedules   │ │work_orders │ │depreciation_entries │    │
│  └─────────────────┘ └────────────┘ └─────────────────────┘    │
│  ┌──────────────────┐ ┌──────────────┐ ┌────────────────────┐  │
│  │checkout_records   │ │inventory_items│ │asset_custom_fields│  │
│  └──────────────────┘ └──────────────┘ └────────────────────┘  │
│  ┌──────────────────┐                                           │
│  │asset_activities   │                                           │
│  └──────────────────┘                                           │
└─────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Supabase PostgreSQL (Multi-Tenant RLS)           │
└─────────────────────────────────────────────────────────────────┘
```

### Asset Lifecycle State Machine

```
                    ┌───────────┐
                    │  ORDERED  │  (Procurement initiated)
                    └─────┬─────┘
                          │ receive
                          ▼
                    ┌───────────┐
                    │ RECEIVED  │  (In warehouse / staging)
                    └─────┬─────┘
                          │ deploy
                          ▼
      ┌──────────── ┌───────────┐ ────────────┐
      │             │  ACTIVE   │              │
      │             └─────┬─────┘              │
      │ checkout          │                    │ assign
      ▼                   │                    ▼
┌───────────┐             │            ┌───────────────┐
│ CHECKED   │             │            │   ASSIGNED    │
│   OUT     │             │            │  (to person)  │
└─────┬─────┘             │            └───────┬───────┘
      │ checkin            │                    │ unassign
      └──────────► ┌──────┴──────┐ ◄───────────┘
                   │   ACTIVE    │
                   └──────┬──────┘
                          │ maintenance
                          ▼
                   ┌─────────────┐
                   │   IN        │
                   │ MAINTENANCE │
                   └──────┬──────┘
                          │ complete
                          ▼
                   ┌─────────────┐
                   │   ACTIVE    │
                   └──────┬──────┘
                          │ retire
                          ▼
                   ┌─────────────┐
                   │  RETIRED    │
                   └──────┬──────┘
                          │ dispose
                          ▼
                   ┌─────────────┐
                   │  DISPOSED   │  (Terminal state)
                   └─────────────┘

Special states:
  ┌───────────┐     ┌───────────┐
  │   LOST    │     │  STOLEN   │
  └───────────┘     └───────────┘
  (Can be recovered back to ACTIVE)
```

### Integration Points

```
┌────────────────────────────────────────────────────────────┐
│                   @mcv/operations/assets                     │
└────┬──────────┬──────────┬───────────┬──────────┬──────────┘
     │          │          │           │          │
     ▼          ▼          ▼           ▼          ▼
┌─────────┐┌────────┐┌──────────┐┌─────────┐┌──────────┐
│ Finance ││ People ││Procure-  ││  Notif.  ││ Storage  │
│         ││        ││ment     ││         ││          │
│-Capital-││-Assign ││-Purchase││-Alerts  ││-Asset    │
│ ization ││ assets ││ orders  ││-Overdue ││ images   │
│-Deprec. ││-Offboard│-Vendor  ││-Renewal ││-Documents│
│ entries ││ return ││ mgmt    ││-Stock   ││-Manuals  │
│-Cost    ││-Dept   ││-Receive ││ alerts  ││          │
│ centers ││ budget ││         ││         ││          │
└─────────┘└────────┘└──────────┘└─────────┘└──────────┘
```

### Module Initialization

```typescript
// src/index.ts
import { createModule } from '@mcv/core';
import { assetRouter } from './router';
import { registerSchemas } from './schemas';
import { AssetService } from './services/asset.service';
import { AssetCategoryService } from './services/asset-category.service';
import { LicenseService } from './services/license.service';
import { MaintenanceService } from './services/maintenance.service';
import { DepreciationService } from './services/depreciation.service';
import { CheckoutService } from './services/checkout.service';
import { InventoryService } from './services/inventory.service';
import { AssetReportingService } from './services/asset-reporting.service';
import { AssetActivityService } from './services/asset-activity.service';

export const assetsModule = createModule({
  name: 'operations.assets',
  version: '0.12.0',
  
  router: assetRouter,
  
  schemas: registerSchemas,
  
  services: {
    asset: AssetService,
    category: AssetCategoryService,
    license: LicenseService,
    maintenance: MaintenanceService,
    depreciation: DepreciationService,
    checkout: CheckoutService,
    inventory: InventoryService,
    reporting: AssetReportingService,
    activity: AssetActivityService,
  },
  
  permissions: [
    'assets.view',
    'assets.create',
    'assets.update',
    'assets.delete',
    'assets.transfer',
    'assets.retire',
    'assets.dispose',
    'assets.checkout',
    'assets.checkin',
    'assets.maintenance.view',
    'assets.maintenance.manage',
    'assets.licenses.view',
    'assets.licenses.manage',
    'assets.inventory.view',
    'assets.inventory.manage',
    'assets.depreciation.view',
    'assets.depreciation.manage',
    'assets.reports.view',
    'assets.import',
    'assets.export',
    'assets.admin',
  ],
  
  events: [
    'asset.created',
    'asset.updated',
    'asset.transferred',
    'asset.retired',
    'asset.disposed',
    'asset.checked_out',
    'asset.checked_in',
    'asset.maintenance_due',
    'asset.work_order_created',
    'asset.work_order_completed',
    'license.expiring',
    'license.non_compliant',
    'inventory.low_stock',
    'inventory.stockout',
    'depreciation.period_complete',
  ],
  
  cron: [
    {
      name: 'depreciation-monthly',
      schedule: '0 2 1 * *', // 1st of each month at 2 AM
      handler: 'depreciation.runMonthlyDepreciation',
    },
    {
      name: 'maintenance-check',
      schedule: '0 6 * * *', // Daily at 6 AM
      handler: 'maintenance.checkOverdueSchedules',
    },
    {
      name: 'license-renewal-check',
      schedule: '0 7 * * 1', // Weekly on Monday at 7 AM
      handler: 'license.checkUpcomingRenewals',
    },
    {
      name: 'inventory-reorder-check',
      schedule: '0 8 * * *', // Daily at 8 AM
      handler: 'inventory.checkReorderPoints',
    },
    {
      name: 'checkout-overdue-check',
      schedule: '0 9 * * *', // Daily at 9 AM
      handler: 'checkout.checkOverdueCheckouts',
    },
  ],
});
```

---

## Core Interfaces

### Asset

```typescript
/**
 * Represents a physical or digital asset tracked by the organization.
 * Assets are the central entity in this module — everything else
 * (maintenance, depreciation, checkouts) references back to an asset.
 */
interface Asset {
  /** UUID primary key */
  id: string;
  
  /** Organization ID (tenant isolation) */
  orgId: string;
  
  /** Human-readable asset tag (e.g., "AST-00001") */
  assetTag: string;
  
  /** Optional barcode value for physical scanning */
  barcode: string | null;
  
  /** Display name of the asset */
  name: string;
  
  /** Detailed description */
  description: string | null;
  
  /** FK to asset_categories */
  categoryId: string;
  
  /** Current lifecycle status */
  status: AssetStatus;
  
  /** Physical condition assessment */
  condition: AssetCondition;
  
  /** Serial number from manufacturer */
  serialNumber: string | null;
  
  /** Manufacturer / brand */
  manufacturer: string | null;
  
  /** Model name or number */
  model: string | null;
  
  /** Year of manufacture */
  yearManufactured: number | null;
  
  /** Purchase date */
  purchaseDate: string | null;
  
  /** Purchase price in cents (integer) */
  purchasePriceCents: number | null;
  
  /** Currency code (ISO 4217) */
  currency: string;
  
  /** Warranty expiration date */
  warrantyExpiry: string | null;
  
  /** Current physical location (building, room, etc.) */
  location: string | null;
  
  /** FK to a locations table if available */
  locationId: string | null;
  
  /** Current custodian (person responsible) */
  custodianId: string | null;
  
  /** Department that owns this asset */
  departmentId: string | null;
  
  /** Whether this asset can be checked out */
  isReservable: boolean;
  
  /** URL to primary image */
  imageUrl: string | null;
  
  /** Additional image URLs */
  imageUrls: string[];
  
  /** Custom field values (category-specific) */
  customFields: Record<string, AssetCustomFieldValue>;
  
  /** Arbitrary metadata / notes */
  metadata: Record<string, unknown>;
  
  /** Depreciation method for this asset */
  depreciationMethod: DepreciationMethod | null;
  
  /** Useful life in months for depreciation */
  usefulLifeMonths: number | null;
  
  /** Salvage/residual value in cents */
  salvageValueCents: number | null;
  
  /** Date asset was placed in service for depreciation */
  inServiceDate: string | null;
  
  /** Date asset was retired */
  retiredDate: string | null;
  
  /** Date asset was disposed */
  disposedDate: string | null;
  
  /** Disposal method (sold, recycled, scrapped, donated) */
  disposalMethod: string | null;
  
  /** Disposal proceeds in cents */
  disposalProceedsCents: number | null;
  
  /** Notes about disposal */
  disposalNotes: string | null;
  
  /** FK to procurement purchase order */
  purchaseOrderId: string | null;
  
  /** FK to vendor / supplier */
  vendorId: string | null;
  
  /** Created by user ID */
  createdBy: string;
  
  /** Last updated by user ID */
  updatedBy: string;
  
  createdAt: string;
  updatedAt: string;
}
```

### AssetStatus

```typescript
type AssetStatus =
  | 'ordered'         // Procurement initiated, not yet received
  | 'received'        // Physically received, in staging
  | 'active'          // In use / available
  | 'assigned'        // Assigned to a specific person
  | 'checked_out'     // Temporarily checked out
  | 'in_maintenance'  // Under repair or servicing
  | 'retired'         // No longer in service
  | 'disposed'        // Removed from inventory (terminal)
  | 'lost'            // Cannot be located
  | 'stolen';         // Reported stolen
```

### AssetCondition

```typescript
type AssetCondition =
  | 'new'             // Brand new, unused
  | 'excellent'       // Like new, minimal wear
  | 'good'            // Normal wear, fully functional
  | 'fair'            // Noticeable wear, functional with minor issues
  | 'poor'            // Significant wear, limited functionality
  | 'broken'          // Non-functional, needs repair
  | 'salvage';        // Only useful for parts
```

### AssetCategory

```typescript
/**
 * Hierarchical category for organizing assets.
 * Categories define what custom fields are available for their assets.
 * 
 * Example hierarchy:
 *   IT Equipment
 *   ├── Laptops
 *   ├── Desktops
 *   ├── Monitors
 *   ├── Networking
 *   │   ├── Switches
 *   │   └── Routers
 *   └── Peripherals
 *   Furniture
 *   ├── Desks
 *   ├── Chairs
 *   └── Storage
 *   Vehicles
 *   ├── Cars
 *   ├── Trucks
 *   └── Forklifts
 */
interface AssetCategory {
  id: string;
  orgId: string;
  
  /** Display name */
  name: string;
  
  /** URL-safe slug */
  slug: string;
  
  /** Description of this category */
  description: string | null;
  
  /** Parent category ID for hierarchy (null = root) */
  parentId: string | null;
  
  /** Sort order within parent */
  sortOrder: number;
  
  /** Icon identifier for UI */
  icon: string | null;
  
  /** Color hex for UI badges */
  color: string | null;
  
  /** Default depreciation method for assets in this category */
  defaultDepreciationMethod: DepreciationMethod | null;
  
  /** Default useful life in months */
  defaultUsefulLifeMonths: number | null;
  
  /** Whether assets in this category are reservable by default */
  defaultIsReservable: boolean;
  
  /** Whether this category is active (soft delete) */
  isActive: boolean;
  
  /** Custom field definitions for this category */
  customFieldDefinitions: AssetCustomFieldDefinition[];
  
  createdAt: string;
  updatedAt: string;
}

interface AssetCategoryWithChildren extends AssetCategory {
  children: AssetCategoryWithChildren[];
  assetCount: number;
}
```

### AssetCustomFieldDefinition

```typescript
/**
 * Defines a custom field that assets in a particular category can have.
 * For example, the "Laptops" category might define fields for
 * RAM (number), CPU (text), and OS (select).
 */
interface AssetCustomFieldDefinition {
  /** Unique key for this field within the category */
  key: string;
  
  /** Human-readable label */
  label: string;
  
  /** Field data type */
  type: CustomFieldType;
  
  /** Whether this field is required when creating assets */
  required: boolean;
  
  /** Default value */
  defaultValue: AssetCustomFieldValue | null;
  
  /** For 'select' type: allowed options */
  options: string[] | null;
  
  /** Validation: minimum value (for number fields) */
  min: number | null;
  
  /** Validation: maximum value (for number fields) */
  max: number | null;
  
  /** Validation: regex pattern (for text fields) */
  pattern: string | null;
  
  /** Help text shown in the UI */
  helpText: string | null;
  
  /** Sort order for display */
  sortOrder: number;
}

type CustomFieldType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'url'
  | 'email';

type AssetCustomFieldValue = string | number | boolean | string[] | null;
```

### License

```typescript
/**
 * Represents a software license or subscription managed by the organization.
 * Tracks seat counts, expiration dates, and assignment compliance.
 */
interface License {
  id: string;
  orgId: string;
  
  /** Name of the software / service */
  name: string;
  
  /** Description / notes */
  description: string | null;
  
  /** Type of license */
  licenseType: LicenseType;
  
  /** License key or activation code */
  licenseKey: string | null;
  
  /** Total number of seats purchased */
  totalSeats: number | null;
  
  /** Number of seats currently assigned */
  usedSeats: number;
  
  /** Vendor / publisher */
  vendor: string | null;
  
  /** FK to vendor record */
  vendorId: string | null;
  
  /** Purchase date */
  purchaseDate: string | null;
  
  /** License start date (effective date) */
  startDate: string;
  
  /** License expiration date (null = perpetual) */
  expirationDate: string | null;
  
  /** Whether this license auto-renews */
  autoRenew: boolean;
  
  /** Renewal cost in cents */
  renewalCostCents: number | null;
  
  /** Billing frequency (monthly, annual, one-time) */
  billingFrequency: 'monthly' | 'quarterly' | 'annual' | 'one_time' | null;
  
  /** Cost per seat in cents (for per-seat licensing) */
  costPerSeatCents: number | null;
  
  /** Total cost in cents */
  totalCostCents: number | null;
  
  /** Currency code */
  currency: string;
  
  /** FK to the related asset (e.g., a server this license is for) */
  assetId: string | null;
  
  /** Category for grouping */
  category: string | null;
  
  /** Compliance status (computed) */
  complianceStatus: LicenseComplianceStatus;
  
  /** URL to vendor portal */
  portalUrl: string | null;
  
  /** URL to license agreement document */
  agreementUrl: string | null;
  
  /** Additional metadata */
  metadata: Record<string, unknown>;
  
  /** Whether this license is active */
  isActive: boolean;
  
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

type LicenseType =
  | 'per_seat'        // One license per user
  | 'per_device'      // One license per device
  | 'site'            // Unlimited use within a site/location
  | 'enterprise'      // Unlimited use organization-wide
  | 'concurrent'      // Limited concurrent users
  | 'subscription'    // Recurring subscription
  | 'perpetual'       // One-time purchase, no expiration
  | 'open_source'     // Free/open source (tracked for inventory)
  | 'oem';            // Bundled with hardware

type LicenseComplianceStatus =
  | 'compliant'       // Used seats <= total seats
  | 'warning'         // Used seats approaching total (>80%)
  | 'non_compliant'   // Used seats > total seats
  | 'expired'         // Past expiration date
  | 'expiring_soon';  // Within 30 days of expiration
```

### LicenseAssignment

```typescript
/**
 * Tracks which users or devices are assigned to a license.
 */
interface LicenseAssignment {
  id: string;
  orgId: string;
  
  /** FK to licenses */
  licenseId: string;
  
  /** FK to user (people module) */
  userId: string | null;
  
  /** FK to asset (for per-device licenses) */
  assetId: string | null;
  
  /** Date this assignment was made */
  assignedDate: string;
  
  /** User who made the assignment */
  assignedBy: string;
  
  /** Date this assignment was revoked (null = active) */
  revokedDate: string | null;
  
  /** User who revoked the assignment */
  revokedBy: string | null;
  
  /** Reason for revocation */
  revocationReason: string | null;
  
  /** Last known usage date (from usage monitoring) */
  lastUsedDate: string | null;
  
  /** Notes */
  notes: string | null;
  
  createdAt: string;
  updatedAt: string;
}
```

### MaintenanceSchedule

```typescript
/**
 * Defines a recurring preventive maintenance schedule for an asset.
 * Generates work orders automatically based on the frequency.
 */
interface MaintenanceSchedule {
  id: string;
  orgId: string;
  
  /** FK to assets */
  assetId: string;
  
  /** Name of the maintenance task */
  name: string;
  
  /** Detailed description of what needs to be done */
  description: string | null;
  
  /** How often this maintenance should occur */
  frequency: MaintenanceFrequency;
  
  /** For 'custom' frequency: interval in days */
  customIntervalDays: number | null;
  
  /** For usage-based: trigger after this many units */
  usageThreshold: number | null;
  
  /** Usage unit (hours, miles, cycles, etc.) */
  usageUnit: string | null;
  
  /** Date of the last completed maintenance */
  lastCompletedDate: string | null;
  
  /** Date of the next scheduled maintenance */
  nextDueDate: string;
  
  /** Advance notice in days before due date */
  advanceNoticeDays: number;
  
  /** Estimated duration in minutes */
  estimatedDurationMinutes: number | null;
  
  /** Estimated cost in cents */
  estimatedCostCents: number | null;
  
  /** Preferred vendor for this maintenance */
  vendorId: string | null;
  
  /** Assigned technician / team */
  assignedToId: string | null;
  
  /** Checklist of tasks to complete */
  checklist: MaintenanceChecklistItem[];
  
  /** Required parts / supplies */
  requiredParts: MaintenanceRequiredPart[];
  
  /** Whether this schedule is active */
  isActive: boolean;
  
  /** Priority when generating work orders */
  priority: WorkOrderPriority;
  
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

type MaintenanceFrequency =
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'semiannual'
  | 'annual'
  | 'custom'          // customIntervalDays
  | 'usage_based';    // Triggered by usage threshold

interface MaintenanceChecklistItem {
  id: string;
  description: string;
  required: boolean;
  sortOrder: number;
}

interface MaintenanceRequiredPart {
  inventoryItemId: string | null;
  name: string;
  quantity: number;
  unitCostCents: number | null;
}
```

### WorkOrder

```typescript
/**
 * A work order represents a specific maintenance task to be performed.
 * Can be generated automatically from MaintenanceSchedule or created
 * manually for ad-hoc repairs.
 */
interface WorkOrder {
  id: string;
  orgId: string;
  
  /** Human-readable work order number (e.g., "WO-2024-00042") */
  orderNumber: string;
  
  /** FK to assets */
  assetId: string;
  
  /** FK to maintenance_schedules (null for ad-hoc) */
  maintenanceScheduleId: string | null;
  
  /** Title / summary */
  title: string;
  
  /** Detailed description of the work needed */
  description: string | null;
  
  /** Current status */
  status: WorkOrderStatus;
  
  /** Priority level */
  priority: WorkOrderPriority;
  
  /** Type of work */
  workType: 'preventive' | 'corrective' | 'inspection' | 'emergency';
  
  /** User who requested this work */
  requestedBy: string;
  
  /** Date the request was made */
  requestedDate: string;
  
  /** User / team assigned to perform the work */
  assignedToId: string | null;
  
  /** External vendor assigned */
  vendorId: string | null;
  
  /** Scheduled start date */
  scheduledStartDate: string | null;
  
  /** Scheduled completion date */
  scheduledEndDate: string | null;
  
  /** Actual start date */
  actualStartDate: string | null;
  
  /** Actual completion date */
  actualEndDate: string | null;
  
  /** Estimated cost in cents */
  estimatedCostCents: number | null;
  
  /** Actual cost in cents */
  actualCostCents: number | null;
  
  /** Labor cost in cents */
  laborCostCents: number | null;
  
  /** Parts cost in cents */
  partsCostCents: number | null;
  
  /** Checklist items (copied from schedule if applicable) */
  checklist: WorkOrderChecklistItem[];
  
  /** Parts used */
  partsUsed: WorkOrderPartUsed[];
  
  /** Completion notes */
  completionNotes: string | null;
  
  /** Failure code (for corrective maintenance) */
  failureCode: string | null;
  
  /** Root cause description */
  rootCause: string | null;
  
  /** Resolution description */
  resolution: string | null;
  
  /** Downtime in minutes */
  downtimeMinutes: number | null;
  
  /** Attachments (photos, documents) */
  attachments: WorkOrderAttachment[];
  
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

type WorkOrderStatus =
  | 'draft'           // Created but not submitted
  | 'submitted'       // Awaiting approval
  | 'approved'        // Approved, ready to schedule
  | 'scheduled'       // Scheduled for a specific date
  | 'in_progress'     // Work has started
  | 'on_hold'         // Paused (waiting for parts, etc.)
  | 'completed'       // Work finished
  | 'cancelled';      // Cancelled

type WorkOrderPriority =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';       // Emergency / safety issue

interface WorkOrderChecklistItem {
  id: string;
  description: string;
  required: boolean;
  completed: boolean;
  completedBy: string | null;
  completedAt: string | null;
  notes: string | null;
  sortOrder: number;
}

interface WorkOrderPartUsed {
  inventoryItemId: string | null;
  name: string;
  quantity: number;
  unitCostCents: number;
}

interface WorkOrderAttachment {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: string;
  uploadedAt: string;
}
```

### DepreciationSchedule

```typescript
/**
 * Represents the depreciation schedule for an asset.
 * Calculated from the asset's cost, useful life, salvage value,
 * and depreciation method.
 */
interface DepreciationSchedule {
  assetId: string;
  
  /** Depreciation method used */
  method: DepreciationMethod;
  
  /** Original cost basis in cents */
  costBasisCents: number;
  
  /** Salvage value in cents */
  salvageValueCents: number;
  
  /** Depreciable amount (cost - salvage) in cents */
  depreciableAmountCents: number;
  
  /** Useful life in months */
  usefulLifeMonths: number;
  
  /** Date depreciation started */
  startDate: string;
  
  /** Projected end date */
  endDate: string;
  
  /** Total depreciation taken to date in cents */
  accumulatedDepreciationCents: number;
  
  /** Current book value (cost - accumulated depreciation) in cents */
  currentBookValueCents: number;
  
  /** Monthly depreciation entries */
  entries: DepreciationEntry[];
}

type DepreciationMethod =
  | 'straight_line'         // Equal amount each period
  | 'declining_balance'     // Fixed percentage of remaining book value
  | 'double_declining'      // 2x the straight-line rate
  | 'sum_of_years'          // Accelerated based on sum-of-years digits
  | 'units_of_production';  // Based on actual usage

/**
 * A single depreciation entry for one accounting period.
 */
interface DepreciationEntry {
  id: string;
  orgId: string;
  
  /** FK to assets */
  assetId: string;
  
  /** The accounting period (YYYY-MM) */
  period: string;
  
  /** Depreciation amount for this period in cents */
  amountCents: number;
  
  /** Accumulated depreciation after this entry in cents */
  accumulatedCents: number;
  
  /** Book value after this entry in cents */
  bookValueCents: number;
  
  /** Whether this entry has been posted to the general ledger */
  isPosted: boolean;
  
  /** FK to the journal entry in the finance module */
  journalEntryId: string | null;
  
  /** Notes */
  notes: string | null;
  
  createdAt: string;
}
```

### CheckoutRecord

```typescript
/**
 * Records an asset being checked out to a person and returned.
 * Used for reservable assets like projectors, vehicles, shared tools, etc.
 */
interface CheckoutRecord {
  id: string;
  orgId: string;
  
  /** FK to assets */
  assetId: string;
  
  /** User who checked out the asset */
  checkedOutBy: string;
  
  /** User who approved the checkout (if approval required) */
  approvedBy: string | null;
  
  /** Date/time the asset was checked out */
  checkoutDate: string;
  
  /** Expected return date/time */
  expectedReturnDate: string;
  
  /** Actual return date/time (null = still checked out) */
  actualReturnDate: string | null;
  
  /** User who processed the return */
  checkedInBy: string | null;
  
  /** Status of this checkout */
  status: CheckoutStatus;
  
  /** Condition when checked out */
  conditionAtCheckout: AssetCondition;
  
  /** Condition when returned */
  conditionAtReturn: AssetCondition | null;
  
  /** Notes at checkout */
  checkoutNotes: string | null;
  
  /** Notes at return */
  returnNotes: string | null;
  
  /** Purpose / reason for checkout */
  purpose: string | null;
  
  /** Location where asset will be used */
  destinationLocation: string | null;
  
  /** Whether the user acknowledged the checkout agreement */
  agreementAccepted: boolean;
  
  /** Any damage reported on return */
  damageReported: boolean;
  
  /** Damage description */
  damageDescription: string | null;
  
  createdAt: string;
  updatedAt: string;
}

type CheckoutStatus =
  | 'reserved'        // Future reservation, not yet picked up
  | 'checked_out'     // Currently with the user
  | 'overdue'         // Past expected return date
  | 'returned'        // Returned successfully
  | 'cancelled';      // Reservation cancelled
```

### InventoryItem

```typescript
/**
 * Represents a consumable inventory item (supplies, parts, materials).
 * Unlike assets which are individually tracked, inventory items are
 * tracked by quantity. Think toner cartridges, screws, cleaning supplies.
 */
interface InventoryItem {
  id: string;
  orgId: string;
  
  /** Display name */
  name: string;
  
  /** SKU or part number */
  sku: string | null;
  
  /** Description */
  description: string | null;
  
  /** Category for grouping */
  categoryId: string | null;
  
  /** Current quantity in stock */
  quantityOnHand: number;
  
  /** Quantity reserved (committed to work orders, etc.) */
  quantityReserved: number;
  
  /** Available quantity (on hand - reserved) */
  quantityAvailable: number;
  
  /** Unit of measure (each, box, case, roll, etc.) */
  unitOfMeasure: string;
  
  /** Minimum stock level — triggers low stock alert */
  reorderPoint: number;
  
  /** How many to order when restocking */
  reorderQuantity: number;
  
  /** Maximum stock level */
  maxQuantity: number | null;
  
  /** Unit cost in cents */
  unitCostCents: number | null;
  
  /** Currency code */
  currency: string;
  
  /** Storage location */
  location: string | null;
  
  /** Preferred vendor */
  vendorId: string | null;
  
  /** Vendor part number */
  vendorPartNumber: string | null;
  
  /** Lead time in days for reordering */
  leadTimeDays: number | null;
  
  /** Barcode */
  barcode: string | null;
  
  /** Image URL */
  imageUrl: string | null;
  
  /** Whether this item is active */
  isActive: boolean;
  
  /** Whether stock is below reorder point */
  isLowStock: boolean;
  
  /** Last restocked date */
  lastRestockedDate: string | null;
  
  /** Additional metadata */
  metadata: Record<string, unknown>;
  
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Records a stock transaction (received, consumed, adjusted, transferred).
 */
interface InventoryTransaction {
  id: string;
  orgId: string;
  
  /** FK to inventory_items */
  inventoryItemId: string;
  
  /** Type of transaction */
  transactionType: InventoryTransactionType;
  
  /** Quantity changed (positive for adds, negative for removes) */
  quantity: number;
  
  /** Stock level before this transaction */
  previousQuantity: number;
  
  /** Stock level after this transaction */
  newQuantity: number;
  
  /** Unit cost at time of transaction in cents */
  unitCostCents: number | null;
  
  /** Reference to related record (work order ID, PO ID, etc.) */
  referenceId: string | null;
  
  /** Type of the reference record */
  referenceType: string | null;
  
  /** Reason for the transaction */
  reason: string | null;
  
  /** User who performed the transaction */
  performedBy: string;
  
  createdAt: string;
}

type InventoryTransactionType =
  | 'received'        // Stock received from vendor
  | 'consumed'        // Used / consumed
  | 'reserved'        // Reserved for a work order
  | 'unreserved'      // Released from reservation
  | 'adjusted'        // Manual stock adjustment (count correction)
  | 'transferred'     // Moved between locations
  | 'returned'        // Returned to stock
  | 'scrapped';       // Removed as waste / damaged
```

### AssetActivity

```typescript
/**
 * Audit log entry for any change to an asset.
 * Provides a complete timeline of everything that happened to an asset.
 */
interface AssetActivity {
  id: string;
  orgId: string;
  
  /** FK to assets */
  assetId: string;
  
  /** Type of activity */
  activityType: AssetActivityType;
  
  /** Human-readable description */
  description: string;
  
  /** What changed (field-level diff) */
  changes: AssetActivityChange[] | null;
  
  /** Who performed this action */
  performedBy: string;
  
  /** IP address of the actor */
  ipAddress: string | null;
  
  /** User agent of the actor */
  userAgent: string | null;
  
  /** Additional context */
  metadata: Record<string, unknown>;
  
  createdAt: string;
}

type AssetActivityType =
  | 'created'
  | 'updated'
  | 'status_changed'
  | 'transferred'
  | 'assigned'
  | 'unassigned'
  | 'checked_out'
  | 'checked_in'
  | 'maintenance_scheduled'
  | 'maintenance_completed'
  | 'work_order_created'
  | 'work_order_completed'
  | 'depreciation_recorded'
  | 'condition_changed'
  | 'location_changed'
  | 'retired'
  | 'disposed'
  | 'image_uploaded'
  | 'document_attached'
  | 'note_added'
  | 'custom_field_updated';

interface AssetActivityChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}
```

### AssetService

```typescript
/**
 * Primary service for managing assets. Handles CRUD operations,
 * lifecycle transitions, search, and bulk operations.
 */
interface AssetService {
  // --- CRUD ---
  
  /** Create a new asset with auto-generated tag */
  create(input: AssetInsert, ctx: ServiceContext): Promise<Asset>;
  
  /** Get a single asset by ID with optional relations */
  getById(id: string, opts?: AssetGetOptions): Promise<AssetWithRelations | null>;
  
  /** Get a single asset by asset tag */
  getByTag(tag: string, ctx: ServiceContext): Promise<Asset | null>;
  
  /** Get a single asset by barcode */
  getByBarcode(barcode: string, ctx: ServiceContext): Promise<Asset | null>;
  
  /** Update an asset */
  update(id: string, input: AssetUpdate, ctx: ServiceContext): Promise<Asset>;
  
  /** Soft delete an asset (marks as disposed) */
  delete(id: string, ctx: ServiceContext): Promise<void>;
  
  /** List assets with filtering, sorting, and pagination */
  list(filter: AssetFilter, ctx: ServiceContext): Promise<PaginatedResult<Asset>>;
  
  /** Full-text search across asset fields */
  search(query: string, opts?: AssetSearchOptions, ctx?: ServiceContext): Promise<PaginatedResult<Asset>>;
  
  // --- Lifecycle ---
  
  /** Mark an ordered asset as received */
  receive(id: string, input: AssetReceiveInput, ctx: ServiceContext): Promise<Asset>;
  
  /** Deploy / activate an asset */
  deploy(id: string, input: AssetDeployInput, ctx: ServiceContext): Promise<Asset>;
  
  /** Assign an asset to a person */
  assign(id: string, custodianId: string, ctx: ServiceContext): Promise<Asset>;
  
  /** Unassign an asset from its current custodian */
  unassign(id: string, ctx: ServiceContext): Promise<Asset>;
  
  /** Transfer an asset to a new location and/or department */
  transfer(id: string, input: AssetTransferInput, ctx: ServiceContext): Promise<Asset>;
  
  /** Send an asset for maintenance */
  sendToMaintenance(id: string, workOrderId: string, ctx: ServiceContext): Promise<Asset>;
  
  /** Return an asset from maintenance */
  returnFromMaintenance(id: string, ctx: ServiceContext): Promise<Asset>;
  
  /** Retire an asset (remove from active service) */
  retire(id: string, reason: string, ctx: ServiceContext): Promise<Asset>;
  
  /** Dispose of a retired asset */
  dispose(id: string, input: AssetDisposeInput, ctx: ServiceContext): Promise<Asset>;
  
  /** Report an asset as lost */
  reportLost(id: string, notes: string, ctx: ServiceContext): Promise<Asset>;
  
  /** Report an asset as stolen */
  reportStolen(id: string, notes: string, ctx: ServiceContext): Promise<Asset>;
  
  /** Recover a lost or stolen asset */
  recover(id: string, notes: string, ctx: ServiceContext): Promise<Asset>;
  
  // --- Bulk Operations ---
  
  /** Bulk update multiple assets */
  bulkUpdate(ids: string[], input: Partial<AssetUpdate>, ctx: ServiceContext): Promise<Asset[]>;
  
  /** Bulk transfer assets to a new location */
  bulkTransfer(ids: string[], input: AssetTransferInput, ctx: ServiceContext): Promise<Asset[]>;
  
  /** Bulk retire assets */
  bulkRetire(ids: string[], reason: string, ctx: ServiceContext): Promise<Asset[]>;
  
  // --- Tag Generation ---
  
  /** Generate the next asset tag for an org */
  generateNextTag(orgId: string): Promise<string>;
  
  /** Validate that a barcode is unique within the org */
  validateBarcode(barcode: string, orgId: string, excludeId?: string): Promise<boolean>;
  
  // --- Statistics ---
  
  /** Get asset counts by status */
  getStatusCounts(ctx: ServiceContext): Promise<Record<AssetStatus, number>>;
  
  /** Get asset counts by category */
  getCategoryCounts(ctx: ServiceContext): Promise<Array<{ categoryId: string; name: string; count: number }>>;
  
  /** Get total asset value */
  getTotalValue(ctx: ServiceContext): Promise<{ purchaseValueCents: number; bookValueCents: number; currency: string }>;
}

interface AssetGetOptions {
  includeCategory?: boolean;
  includeCustomFields?: boolean;
  includeCustodian?: boolean;
  includeMaintenanceSchedules?: boolean;
  includeCheckoutHistory?: boolean;
  includeDepreciation?: boolean;
  includeActivities?: boolean;
}

interface AssetFilter {
  search?: string;
  status?: AssetStatus | AssetStatus[];
  condition?: AssetCondition | AssetCondition[];
  categoryId?: string | string[];
  custodianId?: string;
  departmentId?: string;
  locationId?: string;
  location?: string;
  isReservable?: boolean;
  manufacturer?: string;
  vendorId?: string;
  purchaseDateFrom?: string;
  purchaseDateTo?: string;
  purchasePriceMin?: number;
  purchasePriceMax?: number;
  warrantyExpired?: boolean;
  customFields?: Record<string, AssetCustomFieldValue>;
  sortBy?: AssetSort;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

type AssetSort =
  | 'name'
  | 'assetTag'
  | 'status'
  | 'condition'
  | 'category'
  | 'location'
  | 'custodian'
  | 'purchaseDate'
  | 'purchasePrice'
  | 'bookValue'
  | 'createdAt'
  | 'updatedAt';
```

### Reporting Interfaces

```typescript
interface AssetValuationReport {
  /** Report generation date */
  asOf: string;
  
  /** Total original cost of all assets */
  totalPurchaseCostCents: number;
  
  /** Total accumulated depreciation */
  totalDepreciationCents: number;
  
  /** Total current book value */
  totalBookValueCents: number;
  
  /** Breakdown by category */
  byCategory: Array<{
    categoryId: string;
    categoryName: string;
    assetCount: number;
    purchaseCostCents: number;
    depreciationCents: number;
    bookValueCents: number;
  }>;
  
  /** Breakdown by department */
  byDepartment: Array<{
    departmentId: string;
    departmentName: string;
    assetCount: number;
    purchaseCostCents: number;
    depreciationCents: number;
    bookValueCents: number;
  }>;
  
  /** Breakdown by status */
  byStatus: Array<{
    status: AssetStatus;
    assetCount: number;
    bookValueCents: number;
  }>;
  
  currency: string;
}

interface AssetUtilizationReport {
  /** Report period */
  periodStart: string;
  periodEnd: string;
  
  /** Assets with checkout data */
  assets: Array<{
    assetId: string;
    assetTag: string;
    name: string;
    categoryName: string;
    
    /** Total times checked out in period */
    checkoutCount: number;
    
    /** Total hours checked out */
    totalHoursCheckedOut: number;
    
    /** Total hours in period */
    totalHoursInPeriod: number;
    
    /** Utilization rate (0-100%) */
    utilizationRate: number;
    
    /** Average checkout duration in hours */
    avgCheckoutDurationHours: number;
    
    /** Number of overdue returns */
    overdueCount: number;
  }>;
  
  /** Overall utilization statistics */
  summary: {
    totalReservableAssets: number;
    averageUtilizationRate: number;
    mostUtilizedAssetId: string | null;
    leastUtilizedAssetId: string | null;
  };
}

interface MaintenanceCostReport {
  periodStart: string;
  periodEnd: string;
  
  /** Total maintenance spend */
  totalCostCents: number;
  
  /** Breakdown by type */
  byWorkType: Array<{
    workType: string;
    orderCount: number;
    totalCostCents: number;
    avgCostCents: number;
  }>;
  
  /** Top assets by maintenance cost */
  topAssetsByCost: Array<{
    assetId: string;
    assetTag: string;
    name: string;
    orderCount: number;
    totalCostCents: number;
    totalDowntimeMinutes: number;
  }>;
  
  /** Vendor spending breakdown */
  byVendor: Array<{
    vendorId: string;
    vendorName: string;
    orderCount: number;
    totalCostCents: number;
  }>;
  
  /** Preventive vs corrective ratio */
  preventiveVsCorrective: {
    preventiveCount: number;
    preventiveCostCents: number;
    correctiveCount: number;
    correctiveCostCents: number;
  };
  
  currency: string;
}

interface LicenseComplianceReport {
  asOf: string;
  
  /** Overall compliance status */
  overallStatus: 'compliant' | 'non_compliant';
  
  /** Total licenses tracked */
  totalLicenses: number;
  
  /** Number compliant */
  compliantCount: number;
  
  /** Number non-compliant */
  nonCompliantCount: number;
  
  /** Number expiring within 30 days */
  expiringSoonCount: number;
  
  /** Number already expired */
  expiredCount: number;
  
  /** Total annual license cost */
  totalAnnualCostCents: number;
  
  /** Unused seats (paid but not assigned) */
  totalUnusedSeats: number;
  
  /** Wasted spend on unused seats in cents */
  wastedSpendCents: number;
  
  /** Per-license details */
  licenses: Array<{
    licenseId: string;
    name: string;
    vendor: string | null;
    licenseType: LicenseType;
    totalSeats: number | null;
    usedSeats: number;
    complianceStatus: LicenseComplianceStatus;
    expirationDate: string | null;
    annualCostCents: number | null;
    costPerUnusedSeatCents: number | null;
  }>;
}

interface DepreciationReport {
  /** Accounting period (YYYY-MM) */
  period: string;
  
  /** Total depreciation expense for the period */
  totalDepreciationCents: number;
  
  /** Number of assets depreciated */
  assetCount: number;
  
  /** Per-asset details */
  entries: Array<{
    assetId: string;
    assetTag: string;
    name: string;
    categoryName: string;
    method: DepreciationMethod;
    periodDepreciationCents: number;
    accumulatedDepreciationCents: number;
    bookValueCents: number;
    originalCostCents: number;
    percentDepreciated: number;
  }>;
  
  /** Breakdown by depreciation method */
  byMethod: Array<{
    method: DepreciationMethod;
    assetCount: number;
    totalDepreciationCents: number;
  }>;
  
  /** Breakdown by category */
  byCategory: Array<{
    categoryId: string;
    categoryName: string;
    assetCount: number;
    totalDepreciationCents: number;
  }>;
  
  /** Assets fully depreciated this period */
  newlyFullyDepreciated: Array<{
    assetId: string;
    assetTag: string;
    name: string;
    originalCostCents: number;
    salvageValueCents: number;
  }>;
  
  currency: string;
}
```

---

## Database Schemas

### assets

```typescript
import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const assets = pgTable(
  'assets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    assetTag: varchar('asset_tag', { length: 50 }).notNull(),
    barcode: varchar('barcode', { length: 255 }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => assetCategories.id),
    status: varchar('status', { length: 30 })
      .notNull()
      .default('received'),
    condition: varchar('condition', { length: 30 })
      .notNull()
      .default('new'),
    serialNumber: varchar('serial_number', { length: 255 }),
    manufacturer: varchar('manufacturer', { length: 255 }),
    model: varchar('model', { length: 255 }),
    yearManufactured: integer('year_manufactured'),
    purchaseDate: timestamp('purchase_date', { mode: 'string' }),
    purchasePriceCents: integer('purchase_price_cents'),
    currency: varchar('currency', { length: 3 }).notNull().default('USD'),
    warrantyExpiry: timestamp('warranty_expiry', { mode: 'string' }),
    location: varchar('location', { length: 500 }),
    locationId: uuid('location_id'),
    custodianId: uuid('custodian_id'),
    departmentId: uuid('department_id'),
    isReservable: boolean('is_reservable').notNull().default(false),
    imageUrl: text('image_url'),
    imageUrls: jsonb('image_urls').notNull().default([]),
    customFields: jsonb('custom_fields').notNull().default({}),
    metadata: jsonb('metadata').notNull().default({}),
    depreciationMethod: varchar('depreciation_method', { length: 30 }),
    usefulLifeMonths: integer('useful_life_months'),
    salvageValueCents: integer('salvage_value_cents'),
    inServiceDate: timestamp('in_service_date', { mode: 'string' }),
    retiredDate: timestamp('retired_date', { mode: 'string' }),
    disposedDate: timestamp('disposed_date', { mode: 'string' }),
    disposalMethod: varchar('disposal_method', { length: 50 }),
    disposalProceedsCents: integer('disposal_proceeds_cents'),
    disposalNotes: text('disposal_notes'),
    purchaseOrderId: uuid('purchase_order_id'),
    vendorId: uuid('vendor_id'),
    createdBy: uuid('created_by').notNull(),
    updatedBy: uuid('updated_by').notNull(),
    createdAt: timestamp('created_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    orgIdIdx: index('assets_org_id_idx').on(table.orgId),
    assetTagIdx: uniqueIndex('assets_org_asset_tag_idx').on(
      table.orgId,
      table.assetTag,
    ),
    barcodeIdx: uniqueIndex('assets_org_barcode_idx')
      .on(table.orgId, table.barcode)
      .where(sql`barcode IS NOT NULL`),
    statusIdx: index('assets_status_idx').on(table.orgId, table.status),
    categoryIdx: index('assets_category_idx').on(table.orgId, table.categoryId),
    custodianIdx: index('assets_custodian_idx').on(table.orgId, table.custodianId),
    departmentIdx: index('assets_department_idx').on(table.orgId, table.departmentId),
    locationIdx: index('assets_location_idx').on(table.orgId, table.locationId),
    serialNumberIdx: index('assets_serial_number_idx').on(
      table.orgId,
      table.serialNumber,
    ),
    searchIdx: index('assets_search_idx').using(
      'gin',
      sql`to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(serial_number, '') || ' ' || coalesce(manufacturer, '') || ' ' || coalesce(model, ''))`,
    ),
  }),
);
```

### asset_categories

```typescript
export const assetCategories = pgTable(
  'asset_categories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    description: text('description'),
    parentId: uuid('parent_id').references(() => assetCategories.id),
    sortOrder: integer('sort_order').notNull().default(0),
    icon: varchar('icon', { length: 100 }),
    color: varchar('color', { length: 7 }),
    defaultDepreciationMethod: varchar('default_depreciation_method', {
      length: 30,
    }),
    defaultUsefulLifeMonths: integer('default_useful_life_months'),
    defaultIsReservable: boolean('default_is_reservable')
      .notNull()
      .default(false),
    isActive: boolean('is_active').notNull().default(true),
    customFieldDefinitions: jsonb('custom_field_definitions')
      .notNull()
      .default([]),
    createdAt: timestamp('created_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    orgIdIdx: index('asset_categories_org_id_idx').on(table.orgId),
    slugIdx: uniqueIndex('asset_categories_org_slug_idx').on(
      table.orgId,
      table.slug,
    ),
    parentIdx: index('asset_categories_parent_idx').on(
      table.orgId,
      table.parentId,
    ),
  }),
);
```

### licenses

```typescript
export const licenses = pgTable(
  'licenses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    licenseType: varchar('license_type', { length: 30 }).notNull(),
    licenseKey: text('license_key'),
    totalSeats: integer('total_seats'),
    usedSeats: integer('used_seats').notNull().default(0),
    vendor: varchar('vendor', { length: 255 }),
    vendorId: uuid('vendor_id'),
    purchaseDate: timestamp('purchase_date', { mode: 'string' }),
    startDate: timestamp('start_date', { mode: 'string' }).notNull(),
    expirationDate: timestamp('expiration_date', { mode: 'string' }),
    autoRenew: boolean('auto_renew').notNull().default(false),
    renewalCostCents: integer('renewal_cost_cents'),
    billingFrequency: varchar('billing_frequency', { length: 20 }),
    costPerSeatCents: integer('cost_per_seat_cents'),
    totalCostCents: integer('total_cost_cents'),
    currency: varchar('currency', { length: 3 }).notNull().default('USD'),
    assetId: uuid('asset_id').references(() => assets.id),
    category: varchar('category', { length: 100 }),
    complianceStatus: varchar('compliance_status', { length: 30 })
      .notNull()
      .default('compliant'),
    portalUrl: text('portal_url'),
    agreementUrl: text('agreement_url'),
    metadata: jsonb('metadata').notNull().default({}),
    isActive: boolean('is_active').notNull().default(true),
    createdBy: uuid('created_by').notNull(),
    updatedBy: uuid('updated_by').notNull(),
    createdAt: timestamp('created_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    orgIdIdx: index('licenses_org_id_idx').on(table.orgId),
    nameIdx: index('licenses_name_idx').on(table.orgId, table.name),
    expirationIdx: index('licenses_expiration_idx').on(
      table.orgId,
      table.expirationDate,
    ),
    complianceIdx: index('licenses_compliance_idx').on(
      table.orgId,
      table.complianceStatus,
    ),
    vendorIdx: index('licenses_vendor_idx').on(table.orgId, table.vendorId),
  }),
);
```

### license_assignments

```typescript
export const licenseAssignments = pgTable(
  'license_assignments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    licenseId: uuid('license_id')
      .notNull()
      .references(() => licenses.id, { onDelete: 'cascade' }),
    userId: uuid('user_id'),
    assetId: uuid('asset_id').references(() => assets.id),
    assignedDate: timestamp('assigned_date', { mode: 'string' })
      .notNull()
      .defaultNow(),
    assignedBy: uuid('assigned_by').notNull(),
    revokedDate: timestamp('revoked_date', { mode: 'string' }),
    revokedBy: uuid('revoked_by'),
    revocationReason: text('revocation_reason'),
    lastUsedDate: timestamp('last_used_date', { mode: 'string' }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    licenseIdx: index('license_assignments_license_idx').on(
      table.orgId,
      table.licenseId,
    ),
    userIdx: index('license_assignments_user_idx').on(
      table.orgId,
      table.userId,
    ),
    assetIdx: index('license_assignments_asset_idx').on(
      table.orgId,
      table.assetId,
    ),
    activeIdx: index('license_assignments_active_idx')
      .on(table.orgId, table.licenseId, table.userId)
      .where(sql`revoked_date IS NULL`),
  }),
);
```

### maintenance_schedules

```typescript
export const maintenanceSchedules = pgTable(
  'maintenance_schedules',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    assetId: uuid('asset_id')
      .notNull()
      .references(() => assets.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    frequency: varchar('frequency', { length: 30 }).notNull(),
    customIntervalDays: integer('custom_interval_days'),
    usageThreshold: integer('usage_threshold'),
    usageUnit: varchar('usage_unit', { length: 50 }),
    lastCompletedDate: timestamp('last_completed_date', { mode: 'string' }),
    nextDueDate: timestamp('next_due_date', { mode: 'string' }).notNull(),
    advanceNoticeDays: integer('advance_notice_days').notNull().default(7),
    estimatedDurationMinutes: integer('estimated_duration_minutes'),
    estimatedCostCents: integer('estimated_cost_cents'),
    vendorId: uuid('vendor_id'),
    assignedToId: uuid('assigned_to_id'),
    checklist: jsonb('checklist').notNull().default([]),
    requiredParts: jsonb('required_parts').notNull().default([]),
    isActive: boolean('is_active').notNull().default(true),
    priority: varchar('priority', { length: 20 }).notNull().default('medium'),
    createdBy: uuid('created_by').notNull(),
    updatedBy: uuid('updated_by').notNull(),
    createdAt: timestamp('created_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    orgIdIdx: index('maintenance_schedules_org_id_idx').on(table.orgId),
    assetIdx: index('maintenance_schedules_asset_idx').on(
      table.orgId,
      table.assetId,
    ),
    nextDueIdx: index('maintenance_schedules_next_due_idx').on(
      table.orgId,
      table.nextDueDate,
    ),
    activeIdx: index('maintenance_schedules_active_idx')
      .on(table.orgId, table.isActive)
      .where(sql`is_active = true`),
  }),
);
```

### work_orders

```typescript
export const workOrders = pgTable(
  'work_orders',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    orderNumber: varchar('order_number', { length: 50 }).notNull(),
    assetId: uuid('asset_id')
      .notNull()
      .references(() => assets.id),
    maintenanceScheduleId: uuid('maintenance_schedule_id').references(
      () => maintenanceSchedules.id,
    ),
    title: varchar('title', { length: 500 }).notNull(),
    description: text('description'),
    status: varchar('status', { length: 30 }).notNull().default('draft'),
    priority: varchar('priority', { length: 20 }).notNull().default('medium'),
    workType: varchar('work_type', { length: 30 }).notNull().default('corrective'),
    requestedBy: uuid('requested_by').notNull(),
    requestedDate: timestamp('requested_date', { mode: 'string' })
      .notNull()
      .defaultNow(),
    assignedToId: uuid('assigned_to_id'),
    vendorId: uuid('vendor_id'),
    scheduledStartDate: timestamp('scheduled_start_date', { mode: 'string' }),
    scheduledEndDate: timestamp('scheduled_end_date', { mode: 'string' }),
    actualStartDate: timestamp('actual_start_date', { mode: 'string' }),
    actualEndDate: timestamp('actual_end_date', { mode: 'string' }),
    estimatedCostCents: integer('estimated_cost_cents'),
    actualCostCents: integer('actual_cost_cents'),
    laborCostCents: integer('labor_cost_cents'),
    partsCostCents: integer('parts_cost_cents'),
    checklist: jsonb('checklist').notNull().default([]),
    partsUsed: jsonb('parts_used').notNull().default([]),
    completionNotes: text('completion_notes'),
    failureCode: varchar('failure_code', { length: 50 }),
    rootCause: text('root_cause'),
    resolution: text('resolution'),
    downtimeMinutes: integer('downtime_minutes'),
    attachments: jsonb('attachments').notNull().default([]),
    createdBy: uuid('created_by').notNull(),
    updatedBy: uuid('updated_by').notNull(),
    createdAt: timestamp('created_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    orgIdIdx: index('work_orders_org_id_idx').on(table.orgId),
    orderNumberIdx: uniqueIndex('work_orders_org_order_number_idx').on(
      table.orgId,
      table.orderNumber,
    ),
    assetIdx: index('work_orders_asset_idx').on(table.orgId, table.assetId),
    statusIdx: index('work_orders_status_idx').on(table.orgId, table.status),
    assignedIdx: index('work_orders_assigned_idx').on(
      table.orgId,
      table.assignedToId,
    ),
    vendorIdx: index('work_orders_vendor_idx').on(table.orgId, table.vendorId),
    scheduledIdx: index('work_orders_scheduled_idx').on(
      table.orgId,
      table.scheduledStartDate,
    ),
  }),
);
```

### depreciation_entries

```typescript
export const depreciationEntries = pgTable(
  'depreciation_entries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    assetId: uuid('asset_id')
      .notNull()
      .references(() => assets.id, { onDelete: 'cascade' }),
    period: varchar('period', { length: 7 }).notNull(), // YYYY-MM
    amountCents: integer('amount_cents').notNull(),
    accumulatedCents: integer('accumulated_cents').notNull(),
    bookValueCents: integer('book_value_cents').notNull(),
    isPosted: boolean('is_posted').notNull().default(false),
    journalEntryId: uuid('journal_entry_id'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    orgIdIdx: index('depreciation_entries_org_id_idx').on(table.orgId),
    assetIdx: index('depreciation_entries_asset_idx').on(
      table.orgId,
      table.assetId,
    ),
    periodIdx: index('depreciation_entries_period_idx').on(
      table.orgId,
      table.period,
    ),
    uniqueAssetPeriod: uniqueIndex('depreciation_entries_asset_period_idx').on(
      table.orgId,
      table.assetId,
      table.period,
    ),
    postedIdx: index('depreciation_entries_posted_idx')
      .on(table.orgId, table.isPosted)
      .where(sql`is_posted = false`),
  }),
);
```

### checkout_records

```typescript
export const checkoutRecords = pgTable(
  'checkout_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    assetId: uuid('asset_id')
      .notNull()
      .references(() => assets.id),
    checkedOutBy: uuid('checked_out_by').notNull(),
    approvedBy: uuid('approved_by'),
    checkoutDate: timestamp('checkout_date', { mode: 'string' }).notNull(),
    expectedReturnDate: timestamp('expected_return_date', {
      mode: 'string',
    }).notNull(),
    actualReturnDate: timestamp('actual_return_date', { mode: 'string' }),
    checkedInBy: uuid('checked_in_by'),
    status: varchar('status', { length: 30 }).notNull().default('checked_out'),
    conditionAtCheckout: varchar('condition_at_checkout', { length: 30 })
      .notNull(),
    conditionAtReturn: varchar('condition_at_return', { length: 30 }),
    checkoutNotes: text('checkout_notes'),
    returnNotes: text('return_notes'),
    purpose: text('purpose'),
    destinationLocation: varchar('destination_location', { length: 500 }),
    agreementAccepted: boolean('agreement_accepted')
      .notNull()
      .default(false),
    damageReported: boolean('damage_reported').notNull().default(false),
    damageDescription: text('damage_description'),
    createdAt: timestamp('created_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    orgIdIdx: index('checkout_records_org_id_idx').on(table.orgId),
    assetIdx: index('checkout_records_asset_idx').on(
      table.orgId,
      table.assetId,
    ),
    userIdx: index('checkout_records_user_idx').on(
      table.orgId,
      table.checkedOutBy,
    ),
    statusIdx: index('checkout_records_status_idx').on(
      table.orgId,
      table.status,
    ),
    activeIdx: index('checkout_records_active_idx')
      .on(table.orgId, table.assetId, table.status)
      .where(sql`status IN ('checked_out', 'overdue', 'reserved')`),
    overdueIdx: index('checkout_records_overdue_idx')
      .on(table.orgId, table.expectedReturnDate)
      .where(sql`status = 'checked_out' AND actual_return_date IS NULL`),
  }),
);
```

### inventory_items

```typescript
export const inventoryItems = pgTable(
  'inventory_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    name: varchar('name', { length: 255 }).notNull(),
    sku: varchar('sku', { length: 100 }),
    description: text('description'),
    categoryId: uuid('category_id'),
    quantityOnHand: integer('quantity_on_hand').notNull().default(0),
    quantityReserved: integer('quantity_reserved').notNull().default(0),
    quantityAvailable: integer('quantity_available')
      .notNull()
      .generatedAlwaysAs(sql`quantity_on_hand - quantity_reserved`),
    unitOfMeasure: varchar('unit_of_measure', { length: 50 })
      .notNull()
      .default('each'),
    reorderPoint: integer('reorder_point').notNull().default(0),
    reorderQuantity: integer('reorder_quantity').notNull().default(0),
    maxQuantity: integer('max_quantity'),
    unitCostCents: integer('unit_cost_cents'),
    currency: varchar('currency', { length: 3 }).notNull().default('USD'),
    location: varchar('location', { length: 500 }),
    vendorId: uuid('vendor_id'),
    vendorPartNumber: varchar('vendor_part_number', { length: 255 }),
    leadTimeDays: integer('lead_time_days'),
    barcode: varchar('barcode', { length: 255 }),
    imageUrl: text('image_url'),
    isActive: boolean('is_active').notNull().default(true),
    isLowStock: boolean('is_low_stock')
      .notNull()
      .generatedAlwaysAs(
        sql`quantity_on_hand <= reorder_point AND reorder_point > 0`,
      ),
    lastRestockedDate: timestamp('last_restocked_date', { mode: 'string' }),
    metadata: jsonb('metadata').notNull().default({}),
    createdBy: uuid('created_by').notNull(),
    updatedBy: uuid('updated_by').notNull(),
    createdAt: timestamp('created_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    orgIdIdx: index('inventory_items_org_id_idx').on(table.orgId),
    skuIdx: uniqueIndex('inventory_items_org_sku_idx')
      .on(table.orgId, table.sku)
      .where(sql`sku IS NOT NULL`),
    categoryIdx: index('inventory_items_category_idx').on(
      table.orgId,
      table.categoryId,
    ),
    lowStockIdx: index('inventory_items_low_stock_idx')
      .on(table.orgId, table.isLowStock)
      .where(sql`is_low_stock = true AND is_active = true`),
    barcodeIdx: uniqueIndex('inventory_items_org_barcode_idx')
      .on(table.orgId, table.barcode)
      .where(sql`barcode IS NOT NULL`),
    vendorIdx: index('inventory_items_vendor_idx').on(
      table.orgId,
      table.vendorId,
    ),
  }),
);
```

### asset_custom_fields

```typescript
export const assetCustomFields = pgTable(
  'asset_custom_fields',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    assetId: uuid('asset_id')
      .notNull()
      .references(() => assets.id, { onDelete: 'cascade' }),
    fieldKey: varchar('field_key', { length: 100 }).notNull(),
    fieldValue: jsonb('field_value'),
    createdAt: timestamp('created_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    assetIdx: index('asset_custom_fields_asset_idx').on(
      table.orgId,
      table.assetId,
    ),
    uniqueAssetField: uniqueIndex('asset_custom_fields_unique_idx').on(
      table.orgId,
      table.assetId,
      table.fieldKey,
    ),
    fieldValueIdx: index('asset_custom_fields_value_idx').using(
      'gin',
      table.fieldValue,
    ),
  }),
);
```

### asset_activities

```typescript
export const assetActivities = pgTable(
  'asset_activities',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orgId: uuid('org_id').notNull().references(() => organizations.id),
    assetId: uuid('asset_id')
      .notNull()
      .references(() => assets.id, { onDelete: 'cascade' }),
    activityType: varchar('activity_type', { length: 50 }).notNull(),
    description: text('description').notNull(),
    changes: jsonb('changes'),
    performedBy: uuid('performed_by').notNull(),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    orgIdIdx: index('asset_activities_org_id_idx').on(table.orgId),
    assetIdx: index('asset_activities_asset_idx').on(
      table.orgId,
      table.assetId,
    ),
    typeIdx: index('asset_activities_type_idx').on(
      table.orgId,
      table.activityType,
    ),
    dateIdx: index('asset_activities_date_idx').on(
      table.orgId,
      table.createdAt,
    ),
    performedByIdx: index('asset_activities_performed_by_idx').on(
      table.orgId,
      table.performedBy,
    ),
  }),
);
```

### Row Level Security (RLS)

```sql
-- Enable RLS on all asset tables
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE depreciation_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkout_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_activities ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy (applied to all tables)
CREATE POLICY "tenant_isolation" ON assets
  USING (org_id = current_setting('app.current_org_id')::uuid);

CREATE POLICY "tenant_isolation" ON asset_categories
  USING (org_id = current_setting('app.current_org_id')::uuid);

CREATE POLICY "tenant_isolation" ON licenses
  USING (org_id = current_setting('app.current_org_id')::uuid);

CREATE POLICY "tenant_isolation" ON license_assignments
  USING (org_id = current_setting('app.current_org_id')::uuid);

CREATE POLICY "tenant_isolation" ON maintenance_schedules
  USING (org_id = current_setting('app.current_org_id')::uuid);

CREATE POLICY "tenant_isolation" ON work_orders
  USING (org_id = current_setting('app.current_org_id')::uuid);

CREATE POLICY "tenant_isolation" ON depreciation_entries
  USING (org_id = current_setting('app.current_org_id')::uuid);

CREATE POLICY "tenant_isolation" ON checkout_records
  USING (org_id = current_setting('app.current_org_id')::uuid);

CREATE POLICY "tenant_isolation" ON inventory_items
  USING (org_id = current_setting('app.current_org_id')::uuid);

CREATE POLICY "tenant_isolation" ON asset_custom_fields
  USING (org_id = current_setting('app.current_org_id')::uuid);

CREATE POLICY "tenant_isolation" ON asset_activities
  USING (org_id = current_setting('app.current_org_id')::uuid);

-- Service role bypass for background jobs (depreciation cron, etc.)
CREATE POLICY "service_role_bypass" ON assets
  FOR ALL TO service_role USING (true);
-- (repeat for all tables)
```

---

## Code Examples

### Example 1: Register a New Asset

```typescript
import { AssetService } from '@mcv/operations/assets';

const assetService = new AssetService(db, ctx);

// Register a new laptop
const laptop = await assetService.create({
  name: 'MacBook Pro 16" M3 Max',
  description: 'Development workstation for engineering team',
  categoryId: 'cat_it_laptops', // Pre-created category
  status: 'received',
  condition: 'new',
  serialNumber: 'C02ZX1ABCDEF',
  manufacturer: 'Apple',
  model: 'MacBook Pro 16-inch (2024)',
  yearManufactured: 2024,
  purchaseDate: '2024-11-15',
  purchasePriceCents: 349900, // $3,499.00
  currency: 'USD',
  warrantyExpiry: '2027-11-15',
  location: 'Building A, IT Storage Room 102',
  departmentId: 'dept_engineering',
  isReservable: false,
  vendorId: 'vendor_apple_store',
  purchaseOrderId: 'po_2024_00342',
  
  // Depreciation settings
  depreciationMethod: 'straight_line',
  usefulLifeMonths: 36, // 3 years
  salvageValueCents: 50000, // $500.00
  inServiceDate: '2024-11-20',
  
  // Custom fields defined by the "Laptops" category
  customFields: {
    ram_gb: 64,
    storage_gb: 1000,
    cpu: 'M3 Max',
    os: 'macOS Sonoma',
    display_size: '16.2"',
    color: 'Space Black',
  },
}, ctx);

console.log(laptop.assetTag); // "AST-00147" (auto-generated)
console.log(laptop.id);       // "a1b2c3d4-..."

// Deploy the asset to a specific engineer
const deployed = await assetService.deploy(laptop.id, {
  custodianId: 'user_jane_smith',
  location: 'Building A, Desk 3-42',
  notes: 'Assigned to Jane Smith for backend development',
}, ctx);

console.log(deployed.status); // "assigned"
console.log(deployed.custodianId); // "user_jane_smith"
```

### Example 2: Asset Lifecycle — Maintenance to Retirement

```typescript
import { AssetService, MaintenanceService } from '@mcv/operations/assets';

const assetService = new AssetService(db, ctx);
const maintenanceService = new MaintenanceService(db, ctx);

// Step 1: Create a work order for a malfunctioning printer
const workOrder = await maintenanceService.createWorkOrder({
  assetId: 'asset_printer_lobby',
  title: 'Paper jam sensor failure — recurring jams',
  description: 'The paper jam sensor is triggering false positives. Printer jams every 5-10 pages. Needs sensor replacement.',
  priority: 'high',
  workType: 'corrective',
  vendorId: 'vendor_hp_service',
  estimatedCostCents: 45000, // $450.00
  checklist: [
    { id: '1', description: 'Diagnose sensor issue', required: true, sortOrder: 0 },
    { id: '2', description: 'Order replacement sensor', required: true, sortOrder: 1 },
    { id: '3', description: 'Replace sensor unit', required: true, sortOrder: 2 },
    { id: '4', description: 'Run 50-page test print', required: true, sortOrder: 3 },
    { id: '5', description: 'Clean paper path', required: false, sortOrder: 4 },
  ],
}, ctx);

console.log(workOrder.orderNumber); // "WO-2024-00089"

// Step 2: Send asset to maintenance (changes status)
await assetService.sendToMaintenance(
  'asset_printer_lobby',
  workOrder.id,
  ctx,
);

// Step 3: Complete the work order
await maintenanceService.completeWorkOrder(workOrder.id, {
  actualCostCents: 52000, // $520.00 (slightly over estimate)
  laborCostCents: 15000,
  partsCostCents: 37000,
  completionNotes: 'Replaced paper jam sensor (part #HP-SN-4200). Also found worn pickup rollers — replaced as preventive measure.',
  rootCause: 'Worn paper jam sensor contacts due to age (5+ years)',
  resolution: 'Replaced sensor unit and pickup rollers',
  downtimeMinutes: 180,
  partsUsed: [
    { inventoryItemId: 'inv_hp_sensor', name: 'HP Paper Jam Sensor SN-4200', quantity: 1, unitCostCents: 22000 },
    { inventoryItemId: 'inv_hp_rollers', name: 'HP Pickup Roller Kit', quantity: 1, unitCostCents: 15000 },
  ],
  checklist: [
    { id: '1', completed: true, completedBy: 'user_tech_bob', notes: 'Confirmed sensor failure via diagnostic' },
    { id: '2', completed: true, completedBy: 'user_tech_bob', notes: 'Part ordered and received same day' },
    { id: '3', completed: true, completedBy: 'user_tech_bob', notes: null },
    { id: '4', completed: true, completedBy: 'user_tech_bob', notes: 'All 50 pages printed without jam' },
    { id: '5', completed: true, completedBy: 'user_tech_bob', notes: 'Cleaned with compressed air' },
  ],
}, ctx);

// Step 4: Return from maintenance
await assetService.returnFromMaintenance('asset_printer_lobby', ctx);

// ...6 months later, the printer fails again completely...

// Step 5: Retire the asset
await assetService.retire(
  'asset_printer_lobby',
  'Repeated mechanical failures. Total maintenance cost exceeds replacement value. Recommended for disposal.',
  ctx,
);

// Step 6: Dispose of the asset
await assetService.dispose('asset_printer_lobby', {
  disposalMethod: 'recycled',
  disposalProceedsCents: 2500, // $25.00 recycling credit
  disposalNotes: 'Sent to GreenTech Electronics Recycling (certificate #GTE-2024-1892)',
}, ctx);
```

### Example 3: License Management and Compliance

```typescript
import { LicenseService } from '@mcv/operations/assets';

const licenseService = new LicenseService(db, ctx);

// Create a software license record
const license = await licenseService.create({
  name: 'Adobe Creative Cloud - All Apps',
  description: 'Enterprise license for Adobe CC suite (Photoshop, Illustrator, Premiere, etc.)',
  licenseType: 'per_seat',
  totalSeats: 25,
  vendor: 'Adobe Inc.',
  vendorId: 'vendor_adobe',
  purchaseDate: '2024-01-15',
  startDate: '2024-02-01',
  expirationDate: '2025-01-31',
  autoRenew: true,
  billingFrequency: 'annual',
  costPerSeatCents: 7999, // $79.99/month/seat
  totalCostCents: 2399700, // $23,997.00 annual
  currency: 'USD',
  category: 'Creative & Design',
  portalUrl: 'https://adminconsole.adobe.com',
  agreementUrl: 'https://storage.example.com/contracts/adobe-cc-2024.pdf',
}, ctx);

// Assign seats to users
const designers = [
  'user_alice', 'user_bob', 'user_carol', 'user_dave',
  'user_eve', 'user_frank', 'user_grace',
];

for (const userId of designers) {
  await licenseService.assignSeat(license.id, {
    userId,
    notes: 'Design team allocation Q1 2024',
  }, ctx);
}

// Check compliance status
const compliance = await licenseService.checkCompliance(license.id, ctx);
console.log(compliance);
// {
//   licenseId: 'lic_adobe_cc',
//   totalSeats: 25,
//   usedSeats: 7,
//   availableSeats: 18,
//   complianceStatus: 'compliant',
//   utilizationPercent: 28,
//   expirationDate: '2025-01-31',
//   daysUntilExpiration: 365,
// }

// Revoke a seat when someone leaves
await licenseService.revokeSeat(license.id, 'user_frank', {
  reason: 'Employee offboarding — last day 2024-06-30',
}, ctx);

// Get full compliance report across all licenses
const report = await licenseService.getComplianceReport(ctx);
console.log(report.overallStatus);     // 'compliant'
console.log(report.totalUnusedSeats);  // 142 (across all licenses)
console.log(report.wastedSpendCents);  // 1135200 ($11,352.00/year wasted)
console.log(report.expiringSoonCount); // 3 licenses expiring within 30 days
```

### Example 4: Check-In / Check-Out Workflow

```typescript
import { CheckoutService } from '@mcv/operations/assets';

const checkoutService = new CheckoutService(db, ctx);

// Check out a projector for a client presentation
const checkout = await checkoutService.checkout({
  assetId: 'asset_projector_epson_01',
  checkoutDate: '2024-12-10T09:00:00Z',
  expectedReturnDate: '2024-12-10T18:00:00Z',
  purpose: 'Client presentation in Conference Room A — Project Falcon demo',
  destinationLocation: 'Conference Room A, 3rd Floor',
  conditionAtCheckout: 'excellent',
  agreementAccepted: true,
  checkoutNotes: 'Includes HDMI cable and remote. Power adapter in bag pocket.',
}, ctx);

console.log(checkout.status); // "checked_out"

// Later that day — check the projector back in
const checkin = await checkoutService.checkin(checkout.id, {
  conditionAtReturn: 'excellent',
  returnNotes: 'All accessories returned. Working perfectly.',
  damageReported: false,
}, ctx);

console.log(checkin.status); // "returned"

// Reserve a vehicle for next week
const reservation = await checkoutService.reserve({
  assetId: 'asset_vehicle_van_03',
  checkoutDate: '2024-12-16T08:00:00Z',
  expectedReturnDate: '2024-12-16T17:00:00Z',
  purpose: 'Site visit to client office in Brooklyn',
  destinationLocation: 'Client site — 456 Atlantic Ave, Brooklyn NY',
  agreementAccepted: true,
}, ctx);

console.log(reservation.status); // "reserved"

// Check for overdue assets
const overdue = await checkoutService.getOverdueCheckouts(ctx);
for (const record of overdue) {
  console.log(
    `OVERDUE: ${record.assetTag} checked out by ${record.userName} ` +
    `— was due ${record.expectedReturnDate}, ` +
    `${record.daysOverdue} days overdue`,
  );
}

// Get availability calendar for a reservable asset
const availability = await checkoutService.getAvailability(
  'asset_projector_epson_01',
  {
    from: '2024-12-01',
    to: '2024-12-31',
  },
  ctx,
);

console.log(availability);
// [
//   { date: '2024-12-01', available: true },
//   { date: '2024-12-02', available: true },
//   ...
//   { date: '2024-12-10', available: false, checkoutId: '...', checkedOutBy: '...' },
//   ...
// ]
```

### Example 5: Depreciation Calculation

```typescript
import { DepreciationService } from '@mcv/operations/assets';

const depreciationService = new DepreciationService(db, ctx);

// Calculate depreciation schedule for a server
const schedule = await depreciationService.calculateSchedule({
  assetId: 'asset_server_rack_01',
  method: 'straight_line',
  costBasisCents: 1500000,   // $15,000.00
  salvageValueCents: 150000, // $1,500.00
  usefulLifeMonths: 60,      // 5 years
  startDate: '2024-01-01',
});

console.log(schedule);
// {
//   method: 'straight_line',
//   costBasisCents: 1500000,
//   salvageValueCents: 150000,
//   depreciableAmountCents: 1350000,  // $13,500.00
//   usefulLifeMonths: 60,
//   monthlyDepreciationCents: 22500,  // $225.00/month
//   startDate: '2024-01-01',
//   endDate: '2028-12-31',
//   entries: [
//     { period: '2024-01', amountCents: 22500, accumulatedCents: 22500, bookValueCents: 1477500 },
//     { period: '2024-02', amountCents: 22500, accumulatedCents: 45000, bookValueCents: 1455000 },
//     ...
//   ],
// }

// Run monthly depreciation for all assets (typically called by cron)
const results = await depreciationService.runMonthlyDepreciation(
  '2024-06', // Period: June 2024
  ctx,
);

console.log(results);
// {
//   period: '2024-06',
//   assetsProcessed: 347,
//   totalDepreciationCents: 4821500, // $48,215.00
//   entriesCreated: 347,
//   errors: [],
// }

// Post depreciation entries to the general ledger
const posted = await depreciationService.postToLedger('2024-06', ctx);
console.log(posted.journalEntriesCreated); // 347

// Get current book value of an asset
const bookValue = await depreciationService.getCurrentBookValue(
  'asset_server_rack_01',
  ctx,
);
console.log(bookValue);
// {
//   assetId: 'asset_server_rack_01',
//   originalCostCents: 1500000,
//   accumulatedDepreciationCents: 135000, // 6 months × $225
//   currentBookValueCents: 1365000,       // $13,650.00
//   percentDepreciated: 10,
//   remainingLifeMonths: 54,
// }

// Double-declining balance example
const vehicleSchedule = await depreciationService.calculateSchedule({
  assetId: 'asset_vehicle_truck_01',
  method: 'double_declining',
  costBasisCents: 4500000,   // $45,000.00
  salvageValueCents: 500000, // $5,000.00
  usefulLifeMonths: 60,      // 5 years
  startDate: '2024-01-01',
});

// Year 1: 40% × $45,000 = $18,000 depreciation
// Year 2: 40% × $27,000 = $10,800 depreciation
// Year 3: 40% × $16,200 = $6,480 depreciation
// ... (switches to straight-line when SL > DDB)
```

### Example 6: Inventory Management

```typescript
import { InventoryService } from '@mcv/operations/assets';

const inventoryService = new InventoryService(db, ctx);

// Create an inventory item for printer toner
const toner = await inventoryService.create({
  name: 'HP 26X High Yield Black Toner',
  sku: 'HP-CF226X',
  description: 'High yield black toner cartridge for HP LaserJet Pro M402/M426 series',
  unitOfMeasure: 'each',
  quantityOnHand: 12,
  reorderPoint: 3,
  reorderQuantity: 10,
  maxQuantity: 25,
  unitCostCents: 8999, // $89.99
  currency: 'USD',
  location: 'Supply Room B, Shelf 3-A',
  vendorId: 'vendor_office_depot',
  vendorPartNumber: 'ODP-7823451',
  leadTimeDays: 3,
  barcode: '0889894068507',
}, ctx);

// Record consumption (used for a work order)
await inventoryService.recordTransaction({
  inventoryItemId: toner.id,
  transactionType: 'consumed',
  quantity: -1,
  referenceId: 'wo_2024_00089',
  referenceType: 'work_order',
  reason: 'Replaced toner in lobby printer (WO-2024-00089)',
}, ctx);

// Check stock after consumption
const stock = await inventoryService.getById(toner.id, ctx);
console.log(stock.quantityOnHand);    // 11
console.log(stock.quantityAvailable); // 11
console.log(stock.isLowStock);        // false

// Record receiving stock from a purchase order
await inventoryService.recordTransaction({
  inventoryItemId: toner.id,
  transactionType: 'received',
  quantity: 10,
  referenceId: 'po_2024_00567',
  referenceType: 'purchase_order',
  reason: 'Received from Office Depot (PO-2024-00567)',
  unitCostCents: 8499, // Got a discount: $84.99 each
}, ctx);

// Physical count adjustment (found 2 fewer than expected)
await inventoryService.recordTransaction({
  inventoryItemId: toner.id,
  transactionType: 'adjusted',
  quantity: -2,
  reason: 'Physical inventory count correction — Q4 audit',
}, ctx);

// Check items that need reordering
const lowStockItems = await inventoryService.getLowStockItems(ctx);
for (const item of lowStockItems) {
  console.log(
    `LOW STOCK: ${item.name} (SKU: ${item.sku}) — ` +
    `${item.quantityOnHand} on hand, reorder point: ${item.reorderPoint}`,
  );
}

// Generate a purchase requisition for low-stock items
const requisition = await inventoryService.generateRequisition(
  lowStockItems.map((item) => ({
    inventoryItemId: item.id,
    quantity: item.reorderQuantity,
    vendorId: item.vendorId,
    estimatedCostCents: item.unitCostCents
      ? item.unitCostCents * item.reorderQuantity
      : null,
  })),
  ctx,
);

console.log(requisition.id); // Sent to procurement module
```

### Example 7: Asset Categories with Custom Fields

```typescript
import { AssetCategoryService, AssetService } from '@mcv/operations/assets';

const categoryService = new AssetCategoryService(db, ctx);
const assetService = new AssetService(db, ctx);

// Create a category hierarchy
const itEquipment = await categoryService.create({
  name: 'IT Equipment',
  slug: 'it-equipment',
  description: 'All information technology hardware',
  icon: 'computer',
  color: '#3B82F6',
  defaultDepreciationMethod: 'straight_line',
  defaultUsefulLifeMonths: 36,
}, ctx);

const laptops = await categoryService.create({
  name: 'Laptops',
  slug: 'laptops',
  parentId: itEquipment.id,
  description: 'Portable computers',
  icon: 'laptop',
  color: '#6366F1',
  defaultDepreciationMethod: 'straight_line',
  defaultUsefulLifeMonths: 36,
  defaultIsReservable: false,
  
  // Define custom fields specific to laptops
  customFieldDefinitions: [
    {
      key: 'cpu',
      label: 'Processor',
      type: 'text',
      required: true,
      helpText: 'e.g., Apple M3 Max, Intel i7-13700H',
      sortOrder: 0,
      defaultValue: null,
      options: null,
      min: null,
      max: null,
      pattern: null,
    },
    {
      key: 'ram_gb',
      label: 'RAM (GB)',
      type: 'number',
      required: true,
      min: 4,
      max: 256,
      helpText: 'Installed RAM in gigabytes',
      sortOrder: 1,
      defaultValue: null,
      options: null,
      pattern: null,
    },
    {
      key: 'storage_gb',
      label: 'Storage (GB)',
      type: 'number',
      required: true,
      min: 128,
      max: 8000,
      sortOrder: 2,
      defaultValue: null,
      options: null,
      helpText: null,
      pattern: null,
      max: null,
      min: null,
    },
    {
      key: 'os',
      label: 'Operating System',
      type: 'select',
      required: true,
      options: ['macOS', 'Windows 11', 'Windows 10', 'Ubuntu', 'ChromeOS'],
      sortOrder: 3,
      defaultValue: null,
      helpText: null,
      pattern: null,
      min: null,
      max: null,
    },
    {
      key: 'display_size',
      label: 'Display Size',
      type: 'text',
      required: false,
      helpText: 'e.g., 14", 15.6", 16.2"',
      sortOrder: 4,
      defaultValue: null,
      options: null,
      pattern: null,
      min: null,
      max: null,
    },
    {
      key: 'has_touchscreen',
      label: 'Touchscreen',
      type: 'boolean',
      required: false,
      defaultValue: false,
      sortOrder: 5,
      options: null,
      helpText: null,
      pattern: null,
      min: null,
      max: null,
    },
  ],
}, ctx);

// Get the full category tree
const tree = await categoryService.getTree(ctx);
// [
//   {
//     name: 'IT Equipment',
//     assetCount: 342,
//     children: [
//       { name: 'Laptops', assetCount: 156, children: [] },
//       { name: 'Desktops', assetCount: 89, children: [] },
//       { name: 'Monitors', assetCount: 97, children: [] },
//     ],
//   },
//   {
//     name: 'Furniture',
//     assetCount: 450,
//     children: [...],
//   },
// ]

// When creating an asset, custom fields are validated against the category definition
const newLaptop = await assetService.create({
  name: 'ThinkPad X1 Carbon Gen 11',
  categoryId: laptops.id,
  serialNumber: 'PF4ABCDE',
  manufacturer: 'Lenovo',
  model: 'X1 Carbon Gen 11',
  purchasePriceCents: 189900,
  customFields: {
    cpu: 'Intel i7-1365U',
    ram_gb: 32,
    storage_gb: 512,
    os: 'Windows 11',
    display_size: '14"',
    has_touchscreen: true,
  },
}, ctx);
// If required fields are missing or values are invalid, throws ASSET_CUSTOM_FIELD_VALIDATION_ERROR
```

### Example 8: Bulk Import and Reporting

```typescript
import { AssetImportService, AssetReportingService } from '@mcv/operations/assets';

const importService = new AssetImportService(db, ctx);
const reportingService = new AssetReportingService(db, ctx);

// Bulk import assets from CSV
const importResult = await importService.importFromCsv({
  fileUrl: 'https://storage.example.com/imports/assets-q4-2024.csv',
  categoryId: 'cat_it_laptops',
  defaultStatus: 'received',
  defaultCondition: 'new',
  columnMapping: {
    name: 'Asset Name',
    serialNumber: 'Serial #',
    manufacturer: 'Brand',
    model: 'Model',
    purchaseDate: 'Purchase Date',
    purchasePriceCents: 'Cost (cents)',
    location: 'Location',
    'customFields.cpu': 'Processor',
    'customFields.ram_gb': 'RAM (GB)',
    'customFields.storage_gb': 'Storage (GB)',
    'customFields.os': 'OS',
  },
  skipDuplicateSerialNumbers: true,
  dryRun: false,
}, ctx);

console.log(importResult);
// {
//   totalRows: 50,
//   imported: 47,
//   skipped: 2,   // Duplicate serial numbers
//   errors: 1,    // Invalid data in row 23
//   errorDetails: [
//     { row: 23, field: 'purchasePriceCents', message: 'Must be a positive integer' },
//   ],
//   assets: [...], // The 47 created assets
// }

// Generate a comprehensive valuation report
const valuation = await reportingService.getValuationReport(ctx);
console.log(valuation);
// {
//   asOf: '2024-12-10T00:00:00Z',
//   totalPurchaseCostCents: 285400000,  // $2,854,000.00
//   totalDepreciationCents: 95130000,   // $951,300.00
//   totalBookValueCents: 190270000,     // $1,902,700.00
//   byCategory: [
//     { categoryName: 'Laptops', assetCount: 156, bookValueCents: 45200000 },
//     { categoryName: 'Servers', assetCount: 24, bookValueCents: 89500000 },
//     { categoryName: 'Vehicles', assetCount: 12, bookValueCents: 32400000 },
//     ...
//   ],
// }

// Asset utilization report (for reservable assets)
const utilization = await reportingService.getUtilizationReport({
  periodStart: '2024-10-01',
  periodEnd: '2024-12-31',
}, ctx);

console.log(utilization.summary);
// {
//   totalReservableAssets: 45,
//   averageUtilizationRate: 62.4, // 62.4% average utilization
//   mostUtilizedAssetId: 'asset_projector_epson_01',
//   leastUtilizedAssetId: 'asset_camera_canon_03',
// }

// Maintenance cost report
const maintenanceCosts = await reportingService.getMaintenanceCostReport({
  periodStart: '2024-01-01',
  periodEnd: '2024-12-31',
}, ctx);

console.log(maintenanceCosts.preventiveVsCorrective);
// {
//   preventiveCount: 234,
//   preventiveCostCents: 12500000,  // $125,000
//   correctiveCount: 67,
//   correctiveCostCents: 8900000,   // $89,000
// }

// Depreciation report for a specific period
const depreciationReport = await reportingService.getDepreciationReport(
  '2024-11', // November 2024
  ctx,
);

console.log(depreciationReport.totalDepreciationCents); // $48,215.00
console.log(depreciationReport.newlyFullyDepreciated.length); // 3 assets fully depreciated
```

---

## Error Codes

All errors thrown by `@mcv/operations/assets` use the standard MCV error format with a `code` field for programmatic handling.

| Code | HTTP | Description |
|---|---|---|
| `ASSET_NOT_FOUND` | 404 | Asset with the given ID or tag does not exist |
| `ASSET_TAG_CONFLICT` | 409 | The asset tag is already in use within this organization |
| `ASSET_BARCODE_CONFLICT` | 409 | The barcode is already assigned to another asset in this organization |
| `ASSET_SERIAL_NUMBER_CONFLICT` | 409 | A duplicate serial number exists (when uniqueness is enforced) |
| `ASSET_INVALID_STATUS_TRANSITION` | 400 | The requested status change is not valid from the current status (e.g., cannot retire a disposed asset) |
| `ASSET_ALREADY_CHECKED_OUT` | 409 | The asset is currently checked out and cannot be checked out again |
| `ASSET_NOT_RESERVABLE` | 400 | The asset is not marked as reservable — check-out/reservation not allowed |
| `ASSET_NOT_AVAILABLE` | 409 | The asset is not in an available state (maintenance, retired, etc.) |
| `ASSET_CHECKOUT_OVERDUE` | 400 | The checkout has exceeded its expected return date |
| `ASSET_CHECKOUT_NOT_FOUND` | 404 | No active checkout record found for this asset |
| `ASSET_CATEGORY_NOT_FOUND` | 404 | Asset category does not exist |
| `ASSET_CATEGORY_HAS_ASSETS` | 409 | Cannot delete a category that has assets assigned to it |
| `ASSET_CATEGORY_HAS_CHILDREN` | 409 | Cannot delete a category that has child categories |
| `ASSET_CATEGORY_CIRCULAR_PARENT` | 400 | Setting this parent would create a circular reference in the category hierarchy |
| `ASSET_CUSTOM_FIELD_VALIDATION_ERROR` | 400 | Custom field value does not match the field definition (wrong type, out of range, missing required field) |
| `ASSET_CUSTOM_FIELD_LIMIT_EXCEEDED` | 400 | Maximum number of custom fields per category exceeded |
| `LICENSE_NOT_FOUND` | 404 | License record does not exist |
| `LICENSE_NO_AVAILABLE_SEATS` | 409 | All seats are assigned — cannot assign another user |
| `LICENSE_ALREADY_ASSIGNED` | 409 | This user/asset already has an active assignment for this license |
| `LICENSE_ASSIGNMENT_NOT_FOUND` | 404 | No active assignment found for the given user and license |
| `LICENSE_EXPIRED` | 400 | The license has expired and cannot accept new assignments |
| `LICENSE_KEY_REQUIRED` | 400 | License key is required for this license type but was not provided |
| `WORK_ORDER_NOT_FOUND` | 404 | Work order does not exist |
| `WORK_ORDER_INVALID_STATUS_TRANSITION` | 400 | Invalid work order status change (e.g., cannot complete a draft) |
| `WORK_ORDER_ALREADY_COMPLETED` | 409 | The work order has already been completed or cancelled |
| `WORK_ORDER_INCOMPLETE_CHECKLIST` | 400 | Required checklist items must be completed before closing the work order |
| `MAINTENANCE_SCHEDULE_NOT_FOUND` | 404 | Maintenance schedule does not exist |
| `DEPRECIATION_ALREADY_CALCULATED` | 409 | Depreciation entry already exists for this asset and period |
| `DEPRECIATION_INVALID_METHOD` | 400 | Unsupported depreciation method specified |
| `DEPRECIATION_MISSING_PARAMETERS` | 400 | Required depreciation parameters are missing (cost basis, useful life, etc.) |
| `DEPRECIATION_ALREADY_POSTED` | 409 | This depreciation entry has already been posted to the general ledger |
| `DEPRECIATION_ASSET_NOT_DEPRECIABLE` | 400 | Asset does not have depreciation method or useful life configured |
| `INVENTORY_NOT_FOUND` | 404 | Inventory item does not exist |
| `INVENTORY_INSUFFICIENT_STOCK` | 409 | Insufficient stock to complete the transaction |
| `INVENTORY_NEGATIVE_QUANTITY` | 400 | Transaction would result in negative stock quantity |
| `INVENTORY_SKU_CONFLICT` | 409 | SKU is already in use by another inventory item |
| `INVENTORY_EXCEEDS_MAX_QUANTITY` | 400 | Receiving this quantity would exceed the maximum stock level |
| `ASSET_IMPORT_INVALID_FORMAT` | 400 | Import file format is not supported (expected CSV or XLSX) |
| `ASSET_IMPORT_COLUMN_MAPPING_ERROR` | 400 | Required columns are missing from the import file |
| `ASSET_IMPORT_ROW_ERROR` | 400 | One or more rows in the import file contain invalid data |
| `ASSET_RESERVATION_CONFLICT` | 409 | The requested reservation period overlaps with an existing reservation |
| `ASSET_PERMISSION_DENIED` | 403 | User does not have permission to perform this operation |

### Error Response Format

```typescript
{
  code: 'ASSET_NOT_FOUND',
  message: 'Asset with ID "a1b2c3d4-..." not found',
  statusCode: 404,
  details: {
    assetId: 'a1b2c3d4-...',
  },
}
```

### Handling Errors

```typescript
import { TRPCError } from '@trpc/server';
import { AssetErrorCode } from '@mcv/operations/assets';

try {
  await assetService.checkout({
    assetId: 'asset_projector_01',
    // ...
  }, ctx);
} catch (error) {
  if (error instanceof TRPCError) {
    switch (error.code) {
      case 'NOT_FOUND':
        // Asset doesn't exist
        break;
      case 'CONFLICT':
        // Asset already checked out
        const details = JSON.parse(error.message);
        if (details.code === 'ASSET_ALREADY_CHECKED_OUT') {
          console.log(`Asset is checked out by ${details.checkedOutBy} until ${details.expectedReturnDate}`);
        }
        break;
      case 'BAD_REQUEST':
        // Asset not reservable, invalid state, etc.
        break;
    }
  }
}
```

---

## Security

### Authentication & Authorization

All `@mcv/operations/assets` endpoints require authentication via the standard MCV.ONE session mechanism. Authorization is enforced at both the router and service layers.

#### Permission Model

```typescript
// Permission definitions
const ASSET_PERMISSIONS = {
  // Basic access
  'assets.view':               'View assets and asset details',
  'assets.create':             'Create new assets',
  'assets.update':             'Update existing asset information',
  'assets.delete':             'Delete (dispose) assets',
  'assets.transfer':           'Transfer assets between locations/departments',
  'assets.retire':             'Retire assets from active service',
  'assets.dispose':            'Dispose of retired assets',
  
  // Checkout
  'assets.checkout':           'Check out reservable assets',
  'assets.checkin':            'Check in returned assets',
  
  // Maintenance
  'assets.maintenance.view':   'View maintenance schedules and work orders',
  'assets.maintenance.manage': 'Create/update maintenance schedules and work orders',
  
  // Licenses
  'assets.licenses.view':     'View license records and assignments',
  'assets.licenses.manage':   'Create/update licenses and manage seat assignments',
  
  // Inventory
  'assets.inventory.view':    'View inventory items and stock levels',
  'assets.inventory.manage':  'Manage inventory, record transactions, set reorder points',
  
  // Depreciation
  'assets.depreciation.view': 'View depreciation schedules and entries',
  'assets.depreciation.manage': 'Configure depreciation, run calculations, post to ledger',
  
  // Reporting
  'assets.reports.view':      'Access asset reports (valuation, utilization, etc.)',
  
  // Import/Export
  'assets.import':            'Bulk import assets from CSV/Excel',
  'assets.export':            'Export asset data to CSV/Excel',
  
  // Admin
  'assets.admin':             'Full access to all asset management features',
} as const;
```

#### Role-Based Access Examples

```typescript
// Standard role configurations
const ASSET_ROLES = {
  // Can view and check out assets
  'asset_viewer': [
    'assets.view',
    'assets.checkout',
    'assets.checkin',
    'assets.maintenance.view',
    'assets.licenses.view',
    'assets.inventory.view',
  ],
  
  // Can manage assets day-to-day
  'asset_manager': [
    'assets.view',
    'assets.create',
    'assets.update',
    'assets.transfer',
    'assets.checkout',
    'assets.checkin',
    'assets.maintenance.view',
    'assets.maintenance.manage',
    'assets.licenses.view',
    'assets.licenses.manage',
    'assets.inventory.view',
    'assets.inventory.manage',
    'assets.reports.view',
    'assets.import',
    'assets.export',
  ],
  
  // Full control including financial operations
  'asset_admin': [
    'assets.admin', // Grants all permissions
  ],
};
```

### Data Protection

#### Multi-Tenant Isolation

All database queries are scoped by `org_id` through Supabase Row Level Security (RLS). This provides defense-in-depth:

1. **Application Layer** — The service context (`ctx.orgId`) is injected into every query
2. **Database Layer** — RLS policies enforce `org_id` matching even if application code has bugs
3. **API Layer** — The tRPC router validates the session and extracts `orgId` before calling services

```typescript
// Example: How tenant context flows through the stack
// 1. tRPC middleware extracts org from session
const assetRouter = router({
  list: protectedProcedure
    .input(assetFilterSchema)
    .query(async ({ ctx, input }) => {
      // ctx.orgId is set by auth middleware
      // 2. Service uses ctx.orgId for all queries
      return assetService.list(input, ctx);
    }),
});

// 3. Service sets RLS context before querying
class AssetService {
  async list(filter: AssetFilter, ctx: ServiceContext) {
    await this.db.execute(
      sql`SET LOCAL app.current_org_id = ${ctx.orgId}`,
    );
    // All subsequent queries are automatically filtered by org_id
    return this.db.select().from(assets).where(/* filters */);
  }
}
```

#### Sensitive Data Handling

- **License Keys** — Stored encrypted at rest using Supabase Vault. Only users with `assets.licenses.manage` permission can view the full key. Others see a masked version (e.g., `****-****-****-ABCD`).
- **Financial Data** — Asset costs, depreciation entries, and disposal proceeds are stored as integers (cents) to avoid floating-point precision issues.
- **Audit Trail** — All modifications to assets generate `asset_activities` records with the performing user, timestamp, IP address, and field-level changes. Activity records are append-only (no updates or deletes).
- **Soft Deletes** — Assets are never hard-deleted. The lifecycle goes through `retired` → `disposed`, preserving all historical data for compliance and audit.

#### Input Validation

All inputs are validated using Zod schemas before reaching the service layer:

```typescript
// Example: Asset creation validation
const assetInsertSchema = z.object({
  name: z.string().min(1).max(255).trim(),
  description: z.string().max(5000).nullish(),
  categoryId: z.string().uuid(),
  status: z.enum(['ordered', 'received']).default('received'),
  condition: assetConditionEnum.default('new'),
  serialNumber: z.string().max(255).nullish(),
  manufacturer: z.string().max(255).nullish(),
  model: z.string().max(255).nullish(),
  yearManufactured: z.number().int().min(1900).max(2100).nullish(),
  purchaseDate: z.string().datetime().nullish(),
  purchasePriceCents: z.number().int().nonnegative().nullish(),
  currency: z.string().length(3).default('USD'),
  // ... additional fields with appropriate constraints
  customFields: z.record(z.string(), z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string()),
    z.null(),
  ])).default({}),
});
```

#### Rate Limiting

- **Standard endpoints** — 100 requests/minute per user
- **Search endpoints** — 30 requests/minute per user (full-text search is expensive)
- **Import endpoints** — 5 requests/hour per user (bulk operations)
- **Report endpoints** — 10 requests/minute per user (complex aggregations)

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `SUPABASE_URL` | Yes | — | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | — | Supabase service role key (for server-side operations, cron jobs) |
| `SUPABASE_ANON_KEY` | Yes | — | Supabase anonymous key (for client-side, RLS-protected access) |
| `DATABASE_URL` | Yes | — | Direct PostgreSQL connection string for Drizzle ORM |
| `ASSET_TAG_PREFIX` | No | `AST` | Prefix for auto-generated asset tags (e.g., `AST-00001`) |
| `ASSET_TAG_LENGTH` | No | `5` | Number of digits in asset tag (zero-padded) |
| `ASSET_DEFAULT_CURRENCY` | No | `USD` | Default currency code for new assets |
| `ASSET_IMAGE_BUCKET` | No | `asset-images` | Supabase Storage bucket for asset images |
| `ASSET_DOCUMENT_BUCKET` | No | `asset-documents` | Supabase Storage bucket for asset documents |
| `ASSET_IMAGE_MAX_SIZE_MB` | No | `10` | Maximum upload size for asset images |
| `ASSET_IMPORT_MAX_ROWS` | No | `5000` | Maximum rows allowed in a single import file |
| `DEPRECIATION_AUTO_POST` | No | `false` | Automatically post depreciation entries to the general ledger |
| `CHECKOUT_MAX_DURATION_DAYS` | No | `30` | Maximum checkout duration in days |
| `CHECKOUT_OVERDUE_GRACE_HOURS` | No | `24` | Hours after expected return before marking as overdue |
| `INVENTORY_LOW_STOCK_NOTIFY` | No | `true` | Send notifications when inventory drops below reorder point |
| `LICENSE_RENEWAL_NOTICE_DAYS` | No | `30` | Days before license expiration to send renewal notices |
| `LICENSE_COMPLIANCE_CHECK_ENABLED` | No | `true` | Enable automatic compliance status recalculation |
| `MAINTENANCE_OVERDUE_NOTIFY` | No | `true` | Send notifications for overdue maintenance schedules |
| `ASSET_SEARCH_MIN_QUERY_LENGTH` | No | `2` | Minimum characters required for asset search queries |
| `WORK_ORDER_NUMBER_PREFIX` | No | `WO` | Prefix for auto-generated work order numbers |
| `WORK_ORDER_REQUIRE_APPROVAL` | No | `false` | Require manager approval before work orders can be scheduled |

---

## Dependencies

### Internal Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@mcv/core` | `^0.12.0` | Module system, base types, error handling |
| `@mcv/db` | `^0.12.0` | Database connection, Drizzle ORM setup, transaction helpers |
| `@mcv/auth` | `^0.12.0` | Authentication context, session management |
| `@mcv/permissions` | `^0.12.0` | Permission checking, role-based access control |
| `@mcv/notifications` | `^0.12.0` | Alert delivery (email, push, in-app) for overdue, low stock, etc. |
| `@mcv/storage` | `^0.12.0` | File upload/download for asset images and documents |
| `@mcv/audit` | `^0.12.0` | Audit log infrastructure, activity recording |
| `@mcv/events` | `^0.12.0` | Domain event bus for cross-module communication |

### External Dependencies

| Package | Version | Purpose |
|---|---|---|
| `drizzle-orm` | `^0.34.0` | Type-safe SQL query builder and ORM |
| `@trpc/server` | `^10.45.0` | Type-safe API router |
| `zod` | `^3.23.0` | Runtime schema validation |
| `date-fns` | `^3.6.0` | Date manipulation for schedules, depreciation periods |
| `csv-parse` | `^5.5.0` | CSV parsing for bulk asset imports |
| `xlsx` | `^0.18.0` | Excel file parsing for bulk imports |
| `nanoid` | `^5.0.0` | Short unique ID generation for asset tags |

### Peer Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@supabase/supabase-js` | `^2.45.0` | Supabase client for storage and real-time subscriptions |
| `react` | `^18.3.0` | React hooks (optional — only needed for client-side hooks) |
| `@trpc/react-query` | `^10.45.0` | tRPC React integration (optional — client hooks) |
| `@tanstack/react-query` | `^5.50.0` | Data fetching / caching (optional — client hooks) |

### Optional Integration Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@mcv/finance` | `^0.12.0` | Journal entries for depreciation, asset capitalization |
| `@mcv/people` | `^0.12.0` | Employee lookups for custodian assignment, offboarding |
| `@mcv/procurement` | `^0.12.0` | Purchase order linking, vendor management |

---

## Testing

### Test Setup

```typescript
// tests/setup.ts
import { createTestContext, createTestDb } from '@mcv/testing';
import { migrate } from './migrations';

let db: TestDatabase;
let ctx: TestContext;

beforeAll(async () => {
  db = await createTestDb({
    schemas: ['operations_assets'],
    seed: false,
  });
  await migrate(db);
});

beforeEach(async () => {
  ctx = createTestContext({
    orgId: 'test-org-001',
    userId: 'test-user-001',
    permissions: ['assets.admin'],
  });
  await db.truncateAll();
});

afterAll(async () => {
  await db.close();
});
```

### Unit Tests

```typescript
// tests/services/asset.service.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { AssetService } from '../../src/services/asset.service';
import { createTestContext, createTestDb } from '@mcv/testing';

describe('AssetService', () => {
  let service: AssetService;
  let ctx: TestContext;

  beforeEach(async () => {
    service = new AssetService(db, ctx);
    // Seed a test category
    await seedCategory(db, {
      id: 'cat-laptops',
      orgId: ctx.orgId,
      name: 'Laptops',
      slug: 'laptops',
    });
  });

  describe('create', () => {
    it('should create an asset with auto-generated tag', async () => {
      const asset = await service.create({
        name: 'Test Laptop',
        categoryId: 'cat-laptops',
        condition: 'new',
      }, ctx);

      expect(asset.id).toBeDefined();
      expect(asset.assetTag).toMatch(/^AST-\d{5}$/);
      expect(asset.name).toBe('Test Laptop');
      expect(asset.status).toBe('received');
      expect(asset.orgId).toBe(ctx.orgId);
    });

    it('should validate required fields', async () => {
      await expect(
        service.create({ name: '', categoryId: 'cat-laptops' }, ctx),
      ).rejects.toThrow();
    });

    it('should validate custom fields against category definition', async () => {
      await updateCategoryWithCustomFields(db, 'cat-laptops', [
        { key: 'cpu', label: 'CPU', type: 'text', required: true },
      ]);

      // Missing required custom field
      await expect(
        service.create({
          name: 'Test Laptop',
          categoryId: 'cat-laptops',
          customFields: {},
        }, ctx),
      ).rejects.toThrow('ASSET_CUSTOM_FIELD_VALIDATION_ERROR');

      // Valid custom field
      const asset = await service.create({
        name: 'Test Laptop',
        categoryId: 'cat-laptops',
        customFields: { cpu: 'M3 Max' },
      }, ctx);
      expect(asset.customFields.cpu).toBe('M3 Max');
    });

    it('should generate unique asset tags', async () => {
      const asset1 = await service.create({
        name: 'Laptop 1', categoryId: 'cat-laptops',
      }, ctx);
      const asset2 = await service.create({
        name: 'Laptop 2', categoryId: 'cat-laptops',
      }, ctx);

      expect(asset1.assetTag).not.toBe(asset2.assetTag);
    });

    it('should log creation activity', async () => {
      const asset = await service.create({
        name: 'Test Laptop', categoryId: 'cat-laptops',
      }, ctx);

      const activities = await db.select()
        .from(assetActivities)
        .where(eq(assetActivities.assetId, asset.id));

      expect(activities).toHaveLength(1);
      expect(activities[0].activityType).toBe('created');
      expect(activities[0].performedBy).toBe(ctx.userId);
    });
  });

  describe('lifecycle transitions', () => {
    let asset: Asset;

    beforeEach(async () => {
      asset = await service.create({
        name: 'Test Asset',
        categoryId: 'cat-laptops',
        status: 'received',
      }, ctx);
    });

    it('should deploy a received asset', async () => {
      const deployed = await service.deploy(asset.id, {
        custodianId: 'user-jane',
        location: 'Desk 42',
      }, ctx);

      expect(deployed.status).toBe('assigned');
      expect(deployed.custodianId).toBe('user-jane');
      expect(deployed.location).toBe('Desk 42');
    });

    it('should reject invalid status transitions', async () => {
      // Cannot retire a received asset directly
      await expect(
        service.retire(asset.id, 'test', ctx),
      ).rejects.toThrow('ASSET_INVALID_STATUS_TRANSITION');

      // Cannot dispose a non-retired asset
      await expect(
        service.dispose(asset.id, { disposalMethod: 'recycled' }, ctx),
      ).rejects.toThrow('ASSET_INVALID_STATUS_TRANSITION');
    });

    it('should track the full lifecycle', async () => {
      // received → active → assigned → in_maintenance → active → retired → disposed
      await service.deploy(asset.id, { custodianId: 'user-1' }, ctx);
      await service.sendToMaintenance(asset.id, 'wo-1', ctx);
      await service.returnFromMaintenance(asset.id, ctx);
      await service.retire(asset.id, 'End of life', ctx);
      await service.dispose(asset.id, {
        disposalMethod: 'recycled',
        disposalProceedsCents: 0,
      }, ctx);

      const final = await service.getById(asset.id);
      expect(final!.status).toBe('disposed');
      expect(final!.disposedDate).toBeDefined();

      const activities = await db.select()
        .from(assetActivities)
        .where(eq(assetActivities.assetId, asset.id))
        .orderBy(assetActivities.createdAt);

      expect(activities.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('search', () => {
    it('should search across name, description, serial number', async () => {
      await service.create({
        name: 'MacBook Pro',
        serialNumber: 'C02ABC123',
        categoryId: 'cat-laptops',
      }, ctx);
      await service.create({
        name: 'ThinkPad X1',
        description: 'Carbon fiber laptop',
        categoryId: 'cat-laptops',
      }, ctx);

      const results = await service.search('MacBook', {}, ctx);
      expect(results.items).toHaveLength(1);
      expect(results.items[0].name).toBe('MacBook Pro');

      const results2 = await service.search('carbon', {}, ctx);
      expect(results2.items).toHaveLength(1);
      expect(results2.items[0].name).toBe('ThinkPad X1');

      const results3 = await service.search('C02ABC', {}, ctx);
      expect(results3.items).toHaveLength(1);
    });
  });
});
```

### Integration Tests

```typescript
// tests/integration/depreciation.test.ts
import { describe, it, expect } from 'vitest';
import { DepreciationService } from '../../src/services/depreciation.service';
import { AssetService } from '../../src/services/asset.service';

describe('DepreciationService (Integration)', () => {
  let depreciationService: DepreciationService;
  let assetService: AssetService;

  describe('straight-line depreciation', () => {
    it('should calculate correct monthly amounts', async () => {
      const asset = await assetService.create({
        name: 'Test Server',
        categoryId: 'cat-servers',
        purchasePriceCents: 1200000, // $12,000
        depreciationMethod: 'straight_line',
        usefulLifeMonths: 60,
        salvageValueCents: 0,
        inServiceDate: '2024-01-01',
      }, ctx);

      const schedule = await depreciationService.calculateSchedule({
        assetId: asset.id,
        method: 'straight_line',
        costBasisCents: 1200000,
        salvageValueCents: 0,
        usefulLifeMonths: 60,
        startDate: '2024-01-01',
      });

      // $12,000 / 60 months = $200/month
      expect(schedule.entries[0].amountCents).toBe(20000);
      expect(schedule.entries[59].accumulatedCents).toBe(1200000);
      expect(schedule.entries[59].bookValueCents).toBe(0);
    });
  });

  describe('monthly depreciation run', () => {
    it('should process all depreciable assets', async () => {
      // Create 3 depreciable assets
      for (let i = 0; i < 3; i++) {
        await assetService.create({
          name: `Server ${i}`,
          categoryId: 'cat-servers',
          purchasePriceCents: 1000000,
          depreciationMethod: 'straight_line',
          usefulLifeMonths: 60,
          salvageValueCents: 100000,
          inServiceDate: '2024-01-01',
          status: 'active',
        }, ctx);
      }

      const result = await depreciationService.runMonthlyDepreciation(
        '2024-01',
        ctx,
      );

      expect(result.assetsProcessed).toBe(3);
      expect(result.entriesCreated).toBe(3);
      // ($1,000,000 - $100,000) / 60 = $15,000/month × 3 assets
      expect(result.totalDepreciationCents).toBe(45000);
      expect(result.errors).toHaveLength(0);
    });

    it('should not double-process the same period', async () => {
      await assetService.create({
        name: 'Server',
        categoryId: 'cat-servers',
        purchasePriceCents: 1000000,
        depreciationMethod: 'straight_line',
        usefulLifeMonths: 60,
        salvageValueCents: 0,
        inServiceDate: '2024-01-01',
        status: 'active',
      }, ctx);

      await depreciationService.runMonthlyDepreciation('2024-01', ctx);

      // Running again for the same period should skip
      const result2 = await depreciationService.runMonthlyDepreciation(
        '2024-01',
        ctx,
      );
      expect(result2.assetsProcessed).toBe(0);
    });
  });
});
```

### End-to-End Tests

```typescript
// tests/e2e/checkout-flow.test.ts
import { describe, it, expect } from 'vitest';
import { createTestCaller } from '../helpers';

describe('Checkout Flow (E2E)', () => {
  it('should complete a full checkout → return cycle', async () => {
    const caller = createTestCaller({ permissions: ['assets.admin'] });

    // Create a reservable asset
    const asset = await caller.asset.create({
      name: 'Epson Projector',
      categoryId: 'cat-projectors',
      isReservable: true,
      condition: 'excellent',
    });

    // Check it out
    const checkout = await caller.checkout.checkout({
      assetId: asset.id,
      expectedReturnDate: '2024-12-15T17:00:00Z',
      purpose: 'Team meeting',
      conditionAtCheckout: 'excellent',
      agreementAccepted: true,
    });

    expect(checkout.status).toBe('checked_out');

    // Verify asset status changed
    const assetAfterCheckout = await caller.asset.getById({ id: asset.id });
    expect(assetAfterCheckout.status).toBe('checked_out');

    // Return it
    const returned = await caller.checkout.checkin({
      checkoutId: checkout.id,
      conditionAtReturn: 'good',
      returnNotes: 'Working fine, minor scuff on case',
      damageReported: false,
    });

    expect(returned.status).toBe('returned');

    // Verify asset is available again
    const assetAfterReturn = await caller.asset.getById({ id: asset.id });
    expect(assetAfterReturn.status).toBe('active');
    expect(assetAfterReturn.condition).toBe('good'); // Updated from return
  });

  it('should prevent double checkout', async () => {
    const caller = createTestCaller({ permissions: ['assets.admin'] });

    const asset = await caller.asset.create({
      name: 'Camera',
      categoryId: 'cat-cameras',
      isReservable: true,
    });

    await caller.checkout.checkout({
      assetId: asset.id,
      expectedReturnDate: '2024-12-15T17:00:00Z',
      conditionAtCheckout: 'good',
      agreementAccepted: true,
    });

    // Second checkout should fail
    await expect(
      caller.checkout.checkout({
        assetId: asset.id,
        expectedReturnDate: '2024-12-16T17:00:00Z',
        conditionAtCheckout: 'good',
        agreementAccepted: true,
      }),
    ).rejects.toThrow('ASSET_ALREADY_CHECKED_OUT');
  });

  it('should enforce permission checks', async () => {
    // User without checkout permission
    const viewerCaller = createTestCaller({
      permissions: ['assets.view'],
    });

    await expect(
      viewerCaller.checkout.checkout({
        assetId: 'some-asset-id',
        expectedReturnDate: '2024-12-15T17:00:00Z',
        conditionAtCheckout: 'good',
        agreementAccepted: true,
      }),
    ).rejects.toThrow('ASSET_PERMISSION_DENIED');
  });
});
```

### Test Utilities

```typescript
// tests/helpers/seed.ts
import { AssetCategory, Asset, License } from '../../src/types';

export async function seedCategory(
  db: TestDatabase,
  overrides: Partial<AssetCategory> = {},
): Promise<AssetCategory> {
  return db.insert(assetCategories).values({
    id: overrides.id ?? randomUUID(),
    orgId: overrides.orgId ?? 'test-org-001',
    name: overrides.name ?? 'Test Category',
    slug: overrides.slug ?? 'test-category',
    ...overrides,
  }).returning().then(r => r[0]);
}

export async function seedAsset(
  db: TestDatabase,
  overrides: Partial<Asset> = {},
): Promise<Asset> {
  const categoryId = overrides.categoryId ?? (await seedCategory(db)).id;
  return db.insert(assets).values({
    id: overrides.id ?? randomUUID(),
    orgId: overrides.orgId ?? 'test-org-001',
    assetTag: overrides.assetTag ?? `AST-${String(Math.random()).slice(2, 7)}`,
    name: overrides.name ?? 'Test Asset',
    categoryId,
    status: overrides.status ?? 'active',
    condition: overrides.condition ?? 'good',
    createdBy: 'test-user-001',
    updatedBy: 'test-user-001',
    ...overrides,
  }).returning().then(r => r[0]);
}

export async function seedLicense(
  db: TestDatabase,
  overrides: Partial<License> = {},
): Promise<License> {
  return db.insert(licenses).values({
    id: overrides.id ?? randomUUID(),
    orgId: overrides.orgId ?? 'test-org-001',
    name: overrides.name ?? 'Test License',
    licenseType: overrides.licenseType ?? 'per_seat',
    startDate: overrides.startDate ?? '2024-01-01',
    totalSeats: overrides.totalSeats ?? 10,
    createdBy: 'test-user-001',
    updatedBy: 'test-user-001',
    ...overrides,
  }).returning().then(r => r[0]);
}
```

### Running Tests

```bash
# Run all asset module tests
pnpm test --filter=@mcv/operations/assets

# Run specific test file
pnpm test --filter=@mcv/operations/assets -- tests/services/asset.service.test.ts

# Run with coverage
pnpm test --filter=@mcv/operations/assets -- --coverage

# Run integration tests only
pnpm test --filter=@mcv/operations/assets -- tests/integration/

# Run e2e tests
pnpm test --filter=@mcv/operations/assets -- tests/e2e/
```

### Coverage Requirements

| Area | Target |
|---|---|
| Statements | ≥ 90% |
| Branches | ≥ 85% |
| Functions | ≥ 90% |
| Lines | ≥ 90% |

Critical paths that must have 100% coverage:
- Asset lifecycle state transitions
- Depreciation calculations (all methods)
- License compliance checks
- Checkout/checkin flow
- Inventory stock calculations
- RLS tenant isolation
- Permission enforcement

---

*This module is part of the MCV.ONE platform. For questions or contributions, see the [MCV.ONE Development Guide](../../CONTRIBUTING.md).*