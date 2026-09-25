import { PROMPT } from '../content/prompts';
import { useEffect, useRef, useState } from 'react';
import type { Letter } from '../content/letters';
import { STROKES } from '../content/strokes';
import { NextButton, SpeakerButton, useAutoSpeak } from '../components/common';
import { glyphStrokes, layoutGlyph } from '../lib/glyph';
import { pathLength, type Pt } from '../lib/strokes';
import { randomPraise, speak } from '../lib/speech';
import { sfx } from '../lib/sfx';

const PASS_COVERAGE = 0.7;
const MAX_STRAY = 0.35;
const DEMO_COLOR = '#ff8a3d';
const START_COLOR = '#2bb673';

interface Masks {
  /** Pixel indices (RGBA offsets) sampled inside the glyph. */
  targets: number[];
  /** Alpha of a generously dilated glyph, used to detect scribbling elsewhere. */
  allowed: Uint8ClampedArray;
  step: number;
}

/** Numbered start dots, so the child knows where each stroke begins. */
function drawStartMarkers(ctx: CanvasRenderingContext2D, strokes: Pt[][], px: number) {
  const r = px * 0.035;
  strokes.forEach((s, i) => {
    const [x, y] = s[0];
    ctx.fillStyle = START_COLOR;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `800 ${r * 1.3}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(i + 1), x, y + r * 0.05);
  });
}

/**
 * Animates the strokes in writing order on `canvas`: a growing line with a
 * pen marker at its head. Resolves when finished; `cancel()` stops it early.
 */
function playDemo(canvas: HTMLCanvasElement, strokes: Pt[][]): { done: Promise<void>; cancel: () => void } {
  const ctx = canvas.getContext('2d')!;
  const px = canvas.width;
  const speed = px * 0.55; // pixels per second
  let raf = 0;
  let cancelled = false;
  const done = new Promise<void>((resolve) => {
    let strokeIndex = 0;
    let start = performance.now();
    const pauseMs = 350;

    const frame = (now: number) => {
      if (cancelled) return resolve();
      ctx.clearRect(0, 0, px, px);
      ctx.lineCap = ctx.lineJoin = 'round';
      ctx.lineWidth = px * 0.05;
      ctx.strokeStyle = DEMO_COLOR;
      ctx.fillStyle = DEMO_COLOR;
      // Finished strokes stay drawn.
      for (let i = 0; i < strokeIndex; i++) drawPartial(ctx, strokes[i], Infinity, px);
      const s = strokes[strokeIndex];
      const len = pathLength(s);
      const travelled = ((now - start) / 1000) * speed;
      const head = drawPartial(ctx, s, travelled, px);
      // Pen marker.
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = DEMO_COLOR;
      ctx.lineWidth = px * 0.012;
      ctx.beginPath();
      ctx.arc(head[0], head[1], px * 0.03, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (travelled >= len + (pauseMs / 1000) * speed) {
        strokeIndex++;
        start = now;
        if (strokeIndex >= strokes.length) {
          ctx.clearRect(0, 0, px, px);
          ctx.lineCap = ctx.lineJoin = 'round';
          ctx.lineWidth = px * 0.05;
          ctx.strokeStyle = DEMO_COLOR;
          ctx.fillStyle = DEMO_COLOR;
          strokes.forEach((st) => drawPartial(ctx, st, Infinity, px));
          return resolve();
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
  });
  return {
    done,
    cancel: () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ctx.clearRect(0, 0, px, px);
    },
  };
}

/** Draws the first `upTo` pixels of a stroke; returns the head position. */
function drawPartial(ctx: CanvasRenderingContext2D, s: Pt[], upTo: number, px: number): Pt {
  if (s.length === 1) {
    // A dot pops in.
    ctx.beginPath();
    ctx.arc(s[0][0], s[0][1], px * 0.03, 0, Math.PI * 2);
    ctx.fill();
    return s[0];
  }
  ctx.beginPath();
  ctx.moveTo(s[0][0], s[0][1]);
  let left = upTo;
  let head = s[0];
  for (let i = 1; i < s.length; i++) {
    const [x0, y0] = s[i - 1];
    const [x1, y1] = s[i];
    const seg = Math.hypot(x1 - x0, y1 - y0);
    if (left >= seg) {
      ctx.lineTo(x1, y1);
      head = s[i];
      left -= seg;
    } else {
      const t = left / seg;
      head = [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t];
      ctx.lineTo(head[0], head[1]);
      break;
    }
  }
  ctx.stroke();
  return head;
}

/**
 * Finger tracing over a faint letter. First an animated pen shows the stroke
 * order (from src/content/strokes.ts); then the child traces. Success is
 * judged by coverage — enough of the glyph painted without too much ink
 * outside it — which stays forgiving for small hands.
 */
export function TraceLetter({ letter, onDone }: { letter: Letter; onDone: (mistakes: number) => void }) {
  const guideRef = useRef<HTMLCanvasElement>(null);
  const demoRef = useRef<HTMLCanvasElement>(null);
  const inkRef = useRef<HTMLCanvasElement>(null);
  const masks = useRef<Masks | null>(null);
  const strokePaths = useRef<Pt[][] | null>(null);
  const demo = useRef<{ cancel: () => void } | null>(null);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [done, setDone] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [demoing, setDemoing] = useState(false);
  const [cssSize] = useState(() => Math.min(window.innerWidth - 40, window.innerHeight - 300, 380));
  const hasStrokes = letter.char in STROKES;

  useAutoSpeak([letter.say, PROMPT.trace]);

  const showDemo = () => {
    if (!strokePaths.current || !demoRef.current) return;
    demo.current?.cancel();
    setDemoing(true);
    const d = playDemo(demoRef.current, strokePaths.current);
    demo.current = d;
    d.done.then(() => {
      if (demo.current !== d) return;
      setDemoing(false);
      // Leave the finished demo faintly visible for a moment, then clear it for tracing.
      setTimeout(() => {
        if (demo.current === d) {
          d.cancel();
          demo.current = null;
        }
      }, 700);
    });
  };

  const stopDemo = () => {
    demo.current?.cancel();
    demo.current = null;
    setDemoing(false);
  };

  useEffect(() => {
    let cancelled = false;
    const dpr = window.devicePixelRatio || 1;
    const px = Math.round(cssSize * dpr);
    for (const c of [guideRef.current!, demoRef.current!, inkRef.current!]) {
      c.width = c.height = px;
    }
    document.fonts.load(`800 100px "Baloo Thambi 2"`, letter.char).finally(() => {
      if (cancelled) return;
      const g = guideRef.current!.getContext('2d')!;
      g.clearRect(0, 0, px, px);
      const { x, y, font } = layoutGlyph(g, letter.char, px);
      g.fillStyle = '#e4ddd0';
      g.fillText(letter.char, x, y);
      g.setLineDash([6 * dpr, 8 * dpr]);
      g.lineWidth = 2 * dpr;
      g.strokeStyle = '#b9ae9c';
      g.strokeText(letter.char, x, y);
      g.setLineDash([]);

      // Offscreen masks for scoring.
      const off = document.createElement('canvas');
      off.width = off.height = px;
      const o = off.getContext('2d', { willReadFrequently: true })!;
      o.font = font;
      o.fillText(letter.char, x, y);
      const glyph = o.getImageData(0, 0, px, px).data;
      o.lineWidth = px * 0.12;
      o.lineJoin = 'round';
      o.strokeText(letter.char, x, y);
      const allowed = o.getImageData(0, 0, px, px).data;

      const step = Math.max(2, Math.round(4 * dpr));
      const targets: number[] = [];
      for (let yy = 0; yy < px; yy += step) {
        for (let xx = 0; xx < px; xx += step) {
          const i = (yy * px + xx) * 4;
          if (glyph[i + 3] > 128) targets.push(i);
        }
      }
      masks.current = { targets, allowed, step };

      if (hasStrokes) {
        strokePaths.current = glyphStrokes(letter.char, px, STROKES[letter.char]);
        drawStartMarkers(g, strokePaths.current, px);
        // Let the spoken prompt start before the pen moves.
        setTimeout(() => !cancelled && showDemo(), 900);
      }
    });
    return () => {
      cancelled = true;
      demo.current?.cancel();
    };
  }, [letter.char, cssSize]);

  const point = (e: React.PointerEvent) => {
    const c = inkRef.current!;
    const r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height };
  };

  const drawTo = (p: { x: number; y: number }) => {
    const c = inkRef.current!;
    const ctx = c.getContext('2d')!;
    ctx.strokeStyle = '#2bb673';
    ctx.lineCap = ctx.lineJoin = 'round';
    ctx.lineWidth = c.width * 0.075;
    ctx.beginPath();
    const from = last.current ?? p;
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(p.x + 0.01, p.y);
    ctx.stroke();
    last.current = p;
  };

  const evaluate = () => {
    const m = masks.current;
    if (!m || done) return;
    setAttempts((n) => n + 1);
    const c = inkRef.current!;
    const ink = c.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, c.width, c.height).data;
    const covered = m.targets.filter((i) => ink[i + 3] > 0).length / m.targets.length;
    let inked = 0;
    let stray = 0;
    for (let i = 0; i < ink.length; i += m.step * 4) {
      if (ink[i + 3] > 0) {
        inked++;
        if (m.allowed[i + 3] === 0) stray++;
      }
    }
    if (covered >= PASS_COVERAGE && stray / Math.max(inked, 1) <= MAX_STRAY) {
      setDone(true);
      sfx.correct();
      speak(randomPraise());
    }
  };

  const clear = () => {
    const c = inkRef.current!;
    c.getContext('2d')!.clearRect(0, 0, c.width, c.height);
    setDone(false);
  };

  return (
    <div className="activity trace">
      <div className="prompt">
        <SpeakerButton texts={[letter.say]} />
        <span>✍️ விரலால் எழுது</span>
      </div>
      <div className={`trace-board ${done ? 'glow' : ''}`} style={{ width: cssSize, height: cssSize }}>
        <canvas ref={guideRef} />
        <canvas ref={demoRef} className="demo" />
        <canvas
          ref={inkRef}
          className="ink"
          onPointerDown={(e) => {
            if (done) return;
            // Touching the board means the child is ready: stop the demo.
            stopDemo();
            e.currentTarget.setPointerCapture(e.pointerId);
            last.current = null;
            drawTo(point(e));
          }}
          onPointerMove={(e) => {
            if (!done && e.buttons) drawTo(point(e));
          }}
          onPointerUp={() => {
            last.current = null;
            evaluate();
          }}
        />
      </div>
      <div className="row">
        {hasStrokes && (
          <button
            className="btn btn-soft"
            onClick={() => {
              clear();
              showDemo();
            }}
            disabled={demoing}
            aria-label="காட்டு"
          >
            👀
          </button>
        )}
        <button className="btn btn-soft" onClick={clear} aria-label="மீண்டும்">
          ↺
        </button>
        {/* Small hands struggle with precision: let them move on after a good try. */}
        {(done || attempts >= 6) && <NextButton pulse={done} onClick={() => onDone(0)} />}
      </div>
    </div>
  );
}
