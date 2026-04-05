# @mcv/fabric/events — Event Bus Module

**Parent Package:** @mcv/fabric  
**Tier:** 2 (Infrastructure Services)  
**Classification:** INTERNAL  
**Last Updated:** February 8, 2026

---

## Purpose

The `events` module provides a typed event bus for the MCV ecosystem. It enables decoupled communication between modules through domain events, supports both synchronous and asynchronous event handling, and integrates with the audit and realtime systems for observability.

**Cross-module communication without tight coupling flows through this module.**

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// EVENT BUS
// ═══════════════════════════════════════════════════════════════════════════════

export { 
  eventBus,             // Default event bus instance
  createEventBus,       // Factory function
} from './bus';

// Event operations
export { 
  emit,                 // Emit event (fire-and-forget)
  emitAsync,            // Emit and wait for handlers
  on,                   // Subscribe to event
  once,                 // Subscribe once
  off,                  // Unsubscribe
} from './operations';

// ═══════════════════════════════════════════════════════════════════════════════
// EVENT SOURCING
// ═══════════════════════════════════════════════════════════════════════════════

export { EventStore } from './store/event-store';
export { EventStream } from './store/event-stream';
export { Aggregate } from './sourcing/aggregate';
export { Projection } from './sourcing/projection';

// ═══════════════════════════════════════════════════════════════════════════════
// DECORATORS
// ═══════════════════════════════════════════════════════════════════════════════

export { EventHandler } from './decorators/event-handler';
export { Saga } from './decorators/saga';

// ═══════════════════════════════════════════════════════════════════════════════
// DOMAIN EVENTS (Pre-defined)
// ═══════════════════════════════════════════════════════════════════════════════

export * from './domain/auth';
export * from './domain/users';
export * from './domain/deals';
export * from './domain/contacts';
export * from './domain/billing';
export * from './domain/integrations';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  Event,
  EventType,
  EventPayload,
  EventHandler,
  EventSubscription,
  EventBusConfig,
  EventMetadata,
  DomainEvent,
} from './types';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           EVENT BUS ARCHITECTURE                                 │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                           EVENT PRODUCERS                                    │ │
│  │                                                                              │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │ │
│  │  │    Auth     │  │    CRM      │  │   Billing   │  │ Integrations│        │ │
│  │  │   Module    │  │   Module    │  │   Module    │  │   Module    │        │ │
│  │  │             │  │             │  │             │  │             │        │ │
│  │  │ user.login  │  │ deal.won    │  │invoice.paid │  │ webhook.recv│        │ │
│  │  │ mfa.enabled │  │ deal.lost   │  │sub.renewed  │  │ sync.done   │        │ │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │ │
│  │         │                │                │                │                │ │
│  │         └────────────────┼────────────────┼────────────────┘                │ │
│  │                          │                │                                  │ │
│  │                          ▼                ▼                                  │ │
│  │                 ┌────────────────────────────────────┐                      │ │
│  │                 │          emit(event)               │                      │ │
│  │                 └────────────────────────────────────┘                      │ │
│  │                                    │                                         │ │
│  └────────────────────────────────────┼─────────────────────────────────────────┘ │
│                                       │                                           │
│  ┌────────────────────────────────────▼─────────────────────────────────────────┐ │
│  │                              EVENT BUS                                        │ │
│  │                                                                               │ │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │                         Handler Registry                                 │ │ │
│  │  │                                                                          │ │ │
│  │  │   'user.login'     → [notifyHandler, auditHandler, analyticsHandler]    │ │ │
│  │  │   'deal.won'       → [celebrationHandler, commissionHandler]            │ │ │
│  │  │   'invoice.paid'   → [receiptHandler, revenueHandler]                   │ │ │
│  │  │   '*'              → [globalAuditHandler]                               │ │ │
│  │  │                                                                          │ │ │
│  │  └─────────────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                               │ │
│  │  ┌────────────────────────┐  ┌────────────────────────┐                     │ │
│  │  │    Sync Handlers       │  │    Async Handlers      │                     │ │
│  │  │    (blocking)          │  │    (background)        │                     │ │
│  │  │                        │  │                        │                     │ │
│  │  │   - Validation         │  │   - Notifications      │                     │ │
│  │  │   - Cache invalidation │  │   - Emails             │                     │ │
│  │  │   - Real-time push     │  │   - Analytics          │                     │ │
│  │  └────────────────────────┘  └────────────────────────┘                     │ │
│  │                                                                               │ │
│  └───────────────────────────────────────────────────────────────────────────────┘ │
│                                       │                                           │
│  ┌────────────────────────────────────┼─────────────────────────────────────────┐ │
│  │                           EVENT CONSUMERS                                     │ │
│  │                                    │                                          │ │
│  │  ┌─────────────┐  ┌────────────────▼──────────────┐  ┌─────────────┐         │ │
│  │  │   Audit     │  │       Notifications          │  │  Analytics  │         │ │
│  │  │   System    │  │         Module               │  │   Module    │         │ │
│  │  │             │  │                              │  │             │         │ │
│  │  │  Log all    │  │  Send email on deal.won      │  │  Track      │         │ │
│  │  │  events     │  │  Push on new message         │  │  metrics    │         │ │
│  │  └─────────────┘  └──────────────────────────────┘  └─────────────┘         │ │
│  │                                                                               │ │
│  └───────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Interfaces

