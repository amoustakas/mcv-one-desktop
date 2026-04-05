# @mcv/fabric/queue — Job Queue Module

**Parent Package:** @mcv/fabric  
**Tier:** 2 (Infrastructure Services)  
**Classification:** INTERNAL  
**Last Updated:** February 8, 2026

---

## Purpose

The `queue` module provides distributed job queue infrastructure for the MCV ecosystem. It handles background processing, scheduled tasks, retry logic, and workflow orchestration. Built on Redis-backed queues with support for priorities, delays, and dead-letter handling.

**All async background work flows through this module.**

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// QUEUE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

export { 
  Queue,
  createQueue,
  getQueue,
} from './queue';

export {
  Worker,
  createWorker,
} from './worker';

// ═══════════════════════════════════════════════════════════════════════════════
// JOB OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  enqueue,
  enqueueBulk,
  schedule,
  scheduleRepeating,
  cancel,
  getJob,
  getJobs,
} from './operations';

// ═══════════════════════════════════════════════════════════════════════════════
// FLOWS & WORKFLOWS
// ═══════════════════════════════════════════════════════════════════════════════

export { Flow, FlowProducer } from './flow';
export { Workflow, WorkflowStep } from './workflow';

// ═══════════════════════════════════════════════════════════════════════════════
// PRE-BUILT QUEUES
// ═══════════════════════════════════════════════════════════════════════════════

export { emailQueue } from './queues/email';
export { notificationQueue } from './queues/notification';
export { webhookQueue } from './queues/webhook';
export { syncQueue } from './queues/sync';
export { reportQueue } from './queues/report';
export { auditQueue } from './queues/audit';

// ═══════════════════════════════════════════════════════════════════════════════
// MONITORING
// ═══════════════════════════════════════════════════════════════════════════════

export { QueueMonitor } from './monitor';
export { QueueDashboard } from './dashboard';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  Job,
  JobOptions,
  JobStatus,
  JobResult,
  QueueConfig,
  WorkerConfig,
  FlowJob,
  RepeatOptions,
  BackoffStrategy,
} from './types';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           JOB QUEUE ARCHITECTURE                                 │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                              PRODUCERS                                       │ │
│  │                                                                              │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │ │
│  │  │  API Routes │  │   Events    │  │  Scheduled  │  │  Webhooks   │        │ │
│  │  │             │  │   Module    │  │   Cron      │  │             │        │ │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │ │
│  │         │                │                │                │                │ │
│  │         └────────────────┼────────────────┼────────────────┘                │ │
│  │                          │                │                                  │ │
│  │                          ▼                ▼                                  │ │
│  │               ┌─────────────────────────────────┐                           │ │
│  │               │      enqueue(name, data, opts)  │                           │ │
│  │               └─────────────────────────────────┘                           │ │
│  │                                    │                                         │ │
│  └────────────────────────────────────┼─────────────────────────────────────────┘ │
│                                       │                                           │
│  ┌────────────────────────────────────▼─────────────────────────────────────────┐ │
│  │                                REDIS                                          │ │
│  │                                                                               │ │
│  │  ┌──────────────────────────────────────────────────────────────────────┐    │ │
│  │  │                          Queue Storage                                │    │ │
│  │  │                                                                       │    │ │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐             │    │ │
│  │  │  │  email   │  │  notif   │  │  webhook │  │   sync   │             │    │ │
│  │  │  │  queue   │  │  queue   │  │  queue   │  │  queue   │             │    │ │
│  │  │  │          │  │          │  │          │  │          │             │    │ │
│  │  │  │ waiting  │  │ waiting  │  │ waiting  │  │ waiting  │             │    │ │
│  │  │  │ active   │  │ active   │  │ active   │  │ active   │             │    │ │
│  │  │  │ delayed  │  │ delayed  │  │ delayed  │  │ delayed  │             │    │ │
│  │  │  │ failed   │  │ failed   │  │ failed   │  │ failed   │             │    │ │
│  │  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘             │    │ │
│  │  │                                                                       │    │ │
│  │  └───────────────────────────────────────────────────────────────────────┘    │ │
│  │                                                                               │ │
│  └───────────────────────────────────────────────────────────────────────────────┘ │
│                                       │                                           │
│  ┌────────────────────────────────────┼─────────────────────────────────────────┐ │
│  │                               WORKERS                                         │ │
│  │                                    │                                          │ │
│  │  ┌──────────────┐  ┌───────────────▼───────────────┐  ┌──────────────┐       │ │
│  │  │   Worker 1   │  │         Worker Pool           │  │   Worker N   │       │ │
│  │  │              │  │                               │  │              │       │ │
│  │  │  Concurrency │  │  • Pulls jobs from queues    │  │  Concurrency │       │ │
│  │  │  = 5         │  │  • Executes processors       │  │  = 5         │       │ │
│  │  │              │  │  • Reports results           │  │              │       │ │
│  │  │  Queues:     │  │  • Handles retries           │  │  Queues:     │       │ │
│  │  │  - email     │  │  • Dead letter on fail       │  │  - sync      │       │ │
│  │  │  - notif     │  │                               │  │  - report    │       │ │
│  │  └──────────────┘  └───────────────────────────────┘  └──────────────┘       │ │
│  │                                                                               │ │
│  └───────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                     │
│  ┌───────────────────────────────────────────────────────────────────────────────┐ │
│  │                              MONITORING                                        │ │
│  │                                                                                │ │
│  │    ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                 │ │
│  │    │  Queue Stats   │  │  Job History   │  │   Alerts       │                 │ │
│  │    │                │  │                │  │                │                 │ │
│  │    │  - Waiting     │  │  - Completed   │  │  - Dead letter │                 │ │
│  │    │  - Active      │  │  - Failed      │  │  - Stale jobs  │                 │ │
│  │    │  - Delayed     │  │  - Retried     │  │  - High latency│                 │ │
│  │    │  - Throughput  │  │                │  │                │                 │ │
│  │    └────────────────┘  └────────────────┘  └────────────────┘                 │ │
│  │                                                                                │ │
│  └────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Interfaces

