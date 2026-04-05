# @mcv/commerce/catalog

> **Tier 5 Domain Module** · Commerce · Product Catalog
> **Classification:** Publishable
> **Version:** 1.0.0
> **Status:** Stable
> **Module Path:** `@mcv/commerce/catalog`

---

## Purpose

The Product Catalog module is the foundational data layer of the MCV.ONE commerce system, responsible for managing the entire lifecycle of products and services from draft creation through publication to archival. It provides a rich, hierarchical catalog structure that supports physical goods, digital products, service offerings, and bundled packages. Every storefront, marketplace listing, and point-of-sale integration reads from this canonical catalog, making it the single source of truth for what a tenant sells, at what price, and with which attributes.

At its core, the catalog module solves the complex problem of representing infinitely variable product configurations — a single t-shirt that comes in 5 colors, 4 sizes, and 3 materials yields 60 distinct purchasable variants, each potentially with its own price, inventory level, and imagery. The module handles this combinatorial explosion through a layered variant system that inherits defaults from parent products while allowing granular overrides at any level. Pricing is equally flexible: base prices, sale prices, date-ranged promotions, customer-group discounts, volume tiers, and currency-specific overrides all compose through a deterministic rule evaluation engine that always resolves to a single unambiguous price for any given context.

Discovery and organization are first-class concerns. Products live within a hierarchical category taxonomy of unlimited depth, with support for multi-category assignment and breadcrumb generation. Full-text search leverages PostgreSQL's native `tsvector` and `pg_trgm` capabilities for typo-tolerant, relevance-ranked results. Faceted filtering enables storefront UIs to offer drill-down navigation by any combination of attributes, price ranges, and availability. The module also provides comprehensive bulk import/export pipelines for CSV and JSON, enabling merchants to manage large catalogs efficiently and migrate data from external platforms.

---

## Exports

```typescript
// @mcv/commerce/catalog — Public Export Map

// ── Core Service ──────────────────────────────────────────────
export { CatalogService }              from './services/catalog.service';
export { createCatalogRouter }         from './router';
export type { CatalogRouter }          from './router';

// ── Product ───────────────────────────────────────────────────
export { ProductService }              from './services/product.service';
export type {
  Product,
  ProductCreateInput,
  ProductUpdateInput,
  ProductStatus,
  ProductType,
  ProductListOptions,
  ProductListResult,
}                                      from './types/product';

// ── Variants & Options ────────────────────────────────────────
export { VariantService }              from './services/variant.service';
export { OptionService }               from './services/option.service';
export { SkuGenerator }                from './utils/sku-generator';
export type {
  ProductVariant,
  VariantCreateInput,
  VariantUpdateInput,
  ProductOption,
  ProductOptionValue,
  OptionCreateInput,
  SkuPattern,
}                                      from './types/variant';

// ── Categories & Taxonomy ─────────────────────────────────────
export { CategoryService }             from './services/category.service';
export { BreadcrumbBuilder }           from './utils/breadcrumb';
export type {
  Category,
  CategoryCreateInput,
  CategoryUpdateInput,
  CategoryTree,
  CategoryTreeNode,
  Breadcrumb,
  BreadcrumbSegment,
}                                      from './types/category';

// ── Pricing ───────────────────────────────────────────────────
export { PricingService }              from './services/pricing.service';
export { PriceResolver }               from './utils/price-resolver';
export type {
  PriceRule,
  PriceRuleCreateInput,
  PriceRuleUpdateInput,
  PriceRuleType,
  PriceContext,
  ResolvedPrice,
  PriceTier,
  CurrencyOverride,
}                                      from './types/pricing';

// ── Inventory Integration ─────────────────────────────────────
export { InventoryBridge }             from './services/inventory-bridge.service';
export type {
  StockLevel,
  StockCheckResult,
  LowStockAlert,
  BackorderConfig,
  PreorderConfig,
  InventoryReservation,
}                                      from './types/inventory';

// ── Product Attributes ────────────────────────────────────────
export { AttributeService }            from './services/attribute.service';
export type {
  ProductAttribute,
  AttributeDefinition,
  AttributeCreateInput,
  AttributeUpdateInput,
  AttributeValue,
  AttributeType,
  AttributeFilterConfig,
}                                      from './types/attribute';

// ── Search & Filtering ────────────────────────────────────────
export { ProductSearchService }        from './services/search.service';
export { FacetBuilder }                from './utils/facet-builder';
export type {
  ProductSearch,
  SearchQuery,
  SearchResult,
  SearchFacet,
  FacetValue,
  SearchSort,
  SearchSortField,
  SearchFilter,
  SearchFilterOperator,
}                                      from './types/search';

// ── Product Bundles ───────────────────────────────────────────
export { BundleService }               from './services/bundle.service';
export type {
  ProductBundle,
  BundleCreateInput,
  BundleUpdateInput,
  BundleItem,
  BundleItemInput,
  BundlePricingStrategy,
}                                      from './types/bundle';

// ── Digital Products ──────────────────────────────────────────
export { DigitalProductService }       from './services/digital-product.service';
export { LicenseKeyGenerator }         from './utils/license-key-generator';
export type {
  DigitalAsset,
  DigitalAssetCreateInput,
  LicenseKey,
  LicenseKeyConfig,
  DownloadToken,
  AccessPeriod,
  DrmConfig,
}                                      from './types/digital';

// ── Import / Export ───────────────────────────────────────────
export { ImportService }               from './services/import.service';
export { ExportService }               from './services/export.service';
export { ImportValidator }             from './utils/import-validator';
export type {
  ImportJob,
  ImportJobCreateInput,
  ImportJobStatus,
  ImportMapping,
  ImportConflictStrategy,
  ImportValidationResult,
  ImportError,
  ExportJob,
  ExportOptions,
  ExportFormat,
}                                      from './types/import-export';

// ── SEO ───────────────────────────────────────────────────────
export { SeoService }                  from './services/seo.service';
export { SlugGenerator }               from './utils/slug-generator';
export { JsonLdBuilder }               from './utils/json-ld-builder';
export type {
  ProductSeo,
  SeoMeta,
  OpenGraphTags,
  JsonLdProduct,
  SlugConfig,
}                                      from './types/seo';

// ── Product Images ────────────────────────────────────────────
export { ProductImageService }         from './services/product-image.service';
export type {
  ProductImage,
  ImageUploadInput,
  ImageVariantConfig,
  ImageTransform,
}                                      from './types/image';

// ── Database Schemas ──────────────────────────────────────────
export {
  products,
  productVariants,
  categories,
  categoryProducts,
  priceRules,
  productAttributes,
  attributeValues,
  productImages,
  productBundles,
  bundleItems,
  productReviewsSummary,
  importJobs,
  digitalAssets,
  licenseKeys,
}                                      from './schema';

// ── Hooks & Events ────────────────────────────────────────────
export type {
  CatalogEvent,
  ProductCreatedEvent,
  ProductUpdatedEvent,
  ProductPublishedEvent,
  ProductArchivedEvent,
  VariantCreatedEvent,
  PriceChangedEvent,
  StockChangedEvent,
  ImportCompletedEvent,
  CategoryMovedEvent,
}                                      from './events';

// ── Constants ─────────────────────────────────────────────────
export {
  CATALOG_ERROR_CODES,
  DEFAULT_PRICE_CURRENCY,
  MAX_VARIANTS_PER_PRODUCT,
  MAX_IMAGES_PER_PRODUCT,
  MAX_CATEGORIES_PER_PRODUCT,
  MAX_IMPORT_BATCH_SIZE,
  SUPPORTED_IMAGE_FORMATS,
  SLUG_MAX_LENGTH,
}                                      from './constants';
```

---

## Architecture

### Catalog Data Model

```
┌──────────────────────────────────────────────────────────────────────┐
│                        CATALOG DATA MODEL                            │
│                                                                      │
│  ┌──────────────────┐         ┌──────────────────────┐              │
│  │    categories     │         │      products        │              │
│  │──────────────────│         │──────────────────────│              │
│  │ id               │◄──┐    │ id                   │              │
│  │ tenant_id        │   │    │ tenant_id            │              │
│  │ parent_id ───────┤   │    │ name / slug          │              │
│  │ name / slug      │   │    │ description          │              │
│  │ description      │   │    │ status (d/p/a)       │              │
│  │ path (mpath)     │   │    │ type (phys/digi/     │              │
│  │ depth / position │   │    │   svc/bundle)        │              │
│  │ is_active        │   │    │ base_price / currency│              │
│  │ product_count    │   │    │ compare_at_price     │              │
│  │ image_url / icon │   │    │ vendor / brand       │              │
│  │ seo_title/desc   │   │    │ weight / dimensions  │              │
│  └────────┬─────────┘   │    │ seo_title/desc       │              │
│           │              │    │ tags[] / metadata{}  │              │
│           ▼              │    │ search_vector (tsv)  │              │
│  ┌──────────────────┐   │    └──────────┬───────────┘              │
│  │ category_products│   │               │                           │
│  │──────────────────│   │    ┌──────────┼──────────────┐           │
│  │ category_id ─────┘   │    │          │              │           │
│  │ product_id ──────────┘    ▼          ▼              ▼           │
│  │ position         │  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  └──────────────────┘  │ product_ │ │ product_ │ │ price_   │    │
│                        │ variants │ │ images   │ │ rules    │    │
│                        │──────────│ │──────────│ │──────────│    │
│                        │ id       │ │ id       │ │ id       │    │
│                        │ prod_id  │ │ prod_id  │ │ prod_id  │    │
│                        │ sku      │ │ var_id?  │ │ var_id?  │    │
│                        │ name     │ │ url      │ │ type     │    │
│                        │ price_ov │ │ alt_text │ │ value    │    │
│                        │ option_  │ │ position │ │ min/max  │    │
│                        │  values{}│ │ primary? │ │ group_id │    │
│                        │ inv_qty  │ │ w/h/fmt  │ │ currency │    │
│                        │ low_thr  │ └──────────┘ │ start/end│    │
│                        │ backord? │              │ priority │    │
│                        │ active?  │              └──────────┘    │
│                        └──────────┘                               │
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐                        │
│  │product_attributes│  │ attribute_values  │                        │
│  │──────────────────│  │──────────────────│                        │
│  │ id / tenant_id   │  │ id               │                        │
│  │ name / slug      │  │ attribute_id ────┤                        │
│  │ type (text/num/  │  │ product_id       │                        │
│  │  date/enum/multi)│  │ variant_id?      │                        │
│  │ is_filterable    │  │ value_text       │                        │
│  │ is_searchable    │  │ value_numeric    │                        │
│  │ options[]        │  │ value_date       │                        │
│  │ validation{}     │  │ value_json       │                        │
│  └──────────────────┘  └──────────────────┘                        │
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐                        │
│  │ product_bundles  │  │  bundle_items    │                        │
│  │──────────────────│  │──────────────────│                        │
│  │ id / product_id  │  │ id / bundle_id   │                        │
│  │ pricing_strategy │  │ product_id       │                        │
│  │ fixed_price      │  │ variant_id?      │                        │
│  │ discount_pct     │  │ quantity         │                        │
│  └──────────────────┘  │ is_optional      │                        │
│                        └──────────────────┘                        │
│  ┌──────────────────┐  ┌──────────────────┐                        │
│  │ digital_assets   │  │  license_keys    │                        │
│  │──────────────────│  │──────────────────│                        │
│  │ id / product_id  │  │ id / asset_id    │                        │
│  │ file_url / size  │  │ key_value (enc)  │                        │
│  │ access_type      │  │ status           │                        │
│  │ access_duration  │  │ claimed_by       │                        │
│  │ max_downloads    │  │ expires_at       │                        │
│  │ drm_config{}     │  └──────────────────┘                        │
│  └──────────────────┘                                               │
│                        ┌──────────────────┐                        │
│  ┌──────────────────┐  │  import_jobs     │                        │
│  │reviews_summary   │  │──────────────────│                        │
│  │──────────────────│  │ id / tenant_id   │                        │
│  │ product_id (PK)  │  │ status / format  │                        │
│  │ avg_rating       │  │ file_url         │                        │
│  │ review_count     │  │ mapping{}        │                        │
│  │ distribution{}   │  │ total/processed  │                        │
│  └──────────────────┘  │ success/errors   │                        │
│                        └──────────────────┘                        │
└──────────────────────────────────────────────────────────────────────┘
```

### Search Pipeline

