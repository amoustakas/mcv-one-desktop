# @mcv/web3-core — Web3 Economy Manager
## Modular Platform for Launching, Managing & Evolving Token Ecosystems

**Package:** `@mcv/web3-core`  
**Classification:** INTERNAL (MCV-Only)  
**Status:** CANONICAL SPECIFICATION  
**Quality Level:** SURGICAL (800+ lines)

---

## 1. Executive Summary

The **Web3 Economy Manager** is the infrastructure foundation for all tokenized ventures within the MCV Global Consortium. It provides a standardized framework for designing tokenomics, orchestrating Token Generation Events (TGE), and managing live economies via the **Algorithmic Control System (ACS v2.0)**.

Rather than building custom blockchain logic for each venture, this module provides an "Economy Studio" that abstracts blockchain complexity (Solana/EVM) into business-level operations.

### Key Capabilities
- **Economy Studio:** No-code/low-code configuration of token supply, allocations, and vesting.
- **Launch Pipeline:** A strictly governed state machine managing the journey from Discord building to DEX listing.
- **ACS v2.0:** Automated optimization of 16 economic controllers across 5 market cap regimes.
- **Unified Treasury:** Multi-sig management of token reserves and DeFi positions.

---

## 2. Strategic Position

The Web3 Core acts as the "Economic Brain" that converts user engagement (from `@mcv/engagement`) into cryptographic value.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         VENTURE INTEGRATIONS                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  BETEDGE AI  │  │ MCV STUDIOS  │  │  FUTURESTATE │  │  CLIENT XYZ  │    │
│  │ (EDGE Token) │  │ (EDGE Token) │  │ (STATE Token)│  │ (White-Label)│    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
└─────────┼─────────────────┼─────────────────┼─────────────────┼─────────────┘
          │                 │                 │                 │
          ▼                 ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         @mcv/web3-core (The SDK)                            │
│                                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌─────────────────────────┐│
│  │   ECONOMY  │  │   LAUNCH   │  │   ALGO.    │  │      TREASURY           ││
│  │   STUDIO   │  │  PIPELINE  │  │  CONTROL   │  │      MANAGER            ││
│  └────────────┘  └────────────┘  └────────────┘  └─────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                      BLOCKCHAIN ABSTRACTION LAYER                       ││
│  │             Solana (Primary) • EVM (Planned) • Wallets                  ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└──────────────────────┬──────────────────────────────────┬────────────────────┘
                       │                                  │
                       ▼                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  @mcv/kernel (Database)  │  @mcv/engagement (Input)  │  Solana Program (SPL)│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Core Concepts

### 3.1 The Multi-Tenant Economy Model
The system supports multiple distinct token economies. Each economy is a isolated namespace with its own:
- **Token Mint Address:** (e.g., EDGE on Solana).
- **Allocation Buckets:** (Team, Treasury, Community, Rewards).
- **Vesting Schedules:** Immutable release timelines.

### 3.2 Token Launch Pipeline (5 Phases)
Every economy managed by MCV.ONE must pass through the following governed phases:

| Phase | Title | Milestone |
|-------|-------|-----------|
| **1** | Community Building | Twitter/Discord growth targets met. |
| **2** | Points Accumulation | Pre-TGE engagement points earned by users. |
| **3** | Private Round | SAFT execution and legal compliance checks. |
| **4** | Public Prelaunch | Whitelist verification and KYC/AML gating. |
| **5** | TGE | Token generation, Airdrop, and DEX Liquidity. |

### 3.3 Algorithmic Control System (ACS v2.0)
The ACS automatically adjusts economic parameters to maintain health. It monitors **Market Cap Regimes**:
1.  **Launch (<$50M):** Aggressive growth, high staking APY.
2.  **Growth ($50M-$250M):** Balanced expansion.
3.  **Scale ($250M-$1B):** Sustainable optimization.
4.  **Mature ($1B-$5B):** Stability and low inflation.
5.  **Mega (>$5B):** Governance-led minimal changes.

---

## 4. Database Schema (Drizzle ORM)

Located in `packages/@mcv/db/src/schema/web3/`.

