# @mcv/fabric — API Reference
## Schemas, Types & Interfaces

**Package:** `@mcv/fabric`  
**Version:** 1.0.0  
**Last Updated:** February 9, 2026

---

## Audit Module

### Functions

```typescript
/**
 * Log an audit event
 */
export async function log(event: AuditEvent): Promise<void>;

/**
 * Query audit history
 */
export async function query(params: AuditQuery): Promise<PaginatedResult<AuditLog>>;

/**
 * Export audit logs for compliance
 */
export async function exportLogs(params: AuditExport): Promise<ExportResult>;

/**
 * Get audit log by ID
 */
export async function getById(id: string): Promise<AuditLog | null>;
```

### Types

```typescript
interface AuditEvent {
  action: string;           // e.g., 'user.created', 'order.updated'
  resource: string;         // e.g., 'users', 'orders'
  resourceId?: string;      // ID of affected resource
  dataBefore?: object;      // State before change
  dataAfter?: object;       // State after change
  metadata?: object;        // Additional context
}

interface AuditQuery {
  ventureId?: string;
  userId?: string;
  resource?: string;
  resourceId?: string;
  action?: string;
  dateRange?: { from: Date; to: Date };
  page?: number;
  limit?: number;
}

interface AuditLog {
  id: string;
  ventureId: string;
  userId: string | null;
  userEmail: string | null;
  userIp: string | null;
  userAgent: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  dataBefore: object | null;
  dataAfter: object | null;
  metadata: object | null;
  timestamp: Date;
  retainUntil: Date;
}

interface AuditExport {
  ventureId: string;
  dateRange: { from: Date; to: Date };
  format: 'csv' | 'json';
  resource?: string;
}

interface ExportResult {
  url: string;
  expiresAt: Date;
  rowCount: number;
}
```

---

## Storage Module

### Functions

```typescript
/**
 * Upload a file
 */
export async function upload(options: UploadOptions): Promise<StorageFile>;

/**
 * Get a signed URL for private file access
 */
export async function getSignedUrl(options: SignedUrlOptions): Promise<string>;

/**
 * Delete a file
 */
export async function remove(options: DeleteOptions): Promise<void>;

/**
 * List files in a path
 */
export async function list(options: ListOptions): Promise<StorageFile[]>;

/**
 * Get file metadata
 */
export async function getMetadata(options: GetOptions): Promise<StorageFile | null>;

/**
 * Copy a file
 */
export async function copy(from: string, to: string, bucket: string): Promise<StorageFile>;

/**
 * Move a file
 */
export async function move(from: string, to: string, bucket: string): Promise<StorageFile>;
```

### Types

```typescript
interface UploadOptions {
  bucket: string;
  path: string;
  content: Buffer | Readable | Blob;
  contentType: string;
  public?: boolean;
  metadata?: Record<string, string>;
  cacheControl?: string;
}

interface StorageFile {
  id: string;
  bucket: string;
  path: string;
  name: string;
  size: number;
  contentType: string;
  url: string;
  publicUrl?: string;
  metadata: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

interface SignedUrlOptions {
  bucket: string;
  path: string;
  expiresIn?: number; // seconds, default 3600
  download?: boolean;
  transform?: ImageTransform;
}

interface ImageTransform {
  width?: number;
  height?: number;
  resize?: 'cover' | 'contain' | 'fill';
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

interface ListOptions {
  bucket: string;
  prefix?: string;
  limit?: number;
  cursor?: string;
}

interface DeleteOptions {
  bucket: string;
  path: string;
}
```

---

## Realtime Module

### Functions

```typescript
/**
 * Create or get a channel
 */
export function channel(name: string, options?: ChannelOptions): RealtimeChannel;

/**
 * Subscribe to database changes
 */
export function onDatabaseChange<T>(
  table: string,
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
  callback: (payload: DatabaseChange<T>) => void
): Subscription;

/**
 * Broadcast to all instances
 */
export async function broadcast(channel: string, event: string, payload: unknown): Promise<void>;
```

### Types

