# @mcv/fabric/realtime — Real-Time Module

**Parent Package:** @mcv/fabric  
**Tier:** 2 (Infrastructure Services)  
**Classification:** INTERNAL  
**Last Updated:** February 8, 2026

---

## Purpose

The `realtime` module provides WebSocket-based real-time communication infrastructure for the MCV ecosystem. It enables live updates, presence tracking, collaborative features, and instant notifications across all connected clients. Built for multi-tenant environments with channel-based authorization and horizontal scaling.

**Everything that needs to update instantly flows through this module.**

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// SERVER
// ═══════════════════════════════════════════════════════════════════════════════

export { RealtimeServer } from './server/server';
export { ChannelManager, ChannelNames } from './channels';
export { PresenceTracker } from './server/presence';
export { RealtimeRateLimiter } from './server/rate-limiter';
export { ConnectionGuard } from './server/connection-guard';
export { MessageQueue } from './server/message-queue';
export { EventEmitter } from './server/event-emitter';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT
// ═══════════════════════════════════════════════════════════════════════════════

export { RealtimeClient } from './client/client';
export { RealtimeProvider, useRealtime } from './client/components';

// Hooks
export { useChannel, usePresence, useBroadcast } from './client/hooks';
export { useRealtimeEvent, useRealtimeSubscription } from './client/hooks';

// NAOS-specific hooks
export { 
  useNaosProgress, 
  useNaosThoughts, 
  useNaosIntervention,
} from './client/hooks-naos';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  // Connection
  ConnectionState,
  ConnectionInfo,
  RealtimeConfig,
  
  // Channels
  ChannelType,
  Channel,
  ChannelSubscription,
  
  // Presence
  PresenceUser,
  PresenceState,
  PresenceUpdate,
  
  // Events
  EventType,
  BaseEvent,
  TypedEvent,
  EventHandler,
  EventSubscription,
  EventPayloadMap,
  
  // All event payloads
  ConnectedPayload,
  DisconnectedPayload,
  ErrorPayload,
  SubscribePayload,
  SubscribedPayload,
  NotificationPayload,
  MetricUpdatePayload,
  AlertPayload,
  DataEventPayload,
  ConversationNewMessagePayload,
  TypingIndicatorPayload,
  NaosThoughtPayload,
  NaosProgressPayload,
  NaosCompletionPayload,
  // ... (60+ event payload types)
  
  // Messages
  ClientMessage,
  ServerMessage,
  
  // Errors
  RealtimeError,
  ErrorCode,
} from './types';
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         REALTIME MODULE ARCHITECTURE                             │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                            CLIENT LAYER                                      │ │
│  │                                                                              │ │
│  │  ┌───────────────────────────────────────────────────────────────────────┐  │ │
│  │  │                       RealtimeProvider                                 │  │ │
│  │  │                                                                        │  │ │
│  │  │  • Manages WebSocket connection                                        │  │ │
│  │  │  • Auto-reconnect with exponential backoff                            │  │ │
│  │  │  • Provides context to child components                                │  │ │
│  │  │  • Handles authentication                                              │  │ │
│  │  └───────────────────────────────────────────────────────────────────────┘  │ │
│  │                                    │                                         │ │
│  │         ┌──────────────────────────┼──────────────────────────┐             │ │
│  │         │                          │                          │             │ │
│  │  ┌──────▼───────┐  ┌───────────────▼─────────────┐  ┌────────▼────────┐   │ │
│  │  │  useChannel  │  │       usePresence           │  │  useRealtime    │   │ │
│  │  │              │  │                             │  │  Event          │   │ │
│  │  │  Subscribe   │  │  Track who's online         │  │                 │   │ │
│  │  │  to events   │  │  in a channel               │  │  Listen for     │   │ │
│  │  │              │  │                             │  │  specific types │   │ │
│  │  └──────────────┘  └─────────────────────────────┘  └─────────────────┘   │ │
│  │                                                                              │ │
│  └──────────────────────────────────────────────────────────────────────────────┘ │
│                                       │                                           │
│                              WebSocket│Connection                                 │
│                                       │                                           │
│  ┌────────────────────────────────────┼───────────────────────────────────────────┐
│  │                          SERVER LAYER                                          │
│  │                                    │                                           │
│  │  ┌─────────────────────────────────▼─────────────────────────────────────┐    │
│  │  │                       RealtimeServer                                   │    │
│  │  │                                                                        │    │
│  │  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │    │
│  │  │  │ Connection      │  │ Channel         │  │ Presence        │        │    │
│  │  │  │ Guard           │  │ Manager         │  │ Tracker         │        │    │
│  │  │  │                 │  │                 │  │                 │        │    │
│  │  │  │ • Auth          │  │ • Subscribe     │  │ • Join/Leave    │        │    │
│  │  │  │ • Rate limit    │  │ • Broadcast     │  │ • Status update │        │    │
│  │  │  │ • IP filtering  │  │ • History       │  │ • Heartbeat     │        │    │
│  │  │  └─────────────────┘  └─────────────────┘  └─────────────────┘        │    │
│  │  │                                                                        │    │
│  │  │  ┌─────────────────────────────────────────────────────────────────┐  │    │
│  │  │  │                    Channel Types                                 │  │    │
│  │  │  │                                                                  │  │    │
│  │  │  │  user:{userId}        ─ Private user channel                    │  │    │
│  │  │  │  venture:{ventureId}  ─ Venture-wide broadcasts                 │  │    │
│  │  │  │  presence:{channel}   ─ Presence tracking channel               │  │    │
│  │  │  │  dashboard:{id}       ─ Live dashboard updates                  │  │    │
│  │  │  │  collab:{docId}       ─ Collaborative editing                   │  │    │
│  │  │  │  naos:{taskId}        ─ AI agent progress                       │  │    │
│  │  │  │  announcements        ─ Platform-wide announcements             │  │    │
│  │  │  └─────────────────────────────────────────────────────────────────┘  │    │
│  │  │                                                                        │    │
│  │  └────────────────────────────────────────────────────────────────────────┘    │
│  │                                                                                 │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │  │                         Scaling Layer                                     │  │
│  │  │                                                                           │  │
│  │  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐           │  │
│  │  │  │    Redis Pub/Sub │  │  Message Queue  │  │  Event Store    │           │  │
│  │  │  │                  │  │  (Replay)       │  │  (History)      │           │  │
│  │  │  │  Cross-instance  │  │                 │  │                 │           │  │
│  │  │  │  message relay   │  │  Missed message │  │  Recent event   │           │  │
│  │  │  │                  │  │  recovery       │  │  buffer         │           │  │
│  │  │  └─────────────────┘  └─────────────────┘  └─────────────────┘           │  │
│  │  │                                                                           │  │
│  │  └───────────────────────────────────────────────────────────────────────────┘  │
│  │                                                                                  │
│  └──────────────────────────────────────────────────────────────────────────────────┘
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Event Types

