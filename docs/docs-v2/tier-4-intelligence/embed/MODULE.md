# @mcv/intelligence/embed — Embeddable Widget SDK Module

**Parent Package:** @mcv/intelligence  
**Actual Package:** @mcv/embed  
**Tier:** 4 (Intelligence Layer — Client SDK)  
**Classification:** PUBLISHABLE (Phase 1)  
**Last Updated:** February 8, 2026

---

## Purpose

The `embed` module (implemented as `@mcv/embed`) is a **client-side JavaScript/TypeScript SDK** that allows external websites to embed MCV.ONE widgets — **forms**, **booking calendars**, and **AI chat** — via sandboxed iframes with a secure `postMessage` communication protocol.

This is a **browser-only, zero-dependency** package designed for third-party integration. It is the public-facing bridge between any website on the internet and the MCV.ONE platform, enabling ventures to capture leads, schedule appointments, and provide AI-powered support without requiring visitors to leave the host site.

### What It Provides

- **Form embeds** — Embed venture forms with pre-fill, submission tracking, multi-step support, and error handling
- **Booking embeds** — Embed scheduling/booking calendars with slot selection, timezone awareness, and confirmation
- **Chat embeds** — Embed AI-powered chat widgets with floating bubble UI, user identification, and programmatic messaging
- **Four display modes** — `popup`, `slide-in`, `inline`, and `full-page` with animated transitions
- **Secure iframe sandboxing** — `allow-scripts allow-same-origin allow-forms allow-popups` with namespace-filtered postMessage
- **Event-driven architecture** — Typed events via postMessage protocol with convenience callbacks
- **Singleton SDK** — Single `MCVEmbed.init()` manages all embed instances with centralized lifecycle
- **Zero dependencies** — Pure browser APIs only; ~5KB minified + gzipped

### What It Does NOT Do

- **No server-side rendering** — Browser-only; will throw in Node.js / SSR environments
- **No direct database access** — All persistence happens server-side via iframe endpoints
- **No authentication logic** — Tokens are passed through but validated server-side
- **No state persistence** — No localStorage/cookies on host page; all state lives in sandboxed iframes

**This is the public-facing integration point for MCV ventures to embed AI and business widgets on any website.**

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         HOST WEBSITE (3rd Party)                                 │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │                        MCVEmbed Singleton                                  │  │
│  │                                                                            │  │
│  │  MCVEmbed.init({ baseUrl, tenantId, token?, debug? })                      │  │
│  │                                                                            │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │  │
│  │  │   FormEmbed     │  │  BookingEmbed   │  │   ChatEmbed     │            │  │
│  │  │                 │  │                 │  │                 │            │  │
│  │  │  .open()        │  │  .open()        │  │  .open()        │            │  │
│  │  │  .close()       │  │  .close()       │  │  .close()       │            │  │
│  │  │  .destroy()     │  │  .destroy()     │  │  .toggle()      │            │  │
│  │  │  .on(event)     │  │  .on(event)     │  │  .setUser()     │            │  │
│  │  │                 │  │                 │  │  .sendMessage() │            │  │
│  │  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘            │  │
│  │           │                    │                    │                      │  │
│  │  ┌────────▼────────────────────▼────────────────────▼────────────────┐     │  │
│  │  │                   BaseEventEmitter                                │     │  │
│  │  │         on() / off() / emit() / removeAllListeners()             │     │  │
│  │  └──────────────────────────────┬───────────────────────────────────┘     │  │
│  │                                 │                                         │  │
│  │  ┌──────────────────────────────▼───────────────────────────────────┐     │  │
│  │  │                   postMessage Protocol                           │     │  │
│  │  │               namespace: "mcv-embed"                             │     │  │
│  │  │        { ns, embedId, type, payload }                            │     │  │
│  │  └──────────────────────────────┬───────────────────────────────────┘     │  │
│  │                                 │                                         │  │
│  └─────────────────────────────────┼─────────────────────────────────────────┘  │
│                                    │ window.postMessage                         │
│  ┌─────────────────────────────────▼─────────────────────────────────────────┐  │
│  │                        Sandboxed Iframes                                   │  │
│  │                                                                            │  │
│  │  ┌──────────────────┐ ┌────────────────────┐ ┌──────────────────┐         │  │
│  │  │  /embed/         │ │  /embed/           │ │  /embed/         │         │  │
│  │  │  form/:formId    │ │  booking/:slug     │ │  chat            │         │  │
│  │  │                  │ │                    │ │                  │         │  │
│  │  │  sandbox:        │ │  sandbox:          │ │  sandbox:        │         │  │
│  │  │  allow-scripts   │ │  allow-scripts     │ │  allow-scripts   │         │  │
│  │  │  allow-same-orig │ │  allow-same-origin │ │  allow-same-orig │         │  │
│  │  │  allow-forms     │ │  allow-forms       │ │  allow-forms     │         │  │
│  │  │  allow-popups    │ │  allow-popups      │ │  allow-popups    │         │  │
│  │  └──────────────────┘ └────────────────────┘ └──────────────────┘         │  │
│  │                                                                            │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
│                                    │                                             │
│                                    │ HTTPS                                       │
└────────────────────────────────────┼─────────────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼─────────────────────────────────────────────┐
│                     MCV.ONE Application Server                                    │
│                  (app.mcv.one or custom venture domain)                           │
│                                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐                │
│  │  Form Service    │  │ Calendar Service │  │   AI Chat        │                │
│  │                  │  │                  │  │   Service         │                │
│  │  forms           │  │  calendars       │  │  conversations   │                │
│  │  form_fields     │  │  appointments    │  │  messages        │                │
│  │  form_submissions│  │  booking_pages   │  │  ai_gateway      │                │
│  │  form_analytics  │  │  availability    │  │  rag_knowledge   │                │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘                │
│                                                                                   │
│  ┌──────────────────────────────────────────────────────────────────────────────┐ │
│  │                          ventures (Multi-Tenant)                              │ │
│  │  tenantId lookup → venture config, branding, features, domain                │ │
│  └──────────────────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow Sequence

```
1. Host page loads @mcv/embed SDK
2. MCVEmbed.init({ baseUrl, tenantId }) → attaches global postMessage listener
3. MCVEmbed.form('id') / MCVEmbed.booking('slug') / MCVEmbed.chat()
   → Factory creates embed instance with unique embedId
   → Registers message handler in SDK's internal bus
4. embed.open() → Creates sandboxed iframe, mounts to DOM
   → iframe loads: {baseUrl}/embed/{type}/{id}?tenantId=...&embedId=...
5. iframe content renders and posts:
   → { ns: "mcv-embed", embedId: "form-xxx", type: "form:loaded" }
6. SDK's global listener receives MessageEvent, dispatches by embedId
   → Matching handler translates type → emitter event → user callback
7. User interaction in iframe posts events (submitted, booked, message)
   → Same dispatch flow → user's onSubmit/onBook/onMessage callbacks
8. embed.destroy() → removes DOM elements, detaches handlers, unregisters
```

---

## Package Structure

```
packages/embed/
├── src/
│   ├── index.ts       # Public API re-exports
│   ├── core.ts        # MCVEmbed singleton + BaseEventEmitter class
│   ├── types.ts       # All TypeScript type definitions
│   ├── utils.ts       # DOM utilities, iframe creation, messaging helpers
│   ├── form.ts        # createFormEmbed() factory implementation
│   ├── booking.ts     # createBookingEmbed() factory implementation
│   └── chat.ts        # createChatEmbed() factory implementation
├── dist/
│   ├── index.js       # CommonJS bundle
│   ├── index.mjs      # ESM bundle
│   ├── index.d.ts     # TypeScript declarations (CJS)
│   └── index.d.mts    # TypeScript declarations (ESM)
├── package.json       # Zero dependencies; tsup + typescript devDeps only
├── tsconfig.json
├── CLAUDE.md          # AI agent context
└── README.md          # Public documentation
```

### Build Configuration

```json
{
  "name": "@mcv/embed",
  "version": "1.0.0",
  "description": "MCV.ONE Embed SDK - Embed forms, booking, chat on external sites",
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "dev": "tsup src/index.ts --format cjs,esm --dts --watch"
  },
  "devDependencies": {
    "tsup": "^8.0.0",
    "typescript": "^5.6.0"
  }
}
```

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// CORE SDK
// ═══════════════════════════════════════════════════════════════════════════════

export {
  MCVEmbed,                      // Singleton SDK — init(), form(), booking(), chat(), destroy()
  BaseEventEmitter,              // Lightweight event emitter (used internally, exposed for extension)
} from './core';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type {
  // Configuration
  MCVEmbedConfig,                // SDK initialization config
  EmbedMode,                     // 'popup' | 'slide-in' | 'inline' | 'full-page'
  EmbedMessage,                  // postMessage protocol message shape
  EventHandler,                  // Generic event callback type
  EventEmitter,                  // Event emitter interface

  // Form Embed
  FormEmbedOptions,              // Options for creating a form embed
  FormEmbed,                     // Form embed instance interface
  FormSubmitPayload,             // Payload on form submission
  FormErrorPayload,              // Payload on form error

  // Booking Embed
  BookingEmbedOptions,           // Options for creating a booking embed
  BookingEmbed,                  // Booking embed instance interface
  BookingPayload,                // Payload on booking confirmation
  SlotSelectPayload,             // Payload on slot selection
  BookingErrorPayload,           // Payload on booking error

  // Chat Embed
  ChatEmbedOptions,              // Options for creating a chat embed
  ChatEmbed,                     // Chat embed instance interface
  ChatUser,                      // Chat user identification
  ChatMessagePayload,            // Payload on chat message
} from './types';

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITIES (Advanced Usage)
// ═══════════════════════════════════════════════════════════════════════════════

export {
  generateId,                    // Generate unique embed instance IDs
  buildUrl,                      // Build parameterized embed URLs
  parseMessage,                  // Type-guard for postMessage parsing
} from './utils';
```

---

## TypeScript Interfaces

### SDK Configuration

```typescript
/**
 * Configuration passed to MCVEmbed.init().
 * Must be called before creating any embed instances.
 */
export interface MCVEmbedConfig {
  /** Base URL of the MCV application (e.g., "https://app.mcv.one") */
  baseUrl: string;

  /** Tenant / venture identifier — maps to ventures.id or ventures.slug */
  tenantId: string;

  /** Optional JWT or API key for authenticated embeds */
  token?: string;

