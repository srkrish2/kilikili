// Letters Line: which letter to teach, Nandu's find rounds, and trace scoring.
// Letters use the same knowledge model as words (tracer.ts), keyed by glyph.
import { shuffle } from './picker';
import { record, status } from './tracer';
import type { Curriculum, CurriculumLetter, DayKey, LetterRules, LetterStrokes, Rng, SavedState, ScoringRules, WordProgress, WordStatus } from './types';

export function curriculumLetters(c: Curriculum): CurriculumLetter[] {
  return (c.lines.find((l) => l.id === 'letters')?.letters ?? []).slice().sort((a, b) => a.n - b.n);
}

export function initialLetterProgress(rules: LetterRules): WordProgress {
  return { p: rules.prior, n: 0, c: 0, days: [], lastDay: null };
}

export function letterStatus(s: SavedState, glyph: string, scoring: ScoringRules): WordStatus {
  return status(s.letters[glyph], scoring);
}

export function knownLetters(s: SavedState, letters: CurriculumLetter[], scoring: ScoringRules): string[] {
  return letters.filter((l) => letterStatus(s, l.glyph, scoring) === 'known').map((l) => l.glyph);
}

/** Letters he has had a lesson for (what games and reviews may use). */
export function taughtLetters(s: SavedState, letters: CurriculumLetter[]): CurriculumLetter[] {
  return letters.filter((l) => (s.lessonsDone[l.glyph] ?? 0) > 0);
}

/**
 * The next lesson: the first letter in curriculum order that hasn't had a lesson.
 * Once all have, revisit the least-certain letter that isn't known yet (or, if every
 * letter is known, the least-certain one overall).
 */
export function nextLessonLetter(s: SavedState, letters: CurriculumLetter[], scoring: ScoringRules, rules: LetterRules): CurriculumLetter {
  const fresh = letters.find((l) => !(s.lessonsDone[l.glyph] > 0));
  if (fresh) return fresh;
  const p = (l: CurriculumLetter) => (s.letters[l.glyph] ?? initialLetterProgress(rules)).p;
  const notKnown = letters.filter((l) => letterStatus(s, l.glyph, scoring) !== 'known');
  const pool = notKnown.length ? notKnown : letters;
  return pool.slice().sort((a, b) => p(a) - p(b))[0];
}

export function recordLetter(s: SavedState, glyph: string, correct: boolean, guess: number, day: DayKey, scoring: ScoringRules, rules: LetterRules): SavedState {
  const cur = s.letters[glyph] ?? initialLetterProgress(rules);
  return { ...s, letters: { ...s.letters, [glyph]: record(cur, correct, guess, day, scoring) } };
}

export interface FindRound { target: string; options: string[] }

/**
 * Nandu's check: find the new letter twice, plus one round for an earlier letter so
 * old letters keep coming back. Distractors prefer letters he has already met, so
 * the choice is between letters he has actually seen.
 */
export function findRounds(target: CurriculumLetter, letters: CurriculumLetter[], s: SavedState, rules: LetterRules, rng: Rng): FindRound[] {
  const taught = taughtLetters(s, letters).filter((l) => l.glyph !== target.glyph);
  const targets = Array.from({ length: rules.findRounds }, (_, i) =>
    i === rules.findRounds - 1 && taught.length ? taught[Math.floor(rng() * taught.length)].glyph : target.glyph);
  return shuffle(targets, rng).map((t) => {
    const others = letters.map((l) => l.glyph).filter((g) => g !== t);
    const seen = shuffle(others.filter((g) => taught.some((l) => l.glyph === g) || g === target.glyph), rng);
    const unseen = shuffle(others.filter((g) => !seen.includes(g)), rng);
    return { target: t, options: shuffle([t, ...[...seen, ...unseen].slice(0, rules.findChoices - 1)], rng) };
  });
}

// ------------------------------------------------------------------ tracing

export type Pt = [number, number];

/** Points every `step` units along a polyline (a one-point stroke is a dot). */
export function densify(line: Pt[], step: number): Pt[] {
  if (line.length < 2) return line.slice();
  const out: Pt[] = [line[0]];
  for (let i = 1; i < line.length; i++) {
    const [x0, y0] = line[i - 1];
    const [x1, y1] = line[i];
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / step));
    for (let k = 1; k <= n; k++) out.push([x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n]);
  }
  return out;
}

export interface TraceResult {
  /** Share of the centreline the finger passed near. */
  coverage: number;
  /** Share of the finger's path far from any stroke (scribbling elsewhere). */
  stray: number;
  passed: boolean;
}

/**
 * Scores a trace geometrically, in the glyph's font units. `touches` are the finger's
 * polylines (one per finger-down). Forgiving on purpose: stroke order is taught by the
 * demo, not enforced, so small hands still succeed.
 */
export function scoreTrace(glyph: LetterStrokes, touches: Pt[][], rules: LetterRules): TraceResult {
  const step = glyph.penWidth / 4;
  const target = glyph.strokes.flatMap((s) => densify(s as Pt[], step));
  const finger = touches.flatMap((t) => densify(t, step));
  if (!finger.length || !target.length) return { coverage: 0, stray: 0, passed: false };
  const near = rules.traceTolerance * glyph.penWidth;
  const far = 1.5 * glyph.penWidth;
  const minDist = (p: Pt, set: Pt[]) => {
    let best = Infinity;
    for (const q of set) {
      const d = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2;
      if (d < best) best = d;
    }
    return Math.sqrt(best);
  };
  const coverage = target.filter((p) => minDist(p, finger) <= near).length / target.length;
  const stray = finger.filter((p) => minDist(p, target) > far).length / finger.length;
  return { coverage, stray, passed: coverage >= rules.traceCoverage && stray <= rules.traceMaxStray };
}