The realtime system supports 60+ typed events across multiple domains:

### System Events

| Event | Description |
|-------|-------------|
| `system:connected` | Client connected to server |
| `system:disconnected` | Client disconnected |
| `system:error` | Error occurred |
| `system:ping` / `system:pong` | Heartbeat |

### Channel Events

| Event | Description |
|-------|-------------|
| `channel:subscribe` | Client requests subscription |
| `channel:unsubscribe` | Client requests unsubscription |
| `channel:subscribed` | Subscription confirmed |
| `channel:unsubscribed` | Unsubscription confirmed |
| `channel:error` | Channel-specific error |

### Presence Events

| Event | Description |
|-------|-------------|
| `presence:sync` | Full presence state sync |
| `presence:join` | User joined channel |
| `presence:leave` | User left channel |
| `presence:update` | User status/metadata changed |

### Domain Events

| Category | Events |
|----------|--------|
| **Notifications** | `notification:new`, `notification:read`, `notification:count` |
| **Conversations** | `conversation:new_message`, `conversation:typing_indicator`, `conversation:read_receipt` |
| **Agents** | `agent:status_change`, `agent:task_assigned`, `agent:task_completed` |
| **Calls** | `call:status`, `call:ringing`, `call:answered`, `call:ended` |
| **Workflows** | `workflow:execution_update`, `workflow:step_completed`, `workflow:completed` |
| **NAOS** | `naos:thought`, `naos:delegation`, `naos:progress`, `naos:completion`, `naos:intervention_required` |
| **Collaboration** | `collab:cursor_update`, `collab:section_lock`, `collab:content_change` |
| **Dashboard** | `dashboard:metric_update`, `dashboard:widget_refresh`, `dashboard:alert` |
| **Data** | `data:created`, `data:updated`, `data:deleted`, `data:sync` |
| **Integrations** | `invoice:*`, `payment:*`, `sms:*`, `email:*`, `github:*` |

