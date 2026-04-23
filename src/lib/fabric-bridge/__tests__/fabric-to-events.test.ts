import { describe, it, expect } from 'vitest'
import {
  fabricToEventEnvelope,
  fabricBatchToEnvelopes,
  envelopeToFabricEvent,
  type FabricMCVEvent,
} from '../fabric-to-events'

const V = '11111111-1111-1111-1111-111111111111'
const EID = 'a0000000-0000-0000-0000-000000000001'
const CID = 'b0000000-0000-0000-0000-000000000002'

function makeFabricEvent<T>(overrides: Partial<FabricMCVEvent<T>> & { data: T }): FabricMCVEvent<T> {
  return {
    id: EID,
    topic: 'mcv.test',
    type: 'test.unit',
    source: 'sim-tests',
    ventureId: V,
    correlationId: CID,
    timestamp: '2026-04-22T00:00:00Z',
    version: '1.0',
    ...overrides,
  }
}

describe('fabricToEventEnvelope', () => {
  it('maps core fields to canonical envelope shape', () => {
    const fabric = makeFabricEvent({ data: { n: 42 } })
    const env = fabricToEventEnvelope(fabric)

    expect(env.id).toBe(EID)
    expect(env.topic).toBe('mcv.test')
    expect(env.schemaVersion).toBe('1.0')
    expect(env.correlationId).toBe(CID)
    expect(env.causationId).toBeNull()
    expect(env.ventureId).toBe(V)
    expect(env.emittedAt).toBe('2026-04-22T00:00:00Z')
    expect(env.emittedBy).toBe('fabric:sim-tests')
    expect(env.status).toBe('pending')
    expect(env.payload.data).toEqual({ n: 42 })
  })

  it('preserves Fabric-specific fields in payload.__fabric', () => {
    const fabric = makeFabricEvent({
      data: { hello: 'world' },
      metadata: { ventureSlug: 'warforge', source: 'handler' },
    })
    const env = fabricToEventEnvelope(fabric)

    expect(env.payload.__fabric.type).toBe('test.unit')
    expect(env.payload.__fabric.metadata).toEqual({
      ventureSlug: 'warforge',
      source: 'handler',
    })
  })

  it('omits metadata from __fabric when not present on the Fabric event', () => {
    const fabric = makeFabricEvent({ data: { n: 1 } })
    const env = fabricToEventEnvelope(fabric)
    expect(env.payload.__fabric.metadata).toBeUndefined()
  })

  it('is a pure function (no mutation of input)', () => {
    const fabric = makeFabricEvent({ data: { n: 1 } })
    const frozen = { ...fabric }
    fabricToEventEnvelope(fabric)
    expect(fabric).toEqual(frozen)
  })

  it('round-trip fabric → envelope → fabric is lossless (required fields)', () => {
    const original = makeFabricEvent({
      data: { foo: 'bar', nested: { x: 1 } },
      metadata: { k: 'v' },
    })
    const envelope = fabricToEventEnvelope(original)
    const round = envelopeToFabricEvent(envelope)

    expect(round).not.toBeNull()
    expect(round!.id).toBe(original.id)
    expect(round!.topic).toBe(original.topic)
    expect(round!.type).toBe(original.type)
    expect(round!.source).toBe(original.source)
    expect(round!.ventureId).toBe(original.ventureId)
    expect(round!.correlationId).toBe(original.correlationId)
    expect(round!.timestamp).toBe(original.timestamp)
    expect(round!.version).toBe(original.version)
    expect(round!.data).toEqual(original.data)
    expect(round!.metadata).toEqual(original.metadata)
  })

  it('envelopeToFabricEvent returns null for envelopes not produced by the bridge', () => {
    // A canonical events-sdk envelope that never passed through the bridge
    // has no __fabric metadata — extractor should refuse to fabricate.
    const foreignEnvelope = {
      id: 'x',
      topic: 't',
      schemaVersion: '1.0',
      correlationId: 'c',
      causationId: null,
      ventureId: null,
      emittedAt: '2026-04-22T00:00:00Z',
      emittedBy: 'foundation:counsel',
      payload: { directFields: 'no __fabric wrapper' },
      status: 'pending' as const,
    }
    expect(envelopeToFabricEvent(foreignEnvelope)).toBeNull()
  })
})

describe('fabricBatchToEnvelopes', () => {
  it('bridges an array in order', () => {
    const events = [
      makeFabricEvent({ id: 'a0000000-0000-0000-0000-000000000001', topic: 'a', data: { i: 0 } }),
      makeFabricEvent({ id: 'a0000000-0000-0000-0000-000000000002', topic: 'b', data: { i: 1 } }),
      makeFabricEvent({ id: 'a0000000-0000-0000-0000-000000000003', topic: 'c', data: { i: 2 } }),
    ]
    const envs = fabricBatchToEnvelopes(events)
    expect(envs).toHaveLength(3)
    expect(envs.map((e) => e.topic)).toEqual(['a', 'b', 'c'])
    expect(envs.map((e) => e.payload.data)).toEqual([{ i: 0 }, { i: 1 }, { i: 2 }])
  })

  it('returns empty array for empty input', () => {
    expect(fabricBatchToEnvelopes([])).toEqual([])
  })
})
