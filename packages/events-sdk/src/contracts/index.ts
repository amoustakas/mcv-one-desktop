// packages/events-sdk/src/contracts/index.ts
//
// Combined contract bundle. Import `ALL_CONTRACTS` to build a ContractRegistry
// that knows about every module's emissions + subscriptions.

import type { ContractDeclaration } from '../types.js';
import { FoundationContract } from './foundation.js';
import { CapitalContract } from './capital.js';
import { CommerceContract } from './commerce.js';
import { McvSignContract } from './mcv-sign.js';
import { AgenticContract } from './agentic.js';

export { FoundationContract, CapitalContract, CommerceContract, McvSignContract, AgenticContract };

export const ALL_CONTRACTS: ReadonlyArray<ContractDeclaration> = [
  FoundationContract,
  CapitalContract,
  CommerceContract,
  McvSignContract,
  AgenticContract,
];