```typescript
interface ChannelOptions {
  ventureId?: string;
  private?: boolean;
}

interface RealtimeChannel {
  /**
   * Subscribe to channel events
   */
  on(event: string, callback: (payload: unknown) => void): this;
  
  /**
   * Track presence
   */
  track(state: PresenceState): Promise<void>;
  
  /**
   * Untrack presence
   */
  untrack(): Promise<void>;
  
  /**
   * Get current presence state
   */
  presenceState(): Record<string, PresenceState[]>;
  
  /**
   * Send message to channel
   */
  send(event: string, payload: unknown): Promise<void>;
  
  /**
   * Unsubscribe from channel
   */
  unsubscribe(): Promise<void>;
}

interface PresenceState {
  id: string;
  userId?: string;
  status?: 'online' | 'away' | 'busy';
  lastSeen?: Date;
  [key: string]: unknown;
}

interface DatabaseChange<T> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  old: T | null;
  new: T | null;
  commitTimestamp: string;
}

interface Subscription {
  unsubscribe(): void;
}
```

---

## Notifications Module

### Functions

```typescript
/**
 * Send notification to a user
 */
export async function send(options: SendOptions): Promise<NotificationResult>;

/**
 * Send notification to multiple users
 */
export async function broadcast(options: BroadcastOptions): Promise<NotificationResult[]>;

/**
 * Get delivery status
 */
export async function getDeliveryStatus(id: string): Promise<DeliveryStatus>;

/**
 * Get user preferences
 */
export async function getPreferences(userId: string): Promise<UserPreferences>;

/**
 * Update user preferences
 */
export async function updatePreferences(
  userId: string,
  prefs: Partial<UserPreferences>
): Promise<UserPreferences>;

/**
 * Mark notification as read
 */
export async function markAsRead(userId: string, notificationId: string): Promise<void>;

/**
 * Get user's notifications
 */
export async function getInbox(
  userId: string,
  options?: InboxOptions
): Promise<PaginatedResult<Notification>>;
```

### Types

```typescript
interface SendOptions {
  userId: string;
  template: string;
  data?: Record<string, unknown>;
  channels?: ('email' | 'push' | 'sms' | 'inApp' | 'whatsapp')[];
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  scheduledAt?: Date;
}

interface BroadcastOptions {
  userIds: string[];
  template: string;
  data?: Record<string, unknown>;
  channels?: string[];
}

interface NotificationResult {
  id: string;
  userId: string;
  template: string;
  channels: string[];
  status: 'queued' | 'sent' | 'delivered' | 'failed';
  createdAt: Date;
}

interface DeliveryStatus {
  id: string;
  channels: {
    channel: string;
    status: 'pending' | 'sent' | 'delivered' | 'failed' | 'opened';
    sentAt?: Date;
    deliveredAt?: Date;
    openedAt?: Date;
    error?: string;
  }[];
}

interface UserPreferences {
  email: {
    enabled: boolean;
    digest?: 'realtime' | 'hourly' | 'daily' | 'weekly';
    categories?: Record<string, boolean>;
  };
  push: {
    enabled: boolean;
    quietHours?: { start: string; end: string };
  };
  sms: {
    enabled: boolean;
  };
  inApp: {
    enabled: boolean;
    sound?: boolean;
  };
}

interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: Date;
}
```

---

## Flags Module

### Functions

```typescript
/**
 * Check if flag is enabled
 */
export async function isEnabled(
  key: string,
  context?: FlagContext
): Promise<boolean>;

/**
 * Get flag value (for multivariate)
 */
export async function getValue<T = unknown>(
  key: string,
  context?: FlagContext
): Promise<T>;

/**
 * Get all flags for context
 */
export async function getAll(context?: FlagContext): Promise<Record<string, unknown>>;

/**
 * Set override for testing
 */
export async function setOverride(
  key: string,
  value: unknown,
  context: FlagContext
): Promise<void>;

/**
 * Clear override
 */
export async function clearOverride(key: string, context: FlagContext): Promise<void>;

/**
 * Create or update flag
 */
export async function upsertFlag(flag: FlagDefinition): Promise<Flag>;

/**
 * Create experiment
 */
export async function createExperiment(experiment: ExperimentDefinition): Promise<Experiment>;
```

