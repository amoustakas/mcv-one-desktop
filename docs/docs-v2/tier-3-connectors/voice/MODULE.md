# @mcv/twilio — Voice & Messaging Connector Module

**Package:** `@mcv/twilio`  
**Tier:** 3 (Connector — Voice & Messaging)  
**Classification:** MCV-ONLY (Phase 1) → PUBLISHABLE (Phase 2: Q4 2026)  
**Source:** `packages/twilio/`  
**Version:** 1.0.0  
**Last Updated:** February 8, 2026

---

## Table of Contents

1. [Purpose](#purpose)
2. [Architecture](#architecture)
3. [Exports](#exports)
4. [Dependencies](#dependencies)
5. [Environment Variables](#environment-variables)
6. [Database Schema](#database-schema)
7. [TypeScript Interfaces](#typescript-interfaces)
8. [Core Services](#core-services)
9. [TwiML Generation](#twiml-generation)
10. [Webhook System](#webhook-system)
11. [Middleware & Utilities](#middleware--utilities)
12. [Client Layer (React)](#client-layer-react)
13. [Code Examples](#code-examples)
14. [TCPA & Regulatory Compliance](#tcpa--regulatory-compliance)
15. [Security Considerations](#security-considerations)
16. [Performance Considerations](#performance-considerations)
17. [Error Codes & Handling](#error-codes--handling)
18. [Audit Events](#audit-events)
19. [Default Configuration Constants](#default-configuration-constants)
20. [Integration Points](#integration-points)

---

## Purpose

The `@mcv/twilio` package is the **comprehensive multi-tenant voice and messaging platform** for the MCV.ONE ecosystem, built on the Twilio API. Each MCV venture operates through an isolated Twilio sub-account with encrypted credential storage, providing complete billing separation, data isolation, and independent configuration.

### What It Does

This module provides the full telephony infrastructure for any MCV venture:

- **Voice Calling** — Outbound/inbound calls, warm/cold transfers, hold, mute, DTMF, answering machine detection (AMD), BYOC trunk support, SHAKEN/STIR attestation
- **SMS/MMS Messaging** — Single and bulk messaging with delivery tracking, rate limiting, and opt-in/opt-out compliance
- **IVR Builder** — Visual IVR tree builder with TwiML generation, business hours routing, DTMF/speech input, voicemail
- **Call Recording & Transcription** — Start/stop/pause/resume recordings with PCI-compliant pause, async transcription
- **Conferencing** — Multi-party conference calls with coaching/whisper, recording, and participant management
- **Call Queues** — ACD-style call queuing with wait music and agent routing
- **Media Streams** — Real-time media stream forking for AI/ML processing
- **Twilio Flex** — Full contact center integration with TaskRouter workers, queues, and real-time statistics
- **Conversations API** — Omnichannel conversation threads with participant management
- **WhatsApp Business** — Template messaging and freeform messaging via WhatsApp
- **Verify (2FA)** — Multi-channel verification codes (SMS, call, email, WhatsApp)
- **Video Rooms** — Peer-to-peer and group video conferencing with recording and compositions
- **SIP Trunking** — SIP domain management, credential lists, IP ACLs
- **Sync** — Real-time data synchronization (documents, lists, maps)
- **Push Notifications** — Multi-platform push notifications (APNs, FCM, SMS)
- **A2P/10DLC Compliance** — Brand and campaign registration for US messaging
- **Trust Hub** — Customer profile and identity verification for regulatory compliance
- **Number Intelligence** — Carrier lookup, SIM swap detection, identity match, live activity
- **Browser Calling** — WebRTC-based calling via Twilio Client SDK with React hooks

### Why It Exists

Every MCV venture needs communication infrastructure. Rather than each venture building its own Twilio integration, this package provides a unified, secure, multi-tenant abstraction that:

1. Isolates each venture in its own Twilio sub-account
2. Encrypts credentials at rest with AES-256-GCM
3. Validates all inputs (phone numbers, URLs) to prevent injection and SSRF
4. Sanitizes all error messages to prevent credential leakage
5. Handles rate limiting with exponential backoff automatically
6. Provides a complete React component library for browser-based telephony

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                              @mcv/twilio                                         │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │                     Server Services (28 services)                          │  │
│  │                                                                            │  │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐         │  │
│  │  │  SubAccount       │  │  PhoneNumber      │  │  SMS Service     │         │  │
│  │  │  Service           │  │  Service           │  │                  │         │  │
│  │  │  • createSubAcct  │  │  • searchAvail    │  │  • send          │         │  │
│  │  │  • getClient      │  │  • purchase       │  │  • sendBulk      │         │  │
│  │  │  • suspend/close  │  │  • configure      │  │  • handleIncoming│         │  │
│  │  │  • getUsage       │  │  • release        │  │  • statusCallback│         │  │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘         │  │
│  │                                                                            │  │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐         │  │
│  │  │  Voice Service    │  │  IVR Service      │  │  Recording       │         │  │
│  │  │                   │  │                   │  │  Service          │         │  │
│  │  │  • initiateCall   │  │  • createTree     │  │  • start/stop    │         │  │
│  │  │  • advancedCall   │  │  • validateTree   │  │  • pause/resume  │         │  │
│  │  │  • transfer       │  │  • generateTwiml  │  │  • transcribe    │         │  │
│  │  │  • hold/mute      │  │  • navigateNode   │  │  • voicemails    │         │  │
│  │  │  • generateToken  │  │                   │  │                  │         │  │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘         │  │
│  │                                                                            │  │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐         │  │
│  │  │  Conference       │  │  Queue Service    │  │  Stream Service  │         │  │
│  │  │  Service           │  │                   │  │                  │         │  │
│  │  │  • create         │  │  • enqueue        │  │  • start/stop    │         │  │
│  │  │  • addParticipant │  │  • dequeue        │  │  • fork          │         │  │
│  │  │  • mute/hold      │  │  • statistics     │  │  • parameters    │         │  │
│  │  │  • coach/whisper  │  │                   │  │                  │         │  │
│  │  │  • recordings     │  │                   │  │                  │         │  │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘         │  │
│  │                                                                            │  │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐         │  │
│  │  │  Flex Service     │  │  Conversations    │  │  WhatsApp        │         │  │
│  │  │                   │  │  Service           │  │  Service          │         │  │
│  │  │  • workers        │  │  • create         │  │  • sendMessage   │         │  │
│  │  │  • taskQueues     │  │  • addParticipant │  │  • sendTemplate  │         │  │
│  │  │  • statistics     │  │  • messages       │  │                  │         │  │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘         │  │
│  │                                                                            │  │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐         │  │
│  │  │  Verify Service   │  │  SIP Service      │  │  Video Service   │         │  │
│  │  │  • sendCode       │  │  • domains        │  │  • createRoom    │         │  │
│  │  │  • checkCode      │  │  • credentials    │  │  • generateToken │         │  │
│  │  │  • createService  │  │  • ipAcl          │  │  • compositions  │         │  │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘         │  │
│  │                                                                            │  │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐         │  │
│  │  │  A2P Register     │  │  Trust Hub        │  │  Lookup /        │         │  │
│  │  │  Service           │  │  Service           │  │  NumberIntel     │         │  │
│  │  │  • registerBrand  │  │  • profiles       │  │  • carrier       │         │  │
│  │  │  • registerCamp   │  │  • trustProducts  │  │  • simSwap       │         │  │
│  │  │  • getCampaign    │  │  • endUsers       │  │  • identityMatch │         │  │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘         │  │
│  │                                                                            │  │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐         │  │
│  │  │  Sync Service     │  │  Notify Service   │  │  VoiceInsights   │         │  │
│  │  │  • documents      │  │  • bindings       │  │  Service          │         │  │
│  │  │  • lists/maps     │  │  • notifications  │  │  • callSummaries │         │  │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘         │  │
│  │                                                                            │  │
│  │  ┌──────────────────────┐  ┌───────────────────┐  ┌───────────────────┐   │  │
│  │  │  CallerID Service     │  │  DialingPerm Svc   │  │  MsgService Svc    │   │  │
│  │  │  • add/verify         │  │  • countries       │  │  • create          │   │  │
│  │  │  • list               │  │  • settings        │  │  • addSenders      │   │  │
│  │  └──────────────────────┘  └───────────────────┘  └───────────────────┘   │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │                        TwiML Generators                                    │  │
│  │  IvrTwimlGenerator  •  VoiceResponseTemplates                              │  │
│  │  • generateFromFlow • businessClosed • holdMusic • voicemailGreeting       │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │                        Webhook Handlers                                    │  │
│  │  handleIncomingCall  •  handleCallStatus  •  handleRecordingComplete       │  │
│  │  handleIncomingSms   •  handleSmsStatus   •  handleStatusCallback          │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │                        Middleware & Utilities                              │  │
│  │  validateTwilioSignature  •  phone-validator  •  url-validator (SSRF)      │  │
│  │  error-sanitizer  •  retry (exponential backoff)  •  encrypt/decrypt       │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │                        Client Layer (React)                                │  │
│  │                                                                            │  │
│  │  Hooks: usePhone • useSms • useCallStatus • useConversations               │  │
│  │         useFlexAgent • usePhoneNumbers                                     │  │
│  │                                                                            │  │
│  │  Components: Dialer • SmsComposer • CallControls                           │  │
│  │              ConversationThread • FlexAgentPanel • IvrBuilder              │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    ▼                ▼                ▼
┌──────────────────────┐  ┌─────────────────┐  ┌──────────────────────┐
│  @mcv/db             │  │  @mcv/secrets    │  │  Twilio REST API     │
│  (PostgreSQL/Drizzle)│  │  (GCP Vault)     │  │  (twilio ^5.x SDK)   │
│                      │  │                  │  │                      │
│  • 22+ tables        │  │  • Master creds  │  │  • Voice             │
│  • Drizzle ORM       │  │  • Per-venture   │  │  • Messaging         │
│  • Encrypted tokens  │  │    secrets       │  │  • Flex              │
│  • Audit trail       │  │  • AES-256-GCM   │  │  • Video             │
└──────────────────────┘  └─────────────────┘  └──────────────────────┘
```

### Request Flow

```
Browser/API Request
       │
       ▼
┌─────────────────────┐
│  Webhook Middleware  │──── validateTwilioSignature (HMAC-SHA1)
│  (Signature Check)  │
└──────────┬──────────┘
           │ ✓ Valid
           ▼
┌─────────────────────┐
│  Webhook Handler    │──── Route to: handleIncomingCall / handleIncomingSms
│  (Event Router)     │                handleCallStatus / handleSmsStatus
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐     ┌─────────────────────┐
│  Service Layer      │────►│  SubAccountService  │
│  (VoiceService,     │     │  • getClient()      │
│   SmsService, etc.) │     │  1. Check Vault     │
└──────────┬──────────┘     │  2. Fallback legacy │
           │                └──────────┬──────────┘
           │                           │
           ▼                           ▼
┌─────────────────────┐     ┌─────────────────────┐
│  Input Validation   │     │  Client Cache       │
│  • Phone E.164      │     │  (TTL: 1h, LRU:100) │
│  • URL SSRF check   │     └──────────┬──────────┘
│  • DTMF charset     │                │
└──────────┬──────────┘                ▼
           │                ┌─────────────────────┐
           ▼                │  Twilio REST API    │
┌─────────────────────┐     │  (with retry logic) │
│  withRetry()        │────►│  • Max 3 attempts   │
│  Exponential backoff│     │  • 1s → 2s → 4s     │
│  Jitter: ±10%       │     │  • Max delay: 30s   │
└──────────┬──────────┘     └──────────┬──────────┘
           │                           │
           ▼                           ▼
┌─────────────────────┐     ┌─────────────────────┐
│  @mcv/db            │     │  Error Sanitizer    │
│  (PostgreSQL write) │     │  • Redact SIDs      │
└─────────────────────┘     │  • Redact tokens    │
                            │  • Safe messages    │
                            └─────────────────────┘
```

### Credential Resolution Flow

```
getClient(ventureId)
       │
       ├──1──► integrations table → GCP Secret Manager (vault-managed)
       │       secretResourceName → SecretManagerService.getSecret()
       │       → Parse JSON { accountSid, authToken }
       │       → createTwilioClient(sid, token)
       │
       └──2──► twilio_sub_accounts table (legacy fallback)
               twilioAuthTokenEncrypted → AES-256-GCM decrypt()
               → createTwilioClient(sid, decryptedToken)
```

---

## Exports

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// ROOT PACKAGE: @mcv/twilio
// ═══════════════════════════════════════════════════════════════════════════════

// All types
export * from './types';

// AES-256-GCM encryption utilities
export { encrypt, decrypt } from './client';

// Client cache management
export {
  configureClientCache,     // Set TTL, max size
  clearClientCache,         // Clear all cached clients
  invalidateClient,         // Invalidate single client by SID
  getCacheStats,            // Monitor cache health
} from './client';

// ═══════════════════════════════════════════════════════════════════════════════
// SERVER PACKAGE: @mcv/twilio/server
// ═══════════════════════════════════════════════════════════════════════════════

// --- 28 Service Classes ---
export { SubAccountService } from './services/sub-account.service';
export { PhoneNumberService } from './services/phone-number.service';
export { SmsService } from './services/sms.service';
export { VoiceService } from './services/voice.service';
export { IvrService } from './services/ivr.service';
export { RecordingService } from './services/recording.service';
export { A2pRegistrationService } from './services/a2p-registration.service';
export { WebhookHandlerService } from './services/webhook-handler.service';
export { ConversationsService } from './services/conversations.service';
export { FlexService } from './services/flex.service';
export { VerifyService } from './services/verify.service';
export { WhatsAppService } from './services/whatsapp.service';
export { MessagingServiceService } from './services/messaging-service.service';
export { ConferenceService } from './services/conference.service';
export { QueueService } from './services/queue.service';
export { StreamService } from './services/stream.service';
export { VoiceInsightsService } from './services/voice-insights.service';
export { SipService } from './services/sip.service';
export { CallerIdService } from './services/caller-id.service';
export { DialingPermissionsService } from './services/dialing-permissions.service';
export { LookupService } from './services/lookup.service';
export { VideoService } from './services/video.service';
export { SyncService } from './services/sync.service';
export { NotifyService } from './services/notify.service';
export { TrustHubService } from './services/trust-hub.service';
export { NumberIntelligenceService } from './services/number-intelligence.service';

// --- TwiML Generators ---
export { IvrTwimlGenerator } from './twiml/ivr-generator';
export { VoiceResponseTemplates } from './twiml/voice-responses';

// --- Webhook Handlers ---
export {
  handleIncomingCall,
  handleCallStatus,
  handleRecordingComplete,
  type VoiceWebhookResult,
} from './webhooks/voice-webhook';
export {
  handleIncomingSms,
  handleSmsStatus,
  type SmsWebhookResult,
} from './webhooks/sms-webhook';
export {
  handleStatusCallback,
  type StatusEventType,
  type StatusWebhookResult,
} from './webhooks/status-webhook';

// --- Middleware ---
export {
  validateTwilioSignature,
  createTwilioWebhookValidator,
  type TwilioWebhookOptions,
} from './middleware/twilio-signature';

// --- Utilities ---
export {
  // URL validation / SSRF protection
  validateCallbackUrl,
  validateCallbackUrls,
  getWebhookBaseUrl,
  buildWebhookUrl,
  type UrlValidationOptions,
  type UrlValidationResult,
  // Phone number validation
  cleanPhoneNumber,
  normalizePhoneNumber,
  validatePhoneNumber,
  validatePhoneNumbers,
  isValidForSms,
  isValidForVoice,
  parseToPhoneNumber,
  parseFromPhoneNumber,
  type PhoneValidationOptions,
  type PhoneValidationResult,
  // Retry with exponential backoff
  withRetry,
  makeRetryable,
  getRetryAfter,
  waitForRateLimit,
  isRateLimitError,
  isTransientError,
  type RetryOptions,
  type TwilioError,
  // Error sanitization
  redactSensitiveInfo,
  getErrorMessage,
  isRetryableError,
  sanitizeTwilioError,
  createSafeError,
  withErrorSanitization,
  type SanitizedError,
  type ErrorSanitizationOptions,
} from './utils';

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT PACKAGE: @mcv/twilio/client
// ═══════════════════════════════════════════════════════════════════════════════

// React hooks
export { usePhone } from './hooks/use-phone';
export { useSms } from './hooks/use-sms';
export { useCallStatus } from './hooks/use-call-status';
export { useConversations } from './hooks/use-conversations';
export { useFlexAgent } from './hooks/use-flex-agent';
export { usePhoneNumbers } from './hooks/use-phone-numbers';

// React components
export { Dialer } from './components/dialer';
export { SmsComposer } from './components/sms-composer';
export { CallControls } from './components/call-controls';
export { ConversationThread } from './components/conversation-thread';
export { FlexAgentPanel } from './components/flex-agent-panel';
export { IvrBuilder } from './components/ivr-builder';

// ═══════════════════════════════════════════════════════════════════════════════
// COMPLIANCE CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export {
  TCPA_EARLIEST_CALL_HOUR,       // 8 (8:00 AM local)
  TCPA_LATEST_CALL_HOUR,         // 21 (9:00 PM local)
  OPT_OUT_KEYWORDS,              // ['STOP', 'STOPALL', 'UNSUBSCRIBE', ...]
  OPT_IN_KEYWORDS,               // ['START', 'YES', 'UNSTOP', ...]
  HELP_KEYWORDS,                 // ['HELP', 'INFO']
  THROUGHPUT_LIMITS,             // { local_10dlc: 15, toll_free: 3, ... }
  MAX_MMS_MEDIA_URLS,            // 10
  A2P_CAMPAIGN_USE_CASES,        // ['marketing', 'notifications', ...]
} from './constants/compliance';
```

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `twilio` | `^5.x` | Twilio REST API SDK + JWT token generation |
| `@mcv/db` | `workspace:*` | PostgreSQL via Drizzle ORM — all 22+ tables |
| `@mcv/secrets` | `workspace:*` | GCP Secret Manager for credential resolution |
| `react` | `^18.x` | Client-side hooks and components |
| `@twilio/voice-sdk` | `^2.x` | Browser-based WebRTC calling (peer dependency) |
| `drizzle-orm` | `^0.29.x` | Query builder for database operations |
| `node:crypto` | built-in | AES-256-GCM encryption, HMAC-SHA1 signatures |
| `node:url` | built-in | URL parsing for SSRF validation |
| `node:net` | built-in | IP address validation for SSRF protection |

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TWILIO_ACCOUNT_SID` | Yes* | — | Master account SID (fallback if vault unavailable) |
| `TWILIO_AUTH_TOKEN` | Yes* | — | Master auth token (fallback if vault unavailable) |
| `TWILIO_API_KEY_SID` | No | — | API key SID for access token generation |
| `TWILIO_API_KEY_SECRET` | No | — | API key secret for access token generation |
| `TWILIO_TWIML_APP_SID` | No | — | TwiML Application SID for browser calling |
| `TWILIO_MESSAGING_SERVICE_SID` | No | — | Default messaging service SID |
| `TWILIO_VERIFY_SERVICE_SID` | No | — | Verify service SID for 2FA |
| `TWILIO_FLEX_WORKSPACE_SID` | No | — | Flex TaskRouter workspace SID |
| `TWILIO_WHATSAPP_FROM` | No | — | WhatsApp sender number (`whatsapp:+1...`) |
| `TWILIO_ENCRYPTION_KEY` | Yes | — | 64-character hex string for AES-256-GCM credential encryption |
| `APP_URL` | Yes | — | Base URL for webhook callbacks (e.g., `https://api.mcv.one`) |
| `NODE_ENV` | No | `production` | Controls HTTP allowance in URL validation |

> *Master credentials are first resolved from GCP Secret Manager (`mcv-system-twilio-master`). Environment variables serve as fallback only.

### Vault Secret Structure

The master Twilio credentials are stored in GCP Secret Manager at:
`projects/mcv-one-prototype/secrets/mcv-system-twilio-master/versions/latest`

```json
{
  "accountSid": "AC...",
  "authToken": "...",
  "apiKeySid": "SK...",
  "apiKeySecret": "...",
  "messagingServiceSid": "MG...",
  "verifyServiceSid": "VA...",
  "flexWorkspaceSid": "WS...",
  "whatsappFrom": "whatsapp:+1...",
  "twimlAppSid": "AP..."
}
```

### Per-Venture Vault Credentials

Individual venture credentials are stored via the `integrations` table with `provider = 'twilio'` and a `secretResourceName` pointing to a GCP Secret Manager path. The secret payload follows the same JSON structure.

---

## Database Schema

### Tables Overview (22+ tables)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `twilio_sub_accounts` | Sub-account per venture | `ventureId`, `twilioAccountSid`, `twilioAuthTokenEncrypted`, `status` |
| `phone_numbers` | Purchased phone numbers | `ventureId`, `phoneNumber`, `type`, `capabilities`, `status` |
| `sms_messages` | SMS/MMS message records | `ventureId`, `twilioSid`, `from`, `to`, `body`, `direction`, `status` |
| `call_records` | Call records with metadata | `ventureId`, `twilioSid`, `from`, `to`, `direction`, `status`, `duration` |
| `ivr_trees` | IVR flow definitions | `ventureId`, `name`, `phoneNumberId`, `isActive`, `nodes` (JSON) |
| `voicemails` | Voicemail recordings | `ventureId`, `callRecordId`, `recordingSid`, `transcriptionText` |
| `a2p_registrations` | A2P 10DLC registrations | `ventureId`, `brandSid`, `campaignSid`, `status` |
| `twilio_messaging_services` | Messaging service configs | `ventureId`, `messagingServiceSid`, `friendlyName` |
| `twilio_voice_applications` | TwiML app configs | `ventureId`, `applicationSid` |
| `twilio_conversations` | Conversations API | `ventureId`, `conversationSid`, `friendlyName`, `contactId` |
| `twilio_flex_workers` | Flex TaskRouter workers | `ventureId`, `workerSid`, `mumsUserId` |
| `twilio_conferences` | Conference rooms | `ventureId`, `conferenceSid`, `friendlyName`, `status`, `region` |
| `twilio_conference_participants` | Conference participants | `conferenceId`, `callSid`, `label`, `muted`, `hold`, `coaching` |
| `twilio_call_queues` | Call queue definitions | `ventureId`, `queueSid`, `friendlyName`, `maxSize` |
| `twilio_media_streams` | Real-time media streams | `ventureId`, `streamSid`, `callSid`, `status` |
| `twilio_sip_domains` | SIP domain configs | `ventureId`, `domainSid`, `domainName` |
| `twilio_outgoing_caller_ids` | Verified caller IDs | `ventureId`, `callerIdSid`, `phoneNumber` |
| `twilio_video_rooms` | Video room records | `ventureId`, `roomSid`, `uniqueName`, `type`, `status` |
| `twilio_sync_services` | Sync service configs | `ventureId`, `syncServiceSid` |
| `twilio_notify_services` | Notification service configs | `ventureId`, `notifyServiceSid` |
| `twilio_customer_profiles` | Trust Hub profiles | `ventureId`, `profileSid`, `status` |
| `twilio_lookup_cache` | Phone number lookup cache | `phoneNumber`, `data` (JSON), `expiresAt` |
| `integrations` | Vault-managed integrations | `ventureId`, `provider`, `secretResourceName`, `status` |

### Key Enums (from @mcv/db)

```typescript
type PhoneNumberType = 'local' | 'tollFree' | 'shortCode' | 'mobile';
type PhoneNumberStatus = 'active' | 'released' | 'pending';
type SmsDirection = 'inbound' | 'outbound';
type SmsStatus = 'queued' | 'sending' | 'sent' | 'delivered'
  | 'undelivered' | 'failed' | 'received';
type TwilioCallDirection = 'inbound' | 'outbound';
type TwilioCallStatus = 'initiated' | 'ringing' | 'in-progress' | 'completed'
  | 'busy' | 'no-answer' | 'canceled' | 'failed';
type AnsweredBy = 'human' | 'machine' | 'unknown';
type TranscriptionStatus = 'queued' | 'in-progress' | 'completed' | 'failed';
type A2pBrandStatus = 'pending' | 'approved' | 'failed' | 'in_review';
type A2pCampaignStatus = 'pending' | 'approved' | 'failed'
  | 'in_review' | 'suspended';
type TwilioConferenceStatus = 'init' | 'in-progress' | 'completed';
```

### IVR Node Type (JSON Column)

```typescript
interface IvrNode {
  id: string;
  type: 'menu' | 'say' | 'play' | 'dial' | 'record' | 'queue'
    | 'forward' | 'voicemail' | 'time_check' | 'webhook';
  label: string;
  text?: string;              // TTS text
  audioUrl?: string;          // Audio file URL
  voice?: string;             // TTS voice (e.g., 'Polly.Joanna')
  language?: string;          // e.g., 'en-US'
  numDigits?: number;         // DTMF digits to gather
  timeout?: number;           // Gather/dial timeout (seconds)
  dialTarget?: string;        // Phone number or SIP URI
  queueName?: string;         // Call queue name
  playBeep?: boolean;         // Beep before recording
  maxLength?: number;         // Max recording seconds
  transcribe?: boolean;       // Auto-transcribe recording
  webhookUrl?: string;        // External webhook URL
  webhookMethod?: 'GET' | 'POST';
  businessHours?: {
    timezone: string;
    schedule: Array<{
      day: number;            // 0=Sun, 1=Mon, ..., 6=Sat
      open: string;           // 'HH:MM' format
      close: string;          // 'HH:MM' format
    }>;
  };
  routes?: Record<string, string>;  // DTMF digit → next node ID
  nextNodeId?: string;              // Default next node
  openNodeId?: string;              // Business hours: open route
  closedNodeId?: string;            // Business hours: closed route
  speechHints?: string[];           // Speech recognition hints
  speechInput?: boolean;            // Enable speech input
  finishOnKey?: string;             // End recording key
}
```

### Entity Relationships

```
ventures ──1:1──► twilio_sub_accounts
    │
    ├──1:N──► phone_numbers ──1:N──► ivr_trees
    ├──1:N──► sms_messages (linked to contacts)
    ├──1:N──► call_records (linked to contacts, agents)
    │             └──1:N──► voicemails
    ├──1:N──► a2p_registrations
    ├──1:N──► twilio_messaging_services
    ├──1:N──► twilio_voice_applications
    ├──1:N──► twilio_conversations (linked to contacts)
    ├──1:N──► twilio_flex_workers (linked to users)
    ├──1:N──► twilio_conferences
    │             └──1:N──► twilio_conference_participants
    ├──1:N──► twilio_call_queues
    ├──1:N──► twilio_media_streams
    ├──1:N──► twilio_sip_domains
    ├──1:N──► twilio_outgoing_caller_ids
    ├──1:N──► twilio_video_rooms
    ├──1:N──► twilio_sync_services
    ├──1:N──► twilio_notify_services
    └──1:N──► twilio_customer_profiles
```

---

## TypeScript Interfaces

### Sub-Account Types

```typescript
interface CreateSubAccountInput {
  ventureId: string;
  friendlyName: string;
}

interface SubAccountInfo {
  ventureId: string;
  accountSid: string;
  friendlyName: string;
  status: string;              // 'active' | 'suspended' | 'closed'
}

interface UsageRecord {
  category: string;            // e.g., 'calls', 'sms', 'recordings'
  description: string;
  count: number;
  countUnit: string;
  price: number;
  priceUnit: string;           // e.g., 'USD'
  startDate: string;           // ISO 8601
  endDate: string;             // ISO 8601
}
```

### Voice Types

```typescript
interface InitiateCallInput {
  to: string;                  // E.164 phone number
  from: string;                // E.164 phone number
  twiml?: string;              // Inline TwiML XML
  url?: string;                // TwiML URL
  statusCallback?: string;
  record?: boolean;
  machineDetection?: 'Enable' | 'DetectMessageEnd';
  timeout?: number;            // Ring timeout (seconds)
}

interface AdvancedCallInput extends InitiateCallInput {
  applicationSid?: string;     // TwiML App SID
  method?: 'GET' | 'POST';
  fallbackUrl?: string;
  recordingChannels?: 'mono' | 'dual';
  recordingTrack?: 'inbound' | 'outbound' | 'both';
  recordingStatusCallback?: string;
  transcribe?: boolean;
  machineDetectionTimeout?: number;
  amdStatusCallback?: string;
  sipAuthUsername?: string;
  sipAuthPassword?: string;
  byoc?: string;               // BYOC trunk SID
  callReason?: string;         // SHAKEN/STIR attestation
}

interface TransferCallInput {
  to: string;
  type: 'warm' | 'cold';
  announceUrl?: string;
}

interface GenerateTokenInput {
  identity: string;            // Agent/user identifier
  ttl?: number;                // Token TTL in seconds (default: 3600)
}

interface CallListFilters {
  direction?: TwilioCallDirection;
  status?: TwilioCallStatus;
  from?: string;
  to?: string;
  agentId?: string;
  contactId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
}
```

### TwiML Action Types

```typescript
type TwimlAction =
  | { type: 'say'; text: string; voice?: string; language?: string;
      loop?: number }
  | { type: 'play'; url: string; loop?: number }
  | { type: 'dial'; number: string; callerId?: string; timeout?: number;
      record?: boolean }
  | { type: 'gather'; input?: string; numDigits?: number; timeout?: number;
      action?: string; speechTimeout?: string; hints?: string;
      nested?: TwimlAction[] }
  | { type: 'record'; maxLength?: number; playBeep?: boolean;
      transcribe?: boolean; action?: string; finishOnKey?: string }
  | { type: 'enqueue'; name: string; waitUrl?: string }
  | { type: 'redirect'; url: string; method?: string }
  | { type: 'reject'; reason?: 'rejected' | 'busy' }
  | { type: 'pause'; length?: number }
  | { type: 'hangup' };
```

### Extended TwiML Actions

```typescript
type ExtendedTwimlAction =
  | TwimlAction
  | { type: 'conference'; name: string; muted?: boolean;
      startConferenceOnEnter?: boolean; endConferenceOnExit?: boolean;
      record?: 'do-not-record' | 'record-from-start';
      maxParticipants?: number; region?: string; coach?: string }
  | { type: 'stream'; url: string; name?: string;
      track?: 'inbound_track' | 'outbound_track' | 'both_tracks' }
  | { type: 'pay'; chargeAmount?: string; currency?: string;
      paymentConnector?: string }
  | { type: 'connect'; action?: string; nested?: ExtendedTwimlAction[] }
  | { type: 'refer'; sipUrl: string }
  | { type: 'leave' }
  | { type: 'sip'; sipUrl: string; username?: string; password?: string }
  | { type: 'client'; identity: string }
  | { type: 'application'; applicationSid: string }
  | { type: 'transcription'; track?: string; partialResults?: boolean;
      languageCode?: string; speechModel?: string }
  | { type: 'virtualAgent'; connectorName: string; language?: string };
```

### SMS Types

```typescript
interface SendSmsInput {
  to: string;                  // E.164 phone number
  from: string;                // E.164 phone number
  body: string;                // Message body (required, non-empty)
  mediaUrls?: string[];        // MMS media URLs (max 10, HTTPS only)
  statusCallback?: string;     // Delivery status webhook URL
}

interface BulkSmsInput {
  recipients: string[];        // Array of E.164 phone numbers
  from: string;
  body: string;
  mediaUrls?: string[];
}

interface BulkSmsResult {
  total: number;
  succeeded: number;
  failed: number;
  results: Array<{
    to: string;
    messageSid?: string;       // SM... SID on success
    status: string;
    error?: string;
  }>;
}

interface SmsListFilters {
  direction?: SmsDirection;
  status?: SmsStatus;
  from?: string;
  to?: string;
  contactId?: string;
  conversationId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
}
```

### Conference Types

```typescript
interface CreateConferenceInput {
  friendlyName: string;
  from: string;
  to: string;
  startConferenceOnEnter?: boolean;
  endConferenceOnExit?: boolean;
  record?: boolean;
  maxParticipants?: number;
  region?: 'us1' | 'us2' | 'ie1' | 'de1' | 'sg1' | 'br1' | 'au1' | 'jp1';
  statusCallback?: string;
  waitUrl?: string;
  beep?: boolean | 'true' | 'false' | 'onEnter' | 'onExit';
  label?: string;
}

interface AddParticipantInput {
  from: string;
  to: string;
  label?: string;
  muted?: boolean;
  hold?: boolean;
  coaching?: boolean;
  callSidToCoach?: string;
  startConferenceOnEnter?: boolean;
  endConferenceOnExit?: boolean;
  earlyMedia?: boolean;
  record?: boolean;
  timeout?: number;
  waitUrl?: string;
}

interface UpdateParticipantInput {
  muted?: boolean;
  hold?: boolean;
  holdUrl?: string;
  announceUrl?: string;
  coaching?: boolean;
  callSidToCoach?: string;
}
```

### Webhook Payload Types

```typescript
interface SmsWebhookPayload {
  MessageSid: string;
  AccountSid: string;
  From: string;
  To: string;
  Body: string;
  NumMedia: string;
  NumSegments: string;
  SmsStatus: string;
  MediaUrl0?: string;          // Up to MediaUrl9
  MediaContentType0?: string;
  ErrorCode?: string;
  ErrorMessage?: string;
}

interface CallStatusPayload {
  CallSid: string;
  AccountSid: string;
  CallStatus: string;
  CallDuration?: string;
  From: string;
  To: string;
  Direction: string;
  AnsweredBy?: string;
  RecordingUrl?: string;
  RecordingSid?: string;
  RecordingDuration?: string;
}

interface RecordingStatusPayload {
  RecordingSid: string;
  RecordingUrl: string;
  RecordingStatus: string;
  RecordingDuration: string;
  RecordingChannels: string;
  CallSid: string;
  AccountSid: string;
}
```

### Encryption Types

```typescript
interface EncryptedValue {
  iv: string;                  // Hex-encoded initialization vector
  encrypted: string;           // Hex-encoded ciphertext
  tag: string;                 // Hex-encoded authentication tag
}
```

### Client Hook Types

```typescript
interface PhoneCallState {
  deviceStatus: 'initializing' | 'ready' | 'busy' | 'offline' | 'error';
  callStatus: 'idle' | 'connecting' | 'ringing' | 'open' | 'closed' | 'error';
  direction: 'outbound' | 'inbound' | null;
  isMuted: boolean;
  isOnHold: boolean;
  remoteNumber: string | null;
  duration: number;            // Seconds
  error: string | null;
}

interface UsePhoneReturn {
  state: PhoneCallState;
  initialize: () => Promise<void>;
  call: (to: string, params?: Record<string, string>) => Promise<void>;
  accept: () => void;
  reject: () => void;
  hangup: () => void;
  toggleMute: () => void;
  sendDigits: (digits: string) => void;
  destroy: () => void;
}
```

---

## Core Services

### SubAccountService

Multi-tenant Twilio account isolation. Every service depends on this for credential resolution.

| Method | Signature | Description |
|--------|-----------|-------------|
| `createSubAccount` | `(ventureId, name) → SubAccountInfo` | Creates Twilio sub-account via master, encrypts token, stores in DB |
| `getSubAccount` | `(ventureId) → SubAccountInfo \| null` | Returns account info (checks vault → legacy) |
| `getClient` | `(ventureId) → TwilioClient` | Returns authenticated Twilio client (vault → legacy fallback) |
| `suspendSubAccount` | `(ventureId) → void` | Suspends sub-account on Twilio + updates DB |
| `closeSubAccount` | `(ventureId) → void` | Permanently closes sub-account (irreversible on Twilio) |
| `reactivateSubAccount` | `(ventureId) → void` | Reactivates suspended account (throws if closed) |
| `getUsage` | `(ventureId, start, end) → UsageRecord[]` | Usage records for billing period |
| `listSubAccounts` | `() → SubAccountInfo[]` | Admin: list all sub-accounts |
| `updateFriendlyName` | `(ventureId, name) → SubAccountInfo` | Update display name on Twilio + DB |

### VoiceService

Full outbound/inbound call management with TwiML generation.

| Method | Description |
|--------|-------------|
| `initiateCall(ventureId, input)` | Outbound call with retry logic (max 3), records in DB |
| `initiateAdvancedCall(ventureId, input)` | AMD, BYOC, SHAKEN/STIR, dual-channel recording |
| `generateTwiml(actions)` | Converts `TwimlAction[]` to TwiML XML string |
| `transfer(ventureId, callSid, input)` | Warm (announce + connect) or cold (redirect) transfer |
| `hold(ventureId, callSid)` | Put call on hold with classical hold music |
| `unhold(ventureId, callSid, returnUrl)` | Resume call by redirecting to return URL |
| `mute(ventureId, confSid, callSid)` | Mute conference participant |
| `unmute(ventureId, confSid, callSid)` | Unmute conference participant |
| `endCall(ventureId, callSid)` | Set call status to `completed`, update DB |
| `getCallStatus(ventureId, callSid)` | Real-time status from Twilio API |
| `generateToken(ventureId, input)` | Browser calling JWT access token (requires API keys) |
| `listCalls(ventureId, filters)` | Paginated call history with `Promise.all` count |
| `sendDigits(ventureId, callSid, digits)` | Send DTMF tones (validates `0-9*#wW` only) |
| `startCallRecording(ventureId, callSid)` | Start recording via REST API (not TwiML) |
| `pauseCallRecording(ventureId, callSid, recSid)` | PCI-compliant recording pause |
| `resumeCallRecording(ventureId, callSid, recSid)` | Resume paused recording |
| `stopCallRecording(ventureId, callSid, recSid)` | Stop active recording |
| `redirectCall(ventureId, callSid, url)` | Redirect to new TwiML URL |
| `cancelCall(ventureId, callSid)` | Cancel queued/ringing call |
| `deleteCallFromTwilio(ventureId, callSid)` | Delete for compliance (GDPR) |
| `fetchCallDetails(ventureId, callSid)` | Full call details from Twilio API |
| `submitCallFeedback(ventureId, callSid, score)` | Post-call quality rating (1-5) |

### SmsService

SMS/MMS messaging with bulk sending and delivery tracking.

| Method | Description |
|--------|-------------|
| `send(ventureId, input)` | Single SMS/MMS with retry logic, writes to DB |
| `sendBulk(ventureId, input)` | Bulk send: 10 concurrent, 100ms inter-batch delay |
| `handleIncoming(ventureId, payload)` | Process inbound SMS webhook, extract media URLs |
| `handleStatusCallback(payload)` | Update delivery status in DB |
| `getDeliveryStatus(ventureId, messageSid)` | Fetch from Twilio + sync to DB |
| `listMessages(ventureId, filters)` | Filtered + paginated with `Promise.all` count |
| `getById(messageId, ventureId)` | Single message lookup |

### ConferenceService

Multi-party conference management with coaching/whisper support.

| Method | Description |
|--------|-------------|
| `createConference(ventureId, input)` | Create conference by dialing first participant |
| `getConference(ventureId, confSid)` | Fetch conference details from Twilio |
| `listConferences(ventureId, filters)` | DB-first with Twilio API fallback |
| `updateConference(ventureId, confSid, input)` | Announce, end conference |
| `endConference(ventureId, confSid)` | Set status to `completed` |
| `addParticipant(ventureId, confSid, input)` | Dial participant into conference |
| `listParticipants(ventureId, confSid)` | All active participants |
| `updateParticipant(ventureId, confSid, callSid, input)` | Mute/hold/coach |
| `removeParticipant(ventureId, confSid, callSid)` | Kick participant |
| `muteParticipant / unmuteParticipant` | Convenience methods |
| `holdParticipant / unholdParticipant` | Convenience with optional hold music URL |
| `coachParticipant(ventureId, confSid, coachSid, targetSid)` | Enable whisper coaching |
| `startRecording / stopRecording / pauseRecording / resumeRecording` | Conference recording lifecycle |
| `listRecordings(ventureId, confSid)` | All recordings for a conference |

### IvrService

Interactive Voice Response tree builder with TwiML generation.

| Method | Description |
|--------|-------------|
| `createTree(ventureId, input)` | Create IVR tree with full validation |
| `updateTree(treeId, ventureId, input)` | Update tree with re-validation |
| `getTree(treeId, ventureId)` | Single tree lookup |
| `listTrees(ventureId)` | All trees for a venture |
| `deleteTree(treeId, ventureId)` | Delete tree |
| `generateTwiml(tree, nodeId, dtmfInput?)` | Navigate tree and generate TwiML |
| `testTree(nodes)` | Validate graph: dead ends, invalid refs, missing content |

**IVR Validation Rules:**
- All `nextNodeId`, `openNodeId`, `closedNodeId` references must point to existing nodes
- All DTMF route targets must exist in the tree
- `dialTarget` phone numbers validated for E.164 format
- `audioUrl` and `webhookUrl` validated for SSRF (no private IPs, no localhost)
- Menu nodes must have at least one DTMF route (warning)
- Non-terminal nodes should have a `nextNodeId` (warning)

### RecordingService

Call recording and voicemail management with PCI compliance.

| Method | Description |
|--------|-------------|
| `startRecording(ventureId, callSid)` | Start dual-channel recording with callback |
| `pauseRecording(ventureId, callSid, recSid)` | PCI-compliant pause (e.g., credit card input) |
| `resumeRecording(ventureId, callSid, recSid)` | Resume after sensitive data collection |
| `stopRecording(ventureId, callSid, recSid)` | Stop active recording |
| `getRecording(ventureId, recSid)` | Recording metadata + download URL |
| `transcribe(ventureId, recSid)` | Trigger async transcription |
| `deleteRecording(ventureId, recSid)` | Delete from Twilio + clear DB references |
| `listRecordings(ventureId, filters)` | Paginated recording list |
| `createVoicemail(ventureId, data)` | Create voicemail record from webhook |
| `markVoicemailRead(vmId, ventureId)` | Mark as read |
| `listVoicemails(ventureId, options)` | List with optional unread-only filter |
| `deleteVoicemail(vmId, ventureId)` | Delete voicemail + recording from Twilio |

### Additional Services (22 more)

| Service | Key Capabilities |
|---------|-----------------|
| `PhoneNumberService` | Search available numbers by area code/type, purchase, configure webhooks, release |
| `ConversationsService` | Create omnichannel conversations, manage participants, send messages |
| `FlexService` | Manage Flex workers, task queues, get real-time/cumulative statistics |
| `VerifyService` | Send verification codes (SMS/call/email/WhatsApp), check codes, create services |
| `WhatsAppService` | Send freeform and template messages via WhatsApp Business |
| `MessagingServiceService` | Create/manage messaging services, add phone number senders |
| `QueueService` | Create call queues, enqueue/dequeue callers, get wait time statistics |
| `StreamService` | Start/stop real-time media streams for AI/ML processing |
| `SipService` | SIP domains, credential lists, IP access control lists |
| `CallerIdService` | Add/verify outgoing caller IDs with validation codes |
| `DialingPermissionsService` | Manage per-country dialing permissions (low/high risk) |
| `LookupService` | Phone number lookup: carrier, caller name, line type, SIM swap |
| `NumberIntelligenceService` | SIM swap detection, identity match, live activity, reassigned number |
| `VideoService` | Create rooms (P2P/group), generate tokens, manage compositions |
| `SyncService` | Create sync services, manage documents/lists/maps |
| `NotifyService` | Create notification services, manage bindings, send push notifications |
| `TrustHubService` | Customer profiles, trust products, end users, supporting documents |
| `A2pRegistrationService` | Register brands and campaigns for 10DLC compliance |
| `VoiceInsightsService` | Call summaries, quality metrics, annotations |
| `WebhookHandlerService` | Route incoming Twilio webhook events to appropriate handlers |

---

## TwiML Generation

### VoiceService.generateTwiml()

Converts an array of `TwimlAction` objects into valid TwiML XML. All user-provided text is XML-escaped to prevent injection.

```typescript
const twiml = voiceService.generateTwiml([
  { type: 'say', text: 'Hello!', voice: 'Polly.Joanna' },
  { type: 'gather', numDigits: 1, action: '/handle', nested: [
    { type: 'say', text: 'Press 1 for sales.' },
  ]},
  { type: 'hangup' },
]);
// Output:
// <?xml version="1.0" encoding="UTF-8"?>
// <Response>
//   <Say voice="Polly.Joanna">Hello!</Say>
//   <Gather numDigits="1" action="/handle">
//     <Say>Press 1 for sales.</Say>
//   </Gather>
//   <Hangup />
// </Response>
```

### IvrTwimlGenerator

Stateless utility class for common IVR patterns:

| Method | Description |
|--------|-------------|
| `generateFromFlow(flow, nodeId, input?)` | Navigate IVR tree and render TwiML |
| `generateGreeting(text, voice?)` | Simple greeting TwiML |
| `generateMenu(options, actionUrl)` | DTMF menu with gather |
| `generateQueue(name, waitUrl?)` | Queue with hold message |

### VoiceResponseTemplates

Pre-built TwiML templates:

| Template | Description |
|----------|-------------|
| `businessClosed(message?)` | After-hours closure message |
| `voicemailGreeting(message?)` | Voicemail with recording prompt + transcription |
| `holdMusic(musicUrl?)` | Hold music loop (10 iterations) |
| `transferAnnouncement(agentName?)` | Transfer announcement before connecting |

---

## Webhook System

### Signature Validation

All incoming Twilio webhooks are validated using HMAC-SHA1 signature verification:

```typescript
function validateTwilioSignature(
  authToken: string,
  signature: string,     // X-Twilio-Signature header
  url: string,           // Full webhook URL
  params: Record<string, string>  // POST body
): boolean
```

The implementation uses **constant-time string comparison** to prevent timing attacks.

### Webhook Handlers

| Handler | Trigger | Returns |
|---------|---------|---------|
| `handleIncomingCall(accountSid, payload)` | Inbound voice call | `{ handled, callSid, status }` |
| `handleCallStatus(payload)` | Call status change | `{ handled, callSid, status }` |
| `handleRecordingComplete(payload)` | Recording finished | `{ handled, callSid, status }` |
| `handleIncomingSms(accountSid, payload)` | Inbound SMS | `{ handled, messageSid, from, to }` |
| `handleSmsStatus(payload)` | SMS delivery status | `{ handled, messageSid, status }` |
| `handleStatusCallback(eventType, payload)` | Generic router | Routes to appropriate handler |

### Webhook URL Paths

All webhooks use the prefix `/api/twilio`:

| Path | Handler |
|------|---------|
| `/api/twilio/voice/incoming` | Incoming voice calls |
| `/api/twilio/sms/incoming` | Incoming SMS messages |
| `/api/twilio/sms/status` | SMS delivery status |
| `/api/twilio/ivr/{treeId}/{nodeId}` | IVR navigation |
| `/api/twilio/ivr/{treeId}/{nodeId}/recording` | IVR recording callback |
| `/api/twilio/ivr/{treeId}/{nodeId}/voicemail` | Voicemail callback |
| `/api/twilio/webhooks/recording-status` | Recording status callback |
| `/api/twilio/webhooks/transcription` | Transcription completion |

---

## Middleware & Utilities

### Phone Number Validation

```typescript
import { validatePhoneNumber, normalizePhoneNumber } from '@mcv/twilio/server';

// Full validation with result
const result = validatePhoneNumber('+14155551234', {
  requireE164: true,          // Require E.164 format (default: true)
  defaultCountryCode: 'US',   // Auto-prepend country code
  validateCountry: 'US',      // Validate against US pattern
  allowShortCodes: false,     // Allow 4-6 digit short codes
});
// → { valid: true, normalized: '+14155551234', countryCode: 'US',
//     isTollFree: false, isShortCode: false }

// Normalization: various formats → E.164
normalizePhoneNumber('(415) 555-1234', 'US');  // → '+14155551234'
normalizePhoneNumber('4155551234', 'US');       // → '+14155551234'
normalizePhoneNumber('+14155551234');           // → '+14155551234'
```

**Country-specific patterns supported:** US, CA, GB, AU, DE, FR, ES, IT

### URL Validation (SSRF Protection)

```typescript
import { validateCallbackUrl, buildWebhookUrl } from '@mcv/twilio/server';

const result = validateCallbackUrl('https://api.example.com/webhook');
// → { valid: true, url: 'https://api.example.com/webhook',
//     details: { protocol: 'https:', hostname: 'api.example.com', ... } }

// Blocked:
validateCallbackUrl('http://localhost:3000/hook');
// → { valid: false, error: 'URL hostname is not allowed' }

validateCallbackUrl('http://169.254.169.254/metadata');
// → { valid: false, error: 'URL hostname is not allowed' }

validateCallbackUrl('http://10.0.0.1/internal');
// → { valid: false, error: 'Private IP addresses are not allowed' }
```

**SSRF blocks:**
- `localhost`, `0.0.0.0`, `::1`, and all loopback variants
- RFC 1918 private IPs: `10.x.x.x`, `172.16-31.x.x`, `192.168.x.x`
- RFC 6598 carrier-grade NAT: `100.64-127.x.x`
- Link-local: `169.254.x.x`
- Cloud metadata: `169.254.169.254`, `metadata.google.internal`
- Kubernetes: `kubernetes.default`, `kubernetes.default.svc`
- IPv6 private ranges: `fe80:`, `fc`, `fd`, IPv4-mapped private

### Retry with Exponential Backoff

```typescript
import { withRetry, isRateLimitError } from '@mcv/twilio/server';

const result = await withRetry(
  async () => client.messages.create(params),
  {
    maxRetries: 3,              // Default: 3
    initialDelay: 1000,         // Default: 1000ms
    backoffMultiplier: 2,       // Default: 2
    maxDelay: 30_000,           // Default: 30s
    jitter: 0.1,                // Default: ±10%
    retryableStatusCodes: [429, 500, 502, 503, 504],
    onRetry: (error, attempt, delay) => {
      console.warn(`Retry ${attempt} in ${delay}ms`);
    },
  }
);
```

**Retryable Twilio error codes:** `20003`, `20429`, `31000`

**Retryable network errors:** `ECONNRESET`, `ECONNREFUSED`, `ETIMEDOUT`, `socket hang up`

### Error Sanitization

```typescript
import { sanitizeTwilioError, redactSensitiveInfo } from '@mcv/twilio/server';

// Sanitize for client response
const safe = sanitizeTwilioError(twilioError);
// → { code: 'TWILIO_21211', message: 'The phone number is invalid for voice calls.',
//     retryable: false }

// Redact sensitive patterns from strings
redactSensitiveInfo('Account AC1234...5678 failed with token abc...');
// → 'Account [REDACTED] failed with token [REDACTED]'
```

**Patterns redacted:** Account SIDs (`AC...`), Call SIDs (`CA...`), Message SIDs (`SM...`), all other Twilio SIDs, auth tokens, passwords, phone numbers (shows last 4 only), IP addresses, email addresses, URLs with query parameters.

---

## Client Layer (React)

### usePhone Hook

Browser-based calling via Twilio Client SDK (WebRTC). Manages the full `Device` lifecycle including token refresh, incoming calls, and call state.

```tsx
import { usePhone } from '@mcv/twilio/client';

function DialerPage() {
  const { state, initialize, call, hangup, toggleMute, sendDigits } = usePhone({
    getToken: async () => {
      const res = await trpc.twilio.generateToken.query();
      return res.token;
    },
    onIncomingCall: (from) => showNotification(`Call from ${from}`),
    onCallConnected: () => console.log('Connected!'),
    onCallDisconnected: () => console.log('Call ended'),
    autoInit: true,
  });

  return (
    <div>
      <p>Device: {state.deviceStatus} | Call: {state.callStatus}</p>
      <p>Duration: {state.duration}s | Muted: {state.isMuted}</p>
      <button onClick={() => call('+14155551234')}>Call</button>
      <button onClick={hangup}>Hangup</button>
      <button onClick={toggleMute}>
        {state.isMuted ? 'Unmute' : 'Mute'}
      </button>
    </div>
  );
}
```

**Features:**
- Automatic token refresh on `tokenWillExpire`
- Incoming call detection with accept/reject
- DTMF digit sending
- Duration timer with 1-second resolution
- Full cleanup on unmount via `destroy()`

### Additional Client Exports

| Hook | Purpose |
|------|---------|
| `useSms` | SMS composition and sending |
| `useCallStatus` | Real-time call status polling |
| `useConversations` | Conversations API thread management |
| `useFlexAgent` | Flex worker status and activity management |
| `usePhoneNumbers` | Phone number list and search |

| Component | Purpose |
|-----------|---------|
| `Dialer` | Full phone dialer UI with DTMF keypad |
| `SmsComposer` | SMS/MMS message composition |
| `CallControls` | In-call controls (mute, hold, transfer, keypad) |
| `ConversationThread` | Conversation message thread display |
| `FlexAgentPanel` | Flex agent status and task management |
| `IvrBuilder` | Visual IVR flow builder (drag-and-drop) |

---

## Code Examples

### 1. Provision a Venture with Full Telephony

```typescript
import { SubAccountService, PhoneNumberService } from '@mcv/twilio/server';

const subAccSvc = new SubAccountService(db);
const phoneSvc = new PhoneNumberService(db);

// Step 1: Create isolated sub-account
const subAccount = await subAccSvc.createSubAccount(ventureId, 'Acme Corp');
// → { ventureId, accountSid: 'AC...', friendlyName: 'Acme Corp', status: 'active' }

// Step 2: Search and purchase a phone number
const available = await phoneSvc.searchAvailable(ventureId, {
  country: 'US',
  type: 'local',
  areaCode: '415',
  limit: 5,
});

const number = await phoneSvc.purchase(ventureId, {
  phoneNumber: available[0].phoneNumber,
  friendlyName: 'Main Line',
  smsUrl: 'https://api.mcv.one/api/twilio/sms/incoming',
  voiceUrl: 'https://api.mcv.one/api/twilio/voice/incoming',
});
```

### 2. Send SMS with Delivery Tracking

```typescript
import { SmsService } from '@mcv/twilio/server';

const smsSvc = new SmsService(db);

const message = await smsSvc.send(ventureId, {
  to: '+14155551234',
  from: '+14155559876',
  body: 'Your order has shipped! Track at https://example.com/track/123',
  statusCallback: 'https://api.mcv.one/api/twilio/sms/status',
});

console.log(message.twilioSid);  // SM...
console.log(message.status);     // 'queued'

// Later: check delivery status
const status = await smsSvc.getDeliveryStatus(ventureId, message.twilioSid!);
// → { status: 'delivered', errorCode: undefined, errorMessage: undefined }
```

### 3. Initiate an Outbound Call with AMD

```typescript
import { VoiceService } from '@mcv/twilio/server';

const voiceSvc = new VoiceService(db);

const call = await voiceSvc.initiateCall(ventureId, {
  to: '+14155551234',
  from: '+14155559876',
  twiml: voiceSvc.generateTwiml([
    {
      type: 'say',
      text: 'Hello! This is a reminder about your appointment tomorrow.',
      voice: 'Polly.Joanna',
    },
    {
      type: 'gather',
      input: 'dtmf',
      numDigits: 1,
      action: '/api/twilio/gather-response',
      nested: [
        { type: 'say', text: 'Press 1 to confirm, press 2 to cancel.' },
      ],
    },
  ]),
  record: true,
  machineDetection: 'Enable',
});
// → { id: 'uuid', twilioSid: 'CA...', status: 'initiated', from, to, ... }
```

### 4. Build a Complete IVR Tree

```typescript
import { IvrService } from '@mcv/twilio/server';

const ivrSvc = new IvrService(db);

const tree = await ivrSvc.createTree(ventureId, {
  name: 'Main Menu',
  phoneNumberId: phoneNumber.id,
  nodes: [
    {
      id: 'welcome',
      type: 'menu',
      label: 'Welcome',
      text: 'Thank you for calling Acme Corp. Press 1 for sales, 2 for support, 3 for hours.',
      voice: 'Polly.Joanna',
      numDigits: 1,
      timeout: 5,
      routes: { '1': 'sales', '2': 'support', '3': 'hours' },
      nextNodeId: 'voicemail',
    },
    { id: 'sales', type: 'dial', label: 'Sales', dialTarget: '+14155551111' },
    { id: 'support', type: 'queue', label: 'Support Queue', queueName: 'support',
      text: 'Please hold while we connect you to a support agent.' },
    {
      id: 'hours',
      type: 'time_check',
      label: 'Business Hours',
      businessHours: {
        timezone: 'America/New_York',
        schedule: [
          { day: 1, open: '09:00', close: '17:00' },
          { day: 2, open: '09:00', close: '17:00' },
          { day: 3, open: '09:00', close: '17:00' },
          { day: 4, open: '09:00', close: '17:00' },
          { day: 5, open: '09:00', close: '17:00' },
        ],
      },
      openNodeId: 'sales',
      closedNodeId: 'voicemail',
    },
    {
      id: 'voicemail',
      type: 'voicemail',
      label: 'Voicemail',
      text: 'Please leave a message after the beep.',
      maxLength: 120,
      transcribe: true,
    },
  ],
});

// Validate the tree structure
const validation = ivrSvc.testTree(tree.nodes as IvrNode[]);
// → { valid: true, errors: [], warnings: [] }

// Generate TwiML for a specific node
const twiml = ivrSvc.generateTwiml(tree, 'welcome');
// Returns: <Response><Gather numDigits="1" ...>...</Gather>...</Response>
```

### 5. Bulk SMS Campaign with Rate Limiting

```typescript
import { SmsService } from '@mcv/twilio/server';

const smsSvc = new SmsService(db);

const result = await smsSvc.sendBulk(ventureId, {
  recipients: ['+14155551111', '+14155552222', '+14155553333', /* up to 10,000 */],
  from: '+14155559876',
  body: '🎉 Flash sale! 50% off all plans for the next 24 hours. Reply STOP to opt out.',
});

console.log(`Total: ${result.total}`);
console.log(`Sent: ${result.succeeded}`);
console.log(`Failed: ${result.failed}`);
// Bulk sends: 10 concurrent per batch, 100ms delay between batches
// All phone numbers validated before sending begins
// Individual failures don't block the batch
```

### 6. Conference Call with Supervisor Coaching

```typescript
import { ConferenceService } from '@mcv/twilio/server';

const confSvc = new ConferenceService(db);

// Create conference and dial first participant
const conf = await confSvc.createConference(ventureId, {
  friendlyName: 'Sales Call - Acme Deal',
  from: '+14155559876',
  to: '+14155551234',     // Customer
  record: true,
  maxParticipants: 10,
  region: 'us1',
});

// Add supervisor as coach (whisper to agent, customer can't hear)
await confSvc.addParticipant(ventureId, conf.conferenceSid, {
  from: '+14155559876',
  to: '+14155558888',     // Supervisor
  coaching: true,
  callSidToCoach: 'CA...', // Agent's call SID
  muted: true,
});

// Hold the customer while discussing
await confSvc.holdParticipant(
  ventureId, conf.conferenceSid, customerCallSid,
  'http://com.twilio.music.classical.s3.amazonaws.com/BusssyPadWithSwell_Twilion.mp3'
);

// Bring customer back
await confSvc.unholdParticipant(ventureId, conf.conferenceSid, customerCallSid);

// End conference
await confSvc.endConference(ventureId, conf.conferenceSid);
```

### 7. Browser-Based Calling (Full Stack)

```typescript
// Server: Generate access token
import { VoiceService } from '@mcv/twilio/server';

const voiceSvc = new VoiceService(db);

// tRPC / API route
const { token, identity } = await voiceSvc.generateToken(ventureId, {
  identity: 'agent-jane',
  ttl: 3600,  // 1 hour
});
// Requires: TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET, TWILIO_TWIML_APP_SID
```

```tsx
// Client: Browser dialer with usePhone hook
import { usePhone } from '@mcv/twilio/client';

function AgentDialer() {
  const phone = usePhone({
    getToken: () => trpc.twilio.generateToken.query().then(r => r.token),
    onIncomingCall: (from) => toast(`Incoming: ${from}`),
    autoInit: true,
  });

  return (
    <div>
      <p>Status: {phone.state.deviceStatus}</p>
      {phone.state.callStatus === 'idle' && (
        <button onClick={() => phone.call('+14155551234')}>
          Call Customer
        </button>
      )}
      {phone.state.callStatus === 'open' && (
        <>
          <p>Duration: {phone.state.duration}s</p>
          <button onClick={phone.toggleMute}>
            {phone.state.isMuted ? '🔇 Unmute' : '🔊 Mute'}
          </button>
          <button onClick={phone.hangup}>End Call</button>
          <button onClick={() => phone.sendDigits('1')}>Press 1</button>
        </>
      )}
      {phone.state.callStatus === 'ringing' && phone.state.direction === 'inbound' && (
        <>
          <p>Incoming from: {phone.state.remoteNumber}</p>
          <button onClick={phone.accept}>Accept</button>
          <button onClick={phone.reject}>Reject</button>
        </>
      )}
    </div>
  );
}
```

### 8. WhatsApp Template Message

```typescript
import { WhatsAppService } from '@mcv/twilio/server';

const waSvc = new WhatsAppService(db);

await waSvc.sendTemplate(ventureId, {
  to: 'whatsapp:+14155551234',
  templateSid: 'HX...',
  templateVars: {
    '1': 'John',
    '2': 'March 15, 2024',
  },
});
```

### 9. Phone Number Intelligence

```typescript
import { LookupService, NumberIntelligenceService } from '@mcv/twilio/server';

// Basic lookup
const lookupSvc = new LookupService(db);
const lookup = await lookupSvc.lookup(ventureId, '+14155551234', {
  fields: ['carrier', 'caller_name', 'line_type_intelligence', 'sim_swap'],
});
console.log(lookup.carrier?.name);                  // 'T-Mobile'
console.log(lookup.lineTypeIntelligence?.type);      // 'mobile'
console.log(lookup.simSwap?.lastSimSwap.swappedInPeriod);  // false

// Advanced intelligence
const niSvc = new NumberIntelligenceService(db);

// SIM swap detection (fraud prevention)
const simSwap = await niSvc.checkSimSwap(ventureId, '+14155551234');
if (simSwap.swappedInPeriod) {
  console.warn('SIM was recently swapped — possible fraud!');
}

// Identity match
const match = await niSvc.identityMatch(ventureId, '+14155551234', {
  firstName: 'John',
  lastName: 'Smith',
  dateOfBirth: '1990-01-15',
});
console.log(match.firstNameMatch);  // 'exact_match'
```

### 10. Call Transfer (Warm & Cold)

```typescript
import { VoiceService } from '@mcv/twilio/server';

const voiceSvc = new VoiceService(db);

// Warm transfer: announces to customer before connecting
await voiceSvc.transfer(ventureId, callSid, {
  to: '+14155558888',
  type: 'warm',
  announceUrl: 'https://api.mcv.one/api/twilio/announce/transfer',
});
// Generates: <Say>Please hold while we connect you.</Say><Dial>+14155558888</Dial>

// Cold transfer: immediately redirects the call
await voiceSvc.transfer(ventureId, callSid, {
  to: '+14155558888',
  type: 'cold',
});
// Generates: <Dial>+14155558888</Dial>
```

### 11. AES-256-GCM Credential Encryption

```typescript
import { encrypt, decrypt } from '@mcv/twilio';

// Encrypt auth token before database storage
const encrypted = encrypt(authToken);
// → '{"iv":"a1b2c3...","encrypted":"d4e5f6...","tag":"789abc..."}'

// Decrypt when creating Twilio client
const token = decrypt(encrypted);

// Client cache management
import { configureClientCache, getCacheStats, clearClientCache } from '@mcv/twilio';

configureClientCache({ ttlMs: 30 * 60 * 1000, maxSize: 50 });

const stats = getCacheStats();
// → { size: 12, maxSize: 50, ttlMs: 1800000,
//     entries: [{ accountSid: 'AC1234...', ageMs: 55000, isValid: true }] }

// Rotate credentials: clear cache to force re-fetch
clearClientCache();
```

### 12. Recording with PCI-Compliant Pause

```typescript
import { RecordingService } from '@mcv/twilio/server';

const recSvc = new RecordingService(db);

// Start recording
const recording = await recSvc.startRecording(ventureId, callSid);
console.log(recording.sid);  // RE...

// Agent: "I'll need your credit card number"
await recSvc.pauseRecording(ventureId, callSid, recording.sid);

// Customer provides CC number (not recorded)

// Resume recording
await recSvc.resumeRecording(ventureId, callSid, recording.sid);

// End of call: trigger transcription
await recSvc.transcribe(ventureId, recording.sid);
```

### 13. 2FA with Verify Service

```typescript
import { VerifyService } from '@mcv/twilio/server';

const verifySvc = new VerifyService(db);

// Send verification code
await verifySvc.sendCode(ventureId, {
  to: '+14155551234',
  channel: 'sms',  // or 'call', 'email', 'whatsapp'
});

// Check code
const result = await verifySvc.checkCode(ventureId, {
  to: '+14155551234',
  code: '123456',
});
console.log(result.valid);  // true
```

### 14. Real-Time Media Stream for AI Processing

```typescript
import { StreamService } from '@mcv/twilio/server';

const streamSvc = new StreamService(db);

// Start media stream (e.g., for real-time AI transcription)
const stream = await streamSvc.startStream(ventureId, callSid, {
  url: 'wss://ai.mcv.one/media-stream',
  name: 'ai-transcription',
  track: 'both_tracks',
  parameters: {
    ventureId,
    agentId: 'agent-123',
  },
});

// Stop stream when done
await streamSvc.stopStream(ventureId, callSid, stream.sid);
```

### 15. Webhook Signature Validation

```typescript
import { createTwilioWebhookValidator } from '@mcv/twilio/server';

const validator = createTwilioWebhookValidator({
  authToken: process.env.TWILIO_AUTH_TOKEN!,
  baseUrl: 'https://api.mcv.one',
  allowUnsignedInDev: true,  // Skip in development
});

// In your route handler (Express-style)
app.post('/api/twilio/sms/incoming', async (req, res) => {
  const isValid = await validator(req);
  if (!isValid) {
    return res.status(403).send('Invalid Twilio signature');
  }
  // Process webhook...
});
```

---

## TCPA & Regulatory Compliance

### US TCPA Calling Hours

```typescript
import {
  TCPA_EARLIEST_CALL_HOUR,   // 8 (8:00 AM local time)
  TCPA_LATEST_CALL_HOUR,     // 21 (9:00 PM local time)
  TCPA_CALLING_WINDOW,       // '8:00 AM - 9:00 PM local time'
} from '@mcv/twilio';
```

### Opt-In / Opt-Out Keywords

```typescript
import {
  OPT_OUT_KEYWORDS,          // ['STOP', 'STOPALL', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT']
  OPT_IN_KEYWORDS,           // ['START', 'YES', 'UNSTOP', 'SUBSCRIBE']
  HELP_KEYWORDS,             // ['HELP', 'INFO']
  DEFAULT_OPT_OUT_RESPONSE,
  DEFAULT_OPT_IN_RESPONSE,
  DEFAULT_HELP_RESPONSE,
} from '@mcv/twilio';
```

### Message Throughput Limits

```typescript
import { THROUGHPUT_LIMITS } from '@mcv/twilio';

// Messages per second by number type:
// local_10dlc: 15 MPS       (registered 10DLC)
// toll_free: 3 MPS           (toll-free number)
// short_code: 100 MPS        (short code)
// local_unregistered: 1 MPS  (unregistered local)
```

### A2P 10DLC Campaign Use Cases

```typescript
import { A2P_CAMPAIGN_USE_CASES } from '@mcv/twilio';

// 'marketing' | 'notifications' | 'customer_care'
// | 'delivery_notifications' | 'account_notifications'
// | 'two_factor_authentication' | 'security_alerts'
// | 'fraud_alerts' | 'polling_and_voting'
// | 'public_service_announcement' | 'mixed'
```

### Media Limits

```typescript
import { MAX_MMS_MEDIA_URLS, MAX_MMS_MEDIA_SIZE_BYTES, MAX_SMS_SEGMENTS } from '@mcv/twilio';

// MAX_MMS_MEDIA_URLS: 10 attachments per MMS
// MAX_MMS_MEDIA_SIZE_BYTES: 5 MB per attachment
// MAX_SMS_SEGMENTS: 10 segments per SMS
```

---

## Security Considerations

| # | Security Control | Implementation |
|---|-----------------|----------------|
| 1 | **Credential Encryption** | Sub-account auth tokens encrypted at rest with AES-256-GCM (16-byte IV, 128-bit auth tag). Requires 64-char hex key. |
| 2 | **Vault-First Resolution** | Credentials fetched from GCP Secret Manager before falling back to encrypted DB storage. |
| 3 | **Webhook Signature Validation** | All Twilio webhooks validated via `X-Twilio-Signature` HMAC-SHA1 with constant-time comparison to prevent timing attacks. |
| 4 | **Phone Number Validation** | All phone numbers validated for E.164 format with country-specific patterns before any API call. |
| 5 | **SSRF Protection** | All callback/webhook URLs validated against blocked hosts (private IPs, localhost, cloud metadata, Kubernetes services). |
| 6 | **Error Sanitization** | Account SIDs, auth tokens, phone numbers, IPs, and emails automatically stripped from all error messages before client response. |
| 7 | **Sub-Account Isolation** | Each venture operates in its own Twilio sub-account — billing, data, and configuration are fully isolated. |
| 8 | **Rate Limit Handling** | Automatic retry with exponential backoff + jitter on HTTP 429 and transient errors (500, 502, 503, 504). |
| 9 | **DTMF Validation** | Only `0-9`, `*`, `#`, `w`, `W` characters allowed in `sendDigits()` — prevents TwiML injection. |
| 10 | **Client Cache TTL** | Cached Twilio clients expire after 1 hour (configurable) to prevent stale credential use. LRU eviction at max size. |
| 11 | **TwiML XML Escaping** | All user-provided text is XML-escaped (`&`, `<`, `>`, `"`, `'`) to prevent TwiML injection attacks. |
| 12 | **PCI Recording Pause** | Recording pause/resume for PCI DSS compliance during sensitive data collection (credit cards). |
| 13 | **Lazy Module Loading** | `twilio` SDK loaded via `require()` only when first client is created — prevents module-level credential exposure. |

---

## Performance Considerations

| # | Optimization | Details |
|---|-------------|---------|
| 1 | **Client Caching** | Twilio clients cached per account SID. Default: 1h TTL, 100 max entries, LRU eviction, stale entry cleanup. |
| 2 | **Parallel Queries** | All list operations use `Promise.all([data, count])` for simultaneous data + pagination count. |
| 3 | **Bulk Send Batching** | 10 concurrent sends per batch with 100ms inter-batch delay. Max 10,000 recipients per bulk operation. |
| 4 | **Retry Logic** | Exponential backoff: 1s → 2s → 4s (×2 multiplier) with ±10% jitter. Max delay capped at 30 seconds. |
| 5 | **Lazy Imports** | `twilio` module loaded via dynamic `require()` only when first client is needed — reduces cold start time. |
| 6 | **Lookup Caching** | Phone number lookups cached in `twilio_lookup_cache` table with TTL-based expiry to avoid repeated API calls. |
| 7 | **Database Indexes** | All tables indexed on `(venture_id)` and relevant foreign keys for O(log n) lookups. |
| 8 | **Webhook Batching** | Status callbacks update DB with minimal writes — only changed fields are SET. |
| 9 | **Cache Statistics** | `getCacheStats()` provides real-time cache hit monitoring with per-entry age and validity tracking. |

---

## Error Codes & Handling

### Application-Level Errors

| Error Message | Context | Description |
|---------------|---------|-------------|
| `Twilio sub-account not configured for this venture` | SubAccountService.getClient | No vault integration or legacy sub-account found |
| `Twilio sub-account is not active` | SubAccountService.getClient | Sub-account is suspended or closed |
| `Venture already has a Twilio sub-account configured` | SubAccountService.createSubAccount | Duplicate sub-account creation |
| `Cannot reactivate a closed sub-account` | SubAccountService.reactivateSubAccount | Closed accounts are permanent |
| `Invalid 'to' phone number` | VoiceService / SmsService | E.164 validation failure |
| `Invalid 'from' phone number` | VoiceService / SmsService | E.164 validation failure |
| `Either twiml or url must be provided` | VoiceService.initiateCall | Missing call instruction |
| `Message body is required` | SmsService.send | Empty SMS body |
| `Maximum 10 media URLs allowed` | SmsService.send | MMS media limit exceeded |
| `Invalid DTMF digits` | VoiceService.sendDigits | Non-DTMF characters |
| `TWILIO_ENCRYPTION_KEY must be a 64-character hex string` | encrypt/decrypt | Missing or invalid encryption key |
| `IVR tree name is required` | IvrService | Empty name |
| `IVR tree has no nodes` | IvrService.testTree | Empty node array |
| `IVR tree validation failed` | IvrService | Dead ends or invalid references |
| `IVR node validation failed` | IvrService | Invalid phone numbers or URLs in nodes |
| `APP_URL environment variable is required` | RecordingService / URL util | Missing webhook base URL |

### Twilio API Error Codes (Mapped to User-Friendly Messages)

| Code | Category | User-Friendly Message |
|------|----------|----------------------|
| 20003 | Auth | Authentication failed. Please check your credentials. |
| 20404 | Not Found | The requested resource was not found. |
| 20429 | Rate Limit | Too many requests. Please try again later. |
| 21201 | Voice | The phone number is invalid. |
| 21211 | Voice | The phone number is invalid for voice calls. |
| 21214 | Voice | The phone number cannot receive calls. |
| 21601 | SMS | The phone number is not valid for SMS. |
| 21602 | SMS | The message body is required. |
| 21608 | SMS | The phone number cannot receive SMS messages. |
| 30003 | SMS | The destination number is unreachable. |
| 30004 | SMS | The message was blocked. |
| 30006 | SMS | Landline or unreachable carrier. |
| 30007 | SMS | Carrier violation. |
| 31001 | Recording | Recording failed. |
| 32001 | Conference | Conference not found. |
| 32002 | Conference | Conference is full. |
| 53001 | Video | Video room creation failed. |

### Retryable Error Codes

These errors trigger automatic retry with exponential backoff:

| Code | Description |
|------|-------------|
| 20429 | Too many requests (rate limit) |
| 30003 | Destination unreachable (transient) |
| 30008 | Unknown carrier error (transient) |
| 31001 | Recording failed (transient) |
| 52001 | Service temporarily unavailable |

---

## Audit Events

| Event | Trigger | Audit Data |
|-------|---------|------------|
| `twilio.subaccount.created` | Sub-account provisioned | ventureId, accountSid |
| `twilio.subaccount.suspended` | Sub-account suspended | ventureId |
| `twilio.subaccount.closed` | Sub-account permanently closed | ventureId |
| `twilio.subaccount.reactivated` | Sub-account reactivated | ventureId |
| `twilio.number.purchased` | Phone number purchased | phoneNumber, type, monthlyPrice |
| `twilio.number.released` | Phone number released | phoneNumber |
| `twilio.number.configured` | Webhook URLs updated | phoneNumber, changes |
| `twilio.sms.sent` | SMS/MMS sent | to (last 4), segments, direction |
| `twilio.sms.bulk` | Bulk SMS campaign | total, succeeded, failed |
| `twilio.sms.received` | Inbound SMS received | from (last 4), hasMedia |
| `twilio.call.initiated` | Outbound call started | to (last 4), direction |
| `twilio.call.completed` | Call ended | duration, status |
| `twilio.call.transferred` | Call transferred | type (warm/cold), to (last 4) |
| `twilio.recording.started` | Recording began | callSid (last 4) |
| `twilio.recording.paused` | Recording paused (PCI) | recordingSid (last 4) |
| `twilio.recording.deleted` | Recording deleted | recordingSid (last 4) |
| `twilio.ivr.created` | IVR tree created | name, nodeCount |
| `twilio.ivr.updated` | IVR tree modified | treeId, changedFields |
| `twilio.conference.created` | Conference started | friendlyName, region |
| `twilio.conference.ended` | Conference ended | friendlyName, duration |
| `twilio.a2p.brand.registered` | A2P brand registered | brandSid, status |
| `twilio.a2p.campaign.registered` | A2P campaign registered | campaignType, status |
| `twilio.token.generated` | Browser calling token generated | identity, ttl |
| `twilio.voicemail.created` | Voicemail received | from (last 4), duration |
| `twilio.verify.sent` | Verification code sent | to (last 4), channel |

---

## Default Configuration Constants

```typescript
// ═══════════════════════════════════════════════════════════════════════════════
// RETRY POLICIES
// ═══════════════════════════════════════════════════════════════════════════════
DEFAULT_MAX_RETRIES            = 3         // Max retry attempts
DEFAULT_RETRY_DELAY_MS         = 1_000     // Initial retry delay (1 second)
RETRY_BACKOFF_MULTIPLIER       = 2         // Exponential multiplier
MAX_RETRY_DELAY_MS             = 30_000    // Max delay cap (30 seconds)

// ═══════════════════════════════════════════════════════════════════════════════
// TIMEOUTS
// ═══════════════════════════════════════════════════════════════════════════════
DEFAULT_API_TIMEOUT_MS                     = 30_000    // API request timeout
DEFAULT_CALL_TIMEOUT_SECONDS               = 30        // Ring timeout
DEFAULT_GATHER_TIMEOUT_SECONDS             = 5         // IVR gather timeout
DEFAULT_RECORDING_MAX_LENGTH_SECONDS       = 120       // Max recording (2 min)
DEFAULT_VOICEMAIL_MAX_LENGTH_SECONDS       = 120       // Max voicemail (2 min)
DEFAULT_TOKEN_TTL_SECONDS                  = 3_600     // Browser token (1 hour)
DEFAULT_TASK_RESERVATION_TIMEOUT_SECONDS   = 120       // Flex task timeout

// ═══════════════════════════════════════════════════════════════════════════════
// PAGINATION
// ═══════════════════════════════════════════════════════════════════════════════
DEFAULT_PAGE_SIZE              = 20        // Default results per page
MAX_PAGE_SIZE                  = 100       // Maximum results per page

// ═══════════════════════════════════════════════════════════════════════════════
// BULK OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════════
DEFAULT_BULK_CONCURRENCY       = 10        // Parallel sends per batch
DEFAULT_BULK_DELAY_MS          = 100       // Delay between batches
MAX_BULK_RECIPIENTS            = 10_000    // Max recipients per bulk op

// ═══════════════════════════════════════════════════════════════════════════════
// VOICE DEFAULTS
// ═══════════════════════════════════════════════════════════════════════════════
DEFAULT_VOICE                  = 'Polly.Joanna'  // Default TTS voice
DEFAULT_LANGUAGE               = 'en-US'         // Default TTS language
DEFAULT_HOLD_MUSIC_URL         = 'http://com.twilio.music.classical.s3.amazonaws.com/...'

// Available voices:
VOICE_OPTIONS = [
  'Polly.Joanna',  'Polly.Matthew', 'Polly.Salli',
  'Polly.Kendra',  'Polly.Joey',    'Polly.Ivy',
  'Polly.Ruth',    'Polly.Stephen', 'Polly.Amy',
  'Polly.Brian',   'Polly.Emma',
]

// ═══════════════════════════════════════════════════════════════════════════════
// WEBHOOKS
// ═══════════════════════════════════════════════════════════════════════════════
WEBHOOK_PATH_PREFIX            = '/api/twilio'
DEFAULT_WEBHOOK_METHOD         = 'POST'
DEFAULT_CALL_STATUS_EVENTS     = ['initiated', 'ringing', 'answered', 'completed']
DEFAULT_SMS_STATUS_EVENTS      = ['queued', 'sent', 'delivered', 'failed', 'undelivered']

// ═══════════════════════════════════════════════════════════════════════════════
// CONVERSATIONS
// ═══════════════════════════════════════════════════════════════════════════════
DEFAULT_CONVERSATION_INACTIVITY_TIMEOUT    = 3_600     // 1 hour
MAX_CONVERSATION_PARTICIPANTS              = 1_000
DEFAULT_CONVERSATION_MESSAGES_LIMIT        = 50

// ═══════════════════════════════════════════════════════════════════════════════
// FLEX
// ═══════════════════════════════════════════════════════════════════════════════
DEFAULT_MAX_RESERVED_WORKERS   = 1
FLEX_ACTIVITY_NAMES = {
  available: 'Available',
  unavailable: 'Unavailable',
  offline: 'Offline',
  break: 'Break',
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT CACHE
// ═══════════════════════════════════════════════════════════════════════════════
DEFAULT_CACHE_TTL_MS           = 3_600_000  // 1 hour
DEFAULT_CACHE_MAX_SIZE         = 100        // Max cached clients
```

---

## Integration Points

### Upstream Dependencies

| Module | Interaction | Description |
|--------|-------------|-------------|
| `@mcv/db` | Read/Write | All 22+ Twilio tables via Drizzle ORM |
| `@mcv/secrets` | Read | GCP Secret Manager for credential resolution |

### Downstream Consumers

| Module | How It Uses @mcv/twilio |
|--------|------------------------|
| `@mcv/api` (tRPC) | Exposes all services via tRPC procedures with auth |
| `@mcv/admin` (Next.js) | Uses client hooks and components for admin UI |
| `@mcv/intelligence/naos` | AI agents use voice/SMS for customer outreach |
| `@mcv/workflows` | Automated workflows trigger calls, SMS, verify |
| `@mcv/contacts` | Contact records linked to call/SMS history |

### External Systems

| System | Protocol | Purpose |
|--------|----------|---------|
| Twilio REST API | HTTPS | All 28 services communicate via REST |
| Twilio WebSocket | WSS | Real-time media streams for AI |
| Twilio Client SDK | WebRTC | Browser-based calling |
| GCP Secret Manager | gRPC | Credential storage and retrieval |

---

## File Structure

```
packages/twilio/src/
├── index.ts                          # Root exports (types + encryption + cache)
├── types.ts                          # All TypeScript interfaces (700+ lines)
├── client.ts                         # AES-256-GCM encryption + Twilio client cache
├── constants/
│   ├── compliance.ts                 # TCPA, opt-in/out, throughput limits
│   └── defaults.ts                   # Retry, timeout, pagination defaults
├── client/
│   ├── index.ts                      # Client layer exports
│   ├── hooks/
│   │   ├── use-phone.ts              # WebRTC calling hook
│   │   ├── use-sms.ts                # SMS composition hook
│   │   ├── use-call-status.ts        # Call status polling hook
│   │   ├── use-conversations.ts      # Conversations hook
│   │   ├── use-flex-agent.ts         # Flex agent hook
│   │   └── use-phone-numbers.ts      # Phone number list hook
│   └── components/
│       ├── dialer.tsx                # Phone dialer UI
│       ├── sms-composer.tsx          # SMS composer UI
│       ├── call-controls.tsx         # In-call controls
│       ├── conversation-thread.tsx   # Conversation messages
│       ├── flex-agent-panel.tsx      # Flex agent panel
│       └── ivr-builder.tsx           # Visual IVR builder
└── server/
    ├── index.ts                      # Server layer exports
    ├── middleware/
    │   └── twilio-signature.ts       # HMAC-SHA1 webhook validation
    ├── services/
    │   ├── sub-account.service.ts    # Multi-tenant account management
    │   ├── phone-number.service.ts   # Number search/purchase/configure
    │   ├── sms.service.ts            # SMS/MMS send/receive
    │   ├── voice.service.ts          # Voice calls + TwiML + tokens
    │   ├── ivr.service.ts            # IVR tree CRUD + validation
    │   ├── recording.service.ts      # Recordings + voicemails
    │   ├── conference.service.ts     # Conferencing + coaching
    │   ├── queue.service.ts          # Call queues
    │   ├── stream.service.ts         # Real-time media streams
    │   ├── conversations.service.ts  # Conversations API
    │   ├── flex.service.ts           # Flex TaskRouter
    │   ├── verify.service.ts         # 2FA verification
    │   ├── whatsapp.service.ts       # WhatsApp messaging
    │   ├── messaging-service.service.ts  # Messaging services
    │   ├── sip.service.ts            # SIP trunking
    │   ├── caller-id.service.ts      # Outgoing caller IDs
    │   ├── dialing-permissions.service.ts  # Country permissions
    │   ├── lookup.service.ts         # Phone number lookup
    │   ├── number-intelligence.service.ts  # SIM swap, identity match
    │   ├── video.service.ts          # Video rooms
    │   ├── sync.service.ts           # Real-time sync
    │   ├── notify.service.ts         # Push notifications
    │   ├── trust-hub.service.ts      # Trust Hub profiles
    │   ├── a2p-registration.service.ts   # A2P 10DLC registration
    │   ├── voice-insights.service.ts # Call quality analytics
    │   └── webhook-handler.service.ts    # Webhook event router
    ├── twiml/
    │   ├── ivr-generator.ts          # IVR-specific TwiML generation
    │   └── voice-responses.ts        # Pre-built TwiML templates
    ├── utils/
    │   ├── index.ts                  # Utility barrel exports
    │   ├── auth.ts                   # Vault → env credential resolution
    │   ├── phone-validator.ts        # E.164 validation + normalization
    │   ├── url-validator.ts          # SSRF protection + URL validation
    │   ├── retry.ts                  # Exponential backoff + jitter
    │   └── error-sanitizer.ts        # Credential/PII redaction
    └── webhooks/
        ├── voice-webhook.ts          # Voice event handlers
        ├── sms-webhook.ts            # SMS event handlers
        └── status-webhook.ts         # Generic status router
```

---

## Revision History

| Date | Version | Change |
|------|---------|--------|
| 2026-02-08 | 1.0.0 | Initial comprehensive MODULE.md from source analysis |
