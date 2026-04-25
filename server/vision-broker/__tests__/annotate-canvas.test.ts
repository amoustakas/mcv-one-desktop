// annotate-canvas.test.ts — visual-side assertions for the
// @napi-rs/canvas-backed AnnotateAdapter. Builds a deterministic
// 200x200 white PNG fixture in-memory, passes it through the
// adapter with two refs, and asserts:
//   1. output bytes differ from input (a real overlay was drawn)
//   2. the output contains pixels close to the cyan stroke color
//      sampled along the expected box edges
//   3. an empty refs array still returns a fresh-buffer copy
//      (not the same reference) so downstream identity checks work

import { describe, expect, it } from 'vitest';
import { createCanvas, loadImage } from '@napi-rs/canvas';

import type { Ref } from '@mcv/vision';
import { annotateCanvasAdapter } from '../annotate-canvas';

function makeWhitePng(width: number, height: number): Uint8Array {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  return Uint8Array.from(canvas.toBuffer('image/png'));
}

function ref(id: string, x: number, y: number, w: number, h: number): Ref {
  return {
    id,
    role: 'button',
    name: id,
    bounds: { x, y, width: w, height: h },
    originOrdinal: 0,
    ancestorRoles: [],
    offscreen: false,
    disabled: false,
  };
}

/** Distance in 0..255 RGB space between two colors. */
function rgbDelta(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }): number {
  return Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b);
}

const CYAN = { r: 0x00, g: 0xf5, b: 0xff };

describe('vision-broker · annotateCanvasAdapter', () => {
  it('returns a different byte stream when refs are drawn', async () => {
    const inPng = makeWhitePng(200, 200);
    const refs: Ref[] = [
      ref('r1', 20, 30, 80, 40),
      ref('r2', 110, 120, 60, 50),
    ];

    const outPng = await annotateCanvasAdapter.drawNumberedBoxes({
      pngBytes: inPng,
      refs,
    });

    expect(outPng).not.toBe(inPng);
    expect(outPng.byteLength).toBeGreaterThan(0);
    // PNGs of identical content can vary slightly by encoder, but a
    // canvas with overlays will be structurally different from a
    // blank canvas — we expect a non-trivial size delta in EITHER
    // direction (overlays may compress better OR worse).
    expect(outPng.byteLength).not.toBe(inPng.byteLength);
  });

  it('paints cyan-ish pixels along the stroke of each numbered box', async () => {
    const inPng = makeWhitePng(200, 200);
    const r1 = ref('r1', 20, 30, 80, 40);
    const r2 = ref('r2', 110, 120, 60, 50);

    const outPng = await annotateCanvasAdapter.drawNumberedBoxes({
      pngBytes: inPng,
      refs: [r1, r2],
    });

    // Re-load the output PNG so we can sample pixels.
    const img = await loadImage(Buffer.from(outPng));
    const sampleCanvas = createCanvas(img.width, img.height);
    const sampleCtx = sampleCanvas.getContext('2d');
    sampleCtx.drawImage(img, 0, 0);

    // Sample along the top edge of each box (y = bounds.y) and the
    // left edge (x = bounds.x) — these MUST overlap the stroke.
    const samplePoints: Array<{ x: number; y: number }> = [];
    for (const r of [r1, r2]) {
      const { x, y, width, height } = r.bounds;
      // top edge
      samplePoints.push({ x: Math.round(x + width / 2), y: Math.round(y) });
      // left edge
      samplePoints.push({ x: Math.round(x), y: Math.round(y + height / 2) });
    }

    let cyanish = 0;
    for (const pt of samplePoints) {
      const data = sampleCtx.getImageData(pt.x, pt.y, 1, 1).data;
      const px = { r: data[0], g: data[1], b: data[2] };
      // Tolerance of 80 in summed |dR|+|dG|+|dB| handles aa-blending
      // around the stroke without being so loose it counts white.
      if (rgbDelta(px, CYAN) < 80) cyanish++;
    }

    expect(cyanish).toBeGreaterThanOrEqual(1);
  });

  it('returns a structurally fresh buffer when refs is empty', async () => {
    const inPng = makeWhitePng(50, 50);
    const out = await annotateCanvasAdapter.drawNumberedBoxes({
      pngBytes: inPng,
      refs: [],
    });

    expect(out).not.toBe(inPng); // not the same reference
    expect(Array.from(out)).toEqual(Array.from(inPng)); // but equal bytes
  });

  it('skips refs with zero-width or zero-height bounds', async () => {
    const inPng = makeWhitePng(100, 100);
    const out = await annotateCanvasAdapter.drawNumberedBoxes({
      pngBytes: inPng,
      refs: [
        ref('zero-w', 10, 10, 0, 30),
        ref('zero-h', 50, 50, 30, 0),
      ],
    });
    // Should not throw, and the canvas pass should produce a fresh
    // (decoded + re-encoded) PNG even with no boxes drawn.
    expect(out.byteLength).toBeGreaterThan(0);
  });
});