### Types

```typescript
interface FlagContext {
  userId?: string;
  ventureId?: string;
  organizationId?: string;
  attributes?: Record<string, unknown>;
}

interface FlagDefinition {
  key: string;
  name: string;
  description?: string;
  type: 'boolean' | 'string' | 'number' | 'json';
  defaultValue: unknown;
  targetingRules?: TargetingRule[];
}

interface TargetingRule {
  attribute: string;
  operator: 'eq' | 'neq' | 'contains' | 'startsWith' | 'endsWith' | 'in' | 'notIn' | 'gt' | 'gte' | 'lt' | 'lte';
  value: unknown;
  returnValue: unknown;
}

interface ExperimentDefinition {
  key: string;
  name: string;
  description?: string;
  variants: string[];
  weights?: number[];
  targetingRules?: TargetingRule[];
  startAt?: Date;
  endAt?: Date;
}

interface Experiment {
  id: string;
  key: string;
  name: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  variants: { name: string; weight: number }[];
  metrics?: { name: string; type: string }[];
  createdAt: Date;
}
```

---

## Queue Module

### Functions

```typescript
/**
 * Register job processor
 */
export function process<T>(
  name: string,
  handler: (job: Job<T>) => Promise<void>,
  options?: ProcessOptions
): void;

/**
 * Add job to queue
 */
export async function add<T>(
  name: string,
  data: T,
  options?: JobOptions
): Promise<Job<T>>;

/**
 * Schedule a job for later
 */
export async function schedule<T>(
  name: string,
  data: T,
  options: ScheduleOptions
): Promise<Job<T>>;

/**
 * Add cron job
 */
export async function cron(
  name: string,
  pattern: string,
  handler: () => Promise<void>
): Promise<void>;

/**
 * Get job by ID
 */
export async function getJob<T>(id: string): Promise<Job<T> | null>;

/**
 * Get queue statistics
 */
export async function getStats(queueName?: string): Promise<QueueStats>;

/**
 * Pause queue
 */
export async function pause(queueName: string): Promise<void>;

/**
 * Resume queue
 */
export async function resume(queueName: string): Promise<void>;
```

### Types

```typescript
interface Job<T = unknown> {
  id: string;
  name: string;
  data: T;
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';
  progress: number;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  failedReason?: string;
  
  /**
   * Update job progress
   */
  updateProgress(progress: number): Promise<void>;
  
  /**
   * Log message
   */
  log(message: string): Promise<void>;
}

interface JobOptions {
  priority?: number;
  delay?: number;
  attempts?: number;
  backoff?: { type: 'fixed' | 'exponential'; delay: number };
  removeOnComplete?: boolean | number;
  removeOnFail?: boolean | number;
  jobId?: string;
}

interface ScheduleOptions extends JobOptions {
  delay: number; // milliseconds
}

interface ProcessOptions {
  concurrency?: number;
  limiter?: { max: number; duration: number };
}

interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
}
```

---

## Events Module

### Functions

```typescript
/**
 * Publish domain event
 */
export async function publish<T>(type: string, data: T): Promise<void>;

/**
 * Subscribe to events
 */
export function subscribe<T>(
  pattern: string,
  handler: EventHandler<T>,
  options?: SubscribeOptions
): Subscription;

/**
 * Replay events
 */
export async function replay(
  type: string,
  options: ReplayOptions
): Promise<number>;

/**
 * Get event by ID
 */
export async function getEvent(id: string): Promise<DomainEvent | null>;
```

### Types

```typescript
interface DomainEvent<T = unknown> {
  id: string;
  type: string;
  version: number;
  timestamp: string;
  ventureId: string;
  userId?: string;
  correlationId: string;
  data: T;
}

type EventHandler<T> = (event: DomainEvent<T>) => Promise<void>;

interface SubscribeOptions {
  group?: string;
  fromBeginning?: boolean;
}

interface ReplayOptions {
  from?: Date | string;
  to?: Date | string;
  handler?: EventHandler<unknown>;
}
```

