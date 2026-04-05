# ADR-008: Web3 Wallet Integration (Solana-First)

**Status:** APPROVED
**Date:** March 10, 2026
**Deciders:** Architecture Team, Web3 Team
**Context:**
MCV.ONE supports Web3 functionality across multiple ventures: EDGE token (BetEdge + EdgeIQ), NFTs (MCV Studios), and RWA tokenization (Futurestate). Wallet integration is required for token management, staking, governance, and marketplace transactions.

**Problem:**
1. **Multi-chain future:** Starting with Solana but may expand to EVM chains.
2. **User experience:** Non-crypto users must not be blocked by wallet complexity.
3. **Security:** Custodial vs non-custodial tradeoffs for different user segments.
4. **Regulatory:** KYC requirements for token transactions in regulated jurisdictions.

**Decision:**
We adopt a **Solana-first, multi-chain-ready** approach using the Solana Wallet Adapter with an abstraction layer (`@mcv/web3-core/wallets`) that supports future EVM integration.

**Wallet Strategy (Tiered):**

| Tier | User Type | Wallet Type | Implementation |
|------|-----------|-------------|----------------|
| 1 | Crypto-native | Non-custodial (Phantom, Solflare) | Solana Wallet Adapter |
| 2 | Mainstream | Embedded wallet (MPC) | Privy or Dynamic.xyz |
| 3 | Enterprise | Custodial (Fireblocks) | Fireblocks SDK (treasury) |
| 4 | Observer | No wallet needed | View-only, fiat on-ramp via Stripe |

**Architecture:**
```typescript
// @mcv/web3-core/wallets — abstraction layer
interface WalletProvider {
  connect(): Promise<WalletConnection>;
  disconnect(): Promise<void>;
  signTransaction(tx: Transaction): Promise<SignedTransaction>;
  signMessage(message: Uint8Array): Promise<Uint8Array>;
  getBalance(): Promise<bigint>;
  chain: 'solana' | 'ethereum' | 'polygon';  // Extensible
}
```

**Solana Programs (Anchor Framework):**
- EDGE Token (SPL Token-2022 with transfer hooks)
- Staking Program (locked staking with time-weighted rewards)
- Governance Program (EDGE-weighted voting)
- Marketplace Program (escrow-based pick trading)
- Pick Verification Program (on-chain attestation)

**KYC Integration:**
- Wallet ↔ KYC linking: Wallet address registered after KYC approval
- Transaction monitoring: Compliance engine screens outbound transfers
- Jurisdiction gating: Web3 features disabled in restricted jurisdictions

**Consequences:**
- Positive: Solana's speed (400ms finality) and low fees ($0.00025) suit high-frequency operations
- Negative: Solana ecosystem is smaller than EVM; occasional network instability
- Future: EVM bridge via Wormhole when Futurestate RWA module launches
