# @mcv/engagement — API Reference

**Module:** @mcv/engagement  
**Tier:** 5 (Domain Layer — Publishable)  
**Classification:** PUBLISHABLE  
**Last Updated:** February 9, 2026

---

## Table of Contents

1. [API Overview](#api-overview)
2. [Achievements](#achievements)
3. [Earn](#earn)
4. [Leaderboards](#leaderboards)
5. [Points](#points)
6. [Progression](#progression)
7. [Quests](#quests)
8. [Rewards](#rewards)
9. [Seasons](#seasons)
10. [Streaks](#streaks)
11. [Event Processing](#event-processing)
12. [Economic Monitoring](#economic-monitoring)
13. [Fraud Detection](#fraud-detection)
14. [Types](#types)
15. [Zod Schemas](#zod-schemas)
16. [Events](#events)
17. [Error Codes](#error-codes)
18. [Configuration](#configuration)
19. [Client Hooks](#client-hooks)

---

## API Overview

The `@mcv/engagement` module exposes its functionality through **server-side service functions** — there are no REST endpoints. All functions are imported directly and called server-side within Next.js Server Actions, API routes, or other domain services.

### Import Pattern

```typescript
import {
  awardPoints,
  getBalance,
  listActiveQuests,
  getUserAchievements,
  getStreakStatus,
  getRankings,
} from '@mcv/engagement';
```

### Common Parameters

Every service function accepts these common parameters either directly or through context:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | `string` (UUID) | Yes | Target user identifier |
| `tenantId` | `string` (UUID) | No | Venture scope (null = platform-wide) |

### Response Pattern

All service functions return typed results. Errors are thrown as typed exceptions extending `EngagementError`.

```typescript
// Success
const balance = await getBalance({ userId, pointTypeSlug: 'edge_points' });
// Returns: PointBalance

// Error
try {
  await redeemReward({ userId, rewardId, idempotencyKey });
} catch (error) {
  if (error instanceof RewardOutOfStockError) {
    // Handle out of stock
  }
}
```

---

## Achievements

### Service: `achievement-admin-service`

Administrative operations for managing achievement definitions. Requires `engagement_admin` role.

---

#### `createAchievement`

Create a new achievement definition.

```typescript
import { createAchievement } from '@mcv/engagement';

const achievement = await createAchievement({
  slug: 'first-hundred-bets',
  name: 'Century Bettor',
  description: 'Place 100 bets on any market.',
  flavorText: 'The house always wins... but so do you.',
  category: 'mastery',
  subcategory: 'betting',
  rarity: 'rare',
  requirements: {
    ">=": [{ "var": "bets_placed" }, 100]
  },
  tiers: [
    { tier: 1, name: 'Bronze', target: 25, rewards: { points: [{ type: 'edge_points', amount: 100 }] }, iconUrl: '/icons/bet-bronze.png' },
    { tier: 2, name: 'Silver', target: 50, rewards: { points: [{ type: 'edge_points', amount: 250 }] }, iconUrl: '/icons/bet-silver.png' },
    { tier: 3, name: 'Gold', target: 100, rewards: { points: [{ type: 'edge_points', amount: 500 }] }, iconUrl: '/icons/bet-gold.png' },
  ],
  rewards: {
    points: [{ type: 'edge_points', amount: 500 }],
    xp: 200,
  },
  xpValue: 200,
  iconUrl: '/icons/century-bettor.png',
  nftEnabled: true,
  isHidden: false,
  isSecret: false,
  showProgress: true,
  totalSupply: null,
  tenantId: 'betedge-venture-id',
});
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `slug` | `string` | Yes | URL-safe unique identifier |
| `name` | `string` | Yes | Display name |
| `description` | `string` | No | Achievement description |
| `flavorText` | `string` | No | Narrative/lore text |
| `category` | `string` | Yes | Category: 'explorer', 'social', 'mastery', etc. |
| `subcategory` | `string` | No | Sub-grouping |
| `rarity` | `AchievementRarity` | Yes | common / uncommon / rare / epic / legendary / mythic |
| `requirements` | `Record<string, unknown>` | Yes | JSON Logic unlock criteria |
| `tiers` | `AchievementTier[]` | No | Multi-tier progression array |
| `rewards` | `QuestReward` | Yes | Reward bundle on unlock |
| `xpValue` | `number` | Yes | XP awarded on unlock |
| `iconUrl` | `string` | No | Achievement icon URL |
| `lockedIconUrl` | `string` | No | Locked state icon URL |
| `animationUrl` | `string` | No | Unlock animation URL (Lottie/Rive) |
| `nftEnabled` | `boolean` | No | Whether mintable as NFT (default: false) |
| `isHidden` | `boolean` | No | Hidden until discovered (default: false) |
| `isSecret` | `boolean` | No | Never shown in lists (default: false) |
| `showProgress` | `boolean` | No | Show progress bar (default: true) |
| `totalSupply` | `number` | No | Limited supply (null = unlimited) |
| `prerequisiteAchievements` | `string[]` | No | Achievement slugs that must be unlocked first |
| `tenantId` | `string` | No | Venture scope |

**Returns:** `Achievement`

---

#### `updateAchievement`

Update an existing achievement definition.

```typescript
import { updateAchievement } from '@mcv/engagement';

const updated = await updateAchievement({
  id: 'achievement-uuid',
  name: 'Century Bettor (Updated)',
  rarity: 'epic',
  totalSupply: 1000,
});
```

**Parameters:** Partial `Achievement` with required `id`.

**Returns:** `Achievement`

---

#### `listAchievements`

List achievement definitions with optional filtering.

```typescript
import { listAchievements } from '@mcv/engagement';

const achievements = await listAchievements({
  category: 'mastery',
  rarity: 'rare',
  tenantId: 'betedge-venture-id',
  includeHidden: false,
  limit: 50,
  offset: 0,
});
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `category` | `string` | No | Filter by category |
| `rarity` | `AchievementRarity` | No | Filter by rarity |
| `tenantId` | `string` | No | Filter by venture |
| `includeHidden` | `boolean` | No | Include hidden achievements (default: false) |
| `limit` | `number` | No | Page size (default: 50) |
| `offset` | `number` | No | Page offset (default: 0) |

**Returns:** `{ items: Achievement[], total: number }`

---

#### `getAchievement`

Get a single achievement by ID or slug.

```typescript
import { getAchievement } from '@mcv/engagement';

const achievement = await getAchievement({ slug: 'first-hundred-bets', tenantId });
```

**Parameters:** `{ id?: string, slug?: string, tenantId?: string }`

**Returns:** `Achievement`

**Throws:** `AchievementNotFoundError`

---

### Service: `achievement-user-service`

User-facing operations for viewing and interacting with achievements.

---

#### `getUserAchievements`

Get a user's full achievement profile, including unlocked, in-progress, and locked achievements.

```typescript
import { getUserAchievements } from '@mcv/engagement';

const profile = await getUserAchievements({
  userId: 'user-uuid',
  tenantId: 'betedge-venture-id',
  filter: 'unlocked', // 'all' | 'unlocked' | 'in-progress' | 'locked'
  category: 'mastery',
  limit: 50,
  offset: 0,
});
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | `string` | Yes | Target user |
| `tenantId` | `string` | No | Venture scope |
| `filter` | `string` | No | 'all', 'unlocked', 'in-progress', 'locked' |
| `category` | `string` | No | Filter by category |
| `limit` | `number` | No | Page size (default: 50) |
| `offset` | `number` | No | Page offset |

**Returns:** `{ items: UserAchievement[], total: number, stats: { unlocked: number, total: number, completionPct: number } }`

---

#### `unlockAchievement`

Manually unlock an achievement for a user (admin or event-driven).

```typescript
import { unlockAchievement } from '@mcv/engagement';

const result = await unlockAchievement({
  userId: 'user-uuid',
  achievementSlug: 'first-hundred-bets',
  tenantId: 'betedge-venture-id',
});
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | `string` | Yes | Target user |
| `achievementSlug` | `string` | Yes | Achievement to unlock |
| `tenantId` | `string` | No | Venture scope |

**Returns:** `UserAchievement`

**Throws:** `AchievementNotFoundError`, `AchievementAlreadyUnlockedError`, `AchievementSupplyExhaustedError`

**Events Emitted:** `achievement.unlocked`

---

#### `claimAchievementReward`

Claim the reward for an unlocked achievement.

```typescript
import { claimAchievementReward } from '@mcv/engagement';

const reward = await claimAchievementReward({
  userId: 'user-uuid',
  achievementId: 'achievement-uuid',
});
```

**Returns:** `{ rewards: QuestReward, pointsAwarded: number, xpAwarded: number }`

**Throws:** `AchievementNotFoundError` (if not unlocked)

---

#### `getAchievementProgress`

Get a user's progress toward a specific achievement.

```typescript
import { getAchievementProgress } from '@mcv/engagement';

const progress = await getAchievementProgress({
  userId: 'user-uuid',
  achievementSlug: 'first-hundred-bets',
  tenantId: 'betedge-venture-id',
});
// Returns: { current: 67, target: 100, percentage: 67, currentTier: 2, nextTier: 3 }
```

**Returns:** `{ current: number, target: number, percentage: number, currentTier: number, nextTier: number | null }`

---

#### `setShowcaseAchievements`

Pin achievements to a user's profile showcase.

```typescript
import { setShowcaseAchievements } from '@mcv/engagement';

await setShowcaseAchievements({
  userId: 'user-uuid',
  achievementIds: ['ach-1', 'ach-2', 'ach-3'], // max 5
});
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | `string` | Yes | Target user |
| `achievementIds` | `string[]` | Yes | Ordered list (max 5) |

**Returns:** `void`

---

#### `mintAchievementNFT`

Mint an unlocked achievement as an on-chain NFT.

```typescript
import { mintAchievementNFT } from '@mcv/engagement';

const nft = await mintAchievementNFT({
  userId: 'user-uuid',
  achievementId: 'achievement-uuid',
  walletAddress: 'solana-wallet-address',
});
// Returns: { mintAddress: 'abc123...', transactionHash: 'def456...' }
```

**Returns:** `{ mintAddress: string, transactionHash: string }`

**Throws:** `AchievementNotFoundError`, `NFTMintingFailedError`

---

## Earn

### Service: `earn-service`

Manages earn action definitions and processes incoming venture events.

---

#### `registerEarnAction`

Register a new earn action mapping.

```typescript
import { registerEarnAction } from '@mcv/engagement';

const action = await registerEarnAction({
  slug: 'betedge-bet-placed',
  name: 'Place a Bet',
  description: 'Earn points every time you place a bet.',
  eventType: 'bet.placed',
  filters: { category: { "$in": ["sports", "esports"] } },
  pointTypeSlug: 'edge_points',
  baseAmount: 10,
  multiplierRules: [
    {
      condition: { "===": [{ "var": "dayOfWeek" }, "saturday"] },
      multiplier: 1.5,
      label: 'Weekend Bonus',
    },
    {
      condition: { "===": [{ "var": "isFirstOfDay" }, true] },
      multiplier: 2.0,
      label: 'First of Day',
    },
  ],
  maxPerDay: 50,
  maxPerWeek: 200,
  cooldownMinutes: 5,
  isActive: true,
  tenantId: 'betedge-venture-id',
});
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `slug` | `string` | Yes | URL-safe identifier |
| `name` | `string` | Yes | Display name |
| `description` | `string` | No | Description |
| `eventType` | `string` | Yes | Redpanda event type to match |
| `filters` | `Record<string, unknown>` | No | Additional JSON Logic filters |
| `pointTypeSlug` | `string` | Yes | Currency to award |
| `baseAmount` | `number` | Yes | Base points per trigger |
| `multiplierRules` | `EarnMultiplier[]` | No | Conditional multiplier stack |
| `maxPerDay` | `number` | No | Per-user daily cap |
| `maxPerWeek` | `number` | No | Per-user weekly cap |
| `cooldownMinutes` | `number` | No | Minutes between awards |
| `isActive` | `boolean` | No | Active status (default: true) |
| `startsAt` | `string` (ISO) | No | Activation date |
| `endsAt` | `string` (ISO) | No | Deactivation date |
| `tenantId` | `string` | No | Venture scope |

**Returns:** `EarnAction`

---

#### `updateEarnAction`

Update an existing earn action mapping.

```typescript
import { updateEarnAction } from '@mcv/engagement';

const updated = await updateEarnAction({
  id: 'earn-action-uuid',
  baseAmount: 15,
  maxPerDay: 75,
});
```

**Returns:** `EarnAction`

---

#### `listEarnActions`

List all earn actions for a venture.

```typescript
import { listEarnActions } from '@mcv/engagement';

const actions = await listEarnActions({
  tenantId: 'betedge-venture-id',
  isActive: true,
  limit: 50,
  offset: 0,
});
```

**Returns:** `{ items: EarnAction[], total: number }`

---

#### `getEarnAction`

Get a single earn action by ID or slug.

```typescript
import { getEarnAction } from '@mcv/engagement';

const action = await getEarnAction({ slug: 'betedge-bet-placed', tenantId });
```

**Returns:** `EarnAction`

**Throws:** `EarnActionNotFoundError`

---

#### `processEarnEvent`

Process an incoming venture event against registered earn actions. This is typically called internally by the `EngagementProcessor`, but can be invoked directly.

```typescript
import { processEarnEvent } from '@mcv/engagement';

const result = await processEarnEvent({
  event: {
    id: 'event-uuid',
    ventureId: 'betedge',
    userId: 'user-uuid',
    type: 'bet.placed',
    payload: {
      amount: 50,
      category: 'sports',
      tags: ['nfl', 'moneyline'],
      metadata: { betId: 'bet-123' },
    },
    timestamp: '2026-02-09T12:00:00Z',
    idempotencyKey: 'bet-123-earn',
  },
});
// Returns: { matched: true, actionSlug: 'betedge-bet-placed', baseAmount: 10,
//            multipliers: [{label: 'First of Day', value: 2.0}],
//            finalAmount: 20, pointType: 'edge_points' }
```

**Returns:** `ProcessedEarnResult`

```typescript
interface ProcessedEarnResult {
  matched: boolean;
  actionSlug: string | null;
  baseAmount: number;
  multipliers: Array<{ label: string; value: number }>;
  finalAmount: number;
  pointType: string | null;
  capped: boolean;        // true if daily/weekly cap limited the award
  cooldownActive: boolean; // true if cooldown prevented the award
}
```

---

#### `getEarnHistory`

Get a user's earn event history.

```typescript
import { getEarnHistory } from '@mcv/engagement';

const history = await getEarnHistory({
  userId: 'user-uuid',
  tenantId: 'betedge-venture-id',
  limit: 50,
  offset: 0,
  from: '2026-02-01T00:00:00Z',
  to: '2026-02-09T23:59:59Z',
});
```

**Returns:** `{ items: EarnEvent[], total: number }`

---

## Leaderboards

### Service: `leaderboard-service`

Real-time competitive ranking operations powered by Redis Sorted Sets.

---

#### `getRankings`

Get top N entries for a leaderboard.

```typescript
import { getRankings } from '@mcv/engagement';

const rankings = await getRankings({
  leaderboardSlug: 'top-winners',
  period: 'weekly',
  ventureId: 'betedge',
  limit: 100,
  offset: 0,
});
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `leaderboardSlug` | `string` | Yes | Leaderboard identifier |
| `period` | `LeaderboardPeriod` | No | daily / weekly / monthly / seasonal / all-time (default: all-time) |
| `ventureId` | `string` | No | Venture scope (null = global) |
| `limit` | `number` | No | Max entries (default: 100) |
| `offset` | `number` | No | Starting rank offset |

**Returns:** `{ entries: LeaderboardEntry[], total: number, updatedAt: string }`

```typescript
interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  score: number;
  previousRank: number | null;
  meta: Record<string, unknown>;
}
```

---

#### `getUserRank`

Get a specific user's rank with surrounding players.

```typescript
import { getUserRank } from '@mcv/engagement';

const rankInfo = await getUserRank({
  leaderboardSlug: 'top-winners',
  userId: 'user-uuid',
  period: 'weekly',
  ventureId: 'betedge',
  surroundingCount: 5, // players above/below
});
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `leaderboardSlug` | `string` | Yes | Leaderboard identifier |
| `userId` | `string` | Yes | Target user |
| `period` | `LeaderboardPeriod` | No | Time period |
| `ventureId` | `string` | No | Venture scope |
| `surroundingCount` | `number` | No | Players above/below to include (default: 5) |

**Returns:** `UserRankInfo`

```typescript
interface UserRankInfo {
  rank: number;
  score: number;
  percentile: number;       // 0-100
  totalParticipants: number;
  surrounding: LeaderboardEntry[];
}
```

---

#### `updateScore`

Update a user's score on a leaderboard. Typically called internally by the event processor.

```typescript
import { updateScore } from '@mcv/engagement';

await updateScore({
  leaderboardSlug: 'top-winners',
  userId: 'user-uuid',
  score: 1500,
  period: 'weekly',
  ventureId: 'betedge',
  scoreType: 'cumulative', // adds to existing score
});
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `leaderboardSlug` | `string` | Yes | Leaderboard identifier |
| `userId` | `string` | Yes | Target user |
| `score` | `number` | Yes | Score value |
| `period` | `LeaderboardPeriod` | Yes | Time period |
| `ventureId` | `string` | No | Venture scope |
| `scoreType` | `string` | No | 'cumulative' (add), 'snapshot' (replace), 'max' (keep higher) |

**Returns:** `{ newRank: number, previousRank: number | null, score: number }`

**Events Emitted:** `leaderboard.updated`

---

#### `createLeaderboard`

Define a new leaderboard.

```typescript
import { createLeaderboard } from '@mcv/engagement';

const board = await createLeaderboard({
  slug: 'top-winners',
  name: 'Top Winners',
  description: 'Weekly top winners across all markets.',
  scoreType: 'cumulative',
  scoreSource: 'edge_points',
  period: 'weekly',
  rotationSchedule: '0 0 * * 1', // Every Monday at midnight UTC
  ventureId: 'betedge',
  teamBased: false,
  displayLimit: 100,
  showPercentile: true,
  anonymizeOutsideTop: 50,
  rewardTiers: [
    { rankFrom: 1, rankTo: 1, rewards: { points: [{ type: 'edge_points', amount: 10000 }] } },
    { rankFrom: 2, rankTo: 3, rewards: { points: [{ type: 'edge_points', amount: 5000 }] } },
    { rankFrom: 4, rankTo: 10, rewards: { points: [{ type: 'edge_points', amount: 1000 }] } },
  ],
});
```

**Returns:** `LeaderboardConfig`

---

#### `listLeaderboards`

List available leaderboards.

```typescript
import { listLeaderboards } from '@mcv/engagement';

const boards = await listLeaderboards({
  ventureId: 'betedge',
  period: 'weekly',
});
```

**Returns:** `{ items: LeaderboardConfig[], total: number }`

---

#### `rotateLeaderboard`

Archive and reset a leaderboard (typically called by cron, but can be manual).

```typescript
import { rotateLeaderboard } from '@mcv/engagement';

const snapshot = await rotateLeaderboard({
  leaderboardSlug: 'top-winners',
  period: 'weekly',
  ventureId: 'betedge',
  distributeRewards: true,
});
// Returns: { snapshotId: 'uuid', totalEntries: 1542, rewardsDistributed: 10 }
```

**Returns:** `{ snapshotId: string, totalEntries: number, rewardsDistributed: number }`

---

#### `getLeaderboardHistory`

Get historical rotation snapshots.

```typescript
import { getLeaderboardHistory } from '@mcv/engagement';

const history = await getLeaderboardHistory({
  leaderboardSlug: 'top-winners',
  ventureId: 'betedge',
  limit: 10,
});
```

**Returns:** `{ items: LeaderboardHistory[], total: number }`

---

## Points

### Service: `point-service`

Core ledger operations for multi-currency point management.

---

#### `awardPoints`

Award points to a user with idempotency protection.

```typescript
import { awardPoints } from '@mcv/engagement';

const result = await awardPoints({
  userId: 'user-uuid',
  pointTypeSlug: 'edge_points',
  amount: 100,
  sourceType: 'quest',
  sourceId: 'quest-uuid',
  description: 'Completed daily quest: Place 3 bets',
  displayMessage: '+100 Edge Points!',
  idempotencyKey: 'quest-daily-3-bets-user-uuid-2026-02-09',
  tenantId: 'betedge-venture-id',
});
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | `string` | Yes | Target user |
| `pointTypeSlug` | `string` | Yes | Currency identifier |
| `amount` | `number` | Yes | Points to award (positive) |
| `sourceType` | `string` | Yes | Origin: 'quest', 'achievement', 'earn', 'purchase', 'admin', 'referral' |
| `sourceId` | `string` | No | Origin entity ID |
| `description` | `string` | No | Internal description |
| `displayMessage` | `string` | No | User-facing message |
| `idempotencyKey` | `string` | Yes | Prevents duplicate awards |
| `tenantId` | `string` | No | Venture scope |

**Returns:** `{ transaction: PointTransaction, balance: PointBalance }`

**Throws:** `DailyCapExceededError`, `MaxBalanceExceededError`

**Events Emitted:** `points.awarded`

---

#### `deductPoints`

Deduct points from a user's balance (sink operation).

```typescript
import { deductPoints } from '@mcv/engagement';

const result = await deductPoints({
  userId: 'user-uuid',
  pointTypeSlug: 'edge_points',
  amount: 500,
  sourceType: 'reward',
  sourceId: 'reward-uuid',
  description: 'Redeemed: Premium Avatar Pack',
  idempotencyKey: 'redeem-avatar-pack-user-uuid-1707494400',
  tenantId: 'betedge-venture-id',
});
```

**Throws:** `InsufficientBalanceError`

**Events Emitted:** `points.spent`

---

#### `transferPoints`

Transfer points between two users.

```typescript
import { transferPoints } from '@mcv/engagement';

const result = await transferPoints({
  fromUserId: 'sender-uuid',
  toUserId: 'receiver-uuid',
  pointTypeSlug: 'edge_points',
  amount: 50,
  description: 'Gift to friend',
  idempotencyKey: 'transfer-sender-receiver-1707494400',
  tenantId: 'betedge-venture-id',
});
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fromUserId` | `string` | Yes | Sender user ID |
| `toUserId` | `string` | Yes | Receiver user ID |
| `pointTypeSlug` | `string` | Yes | Currency to transfer |
| `amount` | `number` | Yes | Amount to transfer |
| `description` | `string` | No | Transfer description |
| `idempotencyKey` | `string` | Yes | Prevents duplicate transfers |
| `tenantId` | `string` | No | Venture scope |

**Returns:** `{ senderTransaction: PointTransaction, receiverTransaction: PointTransaction }`

**Throws:** `InsufficientBalanceError`

---

#### `getBalance`

Get a user's current balance for a specific currency.

```typescript
import { getBalance } from '@mcv/engagement';

const balance = await getBalance({
  userId: 'user-uuid',
  pointTypeSlug: 'edge_points',
  tenantId: 'betedge-venture-id',
});
// Returns: { available: '1250.0000', pending: '0.0000', locked: '0.0000',
//            lifetimeEarned: '5000.0000', ... }
```

**Returns:** `PointBalance`

---

#### `getAllBalances`

Get all balances across all currency types for a user.

```typescript
import { getAllBalances } from '@mcv/engagement';

const balances = await getAllBalances({
  userId: 'user-uuid',
  tenantId: 'betedge-venture-id',
});
// Returns: [{ pointType: 'edge_points', available: '1250', ... },
//           { pointType: 'xp', available: '3500', ... }]
```

**Returns:** `Array<PointBalance & { pointType: PointType }>`

---

#### `getTransactionHistory`

Get paginated transaction history for a user.

```typescript
import { getTransactionHistory } from '@mcv/engagement';

const history = await getTransactionHistory({
  userId: 'user-uuid',
  pointTypeSlug: 'edge_points',
  transactionType: 'earn',
  from: '2026-02-01T00:00:00Z',
  to: '2026-02-09T23:59:59Z',
  limit: 50,
  offset: 0,
  tenantId: 'betedge-venture-id',
});
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | `string` | Yes | Target user |
| `pointTypeSlug` | `string` | No | Filter by currency |
| `transactionType` | `PointTransactionType` | No | Filter by type |
| `from` | `string` (ISO) | No | Start date |
| `to` | `string` (ISO) | No | End date |
| `limit` | `number` | No | Page size (default: 50) |
| `offset` | `number` | No | Page offset |
| `tenantId` | `string` | No | Venture scope |

**Returns:** `{ items: PointTransaction[], total: number }`

---

#### `convertToTokens`

Bridge points to on-chain EDGE tokens.

```typescript
import { convertToTokens } from '@mcv/engagement';

const result = await convertToTokens({
  userId: 'user-uuid',
  pointTypeSlug: 'edge_points',
  amount: 10000,
  walletAddress: 'solana-wallet-address',
  idempotencyKey: 'convert-user-uuid-1707494400',
});
// Returns: { tokensIssued: 10, transactionHash: 'abc123...', conversionRate: '1000' }
```

**Returns:** `{ tokensIssued: number, transactionHash: string, conversionRate: string }`

**Throws:** `InsufficientBalanceError`, `ConversionFailedError`

---

### Service: `point-type-service`

Administrative operations for managing currency types.

---

#### `createPointType`

Define a new currency.

```typescript
import { createPointType } from '@mcv/engagement';

const pointType = await createPointType({
  slug: 'energy',
  name: 'Energy',
  description: 'Regenerating resource for daily actions.',
  currencyClass: 'energy',
  decimals: 0,
  maxBalance: '100',
  dailyEarnCap: null,
  regenerationRate: '5',    // 5 per hour
  maxRegeneration: '100',
  isConvertible: false,
  iconUrl: '/icons/energy.png',
  color: '#FFD700',
  tenantId: 'betedge-venture-id',
});
```

**Returns:** `PointType`

---

#### `updatePointType`

Update currency settings.

```typescript
import { updatePointType } from '@mcv/engagement';

const updated = await updatePointType({
  id: 'point-type-uuid',
  dailyEarnCap: '1000',
  regenerationRate: '10',
});
```

**Returns:** `PointType`

---

#### `listPointTypes`

List all currencies for a venture.

```typescript
import { listPointTypes } from '@mcv/engagement';

const types = await listPointTypes({ tenantId: 'betedge-venture-id' });
```

**Returns:** `PointType[]`

---

#### `getPointType`

Get a single currency configuration.

```typescript
import { getPointType } from '@mcv/engagement';

const type = await getPointType({ slug: 'edge_points', tenantId });
```

**Returns:** `PointType`

---

## Progression

### Service: `progression-service`

XP/leveling system with configurable curves, tier advancement, and prestige.

---

#### `getUserLevel`

Get a user's current level, XP, and tier status.

```typescript
import { getUserLevel } from '@mcv/engagement';

const level = await getUserLevel({
  userId: 'user-uuid',
  tenantId: 'betedge-venture-id',
});
// Returns: { level: 23, currentXP: 8450, xpToNextLevel: 11402, xpProgress: 74,
//            tier: 'silver', tierLevel: 2, prestigeLevel: 0 }
```

**Returns:**

```typescript
interface UserLevelInfo {
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  xpProgress: number;          // Percentage 0-100
  tier: string;                // 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
  tierLevel: number;           // 1-5
  prestigeLevel: number;       // 0-10
  prestigeBonusPct: number;    // Permanent earn bonus %
}
```

---

#### `addXP`

Add XP and check for level-up and tier advancement.

```typescript
import { addXP } from '@mcv/engagement';

const result = await addXP({
  userId: 'user-uuid',
  amount: 200,
  source: 'quest',
  sourceId: 'quest-uuid',
  tenantId: 'betedge-venture-id',
});
// Returns: { previousLevel: 23, newLevel: 24, leveledUp: true,
//            previousTier: 'silver', newTier: 'silver', tierAdvanced: false,
//            totalXP: 8650 }
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | `string` | Yes | Target user |
| `amount` | `number` | Yes | XP to add |
| `source` | `string` | Yes | XP source (quest, achievement, earn, etc.) |
| `sourceId` | `string` | No | Source entity ID |
| `tenantId` | `string` | No | Venture scope |

**Returns:** `AddXPResult`

**Events Emitted:** `level.up` (if leveled up), `tier.promoted` (if tier advanced)

---

#### `getLevelConfig`

Get the XP curve configuration.

```typescript
import { getLevelConfig } from '@mcv/engagement';

const config = await getLevelConfig({ tenantId: 'betedge-venture-id' });
// Returns: { type: 'polynomial', base: 100, exponent: 1.5, maxLevel: 100,
//            tierThresholds: { bronze: 1, silver: 11, gold: 26, platinum: 51, diamond: 76 } }
```

**Returns:** `LevelConfig`

---

#### `updateLevelConfig`

Update XP curve parameters (admin).

```typescript
import { updateLevelConfig } from '@mcv/engagement';

await updateLevelConfig({
  tenantId: 'betedge-venture-id',
  type: 'polynomial',
  base: 150,
  exponent: 1.4,
  maxLevel: 100,
});
```

**Returns:** `LevelConfig`

---

#### `getPrestigeStatus`

Get a user's prestige level and bonuses.

```typescript
import { getPrestigeStatus } from '@mcv/engagement';

const prestige = await getPrestigeStatus({ userId: 'user-uuid', tenantId });
// Returns: { prestigeLevel: 2, permanentBonus: 10, maxPrestige: 10,
//            canPrestige: false, currentLevel: 67, requiredLevel: 100 }
```

**Returns:** `PrestigeStatus`

---

#### `activatePrestige`

Reset level in exchange for permanent bonuses.

```typescript
import { activatePrestige } from '@mcv/engagement';

const result = await activatePrestige({ userId: 'user-uuid', tenantId });
// Returns: { newPrestigeLevel: 3, permanentBonus: 15, levelResetTo: 1 }
```

**Throws:** Error if user is not at max level.

**Events Emitted:** `prestige.activated`

---

#### `getTierStatus`

Get tier advancement status.

```typescript
import { getTierStatus } from '@mcv/engagement';

const tier = await getTierStatus({ userId: 'user-uuid', tenantId });
// Returns: { currentTier: 'silver', tierLevel: 2, nextTier: 'gold',
//            levelRequired: 26, currentLevel: 23, progress: 76 }
```

**Returns:** `TierStatus`

---

## Quests

### Service: `quest-admin-service`

Administrative operations for managing quest definitions.

---

#### `createQuest`

Create a new quest definition.

```typescript
import { createQuest } from '@mcv/engagement';

const quest = await createQuest({
  slug: 'daily-three-bets',
  name: 'Triple Threat',
  description: 'Place 3 bets today on any market.',
  questType: 'daily',
  category: 'betting',
  tags: ['daily', 'beginner'],
  status: 'active',
  recurrenceRule: 'FREQ=DAILY',
  requirements: {
    action: 'bet.placed',
    target: 3,
  },
  rewards: {
    points: [{ type: 'edge_points', amount: 50 }],
    xp: 25,
  },
  difficultyLevel: 1,
  estimatedDurationMinutes: 30,
  xpValue: 25,
  maxCompletionsPerUser: 1,  // Once per day
  tenantId: 'betedge-venture-id',
});
```

**Parameters:** Full `Quest` creation fields (see [Types](#types) section for complete schema).

**Returns:** `Quest`

---

#### `updateQuest`

Update an existing quest definition.

```typescript
import { updateQuest } from '@mcv/engagement';

const updated = await updateQuest({
  id: 'quest-uuid',
  rewards: {
    points: [{ type: 'edge_points', amount: 75 }],
    xp: 40,
  },
  difficultyLevel: 2,
});
```

**Returns:** `Quest`

---

#### `listQuests`

List quest definitions with filtering.

```typescript
import { listQuests } from '@mcv/engagement';

const quests = await listQuests({
  tenantId: 'betedge-venture-id',
  questType: 'daily',
  status: 'active',
  category: 'betting',
  limit: 50,
  offset: 0,
});
```

**Returns:** `{ items: Quest[], total: number }`

---

#### `getQuest`

Get a single quest definition.

```typescript
import { getQuest } from '@mcv/engagement';

const quest = await getQuest({ id: 'quest-uuid' });
```

**Returns:** `Quest`

**Throws:** `QuestNotFoundError`

---

#### `activateQuest`

Move a quest from draft to active.

```typescript
import { activateQuest } from '@mcv/engagement';

await activateQuest({ id: 'quest-uuid' });
```

**Returns:** `Quest` (with status = 'active')

---

#### `pauseQuest`

Temporarily pause an active quest.

```typescript
import { pauseQuest } from '@mcv/engagement';

await pauseQuest({ id: 'quest-uuid' });
```

**Returns:** `Quest` (with status = 'paused')

---

#### `archiveQuest`

Archive a completed or expired quest.

```typescript
import { archiveQuest } from '@mcv/engagement';

await archiveQuest({ id: 'quest-uuid' });
```

**Returns:** `Quest` (with status = 'archived')

---

### Service: `quest-user-service`

User-facing quest operations.

---

#### `listActiveQuests`

List quests available to a specific user.

```typescript
import { listActiveQuests } from '@mcv/engagement';

const quests = await listActiveQuests({
  userId: 'user-uuid',
  tenantId: 'betedge-venture-id',
  questType: 'daily',
  includeProgress: true,
  limit: 20,
});
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | `string` | Yes | Target user |
| `tenantId` | `string` | No | Venture scope |
| `questType` | `QuestType` | No | Filter by type |
| `includeProgress` | `boolean` | No | Include user's progress (default: true) |
| `limit` | `number` | No | Page size (default: 20) |

**Returns:** `Array<Quest & { userProgress?: UserQuest }>`

---

#### `getQuestProgress`

Get a user's progress on a specific quest.

```typescript
import { getQuestProgress } from '@mcv/engagement';

const progress = await getQuestProgress({
  userId: 'user-uuid',
  questId: 'quest-uuid',
});
// Returns: { questId: '...', status: 'active', current: 2, target: 3,
//            percentage: 66.7, compoundProgress: null, startedAt: '...', expiresAt: '...' }
```

**Returns:** `UserQuest & { percentage: number }`

---

#### `claimQuestReward`

Claim the reward for a completed quest.

```typescript
import { claimQuestReward } from '@mcv/engagement';

const result = await claimQuestReward({
  userId: 'user-uuid',
  questId: 'quest-uuid',
});
// Returns: { rewards: { points: [{type: 'edge_points', amount: 50}], xp: 25 },
//            pointsAwarded: 50, xpAwarded: 25 }
```

**Returns:** `{ rewards: QuestReward, pointsAwarded: number, xpAwarded: number }`

**Throws:** `QuestNotFoundError`, `QuestRequirementNotMetError`

**Events Emitted:** `quest.completed`, `points.awarded`

---

#### `refreshDailyQuests`

Reset and regenerate daily quest objectives for a user.

```typescript
import { refreshDailyQuests } from '@mcv/engagement';

const newQuests = await refreshDailyQuests({
  userId: 'user-uuid',
  tenantId: 'betedge-venture-id',
});
// Returns: Array of newly assigned UserQuest entries
```

**Returns:** `UserQuest[]`

---

## Rewards

### Service: `reward-service`

Reward catalog management and redemption processing.

---

#### `createReward`

Create a new reward in the catalog.

```typescript
import { createReward } from '@mcv/engagement';

const reward = await createReward({
  slug: 'premium-avatar-pack',
  name: 'Premium Avatar Pack',
  description: 'Unlock 10 exclusive avatar designs.',
  category: 'digital',
  pointTypeSlug: 'edge_points',
  cost: 500,
  stockTotal: null,       // Unlimited for digital
  maxPerUser: 1,
  isActive: true,
  imageUrl: '/rewards/avatar-pack.png',
  tenantId: 'betedge-venture-id',
});
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `slug` | `string` | Yes | URL-safe identifier |
| `name` | `string` | Yes | Display name |
| `description` | `string` | No | Reward description |
| `category` | `string` | Yes | 'digital', 'physical', 'experience', 'token' |
| `pointTypeSlug` | `string` | Yes | Currency required |
| `cost` | `number` | Yes | Points to redeem |
| `stockTotal` | `number` | No | Total supply (null = unlimited) |
| `maxPerUser` | `number` | No | Per-user limit |
| `cooldownHours` | `number` | No | Cooldown between redemptions |
| `isActive` | `boolean` | No | Available for redemption (default: true) |
| `imageUrl` | `string` | No | Reward image URL |
| `tenantId` | `string` | No | Venture scope |

**Returns:** `Reward`

---

#### `updateReward`

Update reward details or stock.

```typescript
import { updateReward } from '@mcv/engagement';

await updateReward({
  id: 'reward-uuid',
  cost: 750,
  isActive: true,
});
```

**Returns:** `Reward`

---

#### `listRewards`

List available rewards (catalog).

```typescript
import { listRewards } from '@mcv/engagement';

const catalog = await listRewards({
  tenantId: 'betedge-venture-id',
  category: 'digital',
  isActive: true,
  limit: 50,
  offset: 0,
});
```

**Returns:** `{ items: Reward[], total: number }`

---

#### `getReward`

Get a single reward by ID or slug.

```typescript
import { getReward } from '@mcv/engagement';

const reward = await getReward({ slug: 'premium-avatar-pack', tenantId });
```

**Returns:** `Reward`

---

#### `redeemReward`

Redeem a reward (deducts points, creates redemption record).

```typescript
import { redeemReward } from '@mcv/engagement';

const redemption = await redeemReward({
  userId: 'user-uuid',
  rewardId: 'reward-uuid',
  idempotencyKey: 'redeem-avatar-user-uuid-1707494400',
  tenantId: 'betedge-venture-id',
});
// Returns: { redemptionId: 'uuid', status: 'pending', pointsDeducted: 500,
//            reward: { name: 'Premium Avatar Pack', ... } }
```

**Returns:** `{ redemptionId: string, status: RedemptionStatus, pointsDeducted: number, reward: Reward }`

**Throws:** `RewardNotFoundError`, `RewardOutOfStockError`, `InsufficientBalanceError`, `RewardCooldownError`

**Events Emitted:** `reward.redeemed`, `points.spent`

---

#### `getRedemptionHistory`

Get a user's reward redemption history.

```typescript
import { getRedemptionHistory } from '@mcv/engagement';

const history = await getRedemptionHistory({
  userId: 'user-uuid',
  tenantId: 'betedge-venture-id',
  status: 'fulfilled',
  limit: 50,
  offset: 0,
});
```

**Returns:** `{ items: RewardRedemption[], total: number }`

---

#### `fulfillRedemption`

Mark a redemption as fulfilled (admin).

```typescript
import { fulfillRedemption } from '@mcv/engagement';

await fulfillRedemption({
  redemptionId: 'redemption-uuid',
  fulfillmentData: { trackingNumber: 'SHIP-123', carrier: 'FedEx' },
});
```

**Returns:** `RewardRedemption`

---

#### `refundRedemption`

Refund a redemption and restore points (admin).

```typescript
import { refundRedemption } from '@mcv/engagement';

await refundRedemption({
  redemptionId: 'redemption-uuid',
  reason: 'Item out of stock, customer requested refund.',
});
```

**Returns:** `RewardRedemption`

---

## Seasons

### Service: `season-service`

Seasonal content management with reward tracks.

---

#### `createSeason`

Create a season definition.

```typescript
import { createSeason } from '@mcv/engagement';

const season = await createSeason({
  slug: 'season-3-phoenix',
  name: 'Season 3: Rise of the Phoenix',
  description: 'The phoenix rises! Compete for exclusive rewards.',
  startsAt: '2026-03-01T00:00:00Z',
  endsAt: '2026-05-31T23:59:59Z',
  rewardTrack: [
    { tier: 1, name: 'Bronze', xpRequired: 0, rewards: { points: [{ type: 'edge_points', amount: 100 }] }, isExclusive: false },
    { tier: 2, name: 'Silver', xpRequired: 500, rewards: { points: [{ type: 'edge_points', amount: 250 }] }, isExclusive: false },
    { tier: 3, name: 'Gold', xpRequired: 1500, rewards: { points: [{ type: 'edge_points', amount: 500 }], achievements: ['phoenix-gold'] }, isExclusive: true },
    { tier: 4, name: 'Platinum', xpRequired: 3000, rewards: { points: [{ type: 'edge_points', amount: 1000 }] }, isExclusive: true },
    { tier: 5, name: 'Diamond', xpRequired: 5000, rewards: { points: [{ type: 'edge_points', amount: 2500 }], achievements: ['phoenix-diamond'] }, isExclusive: true },
  ],
  exclusiveAchievements: ['phoenix-gold', 'phoenix-diamond', 'phoenix-master'],
  xpMultiplier: 1.5,
  entryFee: null,           // Free season
  minimumTier: null,
  tenantId: 'betedge-venture-id',
});
```

**Returns:** `Season`

---

#### `updateSeason`

Update season configuration.

```typescript
import { updateSeason } from '@mcv/engagement';

await updateSeason({
  id: 'season-uuid',
  xpMultiplier: 2.0,  // Double XP event!
});
```

**Returns:** `Season`

---

#### `getActiveSeason`

Get the currently active season.

```typescript
import { getActiveSeason } from '@mcv/engagement';

const season = await getActiveSeason({ tenantId: 'betedge-venture-id' });
```

**Returns:** `Season | null`

---

#### `listSeasons`

List all seasons (past, current, future).

```typescript
import { listSeasons } from '@mcv/engagement';

const seasons = await listSeasons({
  tenantId: 'betedge-venture-id',
  status: 'active',
  limit: 10,
});
```

**Returns:** `{ items: Season[], total: number }`

---

#### `getSeasonProgress`

Get a user's progress in the current season.

```typescript
import { getSeasonProgress } from '@mcv/engagement';

const progress = await getSeasonProgress({
  userId: 'user-uuid',
  seasonId: 'season-uuid',
});
// Returns: { seasonId: '...', currentXP: 1250, currentTier: 2,
//            nextTier: { name: 'Gold', xpRequired: 1500 },
//            claimedTiers: [1, 2], rank: 145, isActive: true }
```

**Returns:** `UserSeasonProgress & { nextTier: SeasonRewardTier | null }`

---

#### `getSeasonRewardTrack`

Get the full reward track for a season.

```typescript
import { getSeasonRewardTrack } from '@mcv/engagement';

const track = await getSeasonRewardTrack({ seasonId: 'season-uuid' });
```

**Returns:** `SeasonRewardTier[]`

---

#### `claimSeasonReward`

Claim a seasonal reward tier.

```typescript
import { claimSeasonReward } from '@mcv/engagement';

const result = await claimSeasonReward({
  userId: 'user-uuid',
  seasonId: 'season-uuid',
  tier: 2,
});
// Returns: { tier: 2, rewards: { points: [...] }, claimed: true }
```

**Returns:** `{ tier: number, rewards: QuestReward, claimed: boolean }`

**Throws:** `SeasonNotActiveError`, `SeasonTierNotReachedError`, `SeasonTierAlreadyClaimedError`

**Events Emitted:** `season.tier_claimed`

---

#### `endSeason`

Manually end an active season (admin).

```typescript
import { endSeason } from '@mcv/engagement';

await endSeason({ seasonId: 'season-uuid' });
```

**Returns:** `Season` (with status = 'ended')

---

## Streaks

### Service: `streak-service`

Habit-loop tracking with grace periods, freezes, and velocity scoring.

---

#### `getStreakStatus`

Get a user's current streak state.

```typescript
import { getStreakStatus } from '@mcv/engagement';

const streak = await getStreakStatus({
  userId: 'user-uuid',
  tenantId: 'betedge-venture-id',
});
// Returns: { currentStreak: 12, longestStreak: 45, lastActivityAt: '...',
//            expiresAt: '...', freezesAvailable: 2, freezesUsed: 1,
//            isAtRisk: false, graceHoursRemaining: 28.5,
//            velocity: { activeDaysLast7: 7, avgActivitiesPerDay: 3.2,
//                        trend: 'stable', daysSincePeak: 0 } }
```

**Returns:** `StreakStatus`

```typescript
interface StreakStatus {
  currentStreak: number;
  longestStreak: number;
  lastActivityAt: string;
  expiresAt: string;
  freezesAvailable: number;
  freezesUsed: number;
  isAtRisk: boolean;
  graceHoursRemaining: number;
  velocity: StreakVelocity;
}

interface StreakVelocity {
  activeDaysLast7: number;
  avgActivitiesPerDay: number;
  trend: 'accelerating' | 'stable' | 'decelerating';
  daysSincePeak: number;
}
```

---

#### `recordStreakActivity`

Record an activity to maintain/extend the streak.

```typescript
import { recordStreakActivity } from '@mcv/engagement';

const result = await recordStreakActivity({
  userId: 'user-uuid',
  activityType: 'daily_login',
  tenantId: 'betedge-venture-id',
});
// Returns: { previousStreak: 11, currentStreak: 12, isNewRecord: false,
//            freezeConsumed: false, expiresAt: '...', streakMaintained: true }
```

**Returns:**

```typescript
interface RecordStreakResult {
  previousStreak: number;
  currentStreak: number;
  isNewRecord: boolean;
  freezeConsumed: boolean;
  expiresAt: string;
  streakMaintained: boolean; // false if streak was broken and reset
}
```

**Events Emitted:** `streak.maintained` or `streak.broken`

---

#### `useStreakFreeze`

Manually consume a streak freeze token.

```typescript
import { useStreakFreeze } from '@mcv/engagement';

const result = await useStreakFreeze({
  userId: 'user-uuid',
  tenantId: 'betedge-venture-id',
});
// Returns: { freezesRemaining: 1, expiresAt: '...' (extended) }
```

**Returns:** `{ freezesRemaining: number, expiresAt: string }`

**Throws:** `NoFreezeAvailableError`

---

#### `purchaseStreakFreeze`

Buy a streak freeze token using points.

```typescript
import { purchaseStreakFreeze } from '@mcv/engagement';

const result = await purchaseStreakFreeze({
  userId: 'user-uuid',
  pointTypeSlug: 'edge_points',
  tenantId: 'betedge-venture-id',
});
// Returns: { freezesAvailable: 3, pointsDeducted: 200 }
```

**Returns:** `{ freezesAvailable: number, pointsDeducted: number }`

**Throws:** `InsufficientBalanceError`

---

#### `getStreakHistory`

Get historical streak data.

```typescript
import { getStreakHistory } from '@mcv/engagement';

const history = await getStreakHistory({
  userId: 'user-uuid',
  tenantId: 'betedge-venture-id',
  limit: 30,
});
// Returns: Array of daily streak snapshots
```

**Returns:** `StreakHistory[]`

```typescript
interface StreakHistory {
  date: string;
  streakLength: number;
  activityCount: number;
  freezeUsed: boolean;
  wasAtRisk: boolean;
}
```

---

#### `getStreakVelocity`

Get the 7-day rolling activity velocity score.

```typescript
import { getStreakVelocity } from '@mcv/engagement';

const velocity = await getStreakVelocity({
  userId: 'user-uuid',
  tenantId: 'betedge-venture-id',
});
```

**Returns:** `StreakVelocity`

---

## Event Processing

### Service: `event-processor`

The core event processing pipeline that consumes `EngagementEvent` messages from Redpanda and orchestrates all submodule evaluations.

---

#### `processEngagementEvent`

Process a single engagement event through the full pipeline.

```typescript
import { processEngagementEvent } from '@mcv/engagement';

const result = await processEngagementEvent({
  id: 'event-uuid-v7',
  ventureId: 'betedge',
  userId: 'user-uuid',
  type: 'bet.placed',
  payload: {
    amount: 50,
    category: 'sports',
    tags: ['nfl', 'moneyline'],
    metadata: { betId: 'bet-123', odds: 2.5 },
  },
  timestamp: '2026-02-09T12:00:00Z',
  idempotencyKey: 'bet-123-engagement',
});
```

**Returns:** `ProcessedEventResult`

```typescript
interface ProcessedEventResult {
  eventId: string;
  processed: boolean;
  duplicate: boolean;       // true if idempotencyKey already seen

  // Earn results
  earnResults: Array<{
    actionSlug: string;
    pointType: string;
    amount: number;
    multipliers: Array<{ label: string; value: number }>;
  }>;

  // Quest progress
  questUpdates: Array<{
    questId: string;
    questName: string;
    previousProgress: number;
    newProgress: number;
    target: number;
    completed: boolean;
  }>;

  // Achievement unlocks
  achievementUnlocks: Array<{
    achievementId: string;
    achievementName: string;
    rarity: AchievementRarity;
    tier: number;
  }>;

  // Streak update
  streakUpdate: {
    maintained: boolean;
    currentStreak: number;
    freezeConsumed: boolean;
  } | null;

  // XP/Level changes
  progressionUpdate: {
    xpAdded: number;
    leveledUp: boolean;
    newLevel: number;
    tierAdvanced: boolean;
    newTier: string;
  } | null;

  // Season XP
  seasonUpdate: {
    seasonId: string;
    xpAdded: number;
    tierReached: number;
  } | null;

  // Leaderboard updates
  leaderboardUpdates: Array<{
    slug: string;
    newRank: number;
    previousRank: number | null;
    score: number;
  }>;

  // Processing metadata
  processingTimeMs: number;
  warnings: string[];
}
```

---

#### `evaluateRules`

Evaluate JSON Logic rules against an event payload. Utility function used internally but exposed for testing.

```typescript
import { evaluateRules } from '@mcv/engagement';

const result = evaluateRules({
  rules: { ">=": [{ "var": "payload.amount" }, 100] },
  data: {
    payload: { amount: 150, category: 'sports' },
    user: { level: 23, tier: 'silver' },
  },
});
// Returns: true
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `rules` | `Record<string, unknown>` | Yes | JSON Logic expression |
| `data` | `Record<string, unknown>` | Yes | Data context for evaluation |

**Returns:** `boolean`

---

#### `EngagementProcessor`

Streaming processor class for continuous Redpanda consumption.

```typescript
import { EngagementProcessor } from '@mcv/engagement';

const processor = new EngagementProcessor({
  brokers: ['redpanda:9092'],
  topic: 'mcv.engagement.raw',
  groupId: 'engagement-processor',
  concurrency: 12,          // One per partition
});

await processor.start();
// Processor runs continuously, calling processEngagementEvent for each message

// Graceful shutdown
await processor.stop();
```

---

## Economic Monitoring

### Service: `economic-service`

Monitors the point economy health, tracks inflation, and manages the Auto-Calibration System (ACS).

---

#### `getEconomicHealth`

Get the current economic health overview.

```typescript
import { getEconomicHealth } from '@mcv/engagement';

const health = await getEconomicHealth({
  ventureId: 'betedge',
  period: 'weekly',
});
```

**Returns:** `EconomicHealth`

```typescript
interface EconomicHealth {
  ventureId: string;
  period: string;
  totalInflow: number;
  inflowBreakdown: Array<{ source: string; amount: number; count: number }>;
  totalOutflow: number;
  outflowBreakdown: Array<{ sink: string; amount: number; count: number }>;
  netInflation: number;
  weekOverWeekChange: number;
  healthScore: number;          // 0-100
  regime: 'healthy' | 'inflationary' | 'deflationary' | 'critical';
  acsActive: boolean;
  currentMultiplier: number;
  sinkCostAdjustment: number;
  timestamp: string;
}
```

---

#### `getTapSinkReport`

Get a detailed inflow/outflow report.

```typescript
import { getTapSinkReport } from '@mcv/engagement';

const report = await getTapSinkReport({
  ventureId: 'betedge',
  from: '2026-02-01',
  to: '2026-02-09',
});
```

**Returns:** `TapSinkReport`

---

#### `getInflationMetrics`

Get week-over-week inflation tracking.

```typescript
import { getInflationMetrics } from '@mcv/engagement';

const metrics = await getInflationMetrics({ ventureId: 'betedge' });
```

**Returns:** `InflationMetrics`

---

#### `adjustMultipliers`

Manually adjust economic multipliers (or trigger ACS auto-adjustment).

```typescript
import { adjustMultipliers } from '@mcv/engagement';

await adjustMultipliers({
  ventureId: 'betedge',
  earnMultiplier: 0.8,      // Reduce earn rates by 20%
  sinkCostMultiplier: 1.1,  // Increase sink costs by 10%
  reason: 'Manual intervention: inflation trending up',
});
```

**Returns:** `MultiplierAdjustment`

---

#### `getEconomicHistory`

Get historical economic health snapshots.

```typescript
import { getEconomicHistory } from '@mcv/engagement';

const history = await getEconomicHistory({
  ventureId: 'betedge',
  days: 30,
});
```

**Returns:** `EconomicHealth[]`

---

## Fraud Detection

### Service: `scout-service`

ML-based anomaly detection and fraud prevention.

---

#### `ScoutAgent`

Anomaly detection agent class.

```typescript
import { ScoutAgent } from '@mcv/engagement';

const scout = new ScoutAgent({
  velocityThreshold: 100,      // Max events per minute per user
  anomalyModel: 'isolation-forest',
  alertWebhook: 'https://hooks.slack.com/...',
});

await scout.analyze(event); // Called internally by EngagementProcessor
```

---

#### `getAnomalyReport`

Get detected anomalies.

```typescript
import { getAnomalyReport } from '@mcv/engagement';

const report = await getAnomalyReport({
  ventureId: 'betedge',
  from: '2026-02-09T00:00:00Z',
  severity: 'high',
  limit: 50,
});
```

**Returns:** `AnomalyReport`

---

#### `getFraudAlerts`

Get active fraud alerts.

```typescript
import { getFraudAlerts } from '@mcv/engagement';

const alerts = await getFraudAlerts({
  ventureId: 'betedge',
  status: 'active',
  severity: 'critical',
  limit: 50,
});
```

**Returns:** `{ items: FraudAlert[], total: number }`

---

#### `resolveAlert`

Mark a fraud alert as resolved.

```typescript
import { resolveAlert } from '@mcv/engagement';

await resolveAlert({
  alertId: 'alert-uuid',
  resolution: 'false_positive',
  notes: 'User was legitimately active during weekend event.',
});
```

**Returns:** `FraudAlert`

---

## Types

### Core Types

```typescript
// ────────────────────────────────────────────────────
// Points
// ────────────────────────────────────────────────────

type PointCurrencyClass =
  | 'soft'      // Freely earned, freely spent (XP, Coins)
  | 'hard'      // Premium / purchased (Gems, Crystals)
  | 'medium'    // Earned slowly, spent on premium items
  | 'energy'    // Regenerating resource (Stamina, Action Points)
  | 'social'    // Earned through social actions (Reputation, Karma)
  | 'event'     // Event-specific, temporary currencies
  | 'token';    // Blockchain-backed (EDGE tokens)

type PointTransactionType =
  | 'earn'           // Points earned from action
  | 'spend'          // Points spent on reward/item
  | 'transfer_in'    // Received from another user
  | 'transfer_out'   // Sent to another user
  | 'convert'        // Converted to/from tokens
  | 'expire'         // Expired points removed
  | 'adjustment'     // Admin adjustment
  | 'lock'           // Points locked (escrow/staking)
  | 'unlock';        // Points unlocked

// ────────────────────────────────────────────────────
// Quests
// ────────────────────────────────────────────────────

type QuestType =
  | 'daily'       | 'weekly'     | 'monthly'
  | 'seasonal'    | 'milestone'  | 'chain'
  | 'hidden'      | 'community'  | 'onboarding';

type QuestStatus =
  | 'draft'       | 'scheduled'  | 'active'
  | 'paused'      | 'completed'  | 'expired'
  | 'archived';

// ────────────────────────────────────────────────────
// Achievements
// ────────────────────────────────────────────────────

type AchievementRarity =
  | 'common'      // 60%+ of users
  | 'uncommon'    // 30-60%
  | 'rare'        // 10-30%
  | 'epic'        // 3-10%
  | 'legendary'   // <3%
  | 'mythic';     // <0.5%

// ────────────────────────────────────────────────────
// Leaderboards
// ────────────────────────────────────────────────────

type LeaderboardPeriod =
  | 'daily' | 'weekly' | 'monthly' | 'seasonal' | 'all-time';

// ────────────────────────────────────────────────────
// Seasons
// ────────────────────────────────────────────────────

type SeasonStatus =
  | 'upcoming' | 'active' | 'ending_soon' | 'ended' | 'archived';

// ────────────────────────────────────────────────────
// Rewards
// ────────────────────────────────────────────────────

type RedemptionStatus =
  | 'pending' | 'processing' | 'fulfilled' | 'refunded' | 'failed';

// ────────────────────────────────────────────────────
// Fraud
// ────────────────────────────────────────────────────

type FraudAlertSeverity = 'low' | 'medium' | 'high' | 'critical';
```

### Shared Interfaces

```typescript
interface QuestReward {
  points: Array<{ type: string; amount: number }>;
  achievements?: string[];
  items?: Array<{ itemId: string; quantity: number }>;
  xp?: number;
  multiplier?: { type: string; value: number; durationHours: number };
}

interface EarnMultiplier {
  condition: Record<string, unknown>;  // JSON Logic
  multiplier: number;
  label: string;
}

interface QuestRequirement {
  action: string;
  target: number;
  filters?: Record<string, unknown>;
}

interface CompoundRequirement {
  operator: 'and' | 'or';
  conditions: Array<QuestRequirement | CompoundRequirement>;
}

interface AchievementTier {
  tier: number;
  name: string;
  target: number;
  rewards: QuestReward;
  iconUrl?: string;
}

interface SeasonRewardTier {
  tier: number;
  name: string;
  xpRequired: number;
  rewards: QuestReward;
  isExclusive: boolean;
}
```

---

## Zod Schemas

All input validation uses Zod. Key schemas:

```typescript
import { z } from 'zod';

// ────────────────────────────────────────────────────
// Engagement Event (input from ventures)
// ────────────────────────────────────────────────────

export const engagementEventSchema = z.object({
  id: z.string().uuid(),
  ventureId: z.string().min(1),
  userId: z.string().uuid(),
  type: z.string().min(1).max(100),
  payload: z.object({
    amount: z.number().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).default([]),
    metadata: z.record(z.unknown()).default({}),
  }),
  timestamp: z.string().datetime(),
  idempotencyKey: z.string().min(1).max(255),
});

// ────────────────────────────────────────────────────
// Award Points
// ────────────────────────────────────────────────────

export const awardPointsSchema = z.object({
  userId: z.string().uuid(),
  pointTypeSlug: z.string().min(1).max(50),
  amount: z.number().positive().max(1_000_000),
  sourceType: z.enum(['quest', 'achievement', 'earn', 'purchase', 'admin', 'referral']),
  sourceId: z.string().uuid().optional(),
  description: z.string().max(500).optional(),
  displayMessage: z.string().max(200).optional(),
  idempotencyKey: z.string().min(1).max(255),
  tenantId: z.string().uuid().optional(),
});

// ────────────────────────────────────────────────────
// Create Quest
// ────────────────────────────────────────────────────

export const createQuestSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  questType: z.enum(['daily', 'weekly', 'monthly', 'seasonal', 'milestone', 'chain', 'hidden', 'community', 'onboarding']),
  category: z.string().max(50).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  status: z.enum(['draft', 'scheduled', 'active']).default('draft'),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  recurrenceRule: z.string().max(200).optional(),
  requirements: z.object({
    action: z.string().min(1),
    target: z.number().positive(),
    filters: z.record(z.unknown()).optional(),
  }),
  compoundRequirements: z.lazy(() => compoundRequirementSchema).optional(),
  rewards: questRewardSchema,
  difficultyLevel: z.number().int().min(1).max(5).default(1),
  estimatedDurationMinutes: z.number().int().positive().optional(),
  xpValue: z.number().int().nonnegative().optional(),
  tierRequirement: z.number().int().min(1).optional(),
  maxCompletionsPerUser: z.number().int().positive().optional(),
  maxCompletionsGlobal: z.number().int().positive().optional(),
  cooldownHours: z.number().int().positive().optional(),
  tenantId: z.string().uuid().optional(),
});

// ────────────────────────────────────────────────────
// Create Achievement
// ────────────────────────────────────────────────────

export const createAchievementSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  flavorText: z.string().max(500).optional(),
  category: z.string().min(1).max(50),
  subcategory: z.string().max(50).optional(),
  rarity: z.enum(['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic']),
  requirements: z.record(z.unknown()),
  tiers: z.array(achievementTierSchema).optional(),
  rewards: questRewardSchema,
  xpValue: z.number().int().nonnegative(),
  iconUrl: z.string().url().optional(),
  lockedIconUrl: z.string().url().optional(),
  animationUrl: z.string().url().optional(),
  nftEnabled: z.boolean().default(false),
  isHidden: z.boolean().default(false),
  isSecret: z.boolean().default(false),
  showProgress: z.boolean().default(true),
  totalSupply: z.number().int().positive().optional(),
  prerequisiteAchievements: z.array(z.string()).optional(),
  tenantId: z.string().uuid().optional(),
});

// ────────────────────────────────────────────────────
// Redeem Reward
// ────────────────────────────────────────────────────

export const redeemRewardSchema = z.object({
  userId: z.string().uuid(),
  rewardId: z.string().uuid(),
  idempotencyKey: z.string().min(1).max(255),
  tenantId: z.string().uuid().optional(),
});

// ────────────────────────────────────────────────────
// Streak Activity
// ────────────────────────────────────────────────────

export const recordStreakSchema = z.object({
  userId: z.string().uuid(),
  activityType: z.string().min(1).max(50),
  tenantId: z.string().uuid().optional(),
});
```

---

## Events

All events are published to Redpanda topics. See the [Data Flow & Events](./02-TECHNICAL-ARCHITECTURE.md#data-flow--events) section for the full event architecture.

### Event Catalog

| Event | Topic | Description |
|-------|-------|-------------|
| `points.awarded` | `mcv.engagement.processed` | Points credited to user |
| `points.spent` | `mcv.engagement.processed` | Points deducted from user |
| `points.transferred` | `mcv.engagement.processed` | Points moved between users |
| `points.converted` | `mcv.engagement.processed` | Points bridged to tokens |
| `points.expired` | `mcv.engagement.processed` | Points expired |
| `quest.progress` | `mcv.engagement.processed` | Quest progress updated |
| `quest.completed` | `mcv.engagement.processed` | Quest requirements met |
| `quest.claimed` | `mcv.engagement.processed` | Quest reward claimed |
| `quest.expired` | `mcv.engagement.processed` | Quest expired uncompleted |
| `achievement.unlocked` | `mcv.engagement.achievements` | Achievement criteria met |
| `achievement.tier_up` | `mcv.engagement.achievements` | Multi-tier advancement |
| `achievement.nft_minted` | `mcv.engagement.achievements` | Achievement NFT minted |
| `streak.maintained` | `mcv.engagement.processed` | Streak continued |
| `streak.broken` | `mcv.engagement.processed` | Streak reset |
| `streak.at_risk` | `mcv.engagement.notifications` | Streak expiring soon |
| `streak.freeze_used` | `mcv.engagement.processed` | Freeze token consumed |
| `level.up` | `mcv.engagement.processed` | User leveled up |
| `tier.promoted` | `mcv.engagement.processed` | Tier advanced |
| `prestige.activated` | `mcv.engagement.processed` | Prestige reset |
| `season.tier_claimed` | `mcv.engagement.processed` | Season reward claimed |
| `season.started` | `mcv.engagement.processed` | Season activated |
| `season.ended` | `mcv.engagement.processed` | Season concluded |
| `leaderboard.updated` | `mcv.engagement.leaderboard` | Rank changed |
| `leaderboard.rotated` | `mcv.engagement.leaderboard` | Board reset |
| `reward.redeemed` | `mcv.engagement.processed` | Reward redeemed |
| `reward.fulfilled` | `mcv.engagement.processed` | Redemption fulfilled |
| `reward.refunded` | `mcv.engagement.processed` | Redemption refunded |
| `fraud.alert` | `mcv.engagement.notifications` | Anomaly detected |

### Event Payload Schema

All events follow a common envelope:

```typescript
interface EngagementEventEnvelope {
  id: string;               // UUID v7
  type: string;             // Event type (e.g., 'points.awarded')
  source: 'engagement';     // Always 'engagement'
  ventureId: string;        // Originating venture
  userId: string;           // Affected user
  timestamp: string;        // ISO-8601
  payload: Record<string, unknown>;  // Event-specific data
  correlationId: string;    // Links to originating EngagementEvent
}
```

---

## Error Codes

| Error Class | Code | HTTP Equiv | Description |
|-------------|------|------------|-------------|
| `InsufficientBalanceError` | `INSUFFICIENT_BALANCE` | 400 | User doesn't have enough points |
| `DailyCapExceededError` | `DAILY_CAP_EXCEEDED` | 400 | Daily earn limit reached |
| `MaxBalanceExceededError` | `MAX_BALANCE_EXCEEDED` | 400 | Would exceed max balance |
| `InvalidTransactionError` | `INVALID_TRANSACTION` | 400 | Transaction validation failed |
| `ConversionFailedError` | `CONVERSION_FAILED` | 502 | Token bridge failed |
| `QuestNotFoundError` | `QUEST_NOT_FOUND` | 404 | Quest does not exist |
| `QuestNotActiveError` | `QUEST_NOT_ACTIVE` | 400 | Quest is not currently active |
| `QuestAlreadyCompletedError` | `QUEST_ALREADY_COMPLETED` | 400 | Quest already completed |
| `QuestCooldownError` | `QUEST_COOLDOWN` | 429 | Cooldown period active |
| `QuestRequirementNotMetError` | `QUEST_REQUIREMENT_NOT_MET` | 400 | Requirements not satisfied |
| `MaxCompletionsReachedError` | `MAX_COMPLETIONS_REACHED` | 400 | Completion limit hit |
| `AchievementNotFoundError` | `ACHIEVEMENT_NOT_FOUND` | 404 | Achievement does not exist |
| `AchievementAlreadyUnlockedError` | `ACHIEVEMENT_ALREADY_UNLOCKED` | 400 | Already unlocked |
| `AchievementSupplyExhaustedError` | `ACHIEVEMENT_SUPPLY_EXHAUSTED` | 400 | No supply remaining |
| `NFTMintingFailedError` | `NFT_MINTING_FAILED` | 502 | Solana minting failed |
| `StreakAlreadyRecordedError` | `STREAK_ALREADY_RECORDED` | 400 | Activity already recorded today |
| `NoFreezeAvailableError` | `NO_FREEZE_AVAILABLE` | 400 | No freeze tokens remaining |
| `StreakExpiredError` | `STREAK_EXPIRED` | 400 | Grace period has passed |
| `LeaderboardNotFoundError` | `LEADERBOARD_NOT_FOUND` | 404 | Leaderboard does not exist |
| `LeaderboardRotationError` | `LEADERBOARD_ROTATION_FAILED` | 500 | Rotation job failed |
| `RewardNotFoundError` | `REWARD_NOT_FOUND` | 404 | Reward does not exist |
| `RewardOutOfStockError` | `REWARD_OUT_OF_STOCK` | 400 | No stock remaining |
| `RewardCooldownError` | `REWARD_COOLDOWN` | 429 | Cooldown active |
| `RedemptionNotFoundError` | `REDEMPTION_NOT_FOUND` | 404 | Redemption record not found |
| `FulfillmentFailedError` | `FULFILLMENT_FAILED` | 502 | Fulfillment service error |
| `SeasonNotActiveError` | `SEASON_NOT_ACTIVE` | 400 | Season not currently active |
| `SeasonTierAlreadyClaimedError` | `SEASON_TIER_ALREADY_CLAIMED` | 400 | Tier already claimed |
| `SeasonTierNotReachedError` | `SEASON_TIER_NOT_REACHED` | 400 | XP not sufficient for tier |
| `VelocityThresholdExceededError` | `VELOCITY_EXCEEDED` | 429 | Too many events too fast |
| `AnomalyDetectedError` | `ANOMALY_DETECTED` | 403 | Fraud detection triggered |

---

## Configuration

### Module Configuration

```typescript
// config.ts
export const engagementConfig = {
  // ── Event Processing ──
  redpanda: {
    brokers: process.env.REDPANDA_BROKERS?.split(',') ?? ['localhost:9092'],
    inputTopic: 'mcv.engagement.raw',
    outputTopic: 'mcv.engagement.processed',
    dlqTopic: 'mcv.engagement.dlq',
    consumerGroup: 'engagement-processor',
    partitions: 12,
  },

  // ── Redis ──
  redis: {
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    leaderboardPrefix: 'lb:',
    streakPrefix: 'streak:',
    idempotencyPrefix: 'idemp:',
    idempotencyTTL: 86400,  // 24 hours
  },

  // ── Streaks ──
  streaks: {
    defaultGraceHours: 36,
    atRiskThresholdHours: 4,
    maxFreezes: 3,
    freezeCost: 200,         // Points per freeze
    freezePointType: 'edge_points',
  },

  // ── Quests ──
  quests: {
    maxActivePerUser: 10,
    dailySlots: 3,
    weeklySlots: 5,
  },

  // ── Progression ──
  progression: {
    defaultXPCurve: {
      type: 'polynomial' as const,
      base: 100,
      exponent: 1.5,
      maxLevel: 100,
    },
    tierThresholds: {
      bronze: 1,
      silver: 11,
      gold: 26,
      platinum: 51,
      diamond: 76,
    },
    maxPrestige: 10,
    prestigeBonusPctPerLevel: 5,
  },

  // ── Economic Monitoring ──
  economics: {
    inflationThreshold: 0.15,   // 15% WoW triggers ACS
    deflationThreshold: -0.05,  // -5% WoW triggers boost
    healthScoreWeights: {
      tapSinkRatio: 0.4,
      inflationRate: 0.3,
      userActivity: 0.2,
      fraudRate: 0.1,
    },
  },

  // ── Fraud Detection ──
  fraud: {
    velocityThreshold: 100,   // Max events per minute per user
    anomalyModel: 'isolation-forest',
    alertSeverityThresholds: {
      low: 0.3,
      medium: 0.5,
      high: 0.7,
      critical: 0.9,
    },
  },

  // ── Token Bridge ──
  tokenBridge: {
    enabled: process.env.TOKEN_BRIDGE_ENABLED === 'true',
    solanaRpcUrl: process.env.SOLANA_RPC_URL!,
    nftCollectionAuthority: process.env.NFT_COLLECTION_AUTHORITY!,
  },
};
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `REDPANDA_BROKERS` | Yes | Comma-separated Redpanda broker addresses |
| `UPSTASH_REDIS_REST_URL` | Yes | Redis connection URL |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | Redis authentication token |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `TOKEN_BRIDGE_ENABLED` | No | Enable point-to-token conversion (default: false) |
| `SOLANA_RPC_URL` | No | Solana RPC endpoint (required if token bridge enabled) |
| `NFT_COLLECTION_AUTHORITY` | No | NFT collection authority keypair (required for NFT minting) |
| `OPENROUTER_API_KEY` | No | OpenRouter API key (for AI quest personalization) |

---

## Client Hooks

React hooks for client-side integration. All hooks use Supabase Realtime for live updates.

### `usePoints`

```typescript
import { usePoints } from '@mcv/engagement';

const { balance, transactions, isLoading, refetch } = usePoints({
  pointTypeSlug: 'edge_points',
  transactionLimit: 10,
});
// balance: PointBalance
// transactions: PointTransaction[]
```

### `useQuests`

```typescript
import { useQuests } from '@mcv/engagement';

const { activeQuests, dailyQuests, weeklyQuests, isLoading } = useQuests({
  questType: 'daily',
  includeProgress: true,
});
```

### `useAchievements`

```typescript
import { useAchievements } from '@mcv/engagement';

const { achievements, stats, isLoading } = useAchievements({
  filter: 'all',
  category: 'mastery',
});
// stats: { unlocked: 12, total: 50, completionPct: 24 }
```

### `useStreak`

```typescript
import { useStreak } from '@mcv/engagement';

const { streak, isAtRisk, checkIn, purchaseFreeze } = useStreak();
// streak: StreakStatus
// checkIn: () => Promise<RecordStreakResult>
// purchaseFreeze: () => Promise<{ freezesAvailable: number }>
```

### `useLeaderboard`

```typescript
import { useLeaderboard } from '@mcv/engagement';

const { rankings, myRank, isLoading, refetch } = useLeaderboard({
  slug: 'top-winners',
  period: 'weekly',
  limit: 100,
});
// rankings: LeaderboardEntry[]
// myRank: UserRankInfo
```

### `useProgression`

```typescript
import { useProgression } from '@mcv/engagement';

const { level, tier, xpProgress, prestige, isLoading } = useProgression();
// level: number
// tier: string
// xpProgress: { current: number, needed: number, percentage: number }
```

### `useRewards`

```typescript
import { useRewards } from '@mcv/engagement';

const { catalog, redemptions, redeem, isLoading } = useRewards({
  category: 'digital',
});
// catalog: Reward[]
// redeem: (rewardId: string) => Promise<RewardRedemption>
```

### `useSeason`

```typescript
import { useSeason } from '@mcv/engagement';

const { season, progress, rewardTrack, claimTier, isLoading } = useSeason();
// season: Season | null
// progress: UserSeasonProgress
// claimTier: (tier: number) => Promise<{ rewards: QuestReward }>
```

### `useEngagementEvents`

Subscribe to real-time engagement events for the current user.

```typescript
import { useEngagementEvents } from '@mcv/engagement';

const { events, lastEvent } = useEngagementEvents({
  eventTypes: ['achievement.unlocked', 'level.up', 'streak.at_risk'],
  onEvent: (event) => {
    if (event.type === 'achievement.unlocked') {
      showAchievementToast(event.payload);
    }
  },
});
```

---

*@mcv/engagement — Engagement & Gamification Domain*
