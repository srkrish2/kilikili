import { useEffect, useRef } from 'react';
import { LETTERS } from '../content/letters';
import { STROKES } from '../content/strokes';
import { glyphMask, layoutGlyph, STROKE_WORK_PX } from '../lib/glyph';
import { inkBounds, strokePaths, thin } from '../lib/strokes';

const PX = STROKE_WORK_PX;
const COLORS = ['#e8590c', '#1c7ed6', '#2f9e44', '#ae3ec9'];

function LabCell({ char, scale }: { char: string; scale: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    document.fonts.load(`800 100px "Baloo Thambi 2"`, char).then(() => {
      const c = ref.current!;
      c.width = c.height = PX;
      const ctx = c.getContext('2d')!;
      const { x, y } = layoutGlyph(ctx, char, PX);
      ctx.fillStyle = '#e9e3d8';
      ctx.fillText(char, x, y);
      const mask = glyphMask(char, PX);
      const box = inkBounds(mask)!;
      // Skeleton.
      const sk = thin(mask);
      ctx.fillStyle = '#c92a2a55';
      for (let i = 0; i < sk.data.length; i++) if (sk.data[i]) ctx.fillRect(i % PX, Math.floor(i / PX), 1, 1);
      // Bounding-box grid in tenths, labelled every 0.2.
      ctx.font = '9px sans-serif';
      for (let q = 0; q <= 10; q++) {
        const gx = box.x0 + ((box.x1 - box.x0) * q) / 10;
        const gy = box.y0 + ((box.y1 - box.y0) * q) / 10;
        ctx.strokeStyle = q % 5 ? '#0001' : '#0003';
        ctx.beginPath();
        ctx.moveTo(gx, box.y0);
        ctx.lineTo(gx, box.y1);
        ctx.moveTo(box.x0, gy);
        ctx.lineTo(box.x1, gy);
        ctx.stroke();
        if (q % 2 === 0) {
          ctx.fillStyle = '#0007';
          ctx.fillText(String(q / 10), gx - 6, box.y0 - 3);
          ctx.fillText(String(q / 10), box.x0 - 18, gy + 3);
        }
      }
      // Derived strokes with start markers.
      const strokes = STROKES[char];
      if (!strokes) return;
      strokePaths(mask, strokes).forEach((path, i) => {
        ctx.strokeStyle = COLORS[i % COLORS.length];
        ctx.fillStyle = COLORS[i % COLORS.length];
        ctx.lineWidth = 3;
        ctx.beginPath();
        path.forEach(([px, py], j) => (j ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
        ctx.stroke();
        const [sx, sy] = path[0];
        ctx.beginPath();
        ctx.arc(sx, sy, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(String(i + 1), sx - 3, sy + 4);
        // Arrowhead at the end shows direction.
        const [ex, ey] = path[path.length - 1];
        const [px2, py2] = path[Math.max(0, path.length - 6)];
        const a = Math.atan2(ey - py2, ex - px2);
        ctx.fillStyle = COLORS[i % COLORS.length];
        ctx.beginPath();
        ctx.moveTo(ex + 8 * Math.cos(a), ey + 8 * Math.sin(a));
        ctx.lineTo(ex + 8 * Math.cos(a + 2.5), ey + 8 * Math.sin(a + 2.5));
        ctx.lineTo(ex + 8 * Math.cos(a - 2.5), ey + 8 * Math.sin(a - 2.5));
        ctx.fill();
      });
      // Waypoints.
      ctx.fillStyle = '#000';
      for (const s of strokes) {
        for (const [u, v] of s) {
          ctx.fillRect(box.x0 + u * (box.x1 - box.x0) - 2, box.y0 + v * (box.y1 - box.y0) - 2, 4, 4);
        }
      }
    });
  }, [char]);
  return (
    <figure className="lab-cell" data-char={char}>
      <canvas ref={ref} style={{ width: PX * scale, height: PX * scale }} />
      <figcaption>
        {char} {STROKES[char] ? `· ${STROKES[char].length} stroke(s)` : '· no strokes'}
      </figcaption>
    </figure>
  );
}

/** Dev-only page for authoring and checking stroke waypoints. */
export function StrokeLab() {
  const only = new URLSearchParams(window.location.hash.split('?')[1]).get('only');
  const params = new URLSearchParams(window.location.hash.split('?')[1]);
  const chars = only ? only.split(',') : [...LETTERS.keys()];
  const scale = Number(params.get('scale') ?? 1.6);
  return (
    <div className="lab">
      {chars.map((c) => (
        <LabCell key={c} char={c} scale={scale} />
      ))}
    </div>
  );
}
