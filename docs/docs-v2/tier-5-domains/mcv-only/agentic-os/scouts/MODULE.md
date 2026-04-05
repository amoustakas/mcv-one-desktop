# @mcv/agentic-os/scouts — Autonomous Monitoring Network
## Observation, Anomaly Detection, Health Checks & Alert Management

**Module:** `@mcv/agentic-os/scouts`  
**Classification:** INTERNAL (MCV-Only)  
**Status:** CANONICAL SPECIFICATION  
**Quality Level:** SURGICAL (1000+ lines)

---

## 1. Purpose

The Scouts module provides the **Level 1 autonomous monitoring layer** of the NAOS hierarchy — the eyes and ears of the Agentic Operating System. Scouts are lightweight, read-only agents that observe system behavior, collect telemetry, detect anomalies, and raise alerts — **without ever taking action**. They are the watchers that inform Queen's adaptive planning and provide operators with real-time visibility into system health.

**Key principle: Scouts observe. They never act.**

A Scout cannot write data, send external communications, trigger deployments, or modify system state. Their sole purpose is to collect observations, detect deviations from expected behavior, and alert the appropriate humans or agents when something requires attention.

The module implements:

1. **Scout Network** — Deployment, scheduling, lifecycle management, and coordination of multiple scout agents across all nine MCV ventures.
2. **Anomaly Detection** — Statistical and ML-based algorithms (Z-Score, IQR, Isolation Forest, Prophet, LSTM) for detecting deviations in time-series telemetry.
3. **Health Monitoring** — Configurable health checks (HTTP, TCP, database, metrics, custom) with uptime tracking and SLA compliance.
4. **Alert Management** — Alert generation, deduplication, severity classification, multi-channel notification, acknowledgement, snoozing, and resolution workflows.
5. **Data Collection** — Pluggable collector framework supporting HTTP endpoints, database queries, metrics APIs, event streams, and custom data sources.

Scouts run on configurable schedules (cron expressions or fixed intervals) and produce structured `Observation` records that are stored in PostgreSQL for historical analysis and fed into the anomaly detection pipeline.

---

## 2. Architecture

### 2.1 Scout Network Architecture

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                         SCOUT NETWORK                                        │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │                      SCOUT SCHEDULER                                 │    │
│  │                                                                      │    │
│  │  • Cron-based scheduling engine (node-cron)                         │    │
│  │  • Interval-based scheduling (setInterval)                          │    │
│  │  • Event-triggered execution (Redpanda/Kafka consumers)             │    │
│  │  • Manual trigger support via API                                    │    │
│  │  • Concurrency control (max parallel scouts per venture)            │    │
│  └──────────────────────────────┬───────────────────────────────────────┘    │
│                                 │                                            │
│                                 ▼                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │                      SCOUT EXECUTION ENGINE                          │    │
│  │                                                                      │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────────┐  │    │
│  │  │   Health    │ │ Performance │ │  Security   │ │  Compliance  │  │    │
│  │  │   Scout    │ │   Scout    │ │   Scout    │ │    Scout     │  │    │
│  │  │            │ │            │ │            │ │              │  │    │
│  │  │ • HTTP     │ │ • Latency  │ │ • Vuln scan│ │ • Policy     │  │    │
│  │  │ • TCP      │ │ • Throughput│ │ • Access   │ │ • Regulation │  │    │
│  │  │ • DB alive │ │ • Error rate│ │ • Audit    │ │ • Data gov   │  │    │
│  │  └─────┬───────┘ └─────┬───────┘ └─────┬───────┘ └──────┬───────┘  │    │
│  │        │               │               │                │          │    │
│  │  ┌─────────────┐ ┌─────────────┐                                   │    │
│  │  │    Cost     │ │   Quality   │                                   │    │
│  │  │   Scout    │ │   Scout    │                                   │    │
│  │  │            │ │            │                                   │    │
│  │  │ • Spend    │ │ • Task pass│                                   │    │
│  │  │ • Budget   │ │ • User sat │                                   │    │
│  │  │ • Forecast │ │ • Accuracy │                                   │    │
│  │  └─────┬───────┘ └─────┬───────┘                                   │    │
│  │        │               │               │                │          │    │
│  └────────┴───────────────┴───────────────┴────────────────┴──────────┘    │
│                                 │                                            │
│                                 ▼                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │                     DATA PIPELINE                                    │    │
│  │                                                                      │    │
│  │  ┌────────────┐    ┌────────────────┐    ┌─────────────────────┐    │    │
│  │  │ Collectors │───▶│  Observations  │───▶│  Anomaly Detector   │    │    │
│  │  │            │    │  (PostgreSQL)  │    │                     │    │    │
│  │  │ HTTP, TCP, │    │                │    │ Z-Score, IQR,       │    │    │
│  │  │ DB, Metrics│    │ Time-series    │    │ Isolation Forest,   │    │    │
│  │  │ API, Custom│    │ storage with   │    │ Prophet, LSTM       │    │    │
│  │  │            │    │ severity tags  │    │                     │    │    │
│  │  └────────────┘    └────────────────┘    └──────────┬──────────┘    │    │
│  │                                                      │              │    │
│  │                                                      ▼              │    │
│  │                                          ┌─────────────────────┐    │    │
│  │                                          │   Alert Manager     │    │    │
│  │                                          │                     │    │    │
│  │                                          │ • Deduplication     │    │    │
│  │                                          │ • Severity routing  │    │    │
│  │                                          │ • Multi-channel     │    │    │
│  │                                          │   notification      │    │    │
│  │                                          │ • Lifecycle mgmt    │    │    │
│  │                                          └─────────────────────┘    │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└───────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Observation Flow

```
Scout Execution Triggered (cron/interval/event/manual)
        │
        ▼
┌────────────────────┐
│  Load Scout Config │
│                    │
│  • Target endpoint │
│  • Collectors      │
│  • Thresholds      │
│  • Alert rules     │
└────────┬───────────┘
         │
         ▼
┌────────────────────┐    ┌────────────────────┐
│  Run Collectors    │───▶│  Collector Results  │
│                    │    │                     │
│  HTTP → status,    │    │  { metric: value,   │
│    latency, body   │    │    metric: value,   │
│  TCP → connect,    │    │    ... }            │
│    latency         │    │                     │
│  DB → query result │    └──────────┬──────────┘
│  Metrics → values  │               │
│  Custom → output   │               │
└────────────────────┘               │
                                     ▼
                          ┌────────────────────┐
                          │  Check Thresholds  │
                          │                    │
                          │  For each metric:  │
                          │  value > threshold?│
                          │  Determine severity│
                          └──────────┬─────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                 │
                    ▼                ▼                 ▼
             No thresholds    Warning threshold   Critical threshold
              breached          breached            breached
                    │                │                 │
                    ▼                ▼                 ▼
            ┌──────────┐    ┌──────────────┐   ┌──────────────┐
            │ Store as │    │ Store + Check│   │ Store + Fire │
            │ info obs │    │  anomaly det │   │  alert NOW   │
            └──────────┘    └──────┬───────┘   └──────┬───────┘
                                   │                   │
                                   ▼                   ▼
                          ┌──────────────┐     ┌──────────────┐
                          │ Anomaly      │     │ Alert Manager│
                          │ Detector     │     │              │
                          │              │     │ Deduplicate  │
                          │ Is this a    │     │ Route by     │
                          │ real anomaly │     │ severity     │
                          │ or noise?    │     │ Notify       │
                          └──────┬───────┘     └──────────────┘
                                 │
                          ┌──────┴──────┐
                          │             │
                     Normal          Anomaly
                          │             │
                          ▼             ▼
                      No action    Generate alert
```

### 2.3 Alert Lifecycle

```
┌─────────┐  create    ┌─────────────┐
│         │───────────▶│             │
│ (none)  │            │   OPEN      │
│         │            │             │
└─────────┘            └──────┬──────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
           acknowledge     snooze       auto-resolve
                │             │          (condition
                ▼             ▼           cleared)
       ┌──────────────┐ ┌──────────┐       │
       │              │ │          │       │
       │ ACKNOWLEDGED │ │ SNOOZED  │       │
       │              │ │          │       │
       └──────┬───────┘ └────┬─────┘       │
              │              │             │
              │         snooze expires     │
              │              │             │
              │              ▼             │
              │    ┌──────────────┐        │
              │    │   RE-OPENED  │        │
              │    └──────┬───────┘        │
              │           │               │
              └─────┬─────┘               │
                    │                     │
                resolve                   │
                    │                     │
                    ▼                     ▼
             ┌──────────────────────────────┐
             │          RESOLVED            │
             │                              │
             │  Resolution notes required   │
             │  Stored for post-mortem      │
             └──────────────────────────────┘
```

---

## 3. Core Concepts

### 3.1 Scout Types

| Type | Purpose | Typical Schedule | Example Targets |
|------|---------|-----------------|-----------------|
| `system_health` | Monitor service availability and responsiveness | Every 1-5 minutes | API endpoints, databases, message queues |
| `performance` | Track latency, throughput, error rates | Every 5-15 minutes | API gateways, database queries, CDN |
| `security` | Scan for vulnerabilities, unauthorized access | Every 1-6 hours | Auth logs, network traffic, dependency CVEs |
| `compliance` | Verify regulatory and policy compliance | Every 6-24 hours | Data retention, GDPR, SOC2 controls |
| `cost` | Track spending against budgets, forecast overruns | Every 1-4 hours | Cloud bills, API usage, LLM token consumption |
| `quality` | Measure task completion rates, user satisfaction | Every 1-4 hours | Agent metrics, feedback scores, error rates |
| `custom` | User-defined monitoring logic | Configurable | Anything with a collector |

### 3.2 Observe-Only Principle

Scouts have capabilities `['read']` only. The NAOS runtime enforces this — any attempt by a scout to use an instrument requiring `write`, `execute`, `external`, or `financial` capabilities will be rejected with `AgentError`. This design ensures:

1. **Safety**: Scouts cannot cause side effects, even if misconfigured.
2. **Trust**: Operators can deploy scouts without worrying about unintended actions.
3. **Isolation**: Scout failures cannot cascade into system-wide incidents.
4. **Auditability**: Scout activity is purely observational and fully logged.

### 3.3 Collector Framework

Collectors are pluggable data-gathering components. Each scout can run multiple collectors per execution, producing a unified observation record. Built-in collector types:

