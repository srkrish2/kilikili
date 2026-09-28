#!/usr/bin/env python3
"""Build stroke-order data for letter tracing from the app font.

    pip install fonttools numpy
    python3 tools/letter_strokes.py          # write shared/content/strokes.json + preview
    python3 tools/letter_strokes.py --check  # exit 1 if strokes.json is stale

Input: shared/content/stroke-waypoints.json, hand-authored per glyph: where each
stroke starts, which way it goes round each loop, where it ends (coordinates in the
glyph's ink box, 0-1). Output: for each glyph, the real outline (SVG path, font units,
y down, origin at the ink box corner) plus strokes that follow the glyph's
centreline, so an animated pen always sits on the letter the child sees.

How: rasterise the outline (non-zero winding), thin it to a one-pixel skeleton
(Zhang-Suen), snap each waypoint to the skeleton, and join consecutive waypoints with
the shortest path along it. Same method as the old web app's runtime tracer, moved
offline so React Native and SwiftUI (no pixel access) can share the result.

Not needed in CI: the output is committed. It only reruns when waypoints or the font
change.
"""
from __future__ import annotations

import heapq
import json
import sys
from pathlib import Path

import numpy as np
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
FONT = ROOT / "ios/TamilTrain/Fonts/BalooThambi2_800ExtraBold.ttf"
WAYPOINTS = ROOT / "shared/content/stroke-waypoints.json"
OUT = ROOT / "shared/content/strokes.json"
PREVIEW = ROOT / "shared/reference/letter-strokes.svg"
RASTER = 240  # skeletonising resolution (longest side of the ink box)


# ------------------------------------------------------------ outline
def glyph_outline(font: TTFont, char: str):
    cmap = font.getBestCmap()
    name = cmap[ord(char)]
    gs = font.getGlyphSet()
    rec = DecomposingRecordingPen(gs)
    gs[name].draw(rec)
    bp = BoundsPen(gs)
    gs[name].draw(bp)
    x0, y0, x1, y1 = bp.bounds
    return rec.value, (x0, y0, x1, y1)


