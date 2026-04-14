# @mcv/core-triangle

Typed HTTP clients for the MCV Core Triangle microservices.

| Service | Port (HTTP/gRPC) | Responsibility |
|---|---|---|
| Identity | 8080 / 50051 | Auth, RBAC, multi-tenant, compliance |
| Fabric | 8081 / 50052 | Event bus, audit, jobs, storage, realtime |
| Intelligence | 8082 / 50053 | AI gateway, RAG, agents |

## Install

Internal workspace package — consumed as `@mcv/core-triangle: "*"` via
npm workspaces. Any venture app in the monorepo can use it directly.

## Usage

```ts
import { createCoreTriangle, CoreNotAvailableError } from '@mcv/core-triangle';

const core = createCoreTriangle({
  getAuthToken: async () => (await clerk.getToken()) ?? null,
  ventureId: 'futurestate',
  baseUrls: {
    identity: process.env.VITE_MCV_CORE_IDENTITY_URL ?? '',
    fabric: process.env.VITE_MCV_CORE_FABRIC_URL ?? '',
    intelligence: process.env.VITE_MCV_CORE_INTELLIGENCE_URL ?? '',
  },
});

// RBAC
const check = await core.identity.can({ resource: 'epics', action: 'write' });
if (check.ok && check.data.allowed) { /* render editor */ }

// Publish event
await core.fabric.publish({
  topic: 'commerce.order.created',
  payload: { order_id, amount_cents },
});

// AI chat with RAG
const res = await core.intelligence.chat({
  messages: [{ role: 'user', content: 'summarize Q3' }],
  agent: 'athena',
  useRag: true,
});
if (res.ok) console.log(res.data.content);
```

## Graceful degradation

Every method returns `CoreResponse<T>` = `{ok: true, data}` | `{ok: false, error}`.
When a service is unreachable the error is `CoreNotAvailableError`. Callers
check `.ok` and fall back to legacy paths (Clerk+Supabase RLS, direct
Anthropic SDK, etc). Apps ship with zero Core Triangle URLs set and
continue to work.

## Consumers

- mcv-one-desktop (via `src/lib/mcv-core/` shim)
- FutureState (planned)
- BetEdge (planned)
- mcv.gg (planned)
- WarForge (planned)
