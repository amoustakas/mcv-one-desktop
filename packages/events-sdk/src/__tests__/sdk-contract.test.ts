// Events SDK contract tests.
//
// Locks the boundary for the Typed Nervous System (M-F1):
//   · topic convention stays `<module>.<entity>.<action>` lowercase-kebab.
//   · makeEnvelope produces envelopes with self-correlation on root events.
//   · topicMatches covers exact / trailing-wildcard / segment-wildcard / global.
//   · 4 module contracts expose expected topics (drift detection).
//   · Registry rejects duplicate emission topics across modules.

import { describe, it, expect } from 'vitest';

import {
  assertValidTopic,
  makeEnvelope,
  randomUuid,
  rowToEnvelope,
  topicMatches,
  createContractRegistry,
  ALL_CONTRACTS,
  FoundationContract,
  CapitalContract,
  CommerceContract,
  McvSignContract,
  type ContractDeclaration,
} from '../index';

describe('events-sdk · topic convention', () => {
  it('accepts well-formed topics', () => {
    expect(() => assertValidTopic('foundation.counsel.nda-executed')).not.toThrow();
    expect(() => assertValidTopic('capital.round.funded')).not.toThrow();
    expect(() => assertValidTopic('foundation.counsel.task.completed')).not.toThrow();
  });

  it('rejects malformed topics', () => {
    expect(() => assertValidTopic('foundation')).toThrow(/invalid topic/);
    expect(() => assertValidTopic('foundation.round')).toThrow(/invalid topic/); // only 2 parts
    expect(() => assertValidTopic('Foundation.Round.Funded')).toThrow(/invalid topic/); // uppercase
    expect(() => assertValidTopic('foundation..funded')).toThrow(/invalid topic/);
    expect(() => assertValidTopic('foundation.round_funded.x')).toThrow(/invalid topic/); // underscore not kebab
  });
});

describe('events-sdk · makeEnvelope', () => {
  it('root events self-correlate (correlationId = id)', () => {
    const env = makeEnvelope('foundation.counsel.nda-executed', { engagementId: randomUuid() });
    expect(env.correlationId).toBe(env.id);
    expect(env.causationId).toBeNull();
  });

  it('cascading events inherit correlationId + link causation', () => {
    const root = makeEnvelope('capital.round.funded', { roundId: randomUuid() });
    const child = makeEnvelope(
      'foundation.ip-mark.status-changed',
      { id: randomUuid(), markText: 'FOO', fromStatus: 'a', toStatus: 'b' },
      { correlationId: root.correlationId, causationId: root.id },
    );
    expect(child.correlationId).toBe(root.correlationId);
    expect(child.causationId).toBe(root.id);
    expect(child.id).not.toBe(root.id);
  });

  it('defaults emittedBy to system:unknown and status to published', () => {
    const env = makeEnvelope('foundation.ip-mark.created', {});
    expect(env.emittedBy).toBe('system:unknown');
    expect(env.status).toBe('published');
  });
});

describe('events-sdk · topicMatches', () => {
  it('exact match', () => {
    expect(topicMatches('foundation.counsel.nda-executed', 'foundation.counsel.nda-executed')).toBe(true);
    expect(topicMatches('foundation.counsel.nda-executed', 'capital.round.funded')).toBe(false);
  });

  it('trailing wildcard is a prefix match', () => {
    expect(topicMatches('foundation.counsel.nda-executed', 'foundation.*')).toBe(true);
    expect(topicMatches('foundation.counsel.task.completed', 'foundation.*')).toBe(true);
    expect(topicMatches('capital.round.funded', 'foundation.*')).toBe(false);
  });

  it('segment wildcard fills one segment', () => {
    expect(topicMatches('foundation.counsel.executed', 'foundation.*.executed')).toBe(true);
    expect(topicMatches('foundation.counsel.nda-executed', 'foundation.*.executed')).toBe(false);
  });

  it('global wildcard matches everything', () => {
    expect(topicMatches('anything.at.all', '*')).toBe(true);
    expect(topicMatches('capital.round.funded', '*')).toBe(true);
  });
});

