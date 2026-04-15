# MCV Capital Protocol (MCP-Capital) v0.1

**Status**: Draft
**Author**: Tony + NAOS
**Date**: 2026-04-15
**Supersedes**: nothing. This is new ground.

---

## Thesis

Capital formation is the last manually-reticulated market. Every other domain — payments (Stripe, Solana Pay), communications (Twilio, Matrix), identity (OIDC, DIDs), compute (Lambda, Vercel Functions), content (IPFS, ActivityPub) — has an **open protocol** that broke the gatekeeper cartel. Capital markets still run on transfer agents ($1-5K/yr per issuer), DocuSign ($40/envelope), NYSE/Nasdaq/CSE listings ($250K-$5M + years), ATS licensing, Reg-D-Form-D-filed-by-a-law-firm ($10-25K), and Carta-as-system-of-record ($2K-$25K/yr).

The entire stack is intermediation tax. It exists because no open protocol exists. The technology to obsolete every layer has existed since 2017 (ERC-20), matured in 2022 (cNFTs + SPL Token-2022 transfer hooks on Solana), and became regulatory-tractable in 2025 (SEC Reg CF $5M limit, CSA sandbox, MiCA in EU). The gap is standardization and a reference implementation aggressive enough to displace incumbents.

**MCV Capital Protocol is that standard.** It specifies:

1. **On-chain source of truth** for cap table, not a reflection of off-chain records
2. **Portable investor credentials** (Verifiable Credentials on DIDs) that work across every MCV venture and any third-party platform that adopts the spec
3. **Programmatic transfer compliance** via SPL Token-2022 transfer hooks (accreditation + jurisdiction + lockup enforced by the token itself)
4. **Open legal instruments** — SAFE, SAFT, hybrid-equity-token as reference smart agreements, MIT-licensed, governed by the MCV Capital Consortium
5. **Distribution rails** via existing `@mcv/ledger-sdk` + `@mcv/payments-sdk` — fiat AND crypto natively
6. **Legacy interop adapters** — DocuSign, Stripe, transfer agents, ATSs are bridged *into* the protocol, not integrated-with-as-peers

Everyone gets upgraded. The ones who refuse get bridged automatically so their workflows keep working while the data flows through us.

---

## Layer Map

