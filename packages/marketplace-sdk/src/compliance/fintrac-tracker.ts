// FintracTracker — Canadian regulatory aggregation.
//
// FINTRAC (Financial Transactions and Reports Analysis Centre of Canada)
// requires:
//   - LVCTR (Large Virtual Currency Transaction Report) at $10,000+ CAD
//     aggregated per user per 24h rolling window.
//   - Travel Rule — sender + receiver identity data attached to any
//     virtual-currency flow ≥ $1,000 CAD.
//
// This tracker holds a per-user rolling aggregate and fires events when
// thresholds cross. It does NOT itself submit to FINTRAC — that's done
// by a downstream Fabric subscriber that persists LVCTR rows into Spanner
// then schedules the regulatory filing. This module is the decision
// boundary.
//
// All money here is BN u128 with 10^18 scaling. CAD USD conversion happens
// at the router boundary; this tracker accepts the already-converted BN.

import BN from 'bn.js';

export interface TrackedFlow {
  /** Identifier of the user (userId from AuthenticatedIdentity) */
  userId: string;
  /** Amount in CAD, u128 scaled by 10^18 (so $10,000 = 10_000 * 10^18) */
  amountRawCad: BN;
  /** Wall-clock timestamp of the flow, epoch ms */
  timestampMs: number;
  /** Correlation id for audit lineage */
  correlationId: string;
}

export interface TrackerEventBase {
  userId: string;
  correlationId: string;
  timestampMs: number;
}

export interface TravelRuleEvent extends TrackerEventBase {
  kind: 'travel-rule';
  flowAmountRawCad: string;  // serialized BN for easy JSON emit
}

export interface LvctrEvent extends TrackerEventBase {
  kind: 'lvctr';
  /** Aggregated 24h total in CAD raw */
  aggregatedRawCad: string;
  /** Count of flows in the window that contributed */
  contributingFlows: number;
}

export type FintracTrackerEvent = TravelRuleEvent | LvctrEvent;

export interface FintracTrackerOptions {
  /**
   * Custom Travel Rule threshold (CAD raw). Defaults to 1_000 * 10^18
   * per NI regulation as of 2026.
   */
  travelRuleThresholdRawCad?: BN;
  /**
   * Custom LVCTR threshold (CAD raw). Defaults to 10_000 * 10^18.
   */
  lvctrThresholdRawCad?: BN;
  /**
   * Rolling window for LVCTR aggregation. Defaults to 24h in ms.
   */
  lvctrWindowMs?: number;
  /**
   * Event sink. Fire-and-forget; tracker returns before the sink resolves.
   */
  onEvent?: (event: FintracTrackerEvent) => void | Promise<void>;
}

const SCALE = new BN(10).pow(new BN(18));
const DEFAULT_TRAVEL_RULE_THRESHOLD = new BN(1000).mul(SCALE);
const DEFAULT_LVCTR_THRESHOLD = new BN(10_000).mul(SCALE);
const DEFAULT_LVCTR_WINDOW_MS = 24 * 60 * 60 * 1000;

interface UserFlowWindow {
  flows: TrackedFlow[];
  /** Cached aggregated total; recomputed on prune */
  aggregateRawCad: BN;
}

export class FintracTracker {
  private readonly travelRuleThresholdRawCad: BN;
  private readonly lvctrThresholdRawCad: BN;
  private readonly lvctrWindowMs: number;
  private readonly onEvent?: (event: FintracTrackerEvent) => void | Promise<void>;
  private readonly userWindows = new Map<string, UserFlowWindow>();

  constructor(options: FintracTrackerOptions = {}) {
    this.travelRuleThresholdRawCad = options.travelRuleThresholdRawCad ?? DEFAULT_TRAVEL_RULE_THRESHOLD;
    this.lvctrThresholdRawCad = options.lvctrThresholdRawCad ?? DEFAULT_LVCTR_THRESHOLD;
    this.lvctrWindowMs = options.lvctrWindowMs ?? DEFAULT_LVCTR_WINDOW_MS;
    this.onEvent = options.onEvent;
  }

  /**
   * Register a flow. Fires Travel Rule event if this single flow crosses
   * the threshold, and fires LVCTR event if the user's 24h aggregate
   * crosses the threshold with this flow included.
   */
  track(flow: TrackedFlow): {
    travelRuleFired: boolean;
    lvctrFired: boolean;
    aggregateRawCad: BN;
  } {
    const window = this.getOrInitWindow(flow.userId);

    // Prune any expired flows before adding the new one.
    this.pruneExpired(window, flow.timestampMs);

    // Add new flow
    window.flows.push(flow);
    window.aggregateRawCad = window.aggregateRawCad.add(flow.amountRawCad);

    // Travel Rule — triggers per-flow
    const travelRuleFired = flow.amountRawCad.gte(this.travelRuleThresholdRawCad);
    if (travelRuleFired) {
      this.emit({
        kind: 'travel-rule',
        userId: flow.userId,
        correlationId: flow.correlationId,
        timestampMs: flow.timestampMs,
        flowAmountRawCad: flow.amountRawCad.toString(),
      });
    }

    // LVCTR — triggers when aggregate crosses threshold
    const lvctrFired = window.aggregateRawCad.gte(this.lvctrThresholdRawCad);
    if (lvctrFired) {
      this.emit({
        kind: 'lvctr',
        userId: flow.userId,
        correlationId: flow.correlationId,
        timestampMs: flow.timestampMs,
        aggregatedRawCad: window.aggregateRawCad.toString(),
        contributingFlows: window.flows.length,
      });
    }

    return {
      travelRuleFired,
      lvctrFired,
      aggregateRawCad: window.aggregateRawCad.clone(),
    };
  }

  /**
   * Get the current aggregated total for a user. Useful for dashboard
   * snapshots; caller must pass the current time so expired flows are
   * pruned deterministically (no hidden Date.now() calls in the tracker).
   */
  aggregateFor(userId: string, atTimeMs: number): BN {
    const window = this.userWindows.get(userId);
    if (!window) return new BN(0);
    this.pruneExpired(window, atTimeMs);
    return window.aggregateRawCad.clone();
  }

  /** Drop all tracking state (useful for tests and end-of-shift rotation). */
  reset(userId?: string): void {
    if (userId) {
      this.userWindows.delete(userId);
    } else {
      this.userWindows.clear();
    }
  }

  private getOrInitWindow(userId: string): UserFlowWindow {
    let window = this.userWindows.get(userId);
    if (!window) {
      window = { flows: [], aggregateRawCad: new BN(0) };
      this.userWindows.set(userId, window);
    }
    return window;
  }

  private pruneExpired(window: UserFlowWindow, currentMs: number): void {
    const cutoff = currentMs - this.lvctrWindowMs;
    if (window.flows.length === 0 || window.flows[0].timestampMs >= cutoff) return;

    let removed = new BN(0);
    const keep: TrackedFlow[] = [];
    for (const flow of window.flows) {
      if (flow.timestampMs >= cutoff) {
        keep.push(flow);
      } else {
        removed = removed.add(flow.amountRawCad);
      }
    }
    window.flows = keep;
    window.aggregateRawCad = window.aggregateRawCad.sub(removed);
  }

  private emit(event: FintracTrackerEvent): void {
    if (!this.onEvent) return;
    try {
      const result = this.onEvent(event);
      if (result && typeof (result as Promise<void>).catch === 'function') {
        (result as Promise<void>).catch((err) => {
          console.warn('[fintrac-tracker] onEvent promise rejected:', err);
        });
      }
    } catch (err) {
      console.warn('[fintrac-tracker] onEvent threw:', err);
    }
  }
}
