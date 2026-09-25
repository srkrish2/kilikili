// Stroke-order paths for tracing, derived from the rendered font glyph.
//
// Hand-drawing accurate curves for every Tamil letter would drift from the
// font the child sees. Instead we thin the glyph to a one-pixel skeleton
// (its centreline) and connect a few hand-authored waypoints along it. The
// waypoints (src/content/strokes.ts) carry the knowledge — where each stroke
// starts, which way it goes round each loop, where it ends — and the skeleton
// supplies exact geometry.

export type Pt = [x: number, y: number];

export interface Mask {
  w: number;
  h: number;
  /** 1 = ink, row-major. */
  data: Uint8Array;
}

/** Zhang–Suen thinning. Returns a new mask whose ink is the 1px skeleton. */
export function thin({ w, h, data }: Mask): Mask {
  const img = Uint8Array.from(data);
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : img[y * w + x]);
  const toClear: number[] = [];
  let changed = true;
  while (changed) {
    changed = false;
    for (const pass of [0, 1]) {
      toClear.length = 0;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (!img[y * w + x]) continue;
          // Neighbours clockwise from north.
          const p = [at(x, y - 1), at(x + 1, y - 1), at(x + 1, y), at(x + 1, y + 1), at(x, y + 1), at(x - 1, y + 1), at(x - 1, y), at(x - 1, y - 1)];
          const b = p.reduce((s, v) => s + v, 0);
          if (b < 2 || b > 6) continue;
          let a = 0;
          for (let i = 0; i < 8; i++) if (!p[i] && p[(i + 1) % 8]) a++;
          if (a !== 1) continue;
          if (pass === 0 ? p[0] * p[2] * p[4] || p[2] * p[4] * p[6] : p[0] * p[2] * p[6] || p[0] * p[4] * p[6]) continue;
          toClear.push(y * w + x);
        }
      }
      for (const i of toClear) img[i] = 0;
      if (toClear.length) changed = true;
    }
  }
  return { w, h, data: img };
}

export function inkBounds({ w, h, data }: Mask) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[y * w + x]) {
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
      }
    }
  }
  return x1 < 0 ? null : { x0, y0, x1, y1 };
}

function nearestInk({ w, data }: Mask, [px, py]: Pt): number {
  let best = -1;
  let bestD = Infinity;
  for (let i = 0; i < data.length; i++) {
    if (!data[i]) continue;
    const d = (i % w - px) ** 2 + (Math.floor(i / w) - py) ** 2;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

/** Shortest 8-connected path between two skeleton pixels (Dijkstra, diagonal cost √2). */
function shortestPath({ w, h, data }: Mask, from: number, to: number): number[] {
  const dist = new Float64Array(data.length).fill(Infinity);
  const prev = new Int32Array(data.length).fill(-1);
  dist[from] = 0;
  // Skeletons are small, so a simple binary heap keyed on distance is plenty.
  const heap: [number, number][] = [[0, from]];
  const push = (item: [number, number]) => {
    heap.push(item);
    let i = heap.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (heap[parent][0] <= heap[i][0]) break;
      [heap[parent], heap[i]] = [heap[i], heap[parent]];
      i = parent;
    }
  };
  const pop = (): [number, number] => {
    const top = heap[0];
    const last = heap.pop()!;
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
        if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
        if (m === i) break;
        [heap[m], heap[i]] = [heap[i], heap[m]];
        i = m;
      }
    }
    return top;
  };
  while (heap.length) {
    const [d, i] = pop();
    if (i === to) break;
    if (d > dist[i]) continue;
    const x = i % w, y = Math.floor(i / w);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const j = ny * w + nx;
        if (!data[j]) continue;
        const nd = d + (dx && dy ? Math.SQRT2 : 1);
        if (nd < dist[j]) {
          dist[j] = nd;
          prev[j] = i;
          push([nd, j]);
        }
      }
    }
  }
  if (from !== to && prev[to] === -1) return [from, to]; // disconnected: jump
  const path = [to];
  while (path[path.length - 1] !== from) path.push(prev[path[path.length - 1]]);
  return path.reverse();
}

/** Moving-average smoothing that keeps the endpoints fixed. */
export function smooth(path: Pt[], radius = 3): Pt[] {
  if (path.length < 3) return path;
  return path.map((p, i) => {
    if (i === 0 || i === path.length - 1) return p;
    const r = Math.min(radius, i, path.length - 1 - i);
    let sx = 0, sy = 0;
    for (let k = -r; k <= r; k++) {
      sx += path[i + k][0];
      sy += path[i + k][1];
    }
    return [sx / (2 * r + 1), sy / (2 * r + 1)];
  });
}

/**
 * Turns waypoint strokes (coordinates normalised to the glyph's ink bounding
 * box, 0–1) into pixel polylines that follow the glyph's skeleton.
 * A stroke with a single waypoint (a dot, like the pulli) stays a single point.
 */
export function strokePaths(glyph: Mask, strokes: Pt[][]): Pt[][] {
  const box = inkBounds(glyph);
  if (!box) return [];
  const skeleton = thin(glyph);
  const toPx = ([u, v]: Pt): Pt => [box.x0 + u * (box.x1 - box.x0), box.y0 + v * (box.y1 - box.y0)];
  const xy = (i: number): Pt => [i % glyph.w, Math.floor(i / glyph.w)];
  return strokes.map((stroke) => {
    // A dot sits where it is authored; snapping would push it onto the ring a thick dot thins to.
    if (stroke.length === 1) return [toPx(stroke[0])];
    const snapped = stroke.map((p) => nearestInk(skeleton, toPx(p)));
    const pixels: number[] = [snapped[0]];
    for (let i = 1; i < snapped.length; i++) pixels.push(...shortestPath(skeleton, snapped[i - 1], snapped[i]).slice(1));
    return smooth(pixels.map(xy));
  });
}

export function pathLength(path: Pt[]): number {
  let len = 0;
  for (let i = 1; i < path.length; i++) len += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
  return len;
}
