# @mcv/fabric/notifications — Notification Module

**Parent Package:** @mcv/fabric  
**Tier:** 2 (Infrastructure Services)  
**Classification:** INTERNAL  
**Last Updated:** February 8, 2026

---

## Purpose

The `notifications` module provides multi-channel notification infrastructure for the MCV ecosystem. It handles templated notifications across email, SMS, push, in-app, WhatsApp, Discord, Slack, and webhooks. Features include user preferences, quiet hours, deduplication, batching, and delivery tracking.

**Every user-facing notification flows through this module.**

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// SERVER SERVICES
// ═══════════════════════════════════════════════════════════════════════════════

// Core notification operations
export { notificationService } from './server/services/notification-service';
export { 
  send, 
  sendBulk, 
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
} from './server/services/notification-service';

// Template engine
export { templateEngine } from './server/services/template-engine';

// Routing engine
export { routingEngine } from './server/services/routing-engine';

// Preference management
export { 
  preferenceService,
  getPreferences,
  updatePreferences,
  unsubscribe,
} from './server/services/preference-service';

// Email service
export { emailService } from './server/services/email-service';

// ═══════════════════════════════════════════════════════════════════════════════
// PROVIDERS
// ═══════════════════════════════════════════════════════════════════════════════

export { getProvider, providerFactory } from './server/providers/provider-factory';
export { EmailProvider } from './server/providers/email-provider';
export { SendGridProvider } from './server/providers/email-sendgrid';
export { TwilioSmsProvider } from './server/providers/sms-twilio';
export { FirebasePushProvider } from './server/providers/push-firebase';
export { InAppProvider } from './server/providers/in-app';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

export { useNotifications } from './client/hooks/use-notifications';
export { useNotificationPreferences } from './client/hooks/use-notification-preferences';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export { 
  NOTIFICATION_CHANNELS, 
  DEFAULT_ENABLED_CHANNELS,
  MANDATORY_CHANNELS,
  TRACKABLE_CHANNELS,
} from './constants/channels';
export { NOTIFICATION_CATEGORIES } from './constants/categories';
export { NOTIFICATION_PRIORITIES } from './constants/priorities';

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════════