```
┌─────────────────────────────────────────────────────────────┐
│  PROTOCOL LAYER (this spec)                                 │
│  - Cap table registry program (Solana)                       │
│  - Identity & accreditation credentials (DID + VC)           │
│  - Legal instrument templates (MIT)                          │
│  - Event schema (capital.*.* on Redpanda/Pub/Sub)            │
├─────────────────────────────────────────────────────────────┤
│  REFERENCE IMPLEMENTATION (what we ship)                    │
│  - @mcv/capital-sdk   (already v0.1)                         │
│  - @mcv/capital-kit   (NAOS tools, already v0.1)             │
│  - apps/launchpad     (public raise pages)                   │
│  - MCV Sign           (on-chain signature service)           │
│  - MCV Settlement     (USDC escrow + distribution program)   │
│  - MCV Secondary      (permissioned transfer program)        │
├─────────────────────────────────────────────────────────────┤
│  COMPATIBILITY / LEGACY ADAPTERS                            │
│  - DocuSign adapter   (mirror envelopes ↔ on-chain sigs)     │
│  - Stripe adapter     (ACH/wire ↔ USDC settlement)           │
│  - Transfer agent adapter (broadcast cap table to TAs)       │
│  - Carta export       (legacy reporting for investor LPs)    │
│  - ATS adapter        (secondary market interop)             │
├─────────────────────────────────────────────────────────────┤
│  PARTICIPATING PLATFORMS (interop)                          │
│  - Any launchpad, DEX, custodian, exchange, fund admin       │
│    that speaks MCP-Capital is automatically interoperable.   │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Primitives

### 1. Capital Entity (on-chain)

A `CapitalEntity` is a PDA-derived account on Solana representing a venture's cap structure. Fields:

```rust
pub struct CapitalEntity {
    pub entity_id: [u8; 32],           // off-chain-assigned venture ID
    pub issuer_authority: Pubkey,      // multisig (founders + MCV compliance co-signer)
    pub equity_token_mint: Pubkey,     // SPL Token-2022 with transfer hook extension
    pub warrant_token_mint: Option<Pubkey>,  // present only on hybrid rounds
    pub total_equity_shares: u64,      // post-round FDS
    pub compliance_registry: Pubkey,   // PDA storing accreditation + jurisdiction rules
    pub jurisdiction: u16,             // ISO 3166-1 numeric
    pub regulatory_framework: u8,      // enum: RegD506C / RegCF / MI45110 / ...
    pub closed_rounds: Vec<RoundRef>,
    pub open_round: Option<RoundRef>,
}
```

The cap table is *derived* from the token-2022 holder set + issuance history — not stored twice.

### 2. Round (on-chain + off-chain)

A `Round` is a *program-derived* escrow + mint schedule. The on-chain side handles: commitment intake, vesting, distribution, transfer restrictions. The off-chain side (our Supabase ledger) mirrors for query, analytics, UX.

```rust
pub struct Round {
    pub round_id: [u8; 32],
    pub entity: Pubkey,
    pub round_type: u8,                // SAFE / Priced / Token / Hybrid / ...
    pub raise_lane: u8,                // Equity / Token / Hybrid
    pub target_usd: u64,
    pub committed_usd: u64,
    pub funded_usd: u64,
    pub status: u8,
    pub open_ts: i64,
    pub close_ts: i64,
    pub deadline_ts: i64,
    pub min_check_usd: u64,
    pub max_check_usd: Option<u64>,
    pub valuation_cap_usd: Option<u64>,
    pub discount_bps: u16,
    pub escrow_account: Pubkey,        // USDC escrow PDA
    pub compliance_reqs: ComplianceReqs,
}
```

Commitments become `CommitmentReceipt` accounts on-chain — every commitment is a signed, timestamped, audit-trailed state transition. No Supabase row exists for a commitment without an on-chain counterpart (in v1.0+; v0.x ships Supabase-first with optional on-chain mirroring).

### 3. Investor Credential (DID + VC)

Each investor controls a `did:mcv:<pubkey>` identifier. Accreditation status is issued as a Verifiable Credential signed by an MCV-authorized verifier (initially Futurestate's existing KYC provider, later a federated set).

```json
{
  "@context": ["https://www.w3.org/2018/credentials/v1", "https://mcv.one/capital/v1"],
  "id": "urn:mcv:cred:01HN8...",
  "type": ["VerifiableCredential", "AccreditedInvestorCredential"],
  "issuer": "did:mcv:verifier:futurestate-kyc",
  "issuanceDate": "2026-04-15T18:22:00Z",
  "expirationDate": "2027-04-15T18:22:00Z",
  "credentialSubject": {
    "id": "did:mcv:investor:abc123...",
    "accreditationStatus": "verified_accredited",
    "jurisdiction": "US-CA",
    "verificationMethod": "income_200k_2yr",
    "kycLevel": "tier3"
  },
  "proof": { "type": "Ed25519Signature2020", "proofValue": "..." }
}
```

**The magic**: the same credential works on MCV Capital, Futurestate, any external launchpad, any secondary market that adopts the spec. Investor goes through KYC *once*.

### 4. Transfer Hook Program

SPL Token-2022 `transfer_hook` extension calls our on-chain `compliance_check` program on every transfer. It enforces:

- Buyer holds valid accreditation credential (if round required it)
- Buyer's jurisdiction not in `jurisdiction_restrictions`
- Seller isn't in a lockup window
- Transfer doesn't violate max_investors cap

Rejection at the token layer means no off-chain reconciliation ever diverges. The cap table is always correct *by construction*.

### 5. Event Schema

All protocol events published to `capital.*` topics following existing Redpanda/Pub/Sub convention:

```
capital.entity.created
capital.entity.authority_rotated
capital.round.created
capital.round.opened | closing | closed | funded | cancelled
capital.round.commitment_received
capital.round.commitment_signed
capital.round.commitment_funded
capital.round.distributed
capital.credential.issued | revoked | verified
capital.transfer.requested | approved | rejected
capital.secondary.match | settle
capital.compliance.check | block
```

Any MCP-Capital participant emits + consumes these. Third parties tap in with read-only subscriptions.

---

## Replacing the Old World

### Transfer Agents → MCV Registry

**What they do**: maintain the authoritative shareholder ledger, process transfers, file Form 1099s, handle dividends.

**Protocol replacement**: the SPL Token-2022 holder set IS the shareholder ledger. Transfers go through compliance program. Distributions are Solana transactions with automatic 1099-DIV/T5 export. Authority rotation = multisig key change, takes seconds.

**Cost**: $0 after our integration fee. Current TAs charge $1,000-5,000/year per issuer.

**Legacy bridge**: our `TransferAgentAdapter` publishes nightly snapshots in Carta CSV or SS&C format to any TA that wants a mirror — they keep their fee stream from legacy LPs who demand it, but the SOR is on-chain.

### DocuSign → MCV Sign

**What they do**: binding e-signature on PDFs. ESIGN + eIDAS compliant.

**Protocol replacement**: Ed25519 signature from the investor's DID-linked keypair, anchored to Solana, with a Merkle-committed PDF hash. Same legal weight under ESIGN (US), eIDAS (EU), ETA (Canada) — the statutes specify process (intent + consent + retention + integrity), not vendor.

**Cost**: $0 after protocol fee. DocuSign charges $40-60/envelope.

**Legacy bridge**: `DocuSignAdapter` wraps a real DocuSign envelope for counterparties who contractually require it. Envelope completion fires a webhook that anchors a hash on-chain — the legacy receipt PLUS the crypto receipt both exist.

### Regulated Secondary (ATS) → MCV Secondary

**What they do**: run a regulated venue for secondary trades of private securities. License costs $500K+, ongoing compliance is heavy.

**Protocol replacement**: permissioned DEX with compliance enforced at the transfer-hook layer. Any compatible wallet can make/take orders; the protocol rejects non-compliant matches at settlement.

**Cost**: Solana fees + protocol fee. ATS charges 1-3% + per-trade minimums.

**Legacy bridge**: `AtsAdapter` translates our order flow into the partner ATS's order types when holders want FINRA-reported secondary. Compliance check runs twice (ours + theirs).

### Stripe / Wire / ACH → MCV Settlement

**What they do**: move money. 2.9% + $0.30 or $25/wire.

**Protocol replacement**: USDC on Solana. Settlement in ~400ms. Fees under $0.001.

**Cost**: near-zero. Stripe fees round-trip are 50-100 bps.

**Legacy bridge**: `StripeAdapter` accepts cards/ACH/wire, converts via on-ramp (Stripe Crypto or partner), escrows USDC. Investor experience = Stripe; actual settlement = on-chain.

### Law Firm Form D / OM Drafting → MCV Instruments

**What they do**: draft SAFE, subscription agreement, Form D, Offering Memorandum, Form 45-106F9. $5-25K per round.

**Protocol replacement**: MIT-licensed smart agreement templates. Parametric: plug in cap, discount, valuation, jurisdiction — template compiles. Counsel reviews the template *once*, not every raise.

**Cost**: $0 per round after template signoff. Law firms bill $500-1000/hr currently.

**Legacy bridge**: partnered firm on retainer signs off on parameter ranges; raises within the range are pre-approved. Out-of-range raises still get custom review. Clerky / Stripe Atlas Legal can plug in as partner firms.

### Carta / Pulley → MCV Cap Table

**What they do**: spreadsheet-as-a-service with minor cap-table-aware features.

**Protocol replacement**: our on-chain registry + Capital UI + Capital SDK.

**Cost**: free tier for <25 investors (matches Carta Launch); protocol fee above.

**Legacy bridge**: CSV export in Carta format for LPs who still audit their positions via Carta.

---

## Adoption Ladder

We don't boil the ocean. We ship in layers and force-multiply each.

### Layer 0 — Internal (shipped in v0.1)
MCV ventures run on the protocol. Every raise across the 7-venture portfolio dogfoods it.

### Layer 1 — FutureState dogfood
FutureState's RWA raises migrate to MCV Capital. Compliance still flows through Futurestate's NI 45-106 stack (which is already production-grade) — Capital just consumes the credential.

### Layer 2 — Invited launchpad (closed beta)
Hand-picked startups (Tony's network) raise on `launchpad.mcv.one` with 3-lane selection. We run legal review inline. Each raise becomes a case study.

### Layer 3 — Public launchpad (v1.0 release)
Self-serve. Legal templates pre-audited. Protocol fee is the revenue model.

### Layer 4 — Protocol adoption by third parties
Other launchpads (Republic, Wefunder, Wefunder-equivalents) integrate for interop. Their users can hold MCP-Capital-compatible credentials. They pay protocol fee → network effect.

### Layer 5 — Legacy capitulation
Transfer agents, ATSs, and Carta ship MCP-Capital connectors because their customers demand it. They become distribution channels for us, not competitors.

### Layer 6 — Regulatory recognition
SEC / CSA / MiCA notice-and-comment filings to formalize transfer-hook compliance as equivalent to traditional transfer agent reporting. This is a 2-3 year play but inevitable once Layer 4-5 has volume.

---

## The MCV Capital Consortium

Protocol governance lives in the MCV Capital Consortium — a non-profit (Swiss Verein structure likely) whose members include:

- MCV Global Consortium (initial steward)
- Protocol-adopting launchpads + DEXs
- Participating law firms
- Participating auditors
- Investor associations

Consortium votes (token-weighted via staked EDGE + qualified-majority) on protocol upgrades, reference-implementation changes, and legal template amendments.

Reference implementation stays MIT. Consortium fees (protocol fee on primary + secondary) fund ongoing development + legal counsel + regulatory engagement.

---

## Immediate Implementation Priorities

Ordered so each step is independently valuable:

1. **`apps/launchpad/` Next.js scaffold** — the public interface of the protocol. Reads from `capital_rounds.is_public` + `_investor_profile`. Can ship with zero on-chain code using v0.1 SDK.
2. **MCV Sign v0 (off-chain)** — Ed25519 signature via Clerk + Solana wallet, PDF hash anchored to Supabase (not yet on-chain). Ships immediately, upgrades to on-chain anchoring when layer matures. Legacy bridge to DocuSign for counterparties who require it.
3. **MCV Settlement v0** — USDC receiver + manual Stripe fallback. `record_payment` already in v0.1 capital-kit; this swap-in adds the USDC rail.
4. **Portable Investor Credential v0** — issue VC from Futurestate compliance tier, store in `capital_investor_profile.metadata.vc`. Verify on commit. Don't yet require DID — use Clerk user ID with VC embedding.
5. **On-chain Cap Table v1** — Anchor program + IDL + TypeScript client. This is the 3-6 month heavy lift. Until then, Supabase is system-of-record with nightly snapshots committed to Solana as Merkle roots (cheap, auditable).
6. **Transfer Hook Program v1** — SPL Token-2022 compliance hook. Blocked on Layer 5 on-chain Cap Table.
7. **Interop Adapters** — DocuSign, Stripe, Carta, transfer agent bridges. Each is a kit; any of them can ship independently.

---

## Why This Wins

- **Network effects**: every credential issued works on more platforms as adoption grows. Investors push their portfolio companies to adopt.
- **Regulatory judo**: we're more compliant than the incumbents (immutable audit trail, real-time transfer compliance) while also being faster/cheaper. Regulators prefer us on the merits.
- **Open source**: can't be disintermediated. Community owns the templates, protocol, event schema. We own the reference implementation + consortium seat.
- **Revenue flywheel**: primary fees → secondary fees → protocol fees from adopters → consortium dues → all reinforce the same standard.
- **Zero migration cost for issuers**: our Interop Adapters mean an issuer's LPs still see Carta reports, still sign DocuSign PDFs, still get wire instructions — while the SOR silently shifts to us.

---

## References

- SEC Regulation D: https://www.sec.gov/answers/rule506.htm
- Regulation CF (Crowdfunding): https://www.sec.gov/education/capitalraising/building-blocks/reg-crowdfunding
- CSA NI 45-106 (Canada): https://www.osc.ca/en/securities-law/instruments-rules-policies/4/45-106
- SPL Token-2022 Transfer Hooks: https://spl.solana.com/token-2022/extensions#transfer-hook
- W3C Verifiable Credentials: https://www.w3.org/TR/vc-data-model-2.0/
- W3C DID Core: https://www.w3.org/TR/did-core/
- Solana Anchor Framework: https://www.anchor-lang.com/
- MiCA (EU): https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32023R1114
- US ESIGN Act: 15 U.S.C. §§ 7001-7006
- EU eIDAS: Regulation (EU) No 910/2014