---

## Core Interfaces

### ConnectionInfo

```typescript
interface ConnectionInfo {
  id: string;                           // Unique connection ID
  userId: string;                       // Authenticated user ID
  ventureId?: string;                   // Active venture context
  connectedAt: Date;                    // Connection timestamp
  lastPingAt: Date;                     // Last heartbeat
  metadata?: Record<string, unknown>;   // Custom connection metadata
}
```

### RealtimeConfig

```typescript
interface RealtimeConfig {
  url: string;                          // WebSocket server URL
  token?: string;                       // Auth token
  autoConnect?: boolean;                // Connect on initialization
  reconnect?: boolean;                  // Auto-reconnect on disconnect
  reconnectInterval?: number;           // Base reconnect interval (ms)
  reconnectAttempts?: number;           // Max reconnect attempts
  pingInterval?: number;                // Heartbeat interval (ms)
  debug?: boolean;                      // Enable debug logging
}
```

### PresenceUser

```typescript
interface PresenceUser {
  userId: string;
  connectionId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastActiveAt: Date;
  metadata?: {
    displayName?: string;
    avatarUrl?: string;
    currentPage?: string;               // Current route
    currentVenture?: string;
    userAgent?: string;
    [key: string]: unknown;
  };
}
```

### BaseEvent

```typescript
interface BaseEvent<T extends EventType = EventType, P = unknown> {
  type: T;                              // Event type identifier
  payload: P;                           // Event-specific payload
  channel?: string;                     // Target channel
  timestamp: Date;                      // Event timestamp
  id: string;                           // Unique event ID
}
```

### TypedEvent

```typescript
// Type-safe event with proper payload inference
type TypedEvent<T extends EventType> = BaseEvent<T, EventPayloadMap[T]>;

// Usage:
const event: TypedEvent<'notification:new'> = {
  type: 'notification:new',
  payload: {
    id: 'notif-123',
    title: 'New Message',
    body: 'You have a new message',
    category: 'transactional',
    priority: 'normal',
    createdAt: new Date(),
  },
  timestamp: new Date(),
  id: 'event-uuid',
};
```

---

## Server Usage

### Basic Server Setup

```typescript
import { RealtimeServer } from '@mcv/realtime/server';
import { validateToken } from '@mcv/auth';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 1: Create and start server
// ═══════════════════════════════════════════════════════════════════════════════

const server = new RealtimeServer({
  port: 3001,
  path: '/realtime',
  pingInterval: 30000,           // 30 seconds
  pingTimeout: 10000,            // 10 seconds
  maxPayloadSize: 1024 * 1024,   // 1MB
  
  // Authentication
  authenticator: async (token, req) => {
    try {
      const session = await validateToken(token);
      return {
        userId: session.userId,
        ventureIds: session.ventureIds,
        permissions: session.permissions,
        metadata: { sessionId: session.id },
      };
    } catch {
      return null;
    }
  },
  
  // Callbacks
  onConnection: (conn) => {
    console.log(`Connected: ${conn.userId}`);
  },
  onDisconnection: (conn) => {
    console.log(`Disconnected: ${conn.userId}`);
  },
  onError: (error) => {
    console.error('Realtime error:', error);
  },
});

server.start();
console.log('Realtime server started on :3001/realtime');

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 2: Attach to existing HTTP server
// ═══════════════════════════════════════════════════════════════════════════════

import { createServer } from 'http';

const httpServer = createServer(app);
server.attachToServer(httpServer);

httpServer.listen(3000, () => {
  console.log('HTTP + WebSocket server on :3000');
});
```

### Broadcasting Events

