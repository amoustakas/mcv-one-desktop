# @mcv/fabric/search — Search Module

**Parent Package:** @mcv/fabric  
**Tier:** 2 (Infrastructure Services)  
**Classification:** INTERNAL  
**Last Updated:** February 8, 2026

---

## Purpose

The `search` module provides full-text search infrastructure for the MCV ecosystem. It abstracts search providers (PostgreSQL full-text, Elasticsearch, Typesense), handles indexing, query building, and faceted search. Designed for multi-tenant environments with venture-scoped search indexes.

**Every search box in the platform is powered by this module.**

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// SEARCH OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════════

export { 
  search,
  searchMultiple,
  suggest,
  count,
} from './search';

// ═══════════════════════════════════════════════════════════════════════════════
// INDEXING
// ═══════════════════════════════════════════════════════════════════════════════

export {
  index,
  indexBulk,
  update,
  remove,
  reindex,
  getIndexStats,
} from './indexing';

// ═══════════════════════════════════════════════════════════════════════════════
// QUERY BUILDING
// ═══════════════════════════════════════════════════════════════════════════════

export { 
  QueryBuilder,
  createQuery,
} from './query-builder';

// ═══════════════════════════════════════════════════════════════════════════════
// SEARCH PROVIDERS
// ═══════════════════════════════════════════════════════════════════════════════

export { PostgresSearchProvider } from './providers/postgres';
export { ElasticsearchProvider } from './providers/elasticsearch';
export { TypesenseProvider } from './providers/typesense';

// ═══════════════════════════════════════════════════════════════════════════════
// ANALYZERS & TOKENIZERS
// ═══════════════════════════════════════════════════════════════════════════════

export { 
  analyze,
  tokenize,
  normalize,
} from './analyzers';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

export { useSearch } from './client/hooks/use-search';
export { useSuggest } from './client/hooks/use-suggest';
export { useSearchFilters } from './client/hooks/use-search-filters';

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

export { SearchBox } from './client/components/search-box';
export { SearchResults } from './client/components/search-results';
export { SearchFilters } from './client/components/search-filters';
export { Facets } from './client/components/facets';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  SearchQuery,
  SearchResult,
  SearchHit,
  SearchOptions,
  SearchIndex,
  IndexConfig,
  Facet,
  FacetValue,
  Filter,
  SortOption,
  Highlight,
  SuggestResult,
} from './types';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SEARCH MODULE ARCHITECTURE                             │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                            CLIENT LAYER                                      │ │
│  │                                                                              │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │ │
│  │  │  SearchBox   │  │ SearchResults│  │   Facets     │  │ SearchFilters│    │ │
│  │  │              │  │              │  │              │  │              │    │ │
│  │  │  Query input │  │  Hit display │  │  Aggregated  │  │  Filter UI   │    │ │
│  │  │  Suggestions │  │  Pagination  │  │  facet values│  │              │    │ │
│  │  └──────┬───────┘  └──────────────┘  └──────────────┘  └──────────────┘    │ │
│  │         │                                                                    │ │
│  │         ▼                                                                    │ │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │                        useSearch Hook                                    │ │ │
│  │  │                                                                          │ │ │
│  │  │  • Debounced query execution                                            │ │ │
│  │  │  • Facet management                                                      │ │ │
│  │  │  • Filter state                                                          │ │ │
│  │  │  • Pagination                                                            │ │ │
│  │  └─────────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                              │ │
│  └──────────────────────────────────────────────────────────────────────────────┘ │
│                                       │                                           │
│  ┌────────────────────────────────────▼─────────────────────────────────────────┐ │
│  │                           SEARCH SERVICE                                      │ │
│  │                                                                               │ │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │                        Query Builder                                     │ │ │
│  │  │                                                                          │ │ │
│  │  │  search('deals')                                                         │ │ │
│  │  │    .query('enterprise software')                                         │ │ │
│  │  │    .filter('status', 'open')                                            │ │ │
│  │  │    .filter('value', { gte: 10000 })                                     │ │ │
│  │  │    .facet('stage', 'owner', 'tag')                                      │ │ │
│  │  │    .sort('value', 'desc')                                               │ │ │
│  │  │    .limit(20)                                                            │ │ │
│  │  │    .execute()                                                            │ │ │
│  │  └─────────────────────────────────────────────────────────────────────────┘ │ │
│  │                                    │                                          │ │
│  │                                    ▼                                          │ │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │                      Search Provider Interface                           │ │ │
│  │  │                                                                          │ │ │
│  │  │  search(index, query, options)  → SearchResult                          │ │ │
│  │  │  index(index, document)          → void                                  │ │ │
│  │  │  suggest(index, prefix, options) → SuggestResult                        │ │ │
│  │  └──────────────────────────────────┬──────────────────────────────────────┘ │ │
│  │                                     │                                         │ │
│  │         ┌───────────────────────────┼───────────────────────────┐            │ │
│  │         │                           │                           │            │ │
│  │    ┌────▼──────────┐    ┌───────────▼────────┐    ┌────────────▼───┐        │ │
│  │    │   PostgreSQL  │    │   Elasticsearch    │    │   Typesense    │        │ │
│  │    │   (Default)   │    │   (Enterprise)     │    │   (Cloud)      │        │ │
│  │    │               │    │                    │    │                │        │ │
│  │    │   tsvector    │    │   Full-text +      │    │   Typo-tolerant│        │ │
│  │    │   GIN index   │    │   relevance tuning │    │   Instant      │        │ │
│  │    └───────────────┘    └────────────────────┘    └────────────────┘        │ │
│  │                                                                               │ │
│  └───────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                     │
│  ┌───────────────────────────────────────────────────────────────────────────────┐ │
│  │                              INDEXING LAYER                                    │ │
│  │                                                                                │ │
│  │    ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                 │ │
│  │    │  Event-Driven  │  │   Bulk Index   │  │    Reindex     │                 │ │
│  │    │   Indexing     │  │    (Import)    │  │    (Rebuild)   │                 │ │
│  │    │                │  │                │  │                │                 │ │
│  │    │ On entity save │  │ Initial load   │  │ Schema change  │                 │ │
│  │    │ → queue index  │  │ Large datasets │  │ Provider swap  │                 │ │
│  │    └────────────────┘  └────────────────┘  └────────────────┘                 │ │
│  │                                                                                │ │
│  └────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Search Indexes

