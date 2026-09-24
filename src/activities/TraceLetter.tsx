import { PROMPT } from '../content/prompts';
import { useEffect, useRef, useState } from 'react';
import type { Letter } from '../content/letters';
import { NextButton, SpeakerButton, useAutoSpeak } from '../components/common';
import { randomPraise, speak } from '../lib/speech';
import { sfx } from '../lib/sfx';

const FONT = '"Baloo Thambi 2", "Noto Sans Tamil", sans-serif';
const PASS_COVERAGE = 0.7;
const MAX_STRAY = 0.35;

interface Masks {
  /** Pixel indices (RGBA offsets) sampled inside the glyph. */
  targets: number[];
  /** Alpha of a generously dilated glyph, used to detect scribbling elsewhere. */
  allowed: Uint8ClampedArray;
  step: number;
}

function drawGlyph(ctx: CanvasRenderingContext2D, char: string, px: number) {
  let size = px * 0.72;
  ctx.font = `800 ${size}px ${FONT}`;
  let m = ctx.measureText(char);
  const w = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
  const h = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
  size *= Math.min((px * 0.8) / w, (px * 0.8) / h);
  ctx.font = `800 ${size}px ${FONT}`;
  m = ctx.measureText(char);
  const x = px / 2 - (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2;
  const y = px / 2 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
  return { x, y, font: ctx.font };
}

/**
 * Finger tracing over a faint letter. Rather than needing stroke-order data
 * for every Tamil letter, we check coverage: enough of the glyph painted,
 * without too much ink outside it.
 */
export function TraceLetter({ letter, onDone }: { letter: Letter; onDone: (mistakes: number) => void }) {
  const guideRef = useRef<HTMLCanvasElement>(null);
  const inkRef = useRef<HTMLCanvasElement>(null);
  const masks = useRef<Masks | null>(null);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [done, setDone] = useState(false);
  const [strokes, setStrokes] = useState(0);
  const [cssSize] = useState(() => Math.min(window.innerWidth - 40, window.innerHeight - 300, 380));

  useAutoSpeak([letter.say, PROMPT.trace]);

  useEffect(() => {
    let cancelled = false;
    const dpr = window.devicePixelRatio || 1;
    const px = Math.round(cssSize * dpr);
    for (const c of [guideRef.current!, inkRef.current!]) {
      c.width = c.height = px;
    }
    document.fonts.load(`800 100px "Baloo Thambi 2"`, letter.char).finally(() => {
      if (cancelled) return;
      const g = guideRef.current!.getContext('2d')!;
      g.clearRect(0, 0, px, px);
      const { x, y, font } = drawGlyph(g, letter.char, px);
      g.fillStyle = '#e4ddd0';
      g.fillText(letter.char, x, y);
      g.setLineDash([6 * dpr, 8 * dpr]);
      g.lineWidth = 2 * dpr;
      g.strokeStyle = '#b9ae9c';
      g.strokeText(letter.char, x, y);

      // Offscreen masks.
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
    });
    return () => {
      cancelled = true;
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
    setStrokes((n) => n + 1);
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
        <canvas
          ref={inkRef}
          className="ink"
          onPointerDown={(e) => {
            if (done) return;
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
        <button className="btn btn-soft" onClick={clear} aria-label="மீண்டும்">
          ↺
        </button>
        {/* Small hands struggle with precision: let them move on after a good try. */}
        {(done || strokes >= 6) && <NextButton pulse={done} onClick={() => onDone(0)} />}
      </div>
    </div>
  );
}