### Job

```typescript
interface Job<T = unknown> {
  id: string;                           // Unique job ID
  name: string;                         // Job type name
  data: T;                              // Job payload
  
  // Status
  status: JobStatus;                    // 'waiting' | 'active' | 'completed' | 'failed' | 'delayed'
  progress: number;                     // 0-100
  
  // Attempts
  attemptsMade: number;
  attemptsMax: number;
  
  // Timing
  createdAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  
  // Delay/schedule
  delay?: number;                       // Delay in ms
  scheduledAt?: Date;                   // When to process
  
  // Result/error
  result?: unknown;
  error?: string;
  stacktrace?: string[];
  
  // Metadata
  priority: number;
  parentId?: string;                    // For flow jobs
  repeatJobKey?: string;                // For repeating jobs
}
```

### JobOptions

```typescript
interface JobOptions {
  // Priority (higher = processed first)
  priority?: number;                    // Default: 0
  
  // Delays
  delay?: number;                       // Delay in ms
  
  // Retries
  attempts?: number;                    // Max attempts (default: 3)
  backoff?: BackoffStrategy;            // Retry strategy
  
  // Timeout
  timeout?: number;                     // Job timeout in ms
  
  // Removal
  removeOnComplete?: boolean | number;  // Remove after completion (or keep N)
  removeOnFail?: boolean | number;      // Remove on failure (or keep N)
  
  // Deduplication
  jobId?: string;                       // Custom job ID (for dedup)
  
  // Repeat
  repeat?: RepeatOptions;               // For scheduled jobs
}

interface BackoffStrategy {
  type: 'fixed' | 'exponential';
  delay: number;                        // Base delay in ms
  maxDelay?: number;                    // Cap for exponential
}

interface RepeatOptions {
  pattern?: string;                     // Cron pattern
  every?: number;                       // Repeat every N ms
  limit?: number;                       // Max repetitions
  tz?: string;                          // Timezone
  startDate?: Date;                     // Start repeating from
  endDate?: Date;                       // Stop repeating after
}
```

### QueueConfig

```typescript
interface QueueConfig {
  name: string;                         // Queue name
  
  // Connection
  redis: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  
  // Defaults
  defaultJobOptions: JobOptions;
  
  // Limits
  limiter?: {
    max: number;                        // Max jobs per duration
    duration: number;                   // Duration in ms
  };
}
```

### WorkerConfig

```typescript
interface WorkerConfig {
  queue: string;                        // Queue to process
  
  // Concurrency
  concurrency: number;                  // Parallel jobs (default: 1)
  
  // Processing
  processor: (job: Job) => Promise<unknown>;
  
  // Callbacks
  onCompleted?: (job: Job, result: unknown) => void;
  onFailed?: (job: Job, error: Error) => void;
  onProgress?: (job: Job, progress: number) => void;
  
  // Locking
  lockDuration?: number;                // Lock duration in ms
  lockRenewTime?: number;               // Renew lock every N ms
}
```

