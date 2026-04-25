// annotate.test.ts — adapter contract assertions for the SDK's
// zero-dep `nullAnnotateAdapter`. The real canvas-backed adapter
// lives in mcv-one-desktop/server/vision-broker/ and is tested
// there alongside the daemon.

import { describe, expect, it } from 'vitest';

import { nullAnnotateAdapter, type AnnotateAdapter, type AnnotateInput } from '../annotate';
import type { Ref } from '../types';

const ZERO_REF: Ref = {
  id: 'noop',
  role: 'button',
  name: 'noop',
  bounds: { x: 0, y: 0, width: 10, height: 10 },
  originOrdinal: 0,
  ancestorRoles: [],
  offscreen: false,
  disabled: false,
};

describe('@mcv/vision · nullAnnotateAdapter', () => {
  it('satisfies the AnnotateAdapter shape', () => {
    const adapter: AnnotateAdapter = nullAnnotateAdapter;
    expect(typeof adapter.drawNumberedBoxes).toBe('function');
  });

  it('returns the input bytes by reference (no copy, no mutation)', async () => {
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]); // PNG signature
    const input: AnnotateInput = { pngBytes, refs: [ZERO_REF] };

    const out = await nullAnnotateAdapter.drawNumberedBoxes(input);

    expect(out).toBe(pngBytes); // same reference — guarantees zero-copy passthrough
    expect(Array.from(out)).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  });

  it('does not mutate the input on multiple calls', async () => {
    const pngBytes = new Uint8Array([1, 2, 3, 4]);
    const original = Array.from(pngBytes);

    await nullAnnotateAdapter.drawNumberedBoxes({ pngBytes, refs: [] });
    await nullAnnotateAdapter.drawNumberedBoxes({ pngBytes, refs: [ZERO_REF, ZERO_REF] });

    expect(Array.from(pngBytes)).toEqual(original);
  });

  it('ignores color and fontFamily options without throwing', async () => {
    const pngBytes = new Uint8Array([0]);
    const out = await nullAnnotateAdapter.drawNumberedBoxes({
      pngBytes,
      refs: [],
      color: '#FF0000',
      fontFamily: 'Comic Sans MS',
    });
    expect(out.byteLength).toBe(1);
  });
});
