# @mcv/nexus/calls

> Voice & Video Calls submodule for the MCV.ONE Nexus communication platform.

**Package:** `@mcv/nexus/calls`
**Since:** 0.11.0
**Status:** Stable
**Tier:** 5 – Domain Module
**Parent:** [`@mcv/nexus`](../MODULE.md)
**Maintainer:** MCV Platform Team

---

## Table of Contents

- [Purpose](#purpose)
- [Exports](#exports)
- [Architecture](#architecture)
- [Core Interfaces](#core-interfaces)
- [Database Schemas](#database-schemas)
- [Code Examples](#code-examples)
- [Error Codes](#error-codes)
- [Security](#security)
- [Environment Variables](#environment-variables)
- [Dependencies](#dependencies)
- [Testing](#testing)

---

## Purpose

`@mcv/nexus/calls` provides a full-featured voice and video calling engine for multi-tenant SaaS applications built on the MCV.ONE platform. It abstracts over carrier-grade telephony providers (Twilio Voice, Vonage, SIP), browser-native WebRTC, and custom media pipelines to deliver a unified calling API that handles everything from a simple click-to-call widget to enterprise-scale contact center operations.

### Why This Module Exists

Modern communication platforms need voice and video as first-class citizens alongside messaging. Building telephony is notoriously complex — carrier integrations, codec negotiation, SRTP key exchange, call state machines, recording compliance, DTMF handling, call quality monitoring — and every tenant expects it to "just work." This module encapsulates that complexity behind a clean tRPC surface so domain modules can place calls, build IVR trees, manage conferences, and analyze call metrics without touching a single SIP header.

### What It Solves

| Problem | Solution |
|---------|----------|
| Carrier fragmentation | Unified `CallProvider` adapter for Twilio, Vonage, SIP, WebRTC |
| Call routing complexity | Declarative routing rules with IVR, skill-based, and time-of-day strategies |
| Recording compliance | Automatic dual-channel recording with configurable retention and redaction |
| Multi-party calls | Conference engine with moderator controls, breakout rooms, and dial-in |
| Call quality | Real-time MOS scoring, jitter/packet-loss tracking, automated quality alerts |
| Number management | Provisioning, porting, and caller ID across 60+ countries |
| Agent productivity | Click-to-call widgets, power dialers, warm/cold transfers, queue management |
| Voicemail | Voicemail boxes with greeting management, transcription, and email delivery |
| Analytics | Call duration, wait time, abandonment rate, agent scorecards, wallboard data |
| Multi-tenancy | Row-level security, per-tenant number pools, isolated recording storage |

### Design Principles

1. **Provider-Agnostic** — Switch carriers without changing application code. The `CallProvider` interface normalizes Twilio, Vonage, SIP trunks, and raw WebRTC behind a single contract.
2. **Event-Driven** — Every call state transition emits a domain event (`call.initiated`, `call.answered`, `call.ended`, etc.) that other modules can subscribe to for real-time dashboards, billing, and automation.
3. **Compliance-First** — Recording consent, PCI redaction, GDPR retention policies, and audit logging are built into the core, not bolted on.
4. **Tenant-Isolated** — All data is scoped by `tenant_id` via Supabase RLS. One tenant's calls, recordings, and analytics are invisible to another.
5. **Real-Time** — WebSocket push for call state, live transcription streaming, real-time MOS scores, and wallboard updates.

---

## Exports

```typescript
// === Core Services ===
export { CallService }            from './services/call.service';
export { CallRoutingService }     from './services/call-routing.service';
export { RecordingService }       from './services/recording.service';
export { ConferenceService }      from './services/conference.service';
export { VideoCallService }       from './services/video-call.service';
export { ClickToCallService }     from './services/click-to-call.service';
export { VoicemailService }       from './services/voicemail.service';
export { PhoneNumberService }     from './services/phone-number.service';
export { CallAnalyticsService }   from './services/call-analytics.service';
export { CallTransferService }    from './services/call-transfer.service';
export { CallQueueService }       from './services/call-queue.service';
export { IVRService }             from './services/ivr.service';
export { DialerService }          from './services/dialer.service';

// === Provider Adapters ===
export { TwilioVoiceProvider }    from './providers/twilio-voice.provider';
export { VonageProvider }         from './providers/vonage.provider';
export { SIPProvider }            from './providers/sip.provider';
export { WebRTCProvider }         from './providers/webrtc.provider';

// === tRPC Router ===
export { callsRouter }            from './router';
export type { CallsRouter }       from './router';

// === Core Interfaces ===
export type { Call }               from './interfaces/call.interface';
export type { CallRoute }          from './interfaces/call-route.interface';
export type { IVRMenu }            from './interfaces/ivr-menu.interface';
export type { CallRecording }      from './interfaces/call-recording.interface';
export type { Conference }         from './interfaces/conference.interface';
export type { ConferenceParticipant } from './interfaces/conference.interface';
export type { ClickToCall }        from './interfaces/click-to-call.interface';
export type { CallAnalytics }      from './interfaces/call-analytics.interface';
export type { Voicemail }          from './interfaces/voicemail.interface';
export type { PhoneNumber }        from './interfaces/phone-number.interface';
export type { CallQueue }          from './interfaces/call-queue.interface';
export type { CallTransfer }       from './interfaces/call-transfer.interface';
export type { DialerCampaign }     from './interfaces/dialer.interface';

// === Provider Interface ===
export type { CallProvider }       from './interfaces/call-provider.interface';
export type { CallProviderConfig } from './interfaces/call-provider.interface';
export type { CallWebhookPayload } from './interfaces/call-provider.interface';

// === Enums ===
export { CallStatus }              from './enums/call-status.enum';
export { CallDirection }           from './enums/call-direction.enum';
export { CallType }                from './enums/call-type.enum';
export { RecordingStatus }         from './enums/recording-status.enum';
export { ConferenceStatus }        from './enums/conference-status.enum';
export { TransferType }            from './enums/transfer-type.enum';
export { PhoneNumberType }         from './enums/phone-number-type.enum';
export { RoutingStrategy }         from './enums/routing-strategy.enum';
export { DialerMode }              from './enums/dialer-mode.enum';

// === Events ===
export { CallEvents }              from './events/call.events';
export type { CallEventPayload }   from './events/call.events';

// === Schemas (Drizzle) ===
export { calls }                   from './schemas/calls.schema';
export { callRoutes }              from './schemas/call-routes.schema';
export { ivrMenus }                from './schemas/ivr-menus.schema';
export { callRecordings }          from './schemas/call-recordings.schema';
export { conferences }             from './schemas/conferences.schema';
export { conferenceParticipants }  from './schemas/conference-participants.schema';
export { voicemails }              from './schemas/voicemails.schema';
export { phoneNumbers }            from './schemas/phone-numbers.schema';
export { callQueues }              from './schemas/call-queues.schema';
export { callAnalytics }           from './schemas/call-analytics.schema';

// === Validators (Zod) ===
export {
  createCallSchema,
  updateCallSchema,
  callRouteSchema,
  ivrMenuSchema,
  conferenceSchema,
  clickToCallSchema,
  voicemailSchema,
  phoneNumberSchema,
  callQueueSchema,
  dialerCampaignSchema,
} from './validators';

// === Hooks (React) ===
export { useCall }                 from './hooks/useCall';
export { useCallState }            from './hooks/useCallState';
export { useConference }           from './hooks/useConference';
export { useVideoCall }            from './hooks/useVideoCall';
export { useCallAnalytics }        from './hooks/useCallAnalytics';
export { useDialPad }              from './hooks/useDialPad';
export { useCallQueue }            from './hooks/useCallQueue';
export { usePhoneNumbers }         from './hooks/usePhoneNumbers';

// === Components (React) ===
export { DialPad }                 from './components/DialPad';
export { CallControls }            from './components/CallControls';
export { CallTimer }               from './components/CallTimer';
export { VideoGrid }               from './components/VideoGrid';
export { ConferencePanel }         from './components/ConferencePanel';
export { CallQueueWallboard }      from './components/CallQueueWallboard';
export { ClickToCallWidget }       from './components/ClickToCallWidget';
export { VoicemailPlayer }         from './components/VoicemailPlayer';
```

---

## Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client Layer                                │
│  ┌──────────┐ ┌───────────┐ ┌───────────┐ ┌──────────────────────┐ │
│  │ DialPad  │ │ VideoGrid │ │ Wallboard │ │ ClickToCallWidget    │ │
│  └────┬─────┘ └─────┬─────┘ └─────┬─────┘ └──────────┬───────────┘ │
│       │              │             │                   │             │
│  ┌────▼──────────────▼─────────────▼───────────────────▼───────────┐│
│  │              React Hooks (useCall, useVideoCall, etc.)          ││
│  └────┬───────────────────────────────────────────────────────────┘│
│       │  tRPC + WebSocket                                          │
└───────┼────────────────────────────────────────────────────────────┘
        │
┌───────▼────────────────────────────────────────────────────────────┐
│                         API Layer (tRPC)                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                     callsRouter                             │   │
│  │  ┌─────────┐ ┌──────────┐ ┌────────────┐ ┌──────────────┐  │   │
│  │  │  call.*  │ │ route.*  │ │ recording.*│ │ conference.* │  │   │
│  │  └─────────┘ └──────────┘ └────────────┘ └──────────────┘  │   │
│  │  ┌─────────┐ ┌──────────┐ ┌────────────┐ ┌──────────────┐  │   │
│  │  │ video.* │ │ queue.*  │ │ voicemail.*│ │  numbers.*   │  │   │
│  │  └─────────┘ └──────────┘ └────────────┘ └──────────────┘  │   │
│  │  ┌─────────┐ ┌──────────┐ ┌────────────┐                   │   │
│  │  │ ivr.*   │ │ dialer.* │ │ analytics.*│                   │   │
│  │  └─────────┘ └──────────┘ └────────────┘                   │   │
│  └─────────────────────────────────────────────────────────────┘   │
└───────┬────────────────────────────────────────────────────────────┘
        │
┌───────▼────────────────────────────────────────────────────────────┐
│                       Service Layer                                │
│  ┌──────────────┐ ┌───────────────────┐ ┌────────────────────┐    │
│  │ CallService   │ │ CallRoutingService│ │  RecordingService  │    │
│  │               │ │                   │ │                    │    │
│  │ • initiate()  │ │ • evaluateRoute() │ │ • startRecording() │    │
│  │ • answer()    │ │ • matchIVR()      │ │ • stopRecording()  │    │
│  │ • hangup()    │ │ • enqueue()       │ │ • transcribe()     │    │
│  │ • hold()      │ │ • dequeue()       │ │ • redact()         │    │
│  │ • mute()      │ │ • overflow()      │ │ • archive()        │    │
│  └──────┬───────┘ └─────────┬─────────┘ └──────────┬─────────┘    │
│         │                   │                       │              │
│  ┌──────▼───────┐ ┌────────▼──────────┐ ┌──────────▼─────────┐    │
│  │ Conference   │ │ VideoCallService  │ │  VoicemailService  │    │
│  │ Service      │ │                   │ │                    │    │
│  │ • create()   │ │ • startVideo()    │ │ • record()         │    │
│  │ • addPart()  │ │ • shareScreen()   │ │ • transcribe()     │    │
│  │ • breakout() │ │ • setBackground() │ │ • notify()         │    │
│  │ • merge()    │ │ • toggleView()    │ │ • forward()        │    │
│  └──────┬───────┘ └────────┬──────────┘ └──────────┬─────────┘    │
│         │                   │                       │              │
│  ┌──────▼───────┐ ┌────────▼──────────┐ ┌──────────▼─────────┐    │
│  │ CallTransfer │ │ PhoneNumberService│ │ CallAnalytics      │    │
│  │ Service      │ │                   │ │ Service            │    │
│  │ • cold()     │ │ • provision()     │ │ • aggregate()      │    │
│  │ • warm()     │ │ • port()          │ │ • agentScorecard() │    │
│  │ • attended() │ │ • release()       │ │ • qualityReport()  │    │
│  │ • toQueue()  │ │ • setCallerId()   │ │ • wallboardData()  │    │
│  └──────────────┘ └───────────────────┘ └────────────────────┘    │
└───────┬────────────────────────────────────────────────────────────┘
        │
┌───────▼────────────────────────────────────────────────────────────┐
│                     Provider Layer                                  │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   CallProvider Interface                     │   │
│  └──────────────────────────┬───────────────────────────────────┘   │
│                             │                                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────────┐   │
│  │  Twilio  │ │  Vonage  │ │   SIP    │ │       WebRTC         │   │
│  │  Voice   │ │          │ │  Trunk   │ │  (Browser-native)    │   │
│  │          │ │          │ │          │ │                      │   │
│  │ REST API │ │ REST API │ │ SRTP/RTP │ │ ICE/STUN/TURN       │   │
│  │ TwiML    │ │ NCCO     │ │ SDP      │ │ SDP/SRTP            │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────────┘   │
└────────────────────────────────────────────────────────────────────┘
        │
┌───────▼────────────────────────────────────────────────────────────┐
│                       Data Layer                                    │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              Supabase PostgreSQL + Drizzle ORM               │   │
│  │                                                              │   │
│  │  calls │ call_routes │ ivr_menus │ call_recordings           │   │
│  │  conferences │ conference_participants │ voicemails           │   │
│  │  phone_numbers │ call_queues │ call_analytics                │   │
│  │                                                              │   │
│  │  Row-Level Security: tenant_id on every table                │   │
│  └──────────────────────────────────────────────────────────────┘   │
│  ┌───────────────────┐  ┌───────────────────┐                      │
│  │  Supabase Storage  │  │   Redis (Queue)   │                      │
│  │  (Recordings/VM)   │  │   (Call State)    │                      │
│  └───────────────────┘  └───────────────────┘                      │
└────────────────────────────────────────────────────────────────────┘
```

### Call State Machine

Every call follows a deterministic state machine. State transitions emit domain events and are persisted in the `calls` table.

```
                    ┌───────────┐
                    │ INITIATED │
                    └─────┬─────┘
                          │
                    ┌─────▼─────┐
              ┌─────│  RINGING  │─────┐
              │     └─────┬─────┘     │
              │           │           │
        ┌─────▼────┐ ┌───▼────┐ ┌────▼─────┐
        │ NO_ANSWER│ │ANSWERED│ │ REJECTED │
        └─────┬────┘ └───┬────┘ └────┬─────┘
              │           │           │
              │     ┌─────▼─────┐     │
              │     │ IN_PROGRESS│     │
              │     └──┬──┬──┬──┘     │
              │        │  │  │        │
              │   ┌────▼┐▼  ▼────┐   │
              │   │HOLD ││ON_MUTE│   │
              │   └──┬──┘│└──┬───┘   │
              │      │   │   │       │
              │      └───▼───┘       │
              │     ┌─────────┐      │
              │     │TRANSFER │      │
              │     │ _RING   │      │
              │     └────┬────┘      │
              │          │           │
              │  ┌───────▼────────┐  │
              │  │  TRANSFERRED   │  │
              │  └───────┬────────┘  │
              │          │           │
              ▼          ▼           ▼
           ┌────────────────────────────┐
           │         COMPLETED          │
           └──────────┬─────────────────┘
                      │
              ┌───────▼────────┐
              │   VOICEMAIL    │
              │  (if routed)   │
              └────────────────┘
```

**Terminal states:** `COMPLETED`, `NO_ANSWER`, `REJECTED`, `FAILED`, `CANCELED`

### Call Routing Pipeline

When an inbound call arrives, it passes through a multi-stage routing pipeline:

```
Inbound Call
     │
     ▼
┌─────────────────┐
│ 1. Number Lookup │──── Which tenant owns this number?
└────────┬────────┘
         │
┌────────▼────────┐
│ 2. Time-of-Day  │──── Business hours? After hours? Holiday?
│    Check        │
└────────┬────────┘
         │
┌────────▼────────┐
│ 3. IVR Menu     │──── "Press 1 for Sales, 2 for Support..."
│    (if configured)│
└────────┬────────┘
         │
┌────────▼────────┐
│ 4. Skill Match  │──── Agent speaks caller's language? Has cert?
└────────┬────────┘
         │
┌────────▼────────┐
│ 5. Queue        │──── All agents busy → hold music + position
│    Assignment   │
└────────┬────────┘
         │
┌────────▼────────┐
│ 6. Agent Ring   │──── Ring available agents (round-robin/simultaneous)
└────────┬────────┘
         │
    ┌────▼────┐
    │ Answer? │──── Yes → Connect │ No → Overflow/Voicemail
    └─────────┘
```

### WebRTC Signaling Flow

For browser-to-browser and browser-to-phone calls:

```
   Caller (Browser)              MCV Server              Callee (Browser/Phone)
        │                            │                            │
        │── POST /call.initiate ────▶│                            │
        │                            │── Allocate TURN creds ───▶│
        │◀── { callId, iceServers } ─│                            │
        │                            │                            │
        │── SDP Offer (WS) ────────▶│                            │
        │                            │── SDP Offer (WS/SIP) ───▶│
        │                            │                            │
        │                            │◀── SDP Answer ────────────│
        │◀── SDP Answer (WS) ───────│                            │
        │                            │                            │
        │── ICE Candidate (WS) ────▶│── ICE Candidate ─────────▶│
        │◀── ICE Candidate (WS) ────│◀── ICE Candidate ─────────│
        │                            │                            │
        │◀══════════ SRTP Media Stream (P2P or relayed) ════════▶│
        │                            │                            │
        │                            │── call.answered event ───▶│
        │                            │── Start recording ────────│
        │                            │                            │
```

### Media Pipeline

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────────┐
│  Audio Input  │────▶│  Opus Codec  │────▶│  SRTP Encryption     │
│  (Microphone) │     │  (48kHz)     │     │  (DTLS-SRTP)         │
└──────────────┘     └──────────────┘     └──────────┬───────────┘
                                                      │
                                                      ▼
                                          ┌──────────────────────┐
                                          │   TURN/STUN Relay    │
                                          │   (if P2P fails)     │
                                          └──────────┬───────────┘
                                                      │
┌──────────────┐     ┌──────────────┐     ┌──────────▼───────────┐
│  Audio Output │◀────│  Opus Decode │◀────│  SRTP Decryption     │
│  (Speaker)    │     │              │     │                      │
└──────────────┘     └──────────────┘     └──────────────────────┘

                     ┌──────────────┐
                     │  Recording   │
                     │  Fork (MCU)  │──────▶ S3/Supabase Storage
                     └──────────────┘
```

### Conference Architecture

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Participant  │  │ Participant  │  │ Participant  │  │  PSTN       │
│ (WebRTC)     │  │ (WebRTC)     │  │ (WebRTC)     │  │  Dial-in    │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │                │
       └────────────────┼────────────────┼────────────────┘
                        │                │
                 ┌──────▼────────────────▼──────┐
                 │     Conference MCU / SFU      │
                 │                               │
                 │  ┌─────────┐ ┌─────────────┐  │
                 │  │  Audio   │ │   Video     │  │
                 │  │  Mixer   │ │   Router    │  │
                 │  └─────────┘ └─────────────┘  │
                 │                               │
                 │  ┌─────────────────────────┐  │
                 │  │   Breakout Rooms        │  │
                 │  │  ┌──────┐  ┌──────┐     │  │
                 │  │  │Room A│  │Room B│     │  │
                 │  │  └──────┘  └──────┘     │  │
                 │  └─────────────────────────┘  │
                 │                               │
                 │  ┌─────────────────────────┐  │
                 │  │   Recording Engine      │  │
                 │  │   (Dual-channel)        │  │
                 │  └─────────────────────────┘  │
                 └───────────────────────────────┘
```

---

## Core Interfaces

### CallProvider

The provider abstraction that all telephony backends implement. This is the key extension point for adding new carriers.

```typescript
/**
 * Unified interface for telephony providers.
 * Implementations handle carrier-specific protocols (TwiML, NCCO, SIP, WebRTC)
 * while exposing a normalized API to the service layer.
 */
interface CallProvider {
  /** Unique provider identifier */
  readonly providerId: string;

  /** Human-readable provider name */
  readonly providerName: string;

  /**
   * Initialize the provider with tenant-specific credentials.
   * Called once during service bootstrapping per tenant.
   */
  initialize(config: CallProviderConfig): Promise<void>;

  /**
   * Initiate an outbound call.
   * Returns a provider-specific call SID/ID that maps to our internal call record.
   */
  initiateCall(params: InitiateCallParams): Promise<ProviderCallResult>;

  /**
   * Answer an inbound call with specified instructions.
   * For Twilio this generates TwiML, for Vonage it generates NCCO.
   */
  answerCall(callSid: string, instructions: CallInstructions): Promise<void>;

  /**
   * Terminate an active call.
   */
  hangupCall(callSid: string): Promise<void>;

  /**
   * Place a call on hold with optional hold music URL.
   */
  holdCall(callSid: string, holdMusicUrl?: string): Promise<void>;

  /**
   * Resume a held call.
   */
  resumeCall(callSid: string): Promise<void>;

  /**
   * Send DTMF tones on an active call.
   */
  sendDtmf(callSid: string, digits: string): Promise<void>;

  /**
   * Start recording an active call.
   * Returns a recording SID/URL for later retrieval.
   */
  startRecording(callSid: string, options: RecordingOptions): Promise<string>;

  /**
   * Stop recording an active call.
   */
  stopRecording(callSid: string, recordingSid: string): Promise<void>;

  /**
   * Transfer a call to another destination.
   */
  transferCall(callSid: string, destination: string, type: TransferType): Promise<string>;

  /**
   * Create a conference bridge.
   */
  createConference(params: CreateConferenceParams): Promise<string>;

  /**
   * Add a participant to an existing conference.
   */
  addToConference(conferenceSid: string, participant: string): Promise<string>;

  /**
   * Remove a participant from a conference.
   */
  removeFromConference(conferenceSid: string, participantSid: string): Promise<void>;

  /**
   * Provision a new phone number.
   */
  provisionNumber(params: ProvisionNumberParams): Promise<ProvisionedNumber>;

  /**
   * Release a provisioned phone number.
   */
  releaseNumber(phoneNumber: string): Promise<void>;

  /**
   * Parse and validate an inbound webhook payload.
   * Converts provider-specific webhook format to our normalized CallWebhookPayload.
   */
  parseWebhook(rawPayload: unknown, signature?: string): CallWebhookPayload;

  /**
   * Get real-time call quality metrics.
   */
  getCallQuality(callSid: string): Promise<CallQualityMetrics>;

  /**
   * Search available phone numbers by criteria.
   */
  searchNumbers(criteria: NumberSearchCriteria): Promise<AvailableNumber[]>;
}

interface CallProviderConfig {
  tenantId: string;
  accountSid?: string;      // Twilio
  authToken?: string;        // Twilio
  apiKey?: string;           // Vonage
  apiSecret?: string;        // Vonage
  applicationId?: string;    // Vonage
  sipDomain?: string;        // SIP
  sipUsername?: string;       // SIP
  sipPassword?: string;      // SIP
  stunServers?: string[];    // WebRTC
  turnServers?: TurnServer[];// WebRTC
  webhookBaseUrl: string;
  recordingStorageBucket?: string;
}

interface CallWebhookPayload {
  provider: string;
  event: CallWebhookEvent;
  callSid: string;
  from: string;
  to: string;
  status: CallStatus;
  direction: CallDirection;
  duration?: number;
  recordingUrl?: string;
  digits?: string;           // DTMF digits pressed
  speechResult?: string;     // Speech-to-text result
  timestamp: Date;
  rawPayload: unknown;
}

type CallWebhookEvent =
  | 'call.initiated'
  | 'call.ringing'
  | 'call.answered'
  | 'call.completed'
  | 'call.failed'
  | 'call.no_answer'
  | 'call.busy'
  | 'call.canceled'
  | 'recording.started'
  | 'recording.completed'
  | 'recording.failed'
  | 'dtmf.received'
  | 'speech.result'
  | 'conference.started'
  | 'conference.ended'
  | 'conference.participant_joined'
  | 'conference.participant_left';
```

### Call

The central domain entity representing a voice or video call.

```typescript
/**
 * Represents a single call — inbound or outbound, voice or video.
 * This is the primary entity in the calls domain.
 */
interface Call {
  /** Unique internal call ID (UUID) */
  id: string;

  /** Tenant that owns this call */
  tenantId: string;

  /** Provider-specific call SID (e.g., Twilio CA...) */
  providerCallSid: string;

  /** Which provider handled this call */
  provider: 'twilio' | 'vonage' | 'sip' | 'webrtc';

  /** Inbound or outbound */
  direction: CallDirection;

  /** Voice or video */
  type: CallType;

  /** Current call status */
  status: CallStatus;

  /** E.164 caller number or SIP URI */
  from: string;

  /** E.164 destination number or SIP URI */
  to: string;

  /** Resolved caller name (CNAM lookup) */
  callerName?: string;

  /** Phone number ID from our phone_numbers table (if owned) */
  phoneNumberId?: string;

  /** Agent/user ID who handled the call */
  agentId?: string;

  /** Queue ID the call was routed through */
  queueId?: string;

  /** Call route ID that matched this call */
  routeId?: string;

  /** Conference ID if this call is part of a conference */
  conferenceId?: string;

  /** Parent call ID (for transferred or conferenced calls) */
  parentCallId?: string;

  /** When the call was initiated */
  initiatedAt: Date;

  /** When the call started ringing */
  ringingAt?: Date;

  /** When the call was answered */
  answeredAt?: Date;

  /** When the call ended */
  completedAt?: Date;

  /** Call duration in seconds (answer to hangup) */
  duration?: number;

  /** Total ring time in seconds */
  ringDuration?: number;

  /** Hold time in seconds */
  holdDuration?: number;

  /** Wait time in queue in seconds */
  queueWaitTime?: number;

  /** Whether this call was recorded */
  isRecorded: boolean;

  /** Recording ID if recorded */
  recordingId?: string;

  /** MOS (Mean Opinion Score) for call quality (1.0-5.0) */
  mosScore?: number;

  /** Call disposition (set by agent) */
  disposition?: string;

  /** Free-form notes added by the agent */
  notes?: string;

  /** Custom tags for categorization */
  tags: string[];

  /** Hangup reason */
  hangupCause?: HangupCause;

  /** Which party hung up */
  hungUpBy?: 'caller' | 'callee' | 'system' | 'api';

  /** DTMF digits collected during the call */
  dtmfCollected?: string;

  /** Related CRM contact ID */
  contactId?: string;

  /** Related deal/opportunity ID */
  dealId?: string;

  /** Custom metadata */
  metadata: Record<string, unknown>;

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
}

enum CallStatus {
  INITIATED = 'initiated',
  QUEUED = 'queued',
  RINGING = 'ringing',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  ON_MUTE = 'on_mute',
  TRANSFERRING = 'transferring',
  COMPLETED = 'completed',
  NO_ANSWER = 'no_answer',
  BUSY = 'busy',
  FAILED = 'failed',
  CANCELED = 'canceled',
  VOICEMAIL = 'voicemail',
}

enum CallDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
  INTERNAL = 'internal',
}

enum CallType {
  VOICE = 'voice',
  VIDEO = 'video',
  SIP = 'sip',
}

type HangupCause =
  | 'normal_clearing'
  | 'user_busy'
  | 'no_answer'
  | 'call_rejected'
  | 'number_changed'
  | 'unallocated_number'
  | 'network_out_of_order'
  | 'temporary_failure'
  | 'service_unavailable'
  | 'invalid_number'
  | 'originator_cancel'
  | 'normal_unspecified';
```

### CallRoute

Defines how inbound calls are routed to agents, queues, IVR menus, or external destinations.

```typescript
/**
 * A call routing rule. Routes are evaluated in priority order
 * until one matches the inbound call context.
 */
interface CallRoute {
  id: string;
  tenantId: string;

  /** Human-readable route name */
  name: string;

  /** Route evaluation priority (lower = higher priority) */
  priority: number;

  /** Whether this route is active */
  isActive: boolean;

  /** Phone number(s) this route applies to */
  phoneNumberIds: string[];

  /** Routing strategy */
  strategy: RoutingStrategy;

  /** Time-of-day conditions */
  schedule?: RouteSchedule;

  /** Caller ID matching patterns (regex or prefix) */
  callerIdPatterns?: string[];

  /** Geographic matching (country/region codes) */
  geoMatch?: GeoMatchRule;

  /** IVR menu to play (if strategy = 'ivr') */
  ivrMenuId?: string;

  /** Queue to enqueue the call (if strategy = 'queue') */
  queueId?: string;

  /** Specific agent IDs to ring (if strategy = 'direct') */
  agentIds?: string[];

  /** External number to forward to (if strategy = 'forward') */
  forwardTo?: string;

  /** Ring timeout in seconds before falling through */
  ringTimeout: number;

  /** Overflow rule when primary destination is unavailable */
  overflowAction: OverflowAction;

  /** Voicemail box ID for overflow */
  voicemailBoxId?: string;

  /** Custom greeting audio URL */
  greetingUrl?: string;

  /** Whisper message played to agent before connecting */
  whisperMessage?: string;

  createdAt: Date;
  updatedAt: Date;
}

enum RoutingStrategy {
  /** Route directly to specific agents */
  DIRECT = 'direct',

  /** Route through a queue with hold music */
  QUEUE = 'queue',

  /** Route through an IVR menu */
  IVR = 'ivr',

  /** Forward to an external number */
  FORWARD = 'forward',

  /** Route based on agent skills */
  SKILL_BASED = 'skill_based',

  /** Round-robin across available agents */
  ROUND_ROBIN = 'round_robin',

  /** Ring all available agents simultaneously */
  SIMULTANEOUS = 'simultaneous',

  /** Route to longest-idle agent */
  LONGEST_IDLE = 'longest_idle',

  /** Send directly to voicemail */
  VOICEMAIL = 'voicemail',
}

interface RouteSchedule {
  /** Timezone for schedule evaluation */
  timezone: string;

  /** Business hours per day of week */
  businessHours: {
    [day in DayOfWeek]?: {
      start: string;  // "09:00"
      end: string;    // "17:00"
    };
  };

  /** Holiday dates (ISO format) — route to afterHoursAction */
  holidays: string[];

  /** Action when outside business hours */
  afterHoursAction: OverflowAction;

  /** Custom after-hours greeting */
  afterHoursGreetingUrl?: string;
}

type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

interface OverflowAction {
  type: 'voicemail' | 'forward' | 'queue' | 'disconnect' | 'message';
  destination?: string;
  message?: string;
  voicemailBoxId?: string;
}

interface GeoMatchRule {
  /** ISO 3166-1 alpha-2 country codes to match */
  countries?: string[];

  /** Area code prefixes to match */
  areaCodes?: string[];

  /** Invert the match (exclude instead of include) */
  invert?: boolean;
}
```

### IVRMenu

Interactive Voice Response menu configuration.

```typescript
/**
 * An IVR menu — the "Press 1 for Sales" tree.
 * Menus can nest arbitrarily (menu option → sub-menu).
 */
interface IVRMenu {
  id: string;
  tenantId: string;

  /** Menu name for admin UI */
  name: string;

  /** Audio URL for the menu prompt */
  promptUrl?: string;

  /** Text-to-speech prompt (used if no audio URL) */
  promptText?: string;

  /** TTS voice to use */
  ttsVoice?: string;

  /** TTS language */
  ttsLanguage?: string;

  /** How many seconds to wait for input */
  inputTimeout: number;

  /** How many times to replay the prompt on no input */
  maxRetries: number;

  /** Maximum digits to collect (for extensions) */
  maxDigits: number;

  /** Finish-on key (e.g., '#') */
  finishOnKey?: string;

  /** Enable speech recognition for voice-driven menus */
  speechEnabled: boolean;

  /** Speech recognition language */
  speechLanguage?: string;

  /** Speech recognition hints (expected phrases) */
  speechHints?: string[];

  /** Menu options (DTMF digit → action) */
  options: IVRMenuOption[];

  /** Action on timeout (no input received) */
  timeoutAction: IVRAction;

  /** Action on invalid input */
  invalidAction: IVRAction;

  /** Parent menu ID (for sub-menus) */
  parentMenuId?: string;

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface IVRMenuOption {
  /** DTMF digit (0-9, *, #) */
  digit: string;

  /** Optional speech phrase that maps to this option */
  speechPhrase?: string;

  /** Description shown in admin UI */
  label: string;

  /** Action to take when this option is selected */
  action: IVRAction;
}

interface IVRAction {
  type: IVRActionType;

  /** Queue ID (for 'queue' action) */
  queueId?: string;

  /** Agent IDs (for 'agent' action) */
  agentIds?: string[];

  /** Sub-menu ID (for 'submenu' action) */
  menuId?: string;

  /** External number (for 'forward' action) */
  forwardTo?: string;

  /** Audio URL (for 'play' action) */
  audioUrl?: string;

  /** TTS text (for 'say' action) */
  text?: string;

  /** Voicemail box ID (for 'voicemail' action) */
  voicemailBoxId?: string;

  /** Number of digits to collect (for 'collect' action) */
  collectDigits?: number;

  /** Webhook URL for collected input (for 'webhook' action) */
  webhookUrl?: string;
}

type IVRActionType =
  | 'queue'
  | 'agent'
  | 'submenu'
  | 'forward'
  | 'play'
  | 'say'
  | 'voicemail'
  | 'collect'
  | 'webhook'
  | 'hangup'
  | 'repeat';
```

### CallRecording

```typescript
/**
 * A call recording — audio capture of a voice call or conference.
 * Recordings are stored in Supabase Storage with tenant-scoped paths.
 */
interface CallRecording {
  id: string;
  tenantId: string;

  /** Call ID this recording belongs to */
  callId: string;

  /** Conference ID (if conference recording) */
  conferenceId?: string;

  /** Provider recording SID */
  providerRecordingSid: string;

  /** Recording status */
  status: RecordingStatus;

  /** Recording type */
  type: RecordingType;

  /** Storage path in Supabase Storage */
  storagePath: string;

  /** Public URL (signed, time-limited) */
  url?: string;

  /** Recording duration in seconds */
  duration: number;

  /** File size in bytes */
  fileSize: number;

  /** Audio format */
  format: 'wav' | 'mp3' | 'ogg';

  /** Number of audio channels (1=mono, 2=dual/stereo) */
  channels: number;

  /** Sample rate in Hz */
  sampleRate: number;

  /** Whether transcription has been requested */
  transcriptionRequested: boolean;

  /** Transcription status */
  transcriptionStatus?: 'pending' | 'processing' | 'completed' | 'failed';

  /** Transcription text (full) */
  transcription?: string;

  /** Transcription segments with timestamps */
  transcriptionSegments?: TranscriptionSegment[];

  /** Transcription language detected */
  transcriptionLanguage?: string;

  /** Transcription confidence score (0-1) */
  transcriptionConfidence?: number;

  /** Whether PCI/sensitive data has been redacted */
  isRedacted: boolean;

  /** Redaction details */
  redactions?: RedactionRecord[];

  /** Retention policy applied */
  retentionPolicy?: string;

  /** When this recording will be auto-deleted */
  expiresAt?: Date;

  /** Who initiated the recording */
  initiatedBy: 'system' | 'agent' | 'api';

  /** Consent tracking */
  consentRecorded: boolean;
  consentMethod?: 'announcement' | 'beep' | 'explicit' | 'implied';

  createdAt: Date;
  updatedAt: Date;
}

enum RecordingStatus {
  INITIATED = 'initiated',
  IN_PROGRESS = 'in_progress',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DELETED = 'deleted',
}

type RecordingType = 'call' | 'conference' | 'voicemail';

interface TranscriptionSegment {
  /** Speaker identifier (e.g., "caller", "agent", "speaker_0") */
  speaker: string;

  /** Segment start time in seconds */
  startTime: number;

  /** Segment end time in seconds */
  endTime: number;

  /** Transcribed text */
  text: string;

  /** Confidence score (0-1) */
  confidence: number;
}

interface RedactionRecord {
  /** Type of data redacted */
  type: 'credit_card' | 'ssn' | 'phone' | 'email' | 'custom';

  /** Time range in the recording where redaction was applied */
  startTime: number;
  endTime: number;

  /** Whether audio was silenced or beeped */
  method: 'silence' | 'beep' | 'tone';
}
```

### Conference

```typescript
/**
 * A multi-party conference call.
 * Supports audio and video, dial-in numbers, moderator controls,
 * and breakout rooms.
 */
interface Conference {
  id: string;
  tenantId: string;

  /** Conference name / friendly identifier */
  name: string;

  /** Provider conference SID */
  providerConferenceSid: string;

  /** Conference status */
  status: ConferenceStatus;

  /** Conference type */
  type: 'audio' | 'video' | 'mixed';

  /** PIN required to join (hashed) */
  pinHash?: string;

  /** Whether a PIN is required */
  pinRequired: boolean;

  /** Maximum number of participants */
  maxParticipants: number;

  /** Current participant count */
  participantCount: number;

  /** Dial-in phone number */
  dialInNumber?: string;

  /** Dial-in extension or conference code */
  dialInCode?: string;

  /** Whether the conference is being recorded */
  isRecording: boolean;

  /** Recording ID */
  recordingId?: string;

  /** Whether to wait for the moderator before starting */
  waitForModerator: boolean;

  /** Whether to announce participants joining/leaving */
  announceParticipants: boolean;

  /** Hold music URL while waiting */
  holdMusicUrl?: string;

  /** Whether participants are muted on entry */
  muteOnEntry: boolean;

  /** Moderator user IDs */
  moderatorIds: string[];

  /** Scheduled start time */
  scheduledAt?: Date;

  /** Actual start time */
  startedAt?: Date;

  /** End time */
  endedAt?: Date;

  /** Duration in seconds */
  duration?: number;

  /** Breakout rooms configuration */
  breakoutRooms?: BreakoutRoom[];

  /** Custom metadata */
  metadata: Record<string, unknown>;

  createdAt: Date;
  updatedAt: Date;
}

enum ConferenceStatus {
  SCHEDULED = 'scheduled',
  WAITING = 'waiting',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELED = 'canceled',
}

interface ConferenceParticipant {
  id: string;
  conferenceId: string;

  /** User/agent ID (if internal) */
  userId?: string;

  /** Phone number (if dialed in) */
  phoneNumber?: string;

  /** Display name */
  displayName: string;

  /** Provider participant SID */
  providerParticipantSid: string;

  /** Participant role */
  role: 'moderator' | 'participant' | 'listener';

  /** Current status */
  status: 'connecting' | 'connected' | 'on_hold' | 'disconnected';

  /** Whether currently muted */
  isMuted: boolean;

  /** Whether video is on */
  isVideoOn: boolean;

  /** Whether screen is being shared */
  isSharingScreen: boolean;

  /** Whether hand is raised */
  isHandRaised: boolean;

  /** Breakout room ID (if in breakout) */
  breakoutRoomId?: string;

  /** When participant joined */
  joinedAt: Date;

  /** When participant left */
  leftAt?: Date;

  /** Duration in the conference (seconds) */
  duration?: number;
}

interface BreakoutRoom {
  id: string;
  name: string;
  participantIds: string[];
  maxParticipants?: number;
  autoClose: boolean;
  durationMinutes?: number;
  createdAt: Date;
}
```

### ClickToCall

```typescript
/**
 * Configuration for a click-to-call widget that can be
 * embedded on websites or triggered from CRM records.
 */
interface ClickToCall {
  id: string;
  tenantId: string;

  /** Widget name */
  name: string;

  /** Whether the widget is active */
  isActive: boolean;

  /** Widget appearance configuration */
  appearance: ClickToCallAppearance;

  /** Which phone number to use as caller ID */
  phoneNumberId: string;

  /** Routing destination for calls */
  routeId?: string;
  queueId?: string;
  agentIds?: string[];

  /** Business hours (disable widget outside hours) */
  scheduleId?: string;

  /** Pre-call form fields to collect */
  preCallForm?: FormField[];

  /** Domains allowed to embed the widget */
  allowedDomains: string[];

  /** Maximum concurrent calls */
  maxConcurrent: number;

  /** Custom greeting played to the caller */
  greetingUrl?: string;

  /** Whether to record click-to-call conversations */
  recordCalls: boolean;

  /** CRM integration settings */
  crmIntegration?: {
    /** Auto-create lead on call */
    autoCreateLead: boolean;
    /** Map form fields to CRM fields */
    fieldMapping: Record<string, string>;
    /** Pipeline/stage for new leads */
    pipelineId?: string;
    stageId?: string;
  };

  /** Analytics tracking */
  trackingId?: string;

  /** Widget embed code (generated) */
  embedCode: string;

  /** API key for this widget */
  apiKey: string;

  createdAt: Date;
  updatedAt: Date;
}

interface ClickToCallAppearance {
  /** Button position */
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'custom';

  /** Custom CSS position (if position = 'custom') */
  customPosition?: { top?: string; bottom?: string; left?: string; right?: string };

  /** Primary color (hex) */
  primaryColor: string;

  /** Text color (hex) */
  textColor: string;

  /** Button text */
  buttonText: string;

  /** Button icon */
  icon: 'phone' | 'video' | 'headset' | 'custom';

  /** Custom icon URL */
  customIconUrl?: string;

  /** Whether to show agent avatar */
  showAgentAvatar: boolean;

  /** Whether to show estimated wait time */
  showWaitTime: boolean;

  /** Custom CSS class */
  cssClass?: string;

  /** Animation style */
  animation: 'none' | 'pulse' | 'bounce' | 'slide';

  /** Mobile layout */
  mobileLayout: 'floating' | 'banner' | 'fullscreen';
}

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'textarea';
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: string;  // regex pattern
}
```

### CallAnalytics

```typescript
/**
 * Aggregated call analytics for dashboards, reports,
 * and real-time wallboards.
 */
interface CallAnalytics {
  id: string;
  tenantId: string;

  /** Aggregation period */
  period: 'hour' | 'day' | 'week' | 'month';

  /** Period start timestamp */
  periodStart: Date;

  /** Period end timestamp */
  periodEnd: Date;

  /** Scope of this analytics record */
  scope: AnalyticsScope;

  /** Scoped entity ID (agent ID, queue ID, etc.) */
  scopeId?: string;

  // === Volume Metrics ===
  /** Total calls in period */
  totalCalls: number;

  /** Inbound calls */
  inboundCalls: number;

  /** Outbound calls */
  outboundCalls: number;

  /** Internal calls */
  internalCalls: number;

  /** Answered calls */
  answeredCalls: number;

  /** Missed/unanswered calls */
  missedCalls: number;

  /** Abandoned calls (caller hung up in queue) */
  abandonedCalls: number;

  /** Voicemail calls */
  voicemailCalls: number;

  /** Transferred calls */
  transferredCalls: number;

  // === Duration Metrics (seconds) ===
  /** Total talk time */
  totalTalkTime: number;

  /** Average call duration */
  avgDuration: number;

  /** Longest call duration */
  maxDuration: number;

  /** Average ring time */
  avgRingTime: number;

  /** Average queue wait time */
  avgWaitTime: number;

  /** Maximum queue wait time */
  maxWaitTime: number;

  /** Average hold time */
  avgHoldTime: number;

  /** Average after-call work time */
  avgAfterCallWork: number;

  // === Rate Metrics ===
  /** Answer rate (answered / total inbound) */
  answerRate: number;

  /** Abandonment rate (abandoned / total inbound) */
  abandonmentRate: number;

  /** Service level (% answered within SLA threshold) */
  serviceLevel: number;

  /** SLA threshold in seconds */
  slaThreshold: number;

  /** First call resolution rate */
  firstCallResolution: number;

  /** Transfer rate */
  transferRate: number;

  // === Quality Metrics ===
  /** Average MOS score (1.0-5.0) */
  avgMosScore: number;

  /** Minimum MOS score */
  minMosScore: number;

  /** Calls with MOS < 3.0 (poor quality) */
  poorQualityCalls: number;

  /** Average jitter (ms) */
  avgJitter: number;

  /** Average packet loss (%) */
  avgPacketLoss: number;

  /** Average round-trip time (ms) */
  avgRtt: number;

  // === Agent Metrics ===
  /** Number of unique agents who handled calls */
  activeAgents: number;

  /** Average handle time (ring + talk + after-call) */
  avgHandleTime: number;

  /** Agent utilization (talk time / available time) */
  agentUtilization: number;

  /** Calls per agent per hour */
  callsPerAgentHour: number;

  createdAt: Date;
}

type AnalyticsScope = 'tenant' | 'agent' | 'queue' | 'number' | 'route' | 'campaign';

/**
 * Real-time wallboard data for contact center displays.
 * Updated every few seconds via WebSocket.
 */
interface WallboardData {
  tenantId: string;
  timestamp: Date;

  /** Active calls right now */
  activeCalls: number;

  /** Calls in queue */
  callsInQueue: number;

  /** Longest waiting call (seconds) */
  longestWait: number;

  /** Available agents */
  availableAgents: number;

  /** Agents on calls */
  busyAgents: number;

  /** Agents in after-call work */
  wrapUpAgents: number;

  /** Agents offline */
  offlineAgents: number;

  /** Today's totals */
  todayAnswered: number;
  todayMissed: number;
  todayAbandoned: number;
  todayAvgWait: number;
  todayServiceLevel: number;
  todayAvgDuration: number;

  /** Per-queue breakdown */
  queues: QueueWallboardData[];
}

interface QueueWallboardData {
  queueId: string;
  queueName: string;
  waitingCalls: number;
  activeCalls: number;
  availableAgents: number;
  longestWait: number;
  avgWait: number;
  serviceLevel: number;
}
```

### Voicemail

```typescript
/**
 * A voicemail message left by a caller.
 */
interface Voicemail {
  id: string;
  tenantId: string;

  /** Voicemail box this message belongs to */
  voicemailBoxId: string;

  /** Associated call ID */
  callId: string;

  /** Caller phone number */
  callerNumber: string;

  /** Caller name (CNAM) */
  callerName?: string;

  /** Voicemail status */
  status: VoicemailStatus;

  /** Whether the voicemail has been listened to */
  isRead: boolean;

  /** Whether the voicemail has been returned (callback made) */
  isReturned: boolean;

  /** Storage path for audio file */
  storagePath: string;

  /** Audio URL (signed, time-limited) */
  url?: string;

  /** Duration in seconds */
  duration: number;

  /** File size in bytes */
  fileSize: number;

  /** Transcription text */
  transcription?: string;

  /** Transcription confidence */
  transcriptionConfidence?: number;

  /** Whether voicemail-to-email was sent */
  emailSent: boolean;

  /** Email delivery timestamp */
  emailSentAt?: Date;

  /** Urgency level (detected from speech patterns) */
  urgency: 'normal' | 'urgent' | 'critical';

  /** Sentiment analysis result */
  sentiment?: 'positive' | 'neutral' | 'negative';

  /** Custom metadata */
  metadata: Record<string, unknown>;

  /** When the voicemail was left */
  leftAt: Date;

  /** When it was first listened to */
  readAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

type VoicemailStatus = 'new' | 'read' | 'archived' | 'deleted';

/**
 * A voicemail box — owned by an agent, queue, or shared group.
 */
interface VoicemailBox {
  id: string;
  tenantId: string;

  /** Box name */
  name: string;

  /** Owner type */
  ownerType: 'agent' | 'queue' | 'shared';

  /** Owner ID (agent or queue ID) */
  ownerId: string;

  /** Custom greeting audio URL */
  greetingUrl?: string;

  /** Text-to-speech greeting (fallback) */
  greetingText?: string;

  /** Maximum message duration in seconds */
  maxMessageDuration: number;

  /** Maximum number of stored messages */
  maxMessages: number;

  /** Current message count */
  messageCount: number;

  /** Whether to transcribe voicemails */
  transcribeEnabled: boolean;

  /** Whether to send voicemail-to-email */
  emailNotificationEnabled: boolean;

  /** Email addresses to notify */
  notificationEmails: string[];

  /** Whether to send SMS notification */
  smsNotificationEnabled: boolean;

  /** Phone number for SMS notifications */
  notificationPhone?: string;

  /** PIN for remote access (hashed) */
  pinHash?: string;

  /** Retention period in days (0 = forever) */
  retentionDays: number;

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### PhoneNumber

```typescript
/**
 * A phone number provisioned or ported for a tenant.
 */
interface PhoneNumber {
  id: string;
  tenantId: string;

  /** E.164 formatted number (+1234567890) */
  number: string;

  /** Formatted display number */
  displayNumber: string;

  /** Number type */
  type: PhoneNumberType;

  /** Provider that owns this number */
  provider: 'twilio' | 'vonage' | 'sip';

  /** Provider-specific number SID */
  providerNumberSid: string;

  /** ISO 3166-1 alpha-2 country code */
  country: string;

  /** Region/state */
  region?: string;

  /** City/locality */
  locality?: string;

  /** Whether the number supports voice */
  voiceEnabled: boolean;

  /** Whether the number supports SMS */
  smsEnabled: boolean;

  /** Whether the number supports MMS */
  mmsEnabled: boolean;

  /** Whether the number supports fax */
  faxEnabled: boolean;

  /** Caller ID name (CNAM) */
  callerIdName?: string;

  /** Call routing configuration */
  routeId?: string;

  /** Voicemail box assignment */
  voicemailBoxId?: string;

  /** Monthly cost (in cents) */
  monthlyCost: number;

  /** Currency for cost */
  currency: string;

  /** Number status */
  status: PhoneNumberStatus;

  /** Porting status (if being ported) */
  portingStatus?: PortingStatus;

  /** Port request date */
  portRequestDate?: Date;

  /** Expected port completion date */
  portCompletionDate?: Date;

  /** Whether this is the tenant's default outbound number */
  isDefault: boolean;

  /** Capabilities detail */
  capabilities: NumberCapabilities;

  /** Custom label/nickname */
  label?: string;

  /** Tags for organization */
  tags: string[];

  /** Purchase date */
  purchasedAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

enum PhoneNumberType {
  LOCAL = 'local',
  TOLL_FREE = 'toll_free',
  MOBILE = 'mobile',
  NATIONAL = 'national',
  SHARED_COST = 'shared_cost',
  SHORT_CODE = 'short_code',
  SIP = 'sip',
}

type PhoneNumberStatus = 'active' | 'suspended' | 'porting_in' | 'porting_out' | 'released' | 'pending';

type PortingStatus = 'requested' | 'submitted' | 'confirmed' | 'scheduled' | 'completed' | 'rejected' | 'canceled';

interface NumberCapabilities {
  voice: boolean;
  sms: boolean;
  mms: boolean;
  fax: boolean;
  sip: boolean;
  emergency: boolean;
}
```

### CallQueue

```typescript
/**
 * A call queue — holds inbound calls until an agent becomes available.
 */
interface CallQueue {
  id: string;
  tenantId: string;

  /** Queue name */
  name: string;

  /** Queue display name (for IVR announcements) */
  displayName: string;

  /** Queue strategy */
  strategy: QueueStrategy;

  /** Priority (for queue-of-queues routing) */
  priority: number;

  /** Agent IDs assigned to this queue */
  agentIds: string[];

  /** Required agent skills */
  requiredSkills?: AgentSkill[];

  /** Maximum number of calls in queue */
  maxSize: number;

  /** Maximum wait time before overflow (seconds) */
  maxWaitTime: number;

  /** Hold music URL */
  holdMusicUrl?: string;

  /** Queue position announcement interval (seconds) */
  positionAnnouncementInterval: number;

  /** Estimated wait time announcement */
  announceEstimatedWait: boolean;

  /** Comfort message URL (played periodically) */
  comfortMessageUrl?: string;

  /** Comfort message interval (seconds) */
  comfortMessageInterval: number;

  /** Service Level Agreement threshold (seconds) */
  slaThreshold: number;

  /** Overflow configuration */
  overflow: QueueOverflow;

  /** Callback option (let caller request a callback) */
  callbackEnabled: boolean;

  /** Callback message */
  callbackPrompt?: string;

  /** Wrap-up time after each call (seconds) */
  wrapUpTime: number;

  /** Current queue statistics (real-time) */
  stats?: QueueStats;

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type QueueStrategy =
  | 'round_robin'       // Cycle through agents
  | 'longest_idle'      // Agent who's been free the longest
  | 'fewest_calls'      // Agent with fewest calls today
  | 'skill_weighted'    // Weighted by skill proficiency
  | 'simultaneous'      // Ring all available agents
  | 'linear'            // Always start from top of list
  | 'random';           // Random available agent

interface AgentSkill {
  name: string;
  minimumLevel: number;  // 1-10
}

interface QueueOverflow {
  /** Action when queue is full or max wait exceeded */
  action: 'voicemail' | 'forward' | 'another_queue' | 'disconnect' | 'callback';

  /** Destination for forward/another_queue */
  destination?: string;

  /** Voicemail box for overflow */
  voicemailBoxId?: string;

  /** Message to play before overflow action */
  overflowMessage?: string;
}

interface QueueStats {
  /** Current calls waiting */
  waitingCalls: number;

  /** Current active calls from this queue */
  activeCalls: number;

  /** Available agents for this queue */
  availableAgents: number;

  /** Longest current wait (seconds) */
  longestWait: number;

  /** Average wait time today */
  avgWaitToday: number;

  /** Service level today */
  serviceLevelToday: number;

  /** Calls handled today */
  callsHandledToday: number;

  /** Abandoned calls today */
  abandonedToday: number;
}
```

### CallTransfer

```typescript
/**
 * Represents a call transfer operation.
 */
interface CallTransfer {
  id: string;
  tenantId: string;

  /** Original call ID */
  sourceCallId: string;

  /** New call ID (created for the transfer leg) */
  targetCallId?: string;

  /** Transfer type */
  type: TransferType;

  /** Transfer status */
  status: TransferStatus;

  /** Who initiated the transfer */
  initiatedBy: string;

  /** Transfer destination */
  destination: TransferDestination;

  /** Consultation call ID (for warm/attended transfers) */
  consultCallId?: string;

  /** Whisper message to play to transfer target */
  whisperMessage?: string;

  /** Whether caller heard transfer music */
  callerOnHold: boolean;

  /** Context/notes passed to the receiving agent */
  context?: string;

  /** When transfer was initiated */
  initiatedAt: Date;

  /** When transfer was completed */
  completedAt?: Date;

  /** Failure reason (if failed) */
  failureReason?: string;

  createdAt: Date;
  updatedAt: Date;
}

enum TransferType {
  /** Immediate transfer — original agent drops off */
  COLD = 'cold',

  /** Agent speaks to target before connecting caller */
  WARM = 'warm',

  /** Three-way call before handoff */
  ATTENDED = 'attended',

  /** Transfer to a queue */
  QUEUE = 'queue',

  /** Transfer to voicemail */
  VOICEMAIL = 'voicemail',
}

type TransferStatus = 'initiating' | 'consulting' | 'connecting' | 'completed' | 'failed' | 'canceled';

interface TransferDestination {
  type: 'agent' | 'queue' | 'external' | 'voicemail' | 'conference';
  id?: string;          // Agent/queue/conference/voicemail box ID
  phoneNumber?: string; // External phone number
  sipUri?: string;      // SIP URI
}
```

### DialerCampaign

```typescript
/**
 * An outbound dialer campaign for sales teams.
 * Supports preview, progressive, power, and predictive modes.
 */
interface DialerCampaign {
  id: string;
  tenantId: string;

  /** Campaign name */
  name: string;

  /** Campaign description */
  description?: string;

  /** Dialer mode */
  mode: DialerMode;

  /** Campaign status */
  status: CampaignStatus;

  /** Caller ID to show */
  phoneNumberId: string;

  /** Agent IDs assigned to this campaign */
  agentIds: string[];

  /** Contact list ID */
  contactListId: string;

  /** Total contacts in the list */
  totalContacts: number;

  /** Contacts dialed so far */
  dialedContacts: number;

  /** Contacts reached (answered) */
  reachedContacts: number;

  /** Script/talking points for agents */
  script?: string;

  /** Disposition codes available */
  dispositions: DispositionCode[];

  /** Maximum attempts per contact */
  maxAttempts: number;

  /** Retry delay in minutes between attempts */
  retryDelay: number;

  /** Maximum concurrent calls (power/predictive) */
  maxConcurrent: number;

  /** Lines per agent ratio (predictive) */
  linesPerAgent: number;

  /** Abandon rate threshold (predictive, %) */
  abandonRateThreshold: number;

  /** Schedule — when the campaign runs */
  schedule: CampaignSchedule;

  /** DNC (Do Not Call) list ID */
  dncListId?: string;

  /** Whether to record calls */
  recordCalls: boolean;

  /** Whether to leave voicemail on no answer */
  voicemailDrop: boolean;

  /** Pre-recorded voicemail audio URL */
  voicemailAudioUrl?: string;

  /** Campaign metrics */
  metrics?: CampaignMetrics;

  createdAt: Date;
  updatedAt: Date;
}

enum DialerMode {
  /** Agent previews contact info, manually initiates call */
  PREVIEW = 'preview',

  /** System dials next contact when agent becomes available */
  PROGRESSIVE = 'progressive',

  /** System dials multiple numbers per available agent */
  POWER = 'power',

  /** System predicts agent availability and dials ahead */
  PREDICTIVE = 'predictive',
}

type CampaignStatus = 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'canceled';

interface DispositionCode {
  code: string;
  label: string;
  category: 'positive' | 'negative' | 'neutral' | 'callback' | 'dnc';
  requireNotes: boolean;
  scheduleCallback: boolean;
}

interface CampaignSchedule {
  timezone: string;
  days: DayOfWeek[];
  startTime: string;  // "09:00"
  endTime: string;    // "17:00"
  startDate: string;  // ISO date
  endDate?: string;   // ISO date (null = run indefinitely)
}

interface CampaignMetrics {
  callsPlaced: number;
  callsAnswered: number;
  callsNoAnswer: number;
  callsBusy: number;
  callsVoicemail: number;
  callsAbandoned: number;
  avgTalkTime: number;
  totalTalkTime: number;
  connectRate: number;
  conversionRate: number;
  callbacksScheduled: number;
  dncHits: number;
}
```

### CallQualityMetrics

```typescript
/**
 * Real-time call quality metrics per call.
 * Used for monitoring and alerting.
 */
interface CallQualityMetrics {
  callId: string;

  /** Mean Opinion Score (1.0 = bad, 5.0 = excellent) */
  mos: number;

  /** R-Factor (quality rating) */
  rFactor: number;

  /** Jitter in milliseconds */
  jitter: number;

  /** Packet loss percentage (0-100) */
  packetLoss: number;

  /** Round-trip time in milliseconds */
  rtt: number;

  /** Audio codec in use */
  codec: string;

  /** Bitrate in kbps */
  bitrate: number;

  /** Whether SRTP is active */
  encrypted: boolean;

  /** Network type (wifi, cellular, ethernet) */
  networkType?: string;

  /** ICE candidate type (host, srflx, relay) */
  candidateType?: string;

  /** Timestamp of this measurement */
  timestamp: Date;
}
```

---

## Database Schemas

All tables include `tenant_id` for multi-tenant row-level security. Indexes are defined for common query patterns (lookups by tenant, status, date ranges, foreign keys).

### calls

```typescript
import { pgTable, uuid, text, varchar, integer, boolean, timestamp, jsonb, pgEnum, index } from 'drizzle-orm/pg-core';

export const callStatusEnum = pgEnum('call_status', [
  'initiated', 'queued', 'ringing', 'in_progress', 'on_hold',
  'on_mute', 'transferring', 'completed', 'no_answer', 'busy',
  'failed', 'canceled', 'voicemail',
]);

export const callDirectionEnum = pgEnum('call_direction', [
  'inbound', 'outbound', 'internal',
]);

export const callTypeEnum = pgEnum('call_type', [
  'voice', 'video', 'sip',
]);

export const calls = pgTable('calls', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  providerCallSid: varchar('provider_call_sid', { length: 128 }),
  provider: varchar('provider', { length: 32 }).notNull(),
  direction: callDirectionEnum('direction').notNull(),
  type: callTypeEnum('type').notNull().default('voice'),
  status: callStatusEnum('status').notNull().default('initiated'),
  from: varchar('from', { length: 64 }).notNull(),
  to: varchar('to', { length: 64 }).notNull(),
  callerName: varchar('caller_name', { length: 128 }),
  phoneNumberId: uuid('phone_number_id').references(() => phoneNumbers.id),
  agentId: uuid('agent_id'),
  queueId: uuid('queue_id').references(() => callQueues.id),
  routeId: uuid('route_id').references(() => callRoutes.id),
  conferenceId: uuid('conference_id').references(() => conferences.id),
  parentCallId: uuid('parent_call_id'),
  initiatedAt: timestamp('initiated_at', { withTimezone: true }).notNull().defaultNow(),
  ringingAt: timestamp('ringing_at', { withTimezone: true }),
  answeredAt: timestamp('answered_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  duration: integer('duration'),
  ringDuration: integer('ring_duration'),
  holdDuration: integer('hold_duration'),
  queueWaitTime: integer('queue_wait_time'),
  isRecorded: boolean('is_recorded').notNull().default(false),
  recordingId: uuid('recording_id'),
  mosScore: integer('mos_score'),  // stored as int * 100 (e.g., 420 = 4.20)
  disposition: varchar('disposition', { length: 64 }),
  notes: text('notes'),
  tags: jsonb('tags').notNull().default([]),
  hangupCause: varchar('hangup_cause', { length: 64 }),
  hungUpBy: varchar('hung_up_by', { length: 16 }),
  dtmfCollected: varchar('dtmf_collected', { length: 64 }),
  contactId: uuid('contact_id'),
  dealId: uuid('deal_id'),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('calls_tenant_idx').on(table.tenantId),
  statusIdx: index('calls_status_idx').on(table.tenantId, table.status),
  directionIdx: index('calls_direction_idx').on(table.tenantId, table.direction),
  agentIdx: index('calls_agent_idx').on(table.tenantId, table.agentId),
  dateIdx: index('calls_date_idx').on(table.tenantId, table.initiatedAt),
  phoneNumberIdx: index('calls_phone_number_idx').on(table.phoneNumberId),
  providerSidIdx: index('calls_provider_sid_idx').on(table.providerCallSid),
  parentCallIdx: index('calls_parent_call_idx').on(table.parentCallId),
  contactIdx: index('calls_contact_idx').on(table.tenantId, table.contactId),
}));
```

### call_routes

```typescript
export const routingStrategyEnum = pgEnum('routing_strategy', [
  'direct', 'queue', 'ivr', 'forward', 'skill_based',
  'round_robin', 'simultaneous', 'longest_idle', 'voicemail',
]);

export const callRoutes = pgTable('call_routes', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: varchar('name', { length: 128 }).notNull(),
  priority: integer('priority').notNull().default(100),
  isActive: boolean('is_active').notNull().default(true),
  phoneNumberIds: jsonb('phone_number_ids').notNull().default([]),
  strategy: routingStrategyEnum('strategy').notNull(),
  schedule: jsonb('schedule'),
  callerIdPatterns: jsonb('caller_id_patterns'),
  geoMatch: jsonb('geo_match'),
  ivrMenuId: uuid('ivr_menu_id').references(() => ivrMenus.id),
  queueId: uuid('queue_id').references(() => callQueues.id),
  agentIds: jsonb('agent_ids'),
  forwardTo: varchar('forward_to', { length: 64 }),
  ringTimeout: integer('ring_timeout').notNull().default(30),
  overflowAction: jsonb('overflow_action').notNull(),
  voicemailBoxId: uuid('voicemail_box_id'),
  greetingUrl: text('greeting_url'),
  whisperMessage: text('whisper_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('call_routes_tenant_idx').on(table.tenantId),
  priorityIdx: index('call_routes_priority_idx').on(table.tenantId, table.priority),
  activeIdx: index('call_routes_active_idx').on(table.tenantId, table.isActive),
}));
```

### ivr_menus

```typescript
export const ivrMenus = pgTable('ivr_menus', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: varchar('name', { length: 128 }).notNull(),
  promptUrl: text('prompt_url'),
  promptText: text('prompt_text'),
  ttsVoice: varchar('tts_voice', { length: 64 }),
  ttsLanguage: varchar('tts_language', { length: 16 }),
  inputTimeout: integer('input_timeout').notNull().default(5),
  maxRetries: integer('max_retries').notNull().default(3),
  maxDigits: integer('max_digits').notNull().default(1),
  finishOnKey: varchar('finish_on_key', { length: 1 }),
  speechEnabled: boolean('speech_enabled').notNull().default(false),
  speechLanguage: varchar('speech_language', { length: 16 }),
  speechHints: jsonb('speech_hints'),
  options: jsonb('options').notNull().default([]),
  timeoutAction: jsonb('timeout_action').notNull(),
  invalidAction: jsonb('invalid_action').notNull(),
  parentMenuId: uuid('parent_menu_id'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('ivr_menus_tenant_idx').on(table.tenantId),
  parentIdx: index('ivr_menus_parent_idx').on(table.parentMenuId),
}));
```

### call_recordings

```typescript
export const recordingStatusEnum = pgEnum('recording_status', [
  'initiated', 'in_progress', 'paused', 'completed', 'failed', 'deleted',
]);

export const callRecordings = pgTable('call_recordings', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  callId: uuid('call_id').notNull().references(() => calls.id),
  conferenceId: uuid('conference_id').references(() => conferences.id),
  providerRecordingSid: varchar('provider_recording_sid', { length: 128 }),
  status: recordingStatusEnum('status').notNull().default('initiated'),
  type: varchar('type', { length: 16 }).notNull().default('call'),
  storagePath: text('storage_path').notNull(),
  url: text('url'),
  duration: integer('duration').notNull().default(0),
  fileSize: integer('file_size').notNull().default(0),
  format: varchar('format', { length: 8 }).notNull().default('wav'),
  channels: integer('channels').notNull().default(2),
  sampleRate: integer('sample_rate').notNull().default(8000),
  transcriptionRequested: boolean('transcription_requested').notNull().default(false),
  transcriptionStatus: varchar('transcription_status', { length: 16 }),
  transcription: text('transcription'),
  transcriptionSegments: jsonb('transcription_segments'),
  transcriptionLanguage: varchar('transcription_language', { length: 16 }),
  transcriptionConfidence: integer('transcription_confidence'),  // stored as int * 100
  isRedacted: boolean('is_redacted').notNull().default(false),
  redactions: jsonb('redactions'),
  retentionPolicy: varchar('retention_policy', { length: 64 }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  initiatedBy: varchar('initiated_by', { length: 16 }).notNull().default('system'),
  consentRecorded: boolean('consent_recorded').notNull().default(false),
  consentMethod: varchar('consent_method', { length: 16 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('call_recordings_tenant_idx').on(table.tenantId),
  callIdx: index('call_recordings_call_idx').on(table.callId),
  statusIdx: index('call_recordings_status_idx').on(table.tenantId, table.status),
  expiresIdx: index('call_recordings_expires_idx').on(table.expiresAt),
}));
```

### conferences

```typescript
export const conferenceStatusEnum = pgEnum('conference_status', [
  'scheduled', 'waiting', 'in_progress', 'on_hold', 'completed', 'canceled',
]);

export const conferences = pgTable('conferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: varchar('name', { length: 256 }).notNull(),
  providerConferenceSid: varchar('provider_conference_sid', { length: 128 }),
  status: conferenceStatusEnum('status').notNull().default('scheduled'),
  type: varchar('type', { length: 16 }).notNull().default('audio'),
  pinHash: varchar('pin_hash', { length: 128 }),
  pinRequired: boolean('pin_required').notNull().default(false),
  maxParticipants: integer('max_participants').notNull().default(50),
  participantCount: integer('participant_count').notNull().default(0),
  dialInNumber: varchar('dial_in_number', { length: 32 }),
  dialInCode: varchar('dial_in_code', { length: 16 }),
  isRecording: boolean('is_recording').notNull().default(false),
  recordingId: uuid('recording_id'),
  waitForModerator: boolean('wait_for_moderator').notNull().default(true),
  announceParticipants: boolean('announce_participants').notNull().default(true),
  holdMusicUrl: text('hold_music_url'),
  muteOnEntry: boolean('mute_on_entry').notNull().default(false),
  moderatorIds: jsonb('moderator_ids').notNull().default([]),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  startedAt: timestamp('started_at', { withTimezone: true }),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  duration: integer('duration'),
  breakoutRooms: jsonb('breakout_rooms'),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('conferences_tenant_idx').on(table.tenantId),
  statusIdx: index('conferences_status_idx').on(table.tenantId, table.status),
  scheduledIdx: index('conferences_scheduled_idx').on(table.tenantId, table.scheduledAt),
}));
```

### conference_participants

```typescript
export const conferenceParticipants = pgTable('conference_participants', {
  id: uuid('id').primaryKey().defaultRandom(),
  conferenceId: uuid('conference_id').notNull().references(() => conferences.id, { onDelete: 'cascade' }),
  userId: uuid('user_id'),
  phoneNumber: varchar('phone_number', { length: 32 }),
  displayName: varchar('display_name', { length: 128 }).notNull(),
  providerParticipantSid: varchar('provider_participant_sid', { length: 128 }),
  role: varchar('role', { length: 16 }).notNull().default('participant'),
  status: varchar('status', { length: 16 }).notNull().default('connecting'),
  isMuted: boolean('is_muted').notNull().default(false),
  isVideoOn: boolean('is_video_on').notNull().default(false),
  isSharingScreen: boolean('is_sharing_screen').notNull().default(false),
  isHandRaised: boolean('is_hand_raised').notNull().default(false),
  breakoutRoomId: varchar('breakout_room_id', { length: 64 }),
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  leftAt: timestamp('left_at', { withTimezone: true }),
  duration: integer('duration'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  conferenceIdx: index('conf_participants_conference_idx').on(table.conferenceId),
  userIdx: index('conf_participants_user_idx').on(table.userId),
  statusIdx: index('conf_participants_status_idx').on(table.conferenceId, table.status),
}));
```

### voicemails

```typescript
export const voicemails = pgTable('voicemails', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  voicemailBoxId: uuid('voicemail_box_id').notNull(),
  callId: uuid('call_id').notNull().references(() => calls.id),
  callerNumber: varchar('caller_number', { length: 32 }).notNull(),
  callerName: varchar('caller_name', { length: 128 }),
  status: varchar('status', { length: 16 }).notNull().default('new'),
  isRead: boolean('is_read').notNull().default(false),
  isReturned: boolean('is_returned').notNull().default(false),
  storagePath: text('storage_path').notNull(),
  url: text('url'),
  duration: integer('duration').notNull().default(0),
  fileSize: integer('file_size').notNull().default(0),
  transcription: text('transcription'),
  transcriptionConfidence: integer('transcription_confidence'),
  emailSent: boolean('email_sent').notNull().default(false),
  emailSentAt: timestamp('email_sent_at', { withTimezone: true }),
  urgency: varchar('urgency', { length: 16 }).notNull().default('normal'),
  sentiment: varchar('sentiment', { length: 16 }),
  metadata: jsonb('metadata').notNull().default({}),
  leftAt: timestamp('left_at', { withTimezone: true }).notNull().defaultNow(),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('voicemails_tenant_idx').on(table.tenantId),
  boxIdx: index('voicemails_box_idx').on(table.voicemailBoxId),
  statusIdx: index('voicemails_status_idx').on(table.tenantId, table.status),
  urgencyIdx: index('voicemails_urgency_idx').on(table.tenantId, table.urgency),
  dateIdx: index('voicemails_date_idx').on(table.tenantId, table.leftAt),
}));
```

### phone_numbers

```typescript
export const phoneNumberTypeEnum = pgEnum('phone_number_type', [
  'local', 'toll_free', 'mobile', 'national', 'shared_cost', 'short_code', 'sip',
]);

export const phoneNumbers = pgTable('phone_numbers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  number: varchar('number', { length: 32 }).notNull(),
  displayNumber: varchar('display_number', { length: 32 }).notNull(),
  type: phoneNumberTypeEnum('type').notNull(),
  provider: varchar('provider', { length: 32 }).notNull(),
  providerNumberSid: varchar('provider_number_sid', { length: 128 }),
  country: varchar('country', { length: 2 }).notNull(),
  region: varchar('region', { length: 64 }),
  locality: varchar('locality', { length: 64 }),
  voiceEnabled: boolean('voice_enabled').notNull().default(true),
  smsEnabled: boolean('sms_enabled').notNull().default(false),
  mmsEnabled: boolean('mms_enabled').notNull().default(false),
  faxEnabled: boolean('fax_enabled').notNull().default(false),
  callerIdName: varchar('caller_id_name', { length: 64 }),
  routeId: uuid('route_id').references(() => callRoutes.id),
  voicemailBoxId: uuid('voicemail_box_id'),
  monthlyCost: integer('monthly_cost').notNull().default(0),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  status: varchar('status', { length: 16 }).notNull().default('active'),
  portingStatus: varchar('porting_status', { length: 16 }),
  portRequestDate: timestamp('port_request_date', { withTimezone: true }),
  portCompletionDate: timestamp('port_completion_date', { withTimezone: true }),
  isDefault: boolean('is_default').notNull().default(false),
  capabilities: jsonb('capabilities').notNull().default({}),
  label: varchar('label', { length: 64 }),
  tags: jsonb('tags').notNull().default([]),
  purchasedAt: timestamp('purchased_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('phone_numbers_tenant_idx').on(table.tenantId),
  numberIdx: index('phone_numbers_number_idx').on(table.number).unique(),
  countryIdx: index('phone_numbers_country_idx').on(table.tenantId, table.country),
  statusIdx: index('phone_numbers_status_idx').on(table.tenantId, table.status),
  defaultIdx: index('phone_numbers_default_idx').on(table.tenantId, table.isDefault),
}));
```

### call_queues

```typescript
export const callQueues = pgTable('call_queues', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: varchar('name', { length: 128 }).notNull(),
  displayName: varchar('display_name', { length: 128 }).notNull(),
  strategy: varchar('strategy', { length: 32 }).notNull().default('round_robin'),
  priority: integer('priority').notNull().default(100),
  agentIds: jsonb('agent_ids').notNull().default([]),
  requiredSkills: jsonb('required_skills'),
  maxSize: integer('max_size').notNull().default(50),
  maxWaitTime: integer('max_wait_time').notNull().default(300),
  holdMusicUrl: text('hold_music_url'),
  positionAnnouncementInterval: integer('position_announcement_interval').notNull().default(30),
  announceEstimatedWait: boolean('announce_estimated_wait').notNull().default(true),
  comfortMessageUrl: text('comfort_message_url'),
  comfortMessageInterval: integer('comfort_message_interval').notNull().default(60),
  slaThreshold: integer('sla_threshold').notNull().default(30),
  overflow: jsonb('overflow').notNull(),
  callbackEnabled: boolean('callback_enabled').notNull().default(false),
  callbackPrompt: text('callback_prompt'),
  wrapUpTime: integer('wrap_up_time').notNull().default(30),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('call_queues_tenant_idx').on(table.tenantId),
  activeIdx: index('call_queues_active_idx').on(table.tenantId, table.isActive),
}));
```

### call_analytics

```typescript
export const callAnalytics = pgTable('call_analytics', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  period: varchar('period', { length: 8 }).notNull(),
  periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
  periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
  scope: varchar('scope', { length: 16 }).notNull(),
  scopeId: varchar('scope_id', { length: 64 }),
  totalCalls: integer('total_calls').notNull().default(0),
  inboundCalls: integer('inbound_calls').notNull().default(0),
  outboundCalls: integer('outbound_calls').notNull().default(0),
  internalCalls: integer('internal_calls').notNull().default(0),
  answeredCalls: integer('answered_calls').notNull().default(0),
  missedCalls: integer('missed_calls').notNull().default(0),
  abandonedCalls: integer('abandoned_calls').notNull().default(0),
  voicemailCalls: integer('voicemail_calls').notNull().default(0),
  transferredCalls: integer('transferred_calls').notNull().default(0),
  totalTalkTime: integer('total_talk_time').notNull().default(0),
  avgDuration: integer('avg_duration').notNull().default(0),
  maxDuration: integer('max_duration').notNull().default(0),
  avgRingTime: integer('avg_ring_time').notNull().default(0),
  avgWaitTime: integer('avg_wait_time').notNull().default(0),
  maxWaitTime: integer('max_wait_time').notNull().default(0),
  avgHoldTime: integer('avg_hold_time').notNull().default(0),
  avgAfterCallWork: integer('avg_after_call_work').notNull().default(0),
  answerRate: integer('answer_rate').notNull().default(0),           // stored as basis points (8500 = 85.00%)
  abandonmentRate: integer('abandonment_rate').notNull().default(0),
  serviceLevel: integer('service_level').notNull().default(0),
  slaThreshold: integer('sla_threshold').notNull().default(30),
  firstCallResolution: integer('first_call_resolution').notNull().default(0),
  transferRate: integer('transfer_rate').notNull().default(0),
  avgMosScore: integer('avg_mos_score').notNull().default(0),        // stored as int * 100
  minMosScore: integer('min_mos_score').notNull().default(0),
  poorQualityCalls: integer('poor_quality_calls').notNull().default(0),
  avgJitter: integer('avg_jitter').notNull().default(0),
  avgPacketLoss: integer('avg_packet_loss').notNull().default(0),
  avgRtt: integer('avg_rtt').notNull().default(0),
  activeAgents: integer('active_agents').notNull().default(0),
  avgHandleTime: integer('avg_handle_time').notNull().default(0),
  agentUtilization: integer('agent_utilization').notNull().default(0),
  callsPerAgentHour: integer('calls_per_agent_hour').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('call_analytics_tenant_idx').on(table.tenantId),
  periodIdx: index('call_analytics_period_idx').on(table.tenantId, table.period, table.periodStart),
  scopeIdx: index('call_analytics_scope_idx').on(table.tenantId, table.scope, table.scopeId),
}));
```

### Row-Level Security

```sql
-- Applied to all call tables
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "calls_tenant_isolation" ON calls
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY "calls_tenant_insert" ON calls
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

-- Repeat for: call_routes, ivr_menus, call_recordings, conferences,
-- conference_participants, voicemails, phone_numbers, call_queues, call_analytics

-- Additional policy: agents can only see their own calls
CREATE POLICY "calls_agent_access" ON calls
  FOR SELECT USING (
    tenant_id = current_setting('app.tenant_id')::uuid
    AND (
      current_setting('app.user_role') IN ('admin', 'manager')
      OR agent_id = current_setting('app.user_id')::uuid
    )
  );

-- Recording access requires explicit permission
CREATE POLICY "recordings_access" ON call_recordings
  FOR SELECT USING (
    tenant_id = current_setting('app.tenant_id')::uuid
    AND (
      current_setting('app.user_role') IN ('admin', 'manager')
      OR current_setting('app.permissions')::jsonb ? 'calls.recordings.read'
    )
  );
```

---

## Code Examples

### Example 1: Initiating an Outbound Call

```typescript
import { CallService } from '@mcv/nexus/calls';
import { createTRPCContext } from '@mcv/core/trpc';

const ctx = await createTRPCContext({ tenantId, userId });
const callService = new CallService(ctx);

// Place an outbound call from a tenant's number to a customer
const call = await callService.initiate({
  from: '+14155551234',         // Tenant's phone number
  to: '+14155559876',           // Customer's phone number
  type: 'voice',
  agentId: ctx.userId,
  
  // Optional: record the call automatically
  record: true,
  recordingOptions: {
    channels: 2,                // Dual-channel (separate tracks per party)
    format: 'wav',
    transcribe: true,
    consentMethod: 'announcement',
  },
  
  // Optional: whisper message played only to the agent
  whisperMessage: 'Calling John Smith regarding account renewal.',
  
  // Optional: timeout and fallback
  ringTimeout: 30,
  noAnswerAction: {
    type: 'voicemail',
    voicemailBoxId: 'vm-box-001',
  },
  
  // Optional: CRM context
  contactId: 'contact-uuid-123',
  dealId: 'deal-uuid-456',
  tags: ['renewal', 'enterprise'],
  metadata: {
    campaignId: 'spring-renewal-2025',
    source: 'crm-activity',
  },
});

console.log(`Call initiated: ${call.id}`);
console.log(`Status: ${call.status}`);         // 'initiated'
console.log(`Provider SID: ${call.providerCallSid}`);

// Listen for call state changes via WebSocket
callService.onCallStateChange(call.id, (event) => {
  console.log(`Call ${call.id} → ${event.status}`);
  
  if (event.status === 'in_progress') {
    console.log(`Connected! Duration counting...`);
  }
  
  if (event.status === 'completed') {
    console.log(`Call ended. Duration: ${event.duration}s`);
    console.log(`MOS Score: ${event.mosScore}`);
  }
});
```

### Example 2: Configuring an IVR Menu with Sub-Menus

```typescript
import { IVRService } from '@mcv/nexus/calls';

const ivrService = new IVRService(ctx);

// Create the main IVR menu
const mainMenu = await ivrService.createMenu({
  name: 'Main Menu',
  promptText: 'Thank you for calling Acme Corp. Press 1 for Sales, 2 for Support, 3 for Billing, or 0 to speak with an operator.',
  ttsVoice: 'en-US-Neural2-F',
  ttsLanguage: 'en-US',
  inputTimeout: 8,
  maxRetries: 3,
  maxDigits: 1,
  speechEnabled: true,
  speechLanguage: 'en-US',
  speechHints: ['sales', 'support', 'billing', 'operator', 'help'],
  
  options: [
    {
      digit: '1',
      speechPhrase: 'sales',
      label: 'Sales Department',
      action: {
        type: 'queue',
        queueId: 'queue-sales-001',
      },
    },
    {
      digit: '2',
      speechPhrase: 'support',
      label: 'Technical Support',
      action: {
        type: 'submenu',
        menuId: null,  // Will be set after creating sub-menu
      },
    },
    {
      digit: '3',
      speechPhrase: 'billing',
      label: 'Billing Department',
      action: {
        type: 'queue',
        queueId: 'queue-billing-001',
      },
    },
    {
      digit: '0',
      speechPhrase: 'operator',
      label: 'Operator',
      action: {
        type: 'agent',
        agentIds: ['agent-operator-001', 'agent-operator-002'],
      },
    },
  ],
  
  timeoutAction: {
    type: 'repeat',
  },
  
  invalidAction: {
    type: 'say',
    text: 'Sorry, I didn\'t understand that. Please try again.',
  },
});

// Create a support sub-menu
const supportMenu = await ivrService.createMenu({
  name: 'Support Sub-Menu',
  promptText: 'For hardware issues, press 1. For software issues, press 2. For account access, press 3. To return to the main menu, press star.',
  ttsVoice: 'en-US-Neural2-F',
  inputTimeout: 8,
  maxRetries: 2,
  maxDigits: 1,
  parentMenuId: mainMenu.id,
  
  options: [
    {
      digit: '1',
      label: 'Hardware Support',
      action: {
        type: 'queue',
        queueId: 'queue-support-hardware',
      },
    },
    {
      digit: '2',
      label: 'Software Support',
      action: {
        type: 'queue',
        queueId: 'queue-support-software',
      },
    },
    {
      digit: '3',
      label: 'Account Access',
      action: {
        type: 'collect',
        collectDigits: 8,  // Collect account number
      },
    },
    {
      digit: '*',
      label: 'Return to Main Menu',
      action: {
        type: 'submenu',
        menuId: mainMenu.id,
      },
    },
  ],
  
  timeoutAction: { type: 'voicemail', voicemailBoxId: 'vm-support-general' },
  invalidAction: { type: 'repeat' },
});

// Link the sub-menu to the main menu
await ivrService.updateMenuOption(mainMenu.id, '2', {
  action: { type: 'submenu', menuId: supportMenu.id },
});

console.log(`IVR tree created: ${mainMenu.id} → ${supportMenu.id}`);
```

### Example 3: Setting Up a Call Queue with Skill-Based Routing

```typescript
import { CallQueueService, CallRoutingService } from '@mcv/nexus/calls';

const queueService = new CallQueueService(ctx);
const routingService = new CallRoutingService(ctx);

// Create a support queue with skill-based routing
const queue = await queueService.create({
  name: 'enterprise-support',
  displayName: 'Enterprise Support',
  strategy: 'skill_weighted',
  priority: 10,
  
  // Agents assigned with skills
  agentIds: [
    'agent-001', 'agent-002', 'agent-003',
    'agent-004', 'agent-005',
  ],
  
  requiredSkills: [
    { name: 'enterprise', minimumLevel: 5 },
    { name: 'english', minimumLevel: 8 },
  ],
  
  maxSize: 25,
  maxWaitTime: 300,  // 5 minutes max wait
  
  holdMusicUrl: 'https://cdn.example.com/hold-music/jazz.mp3',
  positionAnnouncementInterval: 30,
  announceEstimatedWait: true,
  comfortMessageUrl: 'https://cdn.example.com/messages/enterprise-comfort.mp3',
  comfortMessageInterval: 60,
  
  slaThreshold: 20,  // Answer within 20 seconds
  
  overflow: {
    action: 'callback',
    overflowMessage: 'All agents are currently busy. Press 1 to request a callback, or stay on the line.',
  },
  
  callbackEnabled: true,
  callbackPrompt: 'We\'ll call you back within 15 minutes. Goodbye.',
  
  wrapUpTime: 45,  // 45 seconds after-call work
});

// Create a routing rule that sends enterprise callers to this queue
const route = await routingService.createRoute({
  name: 'Enterprise Inbound',
  priority: 10,
  phoneNumberIds: ['number-enterprise-001', 'number-enterprise-002'],
  strategy: 'queue',
  queueId: queue.id,
  
  // Only during business hours
  schedule: {
    timezone: 'America/New_York',
    businessHours: {
      monday:    { start: '08:00', end: '20:00' },
      tuesday:   { start: '08:00', end: '20:00' },
      wednesday: { start: '08:00', end: '20:00' },
      thursday:  { start: '08:00', end: '20:00' },
      friday:    { start: '08:00', end: '18:00' },
    },
    holidays: ['2025-12-25', '2025-01-01'],
    afterHoursAction: {
      type: 'voicemail',
      voicemailBoxId: 'vm-enterprise-afterhours',
      message: 'Thank you for calling. Our enterprise support is available Monday through Friday. Please leave a message.',
    },
  },
  
  ringTimeout: 20,
  
  overflowAction: {
    type: 'voicemail',
    voicemailBoxId: 'vm-enterprise-overflow',
  },
  
  whisperMessage: 'Enterprise support call.',
});

console.log(`Queue: ${queue.id}, Route: ${route.id}`);
```

### Example 4: Managing Call Recordings and Transcriptions

```typescript
import { RecordingService } from '@mcv/nexus/calls';

const recordingService = new RecordingService(ctx);

// Start recording an active call (on-demand)
const recording = await recordingService.startRecording('call-uuid-123', {
  channels: 2,           // Dual-channel
  format: 'wav',
  sampleRate: 16000,     // Higher quality for transcription
  initiatedBy: 'agent',
  consentMethod: 'announcement',  // Play "This call is being recorded"
  autoTranscribe: true,
});

console.log(`Recording started: ${recording.id}`);

// Later: stop recording
await recordingService.stopRecording('call-uuid-123', recording.id);

// Manually request transcription for an existing recording
const transcription = await recordingService.transcribe(recording.id, {
  language: 'en',
  model: 'whisper-large-v3',
  diarize: true,         // Speaker separation
  punctuate: true,
  profanityFilter: false,
});

console.log(`Transcription (${transcription.language}):`);
for (const segment of transcription.segments) {
  console.log(`[${segment.startTime}s] ${segment.speaker}: ${segment.text}`);
}
// Output:
// [0.5s] agent: Thank you for calling Acme Support. How can I help you today?
// [3.2s] caller: Hi, I'm having trouble with my account login.
// [6.1s] agent: I'd be happy to help with that. Can you give me your account number?

// Redact sensitive data from a recording
await recordingService.redact(recording.id, {
  types: ['credit_card', 'ssn'],
  method: 'beep',        // Replace detected PCI data with a beep tone
  autoDetect: true,      // Use AI to detect sensitive data
});

// Set retention policy
await recordingService.setRetentionPolicy(recording.id, {
  policy: 'gdpr-30-days',
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  autoDelete: true,
});

// List recordings with filters
const recordings = await recordingService.list({
  tenantId: ctx.tenantId,
  dateRange: {
    from: new Date('2025-01-01'),
    to: new Date('2025-01-31'),
  },
  status: 'completed',
  hasTranscription: true,
  minDuration: 60,       // At least 1 minute
  limit: 50,
  offset: 0,
  orderBy: 'duration',
  orderDir: 'desc',
});

console.log(`Found ${recordings.total} recordings`);

// Get a signed download URL (expires in 1 hour)
const downloadUrl = await recordingService.getSignedUrl(recording.id, {
  expiresIn: 3600,
  disposition: 'attachment',
});
```

### Example 5: Creating and Managing a Conference

```typescript
import { ConferenceService } from '@mcv/nexus/calls';

const conferenceService = new ConferenceService(ctx);

// Create a scheduled conference
const conference = await conferenceService.create({
  name: 'Q1 Planning Meeting',
  type: 'video',
  scheduledAt: new Date('2025-02-15T14:00:00Z'),
  maxParticipants: 20,
  
  // Security
  pinRequired: true,
  pin: '842195',               // Will be hashed before storage
  
  // Moderator settings
  waitForModerator: true,
  moderatorIds: ['user-ceo', 'user-vp-eng'],
  
  // Participant settings
  muteOnEntry: true,
  announceParticipants: true,
  
  // Recording
  record: true,
  
  // Hold music while waiting for moderator
  holdMusicUrl: 'https://cdn.example.com/hold-music/corporate.mp3',
  
  // Dial-in support
  enableDialIn: true,
  dialInNumber: '+18005551234',
});

console.log(`Conference: ${conference.id}`);
console.log(`Dial-in: ${conference.dialInNumber} code: ${conference.dialInCode}`);

// Add participants programmatically
await conferenceService.addParticipant(conference.id, {
  userId: 'user-eng-001',
  role: 'participant',
});

// Dial out to a phone participant
await conferenceService.dialParticipant(conference.id, {
  phoneNumber: '+447911123456',
  displayName: 'Jane Smith (London)',
  role: 'participant',
});

// Moderator controls during the conference
await conferenceService.muteParticipant(conference.id, 'participant-003');
await conferenceService.unmuteParticipant(conference.id, 'participant-003');

// Mute all participants
await conferenceService.muteAll(conference.id, {
  exceptModerators: true,
});

// Create breakout rooms
const breakouts = await conferenceService.createBreakoutRooms(conference.id, {
  rooms: [
    { name: 'Frontend Team', participantIds: ['p-001', 'p-002', 'p-003'] },
    { name: 'Backend Team', participantIds: ['p-004', 'p-005', 'p-006'] },
    { name: 'DevOps Team', participantIds: ['p-007', 'p-008'] },
  ],
  autoClose: true,
  durationMinutes: 15,
});

console.log(`Created ${breakouts.length} breakout rooms`);

// Bring everyone back from breakouts
await conferenceService.closeBreakoutRooms(conference.id);

// End the conference
await conferenceService.end(conference.id);
```

### Example 6: Click-to-Call Widget Setup

```typescript
import { ClickToCallService } from '@mcv/nexus/calls';

const clickToCallService = new ClickToCallService(ctx);

// Create a click-to-call widget for the marketing website
const widget = await clickToCallService.create({
  name: 'Website Sales Widget',
  phoneNumberId: 'number-sales-001',
  queueId: 'queue-sales-inbound',
  
  // Appearance
  appearance: {
    position: 'bottom-right',
    primaryColor: '#2563EB',
    textColor: '#FFFFFF',
    buttonText: 'Call Us Now',
    icon: 'phone',
    showAgentAvatar: true,
    showWaitTime: true,
    animation: 'pulse',
    mobileLayout: 'floating',
  },
  
  // Pre-call form
  preCallForm: [
    { name: 'name', label: 'Your Name', type: 'text', required: true },
    { name: 'email', label: 'Email Address', type: 'email', required: true },
    { name: 'company', label: 'Company', type: 'text', required: false },
    {
      name: 'interest',
      label: 'What are you interested in?',
      type: 'select',
      required: true,
      options: [
        { value: 'demo', label: 'Product Demo' },
        { value: 'pricing', label: 'Pricing' },
        { value: 'support', label: 'Technical Question' },
        { value: 'other', label: 'Other' },
      ],
    },
  ],
  
  // Domain restrictions
  allowedDomains: ['www.acmecorp.com', 'landing.acmecorp.com'],
  
  // Business hours (disable outside hours)
  scheduleId: 'schedule-business-hours-001',
  
  maxConcurrent: 5,
  recordCalls: true,
  
  // CRM integration
  crmIntegration: {
    autoCreateLead: true,
    fieldMapping: {
      name: 'full_name',
      email: 'email',
      company: 'company_name',
      interest: 'lead_source_detail',
    },
    pipelineId: 'pipeline-sales-001',
    stageId: 'stage-new-lead',
  },
  
  trackingId: 'GA-XXXXXX',
});

console.log('Embed this on your website:');
console.log(widget.embedCode);
// Output:
// <script src="https://cdn.mcv.one/click-to-call/v1/widget.js"
//   data-api-key="ctc_live_xxxxxxxxxxxx"
//   data-widget-id="widget-uuid-001"
//   async></script>
```

### Example 7: Call Transfer (Warm Transfer with Consultation)

```typescript
import { CallTransferService, CallService } from '@mcv/nexus/calls';

const transferService = new CallTransferService(ctx);
const callService = new CallService(ctx);

// Agent is on a call with a customer and wants to warm-transfer to a specialist

// Step 1: Put the customer on hold
await callService.hold('call-uuid-active', {
  holdMusicUrl: 'https://cdn.example.com/hold-music/pleasant.mp3',
});

// Step 2: Initiate warm transfer — this creates a consultation call
const transfer = await transferService.warm({
  sourceCallId: 'call-uuid-active',
  destination: {
    type: 'agent',
    id: 'agent-specialist-001',
  },
  context: 'Customer has a billing dispute on invoice #12345. They are calm and looking for a refund. Account is in good standing.',
  whisperMessage: 'Transferring a billing dispute. Customer is asking about invoice 12345.',
});

console.log(`Transfer initiated: ${transfer.id}`);
console.log(`Consultation call: ${transfer.consultCallId}`);
// Agent is now speaking with the specialist (customer is on hold)

// Step 3: Agent can either complete the transfer or cancel

// Option A: Complete the transfer (connect customer to specialist)
await transferService.complete(transfer.id);
// Customer is now connected to specialist, original agent is freed

// Option B: Cancel the transfer (go back to the customer)
// await transferService.cancel(transfer.id);
// Specialist is disconnected, agent resumes with customer

// Option C: Convert to 3-way conference (attended transfer)
await transferService.conferenceAll(transfer.id);
// All three parties are now connected; agent can then drop off
await transferService.dropOriginator(transfer.id);
// Customer and specialist remain connected

// Cold transfer example (immediate, no consultation)
await transferService.cold({
  sourceCallId: 'call-uuid-active-2',
  destination: {
    type: 'external',
    phoneNumber: '+14155559999',
  },
});

// Transfer to a queue
await transferService.toQueue({
  sourceCallId: 'call-uuid-active-3',
  destination: {
    type: 'queue',
    id: 'queue-billing-001',
  },
  context: 'Customer needs help with billing. Already verified identity.',
});
```

### Example 8: Call Analytics and Real-Time Wallboard

```typescript
import { CallAnalyticsService } from '@mcv/nexus/calls';

const analyticsService = new CallAnalyticsService(ctx);

// Get aggregated analytics for today
const todayStats = await analyticsService.aggregate({
  period: 'day',
  periodStart: new Date('2025-02-09T00:00:00Z'),
  periodEnd: new Date('2025-02-09T23:59:59Z'),
  scope: 'tenant',
});

console.log('Today\'s Call Stats:');
console.log(`  Total Calls:     ${todayStats.totalCalls}`);
console.log(`  Answered:        ${todayStats.answeredCalls}`);
console.log(`  Missed:          ${todayStats.missedCalls}`);
console.log(`  Abandoned:       ${todayStats.abandonedCalls}`);
console.log(`  Avg Duration:    ${todayStats.avgDuration}s`);
console.log(`  Avg Wait Time:   ${todayStats.avgWaitTime}s`);
console.log(`  Answer Rate:     ${(todayStats.answerRate / 100).toFixed(1)}%`);
console.log(`  Service Level:   ${(todayStats.serviceLevel / 100).toFixed(1)}%`);
console.log(`  Avg MOS Score:   ${(todayStats.avgMosScore / 100).toFixed(2)}`);
console.log(`  Poor Quality:    ${todayStats.poorQualityCalls}`);

// Get agent scorecard
const agentScorecard = await analyticsService.agentScorecard({
  agentId: 'agent-001',
  dateRange: {
    from: new Date('2025-02-01'),
    to: new Date('2025-02-09'),
  },
});

console.log(`\nAgent Scorecard: ${agentScorecard.agentName}`);
console.log(`  Calls Handled:     ${agentScorecard.callsHandled}`);
console.log(`  Avg Handle Time:   ${agentScorecard.avgHandleTime}s`);
console.log(`  Avg Talk Time:     ${agentScorecard.avgTalkTime}s`);
console.log(`  First Call Res:    ${agentScorecard.firstCallResolution}%`);
console.log(`  Customer Sat:      ${agentScorecard.customerSatisfaction}/5`);
console.log(`  Utilization:       ${agentScorecard.utilization}%`);

// Subscribe to real-time wallboard data (WebSocket)
const wallboard = analyticsService.subscribeWallboard({
  tenantId: ctx.tenantId,
  refreshInterval: 5000,  // 5 seconds
});

wallboard.on('update', (data: WallboardData) => {
  console.log(`\n=== WALLBOARD ${data.timestamp.toISOString()} ===`);
  console.log(`Active Calls:     ${data.activeCalls}`);
  console.log(`In Queue:         ${data.callsInQueue}`);
  console.log(`Longest Wait:     ${data.longestWait}s`);
  console.log(`Agents Available: ${data.availableAgents}`);
  console.log(`Agents Busy:      ${data.busyAgents}`);
  console.log(`Today Answered:   ${data.todayAnswered}`);
  console.log(`Today SLA:        ${data.todayServiceLevel}%`);
  
  for (const queue of data.queues) {
    console.log(`  Queue "${queue.queueName}": ${queue.waitingCalls} waiting, ${queue.availableAgents} agents`);
  }
});

// Quality report for compliance
const qualityReport = await analyticsService.qualityReport({
  dateRange: {
    from: new Date('2025-01-01'),
    to: new Date('2025-01-31'),
  },
  groupBy: 'day',
  includeDistribution: true,
});

console.log('\nCall Quality Report (January 2025):');
for (const day of qualityReport.data) {
  console.log(`  ${day.date}: MOS ${day.avgMos.toFixed(2)}, Jitter ${day.avgJitter}ms, Loss ${day.avgPacketLoss}%`);
}
```

---

## Error Codes

All errors follow the MCV platform error format with a `CALLS_` prefix. Errors are thrown as `TRPCError` instances with structured `cause` data.

| Code | HTTP | Description | Resolution |
|------|------|-------------|------------|
| `CALLS_NOT_FOUND` | 404 | Call record not found | Verify the call ID exists and belongs to the current tenant |
| `CALLS_ALREADY_ENDED` | 409 | Cannot modify a completed call | Check call status before attempting operations |
| `CALLS_INVALID_STATUS_TRANSITION` | 409 | Invalid call state transition (e.g., hold → ringing) | Follow the state machine: only valid transitions are allowed |
| `CALLS_PROVIDER_ERROR` | 502 | Telephony provider returned an error | Check provider dashboard; may be a transient issue |
| `CALLS_PROVIDER_TIMEOUT` | 504 | Telephony provider did not respond in time | Retry with exponential backoff; check provider status page |
| `CALLS_PROVIDER_AUTH_FAILED` | 401 | Invalid provider credentials | Verify `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN` or equivalent |
| `CALLS_NUMBER_NOT_FOUND` | 404 | Phone number not found or not owned by tenant | Provision the number first via `PhoneNumberService` |
| `CALLS_NUMBER_NOT_VOICE_ENABLED` | 422 | Phone number does not support voice calls | Check number capabilities; may need a different number type |
| `CALLS_INVALID_NUMBER` | 422 | Destination phone number is invalid (not E.164) | Format as E.164: `+{country}{number}` with no spaces or dashes |
| `CALLS_QUEUE_FULL` | 429 | Call queue has reached its maximum capacity | Increase `maxSize` on the queue, or configure overflow |
| `CALLS_QUEUE_NOT_FOUND` | 404 | Call queue does not exist | Check the queue ID; ensure the queue is active |
| `CALLS_NO_AGENTS_AVAILABLE` | 503 | No agents are available to handle the call | Agents may be offline, busy, or in wrap-up |
| `CALLS_CONFERENCE_FULL` | 429 | Conference has reached max participant limit | Increase `maxParticipants` or wait for someone to leave |
| `CALLS_CONFERENCE_NOT_FOUND` | 404 | Conference does not exist | Verify the conference ID |
| `CALLS_CONFERENCE_INVALID_PIN` | 403 | Conference PIN is incorrect | Re-enter the correct PIN |
| `CALLS_RECORDING_NOT_ALLOWED` | 403 | Recording is not permitted for this tenant/call | Check tenant plan, recording consent settings, and permissions |
| `CALLS_RECORDING_STORAGE_FULL` | 507 | Recording storage quota exceeded | Delete old recordings or upgrade storage plan |
| `CALLS_RECORDING_NOT_FOUND` | 404 | Recording not found | Verify recording ID; may have been deleted by retention policy |
| `CALLS_TRANSCRIPTION_FAILED` | 500 | Transcription service returned an error | Retry; check audio quality and language support |
| `CALLS_TRANSFER_FAILED` | 500 | Call transfer could not be completed | Destination may be unavailable; check agent/queue status |
| `CALLS_TRANSFER_TARGET_BUSY` | 409 | Transfer target is already on another call | Try a different agent or route to a queue |
| `CALLS_IVR_INVALID_CONFIG` | 422 | IVR menu configuration is invalid | Check for circular references, missing actions, or invalid digits |
| `CALLS_VOICEMAIL_BOX_FULL` | 507 | Voicemail box has reached maximum message count | Delete old voicemails or increase `maxMessages` |
| `CALLS_VOICEMAIL_NOT_FOUND` | 404 | Voicemail message not found | Verify voicemail ID |
| `CALLS_DIALER_CAMPAIGN_LIMIT` | 429 | Maximum concurrent dialer campaigns reached | Wait for a campaign to complete or upgrade plan |
| `CALLS_DIALER_DNC_VIOLATION` | 403 | Number is on the Do Not Call list | Remove from campaign contact list |
| `CALLS_WEBHOOK_INVALID_SIGNATURE` | 401 | Inbound webhook signature validation failed | Verify webhook secret configuration matches provider settings |
| `CALLS_WEBRTC_ICE_FAILED` | 500 | WebRTC ICE negotiation failed — no media path | Check TURN server configuration; client may be behind restrictive NAT |
| `CALLS_WEBRTC_SDP_ERROR` | 422 | Invalid SDP offer/answer | Browser may not support required codecs |
| `CALLS_RATE_LIMITED` | 429 | Too many API calls in a short period | Implement exponential backoff; respect `Retry-After` header |
| `CALLS_INSUFFICIENT_BALANCE` | 402 | Tenant does not have sufficient calling credit | Top up the calling balance |
| `CALLS_PORTING_IN_PROGRESS` | 409 | Cannot modify a number that is being ported | Wait for porting to complete |
| `CALLS_NUMBER_ALREADY_OWNED` | 409 | Phone number is already owned by another tenant | Each number can only be assigned to one tenant |
| `CALLS_PERMISSION_DENIED` | 403 | User lacks the required permission for this action | Assign the `calls.*` permission to the user's role |

### Error Response Format

```typescript
// tRPC error thrown by the service layer
throw new TRPCError({
  code: 'NOT_FOUND',
  message: 'Call not found',
  cause: {
    errorCode: 'CALLS_NOT_FOUND',
    callId: 'uuid-that-was-requested',
    tenantId: ctx.tenantId,
    timestamp: new Date().toISOString(),
    traceId: ctx.traceId,
  },
});

// Client-side error handling
try {
  await trpc.calls.call.get.query({ callId: 'nonexistent' });
} catch (error) {
  if (error.data?.errorCode === 'CALLS_NOT_FOUND') {
    console.error('Call does not exist');
  }
  if (error.data?.errorCode === 'CALLS_PROVIDER_ERROR') {
    console.error('Provider issue — retrying...');
    // Implement retry logic
  }
}
```

---

## Security

### Authentication & Authorization

All call operations require a valid tRPC context with authenticated tenant and user. Permissions are enforced at the router level using middleware.

```typescript
// Permission model
const CALL_PERMISSIONS = {
  // Core call operations
  'calls.read':              'View call history and details',
  'calls.create':            'Initiate outbound calls',
  'calls.update':            'Modify active calls (hold, mute, transfer)',
  'calls.delete':            'Delete call records',
  
  // Recording permissions
  'calls.recordings.read':   'Listen to and download call recordings',
  'calls.recordings.create': 'Start/stop call recording',
  'calls.recordings.delete': 'Delete call recordings',
  'calls.recordings.transcribe': 'Request transcription',
  'calls.recordings.redact': 'Redact sensitive data from recordings',
  
  // Configuration permissions
  'calls.routes.manage':     'Create and modify call routing rules',
  'calls.ivr.manage':        'Create and modify IVR menus',
  'calls.queues.manage':     'Create and modify call queues',
  'calls.numbers.manage':    'Provision, port, and release phone numbers',
  'calls.voicemail.manage':  'Manage voicemail boxes and settings',
  
  // Conference permissions
  'calls.conferences.create': 'Create conferences',
  'calls.conferences.moderate': 'Moderator controls (mute, kick, breakout)',
  
  // Dialer permissions
  'calls.dialer.manage':     'Create and run dialer campaigns',
  'calls.dialer.run':        'Participate in dialer campaigns',
  
  // Analytics permissions
  'calls.analytics.read':    'View call analytics and reports',
  'calls.analytics.export':  'Export analytics data',
  
  // Admin
  'calls.admin':             'Full administrative access to all call features',
} as const;
```

### Webhook Security

Provider webhooks are validated using signature verification to prevent spoofing:

```typescript
// Twilio webhook validation
import { validateRequest } from 'twilio';

function validateTwilioWebhook(req: Request): boolean {
  const signature = req.headers['x-twilio-signature'] as string;
  const url = `${process.env.WEBHOOK_BASE_URL}${req.path}`;
  return validateRequest(
    process.env.TWILIO_AUTH_TOKEN!,
    signature,
    url,
    req.body,
  );
}

// Vonage webhook validation (JWT-based)
function validateVonageWebhook(req: Request): boolean {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (!token) return false;
  try {
    jwt.verify(token, process.env.VONAGE_API_SECRET!);
    return true;
  } catch {
    return false;
  }
}
```

### Recording Consent & Compliance

```typescript
// Consent configuration per tenant
interface RecordingConsentConfig {
  /** Consent mode */
  mode: 'all_party' | 'one_party' | 'none';
  
  /** Announcement played before recording starts */
  announcementUrl?: string;
  
  /** TTS announcement text */
  announcementText?: string;
  
  /** Whether to play a periodic beep during recording */
  periodicBeep: boolean;
  
  /** Beep interval in seconds */
  beepInterval?: number;
  
  /** Jurisdictions requiring all-party consent */
  allPartyJurisdictions: string[];
  
  /** Whether to auto-detect jurisdiction from caller ID */
  autoDetectJurisdiction: boolean;
}
```

### Data Encryption

| Data | At Rest | In Transit |
|------|---------|------------|
| Call metadata | AES-256 (Supabase) | TLS 1.3 |
| Recordings | AES-256-GCM (Storage) | TLS 1.3 |
| Transcriptions | AES-256 (Supabase) | TLS 1.3 |
| Voice media | N/A (real-time) | SRTP (DTLS-SRTP) |
| Signaling | N/A (real-time) | WSS (TLS 1.3) |
| Provider credentials | AES-256-GCM (Vault) | TLS 1.3 |
| Voicemail PINs | bcrypt hash | TLS 1.3 |
| Conference PINs | bcrypt hash | TLS 1.3 |
| DTMF digits | AES-256 (Supabase) | SRTP |

### PCI DSS Compliance

For calls that may involve credit card information:

- **Pause/Resume recording** — agents can pause recording during PCI data collection
- **DTMF masking** — credit card digits entered via keypad are masked in logs
- **Auto-redaction** — AI-powered detection and redaction of card numbers in recordings and transcriptions
- **Secure IVR collection** — PCI-compliant DTMF collection with tokenization (never stored in plain text)
- **Audit trail** — all PCI-related operations are logged with immutable timestamps

### GDPR / Data Privacy

- **Right to erasure** — `RecordingService.deleteByContact(contactId)` purges all recordings for a data subject
- **Retention policies** — configurable per-tenant automatic deletion schedules
- **Data portability** — `RecordingService.exportByContact(contactId)` generates a downloadable archive
- **Processing records** — call metadata serves as Article 30 processing records
- **Consent tracking** — every recording stores how and when consent was obtained

### Rate Limiting

```typescript
// Default rate limits per tenant
const RATE_LIMITS = {
  'calls.initiate':       { max: 60,  window: '1m' },  // 60 outbound calls/min
  'calls.recording.start': { max: 30,  window: '1m' },
  'calls.conference.create': { max: 10, window: '1m' },
  'calls.numbers.provision': { max: 5, window: '1h' },
  'calls.analytics.query': { max: 100, window: '1m' },
  'calls.webhook':        { max: 1000, window: '1m' },  // Provider webhooks
};
```

### Tenant Isolation

- **Database**: Every query is scoped by `tenant_id` via Supabase RLS policies
- **Storage**: Recordings stored in tenant-prefixed paths: `recordings/{tenant_id}/{call_id}/{recording_id}.wav`
- **Provider accounts**: Each tenant can configure separate provider credentials
- **Phone numbers**: Numbers are exclusively bound to one tenant
- **WebRTC**: TURN credentials are generated per-session, per-tenant
- **Redis**: Call state keys are prefixed with tenant ID

---

## Environment Variables

```bash
# === Twilio Configuration ===
TWILIO_ACCOUNT_SID=AC...                # Twilio account SID
TWILIO_AUTH_TOKEN=...                    # Twilio auth token
TWILIO_API_KEY_SID=SK...                # Twilio API key (for TURN credentials)
TWILIO_API_KEY_SECRET=...               # Twilio API key secret
TWILIO_TWIML_APP_SID=AP...             # TwiML application SID (for browser calling)

# === Vonage Configuration ===
VONAGE_API_KEY=...                      # Vonage API key
VONAGE_API_SECRET=...                   # Vonage API secret
VONAGE_APPLICATION_ID=...               # Vonage application ID
VONAGE_PRIVATE_KEY_PATH=./private.key   # Path to Vonage private key

# === SIP Configuration ===
SIP_DOMAIN=sip.example.com             # SIP trunk domain
SIP_USERNAME=...                        # SIP auth username
SIP_PASSWORD=...                        # SIP auth password
SIP_PROXY=sip-proxy.example.com:5060   # SIP proxy address
SIP_TRANSPORT=tls                       # SIP transport (udp, tcp, tls)

# === WebRTC Configuration ===
STUN_SERVERS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302
TURN_SERVER_URL=turn:turn.example.com:3478
TURN_SERVER_USERNAME=...                # TURN server username
TURN_SERVER_CREDENTIAL=...             # TURN server credential
TURN_SERVER_TTL=86400                   # TURN credential TTL in seconds

# === Webhooks ===
WEBHOOK_BASE_URL=https://api.example.com/webhooks/calls
WEBHOOK_SECRET=whsec_...                # Webhook signing secret

# === Recording Storage ===
RECORDING_STORAGE_BUCKET=call-recordings
RECORDING_MAX_DURATION=7200             # Max recording duration in seconds (2 hours)
RECORDING_DEFAULT_FORMAT=wav            # Default recording format
RECORDING_RETENTION_DAYS=365            # Default retention period

# === Transcription ===
WHISPER_API_URL=https://api.openai.com/v1/audio/transcriptions
WHISPER_API_KEY=sk-...                  # OpenAI API key for Whisper
WHISPER_MODEL=whisper-1                 # Whisper model to use
TRANSCRIPTION_MAX_CONCURRENT=5          # Max concurrent transcription jobs

# === Call Quality ===
MOS_ALERT_THRESHOLD=3.0                 # Alert when MOS drops below this
QUALITY_CHECK_INTERVAL=10               # Quality check interval in seconds
JITTER_ALERT_THRESHOLD=50              # Alert on jitter above this (ms)
PACKET_LOSS_ALERT_THRESHOLD=3          # Alert on packet loss above this (%)

# === Queue Configuration ===
QUEUE_DEFAULT_HOLD_MUSIC=https://cdn.example.com/hold-music/default.mp3
QUEUE_MAX_WAIT_TIME=600                 # Default max wait time in seconds
QUEUE_POSITION_INTERVAL=30              # Position announcement interval

# === Dialer Configuration ===
DIALER_MAX_CONCURRENT_CAMPAIGNS=5       # Max concurrent campaigns per tenant
DIALER_PREDICTIVE_ABANDON_THRESHOLD=3   # Max abandon rate % for predictive dialer
DIALER_CALLING_HOURS_START=09:00        # Earliest calling time (local)
DIALER_CALLING_HOURS_END=21:00          # Latest calling time (local)

# === Redis (Call State) ===
REDIS_CALLS_URL=redis://localhost:6379/2  # Redis instance for call state
REDIS_CALLS_PREFIX=mcv:calls:            # Key prefix

# === Feature Flags ===
CALLS_VIDEO_ENABLED=true                # Enable video calling
CALLS_RECORDING_ENABLED=true            # Enable call recording
CALLS_TRANSCRIPTION_ENABLED=true        # Enable transcription
CALLS_DIALER_ENABLED=true              # Enable outbound dialer
CALLS_CLICK_TO_CALL_ENABLED=true       # Enable click-to-call widgets
CALLS_CONFERENCE_MAX_PARTICIPANTS=100   # Max conference participants
```

---

## Dependencies

### Runtime Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `twilio` | `^5.x` | Twilio Voice SDK — outbound calls, TwiML, recording, conferencing |
| `@vonage/server-sdk` | `^3.x` | Vonage API — alternative telephony provider |
| `@vonage/voice` | `^2.x` | Vonage Voice — NCCO builder, call control |
| `mediasoup` | `^3.x` | WebRTC SFU — video conferencing, screen sharing |
| `mediasoup-client` | `^3.x` | WebRTC client — browser-side media handling |
| `sdp-transform` | `^2.x` | SDP parsing and manipulation for WebRTC signaling |
| `drizzle-orm` | `^0.30.x` | ORM — type-safe SQL queries and schema definitions |
| `@trpc/server` | `^10.x` | tRPC server — type-safe API layer |
| `@trpc/client` | `^10.x` | tRPC client — type-safe API consumption |
| `zod` | `^3.x` | Schema validation — input/output validation |
| `@supabase/supabase-js` | `^2.x` | Supabase client — storage, auth, realtime |
| `ioredis` | `^5.x` | Redis client — call state caching, queue management |
| `bullmq` | `^5.x` | Job queue — recording processing, transcription jobs |
| `libphonenumber-js` | `^1.x` | Phone number parsing, validation, and formatting |
| `bcryptjs` | `^2.x` | Password/PIN hashing for voicemail and conference PINs |
| `jsonwebtoken` | `^9.x` | JWT handling for Vonage webhook validation |
| `ws` | `^8.x` | WebSocket server — signaling, real-time call state |
| `pino` | `^9.x` | Structured logging for call events and debugging |

### Peer Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@mcv/core` | `workspace:*` | Core platform — auth, tenancy, events, config |
| `@mcv/nexus` | `workspace:*` | Parent Nexus module — shared communication types |
| `react` | `^18.x` | React — required for client-side hooks and components |
| `react-dom` | `^18.x` | React DOM — required for widget rendering |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `vitest` | `^2.x` | Test runner |
| `@testing-library/react` | `^15.x` | React component testing |
| `msw` | `^2.x` | API mocking for provider simulations |
| `@faker-js/faker` | `^8.x` | Test data generation |
| `drizzle-kit` | `^0.22.x` | Database migration tooling |
| `typescript` | `^5.x` | TypeScript compiler |

---

## Testing

### Test Structure

```
src/
├── __tests__/
│   ├── services/
│   │   ├── call.service.test.ts
│   │   ├── call-routing.service.test.ts
│   │   ├── recording.service.test.ts
│   │   ├── conference.service.test.ts
│   │   ├── video-call.service.test.ts
│   │   ├── voicemail.service.test.ts
│   │   ├── phone-number.service.test.ts
│   │   ├── call-analytics.service.test.ts
│   │   ├── call-transfer.service.test.ts
│   │   ├── call-queue.service.test.ts
│   │   ├── ivr.service.test.ts
│   │   ├── dialer.service.test.ts
│   │   └── click-to-call.service.test.ts
│   ├── providers/
│   │   ├── twilio-voice.provider.test.ts
│   │   ├── vonage.provider.test.ts
│   │   ├── sip.provider.test.ts
│   │   └── webrtc.provider.test.ts
│   ├── router/
│   │   ├── call.router.test.ts
│   │   ├── conference.router.test.ts
│   │   ├── recording.router.test.ts
│   │   └── analytics.router.test.ts
│   ├── hooks/
│   │   ├── useCall.test.ts
│   │   ├── useConference.test.ts
│   │   └── useVideoCall.test.ts
│   ├── integration/
│   │   ├── call-lifecycle.integration.test.ts
│   │   ├── ivr-routing.integration.test.ts
│   │   ├── conference-lifecycle.integration.test.ts
│   │   ├── recording-transcription.integration.test.ts
│   │   └── dialer-campaign.integration.test.ts
│   └── e2e/
│       ├── inbound-call-flow.e2e.test.ts
│       ├── outbound-call-flow.e2e.test.ts
│       ├── conference-flow.e2e.test.ts
│       └── click-to-call-flow.e2e.test.ts
```

### Running Tests

```bash
# All tests
pnpm vitest run --project=nexus-calls

# Unit tests only
pnpm vitest run --project=nexus-calls --dir=src/__tests__/services

# Provider tests (mock external APIs)
pnpm vitest run --project=nexus-calls --dir=src/__tests__/providers

# Integration tests (requires local Supabase + Redis)
pnpm vitest run --project=nexus-calls --dir=src/__tests__/integration

# E2E tests (requires running telephony sandbox)
CALLS_E2E=true pnpm vitest run --project=nexus-calls --dir=src/__tests__/e2e

# Watch mode
pnpm vitest watch --project=nexus-calls

# Coverage
pnpm vitest run --project=nexus-calls --coverage
```

### Unit Test Example: CallService

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CallService } from '../../services/call.service';
import { createMockContext } from '@mcv/core/testing';
import { createMockProvider } from '../helpers/mock-provider';

describe('CallService', () => {
  let service: CallService;
  let mockProvider: ReturnType<typeof createMockProvider>;
  let ctx: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    ctx = createMockContext({ tenantId: 'tenant-001', userId: 'user-001' });
    mockProvider = createMockProvider();
    service = new CallService(ctx, { provider: mockProvider });
  });

  describe('initiate', () => {
    it('should create an outbound call and persist to database', async () => {
      mockProvider.initiateCall.mockResolvedValue({
        providerCallSid: 'CA_test_123',
        status: 'initiated',
      });

      const call = await service.initiate({
        from: '+14155551234',
        to: '+14155559876',
        type: 'voice',
        agentId: 'user-001',
      });

      expect(call.id).toBeDefined();
      expect(call.direction).toBe('outbound');
      expect(call.status).toBe('initiated');
      expect(call.from).toBe('+14155551234');
      expect(call.to).toBe('+14155559876');
      expect(call.tenantId).toBe('tenant-001');
      expect(call.providerCallSid).toBe('CA_test_123');
      
      expect(mockProvider.initiateCall).toHaveBeenCalledWith(
        expect.objectContaining({
          from: '+14155551234',
          to: '+14155559876',
        }),
      );
    });

    it('should validate phone number format', async () => {
      await expect(
        service.initiate({
          from: '+14155551234',
          to: 'not-a-number',
          type: 'voice',
        }),
      ).rejects.toThrow('CALLS_INVALID_NUMBER');
    });

    it('should verify the from number belongs to the tenant', async () => {
      await expect(
        service.initiate({
          from: '+19999999999',  // Not owned by tenant
          to: '+14155559876',
          type: 'voice',
        }),
      ).rejects.toThrow('CALLS_NUMBER_NOT_FOUND');
    });

    it('should emit call.initiated event', async () => {
      mockProvider.initiateCall.mockResolvedValue({
        providerCallSid: 'CA_test_456',
        status: 'initiated',
      });

      const eventSpy = vi.fn();
      ctx.events.on('call.initiated', eventSpy);

      await service.initiate({
        from: '+14155551234',
        to: '+14155559876',
        type: 'voice',
      });

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          callId: expect.any(String),
          direction: 'outbound',
          from: '+14155551234',
          to: '+14155559876',
        }),
      );
    });

    it('should handle provider errors gracefully', async () => {
      mockProvider.initiateCall.mockRejectedValue(
        new Error('Twilio: Invalid To number'),
      );

      await expect(
        service.initiate({
          from: '+14155551234',
          to: '+14155559876',
          type: 'voice',
        }),
      ).rejects.toThrow('CALLS_PROVIDER_ERROR');
    });
  });

  describe('hangup', () => {
    it('should end an active call', async () => {
      const call = await insertTestCall(ctx, { status: 'in_progress' });

      const updated = await service.hangup(call.id);

      expect(updated.status).toBe('completed');
      expect(updated.completedAt).toBeDefined();
      expect(updated.duration).toBeGreaterThanOrEqual(0);
      expect(mockProvider.hangupCall).toHaveBeenCalled();
    });

    it('should not allow hanging up an already-completed call', async () => {
      const call = await insertTestCall(ctx, { status: 'completed' });

      await expect(service.hangup(call.id)).rejects.toThrow(
        'CALLS_ALREADY_ENDED',
      );
    });
  });

  describe('hold / resume', () => {
    it('should place a call on hold and then resume', async () => {
      const call = await insertTestCall(ctx, { status: 'in_progress' });

      const held = await service.hold(call.id);
      expect(held.status).toBe('on_hold');

      const resumed = await service.resume(call.id);
      expect(resumed.status).toBe('in_progress');
    });
  });
});
```

### Integration Test Example: Call Lifecycle

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createIntegrationContext } from '@mcv/core/testing';
import { CallService } from '../../services/call.service';
import { RecordingService } from '../../services/recording.service';
import { setupTestDatabase, teardownTestDatabase } from '../helpers/database';

describe('Call Lifecycle (Integration)', () => {
  let ctx: Awaited<ReturnType<typeof createIntegrationContext>>;
  let callService: CallService;
  let recordingService: RecordingService;

  beforeAll(async () => {
    await setupTestDatabase();
    ctx = await createIntegrationContext({ tenantId: 'test-tenant' });
    callService = new CallService(ctx);
    recordingService = new RecordingService(ctx);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('should handle a complete inbound call lifecycle', async () => {
    // 1. Simulate inbound webhook
    const webhookPayload = {
      provider: 'twilio',
      event: 'call.initiated',
      callSid: 'CA_integration_test_001',
      from: '+447911123456',
      to: '+14155551234',
      status: 'ringing',
      direction: 'inbound',
      timestamp: new Date(),
    };

    const call = await callService.handleInboundWebhook(webhookPayload);
    expect(call.direction).toBe('inbound');
    expect(call.status).toBe('ringing');

    // 2. Agent answers the call
    const answered = await callService.answer(call.id, {
      agentId: 'agent-001',
      record: true,
    });
    expect(answered.status).toBe('in_progress');
    expect(answered.agentId).toBe('agent-001');
    expect(answered.answeredAt).toBeDefined();

    // 3. Verify recording was started
    const recordings = await recordingService.listByCall(call.id);
    expect(recordings).toHaveLength(1);
    expect(recordings[0].status).toBe('in_progress');

    // 4. Agent puts call on hold
    const held = await callService.hold(call.id);
    expect(held.status).toBe('on_hold');

    // 5. Agent resumes
    const resumed = await callService.resume(call.id);
    expect(resumed.status).toBe('in_progress');

    // 6. Call ends
    const completed = await callService.hangup(call.id);
    expect(completed.status).toBe('completed');
    expect(completed.duration).toBeGreaterThan(0);
    expect(completed.holdDuration).toBeGreaterThan(0);

    // 7. Verify recording was stopped
    const finalRecordings = await recordingService.listByCall(call.id);
    expect(finalRecordings[0].status).toBe('completed');
    expect(finalRecordings[0].duration).toBeGreaterThan(0);

    // 8. Verify analytics were updated
    const analytics = await ctx.db
      .select()
      .from(callAnalytics)
      .where(eq(callAnalytics.tenantId, ctx.tenantId));
    expect(analytics[0].answeredCalls).toBeGreaterThanOrEqual(1);
  });
});
```

### Provider Mock Helper

```typescript
// __tests__/helpers/mock-provider.ts
import { vi } from 'vitest';
import type { CallProvider } from '../../interfaces/call-provider.interface';

export function createMockProvider(): CallProvider & {
  [K in keyof CallProvider]: ReturnType<typeof vi.fn>;
} {
  return {
    providerId: 'mock',
    providerName: 'Mock Provider',
    initialize: vi.fn().mockResolvedValue(undefined),
    initiateCall: vi.fn().mockResolvedValue({
      providerCallSid: `MOCK_${Date.now()}`,
      status: 'initiated',
    }),
    answerCall: vi.fn().mockResolvedValue(undefined),
    hangupCall: vi.fn().mockResolvedValue(undefined),
    holdCall: vi.fn().mockResolvedValue(undefined),
    resumeCall: vi.fn().mockResolvedValue(undefined),
    sendDtmf: vi.fn().mockResolvedValue(undefined),
    startRecording: vi.fn().mockResolvedValue(`REC_${Date.now()}`),
    stopRecording: vi.fn().mockResolvedValue(undefined),
    transferCall: vi.fn().mockResolvedValue(`XFER_${Date.now()}`),
    createConference: vi.fn().mockResolvedValue(`CONF_${Date.now()}`),
    addToConference: vi.fn().mockResolvedValue(`PART_${Date.now()}`),
    removeFromConference: vi.fn().mockResolvedValue(undefined),
    provisionNumber: vi.fn().mockResolvedValue({
      number: '+14155550000',
      providerNumberSid: `PN_${Date.now()}`,
    }),
    releaseNumber: vi.fn().mockResolvedValue(undefined),
    parseWebhook: vi.fn().mockReturnValue({}),
    getCallQuality: vi.fn().mockResolvedValue({
      mos: 4.2,
      rFactor: 93,
      jitter: 5,
      packetLoss: 0.1,
      rtt: 30,
      codec: 'opus',
      bitrate: 32,
      encrypted: true,
      timestamp: new Date(),
    }),
    searchNumbers: vi.fn().mockResolvedValue([]),
  };
}
```

### Test Coverage Targets

| Category | Target | Notes |
|----------|--------|-------|
| Services | ≥ 90% | Core business logic must be thoroughly tested |
| Providers | ≥ 85% | Mock external APIs; test request/response mapping |
| Router | ≥ 80% | Validate input schemas, auth, and error handling |
| Hooks | ≥ 75% | Test state management and tRPC integration |
| Integration | Key flows | Full lifecycle: initiate → route → answer → record → end |
| E2E | Happy paths | Inbound, outbound, conference, click-to-call |

---

*Last updated: 2025-02-09*
*Module version: 0.11.0*
*Documentation revision: 1.0.0*