```
 User Query: "red cotton t-shirt under $50"
        │
        ▼
 ┌─────────────────────────────┐
 │       QUERY PARSER          │
 │  • Tokenize → "red",       │
 │    "cotton", "t-shirt"     │
 │  • Extract price → max $50 │
 │  • Typo tolerance (trgm)   │
 └──────────────┬──────────────┘
                │
                ▼
 ┌─────────────────────────────┐
 │       FILTER CHAIN          │
 │  1. tenant_id = ctx (RLS)   │
 │  2. status = 'published'    │
 │  3. category intersection   │
 │  4. price BETWEEN min/max   │
 │  5. attribute color = red   │
 │  6. in_stock check          │
 └──────────────┬──────────────┘
                │
                ▼
 ┌─────────────────────────────┐
 │    FULL-TEXT SEARCH         │
 │  • tsvector @@ tsquery     │
 │    (weighted: A=name,      │
 │     B=short_desc, C=desc)  │
 │  • pg_trgm similarity      │
 │    fallback (threshold 0.3)│
 └──────────────┬──────────────┘
                │
                ▼
 ┌─────────────────────────────┐
 │     RANKING ENGINE          │
 │  score =                    │
 │   ts_rank * 0.4 +          │
 │   similarity * 0.2 +       │
 │   popularity * 0.2 +       │
 │   recency * 0.1 +          │
 │   rating * 0.1             │
 └──────────────┬──────────────┘
                │
                ▼
 ┌─────────────────────────────┐
 │     FACET AGGREGATOR        │
 │  Categories: Tops(45)       │
 │  Color: red(12) blue(8)     │
 │  Size: S(5) M(20) L(15)    │
 │  Price: $0-25(8) $25-50(22)│
 │  In Stock: yes(35) pre(3)  │
 └──────────────┬──────────────┘
                │
                ▼
 ┌─────────────────────────────┐
 │    RESPONSE BUILDER         │
 │  { products, facets, total, │
 │    page, suggestions }      │
 └─────────────────────────────┘
```

---

## Core Interfaces

### Product

```typescript
type ProductStatus = 'draft' | 'published' | 'archived';
type ProductType = 'physical' | 'digital' | 'service' | 'bundle';

interface Product {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  status: ProductStatus;
  type: ProductType;
  basePrice: number;                   // smallest currency unit (cents)
  compareAtPrice: number | null;
  currency: string;                    // ISO 4217
  taxClassId: string | null;
  vendor: string | null;
  brand: string | null;
  weightGrams: number | null;
  dimensions: { length: number; width: number; height: number } | null;
  requiresShipping: boolean;
  isTaxable: boolean;
  isVisible: boolean;
  isFeatured: boolean;
  gtin: string | null;
  mpn: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImageUrl: string | null;
  metadata: Record<string, unknown>;
  tags: string[];
  categoryIds: string[];
  primaryImage: ProductImage | null;
  images: ProductImage[];
  variants: ProductVariant[];
  options: ProductOption[];
  reviewSummary: ReviewSummary | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface ProductCreateInput {
  name: string;
  slug?: string;
  description?: string | null;
  shortDescription?: string | null;
  status?: ProductStatus;
  type?: ProductType;
  basePrice: number;
  compareAtPrice?: number | null;
  currency?: string;
  taxClassId?: string | null;
  vendor?: string | null;
  brand?: string | null;
  weightGrams?: number | null;
  dimensions?: { length: number; width: number; height: number } | null;
  requiresShipping?: boolean;
  isTaxable?: boolean;
  isVisible?: boolean;
  isFeatured?: boolean;
  gtin?: string | null;
  mpn?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  ogImageUrl?: string | null;
  metadata?: Record<string, unknown>;
  tags?: string[];
  categoryIds?: string[];
}

interface ProductUpdateInput extends Partial<ProductCreateInput> {
  id: string;
}

interface ProductListOptions {
  page?: number;
  pageSize?: number;
  status?: ProductStatus | ProductStatus[];
  type?: ProductType | ProductType[];
  categoryIds?: string[];
  vendor?: string;
  brand?: string;
  tags?: string[];
  isFeatured?: boolean;
  priceRange?: { min?: number; max?: number };
  search?: string;
  sortBy?: 'name' | 'price' | 'created_at' | 'updated_at' | 'published_at' | 'popularity';
  sortOrder?: 'asc' | 'desc';
  includeDeleted?: boolean;
  includeVariants?: boolean;
  includeImages?: boolean;
}

interface ProductListResult {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
```

### ProductVariant

```typescript
interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  name: string;
  priceOverride: number | null;
  compareAtPriceOverride: number | null;
  weightGramsOverride: number | null;
  dimensionsOverride: { length: number; width: number; height: number } | null;
  optionValues: Record<string, string>;
  barcode: string | null;
  inventoryQuantity: number;
  lowStockThreshold: number;
  backorderEnabled: boolean;
  isActive: boolean;
  position: number;
  images: ProductImage[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

interface VariantCreateInput {
  productId: string;
  sku?: string;
  name?: string;
  priceOverride?: number | null;
  compareAtPriceOverride?: number | null;
  weightGramsOverride?: number | null;
  dimensionsOverride?: { length: number; width: number; height: number } | null;
  optionValues: Record<string, string>;
  barcode?: string | null;
  inventoryQuantity?: number;
  lowStockThreshold?: number;
  backorderEnabled?: boolean;
  isActive?: boolean;
  position?: number;
  metadata?: Record<string, unknown>;
}

interface VariantUpdateInput extends Partial<Omit<VariantCreateInput, 'productId'>> {
  id: string;
}

interface ProductOption {
  id: string;
  productId: string;
  name: string;
  position: number;
  values: ProductOptionValue[];
}

interface ProductOptionValue {
  id: string;
  optionId: string;
  value: string;
  displayValue: string | null;
  position: number;
}

interface SkuPattern {
  prefix: string;
  separator?: string;
  includeOptions?: string[];
  abbreviate?: boolean;
  segmentMaxLength?: number;
  counterPadding?: number;
}
```

### Category

```typescript
interface Category {
  id: string;
  tenantId: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  position: number;
  isActive: boolean;
  path: string;
  depth: number;
  productCount: number;
  totalProductCount: number;
  imageUrl: string | null;
  icon: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

interface CategoryCreateInput {
  name: string;
  slug?: string;
  parentId?: string | null;
  description?: string | null;
  position?: number;
  isActive?: boolean;
  imageUrl?: string | null;
  icon?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  metadata?: Record<string, unknown>;
}

interface CategoryUpdateInput extends Partial<CategoryCreateInput> {
  id: string;
}

interface CategoryTree {
  roots: CategoryTreeNode[];
  totalCount: number;
}

interface CategoryTreeNode {
  category: Category;
  children: CategoryTreeNode[];
  hasChildren: boolean;
}

interface Breadcrumb {
  segments: BreadcrumbSegment[];
  fullPath: string;
}

interface BreadcrumbSegment {
  id: string;
  name: string;
  slug: string;
  path: string;
  depth: number;
}
```

### PriceRule

```typescript
type PriceRuleType =
  | 'fixed_price'
  | 'percentage_discount'
  | 'fixed_discount'
  | 'volume_tier'
  | 'customer_group'
  | 'currency_override';

interface PriceRule {
  id: string;
  tenantId: string;
  productId: string | null;
  variantId: string | null;
  name: string;
  type: PriceRuleType;
  value: number;
  currency: string | null;
  minQuantity: number | null;
  maxQuantity: number | null;
  customerGroupId: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface PriceRuleCreateInput {
  productId?: string | null;
  variantId?: string | null;
  name: string;
  type: PriceRuleType;
  value: number;
  currency?: string | null;
  minQuantity?: number | null;
  maxQuantity?: number | null;
  customerGroupId?: string | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  priority?: number;
  isActive?: boolean;
}

interface PriceRuleUpdateInput extends Partial<PriceRuleCreateInput> {
  id: string;
}

interface PriceContext {
  productId: string;
  variantId?: string;
  quantity?: number;
  customerGroupId?: string;
  currency?: string;
  evaluationDate?: Date;
}

interface ResolvedPrice {
  unitPrice: number;
  basePrice: number;
  compareAtPrice: number | null;
  appliedRule: PriceRule | null;
  currency: string;
  discountAmount: number;
  discountPercentage: number;
  isOnSale: boolean;
  volumeTiers: PriceTier[];
}

interface PriceTier {
  minQuantity: number;
  maxQuantity: number | null;
  unitPrice: number;
  savings: number;
}

interface CurrencyOverride {
  currency: string;
  price: number;
  compareAtPrice: number | null;
}
```

### ProductAttribute

```typescript
type AttributeType = 'text' | 'number' | 'date' | 'boolean' | 'enum' | 'multi_select' | 'url' | 'color';

interface AttributeDefinition {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  type: AttributeType;
  isRequired: boolean;
  isFilterable: boolean;
  isSearchable: boolean;
  isVisible: boolean;
  options: string[];
  validation: AttributeValidation | null;
  display: AttributeDisplayConfig | null;
  position: number;
  group: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface AttributeValidation {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  message?: string;
}

interface AttributeDisplayConfig {
  widget?: 'text' | 'textarea' | 'dropdown' | 'checkbox' | 'radio' | 'color_swatch' | 'slider' | 'date_picker';
  unit?: string;
  showUnit?: boolean;
  prefix?: string;
}

interface AttributeValue {
  id: string;
  attributeId: string;
  productId: string;
  variantId: string | null;
  valueText: string | null;
  valueNumeric: number | null;
  valueDate: Date | null;
  valueJson: unknown | null;
  valueBoolean: boolean | null;
}

interface AttributeFilterConfig {
  attribute: AttributeDefinition;
  filterType: 'checkbox' | 'radio' | 'range' | 'color_swatch' | 'text_input';
  values: Array<{ value: string; label: string; count: number }>;
  range?: { min: number; max: number };
}
```

### ProductSearch

```typescript
interface SearchQuery {
  query?: string;
  filters?: SearchFilter[];
  sort?: SearchSort;
  page?: number;
  pageSize?: number;
  categoryIds?: string[];
  includeSubcategories?: boolean;
  priceRange?: { min?: number; max?: number };
  inStockOnly?: boolean;
  onSaleOnly?: boolean;
  types?: ProductType[];
  brands?: string[];
  vendors?: string[];
  tags?: string[];
  facets?: string[];
  includeSuggestions?: boolean;
}

interface SearchFilter {
  field: string;
  operator: SearchFilterOperator;
  value: string | number | boolean | string[] | number[];
}

type SearchFilterOperator =
  | 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte'
  | 'in' | 'not_in' | 'between' | 'contains' | 'starts_with' | 'exists';

interface SearchSort {
  field: SearchSortField;
  order: 'asc' | 'desc';
}

type SearchSortField =
  | 'relevance' | 'price' | 'name' | 'created_at'
  | 'updated_at' | 'popularity' | 'rating' | 'best_selling';

interface SearchResult {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  facets: SearchFacet[];
  suggestions: string[];
  executedQuery: string;
  appliedFilters: SearchFilter[];
  searchTimeMs: number;
}

interface SearchFacet {
  field: string;
  label: string;
  type: 'terms' | 'range' | 'boolean';
  values: FacetValue[];
  range?: { min: number; max: number };
}

interface FacetValue {
  value: string;
  label: string;
  count: number;
  selected: boolean;
}
```

### ProductBundle

```typescript
type BundlePricingStrategy = 'fixed' | 'calculated' | 'cheapest_free';

interface ProductBundle {
  id: string;
  productId: string;
  pricingStrategy: BundlePricingStrategy;
  fixedPrice: number | null;
  discountPercentage: number | null;
  isActive: boolean;
  items: BundleItem[];
  createdAt: Date;
  updatedAt: Date;
}

interface BundleCreateInput {
  productId: string;
  pricingStrategy: BundlePricingStrategy;
  fixedPrice?: number | null;
  discountPercentage?: number | null;
  isActive?: boolean;
  items: BundleItemInput[];
}

interface BundleUpdateInput extends Partial<Omit<BundleCreateInput, 'productId'>> {
  id: string;
}

interface BundleItem {
  id: string;
  bundleId: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  isOptional: boolean;
  position: number;
  product?: Product;
}

interface BundleItemInput {
  productId: string;
  variantId?: string | null;
  quantity?: number;
  isOptional?: boolean;
  position?: number;
}
```

### Digital Product Types

```typescript
interface DigitalAsset {
  id: string;
  productId: string;
  variantId: string | null;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  accessType: 'download' | 'stream' | 'license';
  accessDurationDays: number | null;
  maxDownloads: number | null;
  drmConfig: DrmConfig | null;
  version: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface DigitalAssetCreateInput {
  productId: string;
  variantId?: string | null;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  accessType?: 'download' | 'stream' | 'license';
  accessDurationDays?: number | null;
  maxDownloads?: number | null;
  drmConfig?: DrmConfig | null;
  version?: string;
}

interface LicenseKey {
  id: string;
  digitalAssetId: string;
  keyValue: string;
  status: 'available' | 'reserved' | 'claimed' | 'revoked' | 'expired';
  claimedBy: string | null;
  orderId: string | null;
  claimedAt: Date | null;
  expiresAt: Date | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

interface LicenseKeyConfig {
  pattern: string;
  charset?: 'alphanumeric' | 'alpha_upper' | 'numeric' | 'hex';
  prefix?: string;
  poolSize?: number;
  hasExpiry?: boolean;
  expiryDays?: number;
}

interface DownloadToken {
  token: string;
  digitalAssetId: string;
  customerId: string;
  orderId: string;
  downloadsRemaining: number | null;
  expiresAt: Date;
  createdAt: Date;
  lastDownloadAt: Date | null;
}

interface DrmConfig {
  provider: 'none' | 'watermark' | 'encryption' | 'custom';
  watermark?: boolean;
  watermarkTemplate?: string;
  encryptionKeyRef?: string;
  webhookUrl?: string;
}
```