### Event

```typescript
interface Event<T extends string = string, P = unknown> {
  // Identity
  id: string;                           // Unique event ID
  type: T;                              // Event type (e.g., 'user.login')
  
  // Payload
  payload: P;                           // Event-specific data
  
  // Metadata
  metadata: EventMetadata;
  
  // Timestamps
  timestamp: Date;
  occurredAt: Date;                     // When the event happened
}

interface EventMetadata {
  // Source
  source: string;                       // Originating module
  version: string;                      // Event schema version
  
  // Context
  correlationId?: string;               // Request/trace correlation
  causationId?: string;                 // Causing event ID
  
  // Actor
  userId?: string;                      // Acting user
  ventureId?: string;                   // Venture context
  sessionId?: string;                   // Session context
  
  // Replay
  isReplay?: boolean;                   // Is this a replayed event?
}
```

### DomainEvent

```typescript
// Base type for domain events with proper typing
interface DomainEvent<T extends string, P> extends Event<T, P> {
  // Aggregate info
  aggregateType: string;                // e.g., 'Deal', 'User'
  aggregateId: string;                  // Entity ID
  aggregateVersion: number;             // For optimistic concurrency
}
```

### EventHandler

```typescript
type EventHandler<E extends Event = Event> = (event: E) => void | Promise<void>;

interface EventSubscription {
  unsubscribe(): void;
}
```

---

## Domain Events

### Authentication Events

```typescript
// user.login
interface UserLoginEvent {
  userId: string;
  email: string;
  method: 'password' | 'passkey' | 'oauth' | 'magic_link';
  ipAddress: string;
  userAgent: string;
  mfaUsed: boolean;
}

// user.logout
interface UserLogoutEvent {
  userId: string;
  sessionId: string;
  reason: 'user_initiated' | 'session_expired' | 'forced';
}

// user.mfa.enabled
interface UserMfaEnabledEvent {
  userId: string;
  method: 'totp' | 'sms' | 'email';
}

// user.password.changed
interface UserPasswordChangedEvent {
  userId: string;
  source: 'self' | 'admin' | 'reset';
}
```

### CRM Events

```typescript
// deal.created
interface DealCreatedEvent {
  dealId: string;
  name: string;
  value: number;
  currency: string;
  pipelineId: string;
  stageId: string;
  ownerId: string;
  contactIds: string[];
}

// deal.stage.changed
interface DealStageChangedEvent {
  dealId: string;
  previousStageId: string;
  newStageId: string;
  movedBy: string;
  reason?: string;
}

// deal.won
interface DealWonEvent {
  dealId: string;
  value: number;
  currency: string;
  ownerId: string;
  closedAt: Date;
  daysInPipeline: number;
}

// deal.lost
interface DealLostEvent {
  dealId: string;
  value: number;
  lossReason?: string;
  competitorId?: string;
  ownerId: string;
}
```

