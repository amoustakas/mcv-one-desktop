/**
 * @mcv/vision — annotated overlay adapter contract.
 *
 * Session 2 introduces the "look at THIS thing" primitive: a numbered
 * bounding-box overlay drawn on top of a snapshot's PNG so a human
 * reviewer (or a vision-LLM) can see which actionable Refs the SDK
 * minted, in what order, and where they live on the page.
 *
 * Image rendering is intentionally OUT-of-band from the SDK to keep
 * @mcv/vision zero-dep. The broker provides the real adapter
 * (`server/vision-broker/annotate-canvas.ts`, @napi-rs/canvas-backed)
 * via dependency injection. Environments that don't need the overlay
 * (CI, headless probes) can wire `nullAnnotateAdapter` and the call
 * becomes a no-op.
 *
 * Box numbering convention: labels are 1-based and correspond to
 * `refs[i+1]` in the SnapshotResult — matching how human reviewers
 * count, not how arrays index. The adapter MUST NOT reorder the
 * input refs; it draws them in the order received.
 */

import type { Ref } from './types';

// ---------------------------------------------------------------------------
// Adapter contract
// ---------------------------------------------------------------------------

export interface AnnotateInput {
  /** Raw screenshot bytes from `SnapshotResult.screenshotPng`. */
  pngBytes: Uint8Array;
  /** Refs to draw — typically the full `SnapshotResult.refs` array. */
  refs: Ref[];
  /** Stroke + label color. Defaults to MCV Electric Cyan #00F5FF. */
  color?: string;
  /** Label font family. Defaults to a monospaced fallback chain. */
  fontFamily?: string;
}

/**
 * Draws numbered bounding boxes onto a PNG and returns a NEW byte
 * stream. Implementations must not mutate the input bytes — callers
 * are free to reuse the input buffer afterward.
 */
export interface AnnotateAdapter {
  drawNumberedBoxes(input: AnnotateInput): Promise<Uint8Array>;
}

// ---------------------------------------------------------------------------
// Pass-through adapter — for environments without canvas
// ---------------------------------------------------------------------------

/**
 * Returns the input bytes unchanged. Useful for tests, CI smoke runs,
 * and any consumer that wants the raw PNG without an overlay
 * dependency. Callers can swap this with a real adapter behind a
 * feature flag without changing call sites.
 */
export const nullAnnotateAdapter: AnnotateAdapter = {
  async drawNumberedBoxes({ pngBytes }) {
    return pngBytes;
  },
};
