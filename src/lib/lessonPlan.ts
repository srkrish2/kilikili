import { ALL_LESSONS, type Lesson } from '../content/lessons';
import { getLetter, type Letter } from '../content/letters';
import { getWord, type Word } from '../content/words';
import { shuffle, type Rng } from './random';

export type Step =
  | { type: 'meet'; letter: Letter }
  | { type: 'trace'; letter: Letter }
  | { type: 'find'; target: Letter; choices: Letter[] }
  | { type: 'pop'; target: Letter; bubbles: Letter[] }
  | { type: 'blend'; word: Word }
  | { type: 'match'; word: Word; choices: Word[] }
  | { type: 'listen'; word: Word; choices: Word[] }
  | { type: 'build'; word: Word; tiles: string[] };

function earlierLessons(lesson: Lesson): Lesson[] {
  return ALL_LESSONS.slice(0, ALL_LESSONS.findIndex((l) => l.id === lesson.id));
}

/**
 * Candidate distractors: this lesson's items first, then earlier lessons'
 * items, most recent first — recent material is what a child most needs to
 * tell apart.
 */
function distractorPool<T>(lesson: Lesson, own: T[], itemsOf: (l: Lesson) => T[]): T[] {
  const prior = earlierLessons(lesson).reverse().flatMap(itemsOf);
  return [...new Set([...own, ...prior])];
}

function choicesFor<T>(target: T, pool: T[], count: number, rng: Rng): T[] {
  // Take distractors mostly from the front of the pool, with a little randomness.
  const others = pool.filter((p) => p !== target);
  const near = shuffle(others.slice(0, count + 2), rng).slice(0, count - 1);
  return shuffle([target, ...near], rng);
}

const letterItems = (l: Lesson) => (l.kind === 'letters' ? l.items.map(getLetter) : []);
const wordItems = (l: Lesson) => (l.kind === 'words' ? l.words.map(getWord) : []);

function letterPlan(lesson: Lesson & { kind: 'letters' }, rng: Rng): Step[] {
  const letters = lesson.items.map(getLetter);
  const pool = distractorPool(lesson, letters, letterItems);
  const steps: Step[] = [];

  for (const letter of letters) {
    steps.push({ type: 'meet', letter }, { type: 'trace', letter });
  }
  for (const target of shuffle(letters, rng)) {
    steps.push({ type: 'find', target, choices: choicesFor(target, pool, 3, rng) });
  }
  const popTarget = letters[Math.floor(rng() * letters.length)];
  const fillers = pool.filter((l) => l !== popTarget).slice(0, 4);
  const bubbles = Array.from({ length: 9 }, (_, i) => (i < 4 || fillers.length === 0 ? popTarget : fillers[i % fillers.length]));
  steps.push({ type: 'pop', target: popTarget, bubbles: shuffle(bubbles, rng) });
  return steps;
}

function wordPlan(lesson: Lesson & { kind: 'words' }, rng: Rng): Step[] {
  const words = shuffle(lesson.words.map(getWord), rng);
  const pool = distractorPool(lesson, words, wordItems);
  const steps: Step[] = [];

  for (const word of words.slice(0, 4)) steps.push({ type: 'blend', word });

  const rest = [...words.slice(4), ...words.slice(0, 4)];
  const [m1, m2, l1, l2] = rest;
  for (const word of [m1, m2]) steps.push({ type: 'match', word, choices: choicesFor(word, pool, 3, rng) });
  for (const word of [l1, l2]) steps.push({ type: 'listen', word, choices: choicesFor(word, pool, 3, rng) });

  const buildable = shuffle(words.filter((w) => w.tiles.length >= 2 && w.tiles.length <= 4), rng);
  for (const word of buildable.slice(0, 2)) {
    steps.push({ type: 'build', word, tiles: shuffleUntilDifferent(word.tiles, rng) });
  }
  return steps;
}

function shuffleUntilDifferent(tiles: string[], rng: Rng): string[] {
  for (let i = 0; i < 10; i++) {
    const s = shuffle(tiles, rng);
    if (s.some((t, j) => t !== tiles[j])) return s;
  }
  return [...tiles].reverse();
}

export function buildPlan(lesson: Lesson, rng: Rng = Math.random): Step[] {
  return lesson.kind === 'letters' ? letterPlan(lesson, rng) : wordPlan(lesson, rng);
}

/** 3 stars for at most one slip, 2 for a few, otherwise 1 — finishing always earns a star. */
export function starsFor(mistakes: number): number {
  if (mistakes <= 1) return 3;
  if (mistakes <= 4) return 2;
  return 1;
}