### Billing Events

```typescript
// invoice.created
interface InvoiceCreatedEvent {
  invoiceId: string;
  ventureId: string;
  customerId: string;
  amount: number;
  currency: string;
  dueDate: Date;
}

// invoice.paid
interface InvoicePaidEvent {
  invoiceId: string;
  amount: number;
  paidAt: Date;
  paymentMethod: string;
  transactionId: string;
}

// subscription.renewed
interface SubscriptionRenewedEvent {
  subscriptionId: string;
  customerId: string;
  planId: string;
  amount: number;
  periodStart: Date;
  periodEnd: Date;
}
```

---

## Usage Examples

### Basic Event Operations

```typescript
import { eventBus, emit, on, once } from '@mcv/events';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 1: Subscribe to events
// ═══════════════════════════════════════════════════════════════════════════════

// Subscribe to specific event type
const subscription = on('deal.won', async (event) => {
  console.log(`Deal ${event.payload.dealId} won for ${event.payload.value}`);
  await notificationService.send({
    templateSlug: 'deal-won',
    userId: event.payload.ownerId,
    variables: event.payload,
  });
});

// Subscribe to multiple event types
on(['deal.won', 'deal.lost'], (event) => {
  analyticsService.track('deal_outcome', {
    dealId: event.payload.dealId,
    outcome: event.type === 'deal.won' ? 'won' : 'lost',
  });
});

// Subscribe once
once('user.first_login', (event) => {
  // Only fires for the first matching event
  sendWelcomeSequence(event.payload.userId);
});

// Wildcard subscription
on('deal.*', (event) => {
  console.log(`Deal event: ${event.type}`);
});

// Global subscription (all events)
on('*', (event) => {
  auditService.log(event);
});

// Unsubscribe
subscription.unsubscribe();

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 2: Emit events
// ═══════════════════════════════════════════════════════════════════════════════

// Fire-and-forget
emit('deal.won', {
  dealId: 'deal-123',
  name: 'Enterprise Contract',
  value: 50000,
  currency: 'USD',
  ownerId: 'user-456',
  closedAt: new Date(),
  daysInPipeline: 45,
});

// Emit with metadata
emit('user.login', {
  userId: 'user-123',
  email: 'john@example.com',
  method: 'password',
  ipAddress: '192.168.1.1',
  userAgent: 'Chrome/120',
  mfaUsed: true,
}, {
  correlationId: requestId,
  sessionId: session.id,
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 3: Async emit (wait for handlers)
// ═══════════════════════════════════════════════════════════════════════════════

import { emitAsync } from '@mcv/events';

// Wait for all handlers to complete
await emitAsync('order.created', orderData);
// All handlers have finished

// Useful when you need to ensure side effects complete
try {
  await emitAsync('payment.processed', paymentData);
  console.log('All payment handlers completed');
} catch (error) {
  console.error('A handler failed:', error);
}
```

### Event Handler Decorator

```typescript
import { EventHandler } from '@mcv/events';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 4: Handler class with decorator
// ═══════════════════════════════════════════════════════════════════════════════

class NotificationHandlers {
  constructor(
    private notificationService: NotificationService,
    private realtimeServer: RealtimeServer,
  ) {}
  
  @EventHandler('deal.won')
  async onDealWon(event: Event<'deal.won', DealWonEvent>) {
    await this.notificationService.send({
      templateSlug: 'deal-won-celebration',
      userId: event.payload.ownerId,
      ventureId: event.metadata.ventureId!,
      variables: {
        dealName: event.payload.name,
        value: formatCurrency(event.payload.value, event.payload.currency),
      },
      priority: 'high',
    });
  }
  
  @EventHandler('user.login')
  async onUserLogin(event: Event<'user.login', UserLoginEvent>) {
    // Push real-time event to all user's sessions
    this.realtimeServer.sendEvent(
      { userId: event.payload.userId },
      'notification:new',
      {
        id: crypto.randomUUID(),
        title: 'New Login Detected',
        body: `Login from ${event.payload.userAgent}`,
        category: 'security',
        priority: 'normal',
        createdAt: new Date(),
      }
    );
  }
  
  @EventHandler(['deal.created', 'deal.updated', 'deal.deleted'])
  async onDealChange(event: Event) {
    // Invalidate deal caches
    await cache.invalidateTag(`deal:${event.payload.dealId}`);
  }
}
```