  /** Enable debug logging to the console (all postMessage traffic is logged) */
  debug?: boolean;
}
```

### Display Modes

```typescript
/**
 * How an embed is displayed on the host page.
 *
 * - popup:     Centered modal with semi-transparent backdrop overlay.
 *              Fixed position, centered via transform: translate(-50%, -50%).
 *              Closes on backdrop click or form:close/booking:close event.
 *
 * - slide-in:  Right-side panel sliding in from the edge.
 *              Uses CSS transform: translateX() for GPU-accelerated animation.
 *              300ms ease transition. Closes on backdrop click.
 *
 * - inline:    Rendered directly into a container element (auto-mounts).
 *              Requires a valid container option (HTMLElement or CSS selector).
 *              No overlay, no close button — managed entirely by host page.
 *
 * - full-page: Navigates the entire page to the embed URL via window.location.href.
 *              No iframe — the browser navigates away. Cannot be closed programmatically.
 */
export type EmbedMode = 'popup' | 'slide-in' | 'inline' | 'full-page';
```

### PostMessage Protocol

```typescript
/**
 * Message format for iframe ↔ host communication.
 * All messages use the "mcv-embed" namespace for filtering.
 *
 * The global message listener in MCVEmbed dispatches messages
 * to the correct embed instance by matching embedId.
 */
export interface EmbedMessage {
  /** Namespace — always "mcv-embed". Used as type-guard in parseMessage(). */
  ns: 'mcv-embed';

  /** The embed instance that originated the message (unique per embed) */
  embedId: string;

  /** Event type (e.g., "form:submitted", "booking:booked", "chat:message") */
  type: string;

  /** Arbitrary payload — structure depends on the event type */
  payload?: unknown;
}
```

### Event System

```typescript
/** Generic typed event callback */
export type EventHandler<T = unknown> = (payload: T) => void;

/**
 * Event emitter interface implemented by all embeds.
 * Provides pub/sub pattern for decoupled event handling.
 * Handler errors are swallowed to prevent breaking the SDK.
 */
export interface EventEmitter {
  on<T = unknown>(event: string, handler: EventHandler<T>): void;
  off<T = unknown>(event: string, handler: EventHandler<T>): void;
  emit<T = unknown>(event: string, payload?: T): void;
  removeAllListeners(event?: string): void;
}
```

### BaseEventEmitter Implementation

```typescript
/**
 * Lightweight event emitter using Map<string, Set<EventHandler>>.
 * Exposed publicly for extension in custom integrations.
 *
 * Key behaviors:
 * - Handler errors are caught and swallowed (prevents SDK breakage)
 * - Uses Set for O(1) add/delete of handlers
 * - removeAllListeners() with no args clears everything
 * - removeAllListeners(event) clears only that event's handlers
 */
export class BaseEventEmitter implements EventEmitter {
  private _handlers: Map<string, Set<EventHandler>> = new Map();

  on<T = unknown>(event: string, handler: EventHandler<T>): void {
    if (!this._handlers.has(event)) this._handlers.set(event, new Set());
    this._handlers.get(event)!.add(handler as EventHandler);
  }

  off<T = unknown>(event: string, handler: EventHandler<T>): void {
    this._handlers.get(event)?.delete(handler as EventHandler);
  }

  emit<T = unknown>(event: string, payload?: T): void {
    this._handlers.get(event)?.forEach((h) => {
      try {
        h(payload);
      } catch {
        // Swallow handler errors to avoid breaking the SDK.
      }
    });
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this._handlers.delete(event);
    } else {
      this._handlers.clear();
    }
  }
}
```

### Form Embed Types

```typescript
export interface FormEmbedOptions {
  /** Display mode. Defaults to "popup" */
  mode?: EmbedMode;

  /** Container element or CSS selector for inline mode.
   *  Required when mode is 'inline'. Resolved via document.querySelector(). */
  container?: HTMLElement | string;

  /** Pre-fill form fields. Serialized as JSON in the iframe URL query param.
   *  Keys must match the field `name` attribute in the form definition. */
  prefill?: Record<string, unknown>;

  /** Custom CSS class applied to the wrapper div */
  className?: string;

  /** Width of the iframe (CSS value, e.g., "560px", "100%").
   *  Popup default: 560px. Slide-in default: 440px. Inline: 100%. */
  width?: string;

  /** Height of the iframe (CSS value, e.g., "680px", "100%").
   *  Popup default: 680px. Slide-in/Inline: 100%. */
  height?: string;

  // Callbacks (convenience — also available via .on())
  onSubmit?: EventHandler<FormSubmitPayload>;
  onLoad?: EventHandler<void>;
  onError?: EventHandler<FormErrorPayload>;
  onClose?: EventHandler<void>;
}

export interface FormSubmitPayload {
  /** Form identifier (matches the formId passed to MCVEmbed.form()) */
  formId: string;
  /** Submitted form data — key/value pairs matching form field names */
  data: Record<string, unknown>;
  /** Server-assigned submission UUID */
  submissionId: string;
}

export interface FormErrorPayload {
  /** Form identifier */
  formId: string;
  /** Human-readable error message */
  message: string;
  /** Machine-readable error code (e.g., "EMBED_FORM_VALIDATION") */
  code?: string;
}

export interface FormEmbed extends EventEmitter {
  /** Unique embed instance identifier (auto-generated: "form-{timestamp36}-{counter36}") */
  readonly embedId: string;
  /** Form identifier (the formId passed to MCVEmbed.form()) */
  readonly formId: string;
  /** Show the form — creates iframe and mounts to DOM.
   *  No-op if already open or destroyed. Popup/slide-in show overlay. */
  open(): void;
  /** Hide the form — removes iframe/wrapper/overlay from DOM.
   *  Emits 'close' event. For slide-in, animates out over 300ms. */
  close(): void;
  /** Permanently destroy the embed — close + remove all listeners + unregister from SDK.
   *  Idempotent: safe to call multiple times. */
  destroy(): void;
}
```

### Booking Embed Types

```typescript
export interface BookingEmbedOptions {
  /** Display mode. Defaults to "popup" */
  mode?: EmbedMode;
  /** Container for inline mode */
  container?: HTMLElement | string;
  /** Custom CSS class */
  className?: string;
  /** Iframe width. Popup default: 640px. Slide-in default: 480px. */
  width?: string;
  /** Iframe height. Popup default: 720px. */
  height?: string;
  /** Pre-select a date (ISO string, e.g., "2026-03-15").
   *  Passed as URL query param to the booking iframe. */
  date?: string;
  /** Timezone override (IANA, e.g., "America/Toronto").
   *  Overrides the browser's default timezone for slot display. */
  timezone?: string;

  // Callbacks
  onBook?: EventHandler<BookingPayload>;
  onLoad?: EventHandler<void>;
  onSlotSelect?: EventHandler<SlotSelectPayload>;
  onError?: EventHandler<BookingErrorPayload>;
  onClose?: EventHandler<void>;
}

export interface BookingPayload {
  /** Booking type slug (the slug passed to MCVEmbed.booking()) */
  slug: string;
  /** Selected slot identifier */
  slotId: string;
  /** ISO 8601 start time of the booked slot */
  startTime: string;
  /** ISO 8601 end time of the booked slot */
  endTime: string;
  /** Attendee information collected from the booking form */
  attendee: Record<string, unknown>;
  /** Server-assigned booking/appointment UUID */
  bookingId: string;
}

export interface SlotSelectPayload {
  slug: string;
  slotId: string;
  startTime: string;
  endTime: string;
}

export interface BookingErrorPayload {
  slug: string;
  /** Human-readable error message */
  message: string;
  /** Machine-readable error code */
  code?: string;
}

export interface BookingEmbed extends EventEmitter {
  readonly embedId: string;
  readonly slug: string;
  open(): void;
  close(): void;
  destroy(): void;
}
```

### Chat Embed Types

```typescript
export interface ChatEmbedOptions {
  /** Position of the chat bubble on the page. Defaults to "bottom-right".
   *  Controls CSS positioning: bottom: 20px + right/left: 20px.
   *  Also affects transform-origin for the scale animation. */
  position?: 'bottom-right' | 'bottom-left';

  /** Initial greeting message displayed when chat opens */
  greeting?: string;

  /** Brand colour (hex, e.g., "#6366f1").
   *  Applied to the chat bubble button background.
   *  Default: "#6366f1" (Indigo 500). */
  accentColor?: string;

  /** Avatar URL for the bot displayed in the chat interface */
  avatarUrl?: string;

  /** Identify the current user — passed to the iframe as URL params.
   *  Can be updated later via chat.setUser(). */
  user?: ChatUser;

  /** Custom CSS class */
  className?: string;

  /** Chat window width. Default: "380px" */
  width?: string;

  /** Chat window height. Default: "560px" */
  height?: string;

  // Callbacks
  onMessage?: EventHandler<ChatMessagePayload>;
  onOpen?: EventHandler<void>;
  onClose?: EventHandler<void>;
  onReady?: EventHandler<void>;
}

export interface ChatUser {
  /** User identifier (passed as userId URL param) */
  id?: string;
  /** Display name (passed as userName URL param) */
  name?: string;
  /** Email address (passed as userEmail URL param) */
  email?: string;
  /** User avatar URL */
  avatarUrl?: string;
  /** Arbitrary metadata passed to the chat backend.
   *  Useful for passing plan, company, or custom context. */
  metadata?: Record<string, unknown>;
}

export interface ChatMessagePayload {
  /** Unique message identifier (server-assigned UUID) */
  messageId: string;
  /** Sender role: 'user' for visitor messages, 'assistant' for AI/bot responses */
  role: 'user' | 'assistant';
  /** Message content (plain text or markdown) */
  content: string;
  /** ISO 8601 timestamp of when the message was created */
  timestamp: string;
}

export interface ChatEmbed extends EventEmitter {
  readonly embedId: string;

  /** Open the chat window (scale + opacity animation, 200ms).
   *  No-op if already open or destroyed. Emits 'open' event. */
  open(): void;

  /** Close the chat window (reverse animation).
   *  No-op if already closed. Emits 'close' event.
   *  The chat bubble remains visible. */
  close(): void;

  /** Toggle the chat window open/closed.
   *  Equivalent to: isOpen ? close() : open() */
  toggle(): void;

  /** Update the current user identity.
   *  Sends a postMessage to the iframe: { type: "chat:setUser", payload: user }.
   *  Use after login to associate the conversation with a known user. */
  setUser(user: ChatUser): void;

  /** Send a message programmatically.
   *  Sends a postMessage to the iframe: { type: "chat:sendMessage", payload: { content } }.
   *  Useful for contextual messages based on page navigation. */
  sendMessage(content: string): void;

  /** Destroy the chat embed — removes bubble + window from DOM.
   *  Cleans up all listeners and unregisters from SDK. */
  destroy(): void;
}
```

---

## MCVEmbed Singleton (Core Implementation)

The SDK uses a singleton pattern. One global instance manages all embed instances and the shared postMessage listener.

```typescript
class MCVEmbed {
  // ═══════════════════════════════════════════════════════════════════════════
  // SINGLETON STATE
  // ═══════════════════════════════════════════════════════════════════════════