| Index | Entities | Searchable Fields | Facets |
|-------|----------|-------------------|--------|
| `deals` | Deal | name, description, notes, contactName, companyName | stage, owner, status, tag |
| `contacts` | Contact | firstName, lastName, email, company, notes | status, tag, owner |
| `companies` | Company | name, domain, description, industry | industry, size, tag |
| `users` | User | displayName, email, firstName, lastName | role, status, venture |
| `documents` | Document | title, content, tags | type, folder, author |
| `tasks` | Task | title, description | status, priority, assignee |

---

## Core Interfaces

### SearchQuery

```typescript
interface SearchQuery {
  // Query text
  query: string;
  
  // Index/collection
  index: string;
  
  // Venture scope (multi-tenant)
  ventureId: string;
  
  // Filters
  filters?: Filter[];
  
  // Facets to aggregate
  facets?: string[];
  
  // Sorting
  sort?: SortOption[];
  
  // Pagination
  offset?: number;
  limit?: number;
  
  // Highlighting
  highlight?: boolean;
  highlightFields?: string[];
  
  // Typo tolerance
  typoTolerance?: boolean | 'strict' | 'min' | 'off';
}
```

### SearchResult

```typescript
interface SearchResult<T = unknown> {
  // Hits
  hits: SearchHit<T>[];
  total: number;
  
  // Facets
  facets?: Record<string, Facet>;
  
  // Pagination
  offset: number;
  limit: number;
  hasMore: boolean;
  
  // Performance
  queryTimeMs: number;
  
  // Query info
  query: string;
  correctedQuery?: string;             // Auto-corrected query
}

interface SearchHit<T = unknown> {
  id: string;
  score: number;                        // Relevance score
  document: T;                          // Full document
  highlights?: Record<string, string[]>; // Highlighted snippets
}
```

### Filter

```typescript
interface Filter {
  field: string;
  operator: FilterOperator;
  value: FilterValue;
}

type FilterOperator =
  | 'eq'                                // Equal
  | 'neq'                               // Not equal
  | 'gt'                                // Greater than
  | 'gte'                               // Greater than or equal
  | 'lt'                                // Less than
  | 'lte'                               // Less than or equal
  | 'in'                                // In array
  | 'nin'                               // Not in array
  | 'contains'                          // String contains
  | 'range'                             // Numeric/date range
  | 'exists'                            // Field exists
  | 'geo_distance';                     // Geo distance

type FilterValue = string | number | boolean | Date | unknown[];
```