### Import / Export

```typescript
type ImportJobStatus = 'pending' | 'validating' | 'processing' | 'completed' | 'failed' | 'cancelled';
type ImportConflictStrategy = 'skip' | 'overwrite' | 'merge' | 'error';
type ExportFormat = 'csv' | 'json' | 'xlsx';

interface ImportJob {
  id: string;
  tenantId: string;
  status: ImportJobStatus;
  format: 'csv' | 'json';
  fileUrl: string;
  fileName: string;
  mapping: ImportMapping;
  conflictStrategy: ImportConflictStrategy;
  totalRows: number;
  processedRows: number;
  successCount: number;
  errorCount: number;
  skipCount: number;
  errors: ImportError[];
  createdBy: string;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
}

interface ImportMapping {
  fields: Record<string, string>;
  defaults?: Record<string, unknown>;
  hasHeader?: boolean;
  delimiter?: string;
  encoding?: string;
  imageHandling?: 'url' | 'skip';
}

interface ImportError {
  row: number;
  field: string | null;
  code: string;
  message: string;
  value: unknown;
}

interface ImportValidationResult {
  isValid: boolean;
  totalRows: number;
  detectedFields: string[];
  suggestedMapping: ImportMapping;
  warnings: ImportError[];
  errors: ImportError[];
  preview: Record<string, unknown>[];
}

interface ExportOptions {
  format: ExportFormat;
  statuses?: ProductStatus[];
  categoryIds?: string[];
  includeVariants?: boolean;
  includeImages?: boolean;
  includeAttributes?: boolean;
  fields?: string[];
  limit?: number;
}

interface ExportJob {
  id: string;
  fileUrl: string;
  format: ExportFormat;
  productCount: number;
  fileSize: number;
  expiresAt: Date;
  createdAt: Date;
}
```

### SEO & Image Types

```typescript
interface ProductSeo {
  productId: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  openGraph: OpenGraphTags;
  jsonLd: JsonLdProduct;
}

interface OpenGraphTags {
  title: string;
  description: string;
  type: 'product';
  url: string;
  image: string | null;
  'product:price:amount'?: string;
  'product:price:currency'?: string;
  'product:availability'?: 'instock' | 'oos' | 'preorder';
  'product:brand'?: string;
}

interface JsonLdProduct {
  '@context': 'https://schema.org';
  '@type': 'Product';
  name: string;
  description: string;
  image: string[];
  sku: string;
  gtin?: string;
  brand?: { '@type': 'Brand'; name: string };
  offers: {
    '@type': 'Offer' | 'AggregateOffer';
    priceCurrency: string;
    price: string;
    lowPrice?: string;
    highPrice?: string;
    availability: string;
  };
  aggregateRating?: {
    '@type': 'AggregateRating';
    ratingValue: string;
    reviewCount: string;
  };
}

interface ProductImage {
  id: string;
  productId: string;
  variantId: string | null;
  url: string;
  altText: string | null;
  position: number;
  isPrimary: boolean;
  width: number | null;
  height: number | null;
  format: string | null;
  fileSize: number | null;
  createdAt: Date;
}

interface ImageUploadInput {
  productId: string;
  variantId?: string | null;
  altText?: string | null;
  position?: number;
  isPrimary?: boolean;
}

interface ImageTransform {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill';
  format?: 'webp' | 'jpeg' | 'png' | 'avif';
  quality?: number;
}
```

### CatalogService

```typescript
interface CatalogService {
  // ── Products ─────────────────────────────────────
  products: {
    create(input: ProductCreateInput): Promise<Product>;
    update(input: ProductUpdateInput): Promise<Product>;
    get(id: string): Promise<Product | null>;
    getBySlug(slug: string): Promise<Product | null>;
    list(options?: ProductListOptions): Promise<ProductListResult>;
    publish(id: string): Promise<Product>;
    unpublish(id: string): Promise<Product>;
    archive(id: string): Promise<Product>;
    restore(id: string): Promise<Product>;
    delete(id: string): Promise<void>;
    duplicate(id: string, overrides?: Partial<ProductCreateInput>): Promise<Product>;
    bulkUpdateStatus(ids: string[], status: ProductStatus): Promise<number>;
  };

  // ── Variants ─────────────────────────────────────
  variants: {
    create(input: VariantCreateInput): Promise<ProductVariant>;
    update(input: VariantUpdateInput): Promise<ProductVariant>;
    get(id: string): Promise<ProductVariant | null>;
    getBySku(sku: string): Promise<ProductVariant | null>;
    list(productId: string): Promise<ProductVariant[]>;
    delete(id: string): Promise<void>;
    reorder(productId: string, variantIds: string[]): Promise<void>;
    generateFromOptions(productId: string): Promise<ProductVariant[]>;
    bulkUpdate(updates: VariantUpdateInput[]): Promise<ProductVariant[]>;
    adjustInventory(id: string, adjustment: number, reason?: string): Promise<ProductVariant>;
  };

  // ── Options ──────────────────────────────────────
  options: {
    create(productId: string, input: OptionCreateInput): Promise<ProductOption>;
    update(id: string, input: Partial<OptionCreateInput>): Promise<ProductOption>;
    delete(id: string): Promise<void>;
    list(productId: string): Promise<ProductOption[]>;
    addValue(optionId: string, value: string, displayValue?: string): Promise<ProductOptionValue>;
    removeValue(valueId: string): Promise<void>;
  };

  // ── Categories ───────────────────────────────────
  categories: {
    create(input: CategoryCreateInput): Promise<Category>;
    update(input: CategoryUpdateInput): Promise<Category>;
    get(id: string): Promise<Category | null>;
    getBySlug(slug: string): Promise<Category | null>;
    getByPath(path: string): Promise<Category | null>;
    list(parentId?: string | null): Promise<Category[]>;
    getTree(): Promise<CategoryTree>;
    getBreadcrumb(categoryId: string): Promise<Breadcrumb>;
    move(categoryId: string, newParentId: string | null, position?: number): Promise<Category>;
    delete(id: string, reassignTo?: string): Promise<void>;
    assignProducts(categoryId: string, productIds: string[]): Promise<void>;
    removeProducts(categoryId: string, productIds: string[]): Promise<void>;
    getProducts(categoryId: string, options?: ProductListOptions): Promise<ProductListResult>;
  };

  // ── Pricing ──────────────────────────────────────
  pricing: {
    createRule(input: PriceRuleCreateInput): Promise<PriceRule>;
    updateRule(input: PriceRuleUpdateInput): Promise<PriceRule>;
    deleteRule(id: string): Promise<void>;
    listRules(productId?: string): Promise<PriceRule[]>;
    resolvePrice(context: PriceContext): Promise<ResolvedPrice>;
    getVolumeTiers(productId: string, variantId?: string): Promise<PriceTier[]>;
  };

  // ── Attributes ───────────────────────────────────
  attributes: {
    defineAttribute(input: AttributeCreateInput): Promise<AttributeDefinition>;
    updateAttribute(input: AttributeUpdateInput): Promise<AttributeDefinition>;
    deleteAttribute(id: string): Promise<void>;
    listAttributes(): Promise<AttributeDefinition[]>;
    getFilterableAttributes(): Promise<AttributeFilterConfig[]>;
    setValue(productId: string, attributeId: string, value: unknown, variantId?: string): Promise<AttributeValue>;
    getValues(productId: string, variantId?: string): Promise<AttributeValue[]>;
    bulkSetValues(productId: string, values: Array<{ attributeId: string; value: unknown }>): Promise<AttributeValue[]>;
  };

  // ── Search ───────────────────────────────────────
  search: {
    query(query: SearchQuery): Promise<SearchResult>;
    suggest(prefix: string, limit?: number): Promise<string[]>;
    reindex(productId?: string): Promise<void>;
    getPopularSearches(limit?: number): Promise<Array<{ query: string; count: number }>>;
  };

  // ── Bundles ──────────────────────────────────────
  bundles: {
    create(input: BundleCreateInput): Promise<ProductBundle>;
    update(input: BundleUpdateInput): Promise<ProductBundle>;
    get(productId: string): Promise<ProductBundle | null>;
    delete(id: string): Promise<void>;
    addItem(bundleId: string, item: BundleItemInput): Promise<BundleItem>;
    removeItem(itemId: string): Promise<void>;
    calculatePrice(bundleId: string, selections?: Record<string, string>): Promise<ResolvedPrice>;
  };

  // ── Digital Products ─────────────────────────────
  digital: {
    createAsset(input: DigitalAssetCreateInput): Promise<DigitalAsset>;
    updateAsset(id: string, input: Partial<DigitalAssetCreateInput>): Promise<DigitalAsset>;
    deleteAsset(id: string): Promise<void>;
    listAssets(productId: string): Promise<DigitalAsset[]>;
    generateLicenseKeys(assetId: string, count: number, config?: LicenseKeyConfig): Promise<LicenseKey[]>;
    claimLicenseKey(assetId: string, customerId: string, orderId: string): Promise<LicenseKey>;
    createDownloadToken(assetId: string, customerId: string, orderId: string): Promise<DownloadToken>;
    validateDownloadToken(token: string): Promise<{ valid: boolean; asset?: DigitalAsset }>;
  };

  // ── Images ───────────────────────────────────────
  images: {
    upload(file: File | Buffer, input: ImageUploadInput): Promise<ProductImage>;
    delete(imageId: string): Promise<void>;
    reorder(productId: string, imageIds: string[]): Promise<void>;
    setPrimary(imageId: string): Promise<void>;
    getTransformUrl(imageId: string, transform: ImageTransform): string;
  };

  // ── Import / Export ──────────────────────────────
  import: {
    validate(fileUrl: string, format: 'csv' | 'json', mapping?: Partial<ImportMapping>): Promise<ImportValidationResult>;
    start(input: ImportJobCreateInput): Promise<ImportJob>;
    getStatus(jobId: string): Promise<ImportJob>;
    cancel(jobId: string): Promise<void>;
    listJobs(options?: { status?: ImportJobStatus; limit?: number }): Promise<ImportJob[]>;
  };

  export: {
    start(options: ExportOptions): Promise<ExportJob>;
    getStatus(jobId: string): Promise<ExportJob>;
  };

  // ── SEO ──────────────────────────────────────────
  seo: {
    generateMeta(productId: string): Promise<ProductSeo>;
    updateMeta(productId: string, meta: Partial<SeoMeta>): Promise<ProductSeo>;
    generateJsonLd(productId: string): Promise<JsonLdProduct>;
    validateSlug(slug: string, excludeProductId?: string): Promise<{ available: boolean; suggestion?: string }>;
  };
}
```

---

## Database Schemas

### Products Table

```typescript
import { pgTable, uuid, text, integer, boolean, timestamp, jsonb, index, pgEnum } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const productStatusEnum = pgEnum('product_status', ['draft', 'published', 'archived']);
export const productTypeEnum = pgEnum('product_type', ['physical', 'digital', 'service', 'bundle']);

export const products = pgTable('products', {
  id:               uuid('id').primaryKey().defaultRandom(),
  tenantId:         uuid('tenant_id').notNull().references(() => tenants.id),
  name:             text('name').notNull(),
  slug:             text('slug').notNull(),
  description:      text('description'),
  shortDescription: text('short_description'),
  status:           productStatusEnum('status').notNull().default('draft'),
  type:             productTypeEnum('type').notNull().default('physical'),
  basePrice:        integer('base_price').notNull(),
  compareAtPrice:   integer('compare_at_price'),
  currency:         text('currency').notNull().default('USD'),
  taxClassId:       uuid('tax_class_id'),
  vendor:           text('vendor'),
  brand:            text('brand'),
  weightGrams:      integer('weight_grams'),
  dimensions:       jsonb('dimensions'),
  requiresShipping: boolean('requires_shipping').notNull().default(true),
  isTaxable:        boolean('is_taxable').notNull().default(true),
  isVisible:        boolean('is_visible').notNull().default(false),
  isFeatured:       boolean('is_featured').notNull().default(false),
  gtin:             text('gtin'),
  mpn:              text('mpn'),
  seoTitle:         text('seo_title'),
  seoDescription:   text('seo_description'),
  ogImageUrl:       text('og_image_url'),
  metadata:         jsonb('metadata').notNull().default('{}'),
  tags:             jsonb('tags').notNull().default('[]'),
  searchVector:     sql`tsvector`.as('search_vector'),
  publishedAt:      timestamp('published_at', { withTimezone: true }),
  createdAt:        timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt:        timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  slugUnique:     index('products_tenant_slug_unique').on(table.tenantId, table.slug)
                    .where(sql`${table.deletedAt} IS NULL`),
  tenantStatus:   index('products_tenant_status_idx').on(table.tenantId, table.status),
  searchIdx:      index('products_search_vector_idx').using('gin', table.searchVector),
  nameTrigramIdx: index('products_name_trgm_idx').using('gin', sql`${table.name} gin_trgm_ops`),
  featuredIdx:    index('products_featured_idx').on(table.tenantId, table.isFeatured)
                    .where(sql`${table.status} = 'published'`),
  priceIdx:       index('products_price_idx').on(table.tenantId, table.basePrice)
                    .where(sql`${table.status} = 'published'`),
  vendorIdx:      index('products_vendor_idx').on(table.tenantId, table.vendor),
  brandIdx:       index('products_brand_idx').on(table.tenantId, table.brand),
  publishedIdx:   index('products_published_at_idx').on(table.tenantId, table.publishedAt),
}));
```