```typescript
import { realtimeServer } from '@mcv/realtime/server';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 3: Send to specific user
// ═══════════════════════════════════════════════════════════════════════════════

realtimeServer.sendEvent(
  { userId: 'user-uuid' },
  'notification:new',
  {
    id: 'notif-123',
    title: 'Deal Won!',
    body: 'Enterprise Deal worth $50,000 was closed',
    category: 'transactional',
    priority: 'high',
    actionUrl: '/deals/deal-uuid',
    createdAt: new Date(),
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 4: Broadcast to venture
// ═══════════════════════════════════════════════════════════════════════════════

realtimeServer.sendEvent(
  { ventureId: 'venture-uuid' },
  'dashboard:metric_update',
  {
    metricId: 'mrr',
    value: 125000,
    previousValue: 120000,
    change: 5000,
    changePercent: 4.17,
    timestamp: new Date(),
    ventureId: 'venture-uuid',
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 5: Broadcast to channel
// ═══════════════════════════════════════════════════════════════════════════════

realtimeServer.sendEvent(
  { channel: 'collab:doc-123' },
  'collab:content_change',
  {
    documentId: 'doc-123',
    sectionId: 'section-1',
    userId: 'user-uuid',
    userName: 'John Smith',
    changeType: 'insert',
    position: { line: 10, column: 5 },
    content: 'New paragraph content',
    version: 42,
    timestamp: new Date(),
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 6: Platform-wide announcement
// ═══════════════════════════════════════════════════════════════════════════════

realtimeServer.sendAnnouncement({
  id: 'ann-123',
  title: 'Scheduled Maintenance',
  message: 'System will be down for maintenance on Sunday 2 AM - 4 AM UTC',
  type: 'maintenance',
  dismissible: true,
  expiresAt: new Date('2026-02-10T04:00:00Z'),
});
```

### NAOS Agent Events

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 7: AI agent progress updates
// ═══════════════════════════════════════════════════════════════════════════════

// Send thought process update
realtimeServer.sendEvent(
  { userId: 'user-uuid' },
  'naos:thought',
  {
    taskId: 'task-123',
    executionId: 'exec-456',
    agentId: 'analyst-agent',
    agentName: 'Analyst',
    thought: 'Analyzing Q4 revenue trends across all segments...',
    reasoning: 'Starting with revenue data to identify patterns',
    confidence: 0.85,
    stepIndex: 2,
    totalSteps: 5,
    timestamp: new Date(),
  }
);

// Send progress update
realtimeServer.sendEvent(
  { userId: 'user-uuid' },
  'naos:progress',
  {
    taskId: 'task-123',
    executionId: 'exec-456',
    agentId: 'analyst-agent',
    agentName: 'Analyst',
    progress: 60,
    currentStep: 'Generating visualizations',
    stepIndex: 3,
    totalSteps: 5,
    estimatedRemainingMs: 15000,
    timestamp: new Date(),
  }
);

// Request human intervention
realtimeServer.sendEvent(
  { userId: 'user-uuid' },
  'naos:intervention_required',
  {
    taskId: 'task-123',
    executionId: 'exec-456',
    agentId: 'analyst-agent',
    agentName: 'Analyst',
    question: 'Should I include projections for Q1 2027?',
    options: [
      { id: 'yes', label: 'Yes', description: 'Include 3-month projection' },
      { id: 'no', label: 'No', description: 'Only show historical data' },
      { id: 'skip', label: 'Skip this section', description: 'Remove projections section' },
    ],
    context: { currentSection: 'Revenue Analysis' },
    timeoutMs: 60000,
    timestamp: new Date(),
  }
);
```

---

## Client Usage

### Provider Setup

```tsx
import { RealtimeProvider, useRealtime } from '@mcv/realtime/client';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 8: Provider setup
// ═══════════════════════════════════════════════════════════════════════════════

