# @mcv/growth/referrals

> Referral Program Engine — Double-sided refer-a-friend programs with viral mechanics, anti-fraud protection, tiered rewards, waitlist management, and comprehensive referral analytics.

**Domain:** Growth · **Tier:** 5 (Domain Module) · **Status:** Stable  
**Since:** 0.12.0 · **Updated:** 0.19.0  
**Maintainer:** MCV Growth Team  
**License:** BSL-1.1

---

## Table of Contents

- [Purpose](#purpose)
- [Exports](#exports)
- [Architecture](#architecture)
  - [Referral Flow](#referral-flow)
  - [Fraud Detection Pipeline](#fraud-detection-pipeline)
  - [Reward Fulfillment Pipeline](#reward-fulfillment-pipeline)
  - [Event Flow](#event-flow)
- [Core Interfaces](#core-interfaces)
  - [ReferralService](#referralservice)
  - [ReferralProgram](#referralprogram)
  - [Referral](#referral)
  - [ReferralLink](#referrallink)
  - [ReferralReward](#referralreward)
  - [ReferralFraudCheck](#referralfraudcheck)
  - [ReferralAnalytics](#referralanalytics)
  - [WaitlistEntry](#waitlistentry)
  - [ReferralMilestone](#referralmilestone)
  - [ReferralShareEvent](#referralshareevent)
  - [ReferralTier](#referraltier)
  - [AmbassadorProfile](#ambassadorprofile)
- [Database Schemas](#database-schemas)
  - [referral_programs](#referral_programs)
  - [referrals](#referrals)
  - [referral_links](#referral_links)
  - [referral_rewards](#referral_rewards)
  - [referral_milestones](#referral_milestones)
  - [referral_fraud_flags](#referral_fraud_flags)
  - [referral_analytics](#referral_analytics)
  - [waitlist_entries](#waitlist_entries)
  - [referral_tiers](#referral_tiers)
  - [referral_share_events](#referral_share_events)
  - [Row-Level Security Policies](#row-level-security-policies)
- [Code Examples](#code-examples)
  - [1 — Creating a Referral Program](#1--creating-a-referral-program)
  - [2 — Generating and Sharing Referral Links](#2--generating-and-sharing-referral-links)
  - [3 — Processing a Referral Conversion](#3--processing-a-referral-conversion)
  - [4 — Anti-Fraud Evaluation](#4--anti-fraud-evaluation)
  - [5 — Milestone and Tier Management](#5--milestone-and-tier-management)
  - [6 — Waitlist with Referral Priority](#6--waitlist-with-referral-priority)
  - [7 — Referral Analytics Dashboard](#7--referral-analytics-dashboard)
  - [8 — Ambassador Program Workflow](#8--ambassador-program-workflow)
- [Error Codes](#error-codes)
- [Security](#security)
  - [Multi-Tenant Isolation](#multi-tenant-isolation)
  - [Fraud Prevention Layers](#fraud-prevention-layers)
  - [Data Protection](#data-protection)
  - [Rate Limiting](#rate-limiting)
  - [Reward Security](#reward-security)
- [Environment Variables](#environment-variables)
- [Dependencies](#dependencies)
- [Testing](#testing)
  - [Unit Tests](#unit-tests)
  - [Integration Tests](#integration-tests)
  - [Fraud Simulation Tests](#fraud-simulation-tests)
  - [Load Tests](#load-tests)
  - [Test Utilities](#test-utilities)

---

## Purpose

`@mcv/growth/referrals` is the referral program engine for the MCV.ONE platform. It enables ventures to create, manage, and optimize refer-a-friend programs that incentivize organic user acquisition through double-sided rewards.

Referral programs are one of the most cost-effective growth channels available. Unlike paid acquisition where you pay upfront for uncertain results, referral rewards are paid only when a real user completes a qualifying action — making the cost-per-acquisition predictable and the ROI measurable.

### What This Module Does

**Program Management.** Define referral programs with configurable rules, reward structures, branding, and eligibility criteria. Each venture can run multiple programs simultaneously — a general referral program, a premium ambassador program, a pre-launch waitlist, and seasonal campaigns — each with independent rules and budgets.

**Link & Code Generation.** Every referrer gets a unique referral link and optional vanity code. Links support UTM parameters, deep linking, QR code generation, and shareable social cards with Open Graph metadata. The system tracks which channel (email, SMS, social, direct link) drives the most conversions.

**Double-Sided Rewards.** Both the referrer and the referee receive rewards when the referral converts. Reward types include loyalty points, account credits, percentage discounts, flat cash amounts, free trial extensions, feature unlocks, or custom reward types defined by the venture. Rewards can be immediate on signup or deferred until a qualifying action (e.g., first purchase, subscription activation).

**Multi-Step Conversion Funnel.** A referral moves through a defined funnel: click → signup → qualifying action → reward. Each step is tracked with timestamps, metadata, and attribution. The funnel supports configurable qualifying actions — purchase, subscription, profile completion, or any custom event — with optional minimum thresholds (e.g., first order over $25).

**Viral Mechanics.** Built-in share tracking calculates viral coefficients (K-factor), identifies top-performing share channels, and provides tools for A/B testing referral messaging. The module integrates with email, SMS, and social sharing APIs to enable one-click sharing from the referral dashboard.

**Anti-Fraud Protection.** A multi-layer fraud detection pipeline evaluates every referral for self-referral patterns, IP address matching, email domain clustering, device fingerprint reuse, velocity anomalies, and geographic impossibility. Flagged referrals are held for review; confirmed fraud triggers automatic reward clawback and account flagging.

**Tiers & Milestones.** Referrers can unlock milestones (refer 5 friends, get a bonus) and progress through tiers (Bronze → Silver → Gold → Ambassador) that increase their reward multiplier. The ambassador program gives top referrers custom landing pages, enhanced tracking, and priority support.

**Waitlist Integration.** Pre-launch ventures can create referral-powered waitlists where users earn priority access by referring friends. Each referral moves the user up in the queue, creating a viral loop before the product even launches.

**Analytics & Reporting.** Comprehensive analytics track K-factor, conversion rates at each funnel step, reward ROI, cost per acquisition, top referrers, channel performance, and cohort analysis. Data flows through Redpanda for real-time dashboards and into the analytics warehouse for long-term reporting.

### Design Philosophy

1. **Fraud-first design.** Every referral is guilty until proven innocent. The fraud pipeline runs before any reward is issued.
2. **Event-sourced state.** All referral state transitions are recorded as immutable events in Redpanda, enabling replay, audit, and real-time streaming.
3. **Tenant isolation.** Programs, referrals, rewards, and analytics are strictly scoped to ventures via RLS. A referral link from Venture A cannot be used to claim rewards in Venture B.
4. **Composable rewards.** The reward system is decoupled from fulfillment — the referral module determines *what* reward to issue, and delegates *how* to deliver it to `@mcv/growth/rewards` or `@mcv/billing/credits`.
5. **Progressive complexity.** A basic referral program can be created with 5 lines of configuration. Tiers, milestones, custom fraud rules, and ambassador programs layer on incrementally.

---

## Exports

```typescript
// ── Service ──────────────────────────────────────────────────────────
export { ReferralService }           from './services/referral.service';
export { ReferralProgramService }    from './services/referral-program.service';
export { ReferralLinkService }       from './services/referral-link.service';
export { ReferralRewardService }     from './services/referral-reward.service';
export { ReferralFraudService }      from './services/referral-fraud.service';
export { ReferralAnalyticsService }  from './services/referral-analytics.service';
export { WaitlistService }           from './services/waitlist.service';
export { AmbassadorService }         from './services/ambassador.service';

// ── Router (tRPC) ────────────────────────────────────────────────────
export { referralRouter }            from './router';
export { referralProgramRouter }     from './router/program.router';
export { referralLinkRouter }        from './router/link.router';
export { referralRewardRouter }      from './router/reward.router';
export { referralAnalyticsRouter }   from './router/analytics.router';
export { waitlistRouter }            from './router/waitlist.router';
export { ambassadorRouter }          from './router/ambassador.router';

// ── Schemas (Drizzle) ────────────────────────────────────────────────
export {
  referralPrograms,
  referrals,
  referralLinks,
  referralRewards,
  referralMilestones,
  referralFraudFlags,
  referralAnalytics,
  waitlistEntries,
  referralTiers,
  referralShareEvents,
}                                    from './schemas';

// ── Types ────────────────────────────────────────────────────────────
export type { ReferralProgram }      from './types/referral-program';
export type { Referral }             from './types/referral';
export type { ReferralLink }         from './types/referral-link';
export type { ReferralReward }       from './types/referral-reward';
export type { ReferralFraudCheck }   from './types/referral-fraud-check';
export type { ReferralAnalytics }    from './types/referral-analytics';
export type { WaitlistEntry }        from './types/waitlist-entry';
export type { ReferralMilestone }    from './types/referral-milestone';
export type { ReferralShareEvent }   from './types/referral-share-event';
export type { ReferralTier }         from './types/referral-tier';
export type { AmbassadorProfile }    from './types/ambassador-profile';
export type { ReferralConfig }       from './types/referral-config';
export type { RewardType }           from './types/reward-type';
export type { FraudSignal }          from './types/fraud-signal';
export type { ConversionStep }       from './types/conversion-step';
export type { ShareChannel }         from './types/share-channel';
export type { ViralMetrics }         from './types/viral-metrics';

// ── Validators (Zod) ────────────────────────────────────────────────
export {
  createProgramSchema,
  updateProgramSchema,
  createReferralLinkSchema,
  recordClickSchema,
  recordSignupSchema,
  recordConversionSchema,
  claimRewardSchema,
  joinWaitlistSchema,
  fraudCheckSchema,
  analyticsQuerySchema,
  ambassadorApplicationSchema,
}                                    from './validators';

// ── Events ───────────────────────────────────────────────────────────
export {
  ReferralClickedEvent,
  ReferralSignedUpEvent,
  ReferralConvertedEvent,
  ReferralRewardIssuedEvent,
  ReferralRewardClawbackEvent,
  ReferralFraudDetectedEvent,
  ReferralMilestoneReachedEvent,
  ReferralTierPromotedEvent,
  WaitlistJoinedEvent,
  WaitlistPositionChangedEvent,
  AmbassadorApprovedEvent,
}                                    from './events';

// ── Hooks ────────────────────────────────────────────────────────────
export { useReferralProgram }        from './hooks/use-referral-program';
export { useReferralLink }           from './hooks/use-referral-link';
export { useReferralDashboard }      from './hooks/use-referral-dashboard';
export { useReferralAnalytics }      from './hooks/use-referral-analytics';
export { useWaitlistPosition }       from './hooks/use-waitlist-position';
export { useAmbassadorDashboard }    from './hooks/use-ambassador-dashboard';

// ── Utils ────────────────────────────────────────────────────────────
export { generateReferralCode }      from './utils/code-generator';
export { generateReferralQR }        from './utils/qr-generator';
export { calculateKFactor }          from './utils/viral-metrics';
export { buildShareUrl }             from './utils/share-url';
export { evaluateFraudSignals }      from './utils/fraud-evaluator';
export { computeWaitlistPosition }   from './utils/waitlist-position';
```

---

## Architecture

### Referral Flow

The referral lifecycle follows a multi-step conversion funnel with fraud checks at critical junctures:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         REFERRAL LIFECYCLE                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────────────┐   │
│  │ REFERRER │    │  SHARE   │    │  CLICK   │    │     SIGNUP       │   │
│  │ creates  │───▶│  link    │───▶│ tracked  │───▶│ attributed to    │   │
│  │  link    │    │ via chan. │    │ + cookie │    │ referral + fraud │   │
│  └──────────┘    └──────────┘    └──────────┘    │     check #1     │   │
│                                                   └────────┬─────────┘   │
│                                                            │             │
│                                                            ▼             │
│  ┌──────────────────┐    ┌──────────────────┐    ┌─────────────────┐    │
│  │  REWARD ISSUED   │    │ QUALIFYING ACTION │    │   CONVERSION    │    │
│  │  referrer gets   │◀───│  purchase / sub   │◀───│  user completes │    │
│  │  referee gets    │    │  fraud check #2   │    │  onboarding     │    │
│  └────────┬─────────┘    └──────────────────┘    └─────────────────┘    │
│           │                                                              │
│           ▼                                                              │
│  ┌──────────────────┐    ┌──────────────────┐                           │
│  │  MILESTONE CHECK │    │ TIER EVALUATION  │                           │
│  │  bonus if count  │───▶│ promote if       │                           │
│  │  threshold met   │    │ criteria met     │                           │
│  └──────────────────┘    └──────────────────┘                           │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Step-by-step:**

1. **Link Creation.** Referrer requests a referral link via the dashboard or API. The system generates a unique code, creates tracking metadata, and returns a shareable URL.

2. **Share.** Referrer shares the link via one of the supported channels (email, SMS, social media, direct copy). Each share event is recorded with channel metadata.

3. **Click.** When a potential referee clicks the referral link, the system records the click event (IP, user agent, timestamp, referer header), sets a first-party attribution cookie (configurable TTL, default 30 days), and redirects to the destination URL.

4. **Signup.** When the referee creates an account, the system checks for a referral attribution cookie or URL parameter, creates a `Referral` record linking the referee to the referrer, and runs the first fraud check (IP matching, email domain analysis, device fingerprint).

5. **Qualifying Action.** The referee completes the configured qualifying action (first purchase, subscription activation, profile completion). The system verifies the action meets minimum thresholds and runs the second fraud check (velocity, behavioral analysis).

6. **Reward Issuance.** If both fraud checks pass, rewards are issued to both the referrer and referee. Rewards enter a `pending` state with a configurable hold period before becoming `approved` and available for use.

7. **Milestone & Tier Check.** After reward issuance, the system evaluates the referrer's cumulative referral count against milestone thresholds and tier criteria. If a milestone is reached, bonus rewards are issued. If a tier promotion is earned, the referrer's reward multiplier is updated.

### Fraud Detection Pipeline

The fraud detection pipeline is a multi-signal scoring system that evaluates referrals at two critical points: signup and qualifying action.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     FRAUD DETECTION PIPELINE                             │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Incoming Referral Event                                                 │
│         │                                                                │
│         ▼                                                                │
│  ┌──────────────────┐                                                    │
│  │  SIGNAL COLLECT  │  Gather all available signals:                     │
│  │                  │  • IP address (v4/v6, geo, ASN)                    │
│  │                  │  • Device fingerprint (browser, OS, screen)        │
│  │                  │  • Email domain + pattern                          │
│  │                  │  • Timing (click-to-signup, signup-to-action)      │
│  │                  │  • Behavioral (pages visited, time on site)        │
│  └────────┬─────────┘                                                    │
│           │                                                              │
│           ▼                                                              │
│  ┌──────────────────┐                                                    │
│  │  RULE EVALUATION │  Run each signal through rules:                    │
│  │                  │                                                    │
│  │  ┌────────────┐  │  ┌──────────────────────────────────────────┐     │
│  │  │Self-Refer  │──┼─▶│ Same user = referrer & referee?          │     │
│  │  └────────────┘  │  │ Score: 100 (instant block)               │     │
│  │  ┌────────────┐  │  ├──────────────────────────────────────────┤     │
│  │  │IP Match    │──┼─▶│ Same IP for referrer & referee?          │     │
│  │  └────────────┘  │  │ Score: 60 (residential) / 30 (VPN/corp) │     │
│  │  ┌────────────┐  │  ├──────────────────────────────────────────┤     │
│  │  │Email Domain│──┼─▶│ Disposable domain? Same corp domain?     │     │
│  │  └────────────┘  │  │ Score: 40 (disposable) / 20 (same corp) │     │
│  │  ┌────────────┐  │  ├──────────────────────────────────────────┤     │
│  │  │Device FP   │──┼─▶│ Same fingerprint across accounts?        │     │
│  │  └────────────┘  │  │ Score: 70 (exact match) / 30 (similar)  │     │
│  │  ┌────────────┐  │  ├──────────────────────────────────────────┤     │
│  │  │Velocity    │──┼─▶│ Too many referrals in time window?       │     │
│  │  └────────────┘  │  │ Score: 50 (>10/hour) / 80 (>50/day)     │     │
│  │  ┌────────────┐  │  ├──────────────────────────────────────────┤     │
│  │  │Geo Check   │──┼─▶│ Impossible travel? Proxy/VPN detected?   │     │
│  │  └────────────┘  │  │ Score: 35 (VPN) / 60 (impossible)       │     │
│  │  ┌────────────┐  │  ├──────────────────────────────────────────┤     │
│  │  │Behavioral  │──┼─▶│ Bot-like patterns? Instant conversions?  │     │
│  │  └────────────┘  │  │ Score: 45 (suspicious) / 75 (bot-like)  │     │
│  │                  │  └──────────────────────────────────────────┘     │
│  └────────┬─────────┘                                                    │
│           │                                                              │
│           ▼                                                              │
│  ┌──────────────────┐                                                    │
│  │  SCORE AGGREGATE │  Combine signal scores (weighted sum):             │
│  │                  │                                                    │
│  │  Total Score     │  • 0–29:   CLEAN     → auto-approve               │
│  │  Calculation     │  • 30–59:  SUSPECT   → approve with monitoring     │
│  │                  │  • 60–79:  FLAGGED   → hold for review             │
│  │                  │  • 80–100: BLOCKED   → auto-reject                 │
│  └────────┬─────────┘                                                    │
│           │                                                              │
│           ▼                                                              │
│  ┌──────────────────┐                                                    │
│  │  DECISION        │                                                    │
│  │  ┌────────────┐  │                                                    │
│  │  │  APPROVE   │──┼──▶ Continue to reward fulfillment                  │
│  │  ├────────────┤  │                                                    │
│  │  │  HOLD      │──┼──▶ Queue for manual review                        │
│  │  ├────────────┤  │                                                    │
│  │  │  REJECT    │──┼──▶ Block reward + flag accounts                    │
│  │  └────────────┘  │                                                    │
│  └──────────────────┘                                                    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Fraud signal weights are configurable per program.** A B2B SaaS product might weight IP matching lower (employees at the same office) while a consumer app might weight it higher. Disposable email detection can be turned off for programs that accept anonymous signups.

### Reward Fulfillment Pipeline

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    REWARD FULFILLMENT PIPELINE                            │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Qualifying Action Confirmed                                             │
│         │                                                                │
│         ▼                                                                │
│  ┌──────────────────┐                                                    │
│  │  REWARD CALC     │  Determine reward based on:                        │
│  │                  │  • Program base reward                             │
│  │                  │  • Referrer tier multiplier                        │
│  │                  │  • Active campaign bonuses                         │
│  │                  │  • Milestone bonus (if applicable)                 │
│  └────────┬─────────┘                                                    │
│           │                                                              │
│           ▼                                                              │
│  ┌──────────────────┐    Creates two reward records:                     │
│  │  REWARD CREATE   │    • Referrer reward (status: pending)             │
│  │                  │    • Referee reward  (status: pending)             │
│  └────────┬─────────┘                                                    │
│           │                                                              │
│           ▼                                                              │
│  ┌──────────────────┐    Configurable hold period (default: 14 days)     │
│  │  HOLD PERIOD     │    Allows for refunds, chargebacks, fraud review   │
│  │                  │    Status: pending → approved                      │
│  └────────┬─────────┘                                                    │
│           │                                                              │
│           ├──── Refund/Chargeback during hold? ──▶ CLAWBACK             │
│           │                                       (status: clawed_back)  │
│           ▼                                                              │
│  ┌──────────────────┐    Delegate to appropriate fulfillment:            │
│  │  FULFILLMENT     │    • Points  → @mcv/growth/rewards                 │
│  │                  │    • Credits → @mcv/billing/credits                │
│  │                  │    • Cash    → @mcv/billing/payouts                │
│  │                  │    • Discount→ @mcv/commerce/coupons               │
│  │                  │    Status: approved → paid                         │
│  └──────────────────┘                                                    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Event Flow

All referral state transitions publish events to Redpanda topics for real-time processing and downstream consumption:

```
Topic: growth.referrals.clicks
  → ReferralClickedEvent { referralLinkId, ip, userAgent, referer, ts }

Topic: growth.referrals.signups
  → ReferralSignedUpEvent { referralId, referrerId, refereeId, fraudScore, ts }

Topic: growth.referrals.conversions
  → ReferralConvertedEvent { referralId, qualifyingAction, value, ts }

Topic: growth.referrals.rewards
  → ReferralRewardIssuedEvent { rewardId, referralId, recipientId, type, amount, ts }
  → ReferralRewardClawbackEvent { rewardId, reason, ts }

Topic: growth.referrals.fraud
  → ReferralFraudDetectedEvent { referralId, signals, totalScore, decision, ts }

Topic: growth.referrals.milestones
  → ReferralMilestoneReachedEvent { userId, milestoneId, referralCount, bonusReward, ts }
  → ReferralTierPromotedEvent { userId, fromTier, toTier, newMultiplier, ts }

Topic: growth.referrals.waitlist
  → WaitlistJoinedEvent { waitlistEntryId, userId, position, referredBy, ts }
  → WaitlistPositionChangedEvent { waitlistEntryId, oldPosition, newPosition, ts }

Topic: growth.referrals.ambassadors
  → AmbassadorApprovedEvent { userId, programId, tier, ts }
```

---

## Core Interfaces

### ReferralService

The primary orchestrator for referral operations. Coordinates between programs, links, fraud detection, rewards, and analytics.

```typescript
interface ReferralService {
  // ── Program Management ──────────────────────────────────────────────
  createProgram(ventureId: string, config: CreateProgramInput): Promise<ReferralProgram>;
  updateProgram(programId: string, updates: UpdateProgramInput): Promise<ReferralProgram>;
  getProgram(programId: string): Promise<ReferralProgram | null>;
  listPrograms(ventureId: string, filters?: ProgramFilters): Promise<Paginated<ReferralProgram>>;
  activateProgram(programId: string): Promise<ReferralProgram>;
  pauseProgram(programId: string): Promise<ReferralProgram>;
  archiveProgram(programId: string): Promise<ReferralProgram>;

  // ── Link Management ─────────────────────────────────────────────────
  createLink(programId: string, userId: string, options?: CreateLinkOptions): Promise<ReferralLink>;
  getLinkByCode(code: string): Promise<ReferralLink | null>;
  getLinksByUser(userId: string, programId?: string): Promise<ReferralLink[]>;
  updateLinkVanityCode(linkId: string, vanityCode: string): Promise<ReferralLink>;
  deactivateLink(linkId: string): Promise<void>;
  generateQRCode(linkId: string, options?: QRCodeOptions): Promise<Buffer>;
  generateShareCard(linkId: string, options?: ShareCardOptions): Promise<string>; // URL

  // ── Referral Tracking ───────────────────────────────────────────────
  recordClick(code: string, metadata: ClickMetadata): Promise<void>;
  recordSignup(refereeId: string, attributionData: AttributionData): Promise<Referral>;
  recordQualifyingAction(referralId: string, action: QualifyingAction): Promise<Referral>;
  getReferral(referralId: string): Promise<Referral | null>;
  getReferralsByReferrer(userId: string, filters?: ReferralFilters): Promise<Paginated<Referral>>;
  getReferralByReferee(userId: string, programId: string): Promise<Referral | null>;

  // ── Reward Operations ───────────────────────────────────────────────
  issueRewards(referralId: string): Promise<{ referrerReward: ReferralReward; refereeReward: ReferralReward }>;
  approveReward(rewardId: string): Promise<ReferralReward>;
  clawbackReward(rewardId: string, reason: string): Promise<ReferralReward>;
  getRewardsByUser(userId: string, filters?: RewardFilters): Promise<Paginated<ReferralReward>>;
  getRewardSummary(userId: string, programId: string): Promise<RewardSummary>;

  // ── Fraud ───────────────────────────────────────────────────────────
  evaluateFraud(referralId: string, context: FraudContext): Promise<ReferralFraudCheck>;
  reviewFraudFlag(flagId: string, decision: 'approve' | 'reject', notes?: string): Promise<void>;
  getFraudFlags(referralId: string): Promise<ReferralFraudCheck[]>;
  getPendingFraudReviews(ventureId: string): Promise<Paginated<ReferralFraudCheck>>;

  // ── Milestones & Tiers ──────────────────────────────────────────────
  checkMilestones(userId: string, programId: string): Promise<ReferralMilestone[]>;
  evaluateTierPromotion(userId: string, programId: string): Promise<ReferralTier | null>;
  getMilestoneProgress(userId: string, programId: string): Promise<MilestoneProgress[]>;
  getTierStatus(userId: string, programId: string): Promise<TierStatus>;

  // ── Waitlist ────────────────────────────────────────────────────────
  joinWaitlist(programId: string, userId: string, referralCode?: string): Promise<WaitlistEntry>;
  getWaitlistPosition(entryId: string): Promise<number>;
  getWaitlistEntry(userId: string, programId: string): Promise<WaitlistEntry | null>;
  promoteFromWaitlist(programId: string, count: number): Promise<WaitlistEntry[]>;
  getWaitlistStats(programId: string): Promise<WaitlistStats>;

  // ── Analytics ───────────────────────────────────────────────────────
  getAnalytics(programId: string, query: AnalyticsQuery): Promise<ReferralAnalytics>;
  getViralMetrics(programId: string, dateRange: DateRange): Promise<ViralMetrics>;
  getTopReferrers(programId: string, limit?: number): Promise<TopReferrer[]>;
  getChannelBreakdown(programId: string, dateRange: DateRange): Promise<ChannelBreakdown[]>;
  getConversionFunnel(programId: string, dateRange: DateRange): Promise<FunnelStep[]>;
  getCohortAnalysis(programId: string, dateRange: DateRange): Promise<CohortData[]>;

  // ── Ambassador ──────────────────────────────────────────────────────
  applyForAmbassador(userId: string, programId: string, application: AmbassadorApplication): Promise<AmbassadorProfile>;
  approveAmbassador(userId: string, programId: string): Promise<AmbassadorProfile>;
  rejectAmbassador(userId: string, programId: string, reason: string): Promise<void>;
  getAmbassadorProfile(userId: string, programId: string): Promise<AmbassadorProfile | null>;
  listAmbassadors(programId: string, filters?: AmbassadorFilters): Promise<Paginated<AmbassadorProfile>>;

  // ── Share Tracking ──────────────────────────────────────────────────
  recordShare(linkId: string, channel: ShareChannel, metadata?: ShareMetadata): Promise<ReferralShareEvent>;
  getShareEvents(linkId: string): Promise<ReferralShareEvent[]>;
  getShareAnalytics(programId: string, dateRange: DateRange): Promise<ShareAnalytics>;
}
```

### ReferralProgram

Represents a configured referral program with rules, rewards, branding, and status.

```typescript
interface ReferralProgram {
  /** Unique program identifier (ULID) */
  id: string;

  /** Owning venture ID — all data scoped via RLS */
  ventureId: string;

  /** Human-readable program name */
  name: string;

  /** Program slug for URL construction */
  slug: string;

  /** Detailed description for referrer dashboard */
  description: string | null;

  /** Program status */
  status: 'draft' | 'active' | 'paused' | 'archived';

  /** Program type */
  type: 'standard' | 'waitlist' | 'ambassador' | 'campaign';

  /** Referrer reward configuration */
  referrerReward: RewardConfig;

  /** Referee reward configuration */
  refereeReward: RewardConfig;

  /** Qualifying action that triggers reward issuance */
  qualifyingAction: QualifyingActionConfig;

  /** Attribution settings */
  attribution: {
    /** Cookie TTL in days (default: 30) */
    cookieTtlDays: number;
    /** Allow last-click override of existing attribution */
    lastClickOverride: boolean;
    /** Maximum time between click and signup (hours) */
    maxClickToSignupHours: number | null;
  };

  /** Fraud detection settings */
  fraudConfig: {
    /** Enable/disable individual fraud signals */
    enabledSignals: FraudSignalType[];
    /** Custom score thresholds */
    thresholds: {
      autoApprove: number;   // default: 29
      holdForReview: number; // default: 60
      autoReject: number;    // default: 80
    };
    /** Custom signal weights (override defaults) */
    signalWeights: Partial<Record<FraudSignalType, number>>;
    /** Reward hold period in days before auto-approval */
    holdPeriodDays: number;  // default: 14
  };

  /** Branding configuration for share cards and landing pages */
  branding: {
    /** Primary color (hex) */
    primaryColor: string | null;
    /** Logo URL */
    logoUrl: string | null;
    /** Custom share card template ID */
    shareCardTemplateId: string | null;
    /** Custom landing page template ID */
    landingPageTemplateId: string | null;
    /** Default share message templates per channel */
    shareMessages: Partial<Record<ShareChannel, string>>;
  };

  /** Milestone definitions for this program */
  milestones: MilestoneConfig[];

  /** Tier definitions for this program */
  tiers: TierConfig[];

  /** Budget and limits */
  limits: {
    /** Maximum total rewards budget (null = unlimited) */
    maxBudget: number | null;
    /** Maximum referrals per referrer (null = unlimited) */
    maxReferralsPerUser: number | null;
    /** Maximum total referrals (null = unlimited) */
    maxTotalReferrals: number | null;
    /** Budget spent so far */
    budgetSpent: number;
  };

  /** Program date bounds */
  startsAt: Date;
  endsAt: Date | null;

  /** Metadata timestamps */
  createdAt: Date;
  updatedAt: Date;
}

interface RewardConfig {
  /** Reward type */
  type: 'points' | 'credits' | 'discount_percent' | 'discount_flat' | 'cash' | 'free_trial_days' | 'feature_unlock' | 'custom';
  /** Reward value (interpretation depends on type) */
  value: number;
  /** Currency code for cash/credit rewards */
  currency?: string;
  /** Custom reward identifier */
  customRewardId?: string;
  /** Human-readable description */
  description: string;
  /** Maximum reward value (for tiered/multiplied rewards) */
  maxValue?: number;
}

interface QualifyingActionConfig {
  /** Action type that triggers conversion */
  type: 'signup' | 'purchase' | 'subscription' | 'profile_complete' | 'custom';
  /** Minimum value threshold (e.g., first purchase over $25) */
  minValue?: number;
  /** Custom event name for custom action types */
  customEventName?: string;
  /** Maximum time after signup to complete action (days) */
  maxDaysAfterSignup?: number;
}

interface MilestoneConfig {
  /** Referral count threshold */
  count: number;
  /** Bonus reward for reaching this milestone */
  bonusReward: RewardConfig;
  /** Milestone name */
  name: string;
  /** Optional badge/achievement ID */
  badgeId?: string;
}

interface TierConfig {
  /** Tier identifier */
  id: string;
  /** Tier display name */
  name: string;
  /** Minimum lifetime referrals to qualify */
  minReferrals: number;
  /** Reward multiplier (1.0 = base, 1.5 = 50% more) */
  rewardMultiplier: number;
  /** Additional perks description */
  perks: string[];
  /** Badge/icon URL */
  badgeUrl?: string;
}
```

### Referral

Represents a single referral relationship between a referrer and referee, tracking the conversion funnel state.

```typescript
interface Referral {
  /** Unique referral identifier (ULID) */
  id: string;

  /** Program this referral belongs to */
  programId: string;

  /** Venture ID for RLS */
  ventureId: string;

  /** User who made the referral */
  referrerId: string;

  /** User who was referred */
  refereeId: string;

  /** The referral link/code used */
  referralLinkId: string;

  /** Current funnel status */
  status: 'clicked' | 'signed_up' | 'converted' | 'rewarded' | 'fraud_blocked' | 'expired';

  /** Fraud evaluation result */
  fraudStatus: 'clean' | 'suspect' | 'flagged' | 'blocked';

  /** Aggregated fraud score (0-100) */
  fraudScore: number;

  /** Click metadata */
  clickData: {
    ip: string;
    userAgent: string;
    referer: string | null;
    timestamp: Date;
    country: string | null;
    city: string | null;
  } | null;

  /** Signup metadata */
  signupData: {
    timestamp: Date;
    deviceFingerprint: string | null;
    emailDomain: string;
    ip: string;
  } | null;

  /** Conversion metadata */
  conversionData: {
    timestamp: Date;
    actionType: string;
    actionValue: number | null;
    orderId: string | null;
  } | null;

  /** Share channel that originated this referral */
  shareChannel: ShareChannel | null;

  /** Timestamps */
  clickedAt: Date | null;
  signedUpAt: Date | null;
  convertedAt: Date | null;
  rewardedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### ReferralLink

A unique, trackable referral link belonging to a specific user within a program.

```typescript
interface ReferralLink {
  /** Unique link identifier (ULID) */
  id: string;

  /** Program this link belongs to */
  programId: string;

  /** Venture ID for RLS */
  ventureId: string;

  /** User who owns this link */
  userId: string;

  /** Unique referral code (8-char alphanumeric default) */
  code: string;

  /** Optional vanity code (user-chosen, unique per program) */
  vanityCode: string | null;

  /** Full referral URL */
  url: string;

  /** Destination URL after click tracking */
  destinationUrl: string;

  /** Whether the link is active */
  isActive: boolean;

  /** UTM parameters appended to destination */
  utmParams: {
    source: string;
    medium: string;
    campaign: string;
    content?: string;
    term?: string;
  } | null;

  /** Aggregate click count (denormalized for performance) */
  clickCount: number;

  /** Aggregate signup count */
  signupCount: number;

  /** Aggregate conversion count */
  conversionCount: number;

  /** QR code data URL (generated on demand, cached) */
  qrCodeUrl: string | null;

  /** Share card image URL (generated on demand, cached) */
  shareCardUrl: string | null;

  /** Open Graph metadata for link previews */
  ogMetadata: {
    title: string;
    description: string;
    image: string | null;
  };

  /** Metadata timestamps */
  createdAt: Date;
  updatedAt: Date;
}
```

### ReferralReward

Tracks a reward issued as part of a referral, including its lifecycle from pending through fulfillment or clawback.

```typescript
interface ReferralReward {
  /** Unique reward identifier (ULID) */
  id: string;

  /** Referral that generated this reward */
  referralId: string;

  /** Program ID */
  programId: string;

  /** Venture ID for RLS */
  ventureId: string;

  /** Recipient user ID */
  recipientId: string;

  /** Whether this is the referrer's or referee's reward */
  recipientType: 'referrer' | 'referee';

  /** Reward type */
  rewardType: 'points' | 'credits' | 'discount_percent' | 'discount_flat' | 'cash' | 'free_trial_days' | 'feature_unlock' | 'custom';

  /** Base reward value */
  baseValue: number;

  /** Tier multiplier applied */
  tierMultiplier: number;

  /** Campaign bonus applied */
  campaignBonus: number;

  /** Final computed reward value */
  finalValue: number;

  /** Currency code (for cash/credit) */
  currency: string | null;

  /** Reward lifecycle status */
  status: 'pending' | 'approved' | 'paid' | 'clawed_back' | 'expired' | 'failed';

  /** External fulfillment reference (e.g., credit transaction ID, payout ID) */
  fulfillmentRef: string | null;

  /** Fulfillment provider module */
  fulfillmentProvider: string | null;

  /** Clawback reason (if applicable) */
  clawbackReason: string | null;

  /** Date when hold period expires and reward auto-approves */
  holdExpiresAt: Date;

  /** When the reward was approved */
  approvedAt: Date | null;

  /** When the reward was fulfilled/paid */
  paidAt: Date | null;

  /** When the reward was clawed back */
  clawedBackAt: Date | null;

  /** Metadata timestamps */
  createdAt: Date;
  updatedAt: Date;
}
```

### ReferralFraudCheck

Records the result of a fraud evaluation, including individual signal scores and the aggregate decision.

```typescript
interface ReferralFraudCheck {
  /** Unique fraud check identifier (ULID) */
  id: string;

  /** Referral being evaluated */
  referralId: string;

  /** Venture ID for RLS */
  ventureId: string;

  /** When in the funnel this check was performed */
  checkPoint: 'signup' | 'conversion';

  /** Individual signal evaluations */
  signals: FraudSignalResult[];

  /** Aggregate fraud score (0-100) */
  totalScore: number;

  /** Automated decision based on thresholds */
  decision: 'approve' | 'hold' | 'reject';

  /** Manual review override (if reviewed) */
  manualDecision: 'approve' | 'reject' | null;

  /** Reviewer user ID (if manually reviewed) */
  reviewedBy: string | null;

  /** Review notes */
  reviewNotes: string | null;

  /** Whether this check has been manually reviewed */
  isReviewed: boolean;

  /** Metadata timestamps */
  createdAt: Date;
  reviewedAt: Date | null;
}

interface FraudSignalResult {
  /** Signal type */
  signal: FraudSignalType;
  /** Score contribution (0-100) */
  score: number;
  /** Weight applied */
  weight: number;
  /** Weighted score (score × weight) */
  weightedScore: number;
  /** Human-readable explanation */
  reason: string;
  /** Raw data used for evaluation */
  evidence: Record<string, unknown>;
}

type FraudSignalType =
  | 'self_referral'
  | 'ip_match'
  | 'email_domain'
  | 'device_fingerprint'
  | 'velocity'
  | 'geo_impossibility'
  | 'behavioral'
  | 'disposable_email'
  | 'vpn_proxy'
  | 'timing_anomaly';
```

### ReferralAnalytics

Aggregated analytics data for a referral program over a specified time range.

```typescript
interface ReferralAnalytics {
  /** Program ID */
  programId: string;

  /** Venture ID */
  ventureId: string;

  /** Date range for this analytics snapshot */
  dateRange: { from: Date; to: Date };

  /** Viral metrics */
  viral: {
    /** K-factor: avg referrals per user × conversion rate */
    kFactor: number;
    /** Viral coefficient trend (positive = growing) */
    kFactorTrend: number;
    /** Average referrals sent per active referrer */
    avgReferralsPerUser: number;
    /** Percentage of referred users who themselves refer */
    viralityRate: number;
  };

  /** Funnel metrics */
  funnel: {
    /** Total clicks on referral links */
    totalClicks: number;
    /** Total signups attributed to referrals */
    totalSignups: number;
    /** Total conversions (qualifying actions completed) */
    totalConversions: number;
    /** Total rewards issued */
    totalRewardsIssued: number;
    /** Click-to-signup rate */
    clickToSignupRate: number;
    /** Signup-to-conversion rate */
    signupToConversionRate: number;
    /** Overall conversion rate (click-to-reward) */
    overallConversionRate: number;
  };

  /** Financial metrics */
  financial: {
    /** Total reward value issued */
    totalRewardValue: number;
    /** Total reward value paid out */
    totalRewardPaid: number;
    /** Total reward value clawed back */
    totalClawedBack: number;
    /** Average reward per conversion */
    avgRewardPerConversion: number;
    /** Effective cost per acquisition */
    costPerAcquisition: number;
    /** Remaining budget */
    remainingBudget: number | null;
    /** Budget utilization percentage */
    budgetUtilization: number | null;
  };

  /** Fraud metrics */
  fraud: {
    /** Total referrals flagged */
    totalFlagged: number;
    /** Total referrals blocked */
    totalBlocked: number;
    /** Fraud rate (blocked / total signups) */
    fraudRate: number;
    /** Pending fraud reviews */
    pendingReviews: number;
    /** Top fraud signals by frequency */
    topSignals: Array<{ signal: FraudSignalType; count: number; percentage: number }>;
  };

  /** Referrer metrics */
  referrers: {
    /** Total unique referrers */
    totalReferrers: number;
    /** Active referrers (at least 1 referral in period) */
    activeReferrers: number;
    /** Top referrers by conversion count */
    topReferrers: Array<{
      userId: string;
      displayName: string;
      referralCount: number;
      conversionCount: number;
      rewardEarned: number;
      tier: string | null;
    }>;
  };

  /** Channel breakdown */
  channels: Array<{
    channel: ShareChannel;
    clicks: number;
    signups: number;
    conversions: number;
    conversionRate: number;
    shareCount: number;
  }>;

  /** Daily time series data */
  timeSeries: Array<{
    date: string;
    clicks: number;
    signups: number;
    conversions: number;
    rewardValue: number;
    fraudBlocked: number;
  }>;
}

type ShareChannel = 'email' | 'sms' | 'twitter' | 'facebook' | 'linkedin' | 'whatsapp' | 'telegram' | 'copy_link' | 'qr_code' | 'embed' | 'other';
```

### WaitlistEntry

Represents a user's position in a pre-launch referral waitlist.

```typescript
interface WaitlistEntry {
  /** Unique entry identifier (ULID) */
  id: string;

  /** Waitlist program ID */
  programId: string;

  /** Venture ID for RLS */
  ventureId: string;

  /** User on the waitlist */
  userId: string;

  /** User's email (for non-authenticated waitlists) */
  email: string;

  /** Current position in the waitlist (1-indexed) */
  position: number;

  /** Original position when first joined */
  originalPosition: number;

  /** Number of successful referrals from this user */
  referralCount: number;

  /** Referral code used to join (if referred) */
  referredByCode: string | null;

  /** User ID of who referred this person */
  referredByUserId: string | null;

  /** Positions gained from referrals */
  positionsGained: number;

  /** Entry status */
  status: 'waiting' | 'promoted' | 'expired' | 'removed';

  /** The user's own referral link for this waitlist */
  referralLink: ReferralLink;

  /** Priority score (lower = higher priority; based on referrals + join time) */
  priorityScore: number;

  /** When the user was promoted from the waitlist */
  promotedAt: Date | null;

  /** Metadata timestamps */
  createdAt: Date;
  updatedAt: Date;
}

interface WaitlistStats {
  totalEntries: number;
  activeEntries: number;
  promotedEntries: number;
  avgReferralsPerEntry: number;
  topPosition: WaitlistEntry;
  referralDistribution: Array<{ referralCount: number; entryCount: number }>;
}
```

### ReferralMilestone

A milestone achievement reached by a referrer.

```typescript
interface ReferralMilestone {
  /** Unique milestone record ID (ULID) */
  id: string;

  /** User who reached the milestone */
  userId: string;

  /** Program ID */
  programId: string;

  /** Venture ID for RLS */
  ventureId: string;

  /** Milestone configuration reference */
  milestoneConfigIndex: number;

  /** Milestone name */
  name: string;

  /** Referral count threshold for this milestone */
  threshold: number;

  /** User's referral count when milestone was reached */
  referralCountAtMilestone: number;

  /** Bonus reward issued */
  bonusRewardId: string | null;

  /** Badge/achievement ID (if applicable) */
  badgeId: string | null;

  /** When the milestone was reached */
  reachedAt: Date;

  /** Metadata timestamps */
  createdAt: Date;
}
```

### ReferralShareEvent

Records an individual share action for analytics and channel tracking.

```typescript
interface ReferralShareEvent {
  /** Unique event identifier (ULID) */
  id: string;

  /** Referral link that was shared */
  referralLinkId: string;

  /** User who shared */
  userId: string;

  /** Program ID */
  programId: string;

  /** Venture ID for RLS */
  ventureId: string;

  /** Channel used for sharing */
  channel: ShareChannel;

  /** Platform-specific metadata */
  metadata: {
    /** Recipient identifier (email, phone — hashed for privacy) */
    recipientHash?: string;
    /** Social platform post ID */
    postId?: string;
    /** Number of recipients (for bulk shares) */
    recipientCount?: number;
  } | null;

  /** Result tracking */
  resultingClicks: number;
  resultingSignups: number;

  /** Timestamp */
  sharedAt: Date;
}
```

### ReferralTier

Represents a referrer's current tier status within a program.

```typescript
interface ReferralTier {
  /** Tier config ID */
  tierId: string;

  /** Tier display name */
  name: string;

  /** Current reward multiplier */
  rewardMultiplier: number;

  /** Perks at this tier */
  perks: string[];

  /** Badge URL */
  badgeUrl: string | null;

  /** Lifetime referral count */
  lifetimeReferrals: number;

  /** Next tier threshold (null if at max) */
  nextTierThreshold: number | null;

  /** Next tier name (null if at max) */
  nextTierName: string | null;

  /** Progress to next tier (0-1) */
  progressToNextTier: number;

  /** When this tier was achieved */
  achievedAt: Date;
}
```

### AmbassadorProfile

Extended profile for referrers who have been accepted into the ambassador program.

```typescript
interface AmbassadorProfile {
  /** User ID */
  userId: string;

  /** Program ID */
  programId: string;

  /** Venture ID for RLS */
  ventureId: string;

  /** Ambassador status */
  status: 'applied' | 'approved' | 'suspended' | 'revoked';

  /** Ambassador display name */
  displayName: string;

  /** Custom bio */
  bio: string | null;

  /** Profile image URL */
  avatarUrl: string | null;

  /** Custom landing page slug */
  landingPageSlug: string | null;

  /** Social links */
  socialLinks: {
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    youtube?: string;
    website?: string;
  };

  /** Ambassador-specific referral link */
  referralLink: ReferralLink;

  /** Current tier */
  tier: ReferralTier;

  /** Lifetime stats */
  stats: {
    totalReferrals: number;
    totalConversions: number;
    totalRewardEarned: number;
    conversionRate: number;
    avgRewardPerReferral: number;
  };

  /** Application data */
  application: {
    motivation: string;
    audience: string;
    channels: ShareChannel[];
    estimatedReach: number;
    submittedAt: Date;
  };

  /** Review data */
  approvedBy: string | null;
  approvedAt: Date | null;
  rejectionReason: string | null;

  /** Metadata timestamps */
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Database Schemas

All tables use multi-tenant RLS via `venture_id` and follow MCV.ONE schema conventions: ULID primary keys, `created_at`/`updated_at` timestamps with triggers, and soft-delete via `status` columns where appropriate.

### referral_programs

```typescript
import { pgTable, text, timestamp, jsonb, numeric, integer, pgEnum } from 'drizzle-orm/pg-core';
import { ulid } from '@mcv/db/utils';

export const programStatusEnum = pgEnum('referral_program_status', [
  'draft', 'active', 'paused', 'archived',
]);

export const programTypeEnum = pgEnum('referral_program_type', [
  'standard', 'waitlist', 'ambassador', 'campaign',
]);

export const referralPrograms = pgTable('referral_programs', {
  id:                 text('id').primaryKey().$defaultFn(ulid),
  ventureId:          text('venture_id').notNull().references(() => ventures.id),
  name:               text('name').notNull(),
  slug:               text('slug').notNull(),
  description:        text('description'),
  status:             programStatusEnum('status').notNull().default('draft'),
  type:               programTypeEnum('type').notNull().default('standard'),

  // Reward configuration (JSONB for flexibility)
  referrerReward:     jsonb('referrer_reward').notNull().$type<RewardConfig>(),
  refereeReward:      jsonb('referee_reward').notNull().$type<RewardConfig>(),
  qualifyingAction:   jsonb('qualifying_action').notNull().$type<QualifyingActionConfig>(),

  // Attribution settings
  attribution:        jsonb('attribution').notNull().$type<ReferralProgram['attribution']>().default({
    cookieTtlDays: 30,
    lastClickOverride: false,
    maxClickToSignupHours: null,
  }),

  // Fraud configuration
  fraudConfig:        jsonb('fraud_config').notNull().$type<ReferralProgram['fraudConfig']>().default({
    enabledSignals: ['self_referral', 'ip_match', 'email_domain', 'device_fingerprint', 'velocity'],
    thresholds: { autoApprove: 29, holdForReview: 60, autoReject: 80 },
    signalWeights: {},
    holdPeriodDays: 14,
  }),

  // Branding
  branding:           jsonb('branding').$type<ReferralProgram['branding']>().default({
    primaryColor: null,
    logoUrl: null,
    shareCardTemplateId: null,
    landingPageTemplateId: null,
    shareMessages: {},
  }),

  // Milestones and tiers
  milestones:         jsonb('milestones').$type<MilestoneConfig[]>().default([]),
  tiers:              jsonb('tiers').$type<TierConfig[]>().default([]),

  // Limits
  maxBudget:          numeric('max_budget', { precision: 12, scale: 2 }),
  maxReferralsPerUser: integer('max_referrals_per_user'),
  maxTotalReferrals:  integer('max_total_referrals'),
  budgetSpent:        numeric('budget_spent', { precision: 12, scale: 2 }).notNull().default('0'),

  // Date bounds
  startsAt:           timestamp('starts_at', { withTimezone: true }).notNull().defaultNow(),
  endsAt:             timestamp('ends_at', { withTimezone: true }),

  // Metadata
  createdAt:          timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:          timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ventureIdx:         index('idx_referral_programs_venture').on(table.ventureId),
  slugIdx:            uniqueIndex('idx_referral_programs_slug').on(table.ventureId, table.slug),
  statusIdx:          index('idx_referral_programs_status').on(table.ventureId, table.status),
}));
```

### referrals

```typescript
export const referralStatusEnum = pgEnum('referral_status', [
  'clicked', 'signed_up', 'converted', 'rewarded', 'fraud_blocked', 'expired',
]);

export const fraudStatusEnum = pgEnum('referral_fraud_status', [
  'clean', 'suspect', 'flagged', 'blocked',
]);

export const referrals = pgTable('referrals', {
  id:                 text('id').primaryKey().$defaultFn(ulid),
  programId:          text('program_id').notNull().references(() => referralPrograms.id),
  ventureId:          text('venture_id').notNull().references(() => ventures.id),
  referrerId:         text('referrer_id').notNull().references(() => users.id),
  refereeId:          text('referee_id').references(() => users.id),
  referralLinkId:     text('referral_link_id').notNull().references(() => referralLinks.id),

  status:             referralStatusEnum('status').notNull().default('clicked'),
  fraudStatus:        fraudStatusEnum('fraud_status').notNull().default('clean'),
  fraudScore:         integer('fraud_score').notNull().default(0),

  // Funnel metadata (JSONB for structured data)
  clickData:          jsonb('click_data').$type<Referral['clickData']>(),
  signupData:         jsonb('signup_data').$type<Referral['signupData']>(),
  conversionData:     jsonb('conversion_data').$type<Referral['conversionData']>(),

  shareChannel:       text('share_channel').$type<ShareChannel>(),

  // Funnel timestamps
  clickedAt:          timestamp('clicked_at', { withTimezone: true }),
  signedUpAt:         timestamp('signed_up_at', { withTimezone: true }),
  convertedAt:        timestamp('converted_at', { withTimezone: true }),
  rewardedAt:         timestamp('rewarded_at', { withTimezone: true }),
  expiresAt:          timestamp('expires_at', { withTimezone: true }),

  // Metadata
  createdAt:          timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:          timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  programIdx:         index('idx_referrals_program').on(table.programId),
  ventureIdx:         index('idx_referrals_venture').on(table.ventureId),
  referrerIdx:        index('idx_referrals_referrer').on(table.referrerId),
  refereeIdx:         index('idx_referrals_referee').on(table.refereeId),
  statusIdx:          index('idx_referrals_status').on(table.programId, table.status),
  linkIdx:            index('idx_referrals_link').on(table.referralLinkId),
  createdAtIdx:       index('idx_referrals_created').on(table.programId, table.createdAt),
}));
```

### referral_links

```typescript
export const referralLinks = pgTable('referral_links', {
  id:                 text('id').primaryKey().$defaultFn(ulid),
  programId:          text('program_id').notNull().references(() => referralPrograms.id),
  ventureId:          text('venture_id').notNull().references(() => ventures.id),
  userId:             text('user_id').notNull().references(() => users.id),

  code:               text('code').notNull(),
  vanityCode:         text('vanity_code'),
  url:                text('url').notNull(),
  destinationUrl:     text('destination_url').notNull(),
  isActive:           text('is_active').notNull().default('true').$type<boolean>(),

  utmParams:          jsonb('utm_params').$type<ReferralLink['utmParams']>(),
  ogMetadata:         jsonb('og_metadata').notNull().$type<ReferralLink['ogMetadata']>(),

  // Denormalized counters (updated via triggers/workers)
  clickCount:         integer('click_count').notNull().default(0),
  signupCount:        integer('signup_count').notNull().default(0),
  conversionCount:    integer('conversion_count').notNull().default(0),

  // Cached assets
  qrCodeUrl:          text('qr_code_url'),
  shareCardUrl:       text('share_card_url'),

  // Metadata
  createdAt:          timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:          timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  codeIdx:            uniqueIndex('idx_referral_links_code').on(table.code),
  vanityIdx:          uniqueIndex('idx_referral_links_vanity').on(table.programId, table.vanityCode),
  userProgramIdx:     index('idx_referral_links_user_program').on(table.userId, table.programId),
  ventureIdx:         index('idx_referral_links_venture').on(table.ventureId),
}));
```

### referral_rewards

```typescript
export const rewardStatusEnum = pgEnum('referral_reward_status', [
  'pending', 'approved', 'paid', 'clawed_back', 'expired', 'failed',
]);

export const recipientTypeEnum = pgEnum('referral_recipient_type', [
  'referrer', 'referee',
]);

export const referralRewards = pgTable('referral_rewards', {
  id:                 text('id').primaryKey().$defaultFn(ulid),
  referralId:         text('referral_id').notNull().references(() => referrals.id),
  programId:          text('program_id').notNull().references(() => referralPrograms.id),
  ventureId:          text('venture_id').notNull().references(() => ventures.id),
  recipientId:        text('recipient_id').notNull().references(() => users.id),
  recipientType:      recipientTypeEnum('recipient_type').notNull(),

  rewardType:         text('reward_type').notNull(),
  baseValue:          numeric('base_value', { precision: 12, scale: 2 }).notNull(),
  tierMultiplier:     numeric('tier_multiplier', { precision: 5, scale: 2 }).notNull().default('1.00'),
  campaignBonus:      numeric('campaign_bonus', { precision: 12, scale: 2 }).notNull().default('0.00'),
  finalValue:         numeric('final_value', { precision: 12, scale: 2 }).notNull(),
  currency:           text('currency'),

  status:             rewardStatusEnum('status').notNull().default('pending'),

  fulfillmentRef:     text('fulfillment_ref'),
  fulfillmentProvider: text('fulfillment_provider'),
  clawbackReason:     text('clawback_reason'),

  holdExpiresAt:      timestamp('hold_expires_at', { withTimezone: true }).notNull(),
  approvedAt:         timestamp('approved_at', { withTimezone: true }),
  paidAt:             timestamp('paid_at', { withTimezone: true }),
  clawedBackAt:       timestamp('clawed_back_at', { withTimezone: true }),

  // Metadata
  createdAt:          timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:          timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  referralIdx:        index('idx_referral_rewards_referral').on(table.referralId),
  recipientIdx:       index('idx_referral_rewards_recipient').on(table.recipientId),
  statusIdx:          index('idx_referral_rewards_status').on(table.status),
  holdExpiresIdx:     index('idx_referral_rewards_hold_expires').on(table.status, table.holdExpiresAt),
  programIdx:         index('idx_referral_rewards_program').on(table.programId),
  ventureIdx:         index('idx_referral_rewards_venture').on(table.ventureId),
}));
```

### referral_milestones

```typescript
export const referralMilestones = pgTable('referral_milestones', {
  id:                     text('id').primaryKey().$defaultFn(ulid),
  userId:                 text('user_id').notNull().references(() => users.id),
  programId:              text('program_id').notNull().references(() => referralPrograms.id),
  ventureId:              text('venture_id').notNull().references(() => ventures.id),

  milestoneConfigIndex:   integer('milestone_config_index').notNull(),
  name:                   text('name').notNull(),
  threshold:              integer('threshold').notNull(),
  referralCountAtMilestone: integer('referral_count_at_milestone').notNull(),

  bonusRewardId:          text('bonus_reward_id').references(() => referralRewards.id),
  badgeId:                text('badge_id'),

  reachedAt:              timestamp('reached_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt:              timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userProgramIdx:         index('idx_referral_milestones_user_program').on(table.userId, table.programId),
  ventureIdx:             index('idx_referral_milestones_venture').on(table.ventureId),
  uniqueMilestone:        uniqueIndex('idx_referral_milestones_unique').on(
    table.userId, table.programId, table.milestoneConfigIndex
  ),
}));
```

### referral_fraud_flags

```typescript
export const fraudDecisionEnum = pgEnum('referral_fraud_decision', [
  'approve', 'hold', 'reject',
]);

export const referralFraudFlags = pgTable('referral_fraud_flags', {
  id:                 text('id').primaryKey().$defaultFn(ulid),
  referralId:         text('referral_id').notNull().references(() => referrals.id),
  ventureId:          text('venture_id').notNull().references(() => ventures.id),

  checkPoint:         text('check_point').notNull().$type<'signup' | 'conversion'>(),
  signals:            jsonb('signals').notNull().$type<FraudSignalResult[]>(),
  totalScore:         integer('total_score').notNull(),
  decision:           fraudDecisionEnum('decision').notNull(),

  manualDecision:     text('manual_decision').$type<'approve' | 'reject'>(),
  reviewedBy:         text('reviewed_by').references(() => users.id),
  reviewNotes:        text('review_notes'),
  isReviewed:         text('is_reviewed').notNull().default('false').$type<boolean>(),

  createdAt:          timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  reviewedAt:         timestamp('reviewed_at', { withTimezone: true }),
}, (table) => ({
  referralIdx:        index('idx_referral_fraud_flags_referral').on(table.referralId),
  ventureIdx:         index('idx_referral_fraud_flags_venture').on(table.ventureId),
  pendingReviewIdx:   index('idx_referral_fraud_flags_pending').on(table.ventureId, table.isReviewed, table.decision),
}));
```

### referral_analytics

Pre-aggregated daily analytics snapshots for fast dashboard loading. Materialized from raw events by a background worker.

```typescript
export const referralAnalytics = pgTable('referral_analytics', {
  id:                 text('id').primaryKey().$defaultFn(ulid),
  programId:          text('program_id').notNull().references(() => referralPrograms.id),
  ventureId:          text('venture_id').notNull().references(() => ventures.id),

  /** Date this snapshot covers */
  date:               text('date').notNull(), // YYYY-MM-DD

  // Funnel counts
  clicks:             integer('clicks').notNull().default(0),
  signups:            integer('signups').notNull().default(0),
  conversions:        integer('conversions').notNull().default(0),
  rewardsIssued:      integer('rewards_issued').notNull().default(0),

  // Financial
  rewardValue:        numeric('reward_value', { precision: 12, scale: 2 }).notNull().default('0'),
  rewardPaid:         numeric('reward_paid', { precision: 12, scale: 2 }).notNull().default('0'),
  clawedBack:         numeric('clawed_back', { precision: 12, scale: 2 }).notNull().default('0'),

  // Fraud
  fraudFlagged:       integer('fraud_flagged').notNull().default(0),
  fraudBlocked:       integer('fraud_blocked').notNull().default(0),

  // Referrer counts
  uniqueReferrers:    integer('unique_referrers').notNull().default(0),
  newReferrers:       integer('new_referrers').notNull().default(0),

  // Channel breakdown (JSONB)
  channelBreakdown:   jsonb('channel_breakdown').$type<Record<ShareChannel, {
    clicks: number;
    signups: number;
    conversions: number;
    shares: number;
  }>>(),

  // Viral metrics
  kFactor:            numeric('k_factor', { precision: 6, scale: 4 }),

  // Metadata
  createdAt:          timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:          timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  programDateIdx:     uniqueIndex('idx_referral_analytics_program_date').on(table.programId, table.date),
  ventureIdx:         index('idx_referral_analytics_venture').on(table.ventureId),
  dateIdx:            index('idx_referral_analytics_date').on(table.date),
}));
```

### waitlist_entries

```typescript
export const waitlistStatusEnum = pgEnum('waitlist_status', [
  'waiting', 'promoted', 'expired', 'removed',
]);

export const waitlistEntries = pgTable('waitlist_entries', {
  id:                 text('id').primaryKey().$defaultFn(ulid),
  programId:          text('program_id').notNull().references(() => referralPrograms.id),
  ventureId:          text('venture_id').notNull().references(() => ventures.id),
  userId:             text('user_id').references(() => users.id),
  email:              text('email').notNull(),

  position:           integer('position').notNull(),
  originalPosition:   integer('original_position').notNull(),
  referralCount:      integer('referral_count').notNull().default(0),

  referredByCode:     text('referred_by_code'),
  referredByUserId:   text('referred_by_user_id').references(() => users.id),
  positionsGained:    integer('positions_gained').notNull().default(0),

  status:             waitlistStatusEnum('status').notNull().default('waiting'),
  priorityScore:      numeric('priority_score', { precision: 12, scale: 4 }).notNull(),

  // Associated referral link
  referralLinkId:     text('referral_link_id').references(() => referralLinks.id),

  promotedAt:         timestamp('promoted_at', { withTimezone: true }),
  createdAt:          timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:          timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  programPositionIdx: index('idx_waitlist_entries_position').on(table.programId, table.position),
  userProgramIdx:     uniqueIndex('idx_waitlist_entries_user_program').on(table.userId, table.programId),
  emailProgramIdx:    uniqueIndex('idx_waitlist_entries_email_program').on(table.email, table.programId),
  ventureIdx:         index('idx_waitlist_entries_venture').on(table.ventureId),
  priorityIdx:        index('idx_waitlist_entries_priority').on(table.programId, table.priorityScore),
  statusIdx:          index('idx_waitlist_entries_status').on(table.programId, table.status),
}));
```

### referral_tiers

Tracks each user's current tier within a program.

```typescript
export const referralTiers = pgTable('referral_tiers', {
  id:                 text('id').primaryKey().$defaultFn(ulid),
  userId:             text('user_id').notNull().references(() => users.id),
  programId:          text('program_id').notNull().references(() => referralPrograms.id),
  ventureId:          text('venture_id').notNull().references(() => ventures.id),

  tierId:             text('tier_id').notNull(),
  tierName:           text('tier_name').notNull(),
  rewardMultiplier:   numeric('reward_multiplier', { precision: 5, scale: 2 }).notNull(),
  lifetimeReferrals:  integer('lifetime_referrals').notNull().default(0),

  achievedAt:         timestamp('achieved_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt:          timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:          timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userProgramIdx:     uniqueIndex('idx_referral_tiers_user_program').on(table.userId, table.programId),
  ventureIdx:         index('idx_referral_tiers_venture').on(table.ventureId),
}));
```

### referral_share_events

```typescript
export const referralShareEvents = pgTable('referral_share_events', {
  id:                 text('id').primaryKey().$defaultFn(ulid),
  referralLinkId:     text('referral_link_id').notNull().references(() => referralLinks.id),
  userId:             text('user_id').notNull().references(() => users.id),
  programId:          text('program_id').notNull().references(() => referralPrograms.id),
  ventureId:          text('venture_id').notNull().references(() => ventures.id),

  channel:            text('channel').notNull().$type<ShareChannel>(),
  metadata:           jsonb('metadata').$type<ReferralShareEvent['metadata']>(),

  resultingClicks:    integer('resulting_clicks').notNull().default(0),
  resultingSignups:   integer('resulting_signups').notNull().default(0),

  sharedAt:           timestamp('shared_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  linkIdx:            index('idx_referral_share_events_link').on(table.referralLinkId),
  userIdx:            index('idx_referral_share_events_user').on(table.userId),
  channelIdx:         index('idx_referral_share_events_channel').on(table.programId, table.channel),
  ventureIdx:         index('idx_referral_share_events_venture').on(table.ventureId),
  dateIdx:            index('idx_referral_share_events_date').on(table.programId, table.sharedAt),
}));
```

### Row-Level Security Policies

All referral tables enforce multi-tenant isolation through Supabase RLS:

```sql
-- Pattern applied to all referral tables
-- Example for referral_programs:

ALTER TABLE referral_programs ENABLE ROW LEVEL SECURITY;

-- Tenant isolation: users can only see programs for their venture
CREATE POLICY "referral_programs_tenant_isolation"
  ON referral_programs
  FOR ALL
  USING (
    venture_id IN (
      SELECT venture_id FROM venture_members
      WHERE user_id = auth.uid()
    )
  );

-- Public read for active programs (for referral landing pages)
CREATE POLICY "referral_programs_public_read"
  ON referral_programs
  FOR SELECT
  USING (status = 'active');

-- Referrals: referrer can see their own referrals
CREATE POLICY "referrals_referrer_read"
  ON referrals
  FOR SELECT
  USING (referrer_id = auth.uid());

-- Referrals: referee can see their own referral
CREATE POLICY "referrals_referee_read"
  ON referrals
  FOR SELECT
  USING (referee_id = auth.uid());

-- Rewards: recipient can see their own rewards
CREATE POLICY "referral_rewards_recipient_read"
  ON referral_rewards
  FOR SELECT
  USING (recipient_id = auth.uid());

-- Waitlist: user can see their own entry
CREATE POLICY "waitlist_entries_user_read"
  ON waitlist_entries
  FOR SELECT
  USING (user_id = auth.uid());

-- Admin write policies (venture admins only)
CREATE POLICY "referral_programs_admin_write"
  ON referral_programs
  FOR ALL
  USING (
    venture_id IN (
      SELECT venture_id FROM venture_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Fraud flags: admin-only access
CREATE POLICY "referral_fraud_flags_admin"
  ON referral_fraud_flags
  FOR ALL
  USING (
    venture_id IN (
      SELECT venture_id FROM venture_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Analytics: venture members can read
CREATE POLICY "referral_analytics_member_read"
  ON referral_analytics
  FOR SELECT
  USING (
    venture_id IN (
      SELECT venture_id FROM venture_members
      WHERE user_id = auth.uid()
    )
  );
```

---

## Code Examples

### 1 — Creating a Referral Program

Set up a standard referral program with double-sided rewards, custom qualifying action, milestones, and tiers.

```typescript
import { ReferralService } from '@mcv/growth/referrals';
import { createContext } from '@mcv/context';

const ctx = createContext({ ventureId: 'venture_01HXK...' });

// Create a standard referral program
const program = await ctx.get(ReferralService).createProgram(ctx.ventureId, {
  name: 'Refer a Friend — Get $20',
  slug: 'refer-friend-20',
  type: 'standard',

  // Referrer gets $20 credit per successful referral
  referrerReward: {
    type: 'credits',
    value: 20.00,
    currency: 'USD',
    description: 'Get $20 in account credits for every friend you refer',
  },

  // Referee gets 30% off their first purchase
  refereeReward: {
    type: 'discount_percent',
    value: 30,
    description: 'Your friend gets 30% off their first order',
  },

  // Reward triggers on first purchase over $25
  qualifyingAction: {
    type: 'purchase',
    minValue: 25.00,
    maxDaysAfterSignup: 30,
  },

  // Attribution: 30-day cookie, no override
  attribution: {
    cookieTtlDays: 30,
    lastClickOverride: false,
    maxClickToSignupHours: null,
  },

  // Fraud detection with custom weights
  fraudConfig: {
    enabledSignals: [
      'self_referral',
      'ip_match',
      'email_domain',
      'device_fingerprint',
      'velocity',
      'disposable_email',
    ],
    thresholds: {
      autoApprove: 25,
      holdForReview: 55,
      autoReject: 75,
    },
    signalWeights: {
      ip_match: 0.8,        // Lower weight — shared office IPs are common
      disposable_email: 1.5, // Higher weight — strong fraud signal
    },
    holdPeriodDays: 14,
  },

  // Branding
  branding: {
    primaryColor: '#4F46E5',
    logoUrl: 'https://cdn.example.com/logo.svg',
    shareCardTemplateId: null,
    landingPageTemplateId: null,
    shareMessages: {
      email: 'Hey! I love {{venture_name}} and thought you would too. Use my link to get 30% off your first order: {{referral_url}}',
      twitter: 'Loving @{{venture_handle}}! Get 30% off your first order with my referral link 👇 {{referral_url}}',
      copy_link: '{{referral_url}}',
    },
  },

  // Milestones — bonus rewards at specific counts
  milestones: [
    {
      count: 5,
      name: 'High Five!',
      bonusReward: { type: 'credits', value: 25, currency: 'USD', description: '$25 bonus' },
      badgeId: 'badge_high_five',
    },
    {
      count: 10,
      name: 'Perfect Ten',
      bonusReward: { type: 'credits', value: 50, currency: 'USD', description: '$50 bonus' },
      badgeId: 'badge_perfect_ten',
    },
    {
      count: 25,
      name: 'Quarter Century',
      bonusReward: { type: 'credits', value: 150, currency: 'USD', description: '$150 bonus' },
      badgeId: 'badge_quarter_century',
    },
    {
      count: 100,
      name: 'Centurion',
      bonusReward: { type: 'cash', value: 500, currency: 'USD', description: '$500 cash payout' },
      badgeId: 'badge_centurion',
    },
  ],

  // Tiers — increasing reward multipliers
  tiers: [
    { id: 'bronze', name: 'Bronze', minReferrals: 0, rewardMultiplier: 1.0, perks: ['Standard referral rewards'] },
    { id: 'silver', name: 'Silver', minReferrals: 10, rewardMultiplier: 1.25, perks: ['25% reward boost', 'Priority support'] },
    { id: 'gold', name: 'Gold', minReferrals: 25, rewardMultiplier: 1.5, perks: ['50% reward boost', 'Custom vanity code', 'Monthly top-referrer spotlight'] },
    { id: 'ambassador', name: 'Ambassador', minReferrals: 50, rewardMultiplier: 2.0, perks: ['Double rewards', 'Custom landing page', 'Direct account manager', 'Early access to new features'] },
  ],

  // Budget limits
  limits: {
    maxBudget: 50000.00,
    maxReferralsPerUser: 200,
    maxTotalReferrals: null, // unlimited
  },

  // Start immediately, no end date
  startsAt: new Date(),
  endsAt: null,
});

// Activate the program
await ctx.get(ReferralService).activateProgram(program.id);

console.log(`Program created: ${program.name} (${program.id})`);
console.log(`Status: ${program.status}`);
console.log(`Referrer reward: ${program.referrerReward.description}`);
console.log(`Referee reward: ${program.refereeReward.description}`);
```

### 2 — Generating and Sharing Referral Links

Create referral links with QR codes, vanity codes, and track share events.

```typescript
import { ReferralService } from '@mcv/growth/referrals';
import { createContext } from '@mcv/context';

const ctx = createContext({ ventureId: 'venture_01HXK...', userId: 'user_01ABC...' });
const svc = ctx.get(ReferralService);

// Generate a referral link for the current user
const link = await svc.createLink(program.id, ctx.userId, {
  destinationUrl: 'https://app.example.com/signup',
  utmParams: {
    source: 'referral',
    medium: 'link',
    campaign: 'refer-friend-20',
  },
});

console.log(`Referral URL: ${link.url}`);
// → https://ref.example.com/r/A7kX9mPq

// Set a vanity code
const updatedLink = await svc.updateLinkVanityCode(link.id, 'SARAH-LOVES-PIZZA');
console.log(`Vanity URL: https://ref.example.com/r/SARAH-LOVES-PIZZA`);

// Generate a QR code
const qrBuffer = await svc.generateQRCode(link.id, {
  size: 512,
  format: 'png',
  foregroundColor: '#4F46E5',
  backgroundColor: '#FFFFFF',
  logoUrl: 'https://cdn.example.com/logo-small.png',
  errorCorrection: 'H', // High — allows logo overlay
});

// Generate a shareable social card
const shareCardUrl = await svc.generateShareCard(link.id, {
  template: 'modern-gradient',
  headline: 'Sarah invited you!',
  subheadline: 'Get 30% off your first order',
  ctaText: 'Claim Your Discount →',
});

// Record share events for analytics
await svc.recordShare(link.id, 'email', {
  recipientCount: 5,
});

await svc.recordShare(link.id, 'twitter', {
  postId: '1234567890',
});

await svc.recordShare(link.id, 'whatsapp', {
  recipientCount: 3,
});

// Get all share events for this link
const shares = await svc.getShareEvents(link.id);
console.log(`Total shares: ${shares.length}`);
console.log(`Channels used: ${[...new Set(shares.map(s => s.channel))].join(', ')}`);
// → Channels used: email, twitter, whatsapp

// Bulk retrieve all links for a user
const allLinks = await svc.getLinksByUser(ctx.userId);
for (const l of allLinks) {
  console.log(`${l.code}: ${l.clickCount} clicks → ${l.signupCount} signups → ${l.conversionCount} conversions`);
}
```

### 3 — Processing a Referral Conversion

Track the full referral funnel from click through to reward issuance.

```typescript
import { ReferralService } from '@mcv/growth/referrals';
import { createContext } from '@mcv/context';

const ctx = createContext({ ventureId: 'venture_01HXK...' });
const svc = ctx.get(ReferralService);

// ── Step 1: Record click (called from referral redirect endpoint) ──
await svc.recordClick('A7kX9mPq', {
  ip: '203.0.113.42',
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)...',
  referer: 'https://twitter.com/',
  timestamp: new Date(),
});
// → Sets attribution cookie, records click event

// ── Step 2: Record signup (called from auth hook) ──
const referral = await svc.recordSignup('user_01NEW...', {
  referralCode: 'A7kX9mPq',
  ip: '203.0.113.42',
  deviceFingerprint: 'fp_abc123xyz',
  emailDomain: 'gmail.com',
});

console.log(`Referral created: ${referral.id}`);
console.log(`Status: ${referral.status}`);       // → 'signed_up'
console.log(`Fraud status: ${referral.fraudStatus}`); // → 'clean' or 'suspect'
console.log(`Fraud score: ${referral.fraudScore}`);   // → 12

// ── Step 3: Record qualifying action (called from order completion hook) ──
const convertedReferral = await svc.recordQualifyingAction(referral.id, {
  type: 'purchase',
  value: 89.99,
  orderId: 'order_01XYZ...',
  timestamp: new Date(),
});

console.log(`Status: ${convertedReferral.status}`); // → 'converted'

// ── Step 4: Issue rewards (triggered automatically or manually) ──
if (convertedReferral.fraudStatus === 'clean' || convertedReferral.fraudStatus === 'suspect') {
  const { referrerReward, refereeReward } = await svc.issueRewards(referral.id);

  console.log(`Referrer reward: ${referrerReward.rewardType} — $${referrerReward.finalValue}`);
  console.log(`Referrer reward status: ${referrerReward.status}`); // → 'pending'
  console.log(`Hold expires: ${referrerReward.holdExpiresAt}`);    // → 14 days from now

  console.log(`Referee reward: ${refereeReward.rewardType} — ${refereeReward.finalValue}%`);
  console.log(`Referee reward status: ${refereeReward.status}`);   // → 'pending'
}

// ── Step 5: After hold period — approve and fulfill ──
// (Typically done by a scheduled worker)
const pendingRewards = await svc.getRewardsByUser(referral.referrerId, {
  status: 'pending',
  holdExpired: true,
});

for (const reward of pendingRewards.items) {
  const approved = await svc.approveReward(reward.id);
  console.log(`Reward ${approved.id} approved → fulfillment: ${approved.fulfillmentRef}`);
}

// ── Handle refund scenario: clawback ──
// If the order is refunded during the hold period:
await svc.clawbackReward(referrerReward.id, 'Order refunded — order_01XYZ');
// → Reward status: 'clawed_back'
// → Publishes ReferralRewardClawbackEvent
```

### 4 — Anti-Fraud Evaluation

Run the fraud detection pipeline and handle flagged referrals.

```typescript
import { ReferralService, evaluateFraudSignals } from '@mcv/growth/referrals';
import { createContext } from '@mcv/context';

const ctx = createContext({ ventureId: 'venture_01HXK...' });
const svc = ctx.get(ReferralService);

// ── Evaluate fraud on a referral ──
const fraudCheck = await svc.evaluateFraud('referral_01ABC...', {
  // Referrer context
  referrer: {
    userId: 'user_01REF...',
    signupIp: '203.0.113.10',
    email: 'sarah@gmail.com',
    deviceFingerprint: 'fp_sarah_main',
    accountAge: 180, // days
  },
  // Referee context
  referee: {
    userId: 'user_01NEW...',
    signupIp: '203.0.113.10', // Same IP!
    email: 'john@gmail.com',
    deviceFingerprint: 'fp_different_device',
    accountAge: 0,
  },
  // Click context
  click: {
    ip: '203.0.113.10',
    userAgent: 'Mozilla/5.0...',
    referer: null,
    timestamp: new Date('2025-02-08T10:00:00Z'),
  },
  // Signup context
  signup: {
    ip: '203.0.113.10',
    timestamp: new Date('2025-02-08T10:05:00Z'), // 5 min after click
  },
  // Historical context
  referrerHistory: {
    totalReferrals: 8,
    referralsLast24h: 3,
    referralsLastHour: 1,
    uniqueIpsReferred: 6,
    fraudFlagsCount: 0,
  },
});

console.log('Fraud check results:');
console.log(`  Total score: ${fraudCheck.totalScore}`);
console.log(`  Decision: ${fraudCheck.decision}`);
console.log('  Signals:');
for (const signal of fraudCheck.signals) {
  console.log(`    ${signal.signal}: score=${signal.score}, weight=${signal.weight}, weighted=${signal.weightedScore}`);
  console.log(`      Reason: ${signal.reason}`);
}

// Example output:
// Fraud check results:
//   Total score: 42
//   Decision: hold
//   Signals:
//     self_referral: score=0, weight=1.0, weighted=0
//       Reason: Different user accounts
//     ip_match: score=60, weight=0.8, weighted=48
//       Reason: Referrer and referee share IP 203.0.113.10
//     email_domain: score=0, weight=1.0, weighted=0
//       Reason: Both use gmail.com (common provider, not flagged)
//     device_fingerprint: score=0, weight=1.0, weighted=0
//       Reason: Different device fingerprints
//     velocity: score=0, weight=1.0, weighted=0
//       Reason: 3 referrals in 24h (within limits)
//     disposable_email: score=0, weight=1.5, weighted=0
//       Reason: gmail.com is not a disposable email domain

// ── Review flagged referrals ──
const pendingReviews = await svc.getPendingFraudReviews(ctx.ventureId);
console.log(`${pendingReviews.total} referrals pending fraud review`);

for (const review of pendingReviews.items) {
  // Admin reviews the evidence and makes a decision
  if (review.totalScore < 50 && review.signals.every(s => s.signal !== 'self_referral')) {
    // Looks like a false positive — same household, different people
    await svc.reviewFraudFlag(review.id, 'approve', 'Same household IP — legitimate referral confirmed via support ticket');
  } else {
    await svc.reviewFraudFlag(review.id, 'reject', 'Multiple fraud signals — accounts appear coordinated');
  }
}

// ── Standalone fraud signal evaluation (utility) ──
const signals = evaluateFraudSignals({
  referrerIp: '203.0.113.10',
  refereeIp: '203.0.113.10',
  referrerEmail: 'user1@tempmail.xyz',
  refereeEmail: 'user2@tempmail.xyz',
  referrerFingerprint: 'fp_abc',
  refereeFingerprint: 'fp_abc', // Same fingerprint!
  clickToSignupSeconds: 15,     // Suspiciously fast
  referralsLastHour: 12,        // High velocity
}, {
  enabledSignals: ['ip_match', 'device_fingerprint', 'velocity', 'disposable_email', 'timing_anomaly'],
  signalWeights: {},
});

console.log('Standalone evaluation:');
for (const s of signals) {
  if (s.score > 0) {
    console.log(`  ⚠️ ${s.signal}: ${s.reason} (score: ${s.score})`);
  }
}
// → ⚠️ ip_match: Same IP address for referrer and referee (score: 60)
// → ⚠️ device_fingerprint: Identical device fingerprint (score: 70)
// → ⚠️ disposable_email: Both emails use disposable domain tempmail.xyz (score: 40)
// → ⚠️ timing_anomaly: Click to signup in 15 seconds (suspiciously fast) (score: 45)
// → ⚠️ velocity: 12 referrals in last hour exceeds threshold of 10 (score: 50)
```

### 5 — Milestone and Tier Management

Track referrer progress through milestones and tier promotions.

```typescript
import { ReferralService } from '@mcv/growth/referrals';
import { createContext } from '@mcv/context';

const ctx = createContext({ ventureId: 'venture_01HXK...' });
const svc = ctx.get(ReferralService);
const userId = 'user_01REF...';
const programId = 'program_01ABC...';

// ── Check milestone progress ──
const progress = await svc.getMilestoneProgress(userId, programId);

for (const milestone of progress) {
  const status = milestone.reached ? '✅' : '⬜';
  const progressBar = milestone.reached
    ? 'COMPLETE'
    : `${milestone.currentCount}/${milestone.threshold}`;

  console.log(`${status} ${milestone.name} — ${progressBar}`);
}

// Example output:
// ✅ High Five! — COMPLETE
// ⬜ Perfect Ten — 8/10
// ⬜ Quarter Century — 8/25
// ⬜ Centurion — 8/100

// ── After a new conversion, check for newly reached milestones ──
const newMilestones = await svc.checkMilestones(userId, programId);

for (const milestone of newMilestones) {
  console.log(`🎉 Milestone reached: ${milestone.name}!`);
  console.log(`   Referral count: ${milestone.referralCountAtMilestone}`);
  console.log(`   Bonus reward: ${milestone.bonusRewardId}`);
  if (milestone.badgeId) {
    console.log(`   Badge unlocked: ${milestone.badgeId}`);
  }
}

// ── Evaluate tier promotion ──
const promotion = await svc.evaluateTierPromotion(userId, programId);

if (promotion) {
  console.log(`🏆 Tier promotion: ${promotion.name}!`);
  console.log(`   New multiplier: ${promotion.rewardMultiplier}x`);
  console.log(`   Perks: ${promotion.perks.join(', ')}`);
}

// ── Get current tier status ──
const tierStatus = await svc.getTierStatus(userId, programId);

console.log(`Current tier: ${tierStatus.name} (${tierStatus.rewardMultiplier}x rewards)`);
console.log(`Lifetime referrals: ${tierStatus.lifetimeReferrals}`);
if (tierStatus.nextTierName) {
  console.log(`Next tier: ${tierStatus.nextTierName} (${tierStatus.nextTierThreshold} referrals)`);
  console.log(`Progress: ${(tierStatus.progressToNextTier * 100).toFixed(0)}%`);
} else {
  console.log(`You're at the highest tier! 🎖️`);
}

// Example output:
// Current tier: Silver (1.25x rewards)
// Lifetime referrals: 12
// Next tier: Gold (25 referrals)
// Progress: 48%

// ── Reward calculation with tier multiplier ──
// When issuing rewards, the tier multiplier is applied automatically:
// Base reward: $20.00
// Silver multiplier: 1.25x
// Final reward: $25.00
```

### 6 — Waitlist with Referral Priority

Create a pre-launch referral waitlist where users earn priority access by referring friends.

```typescript
import { ReferralService, WaitlistService } from '@mcv/growth/referrals';
import { createContext } from '@mcv/context';

const ctx = createContext({ ventureId: 'venture_01HXK...' });
const svc = ctx.get(ReferralService);
const waitlistSvc = ctx.get(WaitlistService);

// ── Create a waitlist program ──
const waitlistProgram = await svc.createProgram(ctx.ventureId, {
  name: 'Early Access Waitlist',
  slug: 'early-access',
  type: 'waitlist',

  // Referrer reward: move up 10 positions per referral
  referrerReward: {
    type: 'custom',
    value: 10, // positions gained
    customRewardId: 'waitlist_position_boost',
    description: 'Move up 10 spots for every friend you invite',
  },

  // Referee reward: priority over non-referred signups
  refereeReward: {
    type: 'custom',
    value: 5, // initial position boost
    customRewardId: 'waitlist_initial_boost',
    description: 'Start 5 spots ahead of non-referred signups',
  },

  qualifyingAction: {
    type: 'signup', // Reward on signup (no purchase needed for waitlist)
  },

  attribution: {
    cookieTtlDays: 90, // Longer window for pre-launch
    lastClickOverride: false,
    maxClickToSignupHours: null,
  },

  fraudConfig: {
    enabledSignals: ['self_referral', 'email_domain', 'device_fingerprint', 'velocity', 'disposable_email'],
    thresholds: { autoApprove: 29, holdForReview: 60, autoReject: 80 },
    signalWeights: { disposable_email: 2.0 }, // Extra strict on disposable emails
    holdPeriodDays: 0, // Instant reward for waitlist position
  },

  branding: {
    primaryColor: '#8B5CF6',
    logoUrl: null,
    shareCardTemplateId: null,
    landingPageTemplateId: null,
    shareMessages: {
      email: "I just joined the {{venture_name}} waitlist! Join with my link and we both skip ahead: {{referral_url}}",
      twitter: "Just secured my spot on the @{{venture_handle}} waitlist 🚀 Skip the line with my invite: {{referral_url}}",
    },
  },

  milestones: [],
  tiers: [],
  limits: { maxBudget: null, maxReferralsPerUser: null, maxTotalReferrals: null },
  startsAt: new Date(),
  endsAt: null,
});

await svc.activateProgram(waitlistProgram.id);

// ── User joins waitlist directly ──
const entry1 = await waitlistSvc.joinWaitlist(waitlistProgram.id, 'user_01AAA...', undefined);
console.log(`Position: #${entry1.position}`);           // → Position: #1
console.log(`Referral link: ${entry1.referralLink.url}`); // → https://ref.example.com/r/XyZ12345

// ── User joins waitlist via referral ──
const entry2 = await waitlistSvc.joinWaitlist(waitlistProgram.id, 'user_01BBB...', 'XyZ12345');
console.log(`Position: #${entry2.position}`);             // → Position: #2 (but with priority boost)
console.log(`Referred by: ${entry2.referredByUserId}`);   // → user_01AAA...

// Entry1 (referrer) moves up
const updatedEntry1 = await waitlistSvc.getWaitlistEntry('user_01AAA...', waitlistProgram.id);
console.log(`Referrer new position: #${updatedEntry1!.position}`);  // → improved
console.log(`Referrals: ${updatedEntry1!.referralCount}`);           // → 1
console.log(`Positions gained: ${updatedEntry1!.positionsGained}`);  // → 10

// ── Check waitlist position ──
const position = await waitlistSvc.getWaitlistPosition(entry2.id);
console.log(`Your position: #${position} of ${(await waitlistSvc.getWaitlistStats(waitlistProgram.id)).totalEntries}`);

// ── Promote top users from waitlist (launch day!) ──
const promoted = await waitlistSvc.promoteFromWaitlist(waitlistProgram.id, 100);
console.log(`Promoted ${promoted.length} users from the waitlist!`);

for (const entry of promoted) {
  console.log(`  Promoted: ${entry.userId} (was #${entry.position}, ${entry.referralCount} referrals)`);
  // → Sends promotion notification email
  // → Grants early access
}

// ── Waitlist statistics ──
const stats = await waitlistSvc.getWaitlistStats(waitlistProgram.id);
console.log(`Total entries: ${stats.totalEntries}`);
console.log(`Active: ${stats.activeEntries}`);
console.log(`Promoted: ${stats.promotedEntries}`);
console.log(`Avg referrals per entry: ${stats.avgReferralsPerEntry.toFixed(1)}`);
console.log('Referral distribution:');
for (const bucket of stats.referralDistribution) {
  console.log(`  ${bucket.referralCount} referrals: ${bucket.entryCount} users`);
}
```

### 7 — Referral Analytics Dashboard

Retrieve and display comprehensive referral analytics.

```typescript
import { ReferralService } from '@mcv/growth/referrals';
import { createContext } from '@mcv/context';

const ctx = createContext({ ventureId: 'venture_01HXK...' });
const svc = ctx.get(ReferralService);
const programId = 'program_01ABC...';

const dateRange = {
  from: new Date('2025-01-01'),
  to: new Date('2025-02-01'),
};

// ── Full analytics snapshot ──
const analytics = await svc.getAnalytics(programId, {
  dateRange,
  includeTimeSeries: true,
  includeChannelBreakdown: true,
  includeTopReferrers: true,
  topReferrersLimit: 10,
});

// Viral metrics
console.log('📈 Viral Metrics:');
console.log(`  K-factor: ${analytics.viral.kFactor.toFixed(3)}`);
console.log(`  K-factor trend: ${analytics.viral.kFactorTrend > 0 ? '↑' : '↓'} ${analytics.viral.kFactorTrend.toFixed(3)}`);
console.log(`  Avg referrals/user: ${analytics.viral.avgReferralsPerUser.toFixed(1)}`);
console.log(`  Virality rate: ${(analytics.viral.viralityRate * 100).toFixed(1)}%`);

// Funnel metrics
console.log('\n🔄 Conversion Funnel:');
console.log(`  Clicks:      ${analytics.funnel.totalClicks.toLocaleString()}`);
console.log(`  Signups:     ${analytics.funnel.totalSignups.toLocaleString()} (${(analytics.funnel.clickToSignupRate * 100).toFixed(1)}%)`);
console.log(`  Conversions: ${analytics.funnel.totalConversions.toLocaleString()} (${(analytics.funnel.signupToConversionRate * 100).toFixed(1)}%)`);
console.log(`  Rewards:     ${analytics.funnel.totalRewardsIssued.toLocaleString()}`);
console.log(`  Overall:     ${(analytics.funnel.overallConversionRate * 100).toFixed(2)}%`);

// Financial metrics
console.log('\n💰 Financial:');
console.log(`  Reward value issued: $${analytics.financial.totalRewardValue.toLocaleString()}`);
console.log(`  Reward value paid:   $${analytics.financial.totalRewardPaid.toLocaleString()}`);
console.log(`  Clawed back:         $${analytics.financial.totalClawedBack.toLocaleString()}`);
console.log(`  Avg reward/conversion: $${analytics.financial.avgRewardPerConversion.toFixed(2)}`);
console.log(`  Cost per acquisition:  $${analytics.financial.costPerAcquisition.toFixed(2)}`);
if (analytics.financial.remainingBudget !== null) {
  console.log(`  Budget remaining:    $${analytics.financial.remainingBudget.toLocaleString()} (${(analytics.financial.budgetUtilization! * 100).toFixed(0)}% used)`);
}

// Fraud metrics
console.log('\n🛡️ Fraud:');
console.log(`  Flagged:  ${analytics.fraud.totalFlagged}`);
console.log(`  Blocked:  ${analytics.fraud.totalBlocked}`);
console.log(`  Fraud rate: ${(analytics.fraud.fraudRate * 100).toFixed(2)}%`);
console.log(`  Pending reviews: ${analytics.fraud.pendingReviews}`);
console.log('  Top signals:');
for (const sig of analytics.fraud.topSignals.slice(0, 5)) {
  console.log(`    ${sig.signal}: ${sig.count} (${(sig.percentage * 100).toFixed(0)}%)`);
}

// Channel breakdown
console.log('\n📱 Channel Performance:');
for (const ch of analytics.channels.sort((a, b) => b.conversions - a.conversions)) {
  console.log(`  ${ch.channel.padEnd(12)} | shares: ${ch.shareCount} | clicks: ${ch.clicks} | signups: ${ch.signups} | conv: ${ch.conversions} (${(ch.conversionRate * 100).toFixed(1)}%)`);
}

// Top referrers
console.log('\n🏆 Top Referrers:');
for (const [i, ref] of analytics.referrers.topReferrers.entries()) {
  console.log(`  ${i + 1}. ${ref.displayName} — ${ref.conversionCount} conversions, $${ref.rewardEarned.toFixed(2)} earned ${ref.tier ? `[${ref.tier}]` : ''}`);
}

// ── Viral metrics deep dive ──
const viral = await svc.getViralMetrics(programId, dateRange);
console.log(`\n🌊 Viral Coefficient Details:`);
console.log(`  K = invites_per_user × conversion_rate`);
console.log(`  K = ${viral.avgReferralsPerUser.toFixed(2)} × ${(viral.overallConversionRate * 100).toFixed(1)}%`);
console.log(`  K = ${viral.kFactor.toFixed(3)}`);
console.log(`  ${viral.kFactor >= 1 ? '🚀 VIRAL! (K ≥ 1)' : `📊 Sub-viral (need K ≥ 1, currently ${((1 - viral.kFactor) * 100).toFixed(0)}% short)`}`);

// ── Conversion funnel detail ──
const funnel = await svc.getConversionFunnel(programId, dateRange);
for (const step of funnel) {
  const dropoff = step.dropoffRate ? ` (${(step.dropoffRate * 100).toFixed(1)}% dropoff)` : '';
  console.log(`  ${step.name}: ${step.count.toLocaleString()}${dropoff}`);
}
```

### 8 — Ambassador Program Workflow

Manage an ambassador program with applications, approvals, custom landing pages, and enhanced tracking.

```typescript
import { ReferralService, AmbassadorService } from '@mcv/growth/referrals';
import { createContext } from '@mcv/context';

const ctx = createContext({ ventureId: 'venture_01HXK...' });
const svc = ctx.get(ReferralService);
const ambassadorSvc = ctx.get(AmbassadorService);

// ── User applies for ambassador program ──
const application = await ambassadorSvc.applyForAmbassador(
  'user_01TOP...',
  'program_01ABC...',
  {
    displayName: 'Sarah Tech Reviews',
    bio: 'Tech reviewer with 50K+ followers across platforms. I genuinely love this product and want to share it with my audience.',
    avatarUrl: 'https://cdn.example.com/avatars/sarah.jpg',
    socialLinks: {
      twitter: 'https://twitter.com/sarahtechreviews',
      youtube: 'https://youtube.com/@sarahtechreviews',
      website: 'https://sarahtechreviews.com',
    },
    motivation: 'I have been using the product for 6 months and my audience frequently asks for my referral link.',
    audience: 'Tech enthusiasts aged 25-45, primarily in North America',
    channels: ['twitter', 'youtube', 'email', 'website'],
    estimatedReach: 50000,
  },
);

console.log(`Application status: ${application.status}`); // → 'applied'

// ── Admin reviews and approves ambassador ──
const approved = await ambassadorSvc.approveAmbassador('user_01TOP...', 'program_01ABC...');

console.log(`Ambassador approved: ${approved.displayName}`);
console.log(`Tier: ${approved.tier.name} (${approved.tier.rewardMultiplier}x)`);
console.log(`Landing page: https://ref.example.com/a/${approved.landingPageSlug}`);
console.log(`Referral link: ${approved.referralLink.url}`);

// ── Ambassador dashboard data ──
const profile = await ambassadorSvc.getAmbassadorProfile('user_01TOP...', 'program_01ABC...');

if (profile) {
  console.log('\n🌟 Ambassador Dashboard:');
  console.log(`  Status: ${profile.status}`);
  console.log(`  Tier: ${profile.tier.name}`);
  console.log(`  Total referrals: ${profile.stats.totalReferrals}`);
  console.log(`  Conversions: ${profile.stats.totalConversions}`);
  console.log(`  Conversion rate: ${(profile.stats.conversionRate * 100).toFixed(1)}%`);
  console.log(`  Total earned: $${profile.stats.totalRewardEarned.toFixed(2)}`);
  console.log(`  Avg per referral: $${profile.stats.avgRewardPerReferral.toFixed(2)}`);

  // Tier progress
  if (profile.tier.nextTierName) {
    console.log(`\n  Next tier: ${profile.tier.nextTierName}`);
    console.log(`  Progress: ${profile.tier.lifetimeReferrals}/${profile.tier.nextTierThreshold}`);
    console.log(`  ${(profile.tier.progressToNextTier * 100).toFixed(0)}% complete`);
  }
}

// ── List all ambassadors for the program ──
const ambassadors = await ambassadorSvc.listAmbassadors('program_01ABC...', {
  status: 'approved',
  sortBy: 'totalConversions',
  sortOrder: 'desc',
  limit: 20,
});

console.log('\n📋 Ambassador Leaderboard:');
for (const [i, amb] of ambassadors.items.entries()) {
  console.log(`  ${(i + 1).toString().padStart(2)}. ${amb.displayName.padEnd(25)} | ${amb.stats.totalConversions} conv | $${amb.stats.totalRewardEarned.toFixed(2)} earned | ${amb.tier.name}`);
}

// ── Suspend an ambassador for policy violation ──
// await ambassadorSvc.suspendAmbassador('user_01BAD...', 'program_01ABC...', 'Spam complaints from referred users');

// ── Reject an application ──
// await ambassadorSvc.rejectAmbassador('user_01NEW...', 'program_01ABC...', 'Insufficient audience reach — reapply when you have 10K+ followers');
```

---

## Error Codes

All errors follow the MCV.ONE error format with the `REFERRAL_` prefix:

| Code | HTTP | Description |
|------|------|-------------|
| `REFERRAL_PROGRAM_NOT_FOUND` | 404 | The specified referral program does not exist or is not accessible to the current venture. |
| `REFERRAL_PROGRAM_INACTIVE` | 409 | The program is not in `active` status. Operations require an active program. |
| `REFERRAL_PROGRAM_ENDED` | 409 | The program's `endsAt` date has passed. No new referrals or links can be created. |
| `REFERRAL_PROGRAM_BUDGET_EXHAUSTED` | 409 | The program's reward budget has been fully consumed. No new rewards can be issued. |
| `REFERRAL_LINK_NOT_FOUND` | 404 | The specified referral link or code does not exist. |
| `REFERRAL_LINK_INACTIVE` | 409 | The referral link has been deactivated by the owner or an admin. |
| `REFERRAL_LINK_DUPLICATE_VANITY` | 409 | The requested vanity code is already taken within this program. |
| `REFERRAL_LINK_VANITY_INVALID` | 400 | The vanity code contains invalid characters. Must be alphanumeric with hyphens, 3-50 chars. |
| `REFERRAL_NOT_FOUND` | 404 | The specified referral record does not exist. |
| `REFERRAL_ALREADY_EXISTS` | 409 | A referral already exists for this referee in this program. Users can only be referred once per program. |
| `REFERRAL_SELF_REFERRAL` | 403 | The referrer and referee are the same user. Self-referrals are always blocked. |
| `REFERRAL_EXPIRED` | 410 | The referral attribution has expired (click-to-signup time exceeded). |
| `REFERRAL_MAX_PER_USER` | 429 | The referrer has reached the maximum number of referrals allowed per user for this program. |
| `REFERRAL_QUALIFYING_ACTION_NOT_MET` | 400 | The reported action does not meet the program's qualifying action criteria (e.g., purchase below minimum). |
| `REFERRAL_FRAUD_BLOCKED` | 403 | The referral was blocked by the fraud detection pipeline. |
| `REFERRAL_FRAUD_HELD` | 202 | The referral has been flagged for manual review. Rewards are held pending review. |
| `REFERRAL_REWARD_NOT_FOUND` | 404 | The specified reward record does not exist. |
| `REFERRAL_REWARD_ALREADY_APPROVED` | 409 | The reward has already been approved and cannot be modified. |
| `REFERRAL_REWARD_ALREADY_PAID` | 409 | The reward has already been fulfilled/paid and cannot be clawed back through the standard flow. |
| `REFERRAL_REWARD_HOLD_ACTIVE` | 409 | The reward is still in its hold period and cannot be approved yet. Wait until `holdExpiresAt`. |
| `REFERRAL_REWARD_CLAWBACK_FAILED` | 500 | The reward clawback failed during fulfillment reversal. Manual intervention required. |
| `REFERRAL_REWARD_FULFILLMENT_FAILED` | 502 | The downstream fulfillment provider (credits, payouts, coupons) returned an error. |
| `REFERRAL_WAITLIST_ALREADY_JOINED` | 409 | The user has already joined this waitlist. Each user can only have one entry per waitlist program. |
| `REFERRAL_WAITLIST_NOT_FOUND` | 404 | The specified waitlist entry does not exist. |
| `REFERRAL_WAITLIST_PROGRAM_REQUIRED` | 400 | Waitlist operations require a program of type `waitlist`. |
| `REFERRAL_WAITLIST_CLOSED` | 409 | The waitlist is no longer accepting new entries (program paused or archived). |
| `REFERRAL_AMBASSADOR_ALREADY_APPLIED` | 409 | The user has already submitted an ambassador application for this program. |
| `REFERRAL_AMBASSADOR_NOT_FOUND` | 404 | No ambassador profile found for this user in the specified program. |
| `REFERRAL_AMBASSADOR_NOT_ELIGIBLE` | 403 | The user does not meet the minimum requirements for the ambassador program (e.g., minimum referral count, account age). |
| `REFERRAL_AMBASSADOR_SUSPENDED` | 403 | The ambassador account has been suspended. Contact support for reinstatement. |
| `REFERRAL_SLUG_TAKEN` | 409 | The program slug is already in use within this venture. Choose a different slug. |
| `REFERRAL_CODE_GENERATION_FAILED` | 500 | Failed to generate a unique referral code after maximum retry attempts. |
| `REFERRAL_QR_GENERATION_FAILED` | 500 | QR code generation failed. Check image processing service availability. |
| `REFERRAL_SHARE_CARD_FAILED` | 500 | Share card image generation failed. Check template configuration and rendering service. |
| `REFERRAL_ANALYTICS_RANGE_TOO_LARGE` | 400 | The requested date range exceeds the maximum allowed (365 days). Narrow the range. |
| `REFERRAL_RATE_LIMITED` | 429 | Too many referral API requests. Back off and retry with exponential delay. |

---

## Security

### Multi-Tenant Isolation

All referral data is strictly isolated by venture through PostgreSQL Row-Level Security (RLS). Every table includes a `venture_id` column that is checked against the authenticated user's venture membership.

**Venture boundary enforcement:**
- A referral link from Venture A cannot generate referrals in Venture B, even if the URL is shared across ventures.
- Analytics queries are automatically scoped to the requesting venture.
- Fraud flags and reviews are only visible to admins of the owning venture.
- Ambassador profiles are scoped to the program's venture.

**Service-level enforcement:**
- All service methods receive the venture context from the authenticated session.
- Database queries include `venture_id` in WHERE clauses as a defense-in-depth measure beyond RLS.
- Cross-venture operations are explicitly rejected at the service layer before reaching the database.

### Fraud Prevention Layers

The module implements defense-in-depth fraud prevention:

**Layer 1 — Input Validation (Immediate)**
- Self-referral detection: referrer and referee user IDs are compared before any record is created.
- Code/link validation: invalid, expired, or deactivated codes are rejected at the click handler.
- Rate limiting: per-IP and per-user limits on link creation, click recording, and signup attribution.

**Layer 2 — Signal-Based Scoring (At Signup)**
- IP address comparison between referrer and referee.
- Email domain analysis (disposable domains, corporate domain clustering).
- Device fingerprint comparison.
- Click-to-signup timing analysis.

**Layer 3 — Behavioral Analysis (At Conversion)**
- Velocity checks: referrals per hour/day/week thresholds.
- Geographic impossibility: referrer location vs. referee location with time constraints.
- VPN/proxy detection via IP reputation databases.
- Behavioral pattern matching: bot-like navigation, instant form completion.

**Layer 4 — Manual Review (Post-Flag)**
- Flagged referrals are queued for human review with full evidence display.
- Reviewers can approve (false positive), reject (confirmed fraud), or escalate.
- Rejected referrals trigger automatic reward clawback and account flagging.

**Layer 5 — Retrospective Analysis (Periodic)**
- Batch analysis of referral patterns across the entire program.
- Network graph analysis to detect referral rings.
- Anomaly detection on conversion timing distributions.
- Cross-program fraud correlation for repeat offenders.

### Data Protection

**PII Handling:**
- Referral click data (IP addresses, user agents) is stored with a configurable retention period (default: 90 days).
- After retention, click metadata is aggregated and PII fields are purged.
- Email addresses in waitlist entries are stored encrypted at rest.
- Share event recipient identifiers are hashed (SHA-256) before storage — the module never stores plaintext recipient emails/phones.

**Device Fingerprints:**
- Device fingerprints are computed client-side and transmitted as opaque hashes.
- The module stores fingerprint hashes for comparison but cannot reverse them to identify hardware.
- Fingerprint data is purged on account deletion per GDPR right-to-erasure.

**Data Access:**
- Referrers can see their own referral list (referee display name, status, reward) but not referee PII.
- Referees can see that they were referred and by whom (referrer display name) but not the referrer's other referrals.
- Admins can see full referral data including fraud signals for their venture.
- Analytics data is pre-aggregated — individual referral details are not exposed through analytics endpoints.

### Rate Limiting

| Endpoint | Limit | Window | Scope |
|----------|-------|--------|-------|
| Create referral link | 10 | per hour | per user |
| Record click | 100 | per minute | per IP |
| Record signup | 20 | per minute | per IP |
| Record conversion | 50 | per minute | per venture |
| Create program | 5 | per hour | per venture |
| Generate QR code | 30 | per hour | per user |
| Generate share card | 10 | per hour | per user |
| Analytics query | 60 | per minute | per venture |
| Fraud review | 100 | per minute | per venture |
| Waitlist join | 30 | per minute | per IP |
| Ambassador apply | 3 | per day | per user |

Rate limits are enforced at the tRPC middleware layer and return `REFERRAL_RATE_LIMITED` when exceeded.

### Reward Security

**Double-spend prevention:**
- Rewards are issued through atomic database transactions with uniqueness constraints on `(referral_id, recipient_type)`.
- The `issueRewards` method uses `SELECT ... FOR UPDATE` to prevent concurrent reward issuance for the same referral.

**Budget enforcement:**
- Program budget checks use `SELECT ... FOR UPDATE` on the program row to prevent race conditions.
- Budget is decremented atomically when rewards are created, not when they are approved.
- If budget is insufficient for both rewards, neither is created (all-or-nothing).

**Clawback safety:**
- Only rewards in `pending` or `approved` status can be clawed back.
- `paid` rewards require a separate refund/reversal flow through the fulfillment provider.
- All clawback operations are logged with reason, timestamp, and operator ID for audit.

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `REFERRAL_BASE_URL` | Yes | — | Base URL for referral links (e.g., `https://ref.example.com`). Must be a valid HTTPS URL. |
| `REFERRAL_CODE_LENGTH` | No | `8` | Length of auto-generated referral codes. Range: 6-16. |
| `REFERRAL_CODE_ALPHABET` | No | `ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789` | Characters used for code generation (excludes ambiguous: 0/O, 1/l/I). |
| `REFERRAL_COOKIE_NAME` | No | `_mcv_ref` | Name of the first-party attribution cookie set on click. |
| `REFERRAL_COOKIE_DOMAIN` | No | (auto) | Domain for the attribution cookie. Defaults to the referral base URL domain. |
| `REFERRAL_DEFAULT_COOKIE_TTL_DAYS` | No | `30` | Default cookie TTL when not specified per-program. |
| `REFERRAL_CLICK_REDIRECT_DELAY_MS` | No | `0` | Delay in milliseconds before redirecting after click tracking. 0 = immediate. |
| `REFERRAL_FRAUD_ENABLED` | No | `true` | Global toggle for fraud detection. Set to `false` to disable all fraud checks. |
| `REFERRAL_FRAUD_DISPOSABLE_EMAIL_LIST_URL` | No | (built-in) | URL to fetch disposable email domain list. Updated daily. |
| `REFERRAL_FRAUD_IP_REPUTATION_API_KEY` | No | — | API key for IP reputation service (VPN/proxy detection). If unset, VPN detection is disabled. |
| `REFERRAL_FRAUD_IP_REPUTATION_URL` | No | — | Endpoint URL for IP reputation lookups. |
| `REFERRAL_HOLD_PERIOD_DAYS` | No | `14` | Default hold period for rewards before auto-approval. |
| `REFERRAL_REWARD_AUTO_APPROVE` | No | `true` | Whether rewards automatically transition from `pending` to `approved` after hold period. |
| `REFERRAL_REWARD_AUTO_FULFILL` | No | `true` | Whether approved rewards automatically trigger fulfillment (credit/payout/coupon creation). |
| `REFERRAL_QR_SERVICE_URL` | No | (built-in) | URL for QR code generation service. Falls back to built-in `qrcode` library. |
| `REFERRAL_SHARE_CARD_SERVICE_URL` | No | — | URL for share card image generation service (e.g., Puppeteer/Playwright renderer). |
| `REFERRAL_ANALYTICS_AGGREGATION_CRON` | No | `0 2 * * *` | Cron schedule for daily analytics aggregation worker. Default: 2:00 AM UTC. |
| `REFERRAL_ANALYTICS_RETENTION_DAYS` | No | `730` | Number of days to retain daily analytics snapshots. Default: 2 years. |
| `REFERRAL_CLICK_DATA_RETENTION_DAYS` | No | `90` | Number of days to retain PII in click data before purging. |
| `REFERRAL_REDPANDA_TOPIC_PREFIX` | No | `growth.referrals` | Prefix for Redpanda topic names. |
| `REFERRAL_WAITLIST_POSITION_BOOST` | No | `10` | Default positions gained per referral in waitlist programs. |
| `REFERRAL_MAX_VANITY_CODE_LENGTH` | No | `50` | Maximum length for vanity referral codes. |
| `REFERRAL_MIN_VANITY_CODE_LENGTH` | No | `3` | Minimum length for vanity referral codes. |

---

## Dependencies

### Internal Dependencies

| Package | Purpose |
|---------|---------|
| `@mcv/db` | Drizzle ORM client, connection pooling, migration utilities |
| `@mcv/auth` | User authentication, session management, JWT verification |
| `@mcv/context` | Request context propagation (venture ID, user ID, permissions) |
| `@mcv/trpc` | tRPC router creation, middleware, error handling |
| `@mcv/events` | Redpanda event publishing and consumption |
| `@mcv/growth/rewards` | Reward fulfillment for points-based rewards |
| `@mcv/billing/credits` | Credit issuance for credit-based rewards |
| `@mcv/billing/payouts` | Cash payout processing for cash rewards |
| `@mcv/commerce/coupons` | Discount coupon generation for discount rewards |
| `@mcv/storage` | Asset storage for QR codes and share card images |
| `@mcv/notifications` | Email/SMS/push notifications for reward issuance, milestone alerts |
| `@mcv/rate-limit` | API rate limiting middleware |
| `@mcv/observability` | Structured logging, tracing, metrics |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `drizzle-orm` | `^0.30.0` | SQL query builder and schema definition |
| `zod` | `^3.22.0` | Runtime schema validation for API inputs |
| `nanoid` | `^5.0.0` | Secure, URL-friendly unique ID generation for referral codes |
| `qrcode` | `^1.5.0` | QR code image generation (fallback when no external service) |
| `sharp` | `^0.33.0` | Image processing for share card generation and QR code customization |
| `ua-parser-js` | `^1.0.0` | User-Agent string parsing for device fingerprint component |
| `geoip-lite` | `^1.4.0` | IP-to-geolocation resolution for fraud detection |
| `murmurhash` | `^2.0.0` | Fast hashing for device fingerprint components |
| `ioredis` | `^5.3.0` | Redis client for click deduplication and rate limiting caches |
| `date-fns` | `^3.0.0` | Date manipulation for hold period calculations and analytics ranges |

---

## Testing

### Unit Tests

Unit tests cover individual service methods, fraud signal evaluators, and utility functions in isolation with mocked dependencies.

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { evaluateFraudSignals } from '@mcv/growth/referrals';

describe('evaluateFraudSignals', () => {
  it('should score 100 for self-referral', () => {
    const signals = evaluateFraudSignals({
      referrerUserId: 'user_01AAA',
      refereeUserId: 'user_01AAA', // Same user!
      referrerIp: '1.2.3.4',
      refereeIp: '5.6.7.8',
      referrerEmail: 'a@example.com',
      refereeEmail: 'a@example.com',
      referrerFingerprint: 'fp_1',
      refereeFingerprint: 'fp_2',
      clickToSignupSeconds: 300,
      referralsLastHour: 1,
    }, {
      enabledSignals: ['self_referral'],
      signalWeights: {},
    });

    const selfRef = signals.find(s => s.signal === 'self_referral');
    expect(selfRef).toBeDefined();
    expect(selfRef!.score).toBe(100);
    expect(selfRef!.reason).toContain('same user');
  });

  it('should score 0 for clean referral with different IPs', () => {
    const signals = evaluateFraudSignals({
      referrerUserId: 'user_01AAA',
      refereeUserId: 'user_01BBB',
      referrerIp: '1.2.3.4',
      refereeIp: '5.6.7.8',
      referrerEmail: 'alice@gmail.com',
      refereeEmail: 'bob@yahoo.com',
      referrerFingerprint: 'fp_1',
      refereeFingerprint: 'fp_2',
      clickToSignupSeconds: 3600,
      referralsLastHour: 1,
    }, {
      enabledSignals: ['self_referral', 'ip_match', 'email_domain', 'device_fingerprint', 'velocity'],
      signalWeights: {},
    });

    const totalScore = signals.reduce((sum, s) => sum + s.weightedScore, 0);
    expect(totalScore).toBe(0);
  });

  it('should flag disposable email domains', () => {
    const signals = evaluateFraudSignals({
      referrerUserId: 'user_01AAA',
      refereeUserId: 'user_01BBB',
      referrerIp: '1.2.3.4',
      refereeIp: '5.6.7.8',
      referrerEmail: 'alice@gmail.com',
      refereeEmail: 'temp@guerrillamail.com',
      referrerFingerprint: 'fp_1',
      refereeFingerprint: 'fp_2',
      clickToSignupSeconds: 300,
      referralsLastHour: 1,
    }, {
      enabledSignals: ['disposable_email'],
      signalWeights: {},
    });

    const disposable = signals.find(s => s.signal === 'disposable_email');
    expect(disposable).toBeDefined();
    expect(disposable!.score).toBeGreaterThan(0);
    expect(disposable!.reason).toContain('disposable');
  });

  it('should apply custom signal weights', () => {
    const signals = evaluateFraudSignals({
      referrerUserId: 'user_01AAA',
      refereeUserId: 'user_01BBB',
      referrerIp: '1.2.3.4',
      refereeIp: '1.2.3.4', // Same IP
      referrerEmail: 'a@gmail.com',
      refereeEmail: 'b@gmail.com',
      referrerFingerprint: 'fp_1',
      refereeFingerprint: 'fp_2',
      clickToSignupSeconds: 300,
      referralsLastHour: 1,
    }, {
      enabledSignals: ['ip_match'],
      signalWeights: { ip_match: 0.5 }, // Half weight
    });

    const ipMatch = signals.find(s => s.signal === 'ip_match');
    expect(ipMatch).toBeDefined();
    expect(ipMatch!.weight).toBe(0.5);
    expect(ipMatch!.weightedScore).toBe(ipMatch!.score * 0.5);
  });

  it('should detect velocity violations', () => {
    const signals = evaluateFraudSignals({
      referrerUserId: 'user_01AAA',
      refereeUserId: 'user_01BBB',
      referrerIp: '1.2.3.4',
      refereeIp: '5.6.7.8',
      referrerEmail: 'a@gmail.com',
      refereeEmail: 'b@gmail.com',
      referrerFingerprint: 'fp_1',
      refereeFingerprint: 'fp_2',
      clickToSignupSeconds: 300,
      referralsLastHour: 15, // High velocity
    }, {
      enabledSignals: ['velocity'],
      signalWeights: {},
    });

    const velocity = signals.find(s => s.signal === 'velocity');
    expect(velocity).toBeDefined();
    expect(velocity!.score).toBeGreaterThanOrEqual(50);
    expect(velocity!.reason).toContain('exceed');
  });
});
```

### Integration Tests

Integration tests verify the full referral lifecycle using a test database with seeded data.

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestContext, seedTestVenture, cleanupTestData } from '@mcv/testing';
import { ReferralService, WaitlistService } from '@mcv/growth/referrals';

describe('ReferralService integration', () => {
  let ctx: TestContext;
  let svc: ReferralService;

  beforeAll(async () => {
    ctx = await createTestContext();
    await seedTestVenture(ctx, {
      users: ['referrer', 'referee_1', 'referee_2', 'referee_3'],
    });
    svc = ctx.get(ReferralService);
  });

  afterAll(async () => {
    await cleanupTestData(ctx);
  });

  it('should complete full referral lifecycle', async () => {
    // Create program
    const program = await svc.createProgram(ctx.ventureId, {
      name: 'Test Program',
      slug: 'test-program',
      type: 'standard',
      referrerReward: { type: 'credits', value: 10, currency: 'USD', description: '$10 credit' },
      refereeReward: { type: 'discount_percent', value: 20, description: '20% off' },
      qualifyingAction: { type: 'purchase', minValue: 10 },
    });

    await svc.activateProgram(program.id);

    // Create link
    const link = await svc.createLink(program.id, ctx.users.referrer.id);
    expect(link.code).toHaveLength(8);
    expect(link.url).toContain(link.code);

    // Record click
    await svc.recordClick(link.code, {
      ip: '203.0.113.1',
      userAgent: 'TestAgent/1.0',
      referer: null,
      timestamp: new Date(),
    });

    // Record signup
    const referral = await svc.recordSignup(ctx.users.referee_1.id, {
      referralCode: link.code,
      ip: '203.0.113.50',
      deviceFingerprint: 'fp_test_1',
      emailDomain: 'gmail.com',
    });

    expect(referral.status).toBe('signed_up');
    expect(referral.fraudStatus).toBe('clean');
    expect(referral.referrerId).toBe(ctx.users.referrer.id);
    expect(referral.refereeId).toBe(ctx.users.referee_1.id);

    // Record qualifying action
    const converted = await svc.recordQualifyingAction(referral.id, {
      type: 'purchase',
      value: 49.99,
      orderId: 'test_order_001',
      timestamp: new Date(),
    });

    expect(converted.status).toBe('converted');

    // Issue rewards
    const { referrerReward, refereeReward } = await svc.issueRewards(referral.id);
    expect(referrerReward.status).toBe('pending');
    expect(referrerReward.rewardType).toBe('credits');
    expect(Number(referrerReward.finalValue)).toBe(10);
    expect(refereeReward.status).toBe('pending');
    expect(refereeReward.rewardType).toBe('discount_percent');

    // Verify link counters updated
    const updatedLink = await svc.getLinkByCode(link.code);
    expect(updatedLink!.clickCount).toBe(1);
    expect(updatedLink!.signupCount).toBe(1);
    expect(updatedLink!.conversionCount).toBe(1);
  });

  it('should block self-referrals', async () => {
    const program = await svc.createProgram(ctx.ventureId, {
      name: 'Self-Ref Test',
      slug: 'self-ref-test',
      type: 'standard',
      referrerReward: { type: 'credits', value: 10, currency: 'USD', description: 'test' },
      refereeReward: { type: 'credits', value: 5, currency: 'USD', description: 'test' },
      qualifyingAction: { type: 'signup' },
    });

    await svc.activateProgram(program.id);
    const link = await svc.createLink(program.id, ctx.users.referrer.id);

    // Attempt self-referral
    await expect(
      svc.recordSignup(ctx.users.referrer.id, {
        referralCode: link.code,
        ip: '203.0.113.1',
        deviceFingerprint: 'fp_self',
        emailDomain: 'test.com',
      })
    ).rejects.toThrow('REFERRAL_SELF_REFERRAL');
  });

  it('should prevent duplicate referrals in same program', async () => {
    // Attempt to refer the same user again in the same program
    await expect(
      svc.recordSignup(ctx.users.referee_1.id, {
        referralCode: 'existing_code',
        ip: '203.0.113.2',
        deviceFingerprint: 'fp_dup',
        emailDomain: 'gmail.com',
      })
    ).rejects.toThrow('REFERRAL_ALREADY_EXISTS');
  });

  it('should enforce per-user referral limits', async () => {
    const limitedProgram = await svc.createProgram(ctx.ventureId, {
      name: 'Limited Program',
      slug: 'limited-program',
      type: 'standard',
      referrerReward: { type: 'credits', value: 5, currency: 'USD', description: 'test' },
      refereeReward: { type: 'credits', value: 5, currency: 'USD', description: 'test' },
      qualifyingAction: { type: 'signup' },
      limits: { maxBudget: null, maxReferralsPerUser: 1, maxTotalReferrals: null },
    });

    await svc.activateProgram(limitedProgram.id);
    const link = await svc.createLink(limitedProgram.id, ctx.users.referrer.id);

    // First referral succeeds
    await svc.recordSignup(ctx.users.referee_1.id, {
      referralCode: link.code,
      ip: '10.0.0.1',
      deviceFingerprint: 'fp_a',
      emailDomain: 'a.com',
    });

    // Second referral exceeds limit
    await expect(
      svc.recordSignup(ctx.users.referee_2.id, {
        referralCode: link.code,
        ip: '10.0.0.2',
        deviceFingerprint: 'fp_b',
        emailDomain: 'b.com',
      })
    ).rejects.toThrow('REFERRAL_MAX_PER_USER');
  });
});
```

### Fraud Simulation Tests

Dedicated test suite that simulates various fraud scenarios to verify the detection pipeline.

```typescript
import { describe, it, expect } from 'vitest';
import { createTestContext, seedTestVenture } from '@mcv/testing';
import { ReferralService } from '@mcv/growth/referrals';

describe('Fraud detection scenarios', () => {
  // ... test context setup ...

  it('should detect and block referral ring (3+ accounts same device)', async () => {
    const fingerprint = 'fp_shared_device';

    // Create 3 referrals all from the same device fingerprint
    for (let i = 0; i < 3; i++) {
      const referral = await svc.recordSignup(`user_ring_${i}`, {
        referralCode: link.code,
        ip: `10.0.${i}.1`,       // Different IPs
        deviceFingerprint: fingerprint, // Same device!
        emailDomain: `ring${i}.com`,
      });

      if (i >= 2) {
        // By the third referral from the same device, velocity + fingerprint should flag
        expect(referral.fraudStatus).toBe('flagged');
      }
    }
  });

  it('should detect rapid-fire referrals (bot behavior)', async () => {
    // Simulate 20 referrals in 5 minutes
    for (let i = 0; i < 20; i++) {
      await svc.recordClick(link.code, {
        ip: `192.168.${Math.floor(i / 256)}.${i % 256}`,
        userAgent: 'BotAgent/1.0',
        referer: null,
        timestamp: new Date(Date.now() + i * 15000), // 15 seconds apart
      });
    }

    // Verify velocity flag was raised
    const flags = await svc.getFraudFlags(link.referralId);
    const velocityFlag = flags.find(f =>
      f.signals.some(s => s.signal === 'velocity' && s.score > 0)
    );
    expect(velocityFlag).toBeDefined();
  });

  it('should handle VPN/proxy detection gracefully when API is unavailable', async () => {
    // When IP reputation API is down, VPN signal should return score 0 (not block)
    const referral = await svc.recordSignup('user_vpn_test', {
      referralCode: link.code,
      ip: '104.28.1.1', // Known Cloudflare IP
      deviceFingerprint: 'fp_vpn',
      emailDomain: 'gmail.com',
    });

    // Should not be blocked just because VPN check failed
    expect(referral.fraudStatus).not.toBe('blocked');
  });
});
```

### Load Tests

Load tests verify the referral system's performance under high concurrency, particularly for click tracking and reward issuance.

```typescript
import { describe, it, expect } from 'vitest';
import { createTestContext } from '@mcv/testing';
import { ReferralService } from '@mcv/growth/referrals';

describe('Referral load tests', { timeout: 60_000 }, () => {
  it('should handle 1000 concurrent clicks without data loss', async () => {
    const clickPromises = Array.from({ length: 1000 }, (_, i) =>
      svc.recordClick(link.code, {
        ip: `10.${Math.floor(i / 65536)}.${Math.floor((i % 65536) / 256)}.${i % 256}`,
        userAgent: `LoadTest/${i}`,
        referer: null,
        timestamp: new Date(),
      })
    );

    await Promise.allSettled(clickPromises);

    const updatedLink = await svc.getLinkByCode(link.code);
    expect(updatedLink!.clickCount).toBe(1000);
  });

  it('should not double-issue rewards under concurrent qualifying actions', async () => {
    // Attempt to record the same qualifying action twice concurrently
    const results = await Promise.allSettled([
      svc.recordQualifyingAction(referralId, { type: 'purchase', value: 50, orderId: 'order_1' }),
      svc.recordQualifyingAction(referralId, { type: 'purchase', value: 50, orderId: 'order_1' }),
    ]);

    const successes = results.filter(r => r.status === 'fulfilled');
    expect(successes).toHaveLength(1); // Exactly one should succeed
  });

  it('should aggregate analytics within acceptable latency', async () => {
    const start = Date.now();

    const analytics = await svc.getAnalytics(programId, {
      dateRange: { from: new Date('2025-01-01'), to: new Date('2025-02-01') },
      includeTimeSeries: true,
      includeChannelBreakdown: true,
      includeTopReferrers: true,
    });

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(2000); // Under 2 seconds
    expect(analytics.funnel.totalClicks).toBeGreaterThan(0);
  });
});
```

### Test Utilities

The module provides test utilities for seeding referral data in other modules' test suites.

```typescript
import { createTestReferralProgram, createTestReferral, createTestReward } from '@mcv/growth/referrals/testing';

// Quick program setup for other modules' tests
const program = await createTestReferralProgram(ctx, {
  type: 'standard',
  rewards: 'credits-20',  // Shorthand for $20 credit referrer + 20% off referee
});

// Create a referral at a specific funnel stage
const referral = await createTestReferral(ctx, program.id, {
  stage: 'converted',     // Auto-creates click, signup, and conversion data
  fraudScore: 0,
});

// Create a reward in a specific state
const reward = await createTestReward(ctx, referral.id, {
  status: 'approved',
  recipientType: 'referrer',
});
```

---

*For related modules, see [`@mcv/growth/rewards`](../rewards/MODULE.md) (reward fulfillment), [`@mcv/billing/credits`](../../billing/credits/MODULE.md) (credit management), and [`@mcv/growth/campaigns`](../campaigns/MODULE.md) (campaign-driven referral boosts).*