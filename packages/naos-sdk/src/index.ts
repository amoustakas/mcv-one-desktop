// @mcv/naos-sdk — NAOS Living Agent Civilization primitives.
//
// Pure domain logic: identity, personality, authority, evolution, culture.
// No persistence, no UI, no stores. Host app wires those at the edges.

export * from './types';
export * from './genesis';
export * from './evolution';
export * from './prediction';
export * from './authority';
export * from './resonance';
export * from './culture';
export * from './prompt-compiler';
export * from './registry';
export * from './seed-csuite';
export { builtinAgents, agentMap, aegis, forge, ledger, herald, oracle, shield, scribe, director, sentinel } from './agents';

export const MCV_NAOS_SDK_VERSION = '0.1.0' as const;