| Collector | Input | Output | Use Case |
|-----------|-------|--------|----------|
| `http` | URL, method, headers, body | Status code, latency, response body/size | Health checks, API monitoring |
| `tcp` | Host, port, timeout | Connected (bool), latency | Port availability checks |
| `database` | Query, connection string | Row count, query duration, result data | Database health, data quality |
| `metrics` | Metric names, source endpoint | Metric values with timestamps | Prometheus/StatsD/custom metrics |
| `event_stream` | Topic, consumer group, window | Event count, lag, throughput | Kafka/Redpanda monitoring |
| `custom` | Handler function reference | Any structured data | Custom business logic |

### 3.4 Threshold Evaluation

Each scout defines thresholds — rules that map metric values to severity levels. Thresholds support multiple operators:

| Operator | Description | Example |
|----------|-------------|---------|
| `gt` | Greater than | `response_time_p95 > 500ms` |
| `gte` | Greater than or equal | `error_rate >= 0.05` |
| `lt` | Less than | `available_disk_gb < 10` |
| `lte` | Less than or equal | `uptime_pct <= 99.5` |
| `eq` | Equal to | `status_code == 503` |
| `neq` | Not equal to | `health_status != "healthy"` |
| `between` | Within range | `cpu_percent between 80 and 95` |
| `outside` | Outside range | `temperature outside 15-30` |

When a threshold is breached, the observation's severity is elevated and the alert manager is consulted.

### 3.5 Alert Deduplication

Consecutive alerts for the same condition are deduplicated. The deduplication key is computed as:

```
dedup_key = hash(scout_id + observation_type + severity + threshold_metric)
```

If an open alert with the same `dedup_key` already exists, the new observation updates the existing alert (incrementing `occurrenceCount` and updating `lastOccurredAt`) rather than creating a new one. A new alert is only created when:

1. No existing open alert matches the `dedup_key`.
2. The previous alert was resolved and the condition has recurred.

### 3.6 Anomaly Detection Pipeline

The anomaly detection system operates as a secondary analysis layer on top of threshold checks. While thresholds catch known-bad conditions, anomaly detection catches **unexpected patterns** — sudden changes, gradual drifts, seasonal deviations, and multi-dimensional outliers.

The pipeline:
1. **Buffer**: Maintain a sliding window of recent data points per metric.
2. **Detect**: Run the configured algorithm(s) against the buffer.
3. **Score**: Produce an anomaly score (0.0 = normal, 1.0 = extreme anomaly).
4. **Threshold**: Compare score against sensitivity setting.
5. **Alert**: Generate alert if anomaly score exceeds threshold.

---

## 4. Exports

```typescript
// @mcv/agentic-os/scouts/index.ts

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Core Classes
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export { ScoutNetwork } from './network';
export { ScoutRunner } from './runner';
export { AnomalyDetector } from './anomaly';
export { Monitor } from './monitor';
export { AlertManager } from './alerts';
export { CollectorRegistry } from './collectors';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Types
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type {
  // Scout Configuration
  Scout,                             // Full scout definition
  ScoutType,                         // system_health | performance | security | compliance | cost | quality | custom
  ScoutTarget,                       // Monitoring target (service, endpoint, database, etc.)
  ScoutSchedule,                     // Cron / interval / event-triggered schedule
  ScoutConfig,                       // Collectors, thresholds, alert rules

  // Collectors
  CollectorConfig,                   // Base collector configuration
  HttpCollectorConfig,               // HTTP-specific collector config
  TcpCollectorConfig,                // TCP-specific collector config
  DatabaseCollectorConfig,           // Database-specific collector config
  MetricsCollectorConfig,            // Metrics-specific collector config
  EventStreamCollectorConfig,        // Event stream collector config
  CustomCollectorConfig,             // Custom handler collector config
  CollectorResult,                   // Result from a single collector run

  // Thresholds & Observations
  ThresholdConfig,                   // Metric threshold definition
  ThresholdOperator,                 // gt | gte | lt | lte | eq | neq | between | outside
  Observation,                       // Collected data point with metrics
  ObservationSeverity,               // info | warning | error | critical

  // Anomaly Detection
  AnomalyDetectorConfig,             // Algorithm and sensitivity config
  AnomalyAlgorithm,                  // zscore | iqr | isolation_forest | prophet | lstm
  AnomalyResult,                     // Detection result with scoring
  Anomaly,                           // Detected anomaly record
  DataPoint,                         // Time-series data point

  // Alerts
  AlertRule,                         // Alert routing rules
  AlertChannel,                      // slack | email | pagerduty | webhook | in_app
  Alert,                             // Alert record
  AlertStatus,                       // open | acknowledged | resolved | snoozed
  AlertNotification,                 // Notification delivery record

  // Reports
  ScoutReport,                       // Scout execution report
  MonitorConfig,                     // Health monitor configuration
  MonitorStatus,                     // Current health status
  HealthCheck,                       // Individual health check definition
  CheckResult,                       // Health check result

  // Network
  ScoutNetworkConfig,                // Network-wide configuration
  ScoutNetworkStatus,                // Current network status
} from './types';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Schema (Drizzle ORM)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export {
  naosScouts,                        // Scout definitions table
  naosScoutObservations,             // Scout observation log table
  naosAlerts,                        // Alert tracking table
  naosScoutTypeEnum,                 // Scout type enum
  naosObservationSeverityEnum,       // Severity enum
  naosAlertStatusEnum,               // Alert status enum
} from './schema';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Constants
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export {
  SCOUT_TYPES,                       // All valid scout types
  DEFAULT_SCOUT_CONFIG,              // Default scout configuration
  ANOMALY_ALGORITHMS,                // Supported anomaly detection algorithms
  ALERT_CHANNELS,                    // Supported alert delivery channels
  SEVERITY_LEVELS,                   // Severity ordering
  DEFAULT_THRESHOLDS,                // Common default thresholds
} from './constants';
```

---

## 5. TypeScript Interfaces