  private static _instance: MCVEmbed | null = null;

  /** SDK configuration (set by init, null before init) */
  private _config: MCVEmbedConfig | null = null;

  /** Active embed instances tracked by embedId */
  private _embeds: Map<string, { destroy(): void }> = new Map();

  /** The single global window.addEventListener('message') handler */
  private _messageListener: ((e: MessageEvent) => void) | null = null;

  /** Per-embedId message handlers — dispatched by the global listener */
  private _messageHandlers: Map<string, Set<(msg: EmbedMessage) => void>> = new Map();

  // ═══════════════════════════════════════════════════════════════════════════
  // STATIC API (Public)
  // ═══════════════════════════════════════════════════════════════════════════

  /** Get or create the singleton instance */
  static getInstance(): MCVEmbed;

  /** Initialize the SDK. Must be called before creating embeds.
   *  Copies config, attaches global postMessage listener.
   *  Idempotent: re-calling updates config. */
  static init(config: MCVEmbedConfig): MCVEmbed;

  /** Destroy everything: all embeds, global listener, config, singleton. */
  static destroy(): void;

  // ═══════════════════════════════════════════════════════════════════════════
  // EMBED FACTORIES (Static)
  // ═══════════════════════════════════════════════════════════════════════════

  /** Create a form embed instance. Registers in _embeds map. */
  static form(formId: string, options?: FormEmbedOptions): FormEmbed;

  /** Create a booking embed instance. Registers in _embeds map. */
  static booking(slug: string, options?: BookingEmbedOptions): BookingEmbed;

  /** Create a chat embed instance. Registers in _embeds map.
   *  Chat auto-mounts a floating bubble immediately (unlike popup/slide-in). */
  static chat(options?: ChatEmbedOptions): ChatEmbed;

  // ═══════════════════════════════════════════════════════════════════════════
  // INTERNAL MESSAGE BUS
  // ═══════════════════════════════════════════════════════════════════════════

  /** Register a handler for messages targeting a specific embedId */
  onMessage(embedId: string, handler: (msg: EmbedMessage) => void): void;

  /** Remove a message handler for an embedId */
  offMessage(embedId: string, handler: (msg: EmbedMessage) => void): void;

  /** Remove an embed from the tracked set (called by embed.destroy()) */
  unregisterEmbed(embedId: string): void;

  // ═══════════════════════════════════════════════════════════════════════════
  // INTERNAL
  // ═══════════════════════════════════════════════════════════════════════════

  /** Accessor for config — throws if not initialized */
  get config(): MCVEmbedConfig;

  /** Attach global window.message listener (idempotent) */
  private _attachGlobalListener(): void;

  /** Detach global listener */
  private _detachGlobalListener(): void;

  /** Debug log (only if config.debug === true) */
  _debug(...args: unknown[]): void;
}
```

### Lifecycle Flow

```
MCVEmbed.init(config)
    │
    ├── Creates singleton instance (if needed)
    ├── Stores config copy
    └── Attaches global postMessage listener (once)
         │
         ├── On MessageEvent:
         │   ├── parseMessage(event) → null? → ignore
         │   ├── EmbedMessage.ns !== 'mcv-embed'? → ignore
         │   ├── Lookup _messageHandlers.get(msg.embedId)
         │   └── Dispatch to all registered handlers for that embedId
         │
MCVEmbed.form('id')  /  MCVEmbed.booking('slug')  /  MCVEmbed.chat()
    │
    ├── Calls factory function (createFormEmbed, etc.)
    ├── Generates unique embedId via generateId()
    ├── Creates BaseEventEmitter for this instance
    ├── Registers message handler in SDK via sdk.onMessage(embedId, ...)
    ├── Registers embed in SDK via _embeds.set(embedId, embed)
    └── Returns typed embed instance (FormEmbed, etc.)
         │
embed.open()
    │
    ├── Creates sandboxed iframe with built URL
    ├── Creates wrapper div + overlay (popup/slide-in)
    ├── Mounts to DOM (document.body for popup/slide-in, container for inline)
    └── For slide-in: requestAnimationFrame → transform animation
         │
embed.destroy()
    │
    ├── Sets destroyed = true (prevents further operations)
    ├── Calls close() to remove DOM elements
    ├── emitter.removeAllListeners()
    ├── sdk.offMessage(embedId, handler)
    └── sdk.unregisterEmbed(embedId) → removes from _embeds + _messageHandlers
         │
MCVEmbed.destroy()
    │
    ├── Iterates all _embeds → calls each .destroy()
    ├── Clears _embeds map
    ├── Detaches global postMessage listener
    ├── Clears _messageHandlers map
    ├── Nulls _config
    └── Nulls _instance (re-init required to use SDK again)
```

---

## Utility Functions (Internal + Exported)

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTED UTILITIES (import { generateId, buildUrl, parseMessage } from '@mcv/embed')
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate a short unique ID for an embed instance.
 * Format: "{prefix}-{Date.now().toString(36)}-{counter.toString(36)}"
 * Counter increments monotonically to guarantee uniqueness within a page session.
 *
 * @example generateId('form')  → "form-lq3k5f2-1"
 * @example generateId('chat')  → "chat-lq3k5f3-2"
 */
export function generateId(prefix?: string): string;

/**
 * Build a full URL from a base, path, and query params.
 * Uses the URL API for safe encoding — no string concatenation.
 * Undefined values are silently omitted from the query string.
 *
 * @example buildUrl('https://app.mcv.one', '/embed/form/contact', {
 *   tenantId: 'venture_abc123', embedId: 'form-xxx', token: undefined
 * })
 * // → "https://app.mcv.one/embed/form/contact?tenantId=venture_abc123&embedId=form-xxx"
 */
export function buildUrl(
  base: string,
  path: string,
  params?: Record<string, string | undefined>,
): string;

/**
 * Type-guard for messages originating from MCV embeds.
 * Returns null if: data is not an object, or ns !== 'mcv-embed'.
 *
 * @example
 * window.addEventListener('message', (event) => {
 *   const msg = parseMessage(event);
 *   if (msg) console.log(msg.type, msg.payload);
 * });
 */
export function parseMessage(event: MessageEvent): EmbedMessage | null;

// ═══════════════════════════════════════════════════════════════════════════════
// INTERNAL UTILITIES (not exported from index.ts)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Resolve a container reference to an HTMLElement.
 * String → document.querySelector(). HTMLElement → passthrough. Undefined → null.
 */
export function resolveContainer(ref: HTMLElement | string | undefined): HTMLElement | null;

/**
 * Create a sandboxed iframe element with standard security attributes.
 * sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
 * allow="clipboard-write"
 * Applies optional CSSStyleDeclaration overrides.
 */
export function createIframe(
  src: string,
  id: string,
  styles?: Partial<CSSStyleDeclaration>,
): HTMLIFrameElement;

/**
 * Send a postMessage to an iframe's content window.
 * Wraps the payload in the EmbedMessage envelope with ns: 'mcv-embed'.
 * Uses '*' as targetOrigin (iframe origin is same as baseUrl).
 */
export function postToIframe(
  iframe: HTMLIFrameElement,
  type: string,
  embedId: string,
  payload?: unknown,
): void;

/**
 * Create the full-screen overlay backdrop for popup/slide-in modes.
 * Semi-transparent black (rgba(0,0,0,0.5)), opacity transition 0.2s.
 * Optional onClick handler (typically triggers close()).
 */
export function createOverlay(onClick?: () => void): HTMLDivElement;

/**
 * Remove an element from the DOM if it exists.
 * Safe: handles null/undefined gracefully.
 */
export function removeElement(el: HTMLElement | null | undefined): void;
```

---

## PostMessage Protocol

All communication between the host page and embedded iframes uses `window.postMessage` with the `mcv-embed` namespace.

### Message Envelope

Every message follows the same structure:

```typescript
{
  ns: 'mcv-embed',        // Namespace filter — ALWAYS "mcv-embed"
  embedId: string,         // Unique embed instance ID (e.g., "form-lq3k5f2-1")
  type: string,            // Event type (e.g., "form:submitted")
  payload?: unknown        // Event-specific data
}
```

### Message Flow Diagram

```
Host Page                              Sandboxed Iframe
    │                                        │
    │  ── iframe.src loads ──────────────►   │
    │                                        │
    │  ◄── { ns: "mcv-embed",               │
    │        embedId: "form-abc",            │
    │        type: "form:loaded" }           │
    │                                        │
    │  [User interacts with form]            │
    │                                        │
    │  ◄── { ns: "mcv-embed",               │
    │        embedId: "form-abc",            │
    │        type: "form:submitted",         │
    │        payload: {                      │
    │          formId: "contact",            │
    │          data: { name: "Jane", ... },  │
    │          submissionId: "uuid-xxx"      │
    │        }                               │
    │      }                                 │
    │                                        │
    │  ── postToIframe("chat:setUser",  ──►  │
    │     embedId, { id, name })             │
    │                                        │
    │  ── postToIframe("chat:sendMessage",►  │
    │     embedId, { content: "Hello" })     │
    │                                        │
```

### Event Types by Embed Module

#### Form Events (iframe → host)

| postMessage type | Emitter event | Payload | Description |
|-----------------|---------------|---------|-------------|
| `form:loaded` | `load` | — | Form iframe finished loading |
| `form:submitted` | `submit` | `FormSubmitPayload` | Form successfully submitted |
| `form:error` | `error` | `FormErrorPayload` | Form validation or submission error |
| `form:close` | `close` | — | User requested close (triggers close()) |

#### Booking Events (iframe → host)

| postMessage type | Emitter event | Payload | Description |
|-----------------|---------------|---------|-------------|
| `booking:loaded` | `load` | — | Booking calendar loaded |
| `booking:booked` | `book` | `BookingPayload` | Booking confirmed by server |
| `booking:slotSelected` | `slotSelect` | `SlotSelectPayload` | User selected a time slot |
| `booking:error` | `error` | `BookingErrorPayload` | Booking error (e.g., slot unavailable) |
| `booking:close` | `close` | — | User requested close |

#### Chat Events (iframe → host)

| postMessage type | Emitter event | Payload | Description |
|-----------------|---------------|---------|-------------|
| `chat:ready` | `ready` | — | Chat widget initialized and ready |
| `chat:message` | `message` | `ChatMessagePayload` | New message (user or assistant) |
| `chat:close` | `close` | — | User requested close |

#### Chat Commands (host → iframe)

| postMessage type | Triggered by | Payload | Description |
|-----------------|-------------|---------|-------------|
| `chat:setUser` | `chat.setUser(user)` | `ChatUser` | Update user identity in chat |
| `chat:sendMessage` | `chat.sendMessage(text)` | `{ content: string }` | Send a message programmatically |

---

## Iframe Sandboxing & DOM Structure

### Sandbox Attributes