### Facet

```typescript
interface Facet {
  field: string;
  values: FacetValue[];
  total: number;                        // Total unique values
}

interface FacetValue {
  value: string;
  count: number;
  selected?: boolean;                   // For UI state
}
```

### IndexConfig

```typescript
interface IndexConfig {
  name: string;
  
  // Schema
  fields: IndexField[];
  
  // Settings
  settings: {
    // Text analysis
    analyzer?: 'standard' | 'english' | 'simple' | 'whitespace';
    stopwords?: string[];
    synonyms?: Record<string, string[]>;
    
    // Typo tolerance
    minTypoLength?: number;             // Min word length for typos
    maxTypos?: number;                  // Max typos per word
    
    // Ranking
    rankingRules?: string[];            // Custom ranking order
  };
  
  // Multi-tenant
  tenantField?: string;                 // e.g., 'ventureId'
}

interface IndexField {
  name: string;
  type: 'text' | 'keyword' | 'number' | 'date' | 'boolean' | 'geo';
  
  // Searchability
  searchable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  facetable?: boolean;
  
  // Text options
  weight?: number;                      // Boost factor
  index?: boolean;                      // Index this field
}
```

---

## Usage Examples

### Basic Search

```typescript
import { search, searchMultiple, suggest, count } from '@mcv/search';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 1: Simple text search
// ═══════════════════════════════════════════════════════════════════════════════

const results = await search('deals', {
  query: 'enterprise software',
  ventureId: 'venture-123',
  limit: 20,
});

console.log(`Found ${results.total} deals`);
for (const hit of results.hits) {
  console.log(`${hit.document.name} (score: ${hit.score})`);
  if (hit.highlights?.description) {
    console.log(`  "${hit.highlights.description[0]}"`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 2: Search with filters and facets
// ═══════════════════════════════════════════════════════════════════════════════

const results = await search('deals', {
  query: 'enterprise',
  ventureId: 'venture-123',
  filters: [
    { field: 'status', operator: 'eq', value: 'open' },
    { field: 'value', operator: 'gte', value: 10000 },
    { field: 'stage', operator: 'in', value: ['proposal', 'negotiation'] },
  ],
  facets: ['stage', 'owner', 'tag'],
  sort: [{ field: 'value', order: 'desc' }],
  limit: 20,
});

// Facet results
console.log('Stages:', results.facets.stage.values);
// [{ value: 'proposal', count: 12 }, { value: 'negotiation', count: 8 }]

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 3: Multi-index search
// ═══════════════════════════════════════════════════════════════════════════════

const results = await searchMultiple(['deals', 'contacts', 'companies'], {
  query: 'Acme Corp',
  ventureId: 'venture-123',
  limit: 10,
});

// Results grouped by index
console.log('Deals:', results.deals.hits);
console.log('Contacts:', results.contacts.hits);
console.log('Companies:', results.companies.hits);

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 4: Autocomplete suggestions
// ═══════════════════════════════════════════════════════════════════════════════

const suggestions = await suggest('deals', {
  prefix: 'ent',
  ventureId: 'venture-123',
  limit: 5,
  field: 'name',
});

// ['Enterprise Deal', 'Enterprise Software License', 'Entertainment Co.']

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 5: Count query
// ═══════════════════════════════════════════════════════════════════════════════

const count = await count('deals', {
  filters: [
    { field: 'status', operator: 'eq', value: 'open' },
    { field: 'createdAt', operator: 'gte', value: startOfMonth(new Date()) },
  ],
  ventureId: 'venture-123',
});

console.log(`${count} open deals this month`);
```

### Query Builder

```typescript
import { QueryBuilder, createQuery } from '@mcv/search';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 6: Fluent query building
// ═══════════════════════════════════════════════════════════════════════════════

const results = await createQuery('deals')
  .venture('venture-123')
  .query('enterprise software')
  .filter('status', 'open')
  .filter('value', { gte: 10000, lte: 100000 })
  .filter('stage', { in: ['proposal', 'negotiation'] })
  .filter('createdAt', { gte: subMonths(new Date(), 3) })
  .facet('stage', 'owner', 'tag')
  .sort('value', 'desc')
  .highlight(['name', 'description'])
  .page(1, 20)
  .execute();

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 7: Geo search
// ═══════════════════════════════════════════════════════════════════════════════

const results = await createQuery('companies')
  .venture('venture-123')
  .filter('location', {
    geoDistance: {
      lat: 40.7128,
      lng: -74.0060,
      distance: '10km',
    },
  })
  .sort('_geo_distance', 'asc')
  .execute();

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 8: Phrase and boolean queries
// ═══════════════════════════════════════════════════════════════════════════════

const results = await createQuery('documents')
  .venture('venture-123')
  .query('"machine learning" AND (Python OR TensorFlow)')
  .filter('type', 'article')
  .sort('publishedAt', 'desc')
  .execute();
```