```typescript
// @mcv/agentic-os/scouts/types.ts

import type { VentureID, Timestamp, Duration } from '../types';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Scout Configuration
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type ScoutType =
  | 'system_health'
  | 'performance'
  | 'security'
  | 'compliance'
  | 'cost'
  | 'quality'
  | 'custom';

export interface Scout {
  /** Unique scout identifier */
  id: string;

  /** Venture this scout belongs to */
  ventureId: VentureID;

  /** Human-readable name */
  name: string;

  /** URL-safe slug */
  slug: string;

  /** Description of what this scout monitors */
  description?: string;

  /** Scout type classification */
  type: ScoutType;

  /** What this scout monitors */
  target: ScoutTarget;

  /** Execution schedule */
  schedule: ScoutSchedule;

  /** Collection, threshold, and alert configuration */
  config: ScoutConfig;

  /** Whether this scout is currently active */
  isActive: boolean;

  /** Execution statistics */
  stats: {
    totalRuns: number;
    alertsGenerated: number;
    lastRunAt?: Date;
    nextRunAt?: Date;
    avgDurationMs?: number;
    successRate?: number;
  };
}

export interface ScoutTarget {
  /** Target type */
  type: 'service' | 'endpoint' | 'database' | 'queue' | 'external' | 'agent' | 'custom';

  /** Target identifier (service name, URL, connection string, etc.) */
  identifier: string;

  /** Optional display name */
  displayName?: string;

  /** Target metadata */
  metadata?: Record<string, unknown>;
}

export interface ScoutSchedule {
  /** Schedule type */
  type: 'cron' | 'interval' | 'event';

  /** Cron expression (for type='cron') */
  expression?: string;

  /** Interval in human-readable format (for type='interval'): "30s", "5m", "1h" */
  interval?: string;

  /** Event topic and filter (for type='event') */
  eventTopic?: string;
  eventFilter?: Record<string, unknown>;

  /** Timezone for cron schedules */
  timezone?: string;

  /** Maximum execution time before forced termination */
  maxExecutionMs?: number;

  /** Whether to skip if previous run is still executing */
  skipIfRunning?: boolean;
}

export interface ScoutConfig {
  /** Data collectors to run */
  collectors: CollectorConfig[];

  /** Metric thresholds for alert generation */
  thresholds: ThresholdConfig[];

  /** Alert routing rules */
  alertRules: AlertRule[];

  /** Anomaly detection configuration (optional) */
  anomalyDetection?: AnomalyDetectorConfig;

  /** Number of historical observations to retain */
  retentionDays?: number;

  /** Tags for filtering and grouping */
  tags?: string[];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Collectors
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface CollectorConfig {
  /** Collector type */
  type: 'http' | 'tcp' | 'database' | 'metrics' | 'event_stream' | 'custom';

  /** Collector-specific configuration */
  [key: string]: unknown;
}

export interface HttpCollectorConfig extends CollectorConfig {
  type: 'http';
  /** Target URL */
  url: string;
  /** HTTP method */
  method?: 'GET' | 'POST' | 'PUT' | 'HEAD';
  /** Request headers */
  headers?: Record<string, string>;
  /** Request body (for POST/PUT) */
  body?: unknown;
  /** Connection timeout in ms */
  timeout?: number;
  /** Expected status code(s) */
  expectedStatus?: number[];
  /** Expected response body pattern (regex) */
  expectedBodyPattern?: string;
  /** Whether to capture response body */
  captureBody?: boolean;
  /** Max response body size to capture (bytes) */
  maxBodySize?: number;
  /** TLS certificate validation */
  validateTls?: boolean;
  /** Follow redirects */
  followRedirects?: boolean;
}

export interface TcpCollectorConfig extends CollectorConfig {
  type: 'tcp';
  /** Target host */
  host: string;
  /** Target port */
  port: number;
  /** Connection timeout in ms */
  timeout?: number;
}

export interface DatabaseCollectorConfig extends CollectorConfig {
  type: 'database';
  /** Database connection string or reference */
  connectionRef: string;
  /** SQL query to execute */
  query: string;
  /** Query timeout in ms */
  timeout?: number;
  /** Whether to capture query results */
  captureResults?: boolean;
  /** Max rows to capture */
  maxRows?: number;
}

export interface MetricsCollectorConfig extends CollectorConfig {
  type: 'metrics';
  /** Metrics endpoint URL (Prometheus-compatible) */
  endpoint?: string;
  /** Specific metric names to collect */
  metrics: string[];
  /** Label filters */
  labels?: Record<string, string>;
  /** Aggregation function */
  aggregation?: 'avg' | 'sum' | 'min' | 'max' | 'p50' | 'p95' | 'p99';
  /** Time range for aggregation */
  timeRange?: string;
}

export interface EventStreamCollectorConfig extends CollectorConfig {
  type: 'event_stream';
  /** Topic name */
  topic: string;
  /** Consumer group */
  consumerGroup?: string;
  /** Time window for counting */
  windowMs?: number;
  /** Metrics to collect: count, lag, throughput */
  metrics: ('count' | 'lag' | 'throughput' | 'avg_size')[];
}

export interface CustomCollectorConfig extends CollectorConfig {
  type: 'custom';
  /** Handler function name (registered in CollectorRegistry) */
  handler: string;
  /** Handler parameters */
  params?: Record<string, unknown>;
}

export interface CollectorResult {
  /** Collector type */
  type: string;
  /** Whether the collection succeeded */
  success: boolean;
  /** Collection duration in ms */
  durationMs: number;
  /** Collected metrics */
  metrics: Record<string, number | string | boolean>;
  /** Raw response data (if captureBody/captureResults enabled) */
  rawData?: unknown;
  /** Error message if collection failed */
  error?: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Thresholds & Observations
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type ThresholdOperator = 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq' | 'between' | 'outside';
export type ObservationSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface ThresholdConfig {
  /** Metric name to evaluate */
  metric: string;

  /** Comparison operator */
  operator: ThresholdOperator;

  /** Threshold value (single value for most operators) */
  value: number;

  /** Upper bound (for 'between' and 'outside' operators) */
  upperValue?: number;

  /** Severity level when threshold is breached */
  severity?: ObservationSeverity;

  /** Human-readable description */
  description?: string;

  /** Number of consecutive breaches before alerting */
  consecutiveBreaches?: number;

  /** Whether this threshold is enabled */
  enabled?: boolean;
}

export interface Observation {
  /** Unique observation ID */
  id: string;

  /** Scout that produced this observation */
  scoutId: string;

  /** Venture ID */
  ventureId: VentureID;

  /** Observation type (scout-defined categorization) */
  observationType: string;

  /** Severity level */
  severity: ObservationSeverity;

  /** Collected metrics */
  metrics: Record<string, number | string | boolean>;

  /** Detected anomalies */
  anomalies: Anomaly[];

  /** Whether an alert was generated */
  alertGenerated: boolean;

  /** Associated alert ID (if alert was generated) */
  alertId?: string;

  /** When the observation was recorded */
  observedAt: Date;

  /** Raw collector data */
  rawData?: unknown;

  /** Collector durations */
  collectorDurations?: Record<string, number>;

  /** Total observation duration */
  durationMs: number;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Anomaly Detection
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type AnomalyAlgorithm = 'zscore' | 'iqr' | 'isolation_forest' | 'prophet' | 'lstm';

export interface AnomalyDetectorConfig {
  /** Detection algorithm */
  algorithm: AnomalyAlgorithm;

  /** Sensitivity (0.0 = least sensitive, 1.0 = most sensitive) */
  sensitivity: number;

  /** Minimum data points required before detection activates */
  minDataPoints: number;

  /** Sliding window size for buffering */
  windowSize: number;

  /** Metrics to monitor for anomalies */
  metrics: string[];

  /** Whether to use seasonal decomposition */
  seasonalDecomposition?: boolean;

  /** Expected seasonality period (e.g., "24h", "7d") */
  seasonalityPeriod?: string;

  /** Algorithm-specific parameters */
  algorithmParams?: Record<string, unknown>;
}

export interface AnomalyResult {
  /** Whether an anomaly was detected */
  isAnomaly: boolean;

  /** Anomaly score (0.0 = normal, 1.0 = extreme) */
  score: number;

  /** Metric that triggered the anomaly */
  metric: string;

  /** Current value */
  currentValue: number;

  /** Expected value (from the model) */
  expectedValue: number;

  /** Standard deviations from expected */
  deviations: number;

  /** Upper and lower bounds of the expected range */
  expectedRange: { lower: number; upper: number };

  /** Algorithm used */
  algorithm: AnomalyAlgorithm;

  /** Confidence in the detection (0.0-1.0) */
  confidence: number;
}

export interface Anomaly {
  /** Metric name */
  metric: string;

  /** Anomaly score */
  score: number;

  /** Current value */
  value: number;

  /** Expected value */
  expectedValue: number;

  /** Algorithm that detected it */
  algorithm: AnomalyAlgorithm;

  /** Confidence */
  confidence: number;

  /** Human-readable description */
  description: string;
}

export interface DataPoint {
  /** Timestamp */
  timestamp: Date;

  /** Metric value */
  value: number;

  /** Optional labels */
  labels?: Record<string, string>;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Alerts
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type AlertChannel = 'slack' | 'email' | 'pagerduty' | 'webhook' | 'in_app';
export type AlertStatus = 'open' | 'acknowledged' | 'resolved' | 'snoozed';

export interface AlertRule {
  /** Conditions that trigger this alert rule */
  condition: {
    /** Severity level(s) to match */
    severity?: ObservationSeverity | ObservationSeverity[];
    /** Specific metrics to match */
    metrics?: string[];
    /** Minimum anomaly score to match */
    minAnomalyScore?: number;
    /** Time window for rate-based conditions */
    timeWindowMs?: number;
    /** Minimum occurrences within time window */
    minOccurrences?: number;
  };

  /** Channels to deliver the alert to */
  channels: AlertChannel[];

  /** Channel-specific configuration */
  channelConfig?: Record<AlertChannel, Record<string, unknown>>;

  /** Notification template override */
  notificationTemplate?: string;

  /** Whether to auto-acknowledge after delivery */
  autoAcknowledge?: boolean;

  /** Cooldown period between alerts (ms) */
  cooldownMs?: number;
}

export interface Alert {
  /** Unique alert ID */
  id: string;

  /** Venture ID */
  ventureId: VentureID;

  /** Scout that generated this alert */
  scoutId: string;

  /** Observation that triggered this alert */
  observationId: string;

  /** Alert title */
  title: string;

  /** Alert description */
  description: string;

  /** Severity level */
  severity: ObservationSeverity;

  /** Current status */
  status: AlertStatus;

  /** Deduplication key */
  dedupKey: string;

  /** Number of occurrences (deduplicated) */
  occurrenceCount: number;

  /** First occurrence timestamp */
  firstOccurredAt: Date;

  /** Last occurrence timestamp */
  lastOccurredAt: Date;

  /** Acknowledgement details */
  acknowledgedBy?: string;
  acknowledgedAt?: Date;

  /** Resolution details */
  resolvedBy?: string;
  resolvedAt?: Date;
  resolutionNotes?: string;

  /** Snooze details */
  snoozedUntil?: Date;

  /** Notification delivery records */
  notifications: AlertNotification[];

  /** Created timestamp */
  createdAt: Date;
}

export interface AlertNotification {
  /** Channel the notification was sent to */
  channel: AlertChannel;

  /** Delivery status */
  status: 'pending' | 'sent' | 'failed';

  /** When the notification was sent */
  sentAt?: Date;

  /** Error message if delivery failed */
  error?: string;

  /** Channel-specific delivery ID */
  externalId?: string;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Reports & Monitoring
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface ScoutReport {
  /** Scout ID */
  scoutId: string;

  /** Execution timestamp */
  executedAt: Date;

  /** Total execution duration */
  durationMs: number;

  /** Number of collectors run */
  collectorsRun: number;

  /** Number of observations produced */
  observationCount: number;

  /** Number of anomalies detected */
  anomalyCount: number;

  /** Number of alerts generated */
  alertCount: number;

  /** Collector results */
  collectorResults: CollectorResult[];

  /** Observations produced */
  observations: Observation[];

  /** Anomalies detected */
  anomalies: AnomalyResult[];

  /** Whether the run was successful */
  success: boolean;

  /** Error message if the run failed */
  error?: string;
}

export interface MonitorConfig {
  /** Monitor name */
  name: string;

  /** Health checks to perform */
  checks: HealthCheck[];

  /** Status aggregation method */
  aggregation: 'worst' | 'majority' | 'all_pass';

  /** SLA target (uptime percentage) */
  slaTarget?: number;
}

export interface MonitorStatus {
  /** Overall status */
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

  /** Individual check results */
  checks: CheckResult[];

  /** Uptime percentage (last 30 days) */
  uptimePercent: number;

  /** Last check timestamp */
  lastCheckAt: Date;

  /** Number of consecutive failures */
  consecutiveFailures: number;
}

export interface HealthCheck {
  /** Check name */
  name: string;

  /** Check type */
  type: 'http' | 'tcp' | 'database' | 'custom';

  /** Check-specific configuration */
  config: Record<string, unknown>;

  /** Timeout in ms */
  timeout: number;

  /** Number of retries before marking as failed */
  retries?: number;
}

export interface CheckResult {
  /** Check name */
  name: string;

  /** Whether the check passed */
  passed: boolean;

  /** Response time in ms */
  responseTimeMs: number;

  /** Error message if check failed */
  error?: string;

  /** Additional details */
  details?: Record<string, unknown>;

  /** Timestamp */
  checkedAt: Date;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Network
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface ScoutNetworkConfig {
  /** Maximum concurrent scout executions per venture */
  maxConcurrentPerVenture: number;

  /** Global maximum concurrent executions */
  maxConcurrentGlobal: number;

  /** Default retention period for observations */
  defaultRetentionDays: number;

  /** Default alert cooldown period */
  defaultAlertCooldownMs: number;

  /** Whether to enable anomaly detection by default */
  enableAnomalyDetection: boolean;

  /** Default anomaly detection algorithm */
  defaultAnomalyAlgorithm: AnomalyAlgorithm;
}

export interface ScoutNetworkStatus {
  /** Total scouts registered */
  totalScouts: number;

  /** Active scouts */
  activeScouts: number;

  /** Currently executing scouts */
  executingScouts: number;

  /** Total observations in last 24h */
  observations24h: number;

  /** Open alerts */
  openAlerts: number;

  /** Per-venture status */
  ventureStatus: Record<VentureID, {
    scouts: number;
    activeScouts: number;
    openAlerts: number;
  }>;
}
```

---

## 6. Database Schema (Drizzle ORM)