**RLS & Triggers:**

```sql
-- Row-Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY products_tenant_isolation ON products
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY products_public_read ON products FOR SELECT
  USING (
    status = 'published' AND is_visible = true AND deleted_at IS NULL
    AND tenant_id = current_setting('app.current_tenant_id')::uuid
  );

-- Full-text search vector auto-update
CREATE OR REPLACE FUNCTION products_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.short_description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.vendor, '')), 'D') ||
    setweight(to_tsvector('english', COALESCE(NEW.brand, '')), 'D') ||
    setweight(to_tsvector('english', COALESCE(
      array_to_string(ARRAY(SELECT jsonb_array_elements_text(NEW.tags)), ' '), ''
    )), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_search_vector_trigger
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION products_search_vector_update();

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Product Variants Table

```typescript
export const productVariants = pgTable('product_variants', {
  id:                     uuid('id').primaryKey().defaultRandom(),
  productId:              uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  sku:                    text('sku').notNull(),
  name:                   text('name').notNull(),
  priceOverride:          integer('price_override'),
  compareAtPriceOverride: integer('compare_at_price_override'),
  weightGramsOverride:    integer('weight_grams_override'),
  dimensionsOverride:     jsonb('dimensions_override'),
  optionValues:           jsonb('option_values').notNull().default('{}'),
  barcode:                text('barcode'),
  inventoryQuantity:      integer('inventory_quantity').notNull().default(0),
  lowStockThreshold:      integer('low_stock_threshold').notNull().default(5),
  backorderEnabled:       boolean('backorder_enabled').notNull().default(false),
  isActive:               boolean('is_active').notNull().default(true),
  position:               integer('position').notNull().default(0),
  metadata:               jsonb('metadata').notNull().default('{}'),
  createdAt:              timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:              timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  skuIdx:       index('product_variants_sku_idx').on(table.sku),
  productIdx:   index('product_variants_product_idx').on(table.productId),
  inventoryIdx: index('product_variants_inventory_idx').on(table.productId, table.inventoryQuantity),
  activeIdx:    index('product_variants_active_idx').on(table.productId, table.isActive),
}));
```

```sql
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY product_variants_tenant_isolation ON product_variants
  USING (product_id IN (
    SELECT id FROM products WHERE tenant_id = current_setting('app.current_tenant_id')::uuid
  ));
```

### Categories Table

```typescript
export const categories = pgTable('categories', {
  id:                uuid('id').primaryKey().defaultRandom(),
  tenantId:          uuid('tenant_id').notNull().references(() => tenants.id),
  parentId:          uuid('parent_id').references(() => categories.id, { onDelete: 'set null' }),
  name:              text('name').notNull(),
  slug:              text('slug').notNull(),
  description:       text('description'),
  position:          integer('position').notNull().default(0),
  isActive:          boolean('is_active').notNull().default(true),
  path:              text('path').notNull().default('/'),
  depth:             integer('depth').notNull().default(0),
  productCount:      integer('product_count').notNull().default(0),
  totalProductCount: integer('total_product_count').notNull().default(0),
  imageUrl:          text('image_url'),
  icon:              text('icon'),
  seoTitle:          text('seo_title'),
  seoDescription:    text('seo_description'),
  metadata:          jsonb('metadata').notNull().default('{}'),
  createdAt:         timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:         timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  slugUnique:  index('categories_tenant_parent_slug_unique').on(table.tenantId, table.parentId, table.slug),
  parentIdx:   index('categories_parent_idx').on(table.tenantId, table.parentId),
  pathIdx:     index('categories_path_idx').using('btree', table.path),
  activeIdx:   index('categories_active_idx').on(table.tenantId, table.isActive),
  positionIdx: index('categories_position_idx').on(table.tenantId, table.parentId, table.position),
}));
```

```sql
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY categories_tenant_isolation ON categories
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Materialized path auto-update
CREATE OR REPLACE FUNCTION categories_update_path() RETURNS trigger AS $$
DECLARE parent_path text;
BEGIN
  IF NEW.parent_id IS NULL THEN
    NEW.path := '/' || NEW.slug;
    NEW.depth := 0;
  ELSE
    SELECT path INTO parent_path FROM categories WHERE id = NEW.parent_id;
    NEW.path := parent_path || '/' || NEW.slug;
    NEW.depth := array_length(string_to_array(trim(leading '/' from NEW.path), '/'), 1) - 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER categories_path_trigger
  BEFORE INSERT OR UPDATE OF parent_id, slug ON categories
  FOR EACH ROW EXECUTE FUNCTION categories_update_path();
```

### Category Products Junction Table

```typescript
export const categoryProducts = pgTable('category_products', {
  categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  productId:  uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  position:   integer('position').notNull().default(0),
  createdAt:  timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  pk:          { columns: [table.categoryId, table.productId] },
  productIdx:  index('category_products_product_idx').on(table.productId),
  positionIdx: index('category_products_position_idx').on(table.categoryId, table.position),
}));
```

```sql
-- Trigger to update category product counts
CREATE OR REPLACE FUNCTION update_category_product_counts() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE categories SET product_count = product_count + 1 WHERE id = NEW.category_id;
    UPDATE categories SET total_product_count = total_product_count + 1
    WHERE id IN (
      WITH RECURSIVE ancestors AS (
        SELECT parent_id FROM categories WHERE id = NEW.category_id
        UNION ALL SELECT c.parent_id FROM categories c JOIN ancestors a ON c.id = a.parent_id
      ) SELECT parent_id FROM ancestors WHERE parent_id IS NOT NULL
    ) OR id = NEW.category_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE categories SET product_count = GREATEST(product_count - 1, 0) WHERE id = OLD.category_id;
    UPDATE categories SET total_product_count = GREATEST(total_product_count - 1, 0)
    WHERE id IN (
      WITH RECURSIVE ancestors AS (
        SELECT parent_id FROM categories WHERE id = OLD.category_id
        UNION ALL SELECT c.parent_id FROM categories c JOIN ancestors a ON c.id = a.parent_id
      ) SELECT parent_id FROM ancestors WHERE parent_id IS NOT NULL
    ) OR id = OLD.category_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER category_products_count_trigger
  AFTER INSERT OR DELETE ON category_products
  FOR EACH ROW EXECUTE FUNCTION update_category_product_counts();
```

### Price Rules Table

```typescript
export const priceRuleTypeEnum = pgEnum('price_rule_type', [
  'fixed_price', 'percentage_discount', 'fixed_discount',
  'volume_tier', 'customer_group', 'currency_override',
]);

export const priceRules = pgTable('price_rules', {
  id:              uuid('id').primaryKey().defaultRandom(),
  tenantId:        uuid('tenant_id').notNull().references(() => tenants.id),
  productId:       uuid('product_id').references(() => products.id, { onDelete: 'cascade' }),
  variantId:       uuid('variant_id').references(() => productVariants.id, { onDelete: 'cascade' }),
  name:            text('name').notNull(),
  type:            priceRuleTypeEnum('type').notNull(),
  value:           integer('value').notNull(),
  currency:        text('currency'),
  minQuantity:     integer('min_quantity'),
  maxQuantity:     integer('max_quantity'),
  customerGroupId: uuid('customer_group_id'),
  startsAt:        timestamp('starts_at', { withTimezone: true }),
  endsAt:          timestamp('ends_at', { withTimezone: true }),
  priority:        integer('priority').notNull().default(0),
  isActive:        boolean('is_active').notNull().default(true),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  productIdx:  index('price_rules_product_idx').on(table.tenantId, table.productId),
  activeIdx:   index('price_rules_active_idx').on(table.tenantId, table.isActive, table.startsAt, table.endsAt),
  priorityIdx: index('price_rules_priority_idx').on(table.tenantId, table.productId, table.priority),
  groupIdx:    index('price_rules_group_idx').on(table.tenantId, table.customerGroupId),
}));
```

### Product Attributes & Values Tables

```typescript
export const attributeTypeEnum = pgEnum('attribute_type', [
  'text', 'number', 'date', 'boolean', 'enum', 'multi_select', 'url', 'color',
]);

export const productAttributes = pgTable('product_attributes', {
  id:           uuid('id').primaryKey().defaultRandom(),
  tenantId:     uuid('tenant_id').notNull().references(() => tenants.id),
  name:         text('name').notNull(),
  slug:         text('slug').notNull(),
  type:         attributeTypeEnum('type').notNull(),
  isRequired:   boolean('is_required').notNull().default(false),
  isFilterable: boolean('is_filterable').notNull().default(false),
  isSearchable: boolean('is_searchable').notNull().default(false),
  isVisible:    boolean('is_visible').notNull().default(true),
  options:      jsonb('options').notNull().default('[]'),
  validation:   jsonb('validation'),
  display:      jsonb('display'),
  position:     integer('position').notNull().default(0),
  groupName:    text('group_name'),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  slugUnique:    index('product_attributes_tenant_slug').on(table.tenantId, table.slug),
  filterableIdx: index('product_attributes_filterable_idx').on(table.tenantId, table.isFilterable),
}));

export const attributeValues = pgTable('attribute_values', {
  id:           uuid('id').primaryKey().defaultRandom(),
  attributeId:  uuid('attribute_id').notNull().references(() => productAttributes.id, { onDelete: 'cascade' }),
  productId:    uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  variantId:    uuid('variant_id').references(() => productVariants.id, { onDelete: 'cascade' }),
  valueText:    text('value_text'),
  valueNumeric: integer('value_numeric'),
  valueDate:    timestamp('value_date', { withTimezone: true }),
  valueJson:    jsonb('value_json'),
  valueBoolean: boolean('value_boolean'),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniqueVal:       index('attribute_values_unique_idx').on(table.attributeId, table.productId, table.variantId),
  productIdx:      index('attribute_values_product_idx').on(table.productId),
  filterIdx:       index('attribute_values_filter_idx').on(table.attributeId, table.valueText),
  numericFilterIdx: index('attribute_values_numeric_idx').on(table.attributeId, table.valueNumeric),
}));
```

### Product Images Table

```typescript
export const productImages = pgTable('product_images', {
  id:        uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'set null' }),
  url:       text('url').notNull(),
  altText:   text('alt_text'),
  position:  integer('position').notNull().default(0),
  isPrimary: boolean('is_primary').notNull().default(false),
  width:     integer('width'),
  height:    integer('height'),
  format:    text('format'),
  fileSize:  integer('file_size'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  productIdx: index('product_images_product_idx').on(table.productId, table.position),
  variantIdx: index('product_images_variant_idx').on(table.variantId),
  primaryIdx: index('product_images_primary_idx').on(table.productId, table.isPrimary),
}));
```

```sql
-- Only one primary image per product
CREATE UNIQUE INDEX product_images_single_primary
  ON product_images (product_id) WHERE is_primary = true;
```

### Bundles, Reviews, Imports, Digital Assets Tables

```typescript
export const bundlePricingEnum = pgEnum('bundle_pricing_strategy', ['fixed', 'calculated', 'cheapest_free']);

export const productBundles = pgTable('product_bundles', {
  id:                 uuid('id').primaryKey().defaultRandom(),
  productId:          uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  pricingStrategy:    bundlePricingEnum('pricing_strategy').notNull().default('calculated'),
  fixedPrice:         integer('fixed_price'),
  discountPercentage: integer('discount_percentage'),
  isActive:           boolean('is_active').notNull().default(true),
  createdAt:          timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:          timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  productIdx: index('product_bundles_product_idx').on(table.productId),
}));

export const bundleItems = pgTable('bundle_items', {
  id:         uuid('id').primaryKey().defaultRandom(),
  bundleId:   uuid('bundle_id').notNull().references(() => productBundles.id, { onDelete: 'cascade' }),
  productId:  uuid('product_id').notNull().references(() => products.id),
  variantId:  uuid('variant_id').references(() => productVariants.id),
  quantity:   integer('quantity').notNull().default(1),
  isOptional: boolean('is_optional').notNull().default(false),
  position:   integer('position').notNull().default(0),
  createdAt:  timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  bundleIdx:  index('bundle_items_bundle_idx').on(table.bundleId, table.position),
  productIdx: index('bundle_items_product_idx').on(table.productId),
}));

