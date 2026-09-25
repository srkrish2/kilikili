import { describe, expect, it } from 'vitest';
import { inkBounds, pathLength, strokePaths, thin, type Mask } from './strokes';

function mask(w: number, h: number, ink: (x: number, y: number) => boolean): Mask {
  const data = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) data[y * w + x] = ink(x, y) ? 1 : 0;
  return { w, h, data };
}

const count = (m: Mask) => m.data.reduce((s, v) => s + v, 0);

describe('thin', () => {
  it('reduces a thick bar to a thin centreline', () => {
    const bar = mask(60, 30, (x, y) => x >= 5 && x < 55 && y >= 10 && y < 20);
    const sk = thin(bar);
    expect(count(sk)).toBeLessThan(count(bar) / 5);
    for (let i = 0; i < sk.data.length; i++) {
      if (sk.data[i]) expect(Math.abs(Math.floor(i / 60) - 14.5)).toBeLessThanOrEqual(2);
    }
  });
});

describe('strokePaths', () => {
  it('follows a bar from the start waypoint to the end waypoint', () => {
    const bar = mask(60, 30, (x, y) => x >= 5 && x < 55 && y >= 10 && y < 20);
    const [path] = strokePaths(bar, [[[0, 0.5], [1, 0.5]]]);
    expect(path[0][0]).toBeLessThan(path[path.length - 1][0]);
    expect(pathLength(path)).toBeGreaterThan(35);
  });

  it('goes round a ring in the direction the waypoints give', () => {
    const ring = mask(80, 80, (x, y) => {
      const r = Math.hypot(x - 40, y - 40);
      return r >= 22 && r <= 32;
    });
    // Start at the top, go via the left side (anticlockwise on screen) to the bottom.
    const [anti] = strokePaths(ring, [[[0.5, 0], [0, 0.5], [0.5, 1]]]);
    const [clock] = strokePaths(ring, [[[0.5, 0], [1, 0.5], [0.5, 1]]]);
    const meanX = (p: [number, number][]) => p.reduce((s, q) => s + q[0], 0) / p.length;
    expect(meanX(anti)).toBeLessThan(35);
    expect(meanX(clock)).toBeGreaterThan(45);
  });

  it('keeps a single-waypoint stroke as a dot', () => {
    const blob = mask(20, 20, (x, y) => Math.hypot(x - 10, y - 10) < 5);
    const [dot] = strokePaths(blob, [[[0.5, 0.5]]]);
    expect(dot).toHaveLength(1);
  });

  it('finds the ink bounds', () => {
    expect(inkBounds(mask(10, 10, (x, y) => x >= 2 && x <= 4 && y === 7))).toEqual({ x0: 2, y0: 7, x1: 4, y1: 7 });
  });
});