All iframes are created with restrictive sandboxing:

```html
<iframe
  id="{embedId}"
  src="{baseUrl}/embed/{type}/{id}?tenantId=...&embedId=..."
  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
  allow="clipboard-write"
  style="border: none; color-scheme: normal;"
/>
```

| Permission | Why Needed | Security Impact |
|------------|------------|-----------------|
| `allow-scripts` | iframe JavaScript must execute | Required for any interactive embed |
| `allow-same-origin` | Required for postMessage origin checks and cookies | Allows iframe to access its own origin's storage |
| `allow-forms` | Form submission within the iframe | Only affects iframe's own domain |
| `allow-popups` | OAuth flows, payment redirects | Opens new windows (no top navigation) |
| `clipboard-write` | Copy-to-clipboard in chat | Write-only clipboard access |

**Explicitly NOT granted:**
- `allow-top-navigation` — The embed **cannot** redirect the host page
- `allow-top-navigation-by-user-activation` — Not even on click
- `allow-modals` — No `alert()`, `confirm()`, `prompt()` in iframe
- `allow-pointer-lock` — No pointer capture

### DOM Structure by Mode

#### Popup Mode

```html
<body>
  <!-- Existing page content -->

  <!-- Overlay (z-index: 999998) -->
  <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); opacity: 1; transition: opacity 0.2s ease;">
  </div>

  <!-- Wrapper (z-index: 999999) -->
  <div id="mcv-embed-{embedId}" class="{className?}"
       style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
              width: {width|560px}; height: {height|680px}; max-width: 95vw; max-height: 90vh;
              background: #fff; border-radius: 12px; overflow: hidden;
              box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);">
    <iframe id="{embedId}" sandbox="..." allow="clipboard-write"
            style="width: 100%; height: 100%; border: none; color-scheme: normal;" />
  </div>
</body>
```

#### Slide-in Mode

```html
<body>
  <!-- Overlay -->
  <div style="position: fixed; inset: 0; ..."></div>

  <!-- Wrapper — slides from right -->
  <div id="mcv-embed-{embedId}" class="{className?}"
       style="position: fixed; top: 0; right: 0; bottom: 0;
              width: {width|440px}; max-width: 95vw;
              background: #fff; transform: translateX(0);
              transition: transform 0.3s ease;
              box-shadow: -4px 0 24px rgba(0,0,0,0.15);">
    <iframe ... style="width: 100%; height: 100%; ..." />
  </div>
</body>
```

#### Chat Mode

```html
<body>
  <!-- Chat window (initially hidden via scale(0.9) + opacity: 0) -->
  <div id="mcv-chat-{embedId}" class="{className?}"
       style="position: fixed; bottom: 88px; {right|left}: 20px;
              width: {width|380px}; height: {height|560px};
              max-height: calc(100vh - 108px); max-width: calc(100vw - 40px);
              border-radius: 12px; overflow: hidden;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
              transform: scale(0.9); opacity: 0;
              transform-origin: {bottom right|bottom left};
              transition: transform 0.2s ease, opacity 0.2s ease;
              pointer-events: none;">
    <iframe ... />
  </div>

  <!-- Chat bubble button (always visible) -->
  <button id="mcv-chat-bubble-{embedId}" aria-label="Open chat"
          style="position: fixed; bottom: 20px; {right|left}: 20px;
                 width: 56px; height: 56px; border-radius: 50%;
                 background: {accentColor|#6366f1}; color: #fff;
                 border: none; cursor: pointer;
                 box-shadow: 0 4px 14px rgba(0,0,0,0.2);
                 display: flex; align-items: center; justify-content: center;
                 transition: transform 0.2s ease;">
    <svg ...><!-- Chat icon --></svg>
  </button>
</body>
```

---

## Database Schemas (Server-Side)

The `@mcv/embed` package is a **client-side only** SDK — it has **no direct database dependencies**. All data persistence happens on the MCV.ONE server side when the embedded iframes communicate with the application backend.

The following schemas power the server endpoints that the embeds interact with:

### ventures Table (Tenant Resolution)

The `tenantId` passed to `MCVEmbed.init()` resolves against this table:

```typescript
// Schema: packages/db/src/schema/ventures.ts

export const ventures = pgTable('ventures', {
  id:           uuid('id').primaryKey().defaultRandom(),
  slug:         text('slug').unique().notNull(),
  name:         text('name').notNull(),
  description:  text('description'),
  logoUrl:      text('logo_url'),
  brandColors:  jsonb('brand_colors').$type<BrandColors>(),
  settings:     jsonb('settings').$type<VentureSettings>(),
  features:     jsonb('features').$type<Record<string, boolean>>(),
  metadata:     jsonb('metadata'),
  status:       text('status', {
    enum: ['active', 'suspended', 'archived', 'pending']
  }).default('active'),
  tier:         text('tier', {
    enum: ['free', 'starter', 'professional', 'enterprise']
  }).default('free'),
  domain:       text('domain'),              // Custom domain
  parentId:     uuid('parent_id'),           // Sub-venture hierarchy
  createdAt:    timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

interface VentureSettings {
  allowPublicRegistration?: boolean;
  requireEmailVerification?: boolean;
  requireMfa?: boolean;
  sessionDurationHours?: number;
  maxSessionsPerUser?: number;
}

interface BrandColors {
  primary: string;
  accent?: string;
  background?: string;
  foreground?: string;
}
```

### forms + form_fields + form_submissions Tables (Form Embeds)

```typescript
// Schema: packages/db/src/schema/forms.ts

// ── forms ───────────────────────────────────────────────────────────
export const forms = pgTable('forms', {
  id:               uuid('id').primaryKey().defaultRandom(),
  ventureId:        uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  createdById:      uuid('created_by_id').references(() => users.id, { onDelete: 'set null' }),
  name:             text('name').notNull(),
  description:      text('description'),
  slug:             text('slug'),
  type:             text('type', { enum: ['form', 'survey', 'quiz'] }).notNull().default('form'),
  status:           text('status', { enum: ['draft', 'published', 'archived', 'closed'] }).notNull().default('draft'),
  version:          integer('version').notNull().default(1),
  publishedVersion: integer('published_version'),
  publishedAt:      timestamp('published_at', { withTimezone: true }),
  settings:         jsonb('settings').$type<FormSettings>().default({}),
  styling:          jsonb('styling').$type<FormStyling>().default({}),
  submissionCount:  integer('submission_count').notNull().default(0),
  viewCount:        integer('view_count').notNull().default(0),
  folderId:         uuid('folder_id'),
  tags:             text('tags').array().default([]),
  createdAt:        timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:        timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  archivedAt:       timestamp('archived_at', { withTimezone: true }),
});

// Indexes: venture, status, type, venture+status, slug

// ── form_fields ─────────────────────────────────────────────────────
export const formFields = pgTable('form_fields', {
  id:                   uuid('id').primaryKey().defaultRandom(),
  formId:               uuid('form_id').notNull().references(() => forms.id, { onDelete: 'cascade' }),
  type:                 text('type', { enum: formFieldTypes }).notNull(), // 28 field types
  label:                text('label').notNull(),
  name:                 text('name').notNull(),
  placeholder:          text('placeholder'),
  helpText:             text('help_text'),
  defaultValue:         text('default_value'),
  position:             integer('position').notNull().default(0),
  stepIndex:            integer('step_index').notNull().default(0),
  width:                text('width').default('full'),
  columnSpan:           integer('column_span').default(1),
  required:             boolean('required').notNull().default(false),
  hidden:               boolean('hidden').notNull().default(false),
  readOnly:             boolean('read_only').notNull().default(false),
  validation:           jsonb('validation').$type<FieldValidation>().default({}),
  conditionalLogic:     jsonb('conditional_logic').$type<ConditionalLogic>(),
  options:              jsonb('options').$type<FieldOption[]>().default([]),
  contactFieldMapping:  text('contact_field_mapping'),
  customFieldKey:       text('custom_field_key'),
  correctAnswer:        text('correct_answer'),          // Quiz
  points:               integer('points').default(0),     // Quiz
  createdAt:            timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:            timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 28 supported field types:
// text, email, phone, textarea, number, url, select, multi_select,
// checkbox, radio, date, datetime, time, file, image, rating, nps,
// scale, hidden, html, signature, payment, address, name, heading,
// paragraph, divider, spacer

// ── form_submissions ────────────────────────────────────────────────
export const formSubmissions = pgTable('form_submissions', {
  id:                      uuid('id').primaryKey().defaultRandom(),
  formId:                  uuid('form_id').notNull().references(() => forms.id, { onDelete: 'cascade' }),
  ventureId:               uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  contactId:               uuid('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
  data:                    jsonb('data').$type<Record<string, unknown>>().notNull().default({}),
  formVersion:             integer('form_version').notNull().default(1),
  source:                  text('source', {
    enum: ['embed', 'direct', 'workflow', 'api', 'import']
  }).notNull().default('direct'),
  referrerUrl:             text('referrer_url'),
  ipAddress:               text('ip_address'),
  userAgent:               text('user_agent'),
  completedSteps:          integer('completed_steps').notNull().default(0),
  totalSteps:              integer('total_steps').notNull().default(1),
  isPartial:               boolean('is_partial').notNull().default(false),
  score:                   integer('score'),              // Quiz
  maxScore:                integer('max_score'),           // Quiz
  passed:                  boolean('passed'),              // Quiz
  isRead:                  boolean('is_read').notNull().default(false),
  isSpam:                  boolean('is_spam').notNull().default(false),
  notes:                   text('notes'),
  confirmed:               boolean('confirmed').notNull().default(false),
  confirmedAt:             timestamp('confirmed_at', { withTimezone: true }),
  fileUrls:                jsonb('file_urls').$type<Record<string, string[]>>().default({}),
  startedAt:               timestamp('started_at', { withTimezone: true }),
  submittedAt:             timestamp('submitted_at', { withTimezone: true }).defaultNow().notNull(),
  completionTimeSeconds:   integer('completion_time_seconds'),
});

// Note: form_submissions.source = 'embed' for all submissions via @mcv/embed

// ── form_analytics (denormalized daily rollups) ─────────────────────
export const formAnalytics = pgTable('form_analytics', {
  id:                          uuid('id').primaryKey().defaultRandom(),
  formId:                      uuid('form_id').notNull().references(() => forms.id),
  date:                        date('date').notNull(),
  views:                       integer('views').notNull().default(0),
  uniqueViews:                 integer('unique_views').notNull().default(0),
  starts:                      integer('starts').notNull().default(0),
  completions:                 integer('completions').notNull().default(0),
  partialSubmissions:          integer('partial_submissions').notNull().default(0),
  conversionRate:              real('conversion_rate').notNull().default(0),
  startRate:                   real('start_rate').notNull().default(0),
  completionRate:              real('completion_rate').notNull().default(0),
  avgCompletionTimeSeconds:    integer('avg_completion_time_seconds'),
  medianCompletionTimeSeconds: integer('median_completion_time_seconds'),
  sourceBreakdown:             jsonb('source_breakdown').$type<Record<string, number>>(),
  dropoffByStep:               jsonb('dropoff_by_step').$type<Array<{...}>>(),
  fieldCompletionRates:        jsonb('field_completion_rates').$type<Record<string, {...}>>(),
  deviceBreakdown:             jsonb('device_breakdown').$type<{ desktop; mobile; tablet }>(),
  createdAt:                   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:                   timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### calendars + appointments + booking_pages Tables (Booking Embeds)

```typescript
// Schema: packages/db/src/schema/calendar.ts