export const productReviewsSummary = pgTable('product_reviews_summary', {
  productId:          uuid('product_id').primaryKey().references(() => products.id, { onDelete: 'cascade' }),
  averageRating:      integer('average_rating').notNull().default(0),     // rating * 100
  reviewCount:        integer('review_count').notNull().default(0),
  ratingDistribution: jsonb('rating_distribution').notNull().default('{"1":0,"2":0,"3":0,"4":0,"5":0}'),
  updatedAt:          timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const importJobStatusEnum = pgEnum('import_job_status', [
  'pending', 'validating', 'processing', 'completed', 'failed', 'cancelled',
]);

export const importJobs = pgTable('import_jobs', {
  id:               uuid('id').primaryKey().defaultRandom(),
  tenantId:         uuid('tenant_id').notNull().references(() => tenants.id),
  status:           importJobStatusEnum('status').notNull().default('pending'),
  format:           text('format').notNull(),
  fileUrl:          text('file_url').notNull(),
  fileName:         text('file_name').notNull(),
  mapping:          jsonb('mapping').notNull(),
  conflictStrategy: text('conflict_strategy').notNull().default('skip'),
  totalRows:        integer('total_rows').notNull().default(0),
  processedRows:    integer('processed_rows').notNull().default(0),
  successCount:     integer('success_count').notNull().default(0),
  errorCount:       integer('error_count').notNull().default(0),
  skipCount:        integer('skip_count').notNull().default(0),
  errors:           jsonb('errors').notNull().default('[]'),
  createdBy:        uuid('created_by').notNull(),
  startedAt:        timestamp('started_at', { withTimezone: true }),
  completedAt:      timestamp('completed_at', { withTimezone: true }),
  createdAt:        timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('import_jobs_tenant_idx').on(table.tenantId, table.createdAt),
  statusIdx: index('import_jobs_status_idx').on(table.tenantId, table.status),
}));

export const digitalAssets = pgTable('digital_assets', {
  id:                 uuid('id').primaryKey().defaultRandom(),
  productId:          uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  variantId:          uuid('variant_id').references(() => productVariants.id, { onDelete: 'set null' }),
  fileUrl:            text('file_url').notNull(),
  fileName:           text('file_name').notNull(),
  fileSize:           integer('file_size').notNull(),
  fileType:           text('file_type').notNull(),
  accessType:         text('access_type').notNull().default('download'),
  accessDurationDays: integer('access_duration_days'),
  maxDownloads:       integer('max_downloads'),
  drmConfig:          jsonb('drm_config'),
  version:            text('version').notNull().default('1.0'),
  isActive:           boolean('is_active').notNull().default(true),
  createdAt:          timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:          timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  productIdx: index('digital_assets_product_idx').on(table.productId),
}));

export const licenseKeys = pgTable('license_keys', {
  id:             uuid('id').primaryKey().defaultRandom(),
  digitalAssetId: uuid('digital_asset_id').notNull().references(() => digitalAssets.id, { onDelete: 'cascade' }),
  keyValue:       text('key_value').notNull(),           // encrypted at rest
  status:         text('status').notNull().default('available'),
  claimedBy:      uuid('claimed_by'),
  orderId:        uuid('order_id'),
  claimedAt:      timestamp('claimed_at', { withTimezone: true }),
  expiresAt:      timestamp('expires_at', { withTimezone: true }),
  metadata:       jsonb('metadata').notNull().default('{}'),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  assetIdx:  index('license_keys_asset_idx').on(table.digitalAssetId, table.status),
  statusIdx: index('license_keys_status_idx').on(table.status),
}));
```

### Required PostgreSQL Extensions

```sql
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

SET pg_trgm.similarity_threshold = 0.3;
```

---

## Code Examples

### Example 1: Creating a Product with Variants

```typescript
import { CatalogService } from '@mcv/commerce/catalog';

async function createTShirtProduct(catalog: CatalogService) {
  // 1. Create the base product
  const product = await catalog.products.create({
    name: 'Classic Cotton T-Shirt',
    description: `
## Classic Cotton T-Shirt

Our signature cotton tee, made from 100% organic cotton with a relaxed fit.

- **Material:** 100% organic cotton, 180gsm
- **Fit:** Relaxed, unisex
- **Care:** Machine wash cold, tumble dry low
    `.trim(),
    shortDescription: 'Signature organic cotton tee with a relaxed, unisex fit.',
    type: 'physical',
    basePrice: 2999,                    // $29.99
    compareAtPrice: 3999,               // $39.99 original
    currency: 'USD',
    vendor: 'EcoWear Co.',
    brand: 'EcoWear',
    weightGrams: 200,
    dimensions: { length: 300, width: 250, height: 20 },
    tags: ['t-shirt', 'cotton', 'organic', 'unisex'],
  });

  // slug auto-generated → "classic-cotton-t-shirt"

  // 2. Define product options
  await catalog.options.create(product.id, {
    name: 'Color',
    values: [
      { value: 'White', displayValue: '#FFFFFF' },
      { value: 'Black', displayValue: '#000000' },
      { value: 'Navy', displayValue: '#001F3F' },
      { value: 'Heather Grey', displayValue: '#B6B6B4' },
    ],
  });

  await catalog.options.create(product.id, {
    name: 'Size',
    values: [
      { value: 'XS' }, { value: 'S' }, { value: 'M' },
      { value: 'L' }, { value: 'XL' }, { value: 'XXL' },
    ],
  });

  // 3. Auto-generate all variant combinations (4 × 6 = 24 variants)
  const variants = await catalog.variants.generateFromOptions(product.id);
  // SKUs auto-generated: "CLASSIC-COTTON-WHT-XS", "CLASSIC-COTTON-WHT-S", etc.

  // 4. Override pricing for XXL (costs more material)
  const xxlVariants = variants.filter(v => v.optionValues['Size'] === 'XXL');
  await catalog.variants.bulkUpdate(
    xxlVariants.map(v => ({ id: v.id, priceOverride: 3499 }))
  );

  // 5. Set initial inventory (50 units per variant)
  for (const variant of variants) {
    await catalog.variants.adjustInventory(variant.id, 50, 'Initial stock');
  }

  // 6. Assign to categories
  await catalog.categories.assignProducts('cat_mens_tops_id', [product.id]);
  await catalog.categories.assignProducts('cat_new_arrivals_id', [product.id]);

  // 7. Upload hero image
  await catalog.images.upload(heroImageBuffer, {
    productId: product.id,
    altText: 'Classic Cotton T-Shirt - Front View',
    isPrimary: true,
  });

  // 8. Publish
  const published = await catalog.products.publish(product.id);
  console.log(`Published "${published.name}" with ${variants.length} variants`);

  return published;
}
```

### Example 2: Managing Variants and Inventory

```typescript
import { CatalogService } from '@mcv/commerce/catalog';

async function manageVariants(catalog: CatalogService, productId: string) {
  // List all variants
  const variants = await catalog.variants.list(productId);
  console.log(`Product has ${variants.length} variants`);

  // Find a specific variant by SKU
  const variant = await catalog.variants.getBySku('TSH-WHT-M');
  if (!variant) throw new Error('Variant not found');

  // Update variant with overrides
  await catalog.variants.update({
    id: variant.id,
    priceOverride: 2499,             // Special price
    lowStockThreshold: 10,           // Alert threshold
    backorderEnabled: true,          // Allow backorders
  });

  // Adjust inventory (positive = restock, negative = deduct)
  const restocked = await catalog.variants.adjustInventory(
    variant.id, 100, 'Shipment received #PO-2025-042'
  );
  console.log(`New quantity: ${restocked.inventoryQuantity}`);

  const sold = await catalog.variants.adjustInventory(
    variant.id, -3, 'Order #ORD-2025-1847'
  );

  // Check low-stock variants across the product
  const allVariants = await catalog.variants.list(productId);
  const lowStock = allVariants.filter(
    v => v.inventoryQuantity > 0 && v.inventoryQuantity <= v.lowStockThreshold
  );
  const outOfStock = allVariants.filter(
    v => v.inventoryQuantity === 0 && !v.backorderEnabled
  );

  console.log(`Low stock: ${lowStock.length}, Out of stock: ${outOfStock.length}`);

  // Add a new option value and generate new variants
  await catalog.options.addValue('color_option_id', 'Forest Green', '#228B22');
  const newVariants = await catalog.variants.generateFromOptions(productId);
  // Only generates combos that don't exist yet

  // Reorder variants for display
  await catalog.variants.reorder(productId, [
    variants[2].id,  // M first (most popular)
    variants[3].id,  // L
    variants[1].id,  // S
    variants[4].id,  // XL
    variants[0].id,  // XS
    variants[5].id,  // XXL
  ]);

  // Deactivate a variant (remains in DB, hidden from storefront)
  await catalog.variants.update({ id: variants[0].id, isActive: false });
}
```

### Example 3: Category Tree Management

```typescript
import { CatalogService } from '@mcv/commerce/catalog';

async function manageCategoryTree(catalog: CatalogService) {
  // Create root categories
  const clothing = await catalog.categories.create({
    name: 'Clothing',
    description: 'All clothing items',
    icon: 'shirt',
    position: 0,
  });

  const electronics = await catalog.categories.create({
    name: 'Electronics',
    icon: 'cpu',
    position: 1,
  });

  // Create nested categories (unlimited depth)
  const mensClothing = await catalog.categories.create({
    name: "Men's Clothing",
    parentId: clothing.id,
    position: 0,
  });

  const womensClothing = await catalog.categories.create({
    name: "Women's Clothing",
    parentId: clothing.id,
    position: 1,
  });

  const mensTops = await catalog.categories.create({
    name: 'Tops',
    parentId: mensClothing.id,
  });

  const mensBottoms = await catalog.categories.create({
    name: 'Bottoms',
    parentId: mensClothing.id,
  });

  const tShirts = await catalog.categories.create({
    name: 'T-Shirts',
    parentId: mensTops.id,
    seoTitle: "Men's T-Shirts | Shop Our Collection",
    seoDescription: 'Browse premium men\'s t-shirts in cotton, polyester, and blends.',
  });

  // Fetch the full category tree
  const tree = await catalog.categories.getTree();
  // tree.roots = [
  //   { category: Clothing, children: [
  //     { category: Men's, children: [
  //       { category: Tops, children: [
  //         { category: T-Shirts, children: [] }
  //       ]},
  //       { category: Bottoms, children: [] }
  //     ]},
  //     { category: Women's, children: [] }
  //   ]},
  //   { category: Electronics, children: [] }
  // ]

  // Generate breadcrumbs for T-Shirts
  const breadcrumb = await catalog.categories.getBreadcrumb(tShirts.id);
  // breadcrumb.segments = [
  //   { name: "Clothing",        path: "/clothing" },
  //   { name: "Men's Clothing",  path: "/clothing/mens-clothing" },
  //   { name: "Tops",            path: "/clothing/mens-clothing/tops" },
  //   { name: "T-Shirts",        path: "/clothing/mens-clothing/tops/t-shirts" },
  // ]

  // Assign products to categories (multi-category)
  await catalog.categories.assignProducts(tShirts.id, [productId1, productId2]);
  await catalog.categories.assignProducts(mensClothing.id, [productId1]); // also in parent

  // Get products in a category
  const result = await catalog.categories.getProducts(mensTops.id, {
    includeVariants: true,
    sortBy: 'popularity',
    sortOrder: 'desc',
  });

  // Move a category to a different parent
  await catalog.categories.move(tShirts.id, womensClothing.id, 0);
  // path updates automatically: /clothing/womens-clothing/t-shirts

  // Lookup by path
  const found = await catalog.categories.getByPath('/clothing/mens-clothing/tops');

  // Delete category, reassign products to parent
  await catalog.categories.delete(mensBottoms.id, mensClothing.id);
}
```

### Example 4: Pricing Rules

```typescript
import { CatalogService } from '@mcv/commerce/catalog';

