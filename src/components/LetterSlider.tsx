import { useLayoutEffect, useRef, useState } from 'react';
import { speak } from '../lib/speech';
import { sfx } from '../lib/sfx';

interface Props {
  /** The pieces to slide across: letter tiles of a word. */
  segments: string[];
  /** What to say for each segment as the slider reaches it. */
  spoken: (segment: string) => string;
  /** Said after sliding all the way across, e.g. the whole word. */
  whole?: string;
  onComplete?: () => void;
}

interface Span {
  left: number;
  right: number;
}

/**
 * Reading slider: the child drags the parrot under the word, left to right.
 * The letter above the finger lights up and is sounded while the others fade,
 * which keeps attention on exactly one letter at a time. Reaching the end
 * blends the letters into the whole word.
 */
export function LetterSlider({ segments, spoken, whole, onComplete }: Props) {
  const rowRef = useRef<HTMLDivElement>(null);
  const segRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [spans, setSpans] = useState<Span[]>([]);
  const [x, setX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [touched, setTouched] = useState(false);
  const visited = useRef(new Set<number>());
  const lastSound = useRef<Promise<unknown>>(Promise.resolve());

  // Measure where each letter sits so the knob position maps to a letter.
  useLayoutEffect(() => {
    const measure = () => {
      const row = rowRef.current?.getBoundingClientRect();
      if (!row) return;
      setSpans(
        segRefs.current.map((el) => {
          const r = el!.getBoundingClientRect();
          return { left: r.left - row.left, right: r.right - row.left };
        }),
      );
    };
    measure();
    document.fonts?.ready.then(measure);
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [segments.join('')]);

  const width = spans.length ? spans[spans.length - 1].right : 0;

  const segmentAt = (px: number) => spans.findIndex((s) => px >= s.left && px < s.right);

  const moveTo = (clientX: number) => {
    const row = rowRef.current!.getBoundingClientRect();
    const px = Math.min(Math.max(clientX - row.left, 0), width);
    setX(px);
    const i = segmentAt(px);
    if (i !== -1 && i !== active) {
      setActive(i);
      visited.current.add(i);
      sfx.tap();
      lastSound.current = speak(spoken(segments[i]));
    }
    if (px >= width - 2 && visited.current.size === segments.length && !done) {
      setDone(true);
      setActive(null);
      // Let the last letter finish, then blend into the whole word.
      lastSound.current
        .then(() => (whole ? speak(whole) : undefined))
        .then(() => onComplete?.());
    }
  };

  const start = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setTouched(true);
    setDragging(true);
    // A fresh pass starts from the letter under the finger.
    visited.current = new Set();
    setActive(null);
    if (done) setDone(false);
    moveTo(e.clientX);
  };

  const end = () => {
    setDragging(false);
    if (!done) {
      // Spring back so the next try starts at the beginning of the word.
      setX(0);
      setActive(null);
    }
  };

  const state = (i: number) => {
    if (done) return 'lit';
    if (active === null) return '';
    return i === active ? 'focus' : 'dim';
  };

  return (
    <div
      className={`slider ${dragging ? 'dragging' : ''} ${done ? 'done' : ''}`}
      onPointerDown={start}
      onPointerMove={(e) => dragging && moveTo(e.clientX)}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <div className="slider-word" ref={rowRef}>
        {segments.map((s, i) => (
          <span key={i} ref={(el) => void (segRefs.current[i] = el)} className={`slider-seg ${state(i)}`}>
            {s}
          </span>
        ))}
      </div>
      <div className="slider-track" style={{ width: width || undefined }}>
        <div className="slider-fill" style={{ width: x }} />
        <span className={`slider-knob ${touched ? '' : 'nudge'}`} style={{ left: x }}>
          🦜
        </span>
        <span className="slider-arrow" aria-hidden>
          ➜
        </span>
      </div>
    </div>
  );
}