### Indexing

```typescript
import { index, indexBulk, update, remove, reindex } from '@mcv/search';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 9: Index a document
// ═══════════════════════════════════════════════════════════════════════════════

await index('deals', {
  id: 'deal-123',
  ventureId: 'venture-456',
  name: 'Enterprise Software License',
  description: 'Annual license for enterprise features',
  value: 50000,
  currency: 'USD',
  stage: 'proposal',
  status: 'open',
  ownerId: 'user-789',
  ownerName: 'John Smith',
  contactIds: ['contact-1', 'contact-2'],
  tags: ['enterprise', 'software', 'annual'],
  createdAt: new Date(),
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 10: Bulk indexing
// ═══════════════════════════════════════════════════════════════════════════════

// For initial import or large batches
await indexBulk('deals', deals.map(deal => ({
  id: deal.id,
  ventureId: deal.ventureId,
  name: deal.name,
  description: deal.description,
  value: deal.value,
  stage: deal.stageId,
  status: deal.status,
  ownerName: deal.owner?.displayName,
  tags: deal.tags,
  createdAt: deal.createdAt,
})));

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 11: Partial update
// ═══════════════════════════════════════════════════════════════════════════════

// Only update changed fields
await update('deals', 'deal-123', {
  stage: 'negotiation',
  value: 55000,
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 12: Remove from index
// ═══════════════════════════════════════════════════════════════════════════════

await remove('deals', 'deal-123');

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 13: Full reindex
// ═══════════════════════════════════════════════════════════════════════════════

// Rebuild entire index (runs in background)
await reindex('deals', {
  source: async function* () {
    const cursor = db.query.deals.findMany({
      with: { owner: true, contacts: true },
    });
    for await (const deal of cursor) {
      yield transformDealForIndex(deal);
    }
  },
  batchSize: 1000,
});
```

### React Hooks

```tsx
import { useSearch, useSuggest, useSearchFilters } from '@mcv/search/client';
import { SearchBox, SearchResults, Facets } from '@mcv/search/client';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 14: Search page component
// ═══════════════════════════════════════════════════════════════════════════════

function DealSearch({ ventureId }: { ventureId: string }) {
  const {
    query,
    setQuery,
    results,
    isLoading,
    facets,
    filters,
    setFilter,
    removeFilter,
    sort,
    setSort,
    page,
    setPage,
  } = useSearch('deals', {
    ventureId,
    facets: ['stage', 'owner', 'tag'],
    defaultSort: { field: 'createdAt', order: 'desc' },
  });
  
  return (
    <div className="flex gap-4">
      {/* Sidebar with facets */}
      <aside className="w-64">
        <h3 className="font-semibold mb-4">Filters</h3>
        
        {facets && (
          <>
            <Facets
              title="Stage"
              facet={facets.stage}
              selected={filters.stage}
              onSelect={(value) => setFilter('stage', value)}
              onClear={() => removeFilter('stage')}
            />
            
            <Facets
              title="Owner"
              facet={facets.owner}
              selected={filters.owner}
              onSelect={(value) => setFilter('owner', value)}
            />
          </>
        )}
      </aside>
      
      {/* Main content */}
      <main className="flex-1">
        <SearchBox
          value={query}
          onChange={setQuery}
          placeholder="Search deals..."
        />
        
        <div className="flex justify-between my-4">
          <span>{results?.total ?? 0} results</span>
          <select 
            value={`${sort.field}:${sort.order}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split(':');
              setSort({ field, order });
            }}
          >
            <option value="createdAt:desc">Newest</option>
            <option value="value:desc">Highest Value</option>
            <option value="name:asc">Name A-Z</option>
          </select>
        </div>
        
        <SearchResults
          hits={results?.hits ?? []}
          isLoading={isLoading}
          renderHit={(hit) => (
            <DealCard 
              key={hit.id} 
              deal={hit.document} 
              highlights={hit.highlights}
            />
          )}
        />
        
        <Pagination
          page={page}
          total={results?.total ?? 0}
          pageSize={20}
          onChange={setPage}
        />
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 15: Autocomplete with suggestions
// ═══════════════════════════════════════════════════════════════════════════════

