import { strokePaths, type Mask, type Pt } from './strokes';

export const GLYPH_FONT = '"Baloo Thambi 2", "Noto Sans Tamil", sans-serif';

/** Font and baseline position that centre `char` in a px × px square at ~80% size. */
export function layoutGlyph(ctx: CanvasRenderingContext2D, char: string, px: number) {
  let size = px * 0.72;
  ctx.font = `800 ${size}px ${GLYPH_FONT}`;
  let m = ctx.measureText(char);
  const w = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
  const h = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
  size *= Math.min((px * 0.8) / w, (px * 0.8) / h);
  ctx.font = `800 ${size}px ${GLYPH_FONT}`;
  m = ctx.measureText(char);
  const x = px / 2 - (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2;
  const y = px / 2 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
  return { x, y, font: ctx.font };
}

export function glyphMask(char: string, px: number): Mask {
  const c = document.createElement('canvas');
  c.width = c.height = px;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  const { x, y } = layoutGlyph(ctx, char, px);
  ctx.fillText(char, x, y);
  const rgba = ctx.getImageData(0, 0, px, px).data;
  const data = new Uint8Array(px * px);
  for (let i = 0; i < data.length; i++) data[i] = rgba[i * 4 + 3] > 127 ? 1 : 0;
  return { w: px, h: px, data };
}

/** Skeletonising at a fixed small size keeps it fast; layout scales linearly, so results scale up. */
export const STROKE_WORK_PX = 240;

export function glyphStrokes(char: string, px: number, waypoints: Pt[][]): Pt[][] {
  const k = px / STROKE_WORK_PX;
  return strokePaths(glyphMask(char, STROKE_WORK_PX), waypoints).map((s) => s.map(([x, y]) => [x * k, y * k] as Pt));
}