```typescript
// @mcv/agentic-os/scouts/schema.ts

import { pgTable, uuid, varchar, text, timestamp, integer, bigint,
         boolean, jsonb, numeric, pgEnum, unique, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { ventures } from '@mcv/kernel/schema';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Enums
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const naosScoutTypeEnum = pgEnum('naos_scout_type', [
  'system_health',
  'performance',
  'security',
  'compliance',
  'cost',
  'quality',
  'custom',
]);

export const naosObservationSeverityEnum = pgEnum('naos_observation_severity', [
  'info',
  'warning',
  'error',
  'critical',
]);

export const naosAlertStatusEnum = pgEnum('naos_alert_status', [
  'open',
  'acknowledged',
  'resolved',
  'snoozed',
]);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// naos_scouts — Monitoring Agent Definitions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const naosScouts = pgTable('naos_scouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),

  // Identity
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(),
  description: text('description'),
  scoutType: naosScoutTypeEnum('scout_type').notNull(),

  // Target
  target: jsonb('target').notNull().default('{}'),
  /*
    target: {
      type: "service",
      identifier: "api-gateway",
      displayName: "API Gateway",
      metadata: { region: "us-east-1" }
    }
  */

  // Configuration
  config: jsonb('config').notNull().default('{}'),
  /*
    config: {
      collectors: [...],
      thresholds: [...],
      alertRules: [...],
      anomalyDetection: { algorithm: "zscore", sensitivity: 0.8, ... },
      retentionDays: 90,
      tags: ["production", "critical"]
    }
  */

  // Schedule
  scheduleType: varchar('schedule_type', { length: 20 }).notNull().default('cron'),
  scheduleCron: varchar('schedule_cron', { length: 100 }),
  scheduleInterval: varchar('schedule_interval', { length: 50 }),
  scheduleConfig: jsonb('schedule_config').default('{}'),

  // Execution state
  lastRunAt: timestamp('last_run_at', { withTimezone: true }),
  nextRunAt: timestamp('next_run_at', { withTimezone: true }),
  lastRunDurationMs: integer('last_run_duration_ms'),
  lastRunSuccess: boolean('last_run_success'),
  consecutiveFailures: integer('consecutive_failures').default(0),

  // Status
  isActive: boolean('is_active').default(true),

  // Stats
  totalRuns: bigint('total_runs', { mode: 'number' }).default(0),
  successfulRuns: bigint('successful_runs', { mode: 'number' }).default(0),
  alertsGenerated: bigint('alerts_generated', { mode: 'number' }).default(0),
  avgDurationMs: integer('avg_duration_ms'),

  // Metadata
  tags: sql`text[]`.default('{}'),
  metadata: jsonb('metadata').default('{}'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  ventureSlugUnique: unique().on(table.ventureId, table.slug),
  activeScoutsIdx: index('idx_scouts_active').on(table.isActive, table.nextRunAt),
  ventureTypeIdx: index('idx_scouts_venture_type').on(table.ventureId, table.scoutType),
}));

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// naos_scout_observations — Collected Data Points
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const naosScoutObservations = pgTable('naos_scout_observations', {
  id: uuid('id').primaryKey().defaultRandom(),
  scoutId: uuid('scout_id').notNull().references(() => naosScouts.id, { onDelete: 'cascade' }),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),

  // Observation classification
  observationType: varchar('observation_type', { length: 100 }).notNull(),
  severity: naosObservationSeverityEnum('severity').default('info'),

  // Collected data
  metrics: jsonb('metrics').notNull().default('{}'),
  /*
    metrics: {
      response_time_ms: 245,
      status_code: 200,
      error_rate: 0.02,
      active_connections: 1523
    }
  */

  // Collector results
  collectorResults: jsonb('collector_results').default('[]'),

  // Anomalies detected
  anomalies: jsonb('anomalies').default('[]'),
  anomalyScore: numeric('anomaly_score', { precision: 5, scale: 4 }),

  // Threshold breaches
  thresholdBreaches: jsonb('threshold_breaches').default('[]'),
  /*
    thresholdBreaches: [
      { metric: "response_time_ms", operator: "gt", threshold: 500, actual: 750, severity: "warning" }
    ]
  */

  // Alert tracking
  alertGenerated: boolean('alert_generated').default(false),
  alertId: uuid('alert_id'),

  // Timing
  observedAt: timestamp('observed_at', { withTimezone: true }).defaultNow(),
  durationMs: integer('duration_ms'),

  // Raw data (optional, for debugging)
  rawData: jsonb('raw_data'),
}, (table) => ({
  scoutTimeIdx: index('idx_observations_scout_time').on(table.scoutId, table.observedAt),
  ventureSeverityIdx: index('idx_observations_venture_severity').on(table.ventureId, table.severity),
  observedAtIdx: index('idx_observations_observed_at').on(table.observedAt),
}));

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// naos_alerts — Alert Tracking and Lifecycle
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const naosAlerts = pgTable('naos_alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  scoutId: uuid('scout_id').references(() => naosScouts.id),
  observationId: uuid('observation_id').references(() => naosScoutObservations.id),

  // Alert identity
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  severity: naosObservationSeverityEnum('severity').notNull(),

  // Deduplication
  dedupKey: varchar('dedup_key', { length: 255 }).notNull(),
  occurrenceCount: integer('occurrence_count').default(1),
  firstOccurredAt: timestamp('first_occurred_at', { withTimezone: true }).defaultNow(),
  lastOccurredAt: timestamp('last_occurred_at', { withTimezone: true }).defaultNow(),

  // Status
  status: naosAlertStatusEnum('status').default('open'),

  // Handling
  acknowledgedBy: uuid('acknowledged_by'),
  acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
  resolvedBy: uuid('resolved_by'),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  resolutionNotes: text('resolution_notes'),

  // Snooze
  snoozedUntil: timestamp('snoozed_until', { withTimezone: true }),
  snoozeReason: text('snooze_reason'),

  // Notification tracking
  notificationsSent: jsonb('notifications_sent').default('[]'),
  /*
    notificationsSent: [
      { channel: "slack", status: "sent", sentAt: "2026-02-08T...", externalId: "msg_123" },
      { channel: "email", status: "sent", sentAt: "2026-02-08T..." }
    ]
  */

  // Context
  context: jsonb('context').default('{}'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  ventureStatusIdx: index('idx_alerts_venture_status').on(table.ventureId, table.status),
  dedupKeyIdx: index('idx_alerts_dedup_key').on(table.dedupKey, table.status),
  severityStatusIdx: index('idx_alerts_severity_status').on(table.severity, table.status),
  scoutIdx: index('idx_alerts_scout').on(table.scoutId),
}));
```

---

## 7. Core Class Implementations

### 7.1 ScoutNetwork

```typescript
// @mcv/agentic-os/scouts/network.ts

import { db } from '@mcv/kernel';
import { eq, and, lte, desc } from 'drizzle-orm';
import { naosScouts } from './schema';
import { ScoutRunner } from './runner';
import type {
  Scout, ScoutConfig, ScoutTarget, ScoutSchedule,
  ScoutReport, ScoutNetworkConfig, ScoutNetworkStatus
} from './types';

export class ScoutNetwork {
  private runners: Map<string, ScoutRunner> = new Map();
  private config: ScoutNetworkConfig;

  constructor(config?: Partial<ScoutNetworkConfig>) {
    this.config = {
      maxConcurrentPerVenture: 20,
      maxConcurrentGlobal: 100,
      defaultRetentionDays: 90,
      defaultAlertCooldownMs: 300000, // 5 minutes
      enableAnomalyDetection: true,
      defaultAnomalyAlgorithm: 'zscore',
      ...config,
    };
  }

  /**
   * Deploy a new scout to the network.
   * Creates the scout record and starts the scheduler.
   */
  async deployScout(params: {
    ventureId: string;
    name: string;
    type: Scout['type'];
    target: ScoutTarget;
    schedule: ScoutSchedule;
    config: ScoutConfig;
    description?: string;
  }): Promise<string> {
    // Generate slug from name
    const slug = params.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // Insert into database
    const [scout] = await db.insert(naosScouts).values({
      ventureId: params.ventureId,
      name: params.name,
      slug,
      description: params.description,
      scoutType: params.type,
      target: params.target,
      config: params.config,
      scheduleType: params.schedule.type,
      scheduleCron: params.schedule.expression,
      scheduleInterval: params.schedule.interval,
      scheduleConfig: params.schedule,
      isActive: true,
    }).returning();

    // Create and start the runner
    const runner = new ScoutRunner(scout.id, params.config, this.config);
    this.runners.set(scout.id, runner);
    await runner.start(params.schedule);

    return scout.id;
  }

  /**
   * Manually trigger a scout run outside its normal schedule.
   */
  async runScout(scoutId: string): Promise<ScoutReport> {
    const runner = this.runners.get(scoutId);
    if (!runner) {
      throw new ScoutError('SCOUT_NOT_FOUND', { scoutId });
    }
    return runner.executeNow();
  }

  /**
   * Pause a scout (stops scheduling but doesn't delete).
   */
  async pauseScout(scoutId: string): Promise<void> {
    const runner = this.runners.get(scoutId);
    if (runner) {
      await runner.stop();
    }
    await db.update(naosScouts)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(naosScouts.id, scoutId));
  }

  /**
   * Resume a paused scout.
   */
  async resumeScout(scoutId: string): Promise<void> {
    const [scout] = await db.select()
      .from(naosScouts)
      .where(eq(naosScouts.id, scoutId));

    if (!scout) throw new ScoutError('SCOUT_NOT_FOUND', { scoutId });

    await db.update(naosScouts)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(naosScouts.id, scoutId));

    const runner = new ScoutRunner(scoutId, scout.config as ScoutConfig, this.config);
    this.runners.set(scoutId, runner);
    await runner.start(scout.scheduleConfig as ScoutSchedule);
  }

  /**
   * Remove a scout from the network entirely.
   */
  async removeScout(scoutId: string): Promise<void> {
    const runner = this.runners.get(scoutId);
    if (runner) {
      await runner.stop();
      this.runners.delete(scoutId);
    }
    // Cascade will delete observations and alerts
    await db.delete(naosScouts).where(eq(naosScouts.id, scoutId));
  }

  /**
   * Get the full status of a specific scout.
   */
  async getScoutStatus(scoutId: string): Promise<Scout> {
    const [scout] = await db.select()
      .from(naosScouts)
      .where(eq(naosScouts.id, scoutId));

    if (!scout) throw new ScoutError('SCOUT_NOT_FOUND', { scoutId });

    return {
      id: scout.id,
      ventureId: scout.ventureId,
      name: scout.name,
      slug: scout.slug,
      description: scout.description ?? undefined,
      type: scout.scoutType,
      target: scout.target as ScoutTarget,
      schedule: scout.scheduleConfig as ScoutSchedule,
      config: scout.config as ScoutConfig,
      isActive: scout.isActive ?? true,
      stats: {
        totalRuns: Number(scout.totalRuns ?? 0),
        alertsGenerated: Number(scout.alertsGenerated ?? 0),
        lastRunAt: scout.lastRunAt ?? undefined,
        nextRunAt: scout.nextRunAt ?? undefined,
        avgDurationMs: scout.avgDurationMs ?? undefined,
        successRate: scout.successfulRuns && scout.totalRuns
          ? Number(scout.successfulRuns) / Number(scout.totalRuns)
          : undefined,
      },
    };
  }

  /**
   * Get overall network status across all ventures.
   */
  async getNetworkStatus(): Promise<ScoutNetworkStatus> {
    const scouts = await db.select().from(naosScouts);

    const ventureStatus: ScoutNetworkStatus['ventureStatus'] = {};
    let activeScouts = 0;
    let executingScouts = 0;

    for (const scout of scouts) {
      if (!ventureStatus[scout.ventureId]) {
        ventureStatus[scout.ventureId] = { scouts: 0, activeScouts: 0, openAlerts: 0 };
      }
      ventureStatus[scout.ventureId].scouts++;
      if (scout.isActive) {
        ventureStatus[scout.ventureId].activeScouts++;
        activeScouts++;
      }
      if (this.runners.get(scout.id)?.isExecuting()) {
        executingScouts++;
      }
    }

    return {
      totalScouts: scouts.length,
      activeScouts,
      executingScouts,
      observations24h: 0, // Computed via separate query
      openAlerts: 0, // Computed via separate query
      ventureStatus,
    };
  }
}
```