export { baseTemplate } from './templates/base';
export { welcomeTemplate } from './templates/welcome';
export { verificationTemplate } from './templates/verification';
export { passwordResetTemplate } from './templates/password-reset';
export { mfaEnabledTemplate } from './templates/mfa-enabled';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  // Database types
  NotificationChannel,
  NotificationPriority,
  NotificationCategory,
  NotificationStatus,
  Notification,
  NotificationTemplate,
  NotificationDelivery,
  UserNotificationPreference,
  UserDeviceToken,
  
  // Service types
  NotificationPayload,
  BulkNotificationPayload,
  NotificationResult,
  BulkNotificationResult,
  RoutingDecision,
  RenderContext,
  PaginatedNotifications,
  NotificationWithReadStatus,
  
  // Provider types
  DeliveryProvider,
  ProviderMessage,
  DeliveryResult,
  
  // Preference types
  UpdatePreferencesInput,
  RegisterDeviceInput,
} from './types';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       NOTIFICATION MODULE ARCHITECTURE                           │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                            ENTRY POINTS                                      │ │
│  │                                                                              │ │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │ │
│  │  │  notificationSvc │  │   Event Handler  │  │   Scheduled Job  │          │ │
│  │  │     .send()      │  │  (Triggers)      │  │   (Digests)      │          │ │
│  │  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘          │ │
│  │           │                     │                     │                     │ │
│  │           └─────────────────────┼─────────────────────┘                     │ │
│  │                                 │                                            │ │
│  └─────────────────────────────────┼────────────────────────────────────────────┘ │
│                                    │                                              │
│  ┌─────────────────────────────────▼────────────────────────────────────────────┐ │
│  │                         PROCESSING PIPELINE                                   │ │
│  │                                                                               │ │
│  │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐      │ │
│  │  │    1.       │   │    2.       │   │    3.       │   │    4.       │      │ │
│  │  │ Deduplication│──▶│  Template   │──▶│   Routing   │──▶│  Rendering  │      │ │
│  │  │   Check     │   │   Lookup    │   │   Engine    │   │   Engine    │      │ │
│  │  │             │   │             │   │             │   │             │      │ │
│  │  │ Check for   │   │ Find active │   │ Determine   │   │ Render for  │      │ │
│  │  │ recent      │   │ template by │   │ which       │   │ each        │      │ │
│  │  │ duplicates  │   │ slug        │   │ channels    │   │ channel     │      │ │
│  │  └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘      │ │
│  │                                                                               │ │
│  │                                                                               │ │
│  │  ┌───────────────────────────────────────────────────────────────────────┐   │ │
│  │  │                          Routing Engine Logic                          │   │ │
│  │  │                                                                        │   │ │
│  │  │  For each channel:                                                     │   │ │
│  │  │    1. Check user preference (enabled?)                                 │   │ │
│  │  │    2. Check category preference (frequency: realtime/daily/disabled)   │   │ │
│  │  │    3. Check quiet hours (defer if active)                              │   │ │
│  │  │    4. Check frequency cap (rate limiting)                              │   │ │
│  │  │    5. Check delivery address (email verified? phone valid?)            │   │ │
│  │  │                                                                        │   │ │
│  │  └───────────────────────────────────────────────────────────────────────┘   │ │
│  │                                                                               │ │
│  └───────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                     │
│  ┌───────────────────────────────────────────────────────────────────────────────┐ │
│  │                           DELIVERY LAYER                                       │ │
│  │                                                                                │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │ │
│  │  │  Email   │ │   SMS    │ │   Push   │ │  In-App  │ │ WhatsApp │            │ │
│  │  │          │ │          │ │          │ │          │ │          │            │ │
│  │  │ SendGrid │ │  Twilio  │ │ Firebase │ │ WebSocket│ │  Twilio  │            │ │
│  │  │ Resend   │ │ MessageB │ │   APNS   │ │ Database │ │  360dlg  │            │ │
│  │  │ AWS SES  │ │          │ │          │ │          │ │          │            │ │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘            │ │
│  │       │            │            │            │            │                   │ │
│  │       └────────────┴────────────┴────────────┴────────────┘                   │ │
│  │                                 │                                              │ │
│  │                     ┌───────────▼───────────┐                                 │ │
│  │                     │   Delivery Tracking   │                                 │ │
│  │                     │                       │                                 │ │
│  │                     │  • sent/delivered     │                                 │ │
│  │                     │  • opened/clicked     │                                 │ │
│  │                     │  • failed/bounced     │                                 │ │
│  │                     └───────────────────────┘                                 │ │
│  │                                                                                │ │
│  └────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐ │
│  │                              DATABASE LAYER                                     │ │
│  │                                                                                 │ │
│  │  ┌─────────────┐ ┌───────────────┐ ┌────────────────┐ ┌───────────────────┐   │ │
│  │  │notifications│ │notification   │ │user_notif      │ │user_device        │   │ │
│  │  │             │ │_deliveries    │ │_preferences    │ │_tokens            │   │ │
│  │  │ • template  │ │               │ │                │ │                   │   │ │
│  │  │ • data      │ │ • channel     │ │ • channels     │ │ • platform        │   │ │
│  │  │ • channels  │ │ • status      │ │ • quiet hours  │ │ • token           │   │ │
│  │  │ • status    │ │ • provider    │ │ • categories   │ │ • active          │   │ │
│  │  └─────────────┘ └───────────────┘ └────────────────┘ └───────────────────┘   │ │
│  │                                                                                 │ │
│  └─────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                       │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Notification Channels

| Channel | Provider | Rich Content | Tracking | Verification |
|---------|----------|--------------|----------|--------------|
| `email` | SendGrid/SES | ✅ HTML, images | Opens, clicks | Required |
| `sms` | Twilio | ❌ Text only (160 chars) | Delivery status | Required |
| `push` | Firebase/APNS | ✅ Title, body, image | Opens | Token required |
| `in_app` | Internal | ✅ Full rich content | Opens | None |
| `whatsapp` | Twilio/360dialog | ✅ Templates, media | Delivery, read | Opt-in required |
| `discord` | Discord API | ✅ Embeds | None | Webhook URL |
| `slack` | Slack API | ✅ Blocks | None | OAuth |
| `webhook` | HTTP POST | ✅ JSON payload | Response code | URL config |

---

## Core Interfaces

### NotificationPayload