// ── calendars ───────────────────────────────────────────────────────
export const calendars = pgTable('calendars', {
  id:            uuid('id').primaryKey().defaultRandom(),
  ventureId:     uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  name:          text('name').notNull(),
  slug:          text('slug').notNull(),           // matches BookingEmbedOptions.slug
  description:   text('description'),
  type:          text('type').$type<CalendarType>().default('personal'),
  //   CalendarType: 'personal' | 'round_robin' | 'collective' | 'class' | 'service'
  timezone:      text('timezone').notNull().default('UTC'),
  teamMemberIds: jsonb('team_member_ids').$type<string[]>().default([]),
  isActive:      boolean('is_active').notNull().default(true),
  color:         text('color').default('#3b82f6'),
  settings:      jsonb('settings').$type<CalendarSettings>().notNull(),
  createdAt:     timestamp('created_at').defaultNow().notNull(),
  updatedAt:     timestamp('updated_at').defaultNow().notNull(),
});

interface CalendarSettings {
  defaultDuration: number;           // minutes
  minNotice: number;                  // minutes before slot
  maxAdvance: number;                 // days ahead
  bufferBefore: number;               // minutes
  bufferAfter: number;                // minutes
  maxPerDay: number | null;
  maxPerSlot: number | null;          // for class calendars
  requiresApproval: boolean;
  confirmationRedirectUrl: string | null;
  allowReschedule: boolean;
  allowCancel: boolean;
  cancelDeadline: number | null;      // minutes before
}

// ── appointments ────────────────────────────────────────────────────
export const appointments = pgTable('appointments', {
  id:                uuid('id').primaryKey().defaultRandom(),
  ventureId:         uuid('venture_id').notNull().references(() => ventures.id),
  calendarId:        uuid('calendar_id').notNull().references(() => calendars.id),
  contactId:         uuid('contact_id').references(() => contacts.id),
  assignedUserId:    uuid('assigned_user_id').references(() => users.id),
  title:             text('title').notNull(),
  description:       text('description'),
  startTime:         timestamp('start_time').notNull(),
  endTime:           timestamp('end_time').notNull(),
  duration:          integer('duration').notNull(),      // minutes
  status:            text('status').$type<AppointmentStatus>().default('scheduled'),
  //   AppointmentStatus: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled'
  meetingLocation:   text('meeting_location'),
  meetingUrl:        text('meeting_url'),
  meetingType:       text('meeting_type').$type<MeetingType>().default('video'),
  notes:             text('notes'),
  cancellationReason: text('cancellation_reason'),
  rescheduledFromId: uuid('rescheduled_from_id'),
  source:            text('source').$type<AppointmentSource>().notNull().default('manual'),
  //   AppointmentSource: 'booking_page' | 'manual' | 'workflow' | 'api'
  customFields:      jsonb('custom_fields').$type<Record<string, unknown>>(),
  createdAt:         timestamp('created_at').defaultNow().notNull(),
  updatedAt:         timestamp('updated_at').defaultNow().notNull(),
});

// ── booking_pages ───────────────────────────────────────────────────
export const bookingPages = pgTable('booking_pages', {
  id:                  uuid('id').primaryKey().defaultRandom(),
  calendarId:          uuid('calendar_id').notNull().references(() => calendars.id),
  ventureId:           uuid('venture_id').notNull().references(() => ventures.id),
  slug:                text('slug').notNull(),        // unique
  title:               text('title').notNull(),
  description:         text('description'),
  logoUrl:             text('logo_url'),
  primaryColor:        text('primary_color').default('#3b82f6'),
  backgroundColor:     text('background_color').default('#ffffff'),
  showTimezone:        boolean('show_timezone').notNull().default(true),
  showAvatar:          boolean('show_avatar').notNull().default(true),
  customCss:           text('custom_css'),
  formFields:          jsonb('form_fields').$type<BookingFormField[]>().default([]),
  confirmationMessage: text('confirmation_message'),
  redirectUrl:         text('redirect_url'),
  isActive:            boolean('is_active').notNull().default(true),
  createdAt:           timestamp('created_at').defaultNow().notNull(),
  updatedAt:           timestamp('updated_at').defaultNow().notNull(),
});

interface BookingFormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox';
  required: boolean;
  options?: string[];
  placeholder?: string;
}
```

### conversations + messages Tables (Chat Embeds)

```typescript
// Schema: packages/db/src/schema/conversations.ts + messages.ts