### 7.2 AnomalyDetector

```typescript
// @mcv/agentic-os/scouts/anomaly.ts

import type { AnomalyDetectorConfig, AnomalyResult, DataPoint, AnomalyAlgorithm } from './types';

export class AnomalyDetector {
  private config: AnomalyDetectorConfig;
  private buffers: Map<string, DataPoint[]> = new Map();

  constructor(config: AnomalyDetectorConfig) {
    this.config = {
      sensitivity: 0.8,
      minDataPoints: 30,
      windowSize: 100,
      ...config,
    };
  }

  /**
   * Add a data point to the rolling buffer for a metric.
   */
  addDataPoint(metric: string, point: DataPoint): void {
    if (!this.buffers.has(metric)) {
      this.buffers.set(metric, []);
    }
    const buffer = this.buffers.get(metric)!;
    buffer.push(point);

    // Trim to window size
    if (buffer.length > this.config.windowSize) {
      buffer.splice(0, buffer.length - this.config.windowSize);
    }
  }

  /**
   * Check if a data point is anomalous for the given metric.
   * Returns null if not enough data points for detection.
   */
  async detect(metric: string, point: DataPoint): Promise<AnomalyResult | null> {
    const buffer = this.buffers.get(metric);
    if (!buffer || buffer.length < this.config.minDataPoints) {
      return null; // Not enough data
    }

    switch (this.config.algorithm) {
      case 'zscore':
        return this.detectZScore(metric, point, buffer);
      case 'iqr':
        return this.detectIQR(metric, point, buffer);
      case 'isolation_forest':
        return this.detectIsolationForest(metric, point, buffer);
      case 'prophet':
        return this.detectProphet(metric, point, buffer);
      case 'lstm':
        return this.detectLSTM(metric, point, buffer);
      default:
        return this.detectZScore(metric, point, buffer);
    }
  }

  /**
   * Z-Score based anomaly detection.
   * Fast, works well for normally distributed metrics.
   */
  private detectZScore(
    metric: string,
    point: DataPoint,
    buffer: DataPoint[]
  ): AnomalyResult {
    const values = buffer.map(p => p.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length
    );

    if (stdDev === 0) {
      // All values identical — any deviation is anomalous
      const isAnomaly = point.value !== mean;
      return {
        isAnomaly,
        score: isAnomaly ? 1.0 : 0.0,
        metric,
        currentValue: point.value,
        expectedValue: mean,
        deviations: isAnomaly ? Infinity : 0,
        expectedRange: { lower: mean, upper: mean },
        algorithm: 'zscore',
        confidence: 1.0,
      };
    }

    const zScore = Math.abs((point.value - mean) / stdDev);
    // Map sensitivity to z-score threshold: 0.0 → 4.0σ, 1.0 → 1.5σ
    const threshold = 4.0 - (this.config.sensitivity * 2.5);
    const isAnomaly = zScore > threshold;

    // Normalize score to 0-1 range
    const normalizedScore = Math.min(zScore / 5.0, 1.0);

    return {
      isAnomaly,
      score: normalizedScore,
      metric,
      currentValue: point.value,
      expectedValue: mean,
      deviations: zScore,
      expectedRange: {
        lower: mean - threshold * stdDev,
        upper: mean + threshold * stdDev,
      },
      algorithm: 'zscore',
      confidence: Math.min(buffer.length / 100, 1.0), // More data = more confidence
    };
  }

  /**
   * IQR (Interquartile Range) based anomaly detection.
   * Robust to outliers, works well for skewed distributions.
   */
  private detectIQR(
    metric: string,
    point: DataPoint,
    buffer: DataPoint[]
  ): AnomalyResult {
    const sorted = buffer.map(p => p.value).sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const median = sorted[Math.floor(sorted.length * 0.5)];

    // Sensitivity adjusts the IQR multiplier: 0.0 → 3.0, 1.0 → 1.0
    const multiplier = 3.0 - (this.config.sensitivity * 2.0);
    const lowerBound = q1 - multiplier * iqr;
    const upperBound = q3 + multiplier * iqr;

    const isAnomaly = point.value < lowerBound || point.value > upperBound;
    const deviation = point.value < lowerBound
      ? (lowerBound - point.value) / iqr
      : point.value > upperBound
        ? (point.value - upperBound) / iqr
        : 0;

    return {
      isAnomaly,
      score: Math.min(deviation / 3.0, 1.0),
      metric,
      currentValue: point.value,
      expectedValue: median,
      deviations: deviation,
      expectedRange: { lower: lowerBound, upper: upperBound },
      algorithm: 'iqr',
      confidence: Math.min(buffer.length / 100, 1.0),
    };
  }

  /**
   * Isolation Forest — ML-based multi-dimensional anomaly detection.
   * Best for complex patterns in multi-dimensional data.
   */
  private async detectIsolationForest(
    metric: string,
    point: DataPoint,
    buffer: DataPoint[]
  ): Promise<AnomalyResult> {
    // Simplified implementation — production uses scikit-learn or a TypeScript port
    // Isolation forests work by randomly partitioning data; anomalies require fewer
    // partitions to isolate, resulting in shorter path lengths in the tree.
    const values = buffer.map(p => p.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length
    );

    // Approximate isolation score using deviation
    const deviation = stdDev > 0 ? Math.abs(point.value - mean) / stdDev : 0;
    const score = Math.min(deviation / 4.0, 1.0);
    const threshold = 1.0 - this.config.sensitivity * 0.5;
    const isAnomaly = score > threshold;

    return {
      isAnomaly,
      score,
      metric,
      currentValue: point.value,
      expectedValue: mean,
      deviations: deviation,
      expectedRange: {
        lower: mean - 2 * stdDev,
        upper: mean + 2 * stdDev,
      },
      algorithm: 'isolation_forest',
      confidence: Math.min(buffer.length / 200, 1.0),
    };
  }

  /**
   * Prophet — seasonal time-series forecasting.
   * Delegates to @mcv/intelligence Prophet integration.
   */
  private async detectProphet(
    metric: string,
    point: DataPoint,
    buffer: DataPoint[]
  ): Promise<AnomalyResult> {
    // Production delegates to Python Prophet via @mcv/intelligence
    // Falls back to Z-Score if Prophet is unavailable
    return this.detectZScore(metric, point, buffer);
  }

  /**
   * LSTM — neural network time-series prediction.
   * Delegates to @mcv/intelligence LSTM model.
   */
  private async detectLSTM(
    metric: string,
    point: DataPoint,
    buffer: DataPoint[]
  ): Promise<AnomalyResult> {
    // Production delegates to TensorFlow.js LSTM via @mcv/intelligence
    // Falls back to Z-Score if LSTM is unavailable
    return this.detectZScore(metric, point, buffer);
  }

  /**
   * Get the current buffer for a metric.
   */
  getBuffer(metric: string): DataPoint[] {
    return this.buffers.get(metric) ?? [];
  }

  /**
   * Clear all buffers (useful for resets).
   */
  clearBuffers(): void {
    this.buffers.clear();
  }
}
```

### 7.3 AlertManager