```typescript
interface NotificationPayload {
  // Required
  templateSlug: string;                 // Template identifier (e.g., 'welcome')
  userId: string;                       // Recipient user ID
  ventureId: string;                    // Venture context
  variables: Record<string, unknown>;   // Template variables
  
  // Optional routing
  priority?: NotificationPriority;      // 'low' | 'normal' | 'high' | 'urgent'
  channels?: NotificationChannel[];     // Override template channels
  
  // Scheduling
  scheduledFor?: Date;                  // Send at specific time
  expiresAt?: Date;                     // Don't send after this time
  
  // Deduplication
  deduplicationKey?: string;            // Unique key for dedup
  deduplicationWindow?: number;         // Seconds to check for duplicates
  
  // Tracing
  sourceModule?: string;                // Originating module (e.g., 'crm')
  sourceEventId?: string;               // Original event ID
  sourceEventType?: string;             // Event type (e.g., 'deal.won')
  correlationId?: string;               // For tracking related notifications
}
```

### NotificationResult

```typescript
interface NotificationResult {
  success: boolean;
  notificationId: string | null;        // Created notification ID
  reason?: string;                      // Failure reason if !success
  channels?: NotificationChannel[];     // Channels notification was sent to
  routingDecisions?: RoutingDecision[]; // Per-channel routing decisions
  batched?: boolean;                    // Was notification batched?
  batchId?: string;                     // Batch ID if batched
  scheduledFor?: Date;                  // Scheduled time if deferred
}
```

### RoutingDecision

```typescript
interface RoutingDecision {
  channel: NotificationChannel;
  shouldSend: boolean;                  // Should we send on this channel?
  reason?: string;                      // Why we're sending/not sending
  address?: string;                     // Delivery address (email, phone)
  provider?: string;                    // Selected provider name
  defer?: boolean;                      // Defer due to quiet hours?
  deferUntil?: Date;                    // When to send if deferred
}
```

### NotificationTemplate

```typescript
interface NotificationTemplate {
  id: string;
  ventureId: string | null;             // null = global template
  
  // Identity
  slug: string;                         // Unique identifier
  name: string;                         // Display name
  description: string | null;           // Description
  version: number;                      // Template version
  
  // Classification
  category: NotificationCategory;       // 'transactional' | 'marketing' | etc.
  priority: NotificationPriority;       // Default priority
  
  // Content
  channels: NotificationChannel[];      // Enabled channels
  content: TemplateContent;             // Per-channel content
  
  // Localization
  supportedLocales: string[];           // ['en', 'es', 'fr']
  defaultLocale: string;                // 'en'
  localizedContent: LocalizedContent[]; // Per-locale overrides
  
  // Variables
  variables: TemplateVariable[];        // Expected variables
  
  // Status
  isActive: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

### UserNotificationPreference

```typescript
interface UserNotificationPreference {
  id: string;
  userId: string;
  ventureId: string | null;             // null = global preference
  
  // Channel preferences
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  whatsappEnabled: boolean;
  discordEnabled: boolean;
  slackEnabled: boolean;
  
  // Quiet hours
  quietHoursEnabled: boolean;
  quietHoursStart: string | null;       // '22:00'
  quietHoursEnd: string | null;         // '08:00'
  quietHoursTimezone: string | null;    // 'America/New_York'
  quietHoursDays: number[] | null;      // [0, 1, 2, 3, 4, 5, 6] (Sun-Sat)
  
  // Frequency caps
  emailFrequencyCap: number | null;     // Max per hour
  smsFrequencyCap: number | null;
  pushFrequencyCap: number | null;
  
  // Digest settings
  digestEnabled: boolean;
  digestFrequency: 'daily' | 'weekly' | null;
  digestTime: string | null;            // '09:00'
  digestTimezone: string | null;
  digestCategories: string[] | null;    // Categories to include in digest
  
  // Localization
  preferredLanguage: string | null;
  
  // Per-category preferences
  categoryPreferences: CategoryPreference[] | null;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

interface CategoryPreference {
  category: string;
  channels: {
    email: boolean;
    sms: boolean;
    push: boolean;
    inApp: boolean;
  };
  frequency: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'disabled';
}
```

---

## Database Schema

### notifications Table

```typescript
export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // ═══════════════════════════════════════════════════════════════════════
    // RECIPIENTS
    // ═══════════════════════════════════════════════════════════════════════
    
