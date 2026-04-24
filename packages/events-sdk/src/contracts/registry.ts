// packages/events-sdk/src/contracts/registry.ts
//
// Phase-1 Intelligence Router extension point.
//
// `contracts/index.ts` holds the canonical base set — 7 static imports that
// belong to other modules (foundation, capital, commerce, mcv-sign, agentic,
// onboarding, identity). Future sessions that introduce new contract modules
// SHOULD add their registration HERE instead of editing `index.ts`. That
// way `index.ts` stays owned by the Phase-0/M4 lineage while this file
// grows with each new marathon.
//
// The `knowledge.ts` contract is ALSO registered in `index.ts` via a
// one-line addition (authorized by Tony during Phase-1 planning) so
// that `ALL_CONTRACTS` — the canonical base array — includes it. That
// belt+suspenders wiring means:
//
//   • consumers of ALL_CONTRACTS pick up knowledge.* automatically
//   • consumers of ALL_CONTRACTS_WITH_EXTENSIONS pick up knowledge.*
//     PLUS any future contracts added here
//   • future contracts added here don't need to touch `index.ts`
//
// Convention going forward:
//
//   Phase-N ships contract X:
//     1. Create contracts/X.ts (typed contract file)
//     2. Append to registry.ts here (two lines: import + array entry)
//     3. DO NOT edit index.ts — leave it frozen
//     4. Callers that want X in ALL_CONTRACTS request a follow-up
//        session to batch-graduate registry entries into index.ts.

import type { ContractDeclaration } from '../types.js';
import { ALL_CONTRACTS } from './index.js';
import { KnowledgeContract } from './knowledge.js';

/**
 * Superset of ALL_CONTRACTS plus Phase-1+ additions registered here.
 *
 * Use this when you want the full universe of contracts (cockpits,
 * contract-drift CI checks, the events-sdk registry boot). Use
 * ALL_CONTRACTS when you specifically want the frozen base set.
 */
export const ALL_CONTRACTS_WITH_EXTENSIONS: ReadonlyArray<ContractDeclaration> = [
  ...ALL_CONTRACTS,
  // Phase-1 — knowledge.* (Intelligence Router)
  // Also mirrored into contracts/index.ts ALL_CONTRACTS per Tony's
  // "all of the above" authorization during Phase-1 planning.
  KnowledgeContract,
];

export { KnowledgeContract };