### Saga Pattern

```typescript
import { Saga, eventBus } from '@mcv/events';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 5: Multi-step saga
// ═══════════════════════════════════════════════════════════════════════════════

@Saga()
class NewCustomerSaga {
  // Saga starts when customer is created
  @SagaStart('customer.created')
  async onCustomerCreated(event: Event<'customer.created'>) {
    const { customerId, email, name } = event.payload;
    
    // Step 1: Create default workspace
    await workspaceService.create({
      ownerId: customerId,
      name: `${name}'s Workspace`,
    });
    
    // Emit intermediate event
    emit('saga.customer.workspace_created', { customerId });
  }
  
  @SagaStep('saga.customer.workspace_created')
  async onWorkspaceCreated(event: Event) {
    const { customerId } = event.payload;
    
    // Step 2: Send welcome email
    await notificationService.send({
      templateSlug: 'welcome',
      userId: customerId,
      variables: { /* ... */ },
    });
    
    emit('saga.customer.welcome_sent', { customerId });
  }
  
  @SagaStep('saga.customer.welcome_sent')
  async onWelcomeSent(event: Event) {
    const { customerId } = event.payload;
    
    // Step 3: Schedule onboarding sequence
    await schedulingService.schedule({
      type: 'onboarding_drip',
      targetId: customerId,
      startsAt: addDays(new Date(), 1),
    });
    
    // Saga complete
    emit('saga.customer.onboarding_complete', { customerId });
  }
}
```

### Event Sourcing

```typescript
import { EventStore, Aggregate } from '@mcv/events';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 6: Event-sourced aggregate
// ═══════════════════════════════════════════════════════════════════════════════

class DealAggregate extends Aggregate {
  private status: 'open' | 'won' | 'lost' = 'open';
  private value: number = 0;
  
  // Command handlers
  create(data: CreateDealCommand) {
    this.apply('DealCreated', {
      dealId: this.id,
      ...data,
    });
  }
  
  win(closedAt: Date) {
    if (this.status !== 'open') {
      throw new Error('Cannot win a closed deal');
    }
    
    this.apply('DealWon', {
      dealId: this.id,
      value: this.value,
      closedAt,
    });
  }
  
  // Event handlers (rebuild state)
  onDealCreated(event: DomainEvent<'DealCreated'>) {
    this.value = event.payload.value;
  }
  
  onDealWon(event: DomainEvent<'DealWon'>) {
    this.status = 'won';
  }
}

// Usage
const deal = await eventStore.load(DealAggregate, dealId);
deal.win(new Date());
await eventStore.save(deal);
```

---

## Event Bus Configuration

```typescript
interface EventBusConfig {
  // Execution mode
  mode: 'sync' | 'async' | 'mixed';
  
  // Error handling
  onError: (error: Error, event: Event, handler: EventHandler) => void;
  continueOnError: boolean;             // Continue with other handlers on error
  
  // Retry
  retry: {
    enabled: boolean;
    maxAttempts: number;
    backoffMs: number;
  };
  
  // Metrics
  metrics: {
    enabled: boolean;
    collectHistograms: boolean;
  };
  
  // Dead letter
  deadLetter: {
    enabled: boolean;
    store: 'redis' | 'postgres';
  };
}
```

---

## Environment Variables

```bash
# Event bus configuration
EVENTS_MODE=mixed
EVENTS_CONTINUE_ON_ERROR=true
EVENTS_RETRY_ENABLED=true
EVENTS_RETRY_MAX_ATTEMPTS=3
EVENTS_DEAD_LETTER_ENABLED=true
```

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| eventemitter3 | ^5.x | Event emitter base |
| uuid | ^9.x | Event ID generation |
| @mcv/db | workspace | Event store persistence |

---

*@mcv/fabric/events — Domain Event Bus Module*