    userId: uuid('user_id').references(() => users.id, {
      onDelete: 'cascade',
    }).notNull(),
    ventureId: uuid('venture_id').references(() => ventures.id, {
      onDelete: 'cascade',
    }).notNull(),

    // ═══════════════════════════════════════════════════════════════════════
    // TEMPLATE
    // ═══════════════════════════════════════════════════════════════════════
    
    templateId: uuid('template_id').references(() => notificationTemplates.id, {
      onDelete: 'set null',
    }),
    templateSlug: text('template_slug'),
    templateVersion: integer('template_version'),

    // ═══════════════════════════════════════════════════════════════════════
    // CLASSIFICATION
    // ═══════════════════════════════════════════════════════════════════════
    
    category: notificationCategoryEnum('category').notNull(),
    priority: notificationPriorityEnum('priority').default('normal'),

    // ═══════════════════════════════════════════════════════════════════════
    // CONTENT
    // ═══════════════════════════════════════════════════════════════════════
    
    title: text('title'),
    body: text('body'),
    data: jsonb('data').$type<Record<string, unknown>>(),
    actionUrl: text('action_url'),
    imageUrl: text('image_url'),

    // ═══════════════════════════════════════════════════════════════════════
    // ROUTING
    // ═══════════════════════════════════════════════════════════════════════
    
    channels: jsonb('channels').$type<NotificationChannel[]>().notNull(),

    // ═══════════════════════════════════════════════════════════════════════
    // SOURCE CONTEXT
    // ═══════════════════════════════════════════════════════════════════════
    
    sourceModule: text('source_module'),
    sourceEventId: text('source_event_id'),
    sourceEventType: text('source_event_type'),
    correlationId: uuid('correlation_id'),

    // ═══════════════════════════════════════════════════════════════════════
    // DEDUPLICATION
    // ═══════════════════════════════════════════════════════════════════════
    
    deduplicationKey: text('deduplication_key'),
    deduplicationWindow: integer('deduplication_window'),

    // ═══════════════════════════════════════════════════════════════════════
    // SCHEDULING
    // ═══════════════════════════════════════════════════════════════════════
    
    scheduledFor: timestamp('scheduled_for', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),

    // ═══════════════════════════════════════════════════════════════════════
    // BATCHING
    // ═══════════════════════════════════════════════════════════════════════
    
    batchId: uuid('batch_id'),
    batchPosition: integer('batch_position'),

    // ═══════════════════════════════════════════════════════════════════════
    // STATUS
    // ═══════════════════════════════════════════════════════════════════════
    
    status: notificationStatusEnum('status').default('pending'),

    // ═══════════════════════════════════════════════════════════════════════
    // TIMESTAMPS
    // ═══════════════════════════════════════════════════════════════════════
    
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => [
    index('notification_user_idx').on(table.userId),
    index('notification_venture_idx').on(table.ventureId),
    index('notification_status_idx').on(table.status),
    index('notification_scheduled_idx').on(table.scheduledFor),
    index('notification_dedupe_idx').on(table.deduplicationKey, table.userId),
    index('notification_created_at_idx').on(table.createdAt),
    index('notification_user_created_idx').on(table.userId, table.createdAt),
  ]
);
```

### notification_deliveries Table

```typescript
export const notificationDeliveries = pgTable(
  'notification_deliveries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    
    // Reference
    notificationId: uuid('notification_id')
      .references(() => notifications.id, { onDelete: 'cascade' })
      .notNull(),
    
    // Channel info
    channel: notificationChannelEnum('channel').notNull(),
    provider: text('provider').notNull(),
    
    // Recipient
    recipientAddress: text('recipient_address'),
    
    // Content
    renderedContent: jsonb('rendered_content').$type<RenderedContent>(),
    
    // Status
    status: notificationStatusEnum('status').default('pending').notNull(),
    
    // Delivery tracking
    providerMessageId: text('provider_message_id'),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    openedAt: timestamp('opened_at', { withTimezone: true }),
    clickedAt: timestamp('clicked_at', { withTimezone: true }),
    
    // Failure info
    errorMessage: text('error_message'),
    errorCode: text('error_code'),
    retryCount: integer('retry_count').default(0),
    nextRetryAt: timestamp('next_retry_at', { withTimezone: true }),
    
    // Cost tracking
    costUnits: integer('cost_units'),
    
    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('delivery_notification_idx').on(table.notificationId),
    index('delivery_channel_idx').on(table.channel),
    index('delivery_status_idx').on(table.status),
    index('delivery_provider_message_idx').on(table.providerMessageId),
  ]
);
```

---

## Usage Examples

### Sending Notifications

```typescript
import { notificationService } from '@mcv/notifications/server';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 1: Simple transactional notification
// ═══════════════════════════════════════════════════════════════════════════════

