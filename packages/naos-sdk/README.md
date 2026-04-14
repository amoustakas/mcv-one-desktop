# @mcv/naos-sdk

NAOS (Neural Agentic Operating System) — **Living Agent Civilization** primitives, extracted
as a framework-agnostic SDK so any MCV venture app (or third-party) can host an agent roster
with identity, personality, emotional state, authority tiers, and cultural math.

Pure domain logic. Zero runtime deps. No Supabase, no Clerk, no Zustand — the host app wires
persistence and reactivity at the edges.

## What's in here

| Module | Responsibility |
|---|---|
| `types` | Canonical type system — agent identity, personality matrix, emotional state, authority tiers, outcomes, predictions. |
| `genesis` | Agent creation — personality seeding, name generation, archetype templates. |
| `evolution` | Personality/competence drift from interaction outcomes. Bounded guardrails (5–95). |
| `prediction` | Outcome prediction based on personality + context. |
| `authority` | Tier-based autonomy decisions — can this agent act without human approval? |
| `resonance` | Emotional contagion between agents. |
| `culture` | Org-wide mood/collaboration/autonomy aggregates. |
| `prompt-compiler` | Personality → system-prompt fragment for LLM calls. |
| `registry` | Runtime-queryable agent registry. |
| `seed-csuite` | Built-in C-suite roster (CEO proxy, CTO, CMO, COO, CFO). |
| `agents/*` | Nine-agent starter kit (Aegis, Forge, Ledger, Herald, Oracle, Shield, Scribe, Director, Sentinel). |

## What stays in the host app

- `runtime.ts` — LLM streaming orchestration, kit routing, store integration (Zustand).
- `personality-compiler.ts` — store-shaped personality → prompt (different type shape than
  `types.ts`; app-specific).
- Supabase persistence of agents, outcomes, cultural snapshots (app boundary).
- Clerk user context (app boundary).

## Consumption

```ts
import {
  type AgentIdentity,
  type PersonalityMatrix,
  compilePersonalityPrompt,
} from '@mcv/naos-sdk';

import { builtinAgents } from '@mcv/naos-sdk/agents';
import { seedCSuite } from '@mcv/naos-sdk/seed-csuite';
```