def flatten(ops, steps: int = 8) -> list[list[tuple[float, float]]]:
    """Recording-pen ops -> closed polygons (font units, y up)."""
    contours, cur, pos = [], [], None

    def quad(p0, p1, p2):
        for i in range(1, steps + 1):
            t = i / steps
            cur.append(((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
                        (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]))

    for op, args in ops:
        if op == "moveTo":
            pos = args[0]
            cur = [pos]
        elif op == "lineTo":
            pos = args[0]
            cur.append(pos)
        elif op == "qCurveTo":
            # TrueType: implied on-curve points between consecutive off-curve points.
            pts = list(args)
            if pts[-1] is None:  # closed contour of only off-curve points
                pts = pts[:-1]
                pts.append(((pts[-1][0] + pts[0][0]) / 2, (pts[-1][1] + pts[0][1]) / 2))
            offs, end = pts[:-1], pts[-1]
            p0 = pos
            for i, c in enumerate(offs):
                nxt = end if i == len(offs) - 1 else ((c[0] + offs[i + 1][0]) / 2, (c[1] + offs[i + 1][1]) / 2)
                quad(p0, c, nxt)
                p0 = nxt
            pos = end
        elif op == "curveTo":
            p1, p2, p3 = args
            p0 = pos
            for i in range(1, steps + 1):
                t = i / steps
                mt = 1 - t
                cur.append((mt ** 3 * p0[0] + 3 * mt * mt * t * p1[0] + 3 * mt * t * t * p2[0] + t ** 3 * p3[0],
                            mt ** 3 * p0[1] + 3 * mt * mt * t * p1[1] + 3 * mt * t * t * p2[1] + t ** 3 * p3[1]))
            pos = p3
        elif op in ("closePath", "endPath"):
            if cur:
                contours.append(cur)
            cur = []
    return contours


def svg_path(ops, x0: float, y1: float) -> str:
    """Outline as SVG path data, translated so the ink box starts at (0,0), y down."""
    def pt(p):
        return f"{p[0] - x0:.0f} {y1 - p[1]:.0f}"

    out = []
    for op, args in ops:
        if op == "moveTo":
            out.append("M" + pt(args[0]))
        elif op == "lineTo":
            out.append("L" + pt(args[0]))
        elif op == "qCurveTo":
            pts = list(args)
            if pts[-1] is None:
                pts = pts[:-1]
                pts.append(((pts[-1][0] + pts[0][0]) / 2, (pts[-1][1] + pts[0][1]) / 2))
            offs, end = pts[:-1], pts[-1]
            for i, c in enumerate(offs):
                nxt = end if i == len(offs) - 1 else ((c[0] + offs[i + 1][0]) / 2, (c[1] + offs[i + 1][1]) / 2)
                out.append("Q" + pt(c) + " " + pt(nxt))
        elif op == "curveTo":
            out.append("C" + " ".join(pt(p) for p in args))
        elif op == "closePath":
            out.append("Z")
    return "".join(out)


# ------------------------------------------------------------ raster + skeleton
def rasterise(contours, x0, y0, x1, y1):
    """Non-zero winding fill. Returns (mask[h, w], scale, pad) with row 0 at the top."""
    pad = 6
    scale = (RASTER - 2 * pad) / max(x1 - x0, y1 - y0)
    w = int(np.ceil((x1 - x0) * scale)) + 2 * pad
    h = int(np.ceil((y1 - y0) * scale)) + 2 * pad
    xs = (np.arange(w) + 0.5 - pad) / scale + x0
    ys = y1 - (np.arange(h) + 0.5 - pad) / scale
    X, Y = np.meshgrid(xs, ys)
    wind = np.zeros((h, w), dtype=np.int32)
    for c in contours:
        pts = np.array(c + [c[0]])
        ax, ay, bx, by = pts[:-1, 0], pts[:-1, 1], pts[1:, 0], pts[1:, 1]
        for i in range(len(ax)):
            if ay[i] == by[i]:
                continue
            up = ay[i] <= Y
            crosses = up != (by[i] <= Y)
            xint = ax[i] + (Y - ay[i]) * (bx[i] - ax[i]) / (by[i] - ay[i])
            hit = crosses & (X < xint)
            wind += np.where(hit, np.where(by[i] > ay[i], 1, -1), 0)
    return wind != 0, scale, pad


def thin(mask: np.ndarray) -> np.ndarray:
    """Zhang-Suen thinning."""
    img = np.pad(mask.astype(np.uint8), 1)
    while True:
        changed = False
        for step in (0, 1):
            P = [img[:-2, 1:-1], img[:-2, 2:], img[1:-1, 2:], img[2:, 2:],
                 img[2:, 1:-1], img[2:, :-2], img[1:-1, :-2], img[:-2, :-2]]
            B = sum(p.astype(np.int32) for p in P)
            A = sum(((P[i] == 0) & (P[(i + 1) % 8] == 1)).astype(np.int32) for i in range(8))
            if step == 0:
                c = (P[0] * P[2] * P[4] == 0) & (P[2] * P[4] * P[6] == 0)
            else:
                c = (P[0] * P[2] * P[6] == 0) & (P[0] * P[4] * P[6] == 0)
            core = img[1:-1, 1:-1]
            kill = (core == 1) & (B >= 2) & (B <= 6) & (A == 1) & c
            if kill.any():
                core[kill] = 0
                changed = True
        if not changed:
            return img[1:-1, 1:-1].astype(bool)


def shortest(sk: np.ndarray, a: tuple[int, int], b: tuple[int, int]) -> list[tuple[int, int]]:
    """Dijkstra over 8-connected skeleton pixels; (row, col) tuples."""
    h, w = sk.shape
    dist = {a: 0.0}
    prev: dict = {}
    heap = [(0.0, a)]
    while heap:
        d, p = heapq.heappop(heap)
        if p == b:
            break
        if d > dist.get(p, 1e18):
            continue
        r, c = p
        for dr in (-1, 0, 1):
            for dc in (-1, 0, 1):
                if not dr and not dc:
                    continue
                q = (r + dr, c + dc)
                if 0 <= q[0] < h and 0 <= q[1] < w and sk[q]:
                    nd = d + (1.4142 if dr and dc else 1.0)
                    if nd < dist.get(q, 1e18):
                        dist[q] = nd
                        prev[q] = p
                        heapq.heappush(heap, (nd, q))
    if b not in prev and a != b:
        return [a, b]  # disconnected: jump
    path = [b]
    while path[-1] != a:
        path.append(prev[path[-1]])
    return path[::-1]


def smooth(path, radius=3):
    if len(path) < 3:
        return path
    out = []
    n = len(path)
    for i, p in enumerate(path):
        if i in (0, n - 1):
            out.append(p)
            continue
        r = min(radius, i, n - 1 - i)
        seg = path[i - r:i + r + 1]
        out.append((sum(q[0] for q in seg) / len(seg), sum(q[1] for q in seg) / len(seg)))
    return out


def simplify(pts, eps):
    """Ramer-Douglas-Peucker."""
    if len(pts) < 3:
        return pts
    a, b = np.array(pts[0]), np.array(pts[-1])
    ab = b - a
    L = np.hypot(*ab) or 1e-9
    d = [abs(ab[0] * (p[1] - a[1]) - ab[1] * (p[0] - a[0])) / L for p in pts[1:-1]]
    i = int(np.argmax(d)) + 1
    if d[i - 1] > eps:
        return simplify(pts[:i + 1], eps)[:-1] + simplify(pts[i:], eps)
    return [pts[0], pts[-1]]


# ------------------------------------------------------------ per glyph
def build(font: TTFont, glyph: str, waypoints):
    ops, (x0, y0, x1, y1) = glyph_outline(font, glyph)
    contours = flatten(ops)
    mask, scale, pad = rasterise(contours, x0, y0, x1, y1)
    sk = thin(mask)
    rows, cols = np.nonzero(mask)
    ir0, ir1, ic0, ic1 = rows.min(), rows.max(), cols.min(), cols.max()
    sk_pts = np.argwhere(sk)

    def to_px(u, v):  # ink-box fraction -> (row, col)
        return ir0 + v * (ir1 - ir0), ic0 + u * (ic1 - ic0)

    def snap(u, v):
        r, c = to_px(u, v)
        i = int(np.argmin((sk_pts[:, 0] - r) ** 2 + (sk_pts[:, 1] - c) ** 2))
        return tuple(int(x) for x in sk_pts[i])

    def to_font(r, c):  # pixel -> font units, origin at ink box top-left, y down
        return (round((c + 0.5 - pad) / scale, 1), round((r + 0.5 - pad) / scale, 1))

    strokes = []
    for stroke in waypoints:
        if len(stroke) == 1:
            strokes.append([to_font(*to_px(*stroke[0]))])
            continue
        snapped = [snap(u, v) for u, v in stroke]
        pix = [snapped[0]]
        for a, b in zip(snapped, snapped[1:]):
            pix += shortest(sk, a, b)[1:]
        pts = [to_font(r, c) for r, c in smooth(pix)]
        strokes.append([(round(x), round(y)) for x, y in simplify(pts, eps=4.0)])
    pen = float(mask.sum()) / max(1, int(sk.sum())) / scale  # ink area / centreline length
    return {
        "glyph": glyph,
        "outline": svg_path(ops, x0, y1),
        "box": {"x": 0, "y": 0, "w": round(x1 - x0), "h": round(y1 - y0)},
        "strokes": [[list(p) for p in s] for s in strokes],
        "penWidth": round(pen),
    }


def preview(data: dict) -> str:
    cell, cols = 180, 8
    colors = ["#FF8A3D", "#5B4FE0", "#3DBE6E", "#F2546B"]
    items = list(data.values())
    rows = (len(items) + cols - 1) // cols
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {cols * cell} {rows * cell}" font-family="sans-serif">',
           f'<rect width="100%" height="100%" fill="#FFF8EC"/>']
    for i, g in enumerate(items):
        ox, oy = (i % cols) * cell, (i // cols) * cell
        k = (cell - 40) / max(g["box"]["w"], g["box"]["h"])
        tx, ty = ox + (cell - g["box"]["w"] * k) / 2, oy + 12 + (cell - 40 - g["box"]["h"] * k) / 2
        out.append(f'<g transform="translate({tx:.1f} {ty:.1f}) scale({k:.4f})">')
        out.append(f'<path d="{g["outline"]}" fill="#EADFC9"/>')
        for j, s in enumerate(g["strokes"]):
            col = colors[j % len(colors)]
            if len(s) == 1:
                out.append(f'<circle cx="{s[0][0]}" cy="{s[0][1]}" r="{g["penWidth"] / 3:.0f}" fill="{col}"/>')
                continue
            d = "M" + " L".join(f"{x} {y}" for x, y in s)
            out.append(f'<path d="{d}" fill="none" stroke="{col}" stroke-width="{g["penWidth"] / 5:.0f}" stroke-linecap="round" stroke-linejoin="round"/>')
            out.append(f'<circle cx="{s[0][0]}" cy="{s[0][1]}" r="{g["penWidth"] / 3:.0f}" fill="{col}"/>')
            out.append(f'<text x="{s[0][0]}" y="{s[0][1]}" dy="{g["penWidth"] / 8:.0f}" font-size="{g["penWidth"] / 2.2:.0f}" fill="#fff" text-anchor="middle" font-weight="bold">{j + 1}</text>')
        out.append("</g>")
        out.append(f'<text x="{ox + cell / 2}" y="{oy + cell - 8}" font-size="13" text-anchor="middle" fill="#23204A">{g["glyph"]}</text>')
    out.append("</svg>")
    return "\n".join(out) + "\n"


def main() -> None:
    src = json.loads(WAYPOINTS.read_text())
    font = TTFont(FONT)
    data = {g: build(font, g, w) for g, w in src["glyphs"].items()}
    doc = {"version": 1, "_doc": "GENERATED by tools/letter_strokes.py from stroke-waypoints.json and the app font. Do not edit.",
           "glyphs": data}
    text = json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n"
    if "--check" in sys.argv:
        if not OUT.exists() or OUT.read_text() != text:
            sys.exit("strokes.json is stale: run python3 tools/letter_strokes.py")
        print("strokes up to date")
        return
    OUT.write_text(text)
    PREVIEW.write_text(preview(data))
    print(f"wrote {len(data)} glyphs to {OUT.relative_to(ROOT)} ({len(text) // 1024} KB) and {PREVIEW.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