describe('events-sdk · envelope <-> row round trip', () => {
  it('rowToEnvelope maps snake_case → camelCase correctly', () => {
    const iso = new Date().toISOString();
    const envelope = rowToEnvelope({
      id: 'id1',
      topic: 'foundation.counsel.nda-executed',
      schema_version: '1.0',
      correlation_id: 'corr1',
      causation_id: null,
      venture_id: null,
      emitted_at: iso,
      emitted_by: 'user:u1',
      payload: { foo: 'bar' },
      status: 'published',
    });
    expect(envelope).toMatchObject({
      id: 'id1',
      topic: 'foundation.counsel.nda-executed',
      schemaVersion: '1.0',
      correlationId: 'corr1',
      causationId: null,
      ventureId: null,
      emittedAt: iso,
      emittedBy: 'user:u1',
      status: 'published',
    });
  });
});

describe('events-sdk · module contracts (drift detection)', () => {
  it('exposes all 4 modules', () => {
    expect(ALL_CONTRACTS).toHaveLength(4);
    expect(ALL_CONTRACTS.map((c) => c.module).sort()).toEqual(['capital', 'commerce', 'foundation', 'mcv-sign']);
  });

  it('Foundation declares the nda-executed emission (demo target for M-F1)', () => {
    const em = FoundationContract.emits.find((e) => e.topic === 'foundation.counsel.nda-executed');
    expect(em).toBeDefined();
    // Schema requires the 4 demo-payload fields from plan §Outcome.
    const res = em!.payload.safeParse({
      engagementId: randomUuid(),
      firmName: 'Foo & Partners LLP',
      workstream: 'ip',
      executedAt: new Date().toISOString(),
    });
    if (!res.success) {
       
      console.error('nda-executed validation errors:', res.error.issues);
    }
    expect(res.success).toBe(true);
  });

  it('Capital declares round lifecycle emissions', () => {
    const topics = CapitalContract.emits.map((e) => e.topic);
    expect(topics).toContain('capital.round.created');
    expect(topics).toContain('capital.round.funded');
    expect(topics).toContain('capital.distribution.paid');
  });

  it('Commerce + MCV-Sign expose forward-looking subscribers of foundation events', () => {
    const commerceSubs = CommerceContract.subscribes.map((s) => s.topicPattern);
    expect(commerceSubs).toContain('foundation.ip-mark.status-changed');
    const signSubs = McvSignContract.subscribes.map((s) => s.topicPattern);
    expect(signSubs.some((p) => p.startsWith('foundation.'))).toBe(true);
  });

  it('every emission topic passes assertValidTopic', () => {
    for (const c of ALL_CONTRACTS) {
      for (const em of c.emits) {
        expect(() => assertValidTopic(em.topic)).not.toThrow();
      }
    }
  });
});

describe('events-sdk · registry', () => {
  it('builds a working emission lookup over all modules', () => {
    const registry = createContractRegistry({ contracts: ALL_CONTRACTS });
    expect(registry.findEmission('foundation.counsel.nda-executed')).toBeDefined();
    expect(registry.findEmission('capital.round.funded')).toBeDefined();
    expect(registry.findEmission('does.not.exist')).toBeUndefined();
  });

  it('rejects duplicate emission topics across modules', () => {
    const fakeDuplicate: ContractDeclaration = {
      module: 'fake',
      version: '1.0',
      emits: [
        // Steal a topic foundation already owns.
        FoundationContract.emits[0],
      ],
      subscribes: [],
    };
    expect(() =>
      createContractRegistry({ contracts: [...ALL_CONTRACTS, fakeDuplicate] }),
    ).toThrow(/duplicate emission/);
  });

  it('rejects duplicate module registrations', () => {
    expect(() =>
      createContractRegistry({
        contracts: [
          FoundationContract,
          // Same module declared twice.
          { module: 'foundation', version: '2.0', emits: [], subscribes: [] } as ContractDeclaration,
        ],
      }),
    ).toThrow(/duplicate module/);
  });
});