// ── conversations ───────────────────────────────────────────────────
export const conversations = pgTable('conversations', {
  id:              uuid('id').primaryKey().defaultRandom(),
  ventureId:       uuid('venture_id').notNull().references(() => ventures.id, { onDelete: 'cascade' }),
  contactId:       uuid('contact_id').references(() => contacts.id),
  channel:         text('channel', {
    enum: ['email', 'sms', 'voice', 'chat', 'whatsapp']
  }).notNull(),
  status:          text('status', {
    enum: ['open', 'pending', 'resolved', 'closed']
  }).notNull().default('open'),
  priority:        text('priority', {
    enum: ['low', 'normal', 'high', 'urgent']
  }).default('normal'),
  subject:         text('subject'),
  assignedTo:      uuid('assigned_to').references(() => users.id),
  queueId:         uuid('queue_id').references(() => queues.id),
  firstResponseAt: timestamp('first_response_at', { withTimezone: true }),
  resolvedAt:      timestamp('resolved_at', { withTimezone: true }),
  metadata:        jsonb('metadata').$type<ConversationMetadata>().default({}),
  tags:            jsonb('tags').$type<string[]>().default([]),
  createdAt:       timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Chat embeds create conversations with channel: 'chat'
// ConversationMetadata includes: chatSessionId, aiSummary, sentiment, suggestedResponses

// ── messages ────────────────────────────────────────────────────────
export const messages = pgTable('messages', {
  id:              uuid('id').primaryKey().defaultRandom(),
  conversationId:  uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  direction:       text('direction', { enum: ['inbound', 'outbound'] }).notNull(),
  channel:         text('channel', { enum: ['email', 'sms', 'voice', 'chat', 'whatsapp'] }).notNull(),
  fromAddress:     text('from_address').notNull(),
  toAddress:       text('to_address').notNull(),
  subject:         text('subject'),
  body:            text('body'),
  htmlBody:        text('html_body'),
  status:          text('status', {
    enum: ['pending', 'sent', 'delivered', 'failed', 'bounced']
  }).notNull().default('pending'),
  externalId:      text('external_id'),
  attachments:     jsonb('attachments').$type<MessageAttachment[]>().default([]),
  metadata:        jsonb('metadata').$type<MessageMetadata>().default({}),
  sentAt:          timestamp('sent_at', { withTimezone: true }),
  deliveredAt:     timestamp('delivered_at', { withTimezone: true }),
  readAt:          timestamp('read_at', { withTimezone: true }),
  createdAt:       timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Chat messages use channel: 'chat'
// direction: 'inbound' = user message, 'outbound' = assistant response
```

### Schema Relationship Map

```
┌──────────────────────────────────────────────────────────────────────┐
│                        DATABASE RELATIONSHIPS                         │
│                                                                       │
│  ventures ◄────────────────────────────────────────────────────────┐ │
│     │                                                               │ │
│     ├──► forms ──► form_fields                                      │ │
│     │     │                                                          │ │
│     │     ├──► form_submissions ──► contacts                        │ │
│     │     ├──► form_analytics                                        │ │
│     │     └──► form_versions                                         │ │
│     │                                                                │ │
│     ├──► calendars ──► calendar_availability                        │ │
│     │     │             calendar_overrides                           │ │
│     │     │                                                          │ │
│     │     ├──► appointments ──► appointment_reminders                │ │
│     │     │        │            appointment_attendees                │ │
│     │     │        └──► contacts                                     │ │
│     │     │                                                          │ │
│     │     ├──► booking_pages                                         │ │
│     │     └──► round_robin_config                                    │ │
│     │                                                                │ │
│     └──► conversations ──► messages                                  │ │
│              │                                                       │ │
│              └──► contacts                                           │ │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Code Examples

### Example 1: Initialize the SDK

```typescript
import { MCVEmbed } from '@mcv/embed';

// Initialize once — typically in your app's entry point
const sdk = MCVEmbed.init({
  baseUrl: 'https://app.mcv.one',
  tenantId: 'venture_abc123',
  token: 'eyJhbGciOiJIUzI1NiIs...', // Optional: for authenticated embeds
  debug: true,                        // Console logging for development
});
```

### Example 2: Embed a Form (Popup Mode)

```typescript
import { MCVEmbed } from '@mcv/embed';

MCVEmbed.init({
  baseUrl: 'https://app.mcv.one',
  tenantId: 'venture_abc123',
});

// Create a popup form with pre-filled data
const form = MCVEmbed.form('contact-form-v2', {
  mode: 'popup',
  width: '600px',
  height: '700px',
  prefill: {
    name: 'Jane Doe',
    email: 'jane@example.com',
    plan: 'enterprise',
  },
  onSubmit: (payload) => {
    console.log('Form submitted!', payload.submissionId);
    console.log('Data:', payload.data);
    // Track conversion in analytics
    analytics.track('form_submitted', {
      formId: payload.formId,
      submissionId: payload.submissionId,
    });
  },
  onError: (err) => {
    console.error(`Form error [${err.code}]: ${err.message}`);
  },
  onClose: () => {
    console.log('Form closed by user');
  },
});

// Open the form when user clicks a button
document.getElementById('open-form')?.addEventListener('click', () => {
  form.open();
});
```

### Example 3: Embed a Form (Inline Mode — Auto-Mounts)

```typescript
import { MCVEmbed } from '@mcv/embed';

MCVEmbed.init({
  baseUrl: 'https://app.mcv.one',
  tenantId: 'venture_abc123',
});

// Inline form — renders immediately into the container
// No need to call form.open() — inline mode auto-mounts on creation
const form = MCVEmbed.form('signup-form', {
  mode: 'inline',
  container: '#form-container',     // CSS selector or HTMLElement reference
  width: '100%',
  height: '500px',
  onSubmit: (payload) => {
    // Replace the form container with a thank-you message
    document.getElementById('form-container')!.innerHTML =
      '<p class="text-green-600">Thanks for signing up!</p>';
  },
});
```

### Example 4: Embed a Form (Slide-in Mode)

```typescript
import { MCVEmbed } from '@mcv/embed';

MCVEmbed.init({
  baseUrl: 'https://app.mcv.one',
  tenantId: 'venture_abc123',
});

// Slide-in panel from the right edge (300ms CSS transition)
const form = MCVEmbed.form('feedback-form', {
  mode: 'slide-in',
  width: '440px',
  onSubmit: (payload) => {
    console.log('Feedback received:', payload.data);
    form.close(); // Auto-close after submission
  },
});

// Trigger slide-in on button click
document.getElementById('feedback-btn')?.addEventListener('click', () => {
  form.open();
});
```

### Example 5: Embed a Booking Calendar (Popup)

```typescript
import { MCVEmbed } from '@mcv/embed';

MCVEmbed.init({
  baseUrl: 'https://app.mcv.one',
  tenantId: 'venture_abc123',
});

const booking = MCVEmbed.booking('consultation-30min', {
  mode: 'popup',
  width: '640px',
  height: '720px',
  date: '2026-03-15',                  // Pre-select date
  timezone: 'America/Toronto',         // Override timezone

  onSlotSelect: (slot) => {
    console.log(`Slot selected: ${slot.startTime} - ${slot.endTime}`);
  },

  onBook: (payload) => {
    console.log('Booking confirmed!');
    console.log(`ID: ${payload.bookingId}`);
    console.log(`Time: ${payload.startTime} - ${payload.endTime}`);
    console.log('Attendee:', payload.attendee);
    // Redirect to confirmation page
    window.location.href = `/booking/confirmed/${payload.bookingId}`;
  },

  onError: (err) => {
    alert(`Booking failed: ${err.message}`);
  },
});

document.getElementById('book-call')?.addEventListener('click', () => {
  booking.open();
});
```

### Example 6: Inline Booking with Auto-Detected Timezone

```typescript
import { MCVEmbed } from '@mcv/embed';

MCVEmbed.init({
  baseUrl: 'https://app.mcv.one',
  tenantId: 'venture_abc123',
});

const booking = MCVEmbed.booking('demo-call-45min', {
  mode: 'inline',
  container: document.getElementById('booking-widget')!,
  width: '100%',
  height: '600px',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Auto-detect
  onBook: (payload) => {
    console.log('Demo booked:', payload.bookingId);
  },
});
// Auto-mounts — no .open() needed
```

### Example 7: AI Chat Widget with User Identification

```typescript
import { MCVEmbed } from '@mcv/embed';

MCVEmbed.init({
  baseUrl: 'https://app.mcv.one',
  tenantId: 'venture_abc123',
  token: 'eyJhbGciOiJIUzI1NiIs...', // Authenticated for user context
});

const chat = MCVEmbed.chat({
  position: 'bottom-right',
  greeting: 'Hi! 👋 How can I help you today?',
  accentColor: '#6366f1',
  avatarUrl: 'https://app.mcv.one/assets/bot-avatar.png',
  width: '380px',
  height: '560px',

  user: {
    id: 'user_xyz789',
    name: 'Jane Doe',
    email: 'jane@example.com',
    metadata: { plan: 'enterprise', company: 'Acme Corp' },
  },

  onMessage: (msg) => {
    console.log(`[${msg.role}] ${msg.content}`);
    if (msg.role === 'assistant' && msg.content.includes('handoff')) {
      startLiveChat(); // Trigger live agent handoff
    }
  },

  onReady: () => {
    console.log('Chat widget loaded and ready');
  },
});

// Chat bubble auto-mounts on page load
// User clicks bubble to open/close, or control programmatically:
// chat.open(), chat.close(), chat.toggle()
```

### Example 8: Programmatic Chat Control

```typescript
import { MCVEmbed } from '@mcv/embed';

MCVEmbed.init({
  baseUrl: 'https://app.mcv.one',
  tenantId: 'venture_abc123',
});

const chat = MCVEmbed.chat({
  position: 'bottom-left',
  accentColor: '#10b981',
});

// Open chat after user spends 30 seconds on the page
setTimeout(() => {
  chat.open();
}, 30000);

// Send a contextual message when user visits pricing page
if (window.location.pathname === '/pricing') {
  chat.sendMessage('I have questions about your pricing plans');
}

// Update user identity after login
function onUserLogin(user: { id: string; name: string; email: string }) {
  chat.setUser({
    id: user.id,
    name: user.name,
    email: user.email,
  });
}
```

### Example 9: Multiple Embeds on One Page

```typescript
import { MCVEmbed } from '@mcv/embed';

MCVEmbed.init({
  baseUrl: 'https://app.mcv.one',
  tenantId: 'venture_abc123',
});

// All three embed types coexist — each has its own embedId and event scope
const contactForm = MCVEmbed.form('contact-us', { mode: 'popup' });
const bookDemo = MCVEmbed.booking('product-demo', { mode: 'slide-in' });
const supportChat = MCVEmbed.chat({
  position: 'bottom-right',
  greeting: 'Need help? Ask away!',
});

// Independent event handlers — no conflicts between embeds
contactForm.on('submit', (payload) => {
  console.log('Form submitted:', payload.submissionId);
});
bookDemo.on('book', (payload) => {
  console.log('Demo booked:', payload.bookingId);
});
supportChat.on('message', (msg) => {
  console.log('Chat:', msg.role, msg.content);
});

// Clean up everything at once when navigating away
window.addEventListener('beforeunload', () => {
  MCVEmbed.destroy();
});
```

### Example 10: Event-Driven Integration with Analytics & CRM

```typescript
import { MCVEmbed } from '@mcv/embed';

MCVEmbed.init({
  baseUrl: 'https://app.mcv.one',
  tenantId: 'venture_abc123',
  debug: process.env.NODE_ENV === 'development',
});

const form = MCVEmbed.form('lead-capture', {
  mode: 'popup',
  onLoad: () => {
    analytics.track('embed_form_loaded', { formId: 'lead-capture' });
  },
  onSubmit: (payload) => {
    // Track in analytics
    analytics.track('embed_form_submitted', {
      formId: payload.formId,
      submissionId: payload.submissionId,
    });
    // Push to CRM
    fetch('/api/crm/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload.data),
    });
    // Track in Google Tag Manager
    window.dataLayer?.push({
      event: 'form_submission',
      formId: payload.formId,
    });
  },
  onClose: () => {
    analytics.track('embed_form_closed', { formId: 'lead-capture' });
  },
});

const chat = MCVEmbed.chat({
  onMessage: (msg) => {
    if (msg.role === 'user') {
      analytics.track('embed_chat_user_message', {
        messageId: msg.messageId,
        contentLength: msg.content.length,
      });
    }
  },
});
```

### Example 11: Using Utility Functions Directly

```typescript
import { generateId, buildUrl, parseMessage } from '@mcv/embed';

// Generate a unique ID
const id = generateId('custom'); // "custom-lq3k5f2-1"

// Build a parameterized URL
const url = buildUrl('https://app.mcv.one', '/embed/form/my-form', {
  tenantId: 'venture_abc123',
  embedId: id,
  token: 'abc123',
  prefill: undefined, // Silently omitted from URL
});
// → "https://app.mcv.one/embed/form/my-form?tenantId=venture_abc123&embedId=custom-lq3k5f2-1&token=abc123"

// Parse postMessage events manually (for custom integrations)
window.addEventListener('message', (event) => {
  const msg = parseMessage(event);
  if (msg) {
    console.log(`Embed ${msg.embedId} sent: ${msg.type}`, msg.payload);
  }
});
```

### Example 12: Extending BaseEventEmitter for Custom Widgets

```typescript
import { BaseEventEmitter } from '@mcv/embed';

// Build custom integrations using the exported event emitter
class MyWidget extends BaseEventEmitter {
  private name: string;

  constructor(name: string) {
    super();
    this.name = name;
  }

  doSomething() {
    this.emit('action', { widget: this.name, timestamp: Date.now() });
  }
}

const widget = new MyWidget('custom');
widget.on('action', (payload) => {
  console.log('Widget action:', payload);
});
widget.doSomething(); // Triggers handler
widget.removeAllListeners(); // Clean up
```

### Example 13: Full-Page Redirect Mode

```typescript
import { MCVEmbed } from '@mcv/embed';

MCVEmbed.init({
  baseUrl: 'https://app.mcv.one',
  tenantId: 'venture_abc123',
});

// Full-page mode navigates away entirely — use for dedicated form pages
const form = MCVEmbed.form('application-form', {
  mode: 'full-page',
});

// WARNING: This will redirect the browser to:
// https://app.mcv.one/embed/form/application-form?tenantId=venture_abc123&embedId=form-xxx
form.open();
// After this line, the current page is gone.
```

### Example 14: Lifecycle Management & Cleanup

```typescript
import { MCVEmbed } from '@mcv/embed';

MCVEmbed.init({
  baseUrl: 'https://app.mcv.one',
  tenantId: 'venture_abc123',
});

const form = MCVEmbed.form('survey', { mode: 'popup' });
const chat = MCVEmbed.chat();

// Destroy individual embed — safe to call multiple times
form.destroy(); // Removes DOM, detaches events, unregisters from SDK

// Destroy everything — SDK, all remaining embeds, global listener
MCVEmbed.destroy();
// After this, MCVEmbed.init() must be called again to use the SDK
```

### Example 15: React Integration

```tsx
import { useEffect, useRef } from 'react';
import { MCVEmbed } from '@mcv/embed';
import type { FormEmbed } from '@mcv/embed';

function ContactFormEmbed({ tenantId }: { tenantId: string }) {
  const formRef = useRef<FormEmbed | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    MCVEmbed.init({
      baseUrl: 'https://app.mcv.one',
      tenantId,
    });

    formRef.current = MCVEmbed.form('contact', {
      mode: 'inline',
      container: containerRef.current!,
      onSubmit: (payload) => {
        console.log('Submitted:', payload.submissionId);
      },
    });

    // Cleanup on unmount
    return () => {
      formRef.current?.destroy();
      MCVEmbed.destroy();
    };
  }, [tenantId]);

  return <div ref={containerRef} style={{ width: '100%', height: 600 }} />;
}

export default ContactFormEmbed;
```

### CDN / Script Tag Integration

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Website</title>
</head>
<body>
  <div id="booking-container"></div>

  <!-- Load from CDN -->
  <script src="https://cdn.mcv.one/embed/v1/mcv-embed.min.js"></script>
  <script>
    // Global MCVEmbed is available after script loads
    MCVEmbed.init({
      baseUrl: 'https://app.mcv.one',
      tenantId: 'my-venture'
    });

    // Inline booking widget
    MCVEmbed.booking('consultation', {
      mode: 'inline',
      container: '#booking-container',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      onBook: function(data) {
        alert('Booked! ID: ' + data.bookingId);
      }
    });

    // Chat widget (always-on)
    MCVEmbed.chat({
      greeting: 'Hi there! How can we help?',
      accentColor: '#0ea5e9'
    });
  </script>
</body>
</html>
```

---

## Display Mode Comparison

| Mode | Overlay | Auto-Mount | DOM Placement | Close Behavior | Animation |
|------|---------|------------|---------------|----------------|-----------|
| `popup` | Semi-transparent backdrop | No (call `.open()`) | Fixed center `(translate(-50%,-50%))` | Click backdrop or `form:close` | Opacity fade (0.2s) |
| `slide-in` | Semi-transparent backdrop | No (call `.open()`) | Fixed right panel `(top:0; right:0; bottom:0)` | Click backdrop, animated slide-out | `translateX` (0.3s ease) |
| `inline` | None | **Yes** (auto-mounts on creation) | Inside `container` element | Manual `.close()` only | None |
| `full-page` | None | No (call `.open()`) | Page redirect (`window.location.href`) | N/A (navigated away) | None |

### Default Dimensions

| Embed Type | Popup Default | Slide-in Default | Inline Default | Chat Window |
|------------|---------------|------------------|----------------|-------------|
| Form | 560px × 680px | 440px wide, full height | 100% × 100% | — |
| Booking | 640px × 720px | 480px wide, full height | 100% × 100% | — |
| Chat | — | — | — | 380px × 560px |

### Responsive Constraints

All modes enforce responsive limits:
- **Popup:** `max-width: 95vw; max-height: 90vh`
- **Slide-in:** `max-width: 95vw`
- **Chat window:** `max-height: calc(100vh - 108px); max-width: calc(100vw - 40px)`

---

## Performance Considerations

### Bundle Size
- **~5KB minified + gzipped** — Zero external dependencies, pure browser APIs
- **Tree-shakeable:** Import only `MCVEmbed` for minimal footprint, or individual utilities
- **Dual format:** CJS (`index.js`) + ESM (`index.mjs`) for optimal bundler integration
- **TypeScript declarations** shipped for both CJS and ESM

### Iframe Loading Strategy

| Mode | When Iframe Loads | Rationale |
|------|-------------------|-----------|
| `popup` | On `.open()` call | Lazy — no network cost until user interaction |
| `slide-in` | On `.open()` call | Lazy — same as popup |
| `inline` | Immediately on creation | Content is visible — must load eagerly |
| `chat` | Immediately on creation | Bubble is visible; iframe preloads for instant open |
| `full-page` | On `.open()` call | Browser navigation — no iframe at all |

### Memory Management
- Call `.destroy()` on embeds you're done with to prevent DOM leaks
- `MCVEmbed.destroy()` tears down everything including the global `window.message` listener
- Each embed has its own `destroyed` flag — prevents method calls after cleanup
- The `BaseEventEmitter` uses `Map<string, Set>` — O(1) add/remove of handlers

### Multiple Embeds
- **No practical limit** on concurrent embed instances
- Each iframe is independently sandboxed (separate browsing context)
- The global `postMessage` listener dispatches by `embedId` — **O(1) lookup** via `Map.get()`
- Message handlers per embed use `Set` for efficient iteration

### Animation Performance
- **Slide-in:** CSS `transform: translateX()` — GPU-accelerated, no layout reflow
- **Popup overlay:** CSS `opacity` transition — GPU-composited
- **Chat window:** CSS `transform: scale()` + `opacity` — GPU-composited
- **First frame:** `requestAnimationFrame()` ensures animation starts on next paint (avoids flash)
- All animations use CSS transitions (not JavaScript animation frames)

### CSP Overhead
- No inline scripts injected — all DOM manipulation via `document.createElement()`
- No `eval()`, no `new Function()` — safe for strict CSP environments
- Styles applied via `element.style.cssText` — no `<style>` injection needed

---

## Security Considerations

### Iframe Sandboxing
- All iframes use the restrictive `sandbox` attribute
- Only `allow-scripts`, `allow-same-origin`, `allow-forms`, `allow-popups` are granted
- **No `allow-top-navigation`** — the embed cannot redirect the host page
- **No `allow-modals`** — no alert/confirm/prompt dialogs from iframe
- Each iframe is an independent browsing context with its own origin

### Origin Validation
- `parseMessage()` filters messages by `ns: 'mcv-embed'` namespace — rejects all non-MCV messages
- **Production recommendation:** Additionally validate `event.origin` against `config.baseUrl`:
  ```typescript
  window.addEventListener('message', (event) => {
    if (event.origin !== config.baseUrl) return; // Origin check
    const msg = parseMessage(event);
    // ...
  });
  ```
- Messages from unknown origins are silently discarded

### Token Security
- The optional `token` is passed as a URL query parameter to the iframe
- **Use short-lived JWTs** (< 15 min expiry) for production deployments
- Never embed long-lived API keys — use session tokens or one-time embed tokens
- Server-side `MCV_EMBED_TOKEN_SECRET` validates all incoming tokens
- Token is only accessible within the sandboxed iframe's browsing context

### Content Security Policy (CSP)
Host pages embedding MCV widgets must configure CSP to allow the iframe:

```
Content-Security-Policy: frame-src https://app.mcv.one;
```

For custom venture domains:
```
Content-Security-Policy: frame-src https://app.mcv.one https://custom.venture.com;
```

Server-side, the embed endpoints set:
```
X-Frame-Options: ALLOWALL
Content-Security-Policy: frame-ancestors *;
```
(Or restricted via `MCV_EMBED_CSP_FRAME_ANCESTORS`)

### XSS Protection
- The SDK **never injects raw HTML** — all DOM manipulation uses `document.createElement()`
- User-provided `className` values are applied via `element.className` (safe property assignment)
- URL parameters are encoded via the `URL` API (`url.searchParams.set()`) — no string concatenation
- The `prefill` object is serialized via `JSON.stringify()` — no template interpolation
- Event handler errors are caught and swallowed — prevents callback XSS from breaking the SDK

### Third-Party Context Security
- The SDK is designed to run on hostile external sites — it makes **no trust assumptions** about the host
- **No sensitive data** is stored in the host page's `localStorage`, `sessionStorage`, or cookies
- All session state lives inside the sandboxed iframe or on the MCV server
- The SDK's singleton state (`_config`, `_embeds`) is in JavaScript closures — not accessible from the global scope
- `postToIframe()` uses `'*'` as targetOrigin since the iframe origin is trusted (same as `baseUrl`)

### Rate Limiting
- Server-side rate limiting per `embedId` prevents abuse (default: 100 req/min)
- The SDK itself does not implement client-side rate limiting (rely on server enforcement)
- Chat embeds may implement message throttling in the iframe content

---

## Audit Events

Audit events are recorded **server-side** by the embed endpoints when they process requests from the embedded iframes. The client SDK itself does not emit audit events — it operates in an untrusted browser environment.

### Client-Side Events (Debug Only)

When `debug: true`, the SDK logs to `console.log`:

| Log Message | When |
|-------------|------|
| `[MCVEmbed] Initialized` | `MCVEmbed.init()` called |
| `[MCVEmbed] Message received` | Any valid postMessage received from an iframe |

### Server-Side Audit Events

| Event | Category | Description | Key Fields |
|-------|----------|-------------|------------|
| `embed.sdk.initialized` | `lifecycle` | Embed session started (iframe loaded) | `ventureId`, `embedId`, `embedType` |
| `embed.form.created` | `form` | Form embed iframe loaded | `ventureId`, `formId`, `embedId` |
| `embed.form.viewed` | `form` | Form rendered to user | `ventureId`, `formId`, `source: 'embed'` |
| `embed.form.started` | `form` | User began filling form | `ventureId`, `formId` |
| `embed.form.submitted` | `form` | Form submitted successfully | `ventureId`, `formId`, `submissionId`, `source: 'embed'` |
| `embed.form.partial` | `form` | Partial save (multi-step) | `ventureId`, `formId`, `completedSteps` |
| `embed.form.error` | `form` | Form submission error | `ventureId`, `formId`, `errorCode` |
| `embed.form.closed` | `form` | Form embed closed | `ventureId`, `formId`, `embedId` |
| `embed.booking.created` | `booking` | Booking embed iframe loaded | `ventureId`, `calendarSlug`, `embedId` |
| `embed.booking.viewed` | `booking` | Booking page rendered | `ventureId`, `calendarSlug` |
| `embed.booking.slot_selected` | `booking` | Time slot selected | `ventureId`, `slotId`, `startTime` |
| `embed.booking.confirmed` | `booking` | Booking confirmed | `ventureId`, `bookingId`, `calendarId`, `source: 'booking_page'` |
| `embed.booking.error` | `booking` | Booking error | `ventureId`, `calendarSlug`, `errorCode` |
| `embed.booking.closed` | `booking` | Booking embed closed | `ventureId`, `calendarSlug`, `embedId` |
| `embed.chat.created` | `chat` | Chat embed iframe loaded | `ventureId`, `embedId` |
| `embed.chat.opened` | `chat` | Chat window opened | `ventureId`, `embedId` |
| `embed.chat.message_sent` | `chat` | User sent a message | `ventureId`, `conversationId`, `direction: 'inbound'` |
| `embed.chat.message_received` | `chat` | Bot/AI response sent | `ventureId`, `conversationId`, `direction: 'outbound'` |
| `embed.chat.user_identified` | `chat` | User identity set/updated | `ventureId`, `userId`, `embedId` |
| `embed.chat.closed` | `chat` | Chat window closed | `ventureId`, `embedId` |
| `embed.token.validated` | `auth` | Embed token successfully validated | `ventureId`, `embedId` |
| `embed.token.expired` | `auth` | Embed token rejected (expired) | `ventureId`, `embedId` |
| `embed.token.invalid` | `auth` | Embed token rejected (bad signature) | `ventureId`, `embedId` |
| `embed.origin.blocked` | `security` | Request from non-allowed origin | `ventureId`, `origin`, `embedId` |
| `embed.rate_limited` | `security` | Rate limit exceeded | `ventureId`, `embedId`, `requestCount` |

---

## Environment Variables

The embed SDK is a **client-side** package and does not read environment variables at runtime. Configuration is passed entirely via `MCVEmbed.init()`.

For the **server-side** embed endpoints that power the iframes:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MCV_EMBED_ALLOWED_ORIGINS` | No | `*` | Comma-separated list of allowed embed host origins. `*` allows all origins. |
| `MCV_EMBED_CSP_FRAME_ANCESTORS` | No | `*` | Value for `Content-Security-Policy: frame-ancestors` header. |
| `MCV_EMBED_TOKEN_SECRET` | **Yes** | — | HMAC secret for validating embed JWT tokens. Must be at least 32 characters. |
| `MCV_EMBED_TOKEN_TTL_SECONDS` | No | `900` | Token time-to-live (default 15 minutes). |
| `MCV_EMBED_RATE_LIMIT` | No | `100` | Maximum requests per minute per `embedId`. |
| `MCV_EMBED_RATE_LIMIT_WINDOW` | No | `60` | Rate limit window in seconds. |
| `MCV_EMBED_CHAT_WS_URL` | No | — | WebSocket URL for real-time chat streaming. Falls back to HTTP polling if not set. |
| `MCV_EMBED_MAX_PREFILL_SIZE` | No | `8192` | Maximum size in bytes for the `prefill` URL parameter. |
| `MCV_EMBED_CORS_MAX_AGE` | No | `86400` | CORS preflight cache duration in seconds (default 24h). |
| `MCV_EMBED_CDN_URL` | No | — | CDN base URL for the embed SDK script (e.g., `https://cdn.mcv.one/embed/v1/`). |

---

## Error Codes

### Client-Side Errors (thrown by SDK)

| Code | Error Message | Cause | Resolution |
|------|---------------|-------|------------|
| `EMBED_NOT_INITIALIZED` | `SDK not initialised. Call MCVEmbed.init() first.` | Accessing `config` before `init()` | Call `MCVEmbed.init()` before creating embeds |
| `EMBED_INLINE_NO_CONTAINER` | `Inline mode requires a valid container.` | `mode: 'inline'` without `container` option, or selector doesn't match | Provide valid `container` (HTMLElement or CSS selector) |

### Server-Side Errors (returned via postMessage)

| Code | HTTP Status | Context | Description |
|------|-------------|---------|-------------|
| `EMBED_INVALID_CONFIG` | 400 | Init | Missing required config fields (`baseUrl`, `tenantId`) |
| `EMBED_TENANT_NOT_FOUND` | 404 | All | `tenantId` does not match any active venture |
| `EMBED_TENANT_SUSPENDED` | 403 | All | Venture exists but status is `suspended` or `archived` |
| `EMBED_FORM_NOT_FOUND` | 404 | Form | Form ID/slug does not exist or is not published |
| `EMBED_FORM_CLOSED` | 410 | Form | Form status is `closed` or `archived` |
| `EMBED_FORM_VALIDATION` | 422 | Form | Form data failed server-side validation |
| `EMBED_FORM_LIMIT_REACHED` | 429 | Form | Form submission limit exceeded (`settings.limits.maxSubmissions`) |
| `EMBED_FORM_DUPLICATE` | 409 | Form | Duplicate submission detected (`onePerEmail` / `onePerContact`) |
| `EMBED_BOOKING_NOT_FOUND` | 404 | Booking | Booking slug does not match any active calendar/booking page |
| `EMBED_SLOT_UNAVAILABLE` | 409 | Booking | Selected slot is no longer available (race condition) |
| `EMBED_BOOKING_OUTSIDE_HOURS` | 400 | Booking | Requested time is outside calendar availability |
| `EMBED_BOOKING_MIN_NOTICE` | 400 | Booking | Booking too close to current time (violates `minNotice`) |
| `EMBED_BOOKING_MAX_ADVANCE` | 400 | Booking | Booking too far in future (exceeds `maxAdvance` days) |
| `EMBED_BOOKING_REQUIRES_APPROVAL` | 202 | Booking | Booking created but requires approval (`requiresApproval: true`) |
| `EMBED_TOKEN_EXPIRED` | 401 | Auth | Authentication token has expired |
| `EMBED_TOKEN_INVALID` | 401 | Auth | Token signature validation failed |
| `EMBED_ORIGIN_BLOCKED` | 403 | Security | Request origin not in `MCV_EMBED_ALLOWED_ORIGINS` |
| `EMBED_RATE_LIMITED` | 429 | Security | Too many requests from this `embedId` |
| `EMBED_CHAT_UNAVAILABLE` | 503 | Chat | Chat service is temporarily unavailable |
| `EMBED_PREFILL_TOO_LARGE` | 413 | Form | Prefill data exceeds `MCV_EMBED_MAX_PREFILL_SIZE` |

---

## Dependencies

### Runtime Dependencies

```
None — Zero external dependencies. Pure browser APIs only.
```

The SDK uses only standard Web APIs:
- `window.postMessage` / `window.addEventListener('message')`
- `document.createElement` / `document.body.appendChild`
- `URL` (for safe URL construction)
- `Map` / `Set` (for event handlers and embed tracking)
- `requestAnimationFrame` (for animation first-frame)
- `JSON.stringify` / `JSON.parse` (for prefill serialization)

### Build Dependencies (devDependencies only)

| Package | Version | Purpose |
|---------|---------|---------|
| `tsup` | ^8.0.0 | Build tool (bundles to CJS + ESM + DTS) |
| `typescript` | ^5.6.0 | Type checking and declaration generation |

### Internal Package Dependencies

None. `@mcv/embed` is a standalone, leaf-node package with no imports from other `@mcv/*` packages.

### Server-Side Peer Dependencies

The following MCV packages power the server endpoints that the embeds communicate with:

| Package | Purpose | Tables Used |
|---------|---------|-------------|
| `@mcv/db` | Database schema and query layer | `ventures`, `forms`, `form_fields`, `form_submissions`, `form_analytics`, `calendars`, `appointments`, `booking_pages`, `conversations`, `messages` |
| `@mcv/auth` | Token validation for authenticated embeds | JWT verification, session management |
| `@mcv/ai` | Chat embed backend — AI conversation service | AI gateway, RAG knowledge base |
| `@mcv/forms` | Form embed backend — submission processing | Form validation, notification dispatch |
| `@mcv/calendar` | Booking embed backend — slot management | Availability calculation, appointment creation |
| `@mcv/notifications` | Submission/booking confirmation emails | Email templates, delivery tracking |

---

## Browser Compatibility

| Browser | Minimum Version | Notes |
|---------|-----------------|-------|
| Chrome | 60+ | Full support |
| Firefox | 55+ | Full support |
| Safari | 12+ | Full support |
| Edge | 79+ (Chromium) | Full support |
| iOS Safari | 12+ | Full support (including chat bubble) |
| Android Chrome | 60+ | Full support |
| Samsung Internet | 8+ | Full support |

**Required Web APIs:**
- `window.postMessage` — Core communication
- `URL` constructor — URL building
- `requestAnimationFrame` — Animation scheduling
- `Map` / `Set` — Data structures
- `document.querySelector` — Container resolution
- `Intl.DateTimeFormat` — Timezone detection (used in examples, not required by SDK)

**Not Supported:**
- Internet Explorer (any version) — Missing `Map`, `Set`, `URL` APIs
- Server-side environments (Node.js, Deno, Bun) — Requires `window` and `document`

---

## URL Construction Reference

Each embed type constructs its iframe URL using `buildUrl()`:

### Form Embed URL

```
{baseUrl}/embed/form/{formId}
  ?tenantId={tenantId}
  &embedId={embedId}
  &token={token}                    (optional)
  &prefill={JSON.stringify(prefill)} (optional, URL-encoded)
```

### Booking Embed URL

```
{baseUrl}/embed/booking/{slug}
  ?tenantId={tenantId}
  &embedId={embedId}
  &token={token}       (optional)
  &date={date}         (optional, ISO string)
  &timezone={timezone} (optional, IANA timezone)
```

### Chat Embed URL

```
{baseUrl}/embed/chat
  ?tenantId={tenantId}
  &embedId={embedId}
  &token={token}           (optional)
  &greeting={greeting}     (optional)
  &accentColor={color}     (optional)
  &avatarUrl={url}         (optional)
  &userId={user.id}        (optional)
  &userName={user.name}    (optional)
  &userEmail={user.email}  (optional)
```

---

## CSS Z-Index Stack

The SDK uses high z-index values to ensure embeds appear above page content:

| Element | z-index | Purpose |
|---------|---------|---------|
| Overlay backdrop | `999998` | Semi-transparent background for popup/slide-in |
| Wrapper / Chat window | `999999` | Contains the iframe, sits above overlay |
| Chat bubble button | `999999` | Always visible, same level as wrapper |

**Host page recommendation:** If your page uses z-index values above 999997, the embed may be obscured. Adjust your page's z-index stack or use the SDK's `className` option to override.

---

## Anti-Patterns & Common Mistakes

| ❌ Mistake | ✅ Correct Approach |
|-----------|-------------------|
| Calling `MCVEmbed.form()` before `MCVEmbed.init()` | Always call `init()` first — it's required |
| Using `inline` mode without a `container` | Always provide `container` for inline mode |
| Storing long-lived API keys in `config.token` | Use short-lived JWTs (< 15 min) |
| Calling embed methods after `.destroy()` | Check if needed; `destroy()` sets `destroyed = true` |
| Initializing multiple times without `destroy()` | Call `MCVEmbed.destroy()` before re-init, or just re-call `init()` (updates config) |
| Expecting SSR compatibility | This is browser-only; guard with `typeof window !== 'undefined'` |
| Modifying iframe sandbox attributes | Never relax sandbox — security review required |
| Assuming embeds are ready before `onLoad`/`onReady` | Wait for load/ready events before interacting |
| Not handling the `onError` callback | Always handle errors — network failures, validation errors, expired tokens |
| Using `full-page` mode and expecting to return | Full-page navigates away — the current page is gone |

---

## Related Modules

| Module | Relationship | Description |
|--------|-------------|-------------|
| `@mcv/intelligence/gateway` | Chat embeds route AI requests through the gateway | LLM model selection, cost tracking, streaming responses |
| `@mcv/intelligence/rag` | Chat embeds can query venture knowledge bases | Retrieval-augmented generation for contextual answers |
| `@mcv/intelligence/ml` | Chat embeds use the AI orchestration service | Conversation management, intent detection, handoff logic |
| `@mcv/forms` | Form embeds powered by the forms service | Field rendering, validation, submission processing |
| `@mcv/calendar` | Booking embeds powered by the calendar service | Availability calculation, slot management, appointment creation |
| `@mcv/auth` | Token validation for authenticated embeds | JWT verification, venture-scoped permissions |
| `@mcv/ui` | Shared component library used inside iframe content | Form components, chat UI, booking calendar components |
| `@mcv/db` | All server-side data persistence | Drizzle ORM schemas for forms, calendar, conversations |
| `@mcv/notifications` | Post-submission/booking notifications | Email confirmations, SMS reminders, webhook deliveries |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-08 | Initial release — form, booking, chat embeds with 4 display modes |

---

*@mcv/intelligence/embed — Embeddable Widget SDK Module*
