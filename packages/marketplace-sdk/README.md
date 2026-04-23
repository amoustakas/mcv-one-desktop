# @mcv/marketplace-sdk

Institutional-grade TypeScript SDK for the MCV ecosystem. Powers Futurestate
RWA trading, MCV.ONE + MCV.GG utility tokens, STATE compliance pipeline,
ZTAG governance, UWG commission DAG, and the full GCP + Solana settlement
substrate.

Spec source of truth: [MCV_MASTER_SPEC.md](../../.docs/marketplace-spec.md)
(originally `c:\Users\moust\mcv-marketplace\MCV_MASTER_SPEC.md`, absorbed
into this workspace per the MVP pipeline blueprint Wave 2).

## Architecture anchors

- **Substance Over Form** — legal entity, on-chain account, and cryptographic
  proof are treated as one inseparable triple.
- **Biometric Core-Triangle** — ZKP middleware gating every `MCVClient`
  instantiation: Sumsub (Liveness) → WebAuthn (Commit) → Apple App Attest
  (Settle) → BioCatch (Activate).
- **Dual-Standard Web3** — Original SPL for `MCV.ONE` + `MCV.GG` utility
  tokens (Mint/Freeze authorities revoked); Token-2022 for `STATE` RWA
  tokens (Transfer Hooks + Permanent Delegate + DefaultAccountState=Frozen).
- **ZTAG doctrine** — Humans propose. Algorithms govern. Cryptography audits.
  Every ACS parameter change hash-chained to Apache Iceberg.

## Defensive invariants (enforced on every diff)

1. All monetary math uses `bn.js` u128 with 10^18 scaling. No `parseFloat`
   on balances. No native `Number` arithmetic.
2. All order IDs are UUIDv7 (time-ordered).
3. All Solana transactions carry `validUntilSlot` + `slippageTolerance`
   (Firedancer Verification Lag mitigation).
4. All inter-service calls use gRPC. REST only behind Apigee on public edge.
5. All ZTAG state changes stream to Iceberg hash-chained.
6. All program deployments reproducible via `solana-verify`.
7. All HSM-signed operations run inside Confidential Space when feasible.
8. All commission paths are Kani-style invariant-verified.
9. All RWA mints carry a legal-wrapper PDA.
10. No EVM artifacts anywhere (`ethers`, `viem`, `secp256k1`, `ERC-4337`).

## Phase status

- **Phase 1** — Foundational setup + Biometric Core-Triangle ✓ (this scaffold)
- **Phase 2** — Dual-Standard Token Engine (SPL + Token-2022 with Transfer
  Hooks, Permanent Delegate, DefaultAccountState=Frozen) — pending
- **Phase 3** — ZTAG + ACS v2.0 + UWG Commission DAG — pending
- **Phase 4** — HFT Execution + DLMM Yield Sweeping + FIX 4.4/5.0 — pending
- **Phase 5** — Hardware Oracles + AI Underwriting + Circuit Breakers — pending
- **Phase 6** — Terraform infra (Spanner, Bigtable, KMS, Confidential Space) — pending

## Usage

Consumers import via subpath exports:

```ts
import type { AssetType, Order, ExemptionTier } from '@mcv/marketplace-sdk/types';
import { MCVClient } from '@mcv/marketplace-sdk/core/mcv-client';
import { AuthRouter } from '@mcv/marketplace-sdk/core/auth-router';
```