function GlobalSearch() {
  const [query, setQuery] = useState('');
  const { suggestions, isLoading } = useSuggest(['deals', 'contacts', 'companies'], {
    prefix: query,
    ventureId,
    limit: 5,
  });
  
  return (
    <Combobox value={query} onChange={setQuery}>
      <Combobox.Input 
        placeholder="Search everything..."
        onChange={(e) => setQuery(e.target.value)}
      />
      
      <Combobox.Options>
        {isLoading && <LoadingSpinner />}
        
        {suggestions?.deals?.map((hit) => (
          <Combobox.Option key={hit.id} value={hit}>
            <DealIcon /> {hit.document.name}
          </Combobox.Option>
        ))}
        
        {suggestions?.contacts?.map((hit) => (
          <Combobox.Option key={hit.id} value={hit}>
            <ContactIcon /> {hit.document.displayName}
          </Combobox.Option>
        ))}
      </Combobox.Options>
    </Combobox>
  );
}
```

---

## Index Configuration

```typescript
// Example index configuration for deals
const dealsIndexConfig: IndexConfig = {
  name: 'deals',
  tenantField: 'ventureId',
  
  fields: [
    // Text fields (searchable)
    { name: 'name', type: 'text', searchable: true, weight: 10 },
    { name: 'description', type: 'text', searchable: true, weight: 5 },
    { name: 'notes', type: 'text', searchable: true, weight: 2 },
    { name: 'ownerName', type: 'text', searchable: true, weight: 3 },
    { name: 'contactName', type: 'text', searchable: true, weight: 3 },
    
    // Keyword fields (filterable, facetable)
    { name: 'stage', type: 'keyword', filterable: true, facetable: true },
    { name: 'status', type: 'keyword', filterable: true, facetable: true },
    { name: 'ownerId', type: 'keyword', filterable: true, facetable: true },
    { name: 'tags', type: 'keyword', filterable: true, facetable: true },
    
    // Numeric fields
    { name: 'value', type: 'number', filterable: true, sortable: true },
    
    // Date fields
    { name: 'createdAt', type: 'date', filterable: true, sortable: true },
    { name: 'expectedCloseDate', type: 'date', filterable: true, sortable: true },
    
    // Tenant field
    { name: 'ventureId', type: 'keyword', filterable: true },
  ],
  
  settings: {
    analyzer: 'english',
    synonyms: {
      'enterprise': ['corporate', 'business', 'company'],
      'saas': ['software as a service', 'cloud software'],
    },
    minTypoLength: 4,
    maxTypos: 2,
  },
};
```

---

## Performance Considerations

### Search Latency Targets

| Operation | PostgreSQL | Elasticsearch | Typesense |
|-----------|------------|---------------|-----------|
| Simple search | < 100ms | < 50ms | < 20ms |
| Faceted search | < 200ms | < 100ms | < 50ms |
| Suggestions | < 50ms | < 30ms | < 10ms |
| Bulk index (1000) | < 5s | < 2s | < 1s |

### Scaling Guidelines

- PostgreSQL: Good for < 1M documents per index
- Elasticsearch: Good for 1M-100M documents
- Typesense: Best for instant search, < 10M documents

---

## Environment Variables

```bash
# Search provider
SEARCH_PROVIDER=postgres               # postgres | elasticsearch | typesense

# PostgreSQL (default)
# Uses DATABASE_URL from @mcv/db

# Elasticsearch
ELASTICSEARCH_URL=https://es.example.com:9200
ELASTICSEARCH_API_KEY=xxx

# Typesense
TYPESENSE_HOST=ts.example.com
TYPESENSE_PORT=443
TYPESENSE_PROTOCOL=https
TYPESENSE_API_KEY=xxx

# Index settings
SEARCH_INDEX_PREFIX=mcv_
SEARCH_BATCH_SIZE=1000
```

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| @elastic/elasticsearch | ^8.x | Elasticsearch client |
| typesense | ^1.x | Typesense client |
| drizzle-orm | ^0.29.x | PostgreSQL full-text |

---

*@mcv/fabric/search — Full-Text Search Module*
