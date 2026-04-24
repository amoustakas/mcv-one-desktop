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
import { OnboardingContract } from './onboarding.js';
import { IdentityContract } from './identity.js';
import { KnowledgeContract } from './knowledge.js';

export { FoundationContract, CapitalContract, CommerceContract, McvSignContract, AgenticContract, OnboardingContract, IdentityContract, KnowledgeContract };

export const ALL_CONTRACTS: ReadonlyArray<ContractDeclaration> = [
  FoundationContract,
  CapitalContract,
  CommerceContract,
  McvSignContract,
  AgenticContract,
  OnboardingContract,
  IdentityContract,
  KnowledgeContract,
];
