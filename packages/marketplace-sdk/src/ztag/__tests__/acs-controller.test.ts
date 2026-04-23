// ACS v2.0 Controller contract tests.
//
// Guardrails enforce operating envelopes around the model's output.
// Telemetry events fire for every decision regardless of guardrail outcome
// — the hash-chained audit trail is the "cryptography audits" leg of ZTAG.

import { describe, it, expect } from 'vitest';

import {
  AcsController,
  type AcsDecisionEvent,
  type AcsGuardrail,
  type AcsModel,
} from '../acs-controller';

interface SlippageInput { requestedBps: number; marketVolumeUsd: number; }
interface SlippageOutput { acceptedBps: number; }

const fixedSlippageModel: AcsModel<SlippageInput, SlippageOutput> = {
  id: 'slippage-v1',
  version: '1.0.0',
  apply(input) { return { acceptedBps: input.requestedBps }; },
};

const capAt300Bps: AcsGuardrail<SlippageInput, SlippageOutput> = {
  id: 'cap-at-300-bps',
  description: 'Hard-cap slippage at 3%',
  check(_input, candidate) {
    if (candidate.acceptedBps > 300) {
      return { reason: 'slippage exceeds 3%', clamped: { acceptedBps: 300 } };
    }
    return null;
  },
};

const rejectIlliquid: AcsGuardrail<SlippageInput, SlippageOutput> = {
  id: 'reject-illiquid',
  description: 'Reject any decision when market volume < $10k',
  check(input) {
    if (input.marketVolumeUsd < 10_000) {
      return { reason: 'market illiquid' };
    }
    return null;
  },
};

describe('AcsController', () => {
  it('passes candidate through when no guardrail fires', () => {
    const events: AcsDecisionEvent<SlippageInput, SlippageOutput>[] = [];
    const controller = new AcsController({
      id: 'slippage-governor',
      model: fixedSlippageModel,
      guardrails: [capAt300Bps, rejectIlliquid],
      onDecision: (e) => { events.push(e); },
    });

    const output = controller.decide({
      value: { requestedBps: 150, marketVolumeUsd: 50_000 },
      observedAtMs: 1000,
      correlationId: 'decision-a',
    });

    expect(output.value.acceptedBps).toBe(150);
    expect(output.withinGuardrails).toBe(true);
    expect(output.triggeredGuardrails).toHaveLength(0);
    expect(events).toHaveLength(1);
  });

  it('clamps when a guardrail returns { clamped }', () => {
    const controller = new AcsController({
      id: 'slippage-governor',
      model: fixedSlippageModel,
      guardrails: [capAt300Bps],
    });

    const output = controller.decide({
      value: { requestedBps: 500, marketVolumeUsd: 50_000 },
      observedAtMs: 1000,
      correlationId: 'decision-b',
    });
    expect(output.value.acceptedBps).toBe(300); // clamped
    expect(output.triggeredGuardrails).toEqual(['cap-at-300-bps']);
    expect(output.withinGuardrails).toBe(true); // clamped counts as within
  });

  it('marks withinGuardrails=false when a guardrail rejects without clamped alternative', () => {
    const controller = new AcsController({
      id: 'slippage-governor',
      model: fixedSlippageModel,
      guardrails: [rejectIlliquid],
    });
    const output = controller.decide({
      value: { requestedBps: 100, marketVolumeUsd: 500 },
      observedAtMs: 1000,
      correlationId: 'decision-c',
    });
    expect(output.withinGuardrails).toBe(false);
    expect(output.triggeredGuardrails).toEqual(['reject-illiquid']);
  });

  it('emits telemetry event even when guardrails reject — audit trail first', () => {
    const events: AcsDecisionEvent<SlippageInput, SlippageOutput>[] = [];
    const controller = new AcsController({
      id: 'slippage-governor',
      model: fixedSlippageModel,
      guardrails: [rejectIlliquid],
      onDecision: (e) => { events.push(e); },
    });
    controller.decide({
      value: { requestedBps: 100, marketVolumeUsd: 500 },
      observedAtMs: 1000,
      correlationId: 'decision-d',
    });
    expect(events).toHaveLength(1);
    expect(events[0].withinGuardrails).toBe(false);
    expect(events[0].modelVersion).toBe('1.0.0');
    expect(events[0].correlationId).toBe('decision-d');
  });
});