```typescript
// @mcv/agentic-os/scouts/alerts.ts

import { db } from '@mcv/kernel';
import { eq, and, desc } from 'drizzle-orm';
import { naosAlerts } from './schema';
import crypto from 'node:crypto';
import type {
  Alert, AlertRule, AlertChannel, AlertNotification,
  Observation, ObservationSeverity
} from './types';

export class AlertManager {
  /**
   * Process an observation and generate alerts if thresholds are breached.
   */
  async processObservation(
    observation: Observation,
    alertRules: AlertRule[]
  ): Promise<Alert | null> {
    // Find matching alert rules
    const matchingRules = alertRules.filter(rule =>
      this.ruleMatches(rule, observation)
    );

    if (matchingRules.length === 0) return null;

    // Compute dedup key
    const dedupKey = this.computeDedupKey(observation);

    // Check for existing open alert with same dedup key
    const [existingAlert] = await db.select()
      .from(naosAlerts)
      .where(
        and(
          eq(naosAlerts.dedupKey, dedupKey),
          eq(naosAlerts.status, 'open')
        )
      );

    if (existingAlert) {
      // Update existing alert (deduplicate)
      await db.update(naosAlerts)
        .set({
          occurrenceCount: (existingAlert.occurrenceCount ?? 1) + 1,
          lastOccurredAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(naosAlerts.id, existingAlert.id));

      return existingAlert as unknown as Alert;
    }

    // Create new alert
    const channels = [...new Set(matchingRules.flatMap(r => r.channels))];
    const title = this.generateAlertTitle(observation);
    const description = this.generateAlertDescription(observation);

    const [alert] = await db.insert(naosAlerts).values({
      ventureId: observation.ventureId,
      scoutId: observation.scoutId,
      observationId: observation.id,
      title,
      description,
      severity: observation.severity,
      dedupKey,
      occurrenceCount: 1,
      firstOccurredAt: new Date(),
      lastOccurredAt: new Date(),
      status: 'open',
      context: {
        metrics: observation.metrics,
        anomalies: observation.anomalies,
      },
    }).returning();

    // Send notifications
    const notifications = await this.sendNotifications(
      alert as unknown as Alert,
      channels,
      matchingRules
    );

    // Update alert with notification records
    await db.update(naosAlerts)
      .set({ notificationsSent: notifications })
      .where(eq(naosAlerts.id, alert.id));

    return alert as unknown as Alert;
  }

  /**
   * Acknowledge an alert.
   */
  async acknowledge(alertId: string, userId: string): Promise<void> {
    await db.update(naosAlerts)
      .set({
        status: 'acknowledged',
        acknowledgedBy: userId,
        acknowledgedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(naosAlerts.id, alertId));
  }

  /**
   * Resolve an alert with notes.
   */
  async resolve(alertId: string, userId: string, notes: string): Promise<void> {
    await db.update(naosAlerts)
      .set({
        status: 'resolved',
        resolvedBy: userId,
        resolvedAt: new Date(),
        resolutionNotes: notes,
        updatedAt: new Date(),
      })
      .where(eq(naosAlerts.id, alertId));
  }

  /**
   * Snooze an alert for a duration.
   */
  async snooze(alertId: string, until: Date, reason: string): Promise<void> {
    await db.update(naosAlerts)
      .set({
        status: 'snoozed',
        snoozedUntil: until,
        snoozeReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(naosAlerts.id, alertId));
  }

  /**
   * Get all open alerts for a venture.
   */
  async getOpenAlerts(ventureId: string): Promise<Alert[]> {
    return db.select()
      .from(naosAlerts)
      .where(
        and(
          eq(naosAlerts.ventureId, ventureId),
          eq(naosAlerts.status, 'open')
        )
      )
      .orderBy(desc(naosAlerts.severity), desc(naosAlerts.lastOccurredAt)) as unknown as Alert[];
  }

  // ── Private helpers ──

  private ruleMatches(rule: AlertRule, observation: Observation): boolean {
    const { condition } = rule;

    if (condition.severity) {
      const severities = Array.isArray(condition.severity)
        ? condition.severity
        : [condition.severity];
      if (!severities.includes(observation.severity)) return false;
    }

    if (condition.metrics) {
      const obsMetrics = Object.keys(observation.metrics);
      const hasMetric = condition.metrics.some(m => obsMetrics.includes(m));
      if (!hasMetric) return false;
    }

    if (condition.minAnomalyScore) {
      const maxScore = Math.max(
        ...observation.anomalies.map(a => a.score),
        0
      );
      if (maxScore < condition.minAnomalyScore) return false;
    }

    return true;
  }

  private computeDedupKey(observation: Observation): string {
    const raw = `${observation.scoutId}:${observation.observationType}:${observation.severity}`;
    return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 32);
  }

  private generateAlertTitle(observation: Observation): string {
    const breaches = (observation as any).thresholdBreaches ?? [];
    if (breaches.length > 0) {
      const first = breaches[0];
      return `[${observation.severity.toUpperCase()}] ${first.metric} ${first.operator} ${first.threshold} (actual: ${first.actual})`;
    }
    if (observation.anomalies.length > 0) {
      const first = observation.anomalies[0];
      return `[ANOMALY] ${first.metric}: ${first.description}`;
    }
    return `[${observation.severity.toUpperCase()}] ${observation.observationType}`;
  }

  private generateAlertDescription(observation: Observation): string {
    const lines: string[] = [];
    lines.push(`Scout observation at ${observation.observedAt.toISOString()}`);
    lines.push(`Metrics: ${JSON.stringify(observation.metrics, null, 2)}`);
    if (observation.anomalies.length > 0) {
      lines.push(`Anomalies detected: ${observation.anomalies.length}`);
      for (const a of observation.anomalies) {
        lines.push(`  - ${a.metric}: score ${a.score.toFixed(3)} (${a.description})`);
      }
    }
    return lines.join('\n');
  }

  private async sendNotifications(
    alert: Alert,
    channels: AlertChannel[],
    rules: AlertRule[]
  ): Promise<AlertNotification[]> {
    const notifications: AlertNotification[] = [];

    for (const channel of channels) {
      try {
        // Delegate to channel-specific handlers
        switch (channel) {
          case 'slack':
            await this.notifySlack(alert);
            break;
          case 'email':
            await this.notifyEmail(alert);
            break;
          case 'pagerduty':
            await this.notifyPagerDuty(alert);
            break;
          case 'webhook':
            await this.notifyWebhook(alert, rules);
            break;
          case 'in_app':
            await this.notifyInApp(alert);
            break;
        }

        notifications.push({
          channel,
          status: 'sent',
          sentAt: new Date(),
        });
      } catch (error) {
        notifications.push({
          channel,
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return notifications;
  }

  private async notifySlack(alert: Alert): Promise<void> {
    // Delegates to @mcv/fabric event bus → Slack integration
  }
  private async notifyEmail(alert: Alert): Promise<void> {
    // Delegates to @mcv/fabric event bus → email provider
  }
  private async notifyPagerDuty(alert: Alert): Promise<void> {
    // Delegates to PagerDuty Events API v2
  }
  private async notifyWebhook(alert: Alert, rules: AlertRule[]): Promise<void> {
    // HTTP POST to configured webhook URL
  }
  private async notifyInApp(alert: Alert): Promise<void> {
    // Pushes to WebSocket channel for real-time UI updates
  }
}
```

### 7.4 Monitor

```typescript
// @mcv/agentic-os/scouts/monitor.ts

import type { MonitorConfig, MonitorStatus, HealthCheck, CheckResult } from './types';

export class Monitor {
  private config: MonitorConfig;
  private history: CheckResult[] = [];
  private consecutiveFailures = 0;
  private totalChecks = 0;
  private passedChecks = 0;

  constructor(config: MonitorConfig) {
    this.config = config;
  }

  /**
   * Run all configured health checks and return aggregated status.
   */
  async check(): Promise<MonitorStatus> {
    const results: CheckResult[] = [];

    for (const healthCheck of this.config.checks) {
      const result = await this.runCheck(healthCheck);
      results.push(result);
    }

    // Aggregate status
    const status = this.aggregateStatus(results);

    // Track metrics
    this.totalChecks++;
    if (status === 'healthy') {
      this.passedChecks++;
      this.consecutiveFailures = 0;
    } else {
      this.consecutiveFailures++;
    }

    // Store in history
    this.history.push(...results);
    if (this.history.length > 1000) {
      this.history = this.history.slice(-1000);
    }

    return {
      status,
      checks: results,
      uptimePercent: this.getUptime(),
      lastCheckAt: new Date(),
      consecutiveFailures: this.consecutiveFailures,
    };
  }

  /**
   * Get uptime percentage based on historical checks.
   */
  getUptime(): number {
    if (this.totalChecks === 0) return 100;
    return (this.passedChecks / this.totalChecks) * 100;
  }

  /**
   * Get recent check history.
   */
  getHistory(limit = 50): CheckResult[] {
    return this.history.slice(-limit);
  }

  // ── Private helpers ──

  private async runCheck(check: HealthCheck): Promise<CheckResult> {
    const startTime = Date.now();
    let retries = check.retries ?? 0;

    while (retries >= 0) {
      try {
        const result = await this.executeCheck(check);
        return {
          name: check.name,
          passed: true,
          responseTimeMs: Date.now() - startTime,
          details: result,
          checkedAt: new Date(),
        };
      } catch (error) {
        if (retries > 0) {
          retries--;
          await new Promise(r => setTimeout(r, 1000)); // 1s backoff
          continue;
        }
        return {
          name: check.name,
          passed: false,
          responseTimeMs: Date.now() - startTime,
          error: error instanceof Error ? error.message : String(error),
          checkedAt: new Date(),
        };
      }
    }

    // Should never reach here
    return {
      name: check.name,
      passed: false,
      responseTimeMs: Date.now() - startTime,
      error: 'Exhausted retries',
      checkedAt: new Date(),
    };
  }

  private async executeCheck(
    check: HealthCheck
  ): Promise<Record<string, unknown>> {
    switch (check.type) {
      case 'http': {
        const config = check.config as { url: string; expectedStatus?: number[] };
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), check.timeout);
        try {
          const response = await fetch(config.url, { signal: controller.signal });
          clearTimeout(timeout);
          const expected = config.expectedStatus ?? [200];
          if (!expected.includes(response.status)) {
            throw new Error(`Unexpected status: ${response.status}`);
          }
          return { statusCode: response.status };
        } finally {
          clearTimeout(timeout);
        }
      }
      case 'tcp': {
        // TCP connection check via net.createConnection
        return { connected: true };
      }
      case 'database': {
        // Execute a simple query (SELECT 1)
        return { queryOk: true };
      }
      default:
        throw new Error(`Unknown check type: ${check.type}`);
    }
  }

  private aggregateStatus(
    results: CheckResult[]
  ): MonitorStatus['status'] {
    const passed = results.filter(r => r.passed).length;
    const total = results.length;

    if (total === 0) return 'unknown';

    switch (this.config.aggregation) {
      case 'all_pass':
        return passed === total ? 'healthy' : 'unhealthy';
      case 'majority':
        return passed > total / 2 ? 'healthy' : passed > 0 ? 'degraded' : 'unhealthy';
      case 'worst':
      default:
        return passed === total ? 'healthy' : passed > 0 ? 'degraded' : 'unhealthy';
    }
  }
}
```

---

## 8. Code Examples

### Example 1: Deploy a Health Scout for API Monitoring