---

## Search Module

### Functions

```typescript
/**
 * Index a document
 */
export async function index<T extends object>(
  indexName: string,
  document: T
): Promise<void>;

/**
 * Bulk index documents
 */
export async function bulkIndex<T extends object>(
  indexName: string,
  documents: T[]
): Promise<void>;

/**
 * Search documents
 */
export async function query<T>(
  indexName: string,
  params: SearchParams
): Promise<SearchResult<T>>;

/**
 * Remove document from index
 */
export async function remove(indexName: string, id: string): Promise<void>;

/**
 * Create or update index settings
 */
export async function configureIndex(
  indexName: string,
  settings: IndexSettings
): Promise<void>;
```

### Types

```typescript
interface SearchParams {
  q: string;
  filters?: Record<string, unknown>;
  facets?: string[];
  sort?: string[];
  limit?: number;
  offset?: number;
  ventureId?: string;
  highlightPreTag?: string;
  highlightPostTag?: string;
}

interface SearchResult<T> {
  hits: SearchHit<T>[];
  total: number;
  facets?: Record<string, FacetValue[]>;
  processingTimeMs: number;
  query: string;
}

interface SearchHit<T> {
  id: string;
  document: T;
  score: number;
  highlights?: Record<string, string[]>;
}

interface FacetValue {
  value: string;
  count: number;
}

interface IndexSettings {
  primaryKey?: string;
  searchableAttributes?: string[];
  filterableAttributes?: string[];
  sortableAttributes?: string[];
  rankingRules?: string[];
  synonyms?: Record<string, string[]>;
  stopWords?: string[];
}
```

---

## Cache Module

### Functions

```typescript
/**
 * Get cached value
 */
export async function get<T>(key: string): Promise<T | null>;

/**
 * Set cached value
 */
export async function set<T>(
  key: string,
  value: T,
  options?: CacheOptions
): Promise<void>;

/**
 * Get or compute value
 */
export async function getOrSet<T>(
  key: string,
  fn: () => Promise<T>,
  options?: CacheOptions
): Promise<T>;

/**
 * Delete cached value
 */
export async function del(key: string): Promise<void>;

/**
 * Delete by pattern
 */
export async function deletePattern(pattern: string): Promise<number>;

/**
 * Check rate limit
 */
export async function rateLimit(options: RateLimitOptions): Promise<RateLimitResult>;

/**
 * Create memoized function
 */
export function memoize<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: MemoizeOptions
): T;

/**
 * Increment counter
 */
export async function incr(key: string, by?: number): Promise<number>;

/**
 * Set with expiry
 */
export async function expire(key: string, seconds: number): Promise<void>;
```

### Types

```typescript
interface CacheOptions {
  ttl?: number; // seconds
  tags?: string[];
}

interface RateLimitOptions {
  key: string;
  limit: number;
  window: number; // seconds
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
}

interface MemoizeOptions {
  keyFn: (...args: any[]) => string;
  ttl: number;
}
```

---

## Package Exports

```typescript
// Main exports
export { audit } from './audit';
export { storage } from './storage';
export { realtime } from './realtime';
export { notifications } from './notifications';
export { flags } from './flags';
export { queue } from './queue';
export { events } from './events';
export { search } from './search';
export { cache } from './cache';

// Type exports
export type { AuditEvent, AuditLog, AuditQuery } from './audit';
export type { StorageFile, UploadOptions, ImageTransform } from './storage';
export type { RealtimeChannel, PresenceState } from './realtime';
export type { SendOptions, NotificationResult, UserPreferences } from './notifications';
export type { FlagContext, FlagDefinition, Experiment } from './flags';
export type { Job, JobOptions, QueueStats } from './queue';
export type { DomainEvent, EventHandler } from './events';
export type { SearchParams, SearchResult, IndexSettings } from './search';
export type { CacheOptions, RateLimitResult } from './cache';
```

---

*@mcv/fabric — API Reference v1.0*
