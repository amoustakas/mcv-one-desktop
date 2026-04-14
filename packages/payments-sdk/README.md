# @mcv/payments-sdk

Unified payment rails for MCV venture apps. Smart router + four processors.

## Rails

| Processor | Rails | Speed | Reliability | Compliance |
|---|---|---|---|---|
| **stripe** | card, ACH, SEPA, Apple/Google Pay + Connect marketplace | 2-3 days | 0.95 | 1.00 |
| **plaid** | direct bank ACH (debit + credit) | 3-5 days | 0.92 | 0.98 |
| **solana** | Solana Pay (SOL / USDC / EDGE) | ~400ms | 0.70 | 0.60 |
| **credits** | internal ledger debit | instant | 1.00 | 0.90 |

## Usage

```ts
import { PaymentRouter } from '@mcv/payments-sdk';

const router = new PaymentRouter();
const decision = await router.route({
  amount: 125.00,
  currency: 'USD',
  method: 'ach',            // or null to let the router pick
  ventureId: 'futurestate',
  customerId: 'user_abc',
  customerCountry: 'US',
  description: 'RWA subscription',
  metadata: { plaid_item_id, account_id },
});
```

## Backend requirement

Every processor (except credits) proxies through server endpoints:
- `/api/stripe` — card/ACH/SEPA + Connect marketplace routing
- `/api/plaid` — ACH transfer authorize + create + status
- `/api/solana-refund` — treasury-signed on-chain refunds

MCV Desktop ships these. Other venture apps either (a) proxy to MCV
Desktop's API, or (b) implement compatible endpoints. Processor
implementations use relative URLs (`fetch('/api/stripe')`) so both work.

## Smart routing weights

The router scores candidates across 5 factors with these weights:
- cost: 0.35
- speed: 0.20
- reliability: 0.20
- compliance: 0.10
- preference: 0.15

## Stripe Connect destination charges

When `metadata.venture_id` maps to a `venture_stripe_accounts` row with
`charges_enabled=true`, `/api/stripe` create-payment auto-injects
`transfer_data[destination]` + `application_fee_amount` from
`application_fee_bps`. Zero extra config on the client side.