async function managePricing(catalog: CatalogService, productId: string) {
  // 1. Create a sale price (percentage discount)
  const summerSale = await catalog.pricing.createRule({
    productId,
    name: 'Summer Sale 2025',
    type: 'percentage_discount',
    value: 20,                           // 20% off
    startsAt: new Date('2025-06-01'),
    endsAt: new Date('2025-08-31'),
    priority: 10,
  });

  // 2. Volume pricing tiers
  await catalog.pricing.createRule({
    productId,
    name: 'Volume Tier 1: 5-9 units',
    type: 'volume_tier',
    value: 2699,                         // $26.99 per unit
    minQuantity: 5,
    maxQuantity: 9,
    priority: 5,
  });

  await catalog.pricing.createRule({
    productId,
    name: 'Volume Tier 2: 10-24 units',
    type: 'volume_tier',
    value: 2399,                         // $23.99 per unit
    minQuantity: 10,
    maxQuantity: 24,
    priority: 5,
  });

  await catalog.pricing.createRule({
    productId,
    name: 'Volume Tier 3: 25+ units',
    type: 'volume_tier',
    value: 1999,                         // $19.99 per unit
    minQuantity: 25,
    maxQuantity: null,                   // unlimited
    priority: 5,
  });

  // 3. Customer group pricing (wholesale)
  await catalog.pricing.createRule({
    productId,
    name: 'Wholesale Price',
    type: 'customer_group',
    value: 1499,                         // $14.99 for wholesalers
    customerGroupId: 'group_wholesale_id',
    priority: 20,                        // higher priority than sale
  });

  // 4. Currency-specific pricing (EUR)
  await catalog.pricing.createRule({
    productId,
    name: 'EUR Price',
    type: 'currency_override',
    value: 2799,                         // €27.99
    currency: 'EUR',
    priority: 0,
  });

  // 5. Resolve price for a specific context
  const price = await catalog.pricing.resolvePrice({
    productId,
    quantity: 12,
    currency: 'USD',
    evaluationDate: new Date('2025-07-15'),  // during summer sale
  });

  console.log(`Unit price: $${(price.unitPrice / 100).toFixed(2)}`);
  console.log(`Base price: $${(price.basePrice / 100).toFixed(2)}`);
  console.log(`Discount: ${price.discountPercentage}%`);
  console.log(`On sale: ${price.isOnSale}`);
  console.log(`Applied rule: ${price.appliedRule?.name}`);
  // The resolver picks the best price: volume tier at qty 12 = $23.99
  // vs summer sale 20% off $29.99 = $23.99 — tie broken by priority

  // Get volume tier breakdown
  const tiers = await catalog.pricing.getVolumeTiers(productId);
  // [
  //   { minQuantity: 1,  maxQuantity: 4,    unitPrice: 2999, savings: 0 },
  //   { minQuantity: 5,  maxQuantity: 9,    unitPrice: 2699, savings: 300 },
  //   { minQuantity: 10, maxQuantity: 24,   unitPrice: 2399, savings: 600 },
  //   { minQuantity: 25, maxQuantity: null,  unitPrice: 1999, savings: 1000 },
  // ]
}
```

### Example 5: Search with Faceted Filtering

```typescript
import { CatalogService } from '@mcv/commerce/catalog';

async function searchCatalog(catalog: CatalogService) {
  // Full-text search with filters and facets
  const result = await catalog.search.query({
    query: 'cotton t-shirt',
    categoryIds: ['cat_mens_tops_id'],
    includeSubcategories: true,
    priceRange: { min: 1000, max: 5000 },    // $10 - $50
    inStockOnly: true,
    filters: [
      { field: 'color', operator: 'in', value: ['White', 'Black', 'Navy'] },
      { field: 'material', operator: 'eq', value: 'Cotton' },
      { field: 'rating', operator: 'gte', value: 4 },
    ],
    sort: { field: 'relevance', order: 'desc' },
    page: 1,
    pageSize: 24,
    facets: ['color', 'size', 'material', 'brand', 'price'],
    includeSuggestions: true,
  });

  console.log(`Found ${result.total} products in ${result.searchTimeMs}ms`);
  console.log(`Page ${result.page}/${result.totalPages}`);

  // Display facets for sidebar filtering
  for (const facet of result.facets) {
    console.log(`\n${facet.label}:`);
    if (facet.type === 'range') {
      console.log(`  Range: $${facet.range!.min / 100} - $${facet.range!.max / 100}`);
    } else {
      for (const val of facet.values) {
        const marker = val.selected ? '✓' : ' ';
        console.log(`  [${marker}] ${val.label} (${val.count})`);
      }
    }
  }
  // Color:
  //   [✓] White (12)
  //   [✓] Black (8)
  //   [✓] Navy (6)
  //   [ ] Red (4)
  //   [ ] Green (2)
  // Size:
  //   [ ] S (15)
  //   [ ] M (20)
  //   [ ] L (18)
  //   [ ] XL (10)
  // Price:
  //   Range: $10.00 - $49.99

  // Typeahead suggestions
  const suggestions = await catalog.search.suggest('cott', 5);
  // ["cotton t-shirt", "cotton hoodie", "cotton socks", "cotton blend", "cotton pajamas"]

  // Get popular searches for discovery
  const popular = await catalog.search.getPopularSearches(10);
  // [{ query: "t-shirt", count: 1240 }, { query: "sneakers", count: 890 }, ...]

  // Reindex a specific product (after bulk attribute update)
  await catalog.search.reindex(productId);

  // Reindex entire catalog (admin operation)
  await catalog.search.reindex();
}
```

### Example 6: Bulk Import

```typescript
import { CatalogService } from '@mcv/commerce/catalog';

async function bulkImportProducts(catalog: CatalogService) {
  // 1. Upload the CSV file (via separate upload endpoint)
  const fileUrl = 'https://storage.supabase.co/tenant123/imports/products-2025.csv';

  // 2. Validate before importing
  const validation = await catalog.import.validate(fileUrl, 'csv', {
    hasHeader: true,
    delimiter: ',',
    encoding: 'utf-8',
  });

  console.log(`Valid: ${validation.isValid}`);
  console.log(`Total rows: ${validation.totalRows}`);
  console.log(`Detected fields: ${validation.detectedFields.join(', ')}`);

  if (validation.warnings.length > 0) {
    console.warn('Warnings:');
    for (const w of validation.warnings) {
      console.warn(`  Row ${w.row}: ${w.message}`);
    }
  }

  if (!validation.isValid) {
    console.error('Errors:');
    for (const e of validation.errors) {
      console.error(`  Row ${e.row}, field "${e.field}": ${e.message}`);
    }
    return;
  }

  // Preview mapped data
  console.log('Preview:');
  console.table(validation.preview);

  // 3. Start the import with custom mapping
  const job = await catalog.import.start({
    format: 'csv',
    fileUrl,
    fileName: 'products-2025.csv',
    mapping: {
      fields: {
        'Product Name': 'name',
        'Description': 'description',
        'Price': 'basePrice',
        'Original Price': 'compareAtPrice',
        'SKU': 'sku',
        'Category': 'categoryPath',
        'Color': 'attr:color',
        'Size': 'attr:size',
        'Material': 'attr:material',
        'Image URL': 'imageUrl',
        'Weight (g)': 'weightGrams',
        'Stock': 'inventoryQuantity',
      },
      defaults: {
        currency: 'USD',
        status: 'draft',
        type: 'physical',
      },
      hasHeader: true,
      imageHandling: 'url',
    },
    conflictStrategy: 'merge',          // merge with existing on SKU match
  });

  console.log(`Import started: ${job.id}, status: ${job.status}`);

  // 4. Poll for completion
  let status = job;
  while (status.status === 'validating' || status.status === 'processing') {
    await new Promise(r => setTimeout(r, 2000));
    status = await catalog.import.getStatus(job.id);
    const pct = Math.round((status.processedRows / status.totalRows) * 100);
    console.log(`Progress: ${pct}% (${status.processedRows}/${status.totalRows})`);
  }

  console.log(`\nImport ${status.status}:`);
  console.log(`  Success: ${status.successCount}`);
  console.log(`  Errors: ${status.errorCount}`);
  console.log(`  Skipped: ${status.skipCount}`);

  if (status.errors.length > 0) {
    console.log('\nErrors:');
    for (const err of status.errors.slice(0, 10)) {
      console.log(`  Row ${err.row}: [${err.code}] ${err.message}`);
    }
  }

  // 5. List recent import jobs
  const jobs = await catalog.import.listJobs({ limit: 10 });
  for (const j of jobs) {
    console.log(`${j.fileName} — ${j.status} — ${j.successCount}/${j.totalRows}`);
  }
}
```

### Example 7: Product Bundles

```typescript
import { CatalogService } from '@mcv/commerce/catalog';

async function createBundle(catalog: CatalogService) {
  // 1. Create the bundle product
  const bundleProduct = await catalog.products.create({
    name: 'Summer Essentials Bundle',
    description: 'Everything you need for summer — t-shirt, shorts, and sunglasses.',
    type: 'bundle',
    basePrice: 0,                        // calculated from components
    tags: ['bundle', 'summer', 'value-pack'],
  });

  // 2. Create the bundle configuration
  const bundle = await catalog.bundles.create({
    productId: bundleProduct.id,
    pricingStrategy: 'calculated',       // sum of items minus discount
    discountPercentage: 15,              // 15% off the sum
    items: [
      {
        productId: 'tshirt_product_id',
        quantity: 1,
        isOptional: false,
        position: 0,
      },
      {
        productId: 'shorts_product_id',
        quantity: 1,
        isOptional: false,
        position: 1,
      },
      {
        productId: 'sunglasses_product_id',
        quantity: 1,
        isOptional: true,               // customer can remove
        position: 2,
      },
    ],
  });

  // 3. Calculate the bundle price
  const price = await catalog.bundles.calculatePrice(bundle.id);
  console.log(`Bundle price: $${(price.unitPrice / 100).toFixed(2)}`);
  console.log(`You save: $${(price.discountAmount / 100).toFixed(2)} (${price.discountPercentage}%)`);

  // Calculate with specific variant selections
  const priceWithSelections = await catalog.bundles.calculatePrice(bundle.id, {
    'tshirt_product_id': 'variant_black_l_id',
    'shorts_product_id': 'variant_khaki_m_id',
  });

  // 4. Add another item to existing bundle
  await catalog.bundles.addItem(bundle.id, {
    productId: 'cap_product_id',
    quantity: 1,
    isOptional: true,
    position: 3,
  });

  // 5. Create a fixed-price bundle
  const fixedBundle = await catalog.bundles.create({
    productId: fixedBundleProductId,
    pricingStrategy: 'fixed',
    fixedPrice: 4999,                    // $49.99 regardless of item prices
    items: [
      { productId: 'item1_id', quantity: 2 },
      { productId: 'item2_id', quantity: 1 },
      { productId: 'item3_id', quantity: 1 },
    ],
  });

  // 6. "Buy 3, get cheapest free" bundle
  const bogoBundle = await catalog.bundles.create({
    productId: bogoBundleProductId,
    pricingStrategy: 'cheapest_free',
    items: [
      { productId: 'any_tshirt_id', quantity: 1 },
      { productId: 'any_tshirt_id_2', quantity: 1 },
      { productId: 'any_tshirt_id_3', quantity: 1 },
    ],
  });

  // Publish the bundle
  await catalog.products.publish(bundleProduct.id);
}
```

### Example 8: Digital Products

```typescript
import { CatalogService } from '@mcv/commerce/catalog';