---

## Usage Examples

### Basic Queue Operations

```typescript
import { enqueue, getJob, getJobs, cancel } from '@mcv/queue';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 1: Enqueue a job
// ═══════════════════════════════════════════════════════════════════════════════

const job = await enqueue('email', 'send-welcome', {
  to: 'john@example.com',
  template: 'welcome',
  variables: { name: 'John' },
});

console.log('Job ID:', job.id);
console.log('Status:', job.status);

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 2: Enqueue with options
// ═══════════════════════════════════════════════════════════════════════════════

await enqueue('webhook', 'send-webhook', 
  {
    url: 'https://api.example.com/webhook',
    payload: eventData,
  },
  {
    priority: 10,                       // Higher priority
    attempts: 5,                        // More retries
    backoff: {
      type: 'exponential',
      delay: 1000,                      // Start at 1s
      maxDelay: 60000,                  // Cap at 1m
    },
    timeout: 30000,                     // 30s timeout
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 3: Delayed job
// ═══════════════════════════════════════════════════════════════════════════════

// Process in 1 hour
await enqueue('notification', 'send-reminder', 
  { userId: 'user-123', message: 'Your trial ends tomorrow' },
  { delay: 60 * 60 * 1000 }
);

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 4: Bulk enqueue
// ═══════════════════════════════════════════════════════════════════════════════

import { enqueueBulk } from '@mcv/queue';

await enqueueBulk('email', users.map(user => ({
  name: 'send-newsletter',
  data: { to: user.email, content: newsletterHtml },
})));

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 5: Get job status
// ═══════════════════════════════════════════════════════════════════════════════

const job = await getJob('email', 'job-123');
console.log('Status:', job.status);
console.log('Attempts:', job.attemptsMade);
console.log('Progress:', job.progress);

// Get all failed jobs
const failedJobs = await getJobs('email', { status: 'failed', limit: 100 });

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 6: Cancel job
// ═══════════════════════════════════════════════════════════════════════════════

await cancel('email', 'job-123');
```

### Scheduled & Repeating Jobs

```typescript
import { schedule, scheduleRepeating } from '@mcv/queue';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 7: Schedule at specific time
// ═══════════════════════════════════════════════════════════════════════════════

await schedule('notification', 'appointment-reminder', 
  { appointmentId: 'apt-123', userId: 'user-456' },
  new Date('2026-02-10T14:00:00Z')      // Schedule for specific time
);

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 8: Repeating job (cron)
// ═══════════════════════════════════════════════════════════════════════════════

// Daily digest at 9 AM
await scheduleRepeating('email', 'daily-digest', 
  { type: 'digest' },
  {
    pattern: '0 9 * * *',               // 9 AM daily
    tz: 'America/New_York',
  }
);

// Every 5 minutes
await scheduleRepeating('sync', 'sync-inventory', 
  { source: 'shopify' },
  {
    every: 5 * 60 * 1000,               // Every 5 minutes
    limit: 288,                          // 24 hours worth
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 9: One-time scheduled task
// ═══════════════════════════════════════════════════════════════════════════════

// Reminder 1 hour before meeting
await schedule('notification', 'meeting-reminder',
  { meetingId, attendees },
  subHours(meeting.startTime, 1)
);
```

### Worker Setup

```typescript
import { createWorker, Worker } from '@mcv/queue';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 10: Simple worker
// ═══════════════════════════════════════════════════════════════════════════════

const emailWorker = createWorker({
  queue: 'email',
  concurrency: 5,
  
  processor: async (job) => {
    const { to, template, variables } = job.data;
    
    // Send email
    const result = await sendGridService.send({
      to,
      template,
      variables,
    });
    
    return { messageId: result.id };
  },
  
  onCompleted: (job, result) => {
    console.log(`Email sent: ${result.messageId}`);
  },
  
  onFailed: (job, error) => {
    console.error(`Email failed: ${error.message}`);
  },
});

// Start processing
await emailWorker.start();

// Graceful shutdown
process.on('SIGTERM', async () => {
  await emailWorker.close();
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 11: Worker with progress reporting
// ═══════════════════════════════════════════════════════════════════════════════

const reportWorker = createWorker({
  queue: 'report',
  concurrency: 2,
  
  processor: async (job) => {
    const { reportType, filters, userId } = job.data;
    
    // Step 1: Fetch data
    await job.updateProgress(10);
    const data = await fetchReportData(reportType, filters);
    
    // Step 2: Process
    await job.updateProgress(50);
    const processed = await processData(data);
    
    // Step 3: Generate file
    await job.updateProgress(80);
    const file = await generatePdf(processed);
    
    // Step 4: Upload and notify
    const url = await storage.upload(file);
    await job.updateProgress(100);
    
    return { url, rows: processed.length };
  },
});
```