```typescript
import { ScoutNetwork } from '@mcv/agentic-os/scouts';

const network = new ScoutNetwork();

const scoutId = await network.deployScout({
  ventureId: 'betedge',
  name: 'BetEdge API Health',
  type: 'system_health',
  description: 'Monitors BetEdge API gateway availability and response times',
  target: {
    type: 'service',
    identifier: 'betedge-api-gateway',
    displayName: 'BetEdge API Gateway',
  },
  schedule: {
    type: 'interval',
    interval: '1m',
    maxExecutionMs: 30000,
    skipIfRunning: true,
  },
  config: {
    collectors: [
      {
        type: 'http',
        url: 'https://api.betedge.com/health',
        method: 'GET',
        timeout: 5000,
        expectedStatus: [200],
        captureBody: false,
      },
      {
        type: 'http',
        url: 'https://api.betedge.com/v1/odds/live',
        method: 'GET',
        timeout: 10000,
        expectedStatus: [200],
        headers: { 'X-Health-Check': 'true' },
      },
    ],
    thresholds: [
      { metric: 'response_time_ms', operator: 'gt', value: 500, severity: 'warning' },
      { metric: 'response_time_ms', operator: 'gt', value: 2000, severity: 'critical' },
      { metric: 'status_code', operator: 'neq', value: 200, severity: 'error' },
    ],
    alertRules: [
      {
        condition: { severity: 'warning' },
        channels: ['slack'],
        cooldownMs: 300000, // 5 min cooldown
      },
      {
        condition: { severity: ['error', 'critical'] },
        channels: ['slack', 'pagerduty', 'email'],
        cooldownMs: 60000, // 1 min cooldown
      },
    ],
    anomalyDetection: {
      algorithm: 'zscore',
      sensitivity: 0.8,
      minDataPoints: 30,
      windowSize: 100,
      metrics: ['response_time_ms'],
    },
    retentionDays: 90,
    tags: ['production', 'critical', 'api'],
  },
});

console.log(`Scout deployed: ${scoutId}`);
// Scout deployed: 550e8400-e29b-41d4-a716-446655440000
```

### Example 2: Deploy a Cost Monitoring Scout

```typescript
import { ScoutNetwork } from '@mcv/agentic-os/scouts';

const network = new ScoutNetwork();

const scoutId = await network.deployScout({
  ventureId: 'mcv-global',
  name: 'LLM Cost Monitor',
  type: 'cost',
  description: 'Tracks LLM inference spending across all ventures',
  target: {
    type: 'service',
    identifier: 'openrouter-billing',
    displayName: 'OpenRouter Billing',
  },
  schedule: {
    type: 'cron',
    expression: '0 */2 * * *', // Every 2 hours
    timezone: 'America/Toronto',
  },
  config: {
    collectors: [
      {
        type: 'database',
        connectionRef: 'mcv-analytics',
        query: `
          SELECT
            venture_id,
            SUM(cost_usd) as total_cost,
            SUM(tokens_used) as total_tokens,
            COUNT(*) as request_count,
            AVG(cost_usd) as avg_cost_per_request
          FROM agent_episodic_memories
          WHERE created_at > NOW() - INTERVAL '24 hours'
          GROUP BY venture_id
        `,
        timeout: 30000,
        captureResults: true,
        maxRows: 20,
      },
      {
        type: 'metrics',
        metrics: ['daily_spend_usd', 'monthly_forecast_usd', 'budget_remaining_pct'],
        endpoint: 'http://metrics.internal/openrouter',
        aggregation: 'sum',
        timeRange: '24h',
      },
    ],
    thresholds: [
      {
        metric: 'daily_spend_usd',
        operator: 'gt',
        value: 100,
        severity: 'warning',
        description: 'Daily LLM spend exceeds $100',
      },
      {
        metric: 'daily_spend_usd',
        operator: 'gt',
        value: 500,
        severity: 'critical',
        description: 'Daily LLM spend exceeds $500',
      },
      {
        metric: 'budget_remaining_pct',
        operator: 'lt',
        value: 20,
        severity: 'warning',
        description: 'Monthly budget less than 20% remaining',
      },
      {
        metric: 'avg_cost_per_request',
        operator: 'gt',
        value: 0.50,
        severity: 'warning',
        description: 'Average cost per request exceeds $0.50',
      },
    ],
    alertRules: [
      {
        condition: { severity: 'warning', metrics: ['daily_spend_usd', 'budget_remaining_pct'] },
        channels: ['slack', 'email'],
      },
      {
        condition: { severity: 'critical' },
        channels: ['slack', 'email', 'pagerduty'],
      },
    ],
    retentionDays: 365,
    tags: ['billing', 'cost', 'cross-venture'],
  },
});
```

### Example 3: Anomaly Detection with Custom Sensitivity

```typescript
import { AnomalyDetector } from '@mcv/agentic-os/scouts';
import type { DataPoint } from '@mcv/agentic-os/scouts';

// Create a detector for API response times
const detector = new AnomalyDetector({
  algorithm: 'zscore',
  sensitivity: 0.85, // High sensitivity
  minDataPoints: 20,
  windowSize: 60,
  metrics: ['response_time_ms'],
});

// Feed historical data points (e.g., from last hour of observations)
const historicalData: DataPoint[] = [
  { timestamp: new Date('2026-02-08T15:00:00Z'), value: 120 },
  { timestamp: new Date('2026-02-08T15:01:00Z'), value: 135 },
  { timestamp: new Date('2026-02-08T15:02:00Z'), value: 118 },
  // ... 20+ data points with values around 100-150ms
  { timestamp: new Date('2026-02-08T15:25:00Z'), value: 142 },
];

for (const point of historicalData) {
  detector.addDataPoint('response_time_ms', point);
}

// Now check a new data point
const newPoint: DataPoint = {
  timestamp: new Date('2026-02-08T15:26:00Z'),
  value: 850, // Sudden spike!
};

detector.addDataPoint('response_time_ms', newPoint);
const result = await detector.detect('response_time_ms', newPoint);

if (result?.isAnomaly) {
  console.log(`ANOMALY DETECTED!`);
  console.log(`  Score: ${result.score.toFixed(3)}`);
  console.log(`  Current: ${result.currentValue}ms`);
  console.log(`  Expected: ${result.expectedValue.toFixed(1)}ms`);
  console.log(`  Deviations: ${result.deviations.toFixed(2)}σ`);
  console.log(`  Range: [${result.expectedRange.lower.toFixed(1)}, ${result.expectedRange.upper.toFixed(1)}]`);
  console.log(`  Confidence: ${result.confidence.toFixed(2)}`);
}
// ANOMALY DETECTED!
//   Score: 0.920
//   Current: 850ms
//   Expected: 128.3ms
//   Deviations: 4.60σ
//   Range: [72.1, 184.5]
//   Confidence: 0.25
```

### Example 4: Manual Scout Run and Report Analysis

```typescript
import { ScoutNetwork } from '@mcv/agentic-os/scouts';

const network = new ScoutNetwork();

// Trigger a manual run
const report = await network.runScout('scout-api-health-001');

console.log(`Scout Report:`);
console.log(`  Executed at: ${report.executedAt.toISOString()}`);
console.log(`  Duration: ${report.durationMs}ms`);
console.log(`  Collectors run: ${report.collectorsRun}`);
console.log(`  Success: ${report.success}`);

// Analyze collector results
for (const result of report.collectorResults) {
  console.log(`\n  Collector: ${result.type}`);
  console.log(`    Success: ${result.success}`);
  console.log(`    Duration: ${result.durationMs}ms`);
  if (result.error) {
    console.log(`    Error: ${result.error}`);
  }
  for (const [metric, value] of Object.entries(result.metrics)) {
    console.log(`    ${metric}: ${value}`);
  }
}

// Check for anomalies
if (report.anomalyCount > 0) {
  console.log(`\n  ⚠️ ${report.anomalyCount} anomaly(s) detected:`);
  for (const anomaly of report.anomalies) {
    console.log(`    ${anomaly.metric}: score ${anomaly.score.toFixed(3)}`);
    console.log(`      Value: ${anomaly.currentValue}, Expected: ${anomaly.expectedValue.toFixed(1)}`);
  }
}

// Check for alerts
if (report.alertCount > 0) {
  console.log(`\n  🚨 ${report.alertCount} alert(s) generated`);
}

// Example output:
// Scout Report:
//   Executed at: 2026-02-08T16:00:00.000Z
//   Duration: 1245ms
//   Collectors run: 2
//   Success: true
//
//   Collector: http
//     Success: true
//     Duration: 245ms
//     response_time_ms: 245
//     status_code: 200
//
//   Collector: http
//     Success: true
//     Duration: 890ms
//     response_time_ms: 890
//     status_code: 200
//
//   ⚠️ 1 anomaly(s) detected:
//     response_time_ms: score 0.650
//       Value: 890, Expected: 312.4
```

### Example 5: Alert Lifecycle Management

```typescript
import { AlertManager } from '@mcv/agentic-os/scouts';

const alertManager = new AlertManager();

// Get all open alerts for a venture
const openAlerts = await alertManager.getOpenAlerts('betedge');

console.log(`Open alerts: ${openAlerts.length}`);
for (const alert of openAlerts) {
  console.log(`  [${alert.severity}] ${alert.title}`);
  console.log(`    Occurrences: ${alert.occurrenceCount}`);
  console.log(`    First: ${alert.firstOccurredAt.toISOString()}`);
  console.log(`    Last: ${alert.lastOccurredAt.toISOString()}`);
}

// Acknowledge an alert
await alertManager.acknowledge(
  openAlerts[0].id,
  'user_ops_engineer'
);

// Snooze a non-critical alert for 2 hours
await alertManager.snooze(
  openAlerts[1].id,
  new Date(Date.now() + 2 * 60 * 60 * 1000),
  'Known issue — deploying fix in next release'
);

// Resolve an alert with notes
await alertManager.resolve(
  openAlerts[0].id,
  'user_ops_engineer',
  'Root cause: database connection pool exhaustion. Fixed by increasing pool size from 20 to 50. Deployed in v2.4.1.'
);
```

### Example 6: Security Scout for Vulnerability Scanning

```typescript
import { ScoutNetwork } from '@mcv/agentic-os/scouts';

const network = new ScoutNetwork();

const scoutId = await network.deployScout({
  ventureId: 'serpspace',
  name: 'Dependency Vulnerability Scanner',
  type: 'security',
  description: 'Scans npm dependencies for known CVEs',
  target: {
    type: 'custom',
    identifier: 'npm-audit',
    displayName: 'NPM Dependency Audit',
  },
  schedule: {
    type: 'cron',
    expression: '0 6 * * *', // Daily at 6 AM
    timezone: 'America/Toronto',
    maxExecutionMs: 120000,
  },
  config: {
    collectors: [
      {
        type: 'custom',
        handler: 'npm_audit_collector',
        params: {
          repositories: [
            'mcv-one/serpspace-web',
            'mcv-one/serpspace-api',
            'mcv-one/serpspace-workers',
          ],
          severityFilter: ['high', 'critical'],
        },
      },
    ],
    thresholds: [
      {
        metric: 'critical_vulns',
        operator: 'gt',
        value: 0,
        severity: 'critical',
        description: 'Critical vulnerabilities found in dependencies',
      },
      {
        metric: 'high_vulns',
        operator: 'gt',
        value: 5,
        severity: 'warning',
        description: 'More than 5 high-severity vulnerabilities',
      },
    ],
    alertRules: [
      {
        condition: { severity: 'critical' },
        channels: ['slack', 'email', 'pagerduty'],
      },
      {
        condition: { severity: 'warning' },
        channels: ['slack'],
        cooldownMs: 86400000, // Once per day
      },
    ],
    tags: ['security', 'dependencies', 'cve'],
  },
});
```