async function createDigitalProduct(catalog: CatalogService) {
  // 1. Create a digital product (e-book)
  const ebook = await catalog.products.create({
    name: 'TypeScript Design Patterns',
    description: 'Master 23 design patterns with real-world TypeScript examples.',
    type: 'digital',
    basePrice: 2999,
    currency: 'USD',
    requiresShipping: false,
    tags: ['ebook', 'typescript', 'programming'],
  });

  // 2. Attach the digital asset
  const asset = await catalog.digital.createAsset({
    productId: ebook.id,
    fileUrl: 'https://storage.supabase.co/tenant/assets/ts-patterns-v2.pdf',
    fileName: 'typescript-design-patterns-v2.pdf',
    fileSize: 15_400_000,                // ~15MB
    fileType: 'application/pdf',
    accessType: 'download',
    maxDownloads: 5,                     // limit downloads per purchase
    drmConfig: {
      provider: 'watermark',
      watermark: true,
      watermarkTemplate: 'Licensed to {{customer_name}} (Order #{{order_id}})',
    },
  });

  // 3. Create a software product with license keys
  const software = await catalog.products.create({
    name: 'CodeLens Pro - Annual License',
    type: 'digital',
    basePrice: 9999,
    tags: ['software', 'developer-tools'],
  });

  const softwareAsset = await catalog.digital.createAsset({
    productId: software.id,
    fileUrl: 'https://storage.supabase.co/tenant/assets/codelens-installer.dmg',
    fileName: 'codelens-pro-installer.dmg',
    fileSize: 85_000_000,
    fileType: 'application/x-apple-diskimage',
    accessType: 'license',
    accessDurationDays: 365,             // 1 year access
  });

  // 4. Pre-generate license keys
  const keys = await catalog.digital.generateLicenseKeys(softwareAsset.id, 100, {
    pattern: 'XXXX-XXXX-XXXX-XXXX',
    charset: 'alpha_upper',
    prefix: 'CLP-',
    hasExpiry: true,
    expiryDays: 365,
  });
  console.log(`Generated ${keys.length} license keys`);
  // e.g., "CLP-ABCD-EFGH-IJKL-MNOP"

  // 5. Claim a license key (called by order fulfillment)
  const claimed = await catalog.digital.claimLicenseKey(
    softwareAsset.id,
    'customer_123',
    'order_456'
  );
  console.log(`License key: ${claimed.keyValue}`);
  console.log(`Expires: ${claimed.expiresAt}`);

  // 6. Create a download token (called by order fulfillment)
  const token = await catalog.digital.createDownloadToken(
    asset.id,
    'customer_789',
    'order_012'
  );
  console.log(`Download URL: /api/downloads/${token.token}`);

  // 7. Validate a download token (called by download endpoint)
  const validation = await catalog.digital.validateDownloadToken(token.token);
  if (validation.valid) {
    // Serve the file, then record the download
    await catalog.digital.recordDownload(token.token);
  }

  // 8. Revoke a license key
  await catalog.digital.revokeLicenseKey(claimed.id, 'Chargeback on order #456');

  await catalog.products.publish(ebook.id);
  await catalog.products.publish(software.id);
}
```

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| `CATALOG_001` | `PRODUCT_NOT_FOUND` | Product with the given ID or slug does not exist |
| `CATALOG_002` | `PRODUCT_SLUG_TAKEN` | The slug is already in use by another product in this tenant |
| `CATALOG_003` | `PRODUCT_INVALID_STATUS_TRANSITION` | Cannot transition from current status to requested status (e.g., archived → published) |
| `CATALOG_004` | `PRODUCT_PUBLISH_REQUIRES_PRICE` | Cannot publish a product without a base price |
| `CATALOG_005` | `PRODUCT_PUBLISH_REQUIRES_IMAGE` | Cannot publish a product without at least one image |
| `CATALOG_006` | `PRODUCT_MAX_IMAGES_EXCEEDED` | Product has reached the maximum number of images (default: 20) |
| `CATALOG_007` | `PRODUCT_MAX_CATEGORIES_EXCEEDED` | Product assigned to too many categories (default: 10) |
| `CATALOG_010` | `VARIANT_NOT_FOUND` | Variant with the given ID or SKU does not exist |
| `CATALOG_011` | `VARIANT_SKU_TAKEN` | The SKU is already in use by another variant in this tenant |
| `CATALOG_012` | `VARIANT_DUPLICATE_OPTIONS` | A variant with the same option combination already exists |
| `CATALOG_013` | `VARIANT_MAX_PER_PRODUCT` | Product has reached the maximum number of variants (default: 100) |
| `CATALOG_014` | `VARIANT_INSUFFICIENT_STOCK` | Cannot deduct more inventory than available (and backorder is disabled) |
| `CATALOG_015` | `VARIANT_NEGATIVE_INVENTORY` | Inventory adjustment would result in negative quantity |
| `CATALOG_020` | `CATEGORY_NOT_FOUND` | Category with the given ID, slug, or path does not exist |
| `CATALOG_021` | `CATEGORY_SLUG_TAKEN` | The slug is already in use by a sibling category |
| `CATALOG_022` | `CATEGORY_CIRCULAR_REFERENCE` | Moving a category would create a circular parent reference |
| `CATALOG_023` | `CATEGORY_MAX_DEPTH` | Category nesting exceeds maximum allowed depth (default: 10) |
| `CATALOG_024` | `CATEGORY_HAS_CHILDREN` | Cannot delete a category that still has child categories |
| `CATALOG_030` | `PRICE_RULE_INVALID_VALUE` | Price rule value is invalid (e.g., negative, percentage > 100) |
| `CATALOG_031` | `PRICE_RULE_INVALID_DATE_RANGE` | Start date is after end date |
| `CATALOG_032` | `PRICE_RULE_CONFLICT` | Rule conflicts with existing rule of same type/priority |
| `CATALOG_040` | `ATTRIBUTE_NOT_FOUND` | Attribute definition does not exist |
| `CATALOG_041` | `ATTRIBUTE_SLUG_TAKEN` | Attribute slug is already in use in this tenant |
| `CATALOG_042` | `ATTRIBUTE_INVALID_VALUE` | Value does not match the attribute's type or validation rules |
| `CATALOG_043` | `ATTRIBUTE_REQUIRED_MISSING` | A required attribute value is missing |
| `CATALOG_050` | `SEARCH_QUERY_TOO_LONG` | Search query exceeds maximum length (default: 500 chars) |
| `CATALOG_051` | `SEARCH_INVALID_FILTER` | Filter field or operator is not supported |
| `CATALOG_060` | `IMPORT_INVALID_FORMAT` | Import file format is not CSV or JSON |
| `CATALOG_061` | `IMPORT_FILE_TOO_LARGE` | Import file exceeds maximum size (default: 50MB) |
| `CATALOG_062` | `IMPORT_MAPPING_INVALID` | Required fields are not mapped |
| `CATALOG_063` | `IMPORT_JOB_NOT_FOUND` | Import job with the given ID does not exist |
| `CATALOG_064` | `IMPORT_JOB_NOT_CANCELLABLE` | Job is already completed or failed |
| `CATALOG_070` | `BUNDLE_NOT_FOUND` | Bundle configuration does not exist |
| `CATALOG_071` | `BUNDLE_ITEM_SELF_REFERENCE` | A bundle cannot contain itself as an item |
| `CATALOG_072` | `BUNDLE_CIRCULAR_REFERENCE` | Bundle A contains bundle B which contains bundle A |
| `CATALOG_080` | `DIGITAL_ASSET_NOT_FOUND` | Digital asset does not exist |
| `CATALOG_081` | `LICENSE_KEY_POOL_EMPTY` | No available license keys for the requested asset |
| `CATALOG_082` | `LICENSE_KEY_ALREADY_CLAIMED` | The license key has already been claimed |
| `CATALOG_083` | `DOWNLOAD_TOKEN_INVALID` | Download token is expired, revoked, or does not exist |
| `CATALOG_084` | `DOWNLOAD_LIMIT_EXCEEDED` | Maximum download count has been reached |
| `CATALOG_090` | `IMAGE_INVALID_FORMAT` | Image format is not supported (allowed: JPEG, PNG, WebP, AVIF, GIF) |
| `CATALOG_091` | `IMAGE_TOO_LARGE` | Image exceeds maximum file size (default: 10MB) |
| `CATALOG_092` | `IMAGE_DIMENSIONS_EXCEEDED` | Image dimensions exceed maximum (default: 8192×8192) |
| `CATALOG_100` | `SEO_SLUG_INVALID_CHARS` | Slug contains characters not allowed in URLs |

---

## Security

### Catalog Access Control

```typescript
/**
 * Catalog operations enforce role-based permissions through the tenant context.
 *
 * Roles and their catalog capabilities:
 *
 * | Operation              | admin | manager | editor | viewer | storefront |
 * |------------------------|-------|---------|--------|--------|------------|
 * | Create product         | ✓     | ✓       | ✓      | ✗      | ✗          |
 * | Edit product           | ✓     | ✓       | ✓      | ✗      | ✗          |
 * | Publish product        | ✓     | ✓       | ✗      | ✗      | ✗          |
 * | Delete product         | ✓     | ✓       | ✗      | ✗      | ✗          |
 * | View draft products    | ✓     | ✓       | ✓      | ✓      | ✗          |
 * | View published products| ✓     | ✓       | ✓      | ✓      | ✓          |
 * | Manage categories      | ✓     | ✓       | ✗      | ✗      | ✗          |
 * | Manage pricing rules   | ✓     | ✓       | ✗      | ✗      | ✗          |
 * | Manage attributes      | ✓     | ✓       | ✗      | ✗      | ✗          |
 * | Run imports            | ✓     | ✓       | ✗      | ✗      | ✗          |
 * | Search (public)        | ✓     | ✓       | ✓      | ✓      | ✓          |
 * | Manage digital assets  | ✓     | ✓       | ✓      | ✗      | ✗          |
 * | Manage bundles         | ✓     | ✓       | ✓      | ✗      | ✗          |
 *
 * Storefront role sees only: published, visible, non-deleted products
 * via RLS policies applied at the database level.
 */
```

### Multi-Tenant Isolation

```typescript
/**
 * Every request to the catalog module flows through the tenant context middleware:
 *
 * 1. JWT contains tenant_id claim
 * 2. Middleware sets PostgreSQL session variable:
 *    SET LOCAL app.current_tenant_id = '<tenant-uuid>';
 * 3. All tables have RLS policies filtering by tenant_id
 * 4. Even raw SQL queries cannot access other tenants' data
 *
 * Cross-tenant access is physically impossible at the database layer.
 */
```

### Image Upload Validation

```typescript
/**
 * Image uploads are validated at multiple layers:
 *
 * 1. **Content-Type check** — Only image/jpeg, image/png, image/webp, image/avif, image/gif
 * 2. **Magic bytes verification** — File header bytes must match claimed MIME type
 * 3. **File size limit** — Max 10MB per image (configurable via CATALOG_MAX_IMAGE_SIZE_MB)
 * 4. **Dimension limit** — Max 8192×8192 pixels
 * 5. **Filename sanitization** — Strip path traversal, null bytes, special characters
 * 6. **EXIF stripping** — Remove EXIF metadata (GPS coordinates, device info)
 * 7. **Virus scanning** — Optional ClamAV integration for malware detection
 * 8. **Storage path** — Images stored at: {tenant_id}/products/{product_id}/{uuid}.{ext}
 *
 * Images are served through Supabase Storage with CDN caching and
 * on-the-fly transforms (resize, format conversion via image proxy).
 */

const IMAGE_VALIDATION_CONFIG = {
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'],
  maxFileSizeBytes: 10 * 1024 * 1024,   // 10MB
  maxDimensions: { width: 8192, height: 8192 },
  stripExif: true,
  virusScan: process.env.CATALOG_ENABLE_VIRUS_SCAN === 'true',
};
```

### Import Sanitization

```typescript
/**
 * Import files undergo rigorous sanitization:
 *
 * 1. **File size limit** — Max 50MB per import file
 * 2. **Row limit** — Max 50,000 rows per import job
 * 3. **Field sanitization** — HTML stripped from text fields, XSS prevention
 * 4. **Price validation** — Must be non-negative integers, reasonable bounds check
 * 5. **URL validation** — Image URLs validated against allowlist of domains
 * 6. **SKU validation** — Only alphanumeric + dash/underscore, max 64 chars
 * 7. **SQL injection prevention** — Parameterized queries (Drizzle ORM ensures this)
 * 8. **Rate limiting** — Max 3 concurrent import jobs per tenant
 * 9. **Timeout** — Import jobs auto-cancel after 30 minutes of processing
 * 10. **Rollback** — Failed imports can be rolled back (products created are soft-deleted)
 */