function App() {
  const { accessToken } = useAuth();
  
  return (
    <RealtimeProvider
      url={process.env.NEXT_PUBLIC_REALTIME_URL!}
      token={accessToken}
      autoConnect
      reconnect
      onConnect={() => console.log('Connected')}
      onDisconnect={(reason) => console.log('Disconnected:', reason)}
    >
      <Dashboard />
    </RealtimeProvider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 9: Connection status
// ═══════════════════════════════════════════════════════════════════════════════

function ConnectionIndicator() {
  const { state, isConnected, reconnecting } = useRealtime();
  
  if (reconnecting) {
    return <Badge variant="warning">Reconnecting...</Badge>;
  }
  
  return (
    <Badge variant={isConnected ? 'success' : 'error'}>
      {isConnected ? 'Connected' : 'Disconnected'}
    </Badge>
  );
}
```

### Subscribing to Events

```tsx
import { useChannel, useRealtimeEvent } from '@mcv/realtime/client';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 10: Subscribe to channel
// ═══════════════════════════════════════════════════════════════════════════════

function DealUpdates({ dealId }: { dealId: string }) {
  const { isSubscribed, subscribe, unsubscribe } = useChannel(`deal:${dealId}`);
  
  useRealtimeEvent('data:updated', (event) => {
    if (event.payload.entityId === dealId) {
      // Refetch deal data
      queryClient.invalidateQueries(['deal', dealId]);
    }
  });
  
  useEffect(() => {
    subscribe();
    return () => unsubscribe();
  }, [dealId]);
  
  return <div>Listening for updates...</div>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 11: Type-safe event handler
// ═══════════════════════════════════════════════════════════════════════════════

function NotificationListener() {
  useRealtimeEvent('notification:new', (event) => {
    // event.payload is typed as NotificationPayload
    toast({
      title: event.payload.title,
      description: event.payload.body,
    });
  });
  
  useRealtimeEvent('notification:count', (event) => {
    // Update unread count
    setUnreadCount(event.payload.unread);
  });
  
  return null;
}
```

### Presence Tracking

```tsx
import { usePresence } from '@mcv/realtime/client';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 12: Track who's viewing a document
// ═══════════════════════════════════════════════════════════════════════════════

function DocumentCollaborators({ documentId }: { documentId: string }) {
  const { 
    users, 
    myPresence, 
    updateMyPresence,
    isJoined,
  } = usePresence(`collab:${documentId}`, {
    // My initial presence data
    initialPresence: {
      displayName: currentUser.name,
      avatarUrl: currentUser.avatar,
      currentPage: window.location.pathname,
    },
  });
  
  // Update presence when cursor moves
  const handleCursorMove = (position: { line: number; column: number }) => {
    updateMyPresence({ cursor: position });
  };
  
  return (
    <div className="flex -space-x-2">
      {users.map((user) => (
        <Tooltip key={user.connectionId}>
          <TooltipTrigger>
            <Avatar className="border-2 border-background">
              <AvatarImage src={user.metadata?.avatarUrl} />
              <AvatarFallback>{user.metadata?.displayName?.[0]}</AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent>
            {user.metadata?.displayName} - {user.status}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 13: Online users in venture
// ═══════════════════════════════════════════════════════════════════════════════

function OnlineTeamMembers({ ventureId }: { ventureId: string }) {
  const { users } = usePresence(`venture:${ventureId}`);
  
  const onlineUsers = users.filter(u => u.status === 'online');
  const awayUsers = users.filter(u => u.status === 'away');
  
  return (
    <div>
      <h3>Team Activity</h3>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          <span>{onlineUsers.length} online</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-yellow-500" />
          <span>{awayUsers.length} away</span>
        </div>
      </div>
    </div>
  );
}
```

### NAOS Progress Tracking

```tsx
import { 
  useNaosProgress, 
  useNaosThoughts, 
  useNaosIntervention,
} from '@mcv/realtime/client';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 14: AI task progress UI
// ═══════════════════════════════════════════════════════════════════════════════

function NaosTaskProgress({ taskId }: { taskId: string }) {
  const { progress, currentStep, estimatedRemaining, isComplete } = useNaosProgress(taskId);
  const { thoughts } = useNaosThoughts(taskId);
  
  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span>{currentStep}</span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} />
        {estimatedRemaining && (
          <p className="text-sm text-muted-foreground mt-1">
            ~{Math.round(estimatedRemaining / 1000)}s remaining
          </p>
        )}
      </div>
      
      {/* Thought stream */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Agent Thoughts</h4>
        {thoughts.slice(-5).map((thought, i) => (
          <div key={i} className="text-sm bg-muted p-2 rounded">
            <span className="font-medium">{thought.agentName}:</span>{' '}
            {thought.thought}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 15: Human intervention UI
// ═══════════════════════════════════════════════════════════════════════════════

function NaosInterventionDialog({ taskId }: { taskId: string }) {
  const { 
    pendingIntervention, 
    respond, 
    timeRemaining,
  } = useNaosIntervention(taskId);
  
  if (!pendingIntervention) return null;
  
  return (
    <Dialog open>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Input Required</DialogTitle>
          <DialogDescription>
            {pendingIntervention.agentName} needs your decision
          </DialogDescription>
        </DialogHeader>
        
        <p className="text-lg font-medium">{pendingIntervention.question}</p>
        
        <div className="space-y-2">
          {pendingIntervention.options?.map((option) => (
            <Button
              key={option.id}
              variant="outline"
              className="w-full justify-start"
              onClick={() => respond(option.id)}
            >
              <div>
                <p className="font-medium">{option.label}</p>
                {option.description && (
                  <p className="text-sm text-muted-foreground">
                    {option.description}
                  </p>
                )}
              </div>
            </Button>
          ))}
        </div>
        
        {timeRemaining && (
          <p className="text-sm text-muted-foreground">
            Auto-skip in {Math.round(timeRemaining / 1000)}s
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

### Collaborative Editing

```tsx
import { useChannel, useRealtimeEvent, useBroadcast } from '@mcv/realtime/client';

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 16: Collaborative cursor tracking
// ═══════════════════════════════════════════════════════════════════════════════

function CollaborativeCursors({ documentId }: { documentId: string }) {
  const [cursors, setCursors] = useState<Map<string, CursorPosition>>(new Map());
  const broadcast = useBroadcast(`collab:${documentId}`);
  
  // Listen for cursor updates from others
  useRealtimeEvent('collab:cursor_update', (event) => {
    if (event.payload.userId !== currentUser.id) {
      setCursors(prev => new Map(prev).set(event.payload.userId, {
        line: event.payload.cursor.line,
        column: event.payload.cursor.column,
        color: event.payload.userColor,
        name: event.payload.userName,
      }));
    }
  });
  
  // Broadcast my cursor position
  const handleCursorMove = useCallback(
    debounce((position: { line: number; column: number }) => {
      broadcast('collab:cursor_update', {
        documentId,
        userId: currentUser.id,
        userName: currentUser.name,
        userColor: currentUser.color,
        cursor: position,
        timestamp: new Date(),
      });
    }, 50),
    [documentId]
  );
  
  return (
    <>
      {Array.from(cursors.entries()).map(([userId, cursor]) => (
        <RemoteCursor
          key={userId}
          line={cursor.line}
          column={cursor.column}
          color={cursor.color}
          label={cursor.name}
        />
      ))}
    </>
  );
}
```

---

## Channel Naming Conventions

```typescript
// Channel name generators
export const ChannelNames = {
  // User-specific channel (private)
  user: (userId: string) => `user:${userId}`,
  
  // Venture-wide channel (venture members only)
  venture: (ventureId: string) => `venture:${ventureId}`,
  
  // Dashboard channel (for live metrics)
  dashboard: (ventureId: string) => `dashboard:${ventureId}`,
  
  // Collaborative editing channel
  collab: (documentId: string) => `collab:${documentId}`,
  
  // NAOS task channel
  naos: (taskId: string) => `naos:${taskId}`,
  
  // Conversation channel
  conversation: (conversationId: string) => `conversation:${conversationId}`,
  
  // Presence channel
  presence: (roomId: string) => `presence:${roomId}`,
  
  // Platform announcements (broadcast to all)
  announcements: () => 'announcements',
};
```

---

## Performance Considerations

### Connection Limits

| Metric | Limit | Notes |
|--------|-------|-------|
| Connections per user | 5 | Multiple tabs/devices |
| Channels per connection | 50 | Reasonable subscription limit |
| Message rate per connection | 100/min | Rate limited |
| Payload size | 1MB | Maximum message size |
| History per channel | 100 events | Recent event buffer |

### Scaling

- Use Redis Pub/Sub for cross-instance message relay
- Sticky sessions recommended for WebSocket connections
- Consider connection pooling at load balancer level

---

## Environment Variables

```bash
# Server configuration
REALTIME_PORT=3001
REALTIME_PATH=/realtime
REALTIME_PING_INTERVAL=30000
REALTIME_PING_TIMEOUT=10000
REALTIME_MAX_PAYLOAD=1048576

# Scaling
REALTIME_REDIS_URL=redis://localhost:6379
REALTIME_REDIS_PREFIX=rt:

# Rate limiting
REALTIME_RATE_LIMIT_MESSAGES=100
REALTIME_RATE_LIMIT_WINDOW=60000
```

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| ws | ^8.x | WebSocket server |
| zod | ^3.x | Message validation |
| ioredis | ^5.x | Redis pub/sub (optional) |

---

## Audit Events

| Event | Category | Description |
|-------|----------|-------------|
| `realtime.connected` | system | Client connected |
| `realtime.disconnected` | system | Client disconnected |
| `realtime.authenticated` | authentication | Client authenticated |
| `realtime.rate_limited` | security | Rate limit exceeded |

---

*@mcv/fabric/realtime — Real-Time Communication Module*