### Job Flows (Dependencies)

```typescript
import { Flow, FlowProducer } from '@mcv/queue';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 12: Parent-child job dependencies
// ═══════════════════════════════════════════════════════════════════════════════

const flowProducer = new FlowProducer();

// Create a flow where notification waits for email to complete
const flow = await flowProducer.add({
  name: 'onboarding-flow',
  queueName: 'notification',
  data: { userId: 'user-123', step: 'complete' },
  children: [
    {
      name: 'send-welcome-email',
      queueName: 'email',
      data: { to: 'john@example.com', template: 'welcome' },
    },
    {
      name: 'setup-workspace',
      queueName: 'sync',
      data: { userId: 'user-123', defaults: true },
    },
  ],
});

// Parent job runs after all children complete

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 13: Complex workflow
// ═══════════════════════════════════════════════════════════════════════════════

// Invoice flow: generate → email → webhook
const invoiceFlow = await flowProducer.add({
  name: 'notify-invoice-sent',
  queueName: 'webhook',
  data: { invoiceId, event: 'invoice.sent' },
  children: [
    {
      name: 'email-invoice',
      queueName: 'email',
      data: { to: customer.email, invoiceId },
      children: [
        {
          name: 'generate-invoice-pdf',
          queueName: 'report',
          data: { invoiceId, format: 'pdf' },
        },
      ],
    },
  ],
});
```

### Pre-built Queue Usage

```typescript
import { 
  emailQueue, 
  notificationQueue, 
  webhookQueue,
  syncQueue,
} from '@mcv/queue';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 14: Using pre-built queues
// ═══════════════════════════════════════════════════════════════════════════════

// Email queue
await emailQueue.add('send-transactional', {
  to: 'user@example.com',
  templateId: 'password-reset',
  variables: { resetLink },
});

// Notification queue
await notificationQueue.add('push', {
  userId: 'user-123',
  title: 'New Message',
  body: 'You have a new message from John',
  data: { conversationId: 'conv-456' },
});

// Webhook queue
await webhookQueue.add('dispatch', {
  url: 'https://api.customer.com/webhook',
  event: 'deal.created',
  payload: dealData,
  secret: webhookSecret,
});

// Sync queue
await syncQueue.add('import-contacts', {
  source: 'hubspot',
  ventureId: 'venture-123',
  config: importConfig,
});
```

---

## Queue Monitoring

```typescript
import { QueueMonitor } from '@mcv/queue';

const monitor = new QueueMonitor(['email', 'notification', 'webhook']);

// Get queue stats
const stats = await monitor.getStats('email');
console.log('Waiting:', stats.waiting);
console.log('Active:', stats.active);
console.log('Completed:', stats.completed);
console.log('Failed:', stats.failed);

// Get throughput
const throughput = await monitor.getThroughput('email', '1h');
console.log('Jobs/minute:', throughput.perMinute);

// Health check
const health = await monitor.healthCheck();
console.log('Healthy:', health.isHealthy);
console.log('Issues:', health.issues);
```

---

## Environment Variables

```bash
# Redis connection
QUEUE_REDIS_HOST=localhost
QUEUE_REDIS_PORT=6379
QUEUE_REDIS_PASSWORD=
QUEUE_REDIS_DB=1

# Worker settings
QUEUE_WORKER_CONCURRENCY=5
QUEUE_DEFAULT_ATTEMPTS=3
QUEUE_DEFAULT_BACKOFF=exponential
QUEUE_DEFAULT_TIMEOUT=30000

# Monitoring
QUEUE_METRICS_ENABLED=true
QUEUE_DEAD_LETTER_ENABLED=true
```

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| bullmq | ^5.x | Queue implementation |
| ioredis | ^5.x | Redis client |
| cron-parser | ^4.x | Cron pattern parsing |

---

*@mcv/fabric/queue — Distributed Job Queue Module*