const IMPORT_SECURITY_CONFIG = {
  maxFileSizeBytes: 50 * 1024 * 1024,    // 50MB
  maxRows: 50_000,
  maxConcurrentJobs: 3,
  jobTimeoutMinutes: 30,
  allowedImageDomains: ['storage.supabase.co', 'cdn.shopify.com', 'images.unsplash.com'],
  skuPattern: /^[A-Za-z0-9\-_]{1,64}$/,
  sanitizeHtml: true,
  maxFieldLength: 10_000,               // 10K chars for description fields
};
```

---

## Environment Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `CATALOG_DEFAULT_CURRENCY` | `string` | `USD` | Default currency for new products (ISO 4217) |
| `CATALOG_MAX_VARIANTS_PER_PRODUCT` | `number` | `100` | Maximum variants allowed per product |
| `CATALOG_MAX_IMAGES_PER_PRODUCT` | `number` | `20` | Maximum images per product |
| `CATALOG_MAX_CATEGORIES_PER_PRODUCT` | `number` | `10` | Maximum categories a product can be assigned to |
| `CATALOG_MAX_CATEGORY_DEPTH` | `number` | `10` | Maximum nesting depth for categories |
| `CATALOG_MAX_IMAGE_SIZE_MB` | `number` | `10` | Maximum image file size in megabytes |
| `CATALOG_MAX_IMPORT_SIZE_MB` | `number` | `50` | Maximum import file size in megabytes |
| `CATALOG_MAX_IMPORT_ROWS` | `number` | `50000` | Maximum rows per import job |
| `CATALOG_MAX_CONCURRENT_IMPORTS` | `number` | `3` | Max concurrent import jobs per tenant |
| `CATALOG_IMPORT_TIMEOUT_MIN` | `number` | `30` | Import job timeout in minutes |
| `CATALOG_SLUG_MAX_LENGTH` | `number` | `128` | Maximum length for URL slugs |
| `CATALOG_SEARCH_MIN_QUERY_LENGTH` | `number` | `2` | Minimum characters for search query |
| `CATALOG_SEARCH_MAX_QUERY_LENGTH` | `number` | `500` | Maximum characters for search query |
| `CATALOG_SEARCH_DEFAULT_PAGE_SIZE` | `number` | `24` | Default results per search page |
| `CATALOG_SEARCH_MAX_PAGE_SIZE` | `number` | `100` | Maximum results per search page |
| `CATALOG_TRGM_THRESHOLD` | `number` | `0.3` | pg_trgm similarity threshold for fuzzy matching |
| `CATALOG_ENABLE_VIRUS_SCAN` | `boolean` | `false` | Enable ClamAV virus scanning for uploads |
| `CATALOG_IMAGE_CDN_BASE_URL` | `string` | — | Base URL for CDN-served images |
| `CATALOG_LICENSE_ENCRYPTION_KEY` | `string` | — | **Required.** Encryption key for license key storage |
| `CATALOG_DOWNLOAD_TOKEN_TTL_HOURS` | `number` | `24` | Download token expiry in hours |
| `SUPABASE_STORAGE_BUCKET_PRODUCTS` | `string` | `products` | Supabase Storage bucket for product images |
| `SUPABASE_STORAGE_BUCKET_IMPORTS` | `string` | `imports` | Supabase Storage bucket for import files |
| `SUPABASE_STORAGE_BUCKET_DIGITAL` | `string` | `digital-assets` | Supabase Storage bucket for digital assets |

---

## Dependencies

### Internal Dependencies

| Module | Purpose |
|--------|---------|
| `@mcv/core/database` | Drizzle ORM instance, connection pool, transaction management |
| `@mcv/core/auth` | Tenant context, user roles, JWT validation |
| `@mcv/core/events` | Event bus for publishing catalog events (product.created, etc.) |
| `@mcv/core/storage` | Supabase Storage client for image and file uploads |
| `@mcv/core/validation` | Zod schemas, input sanitization utilities |
| `@mcv/core/errors` | Standardized error classes and error code registry |
| `@mcv/core/logging` | Structured logging for import jobs, search analytics |
| `@mcv/commerce/tax` | Tax class references for product tax configuration |
| `@mcv/commerce/inventory` | Inventory service integration for stock management |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `drizzle-orm` | `^0.34` | Type-safe SQL query builder and schema definitions |
| `drizzle-zod` | `^0.5` | Auto-generate Zod schemas from Drizzle tables |
| `@trpc/server` | `^11` | tRPC router definitions for API endpoints |
| `zod` | `^3.23` | Runtime input validation for all service methods |
| `slugify` | `^1.6` | URL-safe slug generation with transliteration |
| `csv-parse` | `^5.5` | Streaming CSV parser for bulk imports |
| `csv-stringify` | `^6.5` | CSV serialization for exports |
| `sharp` | `^0.33` | Image processing (resize, format conversion, EXIF removal) |
| `nanoid` | `^5` | Short unique ID generation for SKUs and tokens |
| `file-type` | `^19` | Magic-byte-based file type detection |

---

## Testing

### Unit Tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestCatalog, createTestTenant } from '@mcv/commerce/catalog/testing';

describe('ProductService', () => {
  let catalog: CatalogService;

  beforeEach(async () => {
    const tenant = await createTestTenant();
    catalog = await createTestCatalog(tenant.id);
  });

  it('creates a product with auto-generated slug', async () => {
    const product = await catalog.products.create({
      name: 'Test Product 123',
      basePrice: 1999,
    });

    expect(product.slug).toBe('test-product-123');
    expect(product.status).toBe('draft');
    expect(product.currency).toBe('USD');
  });

  it('prevents duplicate slugs within a tenant', async () => {
    await catalog.products.create({ name: 'My Product', basePrice: 999 });

    const second = await catalog.products.create({ name: 'My Product', basePrice: 1999 });
    expect(second.slug).toBe('my-product-2');
  });

  it('enforces status transitions', async () => {
    const product = await catalog.products.create({ name: 'Test', basePrice: 999 });

    // draft → published is valid
    await catalog.products.publish(product.id);

    // published → draft requires unpublish
    await expect(
      catalog.products.restore(product.id)
    ).rejects.toThrow('PRODUCT_INVALID_STATUS_TRANSITION');
  });

  it('resolves prices with volume tiers', async () => {
    const product = await catalog.products.create({ name: 'Bulk Item', basePrice: 1000 });

    await catalog.pricing.createRule({
      productId: product.id,
      name: '10+ units',
      type: 'volume_tier',
      value: 800,
      minQuantity: 10,
    });

    const price = await catalog.pricing.resolvePrice({
      productId: product.id,
      quantity: 15,
    });

    expect(price.unitPrice).toBe(800);
    expect(price.isOnSale).toBe(true);
  });
});

describe('CategoryService', () => {
  it('builds correct materialized paths', async () => {
    const root = await catalog.categories.create({ name: 'Root' });
    const child = await catalog.categories.create({ name: 'Child', parentId: root.id });
    const grandchild = await catalog.categories.create({ name: 'Grandchild', parentId: child.id });

    expect(root.path).toBe('/root');
    expect(child.path).toBe('/root/child');
    expect(grandchild.path).toBe('/root/child/grandchild');
    expect(grandchild.depth).toBe(2);
  });

  it('prevents circular references', async () => {
    const a = await catalog.categories.create({ name: 'A' });
    const b = await catalog.categories.create({ name: 'B', parentId: a.id });

    await expect(
      catalog.categories.move(a.id, b.id)
    ).rejects.toThrow('CATEGORY_CIRCULAR_REFERENCE');
  });

  it('updates product counts on assignment', async () => {
    const cat = await catalog.categories.create({ name: 'Test Cat' });
    const product = await catalog.products.create({ name: 'P1', basePrice: 100 });

    await catalog.categories.assignProducts(cat.id, [product.id]);
    const updated = await catalog.categories.get(cat.id);
    expect(updated!.productCount).toBe(1);
  });
});

describe('ProductSearchService', () => {
  it('returns relevant results with full-text search', async () => {
    await catalog.products.create({ name: 'Blue Cotton T-Shirt', basePrice: 2999, status: 'published' });
    await catalog.products.create({ name: 'Red Silk Dress', basePrice: 5999, status: 'published' });
    await catalog.products.create({ name: 'Cotton Socks Pack', basePrice: 999, status: 'published' });

    // Allow search index to update
    await catalog.search.reindex();

    const result = await catalog.search.query({ query: 'cotton' });
    expect(result.total).toBe(2);
    expect(result.products.map(p => p.name)).toContain('Blue Cotton T-Shirt');
    expect(result.products.map(p => p.name)).toContain('Cotton Socks Pack');
  });

  it('filters by price range', async () => {
    await catalog.products.create({ name: 'Cheap Item', basePrice: 500, status: 'published' });
    await catalog.products.create({ name: 'Expensive Item', basePrice: 9999, status: 'published' });

    const result = await catalog.search.query({
      priceRange: { min: 100, max: 1000 },
    });

    expect(result.total).toBe(1);
    expect(result.products[0].name).toBe('Cheap Item');
  });

  it('handles typos via trigram similarity', async () => {
    await catalog.products.create({ name: 'Leather Jacket', basePrice: 15999, status: 'published' });
    await catalog.search.reindex();

    const result = await catalog.search.query({ query: 'lether jaket' });
    expect(result.total).toBeGreaterThanOrEqual(1);
    expect(result.products[0].name).toBe('Leather Jacket');
  });

  it('computes facets for active filters', async () => {
    const result = await catalog.search.query({
      query: 't-shirt',
      facets: ['color', 'size', 'brand'],
    });

    const colorFacet = result.facets.find(f => f.field === 'color');
    expect(colorFacet).toBeDefined();
    expect(colorFacet!.values.length).toBeGreaterThan(0);
    for (const val of colorFacet!.values) {
      expect(val.count).toBeGreaterThan(0);
    }
  });
});

describe('ImportService', () => {
  it('validates a CSV file before import', async () => {
    const validation = await catalog.import.validate(csvFileUrl, 'csv');

    expect(validation.isValid).toBe(true);
    expect(validation.totalRows).toBeGreaterThan(0);
    expect(validation.suggestedMapping.fields).toBeDefined();
    expect(validation.preview.length).toBeLessThanOrEqual(5);
  });

  it('rejects invalid import files', async () => {
    const validation = await catalog.import.validate(badFileUrl, 'csv');

    expect(validation.isValid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });

  it('processes import to completion', async () => {
    const job = await catalog.import.start({
      format: 'csv',
      fileUrl: csvFileUrl,
      fileName: 'test.csv',
      mapping: testMapping,
      conflictStrategy: 'skip',
    });

    // Poll until complete
    let status = await catalog.import.getStatus(job.id);
    while (status.status === 'processing') {
      await new Promise(r => setTimeout(r, 100));
      status = await catalog.import.getStatus(job.id);
    }

    expect(status.status).toBe('completed');
    expect(status.successCount).toBeGreaterThan(0);
    expect(status.errorCount).toBe(0);
  });
});

describe('BundleService', () => {
  it('calculates bundle price with discount', async () => {
    const p1 = await catalog.products.create({ name: 'Item A', basePrice: 1000 });
    const p2 = await catalog.products.create({ name: 'Item B', basePrice: 2000 });
    const bundleProduct = await catalog.products.create({ name: 'Bundle', basePrice: 0, type: 'bundle' });

    const bundle = await catalog.bundles.create({
      productId: bundleProduct.id,
      pricingStrategy: 'calculated',
      discountPercentage: 10,
      items: [
        { productId: p1.id, quantity: 1 },
        { productId: p2.id, quantity: 1 },
      ],
    });

    const price = await catalog.bundles.calculatePrice(bundle.id);
    expect(price.unitPrice).toBe(2700);  // (1000 + 2000) * 0.9
    expect(price.discountAmount).toBe(300);
  });

  it('prevents circular bundle references', async () => {
    const bundleA = await catalog.products.create({ name: 'A', basePrice: 0, type: 'bundle' });
    const bundleB = await catalog.products.create({ name: 'B', basePrice: 0, type: 'bundle' });

    await catalog.bundles.create({
      productId: bundleA.id,
      pricingStrategy: 'fixed',
      fixedPrice: 5000,
      items: [{ productId: bundleB.id }],
    });

    await expect(
      catalog.bundles.create({
        productId: bundleB.id,
        pricingStrategy: 'fixed',
        fixedPrice: 5000,
        items: [{ productId: bundleA.id }],
      })
    ).rejects.toThrow('BUNDLE_CIRCULAR_REFERENCE');
  });
});

describe('DigitalProductService', () => {
  it('generates and claims license keys', async () => {
    const product = await catalog.products.create({ name: 'Software', basePrice: 4999, type: 'digital' });
    const asset = await catalog.digital.createAsset({
      productId: product.id,
      fileUrl: 'https://example.com/installer.zip',
      fileName: 'installer.zip',
      fileSize: 50_000_000,
      fileType: 'application/zip',
      accessType: 'license',
    });

    const keys = await catalog.digital.generateLicenseKeys(asset.id, 5, {
      pattern: 'XXXX-XXXX-XXXX',
      charset: 'alpha_upper',
    });

    expect(keys.length).toBe(5);
    expect(keys[0].status).toBe('available');

    const claimed = await catalog.digital.claimLicenseKey(asset.id, 'customer_1', 'order_1');
    expect(claimed.status).toBe('claimed');
    expect(claimed.claimedBy).toBe('customer_1');
  });

  it('validates and tracks download tokens', async () => {
    const token = await catalog.digital.createDownloadToken(assetId, 'cust_1', 'ord_1');

    const valid = await catalog.digital.validateDownloadToken(token.token);
    expect(valid.valid).toBe(true);

    await catalog.digital.recordDownload(token.token);

    // Token with maxDownloads: 1 should be invalid after one download
    const afterDownload = await catalog.digital.validateDownloadToken(token.token);
    expect(afterDownload.valid).toBe(false);
  });
});
```

### Integration Test Configuration

```typescript
// vitest.config.ts (catalog module)
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/services/**', 'src/utils/**'],
      thresholds: {
        statements: 85,
        branches: 80,
        functions: 85,
        lines: 85,
      },
    },
  },
});
```

```typescript
// src/test/setup.ts
import { createTestDatabase, seedTestData, cleanupTestDatabase } from '@mcv/core/testing';

beforeAll(async () => {
  await createTestDatabase();
  await seedTestData('catalog');
});

afterAll(async () => {
  await cleanupTestDatabase();
});
```

### Test Coverage Requirements

| Area | Minimum Coverage | Critical Paths |
|------|-----------------|----------------|
| Product CRUD | 90% | Status transitions, slug generation, soft-delete |
| Variant management | 85% | SKU generation, inventory adjustment, option combos |
| Category tree | 90% | Path computation, circular reference detection, move |
| Price resolution | 95% | Rule evaluation order, date ranges, volume tiers |
| Search | 80% | Full-text ranking, facet aggregation, typo tolerance |
| Import/Export | 85% | Validation pipeline, conflict resolution, error handling |
| Bundle pricing | 90% | All three strategies, circular reference detection |
| Digital products | 85% | License key lifecycle, download token validation |
| Security | 95% | RLS enforcement, image validation, input sanitization |

---

*Last updated: 2025-02-08*
*Module maintainer: Commerce Team*