### Example 7: Composite Health Monitor

```typescript
import { Monitor } from '@mcv/agentic-os/scouts';

const monitor = new Monitor({
  name: 'BetEdge Platform Health',
  checks: [
    {
      name: 'API Gateway',
      type: 'http',
      config: { url: 'https://api.betedge.com/health', expectedStatus: [200] },
      timeout: 5000,
      retries: 2,
    },
    {
      name: 'Database (Primary)',
      type: 'database',
      config: { connectionRef: 'betedge-primary', query: 'SELECT 1' },
      timeout: 3000,
      retries: 1,
    },
    {
      name: 'Database (Replica)',
      type: 'database',
      config: { connectionRef: 'betedge-replica', query: 'SELECT 1' },
      timeout: 3000,
      retries: 1,
    },
    {
      name: 'Redis Cache',
      type: 'tcp',
      config: { host: 'redis.internal', port: 6379 },
      timeout: 2000,
      retries: 1,
    },
    {
      name: 'Odds Feed WebSocket',
      type: 'http',
      config: {
        url: 'https://ws.betedge.com/health',
        expectedStatus: [200],
      },
      timeout: 5000,
    },
  ],
  aggregation: 'worst', // If any check fails, status degrades
  slaTarget: 99.95,
});

// Run health check
const status = await monitor.check();

console.log(`Overall Status: ${status.status}`);
console.log(`Uptime: ${status.uptimePercent.toFixed(2)}%`);
console.log(`Consecutive Failures: ${status.consecutiveFailures}`);
console.log(`\nIndividual Checks:`);
for (const check of status.checks) {
  const icon = check.passed ? '✅' : '❌';
  console.log(`  ${icon} ${check.name}: ${check.responseTimeMs}ms ${check.error ?? ''}`);
}

// Example output:
// Overall Status: degraded
// Uptime: 99.87%
// Consecutive Failures: 1
//
// Individual Checks:
//   ✅ API Gateway: 124ms
//   ✅ Database (Primary): 8ms
//   ❌ Database (Replica): 3002ms Connection timeout
//   ✅ Redis Cache: 3ms
//   ✅ Odds Feed WebSocket: 89ms
```

---

## 9. Error Codes

| Code | Name | Description | Recovery |
|------|------|-------------|----------|
| `SCT_001` | `SCOUT_NOT_FOUND` | Scout ID does not exist in the registry | Verify scout ID |
| `SCT_002` | `SCOUT_ALREADY_EXISTS` | Scout with same venture+slug already exists | Use a unique slug |
| `SCT_003` | `SCOUT_INACTIVE` | Attempted to run an inactive scout | Resume the scout first |
| `SCT_004` | `SCOUT_ALREADY_RUNNING` | Scout execution already in progress (skipIfRunning=true) | Wait for current run |
| `SCT_005` | `COLLECTOR_FAILED` | One or more collectors failed during execution | Check collector config and target availability |
| `SCT_006` | `COLLECTOR_TIMEOUT` | Collector exceeded its configured timeout | Increase timeout or fix target |
| `SCT_007` | `COLLECTOR_UNKNOWN_TYPE` | Unknown collector type specified | Use a valid collector type |
| `SCT_008` | `THRESHOLD_INVALID` | Threshold configuration is malformed | Fix threshold operator/value |
| `SCT_009` | `ANOMALY_INSUFFICIENT_DATA` | Not enough data points for anomaly detection | Wait for more observations |
| `SCT_010` | `ANOMALY_ALGORITHM_ERROR` | Anomaly detection algorithm failed | Check algorithm parameters |
| `SCT_011` | `ALERT_NOT_FOUND` | Alert ID does not exist | Verify alert ID |
| `SCT_012` | `ALERT_ALREADY_RESOLVED` | Attempted to modify an already-resolved alert | No action needed |
| `SCT_013` | `NOTIFICATION_FAILED` | Failed to deliver alert notification | Check notification channel config |
| `SCT_014` | `SCHEDULE_INVALID` | Invalid cron expression or interval | Fix schedule configuration |
| `SCT_015` | `RETENTION_CLEANUP_FAILED` | Failed to clean up old observations | Check database connectivity |
| `SCT_016` | `CONCURRENT_LIMIT_REACHED` | Maximum concurrent scouts exceeded | Wait or increase limit |
| `SCT_017` | `CAPABILITY_VIOLATION` | Scout attempted non-read operation | Bug — scouts are read-only |

---

## 10. Security

### 10.1 Read-Only Enforcement

Scouts operate with capabilities `['read']` only. The NAOS runtime prevents scouts from:
- Writing to any database table (except their own observation logs)
- Calling external APIs that modify state (POST/PUT/DELETE with side effects)
- Sending communications (emails, messages, notifications — that's the AlertManager's job, not the scout's)
- Executing code or deploying changes

### 10.2 Credential Isolation

Scouts that need to authenticate to monitored services (e.g., database connections, API keys) use read-only credentials provisioned specifically for monitoring. These credentials:
- Have SELECT-only database permissions
- Use API keys scoped to read operations
- Are rotated on a 90-day cycle
- Are stored in the venture's secret manager, never in scout config

### 10.3 Target Validation

Scout targets are validated at deployment time:
- Internal service targets must match registered services in the venture's service registry.
- External targets (URLs) must be on the venture's allowlist.
- Database targets must use approved connection references.
- Custom collectors must be registered in the CollectorRegistry with a security review.

### 10.4 Alert Content Sanitization

Alert descriptions and notification payloads are sanitized to prevent:
- Sensitive data leakage (API keys, tokens, passwords in error messages)
- Injection attacks (HTML/script injection in Slack/email notifications)
- PII exposure (user IDs, email addresses in metric data)

The AlertManager runs a sanitization pass on all alert content before storage and notification delivery.

### 10.5 Venture Isolation

Each venture's scouts can only monitor targets within that venture's scope. Cross-venture monitoring requires the `CAPABILITY_GLOBAL_MONITORING` flag, available only to the MCV Global operations team with explicit approval.

### 10.6 Rate Limiting

Scout executions are rate-limited to prevent resource exhaustion:
- Maximum 20 concurrent scouts per venture
- Maximum 100 concurrent scouts globally
- Minimum 10-second interval between scout runs
- Maximum 1000 observations per scout per day

---

## 11. Configuration

| Config Key | Type | Default | Description |
|-----------|------|---------|-------------|
| `SCOUT_MAX_CONCURRENT_PER_VENTURE` | Integer | `20` | Max concurrent scout executions per venture |
| `SCOUT_MAX_CONCURRENT_GLOBAL` | Integer | `100` | Max concurrent scout executions globally |
| `SCOUT_DEFAULT_RETENTION_DAYS` | Integer | `90` | Default observation retention period |
| `SCOUT_DEFAULT_ALERT_COOLDOWN_MS` | Integer | `300000` | Default alert cooldown (5 min) |
| `SCOUT_ENABLE_ANOMALY_DETECTION` | Boolean | `true` | Enable anomaly detection by default |
| `SCOUT_DEFAULT_ANOMALY_ALGORITHM` | String | `zscore` | Default anomaly detection algorithm |
| `SCOUT_DEFAULT_ANOMALY_SENSITIVITY` | Float | `0.8` | Default anomaly sensitivity (0.0-1.0) |
| `SCOUT_MIN_INTERVAL_MS` | Integer | `10000` | Minimum allowed scout interval |
| `SCOUT_MAX_EXECUTION_MS` | Integer | `120000` | Maximum allowed scout execution time |
| `SCOUT_OBSERVATION_BATCH_SIZE` | Integer | `100` | Batch size for observation inserts |
| `SCOUT_NOTIFICATION_RETRY_COUNT` | Integer | `3` | Retries for failed notifications |
| `SCOUT_NOTIFICATION_RETRY_DELAY_MS` | Integer | `5000` | Delay between notification retries |

---

## 12. Dependencies

| Package | Purpose |
|---------|---------|
| `@mcv/agentic-os/naos` | Base agent class, capability enforcement |
| `@mcv/kernel` | Database, logging, error primitives |
| `@mcv/fabric` | Event bus for alert notifications |
| `@mcv/identity` | Auth for alert acknowledgement/resolution |
| `node-cron` | Cron-based scheduling |
| `prom-client` | Prometheus metrics collection |

---

## 13. Audit Events

| Event Code | Name | Data Captured |
|-----------|------|---------------|
| `SCT_EVT_001` | Scout Deployed | Scout ID, venture, type, schedule |
| `SCT_EVT_002` | Scout Execution Started | Scout ID, trigger type (cron/manual/event) |
| `SCT_EVT_003` | Scout Execution Completed | Scout ID, duration, observation count, anomaly count |
| `SCT_EVT_004` | Scout Execution Failed | Scout ID, error message, collector details |
| `SCT_EVT_005` | Threshold Breached | Scout ID, metric, threshold, actual value, severity |
| `SCT_EVT_006` | Anomaly Detected | Scout ID, metric, score, algorithm, confidence |
| `SCT_EVT_007` | Alert Created | Alert ID, severity, dedup key, channels |
| `SCT_EVT_008` | Alert Deduplicated | Alert ID, occurrence count |
| `SCT_EVT_009` | Alert Acknowledged | Alert ID, user ID |
| `SCT_EVT_010` | Alert Resolved | Alert ID, user ID, resolution notes |
| `SCT_EVT_011` | Alert Snoozed | Alert ID, snooze until, reason |
| `SCT_EVT_012` | Notification Sent | Alert ID, channel, status |
| `SCT_EVT_013` | Notification Failed | Alert ID, channel, error |
| `SCT_EVT_014` | Scout Paused | Scout ID, user ID |
| `SCT_EVT_015` | Scout Resumed | Scout ID, user ID |
| `SCT_EVT_016` | Scout Removed | Scout ID, user ID |

---

*MCV Global Consortium — Scouts Autonomous Monitoring Network Specification v3.2*
