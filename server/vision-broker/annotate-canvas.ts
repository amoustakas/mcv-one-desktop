/**
 * mcv-one-desktop / vision-broker — @napi-rs/canvas-backed annotated
 * overlay adapter.
 *
 * Implements the SDK's `AnnotateAdapter` contract by drawing
 * numbered bounding boxes on top of a captured PNG. The renderer is
 * intentionally simple: rectangle stroke + label chip at top-left,
 * tinted MCV Electric Cyan #00F5FF on a black 80%-alpha label
 * background. Numbers are 1-based and match the human-counting
 * convention specified by the SDK contract.
 *
 * This adapter holds the only @napi-rs/canvas dependency in the
 * vision stack — keeping the SDK package zero-dep.
 */

import { createCanvas, loadImage, Image } from '@napi-rs/canvas';

import type { AnnotateAdapter, AnnotateInput } from '@mcv/vision/annotate';

const DEFAULT_COLOR = '#00F5FF';
const DEFAULT_FONT_FAMILY =
  'Consolas, "Courier New", "Liberation Mono", monospace';
const LABEL_FONT_PX = 12;
const LABEL_PAD = 4;
const STROKE_WIDTH = 2;

export const annotateCanvasAdapter: AnnotateAdapter = {
  async drawNumberedBoxes(input: AnnotateInput): Promise<Uint8Array> {
    const { pngBytes, refs } = input;
    const color = input.color ?? DEFAULT_COLOR;
    const fontFamily = input.fontFamily ?? DEFAULT_FONT_FAMILY;

    if (refs.length === 0) {
      // Nothing to draw — return a structurally-fresh copy so callers
      // can rely on output !== input being meaningful.
      return Uint8Array.from(pngBytes);
    }

    // loadImage accepts Buffer / Uint8Array / file path / URL. We pass
    // a Buffer to avoid a copy when called from the route handler.
    const buf = Buffer.from(pngBytes.buffer, pngBytes.byteOffset, pngBytes.byteLength);
    let img: Image;
    try {
      img = await loadImage(buf);
    } catch (err) {
      throw new Error(
        `[vision-broker/annotate-canvas] loadImage failed: ${(err as Error).message}`,
      );
    }

    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');

    // 1. Original screenshot as the base layer.
    ctx.drawImage(img, 0, 0);

    // 2. Stroke pass — rectangles around each ref.
    ctx.lineWidth = STROKE_WIDTH;
    ctx.strokeStyle = color;
    ctx.font = `${LABEL_FONT_PX}px ${fontFamily}`;
    ctx.textBaseline = 'top';

    for (let i = 0; i < refs.length; i++) {
      const r = refs[i];
      const { x, y, width, height } = r.bounds;
      if (width <= 0 || height <= 0) continue;

      ctx.strokeRect(
        Math.round(x) + 0.5,
        Math.round(y) + 0.5,
        Math.round(width) - 1,
        Math.round(height) - 1,
      );

      // 3. Label chip at the box's top-left corner.
      const label = String(i + 1);
      const textWidth = Math.ceil(ctx.measureText(label).width);
      const chipWidth = textWidth + LABEL_PAD * 2;
      const chipHeight = LABEL_FONT_PX + LABEL_PAD * 2;
      const chipX = Math.round(x);
      const chipY = Math.max(0, Math.round(y) - chipHeight);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(chipX, chipY, chipWidth, chipHeight);

      ctx.fillStyle = color;
      ctx.fillText(label, chipX + LABEL_PAD, chipY + LABEL_PAD);
    }

    const outBuffer = canvas.toBuffer('image/png');
    return Uint8Array.from(outBuffer);
  },
};