```typescript
// packages/@mcv/db/src/schema/web3/economy.ts

import { pgTable, uuid, text, jsonb, timestamp, boolean, numeric, integer } from 'drizzle-orm/pg-core';
import { ventures, organizations } from '../core';

/**
 * Token Economy: The top-level definition of a venture's economic system.
 */
export const tokenEconomies = pgTable('web3_token_economies', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  slug: text('slug').notNull().unique(), // 'edge', 'state'
  name: text('name').notNull(),
  
  // Economic Config
  totalSupply: numeric('total_supply', { precision: 30, scale: 0 }).notNull(),
  decimals: integer('decimals').default(9),
  symbol: text('symbol').notNull(),
  
  // Status & Governance
  status: text('status', { enum: ['draft', 'planning', 'pre_tge', 'active', 'mature'] }).default('draft'),
  governanceType: text('governance_type', { enum: ['centralized', 'dao', 'hybrid'] }).default('centralized'),
  
  // Metadata
  config: jsonb('config').$type<any>(), // Allocation rules, vesting schedule
  createdAt: timestamp('created_at').defaultNow(),
});

/**
 * Token Allocations: Defining how the supply is split.
 */
export const tokenAllocations = pgTable('web3_token_allocations', {
  id: uuid('id').primaryKey().defaultRandom(),
  economyId: uuid('economy_id').notNull().references(() => tokenEconomies.id),
  name: text('name').notNull(), // 'Community Rewards', 'Treasury'
  percentage: numeric('percentage', { precision: 5, scale: 2 }).notNull(),
  vestingMonths: integer('vesting_months').default(0),
  cliffMonths: integer('cliff_months').default(0),
  remainingAmount: numeric('remaining_amount', { precision: 30, scale: 0 }),
});

/**
 * Wallets: User wallet association across chains.
 */
export const userWallets = pgTable('web3_user_wallets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  chain: text('chain', { enum: ['solana', 'ethereum', 'base'] }).notNull(),
  address: text('address').notNull(),
  isPrimary: boolean('is_primary').default(false),
  verifiedAt: timestamp('verified_at'),
});
```

---

## 5. TypeScript Interfaces

```typescript
// @mcv/web3-core/types.ts

export interface MarketCapState {
  marketCapUSD: number;
  currentRegime: 'launch' | 'growth' | 'scale' | 'mature' | 'mega';
  tokenPrice: number;
  circulatingSupply: string;
}

export interface ACSAdjustment {
  controller: string; // e.g., 'staking_apy'
  oldValue: number;
  newValue: number;
  reason: string;
  autoApplied: boolean;
}

export interface LaunchPipelineStatus {
  phase: number;
  completionPercentage: number;
  blockers: string[];
  checklist: {
    id: string;
    task: string;
    completed: boolean;
  }[];
}
```

---

## 6. Logic Flow: The Launch Pipeline

The `LaunchPipelineService` ensures no token is generated without rigorous compliance checks.

### 6.1 State Machine logic (XState Pattern)
```typescript
// @mcv/web3-core/services/launch-pipeline.ts

export class LaunchPipelineService {
  async runTgeChecklist(economyId: string) {
    const checks = await Promise.all([
      this.checkContractsDeployed(economyId),
      this.checkLegalAuditPassed(economyId),
      this.checkLiquidityReady(economyId),
      this.checkMerkleTreeGenerated(economyId)
    ]);

    const isReady = checks.every(c => c.passed);
    
    if (!isReady) {
      throw new Error(`TGE Blocked: ${checks.find(c => !c.passed)?.reason}`);
    }

    return this.initiateTGE(economyId);
  }
}
```

---

## 7. Algorithmic Control (16 Controllers)

The ACS manages 4 categories of controllers:

1.  **Emission Controllers:** Adjust the flow of rewards to users.
2.  **Staking Controllers:** Tune the APY and lock periods.
3.  **Utility Controllers:** Adjust fees and access thresholds.
4.  **Governance Controllers:** Change quorum and proposal rules.

### Regime Preset Table (Example)
| Parameter | Launch (<$50M) | Scale ($250M+) |
|-----------|----------------|----------------|
| Staking APY | 25% | 8% |
| Quest Multiplier | 2.0x | 1.0x |
| Burn Rate | 1% | 2.5% |
| Proposal Quorum | 5% | 12% |

---

## 8. Blockchain Connectivity (Solana)

`@mcv/web3-core` uses a dedicated `SolanaAdapter` for high-speed transactions.

```typescript
// Example: Batch Transfer for Rewards
async function batchTransfer(tokens: TransferRequest[]) {
  const connection = new Connection(process.env.SOLANA_RPC_URL!);
  const transaction = new Transaction();
  
  for (const t of tokens) {
    transaction.add(
      createTransferInstruction(t.from, t.to, t.owner, t.amount)
    );
  }
  
  return connection.sendTransaction(transaction, [payer]);
}
```

---

## 9. Security & Compliance

### 9.1 Wallet Risk (Scout Pods)
Every connected wallet is scanned by the **Security Scout** for:
- **Sanctions:** Check against OFAC and global lists.
- **Mixers:** History of interaction with Tornado Cash or similar.
- **High Risk:** Association with known exploit addresses.

### 9.2 Audit Trail
Every economic parameter change (ACS or Manual) is recorded in the `web3_audit_trail` table with:
- `actor_id`: The agent or user who made the change.
- `rationale`: The LLM reasoning for the adjustment.
- `prev_state` / `new_state`: JSON diff of the change.

---

## 10. Dependencies

| Package | Purpose |
|---------|---------|
| `@mcv/kernel` | Database and logging foundation |
| `@solana/web3.js` | Solana blockchain interface |
| `@solana/spl-token` | SPL token logic |
| `xstate` | Launch pipeline management |
| `tweetnacl` | Cryptographic signing for wallet verification |

---

*MCV Global Consortium — Web3 Core Specification v3.2*
