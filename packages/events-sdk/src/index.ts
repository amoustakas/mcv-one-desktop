// packages/events-sdk/src/index.ts
//
// Top-level barrel. Consumers can either import from the root or use the
// subpath exports declared in package.json for narrower bundles.

export * from './types.js';
export {
  assertValidTopic,
  envelopeToInsert,
  makeEnvelope,
  randomUuid,
  rowToEnvelope,
  topicMatches,
} from './envelope.js';
export { createPublisher, type EventPublisher, type PublisherOptions } from './publisher.js';
export {
  createSubscriber,
  type EventSubscriber,
  type SubscriberOptions,
  type SubscribeOptions,
} from './subscriber.js';
export {
  createContractRegistry,
  registerContracts,
  type ContractRegistry,
  type CreateContractRegistryOptions,
} from './registry.js';
export { createReplayService, type ReplayOptions, type ReplayService } from './replay.js';
export {
  createDeadLetterService,
  type DeadLetterService,
  type ListDeadLettersFilters,
  type RecordDeadLetterInput,
} from './dead-letter.js';

export {
  ALL_CONTRACTS,
  FoundationContract,
  CapitalContract,
  CommerceContract,
  McvSignContract,
} from './contracts/index.js';
