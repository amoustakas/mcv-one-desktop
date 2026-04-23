// ACS v2.0 Controller — ZTAG's core algorithmic-governance primitive.
//
// Every automated parameter in the system (commission decay, vesting curve,
// slippage tolerance, circuit-breaker thresholds, etc.) is governed by an
// ACS Controller. The controller takes an InputSurface, applies its Model
// to produce an OutputSurface, subject to immutable Guardrails. Every
// output + every guardrail violation is streamed to Iceberg via the
// TelemetryTap for public-verifiable audit.
//
// "Humans propose, algorithms govern, cryptography audits" — this is the
// "algorithms govern" leg.

export interface AcsInput<I> {
  /** The observed input that drives the decision. */
  value: I;
  /** Wall-clock timestamp, epoch ms */
  observedAtMs: number;
  /** Correlation id threading the decision into a broader cascade */
  correlationId: string;
}

export interface AcsOutput<O> {
  /** The computed output */
  value: O;
  /** Timestamp the output was produced */
  producedAtMs: number;
  /** Original correlation id from input */
  correlationId: string;
  /** Whether guardrails permitted the output; false means clamped/rejected */
  withinGuardrails: boolean;
  /** Ids of guardrails that flagged this decision */
  triggeredGuardrails: string[];
}

/**
 * Guardrail — a validator run over (input, candidateOutput) that either
 * passes or rejects. Rejection should include a human-readable reason and
 * optionally a clamped alternative value. Guardrails MUST be idempotent
 * and side-effect-free — they run potentially many times per decision.
 */
export interface AcsGuardrail<I, O> {
  readonly id: string;
  readonly description: string;
  /** Return null to pass, or { reason, clamped? } to reject/clamp. */
  check(input: I, candidate: O): null | { reason: string; clamped?: O };
}

/**
 * Model — the pure function mapping input to candidate output. No I/O, no
 * guardrail references, no timestamp coupling. The controller wires
 * guardrails around the model.
 */
export interface AcsModel<I, O> {
  readonly id: string;
  readonly version: string;
  apply(input: I): O;
}

/** Event emitted on every decision for downstream telemetry tap. */
export interface AcsDecisionEvent<I, O> {
  controllerId: string;
  modelId: string;
  modelVersion: string;
  input: I;
  output: O;
  withinGuardrails: boolean;
  triggeredGuardrails: string[];
  correlationId: string;
  decidedAtMs: number;
}

export interface AcsControllerOptions<I, O> {
  id: string;
  model: AcsModel<I, O>;
  guardrails: AcsGuardrail<I, O>[];
  /** Optional telemetry sink. Fires for every decision. */
  onDecision?: (event: AcsDecisionEvent<I, O>) => void;
}

export class AcsController<I, O> {
  private readonly id: string;
  private readonly model: AcsModel<I, O>;
  private readonly guardrails: AcsGuardrail<I, O>[];
  private readonly onDecision?: (event: AcsDecisionEvent<I, O>) => void;

  constructor(options: AcsControllerOptions<I, O>) {
    this.id = options.id;
    this.model = options.model;
    this.guardrails = options.guardrails;
    this.onDecision = options.onDecision;
  }

  /**
   * Run the full decision cycle:
   *  1. Apply model to input → candidate output.
   *  2. Run every guardrail in declaration order.
   *     - If any returns `clamped`, replace candidate and continue.
   *     - If any returns `reason` without clamped, mark withinGuardrails=false.
   *  3. Emit telemetry event.
   *  4. Return final output.
   */
  decide(input: AcsInput<I>): AcsOutput<O> {
    let candidate = this.model.apply(input.value);
    const triggered: string[] = [];
    let withinGuardrails = true;

    for (const guardrail of this.guardrails) {
      const result = guardrail.check(input.value, candidate);
      if (result) {
        triggered.push(guardrail.id);
        if (result.clamped !== undefined) {
          candidate = result.clamped;
        } else {
          withinGuardrails = false;
        }
      }
    }

    const decidedAtMs = Date.now();
    const output: AcsOutput<O> = {
      value: candidate,
      producedAtMs: decidedAtMs,
      correlationId: input.correlationId,
      withinGuardrails,
      triggeredGuardrails: triggered,
    };

    if (this.onDecision) {
      this.onDecision({
        controllerId: this.id,
        modelId: this.model.id,
        modelVersion: this.model.version,
        input: input.value,
        output: candidate,
        withinGuardrails,
        triggeredGuardrails: triggered,
        correlationId: input.correlationId,
        decidedAtMs,
      });
    }

    return output;
  }
}
