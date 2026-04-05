# @mcv/domains/cdp — Customer Data Platform

**Package:** `@mcv/cdp`  
**Classification:** MCV-ONLY  
**Last Updated:** February 8, 2026

---

## Overview

Customer Data Platform for unified customer profiles, segmentation, and personalization across all MCV ventures.

---

## Key Features

- **Unified Profiles**: 360° customer view across touchpoints
- **Identity Resolution**: Link identities across channels
- **Segmentation**: Dynamic and static audience segments
- **Event Tracking**: Real-time behavioral data
- **Personalization**: Rules-based content personalization
- **Privacy**: GDPR/CCPA compliance built-in

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          CDP CORE                                │
│                                                                  │
│   ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐   │
│   │  Profile  │  │  Events   │  │  Segments │  │ Audiences │   │
│   │  Store    │  │  Stream   │  │  Engine   │  │  Builder  │   │
│   └───────────┘  └───────────┘  └───────────┘  └───────────┘   │
│                                                                  │
│   ┌───────────┐  ┌───────────┐  ┌───────────┐                   │
│   │  Identity │  │ Consents  │  │ Exports   │                   │
│   │ Resolution│  │  Manager  │  │           │                   │
│   └───────────┘  └───────────┘  └───────────┘                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Profile Schema

```typescript
interface CustomerProfile {
  id: string;                    // Unified profile ID
  ventureId: string;
  
  // Identities
  identities: {
    email?: string[];
    phone?: string[];
    deviceIds?: string[];
    externalIds?: Record<string, string>;
  };
  
  // Attributes
  attributes: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: Date;
    timezone?: string;
    locale?: string;
    custom?: Record<string, any>;
  };
  
  // Computed
  computed: {
    ltv?: number;
    churnRisk?: number;
    segments?: string[];
    lastActivityAt?: Date;
  };
  
  // Privacy
  consents: {
    marketing: boolean;
    analytics: boolean;
    personalization: boolean;
  };
}
```

---

## Event Tracking

```typescript
import { track, identify } from '@mcv/cdp';

// Track event
await track({
  userId: user.id,
  event: 'product_viewed',
  properties: {
    productId: '123',
    category: 'electronics',
    price: 99.99,
  },
});

// Identify user
await identify({
  userId: user.id,
  traits: {
    email: 'user@example.com',
    plan: 'premium',
  },
});
```

---

## Segmentation

```typescript
import { createSegment, evaluateSegment } from '@mcv/cdp';

// Create segment
const segment = await createSegment({
  name: 'High Value Customers',
  definition: {
    and: [
      { field: 'computed.ltv', operator: 'gte', value: 1000 },
      { field: 'attributes.plan', operator: 'eq', value: 'premium' },
      { field: 'computed.lastActivityAt', operator: 'within', value: '30d' },
    ],
  },
});

// Check if user is in segment
const inSegment = await evaluateSegment(userId, segment.id);
```

---

## Dependencies

- @mcv/kernel
- @mcv/identity
- @mcv/fabric (events, storage)
- @mcv/intelligence (ml predictions)

---

*@mcv/domains/cdp — Customer Data Platform*