const result = await notificationService.send({
  templateSlug: 'welcome',
  userId: 'user-uuid',
  ventureId: 'venture-uuid',
  variables: {
    firstName: 'John',
    loginUrl: 'https://app.mcv.one/login',
  },
});

if (result.success) {
  console.log('Notification sent:', result.notificationId);
  console.log('Channels:', result.channels);
} else {
  console.error('Failed:', result.reason);
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 2: High-priority notification with specific channels
// ═══════════════════════════════════════════════════════════════════════════════

await notificationService.send({
  templateSlug: 'security-alert',
  userId: user.id,
  ventureId: venture.id,
  variables: {
    alertType: 'New device login',
    device: 'Chrome on Windows',
    location: 'New York, USA',
    ipAddress: '203.0.113.42',
    timestamp: new Date().toISOString(),
  },
  priority: 'urgent',
  channels: ['email', 'push', 'in_app'], // Ensure all critical channels
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 3: Scheduled notification
// ═══════════════════════════════════════════════════════════════════════════════

await notificationService.send({
  templateSlug: 'appointment-reminder',
  userId: user.id,
  ventureId: venture.id,
  variables: {
    appointmentTitle: 'Meeting with John',
    appointmentTime: '2:00 PM',
    appointmentDate: 'February 10, 2026',
  },
  scheduledFor: new Date('2026-02-10T13:00:00Z'), // 1 hour before
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 4: Notification with deduplication
// ═══════════════════════════════════════════════════════════════════════════════

await notificationService.send({
  templateSlug: 'deal-stage-changed',
  userId: salesRep.id,
  ventureId: venture.id,
  variables: {
    dealName: deal.name,
    newStage: 'Proposal',
    dealValue: formatCurrency(deal.value),
  },
  deduplicationKey: `deal-${deal.id}-stage-${newStage}`,
  deduplicationWindow: 300, // 5 minutes
  sourceModule: 'crm',
  sourceEventType: 'deal.stage.changed',
  sourceEventId: event.id,
});
```

### Bulk Notifications

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 5: Bulk notification to multiple users
// ═══════════════════════════════════════════════════════════════════════════════

const result = await notificationService.sendBulk({
  templateSlug: 'product-announcement',
  ventureId: venture.id,
  recipients: users.map(user => ({
    userId: user.id,
    variables: {
      firstName: user.firstName,
      productName: 'AI Assistant 2.0',
    },
  })),
  commonVariables: {
    launchDate: 'February 15, 2026',
    learnMoreUrl: 'https://mcv.one/ai-assistant',
  },
  priority: 'normal',
});

console.log(`Sent: ${result.sent}/${result.total}`);
console.log(`Failed: ${result.failed}`);
console.log(`Batched: ${result.batched}`);

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 6: Per-recipient customization
// ═══════════════════════════════════════════════════════════════════════════════

await notificationService.sendBulk({
  templateSlug: 'deal-assigned',
  ventureId: venture.id,
  recipients: assignments.map(a => ({
    userId: a.assigneeId,
    variables: {
      dealName: a.deal.name,
      dealValue: formatCurrency(a.deal.value),
      assignedBy: a.assigner.name,
    },
    channels: a.urgent ? ['email', 'push', 'sms'] : ['email', 'in_app'],
  })),
});
```

### In-App Notifications

```typescript
import { getUserNotifications, markAsRead, getUnreadCount } from '@mcv/notifications/server';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 7: Get user's in-app notifications
// ═══════════════════════════════════════════════════════════════════════════════

const notifications = await notificationService.getUserNotifications(userId, {
  limit: 20,
  unreadOnly: false,
  categories: ['transactional', 'system'],
  ventureId: venture.id,
});

for (const notification of notifications.items) {
  console.log(`${notification.isRead ? '✓' : '●'} ${notification.title}`);
  console.log(`  ${notification.body}`);
  console.log(`  ${notification.createdAt}`);
}

if (notifications.hasMore) {
  // Fetch next page
  const nextPage = await notificationService.getUserNotifications(userId, {
    cursor: notifications.nextCursor,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 8: Mark notifications as read
// ═══════════════════════════════════════════════════════════════════════════════

// Mark specific notifications as read
await notificationService.markAsRead(userId, [
  'notification-1-uuid',
  'notification-2-uuid',
]);

// Mark all as read
await notificationService.markAllAsRead(userId, venture.id);

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 9: Get unread count (for badge)
// ═══════════════════════════════════════════════════════════════════════════════

const unreadCount = await notificationService.getUnreadCount(userId, venture.id);
// Returns: 5
```

### User Preferences

```typescript
import { preferenceService } from '@mcv/notifications/server';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 10: Get user preferences
// ═══════════════════════════════════════════════════════════════════════════════

const prefs = await preferenceService.getPreferences(userId, ventureId);

console.log('Email enabled:', prefs.emailEnabled);
console.log('Quiet hours:', prefs.quietHoursEnabled);
console.log('Category preferences:', prefs.categoryPreferences);

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 11: Update preferences
// ═══════════════════════════════════════════════════════════════════════════════

await preferenceService.updatePreferences(userId, ventureId, {
  // Channel preferences
  emailEnabled: true,
  smsEnabled: false, // User opts out of SMS
  pushEnabled: true,
  
  // Quiet hours
  quietHoursEnabled: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  quietHoursTimezone: 'America/New_York',
  quietHoursDays: [0, 1, 2, 3, 4, 5, 6], // All days
  
  // Digest
  digestEnabled: true,
  digestFrequency: 'daily',
  digestTime: '09:00',
  digestCategories: ['marketing', 'updates'],
  
  // Per-category preferences
  categoryPreferences: [
    {
      category: 'marketing',
      channels: { email: true, sms: false, push: false, inApp: true },
      frequency: 'daily',
    },
    {
      category: 'security',
      channels: { email: true, sms: true, push: true, inApp: true },
      frequency: 'realtime', // Always send immediately
    },
  ],
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 12: One-click unsubscribe
// ═══════════════════════════════════════════════════════════════════════════════

// Token from email footer link
await preferenceService.unsubscribe(unsubscribeToken, 'marketing');
// Disables marketing notifications for that user
```

### Device Token Management

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 13: Register device for push notifications
// ═══════════════════════════════════════════════════════════════════════════════

await notificationService.registerDevice(userId, {
  platform: 'ios',
  token: fcmToken,
  tokenType: 'fcm',
  deviceId: 'device-uuid',
  deviceName: 'iPhone 15 Pro',
  appVersion: '2.1.0',
  osVersion: '17.3',
  ventureId: venture.id,
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 14: Unregister device
// ═══════════════════════════════════════════════════════════════════════════════

await notificationService.unregisterDevice(userId, 'device-uuid');
```

### Client-Side Usage (React)

```tsx
import { useNotifications, useNotificationPreferences } from '@mcv/notifications/client';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 15: Notification bell component
// ═══════════════════════════════════════════════════════════════════════════════

function NotificationBell() {
  const { 
    notifications, 
    unreadCount, 
    isLoading,
    markAsRead,
    markAllAsRead,
    hasMore,
    loadMore,
  } = useNotifications();
  
  return (
    <Popover>
      <PopoverTrigger>
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-semibold">Notifications</h4>
          <Button variant="ghost" size="sm" onClick={markAllAsRead}>
            Mark all read
          </Button>
        </div>
        
        <ScrollArea className="h-96">
          {notifications.map(notification => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRead={() => markAsRead([notification.id])}
            />
          ))}
          
          {hasMore && (
            <Button variant="ghost" onClick={loadMore}>
              Load more
            </Button>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 16: Notification preferences panel
// ═══════════════════════════════════════════════════════════════════════════════

function NotificationPreferences() {
  const { preferences, updatePreferences, isLoading } = useNotificationPreferences();
  
  if (isLoading) return <Skeleton />;
  
  return (
    <div className="space-y-6">
      <section>
        <h3 className="font-semibold mb-4">Channel Preferences</h3>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Email</p>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              checked={preferences.emailEnabled}
              onCheckedChange={(checked) => 
                updatePreferences({ emailEnabled: checked })
              }
            />
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Push Notifications</p>
              <p className="text-sm text-muted-foreground">
                Browser and mobile push notifications
              </p>
            </div>
            <Switch
              checked={preferences.pushEnabled}
              onCheckedChange={(checked) => 
                updatePreferences({ pushEnabled: checked })
              }
            />
          </div>
        </div>
      </section>
      
      <section>
        <h3 className="font-semibold mb-4">Quiet Hours</h3>
        
        <div className="flex items-center gap-2 mb-4">
          <Switch
            checked={preferences.quietHoursEnabled}
            onCheckedChange={(checked) =>
              updatePreferences({ quietHoursEnabled: checked })
            }
          />
          <span>Enable quiet hours</span>
        </div>
        
        {preferences.quietHoursEnabled && (
          <div className="grid grid-cols-2 gap-4">
            <TimeInput
              label="Start time"
              value={preferences.quietHoursStart}
              onChange={(value) =>
                updatePreferences({ quietHoursStart: value })
              }
            />
            <TimeInput
              label="End time"
              value={preferences.quietHoursEnd}
              onChange={(value) =>
                updatePreferences({ quietHoursEnd: value })
              }
            />
          </div>
        )}
      </section>
    </div>
  );
}
```

---

## Template System

### Template Content Structure

```typescript
interface TemplateContent {
  email?: {
    subject: string;
    html: string;
    text?: string;
    preheader?: string;
  };
  sms?: {
    body: string;
  };
  push?: {
    title: string;
    body: string;
    icon?: string;
    image?: string;
    sound?: string;
    data?: Record<string, unknown>;
  };
  inApp?: {
    title: string;
    body: string;
    action?: { label: string; url: string };
    image?: string;
  };
}
```

### Template Variables

```typescript
// Standard variables available in all templates
interface StandardVariables {
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
  };
  venture: {
    id: string;
    name: string;
    domain?: string;
  };
  brand: {
    logoUrl?: string;
    primaryColor?: string;
  };
  unsubscribeUrl: string;
  preferencesUrl: string;
  currentYear: string;
}
```

---

## Performance Considerations

### Delivery Latency Targets

| Priority | Email | SMS | Push | In-App |
|----------|-------|-----|------|--------|
| Urgent | < 30s | < 10s | < 5s | < 1s |
| High | < 1m | < 30s | < 10s | < 2s |
| Normal | < 5m | < 1m | < 30s | < 5s |
| Low | < 15m | < 5m | < 1m | < 10s |

### Batching Strategy

- Low-priority notifications batch every 5 minutes
- Digest emails batch per user preference (daily/weekly)
- Bulk sends processed at 100 notifications/second

---

## Environment Variables

```bash
# Email providers
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@mcv.one
SENDGRID_FROM_NAME=MCV

# SMS provider
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_FROM_NUMBER=+1234567890

# Push notifications
FIREBASE_PROJECT_ID=mcv-production
FIREBASE_CREDENTIALS_PATH=/path/to/firebase-adminsdk.json

# Configuration
NOTIFICATION_DEFAULT_FROM_EMAIL=noreply@mcv.one
NOTIFICATION_DIGEST_CRON="0 9 * * *"
NOTIFICATION_BATCH_SIZE=100
```

---

## Audit Events

| Event | Category | Description |
|-------|----------|-------------|
| `notification.send` | system | Notification sent |
| `notification.delivered` | system | Delivery confirmed |
| `notification.failed` | system | Delivery failed |
| `notification.opened` | system | Notification opened |
| `notification.clicked` | system | Action clicked |
| `notification.preference.updated` | data | User updated preferences |
| `notification.unsubscribed` | data | User unsubscribed |
| `notification.device.register` | system | Device registered |
| `notification.device.unregister` | system | Device unregistered |

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| @sendgrid/mail | ^7.x | Email delivery |
| twilio | ^4.x | SMS/WhatsApp delivery |
| firebase-admin | ^12.x | Push notifications |
| handlebars | ^4.x | Template rendering |
| @mcv/realtime | workspace | In-app delivery |

---

*@mcv/fabric/notifications — Multi-Channel Notification Module*
